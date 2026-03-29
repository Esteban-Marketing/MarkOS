# TRACKING.md — PostHog Event Schema, Pixels & Attribution Config

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This document is the source of truth for all data collection. `mgsd-analyst` MUST verify that events firing in PostHog match the the `Event Name` and `Required Properties` defined here. If a discrepancy > 15% is detected (Section 9), the agent MUST halt automated budget optimizations.


```
file_purpose  : Complete specification of the tracking implementation:
                PostHog event schema, property standards, pixel config,
                and CAPI event mapping. This file governs all analytics
                implementation work.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — all tracking implementation derives from this file
```

---

## 1. PostHog Configuration

```yaml
posthog_project_id    : "[FILL]"
posthog_api_key       : "[STORED IN SECRETS MANAGER — reference key name: POSTHOG_API_KEY]"
posthog_host          : "[https://app.posthog.com or self-hosted URL]"
sdk_version           : "[e.g. posthog-js ^1.90.0]"
session_recording     : "[ENABLED | DISABLED]"
feature_flags_active  : "[YES | NO]"
```

---

## 2. PostHog Event Schema

> **Naming convention:** `object_action` — all lowercase, underscore-separated.
> Example: `lead_submitted`, `pricing_page_viewed`, `email_link_clicked`

### Core Events (Required for All Projects)

| Event Name | Trigger | Required Properties | Optional Properties |
|-----------|---------|--------------------|--------------------|
| `page_viewed` | Every page load | `$current_url`, `$pathname`, `$referrer` | `page_title`, `funnel_stage` |
| `session_started` | New session | `$device_type`, `$browser`, `$os` | `utm_source`, `utm_medium`, `utm_campaign` |
| `cta_clicked` | Any CTA button | `cta_text`, `cta_location`, `page_path` | `campaign_id`, `offer_id` |
| `form_started` | First form field interaction | `form_id`, `form_name`, `page_path` | `campaign_id` |
| `lead_submitted` | Form submission success | `form_id`, `page_path`, `offer_id` | `campaign_id`, `ad_id`, `lead_score` |
| `thank_you_page_viewed` | Post-submission confirmation page | `form_id`, `offer_id` | `campaign_id` |
| `email_link_clicked` | Email CTA click | `email_sequence_id`, `email_step`, `link_url` | `campaign_id` |
| `pricing_page_viewed` | Pricing page load | `page_path` | `referral_source`, `session_depth` |
| `case_study_viewed` | Case study page load | `case_study_id`, `case_study_name` | `referral_source` |

### Business-Specific Events (Add Per Project)

| Event Name | Trigger | Required Properties | Optional Properties |
|-----------|---------|--------------------|--------------------|
| [FILL] | [FILL] | [FILL] | [FILL] |

---

## 3. Standard Property Definitions

> All events that include these properties must use these exact names and value formats.

```yaml
utm_source:
  type: string
  values: [meta, google, tiktok, x-ads, email, organic-instagram, organic-linkedin, direct, referral]

utm_medium:
  type: string
  values: [paid-social, paid-search, email, organic, direct]

campaign_id:
  type: string
  format: "[client-slug]-[initiative]-[YYMM]"

ad_id:
  type: string
  format: "[campaign_id]-[adset_id]-[ad_variant]-v[N]"

offer_id:
  type: string
  format: "OFR-[NNN]"  # References OFFERS.md

form_id:
  type: string
  format: "[page-slug]-form-[N]"

icp_segment:
  type: string
  values: [ICP-1, ICP-2, UNKNOWN]

funnel_stage:
  type: string
  values: [unaware, aware, evaluating, decision, customer]

device_type:
  type: string
  values: [mobile, tablet, desktop]
```

---

## 4. Person Properties (PostHog Identify)

> Call `posthog.identify()` when a lead is captured.

```javascript
// Required properties on identify:
{
  email: "[hashed or raw depending on config]",
  icp_segment: "[ICP-1 | ICP-2 | UNKNOWN]",
  lead_source: "[utm_source value]",
  lead_campaign: "[campaign_id]",
  lead_offer: "[offer_id]",
  created_at: "[ISO 8601 timestamp]"
}

// Optional enrichment properties:
{
  company_name: "[FILL]",
  phone: "[hashed]",
  crm_id: "[CRM record ID for cross-system tracking]"
}
```

---

## 5. Cohorts & Feature Flags

**Active cohorts:**

| Cohort Name | Definition | Used For |
|------------|-----------|---------|
| [FILL] | [FILL] | [FILL] |

**Active feature flags:**

| Flag Name | State | Condition | Purpose |
|-----------|-------|-----------|---------|
| [FILL] | [ON / OFF] | [FILL] | [FILL] |

---

## 6. Funnel Configuration in PostHog

**Primary conversion funnel:**

```
Step 1: page_viewed (landing page URL)
Step 2: form_started
Step 3: lead_submitted
Step 4: thank_you_page_viewed
```

**Conversion window:** [e.g. 30 days]

---

## 7. Meta CAPI Event Mapping

> Maps PostHog events to their corresponding Meta CAPI events.

| PostHog Event | Meta CAPI Event | Priority | Fired By |
|--------------|----------------|---------|---------|
| `page_viewed` | `PageView` | HIGH | Browser pixel |
| `pricing_page_viewed` | `ViewContent` | HIGH | n8n webhook → CAPI |
| `lead_submitted` | `Lead` | REQUIRED | n8n webhook → CAPI |
| `purchase_completed` | `Purchase` | REQUIRED | n8n webhook → CAPI |

**Meta CAPI endpoint:**
```
POST https://graph.facebook.com/v18.0/[DATASET_ID]/events
```

---

## 8. Tracking Validation Checklist

Before any campaign goes live:

- [ ] PostHog SDK installed and firing `page_viewed` on all Vibe code pages
- [ ] `lead_submitted` event firing with all required properties
- [ ] Meta CAPI `Lead` event receiving test events in Events Manager
- [ ] Event deduplication verified (event_id present in both browser and CAPI)
- [ ] PostHog funnel showing all 4 steps
- [ ] UTM parameters captured in PostHog session
- [ ] n8n/Make webhook tested end-to-end
- [ ] CRM record created on test lead submission
- [ ] Thank you page loads and fires `thank_you_page_viewed`
- [ ] Discrepancy between PostHog and Meta within 15% threshold

---

## 9. Tracking Discrepancy Protocol

```yaml
acceptable_discrepancy_pct  : 15
alert_threshold_pct         : 20
escalation_threshold_pct    : 30
```

**If discrepancy > 15%:**
1. Check PostHog event logs for the campaign period
2. Check Meta Events Manager for CAPI event status
3. Verify n8n/Make workflow is not throwing errors
4. Compare by day — identify when discrepancy started
5. If unresolved in 24h, escalate to {{LEAD_AGENT}}

**If discrepancy > 30%:**
1. Pause optimization decisions immediately
2. Do not adjust budgets based on platform data
3. {{LEAD_AGENT}} reviews within 4 hours
