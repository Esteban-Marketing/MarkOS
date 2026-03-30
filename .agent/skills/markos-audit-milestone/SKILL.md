---
name: markos-audit-milestone
description: Audit milestone completion against KPIs and original intent before archiving
---

# markos-audit-milestone

<context>
Checks all phases for VERIFICATION.md, reviews KPI achievement vs targets, measures MIR improvement, and surfaces open campaigns before closing the milestone.
</context>

<execution_context>
@.agent/markos/workflows/audit-milestone.md
</execution_context>

<process>
Execute the `/markos-audit-milestone` workflow as documented.
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
