# Phase 206 — SOC 2 Type I Foundation (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Engage auditor · author + ratify SOC 2 policies · automate evidence collection · first pen test · close first audit in v4.2.0.

## Scope (in)

- Auditor engagement (Drata · Vanta · Secureframe OR direct firm)
- Policy authoring: access control · incident response · change management · vendor management · business continuity · data classification · risk assessment · acceptable use
- Evidence collection automation tied to MarkOS + Vercel + Supabase + Stripe
- First external pen test
- Security training program for the team
- Backup + disaster recovery drills

## Scope (out)

- Type II observation window (phase 223)
- ISO 27001 (phase 234)
- HIPAA (phase 231)

## Threat-model focus

entire CC suite (access, authn, authz, change, ops, vendor, etc.)

## Success criteria

- All 17 SOC 2 CC policies ratified · signed · published
- Evidence collection automated with ≥ 95% coverage
- Pen test report clean or remediated
- SOC 2 Type I report issued

## Migrations (planned)

- none

## Contracts (planned)

- none

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 206` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
