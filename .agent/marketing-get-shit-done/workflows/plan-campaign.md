---
description: Generate a campaign PLAN.md from MIR context and the selected MSP matrix
---

# /mgsd-plan-campaign

<purpose>
Generate a detailed, executable campaign plan (PLAN.md) by pulling from the client MIR knowledge base and the relevant MSP matrix. Runs pre-campaign-check hook first. Delegates to mgsd-strategist → mgsd-planner chain. Produces a neuromarketing-annotated PLAN.md that mgsd-execute-phase can consume directly.
</purpose>

<core_principle>
A campaign plan is not a list of intentions. It is a list of exact actions with concrete values, tracked against MIR files, with neuro_spec blocks on every copy task. The plan-checker runs before the human sees the plan.
</core_principle>

<process>

<step name="initialize">
```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init plan-campaign "${CAMPAIGN_ARG}" --raw)
```

Parse JSON for: `campaign_id`, `phase_number`, `phase_dir`, `msp_matrix`, `mir_gate1`, `mir_gate2`, `discipline`.

**Arguments:**
- `--discipline {slug}` — which MSP matrix to use (paid_acquisition / seo_organic / lifecycle_email / content_social / affiliate_influencer / community_events / outbound / inbound / social)
- `--phase {N}` — which phase directory to write plan into
- `--campaign-id {id}` — optional, links plan to existing CAMPAIGN.md
</step>

<step name="gate_check">
Run pre-campaign-check hook (MGSD-HKP-OPS-01):

```bash
GATE_STATUS=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit --raw)
```

**gate1.ready: false** → HARD BLOCK. Display which files are missing. Stop.
**gate2.ready: false AND discipline requires launch** → warn. Allow planning, block execute.
**Both GREEN** → proceed.
</step>

<step name="research_check">
Check if a RESEARCH.md exists for this phase:

```bash
RESEARCH=$(test -f "{phase_dir}/RESEARCH.md" && echo "found" || echo "missing")
```

**If RESEARCH.md missing:**
```
No RESEARCH.md found for Phase {N}.

Options:
  1) Run /mgsd-research-phase {N} first (recommended for new campaigns)
  2) Skip research — plan from MIR + MSP only
  3) Provide context now (I'll ask questions)

Type 1, 2, or 3:
```

**Human decides.** If option 3: use `mgsd-discuss-phase` questioning to gather context inline.
</step>

<step name="load_context">
Spawn `mgsd-context-loader` to compile campaign context:

```
Task(
  subagent_type="mgsd-context-loader",
  prompt="
  Load full campaign planning context for Phase {phase_number}.

  Read:
  - .planning/PROJECT.md
  - .planning/STATE.md
  - .planning/ROADMAP.md
  - {msp_matrix_path} (MSP matrix for {discipline})
  - Core_Strategy/01_COMPANY/PROFILE.md
  - Core_Strategy/02_BRAND/VOICE-TONE.md
  - Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md
  - Market_Audiences/03_MARKET/AUDIENCES.md
  - Products/04_PRODUCTS/CATALOG.md
  - {phase_dir}/RESEARCH.md (if exists)
  - {campaign_id}.md (if provided)

  Output: structured CONTEXT.md in {phase_dir}/CONTEXT.md
  "
)
```

Human checkpoint: **review CONTEXT.md before planning begins.**
Show context summary and ask: "Does this accurately reflect the campaign goals?"
Human types "confirmed" or provides corrections.
</step>

<step name="spawn_strategist">
Spawn `mgsd-strategist` to define campaign architecture:

```
Task(
  subagent_type="mgsd-strategist",
  prompt="
  Design campaign architecture for Phase {phase_number}: {phase_name}

  Read:
  - {phase_dir}/CONTEXT.md (locked decisions)
  - {msp_matrix_path} (MSP matrix)
  - references/neuromarketing.md (trigger catalog)
  - references/mir-gates.md (gate enforcement)

  Produce:
  - MSP matrix sections to execute (list which checkbox groups)
  - Neuromarketing trigger assignment per campaign segment
  - Wave grouping recommendation for the planner
  - Discipline-specific constraints

  Output: {phase_dir}/STRATEGY-BRIEF.md
  "
)
```
</step>

<step name="spawn_planner">
Spawn `mgsd-planner` to produce PLAN.md files:

```
Task(
  subagent_type="mgsd-planner",
  prompt="
  Create PLAN.md for Phase {phase_number}: {phase_name}

  Read:
  - {phase_dir}/CONTEXT.md
  - {phase_dir}/STRATEGY-BRIEF.md
  - {phase_dir}/RESEARCH.md (if exists)
  - references/neuromarketing.md
  - {msp_matrix_path}

  Rules:
  - Every copy task must have <neuro_spec> block
  - Every task must have concrete values — no abstract descriptions
  - requires_human_approval: true for all creative and budget tasks
  - tracking_required: true for all paid and conversion tasks
  "
)
```
</step>

<step name="plan_checker">
Run `mgsd-plan-checker` against produced PLAN.md:

```
Task(
  subagent_type="mgsd-plan-checker",
  prompt="
  Validate PLAN.md in {phase_dir} against schema in templates/LINEAR-TASKS/_SCHEMA.md.
  Check: task concreteness, neuro_spec completeness, MIR file references, acceptance criteria verifiability.
  Return: PASSED | WARNINGS | REWRITE REQUIRED
  "
)
```

**If REWRITE REQUIRED:** Return plan to planner with checker feedback. Replan.
**If WARNINGS:** Show to human — human decides to proceed or address warnings first.
**If PASSED:** Continue.
</step>

<step name="human_review">
Present plan summary to human:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CAMPAIGN PLAN READY — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Discipline: {discipline}
Plans: {N} | Waves: {M}
Requires human approval: {count} tasks
Neuro specs: {count} / {total copy tasks}
Plan checker: {PASSED | WARNINGS}

Human review required before execution:
  → /mgsd-execute-phase {N} to begin execution
  → /mgsd-verify-campaign {N} to validate after completion
```

**Human must explicitly run `/mgsd-execute-phase {N}` — plan does not auto-execute.**
</step>

</process>

<success_criteria>
- [ ] Pre-campaign-check hook passed (or override documented)
- [ ] CONTEXT.md created and human-confirmed
- [ ] STRATEGY-BRIEF.md created by strategist
- [ ] PLAN.md created by planner with neuro_spec blocks on copy tasks
- [ ] plan-checker returns PASSED or WARNINGS reviewed by human
- [ ] Human sees plan summary and next command
</success_criteria>
