# MarkOS CRM Engine
## Native CRM · Customer 360 · Timeline-First Memory · Pipeline · Lifecycle · Revenue Workflows

---

## Why CRM Gets Its Own Engine

MarkOS cannot become the dominant Marketing AI system if it depends on an external CRM
for the most important layer of commercial truth: who the customer is, what happened,
who is involved, what is likely to happen next, and what action should be taken now.

The CRM Engine is not "a place to store contacts." It is the relationship operating layer
of MarkOS:

1. The **CDP Engine** (doc 20) unifies raw identity, event, consent, and profile data
2. The **CRM Engine** turns that data into operator-ready accounts, people, opportunities,
   lifecycle stages, work queues, and relationship memory
3. The **Sales Enablement Engine** (doc 24) arms GTM teams with battlecards, proof packs,
   deal intelligence, and revenue execution materials

MarkOS needs all three. Without the CDP, the CRM becomes fragmented. Without the CRM,
the CDP stays analytical but not operational. Without sales enablement, the CRM knows
what is happening but does not help win.

---

## Core Doctrine

The MarkOS CRM follows six non-negotiable rules:

1. **Timeline first**. The timeline is the source of truth. Lists and boards are views.
2. **Customer 360 is dynamic**. Profile state changes as new email, product, billing,
   support, messaging, and website events arrive.
3. **Accounts and people are both first-class**. B2B requires account intelligence;
   B2C and PLG require person-level behavior.
4. **Every object must be actionable**. No passive record exists without tasks, risk,
   next-best action, or decision context.
5. **Relationship memory must survive handoffs**. Marketing, sales, CS, support, and
   finance operate from the same narrative, not disconnected notes.
6. **All CRM actions are approval-aware and evidence-linked**. Outreach, pricing changes,
   deal promises, and customer-facing claims are governed by docs 06, 09, 10, and 15.

---

## What the CRM Engine Must Do

The engine must give MarkOS a native commercial system of record for:

- account and person workspaces
- opportunity and pipeline management
- buying committee intelligence
- customer lifecycle orchestration
- relationship and activity memory
- account health and revenue risk
- task routing and next-best action
- commercial segmentation and prioritization
- shared visibility across marketing, sales, CS, support, billing, and leadership

This is the substrate that allows MarkOS to prove the full loop:

```
audience -> intent -> engagement -> meeting -> opportunity -> proposal -> close
-> onboarding -> product usage -> expansion -> advocacy -> renewal
```

---

## Part 1: The CRM Object Model

### The customer 360 record

Every company and every person that matters in revenue should have a living CRM record.

```typescript
interface Customer360Record {
  crm_id: string
  tenant_id: string
  entity_type: 'account' | 'person'
  mode: 'b2b' | 'b2c' | 'plg_b2b' | 'plg_b2c' | 'b2b2c'

  display_name: string
  canonical_identity_id: string        // resolved by CDP Engine
  lifecycle_stage: LifecycleStage
  owner_user_id: string | null
  status: 'active' | 'watch' | 'at_risk' | 'closed' | 'archived'

  // Commercial state
  fit_score: number                    // ICP / account fit
  intent_score: number                 // research + behavior + engagement
  engagement_score: number             // channel activity
  product_signal_score: number | null  // usage/activation for SaaS tenants
  revenue_score: number | null         // deal value / expansion potential / LTV
  risk_score: number | null            // churn, silence, blockers, competitive risk

  // Relationship map
  company_id: string | null            // person -> account link
  persona_slug: string | null
  job_title: string | null
  department: string | null
  buying_role: BuyingRole | null
  influence_score: number | null

  // Intelligence
  current_summary: string
  next_best_action: string | null
  next_best_action_reason: string | null
  open_tasks: number
  active_opportunities: number
  last_meaningful_event_at: string | null

  created_at: string
  updated_at: string
}

type LifecycleStage =
  | 'anonymous'
  | 'known'
  | 'engaged'
  | 'mql'
  | 'sql'
  | 'opportunity'
  | 'customer'
  | 'expansion'
  | 'renewal'
  | 'advocate'
  | 'lost'

type BuyingRole =
  | 'champion'
  | 'economic_buyer'
  | 'technical_buyer'
  | 'end_user'
  | 'blocker'
  | 'legal'
  | 'finance'
  | 'unknown'
```

### The timeline event

Every meaningful commercial action becomes a timeline event:

```typescript
interface CrmTimelineEvent {
  event_id: string
  tenant_id: string
  crm_id: string
  account_id: string | null
  person_id: string | null

  source_domain:
    | 'website'
    | 'email'
    | 'messaging'
    | 'meeting'
    | 'crm'
    | 'support'
    | 'billing'
    | 'product'
    | 'social'
    | 'research'
    | 'agent'
  event_type: string
  occurred_at: string
  actor_type: 'human' | 'agent' | 'system'
  actor_id: string | null

  summary: string
  evidence_refs: string[]
  thread_id: string | null
  opportunity_id: string | null
  task_id: string | null
  side_effect_id: string | null

  sentiment: 'positive' | 'neutral' | 'negative' | null
  commercial_signal:
    | 'interest'
    | 'risk'
    | 'expansion'
    | 'renewal'
    | 'support'
    | 'pricing'
    | 'silence'
    | null
}
```

The timeline must ingest events from:

- email opens, replies, clicks, sends, bounces
- WhatsApp/SMS/push conversations
- form submissions and landing page conversions
- meetings booked, attended, rescheduled, no-showed
- product activation, usage, seat growth, drop-off, milestone completion
- invoices paid, failed, refunded, paused
- support tickets, escalations, sentiment shifts
- sales notes, objections, proposals, approvals
- social interactions and community signals
- agent-generated recommendations, tasks, and risk alerts

---

## Part 2: Account, Person, and Committee Intelligence

### B2B account intelligence

For B2B and PLG-B2B tenants, the account is the strategic object. MarkOS must understand:

- company profile
- segment / ICP fit
- active opportunities
- buying committee completeness
- engaged people and their roles
- product footprint
- support risk
- billing and expansion posture
- competitor mentions and objection patterns

```typescript
interface AccountWorkspace {
  account_id: string
  tenant_id: string
  company_name: string
  website: string | null
  employee_band: string | null
  industry: string | null
  annual_revenue_band: string | null
  region: string | null

  account_fit_score: number
  buying_committee_coverage: number   // 0-100
  relationship_depth_score: number
  whitespace_score: number            // expansion room

  active_deal_ids: string[]
  open_risks: string[]
  open_tasks: string[]
  top_recent_signals: string[]
}
```

### Person intelligence

For B2C, PLG, outbound, partner, and community flows, the person is the operational unit.

MarkOS must track:

- identity resolution
- role/persona
- acquisition source and conversion path
- product behavior
- communication preferences
- relationship history
- objections, pains, goals, and sentiment
- readiness for outreach, upgrade, referral, or save intervention

### Buying committee mapping

Winning complex deals requires more than lead scoring. The CRM must support explicit
buying committee modeling:

- who is engaged
- who is missing
- who is a blocker
- who is the actual budget holder
- what role-specific proof is missing
- where the deal is politically weak

This should produce actionable outputs:

- "No finance stakeholder engaged"
- "Champion active, economic buyer absent"
- "Technical buyer asked for security artifact"
- "Legal review likely next blocker"

---

## Part 3: Opportunities, Revenue, and Lifecycle Workflows

### Opportunity model

```typescript
interface Opportunity {
  opportunity_id: string
  tenant_id: string
  account_id: string | null
  primary_person_id: string | null

  title: string
  pipeline_id: string
  stage_id: string
  stage_probability: number
  amount: number | null
  currency: string
  expected_close_date: string | null

  source_motion:
    | 'inbound'
    | 'outbound'
    | 'plg'
    | 'partner'
    | 'community'
    | 'event'
    | 'expansion'
  pricing_context_id: string | null
  active_objections: string[]
  requested_artifacts: string[]
  competitive_set: string[]

  health: 'healthy' | 'watch' | 'at_risk' | 'stalled'
  next_required_action: string | null
  approval_blockers: string[]
  evidence_gaps: string[]
}
```

### Lifecycle orchestration

The CRM must not stop at pipeline. It must carry the relationship across:

- pre-pipeline interest
- opportunity creation
- onboarding
- activation
- adoption
- expansion
- renewal
- advocacy
- recovery / save

This turns MarkOS into a **continuous revenue memory system**, not only a sales tracker.

---

## Part 4: The CRM Work Queue and Next-Best Action System

The CRM should continuously rank what deserves attention:

- accounts that surged in intent
- committees missing key roles
- opportunities stalled past SLA
- customers at churn risk
- accounts ready for expansion
- people likely to reply now
- renewal accounts missing proof or executive summary
- support-heavy accounts needing escalation

Each recommended action must include:

- why it matters now
- what evidence supports it
- what asset or message is required
- what approval is needed
- what likely revenue or risk outcome is attached

---

## Part 5: CRM Agents

**New agent: MARKOS-AGT-CRM-01: Relationship Mapper**  
Builds and updates account-person graphs, committee roles, and relationship strength.

**New agent: MARKOS-AGT-CRM-02: Timeline Synthesizer**  
Turns fragmented event streams into compact commercial summaries and risk explanations.

**New agent: MARKOS-AGT-CRM-03: Opportunity Prioritizer**  
Ranks deals by revenue, urgency, blockage, and required action.

**New agent: MARKOS-AGT-CRM-04: Lifecycle Controller**  
Moves records across stages based on verified events and approved operator rules.

**New agent: MARKOS-AGT-CRM-05: Expansion and Renewal Scout**  
Detects whitespace, seat growth, product signal strength, and renewal risk.

**New agent: MARKOS-AGT-CRM-06: Revenue Action Recommender**  
Generates next-best actions tied to evidence, pricing, support, usage, and relationship context.

---

## Part 6: UI, API, and MCP Surface

### UI surfaces

The CRM must expose:

- account workspace
- person workspace
- unified timeline
- pipeline board and list
- buying committee view
- revenue room / deal room
- lifecycle board
- renewal and expansion queue
- commercial search and saved views

### API

The API must provide:

- `/v1/crm/accounts/*`
- `/v1/crm/people/*`
- `/v1/crm/opportunities/*`
- `/v1/crm/timeline/*`
- `/v1/crm/committees/*`
- `/v1/crm/lifecycle/*`
- `/v1/crm/search/*`

### MCP

The MCP surface should expose tools such as:

- `get_customer_360`
- `get_account_timeline`
- `list_open_opportunities`
- `rank_revenue_queue`
- `explain_deal_risk`
- `map_buying_committee`
- `get_next_best_action`

---

## Part 7: Integration Boundaries

The CRM Engine must integrate tightly with:

- doc 20 CDP Engine for identity and event unification
- doc 19 Email Engine for campaigns, replies, deliverability, and sequences
- doc 21 Messaging Engine for WhatsApp/SMS/push thread memory
- doc 22 Analytics Engine for attribution and revenue measurement
- doc 23 Conversion Engine for page/form conversions
- doc 24 Sales Enablement Engine for battlecards, proof packs, and deal materials
- doc 15 Pricing Engine for pricing posture, recommendations, objections, and approvals
- doc 16 SaaS Suite for subscriptions, billing, support, health, and churn

---

## Part 8: Global-Leader Requirements

To lead the category, the CRM must be differentiated in six ways:

1. **Timeline-native, not table-native**
2. **Commercial memory across every surface**
3. **Buying committee intelligence built in**
4. **Native connection to pricing, support, billing, and product usage**
5. **Action-first prioritization instead of dashboard sprawl**
6. **Agent-readable and operator-readable at the same time**

This is how MarkOS avoids becoming "just another CRM." It becomes the commercial brain
that every other engine writes into and reads from.

---

## Part 9: Governance and Safety

The CRM Engine must never:

- mutate customer-facing state without approval policy
- lose the audit trail of who changed pipeline, stage, owner, or pricing promise
- merge identities without reversible evidence
- allow unsupported claims into deal materials
- allow cross-tenant visibility across records or event streams
- show pricing or discount promises that are not approved by the Pricing Engine

The CRM is therefore not only a revenue system. It is a governed memory and action layer
for the whole Marketing Operating System.
