---
date: 2026-04-16
description: "MarkOS Brand System Canon — identity, personality, voice, style, visual, claim library, taboos. The deterministic contract that the voice classifier enforces."
tags:
  - brain
  - canon
  - brand
  - voice
---

# Brand System Canon

> Brand is not a mood, it is a **contract**. MarkOS treats brand as a deterministic, machine-enforceable system. The voice classifier, creative brief agent, and neuro auditor all read from the same brand pack. When a human operator asks "is this on-brand?", the classifier answers, not taste.

## The six layers

```
1. Identity      — who the brand is (mission · values · promise)
2. Personality   — how it behaves (archetype · temperament · tensions)
3. Positioning   — where it plays (category · differentiation · proofs)
4. Voice         — how it speaks (lexicon · cadence · register · taboos)
5. Style         — how it looks (visual · motion · type · color)
6. Substance     — what it can claim (claim library · fences)
```

Each layer produces machine-readable tokens. Those tokens live in `lib/markos/theme/brand-pack.ts` in code, `.markos-local/MIR/brand-pack.md` in the vault.

## v2 Brand Pack Requirement

The v2 foundation makes the brand pack a launch-critical activation step, not a later polish layer.

- Brand Pack Wizard must complete in roughly 8-12 minutes inside the under-30-minute onboarding target.
- Brand pack completion target is 85%+ for activated accounts.
- Voice classifier score is persisted on every artifact and should average at least 82% for shipped agent types.
- Claim library rows need evidence, scope, decay date, and review status before claims appear in customer-facing output.
- The brand pack feeds the approval inbox, content brief, social response drafting, weekly narrative, and Tenant 0 case studies.
- See [[Marketing Operating System Foundation]] and [[MarkOS v2 Operating Loop Spec]].

## Layer 1 — Identity

| Field | Shape |
|---|---|
| Mission | 1 sentence |
| Vision | 1 sentence, time-scoped |
| Core values | 3–5, each w/ behavioral definition |
| Brand promise | what the customer can count on, always |
| Point of view | what the brand believes that the market does not |

## Layer 2 — Personality

| Field | Shape |
|---|---|
| Archetype | Jung-style (Sage · Creator · Rebel · Magician · Hero · Lover · Jester · Caregiver · Explorer · Ruler · Innocent · Everyman) |
| Temperament | 5 sliders: formal↔casual · serious↔playful · direct↔diplomatic · rational↔emotional · reserved↔expressive |
| Tension | the on-brand contradiction (e.g. "serious about outcomes, playful in voice") |
| Adjacencies | "would / wouldn't sit at the same table as…" |
| Human analog | "this brand is the kind of person who…" |

## Layer 3 — Positioning

| Field | Shape |
|---|---|
| Category | named space (e.g. "Agentic Marketing OS") |
| Anchor competitor | the foil used in messaging |
| Frame of reference | what the audience compares against |
| Differentiation | the unique substantive claim |
| Reasons to believe | 3–5 proofs (capabilities, testimonials, data) |

## Layer 4 — Voice

This is the enforceable layer. Voice rules are checked by the classifier before publish.

| Field | Shape |
|---|---|
| Lexicon — prefer | list of words we use |
| Lexicon — avoid | list of words we never use |
| Taboos | subjects or framings the brand never touches |
| Sentence length | min / avg / max |
| Register | academic / professional / conversational / street |
| Reading level | target grade band (e.g. 7–9 for marketing copy) |
| Cadence | staccato / flowing / mixed |
| Humor | allowed / forbidden / dry-only / situational |
| Pronouns | we / you ratio; first-person policy |
| Emoji policy | forbidden / allowed in social / always |
| Punctuation | em-dash · Oxford comma · exclamation marks |
| Disclaimers | required formulations |

Each rule is either hard (binary pass/fail) or soft (score contributing to a voice score). Hard rule failure blocks publish; soft scores aggregate to a threshold.

## Layer 5 — Style (visual)

| Field | Shape |
|---|---|
| Logo usage | clear space, minimum size, forbidden placements |
| Type system | primary / secondary / monospace / weights |
| Color tokens | HSL + semantic roles (brand, action, warn, surface) |
| Spacing grid | base unit, vertical rhythm |
| Imagery style | photography / illustration / 3D / hybrid + mood references |
| Motion language | easing curves, duration defaults |
| Accessibility | WCAG 2.2 AA minimum; AAA for marketing critical paths |
| AI-gen style | LoRA + prompt suffix for brand-consistent AI images |

## Layer 6 — Substance (Claim Library)

The **claim library** is the single source of truth for what the brand is allowed to say. Organized as rows:

| Claim | Evidence | Scope | Decay |
|---|---|---|---|
| "Reduces CAC by 30% in 90 days" | case study X, Y | B2B SaaS Tier-1 | 12 months |
| "Sets up in under 10 minutes" | internal timing doc | all | 6 months |

Rules:

1. No claim without an evidence row.
2. No extrapolation — "cuts CAC" does not become "cuts all acquisition cost."
3. Regulatory claims (health, finance, efficacy) require legal review.
4. Claim decay — evidence is time-stamped; stale evidence triggers re-review.
5. Neutralize superlatives — "best" / "fastest" / "leading" require benchmarked proof in-hand.

## Machine enforcement

- Brand pack stored as versioned JSON + tokens.
- Voice classifier — LLM-as-judge scoring drafts against rubric.
- Claim checker — regex + semantic match against claim library before publish.
- Visual style — Figma library + design tokens (lib/markos/theme/tokens.ts).
- Accessibility gate — axe-core in `test:ui-a11y` before UI ship.

## Operator workflow to produce a brand pack

1. Run `/om-onboarding` or `markos-onboarder` → generates seed.
2. MIR-filler agent proposes identity + personality + positioning from seed.
3. Human refines in `.markos-local/MIR/brand-pack.md`.
4. `bin/sync-vault.cjs` syncs to Supabase `markos_company`.
5. Voice classifier bootstrapped from example-text corpus (10–30 approved messages).
6. Claim library seeded from product spec + testimonials.

## Pitfalls

- **Taste-only reviews.** If a human is the only brand gate, drift is inevitable.
- **Voice rules without examples.** Rubrics hallucinate without anchor examples.
- **Claim drift** — "research shows" without citation. Fence every claim.
- **One-shot brand pack** — update quarterly; voice is a living system.
- **Brand vs. performance tension** — treat as complementary; performance copy that breaks brand still loses over time.

## Related

- [[MarkOS Canon]] · [[Message Crafting Pipeline]] · [[Audience Archetype Canon]] · [[Communication Guides]] · [[Brand & Creative]] · [[AI Creative Pipelines 2026]] · [[Core Lib]]
