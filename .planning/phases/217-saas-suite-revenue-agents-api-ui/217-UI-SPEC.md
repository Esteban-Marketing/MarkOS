---
phase: 217
slug: saas-suite-revenue-agents-api-ui
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-04
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: hybrid (5 no-UI backend plans + 1 heavy-UI plan shipping 10 dashboard pages)
ui_scope: 217-06 (App Router page tree under `app/saas/*` — 1 layout + 9 sub-route pages + activation gate + 12-row translation-gate seed)
plans_in_scope: [217-01, 217-02, 217-03, 217-04, 217-05, 217-06]
plans_with_ui_surfaces: [217-06]
plans_no_ui: [217-01, 217-02, 217-03, 217-04, 217-05]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `billing.charge` for SAS save_offer activation; `data.export` for revenue-metric export, audit-log export, evidence-pack export; `default_approval_mode` per SAS agent posture; autonomy-ceiling on SAS agents)
  - 207-UI-SPEC.md (PARENT — `RunApiEnvelope.run_id` linked to MRR snapshot crons + revenue-metric materialization runs + SAS agent runs; `AgentRunEventType` for `mrr_snapshot_started`/`mrr_snapshot_completed`/`reconciliation_flagged`/`waterfall_entry_recorded`; `AgentFailureClass` 7 literals on cron + agent failure surfaces; `ApprovalHandoffRecord` links 217 SAS agent runs to P208 inbox)
  - 208-UI-SPEC.md (PARENT — cockpit pattern reference; settings shell + Approval Inbox parent; Recovery Center; Task Board; surface-route contract registration via `lib/markos/operator/shell.ts` `surface_family: saas_*`; mobile_priority literals)
  - 213-UI-SPEC.md (Tenant 0 readiness gate consumer — 213-05 go/no-go opens P214-P217 SaaS Suite Activation gate; 213-04 public-proof boundary applies — 217 revenue facts, MRR, churn, support classifications are PRIVATE doctrine)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; `isSaaSSurfaceEnabled` 3-condition gate; `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` extracted reuse; 8 lifecycle states + 16 events + 16 transitions; `business_type != 'saas'` gating contract; `tenant_safe_auto_response_enabled` flag)
  - 215-UI-SPEC.md (PARENT — billing substrate; sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}`; sensitive credential UI binding contract — 6-layer defense-in-depth Layer 6; DIAN wizard 6-step state machine; 5 PII field constants STRIPE/MP/QB/SIIGO/DIAN; clipboard preventDefault; audit-log every credential view; 6th `billing_correction_approval` handoff_kind literal)
  - 216-UI-SPEC.md (PARENT — 4 UI binding contracts: health score 5-dim + 4 risk bands; support response 5-classifier + KB grounding + banned-lexicon zero-match BEFORE dispatch; save offer 215 modal reuse + sentinel; PII + retention 5 classification badges + 15-class lookup; 7th `support_response_approval` + 8th `save_offer_approval` handoff_kind literals; 7-playbook seed catalog)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b .c-notice mandatory, D-13 .c-card--feature reserved, D-14 no .c-table, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_217:
  - "216-UI-SPEC §future_phase_217_health_dashboard_ui — DISSOLVED by `app/saas/page.tsx` Overview KPI cards rendering health score + `<RiskBandBadge />` + 30-day trend chip + recalc CTA. The 5-dimension breakdown (`usage` 0.30, `support` 0.20, `billing` 0.20, `engagement` 0.15, `relationship` 0.15) renders via `<HealthScoreBadge />` extracted component (D-15). The 4 risk bands (`healthy` 80-100 / `watch` 60-79 / `at_risk` 40-59 / `critical` 0-39) render via `<RiskBandBadge />` extracted component. The `<PlaceholderBanner variant=\"future_phase_217_health_dashboard_ui\">` is REMOVED from 216-consuming surfaces."
  - "216-UI-SPEC §future_phase_217_at_risk_viewer — DISSOLVED by `app/saas/churn/page.tsx` consuming `get_at_risk_accounts` MCP tool + `saas_health_scores.risk_level IN ('at_risk', 'critical')` filter. Rows render via `<RiskBandBadge />` + `<HealthScoreBadge />` + intervention queue links. The `<PlaceholderBanner variant=\"future_phase_217_at_risk_viewer\">` is REMOVED."
  - "216-UI-SPEC §future_phase_217_pii_audit_log — DEFERRED to P218+ SOC2 admin extension. 217 does NOT ship the PII audit log surface. Future phase reservation preserved. (Translation gate kept open; not dissolved by 217.)"
  - "215-UI-SPEC §future_phase_217_dian_wizard_ui — DEFERRED to P218+ admin extension. 217 does NOT ship the DIAN setup wizard. The wizard surface composes `app/saas/invoices/page.tsx` Settings link to a P218+ wizard route. (Translation gate kept open; not dissolved by 217.)"
  - "215-UI-SPEC §future_phase_217_billing_setup_wizards — DEFERRED to P218+ admin extension. 217 does NOT ship Stripe/QBO/MP/Siigo configuration wizards. The wizards compose `app/saas/invoices/page.tsx` Settings link. (Translation gate kept open.)"
  - "215-UI-SPEC §future_phase_217_invoice_viewer — DISSOLVED by `app/saas/invoices/page.tsx` rendering invoice list with PII redaction per Sensitive Credential UI Binding Contract (Layer 6); table renders `[REDACTED]` for STRIPE_PII_FIELDS / MP_PII_FIELDS / SIIGO_PII_FIELDS / DIAN_PII_FIELDS / QB_PII_FIELDS; `<.c-chip-protocol>` for `vault_ref` UUID. The `<PlaceholderBanner variant=\"future_phase_217_invoice_viewer\">` is REMOVED."
  - "214-UI-SPEC §future_phase_217 (growth-extension activation wizard) — DEFERRED to P218+ via SG-01..12 translation gate seed. 217 ships the 12-row `saas_nav_visibility` planned-only seed; P218/P219/P220 Plan 06 will UPDATE planned_only=false + is_active=true. (Translation gate kept open.)"
translation_gates_opened_by_217:
  - "future_phase_218_growth_dashboards — 12-row `saas_nav_visibility` seed reserves 3 P218 namespaces (`saas_plg`, `saas_inapp`, `saas_experiments`) as `planned_only=true`. P218 Plan 06 UPDATEs to `planned_only=false + is_active=true`. The `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger validates activation gate at insert/update. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_growth_dashboards\">` until P218 Plan 06 ships."
  - "future_phase_219_partner_console — 12-row `saas_nav_visibility` seed reserves 4 P219 namespaces (`saas_expansion`, `saas_abm`, `saas_advocacy`, `saas_revenue_alignment`) as `planned_only=true`. P219 Plan 06 UPDATEs. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_partner_console\">`."
  - "future_phase_220_referral_console — 12-row `saas_nav_visibility` seed reserves 5 P220 namespaces (`saas_referral`, `saas_community`, `saas_events`, `saas_partnerships`, `saas_devrel`) as `planned_only=true`. P220 Plan 06 UPDATEs. Future surfaces render `<PlaceholderBanner variant=\"future_phase_220_referral_console\">`."
  - "future_phase_218_pii_audit_log_admin — 216-05 `data_retention_classes` 15-row catalog + retention sweep timeline + per-tenant PII class summary. P217 does NOT ship the SOC2 admin PII audit. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_pii_audit_log_admin\">`."
  - "future_phase_218_dian_wizard_ui_extension — 215-03 `advanceWizardState` 6-step state machine. P217 ships only a Settings link from `app/saas/invoices/page.tsx`. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_dian_wizard_ui_extension\">`."
---

# Phase 217 — UI Design Contract

> Visual and interaction contract for the **SaaS Suite operator dashboard surface**. Phase 217 is a HYBRID phase: five backend plans (217-01..05) ship migrations + libs + handlers + tests with **zero UI surface**, and a single UI plan (217-06) ships the **first heavy-UI dashboard tree of the v4.1.0 SaaS milestone** — one App Router layout, nine sub-route pages, an activation gate that reads P214 substrate, and a 12-row translation-gate seed reserving SG-01..12 namespaces for P218/P219/P220 Plan 06.
>
> **Critical posture:** 217-06 is the **first SaaS-Suite phase to ship a multi-page dashboard tree**. Every pixel cites DESIGN.md v1.1.0 token canon. Every approval gate cites 206 mutation-class doctrine. Every monetary render cites 205 `<Money fromPricingRecommendation>` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel. Every health/churn/support row cites 216 binding contracts (5-dim health, 4 risk bands, 5-classifier, KB grounding, save-offer sentinel, PII redaction). Every invoice row cites 215 sensitive-credential UI binding contract (`[REDACTED]` for 5 PII field constants, `<.c-chip-protocol>` for `vault_ref`, clipboard `preventDefault()` block, audit-log `event_type == 'credential_view'`). Every nav row cites 214 `isSaaSSurfaceEnabled` 3-condition gate (`business_type=='saas'` AND `activation_status=='active'` AND `tenant_0_readiness_gate.status=='opened'`).
>
> **Surface gating contract (load-bearing):** `app/saas/layout.tsx` server-renders the activation gate before any child page mounts. Gate-failure paths render a single `<.c-notice c-notice--info>` (or `--warning` / `--error` per reason) with one of 4 named reasons (`gated_by_business_type` / `activation_pending` / `tenant_0_gate_closed` / `saas_surface_disabled`) — verbatim copy contract per reason. Child pages MUST NOT render when the gate is closed; the layout returns the gate notice and exits.
>
> **Architecture-lock note:** Per 217-06-PLAN truths and 217-RESEARCH §Architecture Lock — `app/(saas)/*` route group is **FORBIDDEN**; `app/saas/*` plain folder is OK. Architecture-lock applies to `/api/.../route.ts` not the `app/*` page tree. The closeout `architecture-lock-rerun.test.js` explicitly scans for absence of the `app/(saas)/` folder.
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward (D-08..D-15 + D-21) → 205-UI-SPEC (Pricing Engine sentinel origin) → 206-UI-SPEC (mutation-class doctrine origin) → 207-UI-SPEC (RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord) → 208-UI-SPEC (cockpit pattern parent) → 213-UI-SPEC (T0 gate consumer + public-proof boundary) → 214-UI-SPEC (PARENT — SaaS Suite Activation; extracted components; 8-state lifecycle) → 215-UI-SPEC (PARENT — billing substrate + sensitive credential UI binding) → 216-UI-SPEC (PARENT — 4 UI binding contracts) → this document. Generated by gsd-ui-researcher 2026-05-04. Status: draft (checker upgrades to approved once 6-pillar audit passes).

---

## Plan Scope Classification

| Plan | Wave | Title | UI Scope | Primary Surface | Mobile Priority |
|------|------|-------|----------|-----------------|-----------------|
| **217-01** | 1 | Architecture-lock + assertUpstreamReady + revenue metric definitions + 5-tier source precedence | NO_UI | `supabase/migrations/98_saas_revenue_intelligence.sql`, `lib/markos/saas/revenue/{contracts,definitions,source-precedence,reconciliation}.ts`, `lib/markos/saas/preflight/*.ts`, `scripts/preconditions/217-01-check-upstream.cjs` | n/a |
| **217-02** | 2 | MRR snapshot + waterfall + cohort retention + nightly cron | NO_UI | `supabase/migrations/98_saas_revenue_intelligence.sql` (APPEND), `lib/markos/saas/mrr/{snapshot,waterfall,cohort,materializer}.ts`, `api/cron/saas-mrr-snapshot.js`, `api/cron/saas-mrr-waterfall.js` | n/a |
| **217-03** | 3 | SAS agent readiness registry (SAS-01..06) + SAS-10 invariant | NO_UI | `supabase/migrations/99_sas_agent_readiness.sql`, `lib/markos/saas/sas-agents/{contracts,registry,readiness-gate}.ts` | n/a |
| **217-04** | 3 | `/v1/saas/*` API endpoints (12 endpoints across 8 handler files) | NO_UI | `api/v1/saas/{subscriptions,plans,invoices,health,metrics,agents,tasks,approvals}.js` | n/a |
| **217-05** | 4 | `markos-saas` MCP tools (10 read-only) | NO_UI | `lib/markos/mcp/tools/saas.cjs`, `lib/markos/mcp/tools/index.cjs` (registry append) | n/a |
| **217-06** | 4 | SaaS UI nav + activation gate + 10-page App Router tree + translation gate seed | **IN_SCOPE** | `app/saas/{layout,page,subscriptions,plans,revenue,revenue/waterfall,churn,invoices,support,agents}/page.tsx` + `lib/markos/saas/nav/*.ts` + `supabase/migrations/98_saas_revenue_intelligence.sql` (APPEND nav portion) | **secondary** for 9 pages; **critical** for `app/saas/support/page.tsx` (CS rep mobile use) |

**Hybrid scope rationale.** Plans 217-01..05 ship the durable substrate (revenue metric definitions, MRR snapshot tables, SAS agent registry, 12 API endpoints, 10 MCP tools) without rendering any pixel. Plan 217-06 ships the operator-facing SaaS dashboard tree with 9 active P217 nav rows and 12 planned-only SG translation-gate rows. The `<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />` extracted-component recipes from 216-UI-SPEC §D-15 are **first consumed in production** here. The `<SaaSActivationPanel />` and `<SaaSSubscriptionsTable />` from 214-UI-SPEC §D-15 are reused on the Subscriptions page.

**Mobile priority.** Per 208-01 mobile_priority literals (`critical | secondary | desktop_only`):

| Surface | mobile_priority | Rationale |
|---------|-----------------|-----------|
| `app/saas/page.tsx` (Overview) | `secondary` | Operator desk-work; KPI scan |
| `app/saas/subscriptions/page.tsx` | `secondary` | Lifecycle review; not field-emergency |
| `app/saas/plans/page.tsx` | `secondary` | Catalog browsing |
| `app/saas/revenue/page.tsx` | `secondary` | Finance review |
| `app/saas/revenue/waterfall/page.tsx` | `secondary` | Finance analysis |
| `app/saas/churn/page.tsx` | `secondary` | Intervention queue review |
| `app/saas/invoices/page.tsx` | `secondary` | Invoice review is **desk work** (NOT critical — operator desktop pattern) |
| **`app/saas/support/page.tsx`** | **`critical`** | **CS reps need mobile** for ticket triage on the floor / off-desk |
| `app/saas/agents/page.tsx` | `secondary` | Read-only registry inspection |

`desktop_only` is FORBIDDEN as a `mobile_priority` value (208-01-01 architecture-lock). All 9 surfaces meet WCAG 2.1 AA touch targets via the global `(pointer: coarse) { .c-button { min-height: 44px } }` rule already shipping per 213.2 carry-forward. Each surface is registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` via `surface_family: saas_*`.

All acceptance criteria below apply to plan 217-06 deliverables. Plans 217-01..05 are backend-only and produce no UI artifacts.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (vanilla CSS Modules consuming `var(--*)` tokens from `app/tokens.css` + composing `.c-*` primitives from `styles/components.css` v1.1.0) |
| Preset | not applicable — repository is not shadcn-initialized (verified 2026-05-04: no `components.json` at repo root) |
| Component library | none — primitives in `styles/components.css` v1.1.0 (`.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive,--icon}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block`, `.c-terminal`, `.c-toast--{success,warning,error,info}`) |
| Icon library | Lucide (default) · Phosphor Regular (only allowed substitute) — DESIGN.md "Iconography". Bracketed glyphs (`[ok]`, `[warn]`, `[err]`, `[info]`, `[block]`, `[up]`, `[down]`, `[flat]`, `[—]`, `[#]`) carry every state signal per CLAUDE.md "no emoji in product UI". |
| Heading font | JetBrains Mono (`var(--font-mono)`) — DESIGN.md `typography.h1`–`h4` |
| Body font | Inter (`var(--font-sans)`) — DESIGN.md `typography.body-md`, `lead`, `body-sm`, `label-caps` |
| Default theme | dark (`color-scheme: dark`); light opt-in via `[data-theme="light"]` (per `app/tokens.css` lines 191–204) |
| Form authoring posture | Primitive-only. The 9 dashboard pages are **read-mostly server components**. The 3 forms in scope (recalc health CTA on Overview; reason-capture modal on intervention activation; reason-capture modal on agent registry filter) compose `.c-input`, `.c-button{,--*}`, `.c-field` + `.c-field__{label,help,error}`. No bespoke form CSS. |
| Banner authoring posture | **Primitive-only (D-09b carry).** Every gating state (gated_by_business_type, activation_pending, tenant_0_gate_closed, saas_surface_disabled, kb_grounding_below_threshold, save_offer_pending_pricing, save_offer_pending_approval, autonomy_ceiling_reached, sentinel_active, future_phase_218_growth_dashboards, future_phase_218_pii_audit_log_admin, future_phase_218_dian_wizard_ui_extension, future_phase_219_partner_console, future_phase_220_referral_console) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/`. |
| Card authoring posture | `.c-card` default for KPI cards on Overview, plan rows, subscription rows, invoice rows, health-score rows, intervention rows, support ticket rows, MRR waterfall bars, agent registry rows. **`.c-card--feature` is PROHIBITED in this phase** (D-13 carry: reserved for hero panels in 404-workspace + 213.5 marketing only). |
| Money / pricing display posture | All monetary values rendered via `<Money fromPricingRecommendation={pr_id} />` recipe consuming `pricing_recommendation_id` references resolved from 205 PricingRecommendation context; integer micro-USD/COP divided to display USD/COP with monospace JetBrains Mono per DESIGN.md `typography.code-inline` rule; `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` per 205 + 215 inheritance whenever `pricing_recommendation_id IS NULL` and column carries the literal sentinel. **Phase 217 MUST NOT take pricing ownership.** Zero hard-coded dollar/peso literals. Zero hard-coded tier name strings. JBM `font-feature-settings: 'tnum' 1` (tabular-numerals) for all monetary columns and MRR waterfall numeric labels. |
| Table authoring posture | **Vanilla `<table>` semantic only (D-14 carry).** Subscriptions list, plan catalog, invoice list, health-score drilldown table, intervention queue, support ticket inbox, MRR waterfall table view, cohort retention heatmap, agent registry table all use vanilla `<table>` + `.c-badge--{state}` for row state + token-only recipe on `<th>`/`<td>`. The `.c-table` primitive remains deferred to Phase 218+. |
| Placeholder posture | Future-substrate placeholders render `<PlaceholderBanner variant="future_phase_{N}_{slug}">` composing `.c-notice c-notice--info` with literal `[info] Awaiting Phase {N} translation` body. Active variants in this phase: `future_phase_218_growth_dashboards`, `future_phase_218_pii_audit_log_admin`, `future_phase_218_dian_wizard_ui_extension`, `future_phase_219_partner_console`, `future_phase_220_referral_console`. Pricing placeholders render `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel verbatim per 205 + 215 inheritance. |
| Server/client boundary (D-21 carry) | `app/saas/layout.tsx` is a **server component** (reads activation gate; passes nav rows to children). The 9 page files are **server components** by default fetching from `/v1/saas/*` (Plan 04). Interactive subcomponents (recalc CTA, reason modals, classifier filter chips, sortable table headers, copy-protect handlers on PII fields) are extracted to `_components/*.tsx` with `'use client'` directive. The server/client boundary is named in each page's file header comment per D-21. |

---

## Spacing Scale

Authoring rule: every `padding`, `margin`, `gap`, `inset` MUST cite a `--space-*` token. No arbitrary px. Off-grid values are auto-FAIL.

| Token | Value | DESIGN.md citation | Usage in this phase |
|-------|-------|--------------------|---------------------|
| `--space-none` | 0 | `spacing.none` | Reset margins on `<h1>`, `<h2>`, `<p>`, `<table>`, `<ul>` |
| `--space-xxs` | 2px | `spacing.xxs` | Badge inner padding, status-dot offset, KPI eyebrow adjacency, MRR waterfall numeric-label adjacency |
| `--space-xs` | 8px | `spacing.xs` | KPI card chip group gap, table-row metadata gap, classifier chip row gap, KB grounding source gap, agent role/cost chip gap |
| `--space-sm` | 16px | `spacing.sm` | Card vertical rhythm, notice padding-block, table `th`/`td` padding-block, mobile horizontal page padding ≤ 640px, dashboard sidebar nav-row gap |
| `--space-md` | 24px | `spacing.md` | Card padding (via `.c-card`), gap between dashboard sections (Overview KPI grid → recent activity), modal padding, page horizontal padding sm–md, MRR waterfall column gap |
| `--space-lg` | 32px | `spacing.lg` | Page horizontal padding ≥ md, inter-section gap within each dashboard page, KPI grid 4-column gap on desktop |
| `--space-xl` | 48px | `spacing.xl` | Page vertical padding ≥ lg, dashboard top padding, inter-page section break |
| `--space-xxl` | 96px | `spacing.xxl` | Reserved — not used in this phase |

**Allowed exceptions (DESIGN.md documented):**
1. `1px` for hairline borders (`var(--color-border)`).
2. `2px` for focus ring width and offset (`var(--focus-ring-width)`, `var(--focus-ring-offset)`).
3. `4px` for `.c-notice` `border-inline-start` accent — composed via `.c-notice` primitive; modules never declare directly.
4. `max-width: 1280px` for cockpit container (`--w-container`). Each dashboard page uses `--w-container` with internal `--w-prose` (720px) for descriptor lead text.
5. `max-width: 560px` for confirmation modals (`--w-modal`).
6. `44px` mobile touch target via `--h-control-touch` on `.c-button` for `(pointer: coarse)` viewports — already declared globally per 213.2 cross-cutting fix.

---

## Typography

All text MUST cite a token from DESIGN.md `typography.*`. Heading typography is JetBrains Mono. Body typography is Inter. No third typeface.

| Role | DESIGN.md token | CSS variables / class | Usage in this phase |
|------|-----------------|------------------------|---------------------|
| Page heading | `typography.h1` | `<h1>` inheriting globals: `var(--font-mono)` + `var(--fs-h1)` (2.441rem) + `var(--fw-bold)` | Per-page `<h1>`: "SaaS Overview", "Subscriptions", "Plans", "Revenue Dashboard", "MRR Waterfall", "Churn Intelligence", "Invoices", "Support Intelligence", "SAS Agent Registry" |
| Section heading | `typography.h2` | `<h2>` inheriting globals: `var(--font-mono)` + `var(--fs-h2)` (1.953rem) + `var(--fw-semibold)` | Section headings within each page (e.g. Overview: "Key metrics" / "Recent activity" / "Risk distribution"; Revenue: "Trailing 12 months" / "Net new MRR" / "Cohort retention") |
| Panel sub-heading | `typography.h3` | `<h3>` inheriting globals: `var(--font-mono)` + `var(--fs-h3)` (1.563rem) + `var(--fw-semibold)` | KPI card titles ("MRR", "NRR", "Health score", "Active subscriptions"); subscription row titles; intervention row titles; SAS agent token titles |
| Section sub-heading | `typography.h4` | `<h4>` inheriting globals: `var(--font-mono)` + `var(--fs-h4)` (1.250rem) + `var(--fw-medium)` | Drilldown sub-headings (e.g. health score 5-dimension breakdown headings; MRR waterfall column labels — `New`, `Expansion`, `Contraction`, `Churn`, `Reactivation`, `Net`) |
| Surface descriptor / lead | `typography.lead` | `.t-lead` utility: `var(--font-sans)` + `var(--fs-lead)` (1.250rem) + `var(--fw-regular)` + `color: var(--color-on-surface-muted)` | Per-page descriptor under `<h1>`; gate-failure notice body |
| Body copy | `typography.body-md` | inherited via `<p>`, `<td>` from globals | Plan-row description, intervention reason, ticket subject preview, agent role description |
| Eyebrow / `t-label-caps` | `typography.label-caps` | `.t-label-caps` utility / `.c-field__label` primitive | KPI eyebrow ("MRR / current period"), subscription-row eyebrow, intervention row eyebrow, ticket-row eyebrow, agent-row eyebrow ("Agent", "Role", "Cost", "Approval mode") |
| Metadata / timestamps | `typography.body-sm` | `.c-field__help` primitive: `var(--fs-body-sm)` (0.800rem) + `color: var(--color-on-surface-muted)` | `calculated_at`, `current_period_start`, `current_period_end`, `last_event_at`, `received_at`, `due_at`, intervention `triggered_at` |
| Form error inline | `typography.body-sm` | `.c-field__error` primitive: `var(--fs-body-sm)` + `color: var(--color-error)` + `var(--font-mono)` + `::before content "[err] "` | Reason-capture modal validation (≥20 chars; ≥50 chars for safe-auto-response toggle) |
| Monetary values | `typography.code-inline` + `font-feature-settings: 'tnum' 1` | `.c-code-inline` primitive | Overview MRR/NRR/active-subs counters; subscription `next_invoice_estimate`; invoice `amount_total`/`tax_total`/`iva_amount`/`retefuente_amount`/`reteiva_amount`/`reteica_amount`; MRR waterfall numeric labels; cohort retention percentages. **Tabular-numeral discipline (`tnum`) is REQUIRED on all monetary and percentage columns** to prevent numeric jitter; column-aligned via `text-align: end`. |
| IDs / tokens | `typography.code-inline` | `.c-chip-protocol` primitive | `subscription_id`, `plan_id`, `plan_version_id`, `invoice_id`, `payment_attempt_id`, `health_score_id`, `intervention_id`, `ticket_id`, `chunk_id`, `signal_id`, `playbook_id`, `vault_ref`, `agent_run_id`, `mutation_request_id`, `pricing_recommendation_id`. Each chip surrounds the value with `[ ]` per `.c-chip-protocol::before/::after`. |

**Forbidden (auto-FAIL):**
- Any third typeface (not JetBrains Mono or Inter).
- Inline `font-size`, `font-weight`, `color` literals — use tokens only.
- Hard-coded dollar/peso amounts — use `<Money />` + `--fs-code` or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Tier name strings (`"Growth Monthly"`, `"Starter"`, `"Professional"`, etc.) — banned in all JSX/CSS.
- Banned-lexicon tokens (CLAUDE.md) — `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener); zero exclamation points in product surface copy.

---

## Color

Composition target per DESIGN.md "Composition proportion" (must hold per page, measured by visual mass not file LOC):

| Range | Token group | SaaS dashboard usage |
|-------|-------------|----------------------|
| 70–80% | `surface` + `surface-raised` | Page background (`--color-surface`); `.c-card` KPI cards, plan rows, subscription rows, invoice rows, ticket rows, intervention rows, agent rows, MRR waterfall bars (`--color-surface-raised`) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All headings, body copy, table content, eyebrows, metadata, timestamps |
| 3–5% | `primary` + `primary-text` | Single primary CTA per page state (e.g. Overview "Recalculate health score"; Subscriptions "Open Approval Inbox →"; Churn "Activate save offer"), focus rings, `.c-chip-protocol` IDs, `[ok]` glyph, kernel-pulse status dot on live MRR cron + active-subscription rows + `[up]` trend arrow on improving health |
| 0–2% | `error` + `warning` + `info` + `success` | `.c-notice` banners, `.c-badge` row state, `[err]`/`[warn]`/`[info]`/`[ok]`/`[block]` glyphs, MRR waterfall negative bars (`--color-error` for `contraction_mrr` + `churn_mrr`), positive bars (`--color-success` for `new_mrr` + `expansion_mrr` + `reactivation_mrr`), net bar (`--color-primary` for `net_new_mrr`) |

| Role | Token | DESIGN.md citation | SaaS dashboard usage |
|------|-------|--------------------|----------------------|
| Page background | `--color-surface` (`#0A0E14` Kernel Black) | `colors.surface` | Every `app/saas/*/page.tsx` page wrapper; never `#000000` |
| Cards / panels | `--color-surface-raised` (`#1A1F2A` Process Gray) | `colors.surface-raised` | All `.c-card` instances across all 9 surfaces |
| Modal / popover surface | `--color-surface-overlay` (`#242B38`) | `colors.surface-overlay` | `.c-modal` confirm dialogs (recalc, reason-capture, save-offer activation, copy-protect violation alert) |
| Hairline borders | `--color-border` (`#2D3441` Border Mist) | `colors.border` | All `.c-card` borders (1px), table `th`/`td` border-bottom, chart axis lines, MRR waterfall bar separators, cohort retention heatmap cell borders |
| Strong borders | `--color-border-strong` (`#3A4250`) | `colors.border-strong` | Composed via `.c-input` on hover/focus — not authored locally |
| Primary text | `--color-on-surface` (`#E6EDF3` Terminal White) | `colors.on-surface` | All headings, body copy, table content |
| Muted secondary text | `--color-on-surface-muted` (`#7B8DA6` Vault Slate) | `colors.on-surface-muted` | `.t-lead` descriptors, table `th` text, eyebrows (when not state-coded), metadata, timestamps |
| Subtle / disabled text | `--color-on-surface-subtle` (`#6B7785` Comment Gray) | `colors.on-surface-subtle` | `.c-input::placeholder`, dimmed canceled subscriptions, dimmed archived plans, dimmed `runnable=false` agents, `[—]` insufficient_data trend |
| Signal — single mint | `--color-primary` (`#00D9A3` Protocol Mint) | `colors.primary` | Primary CTA fills (one per surface state), focus rings, `.c-status-dot--live` kernel-pulse on MRR snapshot cron + active subscription rows + improving health trend, MRR waterfall `net_new_mrr` bar |
| Mint as text (D-09 carry) | `--color-primary-text` | `tokens.css` line 186 | `.c-button--tertiary` text, `.c-chip-protocol` text, `[ok]` glyph color, `[up]` improving-trend glyph, "Open Approval Inbox →" / "View intervention timeline →" / "Recalculate health score →" / "Open subscription →" inline action links. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| Mint subtle wash | `--color-primary-subtle` | `colors.primary-subtle` | `.c-button--tertiary:hover` background, `.c-chip--mint` background, `.c-chip--mint` improving-trend chip background |
| Error | `--color-error` (`#F85149`) | `colors.error` | `.c-notice c-notice--error` (autonomy ceiling, KB confidence below threshold, sentinel block, activation failed), `.c-button--destructive` (Cancel subscription, Disable agent, Reject support response), `.c-badge--error` (`canceled` subscription, `critical` risk band, `frustrated` sentiment, `cancel`/`complaint` intent, `failed` invoice, `inactive` agent, `dlq` webhook), `[err]` glyph, `.c-status-dot--error`, MRR waterfall `contraction_mrr` + `churn_mrr` bars |
| Warning | `--color-warning` (`#FFB800`) | `colors.warning` | `.c-notice c-notice--warning` (KB grounding below threshold review, save-offer pending pricing, T0 gate closed, past_due invoice), `.c-badge--warning` (`past_due`/`paused` subscription, `at_risk` risk band, save_offer/win_back_offer dual-approval, `negative` sentiment, urgency 0.5-0.8, declining trend), `[warn]` glyph, `[down]` declining-trend glyph |
| Success | `--color-success` (`#3FB950`) | `colors.success` | `.c-notice c-notice--success` (recalc completed, save offer activated, response approved), `.c-badge--success` (`active`/`trialing` subscription, `healthy` risk band, `paid` invoice, `runnable=true` agent, KB confidence ≥0.8, `improving` trend cohort, `positive` sentiment), `[ok]` glyph |
| Info | `--color-info` (`#58A6FF`) | `colors.info` | `.c-notice c-notice--info` (gating notices, watch risk band, future-phase placeholder, sentinel info), `.c-badge--info` (`draft` subscription, `watch` risk band, `get_help` intent, urgency <0.5, single_approval mode), `[info]` glyph |

**Accent reserved-for list (the 3–5% mint slice):**
1. **Single primary CTA per surface state** (`.c-button--primary`):
   - Overview: `Recalculate health score` (when health-score recalc available)
   - Subscriptions: none (read-mostly; per-row CTAs are `.c-button--tertiary`)
   - Plans: none (read-only catalog in P217; admin editing deferred to P218+)
   - Revenue: none (read-only)
   - Revenue / Waterfall: none (read-only chart)
   - Churn: `Activate save offer` (when intervention pending; opens approval modal)
   - Invoices: none (read-only)
   - Support: `Approve and send` (when reviewing pending response)
   - Agents: none (read-only registry)
2. Focus rings — globally inherited; never suppressed in module.css.
3. Protocol chip text — `.c-chip-protocol` for all 16 ID classes (subscription_id, plan_id, plan_version_id, invoice_id, payment_attempt_id, health_score_id, intervention_id, ticket_id, chunk_id, signal_id, playbook_id, vault_ref, agent_run_id, mutation_request_id, pricing_recommendation_id, approval_id).
4. Status dot live — `.c-status-dot--live` on MRR snapshot cron freshness indicator + active-subscription rows + `live` agent-run streaming chip.
5. `[ok]` and `[up]` glyphs.
6. MRR waterfall `net_new_mrr` bar (the one positive accent column on revenue/waterfall page).
7. `::selection` — global.

**NOT used as fill anywhere:** card borders, table headers, page background, body copy, plan-row eyebrows, KPI card backgrounds. Mint is the SaaS dashboard's single signal — every other affordance is token-only neutral or state-class.

---

## Inheritance Bindings (load-bearing)

Every approval, lifecycle, mutation, pricing, classification, and grounding field rendered in any 217 surface MUST cite the upstream contract verbatim. Auto-FAIL: any field name re-derived without citation; any state literal not enumerated below; any approval gate omitting 206 mutation-class binding; any pricing render that hard-codes a literal or tier-name string; any credential render that violates §Sensitive Credential UI Binding (Layer 6); any health/support/intervention render that violates 216 binding contracts.

### From 205-UI-SPEC §Pricing Engine ownership (P217 must NOT take pricing ownership)

| 217 surface element | 205 contract source | Binding |
|---------------------|---------------------|---------|
| `app/saas/plans/page.tsx` plan row `price` column | `PricingRecommendation` (205-01-CONTRACT-LOCK) | `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner>`. Zero hard-coded dollar literals. |
| `app/saas/subscriptions/page.tsx` `next_invoice_estimate` | same | same |
| `app/saas/invoices/page.tsx` `amount_total` / tax columns | same; resolved through `saas_invoices.pricing_recommendation_id` | same; PII redaction applies to billing_address / payer_name per Sensitive Credential Binding |
| `app/saas/churn/page.tsx` save-offer pricing block | 215-UI-SPEC §sentinel discipline + 216 §UI Binding Contract 3 | `<SaveOfferPricingBlock>` extracted component renders `<Money>` XOR sentinel; never invents discount or tier copy |

### From 206-UI-SPEC §Mutation-class doctrine

| 217 surface element | 206 contract source | Binding |
|---------------------|---------------------|---------|
| Subscription mutation modals (Cancel/Pause/Upgrade/Downgrade/Reactivate) | `mutation-class-policy.md` — `billing.charge` root | Every modal carries `.c-chip-protocol` "Root: `billing.charge`"; default approval mode per amount threshold (216 + 215 carry); evidence_required pattern |
| Save-offer activation modal | `billing.charge` root + 216 dual_approval (save_offer / win_back_offer) | `<SaveOfferPricingBlock>` + reason ≥20 chars + `evidence_pack_ref` REQUIRED before `offer_activated_at`; DB-trigger `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` validates |
| Support response approve-and-send | `external.send` root + 216 single_approval | KB grounding ≥ threshold REQUIRED; banned-lexicon zero-match BEFORE dispatch (216 §UI Binding Contract 2) |
| Revenue metric export action | `data.export` root + single_approval | Reason capture; opens `.c-modal` |
| Audit-log export action (every page footer) | `data.export` root + single_approval | Reason capture; opens `.c-modal` |
| Autonomy ceiling reached (any agent on any page) | `mutation-class-policy.md` autonomy_ceiling | `.c-notice c-notice--error` `[block] Autonomy ceiling reached for {root_class}` above the action menu |

### From 207-UI-SPEC §Orchestration substrate

| 217 surface element | 207 contract source | Binding |
|---------------------|---------------------|---------|
| MRR snapshot cron run lineage | `RunApiEnvelope` (207-01) | Every snapshot row renders `<RunStatusBadge run_id={...}>`; cron `saas-mrr-snapshot.js` emits `kind='saas-mrr-snapshot'` |
| Revenue metric materialization run lineage | same | Materializer runs from 217-01 emit AgentRun with `kind='saas-revenue-metric-materialize'` |
| Intervention run lineage on Churn page | `AgentRunEventType` (207-02) | 7 literals consumed: `intervention_triggered`, `playbook_selected`, `task_created`, `save_offer_requested`, `save_offer_approved`, `save_offer_activated`, `intervention_completed` |
| MRR waterfall cron run lineage | `RunApiEnvelope` | Waterfall cron emits `kind='saas-mrr-waterfall'`; freshness chip on `app/saas/revenue/waterfall/page.tsx` reads `last_run_completed_at` |
| Subscription failure indicator | `AgentFailureClass` (207-01-CONTRACT-LOCK §4) | All 7 literals supported: `transient`, `policy`, `user_input`, `quota`, `upstream`, `poison`, `cancel` |
| Agent registry runnable agent run preview | `RunApiEnvelope` | When 217-03 `sas_agent_readiness.runnable=true` (P217 ships zero runnable; SAS-10 invariant), preview surfaces a "View recent runs →" `.c-button--tertiary` mint-text link to `/operations/tasks?run_kind=saas-{agent_token}` |

### From 208-UI-SPEC §PARENT cockpit pattern

| 217 surface element | 208 contract source | Binding |
|---------------------|---------------------|---------|
| Settings shell — sidebar nav extension | 208-01 sidebar | The `app/saas/layout.tsx` sidebar renders the 9 active nav rows from `saas_nav_visibility` via `getNavForTenant`; the sidebar inherits `app/(markos)/layout-shell.tsx` chrome posture but is rendered inside `app/saas/*` (architecture-lock: NO `app/(saas)/` route group) |
| Approval Inbox handoff_kind filter chips | 208-04 + 215 6th + 216 7th + 216 8th literals | 8 chips total when 217 ships in production: 4 P207 (`approval`, `recovery`, `follow_up`, `manual_input`) + 5th P214 (`billing_charge_approval`) + 6th P215 (`billing_correction_approval`) + 7th P216 (`support_response_approval`) + 8th P216 (`save_offer_approval`). 217 does NOT add a new 9th literal. |
| Recovery Center webhook DLQ inspector | 208-05 + 215-04 routing | Future P208 admin extension reads `markos_webhook_deliveries` rows; 217 does NOT modify the Recovery Center itself but `app/saas/invoices/page.tsx` deep-links to it via "View webhook DLQ →" `.c-button--tertiary` mint-text link |
| Task Board intervention task viewer | 208-03 + 216-04 task-creator | Existing P208-03 surface; `app/saas/churn/page.tsx` deep-links to `/operations/tasks?task_kind=saas_churn_intervention` |
| Morning Brief / Weekly Narrative summaries | 208-02 + 208-06 | Future P208 extension reads 217-02 MRR + 216 health/support rollups; 217 does NOT modify those surfaces |
| Mobile priority registration | 208-01 mobile_priority literals | All 9 surfaces register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: saas_*`; 8 surfaces `secondary`, `app/saas/support/page.tsx` is `critical` (CS field use) |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| 217 surface element | 213 contract source | Binding |
|---------------------|---------------------|---------|
| 217 substrate is PRIVATE doctrine | 213-04 §Public-Proof Boundary | `subscription_id`, `health_score_id`, `intervention_id`, `ticket_id`, `mrr_snapshot_id`, `agent_run_id`, `pricing_recommendation_id` UUIDs MAY be cited in case-studies via `<.c-chip-protocol>`; outcome content (raw MRR figures, customer NIT, churn reasons, intervention offer details, support sentiment) is NEVER published. Banned-phrases (`unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade`) zero-match enforced. |
| `app/saas/layout.tsx` activation gate `tenant_0_gate_closed` reason | 213-05 go/no-go | When `tenant_0_readiness_gate.status != 'opened'`, the layout renders `<.c-notice c-notice--warning>` with verbatim copy "[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboard is paused until the v4.0.0 readiness sign-off completes." and exits |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| 217 surface element | 214 contract source | Binding |
|---------------------|---------------------|---------|
| `isSaaSSurfaceEnabled` 3-condition gate | 214-06 §Surface gating contract | Server-rendered in `app/saas/layout.tsx` BEFORE child mount: condition 1 = `markos_orgs.business_type == 'saas'`; condition 2 = `saas_suite_activations.activation_status == 'active'`; condition 3 = `tenant_0_readiness_gate.status == 'opened'`. Each failed condition renders one of 4 named-reason notices (see §Activation Gate UI Binding) |
| `<SaaSActivationPanel />` extracted reuse | 214-06 §D-15 | `app/saas/page.tsx` Overview shows a compact summary card linking to `/settings/saas` for full activation review (read-only on Overview; full panel rendered only on the existing 214 settings page) |
| `<SaaSSubscriptionsTable />` extracted reuse | 214-06 §D-15 | `app/saas/subscriptions/page.tsx` consumes verbatim with 217 metric joins (active count → MRR contribution; lifecycle event count rollups) |
| `business_type != 'saas'` gating | 214-06 | Layout renders `gated_by_business_type` notice and exits |
| Subscription lifecycle 8-state machine + 16 events + 16 transitions | 214-RESEARCH §Domain 3 | `app/saas/subscriptions/page.tsx` lifecycle viewer renders the 8 `current_state` literals (`draft`, `trialing`, `active`, `past_due`, `paused`, `canceled`, `upgrade_pending`, `downgrade_pending`) as `.c-badge` row state; the 16 `event_type` literals (`activation_started`, `trial_started`, `trial_converted`, `payment_failed`, `payment_recovered`, `pause_requested`, `pause_applied`, `reactivation_requested`, `reactivated`, `upgrade_requested`, `upgrade_applied`, `downgrade_requested`, `downgrade_applied`, `cancellation_requested`, `canceled`, `rollback_applied`) render as timeline event chips |

### From 215-UI-SPEC §PARENT — SaaS Billing

| 217 surface element | 215 contract source | Binding |
|---------------------|---------------------|---------|
| Sensitive Credential UI Binding (Layer 6) | 215 §6-layer defense-in-depth | **Inherited verbatim**. Every 217 surface that displays vaulted credentials or invoice PII honors B-1 through B-8. See §Sensitive Credential UI Binding below. |
| Sentinel discipline | 215 §sentinel + 216 §save-offer | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` whenever pricing context missing |
| 6 correction_type literals on invoice page (deferred) | 215 + 216 §approval handoff filter chip set | `app/saas/invoices/page.tsx` deep-links to existing `/operations/approvals?handoff_kind=billing_correction_approval&{filter}` for refund/credit_note/write_off/discount/invoice_correction queues; row rendering in 217 limited to count chips only |
| 5 PII field constants | 215-01 `lib/markos/saas/billing/log-redaction.ts` | `STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `QB_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS` — every field tagged in any of the 5 lists renders `[REDACTED]` placeholder via `<PIIRedactedField />` extracted component |
| 6th `billing_correction_approval` handoff_kind literal | 215 §Approval Inbox filter chip set | Approval Inbox in `/operations/approvals` is NOT rendered from 217 (existing P208 surface); 217 deep-links via "Open Approval Inbox →" inline mint-text on relevant rows (subscription past_due, intervention pending) |

### From 216-UI-SPEC §PARENT — SaaS Health/Churn/Support/Usage

| 217 surface element | 216 contract source | Binding |
|---------------------|---------------------|---------|
| Health score 5-dimension rendering | 216 §UI Binding Contract 1 | `<HealthScoreBadge />` extracted component (D-15) on `app/saas/page.tsx` Overview KPI + drilldown table; renders `usage` 0.30 + `support` 0.20 + `billing` 0.20 + `engagement` 0.15 + `relationship` 0.15 weighted-sum verbatim |
| 4 risk bands rendering | 216 §UI Binding Contract 1 | `<RiskBandBadge />` extracted component on Overview + Churn page; renders `healthy` 80-100 / `watch` 60-79 / `at_risk` 40-59 / `critical` 0-39 + bracketed-glyph pairing (`[ok]`/`[info]`/`[warn]`/`[err]`) |
| 30-day trend rendering | 216 §UI Binding Contract 1 | 4 trend literals + bracketed glyph: `improving` `[up]` mint, `stable` `[flat]` neutral, `declining` `[down]` warning, `insufficient_data` `[—]` subtle. Sparkline rule per DESIGN.md (deferred recipe). |
| Recalc CTA | 216 §UI Binding Contract 1 | `.c-button--secondary` "Recalculate health score" on Overview; emits AgentRun `kind='saas-health-score-refresh'`; success state `<.c-notice c-notice--success>` "[ok] Health score recalculated"; failure state `<.c-notice c-notice--error>` "[err] Health score raw facts incomplete — connector data required" when DB-trigger `HEALTH_SCORE_REQUIRES_RAW_FACTS` raises |
| 5-classifier rendering | 216 §UI Binding Contract 2 | `<ClassifierChipRow />` extracted component on `app/saas/support/page.tsx`; renders `sentiment` + `intent` + `churn_signal` + `topic_tags` + `urgency_score` per ticket row |
| KB grounding panel | 216 §UI Binding Contract 2 | `<KbGroundingPanel />` extracted component on Support review modal; renders top-3 sources with `chunk_id` chips, `source_type` badge, `relevance_score` badge, snippet preview; aggregate `response_grounding_confidence` notice |
| Approve and send CTA | 216 §UI Binding Contract 2 | `.c-button--primary` "Approve and send" — DISABLED when `response_grounding_confidence < KB_CONFIDENCE_THRESHOLD` (default 0.7) OR autonomy ceiling reached; banned-lexicon zero-match enforced BEFORE dispatch (216 §banned-lexicon) |
| Safe auto-response toggle | 216 §UI Binding Contract 2 | DEFERRED to P218+ admin extension; 217 renders `<PlaceholderBanner variant="future_phase_218_safe_auto_response_toggle">` on Support page footer |
| Save-offer pricing block | 216 §UI Binding Contract 3 | `<SaveOfferPricingBlock />` extracted component on `app/saas/churn/page.tsx`; renders `<Money fromPricingRecommendation>` XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; reuses 215 billing-correction approval modal pattern |
| Save-offer reason capture | 216 §UI Binding Contract 3 | Reason ≥20 chars; `evidence_pack_ref` REQUIRED |
| 5 PII classification badges | 216 §UI Binding Contract 4 | `<RetentionClassChip />` extracted component on every PII-displaying surface; renders `pii_classification` ENUM literal: `no_pii`, `pseudonymous`, `personal`, `sensitive`, `highly_sensitive` + `data_retention_class` (15-row catalog: 5 P216 + 10 forward-looking) |
| PII redacted field | 216 §UI Binding Contract 4 | `<PIIRedactedField />` extracted component; renders `[REDACTED]` placeholder via `.c-code-inline` + `--color-on-surface-subtle` |
| Banned-lexicon zero-match (support response) | 216 §UI Binding Contract 2 | CI assertion enforces zero-match in classifier output + KB grounding output BEFORE dispatch path; `app/saas/support/page.tsx` "Approve and send" CTA path runs `scripts/marketing-loop/check-banned-lexicon.mjs` server-side before the dispatch UPDATE |

### From 213.4-VALIDATION.md (carry-forward decisions)

| Decision | Phase 217 enforcement |
|----------|----------------------|
| **D-08** (token-only) | Zero inline hex literals in any of `app/saas/**/*.{tsx,module.css}` and any `_components/*.{tsx,module.css}`. Every color via `var(--color-*)`. Every spacing via `var(--space-*)`. Every typography via DESIGN.md `typography.*`. Auto-FAIL on any `#[0-9a-fA-F]` literal. The closeout `architecture-lock-rerun.test.js` asserts zero matches across `app/saas/`. |
| **D-09** (mint-as-text) | `[ok]` and `[up]` glyph color, all action-link inline CTAs ("Open Approval Inbox →", "View intervention timeline →", "Recalculate health score →", "Open subscription →", "View webhook DLQ →"), all `.c-chip-protocol` IDs use `--color-primary-text`. Mint never used as fill on KPI cards, plan-row hero, MRR waterfall surface, or any surface > button or chip. The single mint fill exception is the `net_new_mrr` waterfall column (signal accent). |
| **D-09b** (`.c-notice` mandatory) | Every gating state composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/**`. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in this phase.** All cards use `.c-card` default. KPI cards on Overview use `.c-card` plus `[info]`/`[ok]`/`[warn]`/`[err]` eyebrow. |
| **D-14** (no `.c-table` primitive) | All 9 surfaces use vanilla `<table>` semantic + token-only recipe + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred. |
| **D-15** (selective extraction) | The following extracted components are FIRST CONSUMED IN PRODUCTION in this phase: `<HealthScoreBadge />`, `<RiskBandBadge />`, `<ClassifierChipRow />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />` (216 §D-15 recommended; 217 ships them). Storybook stories register all 7 with named-state CSF3 stories. The 214 `<SaaSActivationPanel />` and `<SaaSSubscriptionsTable />` are reused on `/saas/subscriptions/page.tsx`. |
| **D-21** (server/client boundary) | Each `app/saas/*/page.tsx` is a **server component** by default. Interactive subcomponents (recalc CTA, reason modals, classifier filters, sortable headers, copy-protect handlers, MRR waterfall hover state, cohort retention heatmap hover) extract to `_components/*.tsx` with `'use client'`. The boundary is named in each page's file header comment. |

---

## Activation Gate UI Binding (load-bearing)

**This section is load-bearing for `app/saas/layout.tsx`.** The activation gate is the FIRST thing the operator sees on any `/saas/*` route.

### Gate logic (server-rendered, blocks child mount)

```
GIVEN tenant context resolved from `requireHostedSupabaseAuth`
WHEN any of the 3 conditions fails:
  Condition 1: markos_orgs.business_type == 'saas'
  Condition 2: saas_suite_activations.activation_status == 'active'
  Condition 3: tenant_0_readiness_gate.status == 'opened'
THEN render the named-reason notice and EXIT (do NOT render children).
WHEN all 3 conditions pass:
THEN read saas_nav_visibility rows for the tenant; render sidebar with active rows; render children.
```

The gate logic is implemented in `lib/markos/saas/nav/visibility.ts` `getNavForTenant` + `lib/markos/saas/core/surface-gates.ts` `isSaaSSurfaceEnabled` (214 substrate). The layout passes `gateReason` to a client subcomponent only if rendering the notice; otherwise child pages mount.

### 4 named-reason notices (verbatim copy contract)

| `gateReason` literal | Trigger | Notice variant | Verbatim copy |
|----------------------|---------|----------------|---------------|
| `gated_by_business_type` | `markos_orgs.business_type != 'saas'` | `.c-notice c-notice--info` | `[info] SaaS Suite is reserved for SaaS-business tenants. Contact support to change tenant type.` |
| `activation_pending` | `saas_suite_activations.activation_status IN ('draft', NULL)` | `.c-notice c-notice--info` | `[info] SaaS Suite activation is pending. Open Settings → SaaS Suite to complete activation.` (link: `/settings/saas` mint-text inline) |
| `tenant_0_gate_closed` | `tenant_0_readiness_gate.status != 'opened'` | `.c-notice c-notice--warning` | `[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboard is paused until the v4.0.0 readiness sign-off completes.` |
| `saas_surface_disabled` | `saas_suite_activations.activation_status == 'disabled'` | `.c-notice c-notice--error` | `[err] SaaS Suite is disabled for this workspace. Open Settings → SaaS Suite to review activation status, or contact support.` (link: `/settings/saas` mint-text inline) |

### Defense-in-depth pair (DB-trigger + UI gate)

The UI gate logic in `app/saas/layout.tsx` is the FIRST defense. The DB-trigger `SAAS_NAV_REQUIRES_ACTIVATION` (217-06 migration 98 APPEND) is the SECOND defense — it raises EXCEPTION on any INSERT/UPDATE to `saas_nav_visibility` setting `is_active=true AND planned_only=false` for a tenant without an active `saas_suite_activations` row. Both defenses MUST pass for a nav row to render.

### Banned reasons (auto-FAIL)

The following reason literals are **forbidden** as `gateReason` values; their existence in any 217 surface code or copy is auto-FAIL:
- `unauthorized` (use the existing P201 auth redirect, not a SaaS-suite gate notice)
- `loading` (loading state is a separate skeleton render; not a gate reason)
- `error` (errors render `c-notice--error` with the actual reason, never the literal "error")
- `unknown` (every gate-failure path is enumerated; "unknown" is a code smell)

---

## Sensitive Credential UI Binding (Layer 6 — inherited verbatim from 215)

This section inherits 215-UI-SPEC §Sensitive Credential Handling — UI Binding Contract verbatim. It applies to `app/saas/invoices/page.tsx` (PII fields on invoice rows + `vault_ref` chip), `app/saas/page.tsx` Overview (active subscription count must NOT leak customer email/NIT), `app/saas/subscriptions/page.tsx` (subscription metadata + customer bridge ID), `app/saas/churn/page.tsx` (intervention `offer_details` + customer reference), `app/saas/support/page.tsx` (ticket subject/description PII + KB grounding source snippets).

### Defense-in-depth posture (6 layers — 215 ships layers 1-5; 217 surfaces enforce Layer 6)

| Layer | Component | Provider | Enforcement |
|-------|-----------|----------|-------------|
| 1. Storage | `storeCredentialVaultRef` | 215-01 | Plaintext credentials never persisted; only `vault_ref` UUID + Vault pointer |
| 2. DB-trigger | `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` | 215-01 migration 118 | INSERT plaintext blocked at DB level |
| 3. MCP sanitization | `sanitizeBillingResponse` | 215-01 + 217-05 saas.cjs | All MCP tool output strips 12 `CREDENTIAL_FIELDS` + `vault_ref` |
| 4. Log redaction | `redactWebhookPayload` + 5 PII-field-list constants | 215-01 | Webhook payloads logged as `payload_redacted` only |
| 5. Prompt-injection defense | `stripCredentialsForLLM` | 215-01 | LLM context filtered upstream of any agent prompt |
| **6. UI surface enforcement** | **Every `app/saas/*` page consuming credentials/PII** | **THIS PHASE** | **Bindings B-1..B-8 below** |

### UI binding contract for 217 surfaces consuming 215/216 PII (verbatim from 215)

| Binding | Rule | Verification |
|---------|------|--------------|
| **B-1. Allowed display fields** | Render ONLY: `vault_ref` UUID, `processor_name` literal, `last_used_at`, `is_active`, `created_at`, `updated_at`, `environment`, plus the explicit non-PII subset of invoice fields. NEVER render: `credential_value`, raw `secret_key`, `webhook_secret`, `access_token`, `oauth_token`, `realm_id`, `pkcs12_certificate`, `pkcs12_password`, `authorization_token` (ClTec), `software_pin`, or any field listed in `CREDENTIAL_FIELDS` (12 total). | Architecture-lock test asserts `grep -P '\b(secret_key\|webhook_secret\|access_token\|oauth_token\|pkcs12_password\|authorization_token\|software_pin)\b' app/saas/**/*.{tsx,module.css}` returns 0 |
| **B-2. `vault_ref` chip rendering** | The `vault_ref` UUID renders via `<.c-chip-protocol>` (D-09 mint-as-text). Never as fill. | Storybook visual regression test asserts mint text only |
| **B-3. PII-field redaction** | For any field tagged in the 5 PII-field-list constants (`STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `QB_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS`) and the 216 `pii_classification IN ('sensitive', 'highly_sensitive')` rows, render via `<PIIRedactedField />` extracted component → `.c-code-inline` + `--color-on-surface-subtle` reading `[REDACTED]` verbatim. Examples: `email: [REDACTED]`, `last4: [REDACTED]`, `ip_address: [REDACTED]`, `phone: [REDACTED]`, `customer_nit: [REDACTED]`, `payer_name: [REDACTED]`, `billing_address: [REDACTED]`. | Architecture-lock test asserts `grep -c '\[REDACTED\]' app/saas/**/*.tsx` >= count of PII display fields |
| **B-4. Clipboard copy block on credential displays** | `onCopy` event handler MUST `preventDefault()` for any DOM node containing a credential or PII display. The `_components/PIIRedactedField.tsx` `'use client'` subcomponent exposes the `onCopy` interceptor. The `<.c-chip-protocol>` chip itself MAY be copied (it contains only the public `vault_ref` UUID); the parent row container MUST NOT be copyable as a single block. | Storybook interaction test asserts `clipboard.writeText` is never invoked on credential/PII block |
| **B-5. Audit-log every credential view** | Every render of an invoice / credential metadata view MUST emit a `saas_billing_events` row (provider 215-01) with `event_type == 'credential_view'`, `actor == requesting_user.id`, `vault_ref == displayed_vault_ref`, `payload_redacted == { displayed_fields: [...] }`. The audit emit happens server-side in the API handler that serves the metadata, NOT client-side. | API handler test asserts `INSERT INTO saas_billing_events` row count == 1 per credential metadata fetch |
| **B-6. No raw credential round-trip** | 217 does NOT ship credential update wizards; deferred to P218+. Reads only — `app/saas/invoices/page.tsx` uses GET to `api/v1/saas/invoices.js` (217-04). The response body NEVER echoes plaintext credential values. | API handler test asserts response body shape excludes credential value fields |
| **B-7. DIAN wizard certificate upload** | 217 does NOT ship the DIAN wizard. The Settings link on `app/saas/invoices/page.tsx` deep-links to existing 213.3 settings/billing or future P218+ wizard. Verbatim copy contract from 215 reserved for that future surface. | n/a in 217; reserved for P218+ |
| **B-8. Banned-lexicon zero-match on doctrine prose + redaction strings** | The 5 PII-field-list constants + 5 redaction strings (`'[REDACTED]'`) are doctrine prose; banned-lexicon enforced at zero-match. Same enforcement applies to support classifier output + KB grounding output rendered on `app/saas/support/page.tsx`. | CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `app/saas/**/*.{tsx,module.css}` — zero matches required |

---

## Surface Inventory — 10 Surfaces

### Surface A — `app/saas/layout.tsx` (Activation Gate + Sidebar)

**Files:**
- `app/saas/layout.tsx` — NEW; **server component**; activation gate + sidebar.
- `app/saas/layout.module.css` — NEW; token-only.
- `app/saas/_components/SaasSidebar.tsx` — NEW; **`'use client'`**; renders nav rows; mobile bottom-sheet collapse.
- `app/saas/_components/SaasSidebar.module.css` — NEW; token-only.
- `app/saas/_components/SaasSidebar.stories.tsx` — NEW; CSF3 named state stories.

**Layout grid (desktop ≥ md):**
```
+----------------+-----------------------------------------+
| <SaasSidebar>  | <main>                                  |
|   /saas         |   {children}                            |
|   /subs         |                                         |
|   /plans        |                                         |
|   /revenue      |                                         |
|   /waterfall    |                                         |
|   /churn        |                                         |
|   /invoices     |                                         |
|   /support      |                                         |
|   /agents       |                                         |
|                 |                                         |
| (12 SG planned |                                          |
|  rows hidden    |                                         |
|  via planned_   |                                         |
|  only=true)     |                                         |
+----------------+-----------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Sidebar collapses to bottom-sheet drawer triggered by hamburger button (top-left). All `.c-button` instances inherit 44px touch target.

**Components used:** `<SaasSidebar />` (client subcomponent), `<.c-notice c-notice--{info,warning,error}>` (gate failure), `<.c-link c-link--mint>` inline links to settings, `<.c-status-dot--live>` on the MRR snapshot freshness chip in the sidebar footer.

**Copy register:**
| Element | Copy |
|---------|------|
| Sidebar group heading | "SaaS Suite" |
| Sidebar nav rows (9) | "SaaS Overview", "Subscriptions", "Plans", "Revenue Dashboard", "MRR Waterfall", "Churn Intelligence", "Invoices", "Support Intelligence", "SAS Agent Registry" |
| MRR freshness chip (sidebar footer) | "[ok] MRR fresh — recalculated {ago}" / "[warn] MRR stale — last recalc {ago}" |
| Gate-failure: gated_by_business_type | `[info] SaaS Suite is reserved for SaaS-business tenants. Contact support to change tenant type.` |
| Gate-failure: activation_pending | `[info] SaaS Suite activation is pending. Open Settings → SaaS Suite to complete activation.` (mint-text inline link to `/settings/saas`) |
| Gate-failure: tenant_0_gate_closed | `[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboard is paused until the v4.0.0 readiness sign-off completes.` |
| Gate-failure: saas_surface_disabled | `[err] SaaS Suite is disabled for this workspace. Open Settings → SaaS Suite to review activation status, or contact support.` (mint-text inline link to `/settings/saas`) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render before auth + activation resolves | (server-rendered; no client loading state) |
| `gated_by_business_type` | `markos_orgs.business_type != 'saas'` | Full-page `.c-notice c-notice--info`; sidebar hidden; children NOT rendered |
| `activation_pending` | `saas_suite_activations.activation_status IN ('draft', NULL)` | Full-page `.c-notice c-notice--info` with mint-text link to `/settings/saas`; children NOT rendered |
| `tenant_0_gate_closed` | `tenant_0_readiness_gate.status != 'opened'` | Full-page `.c-notice c-notice--warning`; children NOT rendered |
| `saas_surface_disabled` | `saas_suite_activations.activation_status == 'disabled'` | Full-page `.c-notice c-notice--error` with mint-text link; children NOT rendered |
| `gate_passed` | All 3 conditions met | Sidebar + `<main>{children}</main>` rendered |

**Data dependencies:**
- `markos_orgs.business_type` literal: `saas | ecommerce | services | other`
- `saas_suite_activations.activation_status` literal: `draft | active | disabled`
- `tenant_0_readiness_gate.status` literal: `closed | opened`
- `saas_nav_visibility` rows (21 per active SaaS tenant: 9 active P217 + 12 planned SG)

**Accessibility focus order:** (1) hamburger button (mobile only) → (2) sidebar group heading (programmatic focus on route change) → (3) each active nav row → (4) MRR freshness chip → (5) main page focus.

**Motion:** `.c-status-dot--live` kernel-pulse on MRR freshness chip (freezes under `prefers-reduced-motion`). Sidebar collapse: 150ms slide on mobile drawer open; 0ms under reduced-motion.

**Acceptance Criteria:**
- AC L-1: `app/saas/layout.tsx` is a server component (verified by absence of `'use client'`); reads `requireHostedSupabaseAuth` + `isSaaSSurfaceEnabled` server-side
- AC L-2: 4 gate-failure paths render the verbatim copy contract per state matrix
- AC L-3: Children NOT rendered on any gate-failure path (architecturally enforced — early return)
- AC L-4: Sidebar reads `getNavForTenant` and renders ONLY rows where `is_active == true` AND `planned_only == false`
- AC L-5: 12 SG planned-only rows present in DB but NEVER rendered in sidebar (translation-gate test asserts)
- AC L-6: MRR freshness chip reads `last_run_completed_at` from cron `saas-mrr-snapshot.js` (217-02); kernel-pulse freezes under `prefers-reduced-motion`
- AC L-7: Mobile bottom-sheet collapse opens via hamburger; closes on overlay tap; focus-trap on open
- AC L-8: Banned-reason literals (`unauthorized`, `loading`, `error`, `unknown`) absent from layout source
- AC L-9: Storybook story `Saas/Layout` registers 5 named-state stories (Loading/Gated/Pending/T0Closed/Active)
- AC L-10: D-21 server/client boundary noted in file header comment

---

### Surface B — `app/saas/page.tsx` (SaaS Overview)

**Files:**
- `app/saas/page.tsx` — NEW; **server component**; fetches `/v1/saas/metrics` + `/v1/saas/health` (Plan 04).
- `app/saas/page.module.css` — NEW; token-only.
- `app/saas/_components/RecalcHealthCTA.tsx` — NEW; **`'use client'`**.
- `app/saas/page.stories.tsx` — NEW; CSF3 named state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1>SaaS Overview</h1>                                   |
| <p class="t-lead">{N} subscriptions. {M} pending         |
|     intervention. Health median: {score}.                |
+----------------------------------------------------------+
| <h2>Key metrics</h2>                                     |
| <KPIGrid> 4 columns:                                     |
|   <KPICard eyebrow="MRR" value=<Money/> trend=<trend/>/> |
|   <KPICard eyebrow="NRR" value="{pct}%" trend=<trend/>/> |
|   <KPICard eyebrow="Health score median"                 |
|             value=<HealthScoreBadge/> trend=<trend/>/>   |
|   <KPICard eyebrow="Active subscriptions" value="{N}"/>  |
+----------------------------------------------------------+
| <h2>Risk distribution</h2>                               |
| <table> 4 rows                                           |
|   healthy / watch / at_risk / critical                   |
|   each with <RiskBandBadge/> + count + delta             |
+----------------------------------------------------------+
| <h2>Recent activity</h2>                                 |
| <table> recent saas_billing_events + saas_subscription_  |
|         events + intervention_events                     |
+----------------------------------------------------------+
| <h2>Recalculate health score</h2>                        |
| <RecalcHealthCTA /> (`'use client'` subcomponent)         |
+----------------------------------------------------------+
```

**Components used:** `<HealthScoreBadge />`, `<RiskBandBadge />`, `<Money />`, `<RecalcHealthCTA />` (client), `.c-card`, `.c-badge--{state}`, `.c-status-dot--live`, `.c-chip-protocol`, vanilla `<table>`.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "SaaS Overview" |
| `.t-lead` | "{N} subscriptions. {M} pending intervention. Health median: {score}." |
| KPI eyebrows | "MRR / current period", "NRR / trailing 12m", "Health score / median", "Active subscriptions / current" |
| KPI empty (zero subs) | `[info] No active subscriptions yet. Subscriptions appear here after activation completes and the first SaaS customer signs up.` |
| Recalc CTA primary | "Recalculate health score" |
| Recalc success transient toast | "[ok] Health score recalculated" |
| Recalc failure (raw_facts incomplete) | `[err] Health score raw facts incomplete — connector data required` (`.c-notice c-notice--error`; below CTA) |
| Sentinel pricing block | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` whenever MRR pricing context missing |
| Risk distribution row labels | "[ok] Healthy (80-100)", "[info] Watch (60-79)", "[warn] At risk (40-59)", "[err] Critical (0-39)" |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Server fetch in flight | Skeleton KPI grid |
| `activated-empty` | Active SaaS, zero subs | KPI grid renders zeros + sentinel where applicable; risk distribution all zeros; "Recent activity" empty notice |
| `activated-with-data` | Active SaaS, subs > 0 | Full render |
| `recalc-in-progress` | Operator clicked Recalc | Recalc button shows `.c-button.is-loading::after` spinner; KPI Health card shows `[info] Recalculating…` |
| `recalc-success` | Recalc completed | Transient `.c-toast--success`; KPI Health card refreshes |
| `recalc-failure-raw-facts` | DB-trigger `HEALTH_SCORE_REQUIRES_RAW_FACTS` raises | `.c-notice c-notice--error` below CTA |
| `autonomy-ceiling-reached` | `external.send` ceiling hit | Recalc button stays enabled (recalc itself is `data.export` not `external.send`); but Recent-activity rows that have ceiling-blocked agents render `[block]` glyph |

**Data dependencies:**
- `/v1/saas/metrics` returns: `mrr`, `nrr`, `health_score_median`, `active_subscription_count`, `risk_distribution`, `last_snapshot_at`, `pricing_recommendation_id` per metric (217-02 + 217-04)
- `/v1/saas/health` returns: per-tenant aggregate health + 4 risk band counts (217-04 + 216-01)
- 30-day trend computed from `previous_score` / `score_delta` columns (216-01)

**Accessibility focus order:** (1) `<h1>` programmatic focus → (2) Recalc CTA → (3) each KPI card heading → (4) risk distribution table rows → (5) recent activity table rows.

**Motion:** `.c-status-dot--live` on MRR freshness eyebrow (freezes under `prefers-reduced-motion`); recalc CTA button has 150ms loading-spinner; zero under reduced-motion.

**Mobile breakpoint:** KPI grid collapses to single-column stack at <640px. Risk distribution table becomes vertical card stack. Recent activity rows stack. Recalc CTA full-width.

**Acceptance Criteria:**
- AC O-1: `app/saas/page.tsx` is a server component; fetches `/v1/saas/metrics` + `/v1/saas/health` server-side
- AC O-2: KPI grid renders 4 cards with verbatim eyebrow copy
- AC O-3: `<HealthScoreBadge />` renders 5-dimension breakdown verbatim from 216 contract
- AC O-4: `<RiskBandBadge />` renders 4 risk bands with bracketed-glyph pairing
- AC O-5: Recalc CTA invokes `api/cron/saas-health-score-refresh.js` (216-01); success emits `<.c-toast--success>`
- AC O-6: Recalc failure path renders `<.c-notice c-notice--error>` with verbatim copy when DB-trigger raises
- AC O-7: Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim when MRR pricing context missing
- AC O-8: 30-day trend renders 4 literals (`improving`/`stable`/`declining`/`insufficient_data`) with bracketed glyph
- AC O-9: Mobile KPI grid collapses to single-column stack at <640px
- AC O-10: Storybook story `Saas/Overview` registers 5 named-state stories (Empty/Active/RecalcInProgress/RecalcSuccess/RawFactsIncomplete)

---

### Surface C — `app/saas/subscriptions/page.tsx` (Subscriptions List + Lifecycle Viewer)

**Files:**
- `app/saas/subscriptions/page.tsx` — NEW; server component; fetches `/v1/saas/subscriptions` (Plan 04).
- `app/saas/subscriptions/page.module.css` — NEW.
- `app/saas/subscriptions/page.stories.tsx` — NEW.

**Layout grid:** Reuses `<SaaSSubscriptionsTable />` from 214 verbatim, augmented with 217 metric joins (active count → MRR contribution; lifecycle event count rollup; health score per row).

**Components used:** `<SaaSSubscriptionsTable />` (214 extracted), `<HealthScoreBadge />` (per-row health), `<RiskBandBadge />` (per-row risk band chip), `.c-chip-protocol` (subscription_id, customer_bridge_id, agent_run_id), `.c-status-dot--live` (active rows), vanilla `<table>` (timeline events column).

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Subscriptions" |
| `.t-lead` | "{N} subscription(s). {M} pending mutation. Median MRR: {money}." |
| Empty | `[info] No subscriptions yet. Subscriptions appear here after activation completes and the first SaaS customer signs up.` |
| Per-row "Open subscription →" | mint-text inline link to `/saas/subscriptions/[id]` (deferred to P218; in P217 links to existing `/operations/tasks?run_id={agent_run_id}` deep-link via 207 substrate) |
| Per-row "Open Approval Inbox →" (when pending) | mint-text inline link to `/operations/approvals?handoff_kind=billing_charge_approval&mutation_request_id={id}` |
| 8 lifecycle state badges | per 214-RESEARCH §Domain 3: `[info] Draft`, `[info] Trialing`, `[ok] Active`, `[warn] Past due`, `[warn] Paused`, `[err] Canceled`, `[warn] Upgrade pending`, `[warn] Downgrade pending` |
| 16 event type chips | per 214-RESEARCH §Domain 3 — verbatim |

**State matrix:** Inherits `<SaaSSubscriptionsTable />` 214 state matrix; adds 217 health-score join rendering.

**Acceptance Criteria:**
- AC S-1: `<SaaSSubscriptionsTable />` reused verbatim with 217 metric joins
- AC S-2: 8 lifecycle state literals render with bracketed glyph
- AC S-3: 16 event type chips render with verbatim copy
- AC S-4: Per-row `<HealthScoreBadge />` + `<RiskBandBadge />` joined via `subscription_id`
- AC S-5: Mutation queue deep-links to existing `/operations/approvals` Approval Inbox
- AC S-6: Failed run failure indicator renders `AgentFailureClass` literal (7 literals) verbatim
- AC S-7: Mobile breakpoint: vertical card stack
- AC S-8: Storybook story registers 6 named-state stories (Empty/Active/Trialing/PastDue/Canceled/PendingMutation)

---

### Surface D — `app/saas/plans/page.tsx` (Plan Catalog Browser)

**Files:**
- `app/saas/plans/page.tsx` — NEW; server component; fetches `/v1/saas/plans` (Plan 04).
- `app/saas/plans/page.module.css` — NEW.
- `app/saas/plans/page.stories.tsx` — NEW.

**Layout grid:** Vanilla `<table>` plan catalog; columns: Plan / Version / Price / Discount / Value Metric / Status. Read-only in P217 (admin editing deferred to P218+).

**Components used:** `.c-card`, `.c-badge--{state}`, `<Money fromPricingRecommendation>`, `<PlaceholderBanner variant="billing_placeholder">`, `.c-chip-protocol` (plan_id, plan_version_id), vanilla `<table>`.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Plans" |
| `.t-lead` | "{N} plan(s). {M} published. {K} drafts." |
| Empty | `[info] No plans configured yet. Plan catalog editing arrives in Phase 218.` |
| Status badges | `[ok] Published`, `[info] Draft`, `[info] Archived` (dimmed via `--color-on-surface-subtle`) |
| Pricing — engine-backed | `<Money />` rendering `price_micro_usd` |
| Pricing — pending | `{{MARKOS_PRICING_ENGINE_PENDING}}` via `<PlaceholderBanner variant="billing_placeholder">` |
| Per-row "View pricing →" | mint-text inline link to `/admin/billing/pricing` (P205 surface) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | Zero plans | Empty notice |
| `populated` | Plans > 0 | Full table |
| `pricing-pending` | Plan with `pricing_recommendation_id IS NULL` | Sentinel rendered verbatim per row |

**Acceptance Criteria:**
- AC P-1: Plan catalog read-only in P217
- AC P-2: Sentinel rendered verbatim where pricing context missing
- AC P-3: Status badges render verbatim copy
- AC P-4: `pricing_recommendation_id` resolved server-side via 205 substrate
- AC P-5: Zero hard-coded dollar literals or tier-name strings
- AC P-6: Mobile vertical card stack

---

### Surface E — `app/saas/revenue/page.tsx` (Revenue Metrics Dashboard)

**Files:**
- `app/saas/revenue/page.tsx` — NEW; server component; fetches `/v1/saas/metrics/*` (Plan 04).
- `app/saas/revenue/page.module.css` — NEW.
- `app/saas/revenue/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>Revenue Dashboard</h1>                               |
| <p class="t-lead">{period}. Last snapshot: {ago}.        |
+----------------------------------------------------------+
| <h2>Trailing 12 months</h2>                              |
| <table> MRR / ARR / NRR / GRR / Churn rate / LTV         |
|   each: metric / formula / value / source / reconciled?  |
+----------------------------------------------------------+
| <h2>Cohort retention</h2>                                |
| <table> heatmap (months × cohorts; T+1, T+3, T+6, T+12)  |
+----------------------------------------------------------+
| <h2>Forecast (3-month linear)</h2>                       |
| <table> projected MRR per month                          |
+----------------------------------------------------------+
| <h2>Reconciliation queue</h2>                            |
| <table> conflict_flagged + manually_corrected rows       |
+----------------------------------------------------------+
```

**Components used:** `<Money />`, `.c-card`, `.c-badge--{state}` (`reconciled` / `pending_reconciliation` / `conflict_flagged` / `manually_corrected` / `excluded`), `.c-chip-protocol` (mrr_snapshot_id, metric_id), vanilla `<table>` with `font-feature-settings: 'tnum' 1` for numeric columns.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Revenue Dashboard" |
| `.t-lead` | "{period}. Last snapshot: {ago}." |
| Empty | `[info] No revenue snapshots yet. The MRR snapshot cron runs nightly; check back tomorrow.` |
| Reconciliation state badges | `[ok] Reconciled`, `[info] Pending reconciliation`, `[err] Conflict flagged — review`, `[warn] Manually corrected`, `[info] Excluded` |
| Source precedence labels | "Billing engine", "Processor webhook", "Accounting sync", "CRM record", "Manual correction" |
| Conflict resolve CTA | `.c-button--secondary` "Open reconciliation queue →" mint-text inline link to existing `/admin/billing/page.tsx` (P213.4 surface) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | No snapshots | Empty notice |
| `populated` | Snapshots exist | Full render |
| `conflict-flagged` | Any row with `reconciliation_state == 'conflict_flagged'` | `.c-badge--error` per row + reconciliation queue link |
| `cron-stale` | `last_snapshot_at > 36h` | `.c-notice c-notice--warning` "[warn] MRR snapshot cron stale (last run {ago})" |

**Acceptance Criteria:**
- AC R-1: 15 revenue metrics rendered per 217-01 formula table
- AC R-2: Source precedence column shows 5-tier model literally (Billing > Processor > Accounting > CRM > Manual)
- AC R-3: 5 reconciliation_state badges render verbatim
- AC R-4: Tabular-numeral discipline (`tnum`) on monetary columns
- AC R-5: Cron-stale state triggers warning notice
- AC R-6: Cohort retention table renders T+1/T+3/T+6/T+12 columns
- AC R-7: Forecast (3-month linear) renders per 217-01 formula
- AC R-8: Mobile breakpoint: tables become vertical card stacks
- AC R-9: Storybook story registers 4 named-state stories (Empty/Healthy/ConflictFlagged/CronStale)

---

### Surface F — `app/saas/revenue/waterfall/page.tsx` (MRR Waterfall Visualization)

**Files:**
- `app/saas/revenue/waterfall/page.tsx` — NEW; server component; fetches `/v1/saas/metrics/waterfall` (Plan 04).
- `app/saas/revenue/waterfall/page.module.css` — NEW.
- `app/saas/revenue/waterfall/_components/MrrWaterfall.tsx` — NEW; **`'use client'`**; SVG waterfall chart with hover state.
- `app/saas/revenue/waterfall/_components/MrrWaterfall.module.css` — NEW.
- `app/saas/revenue/waterfall/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>MRR Waterfall</h1>                                   |
| <p class="t-lead">{period}. Net new MRR: <Money/>.       |
+----------------------------------------------------------+
| <MrrWaterfall> SVG bar chart 6 columns                   |
|   New (success) → +Expansion (success) →                 |
|   −Contraction (error) → −Churn (error) →                |
|   +Reactivation (success) → Net New MRR (primary)        |
+----------------------------------------------------------+
| <h2>Waterfall table</h2>                                 |
| <table> 6 rows                                           |
|   each: column / amount / contribution_pct               |
+----------------------------------------------------------+
| <h2>Cohort retention heatmap</h2>                        |
| <CohortRetentionHeatmap /> 12 columns × N cohorts        |
+----------------------------------------------------------+
```

**Components used:** `<MrrWaterfall />` (client SVG), `<CohortRetentionHeatmap />` (client SVG), `<Money />`, `.c-card`, vanilla `<table>` with tabular-numerals, `.c-chip-protocol` (waterfall_entry_id, cohort_id).

**Color discipline:**
- `new_mrr` bar — `.c-badge--success` color (`--color-success`)
- `expansion_mrr` bar — `.c-badge--success` color (`--color-success`)
- `contraction_mrr` bar — `.c-badge--error` color (`--color-error`); rendered as **negative** delta (downward bar)
- `churn_mrr` bar — `.c-badge--error` color (`--color-error`); rendered as **negative**
- `reactivation_mrr` bar — `.c-badge--success` color
- `net_new_mrr` bar — `--color-primary` (Protocol Mint; the single mint signal exception)

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "MRR Waterfall" |
| `.t-lead` | "{period}. Net new MRR: <Money/>." |
| Empty | `[info] No waterfall data yet. The MRR waterfall cron runs nightly; check back tomorrow.` |
| Bar labels | "New", "Expansion", "Contraction", "Churn", "Reactivation", "Net new MRR" |
| Hover tooltip | "{column}: <Money/> ({pct}%)" — server-side rendered tooltip for accessibility |
| Cohort retention heatmap legend | "[ok] Strong (≥80%)", "[info] Healthy (60-79%)", "[warn] Eroding (40-59%)", "[err] Weak (<40%)" |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | No waterfall entries | Empty notice |
| `populated` | Entries exist | Full render |
| `cron-stale` | `last_run_completed_at > 36h` | Stale warning |

**Acceptance Criteria:**
- AC W-1: 6-column waterfall renders 5 contribution columns + net column
- AC W-2: Negative contributions (contraction, churn) render as downward bars in `--color-error`
- AC W-3: Positive contributions (new, expansion, reactivation) render as upward bars in `--color-success`
- AC W-4: Net column renders in `--color-primary` (the single mint signal exception)
- AC W-5: Tabular-numerals (`tnum`) on all monetary labels
- AC W-6: Cohort retention heatmap renders T+1..T+12 columns
- AC W-7: Hover tooltip server-rendered for keyboard/screen-reader accessibility (D-21 client subcomponent)
- AC W-8: `prefers-reduced-motion` disables hover transitions
- AC W-9: Mobile breakpoint: waterfall scrolls horizontally; legend stacks vertically
- AC W-10: Storybook story registers 4 named-state stories (Empty/Healthy/ChurnHeavy/CronStale)

---

### Surface G — `app/saas/churn/page.tsx` (Churn Intervention Queue)

**Files:**
- `app/saas/churn/page.tsx` — NEW; server component; fetches `/v1/saas/churn` (216 substrate via Plan 04).
- `app/saas/churn/page.module.css` — NEW.
- `app/saas/churn/_components/SaveOfferActivationModal.tsx` — NEW; **`'use client'`**.
- `app/saas/churn/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>Churn Intelligence</h1>                              |
| <p class="t-lead">{N} at-risk + {M} critical. {K}        |
|     pending intervention.                                 |
+----------------------------------------------------------+
| <h2>At-risk accounts</h2>                                |
| <table> rows where risk_level IN ('at_risk','critical')  |
|   each: <RiskBandBadge/> + <HealthScoreBadge/> +         |
|         subscription chip + last touch + assigned         |
|         playbook + activate save offer CTA               |
+----------------------------------------------------------+
| <h2>Open interventions</h2>                              |
| <table> rows where intervention.status IN                |
|         ('pending', 'awaiting_approval', 'active')       |
|   each: playbook chip + trigger reason + step state +    |
|         <SaveOfferPricingBlock/> + open approval CTA     |
+----------------------------------------------------------+
| <h2>Recently resolved</h2>                               |
| <table> rows where status='resolved' AND                 |
|         resolved_at > now() - 30d                        |
+----------------------------------------------------------+
```

**Components used:** `<RiskBandBadge />`, `<HealthScoreBadge />`, `<SaveOfferPricingBlock />`, `<SaveOfferActivationModal />` (client; reuses 215 billing-correction modal pattern), `.c-card`, `.c-badge--{state}`, `.c-chip-protocol` (intervention_id, playbook_id, subscription_id), vanilla `<table>`.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Churn Intelligence" |
| `.t-lead` | "{N} at-risk + {M} critical. {K} pending intervention." |
| At-risk empty | `[ok] No at-risk accounts. Health distribution is healthy.` (`.c-notice c-notice--success`) |
| Open interventions empty | `[ok] No open interventions. The intervention queue is current.` |
| Recently resolved empty | `[info] No interventions resolved in the last 30 days.` |
| Activate save offer primary CTA | "Activate save offer" (`.c-button--primary`) — opens `<SaveOfferActivationModal />` |
| Save-offer pending pricing | `[warn] Save offer pending pricing context. Awaiting Pricing Engine.` (`.c-notice c-notice--warning`); CTA disabled |
| Save-offer pending approval | `[info] Save offer awaiting dual approval. Open Approval Inbox →` mint-text inline link |
| Approve and activate (in modal) | "Approve and activate save offer" (`.c-button--primary`) — calls `activateSaveOffer` (216-04) |
| Reason capture (in modal) | `.c-input` with required minLength=20 |
| Modal cancel | `.c-button--tertiary` "Cancel" |
| 7 playbook chip labels | per 216-04 `playbook-seeds.ts`: `engagement_deepening`, `ebr_scheduling`, `executive_outreach`, `champion_re_engagement`, `billing_recovery`, `expansion_conversation`, `account_brief` (intervention types: `save_offer`, `win_back_offer`) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | Zero at-risk + zero open + zero resolved | All empty notices |
| `populated` | Any of three sections has rows | Sections render with rows |
| `pending-pricing` | Any save-offer with `pricing_recommendation_id IS NULL AND offer_details NOT LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` | `<.c-notice c-notice--warning>` per row + sentinel rendered |
| `pending-approval` | Any intervention `status == 'awaiting_approval'` | "Open Approval Inbox →" link per row |
| `autonomy-ceiling` | `billing.charge` ceiling reached | `[block] Autonomy ceiling reached for billing.charge (save offers)` notice; activate CTA disabled |

**Acceptance Criteria:**
- AC C-1: 4 risk bands render via `<RiskBandBadge />`
- AC C-2: 5-dim health score per row via `<HealthScoreBadge />`
- AC C-3: 7-playbook seed catalog rendered as chip per row
- AC C-4: Save-offer activation modal reuses 215 billing-correction modal pattern
- AC C-5: `<SaveOfferPricingBlock />` renders `<Money>` XOR sentinel verbatim
- AC C-6: Reason capture ≥20 chars enforced; `evidence_pack_ref` REQUIRED
- AC C-7: DB-trigger `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` validates server-side; UI mirrors with disabled CTA
- AC C-8: Autonomy ceiling notice renders with `[block]` glyph
- AC C-9: Approval Inbox deep-link `/operations/approvals?handoff_kind=save_offer_approval&task_ref={intervention_id}`
- AC C-10: Mobile breakpoint: vertical card stack
- AC C-11: Storybook story registers 5 named-state stories (Empty/AtRisk/PendingPricing/PendingApproval/AutonomyCeiling)

---

### Surface H — `app/saas/invoices/page.tsx` (Invoice List with PII Redaction)

**Files:**
- `app/saas/invoices/page.tsx` — NEW; server component; fetches `/v1/saas/invoices` (Plan 04).
- `app/saas/invoices/page.module.css` — NEW.
- `app/saas/invoices/_components/PIIRedactedField.tsx` — NEW; **`'use client'`**; `onCopy preventDefault()`.
- `app/saas/invoices/_components/PIIRedactedField.module.css` — NEW.
- `app/saas/invoices/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>Invoices</h1>                                        |
| <p class="t-lead">{N} invoice(s). {M} past due.          |
+----------------------------------------------------------+
| <h2>Open invoices</h2>                                   |
| <table>                                                  |
|   <th> Invoice ID | Issued | Due | Amount | Tax | Status |
|        Customer | Vault ref | Actions                    |
|   <td> .c-chip-protocol invoice_id | date | date |        |
|        <Money/> | <Money/> | .c-badge--{state} |          |
|        <PIIRedactedField field="customer_name"/> |        |
|        .c-chip-protocol vault_ref |                       |
|        "View timeline →" link                             |
+----------------------------------------------------------+
| <h2>Recently paid</h2>                                   |
| <table> last 30 days; same column shape                  |
+----------------------------------------------------------+
| <h2>Reconciliation status</h2>                           |
| <.c-notice variant from row state>                       |
| <a class="c-button--tertiary mint-text">                 |
|   View webhook DLQ → (deep-link Recovery Center)         |
+----------------------------------------------------------+
```

**Components used:** `<PIIRedactedField />` (client; copy-protected), `<Money />`, `.c-card`, `.c-badge--{state}` (`paid` / `past_due` / `pending` / `failed` / `reconciled` / `pending_reconciliation` / `conflict_flagged`), `.c-chip-protocol` (invoice_id, vault_ref, payment_attempt_id), vanilla `<table>` with tabular-numerals.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Invoices" |
| `.t-lead` | "{N} invoice(s). {M} past due." |
| Open invoices empty | `[ok] No open invoices. All current.` |
| Recently paid empty | `[info] No invoices paid in the last 30 days.` |
| PII-redacted field rendering | `[REDACTED]` verbatim via `<PIIRedactedField />` for fields in 5 PII constant lists |
| Status badges | `[ok] Paid`, `[warn] Past due`, `[info] Pending`, `[err] Failed` |
| Reconciliation badges | `[ok] Reconciled`, `[info] Pending reconciliation`, `[err] Conflict flagged — review` |
| "View timeline →" | mint-text inline link to existing `/admin/billing/page.tsx` (213.4 surface) row detail |
| "View webhook DLQ →" | mint-text inline link to future P208-05 Recovery Center extension |
| Settings link footer | "Configure billing setup → Settings" (mint-text inline link to existing P213.3 `/settings/billing/page.tsx`) |
| Sensitive credential block on copy | (no visible copy; `onCopy preventDefault()` blocks clipboard write) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | Zero invoices | Empty notices |
| `populated` | Invoices > 0 | Full render |
| `past-due` | Any invoice `status == 'past_due'` | `.c-badge--warning` row state + `[warn]` glyph |
| `failed` | Any invoice `status == 'failed'` | `.c-badge--error` row state + `[err]` glyph |
| `conflict-flagged` | Any invoice `reconciliation_state == 'conflict_flagged'` | `.c-notice c-notice--error` at section top |

**Acceptance Criteria:**
- AC I-1: `<PIIRedactedField />` renders `[REDACTED]` for all 5 PII-field-list constants verbatim
- AC I-2: `onCopy preventDefault()` enforced on PII display nodes (Storybook interaction test)
- AC I-3: `<.c-chip-protocol>` renders `vault_ref` UUID via mint-as-text only
- AC I-4: API handler emits `saas_billing_events` row with `event_type == 'credential_view'` per fetch (server-side)
- AC I-5: Architecture-lock test asserts banned credential field names absent from page source
- AC I-6: Tabular-numerals on monetary columns
- AC I-7: 4 invoice status badges render with bracketed glyph
- AC I-8: 5 reconciliation_state badges render verbatim (Reconciled/Pending/Conflict/Manual/Excluded)
- AC I-9: Mobile vertical card stack; row PII fields preserve `[REDACTED]` rendering
- AC I-10: Storybook story registers 5 named-state stories (Empty/Healthy/PastDue/Failed/ConflictFlagged)
- AC I-11: Banned-lexicon zero-match across all module text

---

### Surface I — `app/saas/support/page.tsx` (Support Ticket Inbox + Response Approval)

**Mobile priority:** **`critical`** (CS reps need mobile for floor / off-desk triage).

**Files:**
- `app/saas/support/page.tsx` — NEW; server component; fetches `/v1/saas/support` (216 substrate via Plan 04).
- `app/saas/support/page.module.css` — NEW.
- `app/saas/support/_components/SupportResponseReviewModal.tsx` — NEW; **`'use client'`**.
- `app/saas/support/_components/ClassifierFilters.tsx` — NEW; **`'use client'`**; sortable filter chips.
- `app/saas/support/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>Support Intelligence</h1>                            |
| <p class="t-lead">{N} open ticket(s). {M} pending CS    |
|     approval. {K} churn signals.                          |
+----------------------------------------------------------+
| <ClassifierFilters /> (sentiment, intent, churn_signal,  |
|                        topic_tags, urgency_score)        |
+----------------------------------------------------------+
| <h2>Inbox</h2>                                           |
| <table>                                                  |
|   <th> Ticket ID | Received | Subject (PII-redacted)|    |
|        Sentiment | Intent | Churn signal | Urgency |     |
|        Status | Actions                                  |
|   <td> .c-chip-protocol ticket_id | date |               |
|        .c-code-inline + <PIIRedactedField/> |             |
|        <ClassifierChipRow/> | .c-badge--{state} |         |
|        "Review response →" mint-text link                 |
+----------------------------------------------------------+
| <h2>Recently resolved</h2>                               |
| <table> last 30 days                                     |
+----------------------------------------------------------+
| <SupportResponseReviewModal /> on row click:             |
|   <ClassifierChipRow /> (5 dimensions)                    |
|   <KbGroundingPanel /> (top-3 sources)                    |
|   <textarea> suggested response (editable)               |
|   .c-button--primary "Approve and send"                  |
|   .c-button--secondary "Reject and capture reason"       |
|   .c-button--tertiary "Edit suggested response"          |
+----------------------------------------------------------+
| <PlaceholderBanner variant=                              |
|   "future_phase_218_safe_auto_response_toggle">          |
+----------------------------------------------------------+
```

**Components used:** `<ClassifierChipRow />`, `<KbGroundingPanel />`, `<PIIRedactedField />`, `<ClassifierFilters />` (client), `<SupportResponseReviewModal />` (client), `.c-card`, `.c-badge--{state}`, `.c-chip-protocol`, `.c-code-inline`, vanilla `<table>`.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "Support Intelligence" |
| `.t-lead` | "{N} open ticket(s). {M} pending CS approval. {K} churn signals." |
| Inbox empty | `[ok] No open tickets. Inbox is current.` |
| Recently resolved empty | `[info] No tickets resolved in the last 30 days.` |
| Filter chip labels | "Sentiment", "Intent", "Churn signal", "Topic tags", "Urgency" |
| 4 sentiment values | `[ok] Positive`, `Neutral`, `[warn] Negative`, `[err] Frustrated` |
| 7 intent values | per 216-03 classifier: `[ok] Upgrade`, `Get help`, `Report bug`, `Request feature`, `[err] Complaint`, `[err] Cancel`, `[warn] Billing dispute` |
| Churn signal | `[err] Yes` / `[ok] No` |
| Status badges | `[info] Open`, `[info] In progress`, `[warn] Pending CS approval`, `[ok] Resolved` |
| Review modal heading | "Review suggested response — Ticket {ticket_id}" |
| KB confidence success | `[ok] KB grounding confidence: {score} (threshold: {KB_CONFIDENCE_THRESHOLD})` |
| KB confidence below | `[warn] KB grounding confidence below threshold — review and edit` |
| Approve and send primary | "Approve and send" (`.c-button--primary`) |
| Approve and send disabled (KB below) | (CTA disabled; warning notice shown above) |
| Approve and send disabled (autonomy ceiling) | `[block] Autonomy ceiling reached for external.send (at_risk/critical accounts)` (`.c-notice c-notice--error`); CTA disabled |
| Approve and send disabled (banned-lexicon match) | `[err] Suggested response contains banned lexicon ({matches}) — edit before send` (`.c-notice c-notice--error`); CTA disabled |
| Reject and capture reason secondary | "Reject and capture reason" (`.c-button--secondary`) — opens reason modal (≥20 chars) |
| Edit suggested response tertiary | "Edit suggested response →" (`.c-button--tertiary` mint text) — inline edit; re-runs `groundResponse` on save |
| Safe auto-response placeholder | `[info] Awaiting Phase 218 translation. Safe auto-response toggle ships in Phase 218 SOC2 admin extension.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | Zero tickets | Empty notices |
| `populated` | Tickets > 0 | Full render with classifier filters |
| `kb-below-threshold` | Reviewing ticket with `response_grounding_confidence < threshold` | Modal warning banner; CTA disabled |
| `autonomy-ceiling` | `external.send` ceiling reached | Modal `[block]` notice; CTA disabled |
| `banned-lexicon-match` | Server-side check finds banned tokens in response | Modal `[err]` notice; CTA disabled |
| `approve-success` | Approval succeeds | Transient toast `<.c-toast--success>` "[ok] Response approved and sent" |
| `approve-failure` | DB-trigger raises | Modal `[err]` notice with raised exception text |

**Acceptance Criteria:**
- AC SP-1: `<ClassifierChipRow />` renders 5 classifier dimensions verbatim
- AC SP-2: `<KbGroundingPanel />` renders top-3 KB sources with relevance_score badges
- AC SP-3: 4 sentiment + 7 intent + churn_signal boolean + topic_tags array + urgency_score numeric all rendered with bracketed-glyph pairing
- AC SP-4: Approve and send DISABLED when KB confidence below threshold
- AC SP-5: Approve and send DISABLED when autonomy ceiling reached
- AC SP-6: Approve and send DISABLED when banned-lexicon zero-match server-side check fails
- AC SP-7: Banned-lexicon scan runs server-side BEFORE the dispatch UPDATE call
- AC SP-8: Reason capture ≥20 chars enforced on Reject path
- AC SP-9: Edit path re-runs `groundResponse`; if confidence drops, CTA re-disables
- AC SP-10: PII redaction applied to ticket subject + description fields per 216 §UI Binding Contract 4
- AC SP-11: **Mobile priority `critical`** registered in `lib/markos/operator/shell.ts`; bottom-sheet modal pattern
- AC SP-12: 44px touch targets enforced via global `(pointer: coarse)` rule
- AC SP-13: Storybook story registers 7 named-state stories (Empty/Open/Reviewing/KBBelow/AutonomyCeiling/BannedLexicon/Approved)
- AC SP-14: Safe auto-response toggle deferred to P218+ via placeholder banner
- AC SP-15: Approval Inbox deep-link `/operations/approvals?handoff_kind=support_response_approval&task_ref={ticket_id}` mint-text inline

---

### Surface J — `app/saas/agents/page.tsx` (SAS Agent Readiness Registry Viewer)

**Files:**
- `app/saas/agents/page.tsx` — NEW; server component; fetches `/v1/saas/agents` (Plan 04).
- `app/saas/agents/page.module.css` — NEW.
- `app/saas/agents/page.stories.tsx` — NEW.

**Layout grid:**
```
+----------------------------------------------------------+
| <h1>SAS Agent Registry</h1>                              |
| <p class="t-lead">{N} agents registered. {M} runnable.   |
+----------------------------------------------------------+
| <h2>SAS-01..06 (P217 ships)</h2>                          |
| <table> 6 rows                                            |
|   <th> Token | Role | Inputs | Outputs | Cost            |
|        Approval mode | Failure class | Runnable           |
|   <td> .c-chip-protocol agent_token | role | input chips |
|        | output chips | <Money/> XOR sentinel |           |
|        .c-badge--{info,warning} | .c-badge--{class} |     |
|        .c-status-dot--live OR .c-status-dot--error       |
+----------------------------------------------------------+
| <h2>Future SAS targets (PLG/EXP/ABM/VRL/IAM/CMT/EVT/...)|
| <PlaceholderBanner variant=                              |
|   "future_phase_218_growth_dashboards" />                |
| <table> placeholder rows showing target tokens; all       |
|         runnable=false; deferred to P218/P219/P220        |
+----------------------------------------------------------+
```

**Components used:** `.c-card`, `.c-badge--{state}` (approval mode + failure class + runnable), `.c-status-dot--{live,error}`, `.c-chip-protocol`, `<Money fromPricingRecommendation>`, `<PlaceholderBanner>`, vanilla `<table>`.

**Copy register:**
| Element | Copy |
|---------|------|
| `<h1>` | "SAS Agent Registry" |
| `.t-lead` | "{N} agents registered. {M} runnable." |
| Empty | n/a — 6 SAS agents always present (P217-03 seed); registry never empty |
| 6 SAS agent token labels | Per 217-03 plan + SaaS Suite Canon: `sas-onboarding`, `sas-narrative`, `sas-feedback`, `sas-churn-risk`, `sas-revenue-narrative`, `sas-savings-tracker` |
| 4 approval mode badges | `.c-badge--{info if auto, info if single_approval, warning if dual_approval, warning if cooling_off}`: `[info] Auto`, `[info] Single approval`, `[warn] Dual approval`, `[warn] Cooling off` |
| 7 failure class badges | per 207 `AgentFailureClass`: `[info] Transient`, `[warn] Policy`, `[info] User input`, `[warn] Quota`, `[warn] Upstream`, `[err] Poison`, `[info] Cancel` |
| Runnable status | `.c-status-dot--live` + `[ok] Runnable` (only when `runnable=true`); `.c-status-dot--error` + `[err] Not runnable` (P217 default — SAS-10 invariant) |
| Cost preview | `<Money fromPricingRecommendation>` recipe XOR sentinel |
| Future SAS targets | `[info] Awaiting Phase 218 translation. Growth target agents (PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, REV) become runnable in Phase 218-220 plans.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `populated` | Always (6 SAS rows seeded) | Full table |
| `runnable-pending` | All 6 SAS agents `runnable=false` (P217 default) | All rows render `.c-status-dot--error` + `[err] Not runnable` |
| `runnable-future` | After P218+ activation | (out of scope; future state) |

**Data dependencies:**
- `sas_agent_readiness` table per 217-03 (6 rows; SAS-10 invariant: all `runnable=false` in P217)
- 7 readiness flags: `contracts_ready`, `cost_visible`, `approval_posture_set`, `tests_present`, `surfaces_registered`, `mcp_tool_registered`, `runnable`

**Acceptance Criteria:**
- AC G-1: 6 SAS rows always present (verified by translation-gate test)
- AC G-2: Each row renders agent_token + role + inputs + outputs + cost + approval mode + failure class verbatim from 217-03 contract
- AC G-3: All 6 rows show `runnable=false` in P217 (SAS-10 invariant; closeout test asserts)
- AC G-4: 4 approval mode badges render verbatim from 206 mutation-class doctrine
- AC G-5: 7 failure class badges render verbatim from 207 AgentFailureClass
- AC G-6: Cost preview uses `<Money fromPricingRecommendation>` XOR sentinel
- AC G-7: Future SAS targets section renders placeholder banner
- AC G-8: Mobile vertical card stack
- AC G-9: Storybook story registers 3 named-state stories (Default/AllNotRunnable/CostSentinel)

---

## Cross-Cutting Acceptance Criteria

These ACs apply to ALL 9 surfaces + the layout (10 total artifacts):

| ID | Cross-cutting AC |
|----|------------------|
| **X-1** | Zero hex literals in any `app/saas/**/*.{tsx,module.css}`; all colors via `var(--color-*)` (D-08) |
| **X-2** | Zero hard-coded `font-size`/`font-weight`/`color` in any `app/saas/**`; all via DESIGN.md `typography.*` tokens (D-08) |
| **X-3** | Zero hard-coded dollar/peso literals; all monetary via `<Money fromPricingRecommendation>` XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel (205 + 215 inheritance) |
| **X-4** | Zero hard-coded tier name strings (`"Growth Monthly"`, `"Starter"`, etc.) in any 217 surface JSX/CSS |
| **X-5** | Zero `.c-card--feature` use anywhere in `app/saas/**` (D-13 reserved for marketing) |
| **X-6** | Zero `.c-table` use anywhere; vanilla `<table>` only with token-only recipe (D-14) |
| **X-7** | Banned-lexicon zero-match across all 217 surface text content (CLAUDE.md banned lexicon) — CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `app/saas/**` |
| **X-8** | All 9 surfaces register `mobile_priority` in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: saas_*`; 8 surfaces `secondary`, 1 surface (`/saas/support`) `critical`; `desktop_only` is FORBIDDEN |
| **X-9** | All 9 surfaces register CSF3 named-state Storybook stories with ≥3 stories each (per 213.2 carry-forward) |
| **X-10** | All 9 surfaces register accessibility tests under `test/ui-a11y/217-saas-a11y.test.js` mirroring 213.2 / 213.4 chrome-a11y patterns |

---

## Surface Backend Doctrine (12 ACs from Plans 01-05 cross-checked at UI level)

These ACs are owned by Plans 217-01..05 but verified at the UI surface level via 217-06 ingestion:

| ID | Doctrine AC |
|----|-------------|
| **B-1** | 15 revenue metric definitions (217-01) render verbatim on `/saas/revenue` page; metric_key ENUM 15 literals match |
| **B-2** | 5-tier source precedence (Billing > Processor > Accounting > CRM > Manual) renders verbatim per row on `/saas/revenue` |
| **B-3** | 5 reconciliation_state literals (`reconciled`, `pending_reconciliation`, `conflict_flagged`, `manually_corrected`, `excluded`) render with bracketed glyph |
| **B-4** | MRR snapshot freshness chip in sidebar reads `last_run_completed_at` from `saas-mrr-snapshot.js` cron (217-02); kernel-pulse on fresh; warning notice on stale (>36h) |
| **B-5** | 6-column MRR waterfall consumes `saas_mrr_waterfall_entries` table verbatim (217-02) |
| **B-6** | Cohort retention heatmap consumes `saas_mrr_snapshots.cohort_retention` derived field (217-02) |
| **B-7** | 6 SAS agents from `sas_agent_readiness` (217-03 seed) render with all 7 readiness flags verbatim |
| **B-8** | 12 `/v1/saas/*` endpoints (Plan 04) consumed across 10 surfaces; OpenAPI schema citations land per surface |
| **B-9** | 10 MCP tools (Plan 05) referenced via tooltips on relevant rows (e.g. "This row backed by markos-saas/get_at_risk_accounts MCP tool") |
| **B-10** | Translation gate seed: 12 SG planned-only nav rows present in `saas_nav_visibility`; closeout test asserts `planned_only=true AND is_active=false` for all 12 |
| **B-11** | DB-trigger `SAAS_NAV_REQUIRES_ACTIVATION` validates UI gate logic at DB layer (defense-in-depth pair) |
| **B-12** | `isSaaSSurfaceEnabled` 3-condition gate enforced server-side in `app/saas/layout.tsx` |

---

## Total Acceptance Criteria

| Surface | Surface ACs | Notes |
|---------|-------------|-------|
| Layout | 10 (L-1..L-10) | Activation gate + sidebar |
| Overview | 10 (O-1..O-10) | KPI grid + recalc |
| Subscriptions | 8 (S-1..S-8) | 214 reuse + 217 joins |
| Plans | 6 (P-1..P-6) | Read-only catalog |
| Revenue | 9 (R-1..R-9) | 15 metrics + reconciliation |
| Waterfall | 10 (W-1..W-10) | 6-column waterfall + heatmap |
| Churn | 11 (C-1..C-11) | 7 playbooks + save offer |
| Invoices | 11 (I-1..I-11) | 5 PII constants + redaction |
| Support | 15 (SP-1..SP-15) | 5-classifier + KB grounding + banned-lexicon |
| Agents | 9 (G-1..G-9) | 6 SAS rows + readiness |
| **Cross-cutting** | **10 (X-1..X-10)** | **All surfaces** |
| **Backend doctrine** | **12 (B-1..B-12)** | **Plans 01-05 + 06** |
| **TOTAL** | **121 ACs** | (target was ~80-100; expanded due to 4 inheritance contracts × 10 surfaces matrix) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | not applicable — repo not shadcn-initialized | not applicable |
| third-party registries | none | not applicable |
| internal extracted components | `<HealthScoreBadge />`, `<RiskBandBadge />`, `<ClassifierChipRow />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />` (216 §D-15 recommendations; 217 ships them); `<SaaSActivationPanel />`, `<SaaSSubscriptionsTable />` (214 reused); `<Money />`, `<PlaceholderBanner />` (existing); `<MrrWaterfall />`, `<CohortRetentionHeatmap />`, `<RecalcHealthCTA />`, `<SaveOfferActivationModal />`, `<SupportResponseReviewModal />`, `<ClassifierFilters />`, `<SaasSidebar />` (NEW client subcomponents) | internal — Storybook visual regression + interaction tests; banned-lexicon zero-match; architecture-lock-rerun.test.js |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (verbatim copy register per surface; banned-lexicon zero-match; bracketed-glyph pairing)
- [ ] Dimension 2 Visuals: PASS (token-only; D-08..D-15; D-21 server/client boundary; tabular-numerals on monetary)
- [ ] Dimension 3 Color: PASS (60/30/10 split with mint reserved-for list; mint never as fill except `net_new_mrr`)
- [ ] Dimension 4 Typography: PASS (JetBrains Mono + Inter only; tabular-numerals on monetary columns; eyebrow + body discipline)
- [ ] Dimension 5 Spacing: PASS (8-point scale; off-grid auto-FAIL; mobile 44px touch targets via global rule)
- [ ] Dimension 6 Registry Safety: PASS (no third-party registries; internal extracted components Storybook-tested)

**Approval:** pending
