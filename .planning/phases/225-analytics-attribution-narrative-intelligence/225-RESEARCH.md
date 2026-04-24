# Phase 225 Research - Analytics, Attribution, and Narrative Intelligence

## Primary research question

How can MarkOS turn its current CRM reporting and attribution logic into a semantic analytics layer that explains numbers, drives decisions, and spans CRM, channels, launches, and ecosystem outcomes?

## Standard Stack

- Reuse current reporting code in `lib/markos/crm/reporting.ts` and attribution logic in `lib/markos/crm/attribution.ts`.
- Keep analytics tenant-scoped and compatible with existing reporting UI shells.
- Make analytics a semantic/read-model layer fed by CDP, CRM, channel, launch, and ecosystem facts.

## Architecture Patterns

- Metric catalog with source precedence and freshness.
- Attribution models as explicit versioned strategies.
- Readiness/executive-summary/narrative layers built from semantic metrics.
- Analytics should create tasks, alerts, and decisions, not just charts.

## Don't Hand-Roll

- Page-specific metric logic scattered across dashboards.
- Unversioned attribution rules.
- Analytics numbers that cannot trace back to CRM touches, identity links, or source events.

## Common Pitfalls

- Treating current CRM reporting as if it already covers the whole commercial stack.
- Building pretty dashboards before defining metric ownership and precedence.
- Letting launch, partner, or channel analytics invent their own incompatible metric names.

## Codebase Findings

### Files inspected

- `lib/markos/crm/attribution.ts`
- `api/crm/reporting/attribution.js`
- `lib/markos/crm/reporting.ts`
- `app/(markos)/crm/reporting/page.tsx`
- `api/tracking/ingest.js`

### Existing support

- Weighted attribution logic already exists and already uses CRM timeline plus identity links.
- CRM reporting already exposes readiness, cockpit, executive summary, and central rollup concepts.
- Reporting UI shells already exist for dashboard, evidence rail, executive summary, and central rollup.

### Missing capabilities

- No formal metric catalog or semantic layer.
- No multi-domain attribution model spanning launches, ecosystem, and future owned channels.
- No freshness/provenance contract per metric.
- No true narrative-intelligence layer beyond handcrafted summary objects.
- No decision-routing contract that turns analytics conclusions into tasks or approvals.

## Recommended Implementation Path

1. Promote current CRM reporting into a broader semantic analytics package rather than replacing it.
2. Add explicit metric definitions, source precedence, freshness, and attribution-model versioning.
3. Expand the current reporting shell into analytics workspaces once the semantic layer exists.
4. Feed narratives and alerts from the semantic layer, not directly from page components.
5. Make launch, ecosystem, and sales enablement analytics consume the same metric catalog.

## Tests Implied

- Metric-definition and precedence tests.
- Attribution-window/model tests.
- Freshness and contradictory-signal tests.
- Narrative-generation and decision-routing tests.
- Browser tests for drill-down, stale-data, and blocked-interpretation cases.

## Research Decisions

- Phase 225 should extend current CRM reporting instead of starting from a blank slate.
- The first slice is metric semantics plus attribution provenance, not dashboard proliferation.
- Narrative intelligence should be built as a consumer of the semantic layer, not the source of truth.
