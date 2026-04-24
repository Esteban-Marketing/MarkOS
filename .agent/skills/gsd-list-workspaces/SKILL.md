<!-- TODO: workflow file .agent/get-shit-done/workflows/list-workspaces.md not yet ported from upstream GSD; skill will fail to resolve execution_context until ported. -->
---
name: gsd-list-workspaces
description: List active GSD workspaces and their status
---

<objective>
Scan `~/gsd-workspaces/` for workspace directories containing `WORKSPACE.md` manifests. Display a summary table with name, path, repo count, strategy, and GSD project status.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/list-workspaces.md
@.agent/get-shit-done/references/ui-brand.md
</execution_context>

<process>
Execute the list-workspaces workflow from @.agent/get-shit-done/workflows/list-workspaces.md end-to-end.
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
