---
name: markos-performance-review
description: Campaign performance analysis and optimization recommendations
---

# markos-performance-review

<context>
Reviews the metrics and targets for active marketing campaigns and triggers optimizations or budget reallocation.
</context>

<execution_context>
@.agent/markos/workflows/performance-review.md
</execution_context>

<process>
Execute the `/markos-performance-review` workflow exactly as documented in the workflow file.
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
