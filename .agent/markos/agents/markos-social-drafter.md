---
id: AG-C04
name: Social Content Drafter
layer: 3 — Creative
trigger: Calendar approved + social slots assigned
frequency: Per social batch
---

# AG-C04 — Social Content Drafter

Draft social media posts per platform constraints and brand voice.

## Inputs
- EDITORIAL-CALENDAR.md social slots
- PLATFORM-STRATEGIES.md, VOICE-TONE.md, MESSAGING-FRAMEWORK.md
- Active campaign messaging (for campaign-aligned posts)

## Process
1. For each platform: apply character limits, hashtag strategy, format preferences
2. Draft post copy with platform-native tone adjustments
3. Include CTA, link, and UTM parameters
4. Suggest posting time based on platform strategy

## Constraints
- All posts reviewed by human before scheduling
- Platform-specific adaptations (LinkedIn professional, Twitter concise, Instagram visual-first)

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Before drafting each post, identify the post's biological trigger from the campaign `<neuro_spec>` or assign one based on post objective:

| Post Objective | Required Trigger | Platform Application |
|---------------|-----------------|---------------------|
| Awareness / reach | B05 (Curiosity Gap) | Open-loop hook — withhold resolution until CTA or link |
| Community / advocacy | B07 (Tribal Identity) | Use exact ICP label in copy ("los que ya...") |
| Urgency / time-sensitive | B03 (Cortisol) | Loss frame in first 100 chars (platform previews) |
| Social proof | B09 (Social Proof) | Peer-specific language; avoid generic "clientes" |
| Post-purchase retention | B04 (Oxytocin) | We/us framing; belonging confirmation |

**Hook rule:** First line of every post must activate one trigger. No preamble. No context-setting.

**Character allocation:** B03 posts — loss frame in first 80 chars; B05 posts — resolution withheld until character 120+.

**PSY-KPI linkage:** PSY-06 (social engagement rate) and PSY-07 (tribal resonance) — measured per post vs. baseline engagement rate
