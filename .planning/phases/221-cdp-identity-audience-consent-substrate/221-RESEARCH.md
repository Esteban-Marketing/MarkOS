# Phase 221: CDP Identity, Audience, and Consent Substrate — Research

**Researched:** 2026-04-24
**Domain:** First-party customer data substrate — identity graph, consent ledger, event normalization, trait materialization, audience snapshots
**Confidence:** HIGH (all architectural claims verified against codebase + CONTEXT.md locked decisions)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Profile layering
- D-01: Two-layer architecture — CDP `IdentityProfile` is the raw+computed identity SOR; CRM entity remains the operational overlay. CRM carries `canonical_identity_id` FK populated by CDP backfill. CDP never replaces CRM operational state.
- D-02: `profile_type = person | account` for v1. Workspace/household are deferred.
- D-03: Every profile has `tenant_id`, `mode` (`b2b | b2c | plg_b2b | plg_b2c | b2b2c`), `lifecycle_state`, `consent_state_id`, `last_meaningful_touch_at`, and RLS enforcement identical to CRM entity.

#### Identity graph + merge policy
- D-04: Hard-match signals (confidence = 1.0, auto-resolve): verified email, authenticated user_id, billing_customer_id, subscription_id, workspace_id. Soft-match weights carried from `lib/markos/crm/identity.ts`: email_exact_match=0.65, domain_match=0.15, device_match=0.10, session_overlap=0.10, form_submitted=0.15. Thresholds: >=0.80 auto-accept (soft), 0.40-0.79 review, <0.40 reject.
- D-05: All merges reversible with immutable lineage (`IdentityLink` rows with `link_status` + `source_event_ref` + `reviewer_actor_id`).
- D-06: Fail-closed on ambiguous tenant context.
- D-07: Anonymous-to-known stitching stays non-destructive; pre-conversion history appears on CRM timeline via stitched-label projection after acceptance only.

#### Event substrate
- D-08: New append-only `cdp_events` table is the canonical event SOR. Envelope: `{ event_id, tenant_id, event_name, event_domain, occurred_at, profile_id?, account_id?, anonymous_id?, properties }` where `event_domain ∈ { website, product, email, messaging, crm, billing, support, social, ads, partner }`.
- D-09: Existing `crm_activity` becomes a projection/view filtered by HIGH_SIGNAL allowlist (current `lib/markos/crm/tracking.ts` behavior preserved).
- D-10: `api/tracking/ingest.js` + `api/tracking/identify.js` keep their current public contract; internally dual-write to `cdp_events` (raw) and `crm_activity` (projection) during transition.

#### Consent ledger
- D-11: New `ConsentState` SOR per profile: `email_marketing`, `sms_marketing`, `whatsapp_marketing` (`opted_in | opted_out | unknown`), `push_enabled`, `in_app_enabled`, `legal_basis`, `jurisdiction`, `preference_tags[]`, `quiet_hours`, `source`, `source_timestamp`.
- D-12: `outboundConsentRecords` becomes a derived read during migration. `evaluateOutboundEligibility` reads `ConsentState` first, falls back to legacy rows on miss. Full cutover in P223.
- D-13: Every downstream send/dispatch engine MUST consume `ConsentState`.

#### Trait materialization
- D-14: Materialized `TraitSnapshot` rows per profile: `{ trait_name, value, computed_at, source_event_ref[], freshness_mode, confidence }`.
- D-15: Recompute cadence: `real_time` for intent/engagement, `hourly` for lifecycle/activation, `daily` for fit/persona/expansion/churn-risk.
- D-16: Trait provenance mandatory — feeds P209 EvidenceMap.

#### Audience definition + snapshot
- D-17: `AudienceDefinition` = `{ segment_id, tenant_id, name, objective, entity_type (person|account), logic_json, freshness_mode, destination_families[] }`. New namespace: `lib/markos/cdp/audiences/*`. The existing `segment` entity in `lib/markos/contracts/schema.ts` is a brand-taxonomy publish object — do not overload.
- D-18: `AudienceSnapshot` is immutable frozen membership. Double-gate: snapshot freezes who COULD be reached; dispatch re-validates consent/suppression/jurisdiction/quiet_hours at send time.
- D-19: Audience snapshots write an audit row per compute: `{ snapshot_id, audience_id, computed_at, membership_count, suppression_count_at_snapshot, actor_id, evidence_ref }`.

#### Downstream consumption
- D-20: CRM + attribution + timeline consume CDP via read-through adapter (`lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`). No CRM schema changes beyond `canonical_identity_id` FK backfill in P221.
- D-21: SaaS Suite customer identity bridge (P214) reads CDP `IdentityProfile` via the same adapter.

#### API + MCP surface (read-only v1)
- D-22: `GET /v1/cdp/profiles/{id}`, `GET /v1/cdp/profiles?query=...`, `GET /v1/cdp/consent/{profile_id}`, `GET /v1/cdp/audiences/{id}`, `GET /v1/cdp/audiences/{id}/snapshots/{snapshot_id}`. MCP tools: `get_unified_profile`, `get_consent_state`.
- D-23: Mutations are tenant-operator UI + review flows — NOT public API in P221.

#### Deletion + export
- D-24: DSR: `IdentityProfile` tombstoned (PII scrubbed, `deletion_evidence_ref` set). Cascade purge: `cdp_events`, `TraitSnapshot`, `AudienceSnapshot` memberships. `ConsentState` RETAINED with `deletion_evidence_ref` for legal defensibility.
- D-25: Export = `{ IdentityProfile, IdentityLink[], cdp_events[], TraitSnapshot[], ConsentState[], AudienceSnapshot membership[] }`.

#### Observability + operator posture
- D-26: Three operator surfaces — (1) Merge review inbox (reuse `lib/markos/crm/merge.cjs` + P100 UX), (2) Consent drift audit (cron-based diff), (3) Audience snapshot log (append-only).

#### Security + tenancy
- D-27: RLS on all new objects.
- D-28: No raw PII in cross-tenant learning, logs, prompts, or MCP payloads.
- D-29: Audit trail mandatory on merge decisions, consent mutations, audience compute, deletion — reuses `markos_audit_log` hash chain (P201).

#### Contracts + migrations
- D-30: Fresh F-ID allocation for each CDP contract family — ~5-7 contracts.
- D-31: 4-6 new migrations.

### Claude's Discretion
- Exact module boundary between `lib/markos/cdp/identity/*` vs `lib/markos/cdp/profiles/*` vs `lib/markos/cdp/adapters/*`.
- Trait recompute infrastructure (cron vs AgentRun vs Vercel Queue).
- Audience `logic_json` DSL shape (JSON Logic vs custom AST).
- Planner picks specific contract IDs, migration numbers, and test file names.

### Deferred Ideas (OUT OF SCOPE)
- CRM 360 customer record rewrite + timeline-first workspace → P222.
- Native email/SMS/WhatsApp/push dispatch → P223.
- Conversion surfaces + launch orchestration → P224.
- Semantic attribution + journey analytics + narrative intelligence → P225.
- Sales enablement → P226.
- Ecosystem/partner/affiliate → P227.
- Commercial OS integration closure → P228.
- Workspace + household `profile_type` extensions (v1 ships person+account only).
- Full doc 20 API surface (6 families) + 6 MCP tools — write paths land with consuming engines.
- Full CDP dashboard (identity graph viewer, trait explorer, preference center).
- CDP agent family (CDP-01..04) registered with AgentRun v2 — execution in later phases.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CDP-01 | First-party identity graph unifying profile, event, consent, source across all domains | `cdp_identity_profiles` + `cdp_identity_links` tables; hard/soft merge policy from `identity.ts` |
| CDP-02 | Explainable merge, split, precedence, provenance rules | `IdentityLink` immutable lineage; merge review inbox reuses `merge.cjs` pattern |
| CDP-03 | Governed audience data products with time-aware snapshots and suppression-safe consent | `AudienceDefinition` + `AudienceSnapshot` + double-gate dispatch re-validation |
| CDP-04 | CDP events and traits flowing into CRM, analytics, launches, channel execution | Dual-write ingest; read-through adapter; TraitSnapshot freshness families |
| CDP-05 | Privacy, retention, consent, unsubscribe, quiet hours, jurisdiction enforced consistently | `ConsentState` SOR; consent shim fallback; DSR tombstone cascade |
| RUN-01 | Every agent invocation is a persistent AgentRun | Trait recompute cron bridges to AgentRun v2 pattern; audit entries reference run_id |
| RUN-02 | AgentRun records include full metadata | Trait recompute tasks emit to `markos_agent_runs` with model/token/cost metadata |
| RUN-03 | Agent chains are DAGs with dependency/cancellation/retry | Cron-based recompute is stateless per wave; AgentRun v2 DAG compatibility path defined |
| RUN-04 | Priority tiers P0-P4 with starvation protection | Merge review tasks are P1; consent drift alerts are P1; audience compute is P2 |
| RUN-05 | Failures create visible tasks and DLQ/recovery evidence | Merge queue failures → operator tasks; consent drift → audit + task; ingest failures → DLQ |
| RUN-06 | External side effects are idempotent and approval-aware | Dual-write is idempotent via `event_id` PK; merge decisions are review-first |
| RUN-07 | CLI, UI, and MCP surfaces consume the same run/event substrate | `get_unified_profile` + `get_consent_state` MCP tools read same CDP tables |
| RUN-08 | Run events support-visible enough for replay and SOC2 evidence | `markos_audit_log` hash chain captures merge/consent/audience/deletion events |
| EVD-01 | EvidenceMap links factual claims to citations, freshness, confidence, TTL | TraitSnapshot `source_event_ref[]` + `computed_at` + `freshness_mode` + `confidence` |
| EVD-02 | Unsupported customer-facing claims block external dispatch | Audience double-gate: snapshot membership + live consent re-validation blocks sends |
| EVD-03 | Research tiers and source quality recorded on research context | Trait `confidence` field; `source_event_ref[]` traces trait to raw events |
| EVD-04 | Agents reuse non-stale research context before new research | TraitSnapshot TTL/freshness_mode controls recompute cadence |
| EVD-05 | Approval UI exposes evidence, assumptions, claim risk | Merge review inbox shows confidence + signal breakdown + source_event_ref chain |
| EVD-06 | Pricing/competitor intelligence uses source quality | Out of scope for P221 traits (fitness/intent only); placeholder applies to any pricing-adjacent trait |
| QA-01 | Contracts remain current | 7 new F-IDs allocated, registered in flow-registry.json and Contracts Registry |
| QA-02 | Tenancy, RLS, auth, audit, domains, membership, lifecycle controls remain production-safe | RLS on all 8 new tables; RLS tests per table; audit log wired to hash chain |
| QA-03..15 | Quality baseline gates apply | Vitest covers all business logic; Playwright covers merge review inbox and consent drift UI; Chromatic covers operator surfaces |

</phase_requirements>

---

## Summary

Phase 221 builds the first-party customer-data substrate that every downstream commercial engine (P222-P228) will depend on. The existing MarkOS codebase provides strong reusable primitives: a working identity-scoring function (`scoreIdentityCandidate`) with production-tested weights, an append-only CRM activity ledger, an outbound consent evaluator, and a merge-decision governance pattern with immutable lineage. The phase is strictly additive — none of these primitives are replaced; they are elevated into a more capable substrate with governed objects, dual-write ingest, a ConsentState SOR, and activation-safe audience snapshots.

The most significant architectural decision is the two-layer profile model: CDP `IdentityProfile` is the raw+computed SOR; CRM entity remains the operational overlay. This prevents both the "CRM is the only identity truth" failure mode and the "CDP shadow-writes to CRM silently" failure mode. The read-through adapter (`lib/markos/cdp/adapters/crm-projection.ts`) is the seam that keeps both layers honest.

**Primary recommendation:** Build in 6 slices, Wave 1 (core schema) first, then Waves 2-3 in parallel where the dependency graph allows. The critical path is: Schema + Migrations → ConsentState SOR → Dual-write ingest → Read-through adapter → API/MCP surface → Operator UX. Trait recompute and audience snapshot can run concurrently with consent shim work after Wave 1.

---

## Standard Stack

### Core (existing, reused as-is)

| Library / Module | Location | Purpose | Reuse Strategy |
|-----------------|----------|---------|----------------|
| `lib/markos/crm/identity.ts` | repo | `scoreIdentityCandidate` scoring weights | Carry as soft-match floor unchanged |
| `lib/markos/crm/merge.cjs` | repo | `recordMergeDecision` + `applyApprovedMerge` governance UX | Extend for CDP merge review inbox |
| `lib/markos/crm/tracking.ts` | repo | `normalizeTrackedActivity` + HIGH_SIGNAL filter | Becomes projection filter between `cdp_events` and `crm_activity` |
| `lib/markos/outbound/consent.ts` | repo | `evaluateOutboundEligibility` + `recordOutboundOptOut` | Add ConsentState read-first branch; legacy fallback preserved |
| `lib/markos/crm/timeline.ts` | repo | `buildCrmTimeline` with stitched-label projection | Unchanged; consumes same identity links; no CRM schema change |
| `lib/markos/crm/attribution.ts` | repo | `buildWeightedAttributionModel` with review-exclusion | Unchanged; reads same identity links |
| `markos_audit_log` (P201) | Supabase | Per-tenant SHA-256 hash chain | CDP merge/consent/audience/deletion events written here |
| `api/tracking/ingest.js` | repo | Public tracking ingest route | Internal dual-write added; public contract unchanged |
| `api/tracking/identify.js` | repo | Identity stitching route | Internal dual-write added; public contract unchanged |

### New CDP Modules (to be created)

| Module | Path | Purpose |
|--------|------|---------|
| cdp-identity | `lib/markos/cdp/identity/` | Profile SOR, IdentityLink SOR, hard/soft merge logic, graph resolution |
| cdp-consent | `lib/markos/cdp/consent/` | ConsentState SOR, shim evaluator, drift audit |
| cdp-events | `lib/markos/cdp/events/` | Event envelope normalization, dual-write writer |
| cdp-traits | `lib/markos/cdp/traits/` | TraitSnapshot materialization, freshness TTL management |
| cdp-audiences | `lib/markos/cdp/audiences/` | AudienceDefinition, AudienceSnapshot compute, DSL evaluator |
| cdp-adapters | `lib/markos/cdp/adapters/` | `crm-projection.ts` read-through adapter |
| cdp-deletion | `lib/markos/cdp/deletion/` | Tombstone + cascade purge + DSR export |

### Test Stack [VERIFIED: codebase scan]

| Layer | Tool | Config | Command |
|-------|------|--------|---------|
| Business logic | `node --test` (existing) | `package.json` | `npm test` |
| Business logic (new) | Vitest (Phase 204+ doctrine) | `vitest.config.ts` (Wave 0 gap) | `vitest run` |
| Browser journeys | Playwright (Phase 204+ doctrine) | `playwright.config.ts` (Wave 0 gap) | `playwright test` |
| Visual regression | Chromatic/Storybook (existing) | `.storybook/` | `chromatic` |

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/cdp/
├── identity/
│   ├── profile.ts          # IdentityProfile CRUD + tombstone
│   ├── link.ts             # IdentityLink create + score + resolve
│   ├── merge.ts            # Hard/soft merge logic; extends crm/merge.cjs pattern
│   └── graph.ts            # Graph traversal for unified profile assembly
├── consent/
│   ├── state.ts            # ConsentState SOR CRUD
│   ├── shim.ts             # evaluateOutboundEligibility bridge (ConsentState-first + legacy fallback)
│   └── drift-audit.ts      # Cron-callable diff of ConsentState vs outboundConsentRecords
├── events/
│   ├── envelope.ts         # Event envelope normalization
│   └── dual-write.ts       # Writes to cdp_events + crm_activity projection
├── traits/
│   ├── snapshot.ts         # TraitSnapshot upsert + provenance tracking
│   └── recompute.ts        # Freshness-aware recompute scheduler bridge
├── audiences/
│   ├── definition.ts       # AudienceDefinition CRUD
│   ├── snapshot.ts         # AudienceSnapshot compute + freeze + audit log
│   ├── dsl.ts              # logic_json evaluator (JSON Logic)
│   └── activation.ts       # Dispatch re-validation gate (consent + suppression)
├── adapters/
│   └── crm-projection.ts   # getProfileForContact read-through; feeds timeline/attribution
└── deletion/
    ├── tombstone.ts         # IdentityProfile tombstone + PII scrub
    └── cascade.ts          # Purge cdp_events/TraitSnapshot/AudienceSnapshot membership
```

### Pattern 1: Hard/Soft Merge Decision Flow

```typescript
// Source: lib/markos/crm/identity.ts (verified) — extended for CDP hard-match layer
function resolveIdentityMerge(signals: MergeSignals): MergeDecision {
  // Hard-match layer (confidence = 1.0, auto-accept)
  const hardSignals = [
    signals.verified_email,
    signals.authenticated_user_id,
    signals.billing_customer_id,
    signals.subscription_id,
    signals.workspace_id,
  ];
  if (hardSignals.some(Boolean)) {
    return { confidence: 1.0, decision: 'accepted', match_type: 'hard' };
  }
  // Soft-match layer (weights carried from crm/identity.ts)
  const score = scoreIdentityCandidate(signals); // re-use as-is
  return { confidence: score.confidence, decision: score.recommended_decision, match_type: 'soft' };
}
```

### Pattern 2: Dual-Write Ingest Seam

```typescript
// Source: api/tracking/ingest.js (verified) — internal dual-write added, public contract unchanged
// At the point where appendCrmActivity is called today, add parallel cdp_events write:
async function dualWriteEvent(ctx: IngestContext, normalized: NormalizedActivity): Promise<void> {
  // Existing path (preserved exactly)
  appendCrmActivity(store, normalized);
  // New CDP path (additive)
  await insertCdpEvent({
    event_id: normalized.source_event_ref,
    tenant_id: ctx.tenant_id,
    event_name: normalized.event_name,
    event_domain: mapActivityFamilyToDomain(normalized.activity_family),
    occurred_at: normalized.occurred_at,
    profile_id: ctx.resolved_profile_id ?? null,
    anonymous_id: normalized.anonymous_identity_id ?? null,
    properties: normalized.payload_json,
  });
}
```

### Pattern 3: ConsentState Shim (D-12)

```typescript
// Source: lib/markos/outbound/consent.ts (verified) — new read-first branch
async function evaluateOutboundEligibility(store, input): Promise<EligibilityResult> {
  // NEW: Read ConsentState SOR first
  const consentState = await getConsentState(input.tenant_id, input.contact_id);
  if (consentState) {
    return evaluateFromConsentState(consentState, input);
  }
  // LEGACY FALLBACK: existing outboundConsentRecords logic unchanged
  return evaluateLegacyConsent(store, input);
}
```

### Pattern 4: Audience Double-Gate

```typescript
// Source: doc 20 D-18 decision (locked)
async function checkActivationEligibility(profileId: string, channelFamily: string): Promise<boolean> {
  // Gate 1: snapshot membership (computed at audience compute time)
  const membership = await getSnapshotMembership(profileId);
  if (!membership) return false;
  // Gate 2: live consent re-validation (at dispatch time, not compute time)
  const consent = await getConsentState(membership.tenant_id, profileId);
  return evaluateConsentForChannel(consent, channelFamily);
}
```

### Pattern 5: Read-Through Adapter

```typescript
// lib/markos/cdp/adapters/crm-projection.ts
// Feeds lib/markos/crm/timeline.ts and lib/markos/crm/attribution.ts unchanged
async function getProfileForContact(tenantId: string, contactId: string): Promise<CDPProjection> {
  const profile = await getIdentityProfileByContactId(tenantId, contactId);
  return {
    canonical_identity_id: profile?.profile_id ?? null,
    consent_state: profile?.consent_state_id ? await getConsentState(tenantId, profile.profile_id) : null,
    traits: profile ? await getTraitSnapshot(tenantId, profile.profile_id) : [],
  };
}
```

### Anti-Patterns to Avoid

- **Overloading the existing `segment` brand entity** (`lib/markos/contracts/schema.ts::Segment`): That is a brand-taxonomy publish object with `workspaceId`, `criteria[]`, and `publish` state. CDP audiences live in `lib/markos/cdp/audiences/*` — do not add `logic_json` or `destination_families` to the existing `Segment` type.
- **Storing consent only in outbound records**: ConsentState must be the SOR. The `outboundConsentRecords` array in `consent.ts` is a migration-window fallback, not the truth source.
- **Issuing audience dispatches from live query**: Always go through a frozen `AudienceSnapshot`. The dispatch must re-validate consent but cannot change who is in the audience (that is the snapshot's job).
- **Treating dual-write as eventually consistent for compliance purposes**: The dual-write must be synchronous within the ingest HTTP handler or wrapped in a transaction. Do not accept 202 on the public API before both writes succeed.
- **Mutating existing CRM schema beyond `canonical_identity_id` FK**: All CRM schema changes in P221 are exactly one column on CRM entity tables. Full CRM rewrite is P222.

---

## F-ID and Migration Allocation

### Verified Current State [VERIFIED: codebase scan]

- Highest existing F-ID: **F-105** (`F-105-cli-whoami-status-v1.yaml`)
- Highest existing migration: **100** (`100_crm_schema_identity_graph_hardening.sql`)
- Contracts registry note: F-90 through F-96 are occupied by MCP/webhook work — do not reuse; allocate fresh IDs above F-105.

### Proposed F-ID Allocation (7 contracts)

| F-ID | Contract Filename | Purpose | Slice |
|------|------------------|---------|-------|
| **F-106** | `F-106-cdp-identity-profile-v1.yaml` | IdentityProfile CRUD read-only GET (D-22) | 221-01 |
| **F-107** | `F-107-cdp-identity-link-v1.yaml` | IdentityLink graph read + merge review inbox (D-22, D-26) | 221-01 |
| **F-108** | `F-108-cdp-event-envelope-v1.yaml` | CDP event envelope read endpoint (future write path lands with consuming engine) | 221-03 |
| **F-109** | `F-109-cdp-consent-state-v1.yaml` | ConsentState GET + consent drift audit surface (D-22) | 221-02 |
| **F-110** | `F-110-cdp-trait-snapshot-v1.yaml` | TraitSnapshot read per profile (D-22) | 221-03 |
| **F-111** | `F-111-cdp-audience-definition-v1.yaml` | AudienceDefinition + AudienceSnapshot read (D-22) | 221-04 |
| **F-112** | `F-112-cdp-audience-snapshot-v1.yaml` | AudienceSnapshot activation audit log read (D-19, D-26) | 221-04 |

**MCP tools** (no F-IDs required — registered in MCP tool registry, not OpenAPI flow-registry):
- `get_unified_profile` — reads via F-106
- `get_consent_state` — reads via F-109

### Proposed Migration Numbers (5 migrations)

| Migration | Filename | Content | Slice |
|-----------|----------|---------|-------|
| **101** | `101_cdp_identity_core.sql` | `cdp_identity_profiles`, `cdp_identity_links`, `canonical_identity_id` FK on CRM entity tables, RLS on both | 221-01 |
| **102** | `102_cdp_events_and_consent.sql` | `cdp_events`, `cdp_consent_states`, RLS on both | 221-02 / 221-03 |
| **103** | `103_cdp_trait_snapshots.sql` | `cdp_trait_snapshots`, RLS | 221-03 |
| **104** | `104_cdp_audience_objects.sql` | `cdp_audience_definitions`, `cdp_audience_snapshots`, `cdp_audience_snapshot_memberships`, RLS | 221-04 |
| **105** | `105_cdp_deletion_and_audit.sql` | `deletion_evidence_ref` columns, audit log extensions for CDP event types | 221-05 |

---

## Schema Sketches

### Table: `cdp_identity_profiles`

```sql
CREATE TABLE cdp_identity_profiles (
  profile_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  profile_type         TEXT NOT NULL CHECK (profile_type IN ('person', 'account')),
  mode                 TEXT NOT NULL CHECK (mode IN ('b2b', 'b2c', 'plg_b2b', 'plg_b2c', 'b2b2c')),
  lifecycle_state      TEXT NOT NULL DEFAULT 'unknown',
  consent_state_id     UUID REFERENCES cdp_consent_states(consent_state_id),
  primary_email        TEXT,               -- NULL if unknown; hashed copy stored separately for matching
  primary_phone        TEXT,
  company_name         TEXT,
  account_id           UUID,               -- FK to CRM account entity if known
  last_meaningful_touch_at TIMESTAMPTZ,
  tombstoned           BOOLEAN NOT NULL DEFAULT FALSE,
  deletion_evidence_ref TEXT,             -- set on DSR deletion
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: tenant isolation identical to CRM entity pattern
ALTER TABLE cdp_identity_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_profiles_tenant_isolation ON cdp_identity_profiles
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);
```

### Table: `cdp_identity_links`

```sql
CREATE TABLE cdp_identity_links (
  link_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id           UUID REFERENCES cdp_identity_profiles(profile_id),
  anonymous_identity_id TEXT,
  identity_type        TEXT NOT NULL CHECK (identity_type IN (
    'anonymous_cookie', 'email', 'phone', 'user_id',
    'account_id', 'workspace_id', 'subscription_id', 'billing_customer_id', 'external_id'
  )),
  identity_value_hash  TEXT NOT NULL,     -- SHA-256 of the resolved identity value (no raw PII)
  match_type           TEXT NOT NULL CHECK (match_type IN ('hard', 'soft')),
  confidence           NUMERIC(4,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  link_status          TEXT NOT NULL CHECK (link_status IN ('candidate', 'accepted', 'review', 'rejected')),
  source_event_ref     TEXT NOT NULL,
  reviewer_actor_id    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cdp_identity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_links_tenant_isolation ON cdp_identity_links
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_cdp_links_profile ON cdp_identity_links(tenant_id, profile_id);
CREATE INDEX idx_cdp_links_anon ON cdp_identity_links(tenant_id, anonymous_identity_id);
```

### CRM entity tables: add `canonical_identity_id` FK

```sql
-- Migration 101 adds this column to crm_contacts, crm_companies, crm_accounts, crm_customers
ALTER TABLE crm_contacts ADD COLUMN canonical_identity_id UUID REFERENCES cdp_identity_profiles(profile_id);
ALTER TABLE crm_companies ADD COLUMN canonical_identity_id UUID REFERENCES cdp_identity_profiles(profile_id);
ALTER TABLE crm_accounts ADD COLUMN canonical_identity_id UUID REFERENCES cdp_identity_profiles(profile_id);
ALTER TABLE crm_customers ADD COLUMN canonical_identity_id UUID REFERENCES cdp_identity_profiles(profile_id);
-- Backfill runs as a post-migration CDP data task (not in DDL)
```

### Table: `cdp_events`

```sql
CREATE TABLE cdp_events (
  event_id             TEXT PRIMARY KEY,   -- source_event_ref from ingest; idempotent
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  event_name           TEXT NOT NULL,
  event_domain         TEXT NOT NULL CHECK (event_domain IN (
    'website', 'product', 'email', 'messaging',
    'crm', 'billing', 'support', 'social', 'ads', 'partner'
  )),
  occurred_at          TIMESTAMPTZ NOT NULL,
  profile_id           UUID REFERENCES cdp_identity_profiles(profile_id),
  account_id           UUID,
  anonymous_id         TEXT,
  properties           JSONB NOT NULL DEFAULT '{}'
) PARTITION BY RANGE (occurred_at);

-- Monthly partitions (daily is excessive for early scale; monthly allows efficient purge)
CREATE TABLE cdp_events_2026_04 PARTITION OF cdp_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

ALTER TABLE cdp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_events_tenant_isolation ON cdp_events
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_cdp_events_profile ON cdp_events(tenant_id, profile_id, occurred_at DESC);
CREATE INDEX idx_cdp_events_anon ON cdp_events(tenant_id, anonymous_id);
```

**Partitioning rationale:** Monthly range partitioning on `occurred_at` allows efficient DSR purge (drop partition + backfill) and keeps per-partition sizes manageable without the operational overhead of daily partitions at early scale. [ASSUMED — partition cadence should be validated against expected event volume]

### Table: `cdp_consent_states`

```sql
CREATE TABLE cdp_consent_states (
  consent_state_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id           UUID NOT NULL REFERENCES cdp_identity_profiles(profile_id),
  email_marketing      TEXT NOT NULL DEFAULT 'unknown' CHECK (email_marketing IN ('opted_in', 'opted_out', 'unknown')),
  sms_marketing        TEXT NOT NULL DEFAULT 'unknown' CHECK (sms_marketing IN ('opted_in', 'opted_out', 'unknown')),
  whatsapp_marketing   TEXT NOT NULL DEFAULT 'unknown' CHECK (whatsapp_marketing IN ('opted_in', 'opted_out', 'unknown')),
  push_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  legal_basis          TEXT NOT NULL DEFAULT 'unknown' CHECK (legal_basis IN (
    'consent', 'contract', 'legitimate_interest', 'unknown'
  )),
  jurisdiction         TEXT,               -- ISO 3166-1 alpha-2 or NULL
  preference_tags      TEXT[] NOT NULL DEFAULT '{}',
  quiet_hours          TEXT,               -- IANA cron-style or JSON window spec
  source               TEXT,
  source_timestamp     TIMESTAMPTZ,
  deletion_evidence_ref TEXT,             -- set on DSR; row retained for legal defensibility
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cdp_consent_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_consent_tenant_isolation ON cdp_consent_states
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE UNIQUE INDEX idx_cdp_consent_profile ON cdp_consent_states(tenant_id, profile_id);
```

### Table: `cdp_trait_snapshots`

```sql
-- One row per (profile_id, trait_name) — upserted on recompute
CREATE TABLE cdp_trait_snapshots (
  snapshot_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id           UUID NOT NULL REFERENCES cdp_identity_profiles(profile_id),
  trait_name           TEXT NOT NULL,
  value                JSONB NOT NULL,     -- scalar or structured; JSONB for type flexibility
  computed_at          TIMESTAMPTZ NOT NULL,
  source_event_refs    TEXT[] NOT NULL DEFAULT '{}',  -- provenance breadcrumbs
  freshness_mode       TEXT NOT NULL CHECK (freshness_mode IN ('real_time', 'hourly', 'daily')),
  confidence           NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  UNIQUE (tenant_id, profile_id, trait_name)
);

ALTER TABLE cdp_trait_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_traits_tenant_isolation ON cdp_trait_snapshots
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_cdp_traits_profile ON cdp_trait_snapshots(tenant_id, profile_id);
CREATE INDEX idx_cdp_traits_freshness ON cdp_trait_snapshots(freshness_mode, computed_at);
```

**Schema choice — one row per (profile, trait_name):** Preferred over a single JSONB blob per profile because: (a) each trait has independent freshness_mode and confidence, (b) partial recompute can upsert individual trait rows without touching others, (c) source_event_refs per trait is clean, (d) RLS + audit at the trait level is straightforward. [VERIFIED: doc 20 D-14 decision shape]

### Tables: `cdp_audience_definitions`, `cdp_audience_snapshots`, `cdp_audience_snapshot_memberships`

```sql
CREATE TABLE cdp_audience_definitions (
  audience_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  name                 TEXT NOT NULL,
  objective            TEXT,
  entity_type          TEXT NOT NULL CHECK (entity_type IN ('person', 'account')),
  logic_json           JSONB NOT NULL,     -- JSON Logic expression
  freshness_mode       TEXT NOT NULL CHECK (freshness_mode IN ('real_time', 'hourly', 'daily')),
  destination_families TEXT[] NOT NULL DEFAULT '{}',
  created_by           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cdp_audience_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_audiences_tenant_isolation ON cdp_audience_definitions
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE TABLE cdp_audience_snapshots (
  snapshot_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  audience_id          UUID NOT NULL REFERENCES cdp_audience_definitions(audience_id),
  computed_at          TIMESTAMPTZ NOT NULL,
  membership_count     INTEGER NOT NULL,
  suppression_count_at_snapshot INTEGER NOT NULL DEFAULT 0,
  actor_id             TEXT NOT NULL,      -- agent or operator who triggered compute
  evidence_ref         TEXT,
  frozen               BOOLEAN NOT NULL DEFAULT TRUE  -- always true; field is intent documentation
);

ALTER TABLE cdp_audience_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_snapshots_tenant_isolation ON cdp_audience_snapshots
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE TABLE cdp_audience_snapshot_memberships (
  membership_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  snapshot_id          UUID NOT NULL REFERENCES cdp_audience_snapshots(snapshot_id),
  profile_id           UUID NOT NULL REFERENCES cdp_identity_profiles(profile_id),
  included_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cdp_audience_snapshot_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdp_memberships_tenant_isolation ON cdp_audience_snapshot_memberships
  USING (tenant_id = current_setting('app.active_tenant_id')::UUID);

CREATE INDEX idx_cdp_memberships_snapshot ON cdp_audience_snapshot_memberships(tenant_id, snapshot_id);
CREATE INDEX idx_cdp_memberships_profile ON cdp_audience_snapshot_memberships(tenant_id, profile_id);
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audience logic DSL | Custom SQL parser or regex-on-string rules | JSON Logic (`json-logic-js`) | See DSL section below for full rationale |
| PII identity value storage | Raw email/phone in `cdp_identity_links` | SHA-256 hash in `identity_value_hash` | Cross-tenant leak risk; matching works on hash; raw value stays in `cdp_identity_profiles.primary_email` only |
| Parallel identity graph | New graph database or neo4j-style adjacency tables | Extend current `cdp_identity_links` table with graph resolution logic | Current `createIdentityLink` pattern is production-tested; graph queries are simple enough for Postgres with good indexes |
| Consent storage per channel | Channel-local consent flags in email/SMS/push tables | Single `cdp_consent_states` row per profile | D-13: every downstream engine MUST read the same SOR |
| Custom soft-match scorer | Rewrite scoring logic | Reuse `scoreIdentityCandidate` from `lib/markos/crm/identity.ts` as-is | Production weights (0.65/0.15/0.10/0.10/0.15) are working; only add hard-match layer on top |
| Partition management | Custom archival scripts | Postgres declarative partitioning on `cdp_events` | Partition pruning handles large event tables efficiently; DSR purge = drop partition |

---

## Slice Boundaries

### Proposed Slices (from DISCUSS.md, validated against dependency graph)

| Slice | Name | Purpose | Wave |
|-------|------|---------|------|
| **221-01** | Identity Graph Core | Migrations 101; `cdp_identity_profiles` + `cdp_identity_links`; `canonical_identity_id` FK on CRM entities; `lib/markos/cdp/identity/*`; hard/soft merge logic; merge review inbox (reuse merge.cjs); F-106, F-107; RLS tests | Wave 1 |
| **221-02** | Consent SOR and Shim | Migration 102 (consent table); `lib/markos/cdp/consent/*`; ConsentState CRUD; `evaluateOutboundEligibility` shim (ConsentState-first + legacy fallback); consent drift audit cron; F-109 | Wave 2 |
| **221-03** | Event Normalization and Dual-Write | Migration 102 (cdp_events table + partitioning); `lib/markos/cdp/events/*`; dual-write in ingest.js + identify.js; Migration 103; `lib/markos/cdp/traits/*`; TraitSnapshot upsert; freshness TTL; F-108, F-110 | Wave 2 (parallel with 221-02) |
| **221-04** | Audience Definition and Snapshot | Migration 104; `lib/markos/cdp/audiences/*`; AudienceDefinition CRUD; AudienceSnapshot compute; JSON Logic DSL evaluator; double-gate activation helper; audience snapshot audit log; F-111, F-112 | Wave 3 |
| **221-05** | Read-Through Adapter, API, and MCP Surface | `lib/markos/cdp/adapters/crm-projection.ts`; `GET /v1/cdp/profiles/*`, `GET /v1/cdp/consent/*`, `GET /v1/cdp/audiences/*`; MCP tools `get_unified_profile`, `get_consent_state`; Migration 105 (deletion_evidence_ref + audit extensions) | Wave 3 (parallel with 221-04) |
| **221-06** | Deletion, Testing, and Observability Closure | `lib/markos/cdp/deletion/*` (tombstone + cascade); DSR export contract; deletion cascade tests; full RLS test suite for all 8 new tables; Playwright smoke for merge review inbox + consent drift audit; regression tests for CRM timeline/attribution with CDP adapter | Wave 4 |

### Dependency Graph

```text
Wave 1: [221-01] — MUST complete first; provides schema foundation
   |
Wave 2: [221-02] || [221-03] — parallel; both depend on 221-01 schema
   |
Wave 3: [221-04] || [221-05] — parallel; 221-04 depends on 221-01 schema;
         221-05 depends on 221-01 schema + at least stub trait/consent tables from Wave 2
   |
Wave 4: [221-06] — depends on all prior slices; gate before phase close
```

**Wave 2 parallelism constraint:** 221-02 and 221-03 share Migration 102 (one file creates both `cdp_events` and `cdp_consent_states`). The planner should either put both tables in Migration 102 (run once) or split into 102a/102b with explicit ordering. Recommended: one Migration 102 file with both tables to avoid migration ordering ambiguity.

---

## Integration Contracts

### 1. CRM Read-Through Adapter

**File:** `lib/markos/cdp/adapters/crm-projection.ts`

```typescript
// Consumed by: lib/markos/crm/timeline.ts, lib/markos/crm/attribution.ts
// Called by: CRM entity reads (P222 will wire this more deeply)
export async function getProfileForContact(
  tenantId: string,
  contactId: string
): Promise<CDPProjection | null>

export interface CDPProjection {
  canonical_identity_id: string | null;
  consent_state: ConsentStateSummary | null;
  traits: TraitSnapshotSummary[];
  profile_type: 'person' | 'account' | null;
  lifecycle_state: string | null;
}
```

**Wire-up:** CRM timeline and attribution do not change their internal logic. The adapter is called by the CRM API layer before building the timeline payload. P222 will replace the CRM entity's primary identity lookup with this adapter as the truth source.

### 2. Consent Shim

**File:** `lib/markos/outbound/consent.ts` (modified in-place; module boundary preserved)

The `evaluateOutboundEligibility` function gets a new ConsentState read-first branch. The function signature stays identical — no callers break. The shim is activated by the presence of `cdp_consent_states` data; legacy fallback remains for contacts with no CDP profile yet.

### 3. Dual-Write Ingest

**File:** `api/tracking/ingest.js` and `api/tracking/identify.js` (modified in-place)

Public HTTP contract: unchanged. Internal change: after `appendCrmActivity(store, entry.activity)` succeeds, also call `insertCdpEvent(cdpPayload)`. The dual-write must succeed or fail atomically within the request — do not accept 202 if the CDP write fails. During P221 transition, `cdp_events` failures should NOT silently suppress the CRM write; log + alert but allow the CRM write to succeed (grace mode, reported via consent drift audit pattern).

### 4. SaaS Bridge (P214)

**Consumer:** P214 SaaS Suite reads `IdentityProfile` via `getProfileForContact`. No additional adapter needed — same `crm-projection.ts` function, called from SaaS identity resolution path. The adapter returns `canonical_identity_id` which P214 stores as the CDP reference.

### 5. AgentRun Audit Tie-In (P207 bridge)

For trait recompute tasks, emit to `markos_agent_runs` with:

```json
{
  "run_type": "cdp_trait_recompute",
  "trigger": "cron:hourly",
  "tenant_id": "<id>",
  "metadata": { "freshness_mode": "hourly", "profile_count": 42 }
}
```

This keeps trait recompute audit-visible through P207's existing run substrate without blocking P221 on P207 being fully built.

---

## Audience Logic DSL Recommendation

### Decision: JSON Logic (`json-logic-js`)

**Recommendation:** Use JSON Logic for `logic_json` stored in `cdp_audience_definitions`.


#### Rationale


| Criterion | JSON Logic | Custom AST | Postgres-native SQL WHERE |
|-----------|-----------|------------|--------------------------|
| Tenant safety (no SQL injection) | HIGH — pure data, evaluated in JS | HIGH — controlled parser | LOW — SQL strings stored in DB are injection vectors |
| Agent explainability (doc 20 rule 4) | HIGH — structured JSON, diffable, readable | MEDIUM — AST requires custom renderer | LOW — raw SQL strings are opaque to agents |
| Library maturity | HIGH — `json-logic-js` is MIT, 5k GitHub stars, stable API | LOW — hand-rolled | HIGH — but disqualified on tenant safety |
| Trait-based conditions | NATIVE — `{">=": [{"var": "traits.intent_score"}, 0.7]}` | Possible but requires schema | Possible but tenant-unsafe |
| Consent/jurisdiction conditions | NATIVE | Possible | Possible |
| Cross-tenant sharing | SAFE — no executable code | SAFE | RISKY |
| Debugging / audit | EASY — log the JSON, step through evaluator | MEDIUM | HARD |


#### Rejected Approaches

- `sqlfluff`-parsed SQL-subset: Storing partial SQL strings in the DB is an injection risk even with a parser layer, and the SQL dialect cannot reference CDP trait objects without special translation.
- Postgres-native (rules as SQL WHERE): Cannot guarantee tenant isolation when expressions reference cross-table joins. A malicious or misconfigured rule could read other tenants' data.


#### Implementation Pattern


```typescript
// lib/markos/cdp/audiences/dsl.ts
import * as jsonLogic from 'json-logic-js';

export function evaluateAudienceMembership(
  logicJson: object,
  profileData: ProfileContext
): boolean {
  return jsonLogic.apply(logicJson, {
    traits: profileData.traits,
    consent: profileData.consent,
    lifecycle_state: profileData.lifecycle_state,
    mode: profileData.mode,
  });
}
```

**Note:** `json-logic-js` has no native Supabase Edge Function equivalent — evaluation runs in the Node.js API layer (existing pattern). For real-time audience membership on ingest events, the DSL evaluator is called during `cdp_events` dual-write. For batch snapshot compute (hourly/daily), the evaluator iterates over profiles in a cron task.

[ASSUMED — json-logic-js npm version should be verified before plan is written; use `npm view json-logic-js version` at plan time]

---

## Trait Recompute Infrastructure Recommendation

### Decision: Vercel Cron + markos_agent_runs audit bridge

**Situation:** P207 (AgentRun v2 Orchestration Substrate) is on the dependency list and planned-not-built. P221 cannot block on P207 being complete, but must not build an incompatible execution primitive.

**Recommendation:** Use Vercel Cron functions (already in use for consent shim drift audit and other cron work in the repo) as the scheduler. Each cron invocation:
1. Queries profiles needing recompute by freshness_mode + computed_at staleness window.
2. Runs the trait computation logic in the cron handler.
3. Upserts `cdp_trait_snapshots` rows.
4. Writes an `markos_agent_runs` row with `run_type: 'cdp_trait_recompute'` for audit/P207 compatibility.


#### Freshness Windows

- `real_time`: Triggered inline on event ingest (synchronous in dual-write path, lightweight computation only — intent signal updates, last_seen_at updates). Not a cron.
- `hourly`: Vercel Cron `0 * * * *` (every hour) — lifecycle/activation traits.
- `daily`: Vercel Cron `0 6 * * *` (6am UTC daily) — fit/persona/churn-risk traits.

**P207 compatibility path:** When P207 ships its full AgentRun v2 substrate, the cron handler bodies become AgentRun task definitions. The `markos_agent_runs` audit rows written by P221 crons use the same schema, making the migration a handler-swap with no data loss.


#### Rejected Alternatives

- Supabase scheduled functions (`pg_cron`): Not available in Supabase free/pro without add-on; prefer Vercel Cron for consistency with existing patterns. [ASSUMED — verify pg_cron availability on current Supabase plan]
- Vercel Queues: Preferred for fan-out per-profile work, but adds complexity in P221 where the profile count is low. Introduce in P222 when CRM fan-out justifies queuing.

---

## Common Pitfalls

### Pitfall 1: Dual-Write Race on ingest.js

**What goes wrong:** The dual-write adds an async `cdp_events` insert after the synchronous `appendCrmActivity`. Under concurrent ingest, the CDP insert may lag or fail while the CRM write succeeds, creating silent divergence between `crm_activity` and `cdp_events`.

**Why it happens:** `appendCrmActivity` is synchronous (in-memory store or fast Supabase write); the CDP insert is async and slower (new table, partitioned, indexed).

**How to avoid:** Wrap both writes in a transactional boundary or use the `source_event_ref` as a reconciliation key. At phase close, run a drift reconciliation query: `crm_activity rows without matching cdp_events event_id` = ingest gap. Alert if > 0.1% divergence.

**Warning signs:** `crm_activity` count diverges from `cdp_events` count for the same `tenant_id` + time window.

### Pitfall 2: Merge Deadlock in Concurrent Review

**What goes wrong:** Two concurrent review operations on the same profile pair both call `recordMergeDecision` with conflicting `canonical_record_id` values, resulting in two accepted merge decisions with conflicting lineage.

**Why it happens:** The current `merge.cjs` pattern is stateless and in-memory; concurrency control is not built in.

**How to avoid:** Add a `SELECT FOR UPDATE` lock on `cdp_identity_links` rows before recording a merge decision. Alternatively, use a database-level uniqueness constraint: only one `accepted` link per `(profile_id, identity_value_hash)` pair.

**Warning signs:** Same `profile_id` appears in two different `merge_decision_id` lineage rows both with `decision_state = 'accepted'`.

### Pitfall 3: Consent Drift During Migration Window

**What goes wrong:** During the P221 migration window, `ConsentState` says `opted_in` but `outboundConsentRecords` says `opted_out` (or vice versa) because a legacy opt-out was recorded after the initial ConsentState seeding.

**Why it happens:** The consent shim writes to `ConsentState` going forward, but existing systems may still write to `outboundConsentRecords` (e.g., webhook-received unsubscribes from email providers).

**How to avoid:** The consent drift audit cron (D-26) diffs the two stores daily and emits an operator task on divergence. When divergence is detected, the `evaluateOutboundEligibility` shim must fail-closed (deny the send) until an operator resolves the conflict.

**Warning signs:** Consent drift audit cron emits tasks more than sporadically; indicates the legacy pathway is still writing consent state.

### Pitfall 4: Audience Snapshot Staleness vs Re-validation Cost

**What goes wrong:** An `AudienceSnapshot` computed at T-6h has `membership_count = 1000`. At dispatch time (T), 200 of those profiles have opted out of the channel. The double-gate catches this, but the dispatch loop now re-validates 1000 profiles synchronously, causing send latency or timeout.

**Why it happens:** Snapshot compute is optimistic; consent changes are not propagated into existing frozen snapshots (by design).

**How to avoid:** The dispatch system (P223) should paginate consent re-validation in batches of 100-200 profiles, not validate all 1000 synchronously. P221's `lib/markos/cdp/audiences/activation.ts` should expose a `validateBatch(profileIds[], channel)` function that returns eligible subset. Document this as the expected consumer pattern.

**Warning signs:** Audience snapshot `membership_count` / actual send count ratio drops below 0.6 consistently (40%+ suppression rate at dispatch time indicates consent data is stale at snapshot compute time).

### Pitfall 5: Deletion Cascade Race with In-Flight Events

**What goes wrong:** A DSR deletion tombstones a `cdp_identity_profiles` row and starts cascading purge of `cdp_events`. Simultaneously, a late-arriving event for the same profile's `anonymous_id` is ingested and linked to the now-tombstoned profile.

**Why it happens:** The dual-write path resolves `anonymous_id → profile_id` before checking tombstone status. The FK to `cdp_identity_profiles` allows inserts even for tombstoned profiles if the FK itself isn't enforced via check.

**How to avoid:** Add a tombstone check in the dual-write path: before writing a `cdp_events` row with a `profile_id`, query `cdp_identity_profiles` to verify `tombstoned = FALSE`. If tombstoned, write the event with `profile_id = NULL` and `anonymous_id` only (no PII linkage). Log for DSR compliance review.

**Warning signs:** `cdp_events` rows appear after the `deletion_evidence_ref` timestamp for a tombstoned profile.

### Pitfall 6: Overloading `lib/markos/contracts/schema.ts::Segment`

**What goes wrong:** A plan file adds `logic_json`, `freshness_mode`, or `destination_families` to the existing `Segment` type, conflating CDP audiences with brand-taxonomy segments.

**Why it happens:** Both use the word "segment"; the existing type is visible and tempting to extend.

**How to avoid:** D-17 is explicit — CDP audiences live exclusively in `lib/markos/cdp/audiences/*`. The existing `Segment` type must not be touched. Tests should verify that `AudienceDefinition` and `Segment` are separate types with no shared imports.

---

## Tests Implied (per Slice)

### Slice 221-01: Identity Graph Core

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-identity/cdp-profile-crud.test.ts` | Vitest | Profile create/read/tombstone; tenant isolation; `profile_type` enum enforcement |
| `test/cdp-identity/cdp-identity-link.test.ts` | Vitest | Hard-match auto-accept (confidence=1.0); soft-match weights match `scoreIdentityCandidate`; review threshold 0.40-0.79; reject < 0.40 |
| `test/cdp-identity/cdp-merge-review.test.ts` | Vitest | Merge decision immutability; lineage preservation; review-first UX; concurrent merge guard |
| `test/cdp-identity/cdp-identity-rls.test.ts` | Vitest | Cross-tenant isolation for `cdp_identity_profiles` + `cdp_identity_links`; fail-closed on missing tenant context |
| `test/crm-schema/crm-canonical-identity-fk.test.ts` | Vitest | `canonical_identity_id` FK backfill migration idempotency; FK constraint enforcement |
| `test/crm-identity/cdp-merge-inbox.test.ts` (extend) | Playwright | Merge review inbox renders CDP evidence panel; accept/reject flows route to `markos_audit_log` |

### Slice 221-02: Consent SOR and Shim

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-consent/cdp-consent-state.test.ts` | Vitest | ConsentState CRUD; channel enum enforcement; `deletion_evidence_ref` retention after tombstone |
| `test/cdp-consent/cdp-consent-shim.test.ts` | Vitest | Shim reads ConsentState first; legacy fallback on miss; fail-closed when divergence detected; WhatsApp window rule preserved |
| `test/cdp-consent/cdp-drift-audit.test.ts` | Vitest | Drift audit identifies mismatches; generates operator task on divergence; no false-positives when both stores agree |
| `test/cdp-consent/cdp-consent-rls.test.ts` | Vitest | Cross-tenant isolation on `cdp_consent_states` |
| `test/crm-outbound/consent-shim-regression.test.ts` (extend) | Vitest | All existing consent tests pass with shim in place; opt-out/opted-in/unknown statuses preserved |

### Slice 221-03: Event Normalization and Dual-Write

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-events/cdp-event-envelope.test.ts` | Vitest | Envelope shape; `event_domain` enum; `event_id` deduplication (idempotent insert) |
| `test/cdp-events/cdp-dual-write.test.ts` | Vitest | Both `crm_activity` + `cdp_events` written on ingest; failure in CDP write does not suppress CRM write (grace mode); `source_event_ref` matches across both |
| `test/cdp-events/cdp-events-rls.test.ts` | Vitest | Cross-tenant isolation on `cdp_events` |
| `test/cdp-traits/cdp-trait-snapshot.test.ts` | Vitest | Trait upsert; `source_event_refs[]` populated; freshness_mode classification; confidence clamped 0-1 |
| `test/cdp-traits/cdp-trait-freshness.test.ts` | Vitest | Recompute is skipped when `computed_at` is within TTL; triggered when stale |
| `test/tracking/cdp-tracking-regression.test.ts` (extend) | Vitest | All existing `test/tracking/` tests pass with dual-write added; public API response unchanged |

### Slice 221-04: Audience Definition and Snapshot

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-audiences/cdp-audience-definition.test.ts` | Vitest | AudienceDefinition CRUD; `entity_type` enum; `destination_families` validation |
| `test/cdp-audiences/cdp-audience-dsl.test.ts` | Vitest | JSON Logic evaluator correctly includes/excludes profiles by trait; jurisdiction condition; consent condition |
| `test/cdp-audiences/cdp-audience-snapshot.test.ts` | Vitest | Snapshot is immutable after freeze; `membership_count` matches actual membership rows; audit row written per compute |
| `test/cdp-audiences/cdp-activation-gate.test.ts` | Vitest | Double-gate: snapshot membership alone does not allow send; live consent re-validation required; opted-out profiles excluded at dispatch |
| `test/cdp-audiences/cdp-audience-rls.test.ts` | Vitest | Cross-tenant isolation on all three audience tables |

### Slice 221-05: Read-Through Adapter, API, and MCP Surface

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-adapters/crm-projection.test.ts` | Vitest | `getProfileForContact` returns CDP projection; null on tombstoned profile; timeline/attribution behavior unchanged |
| `test/crm-timeline/cdp-timeline-regression.test.ts` (extend) | Vitest | `buildCrmTimeline` produces same output with CDP adapter in place; stitched-label projection rule preserved |
| `test/crm-reporting/cdp-attribution-regression.test.ts` (extend) | Vitest | `buildWeightedAttributionModel` review-exclusion rule preserved; CDP adapter does not break attribution weights |
| `test/api-contracts/cdp-profiles-api.test.ts` | Vitest | `GET /v1/cdp/profiles/{id}` returns F-106 contract shape; 403 on cross-tenant; 404 on tombstoned |
| `test/api-contracts/cdp-consent-api.test.ts` | Vitest | `GET /v1/cdp/consent/{profile_id}` returns F-109 contract shape; tenant-scoped |
| `test/api-contracts/cdp-audiences-api.test.ts` | Vitest | `GET /v1/cdp/audiences/{id}` + snapshot reads return F-111/F-112 shapes |
| `test/agents/cdp-mcp-tools.test.ts` | Vitest | `get_unified_profile` + `get_consent_state` MCP tool response shapes; tenant isolation; no PII in MCP payloads |
| `test/cdp-api/cdp-profiles-route.test.ts` | Playwright | `GET /v1/cdp/profiles?query=` authenticated flow; forbidden on wrong tenant; tombstone returns 404 |

### Slice 221-06: Deletion, Testing, and Observability Closure

| File | Framework | What It Proves |
|------|-----------|----------------|
| `test/cdp-deletion/cdp-tombstone.test.ts` | Vitest | Tombstone scrubs PII columns; `deletion_evidence_ref` set; `profile_id` preserved for FK integrity |
| `test/cdp-deletion/cdp-cascade.test.ts` | Vitest | Cascade purges `cdp_events`, `cdp_trait_snapshots`, `cdp_audience_snapshot_memberships`; ConsentState retained with `deletion_evidence_ref` |
| `test/cdp-deletion/cdp-deletion-race.test.ts` | Vitest | Late-arriving ingest event after tombstone writes with `profile_id = NULL` (no PII linkage) |
| `test/cdp-deletion/cdp-dsr-export.test.ts` | Vitest | DSR export contract shape matches D-25; includes all required record families |
| `test/tenant-auth/cdp-rls-complete.test.ts` | Vitest | Full RLS suite for all 8 new tables in one run; cross-tenant denial on each table type |
| `test/cdp-operator/merge-review-ui.test.ts` | Playwright | Merge review inbox renders; accept/reject buttons route to audit log; CDP evidence panel visible |
| `test/cdp-operator/consent-drift-ui.test.ts` | Playwright | Consent drift audit surface displays divergence tasks; fail-closed indicator visible |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (business logic) | Node.js `--test` (existing) + Vitest (new phase doctrine, V4.0.0-TESTING-ENVIRONMENT-PLAN) |
| Framework (browser journeys) | Playwright |
| Framework (visual regression) | Chromatic via Storybook |
| Vitest config | `vitest.config.ts` (Wave 0 gap — must be created in 221-06 or as Wave 0 of 221-01) |
| Quick run command | `vitest run --reporter=verbose test/cdp-*` |
| Full suite command | `npm test && vitest run` |
| Phase gate | Full Vitest + Playwright suite green before `/gsd-verify-work` |

### Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 221-01 | Identity scoring, merge decision immutability | RLS isolation, FK constraints | F-106, F-107 shape | CRM identity-link tests still pass | Cross-tenant denial, tombstone rejection | Merge review inbox | Merge review inbox states |
| 221-02 | ConsentState CRUD, shim decision tree | Drift audit cron output | F-109 shape | All existing consent.ts tests pass | Opt-out fail-closed, ambiguous deny | Consent drift surface | Drift audit alert, resolved states |
| 221-03 | Event envelope normalization, trait upsert | Dual-write both tables, partition insert | F-108, F-110 shape | All tracking tests pass, timeline unchanged | Tombstoned profile ingest, duplicate event_id | n/a | n/a |
| 221-04 | JSON Logic DSL evaluation, snapshot freeze | Audience compute end-to-end | F-111, F-112 shape | n/a | Opted-out member excluded at activation gate | n/a | Audience snapshot log |
| 221-05 | Adapter null/tombstone return, API route shape | MCP tool tenant isolation | All 7 F-ID OpenAPI contracts | Timeline + attribution regression with CDP adapter | Cross-tenant profile read denied, tombstoned 404 | CDP profile GET flow | Profile empty, tombstoned, forbidden |
| 221-06 | Cascade purge completeness, DSR export shape | Full 8-table RLS suite | DSR export shape | All prior regression suites green | Late-arriving event after tombstone | Merge inbox + drift audit flows | Final operator surface states |

### Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 8 new tables) | 100% of tables tested | SOC2 Type I baseline; every table must have a cross-tenant denial test |
| Business logic (merge/consent/DSL/tombstone) | 100% of decision branches | Identity and consent are compliance-critical; no uncovered branches |
| API contract shape (F-106..F-112) | 100% of fields | OpenAPI parity required by QA-01 |
| Regression (CRM timeline, attribution, consent) | 100% of existing test files pass | CDP is additive; any failure = regression |
| Negative-path (cross-tenant, tombstone, opt-out) | Min 2 negative-path tests per object type | Fail-closed posture must be actively proven |

### Fixture and Seed Data Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `cdpPersonProfile` | One person profile per mode (b2b/b2c/plg_b2b) | 221-01..05 tests |
| `cdpAccountProfile` | One account profile | 221-01..05 tests |
| `cdpTombstonedProfile` | Profile with `tombstoned=true` + `deletion_evidence_ref` | 221-06 cascade tests |
| `cdpConsentStateOptedIn` | All channels opted_in, legal_basis=consent | 221-02..04 tests |
| `cdpConsentStateOptedOut` | email_marketing=opted_out | 221-02 shim tests |
| `cdpConsentStateDrifted` | ConsentState says opted_in, outboundConsentRecords says opted_out | 221-02 drift audit tests |
| `cdpEventBatch` | 10 synthetic events across 3 domains | 221-03 dual-write tests |
| `cdpTraitSet` | intent_score, lifecycle_state, churn_risk per mode | 221-03..04 trait/audience tests |
| `cdpAudienceDefinition` | JSON Logic rule: `{">=": [{"var":"traits.intent_score"}, 0.7]}` | 221-04 DSL tests |
| `cdpFrozenSnapshot` | AudienceSnapshot with 5 membership rows | 221-04..05 activation tests |
| `crossTenantContext` | Two separate tenants, same profile_id (impossible) | 221-01..05 RLS tests |

Fixtures live in `test/fixtures/cdp/` and are importable from all CDP test files.

### Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture as follows:
- Identity merge criteria: "Verified by `cdp-identity-link.test.ts` hard/soft merge cases and `cdp-merge-review.test.ts` immutability test."
- Consent shim criteria: "Verified by `cdp-consent-shim.test.ts` ConsentState-first path and legacy-fallback path."
- RLS criteria: "Verified by `cdp-rls-complete.test.ts` cross-tenant denial on all 8 new tables."
- Regression criteria: "Verified by `cdp-tracking-regression.test.ts`, `cdp-timeline-regression.test.ts`, `cdp-attribution-regression.test.ts` — all green."

### Wave 0 Gaps

- [ ] `vitest.config.ts` — root Vitest config (unless already created by P204/P205)
- [ ] `test/fixtures/cdp/` — CDP fixture factory directory
- [ ] `test/fixtures/cdp/profiles.ts` — `cdpPersonProfile`, `cdpAccountProfile`, `cdpTombstonedProfile`
- [ ] `test/fixtures/cdp/consent.ts` — consent state fixtures (opted-in, opted-out, drifted)
- [ ] `test/fixtures/cdp/events.ts` — event batch fixtures
- [ ] `test/fixtures/cdp/audiences.ts` — audience definition + snapshot fixtures

---

## Requirement Mapping

| Req ID | Satisfied By | How |
|--------|-------------|-----|
| CDP-01 | 221-01, 221-03 | `cdp_identity_profiles` + `cdp_identity_links` + `cdp_events` unify profile, event, and source facts |
| CDP-02 | 221-01 | Hard/soft merge with confidence; immutable lineage; merge review inbox; operator-visible evidence |
| CDP-03 | 221-04 | `AudienceDefinition` + `AudienceSnapshot` governance; double-gate dispatch re-validation |
| CDP-04 | 221-03, 221-05 | Dual-write flows events to `cdp_events`; read-through adapter feeds CRM timeline/attribution; TraitSnapshot feeds downstream engines |
| CDP-05 | 221-02, 221-06 | `ConsentState` SOR; consent shim; DSR tombstone cascade; ConsentState retention on deletion |
| RUN-01 | 221-03, 221-05 | Trait recompute cron writes `markos_agent_runs` rows; MCP tools consume same run substrate |
| RUN-02 | 221-03 | `markos_agent_runs` row for each trait recompute batch includes trigger, tenant, profile count |
| RUN-03 | 221-03 | Cron-based recompute is stateless per wave; compatible with P207 DAG migration path |
| RUN-04 | 221-01, 221-02 | Merge review tasks are P1; consent drift alerts P1; audience compute P2 in run priority system |
| RUN-05 | 221-02, 221-03 | Consent drift creates operator task; dual-write failures log for reconciliation |
| RUN-06 | 221-01, 221-03 | Dual-write idempotent via `event_id` PK; merge decisions are review-first (approval-aware) |
| RUN-07 | 221-05 | `get_unified_profile` + `get_consent_state` MCP tools read same CDP tables as API |
| RUN-08 | 221-01, 221-06 | `markos_audit_log` hash chain captures all merge/consent/audience/deletion events |
| EVD-01 | 221-03 | `TraitSnapshot.source_event_refs[]` + `computed_at` + `freshness_mode` + `confidence` = EvidenceMap integration |
| EVD-02 | 221-04 | Audience double-gate: snapshot membership + live consent re-validation blocks dispatch |
| EVD-03 | 221-03 | Trait `confidence` field; `source_event_refs[]` traces trait to raw `cdp_events` |
| EVD-04 | 221-03 | TraitSnapshot freshness_mode controls recompute cadence (real_time/hourly/daily TTL) |
| EVD-05 | 221-01 | Merge review inbox shows confidence breakdown + signal chain + `source_event_ref` trail |
| EVD-06 | n/a in P221 | Pricing/competitor traits are out of scope for P221 trait family |
| QA-01 | 221-01..05 | 7 new F-IDs allocated (F-106..F-112); registered in `contracts/flow-registry.json` |
| QA-02 | 221-01..06 | RLS on all 8 new tables; tested per table; `markos_audit_log` hash chain extended |
| QA-03..15 | 221-06 | Vitest business logic coverage; Playwright operator workflow proof; Chromatic visual states |

---

## Scope Guardrails (Non-Goals for P221)

The following are explicitly OUT OF SCOPE for P221. Plans MUST NOT implement them — they belong to the phases listed.

| What | Why Not P221 | Lands In |
|------|-------------|----------|
| CRM 360 customer record rewrite, timeline-first workspace | P221 adds only `canonical_identity_id` FK to CRM; full rewrite breaks CRM stability | P222 |
| Native email / SMS / WhatsApp / push dispatch | ConsentState is the SOR and the shim; actual send execution must not be added | P223 |
| Full ConsentState mutation API (public write) | Write APIs land with the engine that dispatches; P221 ships read-only + shim only | P223 |
| Conversion surfaces (landing pages, forms, CTAs) | No P221 dependency; form-submitted signal feeds identity scoring but form creation is separate | P224 |
| Semantic attribution / journey analytics / narrative intelligence | `cdp_events` feeds the analytics semantic layer; P221 does not build the layer | P225 |
| Sales enablement (battlecards, proposals, deal-execution) | Reads CDP profile; build after profile is stable | P226 |
| Ecosystem / partner / affiliate / referral / community | Reads CDP events; build after event stream is stable | P227 |
| Commercial OS integration closure | Cross-engine contract audit and provider replaceability | P228 |
| Workspace + household `profile_type` | v1 ships `person` or `account` only; enum accepts extension but ingest does not emit | P218 / P225 |
| Full CDP dashboard (identity graph viewer, trait explorer, preference center) | P221 ships merge review inbox + consent drift audit + audience snapshot log only | P222 / P225 |
| CDP agent family (CDP-01 Identity Resolver, CDP-02 Trait Compiler, CDP-03 Audience Builder, CDP-04 Consent Guardian) registered with AgentRun v2 | Agent registration requires P207 to be complete; P221 defines the substrate they will run on | P222+ |
| Cross-tenant anonymized trait aggregation | P212 Learning and Literacy boundary; requires approved LiteracyUpdateCandidate flow | P212 / P228 |
| Audience write APIs (create, update, compute trigger) via public REST | Mutations are tenant-operator UI + review in P221; public write APIs land with P223 dispatching engine | P223 |
| DSR export automation (full pipeline) | P221 defines the export contract shape; automation of bulk DSR processing is a P228 closure item | P228 |

---

## Research Decisions

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| F-ID range for CDP contracts | F-106 through F-112 | Next 7 after F-105 (highest confirmed existing ID) |
| Migration numbers | 101 through 105 | Next 5 after 100 (last confirmed migration) |
| Trait storage shape | One row per (profile_id, trait_name) in `cdp_trait_snapshots` | Independent freshness_mode, partial recompute, clean provenance per trait |
| Event partitioning | Monthly range on `occurred_at` | DSR purge = drop partition; daily partitions add operational overhead at early scale |
| Audience DSL | JSON Logic (`json-logic-js`) | Tenant-safe, agent-readable, no SQL injection risk |
| Trait recompute infra | Vercel Cron + `markos_agent_runs` audit bridge | Existing cron pattern; P207-compatible migration path |
| ConsentState retention on DSR | Retain row with `deletion_evidence_ref`, scrub PII fields | Legal defensibility of suppression; future re-contact must fail-closed |
| CDP module structure | `lib/markos/cdp/` with 7 sub-modules | Clean namespace; orthogonal to `lib/markos/crm/` and `lib/markos/outbound/` |
| CRM schema changes in P221 | `canonical_identity_id` FK column only on entity tables | Full CRM rewrite is P222; additive-only in P221 |
| Dual-write failure mode | Grace mode (CDP failure logs + alerts; CRM write succeeds) | Prevents CDP from becoming a CRM availability dependency during transition |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Monthly partitioning is appropriate for `cdp_events` at current scale | Schema Sketches | If event volume is already high (>10M/month), daily partitions may be needed sooner |
| A2 | `json-logic-js` is the best available npm package for this DSL | Audience Logic DSL | If a better maintained alternative exists, DSL shape may need adjustment |
| A3 | Vercel Cron is available at current plan tier for 3 additional cron jobs | Trait Recompute | If cron limit exceeded, need Supabase pg_cron or Vercel Queues instead |
| A4 | `pg_cron` is NOT available on current Supabase plan | Trait Recompute | If available, it could replace Vercel Cron for trait recompute |
| A5 | CRM entity tables are named `crm_contacts`, `crm_companies`, `crm_accounts`, `crm_customers` | Schema Sketches | If actual table names differ (seen in migration 58), FK DDL must be adjusted |
| A6 | `vitest.config.ts` does not yet exist (from testing plan audit) | Validation Architecture | If already created by P204 execution, Wave 0 gap is satisfied |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Postgres (RLS, migrations) | All tables | ✓ | via supabase/migrations | — |
| Vercel Cron | Trait recompute (hourly/daily) | ✓ [ASSUMED] | Vercel Pro | Supabase pg_cron if available |
| `json-logic-js` npm package | Audience DSL evaluator | ✗ (not in package.json) | TBD — verify at plan time | Custom simple AST as fallback |
| Vitest | New test doctrine (P204+) | ✗ (not yet installed) | TBD — install in Wave 0 | node --test for existing paths |
| Playwright | Browser workflow tests | ✗ (not yet installed) | TBD — install in Wave 0 | Manual QA only (not acceptable for GA) |


No-fallback blockers:
- `json-logic-js`: Must be installed before audience DSL work in 221-04. Verify npm availability and license (MIT) at plan time.


Has-fallback items:
- Vitest, Playwright: node --test remains valid for existing paths; new CDP tests should target Vitest. Plan should include `npm install -D vitest playwright` in Wave 0.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase JWT `active_tenant_id` claim; all CDP routes require auth |
| V3 Session Management | partial | Reuse existing session substrate; no new session surfaces in P221 |
| V4 Access Control | yes | RLS on all 8 new tables; fail-closed on missing tenant context (D-06) |
| V5 Input Validation | yes | Event envelope: `event_domain` enum check; `profile_type` enum; `link_status` enum; all string fields trimmed and length-bounded |
| V6 Cryptography | yes | `identity_value_hash` uses SHA-256 of identity values; no raw PII in `cdp_identity_links`; no raw PII in MCP payloads (D-28) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant profile read | Information Disclosure | RLS policy on all CDP tables; fail-closed on missing `active_tenant_id` |
| Merge decision injection (forged `source_event_ref`) | Tampering | `source_event_ref` must reference a real `cdp_events.event_id`; validate existence before accepting merge decision |
| Consent bypass (direct DB write bypassing shim) | Elevation of Privilege | All consent mutations go through `lib/markos/cdp/consent/state.ts` which emits audit log; operator UI is the only write path in P221 |
| PII leak via `identity_value_hash` reversal | Information Disclosure | SHA-256 is one-way; salt per tenant to prevent rainbow table attacks [ASSUMED — verify salt strategy] |
| Audience snapshot poisoning | Tampering | Snapshots are append-only (no UPDATE/DELETE on `cdp_audience_snapshots`); audit row per compute |
| DSR deletion race (re-linking tombstoned profile) | Tampering | Dual-write path checks `tombstoned` before writing `profile_id`; linkage to tombstoned profile rejected |

---

## Sources

### Primary (HIGH confidence)
- `lib/markos/crm/identity.ts` [VERIFIED: codebase] — Exact weights (0.65/0.15/0.10/0.10/0.15), thresholds (0.80/0.40), `createIdentityLink` shape
- `lib/markos/crm/merge.cjs` [VERIFIED: codebase] — `recordMergeDecision`, `applyApprovedMerge`, `mergeLineage` pattern
- `lib/markos/outbound/consent.ts` [VERIFIED: codebase] — `evaluateOutboundEligibility` signature, `outboundConsentRecords` shape, channel normalization
- `lib/markos/contracts/schema.ts` [VERIFIED: codebase] — `Segment` type is brand-taxonomy only (no CDP fields); namespace confirmed orthogonal
- `api/tracking/ingest.js` [VERIFIED: codebase] — dual-write seam location; `appendCrmActivity` call site; `source_event_ref` pattern
- `api/tracking/identify.js` [VERIFIED: codebase] — `scoreIdentityCandidate` + `createIdentityLink` call pattern; tenant auth flow
- `contracts/` directory listing [VERIFIED: codebase] — Highest F-ID is F-105
- `supabase/migrations/` directory listing [VERIFIED: codebase] — Highest migration number is 100
- `obsidian/work/incoming/20-CDP-ENGINE.md` [VERIFIED: doc] — CDP doctrine, 7 core rules, canonical object shapes, merge behavior, ConsentState interface
- `221-CONTEXT.md` [VERIFIED: doc] — 31 locked decisions D-01..D-31

### Secondary (MEDIUM confidence)
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` [VERIFIED: doc] — Vitest/Playwright/Chromatic doctrine for P204+
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` [VERIFIED: doc] — Phase-level test obligation pattern
- `obsidian/reference/Contracts Registry.md` [VERIFIED: doc] — F-ID allocation pattern; F-90..F-96 warning; candidate CDP families named

### Tertiary (LOW / ASSUMED)
- `json-logic-js` as preferred DSL library [ASSUMED — verify npm registry before plan]
- Monthly event partitioning cadence [ASSUMED — verify against expected volume]
- Vercel Cron tier availability [ASSUMED — verify against current Vercel plan]

---

## Open Questions

1. **CRM entity table exact names**
   - What we know: Migration 58 creates CRM entities; Schema.md references contacts, companies, accounts, customers, deals.
   - What's unclear: Whether table names are exactly `crm_contacts`, `crm_companies`, `crm_accounts`, `crm_customers` or prefixed differently.
   - Recommendation: Planner reads `supabase/migrations/58_crm_core_entities.sql` before writing Migration 101 DDL.

2. **pg_cron availability**
   - What we know: The repo uses Vercel Cron for other scheduled tasks.
   - What's unclear: Whether the Supabase plan includes pg_cron (would simplify trait recompute).
   - Recommendation: Planner checks current Supabase plan; default to Vercel Cron if unclear.

3. **SHA-256 salt strategy for identity_value_hash**
   - What we know: Raw PII must not appear in `cdp_identity_links` (D-28).
   - What's unclear: Whether to use a per-tenant salt (stored in tenant record) or a global HMAC key (SOPS-managed).
   - Recommendation: Use per-tenant HMAC key (tenant's `id` as salt prefix) — prevents cross-tenant hash comparison while keeping the operation stateless. Planner documents this in 221-01.

4. **Vitest config already exists?**
   - What we know: P204 was planned with Vitest doctrine; 13 plans complete.
   - What's unclear: Whether P204 execution actually installed Vitest and created `vitest.config.ts`.
   - Recommendation: Planner checks `package.json` devDependencies for `vitest` before writing 221-06 Wave 0 steps.

---

## Metadata


#### Confidence Breakdown

- Standard stack: HIGH — all reused modules verified in codebase; new modules derived from locked decisions
- F-ID and migration allocation: HIGH — highest existing IDs verified by directory listing
- Schema sketches: HIGH — DDL derived from locked decisions D-01..D-19; ASSUMED items flagged
- Architecture patterns: HIGH — derived from existing code patterns + locked decisions
- DSL recommendation: MEDIUM — json-logic-js assessment based on training knowledge; npm version unverified
- Trait recompute recommendation: MEDIUM — Vercel Cron assumed available; pg_cron availability unknown
- Pitfalls: HIGH — derived from actual codebase patterns and known CDP industry failure modes
- Tests: HIGH — file names and assertions derived from locked decisions and existing test file patterns

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days — standard stability)

---

## RESEARCH COMPLETE
