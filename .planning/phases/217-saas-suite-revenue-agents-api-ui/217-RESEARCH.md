# Phase 217: SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness — Research

**Researched:** 2026-04-26
**Domain:** SaaS Suite — revenue intelligence (MRR/ARR/NRR/GRR/churn/expansion/cohorts/forecast), SAS agent registry (SAS-01..06), `/v1/saas/*` API contracts, `markos-saas` MCP tool family, SaaS UI navigation + activation gate, post-217 growth translation gate
**Confidence:** HIGH for codebase-grounded claims and canon-derived schema shapes, HIGH for architecture-lock (verified on disk), HIGH for F-ID/migration slot sequencing (P218 locked 101-106, P219 locked 107-111, P220 locked 90-95+97 — P217 takes 98-100), MEDIUM for exact revenue formula edge cases (reconciliation operator configurations), LOW for SAS agent readiness flag count until P217 plan confirms count
**Replaces:** 67-line stub (codebase addendum 2026-04-23 preserved and expanded)

---

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support | Owns / Integrates |
|----|------------------------------------------------|------------------|-------------------|
| SAS-09 | SaaS product usage and revenue intelligence expose MRR, ARR, NRR, GRR, churn, expansion, cohorts, forecast, product adoption, and PLG signals as tasks, alerts, or decisions | §7 Domains 1–2 — revenue metric formulas + `saas_mrr_snapshots` table | OWNS |
| SAS-10 | SAS agents, `/v1/saas/*` APIs, `markos-saas` MCP tools, and SaaS UI navigation are tenant-scoped, activation-gated, auditable, cost-visible, and contract-ID fresh | §7 Domains 3–6 — agent registry + API + MCP + UI nav | OWNS |
| MCP-01 | MCP server, sessions, tools, OAuth, cost/budget controls, and marketplace readiness remain tenant-safe | §7 Domain 5 — `lib/markos/mcp/tools/saas.cjs` registered in `index.cjs` | OWNS (Plan 05) |
| API-01 | Public OpenAPI, generated SDKs, and API contracts remain current | §7 Domain 4 — `/v1/saas/*` handlers + F-IDs F-247..F-258 + `contracts/openapi.json` regen | OWNS (Plan 04) |
| LOOP-01 | MarkOS proves the complete `onboard → connect → audit → plan → brief → draft → audit → approve → dispatch → measure → learn` loop | §7 Domains 1–2 — revenue intelligence completes the measure dimension of the loop | OWNS (revenue measure axis; LOOP primary owner = P211) |
| LOOP-02 | Briefs include performance targets | §7 Domain 1 — MRR/ARR/NRR targets feed brief context | INTEGRATES (P211 owns) |
| LOOP-03 | Drafts audited for channel fit | INTEGRATES — out of P217 scope | INTEGRATES (P211 owns) |
| LOOP-04 | Dispatch only after approval | INTEGRATES — approval substrate from P208 | INTEGRATES (P208 owns) |
| LOOP-05 | Social signals tied to revenue signals | §7 Domain 2 — MRR snapshot provides the revenue signal that social activity ties to | INTEGRATES (P211 owns social; P217 owns revenue) |
| LOOP-06 | Revenue modules connect campaign/content/social activity to CRM or pipeline evidence | §7 Domain 2 — MRR waterfall + expansion signals provide pipeline evidence; LOOP-06 primary = P219 | INTEGRATES (P219 owns RevenueTeamConfig; P217 provides the MRR signal P219 reads) |
| LOOP-07 | Weekly Narrative ties outcomes to pipeline or leading indicators | §7 Domain 2 — MRR snapshot feeds SAS-02 weekly narrative | INTEGRATES (P211 owns narrative; P217 provides the MRR facts) |
| LOOP-08 | Measurement updates artifact performance and next-task recommendations | §7 Domain 1 — revenue metrics update performance context | INTEGRATES (P211 primary; P217 provides revenue dimension) |
| QA-01..15 | Phase 200 Quality Baseline gates apply to all phases | §9 Validation Architecture — per-domain test strategy | OWNS (cross-domain) |

**LOOP ownership note:** REQUIREMENTS.md line 220 maps `LOOP-01..08 | Phase 211`. P217 INTEGRATES the revenue dimension of LOOP-01, LOOP-05, LOOP-06, LOOP-07, and LOOP-08 — it ships the `saas_mrr_snapshots` table and revenue intelligence that downstream LOOP phases consume. P217 Plan 01 frontmatter must use `integrates_with: [LOOP-01, LOOP-05, LOOP-06..08 from P211/P219]` not `requirements:` for LOOP IDs not owned by P217. LOOP-06 primary owner = P219 (RevenueTeamConfig SLA feedback loops). LOOP-08 = P211 (measurement updates). P217 OWNS the revenue facts, not the loop orchestration.

**SG-01..12 ownership note:** REQUIREMENTS.md lines 227-230 map SG-01..12 to P218/P219/P220. P217 Plan 06 documents the post-217 translation gate for these modules (planning-only; nothing activates) and must use `translation_gate_for: [P218, P219, P220]` not `requirements:` for SG IDs. SG-10 specifically is P218/P219/P220 P06 territory — Plan 03 must NOT list SG-10 in requirements (Plan 03 owns SAS-10 only).
</phase_requirements>

---

## Executive Summary

Phase 217 is the **API/MCP/UI surface layer** of the v4.1.0 SaaS milestone. It is the upstream gate for P218, P219, and P220. Those three phases all hard-depend on P217's `saas_mrr_snapshots` table (verified in 218-01-PLAN.md REQUIRED_UPSTREAM and 219-01-PLAN.md REQUIRED_UPSTREAM): P218 reads it for mode-eligibility gate signals; P219 Plan 02 expansion-signal-scanner reads it for MRR/NRR uptick detection.

P217 covers six domains: (1) revenue metric definitions and source precedence, (2) `saas_mrr_snapshots` table and MRR waterfall, (3) SAS agent readiness registry (SAS-01..06, SAS-10 invariant), (4) `/v1/saas/*` API contracts, (5) `markos-saas` MCP tool family, and (6) SaaS UI navigation with activation gate and post-217 growth translation gate.

**Three architectural decisions distinguish P217 from P218/P219/P220:**

First, P217 ships the only API surface in this milestone that creates new `/v1/saas/*` endpoints under `api/v1/saas/`. P218/P219 create `/v1/growth/*` and `/v1/b2b/*`; P220 creates additional `/v1/growth/*`. P217's API surface must use `api/v1/saas/` file layout, not `api/saas/` (the HTTP Layer reference uses `/api/saas/*` in gap overlay — the correct path pattern matching existing conventions is `api/v1/saas/`).

Second, P217 ships `lib/markos/mcp/tools/saas.cjs` registered in `lib/markos/mcp/tools/index.cjs`. This is the first phase to add a domain-specific MCP tool family file (`saas.cjs`). The MCP tool registry pattern (verified at `lib/markos/mcp/tools/index.cjs`) uses CommonJS; new tools must follow the same ToolDescriptor shape.

Third, P217 Plan 06 ships SaaS UI navigation routes under `app/(markos)/saas/`. The activation gate reads `saas_suite_activations.active` from P214 substrate — NOT a new activation mechanism. Plan 06 also ships the post-217 growth translation gate document (`saas_nav_visibility` table + `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger), which records all 12 SG growth module namespaces as `planned_only = true` entries until P218/P219/P220 execute.

**Migration slot allocation (P217 = slots 98-100):** Slots 82-89 are occupied by existing foundation migrations; slot 90-95+97 are P220-locked; slot 96 is existing `neuro_literacy_metadata`; slot 100 is existing `crm_schema_identity_graph_hardening`; slots 101-106 are P218-locked; slots 107-111 are P219-locked. The only free slots upstream of P218 are **98 and 99**. P217 needs 3 schema clusters: revenue metrics + MRR snapshots (slot 98), SAS agent registry (slot 99), and SaaS nav visibility (slot 98b additive or a narrow slot 99b). Recommended allocation: slot 98 = revenue metric + MRR snapshot + nav visibility tables (combined); slot 99 = SAS agent readiness table. Maximum 2 slots available without displacing P220.

**F-ID allocation (P217 = F-247..F-258):** P220 locked F-209..F-227; P219 locked F-228..F-237; P218 locked F-238..F-246 (confirmed from 218-01-PLAN.md). P217 takes F-247..F-258 (12 IDs for ~10 contracts — see §6). This non-monotonic ordering is cosmetic (F-IDs are not constraint-bearing per P220 Q-3 path-A precedent).

**Primary recommendation:** Ship P217 as 6 plan clusters with Plan 01 being foundational (ships the assertUpstreamReady + architecture-lock infrastructure used by all 6 plans, the revenue metric definitions, and the source precedence model) and Plan 02 being the most P218/P219 critical (ships `saas_mrr_snapshots` table that downstream phases hard-gate on).

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

Per `217-CONTEXT.md` non-negotiables (5 items — verbatim):

1. No unscoped SaaS API or MCP tool outside tenant auth/RLS/audit.
2. No SAS agent without stable token, role, inputs, outputs, cost, approval posture, and failure behavior.
3. No SaaS navigation for inactive or non-SaaS tenants.
4. No revenue metric without definition, source, timestamp, and reconciliation state.
5. No PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, or REV target agent becomes runnable without a future GSD phase assigning contracts, costs, approvals, tests, and surfaces.

Per DISCUSS.md locked decisions:

- Revenue dashboard: MRR/ARR/churn first, NRR/GRR/cohorts/forecast next (phased)
- SAS agents: runnable only after AgentRun/task/approval contracts are ready (currently `planned` status in agent files)
- API shape: resource families under `/v1/saas/*`
- MCP shape: new logical `markos-saas` tool family with shared auth/session substrate
- UI navigation: SaaS sidebar section gated by `saas_suite_activations.active`
- Growth target agents: defer runnable status; reserve post-217 translation gate

### Claude's Discretion

- Revenue formula edge cases (partial-period proration, refund handling, contraction calculation)
- MRR waterfall column granularity
- SAS agent readiness flag count and column names
- API endpoint enumeration beyond the 8 canon-listed paths
- MCP tool enumeration (canon lists 7; research recommends expanding to 10)
- `saas_nav_visibility` table structure
- Migration slot combination strategy (98 = combined tables vs separate 98+99)

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of `/v1/saas/*` — kept on legacy `api/*.js` (architecture-lock)
- Real-time billing webhook processing (Stripe events) — deferred to P215 substrate
- DIAN/Colombia compliance in P217 — P215 owns compliance layer; P217 API surfaces must not bypass it
- G2/Capterra pricing sync — P220 owns
- Actual PLG/EXP/ABM/VRL/IAM/CMT/EVT/XP/PR/PRT/DEV/REV agent activation — deferred to P218/P219/P220

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions. Any plan that contradicts these must stop and flag per drift rule.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Suite Canon.md` defines the SAS agent tier (SAS-01..06), the target API families (`/v1/saas/*`), the target MCP tools, the target UI navigation, and the revenue intelligence object (`SaaSMRRSnapshot`). P217 schema and policy MUST match this canon.
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` line 52 defines `SaaSMRRSnapshot: SaaS revenue intelligence record — MRR, ARR, NRR, GRR, churn, expansion, contraction, cohort, forecast`. P217 column shapes MUST match this spec.
3. **Engineering execution state wins:** `.planning/STATE.md` shows Phase 204 active; P217 plans MUST NOT execute before P214-P216 land.
4. **Drift rule:** If P217 plans define schema that contradicts vault brain/reference, STOP and flag.

### Placeholder rule (MUST)

`{{MARKOS_PRICING_ENGINE_PENDING}}` is required wherever revenue metric definitions or SAS agent cost posture references pricing decisions before an approved `PricingRecommendation` exists.

### CLI / tests (MUST)

- Run tests with `npm test` or `node --test test/**/*.test.js` — NO vitest, NO playwright. [VERIFIED: package.json]
- Test files: `.test.js` extension and `node:test` + `node:assert/strict` imports.
- Test fixtures: `.js` (NOT `.ts`).

---

## Architecture Lock

This section MUST be verified in Plan 217-01 Task 0.5 (first task in Wave 1 — matching P218/P219/P220 architecture-lock model).

### Pin Table

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/v1/saas/*.js` flat handlers (new `api/v1/` directory; P217 creates it) | P220 uses `api/v1/growth/*.js` — P217 mirrors pattern [ASSUMED: matches P220 confirmed] |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| OpenAPI registry | `contracts/openapi.json` | Filesystem confirmed [VERIFIED: codebase] |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS, NOT `.ts`) | Filesystem confirmed [VERIFIED: codebase] |
| MCP saas tool file | `lib/markos/mcp/tools/saas.cjs` (NEW — shipped by P217 Plan 05) | Does NOT exist yet; Plan 05 creates it [VERIFIED: codebase] |
| Test runner | `npm test` → `node --test test/**/*.test.js` | package.json [VERIFIED: codebase] |
| Test imports | `node:test` + `node:assert/strict` | Architecture-lock carry-forward P218-P228 |
| Test extension | `*.test.js` (NOT `.test.ts`) | Architecture-lock carry-forward |
| Cron auth | `x-markos-cron-secret` header matching `MARKOS_SAAS_CRON_SECRET` env | `api/cron/mcp-kpi-digest.js` pattern [VERIFIED: codebase] |
| Cron response | `{ success: boolean, count: number, duration_ms: number }` JSON | Same pattern [VERIFIED: codebase] |
| Audit emit | `lib/markos/audit/*` (SHA-256 hash chain per migration 82) | Filesystem [VERIFIED: codebase] |
| Tombstone | `lib/markos/governance/*` deletion workflow (migration 56) | Filesystem [VERIFIED: codebase] |
| App Router | `app/(markos)/saas/*` pages for UI — existing App Router pattern | HTTP Layer reference + existing `app/(markos)/` layout [VERIFIED: codebase] |
| DB-trigger auth | `BEFORE INSERT OR UPDATE` triggers per domain (NOT app-only enforcement) | P226 RH5/RH6 lesson; P218/P219/P220 pattern |
| `api/v1/` directory | Does NOT exist on disk — P217 Plan 04 creates it | [VERIFIED: codebase — `ls api/` shows no v1/] |

### Helper File Presence Verification Table

| File | Function | Status | Line |
|------|----------|--------|------|
| `onboarding/backend/runtime-context.cjs` | `requireHostedSupabaseAuth(...)` | EXISTS [VERIFIED: codebase] | 491 |
| `onboarding/backend/runtime-context.cjs` | `module.exports = { requireHostedSupabaseAuth, ... }` | EXISTS [VERIFIED: codebase] | 1014 |
| `lib/markos/crm/agent-actions.ts` | `function buildApprovalPackage(input)` | EXISTS [VERIFIED: codebase] | 68 |
| `lib/markos/crm/agent-actions.ts` | `module.exports = { buildApprovalPackage, ... }` | EXISTS [VERIFIED: codebase] | 133 |
| `lib/markos/plugins/registry.js` | `resolvePlugin(registry, pluginId)` | EXISTS [VERIFIED: codebase] | 102 |
| `lib/markos/mcp/tools/index.cjs` | MCP tool family registry (CommonJS) | EXISTS [VERIFIED: codebase] | — |
| `contracts/openapi.json` | Active OpenAPI 3.1 spec | EXISTS [VERIFIED: codebase] | — |
| `lib/markos/mcp/tools/saas.cjs` | SaaS MCP tool family | DOES NOT EXIST — Plan 05 creates | — |
| `api/v1/saas/` | `/v1/saas/*` API handler directory | DOES NOT EXIST — Plan 04 creates | — |
| `lib/markos/runtime-context.cjs` | (wrong path — do NOT reference) | NOT FOUND [VERIFIED: codebase] | Use `onboarding/backend/runtime-context.cjs` |

### Forbidden Patterns

Architecture-lock test asserts grep count = 0 across all P217 lib/api paths:

```text
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/profile/        (P218 ships this)
lib/markos/b2b/            (P219 ships this)
lib/markos/referral/       (P220 ships this)
lib/markos/community/      (P220 ships this)
lib/markos/events/         (P220 ships this)
lib/markos/pr/             (P220 ships this)
lib/markos/partnerships/   (P220 ships this)
lib/markos/sales/          (P226 ships this)
lib/markos/cdp/            (P221 ships this)
lib/markos/conversion/     (P224 ships this)
lib/markos/launches/       (P224 ships this)
lib/markos/analytics/      (P225 ships this)
lib/markos/channels/       (P223 ships this)
lib/markos/ecosystem/      (P227 ships this)
public/openapi.json
app/(saas)/
app/(growth)/
route.ts
vitest
playwright
openapi-generate
.test.ts
```

The architecture-lock test (`test/saas-217/preflight/architecture-lock.test.js`) ships in Plan 217-01 Task 0.5.

---

## Upstream Dependencies (assertUpstreamReady Gate)

### Hard Upstreams (P217 MUST fail preflight if these tables are missing)

| Phase | Table(s) to Check | Why P217 Needs It | Hard / Soft |
|-------|------------------|-------------------|-------------|
| P202 | `mcp_sessions`, `mcp_cost_window` | MCP tenant-bound sessions + cost/budget substrate — P217 Plan 05 MCP tools build on this | HARD |
| P208 | `agent_approval_packages` | Approval substrate — SAS agents and SaaS API mutations use `buildApprovalPackage` | HARD |
| P214 | `saas_suite_activations` | SaaSSuiteActivation — only `business_type = saas` tenants see SaaS UI/API/MCP | HARD |
| P215 | `billing_periods`, `tenant_billing_subscriptions` | Billing engine — subscription and invoice API endpoints delegate to P215 data layer | HARD |
| P216 | `saas_health_scores` | Health scores — SAS-04 Churn Risk Assessor inputs; `/v1/saas/health` endpoint reads this | HARD |

**Note on P205/P207/P209/P210/P211/P212/P213:** These are SOFT dependencies — degrade gracefully with sentinel or stub.

**Note on P207-P213 generally:** ROADMAP says "Depends on: Phases 202, 205, 207-216." However the genuine HARD gate is narrower: P217 needs the MCP substrate (P202), approval substrate (P208), and SaaS Suite data layer (P214-P216). The remaining phases (P207 AgentRun, P209 Evidence, P210 Connectors, P211 Loop, P212 Learning, P213 Tenant 0) are SOFT — P217 ships the agent registry as `runnable=false` regardless of whether P207 has landed.

### Soft Upstreams (degrade gracefully)

| Phase | Why Optional | Fallback |
|-------|-------------|----------|
| P205 | Pricing Engine — SaaS plan prices in API responses | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; log warning |
| P207 | AgentRun v2 — SAS agents emit AgentRun records when activated | SAS agents remain `runnable=false` in registry; no AgentRun emitted |
| P209 | EvidenceMap — revenue metric evidence_refs | Soft warn if evidence_refs absent; upgrade once P209 ships |
| P210 | ConnectorInstall — Stripe/Mercado Pago/QuickBooks connectors | MRR snapshot cron degrades gracefully; reads what billing tables contain |
| P211 | Loop substrate — revenue signals feed loop measurement | Revenue metrics stored; loop integration deferred |
| P212 | LRN substrate | Not consumed by P217 |
| P213 | Tenant 0 | Not consumed by P217 |

### Preflight Script Pattern

```cjs
// scripts/preconditions/217-01-check-upstream.cjs
'use strict';
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_TABLES = [
  'mcp_sessions',                    // P202 HARD prereq — MCP substrate
  'saas_suite_activations',          // P214 HARD prereq — SaaS activation gate
  'tenant_billing_subscriptions',    // P215 HARD prereq — billing data
  'saas_health_scores',              // P216 HARD prereq — health/churn signals
];
const SOFT_TABLES = [
  'pricing_recommendations',         // P205 soft prereq
  'markos_agent_runs',               // P207 soft prereq
  'evidence_map_records',            // P209 soft prereq
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P217). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — sentinel or stub)`);
    }
  }
  console.log('P217 upstream preflight: PASSED');
}
main().catch((e) => { console.error(e); process.exit(2); });
```

Each of Plans 01-06 ships its own `scripts/preconditions/217-NN-check-upstream.cjs`.

---

## F-ID and Migration Slot Allocation

### CRITICAL: Slot Inventory (Verified 2026-04-26)

[VERIFIED: codebase — `ls supabase/migrations/`]

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
| 90–95, 97 | RESERVED — P220 (locked in 220-01-PLAN.md frontmatter) | P220 |
| 96 | `96_neuro_literacy_metadata.sql` | Existing |
| **98** | **UNOCCUPIED** | **Available — P217 primary slot** |
| **99** | **UNOCCUPIED** | **Available — P217 secondary slot** |
| 100 | `100_crm_schema_identity_graph_hardening.sql` | Existing |
| 101–106 | RESERVED — P218 (locked in 218-01-PLAN.md) | P218 |
| 107–111 | RESERVED — P219 (locked in 219-01-PLAN.md) | P219 |
| 112+ | UNOCCUPIED | Available for P219 Plan 06 overflow / P222+ |

**P217 allocation: slots 98 and 99 only.** These are the only unoccupied slots upstream of P218 (101+) that are not existing migrations. P217 must fit all schema into 2 migration files. Strategy: slot 98 = revenue metric definitions + `saas_mrr_snapshots` + `saas_nav_visibility` (3 tables, combined); slot 99 = `sas_agent_readiness` table.

**Why P217 schema must precede P218 at 101:** P218-01-PLAN.md REQUIRED_UPSTREAM includes `saas_mrr_snapshots` (P217). Supabase applies migrations by filename sort (numeric prefix determines order). `98_*.sql` applies before `101_*.sql`. This satisfies the dependency ordering without requiring slot coordination beyond the 98-99 assignment.

**V4.1.0-MIGRATION-SLOT-COORDINATION.md:** This file does NOT exist on disk yet. P218 Plan 01 Task 0.1 CREATES it. P217 Plan 01 Task 0.1 must CREATE-OR-APPEND (guard against absence when P218 has not yet executed). P217's section in the doc: `P217 reservation: slots 98-99 + F-IDs F-247..F-258`.

### F-ID Pre-Allocation Table

F-IDs F-209..F-227 locked by P220; F-228..F-237 locked by P219; F-238..F-246 locked by P218. [VERIFIED: 218-01-PLAN.md, 219-RESEARCH.md, 220-RESEARCH.md]

**P217 takes F-247..F-258 (12 IDs).**

| Plan | Domain | Migration Slot | Table(s) Created | F-IDs | Downstream Consumers |
|------|--------|---------------|------------------|-------|----------------------|
| 217-01 | Revenue metric definitions + source precedence | 98 (combined) | `saas_revenue_metric_definitions` | F-247 | P218 read (SAS-09 signals) |
| 217-02 | MRR snapshots + waterfall | 98 (combined) | `saas_mrr_snapshots`, `saas_mrr_waterfall_entries` | F-248, F-249 | P218 HARD, P219 Plan 02 HARD |
| 217-03 | SAS agent readiness registry | 99 | `sas_agent_readiness` | F-250 | P218/P219/P220 reference |
| 217-04 (01) | `/v1/saas/subscriptions` + `/v1/saas/plans` | no new table (reads P214/P215) | — | F-251 | P218/P219 extension |
| 217-04 (02) | `/v1/saas/invoices` + `/v1/saas/health` | no new table (reads P215/P216) | — | F-252 | — |
| 217-04 (03) | `/v1/saas/metrics/*` (mrr/nrr/grr/expansion/cohorts) | reads `saas_mrr_snapshots` | — | F-253 | P218/P219 consumption |
| 217-04 (04) | `/v1/saas/agents` + `/v1/saas/tasks` + `/v1/saas/approvals` | reads `sas_agent_readiness` | — | F-254 | — |
| 217-05 | `markos-saas` MCP tool family | no new table | — | F-255 | P218/P219/P220 MCP tools extend |
| 217-06 (01) | SaaS UI nav + activation gate | 98 (combined) | `saas_nav_visibility` | F-256 | P218/P219/P220 Plan 06 extend |
| 217-06 (02) | Post-217 translation gate contract | no new table | — | F-257 | P218/P219/P220 translation gate |
| 217-01 | Architecture-lock + assertUpstreamReady contract | no new table | — | F-258 | P217 internal preflight |

**Total: 12 F-IDs (F-247..F-258). 3 migration slots needed across 2 files (slot 98 combined; slot 99 dedicated).**

---

## Per-Domain Deep Dive

### Domain 1: Revenue Metric Definitions and Source Precedence (Plan 217-01)

**Requirements:** SAS-09, QA-01..15; integrates_with: LOOP-01, LOOP-06 (P219 owns LOOP-06 orchestration)

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` — Revenue Intelligence module: "MRR, ARR, NRR, GRR, churn, expansion, cohorts, forecast, waterfall"

#### Revenue Metric Formula Table

| Metric | Formula | Unit | Period | Source Precedence |
|--------|---------|------|--------|-------------------|
| MRR | Sum of (monthly normalized recurring revenue per active subscription) | currency/month | Month-end snapshot | Billing engine (P215) > accounting sync > manual correction |
| ARR | `MRR × 12` | currency/year | Trailing 12-month annualized | Derived from MRR |
| New MRR | Sum of MRR from subscriptions started within period | currency/month | Period delta | Billing new subscription events |
| Expansion MRR | Sum of MRR increase from existing subscriptions (upgrades, seat adds) | currency/month | Period delta | Billing upgrade events |
| Contraction MRR | Sum of MRR decrease from existing subscriptions (downgrades, seat reductions) | currency/month | Period delta | Billing downgrade events (negative) |
| Churn MRR | Sum of MRR from subscriptions canceled/churned within period | currency/month | Period delta | Billing cancellation events (negative) |
| Reactivation MRR | Sum of MRR from subscriptions reactivated within period | currency/month | Period delta | Billing reactivation events |
| Net New MRR | `New MRR + Expansion MRR − Contraction MRR − Churn MRR + Reactivation MRR` | currency/month | Period waterfall | Derived waterfall |
| NRR | `((MRR_start + Expansion MRR − Contraction MRR − Churn MRR) / MRR_start) × 100` | percentage | Trailing 12-month | Derived from MRR waterfall |
| GRR | `((MRR_start − Contraction MRR − Churn MRR) / MRR_start) × 100` | percentage | Trailing 12-month | Derived from MRR waterfall (no expansion) |
| Churn Rate (logo) | `Churned customers / Customers at period start × 100` | percentage | Monthly | Billing cancellation events |
| Churn Rate (revenue) | `Churn MRR / MRR_start × 100` | percentage | Monthly | MRR waterfall |
| LTV | `ARPU / Churn Rate (monthly)` | currency | Snapshot | Derived |
| Cohort Retention | MRR retained per acquisition cohort at T+1, T+3, T+6, T+12 months | percentage | Cohort-relative | Subscription history |
| Forecast (linear) | 3-month linear extrapolation from trailing 6-month MRR trend | currency/month | Forward-looking | Derived from MRR snapshot history |

#### Source Precedence Model

When billing (P215), payment processor (Stripe/Mercado Pago webhook), accounting sync (QuickBooks/Siigo/Alegra), CRM subscription record, and manual correction disagree:

| Priority | Source | Trust Level | Reconciliation State |
|----------|--------|-------------|----------------------|
| 1 | Billing engine (P215 `tenant_billing_subscriptions`) | Authoritative for lifecycle | `reconciled` |
| 2 | Processor webhook (signed Stripe/Mercado Pago event) | Authoritative for payment facts | `reconciled` if matches billing |
| 3 | Accounting sync (QuickBooks/Siigo/Alegra export) | Authoritative for legal invoice facts | `reconciled` if within tolerance |
| 4 | CRM subscription record | Informational | `pending_reconciliation` |
| 5 | Manual correction (operator-entered) | Override — requires approval | `manually_corrected` |

**Reconciliation state ENUM:** `reconciled | pending_reconciliation | conflict_flagged | manually_corrected | excluded`

A `conflict_flagged` state creates a P1 task (revenue-critical, blocks accounting completion) until an operator resolves via approval gate.

#### `saas_revenue_metric_definitions` Table Schema

```sql
-- Migration: 98_saas_revenue_intelligence.sql (combined with MRR + nav tables)
CREATE TABLE saas_revenue_metric_definitions (
  metric_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  metric_key            text NOT NULL CHECK (metric_key IN (
    'mrr', 'arr', 'new_mrr', 'expansion_mrr', 'contraction_mrr',
    'churn_mrr', 'reactivation_mrr', 'net_new_mrr',
    'nrr', 'grr', 'churn_rate_logo', 'churn_rate_revenue',
    'ltv', 'cohort_retention', 'forecast_3m'
  )),
  formula_description   text NOT NULL,       -- human-readable formula
  formula_sql_fragment  text,                -- optional: SQL template for materialization
  source_precedence     text[] NOT NULL,     -- ordered source keys
  reconciliation_tolerance_pct numeric(5,2) DEFAULT 0.5,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, metric_key)
);
ALTER TABLE saas_revenue_metric_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY srmd_tenant_isolation ON saas_revenue_metric_definitions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

**DB-trigger compliance — `REVENUE_METRIC_REQUIRES_PROVENANCE`:**

```sql
CREATE OR REPLACE FUNCTION enforce_revenue_metric_provenance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.formula_description IS NULL OR trim(NEW.formula_description) = '' THEN
    RAISE EXCEPTION 'REVENUE_METRIC_REQUIRES_PROVENANCE: metric_key=% must have formula_description', NEW.metric_key;
  END IF;
  IF array_length(NEW.source_precedence, 1) IS NULL OR array_length(NEW.source_precedence, 1) = 0 THEN
    RAISE EXCEPTION 'REVENUE_METRIC_REQUIRES_PROVENANCE: metric_key=% must have at least one source in source_precedence', NEW.metric_key;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_revenue_metric_provenance
  BEFORE INSERT OR UPDATE ON saas_revenue_metric_definitions
  FOR EACH ROW EXECUTE FUNCTION enforce_revenue_metric_provenance();
```

**API surface:**

- `GET /v1/saas/metrics/definitions` — list all metric definitions for tenant (F-247)
- `POST /v1/saas/metrics/definitions` — create/update metric definition (requires `manage_saas` role)

**Plan 01 also ships:**
- Wave 0.5: architecture-lock test (`test/saas-217/preflight/architecture-lock.test.js`)
- Wave 0.5: assertUpstreamReady preflight (`scripts/preconditions/217-01-check-upstream.cjs`)
- CREATE-OR-APPEND: `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (P217 = slots 98-99, F-247..F-258)

---

### Domain 2: `saas_mrr_snapshots` and Revenue Intelligence Records (Plan 217-02)

**Requirements:** SAS-09, QA-01..15; consumed_by: P218 Plan 01 (mode eligibility gate), P219 Plan 02 (expansion-signal-scanner)

**Canon source:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` line 52: `SaaSMRRSnapshot: SaaS revenue intelligence record — MRR, ARR, NRR, GRR, churn, expansion, contraction, cohort, forecast`

**Critical contract:** P218-01-PLAN.md and P219-01-PLAN.md both list `saas_mrr_snapshots` as REQUIRED_UPSTREAM table. The table name `saas_mrr_snapshots` is the locked contract. Any rename invalidates downstream phase preflight scripts.

#### `saas_mrr_snapshots` Table Schema

```sql
-- Migration: 98_saas_revenue_intelligence.sql (combined)
CREATE TABLE saas_mrr_snapshots (
  snapshot_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),

  -- Period
  snapshot_date           date NOT NULL,
  period_start            date NOT NULL,
  period_end              date NOT NULL,
  snapshot_type           text NOT NULL CHECK (snapshot_type IN ('nightly', 'monthly', 'manual')),

  -- MRR waterfall (all in tenant's primary currency)
  mrr_start               numeric(18,2) NOT NULL DEFAULT 0,
  new_mrr                 numeric(18,2) NOT NULL DEFAULT 0,
  expansion_mrr           numeric(18,2) NOT NULL DEFAULT 0,
  contraction_mrr         numeric(18,2) NOT NULL DEFAULT 0,  -- stored as negative
  churn_mrr               numeric(18,2) NOT NULL DEFAULT 0,  -- stored as negative
  reactivation_mrr        numeric(18,2) NOT NULL DEFAULT 0,
  net_new_mrr             numeric(18,2) GENERATED ALWAYS AS (
    new_mrr + expansion_mrr + contraction_mrr + churn_mrr + reactivation_mrr
  ) STORED,
  mrr_end                 numeric(18,2) GENERATED ALWAYS AS (
    mrr_start + new_mrr + expansion_mrr + contraction_mrr + churn_mrr + reactivation_mrr
  ) STORED,

  -- Derived metrics
  arr                     numeric(18,2) GENERATED ALWAYS AS (
    (mrr_start + new_mrr + expansion_mrr + contraction_mrr + churn_mrr + reactivation_mrr) * 12
  ) STORED,
  nrr_pct                 numeric(7,4),    -- computed post-insert by cron; nullable until reconciled
  grr_pct                 numeric(7,4),    -- computed post-insert by cron; nullable until reconciled
  churn_rate_logo_pct     numeric(7,4),
  churn_rate_revenue_pct  numeric(7,4),

  -- Customer counts
  active_subscriptions    int NOT NULL DEFAULT 0,
  new_subscriptions       int NOT NULL DEFAULT 0,
  churned_subscriptions   int NOT NULL DEFAULT 0,
  expansion_subscriptions int NOT NULL DEFAULT 0,
  reactivated_subscriptions int NOT NULL DEFAULT 0,

  -- Currency
  currency                text NOT NULL DEFAULT 'USD',  -- ISO 4217

  -- Reconciliation
  reconciliation_state    text NOT NULL CHECK (reconciliation_state IN (
    'pending', 'reconciled', 'conflict_flagged', 'manually_corrected', 'excluded'
  )) DEFAULT 'pending',
  reconciled_at           timestamptz,
  reconciled_by           uuid,
  source_billing_hash     text,           -- SHA-256 of billing table state used for this snapshot
  source_processor_hash   text,           -- SHA-256 of processor event state used

  -- Evidence
  evidence_refs           text[],          -- FK-like array to evidence_map_records if P209 exists

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, snapshot_date, snapshot_type)
);
ALTER TABLE saas_mrr_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY sms_tenant_isolation ON saas_mrr_snapshots
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_sms_tenant_date ON saas_mrr_snapshots(tenant_id, snapshot_date DESC);
CREATE INDEX idx_sms_reconciliation ON saas_mrr_snapshots(tenant_id, reconciliation_state);
```

**DB-trigger compliance — `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE`:**

```sql
CREATE OR REPLACE FUNCTION enforce_mrr_snapshot_reconciliation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- reconciliation_state column is NOT NULL with DEFAULT 'pending' — trigger validates no NULL bypass
  IF NEW.reconciliation_state IS NULL THEN
    RAISE EXCEPTION 'MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE: snapshot_id=% must have reconciliation_state set', NEW.snapshot_id;
  END IF;
  -- Prevent inserting a snapshot for a date that already has a reconciled snapshot (idempotency guard)
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM saas_mrr_snapshots
    WHERE tenant_id = NEW.tenant_id
      AND snapshot_date = NEW.snapshot_date
      AND snapshot_type = NEW.snapshot_type
      AND reconciliation_state = 'reconciled'
  ) THEN
    RAISE EXCEPTION 'MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE: a reconciled snapshot already exists for tenant=% date=% type=%', NEW.tenant_id, NEW.snapshot_date, NEW.snapshot_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mrr_snapshot_reconciliation
  BEFORE INSERT OR UPDATE ON saas_mrr_snapshots
  FOR EACH ROW EXECUTE FUNCTION enforce_mrr_snapshot_reconciliation();
```

#### `saas_mrr_waterfall_entries` Table Schema (line-item detail)

```sql
CREATE TABLE saas_mrr_waterfall_entries (
  entry_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id           uuid NOT NULL REFERENCES saas_mrr_snapshots(snapshot_id) ON DELETE CASCADE,
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  subscription_id       text NOT NULL,     -- FK text ref to P215 tenant_billing_subscriptions
  customer_id           uuid,              -- FK ref to CRM customer (P215 may not have FK yet)
  movement_type         text NOT NULL CHECK (movement_type IN (
    'new', 'expansion', 'contraction', 'churn', 'reactivation', 'unchanged'
  )),
  mrr_amount            numeric(18,2) NOT NULL,   -- positive for growth, negative for churn/contraction
  plan_id               text,
  seats_delta           int,
  reason                text,              -- upgrade/downgrade/churn reason code
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_mrr_waterfall_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY smwe_tenant_isolation ON saas_mrr_waterfall_entries
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_smwe_snapshot ON saas_mrr_waterfall_entries(snapshot_id);
CREATE INDEX idx_smwe_tenant_movement ON saas_mrr_waterfall_entries(tenant_id, movement_type);
```

#### Nightly MRR Snapshot Cron Handler

```text
api/cron/saas-mrr-snapshot.js
```

Pattern (mirrors `api/cron/mcp-kpi-digest.js`):
- Auth: `x-markos-cron-secret` / `MARKOS_SAAS_CRON_SECRET`
- Schedule: `0 2 * * *` (2am UTC nightly)
- Delegates to `lib/markos/saas/revenue/snapshot-builder.cjs`
- Response: `{ success: boolean, tenant_count: number, snapshot_ids: string[], duration_ms: number }`
- Reads from `tenant_billing_subscriptions` (P215 HARD) + `billing_usage_events` (P215)
- Writes `saas_mrr_snapshots` + `saas_mrr_waterfall_entries`
- If `reconciliation_state = 'conflict_flagged'` → calls `buildApprovalPackage` to create P1 task

**API surface (Plan 217-04 / Domain 2):**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/saas/metrics/mrr` | GET | Latest MRR snapshot for tenant | F-253 |
| `/v1/saas/metrics/nrr` | GET | NRR for trailing period | F-253 |
| `/v1/saas/metrics/grr` | GET | GRR for trailing period | F-253 |
| `/v1/saas/metrics/expansion` | GET | Expansion MRR breakdown | F-253 |
| `/v1/saas/metrics/cohorts` | GET | Cohort retention table | F-253 |
| `/v1/saas/metrics/forecast` | GET | 3-month linear forecast | F-253 |
| `/v1/saas/metrics/waterfall` | GET | MRR waterfall entries for period | F-253 |

All 7 metrics endpoints share F-253 (one contract family, multiple paths — matching P220 pattern for related endpoints).

---

### Domain 3: SAS Agent Readiness Registry (Plan 217-03)

**Requirements:** SAS-09, SAS-10, QA-01..15. Does NOT own SG-10 (P218/P219/P220 P06 own growth agent readiness).

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` — SAS Agent Tier table (6 agents)

**Agent file verification:** All 6 SAS agent definition files verified on disk under `.agent/markos/agents/`:
[VERIFIED: codebase]
- `markos-saas-billing-compliance-agent.md` (SAS-03)
- `markos-saas-churn-risk-assessor.md` (SAS-04)
- `markos-saas-expansion-revenue-scout.md` (SAS-06)
- `markos-saas-revenue-intelligence-analyst.md` (SAS-02)
- `markos-saas-subscription-lifecycle-manager.md` (SAS-01)
- `markos-saas-support-intelligence-agent.md` (SAS-05)

All 6 files have `status: planned` in frontmatter — they are registry/documentation artifacts, NOT runnable implementation truth.

#### SAS Agent Definitions (from canon + agent files)

| Token | Agent | Role | Approval Posture | Readiness Blockers |
|-------|-------|------|------------------|--------------------|
| `MARKOS-AGT-SAS-01` | Subscription Lifecycle Manager | lifecycle changes, renewal state, cancellation/reactivation | Approval required for external mutations | P214+P215+P207+P208+P217 |
| `MARKOS-AGT-SAS-02` | Revenue Intelligence Analyst | MRR/ARR/NRR/GRR/churn/expansion/forecast/waterfall | Read-only by default; outreach/pricing requires approval | P217 (saas_mrr_snapshots), P207 |
| `MARKOS-AGT-SAS-03` | Billing Compliance Agent | invoice compliance, DIAN/US billing, accounting sync | High-priority tasking; approval for corrections | P215+P207+P208 |
| `MARKOS-AGT-SAS-04` | Churn Risk Assessor | health score, churn risk, save/playbook recs | Approval for interventions/save offers | P216+P207+P208+P205(soft) |
| `MARKOS-AGT-SAS-05` | Support Intelligence Agent | ticket triage, KB grounding, suggested responses | CS review before customer-facing response | P216+P207+P208+P209(soft) |
| `MARKOS-AGT-SAS-06` | Expansion Revenue Scout | upgrade, seat expansion, cross-sell opportunities | Approval before outreach/pricing action | P217+P219(soft)+P207+P208 |

#### `sas_agent_readiness` Table Schema

**Non-collision note:** This table is named `sas_agent_readiness` (SAS prefix, P217-owned). It is distinct from: P218's `plg_growth_agent_readiness`, P219's `b2b_growth_agent_readiness`, and P220's `growth_agent_readiness`. [VERIFIED: 219-RESEARCH.md naming resolution note]

```sql
-- Migration: 99_sas_agent_readiness.sql
CREATE TABLE sas_agent_readiness (
  agent_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  agent_token           text NOT NULL CHECK (agent_token IN (
    'MARKOS-AGT-SAS-01', 'MARKOS-AGT-SAS-02', 'MARKOS-AGT-SAS-03',
    'MARKOS-AGT-SAS-04', 'MARKOS-AGT-SAS-05', 'MARKOS-AGT-SAS-06'
  )),
  agent_name            text NOT NULL,
  agent_domain          text NOT NULL DEFAULT 'SAS',

  -- 8-flag readiness gates (mirrors P218/P219/P220 P06 pattern)
  has_stable_token          boolean NOT NULL DEFAULT false,
  has_role_definition       boolean NOT NULL DEFAULT false,
  has_input_contract        boolean NOT NULL DEFAULT false,
  has_output_contract       boolean NOT NULL DEFAULT false,
  has_cost_posture          boolean NOT NULL DEFAULT false,
  has_approval_posture      boolean NOT NULL DEFAULT false,
  has_failure_behavior      boolean NOT NULL DEFAULT false,
  has_ui_api_mcp_surface    boolean NOT NULL DEFAULT false,

  -- Derived readiness gate (GENERATED ALWAYS — cannot be bypassed by app code)
  runnable                  boolean GENERATED ALWAYS AS (
    has_stable_token
    AND has_role_definition
    AND has_input_contract
    AND has_output_contract
    AND has_cost_posture
    AND has_approval_posture
    AND has_failure_behavior
    AND has_ui_api_mcp_surface
  ) STORED,

  -- Activation tracking
  activation_approval_id    uuid,          -- FK to approval package if activated
  readiness_check_id        uuid,          -- FK to evidence map record (P209 soft)
  readiness_notes           text,
  approved_at               timestamptz,
  approved_by               uuid,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, agent_token)
);
ALTER TABLE sas_agent_readiness ENABLE ROW LEVEL SECURITY;
CREATE POLICY sar_tenant_isolation ON sas_agent_readiness
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_sar_tenant_token ON sas_agent_readiness(tenant_id, agent_token);
CREATE INDEX idx_sar_runnable ON sas_agent_readiness(tenant_id, runnable);
```

**DB-trigger compliance — `SAS_AGENT_ACTIVATION_REQUIRES_READINESS`:**

```sql
CREATE OR REPLACE FUNCTION enforce_sas_agent_activation_readiness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Prevent directly setting runnable=true (it's a GENERATED column — this fires on all flag updates)
  -- The trigger blocks attempts to set all 8 flags true without an approval package
  IF (
    NEW.has_stable_token AND NEW.has_role_definition AND NEW.has_input_contract
    AND NEW.has_output_contract AND NEW.has_cost_posture AND NEW.has_approval_posture
    AND NEW.has_failure_behavior AND NEW.has_ui_api_mcp_surface
  ) AND NEW.activation_approval_id IS NULL THEN
    RAISE EXCEPTION 'SAS_AGENT_ACTIVATION_REQUIRES_READINESS: agent=% cannot be fully ready without activation_approval_id', NEW.agent_token;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_sas_agent_activation_readiness
  BEFORE INSERT OR UPDATE ON sas_agent_readiness
  FOR EACH ROW EXECUTE FUNCTION enforce_sas_agent_activation_readiness();
```

**Seed data (migration-time INSERT — all agents seeded with `runnable = false`):**

Plan 217-03 seeds the 6 SAS agents for each active SaaS tenant during migration via a DO-block that reads `saas_suite_activations` and inserts one row per agent per active tenant. All 8 readiness flags default `false` → `runnable GENERATED = false` guaranteed.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/saas/agents` | GET | List SAS agents with readiness flags | F-254 |
| `/v1/saas/agents/:token` | GET | Single agent detail + readiness state | F-254 |

---

### Domain 4: `/v1/saas/*` API Contracts (Plan 217-04)

**Requirements:** SAS-10, API-01, QA-01..15

**Architecture note:** `api/v1/` directory does NOT exist on disk. P217 Plan 04 creates `api/v1/saas/` as the first `/v1/*` namespace. All handlers follow the existing auth pattern from `onboarding/backend/runtime-context.cjs`.

#### Complete Endpoint Enumeration

| Endpoint | Method | Handler File | Purpose | F-ID | Auth |
|---------|--------|-------------|---------|------|------|
| `/v1/saas/subscriptions` | GET | `api/v1/saas/subscriptions.js` | List tenant subscriptions (reads P215) | F-251 | `requireHostedSupabaseAuth` |
| `/v1/saas/subscriptions/:id` | GET | `api/v1/saas/subscriptions.js` | Single subscription detail | F-251 | same |
| `/v1/saas/plans` | GET | `api/v1/saas/plans.js` | List tenant SaaS plans (reads P214/P215) | F-251 | same |
| `/v1/saas/plans/:id` | GET | `api/v1/saas/plans.js` | Single plan detail | F-251 | same |
| `/v1/saas/invoices` | GET | `api/v1/saas/invoices.js` | List invoices (reads P215) | F-252 | same |
| `/v1/saas/invoices/:id` | GET | `api/v1/saas/invoices.js` | Single invoice detail | F-252 | same |
| `/v1/saas/health` | GET | `api/v1/saas/health.js` | Tenant health score (reads P216) | F-252 | same |
| `/v1/saas/metrics/mrr` | GET | `api/v1/saas/metrics.js` | MRR snapshot (reads `saas_mrr_snapshots`) | F-253 | same |
| `/v1/saas/metrics/nrr` | GET | `api/v1/saas/metrics.js` | NRR for trailing 12m | F-253 | same |
| `/v1/saas/metrics/grr` | GET | `api/v1/saas/metrics.js` | GRR for trailing 12m | F-253 | same |
| `/v1/saas/metrics/expansion` | GET | `api/v1/saas/metrics.js` | Expansion MRR breakdown | F-253 | same |
| `/v1/saas/metrics/cohorts` | GET | `api/v1/saas/metrics.js` | Cohort retention table | F-253 | same |
| `/v1/saas/metrics/forecast` | GET | `api/v1/saas/metrics.js` | 3-month forecast | F-253 | same |
| `/v1/saas/metrics/waterfall` | GET | `api/v1/saas/metrics.js` | MRR waterfall detail | F-253 | same |
| `/v1/saas/agents` | GET | `api/v1/saas/agents.js` | SAS agent readiness list | F-254 | same |
| `/v1/saas/agents/:token` | GET | `api/v1/saas/agents.js` | Single agent readiness detail | F-254 | same |
| `/v1/saas/tasks` | GET | `api/v1/saas/tasks.js` | SaaS-scoped task queue | F-254 | same |
| `/v1/saas/approvals` | GET | `api/v1/saas/approvals.js` | SaaS-scoped approval queue | F-254 | same |

**Total: 18 endpoint paths across 7 handler files.** All are GET (read-only). Mutations (subscription changes, plan corrections, agent activation) remain in their owning phase handlers (P215 billing, P208 approvals) and are NOT duplicated in P217. P217's API surface is intelligence-read-only, matching the canon's "Revenue Intelligence: read-only analysis" posture.

**File structure:**

```text
api/v1/
└── saas/
    ├── subscriptions.js       # GET list + GET :id (delegates to P215 billing data)
    ├── plans.js               # GET list + GET :id (delegates to P214/P215 plan tables)
    ├── invoices.js            # GET list + GET :id (delegates to P215 invoice tables)
    ├── health.js              # GET (delegates to P216 saas_health_scores)
    ├── metrics.js             # GET mrr|nrr|grr|expansion|cohorts|forecast|waterfall
    ├── agents.js              # GET list + GET :token (reads sas_agent_readiness)
    ├── tasks.js               # GET (reads tasks scoped to saas domain — P208 substrate)
    └── approvals.js           # GET (reads approvals scoped to saas domain — P208 substrate)
```

**Handler pattern (all handlers):**

```js
// api/v1/saas/metrics.js
'use strict';
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const runtimeContext = createRuntimeContext();
  const auth = await requireHostedSupabaseAuth(req, runtimeContext, 'saas_metrics_read');
  if (!auth.ok) return writeJson(res, auth.status, { error: auth.error });

  const { tenant_id } = auth;
  // ... domain logic reading saas_mrr_snapshots
  writeJson(res, 200, result);
};
```

**DB-trigger compliance — `SAAS_API_REQUIRES_TENANT_AUTH_RLS_AUDIT`:**

This enforcement is an architecture-lock test (not a DB-trigger, since API contracts are file artifacts). The test `test/saas-217/preflight/architecture-lock.test.js` asserts:
- Every `api/v1/saas/*.js` file contains `requireHostedSupabaseAuth` call
- Every `api/v1/saas/*.js` file does NOT contain `requireSupabaseAuth`, `serviceRoleClient`, or `createApprovalPackage` (mutation guard — read-only surface)
- `contracts/openapi.json` contains all F-247..F-258 paths after `npm run openapi:build`

---

### Domain 5: `markos-saas` MCP Tool Family (Plan 217-05)

**Requirements:** SAS-10, MCP-01, QA-01..15

**Architecture note:** `lib/markos/mcp/tools/saas.cjs` does NOT exist on disk. [VERIFIED: codebase] Plan 217-05 creates it and registers it in `lib/markos/mcp/tools/index.cjs`. The tool family uses the same `ToolDescriptor` shape as the existing 30 tools in `index.cjs`.

#### MCP Tool Enumeration (10 tools)

| Tool Name | Latency Tier | Mutating | Purpose | Maps to API |
|-----------|-------------|----------|---------|-------------|
| `saas_get_mrr_summary` | simple | false | Latest MRR snapshot with waterfall and trend | `/v1/saas/metrics/mrr` |
| `saas_get_nrr_grr` | simple | false | NRR and GRR for trailing 12 months | `/v1/saas/metrics/nrr` + `/v1/saas/metrics/grr` |
| `saas_get_expansion_opportunities` | simple | false | Expansion MRR signals + account-level breakdown | `/v1/saas/metrics/expansion` |
| `saas_get_cohort_retention` | simple | false | Cohort retention table (T+1, T+3, T+6, T+12) | `/v1/saas/metrics/cohorts` |
| `saas_get_revenue_forecast` | simple | false | 3-month linear MRR forecast | `/v1/saas/metrics/forecast` |
| `saas_get_subscription_health` | simple | false | Subscription list with health score and churn risk | `/v1/saas/subscriptions` + `/v1/saas/health` |
| `saas_get_at_risk_accounts` | simple | false | Subscriptions with churn_risk = high or critical | `/v1/saas/health` + P216 |
| `saas_get_plan_performance` | simple | false | Plan-level MRR, subscriber count, churn by plan | `/v1/saas/plans` + `/v1/saas/metrics/mrr` |
| `saas_get_invoice_compliance_status` | simple | false | Invoices with compliance/DIAN/QuickBooks sync state | `/v1/saas/invoices` |
| `saas_get_agent_readiness` | simple | false | SAS agent readiness flags and runnable state | `/v1/saas/agents` |

**Note:** Canon lists 7 target MCP tools (`get_subscription_health`, `get_at_risk_accounts`, `get_mrr_summary`, `get_plan_performance`, `get_expansion_opportunities`, `get_support_patterns`, `get_invoice_compliance_status`). Research expands to 10 by: (a) adding `saas_get_nrr_grr`, `saas_get_cohort_retention`, `saas_get_revenue_forecast` (directly from SaaS Suite Canon revenue intelligence list), and (b) adding `saas_get_agent_readiness` (SAS-10 invariant visibility), (c) removing `get_support_patterns` (P216 owns support intelligence; P217 wraps metrics only — support patterns deferred to P216 MCP tools).

All 10 tools are `mutating: false` — P217 MCP surface is read-only. Mutations (agent activation, approval packages) require the human approval gate (P208) and will be surfaced through future SAS agent activation phases.

**`lib/markos/mcp/tools/saas.cjs` skeleton:**

```cjs
'use strict';
// Phase 217 Plan 05: 10 markos-saas MCP tool descriptors.
// All tools are read-only (mutating: false) — SaaS revenue intelligence surface.
// Registration: imported and spread into lib/markos/mcp/tools/index.cjs SAAS_TOOLS array.

const { COST_TABLE } = require('../cost-table.cjs');

const saasMrrSummary = {
  name: 'saas_get_mrr_summary',
  description: 'Get the latest MRR snapshot for the authenticated SaaS tenant including waterfall breakdown.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.saas_mrr_summary || { base_cents: 0, model: 'none' },
  inputSchema: {
    type: 'object',
    properties: {
      period_start: { type: 'string', format: 'date' },
      period_end: { type: 'string', format: 'date' },
    },
    additionalProperties: false,
  },
  outputSchema: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'array', items: { type: 'object' } },
    },
  },
  async handler({ args, session, supabase }) {
    // reads saas_mrr_snapshots for session.tenant_id
    // returns MRR waterfall summary
  },
};
// ... 9 more tool descriptors

module.exports = {
  SAAS_TOOLS: [
    saasMrrSummary,
    // ...
  ],
};
```

**`index.cjs` registration (additive):**

```cjs
// Add after existing tool imports in lib/markos/mcp/tools/index.cjs:
const { SAAS_TOOLS } = require('./saas.cjs');
// Add SAAS_TOOLS to allTools array
```

**DB-trigger compliance — `MCP_TOOL_REQUIRES_TENANT_SESSION_BOUND`:**

Architecture-lock test assertion (not a DB-trigger — MCP tools are `.cjs` file artifacts):
- Every handler in `saas.cjs` accesses `session.tenant_id` (NOT a hardcoded tenant_id)
- No handler in `saas.cjs` uses service-role key directly for data reads
- All 10 tools have `mutating: false` (architecture-lock test asserts no `mutating: true` in `saas.cjs`)
- `npm test` runs `test/saas-217/domain-5/mcp-tools-tenant-bound.test.js` asserting session binding

---

### Domain 6: SaaS UI Navigation and Post-217 Translation Gate (Plan 217-06)

**Requirements:** SAS-10, QA-01..15; `translation_gate_for: [P218, P219, P220]` (NOT requirements for SG-01..12)

**Note on autonomous flag:** Plan 217-06 is `autonomous: true` — this is UI navigation only; it does NOT activate any agents. The activation gate is for `saas_suite_activations.active` (P214 substrate), not for growth modules. P218/P219/P220 Plan 06 files own `autonomous: false` agent activation gates.

#### SaaS UI Navigation Routes

App Router pages under `app/(markos)/saas/` (NEW directory — P217 creates):

```text
app/(markos)/saas/
├── layout.tsx                     SaaS layout — server-renders activation gate
├── page.tsx                       SaaS Overview dashboard
├── subscriptions/
│   └── page.tsx                   Subscriptions list + lifecycle state
├── plans/
│   └── page.tsx                   Plan catalog + Pricing Engine status
├── revenue/
│   ├── page.tsx                   Revenue dashboard (MRR/ARR/NRR/GRR)
│   └── waterfall/page.tsx         MRR waterfall detail
├── churn/
│   └── page.tsx                   Churn Intelligence + health scores
├── invoices/
│   └── page.tsx                   Invoices + billing compliance
├── support/
│   └── page.tsx                   Support Intelligence (reads P216)
└── agents/
    └── page.tsx                   SAS Agent Registry (readiness dashboard)
```

**Activation gate (`app/(markos)/saas/layout.tsx`):**

```tsx
// layout.tsx — server component
// Reads saas_suite_activations for the current tenant.
// If no active SaaSSuiteActivation → redirect to /settings/plugins with
//   message: "SaaS Suite is not activated for this tenant."
// If activated → render children (SaaS sidebar + nav routes).
```

#### `saas_nav_visibility` Table Schema

```sql
-- Migration: 98_saas_revenue_intelligence.sql (combined)
CREATE TABLE saas_nav_visibility (
  nav_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_orgs(org_id),
  nav_key         text NOT NULL,           -- e.g., 'saas_overview', 'saas_revenue', 'saas_plg' (planned)
  label           text NOT NULL,
  route           text NOT NULL,           -- e.g., '/saas/revenue'
  is_active       boolean NOT NULL DEFAULT false,
  planned_only    boolean NOT NULL DEFAULT false,  -- true for SG-01..12 namespaces (post-217 translation gate)
  owns_phase      text,                    -- e.g., 'P217' for active, 'P218' for planned-only
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, nav_key)
);
ALTER TABLE saas_nav_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY snv_tenant_isolation ON saas_nav_visibility
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

**DB-trigger compliance — `SAAS_NAV_REQUIRES_ACTIVATION`:**

```sql
CREATE OR REPLACE FUNCTION enforce_saas_nav_activation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- A nav row can only be set is_active=true if the tenant has an active SaaSSuiteActivation
  IF NEW.is_active = true AND NEW.planned_only = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM saas_suite_activations
      WHERE tenant_id = NEW.tenant_id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'SAAS_NAV_REQUIRES_ACTIVATION: nav_key=% cannot be active for tenant % without active SaaSSuiteActivation', NEW.nav_key, NEW.tenant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_saas_nav_activation
  BEFORE INSERT OR UPDATE ON saas_nav_visibility
  FOR EACH ROW EXECUTE FUNCTION enforce_saas_nav_activation();
```

#### Post-217 Growth Translation Gate

Plan 217-06 seeds the following `planned_only = true` rows into `saas_nav_visibility` for each active SaaS tenant. These rows document that the 12 SG growth module namespaces exist in the nav schema but are NOT yet active:

| nav_key | label | route | owns_phase | planned_only |
|---------|-------|-------|------------|-------------|
| `saas_plg` | PLG Engine | /saas/plg | P218 | true |
| `saas_inapp` | In-App Marketing | /saas/inapp | P218 | true |
| `saas_experiments` | Growth Experiments | /saas/experiments | P218 | true |
| `saas_expansion` | Account Expansion | /saas/expansion | P219 | true |
| `saas_abm` | ABM Engine | /saas/abm | P219 | true |
| `saas_advocacy` | Customer Advocacy | /saas/advocacy | P219 | true |
| `saas_revenue_alignment` | Revenue Alignment | /saas/revenue-alignment | P219 | true |
| `saas_referral` | Viral / Referral | /saas/referral | P220 | true |
| `saas_community` | Community | /saas/community | P220 | true |
| `saas_events` | Events | /saas/events | P220 | true |
| `saas_partnerships` | Partnerships | /saas/partnerships | P220 | true |
| `saas_devrel` | Developer Marketing | /saas/devrel | P220 | true |

This is the post-217 translation gate — a planning-time artifact that: (a) proves namespace collision is impossible (each nav_key is reserved), (b) proves P218/P219/P220 Plan 06 plans can activate their nav rows by setting `planned_only = false` and `is_active = true` via UPDATE (not INSERT), (c) asserts no SG module is active in P217 (`planned_only = true` invariant test).

**Plan 217-06 closeout suite (matches P220-06 pattern):**

- `test/saas-217/domain-6/slot-collision-regression.test.js` — asserts P217 did NOT touch P218-P220 migration slots
- `test/saas-217/domain-6/architecture-lock-rerun.test.js` — all-domains architecture-lock RE-RUN
- `test/saas-217/domain-6/translation-gate.test.js` — asserts all 12 SG nav rows have `planned_only = true` and `is_active = false`; asserts 0 growth module agents have `runnable = true` in `sas_agent_readiness`
- `test/saas-217/domain-6/requirements-coverage.test.js` — asserts SAS-09, SAS-10, MCP-01, API-01 each have at least one test file in `test/saas-217/`

---

## Cross-Phase Coordination

### P217 → Upstream (P214/P215/P216)

| Upstream Phase | What P217 Reads | How P217 Uses It |
|---------------|-----------------|-----------------|
| P214 `saas_suite_activations` | `tenant_id`, `status = 'active'`, `modules_enabled` | Navigation activation gate; SAS agent registry seed; API auth guard |
| P215 `tenant_billing_subscriptions`, `billing_usage_events`, `billing_periods` | Subscription lifecycle state, billing events | MRR snapshot cron input; `/v1/saas/subscriptions` read delegation |
| P216 `saas_health_scores` | Health score, churn_risk dimension | `/v1/saas/health` API; SAS-04 agent readiness signal; `saas_get_at_risk_accounts` MCP tool |

### P217 → Downstream (P218/P219/P220)

| Downstream Phase | What It Reads from P217 | Hard / Soft |
|-----------------|------------------------|-------------|
| P218 Plan 01 `assertUpstreamReady` | `saas_mrr_snapshots` table existence | HARD [VERIFIED: 218-01-PLAN.md] |
| P218 Plan 01 mode eligibility logic | `saas_mrr_snapshots` MRR/NRR values (SAS-09 consume-only) | HARD (data) |
| P219 Plan 01 `assertUpstreamReady` | `saas_mrr_snapshots` table existence | HARD [VERIFIED: 219-01-PLAN.md] |
| P219 Plan 02 expansion-signal-scanner | `saas_mrr_snapshots` for MRR uptick detection | HARD (data) [VERIFIED: 219-02-PLAN.md] |
| P220 Plan 06 | `saas_nav_visibility` rows (UPDATE planned_only→false when P220 activates) | SOFT (P217 seeds; P220 activates) |
| P218/P219/P220 Plan 06 all | `sas_agent_readiness` rows (reference only; own tables are plg_/b2b_/growth_) | SOFT (reference) |

### Cross-Phase Naming Non-Collision

| Table | Owner | Scope |
|-------|-------|-------|
| `sas_agent_readiness` | P217 | SAS-01..06 revenue/billing/support/expansion agents |
| `plg_growth_agent_readiness` | P218 | PLG/inapp/experiment agents |
| `b2b_growth_agent_readiness` | P219 | B2B expansion/ABM/advocacy agents |
| `growth_agent_readiness` | P220 | Viral/community/events/PR/partnerships/devrel agents |

**P218↔P220 naming collision note:** P218 uses `plg_growth_agent_readiness`; P220 uses `growth_agent_readiness`. These are DISTINCT tables (no collision). The previous 217-REVIEWS.md concern about P218↔P220 collision is a SEPARATE cross-phase fix between P218 and P220 — OUT OF SCOPE for P217. P217's table `sas_agent_readiness` does not collide with any of them.

### P217 → P218 Contract: `saas_suite_activations` Ownership

`saas_suite_activations` table is P214-owned (per CONTEXT.md "Existing implementation substrate: App navigation, settings, dashboards, and billing UI"). P217 Plan 06 nav layout READS this table (SELECT only). P218 Plan 01 mode profile also READS this table for the SaaS activation gate. Neither P217 nor P218 OWNs the table — P214 does. P217 must not INSERT/UPDATE/DELETE `saas_suite_activations`. [ASSUMED: P214 owns; P217 consume-only; pending P214 research confirmation]

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` |
| Config file | None — `npm test` runs `node --test test/**/*.test.js` |
| Quick run command | `node --test test/saas-217/**/*.test.js` |
| Full suite command | `npm test` |

### Test Directory Structure

```text
test/saas-217/
├── preflight/
│   ├── architecture-lock.test.js      Wave 0.5 — 217-01 Plan 01 ships this
│   └── upstream-check.test.js         Wave 0.5 — assertUpstreamReady unit tests
├── domain-1/
│   ├── revenue-formulas.test.js        Unit: MRR waterfall math, edge cases
│   └── source-precedence.test.js       Unit: source conflict resolution, reconciliation states
├── domain-2/
│   ├── mrr-snapshots.test.js           Unit: snapshot schema, trigger enforcement
│   ├── waterfall-entries.test.js       Unit: waterfall entry math
│   ├── snapshot-builder.test.js        Unit: lib/markos/saas/revenue/snapshot-builder.cjs
│   └── nightly-cron.test.js            Unit: api/cron/saas-mrr-snapshot.js
├── domain-3/
│   ├── sas-agent-readiness.test.js     Unit: readiness flags, GENERATED runnable, trigger
│   └── agent-seed.test.js              Unit: migration seed logic
├── domain-4/
│   ├── api-subscriptions.test.js       Unit: api/v1/saas/subscriptions.js
│   ├── api-plans.test.js               Unit: api/v1/saas/plans.js
│   ├── api-invoices.test.js            Unit: api/v1/saas/invoices.js
│   ├── api-health.test.js              Unit: api/v1/saas/health.js
│   ├── api-metrics.test.js             Unit: api/v1/saas/metrics.js (7 paths)
│   ├── api-agents.test.js              Unit: api/v1/saas/agents.js
│   └── api-contract-shape.test.js      Contract: F-ID parity vs contracts/openapi.json
├── domain-5/
│   ├── mcp-tools-tenant-bound.test.js  Unit: all 10 tools use session.tenant_id
│   ├── mcp-tools-readonly.test.js      Unit: all 10 tools have mutating: false
│   └── mcp-index-registration.test.js  Unit: saas.cjs registered in index.cjs
└── domain-6/
    ├── nav-activation-gate.test.js      Unit: saas_nav_visibility trigger enforcement
    ├── translation-gate.test.js         Unit: 12 SG rows planned_only=true, is_active=false
    ├── slot-collision-regression.test.js Regression: P217 did NOT touch P218-P220 slots
    ├── architecture-lock-rerun.test.js   Regression: all-domains architecture-lock
    └── requirements-coverage.test.js     Coverage: SAS-09, SAS-10, MCP-01, API-01 each have tests
```

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| SAS-09 | Revenue intelligence exposes MRR/ARR/NRR/GRR/churn/expansion as tasks/alerts | unit | `node --test test/saas-217/domain-1/revenue-formulas.test.js` | Wave 0 |
| SAS-09 | MRR snapshot table schema + reconciliation trigger | unit | `node --test test/saas-217/domain-2/mrr-snapshots.test.js` | Wave 0 |
| SAS-09 | Snapshot builder reads P215 billing tables | unit | `node --test test/saas-217/domain-2/snapshot-builder.test.js` | Wave 0 |
| SAS-10 | SAS agent readiness registry — all 6 agents seeded, runnable=false | unit | `node --test test/saas-217/domain-3/sas-agent-readiness.test.js` | Wave 0 |
| SAS-10 | API handlers auth guard (requireHostedSupabaseAuth every handler) | unit | `node --test test/saas-217/domain-4/api-contract-shape.test.js` | Wave 0 |
| MCP-01 | MCP tools tenant-session-bound | unit | `node --test test/saas-217/domain-5/mcp-tools-tenant-bound.test.js` | Wave 0 |
| MCP-01 | MCP tools all mutating: false | unit | `node --test test/saas-217/domain-5/mcp-tools-readonly.test.js` | Wave 0 |
| API-01 | OpenAPI contracts updated with F-247..F-258 paths | contract | `node --test test/saas-217/domain-4/api-contract-shape.test.js` | Wave 0 |
| QA-01..15 | Architecture-lock: no forbidden patterns in P217 paths | static | `node --test test/saas-217/preflight/architecture-lock.test.js` | Wave 0 |
| Translation gate | SG-01..12 nav rows planted, planned_only=true, none active | unit | `node --test test/saas-217/domain-6/translation-gate.test.js` | Wave 0 |

### Wave 0 Gaps (test files to create before domain implementation)

- `test/saas-217/preflight/architecture-lock.test.js` — Wave 0.5, Plan 217-01
- `test/saas-217/domain-1/revenue-formulas.test.js` — covers SAS-09 metric math
- `test/saas-217/domain-2/mrr-snapshots.test.js` — covers `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE`
- `test/saas-217/domain-3/sas-agent-readiness.test.js` — covers `SAS_AGENT_ACTIVATION_REQUIRES_READINESS`
- `test/saas-217/domain-6/translation-gate.test.js` — covers post-217 gate assertion

---

## Manual-Only Verifications

The following cannot be automated and require operator/reviewer action before P217 ships:

| # | Verification | Reason Manual | Owner |
|---|-------------|--------------|-------|
| M-1 | Revenue metric formula audit — verify MRR waterfall produces correct totals against known test fixture from P215 billing data | Requires real subscription data in staging | Engineering lead |
| M-2 | MRR reconciliation operator review — flag that `reconciliation_state = 'conflict_flagged'` P1 tasks are visible in P208 Approval Inbox UI | P208 UI not yet shipped in P217 sequence | Engineering lead |
| M-3 | SAS agent activation checkpoint — all 6 agents must have `runnable = false` in production before P217 closes | Human confirms no agent accidentally activated | Operator |
| M-4 | API/MCP UI gate validation — confirm SaaS nav routes are NOT visible for a non-SaaS tenant in staging | Browser smoke test | QA |
| M-5 | Post-217 translation gate confirmation — confirm all 12 SG nav rows have `planned_only = true` in staging DB before P218 execute | DB query in staging | Engineering lead |
| M-6 | F-ID parity — confirm `contracts/openapi.json` contains F-247..F-258 after `npm run openapi:build` | Regeneration step | Engineering |

---

## Open Questions / Decision Points

### Q-1: P217 `saas_mrr_snapshots` ↔ P219 Plan 02 Expansion Signal Scanner

**Resolution:** The exact table name is `saas_mrr_snapshots`. [VERIFIED: 218-01-PLAN.md, 219-01-PLAN.md, 219-02-PLAN.md — all three files reference `saas_mrr_snapshots` by exact name]. P219 Plan 02 reads `saas_mrr_snapshots` for `usage_growth` / MRR-uptick detection. P217 must not rename this table or add column name changes without updating P218+P219 plans.

**Columns P219 reads:** Based on 219-02-PLAN.md signal patterns: `mrr_end`, `expansion_mrr`, `nrr_pct`, `tenant_id`, `snapshot_date`. P217's schema must include these exact column names.

**Status: RESOLVED** — column names confirmed in P217 schema above.

### Q-2: `sas_agent_readiness` vs P218/P219/P220 growth agent readiness naming

**Resolution:** P217 = `sas_agent_readiness`. P218 = `plg_growth_agent_readiness`. P219 = `b2b_growth_agent_readiness`. P220 = `growth_agent_readiness`. No collision. [VERIFIED: 219-RESEARCH.md line 341]

**P218↔P220 collision** (`growth_agent_readiness` in P220 was originally named `plg_growth_agent_readiness` in P218 — but P218 replanned with `plg_growth_agent_readiness` and P220 uses `growth_agent_readiness`): SEPARATE fix between P218 and P220. P217 not involved.

**Status: RESOLVED** for P217 scope.

### Q-3: Plan 06 SG-01..12 ownership

**Resolution:** Plan 217-06 frontmatter `requirements:` = `SAS-10, QA-01..15`. SG-01..12 are documented as `translation_gate_for: [P218, P219, P220]`. The 12 `planned_only=true` nav rows are the translation gate artifact. [VERIFIED: REQUIREMENTS.md lines 227-230 — SG-01..12 map to P218/P219/P220]

**Status: RESOLVED** — remove SG-01..12 from Plan 06 requirements; add translation_gate_for field.

### Q-4: Plan 03 SG-10 ownership

**Resolution:** Plan 217-03 `requirements:` = `SAS-09, SAS-10, QA-01..15`. SG-10 is NOT in P217 requirements. SG-10 = "target growth agent tiers are not active implementation truth until GSD assigns contracts..." — this is enforced by P218/P219/P220 P06 `growth_agent_readiness` tables. P217's `sas_agent_readiness` enforces SAS-10 (SAS agents specifically), not SG-10 (PLG/EXP/ABM etc.). [VERIFIED: REQUIREMENTS.md line 140 — SG-10 maps to P218-220]

**Status: RESOLVED** — remove SG-10 from Plan 03 requirements.

### Q-5: LOOP-01..08 ownership in Plan 01

**Resolution:** REQUIREMENTS.md line 220 maps `LOOP-01..08 | Phase 211`. P217 Plan 01 `requirements:` = `SAS-09, QA-01..15`. Plan 01 uses `integrates_with: [LOOP-01, LOOP-05, LOOP-06 from P211/P219, LOOP-07, LOOP-08 from P211]` to document that revenue facts produced by P217 feed these loops — but P217 does not own LOOP orchestration.

**Status: RESOLVED** — remove LOOP-0X from Plan 01 requirements frontmatter; add integrates_with annotation.

### Q-6: P217 → P218 contract — `saas_suite_activations` ownership

**Status:** P214 owns `saas_suite_activations`. P217 Plan 06 reads it (SELECT only) for the nav activation gate. P218 Plan 01 reads it for mode-profile gate. Both are consumers. P217 must NOT INSERT/UPDATE/DELETE `saas_suite_activations`.

**Residual risk:** If P214 has not yet shipped, P217 preflight hard-fails on `saas_suite_activations` absent. This is correct behavior — P217 cannot provide SaaS nav without the activation table. [ASSUMED: P214 owns; confirmed by CONTEXT.md "Existing implementation substrate" list]

**Status: RESOLVED** for P217 scope — P217 = read-only consumer of P214 table.

### Q-7: F-ID allocation post-P218/P219/P220

**Resolution:** P217 = F-247..F-258. This avoids: P220 F-209..F-227, P219 F-228..F-237, P218 F-238..F-246. [VERIFIED: 218-01-PLAN.md F-ID range note, 219-RESEARCH.md F-247..F-258 recommendation]

**Status: RESOLVED** — F-247..F-258 reserved for P217; no collision with P218/P219/P220 ranges.

### Q-8: Migration slots 98-100 vs 112+

**Resolution:** P217 uses slots 98-99. Slot 100 is occupied (`100_crm_schema_identity_graph_hardening.sql`). Two slots (98+99) are sufficient: slot 98 = combined revenue metric + MRR snapshot + nav visibility tables (single migration file); slot 99 = SAS agent readiness table (own migration for clean dependency chain). Slot 112+ is reserved for P219 Plan 06 overflow.

**Status: RESOLVED** — slots 98-99.

---

## Standard Stack

### Core (P217-specific)

| Library / Pattern | Version | Purpose | Why Standard |
|------------------|---------|---------|--------------|
| `node:test` + `node:assert/strict` | Node.js built-in | Test runner | Architecture-lock (no vitest) [VERIFIED: package.json] |
| `@supabase/supabase-js` | existing in package.json | DB client for MRR snapshot cron + preflight | Existing project standard |
| CommonJS `.cjs` | — | MCP tool files (`saas.cjs`) | Architecture-lock (index.cjs is CJS) [VERIFIED: lib/markos/mcp/tools/index.cjs] |
| `onboarding/backend/runtime-context.cjs` | existing | `requireHostedSupabaseAuth` | Architecture-lock [VERIFIED: codebase line 491] |
| `lib/markos/crm/agent-actions.ts` | existing | `buildApprovalPackage` | Architecture-lock [VERIFIED: codebase line 68] |
| `lib/markos/plugins/registry.js` | existing | `resolvePlugin` | Architecture-lock [VERIFIED: codebase line 102] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/markos/audit/*` | existing | SHA-256 audit hash chain | All mutations (conflict-flagged snapshot creates audit row) |
| `lib/markos/governance/*` | existing | Deletion/export workflow | `saas_mrr_snapshots` must support tenant data deletion |
| `lib/markos/mcp/tools/cost-table.cjs` | existing | MCP tool cost models | `saas.cjs` imports `COST_TABLE` |
| `lib/markos/mcp/tools/pipeline.cjs` | existing | MCP tool invocation pipeline | All MCP tools go through pipeline for rate-limit + cost-metering |

---

## Compliance Enforcement Summary (6 DB-triggers — one per domain)

| Domain | Trigger Name | Enforcement | Migration |
|--------|-------------|-------------|-----------|
| Plan 01 — Revenue metric defs | `REVENUE_METRIC_REQUIRES_PROVENANCE` | `formula_description` + `source_precedence` non-empty on INSERT/UPDATE | slot 98 |
| Plan 02 — MRR snapshots | `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE` | `reconciliation_state` non-null; no duplicate reconciled snapshot | slot 98 |
| Plan 03 — SAS agent registry | `SAS_AGENT_ACTIVATION_REQUIRES_READINESS` | All 8 readiness flags true requires `activation_approval_id` non-null | slot 99 |
| Plan 04 — API contracts | `SAAS_API_REQUIRES_TENANT_AUTH_RLS_AUDIT` | Architecture-lock test (not DB-trigger — API contracts are file artifacts) | test file |
| Plan 05 — MCP tools | `MCP_TOOL_REQUIRES_TENANT_SESSION_BOUND` | Architecture-lock test (not DB-trigger — MCP tools are .cjs file artifacts) | test file |
| Plan 06 — UI nav | `SAAS_NAV_REQUIRES_ACTIVATION` | `is_active=true` blocked unless tenant has active `saas_suite_activations` row | slot 98 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `saas_suite_activations` is owned by P214 (not P217) | §Cross-Phase Q-6 | P217 might ship the table instead of reading it |
| A2 | `api/v1/` directory does not exist — P217 creates it | §Architecture Lock | Another phase may have created it; minor conflict |
| A3 | The correct `requireHostedSupabaseAuth` call pattern matches existing `api/*.js` handlers exactly | §Architecture Lock | Handler pattern may deviate; auth broken |
| A4 | P220 `growth_agent_readiness` table is distinct from P218 `plg_growth_agent_readiness` | §Cross-Phase Q-2 | Naming collision between P218 and P220 is a SEPARATE fix; P217 unaffected |
| A5 | 10 MCP tools is the right count (canon lists 7; research adds 3) | §Domain 5 | Canon may intend exactly 7; remove `saas_get_nrr_grr`, `saas_get_cohort_retention`, `saas_get_revenue_forecast` and defer to a later SAS tool expansion |
| A6 | Slot 100 (`100_crm_schema_identity_graph_hardening.sql`) is an EXISTING migration (not a free slot) | §F-ID and Migration Slots | Database Schema reference + verified in codebase [VERIFIED] |
| A7 | P217 Plan 06 is `autonomous: true` (not `autonomous: false`) because UI nav does not activate agents | §Domain 6 | If activation gate requires human approval for first SaaS tenant nav activation, Plan 06 may need `autonomous: false` with checkpoint:human-action |

---

## Sources

### Primary (HIGH confidence)

- `obsidian/brain/SaaS Suite Canon.md` — SAS agent tier definitions, API surface target list, MCP tool target list, UI navigation target list [VERIFIED: read this session]
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — `SaaSMRRSnapshot` object shape (line 52), `SaaSGrowthProfile` (line 53), approval gate contract [VERIFIED: read this session]
- `obsidian/reference/Contracts Registry.md` — F-ID range context, existing F-98..F-105 contracts [VERIFIED: read this session]
- `obsidian/reference/HTTP Layer.md` — `requireHostedSupabaseAuth` auth pattern, API route conventions [VERIFIED: read this session]
- `.planning/phases/218-saas-growth-profile-plg-inapp-experimentation/218-RESEARCH.md` — slot 98-99 free finding, P218 locked slots 101-106, F-238..F-246 allocation, `saas_mrr_snapshots` as HARD upstream [VERIFIED: read this session]
- `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/219-RESEARCH.md` — P219 locked slots 107-111, F-228..F-237, `saas_mrr_snapshots` HARD upstream, `b2b_growth_agent_readiness` naming [VERIFIED: read this session]
- `.planning/phases/218-saas-growth-profile-plg-inapp-experimentation/218-01-PLAN.md` — exact REQUIRED_UPSTREAM table names including `saas_mrr_snapshots`, F-238..F-246 locked [VERIFIED: read this session]
- `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/219-02-PLAN.md` — expansion-signal-scanner reads `saas_mrr_snapshots` for MRR uptick; exact columns consumed [VERIFIED: read this session]
- `.planning/REQUIREMENTS.md` — LOOP-01..08 = P211, SG-01..12 = P218-220, SAS-09 = P217, SAS-10 = P217 [VERIFIED: read this session]
- Codebase migrations list — slots 82-89 occupied, 90-95+97 P220, 96+100 existing, 98-99 free [VERIFIED: codebase]
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` exists [VERIFIED: codebase]
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` exists [VERIFIED: codebase]
- `lib/markos/plugins/registry.js:102` — `resolvePlugin` exists [VERIFIED: codebase]
- `lib/markos/mcp/tools/index.cjs` — exists (CommonJS tool registry) [VERIFIED: codebase]
- `contracts/openapi.json` — exists [VERIFIED: codebase]
- `api/v1/` — does NOT exist [VERIFIED: codebase]
- `lib/markos/mcp/tools/saas.cjs` — does NOT exist [VERIFIED: codebase]
- `.agent/markos/agents/markos-saas-*.md` — all 6 SAS agent files verified [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- `obsidian/work/incoming/16-SAAS-SUITE.md` — Subscription TypeScript interfaces, SaaS module list, activation wizard schema [VERIFIED: read this session]
- `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/220-RESEARCH.md` — P220 locked F-209..F-227, slot 90-95+97 locked [VERIFIED: read this session]
- `obsidian/reference/Database Schema.md` — existing migration slot map [VERIFIED: read this session]

### Tertiary (LOW confidence)

- Revenue formula edge cases (partial-period, refund handling, multi-currency consolidation) — training knowledge, not verified against SaaS billing canon specifics [ASSUMED]
- MRR snapshot column `nrr_pct` / `grr_pct` as nullable-until-reconciled — derived from reconciliation model [ASSUMED]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `node:test` | All test files | ✓ | Node.js built-in | — |
| `@supabase/supabase-js` | MRR snapshot cron, preflight | ✓ | existing in package.json | — |
| `MARKOS_SAAS_CRON_SECRET` env | `api/cron/saas-mrr-snapshot.js` | ✗ (must be added) | — | Cron returns 401 without it |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Preflight scripts | ✓ (existing pattern) | — | Preflight exits 1 |
| P214 `saas_suite_activations` table | Nav gate + MRR seed | ✗ (P214 not yet executed) | — | assertUpstreamReady hard-fails |
| P215 billing tables | MRR snapshot cron | ✗ (P215 not yet executed) | — | assertUpstreamReady hard-fails |
| P216 `saas_health_scores` | `/v1/saas/health` + SAS-04 | ✗ (P216 not yet executed) | — | assertUpstreamReady hard-fails |

**Missing dependencies that block execution:**

- P214/P215/P216 upstream tables — execution gated by `assertUpstreamReady` in Plan 217-01 preflight. P217 cannot execute until P214-P216 land. This is by design — P217 is the 4th phase of the SaaS Suite layer.

**Missing dependencies with fallback:**

- `MARKOS_SAAS_CRON_SECRET` — cron handler must be set up as part of Plan 217-02 Wave 1 deployment.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all helpers verified at exact line numbers on disk
- Architecture: HIGH — slot collision resolved, F-IDs pre-allocated, forbidden patterns documented
- Schema: HIGH — derived from canon + Operating Loop Spec; downstream consumers verified
- Pitfalls: HIGH — 217-REVIEWS.md concerns resolved; P218/P219 cross-phase contracts verified
- Validation: HIGH — mirrors P218/P219/P220 test structure

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stable; upstream phases P218/P219 plans locked and confirmed)

---

## RESEARCH COMPLETE
