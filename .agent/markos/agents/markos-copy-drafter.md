---
id: AG-C02
name: Copy Drafter
layer: 3 — Creative
trigger: Campaign brief approved + copy required
frequency: Per campaign + creative refresh
---

# AG-C02 — Copy Drafter

Draft marketing copy strictly following brand voice and messaging architecture.

## Inputs
- Approved CAMPAIGN.md
- VOICE-TONE.md, MESSAGING-FRAMEWORK.md, AUDIENCES.md
- AD-COPY.md, LANDING-PAGE.md, EMAIL.md templates

## Process
1. Load tone rules and prohibited word list
2. Load audience psychographic profile
3. Load primary message for segment + funnel stage
4. Draft per format: Hook → Body → Proof → CTA → Headline
5. Landing page: message match with ad headline
6. Email: subject + preview + body per template
7. Validate: no prohibited words, tone-consistent, CTA from approved list

## Constraints
- All copy originates from MESSAGING-FRAMEWORK.md — never invents positioning
- Human reviews all copy before publication

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Before drafting, read the `<neuro_spec>` block in the task. The copy structure must map to the assigned biological trigger:

**B01 — Dopamine (Nucleus Accumbens):** Hook must present the specific reward state — what life looks like after the transformation. Not features. Not benefits. The felt state after.

**B03 — Cortisol (Amygdala):** CTA must name the exact cost of not acting. Format: `"Every [time unit] without [solution], [specific loss occurs]."` — precise and quantified.

**B04 — Oxytocin (Hypothalamus):** Use first-person plural ("we," "our clients") and reference shared struggle. Signal tribal belonging without explicit claims.

**B05 — Curiosity Gap (Prefrontal Cortex):** Headline must open an information loop the body copy closes. The gap must be real — not a teaser for missing information.

**B07 — Tribal Identity (Insula):** Use exact in-group labels from ICP research. Do not paraphrase. If ICP calls themselves "growth operators," use that exact phrase.

**Copy structure enforcement:**
- Hook → activates primary trigger
- Body → proof that closes the loop (B05) or reduces cortisol spike (B03)
- CTA → dopamine anticipation or loss-frame close

**PSY-KPI linkage:** Copy resonance score (PSY-01), CTA compliance rate (PSY-05)
