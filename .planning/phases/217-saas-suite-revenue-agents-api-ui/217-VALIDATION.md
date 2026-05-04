---
phase: 217
slug: saas-suite-revenue-agents-api-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
updated: 2026-05-04
ui_spec_fold_complete: true
total_acs_folded: 121
---

# Phase 217 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Updated 2026-05-04 with UI-SPEC AC fold (121 ACs across 8 plans) + heavy-UI plan split (06 backend gating + 07 layout/Overview/components + 08 8 sub-pages).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P218 / P219 / P220 / P226 D-82 architecture-lock); JSDOM for component render tests; axe-core for a11y |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/saas-217/preflight/` |
| **Full suite command** | `npm test -- test/saas-217/ test/api-contracts/saas-217-* test/ui-a11y/217-saas-a11y.test.js` |
| **Estimated runtime** | ~60-120s (includes JSDOM render + axe) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/saas-217/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/saas-217/`
- **Before `/gsd:verify-work`:** Full suite must be green (including a11y)
- **Max feedback latency:** ~120s (a11y suite is the long pole)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 217-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/saas-217/preflight/` | ❌ W0 | ⬜ pending |
| 217-01-01 | 01 | 1 | SAS-09 | schema+trigger | `npm test -- test/saas-217/domain-1/` | ❌ W0 | ⬜ pending |
| 217-02-01 | 02 | 2 | SAS-09 | schema+trigger | `npm test -- test/saas-217/domain-2/` | ❌ W0 | ⬜ pending |
| 217-03-01 | 03 | 3 | SAS-10 | schema+trigger | `npm test -- test/saas-217/domain-3/` | ❌ W0 | ⬜ pending |
| 217-04-01 | 04 | 3 | API-01 | api-contract | `npm test -- test/saas-217/domain-4/ test/api-contracts/saas-217-*` | ❌ W0 | ⬜ pending |
| 217-05-01 | 05 | 3 | MCP-01 | mcp-tool | `npm test -- test/saas-217/domain-5/` | ❌ W0 | ⬜ pending |
| 217-06-01 | 06 | 4 | SAS-10, B-10..B-12 | nav-gating | `npm test -- test/saas-217/domain-6/` | ❌ W0 | ⬜ pending |
| 217-06-02 | 06 | 4 | translation-gate + closeout | regression | `npm test -- test/saas-217/domain-6/closeout/` | ❌ W0 | ⬜ pending |
| 217-07-01 | 07 | 5 | SAS-10, 7-component-fold | extracted-components | `npm test -- test/saas-217/domain-7/extracted-components.test.js` | ❌ W0 | ⬜ pending |
| 217-07-02 | 07 | 5 | SAS-10, L-1..L-10 | layout-gate | `npm test -- test/saas-217/domain-7/layout-activation-gate.test.js` | ❌ W0 | ⬜ pending |
| 217-07-03 | 07 | 5 | SAS-10, O-1..O-10 | overview | `npm test -- test/saas-217/domain-7/overview-kpi-grid.test.js` | ❌ W0 | ⬜ pending |
| 217-07-04 | 07 | 5 | SAS-10, X-9 storybook | stories | `npm test -- test/saas-217/domain-7/storybook-stories.test.js` | ❌ W0 | ⬜ pending |
| 217-08-01 | 08 | 6 | SAS-10, S/P/R/W (33 ACs) | 4-read-mostly-pages | `npm test -- test/saas-217/domain-8/{subscriptions,plans,revenue,waterfall}-page.test.js` | ❌ W0 | ⬜ pending |
| 217-08-02 | 08 | 6 | SAS-10, C/I/SP/G (46 ACs) | 4-high-binding-pages | `npm test -- test/saas-217/domain-8/{churn,invoices,support,agents}-page.test.js` | ❌ W0 | ⬜ pending |
| 217-08-03 | 08 | 6 | X-1..X-10, QA-09..15 | cross-cutting + a11y | `npm test -- test/saas-217/domain-8/cross-cutting.test.js test/ui-a11y/217-saas-a11y.test.js` | ❌ W0 | ⬜ pending |
| 217-08-04 | 08 | 6 | 5 manual sanity | checkpoint:human-verify | (manual; see Manual-Only Verifications below) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## UI-SPEC AC Coverage Map (121 ACs)

Source: `217-UI-SPEC.md` §Total Acceptance Criteria (line 1141 — 121 ACs total). Every AC mapped to a plan + task below.

### Surface ACs (99 total)

| AC ID range | Surface | Plan | Task |
|-------------|---------|------|------|
| **L-1..L-10** (10) | Surface A — `app/saas/layout.tsx` (Activation Gate + Sidebar) | 07 | Task 2 |
| **O-1..O-10** (10) | Surface B — `app/saas/page.tsx` (SaaS Overview) | 07 | Task 3 |
| **S-1..S-8** (8) | Surface C — `app/saas/subscriptions/page.tsx` | 08 | Task 1 |
| **P-1..P-6** (6) | Surface D — `app/saas/plans/page.tsx` | 08 | Task 1 |
| **R-1..R-9** (9) | Surface E — `app/saas/revenue/page.tsx` | 08 | Task 1 |
| **W-1..W-10** (10) | Surface F — `app/saas/revenue/waterfall/page.tsx` | 08 | Task 1 |
| **C-1..C-11** (11) | Surface G — `app/saas/churn/page.tsx` | 08 | Task 2 |
| **I-1..I-11** (11) | Surface H — `app/saas/invoices/page.tsx` | 08 | Task 2 |
| **SP-1..SP-15** (15) | Surface I — `app/saas/support/page.tsx` (mobile critical) | 08 | Task 2 |
| **G-1..G-9** (9) | Surface J — `app/saas/agents/page.tsx` | 08 | Task 2 |

### Cross-Cutting ACs (10 total)

| AC ID | Description | Plan | Task |
|-------|-------------|------|------|
| **X-1** | Zero hex literals in any `app/saas/**` (D-08) | 08 | Task 3 |
| **X-2** | Zero hard-coded font-size/weight/color (D-08) | 08 | Task 3 |
| **X-3** | Zero hard-coded $/peso literals; all monetary via Money XOR sentinel | 08 | Task 3 |
| **X-4** | Zero hard-coded tier name strings | 08 | Task 3 |
| **X-5** | Zero `.c-card--feature` use (D-13) | 08 | Task 3 |
| **X-6** | Zero `.c-table` use; vanilla `<table>` only (D-14) | 08 | Task 3 |
| **X-7** | Banned-lexicon zero-match across `app/saas/**` | 08 | Task 3 |
| **X-8** | All 9 surfaces register `mobile_priority` in SurfaceRouteContract; 8 secondary + 1 critical (`/saas/support`); `desktop_only` FORBIDDEN | 06 (registration) + 08 (verification) | Task 3 |
| **X-9** | All 9 surfaces register CSF3 named-state Storybook stories ≥3 each | 07 + 08 | Various |
| **X-10** | Accessibility tests under `test/ui-a11y/217-saas-a11y.test.js` mirroring 213.2/213.4 | 08 | Task 3 |

### Backend Doctrine ACs (12 total)

| AC ID | Description | Plan | Task |
|-------|-------------|------|------|
| **B-1** | 15 revenue metric definitions render verbatim on `/saas/revenue`; metric_key ENUM 15 literals match | 01 (substrate) + 08 Task 1 (UI) | — |
| **B-2** | 5-tier source precedence (Billing > Processor > Accounting > CRM > Manual) renders verbatim | 01 (substrate) + 08 Task 1 (UI) | — |
| **B-3** | 5 reconciliation_state literals render with bracketed glyph | 02 (substrate) + 08 Task 1 (UI) | — |
| **B-4** | MRR snapshot freshness chip in sidebar reads `last_run_completed_at`; kernel-pulse on fresh; warning on stale (>36h) | 02 (cron) + 07 Task 2 (UI sidebar) | — |
| **B-5** | 6-column MRR waterfall consumes `saas_mrr_waterfall_entries` table verbatim | 02 (substrate) + 08 Task 1 (UI) | — |
| **B-6** | Cohort retention heatmap consumes `saas_mrr_snapshots.cohort_retention` derived field | 02 (substrate) + 08 Task 1 (UI) | — |
| **B-7** | 6 SAS agents from `sas_agent_readiness` render with all 7 readiness flags verbatim | 03 (substrate) + 08 Task 2 (UI Agents page) | — |
| **B-8** | 12 `/v1/saas/*` endpoints consumed across 10 surfaces; OpenAPI schema citations | 04 (handlers) + 07/08 (UI consumers) | — |
| **B-9** | 10 MCP tools referenced via tooltips on relevant rows | 05 (tools) + 08 (UI tooltips) | — |
| **B-10** | Translation gate seed: 12 SG planned-only nav rows in `saas_nav_visibility` | 06 | Task 1 |
| **B-11** | DB-trigger `SAAS_NAV_REQUIRES_ACTIVATION` validates UI gate at DB layer | 06 | Task 1 |
| **B-12** | `isSaaSSurfaceEnabled` 3-condition gate enforced server-side in `app/saas/layout.tsx` | 06 (substrate) + 07 Task 2 (UI layout) | — |

### Total

99 surface + 10 cross-cutting + 12 backend = **121 ACs** ✓ matches UI-SPEC §Total Acceptance Criteria.

---

## 7 NEW Extracted Components Inheritance Map for P218+

D-15 selective extraction — 7 components first consumed in production at Phase 217. Forward-bind to P218+ inheritance:

| Component | First consumed | Forward consumers |
|-----------|----------------|-------------------|
| `<HealthScoreBadge />` | 217-07 Plan 07 (Overview) + 217-08 Plan 08 (Subscriptions, Churn) | P218 PLG dashboards (`saas_plg`); P219 expansion (`saas_expansion`); P220 referral console |
| `<RiskBandBadge />` | 217-07 Plan 07 (Overview risk distribution) + 217-08 Plan 08 (Subscriptions, Churn) | P218 PLG at-risk sweep; P219 expansion at-risk filter |
| `<ClassifierChipRow />` | 217-08 Plan 08 (Support page) | P218 support classifier extension; P219 ABM intent classifier |
| `<KbGroundingPanel />` | 217-08 Plan 08 (Support response review modal) | P218 in-app marketing copy grounding; P219 ABM proof grounding |
| `<SaveOfferPricingBlock />` | 217-08 Plan 08 (Churn save offer) | P219 expansion offer pricing; P220 referral offer pricing |
| `<RetentionClassChip />` | 217-08 Plan 08 (Invoices + Support PII) + 217-07 Plan 07 (component story) | P218 PII audit log admin (deferred from 216); P219 ABM PII handling |
| `<PIIRedactedField />` | 217-08 Plan 08 (Invoices + Support) | P218 audit log; P219 ABM contact PII; P220 referral PII |

Storybook story registry for P218+ inheritance:
- All 7 components register CSF3 named-state stories under `Saas/Components/<ComponentName>` namespace
- ≥3 named states per component (per 213.2 carry-forward)
- Chromatic baselines captured at 217 closeout (Plan 08 Task 4 checkpoint)

---

## 213.4 Carry D-08..D-15 + D-21 Enforcement Table

| Decision | Phase 217 enforcement | Closeout test |
|----------|----------------------|---------------|
| **D-08 token-only** | Zero inline hex literals in any `app/saas/**/*.{tsx,module.css}`; all colors via `var(--color-*)`; all spacing via `var(--space-*)`; all typography via DESIGN.md `typography.*` | `test/saas-217/domain-8/cross-cutting.test.js X-1+X-2`; `test/saas-217/domain-6/closeout/architecture-lock-rerun.test.js` |
| **D-09 mint-as-text** | `[ok]`/`[up]` glyph color, action-link inline CTAs, `.c-chip-protocol` IDs use `--color-primary-text`; mint never used as fill on KPI cards / plan-row hero / MRR waterfall surface; single mint fill exception is `net_new_mrr` waterfall column | manual sanity (Plan 08 Task 4 checkpoint); Storybook visual regression |
| **D-09b `.c-notice` mandatory** | Every gating state composes `<div class="c-notice c-notice--{state}">`; zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/` | `test/saas-217/domain-6/closeout/architecture-lock-rerun.test.js` |
| **D-13 `.c-card--feature` reserved** | FORBIDDEN in this phase; all cards use `.c-card` default | `test/saas-217/domain-8/cross-cutting.test.js X-5` |
| **D-14 vanilla `<table>`** | All 9 surfaces use vanilla `<table>` semantic + token-only recipe + `.c-badge--{state}`; `.c-table` primitive remains deferred | `test/saas-217/domain-8/cross-cutting.test.js X-6` |
| **D-15 selective extraction** | 7 NEW components first consumed in production: HealthScoreBadge / RiskBandBadge / ClassifierChipRow / KbGroundingPanel / SaveOfferPricingBlock / RetentionClassChip / PIIRedactedField; 214 SaaSActivationPanel + SaaSSubscriptionsTable reused | `test/saas-217/domain-7/extracted-components.test.js` (Plan 07) |
| **D-21 server/client boundary** | Each `app/saas/*/page.tsx` is a server component; interactive subcomponents extract to `_components/*.tsx` with `'use client'`; boundary named in each page's file header comment | `test/saas-217/domain-6/closeout/architecture-lock-rerun.test.js` (grep `'use client'` only in `_components/`) |

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/217-check-upstream.cjs` — assertUpstreamReady CLI for HARD upstreams (P202 MCP + P208 approvals + P214 SaaSSuiteActivation + P215 billing + P216 product usage/health) + SOFT (P205, P207, P209-P213)
- [ ] `lib/markos/saas/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/saas/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/saas/preflight/errors.ts` — UpstreamPhaseNotLandedError
- [ ] `test/saas-217/preflight/architecture-lock.test.js`
- [ ] `test/saas-217/preflight/upstream-gate.test.js`
- [ ] `test/saas-217/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist; createApprovalPackage / requireSupabaseAuth / lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/saas-217/*.js` (NOT `.ts` per architecture-lock)
- [ ] CREATE `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (P217 is FIRST upstream phase to ship the doc — P218 will append once P217 executes; P217 row claims slots 98-99 + F-247..F-258)
  - Document collision history: foundation 82-89 + slot 96 + crm slot 100 ON DISK; P220 90-95+97 reserved; P218 101-106 reserved; P219 107-111 reserved (Q-7 fix from P218 review)
  - Forward-allocation: P217 = 98, 99 (only 2 free slots upstream; multi-table per slot consolidation)

---

## Manual-Only Verifications

Five manual sanity verifications are CONSOLIDATED into a single checkpoint:human-verify task in **Plan 08 Task 4** (per UI-SPEC heavy-UI fold directive). Operator runs all 5 checks during one inspection session.

| # | Behavior | Requirement | Why Manual | Test Instructions |
|---|----------|-------------|------------|-------------------|
| 1 | Mobile breakpoint at iPhone 14 Pro for `/saas/support` critical priority | SAS-10, X-8 | CS reps need mobile field use; tap-target sanity beyond automated tests | DevTools mobile emulation (iPhone 14 Pro 393×852); confirm bottom-sheet modal pattern, 44px touch targets, ClassifierFilters chip wrapping, vertical card stack |
| 2 | Chromatic baselines for 10 surface stories + 7 component stories | X-9 | Visual regression beyond unit tests; reviewer eye for layout/spacing/contrast | `npm run chromatic`; review baselines for Saas/Layout (5 states), Saas/Overview (5 states), 7 component stories (≥3 each), 8 sub-page stories |
| 3 | axe a11y across 9 surfaces + manual focus order | X-10 | Keyboard tab navigation + screen reader experience beyond automated axe-core | Run `npm test -- test/ui-a11y/217-saas-a11y.test.js`; manually tab through each surface; verify focus order matches UI-SPEC §Accessibility focus order |
| 4 | Activation gate sanity (4 named reasons rendered correctly) | SAS-10, B-12 | 3-condition gate must render verbatim copy on each named-reason path; integration sanity beyond unit tests | Test 5 tenants — non-saas business_type / draft activation / closed T0 gate / disabled SaaS / all 3 conditions pass; verify each renders correct notice + banned reasons (`unauthorized`/`loading`/`error`/`unknown`) never appear |
| 5 | Sensitive Credential UI Binding Layer 6 manual sanity | SAS-10, B-3, B-4, B-5 | Clipboard block + audit emission beyond automated tests; PII redaction visual confirmation | Open `/saas/invoices` for tenant with PII invoice; confirm `[REDACTED]` for 5 PII field constants; try Cmd+C on PII (clipboard.writeText not invoked); try Cmd+C on vault_ref chip (allowed); confirm `saas_billing_events` row inserted with `event_type='credential_view'` per fetch |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `217-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (Revenue metric defs + source precedence):** unit (RLS, schema, formula validators, source_precedence array), integration (DB-trigger `REVENUE_METRIC_REQUIRES_PROVENANCE` requires formula+source+timestamp+reconciliation_state non-null), regression (no migration-slot 96/100 collision)
- **Domain 2 (MRR snapshots + waterfall):** unit (RLS, schema, MRR/NRR/expansion math, snapshot-builder), integration (DB-trigger `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE`; cron nightly snapshot reads P215 billing), regression (P215 backwards-compat — schema unchanged)
- **Domain 3 (SAS agent readiness registry):** unit (8-flag readiness GENERATED column), integration (DB-trigger `SAS_AGENT_ACTIVATION_REQUIRES_READINESS`; SAS-01..06 seeded `runnable=false`), regression (no naming collision with P218/P219/P220 growth-agent tables)
- **Domain 4 (`/v1/saas/*` API contracts):** unit (handler shape, RLS, auth via requireHostedSupabaseAuth), contract (OpenAPI F-247..F-254 paths exist + reference schemas), regression (no api/v1/.../route.ts; legacy api/*.js)
- **Domain 5 (`markos-saas` MCP tool family):** unit (tool registration, tenant-session-bound, mutating: false), integration (lib/markos/mcp/tools/saas.cjs registered in index.cjs), regression (no .ts MCP files)
- **Domain 6 (UI nav + activation gate trigger + translation gate + closeout):** unit (saas_nav_visibility schema), integration (DB-trigger `SAAS_NAV_REQUIRES_ACTIVATION`; reads `saas_suite_activations.active` from P214), regression (translation-gate test asserts SG-01..12 nav rows planned_only=true; slot-collision regression asserts P217 didn't touch P218-P220 slots; all-domains architecture-lock RE-RUN; requirements-coverage assertion)
- **Domain 7 (UI layout + Overview + 7 NEW extracted components):** unit (component rendering with JSDOM), integration (Storybook CSF3 stories register), regression (architecture-lock-rerun scans `app/saas/layout.tsx`, `app/saas/page.tsx`, `app/saas/_components/*` for D-08..D-21 violations)
- **Domain 8 (UI 8 sub-pages + cross-cutting + a11y):** unit (per-page rendering), integration (cross-page consistency for shared extracted components), regression (cross-cutting X-1..X-10; axe a11y zero critical+serious; banned-lexicon zero-match across `app/saas/**`)

**Architecture-lock regression:** `test/saas-217/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 217-*-PLAN.md bodies + lib/markos/saas/* + lib/markos/{revenue,mrr,sas-agents,api,mcp-saas,nav}/* + api/v1/saas/* + api/cron/saas-* + `app/saas/**` for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(saas), api/v1/.../route.ts, vitest, playwright, .test.ts, .ts MCP files, `.c-card--feature` in `app/saas/**`, `.c-table` in `app/saas/**`, hex literals in `app/saas/**`). Fails wave if any positive invocation found.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All P217-owned IDs (SAS-09, SAS-10, MCP-01, API-01, QA-01..15) mapped to plans during planning iteration; LOOP-01..08 = `integrates_with: P211` (NOT requirements); SG-01..12 in Plan 06 = `translation_gate_for: [P218, P219, P220]` (NOT requirements). UI-SPEC fold (2026-05-04) extends coverage to 121 ACs across 8 plans. |
| 2. Anti-shallow execution | LOCKED | Every task has `<read_first>` (existing file + UI-SPEC §section + DESIGN.md token table for UI plans + 7 parent UI-SPECs 206/207/208/213/214/215/216 + existing pattern files) + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per UI-SPEC fold |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady; Plan 06 Task 2 closeout architecture-lock-rerun scans across full P217 surface including `app/saas/**` + 7 extracted components |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (REVENUE_METRIC_REQUIRES_PROVENANCE, MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE, SAS_AGENT_ACTIVATION_REQUIRES_READINESS, SAAS_NAV_REQUIRES_ACTIVATION) + arch-lock tests for API/MCP (file-artifact domains) + UI Layer 6 sensitive credential binding (Plan 08 Task 2 invoices/support) + UI activation gate (Plan 07 Task 2 layout) |
| 5. Cross-phase coordination | DRAFT | Q-1..Q-8 resolved in research; P217 → P218+P219+P220 contract documented (`saas_mrr_snapshots`, `saas_suite_activations` consumption); P217 first phase to CREATE V4.1.0-MIGRATION-SLOT-COORDINATION.md; 7 NEW extracted components forward-bind for P218+ inheritance per Inheritance Map above |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (4 DB-triggers + 2 architecture-lock tests for file-artifact domains) + 5th DB-trigger CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL (216 substrate; mirrored in Plan 08 churn UI) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; JSDOM for component render; axe-core for a11y; NO vitest/playwright |
| 8. Validation strategy (this doc) | LOCKED | UI-SPEC AC Coverage Map (121 ACs) + 7 NEW Extracted Components Inheritance Map + 213.4 Carry Enforcement Table all populated post-fold |

---

*Phase: 217-saas-suite-revenue-agents-api-ui*
*Validation strategy created: 2026-04-26*
*UI-SPEC fold update: 2026-05-04 (121 ACs + heavy-UI plan split 06/07/08)*
*Source: 217-RESEARCH.md + 217-REVIEWS.md + 217-UI-SPEC.md*
