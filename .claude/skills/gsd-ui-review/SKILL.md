---
name: gsd-ui-review
description: "Retroactive 6-pillar visual audit of implemented frontend code"
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Conduct a retroactive 6-pillar visual audit grounded in DESIGN.md.
Produces UI-REVIEW.md with graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ui-review.md
@~/.claude/get-shit-done/references/ui-brand.md
@/DESIGN.md
</execution_context>

<design_canon>
**MANDATORY pre-flight (BLOCKING):**

Read `/DESIGN.md` before grading any pillar. UI-REVIEW.md MUST score against DESIGN.md — not against generic "good UI" intuition.

**Pillar 1 (Tokens / DESIGN.md compliance) — automatic FAIL if any of:**
- Inline hex/RGB/px values present in committed code where a token exists in `app/tokens.css` / `tailwind.config.ts` / `tokens/index.ts`.
- Off-grid spacing or off-palette colors anywhere in the audited surface.
- Components hand-rolled instead of composing `styles/components.css` primitives where applicable.
- Tailwind `bg-[#xxxxxx]` / `text-[Npx]` arbitrary values where a token exists.

**Pillar 2 (Accessibility) — score reflects:**
- Focus rings: 2px solid Protocol Mint, 2px offset, never suppressed.
- WCAG 2.1 contrast: AA min, AAA on body + primary tokens.
- State color never the only signal (text/icon pair required).
- Skip-to-content link as first focusable.
- Modal focus trap + Esc close.
- `aria-live` on toasts (`polite` info/success, `assertive` error).
- `prefers-reduced-motion` collapses durations to 0ms; kernel-pulse freezes.
- Touch targets ≥44px on `(pointer: coarse)`.

**Pillar 3 (Typography) — score reflects:**
- JetBrains Mono on h1–h4, display, code; Inter on body/UI. No third typeface.
- Major Third (1.250) scale honored; step-down at < 768px.
- `tnum` enabled in tables; `liga + calt` enabled in code blocks.
- Body copy ≤75ch.
- Italic only on body emphasis; uppercase only on `label-caps` with positive tracking.

**Pillar 4 (Layout / Spacing) — score reflects:**
- 8px grid throughout; no off-grid values.
- ≥30% empty surface in compositions.
- Container widths: prose 720, container 1280, modal 560, toast 360.
- Vertical rhythm `xxl/xl/lg/md` for landing-page cadence.

**Pillar 5 (Motion) — score reflects:**
- Default `duration-base 150ms ease-out`; modal `duration-slow 300ms`.
- Status-dot pulse is the ONLY signature animation.
- No parallax, no Lottie, no typewriter, no spring overshoot/bounce.
- Reduced-motion respected.

**Pillar 6 (Surface / Brand consistency) — score reflects:**
- Default dark; surface `#0A0E14`, never `#000000`.
- Single Protocol Mint signal per primary view; <5% of composition; never as large fill.
- Borders over shadows on dark; shadows only on popover/modal/toast.
- Code blocks rendered inside `.c-terminal` frame.
- No emoji, no exclamation points, no banned lexicon (`synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` as softener).

**Scoring scale (per pillar):** 1 (fails) · 2 (partial) · 3 (meets) · 4 (exceeds).
**Phase-level FAIL:** any Pillar 1 violation, OR any pillar scoring 1, OR Pillar 2 below 3.
</design_canon>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute @~/.claude/get-shit-done/workflows/ui-review.md end-to-end.
Preserve all workflow gates.
Anchor every pillar score to a DESIGN.md citation. Quote the rule, then quote the offending code.
</process>
