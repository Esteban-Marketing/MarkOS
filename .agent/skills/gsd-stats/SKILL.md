---
name: gsd-stats
description: Display project statistics — phases, plans, requirements, git metrics, and timeline
---

<objective>
Display comprehensive project statistics including phase progress, plan execution metrics, requirements completion, git history stats, and project timeline.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/stats.md
</execution_context>

<process>
Execute the stats workflow from @.agent/get-shit-done/workflows/stats.md end-to-end.
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
