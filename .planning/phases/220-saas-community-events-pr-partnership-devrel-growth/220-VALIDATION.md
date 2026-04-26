---
phase: 220
slug: saas-community-events-pr-partnership-devrel-growth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 220 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P221 D-36 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/growth-220/preflight/` |
| **Full suite command** | `npm test -- test/growth-220/ test/api-contracts/220-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/growth-220/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/growth-220/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 220-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/growth-220/preflight/` | ❌ W0 | ⬜ pending |
| 220-01-01 | 01 | 1 | SG-04,11,12 | schema | `npm test -- test/growth-220/referral/` | ❌ W0 | ⬜ pending |
| 220-02-01 | 02 | 2 | SG-06,09 | schema | `npm test -- test/growth-220/community/` | ❌ W0 | ⬜ pending |
| 220-03-01 | 03 | 2 | SG-06, LOOP-06,08 | schema | `npm test -- test/growth-220/events/` | ❌ W0 | ⬜ pending |
| 220-04-01 | 04 | 3 | SG-06, EVD-01..06 | schema | `npm test -- test/growth-220/pr/` | ❌ W0 | ⬜ pending |
| 220-05-01 | 05 | 3 | SG-06,11,12 | schema | `npm test -- test/growth-220/partners/` | ❌ W0 | ⬜ pending |
| 220-06-01 | 06 | 4 | SG-10, API-01, MCP-01 | api+mcp | `npm test -- test/api-contracts/220-* test/growth-220/mcp/` | ❌ W0 | ⬜ pending |
| 220-06-02 | 06 | 4 | RUN-01..08, QA-03..15 | closeout | `npm test -- test/growth-220/closeout/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

Detailed per-task map populates during planning iteration; planner expands rows per Plan task.

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/220-check-upstream.cjs` — assertUpstreamReady CLI for P214/P215/P218 (hard) + P205/P207-212/P216/P217/P219 (soft)
- [ ] `lib/markos/growth/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/growth/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/growth/preflight/errors.ts` — UpstreamPhaseNotLandedError
- [ ] `test/growth-220/preflight/architecture-lock.test.js`
- [ ] `test/growth-220/preflight/upstream-gate.test.js`
- [ ] `test/growth-220/preflight/helper-presence.test.js` — verifies buildApprovalPackage/requireHostedSupabaseAuth/resolvePlugin exist; createApprovalPackage/requireSupabaseAuth/lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/growth-220/*.js` (NOT `.ts` per architecture-lock)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator review of fraud signals (referral payout) | SG-04, SG-11 | Anti-fraud judgment requires human; cannot automate decision boundary | Operator reviews `fraud_review_queue` entries; approves/rejects via approval inbox |
| Public PR claim evidence freshness | SG-06, EVD-01..06 | Evidence freshness in journalistic context requires editorial judgment | Operator reviews stale evidence claims via P208 approval inbox before public dispatch |
| First-batch drift (community moderation) | SG-06, SG-09 | Community moderation thresholds need operator validation | Plan 06 Task X `checkpoint:human-action` — operator validates first batch of moderation actions before unattended cron |
| Affiliate fraud thresholds | SG-04, SG-11, SG-12 | Cross-tenant fraud detection requires human cross-check before payout | Operator reviews fraud_signals via approval inbox before payout export |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `220-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (Referral/Viral):** unit (RLS, schema, fraud evaluators), integration (DB-trigger payout single-writer), regression (P204 backwards-compat)
- **Domain 2 (Community):** unit (RLS, signal classifier), integration (Slack/Discord webhook handlers — replay-safe), regression
- **Domain 3 (Events):** unit (schema, attribution evaluators), integration (Eventbrite/Lu.ma webhook handlers), regression
- **Domain 4 (PR):** unit (RLS, evidence FK constraint), integration (G2/Capterra webhook handlers), regression
- **Domain 5 (Partners + Devrel):** unit (RLS, payout DB-trigger), integration (P215 billing/payout hooks), regression
- **Domain 6 (Growth API + MCP + UI + Agent readiness):** unit (cross-tenant isolation), integration (MCP tool registration .cjs), regression (P204 backwards-compat); checkpoint:human-action for first-run agent activation

**Architecture-lock regression:** `test/growth-220/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 220-*-PLAN.md bodies for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(public), app/(markos), api/v1/.../route.ts, vitest run, from 'vitest', .test.ts, "stub if missing", "if exists"). Test fails wave if any positive invocation found.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All 24 IDs (SG-04/06/07/09-12 + API-01 + MCP-01 + QA-01..15) mapped to plans during planning iteration |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance gates per domain (referral payout single-writer, affiliate commission immutability, evidence FK constraint, etc.) |
| 5. Cross-phase coordination | DRAFT | P220 → P227 ALTER TABLE additive specified (5 SaaS-mode tables); Q-1 + Q-3 collisions resolved during planning |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance enforcement boundary |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 220-saas-community-events-pr-partnership-devrel-growth*
*Validation strategy created: 2026-04-26*
*Source: 220-RESEARCH.md + 220-REVIEWS.md*
