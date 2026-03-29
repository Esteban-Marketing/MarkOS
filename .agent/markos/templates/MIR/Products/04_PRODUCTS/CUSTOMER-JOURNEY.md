# CUSTOMER-JOURNEY.md — Awareness to Retention Map
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Products/04_PRODUCTS/CUSTOMER-JOURNEY.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This journey is the blueprint for all automation and content sequencing. `mgsd-executor` MUST verify that any new `n8n/Make` trigger (Section 2) aligns with the defined `Stage Transition` before deployment. `mgsd-content-creator` MUST ensure all messaging maps to the specific psychological state of the customer's current stage.

**Dependencies:** MARKET-AUDIENCES (`../../Market_Audiences/03_MARKET/`), CORE-STRATEGY (`../../Core_Strategy/01_STRATEGY/`), KPI-FRAMEWORK (`../../Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`)
**Assigned Agent:** `mgsd-product-manager`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : Map the complete path a customer travels from first awareness
                to loyal client. Governs funnel architecture, content strategy,
                and automation logic.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES for funnel and automation design decisions
```

---

## 1. Journey Overview

**Number of journey stages for this business:**
[FILL — e.g. 5: Unaware → Aware → Evaluating → Purchasing → Retained]

**Average time from first touchpoint to first purchase:**
[FILL — e.g. "14–45 days for cold traffic. <7 days for warm/referral."]

**Primary conversion event:**
[FILL — e.g. "Discovery call booked" / "Lead form submitted" / "Checkout completed"]

---

## 2. Stage-by-Stage Map

---

### Stage 1: UNAWARE

**Customer state:**
[FILL — what do they think, feel, and do before they know this business exists?]

**What triggers movement to the next stage:**
[FILL — what shifts their awareness?]

**Primary marketing objective at this stage:**
[FILL — e.g. "Interrupt the scroll with a problem-framed message."]

**Channels that reach them here:**
[FILL — e.g. Meta cold traffic, TikTok, organic content, Google broad match]

**PostHog event to track entry into this stage:**
```yaml
event_name    : "[first_visit | ad_impression | organic_view]"
properties    : "[source, medium, campaign_id, content_id]"
```

---

### Stage 2: AWARE / PROBLEM-CONSCIOUS

**Customer state:**
[FILL — they know they have a problem. They're researching.]

**Content / touchpoints that serve them here:**
[FILL — e.g. Blog posts, YouTube explainers, comparison content, organic social]

**Primary marketing objective:**
[FILL — e.g. "Position brand as the knowledgeable guide. Capture email."]

**Lead capture mechanism:**
[FILL — e.g. "Free resource download. Email opt-in page built in Vibe code."]

**n8n/Make trigger at this stage:**
[FILL — e.g. "Email captured → push to CRM → tag as 'aware' → enter nurture sequence 1"]

**PostHog event:**
```yaml
event_name    : "[lead_captured | email_subscribed]"
properties    : "[source, offer_id, page_path, icp_segment]"
```

---

### Stage 3: EVALUATING / SOLUTION-CONSCIOUS

**Customer state:**
[FILL — they're comparing options. Considering this business vs. alternatives.]

**Touchpoints serving them here:**
[FILL — e.g. Case studies, testimonials, retargeting ads, webinar, free audit offer]

**Primary marketing objective:**
[FILL — e.g. "Demonstrate proof. Reduce perceived risk. Drive discovery call."]

**Retargeting triggers:**
```yaml
retarget_if     : "[Visited pricing page | Watched >50% of video | Opened 3+ emails]"
retarget_window : "[e.g. 30-day audience window]"
retarget_message: "[e.g. Case study or specific proof point]"
```

**Meta CAPI event to fire:**
```yaml
event_name      : "ViewContent"
parameters      : "[content_name: 'case_study', content_category: 'evaluation']"
```

**PostHog event:**
```yaml
event_name    : "[case_study_viewed | pricing_page_visited | demo_requested]"
properties    : "[page, time_on_page, referral_source]"
```

---

### Stage 4: PURCHASING / DECISION

**Customer state:**
[FILL — they've decided to buy or are very close. Removing friction is the job.]

**The conversion moment:**
[FILL — e.g. "Discovery call booked via Calendly embedded in Vibe code landing page."]

**Primary marketing objective:**
[FILL — e.g. "Remove friction. Confirm the decision. Create urgency if real."]

**Lead routing workflow:**
```
1. Lead submits form on Vibe page
2. n8n/Make captures webhook
3. CRM record created with all UTM parameters
4. Meta CAPI Lead event fires (server-side)
5. PostHog Lead cohort updated
6. Internal notification to {{LEAD_AGENT}}
7. Automated confirmation email to lead
8. Lead scoring initiated based on CRM data
```

**Meta CAPI event:**
```yaml
event_name      : "Lead"
required_params : "[email_hash, phone_hash, fbc, fbp, event_source_url, client_ip]"
```

**PostHog event:**
```yaml
event_name    : "lead_submitted"
properties    : "[form_id, page_path, campaign_id, ad_id, offer_id, icp_segment]"
```

---

### Stage 5: ONBOARDING

**Customer state:**
[FILL — they've bought. They need to feel the decision was right immediately.]

**Primary objective:**
[FILL — e.g. "Speed to first value. Set expectations. Establish communication cadence."]

**Automated touchpoints:**
[FILL — e.g. "Welcome email sequence (3 emails over 7 days). Onboarding questionnaire."]

**PostHog event:**
```yaml
event_name    : "client_onboarded"
properties    : "[product_id, contract_start_date, client_segment]"
```

---

### Stage 6: RETAINED / EXPANDING

**Customer state:**
[FILL — they're seeing results or are deep enough into the engagement to stay.]

**Primary objective:**
[FILL — e.g. "Deliver proof. Surface expansion opportunities. Generate referrals."]

**Retention triggers in automation:**
[FILL — e.g. "30-day milestone email. Monthly report delivery. Quarterly review invite."]

**Expansion signals:**
[FILL — e.g. "Client asks about services outside current scope → flag to {{LEAD_AGENT}} for upsell."]

---

## 3. Drop-Off Points & Recovery

| Stage | Common Drop-Off Reason | Recovery Mechanism |
|-------|----------------------|-------------------|
| Aware → Evaluating | [FILL] | [FILL] |
| Evaluating → Decision | [FILL] | [FILL] |
| Decision → Purchase | [FILL] | [FILL] |
| Purchase → Retained | [FILL] | [FILL] |

---

## 4. Journey KPIs

| Stage Transition | Metric | Target | Current |
|----------------|--------|--------|---------|
| Unaware → Aware | [e.g. CPL — cost per lead] | [FILL] | [FILL] |
| Aware → Evaluating | [e.g. Email open rate] | [FILL] | [FILL] |
| Evaluating → Decision | [e.g. Call booking rate] | [FILL] | [FILL] |
| Decision → Purchase | [e.g. Call-to-close rate] | [FILL] | [FILL] |
| Purchase → Retained | [e.g. 90-day retention rate] | [FILL] | [FILL] |

> Full KPI definitions in `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`.
