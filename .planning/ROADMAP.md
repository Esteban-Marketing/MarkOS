# Roadmap: MarkOS (MARKOS)

## Milestones

> Archived milestone phase details are intentionally kept in the matching files under `.planning/milestones/`, while this roadmap stays summary-first for active planning work.

- Planned next: **v4.1.0 SaaS Suite + Growth Strategy** - phases 214-220 for SaaS activation, subscriptions, billing/compliance, churn/support/usage, revenue intelligence, SAS agents, and governed SaaS growth engines from document 17.
- SaaS Growth Strategy from `17-SAAS-MARKETING-OS-STRATEGY.md` is now routed to phases 218-220 and remains gated behind Pricing Engine, v2 operating loop, and SaaS Suite foundations.
- Future reserved lane: **v4.2.0 Commercial Engines 1.0** - phases 221-228 for CDP, CRM, email, messaging, conversion, launches, analytics, sales enablement, ecosystem growth, and commercial-system integration from incoming documents 18-26.

- 🚧 **v4.0.0 SaaS Readiness 1.0** — Active milestone; phases 200-213 (API · SDK · MCP · webhooks · CLI · Pricing Engine · SOC2-I · v2 operating loop compliance). See section below.
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

**Goal:** Ship the first public SaaS release of MarkOS. API-first · MCP-native · SDK + CLI · webhooks · Claude Marketplace · Pricing Engine-backed billing readiness · SOC 2 Type I foundation. Invest heaviest in foundations (Quality Baseline 15 gates) before feature velocity compounds.

**Requirements to map:** API-01, API-02, SDK-01, MCP-01, WHK-01, CLI-01, PRC-01..09, BILL-01, BILL-02, COMP-01, QA-01..15, RUN-01..08, TASK-01..05, EVD-01..06, CONN-01..06, LOOP-01..08, LRN-01..05, T0-01..05.

**Research/context:** `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`, `obsidian/brain/Pricing Engine Canon.md`, `obsidian/brain/SaaS Suite Canon.md`, `obsidian/brain/SaaS Marketing OS Strategy Canon.md`, `obsidian/work/active/2026-04-22-markos-v2-pricing-engine-intake.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`, `.planning/V4.0.0-PHASE-200-FORWARD-INCOMING-DISCUSSION-REVIEW.md`, `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`, `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`, [[MarkOS Canon]], [[Target ICP]], [[Brand Stance]].

**Cross-phase testing doctrine:** `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` and `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` are mandatory planning inputs for execution from Phase 204 forward.

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
**Status:** 📋 Planned — 10 plans across 5 waves + 1 gap-closure plan (Wave 6)
**Plans:** 11/11 plans complete
**DISCUSS:** `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md`

Plans:
- [x] 203-01-PLAN.md — Supabase + Vercel Queues adapter swap (Wave 1)
- [x] 203-02-PLAN.md — SSRF guard + Migration 72 DLQ/rotation schema (Wave 1)
- [x] 203-03-PLAN.md — DLQ library + 7-day TTL purge cron (Wave 2)
- [x] 203-04-PLAN.md — Replay endpoints + dual-sign foundation + batch idempotency (Wave 2)
- [x] 203-05-PLAN.md — Rotation orchestrator + dual-sign dispatch + 3 tenant endpoints (Wave 3)
- [x] 203-06-PLAN.md — T-7/T-1/T-0 notification cron + Surface 4 global banner (Wave 3)
- [x] 203-07-PLAN.md — Per-subscription rate-limit (plan-tier + override) (Wave 4)
- [x] 203-08-PLAN.md — Circuit breaker (Redis sliding-window) (Wave 4)
- [x] 203-09-PLAN.md — Dashboard Surface 1 + Surface 2 + 5 tenant APIs (Wave 5)
- [x] 203-10-PLAN.md — Public status Surface 3 + Sentry + log-drain + docs + final OpenAPI (Wave 5)
- [x] 203-11-PLAN.md — Gap closure: wire RotationGraceBanner into layout-shell.tsx (Wave 6, gap_closure)

### Phase 204: CLI `markos` v1 GA
**Goal:** Graduate CLI to full GA: 11 commands (`init` · `generate` (shipped 200-02) · `plan` · `run` · `eval` · `login` · `keys` · `whoami` · `env` · `status` · `doctor`). Wave 1 distribution (npm · Homebrew · Scoop); winget + apt deferred to 204.1 per CONTEXT §Deferred.
**Requirements Mapped:** CLI-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23; 13 plans across 4 waves + 1 v2 compliance gap-closure
**Plans:** 11/13 plans executed
**DISCUSS:** `.planning/phases/204-cli-markos-v1-ga/DISCUSS.md`

Plans:
- [x] 204-01-PLAN.md — Dispatch extension + 7 shared CLI primitives + 2 migrations (73 device sessions, 74 API keys) + audit domain extension (Wave 1)
- [x] 204-02-PLAN.md — OAuth device flow (3 endpoints) + `markos login` + F-101 contract + 31 tests (Wave 1)
- [x] 204-03-PLAN.md — API keys CRUD library + 3 endpoints + `markos keys list|create|revoke` + F-102 contract + 31 tests (Wave 1)
- [x] 204-04-PLAN.md — `markos whoami` + resolveWhoami primitive + /api/tenant/whoami + F-105 scaffold (Wave 1)
- [x] 204-05-PLAN.md — `markos init` (delegator) + `markos plan` dry-run + `markos eval` local rubric + /api/tenant/runs/plan endpoint + F-103 + 29 tests (Wave 2 lead)
- [x] 204-06-PLAN.md — `markos run` with SSE watch + migration 75 (markos_cli_runs) + POST /runs + GET /runs/{id}/events + POST /runs/{id}/cancel + F-103 merged (4 paths) + 40 tests (Wave 2 centerpiece; 2026-04-24)
- [x] 204-07-PLAN.md — `markos env list|pull|push|delete` + migration 76 (pgcrypto-encrypted tenant env) + 4 endpoints + F-104 contract + 35 tests (Wave 2 close; 2026-04-24)
- [x] 204-08-PLAN.md — `markos status` (subscription + quota + rotations + recent runs) + /api/tenant/status + F-105 completion + --watch + status run + 19 tests (Wave 3 lead; 2026-04-24)
- [x] 204-09-PLAN.md — `markos doctor` with 9 checks + --check-only CI gate + --fix auto-remediation + 22 tests — **Wave 3 CLOSED; 11/11 CLI commands functional** (2026-04-24)
- [x] 204-10-PLAN.md — Homebrew formula `Formula/markos.rb` + bump script + install docs (Wave 4)
- [x] 204-11-PLAN.md — Scoop bucket manifest `bucket/markos.json` + bump script + install docs (Wave 4)
- [x] 204-12-PLAN.md — Release CI matrix (verify → npm → brew + scoop → smoke) + docs trio (errors/environment/commands) + llms.txt Phase 204 section + errors-map parity test + 15 tests — **Wave 4 CLOSED; Phase 204 SHIPS** (2026-04-24)
- [x] 204-13-PLAN.md — v2 compliance guardrails for `run`, `status`, `doctor`, vault freshness, and Pricing Engine placeholder policy (gap closure) — **Phase 204 GA ready for verification** (2026-04-23)

### Phase 205: Pricing Engine Foundation + Billing Readiness
**Goal:** Replace static public pricing assumptions with Pricing Engine-backed intelligence: cost models, competitor matrix, PricingRecommendation records, approval-gated price tests, PRC agents, MCP/API/UI surfaces, and billing-readiness handoff. Stripe billing remains in scope only after pricing objects, cost floors, and packaging recommendations are modeled.
**Requirements Mapped:** PRC-01..09, BILL-01, BILL-02, QA-01..15
**Depends on:** Phase 201, Phase 202 MCP substrate, Phase 204 CLI/API key surfaces where relevant
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23
**DISCUSS:** `.planning/phases/205-pricing-engine-foundation-billing-readiness/DISCUSS.md`
**Plans:** 8/8 plans drafted

Plans:
- [ ] 205-01-PLAN.md — Pricing contracts, schema, RLS, and fresh F-ID/migration allocation
- [ ] 205-02-PLAN.md — Tenant Cost Model and pricing floor
- [ ] 205-03-PLAN.md — Pricing intelligence store and competitor watch list
- [ ] 205-04-PLAN.md — PricingRecommendation and PriceTest approval engine
- [ ] 205-05-PLAN.md — Pricing API and MCP surface
- [ ] 205-06-PLAN.md — Pricing Engine operator UI
- [ ] 205-07-PLAN.md — Billing/Stripe handoff from approved recommendations
- [ ] 205-08-PLAN.md — Tenant 0 pricing dogfood

### Phase 206: SOC 2 Type I Foundation
**Goal:** Engage auditor, ratify SOC2 policies, and automate evidence for the real v2 risk profile: AgentRun/approval evidence, Pricing Engine controls, connector privacy, research evidence, learning governance, Tenant 0 proof, first pen test, and Type I readiness.
**Requirements Mapped:** COMP-01, QA-01..15, RUN-01..08, TASK-01..05, PRC-01..09, CONN-01..06, EVD-01..06, LRN-01..05, T0-01..05
**Depends on:** Phases 200–205; design must stay compatible with Phases 207–213
**Status:** 📋 Planned — updated for v2 + Pricing Engine controls
**DISCUSS:** `.planning/phases/206-soc2-type1-foundation/DISCUSS.md`
**Artifacts:** `206-CONTEXT.md`, `206-RESEARCH.md`
**Plans:** 7/7 plans drafted

Plans:
- [ ] 206-01-PLAN.md — SOC2 control inventory for v2 objects
- [ ] 206-02-PLAN.md — AI governance and approval controls
- [ ] 206-03-PLAN.md — Pricing Engine and billing control mapping
- [ ] 206-04-PLAN.md — Connector privacy, vendor, and retention review
- [ ] 206-05-PLAN.md — Automated evidence collection
- [ ] 206-06-PLAN.md — Incident response, BCP, DR, and pen-test readiness
- [ ] 206-07-PLAN.md — Auditor workspace and Type I readiness package

### Phase 207: AgentRun v2 Orchestration Substrate
**Goal:** Upgrade the partial AgentRun lifecycle into the canonical v2 substrate for durable runs, DAG chains, priority tiers, retries, DLQ, cost estimate/actuals, approvals, tasks, and side-effect idempotency.
**Requirements Mapped:** RUN-01..08, TASK-01, BILL-01, QA-01..15
**Depends on:** Phases 201, 202, 204, 205 where cost/pricing context is relevant
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23
**DISCUSS:** `.planning/phases/207-agentrun-v2-orchestration-substrate/DISCUSS.md`
**Artifacts:** `207-CONTEXT.md`, `207-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 207-01-PLAN.md - AgentRun v2 contracts, schema, and ID allocation
- [ ] 207-02-PLAN.md - Durable run API and event stream
- [ ] 207-03-PLAN.md - Priority, concurrency, retry, timeout, pause, cancel, and DLQ policy
- [ ] 207-04-PLAN.md - ApprovalGate and Task handoff contracts
- [ ] 207-05-PLAN.md - Cost estimate, actual cost, billing, and Pricing Engine context
- [ ] 207-06-PLAN.md - Adoption path for existing and future agents

### Phase 208: Human Operating Interface
**Goal:** Build the Morning Brief, unified Task Board, Approval Inbox, Connector Recovery surface, and Weekly Narrative so operators can make fast, evidence-backed decisions.
**Requirements Mapped:** TASK-01..05, RUN-01..08, CONN-04, LOOP-01..08, QA-01..15
**Depends on:** Phase 207
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23
**DISCUSS:** `.planning/phases/208-human-operating-interface/DISCUSS.md`
**Artifacts:** `208-CONTEXT.md`, `208-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 208-01-PLAN.md - Operating shell information architecture
- [ ] 208-02-PLAN.md - Morning Brief surface
- [ ] 208-03-PLAN.md - Unified Task Board
- [ ] 208-04-PLAN.md - Approval Inbox
- [ ] 208-05-PLAN.md - Connector Recovery and impacted-agent visibility
- [ ] 208-06-PLAN.md - Weekly Narrative

### Phase 209: Evidence, Research, and Claim Safety
**Goal:** Create EvidenceMap, source quality score, research freshness, claim TTL, known gaps, and unsupported-claim blocking across customer-facing outputs.
**Requirements Mapped:** EVD-01..06, LOOP-02..04, PRC-03, PRC-04, QA-01..15
**Depends on:** Phases 207, 208
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/209-evidence-research-and-claim-safety/DISCUSS.md`
**Artifacts:** `209-CONTEXT.md`, `209-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 209-01-PLAN.md - EvidenceMap contracts, schema, and ID allocation
- [ ] 209-02-PLAN.md - Source Quality Score and research tier policy
- [ ] 209-03-PLAN.md - Claim TTL, freshness, stale context, and known gaps
- [ ] 209-04-PLAN.md - Approval UI evidence exposure and claim blocking
- [ ] 209-05-PLAN.md - Research context reuse
- [ ] 209-06-PLAN.md - Citation, inference labeling, and hallucination defense tests

### Phase 210: Connector Wow Loop and Recovery
**Goal:** Implement ConnectorInstall, max-3 onboarding recommendations, first GA4/GSC or equivalent wow audit, dependent-agent pause, recovery tasks, backfill, and connector evidence.
**Requirements Mapped:** CONN-01..06, RUN-01..08, TASK-01..05, QA-01..15
**Depends on:** Phases 207, 208, 209
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/210-connector-wow-loop-and-recovery/DISCUSS.md`
**Artifacts:** `210-CONTEXT.md`, `210-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 210-01-PLAN.md - ConnectorInstall contract and schema
- [ ] 210-02-PLAN.md - Nango and direct adapter decision matrix
- [ ] 210-03-PLAN.md - Max-3 onboarding connector recommendation UX
- [ ] 210-04-PLAN.md - First live-data wow audit
- [ ] 210-05-PLAN.md - Connector failure agent pause and recovery tasks
- [ ] 210-06-PLAN.md - Backfill, retry, and recovery evidence

### Phase 211: Content, Social, and Revenue Loop
**Goal:** Prove the first complete MarkOS operating loop: strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn, with social and revenue pathways.
**Requirements Mapped:** LOOP-01..08, TASK-01..05, EVD-01..06, CONN-01..06, PRC-09, QA-01..15
**Depends on:** Phases 205, 207, 208, 209, 210
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/211-content-social-revenue-loop/DISCUSS.md`
**Artifacts:** `211-CONTEXT.md`, `211-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 211-01-PLAN.md - Strategy and brief object model
- [ ] 211-02-PLAN.md - Draft generation and audit pipeline
- [ ] 211-03-PLAN.md - Approval-to-dispatch path
- [ ] 211-04-PLAN.md - Social signal schema and escalation
- [ ] 211-05-PLAN.md - Revenue attribution feedback
- [ ] 211-06-PLAN.md - Measurement handoff to learning and weekly narrative

### Phase 212: Learning and Literacy Evolution
**Goal:** Add ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate, anonymized cross-tenant learning, and admin-reviewed central literacy promotion.
**Requirements Mapped:** LRN-01..05, EVD-01..06, LOOP-08, QA-01..15
**Depends on:** Phase 211
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/212-learning-literacy-evolution/DISCUSS.md`
**Artifacts:** `212-CONTEXT.md`, `212-RESEARCH.md`
**Plans:** 5/5 plans drafted

Plans:
- [ ] 212-01-PLAN.md - ArtifactPerformanceLog schema and outcome envelope
- [ ] 212-02-PLAN.md - TenantOverlay learning records
- [ ] 212-03-PLAN.md - LiteracyUpdateCandidate queue and admin review
- [ ] 212-04-PLAN.md - Cross-tenant anonymization and privacy controls
- [ ] 212-05-PLAN.md - Learning-driven tasks and strategy recommendations

### Phase 213: Tenant 0 Dogfood and Compliance Validation
**Goal:** Run MarkOS on its own marketing with real data, approved claims, Pricing Engine context, and final vault-to-codebase compliance validation.
**Requirements Mapped:** T0-01..05, LOOP-01..08, PRC-01..09, COMP-01, QA-01..15
**Depends on:** Phases 205-212
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/213-tenant0-dogfood-compliance-validation/DISCUSS.md`
**Artifacts:** `213-CONTEXT.md`, `213-RESEARCH.md`
**Plans:** 5/5 plans drafted

Plans:
- [ ] 213-01-PLAN.md - Tenant 0 workspace, brand pack, connector list, and data policy
- [ ] 213-02-PLAN.md - Tenant 0 first operating loop
- [ ] 213-03-PLAN.md - Tenant 0 Pricing Engine dogfood
- [ ] 213-04-PLAN.md - Public evidence and case-study readiness policy
- [ ] 213-05-PLAN.md - Final vault-to-codebase compliance validation before enterprise positioning

## Next Milestone Candidate: v4.1.0 — SaaS Suite 1.0

**Status:** 📋 Planned after v4.0.0 foundation planning/execution.

**Goal:** Activate MarkOS as a subscription-company operating suite for tenants where `business_type = saas`, while preserving Pricing Engine ownership, AgentRun/task/approval governance, evidence, connector recovery, and SOC2 controls.

**Requirements to map:** SAS-01..10, PRC-01..09, RUN-01..08, TASK-01..05, EVD-01..06, CONN-01..06, LOOP-01..08, COMP-01, QA-01..15. Preserve compatibility with future SG-01..12 requirements without implementing the full SaaS Marketing OS in phases 214-217.

**Research/context:** `obsidian/brain/SaaS Suite Canon.md`, `obsidian/brain/SaaS Marketing OS Strategy Canon.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`, `obsidian/work/incoming/16-SAAS-SUITE.md`, `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`, `.agent/markos/references/saas-suite.md`, `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`.

### Phase 214: SaaS Suite Activation and Subscription Core
**Goal:** Build `business_type = saas` activation, SaaS profile, module gating, plan catalog, subscription lifecycle, lifecycle events, RLS schema, and task/approval posture.
**Requirements Mapped:** SAS-01..03, SAS-04, RUN-01..08, TASK-01..05, QA-01..15
**Depends on:** Phases 205, 207, 208
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/214-saas-suite-activation-subscription-core/DISCUSS.md`
**Artifacts:** `214-CONTEXT.md`, `214-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 214-01-PLAN.md - SaaS activation gate, wizard, and ID allocation
- [ ] 214-02-PLAN.md - SaaS profile, plan, subscription, and lifecycle schema
- [ ] 214-03-PLAN.md - Subscription lifecycle state machine
- [ ] 214-04-PLAN.md - SaaS customer identity bridge
- [ ] 214-05-PLAN.md - Lifecycle tasks, approvals, and audit
- [ ] 214-06-PLAN.md - SaaS core UI/API and growth-mode extension point

### Phase 215: SaaS Billing, Payments, and Multi-Country Compliance
**Goal:** Add invoices, payment processors, Stripe/US billing, Mercado Pago/Colombia support, QuickBooks/Siigo/Alegra sync, DIAN setup, legal invoice compliance, and processor webhook routing through the existing webhook engine.
**Requirements Mapped:** SAS-04..06, PRC-01..09, COMP-01, WHK-01, QA-01..15
**Depends on:** Phases 203, 205, 206, 214
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/215-saas-suite-billing-payments-compliance/DISCUSS.md`
**Artifacts:** `215-CONTEXT.md`, `215-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 215-01-PLAN.md - SaaS invoice and billing event contracts
- [ ] 215-02-PLAN.md - US Stripe, Stripe Tax, and QuickBooks path
- [ ] 215-03-PLAN.md - Colombia Mercado Pago and DIAN provider path
- [ ] 215-04-PLAN.md - Processor webhook routing through existing webhook engine
- [ ] 215-05-PLAN.md - Billing approvals, corrections, dunning, and evidence
- [ ] 215-06-PLAN.md - Future incentive payout compliance hooks

### Phase 216: SaaS Health, Churn, Support, and Product Usage Intelligence
**Goal:** Implement explainable health score, churn alerts, support triage and response drafting, product usage ingestion, intervention playbooks, and approval-gated save/support actions.
**Requirements Mapped:** SAS-07..09, TASK-01..05, EVD-01..06, CONN-01..06, QA-01..15
**Depends on:** Phases 207, 208, 209, 210, 214
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/216-saas-suite-health-churn-support-usage/DISCUSS.md`
**Artifacts:** `216-CONTEXT.md`, `216-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 216-01-PLAN.md - SaaS Health Score contract and explainability
- [ ] 216-02-PLAN.md - Product usage event ingest and PLG signal map
- [ ] 216-03-PLAN.md - SaaS support ticket intelligence and KB grounding
- [ ] 216-04-PLAN.md - Churn intervention playbooks and tasks
- [ ] 216-05-PLAN.md - Privacy, retention, and sensitive support/product data controls
- [ ] 216-06-PLAN.md - Growth handoff signals for PLG, expansion, advocacy, community, and experiments

### Phase 217: SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness
**Goal:** Ship MRR/ARR/NRR/GRR/churn/expansion dashboards, SAS-01..06 agent definitions, `/v1/saas/*` APIs, `markos-saas` MCP tools, and SaaS-specific navigation gated by activation.
**Requirements Mapped:** SAS-09..10, MCP-01, API-01, LOOP-01..08, QA-01..15
**Depends on:** Phases 202, 205, 207-216
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/217-saas-suite-revenue-agents-api-ui/DISCUSS.md`
**Artifacts:** `217-CONTEXT.md`, `217-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 217-01-PLAN.md - SaaS revenue metric definitions and source precedence
- [ ] 217-02-PLAN.md - SaaSMRRSnapshot and revenue intelligence records
- [ ] 217-03-PLAN.md - SAS agent readiness registry
- [ ] 217-04-PLAN.md - `/v1/saas/*` API contracts
- [ ] 217-05-PLAN.md - `markos-saas` MCP tool family
- [ ] 217-06-PLAN.md - SaaS UI navigation and post-217 growth translation gate

### Phase 218: SaaS Growth Profile, PLG, In-App, and Experimentation
**Goal:** Translate SaaS growth-mode routing, PLG activation, PQL scoring, upgrade triggers, in-app marketing, and growth experimentation into governed product objects.
**Requirements Mapped:** SG-01, SG-02, SG-05, SG-07, SG-09, SG-10, SG-11, SG-12, SAS-09, PRC-09, QA-01..15
**Depends on:** Phases 214-217
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/218-saas-growth-profile-plg-inapp-experimentation/DISCUSS.md`
**Artifacts:** `218-CONTEXT.md`, `218-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 218-01-PLAN.md - SaaSGrowthProfile contract and mode routing
- [ ] 218-02-PLAN.md - ActivationDefinition, milestone funnels, and PQLScore
- [ ] 218-03-PLAN.md - UpgradeTrigger and pricing-safe conversion prompts
- [ ] 218-04-PLAN.md - InAppCampaign orchestration, suppression, and approvals
- [ ] 218-05-PLAN.md - MarketingExperiment registry, ICE backlog, guardrails, and decisions
- [ ] 218-06-PLAN.md - PLG, in-app, and experiment agent readiness

### Phase 219: SaaS B2B Expansion, ABM, and Revenue Alignment
**Goal:** Translate B2B SaaS growth requirements into governed account expansion, customer marketing, ABM, buying committee, advocacy, and revenue-team alignment workflows.
**Requirements Mapped:** SG-03, SG-08, SG-09, SG-10, SG-11, SG-12, LOOP-06, EVD-01..06, QA-01..15
**Depends on:** Phases 214-218
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/DISCUSS.md`
**Artifacts:** `219-CONTEXT.md`, `219-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 219-01-PLAN.md - RevenueTeamConfig, lifecycle definitions, SLAs, and feedback loops
- [ ] 219-02-PLAN.md - Account expansion and customer marketing programs
- [ ] 219-03-PLAN.md - ABMAccountPackage and buying committee mapping
- [ ] 219-04-PLAN.md - Customer advocacy, review request, and proof workflows
- [ ] 219-05-PLAN.md - Expansion, save, discount, and Pricing Engine controls
- [ ] 219-06-PLAN.md - B2B growth agent readiness and non-runnable gates

### Phase 220: SaaS Community, Events, PR, Partnerships, Developer Marketing, and Growth Agent Surface
**Goal:** Translate the remaining SaaS growth engines into governed workflows: viral/referral, community, events, PR/reviews/analysts, partnerships/affiliates, developer marketing, and final growth agent/API/MCP/UI surface.
**Requirements Mapped:** SG-04, SG-06, SG-07, SG-09, SG-10, SG-11, SG-12, API-01, MCP-01, QA-01..15
**Depends on:** Phases 214-219
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/DISCUSS.md`
**Artifacts:** `220-CONTEXT.md`, `220-RESEARCH.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 220-01-PLAN.md - ReferralProgram and ViralLoopMetrics
- [ ] 220-02-PLAN.md - CommunityProfile and community health workflows
- [ ] 220-03-PLAN.md - MarketingEvent workflow and attribution
- [ ] 220-04-PLAN.md - PR, analyst, and review intelligence
- [ ] 220-05-PLAN.md - Partnerships, affiliate, and developer marketing workflows
- [ ] 220-06-PLAN.md - Growth API/MCP/UI and target agent readiness closure

## Future Milestone Candidate: v4.2.0 - Commercial Engines 1.0

**Status:** Planned after v4.1.0 foundation planning/execution.

**Goal:** Turn MarkOS from a strong SaaS-marketing operating loop into a native commercial operating system with first-party identity, CRM, owned-channel execution, conversion surfaces, attribution, sales enablement, launches, and ecosystem growth - all governed by AgentRun, approvals, evidence, Pricing Engine, and the cross-phase testing doctrine.

**Requirements to map:** CDP-01..05, CRM-01..05, EML-01..05, MSG-01..05, CNV-01..05, LCH-01..05, ANL-01..05, SEN-01..05, ECO-01..05, COM-01..06, PRC-01..09, RUN-01..08, TASK-01..05, EVD-01..06, QA-01..15. Preserve compatibility with existing SAS-01..10 and SG-01..12 foundations rather than replacing them.

**Research/context:** `obsidian/work/incoming/18-CRM-ENGINE.md`, `obsidian/work/incoming/19-EMAIL-ENGINE.md`, `obsidian/work/incoming/20-CDP-ENGINE.md`, `obsidian/work/incoming/21-MESSAGING-ENGINE.md`, `obsidian/work/incoming/22-ANALYTICS-ENGINE.md`, `obsidian/work/incoming/23-CONVERSION-ENGINE.md`, `obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md`, `obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md`, `obsidian/work/incoming/26-LAUNCH-ENGINE.md`, `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`, `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`, `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`, `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`, `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.

### Phase 221: CDP Identity, Audience, and Consent Substrate
**Goal:** Create the first-party customer-data substrate for identity resolution, event normalization, consent, segmentation, and activation-safe audience facts.
**Requirements Mapped:** CDP-01..05, RUN-01..08, EVD-01..06, QA-01..15
**Depends on:** Phases 207, 209, 210, 214-217
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/221-cdp-identity-audience-consent-substrate/DISCUSS.md`
**Artifacts:** `221-CONTEXT.md`, `221-RESEARCH.md`

### Phase 222: CRM Timeline and Commercial Memory Workspace
**Goal:** Evolve MarkOS into a timeline-first CRM with customer 360, account/person/opportunity memory, lifecycle orchestration, and next-best-action workspaces.
**Requirements Mapped:** CRM-01..05, CDP-01..05, TASK-01..05, QA-01..15
**Depends on:** Phases 208, 209, 211, 221
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/222-crm-timeline-commercial-memory-workspace/DISCUSS.md`
**Artifacts:** `222-CONTEXT.md`, `222-RESEARCH.md`

### Phase 223: Native Email and Messaging Orchestration
**Goal:** Add first-party owned-channel execution for email, WhatsApp, SMS, and push with shared consent, approvals, deliverability, templates, and commercial memory.
**Requirements Mapped:** EML-01..05, MSG-01..05, CDP-01..05, CRM-01..05, QA-01..15
**Depends on:** Phases 205, 207, 208, 209, 210, 221, 222
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/223-native-email-messaging-orchestration/DISCUSS.md`
**Artifacts:** `223-CONTEXT.md`, `223-RESEARCH.md`

### Phase 224: Conversion and Launch Workspace
**Goal:** Build native landing pages, forms, CTAs, launch programs, readiness workflows, rollout controls, and post-launch feedback loops.
**Requirements Mapped:** CNV-01..05, LCH-01..05, PRC-01..09, QA-01..15
**Depends on:** Phases 205, 207, 208, 209, 221-223
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/224-conversion-launch-workspace/DISCUSS.md`
**Artifacts:** `224-CONTEXT.md`, `224-RESEARCH.md`

### Phase 225: Analytics, Attribution, and Narrative Intelligence
**Goal:** Create the semantic layer for attribution, customer journeys, performance narratives, explainable metrics, and decision-grade measurement.
**Requirements Mapped:** ANL-01..05, EVD-01..06, LOOP-07, LOOP-08, QA-01..15
**Depends on:** Phases 209, 211, 212, 221-224
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/225-analytics-attribution-narrative-intelligence/DISCUSS.md`
**Artifacts:** `225-CONTEXT.md`, `225-RESEARCH.md`

### Phase 226: Sales Enablement and Deal Execution
**Goal:** Add battlecards, objection intelligence, proof packs, proposal support, win/loss capture, and approval-aware deal execution tied back to CRM, Pricing Engine, and evidence.
**Requirements Mapped:** SEN-01..05, CRM-01..05, PRC-01..09, EVD-01..06, QA-01..15
**Depends on:** Phases 205, 209, 221, 222, 225
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/226-sales-enablement-deal-execution/DISCUSS.md`
**Artifacts:** `226-CONTEXT.md`, `226-RESEARCH.md`

### Phase 227: Ecosystem, Partner, Community, and Developer Growth
**Goal:** Build governed ecosystem distribution across marketplace listings, partners, affiliates, referrals, community, and developer growth.
**Requirements Mapped:** ECO-01..05, SG-04, SG-06, SG-09..12, QA-01..15
**Depends on:** Phases 220, 221, 222, 225
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/227-ecosystem-partner-community-developer-growth/DISCUSS.md`
**Artifacts:** `227-CONTEXT.md`, `227-RESEARCH.md`

### Phase 228: Commercial OS Integration and Future-Readiness Closure
**Goal:** Close the lane by enforcing shared contracts, API/MCP/UI parity, migration posture, provider replaceability, testing obligations, and no-obsolescence guarantees across the full commercial stack.
**Requirements Mapped:** COM-01..06, QA-01..15
**Depends on:** Phases 221-227
**Status:** Discuss/context/research drafted
**DISCUSS:** `.planning/phases/228-commercial-os-integration-future-readiness/DISCUSS.md`
**Artifacts:** `228-CONTEXT.md`, `228-RESEARCH.md`

### Locked SaaS Decisions (2026-04-16)

Summary: SaaS cloud first · static monetization assumptions superseded by Pricing Engine Canon · OpenAPI -> SDKs -> MCP -> Webhooks -> Zapier -> Make -> n8n order · 13 tier-1 connectors (Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase) · 7 tier-1 languages v1 · SOC 2 Type I 6mo · agency/OEM packaging pending Pricing Engine recommendations · Tiered autonomy · US-East -> US+EU -> APAC · Plugin + Agent marketplace Y1 · API-first + great UI · v2 ICP: growth-stage B2B marketing leaders first, agencies second · Brand stance: AI-first, quietly confident, evidence-backed · Nango embedded where it fits.

Full detail: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`.

## Archived Milestone Notes

Historical milestone details remain under `.planning/milestones/` and committed git history so the root roadmap can stay focused on the active execution lane.
