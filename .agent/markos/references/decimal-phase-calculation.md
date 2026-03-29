---
token_id: MARKOS-REF-OPS-11
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
downstream:
  - MARKOS-REF-OPS-12  # phase-argument-parsing.md — parsers handle X.Y format
  - MARKOS-AGT-STR-02  # markos-planner.md — planner inserts decimal phases
  - MARKOS-AGT-EXE-01  # markos-executor.md — executor routes decimal phase execution
mir_gate_required: false
---

# Decimal Phase Calculation for MARKOS

<!-- TOKEN: MARKOS-REF-OPS-11 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the X.Y decimal phase naming syntax, when to use it, and how to calculate the decimal suffix. Decimal phases close verification gaps without renumbering existing roadmap items. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-12 | phase-argument-parsing.md | Argument parser that recognizes X.Y format |
| MARKOS-AGT-STR-02 | agents/markos-planner.md | Planner agent that creates decimal phases |
| MARKOS-REF-OPS-01 | mir-gates.md | MIR gates that may trigger decimal phase creation |

Decimal phases (X.Y) are used to close gaps identified during verification without disrupting the main roadmap sequence.

## When to Use Decimal Phases

| Trigger | Action |
|---------|--------|
| VERIFICATION.md returns `gaps_found` | Insert {N}.1 gap-closure phase |
| Urgent campaign issue mid-milestone | Insert decimal after current phase |
| Creative revision needed post-launch | Insert decimal phase for creative fixes |
| Tracking gap discovered post-launch | Insert decimal phase for tracking fixes |

## Naming Convention

```
{base_phase}.{sequence}

Examples:
2.1  — First gap-closure after Phase 2
2.2  — Second gap-closure after Phase 2
3.1  — Urgent insert after Phase 3
```

## Directory Naming

```
.planning/phases/{base_phase}{decimal_part}-{slug}/

Examples:
.planning/phases/021-tracking-gap-closure/
.planning/phases/022-creative-revision/
```

## ROADMAP.md Placement

Insert immediately after the base phase section:
```markdown
### Phase 2: Paid Acquisition Setup
...
[x] Planned | [x] Executed | [ ] Verified

### Phase 2.1: Tracking Gap Closure
**Goal:** Fix attribution windows on lead form events
**Trigger:** Verification gap found in Phase 2, Dimension 4 (Tracking)
...
```

## Gap Plan Marker

Plans created for gap closure use `gap_closure: true` in frontmatter:
```yaml
gap_closure: true
parent_phase: 2
verification_gap: "Dimension 4 — PostHog event missing property campaign_id"
```

## Parent Phase UAT Closure

When a decimal phase completes, automatically resolve the parent phase's HUMAN-UAT.md entries that the decimal phase addressed. See `close_parent_artifacts` step in execute-phase.md.
