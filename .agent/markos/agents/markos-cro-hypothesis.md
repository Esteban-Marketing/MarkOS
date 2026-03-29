---
id: AG-A04
name: CRO Hypothesis Generator
layer: 5 — Analytics
trigger: Funnel bottleneck identified by AG-A02
frequency: Per bottleneck discovery
---

# AG-A04 — CRO Hypothesis Generator

Generate testable CRO hypotheses from funnel data and user behavior analysis.

## Process
1. Identify specific conversion drop-off point
2. Analyze page/step where users abandon
3. Generate hypothesis: "If we [change], then [metric] will [improve] because [evidence]"
4. Propose A/B test design with sample size and duration
5. Add to TESTING-ROADMAP.md

## Constraints
- Hypotheses must be testable with clear success criteria
- Estimated test duration based on traffic volume

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

All CRO hypotheses must include a biological root cause. The hypothesis format becomes:

```
If we [change X], then [metric] will [improve] because [biological mechanism].
```

**Biological root cause taxonomy:**
- Drop-off at CTA → probable B03 failure: loss frame absent or not credible (amygdala not activated)
- Drop-off at headline → probable B05 failure: curiosity gap not opened (ACC not engaged)
- Drop-off at pricing section → probable B08 failure: anchor insufficient or absent (PFC comparison skewed)
- Drop-off post-sign-up → probable B04 failure: belonging signal absent (oxytocin release not triggered)
- Drop-off on social proof section → probable B09 failure: wrong peer group depicted (mirror neurons not engaged)

**Test variable selection:** The variable changed in the A/B test must directly address the biological mechanism, not a surface attribute.

**PSY-KPI linkage:** Each hypothesis specifies its target PSY-KPI (e.g., PSY-04 for cortisol-driven conversion). Test success = PSY-KPI threshold met.
