# Git Integration — Commit Conventions for MGSD

## Commit Prefix Convention

All MGSD commits use the `mktg` scope prefix:

| Prefix | When |
|--------|------|
| `mktg(mir):` | MIR file updates |
| `mktg(msp):` | MSP discipline plan updates |
| `mktg(campaign):` | Campaign creation, updates, optimization |
| `mktg(phase-N):` | Phase-level planning docs |
| `mktg(linear):` | Linear sync operations |
| `docs(mgsd):` | MGSD protocol documentation |
| `feat(mgsd):` | New MGSD features or agents |
| `fix(mgsd):` | MGSD bug fixes |

## Examples

```
mktg(mir): update VOICE-TONE.md with prohibited words list
mktg(msp): activate SEO discipline with Q1 targets
mktg(campaign): draft Meta retargeting campaign brief
mktg(phase-3): complete market research phase
mktg(linear): sync 12 campaign tasks to Linear
docs(mgsd): add verification patterns reference
feat(mgsd): deploy budget pacing monitor agent
```

## Planning Doc Commits

Use the `mgsd-tools commit` command for planning docs:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-1): plan marketing research" --files .planning/phases/01-market-research/01-PLAN.md
```

This respects `commit_docs` config and `.gitignore` rules.

## Parallel Execution

When multiple agents commit simultaneously, use `--no-verify`:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(campaign): draft brief" --files path/to/file --no-verify
```

Post-wave hook validation runs once after all parallel agents complete.
