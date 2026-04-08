---
phase: "60"
name: "Pipeline Engine and Multi-View Workspace"
created: "2026-04-04"
---

# Phase 60: Pipeline Engine and Multi-View Workspace - Context

## Client Brief

MarkOS v3.3.0 cannot stop at canonical CRM records and stitched timelines. Phase 60 must turn those underlying contracts into an actual CRM workspace where operators can manage lead qualification, deal progression, account management, customer-success and renewal workflows, and user-defined pipeline objects without leaving the product.

This phase is not a narrow Kanban board feature and not a reporting-only shell. It must establish the multi-view operational workspace for CRM-native execution by delivering the required views, editable stage interactions, record detail navigation, and the pipeline engine that supports both canonical CRM objects and true user-defined custom objects.

Phase 60 consumes the canonical schema from Phase 58 and the behavioral history from Phase 59. It should not bypass those foundations with route-local state or a UI-only pipeline model.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for operator-facing clarity and non-hype language.
- Visual: Preserve the existing MarkOS control-plane shell, semantic token system, and white-label-ready UI approach established in Phase 37; no rebrand or parallel design language.
- Prohibited: No pipeline workspace that depends on analytics-only truth, no read-only faux CRM views presented as complete workflow surfaces, no custom-object support that bypasses tenant safety or auditability.

## Audience Segment

- Target ICP: Internal MarkOS operators plus future agency and in-house revenue teams managing lead, deal, account, and customer-success workflows.
- Funnel stage: Decision and retention for the product itself; this is a core operational CRM phase rather than a top-of-funnel marketing phase.
- Audience size: Whole CRM surface for v3.3.0; this phase defines how revenue teams actually work inside MarkOS.

## Budget

- Phase budget: $0 external spend; internal engineering and planning only.
- Allocated from: Core platform roadmap capacity under v3.3.0.

## Decisions

_Decisions captured during /gsd:discuss-phase 60_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | Phase 60 must support lead qualification, opportunity/deal, account management, customer-success/renewal, and user-defined custom pipeline families in the first pass | The milestone is Customer 360 and operational revenue execution, not a single sales-board use case | The pipeline engine cannot be hardcoded only around deals or leads |
| D-02 | Full user-defined custom objects are required in Phase 60, not only custom stages on canonical CRM objects | The workspace must handle real operator variance across agencies and in-house teams from day one | Schema, views, and editing flows must accommodate objects beyond contacts, companies, deals, and accounts |
| D-03 | All six required views are mandatory for Phase 60 completeness: Kanban, table, record detail, timeline, calendar, and forecast/funnel | CRM-03 and REP-01 require a real workspace, not a single primary view with placeholders for the rest | Planning should treat all views as delivered scope, though not all need equal interaction depth |
| D-04 | Phase 60 includes editable workspace interactions, not only read-oriented surfaces | Operators need to move work forward directly in the CRM workspace rather than navigating separate CRUD routes for every action | Planning should include drag/drop or equivalent stage mutation flows, inline edits where safe, and calendar-rescheduling interactions where applicable |
| D-05 | The first forecast/funnel surface should optimize for simple stage-count and value funnel visibility, not weighted revenue modeling | The first requirement is operational clarity across pipelines; sophisticated weighted forecasting can wait | Forecast/funnel scope should stay lightweight, legible, and directly tied to pipeline state |
| D-06 | Record detail remains the hub where timeline context and object-specific workflow state come together | Operators need one place to inspect relationship history and current workflow state before later AI or outbound layers arrive | Detail views must integrate Phase 58/59 timeline evidence rather than re-exposing isolated entity forms |
| D-07 | Custom objects must participate in the same view system as canonical objects instead of becoming second-class admin artifacts | A split between “real” CRM objects and custom objects would weaken adoption and make workflow design brittle | Shared schema, filters, stage logic, and view composition need to be object-family aware |
| D-08 | Calendar support is in scope for the first pass, but it should remain grounded in meaningful dates rather than forcing a fake generalized calendar for every object | Calendar is a required view, but not every record type has natural calendar semantics | Planning should define which records and dates are calendar-visible and how custom objects opt in |
| D-09 | Timeline remains a required inspection surface inside record detail and should not be replaced by pure board or table interactions | Phase 58 and 59 make timeline a core CRM primitive, not an optional side panel | Phase 60 UI must visibly consume the CRM activity history instead of treating it as backend-only evidence |
| D-10 | Phase 60 should preserve the editable CRM workspace boundary without absorbing next-best-action logic from Phase 61 | Pipeline views and execution recommendations are different concerns | The phase should stop at operational workflow surfaces and stage/state interactions |
| D-11 | Phase 60 should preserve approval, tenant, IAM, and audit guarantees from earlier phases even when adding drag/drop and inline editing | Rich workspace interactions cannot weaken the enterprise control model | Every mutation path in the workspace must remain policy-safe and auditable |
| D-12 | The phase should optimize for planning-ready decomposition, not speculative reporting or AI assistance | The immediate next need after discussion is a concrete execution plan | The context should clearly separate Phase 60 surface/workspace scope from later Phase 61, 63, and 64 intelligence/reporting scope |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact data model and contract shape for user-defined custom objects, as long as tenant-safe extensibility, pipeline participation, and auditability remain explicit.
2. Exact view composition and navigation hierarchy between workspace-level views and record-level detail pages, provided all required views remain present and coherent.
3. Exact interaction model for stage movement and inline editing, provided edits stay deterministic, auditable, and policy-safe.
4. Exact calendar eligibility rules for canonical and custom object families, provided they are explicit and do not fake unsupported date semantics.
5. Exact stage-count and value-funnel presentation for the first forecast surface, provided it remains directly tied to pipeline truth and avoids pseudo-analytics theater.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Weighted revenue forecast modeling and advanced probabilistic forecasting.
2. Next-best-action scoring, risk flags, and recommendation rationale owned by Phase 61.
3. Native outbound execution orchestration owned by Phase 62.
4. AI copilots, generated summaries, and approval-gated agent workflows owned by Phase 63.
5. Full attribution and reporting cockpit closure owned by Phase 64.

---

_Phase: 60-pipeline-engine-and-multi-view-workspace_
_Context gathered: 2026-04-04_
_Decisions locked: 12 (D-01 through D-12)_
