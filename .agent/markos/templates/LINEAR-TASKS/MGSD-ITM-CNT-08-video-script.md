---
token_id: MARKOS-ITM-CNT-08
document_class: ITM
domain: CNT
version: "1.0.0"
status: active
upstream:
  - MARKOS-TPL-OPS-16
  - MARKOS-REF-NEU-01
  - MARKOS-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 1
---

# MARKOS-ITM-CNT-08 — Video Script (VSL / Short-Form)

<!-- TOKEN: MARKOS-ITM-CNT-08 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for writing video sales letter (VSL) or short-form video scripts (Reels, TikTok, YouTube Shorts). Consumed by markos-linear-manager when creating [MARKOS] Video Script tickets. Gate 1 required. -->

**Linear Title format:** `[MARKOS] Video Script: {format} — {offer_or_topic} — {duration}s`
**Category:** Content Creation
**Primary Triggers:** B05 (Pain Relief), B10 (Embodied Cognition), B07 (Curiosity Gap)
**Secondary:** B02 (Loss Aversion for VSL CTA), B03 (Social Proof)
**Funnel Stage:** Awareness (short-form) / Consideration→Decision (VSL)
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | §B02, §B03, §B05, §B07, §B10 |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MARKOS-AGT-CNT-02 | agents/markos-copy-drafter.md | Script drafting |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Script-level neuro audit |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-CNT-08 | Content Creation — Video Script -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-NEU-01 §B02, §B03, §B05, §B07, §B10; MARKOS-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Social/` (short-form) or `MSP/Campaigns/` (VSL) |
| AGT Assigned | MARKOS-AGT-CNT-02 (copy-drafter) |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B05 — Pain Relief (hook and story arc); B10 — Embodied Cognition (sensory product description); B07 — Curiosity Gap (hook line); B02 — Loss Aversion (VSL CTA only); B03 — Social Proof (proof section)</trigger>
  <brain_region>Amygdala→dorsal raphe (B05); Motor + sensory cortex + insula (B10); Prefrontal anterior (B07); Amygdala→orbitofrontal (B02 — VSL only); Mirror neurons (B03)</brain_region>
  <activation_method>
    Hook (first 3 seconds for short-form / first 15 seconds for VSL): opens a curiosity gap with a visceral pain statement — no greeting, no brand name, no context-setting (B07 + B05).
    Product demonstration language uses sensation verbs: "watch how fast", "feel the weight lift", "notice the shift" — never abstract performance claims (B10).
    Short-form structure: Hook → Tension (amplify pain) → Revelation → CTA. Total ≤ target duration.
    VSL structure: Hook → Pain Story → Old Solution Failure → Mechanism Reveal → Proof → Offer → Loss-Frame CTA (B02).
    Proof section: one peer testimonial with role, before metric, after metric, friction sentence — no text on screen; spoken by testimonial subject if possible (B03).
    CTA for VSL: loss-frame — "This closes [date/event]" not "Click to get started".
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — Hero for short-form hooks; Caregiver/Creator for educational VSLs]</archetype>
  <funnel_stage>awareness (short-form) or consideration → decision (VSL)</funnel_stage>
  <psy_kpi>Short-form: Watch completion rate ≥ 60% | VSL: Watch-through to CTA ≥ 30% | Click-to-action rate ≥ {{VIDEO_CTA_TARGET}}</psy_kpi>
  <failure_mode>Hook starts with greeting or brand name — attention lost in first 2 seconds before pain gap is opened</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Format (VSL / Reel / TikTok / YT Short) and target duration in seconds | Human-provided | [ ] |
| 2 | ICP primary pain (one visceral sentence) and core fear | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 3 | Product mechanism (what makes it work — 1 sentence, no jargon) | `MIR/Products/04_PRODUCTS/CATALOG.md` | [ ] |
| 4 | 1 peer testimonial for proof section (role, before metric, after metric, friction sentence) | Human-provided | [ ] |
| 5 | Scarcity/loss element for VSL CTA (real constraint) | Human-provided — VSL only; N/A for short-form | [ ] |
| 6 | Tone rules and prohibited words | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `markos-tools.cjs mir-audit`. Block if RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Draft script using `MARKOS-AGT-CNT-02` — follow structure for the declared format. First word of script must not be a greeting or brand name. Sensation verbs used in product demonstration section. Duration tracked by word count (≈2.5 words/sec).
  - Agent: MARKOS-AGT-CNT-02
  - Output: `VIDEO-SCRIPT-{format}-{slug}.md` (with scene notes and speaker cues)
- [ ] **Step 3:** Run `MARKOS-AGT-NEU-01` — flag: hook starts with greeting; product section uses abstract adjectives; VSL CTA is gain-framed; proof section missing friction sentence; script exceeds target duration.
  - Agent: MARKOS-AGT-NEU-01
  - Output: Script audit report
- [ ] **Step 4:** Resolve all `REWRITE REQUIRED` flags. Rerun until `PASSED`.
  - Agent: MARKOS-AGT-CNT-02
  - Output: Revised script
- [ ] **Step 5:** Commit with message `markos(content): video-script {format} {slug} complete`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in script | `grep` returns empty |
| 3 — KPI Baseline | Watch completion and CTA click targets logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | N/A (tracked via platform analytics) | N/A |
| 5 — Creative Compliance | Hook starts with pain/gap; sensation verbs in product section; VSL CTA loss-framed | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — script production only | N/A |
| 7 — Linear Sync | Issue marked Done; script committed | markos-linear-manager sync 0 drift |
| Neuro Audit | Hook word count ≤ 15 words; first word not a greeting; script within target duration | `MARKOS-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-CNT-08 |
| Task Category | Content Creation |
| Labels | `[markos]`, `[video]`, `[content]`, `[awareness]` or `[decision]` |
| Priority | High |
| Estimate | 2–4h (short-form: 2h; VSL: 4h) |
| Parent Issue | Video / Creative Production Epic |
