# MarkOS Analytics Engine
## Attribution · Measurement · Journey Intelligence · Revenue Analytics · Narrative · Decision Support

---

## Why Analytics Gets Its Own Engine

MarkOS already defines execution across content, social, email, messaging, CRM, pricing,
SaaS operations, and growth loops. Without a native analytics layer, those systems would
still work, but they would not compound. They would execute without learning in a precise,
shared, operator-trustworthy way.

The Analytics Engine is therefore not "dashboarding." It is the measurement and decision
layer that turns raw events into business truth.

---

## Core Doctrine

The Analytics Engine follows seven rules:

1. **One metrics model across marketing, product, CRM, support, and billing**
2. **Revenue truth and activity truth must meet in the same system**
3. **Every major metric must be explainable down to its event sources**
4. **Narratives and anomalies are products, not presentation afterthoughts**
5. **Attribution must be multi-model and confidence-scored**
6. **Experiments, launches, and lifecycle changes must feed the same measurement layer**
7. **Analytics must create actions, not only charts**

---

## What the Analytics Engine Must Do

The engine must provide:

- canonical metrics definitions
- cross-channel attribution
- account and person journey analytics
- campaign, content, and conversion measurement
- pipeline and revenue analytics
- SaaS retention, activation, and expansion analytics
- anomaly detection and narrative generation
- experiment readouts
- forecast signals for GTM teams

---

## Part 1: The Analytics Architecture

### The six layers

```
Layer 1: Event truth
  CDP event stream + CRM events + billing events + support events + product usage

Layer 2: Canonical metrics model
  Shared definitions for pipeline, activation, churn, NRR, CAC payback, etc.

Layer 3: Attribution graph
  Touchpoints, journeys, campaigns, offers, identities, accounts, and outcomes

Layer 4: Aggregations and cohorts
  Time series, segment rollups, cohorts, funnels, geo/account slices

Layer 5: Narrative and anomaly layer
  "what changed", "why it changed", "what to do next"

Layer 6: Activation layer
  Tasks, alerts, and operator recommendations
```

### Core objects

```typescript
interface MetricDefinition {
  metric_id: string
  tenant_id: string | 'global'
  name: string
  category:
    | 'acquisition'
    | 'activation'
    | 'conversion'
    | 'pipeline'
    | 'revenue'
    | 'retention'
    | 'support'
    | 'pricing'
    | 'community'
  grain: 'person' | 'account' | 'campaign' | 'content' | 'channel' | 'tenant'
  formula_description: string
  source_event_families: string[]
}

interface AttributionTouch {
  touch_id: string
  tenant_id: string
  profile_id: string | null
  account_id: string | null
  campaign_id: string | null
  channel:
    | 'organic_search'
    | 'paid_search'
    | 'social'
    | 'email'
    | 'messaging'
    | 'direct'
    | 'referral'
    | 'partner'
    | 'community'
    | 'event'
    | 'product'
  occurred_at: string
  touch_type: 'first' | 'assist' | 'last' | 'influential'
  confidence_score: number
}

interface NarrativeInsight {
  insight_id: string
  tenant_id: string
  period_start: string
  period_end: string
  summary: string
  supporting_metrics: string[]
  supporting_evidence_refs: string[]
  confidence: 'high' | 'medium' | 'low'
  recommended_actions: string[]
}
```

---

## Part 2: Attribution and Journey Intelligence

MarkOS must support multiple attribution views because no one model is sufficient:

- first touch
- last touch
- position-based
- influence scoring
- account journey attribution
- self-reported attribution
- product-assisted attribution for PLG

The operator should be able to answer:

- what created this account
- what moved this opportunity
- which channels accelerate activation
- which content influences renewal or expansion
- which launches or experiments changed downstream pipeline

---

## Part 3: The Metrics That Matter

### Core universal metrics

- pipeline created
- pipeline influenced
- win rate
- sales cycle velocity
- CAC and CAC payback
- conversion rates by stage
- campaign efficiency
- content-assisted revenue

### SaaS-specific metrics

- activation rate
- time to value
- product qualified leads
- MRR, ARR, NRR, GRR
- expansion rate
- churn rate
- renewal risk
- payback by cohort

### Messaging and lifecycle metrics

- response rate
- conversation-to-meeting
- activation intervention lift
- save-offer effectiveness
- reactivation success

---

## Part 4: Anomalies, Forecasts, and Narratives

MarkOS should not wait for humans to discover problems. The engine must generate:

- anomaly alerts
- trend-change detection
- forecast warnings
- channel collapse warnings
- pricing performance shifts
- lifecycle bottleneck explanations
- growth model-specific narrative summaries

Every insight should answer three questions:

1. what changed
2. why it probably changed
3. what action should be taken now

This is how analytics becomes operational rather than decorative.

---

## Part 5: Analytics Agents

**New agent: MARKOS-AGT-ANL-01: Attribution Analyst**  
Builds attribution views and explains confidence and disagreement between models.

**New agent: MARKOS-AGT-ANL-02: Narrative Generator**  
Produces weekly, monthly, launch, and executive narratives tied to evidence.

**New agent: MARKOS-AGT-ANL-03: Anomaly Detector**  
Flags meaningful movement and routes it into tasks or alerts.

**New agent: MARKOS-AGT-ANL-04: Forecast Interpreter**  
Creates forward-looking pipeline, retention, and budget guidance.

---

## Part 6: UI, API, and MCP Surface

### UI

The UI should provide:

- executive overview
- journey explorer
- attribution explorer
- cohort and funnel explorer
- campaign and content performance
- pricing and lifecycle impact dashboard
- anomaly center
- weekly narrative and board-ready summary

### API

Required families:

- `/v1/analytics/metrics/*`
- `/v1/analytics/attribution/*`
- `/v1/analytics/funnels/*`
- `/v1/analytics/cohorts/*`
- `/v1/analytics/narratives/*`
- `/v1/analytics/anomalies/*`
- `/v1/analytics/forecast/*`

### MCP

Required tools:

- `get_metric_snapshot`
- `explain_attribution`
- `list_active_anomalies`
- `generate_exec_narrative`
- `compare_channel_efficiency`
- `summarize_launch_impact`

---

## Part 7: Global-Leader Requirements

To lead the category, the Analytics Engine must:

1. measure the full commercial system, not only acquisition
2. connect product, support, billing, and pricing to marketing outcomes
3. support both self-serve and sales-led journeys
4. generate narratives and decisions from measurement
5. make attribution explainable, not magical
6. create action queues for humans and agents

---

## Part 8: Governance and Safety

The Analytics Engine must never:

- invent revenue linkage without confidence labeling
- allow multiple incompatible definitions of the same core metric
- hide data freshness problems
- turn low-confidence attribution into overconfident planning truth
- show cross-tenant data in any tenant-scoped analytics view

This is how MarkOS turns analytics into a decision engine rather than a chart warehouse.
