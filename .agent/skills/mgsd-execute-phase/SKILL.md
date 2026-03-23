---
name: mgsd-execute-phase
description: Execute all plans in a marketing phase with wave-based parallelization
---

# mgsd-execute-phase

<context>
Executes the generated plans for a marketing phase.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/execute-phase.md
</execution_context>

<process>
Execute the `/mgsd-execute-phase` workflow exactly as documented in the workflow file.
</process>

## Template Paths

This skill operates within the MGSD structure. It honors overrides placed in the client .mgsd-local/ directory before falling back to the default .agent/marketing-get-shit-done/ templates.
