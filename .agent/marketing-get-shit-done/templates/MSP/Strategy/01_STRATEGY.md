# 🧭 {{COMPANY_NAME}} - Marketing Strategy Pipeline

**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 required
**Assigned Agent:** `{{LEAD_AGENT}}` (mgsd-strategist)
**Linear Project Manager:** `mgsd-linear-manager`

## Strategic Parameters
- **Active Milestone:** `{{MILESTONE_GOAL}}`
- **Planning Horizon:** `{{PLANNING_PERIOD}}`
- **Primary Revenue Goal:** `{{REVENUE_TARGET}}`
- **Primary KPI:** `{{PRIMARY_KPI}}`

---

<!-- SOURCED_FROM → MGSD-RES-MKT-01 (MARKET-TRENDS.md) -->
<!-- SOURCED_FROM → MGSD-RES-AUD-01 (AUDIENCE-RESEARCH.md § Channel Preferences) -->

## 1. Situation Analysis

- [ ] Pull current MIR STATE.md and assess Gate 1 and Gate 2 readiness.
- [ ] Extract active campaign performance data from `09_ANALYTICS/KPI-FRAMEWORK.md`.
- [ ] Run gap audit via `mgsd-tools.cjs mir-audit` and identify all CRITICAL and HIGH gaps.
- [ ] Document business context: seasonality, pending launches, budget constraints (`{{BUDGET_PERIOD}}`).

## 2. Milestone Goal Setting

- [ ] Define primary milestone goal: one measurable outcome (`{{MILESTONE_GOAL}}`).
- [ ] Set time-bound micro-goals: Week 1, Week 2, End of month targets.
- [ ] Align milestone goal with `MSP/Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md`.
- [ ] Human approves milestone goals before any planning begins.

## 3. Discipline Activation Decision

- [ ] Review all activated disciplines in `.planning/config.json`.
- [ ] For each active discipline: does it have a plan for this milestone period?
- [ ] Flag any discipline that lacks a supporting plan → create plan via `/mgsd-plan-campaign --discipline {slug}`.
- [ ] Flag disciplines with low ROI from last period → propose pausing or reallocating budget.

## 4. Budget Allocation

- [ ] Pull current budget from `MSP/Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`.
- [ ] Compute recommended discipline split based on last period's ROAS / CPL.
- [ ] Flag if any channel is over or under-allocated vs. performance data.
- [ ] Human approves budget allocation before execution begins.

## 5. Roadmap → Phase Mapping

- [ ] Map each milestone goal to a `ROADMAP.md` phase number.
- [ ] Ensure each phase has a corresponding PLAN.md or is pending plan-campaign workflow.
- [ ] Confirm phases are in correct sequential and dependency order.
- [ ] Flag any roadmap gaps where phases are missing or unordered.

## 6. Strategy Brief

- [ ] Produce `STRATEGY-BRIEF.md` summarizing: goals, discipline plan, budget, phase order.
- [ ] Human reviews and approves STRATEGY-BRIEF.md.
- [ ] Commit: `mktg(strategy): {milestone_slug} strategic brief approved`

## 7. Algorithmic Optimization Loop

- [ ] Check if previous milestone had a performance report (`/mgsd-report-campaign`).
- [ ] Extract top 3 recommendations from analyst.
- [ ] Incorporate top recommendations into this milestone's phase planning.
- [ ] Update `KPI-FRAMEWORK.md` targets if recommendations require target revision.
