---
description: Validate campaign outputs against KPI-FRAMEWORK.md targets across all 7 verification dimensions with mandatory human signoff
---

# /markos-verify-campaign

<purpose>
Post-execution campaign verification. Spawns markos-verifier to check all 7 dimensions against KPI-FRAMEWORK.md targets, MIR gate status, and neuro_spec compliance. Human must sign off on all verification dimensions — no dimension is auto-approved. Produces VERIFICATION.md and creates Linear review tickets for any human-required checks.
</purpose>

<core_principle>
Verification is not rubber-stamping. Every metric is checked against a pre-defined target. Every human-verification item requires an explicit human response before phase is marked complete. The human operator is the final authority on campaign quality.
</core_principle>

<process>

<step name="initialize">
```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" init verify-campaign "${PHASE_ARG}" --raw)
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `plan_count`, `summary_count`, `kpi_framework_path`, `campaign_ids[]`.

**If any plan lacks SUMMARY.md:** List missing summaries. Options:
1. Re-run `/markos-execute-phase {N}` to complete missing plans
2. Proceed with partial verification (document gaps)
</step>

<step name="spawn_verifier">
Spawn `markos-verifier` with full context:

```
Task(
  subagent_type="markos-verifier",
  model="{verifier_model}",
  prompt="
  Verify Phase {phase_number}: {phase_name}

  Read all PLAN.md + SUMMARY.md in {phase_dir}.
  Read KPI targets from: {kpi_framework_path}
  Read verification patterns from: .agent/markos/references/verification-patterns.md
  Read neuromarketing spec from: .agent/markos/references/neuromarketing.md
  Read MIR gate status from: .agent/markos/references/mir-gates.md

  Run all 7 verification dimensions per verification-patterns.md.
  Mark each dimension: ✅ passed | ⚠️ warning | ❌ failed | 🔍 human_verification_required

  For dimensions requiring human verification: list exactly what the human must check and where.

  Create VERIFICATION.md in {phase_dir}.
  Return: passed | human_needed | gaps_found
  "
)
```
</step>

<step name="read_verification">
Read `{phase_dir}/VERIFICATION.md`.

Parse: `overall_status`, dimension results, `human_verification[]` items, `gaps[]`.

**If `overall_status: passed` AND no `human_verification` items:**
→ Proceed to auto-confirmation. (Rare — most campaigns have human_verification items.)

**If `human_verification` items exist** (standard case):
→ Proceed to `human_review_loop`.

**If `overall_status: gaps_found`:**
→ Display gaps, offer `/markos-plan-phase {N} --gaps` to create remediation plans.
</step>

<step name="human_review_loop">
Present each `human_verification_required` item one at a time. **Human must respond to each.**

```
╔══════════════════════════════════════════════════════════════╗
║  VERIFICATION REQUIRED — Phase {N}: {Name}                   ║
╚══════════════════════════════════════════════════════════════╝

{For each human_verification item:}

─────────────────────────────────────────────────────────
{N}. {item_description}

What to check: {exact_check_instruction}
Where to look: {platform / file path / dashboard link}
Expected result: {what "pass" looks like}

Your response: [pass / fail / needs-revision]
If "fail" or "needs-revision": describe the issue
─────────────────────────────────────────────────────────
```

**Standard human-verification items for campaigns:**
- [ ] Ad creative approved (visual + copy) — human must view asset
- [ ] Tracking events fire correctly — human checks PostHog/GA4
- [ ] UTM parameters appear in analytics — human checks dashboard  
- [ ] Landing page message matches ad — human spot-checks
- [ ] Email deliverability — human checks spam scores
- [ ] Budget pacing within target — human checks ad platform
- [ ] Legal/compliance — human confirms no prohibited claims

Write human responses to `{phase_dir}/HUMAN-UAT.md`:

```bash
node ".agent/markos/bin/markos-tools.cjs" uat record \
  --phase "${PHASE_NUMBER}" \
  --item "${ITEM_N}" \
  --result "${HUMAN_RESPONSE}" \
  --notes "${HUMAN_NOTES}"
```
</step>

<step name="aggregate_verification">
After all human responses collected:

Compute final verification status:
- All dimensions passed + all human items passed → `status: verified`
- Any dimension failed → `status: failed` — create remediation task
- Any human item `needs-revision` → `status: revision_required`

Update VERIFICATION.md with human responses:
```bash
node ".agent/markos/bin/markos-tools.cjs" verification finalize \
  --phase "${PHASE_NUMBER}" \
  --status "${FINAL_STATUS}"
```
</step>

<step name="linear_sync">
Create Linear review tickets for each verification item that required human attention:

```bash
node ".agent/markos/bin/markos-tools.cjs" linear create \
  --title "[MARKOS] Verification Complete: Phase {N} — {status}" \
  --body "{verification_summary}" \
  --label "verification,campaign"
```

Trigger post-execution-sync hook:
```bash
node ".agent/markos/bin/markos-tools.cjs" linear sync \
  --phase "${PHASE_NUMBER}" \
  --direction bidirectional
```
</step>

<step name="completion">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► CAMPAIGN VERIFICATION — Phase {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: {VERIFIED ✅ | REVISION REQUIRED ⚠️ | FAILED ❌}

Dimensions:
  1 — MIR Completeness:      {✅|⚠️|❌}
  2 — Variable Resolution:   {✅|⚠️|❌}
  3 — KPI Baseline:          {✅|⚠️|❌}
  4 — Tracking:              {✅|⚠️|❌}
  5 — Creative Compliance:   {✅|⚠️|❌}  [Human reviewed]
  6 — Budget Alignment:      {✅|⚠️|❌}
  7 — Linear Sync:           {✅|⚠️|❌}
  8 — Neuro Audit:           {✅|⚠️|❌}

Human UAT items: {N} passed / {M} total

{If VERIFIED:}
/markos-progress  → mark phase complete
/markos-execute-phase {N+1}  → next phase

{If REVISION REQUIRED:}
/markos-plan-phase {N} --gaps  → create revision plans
```
</step>

</process>

<success_criteria>
- [ ] markos-verifier spawned — VERIFICATION.md created
- [ ] All 7 dimensions checked
- [ ] Human reviewed every human_verification_required item
- [ ] Human responses recorded in HUMAN-UAT.md
- [ ] Final status written to VERIFICATION.md
- [ ] Linear sync triggered
</success_criteria>
