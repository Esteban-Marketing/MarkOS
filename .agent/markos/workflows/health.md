---
description: Diagnose planning directory health and optionally repair issues
---

# /mgsd-health

<purpose>
Check structural integrity of the MGSD project setup.
</purpose>

## Process

### 1. Check Structure

| Check | Status |
|-------|--------|
| `.planning/` exists | [✓/✗] |
| `PROJECT.md` exists | [✓/✗] |
| `ROADMAP.md` exists | [✓/✗] |
| `STATE.md` exists | [✓/✗] |
| `config.json` exists | [✓/✗] |
| `config.json` valid JSON | [✓/✗] |
| `.agent/marketing-get-shit-done/` exists | [✓/✗] |
| MIR templates present | [✓/✗] |
| MSP templates present | [✓/✗] |
| Agent roster present | [✓/✗] |
| Git repository | [✓/✗] |

### 2. Check Phase Integrity

For each phase directory:
- Has at least 1 plan file
- Plan files have valid frontmatter
- Summaries match plan files
- No orphaned summaries

### 3. Display Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► HEALTH CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Structure:  ✓ All planning files present
Phases:     ✓ 3 phases, 7 plans, 4 summaries
Config:     ✓ Valid JSON, balanced profile
MIR:        ⚠ 40 files with gaps
MSP:        ✓ 4 disciplines activated
Git:        ✓ Clean working tree

Overall: HEALTHY (with MIR gaps)
```

### 4. Repair (if requested)

Offer to fix common issues:
- Missing config.json → create from template
- Missing STATE.md → create from template
- Invalid config.json → attempt parse recovery
