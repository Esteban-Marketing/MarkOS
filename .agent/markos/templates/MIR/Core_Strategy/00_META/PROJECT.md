# PROJECT.md — Project Identity & Constraints

<!-- markos-token: MIR -->

```
file_purpose  : Define the identity of this project instance, its stakeholders,
                operational constraints, and relationship to the agency.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — this file defines what this repository is
```

---

## 1. Project Identity

```yaml
project_id          : P[N]                          # e.g. P0, P1, P7
project_name        : "[Full Business Name]"
client_slug         : "[kebab-case-slug]"            # e.g. acme-corp
repo_name           : "P[N]-[client-slug]"           # e.g. P3-acme-corp
project_type        : "[AGENCY_SELF | CLIENT_RETAINER | CLIENT_PROJECT | INTERNAL]"
start_date          : YYYY-MM-DD
target_end_date     : YYYY-MM-DD                     # or ONGOING
current_phase       : "[ONBOARDING | STRATEGY | EXECUTION | REPORTING | CLOSED]"
```

---

## 2. Project Description

**What this project is:**
<!-- 3–5 sentences. What is the business? What are we doing for them? What does success look like? -->
[FILL]

**What this project is NOT:**
<!-- Scope exclusions — what is explicitly outside this engagement -->
[FILL]

---

## 3. Stakeholders

### Client Side

| Name | Role | Decision Authority | Contact |
|------|------|--------------------|---------|
| [Name] | [Title] | [ALL / CONTENT / BUDGET / NONE] | [email or @handle] |
| [Name] | [Title] | [ALL / CONTENT / BUDGET / NONE] | [email or @handle] |

**Primary decision-maker:** [Name] — [what they approve]
**Day-to-day contact:** [Name] — [preferred contact method and hours]

### Agency Side (esteban.marketing)

| Name | Role | Responsibility |
|------|------|----------------|
| {{LEAD_AGENT}} Ortiz | Lead | Technical architecture, strategy, client relationship |
| [Designer Name] | Junior/Mid Designer | Visual assets per creative briefs |

---

## 4. Engagement Scope

**Services in scope:**
- [ ] Paid Media Management (Meta, Google, X, TikTok)
- [ ] Funnel Architecture (Vibe code pages)
- [ ] Tracking Implementation (PostHog + Meta CAPI)
- [ ] Automation Setup (n8n / Make)
- [ ] Content Strategy
- [ ] Organic Social Management
- [ ] Email Marketing
- [ ] SEO
- [ ] Brand Identity
- [ ] Analytics & Reporting
- [ ] Other: [specify]

**Platforms explicitly in scope:**
<!-- List only what is active for this project -->
[FILL]

**Platforms explicitly OUT of scope:**
[FILL]

---

## 5. Operational Constraints

**Budget constraints:**
```yaml
monthly_ad_spend_budget  : "[USD amount or UNKNOWN]"
agency_retainer_fee      : "[USD amount or UNKNOWN]"
budget_approval_required : "[YES — by whom | NO]"
```

**Compliance and legal constraints:**
<!-- Any regulatory, industry, or platform restrictions that apply -->
[FILL — e.g. "No health claims allowed. HIPAA-adjacent industry. No targeting under 18."]

**Brand constraints (hard rules):**
<!-- Non-negotiable brand rules that override any creative or strategic suggestion -->
[FILL — e.g. "Never use competitor names directly. Always include pricing. Founder must approve all public-facing copy."]

**Technology constraints:**
<!-- Locked platforms, mandatory tools, prohibited tools -->
```yaml
mandatory_tools       : [PostHog, Meta CAPI, n8n or Make, Vibe code environments]
prohibited_tools      : []                       # e.g. Wix, Squarespace, GA4 as primary
client_existing_tools : []                       # tools client already owns and must integrate
```

---

## 6. Reporting & Communication

```yaml
reporting_cadence       : "[WEEKLY | BIWEEKLY | MONTHLY]"
report_format           : "[MARKDOWN | PDF | SLIDES]"
delivery_channel        : "[Email | Slack | WhatsApp | Drive link]"
review_meeting_cadence  : "[WEEKLY | BIWEEKLY | MONTHLY | NONE]"
```

---

## 7. Success Definition

**What does a successful engagement look like?**
<!-- Be concrete. What metrics, what outcomes, what timeframe? -->
[FILL]

**Primary KPI:**
[FILL — e.g. "Cost per qualified lead under $12 within 90 days"]

**Secondary KPIs:**
[FILL]

---

## 8. Project History & Context

**Why this project started:**
[FILL — What problem or opportunity triggered this engagement?]

**What was tried before:**
[FILL — Previous agencies, campaigns, or strategies. What worked. What didn't.]

**Known risks:**
[FILL — technical debt, brand reputation issues, market challenges, etc.]

---

## 9. AI Agent Instructions Specific to This Project

> These supplement the rules in `Core_Strategy/00_META/AGENTS.md` and are specific to this project.

- [Add any project-specific rules for AI agents here]
- Example: "Do not suggest influencer marketing — client has had a bad experience."
- Example: "All copy drafts must be reviewed by the client before any implementation."
- Example: "This is a Spanish-language-first market. Default to Spanish unless instructed otherwise."

[FILL or write "No project-specific agent rules at this time."]
