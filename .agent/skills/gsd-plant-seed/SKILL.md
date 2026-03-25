---
name: gsd-plant-seed
description: Capture a forward-looking idea with trigger conditions — surfaces automatically at the right milestone
---


<objective>
Capture an idea that's too big for now but should surface automatically when the right
milestone arrives. Seeds solve context rot: instead of a one-liner in Deferred that nobody
reads, a seed preserves the full WHY, WHEN to surface, and breadcrumbs to details.

Creates: .planning/seeds/SEED-NNN-slug.md
Consumed by: /gsd-new-milestone (scans seeds and presents matches)
</objective>

<execution_context>
@.agent/get-shit-done/workflows/plant-seed.md
</execution_context>

<process>
Execute the plant-seed workflow from @.agent/get-shit-done/workflows/plant-seed.md end-to-end.
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
