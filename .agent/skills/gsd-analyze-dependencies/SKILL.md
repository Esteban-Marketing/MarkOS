<!-- UPSTREAM-MISSING: no workflow file exists for this skill in upstream GSD release. Execution_context will not resolve until workflow authored locally or upstream. -->
---
name: gsd-analyze-dependencies
description: Analyze phase dependencies and suggest Depends on entries for ROADMAP.md
---

<objective>
Analyze the phase dependency graph for the current milestone. For each phase pair, determine if there is a dependency relationship based on:
- File overlap (phases that modify the same files must be ordered)
- Semantic dependencies (a phase that uses an API built by another phase)
- Data flow (a phase that consumes output from another phase)

Then suggest `Depends on` updates to ROADMAP.md.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/analyze-dependencies.md
@.agent/get-shit-done/references/ui-brand.md
</execution_context>

<context>
No arguments required. Requires an active milestone with ROADMAP.md.

Run this command BEFORE `/gsd-manager` to fill in missing `Depends on` fields and prevent merge conflicts from unordered parallel execution.
</context>

<process>
Execute the analyze-dependencies workflow from @.agent/get-shit-done/workflows/analyze-dependencies.md end-to-end.
Present dependency suggestions clearly and apply confirmed updates to ROADMAP.md.
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
