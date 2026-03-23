---
name: mgsd-progress
description: Display project dashboard with MIR gates, phase status, and next action
---

# mgsd-progress

<context>
Reports the current status of the marketing project.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/progress.md
</execution_context>

<process>
Execute the `/mgsd-progress` workflow exactly as documented in the workflow file.
</process>

## Template Paths

This skill operates within the MGSD structure. It honors overrides placed in the client .mgsd-local/ directory before falling back to the default .agent/marketing-get-shit-done/ templates.

<!-- OVERRIDABLE: .mgsd-local/MIR/Core_Strategy/ overrides .agent/marketing-get-shit-done/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Market_Audiences/ overrides .agent/marketing-get-shit-done/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Products/ overrides .agent/marketing-get-shit-done/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Campaigns_Assets/ overrides .agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Operations/ overrides .agent/marketing-get-shit-done/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .mgsd-local/MSP/ overrides .agent/marketing-get-shit-done/templates/MSP/ -->
<!-- OVERRIDABLE: .mgsd-local/config/config.json overrides .agent/marketing-get-shit-done/templates/config.json -->