---
name: markos-plan-phase
description: Create detailed phase plans (PLAN.md) with researcher → planner → checker agent chain and MIR gate verification
---

# markos-plan-phase

<context>
Orchestrates a 3-agent chain (market researcher → marketing planner → plan checker) with a revision loop to produce deep, concrete PLAN.md files for a marketing phase. Includes MIR gate check, brief express path, and auto-advance to execute.
</context>

<execution_context>
@.agent/markos/workflows/plan-phase.md
</execution_context>

<process>
Execute the `/markos-plan-phase` workflow exactly as documented in the workflow file.
Arguments: phase number (e.g., `1` or `2.1`), optional flags: `--research`, `--skip-research`, `--gaps`, `--brief <file>`, `--auto`.
</process>

<success_criteria>
- [ ] The core objective stated in the context or workflow was perfectly achieved.
- [ ] Required output files or state updates are correctly written to disk.
- [ ] Operations are atomic and accurately logged.
</success_criteria>

<failure_modes>
- Required input files (context, state, plans) may be missing or empty.
- Tools may fail due to incorrect parameters or unexpected system states.
- Agent may hallucinate completion without verifying final file contents.
</failure_modes>

## Template Paths

This skill operates within the MARKOS structure. It honors overrides placed in the client .markos-local/ directory before falling back to the default .agent/markos/ templates.

<!-- OVERRIDABLE: .markos-local/MIR/Core_Strategy/ overrides .agent/markos/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Market_Audiences/ overrides .agent/markos/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Products/ overrides .agent/markos/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Campaigns_Assets/ overrides .agent/markos/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Operations/ overrides .agent/markos/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .markos-local/MSP/ overrides .agent/markos/templates/MSP/ -->
<!-- OVERRIDABLE: .markos-local/config/config.json overrides .agent/markos/templates/config.json -->