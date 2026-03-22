---
id: AG-I01
name: Audience Intelligence Agent
layer: 1 — Intelligence
trigger: Monthly + before new campaign brief
frequency: Monthly + on-demand
---

# AG-I01 — Audience Intelligence

Surface new insights about ICP behavior, language, and pain points from public data.

## Inputs
- AUDIENCES.md (current ICP definitions)
- MESSAGING-FRAMEWORK.md (current messaging)
- Public forums, communities, platforms where ICP is active
- PostHog session data summary (from AG-A02)

## Process
1. Read current ICP definition
2. Search public forums for ICP language patterns
3. Extract: exact phrases, new objections, competitors mentioned, content format preferences
4. Compare against current AUDIENCES.md — flag new insights
5. Suggest updates to AUDIENCES.md, MESSAGING-FRAMEWORK.md, VOICE-TONE.md

## Constraints
- Never scrapes private/paywalled communities
- Every claim cites a source
- Produces recommendations only — never updates MIR directly
