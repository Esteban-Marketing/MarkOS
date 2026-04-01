# LEAN-CANVAS.md — Business Model Physics

## 0. Economic Constraints (YAML)

```yaml
max_cpa                : $45.00
ltv_estimate           : $450.00
primary_revenue_stream : Monthly Retainer + Usage-Based
```

---

## 1. Unfair Advantage
**Codebase-native architecture with integrated MIR + MSP intelligence layer**

No competitor positions marketing agents as codebase infrastructure rather than SaaS dashboards. This eliminates integration friction, ensures client data ownership, and enables ecosystem lock-in (Linear workflow integration, Supabase CRM, GitHub-native deployment). The MIR (Marketing Intelligence Repository) and MSP (Messaging Stack Prompt) are unique — they encode the client's business context and messaging framework directly into agent decision-making. Other tools use generic prompts or dashboards; MarkOS uses contextual vectors.

---

## 2. Revenue Streams

### Primary: Self-Hosted License (Freemium → Paid)
- Freemium tier: Free self-install trial with 1 client project, basic agent features
- Paid Tier 1: $25/month (single agency) — unlimited clients, advanced agents, team collaboration
- Paid Tier 2: $99/month (team) — white-label, API access, dedicated support
- Paid Tier 3: $299+/month (enterprise) — multi-project SLAs, compliance audits

### Secondary: Agency Retainer (Done-With-You)
- Esteban + Team setup service: $2,000–$5,000 one-time consultation + 3-month retainer at $500/month
- Scope: Onboard client, populate MIR/MSP, design first 3 campaigns, train team
- Conversion path: Free install → pilot success → retainer upgrade

### Tertiary: Usage-Based (Future)
- When volume-based licensing launches: $0.50–$2.00 per campaign execution, based on complexity
- Targets scale-stage agencies (100+ campaigns/month)

---

## 3. Cost Structure

### Fixed Costs
- SaaS infrastructure (Supabase, Upstash, Vercel): $400/month
- PostHog analytics: $100/month
- LinkedIn Ads (when activated): $1,000/month
- Loops.so email automation: $80/month
- Total fixed: ~$1,580/month

### Variable Costs
- Cloud compute per concurrent agent execution: ~$0.10 per campaign
- Vector DB storage (Upstash): scales with customer data volume (~$0.05 per 1K chunks)
- Expected variable cost per customer: $5–$10/month

### Team Costs
- Esteban (full-time, all roles): not externalized yet (opportunity cost)
- Juan (freelance designer, 10h/month): $500/month
- Maria (freelance social/strategy, 15h/month): $750/month
- Total team: $1,250/month (freelance only; Esteban cost not included)

---

## 4. Key Metrics
**These metrics determine health and runway**

| Metric | Target (90d) | Target (12mo) | Why This Matters |
|--------|--------------|---------------|-----------------|
| Activated Users (NSM) | 25 | 150 | Installed + MIR complete + ≥1 campaign executed |
| Install → Activation Rate | 60% | 65% | Proxy for product-market fit |
| New Installs/Week | 10 (week 4) | 40 (week 12) | Volume indicator; required for revenue targets |
| Day-30 Retention Rate | 40% | 50% | Churn is the limiting factor at this stage |
| MRR | $500 | $12,000 | Revenue target; assumes 80 paid users at $150/mo avg |
| CAC (Cost Acq. Customer) | $35–$45 | $25–$35 | If organic-first strategy achieves >50% of installs |
| LTV (Lifetime Value) | $450–$600 | $800–$1,200 | Based on 12-month average customer duration |
| LTV:CAC Ratio | 10:1 to 15:1 | 20:1+ | Healthy ratio requires LTV growth or CAC reduction |

---

## 5. Revenue Math (Illustrative)
**Scenario: 150 activated users by month 12**

Conversion funnel:
- 1,000 installs (organic-first, high touch)
- 600 activated (60% conversion rate)
- 120 paid conversions (20% of activated)
- Average revenue per paid customer: $100/mo (mix of $25, $99, $299 tiers)
- MRR: $12,000

---

## 6. Pricing Rationale
**Why these numbers?**

- **Freemium floor ($0)**: Zero friction for developers and indie hackers (default Agents-aaS distribution strategy)
- **Tier 1 ($25/mo)**: Targets solo operators and small agencies; under $300/year (impulse buy threshold)
- **Tier 2 ($99/mo)**: Targets growth-stage agencies (5–20 person teams); includes team features
- **Tier 3 ($299/mo)**: Enterprise pricing; covers compliance, SLAs, dedicated support
- **Retainer ($2K–$5K upfront + $500/mo)**: Conversion play for high-touch customers; happens after pilot success with free tier