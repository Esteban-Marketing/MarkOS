# Phase 222: CRM Timeline and Commercial Memory Workspace - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)
**Last Update:** 2026-04-26 — review-driven D-NN additions per `222-REVIEWS.md` (7 HIGH + 4 MED + 2 LOW)

<domain>
## Phase Boundary

Phase 222 evolves MarkOS into a timeline-first CRM with Customer 360 SOR, buying-committee intelligence, durable next-best-action (NBA), lifecycle orchestration, and commercial-memory-survives-handoffs across marketing, sales, customer success, support, and billing. It is the operational overlay that sits on top of the P221 CDP SOR and feeds every downstream commercial engine (P223 dispatch, P224 conversion/launch, P225 analytics, P226 sales enablement, P227 ecosystem).

**In scope:** customer_360_records, opportunities, buying_committees, buying_committee_members, lifecycle_transitions, nba_records, commercial_signal + source_domain timeline extensions, multi-role ownership tuple, Timeline-first record detail + BuyingCommittee panel + NBAExplain panel (evolving P102/P103/P105 surfaces), full read-write `/v1/crm/*` API + 4 MCP tools.

**Out of scope (deferred to later phases):**
- Native email/SMS/WhatsApp/push dispatch — P223.
- Conversion surfaces, landing pages, forms, launch orchestration — P224.
- Semantic attribution, journey analytics, narrative intelligence — P225.
- Sales enablement (battlecards, proof packs, deal-execution proposals) — P226.
- Ecosystem/partner/affiliate/community/developer growth workflows — P227.
- Identity/consent/event/trait/audience substrate — P221 (already planned).

Phase 222 is additive: existing P100-P105 CRM (crm_entities, workspace.ts, execution.ts, timeline.ts, copilot.ts, reporting.ts) stays functional. Customer360 is a new durable SOR layered on top; legacy consumers migrate phase-by-phase.
</domain>

<decisions>
## Implementation Decisions

### Customer 360 shape
- **D-01:** New `customer_360_records` table is the durable SOR with `entity_type ∈ {account, person}` discriminator. Opportunity is a separate `opportunities` table (distinct lifecycle, amount, close_date, stage_id). Matches doc 18 `Customer360Record` + `Opportunity` split. Existing `crm_entities` stays as legacy operational base during transition.
- **D-02:** Customer360 carries: `canonical_identity_id` (FK → CDP `cdp_identity_profiles` from P221), `display_name`, `entity_type`, `mode (b2b|b2c|plg_b2b|plg_b2c|b2b2c)`, `lifecycle_stage`, multi-role ownership tuple (see D-16), unified score envelope (see D-09), `current_summary` (copilot-generated), `next_best_action_id` (FK → `nba_records`), `open_tasks`, `active_opportunities`, `last_meaningful_event_at`, tenant_id + RLS.
- **D-03:** Opportunity carries doc 18 shape: `opportunity_id`, `tenant_id`, `account_id` (FK → customer_360_records where entity_type=account), `primary_person_id` (FK → person entity_type), `title`, `pipeline_id`, `stage_id`, `stage_probability`, `amount`, `currency`, `expected_close_date`, `source_motion ∈ {inbound, outbound, plg, partner, community, event, expansion}`, `pricing_context_id` (FK → Pricing Engine), `active_objections[]`, `requested_artifacts[]`, `competitive_set[]`, `health ∈ {healthy, watch, at_risk, stalled}`, `next_required_action`, `approval_blockers[]`, `evidence_gaps[]`.

### Identity graph scope (v1)
- **D-04:** `entity_type` enum accepts `person | account` in v1. Workspace and household deferred to P218/P225 per P221 D-02 scope carry-forward. Enum may extend; ingest does not emit them in v1.

### Timeline taxonomy
- **D-05:** Extend `crm_activity` with new columns: `source_domain ∈ {website, email, messaging, meeting, crm, billing, support, product, social, research, agent}`, `commercial_signal ∈ {interest, risk, expansion, renewal, support, pricing, silence, null}`, `actor_type ∈ {human, agent, system}`, `actor_id`, `opportunity_id` (FK), `sentiment ∈ {positive, neutral, negative, null}`, `thread_id`. Preserve current `activity_family` column with alias mapping (ACTIVITY_FAMILY_ALIASES in `lib/markos/crm/timeline.ts`) as legacy taxonomy.
- **D-06:** `buildCrmTimeline` upgraded to expose both `activity_family` (backward-compat) and `source_domain + commercial_signal + actor_type` (new). Projection filter from P101 D-01 (HIGH_SIGNAL-only for operator timeline) preserved.
- **D-07:** CRM writes emit `EventEnvelope` rows into `cdp_events` with `event_domain='crm'` (closes the CDP ↔ CRM loop per P221 D-08/D-10). Dual-write via the P221 tracking ingest path; CRM mutation → crm_activity row + cdp_events row with shared `source_event_ref`.

### Next-best-action (NBA) durability
- **D-08:** New `nba_records` table is the durable SOR with: `nba_id`, `tenant_id`, `subject_type ∈ {customer_360, opportunity, person}`, `subject_id`, `action_type`, `rationale`, `evidence_refs[]` (FK → EvidenceMap from P209), `computed_at`, `expires_at`, `confidence`, `approval_ref` (nullable, FK → approval_package from P208), `superseded_by` (nullable, FK → nba_id), `status ∈ {active, executed, dismissed, expired, superseded}`. Executor, queue, and copilot all read the same record.

### Score envelope
- **D-09:** Unified scores on Customer360 with nullable fields per `entity_type`: `fit_score`, `intent_score`, `engagement_score`, `product_signal_score` (nullable — PLG/product-instrumented tenants only), `revenue_score` (nullable — customer/expansion entities only), `risk_score`. Opportunity has its own scores: `stage_probability`, `health_score`, `evidence_gap_score`. Score provenance follows P209 EvidenceMap (source_event_refs[] + computed_at + freshness_mode + confidence).
- **D-10:** Score freshness cadence matches P221 D-15: real_time for intent/engagement (event-driven recompute), hourly for lifecycle/product_signal, daily for fit/revenue/risk. Score recompute cron bridges to P207 AgentRun v2 (same pattern as P221 D-8 trait recompute).

### Lifecycle state SOR
- **D-11:** `lifecycle_stage` is a column on `customer_360_records` with doc 18 enum: `anonymous | known | engaged | mql | sql | opportunity | customer | expansion | renewal | advocate | lost`. Fast reads.
- **D-12:** New `lifecycle_transitions` append-only event table captures every stage change: `transition_id`, `tenant_id`, `customer_360_id`, `from_stage`, `to_stage`, `actor_id`, `actor_type`, `evidence_ref`, `reason`, `transitioned_at`. Event-sourced audit trail. Satisfies P100 D-10 audit mandate + P209 evidence linkage.
- **D-13:** Stage transitions emit `crm_activity` row (`source_domain='crm'`, `commercial_signal` varies: `mql`→`interest`, `customer`→`expansion` potential, `lost`→`risk`, etc.) and `cdp_events` envelope. Transitions are writeback-worthy per doc 18.

### Buying committee model
- **D-14:** New `buying_committees` table: `committee_id`, `tenant_id`, `subject_type ∈ {opportunity, account}`, `subject_id`, `coverage_score` (0-100), `missing_roles[]`, `last_assessed_at`, `assessment_actor_id`. Supports opportunity-level (B2B deal committees) AND account-level (PLG buying groups, partner committees).
- **D-15:** New `buying_committee_members` table: `member_id`, `committee_id`, `person_id` (FK → customer_360_records where entity_type=person), `role ∈ {champion, economic_buyer, technical_buyer, end_user, blocker, legal, finance, unknown}`, `influence_score`, `engagement_score`, `last_touch_at`, `proof_gap_refs[]`. Role history preserved via `valid_from` / `valid_to` columns (soft-delete on role change creates new row).

### Ownership semantics
- **D-16:** Multi-role ownership tuple on Customer360: `account_owner_user_id`, `cs_owner_user_id`, `marketing_owner_user_id` (all nullable). Opportunity carries its own `deal_owner_user_id`. `primary_owner_user_id` is a computed column driven by lifecycle_stage:
  - `anonymous | known | engaged | mql` → `marketing_owner_user_id`
  - `sql | opportunity` → `deal_owner_user_id` (from primary active opportunity) or fallback `account_owner_user_id`
  - `customer | expansion | renewal | advocate` → `cs_owner_user_id` or fallback `account_owner_user_id`
  - `lost` → `account_owner_user_id`
- **D-17:** Ownership changes = explicit handoff events. Ownership column mutation writes a row to `lifecycle_transitions` (`reason='handoff'`, `from_actor_id`/`to_actor_id` populated) and a `crm_activity` row (`source_domain='crm'`, `commercial_signal='null'`, `actor_type='human'` or `'agent'`). Queue + task routing reads `primary_owner_user_id`.

### Migration strategy
- **D-18:** New `customer_360_records` + `opportunities` are durable SOR populated by backfill from existing `crm_entities` + CDP profile join (via P221 adapter) + computed score envelope. `crm_entities` stays as legacy base during transition (P223+ writes through customer_360_records first, then dual-writes to crm_entities during shim window).
- **D-19:** Read-through adapter `lib/markos/crm360/adapters/legacy-entity.ts` bridges existing P102/P103/P104/P105 code (workspace.ts, execution.ts, copilot.ts, reporting.ts) to Customer360. No rewrite in P222 — consumers migrate phase-by-phase. Adapter contract mirrors P221 D-20 pattern.
- **D-20:** Migration cron reconciles `customer_360_records` ↔ `crm_entities` during shim window (daily); drift threshold emits operator task. Full cutover (crm_entities becomes derived view only) lands in post-P222 cleanup phase.

### CDP ↔ CRM integration
- **D-21:** Customer360 reads CDP IdentityProfile + ConsentState + TraitSnapshot via the P221 read-through adapter (`lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`). CRM never stores identity/consent/trait data — it stores commercial overlay only (fit/intent/health/risk/lifecycle/ownership/opportunity). **REVISED per RH3 + RM1 (review 2026-04-26):** P221 is a HARD prerequisite via `assertUpstreamReady(['P221'])` — Plan 01 Task 0.5 preflight CLI verifies `lib/markos/cdp/adapters/crm-projection.ts` exists; throws `UpstreamPhaseNotLandedError` if absent. NO "stub if missing" / NO "A3 guard" branches. `cdp-overlay.ts` calls `assertUpstreamReady(['P221'])` at top; downstream code assumes P221 present.
- **D-22:** CRM mutations emit `EventEnvelope` rows to `cdp_events` with `event_domain='crm'` (P221 D-08). Shared `source_event_ref` threads CRM activity ↔ CDP events ↔ EvidenceMap (P209). No dual-write drift — CDP remains SOR for identity/consent; CRM is SOR for commercial state.
- **D-23:** CDP consent re-validation at dispatch (P221 D-18 double-gate) applies to every CRM-initiated external action. Opportunity state changes that mention pricing use `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder until Pricing Engine context is attached.

### Workspace + UI surface
- **D-24:** Evolve existing surfaces; no parallel CRM workspace (honors P208 single-shell rule):
  - `components/markos/crm/workspace-shell.tsx` keeps 6 views (Kanban default for lists, P102 D-02); selecting a record opens **TimelineDetailView** as new default (currently Detail view).
  - `components/markos/crm/execution-queue.tsx` reads from `nba_records` instead of computing on-read (P103 D-04 urgency bias preserved: due/overdue > NBA suggestions).
  - `components/markos/crm/copilot-record-panel.tsx` consumes Customer360 `current_summary` + NBA + evidence_refs (P105 D-01/D-03 record brief + evidence-inline posture preserved).
- **D-25:** New UI components:
  - `TimelineDetailView` — chronological timeline with `source_domain` + `commercial_signal` filters, operator-readable actor/evidence chips.
  - `BuyingCommitteePanel` — opportunity/account detail panel showing committee coverage %, filled roles, missing_roles, per-member influence/engagement/last_touch_at. Action: "Invite role" creates task + draft outreach (approval-gated per P104 D-05).
  - `NBAExplainPanel` — shows nba_records row with rationale + evidence_refs + expires_at + approval_ref (if present). Operator-inline acceptance routes through existing P105 approval-package pattern.
  - `LifecycleTransitionTimeline` — stage history with actor + evidence + reason.

### API + MCP surface
- **D-26:** Read-write v1 `/v1/crm/*` API:
  - `/v1/crm/customer360` — GET (single + list with entity_type filter + saved-view filters), PATCH (owner + summary + lifecycle_stage — approval-aware)
  - `/v1/crm/opportunities` — GET, POST, PATCH (stage, amount, health, requested_artifacts — approval-aware on pricing mutations)
  - `/v1/crm/committees` — GET (by subject), POST member, PATCH member (role/influence/engagement), DELETE member (soft)
  - `/v1/crm/lifecycle-transitions` — GET (append-only history)
  - `/v1/crm/nba` — GET (active by subject), POST dismiss, POST execute (routes to approval if required)
  - `/v1/crm/timeline` — GET (by subject, with source_domain/commercial_signal filters)
- **D-27:** MCP tools:
  - `get_customer_360` — full record + latest scores + primary_owner + active NBA
  - `get_opportunity_context` — opp + committee coverage + active objections + evidence_gaps + NBA
  - `list_committee_gaps` — opportunities with missing_roles
  - `list_next_best_actions` — filtered by subject_type, expires_after, owner
- **D-28:** Write APIs honor existing approval-package pattern (P105 D-06/D-07). High-risk mutations (lifecycle to `customer`/`lost`, pricing_context_id change, owner handoff across roles) require approval. Low-risk (note, NBA dismiss, role tag) proceed within role limits.

### Observability + operator posture
- **D-29:** Operator surfaces reuse existing patterns (no new dashboards, honors P208):
  - Approval Inbox (P208) gains Customer360 + Opportunity + NBA entry types.
  - Morning Brief (P208) surfaces top-N active NBA by primary_owner + top-N committee-gap opportunities.
  - CRM reporting cockpit (P105 reporting.ts) gains lifecycle funnel + committee coverage rollup + NBA execution rate.
  - Migration drift audit (D-20) emits operator task when customer_360_records ↔ crm_entities drift detected.

### Security + tenancy
- **D-30:** RLS on all new tables (`customer_360_records`, `opportunities`, `lifecycle_transitions`, `nba_records`, `buying_committees`, `buying_committee_members`). Fail closed on missing tenant context (P100 D-09).
- **D-31:** Unified `markos_audit_log` (P201 hash chain) captures all Customer360/Opportunity/NBA mutations + lifecycle transitions + owner handoffs + committee member role changes.
- **D-32:** CDP deletion cascade (P221 D-24 tombstone) propagates to Customer360: profile tombstone → Customer360 `canonical_identity_id` nulled, PII-derived columns scrubbed (display_name, current_summary), ownership/lifecycle/NBA preserved for audit but marked `tombstoned=true`. Opportunity + Committee preserved (legal + revenue trail).

### Contracts + migrations
- **D-33:** Fresh F-ID allocation (planner decides exact numbers at plan time). Expect 7-9 new contracts:
  - F-xxx-crm-customer-360-v1
  - F-xxx-crm-opportunity-v1
  - F-xxx-crm-lifecycle-transition-v1
  - F-xxx-crm-nba-record-v1
  - F-xxx-crm-buying-committee-v1
  - F-xxx-crm-buying-committee-member-v1
  - F-xxx-crm-timeline-extensions-v1 (source_domain + commercial_signal + actor_type envelope)
  - F-xxx-crm-customer-360-read (MCP tool contract)
  - F-xxx-crm-opportunity-context-read (MCP tool contract)
- **D-34:** New migrations allocated by planner (expect 5-7): customer_360_records + opportunities + lifecycle_transitions + nba_records + buying_committees + buying_committee_members + crm_activity column extensions. All with RLS + audit.

---

## Review-driven decisions (2026-04-26 Claude-runtime override review — Codex usage limit reached, gemini/opencode not installed)

### Architecture lock + runtime conventions
- **D-35:** **Architecture lock — runtime conventions for P222 (architecture-lock test enforcement).** P222 implementation MUST honor:
  - **API surface:** legacy `api/*.js` flat (NO `app/api/v1/`, NO App Router `route.ts`). All `/v1/crm/*` REST handlers under `api/v1/crm/*.js` files.
  - **Cron surface:** legacy `api/cron/*.js` flat. P222 ships `api/cron/crm360-{drift,nba-expire,daily-recompute}.js`.
  - **Auth (REST):** `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`. NOT `requireSupabaseAuth`, NOT `requireTenantContext`.
  - **Auth (cron):** shared-secret header `x-markos-cron-secret` + `Authorization: Bearer ${MARKOS_CRON_SECRET}` fallback (mirrors `api/cron/webhooks-dlq-purge.js:25-34` pattern).
  - **Test runner:** `npm test` (Node `--test`). NO vitest install, NO playwright install. All `.test.ts` → `.test.js`. Test files use `node:test` + `node:assert/strict`.
  - **OpenAPI registry:** `contracts/openapi.json` (NOT `public/openapi.json`).
  - **MCP tools index:** `lib/markos/mcp/tools/index.cjs` (NOT `index.ts`).
  - **Plugin lookup:** `resolvePlugin` from `lib/markos/plugins/registry.js:102` (NOT `lookupPlugin`).
  - **Approval helper:** `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` (NOT `createApprovalPackage`).
  - **Service-role client:** P222 NEVER constructs `serviceRoleClient` directly outside `requireHostedSupabaseAuth` boundary; auth-bound `req.context.supabase` is the only path.
  - Plan 01 Task 0.5 ships forbidden-pattern detector test that scans every `.planning/phases/222-*-PLAN.md` file for the rejected tokens (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient outside auth, lookupPlugin, public/openapi.json, app/(public), app/(markos), `route\.ts` outside doctrinal NO-X comments, vitest run, from 'vitest', `\.test\.ts`, "stub if missing", "if exists"). Reasoning: prior phase reviews (P223..P228) all flagged identical hallucinations; pre-execution detector prevents re-introduction.

### Greenfield ownership map
- **D-36:** **`lib/markos/crm360/*` is P222-owned greenfield.** Every module under this tree is created in this phase; nothing pre-exists. Plan 01 Task 0.5 architecture-lock test asserts `lib/markos/crm360/preflight/*` files are the FIRST writes; subsequent module creation in Plans 01..06 is allowed.
- **D-37:** **`lib/markos/cdp/*` is P221-owned UPSTREAM greenfield (NOT P222).** P222 NEVER writes files under `lib/markos/cdp/`. P222 only consumes `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` after P221 has landed. `cdp-overlay.ts` (P222-owned at `lib/markos/crm360/adapters/cdp-overlay.ts`) calls `assertUpstreamReady(['P221'])` at module top; throws `UpstreamPhaseNotLandedError` if `lib/markos/cdp/adapters/crm-projection.ts` is absent. NO "A3 stub if missing" branch.

### Hard preflight upstream gate
- **D-38:** **Hard preflight gate via `assertUpstreamReady(['P208', 'P209', 'P211', 'P221'])`.** Plan 01 Task 0.5 ships:
  - `scripts/preconditions/222-check-upstream.cjs` — CLI that verifies P208 (`buildApprovalPackage` export at `lib/markos/crm/agent-actions.ts:68`), P209 (`EvidenceMap` library presence), P211 (`{{MARKOS_PRICING_ENGINE_PENDING}}` rule wiring + content classifier), P221 (`lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` + `cdp_events` table) ALL exist before any P222 runtime path executes.
  - `lib/markos/crm360/preflight/upstream-gate.ts` — `assertUpstreamReady(phases: string[])` runtime helper consumed by every P222 module that depends on P208/P209/P211/P221.
  - `lib/markos/crm360/preflight/errors.ts` — `UpstreamPhaseNotLandedError` thrown class.
  - `lib/markos/crm360/preflight/architecture-lock.ts` — runtime forbidden-pattern detector (mirror of test) + plan-time scan.
  - `test/crm360/preflight/architecture-lock.test.js`, `test/crm360/preflight/upstream-gate.test.js`, `test/crm360/preflight/helper-presence.test.js` — test trio confirming gate behavior + helper symbol presence.
  - **REQUIRED_UPSTREAM constant:** `['P208', 'P209', 'P211', 'P221']`. NO soft-skip, NO "stub if missing" branch. Phase fails fast if upstream absent.

### Test runner + framework
- **D-39:** **Test runner pinned to `npm test` (Node `--test`).** All P222 test files are `.test.js`, NOT `.test.ts`. They `import { test, describe } from 'node:test'` and `import assert from 'node:assert/strict'`. NO vitest, NO playwright install in P222. Verify command on every plan: `npm test` (NOT `vitest run`, NOT `node --test test/crm360/`). Plan 06 closeout includes a meta-test that asserts `package.json` did not gain `vitest` or `@playwright/test` keys during P222 execution.

### OpenAPI + contracts location
- **D-40:** **OpenAPI registry path: `contracts/openapi.json`** (NOT `public/openapi.json`). All F-ID yaml files (F-113..F-121) live under `contracts/F-*.yaml`. `flow-registry.json` is the F-ID index.

### MCP tools location
- **D-41:** **MCP tools index path: `lib/markos/mcp/tools/index.cjs`** (NOT `index.ts`). P222 MCP tools are written as `.cjs` modules; `lib/markos/crm360/mcp/tools.cjs` (P222-owned) registers via `lib/markos/mcp/tools/index.cjs` extension point.

### Buy approval helper symbol
- **D-42:** **Approval helper symbol: `buildApprovalPackage` (NOT `createApprovalPackage`).** Imported from `lib/markos/crm/agent-actions.ts:68`. P222 wires `buildApprovalPackage` in:
  - **NBA execute path (Plan 04 + Plan 05):** `api/v1/crm/nba/[id]/execute.js` calls `buildApprovalPackage(...)` when NBA `action_type` is in `ACTION_TYPES_REQUIRING_APPROVAL` (send_followup, propose_expansion, send_renewal_reminder, draft_outreach).
  - **Lifecycle transition path (Plan 04 + Plan 05):** `api/v1/crm/lifecycle-transitions.js` calls `buildApprovalPackage(...)` when transition crosses high-risk boundary (any → customer, any → lost, role-handoff across primary owner classes).
  - **Tombstone cascade path (Plan 04):** `lib/markos/crm360/records/tombstone.ts` calls `buildApprovalPackage(...)` when tombstone affects an opportunity with active billing or non-empty `pricing_context_id`.
  - **Acceptance:** `grep -c "buildApprovalPackage" .planning/phases/222-*-PLAN.md` >= 3 (NBA execute + lifecycle + tombstone).
  - **Forbidden:** `createApprovalPackage` MUST NOT appear in any P222 plan or implementation file (only in doctrinal NO-X comments + the architecture-lock detector's forbidden-pattern array).

### Legacy api/ surface (RH1 fix)
- **D-43:** **Plan 05 REST handlers ship as legacy `api/v1/crm/*.js` (NOT `app/api/v1/crm/*/route.ts`).** All 10 endpoints:
  - `api/v1/crm/customer360.js` (GET list)
  - `api/v1/crm/customer360/[id].js` (GET single, PATCH)
  - `api/v1/crm/opportunities.js` (GET list, POST)
  - `api/v1/crm/opportunities/[id].js` (GET single, PATCH)
  - `api/v1/crm/committees.js` (GET, POST member, PATCH member, DELETE member)
  - `api/v1/crm/lifecycle-transitions.js` (GET history)
  - `api/v1/crm/nba.js` (GET list)
  - `api/v1/crm/nba/[id]/dismiss.js` (POST)
  - `api/v1/crm/nba/[id]/execute.js` (POST — calls buildApprovalPackage)
  - `api/v1/crm/timeline.js` (GET)
  - Auth on every handler: `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`.
  - Each handler reads `req.context.supabase` (auth-bound) for tenant-scoped DB access.
  - JSON read/write via `writeJson(res, status, payload)` helper (mirror `api/cron/webhooks-dlq-purge.js:14-23` style).

### Legacy api/cron/ surface (RH2 fix)
- **D-44:** **Plan 06 cron handlers ship as legacy `api/cron/*.js` (NOT `app/api/cron/*/route.ts`).** All 3 cron files:
  - `api/cron/crm360-drift.js` — daily 03:00 UTC drift reconciliation
  - `api/cron/crm360-nba-expire.js` — hourly NBA expiry sweep
  - `api/cron/crm360-daily-recompute.js` — daily 02:00 UTC NBA recompute scheduler
  - Auth on every cron: `x-markos-cron-secret` header OR `Authorization: Bearer ${MARKOS_CRON_SECRET}`. Mirror `api/cron/webhooks-dlq-purge.js:25-34` `authorized(req)` helper. POST-only enforcement (Vercel cron triggers fire POST by default).
  - vercel.json `crons` array uses paths `/api/cron/crm360-drift`, `/api/cron/crm360-nba-expire`, `/api/cron/crm360-daily-recompute` (NOT `/api/cron/crm360-*/`).

### Lifecycle transition DB-trigger (RH6 fix)
- **D-45:** **Lifecycle transition state-machine enforcement at DB-layer (BEFORE UPDATE trigger).** Plan 04 owns new migration that adds:
  - BEFORE UPDATE trigger on `customer_360_records.lifecycle_stage`.
  - Trigger validates state transitions per doc 18 forward-only flow:
    - Forward: `anonymous → known → engaged → mql → sql → opportunity → {customer | lost}`; `customer → {expansion | renewal | advocate | lost}`; `expansion ↔ renewal`; `* → lost` always allowed.
    - Reverse paths blocked by default (e.g., `customer → known` rejected); `reason='reactivation'` or `reason='manual_override'` permitted with audit row.
  - Trigger writes `lifecycle_transition_audit` row (separate from `lifecycle_transitions` event table — the `_audit` table captures the trigger's enforcement-side decision: allowed/rejected/override) with old_stage + new_stage + actor + reason + decision.
  - Service-role direct UPDATE that bypasses API → trigger STILL fires. App-layer enforcement is no longer trusted as sole gate (per P226 RH5/RH6 doctrine).
  - **Test:** SQL test attempts invalid transition (e.g., anonymous → customer skipping known/engaged), asserts trigger rejection (raises exception OR rolls back).

### Score provenance immutability DB-trigger (RM2 fix)
- **D-46:** **Score provenance immutability at DB-layer (append-only model, BEFORE UPDATE trigger).** Plan 04 owns new migration that adds:
  - BEFORE UPDATE trigger on `score_provenance` table (created in Plan 04 alongside `nba_records`).
  - Trigger blocks edits to `recorded_at`, `score_value`, `score_kind`, `attribution_chain` columns once committed (compares OLD vs NEW; raises exception if any of those four columns differ).
  - Allowed updates: `superseded_at` (NULL → timestamp), `superseded_by` (NULL → uuid). These represent explicit replacement, NOT in-place edit.
  - Pattern: append-only history. New score = new row. Old row gets `superseded_at` + `superseded_by` set; immutable thereafter.
  - **Test:** SQL test attempts UPDATE on `score_provenance.score_value` for committed row; asserts trigger rejection.

### Tombstone cascade outbox model (RM3 fix)
- **D-47:** **Tombstone cascade via outbox pattern (replayable + idempotent + dead-letter aware).** Plan 04 owns new migration that adds:
  - `crm360_tombstone_outbox` table with schema: `outbox_id, tenant_id, tombstone_id, target_table, target_id, state ∈ {pending, processing, completed, failed, dead_letter}, attempts (default 0), last_attempt_at, error_message, created_at, completed_at`.
  - RLS + tenant isolation on outbox table.
  - Tombstone write path: when `tombstoneCustomer360` (Plan 04) marks `customer_360_records.tombstoned=true`, in the SAME transaction it INSERTs outbox rows for cascade targets:
    - `customer_360_records` itself (mark display_name='[redacted]', current_summary=NULL — already done by tombstone primary write)
    - `nba_records` rows for subject_id (mark all active as expired, payload scrubbed)
    - `score_provenance` rows for the tombstoned customer_360_id (no scrub — append-only, just superseded)
    - `lifecycle_transitions` rows (no scrub — audit trail preserved)
    - Active `opportunities` rows linked to tombstoned customer (mark health='stalled', preserve revenue trail)
  - Plan 06 owns `lib/markos/crm360/reconciliation/tombstone-cascade-worker.ts` + `api/cron/crm360-drift.js` extension that drains outbox: each cascade target processed idempotently, marked completed OR failed→retry OR dead_letter after max 5 attempts. Retry backoff: exponential (1m → 5m → 30m → 2h → 12h).
  - **Test:** tombstone INSERT produces N outbox rows (N = number of cascade targets); worker run processes all; failed cascade retried per attempt limit; row 5 attempts → dead_letter.

### Migration slot pre-allocation (RL2 fix)
- **D-48:** **Migration slot table — P222 owns 106..112.** Verified against current repo (highest pre-P222 migration: 96; P221 reserves 97..105 estimated).
  | Slot | File | Plan | Owns |
  |------|------|------|------|
  | 106 | `supabase/migrations/106_crm360_customer360_opportunities.sql` | 01 | customer_360_records + opportunities + RLS + indexes |
  | 107 | `supabase/migrations/107_crm360_lifecycle_transitions.sql` | 02 | lifecycle_transitions append-only + RLS + UPDATE/DELETE block |
  | 108 | `supabase/migrations/108_crm360_nba_records.sql` | 04 | nba_records + RLS + partial active index + score_provenance + lifecycle_transition state-machine trigger (D-45) + score immutability trigger (D-46) + crm360_tombstone_outbox (D-47) |
  | 109 | `supabase/migrations/109_crm360_buying_committees.sql` | 05 | buying_committees + buying_committee_members + RLS + role history index |
  | 110 | `supabase/migrations/110_crm360_crm_activity_extensions.sql` | 03 | crm_activity_ledger ADD COLUMN + composite indexes + backfill |
  | 111 | `supabase/migrations/111_crm360_indexes_rls_hardening.sql` | 06 | additional composite indexes + RLS assertion DO block across all 6 P222 tables |
  | 112 | `supabase/migrations/112_crm360_drift_audit_extensions.sql` | 06 | crm360_drift_audit_log + cron operator-task linkage |
  - **Plan 06 closeout test:** `migration-slot-collision.test.js` regression test that scans `supabase/migrations/` for any 1NN_*.sql file overlap and asserts P222 owns exactly 7 slots in 106..112 with no gaps.

### F-ID slot pre-allocation (RL2 fix)
- **D-49:** **F-ID slot table — P222 owns F-113..F-121** (9 contracts). Verified P211/P221 reservations:
  | F-ID | File | Scope | Plan |
  |------|------|-------|------|
  | F-113 | `contracts/F-113-crm-customer360-v1.yaml` | Customer360 read+patch | 01 |
  | F-114 | `contracts/F-114-crm-opportunity-v1.yaml` | Opportunity CRUD + approval-gated pricing | 01 |
  | F-115 | `contracts/F-115-crm-lifecycle-transition-v1.yaml` | Lifecycle transition append-only read | 02 |
  | F-116 | `contracts/F-116-crm-nba-record-v1.yaml` | NBA read + dismiss + execute (approval-gated via buildApprovalPackage) | 04 |
  | F-117 | `contracts/F-117-crm-buying-committee-v1.yaml` | Buying committee read+upsert | 05 |
  | F-118 | `contracts/F-118-crm-buying-committee-member-v1.yaml` | Committee member CRUD with concurrency | 05 |
  | F-119 | `contracts/F-119-crm-timeline-extensions-v1.yaml` | Extended timeline with source_domain + commercial_signal | 03 |
  | F-120 | `contracts/F-120-crm-customer360-read.yaml` | MCP tool: get_customer_360 | 05 |
  | F-121 | `contracts/F-121-crm-opportunity-context-read.yaml` | MCP tool: get_opportunity_context + list_committee_gaps + list_next_best_actions | 05 |
  - **Plan 06 closeout test:** `f-id-collision.test.js` regression test that scans `contracts/flow-registry.json` for F-ID overlap and asserts P222 owns exactly 9 slots (F-113..F-121) with no gaps.

### Plan 04 mirror-refactor scope (RH7 fix)
- **D-50:** **`lib/markos/crm/execution.cjs` does NOT exist** (verified 2026-04-26 via `ls lib/markos/crm/`: agent-actions.ts, api.cjs, api.ts, attribution.ts, contracts.cjs, contracts.ts, copilot.ts, entities.cjs, entities.ts, execution.ts, identity.ts, merge.cjs, merge.ts, playbooks.ts, reporting.ts, timeline.cjs, timeline.ts, tracking.ts, workspace-data.ts, workspace.ts). Plan 04 mirror-refactor scope DROPPED. Refactor target is `lib/markos/crm/execution.ts` ONLY. NO conditional "if exists" planning. If a `.cjs` twin lands in a future phase, separate refactor task is owned by that phase, NOT P222.

### Plan 06 autonomous flag (RL1 fix)
- **D-51:** **Plan 06 `autonomous: false`.** Drift reconciliation requires operator review before reconciliation rules are committed. Plan 06 Task 1 ships `checkpoint:human-action` for operator to review the first detected drift batch (validates classification thresholds + acceptable divergence patterns). Subsequent runs autonomous (after operator confirms classification). Per P223 D-49 / P226 W1 mitigation pattern.

### Claude's Discretion
- Module boundary under `lib/markos/crm360/*` (records vs opportunities vs committees vs nba vs adapters).
- NBA recompute infrastructure (cron vs AgentRun vs event-triggered) — align with P207 + P221 trait recompute pattern at plan time.
- Computed column for `primary_owner_user_id` — postgres generated column vs application-side derivation. Planner picks based on RLS performance.
- Exact contract IDs, migration numbers, test file names per current repo conventions.
- TimelineDetailView + BuyingCommitteePanel + NBAExplainPanel component implementation details (density, typography, chip colors) — follow repo-native CRM patterns.

### Folded Todos
None — no pending todos matched Phase 222 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (product shape — precedence 1-2)
- `obsidian/work/incoming/18-CRM-ENGINE.md` — CRM doctrine: 6 core rules, Customer360Record shape (§Part 1), AccountWorkspace/PersonWorkspace/BuyingRole (§Part 2), Opportunity model + LifecycleStage enum (§Part 3 lines 283-320), CrmTimelineEvent shape (§Part 1 lines 139-186), handoff rule (§Core Doctrine rule 5).
- `obsidian/work/incoming/20-CDP-ENGINE.md` — CDP substrate CRM consumes via P221 adapter (see P221-CONTEXT.md for decisions).
- `obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md` — downstream P226 consumer; CRM commercial memory shape must support battlecards + proof packs without rewrite.
- `obsidian/brain/MarkOS Canon.md` — product north star.
- `obsidian/brain/Brand Stance.md` — voice/tone for operator-facing copy.
- `obsidian/brain/Pricing Engine Canon.md` — placeholder rule `{{MARKOS_PRICING_ENGINE_PENDING}}` applies to opportunity pricing_context + lifecycle transitions that expose pricing copy.
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — v2 loop; CRM is the relationship operating layer.
- `obsidian/reference/Contracts Registry.md` — contract naming + F-ID allocation.
- `obsidian/reference/Database Schema.md` — RLS + hash-chain patterns.
- `obsidian/reference/Core Lib.md` — `lib/markos/*` module boundary conventions.
- `obsidian/reference/HTTP Layer.md` — API route conventions (`/v1/crm/*`).
- `obsidian/reference/UI Components.md` — component naming + shell conventions.
- `obsidian/reference/CRM Domain.md` — current CRM domain spec.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 222 section + v4.2.0 Commercial Engines 1.0 milestone + dependency graph.
- `.planning/REQUIREMENTS.md` — CRM-01..05, CDP-01..05 carry-forward, TASK-01..05, QA-01..15 targets.
- `.planning/STATE.md` — current execution state.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md` — routing for docs 18-26.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — cross-phase additive posture; CRM "real but pre-360" finding.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` — substrate inventory.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — mandatory testing doctrine.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/DISCUSS.md` — scope + 6 proposed slices.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-RESEARCH.md` — existing research (will be refreshed at plan-phase).
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-REVIEWS.md` — Claude-runtime override review (2026-04-26): 7 HIGH + 4 MED + 2 LOW. Drove D-35..D-51.

### Prior phase decisions CRM360 must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-01 (CRM operational SOR), D-07 (custom fields contract-validated), D-09/D-10 (tenant RLS + audit), D-05 (merge governance).
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-01 (high-signal-only CRM timeline — preserved in D-06), D-05 (review-first anon-to-known), D-07 (stitched-label projection), D-08 (review-pending excluded from attribution).
- `.planning/phases/102-multi-view-pipeline-workspace/102-CONTEXT.md` — D-01 (deals-first pipeline), D-02 (Kanban default), D-03 (6-view workspace from one SOR — preserved in D-24), D-05 (named saved views).
- `.planning/phases/103-sales-and-success-execution-workspace/103-CONTEXT.md` — D-01 (unified execution queue with tabs — preserved in D-24), D-04 (due/overdue > NBA suggestions), D-06 (bounded NBA: create task, note, draft — no autonomous send).
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — D-04 (consent channel-specific fail-closed — preserved via P221 ConsentState + D-23), D-07 (timeline writeback).
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — D-01 (record brief flagship — evolved in D-24), D-03 (evidence inline), D-05/D-06 (advisory-first + approval-packaged — preserved in D-28), D-08 (CRM-native reporting — evolved in D-29).
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — single operating shell + centralized approvals + Morning Brief (preserved in D-24/D-29).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + source quality + claim TTL integrated with NBA evidence_refs + score provenance (D-08/D-10).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — no public action without approval + `{{MARKOS_PRICING_ENGINE_PENDING}}` rule (D-23, D-28).
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — 31 CDP decisions. Most load-bearing: D-01 (two-layer profile), D-08 (cdp_events), D-18 (double-gate dispatch), D-20 (read-through adapter), D-22 (read-only CDP API), D-24 (tombstone cascade).

### Existing code + test anchors (read before planning) — VERIFIED 2026-04-26
- `lib/markos/crm/workspace.ts` + `lib/markos/crm/workspace-data.ts` — 6-view workspace state + snapshot hydration.
- `lib/markos/crm/execution.ts` — current NBA reducer + queue + urgency + rationale. Target of D-08 NBA durability refactor. NO `.cjs` twin (verified D-50).
- `lib/markos/crm/timeline.ts` + `lib/markos/crm/timeline.cjs` — `buildCrmTimeline` + ACTIVITY_FAMILY_ALIASES (target of D-05/D-06 extension; .cjs twin exists, mirror additively).
- `lib/markos/crm/tracking.ts` — HIGH_SIGNAL filter (preserved in D-06).
- `lib/markos/crm/attribution.ts` — review-pending exclusion (preserved).
- `lib/markos/crm/identity.ts` + `lib/markos/crm/merge.cjs` + `lib/markos/crm/merge.ts` — identity + merge (extended by P221, consumed by P222 Customer360).
- `lib/markos/crm/copilot.ts` — record brief grounding (evolved in D-24).
- `lib/markos/crm/reporting.ts` — CRM-native cockpit (evolved in D-29).
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` export (D-42).
- `lib/markos/cdp/adapters/crm-projection.ts` — P221 adapter (Customer360 consumes in D-21; HARD prerequisite via D-38 assertUpstreamReady).
- `lib/markos/crm/contracts.ts` + `lib/markos/crm/contracts.cjs` — entity/activity schemas.
- `api/v1/crm/*.js` — legacy `/v1/crm/*` REST tree (D-43 target).
- `api/cron/webhooks-dlq-purge.js` — cron auth pattern reference (D-44 mirror).
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` export (D-35 auth helper).
- `lib/markos/mcp/tools/index.cjs` — MCP tool index extension point (D-41).
- `lib/markos/plugins/registry.js:102` — `resolvePlugin` (D-35; NOT lookupPlugin).
- `contracts/openapi.json` — OpenAPI registry (D-40).
- `app/(markos)/crm/*` — existing CRM route tree (workspace/execution/outbound/copilot/reporting). Customer-facing UI ONLY; API surface stays under `api/v1/crm/*.js` per D-43.
- `components/markos/crm/workspace-shell.tsx` + `execution-queue.tsx` + `execution-detail.tsx` + `copilot-record-panel.tsx` + `reporting-dashboard.tsx` — UI evolution targets (D-24).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/workspace.ts::normalizeWorkspaceState` — 6-view workspace shape reused; Customer360 becomes the record source via adapter (D-19).
- `lib/markos/crm/execution.ts` — current urgency + rationale + bounded-action logic carried; NBA computation refactored to write `nba_records` rows (D-08) and executor/queue/copilot read the same table.
- `lib/markos/crm/timeline.ts::buildCrmTimeline` — activity_family filter logic preserved; extended to expose `source_domain + commercial_signal + actor_type` (D-05/D-06).
- `lib/markos/crm/copilot.ts` — record brief grounding + summary model reused; consumes Customer360 `current_summary` + NBA evidence_refs directly (D-24).
- `lib/markos/crm/reporting.ts` — readiness + executive summary + central rollup reused; gains lifecycle funnel + committee coverage + NBA execution rollups (D-29).
- `lib/markos/crm/merge.cjs` — merge governance pattern; preserved for Customer360 merge lineage.
- `lib/markos/cdp/adapters/crm-projection.ts` — P221 adapter; Customer360 extends with commercial-overlay columns (D-21).
- `lib/markos/crm/agent-actions.ts:68::buildApprovalPackage` — approval helper (D-42).
- `markos_audit_log` (P201 hash chain) — consumes all new mutation events.
- Approval package + playbook lifecycle (P105) — consumed by D-28 write-path approval gates.
- `contracts/flow-registry.json` — append-only F-ID registry (D-33 adds 9 entries: F-113..F-121).
- `api/cron/webhooks-dlq-purge.js` — cron auth pattern (shared-secret header `x-markos-cron-secret`, mirror in `api/cron/crm360-*.js` per D-44).
- `onboarding/backend/runtime-context.cjs:491::requireHostedSupabaseAuth` — REST auth helper (D-35).

### Established patterns
- Contract-first modules with explicit validators + tenant fail-closed checks.
- Review-first mutation with immutable evidence (P100 merge pattern).
- Approval-packaged AI actions (P105) — `buildApprovalPackage` helper (D-42).
- HIGH_SIGNAL projection filter for operator timeline (P101).
- 6-view workspace from one SOR (P102).
- Unified execution queue with tabs (P103).
- Record brief + evidence inline (P105).
- Centralized approval inbox + Morning Brief (P208).
- Read-through adapter bridging old/new substrates (P221 D-20 pattern replicated in D-19).
- EventEnvelope write to cdp_events (P221 D-08 pattern replicated in D-07).
- Tombstone cascade with audit retention (P221 D-24 pattern replicated in D-32).
- Outbox pattern for cross-table cascade (D-47, mirror P226 D-89).
- DB-trigger enforcement for compliance gates (D-45 lifecycle, D-46 score immutability, mirror P226 D-83/D-84).
- Hard preflight upstream gate (D-38, mirror P223 D-45 / P226 D-87).
- Architecture-lock plan-time forbidden-pattern detector (D-35, mirror P223 D-42..D-49 / P226 D-78).
- Legacy `api/*.js` flat REST tree (D-43, mirror P223 D-46).
- Legacy `api/cron/*.js` flat cron tree (D-44, mirror P223 D-49).

### Integration points
- **Upstream:** CDP IdentityProfile + ConsentState + TraitSnapshot via P221 adapter (D-21). HARD prerequisite per D-38.
- **CRM legacy:** `crm_entities` + existing workspace/execution/copilot/reporting consumed via `lib/markos/crm360/adapters/legacy-entity.ts` (D-19); migrate consumer-by-consumer.
- **Downstream dispatch (P223):** reads Customer360 + Opportunity + ConsentState for send eligibility; consumes AudienceSnapshot from P221 D-18 double-gate.
- **Downstream conversion/launch (P224):** reads Opportunity + lifecycle + NBA for conversion surface personalization.
- **Downstream analytics (P225):** reads Customer360 + Opportunity + lifecycle_transitions + nba_records for attribution + journey + narrative.
- **Downstream sales enablement (P226):** reads Opportunity + BuyingCommittee + evidence_gaps for battlecard + proof-pack generation.
- **Agents (P207):** Customer360 + Opportunity + NBA recompute wrapped in AgentRun runs.
- **Evidence (P209):** NBA evidence_refs + score provenance + lifecycle_transitions evidence_ref all integrate with EvidenceMap. HARD prerequisite per D-38.
- **Pricing Engine:** Opportunity `pricing_context_id` FK; price-mutating paths honor `{{MARKOS_PRICING_ENGINE_PENDING}}`. P211 wiring HARD prerequisite per D-38.
- **Approvals (P208):** `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` is the only path. HARD prerequisite per D-38. NBA execute, lifecycle high-risk transitions, tombstone cascade all wire through it.

</code_context>

<specifics>
## Specific Ideas

- "Timeline first. The timeline is the source of truth. Lists and boards are views." (doc 18 Core Doctrine rule 1) — enforces TimelineDetailView as record default, not the 6-view list default. Kanban remains default for list-level navigation per P102 D-02.
- "Relationship memory must survive handoffs" (doc 18 Core Doctrine rule 5) — multi-role ownership (D-16) + handoff events (D-17) + lifecycle_transitions (D-12) are the enforcement mechanism.
- "Every object must be actionable. No passive record exists without tasks, risk, next-best action, or decision context." (doc 18 Core Doctrine rule 4) — every Customer360 and Opportunity row MUST have an active nba_records row OR explicit `nba_reason='none_applicable'` rationale.
- "No black-box scores" (carried from P216 D-non-negotiable) — score_provenance is mandatory: source_event_refs[] + computed_at + freshness_mode + confidence on every score field. Now DB-enforced append-only per D-46.
- Buying committee output shape doc 18 asks for: "No finance stakeholder engaged" / "Champion active, economic buyer absent" / "Technical buyer asked for security artifact" / "Legal review likely next blocker" — these are `missing_roles[]` + `proof_gap_refs[]` rendered as human strings by BuyingCommitteePanel (D-25).
- Customer360 is the OPERATIONAL overlay — CDP stays SOR for identity/consent/traits. Do not duplicate identity fields; always read via P221 adapter. This is the scope anchor that prevents re-introducing the pre-P221 identity confusion.

</specifics>

<deferred>
## Deferred Ideas

### For future commercial-engine phases
- Native email/SMS/WhatsApp/push dispatch consuming Customer360 + ConsentState + AudienceSnapshot → P223.
- Conversion surfaces (landing pages, forms, CTA), launch orchestration, post-launch feedback → P224.
- Semantic attribution + customer journey analytics + narrative intelligence + anomaly layer → P225.
- Sales enablement (battlecards, objection intelligence, proof packs, proposals, win/loss capture) → P226.
- Ecosystem + partner + affiliate + referral + community + developer-growth workflows → P227.
- Commercial OS integration closure (cross-engine contracts, replaceability audit) → P228.

### For future enrichment
- `profile_type='workspace'` + `profile_type='household'` ingest → P218/P225 (enum extension accepted now; v1 ingest emits account+person only).
- Full CRM 360 dashboard (trait explorer, preference center, identity graph viewer) — P222 ships Timeline + Committee + NBA panels; full exploratory dashboards land with P225 analytics workspace.
- Cross-tenant commercial-signal anonymized learning → P212/P228.
- Legacy `crm_entities` cutover to derived-view-only — lands in post-P222 cleanup phase once all consumers migrate.
- Full doc 18 BuyingCommittee AI suggestions (auto-detect missing roles from email/meeting evidence) → P225+ once journey analytics available.
- Opportunity recommendation agent (CRM-05 Opportunity Coach) registered with AgentRun v2 → P222+/P226 once agent family expands.

### Toolchain + architecture migrations (REJECTED for P222 — see review 2026-04-26)
- **App Router migration `api/` → `app/api/v1/.../route.ts`** (deferred). P222 stays on legacy `api/*.js` per D-43. Future architecture phase owns the migration; P222 plans MUST NOT introduce App Router handlers. Rejected pattern: `app/api/v1/crm/.../route.ts`.
- **App Router cron migration `api/cron/` → `app/api/cron/.../route.ts`** (deferred). P222 stays on legacy `api/cron/*.js` per D-44. Rejected pattern: `app/api/cron/crm360-*/route.ts`.
- **vitest + playwright + supabase-types + openapi-generate toolchain** (deferred). P222 uses `npm test` (Node `--test`) per D-39. Future testing-environment phase (P225+ analytics workspace?) owns the toolchain decision. P222 plans MUST NOT install vitest/playwright. Rejected patterns: `vitest run`, `from 'vitest'`, `*.test.ts`, `playwright.config.ts`.
- **OpenAPI publication path `public/openapi.json`** (rejected). Use `contracts/openapi.json` per D-40.
- **Plugin lookup symbol `lookupPlugin`** (rejected). Use `resolvePlugin` from `lib/markos/plugins/registry.js:102` per D-35.
- **Approval helper symbol `createApprovalPackage`** (rejected — does not exist). Use `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-42.
- **MCP tools index path `lib/markos/mcp/tools/index.ts`** (rejected). Use `index.cjs` per D-41.

### Rejected escape hatches (review 2026-04-26)
- **"stub if missing" / "A3 guard — stub if missing" / "if exists" soft-skip patterns** (REJECTED for P221 dependency). P221 is HARD prerequisite via `assertUpstreamReady(['P221'])` per D-38 + D-21 revision. Plan 01 Task 0.5 forbidden-pattern detector flags any "stub if missing" / "if exists" / "may not exist at execute time" wording. Replaced with hard-fail throw.
- **`workflow.<feature>_available` boolean gating** (REJECTED). All upstream features assumed present after preflight passes.
- **Conditional plan tasks ("write task if file exists")** (REJECTED — RH7). Plan author must verify file existence at plan creation via Glob/grep against current repo and write definitive task OR drop the scope.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 222 scope.

</deferred>

---

*Phase: 222-crm-timeline-commercial-memory-workspace*
*Context gathered: 2026-04-24*
*Review-driven decisions added: 2026-04-26 (D-35..D-51 per `222-REVIEWS.md`)*
