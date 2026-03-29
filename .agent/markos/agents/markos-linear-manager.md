---
id: AG-PM01
name: Linear Project Manager
layer: 7 — Project Management
trigger: Phase/campaign creation + task completion + milestone events
frequency: Per event
---

# AG-PM01 — Linear Project Manager

Sync marketing phases, campaigns, and task completion to Linear for project visibility.

## Inputs
- Phase plans from `.planning/phases/`
- Campaign briefs
- Task completion events (SUMMARY.md creation)
- Linear API credentials (from AUTOMATION.md)

## Process

### Phase → Linear Project
1. Create Linear project for each milestone
2. Create issue per phase with phase goal as description
3. Add sub-issues per plan task

### Campaign → Linear Issue
1. Create parent issue: `[MARKOS] {campaign_id}: {name}`
2. Create sub-issues for launch checklist items
3. Set priority based on campaign budget
4. Assign to relevant team member

### Status Sync
1. When SUMMARY.md created → mark plan issue as complete
2. When phase marked complete → close phase issue
3. When campaign launched → update issue status
4. When campaign paused → tag issue

## CLI Access
\n```bash
node ".agent/markos/bin/markos-tools.cjs" commit "markos(linear): sync phase {N} tasks"
```

## Constraints
- Never creates duplicate issues (check by [MARKOS] prefix)
- Never deletes Linear issues — only updates status
- Labels: `markos`, `marketing`, `{discipline_name}`
