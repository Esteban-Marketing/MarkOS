<purpose>
Execute all plans in a marketing phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to mgsd-executor subagents. Coordinates campaign artifacts, creative checkpoints, and budget decision gates.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads full context from its fresh window. Orchestrator: discover plans → analyze deps → group waves → spawn executors → handle checkpoints → collect results → verify phase goal.
</core_principle>

<runtime_compatibility>
**Subagent spawning is runtime-specific:**
- **Claude Code / Antigravity:** Uses `Task(subagent_type="mgsd-executor", ...)` — blocks until complete, returns result
- **Other runtimes:** If Task/subagent API is unavailable, use sequential inline execution: read and follow execute-plan.md directly for each plan

**Fallback rule:** If agent completes work (commits visible, SUMMARY.md exists) but orchestrator never receives completion signal — treat as successful based on spot-checks and continue. Never block indefinitely.
</runtime_compatibility>

<available_agent_types>
- mgsd-executor — Executes plan tasks, commits, creates SUMMARY.md
- mgsd-verifier — Verifies phase deliverables across 7 dimensions, creates VERIFICATION.md
- mgsd-gap-auditor — Scans MIR for [FILL] placeholders
- mgsd-tracking-spec — PostHog/GA event specifications
- mgsd-librarian — Updates STATE.md and CHANGELOG
</available_agent_types>

<process>

<step name="initialize">
Load all context in one call:

```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init execute-phase "${PHASE_ARG}" --raw)
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `mir_gate1`, `mir_gate2`, `verification_passed`, `project_valid`.

**If `phase_found` is false:** Error — phase directory not found. Run `/mgsd-plan-phase {N}` first.
**If `plan_count` is 0:** Error — no plans found. Run `/mgsd-plan-phase {N}`.

### 1.5. Prerequisite Enforcement (v1.1 Hardening)

**If `project_valid` is false:**
Error — `PROJECT.md` is missing, too short, or contains `[FILL]`.
Execution requires a grounded business identity. Run `/mgsd-mir-audit` to find identity gaps.

**If `verification_passed` is false:**
Error — Phase plans have not passed verification or `VERIFICATION.md` is missing.
**Bullet-proof rule**: Never execute unverified marketing plans.
Run `/mgsd-plan-phase {PHASE_NUMBER}` (without `--skip-verify`) to generate a passing verification report.

**REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear stale chain flag:
```bash
if [[ ! "$ARGUMENTS" =~ --auto ]]; then
  node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
fi
```
</step>

<step name="check_interactive_mode">
**Parse `--interactive` flag from $ARGUMENTS.**

**If `--interactive` flag present:** Execute plans sequentially inline (no subagent spawning) with user checkpoints between tasks. Best for: small phases, creative review phases, learning MGSD.

Interactive flow:
1. Load plan inventory normally
2. For each plan: show objective + task count, offer Execute / Review / Skip / Stop
3. If "Review first": display full plan, ask again
4. If "Execute": read and follow `execute-plan.md` inline — no subagent spawn
5. After plan complete: create SUMMARY.md, commit, show next plan

**Skip to validate_phase** after setting `INTERACTIVE_MODE=true`.
</step>

<step name="validate_phase">
From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.

Display: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"

**Update STATE.md for phase start:**
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" state begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
```
</step>

<step name="discover_and_group_plans">
Load plan inventory with wave grouping:

```bash
PLAN_INDEX=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" phase-plan-index "${PHASE_NUMBER}" --raw)
```

Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `discipline`, `objective`, `tracking_required`, `requires_human_approval`, `task_count`, `has_summary`), `waves` (wave number → plan IDs), `incomplete`, `has_checkpoints`.

**Filtering:** Skip plans where `has_summary: true`. If all filtered: "No incomplete plans found — phase may already be complete."

Report:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► EXECUTING — Phase {X}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Wave | Plans | Discipline | What it delivers |
|------|-------|-----------|-----------------|
| 1    | 01   | paid_acquisition | {from objective} |
| CP   | 02   | creative | Creative approval required |
| 2    | 03   | tracking | {from objective} |
```
</step>

<step name="execute_waves">
Execute each wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>`.

   ```
   ───────────────────────────────────────────────────────────────
   ## Wave {N}

   **{Plan ID}: {Discipline} — {Plan Name}**
   {2-3 sentences: what this delivers, channel/platform, why it matters in sequence}

   Spawning {count} executor(s)...
   ───────────────────────────────────────────────────────────────
   ```

2. **Spawn mgsd-executor per plan:**

   Pass paths only — executors load fresh context.

   ```
   Task(
     subagent_type="mgsd-executor",
     model="{executor_model}",
     prompt="
<objective>
Execute plan {plan_id} of phase {phase_number}: {phase_name}.
Commit each task atomically using mktg() prefix. Create SUMMARY.md. Update STATE.md.
</objective>

<parallel_execution>
You are running as a PARALLEL executor agent. Use --no-verify on all git commits
to avoid pre-commit hook contention. Orchestrator validates hooks after wave completes.
</parallel_execution>

<execution_context>
@.agent/marketing-get-shit-done/workflows/execute-plan.md
@.agent/marketing-get-shit-done/templates/summary.md
@.agent/marketing-get-shit-done/references/checkpoints.md
@.agent/marketing-get-shit-done/references/verification-patterns.md
</execution_context>

<files_to_read>
- {phase_dir}/{plan_file} (Plan — read this first)
- .planning/PROJECT.md (Project + business identity)
- .planning/STATE.md (Current state)
- .planning/config.json (Config — discipline activation)
- CLAUDE.md or GEMINI.md (Project instructions, if exists)
</files_to_read>

<mir_context>
MIR Gate 1: {mir_gate1}
MIR Gate 2: {mir_gate2}
Read relevant MIR files listed in plan's mir_files_referenced before executing.
</mir_context>

<api_execution>
If a task is tagged with `[API-EXECUTE]`, DO NOT block and wait for `[HUMAN]` approval. You are explicitly authorized to map this task directly to a Node/Python script local to the repository. Execute the external API requests autonomously (e.g., `npm run script:auto-bid`, `python scripts/upload-video.py`) rather than exclusively generating copy files. This bypasses the typical manual execution chokepoint.
</api_execution>

<success_criteria>
- [ ] All tasks executed with concrete deliverables
- [ ] Each task committed individually with mktg({discipline}) prefix
- [ ] SUMMARY.md created: one-liner, key files, campaign impact, key decisions
- [ ] STATE.md updated with position and decisions
</success_criteria>
     "
   )

3. **Wait for all agents in wave to complete.**

   **Completion spot-check fallback:**
   ```bash
   SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
   COMMITS_FOUND=$(git log --oneline --since="1 hour ago" --grep="phase-{phase_number}" | head -1)
   ```
   If SUMMARY.md exists AND commits found → treat as successful, continue.

4. **Post-wave hook validation (parallel mode only):**
   ```bash
   git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review"
   ```

5. **Report wave completion — spot-check SUMMARY.md claims:**
   - Verify first 2 files from `key-files.created` exist on disk
   - Check for `## Self-Check: FAILED` marker

   ```
   ───────────────────────────────────────────────────────────────
   ## Wave {N} Complete

   **{Plan ID}: {Discipline}**
   {What was delivered — from SUMMARY.md one-liner}
   {Campaign impact: {from SUMMARY.md campaign_impact}}

   {If more waves: what this enables next}
   ───────────────────────────────────────────────────────────────
   ```

6. **Handle failures:**
   - If SUMMARY.md missing → ask "Retry plan?" or "Continue remaining waves?"

7. **Pre-wave dependency check (waves 2+):**

   For each plan in upcoming wave, verify key artifacts from prior waves exist. If missing:
   ```
   ## ⚠ Cross-Plan Dependency Gap

   | Plan | Depends On | Status |
   |------|-----------|--------|
   | {plan} | {artifact} | NOT FOUND |

   Options: 1) Fix before continuing  2) Continue (may cascade)
   ```

8. **Handle checkpoint plans** — see `<checkpoint_handling>`.

9. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` OR `requires_human_approval: true` require user interaction.

**Auto-mode handling:**
```bash
AUTO_CHAIN=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
AUTO_CFG=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

When executor returns a checkpoint AND auto-mode is active:
- **human-verify** (e.g., UTM check, pixel verify) → Auto-approve. Log `⚡ Auto-approved: {checkpoint_type}`
- **budget-decision** → **Stop auto-mode.** Budget decisions always require human. Log `⏸ Auto stopped: budget-decision requires human`
- **creative-approval** → **Stop auto-mode.** Creative decisions always require human.
- **platform-setup** → **Stop auto-mode.** Platform configuration requires human credentials.
- **mir-gate** → Auto present gap list; human fills gaps.

**Standard flow (not auto-mode or blocking checkpoint):**

1. Spawn executor for checkpoint plan
2. Executor runs until checkpoint task → returns structured state
3. Present to user:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {checkpoint_type}                               ║
╚══════════════════════════════════════════════════════════════╝

**Plan:** {plan_id} — {plan_name}
**Progress:** {completed}/{total} tasks complete

{Checkpoint details from executor return}

{For creative-approval:}
→ Review the creative assets above. Type "approved" or describe changes needed.

{For budget-decision:}
→ Review the budget allocation above. Type "approved $X" or "modify: ..."

{For platform-setup:}
→ Complete the platform setup steps above. Type "done" when complete.
```

4. User responds
5. Spawn continuation agent with user response
6. Continuation verifies prior commits, continues from resume point
7. Repeat until plan completes
</step>

<step name="aggregate_results">
After all waves:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► PHASE {X} EXECUTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Waves: {N} | Plans: {M}/{total} complete

| Wave | Discipline | Plan | Status |
|------|-----------|------|--------|
| 1    | paid_acquisition | 01-campaign-setup | ✓ |
| CP   | creative | 02-creative-review | ✓ Approved |
| 2    | tracking | 03-tracking-setup | ✓ |

### Campaign Impact
{Aggregate from SUMMARY.md campaign_impact fields}

### Decisions Made
{Aggregate checkpoint decisions}
```
</step>

<step name="campaign_artifact_closure">
**For decimal/polish phases only (X.Y pattern):** Close parent campaign UAT items.

**Skip if** phase number has no decimal.

1. Derive parent phase number: `PARENT_PHASE="${PHASE_NUMBER%%.*}"`
2. Find parent campaign UAT file in parent phase directory
3. Update gap statuses from `failed` → `resolved`
4. If all resolved: update UAT frontmatter status → `resolved`
5. Commit:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-${PARENT_PHASE}): resolve campaign UAT gaps after ${PHASE_NUMBER} closure"
```
</step>

<step name="kpi_baseline_gate">
Before verification — check if this phase's execution could have degraded active campaign KPIs.

**Skip if:** First phase or no active campaigns in CAMPAIGN.md files.

Check:
```bash
ls .planning/phases/*/CAMPAIGN.md 2>/dev/null
```

For each active campaign this phase touched: verify the KPI targets from CAMPAIGN.md §8 are still achievable given changes made. If a plan changed landing page copy, ad targeting, or tracking — flag for human review before declaring success.

```
## ⚠ KPI Impact Check

| Campaign | Metric | Target | Risk |
|---------|--------|--------|------|
| {id}    | CPL    | $X     | Landing page copy changed — A/B test results may shift |
```

Options: 1) Acknowledge and continue  2) Revert risky changes
</step>

<step name="verify_phase_goal">
Spawn `mgsd-verifier` to check all 7 dimensions:

```
Task(
  prompt="
Verify phase {phase_number} goal achievement.
Phase directory: {phase_dir}
Phase goal: {goal from ROADMAP.md}
Phase requirement IDs: {phase_req_ids}
MIR Gate 1: {mir_gate1} | Gate 2: {mir_gate2}

Read all PLAN.md + SUMMARY.md in phase directory.
Check must_haves against actual deliverables.
Run 7-dimension verification per .agent/marketing-get-shit-done/references/verification-patterns.md.
Create VERIFICATION.md in phase directory.
Return: passed | human_needed | gaps_found
  ",
  subagent_type="mgsd-verifier",
  model="{verifier_model}"
)
```

Read status from VERIFICATION.md.

| Status | Action |
|--------|--------|
| `passed` | → update_roadmap |
| `human_needed` | Persist as UAT.md; present to user; on "approved" → update_roadmap |
| `gaps_found` | Display gap summary; offer `/mgsd-plan-phase {N} --gaps` |

**If human_needed:** Create `{phase_dir}/{padded_phase}-HUMAN-UAT.md`:

```markdown
---
status: partial
phase: {phase_num}-{phase_name}
source: [{phase_num}-VERIFICATION.md]
started: {ISO timestamp}
---

## Pending Human Verification

{For each human_verification item from VERIFICATION.md}

### {N}. {item description}
expected: {expected from VERIFICATION.md}
result: [pending — check platform directly]

## Summary
pending: {count}
```

Commit UAT file. Present to user with "approved" / "issues found" options.
</step>

<step name="update_roadmap">
Mark phase complete and update all tracking files:

```bash
COMPLETION=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" phase complete "${PHASE_NUMBER}")
```

The CLI handles:
- Marking phase checkbox `[x]` with completion date
- Advancing STATE.md to next phase
- Checking for verification debt

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-${PHASE_NUMBER}): mark phase complete" --files .planning/ROADMAP.md .planning/STATE.md
```
</step>

<step name="offer_next">
**If `--no-transition` flag present (spawned by auto-advance chain):**

Return:
```
## PHASE COMPLETE

Phase: {PHASE_NUMBER} - {PHASE_NAME}
Plans: {completed}/{total}
Verification: {Passed | Gaps Found}
```
STOP.

**If not `--no-transition` and verification passed:**

Check auto-advance config. If auto: trigger next phase chain.

Otherwise:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► PHASE {X} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/mgsd-progress — see updated roadmap
/mgsd-discuss-phase {next} — start next phase
/mgsd-performance-review — review active campaign performance
```
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context for coordination. Executors: fresh context each.
For 1M+ context models: pass richer context directly to executors (campaign brief snippets, MIR file content).
</context_efficiency>

<failure_handling>
- **Executor fails mid-plan:** Missing SUMMARY.md → report, ask user how to proceed
- **Creative checkpoint unresolvable:** "Skip plan?" or "Abort phase?" → record partial in STATE.md
- **Budget decision rejected:** "Replan with revised budget?" or "Pause phase?"
- **Platform setup timeout:** "Resume after setup?" — CONTINUE-HERE.md auto-created
- **All agents in wave fail:** Systemic issue → stop, report for investigation
</failure_handling>

<resumption>
Re-run `/mgsd-execute-phase {phase}` → discover_plans finds completed SUMMARYs → skips them → resumes from first incomplete plan → continues wave execution.
STATE.md tracks: last completed plan, current wave, pending checkpoints.
</resumption>

<success_criteria>
- [ ] Phase directory validated with plans
- [ ] STATE.md updated at phase start
- [ ] Plans grouped by wave and discipline
- [ ] Executor subagents spawned per plan
- [ ] Creative/budget checkpoints handled with human interaction
- [ ] Wave completion spot-checks pass
- [ ] KPI baseline gate checked
- [ ] mgsd-verifier spawned — VERIFICATION.md created
- [ ] Human UAT items persisted if needed
- [ ] ROADMAP.md marked complete
- [ ] User sees clear next steps
</success_criteria>
