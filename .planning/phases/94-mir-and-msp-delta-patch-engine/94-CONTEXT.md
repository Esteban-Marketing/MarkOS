# Phase 94: MIR and MSP Delta Patch Engine - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate precise MIR and MSP update proposals and section-level refreshes with operator-visible evidence diffs. This phase defines how research-backed changes are turned into reviewable patch previews; it does not auto-apply changes or bypass approval workflows.

</domain>

<decisions>
## Implementation Decisions

### Patch granularity
- **D-01:** Phase 94 v1 should prefer section-level surgical diffs rather than full-document rewrites.
- **D-02:** Patch generation should stay narrowly targeted to the exact section or block supported by the evidence.

### Approval posture
- **D-03:** Every proposed MIR or MSP patch requires explicit human review before acceptance.
- **D-04:** No low-risk auto-approval path should exist in v1.

### Evidence presentation
- **D-05:** Each proposed patch should carry inline evidence support for the specific change, not just a high-level summary.
- **D-06:** Operators should be able to trace each diff back to its supporting source or contradiction signal.

### Weak-evidence behavior
- **D-07:** When evidence is weak, incomplete, or contradictory, the system should downgrade to suggestion-only mode rather than generating a concrete patch preview.

### the agent's Discretion
- Exact patch payload format and diff representation
- Confidence scoring thresholds for patch vs suggestion-only mode
- How inline evidence is rendered in CLI, MCP, API, and editor views
- Whether the engine stores prior patch preview history for audit convenience in this phase or defers it

</decisions>

<specifics>
## Specific Ideas

- The patch engine should feel precise and trustworthy, not broad or rewrite-heavy.
- Small, evidence-linked changes are preferred over impressive but risky rewrites.
- When the evidence is shaky, the system should help the operator think rather than pretend certainty.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and upstream orchestration contract
- `.planning/REQUIREMENTS.md` — DRT-06, DRT-07, DRT-10, and DRT-16 define the patch-engine scope.
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — milestone framing and v3.6 phase sequence.
- `.planning/research/v3.6.0-research-task-framework.md` — downstream role of the MIR/MSP delta engine.
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md` — upstream universal contract and preview-safe posture.
- `.planning/phases/93-multi-source-deep-research-orchestration/93-CONTEXT.md` — the evidence-pack and contradiction behaviors Phase 94 must consume.

### Existing artifact and approval surfaces
- `onboarding/backend/agents/orchestrator.cjs` — current artifact generation flow and approval boundary patterns.
- `onboarding/backend/write-mir.cjs` — current MIR write path that later approval flows must respect.
- `onboarding/backend/handlers.cjs` — existing approve/regenerate boundaries relevant to patch preview flow.
- `.planning/MIR/` — canonical MIR structure and section patterns.
- `.planning/MSP/` or current MSP-producing runtime surfaces — downstream plan structures that patch previews should target.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MarkOS already has structured artifact generation and approval boundaries that can host preview-safe patch proposals.
- The earlier deep-research phases establish structured context packs, contradictions, and evidence metadata that Phase 94 can turn into diffs.
- Existing MIR write flows show where accepted patches eventually need to land, without requiring Phase 94 to write them directly.

### Established Patterns
- Review and approval are explicit, not implicit.
- Portable, structured outputs are preferred over client-specific formatting.
- Approved internal truth remains authoritative unless an operator accepts a new evidence-backed change.

### Integration Points
- Phase 94 should consume the context pack and contradiction output from Phase 93.
- The engine must generate patch previews that feed human review and later governance surfaces.
- The patch representation should remain usable across MCP, API, CLI, and editor clients.

</code_context>

<deferred>
## Deferred Ideas

- Auto-applying low-risk updates is deferred.
- Full-document rewrites as the default patch behavior are deferred.
- Hard-blocking all weak-evidence cases is deferred in favor of suggestion-only output.

</deferred>

---

*Phase: 94-mir-and-msp-delta-patch-engine*
*Context gathered: 2026-04-14*
