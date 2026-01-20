# UI/UX Specifications

## Design Philosophy
The Game Stats UI is designed to be **informative, fast, and accessible**. It follows a "mobile-first" approach while providing a premium, data-rich experience for desktop users.

### Core Principles
1. **Clarity over Clutter**: Prioritize high-value data (scores, time, key stats).
2. **Immediate Feedback**: Use animations and transitions (Framer Motion) for score updates.
3. **Accessibility**: Full WCAG 2.1 compliance.
4. **Resiliency**: Robust offline support for scorekeepers.

---

## Visual Design System
Supported by **Tailwind CSS v4** and **shadcn/ui**.

### Color Palette
- **Primary**: Deep Blue (`#0F172A`) - Stability and professionalism.
- **Secondary**: Action Orange (`#F97316`) - Highlights live games and action buttons.
- **Surface**: Soft Gray (`#F8FAFC`) / Dark Mode (`#020617`).
- **Success**: Emerald (`#10B981`) - Goals and positive spirit scores.
- **Warning**: Amber (`#F59E0B`) - Stoppages and time warnings.

### Typography
- **Headings**: *Inter* or *Outfit* (Semi-bold to Bold).
- **Body**: *Inter* (Regular).
- **Monospace**: *JetBrains Mono* (Timer and raw data).

---

## Core Screens & Interaction Patterns

### 1. Live Game View
Inspired by high-end sports platforms (UltiScore, ESPN).
- **Header**: Large Score, Descending Timer (Red pulsate < 2 min).
- **Timeline**: Vertical goal track with player avatars.
- **Controls**: (Scorekeeper only) Large touch-friendly "+ Home" / "+ Away" buttons.
- **Stoppages**: Floating action button (FAB) to toggle timer stoppage.

### 2. Tournament Brackets
- **Layout**: Horizontal tree (Mermaid-style or custom SVG).
- **Interactivity**: Pan/Zoom support for large tournaments.
- **Live State**: Pulsing border for games currently in progress.

### 3. Analytics Dashboard
- **Controls**: Natural Language Input Bar (Ollama proxy).
- **Visuals**: Tremor-powered charts (Dynamic switching between Bar/Line/Donut).
- **Embedding**: Metabase iframes for complex historical analysis.

---

## Component Specifications (shadcn/ui extensions)

### Game Card
- **States**: `Scheduled`, `Live`, `Finished`, `Ended`.
- **Components**: Team Logo, Name, Score, Field Badge, Timer.

### Spirit Score Input
- **Pattern**: 5-point slider or star rating for the 5 Spirit categories:
  1. Rules Knowledge
  2. Fouls and Body Contact
  3. Fair-Mindedness
  4. Positive Attitude
  5. Communication

---

## Accessibility
- **Screen Readers**: Descriptive ARIA labels for score updates.
- **Keyboard Navigation**: Fully traversable brackets and menus.
- **Contrast**: High-contrast ratios preserved in Dark Mode.

---

## Assets
- Logos should be SVG where possible.
- Team/Player photos: WebP with lazy loading.
