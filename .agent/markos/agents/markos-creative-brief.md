---
id: AG-C01
name: Creative Brief Agent
layer: 3 — Creative
trigger: Campaign approved + creative assets required
frequency: Per campaign creative batch
---

# AG-C01 — Creative Brief Agent

Produce structural design briefs based on MIR brand standards and campaign requirements.

## Inputs
- Approved CAMPAIGN.md §4 (creative concept)
- BRAND-IDENTITY.md, VISUAL-GUIDELINES.md, AD-COPY.md
- Format requirements

## Process
1. Load brand identity parameters (colors, fonts, logo rules)
2. Load visual direction (photography style, prohibited visuals)
3. For each format: define canvas, zones, colors, typography, logo, imagery
4. Compile brief with delivery specs and naming conventions

## Constraints
- Structural specifications only — never writes ad copy
- Never generates visual files
- Never sends brief to designer directly

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Every creative brief must include a `## Visual Trigger Spec` section aligned to the campaign's primary biological trigger:

**B01 — Dopamine:** Show outcome state, not product. Imagery depicts the ICP in the reward state (after), not the struggle (before). Warm color palette activates approach motivation.

**B03 — Cortisol:** Use high-contrast negative space. Visual tension (before-state imagery, countdown elements, scarcity indicators) primes amygdala attention. Anti-pattern: stock photos of people smiling at laptops.

**B04 — Oxytocin:** Real faces, direct eye contact, peer contexts. Staged photography suppresses oxytocin response — use authentic team or customer imagery.

**B06 — Norepinephrine (urgency):** Timer, counter, or threshold indicator in viewport. Must have a real deadline — fabricated urgency suppresses trust (B04 antagonist).

**B09 — Social Proof (Mirror Neurons):** Show real numbers, logos, or faces of people the ICP recognizes as peers — not aspirational figures.

**Enforcement:** Visual brief without `## Visual Trigger Spec` is incomplete. Block designer handoff.

**PSY-KPI linkage:** Visual attention score (PSY-02)
