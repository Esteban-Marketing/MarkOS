---
token_id: MGSD-REF-OPS-13
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-IDX-000    # MGSD-INDEX.md — master registry
  - MGSD-REF-OPS-14 # git-planning-commit.md — planning-specific commit rules
downstream:
  - MGSD-AGT-EXE-01  # mgsd-executor.md — agent issuing git commits after execution
  - MGSD-REF-OPS-05  # planning-config.md — commit_docs flag controls auto-commit behavior
mir_gate_required: false
---

# Git Integration — Commit Conventions for MGSD

<!-- TOKEN: MGSD-REF-OPS-13 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the `mktg` commit prefix convention, commit message format, and branch naming rules for all MGSD-generated git operations. Agents must follow this spec when issuing commits. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-IDX-000 | MGSD-INDEX.md | Entry point — indexes this document |
| MGSD-REF-OPS-14 | git-planning-commit.md | Supplemental rules for planning document commits |
| MGSD-REF-OPS-05 | planning-config.md | commit_docs config flag referenced here |
| MGSD-AGT-EXE-01 | agents/mgsd-executor.md | Primary agent issuing MGSD commits |

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
