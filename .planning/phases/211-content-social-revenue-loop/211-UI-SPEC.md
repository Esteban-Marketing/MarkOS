---
phase: 211
slug: content-social-revenue-loop
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: marketing-operating-loop-substrate-strategy-brief-artifact-audit-dispatch-social-revenue-measurement
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [211-01, 211-02, 211-03, 211-04, 211-05, 211-06]
plans_with_ui_surfaces: []
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — public.claim, external.send, data.export, connector.mutate, billing.charge, price.change)
  - 207-UI-SPEC.md (RunApiEnvelope; AgentRunEventType; chain-engine downstream consumer; ApprovalHandoffRecord)
  - 208-UI-SPEC.md (Approval Inbox + Recovery Center + Weekly Narrative — operator surfaces that consume 211 dispatch / handoff / measurement outputs)
  - 209-UI-SPEC.md (loop dispatch evidence gate — §Downstream row 6: "every claim in queued content checked against EvidenceMap; unsupported claims block dispatch")
  - 210-UI-SPEC.md (connector substrate; future_phase_211 PlaceholderBanner dissolves once 211 ships)
translation_gates_dissolved_by_211:
  - "209 §Downstream row 6 — loop dispatch evidence gate (unsupported_blocked state binds to 211 DispatchAttempt blocking)"
  - "210 §Surface A — future_phase_211 PlaceholderBanner for loop-dispatch-bound connector recommendations"
  - "208-02 morning-brief.ts placeholder_state literal `waiting_phase_211`"
  - "208-06 weekly-narrative.ts placeholder_sections literal `phase_211_loop`"
translation_gates_opened_by_211:
  - "future_phase_212 — measurement-handoff `learning_ready` state binds to 212 LRN consumers"
  - "future_phase_217+ — growth-loop-compatibility-map.md future_consumer rows (plg, abm, referral, community, events, pr, partnerships, developer_marketing)"
---

# Phase 211 — UI Design Contract (no-UI-scope)

> **Phase 211 ships zero UI surfaces.** This document is the explicit no-surface
> declaration for the Content, Social, and Revenue Loop phase. It exists so that
> gsd-ui-checker, gsd-planner, and gsd-ui-auditor have an unambiguous contract:
> there is no `app/`, no `components/`, no `*.stories.tsx`, no `page.tsx`, no
> `layout.tsx`, no `*.module.css`, and no `*.css` modified or created in any of
> the six plans (211-01 through 211-06).
>
> What Phase 211 *does* ship is the **marketing operating loop substrate** —
> **doctrine** (`.planning/marketing-loop/*.md` — 8 docs covering upstream
> readiness, strategy/brief contract, artifact/audit contract, dispatch/approval
> policy, social-signal routing, revenue-feedback model, weekly-narrative source
> map, measurement-handoff contract, growth-loop compatibility map), **typed
> loop modules** (`lib/markos/loop/*.ts|.cjs` — 14 files: contracts,
> strategy-brief, draft-pipeline, artifact-audit, evidence-gates,
> dispatch-attempt, dispatch-gates, approval-linkage, social-signal,
> social-routing, social-escalation, revenue-feedback, narrative-input,
> measurement-handoff, next-task-recommendation, growth-compatibility), **Node
> API handlers** (`api/v1/marketing/{artifacts, dispatch, social-signals,
> revenue-feedback, measurement-handoff}.js` — 5 server-side route modules),
> **migrations** (`supabase/migrations/{marketing_strategy_briefs,
> marketing_artifacts_and_audits, marketing_dispatch_attempts, social_signals,
> revenue_feedback_links, measurement_handoffs}.sql` — 6 DDL files), **CI
> assertion scripts** (`scripts/marketing-loop/{check-loop-upstream-readiness,
> check-loop-architecture-lock, assert-loop-contract-baseline}.mjs` — 3 Node
> CLI runners), and **tests** (`test/marketing/phase-211/{preflight,
> domain-1..6}/*.test.js`). None of those files compose, import, or render any
> visual primitive from `styles/components.css` or any token from
> `app/tokens.css`. The Node API handlers under `api/v1/marketing/**` are
> server-side route modules (CommonJS or ESM, no JSX), not Next.js App Router
> pages.
>
> However, **every downstream phase (212+, 217+, 213.x admin extensions, future
> growth modules) that consumes a Phase 211 loop contract WILL eventually need
> a UI surface** — loop monitoring dashboards, DispatchAttempt state boards,
> MarketingArtifact preview/diff viewers, pre-dispatch evidence audits, social
> signal inboxes, revenue feedback narrative consumers, measurement handoff
> timelines, loop visualizer DAGs, next-task generation queues, growth
> compatibility browsers. This UI-SPEC therefore also serves as a forward-
> looking inheritance map so future UI-SPECs can cite their lineage back to
> the loop doctrine defined here.
>
> Authority chain: DESIGN.md v1.1.0 → 213.x adoption-wave decisions (D-08,
> D-09, D-09b, D-13, D-14, D-15) → 206-UI-SPEC (mutation-class doctrine origin
> for `external.send`, `public.claim`, `data.export`, `connector.mutate`,
> `billing.charge`, `price.change`) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, chain-engine, `ApprovalHandoffRecord`) → 208-UI-SPEC
> (operator-cockpit consumers: Approval Inbox + Recovery Center + Weekly
> Narrative read 211 dispatch / social / revenue / measurement outputs) →
> 209-UI-SPEC (loop dispatch evidence gate dissolves into 211 DispatchAttempt
> blocking; `unsupported_blocked` state binds here) → 210-UI-SPEC (connector
> substrate; `future_phase_211` PlaceholderBanner dissolves) → this document.
> Generated by gsd-ui-researcher. Status: draft (checker upgrades to approved
> once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all six
plans plus context, research, and reviews. The full file set declared in
`files_modified` across 211-01..211-06 is enumerated below, with surface
classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Marketing-loop doctrine | `.planning/marketing-loop/{211-upstream-readiness, strategy-brief-contract, artifact-audit-contract, dispatch-approval-policy, social-signal-routing, revenue-feedback-model, weekly-narrative-source-map, measurement-handoff-contract, growth-loop-compatibility-map}.md` (9 docs) | 211-01..211-06 | NO |
| Phase validation | `.planning/phases/211-content-social-revenue-loop/211-VALIDATION.md` | 211-01, 211-06 | NO |
| Loop contracts module | `lib/markos/loop/{contracts.ts, contracts.cjs, index.cjs}` | 211-01 | NO (Zod / TS schemas only; CJS bridge) |
| Loop runtime substrate modules | `lib/markos/loop/{strategy-brief, draft-pipeline, artifact-audit, evidence-gates, dispatch-attempt, dispatch-gates, approval-linkage, social-signal, social-routing, social-escalation, revenue-feedback, narrative-input, measurement-handoff, next-task-recommendation, growth-compatibility}.ts` (15 files) | 211-01..211-06 | NO (server-side TS modules; no JSX) |
| Migrations | `supabase/migrations/{marketing_strategy_briefs, marketing_artifacts_and_audits, marketing_dispatch_attempts, social_signals, revenue_feedback_links, measurement_handoffs}.sql` (6 files) | 211-01..211-06 | NO (SQL DDL) |
| Node API handlers | `api/v1/marketing/{artifacts.js, dispatch.js, social-signals.js, revenue-feedback.js, measurement-handoff.js}` (5 files) | 211-02..211-06 | NO (Node serverless route modules; no JSX, no rendering) |
| Loop CI scripts | `scripts/marketing-loop/{check-loop-upstream-readiness, check-loop-architecture-lock, assert-loop-contract-baseline}.mjs` (3 files) | 211-01 | NO (Node CLI assertion runners; stdout limited to `node --test` output format) |
| Test files | `test/marketing/phase-211/{preflight, domain-1, domain-2, domain-3, domain-4, domain-5, domain-6}/*.test.js` | 211-01..211-06 | NO |

**Search assertions** (verified during scope confirmation; ripgrep across all
six plan files in `files_modified` blocks):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 211-01..211-06 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 211-01..211-06 | 0 matches |
| `files_modified` glob `components/**` across 211-01..211-06 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 211-01..211-06 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 211-01..211-06 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 211-01..211-06 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |

**Disambiguation note (Node API path syntax):** The 5 files under
`api/v1/marketing/**` use `[id]`-style path-param syntax in some surrounding
codebase routes; in 211 they are flat versioned API handlers (no JSX, no
rendering, no Next.js App Router pages). They emit JSON envelopes only.
Visual rendering of dispatch state, social signals, revenue feedback, or
measurement handoff is downstream phases' responsibility (P208 cockpit, P212
learning, P217+ growth modules).

**Disambiguation note (existing surfaces NOT modified by 211):** The
operator-cockpit surfaces shipped in P208 (`app/(markos)/operations/{tasks,
approvals, recovery, narrative}/page.tsx`) read 211 outputs as downstream
consumers. P208 already authors `<PlaceholderBanner variant="future_phase_211">`
in its Weekly Narrative (208-06) and Morning Brief (208-02) for sections
awaiting 211 substrate. Phase 211 ships the substrate; P208's placeholder
banners dissolve once 211 lands. **211 itself does not modify any P208 file.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase is pure
loop-substrate authoring + contracts + Node API handlers + migrations + CI
scripts + tests. There are no visual decisions to specify, no typography
choices to lock, no copywriting copy to draft for end-user surfaces, and no
component primitives to compose.

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
| Form authoring posture | not applicable — no forms |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money display posture | not applicable — money flows through `RevenueFeedbackLink` (`revenue_amount`, `currency`, `weighted_evidence_refs`) defined in `revenue-feedback-model.md` and migration `revenue_feedback_links.sql` per 211-05; rendering of revenue posture is downstream phases' responsibility (208 Weekly Narrative consumes; future P217 marketing dashboards extend) |
| Table authoring posture | not applicable — registry tables in `.planning/marketing-loop/*.md` are GitHub-flavored Markdown rendered by Markdown viewers, not React tables |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by the `pricing_context_ref` column on `MarketingStrategyRun` / `ContentBrief` / `MarketingArtifact` per 211-01 / 211-02 acceptance criteria and CLAUDE.md Pricing Engine Canon; appears verbatim in `test/marketing/phase-211/domain-1/pricing-evidence-gates.test.js` and `test/marketing/phase-211/domain-2/artifact-audit.test.js`; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/marketing/**` are Node serverless route modules. They emit JSON envelopes (artifact / dispatch / social-signal / revenue / measurement records) and accept POST mutations gated by approval-token. They DO NOT render HTML, JSX, or any visual surface. Future UI consumers parse the JSON; rendering is downstream. |
| Doctrine prose posture | `.planning/marketing-loop/*.md` doctrine docs are markdown only; no rendered components inside. They are read by humans (auditor, planner, executor) and parsed by CI scripts (`scripts/marketing-loop/*.mjs`) for forbidden-string and contract-baseline assertions. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 211 emits no CSS, no JSX, no terminal output (the
loop CI scripts are CI-only assertion runners with stdout limited to
`node --test` output format — no human-facing tabular display; the Node API
handlers emit JSON envelopes, not rendered markup). Every spacing,
typography, and color decision is deferred to the downstream phases that
will surface this loop substrate.

---

## Translation Gate Dissolution and Opening

This is a **load-bearing section unique to Phase 211** because 211 closes
several upstream translation gates and opens new downstream ones. Every
future surface that consumes 211 substrate inherits both the dissolved-gate
status (no longer needs `<PlaceholderBanner variant="future_phase_211">`)
and the newly-opened-gate status (must render `<PlaceholderBanner
variant="future_phase_212">` or `..._growth_module` until those phases
ship).

### Gates dissolved by Phase 211 (downstream surfaces remove these placeholders)

| Upstream surface | Placeholder authored | Dissolution rule once 211 ships |
|------------------|---------------------|----------------------------------|
| 209-UI-SPEC §Downstream row 6 (loop dispatch evidence gate) | `EvidenceMap.supported == false` claim block; "blocked-action families: publish, send, social, pricing, support" | 211-02 `evidence-blocked` blocking-reason and 211-03 `dispatch_status == 'blocked'` make this implementable. The 209-04 `unsupported_blocked` state binds to `MarketingArtifact.artifact_status == 'blocked'` with `blocking_reasons` containing `evidence_blocked`, AND to `DispatchAttempt.dispatch_status == 'blocked'` with `rollback_hint` referencing the unsupported claim. Future pre-dispatch evidence-audit surfaces compose `<EvidenceSummary />` (209) over `MarketingArtifact.evidence_refs` + `ArtifactAudit.evidence_status`. |
| 210-UI-SPEC §Surface A onboarding (`<PlaceholderBanner variant="future_phase_211">`) | Loop-dispatch-bound connector recommendations rendered as placeholder | 211-03 `dispatch-approval-policy.md` requires connector state for the exact channels `email`, `x`, `linkedin`, `sms`. Once 211 ships, P210 onboarding can present connector recommendations as runnable (gated by 211 `DispatchAttempt.queue_status` readiness) instead of placeholder-only. |
| 208-02 Morning Brief `placeholder_state` literal `waiting_phase_211` | Brief sections awaiting loop substrate render `.c-notice c-notice--info` | Once 211 ships, `lib/markos/operator/morning-brief.ts` removes the `waiting_phase_211` branch and reads from `MarketingArtifact` + `DispatchAttempt` + `SocialSignal` + `RevenueFeedbackLink` directly. P208 must be re-deployed with the dissolved branch removed. |
| 208-06 Weekly Narrative `placeholder_sections` literal `phase_211_loop` | Awaiting-loop section composes `<PlaceholderBanner variant="future_phase_211">` | Once 211 ships, `lib/markos/operator/weekly-narrative.ts` removes the `phase_211_loop` placeholder and reads from `MeasurementHandoff` + `RevenueFeedbackLink` + `weekly-narrative-source-map.md` directly. The `narrative_ready` boolean on `RevenueFeedbackLink` and the `weekly_narrative_ref` on `MeasurementHandoff` are the source-of-truth fields for narrative population. |
| 208-04 Approval Inbox (handoff-kind filter) | Existing P208 inbox renders all 4 `handoff_kind` literals from 207, but loop-originated approvals (`MarketingArtifact` approval, `DispatchAttempt` approval) are placeholders | Once 211 ships, approval inbox renders loop-originated approval items with the `MarketingArtifact.artifact_id`, `MarketingArtifact.evidence_refs`, `MarketingArtifact.pricing_context_ref`, and `DispatchAttempt.approval_package_id` linked through `ApprovalHandoffRecord.task_ref`. Mutation-class binding: most loop dispatch approvals fall under `external.send` (per 206-02) when channel ∈ {`email`, `x`, `linkedin`, `sms`} and `public.claim` when artifact targets a public-proof surface. |

### Gates opened by Phase 211 (future surfaces must render these placeholders)

| Downstream consumer (future phase) | Placeholder required | Dissolution phase |
|------------------------------------|---------------------|-------------------|
| `MeasurementHandoff.learning_ready == true` consumers | `<PlaceholderBanner variant="future_phase_212">` rendered when `learning_ready == true` but Phase 212 has not yet shipped its learning-ledger surface | P212 (LRN-01..05) |
| Growth-module loop consumers (PLG, ABM, referral, community, events, PR, partnerships, developer marketing) | `<PlaceholderBanner variant="future_growth_module">` rendered when a future surface attempts to consume `growth-loop-compatibility-map.md` rows whose status is `future_consumer` | P217+ (per 211-06-02 doctrine) |
| Phase 213 Tenant 0 closeout consumers | `<PlaceholderBanner variant="future_phase_213_tenant0">` rendered when a tenant-0 readiness surface needs to assert that the 211 loop has run end-to-end on Tenant 0 | P213 |
| Phase 218-220 SaaS Growth consumers | `<PlaceholderBanner variant="future_phase_218">` (or 219/220 per growth area) rendered when a SaaS-growth surface needs the loop's growth-compatibility-map `future_consumer` row to flip to active | P218, P219, P220 |

**Critical guardrail:** Phase 211 itself does NOT author any `<PlaceholderBanner>`
component. It only specifies which placeholder variants downstream phases
must render until their respective dependencies ship. The placeholder
component itself is owned by the surface that renders it (typically the
operator cockpit in P208 or a future marketing-site surface in P217+).

---

## Downstream UI Inheritance Map

This is the load-bearing section of this document. When a future phase ships
a UI surface that consumes a Phase 211 loop contract, that phase's
UI-SPEC.md MUST cite the row below that authorizes its surface family. This
binds the visual contract back to the loop doctrine and prevents drift.

All downstream UI surfaces below MUST author to **DESIGN.md v1.1.0** and
inherit the 213.x adoption-wave decisions (carried forward from CONTEXT.md
decisions D-08 through D-15 of the 213.3 / 213.4 waves):

| 213.x Decision | Carry-forward rule for any future surface that consumes 211 doctrine |
|----------------|---------------------------------------------------------------------|
| D-08 (token-only) | Zero inline hex literals; every color via `var(--color-*)`; every spacing via `var(--space-*)`; every typography via DESIGN.md `typography.*` token. Artifact-status badges, dispatch-status badges, social-signal route-kind chips, attribution-status badges, next-task-kind chips all token-only. |
| D-09 (mint-as-text) | Protocol Mint `#00D9A3` allowed as text via `--color-primary-text` for `.c-button--tertiary` link CTAs and `.c-chip-protocol` IDs only; never as fill on surfaces larger than a button or chip. Artifact-ID copy-link CTAs, brief-ID chips, dispatch-ID chips, social-signal-ID chips, handoff-ID chips use mint-as-text. |
| D-09b (`.c-notice` mandatory) | Every artifact-status notice (draft, audited, blocked, approval_ready, rejected), every dispatch-status notice (blocked, queued, dispatched, failed, retry_pending), every social-signal route notice (read_only, task_only, approval_queue, crm_linked, spam), every degraded-attribution notice (degraded, missing_identity, missing_touches), every measurement-handoff next-task notice composes `.c-notice c-notice--{info,warning,success,error}` from `styles/components.css`. No local `.banner`/`.alert`/`.warning`/`.noticeBar` classes. |
| D-13 (`.c-card--feature` reserved) | `.c-card--feature` is reserved for hero panels in `404-workspace` + `213.5` marketing. Any future loop surface (artifact preview, dispatch board, social inbox, revenue narrative, measurement timeline, loop visualizer, growth-module browser) uses `.c-card` default — never `.c-card--feature`. |
| D-14 (no `.c-table` primitive) | Any future tabular surface (artifact list, dispatch attempt log, social signal feed, revenue feedback ledger, measurement handoff history, growth-compatibility browser) uses vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 214+. |
| D-15 (selective extraction) | When a future phase extracts a loop-substrate read pattern into a reusable component, the extraction is selective: pages co-locate with their loop-record read first, primitives extract only when reuse is proven across ≥2 surfaces (e.g. artifact-status badge in P208 cockpit + P217 marketing dashboard). |

### Future-surface inheritance table

| Future surface (illustrative; not implemented in 211) | Originating Phase 211 doctrine | Phase that ships the surface | Inheritance citation required |
|-------------------------------------------------------|-------------------------------|-------------------------------|-------------------------------|
| Loop monitoring dashboard (single strategy-run detail) | `.planning/marketing-loop/strategy-brief-contract.md` (211-01-01) + `MarketingStrategyRun` field set | P208 admin extension or P217 marketing dashboard | Future UI-SPEC must cite `211-UI-SPEC.md §Downstream UI Inheritance Map` and bind to `MarketingStrategyRun` fields verbatim (`strategy_run_id`, `tenant_id`, `objective`, `audience_segment`, `pain_tag`, `offer_ref`, `channel_hypothesis`, `pricing_context_ref`, `proof_requirement_refs`, `success_target`, `owner_role`, `agent_run_id`, `created_at`, `updated_at`); strategy-run state inherits the run state machine from 207 via `agent_run_id` linkage. The 14-field `ContentBrief` envelope (`brief_id`, `strategy_run_id`, `artifact_family`, `channel`, `claim_inventory`, `evidence_requirement_refs`, `pricing_requirement`, `approval_policy`, `revenue_hypothesis`, `dispatch_goal`, `measurement_window_days`, `created_at`, `updated_at`) renders as a `.c-card` panel within the strategy-run detail. The three `pricing_requirement` literals (`approved_pricing`, `placeholder_allowed`, `not_pricing_sensitive`) render as `.c-badge--{success,info,warning}` chips. |
| MarketingArtifact preview / diff viewer | `.planning/marketing-loop/artifact-audit-contract.md` (211-02-01) + `MarketingArtifact` + `ArtifactAudit` field sets | P208 admin extension or P217 content authoring | Future UI-SPEC must enumerate the five `artifact_status` literals (`draft`, `audited`, `blocked`, `approval_ready`, `rejected`) verbatim as status badges with `.c-badge--{info,warning,error,success,error}` mapping; the four `blocking_reasons` literals (`evidence_blocked`, `pricing_blocked`, `compliance_blocked`, `channel_blocked`) verbatim as blocker chips. Audit fields (`voice_status`, `claim_status`, `compliance_status`, `channel_fit_status`, `pricing_status`, `evidence_status`) render as a per-dimension audit panel using `.c-card` + `.c-badge` recipe. `recommended_edits` array renders as a vanilla `<ul>` with token-only `<li>` recipe. `evidence_refs` chips compose `.c-chip-protocol` (mint-as-text per D-09) deep-linked to 209 `<EvidenceSummary />`. |
| Pre-dispatch evidence audit (loop dispatch evidence gate — dissolves 209 §Downstream row 6) | `.planning/marketing-loop/dispatch-approval-policy.md` (211-03-01) + 211-02 `evidence-gates.ts` + 209-01 `EvidenceMap` consumer | P208 Approval Inbox extension or P217 content surface | Future UI-SPEC must dissolve the 209 `unsupported_blocked` placeholder and render the actual blocking row: every claim in the artifact's `claim_inventory` checked against `EvidenceMap.supported`. Unsupported claims render `.c-notice c-notice--error` "[block] Unsupported claim — dispatch blocked". Override path inherits 209-04 doctrine (`override_path == 'denied'` for autonomy-ceiling reach; `.c-button--destructive` "Continue without evidence" otherwise). The dispatch UI composes `<EvidenceSummary />` (209) in read-only mode for each claim, AND records the override on the linked `DispatchAttempt.rollback_hint` field. Cross-binding: 206 `external.send` mutation-class doctrine, 207 `ApprovalHandoffRecord.handoff_kind == 'approval'`, 209 evidence summary, 211 dispatch state machine — all four authorities cited. |
| DispatchAttempt state board (multi-attempt table) | `.planning/marketing-loop/dispatch-approval-policy.md` (211-03-01) + `DispatchAttempt` field set | P208 admin extension or P210 connector recovery extension | Future UI-SPEC must surface the 14-field `DispatchAttempt` envelope verbatim (`dispatch_attempt_id`, `tenant_id`, `artifact_id`, `channel`, `connector_install_id`, `approval_package_id`, `approval_mode`, `provider_receipt_ref`, `queue_status`, `dispatch_status`, `rollback_hint`, `agent_run_id`, `created_at`, `updated_at`); the two `approval_mode` literals (`human_approved`, `earned_autonomy`) verbatim as approval-mode badges with `.c-badge--{success,info}` mapping; the five `dispatch_status` literals (`blocked`, `queued`, `dispatched`, `failed`, `retry_pending`) verbatim as status badges with `.c-badge--{error,info,success,error,warning}` mapping. The four channel literals (`email`, `x`, `linkedin`, `sms`) render as channel-icon chips (icon library deferred to consuming phase). D-14 vanilla-table recipe required. Cross-binding: 207 `RunApiEnvelope` via `agent_run_id`, 207 `ApprovalHandoffRecord` via `approval_package_id`, 210 connector substrate via `connector_install_id`, 206 `external.send` mutation-class doctrine. |
| Social signal inbox (multi-signal feed) | `.planning/marketing-loop/social-signal-routing.md` (211-04-01) + `SocialSignal` field set | P208 admin extension or P226 sentiment engine | Future UI-SPEC must surface the 14-field `SocialSignal` envelope verbatim (`social_signal_id`, `tenant_id`, `source_platform`, `signal_type`, `signal_text`, `sentiment`, `urgency`, `revenue_relevance`, `approval_needed`, `route_kind`, `crm_record_ref`, `task_ref`, `created_at`, `updated_at`); the five `route_kind` literals (`read_only`, `task_only`, `approval_queue`, `crm_linked`, `spam`) verbatim as route badges with `.c-badge--{info,warning,error,success,error}` mapping. `approval_needed == true` rows render `.c-notice c-notice--warning` "[warn] Approval required" inline. Sentiment/urgency/revenue_relevance render as paired chip group with token-only color mapping. CRM and task linkage compose `.c-chip-protocol` deep-link chips. D-14 vanilla-table recipe for the feed; per-signal detail composes `.c-card`. Cross-binding: 206 `external.send` for any reply-mutation row, 208 `ApprovalHandoffRecord` for `approval_queue` route_kind, 222 CRM substrate for `crm_record_ref`. |
| Revenue feedback narrative consumer (Weekly Narrative loop section) | `.planning/marketing-loop/revenue-feedback-model.md` (211-05-01) + `.planning/marketing-loop/weekly-narrative-source-map.md` (211-05-01) + `RevenueFeedbackLink` field set | P208 Weekly Narrative (208-06; dissolves the existing `phase_211_loop` placeholder) | Future UI-SPEC update to 208-UI-SPEC §Surface F (Weekly Narrative) must remove the `<PlaceholderBanner variant="future_phase_211">` for the loop section and render the actual narrative populated from `MeasurementHandoff.weekly_narrative_ref` + `RevenueFeedbackLink.narrative_ready == true` rows. The 14-field `RevenueFeedbackLink` envelope (`feedback_id`, `tenant_id`, `artifact_id`, `campaign_ref`, `crm_record_kind`, `crm_record_id`, `revenue_amount`, `currency`, `attribution_status`, `weighted_evidence_refs`, `leading_indicator_kind`, `narrative_ready`, `created_at`, `updated_at`) renders as `.c-card` panels per artifact. The four `attribution_status` literals (`ready`, `degraded`, `missing_identity`, `missing_touches`) render as `.c-badge--{success,warning,error,error}` mapping. Money rendering: `revenue_amount` + `currency` displayed via tabular-numerals JetBrains Mono per DESIGN.md typography rule. Cross-binding: existing `lib/markos/crm/attribution.ts` `buildWeightedAttributionModel` is the source-of-truth (211-05 reuses, never replaces); 209 evidence binding via `weighted_evidence_refs[]`. |
| Measurement handoff timeline (per-artifact expected-vs-actual) | `.planning/marketing-loop/measurement-handoff-contract.md` (211-06-01) + `MeasurementHandoff` field set | P208 admin extension or P212 learning ledger | Future UI-SPEC must surface the 14-field `MeasurementHandoff` envelope verbatim (`handoff_id`, `tenant_id`, `artifact_id`, `expected_outcome`, `actual_outcome`, `outcome_delta`, `attribution_status`, `lesson_candidate`, `next_task_kind`, `next_task_ref`, `weekly_narrative_ref`, `learning_ready`, `created_at`, `updated_at`); the doctrine phrase `expected performance envelopes` rendered verbatim in any explanatory copy (per 211-06 acceptance criterion). Expected-vs-actual rendered as paired numeric column (token-only, tabular-numerals); `outcome_delta` rendered with directional `.c-badge--{success,warning,error}` based on sign and threshold. The six `next_task_kind` literals (`brief_refresh`, `evidence_refresh`, `pricing_review`, `connector_recovery`, `social_follow_up`, `experiment_candidate`) render as next-task chips deep-linking via `next_task_ref` to the P208 task system. `learning_ready == true` rows compose `<PlaceholderBanner variant="future_phase_212">` until P212 ships. Cross-binding: 207 `RunApiEnvelope` lineage via artifact's run, 209 evidence binding for `lesson_candidate`, 212 learning ledger as the eventual consumer. |
| Loop visualizer DAG (strategy → brief → artifact → audit → dispatch → measure → learn) | All of 211-01..211-06 doctrine + `lib/markos/loop/contracts.ts` cross-references | P208 admin extension or future marketing-ops surface | Future UI-SPEC must render the 7-stage loop as a directed acyclic graph: nodes = `MarketingStrategyRun`, `ContentBrief`, `MarketingArtifact`, `ArtifactAudit`, `DispatchAttempt`, `RevenueFeedbackLink`, `MeasurementHandoff`. Edges follow the foreign-key chain (`brief.strategy_run_id`, `artifact.brief_id`, `audit.artifact_id`, `dispatch.artifact_id`, `revenue.artifact_id`, `handoff.artifact_id`). No glow, no gradient on edges (DESIGN.md elevation rule). Node state badges follow the same per-table state-literal mapping above. Reduced-motion freezes any auto-traversal animation per DESIGN.md motion rule. |
| Pre-dispatch approval-token viewer (loop variant) | `.planning/marketing-loop/dispatch-approval-policy.md` (211-03-01) + 207 `ApprovalHandoffRecord` | P208 Approval Inbox extension | Future UI-SPEC update to 208-04 must add the loop variant: when `ApprovalHandoffRecord.handoff_kind == 'approval'` AND the linked run is a loop dispatch, the approval-token viewer composes `MarketingArtifact.draft_body` preview + `ArtifactAudit.recommended_edits` + `EvidenceMap` summary (via 209 `<EvidenceSummary />`) + `DispatchAttempt.channel` + `DispatchAttempt.connector_install_id` health (via 210 connector substrate). Mutation-class binding per 206-02: `external.send` for `email`/`x`/`linkedin`/`sms` channel; if the artifact targets a public-proof surface, ALSO `public.claim` (dual-class). `.c-modal` + `.c-button--destructive` confirm gate required when mutation-class default-approval-mode is `dual_approval`. |
| Next-task generation queue (P208 Task Board consumer) | `.planning/marketing-loop/measurement-handoff-contract.md` (211-06-01) + `next_task_kind` + `next_task_ref` | P208 Task Board (208-03 — already shipped; consumes loop-generated tasks once 211 lands) | Future UI-SPEC update to 208-03 must remove any `<PlaceholderBanner variant="future_phase_211">` for loop-originated tasks and read 211 `MeasurementHandoff.next_task_kind` + `next_task_ref`. The six `next_task_kind` literals render as task-class chips. Each chip's color follows the recipe: `brief_refresh` (info), `evidence_refresh` (warning), `pricing_review` (warning), `connector_recovery` (error), `social_follow_up` (info), `experiment_candidate` (success). Cross-binding: 208 task system owns the task envelope; 211 only generates the next-task references. |
| Growth-loop compatibility browser (admin) | `.planning/marketing-loop/growth-loop-compatibility-map.md` (211-06-02) + 8 future-consumer rows | P217+ growth phases or future enterprise admin | Future UI-SPEC must surface the eight growth-module rows verbatim (`plg`, `abm`, `referral`, `community`, `events`, `pr`, `partnerships`, `developer_marketing`); every row renders the exact status `future_consumer` per 211-06-02 acceptance criterion. Each row composes `.c-card` with `.c-badge--info` "[info] future_consumer" status and a description of which loop primitives it would consume once activated. NEVER renders the rows as runnable until the corresponding growth phase ships (P218-P220 SaaS Growth phases per ROADMAP / REQUIREMENTS traceability). Until then, all rows render `<PlaceholderBanner variant="future_growth_module">` as a guard. |
| Brief authoring wizard (strategy run → content brief flow) | `.planning/marketing-loop/strategy-brief-contract.md` (211-01-01) + `ContentBrief` field set | P217 marketing-ops surface or future content-authoring phase | Future UI-SPEC must implement the wizard as a multi-step form (Step 1: strategy objective + audience + offer + channel hypothesis; Step 2: brief artifact-family + channel + claim inventory + evidence requirement refs; Step 3: pricing requirement selection + approval policy + revenue hypothesis; Step 4: dispatch goal + measurement window). Pricing-requirement step composes a 3-radio control over the literals `approved_pricing`, `placeholder_allowed`, `not_pricing_sensitive`. When `placeholder_allowed` is selected, the parent's `<PlaceholderBanner>` for `{{MARKOS_PRICING_ENGINE_PENDING}}` renders inline per CLAUDE.md and 205 inheritance. Save action gated on EvidenceMap availability for every claim in `claim_inventory` per 209 evidence-gate doctrine. |
| Artifact audit tribunal (per-claim audit detail) | `.planning/marketing-loop/artifact-audit-contract.md` (211-02-01) + `ArtifactAudit` field set | P208 Approval Inbox extension or P217 content review | Future UI-SPEC must surface every audit-status field as a per-dimension panel: `voice_status`, `claim_status`, `compliance_status`, `channel_fit_status`, `pricing_status`, `evidence_status`. Each panel composes `.c-card` with `.c-badge--{success,warning,error}` based on its individual status, plus an inline `recommended_edits` list. Blocking reasons render as a header `.c-notice c-notice--error` listing every literal in `blocking_reasons[]` from the four-literal vocabulary (`evidence_blocked`, `pricing_blocked`, `compliance_blocked`, `channel_blocked`). When `evidence_blocked` is present, panel composes `<EvidenceSummary />` (209) for the failing claim. When `pricing_blocked` is present, panel composes the pricing-pending placeholder per 205. When `compliance_blocked` is present, panel cites 206 mutation-class doctrine; the operator must approve a `mutation_class` exception via the 206 mutation-class flow before the audit can clear. |
| Tenant 0 loop-readiness panel (dogfood proof) | All of 211 doctrine + 213 Tenant 0 closeout doctrine | P213 Tenant 0 surface | Future UI-SPEC must surface a "Loop readiness" panel for Tenant 0: rows for `MarketingStrategyRun` count, `ContentBrief` count, `MarketingArtifact` (audited) count, `DispatchAttempt` (dispatched) count, `RevenueFeedbackLink` (ready attribution) count, `MeasurementHandoff` (with `learning_ready == true`) count. Each row's status badge is computed from the underlying loop record state. The panel cites `211-UI-SPEC.md §Downstream UI Inheritance Map` row 13 as authority. |

**Critical guardrail:** The downstream-inheritance table above is
**illustrative**, not a phase-implementation schedule. None of those
surfaces are implemented in Phase 211. They are listed so that when each
subsequently lands as a real phase, that phase's UI-SPEC.md can cite this
document as the doctrine origin instead of re-deriving loop-record /
state-literal / blocking-reason / next-task-kind field names from scratch.

**Cross-phase doctrine binding:** Several surfaces above (pre-dispatch
evidence audit, approval-token viewer, social-signal inbox with reply
mutations, revenue feedback narrative consumer) inherit from FOUR doctrine
maps simultaneously: 206 (mutation-class doctrine — what kinds of actions
need evidence + approval mode), 207 (runtime envelope — which run created
which loop record + state machine), 209 (evidence doctrine — what evidence
looks like + how it blocks/permits action), and 211 (loop substrate — the
record envelope + state-literal vocabulary that binds them together). Any
future surface that authors a `MarketingArtifact` approval AND a
`DispatchAttempt` mutation MUST cite all four. The four inheritance maps
compose cleanly: 206 delivers the **mutation-class doctrine**, 207 delivers
the **runtime envelope**, 209 delivers the **evidence doctrine**, and 211
delivers the **loop substrate** that ties them into one governed
operating loop.

---

## Copywriting Contract

**End-user / surface copy: not applicable.** Phase 211 emits no copy to any
human surface.

**Doctrine prose copy** in `.planning/marketing-loop/*.md` and the loop
contract / migration / runtime modules is governed by:

- The CLAUDE.md banned lexicon (`synergy`, `leverage`, `empower`, `unlock`,
  `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`,
  `cutting-edge`, `innovative`, `game-changer`, `next-generation`,
  `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` as
  softener — and no exclamation points).
- Engineering-readability: short sentences, concrete contract field names,
  named owning plans. No marketing voice. No hedging language ("we strive
  to", "best-effort"). Every contract row asserts a specific field, literal,
  or test-gate procedure.
- Pricing-placeholder rule: `{{MARKOS_PRICING_ENGINE_PENDING}}` appears
  verbatim in `strategy-brief-contract.md`, `artifact-audit-contract.md`,
  and as an accepted JSONB value on `MarketingStrategyRun.pricing_context_ref`,
  `ContentBrief.pricing_requirement` (when literal == `placeholder_allowed`),
  and `MarketingArtifact.pricing_context_ref` per migration
  `marketing_strategy_briefs.sql` and `marketing_artifacts_and_audits.sql`,
  per CLAUDE.md Pricing Engine Canon and 205 placeholder rule.
- Forbidden architecture-lock strings (rejected by
  `scripts/marketing-loop/check-loop-architecture-lock.mjs` per 211-01-00
  acceptance criterion AC.3): `silent auto-publish`,
  `dispatch without approval`, `hard-coded public price`,
  `unsupported claim publish`. The script also rejects the four
  test-substrate-mismatch strings inherited from the wider GSD architecture
  lock: `vitest`, `playwright`, `.test.ts`, `route.ts`. None of these
  strings may appear in 211 doctrine markdown, in 211 runtime modules, or
  in 211 test fixtures.
- Ownership-boundary copy: every reference to upstream substrate in 211
  doctrine prose must explicitly defer ownership to the originating phase
  per the `integrates_with` declarations on each plan (PRC from P205,
  COMP from P206, RUN from P207, TASK from P208, EVD from P209, CONN from
  P210, LRN from P212). 211 doctrine never claims to "own" any of those
  families — only to consume their substrate via foreign-key references
  (`pricing_context_ref` to P205 PricingRecommendation, `agent_run_id` to
  P207 AgentRun, `evidence_refs[]` to P209 EvidenceMap,
  `connector_install_id` to P210 ConnectorInstall, etc.).
- Future-consumer copy: the eight growth-module rows in
  `growth-loop-compatibility-map.md` MUST use the exact status string
  `future_consumer` per 211-06-02 AC. No row may use synonyms like
  `planned`, `coming_soon`, `future_phase`, etc.

**Node API error envelopes:** When `api/v1/marketing/{artifacts, dispatch,
social-signals, revenue-feedback, measurement-handoff}.js` return error
responses, the JSON envelope `{ error_code, error_message }` follows these
rules:

- `error_code` is a stable kebab-case identifier (e.g.
  `artifact-not-found`, `audit-blocked-evidence`, `audit-blocked-pricing`,
  `audit-blocked-compliance`, `audit-blocked-channel`,
  `dispatch-approval-required`, `dispatch-connector-degraded`,
  `dispatch-channel-not-supported`, `social-signal-route-required`,
  `revenue-attribution-degraded`, `revenue-attribution-missing-identity`,
  `revenue-attribution-missing-touches`, `measurement-handoff-not-ready`,
  `growth-module-not-active`).
- `error_message` is a short engineering-grade sentence. No marketing
  voice. No hedging. No banned-lexicon terms. No exclamation points. No
  emoji. Bracketed-glyph prefixes (`[err]`, `[warn]`, `[block]`) reserved
  for downstream CLI / UI surfaces — JSON envelopes themselves carry only
  the structured code + message fields.
- These rules apply to API envelopes shipped by 211 because consumers
  (P208 cockpit, P212 learning ledger, P217+ growth surfaces) may surface
  `error_message` verbatim in their UX, and surfacing a banned-lexicon
  string would violate the downstream surface's DESIGN.md Pillar 1 audit.

These are doctrine-prose rules and API-envelope rules, not UI copywriting
rules — included here only because the orchestrator's downstream
inheritance question requires future UI surfaces consuming this loop
substrate to honor the same lexicon discipline when they render any
artifact-status, dispatch-status, route-kind, attribution-status,
next-task-kind literal, error message, or contract field name into a UI
label, banner, or modal body.

---

## Destructive Actions

**Not applicable in Phase 211.** No surface ships, so no confirm-modals are
authored.

The Node API handlers DO ship destructive endpoints (`POST
/api/v1/marketing/dispatch` to queue/dispatch artifact, `POST
/api/v1/marketing/social-signals` to record route-policy mutations, `POST
/api/v1/marketing/revenue-feedback` to record CRM linkage mutations), but
these endpoints emit JSON envelopes only — they do not author confirm-
modals. Confirm-modal authoring is the responsibility of downstream UI
consumers per the carry-forward rules below.

When future phases ship surfaces that mutate any 211-substrate state (e.g.
approve a `MarketingArtifact` for dispatch, retry a failed
`DispatchAttempt`, force-route a `SocialSignal` to a different `route_kind`,
record a CRM linkage on `RevenueFeedbackLink`, override a
`MeasurementHandoff.lesson_candidate`, mark a `growth_loop_compatibility_map`
row as runnable), each such mutation MUST:

1. Map to one of the six `mutation_class` literals from 206-02
   (`external.send`, `billing.charge`, `connector.mutate`, `price.change`,
   `public.claim`, `data.export`). Most 211-state mutations fall under:
   - `external.send` — any `DispatchAttempt` queue/dispatch action where
     `channel` ∈ {`email`, `x`, `linkedin`, `sms`}; any `SocialSignal` reply
     or DM mutation.
   - `public.claim` — any `MarketingArtifact` approval where
     `artifact_family` targets a public-proof surface (Tenant 0 marketing
     site, public docs, public press, public review-site replies). DUAL-
     CLASS with `external.send` for public-channel posts.
   - `price.change` — any `MarketingArtifact` approval where
     `pricing_requirement == 'approved_pricing'` AND the artifact mutates
     a public price assertion.
   - `data.export` — any `MeasurementHandoff` export to an external
     learning system; any revenue-feedback CSV/PDF export.
   - `connector.mutate` — force-route or cancel mid-flight
     `DispatchAttempt` rows where the connector has begun a side effect.
   - `billing.charge` — not applicable to 211 directly (211 does not
     directly charge); inherited from 207 cost-bridge if a loop dispatch
     incurs a billing event.
2. Compose `.c-modal` + `.c-backdrop` + `.c-button--destructive` per the
   213.x and 205 pattern, plus the 206 inheritance for mutation-class
   binding.
3. Honor the `default_approval_mode` declared in
   `.planning/compliance/mutation-class-policy.md` for that class
   (206-02-01 doctrine). For dual-class (`external.send` + `public.claim`),
   the surface must honor whichever class has the stricter approval mode
   (typically `public.claim` requires `dual_approval`).
4. Surface the `ApprovalHandoffRecord.handoff_kind` correctly (per 207
   doctrine) — `approval` for tenant-facing dangerous mutations,
   `recovery` for retrying failed `DispatchAttempt`, `manual_input` for
   force-route or override actions, `follow_up` for non-blocking post-
   dispatch tasks generated by `MeasurementHandoff.next_task_kind`.
5. When the surface authors an override of an `ArtifactAudit` blocking
   reason (e.g. operator bypasses `evidence_blocked` to dispatch anyway),
   the override path inherits 209-04 doctrine: `override_path == 'denied'`
   for autonomy-ceiling reach (no override possible); otherwise
   `.c-button--destructive` "Continue without evidence" with
   `override_reason` ≥10 chars required, and the override is recorded on
   the linked `DispatchAttempt.rollback_hint` field permanently.

---

## Storybook Coverage

**Not applicable.** No visual components rendered; nothing to story.

Test coverage replaces Storybook for this phase:

- `test/marketing/phase-211/preflight/upstream-readiness.test.js`
- `test/marketing/phase-211/preflight/architecture-lock.test.js`
- `test/marketing/phase-211/preflight/contract-baseline.test.js`
- `test/marketing/phase-211/domain-1/brief-contract.test.js`
- `test/marketing/phase-211/domain-1/pricing-evidence-gates.test.js`
- `test/marketing/phase-211/domain-2/artifact-audit.test.js`
- `test/marketing/phase-211/domain-2/channel-native-draft.test.js`
- `test/marketing/phase-211/domain-3/dispatch-state-machine.test.js`
- `test/marketing/phase-211/domain-4/social-routing.test.js`
- `test/marketing/phase-211/domain-5/revenue-feedback.test.js`
- `test/marketing/phase-211/domain-6/measurement-handoff.test.js`
- `test/marketing/phase-211/domain-6/growth-compatibility.test.js`

Runner: `npm test -- test/marketing/phase-211/` (per each plan's
`<verify><automated>` block; CommonJS `node --test` per CLAUDE.md
Architecture Lock).

---

## DESIGN.md Compliance Assertions

| Rule | DESIGN.md citation | Status in Phase 211 |
|------|--------------------|---------------------|
| Default dark surface `#0A0E14` | `colors.surface` | not applicable — no surface authored |
| Protocol Mint < 5% composition | "Composition proportion" | not applicable — no surface authored |
| Two typefaces only (JetBrains Mono + Inter) | `typography.*` | not applicable — no surface authored |
| 8px grid | "Spacing" | not applicable — no surface authored |
| Borders over shadows | "Elevation" | not applicable — no surface authored |
| WCAG 2.1 AA + 2px focus rings | "Accessibility" | not applicable — no surface authored |
| Whitespace ≥ 30% | "Whitespace as primitive" | not applicable — no surface authored |
| No emoji in product UI / CLI / docs | CLAUDE.md | **ENFORCED in doctrine prose + API envelopes** — all 9 marketing-loop docs + 14 runtime modules + 5 API handlers + 3 CI scripts author plain ASCII; bracketed glyphs `[ok]`/`[warn]`/`[err]`/`[block]`/`[info]` reserved for downstream surfaces |
| No gradients, no glow, no soft shadows | "Elevation / Motion" | not applicable — no surface authored |
| `prefers-reduced-motion` collapse | "Motion" | not applicable — no surface authored |
| Banned lexicon enforced in product copy + UI labels + CLI strings | CLAUDE.md | **ENFORCED in doctrine prose + API error envelopes** — engineering-readable language only; `error_message` fields cannot embed banned lexicon because consumers may render them verbatim |
| Pricing placeholder rule | CLAUDE.md + Pricing Engine Canon | **ENFORCED** — `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted verbatim by `MarketingStrategyRun.pricing_context_ref`, `ContentBrief.pricing_requirement` (with literal `placeholder_allowed`), `MarketingArtifact.pricing_context_ref` per migrations `marketing_strategy_briefs.sql` + `marketing_artifacts_and_audits.sql`, plus `test/marketing/phase-211/domain-1/pricing-evidence-gates.test.js` and `test/marketing/phase-211/domain-2/artifact-audit.test.js` reference the placeholder verbatim per 211-01-01 AC and 211-02-01 AC |
| Architecture-lock forbidden strings | CLAUDE.md + 211-RESEARCH §"Domain 0" + 211-CONTEXT §"Non-negotiables" | **ENFORCED** — `check-loop-architecture-lock.mjs` rejects the four exact strings `silent auto-publish`, `dispatch without approval`, `hard-coded public price`, `unsupported claim publish` per 211-01-00 AC.3 |
| Ownership-boundary doctrine | 211-REVIEWS HIGH#2 + 211-CONTEXT "Ownership boundary" + 211-RESEARCH "Ownership boundary" | **ENFORCED** — every `211-XX-PLAN.md` declares `integrates_with` rows for upstream PRC/COMP/RUN/TASK/EVD/CONN families instead of re-owning them; 211 directly owns ONLY `LOOP-01..08` + `QA-01..15` per REQUIREMENTS.md traceability table |
| Future-consumer doctrine | 211-06-02 AC | **ENFORCED** — `growth-loop-compatibility-map.md` rows for `plg`, `abm`, `referral`, `community`, `events`, `pr`, `partnerships`, `developer_marketing` all carry status `future_consumer` verbatim; doctrine never marks any growth row as runnable |
| Translation-gate dissolution doctrine | 209 §Downstream row 6 + 210 future_phase_211 placeholder + 208-02 placeholder_state + 208-06 placeholder_sections | **ENFORCED via §Translation Gate Dissolution and Opening above** — 211 closes 5 upstream gates and opens 4 downstream gates; future surfaces consuming 211 must respect the dissolution / opening status declared here |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — no UI authored |
| Third-party | none | not applicable — no UI authored |

No third-party component registries declared. No vetting gate required.

---

## Pre-Populated From

| Source | Decisions Used |
|--------|---------------|
| 211-CONTEXT.md | "Required phase shape" (1 — confirmed loop-substrate-only across 6-wave breakdown), "Done means" file list (1 — 8 doctrine artifacts plus contracts/migrations/runtime/API/scripts/tests, all server-side), "Non-negotiables" (8 — all substrate-level: no public mutation without approval/earned-autonomy, no pricing-sensitive artifact without Pricing Engine context, no factual claim without EvidenceMap, no external dispatch without connector check, no social mutation without route policy, no measurement without next-task creation, no Phase 212 implementation, no doc 17 growth implementation), "Ownership boundary" (3 — direct ownership = `LOOP-01..08` + `QA-01..15`; integrates_with = upstream substrate from P205-P210; downstream consumer = P212 only) |
| 211-RESEARCH.md | Domain 0..6 recommendations (7 — all field schemas for typed loop modules, none surface-bearing): Domain 0 upstream readiness + architecture lock; Domain 1 `MarketingStrategyRun` + `ContentBrief` field sets; Domain 2 `MarketingArtifact` + `ArtifactAudit` field sets + 5 artifact_status literals + 4 blocking_reasons literals; Domain 3 `DispatchAttempt` field set + 2 approval_mode literals + 5 dispatch_status literals + 4 channel literals; Domain 4 `SocialSignal` field set + 5 route_kind literals; Domain 5 `RevenueFeedbackLink` field set + 4 attribution_status literals; Domain 6 `MeasurementHandoff` field set + 6 next_task_kind literals + 8 growth-module future-consumer rows |
| 211-REVIEWS.md | HIGH#1 (1 — plans must adopt executable schema; backend-only) and HIGH#2 (1 — ownership boundary; all upstream families converted to integrates_with), MEDIUM#1 (1 — VALIDATION.md rows; backend) and MEDIUM#2 (1 — Phase 206 dependency gate; backend) |
| 211-01..211-06 plan frontmatter | `files_modified` enumeration (37 paths verified across 6 plans, 0 UI surfaces) |
| 206-UI-SPEC.md | No-UI-scope template structure carried forward; mutation-class doctrine inheritance for all 211 destructive actions (`external.send`, `public.claim`, `price.change`, `data.export`, `connector.mutate`); pricing-placeholder posture; banned-lexicon enforcement pattern; 213.x carry-forward decision rows |
| 207-UI-SPEC.md | No-UI-scope template structure carried forward; `RunApiEnvelope` lineage via `agent_run_id` foreign-key on `MarketingStrategyRun`; `ApprovalHandoffRecord` integration for loop approvals (`handoff_kind == 'approval' \| 'recovery' \| 'manual_input' \| 'follow_up'`); chain-engine downstream consumer pattern |
| 208-UI-SPEC.md | Operator-cockpit consumer pattern: Approval Inbox (208-04) reads loop approvals, Recovery Center (208-05) reads loop dispatch failures, Weekly Narrative (208-06) reads loop revenue feedback, Morning Brief (208-02) reads loop strategy/brief; placeholder dissolution rules for `waiting_phase_211` and `phase_211_loop` literals |
| 209-UI-SPEC.md | Loop dispatch evidence gate dissolution (§Downstream row 6 — `unsupported_blocked` state binds to 211 `MarketingArtifact.artifact_status == 'blocked'` with `blocking_reasons` containing `evidence_blocked`); `<EvidenceSummary />` sub-component reused as read-only consumer of `MarketingArtifact.evidence_refs`; override-path doctrine inherited |
| 210-UI-SPEC.md | Connector substrate consumer pattern: 211 `DispatchAttempt.connector_install_id` reads 210 ConnectorInstall; `future_phase_211` PlaceholderBanner from 210-A surface dissolves once 211 ships; sibling no-UI-scope template |
| 211-VALIDATION.md (existing) | Verification rows for 211-01-00, 211-01-01, 211-02-01, 211-03-01, 211-04-01, 211-05-01, 211-06-01, 211-06-02 (8 tasks across 6 plans) |
| DESIGN.md v1.1.0 | Banned lexicon, no-emoji rule, pricing placeholder rule, mint-as-text token reference, `.c-notice` / `.c-card` / `.c-card--feature` / `.c-table` policy carried forward to downstream-inheritance section |
| 213.3 / 213.4 CONTEXT carry-forward (D-08, D-09, D-09b, D-13, D-14, D-15) | 6 decisions enumerated in §Downstream UI Inheritance Map |
| REQUIREMENTS.md | Traceability table — `LOOP-01..08` mapped to Phase 211 (line 220) confirms 211 ownership scope |
| User input | 0 — no-UI scope fully verified by upstream artifacts; no questions needed |

---

## Checker Sign-Off

For a no-UI-scope phase, the six dimensions resolve as follows. The
checker's job here is to verify the no-surface declaration is accurate
and the downstream-inheritance map is load-bearing for future phases —
not to evaluate visual quality of surfaces that don't exist.

- [ ] Dimension 1 Copywriting: PASS-BY-EXEMPTION (doctrine prose + API error-envelope strings only; banned lexicon enforced; pricing placeholder verbatim; architecture-lock forbidden strings enforced; future_consumer literal exact)
- [ ] Dimension 2 Visuals: PASS-BY-EXEMPTION (no visuals authored)
- [ ] Dimension 3 Color: PASS-BY-EXEMPTION (no colors authored)
- [ ] Dimension 4 Typography: PASS-BY-EXEMPTION (no typography authored)
- [ ] Dimension 5 Spacing: PASS-BY-EXEMPTION (no spacing authored)
- [ ] Dimension 6 Registry Safety: PASS-BY-EXEMPTION (no registry consumed)

**No-UI declaration verification gate** (checker MUST verify before approving):

- [ ] All 6 plans confirmed to ship zero `app/`, zero `components/`, zero
      `*.stories.tsx`, zero `page.tsx`, zero `layout.tsx`, zero `*.css`,
      zero `*.module.css`, zero `tailwind.config.*` paths in
      `files_modified` (search assertions table above).
- [ ] §Downstream UI Inheritance Map enumerates ≥ 12 future surface
      families with explicit Phase 211 doctrine origin (marketing-loop
      `.md` doc or runtime module) and 213.x carry-forward citation.
- [ ] §Translation Gate Dissolution and Opening enumerates ≥ 5 dissolved
      gates (from 208/209/210 placeholders) and ≥ 4 opened gates (for
      P212/P213/P217+/P218-220 consumers).
- [ ] §DESIGN.md Compliance Assertions correctly marks visual rules as
      "not applicable" and enforces the six non-visual rules (no-emoji
      in docs + API envelopes, banned lexicon, pricing placeholder,
      architecture-lock forbidden strings, ownership-boundary doctrine,
      future-consumer doctrine).
- [ ] Cross-phase doctrine binding to 206-UI-SPEC, 207-UI-SPEC,
      208-UI-SPEC, 209-UI-SPEC, 210-UI-SPEC verified for surfaces that
      involve mutation-class enforcement, run-envelope lineage, operator-
      cockpit consumption, evidence-gate dissolution, and connector
      substrate readiness.
- [ ] Translation gate dissolution explicitly identifies that 209 §
      Downstream row 6 (loop dispatch evidence gate) becomes
      implementable in 211; checker verifies that 211-02 `evidence-
      blocked` blocking-reason and 211-03 `dispatch_status == 'blocked'`
      are the receiving doctrine surfaces.
- [ ] 213.4 carry-forward (D-08..D-15) enumerated in §Downstream UI
      Inheritance Map.
- [ ] Existing P208 cockpit surfaces correctly identified as downstream
      consumers (NOT modified by 211); placeholder-dissolution rules
      respected.

**Approval:** pending

---

## UI-SPEC COMPLETE
