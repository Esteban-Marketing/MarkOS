# MarkOS Email Engine
## Deliverability · Broadcast · Lifecycle · Transactional · Behavioral Automation · Revenue Email

---

## Why Email Gets Its Own Engine

Email remains the highest-leverage owned channel in modern marketing. It is where
demand capture becomes nurture, onboarding becomes activation, expansion becomes revenue,
and relationship memory becomes durable.

MarkOS cannot be the operating system for marketing if email is treated as a sync to
someone else's ESP. Native email is required because:

1. Email is a core execution channel for almost every motion already defined in docs 05, 07, 15, 16, and 17
2. Deliverability, consent, frequency, and content quality must be governed by the same system that governs claims, pricing, approvals, and audience state
3. CRM, CDP, Messaging, Analytics, Landing Pages, and Revenue workflows all need native send and response intelligence

The Email Engine is therefore not "newsletter software." It is the email execution
substrate for MarkOS.

---

## Core Doctrine

The Email Engine follows seven rules:

1. **Deliverability before scale**
2. **Consent and preference before personalization**
3. **Lifecycle and behavior before batch volume**
4. **Message quality before send volume**
5. **Pricing, claims, and offers must use governed context**
6. **Replies are signals, not residue**
7. **Every send must feed CRM, CDP, and Analytics**

---

## What the Email Engine Must Do

The engine must support four distinct email classes:

1. **Transactional email**
   - receipts, verification, billing, security, legal notices, product confirmations
2. **Lifecycle email**
   - onboarding, activation, retention, expansion, winback, renewal, save
3. **Broadcast email**
   - newsletters, launches, product updates, announcements, campaign sends
4. **Revenue email**
   - sales-assist sequences, account-based follow-up, deal support, executive recap

Each class must share infrastructure, but keep different guardrails, SLAs, and approval rules.

---

## Part 1: Email Architecture

### The six layers

```
Layer 1: Sender infrastructure
  Domains, subdomains, DKIM, SPF, DMARC, warmup, reputation

Layer 2: Identity and consent
  Recipient identity, opt-in source, preferences, suppression, legal basis

Layer 3: Audience and segmentation
  CDP-derived segments, CRM lists, lifecycle cohorts, behavioral triggers

Layer 4: Message composition
  Templates, variables, approvals, evidence, pricing context, brand voice

Layer 5: Send orchestration
  Campaigns, journeys, throttle, time zones, frequency caps, retries

Layer 6: Measurement and reply intelligence
  Delivery, open, click, reply, conversion, unsubscribe, spam, revenue effect
```

### Core objects

```typescript
interface SenderIdentity {
  sender_id: string
  tenant_id: string
  label: string
  from_name: string
  from_email: string
  reply_to_email: string | null
  sending_domain: string
  subdomain: string | null

  verification_status: 'pending' | 'verified' | 'failed'
  reputation_status: 'warming' | 'healthy' | 'watch' | 'at_risk'
  daily_send_limit: number | null
  class_permissions: EmailClass[]
}

type EmailClass =
  | 'transactional'
  | 'lifecycle'
  | 'broadcast'
  | 'revenue'

interface EmailCampaign {
  campaign_id: string
  tenant_id: string
  campaign_type: EmailClass
  objective:
    | 'activation'
    | 'nurture'
    | 'launch'
    | 'newsletter'
    | 'renewal'
    | 'expansion'
    | 'winback'
    | 'sales_followup'
    | 'announcement'

  audience_id: string
  template_id: string
  variant_ids: string[]
  sender_id: string

  schedule_mode: 'instant' | 'scheduled' | 'triggered' | 'sequence_step'
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'running' | 'completed' | 'stopped'

  pricing_context_id: string | null
  evidence_pack_id: string | null
  approval_required: boolean
  approval_state: 'not_needed' | 'pending' | 'approved' | 'rejected'
}

interface EmailSendEvent {
  send_event_id: string
  tenant_id: string
  campaign_id: string
  recipient_identity_id: string
  message_id: string
  occurred_at: string
  event_type:
    | 'queued'
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'replied'
    | 'bounced'
    | 'complained'
    | 'unsubscribed'
    | 'converted'
  metadata: Record<string, string | number | boolean | null>
}
```

---

## Part 2: Deliverability and Sender Health

The Email Engine must treat deliverability as a product surface, not an ops afterthought.

### Sender requirements

- domain verification
- SPF, DKIM, DMARC checks
- sender-class isolation where needed
- dedicated reputation scoring per sender/domain
- complaint, bounce, and unsubscribe monitoring
- automatic throttle and circuit breaker on reputation risk

### Deliverability health model

```typescript
interface DeliverabilityHealth {
  tenant_id: string
  sender_id: string
  period_start: string
  period_end: string

  send_count: number
  delivery_rate: number
  hard_bounce_rate: number
  soft_bounce_rate: number
  complaint_rate: number
  unsubscribe_rate: number
  reply_rate: number

  reputation_status: 'healthy' | 'watch' | 'at_risk' | 'critical'
  required_actions: string[]
  sending_hold: boolean
}
```

Deliverability issues must create:

- operator alerts
- recovery tasks
- automatic slowdowns
- sender/domain recommendations

---

## Part 3: Audience, Consent, and Preference State

Email can only be category-leading if it is identity-aware and compliance-safe.

The engine must support:

- source-aware opt-in tracking
- list and segment membership from the CDP
- channel preferences and quiet hours
- subscription centers
- legal basis by geography
- global suppression, category suppression, and sender suppression
- per-identity frequency caps

Every recipient must have a readable email profile:

- who they are
- how they entered the system
- what they have received
- what they engaged with
- what they are eligible for
- what they opted out from

---

## Part 4: Composition and Quality Pipeline

Every email in MarkOS should pass through the same quality system:

- brand voice and message-crafting rules
- research and evidence rules from doc 06
- pricing and offer rules from doc 15
- approval rules from docs 09 and 10
- lifecycle and CRM context from docs 18 and 20

### Required composition artifacts

Each significant campaign should have:

- objective
- audience definition
- proof requirements
- pricing context
- CTA and conversion goal
- fallback if evidence is insufficient
- approval state if customer-facing or pricing-sensitive

### Content objects

```typescript
interface EmailTemplate {
  template_id: string
  tenant_id: string
  family:
    | 'newsletter'
    | 'welcome'
    | 'activation'
    | 'trial_expiry'
    | 'renewal'
    | 'expansion'
    | 'save_offer'
    | 'broadcast'
    | 'sales_followup'
    | 'transactional'
  subject_template: string
  preview_text_template: string | null
  html_structure_id: string
  plain_text_template: string
  required_variables: string[]
}
```

---

## Part 5: Journeys and Sequences

The Email Engine must support:

- onboarding journeys
- activation sequences
- re-engagement programs
- trial-to-paid conversion
- expansion and upsell
- renewal reminders
- winback
- launch sequences
- executive recap / stakeholder updates

Journey logic should be driven by:

- CRM state
- CDP behavior
- product milestones
- billing events
- support risk
- Pricing Engine context
- previous channel interactions across email and messaging

---

## Part 6: Reply Intelligence and CRM Memory

Email does not end at send. Replies are one of the richest commercial signals in the system.

The engine must:

- classify replies by intent, objection, urgency, sentiment, and commercial meaning
- route replies into the CRM timeline
- turn significant replies into tasks
- create support, sales, save, pricing, or escalation actions when needed
- preserve thread continuity for humans and agents

This is a core difference between MarkOS and legacy ESPs: every reply becomes structured
relationship intelligence.

---

## Part 7: Email Agents

**New agent: MARKOS-AGT-EML-01: Deliverability Guard**  
Monitors reputation, complaints, bounce risk, and sender health.

**New agent: MARKOS-AGT-EML-02: Lifecycle Journey Designer**  
Builds and updates multi-step journeys by tenant type, product stage, and behavior.

**New agent: MARKOS-AGT-EML-03: Broadcast Strategist**  
Turns launches, narratives, and campaigns into broadcast plans and send variants.

**New agent: MARKOS-AGT-EML-04: Reply Intelligence Router**  
Classifies replies and routes them into CRM, support, sales, or save workflows.

**New agent: MARKOS-AGT-EML-05: Inbox Revenue Assistant**  
Creates follow-up suggestions, executive recaps, and next-best actions for live deals.

---

## Part 8: UI, API, and MCP Surface

### UI

The operator UI must provide:

- sender setup and deliverability health
- audience and segment explorer
- template library
- campaign builder
- journey builder
- approval inbox integration
- reply queue
- send performance dashboard

### API

Required families:

- `/v1/email/senders/*`
- `/v1/email/audiences/*`
- `/v1/email/templates/*`
- `/v1/email/campaigns/*`
- `/v1/email/journeys/*`
- `/v1/email/events/*`
- `/v1/email/deliverability/*`

### MCP

Required tools:

- `draft_email_campaign`
- `review_email_for_claim_risk`
- `get_send_health`
- `get_journey_state`
- `suggest_reply_action`
- `list_email_segments`

---

## Part 9: Global-Leader Requirements

To lead the category, the Email Engine must:

1. unify lifecycle, transactional, broadcast, and revenue email
2. make deliverability visible and actionable
3. treat replies as structured intelligence
4. enforce claims, pricing, and approval safety by default
5. connect every send to CRM, CDP, Analytics, and Revenue state
6. support both B2B and B2C / PLG motions without forcing separate tools

---

## Part 10: Governance and Safety

The Email Engine must never:

- send to suppressed or ineligible recipients
- let pricing-sensitive offers bypass the Pricing Engine
- allow unsupported claims into large broadcast or lifecycle campaigns
- ignore reputation degradation
- lose the audit trail of who approved, edited, or sent a message
- let one noisy channel over-message a user when messaging or push already consumed the cap

This is how MarkOS turns email from a silo into a governed execution layer of the full OS.
