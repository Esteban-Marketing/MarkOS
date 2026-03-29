<purpose>
Insert urgent marketing work as a decimal phase (e.g., 2.1) between existing phases without disrupting the roadmap sequence.
</purpose>

<process>

## 1. Parse Arguments

- `{phase}` — Base phase number to insert after (e.g., `2` for `2.1`)
- `{name}` — Name for the new phase

Compute decimal: `INSERT_PHASE="${BASE_PHASE}.1"` (or .2 if .1 exists)

## 2. Validate

- Confirm base phase exists in ROADMAP.md
- Check decimal phase doesn't already exist
- Confirm base phase is complete or in-progress (urgent gap vs. future scope)

## 3. Create Phase Directory

```bash
PADDED=$(printf "%02d" "${INSERT_PHASE//./}")
SLUG=$(echo "${PHASE_NAME}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
mkdir -p ".planning/phases/${INSERT_PHASE}-${SLUG}"
```

## 4. Insert in ROADMAP.md

Add after base phase section:
```markdown
### Phase {INSERT_PHASE}: {name}
**Goal:** [FILL]
**Trigger:** Urgent gap identified after Phase {BASE_PHASE}

- [ ] Planned
- [ ] Executed
- [ ] Verified
```

## 5. Commit and Route

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(roadmap): insert urgent phase ${INSERT_PHASE} — ${PHASE_NAME}"
```

Route to: `/markos-discuss-phase {INSERT_PHASE}`

</process>
