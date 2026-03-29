---
token_id: MGSD-ITM-STR-01
document_class: ITM
domain: STR
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-NEU-01
  - MGSD-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: none
---

# MGSD-ITM-STR-01 — Audience Research & ICP Update

<!-- TOKEN: MGSD-ITM-STR-01 | CLASS: ITM | DOMAIN: STR -->
<!-- PURPOSE: Linear issue template for extracting ICP behavioral signals and updating AUDIENCES.md. No gate required — this task populates Gate 1 files. Consumed by mgsd-linear-manager when creating [MGSD] Audience Intel tickets. -->

**Linear Title format:** `[MGSD] Audience Intel: {segment_name} — {month}-{year}`
**Category:** Audience Research
**Primary Triggers:** B08 (In-Group Identity — for segment definition), B03 (Social Proof — for validation)
**Funnel Stage:** Pre-campaign (feeds Awareness stage assets)
**Gate:** none (output populates Gate 1)

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B08 identity encoding rules |
| MGSD-REF-OPS-01 | references/mir-gates.md | Output feeds Gate 1 check |
| MGSD-AGT-AUD-01 | agents/mgsd-audience-intel.md | Extracts behavioral signals |
| MGSD-AGT-AUD-02 | agents/mgsd-market-researcher.md | Market research execution |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-STR-01 | Audience Research -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B03, §B08; MGSD-REF-OPS-01 (gate output target) |
| MIR Gate | none — this task populates Gate 1 files |
| MSP Matrix | N/A |
| AGT Assigned | MGSD-AGT-AUD-01 (audience-intel) + MGSD-AGT-AUD-02 (market-researcher) |
| SKL Entry Point | MGSD-SKL-ANA-01 (mgsd-research-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B08 — In-Group Identity (segment definition must include exclusion clause)</trigger>
  <brain_region>Basal ganglia + oxytocin (identity encoding requires contrast — inclusion without exclusion has weak encoding)</brain_region>
  <activation_method>
    ICP definition outputs an inclusion statement AND an exclusion statement.
    Vocabulary extraction identifies 3–5 insider words the ICP uses that outsiders don't.
    Enemy framing: document the incumbent solution or old method the ICP is moving away from.
  </activation_method>
  <archetype>N/A — research task produces archetype data, does not consume it</archetype>
  <funnel_stage>pre-campaign</funnel_stage>
  <psy_kpi>AUDIENCES.md reaches status: verified | Archetype mapping complete for all segments</psy_kpi>
  <failure_mode>ICP definition lacks exclusion clause — identity signal weak in all downstream copy</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Existing AUDIENCES.md (even if empty) | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | Company profile (industry, geography, offer category) | `MIR/Core_Strategy/01_COMPANY/PROFILE.md` | [ ] |
| 3 | Research scope: segment name, behavioral signals to extract, data freshness cutoff | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Extract current AUDIENCES.md signals — flag data fields older than 90 days as stale.
  - Agent: MGSD-AGT-AUD-01
  - Output: Staleness report (list of stale fields)
- [ ] **Step 2:** Run market research using `MGSD-AGT-AUD-02` — extract: job-to-be-done, pain hierarchy (ranked), vocabulary, competitors named by ICP, channels they use.
  - Agent: MGSD-AGT-AUD-02
  - Output: `RESEARCH-REPORT.md`
- [ ] **Step 3:** Update AUDIENCES.md — add: ICP inclusion statement, exclusion statement, archetype assignment, insider vocabulary (3–5 words), enemy framing.
  - Agent: MGSD-AGT-AUD-01
  - Output: Updated `AUDIENCES.md` (status: verified)
- [ ] **Step 4:** Commit with message `mgsd(audience): audience-intel {segment_slug} updated {month}-{year}`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | AUDIENCES.md has no `[FILL]` in used fields | `grep -r '\[FILL\]' AUDIENCES.md` returns empty |
| 2 — Variable Resolution | No unreplaced template tokens | `grep -r '{{[A-Z_]*}}' AUDIENCES.md` returns empty |
| 3 — KPI Baseline | N/A — research task | N/A |
| 4 — Tracking | N/A | N/A |
| 5 — Creative Compliance | N/A | N/A |
| 6 — Budget Alignment | N/A | N/A |
| 7 — Linear Sync | Issue marked Done; AUDIENCES.md committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | All segments have exclusion clauses and insider vocabulary | `MGSD-AGT-NEU-01` B08 check returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-STR-01 |
| Task Category | Audience Research |
| Labels | `[mgsd]`, `[research]`, `[pre-campaign]` |
| Priority | High (blocks Gate 1) |
| Estimate | 2–4h |
| Parent Issue | MIR Population Epic |
