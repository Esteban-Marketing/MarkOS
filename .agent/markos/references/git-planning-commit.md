---
token_id: MARKOS-REF-OPS-14
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-13 # git-integration.md — general commit conventions
  - MARKOS-REF-OPS-05 # planning-config.md — commit_docs flag governs this behavior
downstream:
  - MARKOS-AGT-STR-02  # markos-planner.md — planner commits PLAN.md files
  - MARKOS-AGT-EXE-01  # markos-executor.md — executor commits phase artifacts
mir_gate_required: false
---

# Git Planning Commits for MARKOS

<!-- TOKEN: MARKOS-REF-OPS-14 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines when and how agents commit planning documents (.planning/ files) to git. Controlled by commit_docs config flag. Specifies commit message format for planning artifacts distinct from code commits. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-13 | git-integration.md | General commit conventions this extends |
| MARKOS-REF-OPS-05 | planning-config.md | commit_docs key that governs this behavior |
| MARKOS-AGT-STR-02 | agents/markos-planner.md | Planner agent committing PLAN.md artifacts |

## When to Commit Planning Documents

Controlled by `commit_docs` config key (default: `true`).

```bash
COMMIT_DOCS=$(node ".agent/markos/bin/markos-tools.cjs" config-get commit_docs 2>/dev/null || echo "true")
```

If `commit_docs` is `false`: skip all planning document commits (useful for noisy repos).

## Commit Format for Planning Documents

```
mktg({scope}): {description}

Scopes:
  init         — project initialization
  phase-{N}    — phase-specific planning docs
  roadmap      — ROADMAP.md changes
  milestone    — milestone archive/start
  mir          — MIR file updates
  msp          — MSP file updates
  cleanup      — archive/housekeeping
  pause        — session pause state
  linear       — Linear sync operations
```

## Planning Commit Examples

```
mktg(init): initialize marketing project — MIR scaffolded, disciplines activated
mktg(phase-1): discuss phase context — campaign brief locked
mktg(phase-1): market research complete
mktg(phase-1): planning complete — 3 plans in 2 waves
mktg(phase-1): verification passed — 7/7 dimensions
mktg(roadmap): add Phase 4 — influencer pilot
mktg(milestone): close v1.0 → start v1.1
mktg(mir): update AUDIENCES.md with Q1 ICP research
mktg(pause): save context at phase-2 task-3
```

## Planning Commit CLI

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg({scope}): {description}" --files {files}
```

If `--files` omitted: commits all staged changes.

## When NOT to Commit

- Between tasks within a single plan execution (executor commits per task)
- When orchestrator is just reading files (no writes = no commit)
- When `commit_docs` is `false` in config
