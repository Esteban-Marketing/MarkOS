# PAID-MEDIA.md — Ad Accounts, Pixels, CAPI & Tracking Config

```
file_purpose  : Define the complete paid media infrastructure: account IDs,
                tracking setup, pixel configuration, and CAPI parameters.
                This file is mandatory reading for any tracking or campaign work.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — all paid media configuration derives from this file
```

> ⚠️ Do not store credentials, passwords, or API tokens here. Use a secrets manager. This file stores IDs and structural config only.

---

## 1. Meta (Facebook / Instagram)

```yaml
business_manager_id   : "[FILL]"
ad_account_id         : "[act_XXXXXXXXXX]"
ad_account_name       : "[FILL]"
pixel_id              : "[FILL]"
pixel_status          : "[ACTIVE | NOT_INSTALLED | DEGRADED]"
capi_status           : "[ACTIVE | CONFIGURED_NOT_LIVE | NOT_CONFIGURED]"
capi_access_token     : "[STORED IN SECRETS MANAGER — reference key name only]"
dataset_id            : "[FILL — same as pixel_id for most setups]"
instagram_account_id  : "[FILL]"
facebook_page_id      : "[FILL]"
```

**Active Meta events (browser + CAPI):**

| Event Name | Trigger | Browser | CAPI | Priority |
|-----------|---------|---------|------|---------|
| PageView | All page loads | YES | YES | REQUIRED |
| ViewContent | Key page visits | YES | YES | HIGH |
| Lead | Form submission | NO | YES | REQUIRED |
| Purchase | Transaction complete | NO | YES | REQUIRED |
| InitiateCheckout | Checkout start | YES | NO | MEDIUM |
| CompleteRegistration | Account created | NO | YES | HIGH |

**Meta CAPI mandatory parameters for Lead event:**
```json
{
  "event_name": "Lead",
  "event_time": "[UNIX timestamp]",
  "event_source_url": "[page URL where event occurred]",
  "action_source": "website",
  "user_data": {
    "em": "[SHA-256 hashed email]",
    "ph": "[SHA-256 hashed phone]",
    "fbc": "[Facebook click ID from _fbc cookie]",
    "fbp": "[Facebook browser ID from _fbp cookie]",
    "client_ip_address": "[visitor IP]",
    "client_user_agent": "[visitor user agent]"
  },
  "custom_data": {
    "currency": "[ISO currency code]",
    "value": "[estimated lead value]",
    "content_name": "[offer or product name]"
  }
}
```

**Event deduplication strategy:**
```yaml
dedup_method          : "[event_id — unique ID sent in both browser and CAPI]"
event_id_format       : "[e.g. lead-[form_id]-[timestamp]-[user_hash]]"
```

---

## 2. Google Ads

```yaml
google_ads_account_id : "[XXX-XXX-XXXX]"
manager_account_id    : "[MCC ID if applicable]"
conversion_tracking   : "[ACTIVE | NOT_CONFIGURED]"
gtag_id               : "[G-XXXXXXXXXX or AW-XXXXXXXXXX]"
google_analytics_id   : "[G-XXXXXXXXXX — NOTE: GA4 is signal only. PostHog is source of truth.]"
```

**Active Google conversion actions:**

| Conversion Name | Category | Counting | Value | Attribution Window |
|----------------|---------|---------|-------|------------------|
| [e.g. Discovery Call Booked] | Lead | One per click | [Value] | [30-day click / 1-day view] |
| [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |

---

## 3. Meta Ads Campaign Structure

**Current account structure:**

| Campaign Name | Objective | Daily Budget | Status |
|--------------|-----------|-------------|--------|
| [FILL] | [Lead gen / Sales / Awareness] | [$] | [ACTIVE / PAUSED] |

**Naming conventions:**
```yaml
campaign_naming : "[Client slug]-[Objective]-[Audience type]-[YYMM]"
adset_naming    : "[ICP segment]-[Placement]-[YYMM]"
ad_naming       : "[Creative type]-[Variant]-[YYMM]-v[N]"
```

---

## 4. X Ads (Twitter)

```yaml
x_ads_account_id    : "[FILL or NOT_ACTIVE]"
x_pixel_id          : "[FILL or N/A]"
status              : "[ACTIVE | NOT_ACTIVE]"
```

---

## 5. TikTok Ads

```yaml
tiktok_ads_account_id : "[FILL or NOT_ACTIVE]"
tiktok_pixel_id       : "[FILL or N/A]"
tiktok_events_api     : "[ACTIVE | NOT_CONFIGURED | NOT_ACTIVE]"
status                : "[ACTIVE | NOT_ACTIVE]"
```

---

## 6. Attribution Model

```yaml
primary_attribution   : "PostHog"
attribution_logic     : "Server-side event data via CAPI + PostHog session recording"
platform_data_role    : "signal_only"
max_acceptable_discrepancy_pct : 15
attribution_window    : "[e.g. 7-day click, 1-day view for Meta | Last click for Google]"
```

**Attribution hierarchy:**
```
1. PostHog event data (primary source of truth)
2. Meta CAPI (primary for Meta-attributed conversions)
3. Platform-reported data (signal only — do not use for optimization decisions)
```

---

## 7. UTM Parameter Standards

```yaml
utm_source_values:
  - meta
  - google
  - tiktok
  - x-ads
  - email
  - organic-instagram
  - organic-linkedin
  - direct
utm_medium_values:
  - paid-social
  - paid-search
  - email
  - organic
utm_campaign_format: "[client-slug]-[initiative]-[YYMM]"
utm_content_format:  "[asset-type]-[variant]-v[N]"
utm_term_format:     "[keyword or audience-segment]"
```
