---
token_id: MGSD-ITM-OPS-01
document_class: ITM
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-OPS-01
  - MGSD-REF-OPS-03
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MGSD-ITM-OPS-01 — Campaign Launch Checklist

<!-- TOKEN: MGSD-ITM-OPS-01 | CLASS: ITM | DOMAIN: OPS -->
<!-- PURPOSE: Linear issue template for the pre-launch Go/No-Go gate. Runs all 7 verification dimensions and final neuro audit sweep. Issues Go signal only when all pass. Consumed by mgsd-linear-manager when creating [MGSD] Launch tickets. Gate 1 + Gate 2 hard required. -->

**Linear Title format:** `[MGSD] Launch: {campaign_name} — Go/No-Go`
**Category:** Campaign Ops
**Primary Triggers:** N/A — gate enforcement task
**Funnel Stage:** Pre-launch
**Gate:** Gate 1 + Gate 2 (hard block if either RED)

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 + Gate 2 enforcement — both must be GREEN |
| MGSD-REF-OPS-03 | references/verification-patterns.md | All 7 dimensions verified in Step 1 |
| MGSD-AGT-EXE-02 | agents/mgsd-verifier.md | Runs 7-dimension verification |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Final sweep across all campaign assets |
| MGSD-AGT-OPS-07 | agents/mgsd-linear-manager.md | Updates Epic status; commits HANDOFF.md |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-OPS-01 | Campaign Ops -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-OPS-01 §all; MGSD-REF-OPS-03 §all 7 dimensions |
| MIR Gate | Gate 1 AND Gate 2 MUST both be GREEN — hard block if either RED |
| MSP Matrix | All active matrices for this campaign |
| AGT Assigned | MGSD-AGT-EXE-02 (verifier) + MGSD-AGT-NEU-01 + MGSD-AGT-OPS-07 (linear-manager) |
| SKL Entry Point | MGSD-SKL-CAM-01 (mgsd-campaign-launch) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>N/A — gate enforcement; neuro compliance verified in all upstream MGSD-ITM-CNT/STR/TRK tasks</trigger>
  <brain_region>N/A</brain_region>
  <activation_method>Confirm all upstream MGSD-ITM-CNT and MGSD-ITM-STR tasks have Neuro Audit status PASSED before issuing Go signal</activation_method>
  <archetype>N/A</archetype>
  <funnel_stage>pre-launch</funnel_stage>
  <psy_kpi>Go signal issued only when all 7 verification dimensions PASS | Zero REWRITE REQUIRED flags across all campaign assets</psy_kpi>
  <failure_mode>Launch proceeds without neuro audit confirmation — live campaign has unverified trigger architecture</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | All creative asset tickets (MGSD-ITM-CNT-*) with Neuro Audit PASSED | Upstream MGSD-ITM-CNT Linear tickets | [ ] |
| 2 | UTM-SPEC.md committed | `.planning/phases/[N]/UTM-SPEC.md` | [ ] |
| 3 | Budget approved in BUDGET-ALLOCATION.md | `MIR/Operations/BUDGET-ALLOCATION.md` | [ ] |
| 4 | Legal/compliance review complete (if influencer or regulated category) | Human-provided sign-off | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run all 7 verification dimensions using `MGSD-AGT-EXE-02` — produce `VERIFICATION.md`.
  - Agent: MGSD-AGT-EXE-02
  - Output: `VERIFICATION.md` (pass/fail per dimension)
- [ ] **Step 2:** Run `MGSD-AGT-NEU-01` as final sweep — confirm 0 REWRITE REQUIRED flags across all campaign assets.
  - Agent: MGSD-AGT-NEU-01
  - Output: Final audit report
- [ ] **Step 3:** If any dimension FAILS or any asset shows REWRITE REQUIRED — STOP. Create `[MGSD-BLOCK]` Linear ticket. Do NOT issue Go signal.
  - Agent: MGSD-AGT-OPS-07
  - Output: `[MGSD-BLOCK]` ticket with blocking dimension and remediation step
- [ ] **Step 4:** If all PASS — update Linear campaign Epic status to "Ready to Launch". Write `HANDOFF.md`: `target: human | reason: Go/No-Go decision required | blocking_artifact: VERIFICATION.md | severity: urgent`.
  - Agent: MGSD-AGT-OPS-07
  - Output: `HANDOFF.md` committed; Epic status updated to "Ready to Launch"
- [ ] **Step 5:** Commit with message `mgsd(ops): {campaign_slug} launch-checklist complete — awaiting go/no-go`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 + Gate 2 GREEN | `mir-audit` both ready: true |
| 2 — Variable Resolution | No unresolved tokens in VERIFICATION.md | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | KPIs documented before launch | KPI-FRAMEWORK.md target rows present |
| 4 — Tracking | All events and pixels verified | CAPI checklist PASS; UTM-SPEC.md committed |
| 5 — Creative Compliance | All assets pass VOICE-TONE check | VERIFICATION.md Dimension 5 PASS |
| 6 — Budget Alignment | Final spend within allocated budget | VERIFICATION.md Dimension 6 PASS |
| 7 — Linear Sync | Epic status updated; HANDOFF.md committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | 0 assets with REWRITE REQUIRED status | `MGSD-AGT-NEU-01` final sweep returns `PASSED` |
| Handoff | Human Go/No-Go gate triggered | HANDOFF.md committed; Epic status: Ready to Launch |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-OPS-01 |
| Task Category | Campaign Ops |
| Labels | `[mgsd]`, `[launch]`, `[pre-launch]` |
| Priority | Urgent |
| Estimate | 1–2h |
| Parent Issue | Campaign Launch Epic |
