---
token_id: MARKOS-TPL-OPS-16
document_class: TPL
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-NEU-01
  - MARKOS-REF-OPS-01
  - MARKOS-REF-OPS-03
downstream:
  - MARKOS-AGT-OPS-07
mir_gate_required: none
---

# Linear Issue Template Schema — MARKOS Master Task Repository

<!-- TOKEN: MARKOS-TPL-OPS-16 | CLASS: TPL | DOMAIN: OPS -->
<!-- PURPOSE: Defines the canonical markdown structure for every Linear issue Description field created by markos-linear-manager. All MARKOS-ITM-* files are instances of this schema. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — this file is registered under ITM class |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | Trigger catalog (B01–B10) populates `<neuro_spec>` block |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 / Gate 2 status gates every template |
| MARKOS-REF-OPS-03 | references/verification-patterns.md | 7-dimension framework maps to DoD table |
| MARKOS-AGT-OPS-07 | agents/markos-linear-manager.md | Reads this schema to create/update Linear issues |
| MARKOS-AGT-EXE-03 | agents/markos-plan-checker.md | Validates all ITM files against this schema before execution |

---

## Usage

1. Copy `_SCHEMA.md` to `MARKOS-ITM-[DOMAIN]-[NN]-[slug].md`.
2. Replace every `[PLACEHOLDER]` with the concrete value for that template.
3. No `[FILL]` placeholders may remain at execution time except `<archetype>` if archetype-agnostic.
4. Run `MARKOS-AGT-EXE-03` on the file — must return `PASSED` before registering.
5. Register in `_CATALOG.md`, `MARKOS-INDEX.md`, and `agents/markos-linear-manager.md`.

---

## Schema

```markdown
<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-[DOMAIN]-[NN] | [TASK_CATEGORY] -->

## Context Source

| Field              | Value                                                          |
|--------------------|----------------------------------------------------------------|
| Token IDs Required | [comma-separated TOKEN_IDs from MARKOS-INDEX.md]                |
| MIR Gate           | Gate 1 / Gate 2 / none — status must be GREEN before execution |
| MSP Matrix         | [MSP matrix filename and section, or N/A]                     |
| AGT Assigned       | [MARKOS-AGT-XXX-NN — agent responsible for execution]           |
| SKL Entry Point    | [MARKOS-SKL-XXX-NN — skill that spawns this task, or N/A]       |

---

## Neuromarketing Trigger

<neuro_spec>
  <trigger>[B0N — Trigger Name]</trigger>
  <brain_region>[where activated]</brain_region>
  <activation_method>[specific copy or UX mechanism — no abstract descriptions]</activation_method>
  <archetype>[Archetype Name — one-line justification tied to ICP from AUDIENCES.md]</archetype>
  <funnel_stage>[awareness | consideration | decision | onboarding | retention | pre-campaign | pre-launch]</funnel_stage>
  <psy_kpi>[measurable KPI this trigger maps to]</psy_kpi>
  <failure_mode>[behavioral signal indicating the trigger is not activating]</failure_mode>
</neuro_spec>

---

## Input Requirements

All items must be verified present before execution begins. Execution agent blocks if any item is missing.

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | [Noun phrase — no verbs — max 8 words] | [MIR path or "Human-provided"] | [ ] |
| 2 | [Input name] | [Source] | [ ] |

---

## Task Steps

Each step produces exactly one artifact or state change. No step contains interpretation instructions.

- [ ] **Step 1:** [Imperative verb phrase — e.g., "Load VOICE-TONE.md and extract prohibited word list"]
  - Agent: [MARKOS-AGT-XXX-NN]
  - Output: [filename or state change]
- [ ] **Step 2:** [...]
  - Agent: [...]
  - Output: [...]
- [ ] **Step N:** Commit artifact to `.planning/phases/[N]/` with message `markos([category]): [one-line description]`

---

## Definition of Done / Validation

Verification performed by `MARKOS-AGT-EXE-02` (markos-verifier) against `MARKOS-REF-OPS-03`.

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | All referenced MIR fields populated | `markos-tools.cjs mir-audit` returns `gate1.ready: true` |
| 2 — Variable Resolution | Zero `{{VARIABLE}}` tokens unresolved | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | Target metric documented before execution | KPI row filled in KPI-FRAMEWORK.md |
| 4 — Tracking | Events defined; UTMs generated | TRACKING.md non-empty; UTM spec committed |
| 5 — Creative Compliance | Copy matches VOICE-TONE constraints | No prohibited words; tone tag matched |
| 6 — Budget Alignment | Within BUDGET-ALLOCATION.md ceiling | Stated budget ≤ discipline cap |
| 7 — Linear Sync | Issue status reflects execution state | `markos-linear-manager` sync returns 0 drift |
| Neuro Audit | `<neuro_spec>` passes 8-dimension audit | `MARKOS-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | [MARKOS-ITM-XXX-NN] |
| Task Category | [Content Creation / Funnel Build / Audience Research / Campaign Ops / Analytics] |
| Labels | `[markos]`, `[category-slug]`, `[funnel-stage]` |
| Priority | [Urgent / High / Medium / Low] |
| Estimate | [story points or hours] |
| Parent Issue | [Epic ID or campaign ticket ID] |
```

---

## Field Rules

### Input Requirements
- **Required Input:** Noun phrase only. No "the", no active verbs. `ICP primary pain sentence` ✓ — `Write the ICP's pain sentence` ✗
- **Source Document:** Use MIR relative path or `Human-provided`. No TOKEN_IDs in this column.
- **Status:** Always `[ ]` on creation. `[x]` set by agent when confirmed present and non-empty.
- **Blocking rule:** Any `Status: [ ]` at execution time → agent halts, creates `[MARKOS-BLOCK]` ticket, enters idle state.

### Definition of Done
- **Criterion:** Observable state only. `Copy matches VOICE-TONE constraints` ✓ — `Copy reads well` ✗
- **Pass Condition:** Agent-executable binary result. Prefer CLI output, file existence, grep, or agent return value.
- **Neuro Audit row:** Required in all content-producing templates. Pass condition: `AGT-NEU-01 returns PASSED`.
- Operational tasks (MARKOS-ITM-TRK, MARKOS-ITM-OPS): may omit Dimensions 5 and 6, but must mark them `N/A`.

### Task Steps
- Every step → exactly one artifact or state change.
- Every step → `Agent:` and `Output:` sub-fields mandatory.
- No step may contain: "ensure", "consider", "review for quality", "make sure it's good", "high-quality", "best practices", "optimized", "compelling".
- Gate check (MIR audit) is always Step 1 for templates requiring Gate 1 or Gate 2.

---

## Context Mapping Logic

Which MARKOS document classes are mandatory (`✓`) vs. optional (`○`) per task category:

| Task Category | REF-NEU-01 | Gate | Gate 1 MIR Files | Gate 2 MIR Files | MSP Matrix | AGT Required | SKL Entry |
|---------------|-----------|------|-----------------|-----------------|-----------|-------------|----------|
| Content Creation | ✓ B05,B07,B08 | Gate 1 | VOICE-TONE, MESSAGING-FRAMEWORK, AUDIENCES | ○ | ○ | CNT-01/02/03 | SKL-OPS-02 |
| Ad Copywriting | ✓ B02,B05,B06,B09 | Gate 1+2 | VOICE-TONE, MESSAGING-FRAMEWORK | TRACKING | ✓ Paid Acquisition | CNT-02, TRK-02 | SKL-OPS-01 |
| Email Sequence | ✓ B01,B02,B03,B07 | Gate 1 | VOICE-TONE, AUDIENCES | ○ AUTOMATION | ✓ Inbound | CNT-04 | SKL-OPS-02 |
| Lead Magnet Design | ✓ B04,B05,B07 | Gate 1 | MESSAGING-FRAMEWORK, CATALOG | ○ | ✓ Inbound | STR-04, CNT-05 | SKL-OPS-01 |
| Funnel Build | ✓ B02,B05,B06,B09 | Gate 1+2 | All Gate 1 files | TRACKING, AUTOMATION | ✓ Acquisition | STR-01, STR-03 | SKL-OPS-01 |
| Audience Research | ✓ B03,B08 | none | PROFILE, AUDIENCES (seed) | ○ | ○ | AUD-01/02/03 | SKL-ANA-01 |
| Campaign Analytics | ○ | Gate 2 | ○ | KPI-FRAMEWORK, TRACKING | ✓ active | ANA-01/02/04 | SKL-CAM-02 |
| Tracking & UTM Setup | ○ | Gate 2 | ○ | TRACKING, AUTOMATION | ✓ relevant | TRK-01/02 | SKL-OPS-02 |

**Blocking rule:** Any `✓` cell with a missing or `empty`-status file → `[MARKOS-BLOCK]` ticket created before task ticket.
