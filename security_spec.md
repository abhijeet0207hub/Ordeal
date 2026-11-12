# Ordeal Firestore Security Specification

## 1. Authentication & Roles
- **Authentication Required**: All reads and writes to Firestore require an authenticated Firebase user (`request.auth != null`).
- **Roles**:
  - `candidate`: Can read exams, manage their own `users/{userId}` profile, create/update their own `sessions/{sessionId}` attempts, and log `violations/{violationId}` incidents for their active attempt.
  - `proctor`: Bootstrapped admin (`garv0207s@gmail.com`) or users with `role == 'proctor'` in `/users/$(request.auth.uid)`. Can read all sessions and violations, adjudicate/purge violation snapshots, and create or update exams.

## 2. Collection Rules & Schema Validation
- **`/users/{userId}`**:
  - Read: Owner (`request.auth.uid == userId`) or Proctor.
  - Create/Update: Owner (`request.auth.uid == userId`) with valid string fields (`name`, `email`, `role` in `['candidate', 'proctor']`).
- **`/exams/{examId}`**:
  - Read: Any authenticated user (`candidate` or `proctor`).
  - Create/Update/Delete: Authenticated users (Proctor exam administration and initial seeding).
- **`/sessions/{sessionId}`**:
  - Read: Any authenticated user (Candidates view their report card and cohort percentile; Proctors monitor all sessions).
  - Create/Update: Authenticated user with valid `sessionId`, `studentName`, `examId`, and `status`.
- **`/violations/{violationId}`**:
  - Read: Any authenticated user.
  - Create/Update: Authenticated user (Candidates log incidents during exams or purge their own snapshots; Proctors adjudicate status/notes and purge snapshots).
