<markos_ui_canon>
<purpose>Pointer to the canonical visual design contract for MarkOS surfaces.</purpose>

<rule>Read /DESIGN.md before any UI/CSS/Tailwind/Storybook/CLI-output work. This file is a pointer — do not duplicate token values here.</rule>

<canonical>
<file path="/DESIGN.md">Single source of truth: tokens, typography, components, motion, accessibility, do/don't, agent prompt guide, Tailwind theme, CSS vars, CI workflow, versioning.</file>
</canonical>

<derived_artifacts>
<file path="/tokens/tokens.json">W3C DTCG export (auto-generated from DESIGN.md).</file>
<file path="/tailwind.config.ts">Tailwind theme config (auto-generated).</file>
<file path="/app/tokens.css">CSS custom properties on :root + light theme + reduced motion + forced-colors.</file>
<file path="/app/globals.css">Reset, base typography, focus ring, container, section rhythm.</file>
<file path="/styles/components.css">Primitives: .c-button, .c-input, .c-card, .c-nav-link, .c-chip, .c-chip-protocol, .c-badge, .c-code-inline, .c-code-block, .c-terminal, .c-modal, .c-toast, .c-status-dot.</file>
<file path="/tokens/index.ts">TypeScript-typed token export for JS-driven theming.</file>
</derived_artifacts>

<integration_links>
<link path="../CLAUDE.md#visual-design-canon--designmd">CLAUDE.md section with full integration rules and skill enforcement.</link>
<link path="../AGENTS.md#visual-design-canon--designmd-mandatory-before-any-ui-work">AGENTS.md mirror for non-Claude agents.</link>
<link path="../.claude/get-shit-done/references/ui-brand.md">GSD UI reference — Section A: orchestrator CLI patterns; Section B: product visual canon (DESIGN.md pointer).</link>
<link path="../.claude/skills/gsd-ui-phase/SKILL.md">UI-SPEC.md generation; design_canon block enforces token-only authoring.</link>
<link path="../.claude/skills/gsd-ui-review/SKILL.md">UI-REVIEW.md; 6-pillar audit anchored to DESIGN.md citations.</link>
<link path="../obsidian/reference/UI Components.md">React component tree (complementary; component layout, not visual primitives).</link>
</integration_links>

<non_negotiable_rules>
<rule>Default dark · surface #0A0E14 · never #000000.</rule>
<rule>Single signal · primary #00D9A3 · &lt;5% of composition · never as large fill.</rule>
<rule>Two typefaces · JetBrains Mono + Inter · no third.</rule>
<rule>8px grid · 0/2/8/16/24/32/48/96 · off-grid is a bug.</rule>
<rule>Borders over shadows on dark · 1px #2D3441 hairline.</rule>
<rule>Focus ring · 2px solid #00D9A3 · 2px offset · never suppressed.</rule>
<rule>WCAG 2.1 AA min · AAA on body + primary tokens · state never the only signal.</rule>
<rule>Whitespace as primitive · ≥30% empty surface.</rule>
<rule>No emoji in product/CLI/docs · no exclamation points · banned lexicon enforced.</rule>
<rule>No gradients, glow, soft shadows on cards, Lottie, parallax, typewriter, spring overshoot.</rule>
<rule>prefers-reduced-motion · collapses to 0ms · kernel-pulse freezes at full opacity.</rule>
</non_negotiable_rules>

<ci_workflow>
<step>Pre-commit: npx @google/design.md lint DESIGN.md</step>
<step>PR diff: npx @google/design.md diff origin/main:DESIGN.md DESIGN.md</step>
<step>Token-export drift: re-export Tailwind/DTCG; diff against committed artifacts.</step>
<step>WCAG: contrast-ratio rule warns below 4.5:1; treated as error in CI for component tokens.</step>
</ci_workflow>
</markos_ui_canon>
