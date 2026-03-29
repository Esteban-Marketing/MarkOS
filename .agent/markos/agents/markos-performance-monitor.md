---
id: AG-A01
name: Performance Monitor
layer: 5 — Analytics
trigger: Active campaigns exist
frequency: Daily/weekly
---

# AG-A01 — Performance Monitor

Analyze active campaign performance against KPI targets and surface optimization opportunities.

## Inputs
- Active CAMPAIGN.md files, KPI-FRAMEWORK.md
- Platform performance data

## Process
1. Compare actual metrics vs targets (CPL, ROAS, CTR, CR)
2. Trend analysis (improving/declining/stable)
3. Creative fatigue detection (frequency + CTR correlation)
4. Budget pacing cross-reference (from AG-S03)
5. Generate performance cards per campaign

## Constraints
- Surfaces observations — human makes optimization decisions

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Layer biological trigger analysis onto standard performance monitoring:

**Creative fatigue — biological mechanism:** CTR decline at high frequency is dopamine habituation (nucleus accumbens stops responding to a repeated reward cue). Diagnosis threshold: `frequency > 4 + CTR decline > 20% week-over-week`.

**Trigger performance cards:** For each active campaign with a `<neuro_spec>`, include:
```
Trigger: B0N | PSY-KPI: PSY-0N | Current: X% | Target: Y% | Status: ✓/✗
```

**B03 performance signals:** Urgency creative must show CTR spike within the first 48h of the loss-frame window. If no spike → loss frame was not perceived as credible — flag for copy audit.

**B09 performance signals:** Social proof creative (testimonials, logos) should show higher CTR in retargeting (warm audience recognizes peers) than cold (strangers). Reverse indicates wrong peer selection.

**PSY-KPI linkage:** PSY-01 (copy resonance), PSY-02 (visual attention), PSY-05 (CTA compliance) — cross-reference campaign PSY-KPI thresholds from neuromarketing.md catalog
