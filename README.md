# 🛡️ Ordeal — Autonomous Neural Anti-Spoofing Examination Platform

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-COCO--SSD-FF6F00?logo=tensorflow&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.5-FF6384?logo=chartdotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)

**Ordeal** is a privacy-first, full-stack online examination and anti-spoofing proctoring platform built with **HTML5, Tailwind CSS, TypeScript, React, Express, Chart.js, and client-side TensorFlow.js (COCO-SSD)**.

All computer vision, neural object detection, facial liveness verification, moiré screen replay analysis, OCR document parsing, and student performance analytics run **100% locally in the browser** with zero external cloud telemetry.

---

## ✨ Key Features

- **🧠 On-Device Neural Object & Device Detection**: Uses `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` (`lite_mobilenet_v2`) via WebGL to detect unauthorized mobile phones (`cell phone`), books (`book`), laptops (`laptop`), and multiple people (`person`) in real time.
- **🔍 2D Spatial Laplacian & Moiré Anti-Spoofing**: Analyzes high-frequency screen refresh interference patterns, specular reflection hotspots, and micro-motion temporal pixel variance to distinguish live human examinees from printed photos or phone screen replays.
- **🎙️ Web Audio API Voice & Whispering Detection**: Real-time FFT frequency-band energy analysis ($300\text{ Hz} - 3400\text{ Hz}$) flags anomalous vocal activity in the testing environment.
- **🔒 Browser Lock & Focus Telemetry**: Tracks `visibilitychange`, `blur`, and Fullscreen API exits to detect tab switching or secondary window lookups.
- **🔀 Deterministic Fisher-Yates Question & Option Shuffling**: Seeded per-session question and option permutation prevents adjacent screen-peeking while preserving accurate grading.
- **📊 Student Report Card & Topic Mastery Radar**: Instant post-submission and proctor-accessible report cards featuring a Chart.js Topic Mastery Radar Chart, letter grade ($A+$ to $F$), cohort percentile ranking, tamper-evident Certificate ID hash, itemized question explanations, and printable/exportable transcripts.
- **📈 Proctor Analytics Suite (Chart.js)**: 4 interactive charts visualizing cohort score distributions, violation frequency breakdowns, temporal incident spikes, and integrity-to-performance correlations with local CSV export.
- **🎨 Warm Alabaster Light & Dark Glassmorphic Themes**: Defaults to the **Warm Alabaster** light theme with a stationary 1-click **Light / Dark Mode toggle** and 4 selectable design presets (`Warm Alabaster`, `Obsidian Frosted`, `Smoky Charcoal`, `Luminous Iridescent`).

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER (ON-DEVICE)                             │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│        CANDIDATE PORTAL                │          PROCTOR COMMAND CENTER         │
│  ┌──────────────────────────────────┐  │  ┌───────────────────────────────────┐  │
│  │ 1. Biometric Calibration         │  │  │ 1. Live Surveillance Grid         │  │
│  │    • Camera/Mic Permission       │  │  │    • Multi-Stream Status Cards    │  │
│  │    • Liveness & Glare Check      │  │  │    • Direct Warning Broadcast     │  │
│  ├──────────────────────────────────┤  │  ├───────────────────────────────────┤  │
│  │ 2. Secure Exam Room              │  │  │ 2. Proctor Analytics (Chart.js)   │  │
│  │    • TensorFlow.js COCO-SSD      │  │  │    • Score Distribution Bar       │  │
│  │    • 2D Laplacian Moiré Engine   │  │  │    • Violation Type Doughnut      │  │
│  │    • Web Audio FFT Speech Detect │  │  │    • Temporal Spike Line Chart    │  │
│  │    • Tab & Fullscreen Lock       │  │  │    • Integrity vs Score Matrix    │  │
│  ├──────────────────────────────────┤  │  ├───────────────────────────────────┤  │
│  │ 3. Student Report Card           │  │  │ 3. Forensic Evidence Audit        │  │
│  │    • Topic Mastery Radar Chart   │  │  │    • Snapshot & Bounding Boxes    │  │
│  │    • Letter Grade & Percentile   │  │  │    • Upheld / Dismissed Verdict   │  │
│  │    • Itemized Answer Explanations│  │  │ 4. Anti-Spoof Lab & Doc Scanner   │  │
│  └───────────────┬──────────────────┘  └───────────────────▲──────────────────┘  │
└──────────────────┼─────────────────────────────────────────┼─────────────────────┘
                   │ REST JSON Sync (/api/*)                 │
                   ▼                                         │
┌────────────────────────────────────────────────────────────┴─────────────────────┐
│                     EXPRESS BACKEND SERVER (server.ts : 3000)                    │
│  • In-Memory Session Store   • Exam & Question Registry   • Violation Evidence   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Local Neural & Computer Vision Pipeline

Implemented in `src/utils/localNeuralDetector.ts`:

| Detection Layer | Algorithm / API | Violation Triggered |
| :--- | :--- | :--- |
| **Object & Device Detection** | TensorFlow.js `coco-ssd` (`lite_mobilenet_v2`) | `MOBILE_PHONE_DETECTED`, `MULTIPLE_FACES_DETECTED`, `FACE_NOT_FOUND` |
| **Screen Replay / Moiré Detection** | 2D Laplacian Edge Variance & High-Frequency Grid Analysis | `SCREEN_REPLAY_ATTACK` |
| **Printed Photo Spoof Detection** | Temporal Frame-Delta Micro-Motion & Specular Glare Analysis | `SPOOF_PHOTO_ATTACK` |
| **Gaze & Head Pose Tracking** | Luminance Centroid Symmetry & Horizontal Eye-Zone Balance | `SUSPICIOUS_GAZE_DEVIATION` |
| **Acoustic Voice Monitoring** | Web Audio `AnalyserNode` Human Speech Band ($300\text{–}3400\text{ Hz}$) | `AUDIO_VOICE_DETECTED` |
| **Environment Lock** | Page Visibility API & Fullscreen API | `TAB_SWITCH_ATTACK`, `FULLSCREEN_EXITED` |

---

## 📂 Project Structure

```text
/
├── README.md                            # GitHub repository documentation
├── index.html                           # HTML5 shell & typography imports
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

## 🔌 REST API Endpoints (`server.ts`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/exams` | Retrieve all configured examinations and question banks |
| `POST` | `/api/exams` | Create a newly scanned or authored examination |
| `PATCH` | `/api/exams/:id/settings` | Toggle exam security settings (e.g., question/option randomization) |
| `POST` | `/api/exams/:id/questions` | Append a new question to an existing exam |
| `GET` | `/api/sessions` | List all active and submitted candidate sessions |
| `POST` | `/api/sessions` | Register or update a candidate examination session |
| `PATCH` | `/api/sessions/:id` | Update candidate score, integrity rating, or submission status |
| `GET` | `/api/violations` | Retrieve all logged proctoring violation records |
| `POST` | `/api/violations` | Log a new timestamped violation with snapshot evidence and bounding boxes |
| `PATCH` | `/api/violations/:id/review` | Adjudicate a violation (`UPHELD` or `DISMISSED`) with proctor notes |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- Modern browser with WebGL and Webcam/Microphone permissions (`getUserMedia`)

### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/garv0207s/ordeal.git
cd ordeal

# 2. Install dependencies
npm install

# 3. Start the full-stack development server on http://localhost:3000
npm run dev

# 4. Type-check TypeScript
npm run lint

# 5. Build for production
npm run build
```

### Quick Demo Access
On the **Login Screen**, use the built-in 1-click demo shortcuts:
- **Candidate Demo**: Click **`1-Click Candidate Demo: Abhijeet (STD-2026-904)`** to test biometric calibration, live proctoring, exam submission, and the Student Report Card.
- **Proctor Demo**: Switch to the **Proctor Center** tab and click **`1-Click Demo: Chief Proctor Henderson (PRC-801)`** to explore the Surveillance Grid, Chart.js Analytics, Report Card inspector, Forensic Evidence Audit, and Anti-Spoof Lab.

---

## 📄 License

Distributed under the **Apache-2.0 License**.
