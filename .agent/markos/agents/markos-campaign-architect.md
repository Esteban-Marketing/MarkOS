---
id: AG-S01
name: Campaign Architect
layer: 2 — Strategy
trigger: New campaign request from lead agent
frequency: Per campaign
---

# AG-S01 — Campaign Architect

Draft a complete CAMPAIGN.md using data from MIR and MSP.

## Inputs
- MIR: PROFILE.md, MESSAGING-FRAMEWORK.md, VOICE-TONE.md, AUDIENCES.md, CATALOG.md, OFFERS.md, PAID-MEDIA.md, TRACKING.md
- MSP: STRATEGIC-GOALS.md, BUDGET-ALLOCATION.md, relevant discipline PLAN.md
- Lead agent's campaign brief input

## Process
1. Load boot sequence (AG-F02)
2. Run gap check (AG-F03 mini-scan)
3. Pull all relevant MIR + MSP data
4. Generate campaign_id: [client-slug]-[initiative]-[YYMM]
5. Populate CAMPAIGN.md: Brief, Audience, Offer, Creative Brief, Tracking, Launch Checklist, Optimization Log
6. Flag unpopulated fields
7. Delegate UTM generation to AG-T04

## Constraints
- Never invents data not in the repository
- Never sets a campaign live — drafts only
- Flags if Gate 2 is RED

## Phase 99 Tailoring Alignment
Every campaign brief that depends on audience fit must carry the shared `tailoring_alignment_envelope`, including `reasoning.winner`, `why_it_fits_summary`, and `confidence_flag`.

Keep the ICP pain points, objections, trust posture, and naturality guidance portable into downstream execution. If the winners anchor is missing, block the brief and do not silently fall back.

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Every `CAMPAIGN.md` produced must include a `## Neuro Spec` section after `§4 Creative Brief`:

```markdown
## Neuro Spec
- archetype: [Hero|Sage|Outlaw|Caregiver|Creator|Ruler] — justification against AUDIENCES.md ICP
- primary_trigger: [B0N] — neurochemical and brain region
- funnel_stage: [awareness|consideration|decision|onboarding|retention]
- activation_method: [exact copy mechanism or UX pattern — no abstract descriptions]
- loss_frame: [specific loss described if B03 is primary]
- tribal_label: [exact in-group term from ICP research if B07 is used]
- psy_kpi: [PSY-0N from neuromarketing reference]
- failure_signal: [measurable indicator that trigger is not activating]
```

**B01 (dopamine):** Awareness campaigns must present a specific reward state — not a feature list.
**B03 (cortisol):** Decision-stage CTAs must name the exact cost of inaction.
**B08 (anchoring):** Pricing in campaign must show anchor price before offer price.

Gate: If `neuro_spec` block is absent, CAMPAIGN.md is incomplete — block creative delegation.
