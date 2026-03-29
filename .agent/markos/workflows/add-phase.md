---
description: Add a new marketing phase to the end of the current milestone roadmap
---

# /markos-add-phase

<purpose>
Append a new phase to the current milestone in ROADMAP.md.
</purpose>

## Arguments

- `{name}` — Phase name (required)
- `{goal}` — Phase goal (optional, gathered interactively)

## Process

1. Read ROADMAP.md, find highest phase number in current milestone
2. Create new phase heading: `### Phase {N+1}: {name}`
3. Add goal, requirement refs, and checkboxes
4. Create phase directory: `.planning/phases/{NN}-{slug}/`
5. Commit

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(roadmap): add phase {N+1} — {name}"
```
