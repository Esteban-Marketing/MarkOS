# MarkOS Intelligence Layer
## External Data Connections, Audit Capabilities & Diagnostic Architecture

---

## Philosophy: Data That Acts, Not Data That Reports

Every external data connection in MarkOS serves one purpose: informing agent decisions.

Not building dashboards. Not replacing GA4. Not making reports prettier.

When MarkOS pulls your GSC data, it's because the Content Strategist is about to generate
next month's content plan and needs to know which keywords you're close to ranking for.
When it pulls your Google Ads data, it's because the Paid Media Auditor found a 23% impression
share decline and the Google Ads Optimizer needs context before recommending a response.
When it pulls BuiltWith data on a prospect, it's because the B2B Prospector is generating
a personalized outreach email and needs to know what tools they use.

Data serves agents. Agents serve operators.

---

## Full Integration Map

### Category 1: Performance Analytics

**Google Analytics 4 (GA4)**

Access: GA4 Data API + Admin API
Authentication: Service Account with Viewer + Editor roles

Capabilities:
- Traffic analysis: sessions, users, bounce rate, engagement rate per page/source/campaign
- Conversion tracking: goals, events, e-commerce transactions
- Audience analysis: demographics, behavior, tech stack, geography
- Path analysis: user journeys from acquisition to conversion
- Real-time data: live users, live conversions
- Custom dimensions: MarkOS injects UTM parameters that map to our campaign/agent attribution model
- Funnel exploration: step-by-step conversion funnel visualization
- Cohort analysis: retention and LTV by acquisition cohort

Agents that consume GA4 data:
- Analytics Auditor (RES-08): full GA4 health audit
- Funnel Analyst (ANA-03): conversion funnel diagnosis
- Performance Analyst (ANA-01): weekly narrative
- Landing Page Optimizer (LG-04): page-level conversion analysis
- Content Strategist (CONT-01): top-performing content discovery
- Anomaly Detector (ANA-05): traffic and conversion anomaly alerts

Schema for GA4 signal in MarkOS:
```yaml
ga4_signal:
  property_id: string
  date_range: {start, end}
  dimensions: [page_path, session_source, session_medium, session_campaign]
  metrics: {sessions, users, bounce_rate, avg_session_duration, conversions, conversion_rate}
  segment: string | null
```

---

**PostHog**

Access: PostHog API (cloud or self-hosted)
Authentication: Project API key

Capabilities:
- Product analytics: feature usage, user flows, retention, activation
- Session recording: heatmaps, click maps, scroll depth (used for CRO analysis)
- Feature flags: integration with A/B testing workflows
- Funnel analysis: conversion between any sequence of events
- Cohort analysis: behavior-based user segments
- SQL access: custom queries via PostHog's SQL API

This is particularly valuable for SaaS tenants where product engagement = marketing signal.
A user who has used Feature X is far more likely to respond to messaging about Feature Y.
PostHog data flows into Lead Scorer (AUD-03) and Lead Nurture Architect (LG-05).

---

### Category 2: Search Intelligence

**Google Search Console (GSC)**

Access: Search Console API v3
Authentication: OAuth 2.0 (user delegates access)

Capabilities:
- Keyword universe: all queries the site appears for, with clicks, impressions, CTR, position
- Page performance: which pages drive traffic for which queries
- Index coverage: crawl errors, indexing issues, excluded pages
- Core Web Vitals: mobile + desktop performance scores
- Sitemaps: submission status, crawl metrics
- Manual actions: penalty detection
- URL inspection: individual URL index status, canonical, rich results

Pulled data frequency: daily for clicks/impressions on key pages, weekly full export

Agents that consume GSC:
- SEO Auditor (RES-06): full site audit
- Content Strategist (CONT-01): keyword gap → content brief
- Content Brief Writer (CONT-02): exact query data for content targeting
- SEO Optimizer (CONT-11): page-level optimization with exact query data

---

**Google Business Profile (GMB)**

Access: My Business Business Information API + Reviews API
Authentication: OAuth 2.0

Capabilities:
- Business info management: hours, location, attributes, photos, description
- Review management: read reviews, draft responses, sentiment analysis
- Q&A management: read questions, draft answers
- Posts: publish GMB posts (events, offers, updates)
- Insights: search queries driving profile views, direction requests, calls
- Local pack optimization: signals for local SEO performance

Agents that consume GMB:
- Community Manager (SOC-03): review response drafting
- SEO Auditor (RES-06): local SEO health
- Content Strategist (CONT-01): local content opportunities

---

**SEMrush API (and alternatives)**

Access: SEMrush REST API (or Ahrefs API / Moz API — configurable per tenant)
Authentication: API key

Primary capabilities via SEMrush:
- Organic research: keyword universe, search volume, keyword difficulty, SERP features
- Competitor research: organic keyword overlap, top pages, traffic estimates
- Backlink analysis: link profile, toxic links, new/lost links, link velocity
- Position tracking: daily rank tracking for defined keyword set
- Content audit: existing content performance, gap analysis
- Technical SEO: site audit (supplements GSC + Lighthouse)
- PPC research: competitor ad copy, spend estimates, keyword overlap

Additional tools evaluated for specific capabilities:
- Ahrefs: backlink database depth
- Moz: Domain Authority as standard signal
- Screaming Frog (via API/integration): deep crawl data
- Majestic: Trust Flow / Citation Flow

SEMrush pulls feed into:
- SEO Auditor (RES-06): comprehensive keyword + backlink analysis
- Content Brief Writer (CONT-02): SERP feature targeting
- Competitive Intelligence Monitor (RES-02): competitor organic strategy
- Benchmark Researcher (RES-09): industry keyword difficulty benchmarks

---

### Category 3: Paid Media Intelligence

**Google Ads API**

Access: Google Ads API v16+
Authentication: OAuth 2.0 + developer token + MCC (Manager Account) access

Full capabilities:
- Campaign management: create, modify, pause campaigns, ad groups, ads, keywords
- Bid management: manual CPC, smart bidding, target CPA/ROAS
- Keyword research: Google Keyword Planner via API
- Ad copy management: RSA components, call ads, discovery ads
- Asset management: images, video, sitelinks, callouts
- Audience management: customer match, remarketing lists, similar audiences
- Conversion tracking: import conversion events from GA4 + server-side
- Performance Max: asset group management, audience signals
- Google Shopping: feed management, merchant center connection
- Reporting: all metrics at account/campaign/ad group/keyword/ad level
- Budget management: shared budgets, campaign budget adjustment

Google Ads Optimizer (PAID-01) uses all of the above. Specific workflows:
- Budget pacing: daily spend vs budget checks, auto-rebalancing
- Quality score monitoring: keyword relevance, ad relevance, landing page experience
- Negative keyword harvesting: search term report → new negatives
- Ad fatigue detection: CTR decline curves → creative rotation trigger
- Performance Max asset performance: which assets are "good" vs "low"

---

**Meta Marketing API**

Access: Meta Marketing API (Graph API)
Authentication: System User token with Marketing access

Full capabilities:
- Campaign creation and management across all objectives
- Ad set targeting: detailed, lookalike, custom audiences, Advantage+ targeting
- Creative management: images, videos, carousels, collections, dynamic creative
- Advantage+ Shopping Campaigns (ASC): full management
- Conversions API (CAPI): server-side event sending for attribution
- Custom audience management: customer lists, website visitors, engagement audiences
- Lookalike audience creation
- A/B testing: lift studies, split testing
- Attribution settings: click window, view window
- Instagram ad placement management (same API)
- Reporting: all standard and custom metrics at campaign/adset/ad level

Meta Ads Optimizer (PAID-02) manages the full account lifecycle.

---

**LinkedIn Campaign Manager API**

Access: LinkedIn Marketing Developer Program
Authentication: OAuth 2.0 + company page admin

Capabilities:
- Campaign group and campaign creation
- Matched audiences: contact targeting (email list upload), website retargeting, company targeting
- Sponsored content: single image, carousel, video, document ads
- Message ads (InMail) and Conversation Ads
- Lead gen forms: native LinkedIn forms, integrated with CRM
- Insight Tag: conversion tracking and website visitor intelligence
- Account-based marketing: company + job title targeting
- Reporting: standard metrics + LinkedIn-specific (impressions, clicks, conversions, cost per lead)

LinkedIn Ads Manager (PAID-03) handles all of the above with specific focus on B2B ABM campaigns.

---

### Category 4: Technology Intelligence

**BuiltWith API (and alternatives)**

Access: BuiltWith Data API
Authentication: API key

Capabilities:
- Technology detection: 50,000+ technologies tracked per domain
- MarTech identification: ESP, CRM, analytics, chat, advertising tools
- E-commerce stack: platform, payment, shipping
- CDN, hosting, SSL providers
- Historical technology data: when technologies were added/removed
- Spend estimates: estimated technology subscription spend (BuiltWith premium)

Alternative/complementary sources:
- Wappalyzer (open-source + API): technology detection
- SimilarTech (similar to BuiltWith)
- Datanyze (technology + sales intelligence, Crunchbase integration)
- Hunter.io (email discovery + verification for outbound)
- Apollo.io (full B2B intelligence: contacts, companies, intent, technology)
- Clearbit (company + person enrichment, real-time)
- 6sense / Bombora (intent data)

BuiltWith data is consumed by:
- B2B Prospector (LG-01): "they use HubSpot, not Salesforce — use this in outreach"
- Technology Stack Profiler (RES-05): full tenant competitive landscape
- Lead Scorer (AUD-03): technographic ICP fit scoring
- Competitive Intelligence Monitor (RES-02): "competitor just added an AI tool"

---

### Category 5: Website Performance Intelligence

**Google Lighthouse / PageSpeed Insights API**

Access: PageSpeed Insights API v5
Authentication: API key (or CI integration)

Capabilities:
- Performance score: overall and per core metric
- Core Web Vitals: LCP (Largest Contentful Paint), FID/INP, CLS
- Accessibility score: WCAG compliance issues
- Best practices score: security, modern web features
- SEO score: meta tags, structured data, crawlability
- PWA assessment
- Detailed opportunity breakdown: what's slowing the page, with estimated savings
- Diagnostics: specific element-level issues

Full audit runs on:
- Homepage + key landing pages (weekly)
- New landing pages before publish
- After any significant code deployment
- Competitive benchmark: run on competitor domains for comparison

Agents consuming Lighthouse:
- SEO Auditor (RES-06): technical SEO + performance triage
- CRO Hypothesis Generator (PAID-04): page speed issues → CRO opportunities
- Analytics Auditor (RES-08): tag performance impact assessment

---

**Web Crawler (Custom)**

MarkOS runs a tenant-scoped web crawler (Scrapy-based, headless Chromium for JS rendering)
for purposes that APIs can't serve:

- Full site content audit: all pages, their content, their internal links
- Broken link detection
- Content freshness assessment
- Schema markup validation
- Duplicate content detection
- Thin content identification
- Redirect chain mapping
- Image alt text audit
- Heading structure audit

Crawl frequency: monthly full crawl, weekly incremental on changed pages.
Robots.txt is respected. Crawl rate is limited to prevent server load.

For competitor sites: we use the same crawler at a rate-limited, robots.txt-respecting
frequency for competitive content intelligence. This is equivalent to what Googlebot does.

---

### Category 6: Intelligence Enrichment APIs

The following APIs are used for B2B intelligence, lead enrichment, and market research:

**People & Company Enrichment:**
- Apollo.io API: full contact + company data, email finder, intent signals
- Clearbit (now Breeze Intelligence): real-time company + person enrichment on form fills
- Hunter.io: email discovery + verification for cold outreach
- LinkedIn Sales Navigator API (if tenant has license): deep prospect research

**Intent Data:**
- Bombora API: company surge data — who is researching topics relevant to your product
- G2 Buyer Intent: who is browsing your category on G2
- 6sense (if tenant has license): account-level intent + engagement score

**News & PR Intelligence:**
- NewsAPI: press coverage of brands and industries
- Google News (via RSS): brand and competitor news monitoring
- Cision/Meltwater (if tenant has license): PR monitoring

**Financial Intelligence (for B2B ICP qualification):**
- Crunchbase API: funding rounds, company size, investors
- Pitchbook (if tenant has license): M&A, funding, investor data

**Website Traffic Intelligence:**
- SimilarWeb API: competitor traffic estimates, traffic sources, audience overlap

---

## The Audit & Diagnostic Framework

When MarkOS onboards a new tenant, a full diagnostic suite runs automatically.
The same suite re-runs quarterly or on-demand. Output is the "Marketing Health Report."

### Audit 1: Analytics Health

*Agent: Analytics Auditor (RES-08)*

Checks:
- GA4 configured correctly: views, data streams, enhanced measurement
- Conversion events firing correctly and attributed
- Consent mode v2 implemented (for EEA/UK traffic)
- UTM parameters used consistently across all traffic sources
- Cross-domain tracking configured if applicable
- Funnel events properly sequenced
- PostHog/product analytics connected and event taxonomy aligned

Output: Analytics health score (0–100) + priority fix list

---

### Audit 2: Search Health

*Agent: SEO Auditor (RES-06)*

Technical SEO:
- Crawlability: robots.txt, sitemap, crawl errors
- Indexability: canonical tags, noindex directives
- Page speed: Core Web Vitals, Lighthouse scores for top 10 pages
- Mobile usability
- Schema markup: types present, validation errors
- Internal link structure: orphan pages, link equity distribution
- HTTPS and security headers

On-page SEO:
- Title tag optimization (length, keyword presence)
- Meta description quality
- Heading structure (H1–H6)
- Keyword coverage: are target keywords present in appropriate density
- Content length vs SERP benchmarks

Off-page SEO:
- Backlink profile: total links, referring domains, domain authority
- Toxic link exposure
- Anchor text distribution
- Link velocity trend

GEO readiness:
- llms.txt present
- AI bot crawlers allowed in robots.txt
- Schema.org structured data quality
- Entity disambiguation (brand presence on Wikidata, Google Knowledge Graph)

Output: SEO audit report with priority action list, estimated traffic impact per fix

---

### Audit 3: Paid Media Health

*Agent: Paid Media Auditor (RES-07)*

Google Ads:
- Account structure quality (SKAG vs STAG, match type strategy)
- Quality Scores: distribution, below-threshold alerts
- Wasted spend: zero-conversion keywords, poor-performing ad groups
- Ad copy freshness: creative age, CTR trends over time
- Landing page relevance: ad → landing page message match
- Conversion tracking: are all valuable conversions tracked?
- Budget pacing: over/under-spending patterns
- Search term contamination: how many search terms are converting vs wasted
- Performance Max audit: asset performance, audience signal quality

Meta Ads:
- Audience overlap: internal audience cannibalization
- Ad fatigue: frequency vs CTR correlation
- Creative performance distribution: are a few creatives carrying the account
- CAPI implementation: what % of conversions are server-side vs browser-side
- Learning phase management: how often are campaigns in learning
- Budget allocation: spend by objective alignment with funnel goals

Output: Wasted spend estimate + opportunity assessment + priority action list

---

### Audit 4: Website & Conversion Health

*Agent: CRO Hypothesis Generator (PAID-04)*

- Page speed assessment (Lighthouse for top 5 pages by traffic)
- Mobile usability pass/fail
- Form analysis: fields, length, friction points
- CTA clarity and placement
- Social proof elements: testimonials, logos, case studies, numbers
- Trust signals: security badges, guarantees, privacy policy visibility
- First viewport analysis: what does a visitor see without scrolling
- Heatmap analysis (if Hotjar/Clarity/PostHog session recording available)
- Funnel drop-off analysis: GA4 funnel exploration

Output: CRO hypothesis backlog ranked by estimated impact × implementation effort

---

### Audit 5: Social Presence Health

*Agent: Social Analytics Reporter (SOC-07)*

Per platform:
- Follower growth trend (last 90 days)
- Engagement rate vs industry benchmark
- Content mix assessment: formats used vs optimal format distribution
- Posting frequency vs optimal cadence
- Response rate to comments and DMs
- Brand consistency: voice, visual style, messaging
- Link in bio and traffic from social
- Paid vs organic mix

Output: Social health scorecard per platform + priority improvements

---

### Audit 6: Competitive Landscape

*Agent: Competitive Intelligence Monitor (RES-02) + Deep Researcher (RES-01)*

Per competitor:
- Organic keyword overlap and gap
- Estimated organic traffic + top pages
- Paid keyword overlap (from SEMrush/Google Auction Insights)
- Social presence comparison (followers, engagement)
- Content frequency and format comparison
- Technology stack (BuiltWith)
- Recent funding/news/product launches
- G2/Capterra review sentiment comparison

Output: Competitive landscape matrix + positioning gaps + opportunities

---

## Connector Management Architecture

All external API connections are managed through a unified connector layer.

```
Connector Registry (DB table: markos_connector_installs)
  connector_type: ga4 | gsc | gmb | semrush | google_ads | meta | linkedin | tiktok
                  | x | youtube | posthog | apollo | clearbit | builtwith | lighthouse
                  | gsuite | ...
  tenant_id
  auth_type: oauth2 | api_key | service_account | webhook_hmac
  credentials: encrypted
  scopes: []
  status: active | paused | error | revoked
  last_sync: ISO8601
  sync_frequency: realtime | hourly | daily | weekly | on_demand
  data_retention_days: int
```

Connection health is monitored by the Anomaly Detector (ANA-05). When a connector fails:
1. Operator notified immediately
2. Dependent agents pause gracefully (don't run with stale data)
3. Recovery instructions generated automatically
4. When reconnected, gap fill runs for the offline period

---

## Data Governance in the Intelligence Layer

All data pulled from external systems is:
1. **Stored only as long as needed** — configurable per connector, default 365 days
2. **Accessible only to the owning tenant** — RLS applies to all raw data
3. **Anonymized before cross-tenant aggregation** — raw tenant data never leaves their partition
4. **Subject to right-to-delete** — connector data purges on tenant offboarding
5. **GDPR/CCPA compliant** — personal data (identified contacts from social/analytics) handled under DPA

For EU tenants, all data processing can be constrained to EU-region infrastructure.
