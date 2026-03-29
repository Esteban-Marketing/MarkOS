# BUDGET-ALLOCATION.md — Marketing Budget Structure

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md to customize it safely.


```
file_purpose  : Define the total marketing budget and how it is distributed
                across disciplines, quarters, and categories.
                All discipline plans must stay within their allocated budget.
status        : empty
plan_period   : YYYY
last_updated  : YYYY-MM-DD
```

---

## 1. Budget Philosophy

**How budget decisions are made:**
[FILL — e.g. "Budget follows evidence. Channels that demonstrate CPL at or below target receive continued investment. New channels receive a test budget capped at 10% of total until proof of concept."]

**Budget flexibility:**
```yaml
budget_is_fixed         : "[YES — approved annually | NO — reviewed quarterly]"
reallocation_authority  : "{{LEAD_AGENT}} — up to 20% reallocation without client approval"
over_20pct_authority    : "[Client approval required]"
emergency_reserve       : "[% of total held for unplanned opportunities or crises]"
```

---

## 2. Total Budget

```yaml
total_annual_budget     : "$[FILL]"
total_monthly_average   : "$[FILL]"
budget_currency         : "[USD | COP | EUR]"
budget_source           : "[Client ad spend only | Agency + client | Agency only]"
```

**Budget breakdown by category:**

| Category | Annual Budget | % of Total | Notes |
|----------|--------------|-----------|-------|
| Paid Media (ad spend) | $[FILL] | [%] | [Meta, Google, TikTok, X] |
| Content & Creative | $[FILL] | [%] | [Designer, video, copy] |
| Tools & Technology | $[FILL] | [%] | [PostHog, n8n, ESP, CRM] |
| Agency / People | $[FILL] | [%] | [{{LEAD_AGENT}} retainer or project fees] |
| Influencer & Partnerships | $[FILL] | [%] | [If applicable] |
| Events | $[FILL] | [%] | [If applicable] |
| Experimentation Reserve | $[FILL] | [%] | [New channel tests — locked until used] |
| **TOTAL** | **$[FILL]** | **100%** | |

---

## 3. Discipline Allocation

| Discipline | Annual Budget | Monthly Avg | Q1 | Q2 | Q3 | Q4 |
|-----------|--------------|------------|----|----|----|----|
| 01 — Advertising | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] |
| 02 — Content Marketing | $[FILL] | $[FILL] | | | | |
| 03 — Email Marketing | $[FILL] | $[FILL] | | | | |
| 04 — Organic Social | $[FILL] | $[FILL] | | | | |
| 05 — Influencer | $[FILL] | $[FILL] | | | | |
| 06 — SEO | $[FILL] | $[FILL] | | | | |
| 07 — PR & Comms | $[FILL] | $[FILL] | | | | |
| 08 — Brand | $[FILL] | $[FILL] | | | | |
| 09 — Product Marketing | $[FILL] | $[FILL] | | | | |
| 10 — Partnerships | $[FILL] | $[FILL] | | | | |
| 11 — CRO | $[FILL] | $[FILL] | | | | |
| 12 — Community | $[FILL] | $[FILL] | | | | |
| 13 — Events | $[FILL] | $[FILL] | | | | |
| Experimentation Reserve | $[FILL] | — | | | | |
| **TOTAL** | **$[FILL]** | | | | | |

---

## 4. Paid Media Platform Allocation

> Sub-allocation within the Advertising discipline budget.

| Platform | Monthly Budget | % of Ad Budget | Status | Notes |
|----------|---------------|---------------|--------|-------|
| Meta (FB + IG) | $[FILL] | [%] | [ACTIVE / INACTIVE] | [Primary or test] |
| Google Search | $[FILL] | [%] | [FILL] | [FILL] |
| Google Display | $[FILL] | [%] | [FILL] | [FILL] |
| TikTok | $[FILL] | [%] | [FILL] | [FILL] |
| X (Twitter) | $[FILL] | [%] | [FILL] | [FILL] |
| LinkedIn | $[FILL] | [%] | [FILL] | [FILL] |
| Other | $[FILL] | [%] | [FILL] | [FILL] |

---

## 5. Quarterly Budget Plan

| Quarter | Total Budget | Paid Media | Content/Creative | Tools | Other |
|---------|-------------|-----------|-----------------|-------|-------|
| Q1 | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] |
| Q2 | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] |
| Q3 | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] |
| Q4 | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] |

**Q4 is heavier/lighter because:**
[FILL — e.g. "Seasonal demand spike in Q4 justifies 35% of total ad spend in that quarter."]

---

## 6. Budget Performance Tracking

**Monthly actuals vs. plan:**

| Month | Budget | Actual Spend | Variance | Notes |
|-------|--------|-------------|---------|-------|
| [YYYY-MM] | $[FILL] | — | — | — |

---

## 7. Budget Reallocation Log

> Document every time budget is moved between disciplines or categories.

| Date | From | To | Amount | Reason | Approved By |
|------|------|----|--------|--------|------------|
| — | — | — | — | — | — |

---

## 8. ROI Expectations

```yaml
target_mer            : "[Total revenue / total marketing spend ≥ X]"
target_cac            : "$[FILL] or less"
target_ltv_cac_ratio  : "≥ [FILL]:1"
payback_period        : "[e.g. CAC recovered within X months]"
```

**Budget increase triggers:**
[FILL — e.g. "If MER exceeds 4:1 for 60 consecutive days, request 20% budget increase from client."]

**Budget decrease triggers:**
[FILL — e.g. "If MER drops below 2:1 for 30 days, reduce paid media spend 15% and review strategy."]
