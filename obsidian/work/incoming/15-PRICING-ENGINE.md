# MarkOS Pricing Engine
## Competitive Intelligence · Cost Modeling · Strategy Recommendations · SaaS · eCommerce · Services

---

## Why Pricing Gets Its Own Engine

Pricing is the highest-leverage marketing decision a company makes. A 1% improvement
in pricing strategy produces a 10–15× greater impact on profit than a 1% improvement
in acquisition volume. Yet most companies set prices once, watch competitors passively,
and never build a systematic process for knowing whether their pricing is leaving money
on the table or costing them conversions.

The Pricing Engine is MarkOS's answer to this. It is not a pricing calculator.
It is a **continuous intelligence and recommendation system** that:

1. Monitors competitors' pricing pages, packaging structures, and discount patterns in real time
2. Builds a structured cost model per tenant so every pricing recommendation is margin-aware
3. Synthesizes market positioning, value metrics, and buyer psychology into actionable strategies
4. Alerts operators to competitor price changes, market shifts, and their own pricing anomalies
5. Recommends and helps test specific pricing changes with projected impact

The engine is built three times — once for SaaS, once for eCommerce, once for Services —
because these are genuinely different pricing problems with different data, different
strategies, and different failure modes.

The engine is exposed three ways: through the MarkOS UI for direct operator use,
through the MarkOS API for programmatic integration, and through the MarkOS MCP server
so every AI agent in the system can query live pricing intelligence when it needs it.

---

## Part 1: The Pricing Intelligence Architecture

### The four data layers

Every pricing recommendation the engine makes is grounded in four data layers,
assembled in order from most to least authoritative:

```
Layer 1: Own pricing and cost data (most authoritative)
  Source: Tenant-configured cost model + current pricing
  What it contains: COGS, margin targets, current prices, historical price changes,
                    conversion rates by price point, churn by price tier
  Freshness: Real-time (cost model) + daily (performance metrics)

Layer 2: Competitor pricing intelligence (authoritative for market positioning)
  Source: Pricing page crawler + web search + structured extraction
  What it contains: Competitor prices, tier structures, value metrics, feature sets per tier,
                    free trial/freemium structure, discount signals, annual vs monthly delta
  Freshness: Daily crawl for tier-1 competitors, weekly for tier-2+

Layer 3: Market pricing signals (reliable for positioning context)
  Source: G2, Capterra, pricing databases, community discussions, public job listings
  What it contains: Buyer price sensitivity signals, "too expensive" review patterns,
                    what buyers say about value, market rate ranges for category
  Freshness: Weekly synthesis

Layer 4: Strategic pricing intelligence (contextual, advisory)
  Source: Deep research via RES-01 + pricing research literature + analyst reports
  What it contains: Pricing psychology frameworks, value metric benchmarks, elasticity
                    data for the category, successful pricing strategy case studies
  Freshness: Monthly + on-strategy-change events
```

### The Pricing Knowledge Object

Every piece of pricing intelligence is stored as a structured, versioned, dated record.
Nothing in the pricing engine is ever a raw web scrape. Everything passes through
extraction, normalization, and quality scoring before it enters the knowledge store.

```typescript
interface PricingKnowledgeObject {
  pkg_id: string
  tenant_id: string
  subject_type: 'own' | 'competitor' | 'market' | 'strategic'
  subject_entity: string          // tenant name or competitor domain
  business_type: 'saas' | 'ecommerce' | 'services'

  // Extracted structure
  pricing_model: PricingModel
  tiers: PricingTier[]
  value_metric: ValueMetric | null
  free_structure: FreeStructure | null
  discount_signals: DiscountSignal[]
  feature_matrix: FeatureMatrixEntry[]

  // Intelligence metadata
  source_url: string | null
  source_quality_score: number      // using SQS from 06-RESEARCH-ENGINE.md
  extracted_at: string              // ISO8601
  extraction_method: 'crawler' | 'api' | 'manual' | 'llm_extraction'
  confidence: 'high' | 'medium' | 'low'
  change_detected: boolean          // true if different from previous version
  previous_pkg_id: string | null    // enables price change history

  // Diff tracking
  changed_fields: string[]          // which fields changed vs previous version
  change_magnitude: 'major' | 'minor' | 'cosmetic'
    // major: tier added/removed, price change >10%, value metric changed
    // minor: price change <10%, feature added to tier, copy change
    // cosmetic: layout change, FAQ update, no pricing data change
}

interface PricingTier {
  tier_id: string
  tier_name: string                 // "Starter", "Pro", "Enterprise"
  tier_position: number             // 1 = entry, higher = premium
  price_monthly: number | null      // null if not published (e.g. "Contact us")
  price_annual: number | null       // monthly equivalent when paid annually
  price_annual_discount_pct: number | null
  currency: string                  // ISO 4217
  billing_frequency: string[]       // ['monthly', 'annual', 'quarterly']
  value_metric_limit: string | null // "up to 5 users", "10,000 API calls/mo"
  is_free: boolean
  is_freemium: boolean
  is_enterprise_custom: boolean
  features: string[]                // extracted feature list for this tier
  highlighted_features: string[]    // features the company calls out as selling points
  cta_text: string | null           // "Start free trial", "Get started", "Contact sales"
  trial_days: number | null
}

interface ValueMetric {
  metric_type: ValueMetricType
  metric_label: string              // "per seat", "per 1,000 orders", "per project"
  overage_pricing: OveragePricing | null
}

type ValueMetricType =
  | 'per_seat'              // SaaS user-based
  | 'per_mau'               // monthly active users
  | 'per_api_call'          // usage-based SaaS
  | 'per_revenue'           // % of GMV — common in payments, ecommerce platforms
  | 'per_order'             // ecommerce transaction fee
  | 'per_project'           // services / agencies
  | 'per_hour'              // services / consulting
  | 'flat_rate'             // fixed monthly regardless of usage
  | 'per_contact'           // CRM / email marketing
  | 'per_location'          // multi-location businesses
  | 'per_feature_set'       // feature-gated (no usage limit within tier)
  | 'hybrid'                // combination of above
```

---

## Part 2: The Competitor Pricing Intelligence System

### What "monitoring competitor pricing" actually means

Most teams "monitor competitor pricing" by occasionally visiting the pricing page.
The MarkOS Pricing Engine does this systematically, at scale, and with extraction depth
that turns a pricing page into a structured dataset comparable across competitors and over time.

### The pricing page crawler

A specialized crawler runs daily against every competitor's pricing page.
This is not a general web crawler. It is purpose-built for pricing extraction.

```
Crawler pipeline:

Step 1: Target list maintenance
  Per tenant, a competitor list is maintained (from RES-02 Competitive Monitor feed):
    - Tier 1 competitors (direct, most important): daily crawl
    - Tier 2 competitors (adjacent, secondary): weekly crawl
    - Market signals list (category entrants, analysts mention): monthly crawl
  
  Crawler start URLs: pricing pages, not homepages
    - Primary: {competitor.com}/pricing
    - Common alternates: /plans, /packages, /subscription, /buy, /get-started
    - If no pricing page found: flag as "pricing not public" (itself a signal)

Step 2: Render and extract
  Headless Chromium renders the pricing page (JS-heavy pages need rendering)
  DOM extraction targets:
    - Price figures: numerical patterns with currency symbols
    - Tier names: heading-level text in pricing section
    - Feature lists: bullet points, checkmarks, ✓ symbols in pricing grid
    - CTAs: button text adjacent to price points
    - Toggle state: monthly/annual pricing toggle is captured in both states
    - Discount badges: "Save 20%", "Best value", "Most popular"
    - Social proof adjacent to pricing: "Trusted by X companies", star ratings

Step 3: LLM-assisted normalization
  Raw DOM content passed to a lightweight extraction model:
  
  System prompt:
  "You are extracting pricing data from a software pricing page.
   Extract ALL pricing tiers with their exact prices, features, and constraints.
   If a price is not publicly listed (enterprise, custom), record as null.
   If pricing requires a toggle (monthly/annual), extract both states.
   Preserve exact feature wording — do not paraphrase.
   Output ONLY valid JSON matching the PricingTier schema. No commentary."
  
  Output: structured PricingKnowledgeObject draft

Step 4: Diff against previous version
  Compare extracted PKO with most recent stored PKO for same competitor:
    - No change: log crawl timestamp, no alert
    - Minor change: log with change_magnitude: 'minor', queue for weekly digest
    - Major change: IMMEDIATE ALERT — creates P1 notification for operator
      Alert format: "[Competitor] changed their pricing. [Specific change]. See full diff."

Step 5: Store + index
  PKO stored in markos_pricing_intelligence table
  Competitor's pricing history maintained (every version kept — no overwrites)
  Vector embedding of pricing description indexed for semantic search
```

### Price change detection and alerting

Price changes from direct competitors are among the most actionable signals in marketing.
They imply: the competitor found their current pricing was wrong, the market is shifting,
or they are repositioning. The Pricing Engine makes this signal impossible to miss.

**Alert tiers for competitor price changes:**

| Change type | Alert level | Delivery |
|-------------|-------------|---------|
| Direct competitor raises prices >10% | P1 — Urgent | Push + email |
| Direct competitor drops prices >10% | P1 — Urgent | Push + email |
| Direct competitor adds a free tier | P1 — Urgent | Push + email |
| Direct competitor removes a tier | P2 — Normal | In-app + email digest |
| Direct competitor changes value metric | P1 — Urgent | Push + email |
| Adjacent competitor raises prices | P2 — Normal | Weekly digest |
| New competitor detected with pricing | P2 — Normal | In-app |
| Any competitor updates pricing page (minor) | P3 — Info | Weekly digest |

**Alert content format:**

```
⚡ Competitor Pricing Alert

Intercom updated their pricing [detected 43 minutes ago]

WHAT CHANGED:
  Starter tier: $74/month → $99/month  (+34%)
  Pro tier:     $169/month → $199/month  (+18%)
  Annual discount: unchanged at 20%

WHAT THIS MEANS FOR YOU:
  → Your "Professional" tier ($79/month) is now positioned BELOW their Starter.
    You have pricing room to increase OR a new positioning opportunity.
  → Their price increase signals confidence in retention — churn is low enough
    to absorb the increase. Industry context: this follows similar moves by
    Zendesk (+22%) and Freshdesk (+18%) in the past 6 months.

AGENT RECOMMENDATION (PRC-04):
  "This is a positive competitive signal. Intercom's increase validates that
   the $79–$99 range is underpaying for the category. Three options analyzed:
   Option A, B, C — see full analysis in Pricing Engine."

[ View Full Analysis ]  [ Dismiss ]
```

### The competitor pricing matrix

The Pricing Engine maintains a live comparative matrix across all tracked competitors:

```
COMPETITOR PRICING MATRIX — B2B SaaS Helpdesk Category [Updated: today]

                  Entry tier    Mid tier    Top tier    Value metric    Free?
Your product      $79/mo        $199/mo     Custom      Per seat        Trial only
Intercom          $99/mo        $199/mo     Custom      Per seat        No
Zendesk           $55/mo        $89/mo      $115/mo     Per agent       Yes (limited)
Freshdesk         $15/mo        $49/mo      $79/mo      Per agent       Yes (3 agents)
HelpScout         $20/mo        $40/mo      $65/mo      Per mailbox     Trial only
Groove            $16/mo        $36/mo      $56/mo      Per seat        Trial only

Your position:  PREMIUM vs. category  (Entry tier: 78th percentile)
Price gap to nearest competitor: +$20/mo entry vs. Intercom (22% premium)
Coverage: 6/8 tracked competitors have public pricing (2 enterprise-only)

Last change in category: Intercom +34% entry tier [3 days ago]
Category pricing trend (90 days): +8.2% average across tracked competitors
```

---

## Part 3: The Cost Model

### Why cost knowledge is mandatory for pricing

Any pricing recommendation made without cost knowledge is a guess. The Pricing Engine
refuses to produce pricing strategy recommendations without a tenant-configured cost model.
The reason is simple: a price that looks competitive in the market may be destroying margin.
A price that looks expensive may be the minimum viable number.

The cost model is built once (during a setup wizard) and maintained as costs change.
It integrates with financial connectors where available (QuickBooks, Stripe revenue data).

### Cost model schema

```typescript
interface TenantCostModel {
  cost_model_id: string
  tenant_id: string
  business_type: 'saas' | 'ecommerce' | 'services'
  currency: string
  configured_at: string
  last_updated_at: string
  confidence_level: 'estimated' | 'accounting_verified' | 'cfo_reviewed'

  // Direct product costs (COGS)
  cogs: COGSStructure

  // Operating costs (for contribution margin modeling)
  opex_monthly: OpexStructure

  // Revenue data (for margin actuals)
  revenue_actuals: RevenueActuals | null

  // Derived metrics (computed, not input)
  gross_margin_pct: number
  contribution_margin_pct: number
  break_even_arpu: number           // minimum ARPU to cover COGS per customer
  target_gross_margin_pct: number   // operator-set target
  pricing_floor: PricingFloor       // computed minimum viable price per tier
}

// SaaS-specific COGS
interface SaaSCOGS {
  infrastructure_monthly: number    // Vercel, Supabase, AWS, etc.
  infrastructure_per_tenant: number // marginal cost per new tenant
  llm_costs_monthly: number         // AI/LLM API costs
  llm_cost_per_tenant: number       // average per tenant
  third_party_apis_monthly: number  // tools billed per tenant (e.g. Twilio, SendGrid)
  support_cost_per_ticket: number   // fully-loaded cost per support interaction
  avg_tickets_per_tenant_monthly: number
  payment_processing_pct: number    // Stripe fees etc. (typically 2.9% + $0.30)
}

// eCommerce-specific COGS
interface EcommerceCOGS {
  cogs_pct_of_revenue: number         // average COGS as % of sale price
  fulfillment_cost_per_order: number  // pick/pack/ship
  return_rate_pct: number
  return_processing_cost: number
  payment_processing_pct: number
  platform_fee_pct: number            // Shopify, etc. transaction fee
  storage_cost_monthly: number
  avg_order_value: number             // used to compute per-order margins
}

// Services-specific COGS
interface ServicesCOGS {
  fully_loaded_hourly_cost: number    // salary + benefits + overhead per billable hour
  subcontractor_avg_rate: number | null
  tools_cost_per_project: number
  avg_project_duration_hours: number
  billable_utilization_rate: number   // typically 0.65–0.80 for services firms
  overhead_multiplier: number         // overhead as multiple of direct labor cost
}
```

### The pricing floor

The pricing floor is the most important output of the cost model — the minimum price
below which a unit of revenue destroys value.

```
PRICING FLOOR COMPUTATION (SaaS example):

  Infrastructure per tenant:        $8.40/mo
  LLM costs per tenant (avg):      $22.00/mo
  Third-party APIs per tenant:      $4.20/mo
  Support (0.3 tickets × $18):      $5.40/mo
  Payment processing (2.9% × $X):   variable
  ─────────────────────────────────
  Direct COGS per tenant:          $40.00/mo
  
  Target gross margin: 72%
  
  Pricing floor = COGS / (1 - target_margin)
                = $40.00 / (1 - 0.72)
                = $40.00 / 0.28
                = $142.86/mo minimum to hit 72% GM at this cost structure

  IMPLICATION: Any tier priced below $142.86/mo is below your target margin.
  Your current Starter tier ($79/mo) has a gross margin of 49% — well below target.
  
  Recommendation: Either reduce infrastructure cost per tenant (model review),
  increase Starter price, or accept below-target margin on Starter as a
  deliberate land-and-expand strategy (explicitly configured, not accidental).
```

---

## Part 4: The SaaS Pricing Module

SaaS pricing is fundamentally different from eCommerce and Services because the
value exchange is ongoing (subscription), usage is often invisible to the buyer,
and the pricing decision involves both acquisition (will they sign up?) and retention
(will they stay and expand?).

### SaaS pricing models understood by the engine

```typescript
type SaaSPricingModel =
  | 'flat_rate'          // one price, one product, unlimited use (simple but value-limiting)
  | 'tiered'             // multiple plans, feature/usage gating (most common)
  | 'per_seat'           // price scales with number of users
  | 'usage_based'        // price scales with consumption (API calls, events, storage)
  | 'per_active_user'    // charge only for users who actually log in
  | 'hybrid'             // base platform fee + usage variable
  | 'freemium'           // permanent free tier + paid upgrade
  | 'free_trial_only'    // time-limited trial, no permanent free
  | 'credit_based'       // purchase credits, consume per action
```

### SaaS-specific pricing intelligence

**Agent: MARKOS-AGT-PRC-01: SaaS Pricing Strategist**

Beyond raw competitor prices, the SaaS Pricing Strategist extracts:

**Value metric analysis:**
The value metric — what the price scales with — is the most important SaaS pricing decision.
Wrong value metric = churn regardless of price level.

```
Value metric assessment runs quarterly or on significant competitor change:

1. Is the current value metric aligned with how customers perceive value?
   Test: Do customers who use MORE of the product retain better than those who use less?
   Source: PostHog usage data + churn correlation

2. What value metric do most direct competitors use?
   Source: Competitor pricing matrix
   
3. Are any competitors experimenting with different value metrics?
   Signal: A competitor switching from per-seat to usage-based is a major market signal
   
4. What does the VOC corpus say about pricing fairness?
   Source: G2/Capterra reviews filtered for pricing mentions
   Patterns: "Too expensive for a small team" → seat-based hurts SMB
              "We barely use it but still pay full price" → usage-based would retain better
```

**Annual vs monthly discount analysis:**
```
For your own pricing:
  Current annual discount: 20% (equivalent: get ~2.4 months free)
  Category benchmark: 15–25% (you are in range)

  Optimal discount signal: 
  If >40% of new signups choose monthly → annual discount insufficient to motivate upgrade
  If >75% choose annual → annual discount may be too generous (you're leaving MRR on table)
  
  Current split: 58% annual / 42% monthly → discount is working, slight room to reduce
  Recommendation: test 18% discount vs current 20% — projected impact on CAC payback: -4 days

Competitor annual discounts:
  Intercom: 20%
  Zendesk: 27%    ← outlier; pricing page tests suggest they're using annual to compete on monthly
  Freshdesk: 16%
  HelpScout: 17%
  Your current: 20% (mid-market position)
```

**Freemium/free trial analysis:**
```
Category freemium landscape:
  Competitors with permanent free tier: 2/6 (33%)
  Competitors with free trial: 4/6 (67%)
  Average free trial length: 14 days (you: 14 days — aligned)
  
  Free tier risk assessment:
  If a direct competitor launches a permanent free tier, your free trial becomes
  a conversion liability. Current watch: Groove has been A/B testing a free tier
  on their pricing page for 60 days — monitor for full launch.
  
  Recommendation: Do NOT launch a free tier reactively. If competitor launches free,
  respond with extended trial (21 days + guided onboarding) before committing to
  permanent free — significantly lower cost to serve.
```

**Pricing page conversion signals:**
```
Using GA4 + heatmap data on your own pricing page:

  Pricing page → trial conversion rate: 8.3%  (category benchmark: 6–12%)
  Most-clicked tier: Professional (42% of clicks)
  Least-clicked tier: Enterprise (8% of clicks — expected for custom pricing)
  
  Heatmap observations (if Hotjar/Clarity connected):
    - 67% of visitors interact with the annual/monthly toggle
    - Feature comparison table has 38% scroll depth (most visitors don't see bottom features)
    - "Most popular" badge on Professional tier gets 2.3× more clicks than untagged tiers
  
  Conversion anomalies:
    - Mobile pricing page → trial conversion: 4.1% vs desktop 11.2%
      ACTION: Mobile pricing page layout is underperforming — CRO task created
    - Visitors who view the comparison table have 22% higher trial conversion
      ACTION: Make comparison table more prominent above the fold
```

### SaaS pricing workflows

**Workflow 1: New pricing tier evaluation**

When an operator wants to evaluate adding, removing, or repricing a tier:

```
INPUT: "We're thinking about adding a mid-tier between Starter ($79) and Pro ($199)"

AGENT CHAIN:
1. PRC-01 (SaaS Pricing Strategist) queries:
   → Competitor matrix: where are the pricing gaps in the category?
   → Cost model: what is the pricing floor for this new tier?
   → Revenue data: which current customers are most price-sensitive (upgrade friction)?

2. PRC-03 (Pricing Impact Modeler) runs scenarios:
   Scenario A: $129/month mid-tier
     - Estimated cannibalization of Pro: 18% of current Pro customers downgrade
     - Estimated new acquisitions: +12% from price-sensitive segment
     - Net ARR impact (12-month): -$31,000 → +$87,000 depending on assumptions
   
   Scenario B: $149/month mid-tier
     - Less cannibalization (11% Pro downgrade)
     - Fewer new acquisitions vs $129 (+8%)
     - Cleaner position in competitive matrix (sits between Freshdesk Pro and Intercom Starter)

3. PRC-04 (Pricing Recommendation Agent) produces recommendation:
   "Recommend $149/month mid-tier named 'Growth'. Rationale:
    - $149 sits in a gap not occupied by any direct competitor (clean positioning)
    - Pricing floor at target margin: $142.86 (tight but viable at this price)
    - Primary use case: customers who outgrow Starter but don't need full Pro's [feature X]
    - Packaging recommendation: include [features A, B, C], exclude [feature D] to protect Pro upgrade path
    - Expected net ARR impact (conservative): +$58,000 in year 1"

APPROVAL GATE: Yes — pricing changes are major decisions, always human-approved
```

**Workflow 2: Competitive price response**

When a competitor changes their pricing:

```
TRIGGER: Intercom raised Starter by 34%

AUTOMATIC CHAIN (no human prompt required):
1. PRC-01 reads the alert + retrieves full diff
2. PRC-03 models the competitive impact:
   - How many Intercom customers are likely to comparison-shop? (using churn model signals)
   - Does this create a price gap MarkOS can occupy?
   - Does this validate increasing own prices?
3. PRC-04 generates 3 response strategies:
   A. Do nothing — let the gap appear, capture switchers organically
   B. Capture switchers — brief paid campaign targeting "Intercom alternatives" + landing page
   C. Raise own prices — use competitor's move as cover; test +15% on Starter

DELIVERED TO OPERATOR: Strategic brief with 3 options, projected impact per option,
recommendation with rationale

Response time: < 4 hours from competitor change detection to operator brief
```

---

## Part 5: The eCommerce Pricing Module

eCommerce pricing has dynamics fundamentally different from SaaS. The unit is a product,
not a subscription. Prices are visible, comparable, and shoppers comparison-shop in real time.
Margin pressure comes from multiple directions simultaneously: COGS, platform fees,
shipping, returns, and advertising costs that must all be recovered in the sale price.

### eCommerce pricing models understood by the engine

```typescript
type EcommercePricingModel =
  | 'fixed'                 // set price, sold at that price
  | 'cost_plus'             // COGS + fixed markup percentage
  | 'value_based'           // price set by perceived value, not cost
  | 'competitive'           // price matched or positioned vs competitors
  | 'dynamic'               // price adjusts based on demand, inventory, time
  | 'bundle'                // multi-product pricing discount
  | 'subscription'          // recurring product subscription (DTC model)
  | 'tiered_volume'         // quantity discounts
  | 'map_enforced'          // Minimum Advertised Price compliance
```

### Competitor price monitoring for eCommerce

eCommerce competitor pricing is more granular than SaaS — it is **per-SKU** surveillance
at potentially thousands of product-level price points.

**Agent: MARKOS-AGT-PRC-02: eCommerce Pricing Monitor**

```
MONITORING ARCHITECTURE:

Product catalog ingestion:
  → Tenant connects their Shopify/WooCommerce/custom store
  → Product catalog synced: SKU, name, current price, COGS (if available), category
  → Competitor product matching: for each tenant SKU, identify equivalent competitor SKUs

Competitor SKU monitoring:
  → Web crawler runs daily on competitor product pages
  → Price extracted per product with color/variant-level granularity where available
  → Out-of-stock status tracked (pricing opportunity signal)
  → Sale/promotional pricing tracked separately from base price
  → Shipping cost extracted where shown at product level

Price gap analysis per SKU:
  For each product, the engine computes:
    price_position:  'lowest' | 'below_average' | 'at_average' | 'above_average' | 'highest'
    gap_to_cheapest: number (positive = you're more expensive)
    gap_to_nearest:  number (nearest competitor price)
    margin_at_current_price: number (if COGS available)
    margin_at_match_price:   number (what happens to margin if price-matched)
    recommendation:  string
```

**The eCommerce Pricing Dashboard:**

```
PRODUCT PRICING INTELLIGENCE — Acme Athletic

Category: Running Shoes → Trail Running
─────────────────────────────────────────────────────────────────────────────
Product                  Your price   Cheapest comp   Avg comp   Your position
─────────────────────────────────────────────────────────────────────────────
Trail X Pro (Men's 10)     $149         $129 (REI)      $141       18th / 24
Enduro 5000 (Women's 8)    $124         $134 (Amazon)   $138       3rd / 24  ✓
Summit Runner              $189         $179 (Zappos)   $194       5th / 18  ✓
─────────────────────────────────────────────────────────────────────────────

ALERTS:
⚡ Trail X Pro: you are $20 above REI's current price. REI dropped 7 days ago.
   At current price gap, expected conversion rate impact: -12% (based on your price elasticity model)
   Margin at REI price match ($129): 34% → still above your 28% floor
   RECOMMENDED ACTION: reduce to $139 (split the difference; tests well in category)

✓ Enduro 5000: strong price position. Amazon is $10 more expensive. Opportunity to test +$5 increase.
   Margin at $129: 38% → room to expand. Price test recommended.
```

### Dynamic pricing recommendations

For tenants with the appetite for it, the engine supports dynamic pricing signals:

```
DYNAMIC PRICING SIGNAL — Trail X Pro

Current price: $149
Recommended price: $139

Signals that drove this recommendation:
  ✗ Competitive gap: $20 above cheapest comparable (REI) → pressure to lower
  ✓ Inventory: 847 units in stock → no scarcity-based premium justified
  ✓ Demand trend: 14-day search volume for SKU: +8% → mild positive demand
  ✓ Season: entering peak trail running season (April–June) → seasonal premium possible
  ✓ Margin: floor at $108 → $139 gives 29.1% margin → acceptable
  
Net recommendation: $139 — captures demand lift while closing competitive gap
Review trigger: if competitor moves price or stock drops below 200 units
```

### Bundle and promotional pricing

```typescript
interface BundleRecommendation {
  bundle_id: string
  products: string[]            // SKU list
  individual_total: number      // sum of individual prices
  bundle_price: number          // recommended bundle price
  discount_pct: number          // discount vs buying individually
  bundle_margin: number         // margin at bundle price
  rationale: string             // why these products bundle well
  competitive_context: string   // do competitors offer similar bundles?
  expected_lift: string         // projected AOV impact
}

// Example:
{
  products: ['trail-x-pro', 'trail-socks-3pk', 'trail-laces'],
  individual_total: 174.00,
  bundle_price: 154.00,
  discount_pct: 11.5,
  bundle_margin: 36.2,
  rationale: "Trail shoe + accessories bundle increases AOV by average $25 vs shoe-only. 
              Sock and lace add-on margins (58%) offset shoe margin compression at bundle price.",
  competitive_context: "REI offers a similar bundle at $169. $154 undercuts by $15.",
  expected_lift: "+$22 AOV for customers who add bundle vs single item"
}
```

---

## Part 6: The Services Pricing Module

Services pricing is the least systematized category in the market. Most agencies,
consultants, and service businesses set rates based on gut feel, what they charged last
time, and what a client will tolerate. The engine brings market data and cost rigor to
what is usually a purely intuitive process.

### Services pricing models understood by the engine

```typescript
type ServicesPricingModel =
  | 'hourly'                  // time and materials
  | 'daily_rate'              // day rate (common in consulting)
  | 'project_fixed'           // fixed price for defined scope
  | 'retainer_monthly'        // ongoing monthly fee for defined services
  | 'retainer_hours'          // monthly fee for a bucket of hours
  | 'value_based'             // price tied to outcome value, not time
  | 'performance_based'       // base + performance bonus tied to results
  | 'productized'             // fixed-scope, fixed-price, repeatable deliverable
  | 'subscription_services'   // recurring service at recurring price (MarkOS model)
```

**Agent: MARKOS-AGT-PRC-03: Services Pricing Strategist**

### Market rate intelligence for services

Services market rates are harder to scrape than SaaS or eCommerce because prices
are rarely published. The engine uses a multi-source inference approach:

```
Services market rate data sources (in quality order):

1. Publicly published pricing pages
   Source: Agency and consultant websites that publish pricing
   Coverage: ~25% of market (productized services publish rates; bespoke rarely does)
   Extraction: Direct crawler + structured extraction
   Quality: High for what's available

2. Job listing signals
   Source: LinkedIn, Indeed, Glassdoor, We Work Remotely
   What's extracted: "Expected budget: $X–$Y", "client budget: $X"
   Extraction: Search for "agency" + "retainer" + "budget" in job listings
   Quality: Medium (directional, not exact)

3. Community and forum signals
   Source: Reddit (r/freelance, r/agency, r/consulting), Twitter/X, Slack communities
   What's extracted: Rate discussions, "what do you charge for X" threads
   Quality: Medium (noisy but volume-compensated)

4. RFP and procurement documents
   Source: Public sector RFP databases, published procurement results
   What's extracted: Awarded contract values, hourly rates in government contracts
   Quality: High for government/public sector; not representative of private market

5. Freelance platform rate data
   Source: Upwork, Fiverr Pro, Toptal published rate ranges
   What's extracted: Hourly rates by specialty, geography, experience level
   Quality: High for freelance/independent; lower end of agency market

6. Cross-tenant anonymized data (MarkOS platform)
   Source: Tenants who are services businesses and share (opt-in) anonymized rate data
   What's extracted: Rate ranges by service type, deal size, industry served
   Quality: Very high once volume exists; privacy-preserving by design
```

### The services rate benchmark

```
SERVICES RATE BENCHMARK — B2B Marketing Agency (US-based)

Your current rates vs. market:

Service                  Your rate     Market P25    Market P50    Market P75    Your position
─────────────────────────────────────────────────────────────────────────────────────────────
SEO retainer (monthly)   $3,500        $2,200        $3,800        $6,500        44th pctl
Paid media management    $2,000+%      $1,500+%      $2,500+%      $4,000+%      38th pctl
Content strategy (mo)    $4,000        $2,500        $4,200        $7,000        47th pctl
Brand positioning proj   $12,000       $8,000        $15,000       $28,000       40th pctl
Full-service retainer    $8,000        $6,500        $12,000       $22,000       25th pctl ⚠

DIAGNOSIS:
  Full-service retainer is significantly below market median ($8K vs $12K median).
  All other services are priced in the 38–47th percentile range — below market median.
  
  If your quality/outcomes are above average (check NPS + case study results):
    You are under-pricing across the board.
    Estimated revenue opportunity from rate normalization to P50: +$47,000/year

  If your quality/outcomes are below average:
    Pricing is appropriate. Focus on quality improvement before rate increase.
```

### Services-specific pricing strategies

**Value-based pricing analysis:**

```
Value-based pricing converts the question from "what should I charge?" to
"what is my work worth to this client?"

For each service type, the engine estimates:

CLIENT VALUE CALCULATION — SEO Retainer

  Client: Acme Corp
  Current organic traffic: 8,200 sessions/month
  Your 6-month projection: 22,000 sessions/month (+13,800 sessions)
  
  Conversion rate on organic: 2.1%
  Average deal value (from their CRM if connected): $12,000
  
  Value created:
    Additional conversions: 13,800 × 0.021 = 290 additional leads/year
    Not all leads become customers — assume 15% close rate
    New customers: 290 × 0.15 = 43 customers
    Revenue from SEO work: 43 × $12,000 = $516,000/year
  
  Your retainer: $3,500/month = $42,000/year
  ROI multiple: $516K / $42K = 12.3×
  
  Value-based pricing analysis:
    At 10% of value created: $51,600/year = $4,300/month
    At 15% of value created: $77,400/year = $6,450/month
    At 20% of value created: $103,200/year = $8,600/month
  
  RECOMMENDATION: Current rate ($3,500) is 8.1% of value created.
  Industry norm for value-based SEO: 10–20% of incremental revenue.
  You have documented basis for $4,300–$8,600/month.
  Start with $4,500 renewal conversation — below the bottom of defensible range.
```

**Productized service pricing:**

```
PRODUCTIZED SERVICE OPPORTUNITY ANALYSIS

Based on your service delivery patterns, 3 services are strong candidates for productization:

1. SEO Audit Package
   You currently: spend ~12 hours, charge $0 (included in onboarding)
   Market rate for productized SEO audit: $1,200–$3,500
   Packaging recommendation: $1,800 standalone, $1,200 as credit toward retainer
   Positioning: "48-hour turnaround, 40-point technical + content + competitive analysis"

2. Monthly Analytics Report
   You currently: 4 hours/month per client, included in retainer
   Productized standalone: $400–$800/month
   Packaging recommendation: $500/month add-on; include for clients above $5K retainer
   
3. Landing Page CRO Sprint
   You currently: quoted per project ($2,000–$4,000, high variance)
   Productized: fixed-scope 2-week sprint
   Market rate for comparable: $2,500–$4,500 fixed
   Packaging recommendation: $3,000 flat, clearly defined deliverables list
   
Productization benefit: reduces scope negotiation, increases perceived value,
enables async delivery (reducing your time per delivery by ~30%)
```

---

## Part 7: The Pricing Strategy Recommendation Engine

This is the synthesis layer. It takes all data from the three modules and produces
structured, actionable pricing strategy recommendations.

**Agent: MARKOS-AGT-PRC-04: Pricing Recommendation Agent**

### Strategy frameworks the engine applies

The engine is trained on and applies the following pricing strategy frameworks.
Each recommendation cites which framework(s) it draws from.

```typescript
type PricingFramework =
  | 'value_metric_alignment'    // is the value metric aligned with how customers grow?
  | 'good_better_best'          // classic 3-tier structure with anchor pricing
  | 'land_and_expand'           // low entry price + expansion revenue in product
  | 'freemium_to_paid'          // free tier as acquisition + upgrade path
  | 'price_anchoring'           // high anchor tier makes mid tier feel reasonable
  | 'decoy_pricing'             // structurally undesirable option that drives choice
  | 'psychological_pricing'     // $99 vs $100, charm pricing, round number effects
  | 'loss_aversion'             // "don't lose access" framing over "gain features"
  | 'social_proof_pricing'      // "most popular" badge, customer count, trust signals
  | 'annual_commitment'         // converting monthly to annual for LTV improvement
  | 'usage_based_adoption'      // low/zero entry, scale with success
  | 'competitive_moat'          // pricing that makes switching costly
  | 'penetration_pricing'       // below-market entry to gain share, then increase
  | 'skimming'                  // premium entry for early adopters, reduce over time
```

### The recommendation output format

```typescript
interface PricingRecommendation {
  rec_id: string
  tenant_id: string
  business_type: 'saas' | 'ecommerce' | 'services'
  generated_at: string
  triggered_by: string          // 'scheduled' | 'competitor_change' | 'manual' | 'performance_anomaly'

  // Summary
  recommendation_type: 'price_change' | 'packaging_change' | 'strategy_shift' | 'test_design' | 'monitoring_alert'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  headline: string              // one-sentence summary
  tldr: string                  // 3–5 sentence summary for busy operators

  // Analysis
  current_state: PricingStateSnapshot
  market_context: MarketContextSummary
  cost_context: CostContextSummary
  options: PricingOption[]
  recommended_option_id: string

  // Evidence
  frameworks_applied: PricingFramework[]
  supporting_data: SupportingDataPoint[]
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]         // what must be true for this recommendation to hold
  risks: RiskItem[]

  // Implementation
  implementation_steps: ImplementationStep[]
  test_design: PriceTestDesign | null   // if A/B test is recommended
  expected_timeline: string
  success_metrics: string[]

  approval_gate: boolean        // always true — pricing changes require human approval
}

interface PricingOption {
  option_id: string
  option_label: string          // "Option A: Raise Starter to $99"
  description: string
  projected_impact: {
    arpu_change_pct: number | null
    conversion_rate_change_pct: number | null
    churn_change_pct: number | null
    net_arr_change_12mo: number | null
    gross_margin_change_pct: number | null
  }
  risk_level: 'low' | 'medium' | 'high'
  reversibility: 'easy' | 'moderate' | 'hard'
  frameworks: PricingFramework[]
  rationale: string
}
```

### Price testing design

Before committing to a price change, the engine designs a structured test.

```
PRICE TEST DESIGN — Starter Tier Increase

Hypothesis: Raising Starter from $79 to $99/month will reduce trial conversion
rate by less than 5% while increasing ARPU by 25%

Test design:
  Control group (50% of new trial signups): see $79/month pricing
  Test group (50% of new trial signups): see $99/month pricing
  
  Duration: 21 days (minimum for statistical significance at expected volume)
  Required sample size: 380 per group (based on current trial volume of 40/week)
  Expected completion: 10 days

  Primary metric: trial-to-paid conversion rate (must not drop > 5%)
  Secondary metrics:
    - ARPU delta
    - Annual vs monthly plan selection rate
    - Time to upgrade from free trial
  
  Statistical threshold: p < 0.05, power = 0.80
  
  Stop conditions (test halts immediately if):
    - Conversion rate drops >15% in test group within first 7 days
    - Net new MRR from test group falls below control group MRR

  Implementation:
    → Vercel Edge Config feature flag controls which pricing component renders
    → GA4 custom event on plan selection with test variant as custom dimension
    → Results tracked in MarkOS Pricing Engine test dashboard
    
  Rollout plan:
    → If test succeeds: roll out to 100% over 2 weeks
    → If test fails: revert immediately, schedule learnings review
```

---

## Part 8: The Pricing Agent Network

The Pricing Engine introduces a new agent tier to the MarkOS agent network:
**Tier 11 — Pricing Agents (MARKOS-AGT-PRC-*)**.

### New agents

**MARKOS-AGT-PRC-01: SaaS Pricing Strategist**
- Role: SaaS tier structure, value metric analysis, annual/monthly optimization, freemium evaluation
- Inputs: Competitor pricing matrix + own cost model + conversion data + churn by tier
- Outputs: SaaS pricing strategy document, tier recommendation, value metric assessment
- Cadence: Monthly review + on-trigger (competitor change, churn anomaly)
- Approval gate: Yes

**MARKOS-AGT-PRC-02: eCommerce Pricing Monitor**
- Role: Per-SKU competitive price tracking, margin-aware pricing, bundle and promo design
- Inputs: Product catalog + competitor SKU prices + COGS per product + inventory levels
- Outputs: Per-product price recommendations, bundle suggestions, promo calendar
- Cadence: Daily crawl, daily recommendations for flagged products, weekly full review
- Approval gate: Yes for price changes; configurable auto-approve for minor adjustments within bounds

**MARKOS-AGT-PRC-03: Services Pricing Strategist**
- Role: Market rate benchmarking, value-based pricing analysis, productization opportunities
- Inputs: Service catalog + market rate data + client value data (from CRM) + cost structure
- Outputs: Rate recommendations, value-based pricing analysis, productized service design
- Cadence: Quarterly benchmark refresh + on contract renewal trigger
- Approval gate: Yes

**MARKOS-AGT-PRC-04: Pricing Recommendation Agent**
- Role: Synthesis agent — combines all pricing data layers into actionable recommendations
- Inputs: All PRC-01/02/03 outputs + research engine context + cost model + performance data
- Outputs: PricingRecommendation object with options, projected impact, and test design
- Cadence: Weekly synthesis + on-trigger
- Approval gate: Yes — always

**MARKOS-AGT-PRC-05: Pricing Page Optimizer**
- Role: Optimize the tenant's own pricing page for conversion — copy, structure, framing, social proof
- Inputs: GA4 pricing page data + heatmap data + competitor pricing page analysis + brand voice pack
- Outputs: Pricing page optimization brief with specific copy, layout, and A/B test recommendations
- Cadence: Monthly + on-conversion-rate anomaly
- Approval gate: Yes

**MARKOS-AGT-PRC-06: Competitive Price Watcher**
- Role: Continuous competitor pricing surveillance, change detection, alert generation
- Inputs: Competitor list + previous PKOs + pricing page crawler output
- Outputs: Change detection alerts, updated PKOs, weekly competitive pricing digest
- Cadence: Daily crawl execution, immediate alert on major change, weekly digest
- Approval gate: No — monitoring only; alerts are informational

### Agent interaction patterns

```
PATTERN: Weekly Pricing Intelligence Cycle

Monday 6am:
  PRC-06 (Watcher) → checks all competitor pricing pages
    → no changes: updates crawl timestamps
    → minor change: queues for PRC-04 weekly synthesis
    → major change: P1 alert + triggers immediate PRC-04 run

Friday 8am:
  PRC-04 (Recommendation Agent) runs weekly synthesis:
    → reads all PRC-06 data from the week
    → reads latest cost model (own)
    → reads own conversion metrics from GA4
    → produces weekly pricing intelligence digest
    → if recommendation confidence HIGH: creates task for operator
    → if no urgent recommendations: adds to morning brief as info item

PATTERN: On Competitor Major Price Change

TRIGGER: PRC-06 detects competitor price change (change_magnitude: 'major')

  PRC-06: creates P1 alert to operator
    ↓
  PRC-04: runs immediately (P1 priority)
    → reads full competitor diff
    → runs 3-option analysis (do nothing / capture switchers / adjust own pricing)
    → attaches projected impact per option
    → produces recommendation brief
    ↓
  Operator receives: alert + brief + 3 options in < 4 hours

PATTERN: Contract Renewal Trigger (Services)

TRIGGER: CRM deal stage = "Renewal Due in 30 days"

  PRC-03: pulls client's service record
    → calculates value delivered (from performance data)
    → compares current rate to updated market benchmarks
    → runs value-based pricing calculation
    ↓
  PRC-04: produces renewal pricing recommendation:
    → recommended rate (with floor, market position, value basis)
    → talking points for renewal conversation
    → risk assessment (likelihood of accepting increase vs churning)
    ↓
  OPS-02 (Meeting Intelligence): incorporates pricing brief into pre-renewal meeting prep
```

---

## Part 9: Database Schema

```sql
-- Core pricing knowledge store
CREATE TABLE markos_pricing_knowledge (
  pkg_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type    TEXT NOT NULL CHECK (subject_type IN ('own','competitor','market','strategic')),
  subject_entity  TEXT NOT NULL,
  business_type   TEXT NOT NULL CHECK (business_type IN ('saas','ecommerce','services')),
  pricing_model   JSONB NOT NULL,
  tiers           JSONB NOT NULL DEFAULT '[]',
  value_metric    JSONB,
  free_structure  JSONB,
  discount_signals JSONB NOT NULL DEFAULT '[]',
  feature_matrix  JSONB NOT NULL DEFAULT '[]',
  source_url      TEXT,
  source_quality_score INTEGER,
  extracted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_method TEXT NOT NULL,
  confidence      TEXT NOT NULL CHECK (confidence IN ('high','medium','low')),
  change_detected BOOLEAN NOT NULL DEFAULT FALSE,
  previous_pkg_id UUID REFERENCES markos_pricing_knowledge(pkg_id),
  changed_fields  TEXT[] NOT NULL DEFAULT '{}',
  change_magnitude TEXT CHECK (change_magnitude IN ('major','minor','cosmetic')),
  CONSTRAINT rls_tenant CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID)
);

-- Tenant cost model
CREATE TABLE markos_cost_models (
  cost_model_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  business_type   TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  cogs_structure  JSONB NOT NULL,
  opex_monthly    JSONB NOT NULL,
  revenue_actuals JSONB,
  gross_margin_pct NUMERIC(5,2),
  contribution_margin_pct NUMERIC(5,2),
  break_even_arpu NUMERIC(10,2),
  target_gross_margin_pct NUMERIC(5,2) NOT NULL DEFAULT 70.0,
  pricing_floor   JSONB,
  confidence_level TEXT NOT NULL DEFAULT 'estimated',
  configured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pricing recommendations history
CREATE TABLE markos_pricing_recommendations (
  rec_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_type   TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  priority        TEXT NOT NULL,
  headline        TEXT NOT NULL,
  tldr            TEXT NOT NULL,
  current_state   JSONB NOT NULL,
  market_context  JSONB NOT NULL,
  cost_context    JSONB NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',
  recommended_option_id TEXT,
  frameworks_applied TEXT[] NOT NULL DEFAULT '{}',
  supporting_data JSONB NOT NULL DEFAULT '[]',
  confidence      TEXT NOT NULL,
  assumptions     TEXT[] NOT NULL DEFAULT '{}',
  risks           JSONB NOT NULL DEFAULT '[]',
  implementation_steps JSONB NOT NULL DEFAULT '[]',
  test_design     JSONB,
  success_metrics TEXT[] NOT NULL DEFAULT '{}',
  triggered_by    TEXT NOT NULL,
  operator_decision TEXT CHECK (operator_decision IN ('accepted','rejected','deferred','modified')),
  operator_notes  TEXT,
  decided_at      TIMESTAMPTZ,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Price test registry
CREATE TABLE markos_price_tests (
  test_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rec_id          UUID REFERENCES markos_pricing_recommendations(rec_id),
  hypothesis      TEXT NOT NULL,
  control_config  JSONB NOT NULL,
  test_config     JSONB NOT NULL,
  sample_size_per_group INTEGER NOT NULL,
  duration_days   INTEGER NOT NULL,
  primary_metric  TEXT NOT NULL,
  secondary_metrics TEXT[] NOT NULL DEFAULT '{}',
  stop_conditions JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed','stopped')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  result          JSONB,
  decision        TEXT CHECK (decision IN ('rollout','revert','extend','modified_rollout')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor watch list per tenant
CREATE TABLE markos_pricing_watch_list (
  watch_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  tier            TEXT NOT NULL DEFAULT 'tier1' CHECK (tier IN ('tier1','tier2','tier3')),
  pricing_page_url TEXT,
  crawl_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (crawl_frequency IN ('daily','weekly','monthly')),
  last_crawled_at TIMESTAMPTZ,
  last_change_detected_at TIMESTAMPTZ,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (tenant_id, competitor_domain)
);

-- Indexes
CREATE INDEX idx_pkg_tenant_subject ON markos_pricing_knowledge(tenant_id, subject_entity);
CREATE INDEX idx_pkg_tenant_type ON markos_pricing_knowledge(tenant_id, subject_type);
CREATE INDEX idx_pkg_change ON markos_pricing_knowledge(tenant_id, change_detected, extracted_at);
CREATE INDEX idx_rec_tenant_priority ON markos_pricing_recommendations(tenant_id, priority, generated_at);
CREATE INDEX idx_test_tenant_status ON markos_price_tests(tenant_id, status);

-- RLS policies (all tables)
ALTER TABLE markos_pricing_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE markos_cost_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE markos_pricing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE markos_price_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE markos_pricing_watch_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON markos_pricing_knowledge
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
-- (same policy applied to all tables)
```

---

## Part 10: The API Surface

The Pricing Engine is fully accessible via the MarkOS REST API.
All endpoints are authenticated via Bearer token. All responses are paginated
where collections are returned. All mutations require an active subscription with
Pricing Engine access.

### Pricing intelligence endpoints

```
GET  /v1/pricing/intelligence
  Returns the current pricing knowledge for own + all tracked competitors.
  Query params:
    business_type  required: 'saas' | 'ecommerce' | 'services'
    subject_type   optional: 'own' | 'competitor' | 'market' | 'strategic'
    competitor     optional: domain to filter to a specific competitor
    changed_only   optional: boolean — return only records with recent changes
    since          optional: ISO8601 — return records changed after this date

GET  /v1/pricing/intelligence/{pkg_id}
  Returns a single pricing knowledge object with full detail including evidence.

GET  /v1/pricing/intelligence/{competitor_domain}/history
  Returns the full price change history for a tracked competitor.
  Enables: building your own price change timeline or chart.

GET  /v1/pricing/matrix
  Returns the live competitive pricing matrix for the tenant's category.
  Format: structured comparison table with position analysis.
  business_type required.

POST /v1/pricing/intelligence/refresh
  Triggers an immediate crawl of all Tier 1 competitors.
  Rate limit: 1 per 4 hours.
  Returns: job_id for polling.

GET  /v1/pricing/intelligence/refresh/{job_id}
  Poll for refresh job completion.
  Returns: status, completed_count, changes_detected.
```

### Cost model endpoints

```
GET  /v1/pricing/cost-model
  Returns the tenant's current cost model with all derived metrics.

PUT  /v1/pricing/cost-model
  Updates the cost model. Triggers recalculation of all pricing floors.
  Body: CostModelUpdatePayload (partial updates accepted)
  Approval gate: None — cost model updates are internal only.

GET  /v1/pricing/cost-model/pricing-floor
  Returns the computed pricing floor per tier based on current cost model.
  business_type required.
  Returns: floor per value metric unit, floor for each existing tier,
           current vs floor gap per tier.
```

### Recommendations endpoints

```
GET  /v1/pricing/recommendations
  Returns all pricing recommendations for the tenant.
  Query params:
    status        optional: 'pending' | 'accepted' | 'rejected' | 'deferred'
    business_type optional
    priority      optional
    limit, offset for pagination

GET  /v1/pricing/recommendations/{rec_id}
  Returns a single recommendation with full detail, options, and supporting data.

POST /v1/pricing/recommendations/{rec_id}/decision
  Record operator decision on a recommendation.
  Body: { decision: 'accepted'|'rejected'|'deferred'|'modified', notes?: string, modified_option?: PricingOption }
  Side effect: if 'accepted' and test_design present, creates price test draft.

POST /v1/pricing/recommendations/generate
  Trigger an on-demand pricing recommendation run.
  Body: { business_type, context?: string, focus_area?: string }
  Rate limit: 3 per day.
  Returns: run_id for polling.
```

### Price test endpoints

```
GET  /v1/pricing/tests
  Returns all price tests for the tenant.
  Query params: status, business_type

GET  /v1/pricing/tests/{test_id}
  Returns test detail including current results if running.

POST /v1/pricing/tests
  Create a new price test from a test_design object.
  Body: PriceTestCreatePayload
  Approval gate: Yes — price test activation requires human approval.

POST /v1/pricing/tests/{test_id}/start
  Start a draft or paused test. Triggers approval gate.

POST /v1/pricing/tests/{test_id}/stop
  Stop a running test immediately. Records stop reason.

POST /v1/pricing/tests/{test_id}/decision
  Record rollout decision on a completed test.
  Body: { decision: 'rollout'|'revert'|'extend'|'modified_rollout', notes?: string }

GET  /v1/pricing/tests/{test_id}/results
  Returns current or final test results.
  Returns: metric values per variant, statistical significance, p-value,
           confidence interval, recommendation.
```

### Watch list endpoints

```
GET  /v1/pricing/watch-list
  Returns all competitors on the tenant's pricing watch list.

POST /v1/pricing/watch-list
  Add a competitor to the watch list.
  Body: { competitor_domain, competitor_name, tier, crawl_frequency }

PATCH /v1/pricing/watch-list/{watch_id}
  Update a watch list entry (tier, frequency, pricing page URL).

DELETE /v1/pricing/watch-list/{watch_id}
  Remove a competitor from the watch list.

GET  /v1/pricing/watch-list/alerts
  Returns all unacknowledged pricing alerts.

POST /v1/pricing/watch-list/alerts/{alert_id}/acknowledge
  Dismiss a pricing alert.
```

---

## Part 11: The MCP Surface

The Pricing Engine exposes an MCP (Model Context Protocol) server so every AI agent
in MarkOS — and any external MCP-compatible client — can query live pricing intelligence
during agent execution without requiring explicit API calls in agent code.

### MCP server: `markos-pricing`

```
Server name: markos-pricing
Transport: SSE (Server-Sent Events) at wss://mcp.markos.ai/pricing
Authentication: MCP session token (scoped per tenant, issued by MarkOS auth service)
```

### Available MCP tools

**`get_competitive_pricing_matrix`**
```json
{
  "name": "get_competitive_pricing_matrix",
  "description": "Returns the current competitive pricing matrix for the tenant's category. Use this when writing any content that mentions pricing, creating sales enablement materials, or generating competitive battle cards.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "business_type": {
        "type": "string",
        "enum": ["saas", "ecommerce", "services"],
        "description": "The business model type for the pricing comparison"
      },
      "include_features": {
        "type": "boolean",
        "default": false,
        "description": "If true, includes feature matrix per tier. Larger response."
      }
    },
    "required": ["business_type"]
  }
}
```

**`get_pricing_position`**
```json
{
  "name": "get_pricing_position",
  "description": "Returns how the tenant's pricing compares to competitors. Use when writing positioning copy, sales scripts, or battle cards that reference pricing.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tier_name": {
        "type": "string",
        "description": "Optional: get position analysis for a specific tier. Omit for overall position."
      }
    }
  }
}
```

**`get_competitor_pricing`**
```json
{
  "name": "get_competitor_pricing",
  "description": "Returns current pricing details for a specific competitor. Use when creating competitive comparison content, battle cards, or outreach that references a specific competitor.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "competitor_domain": {
        "type": "string",
        "description": "The competitor's domain (e.g. intercom.com)"
      },
      "include_history": {
        "type": "boolean",
        "default": false,
        "description": "If true, includes pricing change history for this competitor."
      }
    },
    "required": ["competitor_domain"]
  }
}
```

**`get_pricing_floor`**
```json
{
  "name": "get_pricing_floor",
  "description": "Returns the minimum viable price per tier based on the tenant's cost model and target margin. Always consult before recommending any pricing change.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "business_type": {
        "type": "string",
        "enum": ["saas", "ecommerce", "services"]
      }
    },
    "required": ["business_type"]
  }
}
```

**`get_recent_pricing_alerts`**
```json
{
  "name": "get_recent_pricing_alerts",
  "description": "Returns competitor pricing changes detected in the last N days. Use when preparing competitive analysis reports or strategy documents.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "days": {
        "type": "integer",
        "default": 30,
        "description": "Number of days to look back for changes"
      },
      "magnitude": {
        "type": "string",
        "enum": ["major", "minor", "all"],
        "default": "all"
      }
    }
  }
}
```

**`get_pricing_recommendation`**
```json
{
  "name": "get_pricing_recommendation",
  "description": "Returns the most recent pending pricing recommendation with supporting rationale. Use when the operator asks for pricing strategy advice or when building a pricing strategy document.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "business_type": {
        "type": "string",
        "enum": ["saas", "ecommerce", "services"]
      }
    },
    "required": ["business_type"]
  }
}
```

### How agents use the MCP tools

**Example 1: Content agent writing a competitive comparison page**

```
CONT-03 (Long-Form Content Creator) is writing "MarkOS vs Intercom"

During generation, CONT-03 calls:
  → get_competitor_pricing({ competitor_domain: "intercom.com" })
  → get_pricing_position({ tier_name: "Professional" })

Returned context:
  "Intercom Starter: $99/mo. Intercom Pro: $199/mo.
   Your Professional tier ($79/mo) is below their Starter. 
   Positioning note: 22% cheaper than Intercom's entry tier."

Content generated with LIVE pricing data:
  "At $79/month, MarkOS Professional is $20 less than Intercom's Starter plan —
   and includes [feature X] that Intercom gates behind their $199/month tier."

Without MCP: CONT-03 would either hallucinate a price or use outdated training data.
With MCP: the price is pulled from the live competitor intelligence store at write time.
```

**Example 2: Grand Strategist building quarterly strategy**

```
STR-01 (Grand Strategist) is generating Q3 strategy document

Calls:
  → get_competitive_pricing_matrix({ business_type: "saas", include_features: true })
  → get_recent_pricing_alerts({ days: 90, magnitude: "major" })
  → get_pricing_recommendation({ business_type: "saas" })

Incorporates into strategy:
  "Pricing context: Intercom raised prices 34% in April. The category has seen an
   average 8.2% price increase over 90 days. Our Starter tier is now positioned
   at the 22nd percentile in the category — significantly below market.
   
   Q3 pricing objective: raise Starter to $99 following a structured A/B test in
   June. This aligns with market direction and the pending PRC-04 recommendation."
```

**Example 3: Cold Outreach Sequencer personalizing to a prospect's tool stack**

```
LG-02 (Cold Outreach Sequencer) is writing outreach to a company that uses Intercom

Calls:
  → get_competitor_pricing({ competitor_domain: "intercom.com" })

Generated email opening:
  "You're likely paying Intercom $199/month or more for your support stack.
   We work with teams who switched to MarkOS at $79/month and got [specific outcome]."

The email is accurate, specific, and personalized — at the time it is generated.
```

---

## Part 12: The UI/UX Surface

### Pricing Engine navigation

The Pricing Engine lives under a dedicated section in the MarkOS sidebar:

```
MARKOS SIDEBAR

▸ ...existing navigation...

PRICING ENGINE                  ← new section
  ▸ Dashboard                   (pricing health overview)
  ▸ Competitor Matrix           (live competitive pricing table)
  ▸ Cost Model                  (margin and floor configuration)
  ▸ Recommendations             (pending strategy recommendations)
  ▸ Price Tests                 (A/B test management)
  ▸ Watch List                  (competitor monitoring settings)
  ▸ Alerts                      (pricing change notifications)
```

### Dashboard view

The Pricing Engine dashboard surfaces the most important pricing intelligence at a glance.

```
PRICING ENGINE DASHBOARD                          Business type: SaaS  [switch]

YOUR PRICING POSITION
  ┌─────────────────────────────────────────────┐
  │  Entry tier: 22nd percentile in category    │
  │  Mid tier:   41st percentile               │
  │  Premium:    Custom (unranked)             │
  │                                             │
  │  Category trend (90 days): +8.2% avg ↑     │
  │  Your last price change: 14 months ago      │
  └─────────────────────────────────────────────┘

MARGIN HEALTH
  ┌─────────────────────────────────────────────┐
  │  Starter ($79):    49% GM  ⚠ below target  │
  │  Professional ($199): 76% GM  ✓            │
  │  Enterprise: n/a                            │
  │                                             │
  │  Target GM: 72%   Pricing floor: $142.86   │
  └─────────────────────────────────────────────┘

RECENT ALERTS                              [View all]
  ⚡ Intercom raised Starter 34% — 3 days ago      [View analysis]
  ℹ  Freshdesk updated pricing page — 1 week ago  [View diff]

PENDING RECOMMENDATIONS                    [View all]
  → Consider raising Starter to $99 (HIGH confidence)    [Review]
  → Pricing page mobile conversion underperforming       [Review]
```

### Competitor matrix view

```
COMPETITOR PRICING MATRIX — SaaS   [eCommerce] [Services]
[+ Add competitor]  [Export CSV]  [Last updated: 2h ago]

                     Entry        Mid          Top        Model      Free?    Ann. disc.
──────────────────────────────────────────────────────────────────────────────────────────
★ YOUR PRODUCT       $79/mo      $199/mo      Custom     Per seat   Trial    20%
  Intercom            $99/mo      $199/mo      Custom     Per seat   No       20%
  Zendesk             $55/mo      $89/mo       $115/mo    Per agent  Yes      27%
  Freshdesk           $15/mo      $49/mo       $79/mo     Per agent  Yes      16%
  HelpScout           $20/mo      $40/mo       $65/mo     Per mbox   Trial    17%
  Groove              $16/mo      $36/mo       $56/mo     Per seat   Trial    18%
──────────────────────────────────────────────────────────────────────────────────────────
  Category avg        $44/mo      $102/mo      $97/mo
  Your percentile     22nd        75th         —

[Click any competitor row to see full tier detail, feature matrix, and price history]
[Click any cell to see evidence and source]
```

### Price change diff view

When a competitor changes their pricing, the diff view makes it immediately clear
what changed and what it means:

```
INTERCOM PRICING CHANGE — April 19, 2026

WHAT CHANGED:
  Starter:    $74/mo  →  $99/mo   [ +$25 | +34% ]
  Pro:        $169/mo  →  $199/mo  [ +$30 | +18% ]
  Annual:     unchanged (20% disc)

  Features: no changes detected
  Trial:    no changes detected

PRICE HISTORY (Intercom Starter):
  Apr 2026: $99  ▲
  Jan 2025: $74  ▲
  Jun 2023: $59  ▲
  Jan 2022: $49

WHAT THIS MEANS:
  [AI-generated analysis from PRC-04]
  "Intercom's third consecutive annual price increase suggests strong retention
   and low price elasticity in their customer base. The 34% jump is aggressive
   relative to their historical ~25% annual increases. Combined with Zendesk's
   +22% and Freshdesk's +18% over the same period, the category is signaling
   a re-pricing moment. Your entry tier is now $20 below their new entry price.
   Three response options are available in your Recommendations."

[ View Full Recommendation ]
```

### Cost model setup wizard

The cost model wizard is designed to take under 10 minutes. Questions are calibrated
for accuracy without requiring a CFO to complete:

```
COST MODEL SETUP — Step 2 of 4: What does it cost to serve one customer?

Every pricing recommendation MarkOS makes is grounded in your actual costs.
Estimates are fine — you can refine them anytime.

Infrastructure per customer per month:
  Hosting / cloud (Vercel, Supabase, AWS, etc.)   [ $____  /month per customer ]
  Hint: if you spend $500/mo on hosting for 50 customers = $10/customer

AI/LLM costs per customer (if applicable)         [ $____  /month per customer ]

Third-party tools per customer                     [ $____  /month per customer ]
  (e.g. Twilio, SendGrid, Stripe API)

Customer support cost per ticket:                  [ $____  per ticket ]
Average support tickets per customer/month:        [ ____   tickets ]

Payment processing:                                [ 2.9% ] (Stripe default — adjust if different)

─────────────────────────────
Your estimated COGS per customer: $____ /month   [auto-calculated]
At your target gross margin of [ 72% ], your pricing floor is: $____ /month

[ Back ]  [ Continue → ]
```

### Recommendations view

Each recommendation is presented as a decision card:

```
PRICING RECOMMENDATION #PR-0047                           HIGH CONFIDENCE · URGENT

Headline: Raise Starter tier from $79 to $99 — aligned with market and margin targets

TLDR: Your Starter tier sits at the 22nd percentile in the category, well below your
target gross margin, and $20 below the closest competitor who just raised their own
prices. Three options are available from aggressive to conservative.

────────────────────────────────────────────────────────────────────
OPTION A (Recommended): Raise to $99 after A/B test
  Projected 12-month impact:  +$94,000 net ARR (mid-case)
  Conversion rate risk:       low — protected by A/B test design
  Competitive position:       moves you to 48th percentile (at market)
  Gross margin at $99:        64% (still below 72% target — see Option C)
  Risk level:                 LOW  |  Reversibility: EASY (test can revert)

OPTION B (Conservative): Raise to $89, no test
  Projected impact:           +$52,000 net ARR
  Risk:                       unknown without test
  Position:                   35th percentile

OPTION C (Full correction): Raise to $149 to hit margin target
  Projected impact:           +$181,000 net ARR (high case) / +$44,000 (low case)
  Risk:                       HIGH — large jump may spike churn
  Position:                   72nd percentile (premium)
  Gross margin:               72% (hits target)

────────────────────────────────────────────────────────────────────
Supporting data:  Category avg +8.2% | Intercom +34% | Your last change 14mo ago
Frameworks used:  competitive_moat · psychological_pricing · good_better_best
Assumptions:      Annual discount unchanged · Feature set unchanged · Grandfathering existing customers

[ Accept Option A ]  [ Accept Option B ]  [ Accept Option C ]  [ Modify ]  [ Defer ]  [ Reject ]
```
