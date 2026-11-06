# Ordeal — Autonomous Neural Anti-Spoofing Examination Platform

**Ordeal** is a privacy-first, full-stack proctored examination and anti-spoofing platform engineered with **HTML5, Tailwind CSS v4, TypeScript, React, Express, Chart.js, and client-side TensorFlow.js (COCO-SSD)**.

All computer vision, neural object detection, facial liveness verification, moiré screen replay analysis, OCR document parsing, and student performance analytics run **100% locally in the browser** with zero external cloud telemetry.

---

## Table of Contents

1. [Core Capabilities](#1-core-capabilities)
2. [Local Client-Side Neural & Computer Vision Engine](#2-local-client-side-neural--computer-vision-engine)
3. [Dual-Portal Architecture](#3-dual-portal-architecture)
4. [Student Report Card & Performance Analysis](#4-student-report-card--performance-analysis)
5. [Proctor Analytics & Telemetry Suite](#5-proctor-analytics--telemetry-suite)
6. [Document Test Scanner & Question Authoring](#6-document-test-scanner--question-authoring)
7. [Design Systems & Aesthetic Light/Dark Themes](#7-design-systems--aesthetic-lightdark-themes)
8. [Project Structure](#8-project-structure)
9. [REST API Endpoints (`server.ts`)](#9-rest-api-endpoints-serverts)
10. [Getting Started & Local Development](#10-getting-started--local-development)

---

## 1. Core Capabilities

- **On-Device Neural Object & Device Detection**: Uses `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` on WebGL to detect unauthorized mobile phones (`cell phone`), books (`book`), laptops (`laptop`), and multiple people (`person`) in real time.
- **2D Spatial Laplacian & Moiré Anti-Spoofing**: Analyzes high-frequency screen refresh interference patterns, specular reflection hotspots, and micro-motion temporal pixel variance to distinguish live human examinees from printed photos or phone screen replays.
- **Web Audio API Voice & Whispering Detection**: Real-time FFT frequency-band energy analysis ($300\text{ Hz} - 3400\text{ Hz}$) flags anomalous vocal activity in the testing room.
- **Browser Lock & Focus Telemetry**: Tracks `visibilitychange`, `blur`, and Fullscreen API exits to detect tab switching or secondary window lookups.
- **Deterministic Fisher-Yates Question & Option Shuffling**: Cryptographically seeded per-session question and option permutation prevents adjacent screen-peeking while preserving accurate grading.
- **Student Report Card & Mastery Radar**: Instant post-submission and proctor-accessible report cards featuring a Chart.js Topic Mastery Radar Chart, letter grade ($A+$ to $F$), cohort percentile ranking, tamper-evident Certificate ID hash, itemized question explanations, and printable/exportable transcripts.

---

## 2. Local Client-Side Neural & Computer Vision Engine

Located in `src/utils/localNeuralDetector.ts`, the `LocalNeuralDetector` class combines WebGL neural inference with deterministic pixel heuristics:

| Detection Layer | Algorithm / API | Violation Triggered |
| :--- | :--- | :--- |
| **Object & Device Detection** | TensorFlow.js `coco-ssd` (`lite_mobilenet_v2`) | `MOBILE_PHONE_DETECTED`, `MULTIPLE_FACES_DETECTED`, `FACE_NOT_FOUND` |
| **Screen Replay / Moiré Detection** | 2D Laplacian Edge Variance & High-Frequency Grid Analysis | `SCREEN_REPLAY_ATTACK` |
| **Printed Photo Spoof Detection** | Temporal Frame-Delta Micro-Motion & Specular Glare Analysis | `SPOOF_PHOTO_ATTACK` |
| **Gaze & Head Pose Tracking** |Luminance Centroid Symmetry & Horizontal Eye-Zone Balance | `SUSPICIOUS_GAZE_DEVIATION` |
| **Acoustic Voice Monitoring** | Web Audio `AnalyserNode` Human Speech Band ($300\text{–}3400\text{ Hz}$) | `AUDIO_VOICE_DETECTED` |
| **Environment Lock** | Page Visibility API & Fullscreen API | `TAB_SWITCH_ATTACK`, `FULLSCREEN_EXITED` |

---

## 3. Dual-Portal Architecture

### Candidate Portal (`role: 'candidate'`)
1. **Biometric & Hardware Calibration (`StudentVerification.tsx`)**:
   - Interactive 4-stage pre-exam check: Camera & Microphone Permission, Face & Lighting Framing, Liveness Micro-Challenge, and Environment Lock confirmation.
   - Displays live HUD overlays and anti-spoofing readiness status before launching the exam.
2. **Secure Examination Chamber (`ExamRoom.tsx`)**:
   - Countdown timer, question navigation matrix, flag-for-review markers, and code snippet syntax rendering.
   - Live proctoring sidebar with TensorFlow.js bounding-box HUD, liveness gauge, gaze vector indicator, and acoustic decibel meter.
   - Instant transition to the **Student Report Card** upon submission or timeout.

### Proctor Command Center (`role: 'proctor'`)
1. **Live Surveillance Grid (`ProctorDashboard.tsx`)**:
   - Multi-candidate live feed cards with real-time integrity scores, active status filters (`ALL`, `FLAGGED`, `IN_PROGRESS`), and search.
   - **Candidate Focus Stream** drawer allowing proctors to broadcast direct warnings, request liveness re-verification, inspect evidence snapshots, or open the candidate's full **Report Card & Analysis**.
2. **Analytics & Trends (`ProctorAnalytics.tsx`)**:
   - Cohort KPI cards and 4 interactive Chart.js visualizations with local CSV export.
3. **Forensic Evidence Audit (`ViolationEvidenceReview.tsx`)**:
   - Timestamped incident snapshots with bounding-box overlays, confidence scores, and proctor adjudication (`UPHELD` / `DISMISSED`).
4. **Anti-Spoof Lab (`AntiSpoofingLab.tsx`)**:
   - Interactive sandbox for testing live webcam frames or simulated attack vectors (Printed Photo Attack, Tablet Replay Attack, Mobile Phone in Frame, Multi-Person Collaborator) against the local detector.

---

## 4. Student Report Card & Performance Analysis

Implemented in `src/components/StudentReportCard.tsx` and accessible both **upon candidate exam submission** and inside the **Proctor Dashboard / Analytics table**:

- **Academic Grade & Summary Banner**:
  - Final letter grade ($A+, A, B, C, D, F$), raw points earned, percentage score, and pass/fail status.
- **Cohort Percentile Ranking**:
  - Computes the candidate's exact percentile standing across the cohort:
    $$\text{Percentile} = \left(\frac{\text{Cohort scores below candidate}}{\text{Total cohort sessions}}\right) \times 100$$
  - Compares candidate score against the cohort mean and completion pace.
- **Topic Mastery Radar Chart (Chart.js)**:
  - Dynamically categorizes questions into syllabus domains (*Distributed Consensus*, *Fault Tolerance*, *Concurrency & I/O*, *Network Protocols*, *Security & Systems*) and plots Candidate Mastery (%) against the 60% Passing Baseline.
- **Proctoring Integrity Seal**:
  - Displays overall Integrity Index (%), TensorFlow.js verification status, violation count vs. tolerance, and a deterministic tamper-evident Certificate Hash (e.g., `ORD-2026-XXXX-XXXX`).
- **Itemized Question & Explanation Review**:
  - Expandable question-by-question breakdown showing the candidate's chosen answer, the correct option, points awarded, and pedagogical explanation.
- **Print & JSON Transcript Export**:
  - Built-in `@media print` formatting and 1-click JSON transcript download.

---

## 5. Proctor Analytics & Telemetry Suite

Implemented in `src/components/ProctorAnalytics.tsx` using **Chart.js**:

1. **Candidate Score Distribution (Bar Chart)**: Buckets cohort performance into `0–49% (Fail)`, `50–64% (Pass)`, `65–79% (Good)`, `80–89% (Merit)`, and `90–100% (Distinction)`.
2. **Violation Frequency Breakdown (Doughnut Chart)**: Proportional breakdown of flagged incident types across the selected exam.
3. **Temporal Incident Spike Timeline (Line Chart)**: Maps violation frequency across elapsed exam intervals (`0–10m` through `50m+`).
4. **Integrity vs. Academic Performance Matrix (Grouped Bar Chart)**: Side-by-side comparison of candidate integrity ratings and academic scores.

---

## 6. Document Test Scanner & Question Authoring

- **Document Test Scanner (`DocumentScannerModal.tsx`)**:
  - Supports uploading `.txt`, `.md`, `.json`, `.csv`, or image files.
  - Uses a deterministic regex parser for structured question blocks (`Q1.`, `A)`, `Answer:`, `Explanation:`) and local canvas contrast/edge optical scanning for image uploads to generate ready-to-launch exams without cloud APIs.
- **Question Builder (`QuestionBuilderModal.tsx`)**:
  - Author custom multiple-choice questions with optional code snippets, point weights, explanations, and 1-click local distractor generation.

---

## 7. Design Systems & Aesthetic Light/Dark Themes

Configured in `src/utils/theme.ts` and `src/index.css`:

| Theme ID | Name | Mode | Visual Character |
| :--- | :--- | :--- | :--- |
| **`alabaster` (Default)** | **Warm Alabaster** | **Light** | Soft porcelain & linen gradients (`#fdfcf9` $\rightarrow$ `#ebe4d8`), frosted ceramic cards, organic sage green accents (`#4d7c5f`), and warm charcoal typography (`#1c1917`). |
| `obsidian` | **Obsidian Frosted** | Dark | Deep dark acrylic (`slate-950`) with emerald refractions (`#10b981`). |
| `smoky` | **Smoky Charcoal** | Dark | High-contrast smoke glass (`zinc-950`) with sky-blue accents (`#38bdf8`). |
| `iridescent` | **Luminous Iridescent** | Dark | Prismatic indigo acrylic layers with cyan-violet glow (`#818cf8`). |

- **1-Click Light/Dark Toggle**: Available in the top navigation bar and login header to switch immediately between **Warm Alabaster (Light)** and **Obsidian Frosted (Dark)**, while dynamically updating all Chart.js canvases.

---

## 8. Project Structure

```text
/
├── index.html                           # Entry HTML5 shell & typography imports
├── metadata.json                        # Applet capabilities & camera/microphone permissions
├── package.json                         # Dependencies & scripts
├── server.ts                            # Express backend API & Vite middleware server (Port 3000)
└── src/
    ├── main.tsx                         # React DOM root mount
    ├── App.tsx                          # Root state, theme synchronization & portal routing
    ├── index.css                        # Tailwind CSS v4 + Warm Alabaster light theme adaptation
    ├── types.ts                         # TypeScript interfaces for exams, sessions, violations & themes
    ├── utils/
    │   ├── theme.ts                     # Theme tokens for Alabaster, Obsidian, Smoky & Iridescent
    │   ├── shuffle.ts                   # Seeded Fisher-Yates question & option permutation
    │   └── localNeuralDetector.ts       # Client-side TensorFlow.js (COCO-SSD) + CV anti-spoofing engine
    └── components/
        ├── LoginPage.tsx                # Candidate & Proctor login portal with 1-click demo access
        ├── Navbar.tsx                   # Role-aware navigation, Light/Dark toggle & theme selector
        ├── StudentVerification.tsx      # 4-step pre-exam biometric & environment calibration
        ├── ExamRoom.tsx                 # Live proctored examination interface & HUD sidebar
        ├── StudentReportCard.tsx        # Academic report card, Topic Mastery Radar & question review
        ├── ProctorDashboard.tsx         # Live multi-candidate surveillance grid & focus controls
        ├── ProctorAnalytics.tsx         # Chart.js cohort analytics dashboard & examinee registry
        ├── ViolationEvidenceReview.tsx  # Forensic snapshot inspector & adjudication console
        ├── AntiSpoofingLab.tsx          # Interactive neural & moiré anti-spoofing testbed
        ├── DocumentScannerModal.tsx     # Local OCR & structured test document parser
        └── QuestionBuilderModal.tsx     # Custom question & distractor authoring modal
```

---

## 9. REST API Endpoints (`server.ts`)

The Express server (`server.ts`) runs on port `3000` and provides in-memory session, exam, and violation synchronization:

- `GET /api/exams` — Retrieve all configured examinations and question banks.
- `POST /api/exams` — Create a newly scanned or authored examination.
- `PATCH /api/exams/:id/settings` — Toggle exam security settings (e.g., question/option randomization).
- `POST /api/exams/:id/questions` — Append a new question to an existing exam.
- `GET /api/sessions` — List all active and submitted candidate sessions.
- `POST /api/sessions` — Register or update a candidate examination session.
- `PATCH /api/sessions/:id` — Update candidate score, integrity rating, or submission status.
- `GET /api/violations` — Retrieve all logged proctoring violation records.
- `POST /api/violations` — Log a new timestamped violation with snapshot evidence and bounding boxes.
- `PATCH /api/violations/:id/review` — Adjudicate a violation (`UPHELD` or `DISMISSED`) with proctor notes.

---

## 10. Getting Started & Local Development

### Prerequisites
- Node.js 18+
- A modern browser with WebGL and Webcam/Microphone support (`getUserMedia`)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the full-stack development server on http://localhost:3000
npm run dev

# 3. Type-check TypeScript
npm run lint

# 4. Build production bundle
npm run build
```

### Quick Demo Access
On the **Login Screen**, use the built-in 1-click demo shortcuts:
- **Candidate Demo**: Click **`1-Click Candidate Demo: Abhijeet (STD-2026-904)`** to test biometric calibration, live proctoring, exam submission, and the Student Report Card.
- **Proctor Demo**: Switch to the **Proctor Center** tab and click **`1-Click Demo: Chief Proctor Henderson (PRC-801)`** to explore the Surveillance Grid, Chart.js Analytics, Report Card inspector, Forensic Evidence Audit, and Anti-Spoof Lab.
