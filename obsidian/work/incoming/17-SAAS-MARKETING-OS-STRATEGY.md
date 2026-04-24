# MarkOS: The Complete SaaS Marketing Operating System
## CEO Strategic Assessment · B2B vs B2C Architecture · Gap Analysis · Completion Roadmap

---

## Opening: Where We Are and What's Still Missing

We have built 11,000 lines of architecture across 16 documents. The core intelligence layer
is exceptional. The agent network is comprehensive. The SaaS Suite billing and compliance
infrastructure is production-ready. The Pricing Engine is genuinely differentiated.

And yet, as the CEO reviewing this body of work honestly, I can see exactly where we stop
short of being *the* definitive marketing OS for SaaS. We are excellent at acquisition and
at operations. We are still incomplete at the layers in between — the growth mechanics that
make SaaS businesses compound rather than just scale.

Here is the honest gap map:

```
WHAT MARKOS DOES EXCEPTIONALLY WELL TODAY:
  ✓ Content marketing (strategy, production, SEO, distribution)
  ✓ Social OS (full API depth, DMs, comments, listening)
  ✓ Paid media (Google, Meta, LinkedIn, TikTok management)
  ✓ B2B outbound (prospecting, sequencing, lead scoring)
  ✓ Subscription operations (billing, churn, health scoring)
  ✓ Pricing intelligence (competitor monitoring, strategy, tests)
  ✓ Research (market analysis, competitive intel, VOC)
  ✓ Analytics (performance narrative, attribution, anomaly detection)

WHAT IS PARTIAL OR FRAGMENTED:
  ⚠ Product-Led Growth (PLG) — referenced but not engineered
  ⚠ Customer Marketing — churn prevention exists; advocacy and expansion don't
  ⚠ Community-Led Growth — mentioned, never designed
  ⚠ Account-Based Marketing (ABM) — fragments in B2B lead gen; not a system
  ⚠ B2C SaaS growth loops — viral mechanics, referral systems not defined
  ⚠ In-app marketing — usage signals exist; triggered in-product campaigns don't
  ⚠ Revenue team alignment — marketing/sales/CS coordination not designed

WHAT IS COMPLETELY ABSENT:
  ✗ Product Launch Engine — new features, pricing changes, major announcements
  ✗ Partnership & Ecosystem Engine — affiliates, integrations, co-marketing
  ✗ Community Engine — Slack/Discord/forum as a growth channel
  ✗ PR & Analyst Relations Engine — Gartner, G2, press, thought leadership
  ✗ Growth Experimentation Framework — structured testing across all channels
  ✗ B2C SaaS viral loop mechanics — k-factor, referral programs, network effects
  ✗ Developer Marketing (for dev-tool SaaS) — entirely unaddressed
  ✗ Event Marketing Module — webinars, conferences, product launches at scale
```

This document closes those gaps. It is both a strategic assessment and a set of
architecture specifications that complete the MarkOS SaaS vision.

The framing that guides every decision here: **MarkOS is not a marketing tool for SaaS.
It is the marketing operating system that SaaS companies run on.** The distinction matters.
A tool does one thing well. An operating system coordinates everything and learns from all of it.

---

## Part 1: The B2B vs B2C SaaS Distinction — Why It Changes Everything

The most consequential architectural decision in the SaaS Suite is treating B2B and B2C
as different operating modes, not different campaigns. The differences are not cosmetic.
They run through the entire product, from how customers are acquired to how they're measured.

### The seven fundamental differences

```
                        B2B SaaS                    B2C SaaS
                        ─────────────────────────   ─────────────────────────
Buyer                   A committee (3–10 people)   An individual (1 person)
Decision cycle          Weeks to months             Minutes to days
Primary discovery       Intent-driven (search,      Discovery-driven (social,
                        outbound, referral)          viral, paid, word-of-mouth)
Conversion event        Demo request → sales call   Self-serve signup → usage
Critical activation     First team outcome          First personal value moment
                        (e.g. campaign published)   (e.g. first win/result)
Expansion motion        Seat/usage expansion        Plan upgrade or network effect
Churn signal            Champion leaves company     User loses habit / finds alt
Viral mechanism         Referral / integration       Inherent product virality
                        discovery                    or referral program
Primary retention       ROI proof + integration     Habit formation + network
mechanic                depth + switching cost       effect + delight
Key metric              NRR (Net Revenue Retention) DAU/MAU + Retention curves
North star              Pipeline attribution        Activation rate + D30 retention
```

### How MarkOS activates differently per mode

When a tenant configures their SaaS profile, they declare their primary model:

```typescript
type SaaSModel = 'b2b' | 'b2c' | 'b2b2c' | 'plg_b2b' | 'plg_b2c'
// b2b2c = B2B product with B2C end users (Slack, Notion, Figma)
// plg_b2b = product-led growth with enterprise expansion (Atlassian, Calendly)
// plg_b2c = product-led pure B2C (Spotify, Duolingo, Canva)
```

This single field determines which modules activate, which agents run, which metrics
are tracked, which growth loops are configured, and which playbooks apply.

```
MODEL → ACTIVE MODULES:

b2b:
  Demo Engine + Calendar + ABM Engine + B2B Lead Gen + Account Expansion
  + Revenue Team Alignment + PR/Analyst Relations + Partnership Engine

b2c:
  Viral Loop Engine + Referral Program + In-App Marketing + Behavioral Segmentation
  + App Store Optimization (if mobile) + Lifecycle at Scale + Community Engine

plg_b2b:
  PLG Engine + PQL Scoring + In-App Upgrade Triggers + ABM for PQL Conversion
  + Account Expansion + Community Engine + Developer Marketing (if applicable)

plg_b2c:
  PLG Engine + Viral Loops + Referral + In-App Marketing + Behavioral Segmentation
  + Community + Growth Experimentation Framework

b2b2c:
  Everything — most complex operating mode; B2B acquisition + B2C activation
```

---

## Part 2: The Product-Led Growth (PLG) Engine

### Why PLG needs its own engine in MarkOS

Product-Led Growth is the dominant SaaS go-to-market motion in 2026. Atlassian, Slack,
Figma, Canva, Linear, Notion — all grew primarily through the product being the salesperson.
Yet PLG is the single most underspecified module in our architecture.

PLG is not "have a free trial." It is a precise engineering of the path from first touch
to value realization to revenue expansion, using the product itself as the primary
conversion mechanism. Marketing's job in PLG is to:

1. Drive qualified signups into the product (the right people, not just volume)
2. Understand and accelerate activation (first value moment)
3. Convert activated users to paid at the right moment with the right message
4. Identify and expand accounts that have hit natural upgrade triggers
5. Build viral loops that make the product bring itself new users

**New agent: MARKOS-AGT-PLG-01: PLG Strategist**
**New agent: MARKOS-AGT-PLG-02: Activation Analyst**
**New agent: MARKOS-AGT-PLG-03: PQL Scorer**
**New agent: MARKOS-AGT-PLG-04: In-App Campaign Manager**
**New agent: MARKOS-AGT-PLG-05: Upgrade Trigger Engine**
**New agent: MARKOS-AGT-PLG-06: Viral Loop Designer**

### The activation architecture

Activation is the most important metric in PLG — and the most misunderstood.
Activation is not "the user logged in." It is "the user experienced the core value
of the product." Everything before activation is pre-activation marketing. Everything
after activation is retention marketing.

```typescript
interface ActivationDefinition {
  tenant_id: string
  saas_model: SaaSModel

  // The "aha moment" — must be defined by the operator
  aha_moment: {
    description: string         // "User successfully publishes first campaign"
    event_name: string          // PostHog/Mixpanel event name
    minimum_count: number       // how many times must it happen to count as activated
    time_window_days: number    // within N days of signup
  }

  // Activation funnel milestones (the steps before the aha moment)
  milestones: ActivationMilestone[]

  // Current baseline metrics (computed from connected analytics)
  baseline: {
    signup_to_activation_rate: number      // % of signups who activate
    median_time_to_activation_hours: number
    activation_to_paid_rate: number        // % of activated users who convert
    non_activated_churn_rate: number       // how fast non-activated users churn
  }
}

interface ActivationMilestone {
  step: number
  name: string                  // "Connected first data source"
  event: string                 // PostHog event
  completion_rate: number       // % of signups who reach this step
  median_time_hours: number
  drop_off_reason: string | null // AI-inferred from support tickets + session data
}
```

### PLG activation campaigns

For every user who has NOT reached a milestone within a defined time window,
a targeted, specific intervention fires:

```
PLG ACTIVATION SEQUENCE EXAMPLE — B2B SaaS, Day-by-Day

Signup (Day 0):
  → In-app: personalized welcome based on role (CEO/Founder vs Marketing Manager vs Agency)
  → Email: role-specific "get started" guide (3 steps, personalized)
  → Goal: reach Milestone 1 (connect first data source) within 24 hours

Day 1 (if Milestone 1 not complete):
  → In-app tooltip: pulsing "Connect your Google Analytics" button
  → Email: "Most [Role] types connect GA4 first — here's why and how"
  → Trigger: if they open the email but don't connect → follow-up in-app message

Day 3 (if still not at Milestone 2):
  → PLG-02 (Activation Analyst) flags account: "3 days in, no connector attached"
  → SAS-05 (Support Intelligence) checks: any support tickets? Any login activity?
  → If logins but no connector: in-app "Need help connecting?" chat trigger
  → If no logins: email re-engagement with stronger hook

Day 5 (critical decision point):
  → If at Milestone 2+: continue standard activation sequence, no alarm
  → If below Milestone 2: PLG-02 generates "Activation Crisis" task
    - Options: human outreach from CS, extended trial offer, booking an onboarding call
    - Threshold: if ARR potential > $X → human outreach; if < $X → automated sequence

Day 7 — Aha Moment achieved (activated):
  → Email: "You just [achieved aha moment]. Here's what users like you do next."
  → CRM: contact status → "Activated" 
  → PLG-03 (PQL Scorer) runs: what's this user's expansion potential?
  → Activation event feeds health score system (SAS-04)
  → Marketing: user moves from "activation" sequence to "expansion" sequence
```

### PQL (Product Qualified Lead) scoring

A Product Qualified Lead is a user whose product behavior signals buying intent.
In PLG, PQLs are more valuable than MQLs because they're already experiencing value.

```typescript
interface PQLScore {
  user_id: string
  account_id: string
  subscription_id: string
  score: number                       // 0–100
  pql_status: 'not_ready' | 'warming' | 'pql' | 'hot_pql'
  calculated_at: string

  // Signals that drive the score
  signals: {
    // Usage signals (highest weight)
    hit_usage_limit: boolean          // approaching or at plan limit
    high_frequency_user: boolean      // uses product > X times per week
    feature_breadth: number           // % of core features used
    power_user_actions: number        // actions that signal deep engagement
    invited_teammates: boolean        // social signal: wants others in product
    connected_integrations: number    // integration depth = switching cost

    // Intent signals (medium weight)
    visited_pricing_page: boolean
    visited_upgrade_page: boolean
    searched_enterprise_features: boolean
    downloaded_export: boolean        // data portability = considers ownership
    contacted_sales: boolean

    // Fit signals (contextual weight)
    company_size: string
    company_stage: string
    industry: string
    icp_fit_score: number             // from AUD-03 Lead Scorer
  }

  // Recommended action
  recommended_action: PQLAction
  recommended_timing: string          // "now" | "in 3 days" | "wait for trigger"
  recommended_channel: string         // "in-app" | "email" | "sales_outreach"
}

type PQLAction =
  | 'in_app_upgrade_prompt'    // show upgrade CTA inside product
  | 'targeted_email_sequence'  // email sequence targeting the specific bottleneck
  | 'sales_outreach'           // route to AE for direct conversation
  | 'self_serve_offer'         // show a relevant limited-time offer
  | 'feature_unlock'           // unlock a premium feature for trial period
  | 'continue_monitoring'      // not ready yet, keep watching
```

### The upgrade trigger system

When specific product events occur, they are upgrade triggers — moments when a
conversion message is most likely to land because the user just felt a limitation.

```
UPGRADE TRIGGER EVENTS (configured by operator):

Hard limits:
  "You've reached your 5-project limit on the Free plan"
  → In-app modal: project count + upgrade prompt + specific tier recommendation
  → If dismissed: email 24h later with social proof from similar company

Feature gates:
  "You tried to use [Premium Feature] — this is available on [Plan]"
  → In-app: feature preview + upgrade CTA
  → NOT immediately followed by email (respect intent; let user decide)
  → If no upgrade in 3 days: email with "here's what [Premium Feature] did for [similar company]"

Collaboration triggers:
  "You're trying to invite a 4th team member on a 3-seat plan"
  → In-app: seat upgrade flow with instant expansion option
  → Annual plan prompt if on monthly: "Add 2 seats + save 20% by switching to annual"

Usage velocity:
  "Your team has used 80% of your monthly API calls with 12 days remaining"
  → In-app banner: usage warning + upgrade path
  → Email: "At this rate you'll hit your limit by [date] — here are your options"
  → Proactive upgrade offer: +50% usage for $X more/month

Value recognition moment:
  "You just published your 10th campaign with MarkOS"
  → In-app: celebration moment + "You're getting serious about marketing"
  → Upgrade suggestion: "Teams at your stage typically move to Professional to unlock [feature X]"
  → NOT a hard sell — a milestone recognition that opens a door
```

---

## Part 3: The Account Expansion Engine (B2B)

### Expansion is the second acquisition

In B2B SaaS, net revenue retention above 100% means your customer base is growing
even if you acquire zero new customers. Companies like Snowflake, Datadog, and Twilio
built multi-billion dollar businesses with NRR above 130%.

Expansion revenue comes from three sources: seat expansion, plan upgrades, and add-on
adoption. Each requires a different marketing motion. None of them happen automatically.

**New agent: MARKOS-AGT-EXP-01: Expansion Intelligence Agent**
**New agent: MARKOS-AGT-EXP-02: Customer Marketing Manager**
**New agent: MARKOS-AGT-EXP-03: Advocacy Engine**

### The expansion flywheel

```
EXPANSION FLYWHEEL

  1. IDENTIFY expansion opportunity
     (SAS-06 Expansion Revenue Scout already does this)
     Signals: usage growth, seat pressure, champion's role change, company growth news

  2. WARM the account before the ask
     Customer Marketing: case study from a similar company who expanded
     Feature education: show the premium feature they're close to needing
     Success content: "Here's what teams like yours did after 90 days"
     Community: champion engagement in community = relationship deepening

  3. TIME the conversation
     Natural triggers: contract renewal, QBR (Quarterly Business Review), 
     new budget cycle, company fundraise, new hire in relevant role
     PLG triggers: usage approaching limit, new team members invited

  4. MAKE the expansion case
     ROI proof: what has the current subscription achieved in measurable terms
     Expansion ROI model: what additional value the expanded plan unlocks
     Risk reduction: "Grandfathered pricing for the next 30 days"

  5. CLOSE the expansion
     Self-serve: one-click seat addition, plan upgrade in product
     CS-assisted: for strategic accounts, CS owns the conversation
     Marketing-enabled: content and materials pre-built by EXP-01

  6. REINFORCE the decision
     Onboarding sequence for new features unlocked
     Champion success recognition
     New seats' activation sequence (same PLG activation playbook)
```

### Customer marketing programs

```typescript
interface CustomerMarketingProgram {
  program_id: string
  tenant_id: string
  program_type: CustomerProgramType
  target_segment: string                // which customers are eligible
  activation_criteria: string           // what triggers enrollment
  goal: string                          // expansion | advocacy | retention | education
  status: 'active' | 'paused' | 'draft'
  enrolled_count: number
  conversion_rate: number               // % achieving program goal
}

type CustomerProgramType =
  | 'customer_success_sequence'   // education + value reinforcement emails
  | 'expansion_campaign'          // targeted upgrade sequence
  | 'advocacy_recruitment'        // ask happy customers to become advocates
  | 'referral_program'            // incentivized customer referral
  | 'beta_program'                // early access to new features
  | 'customer_advisory_board'     // strategic input + deepened relationship
  | 'community_champion'          // dedicated community engagement program
  | 'case_study_pipeline'         // structured case study creation from success stories
  | 'review_generation'           // G2, Capterra, Trustpilot review requests
  | 'co_marketing'                // joint content/event with strategic customer
```

### The advocacy engine

Happy customers are the highest-quality acquisition channel and the lowest-cost one.
The advocacy engine converts satisfaction (NPS ≥ 9) into systematic marketing assets.

```
ADVOCACY PIPELINE

  STEP 1: Identify advocates
    Trigger criteria (any of):
      → NPS score ≥ 9 (submitted via in-product or email survey)
      → CSAT score ≥ 4.5 on last 3 support tickets
      → Health score ≥ 85 for 3+ consecutive months
      → Submitted feature request that got shipped
      → Mentioned MarkOS positively on social (Social Listener picks this up)
      → Invited 3+ teammates in first 30 days

  STEP 2: Warm the relationship
    → Personalized thank-you message from a human (template drafted by EXP-03)
    → Invite to beta program or customer advisory board (high-touch option)
    → Feature preview share: "You're one of our power users — early look at X"
    → Do NOT immediately ask for a review or case study. Build first.

  STEP 3: Ask for specific advocacy actions (ranked by ask size, small to large)

    Small ask (immediate):
      → "Would you leave us a review on G2?" — link, pre-populated info
      → LinkedIn recommendation for the founder/team
      → Share a post about a result they achieved (social proof content)

    Medium ask (1–2 hours):
      → Join a 20-minute customer spotlight video call
      → Fill in a case study template (EXP-03 pre-fills with their data)
      → Participate in a webinar as a panelist

    Large ask (ongoing commitment):
      → Customer Advisory Board membership (quarterly calls)
      → Joint webinar or co-authored content piece
      → Reference customer for sales calls (opt-in only, never assumed)

  STEP 4: Close the loop
    → Every advocacy action gets acknowledged and reciprocated
    → Case study featured on website + sent to them personally
    → Review posted: thank the customer personally in the review response
    → G2 review: send a "thank you" gift card (G2 allows this)
    → Advisory board: genuine influence on roadmap priorities
```

---

## Part 4: The ABM Engine (B2B)

### Why ABM is not "targeted campaigns"

Account-Based Marketing is currently scattered across `07-PIPELINE-MODULES.md` (B2B Lead Gen)
and `02-AGENT-NETWORK-FULL.md` (AUD-04 ABM Account Selector). What exists is a foundation.
What's missing is the coordinated ABM operating system.

True ABM is a three-tier motion:

```
ABM TIERS:

Tier 1 — Strategic ABM (1:1)
  Target: 5–50 named accounts that could each represent $100K+ ARR
  Approach: fully bespoke. Custom research, custom content, custom outreach,
            custom events, direct executive relationship building.
  Investment: $5,000–$50,000 per account in marketing effort
  Owned by: Marketing + Sales in joint account plan

Tier 2 — Scaled ABM (1:few)
  Target: 50–500 accounts sharing industry, size, or use case profile
  Approach: industry-specific content, personalized but templated outreach,
            targeted events, account-specific landing pages
  Investment: $500–$5,000 per account cluster
  Owned by: Demand Gen team

Tier 3 — Programmatic ABM (1:many)
  Target: 500–5,000 ICP accounts identified by firmographic + technographic signals
  Approach: IP-based display ads, personalized web experience, intent-triggered
            sequences, account scoring and prioritization
  Investment: $10–$100 per account
  Owned by: Marketing automation
```

**New agent: MARKOS-AGT-ABM-01: ABM Account Intelligence Agent**
**New agent: MARKOS-AGT-ABM-02: ABM Content Personalization Agent**
**New agent: MARKOS-AGT-ABM-03: ABM Orchestration Agent**

### The ABM intelligence package

For every Tier 1 account, MarkOS builds a complete intelligence package:

```typescript
interface ABMAccountPackage {
  account_id: string
  company_domain: string
  abm_tier: 1 | 2 | 3
  created_at: string

  // Company intelligence
  company_profile: {
    name: string
    industry: string
    sub_industry: string
    employees: string
    revenue_range: string
    stage: string                   // startup, growth, enterprise
    funding_total: number | null
    last_funding_round: string | null
    hq_location: string
    office_locations: string[]
    tech_stack: string[]            // from BuiltWith/RES-05
    key_tools: string[]             // tools directly relevant to MarkOS
  }

  // Buying committee map
  buying_committee: BuyingCommitteeMember[]

  // Strategic context
  strategic_signals: {
    recent_news: NewsItem[]         // funding, launches, hirings, expansions
    job_postings: JobSignal[]       // what roles they're hiring = strategic signals
    exec_content: ContentSignal[]   // what executives are posting/publishing
    competitor_signals: string[]    // signs they use or evaluate competitors
    pain_indicators: string[]       // signals that suggest our pain tags are active
    intent_score: number            // from Bombora/G2 intent data
  }

  // Personalization context
  messaging: {
    primary_pain: string            // most likely pain tag based on signals
    entry_angle: string             // recommended opening angle for this account
    relevant_case_studies: string[] // case study IDs most similar to this account
    objection_forecast: string[]    // likely objections based on industry + stage
    champion_profile: string        // what the ideal internal champion looks like
  }

  // Engagement tracking
  engagement: {
    website_visits: number
    content_consumed: string[]
    email_opens: number
    ads_impressions: number
    events_attended: string[]
    stage: ABMStage
  }
}

type ABMStage =
  | 'identified'          // in our target list, not yet engaged
  | 'aware'               // has seen our brand (ad impression, content view)
  | 'engaged'             // active engagement (email reply, website visit)
  | 'meeting_booked'      // demo or discovery call scheduled
  | 'opportunity'         // in CRM pipeline
  | 'customer'            // converted
  | 'expansion_target'    // customer + identified for expansion

interface BuyingCommitteeMember {
  contact_id: string | null         // CRM contact if known
  role: string                      // "VP Marketing", "Head of Demand Gen"
  persona: 'economic_buyer' | 'champion' | 'user' | 'gatekeeper' | 'influencer'
  linkedin_url: string | null
  known_to_us: boolean
  last_interaction: string | null
  preferred_content_format: string | null
  key_concerns: string[]
}
```

### ABM content personalization

For Tier 1 and Tier 2 accounts, content is personalized to the account, not just
the persona. MARKOS-AGT-ABM-02 (ABM Content Personalization Agent) takes the standard
content library and adapts it:

```
ABM PERSONALIZATION MATRIX

                    Economic Buyer          Champion              Technical Gatekeeper
                    (VP/C-suite)            (Head of/Director)    (Manager/Sr. IC)
                    ─────────────────────   ──────────────────    ─────────────────────
Email subject       "How [Company] could    "The marketing team   "How MarkOS integrates
                    close the agency gap"   at [similar company]  with your Salesforce
                                            grew pipeline 3x"     stack in 2 hours"

Landing page        ROI calculator with     Case study from        Technical docs +
                    their estimated         their industry +       API reference +
                    agency spend            testimonial video      security overview

Ads                 Executive-level stat    Social proof from      Integration logos +
                    about agency costs      peer companies         technical capability

Content offer       CFO-ready ROI model     30-min strategy call   Free technical audit

Outreach angle      "You're paying agencies "You're spending 60%   "Your current stack
                    $40K/month for 30-day   of your time on        has a data gap between
                    cycles"                 execution, not         [tool A] and [tool B]"
                                            strategy"
```

---

## Part 5: The Viral Loop & Referral Engine (B2C)

### B2C SaaS grows differently

In B2C SaaS, the marketing budget is most efficiently spent when the product brings
itself new users. Every Slack, Dropbox, Canva, and Notion achieved explosive growth
not primarily through paid acquisition but through deliberate viral loop engineering.

The two fundamental B2C viral mechanisms:

```
VIRAL MECHANISM 1: Inherent product virality (k-factor > 0)
  The product naturally exposes non-users to its value through normal use.
  Examples:
    - Canva: "Made with Canva" watermark / share link
    - Calendly: booking page URL shared to schedule meetings
    - Loom: video link shared to non-users who have to watch
    - MarkOS parallel: "This content was produced with MarkOS" attribution
                       on published blog posts and landing pages

VIRAL MECHANISM 2: Incentivized referral programs
  Existing users have a reason to recruit new users.
  Examples:
    - Dropbox: extra storage for both referrer and referee
    - Notion: template credits for referrals
    - MarkOS parallel: AI credits, extended trial, feature unlocks per referral
```

**New agent: MARKOS-AGT-VRL-01: Viral Loop Analyst**
**New agent: MARKOS-AGT-VRL-02: Referral Program Manager**

### K-factor modeling and optimization

```typescript
interface ViralLoopMetrics {
  tenant_id: string
  period: string                          // YYYY-MM

  // K-factor calculation
  // K = invitations_sent_per_user × conversion_rate_of_invitations
  k_factor: number                        // ideally > 0.3; > 1.0 = viral growth
  invitations_per_active_user_monthly: number
  invitation_conversion_rate: number      // % of invitees who sign up

  // Viral channel breakdown
  viral_channels: {
    channel: string                       // "product_share" | "referral_link" | "embed"
    impressions: number
    clicks: number
    signups: number
    conversion_rate: number
  }[]

  // Referral program performance
  referral_program: {
    active_referrers: number              // users who have shared a link
    referrals_sent: number
    referrals_converted: number
    conversion_rate: number
    cost_per_referred_signup: number      // incentive cost / conversions
    referred_user_ltv_vs_organic: number  // do referred users retain better?
    payback_period_days: number
  }
}
```

### Referral program design

```typescript
interface ReferralProgram {
  program_id: string
  tenant_id: string
  name: string
  status: 'active' | 'paused' | 'draft'

  // Incentive structure
  referrer_reward: ReferralReward        // what the person who refers gets
  referee_reward: ReferralReward         // what the new user gets
  reward_trigger: 'signup' | 'activation' | 'first_payment'
  // Best practice: tie reward to activation or payment, not just signup
  // → ties incentive to quality referrals, not volume of unqualified signups

  // Program mechanics
  referral_link_format: string           // {baseUrl}/r/{referral_code}
  cookie_window_days: number             // attribution window (default: 30)
  multi_use: boolean                     // can one link be used by many people
  max_referrals_per_user: number | null  // null = unlimited

  // Fraud prevention
  min_account_age_days: number           // account must be N days old to refer
  require_paid_account: boolean          // only paying customers can refer
  self_referral_prevention: boolean      // detect and block self-referrals
  vpn_detection: boolean                 // flag suspicious referrals

  // Communication
  onboarding_email: boolean              // email new users about referral program
  dashboard_visible: boolean             // is referral tracking in product UI
  share_tools: string[]                  // ['link', 'email', 'social', 'embed']
}

interface ReferralReward {
  reward_type: 'credit' | 'discount' | 'feature_unlock' | 'cash' | 'extended_trial'
  reward_value: number
  reward_currency: string | null
  reward_duration: string | null         // "3 months" for discount rewards
  reward_description: string             // human-readable: "1 month free"
}
```

### Product virality engineering

Beyond the formal referral program, MarkOS helps B2C SaaS tenants engineer
product virality — the passive kind that happens when users use the product normally:

```
PRODUCT VIRALITY OPPORTUNITIES (VRL-01 analysis):

"Powered by" moments:
  → Any time a user shares output from the product, there is an opportunity
    to expose the brand to non-users.
  → MarkOS audit: what does your product produce that gets shared?
    → Blog posts → "Written with MarkOS" link in footer
    → Reports → MarkOS brand mark + "Create your own" CTA
    → Email campaigns → "Sent via MarkOS" in footer (optional, incentivized)

Collaborative features:
  → Any feature that requires inviting a non-user creates acquisition touchpoints
  → Audit: does your product have any features that are better with others?
    → Content approval flow → requires client/stakeholder to view
    → Report sharing → client-side portal view
    → Team collaboration → invite needed

Embeds and widgets:
  → Any publicly embedded content carries acquisition potential
  → Calendar booking pages (MarkOS native calendar) → "Book with MarkOS" branding
  → Lead capture forms → "Form powered by MarkOS"
  → Live chat widgets → "Powered by MarkOS"

Network effects (if applicable):
  → Does your product become more valuable as more users join?
  → Analytics benchmarks: "How do you compare to similar teams using MarkOS?"
    → Cross-tenant benchmarks → creates reason to invite more users
```

---

## Part 6: The In-App Marketing Module

### The most underused growth channel in SaaS

In-app marketing is the highest-converting marketing channel available to a SaaS company.
The user is already in the product. They are already engaged. The right message at the
right moment in their workflow converts at 10–40× the rate of an equivalent email.

MarkOS orchestrates in-app marketing through PostHog (already connected) and native
in-app messaging triggers, coordinated with the email and outreach systems so the user
never gets the same message twice from two different channels.

**New agent: MARKOS-AGT-IAM-01: In-App Campaign Orchestrator**

```typescript
interface InAppCampaign {
  campaign_id: string
  tenant_id: string
  name: string
  status: 'active' | 'paused' | 'draft' | 'completed'

  // Targeting
  target_segment: InAppSegment
  trigger: InAppTrigger
  frequency_cap: FrequencyCap

  // Creative
  format: InAppFormat
  content: InAppContent

  // Coordination
  suppress_if_email_sent_days: number    // don't show in-app if email was sent within N days
  pause_if_cs_active: boolean           // pause if CS is actively working this account
  respect_quiet_hours: boolean          // don't show during first 5 minutes of session

  // Measurement
  primary_goal: string                  // 'upgrade' | 'activate_feature' | 'book_call' | 'review'
  success_event: string                 // PostHog event that constitutes conversion
  results: InAppCampaignResults | null
}

type InAppFormat =
  | 'tooltip'          // small contextual hint near a UI element
  | 'banner'           // top-of-screen dismissable banner
  | 'modal'            // focused overlay (use sparingly)
  | 'slideout'         // side panel — less intrusive than modal
  | 'checklist'        // onboarding checklist widget
  | 'hotspot'          // pulsing dot on a feature that opens a tooltip
  | 'announcement'     // full-screen announcement for major launches

interface InAppTrigger {
  trigger_type: 'page_view' | 'event' | 'segment_entry' | 'time_in_session' | 'inactivity'
  event_name: string | null          // for 'event' trigger type
  page_url_pattern: string | null    // for 'page_view' trigger type
  delay_seconds: number              // delay before showing (default: 3s)
  session_number: number | null      // only show on session N (e.g. session 5+)
}
```

### In-app and email coordination

The most powerful in-app marketing doesn't operate independently — it coordinates
with the email, push, and in-app channels to tell a coherent story without repetition:

```
IN-APP + EMAIL COORDINATION EXAMPLE: Feature adoption campaign

Goal: Get active users to try the Social OS feature they haven't used

Day 1 (email):
  "You haven't tried the Social OS yet — here's what it does"
  Subject: "The MarkOS feature most teams unlock in month 2"
  CTA: "Try Social OS" → deep link to the feature

Day 3 (in-app, if email opened but feature not used):
  In-app hotspot: pulsing dot on Social OS in sidebar
  Tooltip: "Start here → connect Instagram in 2 minutes"

Day 5 (in-app, if still unused):
  Slideout: "3 teams like yours saw X% more engagement after adding Social OS"
  CTA: "Show me how"

Day 7 (if no action on any channel):
  PLG-05 evaluation: is this account a PQL for Social OS add-on?
  → If high ARR potential: route to CS for personal outreach
  → If lower ARR: one final email "Last call" then pause campaign for 30 days

Day N (when Social OS is first used):
  → Campaign paused immediately (no more messages)
  → Activation sequence starts: "Great start — here's what to do next"
  → Conversion tracked: "Social OS Activated" in PostHog
```

---

## Part 7: The Community Engine

### Community is the most defensible moat in SaaS

A strong community does five things no other marketing channel can:
1. Provides ongoing product feedback at zero cost
2. Creates peer-to-peer customer support (reducing CS cost)
3. Builds switching cost through social relationships
4. Generates authentic user-generated content continuously
5. Identifies future customers through member referrals

**New agent: MARKOS-AGT-CMT-01: Community Strategy Agent**
**New agent: MARKOS-AGT-CMT-02: Community Content Manager**
**New agent: MARKOS-AGT-CMT-03: Community Health Monitor**

### Community architecture

```typescript
interface CommunityProfile {
  tenant_id: string
  community_type: CommunityType
  primary_platform: CommunityPlatform
  secondary_platforms: CommunityPlatform[]
  member_count: number
  monthly_active_members: number
  health_score: number                     // community vitality: 0–100

  goals: CommunityGoal[]
  launch_status: 'not_started' | 'soft_launch' | 'active' | 'mature'
  community_url: string | null
}

type CommunityType =
  | 'practitioner'     // peers who share the same job (most common for B2B tools)
  | 'user_forum'       // product Q&A and discussion
  | 'customer_only'    // locked to paying customers (premium community)
  | 'open_education'   // public community around a topic, not just the product
  | 'developer'        // API users, integrators, builders on your platform

type CommunityPlatform =
  | 'slack'            // best for B2B practitioners; real-time
  | 'discord'          // better for younger audience, developers
  | 'circle'           // purpose-built community platform
  | 'discourse'        // forum-style; good for searchable Q&A
  | 'linkedin_group'   // professional, limited engagement
  | 'reddit'           // organic but hard to control

type CommunityGoal =
  | 'customer_retention'    // churn reduction through belonging
  | 'product_feedback'      // structured user research
  | 'peer_support'          // reduce CS ticket volume
  | 'content_generation'    // user-generated content flywheel
  | 'new_user_acquisition'  // community members refer others
  | 'thought_leadership'    // brand authority in the category
```

### The community growth flywheel

```
COMMUNITY GROWTH FLYWHEEL

SEED (Months 0–3):
  → Invite 20–50 best customers personally (advocacy pipeline feeds this)
  → Founder/team is highly active — answer every question, start every thread
  → Content: weekly "state of the community" post from founder
  → Goal: establish culture and norms before scale
  → Do NOT open to the public yet

GROW (Months 3–9):
  → Open to all paying customers
  → Add a "community invite" to activation sequence (new user email Day 7)
  → Weekly structured events: AMA, office hours, peer success stories
  → CMT-02 (Community Content Manager): generates weekly prompts/discussions
  → CMT-03 (Community Health Monitor): tracks activity, identifies quiet periods
  → Goal: reach 100 MAU

COMPOUND (Month 9+):
  → Open relevant sections to free users (acquisition mechanic)
  → User-generated content starts appearing naturally
  → Expert members emerge: recognize them with titles/badges/access
  → Community data flows into research engine (VOC signals)
  → Community activity correlates with health score (active members = healthier accounts)
```

### Community ↔ MarkOS data integration

The community is not isolated from MarkOS. It is integrated into the intelligence layer:

```
COMMUNITY SIGNALS → MARKOS SYSTEMS

Active community member → health score boost (+5 points on relationship depth dimension)
Community question about [feature] → support intelligence: feature confusion signal
Community mention of competitor → competitive intelligence: real-time VOC signal
New post "how do I [task]" → content strategy: this is a content gap
New post "I just achieved [result]" → advocacy pipeline: potential case study candidate
Member leaving community → churn risk signal: investigate subscription health
Community vote on feature request → product intelligence: prioritization signal
```

---

## Part 8: The Event Marketing Module

### Events are underengineered in SaaS

Webinars, virtual summits, product launch events, conference speaking, and
customer events are major SaaS marketing channels that generate pipeline at
consistently better conversion rates than most other channels. Yet there is
no event marketing infrastructure in the current MarkOS architecture.

**New agent: MARKOS-AGT-EVT-01: Event Strategy Agent**
**New agent: MARKOS-AGT-EVT-02: Event Production Manager**
**New agent: MARKOS-AGT-EVT-03: Event Revenue Attributor**

### Event types and their roles

```
VIRTUAL EVENTS
  Webinar (40–250 attendees):
    Best for: top-of-funnel education, lead generation, product demos at scale
    Conversion rate to opportunity: 5–15% for properly targeted webinars
    MarkOS role: registration page, promotion sequence, follow-up sequence,
                 attendee-to-pipeline attribution

  Virtual summit / conference (250–5,000 attendees):
    Best for: category creation, thought leadership, community building
    Lead gen: 500–5,000 leads at $20–$100 CPL
    MarkOS role: multi-speaker coordination, attendee journey, sponsor management

  Product launch event (live stream, any size):
    Best for: new feature announcements, pricing changes, major pivots
    MarkOS role: announcement sequence, live event promotion, post-event nurture

IN-PERSON EVENTS
  Customer event (20–200 customers):
    Best for: retention, expansion, advocacy development
    MarkOS role: invitation sequence, agenda personalization, post-event follow-up

  Conference speaking (industry events):
    Best for: thought leadership, brand awareness, warm lead generation
    MarkOS role: abstract writing, pre-event promotion, post-event nurture

  Trade shows / exhibitions:
    Best for: direct sales pipeline generation
    MarkOS role: pre-show outreach, booth traffic sequences, post-show follow-up
```

### Event workflow architecture

```typescript
interface MarketingEvent {
  event_id: string
  tenant_id: string
  event_type: EventType
  name: string
  description: string
  date: string                          // ISO8601
  duration_minutes: number
  format: 'virtual' | 'in_person' | 'hybrid'
  platform: string | null               // Zoom Webinar, Hopin, Riverside, Eventbrite
  capacity: number | null
  status: 'planning' | 'promoting' | 'live' | 'completed' | 'canceled'

  // Goals
  registration_target: number
  attendance_rate_target: number        // % of registrants who attend
  pipeline_target_usd: number | null

  // Promotion sequence (auto-generated by EVT-01)
  promotion_plan: EventPromotionPlan

  // Speakers / guests
  speakers: EventSpeaker[]

  // Results (post-event)
  results: EventResults | null
}

interface EventPromotionPlan {
  // Pre-event sequence (all auto-generated by CONT-05 + EVT-02)
  announcement_date: string             // T-28 days: "Coming soon" teaser
  launch_date: string                   // T-21 days: registration opens
  email_sequences: EmailSequenceRef[]   // segmented by: registered, not-yet-registered, customers
  social_schedule: SocialPostSchedule   // 2-3 posts/week in pre-event window
  paid_promotion: PaidEventPromotion | null  // if budget allocated
  partner_promotion: PartnerPromotion[] // co-promoters, speakers promoting to their audience

  // Reminder sequence (registered attendees)
  reminders: EventReminder[]           // T-7, T-2, T-1day, T-1hour, day-of

  // Post-event sequence
  post_event: PostEventSequence
}

interface PostEventSequence {
  replay_delivery_hours: number         // send replay within N hours
  attendee_sequence: EmailSequenceRef   // attended → hot lead sequence
  no_show_sequence: EmailSequenceRef    // registered but didn't attend → warm sequence
  cta: string                          // what do attendees do next?
  pipeline_attribution_window_days: number  // attribute pipeline to event within N days
}
```

---

## Part 9: The PR and Analyst Relations Engine

### Earned media is the highest-trust channel

A Gartner Magic Quadrant mention, a TechCrunch feature, or a G2 "Leader" badge does
more for enterprise pipeline than any paid campaign at the same cost. Yet PR and analyst
relations are systematically underinvested in by early-stage SaaS because they seem
slow, unpredictable, and hard to connect to revenue.

MarkOS solves this with a systematic approach: researched, evidence-based press
outreach, structured G2/Capterra category management, and analyst briefing programs
that build a relationship before you need a mention.

**New agent: MARKOS-AGT-PR-01: PR Intelligence Agent**
**New agent: MARKOS-AGT-PR-02: Press Outreach Manager**
**New agent: MARKOS-AGT-PR-03: Analyst Relations Agent**
**New agent: MARKOS-AGT-PR-04: Review Generation Manager**

### G2/Capterra category ownership

For most SaaS companies in 2026, G2 category leadership is a more measurable and
achievable goal than press coverage, with direct pipeline impact.

```
G2 CATEGORY MANAGEMENT PROGRAM (PR-04)

Monthly cadence:
  → Monitor: track own ranking, review volume, review sentiment vs competitors
  → Identify: customers eligible for review request (NPS ≥ 8, active > 60 days)
  → Request: personalized review request email (advocacy pipeline integration)
  → Respond: draft response to every new review (positive + negative)
  → Analyze: which competitor reviews contain language we should counter in our messaging

Review request optimization:
  → Best timing: 60–90 days after onboarding (honeymoon period, before any issues)
  → Best trigger: after a positive support interaction (CSAT 5/5)
  → Best incentive: G2-compliant gift cards via Giftagram or Sendoso
  → Best message: personalized, mentions specific value they've gotten

G2 profile optimization (PR-04 audits quarterly):
  → Product screenshots: current, high-quality, show key features
  → Product description: keyword-optimized for G2 search
  → Feature list: complete and accurate
  → Pricing: current (synced with Pricing Engine)
  → Awards and badges: submitted for all eligible categories
```

### Press outreach architecture

```
PRESS OUTREACH WORKFLOW (PR-01 + PR-02)

Story identification (PR-01, ongoing):
  → What original data does MarkOS have that journalists would cover?
    - Cross-tenant performance benchmarks (anonymized)
    - Marketing AI adoption data from our customer base
    - Pricing category shifts (we monitor it — we can report on it)
  → What milestone justifies a press release?
    - Funding round
    - Significant customer milestone (100th customer, $1M ARR, etc.)
    - Major feature launch
    - Partnership announcement
  → What thought leadership angles are trending?
    - AI marketing topic clustering from Market Scanner (RES-03)

Journalist research (PR-01):
  → For each story: identify 10–20 journalists who cover this beat
  → Build journalist profile: publications, recent articles, angle preferences
  → Relevance scoring: how aligned is this story to this journalist's coverage

Pitch generation (PR-02):
  → Personalized pitch per journalist (not a mass blast)
  → Short: subject line + 3 paragraphs max
  → Lead with why this story serves their readers, not why it serves us
  → Exclusive offer to top-tier journalist: "First to write" window

Coverage tracking:
  → All mentions tracked via Google Alerts + NewsAPI
  → Coverage logged in CRM as brand awareness touchpoints
  → UTM parameters on any press-included links for traffic attribution
```

---

## Part 10: The Growth Experimentation Framework

### Why experimentation needs its own framework

Every other module in MarkOS produces outputs. Experiments produce *learnings* — and
learnings compound. The company with the fastest learning rate wins, not the company
with the best initial strategy.

MarkOS already has A/B testing in the Pricing Engine (price tests). But there is no
unified experimentation framework that covers the full marketing surface: landing pages,
email subject lines, ad creative, onboarding flows, pricing pages, activation sequences.

**New agent: MARKOS-AGT-XP-01: Growth Experiment Strategist**
**New agent: MARKOS-AGT-XP-02: Experiment Analyst**

### The experiment registry

```typescript
interface MarketingExperiment {
  experiment_id: string
  tenant_id: string
  name: string
  hypothesis: string                    // "If we change X to Y, then Z will happen because W"
  experiment_type: ExperimentType
  status: ExperimentStatus
  priority: 'high' | 'medium' | 'low'

  // What is being tested
  surface: ExperimentSurface
  control: ExperimentVariant
  variants: ExperimentVariant[]         // 1–3 variants (more = smaller samples per variant)

  // Traffic and duration
  traffic_split_pct: number             // % of total traffic in experiment (rest sees control)
  sample_size_required: number          // per variant, for statistical significance
  estimated_duration_days: number
  min_runtime_days: number              // don't stop before this even if significant

  // Statistical design
  primary_metric: string               // the one metric that determines winner
  secondary_metrics: string[]          // monitored but not decisive
  significance_threshold: number       // default: 0.05
  minimum_detectable_effect: number    // minimum % improvement worth detecting

  // Guardrail metrics (if these degrade, experiment stops)
  guardrail_metrics: GuardrailMetric[]

  // Results
  started_at: string | null
  completed_at: string | null
  result: ExperimentResult | null
  decision: 'rollout' | 'reject' | 'extend' | 'redesign' | null
  learning: string | null              // documented learning, regardless of outcome
}

type ExperimentType =
  | 'ab_test'              // 2 variants
  | 'multivariate'         // test multiple elements simultaneously
  | 'holdout'              // measure lift vs a held-out control group
  | 'bandit'               // multi-armed bandit: auto-optimize during test

type ExperimentSurface =
  | 'landing_page'
  | 'pricing_page'
  | 'email_subject'
  | 'email_body'
  | 'ad_creative'
  | 'ad_copy'
  | 'onboarding_flow'
  | 'activation_sequence'
  | 'in_app_message'
  | 'referral_program'
  | 'cta_button'
  | 'homepage'
```

### The ICE-ranked experiment backlog

All experiment ideas are scored and prioritized before any test runs.
XP-01 (Growth Experiment Strategist) maintains the backlog and scores every idea:

```
EXPERIMENT BACKLOG (ICE-scored)

ICE Score = Impact × Confidence × Ease (each 1–10)

Rank  Experiment                                    Impact  Conf  Ease  ICE
────  ────────────────────────────────────────────  ──────  ────  ────  ────
1     Pricing page: add ROI calculator widget        9       7     6     378
2     Email: test pain-led vs. feature-led subject   7       8     8     448  ← run this first
3     Landing page: add video vs. static hero        8       6     5     240
4     Onboarding: remove step 3 (friction reduction) 7       7     7     343
5     Trial: 14-day vs 21-day free trial             8       5     5     200
6     CTA: "Start free trial" vs "See it in action"  6       8     9     432  ← run this second
────
[continues...]

Notes: Rank 2 and 6 are high-confidence, easy-to-run experiments. Start these in parallel.
       Rank 5 requires waiting for cohort data to mature — put on hold.
```

---

## Part 11: The Partnership and Ecosystem Engine

### The channel almost everyone ignores until Series B

Partnerships and ecosystem marketing are among the highest-ROI growth investments
available to a SaaS company — and among the most underbuilt. An integration marketplace
listing that drives $200K ARR costs almost nothing to maintain once built. An affiliate
program that generates 20% of new signups requires upfront design but compounds silently.

**New agent: MARKOS-AGT-PRT-01: Partnership Intelligence Agent**
**New agent: MARKOS-AGT-PRT-02: Affiliate Program Manager**
**New agent: MARKOS-AGT-PRT-03: Integration Marketing Agent**

### Partnership types and architecture

```
PARTNERSHIP ECOSYSTEM MAP

TECHNOLOGY PARTNERSHIPS (integrations)
  What: your product integrates with complementary tools
  Value: mutual referrals, co-marketing, lower churn (integrations = stickiness)
  MarkOS role: identify integration opportunities (via BuiltWith data on your customers),
               build integration co-marketing pages, track integration-driven acquisition

REFERRAL PARTNERSHIPS
  What: other businesses refer their customers to you for a commission
  Value: low CAC, high-trust leads (peer recommendation)
  Types:
    → Agency partners: agencies who recommend MarkOS to clients
    → Consultants: freelancers who use MarkOS + recommend it
    → Adjacent tools: non-competing tools whose users also need yours

AFFILIATE PROGRAM
  What: content creators, bloggers, YouTubers promote you for commission
  Value: leverages existing audiences; scalable
  Commission model: recurring (20–30% of first 12 months) or flat ($X per signup)
  MarkOS role: affiliate onboarding, link tracking, commission calculation,
               performance reporting, content support for affiliates

CO-MARKETING
  What: joint content, webinars, campaigns with complementary vendors
  Value: audience swap — both parties reach each other's customers
  Examples: joint webinar, co-authored guide, bundled offer

RESELLER / WHITE-LABEL
  What: partners resell MarkOS under their brand (agency mode)
  Value: agency channel for multi-client deployment
  Already designed: client portal in doc 10 supports this
```

### Affiliate program design

```typescript
interface AffiliateProgram {
  program_id: string
  tenant_id: string
  status: 'active' | 'paused' | 'invite_only'

  // Commission structure
  commission_type: 'flat_fee' | 'percentage_mrr' | 'percentage_arr' | 'hybrid'
  commission_rate: number               // % or flat amount
  commission_duration_months: number    // how many months of subscription to pay on
  cookie_window_days: number            // attribution window
  minimum_payout: number

  // Affiliate tiers (optional gamification)
  tiers: AffiliateTier[]

  // Quality controls
  manual_approval: boolean              // review all affiliate applications
  prohibited_methods: string[]          // "paid search on brand terms", "email spam"
  content_guidelines_url: string

  // Tracking and payment
  tracking_provider: 'native' | 'rewardful' | 'partnerstack' | 'impact' | 'tune'
  payment_method: 'stripe' | 'paypal' | 'wire'
  payment_frequency: 'monthly' | 'bi_monthly'

  // Performance
  total_affiliates: number
  active_affiliates: number             // generated at least 1 referral in 90 days
  total_referrals_all_time: number
  total_commission_paid_usd: number
  affiliate_contributed_mrr_pct: number // % of total MRR from affiliates
}
```

---

## Part 12: The Developer Marketing Module

### For SaaS products with an API or developer component

Many SaaS products — especially platforms — have a developer audience. This audience
requires fundamentally different marketing: they don't respond to feature-benefit
copy; they evaluate through code, documentation, and community reputation.

This module activates when a tenant's `has_api: true` or `developer_audience: true`.

**New agent: MARKOS-AGT-DEV-01: Developer Content Strategist**
**New agent: MARKOS-AGT-DEV-02: Developer Community Manager**

### Developer marketing principles

```
DEVELOPER MARKETING IS DIFFERENT FROM ALL OTHER MARKETING

What works for developers:
  ✓ Show, don't tell (working code examples > feature descriptions)
  ✓ Respect their intelligence (never condescend, never oversimplify)
  ✓ Earn trust through quality documentation (docs are your product)
  ✓ Open source contributions and presence (GitHub stars matter)
  ✓ Honest about limitations (they'll find out anyway)
  ✓ Developer community engagement (Stack Overflow, Reddit, Discord)
  ✓ Technical content marketing (deep blog posts, tutorials, OSS projects)
  ✓ API first impressions (developer experience is the product demo)

What fails with developers:
  ✗ Marketing-speak and buzzwords
  ✗ Feature-heavy landing pages with no code
  ✗ Inbound lead forms that delay API access
  ✗ Email-gated documentation
  ✗ Slow or broken API onboarding
  ✗ Fake urgency and countdown timers
```

### Developer content architecture

```
DEVELOPER CONTENT TYPES (DEV-01):

Tutorials (highest value):
  → Step-by-step: build [specific thing] using [our API]
  → Must work: code must run without modification
  → Updated: when API changes, tutorials update immediately (automation hook)

API reference documentation:
  → Every endpoint documented with working example
  → Error messages are helpful, not cryptic
  → Rate limits and gotchas are documented honestly
  → SDK documentation (if SDKs exist)

Code samples and starter kits:
  → GitHub repository with starter code
  → Multiple language examples (at minimum: Python, JavaScript, TypeScript)
  → Community-submitted examples featured

Technical blog posts:
  → "How we built X" (engineering transparency = trust)
  → "Why we chose X over Y" (shows technical thinking)
  → "The problem with [common approach] and what we do instead"

Changelog:
  → Every API change documented immediately
  → Breaking changes called out explicitly with migration guide
  → Developer newsletter: changelog + upcoming deprecations
```

---

## Part 13: The Revenue Team Alignment Module

### Marketing, Sales, and CS must share one reality

The single biggest revenue leak in B2B SaaS is the gap between marketing, sales,
and customer success. Marketing generates leads that sales says are low quality.
Sales closes deals that CS says are wrong-fit. CS runs QBRs that marketing doesn't
know are happening. The data lives in three separate systems that nobody reconciles.

MarkOS, with its native CRM and SaaS Suite, is positioned to close this gap —
but it requires deliberate architecture for the revenue team coordination layer.

**New agent: MARKOS-AGT-REV-01: Revenue Intelligence Agent**
**New agent: MARKOS-AGT-REV-02: Marketing-Sales Alignment Agent**

### The Revenue Team Operating System

```typescript
interface RevenueTeamConfig {
  tenant_id: string

  // Team structure
  has_sales_team: boolean
  has_cs_team: boolean
  sales_model: 'self_serve_only' | 'sales_assisted' | 'enterprise_sales' | 'hybrid'

  // Handoff definitions
  mql_definition: LeadQualificationCriteria      // when marketing hands to sales
  sql_definition: LeadQualificationCriteria      // when sales accepts
  mql_to_sql_sla_hours: number                   // how fast must sales respond to MQL
  pql_routing: PQLRoutingConfig                  // how PLG-driven leads are handled

  // SLA and feedback loop
  feedback_cadence: 'weekly' | 'bi_weekly'       // how often marketing/sales align
  win_loss_review: boolean                       // structured win/loss analysis
  attribution_model: AttributionModel

  // Shared goals
  shared_pipeline_target: number                 // joint marketing+sales target
  marketing_sourced_pct_target: number           // % of pipeline marketing owns
}
```

### The marketing-sales feedback loop

The most important feedback mechanism is the lead quality feedback loop.
Without it, marketing optimizes for volume while sales optimizes for quality
and they never converge.

```
LEAD QUALITY FEEDBACK LOOP (Weekly)

MARKETING → SALES:
  → MQL list with quality reasoning per lead
  → Content that supported each lead's journey (which posts, which emails)
  → ICP fit score + scoring breakdown
  → Recommended talk tracks per lead (pain-tag based)

SALES → MARKETING (REV-02 collects + synthesizes):
  → For each MQL: accepted/rejected + reason if rejected
  → For each closed deal: which content helped? which objections came up?
  → For each lost deal: what was the stated reason? what was the real reason?
  → New competitive intel from sales conversations (goes to RES-02)
  → Emerging objections not addressed in current messaging (goes to CONT-01)

WEEKLY ALIGNMENT REPORT (REV-02 generates):
  → MQL acceptance rate (target: > 70%)
  → MQL rejection reasons clustered and analyzed
  → Pipeline coverage: do we have enough pipeline to hit the quarter?
  → Content-to-pipeline attribution: which content drove what pipeline?
  → Recommendations: what marketing should change based on sales feedback
  → Approval gate: marketing and sales review together (async or in meeting)
```

---

## Part 14: The Complete MarkOS SaaS OS — Unified View

### Every module, every model, every motion

The following diagram shows the complete MarkOS SaaS Marketing OS.
The left side is acquisition (reaching and converting new customers).
The right side is retention and expansion (growing existing customers).
The center is the intelligence substrate that connects both sides.

```
                    ┌─────────────────────────────────────────┐
                    │           INTELLIGENCE SUBSTRATE         │
                    │  Research Engine · Pricing Engine        │
                    │  Self-Evolving Architecture              │
                    │  VOC Corpus · Competitive Intel          │
                    │  Brand Intelligence · Audience Archetypes│
                    └─────────────────────────────────────────┘
                                       ↑↓ feeds all

ACQUISITION                                    RETENTION & EXPANSION
────────────────────────────────              ────────────────────────────────

B2B ACQUISITION:                              B2B RETENTION:
  Content Engine (SEO, thought leadership)      Churn Intelligence Module
  B2B Lead Gen Engine                          Customer Marketing Engine
  ABM Engine (1:1, 1:few, 1:many)              Account Expansion Engine
  Demo Engine + Calendar                       Customer Success Integration
  Paid Media (Google, LinkedIn, Meta)          QBR Intelligence (REV-01)
  PR + Analyst Relations                       Advocacy Engine
  Event Marketing                              Partnership Channel

B2C ACQUISITION:                              B2C RETENTION:
  Content Engine (SEO, social, viral)          PLG Activation Engine
  Viral Loop Engine                            In-App Marketing Module
  Referral Program                             Behavioral Segmentation
  Paid Media (Meta, TikTok, Google)            Lifecycle at Scale
  Community Engine                             Habit Formation Sequences
  App Store Optimization (mobile)              Network Effect Programs

SHARED ACQUISITION:                           SHARED RETENTION:
  Social OS (all platforms)                    Subscription Management
  Cold Outreach Engine                         Billing Engine (Stripe + MP)
  Onboarding Architecture                      Revenue Intelligence Dashboard
  GTM Strategy + Channel Allocation            Support Intelligence Module
  Partnership + Affiliate Program              Community Engine
  Developer Marketing (if applicable)         Review Generation (G2/Capterra)
  Growth Experimentation Framework             Win-Back Sequences

────────────────────────────────────────────────────────────────────────────
                         OPERATIONS LAYER
          CRM · Task Board · Approval Inbox · Client Portal
          Orchestration Contract · Agent Queue · Cost Accounting
          Multi-Country Billing · DIAN · QuickBooks · Siigo · Alegra
          Revenue Team Alignment · Marketing-Sales Feedback Loop
```

### The new agent registry additions

This document adds 28 new agents across 8 new tiers:

```
TIER 13 — PLG Agents (MARKOS-AGT-PLG-*)
  PLG-01: PLG Strategist
  PLG-02: Activation Analyst
  PLG-03: PQL Scorer
  PLG-04: In-App Campaign Manager
  PLG-05: Upgrade Trigger Engine
  PLG-06: Viral Loop Designer

TIER 14 — Expansion Agents (MARKOS-AGT-EXP-*)
  EXP-01: Expansion Intelligence Agent
  EXP-02: Customer Marketing Manager
  EXP-03: Advocacy Engine

TIER 15 — ABM Agents (MARKOS-AGT-ABM-*)
  ABM-01: ABM Account Intelligence Agent
  ABM-02: ABM Content Personalization Agent
  ABM-03: ABM Orchestration Agent

TIER 16 — Viral Agents (MARKOS-AGT-VRL-*)
  VRL-01: Viral Loop Analyst
  VRL-02: Referral Program Manager

TIER 17 — In-App Agents (MARKOS-AGT-IAM-*)
  IAM-01: In-App Campaign Orchestrator

TIER 18 — Community Agents (MARKOS-AGT-CMT-*)
  CMT-01: Community Strategy Agent
  CMT-02: Community Content Manager
  CMT-03: Community Health Monitor

TIER 19 — Event Agents (MARKOS-AGT-EVT-*)
  EVT-01: Event Strategy Agent
  EVT-02: Event Production Manager
  EVT-03: Event Revenue Attributor

TIER 20 — Growth Agents (MARKOS-AGT-XP-*, MARKOS-AGT-PR-*, MARKOS-AGT-PRT-*, MARKOS-AGT-DEV-*, MARKOS-AGT-REV-*)
  XP-01: Growth Experiment Strategist
  XP-02: Experiment Analyst
  PR-01: PR Intelligence Agent
  PR-02: Press Outreach Manager
  PR-03: Analyst Relations Agent
  PR-04: Review Generation Manager
  PRT-01: Partnership Intelligence Agent
  PRT-02: Affiliate Program Manager
  PRT-03: Integration Marketing Agent
  DEV-01: Developer Content Strategist
  DEV-02: Developer Community Manager
  REV-01: Revenue Intelligence Agent
  REV-02: Marketing-Sales Alignment Agent
```

---

## Part 15: The Definitive Competitive Position

### Why MarkOS wins with this architecture

With the additions defined in this document, MarkOS covers the complete SaaS
marketing lifecycle. Let's stress-test the competitive position honestly:

**Against HubSpot:**
HubSpot is a CRM with marketing bolted on. It excels at contact management,
email marketing, and basic reporting. It does not have: PLG engineering,
viral loop design, pricing intelligence, deep social API integration, AI-native
content production, DIAN compliance, or the self-evolving architecture that
makes every output better over time. HubSpot is marketing *management*.
MarkOS is marketing *intelligence*.

**Against Marketo/Pardot (Salesforce):**
Enterprise marketing automation with deep CRM integration. Excellent at
large-scale email programs and lead scoring. Does not have: PLG mechanics,
content production, social OS, pricing engine, community engine, or
viral loop design. Built for the enterprise funnel, not the SaaS growth loop.

**Against a full agency:**
The agency has human creativity and relationships. MarkOS has: 24/7 operation,
continuous learning, perfect brand consistency, real-time competitive intelligence,
attribution at the transaction level, and a cost structure that is 10× lower.
The agency wins on one-off creative work. MarkOS wins on systematic, compounding
marketing output. The combination — MarkOS + a strategic advisor — beats either alone.

**Against building it yourself:**
Every SaaS company with $10M+ ARR eventually builds internal versions of parts
of what MarkOS does: their own PLG sequences, their own churn models, their own
content operation, their own ABM program. They spend 18 months building what
MarkOS ships as day-one infrastructure. The opportunity cost of that build — the
pipeline not generated, the customers not retained — is the price of not using MarkOS.

### The North Star, restated

> MarkOS is the operating system that SaaS marketing teams run on.
> Not a tool they use. Not a platform they integrate with.
> The OS.

Every document in this architecture serves that thesis. The intelligence substrate
is the kernel. The agent network is the services layer. The UI, API, and MCP are the
interface. The SaaS Suite is the runtime for the most important business model in
software. The B2B and B2C distinctions are the two architectures that the OS must run.

The job now is not more architecture. The job is to build, ship, and learn.
The first 22 agents, the task board, the onboarding wow moment, and the billing engine
for US and Colombia. Everything else in this document is Phase 2 and Phase 3.

**The build order has not changed. The destination is now fully specified.**
