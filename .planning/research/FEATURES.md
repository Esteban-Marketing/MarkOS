# Feature Landscape: v3.4.0 Complete Branding Engine

**Domain:** End-to-end branding engine for MarkOS operator surfaces
**Researched:** 2026-04-11
**Scope guard:** Single-milestone scope only (v3.4.0), grounded in current repo maturity

## Scope Baseline From Current Surfaces

Current repo signals show a partial branding foundation, not a full engine yet:

- Brand pack contract and validation exist (`lib/markos/theme/brand-pack.ts`) with token override guardrails.
- Base semantic tokens exist (`lib/markos/theme/tokens.ts`) with Storybook coverage.
- Theme and company routes are currently schema/preview-heavy and not yet full workflow builders.
- UI stack in practice is mixed (CSS modules + utility classes); milestone should ship a canonical Next.js starter contract rather than a full replatform.

## Requirement-Family Labels (for roadmap consumption)

| Label | Family | Intent |
|------|--------|--------|
| `BRAND-INP-*` | Inputs and concepting | Normalize raw concept, audience pain/need/expectation signals |
| `BRAND-STRAT-*` | Strategy and positioning | Convert insights into positioning, promise, messaging pillars |
| `BRAND-ID-*` | Identity system | Deterministic visual/voice identity decisions with guardrails |
| `BRAND-DS-*` | Design system contract | Token and component contract for canonical stack |
| `BRAND-NEXT-*` | Next.js starter outputs | Implementation-ready starter artifacts and wiring |
| `BRAND-ROLE-*` | Role usability | Role-specific handoffs and done-criteria |
| `BRAND-GOV-*` | Governance and versioning | Controlled evolution without cross-surface drift |

## Table Stakes

Features expected for a "complete branding engine" in this milestone.

| Feature | Requirement Family | Why Expected | Complexity | Repo-Fit Notes |
|--------|--------------------|--------------|------------|----------------|
| Concept intake schema covering business context, audience, pains, needs, expectations | `BRAND-INP-01..03` | Engine cannot start without structured raw inputs | Medium | Extend existing schema-first pattern used in company/MIR surfaces |
| Pain/need to opportunity mapper with explicit trace links | `BRAND-INP-04`, `BRAND-STRAT-01` | Strategists need transparent logic from insight to decision | Medium | Fits current deterministic contract style and verification culture |
| Positioning brief generator (problem, promise, differentiators, proof cues) | `BRAND-STRAT-02..05` | Core strategy output for founder + marketing alignment | Medium | Keep as structured artifact first; avoid freeform-only generation |
| Messaging pillar and tone matrix by channel | `BRAND-STRAT-06`, `BRAND-ID-05` | Content and marketing need channel-safe voice boundaries | Medium | Should reuse existing role-gated review patterns |
| Deterministic identity pack (palette roles, typography hierarchy, imagery direction, logo rules) | `BRAND-ID-01..04` | Designers and engineers need reusable identity artifacts | Medium | Build on `brand-pack` + semantic tokens, add richer taxonomy |
| Token compiler into canonical theme contract for Next.js + Tailwind v4 + shadcn/ui primitives | `BRAND-DS-01..04` | Strategy must resolve into implementation primitives | High | Deliver canonical output contract even if UI runtime remains mixed during migration |
| Component contract starter set (core app primitives + states) | `BRAND-DS-05`, `BRAND-NEXT-02` | Frontend teams need concrete "what to build" map | High | Prefer contract + starter examples over full component library rewrite |
| Next.js implementation starter artifacts (tokens, theme wiring, sample route scaffolds) | `BRAND-NEXT-01..04` | Engineers need direct execution path without reinterpretation | High | Must be executable in repo without architecture replacement |
| Role-specific handoff packs and acceptance checklists | `BRAND-ROLE-01..05` | Milestone success requires usability for all five user groups | Medium | Aligns with existing operational checklist patterns |
| Brand versioning and drift checks across strategy -> tokens -> components | `BRAND-GOV-01..03` | Prevents divergence after initial generation | Medium | Reuse existing verification and telemetry lanes where possible |

## Differentiators

Features that make this engine meaningfully stronger than a generic "brand kit generator," while still feasible in v3.4.0.

| Feature | Requirement Family | Value Proposition | Complexity | Repo-Fit Notes |
|--------|--------------------|-------------------|------------|----------------|
| Evidence-linked strategy graph (each positioning/messaging claim references pain/need evidence nodes) | `BRAND-INP-04`, `BRAND-STRAT-03` | Creates auditable strategy decisions instead of opaque AI output | Medium | Matches repo emphasis on traceability and verification |
| Strategy-to-token rationale ledger (why each token family exists, what strategic cue it encodes) | `BRAND-ID-06`, `BRAND-DS-02` | Reduces handoff loss between strategist, designer, engineer | Medium | Can be shipped as markdown/json artifacts quickly |
| Role-view mode on outputs (same source of truth, role-filtered slices) | `BRAND-ROLE-01..05` | Improves usability without duplicating artifacts | Medium | Fits current role-aware surfaces and stories |
| Contract-first shadcn mapping manifest (component variant guidance before full implementation) | `BRAND-DS-05`, `BRAND-NEXT-02` | Gives immediate frontend utility with lower implementation risk | Medium | Realistic for current maturity where full shadcn baseline is not yet pervasive |
| Regression snapshots for identity/tokens on stable input fixtures | `BRAND-GOV-02` | Guarantees deterministic outputs and safer iteration | Medium | Compatible with existing test-first, snapshot-friendly workflow |

## Anti-Features

Explicitly out-of-scope or harmful for v3.4.0.

| Anti-Feature | Why Avoid | What to Do Instead | Requirement Family Guard |
|-------------|-----------|--------------------|--------------------------|
| Full autonomous branding with no human checkpoints | Violates milestone out-of-scope and quality controls | Require approval gates at strategy and identity freeze points | `BRAND-GOV-*` |
| Full UI framework replatform of existing app surfaces | High migration risk and schedule blowout | Ship canonical starter contract and incremental adoption path | `BRAND-NEXT-*` |
| Massive component catalog covering every conceivable pattern | Scope bloat for one milestone | Define a canonical core set tied to active MarkOS surfaces | `BRAND-DS-05` |
| Multi-tenant per-brand localization matrix as hard requirement | Adds combinatorial complexity prematurely | Support single canonical brand baseline + versioned updates | `BRAND-GOV-01` |
| Auto-deploy generated branding directly to production | Dangerous without approval and QA lanes | Generate implementation artifacts plus explicit apply workflow | `BRAND-NEXT-04`, `BRAND-GOV-*` |
| Turning this milestone into CRM/paid-media expansion | Dilutes north star and slips delivery | Keep feature surface centered on branding engine outputs only | `BRAND-*` scope discipline |

## Role-Based Usability Expectations

Each role must be able to complete next actions without extra clarification loops.

| Role | Must Be Able To Do | Required Artifacts | Acceptance Signal | Requirement Family |
|------|---------------------|--------------------|-------------------|--------------------|
| Strategist | Capture concept and map pain/need/expectation to positioning and pillars | Concept brief, pain/need map, positioning brief, messaging matrix | Can defend each strategic claim with linked evidence node | `BRAND-INP-*`, `BRAND-STRAT-*` |
| Designer | Translate strategy into visual identity decisions with constraints | Identity pack (palette roles, typography hierarchy, imagery direction, logo rules) | Produces consistent mockups without reinterpreting strategy text | `BRAND-ID-*` |
| Founder/Operator | Approve direction and govern change over time | Executive brand summary, risk notes, version diff/change log | Can approve/reject using clear tradeoff and impact view | `BRAND-ROLE-03`, `BRAND-GOV-*` |
| Frontend Engineer | Implement starter theme and component contract in Next.js quickly | Token/theme output, component manifest, starter route scaffolds | Can run starter implementation without asking for design translation | `BRAND-DS-*`, `BRAND-NEXT-*` |
| Content/Marketing | Execute channel messaging within brand guardrails | Voice/tone matrix, message pillars, do/don't examples by channel | Can ship campaign copy aligned with identity and positioning | `BRAND-STRAT-06`, `BRAND-ID-05`, `BRAND-ROLE-05` |

## Dependencies and Sequencing

```text
Concept intake schema
  -> Pain/need evidence mapping
  -> Positioning + messaging pillars
  -> Identity decisions (palette/type/visual rules/voice cues)
  -> Token compiler + design-system contract
  -> Next.js starter outputs
  -> Role-based handoffs + governance/versioning
```

Cross-cutting dependencies:

- Existing token and brand-pack contracts seed the identity and token compiler work.
- Storybook/test lanes should be reused for deterministic snapshot and accessibility checks.
- Existing role/approval patterns should be reused for strategist-designer-founder checkpoints.

## Complexity Notes (Milestone Reality)

| Area | Complexity | Why | Delivery Posture |
|------|------------|-----|------------------|
| Input and strategy modeling | Medium | Mostly schema and deterministic transformation work | Prioritize structured contracts over polished UI first |
| Identity system generation | Medium | Requires strategy coupling + accessibility constraints | Deliver deterministic identity pack with validation |
| Design-system contract generation | High | Needs mapping from abstract identity to concrete component primitives | Contract-first approach, not full library rewrite |
| Next.js starter implementation | High | Requires runnable artifacts and wiring quality | Ship minimal but executable starter path |
| Role-based usability and handoff quality | Medium | Needs coherent artifact packaging across disciplines | Use role-specific checklists and output views |
| Governance/versioning | Medium | Must prevent drift across artifacts | Add version stamps, diffs, and deterministic snapshot checks |

## One-Milestone Prioritization Recommendation (v3.4.0)

Prioritize in this order:

1. `BRAND-INP-*` and `BRAND-STRAT-*` (concept to positioning determinism)
2. `BRAND-ID-*` (identity pack with accessibility-aware constraints)
3. `BRAND-DS-*` (canonical token/component contract)
4. `BRAND-NEXT-*` (runnable Next.js starter artifacts)
5. `BRAND-ROLE-*` and `BRAND-GOV-*` (handoff and evolution guardrails)

Defer (explicitly):

- Full multi-theme adapter ecosystem beyond canonical stack
- Full app-wide migration to the new contract in-milestone
- Autonomous publish/deploy automation

## Sources

- `.planning/PROJECT.md`
- `.planning/MILESTONE-CONTEXT.md`
- `.planning/ROADMAP.md`
- `lib/markos/theme/brand-pack.ts`
- `lib/markos/theme/tokens.ts`
- `app/(markos)/settings/theme/page.tsx`
- `app/(markos)/settings/plugins/page-shell.tsx`
- `app/(markos)/layout-shell.tsx`
- `app/(markos)/company/page.tsx`
- `components/markos/crm/reporting-dashboard.tsx`
