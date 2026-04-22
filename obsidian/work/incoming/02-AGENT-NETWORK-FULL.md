# MarkOS Agent Network — Full Platform Vision
## Complete Agent Roster, Token IDs, and Interaction Patterns

---

## Architecture Principles

**One agent, one responsibility.** No agent does two things. If a task requires two capabilities,
it requires two agents and an orchestrator.

**Every agent is addressable.** TOKEN_ID format: `MARKOS-AGT-<DOMAIN>-<NN>`. Workflows
reference tokens, never file paths. Registry lives at `.agent/markos/MARKOS-INDEX.md`.

**Agents are composable.** Complex tasks are achieved by chaining agents through the
orchestrator, not by building large monolithic agents. An "Instagram campaign" invokes
Research → Audience → Strategist → Brief → Creator → Auditor → Scheduler → Monitor.

**Human approval gates are contracts.** Any agent that produces something that touches
the external world (a published post, a sent email, a paid campaign change) must route
through an approval package before execution. This is non-negotiable.

---

## Tier 1 — Strategy Agents

The strategy tier produces plans, not content. Plans flow down to execution tiers.

### MARKOS-AGT-STR-01: Grand Strategist
- **Role**: Annual and quarterly marketing strategy synthesis
- **Input**: MIR + MSP + market intelligence + performance retrospective
- **Output**: Strategy document with goals, channel allocation, campaign thesis, KPIs
- **Cadence**: Quarterly + on-demand for major pivots
- **Approval gate**: Yes — strategy documents require operator sign-off before activation

### MARKOS-AGT-STR-02: Campaign Planner
- **Role**: Individual campaign decomposition (a specific campaign within the strategy)
- **Input**: Campaign brief from Strategist + audience archetype + pain tag + channel mix
- **Output**: Campaign plan: phases, messaging, channels, timeline, budget allocation, success metrics
- **Approval gate**: Yes

### MARKOS-AGT-STR-03: Channel Allocator
- **Role**: Budget and effort allocation across channels based on current performance data
- **Input**: Performance data + budget constraints + strategic goals
- **Output**: Recommended allocation with rationale and scenario modeling
- **Cadence**: Monthly

### MARKOS-AGT-STR-04: Campaign Architect
- **Role**: Multi-channel campaign structure design (which messages, which channels, which sequence)
- **Input**: Campaign plan + channel budgets + audience segments
- **Output**: Campaign architecture document: channel map, message matrix, timing logic

### MARKOS-AGT-STR-05: OKR Monitor
- **Role**: Track marketing OKRs, surface drift, recommend course corrections
- **Input**: Live performance data + defined OKRs
- **Output**: Weekly OKR health report, drift alerts with recommended actions
- **Cadence**: Weekly automated, daily on red flags

---

## Tier 2 — Research & Intelligence Agents

### MARKOS-AGT-RES-01: Deep Researcher
- **Role**: Comprehensive research on any topic — market, technology, customer, competitor
- **Input**: Research brief + source budget + depth level
- **Output**: Structured research report with executive summary, findings, evidence
- **Uses**: Web search + web_fetch + deep research chains
- **Typical depth**: 15–40 source documents per research run

### MARKOS-AGT-RES-02: Competitive Intelligence Monitor
- **Role**: Ongoing competitor tracking — positioning changes, product updates, marketing moves
- **Input**: Competitor list per tenant + monitoring cadence
- **Output**: Weekly competitive digest, immediate alerts on significant changes
- **Cadence**: Daily crawl, weekly synthesis
- **Sources**: Company websites, G2/Capterra reviews, LinkedIn, job postings, press releases, AppSumo, ProductHunt

### MARKOS-AGT-RES-03: Market Scanner
- **Role**: Broad trend detection — industry shifts, emerging topics, regulatory changes, platform updates
- **Input**: Industry tags + keyword universe + platform list
- **Output**: Weekly trend report with signal-to-noise filtering
- **Cadence**: Daily scan, weekly synthesis

### MARKOS-AGT-RES-04: VOC Researcher
- **Role**: Voice of customer synthesis — what customers actually say, in their own words
- **Input**: Review sources + survey data + interview transcripts + social listening data
- **Output**: VOC corpus: verbatims, objections, jobs-to-be-done, language patterns
- **Sources**: G2, Capterra, Trustpilot, App Store reviews, Reddit mentions, social comments, support tickets

### MARKOS-AGT-RES-05: Technology Stack Profiler
- **Role**: Identify and track technology stacks of prospects and competitors
- **Input**: Domain list or ICP criteria
- **Output**: Tech stack profiles with MarTech, CMS, commerce, analytics, ESP, CRM tools identified
- **Sources**: BuiltWith API, WappalyzerAPI, Lighthouse reports, public job listings, GitHub, Chrome extension signals

### MARKOS-AGT-RES-06: SEO Auditor
- **Role**: Comprehensive SEO health assessment
- **Input**: Domain + GSC access + target keyword universe
- **Output**: Technical SEO audit, content gap analysis, backlink profile, Core Web Vitals, GEO readiness
- **Tools**: GSC API + Lighthouse + crawl data + SEMrush/Ahrefs API + PageSpeed Insights API

### MARKOS-AGT-RES-07: Paid Media Auditor
- **Role**: Audit current paid media performance and identify optimization opportunities
- **Input**: Google Ads API access + Meta Ads API + historical data
- **Output**: Account audit with wasted spend identification, structure recommendations, creative fatigue analysis

### MARKOS-AGT-RES-08: Analytics Auditor
- **Role**: Audit analytics implementation — GA4, PostHog, tag manager, conversion tracking
- **Input**: GA4 property + PostHog project + GTM container
- **Output**: Analytics health report, tracking gaps, attribution model assessment, data quality issues

### MARKOS-AGT-RES-09: Benchmark Researcher
- **Role**: Pull industry benchmarks for channels, formats, and conversion metrics
- **Input**: Industry + channel + company size
- **Output**: Benchmark report: CTR benchmarks, CVR benchmarks, CPL benchmarks, email performance benchmarks
- **Sources**: Platform benchmark reports + cross-tenant MarkOS data + third-party research

---

## Tier 3 — Audience & Segmentation Agents

### MARKOS-AGT-AUD-01: Archetype Builder
- **Role**: Build and maintain audience archetypes (the MIR Audience section)
- **Input**: VOC corpus + CRM data + interview data + research
- **Output**: Complete archetype definition: identity, situation, JTBD, pain matrix, buying committee, VOC, signal footprint

### MARKOS-AGT-AUD-02: Segment Analyzer
- **Role**: Analyze existing CRM/CDP segments, identify patterns, recommend new segments
- **Input**: CRM data + behavioral data from analytics
- **Output**: Segment analysis with LTV, conversion rate, engagement score per segment

### MARKOS-AGT-AUD-03: Lead Scorer
- **Role**: Score inbound leads against ICP criteria in real time
- **Input**: Lead data (form fill + enrichment) + ICP definition + historical conversion data
- **Output**: Lead score + explanation + recommended routing + urgency rating

### MARKOS-AGT-AUD-04: ABM Account Selector
- **Role**: Identify and prioritize target accounts for ABM campaigns
- **Input**: ICP criteria + intent data + technographic data + current pipeline
- **Output**: Prioritized account list with tier assignment and entry angle recommendation

### MARKOS-AGT-AUD-05: Lookalike Generator
- **Role**: Generate lookalike audience definitions from high-value customer profiles
- **Input**: High-LTV customer segment + ICP definition
- **Output**: Lookalike criteria for each ad platform + segment definition for CDP

---

## Tier 4 — Content Agents

### MARKOS-AGT-CONT-01: Content Strategist
- **Role**: Content strategy for a given period — pillar/cluster architecture, topics, formats, distribution
- **Input**: SEO data + competitive content gaps + audience archetypes + business goals
- **Output**: Content strategy document: pillars, clusters, topic prioritization, format mix, channel distribution

### MARKOS-AGT-CONT-02: Content Brief Writer
- **Role**: Generate detailed content briefs for individual pieces
- **Input**: Topic + keyword targets + audience archetype + pain tag + competition analysis
- **Output**: Full content brief: title options, outline, key points, evidence required, SEO targets, word count

### MARKOS-AGT-CONT-03: Long-Form Content Creator
- **Role**: Write long-form content: blog posts, guides, whitepapers, reports
- **Input**: Content brief + brand voice pack + literacy references
- **Output**: Draft article/guide with SEO optimization, brand voice compliance, citation requirements

### MARKOS-AGT-CONT-04: Short-Form Copy Writer
- **Role**: Short-form copy: ads, subject lines, CTAs, taglines, social captions
- **Input**: Campaign brief + channel constraints + brand voice + neuro spec
- **Output**: Multi-variant copy sets (typically 5–10 variants) for A/B testing

### MARKOS-AGT-CONT-05: Email Sequence Writer
- **Role**: Multi-email sequence design and copy: welcome, onboarding, nurture, re-engagement
- **Input**: Sequence goal + audience segment + pain tag + brand voice
- **Output**: Full sequence: subject lines, preview text, body copy, CTAs, timing cadence

### MARKOS-AGT-CONT-06: Social Content Creator
- **Role**: Platform-native social content for each platform (not repurposed — native)
- **Input**: Content brief + platform + format + audience + brand voice + neuro spec
- **Output**: Platform-native post: caption, hook, hashtags (if relevant), visual brief, alt text

### MARKOS-AGT-CONT-07: Video Script Writer
- **Role**: Video content: explainers, product demos, testimonial scripts, YouTube, TikTok/Reels
- **Input**: Video brief + audience + platform + duration target
- **Output**: Complete script with hook, body, CTA + visual direction notes + subtitle-ready format

### MARKOS-AGT-CONT-08: Visual Creative Director
- **Role**: Visual creative briefs — direction for design, AI image generation, video creative
- **Input**: Content brief + brand visual tokens + channel spec
- **Output**: Visual brief: composition, color use, typography, imagery direction, AI gen prompts

### MARKOS-AGT-CONT-09: Content Repurposer
- **Role**: Transform one piece of content into formats for multiple channels
- **Input**: Source content + target channels + format requirements
- **Output**: Repurposed variants: each channel gets native format, not just a copy-paste

### MARKOS-AGT-CONT-10: Content Editor
- **Role**: Edit and polish drafts — voice calibration, fact-checking, SEO optimization
- **Input**: Draft content + brand voice pack + literacy references
- **Output**: Edited draft with tracked changes and explanation of every substantive edit

### MARKOS-AGT-CONT-11: SEO Optimizer
- **Role**: Optimize existing content for search performance — on-page SEO, GEO readiness
- **Input**: Content draft + target keywords + SERP analysis + GEO assessment
- **Output**: Optimized content with schema markup, internal links, heading structure, GEO-ready lede

---

## Tier 5 — Social Operating System Agents

*The most differentiated tier. These agents manage entire social channels.*

### MARKOS-AGT-SOC-01: Social Strategist
- **Role**: Platform-specific strategy for each social channel
- **Input**: Brand strategy + audience archetype + platform analytics + competitive benchmarks
- **Output**: 30-day content plan per platform: formats, cadence, themes, goals

### MARKOS-AGT-SOC-02: Social Publisher
- **Role**: Schedule and publish social content across all connected platforms
- **Input**: Approved content + optimal timing data + platform-specific formatting
- **Output**: Published posts + confirmation + link to published content

### MARKOS-AGT-SOC-03: Community Manager
- **Role**: Monitor, draft responses to, and manage social inbox (comments + DMs + mentions)
- **Input**: Social inbox streams from all connected platforms
- **Output**: Response drafts for human approval (or auto-response for defined scenarios) + escalation routing
- **See**: `03-SOCIAL-DEEP-INTEGRATION.md` for full architecture

### MARKOS-AGT-SOC-04: Social Listener
- **Role**: Brand mention monitoring, sentiment analysis, trending topic detection
- **Input**: Brand keywords + competitor keywords + industry topics
- **Output**: Daily listening digest + immediate alerts on spikes or sentiment shifts

### MARKOS-AGT-SOC-05: Influencer Scout
- **Role**: Identify and qualify influencers/creators for brand partnerships
- **Input**: Target audience archetype + budget range + platform + category
- **Output**: Ranked creator list with: follower count, engagement rate, audience fit score, content examples, estimated CPM

### MARKOS-AGT-SOC-06: Creator Brief Manager
- **Role**: Generate and manage briefs for influencer/creator partnerships
- **Input**: Campaign goals + creator profile + brand voice pack + compliance requirements
- **Output**: Creator brief with: deliverables, messaging guidelines, do/don't list, FTC disclosure requirements, tracking setup

### MARKOS-AGT-SOC-07: Social Analytics Reporter
- **Role**: Social performance reporting and insight extraction
- **Input**: Platform analytics APIs for all connected channels
- **Output**: Weekly social report: reach, engagement, top performers, trend analysis, recommendations

### MARKOS-AGT-SOC-08: Hashtag & SEO Strategist (Social)
- **Role**: Hashtag strategy, keyword strategy for social platforms, TikTok/YouTube SEO
- **Input**: Content topics + platform analytics + trending data
- **Output**: Hashtag sets per post, keyword guidance for video titles/descriptions

### MARKOS-AGT-SOC-09: Paid Social Manager
- **Role**: Manage paid social campaigns across Meta, LinkedIn, TikTok, X, Pinterest
- **Input**: Campaign brief + budget + audience targeting + creative assets
- **Output**: Campaign setup (via API), optimization actions, performance reports
- **Platforms**: Meta Ads API, LinkedIn Campaign Manager API, TikTok Marketing API, X Ads API

### MARKOS-AGT-SOC-10: Crisis Comms Monitor
- **Role**: Detect and escalate potential social media crises
- **Input**: Social listening stream + sentiment thresholds
- **Output**: Crisis alerts with severity scoring, recommended response approach, holding statement drafts

---

## Tier 6 — Paid Media & Growth Agents

### MARKOS-AGT-PAID-01: Google Ads Optimizer
- **Role**: Manage and optimize Google Ads accounts (search, display, Shopping, YouTube, PMax)
- **Input**: Google Ads API access + campaign goals + budget
- **Output**: Campaign changes (bid adjustments, budget reallocation, negative keywords, ad copy variants)
- **Approval**: Changes above threshold require operator approval

### MARKOS-AGT-PAID-02: Meta Ads Optimizer
- **Role**: Manage and optimize Meta advertising (Facebook, Instagram, Messenger)
- **Input**: Meta Marketing API access + campaign goals + creative assets
- **Output**: Campaign structure, audience testing, creative rotation, budget optimization

### MARKOS-AGT-PAID-03: LinkedIn Ads Manager
- **Role**: B2B-focused LinkedIn campaign management
- **Input**: LinkedIn Campaign Manager API + ICP definition + content assets
- **Output**: Campaign targeting, InMail sequences, thought leadership amplification

### MARKOS-AGT-PAID-04: CRO Hypothesis Generator
- **Role**: Generate and prioritize CRO tests for landing pages, funnels, checkout
- **Input**: Analytics data + heatmap data + conversion funnel analysis
- **Output**: Prioritized test backlog with: hypothesis, expected impact, implementation spec, success metric

### MARKOS-AGT-PAID-05: Attribution Modeler
- **Role**: Build and maintain marketing attribution models
- **Input**: All channel data + CRM pipeline data + revenue data
- **Output**: Multi-touch attribution model, channel contribution analysis, MMM-calibrated ROAS per channel

---

## Tier 7 — Lead Generation & Pipeline Agents

### MARKOS-AGT-LG-01: B2B Prospector
- **Role**: Identify, enrich, and prioritize outbound prospects for B2B lead generation
- **Input**: ICP definition + territory rules + intent data + exclusion lists
- **Output**: Prioritized prospect list with: contact data, firmographic data, technographic data, intent signals, personalization hooks

### MARKOS-AGT-LG-02: Cold Outreach Sequencer
- **Role**: Design and execute multi-touch cold outreach sequences
- **Input**: Prospect list + ICP + pain tag + campaign goal
- **Output**: Personalized email sequences + LinkedIn connection requests + follow-up timing logic

### MARKOS-AGT-LG-03: B2C Acquisition Designer
- **Role**: B2C/DTC acquisition campaign design across paid and organic
- **Input**: Product catalog + audience segments + budget + channel mix
- **Output**: Acquisition campaign architecture: channel mix, audience targeting, creative direction, landing page spec

### MARKOS-AGT-LG-04: Landing Page Optimizer
- **Role**: Continuous landing page optimization based on conversion data
- **Input**: Analytics data + heatmap data + A/B test results + message-market fit analysis
- **Output**: Page optimization recommendations, copy variants, layout changes, CTA testing plan

### MARKOS-AGT-LG-05: Lead Nurture Architect
- **Role**: Design lifecycle nurture sequences from lead to MQL to SQL
- **Input**: Lead segments + CRM stage definitions + content library + sales handoff criteria
- **Output**: Full nurture architecture: sequences, triggers, content mapping, scoring rules, handoff logic

### MARKOS-AGT-LG-06: Demo Engine Coordinator
- **Role**: Coordinate demo booking, personalization, follow-up, and intelligence gathering
- **Input**: Prospect profile + product info + demo request trigger
- **Output**: Personalized demo prep brief, booking confirmation, follow-up sequence, CRM update
- **Integrates with**: Cal.com/Calendly API, CRM, demo platform

---

## Tier 8 — Analytics & Intelligence Agents

### MARKOS-AGT-ANA-01: Performance Analyst
- **Role**: Narrative analytics — what happened, why, what to do about it
- **Input**: All channel performance data + business metrics
- **Output**: Weekly performance narrative: highlights, lowlights, root cause analysis, recommended actions

### MARKOS-AGT-ANA-02: Data Scientist
- **Role**: Quantitative analysis — MMM, incrementality modeling, cohort analysis, CLV modeling
- **Input**: Historical performance data + experimental data + business outcomes
- **Output**: Statistical models, scenario plans, budget optimization recommendations

### MARKOS-AGT-ANA-03: Funnel Analyst
- **Role**: Step-by-step funnel performance diagnosis
- **Input**: Analytics data + CRM stage data + conversion events
- **Output**: Funnel health report: conversion rates per step, drop-off analysis, optimization opportunities

### MARKOS-AGT-ANA-04: Revenue Intelligence Reporter
- **Role**: Connect marketing activity to pipeline and revenue outcomes
- **Input**: CRM deal data + channel performance + attribution model
- **Output**: Revenue contribution report: pipeline created, influenced, converted per channel and campaign

### MARKOS-AGT-ANA-05: Anomaly Detector
- **Role**: Detect performance anomalies and surface them before they become crises
- **Input**: All metrics streams + baseline models
- **Output**: Anomaly alerts with: metric, magnitude, probable cause, recommended investigation path

---

## Tier 9 — Operations & Infrastructure Agents

### MARKOS-AGT-OPS-01: Calendar Coordinator
- **Role**: Manage content calendar — scheduling, dependencies, resource allocation, deadline tracking
- **Input**: Content plan + team availability + platform optimal timing data
- **Output**: Published calendar with: assignment, deadline, publish schedule, dependencies

### MARKOS-AGT-OPS-02: Meeting Intelligence Agent
- **Role**: Pre-meeting research, during-meeting support, post-meeting capture
- **Input**: Meeting invitation + attendee profiles + CRM context
- **Output**: Meeting prep brief, conversation guide, post-meeting summary + action items + CRM update + follow-up trigger

### MARKOS-AGT-OPS-03: Workflow Automator
- **Role**: Design and implement marketing automation workflows
- **Input**: Workflow requirements + platform capabilities (HubSpot, Klaviyo, etc.)
- **Output**: Automation workflow specification + implementation instructions

### MARKOS-AGT-OPS-04: Budget Monitor
- **Role**: Track marketing spend against budget, alert on anomalies, forecast burn rate
- **Input**: All channel spend data + approved budgets
- **Output**: Daily budget status, over/under-pacing alerts, end-of-period projections

### MARKOS-AGT-OPS-05: Compliance Checker
- **Role**: Verify marketing content for regulatory compliance before publish
- **Input**: Content draft + channel + regulatory requirements (GDPR, CAN-SPAM, FTC, EU AI Act, platform policies)
- **Output**: Compliance report with: pass/fail per requirement, required changes

---

## Tier 10 — Learning & Platform Agents

*(New agents from self-evolving architecture)*

### MARKOS-AGT-LIT-01: Literacy Scout *(from 08-SELF-EVOLVING)*
### MARKOS-AGT-LIT-02: Performance Synthesizer *(from 08-SELF-EVOLVING)*
### MARKOS-AGT-LIT-03: Tenant Overlay Refresher *(from 08-SELF-EVOLVING)*
### MARKOS-AGT-LIT-04: Literacy Promoter *(from 08-SELF-EVOLVING)*

---

## Agent Interaction Patterns

### Pattern 1: Full Campaign Launch

```
Grand Strategist (01)
  → Campaign Planner (02)
    → Audience Builder (AUD-01)
    → Deep Researcher (RES-01)
    → Content Strategist (CONT-01)
      → [parallel]:
        ├─ Content Brief Writer (CONT-02) → Long-Form Creator (CONT-03) → Content Editor (CONT-10) → SEO Optimizer (CONT-11)
        ├─ Short-Form Copy Writer (CONT-04) [x5 variants]
        └─ Email Sequence Writer (CONT-05)
      → [parallel]:
        ├─ Social Publisher (SOC-02)
        ├─ Google Ads Optimizer (PAID-01)
        └─ Meta Ads Optimizer (PAID-02)
    → Performance Analyst (ANA-01) [ongoing]
    → Anomaly Detector (ANA-05) [ongoing]
```

### Pattern 2: Social Channel Operation (Daily)

```
Social Listener (SOC-04) [continuous]
  → Community Manager (SOC-03) [on new DMs/comments]
    → operator approval gate (configurable thresholds)
      → published responses

Social Publisher (SOC-02) [scheduled]
  → publishes approved content per calendar

Social Analytics Reporter (SOC-07) [weekly]
  → performance report → feeds Content Strategist update
```

### Pattern 3: Inbound Lead Processing

```
trigger: form fill / demo request / content download

Lead Scorer (AUD-03)
  → B2B Prospector enrichment (LG-01) [if B2B]
  → CRM update
  → routing decision:
    ├─ High score → Meeting Intelligence Agent (OPS-02) → demo booking
    ├─ Medium score → Lead Nurture Architect (LG-05) → sequence activation
    └─ Low score → re-targeting audience update
```

### Pattern 4: Weekly Intelligence Cycle

```
Sunday night:
  Market Scanner (RES-03) [produces weekly trend report]
  Competitive Intelligence Monitor (RES-02) [produces weekly competitive digest]
  Social Analytics Reporter (SOC-07) [produces weekly social report]
  Performance Analyst (ANA-01) [produces weekly performance narrative]
  OKR Monitor (STR-05) [produces OKR health report]
  Anomaly Detector (ANA-05) [reviews the week for anomalies]

Monday morning:
  → All reports consolidated into weekly operator brief
  → Recommended actions surfaced for approval
  → Calendar for the week confirmed
```
