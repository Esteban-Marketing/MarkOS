# Phase 227: Ecosystem, Partner, Community, and Developer Growth - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning (revised post-Codex review 2026-04-25)
**Mode:** discuss (interactive, --chain) → reviews (replan with Codex feedback)

<domain>
## Phase Boundary

Phase 227 ships the Ecosystem Engine: IntegrationListing + PartnerProfile + ReferralProgram + AffiliateProgram + CommunitySignal + DeveloperEvent + CertificationRecord + CoSellOpportunity + ecosystem-extended attribution_touches metadata + fraud_signals + payout_credits. Plugin registry stays runtime-only; ecosystem business SOR sits separately with read-through adapter (P221 D-20 pattern). Certification first-class state machine + criteria_checks + recertification cron. P220 SaaS-mode tables EXTENDED via business_mode discriminator (single source of truth). Webhook adapters per community source + signed verification + dedupe + ConsentState gate. CoSellOpportunity links P222 Opportunity + PartnerProfile + LaunchSurface partner_pack + DealRoom + handoff_record. Ecosystem attribution = P225 attribution_touches + nullable FK columns (single ledger). Read-heavy v1 install (operator-mediated). Public marketplace + dev-portal SSR + ISR + BotID + rate-limit. Read-write `/v1/ecosystem/*` API + 8 MCP tools + 7 UI workspaces + public `/marketplace/*` + `/developers/*` shells.

**In scope:** ~12 new tables (integration_listings + partner_profiles_extended + referral_programs_extended + affiliate_programs + community_signals + developer_events + certification_records + co_sell_opportunities + fraud_signals + payout_credits + listing_views + install_requests; plus extensions to P220 referral_programs/community_profiles/marketing_events/partnerships and P225 attribution_touches; plus 2 new audit/governance tables added in revision: fraud_review_queue + webhook_subscription_health).

**Out of scope (deferred):**
- Full Stripe Connect payout integration (KYC + 1099 + tax) — defer beyond P228; v1 = manual CSV export.
- Self-serve third-party plugin install (auto-execute) — defer; v1 = operator-mediated install_request.
- External certification body API (third-party verifier) — defer.
- Customer-facing marketplace install with billing — defer to P228 commerce-stack closure.
- Co-marketing campaign automation (joint launches with auto-shared content) — partial via P224 LaunchSurface(partner_pack); full automation defer.
- Real-time community signal streaming — defer (Vercel Cron + webhook poll fallback v1).
- ML-based fraud detection — defer; rule engine + manual review v1.
- Ecosystem leaderboards / public rankings — defer.
- Affiliate ML attribution model (multi-touch beyond P225 attribution) — defer.
- Developer SDK auto-publish to npm/PyPI — defer.

P227 is ADDITIVE + EXTENDS P220 SaaS-mode tables (no replacement); plugin registry preserved as runtime substrate.
</domain>

<decisions>
## Implementation Decisions

### Object model (full doc 25 — 9 first-class objects)
- **D-01:** New `integration_listings` SOR (doc 25 first-class): `listing_id, tenant_id (NULL = markos-global), category ∈ {connector, plugin, agent, template, workflow, integration}, name, description, owner_type ∈ {markos, partner, developer}, owner_partner_id (FK, nullable), plugin_manifest_id (FK READ-THROUGH to runtime plugin registry, nullable), certification_state ∈ {draft, review, certified, suspended, expired, revoked}, current_certification_id (FK → certification_records), docs_url, install_surface, listing_url_slug (unique), pricing_model ∈ {free, freemium, subscription, usage, contact_sales, partner_negotiated}, support_url, status ∈ {active, hidden, archived}, view_count, install_count, last_certified_at, RLS`. Public marketplace surface reads where status='active' AND certification_state='certified' AND latest cert.expires_at > now() (TRIPLE gate per D-75).
- **D-02:** Extend P220 `partner_profiles` (originally SaaS-mode) with new columns: `business_mode ∈ {saas, commerce, ecosystem, all}` (added; backfill existing rows = 'saas'), `partner_type ∈ {agency, technology, consulting, reseller, affiliate, integrator, devshop, association}`, `region`, `specialization_tags[]`, `certification_level ∈ {registered, certified, elite}` (current + historical via certification_records), `active_status ∈ {active, watch, paused, terminated}`, `co_sell_enabled` (bool), `referral_enabled` (bool), `affiliate_enabled` (bool), `public_directory_visible` (bool, default false), `commission_share_default`, `revenue_attribution_partner_id` (FK self for parent-partner relationships), **`payout_compliance_acknowledged_at` (timestamptz NULL — D-71 / RH4 — set via 227-04 acknowledgement flow)**.
- **D-03:** Extend P220 `referral_programs` with: `business_mode`, `scope ∈ {tenant, marketplace}`, `fraud_controls[]`, `payout_settings JSONB`, `qualification_rule JSONB`, `approval_required` (bool, default true for marketplace scope), `partner_id` (FK, nullable).
- **D-04:** New `affiliate_programs` SOR.
- **D-05:** New `community_signals` SOR (doc 25 first-class).
- **D-06:** New `developer_events` SOR.
- **D-07:** New `certification_records` SOR (audit history per certification).
- **D-08:** New `co_sell_opportunities` SOR.

### Plugin registry ↔ IntegrationListing (read-through adapter)
- **D-09:** Plugin registry STAYS runtime-only. No schema mutation. New `lib/markos/ecosystem/adapters/plugin-registry.ts::getPluginManifest(registry, plugin_manifest_id)` exposes capabilities + IAM roles + route ownership for IntegrationListing rendering. **Per D-68 — uses resolvePlugin (not lookupPlugin).**
- **D-10:** IntegrationListing.plugin_manifest_id is a FK READ reference (no FK enforced at DB level). markos-owned listings reference manifests; partner-owned listings reference partner-published manifests via partner_id.
- **D-11:** Runtime plugin install (loader.js) NEVER triggers IntegrationListing mutations.

### P220 overlap (extend, not duplicate)
- **D-12:** Extend P220 schema migrations (additive ALTER TABLE).
- **D-13:** Single source of truth — `WHERE business_mode IN ('saas', 'commerce', 'ecosystem', 'all')`.
- **D-14:** New tables are P227-only.

### Certification workflow (state machine)
- **D-15:** certification_records state machine: `draft → review → certified → expired → review (recertification)`; `certified → suspended ↔ certified` (operator override); `* → revoked` (terminal).
- **D-16:** criteria_checks JSONB per-criterion bound to P209 EvidenceMap claim_id when applicable.
- **D-17:** Recertification cron (daily 03:00 UTC).
- **D-18:** Revoked = terminal.
- **D-19:** Operator review queue: pending certifications surfaced in P208 Approval Inbox.

### Fraud + payout (Referral + Affiliate)
- **D-20:** New `fraud_signals` SOR.
- **D-21:** Fraud rule engine reuses P225 D-18..D-21 decision_rules pattern.
- **D-22:** New `payout_credits` SOR (internal credit ledger). **Status enum per D-70 = ['earned','cleared','exported','paid','voided','disputed'].**
- **D-23:** Manual payout export — cron weekly Sunday 04:00 UTC. {{MARKOS_PRICING_ENGINE_PENDING}} placeholder. **Per D-71 — gated on tenant payout_compliance_acknowledged_at.**
- **D-24:** Payout dispute flow.

### CommunitySignal ingestion
- **D-25:** Webhook adapters per source.
- **D-26:** Dedupe via `source_message_id` UNIQUE constraint.
- **D-27:** ConsentState gate.
- **D-28:** Routing — community signals fed to P225 decision_rules engine.
- **D-29:** Webhook fallback — scheduled poll. **Per D-76 — uses webhook_subscription_health table.**

### Partner co-sell workflow
- **D-30:** CoSellOpportunity creation.
- **D-31:** State machine: proposed → accepted → active → {won, lost, withdrawn}.
- **D-32:** Commission share + rev_share_terms_id immutable post-acceptance. **Per D-79 — DB trigger enforces, not just app layer.**
- **D-33:** Partner-facing surfaces.

### Ecosystem attribution (single ledger)
- **D-34:** Extend P225 `attribution_touches` (NO new attribution table). **Per D-78 — all 6 ecosystem FK columns are ENFORCED REFERENCES (not soft).**
- **D-35:** P225 attribution_models re-evaluate ecosystem touches.
- **D-36:** Single ledger preserved.

### Marketplace listing + install workflow (read-heavy v1)
- **D-37:** v1 = read-heavy discovery + operator-mediated install.
- **D-38:** New `install_requests` SOR.
- **D-39:** New `listing_views` SOR (analytics).

### Public marketplace + dev-portal delivery
- **D-40:** Next.js dynamic route + ISR.
- **D-41:** Sitemap.xml regenerated on listing publish/unpublish. **Per D-75 — TRIPLE gate (status + cert_state + cert.expires_at > now()).**
- **D-42:** Dev-portal `/developers/[...slug]`.
- **D-43:** BotID + rate-limit + honeypot.

### Approval gates (class-based)
- **D-44:** Internal-only auto-approve.
- **D-45:** Customer/partner-facing approval-required.
- **D-46:** Content classifier reuse.

### API + MCP surface
- **D-47:** Read-write v1 `/v1/ecosystem/*` API.
- **D-48:** MCP tools (8).

### UI surface
- **D-49:** Operator-facing workspaces (P208 single-shell). **Plus D-71 payout compliance ack workspace.**
- **D-50:** Public surfaces.
- **D-51:** Approval Inbox 8 entry kinds.
- **D-52:** Morning Brief surfaces.

### Observability + operator posture
- **D-53:** Recertification cron daily.
- **D-54:** Fraud detection cron hourly. **Per D-72 — 24h default + 7d slow window.**
- **D-55:** Community signal volume spike alert.
- **D-56:** Public marketplace view spike alert.
- **D-57:** Payout export coverage cron.
- **D-58:** Certification expiration coverage cron.

### Security + tenancy
- **D-59:** RLS on all 12+ new tables.
- **D-60:** Audit trail mandatory.
- **D-61:** Public endpoints — BotID + rate-limit + honeypot + ip_hash.
- **D-62:** Tombstone propagation.
- **D-63:** Webhook signature verification mandatory. **Per D-77 — plus 5-min timestamp freshness window where supported.**
- **D-64:** Per-tenant HMAC signing key per webhook source.
- **D-65:** No raw user input in commission_share / commission_terms; pricing-binding via P205 PricingRecommendation only.

### Contracts + migrations
- **D-66:** Fresh F-IDs allocated by planner (continue after P226 F-180). 18 contracts F-181..F-198.
- **D-67:** New migrations allocated by planner (continue after P226 migration 158). 13+ migrations 159..171 (plus 166_b webhook_subscription_health + 167_b commission immutability trigger).

### Codex review revisions (2026-04-25 — RH1..RH5 + RM1..RM6 + RL1..RL2)

- **D-68 (RH1 — concrete codebase mismatch resolved):** Plugin registry API verified against `lib/markos/plugins/registry.js:102`. The actual exported function is `resolvePlugin(registry, pluginId)` — TWO arguments, requires registry instance. There is NO `lookupPlugin` export. Adapter must use `resolvePlugin(registry, pluginId)` via factory `createPluginManifestReader(registry)` to inject the registry instance. Acceptance: `grep -c "lookupPlugin" .planning/phases/227-*/227-01-PLAN.md` returns 0.

- **D-69 (RH2 — HARD-FAIL upstream phase preconditions):** Phase 227 HARD-FAILS on missing P220 / P221 / P225 dependencies. NO silent skip / NO log-warning-and-continue. Plans 01, 05, 06 each ship a `scripts/preconditions/227-NN-check-upstream.cjs` script that exits 1 with `MISSING_UPSTREAM_PHASE:<phase>` if required tables are absent. Migration 166 ALTER on P221, migration 167 ALTER on P225 — both gated by precondition guards. Route-back error directs operator to execute upstream phase first.

- **D-70 (RH3 — payout state lifecycle correctness):** payout_credits status enum extended to `['earned','cleared','exported','paid','voided','disputed']`. Lifecycle: earned → cleared → **exported** → paid; with disputed/voided branches. CSV generation in `payout-export.ts` marks `exported` (NOT `paid`). Only `payout-reconciliation.ts` (called via `/v1/ecosystem/payouts/reconcile` API or `scripts/payout/reconcile.cjs` CLI) can flip credits to `paid`, and only after explicit finance confirmation. Acceptance: `grep -c "status='paid'" lib/markos/ecosystem/payouts/payout-export.ts` returns 0.

- **D-71 (RH4 — payout disbursement compliance gate):** Payout export REJECTS unless tenant has `payout_compliance_acknowledged_at` set within last 12 months (TTL). New column added to `partner_profiles` in migration 160. New service module `lib/markos/ecosystem/payouts/payout-compliance-gate.ts` exports `assertPayoutComplianceAcknowledged(tenant_id)`. New API endpoint `POST /v1/ecosystem/payouts/compliance-acknowledge` lets tenant admin acknowledge with legal copy + audit trail. New operator workspace `/ecosystem/payouts/compliance` for the acknowledgement UX. Export endpoint `POST /v1/ecosystem/payouts/export` returns 422 with `COMPLIANCE_NOT_ACKNOWLEDGED` if gate fails. Same gate enforced in `payoutExportCron`.

- **D-72 (RM2 + RM3 — fraud posture hardening):** Fraud detection window extended from 1h to 24h default + 7d slow-fraud pass (`SLOW_FRAUD_WINDOW_DAYS = 7`). Both `high` AND `critical` severities block payout pending human review (was only `critical`). New table `fraud_review_queue` (migration 162) holds high+critical items pending operator clear/reject. Maturation window: first cleared payout per program/partner held 24h before status flips to 'cleared' — `MATURATION_WINDOW_HOURS = 24`. New `fraud_review_status` enum value `'holding'` for maturation. Service module `lib/markos/ecosystem/referrals/fraud-review-queue.ts` exposes `enqueueFraudReview` / `clearFraudReviewItem` / `rejectFraudReviewItem` / `getMaturationStatus`.

- **D-73 (RL1 — RLS hardening clarified split):** Plan 01 establishes INITIAL CORRECT RLS policies — independently verified by `test/ecosystem/schema/rls-policies-correctness.test.ts` passing without Plan 07's migration 170. Plan 07 migration 170 is for STRICTER role-scoped policies + audit-only views (defense-in-depth) — NOT for fixing missing policies. Earlier slices are safe to execute without waiting for migration 170.

- **D-74 (reserved for future split — no current change):**

- **D-75 (RH5 — cert expiry at query time):** Public marketplace + partner directory queries enforce `certification_records.expires_at > now()` at query time via cert JOIN — NOT only via cron. PUBLIC_LISTING_FILTER becomes TRIPLE-gated (status + cert_state + cert.expires_at). Same for PUBLIC_PARTNER_FILTER. Sitemap.ts honors TRIPLE gate. `app/(public)/marketplace/[...slug]/page.tsx` renders 404 at request time if listing fails TRIPLE gate. The recertification cron (227-03) is for state cleanup — NOT the only trust barrier. Acceptance: `grep -c "expires_at" .planning/phases/227-*/227-02-PLAN.md` >= 2 + same for 03.

- **D-76 (RM6 — poll-fallback canonical health table):** New table `webhook_subscription_health` (migration 166_b in Plan 05) is the canonical source-of-truth for webhook health. Schema: tenant_id + source + last_received_at + polling_enabled + last_polled_at + last_alert_at + consecutive_failures. Every successful webhook receipt calls `recordWebhookReceipt(tenant_id, source)` to update last_received_at. `pollFallbackCron()` queries this table to identify stale integrations. Idempotent alerts via last_alert_at.

- **D-77 (RM1 — webhook timestamp freshness):** Webhook adapters that have timestamp header support enforce 5-minute freshness window (`TIMESTAMP_FRESHNESS_WINDOW_SECONDS = 300`). Stale timestamp → 401 + audit `webhook_timestamp_stale` (TIMESTAMP_OUTSIDE_FRESHNESS_WINDOW). Slack (`x-slack-request-timestamp`) + Discord (`x-signature-timestamp`) enforce; GitHub/Reddit/Twitter/Forum (no standard timestamp header) skip with documented rationale. New module `lib/markos/ecosystem/community/adapters/timestamp-freshness.ts` exports `assertTimestampFresh`.

- **D-78 (RM5 — attribution FK enforcement):** All 6 ecosystem FK columns added to `attribution_touches` in migration 167 are ENFORCED REFERENCES (not soft refs): `marketplace_listing_id`, `partner_id`, `referral_program_id`, `affiliate_program_id`, `community_signal_id`, `co_sell_opportunity_id`. ON DELETE behavior is `SET NULL` for all 6 — preserves historical attribution rows when source rows deleted. Single-ledger ECO-05 claim is now DB-backed.

- **D-79 (RM4 — DB-level commission immutability):** New migration `167_b_cosell_commission_immutability_trigger.sql` creates a Postgres trigger `trg_cosell_commission_immutability` (BEFORE UPDATE on co_sell_opportunities) that raises EXCEPTION SQLSTATE 23514 with `COMMISSION_IMMUTABLE_POST_ACCEPTANCE` if `commission_locked_at IS NOT NULL` AND `commission_share` OR `rev_share_terms_id` is changing. Financial immutability is now DB-enforced (NOT app-only). App-layer guard remains for clearer error UX but is secondary; DB trigger is the security boundary. Acceptance: SQL test proves direct UPDATE attempt fails with trigger error.

### Behavior-first verification (RL2)

Where existing plan verification used grep-shape only (e.g., `grep -c "exports.foo"`), revised plans add at least one behavior-first check (e.g., `node -e "const m=require('./path'); if(typeof m.foo !== 'function') process.exit(1);"`) alongside grep checks. Grep checks remain as fast pre-checks; behavior checks are the trust signal.

### Claude's Discretion
- Module boundary `lib/markos/ecosystem/*`.
- Webhook signature verification scheme per source.
- Fraud rule weights + thresholds.
- Listing.view_count aggregation cadence.
- Marketplace search engine.
- Dev-portal SDK auto-gen consumer.
- Per-tenant Edge Config namespace for webhook signing keys.

### Folded Todos
None — no pending todos matched Phase 227 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (precedence 1-2)
- `obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md` — informational; canonical = `obsidian/reference/*` once distilled.
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` — informational; attribution channel ENUM extended (D-34).
- `obsidian/work/incoming/18-CRM-ENGINE.md` — informational; CoSellOpportunity links to P222 Opportunity (D-08).
- `obsidian/brain/MarkOS Canon.md`.
- `obsidian/brain/Brand Stance.md`.
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` on payout copy (D-23) + commission_share validation (D-65).
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`.
- `obsidian/reference/Contracts Registry.md`.
- `obsidian/reference/Database Schema.md`.
- `obsidian/reference/Core Lib.md`.
- `obsidian/reference/HTTP Layer.md`.
- `obsidian/reference/UI Components.md`.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 227 + dep graph (220, 221, 222, 225).
- `.planning/REQUIREMENTS.md` — ECO-01..05, SG-04/06/09..12, QA-01..15.
- `.planning/STATE.md`.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`.
- `.planning/phases/227-ecosystem-partner-community-developer-growth/DISCUSS.md`.
- `.planning/phases/227-ecosystem-partner-community-developer-growth/227-RESEARCH.md`.
- **`.planning/phases/227-ecosystem-partner-community-developer-growth/227-REVIEWS.md`** — Codex review 2026-04-25; 5 HIGH + 6 MEDIUM + 2 LOW; resolutions captured in D-68..D-79.
- `.planning/codebase/INTEGRATIONS.md`.

### Prior phase decisions Ecosystem must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — RLS + audit.
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package (D-45).
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`.
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — BotID + rate-limit pattern.
- `.planning/phases/202-mcp-server-ga-claude-marketplace/202-CONTEXT.md`.
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md`.
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md`.
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md`.
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md`.
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md`.
- `.planning/phases/212-learning-literacy-evolution/212-CONTEXT.md`.
- `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/220-CONTEXT.md`.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md`.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md`.
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md`.
- `.planning/phases/224-conversion-launch-workspace/224-CONTEXT.md`.
- `.planning/phases/225-analytics-attribution-narrative-intelligence/225-CONTEXT.md`.
- `.planning/phases/226-sales-enablement-deal-execution/226-CONTEXT.md`.

### Existing code anchors
- `lib/markos/plugins/registry.js` + `loader.js` + `contracts.js` (P202) — runtime substrate; preserved (D-09..D-11). **Verified line-by-line per D-68: actual exports are createRegistry / registerPlugin / listPlugins / resolvePlugin (NOT lookupPlugin).**
- `lib/markos/packs/pack-loader.cjs`.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221).
- `lib/markos/crm360/*` (P222).
- `lib/markos/channels/templates/content-classifier.ts` (P223).
- `lib/markos/conversion/forms/*` (P224 BotID + rate-limit).
- `lib/markos/analytics/*` (P225).
- `lib/markos/sales/co-sell/*` (P226).
- `lib/markos/crm/copilot.ts::createApprovalPackage` (P105).
- AgentRun (P207).
- Vercel Cron + Edge Config + BotID.
- markos_audit_log (P201).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/plugins/{registry,loader,contracts}.js` — runtime plugin substrate; ecosystem adapter reads via D-09 + D-68 (read-through using resolvePlugin).
- P220 `partner_profiles` + `referral_programs` + `community_profiles` + `marketing_events` + `partnerships` — extend (D-12).
- P221 ConsentState — extend with `community_signal_processing` (D-27).
- P222 lifecycle_transitions hook — fires for Opportunity.source_motion='partner' (D-30).
- P223 webhook signature verifier — reused for community webhooks (D-63 + D-77 freshness).
- P223 content classifier — reused for partner-facing materials (D-46).
- P224 BotID + rate-limit + honeypot + ip_hash — reused (D-43, D-61).
- P224 ISR cacheTag/updateTag pattern — reused (D-40).
- P225 attribution_touches extended (D-34 + D-78 enforced FK); decision_rules engine reused (D-21, D-28); aggregated_metrics for benchmarks.
- P226 ProofPack + DealRoom + handoff_record + Battlecard consumed by CoSellOpportunity workflow.
- P105 createApprovalPackage (D-45).
- AgentRun (P207).
- markos_audit_log (P201).

### Established patterns
- Read-through adapter (P221 D-20) for plugin registry separation (D-09 + D-68 — registry-instance-aware via createPluginManifestReader factory).
- Polymorphic FK via target_kind + target_id + per-kind CHECK.
- ALTER TABLE additive extension preserving prior phase data; HARD-FAIL guard on missing upstream tables (D-69).
- Single source of truth attribution (P225 attribution_touches) extended via ENFORCED FK columns (D-78).
- Public surface defense-in-depth: BotID + rate-limit + honeypot + ip_hash.
- ISR cacheTag/updateTag synchronous on state change.
- Webhook signature verification per provider + 5-min timestamp freshness window where supported (D-77).
- Class-based approval (D-44/D-45).
- Decision_rules engine pluggable evaluators.
- Tombstone cascade chain.
- Single fan-out emit() with fail-closed transaction.
- DB-level financial immutability via trigger (D-79 — co-sell commission).
- Compliance gate as service-layer + API-layer enforcement (D-71 — payout).

### Integration points
- **Upstream:** plugin registry (P202), ConsentState + cdp_events (P221), lifecycle_transitions + Opportunity + Customer360 (P222), webhook signature + content classifier (P223), BotID/rate-limit + LaunchSurface partner_pack (P224), attribution_touches + decision_rules + aggregated_metrics (P225), DealRoom + handoff_record + ProofPack + Battlecard (P226), Pricing Engine PricingRecommendation (P205), AgentRun (P207), Approval Inbox (P208), EvidenceMap (P209), {{MARKOS_PRICING_ENGINE_PENDING}} (P211), LearningCandidate (P212), P220 saas tables (D-12).
- **Downstream P228:** consumes integration_listings + partner_profiles + certification_records + payout_credits for cross-engine integration audit + Stripe Connect handoff.
- **Public:** /marketplace/* + /developers/* + /partners/* SSR + ISR + BotID + rate-limit; TRIPLE-gate enforced (D-75).
- **Audit:** markos_audit_log every mutation.

</code_context>

<specifics>
## Specific Ideas

- "External builders are growth infrastructure" (doc 25 rule 1) — D-06 developer_events.
- "Marketplace trust must be governed, not assumed" (doc 25 rule 2) — D-15..D-19 + D-75 query-time TRIPLE gate.
- "Partner quality matters more than partner count" (doc 25 rule 3).
- "Community signals are product and GTM inputs" (doc 25 rule 4).
- "Referrals and affiliates must be measurement-safe and fraud-aware" (doc 25 rule 5) — D-20..D-24 + D-72 (24h+7d windows + maturation + high+critical block).
- "Developer experience is a revenue surface" (doc 25 rule 6).
- "Every ecosystem motion must feed CRM, Analytics, and Learning" (doc 25 rule 7).
- v1 install workflow is operator-mediated (D-37).
- Manual CSV payout export (D-23) — gated on D-71 compliance ack; D-70 reconciliation flips to 'paid'.

</specifics>

<deferred>
## Deferred Ideas

### For future ecosystem enrichment
- Full Stripe Connect payout (KYC + 1099 + tax) → post-P228 commerce-stack closure.
- Self-serve third-party plugin auto-install → defer.
- External certification body API integration → defer.
- Customer-facing marketplace install with Stripe billing → P228+.
- Co-marketing campaign automation → partial via P224 LaunchSurface; full automation defer.
- Real-time community signal streaming → defer.
- ML fraud detection → defer; rule engine v1.
- Public ecosystem leaderboards / rankings → defer.
- Affiliate ML attribution beyond P225 multi-model → defer.
- Developer SDK auto-publish to npm/PyPI → defer.
- Visual partner directory builder → v2.
- Partner-tenant federated SSO → defer.
- Embeddable marketplace widget → defer.
- Localized marketplace per region — v2.
- Community signal AI auto-routing → v2.
- Partner deal registration with conflict resolution → defer.
- Affiliate cookie-less attribution → defer; cookie-based v1.

### Deferred from Codex review (2026-04-25)
- **Tenant-level compliance acknowledgement table:** D-71 / RH4 currently uses partner-level `payout_compliance_acknowledged_at` field (any acknowledged partner under a tenant satisfies tenant-level gate). A dedicated `tenant_payout_compliance` table with separate legal-document-version tracking is deferred to a future legal/compliance phase. Interim posture is real (not v1 placeholder): no exports allowed without partner-level acknowledgement.
- **Stripe Connect / KYC / 1099 actual disbursement:** still deferred per D-23. D-71 closes the governance gap (no disbursement without compliance ack) but does not implement actual rail-layer KYC. Future commerce-stack phase owns that.
- **Tenant-level dedicated finance role:** Reconciliation API (D-70) currently uses `MARKOS_FINANCE_TOKEN` env var OR finance-scoped JWT claim. A first-class `finance_role` in P201 RBAC + dedicated finance UX is deferred.

### Phase boundary respect
- Doc 17 SaaS growth foundations stay in P218-P220.
- Core analytics semantics stay in P225.
- Commercial-stack parity closure stays in P228.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 227 scope.

</deferred>

<reviews_resolution>
## Codex Review Resolution Matrix (2026-04-25)

| Concern | Severity | Resolution Strategy | New Decision | Plan(s) Modified | Acceptance Check |
|---------|----------|---------------------|--------------|------------------|------------------|
| RH1 — lookupPlugin vs resolvePlugin | HIGH | Real fix (Option A) — adapter rewritten to use resolvePlugin(registry, pluginId); factory createPluginManifestReader(registry) | D-68 | 01, 02; RESEARCH §Pattern 1 | grep -c "lookupPlugin" .planning/phases/227-* = 0 |
| RH2 — migration skip-if-missing | HIGH | Real fix — HARD-FAIL precondition guards for plans 01/05/06; no silent skip | D-69 | 01, 05, 06 | scripts/preconditions/227-NN-check-upstream.cjs exits 1 with MISSING_UPSTREAM_PHASE |
| RH3 — payout 'paid' too early | HIGH | Real fix — new 'exported' status; payout-export marks exported; payout-reconciliation flips paid; finance CLI + API | D-70 | 01 (migration 162), 04, 07 | grep -c "status='paid'" lib/markos/ecosystem/payouts/payout-export.ts = 0 |
| RH4 — payout governance gap | HIGH | Real fix (Option A) — payout_compliance_acknowledged_at column + assertPayoutComplianceAcknowledged gate at API + cron; tenant admin acknowledgement workspace | D-71 | 01 (migration 160), 04, 07 | export endpoint returns 422 COMPLIANCE_NOT_ACKNOWLEDGED if absent |
| RH5 — cert expiry visibility race | HIGH | Real fix — TRIPLE gate at query time in PUBLIC_LISTING_FILTER + buildPublicListingsQuery + sitemap; cron is state cleanup not sole barrier | D-75 | 02, 03, 07 | grep -E "expires_at" .planning/phases/227-*/227-{02,03}-PLAN.md >= 2 |
| RM1 — webhook timestamp freshness | MEDIUM | Real fix — assertTimestampFresh 5-min window for adapters with timestamp headers (Slack, Discord) | D-77 | 05 | grep "TIMESTAMP_FRESHNESS_WINDOW_SECONDS=300" lib/markos/ecosystem/community/adapters/timestamp-freshness.ts >= 1 |
| RM2 — fraud window 1hr | MEDIUM | Real fix — 24h default + 7d slow-fraud pass | D-72 | 04 | grep "FRAUD_DETECTION_WINDOW_HOURS=24" + "SLOW_FRAUD_WINDOW_DAYS=7" |
| RM3 — only critical blocks | MEDIUM | Real fix — high+critical both block; fraud_review_queue table for human review; maturation 24h | D-72 | 01 (migration 162 fraud_review_queue), 04 | high severity blocks in fraud-evaluator.ts |
| RM4 — commission immutability app-only | MEDIUM | Real fix — DB trigger (BEFORE UPDATE) raises EXCEPTION on commission_share change post-lock | D-79 | 06 (migration 167_b) | SQL test direct UPDATE rejected with COMMISSION_IMMUTABLE_POST_ACCEPTANCE |
| RM5 — attribution FK soft refs | MEDIUM | Real fix — all 6 ecosystem FK columns are ENFORCED REFERENCES with ON DELETE SET NULL | D-78 | 06 (migration 167) | grep -c "REFERENCES" supabase/migrations/167_p225_*.sql >= 6 |
| RM6 — poll-fallback vague | MEDIUM | Real fix — webhook_subscription_health table (migration 166_b) is canonical source | D-76 | 05 | poll-fallback.ts queries webhook_subscription_health |
| RL1 — RLS hardening deferred | LOW | Real fix — Plan 01 establishes initial CORRECT policies (rls-policies-correctness.test.ts); Plan 07 migration 170 is defense-in-depth hardening (NOT initial correctness) | D-73 | 01, 07 | rls-policies-correctness.test.ts passes without migration 170 |
| RL2 — grep-shape verifies | LOW | Real fix — added behavior-first node -e checks alongside grep checks across all plans | (verify-pattern) | All plans | node -e checks present in revised verifies |

### Items routed to deferred section
- Tenant-level compliance acknowledgement table (D-71 currently uses partner-level field; tenant-level dedicated table = future legal/compliance phase).
- Stripe Connect / KYC / 1099 rail-layer disbursement (still deferred per D-23; D-71 closes governance gap).
- First-class finance_role in P201 RBAC (D-70 reconcile uses env-token or JWT claim today).

### New decision IDs registered
D-68, D-69, D-70, D-71, D-72, D-73, D-74 (reserved), D-75, D-76, D-77, D-78, D-79.

### Confirmation: All requirement IDs still covered
ECO-01..05, SG-04, SG-06, SG-09..12, QA-01..15 — every ID still mapped to at least one plan post-revision. Plans 01..07 frontmatter `requirements` arrays unchanged in coverage; Plan 04 + 07 add additional payout/compliance flows that strengthen ECO-02 and SG-11 enforcement.

### Confirmation: lookupPlugin removed
- Plan 01 lines 150, 278 + RESEARCH 329, 1186: REVISED to resolvePlugin/createPluginManifestReader pattern.
- Adapter file `lib/markos/ecosystem/adapters/plugin-registry.ts` will import `resolvePlugin` (verified against actual `lib/markos/plugins/registry.js:102`).
- Acceptance grep returns 0 in plan files post-revision (verifiable post-execution in adapter source).

</reviews_resolution>

---

*Phase: 227-ecosystem-partner-community-developer-growth*
*Context gathered: 2026-04-25*
*Codex review revision: 2026-04-25 (RH1..RH5 + RM1..RM6 + RL1..RL2 → D-68..D-79)*
</content>
</invoke>