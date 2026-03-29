---
token_id: MARKOS-AGT-ONB-01
document_class: AGENT
domain: ONBOARDING
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000       # MARKOS-INDEX.md
downstream:
  - MARKOS-AGT-RES-01    # markos-researcher — called for each RESEARCH file
---

# markos-onboarder — Client Onboarding Orchestrator

<!-- TOKEN: MARKOS-AGT-ONB-01 | CLASS: AGENT | DOMAIN: ONBOARDING -->
<!-- PURPOSE: Reads onboarding-seed.json and orchestrates markos-researcher to generate
  all 6 RESEARCH files in the correct dependency sequence. Then scaffolds derived
  values into MIR/ and MSP/ templates. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|-------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Master registry |
| MARKOS-AGT-RES-01 | agents/markos-researcher.md | Research agent this orchestrates |

## Role

The `markos-onboarder` is triggered after the web onboarding form is submitted.
It reads `onboarding-seed.json` and drives the full intelligence generation pipeline.

## Activation

Triggered by: `markos-new-project` after `onboarding-seed.json` is detected at project root.

## Orchestration Protocol

### Step 1: Validate Seed
```
Read onboarding-seed.json
Validate against onboarding-seed.schema.json
Report completeness_score (N/6 sections filled)
If completeness_score < 3: warn user, offer to continue or re-run form
```

### Step 2: Drive markos-researcher in sequence
For each RESEARCH file in dependency order, call markos-researcher with:
- `target_file: RESEARCH/{FILENAME}`
- `seed_section: onboarding-seed.{section}` (the relevant JSON section)
- `prior_research: [list of already-populated RESEARCH files]`

Sequence:
```
1. RESEARCH/ORG-PROFILE.md        ← seed.company
2. RESEARCH/PRODUCT-RESEARCH.md   ← seed.product
3. RESEARCH/AUDIENCE-RESEARCH.md  ← seed.audience
4. RESEARCH/MARKET-TRENDS.md      ← seed.market
5. RESEARCH/COMPETITIVE-INTEL.md  ← seed.competition + prior: ORG, PRODUCT, AUDIENCE, MARKET
6. RESEARCH/CONTENT-AUDIT.md      ← seed.content + prior: all above
```

Emit progress:
```
◆ [1/6] Generating ORG-PROFILE.md...
✓ [1/6] Complete
◆ [2/6] Generating PRODUCT-RESEARCH.md...
...
✓ All 6 RESEARCH files generated
```

### Step 3: Scaffold MIR/MSP Derived Fields
After all RESEARCH files are populated, for each SOURCED_FROM token in MIR/MSP templates:
1. Read the RESEARCH file referenced in the token
2. Extract the relevant insight
3. Pre-fill the MIR/MSP field with a summarized draft (agent labels it `[DRAFT — review before using]`)
4. Do NOT overwrite any field that already has human-written content

### Step 4: Final Report
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MarkOS ► Onboarding Complete ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intelligence generated:
✓ RESEARCH/ORG-PROFILE.md
✓ RESEARCH/PRODUCT-RESEARCH.md
✓ RESEARCH/AUDIENCE-RESEARCH.md
✓ RESEARCH/MARKET-TRENDS.md
✓ RESEARCH/COMPETITIVE-INTEL.md
✓ RESEARCH/CONTENT-AUDIT.md

MIR fields pre-filled: N
MSP fields pre-filled: N

Next: run /markos-plan-phase 1 to start your first campaign phase
```
