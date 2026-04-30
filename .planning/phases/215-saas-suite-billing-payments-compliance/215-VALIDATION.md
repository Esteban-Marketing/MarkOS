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
| 215-03-01 | 03 | 3 | SAS-05, SAS-06, COMP-01 (Colombia + DIAN) | schema+trigger | `npm test -- test/saas-215/domain-3/` | ❌ W0 | ⬜ pending |
| 215-04-01 | 04 | 4 | SAS-05 (webhooks) | webhook+trigger | `npm test -- test/saas-215/domain-4/` | ❌ W0 | ⬜ pending |
| 215-05-01 | 05 | 4 | SAS-04, SAS-05 (corrections) | schema+trigger | `npm test -- test/saas-215/domain-5/` | ❌ W0 | ⬜ pending |
| 215-06-01 | 06 | 5 | translation-gate + closeout | regression | `npm test -- test/saas-215/domain-6/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## UI-SPEC AC Coverage Map (no-UI-scope fold)

> Authored 2026-04-29 to fold `215-UI-SPEC.md` (NO_UI variant) into the 6 plans.
> This phase ships ZERO UI surfaces; the AC coverage below tracks the BACKEND
> doctrine assertions that downstream UI surfaces will inherit (B-1..B-8 UI
> binding contract substrate; 5-layer credential defense; translation gate
> dissolution / opening; sentinel discipline; DIAN wizard 6-state literals;
> 5 correction_type literals; 6th `billing_correction_approval` handoff_kind
> literal; 14 downstream UI surface citations).

### Backend doctrine assertions (closeout grep gates)

| Doctrine assertion | Plan(s) | Verifying file(s) / closeout test |
|---------------------|---------|-----------------------------------|
| 5-layer defense-in-depth verbatim layer naming (`Layer 1 Storage` / `Layer 2 DB-trigger` / `Layer 3 MCP sanitization` / `Layer 4 Log redaction` / `Layer 5 Prompt-injection defense`) appears across 5 files | 01 | `lib/markos/saas/billing/credential-vault.ts` + `migrations/118` + `lib/markos/mcp/tools/saas-billing.cjs` + `lib/markos/saas/billing/log-redaction.ts` + `lib/markos/saas/billing/llm-shield.ts` ; closeout `architecture-lock-rerun.test.js` |
| 5 PII-field-list constants — `STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `QB_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS` — exported from `log-redaction.ts` | 01 (define) + 02/03/04 (consume) | `lib/markos/saas/billing/log-redaction.ts` ; `test/saas-215/domain-{1,2,3,4}/log-redaction*.test.js` |
| DB-trigger names verbatim — `BILLING_CREDENTIAL_REQUIRES_VAULT_REF`, `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS`, `STRIPE_INVOICE_REQUIRES_TAX_CALCULATION`, `DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE`, `DIAN_REJECTION_CREATES_P1_TASK`, `PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY`, `BILLING_CORRECTION_REQUIRES_APPROVAL` (7 total) | 01/02/03/04/05 (define), 06 (verify) | migrations 118-122 ; closeout `db-trigger-pack-verification.test.js` |
| Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline on `saas_billing_corrections.offer_details` | 05 | `lib/markos/saas/billing/corrections/correction.ts` ; `test/saas-215/domain-5/save-offer-pricing-sentinel.test.js` |
| DIAN wizard 6-state literals verbatim (`pending`, `nit_registered`, `certificate_uploaded`, `test_invoice_sent`, `test_invoice_accepted`, `production_ready`) | 03 | `lib/markos/saas/billing/co/dian-wizard.ts` `WIZARD_STATES` array + migration 120 CHECK clause on `saas_dian_config.wizard_state` ; `test/saas-215/domain-3/dian-wizard-state-machine.test.js` |
| 5 `correction_type` literals (`refund`, `credit_note`, `write_off`, `discount`, `invoice_correction`) | 05 | `lib/markos/saas/billing/corrections/contracts.ts` `CORRECTION_TYPES` + migration 122 CHECK clause ; `test/saas-215/domain-5/correction-shape.test.js` |
| 6th handoff_kind literal `billing_correction_approval` extends P207 4-set + P214 5th to canonical 6-literal chain | 05 | `lib/markos/saas/billing/corrections/correction.ts` `buildApprovalPackage` invocation ; `test/saas-215/domain-5/correction-approval-trigger.test.js` |
| Banned-lexicon zero-match on F-{271..286} contract YAMLs + handoff doc + log-redaction.ts (B-8 enforcement) | 01-06 | `scripts/marketing-loop/check-banned-lexicon.mjs` ; closeout `architecture-lock-rerun.test.js` |
| `saas_billing_events.event_type` accepts literal `credential_view` for B-5 audit-log of credential views | 01 | migration 118 `saas_billing_events` event_type column shape ; `test/saas-215/domain-1/billing-event-shape.test.js` |
| Architecture-lock 4 forbidden tokens (`secret_key`, `webhook_secret`, `oauth_token`, `pkcs12_password`) absent from `app/(markos)/**/*.{tsx,module.css}` | 01 (pre-stage), 06 (verify) | architecture-lock test ; closeout `architecture-lock-rerun.test.js` (currently zero `app/(markos)/` files; gate becomes load-bearing in P217+ wizards) |

### Sensitive Credential UI Binding Contract (B-1..B-8 — load-bearing for future surfaces)

| Binding | Substrate plan | Future-surface enforcement (P217+ admin extensions) |
|---------|----------------|-----------------------------------------------------|
| **B-1.** Allowed display fields (vault_ref, processor_name, last_used_at, is_active, created_at, updated_at, environment); NEVER credential_value, secret_key, webhook_secret, oauth_token, pkcs12_password, authorization_token, software_pin | 01 (substrate) ; 02/03 (per-processor RE-application) | `<StripeQBOConfigWizard>` / `<MercadoPagoSiigoConfigWizard>` / `<DianWizard>` MUST honor allowed-display whitelist |
| **B-2.** `vault_ref` chip rendering via `<.c-chip-protocol>` (D-09 mint-as-text) | 01 (substrate) | future credential-display surfaces render `<VaultRefChip>` (D-15 selective extraction) |
| **B-3.** PII-field redaction `[redacted]` placeholder via `.c-code-inline` + `--color-on-surface-subtle` | 01 (5 PII-field-list constants) ; 02/03/04 (consume) | future invoice viewer / payment-attempt timeline / DLQ inspector renders `[redacted]` placeholder for fields in PII lists |
| **B-4.** Clipboard copy block on credential displays | 01 (substrate) ; 02/03 (POST handler enforcement) | future `<CredentialBlock>` exposes `onCopy` interceptor; clipboard.writeText never invoked on credential block |
| **B-5.** Audit-log every credential view via `saas_billing_events.event_type=='credential_view'` server-side | 01 | future credential-display API handlers emit `INSERT INTO saas_billing_events` row per metadata fetch |
| **B-6.** No raw credential round-trip — POST handler stores plaintext via `storeCredentialVaultRef` immediately, response NEVER echoes plaintext | 01 (substrate) ; 02/03 (per-processor POST handler enforcement) | `api/v1/saas/billing/{us-config,co-config,dian-wizard}.js` response schema = `{success, vault_ref, ...}` only |
| **B-7.** DIAN wizard certificate-upload destructive modal contract — verbatim copy `[block] DIAN credentials cannot be edited after upload — only revoked and re-uploaded with a fresh certificate` + `Upload and seal credentials` + `Cancel — keep wizard at certificate step` | 03 (substrate — multipart parser server-side) | future P217+ `<DianWizard>` step `certificate_upload` renders `<.c-modal>` with verbatim copy strings |
| **B-8.** Banned-lexicon zero-match on doctrine prose + 5 redaction strings (`'[REDACTED]'` literal) | 01 (define) | CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `lib/markos/saas/billing/log-redaction.ts` + F-{271..286} YAMLs + `docs/billing-handoff/215-future-payout-policies.md` ; zero exclamation points |

### Translation gate dissolution / opening

| Gate | Direction | Plan | Substrate enables |
|------|-----------|------|-------------------|
| **214 `billing_charge_approval` extends to 6th `billing_correction_approval` handoff_kind literal** | DISSOLVED | 05 | P208 Approval Inbox renders 6 filter chips; `<RefundCreditNoteApprovalModal>` extends P208-04 |
| **208 Recovery Center connector_placeholder family extends with webhook DLQ inspector** | DISSOLVED | 04 | future P208-05 `<WebhookDLQInspector>` reads `markos_webhook_deliveries` rows where `dlq_at IS NOT NULL AND processor IN ('stripe','mercado_pago','quickbooks','siigo','dian')` |
| **213-04 §Public-Proof Boundary — 215 evidence packs PRIVATE doctrine** | DISSOLVED | 05 | future case-study editor surfaces enforce `evidence_pack_ref` UUID citation via `<.c-chip-protocol>` only; banned-phrases contract carries forward |
| **future_phase_217_dian_wizard_ui** | OPENED | 03 | `<DianWizard>` 6-step UI consumes `advanceWizardState`; B-7 destructive modal contract |
| **future_phase_217_billing_setup_wizards** | OPENED | 02, 03 | `<StripeQBOConfigWizard>` + `<MercadoPagoSiigoConfigWizard>` consume POST handlers (B-1/B-4/B-6) |
| **future_phase_218_payout_dispatch** | OPENED | 06 | `saas_future_payout_policies` 4 seed rows `planned_only=true`; P218 Plan 05 / P220 Plan 01 / P220 Plan 05 UPDATE flag |
| **future_phase_220_growth_payout_console** | OPENED | 06 | growth admin payout management surface composes referral / affiliate / partner / incentive payout queues over 215-06 reservation seed; mutation-class `billing.charge` + `default_approval_mode==dual_approval` above threshold |

### Downstream UI inheritance citations (14 future surfaces)

| # | Future surface | Owning future phase | Substrate plan | Mutation-class binding |
|---|----------------|---------------------|----------------|------------------------|
| 1 | SaaS billing reconciliation queue | P208 admin (P217+) | 01 | `data.export` |
| 2 | DIAN setup wizard 6-step UI | P217+ admin | 03 | `data.export` (B-7 destructive modal copy) |
| 3 | Stripe / QBO config wizard | P217+ admin | 02 | n/a (config) |
| 4 | Mercado Pago / Siigo config wizard | P217+ admin | 03 | n/a |
| 5 | Invoice viewer with PII redaction | P213.3 extension | 01 + 02/03 | `data.export` |
| 6 | Payment attempt timeline | P208 admin (P217+) | 02 + 04 | n/a (read-only) |
| 7 | Webhook DLQ inspector | P208-05 extension | 04 | `connector.mutate` |
| 8 | Dunning state timeline viewer | P208 admin (P217+) | 05 | `billing.charge` + `data.export` |
| 9 | Refund / credit-note approval modal | P208-04 extension | 05 | `billing.charge` (`dual_approval` above threshold) |
| 10 | Evidence pack browser | P208 admin / P209 | 05 | `data.export` (213-04 public-proof boundary) |
| 11 | DIAN rejection P1 task viewer | existing P208-03 Task Board | 03 | `connector.mutate` (NO placeholder needed) |
| 12 | Future payout policy preview | P218 / P220 admin | 06 | `billing.charge` (`dual_approval` above threshold) |
| 13 | Tax calculation audit log (US admin) | P217+ admin | 02 | `data.export` |
| 14 | Colombian tax breakdown viewer (CO admin) | P217+ admin | 03 | `data.export` |

### 213.4 Carry-Forward (D-08..D-15) per UI-SPEC §Inheritance Bindings

| Decision | Future-surface enforcement |
|----------|------------------------------|
| **D-08** token-only | All future 215-consuming surfaces use `var(--*)` only ; zero hex literals ; closeout grep gate (load-bearing in P217+) |
| **D-09** mint-as-text | `[ok]` glyph + action-link inline CTAs + `.c-chip-protocol` IDs (`vault_ref`, `correction_id`, `dunning_schedule_id`, `cufe`, `dian_provider_response_id`, etc.) use `--color-primary-text` |
| **D-09b** `.c-notice` mandatory | Every gating state (credentials-not-configured, DIAN-wizard-pending, dunning-paused, correction-approval-pending, evidence-pack-missing, future-phase-{217,218,220}-placeholder) composes `<.c-notice c-notice--{state}>` |
| **D-13** `.c-card--feature` reserved | Billing reconciliation rows / DIAN wizard step cards / config wizard step cards / correction modals / dunning timeline rows / evidence-pack browser rows / DLQ inspector rows ALL use `.c-card` default |
| **D-14** no `.c-table` primitive | All future 215 invoice / payment-attempt / billing-event / correction / dunning / DLQ / future-payout lists use vanilla `<table>` + `.c-badge--{state}` |
| **D-15** selective extraction | Recommended: `<BillingCorrectionRow>` (Approval Inbox + correction queue + evidence browser) ; `<WebhookDLQRow>` (Recovery Center + admin DLQ inspector) ; `<DianWizardStep>` (setup wizard + audit timeline) ; `<VaultRefChip>` + `<CredentialBlock>` (B-2 + B-4) |

### Cross-cutting doctrine binding (5 parent UI-SPECs)

| Parent UI-SPEC | Binding inherited by 215 substrate |
|----------------|-------------------------------------|
| **206-UI-SPEC §Mutation-class doctrine** | `billing.charge` for 5 correction_type literals (Plan 05) ; `data.export` for evidence-pack export + audit-log export (Plan 05) ; `default_approval_mode==dual_approval` for refunds above threshold + write_off + discount (Plan 05) ; autonomy ceiling on `billing.charge` (future surface enforcement) |
| **207-UI-SPEC §Orchestration substrate** | `RunApiEnvelope` (`run_id`, `agent_run_id`, `chain_id`) linked to billing-correction runs (Plan 05) + webhook-routed runs (Plan 04) ; `AgentRunEventType` literals (`webhook_received`, `signature_verified`, `idempotency_check`, `dispatch_to_handler`, `handler_completed`, `dlq_enqueued`) emitted by Plan 04 ; `ApprovalHandoffRecord` (`handoff_kind == 'billing_correction_approval'` 6th literal) emitted by Plan 05 |
| **208-UI-SPEC §Approval Inbox + Recovery Center + Task Board** | 6 filter chips on Approval Inbox (`approval`, `recovery`, `follow_up`, `manual_input`, `billing_charge_approval`, `billing_correction_approval`) ; Recovery Center webhook DLQ inspector extension (Plan 04) ; Task Board renders DIAN P1 tasks created by 215-03 DIAN_REJECTION_CREATES_P1_TASK (24h SLA, P1 priority) |
| **213-UI-SPEC §Tenant 0 readiness gate** | 213-04 §Public-Proof Boundary applies — 215 evidence packs are PRIVATE doctrine ; banned-phrases contract carries forward ; 213-05 go/no-go gate flips green before any 215 surface ships in production (UI-only requirement; backend ships unconditionally) |
| **214-UI-SPEC §SaaS Suite Activation** | `saas_invoices.subscription_id` FK to 214 `saas_subscriptions.subscription_id` ; subscription lifecycle events trigger 215 billing ; `business_type != 'saas'` gating contract inherited by future 215 admin surfaces ; `<SaaSSubscriptionsTable />` (214-06 D-15 selective extraction) is the canonical downstream consumer of 215 invoice / payment / billing-event surfaces |

### Per-task coverage map (UI-SPEC ACs by plan)

| Plan | UI-SPEC §section bound | UI-SPEC AC# | Backend AC verifying file/test |
|------|-------------------------|-------------|--------------------------------|
| 01 | §Sensitive Credential Handling B-1..B-8 substrate ; §Inheritance Bindings 5-layer defense ; §Downstream rows 3, 4, 5, 6 | AC-1, AC-5, AC-7, AC-8 | `test/saas-215/preflight/credential-sanitization.test.js` ; `test/saas-215/domain-1/credential-vault-trigger.test.js` ; `test/saas-215/domain-1/log-redaction.test.js` ; `test/saas-215/domain-1/mcp-credential-sanitize.test.js` |
| 02 | §Downstream rows 3, 6, 13 ; B-1/B-3/B-4/B-6 RE-applied to 5 US ENUMs ; §Translation Gate `future_phase_217_billing_setup_wizards` | AC-4 | `test/saas-215/domain-2/credential-vault-trigger-stripe.test.js` ; `test/saas-215/domain-2/mcp-credential-sanitize-stripe.test.js` ; `test/saas-215/domain-2/log-redaction-stripe.test.js` ; `test/saas-215/domain-2/stripe-invoice-tax-trigger.test.js` |
| 03 | §Downstream rows 2, 4, 14 ; B-1/B-3/B-4/B-6/B-7 RE-applied to 6 CO ENUMs ; §Translation Gates `future_phase_217_dian_wizard_ui` + `future_phase_217_billing_setup_wizards` | AC-3, AC-4 | `test/saas-215/domain-3/credential-vault-trigger-co.test.js` ; `test/saas-215/domain-3/dian-wizard-state-machine.test.js` ; `test/saas-215/domain-3/cufe-calculation.test.js` ; `test/saas-215/domain-3/dian-rejection-task.test.js` |
| 04 | §Downstream row 7 webhook DLQ inspector ; §Translation Gate Dissolution row 2 (208 Recovery Center connector_placeholder family extension) | AC-3 | `test/saas-215/domain-4/webhook-payload-redaction.test.js` ; `test/saas-215/domain-4/dispatcher-handlers-map.test.js` ; `test/saas-215/domain-4/webhook-dlq-routing.test.js` |
| 05 | §Downstream rows 8, 9, 10 ; §Translation Gate Dissolution row 1 (`billing_correction_approval` 6th literal) ; §Inheritance §From 213-UI-SPEC §Public-Proof Boundary | AC-3 | `test/saas-215/domain-5/correction-approval-trigger.test.js` ; `test/saas-215/domain-5/evidence-pack-creation.test.js` ; `test/saas-215/domain-5/save-offer-pricing-sentinel.test.js` |
| 06 | §Translation Gates Opened (4 gates) ; §Downstream row 12 future payout policy preview | AC-2, AC-4, AC-6, AC-7 | `test/saas-215/domain-6/closeout/translation-gate.test.js` ; `test/saas-215/domain-6/closeout/db-trigger-pack-verification.test.js` ; `test/saas-215/domain-6/closeout/dispatcher-handlers-mcp-tools-map.test.js` ; `test/saas-215/domain-6/closeout/architecture-lock-rerun.test.js` |

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
