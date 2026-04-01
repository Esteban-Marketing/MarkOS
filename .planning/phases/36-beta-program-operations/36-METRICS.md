# Phase 36 Metrics: Beta Operations Scorecard

## Measurement Window

- Milestone: v2.4
- Phase: 36
- Goal horizon: 2026-04-01 to 2026-04-30

## Core KPIs

| KPI | Definition | Baseline | Weekly Target | Month Target | Owner | Data Source |
|---|---|---|---|---|---|---|
| Intakes Accepted | Count of validated accepted intake submissions | 0 | >= 5 | >= 20 | Intake Ops Lead | Intake responses + Linear intake tickets |
| Kickoffs Scheduled | Accepted intakes with kickoff date confirmed | 0 | >= 2 | >= 10 | Pilot Manager | Lifecycle register |
| Active Pilots | Pilots with at least one active weekly action and owner | 0 | +2 net | 10 | Intake Ops Lead | Lifecycle register |
| Time-To-First-Campaign | Median days from kickoff to first campaign artifact | N/A | <= 5 days | <= 5 days | Channel Lead | Campaign action logs |
| Weekly Participation Rate | Active pilots attending weekly check-in / total active pilots | N/A | >= 80% | >= 85% | Pilot Manager | Weekly cadence attendance |
| At-Risk Pilot Count | Number of pilots in At Risk state | 0 | <= 2 | <= 2 | Intake Ops Lead | Lifecycle register |

## Funnel Conversion Targets

| Stage | Target Conversion |
|---|---|
| Intake Accepted -> Kickoff Scheduled | >= 85% |
| Kickoff Scheduled -> Activation In Progress | >= 80% |
| Activation In Progress -> Active Pilot | >= 75% |

## Risk Thresholds

- Red: At-risk pilots > 2.
- Red: Time-to-first-campaign > 7 days for two consecutive weeks.
- Yellow: Weekly participation < 70%.
- Yellow: Kickoff conversion below 75% in any week.

## BETA-01 Risk Memo

**Target:** 10 active pilots by 2026-04-30.
**Current pipeline:** 0 of 10 (as of 2026-04-01).
**Time remaining:** 29 days (≈ 4 operating weeks).

**Funnel math at committed minimum targets (5 intakes/week):**

| Week | Intakes Accepted | → Kickoffs (×85%) | → Activations (×80%) | → Active (×75%) | Running Total |
|---|---|---|---|---|---|
| 1 | 5 | 4.3 | 3.4 | 2.6 | 2.6 |
| 2 | 5 | 4.3 | 3.4 | 2.6 | 5.1 |
| 3 | 5 | 4.3 | 3.4 | 2.6 | 7.7 |
| 4 | 5 | 4.3 | 3.4 | 2.6 | 10.2 |

**Projected result at committed minimums: ~10 active pilots. This is a tight-margin trajectory.**

To reach 10 at current conversion rates: 10 ÷ (0.85 × 0.80 × 0.75) ≈ **20 total accepted intakes = ≥5/week**.

**Decision log (closed on 2026-04-01):**
- [ ] Raise weekly intake target to ≥5 and update outreach sourcing in Phase 37 plan.
- [ ] Accept projected 6-pilot outcome and extend BETA-01 deadline to 2026-05-31.
- [x] Both: raise target AND record extended deadline as fallback.

**Committed policy (2026-04-01):** Both selected. Execution target is >=5 accepted intakes/week with an operational fallback deadline of 2026-05-31 if conversion underperforms.

## Weekly Reporting Contract

Update this scorecard every Friday before closeout with:

1. KPI current value.
2. Week-over-week delta.
3. Root cause for misses.
4. Corrective action with owner/date.
