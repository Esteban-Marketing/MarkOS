---
date: 2026-04-16
description: "The canonical 7-stage MarkOS message-crafting pipeline — from seed intent to approved, audience-centric, brand-tailored, pain-rooted, neuro-calibrated, channel-native artifact."
tags:
  - brain
  - canon
  - message
  - pipeline
---

# Message Crafting Pipeline

> Every outbound marketing artifact in MarkOS — email, ad, landing page, social post, SMS, push, creator brief — passes through seven stages. Skipping any stage is a [[MarkOS Canon|Canon]] violation.

## The 7 stages

```
(1) Intent → (2) Audience → (3) Pain → (4) Promise → (5) Brand →
(6) Draft → (7) Audit → (8) Approval → (9) Dispatch → (10) Measure
```

(Stages 8–10 are post-craft gates; the craft itself is 1–7.)

### 1. Intent — what outcome does this message drive?

Agent: Strategist (`MARKOS-AGT-STR-01`) or Planner (`MARKOS-AGT-STR-02`).
Input: MSP, campaign thesis, current milestone.
Output: one-sentence intent ("convert warm leads from trial to paid").
Reject if: no measurable outcome.

### 2. Audience — who exactly is this for?

Agent: Audience Intel.
Input: MIR + research corpus.
Output: resolved **[[Audience Archetype Canon|archetype]]** — named, JTBD-clarified, buying-committee-aware.
Reject if: archetype is generic ("small business owners") or unresolved.

### 3. Pain — what pain/need does this touch?

Agent: Gap Auditor + Audience Intel.
Input: taxonomy (`.agent/markos/literacy/taxonomy.json`) + customer research.
Output: one parent pain-point tag + optional sub-tag. See [[Pain-Point Engine]].
Reject if: no pain tag, or tag does not match audience's real situation.

### 4. Promise — what specifically does the product do about this pain?

Agent: Strategist.
Input: product spec + claim library.
Output: single-minded proposition ("Cut CAC 30% in 90 days by consolidating ad spend into one brand search campaign").
Reject if: claim exceeds product capability, or proposition is multi-threaded.

### 5. Brand — whose voice + style renders this?

Agent: Creative Brief + Brand enforcement.
Input: [[Brand System Canon|brand pack]] — voice, personality, style, taboos.
Output: brand-tailored creative brief with voice rules attached.
Reject if: voice rules absent.

### 6. Draft — compose the artifact

Agents: Copy Drafter / Social Drafter / Email Sequence / Content Creator (format-appropriate).
Input: brief + channel constraints + [[Communication Guides]].
Output: draft artifact in channel-native form.
Reject if: format violates native constraints (length, structure, legal disclosure).

### 7. Audit — does it pass the gates?

Four independent audits, in order:

| Audit | Agent | Passes when |
|---|---|---|
| **Voice** | brand classifier | output score ≥ threshold on brand rubric |
| **Claim** | Auditor | every claim in the claim library or substantiated |
| **Neuro** | Neuro Auditor | `<neuro_spec>` block matches funnel stage → triggers (see [[Neuro Audit Canon]]) |
| **Legal** | Auditor / human | disclosure + compliance (CAN-SPAM, GDPR, DMA, EU AI Act, FTC) |

Reject on any audit fail → loop back to stage 6.

### 8. Approval — human sign-off

Mandatory. F-63A approval package → human accepts → `crm_copilot_mutation_outcomes` records.

### 9. Dispatch — to channel

Executor (`MARKOS-AGT-EXE-01`) is the only agent authorized here. Uses channel adapters (Resend, Twilio, Meta CAPI, Google Enhanced Conversions, etc.).

### 10. Measure — close the loop

Performance Monitor + Analyst + Data Scientist feed outcomes back to strategy.

## Channel-specific tailoring

Stage 6 (Draft) must respect channel native form. See per-channel playbooks under the Literacy tree `28 Message Crafting/`:

- [[Email Message Crafting]] · [[Ad Message Crafting]] · [[Landing Page Message Crafting]]
- [[SMS Message Crafting]] · [[Push Message Crafting]] · [[Social Post Message Crafting]]
- [[Creator Brief Crafting]] · [[SEO Article Crafting]]

## Audience-centric tailoring matrix

For each archetype × pain × brand combination, the draft varies on:

| Dimension | What changes |
|---|---|
| Hook | empathy vs utility vs authority vs novelty |
| Proof | testimonial vs case study vs statistic vs demo |
| Objection pre-empt | price vs trust vs integration vs switching cost |
| CTA | soft lead vs demo vs self-serve trial vs direct buy |
| Visual register | polished vs raw vs illustrative vs data-dense |

## Pitfalls

- **Skipping stage 3** — drafts without a pain-point tag are generic and drift to brand-safe boilerplate.
- **Collapsing stage 4 into stage 6** — writing headlines before locking the proposition produces clever-but-wrong copy.
- **Voice audit after human approval** — catches drift too late. Automate stage 7 before stage 8.
- **Single-round audit** — treat rejections as iteration, not failure. Most drafts require 2–3 passes.
- **Ignoring channel-native form** — 600-word email copy in a push notification is not "tailoring," it is laziness.

## Example walk-through

**Intent**: re-engage trial users who stopped using the product at day 3.

1. **Audience** → "Solo B2B SaaS founder, small team, overwhelmed by tooling"
2. **Pain** → `pipeline_velocity` (sub: `lifecycle_email:weak_nurture`)
3. **Promise** → "MarkOS runs your marketing stack on autopilot so your pipeline re-fills while you build"
4. **Brand** → direct, confident, zero jargon, slight dry humour
5. **Draft** → 90-word email, subject "still bleeding leads?", one CTA
6. **Audit** → voice ✅ · claim ✅ · neuro (B02 loss aversion + B04 authority) ✅ · legal ✅
7. **Approval** → sent to ops reviewer
8. **Dispatch** → scheduled 09:30 local time
9. **Measure** → reply rate + trial reactivation within 72h

## Related

- [[MarkOS Canon]] · [[Agent Registry]] · [[Audience Archetype Canon]] · [[Pain-Point Engine]] · [[Brand System Canon]] · [[Neuro Audit Canon]] · [[Communication Guides]] · [[CRM Domain]]
