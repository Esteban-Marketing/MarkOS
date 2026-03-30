# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **B2B2C** (Property Management Platform)

<!-- markos-token: MIR | model: B2B2C -->
> [!NOTE] This is a completed example for a B2B2C business. Use this as a quality and depth benchmark.

---

## 1. Primary Audience Segments

* **B Side — Property Management Companies (Primary Buyer):** Regional and national property management firms with 200â€“5,000 units under management. The economic buyer is the VP of Operations or CTO. They pay the subscription, deploy the platform to their properties, and measure success by tenant retention and maintenance cost reduction.
* **C Side — Residential Tenants (End User):** Renters aged 22â€“45 living in managed properties. They use the platform daily for rent payments, maintenance requests, and package notifications. They don't pay for the platform but their NPS directly influences whether the property manager renews or churns.
* **B Side — Real Estate Investors / Owners (Influencer):** The asset owners who mandate software choices to their property managers. They care about NOI and occupancy rates, not product features.

## 2. Advanced Psychographics & Neuromarketing Profile

**B Side (Property Manager):**
* **Core Desires/Fears:** Desire to modernize their portfolio without operational disruption. Fear of tenant complaints about a new app and a costly failed rollout.
* **Neuromarketing Triggers:**
  * *Primary Archetype to Target:* **The Caregiver / Operator** — They want harmony, efficiency, and zero surprises.
  * *Effective Cognitive Biases:* Authority (case studies from similar portfolio sizes), Social Proof (which major REITs use this), Loss Aversion ("maintenance request backlogs cost you $X per ticket").

**C Side (Tenant):**
* **Core Desires/Fears:** Desire for frictionless, responsive living experience. Fear of being ignored when something breaks.
* **Neuromarketing Triggers:**
  * *Primary Archetype:* **The Everyman** — They want things to "just work."
  * *Effective Biases:* Convenience (one-tap rent payment), Reciprocity (reward programs for on-time payment), Instant Gratification (real-time maintenance tracking).
* **Pain Points & Frustrations (B Side):** Manual maintenance dispatch via phone/email, PDF rent receipts, disconnected communication between tenants and staff.
* **Objections & Friction (B Side):** "Our tenants are older — they won't use an app." "Our current workflow is good enough." "We've tried technology before and it failed adoption."

## 3. Lexicon & Behavioral Patterns

* **B Side Vocabulary:** "NOI," "occupancy rate," "cap rate," "deferred maintenance," "tenant retention," "lease renewal rate," "work order," "property portfolio."
* **C Side Vocabulary:** "My landlord," "maintenance request," "renters insurance," "lease renewal," "move-in checklist."
* **B Side Channels:** NAA (National Apartment Association) conferences, LinkedIn, Multifamily Executive, trade press. Decision makers are rarely on social media for vendor discovery — demand gen is primarily event-based and referral-driven.
* **C Side Channels:** App store word-of-mouth, Instagram, TikTok (apartment aesthetic content), Reddit (r/renting).

## 4. Regulation & Compliance Restraints

* **Compliance Checks Required:** Fair Housing Act (no discriminatory messaging), state-level rent control regulations, PCI DSS for payment processing, GDPR for EU-based portfolios. Copy must never make specific yield claims to investors without SEC disclaimer.

## 5. Live Vectorized Sentiment (Supabase + Upstash Vector Integration)

* **Vector DB Target:** `upstash-vector://collections/markos-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `markos-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).
