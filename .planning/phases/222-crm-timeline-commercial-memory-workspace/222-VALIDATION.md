---
phase: 222
slug: crm-timeline-commercial-memory-workspace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 222 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `222-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Node.js `--test` (`npm test`) — D-39 (vitest DEFERRED) |
| **Framework (legacy regression)** | (same as primary — `npm test`) |
| **E2E framework** | Playwright DEFERRED per D-39; manual operator journeys + Chromatic visual regression for P222 |
| **Visual regression** | Chromatic via Storybook |
| **Test runner config** | `package.json` `test` script invokes `node --test` (no extra config needed) |
| **Playwright config** | n/a (Playwright DEFERRED per D-39) |
| **Quick run command** | `node --test test/crm360/*.test.js` |
| **Full suite command** | `npm test && npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes` (Playwright DEFERRED per D-39) |
| **Estimated runtime** | ~90s quick, ~5 min full (Chromatic visual gate + node:test regression; Playwright DEFERRED) |

---

## Sampling Rate

- **After every task commit:** `node --test test/crm360/<slice-domain>*.test.js`
- **After every plan wave:** `node --test test/crm360/*.test.js && npm test`
- **Before `/gsd:verify-work`:** Full suite (`npm test` + Chromatic visual gate + manual operator journeys) green; Playwright DEFERRED per D-39
- **Max feedback latency:** 90s (quick), 8 min (full)

---

## Per-Task Verification Map

> Planner populates per task. Template row below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 222-01-01 | 01 | 1 | CRM-01, CRM-02, CDP-02, CDP-05, QA-02 | wave-0 + unit + integration + migration | `node --test test/crm360/customer360.test.js test/crm360/opportunity.test.js` | ⬜ TBD | ⬜ pending |
| 222-01-02 | 01 | 1 | CRM-01, CRM-05, QA-01 | unit + integration + contract | `node --test test/crm360/legacy-adapter.test.js test/crm360/pricing-guard.test.js` | ⬜ TBD | ⬜ pending |
| 222-02-01 | 02 | 2 | CRM-01, CRM-03, QA-02 | unit + integration | `node --test test/crm360/lifecycle.test.js test/crm360/stage-router.test.js` | ⬜ TBD | ⬜ pending |
| 222-02-02 | 02 | 2 | CRM-03, CDP-04, TASK-02, QA-01 | unit + integration + contract | `node --test test/crm360/emit.test.js test/crm360/multi-role-ownership.test.js` | ⬜ TBD | ⬜ pending |
| 222-03-01 | 03 | 2 | CRM-01, QA-02 | migration | `node -e "..."` (see 222-03-PLAN.md Task 1 verify) | ⬜ TBD | ⬜ pending |
| 222-03-02 | 03 | 2 | CRM-01, CDP-04, TASK-03, QA-01 | unit + integration + contract | `node --test test/crm360/timeline-extensions.test.js test/crm360/timeline-api.test.js` | ⬜ TBD | ⬜ pending |
| 222-03-03 | 03 | 2 | CRM-01 | component + storybook + chromatic | `npx chromatic --project-token=... --exit-zero-on-changes --only-changed` (Warning 8 disposition; file-presence precondition runs first) | ⬜ TBD | ⬜ pending |
| 222-04-01 | 04 | 3 | CRM-02, CRM-05, QA-02 | unit + integration + migration | `node --test test/crm360/nba.test.js` | ⬜ TBD | ⬜ pending |
| 222-04-02 | 04 | 3 | CRM-02, CRM-04, TASK-01, TASK-03, QA-01 | unit + integration + contract + regression | `node --test test/crm360/execution-nba-refactor.test.js test/crm360/nba-recompute.test.js && npm test` | ⬜ TBD | ⬜ pending |
| 222-05-01 | 05 | 4 | CRM-03, CRM-04, QA-02 | unit + integration + migration | `node --test test/crm360/committee.test.js` | ⬜ TBD | ⬜ pending |
| 222-05-02 | 05 | 4 | CRM-01..05, CDP-01..05, TASK-04, TASK-05, QA-01 | contract + integration | `node --test test/crm360/api-crm360.test.js test/crm360/mcp-tools.test.js` | ⬜ TBD | ⬜ pending |
| 222-05-03 | 05 | 4 | CRM-02, CRM-03, TASK-02, TASK-04, QA-03..08 | component + storybook + brief-register + reporting-extend | `node -e "..."` (file-presence + brief-registry token scan + reporting.ts token scan; see 222-05-PLAN.md Task 3 verify) | ⬜ TBD | ⬜ pending |
| 222-06-01 | 06 | 5 | QA-02, TASK-01, all | integration + RLS suite | `node --test test/crm360/drift-reconciliation.test.js test/crm360/rls-suite.test.js` | ⬜ TBD | ⬜ pending |
| 222-06-02 | 06 | 5 | QA-03..15 | manual journeys + Chromatic visual regression (Playwright DEFERRED per D-39) | manual operator-journey checklist (Task 2 in 222-06-PLAN.md) + `npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes` (Playwright DEFERRED per D-39) | ⬜ TBD | ⬜ pending |
| 222-06-03 | 06 | 5 | all (closeout) | docs | `node -e "..."` SUMMARY + STATE + ROADMAP presence + F-113..121 + migrations 106..112 token scan | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note (Warning 11 fix):** Rows populated from each plan's `<verification>` per-task table. `nyquist_compliant` remains `false` in frontmatter — only execute-phase flips it to `true` once tests actually pass. `wave_0_complete` remains `false` until 222-01 Task 1 ships fixture factories under `test/fixtures/crm360/*.js` (no Vitest/Playwright install per D-39).

---

## Wave 0 Requirements

Verify before any 222-NN wave starts (lands in 222-01 Wave 0 unless satisfied by upstream P221):

- [ ] Test runner = `node --test` via `npm test` script (no Vitest/Playwright install per D-39)
- [ ] Playwright DEFERRED per D-39 (no playwright.config.ts; manual operator journeys + Chromatic for P222)
- [ ] `test/fixtures/crm360/` — CRM360 fixture factory directory (distinct from P221's `test/fixtures/cdp/`)
- [ ] `test/fixtures/crm360/customer360.js` — minimal + full + tombstoned Customer360 variants
- [ ] `test/fixtures/crm360/opportunity.js` — healthy/at_risk/stalled + pricing_context_id variants
- [ ] `test/fixtures/crm360/lifecycle.js` — all 11 from→to stage transition variants + handoff variant
- [ ] `test/fixtures/crm360/nba.js` — active/dismissed/expired/superseded variants
- [ ] `test/fixtures/crm360/committee.js` — full coverage + missing roles variants
- [ ] `test/fixtures/crm360/committee-member.js` — active + historical (valid_to set) variants
- [ ] `test/fixtures/crm360/legacy-entity.js` — crm_entities snapshot for legacy adapter regression
- [ ] `package.json` — confirm `test` script invokes `node --test`; NO `vitest` and NO `@playwright/test` keys per D-39
- [ ] CDP fixtures from P221 (`test/fixtures/cdp/*`) reused for canonical_identity_id overlay

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 6 new tables) | 100% of tables | SOC2 baseline; cross-tenant denial per table |
| Business logic decision branches | 100% | Lifecycle routing, owner derivation, NBA status, committee role history all compliance-critical |
| API contract fields (F-113..F-121) | 100% of fields | OpenAPI parity per QA-01 |
| Legacy regression (P100-P105 tests) | 100% green | CRM360 is additive; any failure = regression |
| Negative-path | ≥2 per object type | Fail-closed must be actively proven |
| `primary_owner_user_id` derivation | 100% — all 11 lifecycle_stage × NULL fallback | Pure function; full branch coverage |
| `{{MARKOS_PRICING_ENGINE_PENDING}}` enforcement | 100% — pricing_context_id mutations require approval_ref | P211 D-23 / CLAUDE.md placeholder rule |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Manual journey (Playwright DEFERRED per D-39) | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 222-01 | Customer360/Opportunity CRUD, legacy adapter hydrate | Tombstone cascade from CDP | F-113, F-114 | workspace.ts + execution.ts + copilot.ts green | Cross-tenant, pricing without approval | n/a | n/a |
| 222-02 | Lifecycle stage routing, primary_owner derivation | cdp_events emit (source_event_ref thread) | F-115 | timeline.ts backward compat | Concurrent transition race, owner handoff audit | n/a | n/a |
| 222-03 | buildCrmTimeline extension, activity_family → source_domain backfill | source_domain + commercial_signal filter query | F-119 | HIGH_SIGNAL filter preserved | NULL commercial_signal | Timeline filter UX | TimelineDetailView (empty/filtered/full) |
| 222-04 | NBA CRUD + supersedence + expiry jitter | Recompute on lifecycle event | F-116 | P103 D-04 urgency bias preserved | Approve-required execute blocked | NBAExplainPanel | NBAExplainPanel (active/dismissed/expired) |
| 222-05 | Committee coverage math, role history windowing | MCP tool payloads + API routes | F-117, F-118, F-120, F-121 | execution-queue reads nba_records | Cross-tenant, concurrent role close+insert | BuyingCommitteePanel + committee gap | BuyingCommitteePanel (full/gap/empty) |
| 222-06 | Drift cron idempotency, full RLS matrix | Reconciliation audit log | All 9 F-IDs registered | Full P100-P105 green | Missing tenant fail-closed | Full operator journey | LifecycleTransitionTimeline |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `customer360.ts` | person + account variants per mode (b2b/b2c/plg_b2b); tombstoned; all 11 lifecycle_stage values | 222-01..06 |
| `opportunity.ts` | healthy/watch/at_risk/stalled; pricing_context_id null + populated; source_motion per enum | 222-01..04 |
| `lifecycle.ts` | 11 from→to transition rows; handoff reason variant | 222-02 |
| `nba.ts` | active/dismissed/expired/superseded; approval_ref null + populated | 222-04 |
| `committee.ts` | 100% coverage + 40% coverage variants; opportunity-level + account-level | 222-05 |
| `committee-member.ts` | active (valid_to NULL) + historical (valid_to set) | 222-05 |
| `legacy-entity.ts` | crm_entities row matching Customer360 shape for adapter regression | 222-01, 222-06 |
| P221 `test/fixtures/cdp/*` reuse | CDP overlay for canonical_identity_id + ConsentState + TraitSnapshot | all slices |

Location: `test/fixtures/crm360/`. Importable from all CRM360 test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Customer360 criteria: "Verified by `customer360.test.js` CRUD + RLS + tombstone cases."
- Opportunity criteria: "Verified by `opportunity.test.js` approval-gate + pricing-guard cases."
- Lifecycle criteria: "Verified by `lifecycle.test.js` — all 11 transitions + handoff audit."
- NBA criteria: "Verified by `nba.test.js` supersedence + expiry jitter + approval-block cases."
- Committee criteria: "Verified by `committee.test.js` coverage math + `committee-member.test.js` role history."
- Ownership criteria: "Verified by `multi-role-ownership.test.js` + `lifecycle.test.js` primary_owner derivation 100% coverage."
- Timeline criteria: "Verified by `timeline-extensions.test.js` source_domain + commercial_signal filter."
- RLS criteria: "Verified by `rls-suite.test.js` cross-tenant denial on all 6 new tables."
- Legacy regression: "Verified by `npm test` — all P100-P105 suites green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator commercial handoff UX | CRM-03 | Human judgment on ownership transition clarity | (1) Stage-change fixture → SQL, (2) verify primary_owner shifts marketing→deal, (3) confirm handoff event visible + audit log populated |
| Buying committee gap → outreach draft | CRM-04 | Requires approval UX review | (1) Open opportunity with 40% coverage, (2) click "Invite role" for missing economic_buyer, (3) verify task created + draft outreach + approval gate |
| NBA execution with approval | CRM-04, CRM-05 | Requires approval inbox UX | (1) NBA with approval_ref required, (2) click execute → routes to P208 approval inbox, (3) approve → NBA status=executed + audit row |
| Migration drift operator task | CRM-01, QA-02 | Requires drift fixture + cron trigger | (1) Force drift in `customer_360_records` vs `crm_entities`, (2) run reconciliation cron, (3) verify operator task + audit log |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 90s quick / 8 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
