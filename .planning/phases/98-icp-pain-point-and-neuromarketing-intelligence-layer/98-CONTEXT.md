# Phase 98: ICP Pain-Point and Neuromarketing Intelligence Layer - Context

**Gathered:** 2026-04-14
**Status:** Discussed — initial decision contract locked

<domain>
## Phase Boundary

Formalize the ICP reasoning layer so MarkOS can map motivations, fears, trust cues, objections, archetypes, and neuromarketing trigger fits into explainable content-strategy decisions. This phase turns the Phase 96 schema and Phase 97 template coverage into a governed reasoning surface; it does not yet perform the broader agent/skill rewiring from Phase 99 or the final evaluation/governance closeout from Phase 99.1.

</domain>

<decisions>
## Implementation Decisions

### Reasoning posture
- **D-01:** Phase 98 must be additive to the shipped Phase 96/97 foundation, not a replacement of the current literacy retrieval or template system.
- **D-02:** The reasoning layer should map ICP inputs into motivations, fears, trust drivers, objections, archetype tendencies, and likely trigger clusters using the existing governed literacy metadata.
- **D-03:** The core selection contract should return a **ranked shortlist plus a clear primary winner**, rather than a single opaque answer or an unstructured dump.
- **D-04:** Even when evidence is mixed, the system should still return a primary recommendation, but it must include an explicit **confidence flag** so low-certainty cases are visible rather than implied as certain.

### Governance and explainability
- **D-05:** The existing MarkOS neuromarketing reference remains the authoritative foundation for trigger logic; this phase should not invent ad hoc persuasion heuristics outside that governed model.
- **D-06:** Agent outputs must be explainable enough to state why the selected angle, trigger pattern, or persuasion approach fits the target ICP.
- **D-07:** The reasoning output should stay portable and deterministic enough to be reused later across MCP, API, CLI, editor, and internal automation surfaces.

### Scope guardrails
- **D-08:** Phase 98 focuses on ICP reasoning and explainable fit selection, not full agent instruction rewiring or premium-quality grading gates from later phases.
- **D-09:** The phase should build on the Phase 97 base-plus-overlay handoff and determine which overlay/strategy fit is most appropriate at runtime.

### the agent's Discretion
- Exact JSON/output schema for the ranked shortlist and confidence metadata
- Scoring weights and tie-break rules used to rank candidate angles
- How much rationale is returned in machine-readable fields versus human-readable summary text
- Which runtime seam owns the reasoning call first

</decisions>

<specifics>
## Specific Ideas

- The same company context should yield meaningfully different recommended angles for different ICP segments.
- The reasoning should feel explainable and commercially useful, not like a black-box label picker.
- Low-confidence cases should surface uncertainty explicitly instead of pretending all fits are equally strong.
- The outcome should help downstream generation feel more tailored without becoming manipulative or off-brand.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — especially NLI-05, NLI-06, NLI-07
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-CONTEXT.md`
- `.planning/phases/97-universal-template-and-business-model-coverage-upgrade/97-CONTEXT.md`
- `.agent/markos/references/neuromarketing.md`
- `.agent/markos/templates/NEURO-BRIEF.md`
- `onboarding/backend/research/neuro-literacy-overlay.cjs`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 96 already established structured pain, trust, objection, emotional-state, trigger, and archetype metadata.
- Phase 97 now provides a base-plus-overlay template selection handoff that this reasoning layer can drive.
- The repo already has deterministic normalization and retrieval patterns that favor explicit contracts over hidden prompt behavior.

### Integration Points
- ICP reasoning should consume the literacy metadata already carried through chunking, storage, and retrieval.
- The output of this phase should inform overlay selection and rationale in downstream content strategy decisions.
- The phase must preserve the governed neuromarketing trigger vocabulary already defined in the reference model.

</code_context>

<deferred>
## Deferred Ideas

- Broad agent/skill prompt rewiring remains deferred to Phase 99.
- Premium output grading, naturality audits, and final governance closeout remain deferred to Phase 99.1.

</deferred>

---

*Phase: 98-icp-pain-point-and-neuromarketing-intelligence-layer*
*Context gathered: 2026-04-14*