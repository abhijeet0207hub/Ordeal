# Ordeal: Student Report Card & In-Depth Performance Analysis

## Executive Summary
This architectural enhancement introduces a comprehensive, glassmorphic **Student Report Card and Performance Analysis** engine for **Ordeal**. Displayed both on the **candidate result screen upon exam submission** and within the **proctor review interface**, it delivers a multi-dimensional academic evaluation featuring a **Chart.js Topic Mastery Radar Chart**, **score and question-level breakdowns**, **cohort percentile rankings**, and **tamper-proof integrity audit certification**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user:
> - **Display Locations**: Embedded seamlessly into both the **Candidate Result Screen** immediately upon exam submission and accessible inside the **Proctor Review Interface** for granular candidate audits.
> - **Analytical Breakdowns**: Incorporates a **Topic Mastery Radar Chart (Chart.js)**, **Score & Question Accuracy Breakdown**, and **Cohort Percentile Ranking**.
> - **Zero External Telemetry**: 100% of score analysis, percentile calculations, topic skill indexing, and radar charts are computed on-device in-browser directly from local session data.

---

## 1. Overview & Core Concept

- **What It Does**:
  - **Comprehensive Academic Report Card**:
    - Final letter grade ($A+, A, B, C, F$), total marks achieved, percentage, and pass/fail verdict.
    - Question accuracy summary: answered, correct, incorrect, points distribution.
  - **Cohort Percentile Ranking**:
    - Calculates the candidate's exact percentile position against all cohort exam sessions (e.g. $92\text{nd}$ percentile).
    - Comparative score vs. cohort mean and exam time efficiency benchmark.
  - **Topic / Domain Mastery Radar Chart**:
    - Chart.js Radar visualization mapping candidate proficiency across core syllabus modules (e.g., *Distributed Consensus*, *Network Protocols*, *System Concurrency*, *Cryptographic Security*, *Adversarial Robustness*).
    - Visual overlay comparing Candidate Score vs. Passing Baseline.
  - **Proctor Integrity & Security Audit**:
    - Displays overall Integrity Score, verified liveness authenticity index, zero-spoof confirmation, and list of any flagged behavioral incidents.
    - Generates a local, tamper-evident Verification ID / Certificate Hash for official academic archiving.
  - **Granular Question Review**:
    - Itemized review showing candidate's response, correct answer, score points, and pedagogical explanation.
  - **Print & Export**:
    - Clean printer-friendly print stylesheet (`@media print`) and local in-memory transcript export.

---

## 2. User Experience & Visual Design

### Dual-Access Integration
1. **Candidate Exam Room Flow**:
   - Upon submitting the test (or timeout), the candidate transitions to the interactive **Report Card View**.
   - Displays animated score counters, the interactive Topic Mastery Radar, percentile badge, and printable certificate.
2. **Proctor Surveillance & Review Flow**:
   - In `ProctorDashboard.tsx` and `ProctorAnalytics.tsx`, clicking any examinee row or focus card opens the full Report Card in an inspectable modal/view, allowing proctors to evaluate academic skill alongside surveillance snapshots.

### Visual Styling & Theme Harmony
- Preserves the luxury **Glassmorphic UI** (`theme.cardBg`, `theme.border`, `theme.glow`) with translucent dark acrylic styling.
- Typographic hierarchy using `Plus Jakarta Sans` for headers, `JetBrains Mono` with `tabular-nums` for numeric grades and percentiles, and zero static pill capsules.
- Chart.js Radar Chart rendered with cyan/indigo semi-transparent polygon fills, responsive resizing, and high-contrast dark tooltips.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Universal Shared Component (`StudentReportCard.tsx`)**:
  - *Chosen Approach*: Build a modular, standalone component that accepts `session`, `exam`, `cohortSessions`, and `theme`, rendered identically in both candidate submission and proctor audit.
  - *Why*: Guarantees single-source-of-truth accuracy between what the student sees and what the supervisory proctor reviews.

- **Decision 2: Client-Side Topic Mastery Categorization**:
  - *Chosen Approach*: Algorithmically tag and group exam questions by domain category or explicit tags, calculating candidate accuracy per category to drive the radar chart dynamically.
  - *Why*: Eliminates hardcoding; any scanned or custom-authored exam dynamically generates its own topic radar dimensions.

- **Decision 3: In-Browser Percentile & Cohort Normalization**:
  - *Chosen Approach*: Rank all active and submitted sessions in memory to calculate true mathematical percentile:
    $$\text{Percentile} = \left(\frac{\text{Count of cohort scores below candidate}}{\text{Total cohort examinees}}\right) \times 100$$
  - *Why*: Provides genuine competitive feedback without external servers.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Report Card Architecture                        │
├────────────────────────────────────────────────────────────────────────┤
│  src/components/StudentReportCard.tsx (NEW)                           │
│    ├── Header & Grade Banner (Letter Grade, Pass/Fail, Percentile)     │
│    ├── Chart.js Topic Mastery Radar Chart (RadialLinearScale)          │
│    ├── Cohort Comparison Metrics (Candidate vs Mean, Speed Benchmark)  │
│    ├── Proctoring & Integrity Seal (Integrity %, Liveness, Incidents)  │
│    ├── Itemized Question Accuracy & Answer Key Review                  │
│    └── Local Print & JSON/CSV Export Triggers                          │
│                                                                        │
│  Integration Points:                                                   │
│    • ExamRoom.tsx: Replace basic end screen with StudentReportCard     │
│    • ProctorDashboard.tsx: Add "View Full Report Card" action button   │
│    • ProctorAnalytics.tsx: Connect examinee table to Report Card Modal │
└────────────────────────────────────────────────────────────────────────┘
```

### Verification & Validation Plan
1. **Type Safety & Linting**: Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
2. **Build Verification**: Run `compile_applet` (`vite build`) to confirm clean asset bundling.
3. **End-to-End Test**:
   - Complete exam as candidate (Abhijeet) -> Submit -> Verify instant Report Card render, Radar chart display, and Percentile calculations.
   - Switch to Proctor portal -> Select candidate -> Open Report Card audit modal -> Verify identical score, radar, and integrity telemetry.
