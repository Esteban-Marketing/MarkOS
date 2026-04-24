# MarkOS Pricing & Cost Model

> 2026-04-22 update: fixed public tier prices in this document are historical assumptions. Active pricing doctrine is now owned by `15-PRICING-ENGINE.md` and [[Pricing Engine Canon]]. Use `{{MARKOS_PRICING_ENGINE_PENDING}}` until the Pricing Engine produces approved recommendations.
## Historical Metered AI · BYOK Cost Inputs · Unit Economics · LTV Model · Packaging

---

## Pricing Philosophy

MarkOS pricing has one job: make the value obvious before the cost is painful.

The biggest mistake SaaS AI tools make is pricing by seat or by feature. Seats don't
scale with value (a 5-person marketing team on MarkOS might generate 10× the output of
a 10-person team using it passively). Features don't scale with value either (a company
using the social OS intensively gets far more value than one who uses it once a week).

MarkOS prices on **two axes that actually correlate with value delivered:**

1. **Platform tier** — which capabilities you have access to (seat + feature limits)
2. **AI usage** — how much AI compute you consume (metered, pay-as-you-go on top of platform)

This means the pricing model grows with the customer. Small teams pay small amounts.
Large teams with intensive usage pay more — but they're getting proportionally more.

The secondary principle: **the buyer must never be surprised.** The cost calculator
is prominently available before any commitment. Budget controls are a first-class
feature, not buried in settings.

---

## Part 1: Pricing Tiers

### Tier 1: Starter - `{{MARKOS_PRICING_ENGINE_PENDING}}`

**Who it's for:** Solo operators, early-stage startups, single-brand founders running their own marketing.

**Includes:**
- 1 workspace (1 brand)
- 3 operator seats
- Phase 1 agent network (22 agents)
- 5 connector slots (e.g. GA4, GSC, 1 social platform, 1 ad platform, 1 ESP)
- Client portal: not available
- AI credit inclusion pending Pricing Engine recommendation
- 10GB asset storage
- 12-month data retention

**Soft limits (upgrade prompts, not hard blocks):**
- 30 agent runs/day
- 10 approval queue items at any time
- 5 active campaigns

**Overage:** AI usage inclusion and overage posture pending Pricing Engine recommendation.

---

### Tier 2: Professional - `{{MARKOS_PRICING_ENGINE_PENDING}}`

**Who it's for:** Growing marketing teams, in-house marketers at Series A–B companies, consultants managing 1–3 clients.

**Includes:**
- 3 workspaces (3 brands)
- 8 operator seats
- Phase 1 + Phase 2 agent network (50 agents)
- 15 connector slots
- Client portal: up to 3 client accounts with portal access
- AI credit inclusion pending Pricing Engine recommendation
- 50GB asset storage
- 24-month data retention
- Priority support (8h response SLA)

**Soft limits:**
- 150 agent runs/day
- Unlimited approval queue
- 20 active campaigns

---

### Tier 3: Agency - `{{MARKOS_PRICING_ENGINE_PENDING}}`

**Who it's for:** Marketing agencies managing multiple clients, growth teams at Series B–C companies, CMOs who want the full system.

**Includes:**
- Unlimited workspaces
- 20 operator seats
- Full agent network (all phases as released)
- Unlimited connectors
- Client portal: unlimited client accounts
- AI credit inclusion pending Pricing Engine recommendation
- 500GB asset storage
- 36-month data retention
- White-label client portal (custom domain, no MarkOS branding)
- Priority support (2h response SLA)
- Quarterly strategy call with MarkOS team
- Early access to new agents and features

**No soft limits** on agent runs or campaigns (budget cap is the only limit)

---

### Tier 4: Enterprise — Custom pricing

**Who it's for:** Large marketing organizations (100+ employees), enterprise with strict security and compliance requirements, large agencies with 20+ clients.

**Custom pricing covers:**
- Volume AI credits (negotiated rate, typically 20–40% below metered)
- BYOK standard (no MarkOS managed LLM costs)
- Dedicated infrastructure (no shared tenancy)
- Custom data retention (up to unlimited)
- SSO/SAML integration
- Advanced security: SOC 2 Type II report, custom DPA, data residency options
- SLA: 99.9% uptime guarantee, 1h critical support response
- Custom contract terms (annual only)
- Dedicated customer success manager

**Starting point:** `{{MARKOS_PRICING_ENGINE_PENDING}}` + AI usage or BYOK, pending Pricing Engine recommendation.

---

## Part 2: AI Usage Metering

### How AI usage is measured

Every agent run consumes AI. The cost of a run depends on:
- Which model was used
- How many tokens were consumed (input + output)
- Which tools were invoked (web search, external API calls)

MarkOS tracks this at run-level granularity (see `09-ORCHESTRATION-CONTRACT.md` Part 4).
The tenant sees their usage in a real-time dashboard.

### Published token rates (MarkOS metered, as of 2026)

MarkOS resells LLM capacity at a markup to cover infrastructure, reliability, and the
platform margin. Rates are published and updated when model provider pricing changes.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| claude-sonnet (primary) | $3.50 | $10.50 |
| claude-haiku (lightweight tasks) | $0.30 | $1.50 |
| openai-gpt-4o (fallback / BYOK) | $5.00 | $15.00 |
| gemini-1.5-pro (fallback / BYOK) | $3.50 | $10.50 |

*These represent MarkOS's metered rates, which include a ~30% platform markup over
provider cost. Exact rates published at markos.ai/pricing and updated on change.*

### Typical usage costs per artifact type

This is what operators actually care about. How much does a blog post cost?

| Artifact type | Avg. tokens in | Avg. tokens out | Avg. total AI cost |
|--------------|---------------|----------------|-------------------|
| Content brief (CONT-02) | 12,000 | 3,000 | $0.18 |
| Long-form blog post (CONT-03) | 25,000 | 8,000 | $0.45 |
| Full edit pass (CONT-10) | 30,000 | 5,000 | $0.36 |
| SEO optimization (CONT-11) | 20,000 | 3,000 | $0.25 |
| **Total: one blog post end-to-end** | | | **~$1.24** |
| Short social caption (CONT-06) | 5,000 | 800 | $0.06 |
| Email sequence (5 emails) (CONT-05) | 18,000 | 6,000 | $0.38 |
| SEO audit (RES-06) | 40,000 | 12,000 | $1.40 |
| Weekly performance narrative (ANA-01) | 35,000 | 5,000 | $0.90 |
| Lead scoring, single lead (AUD-03) | 3,000 | 500 | $0.04 |
| B2B outreach email (LG-02) | 8,000 | 1,500 | $0.12 |
| Deep research report (RES-01) | 80,000 | 20,000 | $4.10 |

**A typical Professional tenant producing 12 blog posts, 60 social posts, 4 email sequences,
and running weekly analytics per month consumes approximately $80–$140/month in AI usage.**
This sits comfortably within the $200 included credit.

An Agency tenant running 8 clients at similar intensity: $640–$1,120/month AI usage.
Included $500 credit + ~$200 overage on average. Factored into the agency pricing model.

### Web search tool costs

When agents invoke web search (Deep Researcher, Competitive Monitor, etc.), tool calls
are billed separately:

| Tool | Cost per call |
|------|-------------|
| Web search (per query) | $0.005 |
| Web fetch (per page) | $0.002 |
| BuiltWith API lookup | $0.08 |
| Apollo enrichment (per contact) | $0.05 |
| Clearbit enrichment (per domain) | $0.05 |

A deep research report typically makes 20–40 search calls and 15–25 fetches: ~$0.30 in tool costs.

---

## Part 3: BYOK (Bring Your Own Key)

### When BYOK makes sense

BYOK is attractive to three types of tenants:
1. **Enterprise tenants** with existing LLM contracts (negotiated rates, compliance requirements)
2. **High-volume tenants** whose AI usage cost at MarkOS metered rates exceeds the cost of a direct API contract
3. **Compliance-sensitive tenants** who need data processed under their own API agreement (zero-retention, BAA, etc.)

BYOK tier availability and admin fee are `{{MARKOS_PRICING_ENGINE_PENDING}}` and should be generated by the Pricing Engine.

### BYOK economics

When BYOK is active:
- LLM token costs are paid by the tenant directly to their provider
- MarkOS charges a reduced platform fee (the "BYOK rate" — typically $0.50–$1.50 per 1,000 agent output tokens, covering orchestration, tooling, and reliability)
- Tool call costs (web search, enrichment APIs) are still billed through MarkOS

Break-even analysis for Professional tier:
- Included credit: `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Typical overage if above: `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Total LLM cost on MarkOS: `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Direct provider cost at same volume: sourced by Pricing Engine / cost model
- MarkOS BYOK admin fee: `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Total with BYOK: `{{MARKOS_PRICING_ENGINE_PENDING}}`

BYOK makes financial sense for tenants spending >$350/month in AI on MarkOS.
MarkOS should make this calculation visible in the billing dashboard so operators
can make an informed decision, even when that decision reduces MarkOS revenue.
This is a trust feature.

---

## Part 4: Unit Economics

### Customer Acquisition Cost (CAC) targets

From the Tenant 0 marketing motion (see `14-GO-TO-MARKET.md`), the expected blended CAC:

| Channel | Expected CAC | Notes |
|---------|-------------|-------|
| Inbound content (SEO) | $200–$400 | High intent, 3–6 month lag |
| Paid search (demo request) | $800–$1,500 | Immediate, high intent |
| Referral / word of mouth | $100–$200 | Lower volume, highest quality |
| Cold outbound (B2B) | $1,200–$2,000 | Used for agency/enterprise motion |
| Product Hunt / community | $50–$150 | Launch spike, lower retention |
| Blended target | **$600–$900** | Based on assumed channel mix |

### LTV model

LTV = (ARPU × Gross Margin) / Churn Rate

Target parameters:

| Metric | Target | Notes |
|--------|--------|-------|
| Starter ARPU | `{{MARKOS_PRICING_ENGINE_PENDING}}` | Generated by Pricing Engine |
| Professional ARPU | `{{MARKOS_PRICING_ENGINE_PENDING}}` | Generated by Pricing Engine |
| Agency ARPU | `{{MARKOS_PRICING_ENGINE_PENDING}}` | Generated by Pricing Engine |
| Blended ARPU (Phase 1) | $650/month | Mix-weighted, mostly Pro |
| Gross margin (target) | 72–78% | LLM costs are COGS; infra ~10% of revenue |
| Monthly churn target | 2.5% | = ~65% annual retention |
| Blended LTV | **$18,720** | ($650 × 0.75) / 0.025 |

**Target LTV:CAC ratio: > 3:1** (at blended CAC of $750)
At these numbers: LTV/CAC = $18,720 / $750 = **24.9×** — very healthy if churn holds.

Churn risk factors (monitored via health scoring):
- Operator hasn't logged in for 7 days (early warning)
- No agent runs in 14 days (disengagement signal)
- Approval inbox backlog > 20 items for 5+ days (overwhelm signal → onboarding/education trigger)
- No content published in 21 days (activation failure)

### Expansion revenue

Expansion levers (tracked separately from churn):
- Tier upgrades (Starter → Professional → Agency): target 15% of base monthly
- AI usage overage: target 25–35% of base monthly
- Add-on modules (when introduced): enterprise features, additional storage, etc.
- BYOK admin fees: reduces AI revenue but improves retention on high-usage tenants

Net Revenue Retention (NRR) target: **115–125%**
This means the cohort of customers from month 1 is worth 115–125% of original MRR by month 13,
even accounting for churn, because expansion from remaining customers exceeds churned revenue.

---

## Part 5: Gross Margin Architecture

Where MarkOS spends money to deliver the product:

**COGS (Cost of Goods Sold):**

| Line item | % of revenue | Notes |
|-----------|-------------|-------|
| LLM API costs (managed keys) | 12–18% | Largest COGS item; improves with volume discounts |
| Tool API costs (search, enrichment) | 3–5% | Scales with usage |
| Infrastructure (Vercel, Supabase, Upstash) | 6–8% | Improves with scale |
| **Total COGS** | **21–31%** | |
| **Gross margin** | **69–79%** | Target band |

**Gross margin improvement levers:**
- LLM provider volume discounts (kick in at significant scale)
- Model routing: use Haiku for lightweight tasks instead of Sonnet (already in architecture)
- Prompt optimization: shorter, more efficient prompts (LIT system improves this over time)
- Caching: frequently-run, identical-input prompts cached for 24h (e.g. benchmark data lookups)
- BYOK adoption: shifts LLM COGS entirely off MarkOS books

At 200 tenants on Professional+, infrastructure costs drop to ~4% of revenue. At 1,000 tenants,
LLM volume discounts bring API costs down 20–30% from published rates. Gross margin at scale
target: **80%+**.

---

## Part 6: Pricing for the Agency Business Model

Agencies have a different economics than direct customers. They are resellers of MarkOS value.

**Agency economics:**

An agency on an engine-priced Agency plan managing 8 clients:
- MarkOS cost: `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Per client cost: $287.50/month
- Agency charges each client: $3,000–$8,000/month for "AI-powered marketing services"
- Markup per client: 10–28×
- Agency gross margin on MarkOS-powered services: 85%+

This math is the most powerful sales argument for agency customers. MarkOS should
build an ROI calculator that agencies can show to their own clients:

```
Your agency's current delivery cost per client: [input]
With MarkOS, your capacity per operator:        10–15 clients (vs 3–4 without)
Monthly MarkOS cost per client:                 ~$290
Your service fee per client:                    [input]
Your gross margin per client with MarkOS:       [calculated]
```

This calculator lives in the marketing site and in the sales deck. It is the core
conversion argument for the agency motion.

### Agency reseller program (Phase 2)

At sufficient scale, introduce a formal reseller program:
- Agencies can resell MarkOS under their own branding
- Volume tier pricing: >5 clients on Agency plan → 20% discount
- Referral revenue: agencies who refer new direct tenants earn 15% of first-year revenue
- Case study co-marketing: agencies who share performance metrics get co-branded case studies

---

## Part 7: Free Trial Design

**14-day free trial, full feature access, budget capped at $50 AI credits.**

Trial design principles:
- No credit card required at signup
- Full Professional feature set during trial (not a limited "free tier")
- $50 AI credit is enough to complete onboarding + run ~3 weeks of normal activity
- Day 12: "Your trial ends in 2 days" email with: specific list of what they've accomplished,
  what's in the queue, and what they'd lose without continuing
- Day 14: trial expiration — all scheduled runs pause, data retained for 30 days,
  CTA to reactivate with payment

**Why no free tier (permanently free):**
A free tier attracts the wrong users — experimenters, not operators. MarkOS requires
configuration investment (brand pack, connectors) that only makes sense if the user
intends to use it as a real system. A free tier also creates support burden for users
who will never pay. The 14-day trial with full access is more compelling than a
permanent free tier with crippled features, and it screens for intent.

**Exception: non-profit and open-source program**
- 501(c)(3) organizations: 50% discount on any plan
- Application-based, reviewed quarterly
- Limit: first 50 non-profits
