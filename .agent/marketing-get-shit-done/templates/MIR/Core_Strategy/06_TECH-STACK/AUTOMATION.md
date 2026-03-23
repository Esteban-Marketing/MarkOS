# AUTOMATION.md — n8n / Make Workflow Specifications

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/06_TECH-STACK/AUTOMATION.md to customize it safely.


```
file_purpose  : Document all automation workflows: triggers, logic, data flows,
                and system connections. All lead routing and data sync passes
                through the middleware layer defined here.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — all automation architecture derives from this file
```

---

## 1. Middleware Configuration

```yaml
primary_middleware    : "[n8n | Make | BOTH]"
n8n_instance_url      : "[https://your-n8n-instance.com or CLOUD]"
n8n_version           : "[FILL]"
make_team_id          : "[FILL]"
make_region           : "[EU | US]"
webhook_base_url      : "[URL that accepts webhook payloads from Vibe code pages]"
```

---

## 2. Core Workflow: Lead Capture & Routing

**Workflow ID:** WF-001
**Name:** Lead Capture → CRM → CAPI → PostHog

**Trigger:** Webhook from Vibe code form submission

**Step-by-step logic:**

```
TRIGGER: POST /webhook/lead-capture
  Payload: {
    form_id, page_url, timestamp,
    email, phone (optional), name,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    fbclid (if present), gclid (if present),
    fbc (Meta cookie), fbp (Meta cookie),
    client_ip, user_agent
  }

STEP 1: VALIDATE
  - Check required fields: email, form_id, page_url
  - If missing required field → log error, send Slack/email alert to {{LEAD_AGENT}}
  - If valid → continue

STEP 2: CRM RECORD CREATION
  - Check if email already exists in CRM
  - If new lead: CREATE new contact record with all fields
  - If existing: UPDATE record, ADD to campaign, DO NOT overwrite original source
  - Tag: "lead-[campaign_id]", "source-[utm_source]", "form-[form_id]"
  - Set pipeline stage: "New Lead"

STEP 3: META CAPI — LEAD EVENT
  - Construct event payload (see TRACKING.md §7 for schema)
  - Hash email (SHA-256), hash phone (SHA-256) if present
  - Set event_id: "lead-[form_id]-[timestamp]-[email_hash_first8]"
  - POST to Meta Graph API /[DATASET_ID]/events
  - Log response: success or error code

STEP 4: POSTHOG COHORT UPDATE
  - Call PostHog /capture endpoint
  - Fire server-side "lead_submitted" event with all properties
  - Call PostHog /identify to link person properties

STEP 5: INTERNAL NOTIFICATION
  - Send notification to {{LEAD_AGENT}} (Slack / email / WhatsApp — configure per project)
  - Payload: lead name, email, source, campaign, timestamp, page URL

STEP 6: LEAD CONFIRMATION EMAIL
  - Trigger ESP confirmation email via [ESP platform API]
  - Template ID: [FILL]
  - Send from: [from_email in EMAIL.md]

STEP 7: LEAD SCORING (INITIAL)
  - Score = 0 (base)
  - +10 if utm_source = meta AND utm_medium = paid-social (high-intent paid)
  - +15 if page_url contains /pricing/ (pricing page visitor)
  - +20 if fbclid present (direct ad click)
  - +5 if email domain is corporate (not gmail/yahoo/hotmail)
  - Store score in CRM field: "initial_lead_score"

ERROR HANDLING:
  - Any step failure: log to error table
  - Steps 3–7 failures are non-blocking (lead still goes to CRM)
  - Step 2 failure: alert {{LEAD_AGENT}} immediately, retry 3x
```

**Error alert destination:** [Slack channel / email / FILL]
**Retry policy:** 3 retries with 5-minute intervals for CAPI calls

---

## 3. Workflow: CRM Stage Change → Notification

**Workflow ID:** WF-002
**Name:** CRM Stage Update → PostHog Event

**Trigger:** CRM webhook on contact stage change

```
TRIGGER: Contact stage changes in CRM

STEP 1: MAP CRM STAGE TO FUNNEL STAGE
  - "New Lead" → funnel_stage: "evaluating"
  - "Discovery Call Scheduled" → funnel_stage: "decision"
  - "Client Onboarded" → funnel_stage: "customer"
  - "Churned" → funnel_stage: "churned"

STEP 2: FIRE POSTHOG EVENT
  - event: "crm_stage_changed"
  - properties: { crm_id, new_stage, previous_stage, days_in_previous_stage }

STEP 3: META CAPI (conditional)
  - If new_stage = "customer" → fire Purchase event via CAPI
```

---

## 4. Workflow: Email Open/Click → CRM Tag

**Workflow ID:** WF-003
**Name:** ESP Engagement → CRM Enrichment

**Trigger:** ESP webhook on email event

```
TRIGGER: Email opened (3+ times) OR link clicked

STEP 1: UPDATE CRM CONTACT
  - Add tag: "email-engaged-[YYYY-MM]"
  - Update lead score: +5 per email open, +15 per link click

STEP 2: FIRE POSTHOG EVENT
  - event: "email_link_clicked" or "email_opened_threshold_reached"
  - Link to existing PostHog person by email

STEP 3: CHECK RE-TARGETING TRIGGER
  - If lead_score >= [threshold defined in AUDIENCES.md] AND stage = "New Lead"
  → Add to Meta Custom Audience: "High-Engagement-Leads"
```

---

## 5. Workflow Index

| Workflow ID | Name | Platform | Status | Trigger | Last Tested |
|------------|------|---------|--------|---------|------------|
| WF-001 | Lead Capture & Routing | [n8n / Make] | [ACTIVE / DRAFT] | Form webhook | [Date] |
| WF-002 | CRM Stage → PostHog | [n8n / Make] | [ACTIVE / DRAFT] | CRM webhook | [Date] |
| WF-003 | Email Engagement → CRM | [n8n / Make] | [ACTIVE / DRAFT] | ESP webhook | [Date] |
| WF-004 | [Name] | [FILL] | [FILL] | [FILL] | [Date] |

---

## 6. Data Mapping Reference

**UTM to CRM field mapping:**

| UTM Parameter | CRM Field Name | Notes |
|--------------|---------------|-------|
| utm_source | lead_source | |
| utm_medium | lead_medium | |
| utm_campaign | lead_campaign | |
| utm_content | lead_ad_content | |
| utm_term | lead_keyword | |
| fbclid | facebook_click_id | |
| gclid | google_click_id | |

---

## 7. Automation Testing Protocol

Before any workflow goes live:

- [ ] Test with real payload via Webhook.site or n8n test mode
- [ ] Verify CRM record created with all fields
- [ ] Verify CAPI event appears in Meta Events Manager test events
- [ ] Verify PostHog event appears in PostHog live events
- [ ] Verify notification delivered to {{LEAD_AGENT}}
- [ ] Verify confirmation email received by test address
- [ ] Run error scenario: missing required field — verify error logged
- [ ] Document test results in `Core_Strategy/00_META/CHANGELOG.md`
