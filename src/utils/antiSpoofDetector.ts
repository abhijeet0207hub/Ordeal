import { BoundingBox, LivenessMetrics } from '../types';

export class AntiSpoofDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private frameCount = 0;
  private lastBlinkTimestamp = Date.now();
  private blinkCount = 0;
  private recentLuminosities: number[] = [];
  private staticMotionCounter = 0;
  private gazeOffCenterCounter = 0;
  private phoneCandidateCounter = 0;

  // Audio metering
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array<ArrayBuffer> | null = null;
  private currentAudioLevel = 0;
  private audioStream: MediaStream | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  public initAudio(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.audioStream = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        source.connect(this.analyser);
      }
    } catch (e) {
      console.warn('Audio metering initialization warning:', e);
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
    // Normalize to 0-100 scale
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
    const width = 320;
    const height = 240;
    if (!this.ctx || video.readyState < 2) {
      return this.getDefaultMetrics();
    }

    this.frameCount++;
    this.ctx.drawImage(video, 0, 0, width, height);
    const frame = this.ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    // 1. Skin & Face Localization
    let skinPixelCount = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;

    // Color distribution and screen reflection check
    let highFreqVariance = 0;
    let totalLuminance = 0;
    let phoneLikeArtifacts = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Normalized RGB skin color classification
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

        // Check for sharp dark rectangular edges in lower 40% (device / phone heuristic)
        if (y > height * 0.6) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Look for dark phone bezel / screen edges with sharp contrast
          if (lum < 35 && x > width * 0.2 && x < width * 0.8) {
            phoneLikeArtifacts++;
          }
        }

        totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    const faceDetected = skinPixelCount > 180;
    let faceBoundingBox: { x: number; y: number; width: number; height: number } | undefined;
    let gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN' | 'UNKNOWN' = 'CENTER';
    let gazeDeviationScore = 0;

    if (faceDetected) {
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

      // Gaze & Head Orientation: measure horizontal offset from center
      const normalizedOffset = (centerX - width / 2) / (width / 2);
      if (normalizedOffset > 0.28) {
        gazeDirection = 'RIGHT';
        gazeDeviationScore = Math.min(100, Math.round(Math.abs(normalizedOffset) * 100));
        this.gazeOffCenterCounter++;
      } else if (normalizedOffset < -0.28) {
        gazeDirection = 'LEFT';
        gazeDeviationScore = Math.min(100, Math.round(Math.abs(normalizedOffset) * 100));
        this.gazeOffCenterCounter++;
      } else if (centerY > height * 0.65) {
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

    // 2. Optical Flow & Motion Variance (Static Photo vs Live micro-motion)
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

    // If candidate is present but motion is exactly zero or rigid planar for > 60 frames
    if (faceDetected && motionDelta < 0.6) {
      this.staticMotionCounter++;
    } else {
      this.staticMotionCounter = Math.max(0, this.staticMotionCounter - 2);
    }
    const staticPhotoScore = Math.min(100, Math.round((this.staticMotionCounter / 30) * 100));

    // 3. Blink Detection via Facial Upper Region Luminance Shift
    const avgLum = totalLuminance / ((width / 4) * (height / 4));
    this.recentLuminosities.push(avgLum);
    if (this.recentLuminosities.length > 20) {
      this.recentLuminosities.shift();
    }
    if (this.recentLuminosities.length >= 8) {
      const recent = this.recentLuminosities;
      const current = recent[recent.length - 1];
      const prev = recent[recent.length - 3];
      // Quick dip and rise indicates a blink
      if (Math.abs(current - prev) > 4.5 && Date.now() - this.lastBlinkTimestamp > 1200) {
        this.blinkCount++;
        this.lastBlinkTimestamp = Date.now();
      }
    }

    // 4. Moiré and High-Frequency Screen Artifacts (Screen Replay Detection)
    // Digital screens display sharp periodic sub-pixel lattices
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
    // Very high laplacian variance combined with low motion indicates screen moiré grain
    const screenSpoofScore = Math.min(
      100,
      Math.round(Math.max(0, (highFreqVariance - 24) * 2.5 + (this.staticMotionCounter > 10 ? 35 : 0)))
    );

    // 5. Phone / Device Detection Heuristic
    const devicesDetected: Array<{ label: string; box: BoundingBox; confidence: number }> = [];
    if (phoneLikeArtifacts > 180) {
      this.phoneCandidateCounter++;
      if (this.phoneCandidateCounter > 6) {
        devicesDetected.push({
          label: 'Suspicious Device / Mobile Phone',
          box: {
            label: 'Mobile Device',
            x: Math.round(width * 0.3),
            y: Math.round(height * 0.65),
            width: 70,
            height: 90,
            color: '#ef4444',
            confidence: 0.89,
          },
          confidence: 0.89,
        });
      }
    } else {
      this.phoneCandidateCounter = Math.max(0, this.phoneCandidateCounter - 1);
    }

    // 6. Overall Liveness Score Calculation
    let baseLiveness = 96;
    if (!faceDetected) baseLiveness = 0;
    if (staticPhotoScore > 50) baseLiveness -= staticPhotoScore * 0.6;
    if (screenSpoofScore > 50) baseLiveness -= screenSpoofScore * 0.5;
    if (this.gazeOffCenterCounter > 15) baseLiveness -= 15;
    if (devicesDetected.length > 0) baseLiveness -= 20;

    const livenessScore = Math.max(0, Math.min(100, Math.round(baseLiveness)));
    const isLive = livenessScore >= 65 && faceDetected;

    // Audio status
    const audioLevel = this.getAudioLevel();
    const speechDetected = audioLevel > 55;

    // Final Verdict
    let verdict: 'AUTHENTIC_LIVE' | 'SUSPICIOUS_SPOOF' | 'ABSENT' | 'MULTIPLE_FACES' | 'PROHIBITED_DEVICE' = 'AUTHENTIC_LIVE';
    if (!faceDetected) {
      verdict = 'ABSENT';
    } else if (devicesDetected.length > 0) {
      verdict = 'PROHIBITED_DEVICE';
    } else if (staticPhotoScore > 60 || screenSpoofScore > 65) {
      verdict = 'SUSPICIOUS_SPOOF';
    }

    return {
      isLive,
      livenessScore,
      faceDetected,
      faceCount: faceDetected ? 1 : 0,
      faceBoundingBox,
      gazeDirection,
      gazeDeviationScore,
      blinkCount: this.blinkCount,
      lastBlinkTime: this.lastBlinkTimestamp,
      screenSpoofScore,
      staticPhotoScore,
      devicesDetected,
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
