---
name: mgsd-remove-phase
description: Remove a future phase from the marketing roadmap with human confirmation
---

# mgsd-remove-phase

<context>
Safely removes a not-yet-started phase from ROADMAP.md. Requires human confirmation. Moves any phase content to .planning/backlog/ instead of deleting.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/remove-phase.md
</execution_context>

<process>
Execute the `/mgsd-remove-phase` workflow as documented.
Arguments: phase number.
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
