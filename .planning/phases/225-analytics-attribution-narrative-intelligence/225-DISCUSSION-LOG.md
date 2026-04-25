# Phase 225: Analytics, Attribution, and Narrative Intelligence - Discussion Log

> **Audit trail only.** Decisions in `225-CONTEXT.md`.

**Date:** 2026-04-24
**Phase:** 225-analytics-attribution-narrative-intelligence
**Mode:** discuss (--chain)

---

## Metric catalog architecture

| Option | Selected |
|--------|----------|
| DB-resident metric_definitions + admin UI + per-tenant overrides + version history | ✓ |
| YAML config-as-code + code-gen | |
| Hybrid (global YAML + tenant DB overrides) | |

**User's choice:** DB-resident with overrides (Recommended).

---

## Attribution model storage

| Option | Selected |
|--------|----------|
| Materialize attribution_touches per Opp per model_version | ✓ |
| Compute-on-read from cdp_events | |
| Hybrid (materialize active, on-read historical) | |

**User's choice:** Materialize (Recommended).

---

## Narrative generation

| Option | Selected |
|--------|----------|
| Hybrid template scaffold + LLM-filled clauses + P209 EvidenceMap claim audit | ✓ |
| Pure LLM + post-gen audit | |
| Pure template-driven (no LLM) | |

**User's choice:** Hybrid (Recommended).

---

## Anomaly detection model

| Option | Selected |
|--------|----------|
| First-class anomaly_detections + state machine + threshold/sensitivity per metric | ✓ |
| Computed-on-read (no SOR) | |
| Anomaly events emitted to cdp_events (event ledger as SOR) | |

**User's choice:** First-class SOR (Recommended).

---

## Decision routing

| Option | Selected |
|--------|----------|
| decision_rules table + pluggable evaluator pattern | ✓ |
| Hardcoded thresholds in cron jobs | |
| Pure event-driven (subscribers handle) | |

**User's choice:** decision_rules + pluggable (Recommended).

---

## Experiment winner detection

| Option | Selected |
|--------|----------|
| Hybrid Bayesian primary + frequentist guardrail + ICE backlog + statistical guardrails | ✓ |
| Frequentist only | |
| Bayesian only | |

**User's choice:** Hybrid (Recommended). 95% confidence both methods. min_sample_size=1000/variant, min_duration_days=7, novelty_window=3 days.

---

## Pricing Engine feedback loop

| Option | Selected |
|--------|----------|
| Analytics emits pricing_signals via cdp_events; P205 consumes + decides | ✓ |
| Analytics directly creates PricingRecommendation rows | |
| PriceTest result-only writeback (passive) | |

**User's choice:** Decoupled signal emission (Recommended).

---

## Cross-tenant anonymized learning

| Option | Selected |
|--------|----------|
| Aggregate-only with k-anonymity (k≥5) | ✓ |
| Differential privacy (noise injection) | |
| Defer to P228 closure | |

**User's choice:** k-anonymity aggregate-only (Recommended). Tenant opt-in flag default false.

---

## Journey analytics storage

| Option | Selected |
|--------|----------|
| Materialized journey_steps + recompute cadence | ✓ |
| Compute-on-read | |
| Hybrid | |

**User's choice:** Materialized (Recommended).

---

## Freshness contract per metric

| Option | Selected |
|--------|----------|
| Per-metric freshness_mode + stale_indicator + freshness_audit cron | ✓ |
| Single global recompute cadence | |
| On-demand only | |

**User's choice:** Per-metric (Recommended).

---

## API + MCP + UI surface

| Option | Selected |
|--------|----------|
| Read-write v1 /v1/analytics/* + 7 MCP tools + AnalyticsWorkspace + AttributionExplorer + AnomalyInbox + NarrativeFeed + ExperimentsCockpit | ✓ |
| Read-only v1; mutations library-only | |
| Minimal MCP (3 tools) | |

**User's choice:** Full surface (Recommended).

---

## Claude's Discretion

- Module boundary `lib/markos/analytics/*`.
- Bayesian posterior implementation (Beta-Binomial sufficient v1).
- Time-decay half_life_days default (7 days).
- LLM via Vercel AI Gateway with provider fallback (claude-sonnet-4-6 default).
- formula_dsl typing (typed AST vs JSONLogic vs SQL fragment).
- Cron schedules per recompute family.
- xxhash3 vs SHA-256 for journey_steps.

## Deferred Ideas

- Real-time event streaming (Kafka) → defer.
- Customer-facing dashboards / embedded SDK → defer.
- Predictive ML (LTV/churn ML/MMM) → v2.
- Differential privacy → defer beyond k-anonymity.
- Custom metric DSL visual editor → v2.
- Data warehouse export → defer.
- Cohort retention curves beyond SaaS standard → v2.
- Real-time WebSocket dashboards → defer.
- Forecasting (revenue, pipeline) → v2.
- Causal inference / uplift modeling → v2.
- Sales enablement → P226.
- Ecosystem analytics → P227.
- Integration closure → P228.
