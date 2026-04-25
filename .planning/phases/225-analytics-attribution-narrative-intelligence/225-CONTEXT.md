# Phase 225: Analytics, Attribution, and Narrative Intelligence - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

<domain>
## Phase Boundary

Phase 225 ships the semantic analytics layer for MarkOS: DB-resident metric_definitions catalog with per-tenant overrides + version history; multi-touch AttributionTouch materialization per Opportunity per model_version (first/last/linear/position-based/time-decay/data-driven); first-class anomaly_detections with state machine; hybrid narrative generation (template + LLM-filled clauses + P209 EvidenceMap claim audit); decision_rules registry mapping anomaly/threshold/trend_change → task/alert/approval/narrative/learning_candidate; Bayesian-primary + frequentist-guardrail experiment winner detection (carries P218 D-05 + P224 D-24 deferred); analytics → Pricing Engine signal loop (decoupled via cdp_events); aggregate-only k-anonymity (k≥5) cross-tenant benchmarks; materialized journey_steps; per-metric freshness_mode + stale_indicator; full read-write `/v1/analytics/*` API + 7 MCP tools + AnalyticsWorkspace + AttributionExplorer + AnomalyInbox + NarrativeFeed + ExperimentsCockpit.

**In scope:** metric_definitions + metric_overrides + attribution_models + attribution_touches + anomaly_detections + narratives + narrative_claims + decision_rules + experiment_winners + experiment_decisions + journey_steps + aggregated_metrics (cross-tenant) + pricing_signals + freshness_audit.

**Out of scope (deferred to later phases):**
- Sales enablement battlecards/proof-packs (P226).
- Ecosystem partner/affiliate/community/developer growth analytics (P227).
- Commercial OS integration closure (P228).
- Real-time event streaming (Kafka-style) — defer; Vercel Cron + AgentRun sufficient for v1.
- Customer-facing analytics dashboards (operator-first per RESEARCH.md "operator-first vs customer-facing").
- Pricing Engine PricingRecommendation creation (P205 owns); P225 only emits pricing_signals.
- LearningCandidate review/approval workflow (P212 owns); P225 only creates candidates.
- Embedded analytics SDK / customer dashboard widgets — defer.
- Predictive ML models (LTV, churn prediction beyond risk_score) — defer to v2.

P225 is ADDITIVE: existing `lib/markos/crm/reporting.ts` + `lib/markos/crm/attribution.ts` stay legacy + can migrate to semantic layer incrementally via adapters. Current FAMILY_WEIGHTS attribution stays as legacy first_touch model + adapter feeds attribution_touches.
</domain>

<decisions>
## Implementation Decisions

### Metric catalog
- **D-01:** DB-resident `metric_definitions` SOR: `metric_id, tenant_id (NULL = global), category ∈ {acquisition, activation, conversion, pipeline, revenue, retention, support, pricing, community}, grain ∈ {person, account, campaign, content, channel, tenant}, name, formula_description, formula_dsl JSONB (typed query AST), source_event_families[] (event_domain values consumed), source_precedence_chain[] (ordered list of cdp_events.source for conflict resolution), freshness_mode ∈ {real_time, hourly, daily, weekly}, last_computed_at, anomaly_config JSONB (sigma_threshold, min_sample_size, sensitivity), drilldown_spec JSONB (allowed_dimensions[], default_breakdown), version, status ∈ {draft, approved, deprecated, archived}, approved_by, approved_at`. RLS on tenant_id (global tenants visible to all).
- **D-02:** `metric_overrides` table for per-tenant customizations of global metrics: `override_id, tenant_id, parent_metric_id (FK → metric_definitions where tenant_id IS NULL), formula_dsl JSONB (override fragment), anomaly_config JSONB, drilldown_spec JSONB, status, approved_by, approved_at`. Resolution: tenant override wins; falls back to global definition.
- **D-03:** Doc 22 universal core metrics seeded as global rows on migration: pipeline_created, pipeline_influenced, win_rate, sales_cycle_velocity, cac, cac_payback, conversion_rate_by_stage, campaign_efficiency, content_assisted_revenue + SaaS metrics (activation_rate, time_to_value, pql_count, mrr, arr, nrr, grr, expansion_rate, churn_rate, renewal_risk, payback_by_cohort) + messaging metrics (response_rate, conversation_to_meeting, activation_intervention_lift, save_offer_effectiveness, reactivation_success).
- **D-04:** Operator workspace allows per-tenant override + version promotion via `MetricCatalogEditor`. Approval-package pattern (P208 + P105) on global metric mutations.

### Attribution models
- **D-05:** New `attribution_models` table: `model_id, tenant_id (NULL = global), name ∈ {first_touch, last_touch, linear, position_based, time_decay, data_driven}, version, weights_strategy JSONB (per-model: linear=equal; position_based=40/20/40; time_decay=half_life_days; data_driven=ml_model_ref), lookback_days, status, approved_by`. Six standard models seeded as global rows; tenants can clone + customize.
- **D-06:** New `attribution_touches` SOR (doc 22 first-class): `touch_id, tenant_id, opportunity_id (FK → P222 opportunities), profile_id (FK → P221 cdp_identity_profiles), account_id, campaign_id (FK → P223 email_campaigns OR P224 conversion experiments), channel ∈ {organic_search, paid_search, social, email, messaging, direct, referral, partner, community, event, product}, occurred_at, touch_type ∈ {first, assist, last, influential}, confidence_score, model_id (FK → attribution_models), model_version, source_event_ref (UUID, threads to cdp_events)`. RLS on tenant_id.
- **D-07:** Attribution computation triggered at: (1) Opportunity.stage_change → 'opportunity'/'customer' transition, (2) operator-invoked recompute via API/MCP, (3) cron weekly for active opps + on-demand for closed/won. Compute reads cdp_events + crm_activity + dispatch_events + conversion_events + identity_links by profile_id + lookback_days; produces attribution_touches rows per model. Existing `lib/markos/crm/attribution.ts` FAMILY_WEIGHTS becomes legacy first_touch model adapter.
- **D-08:** Multi-model coexistence: attribution_touches stores rows for ALL active models simultaneously per Opportunity (model_id discriminator). UI selects model_id at query time. Operator can compare.

### Anomaly detection
- **D-09:** New `anomaly_detections` SOR with state machine: `detection_id, tenant_id, metric_id (FK → metric_definitions), period_start, period_end, baseline_value, observed_value, deviation_sigma, severity ∈ {low, medium, high, critical}, status ∈ {detected, acknowledged, investigating, resolved, dismissed}, assigned_to_user_id, resolution_summary, evidence_refs[] (FK → P209 EvidenceMap), narrative_id (FK, nullable), detected_at, acknowledged_at, resolved_at, suppressed_until`. RLS on tenant_id.
- **D-10:** Anomaly trigger config from `metric_definitions.anomaly_config`: `sigma_threshold` (default 2.0), `min_sample_size` (default 30), `sensitivity ∈ {low, medium, high}`, `seasonality_aware` (bool — adjusts baseline for day-of-week/seasonality). Detection cron runs per metric per freshness_mode cadence.
- **D-11:** Anomaly state machine: detected → acknowledged → investigating → resolved | dismissed. Operator workflow surface (AnomalyInbox per D-37). Auto-suppress duplicate detections within `suppressed_until` window.
- **D-12:** Severity = function of (deviation_sigma, metric.category importance, business_impact_score). Critical → operator task + email (P208 Approval Inbox entry).

### Narrative intelligence
- **D-13:** New `narratives` SOR: `narrative_id, tenant_id, period_start, period_end, narrative_kind ∈ {weekly_summary, launch_outcome, campaign_recap, anomaly_explanation, growth_story, churn_warning, pricing_signal, experiment_recap}, scaffold_template_id (FK → narrative_templates), generated_text, summary, supporting_metric_ids[], supporting_evidence_refs[] (FK → P209 EvidenceMap), confidence ∈ {high, medium, low}, recommended_actions[] (action_id refs), status ∈ {draft, audited, approved, published, archived}, approved_by, approved_at, audit_findings JSONB`. RLS on tenant_id.
- **D-14:** Hybrid generation: template scaffold (`narrative_templates` table with placeholder slots) + LLM fills clauses + every numeric/factual claim binds to EvidenceMap claim_id (P209). Pre-publish claim audit (P209 audit_claim) blocks display when any claim fails freshness/source-quality.
- **D-15:** narrative_claims junction table: `claim_id, narrative_id, claim_text, evidence_ref (FK → EvidenceMap), confidence, freshness_mode, audited_at, audit_status ∈ {pending, passed, failed, manual_override}`. Every numeric/factual span in generated_text MUST have a row.
- **D-16:** Pricing-touching narratives use {{MARKOS_PRICING_ENGINE_PENDING}} placeholder until approved Pricing Engine record (P205); P211 + CLAUDE.md rule.
- **D-17:** Narrative_kind drives template + tone:
  - weekly_summary → operator brief: what changed, why, what to do.
  - launch_outcome → consumes P224 LaunchOutcome at T+7/T+14/T+30.
  - experiment_recap → consumes ConversionExperiment + winner_detection result.
  - growth_story → cross-domain (CRM + channels + experiments); strongest claim audit.

### Decision routing
- **D-18:** New `decision_rules` table: `rule_id, tenant_id, name, trigger_kind ∈ {anomaly_detected, threshold_crossed, trend_change, forecast_warning, experiment_winner, pricing_signal, freshness_violation, conversion_drop}, trigger_config JSONB, action_kind ∈ {create_task, emit_alert, require_approval, generate_narrative, create_learning_candidate, create_pricing_signal, suppress_send}, action_config JSONB, status, version, owner_user_id, last_fired_at, fire_count, audit_log_chain JSONB`. RLS on tenant_id.
- **D-19:** Pluggable evaluator pattern (`lib/markos/analytics/decision/evaluators/`): one module per trigger_kind. Evaluator inputs current state + recent events; outputs zero or more action_kind invocations. Rule fires write `markos_audit_log` row.
- **D-20:** Default decision rules seeded per tenant on activation (e.g., "anomaly_detected severity=critical → create_task assigned to metric.category owner"; "experiment_winner confidence>=0.95 → require_approval before promotion"; "pricing_signal kind=competitive_threat → create_pricing_signal"). Operator can edit + version + disable.
- **D-21:** action_kind=create_pricing_signal → emits cdp_events row with event_domain='analytics' for P205 consumption (D-26). action_kind=create_learning_candidate → writes P212 LearningCandidate row.

### Experiment winner detection (carries P218 D-05 + P224 D-24)
- **D-22:** New `experiment_winners` table: `winner_id, tenant_id, experiment_id (FK → P224 conversion_experiments OR future P218 marketing_experiments), variant_id (FK → P224 experiment_variants), bayesian_probability, frequentist_p_value, confidence_threshold_met (bool), sample_size, duration_days, novelty_effect_window_days, ice_score (impact × confidence × ease), winner_detected_at, approved_by, approved_at, status ∈ {detected, pending_approval, approved, rejected}`. RLS on tenant_id.
- **D-23:** Hybrid statistical model:
  - **Bayesian primary:** sequential analysis with Beta-Binomial posterior; supports peeking; `bayesian_probability >= 0.95` threshold for variant_id wins.
  - **Frequentist guardrail:** two-sided z-test; `frequentist_p_value <= 0.05` cross-check.
  - **Both must agree:** winner detected only when both methods agree at 95% confidence.
- **D-24:** Statistical guardrails: `min_sample_size` (default 1000 per variant; per-experiment override), `min_duration_days` (default 7), `novelty_effect_window_days` (first 3 days excluded from analysis), seasonality adjustment for >14 day experiments.
- **D-25:** ICE backlog scoring (impact × confidence × ease) for prioritization in `experiment_decisions` queue. Operator approves before variant promotion (P208 Approval Inbox entry). Auto-pause experiments past min_duration when winner detected.

### Pricing Engine feedback loop
- **D-26:** Analytics emits pricing_signals via cdp_events (event_domain='analytics', event_name='analytics.pricing_signal'); decoupled from P205. Signal payload: `signal_kind ∈ {price_test_winner, conversion_rate_drop, competitive_threat, activation_lift_observed, churn_pricing_correlation}, evidence_refs[], confidence, recommended_change (description, NOT a record), narrative_id`. P205 PricingRecommendation engine consumes; tenant operator approves.
- **D-27:** New `pricing_signals` audit table mirrors what was emitted: `signal_id, tenant_id, signal_kind, payload JSONB, emitted_at, consumed_by_p205, consumed_at`. P205 acks consumption (status flag flip). Operator-visible "what analytics told pricing" log.

### Cross-tenant anonymized learning (carries P212 boundary)
- **D-28:** Aggregate-only cross-tenant pattern. New `aggregated_metrics` table: `aggregation_id, dimension ∈ {industry, segment, company_size, region, business_type}, dimension_value, period, metric_id, value, sample_size, k_anonymity_threshold (default 5), computed_at, status`. RLS allows ALL tenants read where sample_size >= k_anonymity_threshold; raw underlying tenant rows STILL tenant-scoped (no cross-tenant raw access).
- **D-29:** Tenant opt-in via tenant config flag `analytics_cross_tenant_share = true` (default false). Opted-in tenant data flows into aggregated_metrics computation. Opt-out at any time + retroactive removal from future computations. P212 LearningCandidate consumes aggregated_metrics for "industry baseline" stories.
- **D-30:** No raw event/profile/Opportunity/identity leak. Aggregation runs in trusted server-side cron only. EvidenceMap claim_id annotates aggregated_metric origin.

### Journey analytics
- **D-31:** New `journey_steps` SOR (materialized): `step_id, tenant_id, profile_id (FK → P221 cdp_identity_profiles), account_id, period_start, period_end, ordered_event_refs[] (cdp_events UUIDs), funnel_stage ∈ {anonymous, known, engaged, mql, sql, opportunity, customer, expansion, advocate, lost} (matches P222 D-11), time_in_stage_seconds, transition_drivers[] (channel + commercial_signal pairs that drove transition)`. RLS on tenant_id.
- **D-32:** Recompute cadence: hourly for active profiles (lifecycle_stage ∈ {engaged, mql, sql, opportunity}), daily for inactive (anonymous/known/customer/lost), weekly historical sweep. Cron via Vercel Cron + AgentRun (P207). Bridge stub if P207 absent.

### Freshness contract per metric
- **D-33:** Every metric has `freshness_mode ∈ {real_time, hourly, daily, weekly}` + `last_computed_at`. Stale-data renderer (`lib/markos/analytics/render/stale-indicator.tsx`) shows operator-visible warning when current time > last_computed_at + freshness_window. Examples: real_time = >5 min stale; hourly = >2h stale; daily = >36h stale; weekly = >9d stale.
- **D-34:** New `freshness_audit` cron logs SLA violations to `markos_audit_log`; trigger_kind=freshness_violation in decision_rules can fire create_task. P209 EvidenceMap binding includes freshness_mode for narrative claim audit.

### API + MCP surface
- **D-35:** Read-write v1 `/v1/analytics/*` API:
  - **Metrics:** GET/POST `/v1/analytics/metrics` (catalog), GET `/v1/analytics/metrics/{id}/value` (with dimension breakdown), POST `/v1/analytics/metrics/{id}/recompute`.
  - **Attribution:** GET `/v1/analytics/attribution/touches` (filter by opp/profile/account/model), GET `/v1/analytics/attribution/models`, POST `/v1/analytics/attribution/recompute`.
  - **Anomalies:** GET/POST `/v1/analytics/anomalies`, POST `/v1/analytics/anomalies/{id}/{acknowledge|resolve|dismiss}`.
  - **Narratives:** GET/POST `/v1/analytics/narratives`, POST `/v1/analytics/narratives/{id}/{audit|approve|publish}`.
  - **Decisions:** GET/POST/PUT/DELETE `/v1/analytics/decision-rules`, POST `/v1/analytics/decision-rules/{id}/{enable|disable}`.
  - **Journeys:** GET `/v1/analytics/journeys/{profile_id}` (or by account_id).
  - **Experiments:** GET `/v1/analytics/experiments/winners`, POST `/v1/analytics/experiments/{id}/declare-winner`, POST `/v1/analytics/experiments/{id}/reject`.
  - **Benchmarks:** GET `/v1/analytics/benchmarks` (cross-tenant aggregated, k-anonymity gated).
- **D-36:** MCP tools (7):
  - `get_metric` — metric value + breakdown + freshness.
  - `get_attribution` — touchpoints for an Opportunity/Profile/Account by model.
  - `list_anomalies` — open anomalies for tenant.
  - `generate_narrative` — request narrative generation by kind + period.
  - `evaluate_decision` — manually trigger decision_rule evaluation.
  - `get_journey` — journey_steps for a profile/account.
  - `list_experiment_winners` — pending + recent winner detections.

### UI surface
- **D-37:** Evolve P105 reporting cockpit + add analytics workspaces (P208 single-shell):
  - **AnalyticsWorkspace** (`app/(markos)/analytics/page.tsx`): metric catalog + tenant overrides + recompute controls + freshness indicators.
  - **AttributionExplorer**: opp/profile/account drill-down with model selector + touchpoint timeline + revenue contribution chart.
  - **AnomalyInbox**: kanban-by-status anomaly queue + assignment + resolution + evidence panel.
  - **NarrativeFeed**: chronological narratives by kind + claim audit panel + approve/publish controls.
  - **ExperimentsCockpit**: experiment list + winner detection state + Bayesian/frequentist confidence + ICE backlog + variant promotion approval.
  - **DecisionRulesEditor**: per-tenant decision_rule CRUD + audit log of fires.
  - **BenchmarksPanel**: cross-tenant aggregated metrics with k-anonymity gating + opt-in toggle.
- **D-38:** Approval Inbox (P208) gains: anomaly_critical, narrative_publish, decision_rule_change, experiment_winner_promotion, metric_definition_change entry types.
- **D-39:** Morning Brief (P208) surfaces: top open anomalies, top narrative published in last 24h, experiment winners pending approval, freshness SLA violations.

### Observability + operator posture
- **D-40:** freshness_audit cron logs SLA violations + decision_rules can fire create_task on freshness_violation.
- **D-41:** Anomaly spike alerts: anomaly_detection rate >2σ from 7-day baseline → operator task (anomaly-of-anomalies).
- **D-42:** Narrative audit log: claim_audit failures + manual overrides logged with operator + reason.

### Security + tenancy
- **D-43:** RLS on all new tables: `metric_definitions`, `metric_overrides`, `attribution_models`, `attribution_touches`, `anomaly_detections`, `narratives`, `narrative_claims`, `narrative_templates`, `decision_rules`, `experiment_winners`, `experiment_decisions`, `journey_steps`, `aggregated_metrics`, `pricing_signals`, `freshness_audit`. Fail closed on missing tenant context. `aggregated_metrics` allows cross-tenant read where sample_size >= k_anonymity_threshold.
- **D-44:** Audit trail mandatory on metric_definition mutations + anomaly state transitions + narrative publish + decision_rule edits + experiment_winner approvals + cross-tenant aggregation runs. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-45:** Tombstone propagation (P221 D-24 → P222 D-32): when profile tombstoned, attribution_touches + journey_steps for that profile_id scrub PII; aggregated_metrics computation excludes tombstoned profiles for the period.
- **D-46:** Cross-tenant aggregation runs in trusted server context only (Vercel Cron + AgentRun); never client-accessible. EvidenceMap claim_id on every aggregated_metrics row.

### Contracts + migrations
- **D-47:** Fresh F-IDs allocated by planner (continue after P224 F-146). Expect 12-16 new contracts:
  - F-xxx-metric-definition, F-xxx-metric-override, F-xxx-attribution-model, F-xxx-attribution-touch, F-xxx-anomaly-detection, F-xxx-narrative, F-xxx-narrative-template, F-xxx-narrative-claim, F-xxx-decision-rule, F-xxx-experiment-winner, F-xxx-journey-step, F-xxx-aggregated-metric, F-xxx-pricing-signal, F-xxx-narrative-generate (write), F-xxx-decision-evaluate (write).
- **D-48:** New migrations allocated by planner (continue after P224 migration 133). Expect 9-12:
  - 15 new tables + 27 universal core metrics seed + 6 standard attribution models seed + 7 default decision_rules seed + indexes for hot query paths.

### Claude's Discretion
- Module boundary under `lib/markos/analytics/*` (catalog, attribution, anomaly, narrative, decision, experiments, journey, benchmark).
- Bayesian posterior implementation (Beta-Binomial sufficient for binary conversion experiments; Normal-Gamma for continuous metrics).
- Time-decay attribution half_life_days default (7 days reasonable).
- LLM provider for narrative generation (recommend Vercel AI Gateway with provider-fallback per Vercel knowledge update; default model claude-sonnet-4-6).
- formula_dsl typing strategy (typed AST vs JSONLogic vs SQL fragment) — pick at plan time.
- Cron schedules for anomaly detection, narrative gen, journey recompute, freshness audit, aggregation.
- xxhash3 vs SHA-256 for journey_steps deterministic hashing.

### Folded Todos
None — no pending todos matched Phase 225 scope.

### Review-driven decisions (added 2026-04-25 per /gsd-plan-phase 225 --reviews Codex feedback — addresses 9 HIGH + 5 MEDIUM + 1 LOW concerns; see 225-REVIEWS.md)

**Architecture lock (RH1, RH2, RH4, RH7, RM1) — addresses architecture-hallucination pattern:**

- **D-49: Phase 225 architecture is locked to verified codebase shape.** All HTTP route handlers ship under `api/v1/analytics/*.js` legacy convention (mirrors `api/submit.js`, `api/approve.js`, `api/cron/webhooks-rotation-notify.js`). All MCP tools register in `lib/markos/mcp/tools/index.cjs` (extension `.cjs`, NOT `.ts`). All OpenAPI artifact paths target `contracts/openapi.json` (NOT `public/openapi.json`). All test invocations use `npm test` → `node --test test/**/*.test.js` (NOT `vitest run`, NOT `npx playwright`). All auth wrappers call `requireHostedSupabaseAuth({ req, runtimeContext, operation })` from `onboarding/backend/runtime-context.cjs:491`. Service-role Supabase client constructed inline using `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })` (verified pattern from `api/submit.js:39-43`); NO `serviceRoleClient()` helper exists. Plugin lookups use `resolvePlugin(registry, pluginId)` from `lib/markos/plugins/registry.js:102` (NOT `lookupPlugin`).

- **D-50: package.json scripts pinned by P225.** Only existing scripts referenced: `test`, `chromatic`, `openapi:build` (verified). P225 does NOT add `vitest`, `playwright`, `supabase:gen-types`, or `openapi-generate`. Existing `chromatic` script is acceptable for visual regression. If a future phase needs vitest/playwright, that phase MUST land them as a precondition.

- **D-51: New npm dependencies added by P225 Plan 01 Task 0.5.** `json-logic-js`, `xxhash-wasm`, `@ai-sdk/gateway`. Each dependency has an `npm install` step + `node -e "require(<pkg>)"` smoke verification + `package.json` diff acceptance check.

- **D-52: UI surface writes to existing `app/(markos)/` tree only.** Analytics workspaces ship under `app/(markos)/analytics/` (greenfield subtree owned by P225) alongside the verified existing tree (`crm`, `campaigns`, `icps`, `segments`, `operations`, `mir`, `msp`, `plugins`, `settings`, `status`, `admin`, `company`, `invite`, `oauth`, `login`, `404-workspace`, `_components`, `layout-shell.tsx`, `layout.tsx`, `page.tsx`). P225 does NOT create `app/(markos)/conversion/`, `app/(markos)/launches/`, or any other new top-level Markos route group.

**Greenfield + upstream fail-closed (RH3, RH8, RH9) — addresses soft-degradation pattern:**

- **D-53: lib/markos/{analytics,cdp,crm360,channels,conversion,launches,operating}/* are greenfield trees owned by their respective phases.** Verified `lib/markos/` contains: audit, auth, billing, cli, contracts, crm, governance, identity, llm, mcp, orgs, outbound, packs, plugins, rbac, telemetry, tenant, theme, webhooks. P225 owns and creates `lib/markos/analytics/*` (new). All other listed greenfield trees (`cdp` for P221, `crm360` for P222, `channels` for P223, `conversion` + `launches` for P224, `operating` for the P208 closure phase) MUST be created by their owning phase BEFORE P225 lands. P225 fails closed via `assertUpstreamReady()` preflight (D-54).

- **D-54: Hard upstream-readiness gate (`assertUpstreamReady()`).** Plan 01 Task 0.5 ships `scripts/preconditions/225-check-upstream.cjs` that verifies P209 (`evidence_map`), P211 (`content_strategies`), P212 (`learning_candidates`), P221 (`cdp_events` + `cdp_identity_profiles`), P222 (`crm_opportunities` + `crm_activity` + `lifecycle_transitions`), P223 (`dispatch_events`), P224 (`conversion_events` + `email_campaigns` + `conversion_experiments` + `launch_outcomes`) are all present. Failing any → emits `{ error: UPSTREAM_PHASE_NOT_LANDED, missing: [...], required_phases: [...] }` and non-zero exit. P225 cron handlers, evaluators, generators, UI handlers MUST call `assertUpstreamReady()` at first invocation and throw `UpstreamPhaseNotLandedError(<phase_id>, <reason>)` if upstream missing — NEVER silent degradation.

- **D-55: All P225 evaluators, generators, writeback paths fail-closed when upstream phases absent.** Plan 02 metric resolution: P221 cdp_events absent → throw. Plan 02 freshness-violation evaluator: P208 task primitive absent → throw (NO bridge stub fallback). Plan 03 attribution recompute: P221/P222/P223/P224 events absent → throw. Plan 04 anomaly cron: P221 + metric tables absent → throw. Plan 04 decision evaluators (experiment_winner + pricing_signal): NOT inactive — gated by assertUpstreamReady() and throw. Plan 05 narrative generator: P209 EvidenceMap absent → throw `UpstreamPhaseNotLandedError(P209, evidence_map table required)`. NO "draft with warnings" fallback. NO publish path without claim audit pass. Plan 05 journey materializer: P221 cdp_identity_profiles absent → throw. Plan 06 cross-tenant aggregator: P209 absent → all aggregated_metrics rows have evidence_ref IS NULL AND status='quarantined' (NOT published). Plan 07 API + MCP: every handler invokes requireHostedSupabaseAuth AND assertUpstreamReady before any state read/write.

**Source precedence + attribution + decision + writeback — data-contract enforcement (RM3, RM4, RM5, RM6):**

- **D-56: Source precedence enforced at the DATABASE LAYER (RM3).** Plan 01 ships migration `134a_analytics_metric_canonical_view.sql` creating `metric_canonical_view` that joins all metric source tables and applies precedence in SQL. `source_precedence_chain[]` JSONB array is consulted; first source with a row for (metric_id, tenant_id, period) wins. Tiebreaker: deterministic by `commit_sha` lexicographic, then `inserted_at` ASC. SQL test inserts 2 conflicting source rows for same metric_id+tenant_id+period; asserts view returns exactly 1 row. Application `resolveMetricForTenant` MUST query this view, NOT raw metric_definitions, when computing values.

- **D-57: Attribution single-writer enforcement (RM4).** Plan 01 ships `lib/markos/analytics/attribution/touch-writer.ts` (greenfield) as the SOLE module permitted to write `attribution_touches`. Plan 01 migration adds Postgres trigger `attribution_touches_writer_check` asserting `current_setting('app.attribution_writer', true) = 'analytics-touch-writer'`. Phase 227 ECO-05 ONLY adds FK columns + read triggers; P227 NEVER writes rows. Plan 03 attribution engine + Plan 06 experiment-winner evaluator BOTH funnel through `touch-writer.ts` which sets the GUC before insert. Acceptance: SQL test from non-writer session → raises `attribution_writer_violation`; writer session → succeeds.

- **D-58: Decision classes + audit table (RM5).** Plan 04 ships migration `143a_analytics_decisions_audit.sql` creating `analytics_decisions` table with columns `decision_id, tenant_id, decision_class CHECK IN (auto_decision, recommendation, alert), source_narrative_id, source_anomaly_id, source_winner_id, evidence_ref_array uuid[], confidence_score numeric(3,2), blocked_reason text, audit_at, approver_id, approved_at, routing_metadata jsonb`. CHECK constraints: `auto_decision` → blocked_reason IS NULL AND confidence_score >= 0.80 AND array_length(evidence_ref_array, 1) >= 1; `recommendation` → (approver_id IS NULL AND approved_at IS NULL) OR (approver_id IS NOT NULL AND approved_at IS NOT NULL); `alert` → notification-only. Plan 04 ships `lib/markos/analytics/decision/classifier.ts` mapping each fired decision_rule to one class based on (action_kind, evidence freshness, confidence). Every fire writes EXACTLY ONE row to analytics_decisions.

- **D-59: Writeback delivery outcomes (RM6).** Plan 05 ships migration `139a_analytics_writeback_audit.sql` creating `analytics_writeback_audit` with columns `writeback_id, tenant_id, target_phase CHECK IN (P205_pricing, P211_content, P212_learning, P224_launches), payload, outcome CHECK IN (written, blocked_missing_dependency, blocked_policy, rejected), outcome_reason, attempted_at, dependency_check_at`. Plan 05 + Plan 06 writeback paths (pricing-signal emit, learning-candidate emit, launch-outcome consume) all write a row per attempt. NO silent skip — even no-op paths produce `outcome=blocked_missing_dependency` row with `outcome_reason=P209_evidence_map_unavailable` etc.

**Plugin registry verification (RL1):**

- **D-60: Plugin registry references audited.** `grep "lookupPlugin" .planning/phases/225-* lib/markos/analytics/* lib/markos/mcp/tools/analytics/* api/v1/analytics/* test/analytics/*` MUST return zero invocations. All plugin lookups use `resolvePlugin(registry, pluginId)`.

**DISCUSS.md sync (RM2):**

- **D-61: DISCUSS.md slice table updated to match actual 7-plan/5-wave file scope.** CONTEXT.md remains authoritative for slice boundaries.

**Frontmatter drift remediation (Phase 226 iter-1 lesson):**

- **D-62: `files_modified` frontmatter is canonical truth-source for plan file inventory.** Every file referenced in plan body (action, acceptance, key_links, artifacts) MUST appear in the plan's `files_modified`. Reverse holds: every file in `files_modified` MUST be touched. Plans failing this invariant blocked at checker time.


</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (precedence 1-2)
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` — informational; canonical = `obsidian/reference/*` once distilled. 7 core rules, 6 architecture layers, MetricDefinition + AttributionTouch + NarrativeInsight shapes.
- `obsidian/work/incoming/23-CONVERSION-ENGINE.md` — informational; ConversionExperiment + variant winner detection feed (P224 deferred to P225).
- `obsidian/work/incoming/26-LAUNCH-ENGINE.md` — informational; LaunchOutcome consumed for narrative.
- `obsidian/brain/MarkOS Canon.md`.
- `obsidian/brain/Brand Stance.md`.
- `obsidian/brain/Pricing Engine Canon.md` — pricing_signal feedback (D-26); placeholder rule on pricing-touching narratives.
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`.
- `obsidian/reference/Contracts Registry.md`.
- `obsidian/reference/Database Schema.md`.
- `obsidian/reference/Core Lib.md`.
- `obsidian/reference/HTTP Layer.md` — `/v1/analytics/*` conventions.
- `obsidian/reference/UI Components.md`.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 225 + dep graph (209, 211, 212, 221-224).
- `.planning/REQUIREMENTS.md` — ANL-01..05, EVD-01..06 (carry), LOOP-07/08, QA-01..15.
- `.planning/STATE.md`.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — "Analytics exists as CRM reporting, not yet as a semantic layer".
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.
- `.planning/phases/225-analytics-attribution-narrative-intelligence/DISCUSS.md`.
- `.planning/phases/225-analytics-attribution-narrative-intelligence/225-RESEARCH.md` — refresh at plan-phase.

### Prior phase decisions Analytics must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-09/D-10 RLS + audit.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-04 confidence-aware identity stitching consumed by attribution.
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package pattern + reporting cockpit evolved (D-37).
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md` — Pricing Engine consumes pricing_signals (D-26/D-27).
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun wraps recompute jobs (D-32).
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief (D-38/D-39).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL + freshness binding (D-14/D-15/D-33).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — strategy/brief/draft loop + {{MARKOS_PRICING_ENGINE_PENDING}} (D-16).
- `.planning/phases/212-learning-literacy-evolution/212-CONTEXT.md` — LearningCandidate consumed (D-21/D-29).
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-08 cdp_events, D-24 tombstone cascade (D-45), D-22 read-only API.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-05/D-06 timeline taxonomy, D-08 nba_records, D-12 lifecycle_stage matches D-31, D-29 fan-out pattern.
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — dispatch_events consumed by attribution; LaunchSurface email_campaign refs.
- `.planning/phases/224-conversion-launch-workspace/224-CONTEXT.md` — D-09/D-10 conversion_events, D-21..D-24 ConversionExperiment + variant_id (D-22 winner detection lands here), D-39..D-41 LaunchOutcome consumed.

### Existing code + test anchors
- `lib/markos/crm/attribution.ts` — current FAMILY_WEIGHTS attribution; becomes legacy first_touch model adapter (D-07).
- `lib/markos/crm/reporting.ts` — readiness/cockpit/exec-summary/central-rollup; evolve into AnalyticsWorkspace.
- `api/crm/reporting/attribution.js` — drill-down seam; refactor to read attribution_touches.
- `app/(markos)/crm/reporting/page.tsx` — reporting cockpit shell (target of D-37 evolution).
- `lib/markos/crm/timeline.ts::buildCrmTimeline` — consumed by attribution computation.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState + AudienceSnapshot reads.
- `lib/markos/crm360/*` (P222) — Customer360 + Opportunity + nba_records.
- `lib/markos/channels/*` (P223) — dispatch_events.
- `lib/markos/conversion/events/emit.ts` (P224) — conversion_events.
- `lib/markos/launches/*` (P224) — LaunchOutcome consumer.
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` (P105).
- `markos_audit_log` (P201 hash chain).
- Vercel AI Gateway (per knowledge update) — narrative generation provider.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/attribution.ts::computeRevenueContribution` — preserved as legacy first_touch model; new attribution_models registry adapts.
- `lib/markos/crm/timeline.ts::buildCrmTimeline` — consumed by attribution + journey_steps recompute.
- `lib/markos/crm/reporting.ts` — readiness/cockpit/executive-summary patterns evolve into semantic-layer-backed AnalyticsWorkspace.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState reads.
- `lib/markos/crm360/*` (P222) — Customer360 + Opportunity + nba_records reads.
- `lib/markos/channels/*` (P223) — dispatch_events for channel attribution.
- `lib/markos/conversion/events/emit.ts` (P224) — conversion_events for conversion attribution.
- `lib/markos/launches/outcomes/*` (P224) — LaunchOutcome consumer for launch_outcome narrative_kind.
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` — approval-package pattern.
- AgentRun (P207) — wraps long-running recompute.
- Vercel Cron — scheduled cadence per metric freshness_mode.
- Vercel AI Gateway — narrative LLM with provider fallback (per knowledge update).
- markos_audit_log (P201) — every analytics mutation.

### Established patterns
- Adapter-based legacy bridge (P222 D-19, P223 legacy outbound, P224 legacy marketing routes).
- Single fan-out emit() + fail-closed transaction (P222 D-29 + P223 D-29 + P224 D-33/D-34).
- Approval-package per high-risk mutation (P105 + P208).
- AgentRun wraps long-running jobs (P207).
- Vercel Cron scheduled cadence (P221 trait recompute, P222 NBA recompute, P223 deliverability rollup, P224 outcome compute).
- EvidenceMap binding (P209) on every claim.
- Tombstone propagation (P221 D-24 → P222 D-32 → P224 → P225 D-45).
- markos_audit_log hash chain (P201).
- Polymorphic FK with CHECK constraint (P224 D-14 LaunchSurface pattern; carry to attribution_touches.campaign_id polymorphic).
- {{MARKOS_PRICING_ENGINE_PENDING}} placeholder (P211 + CLAUDE.md + D-16).

### Integration points
- **Upstream events:** cdp_events (P221 D-08), conversion_events (P224 D-09), dispatch_events (P223 D-29), crm_activity (P222 D-05), lifecycle_transitions (P222 D-12), LaunchOutcome (P224 D-39).
- **Downstream P226:** consumes attribution_touches + journey_steps + experiment_winners for sales enablement scoring + battlecards.
- **Downstream P227:** consumes ecosystem-relevant metrics (partner-attributed revenue, community engagement) + benchmarks.
- **Downstream P228:** integration closure consumes full analytics surface for cross-engine reconciliation.
- **P205 Pricing Engine:** consumes pricing_signals via cdp_events; emits PricingRecommendation.
- **P212 Learning:** consumes aggregated_metrics + analytics LearningCandidate emissions.
- **P218 PLG Growth:** experiment_winners consumed for variant promotion; PQL signals fed back as TraitSnapshot updates.
- **P222 Customer360:** lifecycle_stage progression hook fired by analytics threshold (e.g., "PQL score >X → engaged").
- **P208 Approval Inbox + Morning Brief:** new entry types from D-38.
- **AgentRun (P207):** wraps recompute + narrative gen.
- **EvidenceMap (P209):** every claim binds.
- **Audit:** every mutation writes markos_audit_log.

</code_context>

<specifics>
## Specific Ideas

- "One metrics model across marketing, product, CRM, support, and billing" (doc 22 rule 1) — D-01 metric_definitions is THE catalog; downstream engines (P226/P227) MUST read from it, not invent.
- "Revenue truth and activity truth must meet in the same system" (doc 22 rule 2) — attribution_touches join Opportunity (revenue) to events (activity).
- "Every major metric must be explainable down to its event sources" (doc 22 rule 3) — D-01 source_event_families[] + drilldown_spec; AttributionExplorer renders touchpoint timeline.
- "Narratives and anomalies are products, not presentation afterthoughts" (doc 22 rule 4) — D-09 anomaly_detections + D-13 narratives are first-class SOR.
- "Attribution must be multi-model and confidence-scored" (doc 22 rule 5) — D-05/D-06 6 standard models coexist + confidence_score.
- "Experiments, launches, and lifecycle changes must feed the same measurement layer" (doc 22 rule 6) — D-22 winner detection consumes ConversionExperiment + future MarketingExperiment.
- "Analytics must create actions, not only charts" (doc 22 rule 7) — D-18..D-21 decision_rules + action_kind emissions.
- LLM narrative gen via Vercel AI Gateway (per knowledge update) — provider-fallback + zero-data-retention; default to claude-sonnet-4-6 for narrative gen (good cost/quality), upgrade to claude-opus-4-7 for high-confidence audits.
- Bayesian winner detection enables "peeking" without inflating false-positive rate — operators can check experiments mid-flight.

</specifics>

<deferred>
## Deferred Ideas

### For future commercial-engine phases
- Sales enablement (battlecards + proof packs + win/loss capture) → P226 (consumes attribution + journeys + experiments).
- Ecosystem partner/affiliate/community/developer-growth analytics → P227.
- Commercial OS integration closure → P228 cross-engine reconciliation.

### For future analytics enrichment
- Real-time event streaming (Kafka/Redpanda) — defer; Vercel Cron + AgentRun sufficient for v1 cadence.
- Customer-facing analytics dashboards / embedded SDK → defer.
- Predictive ML models (LTV prediction, churn prediction beyond risk_score, MMM marketing-mix-modeling) — v2.
- Differential privacy on cross-tenant aggregation — defer; aggregate-only + k-anonymity sufficient for v1.
- Custom metric DSL editor (visual formula builder) → v2 operator UX.
- Data warehouse export / BI integration (Snowflake, BigQuery, dbt) — defer.
- Cohort retention curves beyond standard SaaS metrics — v2.
- Real-time dashboards with WebSocket updates — defer.
- Forecasting (revenue, pipeline, activation) — v2 once ML stack lands.
- Causal inference / uplift modeling for experiments — v2 (Bayesian + frequentist sufficient v1).

### Reviewed Todos (not folded)
None — no pending todos matched Phase 225 scope.

### Review-driven deferrals (added 2026-04-25)

- **App Router migration** — DEFERRED. P225 ships against legacy `api/*.js` (per D-49). When/if a future phase migrates the entire api surface to App Router (`api/v1/**/route.ts`), it owns the migration; P225 routes can be ported at that point.
- **Top-level `app/(markos)/conversion/`, `app/(markos)/launches/`, `app/(markos)/operating/` route groups** — DEFERRED to their owning phases. P225 only ships `app/(markos)/analytics/`.
- **`vitest`, `playwright`, `@playwright/test`, `supabase:gen-types`, `openapi-generate` toolchain additions** — DEFERRED. P225 uses existing `npm test` (Node `--test`) + `chromatic` + `openapi:build`. If a future phase needs these, that phase MUST land them as a precondition (per D-50).
- **`lib/markos/{cdp,crm360,channels,conversion,launches,operating}/*` greenfield trees** — OWNED BY OTHER PHASES (P221, P222, P223, P224, P208 closure). P225 hard-fails if these are absent at runtime; does NOT create them (per D-53/D-54).
- **Soft-skip / draft-only / inactive-rule degradation paths** — DEFERRED + REJECTED. All evaluators, generators, writeback paths must fail-closed when upstream phases absent. NO bridge stub fallback. NO "draft with warnings". NO "inactive seed if upstream absent" pattern (per D-55).


</deferred>

---

*Phase: 225-analytics-attribution-narrative-intelligence*
*Context gathered: 2026-04-24*
