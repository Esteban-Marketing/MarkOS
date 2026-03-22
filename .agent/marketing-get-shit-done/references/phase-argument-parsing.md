# Phase Argument Parsing — MGSD Phase Routing

How workflows parse phase arguments from user commands.

## Input Formats

| Input | Parsed as | Matches |
|-------|----------|---------|
| `1` | `01` | `01-template-restructuring/` |
| `01` | `01` | `01-template-restructuring/` |
| `3` | `03` | `03-marketing-matrix-expansion/` |
| `2.1` | `02.1` | `02.1-inserted-phase/` |
| `custom-id` | `custom-id` | `custom-id-name/` |

## Roadmap Path Support

Phases can be specified with a roadmap override:

```
/mgsd-plan-phase 1 mgsd\.planning\ROADMAP.md
```

Parsing:
1. First arg → phase number (`1`)
2. Second arg → roadmap path (`mgsd\.planning\ROADMAP.md`)
3. If roadmap path provided, read phase info from that file instead of `.planning/ROADMAP.md`

## Resolution Order

1. Parse numeric portion from input
2. Normalize: pad to 2 digits, uppercase letter suffix
3. Search `.planning/phases/` for directory starting with normalized value
4. If not found, search archived milestones (newest first)
5. Return match with plan/summary counts

## Error Cases

- Phase not found → display available phases with `roadmap list-phases`
- Multiple matches → return first match (lowest numbered)
- Phase directory exists but no plans → return `has_plans: false`
