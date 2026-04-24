---
date: 2026-04-16
description: "MarkOS Canon — the 10 operator commandments that make MarkOS bulletproof. Goal: every message audience-centric, pain-point-rooted, brand-tailored, strategy-aligned, literacy-backed."
tags:
  - brain
  - canon
  - doctrine
  - markos
---

# MarkOS Canon

> The ten commandments that make MarkOS the bulletproof Marketing OS for agentic teams. Read at every operator onboarding and every major strategy review. Every campaign, every message, every agent run is evaluated against this canon.

## Mission

Ship the most **valuable** and **bulletproof** agentic Marketing OS. Every agent output must be:

1. **Audience-centric** — grounded in a real archetype, not a generic ICP fiction.
2. **Pain-point-rooted** — attached to a concrete pain mapped in the taxonomy.
3. **Product-tethered** — claims only what the product/service actually delivers.
4. **Brand-tailored** — passes the brand identity + personality + voice classifier.
5. **Strategy-aligned** — advances a milestone, not a random tactic.
6. **Literacy-backed** — references canonical literacy nodes, not invented patterns.
7. **Channel-appropriate** — respects the medium's native form + constraints.
8. **Neuro-calibrated** — B01–B10 triggers applied deliberately, not accidentally.
9. **Human-approved** — mutations and sends pass an approval gate.
10. **Measured + reversible** — telemetry records every decision; lineage intact.

## v2 Operating-System Contract

The v2 blueprint adds a product-level contract above individual campaign quality: MarkOS must prove one complete marketing operating loop before expanding breadth.

- Canonical foundation: [[Marketing Operating System Foundation]].
- Functional spec: [[MarkOS v2 Operating Loop Spec]].
- Intake source: [[MarkOS v2 Blueprint Intake]].
- SaaS growth destination: [[SaaS Marketing OS Strategy Canon]].
- North star: marketing-attributed pipeline created per dollar of MarkOS platform spend.
- Launch rule: ship the complete loop before the full 80-agent vision.

Every future roadmap change should preserve this order:

`brand pack -> connector wow moment -> strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn`

## The Ten Commandments

### I. Know the human before the message

No draft is started without a resolved **[[Audience Archetype Canon|Audience Archetype]]**. If the archetype is thin, loop back to research (MARKOS-AGT-AUD-* agents) before any creator-tier agent runs.

### II. Name the pain exactly

Every message carries a tag from the **[[Pain-Point Engine|8-parent taxonomy]]** (high_acquisition_cost · low_conversions · poor_retention_churn · low_organic_visibility · attribution_measurement · audience_mismatch · pipeline_velocity · content_engagement). No tag → no draft.

### III. Match message to need, not need to message

Messages serve a *provided* need. If product does not deliver, do not claim. Claim library is the fence ([[Brand System Canon]]).

### IV. One voice, everywhere

Brand voice is not a mood — it is a **deterministic** system of lexicon, register, cadence, taboos, and values. See [[Brand System Canon]]. The classifier rejects drift before publish.

### V. Tailor the surface, preserve the signal

Copy adapts per channel (email vs ad vs landing vs push). Positioning, promise, proof do not. See [[Message Crafting Pipeline]].

### VI. Every agent has a token

Every capability is an addressable agent by TOKEN_ID. No anonymous handwriting; every mutation names its agent + skill + run ID. See [[Agent Registry]].

### VII. Every mutation has an approval

AI never writes, sends, or dispatches without a human approval package (F-63A). Bounded mutation families only. See [[Key Decisions]].

### VIII. Gates before content

Gate 1 (Identity: brand, voice, business model) and Gate 2 (Execution: tracking, automation, KPIs) must be green before any content agent runs. See `.agent/markos/references/mir-gates.md`.

### IX. Neuro triggers are additive, not mandatory

B01–B10 triggers enrich a message. They do not replace truth, clarity, or relevance. Use the **[[Neuro Audit Canon]]** as amplifier, not foundation.

### X. Vault is truth, code reflects it

MIR + MSP + literacy live in the vault first. Cloud (Supabase) reflects. Operator-owned. No lock-in. See [[Key Decisions]].

## The Canon tree

| Canon | Owns | Links to |
|---|---|---|
| [[Marketing Operating System Foundation]] | v2 product doctrine, launch order, non-negotiables | [[MarkOS v2 Blueprint Intake]] |
| [[MarkOS v2 Operating Loop Spec]] | functional loop contract and verification gates | [[MarkOS Protocol]] |
| [[SaaS Marketing OS Strategy Canon]] | post-suite SaaS growth-mode doctrine and target growth agent tiers | [[SaaS Suite Canon]] |
| [[Agent Registry]] | current MarkOS agents + v2 target network map | [[MarkOS Protocol]] |
| [[Message Crafting Pipeline]] | 10-stage artifact flow from intent to measurement | all canons |
| [[Brand System Canon]] | identity · personality · voice · style · claim library | brand-pack · [[Brand & Creative]] |
| [[Audience Archetype Canon]] | ICP · persona · JTBD · buying committee · VOC | [[Audience & Segmentation]] |
| [[Pain-Point Engine]] | taxonomy routing + tailoring templates | `.agent/markos/literacy/taxonomy.json` |
| [[Neuro Audit Canon]] | B01–B10 biological triggers + activation rules | `.agent/markos/references/neuromarketing.md` |
| [[Communication Guides]] | tone · register · reading level · inclusive · legal claims | [[Brand & Creative]] |

## Operator checklist — ship-safe campaign

Before any campaign ships, all of the following must be ✅:

- [ ] **Archetype** resolved and linked ([[Audience Archetype Canon]]).
- [ ] **Pain-point tag** assigned from taxonomy ([[Pain-Point Engine]]).
- [ ] **Promise** substantiated by product capability (no claim drift).
- [ ] **Brand pack** applied (voice classifier ≥ threshold) ([[Brand System Canon]]).
- [ ] **Strategy tie-in** — which milestone / goal does this serve?
- [ ] **Literacy source** cited for every non-obvious claim.
- [ ] **Channel format** native (length, cadence, visual spec).
- [ ] **Neuro spec** block included ([[Neuro Audit Canon]]).
- [ ] **Approval package** created + signed.
- [ ] **Telemetry** hooked (UTM, conversion event, lift test if applicable).
- [ ] **AgentRun evidence** visible (run ID, source agent, cost, model, input/output, retry/failure state).
- [ ] **Research evidence map** attached for factual or market claims.
- [ ] **Pricing context** checked through [[Pricing Engine Canon]] or marked `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [ ] **SaaS Suite context** checked when `business_type = saas`; subscription, billing, churn, support, product usage, and revenue claims follow [[SaaS Suite Canon]].
- [ ] **SaaS growth context** checked when SaaS growth modules are active; PLG, ABM, expansion, referral, in-app, community, event, PR, partnership, developer, experiment, and revenue-alignment actions follow [[SaaS Marketing OS Strategy Canon]].
- [ ] **Learning path** defined (artifact performance log, tenant overlay, or central literacy candidate).
- [ ] **Reversibility** — rollback plan + immutable evidence row.

## The five rejections

Any of these auto-reject a draft:

1. No resolved archetype.
2. No pain-point tag.
3. Claim exceeds product capability.
4. Voice classifier fails brand threshold.
5. Missing approval package.
6. Hard-coded price point without Pricing Engine evidence or placeholder.
7. SaaS Suite legal billing, support response, save offer, discount, lifecycle mutation, or revenue claim without the required approval/evidence gate.
8. SaaS growth mutation without mode/module activation, Pricing Engine check when relevant, and human approval.

Fix at the cause, don't negotiate the gate.

## Related

- [[Home]] · [[Marketing Operating System Foundation]] · [[MarkOS v2 Operating Loop Spec]] · [[SaaS Suite Canon]] · [[MarkOS Codebase Atlas]] · [[MarkOS Protocol]] · [[Marketing Literacy]] · [[Patterns]] · [[Key Decisions]] · [[Gotchas]]
