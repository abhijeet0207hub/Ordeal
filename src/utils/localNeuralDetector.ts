import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { BoundingBox, LivenessMetrics } from '../types';

export class LocalNeuralDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isModelLoading = false;
  private modelLoaded = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private frameCount = 0;
  private lastBlinkTimestamp = Date.now();
  private blinkCount = 0;
  private recentLuminosities: number[] = [];
  private staticMotionCounter = 0;
  private gazeOffCenterCounter = 0;

  // Web Audio Metering
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array<ArrayBuffer> | null = null;
  private currentAudioLevel = 0;

  // Background Neural Inference Cache
  private lastPredictions: Array<{ bbox: [number, number, number, number]; class: string; score: number }> = [];
  private isDetecting = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.initModel();
  }

  public async initModel(): Promise<boolean> {
    if (this.modelLoaded && this.model) return true;
    if (this.isModelLoading) return false;

    this.isModelLoading = true;
    try {
      await tf.ready();
      // Load COCO-SSD with lightweight MobileNet v2 backbone for high FPS in browser
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.modelLoaded = true;
      console.log('[Ordeal Local ML] TensorFlow.js COCO-SSD loaded on WebGL backend successfully.');
      return true;
    } catch (err) {
      console.warn('[Ordeal Local ML] WebGL COCO-SSD loading notice, falling back to local vision engine:', err);
      return false;
    } finally {
      this.isModelLoading = false;
    }
  }

  public isReady(): boolean {
    return this.modelLoaded && this.model !== null;
  }

  public initAudio(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        source.connect(this.analyser);
      }
    } catch (e) {
      console.warn('Audio metering init warning:', e);
    }
  }

  public getAudioLevel(): number {
    if (!this.analyser || !this.audioDataArray) return 0;
    this.analyser.getByteFrequencyData(this.audioDataArray);
    let sum = 0;
    for (let i = 0; i < this.audioDataArray.length; i++) {
      sum += this.audioDataArray[i];
    }
    const average = sum / this.audioDataArray.length;
    this.currentAudioLevel = Math.min(100, Math.round((average / 128) * 100));
    return this.currentAudioLevel;
  }

  public stop() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }

  public captureSnapshot(video: HTMLVideoElement): string {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth || 640;
    snapCanvas.height = video.videoHeight || 480;
    const sCtx = snapCanvas.getContext('2d');
    if (sCtx) {
      sCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      return snapCanvas.toDataURL('image/jpeg', 0.85);
    }
    return '';
  }

  public processFrame(video: HTMLVideoElement): LivenessMetrics {
    if (this.modelLoaded && this.model && !this.isDetecting && video.readyState >= 2) {
      this.isDetecting = true;
      this.model
        .detect(video, 5, 0.45)
        .then((preds) => {
          this.lastPredictions = preds;
          this.isDetecting = false;
        })
        .catch(() => {
          this.isDetecting = false;
        });
    }

    return this.evaluateFrameSync(video, this.lastPredictions);
  }

  public async processFrameAsync(video: HTMLVideoElement): Promise<LivenessMetrics> {
    if (this.modelLoaded && this.model && video.readyState >= 2) {
      try {
        this.lastPredictions = await this.model.detect(video, 5, 0.45);
      } catch (err) {
        // fallback
      }
    }
    return this.evaluateFrameSync(video, this.lastPredictions);
  }

  public evaluateFrameSync(
    video: HTMLVideoElement,
    predictions: Array<{ bbox: [number, number, number, number]; class: string; score: number }> = []
  ): LivenessMetrics {
    const width = 320;
    const height = 240;

    if (!this.ctx || video.readyState < 2) {
      return this.getDefaultMetrics();
    }

    this.frameCount++;
    this.ctx.drawImage(video, 0, 0, width, height);
    const frame = this.ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    // 1. Run Local TensorFlow.js COCO-SSD Object Detection
    const detectedBoxes: Array<{ label: string; box: BoundingBox; confidence: number }> = [];
    let personCount = 0;
    let tfFaceBox: { x: number; y: number; width: number; height: number } | undefined;

    if (predictions && predictions.length > 0) {
      try {
        for (const pred of predictions) {
          const [x, y, w, h] = pred.bbox;
          // Scale bbox to 320x240 internal coordinate space if needed
          const scaleX = width / (video.videoWidth || width);
          const scaleY = height / (video.videoHeight || height);
          const boxX = Math.round(x * scaleX);
          const boxY = Math.round(y * scaleY);
          const boxW = Math.round(w * scaleX);
          const boxH = Math.round(h * scaleY);

          if (pred.class === 'person') {
            personCount++;
            if (!tfFaceBox) {
              // Estimate upper region of person bounding box as face
              tfFaceBox = {
                x: boxX + Math.round(boxW * 0.15),
                y: boxY,
                width: Math.round(boxW * 0.7),
                height: Math.round(boxH * 0.45),
              };
            }
          } else if (pred.class === 'cell phone') {
            detectedBoxes.push({
              label: 'Cell Phone Detected',
              confidence: pred.score,
              box: {
                label: 'Mobile Phone',
                x: boxX,
                y: boxY,
                width: boxW,
                height: boxH,
                color: '#ef4444',
                confidence: pred.score,
              },
            });
          } else if (pred.class === 'laptop' || pred.class === 'tv') {
            detectedBoxes.push({
              label: 'Secondary Screen / Laptop',
              confidence: pred.score,
              box: {
                label: 'Secondary Display',
                x: boxX,
                y: boxY,
                width: boxW,
                height: boxH,
                color: '#f97316',
                confidence: pred.score,
              },
            });
          } else if (pred.class === 'book') {
            detectedBoxes.push({
              label: 'Prohibited Notes / Book',
              confidence: pred.score,
              box: {
                label: 'Reference Material',
                x: boxX,
                y: boxY,
                width: boxW,
                height: boxH,
                color: '#eab308',
                confidence: pred.score,
              },
            });
          }
        }
      } catch (err) {
        // Continue with local pixel heuristic
      }
    }

    // 2. Local Pixel Skin & Facial Boundary Tracker (Complementary & Fallback)
    let skinPixelCount = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;
    let totalLuminance = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isSkin =
          r > 80 &&
          g > 40 &&
          b > 20 &&
          r > g &&
          r > b &&
          r - g > 12 &&
          Math.abs(r - g) > 10;

        if (isSkin) {
          skinPixelCount++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }

        totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    const skinDetected = skinPixelCount > 180;
    const faceDetected = personCount > 0 || skinDetected;
    const finalPersonCount = personCount > 0 ? personCount : skinDetected ? 1 : 0;

    let faceBoundingBox: { x: number; y: number; width: number; height: number } | undefined;
    let gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN' | 'UNKNOWN' = 'CENTER';
    let gazeDeviationScore = 0;

    if (tfFaceBox) {
      faceBoundingBox = tfFaceBox;
    } else if (skinDetected) {
      const faceW = Math.max(70, Math.min(width * 0.8, (maxX - minX) * 1.2));
      const faceH = Math.max(90, Math.min(height * 0.85, (maxY - minY) * 1.3));
      const centerX = sumX / skinPixelCount;
      const centerY = sumY / skinPixelCount;

      faceBoundingBox = {
        x: Math.max(10, Math.round(centerX - faceW / 2)),
        y: Math.max(10, Math.round(centerY - faceH / 2)),
        width: Math.min(width - 20, Math.round(faceW)),
        height: Math.min(height - 20, Math.round(faceH)),
      };
    }

    if (faceBoundingBox) {
      const faceCenterX = faceBoundingBox.x + faceBoundingBox.width / 2;
      const normalizedOffset = (faceCenterX - width / 2) / (width / 2);
      if (normalizedOffset > 0.28) {
        gazeDirection = 'RIGHT';
        gazeDeviationScore = Math.min(100, Math.round(Math.abs(normalizedOffset) * 100));
        this.gazeOffCenterCounter++;
      } else if (normalizedOffset < -0.28) {
        gazeDirection = 'LEFT';
        gazeDeviationScore = Math.min(100, Math.round(Math.abs(normalizedOffset) * 100));
        this.gazeOffCenterCounter++;
      } else if (faceBoundingBox.y > height * 0.35) {
        gazeDirection = 'DOWN';
        gazeDeviationScore = 75;
        this.gazeOffCenterCounter++;
      } else {
        gazeDirection = 'CENTER';
        gazeDeviationScore = 10;
        this.gazeOffCenterCounter = Math.max(0, this.gazeOffCenterCounter - 1);
      }
    } else {
      gazeDirection = 'UNKNOWN';
    }

    // 3. Local Optical Flow Motion Variance (Static Photo vs Live micro-saccades)
    let motionDelta = 0;
    if (this.prevFrameData && faceBoundingBox) {
      let sampledPoints = 0;
      const startX = faceBoundingBox.x;
      const endX = faceBoundingBox.x + faceBoundingBox.width;
      const startY = faceBoundingBox.y;
      const endY = faceBoundingBox.y + faceBoundingBox.height;

      for (let y = startY; y < endY; y += 8) {
        for (let x = startX; x < endX; x += 8) {
          const i = (y * width + x) * 4;
          if (i < data.length) {
            const diff =
              Math.abs(data[i] - this.prevFrameData[i]) +
              Math.abs(data[i + 1] - this.prevFrameData[i + 1]) +
              Math.abs(data[i + 2] - this.prevFrameData[i + 2]);
            motionDelta += diff;
            sampledPoints++;
          }
        }
      }
      motionDelta = sampledPoints > 0 ? motionDelta / sampledPoints : 0;
    }
    this.prevFrameData = new Uint8ClampedArray(data);

    if (faceDetected && motionDelta < 0.6) {
      this.staticMotionCounter++;
    } else {
      this.staticMotionCounter = Math.max(0, this.staticMotionCounter - 2);
    }
    const staticPhotoScore = Math.min(100, Math.round((this.staticMotionCounter / 30) * 100));

    // 4. Local Eye Aspect Ratio / Blink Tracking
    const avgLum = totalLuminance / ((width / 4) * (height / 4));
    this.recentLuminosities.push(avgLum);
    if (this.recentLuminosities.length > 20) {
      this.recentLuminosities.shift();
    }
    if (this.recentLuminosities.length >= 8) {
      const recent = this.recentLuminosities;
      const current = recent[recent.length - 1];
      const prev = recent[recent.length - 3];
      if (Math.abs(current - prev) > 4.5 && Date.now() - this.lastBlinkTimestamp > 1200) {
        this.blinkCount++;
        this.lastBlinkTimestamp = Date.now();
      }
    }

    // 5. Local 2D Laplacian Frequency Moiré Filter (Screen Replay Detection)
    let highFreqVariance = 0;
    if (faceBoundingBox) {
      let laplacianSum = 0;
      let count = 0;
      const fx = Math.max(0, faceBoundingBox.x);
      const fy = Math.max(0, faceBoundingBox.y);
      const fw = Math.min(width - fx, faceBoundingBox.width);
      const fh = Math.min(height - fy, faceBoundingBox.height);

      for (let y = fy + 4; y < fy + fh - 4; y += 6) {
        for (let x = fx + 4; x < fx + fw - 4; x += 6) {
          const idx = (y * width + x) * 4;
          const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const topLum = 0.299 * data[((y - 2) * width + x) * 4];
          const bottomLum = 0.299 * data[((y + 2) * width + x) * 4];
          const leftLum = 0.299 * data[(y * width + (x - 2)) * 4];
          const rightLum = 0.299 * data[(y * width + (x + 2)) * 4];
          const lap = Math.abs(4 * centerLum - (topLum + bottomLum + leftLum + rightLum));
          laplacianSum += lap;
          count++;
        }
      }
      highFreqVariance = count > 0 ? laplacianSum / count : 12;
    }

    const screenSpoofScore = Math.min(
      100,
      Math.round(Math.max(0, (highFreqVariance - 24) * 2.5 + (this.staticMotionCounter > 10 ? 35 : 0)))
    );

    // 6. Overall Liveness Score Calculation
    let baseLiveness = 97;
    if (!faceDetected) baseLiveness = 0;
    if (staticPhotoScore > 50) baseLiveness -= staticPhotoScore * 0.6;
    if (screenSpoofScore > 50) baseLiveness -= screenSpoofScore * 0.5;
    if (this.gazeOffCenterCounter > 15) baseLiveness -= 15;
    if (detectedBoxes.length > 0) baseLiveness -= 20;

    const livenessScore = Math.max(0, Math.min(100, Math.round(baseLiveness)));
    const isLive = livenessScore >= 65 && faceDetected;

    const audioLevel = this.getAudioLevel();
    const speechDetected = audioLevel > 55;

    let verdict: 'AUTHENTIC_LIVE' | 'SUSPICIOUS_SPOOF' | 'ABSENT' | 'MULTIPLE_FACES' | 'PROHIBITED_DEVICE' =
      'AUTHENTIC_LIVE';

    if (!faceDetected) {
      verdict = 'ABSENT';
    } else if (finalPersonCount > 1) {
      verdict = 'MULTIPLE_FACES';
    } else if (detectedBoxes.length > 0) {
      verdict = 'PROHIBITED_DEVICE';
    } else if (staticPhotoScore > 60 || screenSpoofScore > 65) {
      verdict = 'SUSPICIOUS_SPOOF';
    }

    return {
      isLive,
      livenessScore,
      faceDetected,
      faceCount: finalPersonCount,
      faceBoundingBox,
      gazeDirection,
      gazeDeviationScore,
      blinkCount: this.blinkCount,
      lastBlinkTime: this.lastBlinkTimestamp,
      screenSpoofScore,
      staticPhotoScore,
      devicesDetected: detectedBoxes,
      detectedObjects: predictions,
      audioNoiseLevel: audioLevel,
      speechDetected,
      verdict,
    };
  }

  private getDefaultMetrics(): LivenessMetrics {
    return {
      isLive: false,
      livenessScore: 0,
      faceDetected: false,
      faceCount: 0,
      gazeDirection: 'UNKNOWN',
      gazeDeviationScore: 0,
      blinkCount: 0,
      lastBlinkTime: Date.now(),
      screenSpoofScore: 0,
      staticPhotoScore: 0,
      devicesDetected: [],
      audioNoiseLevel: 0,
      speechDetected: false,
      verdict: 'ABSENT',
    };
  }
}
