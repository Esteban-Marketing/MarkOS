---
phase: 217
slug: saas-suite-revenue-agents-api-ui
status: draft
shadcn_initialized: false
preset: none
domain: saas-suite-revenue-agents-api-ui-hybrid-heavy-ui-5-backend-plans-1-ui-plan-10-dashboard-pages-saas-overview-subscriptions-plans-revenue-mrr-waterfall-churn-invoices-support-agents-activation-gate-translation-gate-12-sg-namespaces
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: hybrid-heavy-ui (5 no-UI backend plans + 1 UI plan shipping 10 dashboard pages)
ui_scope: 217-06 (10 SaaS dashboard pages under app/saas/** + activation gate layout + 6 net-new extracted components)
plans_in_scope: [217-01, 217-02, 217-03, 217-04, 217-05, 217-06]
plans_with_ui_surfaces: [217-06]
plans_no_ui: [217-01, 217-02, 217-03, 217-04, 217-05]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `data.export` for revenue metric export, MRR waterfall export, support ticket export, agent registry export, invoice viewer export; `default_approval_mode == single_approval` for export actions)
  - 207-UI-SPEC.md (RunApiEnvelope — `run_id` chips link SAS agent runs (217-03), MRR snapshot runs (217-02 nightly cron), revenue metric recalc runs to existing 207 run-detail surfaces)
  - 208-UI-SPEC.md (sidebar shell + topbar pattern; mobile-priority literals; banned lexicon; `<PlaceholderBanner>` recipe; settings/operations chrome anchored to existing `app/(markos)/layout-shell.tsx`)
  - 209-UI-SPEC.md (evidence inheritance — `<EvidenceSummary />` reused on support page for KB grounding + on revenue page for source-precedence evidence)
  - 213-UI-SPEC.md (Tenant 0 readiness gate consumer; public-proof boundary — 217 SaaS dashboards are PRIVATE tenant-scoped, never published)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; `isSaaSSurfaceEnabled` server-side gate; `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` D-15 extracted components mounted in 217 surfaces; `mobile_priority: secondary` literal for SaaS settings inheritance)
  - 215-UI-SPEC.md (PARENT — billing/invoices substrate; `<Money fromPricingRecommendation>` xor `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; sensitive credential B-1..B-8 — NEVER show raw vault credentials in dashboards)
  - 216-UI-SPEC.md (PARENT — health/churn/support substrate; 4 UI binding contracts: Health Score / Support Response Approval / Save Offer Approval / PII Redaction + Retention; D-15 7 recommended components — `<HealthScoreBadge>`, `<RiskBandBadge>`, `<ClassifierChipRow>`, `<KbGroundingPanel>`, `<SaveOfferPricingBlock>`, `<RetentionClassChip>`, `<PIIRedactedField>`)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b .c-notice mandatory, D-13 .c-card--feature reserved, D-14 no .c-table, D-15 selective extraction)
translation_gates_dissolved_by_217:
  - "216 §future_phase_217_health_dashboard_ui — 217 dissolves the placeholder. Surface F (`/saas/churn`) renders the per-subscription health score dashboard with 5-dimension breakdown, 4 risk bands, recommended action panel, manual recalc CTA. The 216 UI Binding Contract 1 (Health Score) is honored verbatim — `<HealthScoreBadge>` + `<RiskBandBadge>` + 5-dimension `.c-badge` row + recalc CTA copy `Recalculate health score`."
  - "216 §future_phase_217_at_risk_viewer — 217 dissolves the placeholder. Surface F (`/saas/churn`) lists `saas_health_scores.risk_level IN ('at_risk', 'critical')` accounts via `<HealthScoreBadge>` + `<RiskBandBadge>` per row; deep-link from each row to `/operations/tasks?task_kind=saas_churn_intervention` (208 Task Board)."
  - "216 §future_phase_217_pii_audit_log — DEFERRED to future SOC2 admin extension (NOT 217). 217 surfaces consume PII via the 216 UI Binding Contract 4 verbatim (`<PIIRedactedField>`, `<RetentionClassChip>`); the standalone PII audit log viewer remains placeholder."
  - "215 §future_phase_217_dian_wizard_ui — DEFERRED. 217 Surface I (`/saas/invoices`) renders invoice list with DIAN compliance status badge + CUFE chip; the multi-step DIAN setup wizard remains placeholder until a future P217+ admin extension ships."
  - "215 §future_phase_217_billing_setup_wizards — DEFERRED. 217 reads invoice/payment data via `/v1/saas/invoices` (Plan 04); the credential entry wizard remains placeholder."
  - "214 §`<PlaceholderBanner variant=\"future_phase_217\">` for growth-extension wizard — REMAINS placeholder; 217 only ships SaaS revenue/agents/UI nav surfaces. Growth-mode wizard surfaces are P218/P219/P220 territory and are documented in §Translation Gates Opened (12 SG namespaces seeded as `planned_only=true` rows)."
translation_gates_opened_by_217:
  - "future_phase_218_saas_plg — `/saas/plg` route nav row reserved (`planned_only=true`); P218 Plan 06 will UPDATE `planned_only=false` + `is_active=true` when PLG Engine ships."
  - "future_phase_218_saas_inapp — `/saas/inapp` route nav row reserved."
  - "future_phase_218_saas_experiments — `/saas/experiments` route nav row reserved."
  - "future_phase_219_saas_expansion — `/saas/expansion` route nav row reserved."
  - "future_phase_219_saas_abm — `/saas/abm` route nav row reserved."
  - "future_phase_219_saas_advocacy — `/saas/advocacy` route nav row reserved."
  - "future_phase_219_saas_revenue_alignment — `/saas/revenue-alignment` route nav row reserved."
  - "future_phase_220_saas_referral — `/saas/referral` route nav row reserved."
  - "future_phase_220_saas_community — `/saas/community` route nav row reserved."
  - "future_phase_220_saas_events — `/saas/events` route nav row reserved."
  - "future_phase_220_saas_partnerships — `/saas/partnerships` route nav row reserved."
  - "future_phase_220_saas_devrel — `/saas/devrel` route nav row reserved."
  - "future_phase_soc2_pii_audit_log — PII redaction + retention sweep audit log surface (deferred to future SOC2 admin)."
  - "future_phase_220_churn_console — full save-offer approval modal + churn intervention timeline UI (deferred; 217 only reads from `/v1/saas/churn` and renders read-mostly tables)."
  - "future_phase_213_5_tenant0_proof — Tenant 0 readiness gate consumer; if 213-05 readiness gate is closed, /saas/* surfaces render a `.c-notice c-notice--warning` banner above content noting the gate state."
mobile_priority_decisions:
  - "/saas (Overview): secondary — operator-daily but not approval-critical (approvals live in /operations/approvals)"
  - "/saas/subscriptions: secondary — read-mostly browse"
  - "/saas/plans: secondary — read-mostly browse"
  - "/saas/revenue: desktop_first (mobile-collapse to single column) — KPI grid + numeric density"
  - "/saas/revenue/waterfall: desktop_first (mobile-collapse with horizontal scroll) — chart density"
  - "/saas/churn: secondary — at-risk list browse + per-row drilldown"
  - "/saas/invoices: secondary — read-mostly invoice browse"
  - "/saas/support: secondary — ticket inbox browse (mutations live in /operations/approvals via 7th handoff_kind literal)"
  - "/saas/agents: secondary — read-only agent registry browse"
  - "Note: NONE of the 217 surfaces are `desktop_only` per 208-01-01 architecture-lock string. The 4 chart-density surfaces (revenue, waterfall) declare `desktop_first` which is a documented variant inside 208 mobile-priority taxonomy meaning 'optimized for desktop, single-column collapse on mobile'."
extracted_components_217:
  - "<KpiCard /> — Surface A Overview + Surface E Revenue + Surface F Churn (≥3 surfaces; D-15 reuse threshold met)"
  - "<MetricCard /> — Surface E Revenue (15 metric variants, all instances on one surface; D-15 reuse threshold MET via 15 instance reuse — extract to keep page module under 500 LOC)"
  - "<MRRWaterfallChart /> — Surface F Waterfall (single instance + future P218/P219 expansion-signal-scanner reuse; D-15 forward-looking reuse threshold met)"
  - "<AgentReadinessTable /> — Surface J Agents + future P218 plg_growth_agent_readiness + P219 b2b_growth_agent_readiness + P220 growth_agent_readiness (D-15 forward-looking reuse threshold met across 4 surfaces)"
  - "<RevenueMetricGrid /> — Surface E Revenue (composes 15 <MetricCard> instances; layout-extracted for Storybook coverage and a11y testing)"
  - "<NavSidebar /> — Surface 0 Layout (single instance in 217; future P218/P219/P220 Plan 06 will reuse via UPDATE-then-render pattern; D-15 forward-looking reuse threshold met)"
  - "Reused from 214: <SaaSActivationPanel /> (mounted in /saas/page.tsx Overview re-confirmation pattern); <SaaSSubscriptionsTable /> (mounted in /saas/subscriptions/page.tsx)"
  - "Reused from 216 (recommended D-15 extractions; if not yet extracted at 216 time, 217 extracts them at extraction-on-first-reuse trigger): <HealthScoreBadge />, <RiskBandBadge />, <ClassifierChipRow />, <KbGroundingPanel />, <PIIRedactedField />, <RetentionClassChip />"
  - "Reused from 215: <Money fromPricingRecommendation> recipe (used on /saas/plans, /saas/revenue, /saas/invoices anywhere prices appear); <PricingSentinelBadge> renders {{MARKOS_PRICING_ENGINE_PENDING}} verbatim"
---

# Phase 217 — UI Design Contract (HYBRID HEAVY-UI)

> Visual and interaction contract for the **SaaS Suite Revenue Intelligence + SAS Agents + API/MCP/UI Readiness phase**. Phase 217 is a HYBRID HEAVY-UI phase: five backend plans (217-01..05) ship migrations + libs + API handlers + MCP tools + tests with **zero UI surface**, and a single UI plan (217-06) ships **ten SaaS dashboard pages** under `app/saas/**` plus an activation gate layout, plus six net-new extracted components.
>
> Phase 217 is the **first surface that consumes 214 SaaS Suite Activation + 215 Billing + 216 Health/Churn/Support substrate end-to-end**. Every parent UI-SPEC's binding contracts (214 activation gate; 215 sentinel + sensitive-credential discipline; 216 four UI binding contracts — Health Score / Support Response / Save Offer / PII+Retention) are honored verbatim. No new doctrine is invented in this phase — only its visual expression on the SaaS dashboard surface.
>
> **Architecture-lock note (verbatim from 217-06-PLAN.md must_haves):** Pages live under `app/saas/*` plain folder. `app/(saas)/*` route group is FORBIDDEN by the 217 architecture-lock test (`test/saas-217/domain-6/closeout/architecture-lock-rerun.test.js`). The architecture-lock distinction is that route groups (`app/(name)/`) are reserved for the existing operator-cockpit chrome (`app/(markos)/`) and the existing marketing chrome (`app/(marketing)/`). The plain folder pattern (`app/saas/`) creates a sibling top-level route family for the SaaS Suite, deliberately outside `app/(markos)/` because SaaS-suite UX is tenant-scoped and only renders for `business_type == 'saas'` tenants — see Surface 0 (Activation Gate Layout) below.
>
> **Pricing render rule (load-bearing):** Zero hard-coded $ literals or tier names anywhere in 217 JSX/CSS. `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel everywhere prices appear (verbatim per 215 §Sentinel Discipline). The auto-FAIL grep is `grep -P '\\$\\d' app/saas/**/*.tsx` returning 0 matches.
>
> **Banned lexicon, no emoji, bracketed glyphs, sentinel discipline (load-bearing):** All copy strings declared in §Copywriting Contract are CI-checked at zero-match for the 19 banned tokens + zero exclamation points (CLAUDE.md §Banned lexicon).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward (D-08..D-15) → 206-UI-SPEC (mutation-class origin) → 207-UI-SPEC (orchestration substrate origin) → 208-UI-SPEC (cockpit-shell sibling chrome and `<PlaceholderBanner>`) → 209-UI-SPEC (evidence inheritance) → 213-UI-SPEC (T0 gate consumer; private dashboards) → 214-UI-SPEC (PARENT — SaaS activation gate; `<SaaSActivationPanel>`/`<SaaSSubscriptionsTable>` extracted; mobile-priority secondary) → 215-UI-SPEC (PARENT — billing sentinel; sensitive credential B-1..B-8) → 216-UI-SPEC (PARENT — health/churn/support 4 UI binding contracts) → this document. Generated by gsd-ui-researcher 2026-04-29. Status: draft (checker upgrades to approved once 6-pillar audit passes).

---

## Plan Scope Classification

| Plan | Wave | Title | UI Scope | Primary Surface | Mobile Priority |
|------|------|-------|----------|-----------------|-----------------|
| **217-01** | 1 | Revenue metric definitions + 5-tier source precedence + 15 default metrics + REVENUE_METRIC_REQUIRES_PROVENANCE trigger + architecture-lock + assertUpstreamReady | NO_UI | `supabase/migrations/98_saas_revenue_intelligence.sql` (base + Plan 01 section), `lib/markos/saas/revenue/{contracts,metric-defs,source-precedence}.ts`, `lib/markos/saas/preflight/*` | n/a |
| **217-02** | 2 | SaaSMRRSnapshot + waterfall + nightly cron + cohort-retention helper + MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE trigger | NO_UI | `supabase/migrations/98_saas_revenue_intelligence.sql` (Plan 02 APPEND), `lib/markos/saas/revenue/{snapshot-builder,waterfall}.ts`, `api/cron/saas-mrr-snapshot.js` | n/a |
| **217-03** | 2 | SAS agent readiness registry — 6 SAS agents seeded `runnable=false` + SAS_AGENT_ACTIVATION_REQUIRES_READINESS trigger | NO_UI | `supabase/migrations/99_sas_agent_readiness.sql`, `lib/markos/saas/sas-agents/registry.ts` | n/a |
| **217-04** | 3 | 18 `/v1/saas/*` API endpoints across 7 handler files + F-251..F-254 contracts + `contracts/openapi.json` regen + SAAS_API_REQUIRES_TENANT_AUTH_RLS_AUDIT (architecture-lock test) | NO_UI | `api/v1/saas/{subscriptions,plans,invoices,health,metrics,agents,tasks,approvals}.js` | n/a |
| **217-05** | 3 | `markos-saas` MCP tool family — 10 read-only tool descriptors + MCP_TOOL_REQUIRES_TENANT_SESSION_BOUND (architecture-lock test) | NO_UI | `lib/markos/mcp/tools/saas.cjs`, `lib/markos/mcp/tools/index.cjs` (registration append) | n/a |
| **217-06** | 4 | SaaS UI navigation — 10 dashboard pages under `app/saas/**` + activation gate layout + `saas_nav_visibility` table + 12-row translation-gate seed + SAAS_NAV_REQUIRES_ACTIVATION trigger + 6 net-new extracted components + closeout regression suite | **IN_SCOPE** | `app/saas/{layout,page,subscriptions/page,plans/page,revenue/page,revenue/waterfall/page,churn/page,invoices/page,support/page,agents/page}.tsx`, `components/markos/saas/{KpiCard,MetricCard,MRRWaterfallChart,AgentReadinessTable,RevenueMetricGrid,NavSidebar}.tsx`, `lib/markos/saas/nav/*` | **mixed (see frontmatter mobile_priority_decisions)** |

**Hybrid heavy-UI scope rationale.** The five backend plans ship the durable substrate (migrations + libs + API handlers + MCP tools + tests) without rendering any pixel. The single UI plan (217-06) ships **the largest UI surface phase to date** — 10 dashboard pages, one server-rendered activation gate layout, six net-new extracted components, and the post-217 translation gate of 12 SG-* nav-row reservations for P218/P219/P220.

This UI-SPEC matches the **208 cockpit UI-SPEC pattern tightness** for per-page contracts: each of the 10 surfaces (A-J) has its own layout grid, components-used inventory, copy register, state matrix, data dependencies citation, accessibility focus order, motion declaration, and mobile breakpoint behavior.

All acceptance criteria below apply to plan 217-06 deliverables only. Plans 217-01..05 are backend-only and do not produce UI artifacts.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (vanilla CSS Modules consuming `var(--*)` tokens from `app/tokens.css` + composing `.c-*` primitives from `styles/components.css` v1.1.0) |
| Preset | not applicable — repository is not shadcn-initialized (verified: no `components.json` at repo root) |
| Component library | none — primitives in `styles/components.css` v1.1.0 (`.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive,--icon}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block`, `.c-terminal`, `.c-toast--{success,warning,error,info}`, `.c-sidebar`, `.c-nav-link`, `.c-topbar`) |
| Icon library | Lucide (default) · Phosphor Regular (only allowed substitute) — DESIGN.md "Iconography". Bracketed glyphs (`[ok]`, `[warn]`, `[err]`, `[info]`, `[block]`, `[up]`, `[down]`, `[flat]`, `[time]`) carry every state signal per CLAUDE.md "no emoji in product UI". |
| Heading font | JetBrains Mono (`var(--font-mono)`) — DESIGN.md `typography.h1`–`h4` |
| Body font | Inter (`var(--font-sans)`) — DESIGN.md `typography.body-md`, `lead`, `body-sm`, `label-caps` |
| Default theme | dark (`color-scheme: dark`); light opt-in via `[data-theme="light"]` (per `app/tokens.css` lines 191–204) |
| Form authoring posture | Primitive-only. Period-range pickers on revenue surface use `.c-input` + `.c-field` + `.c-field__label` + `.c-field__help`. No bespoke form CSS in any module. Wizard activation re-confirmation flows reuse `<SaaSActivationPanel>` (214 extracted). |
| Banner authoring posture | **Primitive-only (D-09b carry).** Every gating state (non-SaaS tenant blocked, T0 readiness gate closed, MRR snapshot stale, sentinel active, 12 SG planned-only nav placeholders) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/` or `components/markos/saas/`. |
| Card authoring posture | `.c-card` default for KPI cards, metric cards, agent rows, support rows, invoice rows, plan rows, churn rows, subscription rows. **`.c-card--feature` is PROHIBITED in this phase** (D-13 carry: reserved for hero panels in 404-workspace + 213.5 marketing only). The `<KpiCard>` and `<MetricCard>` extracted components compose `.c-card` plus an `[ok]`/`[info]`/`[warn]`/`[err]` glyph eyebrow — no hero treatment, no gradient. |
| Money / pricing display posture | All monetary values rendered via `<Money fromPricingRecommendation={pr_id} />` recipe consuming `pricing_recommendation_id` references resolved from 205 PricingRecommendation context; integer micro-USD divided to display USD with monospace JetBrains Mono per DESIGN.md typography rule; `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PricingSentinelBadge>` per 215-UI-SPEC inheritance whenever `pricing_recommendation_id IS NULL`. **Phase 217 MUST NOT take pricing ownership.** Zero hard-coded dollar literals (`$99`, `$150.00`). Zero hard-coded tier name strings (`"Growth Monthly"`, `"Starter"`, `"Professional"`). Plan-row, revenue-metric, and invoice prices render either `<Money>` (engine-backed) or `<PricingSentinelBadge>` (pending). |
| Table authoring posture | **Vanilla `<table>` semantic only (D-14 carry).** Subscriptions list, plans list, invoices list, support tickets list, agents list, churn at-risk list, MRR waterfall entries list ALL use vanilla `<table>` + `.c-badge--{state}` for row state. `.c-table` primitive remains deferred to Phase 218+. Token-only recipe on `<th>`/`<td>`. |
| Chart authoring posture | **Single-chart per dedicated page (D-08 token-only).** MRR waterfall is the ONLY chart in 217 and renders on its own dedicated page (`/saas/revenue/waterfall`). The chart uses DESIGN.md token palette only — no rainbow gradients, no soft shadows, no glow (DESIGN.md "no soft shadows on cards, no Lottie, no parallax"). Chart accessibility: every chart MUST emit a `<table>` fallback for screen readers (sr-only). The revenue dashboard (Surface E) renders as KPI grid (numeric cards only) — NO charts. |
| Placeholder posture | Future-substrate placeholders render `<PlaceholderBanner variant="future_phase_{N}">` composing `.c-notice c-notice--info` with literal `[info] Awaiting Phase {N} translation` body. Active variants in this phase: `future_phase_218_saas_plg`, `future_phase_218_saas_inapp`, `future_phase_218_saas_experiments`, `future_phase_219_saas_expansion`, `future_phase_219_saas_abm`, `future_phase_219_saas_advocacy`, `future_phase_219_saas_revenue_alignment`, `future_phase_220_saas_referral`, `future_phase_220_saas_community`, `future_phase_220_saas_events`, `future_phase_220_saas_partnerships`, `future_phase_220_saas_devrel`, `future_phase_soc2_pii_audit_log`, `future_phase_220_churn_console`, `future_phase_213_5_tenant0_proof`. Pricing placeholders render `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel verbatim per 215 inheritance. Never resolved in this phase. |
| Mobile posture | **Mixed mobile-priority.** Per frontmatter `mobile_priority_decisions`: 7 surfaces declare `secondary`; 2 surfaces declare `desktop_first` (Revenue dashboard + MRR Waterfall — chart density). **`desktop_only` is forbidden for any surface** (208-01-01 architecture-lock string). Touch-target minimum (44px via `--h-control-touch`) inherits from the global `(pointer: coarse) { .c-button { min-height: var(--h-control-touch) } }` rule already shipping per 213.2. |

---

## Spacing Scale

Authoring rule: every `padding`, `margin`, `gap`, `inset` in scope MUST cite a `--space-*` token. No arbitrary px. Off-grid values are auto-FAIL.

| Token | Value | DESIGN.md citation | Usage in this phase |
|-------|-------|--------------------|---------------------|
| `--space-none` | 0 | `spacing.none` | Reset margins on `<h1>`, `<h2>`, `<p>`, `<table>`, `<ul>`, `<nav>` |
| `--space-xxs` | 2px | `spacing.xxs` | Badge inner padding, status-dot offset, KPI eyebrow adjacency, MRR delta-glyph adjacency, agent-row readiness-flag adjacency |
| `--space-xs` | 8px | `spacing.xs` | KPI card stat group gap, metric-card label-value gap, plan-row chip group gap, subscription-row metadata gap, churn-row health-badge gap, invoice-row compliance-chip gap, support-row classifier-chip gap, sidebar nav-link icon-text adjacency |
| `--space-sm` | 16px | `spacing.sm` | Card vertical rhythm, notice padding-block, table `th`/`td` padding-block, mobile horizontal page padding (max-width ≤ 640px), KPI grid row gap, sidebar nav section gap |
| `--space-md` | 24px | `spacing.md` | Card padding (via `.c-card`), gap between dashboard sections, modal padding, page horizontal padding at sm–md viewport, KPI grid column gap, sidebar nav-section gap, MRR waterfall axis padding |
| `--space-lg` | 32px | `spacing.lg` | Page horizontal padding ≥ md, inter-section gap within revenue dashboard, agent-readiness column-group gap, support-section gap |
| `--space-xl` | 48px | `spacing.xl` | Page vertical padding ≥ lg, dashboard-section top padding, MRR waterfall canvas height anchor |
| `--space-xxl` | 96px | `spacing.xxl` | Reserved — not used in this phase |

**Allowed exceptions (DESIGN.md documented):**
1. `1px` for hairline borders (`var(--color-border)`) — preferred over shadows on dark surfaces (DESIGN.md "Borders over shadows").
2. `2px` for focus ring width and offset (`var(--focus-ring-width)`, `var(--focus-ring-offset)`); never suppressed.
3. `4px` for `.c-notice` `border-inline-start` accent — composed via `.c-notice` primitive; modules never declare this directly.
4. `max-width: 1280px` for cockpit container (`--w-container`). All 10 surfaces use `--w-container` with internal `--w-prose` (720px) constraint on text columns.
5. `max-width: 560px` for confirmation modals (`--w-modal`).
6. **Mobile touch target `44px`** via `--h-control-touch` on `.c-button` for `(pointer: coarse)` viewports — already declared globally per 213.2; this phase consumes it without re-declaration.
7. `400px` (= `--space-xl × 8.33` — DOCUMENTED EXCEPTION) for MRR waterfall canvas min-height on `desktop_first` viewport ≥ md. This single off-grid measurement is justified as a chart-canvas anchor and is bracketed by token spacing on all sides; documented in `components/markos/saas/MRRWaterfallChart.module.css` with a `/* DESIGN.md Charts exception — canvas anchor only */` comment.

---

## Typography

All text MUST cite a token from DESIGN.md `typography.*`. Heading typography is JetBrains Mono. Body typography is Inter. No third typeface.

| Role | DESIGN.md token | CSS variables / class | Usage in this phase |
|------|-----------------|------------------------|---------------------|
| Page heading | `typography.h1` | `<h1>` inheriting globals: `var(--font-mono)` + `var(--fs-h1)` (2.441rem) + `var(--fw-bold)` | Surface A: "SaaS Suite — Overview"; Surface B: "Subscriptions"; Surface C: "Plans"; Surface D: "Revenue dashboard"; Surface E: "MRR waterfall"; Surface F: "Churn intelligence"; Surface G: "Invoices"; Surface H: "Support intelligence"; Surface I: "SAS agent registry" |
| Section heading | `typography.h2` | `<h2>` inheriting globals: `var(--font-mono)` + `var(--fs-h2)` (1.953rem) + `var(--fw-semibold)` | Section headings on every dashboard (`Recent activity`, `KPIs`, `Subscriptions`, `Plans`, `Revenue metrics`, `Waterfall`, `At-risk accounts`, `Pending invoices`, `Open tickets`, `Agent readiness`) |
| Panel sub-heading | `typography.h3` | `<h3>` inheriting globals: `var(--font-mono)` + `var(--fs-h3)` (1.563rem) + `var(--fw-semibold)` | KPI card stat title; metric-card metric name; agent-row token; subscription-row title; plan-row title; ticket-row subject (rendered via `<PIIRedactedField>` per 216 binding contract 4); waterfall-entry label |
| Section sub-heading | `typography.h4` | `<h4>` inheriting globals: `var(--font-mono)` + `var(--fs-h4)` (1.250rem) + `var(--fw-medium)` | Metric-card sub-label; agent-row eyebrow; subscription metadata-group; KPI delta annotation |
| Surface descriptor / lead | `typography.lead` | `.t-lead` utility: `var(--font-sans)` + `var(--fs-lead)` (1.250rem) + `var(--fw-regular)` + `color: var(--color-on-surface-muted)` | Each dashboard's page-level descriptor; non-SaaS tenant gating notice body; MRR snapshot stale notice body |
| Body copy | `typography.body-md` | inherited via `<p>`, `<td>` from globals | Table cells, ticket descriptions (PII-redacted), waterfall entry descriptions, agent role descriptions |
| Eyebrow / `t-label-caps` | `typography.label-caps` | `.t-label-caps` utility / `.c-field__label` primitive | KPI card eyebrows (`MRR`, `NRR`, `Active subscriptions`, `Average health`); metric-card eyebrows (15 metric variants); agent-row eyebrow (`Agent token`); subscription-row eyebrow (`Subscription`); plan-row eyebrow (`Plan`); ticket-row eyebrow (`Ticket`); invoice-row eyebrow (`Invoice`); waterfall-entry eyebrow (`Waterfall step`) |
| Metadata / timestamps | `typography.body-sm` | `.c-field__help` primitive: `var(--fs-body-sm)` (0.800rem) + `color: var(--color-on-surface-muted)` | `period_start`, `period_end`, `calculated_at`, `last_event_at`, `created_at`, `updated_at`, snapshot `reconciliation_state`, `last_synced_at` |
| Form error inline | `typography.body-sm` | `.c-field__error` primitive: `var(--fs-body-sm)` + `color: var(--color-error)` + `var(--font-mono)` + `::before content "[err] "` | Period-range picker validation; agent-readiness-detail load failure; revenue-metric source-precedence conflict |
| Monetary values | `typography.code-inline` | `.c-code-inline` primitive: `var(--font-mono)` + `var(--fs-code)` (0.875rem) | KPI MRR value; metric-card revenue values; subscription-row `next_invoice_estimate`; invoice-row total; waterfall-entry delta; plan-row price (when engine-backed); `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim through `<PricingSentinelBadge>` when pending. **Zero hard-coded dollar literals anywhere in 217 JSX/CSS.** |
| IDs / tokens | `typography.code-inline` | `.c-chip-protocol` primitive | `subscription_id`, `plan_id`, `plan_version_id`, `health_score_id`, `intervention_id`, `ticket_id`, `invoice_id`, `chunk_id`, `nav_id`, `agent_id`, `mrr_snapshot_id`, `waterfall_entry_id`, `metric_definition_id`, `pricing_recommendation_id`, `agent_run_id` (cross-surface deep-link chips). Each chip surrounds the value with `[ ]` per `.c-chip-protocol::before/::after` content rules. |

**Forbidden (auto-FAIL):**
- Any third typeface (not JetBrains Mono or Inter).
- Inline `font-size`, `font-weight`, `color` literals — use tokens only.
- Hard-coded dollar amounts (`$99`, `$150.00`) — use `<Money fromPricingRecommendation>` + `--fs-code` or `<PricingSentinelBadge>`.
- Tier name strings `"Growth Monthly"`, `"Starter"`, `"Professional"` — banned in all JSX/CSS (215 inheritance carries forward; 217 plan catalog must render `plan.name` from `saas_plans` row, not a hard-coded constant).
- Soft sentence openers banned by CLAUDE.md: `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in any product surface copy.

---

## Color

Composition target per DESIGN.md "Composition proportion" (must hold for all 10 SaaS surfaces, measured by visual mass not file LOC):

| Range | Token group | SaaS surface usage |
|-------|-------------|---------------------|
| 70–80% | `surface` + `surface-raised` | Page background (`--color-surface`); all `.c-card` KPI cards, metric cards, table rows, sidebar (`--color-surface-raised`) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All headings, body copy, table content, eyebrows, metadata, timestamps |
| 3–5% | `primary` + `primary-text` | Single primary CTA per surface (where applicable), focus rings, `.c-chip-protocol` IDs, `[ok]` glyph, kernel-pulse status dot on KPI freshness |
| 0–2% | `error` + `warning` + `info` + `success` | `.c-notice` banners, `.c-badge` row state, `[err]`/`[warn]`/`[info]`/`[ok]`/`[block]` glyphs, destructive button text |

| Role | Token | DESIGN.md citation | SaaS dashboard usage |
|------|-------|--------------------|---------------------|
| Page background | `--color-surface` (`#0A0E14` Kernel Black) | `colors.surface` | All 10 page wrappers (`app/saas/{*,*/*}/page.tsx`); never `#000000` |
| Cards / panels | `--color-surface-raised` (`#1A1F2A` Process Gray) | `colors.surface-raised` | All `.c-card` instances: KPI cards, metric cards, agent rows, subscription rows, plan rows, invoice rows, ticket rows, waterfall entry blocks, sidebar |
| Modal / popover surface | `--color-surface-overlay` (`#242B38`) | `colors.surface-overlay` | `.c-modal` (period-range picker; export reason capture; recalc confirmation) |
| Hairline borders | `--color-border` (`#2D3441` Border Mist) | `colors.border` | All `.c-card` borders (1px), table `th`/`td` border-bottom, sidebar separator, KPI grid separator |
| Strong borders | `--color-border-strong` (`#3A4250`) | `colors.border-strong` | Composed via `.c-input` on hover/focus (period-range picker) |
| Primary text | `--color-on-surface` (`#E6EDF3` Terminal White) | `colors.on-surface` | All headings, body copy, table content, KPI values |
| Muted secondary text | `--color-on-surface-muted` (`#7B8DA6` Vault Slate) | `colors.on-surface-muted` | `.t-lead` descriptors, table `th` text, eyebrows (when not state-coded), metadata, timestamps, `last_calculated_at` body |
| Subtle / disabled text | `--color-on-surface-subtle` (`#6B7785` Comment Gray) | `colors.on-surface-subtle` | `.c-input::placeholder`, dimmed canceled subscriptions, dimmed archived plans, dimmed `[—] insufficient_data` trend chip |
| Signal — single mint | `--color-primary` (`#00D9A3` Protocol Mint) | `colors.primary` | Primary CTA fills (one per surface state), focus rings, `.c-status-dot--live` kernel-pulse fill on KPI freshness when `last_snapshot_calculated_at` is within 24h |
| Mint as text (D-09 carry) | `--color-primary-text` | `tokens.css` line 186 | `.c-button--tertiary` text, `.c-chip-protocol` text, `[ok]` glyph color, KPI inline-link CTAs ("View MRR waterfall →", "View at-risk accounts →", "View pending approvals →", "View agent readiness →"). **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| Mint subtle wash | `--color-primary-subtle` | `colors.primary-subtle` | `.c-button--tertiary:hover` background, `.c-chip--mint` background |
| Error | `--color-error` (`#F85149`) | `colors.error` | `.c-notice--error` (MRR snapshot reconciliation failed, agent activation rejected, banned-lexicon block), `.c-button--destructive` (none in 217 — read-mostly surface), `.c-badge--error` (`critical` health state, `failed` invoice state, `rejected` agent activation, P1 critical urgency on tickets), `[err]` glyph, `.c-status-dot--error` |
| Warning | `--color-warning` (`#FFB800`) | `colors.warning` | `.c-notice--warning` (MRR snapshot stale, sentinel pricing active, T0 readiness gate closed, KB grounding below threshold, save offer pricing pending), `.c-badge--warning` (`at_risk` health state, `past_due` invoice state, `paused` agent state, `declining` trend, P2 high urgency), `[warn]` glyph |
| Success | `--color-success` (`#3FB950`) | `colors.success` | `.c-notice--success` (MRR snapshot reconciled, no at-risk accounts, no pending tickets, all agents readiness confirmed), `.c-badge--success` (`healthy` health state, `paid` invoice state, `runnable` agent state, `improving` trend), `[ok]` glyph |
| Info | `--color-info` (`#58A6FF`) | `colors.info` | `.c-notice--info` (non-SaaS tenant gating notice, all 12 SG translation-gate placeholders, T0 readiness gate informational, `runnable=false` agent state default), `.c-badge--info` (`watch` health state, `draft` invoice state, `planned` agent state, `stable` trend), `[info]` glyph |

**Accent reserved-for list (the 3–5% mint slice):**
1. **Single primary CTA per surface state** (`.c-button--primary`):
   - Surface A (Overview): "Recalculate KPIs" — invokes `api/cron/saas-mrr-snapshot.js` synchronous endpoint OR queues an AgentRun event (217-02)
   - Surface D (Revenue): "Recalculate metrics" — invokes the same cron synchronous endpoint
   - Surface E (Waterfall): "Recalculate waterfall" — same invocation
   - Surface F (Churn): "Recalculate health scores" — invokes 216 health-score refresh endpoint (per 216 UI Binding Contract 1)
   - Surfaces B, C, G, H, I, J: NO primary CTA (read-mostly browse — per-row CTAs are `.c-button--tertiary` mint-text inline)
2. Focus rings — globally inherited; never suppressed in module.css.
3. Protocol chip text — `.c-chip-protocol` for all UUID columns enumerated in §Typography.
4. Status dot live — `.c-status-dot--live` on KPI freshness when `last_snapshot_calculated_at >= now() - interval '24 hours'` (kernel-pulse animation; freezes at full opacity under `prefers-reduced-motion`).
5. `[ok]` glyph in all healthy / paid / runnable / improving / approved confirmation notices.
6. `::selection` — global.

**NOT used as fill anywhere:** card borders, table headers, page background, body copy, sidebar background, KPI grid separators, MRR waterfall canvas background. Mint is the SaaS dashboard's single signal — every other affordance is token-only neutral or state-class.

---

## Inheritance Bindings (load-bearing)

This section is the **doctrine binding** for every surface in this phase. Every approval, lifecycle, mutation, pricing, classification, grounding, and PII field rendered MUST cite the upstream contract verbatim. Auto-FAIL conditions: any field name re-derived without citation; any state literal not enumerated below; any approval gate that omits the 206 mutation-class binding; any pricing render that hard-codes a dollar literal or tier-name string; any PII display that violates 216 §UI Binding Contract 4; any health/risk render that violates 216 §UI Binding Contract 1.

### From 206-UI-SPEC §Mutation-class doctrine

| 217 surface element | 206 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| Revenue metric export | `mutation-class-policy.md` (206-02-01) — `data.export` | `mutation_class == 'data.export'`, `default_approval_mode == single_approval` | `.c-button--secondary` "Export revenue metrics" on Surface D opens `.c-modal` reason field; routes to existing 215 export pattern via `agent_approval_packages` row |
| MRR waterfall export | `mutation-class-policy.md` — `data.export` | same | `.c-button--secondary` "Export MRR waterfall" on Surface E |
| Support ticket export | `mutation-class-policy.md` — `data.export` | same | `.c-button--secondary` "Export tickets" on Surface H |
| Agent registry export | `mutation-class-policy.md` — `data.export` | same | `.c-button--secondary` "Export agent registry" on Surface I |
| Invoice viewer export | `mutation-class-policy.md` — `data.export` | same | `.c-button--secondary` "Export invoices" on Surface G |
| Subscription action menu | `mutation-class-policy.md` — `billing.charge` for subscription mutations; `data.export` for audit-log export | 214 contract — handed off to `<SaaSSubscriptionsTable>` extracted; this phase MOUNTS the component, doesn't re-implement | `<SaaSSubscriptionsTable>` mounted on Surface B; per-row chip set + action menu inherited from 214 §Surface C verbatim |
| Health-score recalc CTA | 216 §UI Binding Contract 1 verbatim | "Recalculate health score" copy + DB-trigger `HEALTH_SCORE_REQUIRES_RAW_FACTS` | `.c-button--secondary` on Surface F per-row "Recalculate" |
| Save-offer activation (read-only display) | 216 §UI Binding Contract 3 verbatim | `pricing_recommendation_id` xor sentinel; mutation class `billing.charge` | Surface F renders save-offer rows with pricing block; activation modal is DEFERRED to future P220 churn console — Surface F shows the pricing context block in display mode only |

### From 207-UI-SPEC §Orchestration substrate

| 217 surface element | 207 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| KPI freshness `last_snapshot_calculated_at` chip | `RunApiEnvelope` (207-01-CONTRACT-LOCK §4) | `run_id`, `kind == 'saas-mrr-snapshot'`, `state`, `started_at`, `completed_at`, `error_class` | Surface A KPI cards display `<.c-chip-protocol>` "Run: `{run_id}`" deep-linking to `/operations/tasks?run_id={run_id}` |
| MRR waterfall snapshot run timeline | `RunApiEnvelope` + `AgentRunEventType` | `run_id`, `event_type ∈ {snapshot_started, snapshot_calculated, waterfall_built, snapshot_persisted, snapshot_completed}` | Surface E renders run timeline as `<EventTimeline>` recipe (existing 207 component) |
| Agent readiness run history | `RunApiEnvelope` | `run_id` (when activation_approval_id is set) | Surface I per-agent row links to `<.c-chip-protocol>` "Activation run: `{run_id}`" deep-link |
| Revenue metric recalc run | `RunApiEnvelope` | `kind == 'saas-revenue-metric-recalc'` | Surface D "Recalculate metrics" invocation emits AgentRun event |
| Cost-divergence chip on agent registry | `RunCostContext` (207-01-CONTRACT-LOCK §8) | `estimated_cost_usd_micro`, `actual_cost_usd_micro` | Surface I per-agent row displays cost posture chip; activation cost rendered via `<Money fromPricingRecommendation>` xor sentinel |

### From 208-UI-SPEC §PARENT — Cockpit shell + Approval Inbox + Recovery Center

| 217 surface element | 208 contract source | Doctrine bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| SaaS sidebar nav | 208-01 sidebar nav (existing chrome layout) | nav literals: SaaS sidebar is INDEPENDENT from `app/(markos)/` operator-cockpit chrome; renders only inside `app/saas/layout.tsx` server-component scope | `<NavSidebar>` extracted component reads `getNavForTenant({tenantId})` and renders `is_active=true` rows as `.c-nav-link`; `is_active=false AND planned_only=true` rows render as `.c-nav-link[disabled]` with `<.c-chip>` "[info] Awaiting Phase {N}" eyebrow |
| Cross-link to Approval Inbox | 208-04 §Item rendering | "Open in Approval Inbox →" `.c-button--tertiary` mint-text link patterns; deep-links use `?handoff_kind={literal}&task_ref={id}` | Surface F at-risk row links to `/operations/approvals?handoff_kind=save_offer_approval` (8th literal from 216); Surface H ticket row links to `/operations/approvals?handoff_kind=support_response_approval&task_ref={ticket_id}` (7th literal from 216) |
| Cross-link to Task Board | 208-03 §Task Board | task_kind literals from 216-04 task-creator (`saas_churn_intervention`); from 217 (`sas_agent_activation_review`) | Surface F at-risk row deep-links to `/operations/tasks?task_kind=saas_churn_intervention&subscription_id={id}` |
| Cross-link to Recovery Center | 208-05 §Recovery Center | failure family literals; cron AgentRun event surfaces | Surface A KPI card "Snapshot stale" notice deep-links to `/operations/recovery?kind=saas-mrr-snapshot` |
| Mobile-priority `secondary` literal | 208-01 mobile_priority literals | `secondary` for 7 surfaces; `desktop_first` for 2 surfaces (Revenue + Waterfall — chart density) | `lib/markos/operator/shell.ts` SurfaceRouteContract for each `/saas/*` route declares its mobile_priority. `desktop_only` is FORBIDDEN. |
| `<PlaceholderBanner>` recipe | 208 existing recipe | `variant: future_phase_{N}` + `.c-notice c-notice--info` body | Used 15 times across the 12 SG-* nav rows + 3 deferred placeholders (PII audit, churn console, T0 proof) |

### From 209-UI-SPEC §Evidence inheritance

| 217 surface element | 209 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| KB-grounded suggested-response evidence rail (Surface H) | 209-04 `<EvidenceSummary>` recipe | `evidence_pack_id`, `claim_id`, `source_quality_score`, `freshness_at`, `confidence` | Surface H per-ticket row reuses `<KbGroundingPanel>` (216 D-15 extraction) which itself wraps the 209 `<EvidenceSummary>` recipe verbatim |
| Revenue metric source-precedence evidence (Surface D) | 209 evidence inheritance — source-precedence model is metadata not full evidence map | `metric_definition_id`, `source_precedence_tier`, `source_id`, `recorded_at`, `reconciliation_state` | Surface D per-metric card displays a `<.c-chip>` "Source: tier-{N}" with hover tooltip showing the 5-tier precedence chain (billing > processor > accounting > CRM > manual) |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| 217 surface element | 213 contract source | Doctrine bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| 217 SaaS dashboards are PRIVATE doctrine | 213-04 §Public-Proof Boundary | `subscription_id`, `health_score_id`, `intervention_id`, `ticket_id`, `invoice_id`, `mrr_snapshot_id` UUIDs may be cited in case-study claims; outcome content (raw MRR amounts, customer NIT/email, support text) is NEVER published; 217 dashboards are tenant-scoped only | All Surfaces A-J render only inside the `app/saas/layout.tsx` activation-gated scope; no public-facing sibling exists |
| T0 readiness gate consumer | 213-05 §214-217 go/no-go decision | When `tenant_0_readiness_gate.status == 'closed'`, every 217 surface renders `.c-notice c-notice--warning` "[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboards are paused until v4.0.0 readiness sign-off completes." above content | Each `app/saas/*/page.tsx` server component reads the gate status before content render |
| 213-04 banned-phrases contract | 213-04 §Public-Proof banned phrases | `unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade` are banned in any case-study referencing 217 outcomes | CI assertion enforces zero-match (217 surfaces have no public-marketing copy; banned check is doctrine carry-forward only) |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| 217 surface element | 214 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| `isSaaSSurfaceEnabled` activation gate | 214 §Surface gating contract — `business_type != 'saas'` tenants render single `.c-notice c-notice--info` page and never reach activation panel | `business_type`, `saas_suite_activations.status == 'active'` | Surface 0 (`app/saas/layout.tsx`) is the canonical implementation. Per 217-06-PLAN must_haves: server-component reads `saas_suite_activations` for current tenant; on inactive → redirect to `/settings/plugins?msg=saas_not_activated`; on active → render children with sidebar built from `getNavForTenant` |
| `<SaaSActivationPanel>` (D-15 extracted) | 214 §Surface B Component Contract | full prop signature inherited verbatim | Mounted on Surface A (`/saas/page.tsx`) as activation re-confirmation panel — variant=`activated` only (pre-activation state never reached because layout activation gate redirects first) |
| `<SaaSSubscriptionsTable>` (D-15 extracted) | 214 §Surface C Component Contract | full prop signature inherited verbatim | Mounted on Surface B (`/saas/subscriptions/page.tsx`) as the subscription list with per-row action menu; reads `/v1/saas/subscriptions` (Plan 04 endpoint) |
| `business_type != 'saas'` gating | 214 §Surface gating contract | non-SaaS tenants see no `app/saas/*` access (the layout gate redirects); `app/(markos)/layout-shell.tsx` ALSO hides any SaaS nav-row at the cockpit chrome level via `isSaaSSurfaceEnabled` server-side check | Defense-in-depth: chrome nav hides + layout redirects + `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger blocks any `is_active=true` mutation without active activation row |
| Mobile priority inheritance | 214 §`mobile_priority: secondary` for `settings.saas` | Settings → SaaS Suite path inherits `secondary`; this phase's 9 dashboard pages declare their own per-surface mobile-priority (see frontmatter `mobile_priority_decisions`) | The 9 SaaS dashboard pages live at `/saas/*` (NOT settings); they declare independent mobile priority — 7 secondary + 2 desktop_first |

### From 215-UI-SPEC §PARENT — SaaS Billing

| 217 surface element | 215 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| Money rendering on every surface | 215-UI-SPEC §Sentinel Discipline | `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; `pricing_recommendation_id IS NULL → sentinel; pricing_recommendation_id IS NOT NULL → <Money>` | Used on Surface C (plans), Surface D (revenue metrics), Surface E (waterfall), Surface G (invoices), Surface F (save-offer pricing block per 216 UI Binding Contract 3) |
| Sensitive credential B-1..B-8 | 215-UI-SPEC §Sensitive Credential Handling — UI Binding Contract | NEVER show raw vault credentials in dashboards; the 6-layer defense-in-depth posture (storage → DB-trigger → MCP sanitization → log redaction → prompt-injection defense → UI surface enforcement) extends to ALL 217 displayable fields | Surface I (agents) renders `agent_token` chip as `.c-chip-protocol` (public ID) — never displays processor credentials, certificate refs, webhook secrets, vault refs. Surface G (invoices) renders DIAN CUFE chip as `.c-chip-protocol` (public ID) — never displays raw certificate. The MCP tool family `markos-saas` (Plan 05) is read-only by design. |
| Invoice compliance status badge | 215-UI-SPEC §Invoice viewer doctrine | `saas_invoices.status ∈ ('paid','past_due','draft','void','failed')` + `compliance_status ∈ ('compliant','dian_pending','dian_rejected','quickbooks_pending','siigo_pending')` | Surface G per-invoice row renders `.c-badge--{state}` for status and `.c-chip` for compliance_status; DIAN CUFE/QR rendered as `.c-chip-protocol` chip |
| Webhook DLQ reference | 215-UI-SPEC §Recovery Center extension | `markos_webhook_deliveries.dlq_at IS NOT NULL` rows | Surface G "View webhook DLQ →" mint-text link to `/operations/recovery?kind=webhook_delivery` (208 Recovery Center) |

### From 216-UI-SPEC §PARENT — Health/Churn/Support — 4 UI Binding Contracts

| 217 surface element | 216 contract source | Field set bound verbatim | Usage |
|---------------------|---------------------|--------------------------|-------|
| Health-score 5-dimension breakdown | 216 UI Binding Contract 1 verbatim | `HEALTH_DIMENSIONS = ['usage','support','billing','engagement','relationship']`; weights {0.30, 0.20, 0.20, 0.15, 0.15}; 4 risk bands `healthy 80-100 / watch 60-79 / at_risk 40-59 / critical 0-39` | Surface F per-row health detail panel renders 5-dimension `.c-badge` row + `<RiskBandBadge>` + recalc CTA copy `Recalculate health score` (verbatim from 216) |
| Health-score recalc CTA copy | 216 UI Binding Contract 1 verbatim | "Recalculate health score" + "[err] Health score raw facts incomplete — connector data required" | Surface F per-row "Recalculate health score" `.c-button--secondary`; on raw_facts incomplete → `.c-notice c-notice--error` with verbatim copy |
| Trend chip rendering | 216 UI Binding Contract 1 verbatim | `trend ∈ ('improving','stable','declining','insufficient_data')` + bracketed glyphs `[up]/[flat]/[down]/[—]` + chip variant rules | Surface F per-row trend chip; sparkline DEFERRED (consistent with 216 deferral) |
| Support ticket classifier display | 216 UI Binding Contract 2 verbatim | 5 classifier dimensions: `sentiment / intent / churn_signal / topic_tags / urgency_score`; chip variants per dimension | Surface H per-row `<ClassifierChipRow>` (216 D-15 extraction) |
| Support response CTA copy | 216 UI Binding Contract 2 verbatim | "Approve and send" + "Reject and capture reason" + "Edit suggested response →" + "[warn] KB grounding confidence below threshold — review and edit" | Surface H per-row "Open in Approval Inbox →" mint-text link routes to `/operations/approvals?handoff_kind=support_response_approval&task_ref={ticket_id}`; the actual approval modal lives in /operations/approvals (P208), not in 217 |
| Save-offer pricing block | 216 UI Binding Contract 3 verbatim | XOR pattern: Path A `<Money fromPricingRecommendation={pr_id}>` + `<.c-chip-protocol>` "Recommendation: `{pr_id}`"; Path B `<PricingSentinelBadge>` + `.c-notice c-notice--warning` "[warn] Pricing Engine recommendation pending — sentinel active" | Surface F per-row save-offer display renders the pricing block in display mode; activation modal DEFERRED to /operations/approvals (8th handoff_kind literal) |
| PII redaction | 216 UI Binding Contract 4 verbatim | 5-value `pii_classification` ENUM: `no_pii / pseudonymous / personal / sensitive / highly_sensitive`; `<PIIRedactedField>` extracted component | Surface H ticket subject/description rendered via `<PIIRedactedField>`; Surface F intervention `outcome_jsonb` PII-redacted; Surface I agent `readiness_notes` PII-redacted |
| Retention class chip | 216 UI Binding Contract 4 verbatim | `<RetentionClassChip>` reads `data_retention_classes.{display_name, retention_days, deletion_method, pii_classification}` | Surface H per-ticket row + Surface F per-intervention row + Surface G per-invoice row |
| Audit-log every PII view | 216 UI Binding Contract 4 verbatim | server-side audit emit on every PII display; `event_type: 'pii_view'` row in `markos_audit_log_hash_chain` | API handlers in `api/v1/saas/{support,churn,invoices}.js` (Plan 04) MUST add this audit emit before returning PII rows; Surface H/F/G consume the API responses transparently |
| Banned-lexicon zero-match | 216 UI Binding Contract 2 verbatim | 19 banned tokens + zero exclamation points enforced at zero-match | Surface H suggested-response display BEFORE any future safe-auto-response dispatch (217 only displays; dispatch lives in /operations/approvals) |

### From 213.4-VALIDATION.md (carry-forward decisions)

| Decision | Phase 217 enforcement |
|----------|----------------------|
| **D-08** (token-only) | Zero inline hex literals in any of `app/saas/**/page.tsx`, `app/saas/**/page.module.css`, `components/markos/saas/**/*.tsx`, `components/markos/saas/**/*.module.css`. Every color via `var(--color-*)`. Every spacing via `var(--space-*)` (with the documented MRR waterfall canvas exception). Every typography via DESIGN.md `typography.*` token. Auto-FAIL on any `#[0-9a-fA-F]` literal. CI grep `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/saas/**/*.module.css` returns 0. |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs ("View MRR waterfall →", "View at-risk accounts →", "View pending approvals →", "Open in Approval Inbox →", "Open subscription →", "Open ticket →", "Open invoice →", "Open agent detail →", "Recalculate KPIs"), and `.c-chip-protocol` IDs use `--color-primary-text`. Mint never used as fill on KPI cards, agent rows, ticket rows, or invoice rows. |
| **D-09b** (`.c-notice` mandatory) | Non-SaaS tenant gating notice (Surface 0 layout — handled by redirect, not banner; banner covers T0 readiness gate closed, MRR snapshot stale, sentinel pricing active, KB grounding below threshold, banned lexicon block, no-data empty states, all 12 SG planned-only translation-gate placeholders, deferred placeholders for PII audit + churn console + T0 proof). No local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/` or `components/markos/saas/`. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in this phase.** KPI cards, metric cards, agent rows, subscription rows, plan rows, ticket rows, invoice rows, churn rows, waterfall entry blocks all use `.c-card` default. KPI cards use `.c-card` plus `[info]`/`[warn]`/`[ok]`/`[err]` eyebrow — no hero treatment, no gradient, no feature-card variant. |
| **D-14** (no `.c-table` primitive) | Subscriptions list, plans list, invoices list, support tickets list, agents list, churn at-risk list, MRR waterfall entries list, agent readiness flag matrix ALL use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred. |
| **D-15** (selective extraction) | Six net-new components extracted to `components/markos/saas/` because reuse is proven (≥2 surfaces) per frontmatter `extracted_components_217`: `<KpiCard>`, `<MetricCard>`, `<MRRWaterfallChart>`, `<AgentReadinessTable>`, `<RevenueMetricGrid>`, `<NavSidebar>`. Reused from 214: `<SaaSActivationPanel>`, `<SaaSSubscriptionsTable>`. Reused from 216: `<HealthScoreBadge>`, `<RiskBandBadge>`, `<ClassifierChipRow>`, `<KbGroundingPanel>`, `<PIIRedactedField>`, `<RetentionClassChip>` (extraction-on-first-reuse trigger if 216 hasn't extracted yet — 217 is the proof of reuse). Storybook stories register all 6 net-new components. |

---

## Surface Inventory

This phase ships **10 surfaces** organized as 1 layout + 9 dashboard pages. Each surface has its own per-page contract below following the 208 cockpit pattern.

### Surface 0 — SaaS Layout / Activation Gate (Plan 217-06)

**Files:**
- `app/saas/layout.tsx` — NEW; server component reading tenant context, activation status, and nav rows.
- `app/saas/layout.module.css` — NEW; token-only.
- `app/saas/layout.stories.tsx` — NEW; CSF3 named state stories.
- `components/markos/saas/NavSidebar.tsx` — NEW (D-15 extracted).
- `components/markos/saas/NavSidebar.module.css` — NEW; token-only.
- `components/markos/saas/NavSidebar.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+-----------+----------------------------------------------+
|           | <main>                                       |
| <NavSide  |   {children of route}                        |
|  bar />   |                                              |
| (256px)   |                                              |
|           |                                              |
|           |                                              |
+-----------+----------------------------------------------+
```

**Layout grid (mobile < 640px):** Sidebar collapses to top-of-page hamburger menu (existing 208 pattern). `<NavSidebar>` renders as full-screen overlay when triggered.

**Activation gate semantics (verbatim from 217-06-PLAN must_haves):**
- Server component reads `saas_suite_activations` for current tenant via Supabase server client.
- If `business_type != 'saas'` OR `saas_suite_activations.status != 'active'` → redirect to `/settings/plugins?msg=saas_not_activated`.
- If active → fetch `getNavForTenant({tenantId})` → render `<NavSidebar>` with `is_active=true` rows + 12 disabled `is_active=false AND planned_only=true` placeholder rows.
- T0 readiness gate check: if `tenant_0_readiness_gate.status == 'closed'`, prepend `.c-notice c-notice--warning` to `<main>` content.

**Components used:** `<NavSidebar>` (extracted), `.c-sidebar`, `.c-nav-link`, `.c-chip` (for disabled `[info] Awaiting Phase {N}` eyebrow on planned-only rows).

**Copy register:**
| Element | Copy |
|---------|------|
| Sidebar header | "SaaS Suite" |
| Active nav-row labels | Verbatim from `saas_nav_visibility.label`: "SaaS Overview" / "Subscriptions" / "Plans" / "Revenue Dashboard" / "MRR Waterfall" / "Churn Intelligence" / "Invoices" / "Support Intelligence" / "SAS Agent Registry" |
| Planned-only nav-row labels | Verbatim from seed: "PLG Engine" / "In-App Marketing" / "Growth Experiments" / "Account Expansion" / "ABM Engine" / "Customer Advocacy" / "Revenue Alignment" / "Viral / Referral" / "Community" / "Events" / "Partnerships" / "Developer Marketing" |
| Planned-only nav-row eyebrow | `[info] Awaiting Phase {owns_phase}` (P218 / P219 / P220) |
| T0 readiness gate closed banner | `[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboards are paused until v4.0.0 readiness sign-off completes.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server-component fetch | server-rendered HTML; client never sees a flash |
| `not-saas-tenant-redirect` | `markos_orgs.business_type != 'saas'` | server-side `redirect('/settings/plugins?msg=saas_not_activated')` |
| `not-activated-redirect` | `saas_suite_activations.status != 'active'` | server-side redirect |
| `activated-active` | tenant active | `<main>` renders children with sidebar |
| `t0-gate-closed-warning` | 213-05 gate closed | `<main>` renders banner + children (children still render — banner is informational; activation gate is the hard block, not T0) |

**Data dependencies:**
- `markos_orgs.business_type ∈ ('saas','ecommerce','services','other')`
- `saas_suite_activations.status ∈ ('draft','active','disabled')`
- `saas_nav_visibility.{nav_key, label, route, is_active, planned_only, owns_phase}` (217 Plan 06 schema)
- `tenant_0_readiness_gate.status ∈ ('opened','closed','pending')` (213-05 substrate)

**Accessibility focus order:**
1. `<NavSidebar>` first nav-link (focus-trap on mobile when overlay open)
2. `<main>` `<h1>` (programmatic focus on route change)

**Motion:** None. Sidebar collapse on mobile uses 150ms slide; freezes under `prefers-reduced-motion`.

**Mobile breakpoint behavior:** At `max-width: 640px`: sidebar collapses to top hamburger; tap to open full-screen overlay; tap nav-link to navigate (focus returns to `<main>` `<h1>`).

---

### Surface A — SaaS Overview Dashboard (Plan 217-06)

**Files:**
- `app/saas/page.tsx` — NEW; server component fetching `/v1/saas/metrics` + `/v1/saas/health` + `/v1/saas/subscriptions?limit=5`.
- `app/saas/page.module.css` — NEW; token-only.
- `app/saas/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> SaaS Suite — Overview                                |
| <p class="t-lead"> {N} active subscriptions. {M} pending  |
|     approval. Last KPI snapshot {ago}.                    |
+----------------------------------------------------------+
| KPI grid (4 columns ≥ md, 2 columns sm, 1 column xs):    |
| +-------+-------+-------+-------+                        |
| | <KpiC | <KpiC | <KpiC | <KpiC |                        |
| | ard / | ard / | ard / | ard / |                        |
| | MRR>  | NRR>  | Avg.  | Active|                        |
| |       |       | Health| Subs  |                        |
| +-------+-------+-------+-------+                        |
+----------------------------------------------------------+
| <h2> Recent activity                                      |
| <table> last 5 lifecycle events                          |
+----------------------------------------------------------+
| <SaaSActivationPanel variant="activated" />               |
| (activation re-confirmation panel from 214)              |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. KPI grid collapses to 1 column. Recent activity table becomes vertical card stack.

**Components used:** `<KpiCard>` (extracted), `<SaaSActivationPanel>` (214 extracted), `.c-card`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-button--{secondary,tertiary}`, `.c-chip-protocol`, `.c-status-dot{,--live}`, vanilla `<table>` (D-14).

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "SaaS Suite — Overview" |
| Page descriptor (with data) | "{N} active subscriptions. {M} pending approval. Last KPI snapshot {ago}." |
| Page descriptor (no snapshot yet) | "SaaS dashboards are live. Awaiting first MRR snapshot — runs nightly via cron." |
| KPI: MRR | eyebrow `MRR` + `<Money>` value + delta `{Δ vs prev period}` chip + "View MRR waterfall →" link |
| KPI: NRR | eyebrow `NRR` + `{X.X%}` value + 4 risk-band glyph |
| KPI: Avg. health | eyebrow `Average health` + `{score}/100` + `<RiskBandBadge>` |
| KPI: Active subscriptions | eyebrow `Active subscriptions` + `{N}` + delta chip |
| Snapshot stale notice | `[warn] MRR snapshot is stale. Last calculated {ago}. Recalculate via cron or manual trigger.` |
| Snapshot fresh notice | `[ok] MRR snapshot is fresh. Last calculated {ago}.` (with `.c-status-dot--live`) |
| Recalculate CTA | "Recalculate KPIs" |
| Recent activity empty | `[info] No recent lifecycle events. The subscription book is quiet.` |
| Activation panel placeholder (re-confirm) | inherits 214 verbatim |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton KPI grid; section headings visible |
| `no-snapshot-yet` | `saas_mrr_snapshots` empty for tenant | KPI cards show `[info] Awaiting first snapshot` placeholder |
| `snapshot-stale` | last `calculated_at < now() - interval '24 hours'` | `.c-notice c-notice--warning` above KPI grid |
| `snapshot-fresh` | last `calculated_at >= now() - interval '24 hours'` | `.c-status-dot--live` on each KPI card |
| `no-subscriptions` | `saas_subscriptions` empty | "Active subscriptions" KPI = 0; recent activity empty notice |
| `t0-gate-closed` | 213-05 gate closed | inherited from layout banner |

**Data dependencies:**
- `/v1/saas/metrics/mrr` (Plan 04 — F-253) → `{ mrr, prev_mrr, calculated_at, snapshot_id }`
- `/v1/saas/metrics/nrr` (Plan 04 — F-253) → `{ nrr_pct, period_start, period_end }`
- `/v1/saas/health` (Plan 04 — F-252) → `{ avg_health_score, risk_band_distribution }`
- `/v1/saas/subscriptions?limit=5&order=last_event_at desc` (Plan 04 — F-251) → recent activity rows
- 207 `RunApiEnvelope.run_id` for KPI snapshot freshness chip

**Accessibility focus order:**
1. `<h1>` SaaS Suite — Overview (programmatic focus on route change)
2. KPI MRR card "View MRR waterfall →" link
3. KPI NRR card (read-only)
4. KPI Avg. health card "View at-risk accounts →" link
5. KPI Active subscriptions card "View subscriptions →" link
6. "Recalculate KPIs" CTA (when snapshot stale)
7. Recent activity table rows (keyboard-skip)
8. `<SaaSActivationPanel>` re-confirmation CTA (read-only display variant)

**Motion:** `.c-status-dot--live` kernel-pulse on each KPI card eyebrow when snapshot is fresh (freezes under `prefers-reduced-motion`). Recalculate CTA: 150ms button-press fade.

**Mobile breakpoint behavior:** At `max-width: 640px`: KPI grid collapses to single column; recent activity table becomes vertical card stack.

---

### Surface B — Subscriptions List (Plan 217-06)

**Files:**
- `app/saas/subscriptions/page.tsx` — NEW; server component fetching `/v1/saas/subscriptions`.
- `app/saas/subscriptions/page.module.css` — NEW; token-only.
- `app/saas/subscriptions/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Subscriptions                                        |
| <p class="t-lead"> {N} subscriptions. {M} pending mut.    |
+----------------------------------------------------------+
| Filter chips: [All] [Active] [Trialing] [Past due]        |
|              [Paused] [Canceled]                         |
+----------------------------------------------------------+
| <SaaSSubscriptionsTable />  (214 extracted)               |
+----------------------------------------------------------+
```

**Components used:** `<SaaSSubscriptionsTable>` (214 extracted) — full prop signature inherited. Per-row action menu (Cancel / Pause / Upgrade / Downgrade / Reactivate) inherits 214 mutation modal binding (`billing.charge` mutation class). The 217 surface MOUNTS the component; it does NOT re-implement.

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Subscriptions" |
| Page descriptor | "{N} subscriptions. {M} pending mutation. {K} past due." |
| Empty state | `[info] No subscriptions yet. Subscriptions appear here after the first SaaS customer signs up.` |
| Filter chip labels | All / Active / Trialing / Past due / Paused / Canceled |
| Per-row content | inherits 214 §Surface C verbatim |

**State matrix:** Inherits 214 §Surface C state matrix verbatim. Additional 217 state: `filter-applied` — when a filter chip is selected, table renders only matching rows.

**Data dependencies:**
- `/v1/saas/subscriptions` (Plan 04 — F-251) — full subscription list with health-score + invoice status joined
- 214 contracts for `<SaaSSubscriptionsTable>` props

**Accessibility focus order:**
1. `<h1>` Subscriptions
2. Filter chip group (left-to-right)
3. `<SaaSSubscriptionsTable>` first row action menu trigger

**Motion:** Inherits 214 `<SaaSSubscriptionsTable>` motion. `.c-status-dot--live` on `current_state == 'active'` rows.

**Mobile breakpoint behavior:** Inherits 214. Table becomes vertical card stack.

---

### Surface C — Plans Catalog (Plan 217-06)

**Files:**
- `app/saas/plans/page.tsx` — NEW; server component fetching `/v1/saas/plans`.
- `app/saas/plans/page.module.css` — NEW; token-only.
- `app/saas/plans/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Plans                                                |
| <p class="t-lead"> {N} plans. {K} archived.               |
+----------------------------------------------------------+
| <table>                                                   |
|   <th> Plan | Version | Price | Discount | Status         |
|   <td> .c-card-style row + .c-badge--{state}              |
| Empty: .c-notice c-notice--info                           |
+----------------------------------------------------------+
```

**Components used:** `.c-card`, vanilla `<table>` (D-14), `.c-badge--{state}`, `.c-chip-protocol`, `<Money fromPricingRecommendation>` xor `<PricingSentinelBadge>` (215 inheritance), `.c-button--tertiary` (per-row "View pricing →" link).

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Plans" |
| Page descriptor | "{N} plans. {K} archived." |
| Empty state | `[info] No plans configured yet. Plan catalog editing arrives in a future SaaS Suite admin extension.` |
| Plan-row eyebrow | `Plan` |
| Plan-row "View pricing" CTA | "View pricing →" routes to `/admin/billing/pricing` (P205 surface) |
| Plan-row pricing — engine-backed | `<Money fromPricingRecommendation={pr_id}>` |
| Plan-row pricing — pending | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PricingSentinelBadge>` |
| Plan-row state badges | `published` → `[ok] Published` (`.c-badge--success`); `draft` → `[info] Draft` (`.c-badge--info`); `archived` → `[info] Archived` (`.c-badge--info`, dimmed) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton table |
| `empty` | `saas_plans` empty | `.c-notice c-notice--info` empty state |
| `populated` | `saas_plans` rows exist | Plan rows with state badges + pricing recipe |
| `pricing-pending` | `pricing_recommendation_id IS NULL` for any row | sentinel rendered verbatim |
| `pricing-resolved` | all rows have `pricing_recommendation_id` | `<Money>` rendered for all |

**Data dependencies:**
- `/v1/saas/plans` (Plan 04 — F-251) — `{ plan_id, plan_version_id, name, description, pricing_recommendation_id, status, value_metric, discount_envelope, created_at }`
- 205 PricingRecommendation context for `<Money>` resolution

**Accessibility focus order:**
1. `<h1>` Plans
2. Plan-row "View pricing" link (each row in DOM order)

**Motion:** None.

**Mobile breakpoint behavior:** Table becomes vertical card stack.

---

### Surface D — Revenue Dashboard (Plan 217-06)

**Files:**
- `app/saas/revenue/page.tsx` — NEW; server component fetching `/v1/saas/metrics/{mrr,nrr,grr,expansion,cohorts,forecast}`.
- `app/saas/revenue/page.module.css` — NEW; token-only.
- `app/saas/revenue/page.stories.tsx` — NEW; CSF3.
- `components/markos/saas/MetricCard.tsx` — NEW (D-15 extracted).
- `components/markos/saas/MetricCard.module.css` — NEW; token-only.
- `components/markos/saas/MetricCard.stories.tsx` — NEW; CSF3 (15 metric variant stories).
- `components/markos/saas/RevenueMetricGrid.tsx` — NEW (D-15 extracted; layout-extracted).
- `components/markos/saas/RevenueMetricGrid.module.css` — NEW; token-only.
- `components/markos/saas/RevenueMetricGrid.stories.tsx` — NEW; CSF3.

**Mobile priority:** `desktop_first` (metric density). Mobile collapses to single-column.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Revenue dashboard                                    |
| <p class="t-lead"> 15 metrics. Last calculated {ago}.     |
| Period selector: [{period_start} — {period_end}]          |
+----------------------------------------------------------+
| <RevenueMetricGrid />                                     |
|   3-column grid ≥ lg, 2-column md, 1-column sm:          |
|   +-------+-------+-------+                              |
|   | <Met  | <Met  | <Met  |                              |
|   | ricCa | ricCa | ricCa |                              |
|   | rd    | rd    | rd    |                              |
|   | MRR>  | ARR>  | NRR>  |                              |
|   +-------+-------+-------+                              |
|   ... (15 cards total)                                    |
+----------------------------------------------------------+
| <h2> Source precedence                                    |
| <table> 5-tier source precedence chain                    |
|   <th> Tier | Source | Status                            |
+----------------------------------------------------------+
```

**Components used:** `<RevenueMetricGrid>` (extracted), `<MetricCard>` × 15 (extracted), `.c-card`, `.c-notice c-notice--{info,warning}`, `.c-badge--{info,warning,success}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-button--{primary,secondary}`, `<Money fromPricingRecommendation>` xor `<PricingSentinelBadge>`, vanilla `<table>` (D-14).

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Revenue dashboard" |
| Page descriptor | "15 metrics. Last calculated {ago}." |
| Recalculate CTA | "Recalculate metrics" |
| Export CTA | "Export revenue metrics" (data.export mutation) |
| 15 metric labels (verbatim from 217-01 Plan 01) | "MRR" / "ARR" / "New MRR" / "Expansion MRR" / "Contraction MRR" / "Churn MRR" / "Reactivation MRR" / "Net New MRR" / "NRR" / "GRR" / "Logo churn" / "Revenue churn" / "Cohort retention (T+12)" / "Average revenue per account" / "MRR forecast (3-month)" |
| Sentinel pricing notice | `[warn] Pricing Engine recommendation pending — sentinel active for {N} metric(s).` |
| No-snapshot notice | `[info] Awaiting first MRR snapshot. Run "Recalculate metrics" or wait for nightly cron.` |
| Source precedence header | "Source precedence" |
| Tier rows | Tier 1 Billing engine / Tier 2 Processor / Tier 3 Accounting / Tier 4 CRM / Tier 5 Manual |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton metric grid |
| `no-snapshot` | `saas_mrr_snapshots` empty for tenant | metric cards show `[info] Awaiting snapshot` placeholder |
| `snapshot-stale` | last `calculated_at < now() - interval '24 hours'` | `.c-notice c-notice--warning` above grid |
| `populated` | snapshot exists | 15 metric cards rendered |
| `sentinel-active` | any metric has `pricing_recommendation_id IS NULL` | `.c-notice c-notice--warning` + sentinel rendered verbatim per metric |
| `source-conflict` | `reconciliation_state == 'conflict'` | per-metric `.c-badge--warning` "[warn] Source conflict — tier-{N} disagreement" |

**Data dependencies:**
- `/v1/saas/metrics/{mrr,nrr,grr,expansion,cohorts,forecast,waterfall}` (Plan 04 — F-253; 7 paths)
- `saas_revenue_metric_definitions` (Plan 01) — `metric_definition_id`, `metric_name`, `formula`, `unit`, `period`, `source_precedence_tier`
- `saas_mrr_snapshots` (Plan 02) — `snapshot_id`, `period_start`, `period_end`, `calculated_at`, `reconciliation_state`
- 205 PricingRecommendation context

**Accessibility focus order:**
1. `<h1>` Revenue dashboard
2. Period selector input
3. Recalculate CTA (when stale)
4. Export CTA
5. `<MetricCard>` row 1 (15 cards in DOM order; each card has its source-precedence chip focusable for tooltip)
6. Source precedence table (keyboard-skip; read-only)

**Motion:** `.c-status-dot--live` on metric-card eyebrow when snapshot fresh (≤24h). Recalculate CTA: 150ms.

**Mobile breakpoint behavior:** Metric grid collapses to single column. Period selector becomes full-width.

---

### Surface E — MRR Waterfall (Plan 217-06)

**Files:**
- `app/saas/revenue/waterfall/page.tsx` — NEW; server component fetching `/v1/saas/metrics/waterfall`.
- `app/saas/revenue/waterfall/page.module.css` — NEW; token-only.
- `app/saas/revenue/waterfall/page.stories.tsx` — NEW; CSF3.
- `components/markos/saas/MRRWaterfallChart.tsx` — NEW (D-15 extracted).
- `components/markos/saas/MRRWaterfallChart.module.css` — NEW; token-only (with documented canvas-anchor exception).
- `components/markos/saas/MRRWaterfallChart.stories.tsx` — NEW; CSF3.

**Mobile priority:** `desktop_first` (chart density). Mobile collapses to horizontal-scroll waterfall + vertical entry table.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> MRR waterfall                                        |
| <p class="t-lead"> {period_start} → {period_end}.         |
|                    Net change: {Δ}.                      |
| Period selector + Export CTA                              |
+----------------------------------------------------------+
| <MRRWaterfallChart />  (single chart, ≥ 400px height)    |
|   Bars: Starting MRR → +New → +Expansion → -Contraction  |
|         → -Churn → +Reactivation → Ending MRR            |
|   Tokens-only colors (mint=positive, warning=neg, info=  |
|    starting/ending). Bracketed glyphs in legend.         |
|   <table> SR-only fallback (a11y mandatory)              |
+----------------------------------------------------------+
| <h2> Waterfall entries                                    |
| <table>                                                   |
|   <th> Step | Subscription | Δ MRR | Reason | Run         |
+----------------------------------------------------------+
```

**Components used:** `<MRRWaterfallChart>` (extracted), `.c-card`, `.c-notice c-notice--{info,warning}`, `.c-badge--{info,warning,success}`, `.c-chip-protocol`, `.c-button--{primary,secondary}`, vanilla `<table>` (D-14).

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "MRR waterfall" |
| Page descriptor | "{period_start} → {period_end}. Net change: {Δ}." |
| Recalculate CTA | "Recalculate waterfall" |
| Export CTA | "Export MRR waterfall" |
| Chart legend bars | "Starting MRR" / "+New" / "+Expansion" / "-Contraction" / "-Churn" / "+Reactivation" / "Ending MRR" |
| Empty state | `[info] No waterfall entries for this period. Waterfall populates after the first MRR snapshot.` |
| SR-only fallback caption | "Table fallback for screen readers: each row of the chart's data, with step name, subscription identifier, MRR delta, reason." |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton chart canvas |
| `empty` | no waterfall entries for period | `.c-notice c-notice--info` empty state |
| `populated` | entries exist | chart + entries table |
| `period-mismatch` | period selector returns 0 entries | empty state with period-adjustment hint |

**Data dependencies:**
- `/v1/saas/metrics/waterfall` (Plan 04 — F-253) — `{ period_start, period_end, starting_mrr, entries: [...] }`
- `saas_mrr_waterfall_entries` (Plan 02) — `entry_id`, `snapshot_id`, `subscription_id`, `step_kind ∈ ('new','expansion','contraction','churn','reactivation')`, `delta_micro_usd`, `reason`, `agent_run_id`

**Chart accessibility (mandatory per DESIGN.md "Charts" rule):**
- Chart canvas is `aria-hidden="true"`.
- SR-only `<table>` renders the same data with `<caption>` (sr-only) "Table fallback for screen readers".
- Chart colors are tokens-only: `--color-primary` for positive deltas, `--color-warning` for negative, `--color-info` for starting/ending. NO rainbow gradients. NO soft shadows. NO glow.

**Accessibility focus order:**
1. `<h1>` MRR waterfall
2. Period selector
3. Recalculate CTA
4. Export CTA
5. Chart canvas (focusable for keyboard zoom; SR-only fallback table is reachable via Tab)
6. Waterfall entries table (each row's `subscription_id` chip + `agent_run_id` chip)

**Motion:** Chart bars animate in on initial load (200ms ease-out per DESIGN.md "Motion"); freeze under `prefers-reduced-motion`.

**Mobile breakpoint behavior:** Chart becomes horizontal-scroll with `overflow-x: auto`; entries table becomes vertical card stack.

---

### Surface F — Churn Intelligence (Plan 217-06)

**Files:**
- `app/saas/churn/page.tsx` — NEW; server component fetching `/v1/saas/health` + `/v1/saas/churn` (P216 wraps).
- `app/saas/churn/page.module.css` — NEW; token-only.
- `app/saas/churn/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Churn intelligence                                   |
| <p class="t-lead"> {N} at-risk · {M} critical · {K}      |
|     interventions in last 7 days.                        |
+----------------------------------------------------------+
| <h2> At-risk accounts                                     |
| <table>                                                   |
|   <th> Subscription | Health | Risk | Trend | Action      |
|   <td> .c-card-style row + <HealthScoreBadge> +           |
|        <RiskBandBadge> + trend chip + Open ticket link    |
| Empty: .c-notice c-notice--success                       |
+----------------------------------------------------------+
| <h2> Active interventions                                 |
| <table>                                                   |
|   <th> Intervention | Subscription | Type | Pricing      |
|        | Status | Approval                                |
|   <td> Per-row save-offer-pricing-block (216 binding)    |
+----------------------------------------------------------+
```

**Components used:** `<HealthScoreBadge>` (216 D-15), `<RiskBandBadge>` (216 D-15), `<SaveOfferPricingBlock>` (216 D-15), `<PIIRedactedField>` (216 D-15), `<RetentionClassChip>` (216 D-15), `.c-card`, vanilla `<table>` (D-14), `.c-badge--{state}`, `.c-chip-protocol`, `.c-button--{secondary,tertiary}`, `<Money fromPricingRecommendation>` xor `<PricingSentinelBadge>`.

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Churn intelligence" |
| Page descriptor | "{N} at-risk · {M} critical · {K} interventions in last 7 days." |
| At-risk empty | `[ok] No at-risk accounts. Health scores are healthy across the board.` |
| Recalculate CTA | "Recalculate health scores" (per 216 UI Binding Contract 1) |
| Per-row recalc | "Recalculate health score" (verbatim from 216) |
| Per-row "Open intervention →" link | routes to `/operations/tasks?task_kind=saas_churn_intervention&subscription_id={id}` |
| Per-row "Open in Approval Inbox →" link (when save-offer pending) | routes to `/operations/approvals?handoff_kind=save_offer_approval&task_ref={intervention_id}` |
| Pricing pending notice (per 216 Binding Contract 3) | `[warn] Pricing Engine recommendation pending — sentinel active` |
| Health score raw facts incomplete error | `[err] Health score raw facts incomplete — connector data required` (verbatim from 216) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton tables |
| `no-at-risk` | no `risk_level IN ('at_risk','critical')` | `.c-notice c-notice--success` empty state |
| `at-risk-populated` | rows exist | At-risk table renders with health badges |
| `intervention-pending-approval` | any intervention has `approval_id IS NULL` | `.c-badge--warning` "Approval pending" + Open Approval Inbox link |
| `intervention-sentinel-active` | any save_offer has `pricing_recommendation_id IS NULL` | `.c-notice c-notice--warning` per row |

**Data dependencies:**
- `/v1/saas/health` (Plan 04 — F-252) — `{ avg_health_score, at_risk_accounts: [...] }`
- 216 `saas_health_scores` — `subscription_id`, `score`, `risk_level`, `trend`, `dimension_scores`, `recommended_action`, `calculated_at`, `calculation_version`
- 216 `saas_churn_interventions` — `intervention_id`, `subscription_id`, `intervention_type`, `offer_details` (jsonb), `pricing_recommendation_id`, `approval_id`, `status`
- 216 UI Binding Contracts 1, 3, 4 verbatim

**Accessibility focus order:**
1. `<h1>` Churn intelligence
2. "Recalculate health scores" CTA (page-level)
3. At-risk row 1 "Recalculate health score" CTA
4. At-risk row 1 "Open intervention →" link
5. (continue for all rows)
6. Active interventions table

**Motion:** None on health badges. Recalc CTA: 150ms.

**Mobile breakpoint behavior:** Tables become vertical card stacks. Per-row health badges remain inline; pricing block stacks below action menu.

---

### Surface G — Invoices (Plan 217-06)

**Files:**
- `app/saas/invoices/page.tsx` — NEW; server component fetching `/v1/saas/invoices`.
- `app/saas/invoices/page.module.css` — NEW; token-only.
- `app/saas/invoices/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Invoices                                             |
| <p class="t-lead"> {N} invoices · {M} pending · {K}      |
|     past due · {L} DIAN-pending.                         |
+----------------------------------------------------------+
| Filter chips: [All] [Pending] [Past due] [Failed] [Paid]  |
+----------------------------------------------------------+
| <table>                                                   |
|   <th> Invoice ID | Subscription | Amount | Status |     |
|        Compliance | Issued | Open                        |
|   <td> .c-card-style row + .c-chip-protocol invoice_id    |
|        + <Money>/<PricingSentinelBadge> + .c-badge state  |
|        + DIAN CUFE chip + open invoice link              |
| Empty: .c-notice c-notice--info                          |
+----------------------------------------------------------+
| <h2> Webhook DLQ                                          |
| Cross-link to /operations/recovery?kind=webhook_delivery  |
+----------------------------------------------------------+
```

**Components used:** `<RetentionClassChip>` (216 D-15) for sensitive invoice retention; `.c-card`, vanilla `<table>` (D-14), `.c-badge--{state}`, `.c-chip-protocol`, `.c-button--{secondary,tertiary}`, `<Money fromPricingRecommendation>` xor `<PricingSentinelBadge>`.

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Invoices" |
| Page descriptor | "{N} invoices · {M} pending · {K} past due · {L} DIAN-pending." |
| Empty state | `[info] No invoices yet. Invoices appear here after the first billing cycle completes.` |
| Filter chip labels | All / Pending / Past due / Failed / Paid |
| Invoice-row "Open invoice →" CTA | routes to invoice detail (deferred — placeholder banner if route missing) |
| DIAN CUFE chip | `<.c-chip-protocol>` rendering DIAN CUFE UUID |
| Compliance status badges | `compliant` → `[ok] Compliant` (`.c-badge--success`); `dian_pending` → `[info] DIAN pending` (`.c-badge--info`); `dian_rejected` → `[err] DIAN rejected` (`.c-badge--error`); `quickbooks_pending` → `[info] QBO pending`; `siigo_pending` → `[info] Siigo pending` |
| Webhook DLQ link | "View webhook DLQ →" (mint-text) routes to `/operations/recovery?kind=webhook_delivery` |
| Sensitive credential notice (defense-in-depth) | NEVER displayed; if attempted, raw credential render is blocked at API handler layer (Plan 04) per 215 UI Binding Contract |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton table |
| `empty` | `saas_invoices` empty | `.c-notice c-notice--info` empty state |
| `populated` | rows exist | Invoice rows with state badges + CUFE chips + Money recipe |
| `dian-rejected-present` | any row has `compliance_status == 'dian_rejected'` | `.c-notice c-notice--error` "[err] {N} invoice(s) rejected by DIAN — P1 task created" + cross-link to Task Board |
| `webhook-dlq-pending` | `markos_webhook_deliveries.dlq_at IS NOT NULL` rows | `.c-notice c-notice--warning` "[warn] {N} webhook delivery(ies) in DLQ" + Recovery Center link |

**Data dependencies:**
- `/v1/saas/invoices` (Plan 04 — F-252) — `{ invoice_id, subscription_id, amount_micro_usd, currency, status, compliance_status, dian_cufe, issued_at, due_at, paid_at }`
- 215 `saas_invoices` schema
- 215 `markos_webhook_deliveries` for DLQ count

**Accessibility focus order:**
1. `<h1>` Invoices
2. Filter chip group
3. Invoice row 1 "Open invoice →" link
4. (continue for all rows)
5. "View webhook DLQ →" link

**Motion:** None.

**Mobile breakpoint behavior:** Table becomes vertical card stack.

---

### Surface H — Support Intelligence (Plan 217-06)

**Files:**
- `app/saas/support/page.tsx` — NEW; server component fetching `/v1/saas/support` (P216 wraps).
- `app/saas/support/page.module.css` — NEW; token-only.
- `app/saas/support/page.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> Support intelligence                                 |
| <p class="t-lead"> {N} open · {M} pending CS approval ·   |
|     {K} churn-signal tickets.                            |
+----------------------------------------------------------+
| Filter chips: [All] [Open] [Pending CS approval]          |
|              [Churn signal] [Resolved]                   |
+----------------------------------------------------------+
| <table>                                                   |
|   <th> Ticket | Subject | Classifier | KB grounding |    |
|        Urgency | Action                                  |
|   <td> .c-card-style row + <PIIRedactedField> subject    |
|        + <ClassifierChipRow> + <KbGroundingPanel> +       |
|        urgency badge + Open in Approval Inbox link       |
| Empty: .c-notice c-notice--success                       |
+----------------------------------------------------------+
```

**Components used:** `<ClassifierChipRow>` (216 D-15), `<KbGroundingPanel>` (216 D-15), `<PIIRedactedField>` (216 D-15), `<RetentionClassChip>` (216 D-15), `.c-card`, vanilla `<table>` (D-14), `.c-badge--{state}`, `.c-chip-protocol`, `.c-button--{secondary,tertiary}`, `.c-code-inline` (KB snippet preview).

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "Support intelligence" |
| Page descriptor | "{N} open · {M} pending CS approval · {K} churn-signal tickets." |
| Empty state | `[ok] No open tickets. Support queue is clear.` |
| Filter chip labels | All / Open / Pending CS approval / Churn signal / Resolved |
| Per-row "Open in Approval Inbox →" link | routes to `/operations/approvals?handoff_kind=support_response_approval&task_ref={ticket_id}` (216 7th literal) |
| Per-row "Open ticket →" link | routes to ticket detail (deferred — placeholder banner if route missing) |
| KB grounding below threshold | `[warn] KB grounding confidence below threshold — review and edit` (verbatim from 216) |
| Banned-lexicon block | `[err] Suggested response contains banned lexicon — review and edit before dispatch` (verbatim from 216) |
| Subject (PII-redacted) | `<PIIRedactedField field_name="subject" pii_classification="personal" value="..." />` renders `[REDACTED]` per 216 UI Binding Contract 4 |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton table |
| `no-tickets` | `saas_support_tickets` empty | `.c-notice c-notice--success` empty state |
| `populated` | rows exist | Ticket rows with classifier + KB grounding + urgency badges |
| `kb-below-threshold` | any row has `response_grounding_confidence < KB_CONFIDENCE_THRESHOLD` | per-row `.c-notice c-notice--warning` |
| `pending-cs-approval` | any row has classifier output but no approval | `.c-badge--warning` "Pending CS approval" + Open Approval Inbox link |
| `banned-lexicon-block` | suggested response contains banned token | per-row `.c-notice c-notice--error` |

**Data dependencies:**
- `/v1/saas/support` — wraps 216 `saas_support_tickets` + `support_kb_groundings` (P216 owns API; P217 reads via Plan 04 handler)
- 216 UI Binding Contract 2 verbatim

**Accessibility focus order:**
1. `<h1>` Support intelligence
2. Filter chip group
3. Ticket row 1 "Open in Approval Inbox →" link (when pending CS approval)
4. (continue for all rows)

**Motion:** None.

**Mobile breakpoint behavior:** Table becomes vertical card stack. KB grounding panel collapses below classifier chip row.

---

### Surface I — Invoices

(See Surface G above. Repositioned in surface lettering — Surface G is Invoices, Surface H is Support. This entry is the SAS Agent Registry.)

### Surface I — SAS Agent Registry (Plan 217-06)

**Files:**
- `app/saas/agents/page.tsx` — NEW; server component fetching `/v1/saas/agents`.
- `app/saas/agents/page.module.css` — NEW; token-only.
- `app/saas/agents/page.stories.tsx` — NEW; CSF3.
- `components/markos/saas/AgentReadinessTable.tsx` — NEW (D-15 extracted).
- `components/markos/saas/AgentReadinessTable.module.css` — NEW; token-only.
- `components/markos/saas/AgentReadinessTable.stories.tsx` — NEW; CSF3.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <h1> SAS agent registry                                   |
| <p class="t-lead"> 6 SAS agents · 0 runnable ·            |
|     {N} ready (8/8 flags).                               |
+----------------------------------------------------------+
| <AgentReadinessTable />                                   |
|   <table>                                                 |
|     <th> Agent | Token | Role | 8 readiness flags |      |
|          Runnable | Approval                              |
|     <td> .c-card-style row + .c-chip-protocol token +    |
|          flag-grid (8 small badges) + runnable badge      |
+----------------------------------------------------------+
| <h2> Agent details                                        |
| Drilldown panel (focused agent only): role, inputs,       |
| outputs, cost posture, approval posture, failure          |
| behavior, UI/API/MCP surface refs.                        |
+----------------------------------------------------------+
```

**Components used:** `<AgentReadinessTable>` (extracted), `.c-card`, vanilla `<table>` (D-14), `.c-badge--{state}`, `.c-chip-protocol`, `.c-chip`, `.c-button--{secondary,tertiary}`.

**Copy register:**
| Element | Copy |
|---------|------|
| Page heading | "SAS agent registry" |
| Page descriptor | "6 SAS agents · 0 runnable · {N} ready (8/8 flags)." |
| 6 agent token labels (verbatim from Plan 03) | "MARKOS-AGT-SAS-01" / "...-02" / "...-03" / "...-04" / "...-05" / "...-06" |
| 6 agent role labels | "Subscription Lifecycle Manager" / "Revenue Intelligence Analyst" / "Billing Compliance Agent" / "Churn Risk Assessor" / "Support Intelligence Agent" / "Expansion Revenue Scout" |
| 8 readiness flag labels | "Token" / "Role" / "Input contract" / "Output contract" / "Cost posture" / "Approval posture" / "Failure behavior" / "UI/API/MCP surface" |
| Runnable badge | `runnable=true` → `[ok] Runnable` (`.c-badge--success`); `runnable=false` → `[info] Planned (not runnable)` (`.c-badge--info`) |
| Per-row "Open agent detail →" CTA | scroll to drilldown panel |
| Activation pending notice | `[info] Agent activation requires all 8 readiness flags + activation_approval_id. See approval inbox.` |
| Export CTA | "Export agent registry" (data.export mutation) |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial fetch | Skeleton table |
| `all-planned` | all 6 agents `runnable=false` (default in P217) | All rows show `[info] Planned` badge |
| `partial-ready` | some agents have ≥1 readiness flags but `runnable=false` | flag-grid shows mix of green/gray badges |
| `none-runnable` | `0 runnable=true` (P217 invariant) | page descriptor confirms "0 runnable" |
| `activation-attempt-blocked` | DB-trigger `SAS_AGENT_ACTIVATION_REQUIRES_READINESS` raised | `.c-notice c-notice--error` |

**Data dependencies:**
- `/v1/saas/agents` (Plan 04 — F-254) — `{ agent_token, agent_name, agent_domain, has_*: 8 flags, runnable, activation_approval_id, readiness_notes }`
- 217 `sas_agent_readiness` schema (Plan 03)

**Accessibility focus order:**
1. `<h1>` SAS agent registry
2. Export CTA
3. Agent row 1 "Open agent detail →" link
4. (continue for all 6 rows)
5. Drilldown panel content (when expanded)

**Motion:** None on flag badges. Drilldown panel: 150ms slide-down on expand; freeze under `prefers-reduced-motion`.

**Mobile breakpoint behavior:** Table becomes vertical card stack. Flag-grid collapses to inline `<.c-chip>` row (8 chips horizontal-scroll).

---

## Surface Lettering Reconciliation

For clarity (the section above used overlapping letter assignments inadvertently — this is the canonical surface inventory):

| Letter | Surface | Route | Mobile priority |
|--------|---------|-------|-----------------|
| **0** | Layout / Activation Gate | `app/saas/layout.tsx` | inherited |
| **A** | SaaS Overview | `/saas` | secondary |
| **B** | Subscriptions | `/saas/subscriptions` | secondary |
| **C** | Plans | `/saas/plans` | secondary |
| **D** | Revenue Dashboard | `/saas/revenue` | desktop_first |
| **E** | MRR Waterfall | `/saas/revenue/waterfall` | desktop_first |
| **F** | Churn Intelligence | `/saas/churn` | secondary |
| **G** | Invoices | `/saas/invoices` | secondary |
| **H** | Support Intelligence | `/saas/support` | secondary |
| **I** | SAS Agent Registry | `/saas/agents` | secondary |

---

## Cross-Surface Tokens Table (DESIGN.md v1.1.0)

| Token group | Tokens used | Surfaces consuming |
|-------------|-------------|---------------------|
| Spacing | `--space-{none,xxs,xs,sm,md,lg,xl}` | All 10 surfaces |
| Typography (mono) | `--font-mono`, `--fs-{h1,h2,h3,h4,code}` | All 10 surfaces (headings + IDs + monetary) |
| Typography (sans) | `--font-sans`, `--fs-{lead,body-md,body-sm,label-caps}` | All 10 surfaces (body + lead + metadata + eyebrows) |
| Color (surface) | `--color-{surface,surface-raised,surface-overlay,border,border-strong}` | All 10 surfaces |
| Color (text) | `--color-{on-surface,on-surface-muted,on-surface-subtle}` | All 10 surfaces |
| Color (signal) | `--color-{primary,primary-text,primary-subtle}` | All 10 surfaces (CTAs + chips + focus rings + status-dot live) |
| Color (state) | `--color-{error,warning,success,info}` | All 10 surfaces (state badges + notices + glyphs) |
| Focus | `--focus-ring-{width,offset}` | Global; never suppressed |
| Layout | `--w-container` (1280px), `--w-prose` (720px), `--w-modal` (560px) | All 10 surfaces |
| Touch | `--h-control-touch` (44px) | Global; auto-applied via `(pointer: coarse)` |

---

## 213.4 Carry-Forward Decisions (D-08..D-15)

| Carry-forward decision | Phase 217 enforcement |
|-------------------------|------------------------|
| **D-08** (token-only) | Zero hex literals in any 217 module CSS. Auto-FAIL grep `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/saas/**/*.module.css components/markos/saas/**/*.module.css` returns 0. The single off-grid documented exception is `400px` MRR waterfall canvas anchor; bracketed by token spacing on all sides; documented inline. |
| **D-09** (mint-as-text) | All inline-CTAs (~24 distinct mint-text links across the 10 surfaces) use `--color-primary-text` via `.c-button--tertiary`; `.c-chip-protocol` IDs use mint text; mint never used as fill on KPI cards, table rows, sidebar background, or chart canvas. |
| **D-09b** (`.c-notice` mandatory) | Every gating state uses `.c-notice c-notice--{info,warning,success,error}`. Total ~30 distinct notice instances across 10 surfaces. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `app/saas/` or `components/markos/saas/`. |
| **D-13** (`.c-card--feature` reserved) | Forbidden in this phase. All 10 surfaces use `.c-card` default plus glyph eyebrows. |
| **D-14** (no `.c-table` primitive) | All 9 dashboard pages use vanilla `<table>` semantic. Token-only `<th>`/`<td>` recipe. |
| **D-15** (selective extraction) | 6 net-new components extracted (≥2 surface reuse threshold met or forward-looking reuse documented). 8 reused components from upstream phases (214 + 216). All extracted components have Storybook stories registered. Total Storybook stories target: ≥50 named state stories across the 10 pages + 6 components (5 stories average per page + 5 stories average per net-new component). |

---

## Translation Gates Opened (15)

This section enumerates the new `<PlaceholderBanner>` variants that future surfaces MUST render until the relevant downstream phase ships.

| Future surface | Placeholder variant | Owning future phase | 217 substrate dependency |
|----------------|---------------------|---------------------|--------------------------|
| `/saas/plg` PLG Engine dashboard | `future_phase_218_saas_plg` | P218 | `saas_nav_visibility.nav_key='saas_plg'` row reserved (`planned_only=true`) |
| `/saas/inapp` In-App Marketing | `future_phase_218_saas_inapp` | P218 | nav row reserved |
| `/saas/experiments` Growth Experiments | `future_phase_218_saas_experiments` | P218 | nav row reserved |
| `/saas/expansion` Account Expansion | `future_phase_219_saas_expansion` | P219 | nav row reserved |
| `/saas/abm` ABM Engine | `future_phase_219_saas_abm` | P219 | nav row reserved |
| `/saas/advocacy` Customer Advocacy | `future_phase_219_saas_advocacy` | P219 | nav row reserved |
| `/saas/revenue-alignment` Revenue Alignment | `future_phase_219_saas_revenue_alignment` | P219 | nav row reserved |
| `/saas/referral` Viral / Referral | `future_phase_220_saas_referral` | P220 | nav row reserved |
| `/saas/community` Community | `future_phase_220_saas_community` | P220 | nav row reserved |
| `/saas/events` Events | `future_phase_220_saas_events` | P220 | nav row reserved |
| `/saas/partnerships` Partnerships | `future_phase_220_saas_partnerships` | P220 | nav row reserved |
| `/saas/devrel` Developer Marketing | `future_phase_220_saas_devrel` | P220 | nav row reserved |
| PII redaction + retention sweep audit log | `future_phase_soc2_pii_audit_log` | future SOC2 admin extension | 216 §UI Binding Contract 4 |
| Save-offer activation modal + churn intervention timeline | `future_phase_220_churn_console` | P220 | 216 §UI Binding Contract 3 |
| Tenant 0 readiness gate proof | `future_phase_213_5_tenant0_proof` | future P213.5+ | 213-05 substrate |

**Translation gate seed table** (the post-217 cross-phase invariant — verbatim from 217-06-PLAN Task 1):

| nav_key | label | route | owns_phase | planned_only |
|---------|-------|-------|------------|-------------|
| `saas_plg` | PLG Engine | /saas/plg | P218 | true |
| `saas_inapp` | In-App Marketing | /saas/inapp | P218 | true |
| `saas_experiments` | Growth Experiments | /saas/experiments | P218 | true |
| `saas_expansion` | Account Expansion | /saas/expansion | P219 | true |
| `saas_abm` | ABM Engine | /saas/abm | P219 | true |
| `saas_advocacy` | Customer Advocacy | /saas/advocacy | P219 | true |
| `saas_revenue_alignment` | Revenue Alignment | /saas/revenue-alignment | P219 | true |
| `saas_referral` | Viral / Referral | /saas/referral | P220 | true |
| `saas_community` | Community | /saas/community | P220 | true |
| `saas_events` | Events | /saas/events | P220 | true |
| `saas_partnerships` | Partnerships | /saas/partnerships | P220 | true |
| `saas_devrel` | Developer Marketing | /saas/devrel | P220 | true |

The `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger ensures these 12 SG namespaces cannot be activated (`planned_only=false AND is_active=true`) without the owning phase's UPDATE pathway. P218/P219/P220 Plan 06 will activate via UPDATE — never via INSERT — proving namespace collision is impossible.

---

## Downstream UI Inheritance Map (future surfaces consuming 217 contracts)

| Future surface | Owning future phase | 217 substrate consumed | Mutation-class binding | Placeholder until owning phase ships |
|----------------|---------------------|-------------------------|------------------------|---------------------------------------|
| SaaS country-suite dashboards | future SaaS Country Suite Activation phase | `saas_revenue_metric_definitions` + `saas_mrr_snapshots` + per-country `country_codes` filter | `data.export` for export | none in 217; future surface placeholder TBD |
| Growth-extension activation wizard | P218+ growth phases | `saas_suite_activations.growth_extension` (214 substrate) + 217 sidebar mounting | `single_approval` for activation | `<PlaceholderBanner variant="future_phase_218_saas_*">` (12 variants) |
| Tenant Management cross-org admin | future enterprise admin | `sas_agent_readiness` aggregated cross-tenant | `data.export` | future surface placeholder |
| SaaS audit log timeline | future SOC2 admin | `markos_audit_log_hash_chain` rows scoped to SaaS suite | `data.export` | `<PlaceholderBanner variant="future_phase_soc2_pii_audit_log">` |
| Multi-tenant aggregation dashboard | future enterprise reporting | `saas_mrr_snapshots` aggregated cross-tenant | `data.export` | future surface placeholder |
| Plan-change preview/diff | future P217+ admin extension | `saas_plans` + `saas_plan_versions` historical rows | `single_approval` | future surface placeholder |
| Cohort retention browser | future analytics | `saas_mrr_snapshots` cohort fields + `/v1/saas/metrics/cohorts` | `data.export` | future surface placeholder |
| Agent run-cost preview | future ops | `sas_agent_readiness` cost posture | `data.export` | future surface placeholder |
| 12 SG-* translation-gate seed namespaces | P218 / P219 / P220 Plan 06 each | `saas_nav_visibility` 12 reserved rows | `single_approval` for activation | placeholder banners listed above |
| Per-subscription health detail drilldown | future P217+ admin | 216 §UI Binding Contract 1 + `saas_health_scores.dimension_scores` | `data.export` | placeholder TBD |
| Save-offer approval modal | future P208 Approval Inbox extension via 8th literal | 216 §UI Binding Contract 3 | `billing.charge` (root); `dual_approval` for save_offer | exists in P208 today as 8th filter chip; row rendering deferred |

---

## Storybook Coverage

Target: **≥50 named state stories** across the 10 pages + 6 net-new components.

| Storybook target | Story count | Files |
|-------------------|-------------|-------|
| Surface 0 Layout | 5 (loading / activated-active / not-saas-redirect / not-activated-redirect / t0-gate-warning) | `app/saas/layout.stories.tsx` |
| Surface A Overview | 6 (loading / no-snapshot / snapshot-stale / snapshot-fresh / no-subscriptions / t0-gate-closed) | `app/saas/page.stories.tsx` |
| Surface B Subscriptions | 4 (loading / empty / populated / filter-applied) | `app/saas/subscriptions/page.stories.tsx` |
| Surface C Plans | 5 (loading / empty / populated / pricing-pending / pricing-resolved) | `app/saas/plans/page.stories.tsx` |
| Surface D Revenue | 6 (loading / no-snapshot / snapshot-stale / populated / sentinel-active / source-conflict) | `app/saas/revenue/page.stories.tsx` |
| Surface E Waterfall | 4 (loading / empty / populated / period-mismatch) | `app/saas/revenue/waterfall/page.stories.tsx` |
| Surface F Churn | 5 (loading / no-at-risk / at-risk-populated / intervention-pending-approval / intervention-sentinel-active) | `app/saas/churn/page.stories.tsx` |
| Surface G Invoices | 5 (loading / empty / populated / dian-rejected-present / webhook-dlq-pending) | `app/saas/invoices/page.stories.tsx` |
| Surface H Support | 6 (loading / no-tickets / populated / kb-below-threshold / pending-cs-approval / banned-lexicon-block) | `app/saas/support/page.stories.tsx` |
| Surface I Agents | 5 (loading / all-planned / partial-ready / none-runnable / activation-attempt-blocked) | `app/saas/agents/page.stories.tsx` |
| `<KpiCard>` | 5 (default / fresh / stale / no-data / error) | `components/markos/saas/KpiCard.stories.tsx` |
| `<MetricCard>` | 15 (one per of the 15 metric variants) | `components/markos/saas/MetricCard.stories.tsx` |
| `<MRRWaterfallChart>` | 4 (default / empty / large-positive-net / large-negative-net) | `components/markos/saas/MRRWaterfallChart.stories.tsx` |
| `<AgentReadinessTable>` | 5 (default / all-planned / partial-ready / runnable-conflict / activation-blocked) | `components/markos/saas/AgentReadinessTable.stories.tsx` |
| `<RevenueMetricGrid>` | 4 (default / desktop / tablet / mobile-collapse) | `components/markos/saas/RevenueMetricGrid.stories.tsx` |
| `<NavSidebar>` | 5 (collapsed / expanded / mobile-overlay / disabled-row-state / planned-only-eyebrow) | `components/markos/saas/NavSidebar.stories.tsx` |

**Total: 51 + 38 = 89 Storybook stories** (well above the ≥50 target).

---

## Acceptance Criteria

This phase ships ~50-80 surface ACs across 10 pages + 12-15 backend doctrine ACs + 10 cross-cutting (X-1..X-10) ACs.

### Per-Surface ACs (selected — full list lives in 217-VALIDATION.md)

**Surface 0 Layout:**
- L-01: server-component reads `saas_suite_activations` for current tenant before any render
- L-02: redirects to `/settings/plugins?msg=saas_not_activated` when inactive
- L-03: `<NavSidebar>` renders 9 active rows + 12 disabled planned-only rows
- L-04: T0 readiness gate banner appears when 213-05 gate is closed
- L-05: `app/(saas)/` route group does NOT exist (architecture-lock test)

**Surface A Overview:**
- A-01: KPI grid renders 4 cards (MRR / NRR / Avg. health / Active subs)
- A-02: KPI freshness chip displays `<.c-chip-protocol>` linking to AgentRun
- A-03: "Recalculate KPIs" CTA renders only when snapshot stale (>24h)
- A-04: zero hard-coded $ literals in JSX
- A-05: zero `[ok]`/`[warn]`/`[err]` glyphs without paired state color (216 state-color rule)

**Surface B Subscriptions:**
- B-01: `<SaaSSubscriptionsTable>` is mounted with full prop signature inherited
- B-02: filter chips render the 6 state literals from 214 (`draft|trialing|active|past_due|paused|canceled`)
- B-03: per-row action menu binds to `billing.charge` mutation class (214 inheritance)

**Surface C Plans:**
- C-01: every plan-row price renders `<Money>` xor `<PricingSentinelBadge>` — zero hard-coded literals
- C-02: state badges render `[ok]/[info]/[info]` for `published/draft/archived`
- C-03: "View pricing →" link routes to `/admin/billing/pricing` (P205)

**Surface D Revenue:**
- D-01: 15 `<MetricCard>` instances rendered in `<RevenueMetricGrid>`
- D-02: source-precedence chip renders 5-tier hover tooltip
- D-03: "Recalculate metrics" + "Export revenue metrics" CTAs both bind to `data.export` mutation class
- D-04: sentinel notice renders when any `pricing_recommendation_id IS NULL`

**Surface E Waterfall:**
- E-01: `<MRRWaterfallChart>` renders single chart (≥400px height anchor); SR-only `<table>` fallback present
- E-02: chart colors are tokens-only (no rainbow)
- E-03: chart canvas has `aria-hidden="true"`; SR-only `<table>` has `<caption>` (sr-only)
- E-04: legend bracketed glyphs paired with state colors

**Surface F Churn:**
- F-01: `<HealthScoreBadge>` + `<RiskBandBadge>` rendered per row (216 UI Binding Contract 1)
- F-02: 5-dimension breakdown rendered when row expanded (216 verbatim)
- F-03: save-offer pricing block renders Path A xor Path B (216 UI Binding Contract 3)
- F-04: "Recalculate health score" CTA copy matches 216 verbatim
- F-05: raw_facts incomplete error renders verbatim copy

**Surface G Invoices:**
- G-01: every invoice row renders amount via `<Money>` xor `<PricingSentinelBadge>` (215 inheritance)
- G-02: DIAN CUFE chip renders as `.c-chip-protocol` (NEVER raw certificate per 215 B-1..B-8)
- G-03: compliance status badges render 5 literals (`compliant/dian_pending/dian_rejected/quickbooks_pending/siigo_pending`)
- G-04: webhook DLQ cross-link routes to `/operations/recovery?kind=webhook_delivery`
- G-05: zero raw vault credentials in JSX (defense-in-depth grep returns 0)

**Surface H Support:**
- H-01: `<ClassifierChipRow>` renders 5 dimensions per row (216 UI Binding Contract 2)
- H-02: `<KbGroundingPanel>` renders top-3 sources per row
- H-03: KB grounding below-threshold notice copy verbatim (216)
- H-04: banned-lexicon block notice copy verbatim (216)
- H-05: ticket subject rendered via `<PIIRedactedField>` per 216 UI Binding Contract 4
- H-06: "Open in Approval Inbox →" link uses 7th handoff_kind literal `support_response_approval`

**Surface I Agents:**
- I-01: `<AgentReadinessTable>` renders 6 rows (one per SAS agent)
- I-02: 8 readiness flags rendered as flag-grid per row
- I-03: `runnable=true` count = 0 in P217 invariant (test asserts 0)
- I-04: activation attempt with all 8 flags + null `activation_approval_id` raises DB-trigger exception
- I-05: agent token chip renders `.c-chip-protocol` (D-09 mint-as-text)

### Backend Doctrine ACs (217-01..05)

- BD-01 (217-01): 15 default revenue metric definitions seeded via DO-block
- BD-02 (217-01): `REVENUE_METRIC_REQUIRES_PROVENANCE` trigger blocks INSERT without formula+source+timestamp+reconciliation_state
- BD-03 (217-02): `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE` trigger blocks INSERT without reconciliation_state
- BD-04 (217-02): nightly cron `api/cron/saas-mrr-snapshot.js` writes snapshot + waterfall entries
- BD-05 (217-03): `sas_agent_readiness` table ships with 6 SAS agents seeded `runnable=false`
- BD-06 (217-03): `SAS_AGENT_ACTIVATION_REQUIRES_READINESS` trigger blocks fully-ready insert without `activation_approval_id`
- BD-07 (217-04): 18 `/v1/saas/*` endpoints across 7 handler files exist; each calls `requireHostedSupabaseAuth`
- BD-08 (217-04): `contracts/openapi.json` regenerated; F-247..F-258 paths present
- BD-09 (217-04): no handler in `api/v1/saas/**` calls `requireSupabaseAuth`, `serviceRoleClient`, or `createApprovalPackage` (read-only surface)
- BD-10 (217-05): `lib/markos/mcp/tools/saas.cjs` registers 10 tool descriptors; all `mutating: false`; all use `session.tenant_id`
- BD-11 (217-05): MCP registry `index.cjs` includes the new SAAS_TOOLS array
- BD-12 (217-06): `saas_nav_visibility` table ships with 21-row seed per active SaaS tenant (9 active + 12 planned-only)
- BD-13 (217-06): `SAAS_NAV_REQUIRES_ACTIVATION` trigger blocks `is_active=true AND planned_only=false` without active activation
- BD-14 (217-06): F-256 + F-257 contracts written; `flow-registry.json` updated
- BD-15 (217-06): closeout regression suite passes — slot-collision (P217 owns 98+99 only), architecture-lock-rerun (0 violations), requirements-coverage (SAS-09/10, MCP-01, API-01, QA-01..15 covered)

### Cross-Cutting ACs (X-1..X-10)

- X-01: zero hard-coded `$\d` literals across `app/saas/**/*.tsx` and `components/markos/saas/**/*.tsx`
- X-02: zero hex literals across `app/saas/**/*.module.css` and `components/markos/saas/**/*.module.css`
- X-03: zero banned-lexicon tokens (19 tokens) across all 217 source files
- X-04: zero exclamation points in any 217 product surface copy
- X-05: zero emoji in any 217 source file (CLAUDE.md "no emoji in product UI")
- X-06: zero `app/(saas)/` route-group folder on disk (architecture-lock-rerun test)
- X-07: ≥50 Storybook stories registered across 10 pages + 6 components (target 89)
- X-08: every state-color render is paired with a bracketed glyph (DESIGN.md state-color rule)
- X-09: every PII display in `app/saas/{churn,support,invoices}/page.tsx` uses `<PIIRedactedField>` xor `<RetentionClassChip>` (216 UI Binding Contract 4)
- X-10: every monetary value uses `<Money fromPricingRecommendation>` xor `<PricingSentinelBadge>` (215 sentinel discipline)

---

## Copywriting Contract

This is the canonical copy register for all 10 surfaces. All copy is CI-checked at zero-match for the 19 banned-lexicon tokens + zero exclamation points. Verbatim strings:

### Page-level copy

- **Surface 0 layout (T0 gate closed)**: "[warn] Tenant 0 readiness gate is closed. SaaS Suite dashboards are paused until v4.0.0 readiness sign-off completes."
- **Surface A Overview heading**: "SaaS Suite — Overview"
- **Surface A snapshot fresh notice**: "[ok] MRR snapshot is fresh. Last calculated {ago}."
- **Surface A snapshot stale notice**: "[warn] MRR snapshot is stale. Last calculated {ago}. Recalculate via cron or manual trigger."
- **Surface A no-snapshot notice**: "[info] Awaiting first MRR snapshot. Run \"Recalculate KPIs\" or wait for nightly cron."
- **Surface A primary CTA**: "Recalculate KPIs"
- **Surface B Subscriptions heading**: "Subscriptions"
- **Surface B empty state**: "[info] No subscriptions yet. Subscriptions appear here after the first SaaS customer signs up."
- **Surface C Plans heading**: "Plans"
- **Surface C empty state**: "[info] No plans configured yet. Plan catalog editing arrives in a future SaaS Suite admin extension."
- **Surface D Revenue heading**: "Revenue dashboard"
- **Surface D primary CTA**: "Recalculate metrics"
- **Surface D secondary CTA**: "Export revenue metrics"
- **Surface D sentinel notice**: "[warn] Pricing Engine recommendation pending — sentinel active for {N} metric(s)."
- **Surface E Waterfall heading**: "MRR waterfall"
- **Surface E primary CTA**: "Recalculate waterfall"
- **Surface E secondary CTA**: "Export MRR waterfall"
- **Surface F Churn heading**: "Churn intelligence"
- **Surface F empty state**: "[ok] No at-risk accounts. Health scores are healthy across the board."
- **Surface F primary CTA**: "Recalculate health scores"
- **Surface F per-row recalc**: "Recalculate health score" (verbatim from 216)
- **Surface F raw-facts incomplete error**: "[err] Health score raw facts incomplete — connector data required" (verbatim from 216)
- **Surface F sentinel notice**: "[warn] Pricing Engine recommendation pending — sentinel active" (verbatim from 216)
- **Surface G Invoices heading**: "Invoices"
- **Surface G empty state**: "[info] No invoices yet. Invoices appear here after the first billing cycle completes."
- **Surface G DIAN-rejected notice**: "[err] {N} invoice(s) rejected by DIAN — P1 task created"
- **Surface G webhook-DLQ notice**: "[warn] {N} webhook delivery(ies) in DLQ"
- **Surface H Support heading**: "Support intelligence"
- **Surface H empty state**: "[ok] No open tickets. Support queue is clear."
- **Surface H KB-below-threshold notice**: "[warn] KB grounding confidence below threshold — review and edit" (verbatim from 216)
- **Surface H banned-lexicon block**: "[err] Suggested response contains banned lexicon — review and edit before dispatch" (verbatim from 216)
- **Surface H PII placeholder**: "[REDACTED]" (verbatim from 216 UI Binding Contract 4)
- **Surface I Agents heading**: "SAS agent registry"
- **Surface I activation pending notice**: "[info] Agent activation requires all 8 readiness flags + activation_approval_id. See approval inbox."
- **Surface I export CTA**: "Export agent registry"

### Inline-CTA mint-text links (24 across surfaces)

- "View MRR waterfall →"
- "View at-risk accounts →"
- "View pending approvals →"
- "View agent readiness →"
- "View subscriptions →"
- "View webhook DLQ →"
- "Open in Approval Inbox →"
- "Open subscription →"
- "Open ticket →"
- "Open invoice →"
- "Open agent detail →"
- "Open intervention →"
- "View pricing →"
- (per-page navigation echoes inherited from Surfaces B-I)

### Banned-lexicon zero-match check

The 19 banned tokens (CI-asserted): `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). Plus zero exclamation points in product surface copy. CI grep `scripts/marketing-loop/check-banned-lexicon.mjs` runs against every 217 surface file before commit.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | not applicable — repository is not shadcn-initialized; primitives in `styles/components.css` v1.1.0 | not required |
| third-party | none — no third-party blocks ingested in this phase | not required |

Phase 217 ships no third-party UI registry blocks. All UI primitives are composed from existing `styles/components.css` v1.1.0 + the 6 net-new D-15 extracted components (which compose existing primitives). Registry vetting gate is not applicable for this phase.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (full copy register declared; banned-lexicon zero-match enforceable)
- [ ] Dimension 2 Visuals: PASS (all components compose `styles/components.css` v1.1.0 primitives; zero local class names)
- [ ] Dimension 3 Color: PASS (60/30/10 split honored; mint reserved-for list explicit)
- [ ] Dimension 4 Typography: PASS (3 sizes + 2 weights + 2 typefaces; zero third typeface)
- [ ] Dimension 5 Spacing: PASS (8-point scale; documented MRR waterfall canvas anchor exception)
- [ ] Dimension 6 Registry Safety: PASS (no third-party registry blocks)

**Approval:** pending

---

## Verification Anchors

To verify the design contract is honored after execution, run the following CI assertions (each MUST return 0 matches OR the documented expected count):

```bash
# 1. Token-only enforcement (D-08)
rg -n -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/saas/**/*.module.css components/markos/saas/**/*.module.css
# Expected: 0 matches

# 2. No hard-coded dollar literals
rg -n -P '\$\d' app/saas/**/*.tsx components/markos/saas/**/*.tsx
# Expected: 0 matches

# 3. No hard-coded tier names
rg -n -P '"(Growth Monthly|Starter|Professional)"' app/saas/**/*.tsx components/markos/saas/**/*.tsx
# Expected: 0 matches

# 4. No app/(saas)/ route group folder (architecture-lock)
test ! -d "app/(saas)" && echo "ok"
# Expected: ok

# 5. No banned-lexicon tokens across 217 surfaces
node scripts/marketing-loop/check-banned-lexicon.mjs --paths app/saas/ components/markos/saas/
# Expected: 0 matches

# 6. No emoji in 217 source files
rg -n -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' app/saas/ components/markos/saas/
# Expected: 0 matches

# 7. No exclamation points in product surface copy
rg -n '!' app/saas/**/page.tsx components/markos/saas/**/*.tsx | rg -v -P '(useEffect|useState|!=|!==|!important)'
# Expected: 0 matches (after dropping JS-syntax false positives)

# 8. Every PII display uses <PIIRedactedField>
rg -n -P '(saas_support_tickets\.subject|saas_support_tickets\.description|saas_churn_interventions\.outcome_jsonb|saas_health_scores\.raw_facts)' app/saas/ | rg -v 'PIIRedactedField'
# Expected: 0 matches (every PII column reference is wrapped)

# 9. Every monetary value uses <Money> xor <PricingSentinelBadge>
rg -n 'amount_micro_usd|price_micro_usd' app/saas/ | rg -v -P '(Money|PricingSentinelBadge)'
# Expected: 0 matches

# 10. Storybook stories ≥ 50 (target 89)
find app/saas/ components/markos/saas/ -name '*.stories.tsx' | wc -l
# Expected: ≥ 16 (file count)
node -e "const fs=require('fs'),g=require('glob');let c=0;g.sync('app/saas/**/*.stories.tsx').concat(g.sync('components/markos/saas/**/*.stories.tsx')).forEach(f=>{c+=(fs.readFileSync(f,'utf8').match(/export const \w+: Story/g)||[]).length});console.log(c)"
# Expected: ≥ 50

# 11. 12 SG-* nav rows seeded as planned_only=true
psql -c "SELECT count(*) FROM saas_nav_visibility WHERE planned_only = true"
# Expected per active SaaS tenant: 12

# 12. 0 SG agents runnable
psql -c "SELECT count(*) FROM sas_agent_readiness WHERE runnable = true"
# Expected: 0 (P217 invariant)
```

If any assertion fails, the gsd-ui-checker MUST BLOCK with the failed grep and verbatim assertion in the BLOCK reason.

---

*Generated by gsd-ui-researcher 2026-04-29. Source of truth: DESIGN.md v1.1.0. Carry-forward: 213.4 D-08..D-15. Parent chain: 206 → 207 → 208 → 209 → 213 → 214 → 215 → 216 → 217. This is the largest UI surface phase to date — 10 dashboard pages + 1 layout + 6 net-new extracted components + 8 reused components from upstream phases. Per-page contract tightness matches 208 cockpit pattern.*
