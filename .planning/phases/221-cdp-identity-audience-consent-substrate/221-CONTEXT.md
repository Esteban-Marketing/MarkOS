# Phase 221: CDP Identity, Audience, and Consent Substrate - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

<domain>
## Phase Boundary

Phase 221 establishes the first-party customer-data substrate (system-of-record) for identity resolution, consent, event normalization, trait materialization, and activation-safe audience snapshots across MarkOS. It is the SOR layer consumed by CRM (P222), messaging (P223), conversion/launch (P224), analytics (P225), sales enablement (P226), ecosystem (P227), and the SaaS Suite revenue/health stack (P214-P217).

**In scope:** IdentityProfile, IdentityLink, ConsentState, EventEnvelope, TraitSnapshot, AudienceDefinition, AudienceSnapshot — plus read-through adapters and read-only API/MCP surface. Merge review inbox reuses P100 governance UX.

**Out of scope (deferred phases, not this phase):**
- Timeline-first CRM 360 workspace — P222.
- Native email/SMS/WhatsApp/push execution — P223.
- Conversion/landing/form/launch orchestration — P224.
- Attribution/journey/narrative semantic layer — P225.
- Full doc 20 write-path API families + 6 MCP tools — P222/P223.

Phase 221 is additive and compatibility-safe: existing CRM, outbound consent, and tracking ingest keep working through adapters during the transition.
</domain>

<decisions>
## Implementation Decisions

### Profile layering
- **D-01:** Two-layer architecture — CDP `IdentityProfile` is the raw+computed identity SOR; CRM entity remains the operational overlay. CRM carries `canonical_identity_id` FK populated by CDP backfill. CDP never replaces CRM operational state.
- **D-02:** `profile_type` is `person | account` for v1. Workspace/household are deferred (not blocked) — the schema accepts the enum extension but v1 ingest does not emit them. PLG workspace and household identities land in P218/P225 as needed.
- **D-03:** Every profile has `tenant_id`, `mode` (`b2b | b2c | plg_b2b | plg_b2c | b2b2c`), `lifecycle_state`, `consent_state_id`, `last_meaningful_touch_at`, and RLS enforcement identical to CRM entity.

### Identity graph + merge policy
- **D-04:** Merge policy evolves per doc 20 with current weights preserved as the soft-match floor.
  - **Hard-match signals (auto-resolve, confidence = 1.0):** verified email, authenticated user_id, billing_customer_id, subscription_id, workspace_id.
  - **Soft-match signals (current weights carried from `lib/markos/crm/identity.ts`):** email_exact_match=0.65, domain_match=0.15, device_match=0.10, session_overlap=0.10, form_submitted=0.15.
  - **Thresholds carried from P101 D-04:** ≥0.80 auto-accept (soft), 0.40-0.79 review, <0.40 reject.
- **D-05:** All merges reversible with immutable lineage (`IdentityLink` rows with `link_status` + `source_event_ref` + `reviewer_actor_id` preserved from current contract).
- **D-06:** Fail-closed on ambiguous tenant context (P101 D-06 carried).
- **D-07:** Anonymous-to-known stitching stays non-destructive (P101 D-05 carried). Pre-conversion history appears on CRM timeline via stitched-label projection after acceptance, never before.

### Event substrate
- **D-08:** New append-only `cdp_events` table is the canonical event SOR. Envelope = `{ event_id, tenant_id, event_name, event_domain, occurred_at, profile_id?, account_id?, anonymous_id?, properties }` where `event_domain ∈ { website, product, email, messaging, crm, billing, support, social, ads, partner }`.
- **D-09:** Existing `crm_activity` becomes a projection/view filtered by the HIGH_SIGNAL allowlist (current `lib/markos/crm/tracking.ts` behavior preserved). Operator-facing timelines keep their current noise posture.
- **D-10:** `api/tracking/ingest.js` + `api/tracking/identify.js` keep their current public contract; internally they dual-write to `cdp_events` (raw) and `crm_activity` (projection) during transition, then projection becomes derived-only once P222 consumes CDP directly.

### Consent ledger
- **D-11:** New `ConsentState` SOR per profile with: `email_marketing`, `sms_marketing`, `whatsapp_marketing` (`opted_in | opted_out | unknown`), `push_enabled`, `in_app_enabled`, `legal_basis` (`consent | contract | legitimate_interest | unknown`), `jurisdiction`, `preference_tags[]`, `quiet_hours`, `source`, `source_timestamp`.
- **D-12:** Existing `outboundConsentRecords` becomes a derived read during migration. `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` reads `ConsentState` first, falls back to legacy rows on miss. Full cutover lands in P223 messaging phase — P221 ships the shim + drift audit.
- **D-13:** Every downstream send/dispatch engine MUST consume `ConsentState` (never a channel-local flag). Enforced at planner/reviewer time for P222-P226.

### Trait materialization
- **D-14:** Materialized `TraitSnapshot` rows per profile with `{ trait_name, value, computed_at, source_event_ref[], freshness_mode, confidence }`.
- **D-15:** Recompute cadence per trait family: `real_time` for intent/engagement, `hourly` for lifecycle/activation, `daily` for fit/persona/expansion/churn-risk. Matches P209 claim TTL + freshness rules.
- **D-16:** Trait provenance (`source_event_ref[]`) mandatory — no black-box traits. Feeds P209 EvidenceMap and explainability posture.

### Audience definition + snapshot
- **D-17:** `AudienceDefinition` = `{ segment_id, tenant_id, name, objective, entity_type (person|account), logic_json, freshness_mode, destination_families[] }`. Note: the existing `segment` entity in `lib/markos/contracts/schema.ts` is a **brand-taxonomy publish object** and is orthogonal — do not overload it. New namespace: `lib/markos/cdp/audiences/*`.
- **D-18:** `AudienceSnapshot` is immutable frozen membership at compute time. Every dispatch in P223-P226 MUST re-evaluate suppression, consent, jurisdiction, and quiet-hours against current `ConsentState` at send time — snapshot membership alone is insufficient. Double-gate: snapshot freezes who COULD be reached; dispatch confirms who CAN legally be reached right now.
- **D-19:** Audience snapshots write an audit row per compute: `{ snapshot_id, audience_id, computed_at, membership_count, suppression_count_at_snapshot, actor_id, evidence_ref }`. Operator-visible.

### Downstream consumption
- **D-20:** CRM + attribution + timeline consume CDP via a read-through adapter (`lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`). No CRM schema changes in P221 beyond `canonical_identity_id` FK backfill. Full CRM 360 rewrite belongs to P222.
- **D-21:** SaaS Suite customer identity bridge (P214) reads CDP `IdentityProfile` via the same adapter — no parallel SaaS identity model.

### API + MCP surface
- **D-22:** Read-only v1 surface:
  - `GET /v1/cdp/profiles/{id}`, `GET /v1/cdp/profiles?query=...`
  - `GET /v1/cdp/consent/{profile_id}`
  - `GET /v1/cdp/audiences/{id}`, `GET /v1/cdp/audiences/{id}/snapshots/{snapshot_id}`
  - MCP tools: `get_unified_profile`, `get_consent_state`
- **D-23:** Mutations (merge review accept/reject, audience create, consent update, profile delete) are tenant-operator UI + review flows — NOT public API in P221. Public write APIs land with the consuming engine (P222/P223) so contracts match dispatch reality.

### Deletion + export posture
- **D-24:** DSR deletion:
  - `IdentityProfile` → tombstone (`identity_id` preserved for referential integrity, all PII columns scrubbed, `deletion_evidence_ref` populated).
  - Cascade purge: `cdp_events`, `TraitSnapshot`, `AudienceSnapshot` membership rows for the profile.
  - `ConsentState` **retained** with `deletion_evidence_ref` — legal defensibility of suppression. Future re-contact attempts must fail-closed against retained consent tombstone.
- **D-25:** Export contract: full profile dump = `{ IdentityProfile, IdentityLink[], cdp_events[], TraitSnapshot[], ConsentState[], AudienceSnapshot membership[] }` per DSR request. Cascade to CRM via P222 DSR coordination.

### Observability + operator posture
- **D-26:** Operator surfaces (reuse existing patterns, no new dashboards):
  1. **Merge review inbox** — reuse `lib/markos/crm/merge.cjs` + P100 UX; CDP identity-link reviews route to the same queue with CDP evidence panel.
  2. **Consent drift audit** — cron-based diff of `ConsentState` vs `outboundConsentRecords` during migration window, emits operator task + audit log row on divergence. Fail-closed send behavior when divergence detected for the affected contact.
  3. **Audience snapshot log** — append-only operator-visible log of every `AudienceSnapshot` compute with membership/suppression counts and evidence ref.

### Security + tenancy
- **D-27:** RLS on all new objects (`IdentityProfile`, `IdentityLink`, `cdp_events`, `ConsentState`, `TraitSnapshot`, `AudienceDefinition`, `AudienceSnapshot`, `AudienceSnapshotMembership`). Fail closed on missing tenant context.
- **D-28:** No raw PII in cross-tenant learning, logs, prompts, or MCP payloads (P210 non-negotiable carried, P212 cross-tenant anonymization coordinated).
- **D-29:** Audit trail mandatory on merge decisions, consent mutations, audience compute, and deletion — reuses unified `markos_audit_log` with per-tenant hash chain from P201.

### Contracts + migrations
- **D-30:** Fresh F-ID allocation for each CDP contract family (planner decides exact numbers at plan time). Expect ~5-7 new contracts: F-xxx-cdp-identity-profile, F-xxx-cdp-identity-link, F-xxx-cdp-event-envelope, F-xxx-cdp-consent-state, F-xxx-cdp-trait-snapshot, F-xxx-cdp-audience-definition, F-xxx-cdp-audience-snapshot.
- **D-31:** New migrations allocated by planner (expect 4-6): CDP tables + cdp_events + ConsentState + TraitSnapshot + audience tables + FK `canonical_identity_id` on CRM entity.

### Claude's Discretion
- Exact module boundary between `lib/markos/cdp/identity/*` vs `lib/markos/cdp/profiles/*` vs `lib/markos/cdp/adapters/*`.
- Trait recompute infrastructure (cron vs AgentRun vs Vercel Queue) — choose at plan time to match P207 AgentRun v2 patterns.
- Exact audience `logic_json` DSL shape (JSON Logic vs custom AST) — evaluate at research/plan time.
- Planner picks specific contract IDs, migration numbers, and test file names per current repo conventions.

### Folded Todos
None — no pending todos matched Phase 221 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (product shape — precedence 1-2)
- `obsidian/work/incoming/20-CDP-ENGINE.md` — CDP doctrine, 7 core rules, canonical object shapes (IdentityNode, UnifiedProfile, UnifiedEvent, ConsentState, SegmentDefinition), merge behavior, activation rules, governance non-negotiables.
- `obsidian/work/incoming/18-CRM-ENGINE.md` — CRM Engine doctrine; defines the CRM-as-overlay boundary CDP must respect (§Core Doctrine, §Part 1 Object Model).
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` — Analytics doctrine; defines how CDP events feed the semantic layer (§Part 1 six layers).
- `obsidian/brain/MarkOS Canon.md` — product north star.
- `obsidian/brain/Brand Stance.md` — voice/tone posture for operator-facing copy.
- `obsidian/brain/Pricing Engine Canon.md` — placeholder rule `{{MARKOS_PRICING_ENGINE_PENDING}}` applies to any packaging/pricing copy in audience activation UX.
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — v2 operating loop; CDP is the identity/consent/event substrate under the loop.
- `obsidian/reference/Contracts Registry.md` — contract naming conventions + F-ID allocation pattern.
- `obsidian/reference/Database Schema.md` — current schema shape + RLS patterns CDP must extend.
- `obsidian/reference/Core Lib.md` — `lib/markos/*` module boundary conventions.
- `obsidian/reference/HTTP Layer.md` — API route conventions (`/v1/cdp/*` naming).

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 221 goal, dependencies (207, 209, 210, 214-217), and v4.2.0 Commercial Engines 1.0 boundary (§Phase 221, §Future Milestone Candidate v4.2.0).
- `.planning/REQUIREMENTS.md` — CDP-01..05, RUN-01..08, EVD-01..06, QA-01..15 targets for this phase.
- `.planning/STATE.md` — current execution state.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md` — Phase routing decisions for docs 18-26.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — cross-phase findings; CDP "additive not replacement-heavy" decision.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` — existing substrate inventory.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — mandatory testing doctrine from P204 forward.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/DISCUSS.md` — phase scope + 6 proposed slices.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-RESEARCH.md` — prior research (files inspected, existing support, missing capabilities, recommended implementation path).

### Prior phase decisions CDP must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-04 (confidence-aware stitching), D-05 (merges as governance events, reversible lineage), D-07 (custom fields contract-validated), D-09/D-10 (tenant-scoped RLS + mandatory audit).
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-01 (high-signal-only CRM timeline), D-04 (auto/review/reject thresholds), D-05 (review-first anon-to-known), D-07 (stitched-label projection).
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — D-04 (channel-specific consent, fail closed); CDP ConsentState must preserve this posture through the migration shim.
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + freshness + source-quality rules that trait provenance + audience snapshot audit must integrate with.
- `.planning/phases/210-connector-wow-loop-and-recovery/210-CONTEXT.md` — connector data retention/consent posture; CDP event ingest must consume connector data through consented channels only.
- `.planning/phases/214-saas-suite-activation-subscription-core/214-CONTEXT.md` — SaaS customer identity bridge must read CDP profile, no parallel model.
- `.planning/phases/216-saas-suite-health-churn-support-usage/216-CONTEXT.md` — health/churn/support/product signals are trait consumers; CDP trait naming must accommodate SaaS signal vocabulary.

### Existing code + test anchors (read before planning)
- `lib/markos/crm/identity.ts` — current scoring + confidence clamp + link status enum; carried forward as soft-match floor.
- `lib/markos/crm/tracking.ts` — HIGH_SIGNAL_AUTHENTICATED_EVENTS allowlist; preserved as projection filter.
- `lib/markos/crm/timeline.ts` + `lib/markos/crm/attribution.ts` — read-through CDP adapter must preserve current behavior.
- `lib/markos/crm/merge.cjs` — governance UX that CDP merge review extends.
- `lib/markos/crm/contracts.cjs` + `lib/markos/crm/contracts.ts` — identity link status enum source.
- `lib/markos/outbound/consent.ts` — eligibility evaluator to swap onto ConsentState with legacy fallback.
- `lib/markos/contracts/schema.ts` — existing `segment` brand entity (orthogonal to CDP audience; do not overload).
- `api/tracking/ingest.js` + `api/tracking/identify.js` — public contract preserved; internal dual-write added.
- `lib/markos/mcp/tools/crm/read-segment.cjs` — pattern reference for `get_unified_profile` MCP tool.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/identity.ts::scoreIdentityCandidate` — current 0.65/0.15/0.1/0.1/0.15 weighting carried as soft-match floor; hard-match signals stack on top.
- `lib/markos/crm/identity.ts::createIdentityLink` — link_status + source_event_ref + reviewer_actor_id shape reused for CDP IdentityLink.
- `lib/markos/crm/tracking.ts::normalizeTrackedActivity` — HIGH_SIGNAL filter becomes the projection filter between cdp_events and crm_activity.
- `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` — eligibility evaluator gets a ConsentState reader + legacy fallback branch.
- `lib/markos/crm/merge.cjs` — review-first merge UX + immutable evidence pattern carried directly into CDP identity merge review.
- `lib/markos/crm/timeline.ts` — stitched-label projection rule preserved when CDP feeds CRM.
- `lib/markos/crm/attribution.ts` — review-pending exclusion rule preserved.
- `api/tracking/ingest.js` + `api/tracking/identify.js` — tenant-safe ingest + confidence stitching seam reused; internal writer adds cdp_events envelope.
- `markos_audit_log` (from P201) — hash-chained audit consumes merge/consent/audience/deletion events.

### Established patterns
- Contract-first modules with explicit validators + tenant fail-closed checks (carried from CRM lane).
- Review-first mutation with immutable evidence (carried from P100 merge pattern).
- Append-only event shape with source_event_ref breadcrumb (carried from tracking ingest).
- Channel-specific fail-closed eligibility (carried from P104 outbound consent).
- Unified per-tenant audit log with hash chain (carried from P201).
- HIGH_SIGNAL allowlist pattern for operator-facing event filtering (carried from P101).

### Integration points
- **Upstream:** `api/tracking/ingest.js` + `api/tracking/identify.js` feed cdp_events.
- **CRM (P222):** read-through adapter `lib/markos/cdp/adapters/crm-projection.ts` — CRM keeps its schema, adds `canonical_identity_id` FK.
- **Outbound (P223):** ConsentState replaces outboundConsentRecords via shim.
- **Messaging/Launch/Conversion (P223-P226):** AudienceSnapshot + ConsentState re-validation at dispatch.
- **Analytics (P225):** cdp_events + TraitSnapshot + AudienceSnapshot feed semantic/attribution layer.
- **SaaS Suite (P214-P217):** customer identity bridge reads IdentityProfile; health/churn signals are trait consumers.
- **Agents (P207):** new CDP agents (Identity Resolver, Trait Compiler, Audience Builder, Consent Guardian — doc 20 Part 6) registered through AgentRun v2.
- **Evidence (P209):** trait provenance + audience snapshot audit integrate with EvidenceMap.

</code_context>

<specifics>
## Specific Ideas

- "Identity graph review, merge suggestions, unified profile inspector, trait explorer, consent and preference center, segment builder, audience activation logs" (doc 20 Part 7) — UI inspiration; Phase 221 delivers only the *merge review inbox* + *consent drift audit* + *audience snapshot log* operator surfaces. Full inspector/trait explorer/preference center deferred to P222/P225.
- "No merge profile irreversibly without evidence" (doc 20 Part 9) — merge UX from P100 already honors this; CDP preserves.
- "Segments are computed products, not static lists" (doc 20 core rule 5) — enforces the AudienceDefinition (logic) vs AudienceSnapshot (frozen result) split; both are first-class.
- "Every downstream engine reads from the same canonical profile substrate" (doc 20 core rule 6) — forces the read-through adapter contract so CRM/messaging/analytics never drift into parallel identity.
- CDP is *additive* — RESEARCH.md finding: elevate existing tracking/identity stitching rather than redo. Current scoring weights are evidence of working production logic; keep them as soft-match floor, don't throw away.

</specifics>

<deferred>
## Deferred Ideas

### For future CDP-lane phases
- CRM 360 customer record rewrite + timeline-first workspace → P222.
- Native email/SMS/WhatsApp/push dispatch consuming ConsentState + AudienceSnapshot → P223.
- Conversion surfaces (landing/forms/CTA) + launch orchestration reading audiences → P224.
- Semantic attribution + journey analytics + narrative/anomaly layer on cdp_events → P225.
- Sales enablement reading profile + intent traits → P226.
- Ecosystem/partner/affiliate/community/developer growth workflows reading profile + audiences → P227.
- Commercial OS integration closure (cross-engine contracts, provider replaceability, no-obsolescence) → P228.

### For future enrichment (no phase assigned yet)
- Workspace + household `profile_type` extensions (doc 20 asks all 4; v1 ships person+account).
- Full doc 20 API surface (6 families) + 6 MCP tools — write paths land with the engine that mutates.
- Full CDP dashboard (identity graph viewer, trait explorer visual UI, preference center UX) — Phase 221 ships only the operator review inbox + audit log.
- Doc 20 agent family (CDP-01 Identity Resolver, CDP-02 Trait Compiler, CDP-03 Audience Builder, CDP-04 Consent Guardian) registered with AgentRun v2 — scope + readiness in P217-style registry; actual execution in phases that mutate.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 221 scope.

</deferred>

---

*Phase: 221-cdp-identity-audience-consent-substrate*
*Context gathered: 2026-04-24*
