---
phase: 221
slug: cdp-identity-audience-consent-substrate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
updated: 2026-04-26
---

# Phase 221 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `221-RESEARCH.md` §Validation Architecture and rewritten 2026-04-26
> after Claude-runtime cross-AI review (RH1 Path A — drop vitest/playwright; pin
> `npm test` Node `--test`). Plans fill task-level verify rows.

---

## Test Infrastructure (RH1 Path A — Node `--test` only)

| Property | Value |
|----------|-------|
| **Framework (all tests — unit, integration, contract, regression, negative-path)** | Node.js `--test` (built-in test runner) |
| **Assertion library** | `node:assert/strict` |
| **Test imports** | `const { test, describe, before } = require('node:test'); const assert = require('node:assert/strict');` |
| **Browser e2e** | NOT in P221 (deferred per `<deferred>` toolchain items in 221-CONTEXT.md) — operator UI smoke lives in Plan 06 Task 4 human-action checkpoint |
| **Visual regression** | NOT in P221 (deferred) |
| **Quick run command** | `node --test test/cdp-*.test.js` (or domain-scoped: `node --test test/cdp-identity/`) |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30-60s full suite (Node `--test` is in-process; no separate vitest/playwright bootstrap) |

**Architecture-lock (D-32, D-36):**
- NO vitest install. NO playwright install.
- NO `vitest.config.ts`. NO `playwright.config.ts`.
- NO `*.test.ts` files. All tests are `*.test.js`.
- NO `vitest run` commands. NO `npx playwright test` commands.
- Plan 01 Task 0.5 ships an architecture-lock detector that fails CI if any of the above appear in `221-*-PLAN.md` or `lib/markos/cdp/**`.

---

## Sampling Rate

- **After every task commit:** Run `node --test test/<slice-domain>` (scoped to touched domain)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** `npm test` must be green; manual smoke for operator surfaces (Plan 06 Task 4 checkpoint)
- **Max feedback latency:** ~30-60s for full suite

---

## Per-Task Verification Map

> Plans will populate this table with their actual task IDs (221-NN-MM). Template row below shows shape.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 221-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative | `node --test test/cdp-<file>.test.js` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner expanded this map per-task during plan generation. Each task's `<verify><automated>` references at least one row here.*

---

## Wave 0 Requirements (Plan 01)

Must be installed/created before any 221-NN wave starts:

- [ ] `scripts/preconditions/221-check-upstream.cjs` — assertUpstreamReady CLI (D-35)
- [ ] `lib/markos/cdp/preflight/upstream-gate.ts` — REQUIRED_UPSTREAM = [P207, P209, P210, P214, P215, P216, P217]
- [ ] `lib/markos/cdp/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/cdp/preflight/errors.ts` — UpstreamPhaseNotLandedError + ArchitectureLockViolation
- [ ] `test/cdp-preflight/architecture-lock.test.js` — fails when forbidden patterns appear in 221-*-PLAN.md
- [ ] `test/cdp-preflight/upstream-gate.test.js` — fails when SUMMARY.md missing for any required upstream
- [ ] `test/cdp-preflight/helper-presence.test.js` — pins `requireHostedSupabaseAuth` + `buildApprovalPackage` and rejects `createApprovalPackage` / `requireSupabaseAuth` / `lookupPlugin`
- [ ] `test/fixtures/cdp/profiles.js` — `cdpPersonProfile`, `cdpAccountProfile`, `cdpTombstonedProfile` (CommonJS .js)
- [ ] `test/fixtures/cdp/consent.js` — opted-in, opted-out, drifted fixtures
- [ ] `test/fixtures/cdp/events.js` — 10-event batch across 3 domains
- [ ] `test/fixtures/cdp/audiences.js` — JSON Logic rule + snapshot fixtures
- [ ] `test/fixtures/cdp/index.js` — re-exports
- [ ] `package.json` — `dependencies['json-logic-js'] === '2.0.5'` EXACT pin (RL2; production dep for D-17 audience DSL)
- [ ] `package.json` — does NOT contain `vitest`, `playwright`, `@vitest/coverage-v8`, `@playwright/test` in dependencies or devDependencies (D-36 / RH1 Path A)

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 8 new tables) | 100% of tables | SOC2 Type I baseline; every table needs cross-tenant denial test |
| Business logic (merge/consent/DSL/tombstone) | 100% of decision branches | Compliance-critical; no uncovered branches |
| API contract shape (F-106..F-112) | 100% of fields | OpenAPI parity per QA-01 |
| Regression (CRM timeline, attribution, outbound consent) | 100% of existing test files | CDP is additive; any failure = regression |
| Negative-path (cross-tenant, tombstone, opt-out, DSL injection) | ≥2 tests per object type | Fail-closed posture must be actively proven |
| Architecture-lock detector | All 6 PLAN.md files scanned | RH1 / D-32 |
| Helper-presence | Both required + forbidden helpers verified | RH1 / D-32 / D-33 |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Operator Smoke | Notes |
|-------|------|-------------|----------|------------|---------------|----------------|-------|
| 221-01 | Identity scoring, merge decision immutability, hash, preflight detector | RLS isolation, FK constraints, partial unique index | F-106, F-107 | CRM identity-link tests | Cross-tenant denial, tombstone reject, helper-absent | n/a | Wave 0 ships preflight + fixtures |
| 221-02 | ConsentState CRUD, shim decision tree, GUC writer | Drift audit cron (hourly), single-writer trigger | F-109 | Existing consent.ts tests | Opt-out fail-closed, single-writer rejection | n/a | RM2 single-writer DB trigger |
| 221-03 | Event envelope + trait upsert | Dual-write, partition insert, AgentRun bridge | F-108, F-110 | Tracking + timeline tests | Tombstoned ingest, duplicate event_id | n/a | crons at api/cron/ singular |
| 221-04 | JSON Logic eval, DSL whitelist, snapshot freeze | Audience compute e2e | F-111, F-112 | n/a | Opted-out excluded at dispatch, DSL injection rejection | n/a | RL1 operator whitelist |
| 221-05 | Adapter null/tombstone return, API shape, MCP redaction | MCP RLS, requireHostedSupabaseAuth, cursor pagination | All F-IDs OpenAPI | Timeline + attribution regression | Cross-tenant 404 + audit, tombstoned 404, deletion_evidence_ref redaction | n/a | RM3 fixes |
| 221-06 | Cascade purge, DSR export shape, reconciliation diff | Full 8-table RLS, reconciliation cron, F-ID/migration collision | DSR export shape | All prior suites green | Late event after tombstone, single-writer trigger smoke | YES (Plan 06 Task 4 human-action checkpoint per RL3) | autonomous: false |

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

Location: `test/fixtures/cdp/`. CommonJS `.js` files. Importable from all CDP test files via `const { ... } = require('../../fixtures/cdp');`.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Identity merge: "Verified by `cdp-identity-link.test.js` hard/soft merge cases + `cdp-merge-review.test.js` immutability + buildApprovalPackage usage."
- Consent shim: "Verified by `cdp-consent-shim.test.js` ConsentState-first + legacy-fallback paths + `cdp-consent-single-writer.test.js` GUC trigger."
- RLS: "Verified by `cdp-rls-complete.test.js` cross-tenant denial on all 8 new tables (Plan 06 Task 2)."
- Regression: "Verified by `cdp-tracking-regression.test.js`, `cdp-timeline-regression.test.js`, `cdp-attribution-regression.test.js` all green."
- Deletion: "Verified by `cdp-tombstone.test.js` + `cdp-cascade.test.js` + `cdp-deletion-race.test.js`."
- Architecture-lock: "Verified by `architecture-lock.test.js` (Plan 01 Task 0.5) — fails when any PLAN.md contains forbidden patterns."
- Helper-presence: "Verified by `helper-presence.test.js` — pins `requireHostedSupabaseAuth` + `buildApprovalPackage`; rejects `createApprovalPackage` / `requireSupabaseAuth` / `lookupPlugin`."
- F-ID + migration slot: "Verified by `f-id-collision.test.js` + `migration-slot-collision.test.js` (Plan 06 Task 2; RM4)."
- DSL whitelist: "Verified by `cdp-audience-dsl-whitelist.test.js` — rejects `eval`, `fn`, `log`, `method`, `unsafe-merge` (Plan 04 RL1)."

---

## Manual-Only Verifications (Plan 06 Task 4 Human-Action Checkpoint per RL3)

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First drift batch threshold validation | RUN-04, RUN-05 | Operator must approve 0.1% threshold (or per-tenant overrides) before unattended cron runs | (1) `npm test` green; (2) trigger reconciliation cron manually with `x-markos-cron-secret`; (3) read JSON; (4) classify each tenant breach as drift / lag / partition-fill; (5) approve threshold for unattended operation |
| Merge review operator UX flow | CDP-02, EVD-05 | Operator judgment on ambiguous matches | (1) Create drift fixture; (2) inspect merge inbox query result; (3) confirm CDP evidence panel + accept/reject route to audit; (4) verify reversal lineage |
| DSR tombstone end-to-end | CDP-05 | Compliance signoff | (1) Create test profile with full data; (2) call `tombstoneIdentityProfile`; (3) verify PII null + cascade purges + ConsentState retained + audit row |
| Single-writer trigger smoke | RM2 / D-39 | DB-level enforcement signoff | (1) Direct INSERT to outboundConsentRecords without GUC → reject; (2) INSERT inside `cdp_setConsentState` GUC transaction → succeed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (preflight, fixtures, json-logic-js@2.0.5 EXACT)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency <60s for `npm test`
- [ ] Architecture-lock detector green: zero `vitest`, zero `playwright`, zero `.test.ts`, zero `api/crons/` (plural), zero `route.ts`, zero forbidden helpers across all 6 PLAN.md files
- [ ] Helper-presence test green: `requireHostedSupabaseAuth` + `buildApprovalPackage` exist; `createApprovalPackage` / `requireSupabaseAuth` / `lookupPlugin` do not
- [ ] F-ID collision + migration slot collision tests green (RM4)
- [ ] DSL whitelist test green (RL1)
- [ ] HUMAN-ACTION checkpoint approved (RL3)
- [ ] `nyquist_compliant: true` set in frontmatter once plans fill per-task rows

**Approval:** pending
