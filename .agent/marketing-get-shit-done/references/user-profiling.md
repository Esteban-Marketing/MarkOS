---
token_id: MGSD-REF-OPS-08
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-IDX-000    # MGSD-INDEX.md — master registry
downstream:
  - MGSD-AGT-STR-01  # mgsd-strategist.md — reads profile to frame checkpoints
  - MGSD-REF-OPS-04  # questioning.md — informs discovery question selection
  - MGSD-REF-OPS-07  # checkpoints.md — checkpoint framing uses stakeholder type
mir_gate_required: false
---

# Client and Stakeholder Profiling for MGSD

<!-- TOKEN: MGSD-REF-OPS-08 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines stakeholder archetypes, communication patterns, approval styles, and profiling instructions. Used by agents to select checkpoint framing and question sequences. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-IDX-000 | MGSD-INDEX.md | Entry point — indexes this document |
| MGSD-REF-OPS-04 | questioning.md | Discovery questions that surface profile data |
| MGSD-REF-OPS-07 | checkpoints.md | Checkpoint presenter adapts framing to profile |
| MGSD-REF-NEU-01 | neuromarketing.md | Archetype triggers mapped to stakeholder types |

## Purpose

Understanding who makes decisions and how they communicate enables faster approvals, better checkpoint framing, and more relevant marketing outputs.

## Decision-Maker Profiles

### The Data-Driven Executive
- Needs numbers before any decision
- Checkpoint framing: "Based on {N} data points, the recommended action is X. Expected impact: $Y reduction in CPL."
- Approvals: Show benchmarks, show cost, show expected ROI
- Avoid: Creative-first language, aesthetic arguments without metrics

### The Brand-First Marketer
- Values consistency and brand integrity above performance
- Checkpoint framing: "This approach aligns with your voice guidelines: [quote specific VOICE-TONE.md rule]. Creative is on-brand."
- Approvals: Show brand alignment, show competitor differentiation
- Avoid: Pure performance arguments, generic templates

### The Growth Hacker
- Values speed and iteration over perfection
- Checkpoint framing: "Quick test — $X budget, 5-day flight, kill if CPL > $Y."
- Approvals: Fast, lightweight, reversible decisions
- Avoid: Long approval chains, perfect-is-the-enemy-of-good situations

### The Risk-Averse Founder
- Needs validation before spending
- Checkpoint framing: "Here's what's already been tested in similar markets: [competitor data]. Here's the downside cap: max loss = $X at our stop-loss rule."
- Approvals: Pilot-first framing, clear kill conditions
- Avoid: Big commitments without evidence

## Profiling Checklist (during /mgsd-discuss-phase)

Gather these signals from the first 2-3 interactions:

- [ ] Primary success metric they mention first (CPL? Brand? Volume? Speed?)
- [ ] How they've made past marketing decisions (gut? data? committee?)
- [ ] Budget relationship (flexible/fixed/unknown)
- [ ] Approval chain (sole decision maker? Has to consult?)
- [ ] Timeline pressure (campaign must launch by X?)
- [ ] Past campaign experience (savvy? first-time?)

## Profile Key for CONTEXT.md

Add to CONTEXT.md decisions section:
```markdown
### Stakeholder Profile
- Type: {data-driven | brand-first | growth-hacker | risk-averse}
- Decision style: {solo | committee | consultant-dependent}
- Primary metric focus: {CPL | brand | volume | speed}
- Approval cadence: {synchronous review | async approval | weekly sync}
- Communication preference: {numbers-first | narrative-first | examples-first}
```

## Checkpoint Framing by Profile

Checkpoint language adapts to profile:

| Profile | Creative Approval Framing | Budget Decision Framing |
|---------|--------------------------|------------------------|
| Data-Driven | "A/B test results from similar audiences show X format wins 70% of the time" | "Budget at $X/day yields CPL of $Y at current CVR" |
| Brand-First | "Copy follows tone rule [X] — avoids prohibited words [list]" | "Budget allocation is consistent with brand-level positioning" |
| Growth Hacker | "Ship v1, iterate in 5 days" | "Set $X cap with kill switch at 2x target CPL" |
| Risk-Averse | "Competitor [X] ran this exact approach for 3 months" | "Pilot: $X for 2 weeks. Only scale if CPL < $Y" |
