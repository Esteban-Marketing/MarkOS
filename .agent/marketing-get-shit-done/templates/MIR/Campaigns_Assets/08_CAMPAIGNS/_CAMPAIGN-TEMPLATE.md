# CAMPAIGN.md — [Campaign Name]

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Campaigns_Assets/08_CAMPAIGNS/_CAMPAIGN-TEMPLATE.md to customize it safely.


```
campaign_id       : [client-slug]-[initiative]-[YYMM]
project_id        : P[N]
campaign_name     : "[Full campaign name]"
status            : [PLANNING | ACTIVE | PAUSED | COMPLETE | ARCHIVED]
last_updated      : YYYY-MM-DD
updated_by        : [Name]
```

> **AI agents:** Load this file after the MIR boot sequence. This is the campaign source of truth. The MIR repository is the business source of truth. Campaigns derive from MIR — they do not contradict it.

---

## 1. Campaign Brief

**Objective:**
[FILL — one sentence. What is this campaign designed to achieve?]

**Primary KPI:**
[FILL — single measurable success metric, e.g. "50 qualified leads at ≤$15 CPL"]

**Secondary KPIs:**
[FILL]

**Campaign period:**
```yaml
start_date        : YYYY-MM-DD
end_date          : YYYY-MM-DD
duration_days     : [#]
```

**Budget:**
```yaml
total_budget      : "[USD]"
daily_budget      : "[USD]"
platform_split    : "[Meta: X% | Google: X% | TikTok: X%]"
```

---

## 2. Audience

**Primary audience segment:**
[Reference segment ID from `Market_Audiences/03_MARKET/AUDIENCES.md` — e.g. SEG-001]

**Targeting parameters:**
[Summary of targeting — full detail in AUDIENCES.md]

**Exclusions:**
[FILL]

---

## 3. Offer & Landing Page

**Offer being promoted:**
[Reference offer ID from `Products/04_PRODUCTS/OFFERS.md` — e.g. OFR-001]

**Landing page URL:**
[FILL]

**CTA:**
[FILL]

---

## 4. Creative Brief

**Creative concept:**
[FILL — the strategic direction for visuals and copy]

**Ad formats required:**
| Format | Dimensions | Copy Angle | Variant Count |
|--------|-----------|-----------|--------------|
| [Format] | [Spec from BRAND-IDENTITY.md] | [FILL] | [FILL] |

**Key messages (from MESSAGING-FRAMEWORK.md):**
- Hook: [FILL]
- Body: [FILL]
- CTA: [FILL]

**Visual direction (from VISUAL-GUIDELINES.md):**
[FILL]

**Designer brief status:** [NOT_STARTED | IN_PROGRESS | DELIVERED | APPROVED]

---

## 5. Tracking & Attribution

**PostHog funnel for this campaign:**
```yaml
funnel_name       : "[Campaign name] Conversion Funnel"
step_1            : "page_viewed — [landing page URL]"
step_2            : "form_started"
step_3            : "lead_submitted"
step_4            : "thank_you_page_viewed"
```

**Meta CAPI event:** Lead
**UTM structure:**
```
utm_source=[platform]
utm_medium=[medium]
utm_campaign=[campaign_id]
utm_content=[ad_variant_id]
```

**Tracking validation status:** [NOT_STARTED | IN_PROGRESS | VALIDATED]

---

## 6. Launch Checklist

**Pre-launch:**
- [ ] Landing page live and tested on mobile/desktop
- [ ] Form submits and fires PostHog `lead_submitted` event
- [ ] n8n/Make WF-001 tested end-to-end
- [ ] Meta CAPI receiving test Lead events
- [ ] CRM creates record on test submission
- [ ] Confirmation email sends from correct address
- [ ] All UTM parameters populated and tracked
- [ ] Budget caps set in ad platform
- [ ] Ad creatives approved by {{LEAD_AGENT}}
- [ ] Audience targeting reviewed by {{LEAD_AGENT}}

**Launch day:**
- [ ] Campaigns set to ACTIVE
- [ ] Monitoring check at 2h, 6h, 24h post-launch
- [ ] PostHog funnel showing data
- [ ] STATE.md updated to reflect ACTIVE campaign

---

## 7. Optimization Log

| Date | Observation | Action Taken | Result |
|------|------------|-------------|--------|
| [YYYY-MM-DD] | [FILL] | [FILL] | [FILL] |

**Optimization cadence:** [e.g. Weekly review. No budget changes in first 48h after launch.]

---

## 8. Results

> Fill this section when the campaign ends.

```yaml
final_status          : "[COMPLETE | PAUSED — reason]"
campaign_period       : "[Start] → [End]"
total_spend           : "[USD]"
total_leads           : "[#]"
cost_per_lead         : "[USD]"
lead_to_call_rate     : "[%]"
call_to_close_rate    : "[%]"
revenue_attributed    : "[USD or UNKNOWN]"
target_kpi_achieved   : "[YES | NO | PARTIAL]"
```

**Top-performing creative:**
[FILL]

**What worked:**
[FILL]

**What didn't work:**
[FILL]

**Recommendations for next campaign:**
[FILL]

---

## 9. Files & Assets

| Asset | Location | Status |
|-------|---------|--------|
| Landing page | [URL] | [LIVE / ARCHIVED] |
| Creative files | [Drive link] | [FILL] |
| Campaign report | `Core_Strategy/09_ANALYTICS/REPORTS/[campaign_id]-report.md` | [FILL] |
