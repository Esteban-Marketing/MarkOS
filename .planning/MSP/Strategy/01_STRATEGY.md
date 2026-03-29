
# 🧭 {{COMPANY_NAME}} - MarkOS Marketing Strategy Pipeline

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Strategy/01_STRATEGY.md to customize it safely.

---

## LLM-Optimized Summary

This file defines the MarkOS marketing strategy pipeline, including milestone goal setting, discipline activation, budget allocation, roadmap mapping, and optimization loops. All legacy “MARKOS”/“markos” names have been replaced with “MarkOS” except in historical or compatibility contexts. Structured for LLM chunking and cross-referencing.

**See also:**
- [STRATEGIC-GOALS.md](00_MASTER-PLAN/STRATEGIC-GOALS.md)
- [BUDGET-ALLOCATION.md](00_MASTER-PLAN/BUDGET-ALLOCATION.md)
- [ROADMAP.md](../../ROADMAP.md)
- [README.md](../../../../README.md)

---



**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 required
**Assigned Agent:** `{{LEAD_AGENT}}` (markos-strategist)
**Linear Project Manager:** `markos-linear-manager`

## Strategic Parameters

**Summary:**
Defines milestone, planning horizon, revenue goal, and primary KPI for the MarkOS strategy pipeline.
- **Active Milestone:** `{{MILESTONE_GOAL}}`
- **Planning Horizon:** `{{PLANNING_PERIOD}}`
- **Primary Revenue Goal:** `{{REVENUE_TARGET}}`
- **Primary KPI:** `{{PRIMARY_KPI}}`

---

<!-- SOURCED_FROM → MARKOS-RES-MKT-01 (MARKET-TRENDS.md) -->
<!-- SOURCED_FROM → MARKOS-RES-AUD-01 (AUDIENCE-RESEARCH.md § Channel Preferences) -->

## 1. Situation Analysis

**Summary:**
Checklist for assessing current state, campaign performance, and business context. Aligns with MIR and MarkOS v2.2.

- [ ] Pull current MIR STATE.md and assess Gate 1 and Gate 2 readiness.
- [ ] Extract active campaign performance data from `09_ANALYTICS/KPI-FRAMEWORK.md`.
- [ ] Run gap audit via `markos-tools.cjs mir-audit` and identify all CRITICAL and HIGH gaps.
- [ ] Document business context: seasonality, pending launches, budget constraints (`{{BUDGET_PERIOD}}`).

## 2. Milestone Goal Setting

**Summary:**
Defines the process for setting and approving milestone goals, including micro-goals and alignment with strategic goals.

- [ ] Define primary milestone goal: one measurable outcome (`{{MILESTONE_GOAL}}`).
- [ ] Set time-bound micro-goals: Week 1, Week 2, End of month targets.
- [ ] Align milestone goal with `MSP/Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md`.
- [ ] Human approves milestone goals before any planning begins.

## 3. Discipline Activation Decision

**Summary:**
Checklist for reviewing and activating disciplines, ensuring all have plans and are ROI-positive.

- [ ] Review all activated disciplines in `.planning/config.json`.
- [ ] For each active discipline: does it have a plan for this milestone period?
- [ ] Flag any discipline that lacks a supporting plan → create plan via `/markos-plan-campaign --discipline {slug}`.
- [ ] Flag disciplines with low ROI from last period → propose pausing or reallocating budget.

## 4. Budget Allocation

**Summary:**
Checklist for pulling, splitting, and approving budget allocations based on performance data.

- [ ] Pull current budget from `MSP/Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`.
- [ ] Compute recommended discipline split based on last period's ROAS / CPL.
- [ ] Flag if any channel is over or under-allocated vs. performance data.
- [ ] Human approves budget allocation before execution begins.

## 5. Roadmap → Phase Mapping

**Summary:**
Checklist for mapping milestone goals to roadmap phases and ensuring correct order and coverage.

- [ ] Map each milestone goal to a `ROADMAP.md` phase number.
- [ ] Ensure each phase has a corresponding PLAN.md or is pending plan-campaign workflow.
- [ ] Confirm phases are in correct sequential and dependency order.
- [ ] Flag any roadmap gaps where phases are missing or unordered.

## 6. Strategy Brief

**Summary:**
Checklist for producing and approving the strategy brief summarizing goals, plans, and phase order.

- [ ] Produce `STRATEGY-BRIEF.md` summarizing: goals, discipline plan, budget, phase order.
- [ ] Human reviews and approves STRATEGY-BRIEF.md.
- [ ] Commit: `mktg(strategy): {milestone_slug} strategic brief approved`

## 7. Algorithmic Optimization Loop

**Summary:**
Checklist for incorporating analyst recommendations and updating KPI targets for continuous improvement.

---

## LLM-Optimized Reference & Cross-Links

**For further details and implementation context:**
- [v2.2-MILESTONE-AUDIT.md](../../../../.planning/v2.2-MILESTONE-AUDIT.md): Full audit of v2.2 milestone, including rollout hardening and MarkOSDB migration.
- [README.md](../../../../README.md): Quickstart, install, and onboarding instructions.
- [onboarding/backend/](../../../../onboarding/backend/): All backend agent, skill, and utility modules.

**MarkOS replaces all legacy MARKOS/markos names.**
If you find any remaining legacy references, treat them as historical or for compatibility only.

- [ ] Check if previous milestone had a performance report (`/markos-report-campaign`).
- [ ] Extract top 3 recommendations from analyst.
- [ ] Incorporate top recommendations into this milestone's phase planning.
- [ ] Update `KPI-FRAMEWORK.md` targets if recommendations require target revision.
