---
date: 2026-04-16
description: "Scoring rubric used by the LLM voice classifier."
tags:
  - literacy
  - template
  - brand
  - voice
---

# Voice Classifier Rubric

> The LLM-as-judge prompt that the voice classifier uses. Instantiated per tenant; filled from [[Brand Pack Template|brand pack]].

## Inputs

- Draft artifact.
- Brand pack (voice section).
- Anchor examples (10–30 approved messages).
- Anti-examples (what the brand never sounds like).

## Scoring dimensions

| Dimension | Weight | What to check |
|---|---|---|
| Lexicon adherence | 20 | prefers prefer-list, avoids avoid-list |
| Register fit | 15 | matches declared register |
| Cadence fit | 10 | sentence length + rhythm match |
| Directness fit | 10 | on declared slider |
| Tone / temperature fit | 10 | warm / cool match |
| Pronoun policy | 5 | we/you ratio correct |
| Humor policy | 5 | within rule |
| Anti-cliché | 10 | zero AI cliché hits |
| Claim discipline | 10 | all claims in library |
| Inclusive language | 5 | no flagged terms |

## Scoring prompt (template)

```
You are the brand voice classifier for {{brand}}. Brand voice rules:
{{voice_rules_yaml}}
Anchor examples:
{{anchor_examples}}
Anti-examples:
{{anti_examples}}

Score the following draft against each dimension (0–10), return JSON:
{"scores": {...}, "total": N, "hard_fails": [...], "rewrites": [...]}

Draft:
{{draft}}
```

## Pass threshold

Total ≥ 85/100 AND zero hard fails.

## Related

- [[Brand System Canon]] · [[Brand Pack Template]] · [[Communication Guides]] · [[LLM Observability for Marketing]]
