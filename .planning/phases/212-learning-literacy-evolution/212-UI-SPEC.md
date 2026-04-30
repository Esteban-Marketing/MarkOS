---
phase: 212
slug: learning-literacy-evolution
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: learning-substrate-artifact-performance-tenant-overlay-literacy-promotion-anonymization-recommendation
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [212-01, 212-02, 212-03, 212-04, 212-05]
plans_with_ui_surfaces: []
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `data.export` for cross-tenant anonymized exports; `public.claim` for promoted central-literacy entries that surface in tenant-readable canon)
  - 207-UI-SPEC.md (RunApiEnvelope; AgentRunEventType; learning runs link via `agent_run_id` on `ArtifactPerformanceLog`; ApprovalHandoffRecord for admin-review handoffs)
  - 208-UI-SPEC.md (PARENT — Approval Inbox is the consumer for `LiteracyUpdateCandidate` admin review and `LearningRecommendation` approval-gated handoff; Task Board is the consumer for `LearningRecommendation` task-creation handoff; Recovery Center is the consumer for learning-substrate failures; Morning Brief and Weekly Narrative consume learning summaries)
  - 209-UI-SPEC.md (PARENT — `inference_label` literal `inferred` placeholder `future_phase_212` dissolves once 212 learning-fixture evidence ledger lands; learning fixtures inherit `EvidenceMap` substrate; cross-tenant promotion evidence inherits source-quality / freshness posture)
  - 210-UI-SPEC.md (connector substrate consumer — `future_phase_212` PlaceholderBanner dissolves when tenant-profile personalization gains learning-fixture access)
  - 211-UI-SPEC.md (PARENT — loop substrate consumer; `MeasurementHandoff.learning_ready == true` is the binding signal for ArtifactPerformanceLog ingestion; `next_task_kind` literals feed `LearningRecommendation.recommendation_kind`; revenue-feedback narrative provides outcome attribution)
translation_gates_dissolved_by_212:
  - "209 §Downstream UI Inheritance Map — learning-fixture evidence ledger row (`<PlaceholderBanner variant=\"future_phase_212\">` for fixture-evidence surfaces dissolves once 212 publishes ArtifactPerformanceLog + LiteracyUpdateCandidate substrate)"
  - "209 inference-label translation — `inference_label == 'inferred'` placeholder `future_phase_212` for learning-derived fixtures resolves into 212 ArtifactPerformanceLog `lesson_summary` + TenantOverlay `evidence_refs` linkage"
  - "210 §Surface A future-translation row — `<PlaceholderBanner variant=\"future_phase_212\">` for tenant-profile personalization that would leverage learning fixtures dissolves once 212 LearningRecommendation `recommendation_kind == 'experiment_candidate'` lands"
  - "211 §Translation Gates Opened row — `MeasurementHandoff.learning_ready == true` placeholder `future_phase_212` for learning-ledger consumers dissolves once 212 ArtifactPerformanceLog ingests handoff outputs"
translation_gates_opened_by_212:
  - "future_phase_213 — Tenant 0 closeout consumers must prove ArtifactPerformanceLog has logged real outcomes and LiteracyUpdateCandidate has at least one promoted entry on Tenant 0 data; surfaces render `<PlaceholderBanner variant=\"future_phase_213_tenant0\">` until that proof exists"
  - "future_phase_217+ — growth-learning-compatibility-map.md `future_only` rows (`plg`, `abm`, `community`, `events`, `pr`, `partnerships`, `developer_marketing`) bind to P217+ growth-mode surfaces; future surfaces consuming those rows render `<PlaceholderBanner variant=\"future_growth_learning_module\">` until the originating growth phase ships"
  - "future_phase_218..220 — SaaS Marketing OS Strategy growth phases consume the LearningRecommendation `experiment_candidate` kind to seed growth-experiment registries; surfaces render `<PlaceholderBanner variant=\"future_phase_218\">` (or 219/220) until those phases ship"
  - "future_phase_225 — Analytics, attribution, and narrative intelligence phase treats Phase 212 learning objects (ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate, LearningRecommendation) as governed inputs to narrative synthesis, not raw inferred truth; surfaces render `<PlaceholderBanner variant=\"future_phase_225\">` until that phase ships"
---

# Phase 212 — UI Design Contract (no-UI-scope)

> **Phase 212 ships zero UI surfaces.** This document is the explicit no-surface
> declaration for the Learning and Literacy Evolution phase. It exists so that
> gsd-ui-checker, gsd-planner, gsd-executor, and gsd-ui-auditor have an
> unambiguous contract: there is no `app/`, no `components/`, no
> `*.stories.tsx`, no `page.tsx`, no `layout.tsx`, no `*.module.css`, and no
> `*.css` modified or created in any of the five plans (212-01 through 212-05).
>
> What Phase 212 *does* ship is the **learning substrate** —
> **doctrine** (`.planning/literacy/*.md` — 7 docs covering upstream
> readiness, artifact-performance-log contract, tenant-overlay policy,
> literacy-promotion-review, cross-tenant anonymization policy, sample-size
> thresholds, learning-recommendation handoff, and growth-learning
> compatibility map), **typed learning modules** (`lib/markos/learning/*.ts|.cjs`
> — 12 files: contracts, artifact-performance, tenant-overlay, overlay-merge,
> overlay-review, literacy-update-candidate, admin-review, anonymization,
> aggregation, privacy-rules, recommendation, growth-compatibility), **Node
> API handlers** (`api/v1/literacy/{review, recommendations}.js` — 2
> server-side route modules), **migrations** (`supabase/migrations/{
> learning_artifact_performance_log, learning_tenant_overlays,
> learning_literacy_update_candidates, learning_cross_tenant_privacy_rules,
> learning_recommendations}.sql` — 5 DDL files), **CI assertion scripts**
> (`scripts/literacy/{check-learning-upstream-readiness,
> check-learning-architecture-lock, assert-artifact-performance-baseline}.mjs`
> — 3 Node CLI runners), and **tests** (`test/literacy/phase-212/{preflight,
> domain-1..5}/*.test.js`). None of those files compose, import, or render
> any visual primitive from `styles/components.css` or any token from
> `app/tokens.css`. The Node API handlers under `api/v1/literacy/**` are
> server-side route modules (CommonJS or ESM, no JSX), not Next.js App Router
> pages.
>
> However, **every downstream phase (213 Tenant 0 closeout, 217+ growth
> phases, 218-220 SaaS Growth, 225 Analytics, future P208 admin extensions)
> that consumes a Phase 212 learning contract WILL eventually need a UI
> surface** — ArtifactPerformanceLog dashboards, TenantOverlay browsers,
> LiteracyUpdateCandidate admin review queues, cross-tenant promotion
> approval inboxes, LearningRecommendation task-board feeds, anonymization
> audit trails, suppression-list browsers, promotion-lineage timelines,
> privacy-threshold viewers, learning-fixture evidence ledgers per fixture,
> growth-learning-compatibility browsers. This UI-SPEC therefore also serves
> as a forward-looking inheritance map so future UI-SPECs can cite their
> lineage back to the learning doctrine defined here.
>
> Authority chain: DESIGN.md v1.1.0 → 213.x adoption-wave decisions (D-08,
> D-09, D-09b, D-13, D-14, D-15) → 206-UI-SPEC (mutation-class doctrine
> origin: `data.export` for cross-tenant anonymized exports; `public.claim`
> for promoted-literacy public canon entries) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, `ApprovalHandoffRecord`; learning-task runs link via
> `agent_run_id`) → 208-UI-SPEC (operator-cockpit consumers: Approval Inbox
> reads `LiteracyUpdateCandidate` admin-review handoffs and
> `LearningRecommendation` approval-gated kinds; Task Board reads
> `LearningRecommendation.recommendation_kind == 'task_create'`; Recovery
> Center reads learning-substrate failures; Morning Brief and Weekly
> Narrative consume learning summaries) → 209-UI-SPEC (learning-fixture
> evidence ledger row dissolves; `inference_label == 'inferred'` placeholder
> `future_phase_212` resolves into ArtifactPerformanceLog `lesson_summary` +
> TenantOverlay `evidence_refs` linkage; cross-tenant promotion evidence
> inherits source-quality / freshness posture) → 210-UI-SPEC (connector
> substrate; `future_phase_212` PlaceholderBanner for tenant-profile
> personalization dissolves) → 211-UI-SPEC (`MeasurementHandoff.learning_ready`
> binding; `next_task_kind` feeds `LearningRecommendation.recommendation_kind`)
> → this document. Generated by gsd-ui-researcher. Status: draft (checker
> upgrades to approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all five
plans plus context, research, reviews, and validation. The full file set
declared in `files_modified` across 212-01..212-05 is enumerated below, with
surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Learning doctrine | `.planning/literacy/{212-upstream-readiness, artifact-performance-log-contract, tenant-overlay-policy, literacy-promotion-review, cross-tenant-anonymization-policy, sample-size-thresholds, learning-recommendation-handoff, growth-learning-compatibility-map}.md` (8 docs) | 212-01..212-05 | NO |
| Phase validation | `.planning/phases/212-learning-literacy-evolution/212-VALIDATION.md` | 212-01, 212-02, 212-03, 212-04, 212-05 | NO |
| Learning contracts module | `lib/markos/learning/{contracts.ts, contracts.cjs, index.cjs}` | 212-01 | NO (Zod / TS schemas only; CJS bridge) |
| Learning runtime substrate modules | `lib/markos/learning/{artifact-performance.ts, tenant-overlay.ts, overlay-merge.ts, overlay-review.ts, literacy-update-candidate.ts, admin-review.ts, anonymization.ts, aggregation.ts, privacy-rules.ts, recommendation.ts, growth-compatibility.ts}` (11 files) | 212-01..212-05 | NO (server-side TS modules; no JSX) |
| Migrations | `supabase/migrations/{learning_artifact_performance_log, learning_tenant_overlays, learning_literacy_update_candidates, learning_cross_tenant_privacy_rules, learning_recommendations}.sql` (5 files) | 212-01..212-05 | NO (SQL DDL) |
| Node API handlers | `api/v1/literacy/{review.js, recommendations.js}` (2 files) | 212-03, 212-05 | NO (Node serverless route modules; no JSX, no rendering) |
| Learning CI scripts | `scripts/literacy/{check-learning-upstream-readiness, check-learning-architecture-lock, assert-artifact-performance-baseline}.mjs` (3 files) | 212-01 | NO (Node CLI assertion runners; stdout limited to `node --test` output format) |
| Test files | `test/literacy/phase-212/{preflight, domain-1, domain-2, domain-3, domain-4, domain-5}/*.test.js` | 212-01..212-05 | NO |

**Search assertions** (verified during scope confirmation; ripgrep across all
five plan files in `files_modified` blocks):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 212-01..212-05 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 212-01..212-05 | 0 matches |
| `files_modified` glob `components/**` across 212-01..212-05 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 212-01..212-05 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 212-01..212-05 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 212-01..212-05 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |

**Disambiguation note (Node API path syntax):** The 2 files under
`api/v1/literacy/**` (`review.js`, `recommendations.js`) are flat versioned
API handlers (no JSX, no rendering, no Next.js App Router pages). They emit
JSON envelopes only. Visual rendering of LiteracyUpdateCandidate review
queues, LearningRecommendation feeds, ArtifactPerformanceLog timelines, and
TenantOverlay state is downstream phases' responsibility (P208 cockpit
extensions, P213 Tenant 0 closeout, P217+ growth modules, P225 narrative
intelligence).

**Disambiguation note (existing surfaces NOT modified by 212):** The
operator-cockpit surfaces shipped in P208 (`app/(markos)/operations/{tasks,
approvals, recovery, narrative}/page.tsx`) read 212 outputs as downstream
consumers. P208 already authors `<PlaceholderBanner variant="future_phase_212">`
in any cockpit section that would consume learning fixtures. Phase 212 ships
the substrate; P208's `future_phase_212` placeholder banners dissolve once
212 lands, but **212 itself does not modify any P208 file** (the placeholder
dissolution requires a future P208-extension phase). Likewise, P209's
learning-fixture evidence ledger row in §Downstream UI Inheritance Map and
P210's `future_phase_212` placeholder for tenant-profile personalization
become eligible for surface implementation once 212 substrate exists, but
those surface implementations are downstream phases' responsibility, not
212's.

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase is pure
learning-substrate authoring + contracts + Node API handlers + migrations +
CI scripts + tests. There are no visual decisions to specify, no typography
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
| Money display posture | not applicable — money flows are not directly authored by 212; revenue context inherits from 211 `RevenueFeedbackLink` (`revenue_amount`, `currency`) and is referenced by `ArtifactPerformanceLog.evidence_refs`; rendering of monetary outcome posture is downstream phases' responsibility (P208 Weekly Narrative consumes; future P217 / P225 dashboards extend) |
| Table authoring posture | not applicable — registry tables in `.planning/literacy/*.md` are GitHub-flavored Markdown rendered by Markdown viewers, not React tables |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by the `evidence_refs` and `lesson_summary` columns on `ArtifactPerformanceLog` per CLAUDE.md Pricing Engine Canon when a learned outcome references a pricing-pending artifact; appears verbatim only when the upstream loop substrate (P211 `MarketingArtifact.pricing_context_ref`) carried the placeholder; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/literacy/**` are Node serverless route modules. They emit JSON envelopes (LiteracyUpdateCandidate review records, LearningRecommendation handoff records) and accept POST mutations gated by admin-review approval-token. They DO NOT render HTML, JSX, or any visual surface. Future UI consumers parse the JSON; rendering is downstream. |
| Doctrine prose posture | `.planning/literacy/*.md` doctrine docs are markdown only; no rendered components inside. They are read by humans (auditor, planner, executor, reviewer) and parsed by CI scripts (`scripts/literacy/*.mjs`) for forbidden-string and contract-baseline assertions. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 212 emits no CSS, no JSX, no terminal output (the
learning CI scripts are CI-only assertion runners with stdout limited to
`node --test` output format — no human-facing tabular display; the Node API
handlers emit JSON envelopes, not rendered markup). Every spacing,
typography, and color decision is deferred to the downstream phases that
will surface this learning substrate.

---

## Translation Gate Dissolution and Opening

This is a **load-bearing section unique to Phase 212** because 212 closes
several upstream translation gates and opens new downstream ones. Every
future surface that consumes 212 substrate inherits both the dissolved-gate
status (no longer needs `<PlaceholderBanner variant="future_phase_212">`)
and the newly-opened-gate status (must render `<PlaceholderBanner
variant="future_phase_213_tenant0">`, `<PlaceholderBanner
variant="future_growth_learning_module">`, `<PlaceholderBanner
variant="future_phase_218">` (or 219/220), or `<PlaceholderBanner
variant="future_phase_225">` until those phases ship).

### Gates dissolved by Phase 212 (downstream surfaces remove these placeholders)

| Upstream surface | Placeholder authored | Dissolution rule once 212 ships |
|------------------|---------------------|----------------------------------|
| 209-UI-SPEC §Downstream UI Inheritance Map (learning-fixture evidence ledger) | `<PlaceholderBanner variant="future_phase_212">` for any per-fixture evidence-ledger surface that would render learning-derived `EvidenceMap` rows | 212-01-01 publishes `ArtifactPerformanceLog.evidence_refs` and 212-02-01 publishes `TenantOverlay.evidence_refs` + `provenance_ref`. Future learning-fixture evidence ledger surfaces compose `<EvidenceSummary />` (209) over either of those evidence-ref arrays, AND surface the `lesson_summary` (212-01-01) field as the fixture's "what was learned" panel. The 209 §Downstream row dissolves; surfaces stop rendering the placeholder once they bind to 212 contracts. |
| 209-UI-SPEC `inference_label == 'inferred'` placeholder (learning-derived inferences) | When `inference_label == 'inferred'` AND the source of inference is a learning fixture, `<PlaceholderBanner variant="future_phase_212">` rendered until 212 makes the source explicit | 212-01-01 `ArtifactPerformanceLog.lesson_summary` + `confidence_score` provide the explicit source for any `inferred` claim derived from learning. 212-02-01 `TenantOverlay.evidence_refs` + `provenance_ref` provide the lineage. Future surfaces compose the inference-label chip with a deep link to the originating ArtifactPerformanceLog row OR TenantOverlay row, and the placeholder dissolves. |
| 210-UI-SPEC §Surface A onboarding (`<PlaceholderBanner variant="future_phase_212">` for tenant-profile personalization) | "[info] Personalized recommendations require Phase 212 learning fixtures. Defaults shown for now." (rendered when tenant-profile resolution would otherwise leverage learning fixtures) | 212-05-01 `LearningRecommendation` records (`recommendation_kind == 'experiment_candidate'`, `recommendation_kind == 'connector_fix'`) provide the runnable personalization signal. Once 212 ships, the 210 onboarding surface composes `LearningRecommendation` chips for personalized connector recommendations (gated by `LearningRecommendation.status` readiness) instead of placeholder-only. |
| 211-UI-SPEC §Translation Gates Opened (loop measurement → learning ledger) | `MeasurementHandoff.learning_ready == true` rows compose `<PlaceholderBanner variant="future_phase_212">` until P212 ships its learning ledger | 212-01-01 `ArtifactPerformanceLog` ingests P211 `MeasurementHandoff` outputs via `artifact_id` foreign key, AND links to the originating run via `agent_run_id`. The `expected_outcome` and `actual_outcome` fields on `ArtifactPerformanceLog` are seeded from `MeasurementHandoff.expected_outcome` and `MeasurementHandoff.actual_outcome`. The `lesson_summary` field is seeded from the equivalent narrative-derivable summary on `MeasurementHandoff`. Future surfaces dissolve the placeholder by binding to `ArtifactPerformanceLog` directly. |
| 208-UI-SPEC Approval Inbox (handoff-kind filter — learning admin-review variant) | Existing P208 inbox renders all 4 `handoff_kind` literals from 207, but learning admin-review approvals (`LiteracyUpdateCandidate` admin promotion review, `LearningRecommendation` approval-gated kinds) compose `<PlaceholderBanner variant="future_phase_212">` until 212 ships | Once 212 ships, approval inbox renders learning-originated approval items with the `LiteracyUpdateCandidate.candidate_id`, `LiteracyUpdateCandidate.anonymized_pattern`, `LiteracyUpdateCandidate.evidence_summary`, `LiteracyUpdateCandidate.average_confidence_score`, and `LiteracyUpdateCandidate.promoted_target` linked through `ApprovalHandoffRecord.task_ref`. Mutation-class binding: most learning-promotion approvals fall under `public.claim` (per 206-02) when `promoted_target` resolves to a tenant-readable canon surface (since the promoted entry becomes part of central literacy that other tenants will consume); ALSO `data.export` (dual-class) when the promotion involves cross-tenant export of anonymized aggregates. |

### Gates opened by Phase 212 (future surfaces must render these placeholders)

| Downstream consumer (future phase) | Placeholder required | Dissolution phase |
|------------------------------------|---------------------|-------------------|
| Phase 213 Tenant 0 closeout consumers | `<PlaceholderBanner variant="future_phase_213_tenant0">` rendered when a Tenant 0 readiness surface needs to assert that ArtifactPerformanceLog has logged real outcomes AND LiteracyUpdateCandidate has at least one promoted entry on Tenant 0 data | P213 |
| Growth-learning-compatibility consumers (PLG, ABM, community, events, PR, partnerships, developer marketing) | `<PlaceholderBanner variant="future_growth_learning_module">` rendered when a future surface attempts to consume `growth-learning-compatibility-map.md` rows whose status is `future_only` | P217+ (per 212-05-02 doctrine) |
| Phase 218-220 SaaS Marketing OS Strategy consumers | `<PlaceholderBanner variant="future_phase_218">` (or 219/220 per growth area) rendered when a SaaS-growth surface needs to seed an experiment registry from `LearningRecommendation.recommendation_kind == 'experiment_candidate'` rows OR to seed a strategy-refresh from `recommendation_kind == 'strategy_refresh'` rows | P218, P219, P220 |
| Phase 225 Analytics, attribution, and narrative intelligence consumers | `<PlaceholderBanner variant="future_phase_225">` rendered when a narrative-synthesis surface needs to treat 212 learning objects (ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate, LearningRecommendation) as governed inputs to narrative output | P225 |
| Phase 208 admin extensions (LiteracyUpdateCandidate review queue, TenantOverlay browser, ArtifactPerformanceLog dashboard, anonymization audit trail, suppression list browser, promotion lineage timeline) | `<PlaceholderBanner variant="future_phase_212_admin_extension">` rendered by any admin surface that would consume 212 substrate but the P208-extension phase that adds those surfaces has not yet shipped | future P208-extension phase (TBD; not Phase 212) |

**Critical guardrail:** Phase 212 itself does NOT author any
`<PlaceholderBanner>` component. It only specifies which placeholder
variants downstream phases must render until their respective dependencies
ship. The placeholder component itself is owned by the surface that renders
it (typically the operator cockpit in P208 or a future admin / marketing-site
surface in P213+, P217+, or P225).

---

## Downstream UI Inheritance Map

This is the load-bearing section of this document. When a future phase ships
a UI surface that consumes a Phase 212 learning contract, that phase's
UI-SPEC.md MUST cite the row below that authorizes its surface family. This
binds the visual contract back to the learning doctrine and prevents drift.

All downstream UI surfaces below MUST author to **DESIGN.md v1.1.0** and
inherit the 213.x adoption-wave decisions (carried forward from CONTEXT.md
decisions D-08 through D-15 of the 213.3 / 213.4 waves):

| 213.x Decision | Carry-forward rule for any future surface that consumes 212 doctrine |
|----------------|---------------------------------------------------------------------|
| D-08 (token-only) | Zero inline hex literals; every color via `var(--color-*)`; every spacing via `var(--space-*)`; every typography via DESIGN.md `typography.*` token. Performance-log measurement-status badges, attribution-status badges, overlay review-status chips, candidate decision badges, recommendation-kind chips, recommendation-priority chips, anonymization denial-reason chips all token-only. |
| D-09 (mint-as-text) | Protocol Mint `#00D9A3` allowed as text via `--color-primary-text` for `.c-button--tertiary` link CTAs and `.c-chip-protocol` IDs only; never as fill on surfaces larger than a button or chip. Performance-log-ID copy-link CTAs, overlay-ID chips, candidate-ID chips, recommendation-ID chips, source-overlay-ref chips use mint-as-text. |
| D-09b (`.c-notice` mandatory) | Every measurement-status notice (`expected_only`, `measured`, `degraded`, `missing_attribution`), every attribution-status notice (`ready`, `degraded`, `unavailable`), every overlay review-status notice (`proposed`, `active`, `expiring`, `suppressed`, `rejected`), every candidate decision notice (`proposed`, `needs_evidence`, `approved`, `rejected`, `promoted`), every privacy-denial notice (denylist breach), every threshold-failure notice (sample-size or confidence below gate) composes `.c-notice c-notice--{info,warning,success,error}` from `styles/components.css`. No local `.banner`/`.alert`/`.warning`/`.noticeBar` classes. |
| D-13 (`.c-card--feature` reserved) | `.c-card--feature` is reserved for hero panels in `404-workspace` + `213.5` marketing. Any future learning surface (performance-log dashboard, overlay browser, candidate review queue, recommendation feed, anonymization audit trail, suppression list, promotion lineage timeline, growth-learning-compatibility browser, learning-fixture evidence ledger) uses `.c-card` default — never `.c-card--feature`. |
| D-14 (no `.c-table` primitive) | Any future tabular surface (performance-log list, overlay list, candidate queue, recommendation feed, anonymization audit log, suppression list, promotion lineage history, growth-compatibility browser) uses vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 214+. |
| D-15 (selective extraction) | When a future phase extracts a learning-substrate read pattern into a reusable component, the extraction is selective: pages co-locate with their learning-record read first, primitives extract only when reuse is proven across ≥2 surfaces (e.g. measurement-status badge in P208 cockpit + P213 Tenant 0 readiness panel; recommendation-kind chip in P208 Task Board + P218 growth-experiment registry). |

### Future-surface inheritance table

| Future surface (illustrative; not implemented in 212) | Originating Phase 212 doctrine | Phase that ships the surface | Inheritance citation required |
|-------------------------------------------------------|-------------------------------|-------------------------------|-------------------------------|
| ArtifactPerformanceLog dashboard (per-tenant performance overview) | `.planning/literacy/artifact-performance-log-contract.md` (212-01-01) + `ArtifactPerformanceLog` field set | P208 admin extension or P213 Tenant 0 closeout | Future UI-SPEC must cite `212-UI-SPEC.md §Downstream UI Inheritance Map` and bind to `ArtifactPerformanceLog` fields verbatim (`performance_log_id`, `tenant_id`, `artifact_id`, `artifact_type`, `channel`, `audience_segment`, `funnel_stage`, `expected_outcome`, `actual_outcome`, `measurement_window_days`, `measurement_status`, `attribution_status`, `evidence_refs`, `agent_run_id`, `dispatch_attempt_id`, `lesson_summary`, `confidence_score`, `next_task_needed`, `created_at`, `updated_at`). The four `measurement_status` literals (`expected_only`, `measured`, `degraded`, `missing_attribution`) render as `.c-badge--{info,success,warning,error}` mapping. The three `attribution_status` literals (`ready`, `degraded`, `unavailable`) render as `.c-badge--{success,warning,error}` mapping. `confidence_score` renders as a percent-formatted chip with token-only color thresholds (≥0.70 success, 0.50-0.69 warning, <0.50 error). `expected_outcome` and `actual_outcome` render as paired numeric column (token-only, tabular-numerals JetBrains Mono per DESIGN.md typography rule). `evidence_refs` chips compose `.c-chip-protocol` (mint-as-text per D-09) deep-linked to 209 `<EvidenceSummary />`. `agent_run_id` renders as deep-link chip to 207 RunApiEnvelope detail. `dispatch_attempt_id` renders as deep-link chip to 211 DispatchAttempt detail. D-14 vanilla-table recipe required. Cross-binding: 207 `RunApiEnvelope` via `agent_run_id`, 209 `EvidenceMap` via `evidence_refs`, 211 `DispatchAttempt` via `dispatch_attempt_id`, 211 `MeasurementHandoff` as the upstream feed. |
| TenantOverlay browser (per-tenant local-learning surface) | `.planning/literacy/tenant-overlay-policy.md` (212-02-01) + `TenantOverlay` field set | P208 admin extension or future enterprise admin | Future UI-SPEC must surface the 14-field `TenantOverlay` envelope verbatim (`overlay_id`, `tenant_id`, `discipline`, `lesson_type`, `overlay_payload`, `confidence_score`, `evidence_refs`, `provenance_ref`, `review_status`, `suppression_reason`, `expires_at`, `review_by`, `created_at`, `updated_at`); the five `review_status` literals (`proposed`, `active`, `expiring`, `suppressed`, `rejected`) verbatim as state badges with `.c-badge--{info,success,warning,error,error}` mapping. `expires_at` renders with relative-time token formatting; rows where `expires_at` < now AND `review_status == 'active'` compose `.c-notice c-notice--warning` "[warn] Overlay expired — review required". `suppression_reason` renders inline as `.c-notice c-notice--info` when present. `confidence_score` renders as percent-formatted chip with token-only color thresholds. `evidence_refs` chips compose `.c-chip-protocol` deep-linked to 209 `<EvidenceSummary />`. `provenance_ref` renders as deep-link chip to MIR lineage record (per 212-02 key_links). `overlay_payload` renders as a `.c-code-block` with safe JSON formatting. D-14 vanilla-table recipe for the list view. Cross-binding: 209 `EvidenceMap` via `evidence_refs`, MIR lineage substrate via `provenance_ref`. |
| LiteracyUpdateCandidate admin review queue (cross-tenant promotion review surface) | `.planning/literacy/literacy-promotion-review.md` (212-03-01) + `LiteracyUpdateCandidate` field set | P208 Approval Inbox extension (P208-extension phase, NOT 212) | Future UI-SPEC must surface the 12-field `LiteracyUpdateCandidate` envelope verbatim (`candidate_id`, `source_overlay_refs`, `anonymized_pattern`, `sample_size`, `supporting_artifact_count`, `evidence_summary`, `average_confidence_score`, `reviewer_id`, `decision`, `promoted_target`, `created_at`, `updated_at`); the five review-state literals (`proposed`, `needs_evidence`, `approved`, `rejected`, `promoted`) verbatim as decision badges with `.c-badge--{info,warning,success,error,success}` mapping. `anonymized_pattern` renders as a read-only `.c-code-block` panel; UI must NOT allow direct editing of the anonymized pattern (the anonymization is the safety boundary). `evidence_summary` renders as a `.c-card` panel. `sample_size` and `supporting_artifact_count` and `average_confidence_score` render as a paired threshold-status panel comparing to `.planning/literacy/sample-size-thresholds.md` (`sample_size >= 3`, `supporting_artifact_count >= 5`, `average_confidence_score >= 0.70`); below-threshold rows render `.c-notice c-notice--warning` "[warn] Below promotion threshold — local-only". `source_overlay_refs[]` chips compose `.c-chip-protocol` deep-linked to TenantOverlay browser (above). `promoted_target` renders as deep-link chip to the literacy canon surface that the entry would become. `reviewer_id` renders as deep-link chip to operator profile. Approve / Reject / Request-evidence actions compose `.c-modal` + `.c-button--destructive` Reject + `.c-button--primary` Approve + `.c-button--tertiary` Request more evidence; mutation-class binding per 206-02: `public.claim` for the approve action (since promoted entry enters central literacy and surfaces in tenant-readable canon for ALL tenants), DUAL-CLASS with `data.export` if the promotion involves cross-tenant anonymized aggregates. The 213-style stricter approval mode applies (typically `dual_approval` for `public.claim`). D-14 vanilla-table recipe for the queue; per-candidate detail composes `.c-card`. Cross-binding: 206 `public.claim` + `data.export` mutation-class doctrine, 207 `ApprovalHandoffRecord` via reviewer-handoff lineage, 209 `EvidenceMap` via supporting-evidence ledger. |
| LearningRecommendation Task Board feed (P208 Task Board consumer for `task_create` and other recommendation-kind handoff) | `.planning/literacy/learning-recommendation-handoff.md` (212-05-01) + `LearningRecommendation` field set | P208 Task Board (208-03 — already shipped; consumes learning-generated tasks once 212 lands) | Future UI-SPEC update to 208-03 must remove any `<PlaceholderBanner variant="future_phase_212">` for learning-originated tasks and read 212 `LearningRecommendation.recommendation_kind` + `task_id`. The 12-field `LearningRecommendation` envelope (`recommendation_id`, `tenant_id`, `source_type`, `source_ref`, `recommendation_kind`, `priority`, `owner_role`, `status`, `expires_at`, `evidence_refs`, `task_id`, `suppression_reason`) renders. The six `recommendation_kind` literals (`task_create`, `strategy_refresh`, `research_refresh`, `pricing_review`, `connector_fix`, `experiment_candidate`) render as recommendation-class chips. Each chip's color follows the recipe: `task_create` (info), `strategy_refresh` (info), `research_refresh` (info), `pricing_review` (warning), `connector_fix` (error), `experiment_candidate` (success). `priority` renders as priority chip (P0..P4 mapping per 207). `owner_role` renders as role chip (text-only, no fill). `expires_at` renders with relative-time token formatting; expired rows compose `.c-notice c-notice--warning`. `task_id` renders as deep-link chip to the P208 Task Board task. `evidence_refs[]` chips deep-link to 209 `<EvidenceSummary />`. `suppression_reason` renders inline as `.c-notice c-notice--info` when present. The recommendation feed itself uses D-14 vanilla-table recipe. Cross-binding: 208 task system owns the task envelope; 212 only generates the recommendation references. The mutation-class binding for actions on a recommendation is governed by the underlying linked task (which inherits its own mutation-class from 206-02). |
| Cross-tenant promotion approval inbox extension (P208 Approval Inbox handoff variant) | `.planning/literacy/literacy-promotion-review.md` (212-03-01) + 207 `ApprovalHandoffRecord` + 206 `public.claim` + `data.export` mutation-class doctrine | P208 Approval Inbox extension (P208-extension phase, NOT 212) | Future UI-SPEC update to 208-04 must add the learning-promotion variant: when `ApprovalHandoffRecord.handoff_kind == 'approval'` AND the linked record is a `LiteracyUpdateCandidate`, the approval-token viewer composes the candidate's `anonymized_pattern` preview + `evidence_summary` + threshold-status panel (sample-size / confidence / supporting-artifact-count) + `promoted_target` deep-link + reviewer rationale field. Mutation-class binding per 206-02: `public.claim` for the approve action (promoted entry enters tenant-readable central literacy canon), DUAL-CLASS with `data.export` if the promotion includes cross-tenant anonymized aggregate export. `.c-modal` + `.c-button--destructive` confirm gate required because mutation-class default-approval-mode is `dual_approval` for `public.claim`. The override path inherits 209-04 doctrine: if the candidate's `evidence_summary` does not meet 209 source-quality posture, the operator must record an `override_reason` ≥ 10 chars, and the override binds to the `LiteracyUpdateCandidate.decision` rationale permanently. |
| Anonymization audit trail (admin-visible privacy-denial log) | `.planning/literacy/cross-tenant-anonymization-policy.md` (212-04-01) + `lib/markos/learning/privacy-rules.ts` denial events | P208 admin extension or future enterprise compliance surface | Future UI-SPEC must surface a per-event audit trail with: timestamp, tenant_id (if applicable; redacted for cross-tenant denials), denial_reason (one of the 8 denylist literals: `tenant identifiers`, `person names`, `customer names`, `contact details`, `raw pricing`, `support transcripts`, `campaign copy that still reveals tenant identity`, `proprietary operator notes`), threshold_breach (one of: `sample_size_below_3`, `supporting_artifact_count_below_5`, `average_confidence_below_0.70`), source_overlay_ref, reviewer_id (if any). Denial events render as immutable rows (mirroring 209 evidence immutability). The eight denylist literals render as `.c-badge--error` chips verbatim. Threshold-breach literals render as `.c-badge--warning` chips. D-14 vanilla-table recipe required. Cross-binding: 206 `data.export` mutation-class doctrine for any export of the audit trail itself; 209 immutable-evidence pattern carry-forward. |
| Suppression list browser (admin surface for suppressed overlays AND suppressed recommendations) | `.planning/literacy/tenant-overlay-policy.md` (212-02-01) + `.planning/literacy/learning-recommendation-handoff.md` (212-05-01) + `TenantOverlay.suppression_reason` + `LearningRecommendation.suppression_reason` | P208 admin extension or future enterprise admin | Future UI-SPEC must surface two tabs: "Suppressed overlays" (reads `TenantOverlay` rows where `review_status == 'suppressed'` OR `expires_at < now`) and "Suppressed recommendations" (reads `LearningRecommendation` rows where `status == 'suppressed'` OR `expires_at < now`). Each row renders the `suppression_reason` as `.c-notice c-notice--info` body. Reactivation actions (un-suppress) compose `.c-modal` + `.c-button--destructive` confirm gate (because reactivating a suppressed overlay can re-introduce learning that was deliberately silenced). D-14 vanilla-table recipe. Cross-binding: 206 mutation-class doctrine — un-suppress action binds to the underlying record's mutation-class (typically `public.claim` if the overlay would resurface in central literacy after un-suppression); 207 `ApprovalHandoffRecord` for the approval gate. |
| Promotion lineage timeline (per-promoted-canon-entry source-trail) | `.planning/literacy/literacy-promotion-review.md` (212-03-01) + 212-02 MIR-lineage carry + `LiteracyUpdateCandidate.source_overlay_refs` + 209 evidence-trail | P208 admin extension or future enterprise compliance | Future UI-SPEC must surface a per-promoted-entry timeline: the central-literacy canon entry at the head, walked back through `LiteracyUpdateCandidate.candidate_id` (with decision rationale), through `source_overlay_refs[]` (each TenantOverlay row's evidence and provenance), through `ArtifactPerformanceLog.evidence_refs` (the original outcome that seeded the lesson), through 209 `EvidenceMap` (the source-quality + freshness ledger), through 211 `MarketingArtifact.evidence_refs` and `MeasurementHandoff` (the original loop run), through 207 `RunApiEnvelope` (the originating agent run). Each timeline node composes `.c-card` with `.c-status-dot--{live,error,*}` for state. No glow, no gradient on edges (DESIGN.md elevation rule). Reduced-motion freezes any auto-traversal animation per DESIGN.md motion rule. The full chain MUST cite all five inheritance maps verbatim (206 mutation-class on the promote action, 207 run lineage, 209 evidence trail, 211 loop substrate, 212 learning ledger). |
| Privacy threshold viewer (admin surface for sample-size / confidence thresholds) | `.planning/literacy/sample-size-thresholds.md` (212-04-01) + `.planning/literacy/cross-tenant-anonymization-policy.md` (212-04-01) | P208 admin extension or future enterprise compliance | Future UI-SPEC must surface a read-only panel of the active thresholds: `sample_size >= 3`, `supporting_artifact_count >= 5`, `average_confidence_score >= 0.70`. Renders as a `.c-card` panel with each threshold formatted as a key-value pair (label + value chip + threshold-rationale prose). The eight denylist literals (per anonymization policy) render as `.c-badge--error` chips below the threshold panel. NEVER editable from this surface — threshold changes route through doctrine update + admin promotion review per the standard 212-04 governance posture. The surface itself is read-only. Cross-binding: 206 `data.export` mutation-class doctrine for any export of the threshold configuration. |
| Learning-fixture evidence ledger per fixture (dissolves 209 §Downstream row 4) | `.planning/literacy/artifact-performance-log-contract.md` (212-01-01) + `ArtifactPerformanceLog.evidence_refs` + `lesson_summary` + 209 `EvidenceMap` | P208 admin extension or P209-evidence consumer phase (NOT 212) | Future UI-SPEC must dissolve the 209 §Downstream learning-fixture evidence-ledger placeholder row and render the actual fixture-evidence ledger: per-fixture, compose `<EvidenceSummary />` (209) over `ArtifactPerformanceLog.evidence_refs` AND `TenantOverlay.evidence_refs` (when the fixture has been promoted to a tenant overlay). The fixture's "what was learned" panel reads `ArtifactPerformanceLog.lesson_summary`. The fixture's confidence reads `ArtifactPerformanceLog.confidence_score`. The fixture's source reads `ArtifactPerformanceLog.agent_run_id` deep-link to 207. When the fixture has been promoted to central literacy (`LiteracyUpdateCandidate.decision == 'promoted'`), surface the candidate-id deep link. Cross-binding: 209 evidence summary, 207 RunApiEnvelope, 211 DispatchAttempt + MeasurementHandoff, 212 ArtifactPerformanceLog + TenantOverlay + LiteracyUpdateCandidate. |
| Future-growth-learning compatibility browser (admin) | `.planning/literacy/growth-learning-compatibility-map.md` (212-05-02) + 7 future-only rows | P217+ growth phases or future enterprise admin | Future UI-SPEC must surface the seven growth-module rows verbatim (`plg`, `abm`, `community`, `events`, `pr`, `partnerships`, `developer_marketing`); every row renders the exact status `future_only` per 212-05-02 acceptance criterion. Each row composes `.c-card` with `.c-badge--info` "[info] future_only" status and a description of which learning primitives it would consume once activated (`required_signal`, `activation_rule`). NEVER renders the rows as runnable until the corresponding growth phase ships (P218-P220 SaaS Growth phases per ROADMAP / REQUIREMENTS traceability, plus P226-P227 future commercial-engine phases). Until then, all rows render `<PlaceholderBanner variant="future_growth_learning_module">` as a guard. |
| Tenant 0 learning-readiness panel (dogfood proof) | All of 212 doctrine + 213 Tenant 0 closeout doctrine | P213 Tenant 0 surface | Future UI-SPEC must surface a "Learning readiness" panel for Tenant 0: rows for `ArtifactPerformanceLog` (with `measurement_status == 'measured'`) count, `TenantOverlay` (with `review_status == 'active'`) count, `LiteracyUpdateCandidate` (with `decision == 'promoted'`) count, `LearningRecommendation` (with `status == 'open'`) count, anonymization-denial-event count (last 30 days), suppression-event count (last 30 days). Each row's status badge is computed from the underlying learning record state. The panel cites `212-UI-SPEC.md §Downstream UI Inheritance Map` row 12 as authority. |
| Recovery Center learning-failure variant (P208 Recovery Center extension) | `.planning/literacy/artifact-performance-log-contract.md` (212-01-01) + `ArtifactPerformanceLog.measurement_status == 'missing_attribution'` + `attribution_status == 'unavailable'` + `LearningRecommendation.status == 'expired'` | P208 Recovery Center extension (P208-extension phase, NOT 212) | Future UI-SPEC update to 208-05 must add the learning-failure variant: `ArtifactPerformanceLog` rows where `measurement_status == 'missing_attribution'` OR `attribution_status == 'unavailable'` render as recovery items with failure-family `learning_attribution_unavailable`. `LearningRecommendation` rows where `status == 'expired'` AND no follow-up exists render as recovery items with failure-family `recommendation_unactioned`. Recovery actions compose `.c-modal` + `.c-button--destructive` confirm gate (re-running attribution may surface partial data). Cross-binding: 206 mutation-class doctrine (`data.export` for re-export of attribution evidence; `connector.mutate` if attribution recovery requires connector re-sync per 210), 207 `RunApiEnvelope` for re-run linkage, 209 evidence-status doctrine. |

**Critical guardrail:** The downstream-inheritance table above is
**illustrative**, not a phase-implementation schedule. None of those
surfaces are implemented in Phase 212. They are listed so that when each
subsequently lands as a real phase, that phase's UI-SPEC.md can cite this
document as the doctrine origin instead of re-deriving learning-record /
state-literal / threshold-value / denylist-literal field names from
scratch.

**Cross-phase doctrine binding:** Several surfaces above (LiteracyUpdateCandidate
admin review queue, cross-tenant promotion approval inbox extension,
promotion lineage timeline, anonymization audit trail) inherit from FIVE
doctrine maps simultaneously: 206 (mutation-class doctrine — `public.claim`
for promoted-canon entries, `data.export` for cross-tenant anonymized
exports), 207 (runtime envelope — which run created which learning record +
state machine), 209 (evidence doctrine — what evidence looks like + how it
binds to learning fixtures + how source-quality + freshness gate
promotions), 211 (loop substrate — the upstream `MeasurementHandoff` and
`MarketingArtifact` envelope that seeds learning), and 212 (learning
substrate — the record envelope + state-literal vocabulary that ties them
together with privacy + admin-review + recommendation-handoff governance).
Any future surface that authors a `LiteracyUpdateCandidate` admin-review
mutation MUST cite all five. The five inheritance maps compose cleanly:
206 delivers the **mutation-class doctrine**, 207 delivers the **runtime
envelope**, 209 delivers the **evidence doctrine**, 211 delivers the
**loop substrate**, and 212 delivers the **learning substrate** that ties
them into one governed learning ledger.

---

## Copywriting Contract

**End-user / surface copy: not applicable.** Phase 212 emits no copy to any
human surface.

**Doctrine prose copy** in `.planning/literacy/*.md` and the learning
contract / migration / runtime modules is governed by:

- The CLAUDE.md banned lexicon (`synergy`, `leverage`, `empower`, `unlock`,
  `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`,
  `cutting-edge`, `innovative`, `game-changer`, `next-generation`,
  `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` as
  softener — and no exclamation points).
- Engineering-readability: short sentences, concrete contract field names,
  named owning plans. No marketing voice. No hedging language ("we strive
  to", "best-effort"). Every contract row asserts a specific field, literal,
  threshold, or test-gate procedure.
- Pricing-placeholder rule: `{{MARKOS_PRICING_ENGINE_PENDING}}` is accepted
  by `ArtifactPerformanceLog.evidence_refs` and `lesson_summary` only when
  the upstream loop substrate (P211 `MarketingArtifact.pricing_context_ref`)
  carried the placeholder. 212 does not introduce new placeholder paths;
  it inherits from the upstream contract per CLAUDE.md Pricing Engine Canon.
- Forbidden architecture-lock strings (rejected by
  `scripts/literacy/check-learning-architecture-lock.mjs` per 212-01-00
  acceptance criterion AC.3): `promote raw tenant copy`, `auto-promote
  literacy`, `silent prompt drift`. The script also rejects the four
  test-substrate-mismatch strings inherited from the wider GSD architecture
  lock: `vitest`, `playwright`, `.test.ts`, `route.ts`. None of these
  strings may appear in 212 doctrine markdown, in 212 runtime modules, or
  in 212 test fixtures.
- Ownership-boundary copy: every reference to upstream substrate in 212
  doctrine prose must explicitly defer ownership to the originating phase
  per the `integrates_with` declarations on each plan (RUN from P207, EVD
  from P209, LOOP from P211, COMP from P206, TASK from P208). 212 doctrine
  never claims to "own" any of those families — only to consume their
  substrate via foreign-key references (`agent_run_id` to P207 AgentRun,
  `evidence_refs[]` to P209 EvidenceMap, `dispatch_attempt_id` to P211
  DispatchAttempt, `task_id` to P208 task, etc.).
- Privacy-denylist copy: the eight denylist literals in
  `cross-tenant-anonymization-policy.md` MUST appear verbatim per
  212-04-01 AC: `tenant identifiers`, `person names`, `customer names`,
  `contact details`, `raw pricing`, `support transcripts`, `campaign copy
  that still reveals tenant identity`, `proprietary operator notes`. No
  rephrasing, no abbreviation, no synonyms.
- Threshold-value copy: the three threshold strings in
  `sample-size-thresholds.md` MUST appear verbatim per 212-04-01 AC:
  `sample_size >= 3`, `supporting_artifact_count >= 5`,
  `average_confidence_score >= 0.70`. The threshold values `3`, `5`, and
  `0.70` MUST appear verbatim in `lib/markos/learning/privacy-rules.ts`
  per the same AC.
- Future-only copy: the seven growth-module rows in
  `growth-learning-compatibility-map.md` MUST use the exact status string
  `future_only` per 212-05-02 AC. No row may use synonyms like `planned`,
  `coming_soon`, `future_phase`, or `future_consumer` (which is the 211
  vocabulary; 212 uses `future_only` per its research doctrine).

**Node API error envelopes:** When `api/v1/literacy/{review,
recommendations}.js` return error responses, the JSON envelope `{
error_code, error_message }` follows these rules:

- `error_code` is a stable kebab-case identifier (e.g.
  `candidate-not-found`, `candidate-below-sample-threshold`,
  `candidate-below-confidence-threshold`,
  `candidate-below-supporting-artifact-threshold`,
  `candidate-anonymization-denied-tenant-identifiers`,
  `candidate-anonymization-denied-person-names`,
  `candidate-anonymization-denied-customer-names`,
  `candidate-anonymization-denied-contact-details`,
  `candidate-anonymization-denied-raw-pricing`,
  `candidate-anonymization-denied-support-transcripts`,
  `candidate-anonymization-denied-campaign-identity`,
  `candidate-anonymization-denied-operator-notes`,
  `direct-promotion-denied-single-tenant-raw-lesson`,
  `recommendation-not-found`, `recommendation-expired`,
  `recommendation-customer-facing-mutation-blocked`,
  `overlay-not-found`, `overlay-expired-suppressed`,
  `overlay-confidence-below-merge-threshold`).
- `error_message` is a short engineering-grade sentence. No marketing
  voice. No hedging. No banned-lexicon terms. No exclamation points. No
  emoji. Bracketed-glyph prefixes (`[err]`, `[warn]`, `[block]`) reserved
  for downstream CLI / UI surfaces — JSON envelopes themselves carry only
  the structured code + message fields.
- The error message for the direct-promotion denial endpoint (per 212-03-01
  AC) MUST contain the exact substring `single tenant raw lesson` so that
  the CI assertion script and the architecture-lock test can assert it
  verbatim.
- The error message for recommendation customer-facing-mutation denials
  (per 212-05-01 AC) MUST contain the exact substring `must not apply
  customer-facing mutations directly` so that the architecture-lock test
  asserts it verbatim.
- These rules apply to API envelopes shipped by 212 because consumers
  (P208 cockpit extension, P213 Tenant 0 closeout, P217+ growth surfaces,
  P225 narrative intelligence) may surface `error_message` verbatim in
  their UX, and surfacing a banned-lexicon string would violate the
  downstream surface's DESIGN.md Pillar 1 audit.

These are doctrine-prose rules and API-envelope rules, not UI copywriting
rules — included here only because the orchestrator's downstream
inheritance question requires future UI surfaces consuming this learning
substrate to honor the same lexicon discipline when they render any
measurement-status, attribution-status, review-status, decision-status,
recommendation-kind, denylist literal, threshold-value, error message, or
contract field name into a UI label, banner, or modal body.

---

## Destructive Actions

**Not applicable in Phase 212.** No surface ships, so no confirm-modals are
authored.

The Node API handlers DO ship destructive endpoints (`POST
/api/v1/literacy/review` to record an admin review decision on a
`LiteracyUpdateCandidate`; `POST /api/v1/literacy/recommendations` to record
a recommendation status mutation), but these endpoints emit JSON envelopes
only — they do not author confirm-modals. Confirm-modal authoring is the
responsibility of downstream UI consumers per the carry-forward rules
below.

When future phases ship surfaces that mutate any 212-substrate state (e.g.
approve a `LiteracyUpdateCandidate` for central-literacy promotion, reject
a candidate, force-suppress a `TenantOverlay`, force-expire a
`LearningRecommendation`, un-suppress a previously-suppressed overlay,
override an anonymization-denial event, mark a `growth-learning-compatibility-map`
row as runnable), each such mutation MUST:

1. Map to one of the six `mutation_class` literals from 206-02
   (`external.send`, `billing.charge`, `connector.mutate`, `price.change`,
   `public.claim`, `data.export`). Most 212-state mutations fall under:
   - `public.claim` — any `LiteracyUpdateCandidate.decision == 'approved'`
     transition that promotes anonymized learning into central literacy
     canon (the canon surface is consumed by ALL tenants, so promotion is
     a public-facing claim from the originating tenant set's perspective).
     Default-approval-mode `dual_approval` per the typical `public.claim`
     posture.
   - `data.export` — any cross-tenant anonymized aggregate export (e.g. a
     candidate that aggregates 5+ tenants' overlays into a single
     anonymized pattern). Often DUAL-CLASS with `public.claim` when the
     export feeds into a central-literacy canon update.
   - `connector.mutate` — not directly applicable to 212 substrate, but
     inherited when a `LearningRecommendation.recommendation_kind ==
     'connector_fix'` action triggers a connector reconfiguration via
     P210 substrate.
   - `external.send` — not directly applicable to 212 substrate; learning
     does not directly send. Inherited when a `LearningRecommendation`
     leads to a downstream P211 dispatch via the linked task system.
   - `billing.charge` — not applicable to 212.
   - `price.change` — not directly applicable to 212; inherited when a
     `LearningRecommendation.recommendation_kind == 'pricing_review'`
     leads to a P205 PricingRecommendation update.
2. Compose `.c-modal` + `.c-backdrop` + `.c-button--destructive` per the
   213.x and 205 pattern, plus the 206 inheritance for mutation-class
   binding.
3. Honor the `default_approval_mode` declared in
   `.planning/compliance/mutation-class-policy.md` for that class
   (206-02-01 doctrine). For dual-class (`public.claim` + `data.export`),
   the surface must honor whichever class has the stricter approval mode
   (typically `public.claim` requires `dual_approval`).
4. Surface the `ApprovalHandoffRecord.handoff_kind` correctly (per 207
   doctrine) — `approval` for tenant-facing dangerous mutations
   (LiteracyUpdateCandidate approve / reject), `recovery` for re-running
   missing-attribution `ArtifactPerformanceLog` rows, `manual_input` for
   override actions (e.g. operator-override of an anonymization denial),
   `follow_up` for non-blocking post-promotion tasks generated by
   `LearningRecommendation.recommendation_kind == 'task_create'`.
5. When the surface authors an override of an anonymization denial (e.g.
   operator bypasses an `audit-blocked-evidence`-style denial to allow a
   below-threshold candidate through), the override path inherits 209-04
   doctrine: `override_path == 'denied'` for autonomy-ceiling reach (no
   override possible — this is the typical posture for
   `customer names`, `tenant identifiers`, `raw pricing`, and `support
   transcripts` denials, which are non-overridable per the privacy
   posture); otherwise `.c-button--destructive` "Continue with reduced
   evidence" with `override_reason` ≥ 10 chars required, and the override
   is recorded permanently on the `LiteracyUpdateCandidate.decision`
   rationale field.
6. When the surface authors an un-suppress action on a previously-suppressed
   `TenantOverlay` or `LearningRecommendation`, the action MUST require
   confirmation because un-suppression can re-introduce learning that was
   deliberately silenced. The mutation-class binding follows the
   underlying record's eventual surface (typically `public.claim` if the
   un-suppressed overlay would resurface in central literacy after
   un-suppression).

---

## Storybook Coverage

**Not applicable.** No visual components rendered; nothing to story.

Test coverage replaces Storybook for this phase:

- `test/literacy/phase-212/preflight/upstream-readiness.test.js`
- `test/literacy/phase-212/preflight/architecture-lock.test.js`
- `test/literacy/phase-212/preflight/performance-baseline.test.js`
- `test/literacy/phase-212/domain-1/performance-envelope.test.js`
- `test/literacy/phase-212/domain-1/outcome-logging.test.js`
- `test/literacy/phase-212/domain-2/tenant-overlay-rls.test.js`
- `test/literacy/phase-212/domain-2/overlay-expiry.test.js`
- `test/literacy/phase-212/domain-2/overlay-merge-rules.test.js`
- `test/literacy/phase-212/domain-2/overlay-review-state.test.js`
- `test/literacy/phase-212/domain-3/candidate-queue.test.js`
- `test/literacy/phase-212/domain-3/admin-review-transitions.test.js`
- `test/literacy/phase-212/domain-3/direct-promotion-denial.test.js`
- `test/literacy/phase-212/domain-4/anonymization-transform.test.js`
- `test/literacy/phase-212/domain-4/privacy-denial.test.js`
- `test/literacy/phase-212/domain-4/sample-threshold.test.js`
- `test/literacy/phase-212/domain-5/recommendation-handoff.test.js`
- `test/literacy/phase-212/domain-5/recommendation-expiry.test.js`
- `test/literacy/phase-212/domain-5/growth-compatibility.test.js`

Runner: `npm test -- test/literacy/phase-212/` (per each plan's
`<verify><automated>` block; CommonJS `node --test` per CLAUDE.md
Architecture Lock).

---

## DESIGN.md Compliance Assertions

| Rule | DESIGN.md citation | Status in Phase 212 |
|------|--------------------|---------------------|
| Default dark surface `#0A0E14` | `colors.surface` | not applicable — no surface authored |
| Protocol Mint < 5% composition | "Composition proportion" | not applicable — no surface authored |
| Two typefaces only (JetBrains Mono + Inter) | `typography.*` | not applicable — no surface authored |
| 8px grid | "Spacing" | not applicable — no surface authored |
| Borders over shadows | "Elevation" | not applicable — no surface authored |
| WCAG 2.1 AA + 2px focus rings | "Accessibility" | not applicable — no surface authored |
| Whitespace ≥ 30% | "Whitespace as primitive" | not applicable — no surface authored |
| No emoji in product UI / CLI / docs | CLAUDE.md | **ENFORCED in doctrine prose + API envelopes** — all 8 learning doctrine docs + 11 runtime modules + 2 API handlers + 3 CI scripts author plain ASCII; bracketed glyphs `[ok]`/`[warn]`/`[err]`/`[block]`/`[info]` reserved for downstream surfaces |
| No gradients, no glow, no soft shadows | "Elevation / Motion" | not applicable — no surface authored |
| `prefers-reduced-motion` collapse | "Motion" | not applicable — no surface authored |
| Banned lexicon enforced in product copy + UI labels + CLI strings | CLAUDE.md | **ENFORCED in doctrine prose + API error envelopes** — engineering-readable language only; `error_message` fields cannot embed banned lexicon because consumers may render them verbatim |
| Pricing placeholder rule | CLAUDE.md + Pricing Engine Canon | **HONORED via inheritance** — `{{MARKOS_PRICING_ENGINE_PENDING}}` is accepted by `ArtifactPerformanceLog.evidence_refs` / `lesson_summary` only when the upstream loop substrate (P211 `MarketingArtifact.pricing_context_ref`) carried the placeholder; 212 introduces no new placeholder authoring paths |
| Architecture-lock forbidden strings | CLAUDE.md + 212-RESEARCH §"Domain 0" + 212-CONTEXT §"Non-negotiables" | **ENFORCED** — `check-learning-architecture-lock.mjs` rejects the three exact strings `promote raw tenant copy`, `auto-promote literacy`, `silent prompt drift` per 212-01-00 AC.3, plus the four substrate-mismatch strings `vitest`, `playwright`, `.test.ts`, `route.ts` per the wider GSD lock |
| Ownership-boundary doctrine | 212-REVIEWS HIGH#2 + 212-CONTEXT "Ownership boundary" + 212-RESEARCH "Ownership boundary" | **ENFORCED** — every `212-XX-PLAN.md` declares `integrates_with` rows for upstream RUN/EVD/LOOP/COMP/TASK families instead of re-owning them; 212 directly owns ONLY `LRN-01..05` + `QA-01..15` per REQUIREMENTS.md traceability table (line 221) |
| Future-only doctrine | 212-05-02 AC | **ENFORCED** — `growth-learning-compatibility-map.md` rows for `plg`, `abm`, `community`, `events`, `pr`, `partnerships`, `developer_marketing` all carry status `future_only` verbatim; doctrine never marks any growth-learning row as runnable in 212 |
| Privacy-denylist doctrine | 212-04-01 AC + CLAUDE.md privacy posture | **ENFORCED** — `cross-tenant-anonymization-policy.md` contains the eight denylist literals verbatim (`tenant identifiers`, `person names`, `customer names`, `contact details`, `raw pricing`, `support transcripts`, `campaign copy that still reveals tenant identity`, `proprietary operator notes`); `lib/markos/learning/privacy-rules.ts` rejects payloads containing any of these strings before admin review |
| Threshold-value doctrine | 212-04-01 AC | **ENFORCED** — `sample-size-thresholds.md` contains the three threshold strings verbatim (`sample_size >= 3`, `supporting_artifact_count >= 5`, `average_confidence_score >= 0.70`); `lib/markos/learning/privacy-rules.ts` contains the threshold values `3`, `5`, and `0.70` verbatim |
| Direct-promotion denial doctrine | 212-03-01 AC | **ENFORCED** — `api/v1/literacy/review.js` contains the exact string `single tenant raw lesson` per 212-03-01 AC; direct promotion from a single tenant's raw lesson into central literacy is rejected before admin review |
| Customer-facing-mutation denial doctrine | 212-05-01 AC | **ENFORCED** — `api/v1/literacy/recommendations.js` contains the exact string `must not apply customer-facing mutations directly` per 212-05-01 AC; recommendations may create governed work, but they may not directly mutate customer-facing systems |
| Translation-gate dissolution doctrine | 209 §Downstream + 210 future_phase_212 placeholder + 211 §Translation Gates Opened | **ENFORCED via §Translation Gate Dissolution and Opening above** — 212 closes 5 upstream gates (209 learning-fixture evidence ledger row, 209 `inferred` learning-derived placeholder, 210 future_phase_212 tenant-profile personalization placeholder, 211 `learning_ready` placeholder, 208 future_phase_212 admin-review variant) and opens 4 downstream gates (P213 Tenant 0, P217+ growth-learning, P218-220 SaaS Growth, P225 narrative intelligence); future surfaces consuming 212 must respect the dissolution / opening status declared here |

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
| 212-CONTEXT.md | "Required phase shape" (1 — confirmed learning-substrate-only across 5-wave breakdown), "Done means" file list (1 — 8 doctrine artifacts plus contracts/migrations/runtime/API/scripts/tests, all server-side), "Non-negotiables" (5 — all substrate-level: no tenant identifiers/PII in cross-tenant learning, no central literacy promotion without anonymization+sample-size+confidence+admin-review gates, no tenant overlay without provenance+evidence+expiry+review, no recommendation that bypasses EvidenceMap+approval+task visibility, no "AI learned this" claim without measurable outcome+source-trail), "Ownership boundary" (3 — direct ownership = `LRN-01..05` + `QA-01..15`; integrates_with = upstream substrate from P206/P207/P208/P209/P211; downstream consumers = P213/P217+/P218-220/P225) |
| 212-RESEARCH.md | Domain 0..5 recommendations (6 — all field schemas for typed learning modules, none surface-bearing): Domain 0 upstream readiness + architecture lock; Domain 1 `ArtifactPerformanceLog` field set + 4 measurement_status literals + 3 attribution_status literals; Domain 2 `TenantOverlay` field set + 5 review_status literals; Domain 3 `LiteracyUpdateCandidate` field set + 5 review-state literals + direct-promotion denial rule; Domain 4 8-item denylist + 3 threshold values + below-threshold-stays-local posture; Domain 5 `LearningRecommendation` field set + 6 recommendation_kind literals + 7 future-only growth-module rows |
| 212-REVIEWS.md | HIGH#1 (1 — plans must adopt executable schema; backend-only) and HIGH#2 (1 — ownership boundary; all upstream families converted to integrates_with), MEDIUM#1 (1 — VALIDATION.md scope; backend) and MEDIUM#2 (1 — Phase 206/208/209/211 dependency gate; backend) |
| 212-01..212-05 plan frontmatter | `files_modified` enumeration (38 paths verified across 5 plans, 0 UI surfaces) |
| 206-UI-SPEC.md | No-UI-scope template structure carried forward; mutation-class doctrine inheritance for all 212 destructive actions (`public.claim` for promoted-canon entries; `data.export` for cross-tenant anonymized exports); pricing-placeholder posture (inherited via 211); banned-lexicon enforcement pattern; 213.x carry-forward decision rows |
| 207-UI-SPEC.md | No-UI-scope template structure carried forward; `RunApiEnvelope` lineage via `agent_run_id` foreign-key on `ArtifactPerformanceLog`; `ApprovalHandoffRecord` integration for learning admin-review approvals (`handoff_kind == 'approval'` for LiteracyUpdateCandidate review; `'recovery'` for missing-attribution ArtifactPerformanceLog re-run; `'manual_input'` for anonymization-denial override; `'follow_up'` for `LearningRecommendation.recommendation_kind == 'task_create'`); chain-engine downstream consumer pattern |
| 208-UI-SPEC.md | Operator-cockpit consumer pattern: Approval Inbox (208-04) reads LiteracyUpdateCandidate admin reviews + LearningRecommendation approval-gated kinds, Recovery Center (208-05) reads ArtifactPerformanceLog missing-attribution rows, Task Board (208-03) reads `LearningRecommendation.recommendation_kind == 'task_create'`, Weekly Narrative (208-06) reads ArtifactPerformanceLog summaries, Morning Brief (208-02) reads recent learning events; placeholder dissolution rules for `future_phase_212` literal across all 4 cockpit surfaces |
| 209-UI-SPEC.md | Learning-fixture evidence ledger row dissolution (§Downstream UI Inheritance Map — `<PlaceholderBanner variant="future_phase_212">` for fixture-evidence surfaces dissolves once 212 ships ArtifactPerformanceLog `evidence_refs` and TenantOverlay `evidence_refs` + `provenance_ref`); `inference_label == 'inferred'` placeholder dissolves once 212 makes the learning-fixture source explicit via ArtifactPerformanceLog `lesson_summary` + `confidence_score`; `<EvidenceSummary />` sub-component reused as read-only consumer of `ArtifactPerformanceLog.evidence_refs` and `TenantOverlay.evidence_refs`; immutable-evidence pattern carry-forward for anonymization audit trail |
| 210-UI-SPEC.md | `future_phase_212` PlaceholderBanner from 210-A surface dissolves once 212 ships LearningRecommendation `recommendation_kind == 'experiment_candidate'` + `connector_fix` (per 210-UI-SPEC line 403, 439, 500, 643, 679); sibling no-UI-scope template inheritance |
| 211-UI-SPEC.md | Loop substrate consumer pattern: 212 `ArtifactPerformanceLog` ingests P211 `MeasurementHandoff` outputs (the 211 §Translation Gates Opened row for `learning_ready == true` placeholder dissolves into 212 ArtifactPerformanceLog ingestion); `next_task_kind` literals (`brief_refresh`, `evidence_refresh`, `pricing_review`, `connector_recovery`, `social_follow_up`, `experiment_candidate` per 211-06-01 doctrine) feed `LearningRecommendation.recommendation_kind` literals (the 6 recommendation_kind literals are a superset that adds `task_create` and `strategy_refresh` and `research_refresh` to the loop's next-task vocabulary); revenue-feedback narrative provides outcome attribution via `RevenueFeedbackLink.weighted_evidence_refs` referenced by `ArtifactPerformanceLog.evidence_refs`; sibling no-UI-scope template inheritance |
| 212-VALIDATION.md (existing) | Verification rows for 212-01-00, 212-01-01, 212-02-01, 212-03-01, 212-04-01, 212-05-01, 212-05-02 (7 tasks across 5 plans) |
| DESIGN.md v1.1.0 | Banned lexicon, no-emoji rule, pricing placeholder rule, mint-as-text token reference, `.c-notice` / `.c-card` / `.c-card--feature` / `.c-table` policy carried forward to downstream-inheritance section |
| 213.3 / 213.4 CONTEXT carry-forward (D-08, D-09, D-09b, D-13, D-14, D-15) | 6 decisions enumerated in §Downstream UI Inheritance Map |
| REQUIREMENTS.md | Traceability table — `LRN-01..05` mapped to Phase 212 (line 221) confirms 212 ownership scope |
| User input | 0 — no-UI scope fully verified by upstream artifacts; no questions needed |

---

## Checker Sign-Off

For a no-UI-scope phase, the six dimensions resolve as follows. The
checker's job here is to verify the no-surface declaration is accurate
and the downstream-inheritance map is load-bearing for future phases —
not to evaluate visual quality of surfaces that don't exist.

- [ ] Dimension 1 Copywriting: PASS-BY-EXEMPTION (doctrine prose + API error-envelope strings only; banned lexicon enforced; pricing placeholder honored via inheritance; architecture-lock forbidden strings enforced; future_only literal exact; privacy-denylist literals exact; threshold values exact; direct-promotion denial string exact; customer-facing-mutation denial string exact)
- [ ] Dimension 2 Visuals: PASS-BY-EXEMPTION (no visuals authored)
- [ ] Dimension 3 Color: PASS-BY-EXEMPTION (no colors authored)
- [ ] Dimension 4 Typography: PASS-BY-EXEMPTION (no typography authored)
- [ ] Dimension 5 Spacing: PASS-BY-EXEMPTION (no spacing authored)
- [ ] Dimension 6 Registry Safety: PASS-BY-EXEMPTION (no registry consumed)

**No-UI declaration verification gate** (checker MUST verify before approving):

- [ ] All 5 plans confirmed to ship zero `app/`, zero `components/`, zero
      `*.stories.tsx`, zero `page.tsx`, zero `layout.tsx`, zero `*.css`,
      zero `*.module.css`, zero `tailwind.config.*` paths in
      `files_modified` (search assertions table above).
- [ ] §Downstream UI Inheritance Map enumerates ≥ 12 future surface
      families with explicit Phase 212 doctrine origin (learning `.md`
      doc or runtime module) and 213.x carry-forward citation.
- [ ] §Translation Gate Dissolution and Opening enumerates ≥ 5 dissolved
      gates (from 208/209/210/211 placeholders) and ≥ 4 opened gates (for
      P213/P217+/P218-220/P225 consumers).
- [ ] §DESIGN.md Compliance Assertions correctly marks visual rules as
      "not applicable" and enforces the seven non-visual rules (no-emoji
      in docs + API envelopes, banned lexicon, pricing placeholder
      via inheritance, architecture-lock forbidden strings, ownership-
      boundary doctrine, future-only doctrine, privacy-denylist + threshold-
      value + direct-promotion + customer-facing-mutation doctrine).
- [ ] Cross-phase doctrine binding to 206-UI-SPEC, 207-UI-SPEC,
      208-UI-SPEC, 209-UI-SPEC, 210-UI-SPEC, 211-UI-SPEC verified for
      surfaces that involve mutation-class enforcement, run-envelope
      lineage, operator-cockpit consumption, evidence-ledger dissolution,
      connector-substrate placeholder dissolution, and loop-substrate
      consumption.
- [ ] Translation gate dissolution explicitly identifies that 209 §
      Downstream learning-fixture evidence-ledger row (and the
      `inference_label == 'inferred'` placeholder for learning-derived
      inferences) becomes implementable in 212; checker verifies that
      212-01 `ArtifactPerformanceLog.evidence_refs` + `lesson_summary` +
      `confidence_score` and 212-02 `TenantOverlay.evidence_refs` +
      `provenance_ref` are the receiving doctrine surfaces.
- [ ] Translation gate dissolution explicitly identifies that 211 §
      Translation Gates Opened `MeasurementHandoff.learning_ready ==
      true` placeholder becomes implementable in 212; checker verifies
      that 212-01 `ArtifactPerformanceLog` ingests 211 `MeasurementHandoff`
      outputs via `artifact_id` foreign key and via `expected_outcome` /
      `actual_outcome` field seeding.
- [ ] 213.4 carry-forward (D-08..D-15) enumerated in §Downstream UI
      Inheritance Map.
- [ ] Existing P208 cockpit surfaces correctly identified as downstream
      consumers (NOT modified by 212); placeholder-dissolution rules
      respected (the dissolution requires a future P208-extension phase,
      not 212 itself).
- [ ] Mutation-class binding for the LiteracyUpdateCandidate approve
      action correctly identified as `public.claim` (with optional
      DUAL-CLASS `data.export` for cross-tenant anonymized aggregate
      exports); `default_approval_mode` correctly identified as
      `dual_approval` per the typical `public.claim` posture.
- [ ] Privacy-denylist literals (8) and threshold values (3) verified
      verbatim per 212-04-01 AC.
- [ ] Future-only literal verified verbatim per 212-05-02 AC (note: 212
      uses `future_only`, NOT `future_consumer` which is the 211
      vocabulary).

**Approval:** pending

---

## UI-SPEC COMPLETE
