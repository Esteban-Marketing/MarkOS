---
date: 2026-04-16
description: "Audience Archetype Canon — the deterministic operator-grade schema for capturing an audience: ICP, persona, JTBD, buying committee, psychographics, VOC, pain matrix."
tags:
  - brain
  - canon
  - audience
  - icp
  - persona
---

# Audience Archetype Canon

> The Archetype is the minimum context required before any creator-tier agent runs. No archetype → no draft. An archetype is not a persona fiction; it is an evidence-anchored operator contract that ties research to messaging.

## Archetype = 7 blocks

```
1. Identity          — who the person is (role, context, demographics)
2. Situation         — where the person sits (business/life context, triggers)
3. Jobs-to-be-Done   — functional · emotional · social jobs
4. Pain matrix       — pain-point tags from taxonomy, severity, evidence
5. Buying committee  — (B2B) roles involved + influence map
6. Voice of customer — verbatims, objections, language they use
7. Signal footprint  — where we find them, what they read, who they trust
```

Every creator-tier agent (Copy Drafter, Social Drafter, Email Sequence, Content Creator) loads the archetype at the start of a run via Context Loader (`MARKOS-AGT-*`).

## Block 1 — Identity

| Field | Example |
|---|---|
| Name (internal) | "Solo Founder Sam" |
| Role / title | founder + head of everything |
| Seniority | 0–3 yrs leading a company |
| Demographics (when relevant) | age band, geo, income band |
| Psychographics | values, aspirations, anxieties |
| Technographics (B2B) | current stack, maturity level |

Human-ish name for the archetype makes operator discussion concrete. Avoid clichés ("Marketing Mary").

## Block 2 — Situation

What is happening in their world that makes this message relevant *now*?

- **Trigger** — the event that primed their need (e.g. funding round, layoff, churn spike, new regulation).
- **Status quo** — what they're doing today to cope.
- **Frustration** — specifically what is broken.
- **Stakes** — what happens if they don't solve it.

## Block 3 — Jobs-to-be-Done

Use the canonical JTBD formula: *When [situation], I want to [motivation], so I can [outcome].*

- **Functional job** — the task.
- **Emotional job** — how they want to feel.
- **Social job** — how they want to be seen.

Example: *When I'm preparing for a board meeting, I want to show pipeline health credibly, so I can defend budget and be seen as strategic.*

## Block 4 — Pain matrix

Tie to the [[Pain-Point Engine|8-parent taxonomy]]. Format:

| Parent tag | Sub-tag | Severity (1–5) | Evidence |
|---|---|---|---|
| `high_acquisition_cost` | `paid_media:low_roas` | 5 | CAC rose 40% QoQ per interview transcript |
| `attribution_measurement` | `paid_media:attribution_gap` | 4 | "we literally don't know what works" (VOC) |

Severity drives message urgency; evidence prevents invented pain.

## Block 5 — Buying committee (B2B)

Map the committee when the sale is non-trivial:

| Role | Name / title | Influence | Wants | Fears |
|---|---|---|---|---|
| Economic buyer | CFO | 5 | ROI proof | overspend |
| Champion | Head of Growth | 5 | ship faster | blame for bad pick |
| User | Marketing Ops | 4 | less tool-sprawl | retraining burden |
| Technical gatekeeper | CTO / IT | 3 | security + integration | data exposure |
| Blocker | Legal | 2 | compliance | DPA delays |
| Ratifier | Board | 1 | strategy fit | distraction |

Tailor messages to each role's wants + fears.

## Block 6 — Voice of customer (VOC)

Capture raw, unedited language:

- 10–20 verbatim phrases the target actually uses.
- Top 5 objections + counters.
- Words they don't use ("synergy", "leverage").
- Aspirational phrases ("I want to be the kind of founder who…").

This block seeds the voice classifier's reference corpus and the copy drafter's lexicon.

## Block 7 — Signal footprint

Where does the archetype spend attention?

- **Social** — platforms + accounts they follow.
- **Podcasts** — 3–5 they actually listen to.
- **Newsletters / blogs** — sources they trust.
- **Communities** — Slack, Discord, subreddits, LinkedIn groups.
- **Events** — conferences, meetups.
- **Peers / mentors** — who they turn to for advice.

Drives channel allocation + creator/influencer selection.

## Resolution gate

An archetype is **resolved** when every block has ≥ 80% completion with evidence. Unresolved archetypes block the Message Crafting Pipeline at Stage 2.

## Refresh cadence

- Quarterly review of VOC and pain matrix (situations change).
- On-trigger refresh: product launch, segment pivot, macro shift.
- Annual rebuild if retention/sales data shows segment drift.

## Number of archetypes

- **1–3** for early-stage. More = scattershot messaging.
- **5–8** for growth-stage with segmentation maturity.
- Never > 10 — beyond that, use programmatic personalization via [[RAG-Grounded Personalization]].

## Pitfalls

- **Persona fiction** — inventing demographics without evidence.
- **One archetype for all channels** — mismatch between mass-market site and niche-community social.
- **Static archetypes** — real customers evolve; refresh is not optional.
- **Archetype without pain** — produces beautiful, useless copy.
- **Over-segmentation** — 20 archetypes is a failure of synthesis, not rigor.

## Related

- [[MarkOS Canon]] · [[Message Crafting Pipeline]] · [[Pain-Point Engine]] · [[Brand System Canon]] · [[Audience & Segmentation]] · [[Jobs-to-be-Done]] · [[ICP (Ideal Customer Profile)|Ideal Customer Profile]]
