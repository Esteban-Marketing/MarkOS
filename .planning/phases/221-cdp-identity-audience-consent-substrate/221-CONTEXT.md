# Phase 221: CDP Identity, Audience, and Consent Substrate - Context

**Gathered:** 2026-04-24
**Updated:** 2026-04-26 (review-driven addendum: D-32..D-40 + `<deferred>` toolchain items)
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain) -> reviews (Claude runtime override 2026-04-26)

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
  - **Soft-match signals (current weights carried from `lib/markos/crm/identity.ts:18-22`):** email_exact_match=0.65, domain_match=0.15, device_match=0.10, session_overlap=0.10, form_submitted=0.15.
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
- **D-17:** `AudienceDefinition` = `{ segment_id, tenant_id, name, objective, entity_type (person|account), logic_json, freshness_mode, destination_families[] }`. Note: the existing `segment` entity in `lib/markos/contracts/schema.ts` is a **brand-taxonomy publish object** and is orthogonal — do not overload it. New namespace: `lib/markos/cdp/audiences/*`. DSL is JSON Logic via `json-logic-js@2.0.5` (EXACT pin per RL2).
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
- **D-30:** F-ID slot allocation (review-driven; pre-allocated per RM4 to prevent collisions): F-106 cdp-identity-profile-v1, F-107 cdp-identity-link-v1, F-108 cdp-event-envelope-v1, F-109 cdp-consent-state-v1, F-110 cdp-trait-snapshot-v1, F-111 cdp-audience-definition-v1, F-112 cdp-audience-snapshot-v1.
- **D-31:** Migration slot allocation (high-water at plan time = `100_crm_schema_identity_graph_hardening.sql`): 101_cdp_identity_core, 102a_cdp_consent_states, 102b_cdp_events, 103_cdp_trait_snapshots, 104_cdp_audience_objects, 105_cdp_deletion_and_audit, 106_cdp_consent_single_writer_trigger.

### Review-driven decisions (added 2026-04-26 after Claude-runtime cross-AI review)

- **D-32 — Architecture-lock (RH1, RM3):** P221 honors the `MarkOS` runtime architecture lock established by P204/P222-P228:
  - **Routes:** legacy `api/*.js` (NOT App Router `app/api/.../route.ts`).
  - **Auth:** `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth`, which does not exist).
  - **Test runner:** `npm test` (Node `--test`) with `node:test` + `node:assert/strict` imports; tests are `*.test.js`.
  - **OpenAPI:** `contracts/openapi.json` (NOT `public/openapi.json`).
  - **MCP registry:** `lib/markos/mcp/tools/index.cjs` (CommonJS — NOT `.ts`).
  - **Cron:** `api/cron/` (singular) with `*.js` filenames; auth via `x-markos-cron-secret` header + `MARKOS_CRON_SECRET` env per existing `api/cron/webhooks-dlq-purge.js` pattern.
  - **Helper canon:** `buildApprovalPackage` (NOT `createApprovalPackage`); `resolvePlugin` (NOT `lookupPlugin`).
  - Plan 01 Task 0.5 ships an architecture-lock detector + helper-presence test that fails CI if any of the above forbidden patterns appear in `221-*-PLAN.md` or `lib/markos/cdp/**`.

- **D-33 — buildApprovalPackage canonical (RH1):** CDP merge review writes through `lib/markos/crm/merge.cjs::buildApprovalPackage` — the existing canonical helper. `createApprovalPackage` is a fictional name introduced by drifted research; it MUST NOT be referenced anywhere in P221 code or downstream phases. Plan 01 helper-presence test enforces this.

- **D-34 — `lib/markos/cdp/*` greenfield (P221-OWNED):** This phase is the ROOT of the CDP lane. All CDP modules under `lib/markos/cdp/{identity,consent,events,traits,audiences,adapters,deletion,observability,preflight}/` are NEW in P221 and OWNED here; downstream phases P222-P228 consume them but do not re-declare them.

- **D-35 — Hard-fail upstream preflight (RH1):** Plan 01 Task 0.5 ships `scripts/preconditions/221-check-upstream.cjs` which throws `UpstreamPhaseNotLandedError` when any of `REQUIRED_UPSTREAM = [P207, P209, P210, P214, P215, P216, P217]` lacks its `SUMMARY.md`. Plans 02-06 invoke this CLI as their FIRST verify step. NO bridge stubs. NO "stub if missing". NO soft-skip.

- **D-36 — Test runner pinned (RH1 Path A):** `npm test` (Node `--test`) only. NO `vitest` install. NO `playwright` install. NO `vitest.config.ts`. NO `playwright.config.ts`. NO `.test.ts` files. All tests use `node:test` + `node:assert/strict` imports. Path A chosen over Path B (which would have required amending P204/P222-P228 architecture-locks across 7 phases). The `vitest`/`playwright`/`@vitest/coverage-v8`/`@playwright/test` toolchain is **deferred** (see `<deferred>` below).

- **D-37 — `contracts/openapi.json` canonical:** OpenAPI lives at `contracts/openapi.json` (NOT `public/openapi.json`). All F-ID YAML files under `contracts/` are auto-aggregated into this single OpenAPI spec by existing tooling.

- **D-38 — MCP registry at `.cjs`:** `lib/markos/mcp/tools/index.cjs` is the CommonJS module the MCP server reads. Plan 05 appends `require('./cdp/get-unified-profile.cjs')` and `require('./cdp/get-consent-state.cjs')` to the existing entry list. Do NOT create `lib/markos/mcp/tools/index.ts`.

- **D-39 — ConsentState single-writer trigger (RM2):** Plan 02 ships migration 106 with a BEFORE INSERT/UPDATE trigger on `outboundConsentRecords` that reads PostgreSQL session GUC `app.consent_writer_source` and rejects writes outside `cdp_setConsentState`. Library `setConsentState` (P221 sole writer) sets `SET LOCAL app.consent_writer_source = 'cdp_setConsentState'` inside its transaction. Service-role direct writes are blocked at the DB layer. Forward-port of P223 D-51 pattern.

- **D-40 — Drift audit hourly cadence (RM1):** Plan 02 ships the drift audit cron at HOURLY cadence (`schedule: "0 * * * *"`) — not daily. Divergence visible from first hour of P221 execution, not Plan 06 closeout. Plan 06 closeout still runs a deeper full-reconciliation gate (daily; `0 7 * * *`) on top of Plan 02's hourly drift detection.

### Claude's Discretion
- Exact module boundary between `lib/markos/cdp/identity/*` vs `lib/markos/cdp/profiles/*` vs `lib/markos/cdp/adapters/*`.
- Trait recompute infrastructure (cron vs AgentRun vs Vercel Queue) — choose at plan time to match P207 AgentRun v2 patterns.
- Specific contract IDs, migration numbers within the pre-allocated slots, and test file names per current repo conventions.

### Folded Todos
None — no pending todos matched Phase 221 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (product shape — precedence 1-2)
- `obsidian/work/incoming/20-CDP-ENGINE.md` — CDP doctrine, 7 core rules, canonical object shapes (IdentityNode, UnifiedProfile, UnifiedEvent, ConsentState, SegmentDefinition), merge behavior, activation rules, governance non-negotiables.
- `obsidian/work/incoming/18-CRM-ENGINE.md` — CRM Engine doctrine; defines the CRM-as-overlay boundary CDP must respect.
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` — Analytics doctrine; defines how CDP events feed the semantic layer.
- `obsidian/brain/MarkOS Canon.md` — product north star.
- `obsidian/brain/Brand Stance.md` — voice/tone posture.
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder rule.
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — v2 operating loop.
- `obsidian/reference/Contracts Registry.md` — F-ID allocation pattern.
- `obsidian/reference/Database Schema.md` — schema shape + RLS patterns.
- `obsidian/reference/Core Lib.md` — `lib/markos/*` module conventions.
- `obsidian/reference/HTTP Layer.md` — API route conventions (`/v1/cdp/*` legacy `api/*.js`).

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 221 goal + dependencies (207, 209, 210, 214-217).
- `.planning/REQUIREMENTS.md` — CDP-01..05, RUN-01..08, EVD-01..06, QA-01..15.
- `.planning/STATE.md` — current execution state.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md` — phase routing decisions.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — cross-phase findings.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/DISCUSS.md` — phase scope.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-RESEARCH.md` — prior research.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-REVIEWS.md` — Claude runtime override review (1 HIGH + 4 MEDIUM + 3 LOW; 2026-04-26).

### Prior phase decisions CDP must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-04 (confidence-aware stitching), D-05 (merges as governance events), D-09/D-10 (RLS + audit).
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-01 (HIGH_SIGNAL timeline), D-04 (auto/review/reject thresholds), D-05/D-07 (review-first stitching).
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — D-04 (channel-specific consent, fail closed).
- `.planning/phases/204-cli-markos-v1-ga/204-CONTEXT.md` — D-49 architecture-lock (npm test pin; vitest/playwright forbidden); CDP D-32/D-36 carry this forward.
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + freshness + source-quality.
- `.planning/phases/210-connector-wow-loop-and-recovery/210-CONTEXT.md` — connector consent posture.
- `.planning/phases/214-saas-suite-activation-subscription-core/214-CONTEXT.md` — SaaS bridge reads CDP profile.
- `.planning/phases/216-saas-suite-health-churn-support-usage/216-CONTEXT.md` — health/churn signals as trait consumers.
- `.planning/phases/222-crm-engine-360-workspace/222-CONTEXT.md` — D-39 architecture-lock (downstream consumer); CDP D-32 forward-compatible.
- `.planning/phases/223-messaging-engine-orchestration/223-CONTEXT.md` — D-46 architecture-lock; D-51 single-writer trigger pattern (P221 D-39 forward-port).
- `.planning/phases/226-revenue-pricing-billing-engines/226-CONTEXT.md` — D-82 architecture-lock; B6 migration slot pre-allocation lesson (RM4 forward-port).

### Existing code + test anchors (read before planning — VERIFIED 2026-04-26)
- `lib/markos/crm/identity.ts:18-22` — current 0.65/0.15/0.10/0.10/0.15 weighting; carried as soft-match floor.
- `lib/markos/crm/tracking.ts` — HIGH_SIGNAL_AUTHENTICATED_EVENTS allowlist; preserved as projection filter.
- `lib/markos/crm/timeline.ts` + `lib/markos/crm/attribution.ts` — read-through CDP adapter must preserve current behavior.
- `lib/markos/crm/merge.cjs` — governance UX; `buildApprovalPackage` is the canonical helper (D-33).
- `lib/markos/crm/contracts.cjs` + `lib/markos/crm/contracts.ts` — identity link status enum.
- `lib/markos/outbound/consent.ts` — eligibility evaluator to swap onto ConsentState with legacy fallback.
- `lib/markos/contracts/schema.ts` — existing `segment` brand entity (orthogonal to CDP audience; do not overload).
- `api/tracking/ingest.js` + `api/tracking/identify.js` — public contract preserved; internal dual-write added.
- `api/cron/webhooks-dlq-purge.js` — canonical cron pattern (singular `cron/`, `.js`, `x-markos-cron-secret`).
- `onboarding/backend/runtime-context.cjs:491` + `:1014` — `requireHostedSupabaseAuth` (D-32 canonical auth helper).
- `lib/markos/mcp/tools/index.cjs` — MCP registry (D-38; `.cjs` not `.ts`).
- `lib/markos/mcp/tools/crm/read-segment.cjs` — pattern reference for `get_unified_profile`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/identity.ts:18-22::scoreIdentityCandidate` — current weighting carried as soft-match floor; hard-match signals stack on top.
- `lib/markos/crm/identity.ts::createIdentityLink` — link_status + source_event_ref + reviewer_actor_id shape reused for CDP IdentityLink.
- `lib/markos/crm/tracking.ts::normalizeTrackedActivity` — HIGH_SIGNAL filter becomes the projection filter.
- `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` — eligibility evaluator gets a ConsentState reader + legacy fallback branch.
- `lib/markos/crm/merge.cjs::buildApprovalPackage` — governance UX carried directly into CDP merge review (D-33).
- `lib/markos/crm/timeline.ts` — stitched-label projection rule preserved.
- `lib/markos/crm/attribution.ts` — review-pending exclusion rule preserved.
- `api/tracking/ingest.js` + `api/tracking/identify.js` — tenant-safe ingest reused; internal writer adds cdp_events envelope.
- `api/cron/webhooks-dlq-purge.js` — canonical cron handler shape (D-32).
- `onboarding/backend/runtime-context.cjs::requireHostedSupabaseAuth` — auth helper for `/v1/cdp/*` routes (D-32).
- `markos_audit_log` (from P201) — hash-chained audit consumes merge/consent/audience/deletion events.

### Established patterns
- Contract-first modules with explicit validators + tenant fail-closed checks (carried from CRM lane).
- Review-first mutation with immutable evidence (carried from P100 merge pattern).
- Append-only event shape with source_event_ref breadcrumb (carried from tracking ingest).
- Channel-specific fail-closed eligibility (carried from P104 outbound consent).
- Unified per-tenant audit log with hash chain (carried from P201).
- HIGH_SIGNAL allowlist pattern for operator-facing event filtering (carried from P101).
- Architecture-lock detector (Plan 01 Task 0.5; D-32) — forward-portable to other phases that ship multi-plan replans.

### Integration points
- **Upstream:** `api/tracking/ingest.js` + `api/tracking/identify.js` feed cdp_events.
- **CRM (P222):** read-through adapter `lib/markos/cdp/adapters/crm-projection.ts` — CRM keeps its schema, adds `canonical_identity_id` FK.
- **Outbound (P223):** ConsentState replaces outboundConsentRecords via shim + single-writer trigger (D-39).
- **Messaging/Launch/Conversion (P223-P226):** AudienceSnapshot + ConsentState re-validation at dispatch.
- **Analytics (P225):** cdp_events + TraitSnapshot + AudienceSnapshot feed semantic/attribution layer.
- **SaaS Suite (P214-P217):** customer identity bridge reads IdentityProfile; health/churn signals are trait consumers.
- **Agents (P207):** new CDP agents (Identity Resolver, Trait Compiler, Audience Builder, Consent Guardian) registered through AgentRun v2.
- **Evidence (P209):** trait provenance + audience snapshot audit integrate with EvidenceMap.

</code_context>

<specifics>
## Specific Ideas

- "Identity graph review, merge suggestions, unified profile inspector, trait explorer, consent and preference center, segment builder, audience activation logs" (doc 20 Part 7) — UI inspiration; Phase 221 delivers only the *merge review inbox* + *consent drift audit* + *audience snapshot log* operator surfaces. Full inspector/trait explorer/preference center deferred to P222/P225.
- "No merge profile irreversibly without evidence" (doc 20 Part 9) — merge UX from P100 already honors this; CDP preserves via `buildApprovalPackage` (D-33).
- "Segments are computed products, not static lists" (doc 20 core rule 5) — enforces the AudienceDefinition (logic) vs AudienceSnapshot (frozen result) split; both first-class.
- "Every downstream engine reads from the same canonical profile substrate" (doc 20 core rule 6) — forces the read-through adapter contract.
- CDP is *additive* — RESEARCH.md finding: elevate existing tracking/identity stitching rather than redo. Current scoring weights are evidence of working production logic; keep them as soft-match floor (`lib/markos/crm/identity.ts:18-22`).

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
- Commercial OS integration closure → P228.

### For future enrichment (no phase assigned yet)
- Workspace + household `profile_type` extensions (doc 20 asks all 4; v1 ships person+account).
- Full doc 20 API surface (6 families) + 6 MCP tools — write paths land with the engine that mutates.
- Full CDP dashboard (identity graph viewer, trait explorer visual UI, preference center UX).
- Doc 20 agent family (CDP-01 Identity Resolver, CDP-02 Trait Compiler, CDP-03 Audience Builder, CDP-04 Consent Guardian) registered with AgentRun v2.

### Toolchain deferred (review-driven, RH1 Path A)
- **Vitest install** (`vitest@^1.6.0`, `@vitest/coverage-v8`) — RH1 Path A explicitly drops this from P221. Architecture-lock from P204 D-49 + P222 D-39 + P223 D-46 + P224 D-46 + P225 D-46 + P226 D-82 pins `npm test` (Node `--test`) as the single test runner. Reintroducing vitest requires amending those 6 phase locks first; deferred until a future cross-phase replan does so.
- **Playwright install** (`playwright`, `@playwright/test`) — same rationale as vitest. Browser-driven e2e tests are deferred; P221 operator UI smoke tests live in Plan 06 Task 4 human-action checkpoint. P222+ may reintroduce Playwright once the architecture-lock amendment lands.
- **Supabase types generation toolchain** (`supabase gen types typescript`) — not needed for P221; types are hand-maintained in `lib/markos/cdp/*/types.ts`. Generation tooling deferred to a separate infra phase.
- **OpenAPI generator** (`openapi-typescript-codegen` or similar) — F-ID YAMLs are aggregated by existing scripts into `contracts/openapi.json` (D-37); auto-generation of TS clients is deferred.

### App Router migration deferred
- **`api/v1/.../route.ts` migration** — the entire `api/*.js` → `app/api/.../route.ts` migration is deferred (P204 D-49 architecture-lock applies; D-32 carries it forward). Route handlers in P221 (Plan 05) are LEGACY `api/v1/cdp/*.js`. App Router migration is a separate cross-phase initiative.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 221 scope.

</deferred>

---

*Phase: 221-cdp-identity-audience-consent-substrate*
*Context gathered: 2026-04-24*
*Review-driven addendum: 2026-04-26 (D-32..D-40 + `<deferred>` toolchain items)*
