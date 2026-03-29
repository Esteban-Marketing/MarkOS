# Marketing Intelligence Repository (MIR)

<!-- markos-token: MIR -->
### Template v1.0 — maintained by esteban.marketing

> **The single source of truth for every business that markets online.**
> Solves context rot — the failure mode where humans and AI agents work from incomplete, scattered, or contradictory business information.

---

## What This Is

The **MIR** is a version-controlled, structured knowledge base. Every file serves a single, non-overlapping purpose. Together, they form a complete declaration of a business: who it is, what it sells, who it sells to, where it operates, and how its marketing infrastructure works.

Every campaign brief, ad creative spec, funnel build, PostHog event schema, and n8n workflow is derived from this repository — not from memory, not from scattered docs, not from Slack threads.

**This template is cloned for every new project.**

---

## Project Numbering

| ID | Description |
|----|-------------|
| `P0` | `esteban.marketing` — The agency itself |
| `P1` | First paying client |
| `P2` | Second paying client |
| `P[N]` | N-th project |

**Repository naming convention:** `P[N]-[client-slug]`
Examples: `P0-esteban-marketing` · `P1-acme-corp` · `P7-brand-name`

---

## Complete Repository Map

```
P[N]-[client-slug]/
│
├── README.md                          ← You are here
├── STATE.md                           ← Live status of this project
│
├── Core_Strategy/00_META/                           ── REPOSITORY IDENTITY
│   ├── PROJECT.md                     ← Who this project is, constraints, stakeholders
│   ├── AGENTS.md                      ← Mandatory AI agent operating rules
│   └── CHANGELOG.md                   ← All significant repository changes
│
├── Core_Strategy/01_COMPANY/                        ── BUSINESS IDENTITY
│   ├── PROFILE.md                     ← Master company fact sheet (most-read file)
│   ├── FOUNDING-STORY.md              ← Origin, motivation, trajectory
│   ├── MISSION-VISION-VALUES.md       ← Strategic north star
│   ├── LEGAL.md                       ← Entity, compliance, restrictions
│   └── TEAM.md                        ← Key people, roles, decision authority
│
├── Core_Strategy/02_BRAND/                          ── BRAND SYSTEM
│   ├── BRAND-IDENTITY.md              ← Colors, typography, logo rules
│   ├── VOICE-TONE.md                  ← Language personality, style rules
│   ├── MESSAGING-FRAMEWORK.md         ← Value props, taglines, proof points
│   └── VISUAL-GUIDELINES.md           ← Imagery, layout, design direction
│
├── Market_Audiences/03_MARKET/                         ── MARKET INTELLIGENCE
│   ├── INDUSTRY.md                    ← Market definition, size, dynamics
│   ├── COMPETITIVE-LANDSCAPE.md       ← Competitor profiles and gaps
│   ├── AUDIENCES.md                   ← ICPs, personas, segments
│   └── POSITIONING.md                 ← Market position and rationale
│
├── Products/04_PRODUCTS/                       ── COMMERCIAL OFFER
│   ├── CATALOG.md                     ← All products and services
│   ├── PRICING.md                     ← Pricing structure and logic
│   ├── OFFERS.md                      ← Active promotions and bundles
│   └── CUSTOMER-JOURNEY.md            ← Awareness → purchase → retention
│
├── Campaigns_Assets/05_CHANNELS/                       ── DIGITAL FOOTPRINT
│   ├── DIGITAL-PRESENCE.md            ← All URLs, handles, profiles
│   ├── PAID-MEDIA.md                  ← Ad accounts, pixels, CAPI config
│   ├── EMAIL.md                       ← ESP, lists, active sequences
│   ├── ORGANIC-SOCIAL.md              ← Platform strategy and cadence
│   └── SEO.md                         ← Domain, keywords, rankings
│
├── Core_Strategy/06_TECH-STACK/                     ── MARKETING INFRASTRUCTURE
│   ├── INFRASTRUCTURE.md              ← All platforms and access index
│   ├── TRACKING.md                    ← PostHog schema, pixels, CAPI events
│   ├── AUTOMATION.md                  ← n8n/Make workflows and logic
│   └── INTEGRATIONS.md                ← System connections and data flows
│
├── Campaigns_Assets/07_CONTENT/                        ── CONTENT SYSTEM
│   ├── CONTENT-STRATEGY.md            ← Pillars, formats, objectives
│   ├── EDITORIAL-CALENDAR.md          ← Planned content and cadence
│   ├── CONTENT-LIBRARY/               ← Index of existing content assets
│   └── TEMPLATES/                     ← Reusable content formats
│       ├── AD-COPY.md                 ← Paid ad copy framework
│       ├── EMAIL.md                   ← Email copy framework
│       ├── LANDING-PAGE.md            ← Landing page copy structure
│       └── SOCIAL-POST.md             ← Organic social post framework
│
├── Campaigns_Assets/08_CAMPAIGNS/                      ── CAMPAIGN EXECUTION
│   ├── _CAMPAIGN-TEMPLATE.md          ← Base file for all new campaigns
│   ├── ACTIVE/                        ← Live campaigns (MarkOS protocol)
│   └── ARCHIVE/                       ← Completed campaigns + learnings
│
├── Core_Strategy/09_ANALYTICS/                      ── MEASUREMENT SYSTEM
│   ├── KPI-FRAMEWORK.md               ← KPIs, targets, measurement logic
│   ├── REPORTING-CADENCE.md           ← When and what to report
│   └── REPORTS/                       ← Dated historical reports
│
└── Operations/10_OPERATIONS/                     ── OPERATIONAL PROTOCOLS
    ├── WORKFLOWS.md                   ← SOPs for recurring tasks
    ├── APPROVALS.md                   ← Decision and sign-off matrix
    └── CONTACTS.md                    ← Vendors, platforms, stakeholders
```

---

## Readiness Gates

The repository is not usable for campaign execution until the following files reach `complete` or `verified` status in `STATE.md`:

**Gate 1 — Identity (required before any marketing work):**
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Market_Audiences/03_MARKET/AUDIENCES.md`
- `Products/04_PRODUCTS/CATALOG.md`

**Gate 2 — Execution (required before paid campaigns):**
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/06_TECH-STACK/AUTOMATION.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`

---

## File Status Values

| Status | Meaning |
|--------|---------|
| `empty` | Template only — no real content filled |
| `partial` | Some fields complete, gaps remain |
| `complete` | All required fields populated |
| `verified` | Complete + confirmed accurate by {{LEAD_AGENT}} |
| `stale` | Complete but not reviewed in 90+ days |

---

## Cardinal Rules

1. **This repository is the only source of truth.** If it is not written here, it does not exist for any agent or workflow.
2. **One answer per question.** No information is duplicated across files. If two files touch the same topic, one references the other.
3. **Most-specific file wins.** If `Core_Strategy/02_BRAND/VOICE-TONE.md` and `Core_Strategy/01_COMPANY/PROFILE.md` give different tone guidance, `VOICE-TONE.md` is authoritative.
4. **`STATE.md` is always current.** All other files may describe the business at a point in time — `STATE.md` tells you what is happening right now.
5. **AI agents read `Core_Strategy/00_META/AGENTS.md` before doing anything.** No exceptions.
6. **Update before briefing.** If the business changes, update the relevant file before giving any agent a new task.

---

*MIR Template v1.0 — esteban.marketing*
*Clone for every new project (P0 is the agency itself).*
*Do not edit this template directly — submit changes via PR to the get-shit-done repo.*
