<purpose>
Create executable phase plans (PLAN.md files) for a marketing roadmap phase. Default flow: MIR gate check â†’ Research (if needed) â†’ Plan â†’ Verify â†’ Done. Orchestrates markos-market-researcher, markos-planner, and markos-plan-checker agents with a revision loop (max 3 iterations).
</purpose>

<required_reading>
@.agent/markos/references/ui-brand.md
@.agent/markos/references/mir-gates.md
@.agent/markos/references/neuromarketing.md
</required_reading>

<available_agent_types>
Valid MARKOS subagent types (use exact names):
- markos-market-researcher â€” Researches campaign approaches, competitor ads, benchmarks, audience signals
- markos-planner â€” Creates detailed marketing plans from phase scope and context
- markos-plan-checker â€” Reviews plan quality, MIR completeness, tracking specs, before execution
- markos-executor â€” Executes plan tasks, commits, creates SUMMARY.md
- markos-verifier â€” Verifies phase deliverables across 7 dimensions
- markos-campaign-architect â€” Drafts CAMPAIGN.md from MIR+MSP data
- markos-copy-drafter â€” Brand-compliant copy drafting
- markos-creative-brief â€” Structural design briefs
- markos-tracking-spec â€” PostHog/GA event specifications
- markos-utm-architect â€” UTM taxonomy and parameter generation
- markos-gap-auditor â€” Scans MIR for [FILL] placeholders and gate readiness
- markos-librarian â€” Updates STATE.md and CHANGELOG
- markos-context-loader â€” Bootstraps session with MIR/MSP context
</available_agent_types>

<process>

## 1. Initialize

Load all context in one call:

```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" init plan-phase "$PHASE" --raw)
```

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`, `mir_gate1`, `mir_gate2`, `discipline_activation`, `project_valid`.

**File paths:** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path` (null if not exist).

**If `planning_exists` is false:** Error â€” run `/markos-new-project` first.

### 1.5. Prerequisite Enforcement (v1.1 Hardening)

**If `project_valid` is false:**
Error â€” `PROJECT.md` is missing, too short, or contains `[FILL]`.
Planning requires a grounded business identity. Run `/markos-mir-audit` to find identity gaps.

## 2. Parse Arguments

Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--gaps`, `--brief <filepath>`, `--auto`, `--skip-verify`).

**If no phase number:** Detect next unplanned phase from ROADMAP.md.

**If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create directory:
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

## 2.5. Brief Express Path

**Skip if:** No `--brief` flag in arguments.

**If `--brief <filepath>` provided:**

1. Read the brief file:
```bash
BRIEF_CONTENT=$(cat "$BRIEF_FILE" 2>/dev/null)
if [ -z "$BRIEF_CONTENT" ]; then echo "Error: brief file not found: $BRIEF_FILE"; exit 1; fi
```

2. Display banner:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º BRIEF EXPRESS PATH
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Using brief: {BRIEF_FILE}
Generating CONTEXT.md from campaign brief...
```

3. Parse brief and generate CONTEXT.md by extracting: objective, audience, channels, budget, timeline, creative direction, KPI targets, dependencies. Map everything in the brief as locked decisions. Mark anything not covered as agent's discretion.

4. Write CONTEXT.md using the context template, populated with brief data.

5. Commit:
```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(phase-${PHASE}): generate context from brief"
```

6. Set `context_content` to generated CONTEXT.md and continue to step 4 (skip step 3 MIR load variant).

## 3. MIR Gate Check

```bash
MIR_STATUS=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit --raw)
```

Display gate status:
```
Gate 1 (Identity): {âœ“ GREEN / âœ— RED â€” N gaps}
Gate 2 (Execution): {âœ“ GREEN / âœ— RED â€” N gaps}
```

**If Gate 1 is RED:**

Present to user:
```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  CHECKPOINT: MIR Gate 1 Required                             â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Gate 1 (Identity) is RED â€” {N} files need content.
Planning without business identity data produces generic plans.

â†’ 1) Fill MIR gaps first (/markos-mir-audit for list)
  2) Continue anyway (plans will use available data only)
```

**If Gate 2 is RED and this is an execution-phase (channels/campaigns):** Warn but don't block.

**If auto-mode (`--auto`):** Continue regardless of gate status.

## 4. Load CONTEXT.md

**Skip if:** Brief express path used (step 2.5).

Check `context_path` from init JSON.

If exists: `Using phase context from: ${context_path}`

**If CONTEXT.md missing:**

Ask user:
- "Continue without context" â†’ Plan using research + requirements only
- "Run discuss-phase first" â†’ Display: `Run /markos-discuss-phase {X} then re-run /markos-plan-phase {X}` â€” EXIT

## 5. Handle Research

**Skip if:** `--gaps` flag, `--skip-research` flag, or `has_research` is true (no `--research` force flag).

**If RESEARCH.md missing OR `--research` flag:**

**If not `--auto` and no explicit research flag:** Ask user:

```
Research before planning Phase {X}: {phase_name}?

1. Research first (Recommended) â€” Investigate channels, competitor campaigns,
   audience signals, and benchmarks before planning.

2. Skip research â€” Plan from context and MIR only.
   Best for: follow-on phases, known channels, tight timelines.
```

**If `--auto` and `research_enabled` is false:** Skip silently.

**If researching:** Display banner:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º RESEARCHING PHASE {X}
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Spawning market researcher...
```

### Spawn markos-market-researcher

```
Task(
  prompt="
<objective>
Research how to execute Phase {phase_number}: {phase_name}
Answer: 'What do I need to know to PLAN this phase well?'
</objective>

<files_to_read>
- {context_path} (Phase context â€” campaign objectives, audience, budget)
- {requirements_path} (Marketing requirements)
- {state_path} (Project state and decisions)
- .agent/markos/templates/MIR/Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md
- .agent/markos/templates/MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md
</files_to_read>

<research_areas>
- Competitor campaign approaches for this phase goal
- Channel-specific benchmarks (CPL, CTR, ROAS) for target audience
- Audience signal patterns (ICP language, objections, content formats)
- Platform capabilities and limitations relevant to this phase
- Tracking/attribution requirements for this phase's KPIs
</research_areas>

<output>
Write to: {phase_dir}/{padded_phase}-RESEARCH.md

Structure:
## Campaign Landscape
## Audience Intelligence
## Channel Benchmarks
## Recommended Approach
## Tracking Requirements
## Risks and Pitfalls
## Validation Architecture (list of what must be verifiable after execution)
</output>
",
  subagent_type="markos-market-researcher",
  model="{researcher_model}",
  description="Research Phase {phase}"
)
```

Handle return:
- `## RESEARCH COMPLETE` â†’ Continue to step 6
- `## RESEARCH BLOCKED` â†’ Display blocker, offer: Provide context / Skip research / Abort

## 5.5. Create Validation Strategy

**Skip if:** research skipped and no existing RESEARCH.md.

Check if RESEARCH.md has `## Validation Architecture` section. If found:
- Read template: `.agent/markos/templates/VALIDATION.md`
- Write to `{phase_dir}/{padded_phase}-VALIDATION.md`
- Commit if `commit_docs` true

## 6. Check Existing Plans

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**If exists:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.

## 6.5. Mutate Task Checklists (Generative Sequencing)

Display banner:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º TASK SYNTHESIZER (HALLUCINATING MSP MUTATIONS)
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Crossing static MSP with competitor landscape...
```

Spawn `markos-task-synthesizer`:

```
Task(
  prompt="
<objective>
Read the static MSP templates in `.agent/markos/templates/MSP/` for the active phase discipline.
Read `COMPETITIVE-LANDSCAPE.md`.
Instead of relying strictly on the static checklist, generate 2-3 hyper-specific, competitor-exploiting tasks (e.g., if competitor launched a podcast, add a task to launch conquesting ads on their pod keywords).
Where possible, map the execution directly to an external API script by tagging the task `[API-EXECUTE]` instead of `[HUMAN]`.
Append these mutated tasks clearly to the planning context so the downstream Planner includes them.
</objective>
",
  subagent_type="markos-task-synthesizer",
  model="{planner_model}"
)
```

## 7. Spawn markos-planner Agent

Display banner:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º PLANNING PHASE {X}
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Spawning marketing planner...
```

Planner prompt:

```
Task(
  prompt="
<planning_context>
Phase: {phase_number}: {phase_name}
Mode: {standard | gap_closure}

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {requirements_path} (Requirements)
- {context_path} (Campaign context â€” LOCKED DECISIONS)
- {research_path} (Market Research â€” if exists)
- {verification_path} (Verification gaps â€” if --gaps)
- .planning/PROJECT.md (Business identity and scope)
- .planning/config.json (Discipline activation and settings)
</files_to_read>

Phase requirement IDs (every ID MUST appear in a plan's requirements field): {phase_req_ids}
Activated disciplines: {discipline_activation}
</planning_context>

<downstream_consumer>
Output consumed by /markos-execute-phase. Plans need:
- Frontmatter: wave, depends_on, files_modified, autonomous, discipline
- Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY)
- Verification criteria with measurable KPI thresholds
- must_haves for goal-backward verification
</downstream_consumer>

<deep_work_rules>
## Anti-Shallow Execution Rules (MANDATORY for marketing plans)

Every task MUST include these fields:

1. **<read_first>** â€” MIR/MSP files the executor MUST read before working. Always include:
   - The MIR file being referenced or modified
   - VOICE-TONE.md for any copy task
   - TRACKING.md for any campaign or landing page task
   - KPI-FRAMEWORK.md for any performance task

2. **<acceptance_criteria>** â€” Verifiable conditions proving the task was done correctly:
   - NEVER use subjective language ('brand-aligned', 'feels right', 'consistent with voice')
   - ALWAYS include: exact copy strings, UTM parameter values, event names, metric thresholds, file paths
   - Examples:
     - Copy: "Ad headline contains exactly: [HEADLINE TEXT]"
     - Tracking: "PostHog event 'lead_form_submit' fires with properties: {campaign_id, source, medium}"
     - Budget: "Campaign daily budget set to $X; ROAS target = Y in campaign settings"
     - Creative: "Creative dimensions match: 1200x628 for feed, 1080x1920 for stories"

3. **<action>** â€” Must contain CONCRETE values, not references:
   - NEVER say "align copy with brand voice" â€” specify the exact copy
   - NEVER say "set up tracking" â€” specify exact event name, properties, triggers
   - NEVER say "configure the campaign" â€” specify exact targeting, budget, bidding, placements
   - The executor should complete the task from the action text alone

4. **Marketing-specific plan frontmatter:**
   - discipline: {e.g., paid_acquisition, seo_organic, lifecycle_email}
   - campaign_id: {if applicable}
   - mir_files_referenced: [list of MIR files this plan uses]
   - tracking_required: {true/false}
   - requires_human_approval: {true/false â€” for creative and budget decisions}
   - neuro_dimension: {true/false â€” set true when plan targets external audience}

5. **Neuromarketing spec (`<neuro_spec>` block) â€” REQUIRED when `neuro_dimension: true`:**
   Read `.agent/markos/references/neuromarketing.md` before writing any plan targeting an external audience.

   Every task that produces external-facing copy or campaign assets MUST include:
   - `<trigger>B0N â€” trigger name</trigger>`
   - `<archetype>Archetype â€” one-line justification against ICP</archetype>`
   - `<funnel_stage>awareness | consideration | decision | onboarding | retention</funnel_stage>`
   - `<activation_method>concrete copy/UX mechanism â€” no abstract descriptions</activation_method>`
   - `<psy_kpi>KPI name from neuromarketing framework</psy_kpi>`
   - `<failure_mode>how to detect if this trigger fails to activate</failure_mode>`

   **Forbidden without neuro_spec:** any copy, ad creative, email subject, or landing page CTA.

6. **Episodic Memory Retrieval (`<rag_context>` block) â€” REQUIRED:**
   Agents MUST query the Vector Store VectorDB (per `.protocol-lore/MEMORY.md`) for historical success/failure sequences before drafting any plan. You must explicitly state the retrieved memory that influenced your campaign structure.
</deep_work_rules>

<quality_gate>
- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter including discipline
- [ ] Every task has <read_first> with specific MIR files
- [ ] Every task has <acceptance_criteria> with metric-verifiable conditions
- [ ] Every <action> contains concrete values (no vague alignment language)
- [ ] Wave dependencies correctly identified
- [ ] Checkpoint tasks marked autonomous: false for creative/budget decisions
- [ ] must_haves derived from phase goal with measurable thresholds
- [ ] Every plan with neuro_dimension: true has a valid `<neuro_spec>` block per trigger catalog
</quality_gate>
",
  subagent_type="markos-planner",
  model="{planner_model}",
  description="Plan Phase {phase}"
)
```

## 8. Handle Planner Return

- **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` false: skip to step 11. Otherwise: step 9.
- **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation
- **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual

## 9. Spawn markos-plan-checker Agent

Display banner:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º VERIFYING PLANS
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Spawning plan checker...
```

Checker prompt:

```
Task(
  prompt="
<verification_context>
Phase: {phase_number}: {phase_name}

<files_to_read>
- {phase_dir}/*-PLAN.md (Plans to verify)
- {roadmap_path} (Roadmap â€” phase goal)
- {requirements_path} (Requirements â€” IDs to cover)
- {context_path} (Campaign context â€” locked decisions)
- {research_path} (Research â€” if exists)
</files_to_read>

Phase requirement IDs (MUST ALL be covered): {phase_req_ids}
MIR Gate 1: {mir_gate1}
MIR Gate 2: {mir_gate2}
</verification_context>

<check_dimensions>
1. Frontmatter completeness: wave, depends_on, discipline, tracking_required
2. Task depth: every task has <read_first> with MIR file refs, <acceptance_criteria> with measurable metrics
3. Action concreteness: no vague language â€” all copy, events, budgets, targeting specified
4. Requirement coverage: every phase_req_id appears in at least one plan
5. MIR alignment: plans reference correct MIR files for their discipline
6. Tracking coverage: any campaign/channel plan has tracking tasks with exact event names
7. Budget alignment: budget figures match BUDGET-ALLOCATION.md context
8. Checkpoint placement: creative and budget decisions marked autonomous: false
</check_dimensions>

<expected_output>
## VERIFICATION PASSED â€” all checks pass with summary
## ISSUES FOUND â€” structured issue list with plan ID, dimension, specific problem, fix suggestion
</expected_output>
",
  subagent_type="markos-plan-checker",
  model="{checker_model}",
  description="Verify Phase {phase} plans"
)
```

## 10. Handle Checker Return + Revision Loop (Max 3 Iterations)

- **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 11.
- **`## ISSUES FOUND`:** Check iteration count.

Track `iteration_count` (starts at 1 after initial plan + check).

**If iteration_count < 3:** Send back to planner with issues:

```
Task(
  prompt="
<revision_context>
Phase: {phase_number}
Mode: revision â€” iteration {N}/3

<files_to_read>
- {phase_dir}/*-PLAN.md (Existing plans)
- {context_path} (Campaign context)
</files_to_read>

Checker issues:
{structured_issues_from_checker}
</revision_context>

<instructions>
Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Return ## PLANNING COMPLETE with what changed.
</instructions>
",
  subagent_type="markos-planner",
  model="{planner_model}"
)
```

After planner returns â†’ spawn checker again, increment iteration_count.

**If iteration_count >= 3:** Display remaining issues, offer: 1) Force proceed, 2) Provide guidance and retry, 3) Abandon.

## 10.5. The Red Team Debate Protocol (Adversarial Swarm)

**Skip if:** All plans have `neuro_dimension: false` OR `--skip-neuro` flag set.

**If any plan has `neuro_dimension: true`:**

Display:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º ADVERSARIAL SWARM DEBATE INITIATED
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Spawning Blue Team (markos-campaign-architect) vs Red Team (markos-neuro-auditor)...
```

Forced 2-Round Execution:
**Round 1:** `markos-campaign-architect` proposes the campaign hooks, copy, and psychological triggers defined in the PLAN.md.
**Round 2:** `markos-neuro-auditor` actively attempts to tear down the proposal using cognitive gap failures, `AUDIENCES.md` VectorDB grievances, and neuromarketing anti-patterns.
**Resolution:** The Architect must concede and dynamically rewrite the `PLAN.md` strings to satisfy the Auditor's attack vector.

Handle return:
- `## DEBATE CONCLUDED: COMPROMISE REACHED` â†’ PLAN.md updated with unbreakable copy. Continue to step 11.
- `## DEBATE DEADLOCKED` â†’ Architect and Auditor cannot agree. Display transcript to user and send back to `markos-planner` for a massive rewrite. (Counts toward iteration limit).

## 11. Requirements Coverage Gate

**Skip if:** `phase_req_ids` is null.

Check all plan `requirements` frontmatter fields against `phase_req_ids`. Surface uncovered IDs with options:
1. Re-plan to include (recommended)
2. Move to next phase
3. Proceed with gaps accepted

## 12. Auto-Advance Check

Parse `--auto` flag and `workflow._auto_chain_active` config:

```bash
AUTO_CHAIN=$(node ".agent/markos/bin/markos-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
AUTO_CFG=$(node ".agent/markos/bin/markos-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

**If `--auto` OR `AUTO_CHAIN=true` OR `AUTO_CFG=true`:**

```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º AUTO-ADVANCING TO EXECUTE
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Plans ready. Launching execute-phase...
```

Launch: `Skill(skill="markos-execute-phase", args="${PHASE} --auto --no-transition")`

**If not auto:** Route to `<offer_next>`.

</process>

<offer_next>
Output this markdown directly (not as a code block):

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 MARKOS â–º PHASE {X} PLANNED âœ“
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

**Phase {X}: {Name}** â€” {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives]  |
| 2    | 03     | [objective]   |

Research: {Completed | Used existing | Skipped}
Plan check: {Passed | Passed with override | Skipped}
MIR Gate 1: {âœ“ GREEN | âœ— RED}

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

## â–¶ Next Up

**Execute Phase {X}** â€” run all {N} plans

/markos-execute-phase {X}

<sub>/clear first â†’ fresh context window</sub>

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

**Also available:**
- cat .planning/phases/{phase-dir}/*-PLAN.md â€” review plans
- /markos-plan-phase {X} --research â€” force re-research
- /markos-discuss-phase {X} â€” recapture campaign context

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
</offer_next>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] Phase validated against ROADMAP.md
- [ ] Phase directory created if needed
- [ ] MIR Gate 1 checked and displayed
- [ ] CONTEXT.md loaded (step 4) and passed to ALL agents
- [ ] Research completed (unless --skip-research or exists)
- [ ] markos-market-researcher spawned with campaign context
- [ ] markos-planner spawned with CONTEXT.md + RESEARCH.md
- [ ] Plans created with marketing-specific deep_work_rules
- [ ] markos-plan-checker spawned with all plans
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] Requirements coverage verified
- [ ] User sees status between agent spawns
- [ ] User knows next steps
</success_criteria>

