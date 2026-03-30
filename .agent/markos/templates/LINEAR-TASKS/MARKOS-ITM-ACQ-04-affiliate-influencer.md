<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-ACQ-04 | Affiliate & Influencer Activation -->

## Context Source

| Field              | Value                                                          |
|--------------------|----------------------------------------------------------------|
| Token IDs Required | MARKOS-REF-NEU-01, MARKOS-REF-OPS-01, MARKOS-AGT-STR-04            |
| MIR Gate           | Gate 1 — status must be GREEN before execution                 |
| MSP Matrix         | MSP/Campaigns/05_AFFILIATE_INFLUENCER.md                       |
| AGT Assigned       | MARKOS-AGT-STR-04 (creative-brief), MARKOS-AGT-CNT-02 (copy-drafter) |
| SKL Entry Point    | MARKOS-SKL-OPS-02 (execute-phase)                                |

---

## Neuromarketing Trigger

<neuro_spec>
  <trigger>B03 — Cortisol/Amygdala — Fear of missing out on social validation; B05 — Dopamine — Status through association</trigger>
  <brain_region>Amygdala (B03 social threat) + Mesolimbic (B05 reward anticipation)</brain_region>
  <activation_method>Influencer endorsement creates social proof via peer authority. The ICP sees someone they identify with using and vouching for the product — reducing perceived risk and triggering status-by-association desire.</activation_method>
  <archetype>Sage — influencer as trusted expert guide already on the journey ICP-1 wants to begin</archetype>
  <funnel_stage>awareness / consideration</funnel_stage>
  <psy_kpi>PSY-02 — authority transfer score (influencer post engagement rate vs. brand post baseline)</psy_kpi>
  <failure_mode>Low engagement on influencer content — influencer audience doesn't match ICP-1 profile; or content reads as paid placement not authentic endorsement</failure_mode>
</neuro_spec>

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP-1 definition — psychographic match criteria for influencer selection | `Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | VOICE-TONE.md — permitted/prohibited language for creator briefs | `Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 3 | MESSAGING-FRAMEWORK.md — value props for creator content | `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | [ ] |
| 4 | Product/offer to promote | `Products/04_PRODUCTS/CATALOG.md` | [ ] |
| 5 | Affiliate commission structure approved | Human-provided | [ ] |
| 6 | Legal disclosure requirements confirmed | Human-provided (legal review required) | [ ] |
| 7 | Influencer budget per tier | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check. Block if gate1.ready: false.
  - Agent: MARKOS-AGT-OPS-01
  - Output: gate status confirmed

- [ ] **Step 2:** Define influencer selection criteria from ICP-1 profile: audience size tier (nano/micro/macro), platform, niche match, engagement rate minimum (`{{MIN_ENGAGEMENT_RATE}}`), and ICP-1 alignment score.
  - Agent: MARKOS-AGT-AUD-01
  - Output: `influencer-criteria.md`
  - **⏸ HUMAN CHECKPOINT: Approve selection criteria before outreach**

- [ ] **Step 3:** Generate a shortlist of 10–15 candidate creators matching criteria. Include: profile URL, estimated audience size, engagement rate, ICP match rationale.
  - Agent: MARKOS-AGT-AUD-04 (market-scanner)
  - Output: `influencer-shortlist.md`
  - **⏸ HUMAN CHECKPOINT: Human selects final partners from shortlist**

- [ ] **Step 4:** ⚠️ LEGAL REVIEW CHECKPOINT — Draft FTC/FTCA disclosure language for creator briefs. Human legal review required before any creator receives a brief.
  - Agent: N/A — Human fills
  - Output: `disclosure-language.md`
  - **⛔ HARD BLOCK until human provides legal-approved disclosure copy**

- [ ] **Step 5:** Create creator brief using `MARKOS-AGT-STR-04` (creative-brief). Include: campaign objective, key message (from MESSAGING-FRAMEWORK.md), mandatory disclosures, content do's/don'ts (from VOICE-TONE.md), deliverables, timeline.
  - Agent: MARKOS-AGT-STR-04
  - Output: `creator-brief-{influencer-slug}.md`
  - **⏸ HUMAN CHECKPOINT: Review brief before sending to creator**

- [ ] **Step 6:** Set up affiliate tracking: unique UTM + discount code per creator. Document in TRACKING.md.
  - Agent: MARKOS-AGT-TRK-02 (utm-architect)
  - Output: UTM spec in `tracking-spec.md`

- [ ] **Step 7:** Configure affiliate payout structure in CRM: `{{COMMISSION_TYPE}}` (flat fee / % of revenue / hybrid). Commission rate: `{{COMMISSION_RATE}}`.
  - Agent: N/A — Human configures in platform
  - **⏸ HUMAN CHECKPOINT: Confirm payout configured in affiliate platform**

- [ ] **Step 8:** Monitor content after posting: engagement rate vs. `{{MIN_ENGAGEMENT_RATE}}`, traffic driven (PostHog UTM attribution), conversions tracked.
  - Agent: MARKOS-AGT-ANA-02 (performance-monitor)
  - Output: `influencer-performance-{YYYYMM}.md`

- [ ] **Step 9:** Commit all artifacts: `mktg(affiliate): [influencer-slug] — activation complete`
  - Agent: MARKOS-AGT-EXE-01
  - Output: committed artifacts, SUMMARY.md

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 files complete | `mir-audit` returns `gate1.ready: true` |
| 2 — Variable Resolution | Zero `{{VARIABLE}}` tokens in creator brief | `grep -r '{{[A-Z_]*}}'` in brief returns empty |
| 3 — KPI Baseline | Conversion target per influencer documented | `COMMISSION_RATE` + `INFLUENCER_CVR_TARGET` filled |
| 4 — Tracking | Unique UTM + discount code per creator | TRACKING.md has per-creator tracking parameters |
| 5 — Creative Compliance | Brief copy follows VOICE-TONE; disclosures included | VOICE-TONE check passed; legal disclosure in brief |
| 6 — Budget Alignment | Total influencer spend ≤ budget cap | Cost ≤ `INFLUENCER_BUDGET` in MSP matrix |
| 7 — Linear Sync | Issue status reflects execution state | `markos-linear-manager` sync returns 0 drift |
| Neuro Audit | B03/B05 triggers present in brief framing | `MARKOS-AGT-NEU-01` returns `PASSED` |
| Legal | FTC disclosure approved by human | Human legal sign-off documented |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-ACQ-04 |
| Task Category | Acquisition — Affiliate & Influencer |
| Labels | `markos`, `affiliate`, `influencer`, `acquisition`, `legal-required` |
| Priority | High |
| Estimate | 10–16 story points |
| Parent Issue | Campaign Epic ID |
| Linear Title Format | `[MARKOS] Influencer Activation: {creator_name} — {platform} — {campaign_name}` |
