# Ordeal: 100% Local ML Tracking & On-Device Processing Architecture

## Executive Summary
This architectural transition converts **Ordeal** into a fully autonomous, privacy-preserving, air-gapped examination system that relies **exclusively on local client-side ML libraries and on-device algorithms**, completely eliminating any dependencies on external cloud AI models. Real-time object and candidate detection will execute in-browser using **TensorFlow.js and COCO-SSD**, liveness and anti-spoofing will run via **2D frequency Laplacian texture analysis, optical flow motion scoring, and physiological blink tracking**, document test ingestion will operate through **local in-browser OCR and structured format parsing**, and MCQ distractors will be generated via **on-device pedagogical algorithms**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user:
> - **Local ML Tracking Stack**: **TensorFlow.js (`@tensorflow/tfjs`) with the COCO-SSD model (`@tensorflow-models/coco-ssd`)** running locally on WebGL/WASM in the client browser for zero-latency, real-time bounding box object detection (phones, multiple persons, books, laptops).
> - **Document Scanning**: Dual-mode **local OCR engine and structured test format parser** running entirely on-device, extracting questions, choices, and answers without sending documents to external cloud APIs.
> - **Zero External AI Dependency**: Complete removal of external cloud API dependencies. All vision inspection, liveness verification, proctoring metrics, and distractor generation will execute locally.

---

## 1. Overview & Core Concept

- **What It Does**:
  - **Local Real-Time Neural Object Detection**: TensorFlow.js COCO-SSD neural network processes webcam frames at 15–30 FPS directly on the client's GPU via WebGL. Detects `cell phone`, `laptop`, `book`, and tracks `person` count (detecting candidate absence or multiple persons).
  - **Local Computer Vision Anti-Spoofing & Liveness**:
    - *High-Frequency 2D Laplacian Moiré Filter*: Distinguishes digital screen pixel lattices and halftone printouts from live human skin.
    - *Optical Flow Motion Analysis*: Detects rigid 2D planar movement and 0% motion characteristic of printed photo attacks.
    - *Eye Aspect Ratio (EAR) & Physiological Blink Tracking*: Confirms spontaneous micro-saccades and authentic blinking.
    - *Active Liveness Challenge Protocol*: Interactive challenges ("Blink 2 times", "Turn head left") verified entirely client-side.
  - **On-Device Document Test Scanner & Parser**:
    - In-browser local OCR engine and structured regex/token parser that ingests text, images, or camera snapshots of physical paper, identifying questions, options ($A, B, C, D$), and answer keys.
  - **Local Algorithmic Distractor Generator**:
    - Synthesizes realistic, pedagogically sound MCQ wrong options using contrastive domain term permutation, inverted logic modifiers, and educational distractors without cloud API calls.

---

## 2. User Experience & Visual Design

### Glassmorphic Theme & Local ML HUD
- The luxury **Glassmorphic UI** (Obsidian Frosted, Smoky Charcoal, Luminous Iridescent) remains preserved.
- **Local Neural HUD Overlay**:
  - Displays real-time bounding boxes directly output by the local TensorFlow COCO-SSD model (`cell phone`, `person: 1`, `laptop`).
  - Local ML status badge: `TensorFlow.js WebGL (Local ML Active · 0ms Cloud Latency)`.
  - Offline-safe, air-gapped icon indicating complete local privacy.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Ordeal Local ML Pipeline                        │
├────────────────────────────────────────────────────────────────────────┤
│  Webcam Stream (HTMLVideoElement)                                      │
│    ├── 1. TensorFlow.js COCO-SSD (Local WebGL Neural Net)              │
│    │     • Phone Detection (`cell phone` > 60% confidence)             │
│    │     • Person Count (0 = Absent, 1 = Live, >1 = Multiple Persons)  │
│    │     • Secondary Monitors / Laptops / Books                        │
│    ├── 2. Local Computer Vision Anti-Spoofing (HTML5 Canvas 2D)        │
│    │     • 2D Laplacian Frequency Moiré (Screen Replay Detection)      │
│    │     • Optical Flow Motion Delta (Static Photo Attack Detection)   │
│    │     • Eye Aspect Ratio & Blink Physiological Tracker              │
│    └── 3. Local Web Audio API RMS Meter (Ambient Speech & Noise)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: TensorFlow.js & COCO-SSD Execution in WebGL**:
  - *Approach*: Load `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd` asynchronously in the browser. Fall back to high-speed canvas computer vision heuristics if WebGL is unavailable on older hardware.
  - *Why*: Provides genuine deep learning object detection for mobile phones, laptops, and human counting directly in the browser with 0 external network requests and 0 API cost.

- **Decision 2: Local Document Parsing & In-Browser OCR**:
  - *Approach*: Implement an intelligent client-side document scanner that combines adaptive thresholding/contrast enhancement with a robust rule-based structured MCQ tokenizer (parsing question patterns, options A-D, answers, and explanations).
  - *Why*: Allows instant ingestion of any test document (files or webcam photo) with zero dependency on external vision APIs.

- **Decision 3: On-Device Algorithmic Distractor Generation**:
  - *Approach*: Implement domain-specific algorithmic distractor generation using semantic inversion, common conceptual misconceptions, and syntactic permutation on the correct answer.
  - *Why*: Delivers instant (<50ms) wrong option synthesis directly in the browser.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client-Side (React SPA)                       │
├────────────────────────────────────────────────────────────────────────┤
│  src/utils/localNeuralDetector.ts (NEW)                                │
│    ├── tf.ready() & cocoSsd.load({ base: 'lite_mobilenet_v2' })        │
│    ├── model.detect(videoElement) -> [{ class, bbox, score }]          │
│    └── Anti-spoof Laplacian Moiré + Optical Flow + EAR Blink Tracker   │
│                                                                        │
│  src/utils/localDocumentScanner.ts (NEW)                               │
│    ├── Canvas adaptive binarization & image pre-processing             │
│    └── Structured MCQ regex & format parser (A/B/C/D, answers, points) │
│                                                                        │
│  src/utils/localDistractorGenerator.ts (NEW)                           │
│    └── Algorithmic wrong option generation (Domain rules & permutations│
│                                                                        │
│  Components:                                                           │
│    • ExamRoom.tsx (Render local TensorFlow bounding boxes & HUD)       │
│    • StudentVerification.tsx (Local 3D active liveness challenges)     │
│    • DocumentScannerModal.tsx (Local document scanner & parser)        │
│    • QuestionBuilderModal.tsx (Local distractor generation button)     │
│    • AntiSpoofingLab.tsx (Real-time local ML diagnostics & benchmarks) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Local in-memory session sync
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express Backend (server.ts)                       │
├────────────────────────────────────────────────────────────────────────┤
│  • Storage of Exams, Sessions, and Violations in local memory          │
│  • Pure data persistence without any external AI model calls           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Execution Plan Upon Approval

1. **Install Local ML Dependencies**:
   - Install `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd` via `install_applet_package`.

2. **Implement Local Neural Detector (`src/utils/localNeuralDetector.ts`)**:
   - Initialize TensorFlow.js with WebGL backend.
   - Load COCO-SSD Mobilenet model for real-time local object classification (`cell phone`, `person`, `laptop`, `book`).
   - Integrate with 2D Laplacian frequency texture analysis and optical flow motion detection for anti-spoofing.

3. **Implement Local Document Scanner & Parser (`src/utils/localDocumentScanner.ts`)**:
   - Local image pre-processing with Canvas high-pass contrast filters.
   - Structured MCQ parsing engine extracting questions, options, and answers from text or document snapshots.

4. **Implement Local Algorithmic Distractor Generator (`src/utils/localDistractorGenerator.ts`)**:
   - Rule-based pedagogical distractor engine generating 3 plausible alternatives on-device.

5. **Update Server & Client Components**:
   - Strip external Gemini model calls from `server.ts` and components.
   - Wire `ExamRoom.tsx`, `StudentVerification.tsx`, and `AntiSpoofingLab.tsx` to the local TensorFlow detector.
   - Wire `DocumentScannerModal.tsx` and `QuestionBuilderModal.tsx` to the local document parser and distractor engine.
   - Verify compilation and linting.
