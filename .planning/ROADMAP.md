# Roadmap: MarkOS (MARKOS)

## Milestones

> Archived milestone phase details are intentionally kept in the matching files under `.planning/milestones/`, while this roadmap stays summary-first for active planning work.

- 🚧 **v4.0.0 SaaS Readiness 1.0** — Active milestone; phases 200-206 (API · SDK · MCP · webhooks · CLI · billing · SOC2-I). See section below.
- ✅ **v3.9.0 Vertical Plugin Literacy Libraries** — Phases 106-110 completed; archived at `.planning/milestones/v3.9.0-ROADMAP.md` (2026-04-16)
- ✅ **v3.8.0 Revenue CRM and Customer Intelligence Core** — Phases 100-105 completed; archived at `.planning/milestones/v3.8.0-ROADMAP.md` (2026-04-15)
- ✅ **v3.7.0 Neuro-Adaptive Literacy Intelligence** — Phases 96-99.1 completed; archived at `.planning/milestones/v3.7.0-ROADMAP.md` (2026-04-14)
- ✅ **v3.6.0 Deep Research Tailoring Engine** — Phases 91-95 completed; archived at `.planning/milestones/v3.6.0-ROADMAP.md` (2026-04-14)
- ✅ **v3.5.0 Ultimate Literacy Vault** — Phases 84-90 completed; archived at `.planning/milestones/v3.5.0-ROADMAP.md` (2026-04-13)
- ✅ **v3.4.0 Complete Branding Engine** — Phases 73-83 completed; archived at `.planning/milestones/v3.4.0-ROADMAP.md` (2026-04-12)
- ✅ **v3.1.0 Operator Surface Unification** — Phases 45-50 completed; archived at `.planning/milestones/v3.1.0-ROADMAP.md` (2026-04-03)
- ✅ **v1.0 Initial Protocol** — Phases 1-7 shipped (2026-03-23)

## Active Milestone: v4.0.0 — SaaS Readiness 1.0

**Status:** 🚧 Active — milestone kicked off 2026-04-16.

**Goal:** Ship the first public SaaS release of MarkOS. API-first · MCP-native · SDK + CLI · webhooks · Claude Marketplace · self-serve billing · SOC 2 Type I foundation. Invest heaviest in foundations (Quality Baseline 15 gates) before feature velocity compounds.

**Requirements to map:** API-01, API-02, SDK-01, MCP-01, WHK-01, CLI-01, BILL-01, BILL-02, COMP-01, QA-01..15.

**Research/context:** `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`, `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`, [[MarkOS Canon]], [[Target ICP]], [[Brand Stance]].

### Phase 200: SaaS Readiness Wave 0 — 0-day shortlist
**Goal:** Ship 8 lowest-friction changes in 2 weeks: public OpenAPI 3.1, CLI `markos generate`, webhook primitive, presetted onboarding, `llms.txt` + doc mirror, MCP server with Claude Marketplace listing, SDK auto-gen CI, Claude Marketplace landing + demo sandbox.
**Requirements Mapped:** API-01, SDK-01, MCP-01, WHK-01, CLI-01, QA-01..15
**Depends on:** v3.9.0 closure
**Status:** 📋 Planned
**Plans:** 8/8 plans complete

Plans:
- [x] 200-01-PLAN.md — Public OpenAPI 3.1 merge + serve (files written, commit pending)
- [ ] 200-02-PLAN.md — CLI `markos generate <brief>` one-shot mode
- [ ] 200-03-PLAN.md — Webhook subscription primitive
- [ ] 200-04-PLAN.md — Presetted onboarding `--preset=<bucket>`
- [ ] 200-05-PLAN.md — Public `llms.txt` + markdown doc mirror
- [ ] 200-06-PLAN.md — MCP server (10 skills) + Claude Marketplace listing
- [ ] 200-07-PLAN.md — SDK auto-gen CI (TS + Python)
- [ ] 200-08-PLAN.md — Claude Marketplace landing + demo sandbox

### Phase 201: SaaS Tenancy Hardening
**Goal:** Public signups with verification, org → tenant model, custom subdomains via routing middleware, audit-log alignment, tenant offboarding + data-export.
**Requirements Mapped:** API-02, QA-01..15
**Depends on:** Phase 200
**Status:** ✅ Complete — verified 2026-04-17 (see 201-VERIFICATION.md)
**Plans:** 8/8 plans complete
**DISCUSS:** `.planning/phases/201-saas-tenancy-hardening/DISCUSS.md`

Plans:
- [x] 201-01-PLAN.md — Org + tenant schema (markos_orgs + FK + RLS) + reserved-slug blocklist library
- [x] 201-02-PLAN.md — Unified markos_audit_log + per-tenant SHA-256 hash chain + at-least-once staging drain
- [x] 201-03-PLAN.md — Public signup (magic-link + BotID + 5/h rate-limit + double opt-in provisioner) + Surface 1 /signup
- [x] 201-04-PLAN.md — Passkey opt-in (@simplewebauthn v13 wrapper + PasskeyPrompt card on 2nd login)
- [x] 201-05-PLAN.md — middleware.ts (subdomain + reserved + BYOD) + 30-day rolling session + Surface 2 + Surface 8
- [x] 201-06-PLAN.md — BYOD custom domain (Vercel Domains API + webhook verify) + Surface 3 + Surface 7 vanity login + tenant branding
- [x] 201-07-PLAN.md — Members + invites (seat pool) + Surface 5 switcher + Surface 4 + Surface 6 offboarding + GDPR export
- [x] 201-08-PLAN.md — Cross-domain audit emit wiring + openapi.json regen + 5 docs pages + llms.txt + F-88 audit query + vercel.ts crons + @vercel/edge-config slug cache

### Phase 202: MCP Server GA + Claude Marketplace Launch
**Goal:** Graduate the 0-day MCP server to GA: session persistence, +20 skills, public marketplace approval, Cursor / Windsurf / Warp certified.
**Requirements Mapped:** MCP-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/202-mcp-server-ga-claude-marketplace/DISCUSS.md`

### Phase 203: Webhook Subscription Engine GA
**Goal:** Graduate 200-03 webhook primitive to GA: durable Supabase + Vercel Queues substrate, tenant-admin dashboard (2 surfaces), DLQ + replay, signing-secret rotation with 30-day grace + T-7/T-1/T-0 notifications + Surface 4 banner, per-subscription rate-limits + circuit breaker, public status page, full observability + docs.
**Requirements Mapped:** WHK-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** 📋 Planned — 10 plans across 5 waves
**Plans:** 2/10 plans executed
**DISCUSS:** `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md`

Plans:
- [x] 203-01-PLAN.md — Supabase + Vercel Queues adapter swap (Wave 1)
- [x] 203-02-PLAN.md — SSRF guard + Migration 72 DLQ/rotation schema (Wave 1)
- [ ] 203-03-PLAN.md — DLQ library + 7-day TTL purge cron (Wave 2)
- [ ] 203-04-PLAN.md — Replay endpoints + dual-sign foundation + batch idempotency (Wave 2)
- [ ] 203-05-PLAN.md — Rotation orchestrator + dual-sign dispatch + 3 tenant endpoints (Wave 3)
- [ ] 203-06-PLAN.md — T-7/T-1/T-0 notification cron + Surface 4 global banner (Wave 3)
- [ ] 203-07-PLAN.md — Per-subscription rate-limit (plan-tier + override) (Wave 4)
- [ ] 203-08-PLAN.md — Circuit breaker (Redis sliding-window) (Wave 4)
- [ ] 203-09-PLAN.md — Dashboard Surface 1 + Surface 2 + 5 tenant APIs (Wave 5)
- [ ] 203-10-PLAN.md — Public status Surface 3 + Sentry + log-drain + docs + final OpenAPI (Wave 5)

### Phase 204: CLI `markos` v1 GA
**Goal:** Graduate CLI to full GA: init · generate · plan · run · eval · login · keys · whoami · env · status · doctor. Cross-platform distribution (Homebrew · Scoop · npm · winget · apt).
**Requirements Mapped:** CLI-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/204-cli-markos-v1-ga/DISCUSS.md`

### Phase 205: Billing Self-Serve + BYOK
**Goal:** Stripe-backed self-serve billing portal. Platform fee + metered AI + BYOK discount. Transparent invoices. Stripe Tax.
**Requirements Mapped:** BILL-01, BILL-02, QA-01..15
**Depends on:** Phase 201
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/205-billing-self-serve-byok/DISCUSS.md`

### Phase 206: SOC 2 Type I Foundation
**Goal:** Engage auditor · author + ratify SOC 2 policies · automate evidence · first pen test · close first audit in v4.2.0.
**Requirements Mapped:** COMP-01, QA-01..15
**Depends on:** Phases 200–205
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/206-soc2-type1-foundation/DISCUSS.md`

### Locked SaaS Decisions (2026-04-16)

Summary: SaaS cloud first · platform fee + metered AI + BYOK discount · OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n order · 13 tier-1 connectors (Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase) · 7 tier-1 languages v1 · SOC 2 Type I 6mo · Agency white-label upsell · Tiered autonomy · US-East → US+EU → APAC · Plugin + Agent marketplace Y1 · API-first + great UI · Target ICP: B2B SaaS + DTC + solopreneurs · Brand stance: developer-native · AI-first · quietly confident · Nango embedded.

Full detail: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`.

## Archived Milestone Notes

Historical milestone details remain under `.planning/milestones/` and committed git history so the root roadmap can stay focused on the active execution lane.

