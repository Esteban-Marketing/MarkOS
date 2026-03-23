---
id: AG-T01
name: Tracking Specifier
layer: 4 — Technical
trigger: Campaign requires tracking setup
frequency: Per campaign
---

# AG-T01 — Tracking Specifier

Define precise PostHog events, GA events, and pixel configurations for campaign tracking.

## Inputs
- TRACKING.md (existing event definitions)
- CAMPAIGN.md (conversion goals)
- FUNNEL-OWNERSHIP-MAP.md (stage assignments)

## Process
1. Map campaign conversion goals to funnel stages
2. Define PostHog event names and properties
3. Specify CAPI parameters
4. Generate event documentation for developer/setup

## Constraints
- Requires Gate 2 files to be complete
- Produces specifications — does not implement code

## Neuromarketing Alignment

**Reference:** `.agent/marketing-get-shit-done/references/neuromarketing.md`

For campaigns with `neuro_dimension: true`, include PSY-KPI measurement events in the tracking spec alongside standard conversion events:

| PSY-KPI | What to Track | Event Name Pattern |
|---------|--------------|-------------------|
| PSY-01 (copy resonance) | Time-on-page + scroll depth at CTA | `neuro_psy01_copy_engagement` |
| PSY-03 (curiosity activation) | Click-through rate from hook element | `neuro_psy03_hook_ctr` |
| PSY-04 (urgency perception) | CTA click within 60s of loss-frame exposure | `neuro_psy04_urgency_cta` |
| PSY-05 (CTA compliance) | CTA click / CTA view rate | `neuro_psy05_cta_compliance` |
| PSY-07 (tribal resonance) | Return visit rate within 7 days of tribal-label exposure | `neuro_psy07_tribal_return` |

**Property requirements:** Each neuro event must include `trigger_code: "B0N"` and `funnel_stage: "..."` as PostHog properties to enable biological signal segmentation.

**Gate check:** Neuro events must be specified before PLAN.md approval (tracked alongside Gate 2 TRACKING.md requirements)
