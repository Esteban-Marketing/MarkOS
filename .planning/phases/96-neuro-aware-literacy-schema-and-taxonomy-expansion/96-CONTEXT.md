# Phase 96: Neuro-Aware Literacy Schema and Taxonomy Expansion - Context

**Gathered:** 2026-04-14
**Status:** Discussed and ready for planning

<domain>
## Phase Boundary

Extend the MarkOS literacy architecture so ICP pain points, motivations, objections, trust drivers, emotional-state shifts, funnel-stage nuance, and neuromarketing-relevant signals become first-class structured metadata. This phase defines the schema and taxonomy foundation only; it does not yet deliver the full universal template library, agent prompt rewiring, or final quality-governance closure from later phases.

</domain>

<decisions>
## Implementation Decisions

### Schema posture
- **D-01:** Phase 96 must be additive to the shipped v3.6.0 deep-research baseline, not a replacement of the current literacy and governance system.
- **D-02:** The new literacy schema must support both company-level tailoring and ICP-level tailoring as separate but composable signals.
- **D-03:** Every literacy artifact should be able to encode pains, desired outcomes, objections, trust blockers, buying-stage context, and naturality expectations.

### Neuromarketing posture
- **D-04:** The existing MarkOS neuromarketing reference remains the authoritative trigger vocabulary; Phase 96 should integrate with it rather than invent a second neuro taxonomy.
- **D-05:** Neuro-aware fields must stay brand-safe, evidence-aware, and non-manipulative.

### Retrieval and contract posture
- **D-06:** The schema must remain deterministic and portable so later phases can use it across MCP, API, CLI, editor, and internal automation surfaces.
- **D-07:** Backward-compatible metadata and filters are required so v3.6.0 retrieval and preview-safe governance do not regress.

### Scope guardrails
- **D-08:** Phase 96 focuses on schema, taxonomy, and metadata conventions, not full corpus expansion or final agent training behavior.
- **D-09:** Universal business-model template coverage belongs primarily to Phase 97, and agent/skill alignment belongs primarily to Phase 99.
- **D-10:** The default schema layout should use a hybrid layered model: governed structured blocks for core literacy meaning plus portable tags for filtering, retrieval, and reuse.
- **D-11:** Granularity should center on company baseline metadata with ICP-segment and funnel-stage overlays, avoiding premature micro-segment explosion in this phase.

### the agent's Discretion
- Exact field names, nesting, and storage format for the new literacy metadata within the locked hybrid layered model
- Mapping conventions from ICP signals to neuromarketing trigger hints
- Validation strategy for required vs optional metadata fields
- Whether overlay inheritance is implemented via merge rules, references, or another deterministic portable contract

</decisions>

<specifics>
## Specific Ideas

- The same company should produce meaningfully different literacy and downstream output for different ICP segments.
- Pain-first, relief-aware, and trust-aware messaging signals must be representable explicitly rather than implied vaguely.
- Naturality matters: the schema should help later generation avoid robotic or template-sounding copy.
- Strong tailoring should feel more human and more commercially useful, not just more labeled.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and requirement contracts
- `.planning/MILESTONE-CONTEXT.md` — milestone north star and locked priorities
- `.planning/PROJECT.md` — current milestone posture and non-regression context
- `.planning/REQUIREMENTS.md` — NLI-01 through NLI-14, especially NLI-01 and NLI-02
- `.planning/ROADMAP.md` — official phase sequencing for v3.7.0
- `.planning/STATE.md` — canonical live planning state

### Neuromarketing reference authority
- `.agent/markos/references/neuromarketing.md` — canonical biological triggers, archetypes, and funnel-stage mappings
- `.agent/markos/templates/NEURO-BRIEF.md` — downstream shape for neuro-aware campaign planning

### Existing deep-research and retrieval foundations
- `onboarding/backend/research/filter-taxonomy-v1.cjs` — current tailoring filter model
- `onboarding/backend/research/research-mode-taxonomy.cjs` — current research-mode taxonomy
- `onboarding/backend/vector-store-client.cjs` — current literacy retrieval primitives
- `onboarding/backend/research/deep-research-envelope.cjs` — cross-surface request contract posture
- `onboarding/backend/research/context-pack-contract.cjs` — structured research context output baseline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The v3.6.0 deep-research stack already supports filter-aware requests, provider routing, and preview-safe contracts.
- The existing neuromarketing reference model already provides a governed trigger vocabulary and archetype logic.
- The literacy retrieval system already handles structured metadata and ranking, making schema expansion a natural next step.

### Established Patterns
- Approved internal knowledge remains authoritative.
- Structured, portable JSON contracts are preferred over client-specific logic.
- Additive upgrades are favored over platform rewrites.

### Integration Points
- Phase 96 should define the richer literacy metadata that later phases will use for universal templates, ICP reasoning, and agent training.
- The taxonomy should align with the already-shipped retrieval filter model so later enrichment stays backward-compatible.
- The output of this phase must feed Phase 97 template coverage, Phase 98 ICP intelligence, and Phase 99 agent alignment.

</code_context>

<deferred>
## Deferred Ideas

- Full universal template expansion across all business models is deferred to Phase 97.
- Full ICP reasoning and trigger-fit decision logic is deferred to Phase 98.
- Agent prompt and skill rewiring is deferred to Phase 99.
- Final evaluation and governance closure is deferred to Phase 99.1.

</deferred>

---

*Phase: 96-neuro-aware-literacy-schema-and-taxonomy-expansion*
*Context gathered: 2026-04-14*
