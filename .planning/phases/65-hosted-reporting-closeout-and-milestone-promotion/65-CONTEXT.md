# Phase 65: Hosted Reporting Closeout and Milestone Promotion - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 65 closes the remaining hosted reporting follow-through for v3.3.0. It does not add a new reporting model, attribution model, dashboard family, or AI surface. It takes the already repository-passed Phase 64 reporting and verification system, executes the remaining hosted and live-environment checks, records milestone-grade evidence for ATT-01 and REP-01, updates closure ledgers from Partial to Satisfied where justified, and packages honest milestone-promotion records.

This phase is a closeout and evidence phase, not a new product-capability phase. It should reuse the existing CRM reporting shell, verification route, governance evidence surfaces, and v3.3 live-check artifacts rather than rebuilding or broadening them.

</domain>

<decisions>
## Implementation Decisions

### Hosted closeout scope
- **D-01:** Phase 65 covers hosted reporting closeout and milestone promotion only.
- **D-02:** The phase must execute and record the remaining Phase 64 hosted checks using the existing v3.3 live-check artifacts instead of inventing a new verification format.
- **D-03:** ATT-01 and REP-01 are the only requirement IDs Phase 65 is allowed to promote.

### Evidence and promotion rules
- **D-04:** Promotion from `Partial` to `Satisfied` must be based on recorded hosted evidence, not on restating repository-pass results.
- **D-05:** The phase must update milestone evidence surfaces consistently: live-check log, closure matrix, roadmap/state, and any v3.3 closeout report touched by the promotion decision.
- **D-06:** If any hosted step cannot be completed, the phase must preserve an honest `human_needed` or follow-through state rather than overclaim closure.

### Boundary controls
- **D-07:** Phase 65 must reuse the existing CRM reporting shell, readiness surfaces, attribution drill-down, verification route, and governance evidence packaging from Phase 64.
- **D-08:** Phase 64.3 user-home instruction follow-through remains separate from this phase unless a concrete milestone-promotion dependency is discovered.
- **D-09:** MMM, custom BI builder work, and broader reporting expansion remain deferred.

### Claude's Discretion
- Exact grouping of hosted checks into plans.
- Exact evidence file naming for hosted responses or screenshots, provided the destinations are explicit and traceable.
- Exact ordering of ledger and milestone-document updates, provided promotion only happens after evidence review.

</decisions>

<specifics>
## Specific Ideas

- Reuse `.planning/milestones/v3.3.0-LIVE-CHECKLIST.md` and `.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md` as the canonical operator artifacts.
- Treat the hosted reporting shell review, readiness review, attribution drill-down review, and governance-evidence review as the core acceptance sequence.
- Keep the phase narrow enough that its end state is easy to verify: either ATT-01 and REP-01 are promoted with evidence, or the remaining blockers are explicitly recorded.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirement truth
- `.planning/ROADMAP.md` — Live roadmap entry and milestone state for Phase 65.
- `.planning/REQUIREMENTS.md` — Canonical requirement definitions for `ATT-01` and `REP-01`.
- `.planning/STATE.md` — Active milestone status, carry-over human scope, and current next-step expectations.

### Phase 64 reporting closure baseline
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-CONTEXT.md` — Locked reporting-shell and closeout decisions that Phase 65 must not reopen.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-VALIDATION.md` — Hosted review steps and human verification criteria still outstanding after repository completion.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-VERIFICATION.md` — Repository-pass status plus the exact hosted evidence still needed to promote `ATT-01` and `REP-01`.

### Hosted evidence artifacts
- `.planning/milestones/v3.3.0-LIVE-CHECKLIST.md` — Canonical hosted reporting closeout checklist.
- `.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md` — Canonical execution-log structure for hosted evidence capture.
- `.planning/projects/markos-v3/CLOSURE-MATRIX.md` — Requirement promotion target that currently leaves `ATT-01` and `REP-01` in `Partial`.

### Separation boundary
- `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-HUMAN-UAT.md` — Separate user-home follow-through artifact that stays out of Phase 65 unless a direct dependency is found.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(markos)/crm/reporting/page.tsx` — Existing CRM reporting shell that Phase 65 verifies rather than redesigns.
- `app/(markos)/crm/reporting/verification/page.tsx` — Existing verification route that should anchor hosted closeout checks.
- `api/crm/reporting/attribution.js`, `api/crm/reporting/dashboard.js`, `api/crm/reporting/verification.js` — Existing reporting APIs whose hosted responses should be captured as evidence.
- `api/governance/evidence.js` and `lib/markos/governance/evidence-pack.cjs` — Existing closeout evidence paths that should be reused for promotion review.

### Established Patterns
- Repository-pass verification and hosted follow-through are intentionally separated; Phase 65 should preserve that honesty model rather than collapsing it.
- Milestone-closeout work already uses checklist plus execution-log artifacts; Phase 65 should extend those records instead of introducing ad hoc notes.

### Integration Points
- Phase 65 integrates with the Phase 64 reporting routes and the v3.3 closure matrix.
- Phase 65 should end by updating planning ledgers so the milestone’s closeout status matches the hosted evidence on disk.

</code_context>

<deferred>
## Deferred Ideas

- Phase 64.3 user-home instruction follow-through outside the hosted reporting lane.
- MMM or more advanced attribution modeling.
- A custom BI builder or broader analytics studio.
- New AI-generated reporting surfaces.

</deferred>

---

*Phase: 65-hosted-reporting-closeout-and-milestone-promotion*
*Context gathered: 2026-04-06*