# TEAM.md — Key People, Roles & Decision Authority

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/01_COMPANY/TEAM.md to customize it safely.


```
file_purpose  : Document who the key people are on both the client and agency side,
                their decision authority, and how they prefer to communicate.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES for stakeholder and approval routing
```

---

## 1. Client Team

> Document all client-side stakeholders who participate in or influence marketing decisions.

### [Name]

```yaml
name              : "[Full Name]"
title             : "[Official Title]"
role_in_project   : "[PRIMARY_DECISION_MAKER | APPROVER | CONTRIBUTOR | OBSERVER]"
owns_decisions_on : "[What they have final say over — e.g. brand, budget, copy, tech]"
communication_pref: "[Email | WhatsApp | Slack | Calls only]"
response_sla      : "[Typical response time — e.g. 24h business days]"
timezone          : "[e.g. UTC-5 / Bogotá]"
contact           : "[Email or handle — store sensitive data securely]"
```

**Context notes:**
[What this person cares most about. What frustrates them. What they have strong opinions on.]

---

### [Add additional client team members using the same format]

---

## 2. Agency Team (esteban.marketing)

### {{LEAD_AGENT}} Ortiz

```yaml
name              : "{{LEAD_AGENT}} Ortiz"
role              : "Lead — Technical Architecture, Strategy, Client Relationship"
decision_authority: "[ALL]"
owns              : "[Final approval on all specs, strategies, and technical decisions]"
communication_pref: "[Define per project]"
timezone          : "UTC-5 / Colombia"
```

### [Designer Name]

```yaml
name              : "[Full Name]"
role              : "Junior/Mid Graphic Designer"
decision_authority: "[NONE — executes on briefs only]"
receives          : "Structural creative briefs from Architect. Executes visual assets."
file_formats      : "[What formats they deliver — e.g. PNG, SVG, PDF, Figma links]"
turnaround        : "[Typical asset delivery time]"
contact           : "[Handle or email]"
```

---

## 3. Decision Authority Matrix

| Decision Type | Who Decides | Who Must Be Informed | Turnaround |
|--------------|-------------|---------------------|------------|
| Campaign strategy | {{LEAD_AGENT}} | Client primary contact | — |
| Ad copy approval | [Client name] | {{LEAD_AGENT}} | [X business days] |
| Budget change >10% | [Client name] | {{LEAD_AGENT}} | [X business days] |
| Budget change ≤10% | {{LEAD_AGENT}} | [Client name] | — |
| New creative concept | {{LEAD_AGENT}} → Client | — | [X business days] |
| Technical stack change | {{LEAD_AGENT}} | Client primary contact | — |
| Brand guideline exception | [Client name] | {{LEAD_AGENT}} | [X business days] |
| Campaign pause | {{LEAD_AGENT}} | [Client name] | Immediate |
| New platform test | {{LEAD_AGENT}} + Client approval | — | [X business days] |

---

## 4. Vendor & Platform Contacts

| Platform / Vendor | Account Manager | Contact | Escalation Path |
|-------------------|----------------|---------|----------------|
| Meta Business | — | [support URL] | [FILL] |
| Google Ads | — | [support URL] | [FILL] |
| PostHog | — | [support URL] | [FILL] |
| n8n | — | [support URL] | [FILL] |
| [Other vendor] | [Name] | [contact] | [FILL] |
