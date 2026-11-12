import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Volume2,
  Eye,
  Camera,
  FileCheck,
  Shuffle,
  Cpu,
  EyeOff,
} from 'lucide-react';
import { Exam, StudentSession, ViolationRecord, BoundingBox, GlassTheme, SignalSource } from '../types';
import { LocalNeuralDetector } from '../utils/localNeuralDetector';
import { GLASS_THEMES } from '../utils/theme';
import { StudentReportCard } from './StudentReportCard';
import { mapDisplayedAnswersToCanonical } from '../utils/shuffle';

interface ExamRoomProps {
  exam: Exam;
  session: StudentSession;
  onExitExam: () => void;
  onViolationOccurred?: (v: ViolationRecord) => void;
  onSessionSubmitted?: (s: StudentSession) => void;
  currentTheme: GlassTheme;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  session: initialSession,
  onExitExam,
  onViolationOccurred,
  onSessionSubmitted,
  currentTheme,
}) => {
  const [session, setSession] = useState<StudentSession>(initialSession);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(session.answers || {});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const theme = GLASS_THEMES[currentTheme];
  const isNonCameraMode = session.accommodationMode === 'NON_CAMERA_ACCESSIBLE';

  // Local Neural Detector state (TensorFlow.js + Canvas Heuristics)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector] = useState(() => new LocalNeuralDetector());
  const [livenessScore, setLivenessScore] = useState(96);
  const [gazeStatus, setGazeStatus] = useState<string>('CENTER');
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastWarningMsg, setLastWarningMsg] = useState<string | null>(null);
  const [hudBoundingBoxes, setHudBoundingBoxes] = useState<BoundingBox[]>([]);
  const [tfModelReady, setTfModelReady] = useState(false);
  const [isLocalScanning, setIsLocalScanning] = useState(false);

  const absenceCounter = useRef(0);
  const phoneCounter = useRef(0);
  const gazeAwayCounter = useRef(0);
  const multiPersonCounter = useRef(0);
  const lastViolationTime = useRef(0);

  useEffect(() => {
    if (isNonCameraMode) return;

    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      })
      .then((s) => {
        stream = s;
        detector.initAudio(s);
        detector.initModel().then((loaded) => setTfModelReady(loaded));
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => console.warn('Webcam stream in exam hall:', err));

    return () => {
      detector.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isNonCameraMode]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, timeRemaining]);

  // Tab Switch & Visibility Change Detection (Browser Event Signal)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        logViolation(
          'TAB_SWITCH_ATTACK',
          'WARNING',
          1.0,
          'BROWSER_VISIBILITY_EVENT',
          'Candidate switched away from exam tab or minimized window.',
          'Page Visibility API reported document.hidden state.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmitted) {
        logViolation(
          'TAB_SWITCH_ATTACK',
          'WARNING',
          0.95,
          'BROWSER_VISIBILITY_EVENT',
          'Browser window focus lost.',
          'Window blur event recorded; queued for proctor review.'
        );
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isSubmitted]);

  // Real-time Local ML & Heuristic Monitoring Loop (Skipped in Non-Camera Accessible Mode)
  useEffect(() => {
    if (isSubmitted || isNonCameraMode || !videoRef.current) return;

    let isProcessing = false;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isProcessing) return;

      isProcessing = true;
      try {
        const metrics = await detector.processFrameAsync(videoRef.current);
        setLivenessScore(metrics.livenessScore);
        setGazeStatus(metrics.gazeDirection);
        setAudioLevel(metrics.audioNoiseLevel);

        const boxes: BoundingBox[] = [];
        if (metrics.faceBoundingBox) {
          boxes.push({
            label: metrics.isLive ? `${session.studentName} (Face Box)` : 'Heuristic Flag',
            x: metrics.faceBoundingBox.x,
            y: metrics.faceBoundingBox.y,
            width: metrics.faceBoundingBox.width,
            height: metrics.faceBoundingBox.height,
            color: metrics.isLive ? '#10b981' : '#f43f5e',
          });
        }

        metrics.devicesDetected.forEach((d) => {
          boxes.push(d.box);
        });
        setHudBoundingBoxes(boxes);

        const now = Date.now();
        if (now - lastViolationTime.current < 7000) return;

        // 1. TensorFlow COCO-SSD Phone Detection
        if (metrics.devicesDetected.some((d) => d.box.label === 'Mobile Phone')) {
          phoneCounter.current++;
          if (phoneCounter.current >= 2) {
            phoneCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'MOBILE_PHONE_DETECTED',
              'CRITICAL',
              0.94,
              'TFJS_OBJECT_DETECTOR',
              'Mobile phone object class detected by TensorFlow.js COCO-SSD.',
              'COCO-SSD MobileNet v2 inference reported cell phone bounding box.',
              boxes
            );
          }
        } else {
          phoneCounter.current = Math.max(0, phoneCounter.current - 1);
        }

        // 2. TensorFlow COCO-SSD Multiple Persons Detection
        if (metrics.faceCount > 1) {
          multiPersonCounter.current++;
          if (multiPersonCounter.current >= 2) {
            multiPersonCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'MULTIPLE_FACES_DETECTED',
              'CRITICAL',
              0.93,
              'TFJS_OBJECT_DETECTOR',
              `Multiple person bounding boxes (${metrics.faceCount}) detected in frame.`,
              'TensorFlow.js COCO-SSD reported multiple person instances.',
              boxes
            );
          }
        } else {
          multiPersonCounter.current = Math.max(0, multiPersonCounter.current - 1);
        }

        // 3. Candidate Absence Heuristic Check
        if (!metrics.faceDetected) {
          absenceCounter.current++;
          if (absenceCounter.current >= 4) {
            absenceCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'FACE_NOT_FOUND',
              'WARNING',
              0.88,
              'PIXEL_AUDIO_HEURISTIC',
              'No face bounding box detected in frame.',
              'Absence indicator triggered for > 4.5 seconds; logged for human review.'
            );
          }
        } else {
          absenceCounter.current = 0;
        }

        // 4. Gaze Position Heuristic Check
        if (
          metrics.gazeDirection === 'LEFT' ||
          metrics.gazeDirection === 'RIGHT' ||
          metrics.gazeDirection === 'DOWN'
        ) {
          gazeAwayCounter.current++;
          if (gazeAwayCounter.current >= 5) {
            gazeAwayCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'SUSPICIOUS_GAZE_DEVIATION',
              'WARNING',
              0.85,
              'PIXEL_AUDIO_HEURISTIC',
              `Position heuristic offset (${metrics.gazeDirection}).`,
              'Bounding-box centroid offset exceeded threshold; logged for human review.'
            );
          }
        } else {
          gazeAwayCounter.current = Math.max(0, gazeAwayCounter.current - 1);
        }

        // 5. Pixel Frame-Difference & Contrast Heuristics
        if (metrics.staticPhotoScore > 75) {
          lastViolationTime.current = now;
          logViolation(
            'SPOOF_PHOTO_ATTACK',
            'CRITICAL',
            0.91,
            'PIXEL_AUDIO_HEURISTIC',
            'Static frame-difference heuristic threshold exceeded.',
            'Low frame-to-frame pixel variance indicator; requires human proctor verification.'
          );
        } else if (metrics.screenSpoofScore > 80) {
          lastViolationTime.current = now;
          logViolation(
            'SCREEN_REPLAY_ATTACK',
            'CRITICAL',
            0.89,
            'PIXEL_AUDIO_HEURISTIC',
            'Local contrast heuristic threshold exceeded.',
            'High-frequency local contrast indicator; requires human proctor verification.'
          );
        }
      } catch (err) {
        // Continue loop
      } finally {
        isProcessing = false;
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isSubmitted, isNonCameraMode]);

  const logViolation = async (
    type: ViolationRecord['violationType'],
    severity: ViolationRecord['severity'],
    confidence: number,
    signalSource: SignalSource,
    details: string,
    forensic: string,
    boxes?: BoundingBox[]
  ) => {
    let snapshot = '';
    if (!isNonCameraMode && videoRef.current) {
      snapshot = detector.captureSnapshot(videoRef.current);
    }

    setLastWarningMsg(`Indicator Logged (${signalSource}): ${details}`);
    setTimeout(() => setLastWarningMsg(null), 5000);

    try {
      const res = await fetch('/api/violations/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          studentId: session.studentId,
          studentName: session.studentName || 'Abhijeet Singh',
          examId: exam.id,
          violationType: type,
          severity,
          confidence,
          signalSource,
          snapshotUrl: snapshot,
          boundingBoxes: boxes || hudBoundingBoxes,
          details,
          aiForensicAnalysis: `[Signal: ${signalSource}] ${forensic}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.violation) {
        if (data.session) {
          setSession(data.session);
        }
        if (onViolationOccurred) {
          onViolationOccurred(data.violation);
        }
      }
    } catch (err) {
      console.warn('Violation log error:', err);
    }
  };

  const handleSubmitExam = async () => {
    setShowSubmitModal(false);
    // Translate displayed answers into canonical unshuffled option indices (P0 Correctness Fix)
    const { canonicalAnswers, presentedOptionOrder } = mapDisplayedAnswersToCanonical(exam, answers);

    try {
      const res = await fetch('/api/sessions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answers,
          canonicalAnswers,
          presentedOptionOrder,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        const updatedSession: StudentSession = {
          ...data.session,
          answers,
          canonicalAnswers,
          presentedOptionOrder,
        };
        setSession(updatedSession);
        if (onSessionSubmitted) {
          onSessionSubmitted(updatedSession);
        }
      } else {
        // Compute local canonical fallback if offline
        let totalScore = 0;
        let earnedScore = 0;
        exam.questions.forEach((q) => {
          totalScore += q.points;
          const canonCorrect =
            typeof q.canonicalCorrectAnswer === 'number' ? q.canonicalCorrectAnswer : q.correctAnswer;
          if (canonicalAnswers[q.id] === canonCorrect) {
            earnedScore += q.points;
          }
        });
        const localCompleted: StudentSession = {
          ...session,
          submittedAt: new Date().toISOString(),
          status: 'SUBMITTED',
          answers,
          canonicalAnswers,
          presentedOptionOrder,
          score: earnedScore,
          totalScore,
        };
        setSession(localCompleted);
        if (onSessionSubmitted) {
          onSessionSubmitted(localCompleted);
        }
      }
    } catch (e) {
      console.warn('Submit exam error:', e);
    }
    setIsSubmitted(true);
  };

  const handlePerformLocalNeuralScan = async () => {
    if (!videoRef.current || isLocalScanning || isNonCameraMode) return;
    setIsLocalScanning(true);
    try {
      const m = await detector.processFrameAsync(videoRef.current);
      setLastWarningMsg(
        `Frame Indicator Check: ${
          m.faceDetected ? 'Face Box Detected' : 'No Face Box'
        } (${m.livenessScore}% heuristic score · COCO-SSD)`
      );
      setTimeout(() => setLastWarningMsg(null), 4000);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLocalScanning(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const currentQ = exam.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  if (isSubmitted) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <StudentReportCard
          session={session}
          exam={exam}
          onExitExam={onExitExam}
          currentTheme={currentTheme}
          isModal={false}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Warning Toast */}
      {lastWarningMsg && (
        <div className="p-3 bg-amber-600/90 text-white rounded-2xl shadow-2xl flex items-center justify-between border border-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span>{lastWarningMsg}</span>
          </div>
          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono">
            Queued for Proctor Review
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div
        className={`rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-xs">
            {exam.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">{exam.title}</h1>
              {exam.securitySettings?.randomizeQuestionsAndOptions && (
                <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                  · <Shuffle className="w-3 h-3" /> Canonical Option Mapping
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Candidate: <span className="text-slate-200 font-medium">{session.studentName}</span> · Roll No.{' '}
              <span className="font-mono tabular-nums">{session.rollNumber || session.studentId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                session.violationCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            />
            <span className="text-slate-400 text-[11px]">Flags for Review:</span>
            <span
              className={`font-mono font-bold text-xs tabular-nums ${
                session.violationCount > 0 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {session.violationCount} / {exam.maxViolationsAllowed}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs tabular-nums ${
              timeRemaining < 300
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-black/40 border-white/10 text-emerald-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className={`px-4 py-2 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 ${theme.accentBtn}`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Question Paper */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-xl space-y-5`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono tabular-nums">
                  Question {currentQuestionIndex + 1} of {exam.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  · {currentQ?.points ?? 10} Points · ID: {currentQ?.id}
                </span>
              </div>

              {currentQ && (
                <button
                  onClick={() =>
                    setFlaggedQuestions((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'text-slate-400 border-white/10 hover:bg-white/5'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}
                  </span>
                </button>
              )}
            </div>

            <p className="text-base text-slate-100 font-medium leading-relaxed">
              {currentQ?.question}
            </p>

            {currentQ?.codeSnippet && (
              <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}

            <div className="space-y-3 pt-2">
              {currentQ?.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                const canonicalIdx = currentQ.optionIndexMap
                  ? currentQ.optionIndexMap[idx]
                  : idx;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: idx,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                        : 'bg-black/20 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-extrabold'
                            : 'border-white/20 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="leading-snug">{opt}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-1">
                      opt-{canonicalIdx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-white/10">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="text-xs text-slate-400 tabular-nums">
                Answered <span className="text-emerald-400 font-bold">{answeredCount}</span> of{' '}
                {exam.questions.length}
              </div>

              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))
                }
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 shadow-lg`}
          >
            <h3 className="text-xs font-bold text-slate-300 mb-3">Question Navigator</h3>
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono tabular-nums transition-all relative flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-emerald-400 bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                        : isAnswered
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-black/30 text-slate-400 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-900"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Monitoring Indicators Panel */}
        <div className="space-y-4">
          <div
            className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 shadow-xl space-y-4`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                {isNonCameraMode ? (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Camera className="w-4 h-4 text-emerald-400" />
                )}
                {isNonCameraMode ? 'Accessible Session Monitor' : 'Browser Monitoring HUD'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {isNonCameraMode
                  ? 'Non-Camera Accommodation'
                  : tfModelReady
                  ? 'COCO-SSD Ready'
                  : 'Heuristic Mode'}
              </span>
            </div>

            {isNonCameraMode ? (
              <div className="rounded-2xl bg-slate-950/90 aspect-[4/3] border border-amber-500/30 p-5 flex flex-col items-center justify-center text-center space-y-2">
                <EyeOff className="w-8 h-8 text-amber-400" />
                <p className="text-xs font-bold text-white">
                  Non-Camera Accessibility Accommodation
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Camera and audio sensors are disabled per candidate accommodation. Only exam timer and tab visibility events are active.
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] border border-white/15 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {hudBoundingBoxes.map((box, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(box.x / 320) * 100}%`,
                      top: `${(box.y / 240) * 100}%`,
                      width: `${(box.width / 320) * 100}%`,
                      height: `${(box.height / 240) * 100}%`,
                      borderColor: box.color || '#10b981',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      style={{ backgroundColor: box.color || '#10b981' }}
                      className="text-[9px] font-bold text-slate-950 px-1 py-0.2 rounded-sm absolute -top-4 left-0 uppercase font-mono"
                    >
                      {box.label}
                    </span>
                  </div>
                ))}

                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-emerald-400">Heuristic Score: {livenessScore}%</span>
                  <span className="text-slate-300">Box Pos: {gazeStatus}</span>
                </div>
              </div>
            )}

            {/* Signal Provenance Indicators */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Object Detector
                </span>
                <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                  {isNonCameraMode ? 'Bypassed' : 'TF.js COCO-SSD'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Position Heuristic
                </span>
                <span
                  className={`font-mono font-semibold ${
                    gazeStatus === 'CENTER' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isNonCameraMode ? 'N/A' : gazeStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Audio Level Heuristic
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all ${
                        audioLevel > 50 ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${isNonCameraMode ? 0 : Math.min(100, audioLevel * 1.5)}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-slate-300 text-[10px] tabular-nums">
                    {isNonCameraMode ? 'Muted' : `${audioLevel} lvl`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  Visibility Listener
                </span>
                <span className="font-mono text-emerald-400 font-semibold">ACTIVE</span>
              </div>
            </div>

            {!isNonCameraMode && (
              <button
                onClick={handlePerformLocalNeuralScan}
                disabled={isLocalScanning}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                {isLocalScanning ? 'Evaluating Frame...' : 'Check Frame Indicators'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} max-w-md w-full p-6 shadow-2xl space-y-4`}
          >
            <h3 className="text-base font-bold text-white">Confirm Exam Submission?</h3>
            <p className="text-xs text-slate-300">
              Candidate <strong className="text-white">{session.studentName}</strong>, you have answered{' '}
              <strong className="text-emerald-400">{answeredCount}</strong> of{' '}
              <strong>{exam.questions.length}</strong> questions. Your shuffled option selections will be mapped back to canonical option IDs for deterministic grading.
              {answeredCount < exam.questions.length && (
                <span className="text-amber-400 block mt-1 font-semibold">
                  Note: {exam.questions.length - answeredCount} unanswered questions remain.
                </span>
              )}
            </p>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1">
              <p className="flex justify-between">
                <span>Incidents Queued for Review:</span>
                <span className="font-bold text-white tabular-nums">{session.violationCount}</span>
              </p>
              <p className="flex justify-between">
                <span>Current Integrity Index:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {session.integrityScore}%
                </span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
              >
                Continue Exam
              </button>
              <button
                onClick={handleSubmitExam}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg ${theme.accentBtn}`}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
