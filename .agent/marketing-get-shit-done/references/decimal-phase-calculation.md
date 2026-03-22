# Decimal Phase Calculation for MGSD

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
