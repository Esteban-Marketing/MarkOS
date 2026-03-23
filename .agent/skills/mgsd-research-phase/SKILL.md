---
name: mgsd-research-phase
description: Standalone market research for a phase — competitor campaigns, audience signals, benchmarks, tracking requirements
---

# mgsd-research-phase

<context>
Spawns mgsd-market-researcher to produce RESEARCH.md for the specified phase. Use before /mgsd-plan-phase when deeper channel or competitive research is needed.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/research-phase.md
</execution_context>

<process>
Execute the `/mgsd-research-phase` workflow exactly as documented in the workflow file.
</process>

## Template Paths

This skill operates within the MGSD structure. It honors overrides placed in the client .mgsd-local/ directory before falling back to the default .agent/marketing-get-shit-done/ templates.
