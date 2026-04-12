# Phase 73: Brand Inputs and Human Insight Modeling - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 73 delivers the input and normalization foundation for the branding engine: capture structured concept and audience inputs, transform them into deterministic tenant-safe evidence nodes, and produce a replay-stable graph shape that downstream strategy and identity phases can trust.

This phase does not generate final visual identity, token packs, or Next.js UI outputs. It defines the quality and determinism of the source intelligence those later phases consume.

</domain>

<decisions>
## Implementation Decisions

### Input Scope Shape
- **D-01:** Phase 73 will support one primary brand profile plus multiple audience segments (2-5) in the first implementation slice.

### Pain/Need/Expectation Data Model
- **D-02:** The model is strict and typed, with bounded arrays and required rationale fields for key pain/need/expectation captures.
- **D-03:** Inputs should produce explicit structured fields rather than free-form-only blocks so normalization and graph generation remain deterministic.

### Normalization Policy
- **D-04:** Use hybrid normalization: preserve raw text while also creating canonical normalized nodes and alias mappings.

### Intake Surface Strategy
- **D-05:** Extend existing onboarding/interview schema and handlers for Phase 73, rather than introducing a separate brand-input API surface in this phase.

### Determinism and Re-run Rules
- **D-06:** Use stable composite identity keys plus content fingerprints per normalized node so identical submissions generate identical graph outputs and idempotent updates.

### PII and Retention Boundaries
- **D-07:** Apply minimal-text retention with secret redaction and metadata-first evidence trails.
- **D-08:** Preserve required analyst-grade context, but avoid broad raw-text retention that increases privacy risk without deterministic benefit.

### the agent's Discretion
- Field-level naming conventions for normalized-node internals where they do not alter contract semantics.
- Exact confidence scoring formula, as long as it is deterministic and traceable.
- Implementation detail of validation messaging and UI copy.

</decisions>

<specifics>
## Specific Ideas

- The milestone must start from business ideas and pain points, then map needs and expectations before downstream strategy/identity work.
- Canonical implementation stack remains Next.js + Tailwind v4 + shadcn/ui for downstream phases; this phase should prepare high-quality inputs for that pipeline.
- The phase should remain additive to existing architecture and avoid introducing parallel intake systems unless required later.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Scope
- `.planning/ROADMAP.md` - Phase 73 scope, dependencies, and acceptance intent for brand-input modeling.
- `.planning/REQUIREMENTS.md` - BRAND-INP-01 and BRAND-INP-02 requirement family constraints.
- `.planning/PROJECT.md` - Active milestone objective and non-replatform additive boundary.

### Existing Intake Contracts
- `onboarding/onboarding-seed.schema.json` - Current typed onboarding seed contract and bounded-array patterns.
- `onboarding/backend/handlers.cjs` - Intake validation, execution-readiness contract scaffolding, and onboarding handler behavior.
- `onboarding/backend/runtime-context.cjs` - Runtime mode, canonical vault posture, redaction and configuration boundaries.

### Interview Flow Contracts
- `contracts/F-12-ai-interview-generate-q-v1.yaml` - Local interview question generation flow contract.
- `contracts/F-13-ai-interview-parse-answer-v1.yaml` - Local interview answer parsing and enrichment flow contract.

### Brand Token/Theme Baseline (Downstream Alignment)
- `lib/markos/theme/brand-pack.ts` - Existing brand pack validation and token override baseline to keep future phase alignment coherent.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `onboarding/onboarding-seed.schema.json`: Existing typed intake structure with bounded arrays can be extended for multi-segment brand input modeling.
- `onboarding/backend/handlers.cjs`: Existing intake validation and handler orchestration can host Phase 73 extensions without introducing a new service boundary.
- `onboarding/backend/runtime-context.cjs`: Existing runtime config and redaction primitives support the privacy and retention decisions.
- `onboarding/backend/vector-store-client.cjs`: Existing metadata and enrichment pathways can anchor evidence-node persistence shape.

### Established Patterns
- Deterministic validation gates already exist in handler-level intake checks.
- Hybrid/local-hosted runtime handling is centralized in runtime-context and should remain the extension path.
- Existing onboarding flow already captures audience/pain categories and interview turns; extending that shape is lower-risk than introducing dual intake paths.

### Integration Points
- Extend current onboarding submit/interview payload shape and server validation rules.
- Add normalized evidence graph construction immediately after structured intake parsing.
- Emit deterministic identity keys and fingerprints during normalization before downstream persistence.

</code_context>

<deferred>
## Deferred Ideas

- A dedicated standalone brand-input API surface (deferred; current decision is to extend onboarding handlers first).
- Unlimited audience segment support from day one (deferred; current bound is 2-5 segments).

</deferred>

---

*Phase: 73-brand-inputs-and-human-insight-modeling*
*Context gathered: 2026-04-11*
