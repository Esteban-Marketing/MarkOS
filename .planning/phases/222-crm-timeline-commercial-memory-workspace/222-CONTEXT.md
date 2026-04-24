# Phase 222: CRM Timeline and Commercial Memory Workspace - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

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
- **D-21:** Customer360 reads CDP IdentityProfile + ConsentState + TraitSnapshot via the P221 read-through adapter (`lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`). CRM never stores identity/consent/trait data — it stores commercial overlay only (fit/intent/health/risk/lifecycle/ownership/opportunity).
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

### Existing code + test anchors (read before planning)
- `lib/markos/crm/workspace.ts` + `lib/markos/crm/workspace-data.ts` — 6-view workspace state + snapshot hydration.
- `lib/markos/crm/execution.ts` — current NBA reducer + queue + urgency + rationale. Target of D-08 NBA durability refactor.
- `lib/markos/crm/timeline.ts` — `buildCrmTimeline` + ACTIVITY_FAMILY_ALIASES (target of D-05/D-06 extension).
- `lib/markos/crm/tracking.ts` — HIGH_SIGNAL filter (preserved in D-06).
- `lib/markos/crm/attribution.ts` — review-pending exclusion (preserved).
- `lib/markos/crm/identity.ts` + `lib/markos/crm/merge.cjs` — identity + merge (extended by P221, consumed by P222 Customer360).
- `lib/markos/crm/copilot.ts` — record brief grounding (evolved in D-24).
- `lib/markos/crm/reporting.ts` — CRM-native cockpit (evolved in D-29).
- `lib/markos/cdp/adapters/crm-projection.ts` — P221 adapter (Customer360 consumes in D-21).
- `lib/markos/crm/contracts.ts` + `lib/markos/crm/contracts.cjs` — entity/activity schemas.
- `app/(markos)/crm/*` — existing CRM route tree (workspace/execution/outbound/copilot/reporting).
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
- `markos_audit_log` (P201 hash chain) — consumes all new mutation events.
- Approval package + playbook lifecycle (P105) — consumed by D-28 write-path approval gates.
- `contracts/flow-registry.json` — append-only F-ID registry (D-33 adds 7-9 entries).

### Established patterns
- Contract-first modules with explicit validators + tenant fail-closed checks.
- Review-first mutation with immutable evidence (P100 merge pattern).
- Approval-packaged AI actions (P105).
- HIGH_SIGNAL projection filter for operator timeline (P101).
- 6-view workspace from one SOR (P102).
- Unified execution queue with tabs (P103).
- Record brief + evidence inline (P105).
- Centralized approval inbox + Morning Brief (P208).
- Read-through adapter bridging old/new substrates (P221 D-20 pattern replicated in D-19).
- EventEnvelope write to cdp_events (P221 D-08 pattern replicated in D-07).
- Tombstone cascade with audit retention (P221 D-24 pattern replicated in D-32).

### Integration points
- **Upstream:** CDP IdentityProfile + ConsentState + TraitSnapshot via P221 adapter (D-21).
- **CRM legacy:** `crm_entities` + existing workspace/execution/copilot/reporting consumed via `lib/markos/crm360/adapters/legacy-entity.ts` (D-19); migrate consumer-by-consumer.
- **Downstream dispatch (P223):** reads Customer360 + Opportunity + ConsentState for send eligibility; consumes AudienceSnapshot from P221 D-18 double-gate.
- **Downstream conversion/launch (P224):** reads Opportunity + lifecycle + NBA for conversion surface personalization.
- **Downstream analytics (P225):** reads Customer360 + Opportunity + lifecycle_transitions + nba_records for attribution + journey + narrative.
- **Downstream sales enablement (P226):** reads Opportunity + BuyingCommittee + evidence_gaps for battlecard + proof-pack generation.
- **Agents (P207):** Customer360 + Opportunity + NBA recompute wrapped in AgentRun runs.
- **Evidence (P209):** NBA evidence_refs + score provenance + lifecycle_transitions evidence_ref all integrate with EvidenceMap.
- **Pricing Engine:** Opportunity `pricing_context_id` FK; price-mutating paths honor `{{MARKOS_PRICING_ENGINE_PENDING}}`.

</code_context>

<specifics>
## Specific Ideas

- "Timeline first. The timeline is the source of truth. Lists and boards are views." (doc 18 Core Doctrine rule 1) — enforces TimelineDetailView as record default, not the 6-view list default. Kanban remains default for list-level navigation per P102 D-02.
- "Relationship memory must survive handoffs" (doc 18 Core Doctrine rule 5) — multi-role ownership (D-16) + handoff events (D-17) + lifecycle_transitions (D-12) are the enforcement mechanism.
- "Every object must be actionable. No passive record exists without tasks, risk, next-best action, or decision context." (doc 18 Core Doctrine rule 4) — every Customer360 and Opportunity row MUST have an active nba_records row OR explicit `nba_reason='none_applicable'` rationale.
- "No black-box scores" (carried from P216 D-non-negotiable) — score_provenance is mandatory: source_event_refs[] + computed_at + freshness_mode + confidence on every score field.
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

### Reviewed Todos (not folded)
None — no pending todos matched Phase 222 scope.

</deferred>

---

*Phase: 222-crm-timeline-commercial-memory-workspace*
*Context gathered: 2026-04-24*
