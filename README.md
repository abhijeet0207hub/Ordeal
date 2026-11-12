# Ordeal — Online Examination & Proctoring Platform with Browser-Based Monitoring

**Submitted by:** Abhijeet Singh | **Roll No.:** 2501920100016  
**Audited Baseline:** `github.com/abhijeet0207hub/Ordeal` (`86d1e38`) + Complete P0–P2 Engineering Implementation

Ordeal is a full-stack online examination and browser-based proctoring platform built with **React 19**, **TypeScript**, **Vite**, **Express**, **TensorFlow.js (`@tensorflow-models/coco-ssd`)**, and **Firebase Authentication & Cloud Firestore**.

---

## Completed Engineering Architecture (Project Report P0–P2 Remediations)

This implementation resolves every architectural finding, verification item, and future roadmap requirement documented in the *Ordeal Project Report* (Tables 5.2, 5.5, 5.6, and 6.1):

### 1. P0 — Correctness: Canonical Option-ID Grading Under Shuffle (`src/utils/shuffle.ts`, `server.ts`)
- **Problem in `86d1e38`:** `shuffleQuestionOptions` mutated `q.correctAnswer` in client state while `POST /api/sessions/submit` graded submitted option indices against the unshuffled server copy of the exam, causing shuffled candidates to receive mismatched server vs. client scores.
- **Resolution:** `shuffleQuestionOptions` now preserves an explicit `optionIndexMap: number[]` (mapping each displayed option index to its canonical server index) alongside `canonicalOptions` and `canonicalCorrectAnswer`. On submission, `ExamRoom` translates displayed indices via `mapDisplayedAnswersToCanonical`, `server.ts` grades against canonical indices, and `StudentReportCard` uses `evaluateQuestionSelection` so client and server scores match **100% under any permutation**.

### 2. P0 — Trust Boundary & Persistence: Firebase Auth + Server HMAC RBAC + Durable Storage (`src/firebase.ts`, `server.ts`, `firestore.rules`)
- **Authentication & RBAC:** Supports **Google Sign-In via Firebase Auth** (`src/firebase.ts`) and **Server Credential Validation** (`POST /api/auth/login`) issuing signed HMAC-SHA256 bearer tokens. Mutating proctor endpoints (`POST /api/exams`, `POST /api/exams/:id/questions`, `PATCH /api/exams/:id/settings`, `PATCH /api/violations/:id/review`, `DELETE /api/violations/:id/snapshot`) enforce `requireRole('proctor')`.
- **Dual Persistence:** Server state persists across restarts in `.ordeal-data/store.json` with atomic write-through and syncs with **Cloud Firestore** (`exams`, `sessions`, `violations`, `users`) protected by strict role-based `firestore.rules`.

### 3. P1 — Honest Signal Provenance & Anti-Spoof Fallback (`server.ts`, `ExamRoom.tsx`, `AntiSpoofingLab.tsx`)
- **No Fabricated Verdicts:** When an external cloud AI key (`GEMINI_API_KEY`) is not configured, `POST /api/verify-anti-spoof` returns `verdict: 'UNAVAILABLE_NEEDS_HUMAN_REVIEW'` (`evaluatedByAi: false`) instead of fabricating a synthetic 91–98% passing score.
- **Explicit Signal Provenance (`SignalSource`):** Every incident and HUD badge distinguishes:
  - `TFJS_OBJECT_DETECTOR` — Real neural object detection via `@tensorflow-models/coco-ssd` (`cell phone`, `book`, `laptop`, multi-person).
  - `PIXEL_AUDIO_HEURISTIC` — Deterministic 2D Laplacian contrast/moiré variance, centroid gaze estimation, and Web Audio RMS decibel heuristics.
  - `BROWSER_VISIBILITY_EVENT` — Browser `visibilitychange`, `blur`, and clipboard/context-menu events.

### 4. P1 — Client/Server ID Reconciliation (`DocumentScannerModal.tsx`, `QuestionBuilderModal.tsx`)
- Both authoring modals await the canonical server response (`data.exam` / `data.question`) before updating React state so newly created exams and questions never diverge between client and server.

### 5. Privacy Governance, Retention Controls & Non-Camera Accessibility (`StudentVerification.tsx`, `ViolationEvidenceReview.tsx`)
- **Pre-Exam Consent Notice:** Explicit disclosure of webcam/audio/tab telemetry transmission and retention before starting an exam.
- **Non-Camera Accessibility Accommodation Mode (`NON_CAMERA_ACCESSIBLE`):** Candidates without a webcam or with accessibility accommodations can complete exams using browser-focus and timer telemetry without false-positive camera penalties.
- **Snapshot Retention Controls:** Proctors can purge individual JPEG evidence snapshots (`DELETE /api/violations/:id/snapshot`) or purge all stored snapshots (`POST /api/violations/purge-snapshots`) while preserving the audit log.

### 6. Built-In Project Report Viewer & Automated Verification Suite (`ProjectReportModal.tsx`)
- Click **"Project Report & Verification Suite"** on the Login page or **"Report & Verify"** in the top navigation bar to view the embedded PDF report (`/assets/aistudio/Ordeal_Project_Report__2__b22058fc.pdf`) and execute automated P0–P2 verification tests against the live server (`POST /api/verify-suite`).
