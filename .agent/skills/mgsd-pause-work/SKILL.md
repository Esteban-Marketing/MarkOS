---
name: mgsd-pause-work
description: Create context handoff when pausing work mid-phase
---

# mgsd-pause-work

<context>
Pauses the current marketing work and saves state via CONTINUE-HERE.md so execution can be resumed later.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/pause-work.md
</execution_context>

<process>
Execute the `/mgsd-pause-work` workflow exactly as documented in the workflow file.
</process>
