---
phase: 225
slug: analytics-attribution-narrative-intelligence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 225 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `225-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Vitest (Phase 204+ doctrine) |
| **Framework (legacy regression)** | Node.js `--test` (`npm test`) |
| **E2E framework** | Playwright |
| **Visual regression** | Chromatic via Storybook |
| **LLM testing** | Vercel AI Gateway with mock provider for narrative tests |
| **Vitest config** | inherited from P221-P224 Wave 0 |
| **Playwright config** | inherited from P221-P224 Wave 0 |
| **Quick run command** | `vitest run test/analytics/` |
| **Full suite command** | `vitest run && npm test && npx playwright test --grep analytics` |
| **Estimated runtime** | ~150s quick, ~13 min full |

---

## Sampling Rate

- **After every task commit:** `vitest run test/analytics/<slice-domain>`
- **After every plan wave:** `vitest run test/analytics/ && npm test`
- **Before `/gsd:verify-work`:** Full suite (Vitest + node --test + Playwright + Chromatic) green
- **Max feedback latency:** 150s (quick), 13 min (full)

---

## Per-Task Verification Map

> Planner populates per task. Template below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 225-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative/e2e | `vitest run test/analytics/<file>.test.ts` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 225-NN wave starts (likely inherited from P221-P224 Wave 0):

- [ ] `vitest.config.ts` — confirm exists; else install
- [ ] `playwright.config.ts` — confirm exists; else install
- [ ] `test/fixtures/analytics/` — analytics fixture factory directory
- [ ] `test/fixtures/analytics/metric-definition.ts` — global + tenant-override; per category × per grain combinations; freshness_mode variants
- [ ] `test/fixtures/analytics/attribution-touch.ts` — per-model × per-channel × first/assist/last/influential variants
- [ ] `test/fixtures/analytics/anomaly.ts` — severity matrix × state machine variants × suppressed variants
- [ ] `test/fixtures/analytics/narrative.ts` — 8 narrative_kinds × draft/audited/approved/published states
- [ ] `test/fixtures/analytics/decision-rule.ts` — trigger_kind × action_kind matrix
- [ ] `test/fixtures/analytics/experiment-winner.ts` — Bayesian-only / frequentist-only / both-agree / neither-agree variants
- [ ] `test/fixtures/analytics/journey-step.ts` — funnel_stage transitions × time_in_stage variants
- [ ] `test/fixtures/analytics/aggregated-metric.ts` — k-anonymity above/below threshold variants
- [ ] `test/fixtures/analytics/pricing-signal.ts` — 5 signal_kind variants
- [ ] `test/fixtures/analytics/freshness-audit.ts` — SLA violation variants per freshness_mode
- [ ] CDP/CRM360/channels/conversion fixtures from P221-P224 reused
- [ ] `package.json` — confirm `json-logic-js` present (P221 dep), confirm Vercel AI Gateway env config

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 15 new tables) | 100% of tables | SOC2 baseline |
| Formula DSL evaluator (json-logic) | 100% per metric category | tenant-safety; no SQL injection |
| Attribution model correctness | 100% per model × lookback_days × multi-model coexistence | Doc 22 rule 5 multi-model + confidence-scored |
| Anomaly detection severity matrix | 100% — sigma × min_sample_size × sensitivity per metric | SOR + state machine integrity |
| Narrative claim audit | 100% — every numeric/factual span has narrative_claims row + EvidenceMap binding | Doc 22 rule 3 explainability + P209 |
| Decision rule evaluator (per trigger_kind × action_kind) | 100% of branches | Pluggable registry; no orphan |
| Experiment winner detection | 100% — Bayesian + frequentist + both-must-agree + statistical guardrails | D-23 hybrid model |
| Pricing signal emission | 100% per signal_kind + debounce | D-26 decoupled signal |
| Cross-tenant aggregation k-anonymity | 100% — sample_size>=k_anonymity_threshold gates expose | D-28 no raw leak |
| Journey funnel_stage match P222 D-11 enum | 100% — same 11 values | Cross-phase alignment |
| Freshness violation logging | 100% per freshness_mode SLA | D-33 stale_indicator + audit |
| Tombstone propagation | 100% per affected table | P221 D-24 cascade |
| Legacy regression (P100-P105 + P201 + P221-P224) | 100% green | Additive phase |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 225-01 | Schema CRUD; metric_definition seeds (27); attribution_models seeds (6); decision_rules seeds (7) | RLS isolation; cross-tenant denial; aggregated_metrics k-anonymity gate | F-147..F-156 | P100-P105/P201/P221-P224 green | Cross-tenant; tombstoned profile excluded | n/a | n/a |
| 225-02 | Formula DSL evaluator (json-logic per category); freshness_mode enforcement; recompute idempotency | Per-metric cron handlers; AgentRun bridge stub; jitter on hour-boundary | F-156 | n/a | Stale data SLA violation; circuit breaker on recursion | n/a | n/a |
| 225-03 | 6 attribution model algorithms (first/last/linear/position/time-decay/data-driven); legacy first_touch adapter; multi-model coexistence | attribution_touches materialization on Opportunity stage_change; cdp_events lookback_days correct | F-157 | legacy attribution.ts FAMILY_WEIGHTS still works via adapter | tombstoned profile scrub mid-recompute | n/a | n/a |
| 225-04 | Anomaly detection per severity × state machine; auto-suppress dedup; decision_rule pluggable evaluators per trigger_kind × action_kind; circuit breaker | Anomaly cron per metric; thundering herd jitter; rule-fire audit chain | F-158 | n/a | Infinite loop on rule recursion → circuit_breaker_until; spam debounce | n/a | n/a |
| 225-05 | Hybrid template + LLM gen; claim audit pass/fail per narrative_kind; journey_steps recompute | Vercel AI Gateway provider fallback; EvidenceMap claim binding; tombstone scrub | F-159 | n/a | Claim audit failure blocks publish; LLM hallucination caught | n/a | n/a |
| 225-06 | Bayesian Beta-Binomial; frequentist z-test; both-must-agree gate; ICE scoring; pricing_signals emit; aggregated_metrics k-anonymity | Statistical guardrails (min_sample, min_duration, novelty); P205 consumer mock; cross-tenant aggregation cron | F-160..F-162 | n/a | Premature winner (sample<min) blocked; k-anonymity bypass small dimension blocked | n/a | n/a |
| 225-07 | API route handlers; 7 MCP tools; 6 UI workspace components | Cross-tenant API denial; OpenAPI parity; Approval Inbox + Morning Brief integration | All 16 F-IDs registered | All P100-P105 + P201 + P221-P224 green | Cross-tenant 403; missing approval blocks publish | Full operator journey (anomaly inbox + narrative feed + experiment winner approval) | AnalyticsWorkspace + AttributionExplorer + AnomalyInbox + NarrativeFeed + ExperimentsCockpit + DecisionRulesEditor + BenchmarksPanel (7 components × 4 variants) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `metric-definition.ts` | global/tenant-override × 9 categories × 6 grains × 4 freshness_mode | 225-01..07 |
| `attribution-touch.ts` | 6 models × 11 channels × 4 touch_types | 225-03..07 |
| `anomaly.ts` | 4 severity × 5 state × suppressed variants | 225-04..07 |
| `narrative.ts` | 8 narrative_kinds × 5 status × claim audit pass/fail | 225-05..07 |
| `decision-rule.ts` | 8 trigger_kinds × 7 action_kinds matrix | 225-04..07 |
| `experiment-winner.ts` | Bayesian / frequentist / both-agree / neither-agree | 225-06..07 |
| `journey-step.ts` | 11 funnel_stage transitions × time_in_stage | 225-05..07 |
| `aggregated-metric.ts` | k-anonymity above/below k=5 | 225-06..07 |
| `pricing-signal.ts` | 5 signal_kind variants | 225-06..07 |
| `freshness-audit.ts` | SLA violation per freshness_mode | 225-02, 225-04 |
| P221 cdp/* reuse | ConsentState + cdp_events for attribution + journey | all slices |
| P222 crm360/* reuse | Customer360 + Opportunity + nba_records | all slices |
| P223 channels/* reuse | dispatch_events for channel attribution | 225-03 |
| P224 conversion/* reuse | conversion_events + ConversionExperiment + LaunchOutcome | 225-03..06 |

Location: `test/fixtures/analytics/`. Importable from all analytics test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.ts` CRUD + RLS + tombstone cascade cases."
- DSL criteria: "Verified by `formula-dsl-evaluator.test.ts` json-logic safety + per-category."
- Attribution criteria: "Verified by `attribution-{first,last,linear,position,time-decay,data-driven}.test.ts` correctness + multi-model coexistence."
- Anomaly criteria: "Verified by `anomaly-state-machine.test.ts` + `anomaly-thundering-herd.test.ts` jitter."
- Narrative criteria: "Verified by `narrative-template-llm.test.ts` + `claim-audit.test.ts` per kind."
- Decision criteria: "Verified by `decision-rule-evaluator.test.ts` per trigger × action + `circuit-breaker.test.ts` infinite-loop guard."
- Experiment criteria: "Verified by `bayesian-frequentist-agreement.test.ts` + `statistical-guardrails.test.ts`."
- Pricing signal criteria: "Verified by `pricing-signal-emit.test.ts` + P205 consumer mock."
- Aggregation criteria: "Verified by `k-anonymity.test.ts` threshold + opt-in toggle + no raw leak."
- Journey criteria: "Verified by `journey-funnel-stage.test.ts` matches P222 D-11 enum."
- Freshness criteria: "Verified by `freshness-audit.test.ts` per freshness_mode SLA."
- Tombstone criteria: "Verified by `tombstone-cascade.test.ts` analytics rows scrub on profile tombstone."
- RLS criteria: "Verified by `rls-suite.test.ts` cross-tenant denial on all 15 new tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P201 + P221-P224 green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Narrative quality at scale | ANL-04 | LLM output requires human read-through | (1) Generate weekly_summary for 5 tenants, (2) operator reviews each for accuracy/tone/insight, (3) confirms claim audit caught all errors |
| Anomaly inbox UX during real anomaly burst | ANL-03 | Operator triage flow | (1) Synthesize anomaly burst (10+ critical in 1 hour), (2) operator triages via AnomalyInbox, (3) verify resolution flow + decision_rule firing |
| Experiment winner promotion approval flow | ANL-05 | Multi-day Bayesian convergence | (1) Run experiment to convergence, (2) operator inspects ExperimentsCockpit, (3) approves variant promotion via Approval Inbox, (4) verify P224 ConversionExperiment.status flips |
| Cross-tenant benchmark UX with k-anonymity | LOOP-08 | Operator opt-in flow | (1) Tenant A opts in, (2) tenant B opts in, (3) confirm BenchmarksPanel shows aggregated industry baseline only when k>=5, (4) verify no raw leak |
| Narrative LLM provider failover | ANL-04 | Real provider outage | (1) Force primary provider down, (2) verify Vercel AI Gateway falls back, (3) narrative generation succeeds without operator intervention |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 150s quick / 13 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
