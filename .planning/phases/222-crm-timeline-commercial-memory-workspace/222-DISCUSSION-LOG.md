# Phase 222: CRM Timeline and Commercial Memory Workspace - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in `222-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 222-crm-timeline-commercial-memory-workspace
**Mode:** discuss (--chain)
**Areas discussed:** Customer360 shape, Timeline taxonomy, NBA durability, Buying committee, Score envelope, Lifecycle SOR, Migration strategy, Ownership semantics, Workspace/UI, API/MCP surface, CDP↔CRM integration

---

## Area selection

**Selected (all 8):** Customer360 shape, Timeline taxonomy migration, NBA durability, Buying committee model, Score envelope, Lifecycle state SOR, Migration strategy, Ownership semantics.

---

## Customer360 shape

| Option | Description | Selected |
|--------|-------------|----------|
| Unified Customer360Record entity_type=account\|person + Opportunity separate | Matches doc 18. Opportunity distinct lifecycle/amount/close. Minimal drift. | ✓ |
| Three separate tables (accounts, people, opportunities) | Cleaner schema. Duplicates shared fields; breaks unified RLS. | |
| Evolve crm_entities in place + Opportunity child | No new top-level. Bloat risk. | |

**User's choice:** Unified + separate Opportunity (Recommended).

---

## Timeline taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Adopt doc 18 source_domain (10) + commercial_signal (7) + actor_type, preserve activity_family as legacy | Additive; backward-compat. | ✓ |
| Replace activity_family with source_domain | Cleaner; breaks buildCrmTimeline + P221 projection. | |
| Add commercial_signal only | Minimal; misses source_domain coverage for meeting/support/billing/product/social. | |

**User's choice:** Doc 18 extensions preserving legacy taxonomy (Recommended).

---

## NBA durability

| Option | Description | Selected |
|--------|-------------|----------|
| Durable nba_records table (evidence_refs + expires_at + confidence + approval_ref) | Executor + queue + copilot share one SOR. P209 EvidenceMap + P207 recompute integration. | ✓ |
| Reducer view-model only (current execution.ts) | Simplest; divergence risk across consumers; no history. | |
| Hybrid (persist high-confidence only) | Boundary complexity. | |

**User's choice:** Durable nba_records (Recommended).

---

## Buying committee model

| Option | Description | Selected |
|--------|-------------|----------|
| Separate buying_committees + buying_committee_members tables with role + influence + engagement + role history | Doc 18 first-class. Queryable by role. Account + opportunity reuse. | ✓ |
| Columns on Opportunity (committee_roles_json + coverage_score) | Simpler; no row-level tracking; no missing-role queries. | |
| Derived view over person-opportunity relationships | Implicit roles; no explicit missing-role surface. | |

**User's choice:** Separate tables with role history (Recommended).

---

## Score envelope

| Option | Description | Selected |
|--------|-------------|----------|
| Unified scores on Customer360 (nullable per entity_type) + Opportunity own scores | Matches doc 18. One read-model. | ✓ |
| Per-object score tables | 3x migration, 3x query, always joined. | |
| Event-sourced scores only | Pure but blocks list/filter by score. | |

**User's choice:** Unified with nullable per type (Recommended).

---

## Lifecycle state SOR

| Option | Description | Selected |
|--------|-------------|----------|
| lifecycle_stage column + lifecycle_transitions event table | Fast reads + event-sourced history. | ✓ |
| Separate LifecycleState table (1:1) | Over-normalized; every read joins. | |
| Column only (no history) | Violates P100 D-10 audit rule. | |

**User's choice:** Column + transitions event table (Recommended).

---

## Migration strategy

| Option | Description | Selected |
|--------|-------------|----------|
| New customer_360_records + read-model view; crm_entities stays legacy base during transition | Additive; adapter bridges P102-P105 consumers; matches P221 D-19/D-20 pattern. | ✓ |
| Evolve crm_entities in-place (add all C360 columns) | Wide-table bloat; enum mismatch; breaks queries. | |
| Hard migration (deprecate crm_entities) | Big-bang rewrite of workspace/execution/copilot/reporting. | |

**User's choice:** New layer + legacy adapter (Recommended).

---

## Ownership semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-role tuple (account/deal/cs/marketing) + primary_owner derived by lifecycle_stage | Doc 18 handoff rule; role history preserved; queue reads primary_owner. | ✓ |
| Single owner_user_id (current) | Handoffs lose history; violates doc 18 Core Doctrine rule 5. | |
| Owner history table (many-to-many) | Most expressive; every query joins; UX still needs primary concept. | |

**User's choice:** Multi-role tuple + derived primary (Recommended).

---

## Workspace + UI surface

| Option | Description | Selected |
|--------|-------------|----------|
| Evolve existing 6-view workspace + copilot; add TimelineDetailView + BuyingCommitteePanel + NBAExplainPanel | Honors P208 single-shell; reuses P102/P103/P105 surfaces. | ✓ |
| Full new CRM workspace (replace P102) | Discards working P102; violates P208 no-parallel rule. | |
| Backend-only, defer UI | Blocks copilot evolution + operator validation. | |

**User's choice:** Evolve existing (Recommended).

---

## API + MCP surface

| Option | Description | Selected |
|--------|-------------|----------|
| Read-write v1 /v1/crm/customer360, opportunities, committees, lifecycle-transitions, nba + 4 MCP tools (get_customer_360, get_opportunity_context, list_committee_gaps, list_next_best_actions) | P222 IS operational engine; writes are approval-aware. | ✓ |
| Read-only v1 (writes stay library-only) | Blocks P223-P226 downstream engines. | |
| Minimal MCP (2 tools) | Insufficient for P225/P226 committee + lifecycle reads. | |

**User's choice:** Read-write v1 + 4 MCP tools (Recommended).

---

## CDP ↔ CRM integration

| Option | Description | Selected |
|--------|-------------|----------|
| Customer360 reads CDP via P221 adapter; CRM writes emit cdp_events (event_domain='crm') | Closes the CDP-CRM loop; no parallel identity. | ✓ |
| CDP reads CRM directly | Inverts P221 D-01 two-layer. | |
| Dual-write sync job | Drift window; breaks P221 D-18 activation gate. | |

**User's choice:** Read via adapter + write via cdp_events envelope (Recommended).

---

## Claude's Discretion

- Module boundary under `lib/markos/crm360/*`.
- NBA recompute infra (cron vs AgentRun vs event-triggered) — align P207 + P221 at plan time.
- `primary_owner_user_id` computed column (generated vs app-side).
- Contract IDs, migration numbers, test file names per repo conventions.
- TimelineDetailView / BuyingCommitteePanel / NBAExplainPanel implementation details.

## Deferred Ideas

- P223 native dispatch consuming Customer360 + ConsentState + AudienceSnapshot.
- P224 conversion/launch surfaces.
- P225 semantic attribution + journey + narrative.
- P226 sales enablement (battlecards + proof packs).
- P227 ecosystem/partner/affiliate/community/developer growth.
- P228 commercial OS integration closure.
- profile_type='workspace'|'household' → P218/P225.
- Full CRM 360 dashboard (trait explorer, preference center) → P225.
- Cross-tenant commercial-signal anonymized learning → P212/P228.
- Legacy `crm_entities` cutover to derived-view-only → post-P222 cleanup.
- BuyingCommittee AI auto-detection from email/meeting evidence → P225+.
- CRM-05 Opportunity Coach agent registered with AgentRun v2 → post-P222.
