---
phase: 60-pipeline-engine-and-multi-view-workspace
plan: 03
subsystem: calendar-funnel-and-coherence
tags: [crm, calendar, funnel, telemetry, workspace-coherence]
completed: 2026-04-04
verification_status: pass
---

# Phase 60 Plan 03 Summary

## Outcome

Finished the six-view CRM workspace by adding honest calendar and funnel surfaces, proving cross-view coherence, and closing the validation ledger around canonical CRM truth.

## Delivered Evidence

- Added rollup contract coverage in `contracts/F-60-workspace-rollups-v1.yaml`.
- Added calendar and funnel UI in `components/markos/crm/calendar-view.tsx` and `components/markos/crm/funnel-view.tsx`.
- Added tenant-safe calendar and funnel APIs in `api/crm/calendar.js` and `api/crm/funnel.js`.
- Extended workspace helpers and shell wiring in `lib/markos/crm/workspace.ts` and `components/markos/crm/workspace-shell.tsx`.
- Added Phase 60 workspace telemetry names in `lib/markos/telemetry/events.ts`.
- Added regression coverage for calendar eligibility, funnel rollups, and six-view coherence.

## Verification

- `node --test test/crm-workspace/crm-calendar-view.test.js test/crm-workspace/crm-funnel-view.test.js test/crm-workspace/crm-cross-view-coherence.test.js` -> PASS

## Direct Requirement Closure

- CRM-03 now includes all six required workspace views with shared canonical truth.
- REP-01 now has simple operational funnel rollups grounded in canonical pipeline records.