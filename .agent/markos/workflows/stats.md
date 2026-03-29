---
description: Display marketing project statistics
---

# /mgsd-stats

<purpose>
Show comprehensive project statistics: phases, plans, campaigns, MIR coverage, and timeline.
</purpose>

## Process

```bash
PHASES=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap list-phases --raw)
MIR=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit --raw)
```

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► PROJECT STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── Phases ─────────────────────────────────────────────
  Total:     {count}
  Complete:  {complete_count}
  Planned:   {planned_count}
  Pending:   {pending_count}

── Plans ──────────────────────────────────────────────
  Total plans:     {plan_count}
  Executed:        {summary_count}
  Completion:      {percent}%

── MIR Coverage ───────────────────────────────────────
  Files with gaps: {gap_count}
  [FILL] tokens:   {fill_count}
  Gate 1:          {gate1_status}
  Gate 2:          {gate2_status}

── Disciplines ────────────────────────────────────────
  Active:   {active_count}
  Inactive: {inactive_count}
  Future:   {future_count}

── Git ────────────────────────────────────────────────
  Commits:  {commit_count}
  Branch:   {current_branch}
  Last:     {last_commit_date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
