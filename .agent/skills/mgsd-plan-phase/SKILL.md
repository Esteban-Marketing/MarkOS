---
name: mgsd-plan-phase
description: Create detailed phase plans (PLAN.md) with researcher → planner → checker agent chain and MIR gate verification
---

# mgsd-plan-phase

<context>
Orchestrates a 3-agent chain (market researcher → marketing planner → plan checker) with a revision loop to produce deep, concrete PLAN.md files for a marketing phase. Includes MIR gate check, brief express path, and auto-advance to execute.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/plan-phase.md
</execution_context>

<process>
Execute the `/mgsd-plan-phase` workflow exactly as documented in the workflow file.
Arguments: phase number (e.g., `1` or `2.1`), optional flags: `--research`, `--skip-research`, `--gaps`, `--brief <file>`, `--auto`.
</process>

## Template Paths

This skill operates within the MGSD structure. It honors overrides placed in the client .mgsd-local/ directory before falling back to the default .agent/marketing-get-shit-done/ templates.
