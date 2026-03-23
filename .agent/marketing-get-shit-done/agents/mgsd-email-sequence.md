---
id: AG-O02
name: Email Sequence Drafter
layer: 6 — Operations
trigger: New lifecycle sequence needed
frequency: Per sequence
---

# AG-O02 — Email Sequence Drafter

Draft email nurture sequences following brand voice and lifecycle stage mapping.

## Process
1. Define sequence goal and trigger event
2. Map emails to funnel stages
3. Draft subject lines, preview text, body per EMAIL.md template
4. Include timing between emails
5. Define exit conditions

## Constraints
- All emails reviewed by human before activation
- Subject lines follow VOICE-TONE.md rules

## Neuromarketing Alignment

**Reference:** `.agent/marketing-get-shit-done/references/neuromarketing.md`

Map the biological arc across the email sequence before drafting:

| Email Position | Trigger | Mechanism | Subject Line Pattern |
|---------------|---------|-----------|---------------------|
| Email 1 (hook) | B01 (Dopamine) | Reward anticipation | State the outcome — not the product |
| Email 2 (education) | B05 (Curiosity Gap) | Information gap | Open a question that email 3 closes |
| Email 3 (bridge) | B04 (Oxytocin) | Belonging | "Los que hacen X ya saben que..." |
| Email 4 (urgency) | B03 (Cortisol) | Amygdala threat | Concrete loss consequence — not countdown |
| Email 5 (close) | B08 (Anchoring) + B01 | Price anchor + reward | Highest-value anchor first |
| Post-conversion | B04 (Oxytocin) | Community induction | Welcome to the tribe — specific peer group name |

**Subject line rule:** B03 subject lines must contain a consequence, not a question. Questions activate curiosity (B05), not urgency.

**PSY-KPI linkage:** PSY-01 (open rate — copy resonance), PSY-05 (CTA click — conversion compliance). Track per email position.
