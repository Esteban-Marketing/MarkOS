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

| Template | Path | Overridable via .mgsd-local/ |
|----------|------|-------------------------------|
| MIR Core Strategy | `.agent/marketing-get-shit-done/templates/MIR/Core_Strategy/` | `.mgsd-local/MIR/Core_Strategy/` |
| MIR Market & Audiences | `.agent/marketing-get-shit-done/templates/MIR/Market_Audiences/` | `.mgsd-local/MIR/Market_Audiences/` |
| MIR Products | `.agent/marketing-get-shit-done/templates/MIR/Products/` | `.mgsd-local/MIR/Products/` |
| MIR Campaigns & Assets | `.agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/` | `.mgsd-local/MIR/Campaigns_Assets/` |
| MIR Operations | `.agent/marketing-get-shit-done/templates/MIR/Operations/` | `.mgsd-local/MIR/Operations/` |
| MSP Disciplines | `.agent/marketing-get-shit-done/templates/MSP/<discipline>/` | `.mgsd-local/MSP/<discipline>/` |
| Project config | `.agent/marketing-get-shit-done/templates/config.json` | `.mgsd-local/config/config.json` |

<!-- OVERRIDABLE: .mgsd-local/MIR/Core_Strategy/ overrides .agent/marketing-get-shit-done/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Market_Audiences/ overrides .agent/marketing-get-shit-done/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Products/ overrides .agent/marketing-get-shit-done/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Campaigns_Assets/ overrides .agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Operations/ overrides .agent/marketing-get-shit-done/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .mgsd-local/MSP/ overrides .agent/marketing-get-shit-done/templates/MSP/ -->
<!-- OVERRIDABLE: .mgsd-local/config/config.json overrides .agent/marketing-get-shit-done/templates/config.json -->

## What Gets Created
- MIR/ — Marketing Intelligence Repository templates
- MSP/ — Marketing Strategy Pipeline templates
- .mgsd-local/ — Client override space
- `RESEARCH/` — 6 intelligence files auto-populated by mgsd-researcher

## Auto-Generation Sequence

After the `.mgsd-local/` scaffold step completes, the following steps are executed:

### Create RESEARCH/ directory at project root
```bash
mkdir -p RESEARCH
```

### Check for onboarding seed
```bash
SEED_EXISTS=$(test -f onboarding-seed.json && echo "true" || echo "false")
```

### Trigger mgsd-researcher in correct sequence
For each RESEARCH file in this EXACT order (later files need earlier context):
1. `RESEARCH/ORG-PROFILE.md` — identity foundation
2. `RESEARCH/PRODUCT-RESEARCH.md` — what we're marketing
3. `RESEARCH/AUDIENCE-RESEARCH.md` — who we're talking to
4. `RESEARCH/MARKET-TRENDS.md` — environment context
5. `RESEARCH/COMPETITIVE-INTEL.md` — competitor analysis
6. `RESEARCH/CONTENT-AUDIT.md` — content inventory

Copy the template for each file first:
```bash
cp ".agent/marketing-get-shit-done/templates/RESEARCH/{FILENAME}" "RESEARCH/{FILENAME}"
```

Then invoke `mgsd-researcher` (as a subagent Task) with:
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

Ask the user: "Launch the MGSD web onboarding form to collect client intelligence? (Recommended — powers your entire RESEARCH/, MIR/, and MSP/ with tailored data)"
Options:
- "Launch form (recommended)" → run onboarding server + open browser
- "Skip — I'll fill in manually" → skip to completion

If "Launch form":
```bash
node "onboarding/backend/server.cjs"
```
Wait for server to complete (it auto-shuts down after submission).
Then trigger `mgsd-onboarder` to process the seed file.

If "Skip":
Notify: "You can run `node onboarding/backend/server.cjs` at any time to generate your intelligence seed."
