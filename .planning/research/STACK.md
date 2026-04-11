# Stack Research: v3.4.0 Complete Branding Engine

Researched: 2026-04-11
Scope: New capabilities only for concept/pain mapping -> strategy -> visual identity -> design tokens -> shadcn/ui contract -> Next.js starter.

## Current baseline

- App foundation is already aligned: Next.js App Router (next ^15.2.0), React 19, TypeScript.
- Existing theme primitives exist but are minimal and manual: semantic token list and merge logic in lib/markos/theme/tokens.ts and lib/markos/theme/brand-pack.ts.
- UI is mostly CSS modules and inline styles; no active Tailwind v4 pipeline files are present (no tailwind.config/postcss config), and shadcn is not initialized (no components.json).
- Storybook + Chromatic + UI a11y/security test lanes already exist and should be reused for branding-system verification.

## Required additions/updates

1. Tailwind v4 activation for canonical theming
- Add Tailwind v4 and PostCSS integration to Next.js app.
- Define CSS variable based theme contract in a global stylesheet and map existing semantic tokens into those variables.

2. shadcn/ui initialization and contract hardening
- Initialize shadcn for App Router + Tailwind v4.
- Standardize component variants/states with reusable class composition utilities.

3. Branding engine schema + compiler layer
- Add typed schemas for: concept/pain map, strategy artifact, visual identity artifact, token artifact, component contract artifact.
- Add deterministic compilers that transform one stage into the next with stable output hashes/snapshots.

4. Accessibility and token quality gates
- Add contrast/readability validation during token compilation.
- Fail build/test on invalid semantic token output for canonical themes.

5. Next.js starter output generator
- Add starter template emitters that produce: theme CSS variables, shadcn-compatible component tokens/variants, and page scaffold examples.

## Library/version recommendations

Install or update for v3.4.0:

| Package | Version | Why now |
|---|---|---|
| tailwindcss | ^4.0.0 | Canonical styling runtime for milestone outputs |
| @tailwindcss/postcss | ^4.0.0 | Required PostCSS bridge for Tailwind v4 |
| shadcn | latest (dev tool) | Generate canonical component primitives/registry wiring |
| class-variance-authority | ^0.7.1 | Deterministic variant contracts for shadcn component states |
| clsx | ^2.1.1 | Lightweight conditional class composition |
| tailwind-merge | ^3.0.0 | Conflict-safe Tailwind class merging in composed components |
| lucide-react | ^0.4.0 | Canonical icon primitives aligned with shadcn patterns |
| zod | ^3.24.0 | Typed validation for strategy/identity/token/component artifacts |
| culori | ^4.0.0 | Programmatic color scale generation and conversions for identity outputs |
| wcag-contrast | ^3.0.0 | Deterministic contrast checks in token compiler validation |

Notes:
- Keep next and react on current major line (already suitable).
- Reuse existing Storybook/Chromatic stack; do not replace test runners.

## Integration points

- Token source compatibility: extend, do not replace, existing token contracts in lib/markos/theme/tokens.ts and lib/markos/theme/brand-pack.ts.
- Theme settings route: evolve app/(markos)/settings/theme/page.tsx from preview to full artifact inspector and approval surface.
- Layout migration path: progressively map app/(markos)/layout-shell.module.css tokens to Tailwind v4 + CSS variables, avoiding full rewrite in one step.
- Component contract location: add canonical shadcn-based components under components/ui/ and wire existing route components gradually.
- Verification: plug token/compiler snapshot tests into node --test and keep visual diffs in Storybook/Chromatic.

## What not to add

- No alternate UI framework (MUI, Chakra, Mantine, Ant Design).
- No CSS-in-JS stack migration (styled-components, Emotion, Stitches).
- No full design tool pipeline coupling in this milestone (for example Figma API sync as a hard dependency).
- No new state management framework just for theming (Redux/Zustand) unless a non-UI requirement later forces it.
- No CRM/outbound stack expansion work unless directly required for branding artifact dependency wiring.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tailwind v4 introduction causes styling regressions in existing CSS module pages | Medium | Phase in via CSS variables first, then component-by-component migration with snapshot + Storybook diffs |
| Non-deterministic strategy/token generation breaks repeatability | High | Use strict zod schemas + stable sort/normalization + golden snapshot tests per artifact stage |
| shadcn adoption drifts from existing token naming | High | Enforce token alias map between existing semantic names and shadcn CSS variables before component rollout |
| Accessibility regressions from expressive palettes | High | Run contrast checks at compile time and block invalid themes from promotion |
| Scope creep into full replatform | Medium | Keep milestone output focused on compiler + contract + starter; postpone broad UI rewrite to follow-up phases |
