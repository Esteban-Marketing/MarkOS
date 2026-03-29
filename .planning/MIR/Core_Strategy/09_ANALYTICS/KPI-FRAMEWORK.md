# KPI-FRAMEWORK.md — KPIs, Targets & Measurement Logic

<!-- markos-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md to customize it safely.


```
file_purpose  : Define every KPI used to measure marketing performance.
                Establishes baseline, targets, and the PostHog-first measurement
                methodology. Governs all reporting and optimization decisions.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — all optimization decisions reference this file
```

---

## 1. Measurement Philosophy

```yaml
primary_source_of_truth   : "PostHog"
platform_data_role        : "signal_only"
max_acceptable_discrepancy: "15%"
decision_rule             : "No budget or strategy decision is made based on platform-reported 
                             data alone. PostHog data is required."
```

---

## 2. North Star Metric

**The single metric that best captures whether marketing is working:**

```yaml
north_star_metric   : "[FILL — e.g. Qualified leads per month at or below target CPL]"
current_value       : "[FILL]"
target_value        : "[FILL]"
measurement_source  : "PostHog — lead_submitted event with icp_segment = ICP-1"
```

---

## 3. KPI Dictionary

### Acquisition KPIs

| KPI | Definition | Formula | Target | Source | Alert Threshold |
|-----|-----------|---------|--------|--------|----------------|
| CPL (Cost per Lead) | Total ad spend ÷ total leads | Spend / Leads | [FILL] | PostHog + Ad Platform | >[FILL] = review |
| CPC (Cost per Click) | Spend ÷ link clicks | Spend / Clicks | [FILL] | Platform (signal) | — |
| CTR (Click-Through Rate) | Clicks ÷ impressions | Clicks / Impressions × 100 | [FILL] | Platform (signal) | <[FILL]% = creative review |
| Impression Share | % of available impressions captured | — | [FILL] | Platform (signal) | — |
| Lead Volume | Total form submissions per period | Count of `lead_submitted` events | [FILL] | PostHog | — |

### Funnel KPIs

| KPI | Definition | Formula | Target | Source |
|-----|-----------|---------|--------|--------|
| LP Conversion Rate | Leads ÷ landing page visitors | Leads / Sessions × 100 | [FILL]% | PostHog funnel |
| Form Start Rate | Form starts ÷ page visitors | Form starts / Sessions × 100 | [FILL]% | PostHog |
| Form Completion Rate | Form submits ÷ form starts | Submits / Starts × 100 | [FILL]% | PostHog |
| Thank You Page Rate | TY page views ÷ form submits | TY views / Submits × 100 | ≥95% | PostHog — verifies tracking |

### Quality KPIs

| KPI | Definition | Formula | Target | Source |
|-----|-----------|---------|--------|--------|
| Qualified Lead Rate | ICP-matched leads ÷ total leads | Qualified / Total × 100 | [FILL]% | CRM |
| Lead-to-Call Rate | Discovery calls ÷ leads | Calls / Leads × 100 | [FILL]% | CRM |
| Call-to-Close Rate | New clients ÷ calls | Closes / Calls × 100 | [FILL]% | CRM |
| CPQ (Cost per Qualified Lead) | Spend ÷ qualified leads | Spend / Qualified Leads | [FILL] | PostHog + CRM |

### Revenue KPIs

| KPI | Definition | Target | Source |
|-----|-----------|--------|--------|
| Revenue Attributed | Revenue from marketing-sourced leads | [FILL] | CRM |
| CAC (Customer Acquisition Cost) | Total marketing spend ÷ new clients | [FILL] | CRM + Ad Platforms |
| LTV:CAC Ratio | Customer lifetime value ÷ CAC | ≥3:1 | CRM |
| MER (Marketing Efficiency Ratio) | Total revenue ÷ total ad spend | [FILL] | CRM + Platforms |

### Channel KPIs

| Channel | Primary KPI | Target | Secondary KPI | Target |
|---------|------------|--------|--------------|--------|
| Meta Ads | CPL | [FILL] | Lead quality rate | [FILL]% |
| Google Ads | CPL | [FILL] | Conversion rate | [FILL]% |
| Email | CTR | [FILL]% | Lead conversion rate | [FILL]% |
| Organic Social | Lead attribution | [FILL/month] | Reach | [FILL] |

---

## 4. Baseline Data

```yaml
baseline_established    : "[YES — YYYY-MM-DD | NOT_YET]"
baseline_period         : "[YYYY-MM to YYYY-MM]"
baseline_cpl            : "[USD or UNKNOWN]"
baseline_lead_volume    : "[# per month or UNKNOWN]"
baseline_qualified_rate : "[% or UNKNOWN]"
```

---

## 5. Reporting Cadence

> Full reporting schedule in `Core_Strategy/09_ANALYTICS/REPORTING-CADENCE.md`.

| Report Type | Frequency | Owner | Audience |
|------------|-----------|-------|---------|
| Campaign pulse check | Daily (first 7 days) | {{LEAD_AGENT}} | {{LEAD_AGENT}} only |
| Weekly performance review | Weekly | {{LEAD_AGENT}} | {{LEAD_AGENT}} + Client |
| Monthly report | Monthly | {{LEAD_AGENT}} | Client |
| Campaign post-mortem | Per campaign end | {{LEAD_AGENT}} | {{LEAD_AGENT}} + Client |

---

## 6. Optimization Decision Rules

```yaml
# Budget rules
budget_increase_condition   : "CPL ≤ target AND lead volume ≥ target for 7 consecutive days"
budget_decrease_condition   : "CPL > [150% of target] for 5 consecutive days"
campaign_pause_condition    : "CPL > [200% of target] OR zero conversions for 4 days"

# Creative rules
creative_refresh_condition  : "CTR drops >30% vs. 7-day average OR frequency >4"
creative_test_condition     : "Any ad set running >7 days with ≥500 impressions"

# Attribution rules  
optimization_data_source    : "PostHog — PostHog event count is the number used in all decisions"
platform_data_usage         : "Platform ROAS/CPA used only to cross-check. Never used alone."
```