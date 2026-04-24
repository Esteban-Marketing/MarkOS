# MarkOS Conversion Engine
## Landing Pages · Forms · Offers · CRO · Personalization · Experimentation · Conversion Infrastructure

---

## Why Conversion Gets Its Own Engine

MarkOS can already imagine, research, write, message, and measure. To become a true
category leader, it must also own the place where attention turns into identity,
identity turns into intent, and intent turns into pipeline or revenue.

The Conversion Engine is that layer.

It is not a generic site builder. It is a structured, governed conversion system for:

- landing pages
- campaign pages
- signup flows
- demo pages
- pricing pages
- lead capture forms
- launch pages
- offer pages
- experiment variants

---

## Core Doctrine

The Conversion Engine follows seven rules:

1. **Conversion first, publishing second**
2. **Structured blocks before arbitrary page chaos**
3. **Every page is tied to a goal, audience, and measurement plan**
4. **Forms are part of identity and CRM orchestration, not isolated embeds**
5. **Pages, offers, and CTAs must consume governed pricing and claims**
6. **Experiments must be native, attributable, and reversible**
7. **Performance, SEO, and accessibility are built in**

---

## What the Conversion Engine Must Do

The engine must support:

- landing page creation from briefs and campaigns
- modular page composition
- embedded forms and progressive profiling
- offer and CTA management
- dynamic personalization by audience or stage
- A/B and multivariate testing
- conversion and funnel measurement
- routing to CRM, Email, Messaging, and Analytics

---

## Part 1: Page and Form Architecture

### Core objects

```typescript
interface ConversionPage {
  page_id: string
  tenant_id: string
  page_type:
    | 'landing'
    | 'signup'
    | 'demo'
    | 'pricing'
    | 'launch'
    | 'webinar'
    | 'offer'
    | 'thank_you'
  slug: string
  title: string
  status: 'draft' | 'pending_approval' | 'published' | 'archived'

  objective:
    | 'lead_capture'
    | 'trial_signup'
    | 'demo_request'
    | 'purchase'
    | 'waitlist'
    | 'webinar_registration'
    | 'content_download'
    | 'upgrade'

  audience_id: string | null
  experiment_set_id: string | null
  pricing_context_id: string | null
  evidence_pack_id: string | null
  block_ids: string[]
}

interface ConversionForm {
  form_id: string
  tenant_id: string
  objective:
    | 'contact_capture'
    | 'demo_request'
    | 'trial_signup'
    | 'newsletter'
    | 'waitlist'
    | 'upgrade'
    | 'event_registration'
  fields: ConversionField[]
  progressive_profile: boolean
  routing_rules_id: string
  spam_protection_mode: string
  destination_family: Array<'crm' | 'cdp' | 'email' | 'messaging' | 'analytics'>
}

interface ConversionExperiment {
  experiment_id: string
  tenant_id: string
  surface_type: 'page' | 'form' | 'cta' | 'offer'
  hypothesis: string
  primary_metric: string
  secondary_metrics: string[]
  variant_ids: string[]
  status: 'draft' | 'pending_approval' | 'running' | 'stopped' | 'completed'
}
```

### Structured page blocks

Pages should be built from governed blocks such as:

- hero
- trust strip
- feature grid
- proof and case study
- pricing section
- comparison section
- CTA band
- FAQ
- webinar agenda
- testimonial wall
- integration gallery
- objection handling
- executive summary

This makes pages composable by agents and safe for operators.

---

## Part 2: Forms as Revenue Infrastructure

Forms are not inputs. They are **identity and routing events**.

Every form submission should:

- create or enrich a CDP profile
- write to the CRM timeline
- update lifecycle state
- trigger the correct email or messaging journey
- create tasks when intent is high
- attach attribution and page context

MarkOS should support:

- progressive profiling
- hidden attribution fields
- ICP and qualification logic
- routing to owners or queues
- spam and fraud controls
- form-specific conversion reporting

---

## Part 3: Personalization and Dynamic Offers

The Conversion Engine must support dynamic page and form behavior based on:

- channel source
- campaign context
- audience segment
- lifecycle stage
- account tier
- SaaS mode
- pricing posture
- experiment assignment

Examples:

- returning visitor sees a shorter form
- PLG user sees "start free" instead of "book demo"
- enterprise segment sees compliance and security proof higher on page
- account in active opportunity sees pricing context aligned to approved recommendation

---

## Part 4: Experimentation and CRO

The Conversion Engine must make experimentation native:

- page experiments
- CTA experiments
- proof-order experiments
- pricing-page wording experiments
- form-length experiments
- offer experiments

Every experiment must define:

- hypothesis
- expected impact
- risk
- sample requirements
- stop rules
- approval state if pricing or claims are involved

The Analytics Engine must consume this directly.

---

## Part 5: Conversion Agents

**New agent: MARKOS-AGT-CNV-01: Landing Page Strategist**  
Turns campaign goals, research, and audience context into page structures.

**New agent: MARKOS-AGT-CNV-02: Form Optimizer**  
Balances conversion rate, qualification quality, and routing needs.

**New agent: MARKOS-AGT-CNV-03: CRO Experiment Manager**  
Builds and monitors conversion experiments with clear stop rules.

**New agent: MARKOS-AGT-CNV-04: Offer Composer**  
Generates governed offer framing tied to pricing, lifecycle, and audience.

---

## Part 6: UI, API, and MCP Surface

### UI

The operator UI should provide:

- page builder
- form builder
- offer and CTA manager
- experiment center
- page analytics overlay
- approval and publish workflow

### API

Required families:

- `/v1/conversion/pages/*`
- `/v1/conversion/forms/*`
- `/v1/conversion/offers/*`
- `/v1/conversion/experiments/*`
- `/v1/conversion/events/*`

### MCP

Required tools:

- `draft_landing_page`
- `review_page_for_claim_risk`
- `generate_form_variant`
- `create_conversion_experiment`
- `explain_conversion_dropoff`

---

## Part 7: Global-Leader Requirements

To lead the category, the Conversion Engine must:

1. make pages agent-composable but operator-governed
2. make forms native identity and routing infrastructure
3. unify experiments, offers, and analytics in one system
4. connect landing experiences directly to CRM, Email, Messaging, CDP, and Pricing
5. preserve accessibility, speed, SEO, and governance under high iteration speed

---

## Part 8: Governance and Safety

The Conversion Engine must never:

- publish unsupported claims
- render hard-coded pricing outside Pricing Engine rules
- drop attribution or identity context on conversion
- let experiments run without measurement and rollback posture
- let agents rewrite live pages without approval policy

This is how MarkOS turns web surfaces into governed revenue infrastructure rather than
one-off campaign assets.
