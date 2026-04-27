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
**Closeout posture:** Historical hardening phase closeout. Live DNS, email, BotID, passkey, export, cookie, purge, and staging-load checks remain informational operational smokes rather than execution blockers.
**Status:** ✅ Complete — verified 2026-04-17 (see 201-VERIFICATION.md)
**Plans:** 8/8 plans complete
**DISCUSS:** `.planning/phases/201-saas-tenancy-hardening/DISCUSS.md`
**Planning Note:** Reconciled 2026-04-27 so validation, verification, and context artifacts all treat DNS, email, BotID, passkey, export, cookie, purge, and staging-load checks as operational hardening smokes rather than execution blockers.
**Artifacts:** `201-CONTEXT.md`, `201-RESEARCH.md`, `201-REVIEWS.md`, `201-VALIDATION.md`, `201-VERIFICATION.md`

Plans:
- [x] 201-01-PLAN.md — Org + tenant schema (markos_orgs + FK + RLS) + reserved-slug blocklist library
- [x] 201-02-PLAN.md — Unified markos_audit_log + per-tenant SHA-256 hash chain + at-least-once staging drain
- [x] 201-03-PLAN.md — Public signup (magic-link + BotID + 5/h rate-limit + double opt-in provisioner) + Surface 1 /signup
- [x] 201-04-PLAN.md — Passkey opt-in (@simplewebauthn v13 wrapper + PasskeyPrompt card on 2nd login)
- [x] 201-05-PLAN.md — middleware.ts (subdomain + reserved + BYOD) + 30-day rolling session + Surface 2 + Surface 8
- [x] 201-06-PLAN.md — BYOD custom domain (Vercel Domains API + webhook verify) + Surface 3 + Surface 7 vanity login + tenant branding
- [x] 201-07-PLAN.md — Members + invites (seat pool) + Surface 5 switcher + Surface 4 + Surface 6 offboarding + GDPR export
- [x] 201-08-PLAN.md — Cross-domain audit emit wiring + openapi.json regen + 5 docs pages + llms.txt + F-88 audit query + vercel.ts crons + @vercel/edge-config slug cache

### Phase 201.1: SaaS Tenancy Hardening — Review-Driven Followups
**Goal:** Close 6 HIGH and 1 MEDIUM concerns surfaced by the 2026-04-27 cross-AI review of Phase 201: move audit emit inline (drop res.end footgun in approve.js / submit.js), harden GDPR signed URL beyond bearer-credential semantics, pin canonical-JSON spec for Node↔Postgres parity with property-based fuzzer, add jittered-TTL + single-flight + transitional-410 to edge-config slug cache, eliminate the Plan-03 rate-limit race by promoting the SQL fn into Plan 03 (or a hard deploy-gate), and resolve the right-to-erasure vs hash-chain conflict with an explicit pseudonymize-with-tombstone policy. Operational smokes (DNS, email, BotID live, real-device passkey, GDPR retrieval, 30-day cron, cookie SameSite, staging perf) reclassified back to v4.0.0-release gates with a staging smoke harness rather than informational notes.
**Requirements Mapped:** API-02, QA-01, QA-02, QA-04, QA-05, QA-09, QA-11, QA-12, QA-13, QA-15
**Depends on:** Phase 201
**Status:** Planning
**Source:** `.planning/phases/201-saas-tenancy-hardening/201-REVIEWS.md` (claude-cli separate-session pass, 2026-04-27)
**Artifacts:** `201.1-CONTEXT.md`, `201.1-REVIEWS.md` (mirrors 201-REVIEWS.md)

### Phase 202: MCP Server GA + Claude Marketplace Launch
**Goal:** Graduate the 0-day MCP server to GA for the Claude Marketplace launch package: session persistence, +20 skills, marketplace-ready assets and docs, and a VS Code cert-ready path. Cursor / Windsurf / Warp / ChatGPT certifications defer to `202.1`.
**Requirements Mapped:** MCP-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** ✅ Verified - Phase 202 closed for Claude Marketplace + VS Code cert-ready scope; broader client certs deferred to 202.1
**DISCUSS:** `.planning/phases/202-mcp-server-ga-claude-marketplace/DISCUSS.md`
**Plans:** 10/10 plans complete
**Planning Note:** Marketplace approval itself is treated as an external operational workflow, not a code-verification gate. Phase 202 verification now aligns to the narrower shipped scope that later artifacts already enforced.
**Artifacts:** `202-CONTEXT.md`, `202-RESEARCH.md`, `202-REVIEWS.md`, `202-VALIDATION.md`, `202-VERIFICATION.md`, `deferred-items.md`

### Phase 203: Webhook Subscription Engine GA
**Goal:** Graduate 200-03 webhook primitive to GA: durable Supabase + Vercel Queues substrate, tenant-admin dashboard (2 surfaces), DLQ + replay, signing-secret rotation with 30-day grace + T-7/T-1/T-0 notifications + Surface 4 banner, per-subscription rate-limits + circuit breaker, public status page, full observability + docs.
**Requirements Mapped:** WHK-01, QA-01..15
**Depends on:** Phase 200, Phase 201
**Status:** 🟡 Human UAT pending - 11/11 plans complete; 203-11 gap closure shipped and code verification is green
**Plans:** 11/11 plans complete
**DISCUSS:** `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md`
**Planning Note:** Phase 203 is structurally complete and executable. Remaining closeout is live-infrastructure UAT plus reconciled metadata across validation and verification artifacts.
**Artifacts:** `203-CONTEXT.md`, `203-RESEARCH.md`, `203-REVIEWS.md`, `203-VALIDATION.md`, `203-VERIFICATION.md`, `203-HUMAN-UAT.md`

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
**Status:** ✅ Verified - Phase 204 shipped 2026-04-24; 204-13 executable-schema and status reconciliation refreshed 2026-04-27
**Plans:** 13/13 plans complete
**DISCUSS:** `.planning/phases/204-cli-markos-v1-ga/DISCUSS.md`
**Planning Note:** `204-13` now lives in the executable GSD schema and treats later pricing/run/SaaS doctrine as compatibility input instead of a blocking future-phase dependency chain.
**Artifacts:** `204-CONTEXT.md`, `204-RESEARCH.md`, `204-REVIEWS.md`, `204-VALIDATION.md`, `204-VERIFICATION.md`

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
- [x] 204-13-PLAN.md — v2 compatibility guardrails for `run`, `status`, `doctor`, vault freshness, and Pricing Engine placeholder policy (bounded gap closure; executable schema refreshed 2026-04-27) — **Phase 204 GA ready for verification** (2026-04-23)

### Phase 204.1: close 5 fixes + Bonus Gap #3/#4 (decision needed) + winget/apt distribution (INSERTED)

**Goal:** Close P204 audit findings (5 fixes + 2 decisions from UI-REVIEW d9ede52) and complete deferred Wave 1 distribution (winget + apt). Pure follow-up phase covering D-01 audit trail wiring, D-02 spinner primitive, D-03 stdout/stderr stream split, D-04 ASCII fallback, D-05 <60-col width breakpoint, D-06 env mask last-4 reconciliation, D-07 status pricing-placeholder enforcement, D-08 winget manifest, D-09 apt repo.
**Requirements**: CLI-01, QA-01..15 (inherits from P204; no new requirement IDs)
**Depends on:** Phase 204
**Plans:** 5 plans

Plans:
- [ ] 204.1-01-PLAN.md — Audit trail wrapper at dispatch (D-01 + D-12 fallback) — Wave 1
- [ ] 204.1-02-PLAN.md — Spinner primitive + stream-split (D-02 + D-03) — Wave 1
- [ ] 204.1-03-PLAN.md — ASCII fallback + <60-col width breakpoint (D-04 + D-05) — Wave 2
- [ ] 204.1-04-PLAN.md — Env mask last-4 + status pricing placeholder + status spinner (D-06 + D-07) — Wave 3
- [ ] 204.1-05-PLAN.md — winget manifest + apt repo distribution (D-08 + D-09, includes user-setup checkpoint) — Wave 1

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
**Goal:** Define the SOC2 Type I control foundation for the real v2 risk profile: approval-aware agents, pricing and billing controls, connector privacy, evidence and learning governance, Tenant 0 proof boundaries, SaaS financial posture, and auditor-ready Type I packaging.
**Requirements Mapped:** COMP-01, QA-01..15
**Depends on:** Phases 200–205; design must stay compatible with Phases 207–213
**Status:** 📋 Planned — updated for v2 + Pricing Engine controls
**DISCUSS:** `.planning/phases/206-soc2-type1-foundation/DISCUSS.md`
**Planning Note:** Replanned 2026-04-27 with executable schema frontmatter, a Wave 0.5 compatibility lock, a direct-ownership boundary around `COMP-01`, and explicit translation gates for later implementation phases.
**Artifacts:** `206-CONTEXT.md`, `206-RESEARCH.md`, `206-REVIEWS.md`, `206-VALIDATION.md`
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
**Goal:** Upgrade the partial AgentRun lifecycle into the canonical v2 substrate for durable runs, DAG chains, priority tiers, retries, DLQ, cost estimate/actuals, approval-aware side effects, run handoff records, and compatibility adapters.
**Requirements Mapped:** RUN-01..08, QA-01..15
**Depends on:** Phases 201, 202, 204, 205, 206
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23
**DISCUSS:** `.planning/phases/207-agentrun-v2-orchestration-substrate/DISCUSS.md`
**Planning Note:** Replanned 2026-04-27 with executable schema frontmatter, explicit Phase 206 preflight, downstream-safe handoff contracts for Phase 208, and a validation strategy before execution begins.
**Artifacts:** `207-CONTEXT.md`, `207-RESEARCH.md`, `207-REVIEWS.md`, `207-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 207-01-PLAN.md - Upstream preflight, contract lock, and schema baseline
- [ ] 207-02-PLAN.md - Durable run API and shared event stream
- [ ] 207-03-PLAN.md - Scheduler, chains, retry, timeout, and DLQ policy
- [ ] 207-04-PLAN.md - Approval-aware side effects and run handoff records
- [ ] 207-05-PLAN.md - Run cost, billing bridge, and pricing context
- [ ] 207-06-PLAN.md - Compatibility adapters, registry, and rollout

### Phase 208: Human Operating Interface
**Goal:** Build the Morning Brief, unified Task Board, Approval Inbox, Recovery Center, and Weekly Narrative as one operator cockpit, while keeping evidence, connector, loop, and learning systems as later integrations instead of hidden current dependencies.
**Requirements Mapped:** TASK-01..05, QA-01..15
**Depends on:** Phases 205-207
**Status:** 📋 Planned - discuss/research refreshed 2026-04-23
**DISCUSS:** `.planning/phases/208-human-operating-interface/DISCUSS.md`
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, shell-first contracts, and future translation gates for Phases 209-212.
**Artifacts:** `208-CONTEXT.md`, `208-RESEARCH.md`, `208-REVIEWS.md`, `208-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 208-01-PLAN.md - Wave 0.5 upstream preflight, architecture lock, and shell route contract
- [ ] 208-02-PLAN.md - Morning Brief contract and landing experience
- [ ] 208-03-PLAN.md - Unified Task Board and persisted operator work contract
- [ ] 208-04-PLAN.md - Approval Inbox contract and blocker states
- [ ] 208-05-PLAN.md - Recovery Center and impacted-work visibility contract
- [ ] 208-06-PLAN.md - Weekly Narrative and future integration boundaries

### Phase 209: Evidence, Research, and Claim Safety
**Goal:** Create EvidenceMap, source quality score, research freshness, claim TTL, known gaps, and unsupported-claim blocking across customer-facing outputs.
**Requirements Mapped:** EVD-01..06, QA-01..15
**Depends on:** Phases 205-208
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, EvidenceMap contracts, pricing/compliance integration boundaries, and a future claim-evidence consumer map.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/209-evidence-research-and-claim-safety/DISCUSS.md`
**Artifacts:** `209-CONTEXT.md`, `209-RESEARCH.md`, `209-REVIEWS.md`, `209-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 209-01-PLAN.md - Wave 0.5 upstream preflight, architecture-lock, and EvidenceMap foundation
- [ ] 209-02-PLAN.md - Source quality rubric, research tiers, and pricing-evidence bridge
- [ ] 209-03-PLAN.md - Freshness, TTL, stale-context, and known-gap policy
- [ ] 209-04-PLAN.md - Approval evidence snapshots and unsupported-claim blocking
- [ ] 209-05-PLAN.md - Research context reuse and AgentRun linkage
- [ ] 209-06-PLAN.md - Citation, inference labeling, hallucination defense, and future claim-evidence matrix

### Phase 210: Connector Wow Loop and Recovery
**Goal:** Implement ConnectorInstall, max-3 onboarding recommendations, first GA4/GSC or equivalent wow audit, dependent-agent pause, recovery tasks, backfill, and connector evidence.
**Requirements Mapped:** CONN-01..06, QA-01..15
**Depends on:** Phases 206-209
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, ConnectorInstall state contracts, adapter evidence rules, low-risk wow-audit posture, and recovery/backfill governance.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/210-connector-wow-loop-and-recovery/DISCUSS.md`
**Artifacts:** `210-CONTEXT.md`, `210-RESEARCH.md`, `210-REVIEWS.md`, `210-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 210-01-PLAN.md - Wave 0.5 upstream preflight, architecture-lock, and ConnectorInstall foundation
- [ ] 210-02-PLAN.md - Adapter decision matrix with official-doc traceability
- [ ] 210-03-PLAN.md - Max-3 onboarding recommendation policy and wow-promise copy
- [ ] 210-04-PLAN.md - First live-data wow audit and fallback paths
- [ ] 210-05-PLAN.md - Dependent-agent pause and precise recovery tasks
- [ ] 210-06-PLAN.md - Backfill, retry, recovery evidence, and future connector compatibility map

### Phase 211: Content, Social, and Revenue Loop
**Goal:** Prove the first complete MarkOS operating loop: strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn, with social and revenue pathways.
**Requirements Mapped:** LOOP-01..08, QA-01..15
**Depends on:** Phases 205-210
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, loop-object contracts, compliance-aware dispatch gates, and future-growth consumer boundaries.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/211-content-social-revenue-loop/DISCUSS.md`
**Artifacts:** `211-CONTEXT.md`, `211-RESEARCH.md`, `211-REVIEWS.md`, `211-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 211-01-PLAN.md - Wave 0.5 upstream preflight, architecture-lock, and strategy/brief contract foundation
- [ ] 211-02-PLAN.md - MarketingArtifact and ArtifactAudit pipeline
- [ ] 211-03-PLAN.md - DispatchAttempt state machine and approval-to-dispatch path
- [ ] 211-04-PLAN.md - SocialSignal routing and escalation posture
- [ ] 211-05-PLAN.md - Revenue feedback links and weekly narrative inputs
- [ ] 211-06-PLAN.md - Measurement handoff, next-task generation, and future-growth compatibility map

### Phase 212: Learning and Literacy Evolution
**Goal:** Add ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate, anonymized cross-tenant learning, and admin-reviewed central literacy promotion.
**Requirements Mapped:** LRN-01..05, QA-01..15
**Depends on:** Phases 206-209, 211
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, tenant-overlay/promotion/privacy gates, and future-growth compatibility boundaries.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/212-learning-literacy-evolution/DISCUSS.md`
**Artifacts:** `212-CONTEXT.md`, `212-RESEARCH.md`, `212-REVIEWS.md`, `212-VALIDATION.md`
**Plans:** 5/5 plans drafted

Plans:
- [ ] 212-01-PLAN.md - Wave 0.5 upstream preflight, architecture-lock, and ArtifactPerformanceLog foundation
- [ ] 212-02-PLAN.md - TenantOverlay records, expiry, suppression, and merge posture
- [ ] 212-03-PLAN.md - LiteracyUpdateCandidate queue and admin-reviewed promotion path
- [ ] 212-04-PLAN.md - Cross-tenant anonymization, redaction, and threshold gates
- [ ] 212-05-PLAN.md - LearningRecommendation handoff and future-growth compatibility map

### Phase 213: Tenant 0 Dogfood and Compliance Validation
**Goal:** Run MarkOS on its own marketing with real data, approved claims, Pricing Engine context, and final vault-to-codebase compliance validation.
**Requirements Mapped:** T0-01..05, QA-01..15
**Depends on:** Phases 205-212
**Planning Note:** Replanned 2026-04-27 with explicit upstream preflight, validation strategy, pricing/public-proof release gates, and an authoritative 214-217 go/no-go closeout.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/213-tenant0-dogfood-compliance-validation/DISCUSS.md`
**Artifacts:** `213-CONTEXT.md`, `213-RESEARCH.md`, `213-REVIEWS.md`, `213-VALIDATION.md`
**Plans:** 5/5 plans drafted

Plans:
- [ ] 213-01-PLAN.md - Wave 0.5 upstream preflight, architecture-lock, Tenant 0 workspace profile, connector inventory, and data policy
- [ ] 213-02-PLAN.md - First real Tenant 0 operating loop with evidence, approval, dispatch honesty, and learning handoff
- [ ] 213-03-PLAN.md - Public pricing audit and release gate that consumes Phase 205 Tenant 0 pricing dogfood
- [ ] 213-04-PLAN.md - Public proof, case-study, and compliance-language boundary
- [ ] 213-05-PLAN.md - Final requirement matrix, unresolved-gap register, and the authoritative 214-217 go/no-go decision

## Next Milestone Candidate: v4.1.0 — SaaS Suite 1.0

**Status:** 📋 Planned after v4.0.0 foundation planning/execution.

**Goal:** Activate MarkOS as a subscription-company operating suite for tenants where `business_type = saas`, while preserving Pricing Engine ownership, AgentRun/task/approval governance, evidence, connector recovery, and SOC2 controls.

**Requirements to map:** SAS-01..10, PRC-01..09, RUN-01..08, TASK-01..05, EVD-01..06, CONN-01..06, LOOP-01..08, COMP-01, QA-01..15. Preserve compatibility with future SG-01..12 requirements without implementing the full SaaS Marketing OS in phases 214-217.

**Research/context:** `obsidian/brain/SaaS Suite Canon.md`, `obsidian/brain/SaaS Marketing OS Strategy Canon.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`, `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`, `obsidian/work/incoming/16-SAAS-SUITE.md`, `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`, `.agent/markos/references/saas-suite.md`, `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`.

### Phase 214: SaaS Suite Activation and Subscription Core
**Goal:** Build the SaaS Suite foundation: durable `business_type = saas` activation, SaaS profile/plan/subscription substrate, explicit lifecycle governance, CRM identity bridging, and gated SaaS surfaces with a non-runnable growth extension point.
**Requirements Mapped:** SAS-01..03, QA-01..15
**Depends on:** Phases 205, 207, 208
**Planning Note:** Replanned 2026-04-27 with refreshed research, validation strategy, lifecycle state machine, CRM bridge, and Phase 218 growth-extension gate.
**Status:** 📋 Planned
**DISCUSS:** `.planning/phases/214-saas-suite-activation-subscription-core/DISCUSS.md`
**Artifacts:** `214-CONTEXT.md`, `214-RESEARCH.md`, `214-REVIEWS.md`, `214-VALIDATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 214-01-PLAN.md - Activation gate, business_type normalization, Wave 0.5 architecture-lock, upstream preflight, and slot/F-ID coordination
- [ ] 214-02-PLAN.md - Core SaaS profile/plan/subscription/event schema plus Pricing Engine sentinel enforcement
- [ ] 214-03-PLAN.md - Explicit lifecycle state machine, approval-required transitions, idempotency, and rollback
- [ ] 214-04-PLAN.md - SaaS customer bridge and CRM identity resolution workflow
- [ ] 214-05-PLAN.md - Lifecycle governance, approval routing, audit linkage, and evidence-pack enforcement
- [ ] 214-06-PLAN.md - SaaS API/MCP/operator surfaces and the Phase 218 growth-extension translation gate

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
**Goal:** Ship 28 SOR tables across 6 SaaS growth domains (viral/referral, community, events, PR/analyst/review, partnerships/affiliate/devrel, growth API/MCP/UI agent closure) with DB-trigger compliance enforcement per domain (single-writer payout, moderation gate, evidence FK, commission immutability, agent activation gate), assertUpstreamReady preflight (P214/P215/P218 HARD; P205/P207-212/P216/P217/P219 SOFT), architecture-lock (legacy api/*.js + requireHostedSupabaseAuth + npm test + lib/markos/mcp/tools/index.cjs + buildApprovalPackage + resolvePlugin), buildApprovalPackage wired across every external mutation (referral payout, community moderation, event reminders/replays, PR pitch outreach + G2/Capterra request, affiliate payout + partner public claim, growth agent activation), 19 contracts F-209..F-227 (Q-3 path-A — sequential post-P227 F-198; cosmetic ordering), 11 migration slots 90-95+97 (skip 96 = neuro_literacy_metadata existing), coordination doc V4.1.0-MIGRATION-SLOT-COORDINATION.md (Q-1 + Q-2 + Q-3 resolutions; P218/P219 reservation pathway), 19 API handlers under api/v1/growth/* + 6 cron handlers under api/cron/growth-*.js + 12 MCP tools under lib/markos/mcp/tools/growth.cjs + growth_agent_readiness 28-agent registry (SG-10 invariant runnable=false until 8 readiness criteria + activation_approval_id + readiness_check_id). Plans replanned 2026-04-26 per cross-AI review override (Codex usage limit; gemini/opencode not installed); resolved 1 HIGH stub-state + 6 MED + 2 LOW from 220-REVIEWS.md. Plan 06 autonomous=false (checkpoint:human-action for first-run agent activation per P226 W1 model).
**Requirements Mapped:** SG-04, SG-06, SG-07, SG-09, SG-10, SG-11, SG-12, API-01, MCP-01, QA-01..15, RUN-01..08
**Depends on:** Phases 214-219 (P214/P215/P218 HARD via assertUpstreamReady; rest SOFT)
**Status:** Plans replanned (6/6); ready for execution after upstream P214-P219 land
**DISCUSS:** `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/DISCUSS.md`
**Artifacts:** `220-CONTEXT.md`, `220-RESEARCH.md`, `220-REVIEWS.md`, `220-VALIDATION.md`, `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md`
**Plans:** 6/6 plans drafted

Plans:
- [ ] 220-01-PLAN.md — ReferralProgram + ViralLoopMetrics + Wave 0.5 architecture-lock + assertUpstreamReady preflight + slot coordination doc + DB-triggers (90+91)
- [ ] 220-02-PLAN.md — CommunityProfile + signals fan-out + moderation-gate DB-trigger + dedup UNIQUE INDEX (92)
- [ ] 220-03-PLAN.md — MarketingEvent + 9-window reminders + attribution + event-promoting DB-trigger (93)
- [ ] 220-04-PLAN.md — PR/Analyst/Review intelligence + 3 DB-triggers (pitch-approval, evidence cardinality, G2-pricing-context) (94)
- [ ] 220-05-PLAN.md — Partnerships + affiliate + devrel + 4 DB-triggers + Q-1 P220-P227 affiliate_programs base ownership + p220-p227-altertable-readiness assertion (95)
- [ ] 220-06-PLAN.md — autonomous=false closeout: growth_agent_readiness + activation gate trigger + 19 API handlers + 6 cron handlers + 12 MCP tools + checkpoint:human-action for first-run activation + slot-collision regression + all-domains architecture-lock RE-RUN + requirements-coverage assertion (97)

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
**Goal:** Evolve MarkOS into a timeline-first CRM with customer 360, account/person/opportunity memory, lifecycle orchestration, and next-best-action workspaces. Ships 6 SOR tables (customer_360_records, opportunities, lifecycle_transitions, nba_records, buying_committees, buying_committee_members) + crm_activity_ledger extensions, 9 F-ID contracts (F-113..F-121), 7 migrations (106..112), 4 MCP tools, 3 new UI components (TimelineDetailView, BuyingCommitteePanel, NBAExplainPanel, LifecycleTransitionTimeline), 3 cron handlers (legacy api/cron/*.js per D-44), DB-trigger lifecycle state-machine (D-45) + score immutability (D-46) + tombstone outbox (D-47), buildApprovalPackage wiring in NBA execute + lifecycle high-risk + tombstone cascade (D-42), assertUpstreamReady hard preflight gate for P208/P209/P211/P221 (D-38). Architecture-lock test forbids createApprovalPackage / requireSupabaseAuth / vitest / route.ts / stub-if-missing patterns (D-35). Plans replanned 2026-04-26 per single-AI Claude-runtime override review (Codex usage limit reached; gemini/opencode not installed); 7 HIGH + 4 MED + 2 LOW concerns addressed.
**Requirements Mapped:** CRM-01..05, CDP-01..05, TASK-01..05, QA-01..15
**Depends on:** Phases 208, 209, 211, 221 (HARD prerequisites — D-38 assertUpstreamReady)
**Status:** Plans replanned (6/6); ready for execution after upstream P208/P209/P211/P221 land
**Plans:** 6/6 plans drafted (Plan 06 autonomous=false per D-51; checkpoint:human-action for first drift batch + checkpoint:human-verify for operator journeys since playwright deferred per D-39)
- [ ] 222-01-PLAN.md — Customer360 + Opportunity SOR + legacy adapter + cdp-overlay (P221 hard prereq) + Task 0.5 architecture-lock + upstream preflight + F-113/F-114
- [ ] 222-02-PLAN.md — Lifecycle transitions + ownership handoff (cross-class buildApprovalPackage gate) + emit + F-115
- [ ] 222-03-PLAN.md — Timeline taxonomy extensions + TimelineDetailView + LifecycleTransitionTimeline + F-119
- [ ] 222-04-PLAN.md — NBA durable record + execution refactor + tombstone cascade outbox (D-47) + lifecycle DB-trigger (D-45) + score immutability trigger (D-46) + buildApprovalPackage wiring (D-42) + NBAExplainPanel + F-116
- [ ] 222-05-PLAN.md — Buying committee + legacy api/v1/crm/*.js (D-43) + MCP tools + workspace-shell evolution + buildApprovalPackage REST wiring + F-117/F-118/F-120/F-121
- [ ] 222-06-PLAN.md — Drift cron + tombstone outbox drain worker + legacy api/cron/*.js (D-44) + RLS suite + Chromatic gate + manual operator journeys (playwright deferred per D-39) + slot-collision regression tests + phase closeout
**DISCUSS:** `.planning/phases/222-crm-timeline-commercial-memory-workspace/DISCUSS.md`
**Artifacts:** `222-CONTEXT.md`, `222-RESEARCH.md`, `222-VALIDATION.md`, `222-REVIEWS.md` (Claude-runtime override 2026-04-26)

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
**Goal:** Add battlecards, objection intelligence, proof packs, proposal support, win/loss capture, and approval-aware deal execution tied back to CRM, Pricing Engine, and evidence. Ships 15 SOR tables (battlecards, objection libraries/entries/records, proof_packs/versions, deal_briefs, deal_rooms/artifacts/views, proposal_supports, quotes, winloss_records, handoff_records, deal_health_signals), 18 F-ID contracts (F-163..F-180), 13 migrations (146..158), 8 MCP tools, 6 operator UI workspaces, 7 cron handlers, public /share/dr/{token} route with HMAC + BotID + rate-limit + honeypot + 410-on-expiry, class-based approval matrix (D-25..D-28), Quote-as-Snapshot immutability (D-21..D-24), DealBrief auto-draft via P222 lifecycle hook, WinLossRecord required-on-transition with cdp_events emit for P225 + LearningCandidate emit for P212, full tombstone cascade (P221 D-24 → P226 D-56). Zero new dependencies; pure governance layer over P201/P205/P207/P208/P209/P221-P225 infrastructure.
**Requirements Mapped:** SEN-01..05, CRM-01..05, PRC-01..09, EVD-01..06, QA-01..15
**Depends on:** Phases 205, 209, 221, 222, 225
**Status:** 📋 Planned — 7 plans across 5 waves
**Plans:** 7/7 plans complete
**DISCUSS:** `.planning/phases/226-sales-enablement-deal-execution/DISCUSS.md`
**Artifacts:** `226-CONTEXT.md`, `226-RESEARCH.md`, `226-VALIDATION.md`

Plans:
- [ ] 226-01-PLAN.md — Wave 0 fixtures + 10 schema migrations (146-155) + 15 SOR tables + RLS + CHECK constraints + 10 contracts (F-163..F-172) + lib/markos/sales/contracts.ts (16 enum constants) + 226-VALIDATION.md per-task map (Wave 1)
- [ ] 226-02-PLAN.md — Battlecard + ObjectionLibrary + ProofPack engine; EvidenceMap claim TTL freshness inheritance (D-17), ProofPack snapshot-at-first-approval + render-time fail-closed (D-11..D-13), stale-blocking helpers consumed by 226-04/226-05; 3 contracts pre-staged (F-173/F-177/F-178); A4/A21 fallbacks (Wave 2 parallel)
- [ ] 226-03-PLAN.md — DealBrief auto-draft (D-14) + handoff_record + deal_health_signals composite (D-37..D-39) + lifecycle hook + AgentRun/narrative/cdp-events adapters + migration 156 (hot-path indexes); 2 contracts (F-176/F-179); A3/A4/A5/A22 fallbacks (Wave 2 parallel)
- [ ] 226-04-PLAN.md — ProposalSupport + Quote-as-Snapshot (D-21..D-24) + class-based approval gate (D-25..D-28) + content classifier integration + pricing-recommendation-adapter (A13 fallback); zero new contracts (Wave 3 parallel)
- [ ] 226-05-PLAN.md — DealRoom + HMAC share-token (D-54) + BotID + rate-limit + honeypot + ip_hash view tracker + ISR cacheTag + WinLossRecord (D-40..D-42) + tombstone cascade (D-56) + Next.js /share/dr/[token] public route; 2 contracts (F-174/F-180; full 18/18 P226 allocation); A14/A15/A16/A22/A23/A24 fallbacks (Wave 3 parallel)
- [ ] 226-06-PLAN.md — 49 API routes under /v1/sales/* + 8 MCP tools (D-43, D-44, D-45) + cross-tenant denial + OpenAPI parity test + lib/markos/sales/api-helpers.ts; A2 fallback (Wave 4)
- [ ] 226-07-PLAN.md — 6 UI workspaces (D-46) + Approval Inbox sales extensions (D-48) + Morning Brief sales section (D-49) + 7 cron handlers (D-50..D-53) + RLS hardening migration 157 + OpenAPI regen migration 158 + 6 Playwright specs + 6 Chromatic stories × 4 variants + RLS suite full + tombstone cascade end-to-end + legacy regression matrix + llms.txt update (Wave 5 closeout)

### Phase 227: Ecosystem, Partner, Community, and Developer Growth
**Goal:** Ship the Ecosystem Engine: 12 SOR tables (integration_listings + listing_views + install_requests + affiliate_programs + fraud_signals + payout_credits + payout_export_batches + community_signals + developer_events + certification_records + co_sell_opportunities) + P220 ALTER TABLE additive (5 SaaS-mode tables gain business_mode discriminator + ecosystem columns) + P225 attribution_touches FK extension (single ledger ECO-05) + P221 ConsentState extend (community_signal_processing). 18 contracts F-181..F-198. 13 migrations 159..171. Plugin registry stays runtime-only with read-through adapter (D-09..D-11). Certification first-class state machine + criteria_checks + recertification cron. 6 webhook adapters (5 HMAC-SHA256 + 1 Discord Ed25519) + dedupe + ConsentState gate. CoSellOpportunity links P222 Opportunity + P224 LaunchSurface(partner_pack) + P226 DealRoom + handoff_record. Manual CSV payout export — NO Stripe Connect/KYC/1099 in v1. {{MARKOS_PRICING_ENGINE_PENDING}} on every payout/commission copy path. Read-write `/v1/ecosystem/*` API + 8 MCP tools + 7 UI workspaces + public marketplace + dev-portal + sitemap + JSON-LD + BotID + rate-limit + honeypot.
**Requirements Mapped:** ECO-01..05, SG-04, SG-06, SG-09..12 (carry-forward via P220 extension), QA-01..15
**Depends on:** Phases 220, 221, 222, 225 (+ 226 deal_rooms/handoff_records/winloss_records soft refs; 205 PricingRecommendation soft ref via A13)
**Status:** 📋 Planned — 7 plans across 5 waves
**Plans:** 7/7 plans complete
**DISCUSS:** `.planning/phases/227-ecosystem-partner-community-developer-growth/DISCUSS.md`
**Artifacts:** `227-CONTEXT.md`, `227-RESEARCH.md`, `227-VALIDATION.md`

Plans:
- [ ] 227-01-PLAN.md — Schema foundation (migrations 159-165) + 12 SOR tables + P220 ALTER TABLE additive + 8 base contracts F-181..F-188 + plugin-registry read-through adapter + 12 fixture factories + 14 schema tests + RLS isolation suite (Wave 1)
- [ ] 227-02-PLAN.md — IntegrationListing + listing_views + install_requests + plugin manifest render fail-closed + ISR cacheTag + double-gated public filter + install bypass blocked; F-189/F-190 (Wave 2 parallel)
- [ ] 227-03-PLAN.md — PartnerProfile P220 extension + CertificationRecord state machine (12 transitions + revoked terminal) + criteria_templates (Pitfall 12) + recertification cron daily 03:00 UTC (11mo+12mo) + listing hide-on-expire + migration 168 hot-path indexes; F-191 (Wave 2 parallel)
- [ ] 227-04-PLAN.md — Referral + Affiliate + Fraud (8 evaluators) + payout-credits ledger (5 statuses + dispute) + manual CSV export weekly Sun 04:00 UTC + per-currency batches + {{MARKOS_PRICING_ENGINE_PENDING}} placeholder enforcement + commission_share guard (D-65); F-192/F-193 (Wave 3 parallel)
- [ ] 227-05-PLAN.md — Migration 166 P221 ConsentState extend + 6 webhook adapters (5 HMAC-SHA256 + 1 Discord Ed25519) + signature verify + dedupe + ConsentState gate + decision_rules routing (6 action_kinds + spike debounce) + DeveloperEvent cdp_events fan-out (single transaction fail-closed) + tombstone scrub + poll-fallback cron; F-194/F-195 (Wave 3 parallel)
- [ ] 227-06-PLAN.md — Migration 167 P225 attribution_touches extend (6 FK columns + at-most-one CHECK + channel ENUM extend) + CoSellOpportunity state machine (7 transitions) + commission immutability (commission_locked_at) + P222 lifecycle hook in-transaction (Pitfall 8) + ecosystem-attribution single ledger; F-196/F-197 (Wave 4)
- [ ] 227-07-PLAN.md — Full /v1/ecosystem/* API + 2 public endpoints + 8 MCP tools + 7 UI workspaces + 3 public pages (marketplace + developers + partners) + sitemap.xml + robots.txt + JSON-LD SoftwareApplication + Approval Inbox 8 entry kinds + Morning Brief 5 sections + 4 observability crons + RLS hardening (migration 170) + OpenAPI regen (171) + 7 Playwright + 8 Chromatic + tombstone cascade end-to-end + legacy regression + closeout; F-198 (Wave 5)

### Phase 228: Commercial OS Integration and Future-Readiness Closure
**Goal:** Close the lane by enforcing shared contracts, API/MCP/UI parity, migration posture, provider replaceability, testing obligations, and no-obsolescence guarantees across the full commercial stack.
**Requirements Mapped:** COM-01..06, QA-01..15
**Depends on:** Phases 221-227
**Status:** 📋 Planned — 6 plans across 5 waves
**Plans:** 6/6 plans complete
**DISCUSS:** `.planning/phases/228-commercial-os-integration-future-readiness/DISCUSS.md`
**Artifacts:** `228-CONTEXT.md`, `228-RESEARCH.md`

Plans:
- [ ] 228-01-PLAN.md — Cross-engine commercial contract registry (45 F-IDs across CDP/CRM/EML/MSG/CNV/LCH/ANL/SEN/ECO) + parity verifier CLI + Gate 1 (one identity truth) + Gate 2 (one commercial memory) + Gate 9 (UI/API/MCP parity); extends lib/markos/plugins/registry.js doctrine — no parallel store (Wave 1)
- [ ] 228-02-PLAN.md — Adapter contract type + swap harness (extends base-adapter.ts) + adapter-registry.json (7 bindings: email, sms, whatsapp, analytics_sink, ecosystem_directory, ecosystem_dev_events, launch_distribution) + migration-manifest.json (9 representative entries) + 2 CLI gates (test-adapter-swap, test-migration-roundtrip) — Gate 7 (no provider lock) + Gate 8 partial (Wave 2 parallel with 04)
- [ ] 228-03-PLAN.md — Migration manifest expanded to 36 durable-object entries (full coverage across 9 engines) + archival-policy.json (SOC2-I retention floors) + recovery-runbook.json (per-engine restore procedure) + tombstone cascade chains (sales D-56, ecosystem D-65, crm, cdp, consent) + test-archival-recovery CLI — Gate 8 closure (Wave 3)
- [ ] 228-04-PLAN.md — vitest + playwright wired (research line 25-26: not yet present) + 6 npm scripts + single E2E commercial-evidence-chain Playwright suite (CRM→channel→conversion→analytics→sales→ecosystem) + 4 gate detectors (governed-mutation/passive-system/pricing-bypass/evidence-freshness) + V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md APPENDED Phase 228 detection matrix + verify-test-coverage CLI — Gate 10 + enforcement of Gates 3-6 (Wave 2 parallel with 02)
- [ ] 228-05-PLAN.md — COM-01..06 + QA-01..15 land in commercial-registry.json (66 total) + build-readiness-matrix.cjs runs all prior gates + emits READINESS-MATRIX.md (9 engine rows × 11 gate columns + 21 cross-cutting requirements + sign-off block) + verify-readiness-matrix.cjs (--strict mode) + human sign-off checkpoint + ROADMAP.md update — final lane closeout per CONTEXT D-30 (Wave 4)
- [ ] 228-06-PLAN.md — Vault canon sync (obsidian/reference Contracts Registry.md + MarkOS v2 Operating Loop Spec.md per CLAUDE.md source-of-truth precedence) + public docs (llms.txt + docs/cli/commands.md) + 6 commercial:* npm script aliases + STATE.md handoff + MARKOS-INDEX.md drift check + canon-sync test + handoff-closure test (11 assertions) — lane CLOSED (Wave 5)

### Locked SaaS Decisions (2026-04-16)

Summary: SaaS cloud first · static monetization assumptions superseded by Pricing Engine Canon · OpenAPI -> SDKs -> MCP -> Webhooks -> Zapier -> Make -> n8n order · 13 tier-1 connectors (Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase) · 7 tier-1 languages v1 · SOC 2 Type I 6mo · agency/OEM packaging pending Pricing Engine recommendations · Tiered autonomy · US-East -> US+EU -> APAC · Plugin + Agent marketplace Y1 · API-first + great UI · v2 ICP: growth-stage B2B marketing leaders first, agencies second · Brand stance: AI-first, quietly confident, evidence-backed · Nango embedded where it fits.

Full detail: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`.

## Archived Milestone Notes

Historical milestone details remain under `.planning/milestones/` and committed git history so the root roadmap can stay focused on the active execution lane.
