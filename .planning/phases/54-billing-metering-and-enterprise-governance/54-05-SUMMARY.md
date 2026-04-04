---
phase: 54-billing-metering-and-enterprise-governance
plan: 05
subsystem: billing-projection-and-ui
tags: [billing, stripe, reconciliation, tenant-ui, operator-ui, ledger-first, tdd]
requires:
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 02
    provides: immutable billing ledger and pricing foundations
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 04
    provides: shared entitlement and fail-closed billing policy vocabulary
provides:
  - Invoice-line-item generation from MarkOS ledger rows
  - Stripe projection and provider-sync outcome surfaces that preserve MarkOS as billing truth
  - Shared tenant and operator billing pages and APIs aligned to the approved Phase 54 UI contract
affects: [54-06]
tech-stack:
  added:
    - stripe
  patterns: [MarkOS-ledger-first billing projection, shared tenant/operator ledger views, evidence-first reconciliation UI]
key-files:
  created:
    - lib/markos/billing/reconciliation.cjs
    - lib/markos/billing/provider-sync.cjs
    - lib/markos/billing/invoice-line-items.ts
    - lib/markos/billing/stripe-sync.ts
    - supabase/migrations/54_billing_provider_sync.sql
    - api/billing/tenant-summary.js
    - api/billing/operator-reconciliation.js
    - api/billing/holds.js
    - app/(markos)/settings/billing/page.tsx
    - app/(markos)/settings/billing/actions.ts
    - app/(markos)/settings/billing/page.module.css
    - app/(markos)/admin/billing/page.tsx
    - app/(markos)/admin/billing/page.module.css
    - app/(markos)/admin/billing/reconciliation.stories.tsx
    - test/ui-billing/billing-pages-contract.test.js
  modified:
    - package.json
decisions:
  - Keep Stripe as a projection and sync boundary only; invoice truth remains derived from MarkOS ledger rows.
  - Serve tenant and operator billing views from the same reconciled ledger vocabulary with audience-appropriate presentation.
  - Use contract-focused UI tests to lock page structure, queue states, and evidence-first behavior before deeper live data plumbing lands.
metrics:
  completed: 2026-04-03
  tasks: 3
  files: 16
---

# Phase 54 Plan 05: Billing, Metering, and Enterprise Governance Summary

**Ledger-first invoice evidence, Stripe projection, and shared tenant/operator billing surfaces for BIL-03**

## Performance

- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Added the missing invoice reconciliation and provider-sync modules the 54-05 tests already expected, keeping provider failures in auditable hold state while preserving MarkOS ledger lineage.
- Added typed Stripe projection and invoice-line-item artifacts plus persistence schema for provider sync attempts and invoice projections.
- Built tenant and operator billing APIs and contract-compliant pages so both audiences read from the same ledger-backed vocabulary while exposing hold, sync-review, and evidence states distinctly.

## Verification

- `node --test test/billing/invoice-reconciliation.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` -> PASS

## Task Commits

- No commit created in this execution pass.

## Files Created/Modified

- `package.json` - added the `stripe` dependency entry for the planned provider sync boundary.
- `lib/markos/billing/reconciliation.cjs` - added MarkOS-ledger-to-invoice-line-item reconciliation with hard failure on provider-only lineage.
- `lib/markos/billing/provider-sync.cjs` - added hold-state derivation for provider sync failures with restricted-action preservation.
- `lib/markos/billing/invoice-line-items.ts` - added typed invoice line-item and reconciliation summary builders.
- `lib/markos/billing/stripe-sync.ts` - added typed Stripe projection and sync-attempt helpers.
- `supabase/migrations/54_billing_provider_sync.sql` - added provider sync attempt and invoice projection persistence with RLS enabled.
- `api/billing/tenant-summary.js` - added tenant billing summary API sourced from reconciled ledger output.
- `api/billing/operator-reconciliation.js` - added billing-admin-restricted reconciliation API with mismatch, hold, and sync-failure evidence.
- `api/billing/holds.js` - added hold-state API restricted to billing-authorized roles.
- `app/(markos)/settings/billing/page.tsx` and `page.module.css` - added the tenant billing page with the required module order, hold state, and translated billing vocabulary.
- `app/(markos)/settings/billing/actions.ts` - added server actions that read from the shared tenant billing summary endpoint.
- `app/(markos)/admin/billing/page.tsx` and `page.module.css` - added the operator billing reconciliation surface with queue tabs, detail panel, evidence rail, and sync-review state.
- `app/(markos)/admin/billing/reconciliation.stories.tsx` - added healthy, hold, and sync-failure story coverage.
- `test/ui-billing/billing-pages-contract.test.js` - added contract coverage for tenant/operator billing page structure and shared API references.

## Decisions Made

- Chose small CommonJS runtime modules for reconciliation and provider-sync because the existing tests already import CommonJS surfaces, while still providing typed TS artifacts for the plan’s canonical files.
- Kept the billing pages static and contract-first rather than overreaching into live data hydration or third-party components in the same execution pass.
- Added CSS modules for the new billing pages to satisfy the no-inline-styles rule without weakening the approved layout contract.

## Deviations from Plan

### Contract-first UI depth

- The tenant and operator billing pages are implemented as contract-compliant static surfaces referencing the shared billing APIs rather than fully hydrated live views.
- This preserves the locked UI structure and shared-ledger boundary without expanding the implementation into unrelated data-loading infrastructure in the same pass.

### Shared planning ledgers left untouched

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` remained unchanged in this pass because they already contained unrelated dirty changes.

## Issues Encountered

- The existing 54-05 billing tests pointed at non-existent reconciliation and provider-sync modules, so the plan started from missing implementation rather than failing behavior inside existing files.
- The new billing page files initially triggered inline-style diagnostics; moving them to CSS modules resolved the issue without changing the page contracts.

## User Setup Required

- Live Stripe projection still requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` plus webhook setup in the Stripe dashboard before the provider boundary can run outside tests.

## Next Phase Readiness

- 54-06 can now assemble governance evidence from stable billing line items, hold history, and provider-sync state.
- Tenant and operator billing surfaces now expose the language and evidence ordering that governance exports can build on.

## Self-Check: PASSED

- Summary file created at `.planning/phases/54-billing-metering-and-enterprise-governance/54-05-SUMMARY.md`.
- The targeted 54-05 billing and UI contract suite passed after the final code changes.