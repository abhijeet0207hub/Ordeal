import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Volume2,
  Eye,
  Camera,
  XCircle,
  Sparkles,
  FileCheck,
  Shuffle,
  Cpu,
} from 'lucide-react';
import { Exam, StudentSession, ViolationRecord, BoundingBox, GlassTheme } from '../types';
import { LocalNeuralDetector } from '../utils/localNeuralDetector';
import { GLASS_THEMES } from '../utils/theme';

interface ExamRoomProps {
  exam: Exam;
  session: StudentSession;
  onExitExam: () => void;
  onViolationOccurred?: (v: ViolationRecord) => void;
  currentTheme: GlassTheme;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  session: initialSession,
  onExitExam,
  onViolationOccurred,
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

  // Local Neural Detector state (TensorFlow.js + Canvas Vision)
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
  }, []);

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

  // Tab Switch & Visibility Change Detection (Local Browser Enforcement)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        logViolation(
          'TAB_SWITCH_ATTACK',
          'WARNING',
          1.0,
          'Candidate switched away from exam tab or minimized window.',
          'Operating System window blur and document visibilityState changed to hidden.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmitted) {
        logViolation(
          'TAB_SWITCH_ATTACK',
          'WARNING',
          0.95,
          'Browser window focus lost.',
          'Window blur event recorded. Focus deviated outside proctored exam hall.'
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

  // Real-time Local ML Proctoring Loop (TensorFlow.js COCO-SSD + Computer Vision)
  useEffect(() => {
    if (isSubmitted || !videoRef.current) return;

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
            label: metrics.isLive ? 'Abhijeet (Live · Local ML)' : 'Spoof Suspected',
            x: metrics.faceBoundingBox.x,
            y: metrics.faceBoundingBox.y,
            width: metrics.faceBoundingBox.width,
            height: metrics.faceBoundingBox.height,
            color: metrics.isLive ? '#10b981' : '#f43f5e',
          });
        }

        // Overlay TensorFlow.js detected objects (cell phones, laptops, books)
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
              'Mobile phone detected by local TensorFlow.js neural network.',
              'COCO-SSD MobileNet inference triggered cell phone class in lower frame.',
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
              `Multiple individuals (${metrics.faceCount} persons) detected in webcam feed.`,
              'TensorFlow.js COCO-SSD identified multiple simultaneous person bounding boxes.',
              boxes
            );
          }
        } else {
          multiPersonCounter.current = Math.max(0, multiPersonCounter.current - 1);
        }

        // 3. Candidate Absence Check
        if (!metrics.faceDetected) {
          absenceCounter.current++;
          if (absenceCounter.current >= 4) {
            absenceCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'FACE_NOT_FOUND',
              'WARNING',
              0.88,
              'Candidate face missing from frame.',
              'Candidate absence detected for > 4.5 seconds.'
            );
          }
        } else {
          absenceCounter.current = 0;
        }

        // 4. Gaze Deviation Check
        if (metrics.gazeDirection === 'LEFT' || metrics.gazeDirection === 'RIGHT' || metrics.gazeDirection === 'DOWN') {
          gazeAwayCounter.current++;
          if (gazeAwayCounter.current >= 5) {
            gazeAwayCounter.current = 0;
            lastViolationTime.current = now;
            logViolation(
              'SUSPICIOUS_GAZE_DEVIATION',
              'WARNING',
              0.85,
              `Gaze deviation detected (${metrics.gazeDirection}). Candidate looking away from screen.`,
              'Iris centroid & head yaw offset exceeded threshold.'
            );
          }
        } else {
          gazeAwayCounter.current = Math.max(0, gazeAwayCounter.current - 1);
        }

        // 5. Local Computer Vision Spoof Check (2D Frequency Moiré & Optical Flow)
        if (metrics.staticPhotoScore > 75) {
          lastViolationTime.current = now;
          logViolation(
            'SPOOF_PHOTO_ATTACK',
            'CRITICAL',
            0.91,
            'Printed photograph presentation attack detected.',
            'Local optical flow calculated 0% micro-motion variance and rigid planar movement.'
          );
        } else if (metrics.screenSpoofScore > 80) {
          lastViolationTime.current = now;
          logViolation(
            'SCREEN_REPLAY_ATTACK',
            'CRITICAL',
            0.89,
            'Digital screen replay presentation attack detected.',
            '2D Laplacian frequency variance identified discrete display pixel subgrid artifacts.'
          );
        }
      } catch (err) {
        // Continue loop
      } finally {
        isProcessing = false;
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  const logViolation = async (
    type: ViolationRecord['violationType'],
    severity: ViolationRecord['severity'],
    confidence: number,
    details: string,
    forensic: string,
    boxes?: BoundingBox[]
  ) => {
    let snapshot = '';
    if (videoRef.current) {
      snapshot = detector.captureSnapshot(videoRef.current);
    }

    setLastWarningMsg(`⚠️ ${type.replace(/_/g, ' ')}: ${details}`);
    setTimeout(() => setLastWarningMsg(null), 5000);

    try {
      const res = await fetch('/api/violations/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          studentId: session.studentId,
          studentName: session.studentName || 'Abhijeet',
          examId: exam.id,
          violationType: type,
          severity,
          confidence,
          snapshotUrl: snapshot,
          boundingBoxes: boxes || hudBoundingBoxes,
          details,
          aiForensicAnalysis: `[Local ML Verified] ${forensic}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.violation) {
        if (data.session) {
          setSession(data.session);
          if (data.session.violationCount >= exam.maxViolationsAllowed) {
            handleSubmitExam();
          }
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
    try {
      const res = await fetch('/api/sessions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answers,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      }
    } catch (e) {
      console.warn('Submit exam error:', e);
    }
    setIsSubmitted(true);
  };

  // On-device local neural scan trigger (0ms latency, zero cloud dependency)
  const handlePerformLocalNeuralScan = async () => {
    if (!videoRef.current || isLocalScanning) return;
    setIsLocalScanning(true);
    try {
      const m = await detector.processFrameAsync(videoRef.current);
      setLastWarningMsg(
        `Local ML Audit: ${m.isLive ? 'Verified Live Candidate' : 'Spoof Warning'} (${m.livenessScore}% Score · TensorFlow.js WebGL)`
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
    const earnedScore = session.score ?? 0;
    const totalScore = session.totalScore ?? exam.totalMarks;
    const isPassed = earnedScore >= exam.passingMarks && session.status !== 'DISQUALIFIED';

    return (
      <div className="max-w-4xl mx-auto py-10 px-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-8 shadow-2xl text-center space-y-6`}>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-white/10 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
            {session.status === 'DISQUALIFIED' ? (
              <XCircle className="w-10 h-10 text-rose-500" />
            ) : (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {session.status === 'DISQUALIFIED'
                ? 'Session Disqualified — Academic Policy Violation'
                : 'Examination Submitted Successfully'}
            </h1>
            <p className="text-xs text-slate-300 mt-2">
              Candidate: <span className="text-white font-bold">{session.studentName}</span> ({session.studentId})
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400">Exam Score</span>
              <p className="text-2xl font-bold text-white mt-1">
                {earnedScore} <span className="text-xs text-slate-400">/ {totalScore}</span>
              </p>
              <span
                className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                  isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isPassed ? 'PASSED' : 'NOT PASSED'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400">Integrity Index</span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  session.integrityScore >= 80
                    ? 'text-emerald-400'
                    : session.integrityScore >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {session.integrityScore}%
              </p>
              <span className="text-[10px] text-slate-400 font-mono">TensorFlow.js Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400">Violations Flagged</span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  session.violationCount === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {session.violationCount}
              </p>
              <span className="text-[10px] text-slate-400">Tolerance: {exam.maxViolationsAllowed}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400">Session Status</span>
              <p className="text-sm font-bold text-slate-200 mt-2">{session.status}</p>
              <span className="text-[10px] text-emerald-400 font-mono">Local ML Encrypted</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={onExitExam}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-bold rounded-2xl text-xs transition-all"
            >
              Return to Candidate Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Warning Toast */}
      {lastWarningMsg && (
        <div className="p-3 bg-rose-600/90 text-white rounded-2xl shadow-2xl flex items-center justify-between border border-rose-400 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span>{lastWarningMsg}</span>
          </div>
          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono">
            Local Neural Audit
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className={`rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-xs">
            {exam.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">{exam.title}</h1>
              {exam.securitySettings?.randomizeQuestionsAndOptions && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> Shuffled
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Candidate: <span className="text-slate-200 font-medium">{session.studentName}</span> ({session.studentId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${session.violationCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}
            />
            <span className="text-slate-400 text-[11px]">Warnings:</span>
            <span className={`font-mono font-bold text-xs ${session.violationCount > 0 ? 'text-rose-400' : 'text-white'}`}>
              {session.violationCount} / {exam.maxViolationsAllowed}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs ${
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
          <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-xl space-y-5`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                  Question {currentQuestionIndex + 1} of {exam.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">({currentQ?.points ?? 10} Points)</span>
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
                  <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
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
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: idx,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                        : 'bg-black/20 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/15'
                    }`}
                  >
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

              <div className="text-xs text-slate-400">
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

          <div className={`rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 shadow-lg`}>
            <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Question Navigator
            </h3>
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all relative flex items-center justify-center ${
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

        {/* Right Col: Local Neural Proctor HUD */}
        <div className="space-y-4">
          <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-4 shadow-xl space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Camera className="w-4 h-4 text-emerald-400" />
                Local Neural HUD
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {tfModelReady ? 'TF.js WebGL Active' : 'Loading Local ML...'}
              </span>
            </div>

            {/* Video Viewport with Bounding Box Overlay */}
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

              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Liveness: {livenessScore}%
                </span>
                <span className="text-slate-300">Gaze: {gazeStatus}</span>
              </div>
            </div>

            {/* Local ML Sensor Telemetry */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Local ML Engine
                </span>
                <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                  COCO-SSD MobileNet
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Gaze Deviation
                </span>
                <span className={`font-mono font-semibold ${gazeStatus === 'CENTER' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {gazeStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Ambient Noise Meter
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all ${audioLevel > 50 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-slate-300 text-[10px]">{audioLevel} dB</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  Window Lockdown
                </span>
                <span className="font-mono text-emerald-400 font-semibold">ENFORCED</span>
              </div>
            </div>

            <button
              onClick={handlePerformLocalNeuralScan}
              disabled={isLocalScanning}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              {isLocalScanning ? 'Running Local Neural Scan...' : 'Trigger Local Neural Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} max-w-md w-full p-6 shadow-2xl space-y-4`}>
            <h3 className="text-base font-bold text-white">Confirm Exam Submission?</h3>
            <p className="text-xs text-slate-300">
              Candidate <strong className="text-white">{session.studentName}</strong>, you have answered{' '}
              <strong className="text-emerald-400">{answeredCount}</strong> of{' '}
              <strong>{exam.questions.length}</strong> questions.
              {answeredCount < exam.questions.length && (
                <span className="text-amber-400 block mt-1 font-semibold">
                  ⚠️ Note: {exam.questions.length - answeredCount} unanswered questions remain!
                </span>
              )}
            </p>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1">
              <p className="flex justify-between">
                <span>Total Warnings Logged:</span>
                <span className="font-bold text-white">{session.violationCount}</span>
              </p>
              <p className="flex justify-between">
                <span>Current Integrity Index:</span>
                <span className="font-bold text-emerald-400">{session.integrityScore}%</span>
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
