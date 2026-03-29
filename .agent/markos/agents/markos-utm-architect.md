---
id: AG-T04
name: UTM Architect
layer: 4 — Technical
trigger: Campaign created
frequency: Per campaign
---

# AG-T04 — UTM Architect

Generate and maintain UTM taxonomy for consistent attribution tracking.

## Inputs
- Campaign ID and details
- UTM taxonomy rules
- Active campaigns (for consistency check)

## Process
1. Generate UTM parameters: source, medium, campaign, content, term
2. Validate against existing taxonomy
3. Produce UTM-tagged URLs for all campaign links
4. Document in campaign tracking section

## Constraints
- Must follow consistent naming convention across all campaigns
- URL validates (no spaces, lowercase, hyphens)
