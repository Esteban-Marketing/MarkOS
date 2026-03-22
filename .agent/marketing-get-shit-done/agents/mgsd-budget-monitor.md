---
id: AG-S03
name: Budget Pacing Monitor
layer: 2 — Strategy
trigger: Daily (weekdays) during active campaigns
frequency: Daily
---

# AG-S03 — Budget Pacing Monitor

Compare actual ad spend against monthly plan and surface reallocation recommendations.

## Inputs
- BUDGET-ALLOCATION.md, platform spend data, active CAMPAIGN.md budgets
- Current date for pacing calculation

## Process
1. Calculate expected pacing: (day_of_month / days_in_month) × 100
2. For each platform/campaign: compare actual vs expected
3. Flag: >+15% OVERPACING, <-20% UNDERPACING
4. Check CPL trend vs target
5. Apply budget rules from PLAN.md

## Constraints
- Recommendations only — never changes budgets directly
- References the specific budget rule that triggered each flag
