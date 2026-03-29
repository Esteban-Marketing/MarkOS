<purpose>
Archive accumulated phase directories from completed milestones to keep .planning/phases/ clean and focused on current work.
</purpose>

<process>

## 1. Find Archivable Phases

```bash
# Find phases marked complete in ROADMAP.md
COMPLETED=$(grep -oP '### Phase \K\d+(?=.*\[x\])' .planning/ROADMAP.md 2>/dev/null)
VERSION=$(node ".agent/markos/bin/markos-tools.cjs" config-get project.version 2>/dev/null || echo "1.0")
```

Display archivable phases:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► CLEANUP — Archive Completed Phases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Archivable phases: {list}
Target: .planning/milestones/v{VERSION}-phases/

→ Proceed? (y/n)
```

## 2. Archive

```bash
mkdir -p ".planning/milestones/v${VERSION}-phases"
for PHASE_NUM in $COMPLETED; do
  PHASE_DIR=$(find .planning/phases -maxdepth 1 -name "${PHASE_NUM}-*" -o -name "0${PHASE_NUM}-*" 2>/dev/null | head -1)
  [ -d "$PHASE_DIR" ] && mv "$PHASE_DIR" ".planning/milestones/v${VERSION}-phases/"
done
```

## 3. Commit

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "markos(cleanup): archive completed phases to milestone v${VERSION}"
```

Display:
```
✓ Archived {N} phase directories
.planning/phases/ now contains only current/future phases
```

</process>
