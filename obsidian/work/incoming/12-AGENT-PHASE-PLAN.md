# MarkOS Agent Phase Plan
## Phase 1 (Launch) · Phase 2 (Expansion) · Phase 3 (Full Vision)

---

## The Build Order Problem

The 80-agent network in `02-AGENT-NETWORK-FULL.md` is the 3-year vision. It is not the
launch spec. Building all 80 agents before shipping is how you spend 18 months in
development and lose to a scrappier competitor who ships 20 agents and iterates fast.

This document answers two questions:
1. Which agents ship when?
2. What are the dependencies that lock that ordering?

The ordering is not arbitrary. It follows a single rule:
**Ship the agents that complete a loop before you ship the agents that extend a loop.**

A "loop" is a chain from raw intelligence → agent output → human decision → measurable result.
The first loops to complete are the ones with the highest value and lowest build complexity.
Extensions (more channels, more formats, deeper features) come after the loops work end to end.

---

## Dependency Map

Some agents cannot be built before others. These are hard dependencies:

```
Brand pack active
  └─ required by: every content agent (CONT-*), every social agent (SOC-*)

Voice Classifier operational
  └─ required by: every approval gate on content output

At least one connector active (GA4 or GSC)
  └─ required by: Anomaly Detector, Performance Analyst, Analytics Auditor

Agent run infrastructure operational (09-ORCHESTRATION-CONTRACT.md)
  └─ required by: every agent

Task board operational (10-HUMAN-INTERFACE-LAYER.md)
  └─ required by: every approval gate
  └─ required by: every escalation path

Lead Scorer
  └─ required by: B2B Prospector, Lead Nurture Architect

SEO Auditor
  └─ required by: Content Strategist (needs keyword data)
  └─ required by: Content Brief Writer (needs SERP data)

Content Brief Writer
  └─ required by: Long-Form Content Creator, Short-Form Copy Writer

Long-Form Content Creator
  └─ required by: Content Editor, SEO Optimizer

Analytics Auditor
  └─ required by: Funnel Analyst, Revenue Intelligence Reporter

Performance Analyst (weekly)
  └─ required by: OKR Monitor (needs something to monitor)

Community Manager (draft)
  └─ required by: Social inbox being useful at all

Competitive Intelligence Monitor
  └─ required by: Benchmark Researcher (needs competitive baseline)

Cross-tenant performance data (min. 20 tenants)
  └─ required by: Benchmark Researcher (industry benchmarks)
  └─ required by: Literacy Scout's cross-tenant synthesis
```

---

## Phase 1: The Core Loop (Months 1–4)

**Ship goal:** A complete strategy → content → social → paid → analytics loop.
An operator can run an entire content marketing program end to end.

**Target: 22 agents.**

### Infrastructure (must ship before any agent)

These are not agents but are dependencies for all agents:

| Component | Description | Dependency on |
|-----------|-------------|--------------|
| Agent run infrastructure | Queue, priority, retry, cost accounting | `09-ORCHESTRATION-CONTRACT.md` |
| Task board | Inbox, kanban, approvals | `10-HUMAN-INTERFACE-LAYER.md` |
| Brand pack system | Wizard + storage + brand schema | `07-PIPELINE-MODULES.md` Module 5 |
| Voice Classifier | LLM-as-judge, 10-dimension scoring | Brand pack |
| Approval gate engine | Gate creation, routing, human review UI | Task board |
| Connector layer | OAuth, API key, credential vault | Base infrastructure |
| GA4 connector | Most common first connection | Connector layer |
| GSC connector | Required for SEO loop | Connector layer |
| Notification engine | Push, email, in-app | Task board |
| Morning brief generator | Lightweight synthesis, not a full agent | All agent runs |

### Phase 1 Agents

**Strategy (2 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| STR-01 | Grand Strategist | Anchor agent — produces the plan everything else executes |
| STR-05 | OKR Monitor | Closes the strategy loop — measures whether the plan is working |

*Skipped in Phase 1:* STR-02 (Campaign Planner), STR-03 (Channel Allocator), STR-04 (Campaign Architect) — these are refinements of STR-01's output. Build them when STR-01 is working and operators are asking for more planning granularity.

---

**Research (3 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| RES-01 | Deep Researcher | Foundation for everything — content, strategy, competitive |
| RES-06 | SEO Auditor | Required for Content Strategist to work with real data |
| RES-08 | Analytics Auditor | Required for the "wow moment" in onboarding |

*Skipped in Phase 1:* RES-02 (Competitive Monitor), RES-03 (Market Scanner), RES-04 (VOC Researcher), RES-05 (Tech Stack Profiler), RES-07 (Paid Media Auditor), RES-09 (Benchmark Researcher).
These are Phase 2 once the research foundation is solid.

---

**Audience (2 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| AUD-01 | Archetype Builder | Required for any targeting to work — brand pack plus audience archetype = functional content |
| AUD-03 | Lead Scorer | Required for the lead gen loop; without this, leads are just form fills |

*Skipped in Phase 1:* AUD-02 (Segment Analyzer), AUD-04 (ABM Selector), AUD-05 (Lookalike Generator) — need CRM data volume before these are meaningful.

---

**Content (6 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| CONT-01 | Content Strategist | The content calendar — what to write, when, for whom |
| CONT-02 | Content Brief Writer | Required before any content can be created |
| CONT-03 | Long-Form Content Creator | The main content output — blog posts, guides |
| CONT-04 | Short-Form Copy Writer | Ad copy, CTAs, subject lines — essential for paid loop |
| CONT-05 | Email Sequence Writer | Essential for lead nurture |
| CONT-10 | Content Editor | Quality gate before every approval |

*Phase 1 deferred:* CONT-06 (Social Content Creator — Phase 1 social content is manual or repurposed), CONT-07 (Video Script Writer), CONT-08 (Visual Creative Director), CONT-09 (Content Repurposer), CONT-11 (SEO Optimizer). These extend the content output. The core pipeline (strategy → brief → draft → edit) must work first.

**Exception:** CONT-11 (SEO Optimizer) ships in Phase 1 late if onboarding data shows operators prioritizing organic traffic.

---

**Social (3 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| SOC-02 | Social Publisher | Publish content to connected platforms — table stakes |
| SOC-03 | Community Manager | DM + comment response drafting — the most valuable social feature |
| SOC-04 | Social Listener | Brand monitoring — required for the crisis detection path |

*Phase 1 deferred:* SOC-01 (Social Strategist), SOC-05 (Influencer Scout), SOC-06 (Creator Brief Manager), SOC-07 (Social Analytics Reporter), SOC-08 (Hashtag Strategist), SOC-09 (Paid Social Manager), SOC-10 (Crisis Comms Monitor). These are Phase 2 once the basic publish/listen/respond loop is working.

**Exception:** SOC-10 (Crisis Comms Monitor) ships in Phase 1 late — the crisis path needs a monitor.

---

**Paid (1 agent)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| PAID-04 | CRO Hypothesis Generator | Directly supports the onboarding wow moment and the paid loop |

*Phase 1 deferred:* PAID-01 (Google Ads Optimizer), PAID-02 (Meta Ads Optimizer), PAID-03 (LinkedIn Ads Manager), PAID-05 (Attribution Modeler). These require connector depth and trust before operators let agents touch live ad accounts. Phase 2 after the analytics trust is established.

---

**Analytics (2 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| ANA-01 | Performance Analyst | The weekly narrative — closes the measurement loop |
| ANA-05 | Anomaly Detector | Required for the notification engine to be useful |

*Phase 1 deferred:* ANA-02 (Data Scientist), ANA-03 (Funnel Analyst), ANA-04 (Revenue Intelligence Reporter). These need data volume and connector depth. Phase 2.

---

**Operations (2 agents)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| OPS-01 | Calendar Coordinator | Required for the content calendar to function as a real calendar |
| OPS-04 | Budget Monitor | Required for cost accounting to surface to operators |

*Phase 1 deferred:* OPS-02 (Meeting Intelligence), OPS-03 (Workflow Automator), OPS-05 (Compliance Checker). OPS-05 (Compliance) is considered for Phase 1 late — it's a trust feature.

---

**Learning (1 agent)**

| Token | Agent | Rationale |
|-------|-------|-----------|
| LIT-01 | Literacy Scout | The system should start learning from day one, even with minimal data |

*Phase 1 deferred:* LIT-02, LIT-03, LIT-04 — cross-tenant synthesis needs tenant volume. Phase 2.

---

### Phase 1 summary

22 agents shipping at launch:

```
Strategy:    STR-01, STR-05
Research:    RES-01, RES-06, RES-08
Audience:    AUD-01, AUD-03
Content:     CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-10
Social:      SOC-02, SOC-03, SOC-04
Paid:        PAID-04
Analytics:   ANA-01, ANA-05
Operations:  OPS-01, OPS-04
Learning:    LIT-01
```

**Phase 1 loop test:** A new tenant can: connect GA4 + GSC → get SEO audit with keyword gaps →
get a content strategy → get 3 content briefs → get 3 drafted articles → approve and publish
one → monitor social engagement → see anomaly detection fire if something moves → review
a weekly performance narrative. That is a complete marketing workflow running on MarkOS.

---

## Phase 2: Expansion (Months 5–9)

**Ship goal:** Extend the Phase 1 loops into more channels, more depth, and B2B pipeline.
Add the research-as-a-service capability. Enable paid media management with operator approval.

**Target: 28 additional agents (50 total).**

### Phase 2 Agents

**Research (6 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| RES-02 | Competitive Intelligence Monitor | Phase 1 complete, connector layer stable |
| RES-03 | Market Scanner | Phase 1 complete |
| RES-04 | VOC Researcher | Phase 1 complete |
| RES-05 | Technology Stack Profiler | BuiltWith connector available |
| RES-07 | Paid Media Auditor | Google Ads + Meta connectors added |
| RES-09 | Benchmark Researcher | Min. 25 tenants in platform (cross-tenant data meaningful) |

**Audience (3 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| AUD-02 | Segment Analyzer | CRM has > 200 contacts for most tenants |
| AUD-04 | ABM Account Selector | Intent data connectors live (Apollo/Bombora) |
| AUD-05 | Lookalike Generator | Meta + LinkedIn connectors at full access |

**Content (5 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| CONT-06 | Social Content Creator | Social OS connectors stable |
| CONT-09 | Content Repurposer | Long-form pipeline has >20 pieces published per tenant |
| CONT-11 | SEO Optimizer | GSC connector fully deployed, Lighthouse integration live |
| CONT-07 | Video Script Writer | Operator demand signal confirmed (Phase 1 feedback) |
| CONT-08 | Visual Creative Director | Operator demand signal confirmed |

**Social (6 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| SOC-01 | Social Strategist | SOC-02 and SOC-04 stable and generating performance data |
| SOC-07 | Social Analytics Reporter | Social connectors with analytics API access |
| SOC-08 | Hashtag & SEO Strategist | TikTok + YouTube connectors |
| SOC-09 | Paid Social Manager | Meta + LinkedIn ads connectors; operator trust established |
| SOC-10 | Crisis Comms Monitor | SOC-04 listening stable for 60 days |
| SOC-05 | Influencer Scout | Phase 1 social complete, operator demand confirmed |

**Paid (3 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| PAID-01 | Google Ads Optimizer | Paid Media Auditor complete; operator trust established |
| PAID-02 | Meta Ads Optimizer | Meta connector at full Marketing API access |
| PAID-05 | Attribution Modeler | GA4 + CRM + all ad connectors live; min. 60 days of data |

**Lead Gen (5 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| LG-01 | B2B Prospector | Apollo + Clearbit connectors |
| LG-02 | Cold Outreach Sequencer | LG-01 live; ESP connector for cold outreach |
| LG-04 | Landing Page Optimizer | GA4 + heatmap connector (Hotjar/Clarity/PostHog) |
| LG-05 | Lead Nurture Architect | Lead Scorer + ESP connector |
| LG-03 | B2C Acquisition Designer | Operator demand signal — Phase 1 feedback shows B2C need |

**Analytics (2 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| ANA-03 | Funnel Analyst | GA4 funnel data + CRM stage data |
| ANA-04 | Revenue Intelligence Reporter | CRM + attribution model |

**Operations (2 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| OPS-05 | Compliance Checker | Operator demand + legal review of compliance scope |
| OPS-02 | Meeting Intelligence Agent | Cal.com/Calendly connector + Zoom/Meet connector |

**Learning (3 agents)**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| LIT-02 | Performance Synthesizer | Min. 25 tenants, 3 months of performance data |
| LIT-03 | Overlay Refresher | LIT-02 live |
| LIT-04 | Literacy Promoter | LIT-03 live; admin review workflow built |

---

## Phase 3: Full Vision (Months 10–18+)

**Ship goal:** The remaining agents completing the original 80+ agent vision. These are
deeper specializations, higher-complexity integrations, and features that require either
significant data volume or significant operator trust built over time.

**Remaining agents (30+):**

| Token | Agent | Unlock condition |
|-------|-------|-----------------|
| STR-02 | Campaign Planner | STR-01 working well + operator demand for granularity |
| STR-03 | Channel Allocator | Attribution model (ANA-05) has 6+ months of data |
| STR-04 | Campaign Architect | STR-02 live |
| PAID-03 | LinkedIn Ads Manager | LinkedIn Marketing Developer Program access |
| ANA-02 | Data Scientist | Min. 12 months of per-tenant data for MMM |
| LG-06 | Demo Engine Coordinator | Demo Engine built (Phase 3 full pipeline module) |
| SOC-06 | Creator Brief Manager | Influencer Scout live + operator demand |
| OPS-03 | Workflow Automator | Operator feedback confirms this is a bottleneck |
| AUD-05 expanded | Lookalike Generator (B2C) | B2C acquisition volume significant |
| New agents | MCP-native connectors | MCP marketplace has valuable data providers |

Phase 3 agents are planned but not pre-designed. By the time Phase 2 ships, operator feedback
will have reshaped priorities significantly. The Phase 3 agent list should be treated as a
hypothesis, not a backlog.

---

## What "shipped" means for an agent

An agent is not shipped when the code is written. It is shipped when:

1. ✓ The agent runs reliably without human intervention for 7 consecutive days on test tenants
2. ✓ The output passes brand voice classifier at ≥ 82% average score
3. ✓ The approval gate for this agent type is implemented and functional
4. ✓ The agent's cost is tracked at the run level
5. ✓ Failure cases (retries, escalation) are handled per `09-ORCHESTRATION-CONTRACT.md`
6. ✓ The agent appears in the task board with appropriate context for operators
7. ✓ At least 3 design partners have run the agent and provided written feedback

No agent is "done" at v1. After shipping, each agent enters a continuous improvement
cycle driven by: approval/rejection rate, voice score distribution, operator edit rate
(how often operators edit the output before approving), and explicit feedback from
rejection reasons.

---

## Phase 1 Build Sequence Within the Phase

The order in which Phase 1 agents are built matters. This is the recommended sequence:

**Sprint 1–2 (Weeks 1–4): Infrastructure**
- Agent run system, task board, approval gate engine, notification engine
- Brand pack wizard and storage
- Voice classifier v1 (simpler scoring, refine in Sprint 4)
- GA4 + GSC connectors

**Sprint 3–4 (Weeks 5–8): The first loop**
- RES-08 (Analytics Auditor) — the wow moment
- RES-06 (SEO Auditor) — keyword data for content
- AUD-01 (Archetype Builder) — audience foundation
- CONT-01 (Content Strategist) — the content plan
- CONT-02 (Content Brief Writer) — the first artifact

**Sprint 5–6 (Weeks 9–12): Content production**
- CONT-03 (Long-Form Content Creator)
- CONT-10 (Content Editor)
- CONT-04 (Short-Form Copy Writer)
- OPS-01 (Calendar Coordinator)
- SOC-02 (Social Publisher)

**Sprint 7–8 (Weeks 13–16): Intelligence and monitoring**
- ANA-05 (Anomaly Detector)
- SOC-04 (Social Listener)
- SOC-03 (Community Manager)
- ANA-01 (Performance Analyst)
- STR-05 (OKR Monitor)
- AUD-03 (Lead Scorer)

**Sprint 9–10 (Weeks 17–20): Closing the loops**
- RES-01 (Deep Researcher)
- CONT-05 (Email Sequence Writer)
- PAID-04 (CRO Hypothesis Generator)
- OPS-04 (Budget Monitor)
- LIT-01 (Literacy Scout)
- STR-01 (Grand Strategist)
- Voice classifier v2 (improved calibration after 60 days of data)

**Sprint 11–12 (Weeks 21–24): Polish and Phase 2 prep**
- Onboarding sequence fully instrumented
- Morning brief generator
- Design partner feedback incorporated
- Phase 2 connector integrations started (Meta, LinkedIn, Apollo)
- Phase 1 agents tuned based on approval/rejection data
