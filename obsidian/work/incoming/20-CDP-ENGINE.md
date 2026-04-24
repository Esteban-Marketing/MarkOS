# MarkOS CDP Engine
## Identity Graph · Event Stream · Customer 360 Substrate · Segmentation · Consent · Activation

---

## Why the CDP Gets Its Own Engine

MarkOS already aims to connect content, social, paid media, research, CRM, pricing,
support, product usage, billing, and lifecycle messaging. None of that can become a
category-leading system if identity is fragmented across tools and if events do not resolve
into one coherent profile.

The CDP Engine is the data unification layer of MarkOS.

It is distinct from the CRM:

- The **CDP** is the raw and computed profile substrate
- The **CRM** is the operational relationship and revenue workspace
- The **Analytics Engine** is the measurement and attribution layer

MarkOS needs all three, but the CDP is the foundation under the other two.

---

## Core Doctrine

The CDP Engine follows seven rules:

1. **Identity resolution must be deterministic first, AI-assisted second**
2. **Profiles are event-computed, not manually stitched**
3. **Consent and preference state are part of the core profile**
4. **B2B and B2C profiles must both be native**
5. **Segments are computed products, not static lists**
6. **Every downstream engine reads from the same canonical profile substrate**
7. **Cross-tenant learning is aggregated and anonymous only**

---

## What the CDP Engine Must Do

The engine must provide:

- identity resolution across anonymous and known users
- account-person-household or workspace linking where relevant
- unified event ingestion
- computed traits and lifecycle state
- consent and preference memory
- real-time and batch segmentation
- audience activation to Email, Messaging, CRM, Analytics, and external tools
- profile change logs and merge history

---

## Part 1: The CDP Architecture

### The five layers

```
Layer 1: Event ingestion
  Website, forms, product usage, email, messaging, CRM, billing, support, social,
  ads, partner, and marketplace events

Layer 2: Identity resolution
  Anonymous IDs, cookies, device IDs, emails, phone numbers, account IDs,
  subscription IDs, user IDs, workspace IDs

Layer 3: Unified profile computation
  Person, account, workspace, and household style records

Layer 4: Traits and lifecycle state
  Activation, fit, intent, value realization, churn risk, expansion potential

Layer 5: Segment and activation layer
  Audiences pushed to CRM, Email, Messaging, Ads, Analytics, Support, and AI agents
```

### Canonical objects

```typescript
interface IdentityNode {
  identity_id: string
  tenant_id: string
  identity_type:
    | 'anonymous_cookie'
    | 'email'
    | 'phone'
    | 'user_id'
    | 'account_id'
    | 'workspace_id'
    | 'subscription_id'
    | 'external_id'
  identity_value_hash: string
  source_system: string
  confidence: 'high' | 'medium' | 'low'
  verified: boolean
  first_seen_at: string
  last_seen_at: string
}

interface UnifiedProfile {
  profile_id: string
  tenant_id: string
  profile_type: 'person' | 'account' | 'workspace'
  mode: 'b2b' | 'b2c' | 'plg_b2b' | 'plg_b2c' | 'b2b2c'

  identity_ids: string[]
  primary_email: string | null
  primary_phone: string | null
  company_name: string | null
  account_id: string | null

  traits: Record<string, string | number | boolean | null>
  lifecycle_state: string
  consent_state_id: string | null
  last_meaningful_touch_at: string | null
  updated_at: string
}

interface UnifiedEvent {
  event_id: string
  tenant_id: string
  event_name: string
  event_domain:
    | 'website'
    | 'product'
    | 'email'
    | 'messaging'
    | 'crm'
    | 'billing'
    | 'support'
    | 'social'
    | 'ads'
    | 'partner'
  occurred_at: string
  profile_id: string | null
  account_id: string | null
  anonymous_id: string | null
  properties: Record<string, string | number | boolean | null>
}
```

---

## Part 2: Identity Resolution

Identity resolution is the hardest part of a CDP and one of the biggest sources
of silent failure. MarkOS must handle it explicitly.

### Deterministic merge rules

Hard match signals:

- verified email
- verified phone
- authenticated user ID
- billing customer ID
- subscription ID
- platform workspace ID

Soft match signals:

- same company domain + name + title similarity
- same device + login path
- same behavior trail after form submit
- same phone + messaging opt-in

### Merge behavior

- hard-match merges can auto-resolve
- soft-match merges must create suggestions when confidence is below threshold
- every merge must be reversible
- every merge must preserve lineage

This prevents the common CDP failure where aggressive merge logic destroys profile trust.

---

## Part 3: Consent, Preference, and Eligibility

The CDP must store channel eligibility as a first-class object:

```typescript
interface ConsentState {
  consent_state_id: string
  tenant_id: string
  profile_id: string

  email_marketing: 'opted_in' | 'opted_out' | 'unknown'
  sms_marketing: 'opted_in' | 'opted_out' | 'unknown'
  whatsapp_marketing: 'opted_in' | 'opted_out' | 'unknown'
  push_enabled: boolean
  in_app_enabled: boolean

  legal_basis: 'consent' | 'contract' | 'legitimate_interest' | 'unknown'
  source: string | null
  source_timestamp: string | null
  quiet_hours: string | null
  preference_tags: string[]
}
```

Every downstream send engine must consume this object instead of inventing its own version.

---

## Part 4: Computed Traits and Segments

The CDP must continuously compute:

- lifecycle stage
- persona / role guess
- product activation status
- account fit
- intent score
- expansion potential
- churn risk precursor
- content appetite
- preferred channel
- time-zone safe send window

### Segment model

```typescript
interface SegmentDefinition {
  segment_id: string
  tenant_id: string
  name: string
  objective: string
  entity_type: 'person' | 'account'
  logic_json: Record<string, unknown>
  freshness_mode: 'real_time' | 'hourly' | 'daily'
  destination_families: Array<'crm' | 'email' | 'messaging' | 'ads' | 'analytics' | 'support'>
}
```

Segments should support:

- real-time entry and exit
- exclusion logic
- suppression logic
- sequence eligibility
- audience snapshots for measurement

---

## Part 5: The CDP as the Substrate for the Whole OS

The CDP Engine must feed:

- doc 18 CRM Engine with resolved people, accounts, and signals
- doc 19 Email Engine with audiences and eligibility
- doc 21 Messaging Engine with phone, push, and thread identity
- doc 22 Analytics Engine with canonical event streams and cohort inputs
- doc 23 Conversion Engine with personalization and form attribution
- doc 16 SaaS Suite with product usage, health, and subscription context

Without the CDP, each engine will reinvent identity and eventually disagree.

---

## Part 6: CDP Agents

**New agent: MARKOS-AGT-CDP-01: Identity Resolver**  
Maintains merge logic, conflict review, and reversible identity stitching.

**New agent: MARKOS-AGT-CDP-02: Trait Compiler**  
Computes lifecycle, fit, intent, activation, and risk traits.

**New agent: MARKOS-AGT-CDP-03: Audience Builder**  
Builds and audits segment definitions, exclusions, and destination activation.

**New agent: MARKOS-AGT-CDP-04: Consent Guardian**  
Protects preference, legal basis, suppression, and eligibility state.

---

## Part 7: UI, API, and MCP Surface

### UI

The CDP UI should expose:

- identity graph review
- merge suggestions
- unified profile inspector
- trait explorer
- consent and preference center
- segment builder
- audience activation logs

### API

Required families:

- `/v1/cdp/profiles/*`
- `/v1/cdp/events/*`
- `/v1/cdp/identity/*`
- `/v1/cdp/consent/*`
- `/v1/cdp/segments/*`
- `/v1/cdp/audiences/*`

### MCP

Required tools:

- `get_unified_profile`
- `explain_identity_merge`
- `list_profile_segments`
- `compute_audience`
- `get_consent_state`
- `explain_trait_changes`

---

## Part 8: Global-Leader Requirements

To lead the category, the CDP Engine must:

1. support both person and account level truth
2. unify product, revenue, lifecycle, and acquisition events
3. make consent and channel eligibility universal
4. make traits and segments agent-readable by default
5. preserve merge trust through reversibility and audit history
6. feed every other MarkOS engine from one canonical substrate

---

## Part 9: Governance and Safety

The CDP Engine must never:

- merge profiles irreversibly without evidence
- allow downstream channels to ignore consent state
- leak raw PII into cross-tenant learning
- create segments that bypass tenant scoping
- let downstream engines drift into separate identity systems

The CDP is therefore not just a data layer. It is the identity backbone of the
Marketing Operating System.
