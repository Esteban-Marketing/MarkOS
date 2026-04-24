# Phase 211 - Content, Social, and Revenue Loop (Discussion)

**Date:** 2026-04-22  
**Milestone:** v4.0.0 SaaS Readiness / MarkOS v2 compliance track  
**Depends on:** Phases 207-210, Phase 205 for pricing-sensitive artifacts  
**Quality baseline applies:** all 15 gates

## Goal

Prove one complete marketing operating loop: strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn, with social and revenue expansion paths.

## Current code evidence

- Marketing MCP tools exist for campaign plans, briefs, copy, variants, claim audit, and scheduling.
- CRM, outbound, reporting, and attribution surfaces exist.
- `schedule_post` is the only mutating marketing MCP tool and already has approval posture.

## Gap

The current app has useful pieces but not the complete operating loop. Social listening/inbox/DM routing is not present, and content artifacts do not yet move through a unified evidence, approval, dispatch, performance, and learning lifecycle.

## Proposed plan slices

| Slice | Purpose |
|---|---|
| 211-01 | Strategy and brief object model tied to audience, pain tag, offer, pricing context, and success target |
| 211-02 | Draft generation and audit pipeline with voice, claim, compliance, channel, and pricing checks |
| 211-03 | Approval-to-dispatch path for at least one channel |
| 211-04 | Social signal schema, listening posture, classification, and escalation |
| 211-05 | Revenue attribution feedback through CRM/pipeline evidence |
| 211-06 | Measurement handoff to artifact performance and weekly narrative |

## Success criteria

- One artifact can complete the full loop with approval and evidence.
- Public replies, DMs, sends, posts, ad changes, CRM mutations, data exports, and price changes remain approval-gated by default.
- Pricing-sensitive artifacts use Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Revenue impact ties to CRM movement, UTM evidence, pipeline influence, or leading indicators.
