---
name: markos-insert-phase
description: Insert urgent work as decimal phase (e.g., 2.1) between existing phases
---

# markos-insert-phase

<context>
Adds a decimal phase to the roadmap between existing phases for urgent gap closure or unplanned work without disrupting the main sequence.
</context>

<execution_context>
@.agent/markos/workflows/insert-phase.md
</execution_context>

<process>
Execute the `/markos-insert-phase` workflow as documented.
Arguments: base phase number, phase name.
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
