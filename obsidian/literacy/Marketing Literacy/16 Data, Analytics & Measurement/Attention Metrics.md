---
date: 2026-04-16
description: "Attention metrics — the successor to viewability. Vendors (Adelaide AU, Realeyes, TVision, Lumen), what they measure, and when to actually use them."
tags:
  - literacy
  - measurement
  - attention
  - frontier
---

# Attention Metrics

> Attention measures whether a human *actually looked at* the ad, and for how long, with what intensity. Viewability ("≥50% of pixels on screen for ≥1 second") is a necessary but insufficient floor. Attention is the 2026 planning KPI.

## What gets measured

| Vendor | Signal | Notes |
|---|---|---|
| **Adelaide AU** | modeled attention score per placement | the leading media-planning metric; cross-channel score |
| **Realeyes** | facial-expression panel, eye tracking | creative pre-testing + in-flight |
| **TVision** | living-room passive viewing | CTV + linear TV |
| **Lumen** | eye-tracking panel + ML model | web + video |
| **DoubleVerify Attention** | volumetric + viewability + engagement | verification-integrated |
| **IAS Total Visibility** | attention score embedded in verification | verification-integrated |

## When attention beats viewability

- CTV where completed-view + attention together reveal real watching vs. "TV on in the kitchen."
- Social where thumb-stop + dwell discriminate scroll-past from actual watch.
- Programmatic display where viewable-but-ignored impressions are the default.

## Using it well

1. **Set attention thresholds in PMP deals** — don't buy under X attention score.
2. **Feed attention into MMM priors** — high-attention inventory should get higher coefficients.
3. **Creative optimization loop** — pre-test creative with Realeyes/Lumen; ship winners.
4. **Don't double-count** — attention + incrementality together is the check; attention alone still correlational.

## Pitfalls

- **Vendor-specific scales** — Adelaide, Lumen, DV give different numbers for the same placement. Pick one metric for planning.
- **Attention ≠ outcome.** High attention on a creative that says the wrong thing still fails. Measure against business metric, not attention KPI.
- **Panel bias** — Realeyes and Lumen use opted-in panels; represent well, but not the whole population.

## Related

- [[Data, Analytics & Measurement]] · [[MMM Revival]] · [[Incrementality Testing]] · [[CTV Programmatic]] · [[Unified Measurement]]
