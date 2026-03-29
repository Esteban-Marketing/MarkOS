<purpose>
Archive a completed marketing milestone: wrap ROADMAP.md section, archive phase directories, generate milestone performance report, and prepare for the next cycle.
</purpose>

<process>

## 1. Pre-flight Check

Run `/markos-audit-milestone` first. If not clean:
```
⚠ Milestone audit found gaps. Run /markos-audit-milestone to review.

→ 1) Proceed anyway (accept gaps)
  2) Close gaps first
```

If `--force` flag: skip audit check.

## 2. Load Context

```bash
VERSION=$(node ".agent/markos/bin/markos-tools.cjs" config-get project.version 2>/dev/null || echo "1.0")
NEW_VERSION=$(echo "$VERSION" | awk -F. '{printf "%d.%d", $1, $2+1}')
```

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► COMPLETING MILESTONE v{VERSION}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 3. Archive Phase Directories

```bash
mkdir -p ".planning/milestones/v${VERSION}-phases"
# Move completed phase dirs
for dir in .planning/phases/*/; do
  PHASE_NUM=$(basename "$dir" | sed 's/-.*//')
  if grep -q "\[x\].*Phase ${PHASE_NUM}" .planning/ROADMAP.md 2>/dev/null; then
    mv "$dir" ".planning/milestones/v${VERSION}-phases/"
  fi
done
```

## 4. Wrap ROADMAP.md Section

Find current milestone heading in ROADMAP.md. Wrap completed phases in `<details>` block:

```markdown
<details>
<summary>v{VERSION} — {milestone_name} (Completed {date})</summary>

{all completed phase entries}

</details>
```

Add new milestone heading below:
```markdown
## v{NEW_VERSION} — {prompts user for new milestone name}
```

## 5. Generate Milestone Performance Report

Write `.planning/milestones/v{VERSION}-REPORT.md`:

```markdown
# Milestone v{VERSION} — Performance Report
**Period:** {start_date} → {date}

## KPI Summary
{table from audit}

## Phases Completed: {N}
## Campaigns Launched: {count from STATE.md}
## MIR Improvement: {gap delta}
## Key Wins
## Lessons Learned
## Carry Forward to v{NEW_VERSION}
```

## 6. Update State

```bash
node ".agent/markos/bin/markos-tools.cjs" state update --milestone "v${NEW_VERSION}" --status "planning"
node ".agent/markos/bin/markos-tools.cjs" config-set project.version "${NEW_VERSION}"
```

## 7. Run MIR Audit for New Baseline

```bash
node ".agent/markos/bin/markos-tools.cjs" mir-audit
```

## 8. Commit and Next Steps

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "markos(milestone): complete v${VERSION} → start v${NEW_VERSION}"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► MILESTONE v{VERSION} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Archived {N} phases to .planning/milestones/v{VERSION}-phases/
Report: .planning/milestones/v{VERSION}-REPORT.md
New milestone: v{NEW_VERSION}

## ▶ Next Up

/markos-new-milestone — define next cycle phases
/markos-review-backlog — promote backlog items to new milestone
```

</process>

<success_criteria>
- [ ] Audit passed (or force flag)
- [ ] Phase directories archived
- [ ] ROADMAP.md current milestone wrapped in details block
- [ ] New milestone heading added
- [ ] Performance report written
- [ ] STATE.md updated to new milestone
- [ ] MIR audit run for new baseline
- [ ] Committed
</success_criteria>
