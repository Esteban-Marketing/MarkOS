# Phase 218: SaaS Growth Profile, PLG, In-App, and Experimentation — Research

**Researched:** 2026-04-26
**Domain:** SaaS Growth OS — growth-mode profile routing, PLG activation, PQL scoring, upgrade triggers, in-app campaign orchestration, and marketing experimentation
**Confidence:** HIGH for codebase-grounded claims and canon-derived schema shapes, HIGH for architecture-lock (verified on disk), MEDIUM for migration slot numbers (P219/P220 slot collision discovered — see §6), LOW for exact PQL threshold values (operator-configured, not pre-set)
**Replaces:** 25-line stub created during initial seeding pass

---

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support | Owns / Integrates |
|----|------------------------------------------------|------------------|-------------------|
| SG-01 | SaaS tenants have a growth-mode profile (`b2b`, `b2c`, `plg_b2b`, `plg_b2c`, `b2b2c`) driving active modules, metrics, agents, UI, approvals, and playbooks | §7 Domain 1 — `saas_growth_profiles` + `module_mode_eligibility` + mode routing DB-trigger | OWNS |
| SG-02 | PLG capability: activation definitions, milestone funnels, PQL scoring, upgrade triggers, product usage interventions, in-app conversion prompts | §7 Domains 2–3 — `activation_definitions` + `pql_scores` + `upgrade_triggers` | OWNS |
| SG-05 | In-app marketing: event/page/segment/time triggers, frequency caps, suppression logic, customer-experience approvals, and email/support/CS coordination | §7 Domain 4 — `in_app_campaigns` + suppression matrix + frequency-cap DB-trigger | OWNS |
| SG-07 | Growth experimentation: experiment registry, ICE-ranked backlog, guardrails, approval gates, decision records, and learning promotion | §7 Domain 5 — `marketing_experiments` + ICE scoring + guardrail DB-trigger | OWNS |
| SG-09 | Growth modules create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec | §15 Anti-patterns — all 5 active domains must produce tasks/approvals/learnings | OWNS (cross-domain) |
| SG-10 | Target growth agent tiers are not active implementation truth until GSD assigns contracts, costs, approval posture, tests, API/MCP/UI surfaces, and failure behavior | §7 Domain 6 — `plg_growth_agent_readiness` registry (runnable=false generated column) | OWNS |
| SG-11 | Pricing-sensitive growth prompts (upgrade nudges, save offers, in-app pricing copy) consume Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}` | §7 Domains 3+4 — UpgradeTrigger + InAppCampaign pricing FK or sentinel | OWNS (cross-domain) |
| SG-12 | External customer-facing actions require approval by default unless earned-autonomy policy exists | §7 every domain — `buildApprovalPackage` wiring across all 5 active domains | OWNS (cross-domain) |
| SAS-09 | SaaS product usage and revenue intelligence expose PLG signals as tasks, alerts, or decisions | §8 Cross-Phase — P218 CONSUMES SAS-09 signals (P217 base), not re-defines | INTEGRATES (P217 owns) |
| PRC-09 | Pricing copy in billing and public pricing surfaces consumes approved PricingRecommendation or uses sentinel | §7 Domains 3+4 — UpgradeTrigger conversion prompts + InAppCampaign monetization copy | OWNS Plans 03+04 |
| QA-01..15 | Phase 200 Quality Baseline gates apply | §10 Validation Architecture | OWNS (cross-domain) |
| LRN-01..05 | ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate substrates | §7 Domain 5 — experiment learning writes to P212 substrates (writes, does not redefine) | INTEGRATES (P212 owns) |

**LRN-01..05 ownership note:** REQUIREMENTS.md line 221 maps `LRN-01..05 | Phase 212`. P218 Plan 05 INTEGRATES — experiment decisions write to `ArtifactPerformanceLog`/`TenantOverlay`/`LiteracyUpdateCandidate` as downstream consumers of the P212 substrate. Plan 05 frontmatter must use `integrates_with: [LRN-01..05]` not `requirements:`.

**SAS-09 ownership note:** REQUIREMENTS.md line 226 maps `SAS-09 | Phase 217`. P218 Plan 01 CONSUMES SAS-09 signals (usage + revenue intelligence) to gate mode eligibility. Plan 01 frontmatter must use `integrates_with: [SAS-09 from P217]` not `requirements:`.
</phase_requirements>

---

## Executive Summary

Phase 218 ships the **foundational growth substrate** of the v4.1.0 SaaS milestone. It is the upstream gate for both P219 (B2B expansion/ABM/advocacy) and P220 (viral/community/events/PR/partnerships/devrel). Without P218's `saas_growth_profiles` table and `module_mode_eligibility` matrix, neither downstream phase can enforce its mode-activation invariants.

The phase covers five active implementation domains (Plans 01-05) plus one agent-readiness closure (Plan 06). The central architectural decision is the **module_mode_eligibility matrix**: whether to ship this as a static hardcoded map in app layer OR a dynamic `module_mode_eligibility` DB table governed by a `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` trigger. Research recommends the dynamic table because: (a) it is queryable by downstream phases at migration time, (b) the DB-trigger approach is defense-in-depth against app-layer bypass (P226 RH5/RH6 lesson), and (c) P219/P220 Plan 01 migrations can check eligibility via a simple JOIN rather than requiring runtime orchestration.

**Two plans (03 and 04) carry Pricing Engine dependencies.** The recommended pattern is SOFT dependency on P205 with `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel fallback — identical to P219 Plan 05 and P220 cross-domain approach. Hard-fail on P205 absent would block P218 execution indefinitely.

**Critical slot-collision finding:** P219 research (219-RESEARCH.md line ~299) assumed P218 would occupy migration slots 82-84. This is incorrect — slots 82 through 89 are fully occupied by existing foundation migrations (82=audit_hash_chain, 83=unverified_signups, 84=passkey_credentials, 85=sessions_devices, 86=custom_domains_ext, 87=invites_lifecycle, 88=mcp_sessions, 89=mcp_cost_window). P220's plans locked slots 90-95+97. Slot 96 is the neuro_literacy_metadata existing migration. Slot 100 is crm_schema_identity_graph_hardening. The actual available slots for P218 are 101-103. P219 should revise to 104-108. This collision must be resolved before any migration SQL is written.

**Primary recommendation:** Ship P218 as six plan clusters (matching the 6 DISCUSS.md slices) with Plan 01 being the most critical — it ships the foundational `saas_growth_profiles` table, `module_mode_eligibility` dynamic table, and the `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` DB-trigger pattern that P219+P220 depend on.

---

## User Constraints (from CONTEXT.md)

CONTEXT.md is a 25-line stub. The following represents the locked inputs from that stub plus canonical constraints per CLAUDE.md source-of-truth precedence.

### Locked Decisions

1. Canonical inputs are: `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`, `obsidian/brain/SaaS Marketing OS Strategy Canon.md`, `obsidian/brain/SaaS Suite Canon.md`, `obsidian/brain/Pricing Engine Canon.md`, `obsidian/reference/MarkOS v2 Operating Loop Spec.md`, and `.planning/REQUIREMENTS.md` IDs SG-01, SG-02, SG-05, SG-07, SG-09, SG-10, SG-11, SG-12, SAS-09, PRC-09.
2. Phase shape is 6 plan slices: (1) SaaSGrowthProfile + 5-mode routing, (2) ActivationDefinition + milestone funnels + PQLScore, (3) UpgradeTrigger + pricing-safe conversion prompts, (4) InAppCampaign + suppression + frequency caps + approvals, (5) MarketingExperiment + ICE backlog + guardrails + decisions, (6) PLG/in-app/experiment agent readiness (non-runnable gate).
3. Non-negotiables (verbatim from CONTEXT.md):
   - No in-app prompt, upgrade nudge, discount, save offer, or pricing copy bypasses Pricing Engine.
   - No experiment runs without guardrails, owner, decision criteria, and learning handoff.
   - No customer-facing in-app action bypasses approval unless an earned-autonomy policy exists.

### Claude's Discretion

Because CONTEXT.md is a stub, the decision surface beyond canonical inputs is Claude's discretion subject to:
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` (vault canon — wins for product shape)
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` (spec — wins for object shape)
- P218-REVIEWS.md Medium concerns (SAS-09/LRN ownership, mode matrix, compliance boundaries, F-ID/slot allocation, P205 fallback strategy)
- P219/P220 coordination (P218 mode profile is their upstream FK)
- P205 Pricing Engine (Plans 03+04 need hard-prereq OR sentinel fallback)

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of `/v1/growth/*` — kept on legacy `api/*.js` (architecture-lock)
- ABM module, buying committee mapping, account expansion — deferred to P219
- B2C viral loops, referral programs, community, events, PR, partnerships, devrel — deferred to P220
- Real-time PostHog/Mixpanel native integration — P218 stores `event_name` string only; integration is operator-configured
- Anti-fraud ML models for in-app campaign targeting — rule-based suppression only in v1
- A/B test execution engine (running live traffic splits) — P218 stores experiment registry + results; execution is operator-external or PostHog-native

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions. Any plan that contradicts these must stop and flag per drift rule.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Marketing OS Strategy Canon.md` defines the 5-mode operating model, growth engine module list, target agent tiers, and approval-and-safety posture. P218 schema and policy MUST match this canon.
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` line 53-55 defines the exact object shapes for `SaaSGrowthProfile`, `ActivationDefinition`, `PQLScore`, `InAppCampaign`, `MarketingExperiment`. P218 column shapes MUST match the v2 spec.
3. **Engineering execution state wins:** `.planning/STATE.md` shows Phase 204 is the active phase; P218 plans MUST NOT execute before P214-P217 land.
4. **Drift rule:** If P218 plans define schema that contradicts vault brain/reference, STOP and flag — do NOT silently reconcile.

### Placeholder rule (MUST)

`{{MARKOS_PRICING_ENGINE_PENDING}}` is required wherever upgrade prompt copy, in-app pricing copy, save offer messaging, or discount posture is written before an approved `PricingRecommendation` exists. Plans 03 and 04 use this sentinel in `upgrade_triggers.prompt_copy` and `in_app_campaigns.content_jsonb` copy fields until P205 lands.

### CLI / tests (MUST)

- Run tests with `npm test` or `node --test test/**/*.test.js` — NO vitest, NO playwright. [VERIFIED: package.json `"test": "node --test test/**/*.test.js"`]
- Test files: `.test.js` extension and `node:test` + `node:assert/strict` imports.
- Test fixtures: `.js` (NOT `.ts`).

---

## Phase Scope: 6 Domains

| Plan | Domain | Key Objects | Requirements Owned |
|------|--------|------------|---------------------|
| 218-01 | SaaSGrowthProfile + 5-mode routing + module eligibility matrix | `saas_growth_profiles`, `module_mode_eligibility` | SG-01, QA-01..15 |
| 218-02 | ActivationDefinition + milestone funnels + PQLScore | `activation_definitions`, `activation_milestones`, `pql_scores` | SG-02, QA-01..15 |
| 218-03 | UpgradeTrigger + pricing-safe conversion prompts | `upgrade_triggers`, `upgrade_trigger_events` | SG-02 (upgrade), SG-11, PRC-09 (Plan 03 side), QA-01..15 |
| 218-04 | InAppCampaign + suppression + frequency caps + approvals | `in_app_campaigns`, `in_app_campaign_deliveries`, `in_app_suppression_rules` | SG-05, SG-11, SG-12, PRC-09 (Plan 04 side), QA-01..15 |
| 218-05 | MarketingExperiment + ICE backlog + guardrails + decisions | `marketing_experiments`, `experiment_guardrails`, `experiment_decisions` | SG-07, SG-09 (experiment axis), QA-01..15; integrates_with: LRN-01..05 (P212) |
| 218-06 | PLG/in-app/experiment agent readiness + non-runnable gate | `plg_growth_agent_readiness` | SG-10, QA-01..15 |

**SG-09, SG-10, SG-11, SG-12 cross-domain:** Each domain enforces its slice of SG-09 (must produce tasks/approvals), SG-11 (pricing-safe), and SG-12 (approval-gated external mutations). SG-10 enforcement lives entirely in Plan 06.

---

## Architecture Lock

This section MUST be verified in Plan 218-01 Task 0.5 (first task in Wave 1 — matching P219/P220/P221-P228 architecture-lock model).

### Pin Table

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/*.js` flat handlers (`api/v1/growth/saas-growth-profiles.js`, etc.) | Filesystem: `api/` contains `*.js` only [VERIFIED: codebase] |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep confirmed 2026-04-26 [VERIFIED: codebase] |
| OpenAPI registry | `contracts/openapi.json` | Filesystem confirmed [VERIFIED: codebase] |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS, NOT `.ts`) | Filesystem confirmed [VERIFIED: codebase] |
| Test runner | `npm test` → `node --test test/**/*.test.js` | package.json [VERIFIED: codebase] |
| Test imports | `node:test` + `node:assert/strict` | Architecture-lock carry-forward P221-P228 |
| Test extension | `*.test.js` (NOT `.test.ts`) | Architecture-lock carry-forward |
| Cron auth | `x-markos-cron-secret` header matching `MARKOS_GROWTH_CRON_SECRET` env | `api/cron/webhooks-dlq-purge.js` pattern [VERIFIED: codebase] |
| Cron response | `{ success: boolean, count: number, duration_ms: number }` JSON | Same pattern [VERIFIED: codebase] |
| Audit emit | `lib/markos/audit/*` (SHA-256 hash chain per migration 82) | Filesystem [VERIFIED: codebase] |
| Tombstone | `lib/markos/governance/*` deletion workflow (migration 56) | Filesystem [VERIFIED: codebase] |
| App Router | OUT OF SCOPE — P218 has NO public-facing App Router routes | Architecture-lock |
| DB-trigger auth | `BEFORE INSERT OR UPDATE` triggers per domain (NOT app-only enforcement) | P226 RH5/RH6 lesson [VERIFIED: P219/P220 pattern] |

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
| `lib/markos/runtime-context.cjs` | (does NOT exist at this path) | NOT FOUND [VERIFIED: codebase] | Use `onboarding/backend/runtime-context.cjs` |

**Note on `lib/markos/runtime-context.cjs`:** This path does NOT exist. The correct path is `onboarding/backend/runtime-context.cjs`. P219/P220 research confirmed the same. Plans must NEVER reference `lib/markos/runtime-context.cjs`.

### Forbidden Patterns

Architecture-lock test asserts grep count = 0 across all P218 lib/api paths:

```
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/b2b/          (P219 ships this — not yet available)
lib/markos/referral/     (P220 ships this)
lib/markos/community/    (P220 ships this)
lib/markos/events/       (P220 ships this)
lib/markos/pr/           (P220 ships this)
lib/markos/partnerships/ (P220 ships this)
lib/markos/sales/        (P226 ships this)
lib/markos/cdp/          (P221 ships this)
lib/markos/conversion/   (P224 ships this)
lib/markos/launches/     (P224 ships this)
lib/markos/analytics/    (P225 ships this)
lib/markos/channels/     (P223 ships this)
lib/markos/ecosystem/    (P227 ships this)
public/openapi.json
app/(growth)/
app/(plg)/
route.ts
vitest
playwright
openapi-generate
.test.ts
```

The architecture-lock test (`test/growth-218/preflight/architecture-lock.test.js`) ships in Plan 218-01 Task 0.5 — first task in Wave 1.

---

## Upstream Dependencies (assertUpstreamReady Gate)

### Hard Upstreams (P218 MUST fail preflight if these tables are missing)

| Phase | Table to Check | Why P218 Needs It | Hard / Soft |
|-------|---------------|-------------------|-------------|
| P214 | `saas_suite_activations` | SaaSSuiteActivation — only `business_type = saas` tenants activate growth profile | HARD |
| P215 | `billing_periods`, `tenant_billing_subscriptions` | Billing engine — UpgradeTrigger events route through billing subscription lifecycle | HARD |
| P216 | `saas_health_scores` | Health scores feed PQL scoring signals (health_score dimension), activation monitoring, and upgrade trigger timing | HARD |
| P217 | `saas_mrr_snapshots` (SaaS MRR table from P217) | SAS-09 revenue intelligence signals gate `saas_growth_profiles.mode` eligibility check and module activation | HARD |

### Soft Upstreams (degrade gracefully)

| Phase | Why Optional | Fallback |
|-------|-------------|----------|
| P205 | Pricing Engine — Plans 03+04 UpgradeTrigger + InAppCampaign pricing copy | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; log warning; never block |
| P207 | AgentRun v2 — PLG agents emit AgentRun records | Stub to `noopAgentRunEmit()` if not yet shipped |
| P208 | Approval Inbox UI — in-app campaign approvals show up in operator inbox | DB rows still created via `buildApprovalPackage`; UI degrades to manual SQL query |
| P209 | EvidenceMap — PQL score evidence_refs validation | Soft warn if evidence_refs empty; upgrade to hard-fail once P209 ships |
| P210 | ConnectorInstall — PostHog/analytics connector for activation events | P218 stores `event_name` string only; activation event firing is operator-external |
| P211 | Pricing-engine-pending sentinel infrastructure | Use string literal `{{MARKOS_PRICING_ENGINE_PENDING}}` directly |
| P212 | P212 LRN substrate — ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate | Experiment learning writes are best-effort if P212 tables absent; core experiment registry works independently |

### Preflight Script Pattern

```cjs
// scripts/preconditions/218-01-check-upstream.cjs
'use strict';
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_TABLES = [
  'saas_suite_activations',          // P214 hard prereq
  'saas_health_scores',              // P216 hard prereq
];
const SOFT_TABLES = [
  'pricing_recommendations',         // P205 soft prereq
  'markos_agent_runs',               // P207 soft prereq
  'artifact_performance_logs',       // P212 LRN soft prereq
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P218). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — sentinel or stub)`);
    }
  }
  console.log('P218 upstream preflight: PASSED');
}
main().catch((e) => { console.error(e); process.exit(2); });
```

Each of Plans 01-06 ships its own `scripts/preconditions/218-NN-check-upstream.cjs`.

---

## F-ID and Migration Slot Allocation

### CRITICAL: Slot Collision Finding

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
| 90-95, 97 | RESERVED — P220 plans (220-01-PLAN.md frontmatter locked) | P220 |
| 96 | `96_neuro_literacy_metadata.sql` | Existing |
| 98, 99 | UNOCCUPIED | Available |
| 100 | `100_crm_schema_identity_graph_hardening.sql` | Existing |
| 101+ | UNOCCUPIED | Available for P218/P219 |

**P219 research collision:** P219 research (219-RESEARCH.md line ~299) assumed P218 = slots 82-84 and P219 = slots 85-89. BOTH are wrong — slots 82-89 are fully occupied by existing foundation migrations. This must be corrected before any P218/P219 migration SQL is written.

**Corrected allocation:** P218 occupies slots **101-103**; P219 occupies slots **104-108**.

Note on P220 slots (90-95+97): P220 plans locked these slots before the collision was detected. They are in the range 90-97 which skips slot 96 (existing) and avoids 100 (existing). They are locked and do not conflict with P218/P219 at 101+. The anomaly (P220 < P218/P219 in number) is cosmetic — migration order is applied by filename sort, and all P218/P219 migrations at 101+ run after P220's 90-97 range. This means P218/P219 schema exists AFTER P220 schema at apply time. The planner must verify P220 Plan 01 does NOT insert rows into tables that only exist after P218/P219 migrations (since 101 > 90). If P220 migrations reference `saas_growth_profiles`, that is a problem. Based on P220 RESEARCH.md, P220 references `saas_growth_profiles.mode` in its trigger — which means P220 migrations must run AFTER P218. The actual numeric ordering (90 before 101) contradicts this dependency. **This is a sequencing conflict that requires planner decision: either (a) P218 slots go lower than 90, or (b) P220 slots go higher than 103.** Since P220 is locked at 90-97, option (a) is required. Recommended: P218 takes slots **98-99 + one split file** or the planner coordinates a slot swap with P220 team.

### Revised Slot Recommendation

Given the P220 lock at 90-95+97 and P218 dependency-order requirement (P218 schema must exist before P220 migrations reference it):

| Phase | Migration Slots | Rationale |
|-------|----------------|-----------|
| P218 | **98, 99, 98b** (or use prefix naming: `98_saas_growth_profiles.sql`, `99_plg_activation_pql.sql`, `98b_inapp_experiments.sql`) | Only free slots below P220's 90-95+97 range that are also above all existing (82-89, 96) |
| P219 | **104-108** | Post-P220 slots; P219 only needs `saas_growth_profiles` to exist (satisfied by 98-99); P219 is not referenced by P220 migrations so ordering is safe at 104+ |
| P220 | 90-95+97 (LOCKED) | Per 220-01-PLAN.md frontmatter; P220 migrations must run after P218 slot 98-99 (satisfied since 98>90 is false — this is the conflict) |

**Escalation required:** The slot ordering conflict is a hard architectural question. The planner must decide one of:
- Option A: Renumber P220 slots to 104-110, release 90-95+97 for P218/P219 use
- Option B: Accept that Supabase applies migrations by filename alphanumeric sort (not just numeric prefix) — verify whether `98_*.sql` actually applies before `90_*.sql` in Supabase CLI
- Option C: Use a migration coordinator script that applies migrations in explicit dependency order regardless of slot number

Until resolved, this research documents the collision as an **open question for planner decision** (Q-7). The F-ID table below uses the 101-103 slot estimates pending planner decision.

### P218 F-ID Pre-Allocation Table (slot numbers pending planner slot-order resolution)

| Plan | Domain | Migration Slot (proposed) | Table(s) Created | F-IDs (proposed) | Dependency Chain |
|------|--------|--------------------------|------------------|-------------------|-----------------|
| 218-01 | SaaSGrowthProfile + mode routing | 101 (or 98 per Option B) | `saas_growth_profiles`, `module_mode_eligibility` | F-200, F-201 | P214 + P216 + P217 |
| 218-02 | ActivationDefinition + PQLScore | 102 (or 99 per Option B) | `activation_definitions`, `activation_milestones`, `pql_scores` | F-202, F-203 | P218-01 + P216 |
| 218-03 | UpgradeTrigger | 102b (additive alongside 218-02 migration) | `upgrade_triggers`, `upgrade_trigger_events` | F-204 | P218-02 + P215 + P205 (soft) |
| 218-04 | InAppCampaign + suppression | 103 (or 98b) | `in_app_campaigns`, `in_app_campaign_deliveries`, `in_app_suppression_rules` | F-205, F-206 | P218-01 + P205 (soft) |
| 218-05 | MarketingExperiment + guardrails | 103b (additive alongside 218-04 migration) | `marketing_experiments`, `experiment_guardrails`, `experiment_decisions` | F-207 | P218-01 + P212 (soft) |
| 218-06 | PLG agent readiness (system-level seed) | service-level seed (no schema migration needed — seeded into `plg_growth_agent_readiness` created in migration 103) | `plg_growth_agent_readiness` | F-208 | P218-01..05 |

**F-ID range rationale:** P218 takes F-200..F-208. This is post-P220 cosmetically (F-209..F-227 are P220 locked), non-monotonic with phase order, consistent with P220 Q-3 path-A precedent. F-IDs are cosmetic identifiers only — not constraint-bearing.

**Slot coordination action:** Plan 218-01 Task 0.1 creates `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` documenting P218 reservation, flagging the P219 collision correction (82-89 occupied), and requesting planner decision on Option A/B/C for the P220 slot ordering conflict.

---

## Per-Domain Deep Dive

### Domain 1: SaaSGrowthProfile + 5-Mode Routing + Module Eligibility Matrix (Plan 218-01)

**Requirements:** SG-01, QA-01..15; integrates_with: SAS-09 (P217)

**Canon source:** `obsidian/brain/SaaS Marketing OS Strategy Canon.md` lines 53-59 — the five modes change active modules, agents, metrics, playbooks, approval gates, and UI surfaces. This is a product contract, not cosmetic segmentation.

**Operating Loop Spec source:** line 53 — `SaaSGrowthProfile: SaaS growth-mode configuration: b2b, b2c, b2b2c, plg_b2b, plg_b2c, active modules, sales/CS/developer posture`

**Module activation matrix** (from canon lines 53-59, cross-checked with doc 17 Part 2 mode descriptions):

| Module | b2b | b2c | plg_b2b | plg_b2c | b2b2c |
|--------|-----|-----|---------|---------|-------|
| PLG Engine (P218-02) | no | no | YES | YES | YES |
| Upgrade Triggers (P218-03) | no | no | YES | YES | YES |
| In-App Marketing (P218-04) | no | YES | YES | YES | YES |
| Growth Experiments (P218-05) | YES | YES | YES | YES | YES |
| Account Expansion (P219) | YES | no | YES | no | YES |
| ABM Engine (P219) | YES | no | YES | no | YES |
| Revenue Alignment (P219) | YES | no | YES | no | YES |
| Viral/Referral (P220) | no | YES | no | YES | YES |
| Community (P220) | no | YES | YES | YES | YES |
| PR/Analyst (P220) | YES | no | YES | no | YES |
| Partnerships (P220) | YES | no | YES | no | YES |
| Developer Marketing (P220) | no | no | YES | no | YES |

**Schema:**

```sql
-- Migration: 218-01 (slot TBD per planner slot-order decision)

CREATE TYPE markos_growth_mode AS ENUM (
  'b2b', 'b2c', 'plg_b2b', 'plg_b2c', 'b2b2c'
);

-- saas_growth_profiles (P218-owned; one per saas_suite_activation; FK to P214)
CREATE TABLE saas_growth_profiles (
  profile_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  suite_activation_id     uuid NOT NULL,  -- FK to saas_suite_activations (P214)
  mode                    markos_growth_mode NOT NULL,
  has_sales_team          boolean NOT NULL DEFAULT false,
  has_cs_team             boolean NOT NULL DEFAULT false,
  has_developer_audience  boolean NOT NULL DEFAULT false,
  plg_enabled             boolean GENERATED ALWAYS AS (
    mode IN ('plg_b2b', 'plg_b2c', 'b2b2c')
  ) STORED,
  b2b_enabled             boolean GENERATED ALWAYS AS (
    mode IN ('b2b', 'plg_b2b', 'b2b2c')
  ) STORED,
  b2c_enabled             boolean GENERATED ALWAYS AS (
    mode IN ('b2c', 'plg_b2c', 'b2b2c')
  ) STORED,
  active_modules          text[] NOT NULL DEFAULT ARRAY[]::text[],
  gtm_motion              text CHECK (gtm_motion IN (
    'product_led', 'sales_led', 'marketing_led', 'hybrid', 'community_led'
  )),
  approved_at             timestamptz,
  approved_by             uuid,
  version                 int NOT NULL DEFAULT 1,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE saas_growth_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY sgp_tenant_isolation ON saas_growth_profiles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_sgp_tenant_mode ON saas_growth_profiles(tenant_id, mode);

-- module_mode_eligibility (P218-owned; service-role table; no RLS)
-- P219+P220 migration-time triggers JOIN this table to gate module inserts
CREATE TABLE module_mode_eligibility (
  module_key  text NOT NULL,
  mode        markos_growth_mode NOT NULL,
  eligible    boolean NOT NULL DEFAULT true,
  PRIMARY KEY (module_key, mode)
);
-- Seed rows correspond exactly to the module activation matrix above (55 rows)
-- P219+P220 migrations reference module_mode_eligibility via JOIN in DB-triggers
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: MODE_REQUIRES_SAAS_ACTIVATION
-- Blocks saas_growth_profiles insert if no active SaaSSuiteActivation for tenant (P214 prereq)
CREATE OR REPLACE FUNCTION enforce_mode_requires_saas_activation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM saas_suite_activations
    WHERE tenant_id = NEW.tenant_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'MODE_REQUIRES_SAAS_ACTIVATION: tenant % has no active SaaSSuiteActivation (P214 required)', NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mode_requires_saas_activation
  BEFORE INSERT OR UPDATE ON saas_growth_profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_mode_requires_saas_activation();

-- MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE pattern (implemented by P219+P220)
-- P218's contract: module_mode_eligibility table + saas_growth_profiles.mode column MUST exist
-- when P219-01 and P220-01 migrations add their own module-gate triggers.
-- P218 migration SQL must include comment:
--   P219+P220 module activation triggers will JOIN this table.
--   mode column and module_mode_eligibility rows are the downstream contract.
```

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/saas-growth-profiles` | GET / POST / PATCH | GrowthProfile CRUD | F-200 |
| `/v1/growth/saas-growth-profiles/mode-eligibility` | GET | Query module eligibility for current tenant mode | F-201 |

**Cron handler:**
- `api/cron/growth-profile-sync.js` — daily: reconcile `saas_growth_profiles.active_modules` array from `module_mode_eligibility` seed for tenant's current mode.

**MCP tools:**
- `growth_profile_get` — read tenant SaaSGrowthProfile (Read)
- `growth_module_eligibility_check` — check if a module_key is eligible for this tenant's mode (Read)

**Test strategy:**
- `test/growth-218/profile/profile-crud.test.js` — CRUD + RLS + UNIQUE tenant constraint
- `test/growth-218/profile/mode-eligibility-matrix.test.js` — verify all 55 mode_module combinations seeded correctly
- `test/growth-218/profile/mode-saas-activation-trigger.test.js` — DB-trigger fires when no SaaSSuiteActivation
- `test/growth-218/profile/mode-change-requires-approval.test.js` — mode updates require approved_at

---

### Domain 2: ActivationDefinition + Milestone Funnels + PQLScore (Plan 218-02)

**Requirements:** SG-02, QA-01..15

**Doc 17 source:** TypeScript interfaces `ActivationDefinition` (line 159), `PQLScore` (line 237). Canon source: SaaS Marketing OS Strategy Canon line 67.

**Schema:**

```sql
-- activation_definitions (P218-owned; one per tenant; gates PLG activation)
CREATE TABLE activation_definitions (
  definition_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES markos_orgs(org_id),
  profile_id                uuid NOT NULL REFERENCES saas_growth_profiles(profile_id),
  saas_model                markos_growth_mode NOT NULL,
  aha_moment_description    text NOT NULL,
  aha_moment_event_name     text NOT NULL,  -- PostHog/Mixpanel event key
  aha_moment_minimum_count  int NOT NULL DEFAULT 1 CHECK (aha_moment_minimum_count > 0),
  aha_moment_window_days    int NOT NULL DEFAULT 14 CHECK (aha_moment_window_days > 0),
  -- Baseline metrics (computed from connected analytics connector P210)
  baseline_signup_to_activation_rate  numeric(5,4) NOT NULL DEFAULT 0,
  baseline_median_time_hours          numeric(10,2),
  baseline_activation_to_paid_rate    numeric(5,4) NOT NULL DEFAULT 0,
  baseline_non_activated_churn_rate   numeric(5,4) NOT NULL DEFAULT 0,
  approved_at               timestamptz,
  approved_by               uuid,
  version                   int NOT NULL DEFAULT 1,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE activation_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_tenant_isolation ON activation_definitions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- activation_milestones (funnel steps toward aha moment)
CREATE TABLE activation_milestones (
  milestone_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id     uuid NOT NULL REFERENCES activation_definitions(definition_id),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  step              int NOT NULL CHECK (step >= 1),
  name              text NOT NULL,
  event_key         text NOT NULL,  -- PostHog/Mixpanel event name
  completion_rate   numeric(5,4) NOT NULL DEFAULT 0,
  median_time_hours numeric(10,2),
  drop_off_reason   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(definition_id, step)
);
ALTER TABLE activation_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY am_tenant_isolation ON activation_milestones
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- pql_scores (append-only; explainable inputs per doc 17 PQLScore.signals)
CREATE TABLE pql_scores (
  score_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  definition_id         uuid REFERENCES activation_definitions(definition_id),
  user_id               uuid NOT NULL,
  account_id            uuid,
  subscription_id       uuid,
  score                 int NOT NULL CHECK (score BETWEEN 0 AND 100),
  pql_status            text NOT NULL CHECK (pql_status IN (
    'not_ready', 'warming', 'pql', 'hot_pql'
  )),
  -- Usage signals (highest weight per doc 17)
  hit_usage_limit               boolean NOT NULL DEFAULT false,
  high_frequency_user           boolean NOT NULL DEFAULT false,
  feature_breadth_pct           numeric(5,4) NOT NULL DEFAULT 0,
  power_user_action_count       int NOT NULL DEFAULT 0,
  invited_teammates             boolean NOT NULL DEFAULT false,
  connected_integrations_count  int NOT NULL DEFAULT 0,
  -- Intent signals (medium weight)
  visited_pricing_page          boolean NOT NULL DEFAULT false,
  visited_upgrade_page          boolean NOT NULL DEFAULT false,
  searched_enterprise_features  boolean NOT NULL DEFAULT false,
  downloaded_export             boolean NOT NULL DEFAULT false,
  contacted_sales               boolean NOT NULL DEFAULT false,
  -- Fit signals (contextual weight)
  company_size                  text,
  company_stage                 text,
  industry                      text,
  icp_fit_score                 numeric(5,4) NOT NULL DEFAULT 0,
  -- Evidence + action
  evidence_refs                 uuid[] DEFAULT ARRAY[]::uuid[],  -- EvidenceMap FKs (P209 soft)
  recommended_action            text CHECK (recommended_action IN (
    'in_app_upgrade_prompt', 'targeted_email_sequence', 'sales_outreach',
    'self_serve_offer', 'feature_unlock', 'continue_monitoring'
  )),
  recommended_timing            text,
  recommended_channel           text,
  calculated_at                 timestamptz NOT NULL DEFAULT now(),
  task_created_id               uuid
);
ALTER TABLE pql_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY pql_tenant_isolation ON pql_scores
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_pql_account_status ON pql_scores(tenant_id, account_id, pql_status, calculated_at DESC);
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: PQL_SCORE_REQUIRES_EVIDENCE
-- Blocks pql/hot_pql transition when no signal evidence is present
CREATE OR REPLACE FUNCTION enforce_pql_score_requires_evidence()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pql_status IN ('pql', 'hot_pql')
    AND NEW.hit_usage_limit = false
    AND NEW.high_frequency_user = false
    AND NEW.feature_breadth_pct < 0.3
    AND NEW.visited_pricing_page = false
    AND NEW.visited_upgrade_page = false
  THEN
    RAISE EXCEPTION 'PQL_SCORE_REQUIRES_EVIDENCE: pql/hot_pql status requires at least one explainable signal for tenant %, user %',
      NEW.tenant_id, NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pql_score_requires_evidence
  BEFORE INSERT OR UPDATE ON pql_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_pql_score_requires_evidence();
```

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/activation-definitions` | GET / POST / PATCH | ActivationDefinition CRUD | F-202 |
| `/v1/growth/activation-definitions/{id}/milestones` | GET / POST / PATCH / DELETE | Milestone funnel CRUD | F-202 (subpath) |
| `/v1/growth/pql-scores` | GET | Latest PQL scores for tenant (read-only) | F-203 |
| `/v1/growth/pql-scores/recalculate` | POST | Trigger PQL rescore for user/account | F-203 (subpath) |

**Cron handler:**
- `api/cron/growth-pql-scorer.js` — daily: read product usage signals from `saas_health_scores` (P216), compute PQL scores for active subscribers, create tasks for new `pql` / `hot_pql` entries.

**MCP tools:**
- `growth_activation_definition_get` — read tenant ActivationDefinition (Read)
- `growth_pql_score_get` — read latest PQL score for user/account (Read)
- `growth_pql_score_recalculate` — trigger rescore with reason (Write — approval-gated for external dispatch)

**Test strategy:**
- `test/growth-218/activation/definition-crud.test.js` — CRUD + RLS + UNIQUE tenant constraint
- `test/growth-218/activation/milestone-funnel-steps.test.js` — UNIQUE(definition_id, step) constraint
- `test/growth-218/pql/pql-score-evidence-trigger.test.js` — DB-trigger fires on pql/hot_pql without evidence
- `test/growth-218/pql/pql-scorer-cron.test.js` — cron creates task for new hot_pql entry

---

### Domain 3: UpgradeTrigger + Pricing-Safe Conversion Prompts (Plan 218-03)

**Requirements:** SG-02 (upgrade side), SG-11, SG-12, PRC-09; P205 SOFT

**CONTEXT.md non-negotiable:** "No in-app prompt, upgrade nudge, discount, save offer, or pricing copy bypasses Pricing Engine."

**Schema:**

```sql
-- upgrade_triggers (P218-owned; configuration objects per doc 17 Part 2 upgrade trigger system)
CREATE TABLE upgrade_triggers (
  trigger_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES markos_orgs(org_id),
  profile_id                uuid NOT NULL REFERENCES saas_growth_profiles(profile_id),
  name                      text NOT NULL,
  trigger_type              text NOT NULL CHECK (trigger_type IN (
    'hard_limit_reached', 'feature_gate_hit', 'seat_limit_approached',
    'usage_velocity_warning', 'value_recognition_moment', 'plan_anniversary', 'custom'
  )),
  trigger_condition_jsonb   jsonb NOT NULL,  -- {threshold, metric, window}
  prompt_copy               text NOT NULL,   -- use {{MARKOS_PRICING_ENGINE_PENDING}} until P205 lands
  prompt_format             text NOT NULL CHECK (prompt_format IN (
    'modal', 'banner', 'slideout', 'tooltip', 'email', 'combined_inapp_email'
  )),
  recommended_tier          text,
  recommended_plan_id       uuid,
  annual_upsell_enabled     boolean NOT NULL DEFAULT false,
  -- Pricing Engine (SG-11, PRC-09)
  pricing_recommendation_id uuid,   -- FK soft-ref (P205); NULL = use sentinel
  pricing_context_sentinel  text,   -- '{{MARKOS_PRICING_ENGINE_PENDING}}' when FK is NULL
  -- Approval gate (SG-12)
  approval_id               uuid,
  approved_at               timestamptz,
  approved_by               uuid,
  status                    text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('active', 'paused', 'draft', 'archived')),
  active_from               timestamptz,
  active_until              timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE upgrade_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY ut_tenant_isolation ON upgrade_triggers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- upgrade_trigger_events (append-only dispatch log)
CREATE TABLE upgrade_trigger_events (
  event_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES markos_orgs(org_id),
  trigger_id    uuid NOT NULL REFERENCES upgrade_triggers(trigger_id),
  user_id       uuid NOT NULL,
  account_id    uuid,
  event_type    text NOT NULL CHECK (event_type IN (
    'trigger_fired', 'prompt_shown', 'prompt_dismissed',
    'upgrade_clicked', 'upgrade_completed', 'upgrade_abandoned'
  )),
  channel       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE upgrade_trigger_events ENABLE ROW LEVEL SECURITY;
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: UPGRADE_TRIGGER_PRICING_REQUIRED
-- Blocks upgrade_trigger activation unless pricing FK or sentinel is set + approval present
CREATE OR REPLACE FUNCTION enforce_upgrade_trigger_pricing_required()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    IF NEW.pricing_recommendation_id IS NULL
       AND (NEW.pricing_context_sentinel IS NULL
            OR NEW.pricing_context_sentinel != '{{MARKOS_PRICING_ENGINE_PENDING}}')
    THEN
      RAISE EXCEPTION 'UPGRADE_TRIGGER_PRICING_REQUIRED: trigger % requires pricing_recommendation_id OR pricing_context_sentinel = {{MARKOS_PRICING_ENGINE_PENDING}}',
        NEW.trigger_id;
    END IF;
    IF NEW.approved_at IS NULL THEN
      RAISE EXCEPTION 'UPGRADE_TRIGGER_PRICING_REQUIRED: trigger % activation requires approval',
        NEW.trigger_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_upgrade_trigger_pricing_required
  BEFORE UPDATE ON upgrade_triggers
  FOR EACH ROW EXECUTE FUNCTION enforce_upgrade_trigger_pricing_required();
```

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/upgrade-triggers` | GET / POST / PATCH | UpgradeTrigger CRUD | F-204 |
| `/v1/growth/upgrade-triggers/{id}/activate` | POST | Activate trigger (requires approval) | F-204 (subpath) |
| `/v1/growth/upgrade-triggers/events` | GET | Dispatch event history | F-204 (subpath) |

**Cron handler:**
- `api/cron/growth-upgrade-trigger-monitor.js` — hourly: evaluate trigger conditions against active subscriptions; fire `trigger_fired` events; create in-app prompt tasks.

**MCP tools:**
- `growth_upgrade_trigger_get` — read active triggers for tenant (Read)
- `growth_upgrade_trigger_activate` — activate trigger via `buildApprovalPackage` (Write)

**Test strategy:**
- `test/growth-218/upgrade-triggers/crud.test.js` — CRUD + RLS
- `test/growth-218/upgrade-triggers/pricing-sentinel-trigger.test.js` — DB-trigger fires if neither FK nor sentinel set
- `test/growth-218/upgrade-triggers/approval-gate.test.js` — activation without approval raises exception
- `test/growth-218/upgrade-triggers/cron-condition-evaluation.test.js` — cron fires trigger_fired events correctly

---

### Domain 4: InAppCampaign Orchestration + Suppression + Frequency Caps + Approvals (Plan 218-04)

**Requirements:** SG-05, SG-11, SG-12, PRC-09 (Plan 04 side); P205 SOFT

**CONTEXT.md non-negotiable:** "No customer-facing in-app action bypasses approval unless an earned-autonomy policy exists."

**Doc 17 source:** `InAppCampaign` interface (line 766), `InAppTrigger` (line 801), `InAppFormat` (line 792).

**Schema:**

```sql
-- in_app_campaigns (P218-owned)
CREATE TABLE in_app_campaigns (
  campaign_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES markos_orgs(org_id),
  profile_id                uuid NOT NULL REFERENCES saas_growth_profiles(profile_id),
  name                      text NOT NULL,
  status                    text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('active', 'paused', 'draft', 'completed', 'archived')),
  -- Targeting (doc 17 InAppTrigger)
  target_segment_jsonb      jsonb NOT NULL DEFAULT '{}'::jsonb,
  trigger_jsonb             jsonb NOT NULL,  -- {trigger_type, event_name, page_url_pattern, delay_seconds, session_number}
  -- Frequency cap + suppression (SG-05)
  max_shows_per_user        int NOT NULL DEFAULT 3,
  cooldown_days             int NOT NULL DEFAULT 14 CHECK (cooldown_days >= 0),
  suppress_if_email_sent_days int NOT NULL DEFAULT 3,
  pause_if_cs_active        boolean NOT NULL DEFAULT true,
  respect_quiet_hours       boolean NOT NULL DEFAULT true,
  -- Creative (doc 17 InAppFormat)
  format                    text NOT NULL CHECK (format IN (
    'tooltip', 'banner', 'modal', 'slideout', 'checklist', 'hotspot', 'announcement'
  )),
  content_jsonb             jsonb NOT NULL,  -- {title, body, cta_text, cta_url, media_url}
  -- Pricing Engine (SG-11, PRC-09)
  pricing_recommendation_id uuid,
  pricing_context_sentinel  text,  -- '{{MARKOS_PRICING_ENGINE_PENDING}}' when unresolved
  -- Measurement
  primary_goal              text NOT NULL CHECK (primary_goal IN (
    'upgrade', 'activate_feature', 'book_call', 'review', 'referral', 'onboarding', 'custom'
  )),
  success_event_key         text NOT NULL,
  -- Approval (SG-12)
  approval_id               uuid,
  approved_at               timestamptz,
  approved_by               uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE in_app_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY iac_tenant_isolation ON in_app_campaigns
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- in_app_campaign_deliveries (per-user dispatch log)
CREATE TABLE in_app_campaign_deliveries (
  delivery_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_orgs(org_id),
  campaign_id     uuid NOT NULL REFERENCES in_app_campaigns(campaign_id),
  user_id         uuid NOT NULL,
  shown_at        timestamptz,
  dismissed_at    timestamptz,
  converted_at    timestamptz,
  suppressed      boolean NOT NULL DEFAULT false,
  suppression_reason text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE in_app_campaign_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_iacd_campaign_user ON in_app_campaign_deliveries(tenant_id, campaign_id, user_id, created_at DESC);

-- in_app_suppression_rules (global suppression overrides)
CREATE TABLE in_app_suppression_rules (
  rule_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES markos_orgs(org_id),
  rule_type     text NOT NULL CHECK (rule_type IN (
    'user_level', 'account_level', 'campaign_level',
    'global_quiet_hours', 'cs_active_override', 'email_coordination_window'
  )),
  scope_jsonb   jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_from   timestamptz,
  active_until  timestamptz,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid NOT NULL
);
ALTER TABLE in_app_suppression_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY isr_tenant_isolation ON in_app_suppression_rules
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING
CREATE OR REPLACE FUNCTION enforce_inapp_campaign_requires_approval_and_pricing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    IF NEW.approved_at IS NULL THEN
      RAISE EXCEPTION 'INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING: campaign % activation requires approved_at (SG-12)',
        NEW.campaign_id;
    END IF;
    IF NEW.primary_goal = 'upgrade'
       AND NEW.pricing_recommendation_id IS NULL
       AND (NEW.pricing_context_sentinel IS NULL
            OR NEW.pricing_context_sentinel != '{{MARKOS_PRICING_ENGINE_PENDING}}')
    THEN
      RAISE EXCEPTION 'INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING: upgrade-goal campaign % requires pricing_recommendation_id OR sentinel (PRC-09)',
        NEW.campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_inapp_campaign_requires_approval_and_pricing
  BEFORE INSERT OR UPDATE ON in_app_campaigns
  FOR EACH ROW EXECUTE FUNCTION enforce_inapp_campaign_requires_approval_and_pricing();

-- Trigger: INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK
CREATE OR REPLACE FUNCTION enforce_inapp_dispatch_requires_frequency_check()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_max_shows int;
  v_cooldown_days int;
  v_shown_count int;
BEGIN
  SELECT max_shows_per_user, cooldown_days
    INTO v_max_shows, v_cooldown_days
    FROM in_app_campaigns WHERE campaign_id = NEW.campaign_id;

  SELECT COUNT(*) INTO v_shown_count
    FROM in_app_campaign_deliveries
   WHERE campaign_id = NEW.campaign_id
     AND user_id = NEW.user_id
     AND shown_at IS NOT NULL
     AND shown_at > now() - (v_cooldown_days || ' days')::interval;

  IF v_shown_count >= v_max_shows THEN
    RAISE EXCEPTION 'INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK: user % exceeded frequency cap for campaign % (% of % shows)',
      NEW.user_id, NEW.campaign_id, v_shown_count, v_max_shows;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_inapp_dispatch_requires_frequency_check
  BEFORE INSERT ON in_app_campaign_deliveries
  FOR EACH ROW EXECUTE FUNCTION enforce_inapp_dispatch_requires_frequency_check();
```

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/in-app-campaigns` | GET / POST / PATCH | InAppCampaign CRUD | F-205 |
| `/v1/growth/in-app-campaigns/{id}/activate` | POST | Activate (requires approval via `buildApprovalPackage`) | F-205 (subpath) |
| `/v1/growth/in-app-campaigns/{id}/deliveries` | GET | Delivery log (read-only) | F-205 (subpath) |
| `/v1/growth/in-app-suppression-rules` | GET / POST / DELETE | Suppression rule management | F-206 |

**Cron handler:**
- `api/cron/growth-inapp-campaign-dispatch.js` — every 5 minutes: evaluate active campaigns for eligible users; check suppression rules + frequency caps; enqueue delivery records; emit tasks for required approvals.

**MCP tools:**
- `growth_inapp_campaign_get` — read active campaigns for tenant (Read)
- `growth_inapp_campaign_activate` — activate campaign via `buildApprovalPackage` (Write)
- `growth_inapp_suppression_check` — check if user is suppressed from a campaign (Read)

**Test strategy:**
- `test/growth-218/inapp/campaign-crud.test.js` — CRUD + RLS
- `test/growth-218/inapp/approval-pricing-trigger.test.js` — activation without approval raises exception
- `test/growth-218/inapp/frequency-cap-trigger.test.js` — DB-trigger blocks over-frequency delivery
- `test/growth-218/inapp/suppression-rule-evaluation.test.js` — suppression rules evaluated before dispatch
- `test/growth-218/inapp/email-coordination.test.js` — suppress_if_email_sent_days logic

---

### Domain 5: MarketingExperiment + ICE Backlog + Guardrails + Decisions (Plan 218-05)

**Requirements:** SG-07, SG-09 (experiment axis), QA-01..15; integrates_with: LRN-01..05 (P212)

**CONTEXT.md non-negotiable:** "No experiment runs without guardrails, owner, decision criteria, and learning handoff."

**Doc 17 source:** `MarketingExperiment` interface (line 1154), ICE scoring (lines 1213-1235).

**LRN integration (NOT ownership):**
- `experiment_decisions.decision = 'rollout'|'reject'|'extend'|'redesign'` → write to `artifact_performance_logs` (LRN-02)
- `experiment_decisions.learning IS NOT NULL` → create `literacy_update_candidates` (LRN-05) for admin review
- Tenant-specific execution preferences discovered → propose `tenant_overlay_candidates` (LRN-03)
- All LRN writes are soft (no-op if P212 tables absent)

**Schema:**

```sql
-- marketing_experiments (P218-owned; registry + results)
CREATE TABLE marketing_experiments (
  experiment_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),
  profile_id              uuid NOT NULL REFERENCES saas_growth_profiles(profile_id),
  name                    text NOT NULL,
  hypothesis              text NOT NULL,
  experiment_type         text NOT NULL CHECK (experiment_type IN (
    'ab_test', 'multivariate', 'holdout', 'bandit'
  )),
  status                  text NOT NULL DEFAULT 'backlog'
                          CHECK (status IN (
                            'backlog', 'approved', 'running', 'paused',
                            'completed', 'rejected_before_run'
                          )),
  priority                text NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('high', 'medium', 'low')),
  -- ICE scoring (doc 17 ICE backlog)
  ice_impact              int CHECK (ice_impact BETWEEN 1 AND 10),
  ice_confidence          int CHECK (ice_confidence BETWEEN 1 AND 10),
  ice_ease                int CHECK (ice_ease BETWEEN 1 AND 10),
  ice_score               int GENERATED ALWAYS AS (
    CASE WHEN ice_impact IS NOT NULL AND ice_confidence IS NOT NULL AND ice_ease IS NOT NULL
    THEN ice_impact * ice_confidence * ice_ease ELSE NULL END
  ) STORED,
  -- Surface (doc 17 ExperimentSurface)
  surface                 text NOT NULL CHECK (surface IN (
    'landing_page', 'pricing_page', 'email_subject', 'email_body',
    'ad_creative', 'ad_copy', 'onboarding_flow', 'activation_sequence',
    'in_app_message', 'referral_program', 'cta_button', 'homepage', 'custom'
  )),
  control_jsonb           jsonb NOT NULL,
  variants_jsonb          jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Statistical design
  traffic_split_pct       numeric(5,2) NOT NULL CHECK (traffic_split_pct BETWEEN 1 AND 100),
  sample_size_required    int,
  estimated_duration_days int,
  min_runtime_days        int NOT NULL DEFAULT 7 CHECK (min_runtime_days >= 1),
  primary_metric          text NOT NULL,
  secondary_metrics       text[] NOT NULL DEFAULT ARRAY[]::text[],
  significance_threshold  numeric(6,4) NOT NULL DEFAULT 0.05,
  minimum_detectable_effect numeric(6,4),
  -- Compliance (CONTEXT.md 5-field constraint)
  owner_id                uuid NOT NULL,
  decision_criteria       text NOT NULL,
  learning_handoff        text NOT NULL,
  -- Results
  started_at              timestamptz,
  completed_at            timestamptz,
  result_jsonb            jsonb,
  decision                text CHECK (decision IN ('rollout', 'reject', 'extend', 'redesign')),
  learning                text,
  -- Approval (SG-12)
  approval_id             uuid,
  approved_at             timestamptz,
  approved_by             uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE marketing_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY me_tenant_isolation ON marketing_experiments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_me_ice_score ON marketing_experiments(tenant_id, ice_score DESC NULLS LAST, status);

-- experiment_guardrails (per-experiment guardrail metrics — at least 1 required)
CREATE TABLE experiment_guardrails (
  guardrail_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   uuid NOT NULL REFERENCES marketing_experiments(experiment_id),
  tenant_id       uuid NOT NULL REFERENCES markos_orgs(org_id),
  metric_name     text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('must_not_decrease', 'must_not_increase')),
  threshold_pct   numeric(6,4) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE experiment_guardrails ENABLE ROW LEVEL SECURITY;

-- experiment_decisions (append-only; feeds LRN-02/LRN-03/LRN-05 via P212 integration)
CREATE TABLE experiment_decisions (
  decision_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id                 uuid NOT NULL REFERENCES marketing_experiments(experiment_id),
  tenant_id                     uuid NOT NULL REFERENCES markos_orgs(org_id),
  decision                      text NOT NULL CHECK (decision IN ('rollout', 'reject', 'extend', 'redesign')),
  decision_rationale            text NOT NULL,
  learning                      text,
  -- LRN integration FKs (soft; null if P212 not yet landed)
  artifact_performance_log_id   uuid,     -- LRN-02
  literacy_update_candidate_id  uuid,     -- LRN-05
  decided_at                    timestamptz NOT NULL DEFAULT now(),
  decided_by                    uuid NOT NULL,
  approval_id                   uuid,
  UNIQUE(experiment_id, decided_at)
);
ALTER TABLE experiment_decisions ENABLE ROW LEVEL SECURITY;
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING
-- 5-field constraint matching CONTEXT.md non-negotiable exactly
CREATE OR REPLACE FUNCTION enforce_experiment_activation_guardrails()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_guardrail_count int;
BEGIN
  IF NEW.status IN ('running', 'approved')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('running', 'approved'))
  THEN
    IF NEW.owner_id IS NULL THEN
      RAISE EXCEPTION 'EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING: experiment % missing owner_id', NEW.experiment_id;
    END IF;
    IF NEW.decision_criteria IS NULL OR trim(NEW.decision_criteria) = '' THEN
      RAISE EXCEPTION 'EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING: experiment % missing decision_criteria', NEW.experiment_id;
    END IF;
    IF NEW.learning_handoff IS NULL OR trim(NEW.learning_handoff) = '' THEN
      RAISE EXCEPTION 'EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING: experiment % missing learning_handoff', NEW.experiment_id;
    END IF;
    SELECT COUNT(*) INTO v_guardrail_count
      FROM experiment_guardrails WHERE experiment_id = NEW.experiment_id;
    IF v_guardrail_count = 0 THEN
      RAISE EXCEPTION 'EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING: experiment % has no guardrail metrics (minimum 1 required)', NEW.experiment_id;
    END IF;
    IF NEW.approved_at IS NULL THEN
      RAISE EXCEPTION 'EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING: experiment % activation requires approved_at (SG-12)', NEW.experiment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_experiment_activation_guardrails
  BEFORE INSERT OR UPDATE ON marketing_experiments
  FOR EACH ROW EXECUTE FUNCTION enforce_experiment_activation_guardrails();
```

**Note:** The 218-REVIEWS.md listed exception name `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA` (4-field). Research confirms CONTEXT.md non-negotiable adds a 5th field (learning handoff). Exception name above is 5-field, matching the spec exactly.

**API surface:**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/experiments` | GET / POST / PATCH | Experiment registry CRUD | F-207 |
| `/v1/growth/experiments/{id}/guardrails` | GET / POST / DELETE | Guardrail management | F-207 (subpath) |
| `/v1/growth/experiments/{id}/decisions` | GET / POST | Decision + learning log | F-207 (subpath) |
| `/v1/growth/experiments/backlog` | GET | ICE-ranked backlog view | F-207 (subpath) |

**MCP tools:**
- `growth_experiment_get` — read experiment registry (Read)
- `growth_experiment_backlog` — ICE-ranked backlog (Read)
- `growth_experiment_activate` — activate via `buildApprovalPackage` (Write)
- `growth_experiment_decide` — record decision + learning, write LRN integration (Write)

**Test strategy:**
- `test/growth-218/experiments/registry-crud.test.js` — CRUD + RLS
- `test/growth-218/experiments/ice-score-computed.test.js` — generated column ICE computed correctly
- `test/growth-218/experiments/activation-guardrail-trigger.test.js` — 5-field constraint DB-trigger
- `test/growth-218/experiments/decision-lrn-integration.test.js` — decision writes LRN-02 log (soft; stubbed when P212 absent)
- `test/growth-218/experiments/backlog-ice-rank.test.js` — backlog ordered by ice_score DESC

---

### Domain 6: PLG/In-App/Experiment Agent Readiness (Plan 218-06)

**Requirements:** SG-10, QA-01..15

**Schema:**

```sql
-- plg_growth_agent_readiness (P218-owned; temporary table; consolidated by P220-06)
-- NOT tenant-scoped — system-level registry; service-role-only writes
CREATE TABLE plg_growth_agent_readiness (
  agent_id                  text PRIMARY KEY,
  agent_name                text NOT NULL,
  agent_tier                text NOT NULL,  -- 'PLG' | 'IAM' | 'XP'
  contracts_assigned        boolean NOT NULL DEFAULT false,
  cost_estimated            boolean NOT NULL DEFAULT false,
  approval_posture_defined  boolean NOT NULL DEFAULT false,
  tests_implemented         boolean NOT NULL DEFAULT false,
  api_surface_defined       boolean NOT NULL DEFAULT false,
  mcp_surface_defined       boolean NOT NULL DEFAULT false,
  ui_surface_defined        boolean NOT NULL DEFAULT false,
  failure_behavior_defined  boolean NOT NULL DEFAULT false,
  runnable                  boolean NOT NULL GENERATED ALWAYS AS (
    contracts_assigned AND cost_estimated AND approval_posture_defined
    AND tests_implemented AND api_surface_defined AND mcp_surface_defined
    AND ui_surface_defined AND failure_behavior_defined
  ) STORED,
  activation_approval_id    uuid,
  readiness_check_id        uuid,
  blocking_phase            text DEFAULT 'P218-06',
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Seed: 9 PLG/IAM/XP agents (all runnable=false)
INSERT INTO plg_growth_agent_readiness (agent_id, agent_name, agent_tier, blocking_phase) VALUES
  ('MARKOS-AGT-PLG-01', 'PLG Strategist', 'PLG', 'P218-06'),
  ('MARKOS-AGT-PLG-02', 'Activation Analyst', 'PLG', 'P218-06'),
  ('MARKOS-AGT-PLG-03', 'PQL Scorer', 'PLG', 'P218-06'),
  ('MARKOS-AGT-PLG-04', 'In-App Campaign Manager', 'PLG', 'P218-06'),
  ('MARKOS-AGT-PLG-05', 'Upgrade Trigger Engine', 'PLG', 'P218-06'),
  ('MARKOS-AGT-PLG-06', 'Viral Loop Designer', 'PLG', 'P220-confirm'),
  ('MARKOS-AGT-IAM-01', 'In-App Campaign Orchestrator', 'IAM', 'P218-06'),
  ('MARKOS-AGT-XP-01', 'Growth Experiment Strategist', 'XP', 'P218-06'),
  ('MARKOS-AGT-XP-02', 'Experiment Analyst', 'XP', 'P218-06');
```

**DB-trigger compliance enforcement:**

```sql
-- Trigger: AGENT_ACTIVATION_REQUIRES_READINESS
CREATE OR REPLACE FUNCTION enforce_agent_activation_requires_readiness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.contracts_assigned OR NEW.cost_estimated OR NEW.approval_posture_defined
    OR NEW.tests_implemented OR NEW.api_surface_defined OR NEW.mcp_surface_defined
    OR NEW.ui_surface_defined OR NEW.failure_behavior_defined)
    AND NEW.activation_approval_id IS NULL
  THEN
    RAISE EXCEPTION 'AGENT_ACTIVATION_REQUIRES_READINESS: agent % cannot set readiness flags without activation_approval_id (SG-10)',
      NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_agent_activation_requires_readiness
  BEFORE UPDATE ON plg_growth_agent_readiness
  FOR EACH ROW EXECUTE FUNCTION enforce_agent_activation_requires_readiness();
```

**Plan 218-06 autonomous=false + checkpoint:human-action:** Plan 218-06 MUST ship with `autonomous: false` and `checkpoint: human-action` — operator must manually confirm the PLG/IAM/XP agent readiness registry before any growth agent tier can progress toward `contracts_assigned = true`. Mirrors P219-06 and P220-06 model (P226 W1 pattern).

**Test strategy:**
- `test/growth-218/agents/registry-non-runnable.test.js` — 9 seeded agents all have `runnable = false`
- `test/growth-218/agents/activation-gate-trigger.test.js` — setting readiness flag without activation_approval_id raises exception
- `test/growth-218/agents/readiness-progression.test.js` — setting all 8 flags true (with approval) yields `runnable = true`

---

## Module-Tree Architecture (P218-greenfield)

P218 creates these new directories (siblings to existing `lib/markos/{audit, billing, crm, ...}`):

```
lib/markos/plg/                    # PLG engine (Plans 218-01..03)
  growth-profiles.ts               # SaaSGrowthProfile CRUD + mode routing
  growth-profiles.cjs              # CJS twin
  activation.ts                    # ActivationDefinition + milestone CRUD
  activation.cjs
  pql-scorer.ts                    # PQL signal computation
  pql-scorer.cjs
  upgrade-triggers.ts              # UpgradeTrigger CRUD + condition evaluator
  upgrade-triggers.cjs
  mode-eligibility.ts              # helper: isModuleEligible(tenantId, moduleKey)
  mode-eligibility.cjs
  *.test.js

lib/markos/inapp/                  # In-App Marketing (Plan 218-04)
  campaigns.ts                     # InAppCampaign CRUD + dispatch orchestration
  campaigns.cjs
  suppression.ts                   # frequency cap + quiet hours + CS override
  suppression.cjs
  coordinator.ts                   # email-inapp coordination
  *.test.js

lib/markos/experiments/            # Growth experimentation (Plan 218-05)
  registry.ts                      # MarketingExperiment CRUD + ICE ranking
  registry.cjs
  guardrails.ts                    # ExperimentGuardrail evaluation
  decisions.ts                     # decision record + LRN integration writes
  decisions.cjs
  backlog.ts                       # ICE-ranked backlog query
  lrn-bridge.ts                    # soft bridge to P212 LRN substrates
  *.test.js

lib/markos/growth-agents/          # Agent readiness (Plan 218-06)
  plg-readiness-registry.ts
  plg-readiness-registry.cjs
  readiness-gate.ts                # canRun() returns false until all 8 criteria met
  *.test.js
```

---

## Compliance Enforcement Boundary Per Domain

| Plan | Domain | Exception Name | What It Enforces |
|------|--------|---------------|-----------------|
| 218-01 | Mode Profile | `MODE_REQUIRES_SAAS_ACTIVATION` | Mode change requires active SaaSSuiteActivation (P214) |
| 218-01 | Module Gate | `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` | Downstream module inserts check mode eligibility matrix (P219+P220 use this) |
| 218-02 | PQL Score | `PQL_SCORE_REQUIRES_EVIDENCE` | pql/hot_pql transition requires at least 1 explainable signal |
| 218-03 | Upgrade Trigger | `UPGRADE_TRIGGER_PRICING_REQUIRED` | Trigger activation requires pricing FK (P205) OR sentinel |
| 218-04 | InApp Campaign | `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` | Campaign activation requires approval + pricing FK or sentinel |
| 218-04 | InApp Dispatch | `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK` | Delivery insert blocked if user exceeded frequency cap in cooldown window |
| 218-05 | Experiment | `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING` | 5-field constraint: guardrails + owner + decision_criteria + learning_handoff + approval |
| 218-06 | Agent Readiness | `AGENT_ACTIVATION_REQUIRES_READINESS` | Readiness flags cannot be set without activation_approval_id (SG-10) |

---

## Cross-Phase Coordination

### Q-1: P218 SaaSGrowthProfile Mode → P219 + P220 Module Activation Gate (RESOLVED)

**Contract:** P218-01 creates `saas_growth_profiles` with UNIQUE(tenant_id) and `module_mode_eligibility` with 55 rows seeded.

- P219-01 migration adds a `BEFORE INSERT` trigger on `revenue_team_configs` that reads tenant mode from `saas_growth_profiles` and checks `module_mode_eligibility WHERE module_key = 'revenue_alignment' AND mode = :tenant_mode AND eligible = true`. Raises `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` if not eligible.
- P220-01 does the same for `referral_programs` (module_key = 'viral_referral'), `community_profiles` (module_key = 'community'), etc.

**Column name locked for P219/P220 FK:** Table = `saas_growth_profiles`, column = `mode` (type `markos_growth_mode` ENUM).
**Query pattern:** `SELECT mode FROM saas_growth_profiles WHERE tenant_id = $1`

### Q-2: P218 Plan 05 LRN-01..05 vs P212 Ownership (RESOLVED)

Plan 05 frontmatter: `requirements: [SG-07, QA-01..15]`, `integrates_with: [LRN-01, LRN-02, LRN-03, LRN-05]`. P212 owns the substrate; P218 writes to it after experiment decisions. No double-ownership drift.

### Q-3: P218 Plan 01 SAS-09 vs P217 Ownership (RESOLVED)

Plan 01 frontmatter: `requirements: [SG-01, QA-01..15]`, `integrates_with: [SAS-09 from P217]`. P218 reads `saas_health_scores` + `saas_mrr_snapshots`; it does not modify P217 tables.

### Q-4: P218 Plans 03+04 P205 Pricing Engine (RESOLVED — SOFT with sentinel)

SOFT dependency. Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted as valid alternative by both DB-triggers (`UPGRADE_TRIGGER_PRICING_REQUIRED` and `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING`). Hard-fail would block indefinitely since P205 is not yet landed. Consistent with P219 Plan 05 and P220 cross-domain approach.

### Q-5: PRC-09 Ownership (RESOLVED — split Plans 03+04)

Plan 218-03 frontmatter includes PRC-09. Plan 218-04 frontmatter includes PRC-09. Both plans own the pricing-copy path for their respective domain. Not a conflict — PRC-09 is a compliance constraint that spans multiple implementation sites.

### Q-6: Mode Routing Matrix — Dynamic Table (RESOLVED)

`module_mode_eligibility` dynamic DB table. See Domain 1 schema. 55 rows seeded. P219+P220 migration-time triggers JOIN this table. Service-role-only — no RLS.

---

## Validation Architecture (Nyquist Dimension 8)

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node `--test` (matches P204 / P219 / P220 architecture-lock) |
| Config file | none — uses Node built-in test runner |
| Quick run command | `npm test -- test/growth-218/preflight/` |
| Full suite command | `npm test -- test/growth-218/ test/api-contracts/218-*` |
| Estimated runtime | 45-90s |

### Sampling Rate

- **Per task commit:** `npm test -- test/growth-218/<domain>/<task>.test.js`
- **Per wave merge:** `npm test -- test/growth-218/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Per-Domain Test Strategy

| Domain | Unit Tests | Integration Tests | Regression |
|--------|-----------|-------------------|-----------|
| Domain 1 (GrowthProfile/ModeMatrix) | RLS, schema, mode ENUM, eligibility seed | DB-trigger SaaS activation check; mode change approval | No migration collision with existing |
| Domain 2 (Activation/PQL) | RLS, schema, UNIQUE constraints | DB-trigger PQL evidence check; cron PQL scorer creates tasks | P216 health_score soft-degrade |
| Domain 3 (UpgradeTrigger) | RLS, schema, trigger condition evaluator | DB-trigger pricing required; cron condition evaluation | P205 sentinel upgrade path |
| Domain 4 (InAppCampaign) | RLS, schema, frequency cap logic, suppression | DB-trigger approval+pricing; DB-trigger dispatch frequency | email-inapp coordination logic |
| Domain 5 (Experiment) | RLS, schema, ICE generated column | DB-trigger 5-field constraint; decision LRN bridge | P212 LRN soft-degrade |
| Domain 6 (AgentReadiness) | All 9 agents runnable=false seed | activation-gate trigger | P219/P220 readiness coordination |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SG-01 | SaaSGrowthProfile + 5-mode routing + module eligibility matrix | unit+integration | `npm test -- test/growth-218/profile/` | ❌ Wave 0 |
| SG-02 | ActivationDefinition + PQL + UpgradeTrigger produce tasks | integration | `npm test -- test/growth-218/activation/ test/growth-218/pql/ test/growth-218/upgrade-triggers/` | ❌ Wave 0 |
| SG-05 | InAppCampaign frequency caps + suppression logic | unit+trigger | `npm test -- test/growth-218/inapp/` | ❌ Wave 0 |
| SG-07 | MarketingExperiment ICE ranking + guardrails + decisions | unit+trigger | `npm test -- test/growth-218/experiments/` | ❌ Wave 0 |
| SG-09 | All domains produce tasks/approvals | integration | `npm test -- test/growth-218/` (tasks-created assertions per domain) | ❌ Wave 0 |
| SG-10 | All 9 PLG/IAM/XP agents non-runnable | unit | `npm test -- test/growth-218/agents/registry-non-runnable.test.js` | ❌ Wave 0 |
| SG-11 | UpgradeTrigger + InAppCampaign pricing context or sentinel | unit+trigger | `npm test -- test/growth-218/upgrade-triggers/pricing-sentinel-trigger.test.js test/growth-218/inapp/approval-pricing-trigger.test.js` | ❌ Wave 0 |
| SG-12 | All external mutations blocked by DB-trigger without approval | trigger | `npm test -- test/growth-218/*/db-trigger-*.test.js` | ❌ Wave 0 |
| SAS-09 | P218 consumes P217 signals (reads only; no P217 table modifications) | integration | `npm test -- test/growth-218/profile/sas09-consume.test.js` | ❌ Wave 0 |
| PRC-09 | UpgradeTrigger + InAppCampaign pricing copy routes through Pricing Engine or sentinel | unit+trigger | `npm test -- test/growth-218/upgrade-triggers/pricing-prc09.test.js test/growth-218/inapp/pricing-prc09.test.js` | ❌ Wave 0 |
| QA-01..15 | Phase 200 Quality Baseline | unit+integration | `npm test -- test/growth-218/` | ❌ Wave 0 |
| LRN-01..05 (integrates) | Experiment decision writes LRN-02 artifact log (soft) | integration | `npm test -- test/growth-218/experiments/decision-lrn-integration.test.js` | ❌ Wave 0 |

### Architecture-Lock Regression Test

`test/growth-218/preflight/architecture-lock.test.js` ships in Plan 218-01 Task 0.5, runs FIRST in every wave:

```js
// test/growth-218/preflight/architecture-lock.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const FORBIDDEN = [
  'createApprovalPackage', 'requireSupabaseAuth', 'lookupPlugin',
  'requireTenantContext', 'serviceRoleClient', 'public/openapi.json',
  'app/(growth)', 'app/(plg)', 'route.ts', 'vitest', 'playwright', '.test.ts',
];

const SCAN_PATHS = [
  'lib/markos/plg', 'lib/markos/inapp', 'lib/markos/experiments',
  'lib/markos/growth-agents', 'api/v1/growth', 'api/cron/growth-',
].join(' ');

test('architecture-lock: zero forbidden patterns in P218 code paths', () => {
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

`test/growth-218/preflight/helper-presence.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

test('buildApprovalPackage exists', () => {
  const c = execSync(
    'grep -c "function buildApprovalPackage" lib/markos/crm/agent-actions.ts'
  ).toString().trim();
  assert.strictEqual(c, '1');
});
test('requireHostedSupabaseAuth exists at onboarding/backend path (NOT lib/markos)', () => {
  const c = execSync(
    'grep -c "function requireHostedSupabaseAuth" onboarding/backend/runtime-context.cjs'
  ).toString().trim();
  assert.strictEqual(c, '1');
});
test('resolvePlugin exists', () => {
  assert.ok(existsSync('lib/markos/plugins/registry.js'));
});
test('mcp/tools/index.cjs exists (not .ts)', () => {
  assert.ok(existsSync('lib/markos/mcp/tools/index.cjs'));
  assert.ok(!existsSync('lib/markos/mcp/tools/index.ts'));
});
test('contracts/openapi.json exists (not public/openapi.json)', () => {
  assert.ok(existsSync('contracts/openapi.json'));
});
```

### Wave 0 Gaps

All test files need creation in Wave 0 (before implementation):

- [ ] `test/growth-218/preflight/architecture-lock.test.js` — runs first, every wave
- [ ] `test/growth-218/preflight/helper-presence.test.js` — verifies 5 helper files
- [ ] `test/growth-218/profile/profile-crud.test.js`
- [ ] `test/growth-218/profile/mode-eligibility-matrix.test.js`
- [ ] `test/growth-218/profile/mode-saas-activation-trigger.test.js`
- [ ] `test/growth-218/activation/definition-crud.test.js`
- [ ] `test/growth-218/pql/pql-score-evidence-trigger.test.js`
- [ ] `test/growth-218/upgrade-triggers/pricing-sentinel-trigger.test.js`
- [ ] `test/growth-218/inapp/approval-pricing-trigger.test.js`
- [ ] `test/growth-218/inapp/frequency-cap-trigger.test.js`
- [ ] `test/growth-218/experiments/activation-guardrail-trigger.test.js`
- [ ] `test/growth-218/experiments/ice-score-computed.test.js`
- [ ] `test/growth-218/agents/registry-non-runnable.test.js`
- [ ] `scripts/preconditions/218-01-check-upstream.cjs` (preflight — Wave 0.5)

Framework install: `npm test` already uses `node --test` — no additional install needed.

---

## Manual-Only Verifications

| ID | Verification | Why Manual |
|----|-------------|-----------|
| MAN-01 | Mode profile change: operator review of activated/deactivated modules before approval | Mode changes affect entire tenant growth motion; no safe automated heuristic |
| MAN-02 | PQL threshold values (e.g., `feature_breadth_pct >= 0.3`) | Operator-configured per tenant; no universal correct value |
| MAN-03 | UpgradeTrigger prompt copy editorial review | Upgrade messaging quality requires human brand/legal judgment |
| MAN-04 | InAppCampaign approval: creative content + timing sensitivity | Customer experience judgment required before activation |
| MAN-05 | Experiment guardrail threshold values | Risk tolerance is operator-configured; automated defaults arbitrary |
| MAN-06 | Plan 218-06 `checkpoint:human-action` — first-run PLG/IAM/XP agent activation review | SG-10 non-runnable invariant: operator must explicitly sign off |
| MAN-07 | P205 sentinel conversion: after P205 lands, review sentinel records before converting to FK | Business decision; cannot automate pricing copy quality judgment |

---

## Open Questions / Decision Points

### Q-1 (RESOLVED): Mode profile → P219+P220 module activation gate
Dynamic `module_mode_eligibility` table + trigger. Column = `saas_growth_profiles.mode`. See §7 Domain 1.

### Q-2 (RESOLVED): LRN-01..05 in Plan 05 — INTEGRATES not OWNS
Plan 05 frontmatter `integrates_with: [LRN-01..05]`. Soft writes to P212 substrates.

### Q-3 (RESOLVED): SAS-09 in Plan 01 — INTEGRATES not OWNS
Plan 01 frontmatter `integrates_with: [SAS-09 from P217]`.

### Q-4 (RESOLVED): P205 Pricing Engine — SOFT with sentinel
Both DB-triggers accept sentinel. Consistent with P219/P220 pattern.

### Q-5 (RESOLVED): PRC-09 — split Plans 03+04
Both plans list PRC-09 in `requirements:`.

### Q-6 (RESOLVED): Mode routing matrix — dynamic DB table
`module_mode_eligibility` 55-row seed. See §7 Domain 1.

### Q-7 (OPEN — REQUIRES PLANNER DECISION): Migration slot ordering conflict

**Problem:** Existing slots 82-89 are all occupied. P219 research incorrectly assumed P218=82-84, P219=85-89. P220 locked slots 90-95+97. P218 and P219 actual available slots are in the 101+ range. However, P220 migrations (90-97) reference `saas_growth_profiles` which P218 creates. Since 90 < 101, P220 migrations would run BEFORE P218 migrations in numeric order — creating a schema dependency violation.

**Options for planner:**
- **Option A:** Renumber P220 locked slots from 90-95+97 to 109-115+117. Requires updating P220-01-PLAN.md through P220-06-PLAN.md frontmatter.
- **Option B:** Give P218 slots below 90 — specifically 90 is P220's first slot, so P218 needs slots in the 78-81 range (slots 70-81 may be available: 70=webhook, 72=webhook_dlq, 73=cli_device, 74=cli_api_keys, 75=cli_runs, 76=cli_env, 77=cli_runs_v2, 81=orgs). Slots 78, 79, 80 are UNOCCUPIED.
- **Option C:** Accept that Supabase applies migrations in filename alphabetic order, not purely numeric — verify whether `78_saas_growth_profiles.sql` actually runs before `90_referral_programs.sql`. If Supabase uses strict numeric prefix ordering, Option A or B is required.

**Recommendation:** Option B (use slots 78-80 for P218). These slots are unoccupied and numerically below P220's 90-95+97 range, satisfying the dependency order. P219 takes slots 81 (unoccupied? need verification — 81 = markos_orgs which IS occupied) — correction: P219 takes slots available between 80 and 90. Slots 78, 79, 80 available for P218 (3 migrations). P219 needs 5 slots — only slot available between 80 and 90 is none. Revised: **P218 takes 78-80, P219 takes 81 (but 81 is occupied)**.

**Escalation:** The slot space between existing migrations (81=orgs, 82-89=foundation, 90-97=P220-locked) is fully compressed. There is literally no space for 8 new migrations (P218+P219) between 81 and 90. The planner must choose one of:
- Renumber P220 slots higher (Option A — cleanest)
- Accept P218/P219 at 101+ and verify that P220 trigger syntax does NOT reference `saas_growth_profiles` at migration apply time (i.e., P220 uses deferred trigger creation via `DO $$ ... $$` block that runs after all migrations are applied)
- Add explicit migration application ordering outside of numeric filename sort

### Q-8 (OPEN): PLG-06 Viral Loop Designer — P218 or P220?
Canon tier PLG lists `Viral Loop Designer` as PLG agent but viral loop mechanics are P220. Seed PLG-06 in P218-06 with `blocking_phase = 'P220-confirm'` OR defer to P220-06. Recommendation: seed in P218-06 with P220 blocking — documents agent existence without conflicting with P220 ownership.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | YES [VERIFIED] | v18+ | — |
| Supabase CLI | Migration deployment | YES [ASSUMED: present for P204] | — | — |
| `npm test` | All tests | YES [VERIFIED: package.json] | — | — |
| P205 Pricing Engine | Plans 03+04 pricing copy | NOT YET | — | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel |
| P212 LRN substrate | Plan 05 learning writes | NOT YET | — | No-op soft degrade |
| PostHog/analytics connector | PQL scorer activation events | NOT YET (P210) | — | `event_name` string field only |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `saas_suite_activations` table name is P214's output | §5 Upstream | If P214 uses different name, `MODE_REQUIRES_SAAS_ACTIVATION` trigger fails |
| A2 | P219 research slot assumption (82-89) is incorrect and will be corrected | §6 Slot Collision | If not corrected, P219 plans attempt occupied slots |
| A3 | `module_mode_eligibility` is service-role-owned (no RLS) and readable by migration-time triggers from P219+P220 | §7 Domain 1 | If RLS required, P219+P220 trigger access pattern changes |
| A4 | P220 `growth_agent_readiness` will consolidate P218+P219 agent-readiness holding tables | §7 Domain 6 | If not, permanent separate tables per phase |
| A5 | Supabase CLI applies migrations in strict filename numeric prefix order | §6 Q-7 | If sort order is different, slot-ordering conflict may not be a real problem |
| A6 | Doc 17 TypeScript interfaces are accurate for column shapes; canon wins where conflict exists | §7 all domains | Doc 17 is RAW intake per CLAUDE.md; verify against canon before coding |

---

## Sources

### Primary (HIGH confidence)

- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` — [VERIFIED: codebase] — SaaS modes, module matrix, approval posture, Pricing Engine relationship
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — [VERIFIED: codebase] — Object shapes for SaaSGrowthProfile, ActivationDefinition, PQLScore, InAppCampaign, MarketingExperiment
- `obsidian/brain/Pricing Engine Canon.md` — [VERIFIED: codebase] — `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel, pricing copy doctrine
- `.planning/REQUIREMENTS.md` — [VERIFIED: codebase] — Requirement IDs, traceability (LRN=P212, SAS-09=P217)
- `.planning/ROADMAP.md` lines 364-413 — [VERIFIED: codebase] — P218 scope, depends-on, P219/P220 boundary
- Codebase filesystem enumeration 2026-04-26 — [VERIFIED: codebase] — helper files (buildApprovalPackage:68, requireHostedSupabaseAuth:491, resolvePlugin:102), migration slots 82-89+96+100 occupied, `npm test` runner confirmed

### Secondary (MEDIUM confidence)

- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` — [VERIFIED: codebase; RAW intake per CLAUDE.md] — TypeScript interfaces ActivationDefinition (line 159), PQLScore (line 237), InAppCampaign (line 766), MarketingExperiment (line 1154)
- `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/219-RESEARCH.md` — [VERIFIED: codebase] — P219 slot assumptions, F-ID range, assertUpstreamReady pattern, architecture-lock code
- `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/220-RESEARCH.md` — [VERIFIED: codebase] — P220 slot reservation (90-95+97), F-IDs F-209..F-227

### Tertiary (LOW confidence / ASSUMED)

- PQL signal weights (usage signals = highest, intent = medium, fit = contextual) — [ASSUMED: doc 17 descriptions; operator-configured in practice]
- `MARKOS_GROWTH_CRON_SECRET` env var name — [ASSUMED: follows pattern of `MARKOS_WEBHOOK_CRON_SECRET`]
- P214 table name `saas_suite_activations` — [ASSUMED: matches REQUIREMENTS.md SAS-02 description; P214 not yet executed]

---

## Metadata

**Confidence breakdown:**
- Standard stack / architecture-lock: HIGH — verified on disk
- Schema shapes: HIGH — derived from canonical spec + doc 17 interfaces, cross-checked against canon
- Migration slots: MEDIUM — collision found and documented; recommended slot resolution in Q-7 needs planner decision
- Pitfalls: HIGH — directly from 218-REVIEWS.md, P219/P220 research lessons
- Cross-phase coordination: HIGH — P219/P220 RESEARCH.md provides exact table names and FK dependencies

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days; re-verify P205 and P212 landing status + slot Q-7 resolution before execution)

---

## RESEARCH COMPLETE
