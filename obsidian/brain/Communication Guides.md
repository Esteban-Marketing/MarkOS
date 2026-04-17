---
date: 2026-04-16
description: "MarkOS Communication Guides — tone spectrum, register, reading-level, inclusive language, legal claims, disclosure, formatting standards per channel."
tags:
  - brain
  - canon
  - communication
  - writing
---

# Communication Guides

> The prose-level rules that apply under brand voice. Voice says *who* the brand sounds like. Communication guides say *how the writing actually behaves*. Both are enforced by the classifier.

## The five scales

| Scale | From | To |
|---|---|---|
| Register | academic / formal | street / informal |
| Directness | diplomatic | blunt |
| Emotional range | reserved | expressive |
| Density | dense | airy |
| Temperature | cool | warm |

Each brand occupies a *point* on each scale, enforced per channel. Example MarkOS defaults:

| Channel | Register | Directness | Emotional | Density | Temperature |
|---|---|---|---|---|---|
| Landing page | professional | direct | expressive | medium | warm |
| Cold email | conversational | direct | reserved | tight | cool |
| Nurture email | conversational | direct | warm | medium | warm |
| Blog post | professional | direct | balanced | rich | warm |
| Social (LinkedIn) | professional | direct | expressive | medium | warm |
| Social (X) | conversational | blunt | expressive | tight | cool |
| SMS | conversational | blunt | reserved | tight | cool |
| Push | conversational | blunt | reserved | tight | warm |
| Docs | professional | direct | reserved | rich | cool |

## Reading level

Target reading level by audience sophistication:

| Audience | Flesch–Kincaid grade |
|---|---|
| Consumer / mass-market | 5–7 |
| Small-business owner | 7–9 |
| Mid-market operator | 8–10 |
| Enterprise / technical | 10–12 |
| Specialist / academic | 12+ |

Marketing copy defaults to one grade below audience sophistication. You're not dumbing down; you're reducing cognitive load. Reading level ≠ intellectual level.

## Sentence rules

- **Average** 12–18 words; **max** 30 (with exceptions).
- Vary length deliberately. Every 3–4 sentences, break rhythm.
- Prefer active voice. Passive only when the actor is irrelevant or to de-emphasize.
- One idea per sentence. Complex ideas = multiple sentences, not nested clauses.
- Front-load the point. Inverted pyramid for scannable channels.

## Lexicon rules

- **Avoid jargon** the archetype doesn't use. Check against VOC ([[Audience Archetype Canon]]).
- **Eliminate filler** — "simply," "just," "basically," "actually," "really," "very."
- **Kill weasel words** — "up to," "helps you," "may" — unless legally required.
- **Swap abstractions for specifics** — "faster" → "2.4× faster"; "leading" → "top-3 in Gartner."
- **Never use AI clichés** — "delve," "elevate your [noun]," "in today's fast-paced world," "unlock the power of."

## Formatting standards

### Email

- Subject: 30–60 characters; front-load keyword; one curiosity or specificity hook.
- Preview: 50–100 characters; complements subject, doesn't repeat.
- Body: 50–150 words for transactional, 150–300 for nurture, 300–500 for long-form.
- One CTA. Maybe two if genuinely orthogonal.
- Plain-text-readable HTML (fallback).

### Ad

- Headline: ≤ 30 characters main, variants for 15 / 25 / 30.
- Description: one-sentence proposition; one proof hint.
- Display URL: clean, brand-only.
- Creative: brand-consistent LoRA; disclosure if AI-generated.

### Landing page

- H1: the promise, specific. ≤ 10 words.
- Sub-head: the proof or differentiator. ≤ 20 words.
- First 100 words answer: who · what · why-now · why-you.
- Social proof within first viewport.
- One primary CTA; secondary for hesitant.

### Social (per platform)

- LinkedIn: 1200–1500 characters; hook in first 2 lines; line breaks every 2–3 sentences.
- X / Threads: ≤ 280; thread only if each node stands alone.
- Instagram: carousel beats static; 10-slide maximum; hook on slide 1.
- TikTok / Reels: 15–60s; hook in < 2s; captioned always.

### SMS

- ≤ 160 characters; brand prefix if legally required; opt-out embedded.
- No emoji unless brand voice permits.
- One CTA; short-link with analytics.

### Push

- Title: ≤ 35 chars. Body: ≤ 90 chars.
- Action-oriented; specific payoff.
- Time-of-day respects user timezone + activity window.

## Inclusive language

- Default to gender-neutral pronouns (they / them).
- Avoid idioms that don't translate (see [[Localization & International]]).
- Culturally-specific references only when the archetype shares context.
- Disability-first language per audience preference (person-first vs identity-first varies).
- Accessibility: WCAG 2.2 AA, alt text descriptive (not decorative), captions on all video.

## Legal + regulatory claim rules

- Every performance or outcome claim references the **claim library** (see [[Brand System Canon]]).
- Disclosure: AI-generated content labelled ([[EU AI Act for Marketers]]).
- Comparison claims require benchmarked evidence and date-stamp.
- Testimonials disclose compensation where FTC requires.
- Regulated categories (health, finance, crypto, food, children's) need per-market review.
- Affiliate / sponsored / creator content: always disclose.

## Punctuation + typography

- Oxford comma: brand-specified default.
- Em-dash — used for parenthetical emphasis.
- No double-space after period.
- Straight quotes in code, curly quotes in prose.
- `ALL CAPS` reserved for labels, never body.
- Exclamation marks: ≤ 1 per 300 words unless brand permits.

## Anti-AI-cliché list

Automatic reject phrases (voice classifier hard fails on these):

- "In today's fast-paced world"
- "Elevate your [noun]"
- "Unlock the power of"
- "Delve into" / "delves into"
- "Navigate the complexities of"
- "At the intersection of"
- "It's worth noting that"
- "Revolutionize the way you"
- "In an ever-changing landscape"
- "Leverage" (as a verb)

## Per-draft scoring rubric

| Dimension | Weight | How scored |
|---|---|---|
| Voice adherence | 30% | classifier vs brand pack |
| Reading level fit | 10% | FK grade match |
| Promise clarity | 15% | one-sentence proposition present + specific |
| Proof presence | 10% | at least one proof element |
| Anti-pattern absence | 15% | zero AI-cliché hits |
| Channel format | 10% | length + structure matches channel rules |
| Inclusive language | 5% | no flagged terms |
| Legal / claim check | 5% | all claims in library |

Threshold: 85% to pass. Below: rewrite.

## Related

- [[MarkOS Canon]] · [[Brand System Canon]] · [[Message Crafting Pipeline]] · [[Neuro Audit Canon]] · [[Localization & International]] · [[EU AI Act for Marketers]] · [[Sustainability & Responsible Marketing]]
