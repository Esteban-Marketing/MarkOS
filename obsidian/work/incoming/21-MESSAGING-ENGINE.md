# MarkOS Messaging Engine
## WhatsApp · SMS · Push · In-App · Conversational Workflows · Real-Time Revenue and Support Messaging

---

## Why Messaging Gets Its Own Engine

Email is essential, but modern marketing and revenue systems cannot rely on email alone.
The fastest, most commercially decisive interactions increasingly happen in:

- WhatsApp
- SMS
- mobile push
- in-app messaging
- conversational notification surfaces

These channels behave differently from email. They are faster, more interruptive,
more compliance-sensitive, more thread-based, and more likely to require precise
timing and channel-specific rules.

MarkOS therefore needs a native Messaging Engine rather than treating these channels
as add-ons.

---

## Core Doctrine

The Messaging Engine follows seven rules:

1. **Permission before reach**
2. **Conversation memory before campaign volume**
3. **Thread continuity before isolated messages**
4. **Urgency and timing before send quantity**
5. **Channel-specific compliance before automation**
6. **Operator override before risky external mutation**
7. **Every message event must update CRM, CDP, and Analytics**

---

## What the Messaging Engine Must Do

The engine must support:

- WhatsApp templates and live-session messaging
- SMS campaigns and triggered texts
- push notifications for mobile or product environments
- in-app nudges, banners, and inbox messages
- shared thread memory across channels
- reply handling and escalation
- support, sales, renewal, save, and activation messaging workflows
- consent, quiet hours, rate caps, and jurisdiction-aware compliance

This turns messaging into a governed execution channel, not a disconnected notification layer.

---

## Part 1: Messaging Architecture

### Channel classes

```typescript
type MessagingChannel =
  | 'whatsapp'
  | 'sms'
  | 'push'
  | 'in_app'

type MessagingUseCase =
  | 'activation'
  | 'reminder'
  | 'support'
  | 'renewal'
  | 'save'
  | 'sales_followup'
  | 'community'
  | 'transactional'
  | 'alert'
```

### Canonical objects

```typescript
interface MessagingThread {
  thread_id: string
  tenant_id: string
  profile_id: string
  account_id: string | null
  channel: MessagingChannel

  current_status: 'open' | 'waiting' | 'escalated' | 'resolved' | 'blocked'
  owner_user_id: string | null
  last_message_at: string | null
  last_direction: 'inbound' | 'outbound' | null
  sentiment: 'positive' | 'neutral' | 'negative' | null

  related_crm_id: string | null
  related_opportunity_id: string | null
  related_support_case_id: string | null
}

interface MessagingEvent {
  message_event_id: string
  tenant_id: string
  thread_id: string
  profile_id: string
  channel: MessagingChannel
  direction: 'inbound' | 'outbound'
  occurred_at: string

  use_case: MessagingUseCase
  template_id: string | null
  approval_state: 'not_needed' | 'pending' | 'approved' | 'rejected'
  delivery_state:
    | 'queued'
    | 'sent'
    | 'delivered'
    | 'read'
    | 'clicked'
    | 'failed'
    | 'expired'
  body_summary: string
  evidence_refs: string[]
}

interface ChannelEligibility {
  tenant_id: string
  profile_id: string
  whatsapp_allowed: boolean
  sms_allowed: boolean
  push_allowed: boolean
  in_app_allowed: boolean
  quiet_hours_local: string | null
  frequency_cap_window_hours: number
}
```

---

## Part 2: WhatsApp, SMS, Push, and In-App Rules

### WhatsApp

MarkOS must support:

- approved template catalog
- session-aware messaging
- inbound thread continuity
- handoff to human support or sales when the thread becomes risky
- channel-specific rate and policy controls

### SMS

MarkOS must support:

- transactional and promotional class separation
- sender identity and region-aware compliance
- stop / opt-out handling
- quiet hours and frequency caps
- failover or fallback recommendations when SMS cost or delivery quality degrades

### Push

Push is the speed channel for:

- activation nudges
- upgrade prompts
- renewal warnings
- critical workflow reminders
- support status

Push must be tightly connected to product state, user role, and recent engagement.

### In-app

In-app messaging should support:

- banners
- modal prompts
- embedded inbox
- workflow cues
- milestone nudges
- contextual renewal or expansion prompts

This should align directly with docs 10, 16, and 17.

---

## Part 3: Conversation Memory and Routing

Messaging should not create disconnected silos. Every material interaction must:

- update the CRM timeline
- update the CDP event stream
- update channel preference and responsiveness state
- create tasks when escalation is needed
- create support or revenue actions when intent changes

Examples:

- "Customer replied with billing complaint" -> support + billing task
- "Lead replied with pricing objection" -> CRM objection + pricing context + action suggestion
- "Trial user ignored three emails but clicked two push notifications" -> preferred channel shifts
- "Renewal account opened WhatsApp thread asking for discount" -> approval + pricing workflow

---

## Part 4: Campaigns and Automations

The Messaging Engine must support:

- reminder flows
- activation nudges
- abandoned-conversion recovery
- meeting and event reminders
- payment and billing reminders
- support follow-up
- expansion and renewal outreach
- save sequences
- partner and community notifications

Each automation must define:

- triggering event
- eligible audience
- preferred channel order
- suppression conditions
- approval policy
- fallback behavior
- success metric

---

## Part 5: Messaging Agents

**New agent: MARKOS-AGT-MSG-01: Channel Orchestrator**  
Chooses channel order, send timing, and fallback paths.

**New agent: MARKOS-AGT-MSG-02: Reply Classifier**  
Classifies replies by urgency, intent, sentiment, and commercial meaning.

**New agent: MARKOS-AGT-MSG-03: Renewal and Save Messenger**  
Supports high-risk lifecycle moments such as renewal, payment recovery, and churn save.

**New agent: MARKOS-AGT-MSG-04: Support Escalation Router**  
Routes messages into support, CS, billing, or sales queues.

---

## Part 6: UI, API, and MCP Surface

### UI

The operator UI should expose:

- unified messaging inbox
- per-channel thread view
- template manager
- channel health and eligibility view
- automation builder
- approval and escalation view

### API

Required families:

- `/v1/messaging/threads/*`
- `/v1/messaging/events/*`
- `/v1/messaging/templates/*`
- `/v1/messaging/automations/*`
- `/v1/messaging/eligibility/*`
- `/v1/messaging/health/*`

### MCP

Required tools:

- `get_message_thread`
- `suggest_channel_response`
- `check_channel_eligibility`
- `list_pending_message_approvals`
- `rank_conversation_queue`

---

## Part 7: Global-Leader Requirements

To lead the category, the Messaging Engine must:

1. unify channels without flattening their unique rules
2. preserve thread memory across support, sales, and lifecycle moments
3. make channel preference and responsiveness part of the customer profile
4. keep approvals, pricing, and claims safety intact even in fast channels
5. support B2B, B2C, PLG, and support use cases in one system

---

## Part 8: Governance and Safety

The Messaging Engine must never:

- send to ineligible or suppressed profiles
- ignore quiet hours or local compliance
- allow discount or pricing promises outside Pricing Engine rules
- lose the thread history of operator or agent actions
- let support or sales agents auto-send risky customer-facing messages without policy

This is how MarkOS turns fast channels into governed revenue and retention infrastructure.
