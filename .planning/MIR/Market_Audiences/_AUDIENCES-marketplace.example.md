# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **Marketplace** (Freelance Creative Services Platform)

<!-- markos-token: MIR | model: Marketplace -->
> [!NOTE] Marketplace requires dual-side audience mapping. Use this as a quality and depth benchmark.

---

## Supply Side — Freelance Creatives (Sellers)

### 1. Supply Side Segments
* **Independent Graphic Designers (Core):** 2â€“8 years of experience, primarily self-taught or design school graduates, freelancing as their primary income ($45Kâ€“$90K/yr). They join the platform to replace unpredictable client referrals with consistent inbound.
* **Established Creative Studios (Growth):** Small studios (2â€“5 people) looking to fill capacity gaps between anchor clients. Higher average project value, more selective about project types.

### 2. Supply Side Psychographics
* **Core Desires/Fears:**
  * Desire: Predictable, quality inbound — getting paid to do their best work without cold outreach.
  * Fear: The race to the bottom on pricing; competing with offshore freelancers on price alone.
* **Neuromarketing Triggers — Supply Side:**
  * *Archetype:* **The Creator** — They want to be recognized for craft, not availability.
  * *Biases:* Social Proof (top earner spotlights), Autonomy Bias (set your own rates), Authority (platform quality badge that signals premium positioning).
* **Objections (Supply Side):** "Another platform taking 20% of my revenue." "I'll just get low-budget clients." "I already have enough work through referrals."

### 3. Supply Side Lexicon
* **Vocabulary:** "Brief," "deliverables," "revision rounds," "client ghosting," "scope creep," "portfolio," "retainer," "kill fee," "creative direction," "style guide."
* **Channels:** Behance/Dribbble (portfolio), Instagram (showcase), Reddit (r/freelance, r/graphic_design), Designer Slack communities, YouTube (business of freelancing content).

---

## Demand Side — Businesses Hiring Creatives (Buyers)

### 1. Demand Side Segments
* **Marketing Teams at Growth-Stage Startups (Primary):** 20â€“200 person companies with a 2â€“5 person marketing team. They have recurring creative needs (ad creatives, social assets, pitch decks) but cannot justify a full-time designer hire.
* **Agency Creative Directors on Overflow (Secondary):** Ad agencies and brand studios that overflow to the platform for specialist talent (motion design, 3D, UX illustration) on project bursts.

### 2. Demand Side Psychographics
* **Core Desires/Fears:**
  * Desire: Fast access to a vetted designer who "gets it" without a lengthy briefing process.
  * Fear: A deliverable that misses the brief, blows the deadline, or requires 6 rounds of revision — all while the campaign launch date looms.
* **Neuromarketing Triggers — Demand Side:**
  * *Archetype:* **The Pragmatist Ruler** — They need things done right, fast, without drama.
  * *Biases:* Social Proof (client testimonials with brand recognition), Risk Reversal (escrow payments, revision guarantees), Authority (vetted/verified badge on freelancers).
* **Objections (Demand Side):** "How do I know they're reliable?" "I've been burned by freelancers missing deadlines." "Our brand guidelines are complex — will they follow them?"

### 3. Demand Side Lexicon
* **Vocabulary:** "Brand assets," "visual identity," "on-brand," "quick turnaround," "vetting," "creative brief," "sourcing," "project management."
* **Channels:** LinkedIn (for recruitment/sourcing), ProductHunt (for tool discovery), Slack communities (startup-focused), referrals from other founders.

## 4. Regulation & Compliance Restraints
* **Compliance:** Worker classification laws (gig worker vs. employee, per state/country), payment processing compliance (KYC for payouts), GDPR for EU users on both sides, IP ownership transfer clauses in contracts, payment escrow regulations.

## 5. Live Vectorized Sentiment (Supabase + Upstash Vector Integration)
* **Vector DB Target:** `upstash-vector://collections/markos-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `markos-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).
