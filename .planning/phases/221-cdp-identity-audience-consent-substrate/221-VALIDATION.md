---
phase: 221
slug: cdp-identity-audience-consent-substrate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 221 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `221-RESEARCH.md` §Validation Architecture. Plans fill task-level verify rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (business logic)** | Vitest (new phase doctrine, V4.0.0-TESTING-ENVIRONMENT-PLAN) + Node.js `--test` (legacy, existing) |
| **Framework (browser journeys)** | Playwright |
| **Framework (visual regression)** | Chromatic via Storybook |
| **Vitest config** | `vitest.config.ts` (Wave 0 gap — created by Wave 0 of 221-01 unless already present from P204/P205) |
| **Quick run command** | `vitest run --reporter=verbose test/cdp-*` |
| **Full suite command** | `npm test && vitest run && npx playwright test --grep cdp` |
| **Estimated runtime** | ~90s quick, ~6 min full (includes Playwright) |

---

## Sampling Rate

- **After every task commit:** Run `vitest run test/<slice-domain>` (scoped to touched domain)
- **After every plan wave:** Run `npm test && vitest run`
- **Before `/gsd:verify-work`:** Full suite (Vitest + Playwright + Chromatic) must be green
- **Max feedback latency:** 90s (quick), 6 min (full)

---

## Per-Task Verification Map

> Plans will populate this table with their actual task IDs (221-NN-MM). Template row below shows shape.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 221-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative/e2e | `vitest run test/cdp-<file>.test.ts` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner will expand this map per-task during plan generation. Each task's `<acceptance_criteria>` must reference at least one row here.*

---

## Wave 0 Requirements

Must be installed/created before any 221-NN wave starts (lands in 221-01 Wave 0 unless satisfied by upstream phase):

- [ ] `vitest.config.ts` — root Vitest config (check if already present from P204/P205)
- [ ] `test/fixtures/cdp/` — CDP fixture factory directory
- [ ] `test/fixtures/cdp/profiles.ts` — `cdpPersonProfile`, `cdpAccountProfile`, `cdpTombstonedProfile`
- [ ] `test/fixtures/cdp/consent.ts` — consent state fixtures (opted-in, opted-out, drifted)
- [ ] `test/fixtures/cdp/events.ts` — event batch fixtures (10 events across 3 domains)
- [ ] `test/fixtures/cdp/audiences.ts` — JSON Logic rule + snapshot fixtures
- [ ] `package.json` — confirm `vitest`, `@vitest/coverage-v8`, `playwright`, `json-logic-js` dependencies (add if missing)

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 8 new tables) | 100% of tables | SOC2 Type I baseline; every table needs cross-tenant denial test |
| Business logic (merge/consent/DSL/tombstone) | 100% of decision branches | Compliance-critical; no uncovered branches |
| API contract shape (F-106..F-112) | 100% of fields | OpenAPI parity per QA-01 |
| Regression (CRM timeline, attribution, outbound consent) | 100% of existing test files | CDP is additive; any failure = regression |
| Negative-path (cross-tenant, tombstone, opt-out) | ≥2 tests per object type | Fail-closed posture must be actively proven |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 221-01 | Identity scoring, merge decision immutability | RLS isolation, FK constraints | F-106, F-107 | CRM identity-link tests | Cross-tenant denial, tombstone reject | Merge review inbox | Inbox states |
| 221-02 | ConsentState CRUD, shim decision tree | Drift audit cron | F-109 | Existing consent.ts tests | Opt-out fail-closed | Consent drift UI | Drift alert states |
| 221-03 | Event envelope + trait upsert | Dual-write, partition insert | F-108, F-110 | Tracking + timeline tests | Tombstoned ingest, duplicate event_id | n/a | n/a |
| 221-04 | JSON Logic eval, snapshot freeze | Audience compute e2e | F-111, F-112 | n/a | Opted-out excluded at dispatch | n/a | Snapshot log |
| 221-05 | Adapter null/tombstone return, API shape | MCP tool RLS | All F-IDs OpenAPI | Timeline + attribution regression | Cross-tenant read denied, tombstoned 404 | CDP profile GET | Profile states |
| 221-06 | Cascade purge, DSR export shape | Full 8-table RLS suite | DSR export shape | All prior suites green | Late event after tombstone | Merge + drift flows | Final states |

---

## Fixture & Seed Data Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `cdpPersonProfile` | One person profile per mode (b2b/b2c/plg_b2b) | 221-01..05 |
| `cdpAccountProfile` | One account profile | 221-01..05 |
| `cdpTombstonedProfile` | Profile with `tombstoned=true` + `deletion_evidence_ref` | 221-06 cascade |
| `cdpConsentStateOptedIn` | All channels opted_in, legal_basis=consent | 221-02..04 |
| `cdpConsentStateOptedOut` | email_marketing=opted_out | 221-02 shim |
| `cdpConsentStateDrifted` | ConsentState vs outboundConsentRecords divergence | 221-02 drift audit |
| `cdpEventBatch` | 10 synthetic events across 3 domains | 221-03 dual-write |
| `cdpTraitSet` | intent_score, lifecycle_state, churn_risk per mode | 221-03..04 |
| `cdpAudienceDefinition` | `{">=": [{"var":"traits.intent_score"}, 0.7]}` | 221-04 DSL |
| `cdpFrozenSnapshot` | AudienceSnapshot with 5 membership rows | 221-04..05 activation |
| `crossTenantContext` | Two tenants, same profile_id (impossible) | 221-01..05 RLS |

Location: `test/fixtures/cdp/`. Importable from all CDP test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Identity merge criteria: "Verified by `cdp-identity-link.test.ts` hard/soft merge cases + `cdp-merge-review.test.ts` immutability."
- Consent shim criteria: "Verified by `cdp-consent-shim.test.ts` ConsentState-first + legacy-fallback paths."
- RLS criteria: "Verified by `cdp-rls-complete.test.ts` cross-tenant denial on all 8 new tables."
- Regression criteria: "Verified by `cdp-tracking-regression.test.ts`, `cdp-timeline-regression.test.ts`, `cdp-attribution-regression.test.ts` all green."
- Deletion criteria: "Verified by `cdp-tombstone.test.ts` + `cdp-cascade.test.ts` + `cdp-deletion-race.test.ts`."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Merge review operator UX flow | CDP-02, EVD-05 | Operator judgment on ambiguous matches | (1) Create drift fixture, (2) open merge inbox, (3) confirm evidence panel + accept/reject route to audit, (4) verify reversal lineage |
| Audience snapshot compute triggered by operator | CDP-03 | Trigger is UI-initiated | (1) Define audience via UI, (2) click compute, (3) verify snapshot row + membership count + audit log entry |
| DSR deletion end-to-end | CDP-05 | Requires tenant-admin UI flow | (1) Issue DSR via admin UI, (2) verify tombstone + cascade + consent retention + export bundle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, vitest.config.ts)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 90s for quick runs, < 6 min for full suite
- [ ] `nyquist_compliant: true` set in frontmatter once plans fill per-task rows

**Approval:** pending
