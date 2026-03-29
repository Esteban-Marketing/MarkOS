---
token_id: MGSD-ITM-ACQ-03
document_class: ITM
domain: ACQ
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-NEU-01
  - MGSD-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 1
---

# MGSD-ITM-ACQ-03 — LinkedIn Outbound Sequence (B2B)

<!-- TOKEN: MGSD-ITM-ACQ-03 | CLASS: ITM | DOMAIN: ACQ -->
<!-- PURPOSE: Linear issue template for producing a LinkedIn outbound prospecting sequence: connection request, follow-up messages, and pivot to meeting. Consumed by mgsd-linear-manager when creating [MGSD] LinkedIn Outbound tickets. Gate 1 required. -->

**Linear Title format:** `[MGSD] LinkedIn Outbound: {segment_name} — {sequence_name} — {N}-touch`
**Category:** Acquisition
**Primary Triggers:** B08 (In-Group Identity), B05 (Pain Relief), B03 (Social Proof)
**Secondary:** B07 (Curiosity Gap — subject/hook line)
**Funnel Stage:** Awareness → Consideration (B2B pipeline)
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B03, §B05, §B07, §B08 |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MGSD-AGT-CNT-04 | agents/mgsd-email-sequence.md | Message sequence generation |
| MGSD-AGT-AUD-01 | agents/mgsd-audience-intel.md | Prospect segment validation |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Message-level neuro audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-ACQ-03 | Acquisition — LinkedIn Outbound -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B03, §B05, §B07, §B08; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Campaigns/` — outbound / B2B pipeline section |
| AGT Assigned | MGSD-AGT-CNT-04 (email-sequence — adapted for LinkedIn messages) + MGSD-AGT-AUD-01 |
| SKL Entry Point | MGSD-SKL-OPS-02 (mgsd-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B08 — In-Group Identity (connection request); B07 — Curiosity Gap (Message 1 hook); B05 — Pain Relief (Message 2–3); B03 — Social Proof (Message 4 pivot)</trigger>
  <brain_region>Basal ganglia + oxytocin (B08); Prefrontal anterior (B07); Amygdala→dorsal raphe (B05); Mirror neurons (B03)</brain_region>
  <activation_method>
    Connection request note: B08 — reference a specific shared signal (same industry event, same niche challenge, mutual connection description). No pitch. No benefit claim. Identity signal only.
    Message 1 (Day 2–3 after connect): B07 — asks one question that creates an unresolvable gap the prospect cannot dismiss ("Are you experiencing [X] since [industry-specific trigger event]?"). No pitch.
    Message 2 (Day 5–7): B05 — names the pain mechanism that causes [X]; offers one-sentence insight the prospect can act on without buying anything. Closes with soft permission request.
    Message 3 (Day 10–12): B03 — shares peer-matched proof (same role, same pain, named outcome) as social context, not as a sales case. No "we helped X" framing — use "You may know [Name] at [Company]..." framing.
    Message 4 (Day 15–18): pivot to meeting — 1 sentence offer of 15-minute call framed around their specific pain established in Message 1.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — Ruler/Sage for C-suite; Hero for Director/VP; archetype determines tone formality]</archetype>
  <funnel_stage>awareness → consideration</funnel_stage>
  <psy_kpi>Connection acceptance rate ≥ {{LI_CONNECT_ACCEPT_TARGET}} | Reply rate ≥ {{LI_REPLY_RATE_TARGET}} | Meeting booked rate ≥ {{LI_MEETING_TARGET}}</psy_kpi>
  <failure_mode>Connection request includes a pitch or benefit claim — identity signal not established; prospect rejects before sequence can begin</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP role, seniority, industry, company size | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | Specific shared signal for connection note (event, community, niche challenge) | Human-provided | [ ] |
| 3 | ICP primary pain and the industry-specific trigger event that surfaces it | Human-provided or `MGSD-AGT-AUD-02` output | [ ] |
| 4 | 1 peer-matched proof subject (same role, same vertical, named outcome) | Human-provided | [ ] |
| 5 | Prohibited words and tone rules | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `mgsd-tools.cjs mir-audit`. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Validate prospect segment peer-match using `MGSD-AGT-AUD-01` — confirm segment role, seniority, and industry match ≥ 2/3 ICP identifiers in AUDIENCES.md. Block if <2 match.
  - Agent: MGSD-AGT-AUD-01
  - Output: Segment validation report (PASS / BLOCK)
- [ ] **Step 3:** Draft all 4 messages + connection request note using `MGSD-AGT-CNT-04` — follow trigger-per-message sequence. Connection note ≤ 300 chars. Messages ≤ 500 chars each. No pitch before Message 4.
  - Agent: MGSD-AGT-CNT-04
  - Output: `LI-OUTBOUND-SEQUENCE-{segment_slug}.md` (5 texts: note + 4 messages, with day-window labels)
- [ ] **Step 4:** Run `MGSD-AGT-NEU-01` — flag: connection note with pitch or benefit claim, Message 1 with product mention, Message 3 with "we helped" framing, Message 4 asking for more than 15 minutes.
  - Agent: MGSD-AGT-NEU-01
  - Output: Per-message audit report
- [ ] **Step 5:** Resolve all `REWRITE REQUIRED` flags. Rerun until all messages `PASSED`.
  - Agent: MGSD-AGT-CNT-04
  - Output: Revised sequence file
- [ ] **Step 6:** Commit with message `mgsd(acquisition): li-outbound {segment_slug} {N}-touch sequence complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN; AUDIENCES.md segment profile present | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in sequence | `grep` returns empty |
| 3 — KPI Baseline | Accept rate, reply rate, meeting rate targets logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | N/A — LinkedIn DM tracking via CRM only | N/A |
| 5 — Creative Compliance | No pitch before Message 4; connection note pure identity signal | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — outbound production only | N/A |
| 7 — Linear Sync | Issue marked Done; sequence file committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | Trigger-per-message sequence intact; connection note ≤ 300 chars; no "we helped" in Message 3 | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-ACQ-03 |
| Task Category | Acquisition |
| Labels | `[mgsd]`, `[linkedin]`, `[outbound]`, `[b2b]`, `[awareness]` |
| Priority | Medium |
| Estimate | 2–3h |
| Parent Issue | B2B Pipeline / Outbound Epic |
