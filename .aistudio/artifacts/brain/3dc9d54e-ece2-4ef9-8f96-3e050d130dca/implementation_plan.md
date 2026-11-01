# Ordeal: Aesthetic Light Theme (Warm Alabaster & Sage Ceramic)

## Executive Summary
This design architecture introduces **Warm Alabaster & Sage Ceramic** as the **default aesthetic light design system** across **Ordeal**, paired with a persistent **Light/Dark Mode toggle** and fine-grained glass style presets. Replacing the previous dark-only default, this system delivers an artisanal, tactile aesthetic with warm porcelain backgrounds, soft ceramic glass cards, natural sage green accents, crisp charcoal typography, and adapted Chart.js visualizations.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:
> - **Visual Palette & Mood**: **Warm Alabaster with soft ceramic tones and sage accents** — an organic, editorial aesthetic featuring warm linen/porcelain gradients (`#fbfaf8` to `#ece7df`), ceramic acrylic cards with soft multi-layered diffused shadows, sage green highlights (`#4d7c5f`), and warm graphite typography (`#1c1917` / `#44403c`).
> - **Integration Model**: **Make aesthetic light theme default with dark mode toggle** — the app will load by default in Warm Alabaster, with a prominent Sun/Moon toggle in the navigation bar to immediately switch between Warm Alabaster (Light) and Obsidian Frosted (Dark), while keeping fine-grained theme styles selectable.
> - **Zero Feature or Contrast Degradation**: All real-time telemetry, neural vision HUD bounding boxes, proctoring feeds, Chart.js radar charts, and student verification cards maintain strict WCAG AA contrast and anti-glare readability.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Sets **Warm Alabaster (`alabaster`)** as the platform-wide default visual theme.
  - Adds a dedicated, intuitive **Light/Dark mode toggle button** (Sun/Moon icons) in the top navbar and login portal.
  - Retains existing dark glass systems (`obsidian`, `smoky`, `iridescent`) for users who prefer nighttime or low-light monitoring.
  - Adapts all interface cards, navigation bars, modal dialogs, candidate streams, and audit tables with light-aware typography and translucent ceramic glass styling.
  - Automatically updates Chart.js axes, radar polygon grids, and tooltip contrasts based on whether light or dark mode is active.

- **Target Audience & Value**:
  - Academic institutions, proctors, and examinees who prefer an elegant, daylight-friendly environment that feels like premium stationery or an architectural studio rather than a dark terminal.
  - Reduces eye fatigue during long 60+ minute proctored examinations in well-lit rooms.

---

## 2. User Experience & Visual Design

### A. Color Palette & Material Tokens
- **Background Atmosphere**:
  - Light mode canvas: Warm ivory & linen ceramic gradient (`from-[#fdfcf9] via-[#f7f4ee] to-[#ebe5db]`).
  - Dark mode canvas: Preserved obsidian slate (`from-slate-950 via-slate-900 to-emerald-950/40`).
- **Ceramic Glass Card (`cardBg`, `cardBorder`, `glow`)**:
  - Background: `rgba(255, 255, 255, 0.88)` with `backdrop-blur-xl`.
  - Border: Soft stone hairline `border-[#e3ddd3] hover:border-[#cfc7b9]`.
  - Shadows: Multi-stop diffused ambient shadow `shadow-[0_12px_36px_-6px_rgba(44,39,32,0.06),0_2px_8px_-2px_rgba(44,39,32,0.04)]`.
- **Accent & Primary Action Tokens**:
  - Sage primary button: `bg-gradient-to-r from-[#446b52] to-[#598c6d] hover:from-[#3a5d46] hover:to-[#4e7d5f] text-white shadow-md shadow-[#446b52]/20`.
  - Sage tag/badge: `bg-[#4d7c5f]/10 text-[#31573e] border border-[#4d7c5f]/25`.
- **Typography & Readability**:
  - Primary headings & titles: Warm charcoal `#1c1917` (Stone 900) for sharp, fatigue-free contrast.
  - Secondary metadata & subheads: Slate-stone `#57534e` (Stone 600).
  - Monospace telemetry & timers: `#292524` with tabular numerals (`tabular-nums font-mono`).

### B. Navbar & Mode Switching Experience
- **One-Click Sun/Moon Toggle**: Positioned next to the user profile in the top navbar:
  - When in Light mode: Displays a clean Moon icon (`Switch to Dark Mode`).
  - When in Dark mode: Displays an ambient Sun icon (`Switch to Light Mode`).
- **Granular Theme Preset Picker**: Preserved in both Navbar and Login Page, allowing examinees and proctors to freely choose between `Alabaster (Light)`, `Obsidian (Dark)`, `Smoky (Dark)`, and `Iridescent (Dark)`.

### C. Visual Harmony Across Key Views
- **Login Portal**:
  - Ceramic warm glass login chamber with soft ambient sand lighting, crisp input fields (`bg-white/80 border-[#e2dcd2] text-[#1c1917] placeholder-[#a8a29e]`), and sage action buttons.
- **Student Verification & Exam Chamber**:
  - Camera preview and HUD overlays styled with clean dark camera containers for optical contrast, enclosed in warm alabaster card frames.
  - Active question panels styled with crisp typography and subtle sage highlight borders on selected answers.
- **Student Report Card & Proctor Analytics**:
  - Radar and line charts dynamically adjust grid colors: light mode uses `#e2dcd2` grid lines and `#44403c` label text; dark mode uses `rgba(255, 255, 255, 0.12)` grid lines and `#cbd5e1` labels.
  - Transparent radar fill using sage/cyan translucent overlays.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Make `alabaster` the Default Active Theme**:
  - *Chosen Approach*: Initialize `currentTheme` in `App.tsx` and `LoginPage.tsx` to `'alabaster'`.
  - *Why*: Directly satisfies the user's primary requirement while ensuring new sessions immediately experience the aesthetic light theme.
  - *Fallback*: Users can switch back to dark mode with a single click.

- **Decision 2: Theme Object Structure Expansion (`mode: 'light' | 'dark'`)**:
  - *Chosen Approach*: Add `mode: 'light' | 'dark'` and semantic text classes (`textPrimary`, `textSecondary`, `textMuted`, `inputBg`, `inputBorder`) to `ThemeConfig` in `src/utils/theme.ts`.
  - *Why*: Eliminates fragile CSS hackery and provides clean, type-safe Tailwind classes for every component to render text and inputs with correct contrast.

- **Decision 3: Chart.js Dynamic Theme Adaptation**:
  - *Chosen Approach*: Pass `isDarkMode: boolean` or `currentTheme` to Chart.js configuration hooks in `ProctorAnalytics.tsx` and `StudentReportCard.tsx`, switching tick colors, tooltip backgrounds, and grid line opacities.
  - *Why*: Prevents invisible gray-on-white text in Chart.js canvas elements when switching from dark to light mode.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Theme Architecture                              │
├────────────────────────────────────────────────────────────────────────┤
│  src/utils/theme.ts                                                    │
│    ├── GlassTheme: 'alabaster' | 'obsidian' | 'smoky' | 'iridescent'   │
│    ├── Mode: 'light' | 'dark'                                          │
│    └── Theme Tokens: cardBg, navBg, textPrimary, textSecondary, etc.   │
│                                                                        │
│  src/App.tsx                                                           │
│    ├── Default Theme State: 'alabaster'                                │
│    ├── document.documentElement.classList ('light' vs 'dark')          │
│    └── Root Canvas: dynamic gradient from themeConfig.previewGradient │
│                                                                        │
│  src/components/Navbar.tsx                                             │
│    ├── Quick Sun/Moon Toggle Button (instant switch between Light/Dark)│
│    └── Dropdown Selector (Alabaster, Obsidian, Smoky, Iridescent)     │
│                                                                        │
│  src/components/StudentReportCard.tsx & ProctorAnalytics.tsx           │
│    └── Chart.js dynamic color palette (dark text on light canvas)      │
│                                                                        │
│  src/components/ExamRoom.tsx, LoginPage.tsx, StudentVerification.tsx    │
│    └── Contrast-aware typography and input styling                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Verification & Validation Plan
1. **Type Safety & Linting**: Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
2. **Build Verification**: Run `compile_applet` (`vite build`) to confirm clean asset bundling.
3. **End-to-End Visual Audit**:
   - Verify login screen in Warm Alabaster theme with crisp typography and contrast.
   - Verify top navbar Sun/Moon toggle switches seamlessly between Alabaster and Obsidian.
   - Verify Candidate Exam Room and Student Verification with camera feeds in light mode.
   - Verify Report Card Topic Radar Chart and Proctor Analytics with light-mode grid readability.
