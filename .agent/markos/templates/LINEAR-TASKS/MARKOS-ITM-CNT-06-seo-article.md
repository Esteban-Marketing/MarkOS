---
token_id: MARKOS-ITM-CNT-06
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

# MARKOS-ITM-CNT-06 — SEO Blog Article

<!-- TOKEN: MARKOS-ITM-CNT-06 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing a keyword-targeted, conversion-linked long-form blog article. Consumed by markos-linear-manager when creating [MARKOS] SEO Article tickets. Gate 1 required. -->

**Linear Title format:** `[MARKOS] SEO Article: {primary_keyword} — {target_funnel_stage}`
**Category:** Content Creation
**Primary Triggers:** B07 (Curiosity Gap), B05 (Pain Relief), B04 (Authority Signal)
**Secondary:** B08 (In-Group Identity)
**Funnel Stage:** Awareness → Consideration
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | §B04, §B05, §B07, §B08 |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MARKOS-AGT-CNT-06 | agents/markos-seo-planner.md | Keyword strategy and article outline |
| MARKOS-AGT-CNT-02 | agents/markos-copy-drafter.md | Long-form article body generation |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Article-level neuro audit |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-CNT-06 | Content Creation — SEO -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-NEU-01 §B04, §B05, §B07, §B08; MARKOS-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Inbound/` — SEO / content discipline section |
| AGT Assigned | MARKOS-AGT-CNT-06 (seo-planner) → MARKOS-AGT-CNT-02 (copy-drafter) |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B07 — Curiosity Gap (H1 and sub-headlines); B05 — Pain Relief (opening section); B04 — Authority (data citations); B08 — In-Group (insider vocabulary throughout)</trigger>
  <brain_region>Prefrontal anterior (B07); Amygdala→dorsal raphe (B05); Prefrontal uncertainty processing (B04); Basal ganglia + oxytocin (B08)</brain_region>
  <activation_method>
    H1 creates an unresolvable information gap for the ICP — cannot be answered from headline alone (B07).
    Opening 2 paragraphs name ICP pain with visceral specificity before any advice or data appears (B05).
    Every data point cited with: source name + year + sample size or methodology (B04). No "studies show".
    Insider vocabulary woven throughout — ICP-specific terms that feel like recognition (B08).
    Internal CTA placed after the highest-value section — ICP has felt the pain and received partial relief; link offers full resolution.
    H2 sub-headlines each open a new curiosity gap within the article — reader cannot skip to next section without feeling incompleteness.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — Sage/Hero typical for educational content]</archetype>
  <funnel_stage>awareness</funnel_stage>
  <psy_kpi>Organic clicks ≥ {{SEO_CLICK_TARGET}} | Time-on-page ≥ 4 min | Internal CTA click rate ≥ {{ARTICLE_CTA_TARGET}}</psy_kpi>
  <failure_mode>Opening paragraph starts with advice or solution — pain induction skipped; reader has no emotional reason to continue</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Primary keyword, secondary keywords (3–5), search volume if known | `MARKOS-AGT-CNT-06` output or Human-provided | [ ] |
| 2 | ICP primary pain and insider vocabulary | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 3 | Competing articles for this keyword (URLs, their headings) | `MARKOS-AGT-AUD-02` (market-researcher) output or Human-provided | [ ] |
| 4 | Internal CTA destination (lead magnet, landing page, or trial) | Human-provided | [ ] |
| 5 | Prohibited words and tone rules | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 6 | Target word count and article format (listicle / narrative / how-to / comparison) | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `markos-tools.cjs mir-audit`. Block if RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate SEO outline using `MARKOS-AGT-CNT-06` — produce: H1 (B07 gap), H2 structure (each H2 opens a new gap), keyword placement map, internal CTA position, meta title and description.
  - Agent: MARKOS-AGT-CNT-06
  - Output: `SEO-OUTLINE-{keyword_slug}.md`
- [ ] **Step 3:** Draft full article body using `MARKOS-AGT-CNT-02` — pain-first opening; each section body follows: pain context → data (B04 cited) → mechanism → partial resolution; insider vocabulary placed in proximity to keyword-dense paragraphs.
  - Agent: MARKOS-AGT-CNT-02
  - Output: `SEO-ARTICLE-DRAFT-{keyword_slug}.md`
- [ ] **Step 4:** Run `MARKOS-AGT-NEU-01` — flag: solution-first opening, uncited data claims, missing insider vocabulary, same-type H2 patterns, CTAs placed before pain induction.
  - Agent: MARKOS-AGT-NEU-01
  - Output: Article audit report
- [ ] **Step 5:** Resolve all `REWRITE REQUIRED` flags. Rerun until `PASSED`.
  - Agent: MARKOS-AGT-CNT-02
  - Output: Revised article draft
- [ ] **Step 6:** Commit with message `markos(seo): article {keyword_slug} draft complete`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN; AUDIENCES.md vocabulary field populated | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in article | `grep` returns empty |
| 3 — KPI Baseline | Organic click target and time-on-page target logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | N/A (tracked via page analytics, not pixel) | N/A |
| 5 — Creative Compliance | No prohibited words; opening is pain-first; all data cited with source+year | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — content production | N/A |
| 7 — Linear Sync | Issue marked Done; article draft committed | markos-linear-manager sync 0 drift |
| Neuro Audit | H1 unresolvable without reading; opening 2 paragraphs pain-only | `MARKOS-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-CNT-06 |
| Task Category | Content Creation |
| Labels | `[markos]`, `[seo]`, `[content]`, `[awareness]` |
| Priority | Medium |
| Estimate | 3–5h per article |
| Parent Issue | Inbound / SEO Content Epic |
