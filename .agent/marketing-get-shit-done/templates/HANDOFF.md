---
token_id: MGSD-TPL-OPS-17
document_class: TPL
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-IDX-000
  - MGSD-REF-OPS-06  # continuation-format.md
downstream:
  - MGSD-AGT-EXE-01  # executor writes handoff
  - MGSD-AGT-OPS-07  # linear-manager creates handoff ticket
mir_gate_required: none
---

# HANDOFF.md — Human↔AI Transition Template

<!-- TOKEN: MGSD-TPL-OPS-17 | CLASS: TPL | DOMAIN: OPS -->
<!-- PURPOSE: Scaffold for all agent-to-human and human-to-agent handoffs. Agents fill this template whenever execution requires human input, decision, or approval. Linked to a Linear [MGSD-HANDOFF] ticket to ensure the human sees it. -->
<!-- USAGE: Copy this file to .planning/HANDOFF.md. Fill all [FILL] fields. Never leave [FILL] in the final file. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-REF-OPS-06 | references/continuation-format.md | Resume/continuation format — used when handoff resolves |
| MGSD-REF-OPS-07 | references/checkpoints.md | Checkpoint pattern for mid-phase handoffs |
| MGSD-HKP-OPS-03 | hooks/post-execution-sync.md | Sync hook creates Linear ticket for this handoff |
| MGSD-AGT-OPS-07 | agents/mgsd-linear-manager.md | Creates [MGSD-HANDOFF] ticket from this file |

---

```yaml
timestamp: [YYYY-MM-DDTHH:MM:SSZ]
source_agent: [MGSD-AGT-XXX-NN — agent initiating handoff]
target: [human | MGSD-AGT-XXX-NN]
handoff_type: [creative-approval | budget-decision | gate-block | platform-setup | legal-review | content-review | verification | escalation]
severity: [low | medium | urgent]
phase: [phase number and name]
plan_id: [plan file that triggered this handoff]
blocking_artifact: [exact file path blocking execution]
linear_ticket: [MGSD-HANDOFF-{NNNN} — created by mgsd-linear-manager]
state_set_to: [awaiting_human_input]
resume_command: [/mgsd-execute-phase {N} or /mgsd-resume-work]
```

---

## Context Summary

> [2–3 sentences. What was being executed. What specific condition triggered this handoff. What the agent has already completed.]

---

## Completed Before Handoff

| # | Task | Status | Commits |
|---|------|--------|---------|
| 1 | [task name] | ✓ committed | `mktg({discipline}): {message}` |
| 2 | [task name] | ✓ committed | `mktg({discipline}): {message}` |
| N | [task name] | **⛔ BLOCKED — see below** | — |

---

## What the Human Must Do

> **Action type:** `[creative-approval | budget-decision | gate-block | platform-setup | legal-review | content-review | verification | escalation]`

### Specific Action Required

[Exact, imperative instruction. No vague phrases. Examples:
- "Open `VOICE-TONE.md` and add the tone-by-context rule for LinkedIn."
- "Review the ad copy in `.planning/phases/03/01-copy-draft.md` and approve or provide revision notes."
- "Approve the $1,200/mo Meta Ads budget in `BUDGET-ALLOCATION.md §3`."
- "Verify that PostHog event `page_viewed` fires on `/demo` page — check PostHog dashboard."
]

### Files to Review

| File | What to Check |
|------|--------------|
| [path] | [what specifically to look at] |

### Decision Options

- [ ] **Approve** → type `/mgsd-execute-phase {N}` to resume
- [ ] **Reject / revise** → provide specific feedback; agent will revise and return
- [ ] **Escalate** → if legal or brand team review required before decision

---

## Agent State — What Will Resume

When human provides [approval | decision | filled file], the agent will:

1. [First action agent takes on resume]
2. [Second action]
3. Continue execution from Task {N} in `{plan_id}`

**Resume command:**
```
/mgsd-execute-phase {phase_number}
```

or if using pause-work:
```
/mgsd-resume-work
```

---

## Escalation Path

If human cannot resolve within `{escalation_window}`:

| Condition | Next Action |
|-----------|-------------|
| Gate 1 block > 48h | Create client brief session to fill MIR files |
| Budget decision > 24h | Default to last approved budget — flag in SUMMARY.md |
| Legal review required | Pause phase until legal clears — set `state: legal_hold` |
| Platform setup > 4h | Schedule setup session — commit CONTINUE-HERE.md |

---

*Handoff created by `{source_agent}` at `{timestamp}`. Linear: `{linear_ticket}`.*
