import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AuthUser, Exam, StudentSession, ViolationRecord } from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

/**
 * Sign in with Google Popup and persist user profile to Firestore `/users/{uid}`
 */
export async function signInWithGoogleRole(
  preferredRole: 'candidate' | 'proctor',
  rollNumber = '2501920100016',
  studentId = 'STD-2026-904',
  staffId = 'PRC-801'
): Promise<AuthUser> {
  const credential = await signInWithPopup(auth, googleProvider);
  const fbUser = credential.user;
  const idToken = await fbUser.getIdToken();

  const userRef = doc(db, 'users', fbUser.uid);
  let resolvedRole: 'candidate' | 'proctor' = preferredRole;

  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (data.role === 'proctor' || data.role === 'candidate') {
        resolvedRole = preferredRole || data.role;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${fbUser.uid}`);
  }

  const profileData = {
    uid: fbUser.uid,
    name: fbUser.displayName || (resolvedRole === 'proctor' ? 'Chief Proctor' : 'Abhijeet Singh'),
    email: fbUser.email || 'abhijeet@univ.edu',
    role: resolvedRole,
    rollNumber: resolvedRole === 'candidate' ? rollNumber : '',
    studentId: resolvedRole === 'candidate' ? studentId : '',
    staffId: resolvedRole === 'proctor' ? staffId : '',
    department:
      resolvedRole === 'proctor'
        ? 'Examination Conduct & Academic Integrity Board'
        : 'Computer Science & Engineering',
    avatarUrl:
      fbUser.photoURL ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, profileData, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    name: profileData.name,
    email: profileData.email,
    role: resolvedRole,
    rollNumber: profileData.rollNumber || undefined,
    studentId: profileData.studentId || undefined,
    staffId: profileData.staffId || undefined,
    department: profileData.department,
    avatarUrl: profileData.avatarUrl,
    authToken: idToken,
    authProvider: 'firebase',
  };
}

export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  }
}

export async function syncExamToFirestore(exam: Exam): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'exams', exam.id), exam, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `exams/${exam.id}`);
  }
}

export async function syncSessionToFirestore(session: StudentSession): Promise<void> {
  if (!auth.currentUser) return;
  try {
    // Strip embedded violations snapshots when saving session doc to stay well within 1MB Firestore document limit
    const sanitizedSession = {
      ...session,
      uid: auth.currentUser.uid,
      violations: (session.violations || []).map((v) => ({
        ...v,
        snapshotUrl: v.snapshotUrl ? '[STORED_IN_VIOLATIONS_COLLECTION]' : '',
      })),
    };
    await setDoc(doc(db, 'sessions', session.sessionId), sanitizedSession, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `sessions/${session.sessionId}`);
  }
}

export async function syncViolationToFirestore(violation: ViolationRecord): Promise<void> {
  if (!auth.currentUser) return;
  try {
    // Ensure snapshot fits comfortably in Firestore document
    const safeSnapshot =
      violation.snapshotUrl && violation.snapshotUrl.length > 700000
        ? violation.snapshotUrl.slice(0, 700000)
        : violation.snapshotUrl || '';
    await setDoc(
      doc(db, 'violations', violation.id),
      { ...violation, snapshotUrl: safeSnapshot },
      { merge: true }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `violations/${violation.id}`);
  }
}

export { onAuthStateChanged, collection, onSnapshot, doc, updateDoc };
export type { FirebaseUser };
