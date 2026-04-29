---
phase: 205
slug: pricing-engine-foundation-billing-readiness
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-29
updated: 2026-04-29
---

# Phase 205 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Filled at plan-revision time (2026-04-29) per 40 tasks across 8 plans, including UI-SPEC v1.1.0 grep gates folded into Plan 205-06.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest` (Pricing library + contracts + RLS isolation), `node --test` (migration replay), `playwright + axe-playwright` (Plan 205-06 only), `npm run build` (Next.js compile gate) |
| **Config files** | `vitest.config.ts` · `playwright.config.ts` · `package.json` `"test"` script |
| **Quick run command** | `npx vitest run test/vitest/pricing/` |
| **Pricing library suite** | `npx vitest run test/vitest/pricing/` |
| **Migration replay** | `node --test test/migrations/107_*.test.js test/migrations/108_*.test.js test/migrations/109_*.test.js test/migrations/110_*.test.js` |
| **UI grep gate** | `npx vitest run test/vitest/pricing/ui-grep-residue.test.ts` |
| **Playwright (205-06 only)** | `npx playwright test test/playwright/pricing/ test/playwright/billing/placeholder-state.spec.ts` |
| **Storybook build** | `npm run build-storybook` |
| **Full suite command** | `npm test && npm run build && npm run build-storybook` |
| **Estimated runtime** | ~90 seconds (vitest pricing ~25s; migration replay ~15s; build ~12s; storybook ~25s; playwright ~15s with parallelism) |

---

## Sampling Rate

- **After every task commit:** `npm run build` (~12s) + plan-scoped vitest suite for that wave (~5–10s).
- **After every plan complete:** Full vitest pricing suite + `npm run build` (~30–35s).
- **After Plan 205-06 completes:** `npx playwright test` + `npm run build-storybook` (~40s additional).
- **Before `/gsd-verify-work 205`:** Full suite green; UI grep gate green; placeholder-residue test green; no public unresolution.
- **Max feedback latency:** ~90 seconds (full battery).

---

## Per-Task Verification Map

### Plan 205-01 — Pricing Contracts, Schema, RLS (Wave 1 Gate)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-01-T1 | 01 | 1 | PRC-01, PRC-04 | unit | `npx vitest run test/vitest/pricing/contracts.test.ts` | yes (W0 → after T1) | pending |
| 205-01-T2 | 01 | 1 | PRC-04 | unit | `npx vitest run test/vitest/pricing/contracts.test.ts -t "money"` | yes (W0 → after T1) | pending |
| 205-01-T3 | 01 | 1 | PRC-01, PRC-05, QA-08 | migration replay | `node --test test/migrations/107_markos_pricing_knowledge.test.js test/migrations/108_markos_pricing_cost_models.test.js test/migrations/109_markos_pricing_recommendations.test.js test/migrations/110_markos_pricing_price_tests.test.js` | yes (W0) | pending |
| 205-01-T4 | 01 | 1 | PRC-04, BILL-02, QA-15 | migration replay + unit | `node --test test/migrations/ && npx vitest run test/vitest/pricing/rls-isolation.test.ts` | yes (W0) | pending |
| 205-01-T5 | 01 | 1 | PRC-01, QA-15 | grep + unit | `grep -c "x-markos-phase: 205-01-PLAN" contracts/F-11{2,3,4,5,6,7,8,9}*.yaml` == 0; YAML schema validates | yes | pending |
| 205-01-T6 | 01 | 1 | PRC-01, BILL-02, QA-12 | unit + RLS | `npx vitest run test/vitest/pricing/rls-isolation.test.ts test/vitest/pricing/contracts.test.ts` | yes (W0) | pending |

### Plan 205-02 — Tenant Cost Model and Pricing Floor

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-02-T1 | 02 | 2 | PRC-02, PRC-04, BILL-01 | unit | `npx vitest run test/vitest/pricing/cost-model.test.ts` | yes (W0 → after T1) | pending |
| 205-02-T2 | 02 | 2 | PRC-02, QA-05 | unit | `npx vitest run test/vitest/pricing/cost-model-wizard.test.ts test/vitest/pricing/byok-posture.test.ts` | yes (W0 → after T2) | pending |
| 205-02-T3 | 02 | 2 | PRC-02, BILL-01, QA-15 | API + unit | `npx vitest run test/vitest/pricing/cost-model.test.ts -t "api"` + curl `/api/tenant/pricing/cost-models/[id]/snapshot` returns 201 | yes (W0 → after T3) | pending |
| 205-02-T4 | 02 | 2 | PRC-02, QA-12, QA-15 | unit + grep | `npx vitest run test/vitest/pricing/cost-model.test.ts test/vitest/pricing/cost-model-wizard.test.ts test/vitest/pricing/byok-posture.test.ts && grep -c "x-markos-phase: 205-02-PLAN" contracts/F-113-pricing-cost-model-v1.yaml` == 0 | yes | pending |

### Plan 205-03 — Pricing Knowledge Store + Watch List + Alerts + PRC-06

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-03-T1 | 03 | 2 | PRC-01, PRC-03, QA-07 | unit | `npx vitest run test/vitest/pricing/knowledge-change-magnitude.test.ts` | yes (W0 → after T1) | pending |
| 205-03-T2 | 03 | 2 | PRC-06, QA-07, QA-15 | unit | `npx vitest run test/vitest/pricing/watch-list-admission.test.ts` | yes (W0 → after T2) | pending |
| 205-03-T3 | 03 | 2 | PRC-06, QA-03, QA-08 | unit + mock HTTP | `npx vitest run test/vitest/pricing/single-url-fetch.test.ts` | yes (W0 → after T3) | pending |
| 205-03-T4 | 03 | 2 | PRC-06, QA-15 | grep + API | `grep -c "x-markos-phase: 205-03-PLAN" contracts/F-114-pricing-knowledge-v1.yaml` == 0; `ls .agent/markos/agents/markos-prc-06-competitive-price-watcher.md` exits 0 | yes | pending |
| 205-03-T5 | 03 | 2 | PRC-01, PRC-03, PRC-06, QA-07, QA-15 | unit | `npx vitest run test/vitest/pricing/knowledge-change-magnitude.test.ts test/vitest/pricing/watch-list-admission.test.ts test/vitest/pricing/single-url-fetch.test.ts` | yes (W0) | pending |

### Plan 205-04 — Recommendation + PriceTest Approval Engine

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-04-T1 | 04 | 3 | PRC-04, PRC-05, QA-04 | unit | `npx vitest run test/vitest/pricing/recommendation-state.test.ts test/vitest/pricing/price-test-stop-conditions.test.ts` | yes (W0 → after T1) | pending |
| 205-04-T2 | 04 | 3 | PRC-04, QA-11, QA-15 | unit | `npx vitest run test/vitest/pricing/recommendation-state.test.ts -t "admission"` | yes (W0 → after T2) | pending |
| 205-04-T3 | 04 | 3 | PRC-04, QA-13, QA-14 | unit | `npx vitest run test/vitest/pricing/approval-token-binding.test.ts` | yes (W0 → after T3) | pending |
| 205-04-T4 | 04 | 3 | PRC-04, QA-06, QA-15 | unit | `npx vitest run test/vitest/pricing/agent-run-context.test.ts` | yes (W0 → after T4) | pending |
| 205-04-T5 | 04 | 3 | PRC-04, QA-15 | grep + unit | `grep -c "x-markos-phase: 205-04-PLAN" contracts/F-115-pricing-recommendation-v1.yaml` == 0; `ls .agent/markos/agents/markos-prc-0{1,2,3,4}-*.md` exits 0; full plan-scope vitest green | yes | pending |

### Plan 205-05 — Pricing API + 6 MCP Tools + Content Guardrail

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-05-T1 | 05 | 4 | PRC-07, PRC-09, BILL-02 | unit | `npx vitest run test/vitest/pricing/api-routes-readonly.test.ts` | yes (W0 → after T1) | pending |
| 205-05-T2 | 05 | 4 | PRC-07, QA-02, QA-09 | unit | `npx vitest run test/vitest/pricing/mcp-tools.test.ts` | yes (W0 → after T2) | pending |
| 205-05-T3 | 05 | 4 | PRC-07, PRC-09, QA-09 | API + unit | `npx vitest run test/vitest/pricing/api-routes-readonly.test.ts && curl http://localhost:3000/api/tenant/pricing/matrix` returns 200 | yes (W0 → after T3) | pending |
| 205-05-T4 | 05 | 4 | PRC-09, QA-15 | unit + grep | `npx vitest run test/vitest/pricing/content-guardrail.test.ts test/vitest/pricing/placeholder-residue.test.ts && grep -c "x-markos-phase: 205-05-PLAN" contracts/F-116-pricing-matrix-api-v1.yaml` == 0 | yes (W0 → after T4) | pending |
| 205-05-T5 | 05 | 4 | PRC-09, QA-15 | unit | `npx vitest run test/vitest/pricing/mcp-tools.test.ts test/vitest/pricing/content-guardrail.test.ts test/vitest/pricing/placeholder-residue.test.ts test/vitest/pricing/api-routes-readonly.test.ts` | yes | pending |

### Plan 205-06 — Pricing Engine Operator UI + Billing Placeholder Rewrite (UI-SPEC ACs)

| Task ID | Plan | Wave | Requirement (UI-SPEC) | Test Type | Automated Command | File Exists | Status |
|---------|------|------|----------------------|-----------|-------------------|-------------|--------|
| 205-06-T1 | 06 | 4 | PB-1, PB-2, PB-3, PB-4, PB-5 | grep + unit + build | `npx vitest run test/vitest/pricing/ui-grep-residue.test.ts && npm run build && grep -c "Growth Monthly\|\\$150" api/billing/tenant-summary.js app/\\(markos\\)/settings/billing/page-shell.tsx` == 0; placeholder + engine + hold paths render | yes (W0 → after T4 ships ui-grep-residue.test.ts) | pending |
| 205-06-T2 | 06 | 4 | CM-1, CM-2, CM-3, CM-4, CM-5, CM-6, CM-7 | grep + build | `npm run build && grep -rE "#[0-9a-fA-F]{3,8}" components/markos/pricing/*.tsx` == 0; `grep -c "raw_payload_ref" components/markos/pricing/CompetitorMatrix.tsx` == 0; `grep -c "c-card--feature" components/markos/pricing/*.tsx` == 0; `grep -c "MARKOS_PRICING_ENGINE_PENDING" components/markos/pricing/PlaceholderBanner.tsx` >= 1 | yes (W0 → after T2) | pending |
| 205-06-T3 | 06 | 4 | PR-1..PR-20 + AB-EXT-1..AB-EXT-3 | grep + build + a11y | `npm run build && npx vitest run test/vitest/pricing/ui-grep-residue.test.ts && grep -rE "#[0-9a-fA-F]{3,8}" app/\\(markos\\)/pricing/**/*.module.css app/\\(markos\\)/admin/billing/page.tsx` == 0; `grep -c "PricingLineagePanel" app/\\(markos\\)/admin/billing/page.tsx` >= 1; `grep -c "c-card--feature\|c-table" app/\\(markos\\)/pricing/**/*.tsx` == 0; bracketed-glyph count >= 8 | yes | pending |
| 205-06-T4 | 06 | 4 | Storybook coverage + UI grep gate | grep + storybook | `npm run build-storybook && npx vitest run test/vitest/pricing/ui-grep-residue.test.ts && grep -c "growth_monthly\|Growth Monthly" stories/markos/pricing/*.stories.tsx` == 0; `grep -c "x-markos-ui-surfaces\|x-markos-design-canon" contracts/F-117-pricing-operator-ui-v1.yaml` >= 2 | yes | pending |
| 205-06-T5 | 06 | 4 | PR-11, PR-16, PR-18, PB-2, PB-4, QA-01 | playwright + a11y | `npx playwright test test/playwright/pricing/ test/playwright/billing/placeholder-state.spec.ts` (axe-playwright 0 critical violations); `grep -c "{{MARKOS_PRICING_ENGINE_PENDING}}" test/playwright/billing/placeholder-state.spec.ts` >= 1 | yes | pending |

### Plan 205-07 — Stripe Handoff from Approved Pricing Recommendations

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-07-T1 | 07 | 5 | PRC-09, BILL-01, QA-13, QA-14 | unit | `npx vitest run test/vitest/pricing/stripe-handoff.test.ts test/vitest/pricing/stripe-refusal-unapproved.test.ts` | yes (W0 → after T1) | pending |
| 205-07-T2 | 07 | 5 | PRC-09, BILL-02, QA-04, QA-09 | unit | `npx vitest run test/vitest/pricing/stripe-subscriber-grace.test.ts test/vitest/pricing/invoice-ui-no-competitor-leak.test.ts` | yes (W0 → after T2) | pending |
| 205-07-T3 | 07 | 5 | PRC-09, BILL-01, QA-15 | unit + API | `npx vitest run test/vitest/pricing/stripe-handoff.test.ts -t "api"` | yes (W0 → after T3) | pending |
| 205-07-T4 | 07 | 5 | PRC-09, QA-15 | grep + install | `grep -c '"stripe"' package.json` >= 1; `grep -c "x-markos-phase: 205-07-PLAN" contracts/F-118-pricing-stripe-handoff-v1.yaml` == 0 | yes | pending |
| 205-07-T5 | 07 | 5 | PRC-09, BILL-02, QA-04, QA-13, QA-14 | unit | `npx vitest run test/vitest/pricing/stripe-handoff.test.ts test/vitest/pricing/stripe-refusal-unapproved.test.ts test/vitest/pricing/stripe-subscriber-grace.test.ts test/vitest/pricing/invoice-ui-no-competitor-leak.test.ts` | yes | pending |

### Plan 205-08 — Tenant 0 Pricing Dogfood

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 205-08-T1 | 08 | 6 | PRC-01, PRC-02, BILL-02 | seed + unit | `node scripts/tenant-zero/seed-pricing-cost-model.mjs && npx vitest run test/vitest/pricing/tenant-zero-dogfood.test.ts -t "cost model"` | yes (W0 → after T1) | pending |
| 205-08-T2 | 08 | 6 | PRC-03, PRC-06, QA-08 | seed + unit | `node scripts/tenant-zero/seed-competitor-watch.mjs && npx vitest run test/vitest/pricing/tenant-zero-dogfood.test.ts -t "watch"` | yes (W0 → after T2) | pending |
| 205-08-T3 | 08 | 6 | PRC-04, PRC-09, QA-11, QA-15 | seed + unit | `node scripts/tenant-zero/seed-saas-tier-recommendation.mjs && npx vitest run test/vitest/pricing/tenant-zero-dogfood.test.ts -t "approval"` | yes (W0 → after T3) | pending |
| 205-08-T4 | 08 | 6 | PRC-08, BILL-02, QA-15 | grep + script | `node scripts/tenant-zero/verify-pricing-dogfood.mjs && npx vitest run test/vitest/pricing/public-placeholder-protection.test.ts test/vitest/pricing/no-public-unresolution-in-205.test.ts` | yes (W0 → after T4) | pending |
| 205-08-T5 | 08 | 6 | All PRC + BILL + QA | unit | `npx vitest run test/vitest/pricing/tenant-zero-dogfood.test.ts test/vitest/pricing/public-placeholder-protection.test.ts test/vitest/pricing/no-public-unresolution-in-205.test.ts` | yes | pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Total tasks:** 40 across 8 plans. Every task has at least one automated `<verify>` gate (unit / migration replay / API / grep / build / playwright / storybook). No 3 consecutive tasks without automated verify (Nyquist compliant).

---

## Wave 0 Requirements

Per RESEARCH §Recommended Adoption Sequence, test files are co-authored alongside the library/UI files they cover. Plans land tests in their final task; intermediate tasks rely on the test scaffold introduced by the same plan's earlier task.

**Net-new test files created during Phase 205 execution:**

- `test/vitest/pricing/contracts.test.ts` — Plan 205-01 Task 1
- `test/vitest/pricing/rls-isolation.test.ts` — Plan 205-01 Task 4
- `test/migrations/107_*.test.js`, `108_*`, `109_*`, `110_*` — Plan 205-01 Task 3
- `test/vitest/pricing/cost-model.test.ts` — Plan 205-02 Task 1
- `test/vitest/pricing/cost-model-wizard.test.ts` — Plan 205-02 Task 2
- `test/vitest/pricing/byok-posture.test.ts` — Plan 205-02 Task 2
- `test/vitest/pricing/knowledge-change-magnitude.test.ts` — Plan 205-03 Task 1
- `test/vitest/pricing/watch-list-admission.test.ts` — Plan 205-03 Task 2
- `test/vitest/pricing/single-url-fetch.test.ts` — Plan 205-03 Task 3
- `test/vitest/pricing/recommendation-state.test.ts` — Plan 205-04 Task 1
- `test/vitest/pricing/price-test-stop-conditions.test.ts` — Plan 205-04 Task 1
- `test/vitest/pricing/agent-run-context.test.ts` — Plan 205-04 Task 4
- `test/vitest/pricing/approval-token-binding.test.ts` — Plan 205-04 Task 3
- `test/vitest/pricing/mcp-tools.test.ts` — Plan 205-05 Task 2
- `test/vitest/pricing/content-guardrail.test.ts` — Plan 205-05 Task 4
- `test/vitest/pricing/placeholder-residue.test.ts` — Plan 205-05 Task 4
- `test/vitest/pricing/api-routes-readonly.test.ts` — Plan 205-05 Task 1
- `test/vitest/pricing/ui-grep-residue.test.ts` — **Plan 205-06 Task 4 (UI-SPEC enforcement gate)**
- `test/playwright/pricing/cost-model-wizard.spec.ts` — Plan 205-06 Task 5
- `test/playwright/pricing/recommendation-approval.spec.ts` — Plan 205-06 Task 5
- `test/playwright/pricing/price-test-activation.spec.ts` — Plan 205-06 Task 5
- `test/playwright/pricing/competitor-matrix-evidence.spec.ts` — Plan 205-06 Task 5
- `test/playwright/billing/placeholder-state.spec.ts` — Plan 205-06 Task 5
- `test/vitest/pricing/stripe-handoff.test.ts` — Plan 205-07 Task 1
- `test/vitest/pricing/stripe-refusal-unapproved.test.ts` — Plan 205-07 Task 1
- `test/vitest/pricing/stripe-subscriber-grace.test.ts` — Plan 205-07 Task 2
- `test/vitest/pricing/invoice-ui-no-competitor-leak.test.ts` — Plan 205-07 Task 2
- `test/vitest/pricing/tenant-zero-dogfood.test.ts` — Plan 205-08 Task 1
- `test/vitest/pricing/public-placeholder-protection.test.ts` — Plan 205-08 Task 4
- `test/vitest/pricing/no-public-unresolution-in-205.test.ts` — Plan 205-08 Task 4

**Stories created during execution (Plan 205-06 Task 4):**

- `stories/markos/pricing/RecommendationCard.stories.tsx` (9 state variants)
- `stories/markos/pricing/BillingPageShell.stories.tsx` (3 variants — placeholder/engine/hold)
- `stories/markos/pricing/PriceTestCard.stories.tsx` (5 variants)
- `stories/markos/pricing/PricingLineagePanel.stories.tsx` (3 variants)

Existing test infrastructure (Phase 200/201/202/203/204/207/213.x suites) covers all carry-forward verification. `vitest`, `playwright`, `axe-playwright`, `glob`, `node --test` are all already installed in the repo. No new framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Storybook visual regression (Chromatic baseline) | All UI-SPEC ACs with Storybook stories | Visual diff against pixel baseline | After Plan 205-06 Task 4 completes and stories ship, push to a Chromatic-enabled branch; review baselines for: `Pricing/RecommendationCard` × 9 (8 states + affects_existing_subscribers); `Pricing/BillingPageShell` × 3 (placeholder/engine/hold); `Pricing/PriceTestCard` × 5; `Pricing/PricingLineagePanel` × 3. **20 baselines total.** |
| Light-theme contrast (cost-model wizard step indicator) | PR-12 | Light-theme rendering visual confirmation | After Plan 205-06 Task 3, run Storybook locally with `data-theme="light"` toolbar; confirm wizard step indicator dots render with correct contrast (active=mint, completed=success-green, pending=on-surface-subtle) on light background. Browser DevTools contrast tool should report ≥4.5:1 on every state. |
| Forced-colors (Windows High Contrast) rendering | PR-2, PR-6 | Requires Windows OS or browser High Contrast simulation | After Plan 205-06 Task 3, render `pricing/dashboard` + `pricing/recommendations/[id]` in Edge browser with Windows High Contrast Aquatic theme active; confirm `.c-card` borders use CanvasText, focus rings use Highlight, `.c-button--primary` uses LinkText. |
| Reduced-motion behavior | PR-7 | OS-level setting | Set OS-level "Reduce motion" preference; navigate `/pricing/cost-model/wizard` step transitions and `/pricing/price-tests` `.c-status-dot--live` indicator — confirm all transitions disabled and the kernel-pulse status dot freezes at full opacity. |
| Touch-target ≥44px on coarse pointers | DESIGN.md a11y minimum | Requires touch device or DevTools device emulation | Open Chrome DevTools, toggle Mobile emulation (iPhone 14 Pro), navigate any 205-06 surface, inspect any `.c-button` — `min-height` should compute to 44px. |
| Stripe Dashboard verification (Tenant 0 dogfood) | 205-08 dogfood | External provider state | After Plan 205-08 Task 3, log into Stripe Dashboard (test mode for Tenant 0); confirm new `Product`/`Price`/`Meter` objects exist with `markos_public_tier_locked: 'true'` metadata. Confirm no public-tier products are created (placeholder protection holds). |
| Public placeholder protection (visual review) | 205-08 PRC-08 | Public-facing copy review | After Plan 205-08, manually grep `docs/pricing/public-tier-placeholder.md`, `public/llms.txt`, marketing landing page templates — confirm `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel still present; no tier name or dollar literal has been substituted. Test `no-public-unresolution-in-205.test.ts` enforces but a one-time human read confirms semantic intent. |

---

## Validation Sign-Off

- [x] All 40 tasks have `<automated>` verify or Wave 0 dependency declared
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task carries at least one unit/grep/build/playwright/migration-replay gate)
- [x] Wave 0 covers all MISSING references (30 NEW test files + 4 NEW story files across 8 plans)
- [x] No watch-mode flags (every test runs once, exits)
- [x] Feedback latency < 90s (full battery)
- [x] UI-SPEC v1.1.0 ACs (PR-1..PR-20, PB-1..PB-5, AB-EXT-1..3, CM-1..CM-7) folded into Plan 205-06 task acceptance criteria
- [x] `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder rule enforced verbatim across Plan 205-06 (PB-2, PB-4, CM-5) and Plan 205-08 (no-public-unresolution test)
- [x] DESIGN.md v1.1.0 token gate enforced via `ui-grep-residue.test.ts` (zero inline hex; `.c-card--feature` banned in 205; vanilla `<table>` only)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-29 (auto mode — gsd-planner revision)
