# EMAIL.md — Email Marketing Infrastructure & Strategy

<!-- markos-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MIR/Campaigns_Assets/05_CHANNELS/EMAIL.md to customize it safely.


```
file_purpose  : Define the email marketing setup: ESP, lists, active sequences,
                and performance benchmarks.
status        : empty
last_updated  : YYYY-MM-DD
```

---

## 1. Infrastructure

```yaml
esp_platform      : "[e.g. Klaviyo | Mailchimp | ActiveCampaign | Brevo | ConvertKit]"
esp_account_id    : "[FILL]"
sending_domain    : "[e.g. mail.domain.com]"
from_name         : "[FILL]"
from_email        : "[FILL]"
reply_to          : "[FILL]"
dkim_configured   : "[YES | NO]"
spf_configured    : "[YES | NO]"
dmarc_configured  : "[YES | NO]"
```

---

## 2. List Structure

| List / Segment Name | Size | Source | Tags | Purpose |
|--------------------|------|--------|------|---------|
| [Main list] | [#] | [Opt-in source] | [Tags] | [FILL] |
| [Segment name] | [#] | [Source] | [Tags] | [FILL] |

---

## 3. Active Sequences

| Sequence Name | Trigger | Emails | Goal | Status |
|--------------|---------|--------|------|--------|
| [Name] | [e.g. New subscriber] | [#] | [FILL] | [ACTIVE / PAUSED / DRAFT] |

---

## 4. Performance Benchmarks

```yaml
industry_open_rate_benchmark    : "[e.g. 22%]"
current_avg_open_rate           : "[FILL]"
industry_ctr_benchmark          : "[e.g. 2.5%]"
current_avg_ctr                 : "[FILL]"
unsubscribe_rate_alert_threshold: "[e.g. >0.5% = review content]"
```

---

## 5. n8n/Make Integration

```yaml
crm_sync_workflow     : "[YES — workflow ID: [ID] | NOT_CONFIGURED]"
posthog_event_trigger : "[YES — fires 'email_opened', 'email_clicked' | NO]"
```
