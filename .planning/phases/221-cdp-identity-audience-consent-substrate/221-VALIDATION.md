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

---

## UI-SPEC AC Coverage Map (no-UI-scope variant — 221 substrate phase)

> Per orchestrator UI-SPEC fold directive 2026-05-04 (light fold; START-OF-v4.2.0 Commercial Engines lane opening phase).
> Maps backend doctrine assertions, future-surface UI binding contracts, translation gate dissolutions, and downstream UI inheritance citations to per-plan grep gates.

### Backend Doctrine Assertions (per-plan grep gates)

| Doctrine | Assertion | Plan(s) | Grep Gate (verbatim) |
|----------|-----------|---------|----------------------|
| D-32 architecture-lock | FORBIDDEN: App Router/vitest/playwright/.test.ts/createApprovalPackage/requireSupabaseAuth/lookupPlugin/route.ts/public/openapi.json/app/(public)/app/(markos)/api/v1/.../route.ts/app/api/cron/.../route.ts/`stub if missing`/`if exists` | 221-01 (Wave 0 detector) + carries forward to 221-02..221-06 | `grep -nE "createApprovalPackage\|requireSupabaseAuth\|requireTenantContext\|serviceRoleClient\|lookupPlugin\|public/openapi.json\|app/\(public\)\|app/\(markos\)\|vitest run\|from 'vitest'\|stub if missing\|if exists" lib/markos/cdp/ api/v1/cdp/` returns 0 actionable matches (allowlisted self-reference inside `architecture-lock.ts` FORBIDDEN_PATTERNS literal); regression covered by `test/cdp-preflight/architecture-lock.test.js` |
| RL1 DSL operator whitelist | 16 verbatim allowed operators: `{ if, ==, !=, <, <=, >, >=, in, and, or, not, +, -, *, /, var, missing, missing_some }` | 221-04 | `grep -c "if\\|==\\|!=\\|<\\|<=\\|>\\|>=\\|in\\|and\\|or\\|not\\|+\\|-\\|*\\|/\\|var\\|missing\\|missing_some" lib/markos/cdp/audiences/dsl-whitelist.ts` returns ≥16 unique operator literal occurrences inside `ALLOWED_OPERATORS` set; `grep -n "CDP_DSL_OPERATOR_REJECTED\\|cdp_audience_dsl_rejected" lib/markos/cdp/audiences/dsl-whitelist.ts` returns ≥2 lines |
| RL2 json-logic-js@2.0.5 EXACT pin | EXACT pin (no caret `^`, no tilde `~`) — Wave 0 install in Plan 01 | 221-01 (install) + 221-04 (consumer) | `node -e "const v=require('./package.json').dependencies['json-logic-js']; if(v!=='2.0.5'){process.exit(1)}"` exits 0 |
| RM1 HOURLY drift cron | Schedule `0 * * * *` verbatim (NOT daily `0 0 * * *`) | 221-02 | `grep -n "0 \\* \\* \\* \\*" vercel.json` returns ≥1 line for path `/api/cron/cdp-consent-drift-audit` |
| RM2 single-writer DB-trigger | `app.consent_writer_source` GUC + `cdp_setConsentState` canonical writer + `CDP_CONSENT_WRITER_VIOLATION` error code | 221-02 | `grep -n "app.consent_writer_source\\|cdp_setConsentState\\|CDP_CONSENT_WRITER_VIOLATION" supabase/migrations/106_cdp_consent_single_writer_trigger.sql` returns ≥3 lines |
| RM4 F-ID + migration slot pre-allocation | F-106..F-112 + 101 + 102a + 102b + 103 + 104 + 105 + 106 non-overlapping | 221-01 (allocation table) + 221-06 (collision regression) | `grep -nE "F-10[6-9]\\|F-11[0-2]" contracts/flow-registry.json` returns ≥7 lines + `ls supabase/migrations/{101,102a,102b,103,104,105,106}_cdp_*.sql` exists |
| 27th handoff_kind | `consent_drift_resolution` literal verbatim (single_approval; informational + remediation) | 221-02 | `grep -n "consent_drift_resolution" lib/markos/cdp/consent/drift-audit.ts` returns ≥1 line |
| 28th handoff_kind | `audience_activation_approval` literal verbatim (single_approval; mutation-class `external.send`) | 221-04 | `grep -n "audience_activation_approval" lib/markos/cdp/audiences/activation.ts` returns ≥1 line |
| 29th handoff_kind | `dsr_export_approval` literal verbatim (dual_approval per SOC2 P206 Type I; mutation-class `data.export`) | 221-06 | `grep -n "dsr_export_approval" lib/markos/cdp/deletion/dsr-export.ts` returns ≥1 line + `grep -nE "dual_approval\\|default_approval_mode" lib/markos/cdp/deletion/dsr-export.ts` returns ≥1 line |
| 3 banned-lexicon validators (3 NEW mutation classes) | (1) Consent override copy emit (Plan 02); (2) Audience activation copy (Plan 04); (3) DSR export envelope text rendering (Plan 06) — zero-match required pre-dispatch on every `external.send` and `data.export` mutation | 221-02 / 221-04 / 221-06 (substrate) + future P223+ frontend phases (validator placement) | per-plan substrate field tagging covered by individual per-task grep gates in Plan 02 + Plan 04 + Plan 06 acceptance_criteria_additions blocks |
| PII inheritance from 215 Layer 6 + 216 5-classification ENUM | 5-value taxonomy `no_pii`/`pseudonymous`/`personal`/`sensitive`/`highly_sensitive`; `<PIIRedactedField />` clipboard `onCopy preventDefault()`; audit-log `event_type == 'identity_view'` (NEW) + `consent_view` (NEW) | 221-01 (cdp_identity_profiles PII fields) + 221-02 (cdp_consent_states.preference_tags + quiet_hours + jurisdiction + source) + 221-03 (cdp_trait_snapshots.value when PII-bearing) + 221-06 (DSR envelope highly_sensitive composite) | per-plan substrate field tagging (column comments OR companion classification table per 221-RESEARCH.md §Schema Sketches) |
| START-OF-v4.2.0 chip count assertion | Final P208 chip count = 29 (26 post-220 end-of-v4.1.0 + 3 NEW from 221) | 221-06 closeout | chip-count growth: 26 (post-220) → 27 (Plan 02) → 28 (Plan 04) → 29 (Plan 06); regression covered by future P208 admin extension phase |

### 5 Future-Surface UI Binding Contracts Table

| UI Binding | Surface | Substrate Plan(s) | Future Surface (DEFERRED) | Translation Gate |
|------------|---------|-------------------|---------------------------|------------------|
| §UI Binding 1 — Unified Profile | `<UnifiedProfileViewer />` + identity merge timeline + consent state inline indicator + trait snapshot timeline + tombstone status indicator | 221-01 (identity profiles + links + canonical_identity_id FK) + 221-03 (cdp_events partition selector + cdp_trait_snapshots timeline rows) | `app/saas/cdp/profiles/[profile_id]/page.tsx` + `app/saas/cdp/profiles/[profile_id]/events/page.tsx` + `app/saas/cdp/profiles/[profile_id]/traits/page.tsx` (future) | future_phase_221_admin_ui |
| §UI Binding 2 — Consent State | `<ConsentStateBrowser />` + 5-state ENUM badge mapping + drift indicator + single-writer enforcement visibility + trigger rejection log + audit-log every consent view + drift resolution modal + provenance display + retention indicator (post-DSR) | 221-02 (cdp_consent_states + RM2 single-writer DB-trigger + RM1 hourly drift audit + 27th chip) | `app/saas/cdp/profiles/[profile_id]/consent/page.tsx` + `app/saas/cdp/consent-drifts/page.tsx` (future) | future_phase_221_admin_ui + future_phase_221_approval_inbox_extensions |
| §UI Binding 3 — Audience Definition | `<AudienceDefinitionEditor />` + JSON Logic DSL editor with live preview + DSL operator whitelist validator (inline rejection) + DSL operator whitelist viewer + audience snapshot browser + audience membership preview + double-gate consent re-validation preview + audience activation approval modal | 221-04 (cdp_audience_definitions + cdp_audience_snapshots + cdp_audience_snapshot_memberships + RL1 DSL whitelist + 28th chip) | `app/saas/cdp/audiences/[audience_id]/edit/page.tsx` + `app/saas/cdp/audiences/dsl-whitelist/page.tsx` + `app/saas/cdp/audiences/[audience_id]/snapshots/[snapshot_id]/page.tsx` + `app/saas/cdp/audience-activations/page.tsx` (future) | future_phase_221_audience_editor + future_phase_221_approval_inbox_extensions |
| §UI Binding 4 — DSR + Audit | `<DsrRequestQueue />` + tombstone status indicator + cascade purge timeline + mutation-class data.export indicator with dual_approval + DSR export approval modal + 8-table RLS denial visible audit + Pitfall 5 late-event-after-tombstone indicator + dual-write reconciliation timeline + Plan 06 checkpoint:human-action indicator | 221-06 (DSR tombstone + cascade purge + DSR export contract + 8-table RLS suite + Pitfall 1 daily reconciliation + 29th chip + RL3 checkpoint:human-action) + 221-05 (read endpoints powering DSR queue) | `app/saas/cdp/dsr/page.tsx` + `app/saas/cdp/dsr-exports/page.tsx` + `app/saas/cdp/reconciliation/page.tsx` + `app/saas/cdp/rls-audit/page.tsx` (future) | future_phase_221_dsr_console + future_phase_221_approval_inbox_extensions |
| §UI Binding 5 — Identity Merge | Hard/soft merge decision badge + identity score breakdown chip-row + hard-match signal chip-row + identity link browser + identity merge approval modal + anonymous-to-known stitching display + tenant fail-closed indicator | 221-01 (hard/soft merge decision logic + scoreIdentityCandidate carry-forward + buildApprovalPackage extension per D-33; existing P100 merge-review chip — NOT a new chip) | `app/saas/cdp/identity-merges/page.tsx` (future) | future_phase_221_admin_ui (existing merge-review chip extension) |

### Translation Gates Opened (future-phase placeholders)

| Translation Gate | Substrate Plan(s) | Future Phase |
|------------------|-------------------|--------------|
| `future_phase_221_admin_ui` | 221-01 + 221-02 + 221-03 + 221-04 + 221-05 + 221-06 | future P221+ admin/tenant frontend phase |
| `future_phase_221_approval_inbox_extensions` | 221-02 (27th chip) + 221-04 (28th chip) + 221-06 (29th chip) | future P208 admin extension phase |
| `future_phase_221_dsr_console` | 221-06 | future P221+ tenant DSR console phase |
| `future_phase_221_audience_editor` | 221-04 | future P221+ tenant audience editor phase |
| `future_phase_222_attribution_substrate` | 221-03 (cdp_events + cdp_trait_snapshots) | future P222 CRM 360 + P225 Analytics consumer |
| `future_phase_223_dispatch_substrate` | 221-02 (cdp_consent_states) + 221-04 (cdp_audience_snapshot_memberships) | future P223 Messaging + P224 Conversion + P225 Analytics + P226 Sales Enablement consumer |

### Translation Gates Dissolved (substrate-feed layer)

1. `220-UI-SPEC §future_phase_222_attribution_substrate` — DISSOLVED at substrate-feed layer by 221-03 (cdp_events 10-domain ENUM + cdp_trait_snapshots freshness modes); UI-layer placeholder removal requires future P222+ commercial-engines tenant frontend phase
2. `220-UI-SPEC §future_phase_223_dispatch_substrate` — DISSOLVED at substrate-feed layer by 221-02 + 221-04 (cdp_consent_states + cdp_audience_snapshot_memberships double-gate); UI-layer placeholder removal requires future P223+ commercial-engines tenant frontend phase
3. `215-UI-SPEC §future_phase_217_pii_audit_log` — DISSOLVED at substrate-feed layer by 221-05 migration 105 audit-log indexes for 8+ CDP event types Plan 06 emits
4. `MarkOS marketing operating loop CDP consumer` — DISSOLVED at substrate-feed layer by full P221 substrate completion (CDP-01..05); MarkOS v2 operating loop consumes CDP via read-through adapter pattern per `obsidian/reference/MarkOS v2 Operating Loop Spec.md`

### Downstream UI Inheritance Citations (≥15 future surfaces)

Plan 05 read endpoints (8 endpoints) + Plan 05 MCP tools (2 `.cjs` tools) are consumed by ALL of the following ≥15 future surfaces:

1. `<UnifiedProfileViewer />` (UI Binding 1)
2. `<IdentityLinkBrowser />` (UI Binding 1 + 5)
3. `<IdentityMergeApprovalQueue />` (UI Binding 5)
4. `<ConsentStateBrowser />` (UI Binding 2)
5. `<ConsentDriftResolutionQueue />` (UI Binding 2)
6. `<CdpEventBrowser />` (UI Binding 1 — partition selector)
7. `<TraitSnapshotViewer />` (UI Binding 1 — recompute trigger)
8. `<AudienceDefinitionEditor />` (UI Binding 3)
9. `<DslOperatorWhitelistViewer />` (UI Binding 3)
10. `<AudienceSnapshotBrowser />` (UI Binding 3)
11. `<AudienceActivationApprovalQueue />` (UI Binding 3)
12. `<DsrRequestQueue />` (UI Binding 4)
13. `<DsrExportApprovalModal />` (UI Binding 4)
14. `<DualWriteReconciliationTimeline />` (UI Binding 4)
15. `<8TableRlsDenialTestViewer />` (UI Binding 4)
16. P208 Approval Inbox at `/operations/approvals` — extends 26-chip set to 29 chips
17. 217-06 `app/saas/agents/page.tsx` — future CDP agent family rendering (deferred per 221-CONTEXT §Deferred Ideas)
18. P209 EvidenceMap consumer — `<EvidenceMapPanel />` + `<EvidenceCitationChip />` reference 221 source_event_ref + evidence_ref

### 213.4 Carry-Forward + 217 D-21 + NEW D-32

- 213.4-VALIDATION.md §Carry-forward: D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary — carries verbatim into all future 221-consuming admin/tenant surfaces
- 217 D-21 server/client boundary doctrine: every future 221 admin/tenant surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client; client components opt in via `'use client'` only for interactive primitives
- D-32 architecture-lock (NEW per 221 review-driven addendum 2026-04-26): legacy `api/*.js` (NOT App Router) + `requireHostedSupabaseAuth` (NOT `requireSupabaseAuth`) + `npm test` Node `--test` (NOT vitest/playwright) + `contracts/openapi.json` (NOT `public/openapi.json`) + `lib/markos/mcp/tools/index.cjs` (NOT `.ts`) + `api/cron/` SINGULAR with `*.js` filenames + `buildApprovalPackage` (NOT `createApprovalPackage`)

### Cross-Cutting Doctrine Binding (10 Parent UI-SPECs)

Phase 221 inherits doctrine verbatim from the following 10 parent UI-SPECs per UI-SPEC §parent_doctrine_chain:

1. `206-UI-SPEC.md` — mutation-class doctrine: `data.export` for DSR + `external.send` for consent override; `default_approval_mode == dual_approval` for `dsr_export_approval` per SOC2 P206 Type I
2. `207-UI-SPEC.md` — RunApiEnvelope; AgentRunEventType for 30+ new event types across 6 substrate layers; ApprovalHandoffRecord
3. `208-UI-SPEC.md` (PARENT) — Approval Inbox extends 3 new handoff_kind literals 27th-29th in canonical chain; START-OF-v4.2.0 chip count = 29
4. `209-UI-SPEC.md` (PARENT) — ConsentState provenance + audit log evidence binding; trait provenance source_event_ref[] mandatory; EVD-01 + EVD-03 + EVD-04 + EVD-05 carry; immutable evidence_refs pattern
5. `213-UI-SPEC.md` — 213-04 public-proof boundary STRICT for DSR exports — PRIVATE forever; banned-lexicon zero-match BEFORE `data.export` / `external.send` dispatch
6. `214-UI-SPEC.md` (PARENT) — SaaS Suite Activation; saas_subscriptions FK; CDP profile read-through adapter pattern
7. `215-UI-SPEC.md` (PARENT) — sensitive credential UI binding Layer 6 EXTENDS to PII data; 215 billing-correction modal recipe REUSED for `dsr_export_approval` + `audience_activation_approval` + `consent_drift_resolution`
8. `216-UI-SPEC.md` (PARENT) — PII+Retention UI binding contract; 5 `pii_classification` badges carry verbatim; `<PIIRedactedField />` clipboard preventDefault + audit-log `identity_view` extends 216 `credential_view` pattern
9. `217-UI-SPEC.md` (PARENT) — `saas_nav_visibility` consumer eventually; **D-32 architecture-lock carries verbatim**; D-21 server/client boundary doctrine
10. `220-UI-SPEC.md` (PARENT) — END-OF-v4.1.0 milestone state; 26 P208 chips at v4.1.0 closeout; 221 opens v4.2.0 commercial-engines lane and EXTENDS to 29 chips with 3 new literals; the 220 6-future-surface UI binding contracts pattern reused as 5 parallel contracts in 221

### START-OF-v4.2.0 State Assertions (29 chips total)

| Phase | Chips Added | Cumulative Chip Count | Milestone Position |
|-------|-------------|------------------------|---------------------|
| Post-219 (legacy 19-chip set per UI-SPEC §parent_doctrine_chain 220 entry) | — | 19 | mid-v4.1.0 |
| Post-220 (end-of-v4.1.0 closeout) | +7 (community_moderation_approval 20th + event_promotion_approval 21st + pr_pitch_approval 22nd + g2_review_pricing_approval 23rd + partnership_activation_approval 24th + affiliate_commission_issuance_approval 25th + partner_payout_export_approval 26th) | 26 | END-OF-v4.1.0 |
| 221-02 (Plan 2 — Consent State substrate) | +1 (consent_drift_resolution 27th) | 27 | START-OF-v4.2.0 (Wave 2) |
| 221-04 (Plan 4 — Audience Definition substrate) | +1 (audience_activation_approval 28th) | 28 | START-OF-v4.2.0 (Wave 3) |
| 221-06 (Plan 6 — DSR + Audit closeout) | +1 (dsr_export_approval 29th) | **29** | **START-OF-v4.2.0 commercial-engines lane (Wave 4)** |

**START-OF-v4.2.0 chip count assertion: 29 chips total post-221.**

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
