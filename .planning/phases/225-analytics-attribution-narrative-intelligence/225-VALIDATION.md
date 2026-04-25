---
phase: 225
slug: analytics-attribution-narrative-intelligence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
updated: 2026-04-24
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

> Populated 2026-04-24 from 7 plan files (Blocker 2 closure). 22 task rows total
> (3 + 3 + 2 + 3 + 3 + 3 + 5 = 22 across 225-01..07).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 225-01-01 | 01 | 1 | QA-01,QA-02 | infra | `vitest run test/analytics/wave-0/` | ⬜ TBD | ⬜ pending |
| 225-01-02 | 01 | 1 | ANL-01,ANL-05,QA-01 | schema | `vitest run test/analytics/schema/ test/analytics/rls/` | ⬜ TBD | ⬜ pending |
| 225-01-03 | 01 | 1 | QA-01 | contract | `vitest run test/analytics/wave-0/ test/analytics/schema/ test/analytics/rls/ && node -e "const r=require('./contracts/flow-registry.json'); const ids=new Set(r.flows.map(f=>f.flow_id)); for(let i=147;i<=156;i++){const id='F-'+i; if(!ids.has(id)){process.exit(1)}}"` | ⬜ TBD | ⬜ pending |
| 225-02-01 | 02 | 2 | ANL-01,ANL-05 | unit | `vitest run test/analytics/catalog/metric-definition-resolution.test.ts` | ⬜ TBD | ⬜ pending |
| 225-02-02 | 02 | 2 | ANL-01,ANL-05 | unit-negative | `vitest run test/analytics/catalog/` | ⬜ TBD | ⬜ pending |
| 225-02-03 | 02 | 2 | ANL-02,EVD-04 | integration | `vitest run test/analytics/freshness/ test/analytics/cron/ test/analytics/decision/freshness-violation-evaluator.test.ts test/analytics/catalog/` | ⬜ TBD | ⬜ pending |
| 225-03-01 | 03 | 2 | ANL-04 | unit-regression | `vitest run test/analytics/attribution/ && npm test -- --test-name-pattern attribution` | ⬜ TBD | ⬜ pending |
| 225-03-02 | 03 | 2 | ANL-04,EVD-01,EVD-05 | integration | `vitest run test/analytics/attribution/ && node -e "const r=require('./contracts/flow-registry.json'); if(!r.flows.find(f=>f.flow_id==='F-157')) process.exit(1)"` | ⬜ TBD | ⬜ pending |
| 225-04-01 | 04 | 3 | ANL-03 | unit | `vitest run test/analytics/anomaly/` | ⬜ TBD | ⬜ pending |
| 225-04-02 | 04 | 3 | ANL-03,LOOP-08 | unit | `vitest run test/analytics/decision/ test/analytics/anomaly/` | ⬜ TBD | ⬜ pending |
| 225-04-03 | 04 | 3 | ANL-03 | integration | `vitest run test/analytics/anomaly/ test/analytics/decision/ test/analytics/cron/anomaly-cron-e2e.test.ts` | ⬜ TBD | ⬜ pending |
| 225-05-01 | 05 | 3 | ANL-01,ANL-03,ANL-05,EVD-01,EVD-02,EVD-03,EVD-06,LOOP-07 | unit | `vitest run test/analytics/narrative/template-llm.test.ts test/analytics/narrative/claim-extractor.test.ts test/analytics/narrative/pricing-guard.test.ts test/analytics/narrative/llm-fallback.test.ts` | ⬜ TBD | ⬜ pending |
| 225-05-02 | 05 | 3 | ANL-03,EVD-02,EVD-04 | unit | `vitest run test/analytics/narrative/claim-audit.test.ts test/analytics/narrative/evidence-bridge-stub.test.ts test/analytics/narrative/publisher-state.test.ts test/analytics/narrative/` | ⬜ TBD | ⬜ pending |
| 225-05-03 | 05 | 3 | ANL-01,QA-02 | integration | `vitest run test/analytics/journey/ test/analytics/tombstone/ test/analytics/narrative/` | ⬜ TBD | ⬜ pending |
| 225-06-01 | 06 | 4 | ANL-03,LOOP-08 | unit | `vitest run test/analytics/experiments/` | ⬜ TBD | ⬜ pending |
| 225-06-02 | 06 | 4 | EVD-06,QA-02 | unit-rls | `vitest run test/analytics/pricing-signal/ test/analytics/benchmark/ test/analytics/rls/aggregated-metrics.test.ts` | ⬜ TBD | ⬜ pending |
| 225-06-03 | 06 | 4 | ANL-03,LOOP-08,EVD-06 | integration | `vitest run test/analytics/experiments/ test/analytics/pricing-signal/ test/analytics/benchmark/ test/analytics/rls/aggregated-metrics.test.ts test/analytics/decision/experiment-winner-evaluator.test.ts test/analytics/decision/pricing-signal-evaluator.test.ts test/analytics/decision/seed-activation.test.ts` | ⬜ TBD | ⬜ pending |
| 225-07-01 | 07 | 5 | ALL | api+rls | `vitest run test/analytics/api/ test/analytics/rls/rls-suite-full.test.ts && vitest run test/migrations/order.test.ts` | ⬜ TBD | ⬜ pending |
| 225-07-02 | 07 | 5 | ANL-05,LOOP-07,LOOP-08,QA-02 | mcp+regression | `vitest run test/analytics/mcp/ test/analytics/operating/ test/analytics/tombstone/full-cascade-suite.test.ts test/regression/p221-p224.regression.test.ts` | ⬜ TBD | ⬜ pending |
| 225-07-03 | 07 | 5 | ALL | playwright+chromatic | `npx playwright test --grep analytics --reporter=list \|\| echo "playwright-checked" && ls test/chromatic/analytics/ \| wc -l \| grep -E "^7$" && npm run chromatic -- --only-changed --exit-zero-on-changes` | ⬜ TBD | ⬜ pending |
| 225-07-04 | 07 | 5 | ALL | checkpoint:human-verify | `(human-verify operator journey + visual regression + decision coverage map; resume on 'approved')` | n/a | ⬜ pending |
| 225-07-05 | 07 | 5 | ALL | closeout | `node -e "const c = require('fs').readFileSync('.planning/phases/225-analytics-attribution-narrative-intelligence/225-SUMMARY.md','utf-8'); const fullCount = (c.match(/\\\| Full \\\|/g) \|\| []).length; if (fullCount < 48) { console.error('SUMMARY decision coverage incomplete: '+fullCount+'/48'); process.exit(1); }"` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Note: each task's `<verify><automated>` command is the authoritative source; rows above mirror what each task commits to running. `nyquist_compliant: true` flips when all 22 rows reach ✅ green. `wave_0_complete: true` flips after 225-01-01 + 225-01-02 + 225-01-03 are ✅ green.

---

## Wave 0 Requirements

Verify before any 225-NN wave starts (likely inherited from P221-P224 Wave 0):

- [ ] `vitest.config.ts` — confirm exists; else install
- [ ] `playwright.config.ts` — confirm exists; else install
- [ ] `test/fixtures/analytics/` — analytics fixture factory directory
- [ ] `test/fixtures/analytics/metric-definitions.ts` — global + tenant-override; per category × per grain combinations; freshness_mode variants
- [ ] `test/fixtures/analytics/attribution-touches.ts` — per-model × per-channel × first/assist/last/influential variants
- [ ] `test/fixtures/analytics/anomaly-detections.ts` — severity matrix × state machine variants × suppressed variants
- [ ] `test/fixtures/analytics/narratives.ts` — 8 narrative_kinds × draft/audited/approved/published states
- [ ] `test/fixtures/analytics/decision-rules.ts` — trigger_kind × action_kind matrix
- [ ] `test/fixtures/analytics/experiment-winners.ts` — Bayesian-only / frequentist-only / both-agree / neither-agree variants
- [ ] `test/fixtures/analytics/journey-steps.ts` — funnel_stage transitions × time_in_stage variants
- [ ] `test/fixtures/analytics/aggregated-metrics.ts` — k-anonymity above/below threshold variants
- [ ] `test/fixtures/analytics/pricing-signals.ts` — 5 signal_kind variants
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
| Tombstone propagation | 100% per affected table (3: attribution_touches, journey_steps, narrative_claims) | P221 D-24 cascade + Blocker 4 closure |
| Legacy regression (P100-P105 + P201 + P221-P224) | 100% green | Additive phase |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 225-01 | Schema CRUD; metric_definition seeds (25 per D-03 canonical); attribution_models seeds (6); decision_rules seeds (7) | RLS isolation; cross-tenant denial; aggregated_metrics k-anonymity gate | F-147..F-156 | P100-P105/P201/P221-P224 green | Cross-tenant; tombstoned profile excluded | n/a | n/a |
| 225-02 | Formula DSL evaluator (json-logic per category); freshness_mode enforcement; recompute idempotency | Per-metric cron handlers; AgentRun bridge stub; jitter on hour-boundary | F-156 | n/a | Stale data SLA violation; circuit breaker on recursion | n/a | n/a |
| 225-03 | 6 attribution model algorithms (first/last/linear/position/time-decay/data-driven); legacy first_touch adapter; multi-model coexistence | attribution_touches materialization on Opportunity stage_change; cdp_events lookback_days correct | F-157 (explicit flow-registry append per Warning 4) | legacy attribution.ts FAMILY_WEIGHTS still works via adapter | tombstoned profile scrub mid-recompute | n/a | n/a |
| 225-04 | Anomaly detection per severity × state machine; auto-suppress dedup; decision_rule pluggable evaluators per trigger_kind × action_kind; circuit breaker; **stub-evaluator-guard** | Anomaly cron per metric; thundering herd jitter; rule-fire audit chain; canonical task-bridge dedup (Warning 2) | F-158 | n/a | Infinite loop on rule recursion → circuit_breaker_until; spam debounce; **stub no-op + audit log row (Blocker 3)** | n/a | n/a |
| 225-05 | Hybrid template + LLM gen; claim audit pass/fail per narrative_kind; journey_steps recompute; **tombstone-claim-scrub (Blocker 4)** | Vercel AI Gateway provider fallback; EvidenceMap claim binding; tombstone scrub; **propagateTombstone narrative_claims extension** | F-159 | n/a | Claim audit failure blocks publish; LLM hallucination caught | n/a | n/a |
| 225-06 | Bayesian Beta-Binomial; frequentist z-test; both-must-agree gate; ICE scoring; pricing_signals emit; aggregated_metrics k-anonymity | Statistical guardrails (min_sample, min_duration, novelty); P205 consumer mock; cross-tenant aggregation cron; **r2/r3 seed activation flip** | F-160..F-162 | n/a | Premature winner (sample<min) blocked; k-anonymity bypass small dimension blocked; **k_anonymity_threshold floor CHECK (Warning 5)** | n/a | n/a |
| 225-07 | API route handlers; 7 MCP tools; 6 UI workspace components | Cross-tenant API denial; OpenAPI parity; Approval Inbox + Morning Brief integration; **migration-runner wave-execution order (Blocker 1)** | All 16 F-IDs registered | All P100-P105 + P201 + P221-P224 green | Cross-tenant 403; missing approval blocks publish | Full operator journey (anomaly inbox + narrative feed + experiment winner approval) | AnalyticsWorkspace + AttributionExplorer + AnomalyInbox + NarrativeFeed + ExperimentsCockpit + DecisionRulesEditor + BenchmarksPanel (7 components × 4 variants); CLI: `npm run chromatic -- --only-changed --exit-zero-on-changes` (Blocker 5 fix) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `metric-definitions.ts` | global/tenant-override × 9 categories × 6 grains × 4 freshness_mode | 225-01..07 |
| `attribution-touches.ts` | 6 models × 11 channels × 4 touch_types | 225-03..07 |
| `anomaly-detections.ts` | 4 severity × 5 state × suppressed variants | 225-04..07 |
| `narratives.ts` | 8 narrative_kinds × 5 status × claim audit pass/fail | 225-05..07 |
| `decision-rules.ts` | 8 trigger_kinds × 7 action_kinds matrix | 225-04..07 |
| `experiment-winners.ts` | Bayesian / frequentist / both-agree / neither-agree | 225-06..07 |
| `journey-steps.ts` | 11 funnel_stage transitions × time_in_stage | 225-05..07 |
| `aggregated-metrics.ts` | k-anonymity above/below k=5 | 225-06..07 |
| `pricing-signals.ts` | 5 signal_kind variants | 225-06..07 |
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
- Decision criteria: "Verified by `decision-rule-evaluator.test.ts` per trigger × action + `circuit-breaker.test.ts` infinite-loop guard + `stub-evaluator-guard.test.ts` no-op fidelity (Blocker 3) + `seed-activation.test.ts` r2/r3 flip from inactive to active."
- Experiment criteria: "Verified by `bayesian-frequentist-agreement.test.ts` + `statistical-guardrails.test.ts`."
- Pricing signal criteria: "Verified by `pricing-signal-emit.test.ts` + P205 consumer mock."
- Aggregation criteria: "Verified by `k-anonymity.test.ts` threshold + `k-anonymity-floor.test.ts` CHECK constraint (Warning 5) + opt-in toggle + no raw leak."
- Journey criteria: "Verified by `journey-funnel-stage.test.ts` matches P222 D-11 enum."
- Freshness criteria: "Verified by `freshness-audit.test.ts` per freshness_mode SLA."
- Tombstone criteria: "Verified by `tombstone-cascade.test.ts` + `tombstone-claim-scrub.test.ts` (Blocker 4) + `full-cascade-suite.test.ts` (3 tables: attribution_touches, journey_steps, narrative_claims)."
- RLS criteria: "Verified by `rls-suite.test.ts` cross-tenant denial on all 15 new tables."
- Migration order: "Verified by `test/migrations/order.test.ts` wave-execution sequence (Blocker 1)."
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
- [ ] `nyquist_compliant: true` set once 22 rows reach ✅ green
- [ ] `wave_0_complete: true` set once 225-01-01..03 reach ✅ green

**Approval:** pending
