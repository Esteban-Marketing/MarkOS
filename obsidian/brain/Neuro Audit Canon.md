---
date: 2026-04-16
description: "Neuro Audit Canon — the ten biological triggers (B01–B10) that the Neuro Auditor enforces. How to apply, when to apply, and how to avoid manipulation."
tags:
  - brain
  - canon
  - neuro
  - triggers
---

# Neuro Audit Canon

> MarkOS campaigns carry an optional `<neuro_spec>` block that maps funnel stages to biological triggers. When declared, the Neuro Auditor (`MARKOS-AGT-NEU-01`) validates that the copy and creative actually activate the intended triggers. Canonical source: `.agent/markos/references/neuromarketing.md` (MARKOS-REF-NEU-01).

## The ten triggers

| Code | Trigger | Brain | Behavioral output | When to use |
|---|---|---|---|---|
| **B01** | Variable Reward | Nucleus accumbens (dopamine) | compulsive return, scroll, purchase impulse | engagement mechanics, content drops |
| **B02** | Loss Aversion | Amygdala / OFC (norepinephrine) | avoidance behaviour 2.5× approach | trial expiry, phantom ownership |
| **B03** | Social Proof Cascade | ACC + mirror neurons (oxytocin) | conformity, herd validation | testimonials, user counts |
| **B04** | Authority | PFC + status evaluation | deference to expertise | expert quotes, credentials |
| **B05** | Reciprocity | Insula + OFC | return-the-favor behavior | free value upfront |
| **B06** | Scarcity | Amygdala + value evaluation | urgency, increased perceived value | limited quantity / time |
| **B07** | Commitment & Consistency | PFC self-concept | small-yes → big-yes ladder | micro-conversions first |
| **B08** | Curiosity Gap | Dopamine anticipation | seek-to-close behavior | teasers, open loops |
| **B09** | Pattern Interrupt | Salience network | attention capture | novel framing |
| **B10** | Tribal Belonging | Oxytocin + in-group markers | community identification | "you vs. them", rituals |

## Activation rules

Each trigger has activation conditions. A message that declares `B02` but has no established pre-ownership fails the audit. Key rules:

- **B01 Variable Reward** — reward magnitude must vary across sends; fixed-schedule drops habituate.
- **B02 Loss Aversion** — requires *phantom ownership* first ("your 30-day access expires"). Pure scarcity without ownership is B06, not B02.
- **B03 Social Proof** — must be specific and recent (numbers + names; "thousands of customers" is weak).
- **B04 Authority** — named expert, real credential, relevant to claim.
- **B05 Reciprocity** — free gift must be genuinely valuable; tokens of value trigger resistance.
- **B06 Scarcity** — real scarcity only; fake deadlines destroy trust within weeks.
- **B07 Commitment** — start with a micro-yes the audience won't regret (email, signup, small step).
- **B08 Curiosity Gap** — open loop must be closable; unclosed loops register as clickbait.
- **B09 Pattern Interrupt** — subverts the audience's expected format; works once, habituates fast.
- **B10 Tribal Belonging** — in-group markers specific to the archetype (language, heroes, enemies).

## `<neuro_spec>` block schema

```xml
<neuro_spec>
  <funnel_stage>awareness|interest|consideration|decision|retention|advocacy</funnel_stage>
  <primary_trigger code="B04" justification="expert-led explanation of cost efficiency"/>
  <secondary_trigger code="B03" justification="case study + user count"/>
  <pre_conditions>
    <condition>ownership established in prior touch</condition>
  </pre_conditions>
  <anti_patterns_avoided>
    <pattern>fake scarcity</pattern>
    <pattern>authority bluff</pattern>
  </anti_patterns_avoided>
</neuro_spec>
```

The Neuro Auditor verifies:

1. Trigger code is valid.
2. Funnel stage → trigger mapping is recommended.
3. Pre-conditions are met in prior touches.
4. Anti-patterns are absent in the draft.
5. The draft copy actually contains trigger-activating language (not just a claim).

## Funnel stage → recommended triggers

| Stage | Dominant triggers |
|---|---|
| Awareness | B09 pattern interrupt · B08 curiosity gap · B10 tribal belonging |
| Interest | B04 authority · B03 social proof · B05 reciprocity |
| Consideration | B03 social proof · B04 authority · B07 commitment ladder |
| Decision | B02 loss aversion · B06 scarcity · B07 commitment |
| Retention | B01 variable reward · B05 reciprocity · B10 tribal belonging |
| Advocacy | B10 tribal belonging · B05 reciprocity · B03 social proof |

## Ethical fence

Triggers amplify; they do not justify manipulation. Rejection criteria:

- Fabricated urgency / scarcity.
- Invented testimonials / authority.
- Dark-pattern copy that exploits vulnerable audiences.
- Anti-competitor fear-mongering outside fair-comparison norms.
- Claims unsupported by the claim library (see [[Brand System Canon]]).

The EU AI Act (Art. 5) bans manipulative subliminal techniques. See [[EU AI Act for Marketers]].

## Neuro Auditor agent

- **TOKEN_ID** — `MARKOS-AGT-NEU-01`.
- **Input** — plan with `<neuro_spec>` + draft artifact.
- **Output** — audit report: pass / conditional / fail, with evidence per trigger.
- **Failure modes** — rewrite with trigger hints, or downgrade plan to no-neuro mode.
- **Mandatory?** — only when `<neuro_spec>` is declared; always recommended for Decision + Retention stages.

## Operator workflow

1. Strategist declares neuro architecture at plan time.
2. Copy Drafter generates with trigger hints baked into the prompt.
3. Neuro Auditor scores draft.
4. Any fail loops to drafter; pass moves to brand voice + legal audit.
5. Approved artifact dispatched.

## Pitfalls

- **Trigger stacking** — more than 2 primary triggers per message dilutes each.
- **Trigger without substance** — copy with B04 markers but no real authority reads as pompous.
- **Copy-pasted triggers** — reusing the same phantom-ownership phrasing across 10 messages trains audience to pattern-match and discount.
- **Ignoring anti-patterns** — fake scarcity works in the short term, erodes trust over months.
- **Applying to wrong archetype** — some audiences (technical, senior) discount heavy trigger language; restraint scores higher.

## Related

- [[MarkOS Canon]] · [[Message Crafting Pipeline]] · [[Brand System Canon]] · [[Communication Guides]] · [[Buyer Psychology & Neuro Triggers]] · [[EU AI Act for Marketers]] · [[Neuro Triggers]]
