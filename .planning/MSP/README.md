# Marketing Strategic Plans (MSP)

<!-- markos-token: MSP -->
### Template v1.0 — maintained by esteban.marketing

> **The strategic layer of the marketing system.**
> Where the MIR declares *what the business is*, the MSP declares *how the business will grow through marketing*.
> Where campaigns in MarkOS execute *specific initiatives*, the MSP defines *the annual program those initiatives belong to*.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MIR REPOSITORY                      │
│   Business identity · Brand · Audiences · Stack      │
│   (The source of truth for what the business IS)     │
└────────────────────┬────────────────────────────────┘
                     │ feeds into
                     ▼
┌─────────────────────────────────────────────────────┐
│              MSP — THIS REPOSITORY                   │
│   Master plan · Discipline strategies · Roadmaps     │
│   (The source of truth for HOW we will grow)         │
└────────────────────┬────────────────────────────────┘
                     │ generates
                     ▼
┌─────────────────────────────────────────────────────┐
│           MarkOS CAMPAIGN EXECUTION                    │
│   Individual campaigns · Briefs · Tracking · Reports │
│   (The execution layer — one campaign at a time)     │
└─────────────────────────────────────────────────────┘
```

**Rule:** The MSP never contradicts the MIR. It derives from it. If MIR says the ICP is X, every discipline plan in the MSP targets X.

---

## What the MSP Contains

**One master plan** that defines the overall marketing program: goals, budget, funnel ownership, calendar, and how all disciplines work together.

**Thirteen discipline plans** — one per marketing type — each defining the strategy, tactics, KPIs, and roadmap for that specific area of marketing.

Every business uses some disciplines and not others. **Disciplines not being used are kept as empty templates** — they serve as a checklist that forces a deliberate decision about what is in and out of scope.

---

## Complete Repository Map

```
P[N]-[client-slug]-MSP/
│
├── README.md                            ← You are here
├── STATE.md                             ← Live status of this MSP
│
├── Strategy/00_MASTER-PLAN/                      ── THE INTEGRATED MARKETING PLAN
│   ├── MARKETING-PLAN.md                ← The single governing document
│   ├── STRATEGIC-GOALS.md              ← Annual goals with targets and logic
│   ├── BUDGET-ALLOCATION.md            ← Total budget split across disciplines
│   ├── FUNNEL-OWNERSHIP-MAP.md         ← Which discipline owns which funnel stage
│   ├── ANNUAL-CALENDAR.md              ← Year-view of all marketing activity
│   └── PERFORMANCE-DASHBOARD.md        ← KPI scorecard across all disciplines
│
├── Outbound/01_ADVERTISING/                      ── PAID MEDIA STRATEGY
│   ├── PLAN.md                          ← Advertising master strategy
│   ├── paid-social/
│   │   └── STRATEGY.md                  ← Meta, TikTok, X, LinkedIn paid social
│   ├── paid-search/
│   │   └── STRATEGY.md                  ← Google, Bing search strategy
│   └── programmatic/
│       └── STRATEGY.md                  ← Display, programmatic, DSPs
│
├── Inbound/02_CONTENT-MARKETING/                ── CONTENT STRATEGY
│   ├── PLAN.md                          ← Content marketing master strategy
│   ├── CONTENT-PILLARS.md              ← Pillar definitions and rationale
│   ├── SEO-CONTENT.md                  ← Organic content for search
│   ├── THOUGHT-LEADERSHIP.md           ← Long-form, positioning content
│   └── VIDEO-STRATEGY.md               ← Video content direction
│
├── Outbound/03_EMAIL-MARKETING/                  ── EMAIL STRATEGY
│   ├── PLAN.md                          ← Email marketing master strategy
│   ├── LIFECYCLE-SEQUENCES.md          ← Nurture, onboarding, retention flows
│   └── BROADCAST-STRATEGY.md           ← Newsletter and campaign sends
│
├── Social/04_SOCIAL-MEDIA/                     ── ORGANIC SOCIAL STRATEGY
│   ├── PLAN.md                          ← Organic social master strategy
│   ├── PLATFORM-STRATEGIES.md          ← Per-platform approach
│   └── COMMUNITY-PLAYBOOK.md           ← Engagement and conversation rules
│
├── Social/05_INFLUENCER-MARKETING/             ── INFLUENCER STRATEGY
│   ├── PLAN.md                          ← Influencer program strategy
│   ├── TIER-FRAMEWORK.md               ← Nano/micro/macro/mega tiers and use
│   └── PARTNER-ROSTER.md               ← Active and prospective partners
│
├── Inbound/06_SEO/                              ── SEARCH ENGINE OPTIMIZATION
│   ├── PLAN.md                          ← SEO master strategy
│   ├── KEYWORD-STRATEGY.md             ← Keyword clusters and priority
│   ├── TECHNICAL-SEO.md                ← Site health and infrastructure
│   └── LINK-BUILDING.md                ← Authority and backlink strategy
│
├── Outbound/07_PR-COMMUNICATIONS/                ── PUBLIC RELATIONS & MESSAGING
│   ├── PLAN.md                          ← PR and comms master strategy
│   ├── MEDIA-RELATIONS.md              ← Press, publications, outreach
│   ├── MESSAGING-MATRIX.md             ← Official stances and talking points
│   └── CRISIS-PLAYBOOK.md              ← Crisis communication protocol
│
├── Outbound/08_BRAND-MARKETING/                  ── BRAND BUILDING STRATEGY
│   ├── PLAN.md                          ← Brand marketing master strategy
│   ├── BRAND-CAMPAIGNS.md              ← Non-performance, awareness initiatives
│   └── BRAND-HEALTH-TRACKING.md        ← How brand equity is measured
│
├── Outbound/09_PRODUCT-MARKETING/                ── PRODUCT MARKETING STRATEGY
│   ├── PLAN.md                          ← Product marketing master strategy
│   ├── GO-TO-MARKET.md                 ← Product launch playbook
│   └── COMPETITIVE-POSITIONING.md      ← Feature-level competitive messaging
│
├── Social/10_PARTNERSHIPS-AFFILIATES/          ── PARTNERSHIP & AFFILIATE STRATEGY
│   ├── PLAN.md                          ← Partnerships master strategy
│   ├── AFFILIATE-PROGRAM.md            ← Affiliate structure and terms
│   └── STRATEGIC-PARTNERS.md           ← Co-marketing and integration partners
│
├── Inbound/11_CRO/                              ── CONVERSION RATE OPTIMIZATION
│   ├── PLAN.md                          ← CRO master strategy
│   ├── TESTING-ROADMAP.md              ← A/B test queue and results
│   └── FUNNEL-ANALYSIS.md              ← Stage-by-stage conversion analysis
│
├── Community_Events/12_COMMUNITY/                        ── COMMUNITY MARKETING STRATEGY
│   ├── PLAN.md                          ← Community strategy
│   └── COMMUNITY-PROGRAMS.md           ← Programs, rituals, engagement loops
│
└── Community_Events/13_EVENT-MARKETING/                  ── EVENT STRATEGY
    ├── PLAN.md                          ← Event marketing strategy
    ├── EVENT-CALENDAR.md               ← Scheduled events and sponsorships
    └── EVENT-PLAYBOOK.md               ← Standard operating procedures per type
```

---

## Discipline Activation Status

> Mark each discipline as ACTIVE, INACTIVE, or FUTURE as part of the MSP setup.
> This is a strategic decision, not a default. Every inactive discipline is a deliberate choice.

| # | Discipline | Status | Rationale |
|---|-----------|--------|-----------|
| 01 | Advertising | — | — |
| 02 | Content Marketing | — | — |
| 03 | Email Marketing | — | — |
| 04 | Organic Social Media | — | — |
| 05 | Influencer Marketing | — | — |
| 06 | SEO | — | — |
| 07 | PR & Communications | — | — |
| 08 | Brand Marketing | — | — |
| 09 | Product Marketing | — | — |
| 10 | Partnerships & Affiliates | — | — |
| 11 | CRO | — | — |
| 12 | Community | — | — |
| 13 | Event Marketing | — | — |

---

## Cardinal Rules

1. **Every discipline plan derives from the MIR.** Audience definitions, brand voice, product facts, and tech stack rules from the MIR are not re-defined here — they are referenced.
2. **The master plan owns the budget.** Individual discipline plans work within the budget allocated to them in `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`.
3. **Funnel ownership is declared once.** `Strategy/00_MASTER-PLAN/FUNNEL-OWNERSHIP-MAP.md` defines which discipline is responsible for each funnel stage. Disciplines do not overlap in ownership without explicit coordination rules.
4. **Inactive disciplines are documented.** A discipline marked `INACTIVE` with a rationale is more useful than a blank file. The absence of a strategy is itself a strategic choice.
5. **This repository is reviewed quarterly.** Goals, budgets, and priorities shift. The MSP must reflect the current program, not last year's plan.

---

## Relationship to MarkOS Campaigns

When a campaign is created in `Campaigns_Assets/08_CAMPAIGNS/ACTIVE/` inside the MIR:
- It must reference the discipline strategy it belongs to (e.g., `Outbound/01_ADVERTISING/paid-social/STRATEGY.md`)
- It must align with the goals defined in `Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md`
- Its budget must fit within the allocation in `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`

The MSP is not updated per campaign — it is updated when strategy shifts.

---

*MSP Template v1.0 — esteban.marketing*
*Clone alongside the MIR for every project (same project ID and client slug).*
*Repository naming: `P[N]-[client-slug]-MSP`*
