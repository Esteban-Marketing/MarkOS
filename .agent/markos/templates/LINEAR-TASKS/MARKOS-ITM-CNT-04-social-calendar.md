---
token_id: MARKOS-ITM-CNT-04
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

# MARKOS-ITM-CNT-04 — Social Media Content Calendar

<!-- TOKEN: MARKOS-ITM-CNT-04 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing a monthly organic social media content calendar across channels. Consumed by markos-linear-manager when creating [MARKOS] Social Calendar tickets. Gate 1 required. -->

**Linear Title format:** `[MARKOS] Social Calendar: {channel} — {month}-{year}`
**Category:** Content Creation
**Primary Triggers:** B01 (Variable Reward), B07 (Curiosity Gap), B08 (In-Group Identity)
**Secondary:** B03 (Social Proof)
**Funnel Stage:** Awareness → Consideration (organic retention)
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | §B01, §B07, §B08 trigger definitions |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MARKOS-AGT-CNT-03 | agents/markos-social-drafter.md | Drafts per-post copy per channel format |
| MARKOS-AGT-OPS-04 | agents/markos-calendar-builder.md | Generates calendar structure from MSP matrices |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Post-level neuro audit |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-CNT-04 | Content Creation — Social Media -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-NEU-01 §B01, §B07, §B08; MARKOS-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Social/` — relevant discipline section |
| AGT Assigned | MARKOS-AGT-OPS-04 (calendar-builder) → MARKOS-AGT-CNT-03 (social-drafter) |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B01 — Variable Reward (posting cadence); B07 — Curiosity Gap (hooks); B08 — In-Group Identity (tribal language); B03 — Social Proof (testimonial posts)</trigger>
  <brain_region>Nucleus accumbens (B01); Prefrontal anterior (B07); Basal ganglia + oxytocin (B08); Mirror neuron network (B03)</brain_region>
  <activation_method>
    Post cadence is irregular — content type rotates unpredictably (education, story, proof, offer) to prevent dopamine habituation (B01).
    Hook line of every post creates an information gap resolvable only by reading past the first sentence (B07).
    Every 4th post uses insider vocabulary and exclusion framing to reinforce tribe identity (B08).
    Testimonial posts include: named person, ICP-matching role, specific before/after metric, friction sentence (B03).
    No identical post structure two days in a row.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — varies by channel: LinkedIn → Ruler/Sage; Instagram → Hero/Creator]</archetype>
  <funnel_stage>awareness</funnel_stage>
  <psy_kpi>Follower growth rate ≥ {{SOCIAL_FOLLOWER_GROWTH_TARGET}} | Engagement rate ≥ {{SOCIAL_ENG_TARGET}} | Save/share rate ≥ {{SOCIAL_SAVE_TARGET}}</psy_kpi>
  <failure_mode>Engagement drops after week 2 — posting pattern became predictable; no cadence variation; all posts same content type</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Target channels (LinkedIn, Instagram, TikTok, X) and post frequency per channel | Human-provided or MSP Social discipline | [ ] |
| 2 | ICP insider vocabulary (3–5 words), exclusion statement, enemy framing | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 3 | Prohibited words, tone rules per channel context | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 4 | Content pillars (education, proof, culture, offer) and ratio per channel | `MIR/Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | [ ] |
| 5 | Month/year and any campaign-linked dates (launches, events) | Human-provided | [ ] |
| 6 | 1 peer testimonial for B03 post (name, role, before/after metric, friction sentence) | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `markos-tools.cjs mir-audit`. Block if RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate calendar structure using `MARKOS-AGT-OPS-04` — assign content type per slot (education/proof/culture/offer) per channel across the month; mark cadence variation points.
  - Agent: MARKOS-AGT-OPS-04
  - Output: `SOCIAL-CALENDAR-{month}-{year}.md` (skeleton with slot types, no copy yet)
- [ ] **Step 3:** Draft post copy for every slot using `MARKOS-AGT-CNT-03` — each post: hook (B07 gap), body (VOICE-TONE compliant, insider vocabulary), CTA or question. Format to platform character/format spec.
  - Agent: MARKOS-AGT-CNT-03
  - Output: `SOCIAL-CALENDAR-{month}-{year}.md` (copy filled in all slots)
- [ ] **Step 4:** Run `MARKOS-AGT-NEU-01` on calendar as a batch — flag posts with: forbidden words, predictable structure runs (same type 3+ consecutive slots), gain-framed CTAs in offer posts.
  - Agent: MARKOS-AGT-NEU-01
  - Output: Audit report with per-post flags
- [ ] **Step 5:** Resolve all `REWRITE REQUIRED` flags — substitute flagged posts with corrected versions.
  - Agent: MARKOS-AGT-CNT-03
  - Output: Revised calendar
- [ ] **Step 6:** Commit with message `markos(social): content-calendar {channel} {month}-{year} complete`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in calendar | `grep` returns empty |
| 3 — KPI Baseline | Engagement rate and follower growth targets logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | N/A — organic content, no pixel | N/A |
| 5 — Creative Compliance | No prohibited words; insider vocabulary used ≥ 1× per 4 posts | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — organic production | N/A |
| 7 — Linear Sync | Issue marked Done; calendar committed | markos-linear-manager sync 0 drift |
| Neuro Audit | 0 REWRITE REQUIRED; no 3+ consecutive same-type posts | `MARKOS-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-CNT-04 |
| Task Category | Content Creation |
| Labels | `[markos]`, `[social]`, `[organic]`, `[awareness]` |
| Priority | Medium |
| Estimate | 4–6h per channel per month |
| Parent Issue | Organic Social Epic |
