---
token_id: MGSD-RES-CNT-01
document_class: RESEARCH
version: "1.0.0"
status: populated
populated_by: mgsd-onboarder
populated_at: 2025-07-18
feeds_into:
  - MIR/Campaigns_Assets/
---

# Content Audit — MarkOS

<!-- mgsd-token: RESEARCH -->

> [!NOTE] Pre-alpha state: MarkOS has 0 installs and no published content at time of writing. This audit documents the baseline (empty) and provides the strategic content roadmap for the launch phase.

---

## Existing Content Inventory

**Current state: No published content exists. Pre-alpha, pre-launch.**

| Asset | Format | Channel | Status | Performance |
|-------|--------|---------|--------|-------------|
| GitHub README | Technical documentation | GitHub | Exists (functional, not optimized) | 0 stars, 0 forks |
| CHANGELOG.md | Changelog | GitHub | Exists | Not yet user-visible |
| package.json description | 1-line description | npm | Exists | Generic |
| onboarding/index.html | Web UI | localhost only | Exists | Not publicly deployed |

**Foundation assets that exist but are not yet content-optimized:**
- The codebase itself is the best product demo — an honest GitHub README teardown is the highest-leverage first content asset
- The MIR/MSP template structure (78+80 files) is publishable as an open framework — substantial educational content value
- The ARCH-DIAGRAM.md and TECH-MAP.md created during codebase mapping are internal but could be adapted as technical blog content

Source: Codebase review, Gate 1 intake. Confidence: High.

---

## Top Performers Analysis

**No content exists to analyze.** Documenting the performance hypothesis for what will perform well based on audience research:

**Predicted top performers (hypothesis — to be validated with first 60 days of data):**

| Content Type | Why It Should Perform | Format | Channel |
|-------------|----------------------|---------| -------|
| "How the MIR/MSP architecture works" technical teardown | Developer audience responds to mechanism explanation over marketing claims. Architecture diagrams + explanation = high-trust content. | X thread (10-12 posts) + linked GitHub | X/Twitter |
| "I installed this and here's what happened" live experience post | Social proof via transparent experience. Technical audience trusts first-person honest assessments. | X thread or Reddit post | X, r/SideProject |
| The `npx` install as standalone CTA | The install command is the pitch. "Run this, see structural marketing intelligence in 60 seconds" is the most compelling demo possible. | X post + GitHub README | X, GitHub |
| Framework explanation: "What is a Marketing OS?" | Category creation content — educates on the problem before positioning the solution. SEO long-term, community engagement short-term. | Blog post + X thread | Personal blog + X |
| Open-sourced MIR template walkthrough | Publishing the template structure as standalone educational content drives GitHub engagement and community recognition | GitHub README section + X thread series | GitHub + X |

**Why these will perform based on audience research:**
Technical audiences (SEG-001, SEG-003) evaluate tools through architecture, not marketing copy. Content that teaches the mechanism creates more install intent than content that promises outcomes. Source: AUDIENCE-RESEARCH.md (psychographic profile, vocabulary analysis). Confidence: Medium.

---

## Content Gap Map

**Critical gaps (blocking launch):**

| Gap | Funnel Stage | Priority | Format | Deadline |
|-----|-------------|---------|--------|---------|
| GitHub README optimization | All stages (discovery + evaluation) | P0 | Technical documentation | Before launch |
| "What is MarkOS" single-page explainer | Awareness → Consideration | P0 | Landing page or README section | Before launch |
| `npx` install quick-start guide | Decision → Activation | P0 | README + CLI output | Before launch |
| "Marketing OS" category definition post | Awareness (category creation) | P1 | X thread or blog | Week 1 post-launch |
| Architecture walkthrough (MIR/MSP explanation) | Consideration | P1 | X thread + diagram | Week 2 |
| First pilot offer / pilot scope document | Decision | P1 | README section or landing page | Week 2 |

**High-value gaps (next 30 days):**

| Gap | Funnel Stage | Format |
|-----|-------------|--------|
| Developer community origin story | Awareness | X thread ("why I built this") |
| MarkOS's own MIR files published (meta-proof) | Consideration | GitHub / blog |
| Competitor contrast piece ("how MarkOS is different from AI writing tools") | Consideration | Blog post |
| "First 30 days of installs" transparency report | Social proof (Consideration) | X thread / blog |
| JTBD framework published as standalone tool | Awareness / SEO | GitHub README / blog |

**No SEO content gap yet:** At 0 traffic, programmatic SEO and long-tail keyword content are not yet leverage-relevant. Revisit at 1,000 organic sessions/month.

Source: AUDIENCE-RESEARCH.md, PRODUCT-RESEARCH.md, Gate 1 goals (200 installs, 10 pilots). Confidence: High on gap identification, Medium on priority order.

---

## Reusable Asset Library

**Foundational assets to build (first 30 days):**

| Asset | Description | Reuse Potential |
|-------|-------------|-----------------|
| Architecture diagram (MIR/MSP breakdown) | Visual explanation of MIR vs. MSP vs. override layer | Use in: README, X threads, blog, pilot decks |
| `npx install` screen recording / GIF | Shows the scaffold in action — files appearing in 60 seconds | Use in: README, X posts, HN launch, any social |
| "10 marketing things MarkOS does in <10 commands" demo | Rapid-fire capability demonstration | Use in: Product Hunt launch, X threads |
| MIR template structure diagram | Shows the 78-file intelligence architecture visually | Use in: Developer blog, X, community posts |
| Gate 1/Gate 2 explained diagram | Visual explainer for the gate system | Use in: Onboarding docs, community education |
| "MarkOS = [familiar things] for marketing" metaphor bank | Analogies that land with developers: "MIR is like a schema.prisma but for your marketing brain" | Use in: All social content, README |

**Reuse strategy:** Every long-form asset should be broken into at least 5 short-form derivatives. One blog post → 3 X threads + 1 Reddit post + 1 GitHub issue discussion. This maximizes content leverage with a 1-person team at $0 budget.

Source: Gate 1 constraints ($0 budget, 1-person team), AUDIENCE-RESEARCH.md (channel preferences). Confidence: High.

---

## Channel Performance Summary

**Current state: No channels active. No performance data.**

**Channel performance tracker (to be updated at 30-day milestone):**

| Channel | Status | Launch Target | 30-Day Target | Measurement |
|---------|--------|--------------|--------------|-------------|
| GitHub README | Exists, unoptimized | Optimized before launch | 50 stars | GitHub star count |
| X/Twitter (@markos or founder account) | Not yet set up | Launch week | 200 followers | Follower growth, link clicks to install |
| Reddit (r/SideProject, r/entrepreneur) | Not yet active | Week 1 post-launch | 3 authentic posts | Post upvotes, install attribution |
| Hacker News Show HN | Not yet | Week 2-4 | 1 launch submission | Points, comments, install attribution |
| npm package discovery | Exists at install | Optimize tags | Listed by 30 days | Weekly downloads |

**Attribution model:** PostHog `npx_install_complete` event with UTM source tagging. Each channel gets a unique UTM: `utm_source=github`, `utm_source=twitter`, `utm_source=reddit`, `utm_source=hn`. Install source attribution is the primary performance metric.

Source: Gate 2 TRACKING.md (PostHog events, UTM framework), KPI-FRAMEWORK.md (channel KPIs). Confidence: High on framework, N/A on performance data (pre-launch).

---
*Research Quality Gate: All sections include evidence source, confidence level, and strategic implication.*
*Last populated: 2025-07-18 | Populated by: mgsd-onboarder | Source: Gate 1 + Gate 2 MIR intake*
*Next update: 30-day post-launch milestone with real performance data*
