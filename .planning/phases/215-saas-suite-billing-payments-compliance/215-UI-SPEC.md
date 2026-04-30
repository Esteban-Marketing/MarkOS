---
phase: 215
slug: saas-suite-billing-payments-compliance
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: saas-billing-substrate-us-stripe-tax-quickbooks-co-mercadopago-siigo-dian-cufe-webhook-routing-corrections-dunning-future-payouts-credential-vault-defense-in-depth
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [215-01, 215-02, 215-03, 215-04, 215-05, 215-06]
plans_with_ui_surfaces: []
plans_no_ui: [215-01, 215-02, 215-03, 215-04, 215-05, 215-06]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `billing.charge` for refund/credit_note/write_off/discount/invoice_correction; `data.export` for evidence-pack export and audit-log export; `default_approval_mode == dual_approval` for refunds above threshold; autonomy-ceiling on billing.charge)
  - 207-UI-SPEC.md (RunApiEnvelope; `run_id` linked to billing-correction runs and webhook-routed runs; AgentRunEventType for processor lifecycle events; ApprovalHandoffRecord links 215 corrections to P208 inbox)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` extends with `billing_correction_approval` handoff_kind literal; Recovery Center extends with webhook DLQ inspector; Task Board consumes DIAN_REJECTION_CREATES_P1_TASK rows; Morning Brief and Weekly Narrative consume billing-event summaries)
  - 213-UI-SPEC.md (Tenant 0 readiness gate consumer — 213-04 public-proof boundary; 215 SOC2 evidence packs are PRIVATE doctrine and never published as public proof; 213-05 go/no-go opens P214-P217 SaaS Suite Activation gate)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; 215 `saas_invoices` FK to `saas_subscriptions`; 215 inherits the `business_type != 'saas'` gating contract; the 214-06 `<SaaSSubscriptionsTable />` extracted component is a downstream consumer of 215 invoice / payment / billing-event surfaces)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b .c-notice mandatory, D-13 .c-card--feature reserved, D-14 no .c-table, D-15 selective extraction)
translation_gates_dissolved_by_215:
  - "214-UI-SPEC §Mutation modal — `billing_charge_approval` handoff_kind extension dissolves into `billing_correction_approval` for the 5 correction_type literals (refund / credit_note / write_off / discount / invoice_correction). 215-05 `buildApprovalPackage` routes corrections through P208 Approval Inbox via this 5th literal; the 4-literal P207 handoff_kind set + the 5th P214 `billing_charge_approval` literal + the 6th P215 `billing_correction_approval` literal form the canonical chain. P208 surfaces consume the 6th literal verbatim."
  - "208-UI-SPEC §Recovery Center connector_placeholder family — extends with webhook DLQ inspector for the 5 processor endpoints (Stripe / Mercado Pago / QuickBooks / Siigo / DIAN). 215-04 emits DLQ records via P203 dlq.cjs with 7-day retention; future P208 Recovery Center extension reads `markos_webhook_deliveries` rows where `dlq_at IS NOT NULL` and `processor IN ('stripe','mercado_pago','quickbooks','siigo','dian')`. The DLQ row carries the redacted payload only — raw payloads are never persisted (Plan 01 redactWebhookPayload is upstream of any persist)."
  - "213-04 §Public-Proof Boundary consumer — 215 SOC2 evidence packs (`governance_evidence_packs` rows authored by 215-05) feed 213-04 case-study evidence chain. 215 evidence is PRIVATE doctrine: case-study claims may cite the EXISTENCE of an evidence pack (`evidence_pack_ref` UUID), but the evidence content (refund amount, customer NIT, processor response) is NEVER published. The 213-04 banned-phrases contract (`unlimited` / `instant` / `guaranteed` / `100%` / `bank-grade` / `military-grade`) applies to any future case-study that references a 215 correction outcome."
translation_gates_opened_by_215:
  - "future_phase_217_dian_wizard_ui — DIAN setup wizard 6-step UI consumes the 215-03 `advanceWizardState` state machine library (`pending → nit_registered → certificate_uploaded → test_invoice_sent → test_invoice_accepted → production_ready`). 215 ships the substrate; future P217+ admin extension ships the wizard frontend rendering each step. Future surfaces render `<PlaceholderBanner variant=\"future_phase_217_dian_wizard_ui\">` until that phase ships."
  - "future_phase_217_billing_setup_wizards — Stripe / QBO / Mercado Pago / Siigo configuration wizards. 215-02 and 215-03 ship the `api/v1/saas/billing/{us-config,co-config}.js` POST handlers that store credentials via Plan 01 storeCredentialVaultRef; future P217+ admin extension ships the multi-step credential entry UI. Future surfaces render `<PlaceholderBanner variant=\"future_phase_217_billing_setup_wizards\">` until that phase ships."
  - "future_phase_218_payout_dispatch — affiliate / partner / referral payout dispatch UI. 215-06 ships the `saas_future_payout_policies` table with 4 seed rows (`referral_reward`, `affiliate_commission`, `partner_payout`, `incentive_experiment`) all `planned_only=true`; P218 Plan 05 will UPDATE `planned_only=false` when the incentive experiment payout consumer is wired. P220 Plan 01 wires referral payouts; P220 Plan 05 wires affiliate + partner payouts. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_payout_dispatch\">` until those phases ship."
  - "future_phase_220_growth_payout_console — growth admin payout management surface. Composes referral / affiliate / partner / incentive payout queues over the 215-06 reservation seed; mutation-class binding `billing.charge` (per 206) with `default_approval_mode == dual_approval` (above threshold) per the 215-06 `saas_future_payout_policies.approval_required = true` invariant. Future surfaces render `<PlaceholderBanner variant=\"future_phase_220_growth_payout_console\">` until that phase ships."
---

# Phase 215 — UI Design Contract (no-UI-scope)

> **Phase 215 ships zero UI surfaces.** This document is the explicit
> no-surface declaration for the SaaS Suite Billing, Payments, and
> Multi-Country Compliance phase. There is no `app/`, no `components/`, no
> `*.stories.tsx`, no `page.tsx`, no `layout.tsx`, no `*.module.css`, and no
> `*.css` modified or created in any of the six plans (215-01 through 215-06).
>
> **Critical posture:** Phase 215 is the **billing and compliance
> substrate** of the SaaS Suite (US Stripe + Stripe Tax + QuickBooks; Colombia
> Mercado Pago + Siigo + DIAN CUFE/QR + IVA/retefuente/reteIVA/reteICA;
> processor webhook routing through P203 engine reuse; billing approvals,
> corrections, and dunning; future incentive payout reservation). Every
> visual surface that future phases will ship to render this substrate
> binds to the contracts authored here. The phase's risk posture is HIGH on
> two simultaneous dimensions — **multi-country legal-billing compliance**
> (DIAN P1 task on rejection within 24-hour SLA) and **sensitive credential
> handling** (raw certificates / API keys / webhook secrets MUST NEVER appear
> in logs, prompts, tasks, or MCP payloads per CONTEXT non-negotiable #3).
> The existing P208 Approval Inbox + Recovery Center, the P213.4 admin
> billing reconciliation page (`app/(markos)/admin/billing/page.tsx`), and
> the P213.3 tenant billing settings page (`app/(markos)/settings/billing/page.tsx`)
> CONSUME 215 contracts as downstream readers — they are NOT modified by
> this phase.
>
> What Phase 215 *does* ship is the **billing-payments-compliance
> substrate** — **Supabase migrations** (`supabase/migrations/118..123_saas_billing_*.sql`
> — 6 DDL slots covering `saas_invoices`, `saas_payment_attempts`,
> `saas_billing_events`, `saas_credential_vault_refs`, US `saas_processor_configs`
> + `saas_accounting_configs`, Colombia `saas_dian_config`,
> `saas_billing_corrections`, `saas_dunning_schedules`, `saas_future_payout_policies`),
> **typed billing modules** (`lib/markos/saas/billing/{contracts,invoice,payment-attempt,billing-event,credential-vault,log-redaction,llm-shield,preflight}.ts`
> + `lib/markos/saas/billing/us/{contracts,stripe-client,stripe-tax,quickbooks-client,quickbooks-sync}.ts`
> + `lib/markos/saas/billing/co/{contracts,mercadopago-client,mercadopago-preapproval,siigo-client,siigo-sync,dian-cufe,dian-wizard,colombia-tax}.ts`
> + `lib/markos/saas/billing/webhooks/{contracts,dispatcher,stripe-handler,mercadopago-handler,quickbooks-handler,siigo-handler,dian-handler}.ts`
> + `lib/markos/saas/billing/corrections/{contracts,correction,refund,credit-note,write-off,dunning,evidence-pack}.ts`
> + `lib/markos/saas/billing/payouts/{contracts,policy,translation-gate}.ts`),
> **MCP billing tools** (`lib/markos/mcp/tools/saas-billing.cjs` — 4 tools
> with `sanitizeBillingResponse` redactor: `get_invoice`,
> `list_invoices_by_tenant`, `get_payment_attempts`, `get_billing_events`),
> **Node API handlers** (`api/v1/saas/billing/{us-config,co-config,dian-wizard,corrections,dunning}.js`
> + `api/v1/saas/webhooks/{stripe,mercadopago,quickbooks,siigo,dian}.js` —
> 10 server-side route modules), **dunning cron**
> (`api/cron/saas-billing-dunning-runner.js`), **F-ID contracts**
> (`contracts/F-{271..286}-saas-*.yaml` — 16 IDs total: F-271 invoice + F-272 payment-attempt +
> F-273 billing-event + F-274 credential-vault + F-275 stripe-config +
> F-276 quickbooks-config + F-277 mercadopago-config + F-278 siigo-config +
> F-279 dian-config + F-280 webhook-routing + F-281 billing-correction +
> F-282 dunning-schedule + F-283 billing-evidence + F-284 saas-billing-api +
> F-285 saas-webhook-endpoints + F-286 saas-future-payout-policies),
> **payout reservation handoff doc**
> (`docs/billing-handoff/215-future-payout-policies.md`), and **tests**
> (`test/saas-215/{preflight, domain-1, domain-2, domain-3, domain-4, domain-5, domain-6, rls}/*.test.js`).
> None of those files compose, import, or render any visual primitive from
> `styles/components.css` or any token from `app/tokens.css`. The Node API
> handlers under `api/v1/saas/billing/**` and `api/v1/saas/webhooks/**` are
> server-side route modules (legacy `api/*.js` with no JSX, no rendering),
> not Next.js App Router pages.
>
> However, **every downstream phase (P208 admin extensions, P217+ growth /
> SaaS revenue / DIAN-wizard frontends, P218-P220 SaaS Marketing OS Strategy
> growth phases, future P227+ analytics) that consumes a Phase 215 billing
> contract WILL eventually need a UI surface** — billing reconciliation
> queues, DIAN setup wizard 6-step UI, Stripe / QBO / Mercado Pago / Siigo
> configuration wizards, invoice viewers with PII redaction, payment-attempt
> timelines, webhook DLQ inspectors, dunning state timeline viewers,
> refund / credit-note / write-off approval modals, evidence-pack browsers,
> DIAN rejection P1 task viewers, future payout policy previews, tax
> calculation audit logs. This UI-SPEC therefore also serves as a
> forward-looking inheritance map so future UI-SPECs can cite their lineage
> back to the billing doctrine defined here, AND as the load-bearing
> binding contract for **sensitive credential handling** that every future
> credential-display surface MUST honor (see §Sensitive Credential Handling
> — UI Binding Contract).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward
> (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13
> `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction)
> → 206-UI-SPEC (mutation-class origin: `billing.charge` for refund /
> credit_note / write_off / discount / invoice_correction; `data.export` for
> evidence-pack export; `default_approval_mode == dual_approval` for refunds
> above threshold; autonomy ceiling) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, `ApprovalHandoffRecord`; billing-correction runs and
> webhook-routed runs link via `agent_run_id`) → 208-UI-SPEC (PARENT —
> Approval Inbox extends `billing_correction_approval` handoff_kind; Recovery
> Center extends webhook DLQ inspector; Task Board reads DIAN P1 tasks) →
> 213-UI-SPEC (Tenant 0 readiness gate consumer; 213-04 public-proof boundary
> applies to 215 evidence packs) → 214-UI-SPEC (PARENT — SaaS Suite
> Activation; `saas_invoices` FK to `saas_subscriptions`; the 214-06
> `<SaaSSubscriptionsTable />` extracted component is the canonical
> downstream consumer of 215 invoice / payment / billing-event surfaces) →
> this document. Generated by gsd-ui-researcher. Status: draft (checker
> upgrades to approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all six
plans plus context, research, reviews, and validation. The full file set
declared in `files_modified` across 215-01..215-06 is enumerated below, with
surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Phase doctrine | `.planning/phases/215-saas-suite-billing-payments-compliance/{215-CONTEXT, 215-RESEARCH, 215-REVIEWS, 215-VALIDATION, 215-{01..06}-PLAN, 215-{01..06}-SUMMARY}.md` | 215-01..215-06 | NO |
| Billing handoff doctrine | `docs/billing-handoff/215-future-payout-policies.md` (1 doc) | 215-06 | NO (markdown only) |
| Migration coordination | `.planning/coordination/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (CREATE-or-APPEND) | 215-01 | NO |
| Billing contracts module | `lib/markos/saas/billing/{contracts.ts, contracts.cjs, index.cjs}` | 215-01 | NO (Zod / TS schemas only; CJS bridge) |
| Billing core substrate modules | `lib/markos/saas/billing/{invoice, payment-attempt, billing-event, credential-vault, log-redaction, llm-shield, preflight}.ts` (7 files) | 215-01 | NO (server-side TS modules; no JSX) |
| US billing path modules | `lib/markos/saas/billing/us/{contracts.ts, contracts.cjs, stripe-client.ts, stripe-tax.ts, quickbooks-client.ts, quickbooks-sync.ts, index.cjs}` (7 files) | 215-02 | NO |
| Colombia billing path modules | `lib/markos/saas/billing/co/{contracts.ts, contracts.cjs, mercadopago-client.ts, mercadopago-preapproval.ts, siigo-client.ts, siigo-sync.ts, dian-cufe.ts, dian-wizard.ts, colombia-tax.ts, index.cjs}` (10 files) | 215-03 | NO |
| Webhook routing modules | `lib/markos/saas/billing/webhooks/{contracts.ts, contracts.cjs, dispatcher.ts, stripe-handler.ts, mercadopago-handler.ts, quickbooks-handler.ts, siigo-handler.ts, dian-handler.ts, index.cjs}` (9 files) | 215-04 | NO (handler dispatchers; no JSX) |
| Corrections / dunning modules | `lib/markos/saas/billing/corrections/{contracts.ts, contracts.cjs, correction.ts, refund.ts, credit-note.ts, write-off.ts, dunning.ts, evidence-pack.ts, index.cjs}` (9 files) | 215-05 | NO |
| Future payouts modules | `lib/markos/saas/billing/payouts/{contracts.ts, contracts.cjs, policy.ts, translation-gate.ts, index.cjs}` (5 files) | 215-06 | NO |
| MCP billing tools | `lib/markos/mcp/tools/saas-billing.cjs` (1 file) | 215-01 | NO (CommonJS MCP descriptors; no JSX) |
| Migrations | `supabase/migrations/{118_saas_billing_invoice_contracts, 119_saas_billing_us_path, 120_saas_billing_co_path, 121_saas_billing_webhook_routing, 122_saas_billing_corrections_dunning, 123_saas_future_payout_policies}.sql` (6 files) | 215-01..215-06 | NO (SQL DDL) |
| Node API handlers | `api/v1/saas/billing/{us-config.js, co-config.js, dian-wizard.js, corrections.js, dunning.js}` (5 files) + `api/v1/saas/webhooks/{stripe.js, mercadopago.js, quickbooks.js, siigo.js, dian.js}` (5 files) | 215-02..215-05 | NO (legacy `api/*.js` route modules; no JSX, no rendering) |
| Cron handlers | `api/cron/saas-billing-dunning-runner.js` (1 file) | 215-05 | NO (cron route; no JSX) |
| Preflight scripts | `scripts/preconditions/215-{01..06}-check-upstream.cjs` (6 files) | 215-01..215-06 | NO (Node CLI assertion runners) |
| F-ID contract YAMLs | `contracts/F-{271..286}-saas-*.yaml` (16 files) + `contracts/flow-registry.json` updates | 215-01..215-06 | NO |
| Test files | `test/saas-215/{preflight, domain-1, domain-2, domain-3, domain-4, domain-5, domain-6, rls, closeout}/*.test.js` + `test/fixtures/saas-215/*.js` | 215-01..215-06 | NO |

**Search assertions** (verified during scope confirmation; ripgrep across all
six plan files in `files_modified` blocks):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 215-01..215-06 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 215-01..215-06 | 0 matches |
| `files_modified` glob `components/**` across 215-01..215-06 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 215-01..215-06 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 215-01..215-06 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 215-01..215-06 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |

**Disambiguation note (legacy Node API path syntax):** The 10 files under
`api/v1/saas/billing/**` and `api/v1/saas/webhooks/**` and the 1 file under
`api/cron/**` are flat versioned legacy `api/*.js` handlers per the 215
architecture-lock pin (`api/v1/saas/billing.js` and `api/v1/saas/webhooks/*.js`
are legacy, NOT App Router pages). They emit JSON envelopes only; the
webhook handlers ack with HTTP 200 and route the redacted event downstream.
Visual rendering of invoice viewers, payment-attempt timelines, billing
reconciliation queues, DIAN wizard frontends, configuration wizards,
correction approval modals, dunning timelines, evidence-pack browsers, and
DLQ inspectors is downstream phases' responsibility (existing P208 cockpit
extensions, existing P213.3 / P213.4 billing pages as consumers, future
P217+ admin extensions, future P218-P220 growth modules).

**Disambiguation note (existing surfaces NOT modified by 215):** The
operator-cockpit surfaces shipped in P208
(`app/(markos)/operations/{tasks, approvals, recovery, narrative}/page.tsx`)
read 215 outputs as downstream consumers. The P213.4 admin billing
reconciliation page (`app/(markos)/admin/billing/page.tsx`,
`app/(markos)/admin/billing/page.module.css`,
`app/(markos)/admin/billing/reconciliation.stories.tsx`) is the canonical
operator-facing reconciliation surface; it will read 215 `saas_invoices` /
`saas_payment_attempts` / `saas_billing_events` rows as a future extension.
The P213.3 tenant billing settings page (`app/(markos)/settings/billing/page.tsx`,
`app/(markos)/settings/billing/page.module.css`,
`app/(markos)/settings/billing/page-shell.tsx`,
`app/(markos)/settings/billing/page.stories.tsx`,
`app/(markos)/settings/billing/actions.ts`) is the future home for the
billing-setup wizard; it will read the `api/v1/saas/billing/{us-config,co-config}.js`
sanitized status endpoints as a future extension. Phase 215 ships the
substrate; the placeholder dissolutions on those existing surfaces require
future P217+ admin extension phases. **215 itself does not modify any P208,
P213.3, or P213.4 file.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase is pure
billing-payments-compliance substrate authoring + contracts + Node API
handlers + migrations + MCP tools + CI scripts + tests + handoff doctrine.
There are no visual decisions to specify, no typography choices to lock, no
copywriting copy to draft for end-user surfaces, and no component primitives
to compose. **If the checker finds ANY UI surface in plan files_modified
blocks, BLOCK.**

---

## Design System

| Property | Value |
|----------|-------|
| Tool | not applicable — no UI surface authored in this phase |
| Preset | not applicable |
| Component library | not applicable |
| Icon library | not applicable |
| Heading font | not applicable |
| Body font | not applicable |
| Default theme | not applicable |
| Form authoring posture | not applicable — no forms (the legacy `api/*.js` POST handlers accept JSON request bodies; multipart PKCS12 upload on `dian-wizard.js` is a server-side parse via formidable/busboy, not a rendered form) |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money / pricing display posture | not applicable — money flows through `saas_invoices.amount_total` / `tax_total` / `iva_amount` / `retefuente_amount` / `reteiva_amount` / `reteica_amount` columns and `saas_billing_corrections.amount` columns; rendering of monetary values is downstream phases' responsibility (P213.3 billing settings consumes via existing actions; P213.4 admin reconciliation consumes via future extension; future P217+ admin extensions render via `<Money />` recipe per 214-UI-SPEC; `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel persists on `saas_billing_corrections.offer_details` until P205 lands per CLAUDE.md Pricing Engine Canon). **Phase 215 MUST NOT take pricing ownership.** |
| Table authoring posture | not applicable — registry tables in `docs/billing-handoff/215-future-payout-policies.md` are GitHub-flavored Markdown rendered by Markdown viewers, not React tables; F-ID contract YAMLs are doctrine prose only |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by the `pricing_recommendation_id` column on `saas_invoices` (215-01) and the `offer_details` column on `saas_billing_corrections` (215-05) per CLAUDE.md Pricing Engine Canon; appears verbatim in `test/saas-215/domain-5/save-offer-pricing-sentinel.test.js`; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/saas/billing/**` and `api/v1/saas/webhooks/**` are legacy Node `api/*.js` route modules. They emit JSON envelopes (sanitized billing status, sanitized correction records, processor webhook acks) and accept POST mutations gated by `requireHostedSupabaseAuth` + admin role + Plan 01 `sanitizeBillingResponse` on every response body. They DO NOT render HTML, JSX, or any visual surface. Future UI consumers parse the JSON; rendering is downstream. The `api/cron/saas-billing-dunning-runner.js` cron handler is gated by `x-markos-cron-secret` matching `MARKOS_SAAS_BILLING_CRON_SECRET` env per `api/cron/mcp-kpi-digest.js` pattern. |
| MCP tool posture | `lib/markos/mcp/tools/saas-billing.cjs` registers 4 tool descriptors (`get_invoice`, `list_invoices_by_tenant`, `get_payment_attempts`, `get_billing_events`) all with `sanitizeBillingResponse` recursively stripping the 12 `CREDENTIAL_FIELDS` + `vault_ref` from output. MCP tools emit structured JSON; they do NOT render. |
| Doctrine prose posture | `docs/billing-handoff/215-future-payout-policies.md` and the F-{271..286} contract YAMLs are markdown / YAML only; no rendered components inside. They are read by humans (auditor, planner, executor, P218 / P219 / P220 future planners) and parsed by CI scripts for forbidden-string and contract-baseline assertions. **Banned-lexicon enforcement applies to all doctrine prose** per CLAUDE.md "Banned lexicon" — the 4 PII-field-list constants (`STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS`) authored in 215-01 `lib/markos/saas/billing/log-redaction.ts` and the 5 redaction strings (`'[REDACTED]'`) are doctrine prose with zero-match required for `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in any doctrine surface. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 215 emits no CSS, no JSX, no terminal output (the
preflight CLI scripts are CI-only assertion runners with stdout limited to
`node --test` output format — no human-facing tabular display; the Node API
handlers emit JSON envelopes, not rendered markup; the dunning cron writes
to `markos_agent_runs` and structured logs only). Every spacing, typography,
and color decision is deferred to the downstream phases that will surface
this billing substrate. When those phases ship, they MUST cite DESIGN.md
v1.1.0 token canon directly:

| Token canon citation chain | DESIGN.md v1.1.0 source |
|----------------------------|--------------------------|
| `--space-{none,xxs,xs,sm,md,lg,xl,xxl}` | `spacing.{none,xxs,xs,sm,md,lg,xl,xxl}` |
| `--font-mono` (JetBrains Mono) for headings + IDs + monetary code | `typography.h1..h4`, `typography.code-inline` |
| `--font-sans` (Inter) for body + lead + caption | `typography.body-md`, `typography.lead`, `typography.body-sm`, `typography.label-caps` |
| `--color-surface` (`#0A0E14` Kernel Black) page background; `--color-surface-raised` (`#1A1F2A` Process Gray) cards; `--color-surface-overlay` (`#242B38`) modals; `--color-border` (`#2D3441` Border Mist) hairlines; `--color-on-surface` (`#E6EDF3` Terminal White), `--color-on-surface-muted` (`#7B8DA6` Vault Slate), `--color-on-surface-subtle` (`#6B7785` Comment Gray) text; `--color-primary` (`#00D9A3` Protocol Mint) signal; `--color-primary-text` mint-as-text per D-09; `--color-primary-subtle` mint wash; `--color-error` (`#F85149`), `--color-warning` (`#FFB800`), `--color-success` (`#3FB950`), `--color-info` (`#58A6FF`) state colors | `colors.{surface,surface-raised,surface-overlay,border,on-surface,on-surface-muted,on-surface-subtle,primary,primary-text,primary-subtle,error,warning,success,info}` |
| `.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block` primitives | `styles/components.css` v1.1.0 |
| `--focus-ring-width: 2px` solid `var(--color-primary)` with `--focus-ring-offset: 2px`, never suppressed | `app/tokens.css` lines per DESIGN.md "Focus" |
| `prefers-reduced-motion` collapses transitions to 0ms; kernel-pulse status dot freezes at full opacity | DESIGN.md "Motion" |

Future surfaces consuming 215 substrate MUST honor the **213.4 carry-forward
decisions** verbatim (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice`
mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15
selective extraction). See §Sensitive Credential Handling — UI Binding
Contract for the load-bearing additions specific to 215 credential
surfaces.

---

## Inheritance Bindings (load-bearing)

This section is the **doctrine binding** for every future surface that will
render 215 substrate. Every approval, lifecycle, mutation, pricing, and
correction field rendered in any future SaaS billing surface MUST cite the
upstream contract verbatim. Auto-FAIL conditions: any field name re-derived
without citation; any state literal not enumerated below; any approval gate
that omits the 206 mutation-class binding; any pricing render that
hard-codes a dollar literal or tier-name string; any credential render that
violates §Sensitive Credential Handling — UI Binding Contract.

### From 206-UI-SPEC §Mutation-class doctrine

| Future surface element | 206 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Refund / credit_note / write_off / discount / invoice_correction modals | `mutation-class-policy.md` (206-02-01) — `billing.charge` root mutation class | `mutation_class == 'billing.charge'`, `default_approval_mode`, `autonomy_ceiling`, `evidence_required` | Every correction modal carries a `.c-chip-protocol` chip "Root: `billing.charge`" rendering the exact 206 literal. The 5 correction_type literals (`refund`, `credit_note`, `write_off`, `discount`, `invoice_correction`) all inherit `billing.charge`. |
| Refund-above-threshold approval mode | `mutation-class-policy.md`'s `default_approval_mode == dual_approval` policy | `dual_approval` for refund `amount > threshold` (per 206 policy); `single_approval` for refund below threshold; `single_approval` for credit_note + invoice_correction; `dual_approval` always for write_off and discount per 215-05 BILLING_CORRECTION_REQUIRES_APPROVAL trigger | Approval-mode chip `.c-badge--info` on every correction-row metadata |
| Autonomy ceiling on billing.charge | `mutation-class-policy.md`'s `autonomy_ceiling` field | When ceiling reached for `billing.charge`, all correction action buttons are auto-blocked; UI renders `.c-notice c-notice--error` with `[block] Autonomy ceiling reached for billing.charge` | Always shown above the correction action menu when applicable |
| Evidence-required gate for billing corrections | `mutation-class-policy.md`'s `evidence_required` flag | `evidence_required == true` for every correction; `evidence_pack_ref` FK to `governance_evidence_packs` (P206) is REQUIRED before `approved_at` is set per 215-05 BILLING_CORRECTION_REQUIRES_APPROVAL trigger | Action buttons disabled until `evidence_pack_ref IS NOT NULL`; row evidence rail shows pack ID via `.c-chip-protocol` |
| Evidence-pack export action | `mutation-class-policy.md` 6 root classes — `data.export` | "Export evidence pack" button binds to `data.export`; default approval mode `single_approval`; modal confirms reason + scope (single correction / tenant range / all) | `.c-button--secondary` action; opens `.c-modal` with reason field |
| Audit-log export action | `mutation-class-policy.md` — `data.export` | "Export billing audit log" button binds to `data.export`; reads `saas_billing_events` rows for the requested range | `.c-button--secondary` action |

### From 207-UI-SPEC §Orchestration substrate

| Future surface element | 207 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Billing-correction run timeline | `RunApiEnvelope` (207-01) | `run_id`, `agent_run_id`, `chain_id`, `status`, `started_at`, `completed_at`, `error_class` | Each correction with an associated agent run renders `<RunStatusBadge run_id={...}>` linked to the 207 run-detail surface |
| Webhook-routed run timeline | `AgentRunEventType` (207-02) | `event_type` literals: `webhook_received`, `signature_verified`, `idempotency_check`, `dispatch_to_handler`, `handler_completed`, `dlq_enqueued` | Webhook delivery rows in future DLQ inspector render the `AgentRunEventType` chain via `<EventTimeline>` recipe |
| Approval-handoff link from correction to inbox | `ApprovalHandoffRecord` (207-04-01) | `run_id`, `handoff_kind == 'billing_correction_approval'` (215-05 extension), `approval_required == true`, `task_ref`, `reason`, `side_effect_kind == 'billing'`, `target_system == 'stripe' \| 'mercado_pago' \| 'siigo' \| 'quickbooks'`, `created_at` | Each pending correction renders an "Open in Approval Inbox →" `.c-button--tertiary` mint-text link deep-linking to `/operations/approvals?handoff_kind=billing_correction_approval&task_ref={correction_id}` |

### From 208-UI-SPEC §PARENT — Approval Inbox + Recovery Center + Task Board

| Future surface element | 208 contract source | Doctrine bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Approval Inbox handoff_kind filter chips | 208-04 §Approval Inbox handoff filter | 4 P207 literals (`approval`, `recovery`, `follow_up`, `manual_input`) + 5th P214 literal (`billing_charge_approval`) + **6th P215 literal (`billing_correction_approval`)** — total 6 chips | The `<ApprovalInboxFilters />` component MUST render exactly 6 filter chips; the 6th literal `billing_correction_approval` is consumed by 215-05 corrections via `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` |
| Approval Inbox routing for 215 corrections | 208-04 §Item rendering | 7-step routing pattern through P203 webhook engine (per 215-05 plan): (1) Operator submits correction via `api/v1/saas/billing/corrections.js` POST → (2) `requestRefund` / `createCreditNote` / `requestWriteOff` / `requestDiscount` / `applyInvoiceCorrection` calls `buildApprovalPackage` → (3) `agent_approval_packages` row inserted with `handoff_kind == 'billing_correction_approval'` → (4) P208 Approval Inbox displays via existing `/operations/approvals/page.tsx` → (5) Operator approves/rejects → (6) `approval_routing.ts` updates `saas_billing_corrections.approved_at + approved_by + approval_id` → (7) `evidence-pack.ts` writes `governance_evidence_packs` row + UPDATEs `evidence_pack_ref` FK | The Approval Inbox row MUST render the 5 correction_type literals as `.c-badge--info` chips (refund, credit_note, write_off, discount, invoice_correction) reading `saas_billing_corrections.correction_type` |
| Recovery Center webhook DLQ inspector (future P208 extension) | 208-05 §Recovery Center substrate | `markos_webhook_deliveries` rows where `dlq_at IS NOT NULL` AND `processor IN ('stripe', 'mercado_pago', 'quickbooks', 'siigo', 'dian')` | Future surface renders DLQ rows as `.c-card` with `.c-badge--error` "DLQ" chip; payload column renders `payload_redacted` only — raw payload is NEVER persisted (Plan 01 redactWebhookPayload is upstream) |
| Task Board DIAN rejection P1 task viewer | 208-03 §Task Board | `approval_tasks` rows where `task_type == 'dian_rejection_resolution'` AND `priority == 'P1'` AND `sla_at = created_at + 24h` per 215-03 DIAN_REJECTION_CREATES_P1_TASK trigger | Task Board renders P1 tasks at top of priority queue; `.c-badge--error` "P1" chip + `[err]` glyph; SLA countdown via `<SLA timer={sla_at}>` recipe (deferred to future P208 extension) |
| Morning Brief billing-event summary (future) | 208-02 §Morning Brief sections | `saas_billing_events` count + correction count + dunning-active count for the past 24h | Future P208 extension reads counts; renders `.c-card` brief item with `[info]`/`[warn]` glyph eyebrow |
| Weekly Narrative billing summary (future) | 208-06 §Weekly Narrative wins/risks | `saas_invoices.status` rollup + DIAN rejection count + dunning-resolved count for the past 7d | Future P208 extension reads rollups |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| Future surface element | 213 contract source | Doctrine bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| 215 evidence packs are PRIVATE doctrine | 213-04 §Public-Proof Boundary | `evidence_pack_ref` UUID may be cited in case-study claims; evidence content (refund amount, customer NIT, processor response) is NEVER published | Future case-study editor surfaces enforce: any reference to a 215 evidence pack renders the UUID via `.c-chip-protocol` only; pack content is fetched via authenticated `data.export` mutation, never embedded inline |
| Banned-phrases contract carries forward | 213-04 §Public-Proof banned phrases | `unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade` are banned in any case-study referencing a 215 correction outcome | CI assertion enforces zero-match in all case-study markdown referencing `evidence_pack_ref` |
| 213-05 go/no-go gate | 213-05 §214-217 go/no-go decision | P214-P217 SaaS Suite Activation gate MUST flip to `green` before any 215 surface ships in production; until then, future surfaces render `<PlaceholderBanner variant="future_phase_213_tenant0">` | The 215 backend substrate ships unconditionally (gate not required for backend-only); UI consumers gate on 213-05 |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| Future surface element | 214 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| `saas_invoices.subscription_id` FK | 214-02 §saas_subscriptions schema | `saas_subscriptions.subscription_id` PK | Every 215 invoice MUST FK to a 214 subscription; `<SaaSSubscriptionsTable />` extracted component (214-06) reads 215 invoice rows via subscription join |
| Subscription lifecycle event triggers 215 billing | 214-03 §Subscription lifecycle state machine | `saas_subscription_events` row with `event_type IN ('created', 'activated', 'cycle_renewed', 'plan_changed', 'cancellation_scheduled', 'canceled', 'past_due', 'paused', 'reactivated')` | 215 webhook handlers UPDATE `saas_subscriptions.current_state` based on processor events; the 214 lifecycle state machine is the source of truth |
| `business_type != 'saas'` gating contract | 214-06 §Surface gating contract | `business_type != 'saas'` tenants render single `.c-notice c-notice--info` page and never reach activation panel | Future 215 admin surfaces inherit the same gating: tenants without an active SaaS Suite activation (per 214 `saas_suite_activations.status`) MUST NOT see billing setup wizards |
| Growth-extension metadata posture | 214-06 §growth_extension metadata only | `.c-chip` badge labels growth-extension hint; no growth surface runnable until P218 ships; `<PlaceholderBanner variant="future_phase_217">` for growth-mode wizard placeholder | Future 215 surfaces that touch growth-loop billing render same posture |
| `<SaaSSubscriptionsTable />` extracted reuse | 214-06 §D-15 selective extraction | Component lives at `components/markos/tenant/SaaSSubscriptionsTable.tsx` | Future 215 billing reconciliation viewer (per P208 admin extension) reuses `<SaaSSubscriptionsTable />` verbatim with 215 invoice / payment-attempt joins |

### From 213.4-VALIDATION.md §Carry-forward (D-08..D-15)

| Carry-forward decision | Future-surface enforcement |
|-------------------------|------------------------------|
| **D-08** (token-only) | Every future 215 surface module CSS uses `var(--*)` tokens only — zero hex literals, zero hard-coded `font-size`/`font-weight`/`color`. Architecture-lock test asserts `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/(markos)/**/*.module.css` returns 0 in any 215-consuming surface. |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs ("Open correction →", "View evidence pack →", "Open Approval Inbox →"), and `.c-chip-protocol` IDs (`vault_ref`, `correction_id`, `dunning_schedule_id`, `cufe`, `dian_provider_response_id`, `stripe_tax_calculation_id`, `quickbooks_invoice_id`, `mercadopago_preapproval_id`, `siigo_document_id`) use `--color-primary-text`. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| **D-09b** (`.c-notice` mandatory) | Every gating state in future 215 surfaces (credentials-not-configured, DIAN-wizard-pending, dunning-paused, correction-approval-pending, evidence-pack-missing, future-phase-217-placeholder, future-phase-218-placeholder) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in any 215-consuming surface.** Billing reconciliation queue rows, DIAN wizard step cards, configuration wizard step cards, correction modals, dunning timeline rows, evidence-pack browser rows, DLQ inspector rows ALL use `.c-card` default. The `.c-card--feature` variant remains reserved for hero panels in 404-workspace + 213.5 marketing only. |
| **D-14** (no `.c-table` primitive) | Future 215 invoice list, payment-attempt list, billing-event timeline, correction queue, dunning schedule list, DLQ row list, future-payout-policy list ALL use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 218+. |
| **D-15** (selective extraction) | Future 215-consuming components extract to `components/markos/tenant/` or `components/markos/admin/` only when reuse is proven across ≥2 surfaces. Recommended extracted components (when downstream phases ship): `<BillingCorrectionRow />` (reused by Approval Inbox + correction queue + evidence browser), `<WebhookDLQRow />` (reused by Recovery Center + admin DLQ inspector), `<DianWizardStep />` (reused by setup wizard + audit timeline). |

---

## Sensitive Credential Handling — UI Binding Contract

**This section is load-bearing for every future surface that consumes 215
credential-vault-refs.** It is the canonical contract for rendering vaulted
credentials in any UI surface — admin extensions, tenant settings,
configuration wizards, MCP-driven assistant surfaces. Violation is
auto-FAIL.

### Defense-in-depth posture (5 layers — 215 ships layers 1–5; UI surfaces enforce layer 6)

| Layer | Component | Plan | Enforcement |
|-------|-----------|------|-------------|
| 1. Storage | `storeCredentialVaultRef` (Supabase Vault + pgcrypto fallback) | 215-01 `lib/markos/saas/billing/credential-vault.ts` | Plaintext credentials never persisted; only `vault_ref` UUID + Vault pointer |
| 2. DB-trigger | `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` | 215-01 migration 118 | INSERT into `saas_credential_vault_refs` with plaintext `credential_value` blocked at DB level |
| 3. MCP sanitization | `sanitizeBillingResponse` recursively strips 12 `CREDENTIAL_FIELDS` + `vault_ref` | 215-01 `lib/markos/mcp/tools/saas-billing.cjs` | All MCP tool output passes through; field-name allowlist forbids credential surfaces |
| 4. Log redaction | `redactWebhookPayload` with 4 PII-field-list constants | 215-01 `lib/markos/saas/billing/log-redaction.ts` | Webhook payloads logged as `payload_redacted` only; raw payloads NEVER persisted |
| 5. Prompt-injection defense | `stripCredentialsForLLM` strips `vault://`, `pgcrypto-ref:`, `sk_live_`, `sk_test_`, `APP_USR-`, `TEST-` patterns from any LLM context | 215-01 `lib/markos/saas/billing/llm-shield.ts` | Any LLM call carrying billing context filtered upstream |
| 6. **UI surface enforcement (this contract)** | Every future credential-display surface | This document | Bindings below |

### UI binding contract for future credential-display surfaces

Future surfaces consuming 215 credential-vault-refs MUST honor every binding:

| Binding | Rule | Verification |
|---------|------|--------------|
| **B-1. Allowed display fields** | Render ONLY: `vault_ref` UUID, `processor_name` (literal: `stripe`, `mercado_pago`, `quickbooks`, `siigo`, `dian`), `last_used_at` timestamp, `is_active` boolean, `created_at`, `updated_at`, `environment` (`sandbox \| habilitacion \| production`). NEVER render: `credential_value`, raw `secret_key`, `webhook_secret`, `access_token`, `oauth_token`, `realm_id`, `pkcs12_certificate`, `pkcs12_password`, `authorization_token` (ClTec), `software_pin`, or any field listed in `CREDENTIAL_FIELDS` (12 total) per 215-01 `credential-vault.ts`. | Architecture-lock test asserts `grep -P '\\b(secret_key\|webhook_secret\|access_token\|oauth_token\|pkcs12_password\|authorization_token\|software_pin)\\b' app/(markos)/**/*.{tsx,module.css}` returns 0 |
| **B-2. `vault_ref` chip rendering** | The `vault_ref` UUID is rendered via `<.c-chip-protocol>` (D-09 mint-as-text); the chip text contains the UUID surrounded by `[ ]` per `.c-chip-protocol::before/::after` content rules; never displayed as fill | Visual regression: `<VaultRefChip vault_ref={...}>` Storybook story asserts mint text only |
| **B-3. PII-field redaction** | For any field tagged in the 4 PII-field-list constants (`STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS`) authored in 215-01 `log-redaction.ts`, render `[redacted]` placeholder verbatim using `.c-code-inline` + `--color-on-surface-subtle`. Examples: `email: [redacted]`, `last4: [redacted]`, `ip_address: [redacted]`, `phone: [redacted]` | Architecture-lock test asserts `grep -c '\\[redacted\\]' app/(markos)/**/*.tsx` >= count of PII display fields |
| **B-4. Clipboard copy block on credential displays** | `onCopy` event handler MUST `preventDefault()` for any DOM node containing a credential display; future component `<CredentialBlock>` exposes `onCopy` interceptor. The `<.c-chip-protocol>` chip itself MAY be copied (it contains only the public `vault_ref` UUID); the parent container with full row metadata MUST NOT be copyable as a single block. | Storybook interaction test asserts `clipboard.writeText` is never invoked on credential block |
| **B-5. Audit-log every credential view** | Every render of a credential-display surface MUST emit a `saas_billing_events` row with `event_type == 'credential_view'` AND `actor == requesting_user.id` AND `vault_ref == displayed_vault_ref` AND `payload_redacted == { displayed_fields: [...] }`. The audit emit happens server-side in the API handler that serves the credential metadata, NOT client-side. | API handler test asserts `INSERT INTO saas_billing_events` row count == 1 per credential metadata fetch |
| **B-6. No raw credential round-trip** | Future credential-update wizards (Stripe / QBO / MP / Siigo config) accept plaintext via POST body, then immediately `storeCredentialVaultRef` server-side, clear request body from request log, and respond with vault_ref + sanitized status only. The response body NEVER echoes the submitted plaintext. The client form input MUST clear immediately on submit success (controlled component reset). | API handler test asserts response body matches `{ success: true, vault_ref: <uuid>, ... }` schema with no plaintext fields |
| **B-7. DIAN wizard certificate upload (215-03 surface contract)** | Future DIAN setup wizard 6-step UI consumes `advanceWizardState` from 215-03 `dian-wizard.ts`. The `certificate_upload` step is a destructive action: PKCS12 certificate file + password are uploaded via multipart form-data; both MUST be stored via `storeCredentialVaultRef('dian_pkcs12_certificate', ...)` AND `storeCredentialVaultRef('dian_pkcs12_password', ...)` BEFORE any other state change. The wizard MUST render a `<.c-notice c-notice--info>` reading verbatim "[info] DIAN compliance step {N} of 6" for each step (N ∈ {1..6}); the certificate-upload step ALSO renders a confirmation `<.c-modal>` with verbatim copy "[block] DIAN credentials cannot be edited after upload — only revoked and re-uploaded with a fresh certificate". The modal confirm button is `.c-button--destructive` with copy verbatim "Upload and seal credentials"; the cancel button is `.c-button--tertiary` with copy "Cancel — keep wizard at certificate step". | Storybook story `<DianWizard step="certificate_uploaded">` asserts both literal copy strings present; interaction test asserts confirm path calls vault store before any other persist |
| **B-8. Banned-lexicon zero-match on doctrine prose + redaction strings** | The 4 PII-field-list constants (`STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS`) authored in 215-01 are doctrine prose; CLAUDE.md banned lexicon enforced at zero-match: `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener); zero exclamation points. The 5 redaction strings (`'[REDACTED]'` literal) are doctrine prose with same enforcement. | CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `lib/markos/saas/billing/log-redaction.ts` + `docs/billing-handoff/215-future-payout-policies.md` + all F-{271..286} contract YAMLs — zero matches required |

---

## Downstream UI Inheritance Map (future surfaces consuming 215 contracts)

This is the forward-looking inventory of every future UI surface that will
consume 215 substrate. Each row carries: surface name, owning future phase,
215 substrate dependency, mutation-class binding (if applicable), placeholder
banner posture (until owning phase ships).

| Future surface | Owning future phase | 215 substrate consumed | Mutation-class binding | Placeholder until owning phase ships |
|----------------|---------------------|------------------------|------------------------|---------------------------------------|
| SaaS billing reconciliation queue (operator) | future P208 admin extension (P217+ likely) | `saas_invoices` + `saas_payment_attempts` + `saas_billing_events` | `data.export` for export action | Existing P213.4 `app/(markos)/admin/billing/page.tsx` renders future-phase placeholder for P215 reconciliation rows; `<PlaceholderBanner variant="future_phase_217_billing_reconciliation">` |
| DIAN setup wizard 6-step UI (admin) | future P217+ admin extension | `saas_dian_config` + `advanceWizardState` (215-03) + 6 wizard states (`pending`, `nit_registered`, `certificate_uploaded`, `test_invoice_sent`, `test_invoice_accepted`, `production_ready`) | `data.export` for state export | `<PlaceholderBanner variant="future_phase_217_dian_wizard_ui">` |
| Stripe / QBO config wizard (US admin) | future P217+ admin extension | `saas_processor_configs` (Stripe row) + `saas_accounting_configs` (QBO row) + 5 US credential ENUMs via `storeCredentialVaultRef` | n/a (config not a billing.charge mutation) | `<PlaceholderBanner variant="future_phase_217_billing_setup_wizards">` |
| Mercado Pago / Siigo config wizard (CO admin) | future P217+ admin extension | `saas_processor_configs` (MP row) + `saas_accounting_configs` (Siigo row) + 6 CO credential ENUMs via `storeCredentialVaultRef` | n/a | `<PlaceholderBanner variant="future_phase_217_billing_setup_wizards">` |
| Invoice viewer with PII redaction (tenant settings) | future P213.3 extension | `saas_invoices` + line items + tax breakdown + redacted PII fields per 4 PII-field-list constants | `data.export` for invoice export | Existing P213.3 `app/(markos)/settings/billing/page.tsx` renders future-phase placeholder; `<PlaceholderBanner variant="future_phase_217_invoice_viewer">` |
| Payment attempt timeline (operator) | future P208 admin extension | `saas_payment_attempts` joined to `saas_invoices` + `signature_verified_at` + `dispatch_outcome` | n/a (read-only) | `<PlaceholderBanner variant="future_phase_217_payment_timeline">` |
| Webhook DLQ inspector (Recovery Center extension) | future P208-05 extension | `markos_webhook_deliveries` rows where `dlq_at IS NOT NULL` AND `processor IN ('stripe', 'mercado_pago', 'quickbooks', 'siigo', 'dian')` (P203 substrate + 215-04 routing); `payload_redacted` only | `connector.mutate` for replay action | Existing P208 Recovery Center renders `<PlaceholderBanner variant="future_phase_217_webhook_dlq_inspector">` |
| Dunning state timeline viewer (operator) | future P208 admin extension | `saas_dunning_schedules` + day-0-to-45 state transitions (`active`, `resolved`, `failed`, `paused`, `expired`) + outcome_jsonb | `billing.charge` for retry action; `data.export` for timeline export | `<PlaceholderBanner variant="future_phase_217_dunning_timeline">` |
| Refund / credit-note approval modal (Approval Inbox extension) | future P208-04 extension | `saas_billing_corrections` rows where `correction_type IN ('refund', 'credit_note', 'write_off', 'discount', 'invoice_correction')` AND approval pending | `billing.charge` (root); `default_approval_mode == dual_approval` for refund-above-threshold + write_off + discount | Existing P208 Approval Inbox renders the 6th `billing_correction_approval` filter chip; row rendering deferred to future extension; `<PlaceholderBanner variant="future_phase_217_correction_modal">` |
| Evidence pack browser (SOC2 admin) | future P208 admin extension (or future P209 surface) | `governance_evidence_packs` rows linked from `saas_billing_corrections.evidence_pack_ref` | `data.export` for pack export | `<PlaceholderBanner variant="future_phase_217_evidence_browser">` |
| DIAN rejection P1 task viewer (Task Board consumer) | existing P208-03 Task Board (215-03 already triggers task creation; surface display already exists per P208) | `approval_tasks` rows where `task_type == 'dian_rejection_resolution'` AND `priority == 'P1'` AND `sla_at = created_at + 24h` per 215-03 DIAN_REJECTION_CREATES_P1_TASK trigger | `connector.mutate` for resolve action | **NO placeholder needed** — P208 Task Board already renders P1 rows; 215-03 DB-trigger creates tasks consumed by existing surface |
| Future payout policy preview (growth admin) | future P218 / P220 admin extension | `saas_future_payout_policies` (4 seed rows; `planned_only=true`) | `billing.charge` for activation | `<PlaceholderBanner variant="future_phase_218_payout_dispatch">` and `<PlaceholderBanner variant="future_phase_220_growth_payout_console">` |
| Tax calculation audit log (US admin) | future P217+ admin extension | `saas_invoices.stripe_tax_calculation_id` + `tax_lines` JSONB + `sales_tax_calculated_at` per 215-02 STRIPE_INVOICE_REQUIRES_TAX_CALCULATION trigger | `data.export` | `<PlaceholderBanner variant="future_phase_217_tax_audit_log">` |
| Colombian tax breakdown viewer (CO admin) | future P217+ admin extension | `saas_invoices.iva_amount` + `retefuente_amount` + `reteiva_amount` + `reteica_amount` + `tax_total` per 215-03 `colombia-tax.ts` | `data.export` | `<PlaceholderBanner variant="future_phase_217_co_tax_viewer">` |

---

## Translation Gate Dissolution and Opening

This is a **load-bearing section unique to Phase 215** because 215 closes
several upstream translation gates and opens new downstream ones.

### Gates dissolved by Phase 215 (downstream surfaces remove these placeholders)

| Upstream surface | Placeholder authored | Dissolution rule once 215 ships |
|------------------|---------------------|----------------------------------|
| 214-UI-SPEC §Mutation modal (handoff_kind extension) | `billing_charge_approval` 5th literal extending P207 4-set | 215-05 `buildApprovalPackage` routes 5 correction types through P208 Approval Inbox via the 6th literal `billing_correction_approval`. The full canonical chain is now: P207 4-set (`approval`, `recovery`, `follow_up`, `manual_input`) + P214 5th (`billing_charge_approval`) + P215 6th (`billing_correction_approval`) = 6 literals. P208 surfaces consume the 6th literal verbatim once 215 lands; the existing P208 `app/(markos)/operations/approvals/page.tsx` filter-chip group must extend from 4 chips to 6 chips in a future P208 patch. |
| 208-UI-SPEC §Recovery Center connector_placeholder family | Webhook DLQ inspector placeholder for processor endpoints | 215-04 emits DLQ records via P203 `dlq.cjs` with 7-day retention and `processor IN ('stripe', 'mercado_pago', 'quickbooks', 'siigo', 'dian')`. Future P208-05 Recovery Center extension reads `markos_webhook_deliveries` rows; the DLQ inspector becomes implementable. The DLQ row carries `payload_redacted` only — raw payloads never persisted (Plan 01 redactWebhookPayload upstream of every persist). |
| 213-04 §Public-Proof Boundary consumer | Case-study evidence chain placeholder for billing outcomes | 215-05 evidence packs (`governance_evidence_packs` rows) feed 213-04 case-study evidence chain. 215 evidence is PRIVATE doctrine: case-study claims may cite the EXISTENCE of an evidence pack (`evidence_pack_ref` UUID) but NEVER the content. The 213-04 banned-phrases contract (`unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade`) applies to any future case-study referencing a 215 correction outcome. |

### Gates opened by Phase 215 (future surfaces must render these placeholders)

| Downstream consumer (future phase) | Placeholder required | Dissolution phase |
|-------------------------------------|----------------------|---------------------|
| **future_phase_217_dian_wizard_ui** — DIAN setup wizard 6-step UI | `<PlaceholderBanner variant="future_phase_217_dian_wizard_ui">` until P217+ admin extension ships the wizard frontend rendering each of `pending`, `nit_registered`, `certificate_uploaded`, `test_invoice_sent`, `test_invoice_accepted`, `production_ready` steps | future P217+ admin extension phase |
| **future_phase_217_billing_setup_wizards** — Stripe / QBO / Mercado Pago / Siigo config UI | `<PlaceholderBanner variant="future_phase_217_billing_setup_wizards">` until P217+ admin extension ships the multi-step credential entry UI | future P217+ admin extension phase |
| **future_phase_218_payout_dispatch** — affiliate / partner / referral / incentive_experiment payout dispatch UI | `<PlaceholderBanner variant="future_phase_218_payout_dispatch">` until P218 Plan 05 (incentive_experiment), P220 Plan 01 (referral), P220 Plan 05 (affiliate + partner) UPDATE `saas_future_payout_policies.planned_only=false` for the relevant `payout_type` row | P218 (incentive_experiment) / P220 Plan 01 (referral) / P220 Plan 05 (affiliate + partner) |
| **future_phase_220_growth_payout_console** — growth admin payout management surface | `<PlaceholderBanner variant="future_phase_220_growth_payout_console">` until P220 ships the growth payout console | P220 |

---

## Acceptance Criteria (no-UI variant)

This phase produces no UI artifacts. The acceptance criteria for this UI-SPEC
are documentation-only:

- [ ] **AC-1.** No-UI declaration verified by reading `files_modified` block
  in 215-01..215-06 PLAN.md files; zero `app/`, `components/`, `*.stories.tsx`,
  `page.tsx`, `layout.tsx`, `*.module.css`, `*.css` matches.
- [ ] **AC-2.** Authority chain cited verbatim: DESIGN.md v1.1.0 →
  213.4-VALIDATION.md carry-forward (D-08..D-15) → 206 → 207 → 208 → 213 → 214.
- [ ] **AC-3.** Translation gates dissolved enumerated (3 minimum: 214
  `billing_charge_approval` extension, 208 Recovery Center DLQ family, 213-04
  public-proof boundary consumer).
- [ ] **AC-4.** Translation gates opened enumerated (4 minimum:
  `future_phase_217_dian_wizard_ui`, `future_phase_217_billing_setup_wizards`,
  `future_phase_218_payout_dispatch`, `future_phase_220_growth_payout_console`).
- [ ] **AC-5.** §Sensitive Credential Handling — UI Binding Contract authored
  with 8 bindings (B-1..B-8) load-bearing for future credential-display
  surfaces.
- [ ] **AC-6.** §Downstream UI Inheritance Map enumerated (13 future surfaces
  with owning phase + substrate dependency + mutation-class binding +
  placeholder posture).
- [ ] **AC-7.** Inheritance citations include 206 mutation-class
  (`billing.charge` for 5 correction types; `data.export` for evidence/audit
  exports; `default_approval_mode == dual_approval` for refunds above
  threshold), 207 RunApiEnvelope (`run_id` linked to billing-correction runs +
  webhook-routed runs), 208 PARENT (Approval Inbox extension via
  `billing_correction_approval` handoff_kind 6th literal; 7-step routing
  through P203 webhook engine), 213 Tenant 0 (213-04 public-proof boundary
  for evidence packs as PRIVATE doctrine; banned-phrases contract enforced),
  214 PARENT (`saas_invoices` FK to `saas_subscriptions`; lifecycle events
  trigger billing), and 213.4 D-08..D-15 carry-forward.
- [ ] **AC-8.** Banned-lexicon zero-match enforced on doctrine prose
  (`docs/billing-handoff/215-future-payout-policies.md`, F-{271..286} contract
  YAMLs, `lib/markos/saas/billing/log-redaction.ts` 4 PII-field-list
  constants + 5 redaction strings).

---

## Checker Sign-Off

This is a no-UI-scope phase. The 6-pillar audit applies to documentation
quality only.

- [ ] Dimension 1 Copywriting: PASS (no UI copy authored; banned-lexicon
  zero-match enforced on doctrine prose; 8 sensitive credential UI binding
  copy strings include verbatim "[info] DIAN compliance step {N} of 6",
  "[block] DIAN credentials cannot be edited after upload — only revoked and
  re-uploaded with a fresh certificate", "Upload and seal credentials",
  "Cancel — keep wizard at certificate step")
- [ ] Dimension 2 Visuals: PASS (no visuals authored; future surfaces inherit
  DESIGN.md v1.1.0 token canon)
- [ ] Dimension 3 Color: PASS (no color authored; future surfaces inherit
  60/30/10 split per DESIGN.md "Composition proportion": 70-80% surface +
  surface-raised, 15-20% on-surface + on-surface-muted + on-surface-subtle,
  3-5% primary + primary-text, 0-2% error + warning + info + success)
- [ ] Dimension 4 Typography: PASS (no typography authored; future surfaces
  inherit JetBrains Mono headings + IDs + monetary code; Inter body + lead +
  caption; no third typeface)
- [ ] Dimension 5 Spacing: PASS (no spacing authored; future surfaces inherit
  8px grid: 0/2/8/16/24/32/48/96 multiples of 4; off-grid values forbidden)
- [ ] Dimension 6 Registry Safety: PASS (not applicable — no shadcn registry,
  no third-party blocks; `Tool: none`)

**Approval:** pending (checker upgrades to approved YYYY-MM-DD once no-UI
declaration is verified and §Sensitive Credential Handling — UI Binding
Contract is sealed as load-bearing for downstream surfaces)
