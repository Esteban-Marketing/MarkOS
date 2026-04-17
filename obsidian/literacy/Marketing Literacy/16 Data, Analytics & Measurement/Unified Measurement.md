---
date: 2026-04-16
description: "Unified Measurement — triangulate MMM + MTA + incrementality into one decision surface. No single method is complete; together they close the loop."
tags:
  - literacy
  - measurement
  - unified
  - frontier
---

# Unified Measurement

> No single measurement method is complete. Unified Measurement stitches MMM (top-down), MTA (bottom-up where still valid), and experiments (causal ground-truth) into a single decision surface the exec team can actually act on.

## Why no single method suffices

| Method | Strength | Weakness |
|---|---|---|
| MTA | user-level granularity, tactical | broken by privacy, walled gardens, cookieless |
| MMM | channel-level, handles all media, causal-ish | slow, coarse, needs history |
| Experiments | truly causal | expensive, one question at a time |
| Platform-reported | real-time, detailed | self-marking homework |
| Attention | qualitative signal | doesn't prove outcome |

## Stitching pattern

1. **Incrementality tests** provide *ground truth* on one channel at a time.
2. **MMM** uses incrementality results as **priors** for its Bayesian model.
3. **MTA** (where still valid — primarily on owned-channel conversions with first-party IDs) provides tactical guidance *within* channels MMM's already sized.
4. **Attention + attribution data** from RMNs + DSPs feeds as covariates into MMM.
5. **Unified dashboard** surfaces MMM response curves, incrementality readouts, and MTA drill-downs side-by-side; planners pick the right lens per decision.

## Operating rhythm

- **Weekly** — MTA within-channel optimization.
- **Monthly** — MMM refresh; budget reallocation.
- **Quarterly** — planned incrementality tests calibrate priors for next MMM cycle.
- **Annual** — full stack audit: priors, covariates, model specifications.

## Tooling (2026)

- **Modeling** — Recast · Mutinex · Meridian · Robyn · PyMC-Marketing.
- **Incrementality** — Measured · Haus · Lifesight · platform-native lift APIs.
- **Dashboards** — Evidence.dev · Hex · Sigma · Metabase · custom Streamlit.
- **Data** — warehouse-native (Snowflake · BigQuery · Databricks · Redshift).

## Pitfalls

- Calling "MMM + a slide of MTA" a unified system — it's not. Calibration loop is the defining property.
- Letting finance-grade MMM override tactical reality — planners need MTA/real-time within MMM-sized budgets.
- Single-source dashboards — combining from three tools without schema alignment creates decision chaos.

## Related

- [[MMM Revival]] · [[Incrementality Testing]] · [[Attention Metrics]] · [[Data, Analytics & Measurement]] · [[CDP · Data Warehouse · Reverse ETL]]
