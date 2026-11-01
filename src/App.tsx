/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentVerification } from './components/StudentVerification';
import { ExamRoom } from './components/ExamRoom';
import { ProctorDashboard } from './components/ProctorDashboard';
import { ViolationEvidenceReview } from './components/ViolationEvidenceReview';
import { AntiSpoofingLab } from './components/AntiSpoofingLab';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { QuestionBuilderModal } from './components/QuestionBuilderModal';
import { Exam, StudentSession, ViolationRecord, AuthUser, GlassTheme, ExamQuestion } from './types';
import { GLASS_THEMES } from './utils/theme';

const defaultExams: Exam[] = [
  {
    id: 'exam-cs-401',
    title: 'Advanced Computer Networks & Distributed Systems',
    code: 'CS-401',
    category: 'Computer Science',
    durationMinutes: 45,
    totalMarks: 50,
    passingMarks: 30,
    maxViolationsAllowed: 3,
    securitySettings: {
      enableLivenessDetection: true,
      enableDeviceDetection: true,
      enableGazeTracking: true,
      enableMultiFaceCheck: true,
      enableAudioMonitoring: true,
      enableTabLock: true,
      randomizeQuestionsAndOptions: true,
    },
    questions: [
      {
        id: 'q1',
        question:
          'Which consistency model ensures that all updates to a single object are observed in the same order by all nodes, but updates to different objects may be seen in varying orders?',
        options: ['Sequential Consistency', 'Linearizability', 'Causal Consistency', 'Eventual Consistency'],
        correctAnswer: 2,
        explanation:
          'Causal consistency preserves the order of causally related events, while concurrent operations can be observed in different orders across replicas.',
        points: 10,
      },
      {
        id: 'q2',
        question:
          'What is the primary function of the Raft consensus algorithm leader election heartbeat mechanism?',
        options: [
          'To compress the write-ahead transaction log',
          'To prevent follower nodes from transitioning to candidate state via election timeouts',
          'To encrypt RPC payloads between peer cluster nodes',
          'To calculate Byzantine fault tolerance thresholds',
        ],
        correctAnswer: 1,
        explanation:
          'Leaders periodically broadcast AppendEntries heartbeats to reset follower election timers and retain cluster authority.',
        points: 10,
      },
      {
        id: 'q3',
        question:
          'Analyze the following Go concurrency pattern. What is the latent risk if context cancellation occurs before channel read?',
        codeSnippet: `func worker(ctx context.Context, ch <-chan int) {
  for {
    select {
    case val := <-ch:
      process(val)
    case <-ctx.Done():
      return
    }
  }
}`,
        options: [
          'Deadlock on main thread',
          'Clean exit with slight risk of dropping in-flight buffered messages',
          'Infinite loop due to closed nil channel',
          'Memory leak from uncollected goroutine',
        ],
        correctAnswer: 1,
        explanation:
          'If the channel still has buffered values when ctx is cancelled, select pseudorandomly picks a case, potentially exiting without consuming remaining pending messages.',
        points: 10,
      },
      {
        id: 'q4',
        question:
          'In TCP congestion control (RFC 5681), what causes TCP Reno to enter Fast Recovery rather than Slow Start?',
        options: [
          'Reception of 3 duplicate ACKs indicating out-of-order segment arrival',
          'Retransmission Timeout (RTO) expiration',
          'Explicit Congestion Notification (ECN) CE bit flag',
          'Window Scale Option negotiation failure',
        ],
        correctAnswer: 0,
        explanation:
          'Three duplicate ACKs suggest segments are still reaching the receiver (mild packet loss), so Reno enters Fast Recovery instead of dropping congestion window to 1 MSS.',
        points: 10,
      },
      {
        id: 'q5',
        question:
          'In distributed transaction management, why is Two-Phase Commit (2PC) inherently blocking if the coordinator crashes during Phase 2?',
        options: [
          'Participants cannot know whether the coordinator voted commit or abort without timeout failover',
          'Storage engines lock database tables exclusively in Phase 1',
          'Network partitions always split the quorum',
          'Two-phase commit requires synchronous NTP clock synchronization',
        ],
        correctAnswer: 0,
        explanation:
          'If the coordinator crashes after receiving all Phase 1 votes, participants who voted YES must remain blocked waiting for the decision to maintain ACID consistency.',
        points: 10,
      },
    ],
  },
  {
    id: 'exam-ai-602',
    title: 'Computer Vision & Deep Learning Security',
    code: 'AI-602',
    category: 'Artificial Intelligence',
    durationMinutes: 30,
    totalMarks: 30,
    passingMarks: 20,
    maxViolationsAllowed: 3,
    securitySettings: {
      enableLivenessDetection: true,
      enableDeviceDetection: true,
      enableGazeTracking: true,
      enableMultiFaceCheck: true,
      enableAudioMonitoring: true,
      enableTabLock: true,
      randomizeQuestionsAndOptions: true,
    },
    questions: [
      {
        id: 'q201',
        question:
          'Which presentation attack detection (PAD) metric evaluates the proportion of spoof attacks falsely accepted as genuine live candidates?',
        options: [
          'BPCER (Bona Fide Presentation Classification Error Rate)',
          'APCER (Attack Presentation Classification Error Rate)',
          'EER (Equal Error Rate)',
          'HTER (Half Total Error Rate)',
        ],
        correctAnswer: 1,
        explanation:
          'APCER defines the percentage of presentation attacks that bypass the liveness detector, measuring spoof vulnerability.',
        points: 10,
      },
      {
        id: 'q202',
        question:
          'Why do high-frequency 2D Fourier / Laplacian transforms detect digital screen replay attacks effectively?',
        options: [
          'Screens emit infrared light detected by silicon sensors',
          'LCD and OLED pixel subgrids create characteristic high-frequency moiré patterns absent in human skin',
          'Human faces have zero textural variation',
          'Digital cameras invert color temperature on glass screens',
        ],
        correctAnswer: 1,
        explanation:
          'Digital displays possess discrete pixel lattices, color filter arrays, and refresh pulse harmonics that create distinct high-frequency moiré artifacts under 2D Fourier inspection.',
        points: 10,
      },
      {
        id: 'q203',
        question:
          'What is the role of Fast Gradient Sign Method (FGSM) in adversarial robustness testing for vision classifiers?',
        options: [
          'It smooths bounding box proposals in YOLO architectures',
          'It generates minimal L-infinity bounded perturbations along the gradient of loss to trigger misclassifications',
          'It accelerates gradient descent using Nesterov momentum',
          'It filters out motion blur in real-time camera streams',
        ],
        correctAnswer: 1,
        explanation:
          'FGSM perturbs input pixels by epsilon * sign(grad_x J(theta, x, y)) to find adversarial examples that fool neural networks.',
        points: 10,
      },
    ],
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentTheme, setCurrentTheme] = useState<GlassTheme>('obsidian');
  const [currentTab, setCurrentTab] = useState<'student' | 'proctor' | 'violations' | 'lab'>('student');

  const [exams, setExams] = useState<Exam[]>(defaultExams);
  const [selectedExam, setSelectedExam] = useState<Exam>(defaultExams[0]);
  const [preparedActiveExam, setPreparedActiveExam] = useState<Exam>(defaultExams[0]);
  const [activeSession, setActiveSession] = useState<StudentSession | null>(null);
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isDocScannerOpen, setIsDocScannerOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);

  const themeConfig = GLASS_THEMES[currentTheme];

  const fetchData = async () => {
    try {
      const [examsRes, sessionsRes, violationsRes] = await Promise.all([
        fetch('/api/exams').then((r) => r.json()).catch(() => ({ exams: defaultExams })),
        fetch('/api/sessions').then((r) => r.json()).catch(() => ({ sessions: [] })),
        fetch('/api/violations').then((r) => r.json()).catch(() => ({ violations: [] })),
      ]);

      if (examsRes.exams && examsRes.exams.length > 0) {
        setExams(examsRes.exams);
        setSelectedExam(examsRes.exams[0]);
      }
      if (sessionsRes.sessions) {
        setSessions(sessionsRes.sessions);
      }
      if (violationsRes.violations) {
        setViolations(violationsRes.violations);
      }
    } catch (e) {
      console.warn('Initial fetch error:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'proctor') {
      setCurrentTab('proctor');
    } else {
      setCurrentTab('student');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSession(null);
  };

  const handleVerificationComplete = (newSession: StudentSession, preparedExam: Exam) => {
    setActiveSession(newSession);
    setPreparedActiveExam(preparedExam);
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleExitExam = () => {
    setActiveSession(null);
    fetchData();
  };

  const handleViolationOccurred = (violation: ViolationRecord) => {
    setViolations((prev) => [violation, ...prev]);
    setToastMessage(`Incident Logged: ${violation.violationType.replace(/_/g, ' ')}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReviewViolation = async (id: string, status: 'UPHELD' | 'DISMISSED', notes?: string) => {
    try {
      const res = await fetch(`/api/violations/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, proctorNotes: notes }),
      });
      const data = await res.json();
      if (data.success && data.violation) {
        setViolations((prev) => prev.map((v) => (v.id === id ? data.violation : v)));
        fetchData();
      }
    } catch (e) {
      console.warn('Review violation error:', e);
      setViolations((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status, proctorNotes: notes } : v))
      );
    }
  };

  const handleExamCreated = (newExam: Exam) => {
    setExams((prev) => [newExam, ...prev]);
    setSelectedExam(newExam);
    setToastMessage(`Document digitized into new exam: ${newExam.title}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuestionAdded = (examId: string, question: ExamQuestion) => {
    setExams((prev) =>
      prev.map((ex) => (ex.id === examId ? { ...ex, questions: [...ex.questions, question] } : ex))
    );
    setToastMessage(`Added new question to exam: ${question.question.slice(0, 35)}...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleRandomization = async (examId: string, currentVal: boolean) => {
    setExams((prev) =>
      prev.map((ex) =>
        ex.id === examId
          ? {
              ...ex,
              securitySettings: { ...ex.securitySettings, randomizeQuestionsAndOptions: currentVal },
            }
          : ex
      )
    );

    try {
      await fetch(`/api/exams/${examId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securitySettings: { randomizeQuestionsAndOptions: currentVal },
        }),
      });
    } catch (e) {
      console.warn('Toggle randomization settings error:', e);
    }

    setToastMessage(
      `Question & Option Shuffling ${currentVal ? 'ENABLED' : 'DISABLED'} for selected exam.`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pendingViolationsCount = violations.filter((v) => v.status === 'PENDING_REVIEW').length;

  // Unauthenticated State: Render Glassmorphic Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${themeConfig.previewGradient} text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-cyan-500/30 selection:text-white transition-colors duration-300`}
    >
      {/* Ambient Glass Glow Orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-black/85 backdrop-blur-xl text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 animate-bounce">
          <span className="text-cyan-400">⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingViolationsCount={pendingViolationsCount}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        onOpenDocScanner={() => setIsDocScannerOpen(true)}
        onOpenQuestionBuilder={() => setIsQuestionBuilderOpen(true)}
        isExamInProgress={!!activeSession && activeSession.status === 'IN_PROGRESS'}
      />

      {/* Portal Content Views */}
      <main className="flex-1 pb-12 relative z-10">
        {currentUser.role === 'candidate' ? (
          /* Candidate Portal (Strictly Isolated) */
          <>
            {activeSession ? (
              <ExamRoom
                exam={preparedActiveExam}
                session={activeSession}
                onExitExam={handleExitExam}
                onViolationOccurred={handleViolationOccurred}
                currentTheme={currentTheme}
              />
            ) : (
              <StudentVerification
                currentUser={currentUser}
                exams={exams}
                selectedExam={selectedExam}
                setSelectedExam={setSelectedExam}
                onVerificationComplete={handleVerificationComplete}
                currentTheme={currentTheme}
              />
            )}
          </>
        ) : (
          /* Proctor Command Center */
          <>
            {currentTab === 'proctor' && (
              <ProctorDashboard
                sessions={sessions}
                exams={exams}
                violations={violations}
                onSelectCandidateToReview={(studentId) => {
                  setSelectedStudentFilter(studentId);
                  setCurrentTab('violations');
                }}
                onOpenDocScanner={() => setIsDocScannerOpen(true)}
                onOpenQuestionBuilder={() => setIsQuestionBuilderOpen(true)}
                onToggleRandomization={handleToggleRandomization}
                currentTheme={currentTheme}
              />
            )}

            {currentTab === 'violations' && (
              <ViolationEvidenceReview
                violations={violations}
                onReviewViolation={handleReviewViolation}
                selectedStudentFilter={selectedStudentFilter}
                currentTheme={currentTheme}
              />
            )}

            {currentTab === 'lab' && <AntiSpoofingLab currentTheme={currentTheme} />}
          </>
        )}
      </main>

      {/* Document Scanner & Ingestion Modal */}
      <DocumentScannerModal
        isOpen={isDocScannerOpen}
        onClose={() => setIsDocScannerOpen(false)}
        onExamCreated={handleExamCreated}
        currentTheme={currentTheme}
      />

      {/* Question Builder with AI Distractor Modal */}
      <QuestionBuilderModal
        isOpen={isQuestionBuilderOpen}
        onClose={() => setIsQuestionBuilderOpen(false)}
        exams={exams}
        onQuestionAdded={handleQuestionAdded}
        currentTheme={currentTheme}
      />
    </div>
  );
}
