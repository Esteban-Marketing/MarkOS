---
name: markos-new-project
description: Initialize a new marketing project: MIR scaffolding, MSP activation, and planning files
---

# markos-new-project

<context>
This is the initialization command for the MarkOS (MARKOS) protocol.
</context>

<execution_context>
@.agent/markos/workflows/new-project.md
</execution_context>

<process>
Execute the `/markos-new-project` workflow exactly as documented in the workflow file.
Rely on the workflow for specific logic regarding discovery, MIR scaffolding, and file generation.
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

## Template Paths

This skill reads from and scaffolds the following template directories:

| Template | Path | Overridable via .markos-local/ |
|----------|------|-------------------------------|
| MIR Core Strategy | `.agent/markos/templates/MIR/Core_Strategy/` | `.markos-local/MIR/Core_Strategy/` |
| MIR Market & Audiences | `.agent/markos/templates/MIR/Market_Audiences/` | `.markos-local/MIR/Market_Audiences/` |
| MIR Products | `.agent/markos/templates/MIR/Products/` | `.markos-local/MIR/Products/` |
| MIR Campaigns & Assets | `.agent/markos/templates/MIR/Campaigns_Assets/` | `.markos-local/MIR/Campaigns_Assets/` |
| MIR Operations | `.agent/markos/templates/MIR/Operations/` | `.markos-local/MIR/Operations/` |
| MSP Disciplines | `.agent/markos/templates/MSP/<discipline>/` | `.markos-local/MSP/<discipline>/` |
| Project config | `.agent/markos/templates/config.json` | `.markos-local/config/config.json` |

<!-- OVERRIDABLE: .markos-local/MIR/Core_Strategy/ overrides .agent/markos/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Market_Audiences/ overrides .agent/markos/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Products/ overrides .agent/markos/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Campaigns_Assets/ overrides .agent/markos/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Operations/ overrides .agent/markos/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .markos-local/MSP/ overrides .agent/markos/templates/MSP/ -->
<!-- OVERRIDABLE: .markos-local/config/config.json overrides .agent/markos/templates/config.json -->

## What Gets Created
- MIR/ — Marketing Intelligence Repository templates
- MSP/ — Marketing Strategy Pipeline templates
- .markos-local/ — Client override space
- `RESEARCH/` — 6 intelligence files auto-populated by markos-researcher

## Auto-Generation Sequence

After the `.markos-local/` scaffold step completes, the following steps are executed:

### Create RESEARCH/ directory at project root
```bash
mkdir -p RESEARCH
```

### Check for onboarding seed
```bash
SEED_EXISTS=$(test -f onboarding-seed.json && echo "true" || echo "false")
```

### Trigger markos-researcher in correct sequence
For each RESEARCH file in this EXACT order (later files need earlier context):
1. `RESEARCH/ORG-PROFILE.md` — identity foundation
2. `RESEARCH/PRODUCT-RESEARCH.md` — what we're marketing
3. `RESEARCH/AUDIENCE-RESEARCH.md` — who we're talking to
4. `RESEARCH/MARKET-TRENDS.md` — environment context
5. `RESEARCH/COMPETITIVE-INTEL.md` — competitor analysis
6. `RESEARCH/CONTENT-AUDIT.md` — content inventory

Copy the template for each file first:
```bash
cp ".agent/markos/templates/RESEARCH/{FILENAME}" "RESEARCH/{FILENAME}"
```

Then invoke `markos-researcher` (as a subagent Task) with:
- Target file: `RESEARCH/{FILENAME}`
- Seed data: relevant section from `onboarding-seed.json` (or prompt user for 5 seed questions)
- Context: all previously populated RESEARCH files

Emit progress for each file:
```
◆ Generating RESEARCH/ORG-PROFILE.md... [1/6]
```

### Completion Output
Ensure the "Project Ready" summary output contains:
```
✓ RESEARCH/ — 6 intelligence files (audience, org, product, competitive, market, content)
```

## Step N: Launch Client Intelligence Onboarding

After the project scaffold is created, offer to launch the onboarding form:

Ask the user: "Launch the MARKOS web onboarding form to collect client intelligence? (Recommended — powers your entire RESEARCH/, MIR/, and MSP/ with tailored data)"
Options:
- "Launch form (recommended)" → run onboarding server + open browser
- "Skip — I'll fill in manually" → skip to completion

If "Launch form":
```bash
node "onboarding/backend/server.cjs"
```
Wait for server to complete (it auto-shuts down after submission).
Then trigger `markos-onboarder` to process the seed file.

If "Skip":
Notify: "You can run `node onboarding/backend/server.cjs` at any time to generate your intelligence seed."
