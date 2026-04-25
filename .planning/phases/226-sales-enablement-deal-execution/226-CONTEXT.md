# Phase 226: Sales Enablement and Deal Execution - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

<domain>
## Phase Boundary

Phase 226 ships the Sales Enablement Engine: Battlecard + DealBrief + ProofPack + DealRoom + ObjectionLibrary + ObjectionRecord + ProposalSupport + Quote + WinLossRecord + handoff_record + deal_health_signals. Hybrid ProofPack assembly (snapshot at approval + EvidenceMap claim TTL refresh). Hybrid DealBrief generation (auto-draft on Opportunity stage_change + operator approval). Battlecard freshness via EvidenceMap claim_ref TTL inheritance + last_verified_at. Class-based approval gates (internal auto, customer-facing approval-required). Quote-as-Snapshot (immutable PricingRecommendation reference, never owns price logic). Structured WinLossRecord with reason_taxonomy + buying_committee linkage. First-class DealRoom with stakeholder share-link + BotID + rate-limit + activity tracking. Cross-team handoff via P222 lifecycle_transitions + handoff_record + DealBrief regeneration. Read-write `/v1/sales/*` API + 8 MCP tools + 6 UI workspaces.

**In scope:** 10 new tables (battlecards + objection_libraries + objection_records + deal_briefs + proof_packs + proof_pack_versions + deal_rooms + deal_room_artifacts + deal_room_views + proposal_supports + quotes + winloss_records + handoff_records + deal_health_signals + battlecard_versions). Public deal-room share endpoint `/share/dr/{token}` with BotID + rate-limit + view tracking. P225 deal_health_signals emit via cdp_events. P212 LearningCandidate emit on winloss_record close.

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
- **D-03:** New `deal_briefs` SOR (doc 24 first-class): `deal_brief_id, tenant_id, opportunity_id (FK → P222 opportunities), account_id (FK → P222 customer_360_records), objective, current_stage, stakeholders[] (FK → buying_committee_members), open_objections[] (FK → objection_records), required_artifacts[] (artifact_kind + status), recommended_next_steps[] (text + rationale + nba_id refs), pricing_context_id (FK → P205 PricingRecommendation), evidence_refs[] (FK → EvidenceMap), generation_kind ∈ {auto_drafted, operator_created, regenerated_on_handoff}, generated_by_run_id (FK → markos_agent_runs), version, status ∈ {draft, pending_approval, approved, archived}, approved_by, approved_at`. RLS on tenant_id.
- **D-04:** New `proof_packs` SOR (doc 24 first-class): `proof_pack_id, tenant_id, audience_type ∈ {executive, marketing_lead, finance, security, technical, customer_success}, name, summary, case_study_refs[], benchmark_refs[], roi_refs[], security_refs[], pricing_refs[] (FK → P205 PricingRecommendation), evidence_refs[] (FK → EvidenceMap), approval_state ∈ {draft, pending_approval, approved, retired}, freshness_status ∈ {fresh, stale_claims, retired}, version, snapshot_at, approved_by, approved_at`. New `proof_pack_versions` audit table: every approval = new row.
- **D-05:** New `deal_rooms` SOR: `deal_room_id, tenant_id, opportunity_id (FK), status ∈ {draft, live, closed}, share_link_token (UUID, unique), share_link_expires_at, last_activity_at, owner_user_id, public_share_enabled (bool), botid_required (bool, default true), rate_limit_per_ip (int, default 10), created_at, closed_at`. New `deal_room_artifacts`: `artifact_id, deal_room_id, artifact_kind ∈ {proof_pack, deal_brief, battlecard, quote, proposal_support, case_study, video, custom_html}, artifact_target_kind, artifact_target_id (UUID, polymorphic), display_order, status ∈ {visible, hidden}`. New `deal_room_views`: `view_id, deal_room_id, stakeholder_email (nullable), stakeholder_role (nullable, doc 18 BuyingRole enum), viewed_at, ip_hash, user_agent_hash, time_on_page_seconds`.
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
- share_link_token format (recommend HMAC-signed UUID with tenant prefix).

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
- `lib/markos/crm/copilot.ts::createApprovalPackage` (P105).
- `lib/markos/cdp/adapters/crm-projection.ts` (P221).
- `lib/markos/crm360/*` (P222) — Customer360 + Opportunity + buying_committees + nba_records + lifecycle_transitions hook.
- `lib/markos/channels/*` (P223) — content classifier reused.
- `lib/markos/conversion/*` (P224) — BotID/rate-limit/honeypot pattern.
- `lib/markos/launches/runbook/*` (P224) — runbook execution pattern reused for deal-step.
- `lib/markos/analytics/*` (P225) — narrative gen + claim audit + attribution_touches consumed.
- AgentRun (P207).
- Vercel AI Gateway (knowledge update).
- Vercel Cron + Edge Config + BotID (P201/P224).
- markos_audit_log (P201 hash chain).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/crm/copilot.ts::createApprovalPackage` — D-25..D-28 approval-package factory.
- `lib/markos/crm360/lifecycle/transitions.ts` (P222) — handoff hook target for D-34.
- `lib/markos/crm360/buying-committees/*` (P222) — champion_id + decision_maker_id refs.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState + AudienceSnapshot reads.
- `lib/markos/channels/templates/content-classifier.ts` (P223) — pricing/claim/competitor scan reused (D-27).
- `lib/markos/conversion/forms/form-renderer.tsx` (P224) — BotID + rate-limit + honeypot pattern for public share (D-29/D-33).
- `lib/markos/launches/runbook/executor.ts` (P224) — AgentRun-wrapped runbook pattern; reuse for deal-step.
- `lib/markos/analytics/narrative/*` (P225) — narrative gen + claim audit reused (D-14 DealBrief).
- `lib/markos/analytics/attribution/*` (P225) — attribution_touches consumed (D-42).
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

</deferred>

---

*Phase: 226-sales-enablement-deal-execution*
*Context gathered: 2026-04-24*
