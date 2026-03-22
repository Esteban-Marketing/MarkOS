---
name: mgsd-new-project
description: Initialize a new marketing project with MIR and MSP templates.
---

<context>
**Flags:**
- `--auto` — Automatic mode. 
</context>

<objective>
Initialize a new marketing project by organizing the strategy inside the `.planning` folder, tailored with marketing parameters and integrating the Linear tracking logic.
This initializes the Master Strategy.
</objective>

<execution_context>
@.agent/marketing-get-shit-done/templates/MIR
@.agent/marketing-get-shit-done/templates/MSP
</execution_context>

<process>
Execute the new-project workflow logically as done in GSD, but apply it to the Marketing Intelligence parameters.
1. Parse goals and define what the brand wants to build.
2. Initialize PROJECT.md prioritizing standard marketing metrics and channels.
3. Configure config.json with agentic execution settings.
</process>
