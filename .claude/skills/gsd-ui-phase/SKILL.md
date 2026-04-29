---
name: gsd-ui-phase
description: "Generate UI design contract (UI-SPEC.md) for frontend phases"
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - AskUserQuestion
  - mcp__context7__*
---

<objective>
Create a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrates gsd-ui-researcher and gsd-ui-checker.
Flow: Validate → Read DESIGN.md → Research UI → Verify UI-SPEC → Done
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ui-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
@/DESIGN.md
</execution_context>

<design_canon>
**MANDATORY pre-flight (BLOCKING):**

1. Read `/DESIGN.md` (repo root) BEFORE invoking the researcher. It is the canonical visual contract — tokens, typography, components, motion, accessibility.
2. Pass `/DESIGN.md` into the gsd-ui-researcher subagent prompt as required reading.
3. UI-SPEC.md MUST cite DESIGN.md token names (e.g. `color.primary`, `spacing.md`, `radius.lg`, `typography.h1`, `motion.duration-base`) instead of raw hex / px / ms values.
4. The gsd-ui-checker BLOCKs the phase plan if UI-SPEC.md contains any of:
   - Off-token color values (any hex outside DESIGN.md palette).
   - Off-grid spacing (any value not in `0/2/8/16/24/32/48/96`).
   - Radii outside `0/2/4/6/8/12/9999`.
   - Typography outside the JetBrains Mono / Inter pair.
   - Missing focus-ring spec (every interactive element needs `2px solid #00D9A3 + 2px offset` or DESIGN.md replacement).
   - Missing `prefers-reduced-motion` handling on motion entries.
   - Any of the forbidden items: `#000000`, `#FFFFFF` outside light raised, cobalt-blue, gradients, drop shadows on cards, emoji, parallax, Lottie, typewriter reveals.
   - Banned lexicon in copy: `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just`.
5. UI-SPEC.md MUST include a "DESIGN.md compliance" section asserting each rule is satisfied with explicit token references.
6. If a needed value is not in DESIGN.md, STOP and surface a DESIGN.md amendment proposal — never invent off-token values.

The companion CSS/Tailwind/CSS-vars artifacts (`tokens/tokens.json`, `tailwind.config.ts`, `app/tokens.css`, `app/globals.css`, `styles/components.css`, `tokens/index.ts`) are derived from DESIGN.md. Component primitives in `styles/components.css` (e.g. `.c-button--primary`, `.c-card`, `.c-terminal`, `.c-status-dot--live`) are the preferred reuse layer — UI-SPEC.md should compose these where applicable instead of re-specifying tokens at the component level.
</design_canon>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute @~/.claude/get-shit-done/workflows/ui-phase.md end-to-end.
Preserve all workflow gates.
Add a DESIGN.md compliance gate before checkpoint: BLOCK if any rule in <design_canon> fails.
</process>
