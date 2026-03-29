---
token_id: MARKOS-HKP-OPS-02
document_class: HOOK
domain: OPS
version: "1.0.0"
status: active
hook_type: pre-execution
runs_before: [markos-content-creator, markos-copy-drafter, markos-social-drafter, markos-email-sequence]
upstream:
  - MARKOS-REF-OPS-01  # mir-gates.md
  - MARKOS-HKP-OPS-01  # pre-campaign-check (must run first)
downstream:
  - MARKOS-AGT-CNT-01  # markos-content-creator
  - MARKOS-AGT-CNT-02  # markos-copy-drafter
  - MARKOS-AGT-CNT-03  # markos-social-drafter
  - MARKOS-AGT-CNT-04  # markos-email-sequence
---

# pre-content-check — Content Gate Enforcement Hook

<!-- TOKEN: MARKOS-HKP-OPS-02 | CLASS: HOOK | DOMAIN: OPS -->
<!-- PURPOSE: Validates that VOICE-TONE.md and MESSAGING-FRAMEWORK.md are non-empty and complete before any copy or creative content task begins. Runs after pre-campaign-check as a narrower content-domain gate. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-HKP-OPS-01 | hooks/pre-campaign-check.md | Parent gate — run this first |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 definitions governing content agents |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | Neuro trigger layer validated in Step 4 |
| MARKOS-AGT-CNT-01 | agents/markos-content-creator.md | Primary consumer — blocked until this hook passes |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Called in Step 4 to validate neuro_spec presence |

---

## Invocation

Content agents call this hook before generating any copy, brief, or creative output:

```bash
CONTENT_GATE=$(node ".agent/markos/bin/markos-tools.cjs" content-gate-check --raw)
```

Parse JSON for: `voice_tone.ready`, `messaging.ready`, `audiences.ready`, `neuro_spec.required`, `blocking_fields[]`.

---

## Step 1 — VOICE-TONE.md Validation

**File:** `Core_Strategy/02_BRAND/VOICE-TONE.md`

Required non-empty fields:

| Field | What It Provides | Block If |
|-------|-----------------|----------|
| `tone_descriptors[]` | List of approved tone adjectives | Empty or fewer than 3 items |
| `prohibited_words[]` | Words the brand never uses | Empty — agent has no constraint |
| `cta_approved_list[]` | Approved CTA phrases | Empty — agent invents CTAs |
| `tone_by_context{}` | Tone rules per channel (social/email/ads) | Missing any active channel |

**If VOICE-TONE.md fails:**
```
⛔ CONTENT BLOCKED — VOICE-TONE.md incomplete

Missing fields: {blocking_fields}

Zero copy may be generated without a complete voice and tone specification.
Agent has entered idle state for all copy tasks.

REQUIRED HUMAN ACTION:
  1. Open Core_Strategy/02_BRAND/VOICE-TONE.md
  2. Fill all missing fields with verified brand voice data
  3. Run /markos-execute-phase {N} after VOICE-TONE.md is complete
```

---

## Step 2 — MESSAGING-FRAMEWORK.md Validation

**File:** `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`

Required non-empty fields:

| Field | What It Provides | Block If |
|-------|-----------------|----------|
| `value_propositions[]` | Core value props by audience segment | Empty |
| `headline_bank[]` | Approved headline formulas | Empty |
| `objection_responses{}` | Objection → response map | Empty or fewer than 3 entries |
| `primary_outcome_statement` | Single line: what transformation the product delivers | Empty |

**If MESSAGING-FRAMEWORK.md fails:**
```
⛔ CONTENT BLOCKED — MESSAGING-FRAMEWORK.md incomplete

Missing or empty: {blocking_fields}

Agent cannot generate on-brand copy without a messaging architecture.
```

---

## Step 3 — AUDIENCES.md Segment Validation

**File:** `Market_Audiences/03_MARKET/AUDIENCES.md`

For the specific audience segment targeted by this task:

| Field | Block If |
|-------|----------|
| `icp_primary.pain_points[]` | Empty — agent invents pain points |
| `icp_primary.language_patterns[]` | Empty — agent invents voice |
| `icp_primary.funnel_stage` | Not set — agent doesn't know where in funnel |

**If segment data is missing:** Block copy tasks targeting that segment. Allow copy tasks targeting other segments that do have data.

---

## Step 4 — Neuromarketing Spec Validation

**Applies to:** Any task in a plan with `neuro_dimension: true`

Check that every copy task has a `<neuro_spec>` block with:
- `<trigger>` — specific B0N code
- `<activation>` — concrete mechanism (not abstract)
- `<archetype>` — one of six approved archetypes

**If `<neuro_spec>` missing on a neuro-dimensioned copy task:**
```
⚠️ NEURO SPEC MISSING — Task {N}: {task_name}

This plan has neuro_dimension: true but task {N} has no <neuro_spec> block.
Copy cannot be generated without a neuromarketing specification.

REQUIRED: Add <neuro_spec> block to task {N} in PLAN.md before continuing.
```

**This is a HUMAN verification point — neuro specs require human review before copy generation.**

---

## Decision Logic

```
All 3 sections pass + neuro valid   → ✅ PROCEED — content agents unblocked
VOICE-TONE.md fails                 → ⛔ HARD BLOCK all copy tasks
MESSAGING-FRAMEWORK.md fails        → ⛔ HARD BLOCK all copy tasks
AUDIENCES.md segment missing        → ⛔ BLOCK tasks for that segment only
neuro_spec missing (neuro plan)     → ⚠️ HOLD task — human fills spec, then continue
```

---

## Human Verification Points

Content output is **never auto-approved**. After any content agent completes:

1. Agent creates deliverable in phase directory
2. Agent flags for human review: `requires_human_approval: true` in SUMMARY.md
3. Human reviews copy against VOICE-TONE.md prohibited words and tone rules
4. Human either: **approves** (agent continues) or **provides revision notes** (agent revises)

**No content agent may self-approve its own output. Human review is mandatory on all client-facing copy.**
