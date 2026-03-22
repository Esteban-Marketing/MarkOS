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
