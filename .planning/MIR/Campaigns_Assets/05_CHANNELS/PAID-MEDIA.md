# PAID-MEDIA — MarkOS by esteban.marketing

## PAID MEDIA STATUS

Current status: Pre-launch / organic-first / paid pending first 10 clients
First paid channel activation: LinkedIn Ads
Paid activation trigger: After 10 beta agency clients onboarded and $2,000 MRR achieved <!-- Decision assumption: conservative early-stage trigger -->

## BUDGET FRAMEWORK

Total monthly paid budget (at activation): $1,500 <!-- Estimated: early-stage, single-channel focus -->
Allocation model:

Awareness: 50%
Conversion: 30%
Retargeting: 20%

Budget per channel:

LinkedIn Ads: $1,000 — Primary channel for agency/SaaS ICP, best targeting granularity
Google Search: $300 — Branded and competitor terms, capture high-intent buyers
Meta Ads: Not yet — B2B tool, Meta is secondary
Retargeting (cross-channel): $200 — Focused on LinkedIn and Google Display

## TARGETING ARCHITECTURE

### LinkedIn Ads (Primary Channel)

**Audience 1: Agency Owners — Cold**
- Job title targeting: Marketing Agency Owner, Founder, CEO, Managing Director
- Company size: 1–50 employees
- Industry: Marketing & Advertising, Internet
- Geography: Colombia, Mexico, Argentina, Chile, US, Canada, UK, Spain
- Exclusions: Non-decision-maker roles (e.g., Account Executive, Junior Marketer)

**Audience 2: SaaS Founders — Cold**
- Job title targeting: Founder, Co-Founder, CEO, Head of Marketing
- Company size: 1–50 employees
- Industry: Computer Software, Internet, Technology
- Seniority: Owner, CXO

**Audience 3: Retargeting — Website Visitors**
- Insight Tag required: Yes — install on esteban.marketing
- Window: 30 days
- Message shift: More direct — skip awareness, focus on outcome and proof

**Audience 4: Lookalike — From Activated Users**
- Seed: Uploaded customer list (activated MarkOS users)
- Expansion: 1% similarity (tightest)

### Google Search (Secondary — Branded + Competitor)

**Campaign 1: Branded**
- Keywords: markos, markos AI, esteban.marketing, MarkOS marketing agent
- Match type: Exact + Phrase
- Goal: Capture anyone who already knows the brand

**Campaign 2: Competitor Terms**
- Keywords: jasper alternative, copy ai alternative, AI marketing agent, AI CMO
- Match type: Phrase
- Goal: Intercept comparison-stage buyers

**Campaign 3: High-Intent Generic**
- Keywords: AI marketing tool, marketing automation AI, AI CMO
- Match type: Phrase
- Goal: Awareness-to-consideration traffic

## CREATIVE RULES FOR PAID ADS

### LinkedIn Ad Creative Standards
- Image format: 1200x627px, dark background, minimal text, product UI screenshot or bold claim
- Headline formula for cold: "[Pain point]? MarkOS [claim]. [Proof point]"
- Headline character limit: 70 characters (LinkedIn spec)
- Body copy rule: Lead with pain, not product
- CTA options approved: Download, Learn More, Sign Up (use "Install" for product pages, "Learn More" for awareness)
- What to never show in ad creative: Stock photos, generic AI icons, buzzwords, fake testimonials, overpromising claims

### Copy Hooks — Approved Formulas
- Hook 1 (pain-lead): "68% of agencies still build briefs manually. MarkOS automates it."
- Hook 2 (outcome-lead): "First campaign live in 48 hours. No CMO required."
- Hook 3 (contrast): "What a 3-person agency looks like with and without MarkOS."
- Hook 4 (authority): "Built by esteban.marketing — trusted by agency founders."
- Hook 5 (proof): "Track every campaign to install — not just impressions."
- Hook 6 (team leverage): "Multiply your output, not your headcount."

## LANDING PAGE DESTINATIONS

| Campaign                | Destination URL                        | CTA         | Conversion Goal         |
|-------------------------|----------------------------------------|-------------|------------------------|
| LinkedIn Cold — Agency  | https://esteban.marketing/agency       | Install     | Install / Demo request |
| LinkedIn Cold — SaaS    | https://esteban.marketing/saas         | Install     | Install                |
| Google Branded          | https://esteban.marketing              | Install     | Install                |
| Google Competitor       | https://esteban.marketing/vs/jasper    | Install     | Install / Email capture|
| Retargeting             | https://esteban.marketing/onboarding   | Demo        | Demo / Direct contact  |

## ATTRIBUTION SETUP FOR PAID

- LinkedIn: Insight Tag + LinkedIn conversion event
- Google: GA4 linked + Google Ads conversion import
- UTM structure: See TRACKING.md UTM taxonomy
- ROAS target: Not applicable pre-revenue; optimize for CPI (cost per install)
- Primary KPI for paid at launch: Cost per Install (CPI)
- Secondary KPI: Install-to-Activation rate from paid traffic

## RETARGETING SEQUENCES

### Sequence 1: Homepage Visitor (No CTA click) — 0–7 days
- Platform: LinkedIn
- Message: "Still building briefs by hand? MarkOS automates your workflow."
- Frequency cap: 4 impressions / week

### Sequence 2: Install Page Visitor (No install) — 0–14 days
- Platform: LinkedIn + Google Display
- Message: "Worried MarkOS is too technical? Install in 30 minutes — no dev required."
- Frequency cap: 5 impressions / week

### Sequence 3: Installed (No activation) — 0–30 days
- Platform: LinkedIn
- Message: "Your MIR is empty — activate your agent for full value."
- Frequency cap: 3 impressions / week
