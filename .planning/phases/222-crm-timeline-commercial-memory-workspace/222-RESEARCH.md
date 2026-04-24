# Phase 222 Research - CRM Timeline and Commercial Memory Workspace

## Primary research question

How should MarkOS evolve its existing CRM substrate into the timeline-first customer-360 and commercial-memory model described in doc 18 without throwing away the working CRM foundations already in the repo?

## Standard Stack

- Reuse the current CRM app/API/lib layers under `app/(markos)/crm`, `api/crm/*`, and `lib/markos/crm/*`.
- Keep task, approval, and agent-run linkages as downstream integrations rather than inventing CRM-only state machines.
- Use CDP outputs from Phase 221 as upstream facts instead of embedding another identity layer directly in CRM.

## Architecture Patterns

- Timeline-first history with views derived from it.
- Stable entity store for account/contact/deal/customer plus richer customer-360 read models.
- Workspace snapshots for kanban/table/detail/timeline/calendar/funnel remain a good UI pattern.
- Merge decisions, lineage, and identity links stay append-oriented and auditable.

## Don't Hand-Roll

- A second timeline model outside `buildCrmTimeline`.
- Standalone task or note systems inside CRM.
- Sales-memory or customer-memory documents detached from the CRM entity/timeline model.

## Common Pitfalls

- Treating the current entity store as if it were already customer 360.
- Expanding CRM UI shells without first defining account/person/opportunity/lifecycle contracts.
- Storing scores and next-best-action logic as opaque UI-only view models.

## Codebase Findings

### Files inspected

- `lib/markos/crm/api.cjs`
- `lib/markos/crm/contracts.ts`
- `lib/markos/crm/timeline.ts`
- `lib/markos/crm/workspace-data.ts`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/merge.ts`
- `app/(markos)/crm/page.tsx`
- `api/crm/activities.js`

### Existing support

- CRM entities, pipelines, object definitions, timelines, merges, and workspace snapshots already exist.
- Timeline replay already supports stitched identity history.
- Execution logic already computes urgency, stalled work, inbound touches, and approval/risk signals.
- CRM API routes already expose activities and object-centric flows.

### Missing capabilities

- No explicit `Customer360`, `AccountWorkspace`, `PersonWorkspace`, or lifecycle-stage system-of-record.
- No unified buying-committee model.
- No durable next-best-action or commercial-summary object model.
- No shared revenue/risk/fit/intent score envelope across account/person/opportunity/customer.
- No true relationship-memory layer spanning marketing, sales, support, CS, and billing.

## Recommended Implementation Path

1. Keep the current CRM entity and timeline substrate as the durable base.
2. Add richer read/write contracts: `Customer360Record`, `AccountWorkspace`, `PersonWorkspace`, `OpportunityWorkspace`, and `LifecycleState`.
3. Extend the timeline taxonomy rather than replacing it.
4. Use CDP outputs for identity, consent, and audience enrichment rather than storing those rules twice.
5. Make next-best-action, summary, risk, and lifecycle recommendations explicit persisted objects or reducers, not page-only calculations.

## Tests Implied

- Timeline-order and stitched-history tests.
- Lifecycle transition and next-best-action tests.
- Merge-lineage and account/person relationship tests.
- Workspace snapshot tests for derived views.
- Browser tests for customer-360, timeline, risk, and action-routing flows.

## Research Decisions

- The existing CRM work is a real asset and should be extended, not replaced.
- Phase 222 should define the customer-360 and commercial-memory contract before adding more UI surface.
- Timeline remains the truth layer; boards, tables, and detail screens remain derived views.
