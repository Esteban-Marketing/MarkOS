---
date: 2026-04-16
description: "MarkOS Pain-Point Engine — 8-parent taxonomy, discipline routing rules, tailoring templates, and evidence schema. Source: .agent/markos/literacy/taxonomy.json."
tags:
  - brain
  - canon
  - pain-point
  - taxonomy
---

# Pain-Point Engine

> Every MarkOS message is attached to a pain-point tag. The tag routes to a discipline, a playbook, and a tailoring template. Canonical source: `.agent/markos/literacy/taxonomy.json`.

## The 8 parent tags

| Tag | Label | Signal | Routes to |
|---|---|---|---|
| `high_acquisition_cost` | High Acquisition Cost | CAC / CPL / CPR above benchmark | Paid Media, Content/SEO |
| `low_conversions` | Low Conversions | CVR low at ad → LP → lead → trial | Paid Media, Landing Pages |
| `poor_retention_churn` | Poor Retention / Churn | MRR churn, subscriber loss, low repeat | Lifecycle Email |
| `low_organic_visibility` | Low Organic Visibility | rankings stagnant, organic share shrinking | Content/SEO |
| `attribution_measurement` | Attribution & Measurement | fragmented data, can't prove channel impact | Paid Media, Social |
| `audience_mismatch` | Audience Mismatch | wrong ICP, poor segmentation, bounce | Paid Media, Content/SEO, Lifecycle, Social, LPs |
| `pipeline_velocity` | Pipeline Velocity | leads stall mid-funnel, nurture fails | Lifecycle Email, Landing Pages |
| `content_engagement` | Content Engagement | content published, no interaction | Social, Content/SEO |

## Sub-tag structure

Discipline-scoped sub-tags sharpen within a parent. Examples:

- `paid_media:high_cpr` · `paid_media:low_roas` · `paid_media:attribution_gap`
- `content_seo:low_rankings` · `content_seo:thin_content` · `content_seo:low_organic_ctr`
- `lifecycle_email:low_open_rate` · `lifecycle_email:high_unsubscribe` · `lifecycle_email:weak_nurture`
- `social:low_engagement` · `social:audience_growth_plateau` · `social:poor_brand_awareness`
- `landing_pages:low_cvr` · `landing_pages:high_bounce` · `landing_pages:poor_form_completion`

Full list in `.agent/markos/literacy/taxonomy.json`.

## Evidence schema

Every pain-point assignment carries evidence:

```yaml
pain_point:
  parent_tag: high_acquisition_cost
  sub_tag: paid_media:low_roas
  severity: 5          # 1–5
  evidence:
    - source: platform_insight
      ref: Meta Ads Manager · Q1 2026
      claim: "ROAS fell to 0.8 vs historical 2.1"
    - source: customer_interview
      ref: interview-2026-03-12-founder
      claim: "feels like we're burning cash with no line of sight"
  detected_at: 2026-04-01
  owner_agent: MARKOS-AGT-ANA-01
```

Stored alongside the MIR; surfaced in planning.

## Discipline routing

When a pain is tagged, MarkOS routes to the right discipline:

```
pain_point → discipline → playbook → agent tier
```

E.g. `pipeline_velocity` + `lifecycle_email:weak_nurture` →

- Discipline: Lifecycle Email → see [[Email & Lifecycle]] + deep playbook [[Pipeline Velocity Playbook]].
- Agents: Email Sequence + Copy Drafter + Neuro Auditor.
- Literacy: [[Lifecycle Flow Patterns]] + [[B2B Cold Email Marketing]] + [[Deliverability Baseline 2026]].

## Tailoring templates per pain-point

Each pain-point has a standard angle for messaging:

| Pain | Angle | Proof type | CTA tendency |
|---|---|---|---|
| high_acquisition_cost | efficiency, ROI, cost per | benchmark data, case study | demo / audit |
| low_conversions | friction removal, trust | before/after, testimonial | self-serve trial |
| poor_retention_churn | value reinforcement, lifecycle | usage data, health score | feature education |
| low_organic_visibility | authority, discoverability | ranking deltas, citations | audit / content plan |
| attribution_measurement | clarity, causality | experiment readouts | consultation / diagnostic |
| audience_mismatch | precision, segmentation | cohort analytics | audience workshop |
| pipeline_velocity | speed, nurture rigor | funnel stats | sequence starter |
| content_engagement | resonance, cultural fit | share counts, sentiment | content sprint |

Tailoring is a starting angle, not a cage — the Message Crafting Pipeline still adapts per audience + brand.

## Deep playbooks

Per-parent-tag deep playbooks live in Literacy:

- [[High Acquisition Cost Playbook]] — root causes + diagnosis + treatments
- [[Low Conversions Playbook]] — funnel-step-by-step CRO + UX + proof
- [[Retention & Churn Playbook]] — lifecycle sequences + winback + health scoring
- [[Organic Visibility Playbook]] — SEO + GEO + entity hygiene
- [[Attribution & Measurement Playbook]] — MMM + incrementality + clean rooms
- [[Audience Mismatch Playbook]] — segmentation reset + ICP sharpening
- [[Pipeline Velocity Playbook]] — nurture + scoring + handoff SLAs
- [[Content Engagement Playbook]] — distribution + hooks + community-led

## Operator workflow

1. **Detect** — Gap Auditor + Data Scientist surface symptoms from live metrics.
2. **Tag** — assign parent + sub-tag + severity + evidence.
3. **Route** — discipline-level agent(s) activate.
4. **Plan** — phase PLAN.md references the tag; plan-checker verifies.
5. **Execute** — executor runs; every draft carries the tag.
6. **Verify** — verifier measures outcome against tag-specific success criteria.
7. **Resolve / iterate** — tag closed with evidence, or escalated.

## Anti-patterns

- **Taggless messaging** — every message needs a tag. Untagged = rejected at Stage 3 of [[Message Crafting Pipeline]].
- **Tag inflation** — applying 4+ tags to one message. Pick the dominant; others can be secondary.
- **Evidence-less tags** — "I think retention is bad" is not a tag. Evidence row or no tag.
- **Same angle, different pain** — assuming a proven pitch works for any pain. Re-tailor.
- **Tag-first without audience** — pain only exists in relation to an archetype (see [[Audience Archetype Canon]]).

## Related

- [[MarkOS Canon]] · [[Audience Archetype Canon]] · [[Message Crafting Pipeline]] · [[Data, Analytics & Measurement]] · [[Content Marketing]] · [[Paid Media]] · [[Email & Lifecycle]] · [[Social & Community]] · [[Conversion & CRO]]
