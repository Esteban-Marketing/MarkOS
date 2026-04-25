# Phase 225: Analytics, Attribution, and Narrative Intelligence — Research

**Researched:** 2026-04-24 (decision-aware overwrite; supersedes seed)
**Domain:** Semantic analytics SOR — metric_definitions catalog + multi-touch attribution + anomaly state machine + hybrid template-LLM narratives + decision_rules registry + Bayesian-frequentist experiment winner detection + pricing signal feedback + cross-tenant k-anonymity aggregation + materialized journey_steps + per-metric freshness contracts + read-write `/v1/analytics/*` API + 7 MCP tools + 6 UI workspaces
**Confidence:** HIGH (all claims verified against: 225-CONTEXT.md 48 locked decisions, prior phase CONTEXT.md files P221–P224, plan files 221-01..224-07, REQUIREMENTS.md, Contracts Registry, Database Schema, Testing Environment Plan, codebase reads of lib/markos/crm/attribution.ts + reporting.ts + timeline.ts)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Metric catalog
- D-01: DB-resident `metric_definitions` SOR with `metric_id, tenant_id (NULL=global), category ∈ {acquisition, activation, conversion, pipeline, revenue, retention, support, pricing, community}, grain ∈ {person, account, campaign, content, channel, tenant}, name, formula_description, formula_dsl JSONB (typed query AST), source_event_families[], source_precedence_chain[], freshness_mode ∈ {real_time, hourly, daily, weekly}, last_computed_at, anomaly_config JSONB, drilldown_spec JSONB, version, status ∈ {draft, approved, deprecated, archived}, approved_by, approved_at`. RLS on tenant_id (global visible to all tenants).
- D-02: `metric_overrides` table for per-tenant customization of global metrics: `override_id, tenant_id, parent_metric_id (FK → metric_definitions where tenant_id IS NULL), formula_dsl JSONB (override fragment), anomaly_config JSONB, drilldown_spec JSONB, status, approved_by, approved_at`. Tenant override wins; fallback to global.
- D-03: 27 universal core metrics seeded as global rows on migration (see full list: pipeline_created, pipeline_influenced, win_rate, sales_cycle_velocity, cac, cac_payback, conversion_rate_by_stage, campaign_efficiency, content_assisted_revenue + 9 SaaS metrics + 9 messaging metrics).
- D-04: Operator workspace allows per-tenant override + version promotion via `MetricCatalogEditor`. Approval-package pattern (P208 + P105) on global metric mutations.

#### Attribution models
- D-05: New `attribution_models` table: `model_id, tenant_id (NULL=global), name ∈ {first_touch, last_touch, linear, position_based, time_decay, data_driven}, version, weights_strategy JSONB, lookback_days, status, approved_by`. Six standard models seeded as global rows; tenants can clone + customize.
- D-06: New `attribution_touches` SOR: `touch_id, tenant_id, opportunity_id (FK → P222 opportunities), profile_id (FK → P221 cdp_identity_profiles), account_id, campaign_id (polymorphic FK → email_campaigns OR conversion_experiments), channel ∈ {organic_search, paid_search, social, email, messaging, direct, referral, partner, community, event, product}, occurred_at, touch_type ∈ {first, assist, last, influential}, confidence_score, model_id (FK → attribution_models), model_version, source_event_ref`. RLS on tenant_id.
- D-07: Attribution triggered by (1) Opportunity stage_change, (2) operator recompute via API/MCP, (3) cron weekly for active opps. Existing `lib/markos/crm/attribution.ts` FAMILY_WEIGHTS becomes legacy first_touch adapter.
- D-08: Multi-model coexistence: attribution_touches stores rows for ALL active models per Opportunity (model_id discriminator). UI selects model_id at query time.

#### Anomaly detection
- D-09: `anomaly_detections` SOR: `detection_id, tenant_id, metric_id (FK), period_start, period_end, baseline_value, observed_value, deviation_sigma, severity ∈ {low, medium, high, critical}, status ∈ {detected, acknowledged, investigating, resolved, dismissed}, assigned_to_user_id, resolution_summary, evidence_refs[], narrative_id (FK nullable), detected_at, acknowledged_at, resolved_at, suppressed_until`. RLS on tenant_id.
- D-10: Anomaly trigger config from `metric_definitions.anomaly_config`: `sigma_threshold` (default 2.0), `min_sample_size` (default 30), `sensitivity ∈ {low, medium, high}`, `seasonality_aware` bool.
- D-11: State machine: detected → acknowledged → investigating → resolved | dismissed. AnomalyInbox surface (D-37). Auto-suppress duplicate detections within `suppressed_until` window.
- D-12: Severity = function of (deviation_sigma, metric.category importance, business_impact_score). Critical → operator task + email (P208 Approval Inbox).

#### Narrative intelligence
- D-13: `narratives` SOR: `narrative_id, tenant_id, period_start, period_end, narrative_kind ∈ {weekly_summary, launch_outcome, campaign_recap, anomaly_explanation, growth_story, churn_warning, pricing_signal, experiment_recap}, scaffold_template_id (FK → narrative_templates), generated_text, summary, supporting_metric_ids[], supporting_evidence_refs[], confidence ∈ {high, medium, low}, recommended_actions[], status ∈ {draft, audited, approved, published, archived}, approved_by, approved_at, audit_findings JSONB`. RLS on tenant_id.
- D-14: Hybrid generation: template scaffold (`narrative_templates`) + LLM fills clauses + every numeric/factual claim binds to EvidenceMap claim_id (P209). Pre-publish claim audit blocks display when any claim fails.
- D-15: `narrative_claims` junction table: `claim_id, narrative_id, claim_text, evidence_ref (FK → EvidenceMap), confidence, freshness_mode, audited_at, audit_status ∈ {pending, passed, failed, manual_override}`. Every numeric/factual span MUST have a row.
- D-16: Pricing-touching narratives use `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder until approved Pricing Engine record (P205). Enforced per P211 + CLAUDE.md rule.
- D-17: narrative_kind drives template + tone: weekly_summary → operator brief; launch_outcome → consumes P224 LaunchOutcome at T+7/T+14/T+30; experiment_recap → consumes ConversionExperiment + winner_detection; growth_story → cross-domain with strongest claim audit.

#### Decision routing
- D-18: `decision_rules` table: `rule_id, tenant_id, name, trigger_kind ∈ {anomaly_detected, threshold_crossed, trend_change, forecast_warning, experiment_winner, pricing_signal, freshness_violation, conversion_drop}, trigger_config JSONB, action_kind ∈ {create_task, emit_alert, require_approval, generate_narrative, create_learning_candidate, create_pricing_signal, suppress_send}, action_config JSONB, status, version, owner_user_id, last_fired_at, fire_count, audit_log_chain JSONB`. RLS on tenant_id.
- D-19: Pluggable evaluator pattern (`lib/markos/analytics/decision/evaluators/`): one module per trigger_kind.
- D-20: Default decision rules seeded per tenant on activation. Operator can edit + version + disable.
- D-21: action_kind=create_pricing_signal → emits cdp_events row with event_domain='analytics' for P205. action_kind=create_learning_candidate → writes P212 LearningCandidate.

#### Experiment winner detection
- D-22: `experiment_winners` table: `winner_id, tenant_id, experiment_id (FK → conversion_experiments), variant_id (FK → experiment_variants), bayesian_probability, frequentist_p_value, confidence_threshold_met (bool), sample_size, duration_days, novelty_effect_window_days, ice_score, winner_detected_at, approved_by, approved_at, status ∈ {detected, pending_approval, approved, rejected}`. RLS on tenant_id.
- D-23: Bayesian primary (Beta-Binomial posterior; bayesian_probability >= 0.95) + Frequentist guardrail (two-sided z-test; p_value <= 0.05). Both must agree at 95% for winner declared.
- D-24: Guardrails: min_sample_size (default 1000/variant), min_duration_days (default 7), novelty_effect_window_days (first 3 days excluded), seasonality adjustment for >14d experiments.
- D-25: ICE backlog scoring (impact × confidence × ease). Operator approves before variant promotion (P208 Approval Inbox). Auto-pause experiments past min_duration when winner detected.

#### Pricing Engine feedback loop
- D-26: Pricing signals via cdp_events (event_domain='analytics', event_name='analytics.pricing_signal'). Signal payload: `signal_kind ∈ {price_test_winner, conversion_rate_drop, competitive_threat, activation_lift_observed, churn_pricing_correlation}, evidence_refs[], confidence, recommended_change, narrative_id`.
- D-27: `pricing_signals` audit table: `signal_id, tenant_id, signal_kind, payload JSONB, emitted_at, consumed_by_p205, consumed_at`.

#### Cross-tenant anonymized learning
- D-28: `aggregated_metrics` table: `aggregation_id, dimension ∈ {industry, segment, company_size, region, business_type}, dimension_value, period, metric_id, value, sample_size, k_anonymity_threshold (default 5), computed_at, status`. Cross-tenant read WHERE sample_size >= k_anonymity_threshold.
- D-29: Tenant opt-in via `analytics_cross_tenant_share = true` (default false). Retroactive opt-out.
- D-30: No raw event/profile/Opportunity/identity leak. Trusted server-side cron only. EvidenceMap claim_id on every aggregated_metrics row.

#### Journey analytics
- D-31: `journey_steps` SOR (materialized): `step_id, tenant_id, profile_id (FK → cdp_identity_profiles), account_id, period_start, period_end, ordered_event_refs[], funnel_stage ∈ {anonymous, known, engaged, mql, sql, opportunity, customer, expansion, advocate, lost} (matches P222 D-11), time_in_stage_seconds, transition_drivers[]`. RLS on tenant_id.
- D-32: Recompute: hourly for active profiles (engaged/mql/sql/opportunity), daily for inactive, weekly historical. Cron via Vercel Cron + AgentRun (P207). Bridge stub if P207 absent.

#### Freshness contract per metric
- D-33: Every metric has `freshness_mode` + `last_computed_at`. Stale-data renderer shows warning at: real_time >5min stale; hourly >2h; daily >36h; weekly >9d.
- D-34: `freshness_audit` cron logs SLA violations to `markos_audit_log`; trigger_kind=freshness_violation in decision_rules can fire create_task.

#### API + MCP surface
- D-35: Read-write `/v1/analytics/*` API covering metrics, attribution, anomalies, narratives, decision-rules, journeys, experiments, and benchmarks.
- D-36: 7 MCP tools: `get_metric`, `get_attribution`, `list_anomalies`, `generate_narrative`, `evaluate_decision`, `get_journey`, `list_experiment_winners`.

#### UI surface
- D-37: 6 UI workspaces in P208 single-shell: AnalyticsWorkspace, AttributionExplorer, AnomalyInbox, NarrativeFeed, ExperimentsCockpit, DecisionRulesEditor + BenchmarksPanel.
- D-38: Approval Inbox gains: anomaly_critical, narrative_publish, decision_rule_change, experiment_winner_promotion, metric_definition_change.
- D-39: Morning Brief surfaces: top open anomalies, top narrative published in last 24h, experiment winners pending, freshness SLA violations.

#### Observability + operator posture
- D-40: freshness_audit cron logs SLA violations; decision_rules can fire create_task.
- D-41: Anomaly spike alerts: anomaly_detection rate >2σ from 7-day baseline → operator task.
- D-42: Narrative audit log: claim_audit failures + manual overrides logged with operator + reason.

#### Security + tenancy
- D-43: RLS on all 15 new tables. Fail closed on missing tenant context. aggregated_metrics cross-tenant read gated by k_anonymity_threshold.
- D-44: Audit trail on metric_definition mutations, anomaly state transitions, narrative publish, decision_rule edits, experiment_winner approvals, cross-tenant aggregation runs.
- D-45: Tombstone propagation: profile tombstoned → attribution_touches + journey_steps scrub PII; aggregated_metrics excludes tombstoned profiles.
- D-46: Cross-tenant aggregation trusted server only (Vercel Cron + AgentRun). EvidenceMap claim_id on every aggregated_metrics row.

#### Contracts + migrations
- D-47: F-IDs continue after P224 F-146. Expect 12-16 new contracts (F-147..F-162).
- D-48: Migrations continue after P224 migration 133. Expect 9-12 (migrations 134..145).

### Claude's Discretion
- Module boundary under `lib/markos/analytics/*` (catalog, attribution, anomaly, narrative, decision, experiments, journey, benchmark).
- Bayesian posterior implementation (Beta-Binomial for binary conversion; Normal-Gamma for continuous).
- Time-decay attribution half_life_days default (7 days).
- LLM provider for narrative generation (Vercel AI Gateway with provider fallback; default claude-sonnet-4-6).
- formula_dsl typing strategy (typed AST vs JSONLogic vs SQL fragment).
- Cron schedules for anomaly detection, narrative gen, journey recompute, freshness audit, aggregation.
- xxhash3 vs SHA-256 for journey_steps deterministic hashing.

### Deferred Ideas (OUT OF SCOPE)
- Sales enablement battlecards/proof-packs → P226.
- Ecosystem partner/affiliate/community/developer growth analytics → P227.
- Commercial OS integration closure → P228.
- Real-time event streaming (Kafka-style) — Vercel Cron + AgentRun sufficient for v1.
- Customer-facing analytics dashboards / embedded SDK.
- Predictive ML models (LTV, churn prediction beyond risk_score) — v2.
- Differential privacy on cross-tenant aggregation — k-anonymity sufficient v1.
- Custom metric DSL editor (visual formula builder) — v2.
- Data warehouse export / BI integration — deferred.
- Cohort retention curves beyond standard SaaS metrics — v2.
- Real-time dashboards with WebSocket updates — deferred.
- Forecasting (revenue, pipeline, activation) — v2 once ML stack lands.
- Causal inference / uplift modeling for experiments — v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANL-01 | Semantic analytics layer for attribution, funnel, journey, revenue, retention, ecosystem, and launch metrics with clear source precedence | D-01 metric_definitions + D-05..D-08 attribution + D-31 journey_steps; schema sketches below |
| ANL-02 | Every metric explainable, drillable, freshness-aware; no opaque numbers | D-01 drilldown_spec + D-33 freshness_mode + D-34 freshness_audit; StaleIndicator component |
| ANL-03 | Dashboards produce tasks, alerts, narratives, and decisions; not passive reporting | D-09..D-12 anomaly_detections + D-13..D-17 narratives + D-18..D-21 decision_rules |
| ANL-04 | Attribution spans content, social, CRM, email, messaging, launches, partner, community, and revenue outcomes | D-06 attribution_touches channel enum + D-07 source event consumption |
| ANL-05 | Analytics definitions, windows, and models versioned, tenant-aware, compatible with agent-driven narrative generation | D-01 version field + D-02 overrides + D-14 hybrid generation + D-36 MCP tools |
| EVD-01 | EvidenceMap links factual claims to citations, source quality, freshness, confidence, TTL, known gaps | D-15 narrative_claims + evidence_ref FK → P209 EvidenceMap; carry-forward |
| EVD-02 | Unsupported customer-facing claims block dispatch or labeled inference | D-14 pre-publish claim audit blocks display; carry-forward |
| EVD-03 | Research tiers and source quality policies recorded on research context | D-15 audit_status; carry-forward |
| EVD-04 | Agents reuse non-stale research before starting new | D-34 freshness contract; carry-forward |
| EVD-05 | Approval UI exposes evidence, assumptions, claim risk | D-37..D-39 Approval Inbox entry types; carry-forward |
| EVD-06 | Pricing and competitor intelligence uses source quality, extraction method, timestamp | D-16 + D-26 pricing_signals with evidence_refs; carry-forward |
| LOOP-07 | Weekly Narrative ties outcomes to pipeline or leading indicators | D-13 narrative_kind=weekly_summary; D-17 templates |
| LOOP-08 | Measurement updates artifact performance and next-task recommendations | D-18..D-21 decision_rules + action_kind=create_task; D-25 ICE scoring |
| QA-01..15 | Phase 200 Quality Baseline all 15 gates | Validation Architecture section; per-slice test inventory below |

</phase_requirements>

---

## Summary

Phase 225 ships the semantic analytics system-of-record for MarkOS. Where phases 221–224 established the event substrate (cdp_events, conversion_events, dispatch_events) and the operational SOR (profiles, opportunities, campaigns, launches), Phase 225 builds the measurement intelligence layer above them: a DB-resident metric catalog with per-tenant overrides, multi-touch attribution computed for all 6 standard models simultaneously, first-class anomaly detection with a governed state machine, hybrid template+LLM narratives with mandatory EvidenceMap claim audit, a decision_rules engine that turns analytics conclusions into tasks/alerts/approvals, Bayesian-primary + frequentist-guardrail winner detection for ConversionExperiments (carrying the P224 D-24 deferred work), a decoupled pricing_signals feedback loop via cdp_events, aggregate-only k-anonymity cross-tenant benchmarks, and materialized journey_steps.

The existing `lib/markos/crm/attribution.ts` (FAMILY_WEIGHTS model) and `lib/markos/crm/reporting.ts` (cockpit/readiness) become the legacy first_touch adapter and AnalyticsWorkspace predecessor respectively — preserved as working adapters through the transition, not replaced. The module tree lands under `lib/markos/analytics/*` following the same boundary convention established in P221–P224.

**Primary recommendation:** Build in 7 slices across 5 waves. Waves 1-2 lay the schema + compute infra. Waves 3-4 add intelligence layers (anomaly, narrative, decision, experiment). Wave 5 closes API + UI + observability. Start plan 225-01 with Wave 0 test infrastructure + 15 migrations + 27 metric seeds before any compute code.

---

## F-ID + Migration Allocation

### Verified F-ID Chain [VERIFIED: plan files 221-01-PLAN.md, 222-06-PLAN.md, 223-06-PLAN.md, 224-07-PLAN.md]

| Phase | F-ID range | Count |
|-------|-----------|-------|
| P221 | F-106..F-112 | 7 |
| P222 | F-113..F-121 | 9 |
| P223 | F-122..F-131 | 10 |
| P224 | F-132..F-146 | 15 |
| **P225 (this phase)** | **F-147..F-162** | **16** |

### Verified Migration Chain [VERIFIED: 221-01-PLAN.md migration 101, 222-06-PLAN.md migrations 106..112, 223-06-PLAN.md migrations 113..120, 224-07-PLAN.md migration 133]

| Phase | Migration range | Count |
|-------|----------------|-------|
| P221 | 101..105 | 5 |
| P222 | 106..112 | 7 |
| P223 | 113..120 | 8 |
| P224 | 121..133 | 13 |
| **P225 (this phase)** | **134..145** | **12** |

### F-147..F-162 Contract Assignment

| F-ID | Contract name | Slice | Type |
|------|---------------|-------|------|
| F-147 | analytics-metric-definition-v1 | 225-01 | read-write |
| F-148 | analytics-metric-override-v1 | 225-01 | read-write |
| F-149 | analytics-attribution-model-v1 | 225-01 | read-write |
| F-150 | analytics-attribution-touch-v1 | 225-01 | read-write |
| F-151 | analytics-anomaly-detection-v1 | 225-01 | read-write |
| F-152 | analytics-narrative-v1 | 225-01 | read-write |
| F-153 | analytics-narrative-template-v1 | 225-01 | read-write |
| F-154 | analytics-narrative-claim-v1 | 225-01 | read-write |
| F-155 | analytics-decision-rule-v1 | 225-01 | read-write |
| F-156 | analytics-experiment-winner-v1 | 225-01 | read-write |
| F-157 | analytics-attribution-recompute-v1 | 225-03 | write/MCP |
| F-158 | analytics-anomaly-evaluate-v1 | 225-04 | write/MCP |
| F-159 | analytics-narrative-generate-v1 | 225-05 | write/MCP |
| F-160 | analytics-journey-step-v1 | 225-05 | read |
| F-161 | analytics-aggregated-metric-v1 | 225-06 | read |
| F-162 | analytics-decision-evaluate-v1 | 225-06 | write/MCP |

### Migration 134..145 Assignment

| Migration | Content | Slice |
|-----------|---------|-------|
| 134 | `metric_definitions` + `metric_overrides` + RLS + global metric seeds (27 rows) | 225-01 |
| 135 | `attribution_models` + global 6 model seeds + `attribution_touches` + RLS | 225-01 |
| 136 | `anomaly_detections` + RLS + indexes | 225-01 |
| 137 | `narrative_templates` + `narratives` + `narrative_claims` + RLS | 225-01 |
| 138 | `decision_rules` + default 7 rule seeds + `experiment_winners` + `experiment_decisions` + RLS | 225-01 |
| 139 | `journey_steps` + RLS + indexes + `freshness_audit` table | 225-02 |
| 140 | `aggregated_metrics` + `pricing_signals` + RLS + cross-tenant read policy | 225-06 |
| 141 | formula_dsl evaluator schema validation function (Postgres function only) | 225-02 |
| 142 | attribution_touches indexes (hot path: opportunity_id+model_id, profile_id+occurred_at) | 225-03 |
| 143 | anomaly_detections + journey_steps composite indexes | 225-04 |
| 144 | RLS hardening pass — verify 15 tables; cross-tenant aggregated_metrics read policy | 225-07 |
| 145 | OpenAPI regen + Supabase type generation + flow-registry sync | 225-07 |

---

## Standard Stack

### Core [VERIFIED: codebase + prior phase CONTEXT.md files]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^2.x (inherited from P221+) | Unit + integration tests | Mandatory per QA doctrine; already wired |
| Playwright | ^1.x (inherited) | Browser workflow proof | Mandatory per QA doctrine |
| Vercel AI SDK + Vercel AI Gateway | latest (per Vercel knowledge update) | Narrative LLM generation with provider fallback + ZDR | D-45 discretion; confirmed available per knowledge update |
| Supabase JS v2 | ^2.x (inherited) | RLS + typed queries | Project-wide; all prior phases |
| json-logic-js | ^2.x (already in project — P221 used it for audience DSL) | formula_dsl evaluation for metric formulas | Tenant-safe; no SQL fragment injection risk |
| xxhash3 (or SHA-256 truncated fallback) | npm xxhash-wasm ^1.x | Deterministic step_id hashing for journey_steps | Discretion item; xxhash3 faster for large event ref arrays |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^3.x (inherited) | Lookback window calculations, cadence arithmetic | Attribution lookback_days, freshness window checks |
| zod | ^3.x (inherited) | formula_dsl JSONB validation, typed AST parse | Wave 0 fixture typing + runtime schema guards |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| json-logic-js for formula_dsl | SQL fragment | SQL fragment creates tenant-safety risk (operator-edited formula → SQL injection); json-logic-js is sandboxed and already in project |
| Vercel AI Gateway | Direct Anthropic API | Gateway provides provider fallback + ZDR + cost visibility per Vercel knowledge update; matches D-45 discretion choice |
| Beta-Binomial Bayesian in-house | external stats package | Simple enough for binary conversion; no additional dependency; keeps code auditable |

**Installation (new dependencies only):**

```bash
npm install xxhash-wasm
```

All other dependencies are already installed per P221 Wave 0.

---

## Schema Sketches

### 1. metric_definitions (migration 134) [VERIFIED: D-01]

```sql
CREATE TABLE metric_definitions (
  metric_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  -- NULL = global; visible to all tenants
  category        text NOT NULL CHECK (category IN (
    'acquisition','activation','conversion','pipeline','revenue',
    'retention','support','pricing','community')),
  grain           text NOT NULL CHECK (grain IN (
    'person','account','campaign','content','channel','tenant')),
  name            text NOT NULL,
  formula_description text,
  formula_dsl     jsonb NOT NULL,  -- typed AST; see formula_dsl schema
  source_event_families text[] NOT NULL DEFAULT '{}',
  source_precedence_chain text[] NOT NULL DEFAULT '{}',
  freshness_mode  text NOT NULL DEFAULT 'daily'
                  CHECK (freshness_mode IN ('real_time','hourly','daily','weekly')),
  last_computed_at timestamptz,
  anomaly_config  jsonb NOT NULL DEFAULT '{"sigma_threshold":2.0,"min_sample_size":30,"sensitivity":"medium","seasonality_aware":false}',
  drilldown_spec  jsonb NOT NULL DEFAULT '{"allowed_dimensions":[],"default_breakdown":null}',
  version         integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','approved','deprecated','archived')),
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)  -- allows global (NULL) + per-tenant same name
);

-- Global metrics visible to all; tenant metrics tenant-scoped
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY metric_definitions_tenant_read ON metric_definitions
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE POLICY metric_definitions_tenant_write ON metric_definitions
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_metric_definitions_category ON metric_definitions(category) WHERE status = 'approved';
CREATE INDEX idx_metric_definitions_tenant_status ON metric_definitions(tenant_id, status);
```

### 2. metric_overrides (migration 134) [VERIFIED: D-02]

```sql
CREATE TABLE metric_overrides (
  override_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  parent_metric_id  uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  -- RESTRICT: don't silently break tenant override if global metric deleted
  formula_dsl       jsonb,  -- NULL = inherit global
  anomaly_config    jsonb,
  drilldown_spec    jsonb,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','approved','deprecated')),
  approved_by       uuid REFERENCES auth.users(id),
  approved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, parent_metric_id)
);

ALTER TABLE metric_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY metric_overrides_tenant ON metric_overrides
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 3. attribution_models (migration 135) [VERIFIED: D-05]

```sql
CREATE TABLE attribution_models (
  model_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,  -- NULL = global
  name              text NOT NULL CHECK (name IN (
    'first_touch','last_touch','linear','position_based','time_decay','data_driven')),
  version           integer NOT NULL DEFAULT 1,
  weights_strategy  jsonb NOT NULL,
  -- Examples:
  -- first_touch:      {"type":"first_touch"}
  -- linear:           {"type":"equal"}
  -- position_based:   {"type":"position_based","first_weight":0.4,"last_weight":0.4,"middle_weight":0.2}
  -- time_decay:       {"type":"time_decay","half_life_days":7}
  -- data_driven:      {"type":"data_driven","ml_model_ref":null}
  lookback_days     integer NOT NULL DEFAULT 90,
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','deprecated','archived')),
  approved_by       uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attribution_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY attribution_models_read ON attribution_models
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE POLICY attribution_models_write ON attribution_models
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 4. attribution_touches (migration 135) [VERIFIED: D-06]

```sql
CREATE TABLE attribution_touches (
  touch_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id   uuid NOT NULL,  -- FK → P222 opportunities; RESTRICT (attribution history preserved)
  profile_id       uuid,           -- FK → P221 cdp_identity_profiles; nullable (anon touch)
  account_id       uuid,
  campaign_id      uuid,           -- polymorphic; see campaign_kind
  campaign_kind    text CHECK (campaign_kind IN ('email_campaign','conversion_experiment')),
  channel          text NOT NULL CHECK (channel IN (
    'organic_search','paid_search','social','email','messaging',
    'direct','referral','partner','community','event','product')),
  occurred_at      timestamptz NOT NULL,
  touch_type       text NOT NULL CHECK (touch_type IN ('first','assist','last','influential')),
  confidence_score numeric(4,3) NOT NULL DEFAULT 1.0 CHECK (confidence_score BETWEEN 0 AND 1),
  model_id         uuid NOT NULL REFERENCES attribution_models(model_id) ON DELETE RESTRICT,
  model_version    integer NOT NULL,
  credit_weight    numeric(5,4),  -- computed weight for this model
  source_event_ref uuid,           -- threads to cdp_events
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attribution_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY attribution_touches_tenant ON attribution_touches
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

-- Hot query paths (D-48)
CREATE INDEX idx_attribution_touches_opp_model ON attribution_touches(opportunity_id, model_id);
CREATE INDEX idx_attribution_touches_profile ON attribution_touches(tenant_id, profile_id, occurred_at DESC);
CREATE INDEX idx_attribution_touches_account ON attribution_touches(tenant_id, account_id, occurred_at DESC);
```

### 5. anomaly_detections (migration 136) [VERIFIED: D-09]

```sql
CREATE TABLE anomaly_detections (
  detection_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  metric_id         uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  period_start      timestamptz NOT NULL,
  period_end        timestamptz NOT NULL,
  baseline_value    numeric,
  observed_value    numeric NOT NULL,
  deviation_sigma   numeric NOT NULL,
  severity          text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status            text NOT NULL DEFAULT 'detected'
                    CHECK (status IN ('detected','acknowledged','investigating','resolved','dismissed')),
  assigned_to_user_id uuid REFERENCES auth.users(id),
  resolution_summary  text,
  evidence_refs     uuid[] NOT NULL DEFAULT '{}',
  narrative_id      uuid,  -- FK → narratives; set when narrative generated
  detected_at       timestamptz NOT NULL DEFAULT now(),
  acknowledged_at   timestamptz,
  resolved_at       timestamptz,
  suppressed_until  timestamptz
);

ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY anomaly_detections_tenant ON anomaly_detections
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_anomaly_detections_status_severity ON anomaly_detections(tenant_id, status, severity);
CREATE INDEX idx_anomaly_detections_metric_period ON anomaly_detections(metric_id, period_start DESC);
```

### 6. narrative_templates (migration 137) [VERIFIED: D-14]

```sql
CREATE TABLE narrative_templates (
  template_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,  -- NULL = global
  narrative_kind text NOT NULL CHECK (narrative_kind IN (
    'weekly_summary','launch_outcome','campaign_recap','anomaly_explanation',
    'growth_story','churn_warning','pricing_signal','experiment_recap')),
  name           text NOT NULL,
  scaffold_text  text NOT NULL,  -- Template with {{SLOT_NAME}} placeholders
  slot_schema    jsonb NOT NULL DEFAULT '{}',  -- {slot_name: {type, required, evidence_required}}
  tone           text,
  version        integer NOT NULL DEFAULT 1,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE narrative_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY narrative_templates_read ON narrative_templates
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 7. narratives (migration 137) [VERIFIED: D-13]

```sql
CREATE TABLE narratives (
  narrative_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  period_start         timestamptz NOT NULL,
  period_end           timestamptz NOT NULL,
  narrative_kind       text NOT NULL CHECK (narrative_kind IN (
    'weekly_summary','launch_outcome','campaign_recap','anomaly_explanation',
    'growth_story','churn_warning','pricing_signal','experiment_recap')),
  scaffold_template_id uuid REFERENCES narrative_templates(template_id),
  generated_text       text,
  summary              text,
  supporting_metric_ids uuid[] NOT NULL DEFAULT '{}',
  supporting_evidence_refs uuid[] NOT NULL DEFAULT '{}',
  confidence           text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  recommended_actions  jsonb NOT NULL DEFAULT '[]',
  status               text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','audited','approved','published','archived')),
  approved_by          uuid REFERENCES auth.users(id),
  approved_at          timestamptz,
  audit_findings       jsonb NOT NULL DEFAULT '{}',
  agentrun_id          uuid,  -- FK → markos_agent_runs if generated by AgentRun
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;
CREATE POLICY narratives_tenant ON narratives
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_narratives_kind_status ON narratives(tenant_id, narrative_kind, status);
CREATE INDEX idx_narratives_period ON narratives(tenant_id, period_end DESC);
```

### 8. narrative_claims (migration 137) [VERIFIED: D-15]

```sql
CREATE TABLE narrative_claims (
  claim_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id  uuid NOT NULL REFERENCES narratives(narrative_id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  claim_text    text NOT NULL,
  evidence_ref  uuid,  -- FK → P209 EvidenceMap; nullable until audit
  confidence    text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  freshness_mode text NOT NULL DEFAULT 'daily',
  audited_at    timestamptz,
  audit_status  text NOT NULL DEFAULT 'pending'
                CHECK (audit_status IN ('pending','passed','failed','manual_override')),
  override_by   uuid REFERENCES auth.users(id),
  override_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE narrative_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY narrative_claims_tenant ON narrative_claims
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_narrative_claims_narrative ON narrative_claims(narrative_id);
CREATE INDEX idx_narrative_claims_audit_status ON narrative_claims(tenant_id, audit_status) WHERE audit_status != 'passed';
```

### 9. decision_rules (migration 138) [VERIFIED: D-18]

```sql
CREATE TABLE decision_rules (
  rule_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  name             text NOT NULL,
  trigger_kind     text NOT NULL CHECK (trigger_kind IN (
    'anomaly_detected','threshold_crossed','trend_change','forecast_warning',
    'experiment_winner','pricing_signal','freshness_violation','conversion_drop')),
  trigger_config   jsonb NOT NULL DEFAULT '{}',
  action_kind      text NOT NULL CHECK (action_kind IN (
    'create_task','emit_alert','require_approval','generate_narrative',
    'create_learning_candidate','create_pricing_signal','suppress_send')),
  action_config    jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','archived')),
  version          integer NOT NULL DEFAULT 1,
  owner_user_id    uuid REFERENCES auth.users(id),
  last_fired_at    timestamptz,
  fire_count       integer NOT NULL DEFAULT 0,
  circuit_breaker_until timestamptz,  -- prevents infinite loops
  audit_log_chain  jsonb NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE decision_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY decision_rules_tenant ON decision_rules
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_decision_rules_trigger ON decision_rules(tenant_id, trigger_kind, status);
```

### 10. experiment_winners (migration 138) [VERIFIED: D-22]

```sql
CREATE TABLE experiment_winners (
  winner_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  experiment_id           uuid NOT NULL,  -- FK → P224 conversion_experiments
  variant_id              uuid NOT NULL,  -- FK → P224 experiment_variants
  bayesian_probability    numeric(5,4) NOT NULL,
  frequentist_p_value     numeric(6,5) NOT NULL,
  confidence_threshold_met boolean NOT NULL DEFAULT false,
  sample_size             integer NOT NULL,
  duration_days           integer NOT NULL,
  novelty_effect_window_days integer NOT NULL DEFAULT 3,
  ice_score               numeric(5,2),  -- impact * confidence * ease; 0-100
  winner_detected_at      timestamptz NOT NULL DEFAULT now(),
  approved_by             uuid REFERENCES auth.users(id),
  approved_at             timestamptz,
  status                  text NOT NULL DEFAULT 'detected'
                          CHECK (status IN ('detected','pending_approval','approved','rejected')),
  rejection_reason        text
);

ALTER TABLE experiment_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY experiment_winners_tenant ON experiment_winners
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_experiment_winners_status ON experiment_winners(tenant_id, status);
CREATE INDEX idx_experiment_winners_experiment ON experiment_winners(experiment_id);
```

### 11. experiment_decisions (migration 138) [VERIFIED: D-25 ICE queue]

```sql
CREATE TABLE experiment_decisions (
  decision_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  winner_id       uuid REFERENCES experiment_winners(winner_id) ON DELETE CASCADE,
  experiment_id   uuid NOT NULL,
  decision_kind   text NOT NULL CHECK (decision_kind IN ('promote','reject','extend','archive')),
  actor_user_id   uuid REFERENCES auth.users(id),
  reason          text,
  decided_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE experiment_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY experiment_decisions_tenant ON experiment_decisions
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 12. journey_steps (migration 139) [VERIFIED: D-31]

```sql
CREATE TABLE journey_steps (
  step_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  profile_id           uuid NOT NULL,  -- FK → P221 cdp_identity_profiles; RESTRICT
  account_id           uuid,
  period_start         timestamptz NOT NULL,
  period_end           timestamptz NOT NULL,
  ordered_event_refs   uuid[] NOT NULL DEFAULT '{}',
  funnel_stage         text NOT NULL CHECK (funnel_stage IN (
    'anonymous','known','engaged','mql','sql',
    'opportunity','customer','expansion','advocate','lost')),
  time_in_stage_seconds bigint NOT NULL DEFAULT 0,
  transition_drivers   jsonb NOT NULL DEFAULT '[]',
  -- [{channel: 'email', commercial_signal: 'click', occurred_at: ...}]
  computed_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, profile_id, period_start, funnel_stage)
);

ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY journey_steps_tenant ON journey_steps
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_journey_steps_profile_period ON journey_steps(tenant_id, profile_id, period_start DESC);
CREATE INDEX idx_journey_steps_stage ON journey_steps(tenant_id, funnel_stage, period_end DESC);
```

### 13. aggregated_metrics (migration 140) [VERIFIED: D-28]

```sql
CREATE TABLE aggregated_metrics (
  aggregation_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- No tenant_id: cross-tenant aggregate
  dimension            text NOT NULL CHECK (dimension IN (
    'industry','segment','company_size','region','business_type')),
  dimension_value      text NOT NULL,
  period               text NOT NULL,  -- e.g., '2026-W17'
  metric_id            uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  value                numeric NOT NULL,
  sample_size          integer NOT NULL,
  k_anonymity_threshold integer NOT NULL DEFAULT 5,
  evidence_ref         uuid,  -- P209 EvidenceMap claim_id per D-46
  computed_at          timestamptz NOT NULL DEFAULT now(),
  status               text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived'))
);

-- Cross-tenant read only where k-anonymity is met
ALTER TABLE aggregated_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY aggregated_metrics_read ON aggregated_metrics
  FOR SELECT USING (sample_size >= k_anonymity_threshold AND status = 'published');
-- No write policy for regular sessions: writes only from trusted server cron

CREATE INDEX idx_aggregated_metrics_lookup ON aggregated_metrics(dimension, dimension_value, metric_id, period);
```

### 14. pricing_signals (migration 140) [VERIFIED: D-27]

```sql
CREATE TABLE pricing_signals (
  signal_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  signal_kind      text NOT NULL CHECK (signal_kind IN (
    'price_test_winner','conversion_rate_drop','competitive_threat',
    'activation_lift_observed','churn_pricing_correlation')),
  payload          jsonb NOT NULL,
  -- {evidence_refs: [], confidence: 0.9, recommended_change: "...", narrative_id: "..."}
  emitted_at       timestamptz NOT NULL DEFAULT now(),
  consumed_by_p205 boolean NOT NULL DEFAULT false,
  consumed_at      timestamptz,
  cdp_event_ref    uuid  -- source_event_ref of the cdp_events row emitted
);

ALTER TABLE pricing_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_signals_tenant ON pricing_signals
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_pricing_signals_kind ON pricing_signals(tenant_id, signal_kind, emitted_at DESC);
```

### 15. freshness_audit (migration 139) [VERIFIED: D-34]

```sql
CREATE TABLE freshness_audit (
  audit_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  metric_id        uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  freshness_mode   text NOT NULL,
  last_computed_at timestamptz,
  expected_by      timestamptz NOT NULL,
  violation_at     timestamptz NOT NULL DEFAULT now(),
  violation_delta_seconds bigint NOT NULL,
  decision_rule_fired boolean NOT NULL DEFAULT false,
  task_id          uuid  -- FK to tasks if create_task action fired
);

ALTER TABLE freshness_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY freshness_audit_tenant ON freshness_audit
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_freshness_audit_metric ON freshness_audit(tenant_id, metric_id, violation_at DESC);
```

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/analytics/
├── catalog/
│   ├── metric-definition.ts    # CRUD + resolution (tenant override wins)
│   ├── metric-override.ts      # per-tenant override CRUD
│   ├── formula-evaluator.ts    # formula_dsl typed AST evaluator
│   ├── seeds/
│   │   ├── universal-metrics.ts  # 27 seeded global metrics
│   │   └── attribution-models.ts # 6 seeded global models
│   └── recompute.ts            # per-metric recompute dispatcher
├── attribution/
│   ├── models/
│   │   ├── first-touch.ts
│   │   ├── last-touch.ts
│   │   ├── linear.ts
│   │   ├── position-based.ts
│   │   ├── time-decay.ts
│   │   └── data-driven.ts      # stub in v1; ml_model_ref null
│   ├── engine.ts               # compute attribution_touches per model
│   ├── adapter-legacy.ts       # wraps lib/markos/crm/attribution.ts FAMILY_WEIGHTS as first_touch adapter
│   └── recompute.ts            # AgentRun-wrapped recompute job
├── anomaly/
│   ├── detector.ts             # sigma calculation + seasonality adjustment
│   ├── state-machine.ts        # detected→acknowledged→investigating→resolved|dismissed
│   ├── severity.ts             # severity scoring function
│   ├── suppressor.ts           # auto-suppress duplicate within window
│   └── thundering-herd.ts      # jitter for cron-boundary recompute storms
├── narrative/
│   ├── generator.ts            # Vercel AI Gateway + scaffold template + slot fill
│   ├── claim-auditor.ts        # P209 EvidenceMap bind + freshness check
│   ├── pricing-guard.ts        # {{MARKOS_PRICING_ENGINE_PENDING}} enforcement
│   └── publisher.ts            # status transitions + approval package
├── decision/
│   ├── engine.ts               # rule evaluator dispatcher + circuit breaker
│   └── evaluators/
│       ├── anomaly-detected.ts
│       ├── threshold-crossed.ts
│       ├── trend-change.ts
│       ├── experiment-winner.ts
│       ├── pricing-signal.ts
│       ├── freshness-violation.ts
│       └── conversion-drop.ts
├── experiments/
│   ├── bayesian.ts             # Beta-Binomial posterior
│   ├── frequentist.ts          # two-sided z-test
│   ├── winner-detector.ts      # both-must-agree gate + guardrails
│   └── ice-scorer.ts           # ICE backlog scoring
├── journey/
│   ├── materializer.ts         # journey_steps recompute
│   ├── stage-mapper.ts         # cdp_events → funnel_stage transitions
│   └── recompute.ts            # AgentRun-wrapped; cadence per lifecycle_state
├── benchmark/
│   ├── aggregator.ts           # trusted-server cross-tenant compute
│   └── k-anonymity.ts          # enforcement
├── pricing-signal/
│   ├── emitter.ts              # cdp_events emission + pricing_signals audit row
│   └── debouncer.ts            # per kind+tenant deduplication
├── freshness/
│   ├── checker.ts              # SLA violation detection
│   └── cron.ts                 # freshness_audit cron handler
└── render/
    └── stale-indicator.tsx     # operator-visible freshness warning component
```

### Pattern 1: formula_dsl Typed AST (Claude's Discretion → recommend json-logic-js)

**What:** Metric formulas stored as JSON Logic ASTs. Evaluated server-side by `formula-evaluator.ts` against a scoped event context. Never executes raw SQL fragments.

**Why:** Tenant-safety: operators can edit formula_dsl via MetricCatalogEditor; if SQL fragments were allowed, an operator-edited formula could inject SQL. json-logic-js is sandboxed, already in the project (P221 audience DSL), and expressive enough for the required arithmetic + aggregation operations.

**Example formula_dsl for `win_rate`:**

```json
{
  "type": "ratio",
  "numerator": {"type": "count", "event_family": "opportunity_won"},
  "denominator": {"type": "count", "event_family": "opportunity_created"},
  "grain": "tenant",
  "lookback_days": 90
}
```

**Example formula_dsl for `time_decay_cac`:**

```json
{
  "type": "sum_weighted",
  "base": {"type": "sum", "event_family": "marketing_spend"},
  "weight": {"type": "decay", "half_life_days": 7},
  "denominator": {"type": "count", "event_family": "customer_acquired"},
  "lookback_days": 90
}
```

### Pattern 2: Beta-Binomial Bayesian Posterior (in-house)

**What:** For binary conversion experiments, maintain Beta(alpha, beta) posterior per variant. After each observation batch, update: alpha += conversions; beta += non-conversions. Probability(A > B) = integral of Beta_A > Beta_B (computed via numerical integration or closed-form approximation).

**Implementation target:** `lib/markos/analytics/experiments/bayesian.ts`

```typescript
// Source: standard Bayesian statistics; verified against academic references [ASSUMED]
interface BetaParams { alpha: number; beta: number; }

function updatePosterior(prior: BetaParams, conversions: number, trials: number): BetaParams {
  return { alpha: prior.alpha + conversions, beta: prior.beta + (trials - conversions) };
}

function bayesianProbabilityAWinsB(a: BetaParams, b: BetaParams, samples = 10000): number {
  // Monte Carlo sampling: P(A > B)
  // Or closed-form: sum_{i=0}^{b.alpha-1} B(a.alpha+i, a.beta+b.beta) / ((b.beta+i) * B(1+i, b.beta) * B(a.alpha, a.beta))
}
```

Default priors: Beta(1,1) — uniform uninformative. For tenants with historical data, Beta(5,45) (assuming 10% baseline conversion rate) provides faster convergence.

**Confidence level:** [ASSUMED] for standard formula; [VERIFIED: D-23] for threshold (0.95).

### Pattern 3: Cron + AgentRun Recompute (matches P221–P224 pattern)

**What:** Each cadence has its own Vercel Cron handler. Long-running recomputes wrapped in AgentRun (P207). Bridge stub if P207 absent.

**Cron schedule:**

```text
real_time metrics:    Supabase Realtime tail on cdp_events (event_domain filter)
                      OR poll every 60s via cron if Realtime unavailable (fallback A20)
hourly metrics:       0 * * * *
daily metrics:        0 3 * * *   (03:00 UTC)
weekly metrics:       0 3 * * 0   (Sunday 03:00 UTC)
anomaly detection:    runs per metric per cadence (same handlers)
journey hourly:       5 * * * *   (offset 5 min after metric cron to use fresh data)
journey daily:        30 3 * * *
journey historical:   0 4 * * 0   (Sunday 04:00 UTC)
cross-tenant agg:     0 4 * * 0   (Sunday 04:00 UTC; after weekly metrics at 03:00)
freshness audit:      15 * * * *  (every hour at :15)
tombstone scrub:      0 2 * * *   (nightly 02:00 UTC)
pricing signal debounce: per-event; debounce window 1h per signal_kind+tenant_id
narrative trigger:    on-demand from decision_rules; or API/MCP explicit request
```

**Jitter for thundering herd:** Each tenant's metric recompute adds `hash(tenant_id) % 300` seconds jitter to prevent all tenants hitting the DB simultaneously at the hour boundary. Same pattern as P221 trait recompute.

### Pattern 4: Tombstone Propagation (D-45, P221 D-24 → P222 D-32 → P225)

**What:** When P221 tombstones a profile (PII scrubbed), P225 must scrub attribution_touches and journey_steps rows for that profile_id.

**Implementation:**

```typescript
// lib/markos/analytics/tombstone.ts
async function propagateTombstone(profileId: uuid, tenantId: uuid, evidenceRef: uuid) {
  await db.transaction(async (tx) => {
    // scrub attribution_touches: null out profile_id, anonymize source_event_ref
    await tx.attribution_touches.scrubProfile(profileId, tenantId);
    // scrub journey_steps: null out profile_id, clear ordered_event_refs
    await tx.journey_steps.scrubProfile(profileId, tenantId);
    // aggregated_metrics: future computations exclude this profile_id naturally
    // markos_audit_log: write tombstone propagation evidence
    await tx.audit_log.append({ domain: 'analytics', action: 'tombstone_propagate',
      profile_id: profileId, evidence_ref: evidenceRef });
  });
}
```

Nightly cron sweeps for profile tombstones that haven't been propagated yet (eventual consistency window max 24h).

### Anti-Patterns to Avoid

- **SQL fragment in formula_dsl:** Tenant-edited formulas executing arbitrary SQL via `eval()` or raw Postgres query. Use the json-logic-js evaluator exclusively.
- **Single-model attribution_touches:** Storing only the "current" model's touches. Must store ALL active models simultaneously (model_id discriminator per D-08).
- **Peeking without Bayesian:** Running frequentist-only tests and checking mid-flight inflates false-positive rate. Bayesian posterior supports peeking by design; frequentist is guardrail only.
- **LLM narrative without claim audit:** Generating narrative text without binding every numeric/factual claim to an EvidenceMap row. Blocks D-15; must audit before status transitions to 'audited'.
- **Cross-tenant raw data in aggregated_metrics:** Any join that exposes individual tenant rows via aggregated_metrics. Aggregate runs in trusted server context only; RLS on metric tables remains tenant-scoped.
- **Decision rule infinite loop:** action_kind=generate_narrative triggers metric_change → triggers anomaly_detected → triggers generate_narrative again. Circuit breaker in `decision_rules.circuit_breaker_until` prevents re-firing within 1h window.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Metric formula evaluation | Custom expression parser + SQL injection vector | json-logic-js (already in project, P221 DSL) | Tenant-safety; sandboxed; expressive; no new dep |
| LLM narrative generation | Direct Anthropic API calls | Vercel AI Gateway | Provider fallback + ZDR + cost visibility per D-45 |
| Bayesian experiment stats | External stats library | In-house Beta-Binomial (20 LOC) | Simple enough; no dependency; auditable; Beta-Binomial sufficient for binary conversion |
| Frequentist z-test | External stats library | In-house two-sided z-test (10 LOC) | Standard formula; no edge cases at this complexity level |
| Cron scheduling | Custom timer infrastructure | Vercel Cron (already in project, P221–P224) | Same pattern as 4 prior phases |
| AgentRun wrapping | Custom job queue | AgentRun (P207) + bridge stub | Matches established pattern; observability included |
| Audit hash chain | Custom audit logger | markos_audit_log (P201 hash chain) | Already exists; tamper-evident; all prior phases use it |
| Approval workflow | Custom approval gates | P208 Approval Inbox + P105 approval-package | Already exists; all prior phases use it |
| K-anonymity enforcement | Custom DB trigger | RLS policy `WHERE sample_size >= k_anonymity_threshold` | Postgres-native; enforced at query time |

---

## Recompute Cadence + Cron Strategy

### Per freshness_mode Handlers

| freshness_mode | Trigger | Handler | Notes |
|----------------|---------|---------|-------|
| real_time | Supabase Realtime cdp_events subscription OR 60s poll (fallback) | `lib/markos/analytics/catalog/recompute.ts#handleRealTime` | Realtime preferred; 60s poll fallback per A20 |
| hourly | Vercel Cron `0 * * * *` | `api/analytics/cron/hourly.ts` | +jitter per tenant hash |
| daily | Vercel Cron `0 3 * * *` | `api/analytics/cron/daily.ts` | 03:00 UTC |
| weekly | Vercel Cron `0 3 * * 0` | `api/analytics/cron/weekly.ts` | Sunday 03:00 UTC |

### Anomaly Detection Cadence

Anomaly detection runs immediately after metric recompute for the same cadence — same cron handler, second phase. Uses `metric_definitions.anomaly_config` thresholds from the specific metric.

### Journey Recompute

| Profile lifecycle state | Cadence | Handler |
|-------------------------|---------|---------|
| engaged / mql / sql / opportunity | Hourly `5 * * * *` | journey-hourly.ts |
| anonymous / known / customer / lost | Daily `30 3 * * *` | journey-daily.ts |
| Historical sweep | Weekly Sunday `0 4 * * 0` | journey-weekly.ts |

### Cross-Tenant Aggregation

Weekly Sunday 04:00 UTC (after weekly metrics at 03:00 UTC ensures fresh data). Runs in trusted server context only — no client JWT; uses service role key. EvidenceMap claim_id attached to every aggregated_metrics row.

### Decision Rule Firing

Decision rules evaluated after each metric recompute + anomaly detection pass. Circuit breaker prevents re-firing the same rule for the same metric within 1h. Writes to markos_audit_log on every fire.

### Pricing Signal Debounce

Per `(signal_kind, tenant_id)` pair: minimum 1h between successive emissions of the same signal kind for the same tenant. Only emit when confidence >= 0.8 AND delta from last signal > 10% of baseline.

---

## Integration Contracts

### formula_dsl Evaluator Contract

```typescript
// lib/markos/analytics/catalog/formula-evaluator.ts
interface FormulaContext {
  tenant_id: string;
  lookback_days: number;
  grain: 'person' | 'account' | 'campaign' | 'content' | 'channel' | 'tenant';
  events: CdpEvent[];  // pre-fetched, tenant-scoped
  dimension_filter?: Record<string, string>;
}

interface FormulaResult {
  value: number;
  sample_size: number;
  computed_at: string;
  evidence_refs: string[];  // cdp_events UUIDs backing the computation
}

function evaluateFormula(formulaDsl: JsonLogicAST, ctx: FormulaContext): FormulaResult;
```

The evaluator receives pre-fetched events (never a DB connection). This ensures the formula cannot escape tenant scope even if the AST is operator-modified.

### Vercel AI Gateway — Narrative Generation

```typescript
// lib/markos/analytics/narrative/generator.ts
// Source: Vercel AI SDK + Gateway (per Vercel knowledge update) [VERIFIED: D-45 discretion]
import { generateText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({ /* Vercel AI Gateway config */ });

async function generateNarrativeText(
  template: NarrativeTemplate,
  slots: Record<string, { value: string; evidenceRef: string }>,
  kind: NarrativeKind,
): Promise<{ text: string; claimsMap: ClaimBinding[] }> {
  const model = kind === 'growth_story' ? 'claude-opus-4-7' : 'claude-sonnet-4-6';
  const result = await generateText({
    model: gateway(model),
    system: buildNarrativeSystemPrompt(template, kind),
    prompt: buildSlotFilledPrompt(template.scaffold_text, slots),
  });
  // Extract numeric/factual spans → claimsMap with evidence bindings
  return extractClaimsFromText(result.text, slots);
}
```

Default model: `claude-sonnet-4-6` (cost/quality balance). High-confidence audit narratives (growth_story): `claude-opus-4-7`.

Provider fallback configured at gateway level (not in application code) per D-45.

### EvidenceMap Binding (P209)

```typescript
// lib/markos/analytics/narrative/claim-auditor.ts
async function auditClaims(narrativeId: string, claims: NarrativeClaim[]): Promise<AuditResult> {
  for (const claim of claims) {
    if (!claim.evidence_ref) {
      return { status: 'failed', reason: 'Missing evidence_ref for claim: ' + claim.claim_text };
    }
    const evidence = await evidenceMap.getClaim(claim.evidence_ref);
    if (evidence.freshness_expired) {
      return { status: 'failed', reason: 'Stale evidence for claim: ' + claim.claim_text };
    }
    if (evidence.source_quality_score < 0.5) {
      return { status: 'failed', reason: 'Low quality evidence for claim: ' + claim.claim_text };
    }
  }
  return { status: 'passed' };
}
```

If P209 EvidenceMap is absent, narratives stub to `status: 'draft'` only — cannot transition to 'audited' (Assumption A21).

### cdp_events Emission for Pricing Signals

```typescript
// lib/markos/analytics/pricing-signal/emitter.ts
async function emitPricingSignal(payload: PricingSignalPayload, tenantId: string) {
  await db.transaction(async (tx) => {
    // 1. Insert pricing_signals audit row
    const signal = await tx.pricing_signals.insert({ ...payload, tenant_id: tenantId });
    // 2. Emit cdp_events row (extends P221 D-08 envelope)
    await tx.cdp_events.insert({
      event_name: 'analytics.pricing_signal',
      event_domain: 'analytics',  // NEW domain value per D-26
      tenant_id: tenantId,
      properties: { signal_id: signal.signal_id, ...payload },
      source_event_ref: signal.signal_id,
    });
    // 3. Update pricing_signals.cdp_event_ref
    await tx.pricing_signals.update(signal.signal_id, { cdp_event_ref: signal.signal_id });
  });
}
```

### Legacy Attribution Adapter

```typescript
// lib/markos/analytics/attribution/adapter-legacy.ts
// Wraps existing lib/markos/crm/attribution.ts as first_touch model
import { buildWeightedAttributionModel } from '../../crm/attribution.ts';

export function legacyFirstTouchToAttributionTouches(
  legacyResult: ReturnType<typeof buildWeightedAttributionModel>,
  opportunityId: string,
  modelId: string,
): AttributionTouch[] {
  // Maps FAMILY_WEIGHTS contributions → attribution_touches rows with touch_type='first'
  // for legacy-compatible attribution_touches materialization
}
```

---

## Common Pitfalls

### Pitfall 1: formula_dsl SQL Injection via Operator-Edited DSL
**What goes wrong:** Operator edits formula_dsl JSONB in MetricCatalogEditor; if the evaluator interprets string fields as SQL, tenant can execute arbitrary queries.
**Why it happens:** Developers reuse Postgres query builder inside formula evaluation.
**How to avoid:** formula-evaluator.ts receives pre-fetched event arrays. Never passes formula_dsl to DB driver. json-logic-js evaluates in-process only.
**Warning signs:** Any code path that passes formula_dsl fields to `db.query()` or Supabase `.rpc()`.

### Pitfall 2: Bayesian Peeking Misunderstanding
**What goes wrong:** Developer reads Bayesian posterior as "early winner" before min_sample_size reached; variant promoted too soon; novelty effect inflates conversion rate in first 3 days.
**Why it happens:** Bayesian supports peeking conceptually but D-24 guardrails must be enforced in code.
**How to avoid:** `winner-detector.ts` checks ALL of: (1) bayesian_probability >= 0.95, (2) frequentist p-value <= 0.05, (3) sample_size >= min_sample_size, (4) duration_days >= min_duration_days, (5) current_time > started_at + novelty_effect_window_days.
**Warning signs:** winner_detected_at less than started_at + 3 days.

### Pitfall 3: LLM Narrative Hallucination
**What goes wrong:** LLM generates narrative text with plausible-sounding but factually wrong numbers (e.g., "revenue increased 47%") with no evidence binding.
**Why it happens:** LLM fills scaffold slots with invented values when real values aren't provided.
**How to avoid:** Template slots that require numeric values MUST be pre-computed by formula evaluator and passed as grounded slot values before LLM call. LLM only writes prose around pre-computed numbers.
**Warning signs:** narrative_claims rows with audit_status='failed' or evidence_ref IS NULL.

### Pitfall 4: Cross-Tenant k-Anonymity Bypass via Small Dimensions
**What goes wrong:** Dimension value has only 3 tenants; k_anonymity_threshold=5 should block but the RLS policy has a bug in the WHERE clause comparison.
**Why it happens:** Integer comparison with NULL or type mismatch in RLS policy.
**How to avoid:** RLS policy explicitly: `WHERE sample_size >= k_anonymity_threshold AND k_anonymity_threshold >= 5`. Test with fixtures having sample_size=4 (should be invisible), sample_size=5 (visible).
**Warning signs:** aggregated_metrics readable with sample_size < 5 in tenant A session.

### Pitfall 5: Attribution Lookback vs cdp_events Partition Boundary
**What goes wrong:** Attribution lookback_days=90 but cdp_events partition from P221 only holds 90 days per partition. Query crosses partition boundary; performance degrades or data missing at edges.
**Why it happens:** P221 uses monthly partitions on cdp_events. A 90-day lookback from month 3 needs to read months 1, 2, and 3.
**How to avoid:** Attribution engine queries cdp_events with explicit `occurred_at >= now() - lookback_days::interval` (Postgres partition pruning works correctly with timestamptz range). Add explicit `opportunity_id` + `profile_id` filters first to minimize rows crossed.
**Warning signs:** Attribution queries taking >2s for large tenants; EXPLAIN ANALYZE shows sequential scan.

### Pitfall 6: journey_steps funnel_stage Drift from P222 lifecycle_stage
**What goes wrong:** P222 D-11 lifecycle_stage enum adds a new value (e.g., 'at_risk'); journey_steps CHECK constraint doesn't include it → insert fails silently.
**Why it happens:** D-31 specifies the funnel_stage enum must match P222 D-11 exactly, but they're maintained in separate tables.
**How to avoid:** journey_steps CHECK constraint must list all 10 values from P222 D-11: `{anonymous, known, engaged, mql, sql, opportunity, customer, expansion, advocate, lost}`. Cross-reference test: `test/analytics/journey/funnel-stage-parity.test.ts` verifies both enums match.
**Warning signs:** Failed inserts to journey_steps with error "violates check constraint".

### Pitfall 7: Decision Rule Infinite Loop
**What goes wrong:** Rule A fires action_kind=generate_narrative → narrative generation triggers metric_change event → metric_change triggers anomaly_detected → anomaly_detected fires Rule A again → infinite recursion.
**Why it happens:** Decision rule evaluation doesn't track its own firing depth.
**How to avoid:** `circuit_breaker_until` timestamp in decision_rules. When rule fires: set `circuit_breaker_until = now() + 1 hour`. Evaluator skips rules where `circuit_breaker_until > now()`. Also: action_kind=generate_narrative does NOT emit metric_change events; narrative generation is an async write-only operation.
**Warning signs:** `fire_count` incrementing faster than once per cadence; duplicate narratives for same period.

### Pitfall 8: Tombstoned Profile Attribution Mid-Recompute
**What goes wrong:** Attribution recompute for opportunity_id X starts; mid-compute, profile_id Y is tombstoned; some touches are written with profile_id Y, some without.
**Why it happens:** Non-transactional recompute with profile tombstone happening concurrently.
**How to avoid:** Attribution recompute runs in a single DB transaction. Pre-check tombstone status of all profile_ids before writing any attribution_touches rows. If any profile is tombstoned during the transaction, the transaction rolls back and the recompute is re-queued.
**Warning signs:** attribution_touches rows with NULL profile_id where profile was valid at recompute start.

### Pitfall 9: Pricing Signal Spam
**What goes wrong:** Every hourly metric recompute emits a `conversion_rate_drop` pricing signal; P205 receives hundreds of low-quality signals per day.
**Why it happens:** decision_rule fires `create_pricing_signal` action on every threshold crossing without debounce.
**How to avoid:** `pricing-signal/debouncer.ts` enforces per `(signal_kind, tenant_id)` minimum interval (1h) AND delta threshold (>10% from last signal value). Write `pricing_signals.emitted_at` and check before emitting.
**Warning signs:** pricing_signals rows with same signal_kind+tenant_id more than once per hour.

### Pitfall 10: Freshness Violation Cascade
**What goes wrong:** Metric A is daily; Metric B formula_dsl depends on Metric A as input; Metric A becomes stale → Metric B freshness also violated → narrative referencing Metric B fails claim audit → Narrative stuck in 'draft'.
**Why it happens:** Freshness propagation not tracked through formula_dsl dependency graph.
**How to avoid:** In freshness_checker.ts: when checking freshness, resolve the `source_event_families[]` + formula_dsl dependency chain and mark derived metrics stale if any upstream is stale. StaleIndicator.tsx shows cascaded freshness warning.
**Warning signs:** Narratives stuck in 'draft' with audit_findings showing "upstream metric stale".

---

## Slice Boundaries

### Wave 1 — Foundation

#### 225-01: Schema Foundation + Seeds + Base Contracts
- Deliverables: Wave 0 verify (F-ID + migration range guard), migrations 134–138 (15 tables), 27 universal metric seeds, 6 attribution model seeds, 7 default decision_rule seeds, F-147..F-156 YAML contracts, flow-registry.json update, test fixtures `test/fixtures/analytics/`
- Requirements: ANL-01, ANL-02, ANL-05, QA-01, QA-02
- Dependencies: P221 migration 101 confirmed, P224 migration 133 confirmed

### Wave 2 — Compute Infrastructure

#### 225-02: Metric Catalog Runtime + Freshness Audit
- Deliverables: migration 139 (journey_steps + freshness_audit), formula_dsl evaluator (json-logic-js backed), per-metric freshness cron handlers (hourly/daily/weekly), StaleIndicator component, freshness_audit log, AgentRun bridge stub, decision_rule freshness_violation evaluator
- Requirements: ANL-01, ANL-02, ANL-05, D-01..D-04, D-33, D-34
- Dependencies: 225-01

#### 225-03: Attribution Engine + 6 Standard Models + Legacy Adapter
- Deliverables: migration 142 (attribution indexes), all 6 model implementations, legacy first_touch adapter wrapping crm/attribution.ts, attribution_touches multi-model materialization, F-157 contract, AgentRun recompute job
- Requirements: ANL-04, D-05..D-08, EVD-01
- Dependencies: 225-01 (parallel with 225-02)

### Wave 3 — Intelligence Layers

#### 225-04: Anomaly Detection + Decision Rules Engine
- Deliverables: migration 143 (anomaly indexes), anomaly detector (sigma + seasonality), anomaly state machine, severity scoring, auto-suppress, thundering-herd jitter, decision rules pluggable evaluators (all 7 trigger_kinds), circuit breaker, default rule seeding, F-158 contract
- Requirements: ANL-03, D-09..D-12, D-18..D-21, LOOP-08
- Dependencies: 225-01, 225-02

#### 225-05: Narrative Generation + Claim Audit + Journey Recompute
- Deliverables: Vercel AI Gateway integration, narrative_templates global seeds (8 kinds), LLM-backed narrative generator, EvidenceMap claim auditor, pricing-guard ({{MARKOS_PRICING_ENGINE_PENDING}}), narrative publisher, journey_steps materializer, stage-mapper, F-159 + F-160 contracts
- Requirements: ANL-03, ANL-05, LOOP-07, EVD-01..EVD-06, D-13..D-17, D-31..D-32
- Dependencies: 225-01, 225-02 (parallel with 225-04)

### Wave 4 — Experiments + Pricing + Aggregation

#### 225-06: Experiment Winner Detection + Pricing Signal Emission + Cross-Tenant Aggregation
- Deliverables: migration 140 (aggregated_metrics + pricing_signals), Bayesian Beta-Binomial posterior, frequentist z-test, winner-detector (both-must-agree + guardrails), ICE scorer, pricing signal emitter + debouncer, cross-tenant aggregator (k-anonymity), F-161 + F-162 contracts
- Requirements: ANL-03, D-22..D-30, LOOP-08
- Dependencies: 225-01..225-05

### Wave 5 — API + UI + Observability Closeout

#### 225-07: API + MCP Tools + UI Workspaces + Playwright + Chromatic + Closeout
- Deliverables: migrations 144–145 (RLS hardening + OpenAPI regen), full `/v1/analytics/*` route handlers, 7 MCP tools, 6 UI workspaces (AnalyticsWorkspace, AttributionExplorer, AnomalyInbox, NarrativeFeed, ExperimentsCockpit, DecisionRulesEditor + BenchmarksPanel), Approval Inbox new entry types (D-38), Morning Brief update (D-39), anomaly-of-anomalies spike detection (D-41), Playwright operator journeys, Chromatic stories, 225-SUMMARY.md
- Requirements: ALL (ANL-01..ANL-05, EVD-01..EVD-06, LOOP-07, LOOP-08, QA-01..QA-15)
- Dependencies: 225-01..225-06

---

## Validation Architecture (Nyquist Dimension 8 — MANDATORY)

### Test Framework [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md + P221-01-PLAN.md]

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.x (established P221 Wave 0) |
| Config file | `vitest.config.ts` (exists from P221-01) |
| Quick run command | `vitest run test/analytics/**/*.test.ts` |
| Full suite command | `vitest run` |
| Browser tests | `playwright test tests/e2e/analytics/` |
| Visual regression | Chromatic via Storybook |

### Per-Slice Validation Table

| Slice | Vitest must prove | Playwright must prove | Chromatic must prove |
|-------|------------------|----------------------|---------------------|
| 225-01 | 15 tables exist + RLS tenant isolation (cross-tenant denial); F-ID range guard; migration idempotency; 27 metric seeds present; 6 attribution model seeds; 7 decision_rule seeds | n/a (no UI yet) | n/a |
| 225-02 | formula_dsl evaluator: all formula types + invalid AST rejection; freshness SLA checks (real_time/hourly/daily/weekly violations); stale indicator threshold math; decision_rule freshness_violation evaluator | n/a | StaleIndicator: fresh/warning/stale/critical states |
| 225-03 | 6 attribution models × correctness (first/last/linear/position_based/time_decay outputs); lookback_days boundary; multi-model coexistence (same opp_id, 6 model rows); legacy adapter parity with crm/attribution.ts FAMILY_WEIGHTS | n/a | n/a |
| 225-04 | sigma calculation + severity matrix; state machine transitions (all paths including auto-suppress); thundering-herd jitter applied; 7 decision_rule evaluators (trigger_kind matrix); circuit breaker blocks re-fire within 1h; anomaly-of-anomalies detection | AnomalyInbox: acknowledge → investigating → resolve journey; critical anomaly blocks operator flow until acknowledged | AnomalyInbox kanban columns; severity chips; resolution panel; empty/loading states |
| 225-05 | narrative generation (template + LLM mock); claim count == claim rows (no unclaimed spans); claim audit pass/fail per evidence quality; pricing-guard blocks status='audited' when {{MARKOS_PRICING_ENGINE_PENDING}} unresolved; journey_steps funnel_stage parity with P222 D-11; transition_drivers populated | NarrativeFeed: approve flow; claim audit panel expand; blocked narrative (failed claim) shows reason | NarrativeFeed: draft/audited/approved/published states; claim audit badge; blocked claim warning |
| 225-06 | Bayesian posterior convergence (1000+ samples → probability >= 0.95 for clear winner); frequentist z-test correctness; both-must-agree gate blocks promotion when only one agrees; min_sample_size + min_duration_days guardrails; novelty window exclusion; ICE score arithmetic; pricing signal emit+debounce (no duplicate within 1h); k-anonymity (sample_size=4 invisible, sample_size=5 visible); cross-tenant raw row unreachable in tenant session | ExperimentsCockpit: winner detection → pending_approval → approve → promote flow; k-anonymity blocked benchmark visible | ExperimentsCockpit winner detection state; ICE backlog; pending/approved/rejected winner cards; BenchmarksPanel gated vs available |
| 225-07 | API contract parity with F-147..F-162 (OpenAPI roundtrip); MCP tool contracts correct input/output; RLS 15-table cross-tenant denial suite; tombstone propagation (profile tombstone → attribution_touches + journey_steps scrubbed); legacy P221–P224 tests still green | AnalyticsWorkspace: metric drill-down; AttributionExplorer: model selector + touchpoint timeline; AnomalyInbox → Approval Inbox escalation path; Morning Brief freshness SLA item | All 6 workspaces: empty/loading/healthy/stale/error/forbidden states |

### Coverage Targets

| Domain | Target | Enforcement |
|--------|--------|-------------|
| RLS: 15 analytics tables | 100% cross-tenant denial test | `test/analytics/rls/*.test.ts` |
| Attribution: 6 models × correctness | 6 model × 3 scenario tests minimum | `test/analytics/attribution/models.test.ts` |
| Bayesian convergence | P(A>B) >= 0.95 at 2000+ samples (clear 60% vs 40% conversion) | `test/analytics/experiments/bayesian.test.ts` |
| Claim audit chain | Every narrative has claim count == narrative_claims rows | `test/analytics/narrative/claim-audit.test.ts` |
| k-anonymity threshold | sample_size<5 invisible; sample_size=5 visible | `test/analytics/benchmark/k-anonymity.test.ts` |
| Tombstone propagation | attribution_touches + journey_steps PII scrubbed | `test/analytics/tombstone/propagation.test.ts` |
| Decision rule circuit breaker | Infinite loop scenario completes without recursion | `test/analytics/decision/circuit-breaker.test.ts` |
| formula_dsl safety | SQL fragment in formula rejected; tenant-scoped evaluator | `test/analytics/catalog/formula-evaluator.test.ts` |
| Freshness SLA math | All 4 freshness_mode windows enforce correct violation threshold | `test/analytics/freshness/sla.test.ts` |

### Test Fixtures

All under `test/fixtures/analytics/`:

```text
test/fixtures/analytics/
├── metric-definitions.ts      # 5 global + 2 tenant-specific metric fixtures
├── attribution-models.ts      # 6 standard model fixtures
├── attribution-touches.ts     # multi-model touches for same opportunity
├── anomaly-detections.ts      # one per severity, one per state
├── narratives.ts              # one per narrative_kind; claim_count varies
├── narrative-claims.ts        # passed/failed/pending audit status fixtures
├── decision-rules.ts          # 7 trigger_kinds × 3 action_kinds
├── experiment-winners.ts      # detected/pending/approved/rejected
├── journey-steps.ts           # complete funnel journey for one profile
├── aggregated-metrics.ts      # sample_size=4 (blocked) + sample_size=5 (visible)
├── pricing-signals.ts         # all 5 signal_kinds
└── freshness-audit.ts         # one per freshness_mode in violation
```

### Acceptance Criteria Template (per slice)

A plan is complete when:
1. All migrations run idempotently in CI: `vitest run test/analytics/schema/migrations.test.ts`
2. RLS cross-tenant denial passes: `vitest run test/analytics/rls/`
3. Core business logic tests green: `vitest run test/analytics/{catalog,attribution,anomaly,narrative,decision,experiments,journey}/`
4. Legacy regression still green: `vitest run test/cdp-*/ test/crm-*/ test/channels-*/ test/conversion-*/`
5. Where UI exists: Playwright journeys pass; Chromatic stories published

### Wave 0 Gaps (required before 225-01 execution)

- [ ] `test/fixtures/analytics/` directory + all 12 fixture files (created in 225-01 Wave 0)
- [ ] F-ID range guard test: `jq '.flows[].flow_id' contracts/flow-registry.json` contains no F-147..F-162 (verifies unclaimed before write)
- [ ] Migration range guard: no `134_*` through `145_*` files exist yet in `supabase/migrations/`

---

## Requirement Mapping

| Requirement | Slice | How Met |
|-------------|-------|---------|
| ANL-01 | 225-01, 225-02, 225-03, 225-07 | metric_definitions catalog (D-01); attribution_touches (D-06); drilldown_spec + source_precedence_chain; journey_steps (D-31) |
| ANL-02 | 225-02, 225-07 | freshness_mode + last_computed_at (D-33); StaleIndicator renderer (D-33); freshness_audit (D-34); drilldown_spec on metric (D-01) |
| ANL-03 | 225-04, 225-05, 225-06 | anomaly_detections + state machine (D-09..D-12); narratives + claim audit (D-13..D-17); decision_rules → create_task / emit_alert / require_approval (D-18..D-21) |
| ANL-04 | 225-03 | attribution_touches.channel enum covers all 11 channel types including partner, community, event, product; source from cdp_events + dispatch_events + conversion_events + crm_activity |
| ANL-05 | 225-01, 225-02, 225-03, 225-05 | metric_definitions.version field (D-01); metric_overrides (D-02); attribution_models.version (D-05); MCP tool `generate_narrative` (D-36); narrative_templates (D-14) |
| EVD-01 | 225-05 | narrative_claims.evidence_ref → P209 EvidenceMap; claim auditor checks freshness + source quality |
| EVD-02 | 225-05 | pre-publish claim audit blocks status='audited' when any claim fails; pricing-guard blocks {{MARKOS_PRICING_ENGINE_PENDING}} unresolved narratives |
| EVD-03 | 225-05 | narrative_claims.audit_status tracks source quality tier; audit_findings JSONB on narratives |
| EVD-04 | 225-02 | freshness_mode + last_computed_at prevents redundant recompute; formula evaluator checks evidence freshness before computing |
| EVD-05 | 225-07 | Approval Inbox entry types for narrative_publish + metric_definition_change expose evidence inline (D-38) |
| EVD-06 | 225-06 | pricing_signals.payload.evidence_refs[]; narrative_id link; confidence score |
| LOOP-07 | 225-05 | narrative_kind=weekly_summary → operator brief: what changed, why, what to do (D-17) |
| LOOP-08 | 225-04, 225-06 | decision_rules action_kind=create_task + ICE backlog scoring (D-25); decision_rule fires after each metric recompute |
| QA-01..15 | All slices | per-slice Vitest + Playwright + Chromatic coverage per validation table above |

---

## Scope Guardrails

**OUT OF SCOPE — Do not plan, implement, or reference in tasks:**
- Sales enablement battlecards, proof packs, objection intelligence → P226
- Ecosystem/partner/affiliate/community/developer-growth analytics → P227
- Commercial OS integration closure → P228
- Real-time Kafka/Redpanda event streaming → v2
- Customer-facing analytics dashboards / embedded SDK → deferred
- Predictive ML (LTV prediction, churn beyond risk_score) → v2
- Differential privacy on aggregation → k-anonymity sufficient for v1
- Custom metric DSL visual formula builder → v2
- Data warehouse export (Snowflake, BigQuery, dbt) → deferred
- Real-time dashboards via WebSocket → deferred
- Revenue/pipeline/activation forecasting → v2
- Causal inference / uplift modeling → v2
- `activation_lift` in LaunchOutcome → NULL in v1 (P218 PLG metrics; P225 does NOT implement this)

---

## UI Compatibility Note

P225 evolves the P105 `app/(markos)/crm/reporting/page.tsx` cockpit into an AnalyticsWorkspace and adds 6 new workspaces within the existing P208 single-shell. New components land in:
- `app/(markos)/analytics/page.tsx` — AnalyticsWorkspace
- `app/(markos)/analytics/attribution/page.tsx` — AttributionExplorer
- `app/(markos)/analytics/anomalies/page.tsx` — AnomalyInbox
- `app/(markos)/analytics/narratives/page.tsx` — NarrativeFeed
- `app/(markos)/analytics/experiments/page.tsx` — ExperimentsCockpit
- `app/(markos)/analytics/decision-rules/page.tsx` — DecisionRulesEditor
- `app/(markos)/analytics/benchmarks/page.tsx` — BenchmarksPanel

All components follow P102/P103/P105/P222/P223/P224 CSS module conventions. No UI-SPEC required (matches P222/P223/P224 disposition). `lib/markos/analytics/render/stale-indicator.tsx` is the first shared analytics UI primitive.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P224 stopped at F-146; F-147 is first unclaimed | F-ID Allocation | Collision with P224; planner must verify in Wave 0 guard test |
| A2 | P224 stopped at migration 133; migration 134 is first unclaimed | Migration Allocation | Collision with P224; planner must verify in Wave 0 guard test |
| A3 | P221 CDP adapter (`lib/markos/cdp/adapters/crm-projection.ts`) is available for attribution + journey | Integration Contracts | Attribution + journey cannot read profile data without adapter; add stub if unavailable |
| A4 | P222 Customer360 + nba_records + opportunities are available | Schema Sketches | attribution_touches.opportunity_id FK + journey_steps.profile_id FK resolution requires P222 tables |
| A5 | P207 markos_agent_runs available; bridge stub otherwise | Recompute Cadence | Long-running recompute jobs unobservable without AgentRun; bridge stub provides minimal tracking |
| A8 | Vitest/Playwright inherited from P221 Wave 0 | Validation Architecture | If P221 never completed, need Wave 0 re-install; planner checks vitest.config.ts existence |
| A13 | P205 Pricing Engine optional (analytics emits signals regardless; P205 consumer-driven) | Integration Contracts | pricing_signals table fills up without consumer; no functional impact on P225 |
| A18 | Vercel AI Gateway available for narrative LLM (per Vercel knowledge update — provider fallback + ZDR) | Standard Stack | [VERIFIED: CONTEXT.md Canonical Refs + D-45 discretion: "per knowledge update"]; if unavailable, fallback to direct Anthropic API via existing lib/markos/llm/adapter.ts |
| A19 | Bayesian Beta-Binomial implemented in-house (no external npm package for stats) | Standard Stack | [ASSUMED] — in-house implementation is ~30 LOC; sufficient for binary conversion experiments; if wrong, npm package bayesian can be added |
| A20 | Supabase Realtime available for cdp_events tail subscription (real_time freshness_mode) | Recompute Cadence | [ASSUMED] — Supabase Realtime supports table-level change subscriptions; if unavailable, 60s poll fallback per D-45 discretion note |
| A21 | P209 EvidenceMap is live when P225 ships; if absent, narratives stub to 'draft' status only | Integration Contracts | [ASSUMED] — P209 is a dependency per ROADMAP.md; if not shipped, narrative intelligence degrades to template-only with manual claim override; P225 must handle absent EvidenceMap gracefully |

---

## Open Questions

1. **Supabase Realtime capacity for real_time freshness_mode**
   - What we know: Supabase Realtime supports table change subscriptions; project uses Supabase per migrations
   - What's unclear: Whether the Supabase plan/tier supports enough concurrent subscriptions for real_time metrics at tenant scale
   - Recommendation: Default to 60s poll in v1; add Realtime opt-in as enhancement when tenant count known

2. **P209 EvidenceMap claim TTL binding for narrative_claims**
   - What we know: P209 ships EvidenceMap with claim TTL per EVD-01; P225 narrative_claims.evidence_ref FK points to it
   - What's unclear: Whether the EvidenceMap schema exposes a stable `getClaim(ref)` function or requires P225 to implement its own lookup
   - Recommendation: 225-05 plan task 0 should read P209 CONTEXT.md + plan files to confirm the API surface before implementing claim-auditor.ts

3. **data_driven attribution model in v1**
   - What we know: D-05 lists `data_driven` as one of 6 standard models; `ml_model_ref=null` in v1
   - What's unclear: Whether the `data_driven` row should be seeded as `status='active'` (visible to tenants) or `status='archived'` (seed only, not usable)
   - Recommendation: Seed as `status='archived'` with description "Data-driven attribution (v2 — ML model required)"; prevents operator confusion

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | Validation Architecture | ✓ | ^2.x (P221 Wave 0) | — |
| Playwright | Operator journey tests | ✓ | ^1.x (P221 Wave 0) | — |
| json-logic-js | formula_dsl evaluator | ✓ | existing dep (P221 used it) | — |
| Supabase Realtime | real_time freshness_mode | [A20 ASSUMED] | — | 60s poll fallback |
| Vercel AI Gateway | Narrative LLM generation | ✓ (per knowledge update) | latest | Direct Anthropic API via lib/markos/llm/adapter.ts |
| P207 AgentRun | Long-running recompute wrapping | [A5 ASSUMED available] | — | Bridge stub (same as P221/P222/P223/P224) |
| P209 EvidenceMap | Narrative claim audit | [A21 ASSUMED available] | — | Narratives stub to 'draft' only |
| P221 cdp_events | Attribution + journey source | ✓ (migrations 101-105 planned) | — | — |
| P222 opportunities | attribution_touches FK | ✓ (migrations 106-112 planned) | — | — |
| P224 conversion_experiments | experiment_winners FK | ✓ (migrations 121-133 planned) | — | — |

**Missing dependencies with no fallback:** None — all critical dependencies have confirmed upstream phases.

**Missing dependencies with fallback:** Supabase Realtime (60s poll), P207 AgentRun (bridge stub), P209 EvidenceMap (draft-only narratives).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no — inherits P201 session auth | — |
| V3 Session Management | no — inherits P201 | — |
| V4 Access Control | yes | RLS on 15 tables; fail-closed on missing tenant_id; aggregated_metrics read policy |
| V5 Input Validation | yes | formula_dsl validated via zod + json-logic-js; narrative_claims text sanitized before LLM; API input shapes validated by F-147..F-162 contracts |
| V6 Cryptography | no — no new key material | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| formula_dsl SQL injection | Tampering | json-logic-js sandboxed evaluator; pre-fetched event context; never passes formula to DB driver |
| Cross-tenant aggregated_metrics data leak | Information Disclosure | RLS WHERE sample_size >= k_anonymity_threshold; trusted server context only for writes |
| LLM prompt injection via narrative slot values | Tampering | Slots pre-validated; slot values are computed numbers or audit-approved strings; never raw user input |
| Tombstone bypass (accessing scrubbed profile data via attribution_touches) | Information Disclosure | tombstone propagation scrubs profile_id + source_event_ref within 24h via nightly cron; attribution queries post-tombstone return null profile_id |
| Decision rule privilege escalation (create_pricing_signal action emitting false signals) | Elevation of Privilege | Pricing signal payload validated via zod before emit; signal_kind enum restricted; requires operator approval if decision_rule emits require_approval action |
| Experiment winner manipulation (forging bayesian_probability) | Tampering | experiment_winners written only by trusted analytics compute process (AgentRun); no client-writable path; markos_audit_log records every write |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-model FAMILY_WEIGHTS attribution (crm/attribution.ts) | Multi-model attribution_touches with 6 standard models simultaneously | P225 | Operators compare models; FAMILY_WEIGHTS becomes legacy first_touch adapter |
| Hardcoded CRM reporting metrics (crm/reporting.ts) | DB-resident metric_definitions catalog with formula_dsl + per-tenant overrides | P225 | Metrics versioned, auditable, cross-domain |
| P224 LaunchOutcome narrative_summary (EvidenceMap-aware but no LLM) | Full hybrid template+LLM narratives with claim audit + 8 narrative_kinds | P225 | Narratives are first-class SOR, not page-level strings |
| P224 ConversionExperiment with no winner detection | Bayesian-primary + frequentist-guardrail winner detection + ICE scoring | P225 | Experiment winner decisions are auditable + operator-approved |
| P221 cdp_events as event sink only | cdp_events extended with event_domain='analytics' for pricing_signals | P225 | Pricing Engine gets decoupled signal feed |

---

## Sources

### Primary (HIGH confidence)
- `225-CONTEXT.md` (48 locked decisions D-01..D-48) — primary research source
- `221-01-PLAN.md` through `224-07-PLAN.md` (plan files) — F-ID + migration chain [VERIFIED]
- `lib/markos/crm/attribution.ts` — FAMILY_WEIGHTS legacy model (direct codebase read) [VERIFIED]
- `lib/markos/crm/reporting.ts` — cockpit patterns (direct codebase read) [VERIFIED]
- `obsidian/reference/Database Schema.md` — migration history [VERIFIED]
- `obsidian/reference/Contracts Registry.md` — F-ID baseline [VERIFIED]
- `obsidian/reference/HTTP Layer.md` — API route conventions [VERIFIED]
- `obsidian/reference/Core Lib.md` — module boundary conventions [VERIFIED]
- `.planning/REQUIREMENTS.md` — ANL-01..05, EVD-01..06, LOOP-07/08, QA-01..15 [VERIFIED]
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — test doctrine [VERIFIED]
- `obsidian/brain/Pricing Engine Canon.md` — {{MARKOS_PRICING_ENGINE_PENDING}} rule [VERIFIED]

### Secondary (MEDIUM confidence)
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` (informational; canonical = obsidian/reference/* once distilled) — 7 core rules used for informational context only; not cited as canonical
- Standard Beta-Binomial Bayesian analysis for binary conversion experiments (well-established statistical method; implementation in-house)
- Standard two-sided z-test formula for frequentist proportions comparison

### Tertiary (LOW confidence / ASSUMED)
- Supabase Realtime table subscription availability for real_time freshness_mode (A20)
- In-house Bayesian Beta-Binomial sufficient (no validation of edge cases at scale) (A19)
- P209 EvidenceMap API surface (getClaim function signature) (A21)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against codebase + prior phase plans
- F-ID + migration allocation: HIGH — verified against actual plan files 221-01 through 224-07
- Schema sketches: HIGH — derived from 48 locked decisions in 225-CONTEXT.md
- Architecture patterns: HIGH — consistent with P221–P224 established patterns
- Pitfalls: MEDIUM — derived from locked decisions + established patterns; some assumed from general analytics engineering practice
- Bayesian implementation: MEDIUM — standard statistical technique; in-house implementation sufficient; validated against decision D-23

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30-day window; Vercel AI Gateway and Supabase Realtime are fast-moving; re-verify before 225-05 plan execution)

---

## RESEARCH COMPLETE

Phase 225 ships 15 new tables, 16 contracts (F-147..F-162), 12 migrations (134..145), 27 metric seeds, 6 attribution model seeds, and 7 decision rule seeds across 7 plan slices in 5 waves.

**F-ID baseline confirmed:** P224 stopped at F-146 (verified: 224-07-PLAN.md). P225 allocates F-147..F-162.

**Migration baseline confirmed:** P224 stopped at migration 133 (verified: 224-07-PLAN.md). P225 allocates 134..145.

**Key architectural choices resolved:** formula_dsl uses json-logic-js (tenant-safe, already in project); Bayesian Beta-Binomial in-house (20 LOC, sufficient for binary conversion); Vercel AI Gateway for narrative LLM (provider fallback + ZDR); all recompute wrapped in AgentRun + bridge stub; decision rule circuit breaker prevents infinite loops; tombstone propagation scrubs analytics PII within 24h nightly.

**Critical dependency chain:** P221 cdp_events → P222 opportunities → P223 dispatch_events → P224 conversion_events/experiment_assignments → P225 consumes all four. Verification of prior phase migrations is mandatory Wave 0 gate for 225-01.

**Pricing placeholder rule:** Any pricing-touching narrative field uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until P205 PricingRecommendation exists. P225 never mutates PricingRecommendation — emit-only via cdp_events.
