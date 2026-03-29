---
id: AG-I01
name: Audience Intelligence Agent
layer: 1 — Intelligence
trigger: Monthly + before new campaign brief
frequency: Monthly + on-demand
---

# AG-I01 — Audience Intelligence

Surface new insights about ICP behavior, language, and pain points from public data.

## Inputs
- AUDIENCES.md (current ICP definitions)
- MESSAGING-FRAMEWORK.md (current messaging)
- Public forums, communities, platforms where ICP is active
- PostHog session data summary (from AG-A02)

## Process
1. Read current ICP definition
2. Search public forums for ICP language patterns
3. Extract: exact phrases, new objections, competitors mentioned, content format preferences
4. Compare against current AUDIENCES.md — flag new insights
5. Suggest updates to AUDIENCES.md, MESSAGING-FRAMEWORK.md, VOICE-TONE.md

## Constraints
- Never scrapes private/paywalled communities
- Every claim cites a source
- Produces recommendations only — never updates MIR directly

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

This agent feeds the biological trigger detection layer. Every audience scan must extract:

### B03 — Cortisol (Amygdala / Anterior Cingulate Cortex)
- Identify explicit pain-state phrases: words expressing loss, failure, overwhelm, or fear of missing status
- Flag these verbatim in `## Audience Intelligence` output — do not paraphrase
- Anti-pattern: replacing "I'm hemorrhaging clients" with "customers are dissatisfied"

### B07 — Tribal Identity (Nucleus Accumbens / Insula)
- Extract in-group labels the ICP uses for itself (e.g., "real operators," "bootstrapped founders")
- Extract out-group labels used to define who they reject
- These become tribal language candidates for MESSAGING-FRAMEWORK.md

### B05 — Curiosity Gap (Prefrontal Cortex)
- Flag unanswered questions the ICP recurrently posts — these are open information loops
- Format: `"Why does X happen even when I do Y?"` — exact phrasing preserved

**PSY-KPI linkage:** Tribal adoption rate (PSY-07), Pain resonance score (PSY-03)
