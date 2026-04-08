---
phase: 59-behavioral-tracking-and-identity-stitching
plan: 02
subsystem: attribution-and-normalization
tags: [tracking, attribution, redirect, crm-timeline, contracts]
completed: 2026-04-04
verification_status: pass
---

# Phase 59 Plan 02 Summary

## Outcome

Added tracked redirect preservation and shared CRM normalization so attribution evidence lands in MarkOS-native activity families instead of vendor-shaped event truth.

## Delivered Evidence

- Added `api/tracking/redirect.js` for tracked-entry redirects with explicit degraded fallback semantics.
- Added `lib/markos/crm/tracking.ts` as the shared normalization and append layer for web activity, campaign touch, attribution updates, and high-signal authenticated events.
- Added contracts `F-59-tracking-activity-ingest-v1.yaml` and `F-59-tracked-entry-redirect-v1.yaml`.
- Tightened `api/crm/activities.js` query handling for deterministic normalized timeline reads.

## Verification

- `node --test test/tracking/tracking-redirect-attribution.test.js test/tracking/crm-activity-normalization.test.js test/tracking/authenticated-event-scope.test.js` -> PASS

## Direct Requirement Closure

- TRK-02 now has direct evidence for redirect enrichment and degraded fallback markers.
- TRK-03 now has direct evidence for normalized activity families and narrow authenticated-event inclusion.