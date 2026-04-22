# MarkOS Social Deep Integration Architecture
## Building a Full Social Operating System via API

---

## The Core Insight

Every social media management tool treats social channels as **publish surfaces**.
You write content, schedule it, post it, look at reach and engagement numbers.
This is roughly 20% of what a real social media presence requires.

The other 80% — and the part that actually builds relationships and drives revenue — is:
- Responding to comments and DMs (in the right voice, at the right time)
- Monitoring what people say about you when they don't tag you
- Understanding which content made someone follow you vs convert vs unsubscribe
- Running paid campaigns that learn from organic signal and vice versa
- Identifying the 50 accounts whose engagement drives your reach disproportionately
- Adapting your strategy when the algorithm shifts under your feet

MarkOS treats social channels as **full communication channels with bidirectional API access**.
Not just a publishing queue. An integrated operating layer.

---

## Platform Integration Depth Levels

Each platform is integrated at maximum possible API depth.

| Platform | Auth model | Content publish | Read feed | DMs | Comments | Ads | Analytics | Webhooks |
|----------|-----------|----------------|-----------|-----|----------|-----|-----------|---------|
| **Meta / Instagram** | Admin token + System User | ✅ | ✅ | ✅ Instagram DM API | ✅ | ✅ Meta Marketing API | ✅ Insights API | ✅ |
| **X (Twitter)** | OAuth 2.0 + App-only | ✅ | ✅ | ✅ DM API v2 | ✅ | ✅ Ads API | ✅ | ✅ |
| **LinkedIn** | OAuth 2.0 + Marketing Developer | ✅ | ✅ (own feed) | ✅ InMail | ✅ | ✅ Campaign Manager API | ✅ | ✅ |
| **TikTok** | TikTok for Business API | ✅ | ✅ | ✅ TikTok Business Messaging | ✅ | ✅ TikTok Marketing API | ✅ | ✅ |
| **YouTube** | YouTube Data API v3 | ✅ | ✅ | N/A | ✅ | ✅ Google Ads for YouTube | ✅ YouTube Analytics API | ✅ |
| **Pinterest** | Pinterest API v5 | ✅ | ✅ | N/A | N/A | ✅ | ✅ | ✅ |
| **Threads** | Threads API | ✅ | ✅ | N/A | ✅ | N/A (early 2026) | ✅ | ✅ |

---

## The Social Inbox System

### Architecture

Every inbound signal from every connected platform flows into a single unified inbox
in MarkOS. Not a feed display — a structured queue with routing logic.

```
Platform webhooks + polling
  ↓
Social Ingest Layer
  - normalize to MarkOS signal schema
  - classify: dm | comment | mention | reply | reaction | follow | story_reply
  ↓
Signal Router
  - attach: contact record (if known), thread context, prior history
  - classify: sentiment, intent, urgency, topic
  ↓
Action Queue
  - display in UI with context
  - route to Community Manager agent (SOC-03) for draft response
  - escalate high-urgency signals to human immediately
  ↓
Response Workflow
  - draft generated with brand voice + context
  - human review (configurable thresholds for auto-response)
  - published via platform API
  - outcome logged to CRM + social analytics
```

### Signal Schema

Every inbound social signal is normalized to this schema:

```yaml
signal_id: uuid
received_at: ISO8601
tenant_id: uuid

# Source
platform: meta | instagram | x | linkedin | tiktok | youtube | pinterest | threads
signal_type: dm | comment | mention | reply | reaction | follow | story_reply | video_comment
platform_signal_id: string  # platform's own ID for dedup

# Author
author_platform_id: string
author_username: string
author_display_name: string
author_follower_count: int | null
author_verified: bool
crm_contact_id: uuid | null  # linked if known contact

# Content
message_text: string
sentiment: positive | negative | neutral | mixed
intent: question | complaint | praise | purchase_intent | support_request | other
topics: string[]  # extracted topics
urgency: critical | high | medium | low  # critical = crisis risk
language: BCP47 language code

# Context
in_reply_to_signal_id: uuid | null  # thread linking
in_reply_to_post_id: string | null
post_context: string | null  # excerpt of the post being commented on

# Processing
response_draft_id: uuid | null
response_published_at: ISO8601 | null
response_signal_id: uuid | null  # the response signal itself
escalated: bool
escalation_reason: string | null
auto_responded: bool
```

---

## Comment Management

### What "comment management" means at API depth

Beyond reading and replying to comments, full API access enables:

**For Meta/Instagram:**
- Hide comments (automated for spam/harassment, on-brand filter)
- Delete comments (automated threshold, human-triggered)
- Pin comments (amplify best community responses)
- Restrict users
- Get comment author's full public profile for context
- Track if commenter is a follower, has purchased, is a known contact

**For YouTube:**
- Heart comments (automated for positive, high-quality engagement)
- Hold comments for review
- Report comments
- Reply to specific timestamps in video

**For TikTok:**
- Filter comments by keywords (automatic)
- Turn off comments per video
- Track comment trends across videos

### Comment Routing Logic

```
incoming comment
  → sentiment classification
  → intent classification
  → topic extraction
  → author profile lookup (CRM match)

routing decision:
  
  if intent == purchase_intent → high priority, route to Community Manager
  if intent == complaint + author has crm_contact → route to CRM activity + Community Manager
  if intent == question and answer is in knowledge base → auto-draft response
  if sentiment == negative + follower_count > threshold → escalate immediately
  if spam patterns detected → auto-hide + flag for human review
  if sentiment == positive + high engagement → flag for "pin" consideration

Community Manager agent (SOC-03):
  → generates response draft with full context
  → operator reviews in social inbox UI
  → one-click approve/edit/reject
  → approved responses published via API
  → all responses logged to CRM activity if contact match found
```

---

## DM Architecture

### The DM Operating System

DMs are a sales channel, support channel, and relationship channel simultaneously.
MarkOS treats them as such — not as a notification to respond to eventually.

**DM Inbox Streams connected:**
- Instagram Direct (Meta Graph API)
- Facebook Messenger (Meta Messenger API)
- X DMs (Twitter API v2)
- LinkedIn InMail + Messaging API (via LinkedIn Marketing Developer Program)
- TikTok Business Messaging API

**Unified DM inbox in MarkOS:**

```
incoming DM
  → author identification (CRM lookup)
  → conversation history retrieval (prior DMs, emails, social interactions)
  → intent classification:
    - support_request → route to support workflow
    - sales_inquiry → route to sales workflow + Lead Scorer
    - partnership_inquiry → route to designated team member
    - complaint → priority response + CRM flag
    - general → Community Manager drafts

  → context assembly for response agent:
    - person's name + history with brand
    - prior conversation thread
    - their CRM stage (if known lead)
    - their purchase history (if known customer)
    - the content they came from (if trackable)

  → Community Manager agent generates response
  → operator approval (configurable: auto-respond for FAQs, human review for sales/complaints)
  → published via platform DM API
  → conversation logged to CRM activity
```

### DM Automation (with strict guardrails)

For specific, defined scenarios, DMs can be sent automatically without human review:
- Welcome message to new followers who match ICP criteria
- Response to specific trigger keywords ("pricing", "demo", "how do I") with templated responses
- Follow-up to someone who clicked an ad but didn't convert (platform-dependent)
- Delivery confirmation or support ticket creation for complaint DMs

Every automation scenario:
1. Must be explicitly configured by the operator
2. Must include brand voice compliance
3. Is rate-limited to prevent spam patterns
4. Logs every automated message to the CRM
5. Has a human escape hatch (any human reply pauses automation)

### Lead Pipeline from DMs

High-intent DMs (price inquiries, demo requests, partnership inquiries) flow into the CRM as leads:

```
DM: "Hi, how much does MarkOS cost for a 5-person team?"

→ intent: sales_inquiry, score: high
→ CRM: create contact (enrich from LinkedIn/Clearbit/Apollo)
→ route to Lead Scorer (AUD-03): score = 72/100
→ CRM stage: MQL
→ Meeting Intelligence Agent: prepare demo context
→ Community Manager: draft personalized response with pricing + CTA
→ follow-up sequence triggered if no reply in 48h
```

---

## Social Listening Architecture

### What we're listening for

1. **Direct brand mentions** — @brand tag, brand name without tag
2. **Product/service mentions** — "markos", "markos app", "using markos for"
3. **Competitive mentions** — competitor brands mentioned in context we could serve
4. **Relevant conversations** — conversations in our ICP that relate to our pain tags
5. **Trend signals** — emerging topics in our industry before they peak
6. **Crisis signals** — negative sentiment clusters about the brand or industry

### Listening Sources

| Source | Access method | Depth |
|--------|--------------|-------|
| X mentions | X API v2 search | Full |
| Instagram mentions | Meta Graph API | Mentions only (not hashtag browsing w/o approval) |
| LinkedIn mentions | LinkedIn API | Limited to posts mentioning brand page |
| TikTok | TikTok Research API | Hashtags + mentions |
| Reddit | Reddit API | Keyword search across relevant subreddits |
| YouTube | YouTube Data API | Comment search, channel mentions |
| News & blogs | NewsAPI + RSS + web crawl | Full coverage |
| Review sites | G2, Capterra, Trustpilot, App Store APIs | Structured review data |
| Forums | Discord (via bot), Slack community monitoring | By explicit invite only |

### Listening Data Pipeline

```
raw signals from all sources
  ↓
dedup + spam filter
  ↓
entity recognition (brand, product, person, competitor)
  ↓
sentiment analysis (per platform-calibrated model)
  ↓
intent classification
  ↓
topic extraction + pain-tag mapping
  ↓
influence scoring (author reach, engagement rate)
  ↓
aggregation into listening dashboard
  ↓
Social Listener (SOC-04) produces:
  - daily digest: volume trends, sentiment, top mentions, notable signals
  - immediate alerts: spike detection, crisis signals, VIP brand mentions
  - weekly insight: trend analysis, competitive intelligence signals, opportunity flags
```

### Crisis Detection

Crisis signals are defined per tenant but include default triggers:
- Sentiment shift: >40% negative in 4-hour window (vs baseline)
- Volume spike: >3× normal mention volume
- High-influence negative mention (follower count threshold)
- Coordinated negative activity patterns (bot detection signals)
- Specific crisis keywords: "refund", "fraud", "scam", "lawsuit", "data breach"

When crisis detected:
1. Immediate alert to all operator email addresses
2. Crisis Comms Monitor (SOC-10) assembles situation brief + holding statement
3. All automated responses paused pending human decision
4. War room view activated in admin UI

---

## Social Publishing System

### Content Architecture per Platform

Every platform gets native content — not repurposed.

**Meta / Instagram:**
- Feed posts: image + caption (brand-calibrated, SEO for Instagram search)
- Carousels: structured with hook slide, value slides, CTA slide
- Reels: script with hook/body/CTA structure, caption with keywords
- Stories: ephemeral content with interactive elements (polls, questions, swipe-up)
- Instagram Guides: curated content clusters

**X (Twitter):**
- Single tweet: hook-focused, limited emoji, no jargon
- Thread: structured argument or story, each tweet stands alone
- Quote tweets: commentary on industry news or competitor moves (brand-safe rules applied)
- Replies to conversations (Community Manager function)

**LinkedIn:**
- Short post: insight or data point, professional register, no hashtag stuffing
- Long-form post (newsletter): thought leadership, 800–1500 words, document format
- Article: SEO-optimized long-form on LinkedIn Pulse
- Document post: carousel/PDF format — LinkedIn's highest-organic-reach format currently
- Company page: content distinct from personal brand content

**TikTok:**
- Short-form video scripts: 15–60s, hook in <2s, single insight per video
- TikTok text posts (new format)
- Duet/stitch strategy for relevant viral content

**YouTube:**
- Long-form: scripts, chapters, pinned comments, cards
- YouTube Shorts: sub-60s scripts, same hook/body/CTA structure

### Optimal Timing Engine

Timing is not a static "post at 9am Tuesday" rule. It is per-account, per-format, per-audience.

The timing engine:
1. Pulls platform analytics to identify when the tenant's specific audience is most active
2. Cross-references historical post performance at different times
3. Applies cross-tenant benchmarks for the channel + industry combination
4. Adjusts for day of week, seasonality, campaign context (don't post casual content day-of a product launch)
5. Produces an optimal publish window for each piece of content

---

## The Social-to-Revenue Loop

Social is not just brand awareness. In MarkOS, every piece of social infrastructure is
connected to the revenue pipeline.

```
Social touchpoint → UTM-tagged link → landing page
  ↓
Conversion: form fill / purchase / trial signup
  ↓
CRM: contact created with social source attribution
  ↓
Attribution model: social campaign gets credit via UTM
  ↓
CRM lead progresses through pipeline
  ↓
Deal closes → revenue attributed
  ↓
Attribution model updated: this social format drove $X pipeline
  ↓
Social budget allocation adjusted accordingly
```

### Social Signal → CRM Integration

When a social action happens from a known contact:
- New follower = awareness signal logged to CRM contact record
- Saves a post = consideration signal
- Clicks a link = intent signal
- DMs = high-intent signal + routing to sales workflow
- Engages with multiple pieces = scoring uplift

These signals feed Lead Scorer (AUD-03) and update the contact's CRM stage and
sequencing eligibility.

---

## Platform-Specific Tactical Notes

### Meta / Instagram — Admin Token Architecture

MarkOS uses a Meta System User with Admin access to the tenant's Business Manager.
This gives access to:
- All Pages + Instagram accounts under the Business Manager
- Instagram Graph API for content publishing + DM API
- Meta Marketing API for all ad account management
- Business asset permissions (catalogs, pixels, custom audiences)
- Conversions API (CAPI) for server-side conversion tracking

The System User token is encrypted at rest in MarkOS (same pattern as BYOK LLM keys).
Token rotation is automated every 60 days.

### LinkedIn — Organic + Paid Unified

LinkedIn requires separate authentication for:
- Company Page management (LinkedIn Pages API)
- Personal brand posting (requires individual OAuth — not Company)
- Campaign Manager (LinkedIn Marketing Developer Program)
- InMail / Messaging (requires specific program access)

MarkOS manages all of these under a unified LinkedIn integration with explicit permission
scopes per capability. Personal brand posting always requires operator OAuth and explicit
consent — we do not impersonate individuals.

### TikTok — Creator vs Business Distinction

TikTok Business accounts and Creator accounts have different API access. MarkOS integrates
with TikTok for Business for:
- Content publishing (TikTok Content Posting API)
- Comment management
- Ads (TikTok Marketing API)
- Analytics (TikTok Business API)

TikTok's DM API (Business Messaging) is currently in closed beta — integration is
planned once generally available.

### X — Rate Limits and API Tier Management

X API v2 has aggressive rate limits on free/basic tiers. MarkOS manages:
- Rate limit budgets per tenant
- Priority queueing (crisis response gets rate limit priority over analytics pulls)
- Automatic backoff and retry with exponential delay
- Separate app tokens per tenant to avoid shared rate limit pools

---

## Privacy, Consent, and Platform Policy Compliance

Every social integration operates within platform Terms of Service and applicable law:

1. **No unauthorized data scraping.** All data comes from official APIs with proper auth.
2. **DM automation follows platform rules.** Each platform has rules about automated DMs — MarkOS respects them.
3. **User consent for contact enrichment.** When a DM author is matched to a CRM contact, this is disclosed in the privacy policy.
4. **GDPR/CCPA for EU/CA residents.** Social signal data tied to identified individuals is treated as personal data.
5. **Platform policy review is ongoing.** Market Scanner (RES-03) monitors platform policy change announcements and alerts operators.
