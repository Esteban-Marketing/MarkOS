# Phase 97: Universal Template and Business-Model Coverage Upgrade - Context

**Gathered:** 2026-04-14 (updated 2026-04-14)
**Status:** Ready for execution — D-07 and D-08 added (hybrid base+overlay mechanism, agent-selected first-class overlays)

<domain>
## Phase Boundary

Build a richer universal template library that works across business models and industries while staying highly tailorable in practice. This phase expands reusable literacy templates and guidance using the Phase 96 schema foundation; it does not yet implement the full ICP reasoning engine or the final agent training rewiring from later phases.

</domain>

<decisions>
## Implementation Decisions

### Template posture
- **D-01:** Templates must be universal enough to cover B2B, B2C, SaaS, agencies, services, consulting, info products, and ecommerce patterns without becoming generic.
- **D-02:** Template structures must consume the new Phase 96 metadata so company context, ICP signals, and stage nuance can shape the resulting guidance.
- **D-03:** Every template family should encode funnel stage, buying maturity, tone guidance, proof posture, and naturality expectations.

### Scope and guardrails
- **D-04:** Phase 97 is an additive template-library expansion, not a rewrite of the literacy retrieval system.
- **D-05:** Full ICP reasoning logic belongs to Phase 98, and agent/skill training alignment belongs to Phase 99.
- **D-06:** Templates must remain brand-safe, evidence-aware, and portable across MCP, API, CLI, editor, and internal automation surfaces.

### Template differentiation mechanism
- **D-07:** Template families use a hybrid authoring model — shared base template docs encode universal structure, proof posture, and naturality guidance; per-model overlay docs extend with model-specific persuasion patterns and trust signals. This mirrors the Phase 96 `neuro-literacy-overlay.cjs` pattern. Phase 98 ICP reasoning will pick the right overlay combination at runtime.
- **D-08:** The agent chooses which 4–5 business-model families receive a dedicated overlay doc in Phase 97, selecting based on how distinct their persuasion and trust patterns are from the universal base (e.g., SaaS, consulting, ecommerce are likely candidates).

### the agent's Discretion
- Exact template family names and grouping model
- Folder and metadata conventions for new universal template assets
- Validation rules for tone and naturality guidance
- Which 4–5 model families get first-class overlay docs (per D-08 selection criteria)

</decisions>

<specifics>
## Specific Ideas

- Reusable templates should adapt strongly when business model, funnel stage, or trust conditions change.
- The same structural template should still feel different for a SaaS operator, a service firm, and an ecommerce brand.
- Naturality and non-generic output remain central product quality signals.

</specifics>

<canonical_refs>
## Canonical References

- .planning/MILESTONE-CONTEXT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-CONTEXT.md
- .planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-RESEARCH.md
- .agent/markos/references/neuromarketing.md

</canonical_refs>

<deferred>
## Deferred Ideas

- Full ICP reasoning automation is deferred to Phase 98.
- Agent and skill rewiring is deferred to Phase 99.
- Final quality-governance closeout is deferred to Phase 99.1.

</deferred>
