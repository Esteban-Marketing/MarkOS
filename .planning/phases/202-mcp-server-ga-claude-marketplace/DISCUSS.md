# Phase 202 — MCP Server GA + Claude Marketplace Launch (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Graduate the 0-day MCP server (200-06) to GA: session persistence, +20 skills, public marketplace approval, Claude Marketplace listing live, Cursor / Windsurf / Warp certified.

## Scope (in)

- MCP session persistence via `markos_mcp_sessions`
- +20 MCP tools beyond wave-0 10 (total 30)
- Claude Marketplace review complete → live listing
- Certification with Cursor · Windsurf · Warp · ChatGPT agents
- Per-session cost metering + hard budget
- MCP threat model: prompt injection · tool confusion · session hijack

## Scope (out)

- Computer-use agents (phase 235)
- Marketplace of 3rd-party agents (phase 213 alpha)

## Threat-model focus

prompt injection · tool confusion · session spoofing · data exfil

## Success criteria

- Claude Marketplace listing live with ≥ 50 installs in first 30 days
- Cursor + Windsurf + Warp support documented
- Session p95 latency ≤ 300ms for simple tool invocations
- Zero unauthorized tool invocations in 30-day window

## Migrations (planned)

- `71_markos_mcp_sessions extensions.sql`

## Contracts (planned)

- `F-71-mcp-session-v1 updates`

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 202` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
