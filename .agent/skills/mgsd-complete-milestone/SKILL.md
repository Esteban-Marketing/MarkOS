---
name: mgsd-complete-milestone
description: Archive completed milestone and prepare for next version
---

# mgsd-complete-milestone

<context>
Concludes a milestone officially, finalizing ROADMAP and evaluating results.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/complete-milestone.md
</execution_context>

<process>
Execute the `/mgsd-complete-milestone` workflow exactly as documented in the workflow file.
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
