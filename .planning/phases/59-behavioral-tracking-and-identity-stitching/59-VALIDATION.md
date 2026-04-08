---
phase: 59
phase_name: Behavioral Tracking and Identity Stitching
discipline: outbound
type: standard
created: 2026-04-04
---

# Phase 59: Behavioral Tracking and Identity Stitching — Validation Strategy

**Purpose:** Maps Phase 59 deliverables to verification methods so execution and later verification can prove CRM-feeding tracking, attribution preservation, normalization, and history attachment directly.

## Phase Goal
Wire proxy-based PostHog telemetry, ads and affiliate tracking-subdomain flows, identity stitching, and CRM activity ingestion into a MarkOS-owned, tenant-safe, timeline-visible behavioral history layer.

## Deliverables and Verification Methods

| Deliverable | Verification Method | Responsible | Dimension |
|-------------|-------------------|-------------|-----------|
| First-party CRM-feeding ingestion path exists | Automated contract tests against `api/tracking/ingest.js` and browser bootstrap assertions | AI | Tracking |
| Browser capture uses MarkOS-owned path rather than direct hosted-PostHog-only target state | Browser contract test and source inspection in `onboarding/onboarding.js` | AI | Tracking |
| Tracked redirect preserves UTM/referral context and explicit degraded fallbacks | Redirect attribution tests and portable payload inspection | AI | Attribution |
| Raw activity normalizes into CRM-readable activity families | Normalization tests against `lib/markos/crm/tracking.ts` and timeline assertions | AI | CRM Truth |
| Balanced identity stitching attaches eligible anonymous history to known records | Stitching and end-to-end history attachment tests with accepted/review/rejected cases | AI | Identity |
| High-signal authenticated events remain CRM-visible while low-signal noise is excluded | Authenticated-event-scope tests and manual spot review of allowed families | AI / Human | Timeline Quality |

## Requirement Evidence Ledger

| Requirement | Direct Evidence | Status |
|-------------|-----------------|--------|
| TRK-01 | `api/tracking/ingest.js`, onboarding browser migration, proxy-ingest and browser-contract tests | PASS |
| TRK-02 | `api/tracking/redirect.js`, `F-59-tracked-entry-redirect-v1.yaml`, redirect attribution tests | PASS |
| TRK-03 | `lib/markos/crm/tracking.ts`, `F-59-tracking-activity-ingest-v1.yaml`, normalization and authenticated-scope tests | PASS |
| TRK-04 | `api/tracking/identify.js`, `F-59-identity-stitching-v1.yaml`, stitch and end-to-end history attachment tests | PASS |

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

## KPI Measurement Plan

| KPI | Baseline | Target | Data Source | Review Date |
|-----|---------|--------|------------|-------------|
| First-party proxy acceptance for in-scope CRM-feeding events | Not yet implemented | >=99% | Proxy-ingest test fixtures plus runtime evidence | Phase 59 execution closeout |
| Tracked-entry attribution preservation | Not yet implemented | >=95% with explicit degraded-state tagging when incomplete | Redirect attribution fixtures and CRM payload inspection | Phase 59 execution closeout |
| High-confidence anonymous-history attachment success | Not yet implemented | >=90% for eligible high-confidence conversions | Stitching fixtures and end-to-end timeline tests | Phase 59 execution closeout |
| False-positive auto-link rate in seeded negative paths | Not yet implemented | <2% | Stitching test fixtures with rejected weak-signal cases | Phase 59 execution closeout |
| CRM timeline freshness for normalized tracked history | Not yet implemented | <=5 min equivalent logic path | Ingest and normalization test evidence | Phase 59 execution closeout |

## Human Testing Items

Steps that require platform or hosted-environment access to verify:
1. Open a public or onboarding first-party surface in a hosted environment and verify the browser client points at the MarkOS-owned ingestion path rather than directly at hosted PostHog.
2. Hit a tracked redirect entry URL with UTM and referral context, then verify the destination resolves correctly and the resulting CRM history includes preserved attribution fields or explicit degraded fallback markers.
3. Complete a high-confidence conversion flow and confirm the known record timeline shows the anonymous pre-conversion history with accepted stitch evidence rather than silent mutation.

## Automated Checks

Verifiable via file read or CLI:
- `node --test test/tracking/tracking-proxy-ingest.test.js test/tracking/tracking-browser-contract.test.js test/tenant-auth/tracking-tenant-guard.test.js`
- `node --test test/tracking/tracking-redirect-attribution.test.js test/tracking/crm-activity-normalization.test.js test/tracking/authenticated-event-scope.test.js`
- `node --test test/crm-identity/crm-session-stitching.test.js test/tracking/tracking-e2e-history-attachment.test.js test/tenant-auth/tracking-tenant-guard.test.js`
- `node --test test/tracking/tracking-proxy-ingest.test.js test/tracking/tracking-browser-contract.test.js test/tracking/tracking-redirect-attribution.test.js test/tracking/crm-activity-normalization.test.js test/tracking/authenticated-event-scope.test.js test/crm-identity/crm-session-stitching.test.js test/tracking/tracking-e2e-history-attachment.test.js test/tenant-auth/tracking-tenant-guard.test.js`
- `get_errors` on `59-01-PLAN.md`, `59-02-PLAN.md`, `59-03-PLAN.md`, and `59-VALIDATION.md`

## Automated Evidence Snapshot

- Wave 1 verification passed with proxy ingest, browser migration, and protected-surface tenant guard coverage green.
- Wave 2 verification passed with redirect attribution preservation, CRM activity normalization, and authenticated-event scope coverage green.
- Wave 3 verification passed with accepted, review, and rejected stitch outcomes plus end-to-end history attachment coverage green.
- Full phase regression passed with 21/21 tests green across all three execution waves.

## Exit Conditions

Phase 59 is only considered complete when:

1. CRM-feeding browser and app telemetry uses a MarkOS-owned first-party path.
2. Tracked redirect flows preserve attribution context or explicitly encode degraded fallback state.
3. Normalized events appear as CRM-readable activity families rather than raw vendor-shaped truth.
4. Balanced identity stitching makes accepted, review-only, and rejected outcomes explicit.
5. Known-record CRM timelines visibly reflect eligible anonymous pre-conversion history after approved identity attachment.

## Manual Exit Checks

1. Confirm a hosted onboarding or public surface sends CRM-feeding events to `/api/tracking/ingest` rather than direct vendor capture.
2. Confirm a real tracked redirect preserves UTM and affiliate parameters on the destination URL and produces CRM-visible `campaign_touch` evidence.
3. Confirm a real accepted identity assertion exposes pre-conversion anonymous history on the known-record CRM timeline while review-only assertions do not.

---
Phase 59 Validation Strategy updated after execution closeout on 2026-04-04.
