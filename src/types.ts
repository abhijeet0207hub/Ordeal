export type ViolationType =
  | 'SPOOF_PHOTO_ATTACK'
  | 'SCREEN_REPLAY_ATTACK'
  | 'MOBILE_PHONE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'FACE_NOT_FOUND'
  | 'SUSPICIOUS_GAZE_DEVIATION'
  | 'AUDIO_VOICE_DETECTED'
  | 'TAB_SWITCH_ATTACK'
  | 'FULLSCREEN_EXITED';

export type ViolationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type SignalSource =
  | 'TFJS_OBJECT_DETECTOR'
  | 'PIXEL_AUDIO_HEURISTIC'
  | 'BROWSER_VISIBILITY_EVENT';

export interface BoundingBox {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  confidence?: number;
}

export interface ViolationRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  timestamp: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  confidence: number;
  signalSource?: SignalSource;
  snapshotUrl: string;
  snapshotDeletedAt?: string;
  boundingBoxes?: BoundingBox[];
  details: string;
  aiForensicAnalysis?: string;
  status: 'PENDING_REVIEW' | 'UPHELD' | 'DISMISSED';
  proctorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  /**
   * Maps displayed option index (0..3) back to the canonical unshuffled option index (0..3).
   * Ensures server grading and client report cards agree 100% under Fisher-Yates option shuffling.
   */
  optionIndexMap?: number[];
  /**
   * Preserves the canonical unshuffled options array for auditability.
   */
  canonicalOptions?: string[];
  /**
   * Preserves the canonical unshuffled correct answer index.
   */
  canonicalCorrectAnswer?: number;
  explanation: string;
  points: number;
}

export type GlassTheme = 'alabaster' | 'obsidian' | 'smoky' | 'iridescent';

export interface AuthUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: 'candidate' | 'proctor';
  avatarUrl: string;
  rollNumber?: string;
  studentId?: string;
  staffId?: string;
  department?: string;
  authToken?: string;
  authProvider?: 'firebase' | 'server';
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  category: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  maxViolationsAllowed: number;
  questions: ExamQuestion[];
  securitySettings: {
    enableLivenessDetection: boolean;
    enableDeviceDetection: boolean;
    enableGazeTracking: boolean;
    enableMultiFaceCheck: boolean;
    enableAudioMonitoring: boolean;
    enableTabLock: boolean;
    randomizeQuestionsAndOptions: boolean;
  };
}

export type AccommodationMode = 'STANDARD_CAMERA' | 'NON_CAMERA_ACCESSIBLE';

export interface StudentSession {
  sessionId: string;
  uid?: string;
  studentId: string;
  rollNumber?: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  referencePhotoUrl?: string;
  examId: string;
  examTitle: string;
  startedAt: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'DISQUALIFIED' | 'FLAGGED';
  /**
   * Displayed option index selected by candidate (keyed by question.id)
   */
  answers: Record<string, number>;
  /**
   * Canonical unshuffled option index selected by candidate (keyed by question.id).
   * Used by server and report card so shuffled options never diverge at grading.
   */
  canonicalAnswers?: Record<string, number>;
  /**
   * Audit map recording how options were permuted for each question.
   */
  presentedOptionOrder?: Record<string, number[]>;
  /**
   * Seconds spent on each question (keyed by question.id).
   */
  questionTimeSpent?: Record<string, number>;
  consentAcceptedAt?: string;
  accommodationMode?: AccommodationMode;
  score?: number;
  totalScore?: number;
  integrityScore: number; // 0 to 100
  violationCount: number;
  violations: ViolationRecord[];
  currentStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  lastPing: string;
}

export interface LivenessMetrics {
  isLive: boolean;
  livenessScore: number; // 0 - 100
  faceDetected: boolean;
  faceCount: number;
  faceBoundingBox?: { x: number; y: number; width: number; height: number };
  gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN' | 'UNKNOWN';
  gazeDeviationScore: number; // 0 - 100
  blinkCount: number;
  lastBlinkTime: number;
  screenSpoofScore: number; // High frequency moire / specular reflection
  staticPhotoScore: number; // Motionlessness / rigid 2D planar test
  devicesDetected: Array<{ label: string; box: BoundingBox; confidence: number }>;
  detectedObjects?: Array<{ bbox: [number, number, number, number]; class: string; score: number }>;
  audioNoiseLevel: number; // 0 - 100
  speechDetected: boolean;
  verdict: 'AUTHENTIC_LIVE' | 'SUSPICIOUS_SPOOF' | 'ABSENT' | 'MULTIPLE_FACES' | 'PROHIBITED_DEVICE';
}

export type ChallengeAction = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE' | 'NOD';

export interface LivenessChallenge {
  id: string;
  action: ChallengeAction;
  instruction: string;
  timeLimitSec: number;
  iconName: string;
}

