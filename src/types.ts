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
  snapshotUrl: string;
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
  explanation: string;
  points: number;
}

export type GlassTheme = 'obsidian' | 'smoky' | 'iridescent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'proctor';
  avatarUrl: string;
  studentId?: string;
  staffId?: string;
  department?: string;
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

export interface StudentSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  referencePhotoUrl?: string;
  examId: string;
  examTitle: string;
  startedAt: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'DISQUALIFIED' | 'FLAGGED';
  answers: Record<string, number>;
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
