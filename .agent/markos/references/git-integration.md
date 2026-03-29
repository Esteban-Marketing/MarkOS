---
token_id: MARKOS-REF-OPS-13
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-14 # git-planning-commit.md — planning-specific commit rules
downstream:
  - MARKOS-AGT-EXE-01  # markos-executor.md — agent issuing git commits after execution
  - MARKOS-REF-OPS-05  # planning-config.md — commit_docs flag controls auto-commit behavior
mir_gate_required: false
---

# Git Integration — Commit Conventions for MARKOS

<!-- TOKEN: MARKOS-REF-OPS-13 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the `mktg` commit prefix convention, commit message format, and branch naming rules for all MARKOS-generated git operations. Agents must follow this spec when issuing commits. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-14 | git-planning-commit.md | Supplemental rules for planning document commits |
| MARKOS-REF-OPS-05 | planning-config.md | commit_docs config flag referenced here |
| MARKOS-AGT-EXE-01 | agents/markos-executor.md | Primary agent issuing MARKOS commits |

## Commit Prefix Convention

All MARKOS commits use the `mktg` scope prefix:

| Prefix | When |
|--------|------|
| `mktg(mir):` | MIR file updates |
| `mktg(msp):` | MSP discipline plan updates |
| `mktg(campaign):` | Campaign creation, updates, optimization |
| `mktg(phase-N):` | Phase-level planning docs |
| `mktg(linear):` | Linear sync operations |
| `docs(markos):` | MARKOS protocol documentation |
| `feat(markos):` | New MARKOS features or agents |
| `fix(markos):` | MARKOS bug fixes |

## Examples

```
mktg(mir): update VOICE-TONE.md with prohibited words list
mktg(msp): activate SEO discipline with Q1 targets
mktg(campaign): draft Meta retargeting campaign brief
mktg(phase-3): complete market research phase
mktg(linear): sync 12 campaign tasks to Linear
docs(markos): add verification patterns reference
feat(markos): deploy budget pacing monitor agent
```

## Planning Doc Commits

Use the `markos-tools commit` command for planning docs:

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(phase-1): plan marketing research" --files .planning/phases/01-market-research/01-PLAN.md
```

This respects `commit_docs` config and `.gitignore` rules.

## Parallel Execution

When multiple agents commit simultaneously, use `--no-verify`:

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(campaign): draft brief" --files path/to/file --no-verify
```

Post-wave hook validation runs once after all parallel agents complete.
