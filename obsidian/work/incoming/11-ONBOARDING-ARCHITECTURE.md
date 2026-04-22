# MarkOS Onboarding Architecture
## First 30 Minutes · Brand Pack Wizard · Connector Setup · Wow Moment · Offboarding

---

## The Onboarding Philosophy

Onboarding is not setup. It is the first sale you make after the signup.

By the time an operator finishes the MarkOS onboarding sequence, they must have
experienced — not read about, not watched a demo of, but *experienced* — at least
one moment where the system does something that would have taken them hours to do themselves.

That moment is the product. Everything before it is just the path to it.

The path must be short. The configuration burden must be minimal. Every screen that
asks "what do you want MarkOS to do?" before showing them what MarkOS can do is a
screen that loses a conversion.

**Onboarding design principles:**
1. Default everything. Ask the operator for input only when there is no good default.
2. Show value before asking for more configuration.
3. Every step has a clear "why this step matters" label visible at all times.
4. The whole sequence takes under 30 minutes. If it can't be finished in 30 minutes, it's too long.
5. The operator can skip ahead, but skipping degrades their first experience. Be honest about this.

---

## Part 1: The Onboarding Sequence

### Stage 0: Account creation (2 min)

Standard SaaS signup:
- Name, work email, password
- Company name
- Role (Founder/CEO, Head of Marketing, Marketing Manager, Agency/Consultant, Other)
- Team size (1, 2–5, 6–20, 21–100, 100+)

No credit card at signup. Free trial (14 days) with full feature access, budget-capped.

On submission: tenant created, onboarding state initialized, onboarding email sequence activated.

### Stage 1: The welcome and intent check (2 min)

First screen after email verification:

```
Welcome to MarkOS, Ana.

Before we set anything up, tell us what you're most 
focused on right now:

  ○  Growing organic traffic and SEO
  ○  Running paid campaigns (Google Ads, Meta)
  ○  Managing social media channels
  ○  Generating B2B leads
  ○  Running email marketing
  ○  All of the above — I want the full system
  ○  I'm an agency managing multiple clients

[ Next → ]
```

This single answer does three things:
1. Configures which agents run in the first 24 hours (high relevance = fast value)
2. Determines which connectors to prioritize in Stage 3
3. Segments the onboarding email sequence

### Stage 2: The Brand Pack Wizard (8–12 min)

This is the most critical step. Nothing in MarkOS works as well without a brand pack.
Every agent that produces content will use it. The brand pack wizard must feel like
the most important thing they do today — because it is.

**Framing screen:**
```
First, let's teach MarkOS your brand.

This takes about 10 minutes. Every piece of content, every 
social post, every email MarkOS produces will be calibrated 
against what you tell us here.

You can always refine it later. But the more honest you are 
now, the better your first outputs will be.
```

**Wizard flow (5 screens):**

---

**Screen 1 of 5: What you do**
```
Describe your product or service in plain language.
Don't use your tagline. Describe what it actually does.

[                                                    ]
[                                                    ]

What problem does it solve?
[                                                    ]

Who is it for? (job title or type of person)
[                                                    ]
```

---

**Screen 2 of 5: Your brand personality**

```
If your brand were a person, which of these would fit?

Choose up to 3:

□ Direct and no-bullshit     □ Warm and encouraging
□ Technical and precise      □ Playful and irreverent
□ Ambitious and bold         □ Thoughtful and measured
□ Educational and clear      □ Provocative and challenging

Which brands feel similar to yours in personality?
(Not competitors — just brands whose voice you admire)
[                                                    ]

Which brands feel completely wrong for your style?
[                                                    ]
```

---

**Screen 3 of 5: Your voice rules**

```
Complete these sentences:

We always...
[                                                    ]
example: "use specific numbers, not vague claims"

We never...
[                                                    ]
example: "use the word 'leverage' or 'synergy'"

Our content is [FORMAL/CASUAL] (drag slider)
  ←────────────────○────────→
  Very formal              Very casual

We [DO/DON'T] use humor
```

---

**Screen 4 of 5: Your audience**

```
Who is your primary audience?

Job title or role:
[                                                    ]

What they care most about (pick 2–3):
□ Moving faster     □ Saving money     □ Looking smart
□ Reducing risk     □ Growing revenue  □ Team efficiency
□ Staying ahead     □ Simplifying work □ Proving ROI

Their biggest objection to buying something like yours:
[                                                    ]

One thing they say that tells you they really get it:
[                                                    ]
```

---

**Screen 5 of 5: Your positioning**

```
Who do people usually compare you to?
[                                                    ]

Why do customers choose you instead?
[                                                    ]

What's the one thing you want to be known for?
[                                                    ]
```

---

**Brand pack compilation:**

After screen 5, MarkOS runs a background process:
1. Constructs the full brand pack schema from wizard inputs
2. Generates 3 sample sentences in the detected brand voice
3. Runs these through the voice classifier to calibrate the baseline
4. Produces a brand pack preview screen

**Brand pack preview:**
```
Here's what MarkOS learned about Acme Corp.

Your brand in three sentences:
  "Acme Corp helps B2B marketing teams prove revenue impact 
   without drowning in dashboards. We're direct, data-obsessed, 
   and deeply skeptical of vague marketing promises."

Your voice: Direct · Technical · Precise
Your audience: Marketing Directors and VPs at Series A–C SaaS
Your differentiator: First platform built for pipeline, not vanity metrics

[ These look right → ]   [ Let me adjust something ]
```

On approval: brand pack saved, Brand Intelligence System activated, voice classifier calibrated.

---

### Stage 3: Connect your first data source (5 min)

```
Now let's connect MarkOS to your marketing data.

You told us you're focused on [SEO / Paid / Social].
Here's what we recommend connecting first:

✦ Google Search Console          → 2 min   [ Connect ]
  Unlocks: keyword universe, content gap analysis, SEO health audit

✦ Google Analytics 4             → 2 min   [ Connect ]
  Unlocks: traffic analysis, conversion tracking, funnel analysis

✦ Google Ads                     → 3 min   [ Connect ]    
  Unlocks: paid audit, budget monitoring, optimization recommendations

  [ Skip for now — I'll connect later ]
```

Operators are not asked to connect everything at once. They are shown a maximum of
3 connectors based on their Stage 1 intent answer, with clear value-unlock language for each.

OAuth flows are handled in-window (not a new tab). On successful connection, a brief
confirmation appears and the audit begins immediately in the background.

```
✓ Google Search Console connected.

Acme Corp's SEO health audit is running in the background.
It'll be ready in about 4 minutes.

[ Connect GA4 next ]  [ Skip ahead ]
```

### Stage 4: The Wow Moment (5–8 min from connector)

This is the payoff. The onboarding does not end at configuration. It ends when the
operator sees their first real piece of MarkOS intelligence.

The wow moment is triggered as soon as the first meaningful audit completes.
The system interrupts the onboarding flow with:

```
✦ Your SEO Audit is ready.

Acme Corp has 847 keywords you're appearing for on Google.
You're ranking in positions 11–20 for 94 of them — one ranking 
improvement away from page one.

The top 5 page-one opportunities:
  "marketing attribution software"     pos. 12   vol. 2,400/mo
  "b2b marketing analytics"            pos. 15   vol. 1,900/mo
  "revenue attribution marketing"      pos. 11   vol. 1,200/mo
  "marketing roi tracking"             pos. 14   vol. 900/mo
  "multi touch attribution"            pos. 18   vol. 3,400/mo

Your fastest win: "multi touch attribution" — you already have 
a blog post on this topic (published March 2025). Refreshing it 
with current data and better on-page SEO could move you from 
position 18 to 8–12 in 4–6 weeks.

Want MarkOS to generate the content update brief?

  [ ✓ Yes, generate the brief ]   [ See full audit first ]
```

This screen is the demo, the proof of concept, and the activation moment all at once.
The operator sees: their actual data, an actionable insight, a specific recommendation,
and a path to their first AI-generated output — in one screen.

If they click "Yes, generate the brief": Content Brief Writer (CONT-02) runs immediately.
Within 3 minutes, a full content update brief is in their task board. That brief is
the first artifact MarkOS has produced for them. It is the product proving itself.

### Stage 5: First week activation (async, background)

After the live onboarding sequence, MarkOS activates a first-week cadence automatically:

| Day | What runs | What the operator sees |
|-----|-----------|----------------------|
| Day 0 | Brand pack active, first connector audit | Wow moment (above) |
| Day 1 | Full SEO audit completes, competitor discovery | Morning brief: "Your full SEO report is ready" + 3 competitor profiles |
| Day 2 | Content Strategist runs for top 3 keyword opportunities | Morning brief: "3 content briefs ready for your review" |
| Day 3 | Social Listener activates on brand keywords | Morning brief: "MarkOS has been listening for mentions of Acme Corp" |
| Day 5 | First weekly performance report (even if minimal data) | Morning brief: "Here's what MarkOS has learned in your first week" |
| Day 7 | Onboarding completion email with: what's connected, what's running, what to do next | Email from MarkOS |

This cadence runs regardless of how much the operator does in week 1. The system is
always moving forward, always producing something. The operator cannot stall their own activation.

---

## Part 2: The Design Partner Sequence

For the first 20 tenants (design partners), a different onboarding applies.

### Design partner onboarding

Design partners get:
1. A 60-minute live onboarding call with the MarkOS team
2. Direct async access to the product team via a dedicated Slack channel
3. Weekly 30-minute check-ins for the first 6 weeks
4. First-access to new features before general release
5. A structured feedback protocol (weekly written feedback log)
6. Lifetime discount or credit on the future paid plan

In exchange, design partners commit to:
1. Full brand pack setup within the first week
2. Connecting at least 3 data sources within the first week
3. Running at least one full content campaign through MarkOS in the first 30 days
4. Providing detailed feedback on every major friction point they encounter
5. A case study (with metrics) after 90 days

Design partner selection criteria:
- B2B SaaS company, Series A–C, 20–500 employees
- In-house marketing function (not fully outsourced)
- CMO or VP Marketing directly engaged (not delegated)
- Willing to share real performance metrics for internal benchmarking
- Ideally: already using at least one of the Tier 1 connectors (Google Ads, HubSpot, GA4)

The first 5 design partners should represent different industries to ensure the brand pack
wizard and voice classifier work across diverse domains from day one.

---

## Part 3: Multi-Client Onboarding (Agency Mode)

When an agency signs up, the onboarding flow is different:

**Step 1: Agency account setup**
- Agency name, website, team size
- Specializations (B2B SaaS, DTC, e-commerce, local business, etc.)
- Primary services offered (content, paid, SEO, full-service)

**Step 2: First client setup**
- Agency is prompted to set up their first client before doing anything else
- "MarkOS works by client. Let's set up your first client now."
- Client name, industry, website, primary contact email
- Basic ICP information (one screen, simplified)

**Step 3: Client brand pack (abbreviated)**
- Same wizard as standard onboarding but framed as "tell us about this client"
- Estimated 5 min (can be refined later)

**Step 4: Client data connectors**
- Agency enters client's GA4 property ID, GSC access, etc.
- Or sends a connector invite link to the client (they click a link, authorize in their own Google account, and MarkOS gets access)

**Step 5: First client wow moment**
- Same SEO audit / insight moment as standard onboarding
- But the framing is: "Here's what we found for [Client Name]" — ready to share with the client

**Subsequent clients:**
- Adding a second client takes 10 minutes (no tutorial overhead)
- Client #3+ takes under 5 minutes (brand pack wizard is streamlined after the first)

---

## Part 4: Onboarding Email Sequence

Triggered from day of signup. All emails are generated by MarkOS itself (Tenant 0 dogfood):

| Day | Subject | Purpose |
|-----|---------|---------|
| 0 (signup) | "Your MarkOS account is ready" | Getting started CTA, onboarding checklist link |
| 0+4h (if not connected) | "Your SEO audit is waiting for one connection" | Friction removal — direct link to GSC connect |
| 1 | "What MarkOS found in your first audit" | Summary of first audit results with deep link |
| 3 | "Your first content brief is ready" | If brief generated; CTA to review and approve |
| 3 (if no brief) | "3 operators ask us this in week one" | FAQ email addressing top activation blockers |
| 7 | "One week of MarkOS — here's what ran" | Summary of all agent activity in week 1 |
| 14 (if not activated) | "You haven't connected a second channel yet" | Friction removal for at-risk trial users |
| 14 | "How [similar company] used MarkOS in week 2" | Social proof for second-week expansion |

All email copy is generated by the Content Engine. Subject lines are A/B tested automatically.
Performance data from this sequence feeds directly back into the email literacy system.

---

## Part 5: Activation Metrics

Success in onboarding is measured by activation, not completion.

**Activation = the operator has experienced the wow moment AND has at least one approved artifact.**

Supporting metrics:
- Time to first connector connected (target: < 10 min from signup)
- Time to wow moment (target: < 30 min from signup)
- Time to first artifact approved (target: < 48h from signup)
- Brand pack completion rate (target: > 85% of signups)
- Day 7 retention: operator opened MarkOS at least 3 times in first 7 days
- Day 14 retention: at least one piece of content published via MarkOS

**Activation health dashboard (internal):**

Visible to the MarkOS team:
- Real-time funnel: signup → brand pack → connector → wow moment → first artifact
- Drop-off rate per step
- Time distribution at each step (where do people stall?)
- Cohort activation rates by source (organic vs paid vs referral)
- NPS at day 14 (in-product survey)

The onboarding sequence is itself a product that MarkOS optimizes using the same
intelligence layer it provides to tenants. The onboarding email performance feeds
the literacy system. The step drop-off rates feed the product roadmap. This is the
Tenant 0 principle applied internally.

---

## Part 6: Offboarding and Data Portability

When a tenant churns or requests offboarding, the following sequence runs:

**Immediate (on cancellation request):**
- All scheduled agent runs are paused
- All API credentials are flagged for revocation (revoked within 24h)
- Operator receives confirmation email with data export instructions

**Within 24 hours:**
- All connector OAuth tokens revoked
- External platform connections severed

**Data export package (available for 30 days after cancellation):**
- All content artifacts (full text, JSON)
- All campaign records
- All CRM data (contacts, companies, deals, activities)
- All reports (PDF + raw data)
- All analytics data pulled by MarkOS
- Brand pack (JSON + human-readable PDF)
- Agent run history (metadata, not prompts)
- All client portal history

**Data deletion (default: 90 days after cancellation):**
- All tenant data purged from Supabase
- All vectors purged from Upstash Vector
- Connector credentials deleted from secrets vault
- Cross-tenant aggregate contributions: retained in anonymized form only (impossible to reverse)
- GDPR right-to-erasure requests: 30-day processing guarantee

**Re-activation:**
- If a tenant re-activates within 90 days, all data is restored
- After 90 days, re-activation starts fresh (brand pack wizard again, connectors fresh)
- Performance history before offboarding is not recoverable after 90 days

Offboarding is documented and communicated clearly at signup. Data portability is a feature,
not an afterthought. Operators should feel confident that their data isn't locked in MarkOS,
because that confidence is what makes them willing to put their most sensitive brand and
performance data in.
