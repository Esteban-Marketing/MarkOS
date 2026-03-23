---
token_id: MGSD-HKP-OPS-03
document_class: HOOK
domain: OPS
version: "1.0.0"
status: active
hook_type: post-execution
runs_after: [mgsd-execute-phase, mgsd-verify-work]
upstream:
  - MGSD-IDX-000
  - MGSD-AGT-OPS-07  # mgsd-linear-manager
downstream:
  - MGSD-AGT-OPS-07  # mgsd-linear-manager (sync trigger)
  - MGSD-AGT-OPS-02  # mgsd-librarian (STATE.md update)
---

# post-execution-sync — Linear Bidirectional Sync Hook

<!-- TOKEN: MGSD-HKP-OPS-03 | CLASS: HOOK | DOMAIN: OPS -->
<!-- PURPOSE: After any phase execution or verification, syncs MGSD STATE.md to Linear and pulls Linear status changes back into STATE.md. Implements the bidirectional sync contract: Linear is the source of truth for human-reviewed task status. MGSD STATE.md is the source of truth for agent-generated execution state. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-AGT-OPS-07 | agents/mgsd-linear-manager.md | Sync agent invoked by this hook |
| MGSD-AGT-OPS-02 | agents/mgsd-librarian.md | Updates STATE.md with pulled Linear status |
| MGSD-HKP-OPS-01 | hooks/pre-campaign-check.md | Pre-check that runs before execution |
| MGSD-SKL-OPS-19 | skills/mgsd-linear-sync/SKILL.md | Manual skill trigger for this hook |
| MGSD-WFL-OPS-02 | workflows/linear-sync.md | Full sync workflow — this hook runs a subset |

---

## Invocation

Run automatically at the end of `execute-phase` and `verify-work` orchestrators:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear sync \
  --phase "${PHASE_NUMBER}" \
  --direction bidirectional \
  --raw
```

Parse JSON for: `pushed_count`, `pulled_count`, `drift_items[]`, `human_completed[]`, `errors[]`.

---

## Direction A — MGSD → Linear (Push)

**Trigger:** Phase execution or verification completes.

**What is pushed:**

| MGSD Event | Linear Action |
|------------|---------------|
| Phase starts (`STATE.md status: in_progress`) | Epic status → In Progress |
| Plan SUMMARY.md created | Story/Task status → In Review |
| VERIFICATION.md `status: passed` | Epic status → Done |
| VERIFICATION.md `status: gaps_found` | Epic status → Blocked; comment added |
| `requires_human_approval: true` task reached | Task status → In Review; assignee set to `{{LEAD_AGENT}}` |
| `[MGSD-BLOCK]` created | New Blocker issue created, linked to parent Epic |
| `[MGSD-HANDOFF]` created | New issue created with tag `handoff`; human assigned |

**Push execution:**
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear push \
  --phase "${PHASE_NUMBER}" \
  --summary-files "${SUMMARY_FILES[@]}" \
  --verification "${VERIFICATION_FILE}"
```

---

## Direction B — Linear → MGSD (Pull)

**Trigger:** Same post-execution hook — always pull after pushing.

**What is pulled back:**

| Linear Event | MGSD STATE.md Update |
|-------------|---------------------|
| Issue marked **Done** by human | Corresponding PLAN.md checkbox → `[x]` |
| Issue marked **Cancelled** by human | Task logged as `cancelled` in SUMMARY.md |
| Issue comment added by human | Appended to `decisions` log in STATE.md |
| Issue moved to **Backlog** by human | Phase flagged as `deferred` in ROADMAP.md |
| Blocker issue resolved by human | Gate or block condition cleared in STATE.md |
| Human fills required fields in Linear description | `[MGSD-BLOCK]` ticket → status `resolved` |

**This is the mechanism by which human work in Linear feeds back into the agent protocol.**

**Pull execution:**
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear pull \
  --since "${LAST_SYNC_TIMESTAMP}" \
  --update-state \
  --raw
```

Apply pulled changes to `.planning/STATE.md` and relevant PLAN.md files.

---

## Drift Detection

After bidirectional sync, check for state drift:

```
DRIFT — items where Linear status and STATE.md status disagree:

| Issue ID | Linear Status | STATE.md Status | Resolution |
|----------|--------------|-----------------|------------|
| {id}     | Done         | in_progress     | Pull wins — update STATE.md |
| {id}     | In Progress  | complete        | Push wins — update Linear |
```

**Resolution rule:**
- Human-initiated changes in Linear → **Linear wins** (pull takes precedence)
- Agent-generated execution events → **MGSD wins** (push takes precedence)
- Conflicts (both changed since last sync) → **Escalate to human** via `[MGSD-CONFLICT]` ticket

---

## Human Verification Checkpoints

Some sync events **must wait for human confirmation** before propagating:

| Event | Wait For Human? | Why |
|-------|-----------------|-----|
| Phase marked `complete` in ROADMAP.md | ✅ YES | Human must approve phase closure |
| Campaign set to `active` in STATE.md | ✅ YES | Human must approve campaign launch |
| Budget change synced from Linear | ✅ YES | Financial changes require human sign-off |
| Content approved in Linear → STATUS updated | ✅ YES | Content approval is human decision |
| Tracking spec confirmed in Linear | ✅ YES | Tracking verification requires human check |
| Task status update (non-blocking) | ❌ AUTO | Routine status changes auto-propagate |

---

## Error Handling

```
Linear API error               → Log to STATE.md errors[], retry after 60s × 3, then escalate
Rate limit hit                 → Exponential backoff: 60s, 120s, 240s
Auth failure                   → HALT sync, create [MGSD-URGENT] ticket, alert human
Drift conflict unresolvable    → Create [MGSD-CONFLICT] ticket, log both states, await human
```

**On persistent failure:** Sync enters degraded mode — STATE.md continues as source of truth, Linear sync deferred until auth restored. Log `sync_status: degraded` in STATE.md.

---

## Sync Completion Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POST-EXECUTION SYNC COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pushed: {N} events → Linear
Pulled: {N} status changes → STATE.md
Drift items resolved: {N}
Human checkpoints required: {N}

→ {human_checkpoint_list}
```
