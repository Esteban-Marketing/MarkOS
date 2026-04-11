# Domain Pitfalls

**Domain:** MarkOS v3.4.0 Complete Branding Engine (strategy -> identity -> design system -> Next.js output)
**Researched:** 2026-04-11

## Critical Pitfalls

### Pitfall 1: Strategy-to-UI Semantic Drift
**What goes wrong:** Messaging pillars and audience pain/need signals are captured in strategy artifacts, but token names, component variants, and copy scaffolds are generated without traceability to those signals.
**Why it happens:** The current codebase has token plumbing (`lib/markos/theme/brand-pack.ts`) and route shells, but no enforced schema linking strategy decisions to token/component generation.
**Consequences:** Brand outputs feel inconsistent across strategist and engineer handoff; repeated runs can produce coherent pieces that do not cohere as a system.
**Prevention:** Require a canonical intermediate schema (Brand Intent Graph) where every identity/token/component decision references strategy source IDs.
**Detection:** Contract test fails when any exported token/component lacks a `source_strategy_id` mapping; manual review finds contradictory tone/visual pairing.

### Pitfall 2: Token Contract Fragmentation Across Surfaces
**What goes wrong:** Some surfaces consume `brand-pack` tokens while others keep inline styles or route-local CSS assumptions.
**Why it happens:** Existing plugin/theme pages show mixed usage (token helpers plus hard-coded values), and broad `components/` coverage is still CRM-focused.
**Consequences:** White-label consistency breaks; theme changes appear partially applied; support burden rises.
**Prevention:** Define a mandatory token-only render contract for branding-affected UI with lint checks blocking raw color literals in target paths.
**Detection:** CI scan detects new hard-coded color/font/radius literals in branded surfaces; visual diff shows partial theme application.

### Pitfall 3: Accessibility Regressions from Expressive Palettes
**What goes wrong:** Generated palettes and type pairings look strong visually but violate WCAG contrast and readability constraints in real component states.
**Why it happens:** Current validation in `validateBrandPack` checks token key existence/hex format, not contrast pair outcomes or state-level accessibility.
**Consequences:** Non-compliant UI, poor readability, and expensive rework late in milestone.
**Prevention:** Add automated contrast matrix checks for token pairs and component state snapshots (default/hover/disabled/error) as merge gates.
**Detection:** `test:ui-a11y` fails on theme scenarios; Storybook a11y reports increase after identity changes.

### Pitfall 4: Non-Deterministic Branding Outputs
**What goes wrong:** Identical inputs generate materially different strategy, identity, or token outputs across runs.
**Why it happens:** Multi-stage generation lacks deterministic constraints and explicit stochastic boundaries.
**Consequences:** Teams cannot trust diffs, governance approvals stall, and versioning noise hides real changes.
**Prevention:** Lock deterministic sections (schema, token calculations, component contract) and isolate optional creative sections with explicit randomness flags.
**Detection:** Golden snapshot tests on repeated identical input produce diff churn beyond allowed sections.

## Moderate Pitfalls

### Pitfall 5: Handoff Artifacts Not Role-Executable
**What goes wrong:** Outputs exist, but strategist/designer/engineer/content roles still need clarification meetings to act.
**Prevention:** Add role-specific acceptance checklists and "next action" sections in every generated artifact.

### Pitfall 6: shadcn/ui Contract Overreach or Undercoverage
**What goes wrong:** "Complete" component library either tries to model too much (scope blow-up) or misses essential product primitives.
**Prevention:** Freeze a minimum canonical component set with required variants/states before implementation starts.

### Pitfall 7: Governance Lag Between Brand Versions and Runtime
**What goes wrong:** Brand versions are updated in docs/strategy but not propagated atomically to tokens/components/starter scaffolds.
**Prevention:** Treat brand release as a versioned bundle with one promotion command and rollback metadata.

## Minor Pitfalls

### Pitfall 8: Storybook/Chromatic Gate Drift
**What goes wrong:** New branding stories are added but not bound to existing quality gates from Phase 38.
**Prevention:** Extend existing UI gate scripts with branding scenario coverage and fail when missing.

### Pitfall 9: Performance Regression from Theme Over-Abstraction
**What goes wrong:** Runtime theming introduces excessive client-side recomputation or oversized token payloads.
**Prevention:** Keep compile-time token expansion for canonical outputs and measure route-level bundle impact.

## Prioritized Risk Table

| Priority | Risk | Impact | Warning Signal | Prevention (Actionable + Testable) | Owner Phase |
|---|---|---|---|---|---|
| P0 | Strategy-to-UI semantic drift | Product incoherence across strategy, identity, and shipped UI | Token/component exports missing strategy references; reviewer flags "looks on-brand but says wrong thing" | Add schema field `source_strategy_id` on every generated identity/token/component node; add contract test that coverage is 100% | Phase 2: Strategy Engine |
| P0 | Token contract fragmentation | White-label inconsistency and broken cross-surface theming | New inline color literals in branded routes; patchy visual updates after token change | Add lint rule + CI grep gate for raw literals in branded paths; require token usage report in PR | Phase 4: Token and Theme Compiler |
| P0 | Accessibility regressions in generated themes | WCAG failures and rework late in delivery | Contrast failures in `test:ui-a11y`; Storybook accessibility warnings spike | Add contrast matrix tests for semantic token pairs and component state snapshots; block merge on fail | Phase 3: Visual Identity Engine |
| P0 | Non-deterministic outputs on identical input | Trust erosion, noisy diffs, blocked approvals | Snapshot churn across repeated runs with same fixture | Add repeat-run golden tests for strategy, token JSON, and component contract outputs; allowlist stochastic fields only | Phase 6: Next.js Starter Integration and End-to-End Validation |
| P1 | Role handoff artifacts not executable | UX/process friction; delayed execution by target users | Teams request clarification before first action despite "complete" artifact | Add role-specific checklists with "first 3 actions"; UAT requires zero-clarification dry run per role | Phase 6: Next.js Starter Integration and End-to-End Validation |
| P1 | Component taxonomy scope bloat | Delivery slippage and unstable quality | Backlog churn on component requests; repeated redesign loops | Freeze canonical component minimum (list + variants + states) in phase entry criteria; enforce change-control for additions | Phase 5: shadcn/ui Component Contract and Pattern Library |
| P1 | Overfitting to one visual style | Low adaptability for diverse tenant brands | Generated brands converge to same palette/type personality | Add style-diversity fixtures and acceptance criteria across multiple brand archetypes | Phase 3: Visual Identity Engine |
| P1 | Governance/versioning disconnect | Inconsistent versions between docs, tokens, and UI starter | Strategy version != token version in generated bundle metadata | Introduce single `brand_release_version` propagated to all artifacts with checksum manifest validation | Phase 7: Governance, Versioning, and Ongoing Evolution Workflow |
| P2 | Storybook/Chromatic branding coverage gaps | Regressions reach merge despite existing UI gates | Branding stories absent from visual regression baseline | Add required branding story matrix (state x role x theme) and fail CI if matrix incomplete | Phase 5: shadcn/ui Component Contract and Pattern Library |
| P2 | Theme compiler performance overhead | UX degradation in large workspaces | Increased bundle size or slower first render in themed routes | Add perf budget tests for token payload size and route render timing before/after theming | Phase 4: Token and Theme Compiler |

## Phase-Specific Warnings (v3.4.0 Draft Sequence)

| Phase Topic | Likely Pitfall | Mitigation Owner |
|---|---|---|
| 1. Brand Inputs and Human Insight Modeling | Inputs captured without normalized pain/need ontology | Phase 1 |
| 2. Strategy Engine | Positioning/messaging generated without downstream schema IDs | Phase 2 |
| 3. Visual Identity Engine | Palette/typography expressiveness outpaces accessibility constraints | Phase 3 |
| 4. Token and Theme Compiler | Token naming/versioning instability and hard-coded bypasses | Phase 4 |
| 5. shadcn/ui Component Contract | Missing variant/state coverage and story matrix drift | Phase 5 |
| 6. Next.js Starter Integration | Artifacts not executable by each role without interpretation | Phase 6 |
| 7. Governance and Evolution | Version bumps without atomic strategy->identity->UI synchronization | Phase 7 |

## Sources

- `.planning/PROJECT.md`
- `.planning/MILESTONE-CONTEXT.md`
- `.planning/ROADMAP.md`
- `app/(markos)/settings/theme/page.tsx`
- `app/(markos)/settings/theme/theme.stories.tsx`
- `app/(markos)/settings/plugins/page-shell.tsx`
- `app/(markos)/plugins/digital-agency/page.tsx`
- `lib/markos/theme/brand-pack.ts`
- `lib/markos/theme/tokens.ts`
- `lib/markos/theme/tokens.stories.tsx`
- `docs/LLM-BYOK-ARCHITECTURE.md`
- `docs/OPERATOR-LLM-SETUP.md`
- `.planning/phases/38-ui-coverage-security-assurance/38-VALIDATION.md`
- `.planning/phases/38-ui-coverage-security-assurance/38-VERIFICATION.md`
