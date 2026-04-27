# Phase 215: SaaS Billing, Payments, and Multi-Country Compliance — Research

**Researched:** 2026-04-26
**Domain:** SaaS Suite — multi-country billing engine, payment processors (Stripe/Mercado Pago), accounting sync (QuickBooks/Siigo), DIAN electronic invoicing, processor webhook routing reuse, billing approvals/corrections/dunning, future incentive payout hooks
**Confidence:** HIGH for codebase-grounded claims and canon-derived schema shapes (VERIFIED on disk), HIGH for architecture-lock (VERIFIED on disk), HIGH for F-ID/migration slot sequencing (FREE slots confirmed 118+), HIGH for compliance enforcement boundaries (6+1 DB-triggers derived from CONTEXT non-negotiables + REVIEWS.md), MEDIUM for DIAN CUFE formula and XAdES-B signing specifics (canon-documented; provider sandbox flow requires execution validation), LOW for Siigo/Alegra exact API field names in v4.1.0 sandbox (third-party API — must validate in execution)
**Replaces:** 68-line stub with 2026-04-23 codebase addendum (addendum content preserved and expanded below)

---

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support | Owns / Integrates |
|----|------------------------------------------------|------------------|-------------------|
| SAS-04 | SaaS plan prices, packages, discounts, value metrics, and save offers consume Pricing Engine-approved recommendations or use `{{MARKOS_PRICING_ENGINE_PENDING}}` | §7 Domain 1 — `saas_invoices.pricing_recommendation_id` FK or sentinel; Plans 01+05 enforce at DB-trigger level | OWNS (billing FK to Pricing Engine) |
| SAS-05 | SaaS Billing Engine supports invoices, payment attempts, failed-payment recovery, refunds, credits, dunning, processor routing, accounting sync, and approval-gated corrections | §7 Domains 1–5 — full billing engine implementation across Plans 01–05 | OWNS |
| SAS-06 | Launch-country compliance covers US Stripe/Tax/QuickBooks and Colombia Mercado Pago/DIAN/Siigo/Alegra, including DIAN rejection P1 tasks | §7 Domains 2–3 — US path (Plan 02) + Colombia path (Plan 03) | OWNS |
| BILL-01 | Billing usage, ledger, invoice, and entitlement surfaces reconcile usage with evidence | §7 Domain 1 — `saas_invoices` + `saas_payment_attempts` + `saas_billing_events` reconcile with P214 subscription state | OWNS (billing invoice layer; integrates existing billing_usage_ledger_rows from migration 54) |
| COMP-01 | SOC2 Type I foundation covers real v2 agentic, pricing, connector, evidence, and learning risk profile | §7 Domain 5 — billing approvals + corrections evidence packs; `BILLING_CORRECTION_REQUIRES_APPROVAL` DB-trigger; co-owns with P206 (SOC2 baseline owns) | co_owns_with: [P206] |
| QA-01..15 | Phase 200 Quality Baseline gates apply to all active and reserved phases | §10 Validation Architecture — per-domain test strategy across all 6 plans | OWNS (cross-domain) |
| PRC-01..09 | Pricing Engine substrate (P205 OWNS) | P215 invoices REFERENCE `pricing_recommendations.pricing_recommendation_id` FK or use sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}`; P215 does NOT define PRC contracts | integrates_with: [PRC-01..09 from P205] |
| WHK-01 | Webhook subscription engine remains durable (P203 OWNS) | P215 reuses P203 substrate — processor events route through existing engine guarantees; P215 does NOT redefine WHK contracts | integrates_with: [WHK-01 from P203] |
| SG-04, SG-06, SG-11, SG-12, PRC-09 (in Plan 06) | Future growth/incentive payout motions (P218/P219/P220 OWN) | Plan 06 documents reservation only — `saas_future_payout_policies` seeds with `planned_only=true`; zero payout agents runnable=true | translation_gate_for: [P218, P219, P220] |

**BILL-01 ownership note:** REQUIREMENTS.md maps `BILL-01 | Phase 215` (implied by SaaS billing invoice surface). Existing billing usage/ledger tables (migration 54) are the substrate; P215 adds the invoice and payment layers on top. `BILL-02` (pricing copy) is P205-primary. P215 Plan 01 `integrates_with: [BILL-02 from P205]`.

**COMP-01 ownership note:** REQUIREMENTS.md line 215 maps `COMP-01 | Phase 206`. P215 co-owns the billing compliance slice of SOC2 evidence (invoice issuance + correction evidence packs), but does NOT redefine the SOC2 baseline. P215 Plan 05 `co_owns_with: [COMP-01 from P206]`.

**PRC-01..09 ownership note:** ROADMAP line 315 lists PRC-01..09 in P215 requirements. This is incorrect — REQUIREMENTS.md line 214 explicitly maps `PRC-01..09, BILL-02 | Phase 205`. P215 Plans 01–05 must NOT list PRC-01..09 in `requirements:` frontmatter. Instead: `integrates_with: [PRC-01..09 from P205]`. P215 invoices reference a `pricing_recommendation_id` FK or sentinel.

**SG-04/SG-06/SG-11/SG-12/PRC-09 in Plan 06 note:** These are owned by P218–P220. Plan 06 frontmatter: `requirements: [QA-01..15]; translation_gate_for: [P218, P219, P220]`. Plan 06 does NOT activate any growth module; it reserves compliant hooks.
</phase_requirements>

---

## Executive Summary

Phase 215 is the **billing and compliance foundation** of the entire v4.1.0 SaaS milestone. It is the upstream gate for P216 (billing health dimension), P217 (MRR revenue intelligence from `saas_invoices`), P218 (failed-payment in-app campaign triggers), P219 (MRR uptick expansion signal), and P220 (future incentive payout hooks). Without P215, none of these phases can fulfill their billing-dependent requirements.

The phase covers six distinct implementation domains across six plan clusters: (1) `SaaSInvoice` + `SaaSPaymentAttempt` + `SaaSBillingEvent` contracts with Wave 0.5 architecture-lock and upstream-gate, (2) US path (Stripe Billing + Stripe Tax + QuickBooks), (3) Colombia path (Mercado Pago + DIAN via Siigo + `SaaSDianConfig`), (4) processor webhook routing through the existing P203 webhook engine, (5) billing approvals, corrections, dunning, and SOC2 evidence, and (6) future incentive payout compliance hooks (planned-only; translation gate for P218/P219/P220).

**Two architectural risks distinguish P215 from neighboring SaaS Suite phases:**

First, P215 is a HIGH-RISK phase on two dimensions simultaneously. The multi-country compliance scope (US sales tax + Colombia DIAN electronic invoicing + IVA/retefuente/reteIVA/reteICA) means legal billing failures create P1 tasks with 24-hour SLA windows. Credential security (Stripe API keys + Mercado Pago access tokens + DIAN PKCS12 certificates + QuickBooks OAuth tokens + Siigo API keys) means a single credential leak can breach SOC2, GDPR, and DIAN compliance simultaneously. Both risks require defense-in-depth: DB-trigger `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` blocks plaintext credential inserts at the database level, MCP tool sanitization strips credential fields from output, and log redaction middleware scrubs processor webhook payloads.

Second, P215 faces the **Q-7 SLOT ORDERING CRISIS** (mirror of P216 Q-6): P215 executes BEFORE P216–P220 in dependency order (all five downstream phases hard-depend on P215 tables), but all migration slots upstream of 118 are occupied. P215 must use slots 118–123 (latest among V4.1.0 reservations). This is safe because slot ordering is cosmetic — the `assertUpstreamReady` preflight in Plan 215-01 is the execution-dependency gate. P216 through P220 assertUpstreamReady checks confirm P215 tables exist before proceeding. P215 does NOT FK into any P216–P220 table; the FK direction is strictly P216–P220 read P215 at runtime.

**Critical codebase addendum (preserved from 2026-04-23, expanded):** The P203 webhook engine exists on disk and is fully operational (`lib/markos/webhooks/engine.cjs`, `signing.cjs`, `dlq.cjs`, `replay.cjs`, `breaker.cjs`, `rate-limit.cjs`, `metrics.cjs` — all VERIFIED). P215 Plan 04 REUSES this engine without modification. Existing billing tables (`billing_usage_ledger_rows`, `billing_invoice_projections`, `tenant_billing_subscriptions` — migration 54) are the substrate P215 builds on. The pgcrypto extension is already loaded (migration 76 CLI env encryption pattern). Supabase Vault is not yet in use but is available via the hosted Supabase project's pgsodium/Vault APIs. No Stripe live-processor integration exists (only `stripe-sync.ts` data-shaping types). No Mercado Pago, QuickBooks, Siigo, Alegra, or DIAN integration exists.

**Primary recommendation:** Ship P215 as six plan clusters. Plan 01 is the architectural anchor (ships `assertUpstreamReady`, architecture-lock test, `saas_invoices` + `saas_payment_attempts` + `saas_billing_events` + `saas_credential_vault_refs` tables, and V4.1.0-MIGRATION-SLOT-COORDINATION.md CREATE-OR-APPEND). Plan 02 and Plan 03 ship the processor + accounting + compliance paths behind the credential vault pattern established in Plan 01. Plan 04 reuses the P203 engine without modification. Plan 05 ships billing approvals and SOC2 evidence packs. Plan 06 closes the phase with the future payout reservation and full-phase closeout regression.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (Non-Negotiables, verbatim from 215-CONTEXT.md)

1. No processor webhook bypasses webhook engine durability, signing, replay, DLQ, rate limit, and observability.
2. No legal invoice issuance without country-specific compliance validation.
3. No raw certificates, API keys, or webhook secrets in logs, prompts, tasks, or MCP payloads.
4. No discount or save-offer logic bypasses Pricing Engine ownership.
5. No referral, affiliate, partner, or incentive payout bypasses Pricing Engine, billing compliance, approval, audit, and tax/legal posture.

### Claude's Discretion (per DISCUSS.md Decision Matrix + REVIEWS.md guidance)

- US processor: Stripe Billing direct behind MarkOS processor config (DISCUSS decision — confirmed)
- Colombia processor: Mercado Pago direct + provider abstraction layer (Q-8 recommendation)
- DIAN path: Siigo first for v4.1.0; Alegra deferred to v4.2.0 (Q-6 recommendation per canon "Siigo/Alegra first" preference)
- Accounting sync: QuickBooks for US, Siigo for Colombia (v4.1.0)
- Webhook path: Reuse P203 webhook engine; allocate fresh contract IDs for processor-specific endpoints
- Sensitive credential storage: Supabase Vault vault-ref pattern (Q-9 recommendation); pgcrypto column fallback for fields not yet vault-supported
- Migration slot combination strategy within 118-123 (multi-table per slot acceptable)
- DB-trigger compliance: 6 active triggers + 1 cross-domain credential trigger (REVIEWS.md RM-3 prescription)
- Plan 06 autonomous=true (planned-only; no first-tenant payout activation in P215)
- DIAN rejection P1 task SLA: 24-hour response window (canon default)
- F-ID range: F-271..F-285 (15 IDs for 15 contracts across 6 domains)

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of any webhook handler or billing endpoint — kept on legacy `api/*.js` (architecture-lock)
- Alegra integration for Colombia — v4.2.0 (Siigo ships first per Q-6 decision)
- Direct DIAN transmission (tenant's own DIAN habilitación) — v4.2.0; Siigo handles DIAN at launch
- Stripe LATAM as Colombia fallback — reserved in processor abstraction; not activated in v4.1.0
- Stripe Connect for MarkOS-as-billing-layer scenario — post v4.1.0
- TaxJar/Avalara as US tax alternatives — Stripe Tax first; alternatives deferred
- Multi-country beyond US + Colombia (EU VAT, UK, etc.) — post v4.1.0
- Stripe Customer Portal self-service embed — deferred; approval-gated correction workflow covers v4.1.0 needs
- Active payout dispatch for referral/affiliate/partner/incentive — Plan 06 reservation ONLY
- DIAN sandbox-to-production cutover runbook — v4.2.0 ops runbook (REVIEWS.md LOW concern)
</user_constraints>

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions. Any plan that contradicts these must stop and flag.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Suite Canon.md` defines `SaaSInvoice`, `SaaSProcessorConfig`, `SaaSAccountingConfig`, `SaaSDianConfig` object shapes, compliance requirements, and billing non-negotiables. P215 schema MUST match this canon. [VERIFIED: SaaS Suite Canon.md read 2026-04-26]
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` line 49 defines `SaaSInvoice` as "SaaS invoice and legal billing record: processor status, taxes, credits, accounting sync, US/Colombia compliance fields." P215 column shapes MUST match the v2 spec. [VERIFIED: spec read 2026-04-26]
3. **Engineering execution state wins:** `.planning/STATE.md` shows Phase 204 active; P215 plans MUST NOT execute before P203, P205, P206, and P214 land.
4. **Drift rule:** If P215 plans define schema that contradicts vault brain/reference, STOP and flag.

### Placeholder rule (MUST)

`{{MARKOS_PRICING_ENGINE_PENDING}}` is required wherever `saas_invoices.pricing_recommendation_id` is NULL and no approved `PricingRecommendation` exists (Plan 01 sentinel pattern). Plans 05 dunning save-offer `offer_details` uses this sentinel until P205 lands.

### CLI / tests (MUST)

- Run tests with `npm test` or `node --test test/**/*.test.js` — NO vitest, NO playwright. [VERIFIED: package.json]
- Test files: `.test.js` extension and `node:test` + `node:assert/strict` imports.
- Test fixtures: `.js` (NOT `.ts`). Test directory: `test/saas-215/<domain>/`.

---

## Phase Scope: 6 Domains

| Plan | Domain | Key Objects Created | Requirements Owned |
|------|--------|--------------------|---------------------|
| 215-01 | SaaSInvoice + SaaSPaymentAttempt + SaaSBillingEvent contracts + Wave 0.5 | `saas_invoices`, `saas_payment_attempts`, `saas_billing_events`, `saas_credential_vault_refs` | SAS-04, SAS-05, BILL-01, QA-01..15; integrates_with: [PRC-01..09 from P205, WHK-01 from P203] |
| 215-02 | US path: Stripe Billing + Stripe Tax + QuickBooks | `saas_processor_configs` (Stripe row), `saas_accounting_configs` (QuickBooks row) | SAS-05, SAS-06, QA-01..15; integrates_with: [PRC-01..09 from P205] |
| 215-03 | Colombia path: Mercado Pago + Siigo + DIAN setup wizard | `saas_processor_configs` (Mercado Pago row), `saas_accounting_configs` (Siigo row), `saas_dian_config` | SAS-06, QA-01..15 |
| 215-04 | Processor webhook routing through existing P203 engine | No new tables (reuses P203 substrate); new webhook endpoint contracts | SAS-05, WHK-01 (integrates), QA-01..15; integrates_with: [WHK-01 from P203] |
| 215-05 | Billing approvals + corrections + dunning + evidence | `saas_billing_corrections`, `saas_dunning_schedules` | SAS-05, COMP-01 (co_owns_with P206), QA-01..15; integrates_with: [TASK-01..05 from P208, EVD-01..06 from P209] |
| 215-06 | Future incentive payout compliance hooks (planned-only) | `saas_future_payout_policies` (planned_only=true seed) | QA-01..15; translation_gate_for: [P218, P219, P220] |

---

## Architecture Lock

This section MUST be verified in Plan 215-01 Task 0.5 (Wave 0.5 — first task in Wave 1 matching P216/P217/P218/P219/P220 pattern).

### Pin Table

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/v1/saas/billing.js`, `api/v1/saas/invoices.js`, `api/v1/saas/webhooks/stripe.js`, `api/v1/saas/webhooks/mercadopago.js`, `api/v1/saas/webhooks/quickbooks.js`, `api/v1/saas/webhooks/siigo.js`, `api/v1/saas/webhooks/dian.js` | `api/v1/saas/` created by P216 Plan 01 or P215 Plan 01 (CREATE-or-APPEND; P215 executes first) [VERIFIED: api/v1/ does NOT exist yet — Plan 01 creates it] |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| OpenAPI registry | `contracts/openapi.json` | Filesystem confirmed [VERIFIED: codebase] |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS) | Filesystem confirmed [VERIFIED: codebase] |
| MCP billing tools | `lib/markos/mcp/tools/saas-billing.cjs` (NEW — shipped by P215 Plan 01; also handles credential sanitization) | Does NOT exist yet; Plan 01 creates [VERIFIED: not found] |
| Test runner | `npm test` → `node --test test/**/*.test.js` | package.json [VERIFIED: codebase] |
| Test imports | `node:test` + `node:assert/strict` | Architecture-lock carry-forward P216–P228 |
| Test extension | `*.test.js` (NOT `.test.ts`) | Architecture-lock carry-forward |
| Test directory | `test/saas-215/<domain>/` (domain-1 through domain-6) | Mirrors `test/saas-216/`, `test/saas-217/` etc. |
| Cron auth | `x-markos-cron-secret` header matching `MARKOS_SAAS_CRON_SECRET` env | `api/cron/mcp-kpi-digest.js` pattern [VERIFIED: codebase] |
| Audit emit | `lib/markos/audit/*` (SHA-256 hash chain per migration 82) | Filesystem [VERIFIED: codebase] |
| Tombstone | `lib/markos/governance/*` deletion workflow (migration 56) | Filesystem [VERIFIED: codebase] |
| Webhook engine | `lib/markos/webhooks/engine.cjs` + `signing.cjs` + `dlq.cjs` + `replay.cjs` + `breaker.cjs` + `rate-limit.cjs` (REUSE — do NOT greenfield) | Filesystem [VERIFIED: codebase — all files present] |
| DB-trigger auth | `BEFORE INSERT OR UPDATE` triggers per domain (6 named triggers + 1 cross-domain credential trigger) | P226 RH5/RH6 lesson; mirror P216–P220 pattern |
| App Router | `app/(markos)/saas/*` pages for billing UI — existing App Router pattern | HTTP Layer + existing `app/(markos)/` layout [VERIFIED: codebase] |
| Credential storage | Supabase Vault ref pattern (`vault://...`) in `saas_credential_vault_refs`; pgcrypto fallback for fields not yet vault-supported | Migration 76 pgcrypto pattern + Supabase hosted Vault [VERIFIED: pgcrypto available] |

### Helper File Presence Verification Table

| File | Function | Status | Line |
|------|----------|--------|------|
| `onboarding/backend/runtime-context.cjs` | `requireHostedSupabaseAuth(...)` | EXISTS [VERIFIED] | 491 |
| `onboarding/backend/runtime-context.cjs` | `module.exports = { requireHostedSupabaseAuth, ... }` | EXISTS [VERIFIED] | 1014 |
| `lib/markos/crm/agent-actions.ts` | `function buildApprovalPackage(input)` | EXISTS [VERIFIED] | 68 |
| `lib/markos/crm/agent-actions.ts` | `module.exports = { buildApprovalPackage, ... }` | EXISTS [VERIFIED] | 133 |
| `lib/markos/plugins/registry.js` | `resolvePlugin(registry, pluginId)` | EXISTS [VERIFIED] | 102 |
| `lib/markos/mcp/tools/index.cjs` | MCP tool family registry (CommonJS) | EXISTS [VERIFIED] | — |
| `contracts/openapi.json` | Active OpenAPI 3.1 spec | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/engine.cjs` | Webhook engine (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/signing.cjs` | HMAC signing + verify (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/dlq.cjs` | DLQ (7-day retention) (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/replay.cjs` | Replay + idempotency (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/breaker.cjs` | Circuit breaker (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/rate-limit.cjs` | Rate limit (REUSE) | EXISTS [VERIFIED] | — |
| `lib/markos/webhooks/metrics.cjs` | Observability (REUSE) | EXISTS [VERIFIED] | — |
| `api/v1/saas/billing.js` | `/v1/saas/billing` API handler | DOES NOT EXIST — Plan 01 creates | — |
| `api/v1/saas/invoices.js` | `/v1/saas/invoices` API handler | DOES NOT EXIST — Plan 01 creates | — |
| `api/v1/saas/webhooks/stripe.js` | Stripe webhook inbound handler | DOES NOT EXIST — Plan 02 creates | — |
| `api/v1/saas/webhooks/mercadopago.js` | Mercado Pago webhook inbound handler | DOES NOT EXIST — Plan 03 creates | — |
| `api/v1/saas/webhooks/quickbooks.js` | QuickBooks webhook inbound handler | DOES NOT EXIST — Plan 02 creates | — |
| `api/v1/saas/webhooks/siigo.js` | Siigo webhook/event handler | DOES NOT EXIST — Plan 03 creates | — |
| `api/v1/saas/webhooks/dian.js` | DIAN response event handler | DOES NOT EXIST — Plan 03 creates | — |
| `lib/markos/mcp/tools/saas-billing.cjs` | SaaS billing MCP tools + credential sanitization | DOES NOT EXIST — Plan 01 creates | — |
| `lib/markos/runtime-context.cjs` | (wrong path — do NOT reference) | NOT FOUND [VERIFIED] | Use `onboarding/backend/runtime-context.cjs` |

### Forbidden Patterns

Architecture-lock test asserts grep count = 0 across all P215 lib/api paths:

```text
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/saas/health/           (P216 ships this)
lib/markos/saas/revenue/          (P217 ships this)
lib/markos/profile/               (P218 ships this)
lib/markos/b2b/                   (P219 ships this)
lib/markos/referral/              (P220 ships this)
lib/markos/community/             (P220 ships this)
lib/markos/events/                (P220 ships this)
lib/markos/pr/                    (P220 ships this)
lib/markos/partnerships/          (P220 ships this)
lib/markos/sales/                 (P226 ships this)
lib/markos/cdp/                   (P221 ships this)
lib/markos/conversion/            (P224 ships this)
lib/markos/launches/              (P224 ships this)
lib/markos/analytics/             (P225 ships this)
lib/markos/channels/              (P223 ships this)
lib/markos/ecosystem/             (P227 ships this)
public/openapi.json
app/(saas)/
app/(growth)/
route.ts
vitest
playwright
openapi-generate
.test.ts
```

**Additional P215-specific forbidden patterns (credential security):**

```text
stripe_secret_key       (must never appear in log output or MCP response)
stripe_webhook_secret   (must never appear in log output or MCP response)
mercadopago_access_token (must never appear in log output or MCP response)
dian_pkcs12_password    (must NEVER appear anywhere outside Supabase Vault)
```

The architecture-lock test (`test/saas-215/preflight/architecture-lock.test.js`) ships in Plan 215-01 Task 0.5.

---

## Upstream Dependencies (assertUpstreamReady Gate)

### Hard Upstreams (P215 MUST fail preflight if these tables are missing)

| Phase | Table(s) to Check | Why P215 Needs It | Hard / Soft |
|-------|------------------|-------------------|-------------|
| P203 | `markos_webhook_subscriptions`, `markos_webhook_deliveries` | Webhook engine substrate — Plan 04 processor webhook routing REUSES P203 durability guarantees (signing, replay, DLQ, rate-limit, circuit-breaker, observability) | HARD |
| P205 | `pricing_recommendations` | Pricing Engine substrate — `saas_invoices.pricing_recommendation_id` FK or sentinel; `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS` trigger blocks insert without FK or sentinel | HARD |
| P206 | `governance_evidence_packs` | SOC2 evidence substrate — Plan 05 billing correction evidence packs link to `governance_evidence_packs` | HARD |
| P214 | `saas_suite_activations`, `saas_subscriptions` | SaaS Suite activation gate — `saas_invoices.subscription_id` FKs to `saas_subscriptions`; Plan 01 gated by SaaS Suite activation module configuration | HARD |

### Soft Upstreams (degrade gracefully)

| Phase | Why Optional | Fallback |
|-------|-------------|----------|
| P207 | CRM AgentRun substrate — DIAN rejection P1 task creation uses `markos_agent_runs` | Create task stub without agent-run ID if P207 absent; log `SOFT_MISSING: markos_agent_runs` |
| P208 | Approval substrate — `buildApprovalPackage` for billing corrections | If `agent_approval_packages` absent, billing corrections use local approval stub; P208 sync deferred |
| P209 | Evidence substrate — Plan 05 correction evidence packs link to `evidence_map_records` | If `evidence_map_records` absent, evidence refs stored as JSONB array; P209 sync deferred |
| P211 | Loop substrate — billing events feed loop measurement | Billing events stored; loop integration deferred until P211 lands |
| P212 | LRN substrate — dunning outcome writes to `ArtifactPerformanceLog` | Outcomes stored in `saas_dunning_schedules.outcome_jsonb`; P212 sync deferred |
| P213 | Tenant 0 | Not consumed by P215 |

### Preflight Script Pattern

```cjs
// scripts/preconditions/215-01-check-upstream.cjs
'use strict';
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_TABLES = [
  'markos_webhook_subscriptions',    // P203 HARD prereq — webhook engine
  'markos_webhook_deliveries',       // P203 HARD prereq — webhook delivery store
  'pricing_recommendations',         // P205 HARD prereq — Pricing Engine substrate
  'governance_evidence_packs',       // P206 HARD prereq — SOC2 evidence
  'saas_suite_activations',          // P214 HARD prereq — SaaS activation gate
  'saas_subscriptions',              // P214 HARD prereq — subscription FK target
];
const SOFT_TABLES = [
  'markos_agent_runs',               // P207 soft — DIAN P1 task creation
  'agent_approval_packages',         // P208 soft — billing correction approvals
  'evidence_map_records',            // P209 soft — correction evidence links
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P215). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — sentinel or stub)`);
    }
  }
  console.log('P215 upstream preflight: PASSED');
}
main().catch((e) => { console.error(e); process.exit(2); });
```

---

## F-ID and Migration Slot Allocation

### CRITICAL: Slot Inventory (Verified 2026-04-26)

[VERIFIED: `ls supabase/migrations/` + P217/P218/P219/P220 RESEARCH files]

| Slot Range | Owner | Status |
|------------|-------|--------|
| 37–64 | Various existing foundation migrations | OCCUPIED |
| 70, 72–77, 81–89 | Existing webhook/CLI/org migrations | OCCUPIED |
| 90–95, 97 | RESERVED — P220 (locked in 220-01-PLAN.md) | RESERVED |
| 96 | `96_neuro_literacy_metadata.sql` (existing) | OCCUPIED |
| 98–99 | RESERVED — P217 (locked in 217-RESEARCH.md) | RESERVED |
| 100 | `100_crm_schema_identity_graph_hardening.sql` (existing) | OCCUPIED |
| 101–106 | RESERVED — P218 (locked in 218-01-PLAN.md) | RESERVED |
| 107–111 | RESERVED — P219 (locked in 219-01-PLAN.md) | RESERVED |
| 112–117 | RESERVED — P216 (locked in 216-RESEARCH.md) | RESERVED |
| **118–123** | **UNOCCUPIED — P215 allocation (6 slots)** | **FREE** |
| 124+ | UNOCCUPIED | Available for P221+ |

### Q-7 SLOT ORDERING CRISIS — Resolution

**Problem:** P215 executes BEFORE P216–P220 in dependency order (P216 through P220 all HARD-depend on P215 tables: `saas_invoices`, `saas_payment_attempts`). But all migration slots from 82 through 117 are occupied or reserved. P215 cannot have a lower slot number than any of P216–P220 (P216 = 112–117, P217 = 98–99, P218 = 101–106, P219 = 107–111, P220 = 90–95+97).

**Resolution (same pattern as P216 Q-6):** P215 = slots 118–123 (LATEST among V4.1.0 reservations). Slot numbers are applied in ascending order by Supabase, so P215 slot 118 applies AFTER all P216–P220 migrations run. This means P215 tables (`saas_invoices`, `saas_payment_attempts`) are created AFTER all downstream phase migrations run.

**How this works without breaking P216–P220:** P216–P220 migration SQL does NOT include FK constraints referencing P215 tables. P216 at slot 112–117, P217 at slot 98–99, P218 at slot 101–106, P219 at slot 107–111, P220 at slot 90–95+97 — none of these create FK constraints INTO P215 tables in their migration files. These phases join P215 tables at RUNTIME (after P215 has been executed in real deployment), not at migration time.

**Execution order guarantee:** The `assertUpstreamReady` preflight in P216–P220 Plan 01 scripts checks that P215 tables (`saas_invoices`, `saas_payment_attempts`) exist before each phase executes. If P215 has not run, the downstream phase halts. The preflight is the dependency gate, not migration slot order.

**FK direction (CRITICAL — NEVER VIOLATE):**
- P216 `saas_health_scores.billing_signal` reads P215 `saas_payment_attempts` at runtime (billing health dimension)
- P216 `saas_health_scores` calculated billing sub-score reads P215 `saas_invoices` (payment status, dunning state)
- P217 `saas_mrr_snapshots` revenue cron reads P215 `saas_invoices` (recognized revenue, MRR waterfall)
- P218 `in_app_campaigns` trigger condition reads P215 `saas_payment_attempts` (failed-payment trigger)
- P218 `in_app_campaigns` upgrade context reads P215 `saas_invoices` (invoice history for upgrade prompt)
- P219 expansion-signal-scanner reads P215 `saas_invoices` (MRR uptick detection)
- P220 future payout hooks read P215 `saas_future_payout_policies` (Plan 06 reservation)
- **P215 DOES NOT have FKs INTO any P216/P217/P218/P219/P220 table**
- P216–P220 MAY add FK constraints referencing P215 tables ONLY in their own migration files

**V4.1.0-MIGRATION-SLOT-COORDINATION.md:** This file does NOT yet exist on disk (VERIFIED: not found). P215 Plan 01 Task 0.1 MUST CREATE it (since P215 executes before P216–P217 which also do CREATE-OR-APPEND). After P215 creates it, P216 Plan 01 APPENDs, then P217 Plan 01 APPENDs, etc.

P215's section in the doc:

```text
P215 reservation: slots 118-123 + F-IDs F-271..F-285
Execution order: P215 BEFORE P216/P217/P218/P219/P220
Slot order: P215 AFTER all other V4.1.0 phases (due to slot collision)
FK direction: P216/P217/P218/P219/P220 read P215 tables at runtime; P215 has NO FKs into P216-P220
Dependency gate: assertUpstreamReady in P216-P220 Plan 01 scripts
```

### F-ID Pre-Allocation Table

F-IDs already locked: P220=F-209..F-227; P219=F-228..F-237; P218=F-238..F-246; P217=F-247..F-258; P216=F-259..F-270. [VERIFIED: 217-RESEARCH.md, 218-01-PLAN.md, 219-RESEARCH.md, 220-RESEARCH.md, 216-RESEARCH.md]

**P215 takes F-271..F-285 (15 IDs).**

| Plan | Domain | Migration Slot | Table(s) Created | F-IDs | Downstream Consumers |
|------|--------|---------------|------------------|-------|----------------------|
| 215-01 | SaaSInvoice + SaaSPaymentAttempt + SaaSBillingEvent contracts | 118 | `saas_invoices`, `saas_payment_attempts`, `saas_billing_events` | F-271, F-272, F-273 | P216 HARD (billing health dimension); P217 HARD (MRR revenue cron); P218 HARD (failed-payment trigger); P219 HARD (expansion-signal-scanner) |
| 215-01 | Credential vault refs | 118 (combined with above) | `saas_credential_vault_refs` | F-274 | Plans 02/03/04 consume for all credential storage |
| 215-02 | Stripe processor config + QuickBooks accounting config (US path) | 119 | `saas_processor_configs` (Stripe row), `saas_accounting_configs` (QuickBooks row) | F-275, F-276 | P216 billing dimension; Plan 04 webhook routing |
| 215-03 | Mercado Pago processor config + Siigo accounting config + DIAN config (Colombia path) | 120 | `saas_processor_configs` (Mercado Pago row), `saas_accounting_configs` (Siigo row), `saas_dian_config` | F-277, F-278, F-279 | P216 billing dimension; Plan 04 webhook routing |
| 215-04 | Processor webhook routing (no new tables; new API contracts) | 121 (contract-only) | — (reuses P203 store) | F-280 | P216/P217/P218/P219 all read invoices that are updated via webhook |
| 215-05 | Billing corrections + dunning schedules | 122 | `saas_billing_corrections`, `saas_dunning_schedules` | F-281, F-282 | P216 billing health dimension reads dunning state |
| 215-06 | Future payout policies (planned-only) + closeout | 123 | `saas_future_payout_policies` (planned_only=true seed) | F-283 | P220 Plan 01/05 consumes payout hook reservation |
| 215-01 | `/v1/saas/invoices`, `/v1/saas/billing` API contracts | no new table | — | F-284 | P217 extends with `/v1/saas/revenue/*` |
| 215-04 | Processor webhook endpoint contracts (5 routes) | no new table | — | F-285 | P217 reuses webhook routing pattern |

**Total: 15 F-IDs (F-271..F-285). 6 migration slots (118-123).**

---

## Per-Domain Deep Dive

### Domain 1: SaaSInvoice + SaaSPaymentAttempt + SaaSBillingEvent Contracts (Plan 215-01)

**Requirements:** SAS-04, SAS-05, BILL-01, QA-01..15; integrates_with: [PRC-01..09 from P205, WHK-01 from P203]

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` §Core Objects + §Billing and Compliance; `obsidian/work/incoming/16-SAAS-SUITE.md` Part 2. [VERIFIED: both read 2026-04-26]

#### `saas_invoices` Table Schema

The authoritative column definition the planner MUST replicate (downstream phases P216/P217/P218/P219 lock on these columns):

```sql
-- Migration: 118_saas_billing_payments_compliance.sql (combined)
CREATE TABLE saas_invoices (
  invoice_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     uuid NOT NULL REFERENCES markos_orgs(org_id),
  subscription_id               uuid NOT NULL,   -- FK to saas_subscriptions (P214)
  customer_id                   uuid NOT NULL,   -- FK to CRM customers (P207 substrate)

  -- Identity
  invoice_number                text NOT NULL,   -- human-readable: INV-2026-00847
  invoice_number_legal          text,            -- CUFE (CO) | sequential legal number (US)
  invoice_type                  text NOT NULL CHECK (invoice_type IN (
    'subscription', 'one_time', 'credit_note', 'void', 'prorated'
  )),
  status                        text NOT NULL CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible', 'past_due'
  )),

  -- Pricing Engine FK (SAS-04 + INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS trigger)
  pricing_recommendation_id     uuid,            -- FK to pricing_recommendations (P205) OR sentinel
  pricing_sentinel              text,            -- '{{MARKOS_PRICING_ENGINE_PENDING}}' when FK null + P205 absent
  -- NOTE: invoice is blocked if pricing_recommendation_id IS NULL AND pricing_sentinel IS NULL

  -- Amounts
  currency                      text NOT NULL,   -- ISO 4217: 'USD' | 'COP'
  subtotal                      numeric(15,4) NOT NULL,
  discount_amount               numeric(15,4) NOT NULL DEFAULT 0,
  tax_lines                     jsonb NOT NULL DEFAULT '[]',
  tax_total                     numeric(15,4) NOT NULL DEFAULT 0,
  total                         numeric(15,4) NOT NULL,
  amount_paid                   numeric(15,4) NOT NULL DEFAULT 0,
  amount_due                    numeric(15,4) NOT NULL,

  -- Tax jurisdiction (required for compliance enforcement triggers)
  billing_country               text NOT NULL,   -- ISO 3166-1 alpha-2: 'US' | 'CO'
  tax_jurisdiction              text NOT NULL,   -- 'US_STATE_CA' | 'CO_BOGOTA' etc. (non-null required)

  -- US compliance fields (STRIPE_INVOICE_REQUIRES_TAX_CALCULATION trigger)
  sales_tax_calculated_at       timestamptz,     -- non-null for US invoices post-Stripe Tax calculation
  stripe_tax_calculation_id     text,            -- Stripe Tax calculation object ID

  -- Colombia DIAN compliance fields (DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE trigger)
  cufe                          text,            -- DIAN CUFE (64-char SHA-384 hash)
  electronic_invoice_xml        text,            -- UBL 2.1 XML stored (base64 or text)
  electronic_invoice_pdf_url    text,
  dian_transmission_state       text CHECK (dian_transmission_state IN (
    'pending', 'transmitted', 'accepted', 'rejected', 'void'
  )),
  dian_provider_response_id     text,            -- provider response reference from Siigo

  -- Colombian tax retention fields
  iva_rate                      numeric(5,4),    -- 0.19 for standard SaaS
  iva_amount                    numeric(15,4),
  retefuente_rate               numeric(5,4),
  retefuente_amount             numeric(15,4),
  reteiva_rate                  numeric(5,4),
  reteiva_amount                numeric(15,4),
  reteica_rate                  numeric(5,4),
  reteica_amount                numeric(15,4),

  -- Payment processor
  processor                     text NOT NULL CHECK (processor IN ('stripe', 'mercado_pago')),
  processor_invoice_id          text,            -- Stripe invoice ID | MP payment ID
  processor_payment_intent_id   text,
  payment_method_type           text,            -- 'card' | 'bank_transfer' | 'pse' | 'efecty'

  -- Accounting sync
  quickbooks_invoice_id         text,
  siigo_invoice_id              text,
  alegra_invoice_id             text,            -- reserved for v4.2.0
  accounting_synced_at          timestamptz,

  -- Delivery
  sent_to_email                 text,
  sent_at                       timestamptz,
  viewed_at                     timestamptz,
  due_at                        timestamptz NOT NULL,
  issued_at                     timestamptz NOT NULL DEFAULT now(),

  -- Audit
  correction_of_invoice_id      uuid,            -- FK to original invoice (for corrections)
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY saas_invoices_tenant_isolation ON saas_invoices
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Downstream consumer indexes (P216/P217/P218/P219 rely on these)
CREATE INDEX si_tenant_subscription_idx ON saas_invoices(tenant_id, subscription_id, issued_at DESC);
CREATE INDEX si_tenant_status_idx ON saas_invoices(tenant_id, status, issued_at DESC);
CREATE INDEX si_billing_country_idx ON saas_invoices(tenant_id, billing_country);
CREATE INDEX si_processor_invoice_id_idx ON saas_invoices(processor, processor_invoice_id);
```

#### `saas_payment_attempts` Table Schema

P216 health score billing dimension + P218 failed-payment InAppCampaign trigger read this table directly:

```sql
CREATE TABLE saas_payment_attempts (
  attempt_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  invoice_id              uuid NOT NULL REFERENCES saas_invoices(invoice_id),
  subscription_id         uuid NOT NULL,

  -- Attempt identity
  processor               text NOT NULL CHECK (processor IN ('stripe', 'mercado_pago')),
  processor_payment_id    text,                -- Stripe PaymentIntent ID | MP payment ID
  idempotency_key         text NOT NULL UNIQUE, -- prevents duplicate charges

  -- Outcome
  status                  text NOT NULL CHECK (status IN (
    'pending', 'succeeded', 'failed', 'requires_action', 'canceled'
  )),
  failure_code            text,                -- Stripe decline code | MP error code
  failure_message         text,
  amount                  numeric(15,4) NOT NULL,
  currency                text NOT NULL,

  -- Dunning context
  dunning_attempt_number  integer NOT NULL DEFAULT 1,
  next_retry_at           timestamptz,
  signature_verified_at   timestamptz,         -- PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY

  attempted_at            timestamptz NOT NULL DEFAULT now(),
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saas_payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY spa_tenant_isolation ON saas_payment_attempts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- P216 billing health dimension reads this
CREATE INDEX spa_tenant_invoice_idx ON saas_payment_attempts(tenant_id, invoice_id, attempted_at DESC);
-- P218 failed-payment trigger reads this
CREATE INDEX spa_tenant_failed_idx ON saas_payment_attempts(tenant_id, status, attempted_at DESC)
  WHERE status = 'failed';
```

#### `saas_billing_events` Table Schema

```sql
CREATE TABLE saas_billing_events (
  event_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  invoice_id              uuid REFERENCES saas_invoices(invoice_id),
  subscription_id         uuid,
  event_type              text NOT NULL,    -- 'invoice.created' | 'payment.succeeded' | 'dunning.started' etc.
  processor               text CHECK (processor IN ('stripe', 'mercado_pago', 'quickbooks', 'siigo', 'dian')),
  processor_event_id      text,            -- raw processor event ID for dedup
  idempotency_key         text UNIQUE,
  payload_redacted        jsonb NOT NULL DEFAULT '{}',  -- PII/credential-scrubbed payload
  occurred_at             timestamptz NOT NULL DEFAULT now(),
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saas_billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY sbe_tenant_isolation ON saas_billing_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX sbe_tenant_event_idx ON saas_billing_events(tenant_id, event_type, occurred_at DESC);
CREATE INDEX sbe_idempotency_idx ON saas_billing_events(idempotency_key);
```

#### `saas_credential_vault_refs` Table Schema

Stores vault reference strings (never plaintext credentials). This is the foundation all processor/accounting/DIAN configs link to.

```sql
CREATE TABLE saas_credential_vault_refs (
  ref_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  credential_name         text NOT NULL,   -- ENUM value from CREDENTIAL_ENUM_LIST
  vault_ref               text NOT NULL,   -- 'vault://...' or pgcrypto ref
  -- vault_ref must match pattern: 'vault://[a-zA-Z0-9_\-/]+' OR pgcrypto-ref pattern
  config_table            text NOT NULL,   -- 'saas_processor_configs' | 'saas_accounting_configs' | 'saas_dian_config'
  config_id               uuid NOT NULL,   -- FK to the owning config row
  rotated_at              timestamptz,
  expires_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saas_credential_vault_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY scvr_tenant_isolation ON saas_credential_vault_refs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE UNIQUE INDEX scvr_tenant_cred_config_idx ON saas_credential_vault_refs(tenant_id, credential_name, config_id);
```

#### DB-Trigger Compliance — `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS`

```sql
CREATE OR REPLACE FUNCTION enforce_invoice_pricing_and_legal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Pricing Engine FK or sentinel required (SAS-04)
  IF NEW.pricing_recommendation_id IS NULL AND NEW.pricing_sentinel IS NULL THEN
    RAISE EXCEPTION
      'INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS: invoice_id=% must have pricing_recommendation_id or pricing_sentinel={{MARKOS_PRICING_ENGINE_PENDING}}',
      NEW.invoice_id;
  END IF;
  -- Tax jurisdiction required (compliance gate)
  IF NEW.tax_jurisdiction IS NULL OR NEW.tax_jurisdiction = '' THEN
    RAISE EXCEPTION
      'INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS: invoice_id=% must have non-null tax_jurisdiction',
      NEW.invoice_id;
  END IF;
  -- Legal invoice number required for non-draft invoices
  IF NEW.status != 'draft' AND NEW.invoice_number_legal IS NULL THEN
    RAISE EXCEPTION
      'INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS: invoice_id=% in status=% must have invoice_number_legal',
      NEW.invoice_id, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_invoice_pricing_and_legal
  BEFORE INSERT OR UPDATE ON saas_invoices
  FOR EACH ROW EXECUTE FUNCTION enforce_invoice_pricing_and_legal();
```

#### Wave 0.5 Deliverables (Plan 01)

1. `test/saas-215/preflight/architecture-lock.test.js` — forbidden-pattern detector
2. `scripts/preconditions/215-01-check-upstream.cjs` — HARD gate on P203/P205/P206/P214
3. CREATE `V4.1.0-MIGRATION-SLOT-COORDINATION.md` (first V4.1.0 phase to create it; P216 will APPEND)
4. Create `api/v1/saas/` directory (P215 executes before P216; P215 creates this directory)
5. `lib/markos/mcp/tools/saas-billing.cjs` skeleton (credential sanitization layer established here)

---

### Domain 2: US Path — Stripe Billing + Stripe Tax + QuickBooks (Plan 215-02)

**Requirements:** SAS-05, SAS-06, QA-01..15; integrates_with: [PRC-01..09 from P205]

**Canon source:** `obsidian/work/incoming/16-SAAS-SUITE.md` Part 3 (Stripe) + Part 4 (US Compliance). [VERIFIED: read 2026-04-26]

#### `saas_processor_configs` Table Schema (shared across US + Colombia)

```sql
-- Migration 119 (combined US + Colombia processor/accounting configs)
CREATE TABLE saas_processor_configs (
  config_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  processor_type          text NOT NULL CHECK (processor_type IN ('stripe', 'mercado_pago')),
  environment             text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  countries               text[] NOT NULL,    -- ['US'] for Stripe, ['CO','AR','BR',...] for MP
  is_active               boolean NOT NULL DEFAULT false,

  -- Configuration JSONB (non-credential fields only)
  config_jsonb            jsonb NOT NULL DEFAULT '{}',
  -- Stripe: publishable_key (non-secret), webhook_endpoint_id, stripe_account_id, automatic_tax_enabled
  -- MP: public_key (non-secret), preapproval_enabled, checkout_bricks_enabled
  -- NO credential fields in this column (credentials in saas_credential_vault_refs)

  -- Abstraction layer fields
  supports_recurring      boolean NOT NULL DEFAULT true,
  supports_local_methods  boolean NOT NULL DEFAULT false,  -- true for Mercado Pago (PSE, Efecty)
  fallback_processor_id   uuid REFERENCES saas_processor_configs(config_id),

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, processor_type, environment)
);
ALTER TABLE saas_processor_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY spc_tenant_isolation ON saas_processor_configs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### `saas_accounting_configs` Table Schema

```sql
CREATE TABLE saas_accounting_configs (
  config_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  accounting_type         text NOT NULL CHECK (accounting_type IN ('quickbooks', 'siigo', 'alegra')),
  environment             text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  is_active               boolean NOT NULL DEFAULT false,

  -- Account mapping JSONB (no credentials)
  account_mapping_jsonb   jsonb NOT NULL DEFAULT '{}',
  -- QB: saas_revenue_account, ar_account, deferred_revenue_account, tax_payable_account, bank_account
  -- Siigo: income_account, iva_account, customer_account, bank_account
  auto_sync               boolean NOT NULL DEFAULT true,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, accounting_type, environment)
);
ALTER TABLE saas_accounting_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sac_tenant_isolation ON saas_accounting_configs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### DB-Trigger Compliance — `STRIPE_INVOICE_REQUIRES_TAX_CALCULATION`

```sql
CREATE OR REPLACE FUNCTION enforce_stripe_invoice_tax()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.processor = 'stripe'
     AND NEW.billing_country = 'US'
     AND NEW.status NOT IN ('draft', 'void')
     AND NEW.sales_tax_calculated_at IS NULL
     AND NEW.stripe_tax_calculation_id IS NULL THEN
    RAISE EXCEPTION
      'STRIPE_INVOICE_REQUIRES_TAX_CALCULATION: invoice_id=% US Stripe invoice must have sales_tax_calculated_at or stripe_tax_calculation_id',
      NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_stripe_invoice_tax
  BEFORE INSERT OR UPDATE ON saas_invoices
  FOR EACH ROW EXECUTE FUNCTION enforce_stripe_invoice_tax();
```

#### Stripe Integration Specifics

**Key Stripe objects P215 owns** [CITED: 16-SAAS-SUITE.md Part 3]:
- `stripe.Customer` → P215 creates/syncs when subscription activates
- `stripe.Subscription` → subscription state mirror of P214 `saas_subscriptions`
- `stripe.Invoice` → maps 1:1 to `saas_invoices`
- `stripe.PaymentIntent` → maps to `saas_payment_attempts`
- `stripe.TaxCalculation` → `saas_invoices.stripe_tax_calculation_id`

**Key Stripe webhook events P215 handles via Plan 04** [CITED: 16-SAAS-SUITE.md Part 3]:

```text
customer.subscription.created         → create/update saas_subscriptions (P214 mirror)
customer.subscription.updated         → sync status changes
customer.subscription.deleted         → trigger dunning/churn workflow
invoice.payment_succeeded             → update saas_invoices, trigger QB sync
invoice.payment_failed                → create saas_payment_attempts (failed), start dunning
invoice.finalized                     → update saas_invoices.status = 'open'
customer.updated                      → sync customer data
payment_method.attached               → update processor config
charge.dispute.created                → P0 alert; freeze account
```

**QuickBooks sync events** [CITED: 16-SAAS-SUITE.md Part 3]:

```text
invoice.payment_succeeded → QBO: CreateInvoice + CreatePayment
invoice refund/credit     → QBO: CreateCreditMemo
new customer              → QBO: CreateCustomer + sync tax ID
monthly reconciliation    → QBO balance vs Stripe reconciliation task
```

**Credential ENUM list for Plan 02 (US path):**
- `stripe_secret_key` — stored in `saas_credential_vault_refs`
- `stripe_webhook_secret` — stored in `saas_credential_vault_refs`
- `stripe_tax_api_key` — stored in `saas_credential_vault_refs` (if using Stripe Tax API separately)
- `quickbooks_oauth_token` — stored in `saas_credential_vault_refs`
- `quickbooks_realm_id` — stored in `saas_credential_vault_refs` (less sensitive but still vault-ref)

---

### Domain 3: Colombia Path — Mercado Pago + Siigo + DIAN (Plan 215-03)

**Requirements:** SAS-06, QA-01..15

**Canon source:** `obsidian/work/incoming/16-SAAS-SUITE.md` Part 3 (Mercado Pago) + Part 4 (Colombia Compliance). [VERIFIED: read 2026-04-26]
**DIAN provider decision (Q-6 RESOLVED):** Siigo first for v4.1.0. Alegra deferred to v4.2.0. [CITED: SaaS Suite Canon.md §Colombia Launch; 16-SAAS-SUITE.md §DIAN provider strategy]

#### `saas_dian_config` Table Schema

```sql
-- Migration 120 (Colombia path — combined)
CREATE TABLE saas_dian_config (
  dian_config_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id) UNIQUE,

  -- Legal entity (vendor = the MarkOS tenant, the SaaS company)
  nit                     text NOT NULL,       -- NIT sin dígito verificador
  nit_dv                  text NOT NULL,       -- dígito verificador
  razon_social            text NOT NULL,       -- legal company name
  regimen_tributario      text NOT NULL CHECK (regimen_tributario IN (
    'responsable_iva', 'no_responsable_iva', 'gran_contribuyente', 'auto_retenedor'
  )),
  ciudad                  text NOT NULL,
  departamento            text NOT NULL,
  direccion               text NOT NULL,

  -- DIAN habilitación (authorization)
  software_id             text,                -- DIAN-assigned software ID (via Siigo)
  software_pin            text,                -- technical key (ClTec) for CUFE calculation; stored in vault ref
  numero_resolucion       text,                -- DIAN authorized numbering resolution
  rango_desde             bigint,              -- authorized invoice number range start
  rango_hasta             bigint,              -- authorized invoice number range end
  fecha_inicio_resolucion date,
  fecha_fin_resolucion    date,

  -- Certificate (PKCS12) — stored as vault ref only
  -- dian_pkcs12_certificate and dian_pkcs12_password are in saas_credential_vault_refs
  certificate_expires_at  timestamptz,

  -- Environment
  environment             text NOT NULL CHECK (environment IN ('habilitacion', 'production')),
  siigo_config_id         uuid REFERENCES saas_accounting_configs(config_id),

  -- Setup wizard state
  wizard_state            text NOT NULL DEFAULT 'pending' CHECK (wizard_state IN (
    'pending', 'nit_registered', 'certificate_uploaded', 'test_invoice_sent',
    'test_invoice_accepted', 'production_ready'
  )),
  test_invoice_cufe       text,                -- CUFE from test invoice validation

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_dian_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY sdc_tenant_isolation ON saas_dian_config
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### DB-Trigger Compliance — `DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE`

```sql
CREATE OR REPLACE FUNCTION enforce_dian_invoice_compliance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.billing_country = 'CO'
     AND NEW.status NOT IN ('draft', 'void')
     AND NEW.processor = 'mercado_pago' THEN
    -- Legal DIAN invoice requires CUFE and provider response
    IF NEW.cufe IS NULL OR NEW.dian_provider_response_id IS NULL THEN
      RAISE EXCEPTION
        'DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE: invoice_id=% Colombia legal invoice must have cufe and dian_provider_response_id',
        NEW.invoice_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dian_invoice_compliance
  BEFORE INSERT OR UPDATE ON saas_invoices
  FOR EACH ROW EXECUTE FUNCTION enforce_dian_invoice_compliance();
```

#### DB-Trigger Compliance — `DIAN_REJECTION_CREATES_P1_TASK`

This trigger fires on `saas_billing_events` when a DIAN rejection event is recorded. It creates a P1 approval task via the P208 substrate (if available) or a stub task record.

```sql
CREATE OR REPLACE FUNCTION enforce_dian_rejection_task()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_type = 'dian.rejected'
     AND NEW.processor = 'dian' THEN
    -- Insert P1 task for operator to resolve DIAN rejection within 24h
    -- Uses P208 approval_tasks substrate if available; else stub
    INSERT INTO approval_tasks (
      tenant_id, task_type, priority, title, description,
      source_table, source_id, sla_at, created_at
    ) VALUES (
      NEW.tenant_id,
      'dian_rejection_resolution',
      'P1',
      'DIAN Invoice Rejection — Action Required Within 24h',
      format('Invoice billing event %s rejected by DIAN. Correct and retransmit within 24h.', NEW.event_id),
      'saas_billing_events',
      NEW.event_id,
      NOW() + INTERVAL '24 hours',
      NOW()
    ) ON CONFLICT DO NOTHING;
    -- If approval_tasks table doesn't exist (P208 not landed), log warning — do NOT fail
    -- The ON CONFLICT DO NOTHING handles the case where it already exists from a replay
    RAISE NOTICE 'DIAN_REJECTION_CREATES_P1_TASK: event_id=% P1 task created', NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dian_rejection_task
  AFTER INSERT ON saas_billing_events
  FOR EACH ROW EXECUTE FUNCTION enforce_dian_rejection_task();
```

#### CUFE Calculation (Colombia)

[CITED: 16-SAAS-SUITE.md Part 4 §DIAN Facturación Electrónica Step 4]

```text
CUFE = SHA-384(
  NumFac      -- invoice number
  + FecFac    -- issue date YYYY-MM-DD
  + HorFac    -- issue time HH:MM:SS-05:00
  + ValFac    -- subtotal amount (COP, 2 decimal places)
  + CodImp1   -- '01' (IVA)
  + ValImp1   -- IVA amount
  + CodImp2   -- '04' (INC) if applicable, else '00'
  + ValImp2   -- INC amount (or 0.00)
  + CodImp3   -- '03' (ICA) if applicable, else '00'
  + ValImp3   -- ICA amount (or 0.00)
  + ValTot    -- total amount (COP, 2 decimal places)
  + NitOFE    -- vendor NIT (without check digit)
  + NumAdq    -- customer NIT/CC/CE
  + ClTec     -- technical key from saas_dian_config.software_pin (vault ref)
)
```

The technical key (`ClTec`) is fetched from `saas_credential_vault_refs` at generation time. It MUST NOT be stored in the invoice record or logged.

#### Mercado Pago Integration Specifics

**Key MP objects P215 owns** [CITED: 16-SAAS-SUITE.md Part 3]:
- Preapproval API — subscription/recurring billing (`external_reference` = P214 `subscription_id`)
- Payment API — one-time payments and invoice payments
- Checkout Bricks — UI component config (non-credential fields in `saas_processor_configs.config_jsonb`)

**Key MP webhook events P215 handles via Plan 04** [CITED: 16-SAAS-SUITE.md Part 3]:

```text
preapproval.authorized    → subscription activated (update saas_subscriptions)
preapproval.paused        → subscription paused
preapproval.cancelled     → subscription canceled, trigger churn workflow
payment.created           → create saas_payment_attempts (pending)
payment.approved          → update saas_payment_attempts, trigger DIAN invoice, Siigo sync
payment.failed            → update saas_payment_attempts (failed), start dunning
payment.refunded          → create credit note invoice
```

**Credential ENUM list for Plan 03 (Colombia path):**
- `mercadopago_access_token` — stored in `saas_credential_vault_refs`
- `mercadopago_webhook_secret` — stored in `saas_credential_vault_refs`
- `siigo_api_key` — stored in `saas_credential_vault_refs`
- `dian_pkcs12_certificate` — stored in `saas_credential_vault_refs` (base64-encoded PKCS12)
- `dian_pkcs12_password` — stored in `saas_credential_vault_refs`
- `dian_authorization_token` — stored in `saas_credential_vault_refs`

#### DIAN Setup Wizard Steps

The wizard guides operators through configuring DIAN electronic invoicing:

1. **NIT registration** — operator enters NIT, dígito verificador, razón social, régimen tributario, address → `saas_dian_config.wizard_state = 'nit_registered'`
2. **Certificate upload** — operator uploads PKCS12 certificate and password → stored in `saas_credential_vault_refs`; cert expiry stored in `saas_dian_config.certificate_expires_at` → `wizard_state = 'certificate_uploaded'`
3. **Numbering configuration** — operator enters DIAN resolution number and authorized range → `wizard_state` stays; stored on `saas_dian_config`
4. **Siigo account link** — operator selects existing `saas_accounting_configs` Siigo row OR creates new → `saas_dian_config.siigo_config_id` set
5. **Test invoice** — generate + transmit DIAN test invoice to habilitación environment via Siigo → `wizard_state = 'test_invoice_sent'`; if accepted: `wizard_state = 'test_invoice_accepted'`, `test_invoice_cufe` stored
6. **Production cutover** — operator explicitly switches `saas_dian_config.environment = 'production'` after test validation → `wizard_state = 'production_ready'` (MANUAL-ONLY verification required)

---

### Domain 4: Processor Webhook Routing Through P203 Engine (Plan 215-04)

**Requirements:** SAS-05, QA-01..15; integrates_with: [WHK-01 from P203]

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` §Non-Negotiables ("No new /v1/webhooks/* handler that bypasses the webhook subscription engine"). [VERIFIED: canon read 2026-04-26]

**Architecture decision (REUSE, not greenfield):** P215 does NOT create a new webhook engine. It creates processor-specific inbound handler endpoints (`api/v1/saas/webhooks/stripe.js`, etc.) that call into the existing P203 engine functions for durability, signing verification, replay safety, DLQ, rate-limiting, circuit-breaking, and observability. [VERIFIED: `lib/markos/webhooks/` all files present on disk]

#### DB-Trigger Compliance — `PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY`

```sql
CREATE OR REPLACE FUNCTION enforce_webhook_signature_idempotency()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Every billing event from a processor must have been signature-verified
  IF NEW.processor IN ('stripe', 'mercado_pago', 'quickbooks', 'siigo')
     AND NEW.idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY: event_id=% from processor=% must have idempotency_key',
      NEW.event_id, NEW.processor;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_webhook_signature_idempotency
  BEFORE INSERT ON saas_billing_events
  FOR EACH ROW EXECUTE FUNCTION enforce_webhook_signature_idempotency();
```

Note: `signature_verified_at` is stored on `saas_payment_attempts` (not the billing event) because the signature verification happens in the handler before the event is written. The trigger enforces idempotency_key presence as a proxy for verified routing through the signed handler.

#### Webhook Handler Pattern (Plan 04 per processor)

```js
// api/v1/saas/webhooks/stripe.js — REUSE pattern
'use strict';
const { verifySignature } = require('../../../../lib/markos/webhooks/signing.cjs');
const { requireHostedSupabaseAuth } = require('../../../../onboarding/backend/runtime-context.cjs');

module.exports = async function stripeWebhookHandler(req, res) {
  // 1. Signature verification (BEFORE any processing)
  const sig = req.headers['stripe-signature'];
  const secret = await getStripeWebhookSecret(req); // fetched from saas_credential_vault_refs
  const verified = verifySignature(secret, req.rawBody, sig, req.headers['x-markos-timestamp']);
  if (!verified) {
    return res.status(401).json({ error: 'WEBHOOK_SIGNATURE_INVALID' });
  }
  // 2. Idempotency check (using stripe event ID as idempotency key)
  const idempotencyKey = req.body.id; // Stripe event ID
  // 3. Route through P203 engine delivery path
  // 4. Write to saas_billing_events (trigger enforces idempotency_key presence)
  // 5. Trigger domain handler (invoice.payment_succeeded → update saas_invoices)
};
```

#### Log Redaction for Processor Webhook Payloads

Stripe and Mercado Pago webhook payloads contain customer PII (email, name, card last4). The `saas_billing_events.payload_redacted` column stores ONLY the redacted version. Redaction must occur in the handler BEFORE any logging:

```js
function redactWebhookPayload(payload, processor) {
  const REDACT_FIELDS = {
    stripe: ['email', 'name', 'address', 'phone', 'last4', 'fingerprint', 'ip_address'],
    mercado_pago: ['email', 'first_name', 'last_name', 'phone', 'identification', 'card'],
  };
  // Deep-clone + replace matching fields with '[REDACTED]'
  return deepRedact(payload, REDACT_FIELDS[processor] || []);
}
```

---

### Domain 5: Billing Approvals, Corrections, Dunning, and Evidence (Plan 215-05)

**Requirements:** SAS-05, COMP-01 (co_owns_with P206), QA-01..15; integrates_with: [TASK-01..05 from P208, EVD-01..06 from P209, PRC-01..09 from P205]

#### `saas_billing_corrections` Table Schema

```sql
-- Migration 122
CREATE TABLE saas_billing_corrections (
  correction_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  original_invoice_id     uuid NOT NULL REFERENCES saas_invoices(invoice_id),
  correction_invoice_id   uuid REFERENCES saas_invoices(invoice_id), -- credit note or corrected invoice
  correction_type         text NOT NULL CHECK (correction_type IN (
    'refund', 'credit_note', 'write_off', 'discount', 'invoice_correction'
  )),
  amount                  numeric(15,4) NOT NULL,
  currency                text NOT NULL,
  reason                  text NOT NULL,

  -- Approval gate (BILLING_CORRECTION_REQUIRES_APPROVAL trigger enforces this)
  approval_id             uuid,                -- FK to agent_approval_packages (P208)
  evidence_pack_ref       uuid,                -- FK to governance_evidence_packs (P206/P209)
  approved_by             uuid,
  approved_at             timestamptz,

  -- Pricing Engine save-offer routing (SAS-04)
  pricing_recommendation_id uuid,             -- FK to pricing_recommendations if save offer
  offer_details           text,               -- '{{MARKOS_PRICING_ENGINE_PENDING}}' until P205 lands

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_billing_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sbc_tenant_isolation ON saas_billing_corrections
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### `saas_dunning_schedules` Table Schema

```sql
CREATE TABLE saas_dunning_schedules (
  schedule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  subscription_id         uuid NOT NULL,
  invoice_id              uuid REFERENCES saas_invoices(invoice_id),
  status                  text NOT NULL CHECK (status IN (
    'active', 'resolved', 'failed', 'paused', 'expired'
  )),
  current_attempt         integer NOT NULL DEFAULT 1,
  max_attempts            integer NOT NULL DEFAULT 4,
  next_retry_at           timestamptz,
  grace_period_ends_at    timestamptz NOT NULL,
  suspension_at           timestamptz,
  outcome_jsonb           jsonb,              -- final resolution details
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_dunning_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY sds_tenant_isolation ON saas_dunning_schedules
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### DB-Trigger Compliance — `BILLING_CORRECTION_REQUIRES_APPROVAL`

```sql
CREATE OR REPLACE FUNCTION enforce_billing_correction_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approved_at IS NOT NULL AND (NEW.approval_id IS NULL OR NEW.evidence_pack_ref IS NULL) THEN
    RAISE EXCEPTION
      'BILLING_CORRECTION_REQUIRES_APPROVAL: correction_id=% type=% must have approval_id and evidence_pack_ref',
      NEW.correction_id, NEW.correction_type;
  END IF;
  -- Block finalization without approval on non-draft corrections
  IF TG_OP = 'INSERT' AND NEW.correction_type IN ('refund', 'write_off', 'discount') THEN
    IF NEW.approval_id IS NULL THEN
      RAISE EXCEPTION
        'BILLING_CORRECTION_REQUIRES_APPROVAL: correction_id=% type=% requires approval before creation',
        NEW.correction_id, NEW.correction_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_billing_correction_approval
  BEFORE INSERT OR UPDATE ON saas_billing_corrections
  FOR EACH ROW EXECUTE FUNCTION enforce_billing_correction_approval();
```

#### Dunning Workflow (16-SAAS-SUITE.md Part 2 §Payment failure workflow)

[CITED: 16-SAAS-SUITE.md Part 2]

| Day | Action | System |
|-----|--------|--------|
| 0 | First failure → `past_due`, dunning schedule created | `saas_dunning_schedules` + `saas_payment_attempts` |
| 0 | Email: "Payment failed — please update your card" | P223 email substrate (or stub) |
| 3 | Attempt 2: smart retry via processor | `saas_payment_attempts` |
| 5 | Escalation email | P223 email substrate |
| 5 | CRM flag: "At risk — payment failure" | P207/P208 task |
| 7 | Attempt 3: final retry | `saas_payment_attempts` |
| 8 | If still failed: `unpaid`, access suspended | `saas_subscriptions` status update (P214) |
| 38 | Data deletion warning email | P223 email substrate |
| 45 | Data deletion (if still unpaid) | Governance workflow (P206) |

#### SOC2 Evidence Pack for Invoice Corrections

Plan 05 must produce a SOC2 evidence pack for every invoice correction, refund, credit, or write-off:
- `governance_evidence_packs` row with: action, actor, timestamp, original_invoice_id, correction_type, amount, approval_id
- Evidence pack is referenced by `saas_billing_corrections.evidence_pack_ref`
- Evidence pack is the audit trail for SOC2 Type I billing controls review

---

### Domain 6: Future Incentive Payout Compliance Hooks (Plan 215-06)

**Requirements:** QA-01..15; translation_gate_for: [P218, P219, P220]; autonomous=true

**Canon source:** `obsidian/brain/Pricing Engine Canon.md` §Pricing Engine relationship to SaaS Suite; `obsidian/brain/SaaS Suite Canon.md` §Non-Negotiables. [VERIFIED: both read 2026-04-26]

#### `saas_future_payout_policies` Table Schema

```sql
-- Migration 123 (Plan 06 seed only)
CREATE TABLE saas_future_payout_policies (
  policy_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid REFERENCES markos_orgs(org_id),  -- NULL = platform-wide seed
  payout_type             text NOT NULL CHECK (payout_type IN (
    'referral_reward', 'affiliate_commission', 'partner_payout', 'incentive_experiment'
  )),
  planned_only            boolean NOT NULL DEFAULT true,
  reserved_for_phase      text NOT NULL,     -- 'P218' | 'P219' | 'P220'
  description             text NOT NULL,
  pricing_engine_required boolean NOT NULL DEFAULT true,
  approval_required       boolean NOT NULL DEFAULT true,
  audit_required          boolean NOT NULL DEFAULT true,
  tax_legal_required      boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);
-- RLS intentionally omitted — this is a platform seed table (no tenant data)
-- Seed rows inserted by Plan 06 migration:
-- referral_reward → P220 Plan 01
-- affiliate_commission → P220 Plan 05
-- partner_payout → P220 Plan 05
-- incentive_experiment → P218 Plan 05
```

#### Plan 06 Closeout Regression Suite

Plan 06 is autonomous=true and ships a closeout regression suite that asserts phase invariants before Plan 06 can be closed:

1. **Translation-gate test:** `saas_future_payout_policies` — all rows have `planned_only=true`. Assert count > 0.
2. **No active payout agents test:** Zero referral/affiliate/partner/incentive agent configs with `runnable=true` in any registry.
3. **Slot-collision regression:** Re-verify slots 118–123 are the only P215 slots; no collision with P216–P220.
4. **All-domains architecture-lock RE-RUN:** Run `test/saas-215/preflight/architecture-lock.test.js` again.
5. **Requirements-coverage assertion:** All SAS-04/05/06, BILL-01, COMP-01, QA-01..15 test files exist and pass.

---

## Sensitive Credential Handling (HIGH 2 — Defense-in-Depth)

This section addresses the HIGH 2 concern from REVIEWS.md: credential handling is under-specified and security-critical.

### Credential ENUM List (Complete)

These field names MUST NEVER appear in logs, prompts, tasks, or MCP response payloads:

```text
stripe_secret_key
stripe_webhook_secret
stripe_tax_api_key
mercadopago_access_token
mercadopago_webhook_secret
quickbooks_oauth_token
quickbooks_realm_id
siigo_api_key
alegra_api_key                  (reserved for v4.2.0)
dian_pkcs12_certificate
dian_pkcs12_password
dian_authorization_token
```

### Layer 1: Storage — Supabase Vault + pgcrypto Fallback

All credentials stored as vault references in `saas_credential_vault_refs.vault_ref`:
- **Primary:** Supabase Vault (`vault.create_secret()` via pgsodium) → returns a `vault://` reference UUID
- **Fallback:** pgcrypto `pgp_sym_encrypt(secret, MARKOS_BILLING_ENCRYPTION_KEY)` → returns `pgcrypto-ref:{bytea_base64}` pattern
- `saas_credential_vault_refs.vault_ref` column pattern: `vault://[uuid]` (Vault) OR `pgcrypto-ref:[base64]` (fallback)
- Existing pattern: Migration 76 CLI tenant env uses pgcrypto successfully [VERIFIED: `76_markos_cli_tenant_env.sql`]

### Layer 2: DB-Trigger — `BILLING_CREDENTIAL_REQUIRES_VAULT_REF`

This trigger fires on `saas_credential_vault_refs` INSERT/UPDATE and blocks any vault_ref that matches the plaintext credential pattern (length > 0 AND NOT matching vault-ref or pgcrypto-ref pattern):

```sql
CREATE OR REPLACE FUNCTION enforce_credential_vault_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- vault_ref must start with 'vault://' or 'pgcrypto-ref:'
  IF NEW.vault_ref IS NULL
     OR (NEW.vault_ref NOT LIKE 'vault://%' AND NEW.vault_ref NOT LIKE 'pgcrypto-ref:%') THEN
    RAISE EXCEPTION
      'BILLING_CREDENTIAL_REQUIRES_VAULT_REF: credential_name=% vault_ref must match vault:// or pgcrypto-ref: pattern; plaintext credentials are not allowed',
      NEW.credential_name;
  END IF;
  -- Additional guard: vault_ref must not equal the credential_name (bootstrap mistake)
  IF NEW.vault_ref = NEW.credential_name THEN
    RAISE EXCEPTION
      'BILLING_CREDENTIAL_REQUIRES_VAULT_REF: credential_name=% vault_ref must not equal credential_name (plaintext guard)',
      NEW.credential_name;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_credential_vault_ref
  BEFORE INSERT OR UPDATE ON saas_credential_vault_refs
  FOR EACH ROW EXECUTE FUNCTION enforce_credential_vault_ref();
```

This trigger fires ACROSS all Plans 02, 03, and 04 since all credentials flow through `saas_credential_vault_refs`.

### Layer 3: MCP Tool Sanitization — `saas-billing.cjs`

`lib/markos/mcp/tools/saas-billing.cjs` ships a credential sanitization layer as part of its response pipeline. Every tool response passes through `sanitizeBillingResponse()` before being returned:

```js
// lib/markos/mcp/tools/saas-billing.cjs (excerpt)
const CREDENTIAL_FIELDS = [
  'stripe_secret_key', 'stripe_webhook_secret', 'stripe_tax_api_key',
  'mercadopago_access_token', 'mercadopago_webhook_secret',
  'quickbooks_oauth_token', 'quickbooks_realm_id',
  'siigo_api_key', 'alegra_api_key',
  'dian_pkcs12_certificate', 'dian_pkcs12_password', 'dian_authorization_token',
  'vault_ref',  // NEVER expose vault refs in MCP output
];

function sanitizeBillingResponse(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (CREDENTIAL_FIELDS.includes(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeBillingResponse(obj[key]);
    }
  }
  return result;
}
```

### Layer 4: Log Redaction Middleware for Processor Webhook Payloads

Stripe and Mercado Pago webhook payloads contain raw card last4 + customer PII. The handler (`api/v1/saas/webhooks/stripe.js` etc.) must redact before ANY logging:

```js
// Applied BEFORE any console.log / audit emit in webhook handlers
const STRIPE_PII_FIELDS = ['email', 'name', 'address', 'phone', 'last4', 'fingerprint', 'ip_address', 'brand'];
const MP_PII_FIELDS = ['email', 'first_name', 'last_name', 'phone', 'identification', 'card'];
```

`saas_billing_events.payload_redacted` stores ONLY the redacted payload. The raw payload is NEVER persisted.

### Layer 5: Prompt-Injection Defense

For any LLM call that processes processor webhook content (e.g., SAS-03 Billing Compliance Agent summarizing an invoice issue):
- Webhook event payloads are summarized to the billing-event business fields only (amount, status, invoice_id, event_type) before LLM input construction
- The raw `payload_redacted` JSONB is NOT passed as-is to LLM prompts
- The SAS-03 agent context builder strips all fields from CREDENTIAL_FIELDS list before constructing the prompt context

---

## Cross-Phase Coordination

### Upstream Contract Lock (P203 + P205 + P206 + P214)

| Upstream Phase | Table / Contract | How P215 Uses It |
|----------------|-----------------|------------------|
| P203 | `markos_webhook_subscriptions`, `markos_webhook_deliveries`, `lib/markos/webhooks/*.cjs` | Plan 04 processor webhook inbound handlers call P203 engine functions for signing, DLQ, replay, rate-limit, circuit-breaker |
| P205 | `pricing_recommendations.pricing_recommendation_id` | `saas_invoices.pricing_recommendation_id` FK; `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS` trigger enforces FK or sentinel |
| P206 | `governance_evidence_packs` | Plan 05 billing correction evidence packs; `saas_billing_corrections.evidence_pack_ref` |
| P214 | `saas_suite_activations`, `saas_subscriptions` | `saas_invoices.subscription_id` FK; billing module gated by activation; `saas_subscriptions.status` updated by dunning outcomes |

### Downstream Consumer Contract Lock (P216 + P217 + P218 + P219 + P220)

These columns are LOCKED and must not change shape without downstream phase coordination:

#### Q-1: P215 → P216 Contract (saas_health_scores billing dimension)

P216 billing health dimension reads:
- `saas_payment_attempts` WHERE `tenant_id = ? AND status = 'failed' AND attempted_at > NOW() - INTERVAL '180 days'` → count of failures
- `saas_invoices` WHERE `tenant_id = ? AND status = 'past_due'` → current past_due flag
- `saas_dunning_schedules` WHERE `tenant_id = ? AND status = 'active'` → active dunning flag

**LOCKED COLUMNS for P216:** `saas_payment_attempts.{tenant_id, invoice_id, status, dunning_attempt_number, attempted_at}`, `saas_invoices.{tenant_id, status, billing_country}`, `saas_dunning_schedules.{tenant_id, subscription_id, status}`

#### Q-2: P215 → P217 Contract (SaaSMRRSnapshot revenue calc)

P217 MRR revenue cron reads:
- `saas_invoices` WHERE `tenant_id = ? AND status = 'paid' AND invoice_type = 'subscription'` → recognized MRR
- `saas_invoices.{total, currency, issued_at, subscription_id}` → revenue waterfall inputs

**LOCKED COLUMNS for P217:** `saas_invoices.{tenant_id, invoice_type, status, total, currency, issued_at, subscription_id, billing_country}`

#### Q-3: P215 → P218 Contract (InAppCampaign failed-payment trigger)

P218 reads:
- `saas_payment_attempts` WHERE `tenant_id = ? AND status = 'failed' AND attempted_at > ?` → failed-payment in-app prompt trigger
- `saas_invoices` WHERE `tenant_id = ? AND invoice_id = ?` → upgrade context for campaign

**LOCKED COLUMNS for P218:** `saas_payment_attempts.{tenant_id, invoice_id, subscription_id, status, failure_code, attempted_at}`, `saas_invoices.{invoice_id, total, currency, billing_country}`

#### Q-4: P215 → P219 Contract (expansion-signal-scanner MRR uptick)

P219 expansion-signal-scanner reads:
- `saas_invoices` grouped by `subscription_id`, comparing `total` over time → MRR uptick detection

**LOCKED COLUMNS for P219:** `saas_invoices.{tenant_id, subscription_id, total, currency, issued_at, status}` (same as P217 lock — both need this subset)

#### Q-5: P215 → P220 Contract (future payout hooks)

P220 Plan 01 (referral payouts) and Plan 05 (affiliate/partner) consume:
- `saas_future_payout_policies` WHERE `payout_type IN ('referral_reward', 'affiliate_commission', 'partner_payout')` — reads reservation entries created by P215 Plan 06
- `saas_invoices` — payout triggers reference invoice amounts for commission calculation (post-P215 FK)

**LOCKED COLUMNS for P220:** `saas_future_payout_policies.{payout_type, planned_only, reserved_for_phase}`, `saas_invoices.{invoice_id, total, subscription_id}`

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node.js built-in) + `node:assert/strict` |
| Config file | none — `npm test` glob: `node --test test/**/*.test.js` |
| Quick run command | `node --test test/saas-215/**/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| SAS-04 | saas_invoices blocks insert without pricing_recommendation_id AND sentinel | unit (DB-trigger) | `node --test test/saas-215/domain-1/invoice-pricing-trigger.test.js` | Wave 0 gap |
| SAS-05 | saas_payment_attempts idempotency key prevents duplicate charges | unit | `node --test test/saas-215/domain-1/payment-attempt-idempotency.test.js` | Wave 0 gap |
| SAS-05 | Stripe webhook signature verification rejects invalid signatures | unit | `node --test test/saas-215/domain-2/stripe-signing.test.js` | Wave 0 gap |
| SAS-06 | DIAN invoice blocked without CUFE + provider_response_id | unit (DB-trigger) | `node --test test/saas-215/domain-3/dian-invoice-trigger.test.js` | Wave 0 gap |
| SAS-06 | DIAN rejection creates P1 task within 24h | integration | `node --test test/saas-215/domain-3/dian-rejection-task.test.js` | Wave 0 gap |
| BILL-01 | Invoice reconciliation with billing_usage_ledger_rows | unit | `node --test test/saas-215/domain-1/invoice-reconciliation.test.js` | Wave 0 gap |
| COMP-01 | Billing correction blocked without approval_id + evidence_pack_ref | unit (DB-trigger) | `node --test test/saas-215/domain-5/correction-approval-trigger.test.js` | Wave 0 gap |
| COMP-01 | SOC2 evidence pack created for every correction | integration | `node --test test/saas-215/domain-5/evidence-pack-creation.test.js` | Wave 0 gap |
| HIGH-2 | BILLING_CREDENTIAL_REQUIRES_VAULT_REF blocks plaintext credentials | unit (DB-trigger) | `node --test test/saas-215/domain-1/credential-vault-trigger.test.js` | Wave 0 gap |
| HIGH-2 | MCP saas-billing tool output never contains credential fields | unit | `node --test test/saas-215/domain-1/mcp-credential-sanitize.test.js` | Wave 0 gap |
| HIGH-2 | Processor webhook payload_redacted strips PII fields | unit | `node --test test/saas-215/domain-4/webhook-payload-redaction.test.js` | Wave 0 gap |
| QA-01..15 | Architecture-lock: forbidden patterns absent | unit | `node --test test/saas-215/preflight/architecture-lock.test.js` | Wave 0 gap |
| QA-01..15 | assertUpstreamReady: P203/P205/P206/P214 tables present | integration | `node --test test/saas-215/preflight/upstream-gate.test.js` | Wave 0 gap |
| Plan 06 | All saas_future_payout_policies rows have planned_only=true | unit | `node --test test/saas-215/domain-6/payout-planned-only.test.js` | Wave 0 gap |
| Plan 06 | Zero payout agents runnable=true | unit | `node --test test/saas-215/domain-6/payout-agent-gate.test.js` | Wave 0 gap |

### Sampling Rate

- **Per task commit:** `node --test test/saas-215/domain-{N}/*.test.js` (current domain only)
- **Per wave merge:** `node --test test/saas-215/**/*.test.js`
- **Phase gate:** Full suite `npm test` green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `test/saas-215/preflight/architecture-lock.test.js` — covers forbidden-pattern detection (QA-01..15)
- [ ] `test/saas-215/preflight/upstream-gate.test.js` — covers assertUpstreamReady (P203/P205/P206/P214)
- [ ] `test/saas-215/domain-1/invoice-pricing-trigger.test.js` — covers INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS
- [ ] `test/saas-215/domain-1/credential-vault-trigger.test.js` — covers BILLING_CREDENTIAL_REQUIRES_VAULT_REF (HIGH-2)
- [ ] `test/saas-215/domain-1/mcp-credential-sanitize.test.js` — covers MCP sanitization layer (HIGH-2)
- [ ] `test/saas-215/domain-2/stripe-signing.test.js` — covers Stripe webhook signature verification
- [ ] `test/saas-215/domain-3/dian-invoice-trigger.test.js` — covers DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE
- [ ] `test/saas-215/domain-3/dian-rejection-task.test.js` — covers DIAN_REJECTION_CREATES_P1_TASK
- [ ] `test/saas-215/domain-4/webhook-payload-redaction.test.js` — covers log redaction middleware (HIGH-2)
- [ ] `test/saas-215/domain-5/correction-approval-trigger.test.js` — covers BILLING_CORRECTION_REQUIRES_APPROVAL
- [ ] `test/saas-215/domain-6/payout-planned-only.test.js` — covers Plan 06 translation gate
- [ ] `test/saas-215/fixtures/billing-fixtures.js` — shared test fixtures (tenant_id, invoice stubs, vault-ref stubs)

---

## Manual-Only Verifications

These steps cannot be automated and require explicit operator action during or after execution:

1. **DIAN habilitación-to-production cutover** — Operator must explicitly switch `saas_dian_config.environment = 'production'` and confirm test invoice was accepted by DIAN in habilitación. No automated gate can verify DIAN's acceptance of a live test invoice. (Deferred runbook: v4.2.0)
2. **Processor credential rotation** — Stripe and Mercado Pago webhook secrets require manual rotation every N days (operator-configured). The rotation flow: generate new secret → update `saas_credential_vault_refs` → update processor endpoint → verify new signature works → remove old secret. This cannot be fully automated without processor cooperation.
3. **Multi-country tax field audit** — US nexus state configuration and Colombia IVA rate (currently 19%) must be verified against current regulatory rates. Tax rates change; automated tests use hardcoded values but production must be manually verified against current DIAN/IRS requirements.
4. **Dunning escalation review** — The dunning schedule parameters (grace period days, max attempts, suspension timing) are operator-configured. Initial values must be reviewed by operator before first tenant activation. No automated test can verify business-appropriate values.
5. **Future payout activation review** — Plan 06 `saas_future_payout_policies` rows are all `planned_only=true`. When P220 is ready to activate payouts, the operator must explicitly review and update the `planned_only` flag after full P218/P219/P220 execution and approval. This is a governance gate, not an automated migration.
6. **QuickBooks OAuth token refresh** — QBO OAuth tokens expire; the refresh flow requires operator interaction. P215 ships the token storage pattern; the refresh automation is deferred to the connector management phase (P210 substrate).

---

## Decisions Locked

### Promoted from DISCUSS.md Decision Matrix

| Decision | Options Considered | Locked Choice | Rationale |
|----------|-------------------|---------------|-----------|
| US processor | Stripe Billing direct, abstraction-first | **Stripe Billing direct behind MarkOS processor config** | Fastest path; `saas_processor_configs.processor_type='stripe'` provides abstraction layer already |
| Colombia processor | Mercado Pago direct, Stripe LATAM, provider abstraction | **Mercado Pago direct + provider abstraction layer** (Q-8) | Direct for v4.1.0 MVP; abstraction (`fallback_processor_id` FK) allows Stripe LATAM swap in v4.2.0 |
| DIAN path | Direct DIAN, Siigo, Alegra, provider interface | **Siigo first (v4.1.0); Alegra deferred v4.2.0** (Q-6) | Canon recommendation "Siigo/Alegra first"; Siigo has broader Colombia market share; Alegra reserved by provider abstraction |
| Accounting sync | QuickBooks only, QB+Siigo/Alegra, delayed | **QuickBooks for US (v4.1.0), Siigo for Colombia (v4.1.0)** | Both are primary accounting systems for launch markets |
| Webhook path | New /v1/webhooks/*, reuse webhook engine | **Reuse P203 webhook engine guarantees + allocate fresh contract IDs** | CONTEXT non-negotiable #1; P203 engine fully operational on disk [VERIFIED] |
| Future incentive payouts | Ignore, implement now, reserve compliant hooks | **Reserve compliant hooks in Plan 06 (planned-only)** | CONTEXT non-negotiable #5; payouts activate in P218/P219/P220 |
| Credential storage (Q-9) | Supabase Vault, pgcrypto column, external KMS | **Supabase Vault primary; pgcrypto fallback** | pgcrypto already in use (migration 76 pattern [VERIFIED]); Vault available on hosted Supabase |

---

## Open Questions / Decision Points

| ID | Question | Status | Resolution |
|----|----------|--------|------------|
| Q-1 | P215 → P216 contract: which `saas_invoices` + `saas_payment_attempts` columns does P216 billing health dimension read? | RESOLVED | See §Cross-Phase Coordination Q-1 — locked column set documented |
| Q-2 | P215 → P217 contract: which `saas_invoices` columns does SaaSMRRSnapshot revenue calc read? | RESOLVED | See §Cross-Phase Coordination Q-2 — `{invoice_type, status, total, currency, issued_at, subscription_id}` locked |
| Q-3 | P215 → P218 contract: which columns does InAppCampaign failed-payment trigger consume? | RESOLVED | See §Cross-Phase Coordination Q-3 — `saas_payment_attempts.{status, failure_code, attempted_at}` locked |
| Q-4 | P215 → P219 contract: which columns does expansion-signal-scanner MRR uptick consume? | RESOLVED | See §Cross-Phase Coordination Q-4 — same subset as Q-2 |
| Q-5 | P215 → P220 contract: how do payout hooks connect? | RESOLVED | `saas_future_payout_policies` reservation; P220 APPENDs to this table when activating |
| Q-6 | DIAN provider — Siigo OR Alegra first for v4.1.0? | RESOLVED | **Siigo** first. Canon: "Siigo/Alegra first; direct DIAN future research." Alegra reserved via provider abstraction. |
| Q-7 | SLOT ORDERING CRISIS — P215 execution before P216–P220 but slot-order LATEST among V4.1.0? | RESOLVED | P215 takes slots 118–123. Execution gate via assertUpstreamReady in P216–P220; slot order cosmetic. FK direction P216–P220 reads P215 at runtime; zero reverse FKs. |
| Q-8 | Mercado Pago — direct integration OR provider abstraction? | RESOLVED | **BOTH**: direct integration for v4.1.0 Colombia MVP + abstraction layer (`saas_processor_configs.fallback_processor_id` FK) for future Stripe LATAM swap |
| Q-9 | Sensitive credential storage — Supabase Vault OR pgcrypto column? | RESOLVED | **Supabase Vault** primary (vault-ref pattern in `saas_credential_vault_refs`); pgcrypto `pgp_sym_encrypt` fallback for fields not yet Vault-supported. Migration 76 proves pgcrypto available [VERIFIED]. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase Vault (`vault.create_secret()` / pgsodium) is available on the hosted Supabase instance for this project | §Sensitive Credential Handling Layer 1 | If Vault not available, must use pgcrypto exclusively; `vault://` ref pattern must change to `pgcrypto-ref:` exclusively |
| A2 | Siigo API sandbox is accessible from the development environment for P215 Plan 03 testing | §Domain 3 | If Siigo sandbox unavailable, Plan 03 test coverage uses mocked Siigo responses only; flag for human validation |
| A3 | DIAN habilitación environment accepts test invoice XML during P215 Plan 03 wizard step 5 | §Domain 3 DIAN wizard | If DIAN habilitación unreachable, test invoice step is manual-only; wizard_state stops at 'test_invoice_sent' without auto-acceptance |
| A4 | `approval_tasks` table (P208 substrate) exists when DIAN rejection trigger fires | §Domain 3 `DIAN_REJECTION_CREATES_P1_TASK` | If P208 absent, trigger uses `ON CONFLICT DO NOTHING` pattern; task creation degraded but P215 does not fail |
| A5 | Mercado Pago Preapproval API is available in the Mercado Pago Colombia sandbox for testing | §Domain 3 | If MP sandbox unavailable, Plan 03 tests use mocked MP responses; flag for human validation at execution |

---

## Standard Stack (Libraries Required)

| Library / Service | Version | Purpose | Status |
|-------------------|---------|---------|--------|
| Stripe Node.js SDK | `stripe@^14.x` | Stripe Billing + Tax + webhook verification | NOT YET INSTALLED — Plan 02 installs |
| Mercado Pago SDK | `mercadopago@^2.x` | Mercado Pago Checkout Bricks + Preapproval | NOT YET INSTALLED — Plan 03 installs |
| `node:crypto` | built-in | HMAC signing, CUFE SHA-384 calculation | AVAILABLE [VERIFIED: used in `lib/markos/webhooks/signing.cjs`] |
| pgcrypto (PostgreSQL extension) | built-in on Supabase | Credential encryption fallback | AVAILABLE [VERIFIED: `create extension if not exists pgcrypto` in migration 76] |
| Supabase Vault (pgsodium) | hosted | Primary credential vault | ASSUMED available on hosted Supabase; verify at Plan 01 execution |
| `@supabase/supabase-js` | existing | Database client | AVAILABLE [VERIFIED: used throughout codebase] |

**Note on Stripe SDK version:** Verify `npm view stripe version` at Plan 02 execution — training knowledge may be stale. [ASSUMED: `^14.x` is current major as of 2026]

---

## Codebase Addendum (Preserved from 2026-04-23, Expanded)

### Current-Code Support

- Billing usage contracts, provider sync outcome, invoice reconciliation, and hold/recovery evidence already exist (migrations 54, 55 — `billing_invoice_projections`, `billing_provider_sync_attempts`, `tenant_billing_subscriptions`, `billing_hold_events`). [VERIFIED: supabase/migrations/]
- Webhook engine can be reused for processor and accounting event ingress — all engine components verified on disk (`lib/markos/webhooks/*.cjs`). [VERIFIED: codebase]
- pgcrypto available for credential encryption fallback (migration 76 CLI env storage pattern). [VERIFIED: `76_markos_cli_tenant_env.sql`]
- Governance evidence packs can capture billing and approval evidence (`governance_evidence_packs` — migration 54). [VERIFIED: supabase/migrations/]
- `requireHostedSupabaseAuth` (line 491), `buildApprovalPackage` (line 68), `resolvePlugin` (line 102), `lib/markos/mcp/tools/index.cjs` all verified present. [VERIFIED: codebase]
- Existing `lib/markos/billing/stripe-sync.ts` provides data-shaping types for Stripe sync (not a live Stripe integration). [VERIFIED: codebase]

### Gaps (Confirmed)

- No Stripe Billing/Tax live processor integration exists.
- No Mercado Pago Preapproval/Checkout integration exists.
- No QuickBooks OAuth connection exists.
- No Siigo, Alegra, or DIAN electronic invoicing integration exists.
- No `saas_invoices`, `saas_payment_attempts`, `saas_billing_events`, `saas_processor_configs`, `saas_accounting_configs`, `saas_dian_config`, `saas_credential_vault_refs`, `saas_billing_corrections`, `saas_dunning_schedules`, or `saas_future_payout_policies` tables exist.
- No processor event inbox mapping external processor events to MarkOS billing states exists.
- No CUFE calculation or UBL 2.1 XML generation exists.
- `api/v1/` directory does NOT exist (P215 Plan 01 creates it). [VERIFIED: directory not found]
- `lib/markos/mcp/tools/saas-billing.cjs` does NOT exist (P215 Plan 01 creates it). [VERIFIED: not found]

---

## Sources

### Primary (HIGH confidence)

- `obsidian/brain/SaaS Suite Canon.md` — §Core Objects, §Billing and Compliance, §Non-Negotiables [VERIFIED: read 2026-04-26]
- `obsidian/work/incoming/16-SAAS-SUITE.md` — Parts 2/3/4: Invoice schema, Stripe/MP integration, DIAN flow, QuickBooks/Siigo/Alegra schemas [VERIFIED: read 2026-04-26]
- `obsidian/brain/Pricing Engine Canon.md` — §Canonical Placeholder (sentinel policy) [VERIFIED: read 2026-04-26]
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — line 49 (`SaaSInvoice` object shape) [VERIFIED: read 2026-04-26]
- `lib/markos/webhooks/signing.cjs`, `engine.cjs`, `dlq.cjs`, `replay.cjs`, `breaker.cjs` — P203 webhook engine (REUSE substrate) [VERIFIED: read 2026-04-26]
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` [VERIFIED: grep confirmed]
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` [VERIFIED: grep confirmed]
- `lib/markos/plugins/registry.js:102` — `resolvePlugin` [VERIFIED: grep confirmed]
- `supabase/migrations/76_markos_cli_tenant_env.sql` — pgcrypto credential encryption pattern [VERIFIED: read 2026-04-26]
- `supabase/migrations/` slot inventory [VERIFIED: `ls` confirmed 2026-04-26]
- `.planning/phases/216-saas-suite-health-churn-support-usage/216-RESEARCH.md` — gold standard structure; slot inventory; P216 billing dependency on P215 tables [VERIFIED: read 2026-04-26]

### Secondary (MEDIUM confidence)

- `215-CONTEXT.md` — 5 non-negotiables + 7-step phase shape [VERIFIED: read 2026-04-26]
- `215-REVIEWS.md` — HIGH 2 (stubs + credential handling) + 9 MEDIUM concerns; prescribes exact trigger names [VERIFIED: read 2026-04-26]
- `DISCUSS.md` — Decision matrix (6 decisions) + Acceptance Gate [VERIFIED: read 2026-04-26]
- `.planning/REQUIREMENTS.md` — SAS-04..06, BILL-01, COMP-01, QA-01..15 definitions + traceability table [VERIFIED: read 2026-04-26]
- `.planning/ROADMAP.md` lines 313–328 — P215 ROADMAP entry + dependencies [VERIFIED: read 2026-04-26]
- P217/P218/P219 RESEARCH files — F-ID locks (F-247..F-258, F-238..F-246, F-228..F-237), slot locks (98-99, 101-106, 107-111) [VERIFIED: read 2026-04-26]

### Tertiary (LOW confidence — flag for execution validation)

- Siigo API v1 (`https://api.siigo.com/v1/invoices`) field names and sandbox behavior [ASSUMED based on 16-SAAS-SUITE.md documentation; validate at Plan 03 execution]
- Mercado Pago Preapproval API availability for Colombia recurring billing in current API version [ASSUMED; validate at Plan 03 execution]
- Stripe `^14.x` as current SDK version [ASSUMED; verify via `npm view stripe version` at Plan 02]
- DIAN `vpfe-hab.dian.gov.co` habilitación endpoint accessibility from development environment [ASSUMED; validate at Plan 03 execution]

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — pgcrypto VERIFIED; Stripe/MP SDK versions ASSUMED (validate at execution)
- Architecture: HIGH — all helper files, webhook engine, and migration slots VERIFIED on disk
- Compliance enforcement: HIGH — 7 DB-trigger names derived from CONTEXT non-negotiables and REVIEWS prescriptions
- Schema shapes: HIGH — derived from canon `obsidian/brain/SaaS Suite Canon.md` + incoming `16-SAAS-SUITE.md` TypeScript interfaces; exact field names match v2 Operating Loop Spec line 49
- Pitfalls: HIGH — P216 Q-6 slot ordering crisis pattern applied directly to Q-7; credential handling defense-in-depth from REVIEWS HIGH-2

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stable domain; Siigo/DIAN API specifics may drift faster — validate at execution)

---

## RESEARCH COMPLETE
