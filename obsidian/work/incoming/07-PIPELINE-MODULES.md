# MarkOS Pipeline Modules
## Calendar/Scheduling · Demo Engine · Lead Generation · Branding · Research-as-a-Service

---

## Module 1: Native Calendar & Meeting Intelligence System

### Why native scheduling matters

Every other marketing platform treats scheduling as a sidebar — link out to Calendly,
sync with Google Calendar, call it done. MarkOS treats meetings as a revenue event.
Every meeting that gets booked is a node in the pipeline, with context flowing in
(who is this person, what do they know about us, what pain are they experiencing)
and intelligence flowing out (what happened, what next step was agreed, what sequence fires).

Building this natively — not embedding a third-party widget — is what enables the
full intelligence loop.

### Architecture

**Booking Layer (the Calendly alternative)**

- Booking pages: role-specific (SDR intro, AE demo, CS onboarding, founder call)
- Calendar integration: Google Calendar + Microsoft Outlook (bi-directional sync)
- Availability engine: respects working hours, buffer time, max daily meetings, blackout dates
- Multi-host booking: round-robin, priority routing, team availability
- Meeting types: one-on-one, group, collective (all hosts must be available)
- Intake forms: pre-meeting qualification questions (feeds Lead Scorer + CRM)
- Timezone handling: auto-detection with confirmation
- Reminders: sequence of emails/SMS before the meeting
- Cancellation and rescheduling: self-service with limits
- Payment integration: for paid consultations (Stripe)
- Embed options: widget, redirect, popup

**API Integrations:**
- Google Calendar API (create/update/cancel events, free/busy queries)
- Microsoft Graph API (Outlook calendar, Teams meeting creation)
- Zoom API (meeting creation, recording retrieval)
- Google Meet (calendar event with Meet link)
- Microsoft Teams (meeting creation via MS Graph)
- Loom (async video alternative for discovery calls)

**Intelligence Layer for Meetings (Meeting Intelligence Agent — OPS-02)**

Pre-meeting brief (generated T-24h before scheduled meeting):
- Person profile: name, title, company, LinkedIn, what they do
- Company profile: industry, size, stage, tech stack, funding, recent news
- CRM context: lead score, how they found us, prior interactions, emails opened
- Content they engaged with: which pages, which emails, which social content
- Pain tag assessment: based on intake form + browsing behavior, likely primary pain
- Competitive context: which competitors they've evaluated (from G2/Bombora if available)
- Suggested talking points: 3–5 personalized based on all of the above
- Open questions from prior interactions: anything unresolved from prior email or DM exchanges
- Meeting goal: what a successful outcome looks like

During meeting (real-time support mode, operator opt-in):
- Not transcription (privacy) — rather, a briefing sidebar the operator can reference
- Quick access to: product pricing, competitor differentiators, case studies by industry
- Pain-specific responses: if operator signals they're discussing a specific pain, relevant proof points surface

Post-meeting capture (within 1 hour of meeting end):
- Summary prompt: operator fills in 3–5 bullets of what was discussed
- AI expands into structured meeting notes
- Action items extracted + assigned
- CRM updated: stage change, notes, next action, next meeting booked
- Follow-up sequence triggered based on meeting outcome (demo → trial, trial → proposal, etc.)
- Meeting brief archived to CRM contact record

---

## Module 2: Demo Engine (SaaS)

### The problem with demos

SaaS demos are broken in two directions:

**The live demo problem**: Every demo requires a trained human. The demo environment is messy
and full of test data. The demo narrative isn't calibrated to the prospect's specific pain.
The follow-up is inconsistent. The demo takes 45 minutes that should take 20.

**The self-serve demo problem**: Generic product tours show features, not outcomes.
They're the same for a solopreneur and an enterprise VP. They don't adapt to the
visitor's role or use case. They don't convert because they don't answer the specific
question the visitor came with.

MarkOS Demo Engine fixes both.

### Architecture

**Interactive Demo Builder**

- No-code demo canvas: screenshots + overlays + guided flows
- Branching demos: different paths based on visitor role/use case selection
- Personalization layers: visitor's company name + logo injected via URL param
- Interactive hotspots: click to explore, hover to reveal, form-fill simulation
- Demo chapters: structured with distinct goals per section
- Analytics: click-through per step, drop-off, time spent, replays

This integrates with Navattic / Arcade / Walnut-style technology, either white-labeled
or through API — the MarkOS version adds the intelligence layer on top.

**Demo Personalization Engine**

When a demo is requested:
1. Lead Scorer (AUD-03) runs the visitor's profile
2. Industry + role + pain tag determined from form fill + enrichment
3. Demo path selected: which use cases, which features to emphasize
4. Demo copy personalized: visitor's industry-specific outcomes, competitor they likely use
5. Demo CTA personalized: what trial/next step makes sense for their stage

**Demo Analytics → CRM**

Every interaction in the demo is tracked:
- Which sections were viewed
- Where the visitor paused or rewound
- Which features generated "wow" responses (click-through rate on CTAs)
- Drop-off point (if they abandoned)

This data flows to CRM contact record:
- High engagement on Pricing section → sales priority flag
- Drop-off at Setup section → product complexity objection to address
- Multiple replays → strong buying intent signal

**Live Demo Co-Pilot**

For high-value prospects where a live demo makes sense:
- Pre-loaded context: who is in the call, their profile, their likely questions
- Pain-specific talking points surfaced in real-time based on conversation signals
- Competitive differentiator cards: quick reference for "how are you different from X"
- Objection handling: real-time suggestions when price, complexity, or integration objections arise
- Follow-up generator: end-of-call, generate personalized follow-up email in <30 seconds

---

## Module 3: B2B Lead Generation Engine

### Full-Stack B2B Lead Gen Architecture

B2B lead generation is a system, not a tactic. MarkOS treats it as a connected pipeline
from ICP definition through closed revenue.

**Stage 1: ICP Intelligence & Targeting**

ABM Account Selection (MARKOS-AGT-AUD-04):
- Pull company universe: firmographic criteria (industry, size, revenue, geography)
- Layer technographic fit: do they use tools that indicate need?
- Layer intent: are they actively researching relevant solutions?
- Layer timing: funding event? new hire in relevant role? company growth signals?
- Output: tiered account list (Tier 1: strategic 1:1, Tier 2: scaled 1:few, Tier 3: programmatic)

**Stage 2: Contact Discovery & Enrichment**

B2B Prospector (MARKOS-AGT-LG-01):
- For each target account, identify buying committee contacts (not just one contact)
- Role mapping: economic buyer, champion, user, technical gatekeeper
- Contact data: work email (verified), LinkedIn profile, direct phone (if available)
- Enrichment stack: Apollo + Clearbit + Hunter + LinkedIn (in priority order)
- Personalization data: recent posts, articles, company news, shared connections
- Output: enriched contact list with personalization hooks per contact

**Stage 3: Multi-Channel Outreach Orchestration**

Cold Outreach Sequencer (MARKOS-AGT-LG-02):

Email sequences:
- Sequence 1 (top of funnel): Problem-aware, value-focused, 4–6 touches over 3 weeks
- Sequence 2 (specific trigger): "Saw your company just raised a round..." personalized
- Sequence 3 (breakup): Final attempt with direct ask or value offer

LinkedIn sequences (where platform allows):
- Connection request with personalized note
- After connection: value-first message (content, insight) before any ask
- Follow-up only if engagement signals exist

Phone/voice (for Tier 1 accounts):
- Script generation per contact role
- Voicemail script if no answer
- Calendar link in voicemail follow-up

Content-based outbound:
- LinkedIn thought leadership targeted at decision-makers via paid promotion
- Retargeting ads to contact lists uploaded to Meta/LinkedIn
- Direct mail for highest-value Tier 1 accounts (yes, physical mail — distinct signal in 2026)

**Stage 4: Inbound Conversion Architecture**

For every cold outbound campaign, inbound capture points are built in parallel:

- Dedicated landing page per campaign segment (ICP + pain tag)
- Lead magnet aligned to the sequence's topic (template, calculator, guide, benchmark report)
- Chatbot activation on landing page: "Here to see the [pain topic] guide? Let me know what's most relevant for you"
- Progressive profiling: first form = name + email only; second interaction = company + role
- Trial/demo CTA matched to prospect's stage in awareness journey

**Stage 5: Lead Nurture Architecture (MARKOS-AGT-LG-05)**

From lead form submission to MQL to SQL, a structured nurture architecture:

- Day 0: Welcome + immediate value delivery (the thing they asked for)
- Day 2: Deepen: related resource that addresses the next likely question
- Day 5: Social proof: case study from their industry
- Day 10: Pain amplification: "If this is causing problems for you now, here's what teams like yours did"
- Day 14: CTA: demo offer, with meeting intelligence pre-loaded for the call
- Day 21: Check-in: "Haven't heard from you — is the timing off? Here's a quick resource for later"
- Day 30: Final: "Closing this out — here's the best resource we have on [pain topic] for when the time is right"

Behavioral triggers override time-based triggers:
- Opens email 3x without clicking → topic resonance signal → add to retargeting audience
- Clicks pricing page → high intent → route to direct outreach immediately
- Visits competitor comparison page → competitive context flag → send competitive battle card

**Stage 6: Sales Enablement Layer**

The bridge between marketing and sales:
- MQL handoff package: everything sales needs to know about this lead
- Personalized outreach: AI-generated first email for sales rep, in their voice, with full context
- Battle cards: competitive one-pagers per competitor, updated by Competitive Intelligence Monitor
- Deal intelligence: as deal progresses, relevant content served to champion for internal selling

---

## Module 4: B2C Lead Generation Engine

### B2C differs from B2B in four fundamental ways

1. Volume: hundreds or thousands of prospects daily vs dozens for B2B
2. Speed: decision cycle is hours/days, not weeks/months
3. Emotion: purchase is more emotionally driven
4. Identity: often anonymous until the moment of conversion

MarkOS handles these differences with a separate B2C lead engine.

**Stage 1: Paid Acquisition Architecture**

- Google Ads: search (high intent) + Performance Max (broad reach)
- Meta Ads: Advantage+ Shopping for DTC, lead gen objective for services
- TikTok: discovery-stage video → retarget on other platforms
- Pinterest: for visual products (home, fashion, food, beauty)
- YouTube: awareness + retargeting to mid-funnel viewers

All campaigns have:
- UTM architecture: campaign/ad set/ad tracking down to keyword + creative
- Pixel + CAPI: redundant conversion tracking (browser + server-side)
- Custom + lookalike audiences: from customer list + website visitors + app users
- Exclusion lists: existing customers excluded from acquisition campaigns

**Stage 2: Landing Page Optimization System**

Every paid campaign has a dedicated landing page — never the homepage.

CRO Hypothesis Generator runs continuously:
- Message match: ad claim → landing page headline → CTA → confirmation page
- First viewport optimization: promise in hero, proof below fold, friction-free CTA
- Social proof calibration: testimonials, star ratings, specific outcomes, user counts
- Page speed: Lighthouse score above 85 on mobile (below this, conversion suffers dramatically)
- Mobile-first layout: DTC skews heavily mobile; desktop is secondary

A/B testing infrastructure built in:
- 5 headline variants running simultaneously (traffic split automatically)
- CTA button text testing
- Hero image/video testing
- Social proof format testing
- Form length testing

**Stage 3: Conversion & Purchase Flow**

For e-commerce tenants:
- Checkout page optimization: minimal fields, wallet payments first, trust signals
- Cart abandonment: email + SMS sequence triggered within 1 hour
- Upsell/cross-sell: post-purchase offer generated by product recommendation agent

For service/subscription tenants:
- Lead form: progressive profiling approach (name + email first, details later)
- Instant value delivery: tool, calculator, guide delivered immediately on form fill
- Trial activation: onboarding sequence to reach first "aha moment" rapidly

**Stage 4: Lifecycle & Retention**

Email/SMS lifecycle (CONT-05 + Email Sequence Writer):
- New subscriber: 5-email welcome sequence, brand story + value + community
- Active customer: content + product education + loyalty milestones
- At-risk: churn signals (inactivity, support tickets) → re-engagement sequences
- Lapsed: winback sequences with best offer, 30/60/90 day timing
- VIP: early access, exclusive offers, user-generated content ask

---

## Module 5: Branding Engine

### What a Branding Engine does (vs "brand guidelines")

Most companies have brand guidelines. A PDF. Nobody reads them. Agencies ignore them.
AI tools hallucinate around them.

MarkOS Brand Engine is a **machine-enforced brand system** — not guidelines, but contracts.

**Brand Pack Builder**

Structured input wizard that produces a complete brand pack:

Section 1 — Identity:
- Mission statement (single sentence)
- Vision (single sentence, time-scoped)
- Core values (3–5, each with behavioral definition and example/counter-example)
- Brand promise (what customers can always count on)
- Point of view (what the brand believes that the market doesn't)

Section 2 — Personality:
- Archetype selection (Sage, Creator, Rebel, Hero, etc.) with description
- Temperament sliders (5 axes: formal↔casual, serious↔playful, direct↔diplomatic, rational↔emotional, reserved↔expressive)
- The on-brand tension (the productive contradiction at the heart of the brand)
- Brand adjacencies ("brands we'd co-market with" + "brands we'd never appear next to")
- Human analog ("this brand is the kind of person who...")

Section 3 — Positioning:
- Category definition (what space are we in)
- Frame of reference (what do prospects compare us to)
- Differentiation (what's uniquely true about us vs alternatives)
- Reasons to believe (3–5 proofs: product facts, testimonials, data)

Section 4 — Voice:
- Prefer list: 20+ words/phrases we actively use
- Avoid list: 20+ words/phrases we never use
- Taboo topics: subjects we never engage with
- Sentence construction rules: length, structure, active vs passive preference
- Register: academic/professional/conversational/street — per channel
- Reading level target: grade level per audience
- Humor policy: forbidden/dry-only/situational/encouraged
- Punctuation rules: Oxford comma, em-dashes, exclamation marks
- AI cliché blacklist (customized by tenant)

Section 5 — Visual:
- Color system: primary, secondary, semantic colors (action, warning, success, danger)
- Typography: primary sans, optional display, monospace, size scale, weight rules
- Photography style: reference images, mood keywords, what to avoid
- Illustration style (if applicable)
- Logo usage rules: clear space, minimum sizes, forbidden backgrounds
- Motion principles: easing, duration, what not to animate

Section 6 — Claim Library:
- Every marketing claim the brand is allowed to make
- Evidence row for each claim: source, date, scope
- Decay date: when evidence needs refreshing

**Voice Classifier**

Every piece of content generated by MarkOS is scored against the brand pack before it
reaches the operator for review. The classifier:
- Scores on 10 dimensions (see `29 Brand System Templates/Voice Classifier Rubric.md`)
- Returns a pass/fail + score per dimension
- Flags specific violations with suggested rewrites
- Hard fails block the content from advancing; soft fails are advisory

The classifier is tuned per tenant using:
- Initial calibration on 20–30 examples of approved content (human-approved pieces)
- Ongoing calibration as operators approve/reject content (each approval or rejection is a training signal)
- Quarterly recalibration to prevent drift

**Visual Brand Enforcer**

For AI-generated visual content:
- Brand color enforcement: generated images checked for color palette alignment
- Logo placement rules applied to templates
- Typography rules enforced in text-on-image content
- Image style scoring: does this look like our brand's visual identity?
- Competitor visual similarity check: does this look like a competitor?

**Brand Health Monitor**

Ongoing monitoring of brand consistency across all published content:
- Voice drift detection: is our published content drifting from brand voice?
- Visual consistency: are our social posts visually coherent as a brand?
- Claim accuracy: are all published claims still supported by current evidence?
- Competitive differentiation: are we actually saying different things from competitors?

---

## Module 6: Research Engine (Marketing Intelligence Agency)

### Research as a product feature

Every marketing agency sells research. It's how they justify their fees and demonstrate
expertise. The problem is research is slow, expensive, and often not actioned.

MarkOS Research Engine delivers agency-quality research in 20 minutes, with outputs
directly connected to the agents that will act on them.

**Research Types and Output Formats**

*Market Analysis Report*

Triggered by: new tenant onboarding, annual strategy review, new market entry

Sections:
- Executive summary (2-3 paragraphs)
- Market size: TAM/SAM/SOM with methodology
- Market structure: key players, segments, concentration
- Trend analysis: 5 major trends + signal strength + 12-month implications
- Regulatory environment: relevant regulations, pending changes
- Customer behavior: how buyers make decisions in this market
- Go-to-market landscape: how companies in this space acquire customers
- Opportunity assessment: where the gaps are vs market leaders
- Data sources: all cited, with link and date accessed

Depth: 20–40 sources, 5,000–10,000 word output

---

*Competitive Intelligence Report*

Triggered by: monthly refresh, competitor product launch, competitive loss in CRM

Per competitor:
- Company overview: founding, team, funding, headcount, locations
- Product analysis: feature set, pricing, positioning, differentiators, weaknesses
- Content strategy: what they publish, where, at what frequency
- SEO profile: organic keywords, traffic estimate, top pages, domain authority
- Paid media exposure: estimated spend, ad copy, landing page angles
- Social presence: follower counts, engagement rates, content style
- Customer sentiment: G2/Capterra review themes, NPS proxy, complaint patterns
- Technology stack: tools they use (BuiltWith)
- Recent moves: new hires, partnerships, product updates, PR

Differentiation map:
- Side-by-side feature comparison
- Positioning gap analysis: what they claim that we don't, what we claim that they don't
- Price positioning: where we sit relative to the market

---

*Customer Research Report*

Triggered by: ICP definition, product launch, segment expansion

Methods:
- Review mining: systematic analysis of public reviews for the product category (G2, Capterra, Trustpilot, Reddit, App Store)
- Community listening: relevant subreddits, forums, Slack communities, Discord servers
- Social listening: conversations about the problem space
- Survey design (if tenant wants to run a survey): question design, distribution, analysis
- Interview synthesis (if tenant provides transcripts): key themes, quotes, jobs-to-be-done

Output:
- VOC corpus: 50–200 exact quotes organized by theme
- Jobs-to-be-Done map: functional, emotional, social jobs
- Pain taxonomy: aligned to MarkOS 8-parent taxonomy
- Objection library: every objection raised, with counter-narrative
- Language patterns: exact words customers use (used directly in copy)

---

*Technology Landscape Report*

Triggered by: new integration consideration, sales enablement, partnership evaluation

- Category mapping: all tools in the relevant category
- Feature matrix: side-by-side comparison
- Adoption rates: market share estimates, customer counts where available
- Integration ecosystem: which tools integrate with which
- VC investment patterns: where is money flowing in this tech category
- Practitioner sentiment: what professionals say about tools in this space

---

*Benchmark Report*

Triggered by: goal setting, performance review, new channel launch

Industry benchmarks per channel:
- Email: open rate, CTR, unsubscribe, deliverability by industry
- Social: engagement rate, reach, CPM, CPAS by platform by industry
- Paid search: CTR, CPC, conversion rate, cost per lead by industry
- Organic: keyword difficulty, traffic potential, conversion rate by intent type
- Content: time on page, pages per session, lead conversion from content
- Pipeline: lead-to-MQL, MQL-to-SQL, SQL-to-close rates by industry

Sources: Platform benchmark reports + MarkOS cross-tenant data (where confidence threshold met)
