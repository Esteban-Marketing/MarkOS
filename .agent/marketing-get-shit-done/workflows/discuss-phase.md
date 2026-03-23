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

**[NEUROMARKETING — required for any external-audience phase]**

**Archetype** — "Which of these best describes the ICP's self-image when they're winning?
  1. Hero (drives to achieve mastery, fears inadequacy)
  2. Sage (seeks truth, fears ignorance)
  3. Outlaw (disrupts, fears powerlessness)
  4. Caregiver (serves others, fears selfishness)
  5. Creator (builds originals, fears mediocrity)
  6. Ruler (demands control, fears chaos)"

**Pain State** — "Describe the worst moment this ICP experiences that your product prevents. Be visceral — what does it feel like physically? (elevated heart rate? pit in the stomach?)"

**Primary Trigger** — "What emotion should a first-time ad viewer feel in the first 3 seconds?
  Cortisol spike (fear/stress) | Dopamine pull (curiosity/reward) | Oxytocin (belonging/safety) | Loss activation (something slipping away)"

If `--auto`: infer archetype from AUDIENCES.md, pain state from MESSAGING-FRAMEWORK.md problem section, trigger from funnel stage (awareness → cortisol; decision → loss activation).

### 3.5. Neuro Profile Summary

After questioning, display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► NEURO PROFILE — Phase {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Archetype: {archetype}
Primary Trigger: {B0N — trigger name}
System 1 target emotion: {emotion}
Pain state: "{first 10 words of pain state...}"

→ NEURO-BRIEF.md will scaffold from this profile.
```

Ask user: "Generate NEURO-BRIEF.md for this phase? (y/n)"

If yes: copy `.agent/marketing-get-shit-done/templates/NEURO-BRIEF.md` to `{phase_dir}/{padded_phase}-NEURO-BRIEF.md` and pre-fill: `ics_archetype`, `funnel_stage`, `primary_trigger` from answers above. All other fields remain [FILL] for planner to complete.

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
