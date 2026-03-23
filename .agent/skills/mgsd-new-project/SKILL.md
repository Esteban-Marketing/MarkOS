---
name: mgsd-new-project
description: Initialize a new marketing project: MIR scaffolding, MSP activation, and planning files
---

# mgsd-new-project

<context>
This is the initialization command for the Marketing Get Shit Done (MGSD) protocol.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/new-project.md
</execution_context>

<process>
Execute the `/mgsd-new-project` workflow exactly as documented in the workflow file.
Rely on the workflow for specific logic regarding discovery, MIR scaffolding, and file generation.
</process>

## Template Paths

This skill reads from and scaffolds the following template directories:

| Template | Path | Overridable via .mgsd-local/ |
|----------|------|-------------------------------|
| MIR Core Strategy | `.agent/marketing-get-shit-done/templates/MIR/Core_Strategy/` | `.mgsd-local/MIR/Core_Strategy/` |
| MIR Market & Audiences | `.agent/marketing-get-shit-done/templates/MIR/Market_Audiences/` | `.mgsd-local/MIR/Market_Audiences/` |
| MIR Products | `.agent/marketing-get-shit-done/templates/MIR/Products/` | `.mgsd-local/MIR/Products/` |
| MIR Campaigns & Assets | `.agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/` | `.mgsd-local/MIR/Campaigns_Assets/` |
| MIR Operations | `.agent/marketing-get-shit-done/templates/MIR/Operations/` | `.mgsd-local/MIR/Operations/` |
| MSP Disciplines | `.agent/marketing-get-shit-done/templates/MSP/<discipline>/` | `.mgsd-local/MSP/<discipline>/` |
| Project config | `.agent/marketing-get-shit-done/templates/config.json` | `.mgsd-local/config/config.json` |

<!-- OVERRIDABLE: .agent/marketing-get-shit-done/templates/MIR/ -->
<!-- OVERRIDABLE: .agent/marketing-get-shit-done/templates/MSP/ -->
