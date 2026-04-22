# MarkOS Content Engine
## Full Content Pipeline: Strategy → Brief → Create → Publish → Measure

---

## The Content Operating System

Content is the fuel that runs every other MarkOS module. The social operating system needs
content to publish. The paid media system needs creative assets. The SEO strategy needs
articles to rank. The email system needs sequences to send. The demo engine needs product
narratives. The research engine produces content. The CRM needs case studies and battle cards.

MarkOS doesn't have a "content tool." It has a **content operating system** — a pipeline
that takes business objectives as input and produces a continuous flow of instrumented,
brand-calibrated, multi-channel content as output.

---

## Stage 1: Content Strategy

*Runs quarterly with monthly updates*

Agent: Content Strategist (CONT-01)

### Inputs consumed

- SEO data: GSC keyword universe, position data, click potential
- Competitive content analysis: what competitors are ranking for that we're not
- Audience archetype library: what each persona needs at each stage
- Pain-point taxonomy: all 8 parent tags + sub-tags mapped to content opportunities
- Business goals: pipeline targets, product launches, seasonal priorities
- Content performance: what has worked historically (from performance log)
- Market trends: emerging topics from Market Scanner (RES-03)

### Output produced

**Pillar / Cluster / Atomic Architecture**

The content library is organized as a graph, not a list:

*Pillar pages* (5–10 per domain, 3,000–5,000 words):
- One per major topic the brand wants to own
- Comprehensive: covers the topic more thoroughly than any single competitor page
- Internal hub: links to all cluster content on that topic
- Optimized for: broad, high-volume head term

*Cluster pages* (20–50 per domain, 1,500–2,500 words):
- Specific sub-topics within each pillar
- Optimized for: specific, mid-volume, buyer-intent keywords
- Internal spokes: link back to pillar + to related clusters

*Atomic content* (unlimited, 500–1,500 words):
- Answers specific questions, explains specific concepts
- Often cited by GEO/AI answer engines because they're direct + quotable
- Targets: long-tail, question-based, featured-snippet-eligible queries

**30-Day Content Calendar Output**

```yaml
period: 2026-06-01 to 2026-06-30
pillar_content:
  - title: "The Complete Guide to Marketing Attribution in 2026"
    target_keyword: "marketing attribution"
    search_volume: 14,400/mo
    keyword_difficulty: 68
    pain_tag: attribution_measurement
    funnel_stage: consideration
    format: long_form_guide
    word_count_target: 4,200
    assigned_agent: CONT-03
    brief_due: 2026-05-28
    draft_due: 2026-06-05
    publish_target: 2026-06-10

cluster_content:
  - title: "Marketing Mix Modeling vs Multi-Touch Attribution: Which Is Right?"
    parent_pillar: "The Complete Guide to Marketing Attribution"
    target_keyword: "mmm vs mta attribution"
    format: comparison_article
    word_count_target: 1,800
    publish_target: 2026-06-17

social_content:
  - platform: linkedin
    theme: attribution_theme_week
    post_count: 5
    formats: [short_post, document_post, case_study_post]
    content_agent: CONT-06

email_content:
  - sequence: lead_nurture_measurement_segment
    emails: 3
    theme: attribution_measurement
    content_agent: CONT-05
```

---

## Stage 2: Content Brief Generation

*Runs per piece, triggered by calendar*

Agent: Content Brief Writer (CONT-02)

### What makes a MarkOS brief different

A brief from MarkOS is not a topic + word count. It is a complete intelligence package
that any agent (or human) could use to produce the optimal piece of content for that
topic, audience, and goal.

### Brief schema

```yaml
brief_id: uuid
created_at: ISO8601
assigned_to: CONT-03  # or human writer

# Target
title_options:
  - primary: "Marketing Attribution in 2026: MMM, MTA, and Incrementality Explained"
  - alt_1: "The Complete Guide to Marketing Attribution"
  - alt_2: "How to Prove Your Marketing Is Working (2026 Attribution Guide)"

target_keyword: "marketing attribution"
secondary_keywords:
  - "multi-touch attribution"
  - "marketing mix modeling"
  - "incrementality testing"
  - "attribution models"
  
# Audience
target_archetype: growth_gina  # Head of Growth, seed-to-A SaaS
pain_tag: attribution_measurement
funnel_stage: consideration
reader_expertise_level: intermediate  # familiar with marketing, not expert in attribution

# SEO Intelligence
serp_analysis:
  top_10_avg_word_count: 2,850
  featured_snippet_present: true
  featured_snippet_format: definition + list
  people_also_ask:
    - "What is the best marketing attribution model?"
    - "How do you calculate marketing ROI?"
    - "What is multi-touch attribution?"
  content_gaps: # things top 10 don't cover well
    - "incrementality testing as attribution calibration"
    - "2026 cookie-deprecation impact on MTA"
    - "how to choose attribution model for your company size"

# GEO Intelligence
geo_targets:
  - AI_overview: optimize lede for featured in Google AI Overview
  - ChatGPT_search: structure FAQ section for direct quotes
  - Perplexity: ensure claims are sourced + verifiable
  ai_quotable_statements:
    - "Marketing Mix Modeling (MMM) is a statistical method that uses aggregate sales and spend data to measure the causal effect of each marketing channel on revenue."
    - "Multi-touch attribution assigns credit for a conversion to multiple customer touchpoints — not just the last click."

# Content Architecture
word_count_target: 4,200
structure:
  - H1: primary title
  - intro: 200 words — open with the problem, why attribution matters now, what this guide covers
  - H2: "Why Marketing Attribution Matters More Than Ever in 2026" (500 words)
    - cookie deprecation impact
    - privacy changes breaking MTA
    - the rise of MMM as the modern approach
  - H2: "The Three Attribution Methods You Need to Know" (800 words)
    - MTA: how it works, when it's useful, limitations
    - MMM: how it works, when it's useful, limitations
    - Incrementality testing: how it works, the gold standard
  - H2: "How to Choose the Right Attribution Approach for Your Company" (600 words)
    - by company size / data maturity
    - by channel mix
    - decision framework table
  - H2: "Implementing Attribution: A Practical Playbook" (1,200 words)
    - setting up proper tracking
    - running your first MMM
    - designing incrementality tests
    - the unified measurement approach
  - H2: "Common Attribution Mistakes to Avoid" (400 words)
  - FAQ: (500 words) — 6–8 questions from PAA
  - Conclusion + CTA (200 words)

# Proof Requirements
required_evidence:
  - statistic: cite current benchmark for iOS 14 impact on MTA accuracy
  - case_study: include one real-world example of company using MMM
  - tool_references: mention Google Meridian, Meta Robyn by name
  source_quality_bar: peer-reviewed or industry-recognized publication preferred

# Brand Voice Constraints
voice_requirements:
  register: professional  # technical audience, not casual
  jargon_level: medium  # explain terms on first use
  tone: authoritative but accessible  # not preachy, not basic
  anti_patterns: [avoid "delve", avoid "in today's fast-paced world", no intro that starts with "In marketing..."]
  
# Internal Linking
internal_links_required:
  - text: "Marketing Mix Modeling" → /blog/marketing-mix-modeling
  - text: "incrementality testing" → /blog/incrementality-testing-guide
  - text: "UTM parameters" → /blog/utm-tracking-guide
external_authority_links:
  - Google Meridian documentation
  - Meta Robyn GitHub (signals technical credibility)

# Performance Targets
target_metrics:
  organic_traffic_6mo: 2,000 sessions/month
  featured_snippet: true
  ai_engine_citations: true
  backlink_target: 15 referring domains in 6 months
```

---

## Stage 3: Content Creation

*Multi-agent, parallelized by content type*

### Long-Form Content Pipeline

Agent: Long-Form Content Creator (CONT-03) → Content Editor (CONT-10) → SEO Optimizer (CONT-11)

Stage 3a — Draft generation (CONT-03):
- Receives complete brief
- Pulls relevant literacy nodes as research context
- Generates first draft following structure in brief
- Self-evaluates against: structure adherence, evidence requirements, reading level

Stage 3b — Editing (CONT-10):
- Voice calibration: score against brand pack, rewrite any below-threshold sections
- Fact-check pass: every claim verified against literacy corpus or flagged for sourcing
- Readability: sentence length, jargon, flow
- Internal link implementation: required links inserted at natural points

Stage 3c — SEO optimization (CONT-11):
- On-page SEO: keyword placement in H1, H2s, first 100 words, image alt text
- Schema markup: Article schema + FAQPage schema
- GEO optimization: lede rewritten for AI quotability, FAQ section formatted for PAA
- Internal link audit: all required links present and contextually appropriate
- Meta title + description: A/B variants generated

Stage 3d — Human review:
- Operator receives full draft with: voice score, SEO score, fact-check report
- Single-pass approval or redline feedback
- Approval triggers publish workflow

### Multi-Format Content Generation

One long-form piece → multiple formats via Content Repurposer (CONT-09):

```
Blog post: "The Complete Guide to Marketing Attribution in 2026"
↓
LinkedIn long-form post: Key insight thread (5 posts × 2-day spacing)
LinkedIn document post: Summary of the 3 attribution methods (carousel PDF)
Email newsletter: "What we published this week + the most useful takeaway"
X thread: 8-tweet breakdown of the attribution decision framework
Short-form blog: "MMM vs MTA: The 2-minute breakdown" (800 words, links to full guide)
Video script: YouTube explainer on the same topic (8-minute script)
Podcast talking points: If tenant has a podcast, talking points for an episode
```

Each repurposed format gets full voice classifier pass + is published natively — not copy-pasted.

---

## Stage 4: Content Publishing System

### Publication Workflow

```
approved content
  ↓
Content Calendar Manager (OPS-01):
  - schedule slot confirmed
  - platform-specific formatting applied
  - UTM parameters appended to all links
  - internal links verified live
  - images optimized (WebP, correct dimensions per platform)
  
  ↓
Platform dispatch:
  - Blog/website: CMS API (WordPress, Webflow, Contentful, Ghost)
  - LinkedIn: LinkedIn Pages API
  - X: X API v2
  - Instagram/Meta: Graph API
  - TikTok: TikTok Content Posting API
  - Email: ESP API (Klaviyo/Customer.io/Resend)
  - YouTube: YouTube Data API (upload + metadata)
  
  ↓
Publication confirmed:
  - URL recorded in content performance log
  - CRM activity: "blog post published" logged
  - UTM links tracked in link management system
  - Internal team notification
```

### Content Performance Tracking

Within 48h of publication, performance tracking is active:

Blog content:
- GA4: sessions, time on page, scroll depth, conversion events
- GSC: impressions, clicks, CTR, position (lags ~3 days)
- Social shares and backlinks (weekly)

Social content:
- Platform API: reach, impressions, engagement (per post)
- Link clicks tracked via UTM
- DMs/comments generated (social inbox)
- Save rate (Instagram/LinkedIn document posts)

Email content:
- Open rate, CTR, unsubscribe (ESP API)
- Revenue attributed (e-commerce tenants)
- Reply rate (cold email + transactional)

---

## Stage 5: Content Measurement & Iteration

### The Content Performance Loop

Every published piece is tracked through the performance dimension registry (from `08-SELF-EVOLVING-ARCHITECTURE.md`).

The Content Strategist uses performance data to:
- Identify which topics → pipeline at each stage
- Identify which formats → engagement at each platform
- Identify which hooks → CTR on social
- Identify which CTAs → conversion from content

This data directly informs the next content calendar. The system learns.

### Content Decay Management

Content ages. Keywords shift. Platforms change. MarkOS manages this:

- Monthly: flag posts that have dropped >20% in organic traffic (GSC comparison)
- Quarterly: full content audit of all posts older than 6 months
- On-demand: when a keyword ranking drops significantly

Content refresh workflow:
- SEO Auditor (RES-06): diagnose why the content lost position
- Content Brief Writer (CONT-02): create update brief (not a full brief — a diff brief)
- Content Editor (CONT-10): apply updates + add fresh data + update date
- SEO Optimizer (CONT-11): re-optimize for current SERP landscape
- Republish: updated "last modified" date signals freshness to Google

---

## Content Calendar & Asset Management

### The Content Calendar System

Visual calendar view in MarkOS UI:
- Week and month views
- Per-channel columns: blog, LinkedIn, X, Instagram, email, YouTube
- Status tracking: brief → draft → review → approved → scheduled → published
- Dependency tracking: social posts that promote a blog post are linked
- Performance overlay: after publication, engagement data appears on the calendar

### Asset Management (DAM Lite)

All generated media assets stored in MarkOS:
- Images: generated visuals, stock photos, brand screenshots
- Templates: Canva/Figma-compatible templates for recurring formats
- Brand assets: logos, fonts, color palettes (version controlled)
- Video assets: scripts, thumbnails, B-roll direction notes

Assets tagged with:
- Brand compliance status (approved/pending/rejected)
- Channel and format they're designed for
- Campaign they belong to
- Performance data (if used in published content)
