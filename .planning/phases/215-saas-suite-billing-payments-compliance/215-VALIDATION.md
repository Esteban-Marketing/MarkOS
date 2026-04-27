---
phase: 215
slug: saas-suite-billing-payments-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 215 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P216-P220 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/saas-215/preflight/` |
| **Full suite command** | `npm test -- test/saas-215/ test/api-contracts/saas-215-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/saas-215/<domain-N>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/saas-215/`
- **Before `/gsd:verify-work`:** Full suite green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 215-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/saas-215/preflight/` | ❌ W0 | ⬜ pending |
| 215-01-01 | 01 | 1 | SAS-04, BILL-01 | schema+trigger | `npm test -- test/saas-215/domain-1/` | ❌ W0 | ⬜ pending |
| 215-02-01 | 02 | 2 | SAS-05 (US path) | schema+trigger | `npm test -- test/saas-215/domain-2/` | ❌ W0 | ⬜ pending |
| 215-03-01 | 03 | 2 | SAS-05, SAS-06, COMP-01 (Colombia + DIAN) | schema+trigger | `npm test -- test/saas-215/domain-3/` | ❌ W0 | ⬜ pending |
| 215-04-01 | 04 | 3 | SAS-05 (webhooks) | webhook+trigger | `npm test -- test/saas-215/domain-4/` | ❌ W0 | ⬜ pending |
| 215-05-01 | 05 | 3 | SAS-04, SAS-05 (corrections) | schema+trigger | `npm test -- test/saas-215/domain-5/` | ❌ W0 | ⬜ pending |
| 215-06-01 | 06 | 4 | translation-gate + closeout | regression | `npm test -- test/saas-215/domain-6/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/215-check-upstream.cjs` — assertUpstreamReady CLI for HARD upstreams (P203 webhook engine + P205 Pricing Engine + P206 + P214 saas_suite_activations + saas_subscriptions) + SOFT (P207, P208, P209, P211, P212, P213)
- [ ] `lib/markos/saas/billing/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/saas/billing/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/saas/billing/preflight/errors.ts` — UpstreamPhaseNotLandedError + CredentialNotVaultRefError
- [ ] `test/saas-215/preflight/architecture-lock.test.js`
- [ ] `test/saas-215/preflight/upstream-gate.test.js`
- [ ] `test/saas-215/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist
- [ ] `test/saas-215/preflight/credential-sanitization.test.js` — verifies MCP saas-billing.cjs strips 12 credential fields from tool output
- [ ] Test fixtures under `test/fixtures/saas-215/*.js` (NOT `.ts`)
- [ ] CREATE `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` — P215 is FIRST V4.1.0 phase to execute (CREATE-or-APPEND defensive pattern; P216 will APPEND after, but P217/P218/P219 plans assume the doc exists)
  - Document Q-7 SLOT ORDERING CRISIS: P215 execution-order BEFORE P216-P220 but slot-order LATEST in V4.1.0 (118-123); FK direction strictly P216-P220 READ P215 (zero reverse FKs); execution gating via assertUpstreamReady, not slot numbers

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DIAN sandbox-to-production cutover | SAS-06, COMP-01 | DIAN production credentials require legal sign-off + tenant CFO confirmation; cannot be auto-promoted | Operator validates Siigo sandbox CUFE generation; signs off via approval inbox; flips `saas_dian_config.environment=production` per tenant |
| Processor credential rotation | HIGH 2 sensitive credential | Stripe / Mercado Pago / Siigo / DIAN PKCS12 cert rotation = security-critical event | Operator rotates via Supabase Vault UI; runs `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` audit query confirming all credential fields are vault-refs (not plaintext); logs rotation evidence to evidence_pack |
| Multi-country tax field audit | SAS-05 | First quarter of US sales tax + Colombia IVA/retefuente/reteIVA/reteICA needs CPA review for jurisdiction correctness | Operator reviews `saas_invoices.tax_breakdown` JSONB per jurisdiction; signs off; refines tax field validators if needed |
| Dunning escalation review | SAS-04 | First-quarter dunning sequences (failed payment retries → invoice corrections → write-offs) need CFO judgment for escalation thresholds | Operator reviews `saas_billing_events` dunning trail per failed subscription; refines retry cadence + write-off thresholds |
| Future payout activation review | translation_gate_for [P218,P219,P220] | Confirms `saas_future_payout_policies` all `planned_only=true` until P218-P220 P06 plans flip flags via approved migration | Operator reviews translation-gate test output + confirms 0 future-payout policies `is_active=true` pre-P218 |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `215-RESEARCH.md` §Validation Architecture

**Per-domain test strategy:**
- **Domain 1 (SaaSInvoice + SaaSPaymentAttempt + SaaSBillingEvent contracts):** unit (RLS, schema, Pricing Engine FK or sentinel acceptance, tax_jurisdiction validators), integration (DB-trigger `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS`), regression (no slot 100/foundation collision)
- **Domain 2 (US path Stripe + Stripe Tax + QuickBooks):** unit (RLS, schema, Stripe object/event mapping, sales_tax_calculation_id validators), integration (DB-trigger `STRIPE_INVOICE_REQUIRES_TAX_CALCULATION` + `BILLING_CREDENTIAL_REQUIRES_VAULT_REF`; mock Stripe webhook end-to-end), regression (P203 webhook engine reuse)
- **Domain 3 (Colombia path Mercado Pago + Siigo + DIAN):** unit (RLS, schema, Mercado Pago Preapproval shape, Siigo CUFE/QR validators, IVA/retention math), integration (DB-trigger `DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE` + `DIAN_REJECTION_CREATES_P1_TASK` + `BILLING_CREDENTIAL_REQUIRES_VAULT_REF`; mock Siigo sandbox + DIAN rejection flow), regression (P203 webhook engine reuse)
- **Domain 4 (Processor webhook routing through P203 engine):** unit (signature_verified_at + idempotency_key validators), integration (DB-trigger `PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY`; mock signature replay attack — must be blocked), regression (P203 substrate signing/replay/DLQ/rate-limit/circuit-breaker preserved)
- **Domain 5 (Billing approvals + corrections + dunning + evidence):** unit (RLS, schema, refund/credit/discount/write-off validators), integration (DB-trigger `BILLING_CORRECTION_REQUIRES_APPROVAL`; SOC2 evidence pack export), regression (P208 approval inbox; Pricing Engine sentinel parity with P218/P219)
- **Domain 6 (Future incentive payout hooks + closeout):** unit (saas_future_payout_policies schema + planned_only=true seed), integration (translation-gate test asserts 0 active future payouts + 0 referral/affiliate/partner agents `runnable=true`), regression (slot-collision regression — P215 owns 118-123 + foundation/P216-P220 untouched; all-domains architecture-lock RE-RUN; requirements-coverage assertion)

**Architecture-lock regression:** `test/saas-215/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 215-*-PLAN.md bodies + lib/markos/saas/billing/* + api/v1/saas/{billing,invoices,webhooks}/* + api/cron/saas-billing-* for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(saas), api/v1/.../route.ts, vitest, playwright, .test.ts, .ts MCP files). Fails wave on positive invocation.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

**Credential sanitization regression:** `test/saas-215/preflight/credential-sanitization.test.js` asserts MCP saas-billing.cjs tool output strips 12 credential fields (stripe_secret_key, stripe_webhook_secret, stripe_tax_api_key, mercadopago_access_token, mercadopago_webhook_secret, quickbooks_oauth_token, quickbooks_realm_id, siigo_api_key, alegra_api_key, dian_pkcs12_certificate, dian_pkcs12_password, dian_authorization_token).

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All P215-OWNED IDs (SAS-04, SAS-05, SAS-06, BILL-01, COMP-01, QA-01..15) mapped to plans during planning iteration; PRC-01..09 = `integrates_with: P205`; WHK-01 = `integrates_with: P203`; SG-04/06/11/12 + PRC-09 in Plan 06 = `translation_gate_for: [P218, P219, P220]`; TASK-01..05 = `integrates_with: P207/P208`; EVD-01..06 = `integrates_with: P209` |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady + credential sanitization |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (7 triggers): INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS / STRIPE_INVOICE_REQUIRES_TAX_CALCULATION / DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE + DIAN_REJECTION_CREATES_P1_TASK / PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY / BILLING_CORRECTION_REQUIRES_APPROVAL / BILLING_CREDENTIAL_REQUIRES_VAULT_REF cross-Plans 02+03+04 |
| 5. Cross-phase coordination | DRAFT | Q-1..Q-9 resolved; Q-7 SLOT ORDERING CRISIS documented (P215 = 118-123 slot-order LATEST; FK direction P216-P220 READ P215; zero reverse FKs); P215 CREATES V4.1.0-MIGRATION-SLOT-COORDINATION.md (P216 will APPEND) |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (7 triggers across 5 active-schema domains; Plan 06 closeout regression test only) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 215-saas-suite-billing-payments-compliance*
*Validation strategy created: 2026-04-26*
*Source: 215-RESEARCH.md + 215-REVIEWS.md*
