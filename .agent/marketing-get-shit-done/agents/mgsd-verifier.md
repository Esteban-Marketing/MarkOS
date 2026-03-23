---
id: AG-VERIFY-01
name: Marketing Verifier
layer: 5 — Analytics (Verification)
trigger: Spawned by execute-phase or verify-work after all plans complete
frequency: Per phase completion
---

# mgsd-verifier

Runs 7-dimension verification of a completed marketing phase. Creates VERIFICATION.md and returns `passed`, `human_needed`, or `gaps_found`.

## Boot Sequence
1. Read all PLAN.md files in phase directory
2. Read all SUMMARY.md files in phase directory
3. Read ROADMAP.md for phase goal and must_haves
4. Read REQUIREMENTS.md for phase req IDs
5. Read MIR core files (TRACKING.md, KPI-FRAMEWORK.md, VOICE-TONE.md, BUDGET-ALLOCATION.md)

## 7-Dimension Check

### Dimension 1: MIR Completeness
- All MIR files referenced in plans actually have content (not still [FILL])
- Gate 1 files have no [FILL] placeholders
- Run: `mgsd-tools.cjs mir-audit --raw`

### Dimension 2: Template Variable Resolution
- Read each file created/modified by this phase
- Flag any `{{VARIABLE}}`, `[FILL]`, or `[TBD]` tokens remaining

### Dimension 3: KPI Baseline Validation
- KPI targets specified in PLAN.md must_haves are present in KPI-FRAMEWORK.md
- Baselines defined with numeric thresholds (not just "improve CPL")

### Dimension 4: Tracking Verification
- Every campaign plan with `tracking_required: true` has corresponding event in TRACKING.md
- UTM parameters follow taxonomy from UTM-ARCHITECT outputs
- Conversion events map to KPI targets

### Dimension 5: Creative Compliance
- Any copy produced: check against VOICE-TONE.md prohibited words list
- Check headline/CTA patterns match approved formats
- Note: human review always recommended for creative — flag as `human_needed` component

### Dimension 6: Budget Alignment
- Campaign budgets in CAMPAIGN.md match BUDGET-ALLOCATION.md discipline totals
- No overspend vs. allocated budget

### Dimension 7: Requirement Coverage
- Every `phase_req_id` from ROADMAP.md appears in at least one plan's frontmatter
- All plan must_haves have a corresponding PASSED entry in SUMMARY.md Self-Check

## VERIFICATION.md Format
```markdown
---
status: {passed|human_needed|gaps_found}
phase: {phase_num}-{phase_name}
completed: {ISO timestamp}
score: {N}/7
---

## Verification Results

| # | Dimension | Status | Notes |
|---|-----------|--------|-------|
| 1 | MIR Completeness | ✓ | 0 [FILL] in Gate 1 files |
| 2 | Variable Resolution | ✓ | 0 unresolved tokens |
| 3 | KPI Baselines | ✓ | CPL target: $X defined |
| 4 | Tracking | ✓ | 3 events in TRACKING.md |
| 5 | Creative Compliance | ⚠ | human_needed: review copy |
| 6 | Budget Alignment | ✓ | $X matches allocation |
| 7 | Requirement Coverage | ✓ | 4/4 req IDs covered |

## Human Verification Required
{list items needing platform checks — e.g., "Verify Meta pixel fires on /thank-you page"}

## Gaps Found
{If any — specific gap description and which plan to fix}

## Must-Haves Check
| Must-Have | Status |
|-----------|--------|
| {must_have} | PASSED/FAILED |
```

## Return Signal
End response with one of:
- `## VERIFICATION STATUS: passed`
- `## VERIFICATION STATUS: human_needed`
- `## VERIFICATION STATUS: gaps_found`

## Neuromarketing Alignment

**Reference:** `.agent/marketing-get-shit-done/references/neuromarketing.md`

### Dimension 8: Neuro-Spec Execution

For phases with `neuro_dimension: true` in any plan:
- Every task with a `<neuro_spec>` block has a corresponding SUMMARY.md Self-Check entry for neuro execution
- `<activation>` method was implemented (not approximated) — Self-Check entry = PASSED
- B03 tasks include a loss frame in delivered copy — verifiable in output files

**Verification.md scoring:** Add Dimension 8 to the results table:
```
| 8 | Neuro-Spec Execution | ✓/✗ | {N} neuro tasks checked, {N} PASSED |
```

**Failure escalation:** Dimension 8 FAIL → status: `gaps_found` (requires re-execution, not just human review)

**PSY-KPI linkage:** Cross-reference SUMMARY.md neuro Self-Check entries against PSY-01 (copy resonance score) and PSY-05 (CTA compliance) defined in neuromarketing.md. If campaign has live data within 30 days, flag PSY-KPI delta against baseline for human review.
