# WORKFLOWS.md — Standard Operating Procedures

```
file_purpose  : Document recurring operational tasks as step-by-step procedures.
                Ensures consistent execution regardless of who (or what) does the work.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES for operational execution
```

---

## SOP Index

| SOP ID | Name | Owner | Frequency | Estimated Time |
|--------|------|-------|-----------|---------------|
| SOP-001 | New Campaign Launch | {{LEAD_AGENT}} | Per campaign | 3–6h |
| SOP-002 | Weekly Campaign Review | {{LEAD_AGENT}} | Weekly | 1–2h |
| SOP-003 | New Lead Qualification | {{LEAD_AGENT}} | Per lead | 15–30 min |
| SOP-004 | Creative Brief → Designer | {{LEAD_AGENT}} | Per campaign | 1h |
| SOP-005 | Monthly Report Delivery | {{LEAD_AGENT}} | Monthly | 2–3h |
| SOP-006 | New Client Onboarding | {{LEAD_AGENT}} | Per client | 4–8h |
| SOP-007 | Repository Update | {{LEAD_AGENT}} | On business change | 30–60 min |
| SOP-008 | Tracking Audit | {{LEAD_AGENT}} | Monthly | 1–2h |

---

## SOP-001: New Campaign Launch

**Trigger:** Campaign approved and ready to execute
**Owner:** {{LEAD_AGENT}}
**Inputs:** Approved `CAMPAIGN.md`, approved creative assets, configured tracking

```
PRE-LAUNCH (T-48h to T-24h):
□ CAMPAIGN.md created in Campaigns_Assets/08_CAMPAIGNS/ACTIVE/ using _CAMPAIGN-TEMPLATE.md
□ All MIR files referenced in brief are current (check last_updated dates)
□ Landing page built in Vibe code environment
□ Landing page tested on mobile + desktop
□ Form submission tested — fires PostHog event + triggers WF-001
□ Meta CAPI receiving test Lead events in Events Manager
□ CRM creates record on test submission
□ Confirmation email sends to test address
□ n8n/Make WF-001 full end-to-end test logged
□ UTM parameters verified in PostHog session recording
□ Ad creatives uploaded to platform — reviewed and approved
□ Audience segments configured per AUDIENCES.md
□ Budget caps set — daily + lifetime
□ Campaign naming follows convention in PAID-MEDIA.md
□ STATE.md updated — campaign status: ACTIVE

LAUNCH DAY (T+0):
□ Set campaigns to Active in all platforms
□ Monitor 2h post-launch: spend pacing, any pixel errors
□ Monitor 6h post-launch: first leads arriving in CRM?
□ Monitor 24h post-launch: initial CPL vs. target, PostHog funnel loading

POST-LAUNCH (T+3d):
□ First optimization review (see SOP-002)
□ Client notification of launch (if applicable)
```

---

## SOP-002: Weekly Campaign Review

**Trigger:** Every [day of week] — recurring
**Owner:** {{LEAD_AGENT}}
**Inputs:** PostHog dashboard, CRM lead list, Platform ad data

```
DATA COLLECTION (30 min):
□ PostHog: Pull lead_submitted event count for the week
□ PostHog: Pull funnel conversion rates (all 4 steps)
□ CRM: Pull leads received this week + qualification status
□ Platform: Pull spend, clicks, impressions (signal only)
□ Calculate: CPL (PostHog leads ÷ platform spend)
□ Compare CPL to target from KPI-FRAMEWORK.md

CREATIVE REVIEW (20 min):
□ Identify top 3 and bottom 3 ads by CPL (PostHog-attributed)
□ Check CTR trend vs. previous week — frequency creep?
□ Flag creatives approaching creative fatigue threshold (CTR -30% vs. peak)

OPTIMIZATION ACTIONS (20 min):
□ Apply budget rules from KPI-FRAMEWORK.md §6
□ Pause or reallocate budget from bottom performers
□ Log all actions in CAMPAIGN.md §7 Optimization Log

DOCUMENTATION (15 min):
□ Write weekly report per REPORTING-CADENCE.md format
□ File in Core_Strategy/09_ANALYTICS/REPORTS/
□ Deliver to client per agreed channel
□ Update STATE.md if any campaign status changed
```

---

## SOP-003: New Lead Qualification

**Trigger:** New lead arrives in CRM (notified via WF-001)
**Owner:** {{LEAD_AGENT}}
**Inputs:** CRM lead record, initial lead score from WF-001

```
QUALIFICATION (15 min):
□ Review lead source: utm_source, utm_campaign, utm_content
□ Review initial lead score from WF-001
□ Check: Does email/company match ICP-1 or ICP-2 from AUDIENCES.md?
□ Check: Is there prior engagement? (Email opens, page revisits in PostHog)

SCORING:
□ ICP match (company size, industry): +20 / +10 / 0
□ Lead source quality (paid-social > organic > unknown): +15 / +5 / 0
□ Engagement score from WF-001: [see AUTOMATION.md WF-001 Step 7]
□ Prior engagement (email clicks, page revisits): +10

ROUTING:
□ Total score ≥ 40: Priority outreach within 2h
□ Total score 20–39: Standard outreach within 24h
□ Total score < 20: Nurture sequence only, no immediate outreach
□ Update CRM stage and lead score
□ Update PostHog person property: lead_qualified = true/false
```

---

## SOP-004: Creative Brief → Designer

**Trigger:** New campaign or creative refresh required
**Owner:** {{LEAD_AGENT}} → Designer

```
ESTEBAN PREPARES (30 min):
□ CAMPAIGN.md §4 Creative Brief section complete
□ Pull visual parameters from BRAND-IDENTITY.md:
  - Color HEX values for this brief
  - Font specifications
  - Logo variant to use
  - Asset dimensions per format table
□ Pull tone/copy direction from VOICE-TONE.md
□ Pull visual style direction from VISUAL-GUIDELINES.md §2-4
□ Write structural brief (see format below)
□ No copywriting in the brief — structural specs only

BRIEF FORMAT:
---
Campaign: [Campaign ID]
Asset 1: [Format] — [Dimensions] — [File format] — [Quantity]
  Visual zone: [What goes in each third/zone of the layout]
  Color scheme: [HEX values from BRAND-IDENTITY.md]
  Typography: [Font name + weight + size for each text zone]
  Logo: [Variant + placement + minimum size]
  Imagery direction: [See VISUAL-GUIDELINES.md §2 — [specific notes]]
  Text overlay: [YES/NO — if YES, specify text zone only, copy TBD]
  Prohibited: [Any specific visual no-gos]
  Delivery: [Date] | File format: [PNG/SVG/MP4] | At [2x / 1x]
---

DESIGNER EXECUTES:
□ Uses only BRAND-IDENTITY.md approved colors + fonts
□ Delivers files named per convention: [campaign_id]-[format]-[variant]-v1.[ext]
□ Delivers to shared folder: [location]

ESTEBAN REVIEWS:
□ Checks against VISUAL-GUIDELINES.md Asset Approval Checklist
□ Approves or requests revision
□ Approved assets uploaded to platform
```

---

## SOP-005: Monthly Report Delivery

**Trigger:** End of calendar month
**Owner:** {{LEAD_AGENT}}
**Due:** By [day] of the following month

```
DATA PULL (45 min):
□ PostHog: Monthly funnel report — all 4 steps + conversion rates
□ PostHog: Lead volume by source (utm_source breakdown)
□ PostHog: Session recordings of drop-off points
□ CRM: Leads qualified, calls booked, deals closed this month
□ Platform: Spend by campaign, ad set, creative (signal only)
□ Calculate all KPIs per KPI-FRAMEWORK.md §3

REPORT WRITING (60 min):
□ Use template from REPORTING-CADENCE.md §1 Monthly Report
□ Executive summary first — 3–5 sentences
□ KPI scorecard table with vs. target column
□ Include PostHog screenshots where applicable
□ Recommendations written as numbered action items

DELIVERY (15 min):
□ File saved as: Core_Strategy/09_ANALYTICS/REPORTS/[campaign_id]-monthly-[YYYY-MM].md
□ Delivered per client preference in REPORTING-CADENCE.md §2
□ CHANGELOG.md updated: "Monthly report [YYYY-MM] delivered"
```

---

## SOP-006: New Client Onboarding (MIR Setup)

**Trigger:** New client signed
**Owner:** {{LEAD_AGENT}}

```
DAY 1 — REPOSITORY SETUP:
□ Clone MIR template from get-shit-done repo
□ Rename to P[N]-[client-slug]
□ Initialize git repository
□ Fill Core_Strategy/00_META/PROJECT.md — all sections
□ Update STATE.md — project_phase: ONBOARDING

WEEK 1 — DISCOVERY:
□ Client intake session (1–2h call)
□ Fill Core_Strategy/01_COMPANY/PROFILE.md
□ Fill Core_Strategy/01_COMPANY/TEAM.md
□ Fill Core_Strategy/02_BRAND/ — collect all brand assets
□ Fill Market_Audiences/03_MARKET/AUDIENCES.md — use intake data + any existing research
□ Fill Products/04_PRODUCTS/CATALOG.md + PRICING.md

WEEK 2 — INFRASTRUCTURE AUDIT:
□ Audit existing ad accounts — fill Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md
□ Audit existing tracking — fill Core_Strategy/06_TECH-STACK/TRACKING.md
□ Document existing automation — fill Core_Strategy/06_TECH-STACK/AUTOMATION.md
□ Fill Core_Strategy/06_TECH-STACK/INFRASTRUCTURE.md
□ Update STATE.md — check Gate 1 and Gate 2 status

WEEK 2–3 — STRATEGY:
□ Complete Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md
□ Complete Market_Audiences/03_MARKET/POSITIONING.md
□ Complete Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md — set targets
□ First campaign planning begins (mGSD Protocol Phase 1)

GATE CHECK:
□ All Gate 1 files = complete or verified → can proceed to campaigns
□ All Gate 2 files = complete or verified → can proceed to paid campaigns
□ STATE.md updated: project_phase: ACTIVE
```

---

## SOP-007: Repository Update (Business Change)

**Trigger:** Any business change that affects marketing (new product, price change, brand update, etc.)
**Owner:** {{LEAD_AGENT}}

```
□ Identify which MIR file(s) are affected
□ Update the relevant file(s) with new information
□ Update last_updated field in the changed file
□ Update status field if appropriate
□ Log change in Core_Strategy/00_META/CHANGELOG.md with agent_impact note
□ Update STATE.md
□ If change affects active campaigns: review CAMPAIGN.md files for conflicts
□ If change affects tracking: run SOP-008
□ Brief any active AI agents on the change in next session
```

---

## SOP-008: Monthly Tracking Audit

**Trigger:** First week of each month
**Owner:** {{LEAD_AGENT}}

```
□ PostHog: Verify all core events firing (check Live Events)
□ PostHog: Verify `lead_submitted` has all required properties
□ PostHog: Check for any events with missing UTM properties
□ Meta Events Manager: Verify CAPI events receiving data
□ Meta Events Manager: Check event match quality score — target ≥ 7.0
□ Meta Events Manager: Verify deduplication — browser vs. CAPI overlap
□ Calculate discrepancy: (PostHog leads - Meta CAPI leads) / PostHog leads
  - < 15%: Green
  - 15–30%: Review and document
  - > 30%: Escalate, block optimization decisions
□ n8n/Make: Check workflow error logs for the month
□ Document findings in Core_Strategy/00_META/CHANGELOG.md
□ Update Core_Strategy/06_TECH-STACK/TRACKING.md if any changes made
```
