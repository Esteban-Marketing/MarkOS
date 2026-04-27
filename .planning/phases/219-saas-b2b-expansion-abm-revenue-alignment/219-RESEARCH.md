# Phase 219: SaaS B2B Expansion, ABM, and Revenue Alignment — Research

**Researched:** 2026-04-26
**Domain:** SaaS B2B Growth — account expansion, customer marketing, ABM/buying committee, advocacy/proof/review, expansion/save/discount pricing controls, B2B growth agent readiness
**Confidence:** HIGH for codebase-grounded claims, HIGH for schema shapes (derived from doc 17 interfaces + canon), HIGH for F-ID/migration slot sequencing (Q-7 RESOLVED — P218 plans confirm slots 101-106; P219 takes 107-111)
**Replaces:** 24-line stub created during initial seeding pass; supersedes commit 813008a with targeted slot + cross-phase updates

---

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support |
|----|------------------------------------------------|------------------|
| SG-03 | B2B SaaS growth covers account expansion, customer marketing, advocacy, ABM account intelligence, buying committee mapping, and account-personalized content | §6 Domains 2–4 (AccountExpansion, ABM, Advocacy) |
| SG-08 | Revenue alignment defines shared MQL/SQL/PQL criteria, SLAs, feedback loops, win/loss inputs, pipeline targets, and marketing-sales-CS reporting truth | §6 Domain 1 (RevenueTeamConfig) |
| SG-09 | Growth modules create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec | §15 Anti-patterns — all 6 domains must produce tasks/approvals/learnings |
| SG-10 | Target growth agent tiers are not active implementation truth until GSD assigns contracts, costs, approval posture, tests, API/MCP/UI surfaces, and failure behavior | §6 Domain 6 — non-runnable agent registry |
| SG-11 | Pricing-sensitive growth prompts, discounts, save offers, and upgrade nudges consume Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}` | §6 Domain 5 — Plan 05 Pricing Engine routing |
| SG-12 | External customer, partner, press, analyst, event, support, pricing, discount, referral, and review mutations require approval by default | §6 every domain — buildApprovalPackage wiring across all 6 domains |
| LOOP-06 | Revenue modules connect campaign/content/social activity to CRM or pipeline evidence | §6 Domain 1 — RevenueTeamConfig SLA breaches + feedback loops connecting marketing activity to pipeline evidence |
| EVD-01 | EvidenceMap links factual claims to citations, source quality score, freshness, confidence, TTL, and known gaps | §6 Domain 4 — advocacy/proof/case-study evidence FK enforcement |
| EVD-02 | Unsupported customer-facing claims block external dispatch or are clearly labeled as inference | §6 Domain 4 — proof workflows require evidence before dispatch |
| EVD-03 | Research tiers and source quality policies are recorded on research context | §6 Domain 3 — ABM intelligence packages require source quality tags |
| EVD-04 | Agents reuse non-stale research context before starting new research | §6 Domain 3 — ABM package reuse before re-enrichment |
| EVD-05 | Approval UI exposes evidence, assumptions, and claim risk | §6 Domains 3/4 — buying committee enrichment + advocacy proof approval UX |
| EVD-06 | Pricing and competitor intelligence uses source quality, extraction method, timestamp, and compliance posture | §6 Domain 5 — expansion/save offers consume Pricing Engine evidence fields |
| QA-01..15 | Phase 200 Quality Baseline gates apply | §16 Validation Architecture |
</phase_requirements>

---

## Executive Summary

Phase 219 ships the **first implementation truth** for the B2B growth motions defined in `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` and distilled into `obsidian/brain/SaaS Marketing OS Strategy Canon.md`. It is the **third phase** of the v4.1.0 SaaS milestone growth layer (P217 owns revenue intelligence + SAS agents + API/MCP/UI surface; P218 owns PLG/in-app/experimentation + foundational mode-routing substrate; P219 owns B2B expansion/ABM/advocacy/revenue-alignment; P220 owns B2C viral/referral/community/events/PR/partnerships/devrel).

P219 covers six distinct domains, each comparable in scope to a P221-P228 commercial-engine plan. The phase boundary is intentional: P218 already owns `SaaSGrowthProfile` + PLG/PQL/in-app/experimentation AND the `module_mode_eligibility` matrix that P219 must consume; P219 picks up everything that is **existing-customer focused and B2B specific** — revenue team config, account expansion programs, ABM packages, buying committees, advocacy/proof workflows, and pricing-safe expansion/save/discount controls. P220 picks up B2C viral, community, events, PR, partnerships, and devrel.

**Critical sequencing finding (updated):** P219 depends HARD on P214 (SaaSSuiteActivation gating), P215 (billing — expansion/save offers route through billing engine), P217 (revenue intelligence — `saas_mrr_snapshots` table + SAS-09 MRR/NRR/expansion signal data consumed by Plan 02 expansion scanner), and P218 (SaaSGrowthProfile — all P219 modules activate by saas_model AND every P219 module-table INSERT is gated by `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` pattern via `module_mode_eligibility` table + `lib/markos/profile/mode-eligibility.ts`). P219 depends SOFT on P205 (Pricing Engine — Plan 05 uses `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel fallback). P219 is a SOFT dependency of P220 — P220 can degrade gracefully if P219 is missing.

**Migration slot Q-7 RESOLVED (updated):** Previous P219 research (commit 813008a) assumed P219 = slots 85-89. This was incorrect — slots 82-89 are fully occupied by existing foundation migrations (82=audit_hash_chain, 83=unverified_signups, 84=passkey_credentials, 85=sessions_devices, 86=custom_domains_ext, 87=invites_lifecycle, 88=mcp_sessions, 89=mcp_cost_window) [VERIFIED: codebase]. P218 plans (commit a0d1441, 218-01-PLAN.md) lock P218 = slots **101-106**, F-IDs F-238..F-246. P219 takes **slots 107-111** (Plan 06 seeds into 111 additive OR uses 112 if migration is needed). P220 stays at 90-95+97 (locked); slot ordering is resolved via `lib/markos/profile/mode-eligibility.ts` runtime helper (P220 module-table triggers consume mode eligibility at app-layer runtime since P220 migrations at 90-97 apply before P218 at 101+). P219 at 107+ applies after P218 at 101+ — no sequencing conflict within P218→P219.

**P218 contract consumption (new):** Every P219 module-table INSERT trigger must call `isModuleEligible(tenantId, moduleKey)` from `lib/markos/profile/mode-eligibility.ts`. This is the `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` pattern from P218. P219 Plan 01 migration SQL must reference this library not duplicate the logic. The mode-eligibility matrix for P219 modules: ABM = [b2b, plg_b2b]; RevTeamConfig = [all 5 modes]; ExpansionPrograms = [all 5 modes]; Advocacy = [all 5 modes]; PricingControls = [all 5 modes]; B2B agents = [b2b, plg_b2b].

**P217 contract consumption (new):** P217 ships `saas_mrr_snapshots` (Plan 01 SaaSMRRSnapshot + Plan 02 waterfall). P219 Plan 02 expansion-signal-scanner cron (`api/cron/b2b-expansion-signal-scanner.js`) consumes MRR/NRR/expansion data from `saas_mrr_snapshots` (read-only). P219 does NOT own or redefine SAS-09. REQUIREMENTS.md line 226 maps `SAS-09 | Phase 217`. P219 INTEGRATES via `integrates_with: [SAS-09 from P217]` frontmatter field.

**T0-04 resolution:** Plan 04 stub references `T0-04` in requirements. Confirmed in `.planning/REQUIREMENTS.md` line 113: `T0-04: Public Tenant 0 proof is sourced, approved, and privacy-safe.` This is a real requirement — NOT a typo for SG-09. It maps cleanly to Plan 04 (advocacy/review/proof workflows — the Tenant 0 proof posture).

**Plan 05 Pricing Engine integration mode:** Recommend `assertUpstreamReady(['P205'])` as SOFT (not hard-fail), with `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder fallback. Hard-fail would block P219 execution indefinitely since P205 is not yet landed. The placeholder sentinel is the canonical pattern per Pricing Engine Canon and CLAUDE.md placeholder rule.

**Primary recommendation:** Ship P219 as **6 SOR clusters** (matching the 6 plan slices), with the explicit guarantee that the schema P227 can later ALTER additively (matching P220's stance), and that no P219 table pre-allocates columns P227 claims.

---

## User Constraints (from CONTEXT.md)

CONTEXT.md is a 17-line stub. The following represents the locked inputs from that stub plus canonical constraints that apply per CLAUDE.md source-of-truth precedence.

### Locked Decisions

1. Canonical inputs are: `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`, `obsidian/brain/SaaS Marketing OS Strategy Canon.md`, `obsidian/brain/SaaS Suite Canon.md`, `obsidian/reference/MarkOS v2 Operating Loop Spec.md`, and `.planning/REQUIREMENTS.md` IDs SG-03, SG-08, SG-09, SG-10, SG-11, SG-12.
2. Phase shape is 6 domains: (1) RevenueTeamConfig + SLAs + LOOP-06, (2) Account expansion + customer marketing, (3) ABMAccountPackage + buying committee, (4) Advocacy + review + proof, (5) Expansion + save + discount + Pricing Engine, (6) B2B growth agent readiness (non-runnable gate).

### Claude's Discretion

Because CONTEXT.md is a stub, the entire decision surface beyond the canonical inputs is Claude's discretion subject to:
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` (vault canon — wins for product shape per CLAUDE.md source-of-truth precedence rule 1)
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` (spec — wins for object shape)
- `.planning/REQUIREMENTS.md` SG-03, SG-08, SG-09, SG-10, SG-11, SG-12, LOOP-06, EVD-01..06, QA-01..15
- P217 coordination (SAS-09 owned by P217; P219 integrates Plan 02 expansion scanner with saas_mrr_snapshots)
- P218 coordination (ICP segment ownership; module_mode_eligibility matrix gate; mode ENUM)
- P220 coordination (advocacy/review boundary)
- P205 Pricing Engine (Plan 05 hard-prereq OR placeholder fallback)

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of `/v1/b2b/*` — kept on legacy `api/*.js` (architecture-lock)
- Native ABM intent-data integrations (Bombora, G2 intent) — deferred; Plan 03 stores `intent_score` as operator-imported value only
- Stripe Connect / KYC for commission payouts on save-offer referrals — manual CSV export (matches P220 D-71 stance on payout compliance)
- Cross-tenant ABM benchmarks — tenant-only metrics in v1; P225 analytics phase owns cross-tenant learning
- Real-time CRM webhook push to sales platforms (Salesforce, HubSpot) — deferred to P222/P223
- Customer Advisory Board portal / community platform (Orbit, Circle) — deferred to P220 community domain + P227 ecosystem
- Public case study site / proof gallery CMS — P224/P227 own public surfaces; P219 ships only the governance layer (evidence + approval + consent)

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Marketing OS Strategy Canon.md` defines the B2B growth engines, object models, approval posture, and Pricing Engine relationship. P219 schema and policy MUST match this canon.
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` defines HOW objects are shaped (RevenueTeamConfig, ABMAccountPackage, CustomerMarketingProgram, etc.). P219 SOR fields, ENUMs, and FKs MUST match the v2 operating loop spec where applicable.
3. **Engineering execution state wins:** `.planning/STATE.md` + `ROADMAP.md` define WHEN. STATE.md shows Phase 204 active; P219 must NOT execute before P214-P218 land.
4. **Drift rule:** If P219 plans define schema that contradicts vault brain/reference (e.g., `abm_account_packages.engagement_stage` values that contradict doc 17 `ABMStage` ENUM), STOP and flag — do NOT silently reconcile.

### Placeholder rule (MUST)

`{{MARKOS_PRICING_ENGINE_PENDING}}` is required wherever expansion/save/discount pricing copy is written before an approved `PricingRecommendation` exists. P219 Plan 05 expansion offers, save offer messaging, discount posture, and annual plan prompts all use this placeholder until P205 lands.

### CLI / tests (MUST)

- Tests run via `npm test` or `node --test test/**/*.test.js` — NO vitest, NO playwright.
- Test files use `.test.js` extension and `node:test` + `node:assert/strict` imports.
- Test fixtures: `.js` (NOT `.ts`).

---

## Doctrine Summary (from canonical inputs)

### What `obsidian/brain/SaaS Marketing OS Strategy Canon.md` says

**SaaS operating modes:** `b2b` mode activates: Demo Engine, ABM, B2B lead gen, **Account Expansion**, **Revenue Team Alignment**, PR/Analyst Relations, Partnerships. P219 is the implementation phase for the bolded items. `plg_b2b` mode adds PLG engine + PQL scoring (P218 owns) + ABM for PQL conversion + Account Expansion + Community + Developer Marketing.

**Growth Engine Modules P219 owns** (canon lines 65-78 + doc 17 Part 3/4/13):
- **Account Expansion:** seat expansion, plan upgrades, add-on adoption, customer marketing, advocacy pipeline
- **ABM Engine:** Tier 1/2/3 account strategy, buying committee map, account intelligence, account-personalized content
- **Revenue Team Alignment:** shared MQL/SQL/PQL definitions, SLA, feedback loop, win/loss, pipeline target, marketing-sales-CS one reality

**Core Objects P219 ships** (from canon + doc 17 TypeScript interfaces):
- `RevenueTeamConfig` — doc 17 line ~1416: `{ has_sales_team, has_cs_team, sales_model, mql_definition, sql_definition, mql_to_sql_sla_hours, pql_routing, feedback_cadence, win_loss_review, attribution_model, shared_pipeline_target, marketing_sourced_pct_target }`
- `CustomerMarketingProgram` — doc 17 line ~377: `{ program_type, target_segment, activation_criteria, goal, status, enrolled_count, conversion_rate }`
- `ABMAccountPackage` — doc 17 line ~496: `{ abm_tier ∈ {1,2,3}, company_profile, buying_committee[], strategic_signals, messaging, engagement, stage ∈ ABMStage }`
- `BuyingCommitteeMember` — doc 17 line ~560: `{ contact_id, role, persona ∈ {economic_buyer, champion, user, gatekeeper, influencer}, linkedin_url, known_to_us, last_interaction, preferred_content_format, key_concerns[] }`
- `AccountExpansionOpportunity` — derived from doc 17 expansion flywheel (Part 3)
- `AdvocacyCandidate` — derived from doc 17 advocacy pipeline (Part 3)

P219 does NOT ship (handled by sibling phases):
- `SaaSGrowthProfile`, `ActivationDefinition`, `PQLScore`, `UpgradeTrigger`, `InAppCampaign`, `MarketingExperiment` — P218
- `SaaSMRRSnapshot`, `/v1/saas/*` API surface, SAS agent readiness registry — P217
- `ReferralProgram`, `ViralLoopMetrics`, `CommunityProfile`, `MarketingEvent`, `AffiliateProgram` — P220

**Approval posture** (canon lines 139-150): approval required by default for:
- Customer-facing expansion outreach, save offers, discount presentations
- ABM account personalization outreach when sent externally
- Advocacy ask actions (review request, case study ask, reference customer request)
- Buying committee enrichment when enrichment uses external data purchase/integration
- Revenue team handoff when it creates external-facing pipeline mutation

### What `obsidian/reference/MarkOS v2 Operating Loop Spec.md` says

The Operating Loop Spec (line 64-65) explicitly lists:
- `RevenueTeamConfig` — sales/CS model, MQL/SQL/PQL routing, SLA, attribution, shared targets, feedback cadence
- `ABMAccountPackage` — account intelligence, buying committee, strategic signals, messaging, engagement, ABM stage

LOOP-06 requires: "Revenue modules connect campaign/content/social activity to CRM or pipeline evidence." P219's `RevenueTeamConfig` must create SLA-breach tasks (when MQL aging > mql_to_sql_sla_hours), feedback loop records, and win/loss records that feed back into campaign performance attribution.

SaaS Marketing OS Strategy Contract (spec lines 201-215):
"ABM, expansion, advocacy, event, PR, partnership, developer, and revenue-alignment work must reuse CRM, activity, attribution, task, and approval substrates where possible."

P219 MUST reuse `lib/markos/crm/agent-actions.ts` (`buildApprovalPackage`) for all external mutations and emit to existing audit chain (`lib/markos/audit/*`).

---

## Phase Scope: 6 Domains

| Plan | Domain | Key Objects | Requirements |
|------|--------|------------|--------------|
| 219-01 | RevenueTeamConfig + lifecycle defs + SLAs + LOOP-06 | `revenue_team_configs`, `lead_qualification_sla_events`, `marketing_sales_feedback_records` | SG-08, LOOP-06, QA-01..15 |
| 219-02 | Account expansion + customer marketing | `account_expansion_opportunities`, `customer_marketing_programs`, `program_enrollments` | SG-03, SG-09, SG-12, EVD-01..04, QA-01..15 |
| 219-03 | ABMAccountPackage + buying committee | `abm_account_packages`, `abm_buying_committee_members`, `abm_engagement_events` | SG-03, SG-09, SG-12, EVD-01..06, QA-01..15 |
| 219-04 | Advocacy + review request + proof | `advocacy_candidates`, `advocacy_review_requests`, `proof_assets`, `proof_consent_records` | SG-03, SG-09, SG-12, T0-04, EVD-01..06, QA-01..15 |
| 219-05 | Expansion + save + discount + Pricing Engine | `expansion_offers`, `save_offers`, `discount_authorizations` | SG-11, SG-12, PRC-01..09, QA-01..15 |
| 219-06 | B2B growth agent readiness + non-runnable gate | `b2b_growth_agent_readiness` (own table; P220 may consolidate later) | SG-10, RUN-01..08, QA-01..15 |

---

## Architecture Lock

This section MUST be verified in Plan 219-01 Task 0.5 (first task in Wave 1 — matching P220 Plan 01 Task 0.5 / P221 D-32 / P226 D-78 model).

### Pin Table

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/*.js` flat handlers (e.g., `api/v1/b2b/revenue-team-config.js`) | Filesystem: `api/` contains `*.js` only [VERIFIED: codebase] |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| OpenAPI command | `npm run openapi:build` | `package.json` scripts pattern [ASSUMED: matches P220 confirmed] |
| OpenAPI registry | `contracts/openapi.json` | filesystem confirmed [VERIFIED: codebase] |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS, NOT `.ts`) | filesystem confirmed [VERIFIED: codebase] |
| Test runner | `npm test` → `node --test test/**/*.test.js` | `package.json` [ASSUMED: matches P220 confirmed] |
| Test imports | `node:test` + `node:assert/strict` | Architecture-lock carry-forward P221-P228 |
| Test extension | `*.test.js` (NOT `.test.ts`) | Architecture-lock carry-forward |
| Cron auth | `x-markos-cron-secret` header matching `MARKOS_B2B_CRON_SECRET` env | `api/cron/webhooks-dlq-purge.js` pattern [VERIFIED: codebase] |
| Cron response | `{ success: boolean, count: number, duration_ms: number }` JSON | Same pattern |
| Audit emit | `lib/markos/audit/*` (SHA-256 hash chain per migration 82) | filesystem [VERIFIED: codebase] |
| Tombstone | `lib/markos/governance/*` deletion workflow (migration 56) | filesystem [VERIFIED: codebase] |
| App Router | OUT OF SCOPE — P219 has NO public-facing App Router routes | architecture-lock |
| Mode eligibility | `lib/markos/profile/mode-eligibility.ts` → `isModuleEligible(tenantId, moduleKey)` | P218 Plan 01 ships this; P219 consumes at runtime [VERIFIED: 218-01-PLAN.md must_haves] |

### Helper File Presence Verification Table

| File | Function | Status | Line |
|------|----------|--------|------|
| `lib/markos/crm/agent-actions.ts` | `buildApprovalPackage(input)` | EXISTS [VERIFIED: codebase] | 68 |
| `lib/markos/crm/agent-actions.ts` | `module.exports = { buildApprovalPackage, ... }` | EXISTS [VERIFIED: codebase] | 133 |
| `onboarding/backend/runtime-context.cjs` | `requireHostedSupabaseAuth(...)` | EXISTS [VERIFIED: codebase] | 491 |
| `onboarding/backend/runtime-context.cjs` | `module.exports = { requireHostedSupabaseAuth, ... }` | EXISTS [VERIFIED: codebase] | 1014 |
| `lib/markos/plugins/registry.js` | `resolvePlugin(registry, pluginId)` | EXISTS [VERIFIED: codebase] | 102 |
| `lib/markos/mcp/tools/index.cjs` | MCP tool family registry (CommonJS) | EXISTS [VERIFIED: codebase] | — |
| `contracts/openapi.json` | Active OpenAPI 3.1 spec | EXISTS [VERIFIED: codebase] | — |
| `lib/markos/profile/mode-eligibility.ts` | `isModuleEligible(tenantId, moduleKey)` | SHIPS IN P218 Plan 01 [VERIFIED: 218-01-PLAN.md] | — |

### Forbidden Patterns (architecture-lock test asserts grep count = 0 across all P219 lib/api paths)

```
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/sales/        (P226 ships this — not yet available)
lib/markos/cdp/          (P221 ships this — not yet available)
lib/markos/conversion/   (P224 ships this — not yet available)
lib/markos/launches/     (P224 ships this — not yet available)
lib/markos/analytics/    (P225 ships this — not yet available)
lib/markos/channels/     (P223 ships this — not yet available)
lib/markos/ecosystem/    (P227 ships this — not yet available)
public/openapi.json
app/(b2b)/
app/(growth)/
route.ts
vitest
playwright
openapi-generate
.test.ts
```

The architecture-lock test (`test/b2b-219/preflight/architecture-lock.test.js`) ships in Plan 219-01 Task 0.5 — first task in Wave 1.

---

## Upstream Dependencies (assertUpstreamReady Gate)

### Required Hard Upstreams

| Phase | Tables to Check | Why P219 Needs It | Hard / Soft |
|-------|----------------|-------------------|-------------|
| P214 | `saas_suite_activations` | SaaSSuiteActivation — only saas-mode tenants see B2B growth | HARD |
| P215 | `billing_periods`, `tenant_billing_subscriptions` | Billing engine — expansion offer + save offer + discount routing flow through this | HARD |
| P217 | `saas_mrr_snapshots` | SAS-09 revenue intelligence — Plan 02 expansion-signal-scanner reads MRR/NRR/expansion data; P219 does NOT redefine SAS-09 | HARD |
| P218 | `saas_growth_profiles`, `module_mode_eligibility` | SaaSGrowthProfile (`mode` ENUM) + module eligibility matrix — every P219 module-table INSERT uses `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` pattern via `lib/markos/profile/mode-eligibility.ts` | HARD |

### Soft Upstreams (degrade gracefully)

| Phase | Why Optional | Fallback |
|-------|-------------|----------|
| P205 | Pricing Engine — expansion/save/discount copy in Plan 05 | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; log warning; never block |
| P207 | AgentRun v2 — B2B growth agents emit AgentRun records | Stub to `noopAgentRunEmit()` if not yet shipped |
| P208 | Approval Inbox UI — approvals show up in operator inbox | DB rows still created via `buildApprovalPackage`; UI degrades to manual SQL query |
| P209 | EvidenceMap — ABM intelligence + advocacy proof `evidence_refs` validation | Soft warn if `evidence_refs` empty; upgrade to hard-fail once P209 ships |
| P210 | ConnectorInstall — analytics connector for expansion signal events | `expansion_signal` stored as string; connector is operator-external |
| P211 | Pricing-engine-pending sentinel infrastructure | Use string literal `{{MARKOS_PRICING_ENGINE_PENDING}}` directly |
| P212 | P212 LRN substrate — ArtifactPerformanceLog, TenantOverlay | No direct dependency; P219 growth learnings route through P218 experiment decisions |
| P216 | `saas_health_scores` | Health score — advocacy candidate trigger uses health_score >= 85; review_request trigger uses health_score_high | SOFT |
| P222 | CRM `buying_committees` SOR table | P219 ships `abm_buying_committee_members` as own table; P222 ships CRM-side `buying_committee_members` — distinct tables, no FK conflict |

### Preflight Script Pattern

```cjs
// scripts/preconditions/219-01-check-upstream.cjs
'use strict';
const { createClient } = require('@supabase/supabase-js');
const REQUIRED_TABLES = [
  'saas_suite_activations',       // P214 hard prereq
  'saas_mrr_snapshots',           // P217 hard prereq — expansion signal scanner reads MRR/NRR
  'saas_growth_profiles',         // P218 hard prereq — mode column + MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE pattern
  'module_mode_eligibility',      // P218 hard prereq — 60-row eligibility seed
];
const SOFT_TABLES = [
  'pricing_recommendations',      // P205 soft prereq
  'saas_health_scores',           // P216 soft prereq
];
async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P219). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — using placeholder or health_score fallback)`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(2); });
```

Each of Plans 01-06 ships its own `scripts/preconditions/219-NN-check-upstream.cjs`.

---

## F-ID and Migration Slot Allocation

### Slot Collision History (RESOLVED)

**Verified on-disk migration slots (2026-04-26):** [VERIFIED: codebase — `ls supabase/migrations/`]

| Slot | Migration | Owner |
|------|-----------|-------|
| 82 | `82_markos_audit_log_hash_chain.sql` | Foundation (existing) |
| 83 | `83_markos_unverified_signups.sql` | Foundation (existing) |
| 84 | `84_markos_passkey_credentials.sql` | Foundation (existing) |
| 85 | `85_markos_sessions_devices.sql` | Foundation (existing) |
| 86 | `86_markos_custom_domains_ext.sql` | Foundation (existing) |
| 87 | `87_markos_invites_lifecycle.sql` | Foundation (existing) |
| 88 | `88_markos_mcp_sessions.sql` | Foundation (existing) |
| 89 | `89_markos_mcp_cost_window.sql` | Foundation (existing) |
| 90–95, 97 | RESERVED — P220 plans (220-01-PLAN.md frontmatter locked) | P220 (locked) |
| 96 | `96_neuro_literacy_metadata.sql` | Existing |
| 98–99 | UNOCCUPIED | Available (reserved for P217 or other phases) |
| 100 | `100_crm_schema_identity_graph_hardening.sql` | Existing |
| 101–106 | RESERVED — P218 plans (218-01-PLAN.md frontmatter: `migration_slots: [101]`) | P218 (locked) |
| 107–111 | **RESERVED for P219** | P219 (this research) |
| 112 | Available for P219 Plan 06 if additive seed requires own slot | P219 Plan 06 (conditional) |

**Previous P219 collision:** Research commit 813008a incorrectly assumed P218 = slots 82-84 and P219 = slots 85-89. Both are wrong — slots 82-89 are fully occupied by existing foundation migrations. Corrected by P218 research (commit bf0205b) which confirmed P218 = 101-106. P219 follows at 107-111.

**P220 slot ordering note:** P220 migrations at 90-95+97 apply numerically BEFORE P218 at 101+ and P219 at 107+. This is resolved by P218 Plan 01's `lib/markos/profile/mode-eligibility.ts` runtime helper (`isModuleEligible`). P220 module-table triggers consume this helper at app-layer runtime rather than via migration-time JOIN. P219 at 107+ applies after P218 at 101+ — no sequencing conflict within P218→P219. [VERIFIED: 218-01-PLAN.md must_haves]

**V4.1.0-MIGRATION-SLOT-COORDINATION.md forward dependency:** P218 Plan 01 Task 0.1 CREATES this file (P218 is the first phase to ship it). P219 Plan 01 Task 0.1 APPENDS P219's reservation (slots 107-111, F-IDs F-228..F-237) to the document. The file does NOT exist on disk yet — P219 plans must guard against the file not existing when P218 has not yet executed (create-or-append pattern). [ASSUMED: mirrors P218 Plan 01 create pattern]

### P219 F-ID + Migration Pre-Allocation Table

| Plan | Domain | Migration Slot | Table(s) Created | F-IDs (proposed) | Dependency Chain |
|------|--------|---------------|------------------|-------------------|-----------------|
| 219-01 | RevenueTeamConfig + SLAs | **107** | `revenue_team_configs`, `lead_qualification_sla_events`, `marketing_sales_feedback_records` | F-228, F-229 | P214 + P215 + P217 + P218 |
| 219-02 | AccountExpansion + CustomerMarketing | **108** | `account_expansion_opportunities`, `customer_marketing_programs`, `program_enrollments` | F-230, F-231 | P219-01 + P217 (saas_mrr_snapshots read) |
| 219-03 | ABMAccountPackage + BuyingCommittee | **109** | `abm_account_packages`, `abm_buying_committee_members`, `abm_engagement_events` | F-232, F-233 | P218 + P219-01 |
| 219-04 | Advocacy + ReviewRequest + Proof | **110** | `advocacy_candidates`, `advocacy_review_requests`, `proof_assets`, `proof_consent_records` | F-234, F-235 | P219-01 + P219-02 |
| 219-05 | Expansion + Save + Discount | **111** | `expansion_offers`, `save_offers`, `discount_authorizations` | F-236 | P215 + P205(soft) |
| 219-06 | B2B Agent Readiness | **111** (additive seed in migration 111) OR **112** (own slot if seed requires separate migration) | `b2b_growth_agent_readiness` | F-237 | P219-01..05 |

**Note on Plan 219-06 table strategy:** P219-06 creates `b2b_growth_agent_readiness` as its own holding table (NOT depending on P220's `growth_agent_readiness` which does not yet exist when P219 runs). P220-06 migration consolidates the 9 P219 B2B agent rows into `growth_agent_readiness`. This avoids a circular dependency between P219 and P220. The naming is unambiguously distinct: P219 = `b2b_growth_agent_readiness`; P218 = `plg_growth_agent_readiness`; P217 = `sas_agent_readiness`; P220 = `growth_agent_readiness`. The P218↔P220 naming collision on `growth_agent_readiness` is a SEPARATE cross-phase fix — OUT OF SCOPE for P219.

**Slot coordination action:** Plan 219-01 Task 0.1 appends to (or creates if P218 has not yet executed) `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` documenting P219's reservation of slots 107-111 and F-IDs F-228..F-237. Document must include: collision history (foundation 82-89 occupied; P220 90-95+97 locked; slot 96 existing; slot 100 existing; P218 101-106 locked).

---

## P218 Contract Consumption (Module Mode Eligibility)

This section documents the explicit contract P219 consumes from P218 Plan 01.

### What P218 Ships (P219 Upstream Contract)

P218 Plan 01 (migration slot 101) creates:
1. `saas_growth_profiles` table — `mode markos_growth_mode NOT NULL` column + `b2b_enabled` / `plg_enabled` / `b2c_enabled` generated columns
2. `module_mode_eligibility` table — 60-row seed (12 modules × 5 modes), `eligible boolean`
3. `markos_growth_mode` ENUM — exactly 5 values: `'b2b', 'b2c', 'plg_b2b', 'plg_b2c', 'b2b2c'`
4. `lib/markos/profile/mode-eligibility.ts` — exports `isModuleEligible(tenantId, moduleKey): Promise<boolean>`
5. `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` — documented as the DB-trigger CONTRACT pattern P219/P220 module tables implement using `isModuleEligible` at runtime

### P219 Module → Mode Eligibility Matrix

Derived from P218 RESEARCH.md §Domain 1 module activation matrix (60-row seed) — rows relevant to P219 modules:

| P219 Module | Eligible Modes | Ineligible Modes | Module Key (module_mode_eligibility) |
|-------------|---------------|-----------------|--------------------------------------|
| ABM Engine (`abm_account_packages`) | b2b, plg_b2b | b2c, plg_b2c, b2b2c | `abm_engine` |
| Revenue Team Config (`revenue_team_configs`) | b2b, b2c, plg_b2b, plg_b2c, b2b2c | none | `revenue_alignment` |
| Account Expansion (`account_expansion_opportunities`) | b2b, b2c, plg_b2b, plg_b2c, b2b2c | none | `account_expansion` |
| Customer Marketing (`customer_marketing_programs`) | b2b, b2c, plg_b2b, plg_b2c, b2b2c | none | `customer_marketing` |
| Advocacy Programs (`advocacy_candidates`) | b2b, b2c, plg_b2b, plg_b2c, b2b2c | none | `advocacy` |
| Pricing Controls (`expansion_offers`, `save_offers`) | b2b, b2c, plg_b2b, plg_b2c, b2b2c | none | `expansion_pricing` |
| B2B Growth Agents (`b2b_growth_agent_readiness`) | b2b, plg_b2b | b2c, plg_b2c, b2b2c | `b2b_growth_agents` |

**ABM + B2B agent scope constraint:** ABM packages and B2B growth agents are only eligible for `b2b` and `plg_b2b` modes. A tenant in `b2c` or `plg_b2c` mode must receive `isModuleEligible(tenantId, 'abm_engine') = false`. Plan 219-03 migration SQL MUST include a `BEFORE INSERT` trigger referencing `lib/markos/profile/mode-eligibility.ts` (runtime) or the `module_mode_eligibility` table (via JOIN at application time).

### How P219 Consumes the Contract

```typescript
// lib/markos/abm/packages.ts — example module-gate pattern
import { isModuleEligible } from '../profile/mode-eligibility';

export async function createAbmAccountPackage(tenantId: string, input: ABMPackageInput) {
  const eligible = await isModuleEligible(tenantId, 'abm_engine');
  if (!eligible) {
    throw new Error('MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE: abm_engine not eligible for tenant growth mode');
  }
  // ... proceed with insert
}
```

**DB-trigger defense-in-depth:** Each P219 module table ships a `BEFORE INSERT` DB-trigger that calls `isModuleEligible` via a Postgres wrapper function (or raises `EXCEPTION 'MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE'` directly via a JOIN against `module_mode_eligibility`). App-layer check + DB-trigger = dual enforcement per P226 RH5/RH6 lesson.

---

## P217 Contract Consumption (Revenue Intelligence)

This section documents the explicit contract P219 consumes from P217.

### What P217 Ships (P219 Upstream Contract)

P217 Plan 01 + Plan 02 create:
1. `saas_mrr_snapshots` table — MRR, ARR, NRR, GRR, churn, expansion, contraction per tenant per period
2. Revenue metric source precedence rules (billing > processor > accounting > CRM > manual)
3. `SAS-09` requirement satisfied — SaaS product usage and revenue intelligence (REQUIREMENTS.md line 226 maps `SAS-09 | Phase 217`)

**P219 read-only consumption of `saas_mrr_snapshots`:**
- `api/cron/b2b-expansion-signal-scanner.js` (Plan 219-02) queries `saas_mrr_snapshots` for expansion signals
- Fields consumed: `period_end`, `mrr_cents`, `nrr_pct`, `expansion_cents`, `contraction_cents`, `churn_cents`
- P219 NEVER writes to `saas_mrr_snapshots` — consume-only contract
- `lib/markos/expansion/signal-scanner.ts` includes static-analysis grep guard: `from('saas_mrr_snapshots').insert` returns 0

### SAS-09 Ownership Boundary

| Phase | Relation | SAS-09 Activity |
|-------|----------|----------------|
| P217 | OWNS SAS-09 | Creates `saas_mrr_snapshots` + metric definitions + source precedence rules |
| P218 | INTEGRATES | Reads `saas_mrr_snapshots` for PQL score signals + module activation eligibility check |
| P219 | INTEGRATES | Reads `saas_mrr_snapshots` for expansion opportunity signals (Plan 02 cron scanner) |

P219 Plan 01 frontmatter must include `integrates_with: [SAS-09 from P217]` (NOT `requirements: [SAS-09]`). This avoids the double-ownership drift detected in P218-REVIEWS.md MEDIUM concern #7 and P217-REVIEWS.md MEDIUM concern.

---

## Per-Domain Deep Dive

### Domain 1: RevenueTeamConfig + Lifecycle Definitions + SLAs + LOOP-06 (Plan 219-01)

**Requirements:** SG-08, LOOP-06, QA-01..15

**Object model** (per doc 17 line ~1416-1470 + Operating Loop Spec line 64-65):

```sql
-- revenue_team_configs (P219-owned; tenant-scoped; one active config per tenant)
CREATE TABLE revenue_team_configs (
  config_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  has_sales_team        boolean NOT NULL DEFAULT false,
  has_cs_team           boolean NOT NULL DEFAULT false,
  sales_model           text NOT NULL CHECK (sales_model IN (
    'self_serve_only', 'sales_assisted', 'enterprise_sales', 'hybrid'
  )),
  mql_definition_jsonb  jsonb NOT NULL DEFAULT '{}'::jsonb,
  sql_definition_jsonb  jsonb NOT NULL DEFAULT '{}'::jsonb,
  mql_to_sql_sla_hours  int NOT NULL DEFAULT 24 CHECK (mql_to_sql_sla_hours > 0),
  pql_routing_jsonb     jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback_cadence      text NOT NULL DEFAULT 'weekly'
                        CHECK (feedback_cadence IN ('weekly', 'bi_weekly')),
  win_loss_review       boolean NOT NULL DEFAULT false,
  attribution_model     text NOT NULL DEFAULT 'last_touch'
                        CHECK (attribution_model IN (
                          'last_touch', 'first_touch', 'linear', 'time_decay',
                          'u_shaped', 'w_shaped', 'custom'
                        )),
  shared_pipeline_target_cents  bigint,
  marketing_sourced_pct_target  numeric(5,2) CHECK (marketing_sourced_pct_target BETWEEN 0 AND 100),
  approved_at           timestamptz,
  approved_by           uuid,
  version               int NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE revenue_team_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rtc_tenant_isolation ON revenue_team_configs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- lead_qualification_sla_events (LOOP-06 — SLA breach tasks + pipeline evidence)
CREATE TABLE lead_qualification_sla_events (
  event_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  config_id           uuid NOT NULL REFERENCES revenue_team_configs(config_id),
  lead_id             uuid,
  event_type          text NOT NULL CHECK (event_type IN (
    'mql_raised', 'sql_accepted', 'sql_rejected', 'mql_sla_breach', 'mql_sla_warn'
  )),
  sla_threshold_hours int,
  elapsed_hours       numeric(10,2),
  task_created_id     uuid,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE lead_qualification_sla_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lqse_tenant_type ON lead_qualification_sla_events(tenant_id, event_type, created_at);

-- marketing_sales_feedback_records (LOOP-06 — weekly alignment reports)
CREATE TABLE marketing_sales_feedback_records (
  record_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  config_id             uuid NOT NULL REFERENCES revenue_team_configs(config_id),
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  mql_acceptance_rate   numeric(5,2),
  rejection_reasons_jsonb  jsonb NOT NULL DEFAULT '[]'::jsonb,
  pipeline_coverage_jsonb  jsonb NOT NULL DEFAULT '{}'::jsonb,
  attribution_jsonb        jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendations_jsonb    jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_id           uuid,
  approved_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period_start)
);
ALTER TABLE marketing_sales_feedback_records ENABLE ROW LEVEL SECURITY;
```

**DB-trigger compliance enforcement (SLA breach DB-trigger):**
- `BEFORE UPDATE` trigger on `revenue_team_configs`: raises `EXCEPTION 'SLA_CONFIG_REQUIRES_APPROVAL'` when `NEW.mql_to_sql_sla_hours != OLD.mql_to_sql_sla_hours AND NEW.approved_at IS NULL`. SLA definition changes must be approval-gated. App-only enforcement is bypassable per P226 RH5/RH6 lesson.
- `BEFORE INSERT` trigger on `marketing_sales_feedback_records`: validates that `period_start < period_end` and `config_id` exists for tenant (schema integrity gate).

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/b2b/revenue-team-config` | GET / POST / PATCH | RevenueTeamConfig CRUD | F-228 |
| `/v1/b2b/revenue-team-config/sla-events` | GET | List SLA events (LOOP-06 pipeline evidence) | F-228 (subpath) |
| `/v1/b2b/revenue-team-config/feedback` | GET / POST | Feedback record CRUD + approval dispatch | F-229 |

**Cron handler:**
- `api/cron/b2b-sla-breach-monitor.js` — hourly: scan aging MQLs exceeding `mql_to_sql_sla_hours`; create breach event rows; emit task.

**MCP tools:**
- `b2b_revenue_team_config_get` — read tenant RevenueTeamConfig (Read)
- `b2b_mql_sla_status` — check SLA health for current period (Read)
- `b2b_feedback_record_get` — read latest alignment report (Read)

**Test strategy:**
- `test/b2b-219/revenue-team/config-crud.test.js` — CRUD + RLS + UNIQUE tenant constraint
- `test/b2b-219/revenue-team/sla-trigger.test.js` — DB-trigger fires when SLA changes without approval
- `test/b2b-219/revenue-team/sla-breach-monitor.test.js` — cron detects aging MQL, creates event + task
- `test/b2b-219/revenue-team/feedback-approval.test.js` — `buildApprovalPackage` wiring

---

### Domain 2: Account Expansion Programs + Customer Marketing (Plan 219-02)

**Requirements:** SG-03, SG-09, SG-12, EVD-01..04

**P217 integration (expansion signal scanner):** `api/cron/b2b-expansion-signal-scanner.js` reads `saas_mrr_snapshots` (P217) for MRR growth signals alongside `saas_health_scores` (P216). Consumes MRR delta, NRR, and expansion_cents to prioritize expansion targets. P219 NEVER writes to P217 tables.

**Object model** (per doc 17 line ~377-400 + expansion flywheel Part 3):

```sql
-- account_expansion_opportunities (P219-owned)
CREATE TABLE account_expansion_opportunities (
  opportunity_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  account_id          uuid,
  expansion_type      text NOT NULL CHECK (expansion_type IN (
    'seat_expansion', 'plan_upgrade', 'add_on_adoption', 'annual_conversion', 'custom'
  )),
  trigger_signal      text NOT NULL CHECK (trigger_signal IN (
    'usage_growth', 'seat_pressure', 'champion_role_change', 'company_growth_news',
    'contract_renewal', 'qbr_upcoming', 'budget_cycle', 'pql_signal', 'health_score_high',
    'mrr_expansion_detected'
  )),
  estimated_arr_delta_cents  bigint,
  recommended_approach  text,
  timing_trigger        text,
  evidence_refs         uuid[] DEFAULT ARRAY[]::uuid[],
  pricing_context_id    uuid,   -- pricing_recommendations FK (soft P205; null = pending)
  status              text NOT NULL DEFAULT 'identified'
                      CHECK (status IN (
                        'identified', 'warming', 'outreach_pending', 'outreach_sent',
                        'meeting_booked', 'closed_won', 'closed_lost', 'deferred'
                      )),
  approval_id         uuid,
  approved_at         timestamptz,
  closed_at           timestamptz,
  closed_reason       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE account_expansion_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeo_tenant_isolation ON account_expansion_opportunities
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_aeo_account ON account_expansion_opportunities(tenant_id, account_id, status);

-- customer_marketing_programs (P219-owned; per doc 17 CustomerMarketingProgram interface)
CREATE TABLE customer_marketing_programs (
  program_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  program_type        text NOT NULL CHECK (program_type IN (
    'customer_success_sequence', 'expansion_campaign', 'advocacy_recruitment',
    'referral_program', 'beta_program', 'customer_advisory_board',
    'community_champion', 'case_study_pipeline', 'review_generation', 'co_marketing'
  )),
  name                text NOT NULL,
  target_segment      text NOT NULL,
  activation_criteria text NOT NULL,
  goal                text NOT NULL CHECK (goal IN (
    'expansion', 'advocacy', 'retention', 'education', 'review', 'beta', 'advisory', 'co_marketing'
  )),
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('active', 'paused', 'draft', 'archived')),
  enrolled_count      int NOT NULL DEFAULT 0,
  conversion_rate     numeric(5,4) NOT NULL DEFAULT 0,
  approved_at         timestamptz,
  approved_by         uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE customer_marketing_programs ENABLE ROW LEVEL SECURITY;

-- program_enrollments (join table)
CREATE TABLE program_enrollments (
  enrollment_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  program_id        uuid NOT NULL REFERENCES customer_marketing_programs(program_id),
  account_id        uuid NOT NULL,
  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  goal_achieved_at  timestamptz,
  goal_outcome      text,
  unenrolled_at     timestamptz,
  unenroll_reason   text,
  UNIQUE(tenant_id, program_id, account_id)
);
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
```

**DB-trigger compliance enforcement (expansion approval DB-trigger):**
- `BEFORE UPDATE` trigger on `account_expansion_opportunities`: raises `EXCEPTION 'EXPANSION_OUTREACH_REQUIRES_APPROVAL'` when `NEW.status = 'outreach_sent' AND NEW.approval_id IS NULL`. Defense-in-depth against app-layer bypass.
- `BEFORE UPDATE` trigger on `customer_marketing_programs`: raises `EXCEPTION 'PROGRAM_ACTIVATION_REQUIRES_APPROVAL'` when `NEW.status = 'active' AND OLD.status = 'draft' AND NEW.approved_at IS NULL`.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/b2b/expansion/opportunities` | GET / POST / PATCH | Opportunity CRUD | F-230 |
| `/v1/b2b/customer-marketing/programs` | GET / POST / PATCH | Program CRUD | F-231 |
| `/v1/b2b/customer-marketing/programs/{id}/enrollments` | GET / POST | Enrollment CRUD | F-231 (subpath) |

**Cron handler:**
- `api/cron/b2b-expansion-signal-scanner.js` — daily: scan `saas_health_scores` (P216) + `saas_mrr_snapshots` (P217) for expansion triggers; create new `account_expansion_opportunities` rows.

**Test strategy:**
- `test/b2b-219/expansion/opportunities-crud.test.js` — CRUD + RLS
- `test/b2b-219/expansion/outreach-trigger.test.js` — DB-trigger blocks outreach without approval
- `test/b2b-219/expansion/program-activation.test.js` — program status machine + approval gate
- `test/b2b-219/expansion/enrollment-dedup.test.js` — UNIQUE constraint on (tenant, program, account)
- `test/b2b-219/expansion/mrr-snapshot-consume.test.js` — expansion scanner reads saas_mrr_snapshots; static grep confirms no writes to saas_mrr_snapshots

---

### Domain 3: ABMAccountPackage + Buying Committee Mapping (Plan 219-03)

**Requirements:** SG-03, SG-09, SG-12, EVD-01..06

**Cross-phase coordination (Q-1 — see section below):** P219 names its table `abm_buying_committee_members` (ABM-specific overlay). P222 will ship `buying_committee_members` (CRM-side). Distinct tables, distinct FK parents.

**Mode eligibility gate:** ABM modules (`abm_account_packages`, `abm_buying_committee_members`) are eligible only for `b2b` and `plg_b2b` modes. Plan 219-03 migration ships `BEFORE INSERT` trigger on `abm_account_packages` that calls `isModuleEligible(tenantId, 'abm_engine')` (via `lib/markos/profile/mode-eligibility.ts`). Tenants in `b2c`, `plg_b2c`, or `b2b2c` modes will receive `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` exception.

**Object model** (per doc 17 line ~496-569):

```sql
-- abm_account_packages (P219-owned)
CREATE TABLE abm_account_packages (
  package_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  account_id              uuid NOT NULL,
  company_domain          text NOT NULL,
  abm_tier                int NOT NULL CHECK (abm_tier IN (1, 2, 3)),
  stage                   text NOT NULL DEFAULT 'identified'
                          CHECK (stage IN (
                            'identified', 'aware', 'engaged', 'meeting_booked',
                            'opportunity', 'customer', 'expansion_target'
                          )),
  company_profile_jsonb   jsonb NOT NULL DEFAULT '{}'::jsonb,
  strategic_signals_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  messaging_jsonb         jsonb NOT NULL DEFAULT '{}'::jsonb,
  engagement_jsonb        jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs           uuid[] DEFAULT ARRAY[]::uuid[],
  enrichment_source       text CHECK (enrichment_source IN (
    'manual', 'research_engine', 'intent_data_import', 'operator'
  )),
  enrichment_confidence   numeric(4,2) DEFAULT 0 CHECK (enrichment_confidence BETWEEN 0 AND 1),
  enriched_at             timestamptz,
  inferred_fields         text[] DEFAULT ARRAY[]::text[],
  approved_at             timestamptz,
  approved_by             uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, account_id)
);
ALTER TABLE abm_account_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY abm_tenant_isolation ON abm_account_packages
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_abm_tier_stage ON abm_account_packages(tenant_id, abm_tier, stage);

-- abm_buying_committee_members (P219-owned; distinct from P222 CRM buying_committee_members)
-- See Cross-Phase Q-1 for naming disambiguation
CREATE TABLE abm_buying_committee_members (
  member_id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES markos_orgs(org_id),
  package_id                uuid NOT NULL REFERENCES abm_account_packages(package_id),
  contact_id                uuid,
  role_title                text NOT NULL,
  persona                   text NOT NULL CHECK (persona IN (
    'economic_buyer', 'champion', 'user', 'gatekeeper', 'influencer'
  )),
  linkedin_url              text,
  known_to_us               boolean NOT NULL DEFAULT false,
  last_interaction_at       timestamptz,
  preferred_content_format  text,
  key_concerns              text[] DEFAULT ARRAY[]::text[],
  is_inferred               boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE abm_buying_committee_members ENABLE ROW LEVEL SECURITY;

-- abm_engagement_events (ABM-specific engagement log)
CREATE TABLE abm_engagement_events (
  engagement_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_orgs(org_id),
  package_id      uuid NOT NULL REFERENCES abm_account_packages(package_id),
  event_type      text NOT NULL CHECK (event_type IN (
    'website_visit', 'content_consumed', 'email_open', 'email_reply',
    'ad_impression', 'event_attended', 'demo_booked', 'demo_completed',
    'proposal_sent', 'objection_raised'
  )),
  member_id       uuid REFERENCES abm_buying_committee_members(member_id),
  payload_jsonb   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE abm_engagement_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_abm_engagement_package ON abm_engagement_events(tenant_id, package_id, created_at);
```

**DB-trigger compliance enforcement (committee enrichment audit DB-trigger):**
- `BEFORE UPDATE` trigger on `abm_account_packages`: raises `EXCEPTION 'ABM_ENRICHMENT_AUDIT_REQUIRED'` when `NEW.enriched_at IS NOT NULL AND NEW.enriched_at != OLD.enriched_at AND NEW.enrichment_source NOT IN ('manual', 'operator')`. Enforces automated enrichment writes audit row.
- `BEFORE INSERT OR UPDATE` trigger on `abm_account_packages`: raises `EXCEPTION 'ABM_EXTERNAL_OUTREACH_REQUIRES_APPROVAL'` when `NEW.stage IN ('meeting_booked', 'opportunity') AND NEW.approved_at IS NULL`.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/b2b/abm/packages` | GET / POST / PATCH | ABM package CRUD | F-232 |
| `/v1/b2b/abm/packages/{id}/committee` | GET / POST / PATCH | Buying committee CRUD | F-233 |
| `/v1/b2b/abm/packages/{id}/engagement` | GET / POST | Engagement event CRUD | F-233 (subpath) |

**Cron handler:**
- `api/cron/b2b-abm-enrichment-refresh.js` — weekly: re-score `enrichment_confidence`; flag stale packages (enriched_at > 90 days); create enrichment review tasks.

**Test strategy:**
- `test/b2b-219/abm/package-crud.test.js` — CRUD + RLS + UNIQUE account constraint
- `test/b2b-219/abm/mode-eligibility-gate.test.js` — b2c-mode tenant INSERT raises MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE
- `test/b2b-219/abm/enrichment-audit-trigger.test.js` — automated enrichment without audit raises exception
- `test/b2b-219/abm/committee-inferred-flag.test.js` — `is_inferred=true` EVD-03 flag correctly set/cleared
- `test/b2b-219/abm/stage-transition-approval.test.js` — stage advancement blocked without approval
- `test/b2b-219/abm/evidence-refs-validation.test.js` — evidence_refs populated before external outreach

---

### Domain 4: Customer Advocacy + Review Request + Proof Workflows (Plan 219-04)

**Requirements:** SG-03, SG-09, SG-12, T0-04, EVD-01..06

**T0-04 coverage:** "Public Tenant 0 proof is sourced, approved, and privacy-safe." Plan 219-04 ships the entire proof governance layer — `proof_consent_records` (privacy-safe consent), `proof_assets` (approval-gated evidence-backed proof), and `advocacy_review_requests` (sourced + approved G2/Capterra requests). Tenant 0's own public proof flows through exactly this pipeline. T0-04 is satisfied when: (a) `proof_consent_records.consent_given = true` before any public use, (b) `proof_assets.approved_at IS NOT NULL` before publication, (c) `proof_assets.evidence_refs` is non-empty (sourced).

**Cross-phase coordination (Q-2):** P219 Plan 04 owns INTERNAL advocacy pipeline (advocate identification, ask sequencing, case-study sourcing, consent, proof governance). P220 Plan 04 owns PR/Analyst/Review EXTERNAL surface (press intelligence, G2/Capterra review *response* management, coverage tracking). The boundary: P219 = "ask a customer to write a G2 review" (internal → outbound ask, approval-gated); P220 = "respond to a G2 review" (external platform management). Table naming: P219 = `advocacy_review_requests`; P220 = `pr_review_requests`.

**Object model:**

```sql
-- advocacy_candidates (P219-owned)
CREATE TABLE advocacy_candidates (
  candidate_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  contact_id            uuid NOT NULL,
  account_id            uuid,
  trigger_criteria      text[] NOT NULL DEFAULT ARRAY[]::text[],
  relationship_stage    text NOT NULL DEFAULT 'identified'
                        CHECK (relationship_stage IN (
                          'identified', 'warming', 'warm', 'asked', 'committed', 'advocate'
                        )),
  consent_state         text NOT NULL DEFAULT 'not_requested'
                        CHECK (consent_state IN (
                          'not_requested', 'requested', 'given', 'declined', 'revoked'
                        )),
  health_score_at_identification  numeric(5,2),
  nps_score_at_identification     int,
  last_ask_at           timestamptz,
  last_ask_type         text,
  do_not_contact        boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, contact_id)
);
ALTER TABLE advocacy_candidates ENABLE ROW LEVEL SECURITY;

-- advocacy_review_requests (P219-owned; outbound asks to customers — DISTINCT from P220 pr_review_requests)
CREATE TABLE advocacy_review_requests (
  request_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  candidate_id        uuid NOT NULL REFERENCES advocacy_candidates(candidate_id),
  platform            text NOT NULL CHECK (platform IN (
    'g2', 'capterra', 'trustpilot', 'app_store', 'google_play',
    'product_hunt', 'getapp', 'software_advice', 'custom'
  )),
  ask_type            text NOT NULL CHECK (ask_type IN (
    'first_review', 'refresh_review', 'response_to_competitor_review', 'platform_specific_campaign'
  )),
  message_preview     text,
  approval_id         uuid,
  approved_at         timestamptz,
  sent_at             timestamptz,
  result              text CHECK (result IN ('submitted', 'declined', 'no_response', 'pending')),
  review_url          text,
  evidence_ref        uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE advocacy_review_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_arq_candidate ON advocacy_review_requests(tenant_id, candidate_id, platform);

-- proof_assets (P219-owned)
CREATE TABLE proof_assets (
  asset_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  candidate_id      uuid REFERENCES advocacy_candidates(candidate_id),
  asset_type        text NOT NULL CHECK (asset_type IN (
    'case_study', 'testimonial_quote', 'video_testimonial', 'logo_use',
    'reference_customer', 'co_authored_content', 'advisory_board_member',
    'press_mention', 'award_nomination'
  )),
  title             text NOT NULL,
  content_draft     text,
  published_url     text,
  evidence_refs     uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  source_quality    numeric(3,2),
  privacy_approved  boolean NOT NULL DEFAULT false,
  approval_id       uuid,
  approved_at       timestamptz,
  published_at      timestamptz,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE proof_assets ENABLE ROW LEVEL SECURITY;

-- proof_consent_records (T0-04 + EVD-02 — privacy and consent for public proof use)
CREATE TABLE proof_consent_records (
  consent_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  candidate_id            uuid NOT NULL REFERENCES advocacy_candidates(candidate_id),
  asset_id                uuid REFERENCES proof_assets(asset_id),
  consent_type            text NOT NULL CHECK (consent_type IN (
    'case_study_publication', 'logo_use', 'quote_use', 'video_use',
    'reference_customer', 'co_marketing', 'advisory_board'
  )),
  consent_given           boolean NOT NULL DEFAULT false,
  consent_given_at        timestamptz,
  consent_revoked_at      timestamptz,
  consent_method          text CHECK (consent_method IN ('email', 'in_app', 'paper', 'verbal_recorded')),
  consent_evidence_url    text,
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE proof_consent_records ENABLE ROW LEVEL SECURITY;
```

**DB-trigger compliance enforcement (consent + evidence FK DB-trigger):**
- `BEFORE UPDATE` trigger on `advocacy_review_requests`: raises `EXCEPTION 'REVIEW_REQUEST_REQUIRES_APPROVAL'` when `NEW.sent_at IS NOT NULL AND NEW.approval_id IS NULL`.
- `BEFORE UPDATE` trigger on `proof_assets`: raises `EXCEPTION 'PROOF_REQUIRES_CONSENT_AND_EVIDENCE'` when `NEW.status = 'published' AND (NEW.privacy_approved = false OR array_length(NEW.evidence_refs, 1) IS NULL)`.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/b2b/advocacy/candidates` | GET / POST / PATCH | Advocacy candidate CRUD | F-234 |
| `/v1/b2b/advocacy/review-requests` | GET / POST / PATCH | Review request CRUD + dispatch | F-234 (subpath) |
| `/v1/b2b/advocacy/proof` | GET / POST / PATCH | Proof asset CRUD | F-235 |
| `/v1/b2b/advocacy/consent` | GET / POST / PATCH | Consent record CRUD | F-235 (subpath) |

**Cron handlers:**
- `api/cron/b2b-advocacy-signal-scanner.js` — daily: scan health signals for advocacy candidates; create rows.
- `api/cron/b2b-review-request-cadence.js` — daily: dispatch approved review requests.

**Test strategy:**
- `test/b2b-219/advocacy/candidate-crud.test.js` — CRUD + UNIQUE contact + do_not_contact enforcement
- `test/b2b-219/advocacy/review-request-trigger.test.js` — DB-trigger blocks send without approval
- `test/b2b-219/advocacy/proof-publish-trigger.test.js` — DB-trigger blocks publish without consent + evidence
- `test/b2b-219/advocacy/consent-revocation.test.js` — revoked consent cascades to asset status
- `test/b2b-219/advocacy/t0-04-proof-posture.test.js` — Tenant 0 proof: sourced, consented, approved, published

---

### Domain 5: Expansion + Save + Discount + Pricing Engine Controls (Plan 219-05)

**Requirements:** SG-11, SG-12, PRC-01..09

**Pricing Engine integration mode (Q-4 — SOFT + sentinel fallback):**
1. `scripts/preconditions/219-05-check-upstream.cjs` checks `pricing_recommendations` as SOFT (warns, does not exit 1).
2. All offer copy defaults to sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}`.
3. DB-trigger accepts sentinel OR `pricing_recommendation_id IS NOT NULL`.
4. When P205 lands, a task is generated to replace sentinel offers with proper pricing recommendation references.

**Object model:**

```sql
-- discount_authorizations (P219-owned; CREATED first — FK parent of expansion/save offers)
CREATE TABLE discount_authorizations (
  authorization_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_orgs(org_id),
  discount_type               text NOT NULL CHECK (discount_type IN (
    'promotional', 'loyalty', 'partner_channel', 'event_specific', 'save_offer', 'expansion_incentive'
  )),
  discount_pct                numeric(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses                    int,
  valid_from                  date NOT NULL,
  valid_until                 date,
  pricing_recommendation_id   uuid,
  approval_id                 uuid NOT NULL,
  approved_at                 timestamptz NOT NULL,
  approved_by                 uuid NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE discount_authorizations ENABLE ROW LEVEL SECURITY;

-- expansion_offers (P219-owned)
CREATE TABLE expansion_offers (
  offer_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_orgs(org_id),
  opportunity_id              uuid REFERENCES account_expansion_opportunities(opportunity_id),
  offer_type                  text NOT NULL CHECK (offer_type IN (
    'seat_upgrade', 'plan_upgrade', 'add_on', 'annual_conversion', 'usage_expansion'
  )),
  offer_copy                  text NOT NULL,
  pricing_recommendation_id   uuid,
  estimated_arr_delta_cents   bigint,
  discount_pct                numeric(5,2),
  discount_authorization_id   uuid REFERENCES discount_authorizations(authorization_id),
  valid_until                 date,
  status                      text NOT NULL DEFAULT 'draft'
                              CHECK (status IN (
                                'draft', 'pending_approval', 'approved', 'active',
                                'expired', 'accepted', 'declined'
                              )),
  approval_id                 uuid,
  approved_at                 timestamptz,
  sent_at                     timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expansion_offers ENABLE ROW LEVEL SECURITY;

-- save_offers (P219-owned)
CREATE TABLE save_offers (
  save_offer_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_orgs(org_id),
  account_id                  uuid NOT NULL,
  subscription_id             uuid,
  save_type                   text NOT NULL CHECK (save_type IN (
    'temporary_discount', 'plan_downgrade_alternative', 'pause_subscription',
    'feature_unlock_trial', 'cs_callback_offer', 'annual_conversion_incentive'
  )),
  offer_copy                  text NOT NULL,
  pricing_recommendation_id   uuid,
  discount_pct                numeric(5,2),
  discount_authorization_id   uuid,
  offer_duration_days         int,
  status                      text NOT NULL DEFAULT 'draft'
                              CHECK (status IN (
                                'draft', 'pending_approval', 'approved', 'presented',
                                'accepted', 'declined', 'expired'
                              )),
  approval_id                 uuid,
  approved_at                 timestamptz,
  presented_at                timestamptz,
  outcome                     text,
  created_at                  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE save_offers ENABLE ROW LEVEL SECURITY;
```

**Note on migration order:** `discount_authorizations` must be created before `expansion_offers` and `save_offers` in migration 111 (FK parent first). The migration creates all 3 tables in the correct order.

**DB-trigger compliance enforcement (pricing immutability DB-trigger):**
- `BEFORE UPDATE` trigger on `expansion_offers`: raises `EXCEPTION 'EXPANSION_OFFER_PRICING_REQUIRED'` when `NEW.status = 'active' AND NEW.pricing_recommendation_id IS NULL AND NEW.offer_copy NOT LIKE '%MARKOS_PRICING_ENGINE_PENDING%'`.
- `BEFORE UPDATE` trigger on `save_offers`: same pattern.
- `BEFORE INSERT` trigger on `discount_authorizations`: raises `EXCEPTION 'DISCOUNT_REQUIRES_APPROVAL'` when `NEW.approved_at IS NULL`.
- `BEFORE INSERT` trigger on `expansion_offers`: raises `EXCEPTION 'DISCOUNT_REQUIRES_AUTHORIZATION'` when `NEW.discount_pct > 0 AND NEW.discount_authorization_id IS NULL`.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/b2b/pricing/expansion-offers` | GET / POST / PATCH | Expansion offer CRUD | F-236 |
| `/v1/b2b/pricing/save-offers` | GET / POST / PATCH | Save offer CRUD | F-236 (subpath) |
| `/v1/b2b/pricing/discount-authorizations` | GET / POST | Discount authorization CRUD | F-236 (subpath) |

**Test strategy:**
- `test/b2b-219/pricing/expansion-offer-pricing-trigger.test.js` — trigger blocks activation without pricing context or sentinel
- `test/b2b-219/pricing/discount-authorization-required.test.js` — expansion offer with discount blocked without authorization FK
- `test/b2b-219/pricing/save-offer-approval.test.js` — `buildApprovalPackage` wiring
- `test/b2b-219/pricing/sentinel-detection.test.js` — offer_copy sentinel accepted; offer without either pricing_recommendation_id or sentinel blocked

---

### Domain 6: B2B Growth Agent Readiness + Non-Runnable Gates (Plan 219-06)

**Requirements:** SG-10, RUN-01..08

**Pattern:** Mirror P220 Plan 06 + P226 Wave 1 model (`autonomous: false` + `checkpoint:human-action` for first-run activation).

**Agent registry naming disambiguation:**

| Phase | Table | Prefix | Scope |
|-------|-------|--------|-------|
| P217 | `sas_agent_readiness` | SAS | SaaS Revenue Intelligence agents (SAS-01..06) |
| P218 | `plg_growth_agent_readiness` | PLG | PLG/in-app/experimentation agents |
| P219 | `b2b_growth_agent_readiness` | B2B | B2B expansion/ABM/advocacy/revenue agents |
| P220 | `growth_agent_readiness` | (consolidated) | All growth agents (P218+P219 rows consolidated) |

**Naming collision note:** P218 `growth_agent_readiness` vs P220 `growth_agent_readiness` — this is a SEPARATE cross-phase collision, OUT OF SCOPE for P219. P219's `b2b_growth_agent_readiness` is unambiguously distinct from all four tables above.

**P219 B2B target agents** (from canon + doc 17 Part 3/4/13):

| Agent Token | Name | Description | Tier |
|------------|------|-------------|------|
| `MARKOS-AGT-EXP-01` | Expansion Intelligence Agent | Identifies expansion signals, builds opportunity cases | Expansion |
| `MARKOS-AGT-EXP-02` | Customer Marketing Manager | Manages customer marketing programs, enrollment, activation | Expansion |
| `MARKOS-AGT-EXP-03` | Advocacy Engine | Identifies advocates, sequences asks, monitors proof pipeline | Expansion |
| `MARKOS-AGT-ABM-01` | ABM Account Intelligence Agent | Builds company intelligence packages, buying committee maps | ABM |
| `MARKOS-AGT-ABM-02` | ABM Content Personalization Agent | Generates account-personalized content per buying committee persona | ABM |
| `MARKOS-AGT-ABM-03` | ABM Orchestration Agent | Sequences multi-touch ABM programs across Tier 1/2/3 accounts | ABM |
| `MARKOS-AGT-REV-01` | Revenue Intelligence Agent | Generates alignment reports, pipeline coverage, content attribution | Revenue |
| `MARKOS-AGT-REV-02` | Marketing-Sales Alignment Agent | Synthesizes sales feedback, identifies MQL rejection patterns | Revenue |
| `MARKOS-AGT-IAM-01` | In-App Campaign Orchestrator | (NOTE: P218 likely owns — P219-06 records readiness state only) | In-App |

**Schema strategy:** P219-06 creates `b2b_growth_agent_readiness` as its own table (NOT depending on P220's `growth_agent_readiness` which does not yet exist when P219 runs). P220-06 migration consolidates P219's rows into `growth_agent_readiness`.

```sql
-- b2b_growth_agent_readiness (P219-owned; temporary; consolidated into growth_agent_readiness by P220-06)
CREATE TABLE b2b_growth_agent_readiness (
  agent_id                  text PRIMARY KEY,  -- e.g., 'MARKOS-AGT-EXP-01'
  agent_name                text NOT NULL,
  agent_tier                text NOT NULL,
  contracts_assigned        boolean NOT NULL DEFAULT false,
  cost_estimated            boolean NOT NULL DEFAULT false,
  approval_posture_defined  boolean NOT NULL DEFAULT false,
  tests_implemented         boolean NOT NULL DEFAULT false,
  api_surface_defined       boolean NOT NULL DEFAULT false,
  mcp_surface_defined       boolean NOT NULL DEFAULT false,
  ui_surface_defined        boolean NOT NULL DEFAULT false,
  failure_behavior_defined  boolean NOT NULL DEFAULT false,
  runnable                  boolean GENERATED ALWAYS AS (
    contracts_assigned AND cost_estimated AND approval_posture_defined
    AND tests_implemented AND api_surface_defined AND mcp_surface_defined
    AND ui_surface_defined AND failure_behavior_defined
  ) STORED,
  blocking_phase            text DEFAULT 'P219-06',
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
-- Note: NOT tenant-scoped — system-level registry. Service-role-only access.

-- Seed 9 P219 agents (all runnable=false):
INSERT INTO b2b_growth_agent_readiness (agent_id, agent_name, agent_tier, blocking_phase) VALUES
  ('MARKOS-AGT-EXP-01', 'Expansion Intelligence Agent', 'EXP', 'P219-06'),
  ('MARKOS-AGT-EXP-02', 'Customer Marketing Manager', 'EXP', 'P219-06'),
  ('MARKOS-AGT-EXP-03', 'Advocacy Engine', 'EXP', 'P219-06'),
  ('MARKOS-AGT-ABM-01', 'ABM Account Intelligence Agent', 'ABM', 'P219-06'),
  ('MARKOS-AGT-ABM-02', 'ABM Content Personalization Agent', 'ABM', 'P219-06'),
  ('MARKOS-AGT-ABM-03', 'ABM Orchestration Agent', 'ABM', 'P219-06'),
  ('MARKOS-AGT-REV-01', 'Revenue Intelligence Agent', 'REV', 'P219-06'),
  ('MARKOS-AGT-REV-02', 'Marketing-Sales Alignment Agent', 'REV', 'P219-06'),
  ('MARKOS-AGT-IAM-01', 'In-App Campaign Orchestrator', 'IAM', 'P218-06-CONFIRM');
```

**Activation gate DB-trigger (mirror P220 SG-10 invariant):**
- `BEFORE UPDATE` trigger on `b2b_growth_agent_readiness`: raises `EXCEPTION 'AGENT_ACTIVATION_REQUIRES_READINESS'` when any individual readiness flag is set to true but `runnable` generated column would still compute false (catches partial activation attempts).

**First-run activation gate:** Plan 219-06 ships with `autonomous: false` + `checkpoint:human-action` — operator must manually review the B2B agent readiness registry and confirm (via approval) before any B2B growth agent tier can progress toward `contracts_assigned = true`.

**Test strategy:**
- `test/b2b-219/agents/registry-non-runnable.test.js` — 9 P219 agents all have `runnable = false` after Plan 219-06 migration
- `test/b2b-219/agents/activation-gate-trigger.test.js` — attempt to set any readiness flag true when others false; verifies activation gate
- `test/b2b-219/agents/readiness-progression.test.js` — setting all 8 flags true yields `runnable = true`

---

## Cross-Phase Coordination

### Q-1: P219 Buying Committee (Plan 03) vs P218 ICPSegmentDefinition — RESOLVED + AFFIRMED

**Previous resolution (commit 813008a):** P218 uses pre-existing `markos_icps` + `markos_segments` (migration 37) for ICP definition. P219 owns ABM-specific `abm_buying_committee_members` as an overlay — NOT a modification to `markos_icps`. P222 will ship CRM-side `buying_committee_members` (per ROADMAP P222 description). Both P219 and P222 tables are distinct.

**P218 final contract affirmed (commit bf0205b):** P218 research confirms P218 does NOT ship a buying committee table. P218 Plan 01 migration 101 creates `saas_growth_profiles` + `module_mode_eligibility` only. P219 `abm_buying_committee_members` ownership is unambiguous.

**Coordination rule:** P219's `abm_account_packages.company_profile_jsonb` may include an `icp_fit_score` field referencing ICP data by value, but P219 does NOT modify `markos_icps` or `markos_segments`. The P219-03 migration SQL must include comment: `-- P219-owned: abm_buying_committee_members. P222 will ship buying_committee_members (CRM-side). Distinct tables, distinct FK parents. No collision.`

### Q-2: P219 Advocacy (Plan 04) vs P220 PR/Review (Plan 04) — RESOLVED

**Boundary:**
- P219 Plan 04 = outbound advocacy asks to customers (`advocacy_review_requests`)
- P220 Plan 04 = G2/Capterra platform review management + PR outreach (`pr_review_requests`, `review_records`, `pr_targets`, `pr_outreach`)

**Table naming resolution:** P219 = `advocacy_review_requests`; P220 = `pr_review_requests`. Planner must verify P220's naming matches and document the boundary in Plan 219-04 migration SQL.

### Q-3: P219 vs P220 Affiliate/Community Overlap — RESOLVED (no overlap)

No overlap. P219 is existing-customer B2B expansion/ABM/advocacy. P220 is B2C viral/community/PR/partnerships. Both depend on P218 SaaSGrowthProfile mode routing. F-ID cosmetic ordering: P220 takes F-209..F-227; P219 takes F-228..F-237 (continuing sequentially, non-monotonic with phase order, acceptable per P220 Q-3 precedent).

### Q-4: P219 Plan 05 Pricing Engine vs P205 — RESOLVED + AFFIRMED

SOFT dependency. Warn on absence, never block. Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted as valid alternative to `pricing_recommendation_id`. When P205 lands, emit enrichment tasks to convert sentinel records. See Domain 5 DB-trigger for enforcement pattern.

**P218 alignment:** P218 Plans 03+04 use the same SOFT + sentinel pattern for UpgradeTrigger and InAppCampaign. P219 Plan 05 is consistent with P218's established approach.

### Q-5: P219 SAS-09 Integration vs P217 Ownership — RESOLVED (NEW)

**Resolution:** P219 does NOT own SAS-09. REQUIREMENTS.md line 226 maps `SAS-09 | Phase 217`. P217 owns `saas_mrr_snapshots` + revenue metric definitions. P219 Plan 02 INTEGRATES via read-only consumption of `saas_mrr_snapshots` in expansion signal scanner.

**P217-REVIEWS.md alignment:** P217 REVIEWS.md explicitly flags SAS-09 as P217-owned territory. P219 Plan 01 frontmatter must use `integrates_with: [SAS-09 from P217]` field (NOT `requirements: [SAS-09]`). This mirrors the identical fix recommended for P218 Plan 01 SAS-09 handling.

**Preflight guard:** P219 Plan 02 `lib/markos/expansion/signal-scanner.ts` includes static-analysis grep guard: `from('saas_mrr_snapshots').insert` returns 0. Confirms consume-only contract.

### Q-6: P218↔P220 growth_agent_readiness Naming Collision — OUT OF SCOPE for P219

P218 `plg_growth_agent_readiness` table and P220 `growth_agent_readiness` consolidation table have a potential collision documented in P217/P218 reviews. P219's `b2b_growth_agent_readiness` is a THIRD distinct table. The P218↔P220 naming issue is a separate cross-phase coordination item, does not affect P219, and must be resolved between P218 and P220 planners.

### Q-7: Migration Slot Ordering Conflict — RESOLVED (updated from commit 813008a)

**Previous state (commit 813008a):** Q-7 was OPEN. P219 assumed slots 85-89 and P218 assumed slots 82-84. Both were wrong.

**Resolution (from P218 research commit bf0205b + 218-01-PLAN.md):**
- Foundation migrations fully occupy slots 82-89 (verified on disk)
- P218 locks slots 101-106, F-IDs F-238..F-246 (218-01-PLAN.md frontmatter confirmed)
- P219 takes slots 107-111 (Plan 06 additive in 111 OR own slot 112)
- P220 stays at 90-95+97 (locked, unchanged)
- Ordering conflict resolution: P220 migrations at 90-97 apply before P218/P219 at 101+. P218 Plan 01 ships `lib/markos/profile/mode-eligibility.ts` (`isModuleEligible`) as the app-layer runtime contract. P220 module-table triggers consume this helper at runtime rather than at migration apply time. P219 at 107+ has no sequencing conflict with P218 at 101+ (107 > 101 — correct dependency order).

**Slot collision history summary:**

| Range | Owner | Status |
|-------|-------|--------|
| 82–89 | Foundation (existing on-disk) | OCCUPIED — do not use |
| 90–95, 97 | P220 (locked in plans) | RESERVED — do not use |
| 96 | neuro_literacy_metadata (existing on-disk) | OCCUPIED |
| 98–99 | Available (P217 may use) | AVAILABLE |
| 100 | CRM hardening (existing on-disk) | OCCUPIED |
| 101–106 | P218 (locked in 218-01-PLAN.md) | RESERVED |
| 107–111 | P219 (this research) | RESERVED |
| 112 | P219 Plan 06 conditional | CONDITIONAL |

---

## Validation Architecture (Nyquist Dimension 8)

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node `--test` (matches P204 / P220 / P221 D-36 / P226 D-82 architecture-lock) |
| Config file | none — uses Node built-in test runner |
| Quick run command | `npm test -- test/b2b-219/preflight/` |
| Full suite command | `npm test -- test/b2b-219/ test/api-contracts/219-*` |
| Estimated runtime | ~30-60s |

### Sampling Rate

- **Per task commit:** `npm test -- test/b2b-219/<domain>/<task>.test.js`
- **Per wave merge:** `npm test -- test/b2b-219/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Per-Domain Test Strategy

| Domain | Unit Tests | Integration Tests | Regression |
|--------|-----------|-------------------|-----------|
| Domain 1 (RevTeam/SLA) | RLS, schema, SLA validators | DB-trigger SLA change; cron MQL aging | No migration collision with 107 |
| Domain 2 (Expansion/CustMarketing) | RLS, schema, enrollment dedup | DB-trigger outreach gate; signal scanner cron; saas_mrr_snapshots consume | P215 billing soft-degrade; P217 MRR read |
| Domain 3 (ABM/BuyingCommittee) | RLS, schema, enrichment audit flag | DB-trigger enrichment audit; stage gate; mode eligibility gate (b2c blocked) | P218 mode-eligibility isModuleEligible |
| Domain 4 (Advocacy/Review/Proof) | RLS, schema, consent revocation cascade | DB-trigger review send gate; proof publish gate | T0-04 proof posture regression |
| Domain 5 (Pricing Controls) | RLS, schema, sentinel detection | DB-trigger pricing immutability; discount chain | P205 sentinel upgrade path |
| Domain 6 (Agent Readiness) | All 9 agents runnable=false seed | Activation gate trigger | P220 growth_agent_readiness coordination |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SG-03 | Account expansion + ABM + advocacy workflows produce tasks/approvals | integration | `npm test -- test/b2b-219/expansion/ test/b2b-219/abm/ test/b2b-219/advocacy/` | ❌ Wave 0 |
| SG-08 | RevenueTeamConfig creates SLA breach tasks + feedback records | integration | `npm test -- test/b2b-219/revenue-team/` | ❌ Wave 0 |
| SG-09 | All domains produce tasks/approvals (not passive dashboards) | integration | `npm test -- test/b2b-219/` (tasks-created assertions per domain) | ❌ Wave 0 |
| SG-10 | All 9 B2B agents non-runnable (runnable=false generated column) | unit | `npm test -- test/b2b-219/agents/registry-non-runnable.test.js` | ❌ Wave 0 |
| SG-11 | Expansion/save/discount require pricing context or sentinel | unit+trigger | `npm test -- test/b2b-219/pricing/` | ❌ Wave 0 |
| SG-12 | All external mutations blocked by DB-trigger without approval | trigger | `npm test -- test/b2b-219/*/db-trigger-*.test.js` | ❌ Wave 0 |
| LOOP-06 | SLA breach events create pipeline evidence tasks | integration | `npm test -- test/b2b-219/revenue-team/sla-breach-monitor.test.js` | ❌ Wave 0 |
| EVD-01 | EvidenceMap FKs on ABM packages + proof assets | unit | `npm test -- test/b2b-219/abm/evidence-refs-validation.test.js` | ❌ Wave 0 |
| EVD-02 | Unsupported proof blocked before publish | trigger | `npm test -- test/b2b-219/advocacy/proof-publish-trigger.test.js` | ❌ Wave 0 |
| EVD-03 | Inferred ABM fields labeled `is_inferred=true` | unit | `npm test -- test/b2b-219/abm/committee-inferred-flag.test.js` | ❌ Wave 0 |
| EVD-04 | ABM package staleness check before re-enrichment | unit | `npm test -- test/b2b-219/abm/enrichment-staleness.test.js` | ❌ Wave 0 |
| EVD-05 | Approval payload exposes evidence + assumptions | unit | `npm test -- test/b2b-219/*/approval-payload-shape.test.js` | ❌ Wave 0 |
| EVD-06 | Pricing evidence has source quality + extraction method | unit | `npm test -- test/b2b-219/pricing/evidence-fields.test.js` | ❌ Wave 0 |
| T0-04 | Tenant 0 proof is sourced, approved, privacy-safe | integration | `npm test -- test/b2b-219/advocacy/t0-04-proof-posture.test.js` | ❌ Wave 0 |
| QA-01..15 | Phase 200 Quality Baseline | unit+integration | `npm test -- test/b2b-219/` | ❌ Wave 0 |

### Architecture-Lock Regression Test

`test/b2b-219/preflight/architecture-lock.test.js` ships in Plan 219-01 Task 0.5, runs FIRST in every wave:

```js
// test/b2b-219/preflight/architecture-lock.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const FORBIDDEN = [
  'createApprovalPackage', 'requireSupabaseAuth', 'lookupPlugin',
  'requireTenantContext', 'serviceRoleClient', 'public/openapi.json',
  'app/(b2b)', 'app/(growth)', 'route.ts', 'vitest', 'playwright', '.test.ts',
];

const SCAN_PATHS = [
  'lib/markos/b2b', 'lib/markos/revenue-team', 'lib/markos/expansion',
  'lib/markos/abm', 'lib/markos/advocacy', 'lib/markos/b2b-pricing',
  'lib/markos/b2b-agents', 'api/v1/b2b', 'api/cron/b2b-',
].join(' ');

test('architecture-lock: zero forbidden patterns in P219 code paths', () => {
  for (const pattern of FORBIDDEN) {
    let count = 0;
    try {
      count = parseInt(
        execSync(`grep -r "${pattern}" ${SCAN_PATHS} 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim(),
        10
      );
    } catch { count = 0; }
    assert.strictEqual(count, 0, `Forbidden pattern "${pattern}" found`);
  }
});
```

### Helper-Presence Test

`test/b2b-219/preflight/helper-presence.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

test('buildApprovalPackage exists', () => {
  const c = execSync('grep -c "function buildApprovalPackage" lib/markos/crm/agent-actions.ts').toString().trim();
  assert.strictEqual(c, '1');
});
test('requireHostedSupabaseAuth exists', () => {
  const c = execSync('grep -c "function requireHostedSupabaseAuth" onboarding/backend/runtime-context.cjs').toString().trim();
  assert.strictEqual(c, '1');
});
test('resolvePlugin exists', () => {
  assert.ok(existsSync('lib/markos/plugins/registry.js'));
});
test('mcp/tools/index.cjs exists (not .ts)', () => {
  assert.ok(existsSync('lib/markos/mcp/tools/index.cjs'));
  assert.ok(!existsSync('lib/markos/mcp/tools/index.ts'));
});
test('mode-eligibility helper will exist (P218 hard upstream)', () => {
  // This test hard-fails if P218 has not yet executed — correct behavior
  assert.ok(existsSync('lib/markos/profile/mode-eligibility.ts'));
});
test('createApprovalPackage DOES NOT exist anywhere in lib/markos/', () => {
  let c = 0;
  try { c = parseInt(execSync('grep -r "createApprovalPackage" lib/markos/ 2>/dev/null | wc -l').toString().trim(), 10); } catch {}
  assert.strictEqual(c, 0);
});
```

### Wave 0 Gaps

All test files are new — no existing coverage for P219 domain.

- [ ] `scripts/preconditions/219-01-check-upstream.cjs` — hard P214/P215/P217/P218; soft P205/P207-212/P216
- [ ] `lib/markos/b2b/preflight/upstream-gate.ts`
- [ ] `lib/markos/b2b/preflight/architecture-lock.ts`
- [ ] `lib/markos/b2b/preflight/errors.ts`
- [ ] `test/b2b-219/preflight/architecture-lock.test.js`
- [ ] `test/b2b-219/preflight/upstream-gate.test.js`
- [ ] `test/b2b-219/preflight/helper-presence.test.js`
- [ ] `test/fixtures/b2b-219/revenue-team-config.js`
- [ ] `test/fixtures/b2b-219/expansion-opportunity.js`
- [ ] `test/fixtures/b2b-219/abm-account-package.js`
- [ ] `test/fixtures/b2b-219/advocacy-candidate.js`
- [ ] `test/fixtures/b2b-219/expansion-offer.js`
- [ ] `test/fixtures/b2b-219/b2b-agent-readiness.js`

---

## Module Tree (P219-greenfield)

```
lib/markos/b2b/                       # umbrella for all P219 B2B motions
  contracts.ts                        # zod schemas (parity vs contracts/F-228..F-237)
  contracts.cjs                       # CJS twin
  api-helpers.ts                      # shared response helpers
  preflight/                          # upstream-gate + architecture-lock + errors

lib/markos/revenue-team/              # Domain 1
  config.ts                           # RevenueTeamConfig CRUD
  config.cjs
  sla-monitor.ts                      # SLA breach detection + task creation
  feedback.ts                         # feedback_records + buildApprovalPackage
  *.test.js

lib/markos/expansion/                 # Domain 2
  opportunities.ts                    # AccountExpansionOpportunity CRUD
  opportunities.cjs
  customer-marketing.ts               # CustomerMarketingProgram CRUD + enrollment
  enrollment.ts                       # program_enrollments + activation triggers
  signal-scanner.ts                   # saas_health_scores + saas_mrr_snapshots (P217) read-only
  *.test.js

lib/markos/abm/                       # Domain 3
  packages.ts                         # ABMAccountPackage CRUD + stage machine + mode-eligibility gate
  packages.cjs
  buying-committee.ts                 # abm_buying_committee_members CRUD
  engagement.ts                       # abm_engagement_events ingestion
  enrichment.ts                       # enrichment confidence scoring + staleness
  *.test.js

lib/markos/advocacy/                  # Domain 4
  candidates.ts                       # AdvocacyCandidate CRUD + do_not_contact
  candidates.cjs
  review-requests.ts                  # advocacy_review_requests dispatch + buildApprovalPackage
  proof-assets.ts                     # ProofAsset CRUD + publish gate
  consent.ts                          # proof_consent_records + revocation cascade
  signal-scanner.ts                   # health_score trigger for new candidates
  *.test.js

lib/markos/b2b-pricing/               # Domain 5
  expansion-offers.ts                 # ExpansionOffer CRUD + pricing sentinel enforcement
  expansion-offers.cjs
  save-offers.ts                      # SaveOffer CRUD + pricing sentinel
  discount-authorizations.ts          # DiscountAuthorization CRUD + approval enforcement
  pricing-context-resolver.ts         # P205 client or sentinel fallback
  *.test.js

lib/markos/b2b-agents/                # Domain 6
  readiness-registry.ts               # B2B agent readiness CRUD + activation gate
  readiness-gate.ts                   # can_run() returns false
  *.test.js
```

**Why `lib/markos/b2b/*` umbrella:** Mirrors P220's `lib/markos/growth/*` umbrella pattern. `lib/markos/sales/` reserved for P226. `lib/markos/ecosystem/` reserved for P227. No collision.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| SLA breach operator review | SG-08, LOOP-06 | SLA thresholds are business decisions; automated detection creates tasks but human judgment required for action | Operator reviews `lead_qualification_sla_events` breach queue; acts via approval inbox |
| Expansion offer pricing copy editorial judgment | SG-11, PRC-09 | Pricing copy with sentinel must pass editorial review before activation | Operator reviews `expansion_offers.offer_copy` with `{{MARKOS_PRICING_ENGINE_PENDING}}`; replaces sentinel or confirms P205 routing |
| Advocacy consent confirmation | SG-12, T0-04 | Consent for public proof use requires human judgment | Operator reviews `proof_consent_records` before mark-as-given; confirms consent method validity |
| First-run B2B agent activation | SG-10 | No B2B growth agent can run without human checkpoint | `checkpoint:human-action` — operator reviews B2B agent readiness registry; manually sets `contracts_assigned=true` per agent only after full readiness confirmed |
| ABM enrichment source validation | EVD-03, EVD-04 | Inferred buying committee member fields require human validation before external outreach | Operator reviews `abm_buying_committee_members` where `is_inferred=true` before any approval advance |
| Proof privacy review | T0-04, EVD-02 | `privacy_approved=true` flag requires human review of privacy posture | Operator reviews proof asset content + consent before flipping `privacy_approved=true` |

---

## Compliance Enforcement Boundary Summary

| Domain | App-layer | DB-trigger | Trigger Behavior |
|--------|-----------|-----------|-----------------|
| Plan 01 (RevTeam/SLA) | `buildApprovalPackage` on feedback record dispatch | SLA breach trigger on `revenue_team_configs` | `EXCEPTION 'SLA_CONFIG_REQUIRES_APPROVAL'` on SLA change without approval |
| Plan 02 (Expansion/CustMarketing) | `buildApprovalPackage` on outreach + program activation | Expansion approval trigger on `account_expansion_opportunities` | `EXCEPTION 'EXPANSION_OUTREACH_REQUIRES_APPROVAL'` |
| Plan 03 (ABM/BuyingCommittee) | `buildApprovalPackage` on external ABM outreach + `isModuleEligible` mode gate | Committee enrichment audit trigger on `abm_account_packages` + mode eligibility gate | `EXCEPTION 'ABM_ENRICHMENT_AUDIT_REQUIRED'` + `EXCEPTION 'MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE'` |
| Plan 04 (Advocacy/Review/Proof) | `buildApprovalPackage` on every review ask + proof publish | Consent + evidence FK trigger on `proof_assets` + `advocacy_review_requests` | `EXCEPTION 'REVIEW_REQUEST_REQUIRES_APPROVAL'` + `EXCEPTION 'PROOF_REQUIRES_CONSENT_AND_EVIDENCE'` |
| Plan 05 (Pricing Controls) | `buildApprovalPackage` on every offer + discount | Pricing immutability trigger on `expansion_offers` + `save_offers` | `EXCEPTION 'EXPANSION_OFFER_PRICING_REQUIRED'` |
| Plan 06 (Agent Readiness) | `checkpoint:human-action` for first-run activation | Activation gate trigger on `b2b_growth_agent_readiness` | `EXCEPTION 'AGENT_ACTIVATION_REQUIRES_READINESS'` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | npm test runner command is `node --test test/**/*.test.js` | Architecture Lock | Wrong runner invalidates all test commands in plans |
| A2 | P218 does NOT own a buying_committee table (only markos_icps + markos_segments from migration 37; saas_growth_profiles + module_mode_eligibility from migration 101) | Cross-Phase Q-1 | Naming collision if P218 ships its own buying_committee_members |
| A3 | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` created by P218 Plan 01 Task 0.1; P219 Plan 01 Task 0.1 appends P219 reservation | F-ID/Migration | If P218 has not yet executed, P219-01 must create the doc from scratch (create-or-append pattern required) |
| A4 | P215 billing engine has `billing_periods` + `tenant_billing_subscriptions` from migration 54 | Upstream Dependencies | Domain 2 expansion offers route through billing engine; fails if P215 schema differs |
| A5 | P222 will ship `buying_committee_members` CRM table (per ROADMAP P222 description) | Cross-Phase Q-1 | If P222 uses different name, coordination comment is stale but no collision |
| A6 | F-ID range F-228..F-237 is unallocated (no other phase claims this range) | F-ID Allocation | Collision if another phase grabs same range before P219 plans land |
| A7 | `openapi:build` script exists in package.json matching P220 pattern | Architecture Lock | Planner must verify before Plan 01 Task 0.5 |
| A8 | P217 ships `saas_mrr_snapshots` table (Plan 01 SaaSMRRSnapshot per 217-CONTEXT.md "Define SaaSMRRSnapshot and MRR waterfall") | Upstream Dependencies | Domain 2 expansion signal scanner reads this table; fails if P217 uses different name |
| A9 | `lib/markos/profile/mode-eligibility.ts` exports `isModuleEligible(tenantId, moduleKey)` (confirmed in 218-01-PLAN.md must_haves) | Architecture Lock / P218 Contract | If P218 Plan 01 does not ship this export, P219 mode-eligibility gates fail at runtime |

---

## Environment Availability

Step 2.6: SKIPPED — P219 is code/schema/config changes with no new external CLI dependencies beyond existing Supabase + Node.js stack already verified by P220 research.

---

## Sources

### Primary (HIGH confidence — verified in session)

- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` — B2B growth engine modules, target agents, approval posture, Pricing Engine relationship [VERIFIED]
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — RevenueTeamConfig, ABMAccountPackage object shapes [VERIFIED]
- `obsidian/reference/Database Schema.md` — migration map (migration 96 highest on-disk; migration 37 icps/segments; migration 54 billing) [VERIFIED]
- `obsidian/reference/Contracts Registry.md` — F-ID allocation rules, SaaS Marketing OS strategy contract families [VERIFIED]
- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` — TypeScript interfaces for RevenueTeamConfig (line ~1416), CustomerMarketingProgram (line ~377), ABMAccountPackage (line ~496), BuyingCommitteeMember (line ~560) [VERIFIED]
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` function [VERIFIED: codebase grep]
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` function [VERIFIED: codebase grep]
- `lib/markos/plugins/registry.js:102` — `resolvePlugin` function [VERIFIED: codebase grep]
- `lib/markos/mcp/tools/index.cjs` — MCP tool registry (CommonJS) [VERIFIED: codebase file check]
- `contracts/openapi.json` — active OpenAPI spec [VERIFIED: codebase file check]
- `supabase/migrations/` filesystem listing — slots 82-89, 96, 100 occupied; no 101+ yet [VERIFIED: codebase 2026-04-26]

### Secondary (MEDIUM confidence — verified from planning artifacts)

- `.planning/REQUIREMENTS.md` — T0-04 confirmed (line 113); all SG/LOOP/EVD IDs confirmed; SAS-09 = P217 (line 226) [VERIFIED]
- `.planning/ROADMAP.md` lines 381-413 — P219/P220 phase entries; P220 migration/F-ID slots [VERIFIED]
- `220-RESEARCH.md` §F-ID and Migration Slot Allocation — Q-3 path-A resolution; slot collision analysis [VERIFIED]
- `220-01-PLAN.md` frontmatter — migration slots 90-97 locked for P220 [VERIFIED]
- `218-01-PLAN.md` frontmatter — migration_slots: [101], F-IDs F-238..F-246 locked for P218 [VERIFIED]
- `218-RESEARCH.md` §F-ID (commit bf0205b) — slot collision history, corrected slot table, Q-7 analysis [VERIFIED]
- `218-REVIEWS.md` — Q-7 collision documentation; P219 slot 85-89 invalid finding [VERIFIED]
- `217-CONTEXT.md` — SaaSMRRSnapshot + MRR waterfall in P217 required phase shape [VERIFIED]
- `217-REVIEWS.md` — SAS-09 owned by P217 (Plan 01); SG-10 = P218/P219/P220 territory [VERIFIED]
- `219-REVIEWS.md` — 1 HIGH + 7 MEDIUM + 2 LOW concerns; T0-04 query surfaced here [VERIFIED]

### Tertiary (LOW confidence — see Assumptions Log)

- P217 exact table name `saas_mrr_snapshots` — inferred from 217-CONTEXT.md + 218-01-PLAN.md REQUIRED_TABLES list; P217 plans are stubs [LOW: A8]
- P222 buying_committee_members naming — inferred from ROADMAP; P222 plans are stubs [LOW: A5]
- npm test runner exact command — assumed from P220 confirmed pattern [LOW: A1]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all helpers verified on disk; codebase patterns confirmed; P218 contract verified in 218-01-PLAN.md
- Architecture: HIGH — mirrors P220 gold standard; codebase-grounded; P218 mode-eligibility contract confirmed
- Domain schemas: HIGH — derived from doc 17 TypeScript interfaces (canonical intake source)
- F-ID/Migration slots: HIGH — collision resolved; P218 slots confirmed in 218-01-PLAN.md; P219 takes 107-111
- Cross-phase coordination: HIGH — P217/P218/P220 contracts verified from planning artifacts
- Pitfalls: HIGH — sourced from P220 review lessons (P226 RH5/RH6) and P223 D-45/D-50/D-51 patterns

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stable domain — 30-day validity)

---

## RESEARCH COMPLETE

**Changes vs commit 813008a:**
- Migration slots updated: 85-89 (invalid) → 107-111; full collision history table added (Q-7 RESOLVED)
- Upstream dependencies: P217 added as HARD (saas_mrr_snapshots); preflight script includes P217 table; total HARD = [P214, P215, P217, P218]
- New section: "P218 Contract Consumption" — module_mode_eligibility matrix for P219 modules, isModuleEligible runtime pattern, dual enforcement pattern
- New section: "P217 Contract Consumption" — saas_mrr_snapshots read-only contract, SAS-09 ownership affirmed as P217, consume-only grep guard
- Cross-phase coordination: Q-5 (SAS-09/P217) added as RESOLVED; Q-6 (P218↔P220 collision) noted OUT OF SCOPE; Q-7 updated from OPEN to RESOLVED with full slot history
- Domain 2: expansion signal scanner updated to include saas_mrr_snapshots read + mrr_expansion_detected trigger signal + consume test
- Domain 3: mode eligibility gate (b2c blocked) added to ABM INSERT trigger spec + new mode-eligibility-gate test
- Plan 219-06: agent registry naming disambiguation table added; b2b_growth_agent_readiness confirmed distinct from P217 sas_agent_readiness, P218 plg_growth_agent_readiness, P220 growth_agent_readiness
- Assumption A8 + A9 added (P217 table name; mode-eligibility.ts export)
- helper-presence test: mode-eligibility.ts P218 upstream guard added
- Wave 0 preflight script: hard upstream table list expanded to include saas_mrr_snapshots + module_mode_eligibility
