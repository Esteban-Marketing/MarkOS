---
description: Check marketing project progress, MIR gates, active campaigns, and route to next action
---

# /markos-progress

<purpose>
Display marketing project status: MIR gate health, active campaigns, phase progress, and recommended next action.
</purpose>

## Process

### 1. Load State

```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" init execute-phase --raw)
PHASES=$(node ".agent/markos/bin/markos-tools.cjs" roadmap list-phases --raw)
MIR=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit --raw)
```

### 2. Display Dashboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► PROJECT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gate 1 (Identity): {✓ GREEN / ✗ RED}
Gate 2 (Execution): {✓ GREEN / ✗ RED}

Progress: [████████░░] {percent}%

| Phase | Name | Status |
|-------|------|--------|
{phase_table}

Active Campaigns: {count}
MIR Gaps: {total_fills} [FILL] placeholders
```

### 3. Route to Next Action

Determine the next recommended action based on current state:

- No PROJECT.md → `/markos-new-project`
- Phase has no plans → `/markos-plan-phase {N}`
- Phase has plans, not executed → `/markos-execute-phase {N}`
- Phase executed, not verified → `/markos-verify-work {N}`
- All phases complete → `/markos-complete-milestone`
- MIR gates RED → Display gap list

### 4. Display Next Up

```
▶ Next Up

**{Action}** — {description}

`{command}`
```
