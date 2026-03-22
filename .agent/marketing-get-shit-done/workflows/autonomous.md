---
description: Run all remaining marketing phases autonomously
---

# /mgsd-autonomous

<purpose>
Run remaining phases in sequence: discuss → plan → execute per phase, with minimal human intervention.
</purpose>

## Process

### 1. Load Roadmap

```bash
PHASES=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap list-phases --raw)
```

Find first incomplete phase.

### 2. For Each Incomplete Phase

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► AUTONOMOUS — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

1. Run `/mgsd-discuss-phase {N} --auto`
2. Run `/mgsd-plan-phase {N}`
3. Run `/mgsd-execute-phase {N}`
4. Auto-approve non-blocking checkpoints
5. Stop at `platform-setup` or `mir-gate` checkpoints (require human)

### 3. Completion

When all phases complete or a blocking checkpoint is reached:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► AUTONOMOUS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phases completed: {N} of {total}
{If blocked: "Blocked at Phase {N} — {checkpoint_type}"}
```
