# CONTACTS.md — Vendor, Platform & Stakeholder Directory

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Operations/10_OPERATIONS/CONTACTS.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This is the emergency routing table. AI agents must NOT attempt to contact external vendors or handles directly. In the event of a failure (Session 5), the agent must surface the relevant "Who to Contact" entry to {{LEAD_AGENT}}.


```
file_purpose  : Master directory of all contacts relevant to this project.
                Prevents time wasted searching for support channels.
status        : empty
last_updated  : YYYY-MM-DD
```

> ⚠️ Do not store passwords or sensitive credentials here. Phone numbers and emails are acceptable. API keys go in the secrets manager.

---

## 1. Internal — esteban.marketing

| Name | Role | Email | Phone | Timezone |
|------|------|-------|-------|---------|
| {{LEAD_AGENT}} Ortiz | Lead | [FILL] | [FILL] | UTC-5 Colombia |
| [Designer] | Junior/Mid Designer | [FILL] | [FILL] | [FILL] |

---

## 2. Client Contacts

| Name | Title | Email | Phone | Timezone | Authority |
|------|-------|-------|-------|---------|-----------|
| [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [PRIMARY_DECISION_MAKER] |

---

## 3. Platform Support

| Platform | Support URL | Account Manager | Emergency Contact |
|----------|-------------|----------------|------------------|
| Meta Business Suite | https://www.facebook.com/business/help | [Name or N/A] | [FILL] |
| Meta Ads | https://www.facebook.com/business/help/ads | — | [Account rep if applicable] |
| Google Ads | https://support.google.com/google-ads | [Name or N/A] | [FILL] |
| TikTok Ads | https://ads.tiktok.com/help/ | [Name or N/A] | [FILL] |
| X Ads | https://ads.twitter.com/help | — | [FILL] |
| PostHog | https://posthog.com/support | — | [Slack community] |
| n8n | https://community.n8n.io | — | [Community forum] |
| Make | https://community.make.com | — | [Help center] |
| Vibe Code | [Support URL] | [FILL] | [FILL] |

---

## 4. Vendors & Freelancers

| Name | Service | Contact | Rate | Status |
|------|---------|---------|------|--------|
| [FILL] | [e.g. Video editing] | [FILL] | [FILL] | [ACTIVE / INACTIVE] |

---

## 5. Emergency Contacts

| Scenario | Who to Contact | Method | SLA |
|----------|--------------|--------|-----|
| Ad account suspended | Meta Business Support + {{LEAD_AGENT}} | [FILL] | Same day |
| Landing page down | Vibe code support + {{LEAD_AGENT}} | [FILL] | Within 1h |
| n8n/Make workflow failure | {{LEAD_AGENT}} | [FILL] | Within 1h |
| Client complaint / escalation | {{LEAD_AGENT}} | [FILL] | Within 2h |
| Tracking complete failure | {{LEAD_AGENT}} | [FILL] | Within 1h |
| Legal / IP / defamation issue | {{LEAD_AGENT}} + Legal counsel | [FILL] | Immediate |

---

## 6. Useful URLs — Quick Reference

| Resource | URL |
|----------|-----|
| Meta Events Manager | https://www.facebook.com/events_manager |
| Meta Ad Library | https://www.facebook.com/ads/library |
| Google Ads Account | https://ads.google.com |
| Google Search Console | https://search.google.com/search-console |
| PostHog Dashboard | [Project URL] |
| n8n Instance | [Instance URL] |
| Make Dashboard | https://www.make.com |
| CRM | [URL] |
| Client Shared Drive | [URL] |
| MIR Repository | [Git repo URL] |
| get-shit-done Repo | [Git repo URL] |
