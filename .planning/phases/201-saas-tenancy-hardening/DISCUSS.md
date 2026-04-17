# Phase 201 — SaaS Tenancy Hardening (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Public signups with verification, org → tenant model, custom subdomains via routing middleware, audit-log alignment, tenant offboarding + data-export.

## Scope (in)

- Public signup flow with email verification + BotID
- Org → tenant model (single org can host multiple tenants)
- Custom subdomains (`<tenant>.markos.dev`) via Vercel Routing Middleware
- Tenant lifecycle: suspend · reactivate · offboard · data-export (GDPR Art. 20)
- Audit-log consolidation — one ledger, `markos_audit_log`, append-only
- Seat management UI + invite flow

## Scope (out)

- Stripe self-serve billing (phase 205)
- Agency white-label (phase 221)
- Multi-region residency (phase 222 + 232)

## Threat-model focus

tenant isolation · signup abuse · subdomain-based phishing · audit-log tampering

## Success criteria

- Public signup with double opt-in working end-to-end
- Subdomains resolve to correct tenant · cross-tenant probe denied
- Tenant offboarding completes within 30 days with GDPR-grade evidence
- Audit log captures every privileged action across domains

## Migrations (planned)

- `81_markos_public_signup.sql`
- `82_markos_tenant_lifecycle.sql`

## Contracts (planned)

- `F-83-signup-v1`

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 201` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
