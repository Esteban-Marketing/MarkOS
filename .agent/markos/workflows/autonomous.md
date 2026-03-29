---
description: Run all remaining marketing phases autonomously
---

# /markos-autonomous

<purpose>
Run remaining phases in sequence: discuss → plan → execute per phase, with minimal human intervention.
</purpose>

## Process

### 1. Load Roadmap

```bash
PHASES=$(node ".agent/markos/bin/markos-tools.cjs" roadmap list-phases --raw)
```

Find first incomplete phase.

### 2. For Each Incomplete Phase

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► AUTONOMOUS — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

1. Run `/markos-discuss-phase {N} --auto`
2. Run `/markos-plan-phase {N}`
3. Run `/markos-execute-phase {N}`
4. Auto-approve non-blocking checkpoints
5. Stop at `platform-setup` or `mir-gate` checkpoints (require human)

### 3. Completion

When all phases complete or a blocking checkpoint is reached:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► AUTONOMOUS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phases completed: {N} of {total}
{If blocked: "Blocked at Phase {N} — {checkpoint_type}"}
```
