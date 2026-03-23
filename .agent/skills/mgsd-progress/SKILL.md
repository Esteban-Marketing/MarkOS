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
