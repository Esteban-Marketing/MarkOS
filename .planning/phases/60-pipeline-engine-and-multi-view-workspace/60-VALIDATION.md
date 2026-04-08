---
phase: 60
phase_name: Pipeline Engine and Multi-View Workspace
discipline: outbound
type: standard
created: 2026-04-04
---

# Phase 60: Pipeline Engine and Multi-View Workspace — Validation

**Status:** PASS

**Purpose:** Records execution-grade evidence that the Phase 60 CRM workspace now ships all six required views over one canonical record layer with auditable mutations, explicit calendar eligibility, and simple funnel rollups.

## Phase Goal
Deliver a tenant-safe CRM workspace where operators can manage canonical and custom-object pipelines inside MarkOS through Kanban, table, record detail, timeline, calendar, and simple funnel views backed by one canonical CRM record layer.

## Validation Result

| Scope | Result | Evidence |
|-------|--------|----------|
| Tenant-owned pipeline and object metadata | PASS | `supabase/migrations/60_crm_pipeline_workspace.sql`, `contracts/F-60-pipeline-config-v1.yaml`, `contracts/F-60-object-workspace-metadata-v1.yaml`, `api/crm/pipelines.js`, `api/crm/object-definitions.js` |
| Shared workspace core (Kanban, table, detail, timeline) | PASS | `lib/markos/crm/workspace.ts`, `components/markos/crm/workspace-shell.tsx`, `api/crm/records.js`, `test/crm-workspace/crm-workspace-views.test.js`, `test/crm-workspace/crm-record-detail-timeline.test.js`, `test/crm-api/crm-workspace-mutations.test.js` |
| Calendar eligibility and reschedule seam | PASS | `contracts/F-60-workspace-rollups-v1.yaml`, `components/markos/crm/calendar-view.tsx`, `api/crm/calendar.js`, `test/crm-workspace/crm-calendar-view.test.js` |
| Funnel count and value rollups | PASS | `components/markos/crm/funnel-view.tsx`, `api/crm/funnel.js`, `test/crm-workspace/crm-funnel-view.test.js` |
| Cross-view coherence | PASS | `components/markos/crm/workspace-shell.tsx`, `lib/markos/crm/workspace.ts`, `test/crm-workspace/crm-cross-view-coherence.test.js` |
| Workspace telemetry vocabulary | PASS | `lib/markos/telemetry/events.ts` |

## Deliverables and Verification Methods

| Deliverable | Verification Method | Responsible | Dimension |
|-------------|-------------------|-------------|-----------|
| Tenant-owned pipeline and stage config exists | Migration and schema tests plus API contract checks | AI | Configuration |
| Canonical and custom objects share explicit workspace eligibility rules | Schema tests, object-definition API tests, and manual capability review | AI / Human | Extensibility |
| Kanban, table, record detail, and timeline operate over one canonical record layer | Workspace and detail integration tests with shared filter-state assertions | AI | Workspace Core |
| Stage moves, inline edits, note or task updates, and reschedules remain auditable | Mutation API tests and CRM activity assertions | AI | Auditability |
| Calendar view only exposes approved object families and date fields | Calendar integration tests and object-capability contract inspection | AI | Calendar Integrity |
| Funnel exposes stage count and value totals directly from canonical records | Funnel aggregation tests and payload inspection | AI | Funnel Integrity |
| Cross-view edits remain coherent across all six views | Cross-view coherence tests from Kanban, table, detail, calendar, and funnel | AI | Workspace Truth |

## MIR Gate Requirements

Gate 1 (Identity) — files that must be populated before this phase:
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- `Core_Strategy/02_BUSINESS/LEAN-CANVAS.md`
- `Core_Strategy/02_BUSINESS/JTBD-MATRIX.md`

Gate 2 (Execution) — files that must be populated:
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/06_TECH-STACK/AUTOMATION.md`
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`

## KPI Measurement Outcome

| KPI | Baseline | Target | Data Source | Review Date |
|-----|---------|--------|------------|-------------|
| Six-view workspace completeness | 0 of 6 | 6 of 6 | Achieved via workspace shell plus calendar/funnel tests | Phase 60 execution closeout |
| Authorized stage-move success | Not yet implemented | >=99% | Achieved through audited mutation test coverage | Phase 60 execution closeout |
| Record detail timeline correctness | Placeholder only | 100% ordered and canonical | Achieved through detail/timeline regression coverage | Phase 60 execution closeout |
| Calendar eligibility correctness | Not yet implemented | 100% approved-object/date adherence | Achieved through calendar eligibility and reschedule tests | Phase 60 execution closeout |
| Funnel count/value freshness | Not yet implemented | <=1 min equivalent logic path | Achieved through direct canonical rollup tests | Phase 60 execution closeout |
| Cross-view filter persistence | Not yet implemented | 100% within session | Achieved through cross-view coherence regression coverage | Phase 60 execution closeout |

## Human Testing Follow-Through

Optional hosted checks that remain useful for visual confirmation:
1. Open the protected CRM workspace in a hosted environment, switch among Kanban, table, detail, timeline, calendar, and funnel, and confirm the shell remains consistent and tenant-aware.
2. Perform a stage move and a field edit, then verify the record detail timeline reflects both mutations with clear lineage.
3. Review one custom object configured for pipeline participation and one excluded from calendar participation to confirm the workspace enforces object-capability rules honestly.

## Automated Checks

Verifiable via file read or CLI:
- `node --test test/crm-schema/crm-pipeline-config.test.js test/crm-api/crm-pipeline-api.test.js test/tenant-auth/crm-pipeline-tenant-isolation.test.js test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-record-detail-timeline.test.js test/crm-api/crm-workspace-mutations.test.js test/crm-workspace/crm-calendar-view.test.js test/crm-workspace/crm-funnel-view.test.js test/crm-workspace/crm-cross-view-coherence.test.js` -> PASS (21/21)
- `get_errors` on the modified Phase 60 runtime and test files -> PASS after Wave 3 fixes

## Exit Conditions

Phase 60 is complete because:

1. Pipeline, stage, and object-capability config are tenant-owned and mutation-safe.
2. All six required views are present and backed by one canonical CRM record layer.
3. Stage moves, inline edits, date changes, and related updates append auditable CRM activity.
4. Calendar only renders approved objects and date fields.
5. Funnel totals are simple count and value rollups derived directly from canonical records.
6. Cross-view edits and filters remain coherent across the full workspace session.

---
Phase 60 validation completed 2026-04-04.
