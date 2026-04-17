---
date: 2026-04-16
description: "Incrementality testing — geo-lift, matched-market, holdouts, synthetic control, PSA ads. How to prove a channel actually caused the outcome."
tags:
  - literacy
  - measurement
  - incrementality
  - experimentation
---

# Incrementality Testing

> Incrementality = the outcome that happened *because* of the media, minus what would have happened anyway. Correlation-based attribution (MTA, last-click) can't answer this. Experiments can.

## Methods

| Method | How | Best for |
|---|---|---|
| **Geo-lift / matched-market** | turn campaign on in Test DMAs, off in Control DMAs; compare | broad-reach channels (CTV, OOH, podcast, linear TV) |
| **User holdout** | randomly withhold exposure from a fraction of the target audience | walled gardens with audience control (Meta, Google, TikTok built-in experiments) |
| **Ghost ads / PSA swap** | serve a PSA to a randomized control slot inside the DSP | programmatic display + video |
| **Synthetic control** | statistical counterfactual when pure holdouts aren't feasible | one-time launches, always-on channels |
| **Switchback** | alternate on/off in rapid cadence | on/off testing of pricing, checkout, email sends |
| **Diff-in-diff** | compare changes across a treated vs. untreated group over time | organic + owned-channel changes |

## Good practice

- **Power calc first.** Undersized tests fabricate null results. Default MDE 5–10%; use geo-level variance, not user-level.
- **Design around a decision.** "What would we do if the answer is +3%? +0%? –3%?" If the answer changes nothing, don't run it.
- **Calibrate MMM priors** with incrementality results — closes the loop (see [[MMM Revival]]).
- **Multiple methods** — trust results confirmed by two independent designs.
- **Negative-test known winners** — occasionally dark a proven channel to refresh the baseline; don't assume prior lift persists.

## Tooling

- **Platform-native** — Meta Conversion Lift, Google Incrementality (incl. GeoLift open-source), TikTok Conversion Lift, Amazon Ads Incrementality.
- **Open-source** — GeoLift (Meta) · CausalImpact (Google) · pylift · EconML · DoubleML.
- **Vendors** — Measured · Haus · Lifesight · Eulerian · Fospha · Rockerbox.

## Common pitfalls

- **Self-selection bias** — "people who saw the ad converted more" is correlation.
- **Spillover** — TV ads in LA spill to neighboring DMAs; treat geographic buffers.
- **Novelty / seasonality confounds** — holidays, competitor launches, macro shocks can swamp lift.
- **Multi-channel interference** — running two lift tests at once pollutes each.
- **Reporting only wins** — incrementality results that show "no lift" are the most valuable ones.

## Related

- [[Data, Analytics & Measurement]] · [[MMM Revival]] · [[Unified Measurement]] · [[Experimentation]] · [[Retail Media Network Landscape 2026]]
