# Phase 222: CRM Timeline and Commercial Memory Workspace — Research

**Researched:** 2026-04-24
**Domain:** Timeline-first Customer 360 CRM — commercial memory, lifecycle orchestration, NBA durability, buying committees
**Confidence:** HIGH (all architectural claims verified against codebase + CONTEXT.md 34 locked decisions + P221 RESEARCH cross-reference)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Customer 360 shape
- D-01: New `customer_360_records` table is the durable SOR with `entity_type IN {account, person}`. Separate `opportunities` table. `crm_entities` stays as legacy base during transition.
- D-02: Customer360 carries: `canonical_identity_id` (FK → CDP `cdp_identity_profiles`), `display_name`, `entity_type`, `mode`, `lifecycle_stage`, multi-role ownership tuple, unified score envelope, `current_summary`, `next_best_action_id` (FK → `nba_records`), `open_tasks`, `active_opportunities`, `last_meaningful_event_at`, tenant_id + RLS.
- D-03: Opportunity carries doc 18 shape: `opportunity_id`, `tenant_id`, `account_id` (FK → customer_360_records entity_type=account), `primary_person_id` (FK → customer_360_records entity_type=person), `title`, `pipeline_id`, `stage_id`, `stage_probability`, `amount`, `currency`, `expected_close_date`, `source_motion`, `pricing_context_id`, `active_objections[]`, `requested_artifacts[]`, `competitive_set[]`, `health`, `next_required_action`, `approval_blockers[]`, `evidence_gaps[]`.

#### Identity graph scope
- D-04: `entity_type` accepts `person | account` v1 only. Workspace/household deferred.

#### Timeline taxonomy
- D-05: Extend `crm_activity` with new columns: `source_domain IN {website, email, messaging, meeting, crm, billing, support, product, social, research, agent}`, `commercial_signal IN {interest, risk, expansion, renewal, support, pricing, silence, null}`, `actor_type IN {human, agent, system}`, `actor_id`, `opportunity_id` (FK), `sentiment IN {positive, neutral, negative, null}`, `thread_id`. Preserve `activity_family` with ACTIVITY_FAMILY_ALIASES.
- D-06: `buildCrmTimeline` upgraded to expose both `activity_family` (backward-compat) and `source_domain + commercial_signal + actor_type` (new). HIGH_SIGNAL-only filter preserved.
- D-07: CRM writes emit `EventEnvelope` rows into `cdp_events` with `event_domain='crm'`. Dual-write via P221 tracking ingest path; shared `source_event_ref`.

#### NBA durability
- D-08: New `nba_records` table: `nba_id`, `tenant_id`, `subject_type IN {customer_360, opportunity, person}`, `subject_id`, `action_type`, `rationale`, `evidence_refs[]`, `computed_at`, `expires_at`, `confidence`, `approval_ref`, `superseded_by`, `status IN {active, executed, dismissed, expired, superseded}`.

#### Score envelope
- D-09: Unified scores on Customer360: `fit_score`, `intent_score`, `engagement_score`, `product_signal_score` (nullable), `revenue_score` (nullable), `risk_score`. Opportunity has `stage_probability`, `health_score`, `evidence_gap_score`. Score provenance = source_event_refs[] + computed_at + freshness_mode + confidence.
- D-10: Score freshness: real_time for intent/engagement, hourly for lifecycle/product_signal, daily for fit/revenue/risk. Recompute bridges P207 AgentRun v2 pattern (same as P221 D-8 trait recompute).

#### Lifecycle state SOR
- D-11: `lifecycle_stage` column on `customer_360_records`. Enum: `anonymous | known | engaged | mql | sql | opportunity | customer | expansion | renewal | advocate | lost`.
- D-12: `lifecycle_transitions` append-only event table: `transition_id`, `tenant_id`, `customer_360_id`, `from_stage`, `to_stage`, `actor_id`, `actor_type`, `evidence_ref`, `reason`, `transitioned_at`.
- D-13: Stage transitions emit `crm_activity` row + `cdp_events` envelope.

#### Buying committee model
- D-14: `buying_committees` table: `committee_id`, `tenant_id`, `subject_type IN {opportunity, account}`, `subject_id`, `coverage_score`, `missing_roles[]`, `last_assessed_at`, `assessment_actor_id`.
- D-15: `buying_committee_members` table: `member_id`, `committee_id`, `person_id` (FK → customer_360_records entity_type=person), `role IN {champion, economic_buyer, technical_buyer, end_user, blocker, legal, finance, unknown}`, `influence_score`, `engagement_score`, `last_touch_at`, `proof_gap_refs[]`, `valid_from`, `valid_to`.

#### Ownership semantics
- D-16: Multi-role ownership tuple: `account_owner_user_id`, `cs_owner_user_id`, `marketing_owner_user_id` (Customer360). Opportunity: `deal_owner_user_id`. `primary_owner_user_id` derived by lifecycle_stage:
  - anonymous/known/engaged/mql → marketing_owner_user_id
  - sql/opportunity → deal_owner_user_id or fallback account_owner_user_id
  - customer/expansion/renewal/advocate → cs_owner_user_id or fallback account_owner_user_id
  - lost → account_owner_user_id
- D-17: Ownership changes = explicit handoff events → lifecycle_transitions row + crm_activity row.

#### Migration strategy
- D-18: New tables populated by backfill from crm_entities + CDP profile join.
- D-19: Read-through adapter `lib/markos/crm360/adapters/legacy-entity.ts` bridges existing P102-P105 code.
- D-20: Migration cron reconciles customer_360_records vs crm_entities daily; drift threshold emits operator task.

#### CDP integration
- D-21: Customer360 reads CDP via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`. CRM never stores identity/consent/trait data.
- D-22: CRM mutations emit EventEnvelope to cdp_events with event_domain='crm'. Shared source_event_ref.
- D-23: CDP consent re-validation at dispatch (P221 D-18 double-gate). Pricing mentions use `{{MARKOS_PRICING_ENGINE_PENDING}}`.

#### Workspace + UI
- D-24: Evolve existing surfaces. workspace-shell.tsx keeps 6 views. execution-queue.tsx reads from nba_records. copilot-record-panel.tsx consumes Customer360 current_summary + NBA.
- D-25: New UI components: `TimelineDetailView`, `BuyingCommitteePanel`, `NBAExplainPanel`, `LifecycleTransitionTimeline`.

#### API + MCP surface
- D-26: Read-write `/v1/crm/*` API: customer360, opportunities, committees, lifecycle-transitions, nba, timeline endpoints.
- D-27: MCP tools: `get_customer_360`, `get_opportunity_context`, `list_committee_gaps`, `list_next_best_actions`.
- D-28: High-risk mutations require approval (lifecycle to customer/lost, pricing_context_id change, owner handoff). Low-risk proceed within role limits.

#### Observability
- D-29: Reuse existing operator patterns. Approval Inbox gains Customer360 + Opportunity + NBA types. Morning Brief surfaces top-N NBA + committee-gap opps. CRM reporting cockpit gains lifecycle funnel + committee coverage + NBA execution rate.

#### Security + tenancy
- D-30: RLS on all new tables. Fail closed on missing tenant context.
- D-31: Unified `markos_audit_log` captures all Customer360/Opportunity/NBA mutations + lifecycle transitions + owner handoffs + committee member role changes.
- D-32: CDP tombstone propagates to Customer360: nullify canonical_identity_id, scrub display_name/current_summary, preserve ownership/lifecycle/NBA marked tombstoned=true.

#### Contracts + migrations
- D-33: 7-9 new contracts (F-113..F-121 proposed).
- D-34: 5-7 new migrations (106-112 proposed).

### Claude's Discretion
- Module boundary under `lib/markos/crm360/*` (records vs opportunities vs committees vs nba vs adapters).
- NBA recompute infrastructure (cron vs AgentRun vs event-triggered) — align with P207 + P221 pattern.
- Computed column for `primary_owner_user_id` — Postgres generated vs application-side derivation.
- Exact contract IDs, migration numbers, test file names per repo conventions.
- TimelineDetailView + BuyingCommitteePanel + NBAExplainPanel component implementation details.

### Deferred Ideas (OUT OF SCOPE)
- P223: Native email/SMS/WhatsApp/push dispatch.
- P224: Conversion surfaces, landing pages, forms, launch orchestration.
- P225: Semantic attribution, journey analytics, narrative intelligence. Full CRM 360 dashboard.
- P226: Sales enablement (battlecards, proof packs, deal proposals). Opportunity Coach agent (CRM-05).
- P227: Ecosystem/partner/affiliate/community/developer growth.
- P228: Commercial OS integration closure.
- P218/P225: workspace + household entity_type extensions.
- Post-P222: crm_entities cutover to derived-view-only.
- Auto-detect missing buying committee roles from email/meeting evidence (needs P225 analytics).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | Timeline-first CRM: account, person, opportunity, lifecycle, relationship memory as first-class commercial objects | `customer_360_records`, `opportunities`, `lifecycle_transitions`, `buildCrmTimeline` extension (D-01..D-06, D-11..D-13) |
| CRM-02 | Customer 360 records actionable with fit, intent, engagement, product, revenue, risk + explicit next-best action | Score envelope on Customer360 + `nba_records` durable SOR (D-08, D-09, D-10) |
| CRM-03 | Shared commercial memory across marketing, sales, success, support, billing, leadership | Multi-role ownership tuple + handoff events + lifecycle_transitions + NBA shared read (D-14..D-17) |
| CRM-04 | Opportunity, renewal, expansion, risk workflows create tasks/approvals/decisions; passive records blocked | Approval-aware mutations (D-28); NBA action_type binds to task/approval paths; execution-queue reads nba_records (D-08, D-24) |
| CRM-05 | CRM-generated outreach, pricing statements, competitive claims remain approval-aware and evidence-linked | P105 approval-package pattern reused (D-28); `{{MARKOS_PRICING_ENGINE_PENDING}}` rule (D-23); NBA evidence_refs (D-08) |
| CDP-01 | First-party identity graph (carry-forward read-side from P221) | Satisfied by P221; Customer360 reads via adapter (D-21); no new implementation in P222 |
| CDP-02 | Explainable merge/split/provenance (carry-forward read-side from P221) | Satisfied by P221; tombstone cascade into Customer360 (D-32) |
| CDP-03 | Governed audience data products (carry-forward read-side from P221) | Satisfied by P221; P222 consumes ConsentState at dispatch gate (D-23) |
| CDP-04 | CDP events and traits flowing into CRM (carry-forward) | D-21 read-through adapter satisfies read-side; D-07/D-22 emit CRM→CDP closes the loop |
| CDP-05 | Privacy/retention/consent/deletion enforced (carry-forward) | D-32 tombstone cascade + D-23 dispatch gate re-validation |
| TASK-01 | Every agent output, escalation, approval becomes a unified task/approval | NBA row with approval_ref + operator task creation on drift/expiry (D-08, D-20, D-29) |
| TASK-02 | Morning Brief surfaces NBA + committee gaps | D-29 Morning Brief integration: top-N active NBA by primary_owner + committee-gap opps |
| TASK-03 | Task Board groups work by priority, campaign, source agent, status, owner | Execution queue reads nba_records; primary_owner_user_id drives routing (D-16, D-24) |
| TASK-04 | Approval Inbox: preview, evidence, brand score, approve/edit/reject | Customer360 + Opportunity + NBA entry types in P208 Approval Inbox (D-28, D-29) |
| TASK-05 | Mobile reactive: approvals, brief, inbox, quick tasks | Existing P208 mobile substrate; no new shell; Customer360 + NBA entries added (D-24) |
| QA-01 | Contracts remain current | 7-9 new F-IDs allocated F-113..F-121; registered in flow-registry.json |
| QA-02 | Tenancy, RLS, auth, audit, domains remain production-safe | RLS on all 6 new tables; markos_audit_log hash chain; fail-closed tenant context (D-30, D-31) |
| QA-03..15 | Quality baseline gates | Vitest: business logic 100% decision branches; Playwright: operator UI journeys; Chromatic: new panels |

</phase_requirements>

---

## Summary

Phase 222 evolves the existing P100-P105 CRM substrate into a timeline-first Customer 360 system-of-record without breaking any existing consumers. The codebase already contains everything needed as additive seeds: `buildCrmTimeline`, `buildExecutionRecommendations`, `buildCrmWorkspaceSnapshot`, `buildCopilotGroundingBundle`, and `buildReportSnapshot`. None are replaced — they are extended or bridged via the new `lib/markos/crm360/adapters/legacy-entity.ts` shim (replicating P221 D-20 pattern exactly).

The architectural keystone is the **commercial overlay separation**: `customer_360_records` stores only commercial state (scores, lifecycle, ownership, NBA pointer, summary) while CDP remains SOR for identity/consent/traits. CRM mutations close the loop by emitting `cdp_events` rows with `event_domain='crm'`, ensuring the CDP event ledger captures commercial signals without duplicating identity truth.

The most operationally risky decision is the dual-write shim window (D-18/D-19): `customer_360_records` and `crm_entities` must be kept in sync until all consumers migrate. The drift reconciliation cron (D-20) is the safety net. The second highest risk is NBA expiration thundering herd — many NBA rows expiring simultaneously triggers a burst of recompute tasks; the mitigation is staggered `expires_at` with jitter at compute time.

**Primary recommendation:** Build in 4 waves. Wave 1 (222-01) lays the durable schema foundation. Waves 2-3 (222-02..222-05) run in dependency order. Wave 4 (222-06) adds reconciliation, RLS stress tests, Playwright, and phase closeout. The critical path is: schema + migrations → legacy adapter → CDP adapter consumption → NBA recompute → UI evolution → API/MCP surface.

---

## Standard Stack

### Core (existing — reused and extended)

| Module / Library | Location | Purpose | Reuse Strategy |
|-----------------|----------|---------|----------------|
| `lib/markos/crm/timeline.ts` | repo | `buildCrmTimeline` + ACTIVITY_FAMILY_ALIASES | Extend in-place: add source_domain/commercial_signal/actor_type projection; preserve backward-compat output shape |
| `lib/markos/crm/execution.ts` | repo | NBA reducer + urgency scoring + queue tabs | Refactor: `buildExecutionRecommendations` reads from nba_records table instead of computing on-read; urgency + rationale logic preserved |
| `lib/markos/crm/copilot.ts` | repo | `buildCopilotGroundingBundle` + record brief | Extend: consumes Customer360 `current_summary` + NBA evidence_refs directly; existing bundle shape preserved |
| `lib/markos/crm/reporting.ts` | repo | `buildReportingCockpitData` + rollup | Extend: lifecycle funnel + committee coverage + NBA execution rate added; existing cockpit shape preserved |
| `lib/markos/crm/workspace.ts` | repo | `createWorkspaceState` + 6-view state machine | No change; Customer360 becomes record source via adapter |
| `lib/markos/crm/workspace-data.ts` | repo | `buildCrmWorkspaceSnapshot` | No change; feeds TimelineDetailView as default record view |
| `lib/markos/crm/merge.cjs` | repo | Merge governance pattern | Preserved for Customer360 merge lineage; no P222 changes |
| `lib/markos/crm/tracking.ts` | repo | `normalizeTrackedActivity` + HIGH_SIGNAL filter | Preserved unchanged per D-06 |
| `lib/markos/cdp/adapters/crm-projection.ts` | repo (P221) | `getProfileForContact` read-through | Consumed by Customer360 read path (D-21); P222 adds crm360 wrapper |
| `markos_audit_log` (P201) | Supabase | Hash-chain audit | All new mutation types registered here (D-31) |
| P105 approval-package | `lib/markos/crm/copilot.ts` | Approval packaging for AI actions | Reused by D-28 write-path approval gates unchanged |

### New CRM360 Modules (to be created)

| Module | Path | Purpose |
|--------|------|---------|
| crm360-records | `lib/markos/crm360/records/` | Customer360 CRUD, score envelope, tombstone handler |
| crm360-opportunities | `lib/markos/crm360/opportunities/` | Opportunity CRUD, health transitions, pricing guard |
| crm360-lifecycle | `lib/markos/crm360/lifecycle/` | Lifecycle transition append, stage routing, handoff |
| crm360-nba | `lib/markos/crm360/nba/` | NBA record CRUD, supersedence, expiry, recompute |
| crm360-committees | `lib/markos/crm360/committees/` | Buying committee CRUD, member role history |
| crm360-adapters | `lib/markos/crm360/adapters/` | `legacy-entity.ts` + `cdp-overlay.ts` bridge adapters |
| crm360-events | `lib/markos/crm360/events/` | `emitCrmEventEnvelope` dual-writer to cdp_events |
| crm360-api | `lib/markos/crm360/api/` | `/v1/crm/*` handler implementations |
| crm360-mcp | `lib/markos/crm360/mcp/` | 4 MCP tool implementations |

### Test Stack [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md + V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md]

| Layer | Tool | Config | Command |
|-------|------|--------|---------|
| Business logic | Vitest (Phase 204+ doctrine) | `vitest.config.ts` (Wave 0 gap if not yet created by P221) | `vitest run` |
| Browser journeys | Playwright | `playwright.config.ts` (Wave 0 gap if not yet created) | `playwright test` |
| Visual regression | Chromatic/Storybook | `.storybook/` (exists) | `chromatic` |
| Legacy regression | `node --test` | `package.json` scripts | `npm test` |

**Installation (Wave 0, if P221 did not already install):**

```bash
npm install --save-dev vitest @vitest/coverage-v8 playwright @playwright/test
```

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/crm360/
├── records/
│   ├── customer360.ts       # Customer360Record CRUD + score envelope
│   ├── score-provenance.ts  # Score freshness + provenance assembly
│   └── tombstone.ts         # CDP tombstone cascade handler
├── opportunities/
│   ├── opportunity.ts       # Opportunity CRUD + health transitions
│   └── pricing-guard.ts     # {{MARKOS_PRICING_ENGINE_PENDING}} enforcement
├── lifecycle/
│   ├── transitions.ts       # Append-only lifecycle_transitions writer
│   ├── stage-router.ts      # primary_owner_user_id derivation logic
│   └── handoff.ts           # Ownership handoff event writer
├── nba/
│   ├── nba-record.ts        # NBA CRUD + supersedence + status transitions
│   ├── recompute.ts         # Recompute scheduler + AgentRun bridge
│   └── expiry.ts            # Expiration + staggered-jitter logic
├── committees/
│   ├── committee.ts         # Buying committee CRUD + coverage score
│   └── member.ts            # Member role history (valid_from/valid_to)
├── adapters/
│   ├── legacy-entity.ts     # hydrateFromCrmEntity — bridges P102-P105 consumers
│   └── cdp-overlay.ts       # getCustomer360WithCdpContext — wraps P221 adapter
├── events/
│   └── emit.ts              # emitCrmEventEnvelope — writes to cdp_events
├── api/
│   └── handlers.ts          # /v1/crm/* route handlers
└── mcp/
    └── tools.ts             # 4 MCP tool implementations

components/markos/crm/
├── workspace-shell.tsx       # EVOLVED (D-24): TimelineDetailView as default record view
├── execution-queue.tsx       # EVOLVED (D-24): reads nba_records
├── execution-detail.tsx      # EVOLVED: shows NBA rationale + evidence_refs
├── copilot-record-panel.tsx  # EVOLVED (D-24): Customer360 current_summary + NBA
├── TimelineDetailView.tsx    # NEW (D-25): source_domain + commercial_signal filters
├── BuyingCommitteePanel.tsx  # NEW (D-25): coverage %, filled/missing roles, per-member signals
├── NBAExplainPanel.tsx       # NEW (D-25): rationale + evidence_refs + approval_ref
└── LifecycleTransitionTimeline.tsx  # NEW (D-25): stage history + actor + evidence

supabase/migrations/
├── 106_crm360_customer360_opportunities.sql
├── 107_crm360_lifecycle_transitions.sql
├── 108_crm360_nba_records.sql
├── 109_crm360_buying_committees.sql
├── 110_crm360_crm_activity_extensions.sql
├── 111_crm360_indexes_and_rls_hardening.sql
└── 112_crm360_drift_reconciliation_audit.sql

contracts/
├── F-113-crm-customer360-v1.yaml
├── F-114-crm-opportunity-v1.yaml
├── F-115-crm-lifecycle-transition-v1.yaml
├── F-116-crm-nba-record-v1.yaml
├── F-117-crm-buying-committee-v1.yaml
├── F-118-crm-buying-committee-member-v1.yaml
├── F-119-crm-timeline-extensions-v1.yaml
├── F-120-crm-customer360-read.yaml
└── F-121-crm-opportunity-context-read.yaml
```

### Pattern 1: Legacy Adapter Bridge

**What:** `lib/markos/crm360/adapters/legacy-entity.ts::hydrateFromCrmEntity` reads a `crm_entities` row and returns a Customer360-shaped object so existing consumers (workspace.ts, execution.ts, copilot.ts, reporting.ts) get Customer360 enrichment without rewriting.

**When to use:** During shim window. All P102-P105 consumers call this adapter instead of querying customer_360_records directly.

```typescript
// lib/markos/crm360/adapters/legacy-entity.ts
// Mirrors P221 D-20 pattern: read-through, never mutates source
export async function hydrateFromCrmEntity(
  tenantId: string,
  entityId: string,
  crmEntity: CrmEntity,
): Promise<Customer360Hydrated> {
  // 1. Find customer_360_records row by canonical backfill FK
  const c360 = await getCustomer360ByEntityId(tenantId, entityId);
  // 2. If not yet migrated, return entity-shaped fallback so consumers don't break
  if (!c360) {
    return buildFallbackCustomer360(crmEntity);
  }
  // 3. Enrich with CDP overlay via P221 adapter
  const cdpOverlay = await getProfileForContact(tenantId, c360.canonical_identity_id);
  return mergeCustomer360WithCdp(c360, cdpOverlay);
}
```

### Pattern 2: CRM → CDP Event Emit

**What:** Every CRM write (Customer360 mutation, lifecycle transition, NBA execution, ownership handoff) emits an `EventEnvelope` row into `cdp_events` with `event_domain='crm'` and a shared `source_event_ref`.

**When to use:** At the end of every CRM mutation handler before returning the response.

```typescript
// lib/markos/crm360/events/emit.ts
export async function emitCrmEventEnvelope(ctx: CrmMutationContext): Promise<void> {
  await insertCdpEvent({
    event_id: ctx.source_event_ref,           // shared ref — threads CRM ↔ CDP ↔ EvidenceMap
    tenant_id: ctx.tenant_id,
    event_name: ctx.crm_event_name,           // e.g., 'crm.lifecycle.transition'
    event_domain: 'crm',
    occurred_at: ctx.occurred_at,
    profile_id: ctx.canonical_identity_id ?? null,
    account_id: ctx.account_id ?? null,
    properties: ctx.mutation_payload,
  });
}
```

### Pattern 3: NBA Durability — Write Path

**What:** `execution.ts` currently computes NBA on-read. P222 refactors: NBA is written to `nba_records` at compute time; execution-queue reads the table; copilot reads the same row; supersedence marks old rows.

**When to use:** Any time NBA is recomputed (triggered by: inbound event, lifecycle transition, score recompute cron, operator dismissal).

```typescript
// lib/markos/crm360/nba/nba-record.ts
export async function upsertNbaRecord(input: NbaComputeInput): Promise<NbaRecord> {
  // Supersede existing active NBA for this subject
  if (input.supersedes_nba_id) {
    await markNbaSuperseded(input.tenant_id, input.supersedes_nba_id, input.nba_id);
  }
  return await insertNbaRecord({
    nba_id: input.nba_id,
    tenant_id: input.tenant_id,
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    action_type: input.action_type,
    rationale: input.rationale,
    evidence_refs: input.evidence_refs,
    computed_at: new Date().toISOString(),
    expires_at: computeExpiresAt(input.action_type, { jitter: true }),  // staggered jitter
    confidence: input.confidence,
    approval_ref: input.approval_ref ?? null,
    superseded_by: null,
    status: 'active',
  });
}
```

### Pattern 4: Primary Owner Derivation (Application-Side — Recommended)

See **## primary_owner_user_id Strategy** section below for the recommendation and rationale.

```typescript
// lib/markos/crm360/lifecycle/stage-router.ts
export function derivePrimaryOwner(c360: Customer360Record): string | null {
  const stage = c360.lifecycle_stage;
  if (['anonymous', 'known', 'engaged', 'mql'].includes(stage)) {
    return c360.marketing_owner_user_id;
  }
  if (['sql', 'opportunity'].includes(stage)) {
    return c360.deal_owner_user_id ?? c360.account_owner_user_id;
  }
  if (['customer', 'expansion', 'renewal', 'advocate'].includes(stage)) {
    return c360.cs_owner_user_id ?? c360.account_owner_user_id;
  }
  if (stage === 'lost') {
    return c360.account_owner_user_id;
  }
  return c360.account_owner_user_id;
}
```

### Pattern 5: Buying Committee Role History

**What:** Role changes do NOT update existing rows. They close the current membership (`valid_to = now()`) and insert a new row with the new role and `valid_from = now()`. This is the append-only version of role transitions.

```typescript
// lib/markos/crm360/committees/member.ts
export async function changeCommitteeMemberRole(
  tenantId: string,
  committeeId: string,
  personId: string,
  newRole: CommitteeMemberRole,
  actorId: string,
): Promise<BuyingCommitteeMember> {
  // 1. Close current active membership
  await closeActiveMembership(tenantId, committeeId, personId);
  // 2. Insert new membership with new role
  return await insertCommitteeMember({
    committee_id: committeeId,
    person_id: personId,
    role: newRole,
    valid_from: new Date().toISOString(),
    valid_to: null,          // open until next change
    tenant_id: tenantId,
  });
}
```

### Anti-Patterns to Avoid

- **Storing identity/consent/traits in customer_360_records**: Customer360 stores only commercial overlay. Always read via `lib/markos/cdp/adapters/crm-projection.ts`.
- **Updating nba_records rows in-place**: NBA is durable. Status transitions and supersedence use controlled fields; never UPDATE rationale/evidence_refs after insert.
- **Deriving `primary_owner_user_id` only in the DB trigger**: If using application-side derivation (recommended), ensure all mutation paths call `derivePrimaryOwner` + persist the result. Never rely on stale cached derivation.
- **Creating a new workspace shell for CRM360**: D-24 mandates evolving existing workspace-shell.tsx. No parallel shell.
- **Emitting `cdp_events` rows without a `source_event_ref`**: The source_event_ref is the thread that links CRM activity ↔ CDP events ↔ EvidenceMap. Always generate before writing either row.

---

## F-ID and Migration Allocation

### Verified P221 Allocation [VERIFIED: 221-RESEARCH.md codebase scan]

- P221 allocated: **F-106** through **F-112** (7 contracts)
- P221 allocated: migrations **101** through **105** (5 migrations)
- Therefore P222 starts at: **F-113** for contracts, **106** for migrations

### Proposed F-ID Allocation (9 contracts)

| F-ID | Contract Filename | Purpose | Slice | API Surface |
|------|------------------|---------|-------|-------------|
| **F-113** | `F-113-crm-customer360-v1.yaml` | Customer360Record CRUD (GET single, GET list, PATCH) | 222-01 | `/v1/crm/customer360` |
| **F-114** | `F-114-crm-opportunity-v1.yaml` | Opportunity CRUD (GET, POST, PATCH) | 222-01 | `/v1/crm/opportunities` |
| **F-115** | `F-115-crm-lifecycle-transition-v1.yaml` | Lifecycle transition append + history read | 222-02 | `/v1/crm/lifecycle-transitions` |
| **F-116** | `F-116-crm-nba-record-v1.yaml` | NBA record GET (active by subject), POST dismiss/execute | 222-04 | `/v1/crm/nba` |
| **F-117** | `F-117-crm-buying-committee-v1.yaml` | Buying committee GET (by subject), POST member, PATCH member | 222-05 | `/v1/crm/committees` |
| **F-118** | `F-118-crm-buying-committee-member-v1.yaml` | Member role history read + soft-delete | 222-05 | `/v1/crm/committees/{id}/members` |
| **F-119** | `F-119-crm-timeline-extensions-v1.yaml` | Timeline GET with source_domain + commercial_signal filters | 222-03 | `/v1/crm/timeline` |
| **F-120** | `F-120-crm-customer360-read.yaml` | MCP tool `get_customer_360` contract | 222-05 | MCP tool |
| **F-121** | `F-121-crm-opportunity-context-read.yaml` | MCP tools `get_opportunity_context`, `list_committee_gaps`, `list_next_best_actions` | 222-05 | MCP tools |

**Assumption [ASSUMED]:** If other work in parallel (P205/P206/P207/P208/P209) allocated F-IDs between F-112 and F-113 since this research was written, the planner MUST verify against the current `contracts/flow-registry.json` before writing contracts. Adjust starting ID accordingly. [Risk if wrong: contract ID collision — caught at validate-flow-contracts.cjs step]

### Proposed Migration Numbers (7 migrations)

| Migration | Filename | Content | Slice | RLS |
|-----------|----------|---------|-------|-----|
| **106** | `106_crm360_customer360_opportunities.sql` | `customer_360_records`, `opportunities` tables + FK indexes | 222-01 | Yes |
| **107** | `107_crm360_lifecycle_transitions.sql` | `lifecycle_transitions` append-only table | 222-02 | Yes |
| **108** | `108_crm360_nba_records.sql` | `nba_records` table + expiry index | 222-04 | Yes |
| **109** | `109_crm360_buying_committees.sql` | `buying_committees` + `buying_committee_members` | 222-05 | Yes |
| **110** | `110_crm360_crm_activity_extensions.sql` | ADD COLUMN: `source_domain`, `commercial_signal`, `actor_type`, `actor_id`, `opportunity_id`, `sentiment`, `thread_id` on `crm_activity_ledger` | 222-03 | Extends existing |
| **111** | `111_crm360_indexes_rls_hardening.sql` | Composite indexes for timeline query, NBA expiry scan, committee gap query; RLS policy hardening | 222-06 | Hardening only |
| **112** | `112_crm360_drift_audit_extensions.sql` | `crm360_drift_audit_log` table for reconciliation cron output + operator task FK | 222-06 | Yes |

**Assumption [ASSUMED]:** If P221 migrations 101-105 land in a different order or additional interim migrations exist, verify the highest numbered migration file in `supabase/migrations/` before assigning 106-112. [Risk if wrong: migration ordering collision — caught by migration-runner.test.js]

---

## Schema Sketches (DDL per Locked Decision)

### Table: `customer_360_records` (D-01, D-02, D-11, D-16, D-30, D-32)

```sql
CREATE TABLE customer_360_records (
  customer_360_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  canonical_identity_id    UUID REFERENCES cdp_identity_profiles(profile_id) ON DELETE SET NULL,
  entity_type              TEXT NOT NULL CHECK (entity_type IN ('account', 'person')),
  mode                     TEXT NOT NULL CHECK (mode IN ('b2b', 'b2c', 'plg_b2b', 'plg_b2c', 'b2b2c')),
  display_name             TEXT NOT NULL,
  lifecycle_stage          TEXT NOT NULL DEFAULT 'known' CHECK (lifecycle_stage IN (
                             'anonymous','known','engaged','mql','sql','opportunity',
                             'customer','expansion','renewal','advocate','lost')),

  -- Multi-role ownership tuple (D-16)
  account_owner_user_id    TEXT,
  deal_owner_user_id       TEXT,    -- NOTE: primarily on Opportunity; carried here for derived primary
  cs_owner_user_id         TEXT,
  marketing_owner_user_id  TEXT,
  primary_owner_user_id    TEXT,    -- application-derived on every lifecycle mutation (see strategy section)

  -- Score envelope (D-09)
  fit_score                NUMERIC(5,2),
  fit_score_provenance     JSONB,   -- { source_event_refs[], computed_at, freshness_mode, confidence }
  intent_score             NUMERIC(5,2),
  intent_score_provenance  JSONB,
  engagement_score         NUMERIC(5,2),
  engagement_score_provenance JSONB,
  product_signal_score     NUMERIC(5,2),   -- NULL for non-PLG tenants
  product_signal_score_provenance JSONB,
  revenue_score            NUMERIC(5,2),   -- NULL for pre-customer stages
  revenue_score_provenance JSONB,
  risk_score               NUMERIC(5,2),
  risk_score_provenance    JSONB,

  -- Intelligence
  current_summary          TEXT,           -- copilot-generated; scrubbed on tombstone (D-32)
  next_best_action_id      UUID REFERENCES nba_records(nba_id) ON DELETE SET NULL,
  open_tasks               INTEGER NOT NULL DEFAULT 0,
  active_opportunities     INTEGER NOT NULL DEFAULT 0,
  last_meaningful_event_at TIMESTAMPTZ,

  -- Tombstone (D-32)
  tombstoned               BOOLEAN NOT NULL DEFAULT FALSE,
  tombstoned_at            TIMESTAMPTZ,
  tombstone_reason         TEXT,   -- e.g., 'cdp_dsr_deletion'

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customer_360_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY c360_tenant_isolation ON customer_360_records
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_c360_tenant_stage ON customer_360_records(tenant_id, lifecycle_stage);
CREATE INDEX idx_c360_tenant_owner ON customer_360_records(tenant_id, primary_owner_user_id);
CREATE INDEX idx_c360_identity ON customer_360_records(canonical_identity_id) WHERE canonical_identity_id IS NOT NULL;
```

### Table: `opportunities` (D-03, D-16, D-30)

```sql
CREATE TABLE opportunities (
  opportunity_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  account_id               UUID REFERENCES customer_360_records(customer_360_id),  -- entity_type=account
  primary_person_id        UUID REFERENCES customer_360_records(customer_360_id),  -- entity_type=person
  title                    TEXT NOT NULL,
  pipeline_id              UUID REFERENCES crm_pipelines(pipeline_id),
  stage_id                 TEXT NOT NULL,
  stage_probability        NUMERIC(5,2),
  amount                   NUMERIC(15,2),
  currency                 TEXT NOT NULL DEFAULT 'USD',
  expected_close_date      DATE,
  source_motion            TEXT CHECK (source_motion IN (
                             'inbound','outbound','plg','partner','community','event','expansion')),
  pricing_context_id       UUID,   -- FK → Pricing Engine (P205); NULL until Pricing Engine ships
  active_objections        TEXT[] NOT NULL DEFAULT '{}',
  requested_artifacts      TEXT[] NOT NULL DEFAULT '{}',
  competitive_set          TEXT[] NOT NULL DEFAULT '{}',
  health                   TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy','watch','at_risk','stalled')),
  health_score             NUMERIC(5,2),
  evidence_gap_score       NUMERIC(5,2),
  deal_owner_user_id       TEXT,
  next_required_action     TEXT,   -- Use {{MARKOS_PRICING_ENGINE_PENDING}} if pricing-dependent
  approval_blockers        TEXT[] NOT NULL DEFAULT '{}',
  evidence_gaps            TEXT[] NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY opp_tenant_isolation ON opportunities
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_opp_account ON opportunities(tenant_id, account_id);
CREATE INDEX idx_opp_owner ON opportunities(tenant_id, deal_owner_user_id);
CREATE INDEX idx_opp_health ON opportunities(tenant_id, health);
```

### Table: `lifecycle_transitions` (D-12, D-13, D-30)

```sql
-- Append-only — no UPDATE, no DELETE
CREATE TABLE lifecycle_transitions (
  transition_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  customer_360_id          UUID NOT NULL REFERENCES customer_360_records(customer_360_id),
  from_stage               TEXT NOT NULL,
  to_stage                 TEXT NOT NULL,
  actor_id                 TEXT NOT NULL,
  actor_type               TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
  evidence_ref             TEXT,           -- source_event_ref linking to EvidenceMap (P209)
  reason                   TEXT,           -- 'handoff' | 'lifecycle_event' | 'operator_override' | ...
  transitioned_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Note: no updated_at — append-only audit trail
  CONSTRAINT lt_valid_stage_progression CHECK (from_stage <> to_stage)
);

ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY lt_tenant_isolation ON lifecycle_transitions
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_lt_c360 ON lifecycle_transitions(tenant_id, customer_360_id, transitioned_at DESC);
```

### Table: `nba_records` (D-08, D-30)

```sql
CREATE TABLE nba_records (
  nba_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  subject_type             TEXT NOT NULL CHECK (subject_type IN ('customer_360', 'opportunity', 'person')),
  subject_id               UUID NOT NULL,
  action_type              TEXT NOT NULL,  -- e.g., 'send_followup', 'propose_expansion', 'flag_risk', 'engage_committee_member'
  rationale                TEXT NOT NULL,
  evidence_refs            TEXT[] NOT NULL DEFAULT '{}',  -- FK → EvidenceMap (P209)
  computed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ NOT NULL,
  confidence               NUMERIC(4,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  approval_ref             UUID,           -- FK → P105 approval package (nullable)
  superseded_by            UUID REFERENCES nba_records(nba_id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                             'active','executed','dismissed','expired','superseded')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE nba_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY nba_tenant_isolation ON nba_records
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

-- Expiry scan index (for cron)
CREATE INDEX idx_nba_expiry ON nba_records(tenant_id, expires_at) WHERE status = 'active';
CREATE INDEX idx_nba_subject ON nba_records(tenant_id, subject_type, subject_id, status);
```

### Table: `buying_committees` (D-14, D-30)

```sql
CREATE TABLE buying_committees (
  committee_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  subject_type             TEXT NOT NULL CHECK (subject_type IN ('opportunity', 'account')),
  subject_id               UUID NOT NULL,
  coverage_score           NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (coverage_score BETWEEN 0 AND 100),
  missing_roles            TEXT[] NOT NULL DEFAULT '{}',
  last_assessed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessment_actor_id      TEXT,           -- user_id or agent_id that last assessed
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE buying_committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY bc_tenant_isolation ON buying_committees
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_bc_subject ON buying_committees(tenant_id, subject_type, subject_id);
```

### Table: `buying_committee_members` (D-15, D-30)

```sql
CREATE TABLE buying_committee_members (
  member_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES markos_tenants(id),
  committee_id             UUID NOT NULL REFERENCES buying_committees(committee_id),
  person_id                UUID NOT NULL REFERENCES customer_360_records(customer_360_id),
  role                     TEXT NOT NULL CHECK (role IN (
                             'champion','economic_buyer','technical_buyer','end_user',
                             'blocker','legal','finance','unknown')),
  influence_score          NUMERIC(5,2),
  engagement_score         NUMERIC(5,2),
  last_touch_at            TIMESTAMPTZ,
  proof_gap_refs           TEXT[] NOT NULL DEFAULT '{}',  -- evidence gaps for this member's role

  -- Role history (append-only semantic via valid_from/valid_to)
  valid_from               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to                 TIMESTAMPTZ,   -- NULL = currently active
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE buying_committee_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY bcm_tenant_isolation ON buying_committee_members
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_bcm_committee ON buying_committee_members(committee_id, valid_to NULLS LAST);
CREATE INDEX idx_bcm_person ON buying_committee_members(tenant_id, person_id) WHERE valid_to IS NULL;
```

### `crm_activity_ledger` Column Extensions (D-05, Migration 110)

```sql
-- Migration 110 — additive only, no column drops
ALTER TABLE crm_activity_ledger
  ADD COLUMN IF NOT EXISTS source_domain TEXT CHECK (source_domain IN (
    'website','email','messaging','meeting','crm','billing','support','product','social','research','agent'
  )),
  ADD COLUMN IF NOT EXISTS commercial_signal TEXT CHECK (commercial_signal IN (
    'interest','risk','expansion','renewal','support','pricing','silence'
  ) OR commercial_signal IS NULL),
  ADD COLUMN IF NOT EXISTS actor_type TEXT CHECK (actor_type IN ('human','agent','system')),
  ADD COLUMN IF NOT EXISTS actor_id TEXT,
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative') OR sentiment IS NULL),
  ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- activity_family column: PRESERVED unchanged (still present; ACTIVITY_FAMILY_ALIASES still applies)
-- Backfill source_domain from activity_family (approximate mapping for historical rows):
UPDATE crm_activity_ledger SET source_domain = CASE
  WHEN activity_family = 'web_activity'      THEN 'website'
  WHEN activity_family = 'campaign_touch'    THEN 'email'
  WHEN activity_family = 'outbound_event'    THEN 'email'
  WHEN activity_family = 'crm_mutation'      THEN 'crm'
  WHEN activity_family = 'note'              THEN 'crm'
  WHEN activity_family = 'task'              THEN 'crm'
  WHEN activity_family = 'agent_event'       THEN 'agent'
  WHEN activity_family = 'attribution_update' THEN 'crm'
  ELSE NULL
END WHERE source_domain IS NULL;

CREATE INDEX idx_activity_source_domain ON crm_activity_ledger(tenant_id, source_domain, occurred_at DESC);
CREATE INDEX idx_activity_commercial_signal ON crm_activity_ledger(tenant_id, commercial_signal) WHERE commercial_signal IS NOT NULL;
```

---

## Slice Boundaries (6 Slices with Waves)

### Recommended Wave Structure

| Wave | Slices | Dependency Constraint |
|------|--------|----------------------|
| Wave 1 | **222-01** | No deps beyond P221 being planned (migrations 101-105 registered) |
| Wave 2 | **222-02**, **222-03** | Both depend on 222-01 (customer_360_records + crm_activity_extensions must exist) |
| Wave 3 | **222-04**, **222-05** | 222-04 depends on 222-01 + 222-02; 222-05 depends on 222-01 + 222-02 + 222-03 + 222-04 |
| Wave 4 | **222-06** | Depends on all prior slices |

### Slice Definitions (Revised from DISCUSS.md)

| Slice | Name | Contents | Wave | Migrations | F-IDs |
|-------|------|----------|------|-----------|-------|
| 222-01 | Customer360 + Opportunity SOR + Legacy Adapter | `customer_360_records`, `opportunities` tables; backfill cron; `lib/markos/crm360/adapters/legacy-entity.ts`; `lib/markos/crm360/adapters/cdp-overlay.ts`; F-113, F-114 contracts | 1 | 106 | F-113, F-114 |
| 222-02 | Lifecycle + Ownership Event Model | `lifecycle_transitions` table; `lib/markos/crm360/lifecycle/*`; `emitCrmEventEnvelope` writer; lifecycle transition → crm_activity + cdp_events emit; handoff events; Morning Brief integration (NBA/committee surfaces added to existing P208 brief) | 2 | 107 | F-115 |
| 222-03 | Timeline Taxonomy Extensions | Migration 110 (crm_activity column extensions + backfill); `buildCrmTimeline` upgraded (source_domain + commercial_signal output); F-119 timeline API contract; `TimelineDetailView` component + `LifecycleTransitionTimeline` component | 2 | 110 | F-119 |
| 222-04 | NBA Durable Object + Execution Refactor | `nba_records` table; `lib/markos/crm360/nba/*`; `execution-queue.tsx` refactored to read nba_records; `NBAExplainPanel` component; NBA recompute cron (Vercel Cron + AgentRun bridge); F-116 contract | 3 | 108 | F-116 |
| 222-05 | Buying Committee + Workspace UI + API/MCP | `buying_committees` + `buying_committee_members` tables; `lib/markos/crm360/committees/*`; `BuyingCommitteePanel` component; `/v1/crm/*` full API surface; 4 MCP tools; F-117, F-118, F-120, F-121 contracts; `copilot-record-panel.tsx` evolution | 3 | 109 | F-117, F-118, F-120, F-121 |
| 222-06 | Migration Drift Cron + RLS Suite + Playwright + Closeout | Migration 111 (indexes + RLS hardening); migration 112 (drift audit log); drift reconciliation cron; Playwright operator journeys; Chromatic snapshots for all new panels; full regression suite green; phase closeout | 4 | 111, 112 | none |

### Wave 0 (pre-implementation gaps)

- [ ] `vitest.config.ts` — if not created by P221
- [ ] `playwright.config.ts` — if not created by P221
- [ ] `test/fixtures/crm360/*.ts` — shared fixtures for Customer360, Opportunity, NBA, Committee, Member
- [ ] Verify F-ID starting point against current `contracts/flow-registry.json`
- [ ] Verify migration starting number against current `supabase/migrations/` directory listing

---

## Integration Contracts (Adapter + Shim + Event-Emit Signatures)

### 1. CDP Adapter Consumption

```typescript
// lib/markos/crm360/adapters/cdp-overlay.ts
// Wraps P221 adapter; called by Customer360 read path (D-21)
export async function getCustomer360WithCdpContext(
  tenantId: string,
  c360: Customer360Record,
): Promise<Customer360WithCdp> {
  if (!c360.canonical_identity_id) {
    // No CDP profile linked yet — return commercial-only overlay
    return { ...c360, cdp_traits: [], consent_state: null };
  }
  // Delegate to P221 adapter (DO NOT duplicate adapter logic)
  const cdpProjection = await getProfileForContact(tenantId, c360.canonical_identity_id);
  return {
    ...c360,
    cdp_traits: cdpProjection.traits,
    consent_state: cdpProjection.consent_state,
  };
}
```

### 2. Legacy Adapter (D-19)

```typescript
// lib/markos/crm360/adapters/legacy-entity.ts
// Called by workspace.ts, execution.ts, copilot.ts, reporting.ts consumers during shim window
export async function hydrateFromCrmEntity(
  tenantId: string,
  entityId: string,
  crmEntity: CrmEntity,
): Promise<Customer360Hydrated | FallbackCustomer360>

// Fallback shape (used when customer_360_records row not yet backfilled):
export function buildFallbackCustomer360(entity: CrmEntity): FallbackCustomer360 {
  // Returns Customer360-shaped object from crm_entities row
  // So callers don't need if/else checks during shim window
}
```

### 3. CRM → CDP Event Emit (D-07, D-22)

```typescript
// lib/markos/crm360/events/emit.ts
export interface CrmMutationContext {
  source_event_ref: string;         // UUID, generated before writing CRM row
  tenant_id: string;
  crm_event_name: string;           // e.g., 'crm.customer360.patch', 'crm.lifecycle.transition'
  occurred_at: string;              // ISO
  canonical_identity_id: string | null;
  account_id: string | null;
  mutation_payload: Record<string, unknown>;  // no raw PII per P221 D-28
}

export async function emitCrmEventEnvelope(ctx: CrmMutationContext): Promise<void>
// Called at end of every CRM mutation handler.
// Writes to cdp_events table with event_domain='crm'.
// Throws on failure — do not swallow errors (fail-closed posture).
```

### 4. Approval Package Integration (D-28, P105 pattern)

```typescript
// Reuse existing P105 pattern: lib/markos/crm/copilot.ts + crm_copilot_approval_packages
// No new approval infrastructure needed in P222.
// High-risk mutation list (require approval_ref before applying):
const HIGH_RISK_CRM_MUTATIONS = [
  'lifecycle_stage:customer',     // new customer
  'lifecycle_stage:lost',         // lost
  'pricing_context_id:*',         // any pricing context change
  'account_owner_user_id:*',      // ownership handoff across role boundaries
  'deal_owner_user_id:*',
  'cs_owner_user_id:*',
];
// Low-risk (proceed within role limits, no approval required):
const LOW_RISK_CRM_MUTATIONS = [
  'nba:dismiss',
  'note:append',
  'task:create',
  'lifecycle_stage:engaged',   // non-commercial transitions
];
```

### 5. Morning Brief Integration (D-29, P208)

The Morning Brief (P208) reads from a brief aggregator. P222 adds two new entry types. No P208 code changes — Morning Brief reads from existing task + recommendation infra. The new nba_records table and buying_committees table expose their data through existing operator task routes.

```typescript
// New brief entry types added to P208 brief aggregator:
// Type 1: top-N active NBA by primary_owner (from nba_records WHERE status='active')
// Type 2: top-N committee-gap opportunities (from buying_committees WHERE missing_roles != '{}')
// These are READ operations — no new P208 mutations.
```

---

## `primary_owner_user_id` Strategy

### Recommendation: Application-Side Derivation (NOT Postgres Generated Column)

**Decision:** Derive `primary_owner_user_id` in application code (`lib/markos/crm360/lifecycle/stage-router.ts::derivePrimaryOwner`) and persist as a regular TEXT column on every lifecycle mutation. Do NOT use a Postgres generated column.

**Rationale:**

| Factor | Generated Column | Application-Side |
|--------|-----------------|-----------------|
| RLS query performance | Similar — index on column works either way | Similar |
| Correctness on concurrent updates | Must handle lifecycle_stage + all owner columns in same UPDATE | Explicit code path — easier to test |
| Testability | Requires DB fixtures for every scenario | Pure function — unit testable with 100% coverage |
| Custom derivation logic (fallback chains) | Complex generated expression; hard to read | Clear TypeScript; readable fallback chain |
| Staging behavior with NULL ownership | NULL check in generated expression; subtle | Explicit fallback to account_owner_user_id |
| Migration complexity | Requires DB-native function support | No additional DB objects |
| Audit trail | No automatic record of WHY it changed | Can emit audit event when primary_owner changes |

**Implementation rule:** Every call to `updateCustomer360Lifecycle` or `updateOwnershipColumn` MUST call `derivePrimaryOwner(updatedRecord)` and persist the result before returning. Tests must verify derivation for every lifecycle_stage × ownership-tuple combination (at minimum: all 11 stages × NULL owner fallback cases = 22+ test cases).

---

## NBA Recompute Infrastructure

### Recommendation: Vercel Cron + AgentRun audit bridge (matches P221 D-8 pattern)

**Align with:** P221 trait recompute pattern + P207 AgentRun v2.

| Trigger | Mechanism | Frequency | Priority |
|---------|-----------|-----------|---------|
| Score recompute (fit/revenue/risk) | Vercel Cron → `recomputeNbaForTenant` | Daily (off-peak, 02:00 UTC) | P2 |
| Intent/engagement recompute | Event-triggered via cdp_events insert | Real-time on ingest | P1 |
| NBA expiration scan | Vercel Cron → `expireNbaRecords` | Hourly | P2 |
| Lifecycle transition → NBA recompute | Triggered in lifecycle transition handler | Synchronous (in-handler) | P1 |
| Operator dismissal → NBA supersedence | Request-time | Synchronous (in-handler) | P0 |

**Thundering-herd prevention:** `expires_at` is set with jitter:

```typescript
function computeExpiresAt(actionType: string, opts: { jitter: boolean }): string {
  const base = ACTION_TYPE_TTL_HOURS[actionType] ?? 72;   // default 72h
  const jitterHours = opts.jitter ? Math.random() * 12 : 0; // ±12h spread
  return new Date(Date.now() + (base + jitterHours) * 3600_000).toISOString();
}
```

**AgentRun bridge:** Batch recompute runs wrap in `markos_agent_runs` row (per P207 pattern). Each recompute emits run_id + model + token + cost metadata. Failures create operator tasks (P208 TASK-01).

---

## Common Pitfalls

### Pitfall 1: Dual-Write Race (customer_360_records vs crm_entities during shim)
**What goes wrong:** A crm_entities row is updated (e.g., stage change), but customer_360_records is not synced because the dual-write path hasn't wrapped all mutation handlers yet.
**Why it happens:** Two codepaths exist simultaneously during the shim window.
**How to avoid:** The drift reconciliation cron (D-20) is the safety net. Additionally, any new P222 mutation handler MUST write customer_360_records first; the legacy crm_entities dual-write is secondary. Enforce with a linter rule: `updateCrmEntity` without a corresponding `updateCustomer360` is flagged in test fixtures.
**Warning signs:** `crm360_drift_audit_log` rows appearing with `drift_threshold_exceeded=true`.

### Pitfall 2: NBA Expiration Thundering Herd
**What goes wrong:** Hundreds of NBA records all have `expires_at = midnight`. Cron fires, recomputes all at once, spikes DB connections and compute budget.
**Why it happens:** `expires_at` set to a fixed TTL without jitter at compute time.
**How to avoid:** Always use `computeExpiresAt(actionType, { jitter: true })`. Test fixture verifies jitter spread.
**Warning signs:** Cron run duration spiking to > 30s per tenant; DB connection pool exhaustion at midnight.

### Pitfall 3: Timeline Filter Explosion (10 × 7 = 70 filter combinations)
**What goes wrong:** UI builds 70 distinct filter checkbox combinations for source_domain × commercial_signal; query planner falls back to full scan without index.
**Why it happens:** Composite filter on two nullable columns without composite index.
**How to avoid:** Migration 110 adds composite index `(tenant_id, source_domain, occurred_at DESC)` and separate index on `commercial_signal`. UI uses server-side pre-aggregated filter counts rather than client-side filtering.
**Warning signs:** Timeline API P99 latency > 500ms when both filters applied.

### Pitfall 4: Buying Committee Role Conflict (same person, concurrent role change)
**What goes wrong:** Two concurrent requests both try to change a committee member's role. Both close the same active membership row and insert new rows; results in two active memberships for the same person.
**Why it happens:** Non-atomic close+insert without row-level locking.
**How to avoid:** `closeActiveMembership` uses `UPDATE ... WHERE valid_to IS NULL RETURNING *` as an atomic operation. If 0 rows returned, the role change is rejected (idempotent via source_event_ref).
**Warning signs:** `buying_committee_members` query returning two rows with `valid_to IS NULL` for same person+committee.

### Pitfall 5: Lifecycle Transition Race (concurrent stage changes)
**What goes wrong:** Two events simultaneously trigger stage transitions (e.g., form fill + inbound email both evaluate lifecycle stage at same millisecond). Both try to write lifecycle_transitions rows with different to_stage values.
**Why it happens:** No optimistic locking on lifecycle_stage column.
**How to avoid:** Lifecycle transition handler uses `UPDATE customer_360_records SET lifecycle_stage = $1 WHERE customer_360_id = $2 AND lifecycle_stage = $3 RETURNING *`. If 0 rows returned, log as superseded — first writer wins.
**Warning signs:** `lifecycle_transitions` showing two simultaneous transitions from same from_stage.

### Pitfall 6: Stale `primary_owner_user_id` After Stage Change Without Full Update
**What goes wrong:** Lifecycle stage changes but the handler only calls `derivePrimaryOwner` with the NEW stage before all owner columns are fully loaded from DB (read-then-write race).
**Why it happens:** Handler reads partial record, derives primary_owner, writes — but another concurrent write changed an owner column in between.
**How to avoid:** `updateCustomer360Lifecycle` always reads the FULL current record from DB (or receives the full record as input), derives primary_owner on the complete state, then writes all columns in one UPDATE statement.
**Warning signs:** Morning Brief showing wrong primary_owner assignment for newly transitioned records.

### Pitfall 7: Tombstone Propagation Race (CDP tombstone arrives during CRM mutation)
**What goes wrong:** CDP tombstone cascade (D-32) fires while a CRM mutation is in flight. The CRM mutation succeeds (writes display_name, current_summary), then the tombstone handler scrubs those columns — but the CRM audit log still shows the pre-scrub values as the final state.
**Why it happens:** Tombstone handler and mutation handler both write to customer_360_records without coordination.
**How to avoid:** Tombstone handler uses `UPDATE ... WHERE tombstoned = FALSE` to detect concurrent writes. Audit log captures tombstone operation AFTER the scrub, referencing the `deletion_evidence_ref`. CRM mutation handlers check `tombstoned` flag on every load; if true, return 410 Gone and do not proceed.
**Warning signs:** tombstoned=true rows appearing in execution queue or Morning Brief.

---

## Tests Implied (Per Slice)

### Slice 222-01: Customer360 + Opportunity SOR + Legacy Adapter

**File:** `test/crm360/customer360.test.ts`
- Customer360 CRUD: create, read (single, list with entity_type filter), patch (owner, summary, lifecycle_stage)
- RLS: cross-tenant access denied for all operations
- Tombstone cascade: tombstoned=true + PII scrubbed after D-32 trigger
- `canonical_identity_id` nulled on CDP tombstone

**File:** `test/crm360/opportunity.test.ts`
- Opportunity CRUD: create, read, patch (stage, amount, health)
- Approval gate: pricing_context_id change requires approval_ref (negative path)
- Stage transition that touches pricing uses `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder
- RLS: cross-tenant denied

**File:** `test/crm360/legacy-adapter.test.ts`
- `hydrateFromCrmEntity`: returns Customer360-shaped result for migrated + un-migrated entities
- `buildFallbackCustomer360`: produces valid shape from crm_entities row alone
- Existing workspace.ts, execution.ts, copilot.ts, reporting.ts tests still GREEN (regression guard)

### Slice 222-02: Lifecycle + Ownership Event Model

**File:** `test/crm360/lifecycle.test.ts`
- Append-only: UPDATE on lifecycle_transitions forbidden (negative path)
- Concurrent stage change: second writer gets 0-row UPDATE (first writer wins)
- Transition emits crm_activity row (source_domain='crm') — verified in test
- Transition emits cdp_events row (event_domain='crm') — mock cdp insert called
- `primary_owner_user_id` derivation: all 11 stages × owner tuple combinations (≥22 cases)
- Handoff event: lifecycle_transitions row with reason='handoff' written on owner change
- `PRIMARY_OWNER_DERIVATION`: NULL owner fallback chains correct per D-16

**File:** `test/crm360/emit.test.ts`
- `emitCrmEventEnvelope`: shared source_event_ref threads CRM activity ↔ cdp_events
- Failure: throws on cdp_events insert failure (fail-closed posture)
- No raw PII in mutation_payload (negative path: PII fields stripped)

### Slice 222-03: Timeline Taxonomy Extensions

**File:** `test/crm360/timeline-extensions.test.ts`
- `buildCrmTimeline` output: source_domain + commercial_signal + actor_type present on enriched rows
- Backward compat: activity_family still present on all rows
- HIGH_SIGNAL filter: still applied per D-06 (regression)
- NULL source_domain + NULL commercial_signal: rows still returned (nullable, not required)
- Filter: source_domain='crm' returns only CRM-domain events
- Filter: commercial_signal='risk' returns only risk-signal events
- source_event_ref threading: stitched_identity rows still carry stitch_evidence_ref
- Backfill: historical rows get source_domain from activity_family mapping

**File:** `test/crm360/timeline-api.test.ts`
- `/v1/crm/timeline`: GET by subject with source_domain + commercial_signal query params
- RLS: timeline read denied without tenant context
- Empty result: returns [] not 500

### Slice 222-04: NBA Durable Object + Execution Refactor

**File:** `test/crm360/nba.test.ts`
- NBA CRUD: create, read active by subject, dismiss (status → 'dismissed'), execute (status → 'executed')
- Supersedence: superseded_by populated; old row status → 'superseded'
- Expiration: `expires_at` has jitter (spread test: 100 NBA rows, no two have same expires_at minute)
- Approval gate: NBA with action_type requiring approval → approval_ref required before execute (negative path)
- Evidence refs: evidence_refs[] populated; matches P209 EvidenceMap format
- RLS: cross-tenant NBA access denied

**File:** `test/crm360/execution-nba-refactor.test.ts`
- `execution-queue.tsx` reads from nba_records table (not on-read compute)
- Urgency bias preserved: due/overdue > NBA suggestions (P103 D-04 regression)
- `NBAExplainPanel` receives rationale + evidence_refs + expires_at + approval_ref props

**File:** `test/crm360/nba-recompute.test.ts`
- Recompute triggered on lifecycle transition: nba_records row written
- Cron expiry scan: expired NBA rows status → 'expired'
- Thundering herd: jitter spreads expires_at across 12h window

### Slice 222-05: Buying Committee + Workspace UI + API/MCP

**File:** `test/crm360/committee.test.ts`
- Committee CRUD: create, read by subject, update coverage_score + missing_roles
- Member role history: close+insert atomic on role change
- Concurrent role change: second writer gets 0-row RETURNING (first wins)
- Active membership query: WHERE valid_to IS NULL returns correct single row
- `missing_roles` string outputs match doc 18 format: "No finance stakeholder engaged"
- RLS: cross-tenant denied

**File:** `test/crm360/multi-role-ownership.test.ts`
- Multi-role tuple: all 4 owner columns independent; PATCH one doesn't null others
- Primary owner handoff: owner change writes lifecycle_transitions reason='handoff'
- Handoff audit: markos_audit_log row written on owner change

**File:** `test/crm360/api-crm360.test.ts`
- All `/v1/crm/*` endpoints: GET/POST/PATCH contract shape validates against F-IDs
- Auth required: 401 on missing bearer token
- Tenant scoped: 403 on cross-tenant access
- Approval gate: high-risk mutations return 422 without approval_ref

**File:** `test/crm360/mcp-tools.test.ts`
- `get_customer_360`: returns full record + scores + primary_owner + active NBA
- `get_opportunity_context`: returns opp + committee coverage + objections + evidence_gaps + NBA
- `list_committee_gaps`: returns opps with missing_roles not empty
- `list_next_best_actions`: filtered by subject_type, expires_after, owner

### Slice 222-06: Migration Drift Cron + RLS Suite + Playwright

**File:** `test/crm360/drift-reconciliation.test.ts`
- Drift detection: customer_360_records vs crm_entities discrepancy → crm360_drift_audit_log row
- Threshold: drift_count > 0 → operator task created
- Idempotent: re-running cron on same data produces 0 new drift rows

**File:** `test/crm360/rls-suite.test.ts`
- All 6 new tables: cross-tenant SELECT/INSERT/UPDATE/DELETE denied
- Missing tenant context: fail-closed returns empty set (not error)
- Audit log: every mutation writes markos_audit_log row

**File:** `e2e/crm360/timeline-detail-view.spec.ts` (Playwright)
- Operator opens workspace → selects record → TimelineDetailView loads as default
- Filter by source_domain='meeting' → only meeting events visible
- Filter by commercial_signal='risk' → only risk events visible

**File:** `e2e/crm360/buying-committee.spec.ts` (Playwright)
- Operator views opportunity → BuyingCommitteePanel shows coverage %, missing roles
- "Invite role" action creates task + triggers approval flow (P105 pattern)

**File:** `e2e/crm360/nba-explain.spec.ts` (Playwright)
- Operator views NBA → NBAExplainPanel shows rationale + evidence chips + expires_at
- Inline accept routes through P105 approval-package flow

**File:** `e2e/crm360/lifecycle-timeline.spec.ts` (Playwright)
- Operator views person record → LifecycleTransitionTimeline shows stage history
- Each transition shows actor + evidence chip + reason

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (primary) | Vitest (Phase 204+ doctrine per V4.0.0-TESTING-ENVIRONMENT-PLAN.md) |
| Framework (legacy regression) | node --test (npm test) |
| Config file | `vitest.config.ts` (Wave 0 gap — create if P221 did not) |
| E2E framework | Playwright |
| E2E config | `playwright.config.ts` (Wave 0 gap — create if P221 did not) |
| Visual regression | Chromatic/Storybook |
| Quick run command | `vitest run test/crm360/` |
| Full suite command | `vitest run && npm test && playwright test` |

### Per-Slice Validation Table

| Slice | Unit (Vitest) | Integration (Vitest) | Contract | Regression (node --test) | Negative-Path | Playwright | Chromatic |
|-------|--------------|---------------------|----------|--------------------------|---------------|------------|----------|
| 222-01 | Customer360/Opportunity CRUD logic | Legacy adapter hydration | F-113, F-114 shape | workspace.ts, execution.ts, copilot.ts still green | Tombstone, cross-tenant, pricing approval required | n/a | n/a |
| 222-02 | Lifecycle stage routing, primary_owner derivation | cdp_events emit (mock CDP) | F-115 shape | timeline.ts backward compat | Concurrent race (first wins), owner handoff denied without audit | n/a | n/a |
| 222-03 | buildCrmTimeline extension, backfill mapping | source_domain filter query | F-119 shape | HIGH_SIGNAL filter preserved | NULL commercial_signal handled | Timeline filter flow | TimelineDetailView (empty, filtered, full) |
| 222-04 | NBA CRUD, supersedence, expiry jitter | Recompute on lifecycle event | F-116 shape | urgency bias P103 D-04 preserved | Approve-required execute blocked | NBAExplainPanel flow | NBAExplainPanel (active, dismissed, expired) |
| 222-05 | Committee coverage, member role history | MCP tool payloads | F-117, F-118, F-120, F-121 shape | execution-queue reads nba_records | Cross-tenant denied, concurrent role change | BuyingCommitteePanel + committee gap | BuyingCommitteePanel (full, gap, empty) |
| 222-06 | Drift cron idempotency, RLS matrix | Reconciliation audit log write | All 9 F-IDs registered | All P100-P105 tests still green | Missing tenant → fail-closed | Full operator journey | LifecycleTransitionTimeline states |

### Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| RLS policies | 100% — all 6 new tables cross-tenant denied | `test/crm360/rls-suite.test.ts` |
| Business logic decision branches | 100% — all D-08 status transitions, D-11 stage routing, D-15 role history | Vitest branch coverage |
| Contract field coverage | 100% — all 9 F-IDs validated against actual API response shape | `test/crm360/api-crm360.test.ts` |
| Legacy regression | 100% — all existing P100-P105 node --test suites remain green | `npm test` |
| Negative-path | ≥2 per object type (Customer360, Opportunity, NBA, Committee, Member) | Explicit negative-path test files |
| Primary_owner derivation | 100% — all 11 lifecycle_stage values × NULL owner fallback | `test/crm360/lifecycle.test.ts` |
| `{{MARKOS_PRICING_ENGINE_PENDING}}` enforcement | 100% — pricing_context_id mutations require approval_ref | Pricing guard test |

### Fixture Strategy

Shared fixtures in `test/fixtures/crm360/`:
- `cdpCustomer360.ts` — minimal + full Customer360 record shapes; tombstoned variant
- `cdpOpportunity.ts` — healthy, at_risk, stalled opportunity variants; pricing_context_id null variant
- `cdpLifecycleTransition.ts` — all 11 from→to stage transitions; handoff variant
- `cdpNBA.ts` — active, dismissed, expired, superseded NBA variants
- `cdpCommittee.ts` — full coverage (100%), missing roles (40%) committee variants
- `cdpCommitteeMember.ts` — active membership; historical (valid_to set) membership
- `legacyEntitySnapshot.ts` — crm_entities row for legacy adapter regression tests

Reuses P221 fixtures from `test/fixtures/cdp/` for CDP overlay (canonical_identity_id, consent_state).

### Acceptance Criteria Tie-In

| Req ID | Test File | Pass Condition |
|--------|-----------|----------------|
| CRM-01 | `customer360.test.ts`, `timeline-extensions.test.ts`, `lifecycle.test.ts` | Timeline query returns source_domain + commercial_signal; Customer360 records retrievable with lifecycle_stage |
| CRM-02 | `nba.test.ts`, `opportunity.test.ts` | Score envelope populated with provenance; nba_records active row present per subject |
| CRM-03 | `lifecycle.test.ts`, `committee.test.ts`, `multi-role-ownership.test.ts` | Handoff events written; committee coverage visible across marketing/sales/CS contexts |
| CRM-04 | `nba.test.ts` (approval gate), `api-crm360.test.ts` | NBA action_type binds to task creation; high-risk mutations blocked without approval_ref |
| CRM-05 | `opportunity.test.ts` (pricing guard), `nba.test.ts` (evidence_refs) | `{{MARKOS_PRICING_ENGINE_PENDING}}` present in pricing-adjacent mutations; evidence_refs non-empty on NBA |
| QA-02 | `rls-suite.test.ts` | All 6 tables fail-closed on cross-tenant access |

### Sampling Rate

- **Per task commit:** `vitest run test/crm360/<slice-specific-file>`
- **Per wave merge:** `vitest run test/crm360/ && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`: `vitest run && npm test && playwright test`

---

## Requirement Mapping

| Req ID | Slice(s) | How Addressed |
|--------|---------|---------------|
| CRM-01 | 222-01, 222-02, 222-03 | `customer_360_records` + `opportunities` = first-class commercial objects; `lifecycle_transitions` = lifecycle memory; `buildCrmTimeline` extension = timeline-first |
| CRM-02 | 222-01, 222-04 | Score envelope on Customer360 (D-09); `nba_records` = explicit next-best action with evidence; `NBAExplainPanel` = operator-visible |
| CRM-03 | 222-02, 222-05 | Multi-role ownership tuple (D-16); handoff events (D-17); buying committee = shared committee visibility; Morning Brief surfaces NBA + gaps |
| CRM-04 | 222-04, 222-05 | NBA `action_type` binds to task/approval path; committee gap → "Invite role" creates task + approval; execution-queue reads nba_records |
| CRM-05 | 222-01, 222-04 | P105 approval-package reused for all high-risk mutations; `{{MARKOS_PRICING_ENGINE_PENDING}}` in pricing_context_id paths; NBA evidence_refs mandatory |
| CDP-01 | n/a | Satisfied by P221 (read-side carry-forward via adapter D-21) |
| CDP-02 | 222-01 | Tombstone cascade (D-32) propagates to Customer360; canonical_identity_id nulled |
| CDP-03 | 222-02 | ConsentState re-validation at dispatch (D-23 double-gate); not new P222 implementation |
| CDP-04 | 222-02, 222-03 | CRM mutations emit cdp_events (D-07); timeline events read CDP traits via adapter |
| CDP-05 | 222-01 | Tombstone scrubs PII columns; tombstoned=true records excluded from execution |
| TASK-01 | 222-04, 222-06 | NBA + drift cron create operator tasks; all NBA failures create visible tasks (P207 bridge) |
| TASK-02 | 222-02, 222-05 | Morning Brief: top-N NBA by primary_owner + committee-gap opportunities |
| TASK-03 | 222-04, 222-05 | Execution queue reads nba_records; primary_owner_user_id drives routing |
| TASK-04 | 222-05 | P208 Approval Inbox gains Customer360 + Opportunity + NBA entry types |
| TASK-05 | 222-05 | P208 mobile substrate unchanged; new entry types render in existing mobile shell |
| QA-01 | 222-01..222-05 | 9 new F-IDs registered in flow-registry.json |
| QA-02 | 222-06 | RLS on all 6 tables; markos_audit_log wired; fail-closed tenant context |
| QA-03..15 | 222-06 | Vitest 100% branch coverage of business logic; Playwright operator journeys; Chromatic new panels |

---

## Scope Guardrails

The following are OUT OF SCOPE and MUST NOT appear in any 222-0x plan:

| Deferred Item | Correct Phase |
|---------------|--------------|
| Native email/SMS/WhatsApp/push dispatch consuming Customer360 + ConsentState | P223 |
| Conversion surfaces, landing pages, forms, launch orchestration | P224 |
| Semantic attribution, journey analytics, narrative intelligence | P225 |
| Full CRM 360 exploratory dashboard (trait explorer, identity graph viewer) | P225 |
| Sales enablement: battlecards, proof packs, objection intelligence, proposals, win/loss | P226 |
| Opportunity Coach agent (CRM-05 MARKOS-AGT-CRM-05/06) registered with AgentRun v2 | P226 |
| Full doc 18 BuyingCommittee AI suggestions (auto-detect missing roles from email/meeting evidence) | P225+ |
| Ecosystem, partner, affiliate, community, developer-growth workflows | P227 |
| Commercial OS integration closure | P228 |
| workspace + household entity_type ingest (enum accepted, v1 ingest does not emit them) | P218/P225 |
| crm_entities cutover to derived-view-only | Post-P222 cleanup |
| Cross-tenant commercial-signal anonymized learning | P212/P228 |

**Scope anchor (from doc 18):** Customer360 is the OPERATIONAL overlay. CDP stays SOR for identity/consent/traits. P222 adds commercial state only; it does not re-introduce identity confusion.

---

## UI Compatibility Note

Phase 222 **evolves** existing UI components; it does NOT create a parallel CRM workspace. This satisfies the P208 single-shell rule (D-24).

**No new UI-SPEC contract is required** because:
1. `workspace-shell.tsx` retains the same 6-view Kanban-default structure (P102 D-02/D-03 preserved).
2. `execution-queue.tsx` retains the same 7-tab unified queue (P103 D-01/D-04 preserved); data source changes from on-read compute to nba_records table.
3. `copilot-record-panel.tsx` retains the same record brief + evidence-inline posture (P105 D-01/D-03 preserved); data source enriched with Customer360 `current_summary`.
4. New components (`TimelineDetailView`, `BuyingCommitteePanel`, `NBAExplainPanel`, `LifecycleTransitionTimeline`) follow existing CSS modules pattern visible in `components/markos/crm/`.

**Naming convention:** New components follow PascalCase under `components/markos/crm/`. No new CSS design tokens — reuse existing token set from repo CSS module files. Typography + chip colors follow existing operator UI patterns (not redefined in this phase).

**Chromatic obligation (D-25 new components):** Each new component gets Storybook stories for empty, loading, populated, error, and tombstoned state variants. Chromatic snapshots gate Wave 4 merge.

---

## Research Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| RD-01 | `primary_owner_user_id` = application-side derivation (not Postgres generated column) | Testable pure function; clear fallback chain; easier audit trail; no DB-native expression complexity |
| RD-02 | NBA recompute = Vercel Cron + AgentRun bridge (matches P221/P207 pattern) | Consistency with trait recompute; no new infra; thundering-herd controlled by expires_at jitter |
| RD-03 | `lib/markos/crm360/` as new module boundary (not inside `lib/markos/crm/`) | Clean separation: legacy consumers stay in `lib/markos/crm/`; new Customer360 SOR lives in `lib/markos/crm360/`; adapter bridges them |
| RD-04 | 9 F-IDs (F-113..F-121), 7 migrations (106..112) | Verified P221 stopped at F-112 and migration 105; D-33/D-34 anticipated 7-9 contracts and 5-7 migrations |
| RD-05 | Slice 222-06 dedicated to reconciliation + RLS hardening + Playwright (not split across other slices) | Consolidates all cross-cutting concerns; prevents slices 01-05 from being bloated with infrastructure |
| RD-06 | `{{MARKOS_PRICING_ENGINE_PENDING}}` enforced in `opportunities::pricing_context_id` mutations and `next_required_action` field | Matches P211 D-23 + CLAUDE.md pricing placeholder rule; `pricing-guard.ts` module handles enforcement |
| RD-07 | Tombstone check in every Customer360 load (`tombstoned=true` → 410 Gone) | Prevents stale tombstoned records flowing into execution queue, Morning Brief, or NBA recompute |
| RD-08 | Jitter on NBA `expires_at` (±12h random spread) | Prevents thundering herd on hourly/daily cron; tested explicitly in `nba.test.ts` |
| RD-09 | Timeline backfill (migration 110) maps activity_family → source_domain for historical rows | Ensures timeline filter works on pre-P222 activity rows immediately after migration |
| RD-10 | `emitCrmEventEnvelope` throws on failure (fail-closed) | Maintains CDP event ledger integrity; CRM mutations do not silently succeed when CDP write fails |

---

## Assumptions Log

> Claims tagged `[ASSUMED]` in this research. Planner and discuss-phase use this table to identify decisions needing confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P221 F-ID allocation stopped at F-112 (highest = F-112) | F-ID Allocation | F-ID collision if other work allocated F-113+ since research; verify against `contracts/flow-registry.json` |
| A2 | P221 migration allocation stopped at 105 (highest = 105) | Migration Allocation | Migration ordering collision; verify against `supabase/migrations/` directory listing |
| A3 | `lib/markos/cdp/adapters/crm-projection.ts` was created in P221 execution | Integration Contracts | If P221 not yet executed, this file does not exist; P222 Wave 1 must create it or create a stub |
| A4 | Vitest + Playwright were installed as Wave 0 by P221 | Validation Architecture | If not installed, P222 Wave 0 must install; add `npm install --save-dev vitest playwright @playwright/test` to Wave 0 gap list |
| A5 | `markos_agent_runs` table exists from P207 execution | NBA Recompute Infrastructure | If P207 not yet executed, AgentRun bridge is a stub; NBA recompute cron runs without AgentRun logging until P207 lands |
| A6 | P208 Morning Brief aggregator accepts new entry types via a registration/extension pattern | Integration Contracts (Morning Brief) | If P208 brief aggregator is hardcoded, adding NBA + committee-gap entries requires P208 code changes in P222-06; plan accordingly |
| A7 | `crm_pipelines` table exists from P102/P60 migrations | Schema Sketches (opportunities) | If pipeline table name differs, FK in `opportunities` must be corrected |
| A8 | `cdp_identity_profiles` table exists and has `profile_id` UUID PK from P221 | Schema Sketches (customer_360_records) | If P221 not yet executed, canonical_identity_id FK cannot be established; defer to when P221 is live |

**If any of A1-A8 are wrong:** Planner adjusts the affected slice's Wave 0 pre-conditions and documents the delta in the plan's ## Assumptions section.

---

## Environment Availability

> External dependencies for Phase 222 tooling.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase (Postgres + RLS) | All migrations | ✓ (existing substrate) | Inherited from P100+ | — |
| Vitest | Business logic tests | Verify at Wave 0 (P221 may have installed) | — | Install in Wave 0: `npm install --save-dev vitest` |
| Playwright | E2E operator journeys | Verify at Wave 0 | — | Install in Wave 0: `npm install --save-dev playwright @playwright/test` |
| Chromatic/Storybook | Visual regression | ✓ (`.storybook/` exists per V4.0.0-TESTING-ENVIRONMENT-PLAN.md) | Existing | — |
| Vercel Cron | NBA recompute + drift cron | ✓ (existing project) | Existing | Manual admin trigger as fallback for local dev |
| `markos_audit_log` hash chain (P201) | Audit trail (D-31) | Verify at Wave 1 (P201 must have run) | — | If P201 not run, log to console and create audit placeholder |

---

## Sources

### Primary (HIGH confidence)
- `222-CONTEXT.md` — 34 locked decisions (D-01..D-34) — primary constraint source [VERIFIED: file read]
- `221-CONTEXT.md` + `221-RESEARCH.md` — F-ID and migration allocation; adapter patterns; P221 D-20 template [VERIFIED: file read]
- `lib/markos/crm/timeline.ts` — ACTIVITY_FAMILY_ALIASES, buildCrmTimeline shape [VERIFIED: file read]
- `lib/markos/crm/execution.ts` — NBA reducer logic, urgency scoring, queue tabs [VERIFIED: file read]
- `lib/markos/crm/contracts.ts` — crmRecordKinds, schema shapes [VERIFIED: file read]
- `lib/markos/crm/copilot.ts` — buildCopilotGroundingBundle, P105 approval-package integration [VERIFIED: file read]
- `lib/markos/crm/reporting.ts` — buildReportingCockpitData shape [VERIFIED: file read]
- `obsidian/work/incoming/18-CRM-ENGINE.md` — Customer360Record, Opportunity, CrmTimelineEvent doc 18 doctrine [VERIFIED: file read]
- `obsidian/reference/Contracts Registry.md` — F-ID allocation rules, F-58..F-64 existing contracts, v2 contract gap overlay [VERIFIED: file read]
- `obsidian/reference/Database Schema.md` — migration phase map, RLS invariants, existing migration numbers [VERIFIED: file read]
- `obsidian/reference/CRM Domain.md` — lib/markos/crm module map, table names [VERIFIED: file read]
- `V4.0.0-TESTING-ENVIRONMENT-PLAN.md` — Vitest/Playwright/Chromatic doctrine [VERIFIED: file read]
- `V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — per-phase test obligations matrix [VERIFIED: file read]
- `.planning/REQUIREMENTS.md` — CRM-01..05, TASK-01..05, QA-01..15 text [VERIFIED: file read]

### Secondary (MEDIUM confidence)
- `V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — cross-phase finding "CRM is real but pre-360" [VERIFIED: file read]
- `DISCUSS.md` — 6 proposed slice structure (adjusted in this research) [VERIFIED: file read]
- `STATE.md` + `ROADMAP.md` — current execution position, phase dependency graph [VERIFIED: file read]

### Tertiary (LOW confidence — training knowledge, not session-verified)
- Postgres generated column behavior with nullable foreign key fallback chains — `[ASSUMED]` — prefer application-side for testability
- Vercel Cron jitter support for scheduled functions — `[ASSUMED]` — jitter implemented in application code, not Vercel config

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules verified against actual codebase files
- Schema sketches: HIGH — DDL derived from locked decisions (D-01..D-34) + existing P100-P105 migration patterns
- Architecture patterns: HIGH — derived from verified codebase + CONTEXT.md
- F-ID allocation: HIGH — verified P221-RESEARCH.md allocation; one assumption on parallelism (A1)
- Migration allocation: HIGH — verified P221-RESEARCH.md; one assumption on parallelism (A2)
- Pitfalls: MEDIUM — derived from architectural analysis; not all confirmed by prior production incidents
- Validation architecture: HIGH — directly follows V4.0.0-TESTING-ENVIRONMENT-PLAN.md doctrine

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days for stable architecture; re-verify F-ID range and migration numbers if other phases execute before P222 planning begins)

---

## RESEARCH COMPLETE
