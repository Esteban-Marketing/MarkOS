---
date: 2026-04-16
description: "Fragmented data, conflicting channel reports, no causal confidence. MMM + incrementality + clean-room treatments."
tags:
  - literacy
  - playbook
  - pain-point
---

# Attribution & Measurement Playbook

> Parent tag: `attribution_measurement`. Routing: Paid Media · Analytics.

## Symptoms (diagnose)

- Channels self-report > 150% of actual revenue (double-counted)
- MTA last-click vs data-driven models diverge by > 30%
- iOS / Safari traffic uncorrelated with modeled attribution
- Finance does not trust marketing reports

## Root causes (below the symptoms)

- Cookie deprecation + privacy changes broke MTA
- Consent Mode v2 misconfigured → data loss
- No incrementality baseline
- Walled-garden reporting treated as ground truth
- Missing server-side tagging (CAPI, Enhanced Conversions)

## Treatments (what to do)

1. Deploy Google Consent Mode v2 Advanced + IAB TCF v2.2
2. Server-side tagging: Meta CAPI, Google Enhanced, TikTok Events v3, LinkedIn CAPI
3. Monthly MMM via Meridian / Robyn / Recast
4. Quarterly incrementality tests per top-spend channel
5. Unified Measurement dashboard

## Literacy to consult

- [[Data, Analytics & Measurement]]
- [[MMM Revival]]
- [[Incrementality Testing]]
- [[Unified Measurement]]
- [[Google Consent Mode v2]]
- [[Cookie Deprecation Status 2026]]
- [[Data Clean Rooms]]
- [[Attention Metrics]]

## Message tailoring angle

Clarity and causality. Proof: experiment readouts, MMM curves. CTA: consultation or diagnostic.

## Agents to route to

- Data Scientist
- Analyst
- Tracking Spec
- UTM Architect
- Performance Monitor

## Success criteria

- Finance signs off on marketing P&L attribution
- Incrementality calibrated MMM with < 15% deviation
- All top-5 channels have recent lift result

## Measurement

Instrument via [[Unified Measurement]]. Baseline before treatment. Expected change window 30–120 days per treatment.

## Related

- [[Pain-Point Engine]] · [[MarkOS Canon]] · [[Message Crafting Pipeline]] · [[27 Pain-Point Playbooks|README]] · [[Audience Archetype Canon]]
