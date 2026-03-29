<purpose>
Validate marketing phase deliverables through agent-driven 7-dimension verification. Spawns markos-verifier, persists human-testing items as UAT.md, and routes to gap closure if dimensions fail.
</purpose>

<required_reading>
@.agent/markos/references/verification-patterns.md
@.agent/markos/references/mir-gates.md
</required_reading>

<available_agent_types>
- markos-verifier — Runs 7-dimension check, creates VERIFICATION.md
- markos-gap-auditor — MIR [FILL] placeholder scan
</available_agent_types>

<process>

## 1. Initialize

```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" init execute-phase "${PHASE}" --raw)
PHASE_DIR=$(echo "$INIT" | jq -r '.phase_dir')
PHASE_NAME=$(echo "$INIT" | jq -r '.phase_name')
```

**If phase not found:** Error — run `/markos-execute-phase {N}` first.

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► VERIFYING — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 2. Pre-Flight Checks

```bash
# Check all plans have SUMMARY.md
MISSING_SUMMARIES=$(find "${PHASE_DIR}" -name "*-PLAN.md" | while read plan; do
  summary="${plan/PLAN/SUMMARY}"; test -f "$summary" || echo "$plan"
done)
```

If missing summaries: "Plans without SUMMARY.md — execute these first: {list}"

Check MIR gates:
```bash
MIR_STATUS=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit --raw)
```

Display: `Gate 1: {status} | Gate 2: {status}`

## 3. Spawn markos-verifier

```
Task(
  prompt="
<verification_context>
Phase: {phase_number}: {phase_name}
Phase goal: {from ROADMAP.md}
Phase requirements: {phase_req_ids}

<files_to_read>
- {phase_dir}/*-PLAN.md (Plans)
- {phase_dir}/*-SUMMARY.md (Execution summaries)
- {roadmap_path} (Phase goal)
- {requirements_path} (Requirements)
- .planning/PROJECT.md (Project context)
- .planning/config.json (Active disciplines)
</files_to_read>
</verification_context>

<verification_dimensions>
Run all 7 dimensions from .agent/markos/references/verification-patterns.md:

1. MIR Completeness — Do plans reference MIR files correctly? Are Gate 1 files populated?
2. Template Variable Resolution — Any unresolved {{VARIABLE}} tokens in deliverables?
3. KPI Baseline Validation — Are KPI targets defined with measurable thresholds?
4. Tracking Verification — Do tracking tasks match TRACKING.md event definitions?
5. Creative Compliance — Does copy align with VOICE-TONE.md rules?
6. Budget Alignment — Do campaign budgets match BUDGET-ALLOCATION.md?
7. Requirement Coverage — Is every phase_req_id covered by a plan?
</verification_dimensions>

<output>
Write VERIFICATION.md to {phase_dir}/{padded_phase}-VERIFICATION.md.
Return one of:
- passed — all 7 dimensions pass
- human_needed — automated checks pass, platform verification needed
- gaps_found — {N} dimensions failed with specific gaps listed
</output>
  ",
  subagent_type="markos-verifier",
  model="{verifier_model}",
  description="Verify Phase {phase}"
)
```

## 4. Display Results

```
VERIFICATION RESULTS — Phase {N}: {Name}
──────────────────────────────────────────────────────

| # | Dimension | Status | Notes |
|---|-----------|--------|-------|
| 1 | MIR Completeness | {✓/✗/⚠} | {notes} |
| 2 | Variable Resolution | {✓/✗/⚠} | |
| 3 | KPI Baselines | {✓/✗/⚠} | |
| 4 | Tracking | {✓/✗/⚠} | |
| 5 | Creative Compliance | {✓/✗/⚠} | |
| 6 | Budget Alignment | {✓/✗/⚠} | |
| 7 | Requirement Coverage | {✓/✗/⚠} | |

Overall: {PASSED ✓ | PASSED WITH WARNINGS ⚠ | GAPS FOUND ✗ | HUMAN NEEDED 👤}
```

## 5. Route by Status

### If `passed`

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(phase-${PHASE}): verification passed"
```

Display Next Up.

### If `human_needed`

Persist human verification items as UAT.md:
```markdown
---
status: partial
phase: {phase_num}-{phase_name}
started: {ISO timestamp}
---

## Pending Human Verification

### {N}. {item description}
expected: {expected}
platform: {where to check — e.g. "Meta Ads Manager → Campaign → Tracking"}
result: [pending]

## Summary
pending: {count}
passed: 0
```

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(phase-${PHASE}): persist human UAT items"
```

Present to user:
```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Human Verification Required                     ║
╚══════════════════════════════════════════════════════════════╝

All automated checks passed. {N} items need platform verification:

{list items with platform steps}

Items saved to {phase_num}-HUMAN-UAT.md — surfaces in /markos-progress until cleared.

→ Type "verified" when complete, or describe any issues found.
```

On "verified" → proceed to update ROADMAP as passed.
On issues → treat as `gaps_found`.

### If `gaps_found`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► GAPS FOUND — Phase {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{M}/{7} dimensions failed.

### What's Missing
{gap summaries from VERIFICATION.md}

## ▶ Next Up

/markos-plan-phase {N} --gaps

Also: cat {phase_dir}/{padded_phase}-VERIFICATION.md — full report
```

## 6. Commit and Next Up

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(phase-${PHASE}): verification report" --files "${PHASE_DIR}/{padded_phase}-VERIFICATION.md"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► PHASE {N} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/markos-progress — see updated roadmap
/markos-discuss-phase {next} — start next phase
/markos-campaign-launch — pre-flight for any ready campaigns
/markos-performance-review — review active campaign metrics
```

</process>

<success_criteria>
- [ ] All plans have SUMMARY.md before verification starts
- [ ] MIR gate status displayed
- [ ] markos-verifier spawned with phase context
- [ ] VERIFICATION.md created with all 7 dimensions
- [ ] Human UAT items persisted if status is human_needed
- [ ] Gap closure path offered if gaps_found
- [ ] Verification committed
</success_criteria>
