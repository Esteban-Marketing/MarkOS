---
name: mgsd-discipline-activate
description: Activate or deactivate an MSP discipline with documented rationale
---

# mgsd-discipline-activate

<context>
Updates the ON/OFF state of marketing disciplines (Ads, SEO, Social, Email, etc).
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/discipline-activate.md
</execution_context>

<process>
Execute the `/mgsd-discipline-activate` workflow exactly as documented in the workflow file.
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
