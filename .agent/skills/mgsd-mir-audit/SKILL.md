---
name: mgsd-mir-audit
description: Run MIR completeness audit across all domains
---

# mgsd-mir-audit

<context>
Audits the Marketing Intelligence Repository (MIR) files for [FILL] placeholders and Gate status.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/mir-audit.md
</execution_context>

<process>
Execute the `/mgsd-mir-audit` workflow exactly as documented in the workflow file.
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
