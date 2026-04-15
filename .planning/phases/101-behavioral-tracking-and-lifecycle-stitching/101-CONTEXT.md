# Phase 101: Behavioral Tracking and Lifecycle Stitching - Context

**Gathered:** 2026-04-14  
**Status:** Ready for planning

## Phase Boundary

This phase normalizes first-party product, web, and campaign activity into the CRM activity ledger and connects anonymous behavior to known contacts or accounts through confidence-aware stitching. It focuses on ingest semantics, stitching policy, and preserved lifecycle history. It does not yet deliver the multi-view operator workspace, outbound messaging, or AI automation layers.

## Implementation Decisions

### Event normalization and visibility
- **D-01:** CRM-visible activity should remain high-signal and first-party only. Low-value UI noise stays out of the operator timeline.
- **D-02:** PostHog remains the signal layer, while CRM continues as the operational source of truth; Phase 101 enriches CRM history rather than replacing it.
- **D-03:** Normalize web activity, campaign touches, and relevant protected-surface events into the shared CRM ledger with tenant-safe contracts and source-event references.

### Stitching policy
- **D-04:** Default stitching policy is: auto-accept high-confidence matches, route medium-confidence matches to review, and reject low-confidence matches.
- **D-05:** Anonymous-to-known stitching must stay reviewable and non-destructive; this phase must not introduce silent merges or irreversible identity shortcuts.
- **D-06:** Conflicting or ambiguous tenant context remains fail-closed during ingest and identify flows.

### Timeline and history behavior
- **D-07:** Once identity is stitched, preserved pre-conversion history should appear on the CRM record with explicit stitched labels and evidence references.
- **D-08:** Pending-review links should not quietly receive attribution credit; lineage and readiness must remain explainable until the stitch is accepted.

### The agent's discretion
- Exact event naming normalization, helper/module boundaries, and scoring constants may follow the repo’s existing tracking and CRM conventions.
- The planner may choose the thin integration path so long as the high-signal-only rule, review-first stitching, and preserved history behavior remain locked.

## Specific Ideas

- Keep timelines trustworthy and readable rather than flooding CRM with every click.
- Make pre-conversion behavior visible after stitching, but always label it as stitched evidence.
- Bias this phase toward auditability and operator confidence over aggressive automation.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and requirement source
- `.planning/ROADMAP.md` — Defines the Phase 101 boundary and how it feeds later workspace and outbound phases.
- `.planning/REQUIREMENTS.md` — CRM-03, TRK-01, and TRK-02 are the core completion targets for this phase.
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — Phase 100 decisions lock the source-of-truth, lineage, and merge governance assumptions that Phase 101 must build on.

### Tracking and stitching guidance
- `.planning/research/v3.8.0-revenue-crm-customer-intelligence-integration.md` — Recommends first-party tracking into the CRM activity ledger and confidence-aware identity stitching.
- `.planning/research/crm-customer-intelligence-risk-brief-2026-04-14.md` — Defines the tenant-isolation, identity, and attribution risks this phase must avoid.

### Existing code and test anchors
- `lib/markos/crm/tracking.ts` — Current activity normalization rules and high-signal filtering behavior.
- `lib/markos/crm/timeline.ts` — Existing stitched-timeline construction rules using accepted identity links.
- `lib/markos/crm/attribution.ts` — Current attribution readiness and review-exclusion behavior.
- `api/tracking/ingest.js` — Existing tenant-safe tracking ingest surface.
- `api/tracking/identify.js` — Current confidence scoring and identity-link decision flow.
- `test/tenant-auth/tracking-tenant-guard.test.js` — Regression coverage for protected-surface auth and tenant ambiguity denial.

## Existing Code Insights

### Reusable Assets
- `lib/markos/crm/tracking.ts`: already filters low-signal authenticated events and maps key event families into CRM-visible activity.
- `lib/markos/crm/timeline.ts`: already preserves accepted stitched history in timeline assembly.
- `lib/markos/crm/attribution.ts`: already excludes review-pending identity links from attribution credit.
- `api/tracking/ingest.js` and `api/tracking/identify.js`: already enforce tenant-safe ingest and confidence-based stitch decisions.

### Established Patterns
- The repo favors thin normalization helpers with fail-closed auth boundaries and explicit source-event references.
- Review-first identity handling from Phase 100 continues here; this phase expands use of identity links but does not bypass merge governance.
- Readiness and attribution should degrade transparently when identity confidence is unresolved.

### Integration Points
- Phase 102 will consume the stitched activity ledger to power timeline, record detail, and workspace views.
- Phase 104 and Phase 105 will rely on these event and identity semantics for outbound telemetry and reporting trust.

## Deferred Ideas

- Rich operator timeline views and filter UX — Phase 102.
- Sales or success queue logic driven from behavior signals — Phase 103.
- Outbound send/writeback workflows — Phase 104.
- AI summaries and attribution dashboards — Phase 105.

---

*Phase: 101-behavioral-tracking-and-lifecycle-stitching*  
*Context gathered: 2026-04-14*
