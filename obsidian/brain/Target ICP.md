---
date: 2026-04-16
description: "MarkOS SaaS target ICP (Q-A) — seed-to-A B2B SaaS + modern DTC + solopreneurs + vibe-coders. Locked 2026-04-16. Drives feature order, pricing floor, GTM narrative."
tags:
  - brain
  - icp
  - gtm
  - markos
---

# Target ICP

> Locked 2026-04-16 under SaaS Roadmap decision Q-A. First wedge = **seed-to-A B2B SaaS + modern DTC + solopreneurs (incl. vibe-coders)**. Every feature prioritization, pricing tier, docs voice, and partnership decision points back to this ICP until v4.3.0.

## Three archetypes (primary)

### Archetype 1 — "Solo Founder Sam" (solopreneur / vibe-coder)

- Running a product or service alone or with ≤ 3 people.
- Ships via Cursor / Windsurf / v0 / Lovable / Bolt / Replit / Vercel / Claude Code.
- Uses Claude Desktop or ChatGPT as a primary co-worker.
- Marketing is the biggest missing muscle; prior attempts felt generic.
- Pays $20–$200/mo for tools that close a concrete loop in minutes.
- Distributes via Claude Marketplace + npm + Vercel templates + Twitter/X + Product Hunt.
- **Wedge**: `npx markos init --preset=solopreneur` → first audit-passing draft in under 5 minutes via CLI or MCP.

### Archetype 2 — "Growth Gina" (seed-to-A B2B SaaS, Head of Growth / Head of Marketing)

- 10–80-person company; series Seed or A.
- Owns acquisition + lifecycle + content; 1–3 direct reports.
- Martech stack: HubSpot or Attio · Stripe · Segment · PostHog · Resend · Slack · Linear · Supabase · Shopify-adjacent.
- Burns on CAC; feels MTA lying; senses pipeline velocity slowing.
- Needs agentic leverage without breaking brand or compliance.
- Pays $500–$5000/mo for a system that lifts ROAS + gives clean attribution.
- **Wedge**: `--preset=b2b-saas` → MIR/MSP from URL ingest + first tier-1 connector live + first [[Pain-Point Engine|pain-rooted]] campaign in one working day.

### Archetype 3 — "Commerce Clara" (modern DTC founder / brand lead)

- 10–50-person brand; Shopify-first; modern ESP (Klaviyo/Customer.io alternatives); ads-heavy.
- Optimizing LTV·CAC, retention, retail-media attribution.
- Wants creative velocity + brand consistency + platform agnosticism.
- Pays $500–$5000/mo (similar to Gina) with higher spend on media.
- **Wedge**: retail-media + creative pipeline + lifecycle flows for DTC patterns (first-purchase, replenishment, winback, referral).

## Non-target (explicit)

- **Large-enterprise marketing departments (Y1)** — tackled later via white-label + agency tier + BYOC.
- **Agencies v1** — addressed via the Agency white-label tier in v4.2.0, not in first wedge.
- **Consumer marketers without digital distribution** — no fit.
- **Regulated-only verticals (pharma, financial services)** — deferred to HIPAA/compliance-capable v4.3.0.

## Implications

| Decision axis | ICP-driven choice |
|---|---|
| **Distribution** | Claude Marketplace + Vercel templates + npm + Product Hunt + dev-Twitter (first) · HubSpot App Marketplace + Shopify App Store (second wave) |
| **Pricing floor** | $49/mo solo tier · $499/mo team tier · usage-metered AI · BYOK discount |
| **Onboarding** | 5-min preset + 30-min guided AI interview; zero sales-call requirement for Sam + Gina + Clara |
| **Connectors** | Shopify + HubSpot + Stripe + Slack + Google/Meta Ads + GA4 + Segment + Resend + Twilio + PostHog + Linear + Supabase are literally the top-10 stack of these archetypes |
| **Docs + voice** | developer-native tone (see [[Brand Stance]]); API-first; code samples front-and-center |
| **Feature order** | CLI + MCP + SDK > UI cosmetics in wave-0; operator UI polishes in v4.2.0 |
| **Community** | GitHub Discussions + Discord + Claude Marketplace reviews · paid partnerships with vibe-coder creators |
| **Support** | async-first · `markos status` CLI + in-app status · live chat Gina+Clara tier |

## What the ICP explicitly does NOT need v1

- Full attribution MMM.
- Enterprise SSO (SAML) — launches with SCIM + OAuth + magic links.
- Multi-region residency — US-East first.
- Multi-brand/multi-workspace — single tenant per account at launch.
- White-label — arrives in v4.2.0.

## Success signals (first 12 months)

- **Sam** — 1000 signups · 200 MAUs · 30 paying solo tier · 50 via Claude Marketplace · NPS ≥ 40.
- **Gina** — 100 paying team tier · average MRR per account ≥ $1k · 70% retention at 90d · 3 public case studies.
- **Clara** — 30 paying DTC brands · aggregate GMV attributed to MarkOS ≥ $5M · 2 public case studies.

## Anti-scope creep fence

Any feature proposal that doesn't serve one of the three archetypes above needs explicit milestone-level approval. Filed in [[Key Decisions]] as "ICP exception" with rationale.

## Related

- [[MarkOS Canon]] · [[Brand Stance]] · [[Audience Archetype Canon]] · [[Message Crafting Pipeline]] · [[Pain-Point Engine]]
- Roadmap: [[2026-04-16-markos-saas-roadmap|MarkOS SaaS Roadmap]]
- [[Key Decisions]]
