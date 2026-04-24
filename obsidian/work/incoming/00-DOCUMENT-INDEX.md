# MarkOS Architecture Document Index - v2
## Complete Blueprint for the AI-Native Marketing Operating System

---

## Full Document Registry

| # | File | What it defines | Status |
|---|------|----------------|--------|
| 00 | `00-DOCUMENT-INDEX.md` | This file - full document map | Complete |
| 01 | `01-PRODUCT-VISION.md` | Core thesis, product surface, competitive moat, agency replacement math | Complete |
| 02 | `02-AGENT-NETWORK-FULL.md` | 80+ agent roster, token IDs, interaction patterns | Complete |
| 03 | `03-SOCIAL-DEEP-INTEGRATION.md` | Social OS at API depth - DMs, comments, listening, automation | Complete |
| 04 | `04-INTELLIGENCE-LAYER.md` | All external data connections + 6-part audit framework | Complete |
| 05 | `05-CONTENT-ENGINE.md` | Full content pipeline: strategy -> brief -> create -> publish -> measure | Complete |
| 06 | `06-RESEARCH-ENGINE.md` | Research tiers, source-quality scoring, citations, hallucination defense, evidence context | Complete |
| 07 | `07-PIPELINE-MODULES.md` | Calendar, demo engine, B2B/B2C lead gen, branding engine, research | Complete |
| 08 | `08-SELF-EVOLVING-ARCHITECTURE.md` | Living literacy system, cross-tenant learning, Tenant 0 | Complete |
| 09 | `09-ORCHESTRATION-CONTRACT.md` | Agent queue, cost accounting, approval gates, retry policy, multi-tenant isolation | Complete |
| 10 | `10-HUMAN-INTERFACE-LAYER.md` | Task board, approval inbox, notifications, client portal, chat | Complete |
| 11 | `11-ONBOARDING-ARCHITECTURE.md` | First 30 minutes, brand pack wizard, wow moment, agency mode, offboarding | Complete |
| 12 | `12-AGENT-PHASE-PLAN.md` | Phase 1 (22 agents), Phase 2 (50 total), Phase 3 (full vision) with dependencies | Complete |
| 13 | `13-PRICING-AND-COST-MODEL.md` | Pricing tiers, AI metering, BYOK, unit economics, LTV model | Complete |
| 14 | `14-GO-TO-MARKET.md` | Tenant 0 motion, ICP, design partners, positioning, acquisition, case study playbook | Complete |
| 15 | `15-PRICING-ENGINE.md` | Pricing intelligence engine: competitor monitoring, cost models, recommendations, tests, PRC agents, API/MCP/UI | Complete |
| 16 | `16-SAAS-SUITE.md` | SaaS tenant-type suite: subscriptions, billing, compliance, churn, support, product usage, revenue intelligence, SAS agents, API/MCP/UI | Complete |
| 17 | `17-SAAS-MARKETING-OS-STRATEGY.md` | Complete SaaS Marketing OS strategy: B2B/B2C/PLG modes, PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment | Complete |
| 18 | `18-CRM-ENGINE.md` | Native CRM engine: customer 360, timeline-first memory, opportunities, buying committees, lifecycle, revenue actions | Complete |
| 19 | `19-EMAIL-ENGINE.md` | Native email engine: deliverability, lifecycle, broadcast, transactional, revenue email, reply intelligence, API/MCP/UI | Complete |
| 20 | `20-CDP-ENGINE.md` | CDP and identity substrate: event stream, identity graph, unified profiles, consent, segments, activation | Complete |
| 21 | `21-MESSAGING-ENGINE.md` | Messaging engine: WhatsApp, SMS, push, in-app, thread memory, automations, reply routing | Complete |
| 22 | `22-ANALYTICS-ENGINE.md` | Native analytics engine: attribution, metrics model, journey intelligence, anomalies, forecast, narratives | Complete |
| 23 | `23-CONVERSION-ENGINE.md` | Conversion engine: landing pages, forms, offers, CRO, experiments, personalization, conversion infrastructure | Complete |
| 24 | `24-SALES-ENABLEMENT-ENGINE.md` | Sales enablement engine: battlecards, proof packs, deal briefs, deal rooms, revops support, forecast context | Complete |
| 25 | `25-ECOSYSTEM-ENGINE.md` | Ecosystem engine: developer marketing, marketplace, partners, affiliates, community, ecosystem distribution | Complete |
| 26 | `26-LAUNCH-ENGINE.md` | Launch engine: product launches, pricing changes, release orchestration, readiness, launch analytics | Complete |

---

## How the documents relate

```
WHAT MARKOS IS
  01-PRODUCT-VISION.md         the thesis

WHAT IT BUILDS
  02-AGENT-NETWORK-FULL.md     the 80-agent roster
  12-AGENT-PHASE-PLAN.md       which agents ship when

HOW IT WORKS (TECHNICAL)
  09-ORCHESTRATION-CONTRACT.md     the execution engine
  08-SELF-EVOLVING-ARCHITECTURE.md the learning engine

WHAT IT CONNECTS TO
  03-SOCIAL-DEEP-INTEGRATION.md  social APIs
  04-INTELLIGENCE-LAYER.md       all external data connections

WHAT IT KNOWS ABOUT CUSTOMERS
  20-CDP-ENGINE.md               identity, events, consent, segments
  18-CRM-ENGINE.md               accounts, people, opportunities, lifecycle memory

HOW IT COMMUNICATES
  19-EMAIL-ENGINE.md             lifecycle, transactional, broadcast, revenue email
  21-MESSAGING-ENGINE.md         WhatsApp, SMS, push, in-app conversations

WHAT IT PRODUCES
  05-CONTENT-ENGINE.md           content pipeline
  07-PIPELINE-MODULES.md         all other pipeline modules
  23-CONVERSION-ENGINE.md        landing pages, forms, offers, experiments

HOW HUMANS USE IT
  10-HUMAN-INTERFACE-LAYER.md    the UI/UX architecture
  11-ONBOARDING-ARCHITECTURE.md  first 30 minutes
  24-SALES-ENABLEMENT-ENGINE.md  revenue-winning proof and deal support

HOW IT MEASURES AND COMPOUNDS
  22-ANALYTICS-ENGINE.md         measurement, attribution, narrative, forecast
  25-ECOSYSTEM-ENGINE.md         developer, partner, affiliate, and community loops
  26-LAUNCH-ENGINE.md            release and announcement orchestration

HOW IT GROWS
  13-PRICING-AND-COST-MODEL.md       historical unit economics and billing assumptions
  15-PRICING-ENGINE.md               canonical pricing intelligence and pricing-strategy engine
  16-SAAS-SUITE.md                   SaaS-specific operating suite for subscription companies
  17-SAAS-MARKETING-OS-STRATEGY.md   SaaS growth engines and mode-specific marketing OS destination
  14-GO-TO-MARKET.md                 acquisition and positioning
```

---

## Reading paths by role

| Role | Reading order |
|------|--------------|
| Founding engineer starting the build | 09 -> 12 -> 02 -> 10 -> 11 |
| Product designer | 10 -> 11 -> 01 -> 08 |
| Investor / due diligence | 01 -> 15 -> 16 -> 22 -> 14 -> 12 |
| New team member | 01 -> 14 -> 02 -> 09 -> 10 |
| Design partner evaluating MarkOS | 01 -> 11 -> 07 -> 14 |
| SaaS operator / product-led company | 01 -> 16 -> 17 -> 15 -> 18 -> 19 -> 22 -> 10 |
| Revenue / RevOps leader | 18 -> 24 -> 22 -> 15 -> 10 -> 09 |
| Lifecycle / CRM / email owner | 20 -> 18 -> 19 -> 21 -> 22 -> 10 |
| Growth and conversion lead | 23 -> 22 -> 19 -> 21 -> 20 -> 18 |
| Ecosystem / platform lead | 25 -> 26 -> 22 -> 18 -> 20 -> 09 |

---

## The build order in one sentence

Ship the task board and onboarding wow moment (09, 10, 11) with the Phase 1 agents (12),
establish the customer data and relationship backbone (20, 18), own the core outbound and
conversion surfaces (19, 21, 23), build the Pricing Engine (15) before locking public pricing,
activate the SaaS Suite (16) only after the core operating loop and approval substrate are ready,
add measurement, enablement, ecosystem, and launch layers (22, 24, 25, 26), use the SaaS
Marketing OS strategy (17) as the post-suite destination map, then market it through itself (14).
