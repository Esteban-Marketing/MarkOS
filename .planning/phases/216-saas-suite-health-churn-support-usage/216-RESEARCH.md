# Phase 216: SaaS Health, Churn, Support, and Product Usage Intelligence — Research

**Researched:** 2026-04-26
**Domain:** SaaS Suite — explainable health scoring, churn intervention playbooks, support ticket intelligence, product usage event ingestion, privacy/retention substrate, growth handoff signals
**Confidence:** HIGH for codebase-grounded claims and canon-derived schema shapes, HIGH for architecture-lock (verified on disk), HIGH for F-ID/migration slot sequencing (Option A: slots 112-117 post-P219 107-111), HIGH for compliance enforcement boundaries (5 DB-triggers derived from REVIEWS.md and canon non-negotiables), MEDIUM for exact health-score weight tuning (operator-configured; defaults from canon), LOW for specific KB grounding connector API shapes (generic-first v1; provider-specific deferred)
**Replaces:** 66-line stub with 2026-04-23 codebase addendum (addendum content preserved and expanded below)

---

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support | Owns / Integrates |
|----|------------------------------------------------|------------------|-------------------|
| SAS-07 | SaaS health scoring uses product usage, support, billing, engagement, and relationship dimensions with confidence, trend, and intervention tasks | §7 Domain 1 — `saas_health_scores` table + 5-dimension model + `HEALTH_SCORE_REQUIRES_RAW_FACTS` trigger | OWNS |
| SAS-08 | SaaS support intelligence ingests tickets, classifies risk/topic/SLA/sentiment, grounds suggested responses in knowledge, and requires CS approval before customer-facing replies unless safe auto-response is configured | §7 Domain 3 — `saas_support_tickets` table + KB grounding + `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` trigger | OWNS |
| SAS-09 | SaaS product usage and revenue intelligence expose MRR, ARR, NRR, GRR, churn, expansion, cohorts, forecast, product adoption, and PLG signals as tasks, alerts, or decisions | §8 Cross-Phase Coordination — P216 EXPOSES health/churn/usage signals that P217 SAS-09 consumes; P216 does NOT own revenue intelligence definitions | INTEGRATES (P217 owns SAS-09 definitions) |
| EVD-01..06 | EvidenceMap substrate (citations, source quality, freshness, claim TTL, gaps) | §7 Domain 1 — P216 health score raw_facts JSONB records evidence for health-score facts; P209 owns EVD substrate | INTEGRATES (P209 owns) |
| TASK-01..05 | Human task and approval system (unified task/approval substrate, Morning Brief, Task Board, Approval Inbox, Mobile) | §7 Domain 4 — P216 churn intervention playbooks CREATE tasks via P208/P207 substrate; P208 owns task/approval substrate | INTEGRATES (P207/P208 own) |
| CONN-01..06 | Connector intelligence (registry, scopes, failure recovery, backfill, value unlock) | §7 Domains 2+3 — P216 product-event ingest + support-ticket import use P210 connector_installs substrate; P210 owns connector substrate | INTEGRATES (P210 owns) |
| QA-01..15 | Phase 200 Quality Baseline gates apply to all active and reserved phases | §9 Validation Architecture — per-domain test strategy across all 6 domains | OWNS (cross-domain) |
| SG-02 | PLG capability: activation definitions, milestone funnels, PQL scoring, upgrade triggers | §7 Domain 6 Growth Handoff — P216 reserves product_usage_events.event_category='plg' taxonomy; P218 owns PLG definitions | translation_gate_for: P218 |
| SG-03 | B2B SaaS growth: account expansion, customer marketing, advocacy, ABM | §7 Domain 6 — P216 churn intervention playbooks + health signals feed P219 expansion scanner | translation_gate_for: P219 |
| SG-07 | Growth experimentation: experiment registry, ICE backlog, guardrails | §7 Domain 6 — P216 planned_only flag; P218 owns experiments | translation_gate_for: P218 |
| SG-09 | Growth modules create tasks, approvals, experiments, or learnings | §7 Domain 6 — P216 documents growth_signal_map as planned-only; P218/P219/P220 activate | translation_gate_for: [P218, P219, P220] |
| SG-10 | Target growth agent tiers are not active until GSD assigns contracts/costs/approvals | §7 Domain 6 — P216 Plan 06 asserts 0 growth-module agents runnable=true at phase close | translation_gate_for: [P218, P219, P220] |

**SAS-09 ownership note:** REQUIREMENTS.md line 225 maps `SAS-07..09 | Phase 216` as a group, but P217 OWNS the SAS-09 revenue intelligence definitions (saas_revenue_metric_definitions, saas_mrr_snapshots). P216 EXPOSES the health/churn/usage signals that SAS-09 consumes. P216 Plan 01 frontmatter: `requirements: [SAS-07, QA-01..15]; integrates_with: [SAS-09 from P217, EVD-01..06 from P209]`.

**EVD-01..06 ownership note:** REQUIREMENTS.md line 218 maps `EVD-01..06 | Phase 209`. P216 health-score raw_facts JSONB is evidence-aligned but does NOT own the EvidenceMap substrate. P216 Plan 01 `integrates_with: [EVD-01..06 from P209]`.

**TASK-01..05 ownership note:** REQUIREMENTS.md line 217 maps `TASK-01..05 | Phase 208`. P216 churn playbooks CREATE tasks via the P207/P208 substrate. P216 Plan 04 `integrates_with: [TASK-01..05 from P208]`.

**CONN-01..06 ownership note:** REQUIREMENTS.md line 219 maps `CONN-01..06 | Phase 210`. P216 product-event and support-ticket connectors use `connector_installs` from P210. P216 Plan 02+03 `integrates_with: [CONN-01..06 from P210]`.

**SG-02/03/07/09/10 ownership note:** REQUIREMENTS.md lines 227-230 map SG-01..12 to P218/P219/P220. P216 Plan 06 documents the growth handoff signal map (planned-only) and asserts 0 growth-module agents runnable=true. P216 Plan 06 frontmatter: `requirements: [QA-01..15]; translation_gate_for: [P218, P219, P220]; integrates_with: [SG-02, SG-03, SG-07, SG-09, SG-10 from P218/P219/P220]`.
</phase_requirements>

---

## Executive Summary

Phase 216 is the **intelligence foundation** of the v4.1.0 SaaS milestone. It sits between the operational substrate (P207 AgentRun, P208 approvals, P209 evidence, P210 connectors, P214 SaaS activation) and the revenue/agent surface (P217 MRR intelligence + SAS agents + API/MCP/UI). Without P216, P217 cannot expose health signals through `/v1/saas/health`, cannot populate SAS-04 (Churn Risk Assessor) inputs, and cannot surface churn-driven tasks through the Morning Brief.

The phase covers six domains across six plan clusters: (1) `SaaSHealthScore` contract and explainability, (2) product usage event ingestion and PLG signal map, (3) `SaaSSupportTicket` intelligence and KB grounding, (4) churn intervention playbooks and operator tasks, (5) privacy and retention controls, and (6) growth handoff signals and closeout regression suite. Domains 1-5 create implementation truth. Domain 6 is planned-only documentation plus a translation-gate regression test.

**Three architectural decisions distinguish P216 from neighboring phases:**

First, P216 ships the `saas_health_scores` table that P217 HARD-depends on. P217-01-PLAN.md `assertUpstreamReady` includes `saas_health_scores` as a required table. P216's schema must be stable before P217 executes. The FK direction is P217 → P216 reads (P217 `/v1/saas/health` endpoint reads `saas_health_scores`; P216 does NOT have FKs into any P217 table). This is what makes Option A slot ordering (P216 = 112-117, after P217 = 98-99) safe: P216's migration at slot 112 creates `saas_health_scores`; P217's migration at slot 98 does NOT reference it by FK — P217 only joins it at runtime.

Second, P216 ships the privacy/retention substrate (PII classification ENUM + `retention_class` + `retention_until` columns) that is FOUNDATIONAL for all P217-P228 phases. Every downstream phase that touches customer-identifiable data (support text, product events, CRM records, email engagement, social signals) must reference P216's `data_retention_classes` table and apply the P216-defined classification ENUM. P216 Plan 05 is the only phase that defines this taxonomy; subsequent phases add rows via INSERT, not schema changes.

Third, P216's six domains each have a distinct compliance enforcement boundary enforced by a named DB-trigger exception. App-layer enforcement alone is bypassable (P226 RH5/RH6 lesson). DB-triggers block non-compliant inserts at the database level, regardless of which code path initiated them.

**Critical slot-ordering finding:** All slots 90-99 and 100-111 are occupied (P220: 90-95+97; existing migration 96; P217: 98-99; existing migration 100; P218: 101-106; P219: 107-111). P216 must use slots 112-117. Slot ordering is cosmetic only — execution dependency (P216 runs before P217) is maintained through `assertUpstreamReady` gate scripts, not migration slot numbers. P217's Plan 01 checks that `saas_health_scores` table exists before proceeding; if P216 has not landed, P217 halts.

**Codebase addendum (preserved from 2026-04-23):** CRM execution already computes stalled work, success risk, overdue tasks, inbound signals, ownership gaps, and recommendations. CRM reporting produces readiness, pipeline health, productivity, SLA risk, and executive summary data. Outbound and CRM conversation primitives can support intervention tasks. Evidence and approval patterns exist for grounded CRM copilot actions. Gaps: no product usage event ingest, no support ticket model, no explainable SaaS health score, no churn intervention playbook, no approval-gated save-offer flow, no privacy/retention model for support text and product usage data.

**Primary recommendation:** Ship P216 as 6 plan clusters. Plan 01 is the architectural anchor (ships `assertUpstreamReady`, architecture-lock test, `saas_health_scores` table, and V4.1.0-MIGRATION-SLOT-COORDINATION.md APPEND). Plan 05 (privacy/retention) ships as early as possible in execution order because downstream P217-P228 must reference its ENUM values.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions (Non-Negotiables, verbatim from 216-CONTEXT.md)

1. No customer-facing support response without CS review unless safe auto-response is explicitly configured.
2. No save offer, discount, or retention action without Pricing Engine context and approval.
3. No black-box health score. Raw facts, weights, confidence, and trend must be visible.
4. No product usage dashboard that does not create tasks, alerts, recommendations, or learning.
5. No PQL score, upgrade trigger, community-health signal, advocacy prompt, or expansion intervention becomes externally actionable without future GSD contracts and approval rules.

### Claude's Discretion (per DISCUSS.md Decision Matrix)

- Health score default weights (fixed per canon defaults; tenant-tunable config later)
- Connector specifics beyond generic adapter pattern (PostHog/Segment/Intercom/Zendesk adapters deferred to v4.2.0)
- KB grounding response threshold (minimum evidence confidence before auto-draft is shown)
- PII classification ENUM granularity (must cover support text and product events; exact enum values discretionary)
- Migration slot combination strategy within 112-117 (multi-table per slot acceptable)
- Growth signal map column granularity (must cover P218/P219/P220 known consumer needs)

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of any handler — kept on legacy `api/*.js` (architecture-lock)
- PostHog/Segment native connector richness — generic-first in v1; specific connectors deferred to v4.2.0
- Intercom/Zendesk/HelpScout/HubSpot native connectors — generic-first; specific deferred to v4.2.0
- PQL score activation, upgrade trigger automation — planned-only in P216; P218 owns
- Account expansion outreach — planned-only in P216; P219 owns
- Community health score — planned-only in P216; P220 owns
- ML-based health score weights — rule-based weighted sum in v1; ML deferred
- Auto-dispatch of churn intervention messages — approval-gated only in v1; earned-autonomy later

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions. Any plan that contradicts these must stop and flag per drift rule.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Suite Canon.md` defines `SaaSHealthScore`, `SaaSSupportTicket`, health-score dimension weights, SAS agent tier (SAS-04/SAS-05), and the churn intelligence workflow. P216 schema and policy MUST match this canon. [VERIFIED: canon read 2026-04-26]
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` lines 50-51 define the exact object shapes for `SaaSHealthScore` (usage/support/billing/engagement/relationship depth, confidence, trend, intervention) and `SaaSSupportTicket` (ticket source, SLA, topic, sentiment, risk, KB grounding, suggested response, approval state). P216 column shapes MUST match this spec. [VERIFIED: spec read 2026-04-26]
3. **Engineering execution state wins:** `.planning/STATE.md` shows Phase 204 active; P216 plans MUST NOT execute before P207, P208, P209, P210, and P214 land.
4. **Drift rule:** If P216 plans define schema that contradicts vault brain/reference, STOP and flag — do NOT silently reconcile.

### Placeholder rule (MUST)

`{{MARKOS_PRICING_ENGINE_PENDING}}` is required wherever churn save offers, discount posture, or retention pricing copy is written before an approved `PricingRecommendation` exists. P216 Plan 04 `saas_churn_interventions.offer_details` uses this sentinel until P205 lands.

### CLI / tests (MUST)

- Run tests with `npm test` or `node --test test/**/*.test.js` — NO vitest, NO playwright. [VERIFIED: package.json]
- Test files: `.test.js` extension and `node:test` + `node:assert/strict` imports.
- Test fixtures: `.js` (NOT `.ts`).

---

## Phase Scope: 6 Domains

| Plan | Domain | Key Objects Created | Requirements Owned |
|------|--------|--------------------|---------------------|
| 216-01 | SaaSHealthScore contract + explainability + Wave 0.5 | `saas_health_scores` | SAS-07, QA-01..15; integrates_with: [SAS-09 from P217, EVD-01..06 from P209] |
| 216-02 | Product usage event ingestion + PLG signal map | `product_usage_events`, `product_usage_connectors` | SAS-07 (usage dimension), QA-01..15; integrates_with: [CONN-01..06 from P210] |
| 216-03 | SaaSSupportTicket + KB grounding + classification | `saas_support_tickets`, `support_kb_groundings` | SAS-08, QA-01..15; integrates_with: [CONN-01..06 from P210, EVD-01..06 from P209] |
| 216-04 | Churn intervention playbooks + tasks | `saas_churn_interventions`, `saas_intervention_playbooks` | SAS-07 (intervention axis), QA-01..15; integrates_with: [TASK-01..05 from P208, PRC-01..09 from P205] |
| 216-05 | Privacy + retention controls (FOUNDATIONAL) | `data_retention_classes` | QA-01..15; integrates_with: [COMP-01 from P206]; downstream INTEGRATES_BY: [P217-P228 all] |
| 216-06 | Growth handoff signals + closeout regression suite | `growth_signal_map` (planned-only doc) | QA-01..15; translation_gate_for: [P218, P219, P220] |

---

## Architecture Lock

This section MUST be verified in Plan 216-01 Task 0.5 (first task in Wave 1 — matching P217/P218/P219/P220 architecture-lock model).

### Pin Table

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/v1/saas/*.js` flat handlers under `api/v1/saas/health.js`, `api/v1/saas/support.js`, `api/v1/saas/usage.js` | P217 creates `api/v1/saas/` directory; P216 appends to same layout. [ASSUMED: P217 creates directory first; P216 must coordinate] |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| OpenAPI registry | `contracts/openapi.json` | Filesystem confirmed [VERIFIED: codebase] |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS) | Filesystem confirmed [VERIFIED: codebase] |
| MCP health/support/usage tools | `lib/markos/mcp/tools/health.cjs`, `lib/markos/mcp/tools/support.cjs`, `lib/markos/mcp/tools/usage.cjs` (NEW — shipped by P216 Plans 01/02/03) | Do NOT exist yet; Plans create them [VERIFIED: codebase — not found] |
| Test runner | `npm test` → `node --test test/**/*.test.js` | package.json [VERIFIED: codebase] |
| Test imports | `node:test` + `node:assert/strict` | Architecture-lock carry-forward P217-P228 |
| Test extension | `*.test.js` (NOT `.test.ts`) | Architecture-lock carry-forward |
| Test directory | `test/saas-216/<domain>/` | Mirrors `test/saas-217/`, `test/saas-218/`, `test/saas-219/` |
| Cron auth | `x-markos-cron-secret` header matching `MARKOS_SAAS_CRON_SECRET` env | `api/cron/mcp-kpi-digest.js` pattern [VERIFIED: codebase] |
| Audit emit | `lib/markos/audit/*` (SHA-256 hash chain per migration 82) | Filesystem [VERIFIED: codebase] |
| Tombstone | `lib/markos/governance/*` deletion workflow (migration 56) | Filesystem [VERIFIED: codebase] |
| DB-trigger auth | `BEFORE INSERT OR UPDATE` triggers per domain (5 named triggers) | P226 RH5/RH6 lesson; P217/P218/P219/P220 pattern |
| App Router | `app/(markos)/saas/*` pages for UI — existing App Router pattern | HTTP Layer + existing `app/(markos)/` layout [VERIFIED: codebase] |
| `api/v1/` directory | Created by P217 Plan 04; P216 appends handlers | [VERIFIED: P217-RESEARCH §Architecture Lock confirms P217 creates `api/v1/`] |

**Note on API surface coordination:** P217 Plan 04 creates `api/v1/saas/` directory. P216 ships handlers for `health.js`, `support.js`, and `usage.js` under that path. Since P216 executes BEFORE P217 (assertUpstreamReady direction), P216 must CREATE the `api/v1/saas/` directory OR P217 must create it in its own execution and P216's API handlers must be added in P217's execution window. Recommended solution: P216 Plan 01 creates `api/v1/saas/` directory as part of Wave 0.5 setup; P217 Plan 04 simply adds to it.

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
| `lib/markos/mcp/tools/health.cjs` | SaaS health MCP tools | DOES NOT EXIST — Plan 01 creates | — |
| `lib/markos/mcp/tools/support.cjs` | SaaS support MCP tools | DOES NOT EXIST — Plan 03 creates | — |
| `lib/markos/mcp/tools/usage.cjs` | SaaS product usage MCP tools | DOES NOT EXIST — Plan 02 creates | — |
| `api/v1/saas/health.js` | `/v1/saas/health` API handler | DOES NOT EXIST — Plan 01 creates | — |
| `api/v1/saas/support.js` | `/v1/saas/support` API handler | DOES NOT EXIST — Plan 03 creates | — |
| `api/v1/saas/usage.js` | `/v1/saas/usage` API handler | DOES NOT EXIST — Plan 02 creates | — |
| `lib/markos/runtime-context.cjs` | (wrong path — do NOT reference) | NOT FOUND [VERIFIED: codebase] | Use `onboarding/backend/runtime-context.cjs` |

### Forbidden Patterns

Architecture-lock test asserts grep count = 0 across all P216 lib/api paths:

```text
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/saas/revenue/      (P217 ships this)
lib/markos/profile/           (P218 ships this)
lib/markos/b2b/               (P219 ships this)
lib/markos/referral/          (P220 ships this)
lib/markos/community/         (P220 ships this)
lib/markos/events/            (P220 ships this)
lib/markos/pr/                (P220 ships this)
lib/markos/partnerships/      (P220 ships this)
lib/markos/sales/             (P226 ships this)
lib/markos/cdp/               (P221 ships this)
lib/markos/conversion/        (P224 ships this)
lib/markos/launches/          (P224 ships this)
lib/markos/analytics/         (P225 ships this)
lib/markos/channels/          (P223 ships this)
lib/markos/ecosystem/         (P227 ships this)
public/openapi.json
app/(saas)/
app/(growth)/
route.ts
vitest
playwright
openapi-generate
.test.ts
```

The architecture-lock test (`test/saas-216/preflight/architecture-lock.test.js`) ships in Plan 216-01 Task 0.5.

---

## Upstream Dependencies (assertUpstreamReady Gate)

### Hard Upstreams (P216 MUST fail preflight if these tables are missing)

| Phase | Table(s) to Check | Why P216 Needs It | Hard / Soft |
|-------|------------------|-------------------|-------------|
| P207 | `markos_agent_runs` | AgentRun substrate — SAS-04/SAS-05 agent invocations are AgentRun records; health-score cron emits runs | HARD |
| P208 | `agent_approval_packages` | Approval substrate — churn save offers and support response approvals use `buildApprovalPackage` | HARD |
| P209 | `evidence_map_records` | Evidence substrate — health-score raw_facts link to evidence records; P216 Plan 01 records evidence for health-score inputs | HARD |
| P210 | `connector_installs` | Connector substrate — product-event ingest (Plan 02) and support-ticket import (Plan 03) read `connector_installs` for auth/scope verification | HARD |
| P214 | `saas_suite_activations` | SaaSSuiteActivation — P216 tables are health/support/usage modules gated by SaaS Suite activation; health score cron reads `saas_suite_activations.modules_enabled` | HARD |

**Note on P215:** P215 billing tables (`tenant_billing_subscriptions`, `saas_billing_periods`) are consumed by the billing health dimension in `saas_health_scores`. Recommend SOFT dependency — if P215 is absent, billing dimension degrades to a stub score of 0 with a `BILLING_DATA_UNAVAILABLE` warning in `raw_facts`. Hard-fail would block P216 indefinitely since P215 is not yet landed.

**Note on P205 (Pricing Engine):** P216 Plan 04 churn save offers SOFT-depend on P205. If `pricing_recommendations` table is absent, `offer_details` uses `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel and approval is still required. Hard-fail on P205 absent would block P216 indefinitely.

**Note on P211, P212, P213:** Not consumed by P216 at schema level. SOFT: P211 loop substrate (health signals feed loop measurement after P211 lands); P212 learning substrate (churn intervention outcomes write to ArtifactPerformanceLog after P212 lands); P213 Tenant 0 (not consumed by P216).

### Soft Upstreams (degrade gracefully)

| Phase | Why Optional | Fallback |
|-------|-------------|----------|
| P205 | Pricing Engine — Plan 04 save offer pricing | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; log warning; approval still required |
| P215 | Billing tables — billing health dimension | Billing dimension score = 0; `raw_facts.billing = {status: 'BILLING_DATA_UNAVAILABLE'}` |
| P211 | Loop substrate — health signals feed loop measurement | Health signals stored; loop integration deferred until P211 lands |
| P212 | LRN substrate — intervention outcomes write to ArtifactPerformanceLog | Outcomes stored in `saas_churn_interventions.outcome_jsonb`; P212 sync deferred |
| P213 | Tenant 0 | Not consumed by P216 |

### Preflight Script Pattern

```cjs
// scripts/preconditions/216-01-check-upstream.cjs
'use strict';
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_TABLES = [
  'markos_agent_runs',              // P207 HARD prereq — AgentRun substrate
  'agent_approval_packages',        // P208 HARD prereq — approval substrate
  'evidence_map_records',           // P209 HARD prereq — evidence substrate
  'connector_installs',             // P210 HARD prereq — connector substrate
  'saas_suite_activations',         // P214 HARD prereq — SaaS activation gate
];
const SOFT_TABLES = [
  'pricing_recommendations',        // P205 soft prereq — churn save offers
  'tenant_billing_subscriptions',   // P215 soft prereq — billing health dimension
  'markos_literacy_chunks',         // P212 soft prereq — KB grounding literacy
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P216). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — sentinel or stub)`);
    }
  }
  console.log('P216 upstream preflight: PASSED');
}
main().catch((e) => { console.error(e); process.exit(2); });
```

Each of Plans 01-06 ships its own `scripts/preconditions/216-NN-check-upstream.cjs`.

---

## F-ID and Migration Slot Allocation

### CRITICAL: Slot Inventory (Verified 2026-04-26)

[VERIFIED: codebase — `ls supabase/migrations/` + P217/P218/P219/P220 RESEARCH files]

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
| 98–99 | RESERVED — P217 (locked in 217-RESEARCH.md §F-ID) | P217 |
| 100 | `100_crm_schema_identity_graph_hardening.sql` | Existing |
| 101–106 | RESERVED — P218 (locked in 218-01-PLAN.md) | P218 |
| 107–111 | RESERVED — P219 (locked in 219-01-PLAN.md) | P219 |
| **112–117** | **UNOCCUPIED — P216 allocation (Option A)** | **P216** |
| 118+ | UNOCCUPIED | Available for P221+ |

### Slot Ordering Crisis — Resolution (Option A)

**Problem:** P216 executes BEFORE P217 in dependency order (P217 HARD-depends on `saas_health_scores` from P216). But all migration slots upstream of P217 (82-99) are occupied. P216 cannot have a lower slot number than P217's slot 98-99.

**Option A (SELECTED):** P216 = slots 112-117 (post-P219 107-111). Slot numbers are applied in ascending order by Supabase, so P216 slot 112 applies AFTER P217 slot 98. This means `saas_health_scores` table is created AFTER P217's migration runs.

**How this works without breaking P217:** P217's migration SQL (slot 98) does NOT include a `CREATE TABLE saas_health_scores` reference or FK constraint. P217 at slot 98 creates `saas_revenue_metric_definitions`, `saas_mrr_snapshots`, and `saas_nav_visibility` — none of which have FKs into P216 tables. P217 Plan 04 API handlers join `saas_health_scores` at RUNTIME (after P216 has been executed in the real deployment), not at migration time.

**Execution order guarantee:** The `assertUpstreamReady` preflight in P217 Plan 01 checks that `saas_health_scores` EXISTS before P217 executes. If P216 has not run (table missing), P217 halts. The preflight is the dependency gate, not the migration slot order.

**FK direction (CRITICAL):**
- P216 `saas_health_scores` is READ by P217 at runtime (API handlers, MRR snapshot cron)
- P216 `product_usage_events` is READ by P218 PLG signal consumers
- P216 `saas_support_tickets` is READ by P219 expansion signal scanner and P220 support intel
- P216 `saas_churn_interventions` is READ by P219 expansion and P220 partner save offers
- P216 DOES NOT have FKs INTO any P217/P218/P219/P220 table
- P217/P218/P219/P220 MAY add FK constraints referencing P216 tables ONLY in their own migration files (not in P216 migrations)

**V4.1.0-MIGRATION-SLOT-COORDINATION.md:** This file is created by P217 Plan 01 Task 0.1. P216 Plan 01 Task 0.1 must APPEND a P216 section to it (CREATE-OR-APPEND pattern, same as P217). P216's section: `P216 reservation: slots 112-117 + F-IDs F-259..F-270 (execution order: P216 BEFORE P217; slot order: P216 AFTER P217 due to slot collision; FK direction: P217/P218/P219/P220 read P216 tables at runtime)`.

### F-ID Pre-Allocation Table

F-IDs already locked: P220=F-209..F-227; P219=F-228..F-237; P218=F-238..F-246; P217=F-247..F-258. [VERIFIED: 217-RESEARCH.md, 218-01-PLAN.md, 219-RESEARCH.md, 220-RESEARCH.md]

**P216 takes F-259..F-270 (12 IDs).**

| Plan | Domain | Migration Slot | Table(s) Created | F-IDs | Downstream Consumers |
|------|--------|---------------|------------------|-------|----------------------|
| 216-01 | SaaSHealthScore + explainability | 112 (combined) | `saas_health_scores` | F-259 | P217 HARD (assertUpstreamReady checks this table); P218 PLG score consumers |
| 216-02 | Product usage events + PLG signal map | 113 | `product_usage_events`, `product_usage_connectors` | F-260, F-261 | P218 HARD (activation/PQL/upgrade trigger consumers); P219 expansion scanner reads |
| 216-03 | SaaSSupportTicket + KB grounding | 114 | `saas_support_tickets`, `support_kb_groundings` | F-262, F-263 | P219 customer marketing + P220 support intel consumers |
| 216-04 | Churn intervention playbooks + tasks | 115 | `saas_churn_interventions`, `saas_intervention_playbooks` | F-264, F-265 | P219 expansion/save offer boundary; P220 partner save offers |
| 216-05 | Privacy + retention controls (FOUNDATIONAL) | 116 | `data_retention_classes` | F-266 | P217-P228 ALL (downstream INTEGRATES_BY) |
| 216-06 | Growth handoff signal map (planned-only) + closeout | 117 (additive or doc-only) | `growth_signal_map` (planned-only doc insert; no schema) | F-267, F-268 | P218/P219/P220 Plan 01 reads signal map documentation |
| 216-01 | Architecture-lock + assertUpstreamReady contract | no new table | — | F-269 | P216 internal preflight |
| 216-01 | `/v1/saas/health` + `/v1/saas/usage` + `/v1/saas/support` API contracts | no new table | — | F-270 | P217 extends with `/v1/saas/metrics/*` |

**Total: 12 F-IDs (F-259..F-270). 6 migration slots (112-117).**

---

## Per-Domain Deep Dive

### Domain 1: SaaSHealthScore Contract and Explainability (Plan 216-01)

**Requirements:** SAS-07, QA-01..15; integrates_with: [SAS-09 from P217, EVD-01..06 from P209]

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` §SaaS Health Score + `obsidian/work/incoming/16-SAAS-SUITE.md` Part 5. [VERIFIED: both read 2026-04-26]

#### Health Score Dimension Model

The health score is a weighted sum of 5 dimensions. Default weights from canon [VERIFIED: SaaS Suite Canon.md §SaaS Health Score]:

| Dimension | Default Weight | Signals Used | Subscores |
|-----------|---------------|-------------|-----------|
| Product usage | 30% | login frequency vs expected, core feature adoption %, usage trend (30-day slope), active users / licensed seats, last_active recency | 0-100 |
| Support signal | 20% | open unresolved tickets (-8 pts each), recent ticket sentiment, escalations in last 90d (-15 each), CSAT score, feature requests (positive) | 0-100 |
| Billing signal | 20% | payment failures in last 180d, current past_due status (severe penalty), downgrade history, coupon/discount pattern, annual vs monthly | 0-100 |
| Marketing/customer engagement | 15% | email open rate on lifecycle emails (90d), NPS score, community/social engagement, campaign responses, event attendance | 0-100 |
| Relationship depth | 15% | seat count, integration count, data volume created, tenure, champion identified in CRM | 0-100 |

Final score: `Σ(dimension_score × weight)` → clipped 0-100.

Risk bands [VERIFIED: incoming doc Part 5]:

| Band | Score Range | Color | Default Action |
|------|------------|-------|---------------|
| healthy | 80-100 | green | standard lifecycle touches only |
| watch | 60-79 | yellow | increased engagement, proactive CS check-in |
| at_risk | 40-59 | orange | active intervention, save offer consideration (approval required) |
| critical | 0-39 | red | P1 task to CS lead, all automated marketing paused, human outreach within 24h |

#### `saas_health_scores` Table Schema

```sql
-- Migration: 112_saas_health_churn_support_usage.sql
CREATE TABLE saas_health_scores (
  health_score_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  subscription_id         uuid NOT NULL,   -- FK to saas_subscriptions (P214)
  customer_id             uuid NOT NULL,   -- FK to CRM customers (P207 substrate)

  -- Core score
  score                   numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level              text NOT NULL CHECK (risk_level IN ('healthy', 'watch', 'at_risk', 'critical')),
  previous_score          numeric(5,2),
  score_delta             numeric(5,2),    -- computed from previous_score

  -- Explainability (non-negotiable per CONTEXT.md)
  raw_facts               jsonb NOT NULL,  -- dimension inputs before weighting
  dimension_scores        jsonb NOT NULL,  -- {usage: 82, support: 65, billing: 90, engagement: 70, relationship: 75}
  weights                 jsonb NOT NULL,  -- {usage: 0.30, support: 0.20, billing: 0.20, engagement: 0.15, relationship: 0.15}
  confidence              numeric(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1), -- 0 = no data; 1 = fully populated
  trend                   text NOT NULL CHECK (trend IN ('improving', 'stable', 'declining', 'insufficient_data')),

  -- Intervention
  recommended_action      text,            -- human-readable recommended intervention
  intervention_task_id    uuid,            -- FK to task created (nullable — task may not have been created yet)

  -- Evidence linkage (integrates_with: EVD-01..06 from P209)
  evidence_refs           uuid[],          -- evidence_map_record IDs

  -- Audit
  calculated_at           timestamptz NOT NULL DEFAULT now(),
  calculation_version     text NOT NULL DEFAULT 'v1',  -- formula version for calibration tracking
  created_at              timestamptz NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, subscription_id, calculated_at)  -- one score per subscription per calculation run
);
ALTER TABLE saas_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY shs_tenant_isolation ON saas_health_scores
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Index for P217 runtime queries
CREATE INDEX shs_tenant_subscription_idx ON saas_health_scores(tenant_id, subscription_id, calculated_at DESC);
CREATE INDEX shs_risk_level_idx ON saas_health_scores(tenant_id, risk_level, calculated_at DESC);
```

#### DB-Trigger Compliance — `HEALTH_SCORE_REQUIRES_RAW_FACTS`

Per REVIEWS.md MEDIUM concern RM-4: app-layer enforcement alone is bypassable. DB-trigger blocks inserts that lack explainability fields.

```sql
CREATE OR REPLACE FUNCTION enforce_health_score_explainability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.raw_facts IS NULL OR NEW.raw_facts = '{}'::jsonb THEN
    RAISE EXCEPTION 'HEALTH_SCORE_REQUIRES_RAW_FACTS: health_score_id=% must have non-empty raw_facts JSONB', NEW.health_score_id;
  END IF;
  IF NEW.weights IS NULL OR NEW.weights = '{}'::jsonb THEN
    RAISE EXCEPTION 'HEALTH_SCORE_REQUIRES_RAW_FACTS: health_score_id=% must have non-empty weights JSONB', NEW.health_score_id;
  END IF;
  IF NEW.confidence IS NULL THEN
    RAISE EXCEPTION 'HEALTH_SCORE_REQUIRES_RAW_FACTS: health_score_id=% must have non-null confidence', NEW.health_score_id;
  END IF;
  IF NEW.dimension_scores IS NULL OR NEW.dimension_scores = '{}'::jsonb THEN
    RAISE EXCEPTION 'HEALTH_SCORE_REQUIRES_RAW_FACTS: health_score_id=% must have non-empty dimension_scores JSONB', NEW.health_score_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_health_score_explainability
  BEFORE INSERT OR UPDATE ON saas_health_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_health_score_explainability();
```

#### Plan 01 API and MCP Surface

- `GET /v1/saas/health` — returns health score for tenant's subscriptions (paginated, filtered by risk_level)
- `GET /v1/saas/health/:subscription_id` — returns latest health score with full explainability payload
- MCP tool: `get_subscription_health` (registered in `lib/markos/mcp/tools/health.cjs` → `index.cjs`)
- MCP tool: `get_at_risk_accounts` (returns accounts filtered by risk_level threshold)
- Cron: `api/cron/saas-health-score-refresh.js` — daily recalculation for all active subscriptions

#### Wave 0.5 Deliverables (Plan 01)

Plan 01 must ship Wave 0.5 before any implementation tasks:
1. `test/saas-216/preflight/architecture-lock.test.js` — forbidden-pattern detector
2. `scripts/preconditions/216-01-check-upstream.cjs` — HARD gate on P207/P208/P209/P210/P214
3. APPEND `V4.1.0-MIGRATION-SLOT-COORDINATION.md` with P216 reservation (slots 112-117, F-259..F-270)
4. Create `api/v1/saas/` directory (if P217 has not already created it)

---

### Domain 2: Product Usage Event Ingestion and PLG Signal Map (Plan 216-02)

**Requirements:** SAS-07 (usage dimension of health score), QA-01..15; integrates_with: [CONN-01..06 from P210, SAS-09/PLG signals from P218]

**Canon source:** `obsidian/work/incoming/16-SAAS-SUITE.md` Part 7 (Product Usage and PLG); `obsidian/brain/SaaS Suite Canon.md` §Product Usage and Health module. [VERIFIED: both read 2026-04-26]

**Connector decision (from DISCUSS.md, RESOLVED):** Generic product-event ingest first. PostHog/Segment/Amplitude/Mixpanel-specific adapters deferred to v4.2.0. P216 ships a generic event ingestion endpoint + connector adapter pattern via P210 `connector_installs` substrate. The generic connector uses a simple HTTP webhook ingest: event source sends events to `/v1/saas/usage/ingest` with a `connector_id` and `tenant_id`. This mirrors the P210 connector-install auth model.

#### PLG Event Taxonomy

P216 defines the event taxonomy that P218 will consume for activation/PQL/upgrade trigger scoring:

| Event Category | Signals | Downstream Consumer |
|---------------|---------|-------------------|
| `activation` | first_meaningful_action, feature_X_first_use, team_first_invite | P218 ActivationDefinition milestones |
| `adoption` | feature_X_weekly_use, power_user_session, integration_connected | P218 PQL scoring |
| `depth` | advanced_feature_use, automation_created, api_call_made | P218 PQL depth factor |
| `stickiness` | dau_session, weekly_active, dau_wau_ratio | Health score usage dimension |
| `expansion` | seat_added, workspace_created, sub_account_created | P219 expansion signal scanner |
| `plg_readiness` | share_feature_used, export_created, invite_sent | P218 PLG readiness score |
| `churn_signal` | long_session_gap, feature_abandonment, downgrade_exploration | Health score usage dimension, Plan 04 churn playbooks |

#### `product_usage_events` Table Schema

```sql
-- Migration: 113_saas_product_usage_events.sql
CREATE TABLE product_usage_events (
  event_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  subscription_id         uuid,            -- nullable: event may arrive before subscription is matched
  customer_id             uuid,            -- nullable: same as above

  -- Event identity
  connector_id            uuid NOT NULL,   -- FK to connector_installs (P210)
  external_event_id       text,            -- source system event ID (idempotency key)
  event_name              text NOT NULL,   -- raw event name from source system
  event_category          text NOT NULL CHECK (event_category IN (
    'activation', 'adoption', 'depth', 'stickiness',
    'expansion', 'plg_readiness', 'churn_signal', 'other'
  )),

  -- Actor
  user_id_external        text,            -- external user ID (NOT PII-raw — hashed or opaque)
  account_id_external     text,            -- external account ID

  -- Payload
  properties              jsonb,           -- event properties (PII-scrubbed per Plan 05 retention policy)
  occurred_at             timestamptz NOT NULL,

  -- Retention (Plan 05 FOUNDATIONAL)
  retention_class         text NOT NULL,   -- FK to data_retention_classes.class_key
  retention_until         timestamptz NOT NULL,

  -- Audit
  ingested_at             timestamptz NOT NULL DEFAULT now(),
  ingest_source           text NOT NULL CHECK (ingest_source IN ('webhook', 'api', 'csv_import', 'connector_sync'))
);
ALTER TABLE product_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY pue_tenant_isolation ON product_usage_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE INDEX pue_tenant_subscription_idx ON product_usage_events(tenant_id, subscription_id, occurred_at DESC);
CREATE INDEX pue_event_category_idx ON product_usage_events(tenant_id, event_category, occurred_at DESC);
CREATE INDEX pue_connector_idx ON product_usage_events(connector_id, ingested_at DESC);
```

#### `product_usage_connectors` Table Schema

```sql
-- In same migration or separate sub-migration within slot 113
CREATE TABLE product_usage_connectors (
  connector_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  install_id              uuid NOT NULL,   -- FK to connector_installs (P210)
  source_type             text NOT NULL CHECK (source_type IN (
    'generic_webhook', 'posthog', 'segment', 'amplitude',
    'mixpanel', 'heap', 'rudderstack', 'csv_import'
  )),
  event_mapping           jsonb,           -- maps source event names → P216 event_category taxonomy
  is_active               boolean NOT NULL DEFAULT true,
  last_synced_at          timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE product_usage_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY puc_tenant_isolation ON product_usage_connectors
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### DB-Trigger Compliance — `PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH`

```sql
CREATE OR REPLACE FUNCTION enforce_product_usage_tenant_auth()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH: event_id=% must have tenant_id', NEW.event_id;
  END IF;
  IF NEW.connector_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH: event_id=% must have connector_id (mirrors P210 connector substrate)', NEW.event_id;
  END IF;
  IF NEW.retention_class IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH: event_id=% must have retention_class (required by Plan 05 privacy substrate)', NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_product_usage_tenant_auth
  BEFORE INSERT ON product_usage_events
  FOR EACH ROW EXECUTE FUNCTION enforce_product_usage_tenant_auth();
```

#### Plan 02 API and MCP Surface

- `POST /v1/saas/usage/ingest` — generic event ingestion endpoint (accepts connector_id + event payload)
- `GET /v1/saas/usage/summary` — per-subscription usage summary (activation %, stickiness ratio, PLG readiness)
- MCP tool: `get_product_usage_summary` (registered in `lib/markos/mcp/tools/usage.cjs`)
- Cron: `api/cron/saas-usage-health-rollup.js` — daily rollup feeding `saas_health_scores` usage dimension

---

### Domain 3: SaaSSupportTicket + KB Grounding + Classification (Plan 216-03)

**Requirements:** SAS-08, QA-01..15; integrates_with: [CONN-01..06 from P210, EVD-01..06 from P209]

**Canon source:** `obsidian/brain/SaaS Suite Canon.md` §Customer Support module; `obsidian/reference/MarkOS v2 Operating Loop Spec.md` line 51 (`SaaSSupportTicket`); `obsidian/work/incoming/16-SAAS-SUITE.md` Part 6. [VERIFIED: all read 2026-04-26]

**Connector decision (from DISCUSS.md, RESOLVED):** Generic ticket import first. Intercom/Zendesk/HelpScout/HubSpot-specific adapters deferred to v4.2.0. P216 ships a generic support-ticket import endpoint + connector adapter pattern via P210 `connector_installs`. The generic import accepts a normalized `SaaSSupportTicket` JSON shape via CSV or webhook.

**Non-negotiable (from CONTEXT.md):** No customer-facing support response without CS review unless `tenant_safe_auto_response_enabled = true` flag is explicitly set in `saas_suite_activations`.

#### `saas_support_tickets` Table Schema

```sql
-- Migration: 114_saas_support_tickets.sql
CREATE TABLE saas_support_tickets (
  ticket_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  customer_id             uuid,            -- FK to CRM customers (P207 substrate)
  subscription_id         uuid,            -- nullable: ticket may arrive before subscription match

  -- Identity
  ticket_number           text NOT NULL,   -- e.g. SaaS-TICK-00847
  channel                 text NOT NULL CHECK (channel IN ('email', 'chat', 'portal', 'social', 'phone', 'api', 'import')),
  status                  text NOT NULL CHECK (status IN ('new', 'open', 'pending_customer', 'pending_internal', 'resolved', 'closed')),
  priority                text NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),

  -- Content (PII-containing — Plan 05 retention controls apply)
  subject                 text NOT NULL,
  description             text,            -- may be redacted per retention policy
  category                text NOT NULL CHECK (category IN ('billing', 'technical', 'feature_request', 'onboarding', 'account', 'cancellation', 'other')),
  tags                    text[],

  -- AI classification (SAS-05 agent outputs)
  sentiment               text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'frustrated')),
  intent                  text CHECK (intent IN ('get_help', 'report_bug', 'request_feature', 'complaint', 'cancel', 'upgrade', 'billing_dispute')),
  churn_signal            boolean NOT NULL DEFAULT false,
  churn_signal_reason     text,
  topic_tags              text[],          -- AI-extracted topic tags for pattern mining
  urgency_score           numeric(3,2),    -- 0-1 urgency score from classifier

  -- KB grounding and response drafting
  suggested_response      text,            -- AI-drafted response (NOT sent until approved or auto-flag)
  suggested_kb_articles   text[],          -- KB article IDs or URLs used as grounding
  kb_grounding_evidence   uuid[],          -- evidence_map_record IDs (integrates_with P209)
  response_grounding_confidence numeric(3,2), -- 0-1 confidence that KB articles adequately ground the response

  -- Approval gate (non-negotiable: no CS response without approval or auto-flag)
  approval_id             uuid,            -- FK to agent_approval_packages (P208)
  response_dispatched_at  timestamptz,     -- only set AFTER approval or auto-flag
  response_dispatch_method text CHECK (response_dispatch_method IN ('approved', 'safe_auto_response', null)),

  -- Assignment
  assigned_to             uuid,            -- user_id of CS agent
  assigned_at             timestamptz,

  -- SLA
  first_response_sla_hours integer NOT NULL DEFAULT 8,
  resolution_sla_hours    integer NOT NULL DEFAULT 24,
  first_response_at       timestamptz,
  resolved_at             timestamptz,
  sla_breached            boolean NOT NULL DEFAULT false,

  -- CSAT
  csat_requested_at       timestamptz,
  csat_score              integer CHECK (csat_score BETWEEN 1 AND 5),
  csat_comment            text,

  -- Context snapshot (for health score correlation)
  health_score_at_open    numeric(5,2),
  mrr_at_open             numeric(12,2),

  -- Retention (Plan 05 FOUNDATIONAL)
  retention_class         text NOT NULL,   -- FK to data_retention_classes.class_key
  retention_until         timestamptz NOT NULL,

  -- Connector
  connector_id            uuid,            -- FK to connector_installs (P210)
  external_ticket_id      text,            -- source system ticket ID

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY sst_tenant_isolation ON saas_support_tickets
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE INDEX sst_tenant_status_idx ON saas_support_tickets(tenant_id, status, created_at DESC);
CREATE INDEX sst_churn_signal_idx ON saas_support_tickets(tenant_id, churn_signal, created_at DESC);
CREATE INDEX sst_customer_idx ON saas_support_tickets(tenant_id, customer_id, created_at DESC);
```

#### `support_kb_groundings` Table Schema

```sql
-- In same migration slot 114
CREATE TABLE support_kb_groundings (
  grounding_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  ticket_id               uuid NOT NULL REFERENCES saas_support_tickets(ticket_id) ON DELETE CASCADE,
  kb_source_type          text NOT NULL CHECK (kb_source_type IN ('literacy_chunk', 'knowledge_article', 'previous_resolution', 'external_url')),
  kb_source_id            text NOT NULL,   -- literacy chunk ID, article ID, or URL
  kb_source_snippet       text,            -- extracted relevant snippet
  relevance_score         numeric(3,2),    -- 0-1 relevance to ticket content
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_kb_groundings ENABLE ROW LEVEL SECURITY;
CREATE POLICY skg_tenant_isolation ON support_kb_groundings
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### DB-Trigger Compliance — `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG`

This is the strictest of the 5 compliance triggers. It prevents response dispatch without either an approved `approval_id` OR the `safe_auto_response` method — enforcing the CONTEXT.md non-negotiable.

```sql
CREATE OR REPLACE FUNCTION enforce_support_response_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_auto_response_enabled boolean;
BEGIN
  -- Only enforce on response dispatch (response_dispatched_at being SET)
  IF NEW.response_dispatched_at IS NOT NULL AND OLD.response_dispatched_at IS NULL THEN
    -- Must have either approval_id OR safe_auto_response method
    IF NEW.approval_id IS NULL AND (NEW.response_dispatch_method IS DISTINCT FROM 'safe_auto_response') THEN
      RAISE EXCEPTION 'SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG: ticket_id=% cannot dispatch response without approval_id OR safe_auto_response dispatch_method', NEW.ticket_id;
    END IF;
    -- If using safe_auto_response, verify tenant has opted in (requires app layer to stamp dispatch_method)
    IF NEW.response_dispatch_method = 'safe_auto_response' AND NEW.approval_id IS NOT NULL THEN
      RAISE EXCEPTION 'SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG: ticket_id=% cannot have both approval_id and safe_auto_response dispatch_method', NEW.ticket_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_support_response_approval
  BEFORE UPDATE ON saas_support_tickets
  FOR EACH ROW EXECUTE FUNCTION enforce_support_response_approval();
```

#### Plan 03 API and MCP Surface

- `POST /v1/saas/support/import` — generic ticket import (accepts connector_id + ticket JSON)
- `GET /v1/saas/support` — returns paginated tickets with filter by status/priority/churn_signal
- `GET /v1/saas/support/:ticket_id` — returns single ticket with KB grounding and suggested response
- `POST /v1/saas/support/:ticket_id/approve-response` — approval gate for response dispatch
- MCP tool: `get_support_patterns` (returns topic clustering, sentiment trends, SLA breach rate)
- MCP tool: `draft_support_response` (returns AI-drafted response with KB grounding — NOT dispatched)

---

### Domain 4: Churn Intervention Playbooks and Tasks (Plan 216-04)

**Requirements:** SAS-07 (intervention axis), QA-01..15; integrates_with: [TASK-01..05 from P208, PRC-01..09 from P205]

**Canon source:** `obsidian/work/incoming/16-SAAS-SUITE.md` Part 5 §Intervention playbooks; `obsidian/brain/SaaS Suite Canon.md` §Churn Intelligence module; `obsidian/brain/Pricing Engine Canon.md` §Save offers. [VERIFIED: all read 2026-04-26]

**Non-negotiable (from CONTEXT.md):** No save offer, discount, or retention action without Pricing Engine context and approval. `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel required for all offer_details until P205 lands.

#### Playbook Matrix

| Risk Level | Playbook Type | Approval Required | Pricing Engine | Task Priority |
|-----------|--------------|------------------|----------------|---------------|
| watch (60-79) | engagement deepening sequence, proactive CS check-in, in-app feature tips | No (automated touches) | No | P3 task |
| at_risk (40-59) | EBR scheduling task, account brief generation, save offer eligibility check | YES for save offer/pricing | YES (P205 or sentinel) | P2 task to CS owner |
| critical (0-39) | P1 CS escalation, executive outreach, crisis brief, win-back offer design | YES for all external actions | YES (P205 or sentinel) | P1 task to CS lead + exec sponsor |
| billing_risk | dunning awareness task, payment-fail CS flag | No (informational) | No | P2 task |
| champion_loss | relationship alert task, re-engagement sequence | YES for outreach | No | P2 task |
| expansion_opportunity | expansion conversation task (routes to P219 expansion program) | YES for outreach | YES | P2 task |

#### `saas_intervention_playbooks` Table Schema

```sql
-- Migration: 115_saas_churn_interventions.sql
CREATE TABLE saas_intervention_playbooks (
  playbook_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  playbook_name           text NOT NULL,
  trigger_condition       text NOT NULL CHECK (trigger_condition IN (
    'risk_level_watch', 'risk_level_at_risk', 'risk_level_critical',
    'billing_risk', 'champion_loss', 'expansion_opportunity', 'renewal_risk'
  )),
  steps                   jsonb NOT NULL,   -- ordered step list: task_type, auto/manual, approvals
  approval_required       boolean NOT NULL DEFAULT true,
  pricing_required        boolean NOT NULL DEFAULT false, -- if true, pricing_recommendation_id required
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_intervention_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY sip_tenant_isolation ON saas_intervention_playbooks
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

#### `saas_churn_interventions` Table Schema

```sql
-- In same migration slot 115
CREATE TABLE saas_churn_interventions (
  intervention_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  health_score_id         uuid NOT NULL REFERENCES saas_health_scores(health_score_id),
  subscription_id         uuid NOT NULL,
  customer_id             uuid NOT NULL,
  playbook_id             uuid REFERENCES saas_intervention_playbooks(playbook_id),

  -- Intervention type
  intervention_type       text NOT NULL CHECK (intervention_type IN (
    'engagement_deepening', 'ebr_scheduling', 'save_offer',
    'win_back_offer', 'executive_outreach', 'billing_recovery',
    'champion_re_engagement', 'expansion_conversation', 'account_brief'
  )),
  trigger_reason          text NOT NULL,   -- human-readable trigger description

  -- Status
  status                  text NOT NULL CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled', 'rejected')),

  -- Approval gate (required for save offers and external actions)
  approval_id             uuid,            -- FK to agent_approval_packages (P208)

  -- Offer details (Pricing Engine integration)
  offer_details           jsonb,           -- contains pricing offer OR '{{MARKOS_PRICING_ENGINE_PENDING}}' sentinel
  pricing_recommendation_id uuid,          -- FK to pricing_recommendations (P205) — nullable if P205 not landed
  offer_activated_at      timestamptz,     -- set only AFTER approval + pricing confirmed

  -- Outcome
  outcome_jsonb           jsonb,           -- {result: 'retained'/'churned'/'pending', outcome_at: ..., notes: ...}
  task_id                 uuid,            -- FK to task created in P208 substrate

  -- Retention (Plan 05)
  retention_class         text NOT NULL,
  retention_until         timestamptz NOT NULL,

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saas_churn_interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sci_tenant_isolation ON saas_churn_interventions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE INDEX sci_tenant_subscription_idx ON saas_churn_interventions(tenant_id, subscription_id, created_at DESC);
CREATE INDEX sci_status_idx ON saas_churn_interventions(tenant_id, status, created_at DESC);
```

#### DB-Trigger Compliance — `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL`

Mirrors P218/P219 pricing trigger pattern. Blocks save offer activation without either a `pricing_recommendation_id` (P205 landed) or the `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel plus an `approval_id`.

```sql
CREATE OR REPLACE FUNCTION enforce_churn_save_offer_pricing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only enforce when offer_activated_at is being SET for save offers
  IF NEW.offer_activated_at IS NOT NULL AND OLD.offer_activated_at IS NULL
     AND NEW.intervention_type IN ('save_offer', 'win_back_offer') THEN

    -- Must have approval_id
    IF NEW.approval_id IS NULL THEN
      RAISE EXCEPTION 'CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL: intervention_id=% save offer activation requires approval_id', NEW.intervention_id;
    END IF;

    -- Must have pricing_recommendation_id OR sentinel in offer_details
    IF NEW.pricing_recommendation_id IS NULL THEN
      IF NEW.offer_details IS NULL OR
         NOT (NEW.offer_details::text LIKE '%MARKOS_PRICING_ENGINE_PENDING%') THEN
        RAISE EXCEPTION 'CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL: intervention_id=% save offer requires pricing_recommendation_id OR MARKOS_PRICING_ENGINE_PENDING sentinel in offer_details', NEW.intervention_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_churn_save_offer_pricing
  BEFORE INSERT OR UPDATE ON saas_churn_interventions
  FOR EACH ROW EXECUTE FUNCTION enforce_churn_save_offer_pricing();
```

---

### Domain 5: Privacy and Retention Controls — FOUNDATIONAL (Plan 216-05)

**Requirements:** QA-01..15; integrates_with: [COMP-01 from P206]; downstream INTEGRATES_BY: [P217-P228 all phases that touch customer-identifiable data]

**Why foundational:** P216 Plan 05 defines the `data_retention_classes` table and PII classification ENUM that every downstream phase (P217-P228) must reference when creating tables that contain customer-identifiable data. This substrate is foundational in the same sense that P210 connector substrate is foundational — it must exist before downstream phases can comply with it. Plans 216-02 and 216-03 already reference `retention_class` as a NOT NULL column, but the `data_retention_classes` lookup table is defined in Plan 05 (migration slot 116). Plans 02 and 03 migrations must run AFTER Plan 05 in execution order, or use a deferred FK pattern.

**Recommended execution strategy:** Split Plan 05 migration into slot 116 (data_retention_classes table), and have Plans 02, 03, 04 migrations also in slots 113, 114, 115 — all of which come AFTER slot 116 in numeric order. Wait: slots 112-117 map to plans 01-06 respectively. Plan 05 = slot 116. Plans 02/03/04 = slots 113/114/115 (run BEFORE 116). This is a contradiction.

**Resolution:** Move `data_retention_classes` table creation to Plan 01 migration (slot 112), as part of the foundational Wave 0 setup. Plans 02-05 then reference it. Plan 05 migration (slot 116) ADDS retention policy rows for support/product/churn/PII categories and adds any table-level RLS policies. This matches the "Plan 01 is the architectural anchor" principle.

#### PII Classification ENUM

```sql
-- In migration 112 (Plan 01 foundational slot)
CREATE TYPE pii_classification AS ENUM (
  'no_pii',           -- aggregated/anonymized; no restriction
  'pseudonymous',     -- hashed/tokenized identifiers; restricted retention
  'personal',         -- names, emails, identifiable IDs; GDPR/CCPA applies
  'sensitive',        -- health, financial, support text; elevated restriction
  'highly_sensitive'  -- credentials, payment data, legal documents; max restriction
);

CREATE TABLE data_retention_classes (
  class_key           text PRIMARY KEY,            -- e.g. 'support_text', 'product_event', 'health_score'
  display_name        text NOT NULL,
  pii_classification  pii_classification NOT NULL,
  retention_days      integer NOT NULL,             -- default retention in days
  legal_basis         text,                         -- GDPR/CCPA legal basis
  deletion_method     text NOT NULL CHECK (deletion_method IN ('hard_delete', 'anonymize', 'tombstone')),
  review_required_at_days integer,                  -- flag for review before deletion
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
-- No RLS needed (tenant-shared classification table; no tenant_id)

-- Seed rows (canonical P216 retention classes)
INSERT INTO data_retention_classes VALUES
  ('support_text',     'Support ticket content',    'sensitive',     730,  'legitimate_interest', 'anonymize',    700, 'Contains free-text PII from customers'),
  ('product_event',    'Product usage event',       'pseudonymous',  365,  'contract',            'hard_delete',  330, 'User_id_external is hashed; properties scrubbed'),
  ('health_score',     'Account health score',      'pseudonymous',  1825, 'legitimate_interest', 'tombstone',   1800, 'Linked to subscription_id; retain for calibration'),
  ('churn_intervention','Churn intervention record','personal',      1095, 'legitimate_interest', 'tombstone',   1060, 'Contains offer details and outcome context'),
  ('growth_signal',    'Growth handoff signal',     'no_pii',        null, 'legitimate_interest', 'hard_delete',  null, 'Aggregate signals; no PII');
```

#### DB-Trigger Compliance — `SUPPORT_DATA_REQUIRES_RETENTION_POLICY`

This trigger enforces Plan 05's PII retention requirement on both `saas_support_tickets` and `product_usage_events` tables. It runs as a trigger on those tables, not on `data_retention_classes` itself.

```sql
-- Applied to saas_support_tickets (Plan 03 table)
CREATE OR REPLACE FUNCTION enforce_retention_policy_on_ticket()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.retention_class IS NULL THEN
    RAISE EXCEPTION 'SUPPORT_DATA_REQUIRES_RETENTION_POLICY: ticket_id=% must have retention_class', NEW.ticket_id;
  END IF;
  IF NEW.retention_until IS NULL THEN
    RAISE EXCEPTION 'SUPPORT_DATA_REQUIRES_RETENTION_POLICY: ticket_id=% must have retention_until', NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_ticket_retention_policy
  BEFORE INSERT ON saas_support_tickets
  FOR EACH ROW EXECUTE FUNCTION enforce_retention_policy_on_ticket();

-- Applied to product_usage_events (Plan 02 table) — separate function, same pattern
CREATE OR REPLACE FUNCTION enforce_retention_policy_on_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.retention_class IS NULL OR NEW.retention_until IS NULL THEN
    RAISE EXCEPTION 'SUPPORT_DATA_REQUIRES_RETENTION_POLICY: event_id=% must have retention_class and retention_until', NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_usage_retention_policy
  BEFORE INSERT ON product_usage_events
  FOR EACH ROW EXECUTE FUNCTION enforce_retention_policy_on_usage();
```

#### Downstream Consumer Matrix (FOUNDATIONAL)

| Phase | Tables Affected | Retention Classes Used |
|-------|----------------|----------------------|
| P217 | `saas_mrr_snapshots`, `saas_revenue_metric_definitions` | `no_pii` (aggregate revenue data) |
| P218 | `pql_scores`, `activation_definitions`, `in_app_campaigns` | `pseudonymous`, `no_pii` |
| P219 | `abm_account_packages`, `customer_marketing_programs` | `personal`, `pseudonymous` |
| P220 | `community_profiles`, `marketing_events` | `pseudonymous`, `no_pii` |
| P221 | `cdp_identity_graph` | `highly_sensitive`, `personal` |
| P222 | `crm_contacts`, `crm_companies` | `personal`, `sensitive` |
| P223 | `email_sends`, `message_deliveries` | `personal`, `sensitive` |
| P224 | `conversion_events`, `launch_programs` | `personal`, `pseudonymous` |
| P225 | `analytics_definitions`, `attribution_facts` | `pseudonymous`, `no_pii` |
| P226 | `sales_enablement_artifacts` | `personal`, `pseudonymous` |
| P227 | `affiliate_programs`, `community_programs` | `personal`, `pseudonymous` |
| P228 | Cross-engine integration | Inherits from component phases |

---

### Domain 6: Growth Handoff Signal Map + Closeout Regression Suite (Plan 216-06)

**Requirements:** QA-01..15; translation_gate_for: [P218, P219, P220]; integrates_with: [SG-02, SG-03, SG-07, SG-09, SG-10 from P218/P219/P220]

**Nature:** Plan 06 is autonomous=true (UI/handoff documentation only; no agent activation). It mirrors P217 Plan 06 (translation gate) in structure. No new DB tables are created. Plan 06 ships:
1. `docs/growth-handoff/216-growth-signal-map.md` — the growth handoff signal map document
2. A translation gate regression test asserting 0 growth-module agents are runnable=true
3. The P216 closeout regression suite (slot-collision regression + all-domains architecture-lock RE-RUN + requirements-coverage assertion)

#### Growth Signal Map (Summary Table)

The following signals are DOCUMENTED in Plan 06 as planned_only=true until P218/P219/P220 execute. No activation code is shipped.

| P216 Signal Source | P218 Consumer | P219 Consumer | P220 Consumer |
|-------------------|---------------|---------------|---------------|
| `product_usage_events.event_category = 'activation'` | ActivationDefinition milestone matching | — | — |
| `product_usage_events.event_category = 'plg_readiness'` | PQLScore input dimensions | — | — |
| `product_usage_events.event_category = 'expansion'` | UpgradeTrigger expansion detection | AccountExpansionProgram trigger | — |
| `saas_health_scores.risk_level = 'at_risk'` | Mode-eligibility gate input | Expansion signal scanner | CommunityProfile health |
| `saas_health_scores.risk_level = 'critical'` | — | Churn save offer escalation | Partner save offer trigger |
| `saas_support_tickets.churn_signal = true` | — | CustomerMarketingProgram eligibility | CommunityProfile signal |
| `saas_support_tickets.intent = 'cancel'` | — | Expansion/save-offer boundary | — |
| `saas_churn_interventions.intervention_type = 'expansion_conversation'` | — | AccountExpansionProgram enrollment | — |
| `saas_support_tickets.intent = 'upgrade'` | UpgradeTrigger intent detection | — | — |

#### Translation Gate Test

```javascript
// test/saas-216/domain-6/translation-gate.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('P216 Plan 06 — translation gate', () => {
  it('growth module signal map is documented with planned_only=true for all entries', async () => {
    // Read docs/growth-handoff/216-growth-signal-map.md
    // Assert all entries have planned_only: true
    const fs = await import('node:fs/promises');
    const content = await fs.readFile('./docs/growth-handoff/216-growth-signal-map.md', 'utf-8');
    assert.ok(content.includes('planned_only: true'), 'All growth signal map entries must be planned_only=true');
  });

  it('0 growth module agents are runnable=true at P216 close', async () => {
    // Assert growth module agent readiness table has 0 runnable entries
    // (P218 sas_agent_readiness equivalent for growth modules)
    // This test runs against the agent registry files
    const { execSync } = require('node:child_process');
    const result = execSync('grep -r "runnable: true" .agent/markos/agents/markos-growth-*.md', { encoding: 'utf-8', cwd: process.cwd() });
    assert.strictEqual(result.trim(), '', 'No growth module agents should be runnable=true at P216 close');
  });
});
```

---

## Cross-Phase Coordination

### P216 as Foundation for P217-P220

| P216 Table | P217 Consumption | P218 Consumption | P219 Consumption | P220 Consumption |
|-----------|-----------------|-----------------|-----------------|-----------------|
| `saas_health_scores` | HARD prereq (`assertUpstreamReady`); `/v1/saas/health` endpoint reads it; SAS-04 agent input | Mode-eligibility signal (health score feeds growth mode routing) | Expansion signal scanner reads at_risk/critical | CommunityProfile health signals |
| `product_usage_events` | SAS-09 PLG signal dimension (SaaS product adoption tracking) | HARD prereq for ActivationDefinition matching + PQLScore input | AccountExpansion trigger detection | Viral loop activity input |
| `saas_support_tickets` | `/v1/saas/support` endpoint reads it; SAS-05 agent input | — | CustomerMarketingProgram eligibility + advocacy candidate detection | CommunityProfile engagement signal + support intel |
| `saas_churn_interventions` | SAS-04 churn assessment history | — | Expansion/save boundary enforcement (P219 checks P216 intervention history) | Partner save offer eligibility gate |
| `data_retention_classes` | All P217 tables that have customer-identifiable fields MUST reference this | Same | Same | Same |

### Column Contract Lock (Q-1 through Q-5 from REVIEWS.md)

The following column contracts are locked for all P217-P220 consumers. Changes require a cross-phase review.

**`saas_health_scores` locked columns (P217+ consumers must not assume undocumented columns):**
- `health_score_id`, `tenant_id`, `subscription_id`, `score`, `risk_level`, `raw_facts`, `dimension_scores`, `weights`, `confidence`, `trend`, `recommended_action`, `calculated_at`

**`product_usage_events` locked columns (P218+ consumers must not assume undocumented columns):**
- `event_id`, `tenant_id`, `subscription_id`, `customer_id`, `connector_id`, `event_name`, `event_category`, `occurred_at`, `properties`

**`saas_support_tickets` locked columns (P219/P220 consumers):**
- `ticket_id`, `tenant_id`, `customer_id`, `subscription_id`, `status`, `priority`, `category`, `sentiment`, `intent`, `churn_signal`, `sla_breached`, `csat_score`

**`saas_churn_interventions` locked columns (P219/P220 consumers):**
- `intervention_id`, `tenant_id`, `subscription_id`, `customer_id`, `intervention_type`, `status`, `offer_activated_at`, `outcome_jsonb`

### Boundary Verification: P216 vs P217-P220

**P216 / P217 boundary:**
- P216 OWNS: health score creation, raw fact collection, dimension scoring, churn classification
- P217 OWNS: revenue intelligence, MRR snapshots, SAS agent registry, API/MCP/UI surface
- P217 reads P216 data; P216 has NO reference to P217 tables in migrations or DB-triggers

**P216 / P218 boundary:**
- P216 OWNS: product usage event ingestion, event taxonomy, PLG signal map (documentation)
- P218 OWNS: ActivationDefinition, milestone funnels, PQLScore, UpgradeTrigger, InAppCampaign, MarketingExperiment
- P218 reads P216 product_usage_events; P216 has NO reference to P218 tables

**P216 / P219 boundary:**
- P216 OWNS: churn intervention playbooks and tasks (up to and including save offers with approval)
- P219 OWNS: AccountExpansionPrograms, ABMAccountPackages, CustomerMarketingPrograms, advocacy/review workflows, RevenueTeamConfig
- P216 churn interventions of type `expansion_conversation` ROUTE to P219 expansion programs via a FK in P219 tables (direction: P219 → P216); P216 does NOT reference P219

**P216 / P220 boundary:**
- P216 OWNS: support ticket intelligence including churn signals and CSAT data
- P220 OWNS: community health score, events, PR, partnerships, devrel motions
- P220 CommunityProfile reads P216 `saas_support_tickets` at runtime; P216 does NOT reference P220

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` |
| Config file | None — runner is `node --test test/**/*.test.js` |
| Quick run command | `npm test -- test/saas-216/**/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| SAS-07 | Health score has raw_facts, weights, confidence, trend | unit | `npm test -- test/saas-216/domain-1/health-score-explainability.test.js` | Wave 0 |
| SAS-07 | Health score insert without raw_facts is rejected by DB-trigger | unit | `npm test -- test/saas-216/domain-1/health-score-trigger.test.js` | Wave 0 |
| SAS-07 | Health score risk_level matches score band (0-39=critical, 40-59=at_risk, 60-79=watch, 80-100=healthy) | unit | `npm test -- test/saas-216/domain-1/health-score-bands.test.js` | Wave 0 |
| SAS-07 | Churn intervention task is created for at_risk and critical subscriptions | unit | `npm test -- test/saas-216/domain-4/intervention-task-creation.test.js` | Wave 0 |
| SAS-08 | Support ticket insert without retention_class is rejected | unit | `npm test -- test/saas-216/domain-3/support-retention-trigger.test.js` | Wave 0 |
| SAS-08 | Support response dispatch without approval_id AND without safe_auto_response is rejected | unit | `npm test -- test/saas-216/domain-3/support-response-trigger.test.js` | Wave 0 |
| SAS-08 | KB grounding confidence < threshold blocks auto-draft display | unit | `npm test -- test/saas-216/domain-3/kb-grounding-threshold.test.js` | Wave 0 |
| CONN integration | Product event ingest requires connector_id from P210 `connector_installs` | unit | `npm test -- test/saas-216/domain-2/usage-ingest-connector-auth.test.js` | Wave 0 |
| Plan 04 pricing | Save offer activation without approval_id is rejected by DB-trigger | unit | `npm test -- test/saas-216/domain-4/churn-save-offer-trigger.test.js` | Wave 0 |
| Plan 04 pricing | Save offer activation without pricing_recommendation_id or sentinel is rejected | unit | `npm test -- test/saas-216/domain-4/churn-save-offer-sentinel.test.js` | Wave 0 |
| Plan 05 retention | PII insert without retention_class and retention_until is rejected | unit | `npm test -- test/saas-216/domain-5/retention-policy-trigger.test.js` | Wave 0 |
| Plan 05 retention | data_retention_classes seed rows cover all P216 table types | unit | `npm test -- test/saas-216/domain-5/retention-classes-seed.test.js` | Wave 0 |
| Plan 06 gate | 0 growth-module agents are runnable=true at P216 close | unit | `npm test -- test/saas-216/domain-6/translation-gate.test.js` | Wave 0 |
| Architecture-lock | No forbidden patterns in P216 lib/api paths | preflight | `npm test -- test/saas-216/preflight/architecture-lock.test.js` | Wave 0 |
| QA-01..15 | assertUpstreamReady: P207/P208/P209/P210/P214 tables exist | preflight | `node scripts/preconditions/216-01-check-upstream.cjs` | Wave 0 |

### Per-Domain Test Strategy

| Domain | Test Count (approx) | Wave |
|--------|-------------------|------|
| Domain 1 (Health Score) | 12-15 tests | Wave 1 |
| Domain 2 (Product Usage) | 10-12 tests | Wave 2 |
| Domain 3 (Support Tickets) | 12-15 tests | Wave 2 |
| Domain 4 (Churn Playbooks) | 12-15 tests | Wave 3 |
| Domain 5 (Privacy/Retention) | 8-10 tests | Wave 1 (foundational) |
| Domain 6 (Growth Handoff) | 4-6 tests | Wave 4 |
| Preflight (arch-lock + upstream) | 4-6 tests | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- test/saas-216/<current-domain>/`
- **Per wave merge:** `npm test -- test/saas-216/**/*.test.js`
- **Phase gate:** Full suite `npm test` green before `/gsd-verify-work`

### Wave 0 Gaps (All Wave 0 files must be created before any implementation begins)

- [ ] `test/saas-216/preflight/architecture-lock.test.js` — forbidden-pattern detector
- [ ] `test/saas-216/domain-1/health-score-explainability.test.js` — raw_facts + weights + confidence shape
- [ ] `test/saas-216/domain-1/health-score-trigger.test.js` — DB-trigger enforcement
- [ ] `test/saas-216/domain-1/health-score-bands.test.js` — risk level band validation
- [ ] `test/saas-216/domain-2/usage-ingest-connector-auth.test.js` — connector_id required
- [ ] `test/saas-216/domain-3/support-retention-trigger.test.js` — retention_class required
- [ ] `test/saas-216/domain-3/support-response-trigger.test.js` — approval gate enforcement
- [ ] `test/saas-216/domain-3/kb-grounding-threshold.test.js` — confidence threshold
- [ ] `test/saas-216/domain-4/intervention-task-creation.test.js` — task created for at_risk/critical
- [ ] `test/saas-216/domain-4/churn-save-offer-trigger.test.js` — save offer approval gate
- [ ] `test/saas-216/domain-4/churn-save-offer-sentinel.test.js` — pricing sentinel validation
- [ ] `test/saas-216/domain-5/retention-policy-trigger.test.js` — PII retention required
- [ ] `test/saas-216/domain-5/retention-classes-seed.test.js` — seed rows shape check
- [ ] `test/saas-216/domain-6/translation-gate.test.js` — 0 growth agents runnable=true
- [ ] `scripts/preconditions/216-01-check-upstream.cjs` — upstream gate script (all 6 plans)
- [ ] Framework install: `node:test` is built-in — no install needed. Verify `npm test` command works.

---

## Manual-Only Verifications

The following items cannot be automated and require explicit human sign-off before phase close.

| Item | Owner | Criteria |
|------|-------|----------|
| Health score default weight tuning | Product + CS team | 5 default weights (30/20/20/15/15) produce risk_level bands that match operator intuition on test account set |
| PII classification audit | Privacy/Legal | All `retention_class` values in P216 tables are correctly classified under the `pii_classification` ENUM |
| Support response auto-mode safety review | CS lead + security | `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` trigger is reviewed by CS lead; `tenant_safe_auto_response_enabled` flag can only be set by operator (not by AI agent) |
| Churn playbook outcome review | CS + Product | Playbook steps matrix reviewed for unintended automated customer-facing actions |
| Growth handoff signal map review | Product team | `docs/growth-handoff/216-growth-signal-map.md` is reviewed and agreed as the canonical P218/P219/P220 input signal contract |
| KB grounding confidence threshold | CS + AI team | Minimum grounding confidence before auto-draft is surfaced is set to a value CS approves |

---

## Decisions Locked

Promoted from `DISCUSS.md` Decision Matrix — these decisions are LOCKED and plans must not reopen them.

| Decision Area | Locked Choice | Rationale |
|--------------|---------------|-----------|
| Health score model | Fixed default weights (30/20/20/15/15) per SaaS Suite Canon; tenant-tunable config deferred to v4.2.0 | Matches canon; tenant-tunable complexity deferred; weights exposed in `weights` JSONB column |
| Product analytics connector | Generic product-event ingest via HTTP webhook + P210 connector substrate; PostHog/Segment/Amplitude/Mixpanel-specific adapters deferred to v4.2.0 | DISCUSS "generic event ingest" recommendation confirmed; specific connectors add value in v4.2.0 |
| Support systems connector | Generic ticket import (HTTP webhook + CSV + normalized JSON) + P210 connector substrate; Intercom/Zendesk/HelpScout/HubSpot deferred to v4.2.0 | DISCUSS "generic ticket object plus first connector decided by research" — research resolves as generic-first |
| Response autonomy | Approval-only by default; tenant opt-in via `tenant_safe_auto_response_enabled` flag; no autonomous sends in v1 | CONTEXT.md non-negotiable; DISCUSS Decision matrix "approval-only by default" |
| Churn interventions | Playbook suggestions and tasks; NO automatic offers; save offers and external actions require approval_id + pricing context | CONTEXT.md non-negotiable; DISCUSS "playbook suggestions and tasks; no automatic offers" |
| Growth handoff | Reserve signal map for PLG/PQL/expansion/advocacy/community/experiments (planned_only=true); do NOT activate growth modules in P216 | CONTEXT.md non-negotiable (item 5); DISCUSS "Reserve signal map" |
| Migration slots | Option A: slots 112-117 (post-P219 107-111); execution-order P216 → P217 maintained via assertUpstreamReady preflight, not slot numbers | REVIEWS.md MEDIUM RM-7/RM-9 consensus; Option C (renumber) explicitly rejected as too disruptive for V4.1.0 |
| F-ID range | F-259..F-270 (avoids P220: F-209..F-227, P219: F-228..F-237, P218: F-238..F-246, P217: F-247..F-258) | REVIEWS.md MEDIUM RM-8 suggestion; confirmed non-monotonic is cosmetic |
| Compliance enforcement | DB-trigger per domain (5 named triggers, not app-only); see §DB-Trigger Compliance per domain | REVIEWS.md MEDIUM RM-4; P226 RH5/RH6 lesson; P217/P218/P219/P220 pattern |
| Requirements ownership | SAS-07, SAS-08 OWNED; SAS-09 INTEGRATES (P217 owns); EVD-01..06 INTEGRATES (P209 owns); TASK-01..05 INTEGRATES (P208 owns); CONN-01..06 INTEGRATES (P210 owns); SG-02/03/07/09/10 translation_gate_for [P218/P219/P220] | REVIEWS.md MEDIUM RM-5/RM-6/RM-7/RM-8 |

---

## Open Questions / Decision Points

### Q-1: `saas_health_scores` column contract stability

- **What we know:** P217, P218, P219, P220 all consume `saas_health_scores` at runtime. Column contract table is documented in §Per-Domain Deep Dive Domain 1.
- **What's unclear:** Whether P218 mode-eligibility gate needs additional columns beyond `score`/`risk_level` (e.g., a `plg_readiness_sub_score` column).
- **Recommendation:** Lock the current column set. P218 Plan 01 may request an additive ALTER TABLE if it needs a PLG-specific health sub-score. Do NOT pre-allocate speculative columns.

### Q-2: `product_usage_events` schema sufficiency for P218 PLG consumers

- **What we know:** P218 activation/PQL/upgrade trigger consumers need `event_category` + `event_name` + `occurred_at` + `subscription_id`. These are all in the proposed schema.
- **What's unclear:** Whether P218 needs `user_id_external` for individual user-level PQL scoring (vs account-level aggregation). The current schema includes `user_id_external` as hashed/opaque.
- **Recommendation:** Keep `user_id_external` as a pseudonymous (hashed) field under `pseudonymous` retention class. P218 PQL scoring uses account-level aggregation for v1; individual-level scoring is a v4.2.0 enhancement.

### Q-3: Support ticket connector scope for v1

- **What we know:** Generic import is confirmed. The connector adapter pattern is via P210 `connector_installs`.
- **What's unclear:** Whether generic import means ONLY a CSV/JSON file import endpoint, or also a live webhook listener for real-time ticket events from external systems.
- **Recommendation:** Ship both: (a) `POST /v1/saas/support/import` for batch import (CSV/JSON); (b) `POST /v1/saas/support/webhook/:connector_id` for live webhook ingest. The webhook path uses the same `x-connector-auth` header verification as P210 connector substrate.

### Q-4: Plan 05 migration slot ordering relative to Plans 02/03/04

- **What we know:** `data_retention_classes` table must exist before Plans 02/03/04 tables can reference `retention_class`. Plan 05 = slot 116, Plans 02/03/04 = slots 113/114/115.
- **Resolution:** Move `data_retention_classes` CREATE TABLE into Plan 01 migration (slot 112) as a foundational sub-task. Plan 05 migration (slot 116) adds seed rows and any ALTER TABLE changes needed for privacy reporting.
- **Status:** RESOLVED in §Per-Domain Deep Dive Domain 5. Planner must honor this.

### Q-5: Privacy substrate downstream notification mechanism

- **What we know:** P217-P228 all need to reference P216's `data_retention_classes` table.
- **What's unclear:** How to notify P218/P219/P220 planners of the exact class_key values to use.
- **Recommendation:** Document in `docs/growth-handoff/216-growth-signal-map.md` (Plan 06 output) which `retention_class` values each signal type uses. P217/P218/P219/P220 Plan 01 Wave 0.5 tasks include a "verify retention_class values from P216" step.

### Q-6: V4.1.0-MIGRATION-SLOT-COORDINATION.md APPEND sequencing

- **What we know:** P217 Plan 01 Task 0.1 CREATES this file. P216 Plan 01 Task 0.1 must APPEND.
- **What's unclear:** If P216 executes before P217 (which it must per assertUpstreamReady dependency), the file doesn't exist yet when P216 runs.
- **Resolution:** P216 Plan 01 Task 0.1 uses CREATE-OR-APPEND pattern (same as P217 uses CREATE-OR-APPEND to be safe against ordering). If file doesn't exist, P216 creates it with its own section; P217 then appends its section.

### Q-7: Connector adapter pattern shared with P210

- **What we know:** P210 owns `CONN-01..06`. P216 Plans 02 and 03 USE connector_installs from P210.
- **What's unclear:** Whether P210 `connector_installs` already has a `connector_type` field that distinguishes `product_analytics` vs `support_platform` vs `billing` connectors, or whether P216 must extend the P210 table.
- **Recommendation:** P216 adds `product_usage_connectors` and a parallel `support_ticket_connectors` table (or uses `connector_type` ENUM extension in P210 via a migration in slot 112 or 113 — requires coordination with P210 plan). If P210 already shipped a `connector_type` ENUM, P216 adds rows; if not, P216 adds the ENUM via ALTER TABLE in its own migration. Mark as `[ASSUMED: P210 has connector_type ENUM; verify in P210 migration SQL before writing P216 Plan 02]`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `api/v1/saas/` directory is created by P217 Plan 04; P216 can append handlers to it | §Architecture Lock | If P217 has not landed, P216 cannot add to that directory — P216 Plan 01 must create the directory itself |
| A2 | P210 `connector_installs` table has columns sufficient for P216 to use `connector_id` FK | §Domain 2 + §Domain 3 | If P210 schema is different, P216 connector adapter pattern needs adjustment |
| A3 | P209 `evidence_map_records` table accepts UUID array references from `saas_health_scores.evidence_refs` | §Domain 1 | If P209 uses a different FK pattern, evidence linkage approach changes |
| A4 | P208 `agent_approval_packages` can be referenced by `approval_id` FK in P216 tables | §Domain 3 + §Domain 4 | If P208 uses a different table name or column, approval FK references break |
| A5 | P207 CRM task substrate accepts task creation from P216 churn intervention playbooks via the existing task primitives | §Domain 4 | If P207 task creation API has changed, Plan 04 churn task creation code path changes |
| A6 | `tenant_safe_auto_response_enabled` flag exists in P214 `saas_suite_activations` table | §Domain 3 DB-trigger | If P214 does not have this flag, Plan 03 must add it via ALTER TABLE in P216 Plan 03 migration |
| A7 | P220 growth module agents have files under `.agent/markos/agents/markos-growth-*.md` path | §Domain 6 | If agent file naming convention differs, translation gate test path changes |

**Verified claims (not assumptions):** Architecture helpers (`requireHostedSupabaseAuth`, `buildApprovalPackage`, `resolvePlugin`, `lib/markos/mcp/tools/index.cjs`, `contracts/openapi.json`), migration slot inventory (37-100 confirmed on disk), F-ID ranges for P217-P220 (confirmed from peer RESEARCH files), health score dimension weights and schema (confirmed from SaaS Suite Canon.md and incoming doc), support ticket schema (confirmed from incoming doc Part 6), DB-trigger exception names (derived from REVIEWS.md RM-4 specification).

---

## Sources

### Primary (HIGH confidence)

- `obsidian/brain/SaaS Suite Canon.md` — SaaSHealthScore dimensions/weights, SaaSSupportTicket fields, SAS-04/SAS-05 agents, churn playbook matrix, Pricing Engine relationship [VERIFIED: read 2026-04-26]
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — object shape for SaaSHealthScore and SaaSSupportTicket (lines 50-51), approval gate contract, SaaS Suite contract, verification gates [VERIFIED: read 2026-04-26]
- `obsidian/work/incoming/16-SAAS-SUITE.md` — health score calculation (Part 5), intervention playbooks (Part 5), support ticket schema (Part 6), processor routing, DIAN compliance [VERIFIED: read 2026-04-26]
- `obsidian/brain/Pricing Engine Canon.md` — save offer and discount approval requirements [VERIFIED: read 2026-04-26]
- `.planning/REQUIREMENTS.md` — requirement ownership traceability table (lines 209-230) [VERIFIED: read 2026-04-26]
- `.planning/phases/216-saas-suite-health-churn-support-usage/216-REVIEWS.md` — slot ordering crisis analysis, DB-trigger exception names, ownership flip decisions [VERIFIED: read 2026-04-26]
- `.planning/phases/216-saas-suite-health-churn-support-usage/DISCUSS.md` — Decision matrix (6 locked decisions) [VERIFIED: read 2026-04-26]
- `supabase/migrations/` listing — slot inventory 37-100 [VERIFIED: glob 2026-04-26]
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` function signature [VERIFIED: read 2026-04-26]
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` [VERIFIED: grep 2026-04-26]

### Secondary (MEDIUM confidence)

- `.planning/phases/217-saas-suite-revenue-agents-api-ui/217-RESEARCH.md` — slot reservation confirmation (P217=98-99), F-ID ranges (P217=F-247..F-258, P218=F-238..F-246, P219=F-228..F-237, P220=F-209..F-227), assertUpstreamReady includes saas_health_scores [VERIFIED: read 2026-04-26]
- `.planning/phases/218-saas-growth-profile-plg-inapp-experimentation/218-RESEARCH.md` — P218 P216 consumption patterns, slot 101-106 confirmed [VERIFIED: read 2026-04-26]
- `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/219-RESEARCH.md` — P219 P216 consumption patterns, slot 107-111 confirmed [VERIFIED: read 2026-04-26]
- `obsidian/reference/Database Schema.md` — existing migration landscape, CRM substrate [VERIFIED: read 2026-04-26]

### Tertiary (LOW confidence — marked for validation)

- Health score weight calibration values (30/20/20/15/15) — from canon [ASSUMED: match operator intuition; requires manual validation per §Manual-Only Verifications]
- KB grounding confidence threshold value — not specified in any canonical source [ASSUMED: 0.7 is a reasonable default; requires CS team review]
- P210 `connector_installs` column names and ENUM types — [ASSUMED: sufficient for P216 FK patterns; verify against P210 migration SQL before P216 Plan 02 execution]

---

## Metadata

**Confidence breakdown:**
- Architecture lock: HIGH — all helpers verified on disk; slot inventory verified; DB-trigger exception names from REVIEWS.md
- Schema shapes: HIGH — derived from canon (SaaS Suite Canon, Operating Loop Spec, incoming doc Part 5+6)
- Requirements ownership: HIGH — derived from REQUIREMENTS.md traceability table + REVIEWS.md ownership analysis
- F-ID/slot allocation: HIGH — derived from verified peer RESEARCH files (P217/P218/P219/P220)
- Upstream dependencies: HIGH — derived from P217-RESEARCH.md assertUpstreamReady list + REVIEWS.md RM-2
- Cross-phase coordination: HIGH — derived from P217/P218/P219/P220 RESEARCH consumption patterns
- Connector adapter details: MEDIUM — generic-first locked; specific adapter shapes deferred
- Health score weight tuning: LOW — defaults from canon; requires operator calibration

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days for stable canon-derived research)

---

## RESEARCH COMPLETE
