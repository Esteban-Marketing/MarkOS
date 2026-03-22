# Git Planning Commits for MGSD

## When to Commit Planning Documents

Controlled by `commit_docs` config key (default: `true`).

```bash
COMMIT_DOCS=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-get commit_docs 2>/dev/null || echo "true")
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
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg({scope}): {description}" --files {files}
```

If `--files` omitted: commits all staged changes.

## When NOT to Commit

- Between tasks within a single plan execution (executor commits per task)
- When orchestrator is just reading files (no writes = no commit)
- When `commit_docs` is `false` in config
