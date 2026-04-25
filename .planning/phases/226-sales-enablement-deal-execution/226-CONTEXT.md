# Phase 226: Sales Enablement and Deal Execution - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

<domain>
## Phase Boundary

Phase 226 ships the Sales Enablement Engine: Battlecard + DealBrief + ProofPack + DealRoom + ObjectionLibrary + ObjectionRecord + ProposalSupport + Quote + WinLossRecord + handoff_record + deal_health_signals. Hybrid ProofPack assembly (snapshot at approval + EvidenceMap claim TTL refresh). Hybrid DealBrief generation (auto-draft on Opportunity stage_change + operator approval). Battlecard freshness via EvidenceMap claim_ref TTL inheritance + last_verified_at. Class-based approval gates (internal auto, customer-facing approval-required). Quote-as-Snapshot (immutable PricingRecommendation reference, never owns price logic). Structured WinLossRecord with reason_taxonomy + buying_committee linkage. First-class DealRoom with stakeholder share-link + BotID + rate-limit + activity tracking. Cross-team handoff via P222 lifecycle_transitions + handoff_record + DealBrief regeneration. Read-write `/v1/sales/*` API + 8 MCP tools + 6 UI workspaces.

**In scope:** 19 new tables (16 SOR + 3 governance per D-91) (battlecards + objection_libraries + objection_records + deal_briefs + proof_packs + proof_pack_versions + deal_rooms + deal_room_artifacts + deal_room_views + proposal_supports + quotes + winloss_records + handoff_records + deal_health_signals + battlecard_versions). Public deal-room share endpoint `/share/dr/{token}` with BotID + rate-limit + view tracking. P225 deal_health_signals emit via cdp_events. P212 LearningCandidate emit on winloss_record close.

**Out of scope (deferred):**
- Full forecast model (probability + commit/best-case/worst-case) — P225 owns forecast; P226 only emits deal_health_signals.
- Pricing logic / discount engine / quote generation logic — P205 owns; P226 stores immutable Quote snapshot only.
- Visual deal room builder (drag-and-drop UX) — defer to v2; v1 = JSON-mode artifact list.
- Multi-language sales materials — defer to v2.
- Full proposal document generation (PDF assembly) — defer to v2; v1 ships ProposalSupport metadata + render-to-html only.
- AI-generated objection handlers (live conversation coaching) — defer.
- Customer-facing chat in DealRoom — defer.
- Salesforce / HubSpot CRM sync — defer to P228.
- Ecosystem co-sell partner workflows — P227.

P226 is ADDITIVE: existing playbooks.ts + execution.ts (P102/P103) keep working; sales enablement is a thin governance layer + deal-companion objects that consume P205/P209/P221/P222/P225 truth.
</domain>

<decisions>
## Implementation Decisions

### Object model (full doc 24 first-class)
- **D-01:** New `battlecards` SOR: `battlecard_id, tenant_id, competitor_name, competitor_profile_id (nullable), summary, strengths_to_acknowledge[], weaknesses_to_press[], ideal_positioning_angles[], risky_claims_to_avoid[], proof_refs[] (FK → proof_packs OR EvidenceMap claim_id), last_verified_at, version, status ∈ {draft, approved, archived}, freshness_status ∈ {fresh, stale_claims, stale_competitor, retired}, created_at, approved_by, approved_at`. RLS on tenant_id.
- **D-02:** New `objection_libraries` per-tenant: `library_id, tenant_id, name, status, version, owner_user_id`. New `objection_library_entries`: `entry_id, library_id, objection_text, response_text, evidence_refs[], pricing_context_id (nullable), competitor_profile_id (nullable), category ∈ {price, feature, timing, security, integration, support, contract, custom}, last_verified_at, freshness_status, version, status ∈ {draft, approved, archived}`. New `objection_records` per-deal: `record_id, opportunity_id, objection_text, response_text, evidence_refs[], raised_by_committee_member_id (FK → P222 buying_committee_members), addressed_at, addressed_by_user_id, status ∈ {open, addressed, deferred, resolved}`.
- **D-03:** New `deal_briefs` SOR (doc 24 first-class): `deal_brief_id, tenant_id, opportunity_id (FK → P222 opportunities), account_id (FK → P222 customer_360_records), objective, current_stage, stakeholders[] (FK → buying_committee_members), open_objections[] (FK → objection_records), required_artifacts[] (artifact_kind + status), recommended_next_steps[] (text + rationale + nba_id refs), pricing_context_id (FK → P205 PricingRecommendation), evidence_refs[] (FK → EvidenceMap), generation_kind ∈ {auto_drafted, operator_created, regenerated_on_handoff}, generated_by_run_id TEXT NULLABLE (FK -> markos_agent_runs.run_id which is TEXT per migration 53; D-88), version, status ∈ {draft, pending_approval, approved, archived}, approved_by, approved_at`. RLS on tenant_id.
- **D-04:** New `proof_packs` SOR (doc 24 first-class): `proof_pack_id, tenant_id, audience_type ∈ {executive, marketing_lead, finance, security, technical, customer_success}, name, summary, case_study_refs[], benchmark_refs[], roi_refs[], security_refs[], pricing_refs[] (FK → P205 PricingRecommendation), evidence_refs[] (FK → EvidenceMap), approval_state ∈ {draft, pending_approval, approved, retired}, freshness_status ∈ {fresh, stale_claims, retired}, version, snapshot_at, approved_by, approved_at`. New `proof_pack_versions` audit table: every approval = new row.
- **D-05:** New `deal_rooms` SOR: `deal_room_id, tenant_id, opportunity_id (FK), status ∈ {draft, live, closed}, share_link_token TEXT NOT NULL UNIQUE (HMAC-signed; NOT UUID — see D-86), share_link_expires_at, share_link_revoked_at TIMESTAMPTZ NULLABLE (D-86), share_link_signing_key_version SMALLINT NOT NULL DEFAULT 1 (D-86), last_activity_at, owner_user_id, public_share_enabled (bool), botid_required (bool, default true), rate_limit_per_ip (int, default 10), created_at, closed_at`. New `deal_room_artifacts`: `artifact_id, deal_room_id, artifact_kind ∈ {proof_pack, deal_brief, battlecard, quote, proposal_support, case_study, video, custom_html}, artifact_target_kind, artifact_target_id (UUID, polymorphic), display_order, status ∈ {visible, hidden}`. New `deal_room_views`: `view_id, deal_room_id, stakeholder_email (nullable), stakeholder_role (nullable, doc 18 BuyingRole enum), viewed_at, ip_hash, user_agent_hash, time_on_page_seconds`.
- **D-06:** New `proposal_supports` SOR: `proposal_id, tenant_id, opportunity_id, deal_brief_id (FK), pricing_context_id (FK → P205 — REFERENCE ONLY, no price logic), evidence_pack_id (FK → P209), executive_summary, customer_success_plan, terms_summary, status ∈ {draft, pending_approval, approved, sent, accepted, rejected, expired}, sent_to_email[], sent_at, valid_until, approved_by`.
- **D-07:** New `quotes` SOR (immutable PricingRecommendation snapshot per doc 24 rule 3): `quote_id, tenant_id, proposal_id (FK), pricing_recommendation_snapshot JSONB (full P205 record at snapshot time — IMMUTABLE), pricing_recommendation_id (FK → P205, original), snapshot_at, valid_until, status ∈ {draft, sent, accepted, rejected, expired, superseded_by}, superseded_by (FK self), customer_signature_evidence_ref (FK → EvidenceMap, nullable)`. NO price modification logic in P226.
- **D-08:** New `winloss_records` SOR (doc 24 first-class with structured taxonomy): `record_id, tenant_id, opportunity_id (FK), outcome ∈ {won, lost, no_decision, ghosted, postponed}, primary_reason ∈ {price, feature, timing, competitor, champion_left, budget_freeze, internal_priorities, security_compliance, integration_gap, support_concern, contract_terms, no_decision, custom}, secondary_reasons[] (same enum), competitive_set[] (competitor names + profile_ids), features_evaluated[] (feature_id refs to product features), objection_history[] (FK → objection_records), price_drivers[] (FK → quotes), champion_id (FK → buying_committee_members), decision_maker_id (FK → buying_committee_members), free_text_notes, attribution_touch_ids[] (FK → P225 attribution_touches for win attribution), recorded_at, recorded_by_user_id`.
- **D-09:** New `handoff_records` table for cross-team transitions: `handoff_id, tenant_id, opportunity_id (FK), customer_360_id (FK), from_role ∈ {marketing_owner, deal_owner, cs_owner}, to_role (same enum), from_user_id, to_user_id, summary, evidence_refs[], deal_brief_id (FK — regenerated brief), context_artifacts[] (artifact_kind + ref), handed_off_at, acknowledged_at, acknowledged_by_user_id`.
- **D-10:** New `deal_health_signals` table (computed): `signal_id, tenant_id, opportunity_id (FK), period_start, period_end, stage_velocity_score, objection_density_score, champion_engagement_score, competitive_threat_score, deal_health_score (composite 0-100), risk_factors[], computed_at, source_event_ref (UUID, threads to cdp_events for P225 forecast consumption)`.

### ProofPack assembly (hybrid)
- **D-11:** Snapshot at first approval — proof_packs.version = 1, snapshot_at = now(); claim_refs frozen; pricing_recommendation_snapshot stored. Subsequent approvals = new version row in proof_pack_versions (audit trail).
- **D-12:** Refresh on EvidenceMap claim TTL exceeded — P209 EvidenceMap freshness audit cron checks proof_packs.evidence_refs[]; any stale claim → proof_packs.freshness_status='stale_claims' + operator task. Re-approval creates new version.
- **D-13:** Pre-publish renderer fail-closed: any proof_pack.freshness_status != 'fresh' → render-time block + 503 + audit row (matches P224 D-19 pattern).

### DealBrief generation (hybrid auto-draft)
- **D-14:** Auto-draft trigger: P222 lifecycle_transitions hook fires `generateDealBrief(opportunity_id, trigger='stage_change'|'handoff'|'manual')` when Opportunity transitions to stage ∈ {sql, opportunity}. AgentRun (P207) wraps generation; LLM clause-fill via Vercel AI Gateway (P225 narrative pattern); claim audit (P209) every clause; pricing_context_id resolves via P205.
- **D-15:** Status='draft' on auto-creation; operator MUST approve before customer-facing use (D-25). Operator can edit clauses + regenerate sections + add/remove next_steps.
- **D-16:** Regeneration triggers: stage_change (any), handoff (P222 D-17 ownership tuple change), buying_committee.coverage_score change >10%, competitive_threat_score change >2σ. Each regeneration = new version row; old versions archived (audit).

### Battlecard freshness model
- **D-17:** EvidenceMap claim_ref TTL inheritance — battlecard.freshness_status computed as MIN(EvidenceMap.freshness_mode of all proof_refs[]). Any single stale claim → battlecard.freshness_status='stale_claims'.
- **D-18:** Per-battlecard `last_verified_at` operator-set timestamp; cron freshness audit fires when last_verified_at < (now - 90 days) → operator task.
- **D-19:** Auto-stale on competitor_profile_id underlying data change (P225 anomaly_detections.metric=competitive_signal_change → trigger battlecard freshness re-check); auto-stale on ConversionExperiment competitive_set (P224) change.
- **D-20:** Stale battlecard cannot be added to deal_room_artifacts; render-time fail-closed; operator task to re-verify.

### Proposal/quote boundary
- **D-21:** ProposalSupport NEVER owns price logic; references PricingRecommendation by id only. Quote-as-Snapshot stores immutable JSONB at snapshot_at — never modified after status='sent'.
- **D-22:** Pricing change after Quote.status='sent' → operator alerted; new Quote required (status='superseded_by' on old). Doc 24 rule 3.
- **D-23:** Quote.valid_until expiry → cron auto-flips status='expired'; operator task on Opportunity (Renew quote OR re-engage).
- **D-24:** Customer signature evidence_ref (when accepted) — operator uploads signed doc; signature evidence linked to EvidenceMap; quote.status flips 'accepted'.

### Approval gates (class-based)
- **D-25:** Internal materials (battlecard, objection_library, internal DealBrief, deal_health_signals) — auto-approve within sender role (sales_owner, cs_owner, account_owner per P222 D-16 ownership tuple).
- **D-26:** Customer-facing materials — ALWAYS approval-required (P208 Approval Inbox + P105 approval-package):
  - ProposalSupport publish (status: draft → pending_approval → approved → sent)
  - ProofPack approval (status: draft → pending_approval → approved)
  - DealRoom share-link enable (status: draft → live; share_link_token activated)
  - Quote send (status: draft → sent)
  - Customer-facing DealBrief variants
- **D-27:** Content classifier reuse (P223 D-16 + P224): pricing/claim/competitor copy scan blocks unbound material; pricing variables MUST resolve via P205 OR `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder.
- **D-28:** Re-engagement (Quote.valid_until expired + new Quote) → ALWAYS approval-required.

### DealRoom (first-class deal-room)
- **D-29:** Public share endpoint: `app/(public)/share/dr/[token]/page.tsx` — Next.js dynamic route; reads deal_rooms by share_link_token; renders deal_room_artifacts ordered by display_order; tracks deal_room_views (BotID gate + rate-limit per ip + honeypot, mirrors P224 D-25..D-28).
- **D-30:** Stakeholder views: deal_room_views row per page-load with ip_hash + user_agent_hash + viewed_at + time_on_page_seconds. NO PII in raw form (hash only).
- **D-31:** ISR caching per Vercel knowledge update — `cacheTag(${tenant_id}:deal_room:${deal_room_id})`; updateTag on artifact add/remove/status change.
- **D-32:** DealRoom expiry (share_link_expires_at) cron auto-closes status='live' → 'closed'; share endpoint returns 410 Gone.
- **D-33:** Rate-limit: 10 views/IP/min default; tenant-configurable. BotID required (default true).

### Cross-team handoff
- **D-34:** P222 D-17 ownership tuple change fires P226 handoff hook: `recordHandoff(opportunity_id, from_role, to_role, summary, evidence_refs[])`. Creates handoff_record + regenerates DealBrief (D-14/D-16) + emits cdp_events for P225 attribution.
- **D-35:** New owner gets P208 Approval Inbox entry "Acknowledge handoff for {opportunity_name}" — must acknowledge before next ownership change permitted. Audit on acknowledge.
- **D-36:** Doc 24 rule 7 "all teams work from same truth" — DealBrief regeneration is the canonical handoff context object. CRM tasks/notes are no longer the handoff vehicle.

### Forecast + risk (deal_health_signals)
- **D-37:** Computed deal_health_signals per Opportunity per period (default 24h):
  - `stage_velocity_score` = (avg time in current stage across closed-won / time in current stage for this opp); >1.0 = slower than average.
  - `objection_density_score` = open_objection_count × severity_weight / time_in_stage_days; high = many unresolved objections.
  - `champion_engagement_score` = recent activity events from champion_id / 7-day baseline.
  - `competitive_threat_score` = mention frequency of competitive_set in P225 conversion_events + lifecycle_transitions; high = competitor active.
  - `deal_health_score` = composite (weighted, 0-100); transparent formula in narratives.
- **D-38:** deal_health_signals emit cdp_events with event_domain='sales' for P225 consumption (forecast layer + risk_explanation narrative_kind).
- **D-39:** Threshold-driven decision rules (carry P225 D-18..D-21): `deal_health_score < 40` → operator task ("at-risk deal review"); `competitive_threat_score > 2σ` → battlecard refresh task.

### Win/loss + Learning feedback
- **D-40:** WinLossRecord creation triggered on Opportunity.stage transition to 'customer'/'lost'/'no_decision'. Operator REQUIRED to fill structured fields before stage_transition completes; UI blocks transition without WinLossRecord.
- **D-41:** WinLossRecord emits cdp_events with event_domain='sales' for P225 attribution_touches consumption + P212 LearningCandidate creation.
- **D-42:** P225 attribution_touch_ids[] on WinLossRecord enables "what created this win" cross-engine drill-down.

### API + MCP surface
- **D-43:** Read-write v1 `/v1/sales/*` API:
  - **Battlecards:** GET/POST/PATCH/DELETE `/v1/sales/battlecards`, POST `/v1/sales/battlecards/{id}/{verify|stale|approve}`.
  - **Objections:** GET/POST `/v1/sales/objections/libraries`, GET/POST `/v1/sales/objections/records`, POST `/v1/sales/objections/records/{id}/{address|defer|resolve}`.
  - **DealBriefs:** GET/POST `/v1/sales/deal-briefs`, POST `/v1/sales/deal-briefs/{id}/{regenerate|approve|archive}`.
  - **ProofPacks:** GET/POST `/v1/sales/proof-packs`, POST `/v1/sales/proof-packs/{id}/{approve|retire|refresh-claims}`.
  - **DealRooms:** GET/POST `/v1/sales/deal-rooms`, POST `/v1/sales/deal-rooms/{id}/{enable-share|close}`, GET `/v1/sales/deal-rooms/{id}/views`.
  - **Proposals:** GET/POST `/v1/sales/proposals`, POST `/v1/sales/proposals/{id}/{approve|send|mark-accepted|mark-rejected}`.
  - **Quotes:** GET/POST `/v1/sales/quotes`, POST `/v1/sales/quotes/{id}/{send|mark-accepted|mark-rejected|expire}`.
  - **WinLoss:** GET/POST `/v1/sales/winloss`.
  - **Handoffs:** GET `/v1/sales/handoffs`, POST `/v1/sales/handoffs/{id}/acknowledge`.
  - **Health:** GET `/v1/sales/deal-health/{opportunity_id}`.
  - **Public share:** GET `/share/dr/{token}` (unauth + BotID + rate-limit).
- **D-44:** MCP tools (8):
  - `get_battlecard` — battlecard by competitor + freshness check.
  - `assemble_proof_pack` — assemble or refresh proof_pack by audience_type.
  - `generate_deal_brief` — auto-draft DealBrief for an Opportunity.
  - `create_deal_room` — create draft DealRoom with artifact list.
  - `generate_quote` — snapshot PricingRecommendation into Quote.
  - `record_winloss` — submit structured WinLossRecord.
  - `list_open_objections` — open objections per Opportunity or competitor.
  - `get_handoff_brief` — read DealBrief for an inbound handoff (acknowledge).
- **D-45:** All write APIs honor approval-package pattern (D-25..D-28). Public share endpoint UNAUTHENTICATED but BotID/rate-limit/honeypot gated.

### UI surface
- **D-46:** Evolve operator shell + add 6 sales workspaces (P208 single-shell):
  - **SalesEnablementWorkspace** (`app/(markos)/sales/page.tsx`): Battlecard library + Objection library + ProofPack catalog + WinLoss feed.
  - **DealCockpit** (`app/(markos)/sales/deals/[id]/page.tsx`): Per-Opportunity workspace with DealBrief + open objections + deal_health_score + handoff_records + ProposalSupport + Quote + linked DealRoom.
  - **BattlecardEditor**: JSON-mode (carry P223 TemplateEditor pattern) + freshness inspector + claim_ref binding panel.
  - **ProofPackBuilder**: artifact picker + EvidenceMap claim selector + audience_type preview + approval CTA.
  - **WinLossAnalyzer**: structured form + analytics drill-down (P225 attribution_touches links) + reason taxonomy bar chart.
  - **DealRoomViewer**: artifact list editor + share-link generator + view tracking dashboard.
- **D-47:** Public share renderer: `app/(public)/share/dr/[token]/page.tsx` reads deal_room + artifacts; ISR cached; analytics events emit on view; expiry-aware.
- **D-48:** Approval Inbox (P208) gains: proposal_publish, proofpack_approve, deal_room_enable_share, quote_send, customer_dealbrief_publish, handoff_acknowledge entry types.
- **D-49:** Morning Brief (P208) surfaces: at-risk deals (deal_health_score < 40), pending approvals, stale battlecards, expired Quote.valid_until, open objections by deal owner.

### Observability + operator posture
- **D-50:** Freshness audit cron extends to battlecards + proof_packs (consumes P209 EvidenceMap freshness signals).
- **D-51:** DealRoom view spike alert (carry P224 D-50): >2σ from 7-day baseline → security operator task (potential leak).
- **D-52:** Handoff acknowledge SLA: if not acknowledged within 24h → escalation task to manager (operator-defined).
- **D-53:** WinLossRecord coverage: monthly cron checks closed Opportunities without WinLossRecord → operator task (compliance gap).

### Security + tenancy
- **D-54:** RLS on all 14+ new tables. Public share endpoint reads deal_rooms by share_link_token (NOT tenant_id) — token must be signed/HMAC to prevent enumeration.
- **D-55:** Audit trail mandatory on every approval + deal_room share-link enable + quote send + winloss creation + handoff record + battlecard verify. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-56:** Tombstone propagation (P221 D-24 → P222 D-32 → P224 → P225 D-45 → P226): when profile tombstoned, scrub winloss_records.champion_id + decision_maker_id + objection_records.raised_by_committee_member_id; preserve record audit trail with PII removed.
- **D-57:** Public share endpoint: BotID + rate-limit + honeypot + cookie-less view tracking; `share_link_token` NEVER appears in logs (mask in middleware).
- **D-58:** No raw user input in pricing fields; quotes.pricing_recommendation_snapshot is immutable + P205-derived.

### Contracts + migrations
- **D-59:** Fresh F-IDs allocated by planner (continue after P225 F-162). Expect 14-18 new contracts.
- **D-60:** New migrations allocated by planner (continue after P225 migration 145). Expect 10-13.

### Claude's Discretion
- Module boundary `lib/markos/sales/*` (battlecards, objections, deal-briefs, proof-packs, deal-rooms, quotes, proposals, winloss, handoffs, health-signals).
- LLM provider for DealBrief gen (recommend Vercel AI Gateway + claude-sonnet-4-6, mirror P225 pattern).
- deal_health_signals composite weights (start with equal-weighted; tune per P225 anomaly feedback).
- ISR cache TTL per artifact_kind in DealRoom.
- share_link_token format — LOCKED per D-86 (HMAC-signed opaque TEXT, scoped per-deal-room, key-rotation aware). NO LONGER discretion.


### Review-driven decisions (D-78..D-91) — added 2026-04-25 from 226-REVIEWS.md

- **D-78 (RH3 Architecture-lock):** Phase 226 ships against the actual repo runtime shape, NOT App Router. Pin: (a) API surface = legacy `api/v1/sales/*.js` flat handlers (NOT App Router `route.ts`); (b) auth helper = `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth` — that symbol does not exist); (c) OpenAPI command = `npm run openapi:build` (NOT `openapi-generate`); (d) test runner = `npm test` (Node `--test` runner, NOT vitest unless explicitly added in Plan 01 with package.json scripts task). App Router migration is OUT OF SCOPE for P226. Verified by repo enumeration 2026-04-25: `lib/markos/` actual dirs = audit, auth, billing, cli, contracts, crm, governance, identity, llm, mcp, orgs, outbound, packs, plugins, rbac, telemetry, tenant, theme, webhooks. NO sales/cdp/crm360/analytics/conversion/launches/pricing/channels dirs exist. `api/v1/` does NOT exist. Public route `app/(public)/share/dr/[token]/page.tsx` is the ONE Next.js App Router exception (public share doctrine).
- **D-79 (RH1 Approval helper symbol):** Approval packaging in P226 uses `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` (verified). The previously cited `lib/markos/crm/copilot.ts::createApprovalPackage` does NOT exist — `copilot.ts` exports `buildCopilotGroundingBundle`, `generateCopilotSummaryModel`, `packageRecommendationAction`, `buildCopilotWorkspaceSnapshot` only. All P226 customer-facing approval routing (D-26/D-28) imports `buildApprovalPackage` from `lib/markos/crm/agent-actions.js`.
- **D-80 (RH2 Greenfield framing for missing module trees):** `lib/markos/sales/*` (sub-modules: battlecards, objections, deal-briefs, proof-packs, deal-rooms, quotes, proposals, winloss, handoffs, health-signals, approvals, contracts, audit, evidence-map-adapter, agent-runs-adapter, cdp-adapter, content-classifier-adapter, attribution-adapter, learning-candidate-adapter, pricing-engine-adapter, lifecycle-adapter, narrative-adapter, share, lifecycle, tombstone, preflight) is GREENFIELD — created in P226. The phase MUST mark every module under `lib/markos/sales/*` explicitly as greenfield in `<read_first>` blocks (CREATE NEW: not "verified existing"). Cross-engine helpers cited in earlier drafts (`getClaimFreshness`, `fillNarrativeClauses`, `emitCdpEvent`, `runContentClassifier`, `getHandoffRecord`, `crm-projection`) DO NOT EXIST in repo today. P226 ships ADAPTER modules that fail-closed when their owning upstream phase has not shipped. Each adapter has a single contract: `assertUpstreamReady(): void` that throws `UPSTREAM_PHASE_NOT_LANDED` with the missing phase ID. NO silent degradation paths. NO "default to fresh + warning" fallback (RM1).
- **D-81 (RH3 API surface):** All P226 read/write APIs land as `api/v1/sales/*.js` legacy handlers. Handler shape: `module.exports = async function handler(req, res) { const ctx = await requireHostedSupabaseAuth({req, runtimeContext, operation: '<op-key>'}); /* ... */ }`. Public share endpoint exception: `app/(public)/share/dr/[token]/page.tsx` (Next.js page) + `api/v1/sales/public/share-track.js` (POST handler for view tracking — NOT auth-required, BotID + rate-limit + honeypot gated).
- **D-82 (RH4 Test runner):** P226 uses `npm test` (Node `--test` runner) for all unit/integration tests — `package.json` scripts as of 2026-04-25 only include `test`, `chromatic`, `openapi:build`. NO `vitest`, NO `playwright`, NO `supabase-types`, NO `openapi-generate` scripts. Plan 01 Wave 0 has Task 0.5 that audits `package.json` and either: (a) confirms existing scripts and rewrites all test invocations to `npm test -- test/sales/<slice>/...` (DEFAULT), OR (b) adds `vitest` + `playwright` scripts EXPLICITLY (with `npm install --save-dev vitest @playwright/test`) and updates package.json — operator-decided in Wave 0 step 1. The DEFAULT recommendation is (a). If E2E coverage of the public share page is required, ADD `playwright` script via task in Plan 05 with explicit dep install. NO assumed scripts.
- **D-83 (RH5 Quote-as-Snapshot DB-level immutability):** Plan 04 ships a Postgres `BEFORE UPDATE` trigger on the `quotes` table named `trg_quote_snapshot_immutable` that raises `EXCEPTION 'QUOTE_SNAPSHOT_IMMUTABLE'` when ANY of `pricing_recommendation_snapshot`, `total_cents` (if added), `line_items` (if added), `pricing_recommendation_id` are mutated AND the row's `status` is in `('sent', 'accepted', 'rejected', 'expired', 'superseded_by')`. Service-role writes are blocked at DB layer. Test connects as service-role + attempts direct `UPDATE` on a sent quote -> expects raise. App-layer `sendQuote` enforcement is now defense-in-depth, NOT primary. Migration: `supabase/migrations/156_quote_immutability_trigger.sql` (replaces previous slot 156 hot-path indexes; indexes move to 158).
- **D-84 (RH6 WinLoss required-on-transition DB-level):** Plan 05 ships a Postgres `BEFORE UPDATE` trigger on `opportunities` (P222 table) named `trg_opp_close_state_requires_winloss` that raises `EXCEPTION 'WINLOSS_RECORD_REQUIRED_FOR_CLOSE_STATE'` when `NEW.stage IN ('customer','lost','no_decision')` AND `OLD.stage NOT IN ('customer','lost','no_decision')` AND no `winloss_records` row exists with `opportunity_id = NEW.opportunity_id`. API-layer enforcement is now defense-in-depth. Test attempts service-role direct `UPDATE opportunities SET stage='lost'` without inserting a winloss_record -> expects raise. Migration: `supabase/migrations/157_opp_close_state_winloss_required.sql`.
- **D-85 (RH7 DealBrief lifecycle outbox):** Plan 03 lifecycle hook is implemented as an OUTBOX pattern, NOT in-transaction generation. Outbox table `sales_lifecycle_outbox` ships in migration `supabase/migrations/158_sales_lifecycle_outbox.sql` (NB: 158 reused — hot-path indexes move to 159 family): columns `outbox_id UUID PK, tenant_id, opportunity_id, trigger_kind ∈ {stage_change, ownership_change, coverage_score_change, competitive_threat_change, manual, tombstone_cascade}, payload_jsonb, status ∈ {pending, processing, completed, failed, dead_letter}, attempts INT DEFAULT 0, max_attempts INT DEFAULT 5, next_attempt_at, last_error, created_at, completed_at`. P222 lifecycle_transitions hook inserts an outbox row in the SAME transaction as the opportunity stage change (or rolls back together). A separate worker `lib/markos/sales/lifecycle/outbox-drain.ts` (cron handler in Plan 07) reads `pending` rows, processes them with `generateDealBrief`, marks `completed` or increments `attempts` + sets `next_attempt_at = now() + (2^attempts) minutes` on failure, transitions to `dead_letter` after `max_attempts`. Idempotent on re-process via outbox_id. Replayable via `UPDATE sales_lifecycle_outbox SET status='pending' WHERE status='dead_letter'`. Same outbox pattern reused for tombstone cascade per D-89.
- **D-86 (RH8 Public share security contract):** The public share endpoint `/share/dr/{token}` follows this PRECISE contract:
  - **Token format:** HMAC-SHA256-signed opaque text. Storage: `share_link_token TEXT NOT NULL UNIQUE` (NOT UUID). Token shape: `dr_v{key_version}_{base64url(deal_room_id)}_{base64url(hmac(deal_room_id, signing_key_v{key_version}))}`. Constant-time comparison via `crypto.timingSafeEqual`.
  - **Token scope:** Bound to single `deal_room_id` only. Verified by `verifyShareToken(token)` which (1) splits token, (2) extracts key_version, (3) loads signing key for that version, (4) recomputes HMAC, (5) timingSafeEqual against provided HMAC, (6) returns `{deal_room_id, key_version, valid: bool}`.
  - **Status code semantics (precise — resolves RH8 contradiction):**
    - Invalid signature (HMAC mismatch, malformed token, unknown key_version) -> `404 Not Found`. (No oracle on token existence.)
    - Valid signature, dealroom not found -> `404 Not Found`.
    - Valid signature, dealroom found, `share_link_revoked_at IS NOT NULL` -> `410 Gone`.
    - Valid signature, dealroom found, `share_link_expires_at < now()` OR `status='closed'` -> `410 Gone`.
    - Valid signature, dealroom found, `status='live'`, not expired, not revoked -> `200 OK` (render page).
  - **Token revocation:** Plan 05 ships `revokeDealRoomShareLink(deal_room_id)` setting `share_link_revoked_at = now()`. Once revoked, a NEW token is required. Revocation gate: `verifyShareToken` checks `share_link_revoked_at IS NULL` AFTER signature verification.
  - **Audit trail beyond view rows:** Plan 05 ships a separate `deal_room_share_audit` table (migration 160): `audit_id UUID PK, tenant_id, deal_room_id, event_kind ∈ {token_minted, token_verified_ok, token_verified_invalid_sig, token_verified_revoked, token_verified_expired, token_revoked, page_rendered, page_404, page_410}, ip_hash, user_agent_hash, key_version, request_id, created_at`. EVERY token-based access produces a row, regardless of outcome. (`deal_room_views` rows continue to capture only successful renders for analytics.)
  - **HMAC key rotation:** 90-day cadence (operator-driven cron). New key adds row to `deal_room_share_signing_keys` (migration 159): `key_version SMALLINT PK, signing_key_encrypted, status ∈ {active, retiring, retired}, activated_at, retired_at`. During 24-hour grace period after a rotation, the OLD key is `retiring` (still verifies), and the NEW key is `active` (signs new tokens). After 24 hours, OLD key flips to `retired` (verification fails on tokens signed with retired keys -> `404`).
  - **Per-dealroom scope:** Token format binds to exactly one `deal_room_id`. Cross-dealroom token reuse is impossible by construction.
- **D-87 (RH10 Dependency go/no-go gate — NO silent degradation):** Per CLAUDE.md drift rule and RH10 finding, P226 hard-fails on missing P205/P209/P221/P222/P225 modules. Plan 01 Task 0.5 (Wave 0) runs `lib/markos/sales/preflight/upstream-gate.ts::assertUpstreamReady()` which checks for ALL of: P205 pricing-recommendation exports, P209 evidence-map exports, P221 cdp-events exports, P222 lifecycle-transitions exports, P225 attribution-touches exports. If ANY missing -> exits 1 with route-back error: `ROUTE_BACK_REQUIRED: Phase 226 cannot ship without [P{N}]. Per CLAUDE.md drift rule, escalate to user before continuing.` This REPLACES the previous A21 / A5 / A14 / A15 / A24 fallbacks. Removed entirely: "fresh + warning" evidence fallback (RM1), pricing placeholder fallback for active disbursement, audit-log fallback for CDP emit, manual-only lifecycle fallback. The ONE exception per CLAUDE.md is `{{MARKOS_PRICING_ENGINE_PENDING}}` text COPY in customer-facing surfaces (NOT an active fallback for actual pricing logic).
- **D-88 (RM5 generated_by_run_id type):** `deal_briefs.generated_by_run_id` is `TEXT NULLABLE` (FK -> `markos_agent_runs.run_id` which is `TEXT PRIMARY KEY` per `supabase/migrations/53_agent_run_lifecycle.sql:8`). Earlier drafts modeled it as UUID — corrected. Migration 149 (`deal_briefs`) creates `generated_by_run_id TEXT NULLABLE REFERENCES markos_agent_runs(run_id)`.
- **D-89 (RM2 Tombstone cascade outbox):** Plan 05 tombstone propagation reuses the D-85 outbox pattern. Tombstone INSERT in `markos_profile_tombstones` (P221) inserts cascade-outbox rows in `sales_lifecycle_outbox` with `trigger_kind='tombstone_cascade'` for each affected target table (winloss_records, objection_records, deal_room_views). Worker `lib/markos/sales/tombstone/cascade-drain.ts` (cron in Plan 07) processes each row idempotently. REPLACES the earlier "best-effort scrub" framing. Governance claim now correctly asserts: eventually-consistent via outbox with retry + dead-letter, NOT "fully wired cascade" or "best-effort".
- **D-90 (RM3 Rate-limit primitive — purpose-built):** `lib/markos/auth/rate-limit.ts::checkSignupRateLimit` is signup-specific (per `ip + email` per-signup) — NOT general. Plan 05 ships a NEW general purpose rate limiter `lib/markos/sales/share/rate-limit-public-share.ts` exposing `checkPublicShareRateLimit({ip_hash: string, deal_room_id: string, window_ms: number, max_per_window: number}): Promise<{allowed: boolean; remaining: number; retry_after_seconds: number; used: number}>` backed by `@upstash/ratelimit` (already in package.json deps). Default policy: 10 requests / IP / minute / deal_room (per D-33). `checkSignupRateLimit` is NOT reused for public share.
- **D-91 (RM4 Table count reconciled):** P226 ships **16 base SOR tables** (battlecards, battlecard_versions, objection_libraries, objection_library_entries, objection_records, proof_packs, proof_pack_versions, deal_briefs, deal_rooms, deal_room_artifacts, deal_room_views, proposal_supports, quotes, winloss_records, handoff_records, deal_health_signals). PLUS 3 governance tables added by D-83/D-85/D-86/D-89/D-90 fixes: `sales_lifecycle_outbox` (D-85/D-89), `deal_room_share_audit` (D-86), `deal_room_share_signing_keys` (D-86). Total = 19 tables. Migration count: 14 (146..159: 10 SOR + 1 quote-trigger + 1 winloss-trigger + 1 outbox + 1 share-audit + 1 signing-keys; original 156 hot-path-indexes deferred or absorbed by 158/159 governance). Contract count: 18 unchanged (governance tables ship migrations only, no public contracts).

### Folded Todos
None — no pending todos matched Phase 226 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (precedence 1-2)
- `obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md` — informational; canonical = `obsidian/reference/*` once distilled. 7 core rules, Battlecard + DealBrief + ProofPack + DealRoom shapes.
- `obsidian/work/incoming/18-CRM-ENGINE.md` — informational; CRM Customer360 + Opportunity + buying_committee consumed.
- `obsidian/brain/MarkOS Canon.md`.
- `obsidian/brain/Brand Stance.md`.
- `obsidian/brain/Pricing Engine Canon.md` — Quote-as-Snapshot rule (D-21..D-24); pricing-touching content {{MARKOS_PRICING_ENGINE_PENDING}}.
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`.
- `obsidian/reference/Contracts Registry.md`.
- `obsidian/reference/Database Schema.md`.
- `obsidian/reference/Core Lib.md`.
- `obsidian/reference/HTTP Layer.md` — `/v1/sales/*` conventions.
- `obsidian/reference/UI Components.md`.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 226 + dep graph (205, 209, 221, 222, 225).
- `.planning/REQUIREMENTS.md` — SEN-01..05, CRM-01..05 (carry), PRC-01..09 (carry), EVD-01..06 (carry), QA-01..15.
- `.planning/STATE.md`.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.
- `.planning/phases/226-sales-enablement-deal-execution/DISCUSS.md`.
- `.planning/phases/226-sales-enablement-deal-execution/226-RESEARCH.md` — refresh at plan-phase.

### Prior phase decisions Sales Enablement must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — RLS + audit.
- `.planning/phases/103-sales-and-success-execution-workspace/103-CONTEXT.md` — execution workspace + bounded actions consumed.
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package pattern (D-25..D-28).
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — public signup BotID pattern (D-29 deal_room share).
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md` — Pricing Engine PricingRecommendation consumed by Quote-as-Snapshot (D-21..D-24).
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun wraps DealBrief gen (D-14).
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief (D-48/D-49).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL + freshness rules (D-11..D-13, D-17..D-20).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — {{MARKOS_PRICING_ENGINE_PENDING}} (D-27).
- `.planning/phases/212-learning-literacy-evolution/212-CONTEXT.md` — LearningCandidate emission target (D-41).
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-08 cdp_events, D-24 tombstone propagation.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-12 lifecycle_transitions hook (D-14/D-34), D-14/D-15 buying_committees consumed, D-17 ownership tuple → handoff (D-34..D-36).
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — D-16 content classifier reused (D-27).
- `.planning/phases/224-conversion-launch-workspace/224-CONTEXT.md` — D-25..D-28 BotID + rate-limit + honeypot pattern reused (D-29/D-33), D-21..D-24 ConversionExperiment (D-19 competitive_set linkage).
- `.planning/phases/225-analytics-attribution-narrative-intelligence/225-CONTEXT.md` — D-13..D-17 narrative gen (D-14 DealBrief), D-22..D-25 experiment_winners (D-19 competitive_set), D-26/D-27 pricing_signals (D-22 quote-supersede), D-28..D-30 cross-tenant aggregation (D-37 deal_health), attribution_touches (D-42 win attribution).

### Existing code anchors
- `lib/markos/crm/playbooks.ts` (P102/P103) — bounded actions reused.
- `lib/markos/crm/execution.ts` (P103) — urgency + risk + bounded action pattern.
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` (P105).
- `lib/markos/sales/cdp-adapter.ts` (GREENFIELD; wraps P221 cdp_events; D-80). NO `lib/markos/cdp/*` exists today.
- `lib/markos/sales/lifecycle-adapter.ts` + `lib/markos/sales/agent-runs-adapter.ts` (GREENFIELD; wrap P222 modules; D-80). NO `lib/markos/crm360/*` exists today.
- `lib/markos/sales/content-classifier-adapter.ts` (GREENFIELD; wraps P223 content classifier; D-80). NO `lib/markos/channels/*` exists today.
- BotID: `lib/markos/auth/botid.ts::verifyBotIdToken` (verified). Rate-limit: NEW `lib/markos/sales/share/rate-limit-public-share.ts` per D-90.
- `lib/markos/sales/lifecycle/outbox-drain.ts` (GREENFIELD per D-85; outbox pattern, NOT runbook). NO `lib/markos/launches/*` exists today.
- `lib/markos/sales/narrative-adapter.ts` + `lib/markos/sales/attribution-adapter.ts` (GREENFIELD; wrap P225 modules; D-80). Hard-fail when P225 absent (D-87).
- AgentRun (P207).
- Vercel AI Gateway (knowledge update).
- Vercel Cron + Edge Config + BotID (P201/P224).
- markos_audit_log (P201 hash chain).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` — D-25..D-28 approval-package factory.
- `lib/markos/sales/lifecycle-adapter.ts` (GREENFIELD; wraps P222 lifecycle_transitions when P222 lands — D-80). Outbox writes per D-85.
- `lib/markos/sales/agent-runs-adapter.ts` (GREENFIELD; reads buying_committees from P222 — D-80).
- `lib/markos/sales/cdp-adapter.ts` (GREENFIELD; reads ConsentState + AudienceSnapshot from P221 — D-80).
- `lib/markos/sales/content-classifier-adapter.ts` (GREENFIELD; wraps P223 content classifier — D-80).
- BotID: `lib/markos/auth/botid.ts::verifyBotIdToken` (verified). Rate-limit: NEW `lib/markos/sales/share/rate-limit-public-share.ts` per D-90 (NOT `checkSignupRateLimit`). Honeypot: NEW field on `deal_room_views` per Plan 07.
- `lib/markos/sales/lifecycle/outbox-drain.ts` (GREENFIELD per D-85; outbox not runbook — P224 not landed).
- `lib/markos/sales/narrative-adapter.ts` (GREENFIELD; wraps P225 narrative gen + claim audit — D-80). Hard-fails when P225 absent (D-87).
- `lib/markos/sales/attribution-adapter.ts` (GREENFIELD; wraps P225 attribution_touches — D-80).
- `markos_audit_log` (P201).

### Established patterns
- Polymorphic ref via target_kind + target_id + per-kind FK CHECK (P224 D-14 LaunchSurface; carry to deal_room_artifacts).
- Single fan-out emit() + fail-closed transaction (P222 D-29 + P223 D-29 + P224 D-33 + P225 D-26 + P226 D-38 deal_health_signals).
- Approval-package per high-risk mutation (P105 + P208).
- Hybrid template + LLM gen with claim audit (P225 D-13..D-17 + P226 D-14 DealBrief).
- ISR cacheTag/updateTag synchronous on publish/rollback (P224 D-30/D-31 + P226 D-31 deal_room).
- BotID + rate-limit + honeypot for public surfaces (P201 + P224 D-25..D-28 + P226 D-29/D-33).
- Tombstone propagation cascade (P221 D-24 → P222 D-32 → P224 → P225 D-45 → P226 D-56).
- Snapshot at approval + EvidenceMap claim TTL refresh (P224 D-19 → P226 D-11..D-13 ProofPack).
- Class-based approval (internal auto, customer-facing required) — new pattern in P226.

### Integration points
- **Upstream:** Customer360 + Opportunity + buying_committees + lifecycle_transitions + nba_records (P222), ConsentState + cdp_events + tombstone (P221), content_classifier + channel templates (P223), conversion_events + ConversionExperiment + LaunchOutcome (P224), attribution_touches + narratives + EvidenceMap (P225 + P209), PricingRecommendation (P205), AgentRun (P207), Approval Inbox (P208), {{MARKOS_PRICING_ENGINE_PENDING}} (P211), LearningCandidate (P212).
- **Downstream P227:** consumes Battlecard + ProofPack + DealRoom artifact_kind for partner co-sell + ecosystem distribution.
- **Downstream P228:** consumes deal_health_signals + WinLossRecord for cross-engine integration audit.
- **P225 forecast:** deal_health_signals via cdp_events.
- **P212 learning:** WinLossRecord → LearningCandidate.
- **Public:** /share/dr/{token} unauth + BotID + rate-limit.
- **Audit:** markos_audit_log every mutation.

</code_context>

<specifics>
## Specific Ideas

- "Every deal should inherit system memory, not restart from zero" (doc 24 rule 1) — D-14 auto-draft DealBrief on stage_change inherits Customer360 + buying_committees + open_objections + nba_records.
- "Proof must be assembled from governed evidence, not rep folklore" (doc 24 rule 2) — D-04 ProofPack stores claim_refs to EvidenceMap; D-11..D-13 freshness gate.
- "Pricing promises must come from approved pricing posture" (doc 24 rule 3) — D-21..D-24 Quote-as-Snapshot; never owns pricing logic.
- "Competitive response must be structured and current" (doc 24 rule 4) — D-17..D-20 Battlecard freshness via EvidenceMap inheritance + competitor_profile_id auto-stale.
- "Enablement must create faster action, not more content clutter" (doc 24 rule 5) — D-14 auto-draft + class-based approval (D-25 internal auto-approve) reduces friction.
- "Forecast and risk should be explainable" (doc 24 rule 6) — D-37 deal_health_signals composite formula transparent + emitted to P225 narratives.
- "Marketing, sales, CS, support, and finance must work from the same truth" (doc 24 rule 7) — D-34..D-36 handoff_record + DealBrief regeneration is canonical handoff vehicle.
- DealRoom share-link reuses Vercel BotID + rate-limit pattern from P224 (D-29/D-33) — proven defense-in-depth.
- WinLossRecord reason_taxonomy enum is the contract for P225 narrative generation + P212 LearningCandidate (D-41); not freeform.

</specifics>

<deferred>
## Deferred Ideas

### For future commercial-engine phases
- Ecosystem co-sell partner workflows (PartnerProofPack + co-branded DealRoom) → P227.
- Commercial OS integration closure (cross-engine deal_health audit + Salesforce/HubSpot sync) → P228.

### For future sales-enablement enrichment
- Visual deal room builder (drag-and-drop UX) — defer to v2 (carry P224 D-04 pattern).
- AI-generated objection handlers (live conversation coaching, real-time call analysis) — defer.
- Customer-facing chat in DealRoom — defer.
- PDF proposal document generation (full document assembly) — v1 ships ProposalSupport metadata + render-to-html only.
- Multi-language sales materials — defer to v2.
- Battlecard/ProofPack template marketplace — defer.
- Deal forecast probability ML model (commit/best-case/worst-case) → P225 owns forecast layer; P226 only emits health signals.
- Quote discount engine / pricing logic → P205 owns; never P226.
- Sales call recording integration (Gong/Chorus) — defer.
- Predictive deal-loss model — defer to P225 + ML.
- ProofPack A/B testing — defer.
- Public DealRoom pricing display with competitor comparison — defer (security-sensitive).

### Reviewed Todos (not folded)
None — no pending todos matched Phase 226 scope.

### Architecture-fixed items routed elsewhere (D-78..D-91 review-driven, 2026-04-25)

- App Router migration of `api/v1/sales/*` from legacy `api/*.js` -> DEFERRED to a future cross-cutting App Router migration phase (NOT P226). P226 ships against legacy convention per D-78/D-81.
- General-purpose rate-limit primitive replacing `checkSignupRateLimit` for ALL public surfaces -> DEFERRED. P226 ships only `lib/markos/sales/share/rate-limit-public-share.ts` (D-90) for its public share endpoint. A consolidated cross-engine rate-limiter is NOT P226's scope.
- Hard go/no-go on P205/P209/P221/P222/P225 -> routed to Plan 01 Task 0.5 preflight (D-87). If any upstream missing, P226 routes back to that phase. NO silent degradation.
- "Fresh + warning" evidence fallback -> REMOVED entirely (D-87 + RM1). EvidenceMap absence is fail-closed at all customer-facing render paths.
- Pricing placeholder fallback for ACTIVE disbursement -> REMOVED (D-87). `{{MARKOS_PRICING_ENGINE_PENDING}}` retained ONLY for customer-facing copy text per Pricing Engine Canon.
- Audit-log fallback for CDP emit -> REMOVED (D-87). cdp-adapter throws if P221 absent.
- Manual-only lifecycle fallback -> REMOVED (D-87). lifecycle-adapter throws if P222 absent.
- Vitest / Playwright / supabase-types / openapi-generate scripts -> NOT auto-added. D-82 default uses `npm test` (Node test runner). Operator must explicitly add scripts via Plan 01 Task 0.5 if needed.


</deferred>

---

*Phase: 226-sales-enablement-deal-execution*
*Context gathered: 2026-04-24*
