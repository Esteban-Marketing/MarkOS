# Phase 95: Evaluation and Governance - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Add provider comparison, grounding checks, acceptance review, and safe promotion criteria for research-backed tailoring. This phase defines how MarkOS evaluates preview-quality evidence and governs promotion decisions before acceptance; it does not broaden research scope or auto-apply changes.

</domain>

<decisions>
## Implementation Decisions

### Comparison and scoring posture
- **D-01:** Phase 95 v1 should present a ranked scorecard with a clear winner and runner-up rather than a flat equal-weight matrix.
- **D-02:** The evaluation surface should help the operator see why one provider or result won, not just display raw numbers.

### Grounding failure behavior
- **D-03:** When grounding or citation quality is weak, promotion should be blocked and routed into explicit review rather than silently continuing.
- **D-04:** Weakly grounded results may still be visible for inspection, but they should not clear the promotion boundary automatically.

### Acceptance review model
- **D-05:** Acceptance should happen at the run level with per-artifact flags so operators can approve the overall batch while still isolating risky artifacts.
- **D-06:** The evaluation flow should preserve artifact-level warnings and governance diagnostics instead of collapsing everything into one pass or fail line.

### Promotion criteria
- **D-07:** Safe promotion should use a conservative weighted score with a documented human override note rather than fully rigid all-or-nothing gates.
- **D-08:** Manual override should remain explicit, reviewable, and audit-friendly, not an invisible bypass.

### the agent's Discretion
- Exact score dimensions and weighting formulas
- Whether the review surface uses badges, score bands, or diagnostic panels
- How provider-comparison history is stored or summarized in v1
- Which metrics are mandatory blockers versus advisory warnings inside the conservative scoring model

</decisions>

<specifics>
## Specific Ideas

- The evaluation layer should feel trustworthy and decision-oriented, not like a noisy analytics dashboard.
- Operators should quickly see the best candidate, the runner-up, and the reason a result is blocked or promotable.
- Governance should stay strict enough to prevent weak evidence from slipping through while still allowing documented human judgment.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and upstream deep-research contract
- `.planning/REQUIREMENTS.md` — DRT-08, DRT-09, DRT-10, and DRT-13 define the evaluation and governance scope.
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — milestone framing and v3.6 phase sequence.
- `.planning/research/v3.6.0-research-task-framework.md` — research-task evaluation and provider-behavior framing for the milestone.
- `.planning/phases/93-multi-source-deep-research-orchestration/93-CONTEXT.md` — upstream contradiction, route trace, and provider-attempt behaviors this phase must evaluate.
- `.planning/phases/94-mir-and-msp-delta-patch-engine/94-CONTEXT.md` — preview-only patch posture, inline evidence expectations, and suggestion-only downgrade rules this phase must govern.

### Existing governance and review surfaces
- `onboarding/backend/handlers.cjs` — current approval, verification, and governance-closeout boundaries.
- `onboarding/backend/brand-governance/closure-gates.cjs` — reusable governance gating and denial posture.
- `onboarding/backend/brand-governance/governance-diagnostics.cjs` — machine-readable diagnostics and governance denial normalization.
- `onboarding/backend/vault/telemetry-schema.cjs` — governance telemetry normalization patterns.
- `lib/markos/crm/execution.ts` — suggestion-only, approval-needed, and review-safe action semantics.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MarkOS already has governance telemetry, closure gates, and review-required pathways that can anchor Phase 95 instead of inventing a new approval model.
- Earlier phases now provide route traces, contradiction metadata, preview payloads, and suggestion-only outputs that Phase 95 can evaluate and score.
- The repo already favors explicit diagnostics and approval-needed states over silent failure or unsafe automation.

### Established Patterns
- Human review is explicit and mandatory for high-impact changes.
- Machine-readable diagnostics are preferred over vague pass or fail text.
- Weak or contradictory evidence should remain visible but should not be promoted as trusted output.

### Integration Points
- Phase 95 should consume the Phase 93 context-pack and provider-attempt ledger.
- It should evaluate the Phase 94 preview payloads and determine whether a run is promotable, blocked, or review-required.
- The resulting decision surface should remain portable across MCP, API, CLI, and editor clients.

</code_context>

<deferred>
## Deferred Ideas

- Fully autonomous promotion without human review is deferred.
- Expanding the phase into a general analytics dashboard is deferred.
- Replacing the existing approval or governance systems is deferred.

</deferred>

---

*Phase: 95-evaluation-and-governance*
*Context gathered: 2026-04-13*
