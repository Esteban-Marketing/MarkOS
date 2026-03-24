# INTEGRATIONS.md — System Connections & Data Flows

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Core_Strategy/06_TECH-STACK/INTEGRATIONS.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This document governs data integrity. `mgsd-analyst` MUST verify that the `System Map` flows (Section 1) match actual platform logs before reporting on performance.

> [!IMPORTANT]
> **AGENT LOGIC**: This document is critical for `mgsd-executor` to maintain system health. Any changes to `Workflow ID` (Section 2) or `Secret Key Name` (Section 3) MUST be reviewed by `{{LEAD_AGENT}}` before deployment.


```
file_purpose  : Map how all systems connect. Shows data flow direction,
                what triggers what, and where each system is authoritative.
status        : empty
last_updated  : YYYY-MM-DD
```

---

## 1. System Map

```
[Ad Platforms]         [Vibe Code Pages]
Meta / Google          Landing Page / Thank You
TikTok / X Ads              │
      │                     │ Webhook (form submit)
      │ UTM params           ▼
      └──────────────► [n8n / Make — WF-001]
                             │
                  ┌──────────┼──────────────────┐
                  ▼          ▼                  ▼
               [CRM]    [Meta CAPI]         [PostHog]
             Contact     Lead Event       Event + Identify
             Created        │                  │
                  │         │                  │
                  └──────────────────────► [Reporting]
                                           PostHog Dashboards
                                           (Source of Truth)
```

---

## 2. Integration Index

| Source System | Destination System | Trigger | Data Transferred | Workflow ID |
|--------------|------------------|---------|-----------------|------------|
| Vibe code form | n8n/Make | Form submit (webhook) | Lead data + UTM | WF-001 |
| n8n/Make | CRM | WF-001 Step 2 | Contact record | WF-001 |
| n8n/Make | Meta CAPI | WF-001 Step 3 | Lead event | WF-001 |
| n8n/Make | PostHog | WF-001 Step 4 | lead_submitted event | WF-001 |
| n8n/Make | ESP | WF-001 Step 6 | Trigger email | WF-001 |
| CRM | n8n/Make | Stage change | Stage + contact data | WF-002 |
| ESP | n8n/Make | Email event | Open/click data | WF-003 |

---

## 3. API Credentials Index

> Credentials stored in secrets manager. This table references key names only.

| System | Credential | Secret Key Name | Rotation Schedule |
|--------|-----------|----------------|------------------|
| Meta CAPI | Access Token | `META_CAPI_TOKEN` | [e.g. Annual] |
| PostHog | API Key | `POSTHOG_API_KEY` | [e.g. Annual] |
| CRM | API Key | `CRM_API_KEY` | [e.g. Annual] |
| ESP | API Key | `ESP_API_KEY` | [e.g. Annual] |
| n8n | Webhook Secret | `N8N_WEBHOOK_SECRET` | [e.g. Per deployment] |

---

## 4. Known Integration Limitations

| Integration | Limitation | Workaround |
|------------|-----------|-----------|
| [FILL] | [FILL] | [FILL] |
