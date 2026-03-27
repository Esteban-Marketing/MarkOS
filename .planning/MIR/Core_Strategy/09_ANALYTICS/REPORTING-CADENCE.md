# REPORTING-CADENCE.md — When and What to Report

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/09_ANALYTICS/REPORTING-CADENCE.md to customize it safely.


```
file_purpose  : Define the reporting schedule, report content, and delivery format.
status        : empty
last_updated  : YYYY-MM-DD
```

---

## 1. Report Types

### Daily Pulse (internal only — first 7 days of a new campaign)

**Who sees it:** {{LEAD_AGENT}} only
**When:** Each morning at [TIME]
**Format:** Slack message or internal note
**Contents:**
- Spend yesterday vs. plan
- Leads yesterday vs. target
- CPL yesterday vs. target
- Any anomalies flagged

---

### Weekly Performance Review

**Who sees it:** {{LEAD_AGENT}} + Client
**When:** [Day of week], delivered by [TIME]
**Format:** `Core_Strategy/09_ANALYTICS/REPORTS/[campaign_id]-weekly-[YYYY-WNN].md`
**Contents:**
- Period: [Mon–Sun]
- Spend: Actual vs. plan
- Leads: Volume, CPL, vs. target
- Top performing creative
- PostHog funnel conversion rates
- Notable events or changes
- Next week plan

---

### Monthly Report

**Who sees it:** Client + {{LEAD_AGENT}}
**When:** By [day] of the following month
**Format:** Markdown or PDF per `Core_Strategy/09_ANALYTICS/REPORTS/[campaign_id]-monthly-[YYYY-MM].md`
**Contents:**
- Executive summary (3–5 sentences — what happened, what worked, what changed)
- KPI scorecard vs. targets
- Channel breakdown (spend, leads, CPL by channel)
- Creative performance
- Funnel analysis (PostHog data — include screenshots)
- Audience insights
- Revenue attribution (if available)
- Optimization actions taken
- Recommendations for next month
- Budget proposal for next month

---

### Campaign Post-Mortem

**When:** Within 5 business days of campaign end
**Format:** Filed in `Campaigns_Assets/08_CAMPAIGNS/ARCHIVE/[campaign_id]/POST-MORTEM.md`
**Contents:**
- Campaign objectives vs. results
- What worked (specific, not vague)
- What didn't work (specific, with hypothesis for why)
- Top creative assets
- Audience insights
- Tech/tracking issues encountered
- Recommendations for future campaigns

---

## 2. Report Delivery

```yaml
report_format         : "[MARKDOWN | PDF | SLIDES | NOTION]"
delivery_channel      : "[Email | Slack | Google Drive link | WhatsApp]"
client_access         : "[FILL — can client access PostHog directly? YES/NO]"
```

---

## 3. Data Freshness Standards

```yaml
real_time_data        : "PostHog live events — always current"
daily_refresh         : "PostHog dashboards"
weekly_pull           : "Platform ad data (signal only)"
monthly_reconciliation: "CRM revenue data vs. marketing spend"
```