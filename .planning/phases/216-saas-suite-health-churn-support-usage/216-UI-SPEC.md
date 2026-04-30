---
phase: 216
slug: saas-suite-health-churn-support-usage
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: saas-suite-health-churn-support-usage-substrate-5-dim-explainable-health-score-plg-event-taxonomy-support-classifier-kb-grounding-cs-approval-gate-churn-playbooks-pricing-engine-save-offer-pii-redaction-retention-sweep-growth-handoff-signal-map
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [216-01, 216-02, 216-03, 216-04, 216-05, 216-06]
plans_with_ui_surfaces: []
plans_no_ui: [216-01, 216-02, 216-03, 216-04, 216-05, 216-06]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for CS-approved support response dispatch; `billing.charge` for save_offer + win_back_offer activation; `data.export` for PII audit-log export and retention sweep export; `default_approval_mode` per intervention type; autonomy ceiling on `external.send` and `billing.charge` for at_risk/critical accounts)
  - 207-UI-SPEC.md (RunApiEnvelope; `run_id` linked to health-score recalculation runs + intervention runs + retention sweep runs; AgentRunEventType for support response approval lifecycle + save-offer activation lifecycle; ApprovalHandoffRecord links 216 support responses + save offers to P208 inbox)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` extends with TWO new handoff_kind literals: `support_response_approval` (7th literal) + `save_offer_approval` (8th literal); Recovery Center extends with connector adapter status viewer for product-event ingest; Task Board consumes intervention tasks routed via 216-04 task-creator; Morning Brief and Weekly Narrative read health-score / churn / support summaries)
  - 212-UI-SPEC.md (PARENT — KB grounding for support responses reads `markos_literacy_chunks` substrate per 216-03 `kb-grounding.ts`; ArtifactPerformanceLog inheritance for support response quality + intervention outcomes; learning-handoff anonymization seeds P212 fixtures via 216-05 `anonymizeForLearning`; sensitive/highly_sensitive rows blocked at tenant boundary)
  - 213-UI-SPEC.md (Tenant 0 readiness gate consumer — 213-04 public-proof boundary; 216 support intelligence is PRIVATE doctrine and never published as public proof; raw ticket subject/description, sentiment, churn_signal_reason, and customer NIT/email are NEVER cited in case-studies or external surfaces)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; 216 `saas_health_scores.subscription_id` FK to 214 `saas_subscriptions`; 216 `saas_churn_interventions.subscription_id` FK to 214; 216 inherits the `business_type != 'saas'` gating contract for all future health/churn/support surfaces; 214 `tenant_safe_auto_response_enabled` flag (215-03 ALTER) is the only operator-controlled toggle that allows 216 support response auto-dispatch without per-ticket CS approval)
  - 215-UI-SPEC.md (PARENT — billing-correction approval pattern reused for save-offer; sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` for save-offer pricing inherits 215-05 `saas_billing_corrections.offer_details` discipline verbatim; the 215 `billing.charge` mutation-class binding extends to 216 save_offer + win_back_offer activation; 215 sensitive credential handling discipline extends to 216 PII handling for support text + customer email + product event user_id_external)
translation_gates_dissolved_by_216:
  - "215-UI-SPEC §Approval Inbox handoff filter — `billing_correction_approval` (6th literal) extension reused. 216 adds TWO new literals to the 208-04 Approval Inbox handoff_kind set: `support_response_approval` (7th literal — 216-03 `requestResponseApproval` calls `buildApprovalPackage` with kind='saas_support_response_dispatch' which routes through this handoff_kind in P208 Approval Inbox) + `save_offer_approval` (8th literal — 216-04 `requestSaveOffer` calls `buildApprovalPackage` with kind='saas_churn_save_offer'). The 4 P207 literals + 5th P214 `billing_charge_approval` + 6th P215 `billing_correction_approval` + 7th P216 `support_response_approval` + 8th P216 `save_offer_approval` form the canonical 8-chip filter chain. P208 surfaces consume the 7th and 8th literals verbatim."
  - "213-04 §Public-Proof Boundary consumer — 216 support intelligence is PRIVATE doctrine. 216 ticket data (`saas_support_tickets.subject`, `description`, `sentiment`, `churn_signal_reason`, `topic_tags`, `kb_grounding_evidence`), product event data (`product_usage_events.properties`, `user_id_external`, `account_id_external`), churn intervention data (`saas_churn_interventions.offer_details`, `outcome_jsonb`, `trigger_reason`), and health-score raw facts (`saas_health_scores.raw_facts`, `dimension_scores`) are NEVER published as public proof. Future case-study editors enforce: any reference to a 216 health/support/intervention outcome renders the IDs (`subscription_id`, `health_score_id`, `intervention_id`) via `.c-chip-protocol` only; outcome content is fetched via authenticated `data.export` mutation (P208 admin extension), never embedded inline. The 213-04 banned-phrases contract (`unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade`) applies to any future case-study referencing a 216 health-score lift or churn-save outcome."
  - "212-UI-SPEC §ArtifactPerformanceLog learning-handoff — 216-05 `anonymizeForLearning({ rows, classification })` seeds P212 learning fixtures: sensitive/highly_sensitive rows blocked entirely; pseudonymous rows hashed; no_pii rows passed through. 216 support response quality (csat_score + first_response_at + resolved_at + sla_breached) and intervention outcome (outcome_jsonb post-activation) feed P212 ArtifactPerformanceLog via the anonymized handoff path — never via direct row passthrough. P212 future learning admin surfaces consume the anonymized output."
translation_gates_opened_by_216:
  - "future_phase_217_health_dashboard_ui — per-subscription health-score dashboard with 5-dimension breakdown (`usage` 0.30 + `support` 0.20 + `billing` 0.20 + `engagement` 0.15 + `relationship` 0.15 weighted-sum), 4 risk bands (`healthy` 80-100 / `watch` 60-79 / `at_risk` 40-59 / `critical` 0-39), 30-day trend mini-chart (sparkline; deferred recipe), recommended action panel, manual recalc CTA. P216-01 `lib/markos/saas/health/score-calculator.ts` exposes `calculateHealthScore({rawFacts, weights})`; P216-01 `api/v1/saas/health.js` GET endpoints serve the data; future P217+ admin extension ships the dashboard frontend rendering each dimension as `.c-badge` row with weighted-sum contribution. Future surfaces render `<PlaceholderBanner variant=\"future_phase_217_health_dashboard_ui\">` until that phase ships."
  - "future_phase_218_growth_signal_consumer — P218/P219/P220 consumers of the 9 reserved `growth_signal_map` rows (P216-06 ships `planned_only=true` + `activated_at IS NULL`). P218 `ActivationDefinition` + `PQLScore` + `UpgradeTrigger` consume `product_usage_events.event_category` taxonomy (216-02 `EVENT_CATEGORIES = ['activation','adoption','depth','stickiness','expansion','plg_readiness','churn_signal','other']`). P218 `ModeEligibility` consumes `saas_health_scores.risk_level`. P218 plan execution UPDATEs `growth_signal_map` rows (`planned_only=false` + `activated_at`) when each consumer is wired. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_growth_signal_consumer\">` until that phase ships."
  - "future_phase_220_churn_console — churn intervention admin surface. Composes the 7-playbook seed catalog (P216-04 `lib/markos/saas/churn/playbook-seeds.ts`) over the at_risk/critical health-score queue + open churn-signal ticket queue + open intervention queue; mutation-class binding `billing.charge` (per 206) with `default_approval_mode == dual_approval` for save_offer+win_back_offer, `single_approval` for engagement_deepening + ebr_scheduling + executive_outreach + champion_re_engagement + billing_recovery + expansion_conversation + account_brief; sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered when `pricing_recommendation_id IS NULL`. Future surfaces render `<PlaceholderBanner variant=\"future_phase_220_churn_console\">` until that phase ships."
  - "future_phase_219_support_admin_ui — support intelligence admin surface. Renders the 5-classifier output (sentiment + intent + churn_signal + topic_tags + urgency_score) per 216-03 `lib/markos/saas/support/classifier.ts`, KB grounding panel reading `support_kb_groundings` rows with relevance_score badges, suggested-response review modal with CS approval CTA, safe auto-response toggle gated on `saas_suite_activations.tenant_safe_auto_response_enabled` admin role; mutation-class binding `external.send` with `default_approval_mode == single_approval`. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_support_admin_ui\">` until that phase ships."
  - "future_phase_217_pii_audit_log — PII redaction + retention audit log (SOC2 admin extension). Composes the 15-row `data_retention_classes` catalog (5 P216 + 10 forward-looking from 216-05) + retention sweep timeline (`v_retention_due` view) + per-tenant PII class summary (`v_pii_class_summary` view) + per-customer consent status (`v_consent_status` view); mutation-class binding `data.export` with `default_approval_mode == single_approval`. Future surfaces render `<PlaceholderBanner variant=\"future_phase_217_pii_audit_log\">` until that phase ships."
---

# Phase 216 — UI Design Contract (no-UI-scope)

> **Phase 216 ships zero UI surfaces.** This document is the explicit
> no-surface declaration for the SaaS Suite Health, Churn, Support, and
> Product Usage Intelligence phase. There is no `app/`, no `components/`,
> no `*.stories.tsx`, no `page.tsx`, no `layout.tsx`, no `*.module.css`,
> and no `*.css` modified or created in any of the six plans
> (216-01 through 216-06).
>
> **Critical posture:** Phase 216 is the **health, churn, support, and
> product usage substrate** of the SaaS Suite — explainable 5-dimension
> weighted-sum health score with 4 risk bands; PLG product-usage event
> ingestion + 7-category PLG taxonomy + generic-first connector adapter;
> support ticket intelligence (sentiment + intent + churn_signal +
> topic_tags + urgency_score classifier) + KB grounding via
> `markos_literacy_chunks` (P212 SOFT) + previous resolution fallback +
> the strictest CS-approval gate of the 5 P216 DB-triggers; 7-playbook
> churn intervention engine + Pricing-Engine-aware save offers with
> `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel acceptance; foundational
> PII redaction + retention sweep substrate that every downstream
> P217-P228 phase WILL consume; growth handoff signal map with 9
> planned-only rows reserved for P218/P219/P220 activation. The phase's
> risk posture is HIGH on three dimensions — **customer-facing support
> response autonomy** (CS approval default; safe-auto-response only when
> operator explicitly enables tenant flag), **save-offer pricing
> integrity** (Pricing Engine context or sentinel; no tier-name or
> dollar literals authored anywhere in 216), and **PII handling for
> support text + product events** (PII redaction + retention class FK +
> retention sweep + cross-tenant learning anonymization).
>
> The existing P208 Approval Inbox + Recovery Center + Task Board
> consume 216 contracts as downstream readers — they are NOT modified
> by this phase. The two new Approval Inbox handoff_kind literals
> (`support_response_approval` + `save_offer_approval`) extend the P208
> filter chip set from 6 to 8 literals; rendering of those chips is
> deferred to a future P208 admin extension that displays per-row
> classifier output, KB grounding, save-offer pricing context, and
> approval CTAs. The four `markos_literacy_chunks` consumers (216-03
> `kb-grounding.ts`) are read-only against the P212 substrate.
>
> What Phase 216 *does* ship is the **health-churn-support-usage
> substrate** — **Supabase migrations**
> (`supabase/migrations/{112_saas_health_explainability,
> 113_saas_product_usage_events, 114_saas_support_tickets,
> 115_saas_churn_interventions, 116_saas_privacy_retention,
> 117_saas_growth_signal_map}.sql` — 6 DDL slots covering
> `saas_health_scores`, `data_retention_classes` lookup,
> `pii_classification` ENUM, `product_usage_events`,
> `product_usage_connectors`, `saas_support_tickets`,
> `support_kb_groundings`, `saas_intervention_playbooks`,
> `saas_churn_interventions`, retention sweep audit views, and
> `growth_signal_map`), **5 DB-triggers**
> (`HEALTH_SCORE_REQUIRES_RAW_FACTS` /
> `PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH` /
> `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` /
> `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` /
> `SUPPORT_DATA_REQUIRES_RETENTION_POLICY`), **typed health/usage/
> support/churn/privacy/handoff modules** under `lib/markos/saas/{health,
> usage, support, churn, privacy, handoff, preflight}/**`, **MCP tools**
> (`lib/markos/mcp/tools/{health, usage, support, churn}.cjs` — 8 tool
> descriptors total), **Node API handlers**
> (`api/v1/saas/{health, usage, support, churn}.js` — 4 server-side
> route modules; legacy `api/*.js` with no JSX, no rendering),
> **crons** (`api/cron/{saas-health-score-refresh,
> saas-usage-health-rollup, saas-churn-intervention-trigger,
> saas-privacy-retention-sweep}.js`), **F-ID contracts**
> (`contracts/F-{259..270}-saas-*.yaml` — 12 IDs total),
> **growth handoff doctrine**
> (`docs/growth-handoff/216-growth-signal-map.md`), and **tests**
> (`test/saas-216/{preflight, domain-{1..6}, rls, closeout}/*.test.js`).
> None of those files compose, import, or render any visual primitive
> from `styles/components.css` or any token from `app/tokens.css`.
>
> However, **every downstream phase (P208 admin extensions, P217+
> SaaS revenue / health dashboards, P218 PLG growth, P219 B2B
> expansion, P220 community/PR/partnership growth, future SOC2 admin
> for PII audit) that consumes a Phase 216 contract WILL eventually
> need a UI surface** — health-score dashboard with 5-dimension
> breakdown, at-risk accounts viewer, support ticket inbox with
> classifier badges, KB-grounded suggested response review modal,
> save-offer approval modal, churn intervention timeline viewer,
> product usage event browser, PII redaction audit log viewer,
> retention sweep timeline, health-score breakdown drilldown,
> learning-fixture grounding viewer, risk-band trend chart, future-
> growth handoff signal preview, connector adapter status viewer.
> This UI-SPEC therefore also serves as a forward-looking inheritance
> map so future UI-SPECs can cite their lineage back to the health/
> churn/support/usage doctrine defined here, AND as the load-bearing
> binding contract for **four future-surface UI binding contracts**
> (health score / support response approval / save-offer approval /
> PII redaction + retention).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md
> carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice`
> mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`,
> D-15 selective extraction) → 206-UI-SPEC (mutation-class origin:
> `external.send` for CS-approved support response, `billing.charge`
> for save_offer + win_back_offer activation, `data.export` for PII
> audit-log + retention sweep export; `default_approval_mode` per
> intervention type) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, `ApprovalHandoffRecord`; health-score recalc
> runs + intervention runs + retention sweep runs link via
> `agent_run_id`) → 208-UI-SPEC (PARENT — Approval Inbox extends
> `support_response_approval` 7th + `save_offer_approval` 8th
> handoff_kind literals; Recovery Center extends connector adapter
> status; Task Board reads intervention tasks) → 212-UI-SPEC
> (PARENT — KB grounding via 212-04 anonymized fixtures;
> ArtifactPerformanceLog inheritance; learning-handoff anonymization
> seeds P212) → 213-UI-SPEC (Tenant 0 readiness gate consumer; 213-04
> public-proof boundary applies to 216 support intelligence as
> PRIVATE doctrine) → 214-UI-SPEC (PARENT — SaaS Suite Activation;
> `saas_health_scores.subscription_id` FK to 214; SaaS Suite gating;
> `tenant_safe_auto_response_enabled` flag) → 215-UI-SPEC (PARENT —
> billing-correction approval pattern reused for save-offer; sentinel
> `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline) → this document.
> Generated by gsd-ui-researcher. Status: draft (checker upgrades to
> approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all
six plans plus context, research, reviews, and validation. The full
file set declared in `files_modified` across 216-01..216-06 is
enumerated below, with surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Phase doctrine | `.planning/phases/216-saas-suite-health-churn-support-usage/{216-CONTEXT, 216-RESEARCH, 216-REVIEWS, 216-VALIDATION, 216-{01..06}-PLAN, 216-{01..06}-SUMMARY}.md` | 216-01..216-06 | NO |
| Migration coordination | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (CREATE-or-APPEND) | 216-01 | NO |
| Growth handoff doctrine | `docs/growth-handoff/216-growth-signal-map.md` | 216-06 | NO (markdown only) |
| Preflight surface | `lib/markos/saas/preflight/{upstream-gate.ts, architecture-lock.ts, errors.ts, index.cjs}` (4 files) | 216-01 | NO (TS/CJS modules; no JSX) |
| Health domain modules | `lib/markos/saas/health/{contracts.ts, contracts.cjs, score-calculator.ts, score-calculator.cjs, risk-bands.ts, index.cjs}` (6 files) | 216-01 | NO |
| Usage domain modules | `lib/markos/saas/usage/{contracts.ts, contracts.cjs, event-ingest.ts, event-ingest.cjs, event-taxonomy.ts, connector-adapter.ts, health-rollup.ts, index.cjs}` (8 files) | 216-02 | NO |
| Support domain modules | `lib/markos/saas/support/{contracts.ts, contracts.cjs, ticket-import.ts, ticket-import.cjs, classifier.ts, kb-grounding.ts, response-approval.ts, index.cjs}` (8 files) | 216-03 | NO |
| Churn domain modules | `lib/markos/saas/churn/{contracts.ts, contracts.cjs, playbook-engine.ts, playbook-engine.cjs, save-offer.ts, task-creator.ts, playbook-seeds.ts, index.cjs}` (8 files) | 216-04 | NO |
| Privacy/retention domain modules | `lib/markos/saas/privacy/{contracts.ts, contracts.cjs, retention-policy.ts, retention-policy.cjs, pii-redaction.ts, learning-handoff.ts, audit-views.ts, index.cjs}` (8 files) | 216-05 | NO |
| Growth handoff modules | `lib/markos/saas/handoff/{contracts.ts, contracts.cjs, signal-map.ts, translation-gate.ts, index.cjs}` (5 files) | 216-06 | NO |
| MCP tools | `lib/markos/mcp/tools/{health.cjs, usage.cjs, support.cjs, churn.cjs}` (4 files) + `lib/markos/mcp/tools/index.cjs` (registry append) | 216-01..216-04 | NO (CommonJS MCP descriptors; no JSX) |
| Migrations | `supabase/migrations/{112_saas_health_explainability, 113_saas_product_usage_events, 114_saas_support_tickets, 115_saas_churn_interventions, 116_saas_privacy_retention, 117_saas_growth_signal_map}.sql` (6 files) | 216-01..216-06 | NO (SQL DDL) |
| Node API handlers | `api/v1/saas/{health.js, usage.js, support.js, churn.js}` (4 files) | 216-01..216-04 | NO (legacy `api/*.js` route modules; no JSX, no rendering) |
| Cron handlers | `api/cron/{saas-health-score-refresh, saas-usage-health-rollup, saas-churn-intervention-trigger, saas-privacy-retention-sweep}.js` (4 files) | 216-01..216-05 | NO (cron routes; no JSX) |
| Preflight scripts | `scripts/preconditions/216-{01..06}-check-upstream.cjs` (6 files) | 216-01..216-06 | NO (Node CLI assertion runners) |
| F-ID contract YAMLs | `contracts/F-{259..270}-saas-*.yaml` (12 files) + `contracts/flow-registry.json` updates | 216-01..216-06 | NO |
| Test fixtures | `test/fixtures/saas-216/{index.js, health-score.js, data-retention-class.js, product-usage-event.js, product-usage-connector.js, support-ticket.js, support-kb-grounding.js, churn-intervention.js, intervention-playbook.js, retention-policy.js, pii-redaction.js, growth-signal-map.js}` (12 files) | 216-01..216-06 | NO |
| Test files | `test/saas-216/{preflight, domain-{1..6}, rls, closeout}/*.test.js` | 216-01..216-06 | NO |

**Search assertions** (verified during scope confirmation; ripgrep
across all six plan files in `files_modified` blocks):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 216-01..216-06 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 216-01..216-06 | 0 matches |
| `files_modified` glob `app/(saas)/**` across 216-01..216-06 | 0 matches (P216 architecture-lock forbidden path) |
| `files_modified` glob `app/(growth)/**` across 216-01..216-06 | 0 matches (P216 architecture-lock forbidden path) |
| `files_modified` glob `components/**` across 216-01..216-06 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 216-01..216-06 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 216-01..216-06 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 216-01..216-06 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `route.ts` (216 architecture-lock forbidden string) | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |

**Disambiguation note (legacy Node API path syntax):** The 4 files
under `api/v1/saas/{health,usage,support,churn}.js` and the 4 files
under `api/cron/saas-*.js` are flat versioned legacy `api/*.js`
handlers per the 216 architecture-lock pin (forbidden patterns include
`route.ts`, `app/api/cron/.../route.ts`, `app/(saas)/`, `app/(growth)/`).
They emit JSON envelopes only; the cron handlers ack with HTTP 200 and
emit `markos_agent_runs` events. Visual rendering of the health
dashboard, support inbox with classifier badges, save-offer approval
modal, churn intervention timeline, product usage browser, PII audit
log, retention sweep timeline is downstream phases' responsibility
(future P208 admin extensions, future P217+ admin extensions for
health/SaaS revenue surfaces, future P218-P220 growth modules, future
SOC2 admin for PII audit).

**Disambiguation note (existing surfaces NOT modified by 216):** The
operator-cockpit surfaces shipped in P208 (`app/(markos)/operations/{tasks,
approvals, recovery, narrative}/page.tsx`) read 216 outputs as
downstream consumers via the P208 substrate. The Approval Inbox
filter chip set extends from 6 to 8 chips when 216 ships
(`support_response_approval` + `save_offer_approval`); the row
rendering for those two new handoff_kind literals is deferred to a
future P208 admin extension. Phase 216 ships the substrate; the
placeholder dissolutions on those existing surfaces require future
P208 / P217+ / P219 / P220 admin extension phases. **216 itself does
not modify any P208, P212, P213.x, or P214 file.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase
is pure health/churn/support/usage substrate authoring + contracts +
Node API handlers + migrations + MCP tools + CI scripts + tests +
handoff doctrine. There are no visual decisions to specify, no
typography choices to lock, no copywriting copy to draft for
end-user surfaces, and no component primitives to compose. **If the
checker finds ANY UI surface in plan files_modified blocks, BLOCK.**

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
| Form authoring posture | not applicable — no forms (the legacy `api/*.js` POST handlers accept JSON request bodies; the only multipart paths are deferred to future support ingest CSV upload UIs) |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money / pricing display posture | not applicable — money flows through `saas_churn_interventions.offer_details` JSONB (Pricing Engine context OR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel) and `pricing_recommendation_id` FK; rendering of monetary values is downstream phases' responsibility (future P220 growth admin churn console renders via `<Money fromPricingRecommendation={pr_id} />` recipe per 215-UI-SPEC; sentinel persists on `saas_churn_interventions.offer_details` until P205 Pricing Engine lands per CLAUDE.md Pricing Engine Canon). **Phase 216 MUST NOT take pricing ownership.** |
| Table authoring posture | not applicable — registry tables in `docs/growth-handoff/216-growth-signal-map.md` are GitHub-flavored Markdown rendered by Markdown viewers, not React tables; F-ID contract YAMLs are doctrine prose only |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by the `pricing_recommendation_id IS NULL AND offer_details::text LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` branch of the `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` DB-trigger (216-04 migration 115) per CLAUDE.md Pricing Engine Canon; appears verbatim in `test/saas-216/domain-4/churn-save-offer-sentinel.test.js`; `lib/markos/saas/churn/save-offer.ts` exports `PRICING_SENTINEL = '{{MARKOS_PRICING_ENGINE_PENDING}}'` constant; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/saas/{health,usage,support,churn}.js` are legacy Node `api/*.js` route modules. They emit JSON envelopes (paginated health-score lists, per-subscription explainability payloads, paginated ticket lists with classifier output, KB grounding payloads, intervention timelines, save-offer approval handoffs) and accept POST mutations gated by `requireHostedSupabaseAuth` + tenant-scoped supabase client. The `/v1/saas/usage/ingest` and `/v1/saas/support/webhook/:connector_id` paths use `x-connector-auth` header (P210 substrate). The `api/cron/saas-*.js` handlers are gated by `x-markos-cron-secret` matching `MARKOS_SAAS_CRON_SECRET` env per `api/cron/mcp-kpi-digest.js` pattern. They DO NOT render HTML, JSX, or any visual surface. |
| MCP tool posture | `lib/markos/mcp/tools/{health,usage,support,churn}.cjs` register 8 tool descriptors total: (health) `get_subscription_health` + `get_at_risk_accounts`; (usage) `get_product_usage_summary`; (support) `get_support_patterns` + `draft_support_response`; (churn) `get_churn_interventions` + `suggest_save_offer`. The `draft_support_response` MCP tool returns AI-drafted response with KB grounding metadata but DOES NOT dispatch — it surfaces the approval requirement. The `suggest_save_offer` MCP tool returns offer template with `PRICING_SENTINEL` if P205 Pricing Engine missing. MCP tools emit structured JSON; they do NOT render. |
| Doctrine prose posture | `docs/growth-handoff/216-growth-signal-map.md` and the F-{259..270} contract YAMLs are markdown / YAML only; no rendered components inside. They are read by humans (auditor, planner, executor, P218 / P219 / P220 future planners) and parsed by CI scripts for forbidden-string and contract-baseline assertions. **Banned-lexicon enforcement applies to all doctrine prose** per CLAUDE.md "Banned lexicon" — zero-match required for `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in any doctrine surface. Suggested support response output (216-03 `lib/markos/saas/support/classifier.ts` + `kb-grounding.ts`) is also banned-lexicon-checked before any future safe-auto-response dispatch. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 216 emits no CSS, no JSX, no terminal output
beyond `node --test` format from preflight CLI scripts (the Node API
handlers emit JSON envelopes, not rendered markup; the four crons
write to `markos_agent_runs` and structured logs only). Every spacing,
typography, and color decision is deferred to the downstream phases
that will surface this health/churn/support/usage substrate. When
those phases ship, they MUST cite DESIGN.md v1.1.0 token canon
directly:

| Token canon citation chain | DESIGN.md v1.1.0 source |
|----------------------------|--------------------------|
| `--space-{none,xxs,xs,sm,md,lg,xl,xxl}` | `spacing.{none,xxs,xs,sm,md,lg,xl,xxl}` (8px base, on-grid only — 0/2/8/16/24/32/48/96) |
| `--font-mono` (JetBrains Mono) for headings + IDs (`subscription_id`, `health_score_id`, `intervention_id`, `ticket_id`, `chunk_id`, `signal_id`) + monetary code | `typography.h1..h4`, `typography.code-inline` |
| `--font-sans` (Inter) for body + lead + caption | `typography.body-md`, `typography.lead`, `typography.body-sm`, `typography.label-caps` |
| `--color-surface` (`#0A0E14` Kernel Black) page background; `--color-surface-raised` (`#1A1F2A` Process Gray) cards; `--color-surface-overlay` (`#242B38`) modals; `--color-border` (`#2D3441` Border Mist) hairlines; `--color-on-surface` (`#E6EDF3` Terminal White), `--color-on-surface-muted` (`#7B8DA6` Vault Slate), `--color-on-surface-subtle` (`#6B7785` Comment Gray) text; `--color-primary` (`#00D9A3` Protocol Mint) signal; `--color-primary-text` mint-as-text per D-09; `--color-primary-subtle` mint wash; `--color-error` (`#F85149`), `--color-warning` (`#FFB800`), `--color-success` (`#3FB950`), `--color-info` (`#58A6FF`) state colors | `colors.{surface,surface-raised,surface-overlay,border,on-surface,on-surface-muted,on-surface-subtle,primary,primary-text,primary-subtle,error,warning,success,info}` |
| `.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block` primitives | `styles/components.css` v1.1.0 |
| `--focus-ring-width: 2px` solid `var(--color-primary)` with `--focus-ring-offset: 2px`, never suppressed | `app/tokens.css` lines per DESIGN.md "Focus" |
| `prefers-reduced-motion` collapses transitions to 0ms; kernel-pulse status dot freezes at full opacity | DESIGN.md "Motion" |

Future surfaces consuming 216 substrate MUST honor the **213.4
carry-forward decisions** verbatim (D-08 token-only, D-09
mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature`
reserved, D-14 no `.c-table`, D-15 selective extraction). See the
four UI binding contracts below for load-bearing additions specific
to 216 surfaces.

---

## 213.4 Carry-Forward Decisions (D-08..D-15)

| Carry-forward decision | Future-surface enforcement for 216-consuming surfaces |
|-------------------------|------------------------------------------------------|
| **D-08** (token-only) | Every future 216 surface module CSS uses `var(--*)` tokens only — zero hex literals, zero hard-coded `font-size`/`font-weight`/`color`. Architecture-lock test asserts `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/(markos)/**/*.module.css` returns 0 in any 216-consuming surface. |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs ("Approve and send →", "Activate save offer →", "Recalculate health score →", "View intervention timeline →", "Open Approval Inbox →"), and `.c-chip-protocol` IDs (`subscription_id`, `health_score_id`, `intervention_id`, `ticket_id`, `chunk_id`, `signal_id`, `playbook_id`, `pricing_recommendation_id`, `vault_ref`, `connector_id`, `external_event_id`, `external_ticket_id`, `approval_id`, `task_id`, `agent_run_id`) use `--color-primary-text`. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| **D-09b** (`.c-notice` mandatory) | Every gating state in future 216 surfaces (health-score-not-yet-calculated, kb-grounding-confidence-below-threshold, support-response-pending-cs-approval, save-offer-pending-pricing, save-offer-pending-approval, retention-sweep-overdue, sentinel-active, future-phase-217-placeholder, future-phase-218-placeholder, future-phase-219-placeholder, future-phase-220-placeholder) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in any 216-consuming surface.** Health-score dashboard rows, support ticket list rows, KB grounding cards, churn intervention rows, save-offer modal cards, retention sweep rows, PII audit rows, growth-signal-preview rows ALL use `.c-card` default. The `.c-card--feature` variant remains reserved for hero panels in 404-workspace + 213.5 marketing only. |
| **D-14** (no `.c-table` primitive) | Future 216 health-score list, support ticket list, KB grounding list, churn intervention list, retention sweep list, PII class summary list, growth-signal preview list ALL use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 218+. |
| **D-15** (selective extraction) | Future 216-consuming components extract to `components/markos/tenant/` or `components/markos/admin/` only when reuse is proven across ≥2 surfaces. Recommended extracted components (when downstream phases ship): `<HealthScoreBadge />` (reused by dashboard + at-risk viewer + churn console + Task Board row), `<RiskBandBadge />` (reused by health dashboard + intervention timeline + Morning Brief), `<ClassifierChipRow />` (reused by support inbox + KB review modal + Approval Inbox row), `<KbGroundingPanel />` (reused by suggested response review + safe-auto-response audit), `<SaveOfferPricingBlock />` (reused by Approval Inbox row + churn console + sentinel preview), `<RetentionClassChip />` (reused by every PII-displaying surface across P217-P228), `<PIIRedactedField />` (reused everywhere a PII field is displayed). |

---

## Translation Gate Dissolutions (3+)

This section enumerates the upstream `<PlaceholderBanner>` variants
that 216 dissolves once the full P216 contract chain ships.

### 215 `billing_correction_approval` handoff_kind extension reused

215-UI-SPEC §Approval Inbox handoff filter introduced the 6th
literal `billing_correction_approval`. 216 extends this set with two
new literals:

- **7th literal: `support_response_approval`** — 216-03 `lib/markos/saas/support/response-approval.ts` `requestResponseApproval` calls `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` with `kind == 'saas_support_response_dispatch'`; routes through P208 Approval Inbox via this 7th handoff_kind literal. The `dispatchResponse` function UPDATEs `saas_support_tickets.response_dispatched_at` + `response_dispatch_method`; the DB-trigger `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` validates the approval gate at the database layer (defense-in-depth pair).
- **8th literal: `save_offer_approval`** — 216-04 `lib/markos/saas/churn/save-offer.ts` `requestSaveOffer` calls `buildApprovalPackage` with `kind == 'saas_churn_save_offer'`; routes through P208 Approval Inbox via this 8th handoff_kind literal. The `activateSaveOffer` function UPDATEs `saas_churn_interventions.offer_activated_at`; the DB-trigger `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` validates the approval gate AND the pricing-or-sentinel gate at the database layer (defense-in-depth pair).

The 4 P207 literals (`approval`, `recovery`, `follow_up`,
`manual_input`) + 5th P214 literal (`billing_charge_approval`) +
6th P215 literal (`billing_correction_approval`) + 7th P216 literal
(`support_response_approval`) + 8th P216 literal
(`save_offer_approval`) form the canonical 8-chip filter chain. P208
surfaces consume the 7th and 8th literals verbatim. Future
`<ApprovalInboxFilters />` extension MUST render exactly 8 filter
chips when 216 ships in production.

### 213-04 Public-Proof Boundary — 216 support intelligence is PRIVATE

213-04 §Public-Proof Boundary established that case-study claims
require official-grade evidence and that certain doctrine is
PRIVATE (never published as public proof). 216 support
intelligence inherits PRIVATE doctrine status:

- `saas_support_tickets.subject` / `description` / `sentiment` / `churn_signal_reason` / `topic_tags` / `kb_grounding_evidence` — NEVER published
- `product_usage_events.properties` / `user_id_external` / `account_id_external` — NEVER published
- `saas_churn_interventions.offer_details` / `outcome_jsonb` / `trigger_reason` — NEVER published
- `saas_health_scores.raw_facts` / `dimension_scores` / `recommended_action` — NEVER published

Future case-study editor surfaces enforce: any reference to a 216
health/support/intervention outcome renders the IDs
(`subscription_id`, `health_score_id`, `intervention_id`,
`ticket_id`) via `.c-chip-protocol` only; outcome content is
fetched via authenticated `data.export` mutation (P208 admin
extension), never embedded inline. The 213-04 banned-phrases
contract (`unlimited`, `instant`, `guaranteed`, `100%`,
`bank-grade`, `military-grade`) applies to any future case-study
referencing a 216 health-score lift or churn-save outcome.

### 212 ArtifactPerformanceLog learning-handoff — 216-05 anonymization seeds learning fixtures

212-UI-SPEC §ArtifactPerformanceLog established the learning
substrate. 216-05 `lib/markos/saas/privacy/learning-handoff.ts`
exports `anonymizeForLearning({rows, classification})`:

- **sensitive / highly_sensitive rows blocked entirely** — never leave the tenant boundary
- **pseudonymous rows hashed** — `user_id_external` SHA-256-hashed, `account_id_external` hashed
- **no_pii rows passed through** — directly consumable by P212 substrate

216 support response quality (`csat_score` + `first_response_at` +
`resolved_at` + `sla_breached`) and intervention outcome
(`outcome_jsonb` post-activation) feed P212 ArtifactPerformanceLog
via the anonymized handoff path — never via direct row
passthrough. P212 future learning admin surfaces consume the
anonymized output. The `<KbGroundingPanel />` component (when
extracted per D-15) MUST render the `kb_source_snippet` content
through the anonymization filter before display in any
cross-tenant context.

---

## Translation Gates Opened (4+)

This section enumerates the new `<PlaceholderBanner>` variants
that future surfaces MUST render until the relevant downstream
phase ships.

| Future surface (downstream consumer) | Placeholder variant | Owning future phase | 216 substrate dependency |
|--------------------------------------|---------------------|---------------------|--------------------------|
| Per-subscription health-score dashboard | `future_phase_217_health_dashboard_ui` | future P217+ admin extension | `saas_health_scores` + `score-calculator.ts` + `risk-bands.ts` + `api/v1/saas/health.js` GET endpoints + `api/cron/saas-health-score-refresh.js` |
| At-risk accounts viewer | `future_phase_217_at_risk_viewer` | future P217+ admin extension OR P208-03 Task Board extension | `get_at_risk_accounts` MCP tool + `saas_health_scores.risk_level IN ('at_risk', 'critical')` filter |
| 9 reserved growth handoff signal consumers (P218 ActivationDefinition + PQLScore + UpgradeTrigger; P218 ModeEligibility; P219 AccountExpansionProgram + ExpansionSignalScanner + ChurnSaveEscalation + CustomerMarketingProgram + ExpansionSaveBoundary; P220 CommunityProfile + PartnerSaveOffer) | `future_phase_218_growth_signal_consumer` (and P219 / P220 sibling variants) | P218 / P219 / P220 plan execution UPDATEs `growth_signal_map` rows | `growth_signal_map` table with 9 `planned_only=true` + `activated_at IS NULL` rows |
| Support ticket inbox with classifier badges | `future_phase_219_support_admin_ui` | future P219 admin extension | `saas_support_tickets` + `classifier.ts` + `support_kb_groundings` + `api/v1/saas/support.js` |
| KB-grounded suggested response review modal | `future_phase_219_support_admin_ui` (sibling) | future P219 admin extension OR P208-04 Approval Inbox extension | `kb-grounding.ts` + `response-approval.ts` + `support_kb_groundings.relevance_score` + 7th handoff_kind literal `support_response_approval` |
| Save-offer approval modal | `future_phase_220_churn_console` (sibling) | future P220 admin extension OR P208-04 Approval Inbox extension | `save-offer.ts` + `playbook-engine.ts` + `saas_churn_interventions.offer_details` + 8th handoff_kind literal `save_offer_approval` |
| Churn intervention timeline viewer | `future_phase_220_churn_console` | future P220 admin extension | `saas_churn_interventions` + `playbook-engine.ts` + `task-creator.ts` + `api/v1/saas/churn.js` |
| Product usage event browser | `future_phase_218_growth_signal_consumer` (sibling) | future P218 admin extension | `product_usage_events` + `event-taxonomy.ts` (7-category PLG taxonomy) + `health-rollup.ts` |
| PII redaction audit log viewer | `future_phase_217_pii_audit_log` | future SOC2 admin extension OR P208-04 Approval Inbox extension | `data_retention_classes` (15 rows: 5 P216 + 10 forward-looking) + `audit-views.ts` + `pii-redaction.ts` |
| Retention sweep timeline | `future_phase_217_pii_audit_log` (sibling) | future SOC2 admin extension | `v_retention_due` + `v_pii_class_summary` + `v_consent_status` views + `api/cron/saas-privacy-retention-sweep.js` outcomes |
| Health-score breakdown drilldown | `future_phase_217_health_dashboard_ui` (sibling) | future P217+ admin extension | `saas_health_scores.raw_facts` + `dimension_scores` + `confidence` + `evidence_refs` |
| Learning fixture grounding viewer | `future_phase_217_learning_admin_ui` | future P212 learning admin extension | `learning-handoff.ts` `anonymizeForLearning` output + P212 `markos_literacy_chunks` substrate |
| Risk band trend chart | `future_phase_217_health_dashboard_ui` (sibling) | future P217+ admin extension | `saas_health_scores.score_delta` + `previous_score` + `trend` (30-day window per `health-rollup.ts`) |
| Future growth handoff signal preview | `future_phase_218_growth_signal_consumer` / `future_phase_219_support_admin_ui` / `future_phase_220_churn_console` | P218 / P219 / P220 | 9 reserved `growth_signal_map` rows |
| Connector adapter status viewer | `future_phase_210_connector_status_ui` (P210 Recovery Center extension) | future P210 / P208-05 Recovery Center extension | `product_usage_connectors.is_active` + `last_synced_at` + `source_type` (8 source types: generic_webhook + 7 specific) |

---

## Inheritance Bindings (load-bearing)

This section is the **doctrine binding** for every future surface
that will render 216 substrate. Every approval, lifecycle, mutation,
pricing, classification, and grounding field rendered in any future
SaaS health/churn/support/usage surface MUST cite the upstream
contract verbatim. Auto-FAIL conditions: any field name re-derived
without citation; any state literal not enumerated below; any
approval gate that omits the 206 mutation-class binding; any save-
offer render that hard-codes a dollar literal or tier-name string;
any support-response render that bypasses the approval gate; any
PII display that violates §UI Binding Contract 4.

### From 206-UI-SPEC §Mutation-class doctrine

| Future surface element | 206 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Support response dispatch (CS-approved) | `mutation-class-policy.md` (206-02-01) — `external.send` root mutation class | `mutation_class == 'external.send'`, `default_approval_mode == single_approval` for support responses, `autonomy_ceiling`, `evidence_required == true` (KB grounding) | Every support response approval modal carries a `.c-chip-protocol` chip "Root: `external.send`" rendering the exact 206 literal |
| Save-offer + win-back-offer activation | `mutation-class-policy.md` — `billing.charge` root mutation class | `mutation_class == 'billing.charge'`, `default_approval_mode == dual_approval` for save_offer + win_back_offer (high-value retention), `single_approval` for engagement_deepening + ebr_scheduling + executive_outreach + champion_re_engagement + billing_recovery + expansion_conversation + account_brief, `autonomy_ceiling` per intervention type, `evidence_required == true` (Pricing Engine context OR sentinel) | Approval-mode chip `.c-badge--info` on every save-offer-row metadata; `.c-badge--warning` for save_offer (dual_approval); `.c-badge--info` for non-pricing interventions (single_approval) |
| Autonomy ceiling on `external.send` for support response | `mutation-class-policy.md`'s `autonomy_ceiling` field | When ceiling reached for `external.send` on at_risk/critical accounts, all auto-response action buttons are auto-blocked; UI renders `.c-notice c-notice--error` with `[block] Autonomy ceiling reached for external.send (at_risk/critical accounts)` | Always shown above the support response action menu when applicable |
| Autonomy ceiling on `billing.charge` for save-offer | `mutation-class-policy.md`'s `autonomy_ceiling` field | When ceiling reached for `billing.charge` on save_offer + win_back_offer, all save-offer action buttons are auto-blocked; UI renders `.c-notice c-notice--error` with `[block] Autonomy ceiling reached for billing.charge (save offers)` | Always shown above the save-offer action menu when applicable |
| Evidence-required gate for support responses | `mutation-class-policy.md`'s `evidence_required` flag | `evidence_required == true` for every support response; `kb_grounding_evidence` uuid[] FK + `response_grounding_confidence >= KB_CONFIDENCE_THRESHOLD` (default 0.7) is REQUIRED before approval CTA enables; below-threshold blocks auto-draft display per CONTEXT.md non-negotiable | Action button disabled until `response_grounding_confidence >= 0.7`; row evidence rail shows top-3 KB sources via `.c-chip-protocol` chips |
| Evidence-required gate for save-offers | `mutation-class-policy.md`'s `evidence_required` flag | `evidence_required == true` for every save_offer + win_back_offer; `pricing_recommendation_id IS NOT NULL OR offer_details::text LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` REQUIRED before `offer_activated_at` can be set per 216-04 `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` trigger | Activate button disabled until pricing context OR sentinel present + approval_id NOT NULL |
| PII audit-log export action | `mutation-class-policy.md` — `data.export` | "Export PII audit log" button binds to `data.export`; default approval mode `single_approval`; modal confirms scope (single tenant / date range / all retention classes) | `.c-button--secondary` action; opens `.c-modal` with reason field |
| Retention sweep export action | `mutation-class-policy.md` — `data.export` | "Export retention sweep results" button binds to `data.export`; reads sweep cron output | `.c-button--secondary` action |

### From 207-UI-SPEC §Orchestration substrate

| Future surface element | 207 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Health-score recalculation run timeline | `RunApiEnvelope` (207-01) | `run_id`, `agent_run_id`, `chain_id`, `status`, `started_at`, `completed_at`, `error_class` | Every health-score recalc with an associated agent run renders `<RunStatusBadge run_id={...}>` linked to the 207 run-detail surface; cron `saas-health-score-refresh.js` emits `AgentRun` kind='saas-health-score-refresh' |
| Intervention run timeline | `AgentRunEventType` (207-02) | `event_type` literals: `intervention_triggered`, `playbook_selected`, `task_created`, `save_offer_requested`, `save_offer_approved`, `save_offer_activated`, `intervention_completed` | Each intervention with associated agent runs renders the `AgentRunEventType` chain via `<EventTimeline>` recipe |
| Retention sweep run timeline | `RunApiEnvelope` (207-01) | `run_id`, `kind == 'saas-privacy-retention-sweep'`, sweep outcome counts (hard_delete + anonymize + tombstone) | Each daily retention sweep cron run emits AgentRun event consumed by future SOC2 admin |
| Approval-handoff link from support response to inbox | `ApprovalHandoffRecord` (207-04-01) | `run_id`, `handoff_kind == 'support_response_approval'` (216-03 extension; 7th literal), `approval_required == true`, `task_ref`, `reason`, `side_effect_kind == 'external.send'`, `target_system == 'email' \| 'chat' \| 'portal' \| 'social' \| 'phone' \| 'api' \| 'import'`, `created_at` | Each pending support response renders an "Open in Approval Inbox →" `.c-button--tertiary` mint-text link deep-linking to `/operations/approvals?handoff_kind=support_response_approval&task_ref={ticket_id}` |
| Approval-handoff link from save-offer to inbox | `ApprovalHandoffRecord` (207-04-01) | `run_id`, `handoff_kind == 'save_offer_approval'` (216-04 extension; 8th literal), `approval_required == true`, `task_ref`, `reason`, `side_effect_kind == 'billing.charge'`, `target_system == 'pricing_recommendation'`, `created_at` | Each pending save-offer renders an "Open in Approval Inbox →" `.c-button--tertiary` mint-text link deep-linking to `/operations/approvals?handoff_kind=save_offer_approval&task_ref={intervention_id}` |

### From 208-UI-SPEC §PARENT — Approval Inbox + Recovery Center + Task Board

| Future surface element | 208 contract source | Doctrine bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Approval Inbox handoff_kind filter chips | 208-04 §Approval Inbox handoff filter | 4 P207 literals + 5th P214 + 6th P215 + **7th P216 literal (`support_response_approval`)** + **8th P216 literal (`save_offer_approval`)** — total 8 chips | The `<ApprovalInboxFilters />` component MUST render exactly 8 filter chips when 216 ships; the 7th literal is consumed by 216-03 `requestResponseApproval`; the 8th literal is consumed by 216-04 `requestSaveOffer` |
| Approval Inbox routing for 216 support response | 208-04 §Item rendering | 7-step routing pattern (per 216-03 plan): (1) Connector imports ticket via `api/v1/saas/support/import` or `webhook/:connector_id` → (2) `importTicket` calls `classifyTicket` and INSERTs `saas_support_tickets` row → (3) AI agent calls `groundResponse` (KB grounding) and `requestResponseApproval` → (4) `agent_approval_packages` row inserted with `handoff_kind == 'support_response_approval'` → (5) P208 Approval Inbox displays via existing `/operations/approvals/page.tsx` → (6) Operator approves/rejects → (7) `dispatchResponse` UPDATEs `saas_support_tickets.response_dispatched_at + response_dispatch_method == 'approved' + approval_id` (DB-trigger validates) | The Approval Inbox row MUST render the 5 classifier dimensions as `.c-chip` rows (sentiment, intent, churn_signal, topic_tags, urgency_score) reading `saas_support_tickets.{sentiment, intent, churn_signal, topic_tags, urgency_score}` |
| Approval Inbox routing for 216 save-offer | 208-04 §Item rendering | 7-step routing pattern (per 216-04 plan; mirrors 215-05 billing-correction pattern): (1) Cron `saas-churn-intervention-trigger.js` scans at_risk/critical health-scores → (2) `selectPlaybook` matches trigger_condition → (3) `executePlaybookSteps` with `pricing_required=true` calls `requestSaveOffer` → (4) `requestSaveOffer` checks `hasPricingRecommendation` (P205 SOFT) and stamps either `pricing_recommendation_id` OR `PRICING_SENTINEL` → (5) `buildApprovalPackage` with `kind == 'saas_churn_save_offer'` inserts `agent_approval_packages` row with `handoff_kind == 'save_offer_approval'` → (6) P208 Approval Inbox displays via existing surface → (7) `activateSaveOffer` UPDATEs `saas_churn_interventions.offer_activated_at + approval_id` (DB-trigger validates) | The Approval Inbox row MUST render the intervention_type as `.c-badge--{warning if save_offer or win_back_offer else info}` chip + the pricing context block (see UI Binding Contract 3) |
| Recovery Center connector adapter status (future P208-05 extension) | 208-05 §Recovery Center substrate | `product_usage_connectors` rows where `is_active = false` OR `last_synced_at < now() - interval '24 hours'` (P210 substrate + 216-02 routing); 8 source_type values: `generic_webhook`, `posthog`, `segment`, `amplitude`, `mixpanel`, `heap`, `rudderstack`, `csv_import` | Future surface renders connector rows as `.c-card` with `.c-badge--warning` "Stale" chip OR `.c-badge--error` "Inactive" chip; source_type rendered as `.c-chip` |
| Task Board intervention task viewer | 208-03 §Task Board | `approval_tasks` rows where `task_kind == 'saas_churn_intervention'` per 216-04 `task-creator.ts`; priority per playbook (P1 critical / P2 at_risk + billing + champion + expansion + renewal / P3 watch) | Task Board renders intervention tasks at appropriate priority queue level; `.c-badge--error` "P1" + `[err]` glyph for critical; `.c-badge--warning` "P2" + `[warn]` glyph for at_risk; `.c-badge--info` "P3" + `[info]` glyph for watch |
| Morning Brief health/churn/support summary (future) | 208-02 §Morning Brief sections | `saas_health_scores` count by risk_level + open intervention count + open churn-signal ticket count for past 24h | Future P208 extension reads counts; renders `.c-card` brief item with `[info]`/`[warn]`/`[err]` glyph eyebrow |
| Weekly Narrative health/churn/support summary (future) | 208-06 §Weekly Narrative wins/risks | `saas_health_scores` trend rollup + intervention-resolved count + save-offer-activated count + retention-sweep-completed count for past 7d | Future P208 extension reads rollups |

### From 212-UI-SPEC §PARENT — Learning substrate

| Future surface element | 212 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| KB grounding for support responses | 212-04 §Learning fixture chunks | `markos_literacy_chunks` (P212 SOFT — graceful degrade if missing) + `support_kb_groundings.kb_source_type IN ('literacy_chunk', 'knowledge_article', 'previous_resolution', 'external_url')` + `relevance_score numeric(3,2)` | Future suggested-response review modal renders top-3 grounding sources as `.c-chip-protocol` chips with `chunk_id`; `relevance_score` rendered as `.c-badge--{success if >=0.8, info if 0.5-0.8, warning if <0.5}` |
| ArtifactPerformanceLog inheritance | 212-03 §ArtifactPerformanceLog | `csat_score` + `first_response_at` + `resolved_at` + `sla_breached` + intervention `outcome_jsonb` flow into P212 ArtifactPerformanceLog through `anonymizeForLearning` filter | Support response quality + intervention outcome metrics feed P212 learning admin surfaces (deferred); never via direct row passthrough |
| Learning-handoff anonymization | 212-04 §Cross-tenant learning anonymization | 216-05 `anonymizeForLearning({rows, classification})` — sensitive/highly_sensitive blocked; pseudonymous hashed; no_pii passthrough | All cross-tenant learning data traverses anonymization filter; P212 future surfaces consume anonymized output only |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| Future surface element | 213 contract source | Doctrine bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| 216 support intelligence is PRIVATE doctrine | 213-04 §Public-Proof Boundary | `subscription_id`, `health_score_id`, `intervention_id`, `ticket_id`, `chunk_id`, `signal_id` UUIDs may be cited in case-study claims; outcome content (raw subject, description, sentiment, churn_signal_reason, offer_details, raw_facts) is NEVER published | Future case-study editor surfaces enforce: any reference to a 216 outcome renders the UUID via `.c-chip-protocol` only; outcome content is fetched via authenticated `data.export` mutation |
| Banned-phrases contract carries forward | 213-04 §Public-Proof banned phrases | `unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade` are banned in any case-study referencing a 216 health-score lift or churn-save outcome | CI assertion enforces zero-match in all case-study markdown referencing 216 IDs |
| 213-05 go/no-go gate | 213-05 §214-217 go/no-go decision | P214-P217 SaaS Suite Activation gate MUST flip to `green` before any 216-consuming surface ships in production; until then, future surfaces render `<PlaceholderBanner variant="future_phase_213_tenant0">` | The 216 backend substrate ships unconditionally (gate not required for backend-only); UI consumers gate on 213-05 |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| Future surface element | 214 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| `saas_health_scores.subscription_id` FK | 214-02 §saas_subscriptions schema | `saas_subscriptions.subscription_id` PK | Every 216 health score MUST FK to a 214 subscription; `<SaaSSubscriptionsTable />` extracted component (214-06) reads 216 health rows via subscription join |
| `saas_churn_interventions.subscription_id` FK | 214-02 §saas_subscriptions schema | `saas_subscriptions.subscription_id` PK | Every 216 intervention MUST FK to a 214 subscription |
| `business_type != 'saas'` gating contract | 214-06 §Surface gating contract | `business_type != 'saas'` tenants render single `.c-notice c-notice--info` page and never reach activation panel | Future 216 admin surfaces inherit the same gating: tenants without an active SaaS Suite activation (per 214 `saas_suite_activations.status`) MUST NOT see health dashboard, support inbox, churn console, or PII audit |
| `tenant_safe_auto_response_enabled` flag | 214 (216-03 ALTER) | Boolean column on `saas_suite_activations` set ONLY by operator (not AI agent); enables `response_dispatch_method == 'safe_auto_response'` path on `saas_support_tickets` UPDATE | Future safe-auto-response toggle UI surfaces require admin role + audit log emission on every flag mutation; toggle renders as `.c-button--destructive` with verbatim copy "Enable safe auto-response (irreversible without re-approval)" + `<.c-modal>` confirmation |
| `<SaaSSubscriptionsTable />` extracted reuse | 214-06 §D-15 selective extraction | Component lives at `components/markos/tenant/SaaSSubscriptionsTable.tsx` | Future 216 health-score viewer (per future P217+ admin extension) reuses `<SaaSSubscriptionsTable />` verbatim with 216 health-score join; per-row health badge composed via `<HealthScoreBadge />` extraction (see D-15 above) |

### From 215-UI-SPEC §PARENT — SaaS Billing

| Future surface element | 215 contract source | Field set bound verbatim | Usage |
|------------------------|---------------------|--------------------------|-------|
| Save-offer pricing inherits 215 sentinel discipline | 215-UI-SPEC §Sensitive Credential Handling + Sentinel | `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted by 216-04 `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` DB-trigger when `pricing_recommendation_id IS NULL AND offer_details::text LIKE '%MARKOS_PRICING_ENGINE_PENDING%'`; mirrors 215-05 `saas_billing_corrections.offer_details` discipline verbatim | Future save-offer approval modal renders pricing block via `<Money fromPricingRecommendation={pr_id} />` recipe XOR sentinel literal (see UI Binding Contract 3) |
| Save-offer approval modal pattern | 215-UI-SPEC §215-05 billing-correction approval modal | Reuses 215 billing-correction approval modal pattern: `mutation_class == 'billing.charge'`, `default_approval_mode == dual_approval`, `evidence_required == true`, reason capture ≥20 chars, audit-log emission on activation | Future save-offer modal mirrors `<BillingCorrectionRow />` extracted component pattern; per-row chip set, action menu, evidence rail; recommended extraction: `<ChurnSaveOfferRow />` reuses across Approval Inbox + churn console |
| Mutation-class binding extends to save_offer | 215 §billing.charge root | `billing.charge` root mutation class covers refund + credit_note + write_off + discount + invoice_correction (215) AND save_offer + win_back_offer (216) | Every save-offer activation modal carries a `.c-chip-protocol` chip "Root: `billing.charge`" rendering the exact 206 literal (verbatim from 215) |
| Sensitive credential handling discipline extends to PII | 215-UI-SPEC §Sensitive Credential Handling | The 6-layer defense-in-depth posture (storage → DB-trigger → MCP sanitization → log redaction → prompt-injection defense → UI surface enforcement) extends to 216 PII handling | Future PII-displaying surfaces honor verbatim: `[redacted]` placeholder for PII fields; `pii_classification` ENUM bound to badge variant; clipboard copy block on PII; audit-log every PII view (see UI Binding Contract 4) |

---

## UI Binding Contract 1 — Health Score (load-bearing for future surfaces)

**This section is load-bearing for every future surface that
consumes 216 health-score substrate.** Violation is auto-FAIL.

### 5-dimension breakdown rendering

Every future health-score detail surface MUST render the 5
dimensions per `lib/markos/saas/health/contracts.ts`
`HEALTH_DIMENSIONS = ['usage', 'support', 'billing', 'engagement', 'relationship']` const array. Each dimension is rendered as a `.c-badge`
row with weighted-sum contribution:

| Dimension | Default Weight | `.c-badge` variant | Render example |
|-----------|---------------|---------------------|----------------|
| `usage` | 0.30 | `.c-badge--info` | `[info] Usage 0.30 → 24/30 (80%)` |
| `support` | 0.20 | `.c-badge--info` | `[info] Support 0.20 → 16/20 (80%)` |
| `billing` | 0.20 | `.c-badge--info` | `[info] Billing 0.20 → 18/20 (90%)` |
| `engagement` | 0.15 | `.c-badge--info` | `[info] Engagement 0.15 → 12/15 (80%)` |
| `relationship` | 0.15 | `.c-badge--info` | `[info] Relationship 0.15 → 12/15 (80%)` |

The default weights are LOCKED from SaaS Suite Canon and
`DEFAULT_WEIGHTS = {usage:0.30, support:0.20, billing:0.20, engagement:0.15, relationship:0.15}`.
Tenant-level weight overrides are read from
`saas_suite_activations.health_score_weights JSONB`; when present,
the override values render in place of defaults but the default
chip set remains visible as a subtle `.c-chip` row eyebrow.

### 4 risk bands rendering

Every future health-score-consuming surface MUST render the 4
risk bands per `lib/markos/saas/health/risk-bands.ts` `RISK_BANDS`
array. Each band MUST pair with a bracketed glyph (D-09 / DESIGN.md
state-color rule: state color is never the only signal):

| Band | Score Range | `.c-badge` variant | Bracketed glyph | Default Action |
|------|-------------|---------------------|-----------------|----------------|
| `healthy` | 80-100 | `.c-badge--success` | `[ok]` | Standard lifecycle touches only |
| `watch` | 60-79 | `.c-badge--info` | `[info]` | Proactive CS check-in |
| `at_risk` | 40-59 | `.c-badge--warning` | `[warn]` | Save offer eligible (approval required) |
| `critical` | 0-39 | `.c-badge--error` | `[err]` | P1 task to CS lead, automation paused, human within 24h |

The recommended extracted component `<RiskBandBadge band={...} />`
(per D-15) MUST emit BOTH the badge variant AND the bracketed glyph
in a single render — never one without the other.

### Health-score ID + subscription ID chip rendering

The `health_score_id` and `subscription_id` UUIDs are rendered via
`<.c-chip-protocol>` (D-09 mint-as-text); the chip text contains
the UUID surrounded by `[ ]` per `.c-chip-protocol::before/::after`
content rules; never displayed as fill. Recommended extracted
component: `<SubscriptionHealthLink subscription_id={...} health_score_id={...} />`
renders both as protocol chips with deep-link to the per-subscription
health-score detail surface.

### Trend rendering

The `trend` column on `saas_health_scores` is one of 4 literals:
`improving` / `stable` / `declining` / `insufficient_data`. Future
surfaces render trend as text-only chip (D-09 mint-as-text rule):

| Trend | Chip variant | Bracketed glyph |
|-------|--------------|-----------------|
| `improving` | `.c-chip--mint` (mint text) | `[up]` |
| `stable` | `.c-chip` default | `[flat]` |
| `declining` | `.c-chip` with `--color-warning` text | `[down]` |
| `insufficient_data` | `.c-chip` with `--color-on-surface-subtle` text | `[—]` |

A 30-day trend mini-chart sparkline reading
`previous_score → score` deltas is **deferred**; future spec
authored when sparkline recipe lands in DESIGN.md. Until then,
trend label + bracketed glyph is the only trend indicator.

### Refresh action + recalc CTA

Future health-score detail surfaces MUST render two recipes:

- **Last refresh notice**: `.c-notice c-notice--info` reading verbatim "[info] Health score recalculated {ago} (calculation_version v1)" using `calculated_at` + `calculation_version` columns
- **Manual recalc CTA**: `.c-button--secondary` with copy "Recalculate health score" — invokes `api/cron/saas-health-score-refresh.js` synchronous endpoint OR queues an AgentRun event; on completion emits a transient `.c-notice c-notice--success` "[ok] Health score recalculated"

The recalc CTA does NOT bypass the `HEALTH_SCORE_REQUIRES_RAW_FACTS`
DB-trigger; if raw_facts is incomplete, the trigger raises EXCEPTION
and the CTA renders `.c-notice c-notice--error` with verbatim
"[err] Health score raw facts incomplete — connector data required".

---

## UI Binding Contract 2 — Support Response Approval (load-bearing)

**This section is load-bearing for every future surface that
consumes 216 support-response substrate.** Violation is auto-FAIL.

### Suggested response panel renders 5 classifier dimensions

Every future support response review modal MUST render the 5
classifier output dimensions per `lib/markos/saas/support/classifier.ts`
`classifyTicket` output as `.c-chip` rows:

| Dimension | Classifier output | Chip variant | Rendering |
|-----------|-------------------|--------------|-----------|
| `sentiment` | `'positive' \| 'negative' \| 'neutral' \| 'frustrated'` | `.c-chip` with state-aware text color (positive=success, negative=warning, frustrated=error, neutral=default) + bracketed glyph | `[ok] Sentiment: positive` / `[warn] Sentiment: negative` / `[err] Sentiment: frustrated` / `Sentiment: neutral` |
| `intent` | `'get_help' \| 'report_bug' \| 'request_feature' \| 'complaint' \| 'cancel' \| 'upgrade' \| 'billing_dispute'` | `.c-chip` default + bracketed glyph for high-risk intents (`[err]` for cancel/complaint, `[ok]` for upgrade) | `[err] Intent: cancel` / `Intent: get_help` |
| `churn_signal` | `boolean` (true when intent IN ('cancel','complaint') OR urgency_score > 0.8) | `.c-badge--{error if true, info if false}` | `.c-badge--error [err] Churn signal: true` |
| `topic_tags` | `text[]` (multi-tag array) | `.c-chip` per tag in horizontal stack | `[#] billing` `[#] outage` `[#] api` |
| `urgency_score` | `numeric(3,2)` 0.00-1.00 | `.c-badge--{error if >0.8, warning if 0.5-0.8, info if <0.5}` | `[warn] Urgency: 0.65` |

Recommended extracted component:
`<ClassifierChipRow ticket={...} />` renders all 5 dimensions in
a single horizontal flex row.

### KB grounding sources rendering

Every suggested response review modal MUST render the top-3 KB
grounding sources per `lib/markos/saas/support/kb-grounding.ts`
`groundResponse` output. Each source rendered as a card row with:

- **Source ID chip**: `<.c-chip-protocol>` rendering `chunk_id` (D-09 mint-as-text)
- **Source type badge**: `.c-badge--{info if literacy_chunk, success if knowledge_article, default if previous_resolution, warning if external_url}`
- **Relevance score badge**: `.c-badge--{success if >=0.8, info if 0.5-0.8, warning if <0.5}` rendering `relevance_score`
- **Snippet preview**: `.c-code-inline` rendering `kb_source_snippet` (truncated to 280 chars)

Recommended extracted component:
`<KbGroundingPanel ticket_id={...} groundings={...} />` renders
all 3 sources + the aggregate `response_grounding_confidence`
score as a `.c-notice c-notice--{success if >=KB_CONFIDENCE_THRESHOLD, warning if below}`
banner reading verbatim "[ok] KB grounding confidence: {score}
(threshold: {KB_CONFIDENCE_THRESHOLD})" or "[warn] KB grounding
confidence below threshold — auto-draft blocked".

### CS approval CTA + reason capture

Future support response review modal MUST render the CS approval
CTA per 216-03 `lib/markos/saas/support/response-approval.ts`
`requestResponseApproval` + `dispatchResponse`:

- **Primary CTA**: `.c-button--primary` with verbatim copy "Approve and send" — invokes `dispatchResponse` which UPDATEs `saas_support_tickets.response_dispatched_at` + `response_dispatch_method == 'approved'` + `approval_id`. The DB-trigger `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` validates the gate at the database layer.
- **Reject CTA**: `.c-button--secondary` with copy "Reject and capture reason" — opens `<.c-modal>` reason capture; reason ≥20 chars REQUIRED; UPDATEs the approval_packages row to status='rejected'.
- **Edit + resubmit CTA**: `.c-button--tertiary` mint-text link "Edit suggested response →" — opens inline edit; on save, re-runs `groundResponse` to recompute `response_grounding_confidence`; if confidence drops below threshold, primary CTA disables.

The primary CTA is DISABLED when:
1. `response_grounding_confidence < KB_CONFIDENCE_THRESHOLD` (default 0.7) — render `.c-notice c-notice--warning` "[warn] KB grounding confidence below threshold — review and edit"
2. `approval_id IS NOT NULL` AND `response_dispatched_at IS NOT NULL` — already dispatched
3. Tenant autonomy ceiling reached for `external.send` on at_risk/critical accounts

### Safe auto-response toggle gating

The `saas_suite_activations.tenant_safe_auto_response_enabled`
flag is a per-tenant operator-only setting (not AI agent
controllable). Future admin surface for this toggle:

- **Toggle UI**: `.c-button--destructive` with verbatim copy "Enable safe auto-response (irreversible without re-approval)"
- **Confirmation modal**: `<.c-modal>` reading verbatim "[block] Safe auto-response will dispatch CS responses without per-ticket review when KB grounding confidence ≥ threshold. This setting is operator-only; AI agents cannot toggle. Reason capture ≥50 chars required."
- **Reason field**: `.c-input` with required pattern minLength=50; emits `markos_audit_log_hash_chain` entry on every flag mutation
- **Disable path**: same destructive-button posture; reason ≥50 chars

When the flag is `true`, the support response dispatch path
allows `response_dispatch_method == 'safe_auto_response'` AND
`approval_id IS NULL` simultaneously (DB-trigger accepts this
combination); when `false`, only the approval path is allowed.

### Banned-lexicon zero-match enforcement

Suggested response output (216-03 `classifier.ts` + `kb-grounding.ts`
output) is banned-lexicon-checked **before any future safe-auto-
response dispatch**. The 19 banned tokens (`synergy`, `leverage`,
`empower`, `unlock`, `transform`, `revolutionize`, `supercharge`,
`holistic`, `seamless`, `cutting-edge`, `innovative`,
`game-changer`, `next-generation`, `world-class`, `best-in-class`,
`reimagine`, `disrupt`, `just` as softener) + zero exclamation
points enforced at zero-match. CI assertion
`scripts/marketing-loop/check-banned-lexicon.mjs` runs against
every persisted suggested response BEFORE dispatch via cron OR
synchronous endpoint; violation blocks dispatch and emits
`.c-notice c-notice--error` "[err] Suggested response contains
banned lexicon — review and edit before dispatch".

---

## UI Binding Contract 3 — Save Offer Approval (load-bearing)

**This section is load-bearing for every future surface that
consumes 216 save-offer substrate. Reuses 215 billing-correction
approval modal pattern verbatim.** Violation is auto-FAIL.

### 215 billing-correction approval modal pattern reuse

Future save-offer approval modal MUST follow 215-UI-SPEC
§215-05 billing-correction approval modal pattern:

- **Mutation class**: `billing.charge` (per 206-UI-SPEC mutation-class doctrine)
- **Default approval mode**: `dual_approval` for save_offer + win_back_offer; `single_approval` for non-pricing interventions
- **Evidence required**: `pricing_recommendation_id IS NOT NULL` OR `offer_details::text LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` (sentinel)
- **Reason capture**: ≥20 chars REQUIRED before approval
- **Audit log on activation**: emit `saas_billing_events`-equivalent row OR direct `markos_audit_log_hash_chain` entry with `event_type == 'save_offer_activated'` + `offer_details` + `pricing_recommendation_id` + `actor_id`

Recommended extracted component:
`<ChurnSaveOfferRow intervention={...} />` reuses across:
1. Approval Inbox row rendering (P208-04 extension)
2. Churn console queue (future P220 admin)
3. Per-subscription churn timeline drilldown (future P217+ admin)

### Pricing context block rendering

The pricing context block on every save-offer modal MUST render
EITHER the Pricing Engine recommendation OR the sentinel — never
hard-coded literals:

```
Pricing block (XOR pattern):

  Path A (P205 Pricing Engine landed):
    <Money fromPricingRecommendation={pr_id} />
      → renders amount + currency + discount % from
        pricing_recommendations.{amount, currency, discount_pct}
      → emits .c-chip-protocol "Recommendation: {pr_id}"

  Path B (P205 not yet landed):
    <PricingSentinelBadge />
      → renders verbatim {{MARKOS_PRICING_ENGINE_PENDING}}
      → renders .c-notice c-notice--warning
        "[warn] Pricing Engine recommendation pending — sentinel active"
      → save offer activation BLOCKED until pricing context lands
        (DB-trigger CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL)
```

Future surfaces MUST render exactly one of Path A or Path B —
never both, never neither.

### Discount percentage rendering

When Path A is active, the `discount_pct` from the Pricing Engine
recommendation is rendered as a `.c-badge`:

| `discount_pct` | `.c-badge` variant | Rationale |
|----------------|---------------------|-----------|
| `> 20%` | `.c-badge--warning` | High-discount save offers escalate dual_approval |
| `≤ 20%` | `.c-badge--info` | Standard discount tier |

The discount badge is rendered inline with the pricing context
block; it does not replace the `<Money />` recipe but supplements
it.

### Reason capture (≥20 chars)

The reason field on save-offer approval MUST capture ≥20 chars
before the primary CTA enables. The reason is persisted to
`saas_churn_interventions.outcome_jsonb.approval_reason` and
emitted in the audit log entry on activation.

### Audit log on activation

Every save-offer activation MUST emit a `markos_audit_log_hash_chain`
entry per CLAUDE.md foundation-substrate audit chain rule:

```
event_type: 'save_offer_activated'
payload:
  intervention_id: <uuid>
  subscription_id: <uuid>
  intervention_type: 'save_offer' | 'win_back_offer'
  offer_details: <jsonb> (Pricing Engine context OR sentinel)
  pricing_recommendation_id: <uuid> OR null
  approval_id: <uuid>
  actor_id: <user_id of approver>
  approved_at: <timestamptz>
  hash_chain_prev_id: <previous audit row id>
  hash: SHA-256(payload + hash_chain_prev_id)
```

Future audit-log viewer surfaces (P208 admin extension or future
SOC2 admin) read these rows for compliance evidence; the
`hash_chain_prev_id` + `hash` columns enforce tamper-evidence per
the 82_markos_audit_log_hash_chain.sql foundation migration.

### Activate CTA + DB-trigger gate

The activate CTA on save-offer modal:

- **Primary CTA**: `.c-button--primary` with verbatim copy "Activate save offer" — invokes `activateSaveOffer` which UPDATEs `saas_churn_interventions.offer_activated_at + approval_id`. The DB-trigger `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` validates the gate at the database layer (defense-in-depth pair).
- **Reject CTA**: `.c-button--secondary` with copy "Reject save offer" — opens `<.c-modal>` reason capture; reason ≥20 chars; UPDATEs `saas_churn_interventions.status == 'rejected'`.
- **CTA disabled** when:
  1. `pricing_recommendation_id IS NULL AND offer_details::text NOT LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` — render `.c-notice c-notice--error` "[err] Pricing context required (recommendation OR sentinel)"
  2. `approval_id IS NULL` — render `.c-notice c-notice--warning` "[warn] Approval required"
  3. Tenant autonomy ceiling reached for `billing.charge` on save offers

---

## UI Binding Contract 4 — PII Redaction + Retention (load-bearing)

**This section is load-bearing for every future surface that
displays 216 PII fields OR consumes 216 retention class
substrate. Inherits 215 sensitive credential handling discipline
extended for PII.** Violation is auto-FAIL.

### Allowed display fields by `pii_classification` ENUM

The `pii_classification` ENUM (216-01 migration 112) has 5 values:
`no_pii` / `pseudonymous` / `personal` / `sensitive` /
`highly_sensitive`. Every future PII-displaying surface MUST honor
the rendering rule per classification:

| `pii_classification` | Display rule | `.c-badge` variant |
|----------------------|--------------|---------------------|
| `no_pii` | Render value directly (no redaction) | `.c-badge--success` "[ok] no_pii" |
| `pseudonymous` | Render hash or external ID via `.c-chip-protocol` (D-09 mint-as-text); never plaintext user identity | `.c-badge--info` "[info] pseudonymous" |
| `personal` | Render `[REDACTED]` placeholder via `.c-code-inline` + `--color-on-surface-subtle`; never display content | `.c-badge--info` "[info] personal" |
| `sensitive` | Render `[REDACTED]` placeholder; never display content; access requires admin role + audit log | `.c-badge--warning` "[warn] sensitive" |
| `highly_sensitive` | Render `[REDACTED]` placeholder; never display content; access requires admin role + dual-approval gate + audit log | `.c-badge--error` "[err] highly_sensitive" |

Recommended extracted component:
`<PIIRedactedField field_name={...} pii_classification={...} value={...} />`
emits the correct rendering per classification verbatim. The
component MUST never expose `value` directly to children; it MUST
render the placeholder for `personal`/`sensitive`/`highly_sensitive`
and emit a `saas_billing_events`-equivalent audit row on every
view (defense-in-depth with server-side log redaction).

### Retention class chip rendering

The `retention_class` FK column on every PII-containing 216 table
references `data_retention_classes.class_key` (15 known classes:
5 P216 from migration 112 + 10 forward-looking from migration 116).
Future PII-displaying surfaces render the retention class as a
`.c-chip-protocol` chip (D-09 mint-as-text):

```
<.c-chip-protocol>
  retention_class: support_text (730d, anonymize)
</.c-chip-protocol>
```

Recommended extracted component:
`<RetentionClassChip class_key={...} />` reads
`data_retention_classes.{display_name, retention_days, deletion_method, pii_classification}`
and renders the human-readable retention period via the chip.

### Retention sweep timeline rendering

The 3 audit views (`v_retention_due` / `v_pii_class_summary` /
`v_consent_status`) feed future SOC2 admin retention sweep
timeline surfaces. Rendering rules:

- **`v_retention_due` (rows past `retention_until` awaiting sweep)**: render as `.c-notice c-notice--warning` "[warn] {N} rows overdue for retention sweep" with table of rows below; each row renders `<RetentionClassChip />` + `[time] retention_until - now()` overdue duration
- **`v_pii_class_summary` (per-tenant PII class counts)**: render as `.c-card` rows with `.c-badge` per pii_classification + count
- **`v_consent_status` (per-customer retention class summary)**: render as `.c-card` rows with `<.c-chip-protocol>` customer_id + `<RetentionClassChip />` array + soonest expiry timestamp

Completed retention sweeps render as `.c-notice c-notice--info`
"[info] Retention sweep completed {ago} ({N} hard_delete + {M}
anonymize + {K} tombstone)" reading the cron AgentRun event
output.

### Audit-log every PII view

Every render of a PII-displaying surface MUST emit a `saas_billing_events`-equivalent row (or direct `markos_audit_log_hash_chain`
entry) with:

```
event_type: 'pii_view'
payload:
  actor_id: <user_id>
  table_name: 'saas_support_tickets' | 'product_usage_events' | 'saas_churn_interventions'
  row_id: <uuid>
  retention_class: <text>
  pii_classification: <enum>
  displayed_fields: [...field names...]
  hash_chain_prev_id: <previous audit row id>
  hash: SHA-256(payload + hash_chain_prev_id)
```

The audit emit happens server-side in the API handler that serves
the PII metadata, NOT client-side. Future API extensions for
`api/v1/saas/{support,usage,churn}.js` MUST add this audit emit
before returning PII rows to the client.

### `data.export` mutation-class binding

Future PII audit-log export + retention sweep export actions
bind to `data.export` mutation class per 206-UI-SPEC:

- **Export PII audit log**: `.c-button--secondary` with copy "Export PII audit log" — opens `<.c-modal>` with reason field + scope selector (single tenant / date range / specific retention class) + recipient (downloads via authenticated link or email)
- **Export retention sweep results**: `.c-button--secondary` with copy "Export retention sweep results" — same modal pattern; reads cron AgentRun output

Both actions emit `agent_approval_packages` row with
`mutation_class == 'data.export'` + `default_approval_mode ==
'single_approval'` (per 206); routes through P208 Approval Inbox
via existing `approval` handoff_kind literal.

### Clipboard copy block on PII displays

`onCopy` event handler MUST `preventDefault()` for any DOM node
containing a PII display per 215-UI-SPEC §B-4 verbatim. The
`<PIIRedactedField />` component exposes `onCopy` interceptor;
the parent container with full row metadata MUST NOT be copyable
as a single block. The `<.c-chip-protocol>` chip itself MAY be
copied (it contains only public IDs); PII content is never
copyable.

---

## Downstream UI Inheritance Map (future surfaces consuming 216 contracts)

This is the forward-looking inventory of every future UI surface
that will consume 216 substrate. Each row carries: surface name,
owning future phase, 216 substrate dependency, mutation-class
binding (if applicable), placeholder banner posture (until owning
phase ships).

| Future surface | Owning future phase | 216 substrate consumed | Mutation-class binding | Placeholder until owning phase ships |
|----------------|---------------------|-------------------------|------------------------|---------------------------------------|
| Health-score dashboard per-subscription | future P217+ admin extension | `saas_health_scores` + `score-calculator.ts` + `risk-bands.ts` + `api/v1/saas/health.js` | `data.export` for export | `<PlaceholderBanner variant="future_phase_217_health_dashboard_ui">` |
| At-risk accounts viewer (P208-03 Task Board extension via intervention task type) | existing P208-03 Task Board (216-04 task-creator already routes; rendering deferred) | `saas_health_scores.risk_level IN ('at_risk', 'critical')` + `task_creator.ts` task_kind == 'saas_churn_intervention' | n/a (read-only on Task Board) | **NO placeholder needed** — P208 Task Board renders intervention tasks at appropriate priority queue level via existing surface; row badge composition deferred to future P208 admin extension via `<HealthScoreBadge />` extraction |
| Support ticket inbox with classifier badges | future P219 admin extension | `saas_support_tickets` + `classifier.ts` + `support_kb_groundings` + `api/v1/saas/support.js` | n/a (read-only inbox); `external.send` for response dispatch (separate modal) | `<PlaceholderBanner variant="future_phase_219_support_admin_ui">` |
| KB-grounded suggested response review modal (P208-04 Approval Inbox extension via 7th literal) | future P208-04 Approval Inbox extension | `kb-grounding.ts` + `response-approval.ts` + `support_kb_groundings.relevance_score` + 7th handoff_kind literal `support_response_approval` | `external.send` (root); `default_approval_mode == single_approval` | Existing P208 Approval Inbox renders the 7th `support_response_approval` filter chip; row rendering deferred to future extension; `<PlaceholderBanner variant="future_phase_219_support_admin_ui">` |
| Save-offer approval modal (P208-04 Approval Inbox extension via 8th literal reusing 215 billing-correction pattern) | future P208-04 Approval Inbox extension | `save-offer.ts` + `playbook-engine.ts` + `saas_churn_interventions.offer_details` + 8th handoff_kind literal `save_offer_approval` | `billing.charge` (root); `default_approval_mode == dual_approval` for save_offer + win_back_offer | Existing P208 Approval Inbox renders the 8th `save_offer_approval` filter chip; row rendering deferred to future extension; `<PlaceholderBanner variant="future_phase_220_churn_console">` |
| Churn intervention timeline viewer | future P220 admin extension | `saas_churn_interventions` + `playbook-engine.ts` + `task-creator.ts` + `api/v1/saas/churn.js` | `data.export` for timeline export | `<PlaceholderBanner variant="future_phase_220_churn_console">` |
| Product usage event browser | future P218 admin extension | `product_usage_events` + `event-taxonomy.ts` + `health-rollup.ts` | n/a (read-only) | `<PlaceholderBanner variant="future_phase_218_growth_signal_consumer">` |
| PII redaction audit log viewer (P208-04 Approval Inbox or future SOC2 admin) | future SOC2 admin extension OR P208 admin extension | `data_retention_classes` (15 rows) + `audit-views.ts` + `pii-redaction.ts` + `markos_audit_log_hash_chain` | `data.export` for audit log export | `<PlaceholderBanner variant="future_phase_217_pii_audit_log">` |
| Retention sweep timeline (future SOC2 admin) | future SOC2 admin extension | `v_retention_due` + `v_pii_class_summary` + `v_consent_status` views + `api/cron/saas-privacy-retention-sweep.js` outcomes | `data.export` for sweep export | `<PlaceholderBanner variant="future_phase_217_pii_audit_log">` (sibling) |
| Health-score breakdown drilldown (future tenant settings) | future P217+ admin extension | `saas_health_scores.raw_facts` + `dimension_scores` + `confidence` + `evidence_refs` | n/a (read-only) | `<PlaceholderBanner variant="future_phase_217_health_dashboard_ui">` (sibling) |
| Learning fixture grounding viewer (P212 future learning admin extension) | future P212 learning admin extension | `learning-handoff.ts` `anonymizeForLearning` output + P212 `markos_literacy_chunks` substrate | n/a (read-only); `data.export` for learning fixture export | `<PlaceholderBanner variant="future_phase_217_learning_admin_ui">` |
| Risk band trend chart (future tenant ops dashboard) | future P217+ admin extension | `saas_health_scores.score_delta` + `previous_score` + `trend` (30-day window per `health-rollup.ts`) | n/a (read-only) | `<PlaceholderBanner variant="future_phase_217_health_dashboard_ui">` (sibling) |
| Future growth handoff signal preview (P218/P219/P220 future surfaces) | P218 / P219 / P220 plan execution UPDATEs `growth_signal_map` rows | 9 reserved `growth_signal_map` rows | n/a (read-only doctrine surface) | `<PlaceholderBanner variant="future_phase_218_growth_signal_consumer">` / sibling P219 / P220 variants |
| Connector adapter status viewer (P210 Recovery Center extension) | future P210 / P208-05 Recovery Center extension | `product_usage_connectors.is_active` + `last_synced_at` + `source_type` (8 source types) | `connector.mutate` for retry/replay action | `<PlaceholderBanner variant="future_phase_210_connector_status_ui">` |

---

## Spacing Scale

Not applicable — Phase 216 ships zero CSS. When future
216-consuming surfaces ship, they MUST adopt the DESIGN.md v1.1.0
8px scale: `--space-{none,xxs,xs,sm,md,lg,xl,xxl}` (multiples of
0/2/8/16/24/32/48/96).

---

## Typography

Not applicable — Phase 216 ships zero CSS. When future
216-consuming surfaces ship, they MUST adopt the DESIGN.md v1.1.0
two-typeface rule: JetBrains Mono (display + headings + IDs +
code) + Inter (body + UI). No third typeface.

---

## Color

Not applicable — Phase 216 ships zero CSS. When future
216-consuming surfaces ship, they MUST adopt the DESIGN.md v1.1.0
60/30/10 split + Protocol Mint as the single CTA / focus signal
(<5% of any composition; never as fill on surfaces larger than a
button or chip; never as the only signal — pair with bracketed
glyph per state-color rule).

---

## Copywriting Contract

Not applicable for end-user surfaces — Phase 216 ships zero
copywriting for end-user UI. CLI script stdout from
`scripts/preconditions/216-{01..06}-check-upstream.cjs` follows
the DESIGN.md v1.1.0 "CLI output" rule: bracketed glyphs only
(`[ok]`, `[warn]`, `[err]`, `[block]`, `[info]`), no emoji, no
ANSI gradients, terse engineering prose with zero banned-lexicon
matches.

When future 216-consuming surfaces ship copywriting, they MUST
honor the verbatim copy strings declared in the four UI binding
contracts above:

- **Health score recalc CTA**: "Recalculate health score"
- **Health score raw facts incomplete error**: "[err] Health score raw facts incomplete — connector data required"
- **Support response approve CTA**: "Approve and send"
- **Support response reject CTA**: "Reject and capture reason"
- **Support response edit CTA**: "Edit suggested response →"
- **KB grounding below-threshold notice**: "[warn] KB grounding confidence below threshold — review and edit"
- **Safe auto-response toggle CTA**: "Enable safe auto-response (irreversible without re-approval)"
- **Safe auto-response confirmation modal**: "[block] Safe auto-response will dispatch CS responses without per-ticket review when KB grounding confidence ≥ threshold. This setting is operator-only; AI agents cannot toggle. Reason capture ≥50 chars required."
- **Banned lexicon block notice**: "[err] Suggested response contains banned lexicon — review and edit before dispatch"
- **Save offer activate CTA**: "Activate save offer"
- **Save offer reject CTA**: "Reject save offer"
- **Save offer pricing pending notice**: "[warn] Pricing Engine recommendation pending — sentinel active"
- **Save offer pricing context required error**: "[err] Pricing context required (recommendation OR sentinel)"
- **Save offer approval required warning**: "[warn] Approval required"
- **PII redaction placeholder**: "[REDACTED]"
- **Retention sweep overdue notice**: "[warn] {N} rows overdue for retention sweep"
- **Retention sweep completed notice**: "[info] Retention sweep completed {ago} ({N} hard_delete + {M} anonymize + {K} tombstone)"

These verbatim strings are doctrine; future 216-consuming
surfaces MUST cite this UI-SPEC and render the copy verbatim. CI
assertion enforces zero-drift.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | not applicable — no UI surface authored in this phase | not required |
| third-party | none — no UI surface authored in this phase | not required |

Phase 216 ships no UI components, no Storybook stories, no
component exports, no third-party block integrations. Registry
vetting gate is not applicable for this phase. Future
216-consuming surfaces will inherit the parent UI-SPEC chain's
registry posture (P208 + P213.x + P214 + P215 — all use shadcn
official surface authoring with custom MarkOS components per
DESIGN.md v1.1.0).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no end-user copy authored; verbatim strings declared above for future surfaces)
- [ ] Dimension 2 Visuals: PASS (no visuals authored)
- [ ] Dimension 3 Color: PASS (no color authored)
- [ ] Dimension 4 Typography: PASS (no typography authored)
- [ ] Dimension 5 Spacing: PASS (no spacing authored)
- [ ] Dimension 6 Registry Safety: PASS (no registry blocks used)

**Approval:** pending

---

## Verification Anchor

To verify the no-UI-scope declaration is correct, execute the
following ripgrep assertions (each MUST return 0 matches):

```bash
# 1. No UI paths in any plan files_modified block
rg -n 'app/\(' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md
rg -n 'app/\(saas\)|app/\(growth\)|app/\(markos\)' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md
rg -n 'components/' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md
rg -n '\.stories\.tsx|\.module\.css|\.css\b|\.scss|\.sass' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md
rg -n 'page\.tsx|layout\.tsx|route\.tsx|route\.ts' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md
rg -n 'tailwind\.config|globals\.css|tokens\.css|styles/components\.css' .planning/phases/216-saas-suite-health-churn-support-usage/216-{01..06}-PLAN.md

# 2. Architecture-lock forbidden patterns enforced (216-01 Plan Task 0.5 ships scanForbiddenPatterns)
# Forbidden paths include lib/markos/saas/revenue/ (P217 owns), lib/markos/profile/ (P218),
# lib/markos/b2b/ (P219), lib/markos/community/ (P220), and 12 more downstream-phase paths

# 3. The four UI binding contracts above govern future surfaces — no UI surface in 216 itself
```

If any of the above ripgrep commands return >0 matches, the
no-UI-scope declaration is FALSE and the gsd-ui-checker MUST
BLOCK with reason: "Phase 216 declared no-UI but `files_modified`
contains UI surface paths".

---

*Generated by gsd-ui-researcher 2026-04-29. Source of truth:
DESIGN.md v1.1.0. Carry-forward: 213.4 D-08..D-15. Parent chain:
206 → 207 → 208 → 212 → 213 → 214 → 215 → 216.*
