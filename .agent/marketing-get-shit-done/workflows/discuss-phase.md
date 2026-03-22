---
description: Gather marketing phase context through adaptive questioning before planning
---

# /mgsd-discuss-phase

<purpose>
Gather context for a marketing phase before planning. Uses adaptive questioning to understand campaign objectives, audience, budget, channels, and creative direction. Produces CONTEXT.md.
</purpose>

## Arguments

- `{phase}` — Phase number (required)
- `--auto` — Skip interactive questions, use recommended defaults

## Process

### 1. Load Context

```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init plan-phase {phase} --raw)
```

Read:
- ROADMAP.md for phase goal
- Previous phase summaries for context
- MIR status (gate check)

### 2. Display Phase Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► DISCOVERY — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Adaptive Questioning

@-reference `.agent/marketing-get-shit-done/references/questioning.md`

If `--auto`:
- Read MIR files for answers
- Use ROADMAP.md phase goal as objective
- Use MIR AUDIENCES.md for audience
- Default budget from BUDGET-ALLOCATION.md
- Skip interactive questions

If interactive, gather:

**Objective** — "What should this phase accomplish?"
**Audience** — "Who are we targeting? Which ICP segment?"
**Channels** — "Which channels should we focus on?"
**Budget** — "What's the budget for this phase?"
**Creative** — "Any creative direction or constraints?"
**Timeline** — "When does this need to launch?"
**Dependencies** — "What must be true before this starts?"

### 4. Create CONTEXT.md

Write to `.planning/phases/{phase-dir}/{NN}-CONTEXT.md` using `templates/context.md`:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" find-phase {phase}
```

Populate template with gathered context.

### 5. Commit

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-{N}): discuss phase context"
```

### 6. Next Up

```
▶ Next Up

**Plan Phase {N}** — Create execution plan

`/mgsd-plan-phase {N}`
```

<success_criteria>
- CONTEXT.md created with populated fields
- Client brief, audience, budget, and creative direction documented
- User confirmed scope before proceeding
</success_criteria>
