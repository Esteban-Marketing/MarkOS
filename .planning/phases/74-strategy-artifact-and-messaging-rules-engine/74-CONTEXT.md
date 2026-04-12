# Phase 74: Strategy Artifact and Messaging Rules Engine - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 74 converts Phase 73 normalized evidence into a deterministic strategy artifact containing positioning, value promise, differentiators, and messaging pillars with explicit lineage per claim.

This phase also defines role-consumable messaging rules (strategist, founder, content) with explicit tone boundaries and channel guidance consistency checks.

This phase does not produce visual identity assets, design tokens, or Next.js starter implementation outputs.

</domain>

<decisions>
## Implementation Decisions

### Strategy Artifact Shape
- **D-01:** Produce a versioned strategy artifact document with required sections: positioning statement, value promise, differentiators, messaging pillars, disallowed claims, and confidence notes.
- **D-02:** Every strategic claim must include source lineage (`evidence_node_ids`) referencing Phase 73 canonical evidence nodes.

### Deterministic Synthesis Rules
- **D-03:** Strategy generation must be deterministic for fixed tenant input and rule-set version; no stochastic output in core artifact fields.
- **D-04:** Contradictory source evidence must be surfaced as explicit conflict annotations instead of silently resolved.

### Messaging Rules Engine
- **D-05:** Define personality and tone as explicit bounded enums and rule blocks, not free-form text-only prose.
- **D-06:** Channel messaging rules (site, email, social, sales-call) must inherit from one canonical voice profile and enforce contradiction checks.

### Role Views and Consumption
- **D-07:** Emit role-specific views (strategist, founder, content) from the same canonical artifact with no independent rewrites.
- **D-08:** Rule outputs must include actionable do/don't guidance and examples, while preserving canonical lineage links.

### Scope and Integration Guardrails
- **D-09:** Integrate with existing onboarding/branding backend surfaces; do not add a standalone public API in this phase.
- **D-10:** Keep outputs additive and tenant-scoped, reusing existing context, persistence, and redaction boundaries from Phase 73.

### the agent's Discretion
- Claim ranking heuristics for ordering strategy sections, provided they remain deterministic and explainable.
- Internal module boundaries for rule compilation and role-view projection.
- Exact formatting of human-readable artifact markdown/json outputs.

</decisions>

<specifics>
## Specific Ideas

- Start from pain/need/expectation evidence clusters and derive concise strategic narrative primitives.
- Include a contradiction detector that flags tone or claim drift across channel rules.
- Preserve machine-readable artifact format for downstream identity/token phases.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Scope
- `.planning/ROADMAP.md` - Phase 74 goal, requirement mapping, and acceptance intent.
- `.planning/REQUIREMENTS.md` - BRAND-STRAT-01 and BRAND-STRAT-02 requirements.
- `.planning/PROJECT.md` - Active milestone objective and additive non-replatform boundary.

### Upstream Inputs (Phase 73)
- `.planning/phases/73-brand-inputs-and-human-insight-modeling/73-CONTEXT.md` - Locked input modeling decisions and guardrails.
- `.planning/phases/73-brand-inputs-and-human-insight-modeling/73-RESEARCH.md` - Determinism and tenant-safety implementation guidance.
- `onboarding/backend/brand-inputs/normalize-brand-input.cjs` - Canonical normalized evidence generation.
- `onboarding/backend/brand-inputs/canonicalize-brand-node.cjs` - Deterministic fingerprinting/canonicalization.
- `onboarding/backend/brand-inputs/evidence-graph-writer.cjs` - Tenant-safe persistence patterns.

### Existing Runtime and Intake Surfaces
- `onboarding/backend/handlers.cjs` - Intake orchestration and execution gates.
- `onboarding/backend/runtime-context.cjs` - Runtime mode and privacy/redaction boundaries.
- `onboarding/backend/vector-store-client.cjs` - Existing query and tenant-scoped retrieval patterns.

### Contracts and Downstream Alignment
- `contracts/F-12-ai-interview-generate-q-v1.yaml` - Interview generation constraints relevant to messaging extraction.
- `contracts/F-13-ai-interview-parse-answer-v1.yaml` - Structured answer parsing constraints.
- `lib/markos/theme/brand-pack.ts` - Downstream identity/token alignment expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 73 introduced deterministic normalization and tenant-safe evidence graph writes that should be consumed directly.
- Existing handler and runtime context architecture already enforces validation and privacy boundaries.

### Established Patterns
- Deterministic output and idempotent writes are existing norms and must remain unchanged.
- Extension of existing onboarding-backed surfaces is lower risk than introducing new service boundaries.

### Integration Points
- Read canonical evidence graph output after Phase 73 normalization.
- Compile strategy artifact and messaging rules from evidence clusters.
- Persist canonical strategy artifact with lineage links and role projections.

</code_context>

<deferred>
## Deferred Ideas

- Autonomous publish to production channels (deferred to governance and publish phases).
- Creative generation variants that intentionally introduce stochastic alternatives.
- Full channel execution automation outside strategy artifact scope.

</deferred>

---

*Phase: 74-strategy-artifact-and-messaging-rules-engine*
*Context gathered: 2026-04-12 via discuss-phase --auto*
