<purpose>
Remove a future (not-yet-started) marketing phase from the roadmap and renumber subsequent phases if needed.
</purpose>

<process>

## 1. Validate

```bash
PHASE_INFO=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap get-phase "${PHASE}" --raw)
```

- Confirm phase is marked `[ ] Planned` (not started)
- Warn if phase has a directory with content

## 2. Confirm Removal

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Phase Removal                                   ║
╚══════════════════════════════════════════════════════════════╝

Removing Phase {N}: {name}
Goal: {goal}

This will permanently remove this phase from the roadmap.
Subsequent phases will NOT be renumbered (decimal phases preserved).

→ Type "confirm" or "cancel"
```

## 3. Remove

On "confirm":
1. Remove phase section from ROADMAP.md
2. Remove phase directory if empty:
   ```bash
   rmdir ".planning/phases/${padded_phase}-${slug}" 2>/dev/null
   ```
3. If directory has content → move to `.planning/backlog/` instead of deleting

## 4. Commit

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(roadmap): remove Phase ${PHASE} — ${PHASE_NAME}"
```

</process>
