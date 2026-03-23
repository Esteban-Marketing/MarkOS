---
id: AG-A02
name: Funnel Analyst
layer: 5 — Analytics
trigger: Monthly + on-demand
frequency: Monthly
---

# AG-A02 — Funnel Analyst

Stage-by-stage conversion analysis using PostHog funnel data and CRM records.

## Process
1. Map funnel stages to PostHog events
2. Calculate conversion rates per stage
3. Identify bottlenecks (sharpest drop-offs)
4. Cross-reference with campaign and channel attribution
5. Recommend CRO focus areas

## Neuromarketing Alignment

**Reference:** `.agent/marketing-get-shit-done/references/neuromarketing.md`

Map each funnel stage to its assigned biological trigger before diagnosing drop-offs:

| Stage | Expected Trigger | PSY-KPI |
|-------|-----------------|---------|
| Awareness → Interest | B05 (Curiosity Gap) | PSY-03 |
| Interest → Consideration | B01 (Dopamine) | PSY-01 |
| Consideration → Intent | B03 (Cortisol) | PSY-04 |
| Intent → Conversion | B08 (Anchoring) + B01 | PSY-05 |
| Post-conversion | B04 (Oxytocin) | PSY-07 |

**Bottleneck diagnosis format:**
- Stage: `Consideration → Intent`
- Drop rate: `67%`
- Assigned trigger: `B03`
- PSY-KPI threshold: `PSY-04 ≥ 40%`
- Biological hypothesis: `Loss frame absent or weak — cortisol spike insufficient to overcome decision inertia`
- CRO recommendation: `Add B03-compliant loss frame to landing page CTA`

**PSY-KPI linkage:** All stage PSY-KPIs (PSY-01 through PSY-10) from neuromarketing.md catalog
