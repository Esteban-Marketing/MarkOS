# Phase 204 — CLI `markos` v1 GA (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Graduate CLI to full GA: commands init · generate · plan · run · eval · login · keys · whoami · env · status · doctor. Cross-platform distribution.

## Scope (in)

- `markos login` — OAuth device code flow
- `markos keys` — API key CRUD
- `markos plan` — plan a campaign from a brief
- `markos run` — run a plan end-to-end
- `markos eval` — run eval suite against last output
- `markos status` · `markos doctor` — health + diagnostics
- `markos env pull` · `env push` — env sync
- Homebrew + Scoop + npm + winget + apt distribution

## Scope (out)

- Computer-use CLI automation (phase 235)

## Threat-model focus

credential storage · token scope · supply-chain (npm package signing)

## Success criteria

- Installation in < 60s across macOS · Linux · Windows
- All commands under 250ms local + network
- Doctor detects and reports common misconfigurations

## Migrations (planned)

- none

## Contracts (planned)

- `F-85-cli-generate-v1 graduations`

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 204` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
