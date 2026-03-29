---
token_id: MARKOS-REF-OPS-12
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-11 # decimal-phase-calculation.md — X.Y format handled here
downstream:
  - MARKOS-AGT-EXE-01  # markos-executor.md — applies parsed phase argument at execution
  - MARKOS-AGT-STR-02  # markos-planner.md — planner receives parsed phase target
mir_gate_required: false
---

# Phase Argument Parsing — MARKOS Phase Routing

<!-- TOKEN: MARKOS-REF-OPS-12 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Specifies how MARKOS workflow commands accept and parse phase number arguments (integer, decimal X.Y, or omitted). Defines fallback behavior when no phase argument is provided. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-11 | decimal-phase-calculation.md | Decimal X.Y phase format parsed by this spec |
| MARKOS-AGT-EXE-01 | agents/markos-executor.md | Agent consuming the parsed phase target |
| MARKOS-AGT-STR-02 | agents/markos-planner.md | Planner consuming the parsed phase target |

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
/markos-plan-phase 1 markos\.planning\ROADMAP.md
```

Parsing:
1. First arg → phase number (`1`)
2. Second arg → roadmap path (`markos\.planning\ROADMAP.md`)
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
