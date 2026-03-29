---
token_id: MARKOS-REF-OPS-03
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-01 # mir-gates.md — gates verified against these patterns
downstream:
  - MARKOS-AGT-EXE-02  # markos-verifier.md — primary consumer
  - MARKOS-SKL-VER-01  # markos-verify-work/SKILL.md — entry point skill
mir_gate_required: false
---

# Verification Patterns — Marketing Deliverable Verification

<!-- TOKEN: MARKOS-REF-OPS-03 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the 7-dimension framework used by markos-verifier.md to evaluate completed marketing phases. All verification agents load this file before producing VERIFICATION.md. -->

How MARKOS verifies marketing work is complete and correct.

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-01 | mir-gates.md | MIR gate statuses checked in Dimension 1 |
| MARKOS-AGT-EXE-02 | agents/markos-verifier.md | Agent that executes these patterns |
| MARKOS-REF-CNT-01 | ui-brand.md | Verification report formatting standards |

## Verification Dimensions

### 1. MIR Completeness
Verify all referenced MIR files have content (no `[FILL]` placeholders in used fields).

```bash
node ".agent/markos/bin/markos-tools.cjs" mir-audit
```

### 2. Template Variable Resolution
All `{{VARIABLE}}` tokens in MSP matrices and campaign docs must resolve to populated MIR data.

Check pattern:
```bash
grep -r '{{[A-Z_]*}}' .agent/markos/templates/MSP/
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
- [ ] Campaign ticket created with `[MARKOS]` prefix
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

## Hybrid Team Tracking
**AI-Owned Tasks Executed:** {Count}
**Human-Owned Tasks Executed:** {Count}
**Estimated Human Hours Saved:** {Hours} (Assuming 1.5h per AI Task)
**Human Hand-off Contexts:** {e.g. creative approval, strategic context, budget limits}

## Human Verification Items
{Items requiring manual platform checks}

## Gaps
{Any verification failures with remediation steps}
```
