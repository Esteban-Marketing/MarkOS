---
phase: 214
slug: saas-suite-activation-subscription-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
updated: 2026-04-29
ui_spec_fold_complete: true
---

# Phase 214 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **2026-04-29 update:** 214-UI-SPEC.md (55 ACs across 33 surface + 12 backend + 10 cross-cutting) folded into the 6 plans. Plan 214-06 split into 214-06 (backend gating + API + MCP, autonomous) and 214-07 (UI render, 4 tasks including 1 human-verify checkpoint).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none — uses the built-in Node runner |
| **Quick run command** | `npm test -- test/saas-214/preflight/` |
| **Full suite command** | `npm test -- test/saas-214/` |
| **A11y suite command** | `npm test -- test/ui-a11y/214-saas-a11y.test.js` |
| **Storybook build** | `npm run build-storybook` |
| **DESIGN.md lint** | `npx @google/design.md lint DESIGN.md` |
| **Estimated runtime (full)** | ~60-120s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/saas-214/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/saas-214/`.
- **After every UI task (214-07-*):** Additionally run `npm run build-storybook` and verify zero errors + correct story counts in `storybook-static/index.json`.
- **Before `/gsd-verify-work`:** Full suite + Storybook build + DESIGN.md lint must be green.
- **Max feedback latency:** ~60s for backend tasks; ~120s for UI tasks (Storybook build).

---

## Per-Task Verification Map

11 task rows after the 214-06 split (added 214-07-01/02/03/04 for UI render).

| Task ID | Plan | Wave | Requirement | UI-SPEC ACs Closed | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|--------------------|-----------|-------------------|-------------|--------|
| 214-01-00 | 01 | 1 | QA-01, QA-02 | architecture-lock 4 doctrine strings + UI-path prefix lock | preflight | `npm test -- test/saas-214/preflight/` | ❌ W0 | ⬜ pending |
| 214-01-01 | 01 | 1 | SAAS-01, SAAS-02 | BD-1, BD-2, BD-3 | schema+trigger | `npm test -- test/saas-214/domain-1/` | ❌ W0 | ⬜ pending |
| 214-02-01 | 02 | 2 | SAAS-02, SAAS-03 | BD-4, BD-5, BD-6 | schema+contract | `npm test -- test/saas-214/domain-2/` | ❌ W0 | ⬜ pending |
| 214-03-01 | 03 | 3 | SAAS-03 | BD-6 (co-own), BD-7 | lifecycle+trigger | `npm test -- test/saas-214/domain-3/` | ❌ W0 | ⬜ pending |
| 214-04-01 | 04 | 3 | SAAS-03 | BD-8 | bridge+rls | `npm test -- test/saas-214/domain-4/ test/saas-214/rls/customer-bridge-cross-tenant-denial.test.js` | ❌ W0 | ⬜ pending |
| 214-05-01 | 05 | 4 | SAAS-03 | BD-9, BD-10, BD-11 | governance+audit | `npm test -- test/saas-214/domain-5/` | ❌ W0 | ⬜ pending |
| 214-06-01 | 06 | 5 | SAAS-01, SAAS-02, SAAS-03 | SG-1, SG-3, BD-12, X-10 (backend half) | api+mcp gating | `npm test -- test/saas-214/domain-6/saas-api-gating.test.js test/saas-214/domain-6/saas-mcp-gating.test.js test/saas-214/domain-6/growth-extension-non-activation.test.js` | ❌ W0 | ⬜ pending |
| 214-07-01 | 07 | 5 | SAAS-01, SAAS-02, SAAS-03 | SS-1..15, SG-2, X-1..10 (page slice) | ui render + gating | `npm test -- test/saas-214/domain-6/saas-ui-gating.test.js && npm run build-storybook` | ❌ W0 | ⬜ pending |
| 214-07-02 | 07 | 5 | SAAS-01 | AP-1..7, X-1..6 (panel slice) | ui storybook | `npm run build-storybook && grep -c "Tenant/SaaSActivationPanel" storybook-static/index.json` | ❌ W0 | ⬜ pending |
| 214-07-03 | 07 | 5 | SAAS-03 | ST-1..8, X-1..6 (table slice) + a11y | ui a11y | `npm test -- test/ui-a11y/214-saas-a11y.test.js && npm run build-storybook` | ❌ W0 | ⬜ pending |
| 214-07-04 | 07 | 5 | SAAS-01, SAAS-02, SAAS-03 | manual verifications (4 — see below) | checkpoint:human-verify | manual (Storybook viewport switch + Chromatic + axe panel + grep growth) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## UI-SPEC AC Coverage Map

55 ACs total: 33 surface + 12 backend doctrine + 10 cross-cutting.

### Surface ACs (33) — all bound to Plan 214-07

**Settings page (`SS-*`, 15 ACs)** → Task 214-07-01:

| AC | Description | Verify |
|----|-------------|--------|
| SS-1 | page.tsx + page.module.css consume only var(--*) tokens (D-08) | `grep -E "#[0-9a-fA-F]{3,8}" app/(markos)/settings/saas/ → 0 hits` |
| SS-2 | h1 SaaS Suite renders for business_type='saas' tenants only | story `Default` shows h1; story `NotSaaSTenant` does not |
| SS-3 | Non-SaaS gating notice verbatim copy via `.c-notice c-notice--info` | grep verbatim string `[info] SaaS Suite is reserved for SaaS-business tenants. Contact support to change tenant type.` |
| SS-4 | Pre-activation hides Plans/Subs/Mutations/Lifecycle; only Growth placeholder visible | story `PreActivation` |
| SS-5 | Plans section vanilla `<table>` (D-14) + .t-label-caps headers + .c-badge--{state} | grep `<table>` + `.t-label-caps` in plans section |
| SS-6 | Plan-row Price column `<Money />` OR `{{MARKOS_PRICING_ENGINE_PENDING}}` verbatim | grep `MARKOS_PRICING_ENGINE_PENDING` and absence of `$\d` |
| SS-7 | Plan-row never hard-codes tier-name strings | grep `"Growth Monthly"|"Starter"|"Professional"` → 0 hits |
| SS-8 | Subscriptions section renders `<SaaSSubscriptionsTable />` with 8 lifecycle states in MixedStates story | story `MixedStates` |
| SS-9 | Pending mutations vanilla `<table>` with `.c-button--tertiary` mint-text "Open approval →" | grep `billing_charge_approval` in href |
| SS-10 | Lifecycle history with `.c-status-dot{,--live,--error}` markers | grep `.c-status-dot` in lifecycle section |
| SS-11 | Growth extension renders `<PlaceholderBanner variant="future_phase_217">` always; .c-chip when hint set | story `GrowthExtensionPlaceholder` |
| SS-12 | All `.c-notice` use 4 valid variants; zero local banner/alert/warning/callout (D-09b) | grep local banner classes → 0 hits |
| SS-13 | All `.c-card` use default; zero `.c-card--feature` (D-13) | grep `c-card--feature` → 0 hits |
| SS-14 | WCAG 2.1 AA: focus order, 44px touch target via global rule, color+glyph dual-signal | axe panel + manual focus order trace |
| SS-15 | page.stories.tsx ≥8 named state stories registered as Settings/SaaS | grep `Settings/SaaS` in storybook-static/index.json |

**Activation panel (`AP-*`, 7 ACs)** → Task 214-07-02:

| AC | Description | Verify |
|----|-------------|--------|
| AP-1 | SaaSActivationPanel.tsx + .module.css consume only var(--*) tokens | `grep -E "#[0-9a-fA-F]{3,8}" components/markos/tenant/SaaSActivationPanel.* → 0` |
| AP-2 | 5 variants verbatim: pre-activation \| wizard-in-progress \| activated \| activation-failed \| tenant-0-gate-closed | TS prop signature inspection |
| AP-3 | 6 wizard steps in order; aria-live polite step counter | grep wizard step headings + `aria-live="polite"` |
| AP-4 | Step 6 [ok] Ready to activate notice; submit disabled when tenant 0 gate closed | story `Tenant0GateClosed` |
| AP-5 | Activated heading [ok] SaaS Suite active + .c-status-dot--live | story `Activated` |
| AP-6 | .c-modal focus trap; ESC closes wizard with confirmation if draft non-empty | manual a11y check |
| AP-7 | SaaSActivationPanel.stories.tsx ≥7 named state stories | grep `Tenant/SaaSActivationPanel` in index.json |

**Subscriptions table (`ST-*`, 8 ACs)** → Task 214-07-03:

| AC | Description | Verify |
|----|-------------|--------|
| ST-1 | SaaSSubscriptionsTable.tsx + .module.css consume only var(--*) tokens | grep hex → 0 |
| ST-2 | 8 lifecycle states with verbatim copy; color+glyph dual-signal | grep all 8 state literals + bracketed glyph pairings |
| ST-3 | Action menu exposes 6 lifecycle mutations + audit-log export with verbatim mutation-class chips | grep `billing.charge` + `data.export` in modals |
| ST-4 | Each mutation modal verbatim copy; Cancel uses `.c-button--destructive` | grep modal copy strings |
| ST-5 | Pending-approval row chip + Open approval → link routes to /operations/approvals?handoff_kind=billing_charge_approval&mutation_request_id={id} | grep verbatim href |
| ST-6 | Autonomy-ceiling notice [block] glyph + non-export menu items disabled | grep `[block] Autonomy ceiling reached for billing.charge` |
| ST-7 | Run chip `.c-chip-protocol` with agent_run_id link to /operations/tasks?run_id={id} | grep `run_id=` in href |
| ST-8 | SaaSSubscriptionsTable.stories.tsx ≥7 named state stories | grep `Tenant/SaaSSubscriptionsTable` in index.json |

**Surface gating (`SG-*`, 3 ACs)** → SG-1 + SG-3 in Plan 214-06; SG-2 in Plan 214-07:

| AC | Description | Plan | Verify |
|----|-------------|------|--------|
| SG-1 | `lib/markos/saas/core/surface-gates.ts` exports `isSaaSSurfaceEnabled(tenant_id): Promise<boolean>` | 214-06 | TS export + behavior tests |
| SG-2 | Sidebar nav row hidden via aria-hidden + display:none on isSaaSSurfaceEnabled==false | 214-07 | manual nav check + grep |
| SG-3 | API handlers return HTTP 404 + body `{"error":"saas_surface_disabled"}` when gate closed | 214-06 | API gating test |

### Backend doctrine ACs (12) — all bound to Plans 214-01..06

| AC | Description | Plan | Task |
|----|-------------|------|------|
| BD-1 | markos_orgs.business_type column with backfill from onboarding_seed.company.business_model | 214-01 | 214-01-01 |
| BD-2 | saas_suite_activations table with all required wizard fields | 214-01 | 214-01-01 |
| BD-3 | SAAS_ACTIVATION_REQUIRES_BUSINESS_TYPE trigger blocks non-SaaS activation | 214-01 | 214-01-01 |
| BD-4 | saas_profiles + saas_plans + saas_plan_versions + saas_subscriptions + saas_subscription_events with tenant-scoped RLS | 214-02 | 214-02-01 |
| BD-5 | SAAS_PLAN_REQUIRES_PRICING_RECOMMENDATION_OR_SENTINEL trigger | 214-02 | 214-02-01 |
| BD-6 | saas_subscription_events append-only + idempotency uniqueness | 214-02 + 214-03 | 214-02-01, 214-03-01 |
| BD-7 | 8-state machine + 16-transition matrix + invalid-transition + approval-required triggers | 214-03 | 214-03-01 |
| BD-8 | saas_customer_bridges + identity-presence trigger; 4-literal resolution_status | 214-04 | 214-04-01 |
| BD-9 | saas_subscription_mutation_requests + saas_subscription_audit_links + evidence-pack trigger | 214-05 | 214-05-01 |
| BD-10 | buildApprovalPackage reuse from lib/markos/crm/agent-actions.ts (no parallel helper) | 214-05 | 214-05-01 |
| BD-11 | 7 mutation_family literals + billing_charge_approval handoff_kind + ApprovalHandoffRecord linkage + data.export for audit-log + evidence_refs preserved | 214-05 | 214-05-01 |
| BD-12 | lib/markos/mcp/tools/saas-core.cjs registers MCP tools that respect isSaaSSurfaceEnabled | 214-06 | 214-06-01 |

### Cross-cutting ACs (10) — bound to Plan 214-07 (X-1..9) + Plan 214-06 (X-10 backend half)

| AC | Description | Plan | Task |
|----|-------------|------|------|
| X-1 | Zero hex literals in any UI file; allowed exceptions 1px/2px/4px/44px | 214-07 | all 214-07-* |
| X-2 | All state badges/dots/notices pair color with bracketed glyph; color never sole signal | 214-07 | all 214-07-* |
| X-3 | Zero banned-lexicon words; zero exclamation points in product copy | 214-07 | all 214-07-* |
| X-4 | All extracted components ≥3 named state stories; page ≥7 stories | 214-07 | 214-07-01/02/03 |
| X-5 | All `.c-button` 44px touch target via global (pointer: coarse) rule; modules do not redeclare | 214-07 | all 214-07-* |
| X-6 | All animated elements freeze under prefers-reduced-motion: reduce | 214-07 | all 214-07-* |
| X-7 | Zero hard-coded $\d literals; zero tier-name strings; pricing via `<Money />` or sentinel | 214-07 | 214-07-01 |
| X-8 | UI gating test verifies via isSaaSSurfaceEnabled, not by re-implementing the rule | 214-07 | 214-07-01 |
| X-9 | All stories register under explicit meta.title paths; ≥21 SaaS-suite story entries total (8+7+7=22 actual) | 214-07 | 214-07-01/02/03 |
| X-10 | UI gating test + growth-extension non-activation test: placeholder renders for any non-empty hint AND no growth surface reachable | 214-06 + 214-07 | 214-06-01 (backend half), 214-07-01 (UI half) |

---

## Wave 0 Requirements

- [ ] `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` — Phase 214 creates the v4.1.0 coordination document because it is first in execution order.
- [ ] `lib/markos/saas/core/preflight/upstream-gate.ts` — hard/soft upstream assertions for Pricing Engine, AgentRun, approvals, and CRM substrate.
- [ ] `lib/markos/saas/core/preflight/architecture-lock.ts` — forbidden-pattern + helper-presence detector + 4 doctrine-violation strings + UI-path prefix lock when wave < 5.
- [ ] `lib/markos/saas/core/preflight/errors.ts` — typed preflight error surface.
- [ ] `lib/markos/saas/core/preflight/index.cjs` — CommonJS bridge for legacy handlers.
- [ ] `scripts/preconditions/214-01-check-upstream.cjs` — CLI preflight entrypoint.
- [ ] `test/saas-214/preflight/wave-0-baseline.test.js`
- [ ] `test/saas-214/preflight/architecture-lock.test.js`
- [ ] `test/saas-214/preflight/upstream-gate.test.js`
- [ ] `test/saas-214/preflight/helper-presence.test.js`
- [ ] `test/fixtures/saas-214/*.js` fixture barrel and per-domain factories.

---

## Manual-Only Verifications

4 manual verifications — all consolidated into the Plan 214-07 checkpoint task `214-07-04`.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Mobile breakpoint at iPhone 14 Pro (393×852)** for `settings.saas` | UI-SPEC §Plan Scope Classification (mobile_priority=secondary); SS-14; X-5 | Storybook viewport switching needs visual confirmation that tables collapse correctly to vertical card stacks and bottom-sheet action menus | Run `npm run storybook`. Visit `Settings/SaaS` → `Default` story. Switch viewport to "iPhone 14 Pro". Confirm: page padding switches to `--space-md`; tables collapse to `.c-card` stacks; activation hero remains single `.c-card`; action menu renders as bottom-sheet (full-width buttons stacked); 44px touch target on every `.c-button` (DevTools measurement). |
| **Chromatic baselines for 22 stories** | UI-SPEC §Storybook Story Register (8+7+7=22); X-9 (≥21 minimum) | Visual regression baselining needs human approval | Run `npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN`. Confirm 22 SaaS-suite snapshots accept as new baselines. (Skip allowed if token absent — fall back to manual visual review of all 22 stories in Storybook.) |
| **Axe a11y zero-violation on 22 stories** | SS-14, AP-3/AP-6, ST-2/ST-3 (a11y dimensions across all surface ACs); WCAG 2.1 AA | Axe accessibility addon needs human review of: contrast (4.5:1 AA), focus order, ARIA-role validity, form-label association — especially for `Tenant0GateClosed` (warning notice announcement), `WizardStep4` (`<fieldset>`/`<legend>` checkbox group announcement), `MutationModalOpen` (modal focus trap + ESC) | With Storybook running, open each of the 22 stories. Click "Accessibility" panel. Confirm zero violations on all 4 dimensions for every story. Document any violations with story name + violation code + suggested DESIGN.md token fix. |
| **Growth-extension metadata-only sanity** | SS-11; X-10; UI-SPEC §Growth-mode metadata-only contract; architecture-lock 4 doctrine strings | Hidden growth runtime would silently violate the metadata-only contract; needs comprehensive grep + visual confirmation | Run `grep -rE "growth/\|growth-mode" app/ api/ lib/markos/operator/ lib/markos/mcp/ 2>/dev/null \| grep -v "node_modules\|\\.module\\.css\|growth_extension\|growth_mode_hint\|future_phase_217\|requires_phase_218\|placeholder"`. Expected: 0 results. Then visit `Settings/SaaS` → `GrowthExtensionPlaceholder` story. Confirm: `<PlaceholderBanner variant="future_phase_217">` renders; `.c-chip` shows `[info] Growth extension hint: {hint}`; clicking the placeholder does nothing; no nav entry exists for "Growth". Run `grep -ciE "bypass surface gating\|pricing override\|growth runnable in 214\|crm second customer truth" app/(markos)/settings/saas/ components/markos/tenant/SaaS*.{tsx,module.css,stories.tsx}` and confirm 0. |

---

## 213.4 Carry-Forward Enforcement Table

The 213.4-VALIDATION carry-forward decisions D-08..D-15 remain in force for Phase 214 UI files. Plan 214-07 enforces every decision.

| Decision | What it means in 214 | Enforcement | Plan |
|----------|----------------------|-------------|------|
| **D-08** (token-only) | Zero inline hex literals in any of `app/(markos)/settings/saas/page.{tsx,module.css,stories.tsx}` + `components/markos/tenant/SaaSActivationPanel.{tsx,module.css,stories.tsx}` + `components/markos/tenant/SaaSSubscriptionsTable.{tsx,module.css,stories.tsx}`. Every color via `var(--color-*)`. Every spacing via `var(--space-*)`. Every typography via DESIGN.md `typography.*` token. | `grep -E "#[0-9a-fA-F]{3,8}" app/(markos)/settings/saas/ components/markos/tenant/SaaS*.{tsx,module.css,stories.tsx}` returns 0 hits. Auto-FAIL on any hit. | 214-07 (all 4 tasks) |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs (`Open subscription →`, `Open run →`, `Open approval inbox →`, `View pricing →`), and `.c-chip-protocol` IDs use `--color-primary-text`. Plan-row "View pricing" link uses `.c-button--tertiary` (mint text on transparent bg). Mint NEVER used as fill on activation hero card, plan-row hero, or subscription-row indicator. | grep verbatim CTA copy + verify `.c-button--tertiary` + `.c-chip-protocol` instances | 214-07-01, 214-07-03 |
| **D-09b** (`.c-notice` mandatory) | Non-SaaS tenant gating notice, activation-pending notice, growth-extension placeholder, mutation-approval-pending notice, activation-failed notice, lifecycle-event informational ALL compose `.c-notice c-notice--{state}`. No local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/(markos)/settings/saas/` or `components/markos/tenant/`. | `grep -rE "\\.banner\|\\.alert(\\b\|--)\|\\.warning\|\\.callout" app/(markos)/settings/saas/ components/markos/tenant/SaaS*.{tsx,module.css,stories.tsx}` returns 0 hits. Auto-FAIL on any hit. | 214-07 (all 4 tasks) |
| **D-13** (`.c-card--feature` reserved) | **FORBIDDEN in this phase.** Activation panel hero, plan rows, subscription rows, mutation rows, lifecycle event markers all use `.c-card` default. Activation hero uses `.c-card` plus `[info]`/`[warn]`/`[ok]` eyebrow — no hero treatment, no gradient, no feature-card variant. | `grep -c "c-card--feature" app/(markos)/settings/saas/ components/markos/tenant/SaaS*.{tsx,module.css,stories.tsx}` returns 0. Auto-FAIL on any hit. | 214-07 (all 4 tasks) |
| **D-14** (no `.c-table` primitive) | Plan catalog list, subscription list, lifecycle history, mutation queue use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 218+. | `grep -c "c-table" app/(markos)/settings/saas/ components/markos/tenant/SaaS*.{tsx,module.css,stories.tsx}` returns 0. Auto-FAIL on any hit. Confirm `<table>` semantic used. | 214-07-01, 214-07-03 |
| **D-15** (selective extraction) | `<SaaSActivationPanel />` and `<SaaSSubscriptionsTable />` extract to `components/markos/tenant/` because reuse is proven across ≥2 future surfaces (P215 reconciliation viewer reuses `<SaaSSubscriptionsTable />`; P217 SaaS revenue UI reuses `<SaaSActivationPanel />`; P218 growth wizard reuses both). Storybook stories register both extracted components. | Verify file existence + ≥3 named stories per extracted component (X-4) + meta.title under `Tenant/SaaSActivationPanel` and `Tenant/SaaSSubscriptionsTable` (X-9). | 214-07-02, 214-07-03 |

---

## Validation Architecture

- **Domain 1:** activation gate, `business_type` normalization, activation trigger, activation-table RLS (BD-1, BD-2, BD-3).
- **Domain 2:** SaaS profile/plan/subscription/event schema, plan pricing-sentinel enforcement, append-only event log, 8-state CHECK, 16-event-type CHECK (BD-4, BD-5, BD-6).
- **Domain 3:** state machine validity, 16-transition matrix, approval-required transitions, idempotency, rollback records (BD-6, BD-7).
- **Domain 4:** CRM identity bridge linking, 4-literal conflict review, orphan handling, merge-review task creation; doctrine self-check (BD-8 + `crm second customer truth` ban).
- **Domain 5:** mutation-request linkage, 7-family enum, audit/evidence requirements, approval-package visibility, `billing_charge_approval` handoff_kind extension, `data.export` for audit-log (BD-9, BD-10, BD-11).
- **Domain 6:** API/MCP/UI gating + growth-extension non-activation regression (SG-1, SG-3, BD-12, X-10).
- **UI Domain (a11y + Storybook):** Surface ACs SS-1..15 + AP-1..7 + ST-1..8 + SG-2 + cross-cutting X-1..10.

Architecture-lock runs first in every wave. It must verify:

- Helper presence: `buildApprovalPackage`, `requireHostedSupabaseAuth`, `resolvePlugin`, `lib/markos/mcp/tools/index.cjs`, and `contracts/openapi.json` exist.
- Forbidden helpers absent: `createApprovalPackage`, `requireSupabaseAuth`, `lookupPlugin`, `route.ts`, `vitest`, `playwright`, and `.test.ts` do not appear in the planned Phase 214 surface.
- 4 doctrine-violation strings absent: `bypass surface gating`, `pricing override`, `growth runnable in 214`, `crm second customer truth` do not appear anywhere in the diff.
- UI-path prefix lock when `wave < 5`: no path under `app/(markos)/settings/saas/` or starting with `components/markos/tenant/SaaS` is written.

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | SAAS-01..03 mapped across Plans 01-07; QA-01..06 carried; PRC-09, RUN-01..08, TASK-01..05, EVD-01..06 remain integration surfaces (P205/P207/P208/P209 ownership) |
| 2. Anti-shallow execution | DRAFT | Each plan has explicit `<read_first>` (UI-SPEC sections + DESIGN.md + parent UI-SPECs), `<acceptance_criteria>` (verbatim grep/test/Storybook commands), `<action>`, `<verify>`, `<done>` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns preflight, helper-presence, forbidden-pattern detection, 4 doctrine-string ban, and UI-path prefix lock when wave < 5 |
| 4. Compliance enforcement | LOCKED | Activation, pricing-sentinel, lifecycle approval, bridge identity, evidence-pack enforcement, mutation_family + handoff_kind extensions all encoded as both SQL CHECKs/triggers AND TS literal-union exports |
| 5. Cross-phase coordination | LOCKED | P214 owns creation of v4.1.0 coordination doc; UI-SPEC documents Approval Inbox extension (208-04 mutation_family + handoff_kind) as a 214-07 contract; downstream UI inheritance map (P215-P220) cites canonical primitives |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Subscription transitions, lifecycle mutations, pricing publication, bridge identity, audit linkage, growth-extension is_runnable invariant — all forced through trigger checks |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` (architecture-lock verified) |
| 8. Validation strategy (this doc) | DRAFT (UI-SPEC fold complete) | Full sampling strategy defined; per-task map covers all 11 tasks; UI-SPEC AC Coverage Map enumerates all 55 ACs; 4 manual-only verifications enumerated; 213.4 carry-forward enforcement table present; frontmatter `nyquist_compliant`/`wave_0_complete` stay false until execution proves Wave 0 and task coverage |

---

*Phase: 214-saas-suite-activation-subscription-core*
*Validation strategy created: 2026-04-27*
*UI-SPEC fold completed: 2026-04-29*
*Source: 214-RESEARCH.md + 214-REVIEWS.md + 214-UI-SPEC.md (55 ACs)*
</content>
