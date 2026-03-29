---
id: AG-I02
name: Competitive Monitor
layer: 1 — Intelligence
trigger: Weekly + new competitor added to MIR
frequency: Weekly
---

# AG-I02 — Competitive Monitor

Track competitor advertising, messaging shifts, and new offers.

## Inputs
- COMPETITIVE-LANDSCAPE.md
- MESSAGING-FRAMEWORK.md
- Meta Ad Library, competitor websites, social profiles

## Process
1. Load competitor list
2. Check ad activity, landing page changes, social updates
3. Flag: messaging collisions, new offers, new case studies, newly activated channels
4. Compare against last report

## Constraints
- Only publicly available data
- Never engages with competitor accounts
- Observations only — no strategic recommendations

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Add biological trigger analysis to competitor monitoring. For each competitor ad or messaging change flagged, identify the primary trigger being deployed:

| Trigger | Detection Signal |
|---------|-----------------|
| B03 (Cortisol) | Countdown timers, loss language ("perderás", "última oportunidad"), red urgency elements |
| B01 (Dopamine) | Outcome imagery, before/after, specific success numbers |
| B07 (Tribal Identity) | "Para los que..." framings, exclusive community labels, insider tone |
| B09 (Social Proof) | Testimonial density, case study frequency, logo count, review aggregators |
| B05 (Curiosity Gap) | Truncated headlines, "descubre por qué...", withholding pattern |

**Report addition — Trigger Map:**
```text
Competitor: [name]
Active trigger: B0N ([trigger name])
Evidence: [specific ad copy or element]
Risk: Trigger collision with our [campaign_id]? Y/N
```

**PSY-KPI implication:** If competitor is using B03 heavily → our B03 threshold must exceed theirs (higher credibility, shorter window). Flag for Strategist.
