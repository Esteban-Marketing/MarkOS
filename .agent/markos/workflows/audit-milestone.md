<purpose>
Audit milestone completion against original intent and KPI targets before archiving. Produces an audit report surfacing gaps, partial phases, and open campaigns.
</purpose>

<process>

## 1. Load Milestone Context

```bash
MILESTONE=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap list-phases --raw | jq '.current_milestone')
PHASES=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap list-phases --raw)
```

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► MILESTONE AUDIT — {milestone_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 2. Phase Completion Audit

For each phase in milestone, check:
- [ ] Phase marked `[x]` in ROADMAP.md
- [ ] VERIFICATION.md exists (all 7 dimensions)
- [ ] No `status: partial` HUMAN-UAT.md outstanding
- [ ] All PLAN.md files have corresponding SUMMARY.md

Report:
```
| Phase | Name | Plans | Verified | UAT | Status |
|-------|------|-------|---------|-----|--------|
| 1 | {name} | 3/3 | ✓ | ✓ | COMPLETE |
| 2 | {name} | 2/3 | ✓ | ⚠ partial | PARTIAL |
```

## 3. KPI Achievement Audit

Read STRATEGIC-GOALS.md and KPI-FRAMEWORK.md. For each milestone KPI target:

```
| KPI | Target | Achieved | Gap |
|-----|--------|---------|-----|
| CPL | $X | $Y | {+/-Z%} |
| Leads | N | M | {delta} |
```

## 4. MIR Evolution Check

Did this milestone improve MIR coverage?
```bash
MIR_GAPS=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit --raw | jq '.total_fills')
```
Compare to milestone start baseline (from STATE.md).

## 5. Open Items Audit

- Active campaigns not closed or handed off
- Budget remaining vs. plan
- Disciplines activated but not executed
- Backlog items created during milestone

## 6. Generate Audit Report

Write `.planning/milestones/{milestone_id}-AUDIT.md`:

```markdown
# Milestone Audit — {milestone_name}
**Audited:** {date}

## Phase Completion: {N}/{total} complete
## KPI Achievement: {summary}
## MIR Progress: {start gaps} → {end gaps} ([FILL] resolved)
## Open Items: {list}
## Recommendation: READY TO ARCHIVE | GAPS REQUIRE CLOSURE
```

## 7. Route

If gaps found → list remediation steps, offer to create gap phases.
If clean → display: `/mgsd-complete-milestone` to proceed.

</process>

<success_criteria>
- [ ] All phases audited for completion
- [ ] KPI achievement vs targets tallied
- [ ] MIR coverage delta measured
- [ ] Open campaigns surfaced
- [ ] Audit report written and committed
- [ ] Clear recommendation displayed
</success_criteria>
