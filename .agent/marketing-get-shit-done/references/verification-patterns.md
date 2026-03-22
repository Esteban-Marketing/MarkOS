# Verification Patterns — Marketing Deliverable Verification

How MGSD verifies marketing work is complete and correct.

## Verification Dimensions

### 1. MIR Completeness
Verify all referenced MIR files have content (no `[FILL]` placeholders in used fields).

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit
```

### 2. Template Variable Resolution
All `{{VARIABLE}}` tokens in MSP matrices and campaign docs must resolve to populated MIR data.

Check pattern:
```bash
grep -r '{{[A-Z_]*}}' .agent/marketing-get-shit-done/templates/MSP/
```

Any unresolved variables = verification failure.

### 3. KPI Baseline Validation
Before campaign launch, verify baseline KPIs exist in `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`:
- CAC baseline documented
- CPL target set
- ROAS target set (if applicable)
- Conversion rate baseline documented

### 4. Tracking Verification
Verify tracking infrastructure before launch:
- [ ] PostHog events defined in TRACKING.md
- [ ] UTM parameters generated (by AG-T04)
- [ ] CAPI parameters configured (if applicable)
- [ ] Conversion events mapped to funnel stages

### 5. Creative Compliance
Verify creative assets match brand guidelines:
- [ ] Colors match BRAND-IDENTITY.md hex values
- [ ] Typography matches font specifications
- [ ] Voice/tone matches VOICE-TONE.md rules
- [ ] No prohibited words used (from VOICE-TONE.md)
- [ ] Logo placement follows VISUAL-GUIDELINES.md

### 6. Budget Alignment
Verify campaign budget fits within allocation:
- [ ] Campaign budget ≤ discipline allocation in BUDGET-ALLOCATION.md
- [ ] Monthly pacing calculated
- [ ] Kill conditions defined

### 7. Linear Sync
Verify all campaign tasks are synced to Linear:
- [ ] Campaign ticket created with `[MGSD]` prefix
- [ ] Sub-tasks match campaign checklist items
- [ ] Status reflects current execution state

## Verification Report Format

```markdown
---
phase: "{N}"
status: passed | gaps_found | human_needed
verified: {date}
---

# Phase {N}: {Name} — Verification Report

## Goal Verification
**Phase Goal:** {from ROADMAP.md}
**Result:** {achieved | partially | not achieved}

## Dimension Checks

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | MIR Completeness | ✓ | Gate 1 GREEN, Gate 2 GREEN |
| 2 | Variable Resolution | ✓ | 0 unresolved tokens |
| 3 | KPI Baselines | ✓ | CAC=$X, CPL=$Y documented |
| 4 | Tracking | ⚠ | CAPI not configured |
| 5 | Creative | ✓ | All assets brand-compliant |
| 6 | Budget | ✓ | Within allocation |
| 7 | Linear Sync | ✓ | 12/12 tickets synced |

## Human Verification Items
{Items requiring manual platform checks}

## Gaps
{Any verification failures with remediation steps}
```
