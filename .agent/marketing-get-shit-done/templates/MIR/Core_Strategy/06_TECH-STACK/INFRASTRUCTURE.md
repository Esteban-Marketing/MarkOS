# INFRASTRUCTURE.md — Complete Platform & Tools Registry

```
file_purpose  : Master index of every platform and tool used by this project.
                Access management reference. Prevents tool sprawl and ensures
                agents know what is available.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — if a tool is not listed here, it is not authorized
```

> ⚠️ Store credentials in a secrets manager. This file records platform names, IDs, and access levels only — not passwords, tokens, or API keys.

---

## 1. Core Mandatory Stack

> These tools are non-negotiable. Do not propose alternatives.

| Tool | Role | Account Owner | Status | Account ID |
|------|------|--------------|--------|-----------|
| PostHog | Analytics / Source of Truth | [Name] | [ACTIVE / NOT_CONFIGURED] | [Project ID] |
| Meta CAPI | Attribution | [Name] | [ACTIVE / NOT_CONFIGURED] | [Dataset ID] |
| n8n | Automation / Middleware | [Name] | [ACTIVE / NOT_CONFIGURED] | [Instance URL] |
| Make (Integromat) | Automation / Middleware | [Name] | [ACTIVE / NOT_CONFIGURED] | [Team ID] |
| Vibe Code | Web Execution | [Name] | [ACTIVE / NOT_CONFIGURED] | [Account ID] |

---

## 2. Ad Platforms

| Platform | Account ID | Account Name | Status | Monthly Budget |
|----------|-----------|-------------|--------|---------------|
| Meta Ads Manager | [ID] | [Name] | [ACTIVE / INACTIVE] | [$] |
| Google Ads | [ID] | [Name] | [ACTIVE / INACTIVE] | [$] |
| TikTok Ads | [ID] | [Name] | [ACTIVE / INACTIVE] | [$] |
| X Ads | [ID] | [Name] | [ACTIVE / INACTIVE] | [$] |

---

## 3. CRM

```yaml
crm_platform    : "[e.g. HubSpot | Pipedrive | GoHighLevel | Notion CRM | Other]"
account_id      : "[FILL]"
account_owner   : "[FILL]"
status          : "[ACTIVE | NOT_CONFIGURED]"
url             : "[FILL]"
```

**CRM pipeline stages:**
| Stage | Definition | Exit Trigger |
|-------|-----------|-------------|
| [Stage 1] | [FILL] | [FILL] |
| [Stage 2] | [FILL] | [FILL] |
| [Stage 3] | [FILL] | [FILL] |

---

## 4. Email Service Provider

```yaml
esp_platform    : "[FILL]"
account_id      : "[FILL]"
sending_domain  : "[FILL]"
status          : "[ACTIVE | NOT_CONFIGURED]"
```

---

## 5. Web & Hosting

```yaml
web_builder         : "Vibe code environments"
hosting_provider    : "[FILL]"
cdn                 : "[FILL or NONE]"
domain_registrar    : "[FILL]"
ssl_provider        : "[FILL]"
```

---

## 6. Design & Asset Tools

| Tool | Purpose | License | Account |
|------|---------|---------|---------|
| [e.g. Figma] | UI Design | [Team / Personal] | [FILL] |
| [e.g. Canva] | Quick assets | [Pro / Free] | [FILL] |
| [Other] | [Purpose] | [FILL] | [FILL] |

---

## 7. Project Management & Collaboration

| Tool | Purpose | Status | URL |
|------|---------|--------|-----|
| [e.g. Notion] | Documentation, task tracking | [ACTIVE] | [URL] |
| [e.g. Slack] | Team communication | [ACTIVE] | [URL] |
| [Other] | [Purpose] | [FILL] | [FILL] |

---

## 8. Access & Permission Matrix

| Tool | {{LEAD_AGENT}} | Designer | Client | Agency (read-only) |
|------|---------|---------|--------|-------------------|
| PostHog | Admin | None | [View / None] | None |
| Meta Ads | Admin | None | [Admin / Analyst] | None |
| Google Ads | Admin | None | [Admin / Analyst] | None |
| CRM | Admin | None | [View / None] | None |
| n8n | Admin | None | None | None |
| Vibe Code | Admin | View | None | None |

---

## 9. Tools NOT Authorized for This Project

> Explicitly listing prohibited tools prevents agents from suggesting them.

| Tool | Why Prohibited |
|------|---------------|
| Google Analytics 4 (as primary source) | PostHog is source of truth. GA4 may be installed as signal but never used for decisions. |
| [Other tool] | [Reason] |
