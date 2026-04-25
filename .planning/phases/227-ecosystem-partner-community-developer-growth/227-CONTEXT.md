# Phase 227: Ecosystem, Partner, Community, and Developer Growth - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

<domain>
## Phase Boundary

Phase 227 ships the Ecosystem Engine: IntegrationListing + PartnerProfile + ReferralProgram + AffiliateProgram + CommunitySignal + DeveloperEvent + CertificationRecord + CoSellOpportunity + ecosystem-extended attribution_touches metadata + fraud_signals + payout_credits. Plugin registry stays runtime-only; ecosystem business SOR sits separately with read-through adapter (P221 D-20 pattern). Certification first-class state machine + criteria_checks + recertification cron. P220 SaaS-mode tables EXTENDED via business_mode discriminator (single source of truth). Webhook adapters per community source + signed verification + dedupe + ConsentState gate. CoSellOpportunity links P222 Opportunity + PartnerProfile + LaunchSurface partner_pack + DealRoom + handoff_record. Ecosystem attribution = P225 attribution_touches + nullable FK columns (single ledger). Read-heavy v1 install (operator-mediated). Public marketplace + dev-portal SSR + ISR + BotID + rate-limit. Read-write `/v1/ecosystem/*` API + 8 MCP tools + 7 UI workspaces + public `/marketplace/*` + `/developers/*` shells.

**In scope:** ~12 new tables (integration_listings + partner_profiles_extended + referral_programs_extended + affiliate_programs + community_signals + developer_events + certification_records + co_sell_opportunities + fraud_signals + payout_credits + listing_views + install_requests; plus extensions to P220 referral_programs/community_profiles/marketing_events/partnerships and P225 attribution_touches).

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
- **D-01:** New `integration_listings` SOR (doc 25 first-class): `listing_id, tenant_id (NULL = markos-global), category ∈ {connector, plugin, agent, template, workflow, integration}, name, description, owner_type ∈ {markos, partner, developer}, owner_partner_id (FK, nullable), plugin_manifest_id (FK READ-THROUGH to runtime plugin registry, nullable), certification_state ∈ {draft, review, certified, suspended, expired, revoked}, current_certification_id (FK → certification_records), docs_url, install_surface, listing_url_slug (unique), pricing_model ∈ {free, freemium, subscription, usage, contact_sales, partner_negotiated}, support_url, status ∈ {active, hidden, archived}, view_count, install_count, last_certified_at, RLS`. Public marketplace surface reads where status='active' AND certification_state='certified'.
- **D-02:** Extend P220 `partner_profiles` (originally SaaS-mode) with new columns: `business_mode ∈ {saas, commerce, ecosystem, all}` (added; backfill existing rows = 'saas'), `partner_type ∈ {agency, technology, consulting, reseller, affiliate, integrator, devshop, association}`, `region`, `specialization_tags[]`, `certification_level ∈ {registered, certified, elite}` (current + historical via certification_records), `active_status ∈ {active, watch, paused, terminated}`, `co_sell_enabled` (bool), `referral_enabled` (bool), `affiliate_enabled` (bool), `public_directory_visible` (bool, default false), `commission_share_default`, `revenue_attribution_partner_id` (FK self for parent-partner relationships).
- **D-03:** Extend P220 `referral_programs` with: `business_mode`, `scope ∈ {tenant, marketplace}`, `fraud_controls[]` (rule_kind enum: self_referral_block + ip_velocity + device_fingerprint + conversion_timing_anomaly + geo_velocity), `payout_settings JSONB` (currency, internal_credit, payout_method='manual_csv'), `qualification_rule JSONB`, `approval_required` (bool, default true for marketplace scope), `partner_id` (FK, nullable — referral can originate from a partner).
- **D-04:** New `affiliate_programs` SOR (distinct from referral; affiliate = ongoing rev_share, referral = one-time): `program_id, tenant_id (NULL = markos), partner_id (FK), commission_model ∈ {flat_rate, tiered, sliding_scale, performance_bonus}, commission_terms JSONB, attribution_window_days (default 90), cookie_duration_days (default 30), tier_thresholds JSONB, fraud_controls[], payout_settings JSONB, status, approved_by, approved_at`.
- **D-05:** New `community_signals` SOR (doc 25 first-class): `signal_id, tenant_id (NULL = markos-global), source ∈ {slack, discord, forum, github, reddit, twitter, community_event, in_app}, source_message_id (UNIQUE per source for dedupe), topic, sentiment ∈ {positive, neutral, negative}, urgency ∈ {low, medium, high, critical}, related_profile_id (FK → P221 cdp_identity_profiles, nullable), related_product_area, raw_payload JSONB (PII-scrubbed; raw_text + author_handle hashed), evidence_refs[] (FK → P209 EvidenceMap), routed_action_kind (nullable enum: created_task | created_learning_candidate | created_pr_followup | dismissed | escalated), routed_at, routed_by (system|user_id), consent_state_check_passed (bool), occurred_at`.
- **D-06:** New `developer_events` SOR: `event_id, tenant_id, event_kind ∈ {sdk_download, api_first_call, mcp_tool_invocation, plugin_install, docs_view, hackathon_signup, certification_attempt}, profile_id (FK), product_area, version, occurred_at, source_event_ref (UUID, threads to cdp_events), evidence_refs[]`. Doc 25 rule 6 "developer experience is a revenue surface".
- **D-07:** New `certification_records` SOR (audit history per certification): `cert_id, tenant_id, subject_type ∈ {listing, partner}, subject_id (UUID, polymorphic with CHECK), state ∈ {draft, review, certified, suspended, expired, revoked}, criteria_checks JSONB (per-criterion pass/fail with evidence_ref), reviewer_user_id, reviewer_role, certified_at, expires_at (default certified_at + 12 months), revoked_at, revoked_reason, recertification_due_at, RLS`. Each cert_id is immutable post-issuance; new cert = new row.
- **D-08:** New `co_sell_opportunities` SOR (doc 25 "co-sell and co-marketing workflows"): `cosell_id, tenant_id, opportunity_id (FK → P222), partner_id (FK → partner_profiles), commission_share, rev_share_terms_id (FK → P205 PricingRecommendation), launch_surface_id (FK → P224 launch_surfaces, surface_target_kind='partner_pack'), partner_dealroom_id (FK → P226 deal_rooms), handoff_record_id (FK → P226 handoff_records), status ∈ {proposed, accepted, active, won, lost, withdrawn}, winloss_record_id (FK → P226), attribution_touch_ids[] (FK → P225), created_at, accepted_at, closed_at`.

### Plugin registry ↔ IntegrationListing (read-through adapter)
- **D-09:** Plugin registry (`lib/markos/plugins/registry.js` + `loader.js` + `contracts.js`) STAYS runtime-only. No schema mutation. New `lib/markos/ecosystem/adapters/plugin-registry.ts::getPluginManifest(plugin_manifest_id)` exposes capabilities + IAM roles + route ownership for IntegrationListing rendering.
- **D-10:** IntegrationListing.plugin_manifest_id is a FK READ reference (no FK enforced at DB level since plugin manifests are filesystem-loaded; runtime check at write + render time). markos-owned listings reference manifests; partner-owned listings reference partner-published manifests via partner_id.
- **D-11:** Runtime plugin install (loader.js) NEVER triggers IntegrationListing mutations; ecosystem business state stays separate (operator-driven via certification + listing approval).

### P220 overlap (extend, not duplicate)
- **D-12:** Extend P220 schema migrations (additive ALTER TABLE) — preserve all P220 SAS-mode rows; add columns:
  - P220 `partner_profiles` → +business_mode + partner_type extension + co_sell_enabled + referral_enabled + affiliate_enabled + public_directory_visible + commission_share_default + revenue_attribution_partner_id (D-02)
  - P220 `referral_programs` → +business_mode + scope + fraud_controls + payout_settings + qualification_rule + approval_required + partner_id (D-03)
  - P220 `community_profiles` → +business_mode + scope (already exists; extend if missing)
  - P220 `marketing_events` → +business_mode (alias DeveloperEvent at API level; doc 25 events extension)
  - P220 `partnerships` → +business_mode + co_sell_enabled
- **D-13:** Single source of truth — commerce-mode queries via `WHERE business_mode IN ('saas', 'commerce', 'ecosystem', 'all')`. P227-specific queries can filter `WHERE business_mode = 'ecosystem'`. Existing P220 SAS-mode flows unaffected.
- **D-14:** New tables (D-04 affiliate_programs, D-05 community_signals (extends P220 community_profiles via FK), D-06 developer_events, D-07 certification_records, D-08 co_sell_opportunities, D-22 fraud_signals, D-23 payout_credits, D-26 install_requests, D-27 listing_views) are P227-only — no P220 overlap.

### Certification workflow (state machine)
- **D-15:** certification_records state machine: `draft → review → certified → expired → review (recertification)`; `certified → suspended ↔ certified` (operator override); `* → revoked` (terminal); `* → archived` (post-revoke).
- **D-16:** criteria_checks JSONB per-criterion (e.g., `{security_audit: pass, docs_complete: pass, support_sla: fail, evidence_ref: claim_id_xyz}`). Each criterion binds to P209 EvidenceMap claim_id when applicable. Failed criterion → state stays 'review'; reviewer feedback emits operator task to subject.
- **D-17:** Recertification cron (daily 03:00 UTC) checks `certified_at + 11 months` → emit operator task `certification_due_in_30_days`; at `certified_at + 12 months` exact → state flips 'expired' + IntegrationListing.certification_state = 'expired'; listing hidden from public marketplace until re-certified.
- **D-18:** Revoked = terminal; cannot transition back. New cert = new cert_id (audit-preserved).
- **D-19:** Operator review queue: pending certifications surfaced in P208 Approval Inbox (entry kind=certification_review).

### Fraud + payout (Referral + Affiliate)
- **D-20:** New `fraud_signals` SOR: `signal_id, tenant_id, program_kind ∈ {referral, affiliate}, program_id, attribution_touch_id (FK → P225), referrer_profile_id, referred_profile_id, signal_kind ∈ {self_referral, ip_pattern_match, velocity_anomaly, ip_overlap, conversion_timing_anomaly, device_fingerprint_match, geo_velocity, account_age_anomaly}, severity ∈ {low, medium, high, critical}, status ∈ {detected, reviewing, confirmed, dismissed}, detected_at, reviewed_by, reviewed_at, evidence_refs[]`.
- **D-21:** Fraud rule engine reuses P225 D-18..D-21 decision_rules pattern: pluggable evaluators per signal_kind. Detection cron runs hourly per active program. Critical severity → operator task + payout suspension on referrer until reviewed.
- **D-22:** New `payout_credits` SOR (internal credit ledger): `credit_id, tenant_id, partner_id (FK, nullable), profile_id (FK, nullable — for individual referrers), program_kind, program_id, attribution_touch_id (FK → P225), amount_cents, currency, earned_at, qualification_period_end, fraud_review_status ∈ {pending, cleared, blocked}, paid_out_at (nullable), payout_export_batch_id (nullable), status ∈ {earned, cleared, paid, voided, disputed}`.
- **D-23:** Manual payout export — cron weekly Sunday 04:00 UTC generates CSV of cleared credits per finance team; `payout_export_batches` table audits each export. Internal credit only; NO Stripe Connect / KYC / 1099 / tax in v1. {{MARKOS_PRICING_ENGINE_PENDING}} placeholder on any payout-rate copy until P205 PricingRecommendation approves.
- **D-24:** Payout dispute flow: partner can dispute via API; status → 'disputed'; operator reviews; resolves to 'paid' or 'voided'. Audit trail on every state change.

### CommunitySignal ingestion
- **D-25:** Webhook adapters per source: `lib/markos/ecosystem/community/adapters/{slack,discord,forum,github,reddit,twitter}-webhook.ts`. Signed webhook verification (carry P223 D-38 pattern). New `api/webhooks/community-{source}.js` endpoints. Source-specific normalization → community_signals row.
- **D-26:** Dedupe via `source_message_id` UNIQUE constraint (composite per `source` + `source_message_id`). Replay-safe.
- **D-27:** ConsentState gate — extend P221 ConsentState with `community_signal_processing` field (consent for processing developer/community member signals); ingestion checks consent_state_check_passed = true before write. Tenant policy can require explicit consent for community signal ingestion.
- **D-28:** Routing — community signals fed to P225 decision_rules engine (trigger_kind='community_signal_received'); pluggable evaluators per topic + sentiment + urgency; route to action_kind ∈ {create_task, create_learning_candidate, create_pr_followup, dismiss, escalate, generate_narrative}. Doc 25 rule 4 "community signals are product/GTM inputs".
- **D-29:** Webhook fallback — scheduled poll (every 15 min) per integration if webhook configured but unreachable for >1h; status alert to operator.

### Partner co-sell workflow
- **D-30:** CoSellOpportunity creation triggered by:
  - operator-initiated via API/UI
  - partner-initiated via partner-portal API
  - P222 Opportunity.source_motion='partner' auto-create co_sell_opportunity (status='proposed')
- **D-31:** State machine: proposed → accepted (partner + tenant operator both confirm) → active → {won, lost, withdrawn}. P222 Opportunity.stage 'customer'/'lost' → triggers co_sell_opportunities.status auto-update + winloss_record_id link.
- **D-32:** Commission share + rev_share_terms_id captured at acceptance; immutable post-acceptance (matches P226 D-21 Quote-as-Snapshot pattern). Pricing change → new co_sell_opportunity (operator task).
- **D-33:** Partner-facing surfaces: partner_dealroom_id (FK → P226 deal_rooms) shows shared artifacts; handoff_record_id (FK → P226) tracks marketing→partner-sales handoff per P226 D-34.

### Ecosystem attribution (single ledger)
- **D-34:** Extend P225 `attribution_touches` (NO new attribution table) with nullable FK columns: `marketplace_listing_id` (FK → integration_listings), `partner_id` (FK → partner_profiles), `referral_program_id` (FK → referral_programs), `affiliate_program_id` (FK → affiliate_programs), `community_signal_id` (FK → community_signals), `co_sell_opportunity_id` (FK → co_sell_opportunities). P225 channel ENUM already includes 'partner', 'community', 'referral'; add 'marketplace' + 'affiliate' values.
- **D-35:** P225 attribution_models (D-05) re-evaluate ecosystem touches with same first/last/linear/position/time-decay/data-driven. EcosystemAttribution.test.ts tests cross-engine attribution paths.
- **D-36:** Doc 25 rule "ecosystem attribution must not become parallel revenue ledger" + doc 22 rule "one metrics model" honored.

### Marketplace listing + install workflow (read-heavy v1)
- **D-37:** v1 = read-heavy discovery + operator-mediated install:
  - Public marketplace `/marketplace/[...slug]`: browse + search + filter + listing detail page + contact-developer flow.
  - certification_state badge surfaced on every listing.
  - install_request flow for non-markos listings: visitor → submits request → P208 Approval Inbox entry (entry_kind=ecosystem_install_request) → operator reviews + approves/rejects → if approved + markos-owned listing: auto-install via plugin loader; if approved + partner listing: operator-mediated install with manifest review.
- **D-38:** New `install_requests` SOR: `request_id, tenant_id, listing_id (FK), requested_by_profile_id (FK), requesting_user_email, request_reason, status ∈ {requested, reviewing, approved, installed, failed, rejected, withdrawn}, reviewer_user_id, reviewed_at, install_completed_at, failure_reason, audit_chain JSONB`.
- **D-39:** New `listing_views` SOR (analytics): `view_id, listing_id, ip_hash, user_agent_hash, viewed_at, referrer, time_on_page_seconds, profile_id (FK if authenticated)`. Auto-aggregates into listing.view_count via cron. Feeds P225 attribution_touches.

### Public marketplace + dev-portal delivery
- **D-40:** Next.js dynamic route `app/(public)/marketplace/[...slug]/page.tsx` + ISR per Vercel knowledge update — `cacheTag(${listing_id})` per listing; updateTag on certification state change OR listing.status change. SSR rendered + indexable.
- **D-41:** Sitemap.xml regenerated on listing publish/unpublish (cron + Next.js metadata config). Open Graph + Twitter Card metadata + structured data (JSON-LD Organization + SoftwareApplication) for SEO.
- **D-42:** Dev-portal `/developers/[...slug]` reads from SDK auto-gen output (P200 substrate); read-only docs + SDK + MCP tool reference + integration guides.
- **D-43:** BotID + rate-limit + honeypot on marketplace contact-form + install-request submit (carry P224 D-25..D-28 + P226 D-29..D-33 patterns).

### Approval gates (class-based)
- **D-44:** Internal-only auto-approve: PartnerProfile internal note, IntegrationListing draft (markos-owned), community signal route_action.
- **D-45:** Customer/partner-facing approval-required (P208 Approval Inbox + P105 approval-package):
  - certification state transition (especially → certified, → suspended, → revoked)
  - listing.status → 'active' (publish)
  - referral_program / affiliate_program create + activate
  - payout_credits cleared (per batch, before CSV export)
  - install_request approval
  - co_sell_opportunity acceptance + commission_share approval
  - PartnerProfile public_directory_visible toggle
- **D-46:** Content classifier reuse (P223 D-16 + P224 + P226): pricing/claim/competitor copy on partner-facing materials → block unbound; pricing variables resolve via P205 OR `{{MARKOS_PRICING_ENGINE_PENDING}}`.

### API + MCP surface
- **D-47:** Read-write v1 `/v1/ecosystem/*` API:
  - **Listings:** GET/POST/PATCH `/v1/ecosystem/listings`, POST `/v1/ecosystem/listings/{id}/{publish|hide|archive|request-install}`.
  - **Partners:** GET/POST/PATCH `/v1/ecosystem/partners`, POST `/v1/ecosystem/partners/{id}/{toggle-public|enable-cosell|enable-referral|enable-affiliate}`.
  - **Certifications:** GET/POST `/v1/ecosystem/certifications`, POST `/v1/ecosystem/certifications/{id}/{review|certify|suspend|revoke}`.
  - **Referrals:** GET/POST `/v1/ecosystem/referrals/programs`, GET `/v1/ecosystem/referrals/credits`, POST `/v1/ecosystem/referrals/credits/{id}/{clear|void}`.
  - **Affiliates:** GET/POST `/v1/ecosystem/affiliates/programs`, GET `/v1/ecosystem/affiliates/credits`.
  - **Co-sell:** GET/POST/PATCH `/v1/ecosystem/co-sell`, POST `/v1/ecosystem/co-sell/{id}/{accept|withdraw|complete}`.
  - **Community signals:** GET `/v1/ecosystem/community-signals`, POST `/v1/ecosystem/community-signals/{id}/{route|dismiss|escalate}`.
  - **Developer events:** GET `/v1/ecosystem/developer-events`.
  - **Attribution:** GET `/v1/ecosystem/attribution` (read-through P225).
  - **Fraud:** GET/POST `/v1/ecosystem/fraud-signals/{id}/{review|confirm|dismiss}`.
  - **Public:** `/marketplace/[...slug]`, `/developers/[...slug]`, contact-form `/api/v1/public/ecosystem/contact-listing`, install-request `/api/v1/public/ecosystem/install-request`.
- **D-48:** MCP tools (8):
  - `get_listing` — IntegrationListing by id + certification status.
  - `list_partners` — partner directory with filters.
  - `evaluate_referral` — qualification + fraud check.
  - `evaluate_affiliate` — qualification + commission tier.
  - `list_community_signals` — open signals by source/topic/urgency.
  - `route_signal_to_action` — execute decision_rule action_kind.
  - `get_cosell_opportunity` — CoSellOpportunity context.
  - `list_certified_partners` — by category + region + specialization.

### UI surface (7 workspaces)
- **D-49:** Operator-facing workspaces (P208 single-shell):
  - **EcosystemWorkspace** (`app/(markos)/ecosystem/page.tsx`): overview cockpit (listings + partners + recent signals + open fraud + co-sell deals).
  - **PartnerDirectory**: partner profiles + certification + co-sell + program toggles + commission_share.
  - **MarketplaceListings**: listing CRUD + JSON content editor (mirror P223 D-25 pattern) + certification badge + ISR cache control.
  - **CertificationReview**: pending certification queue + criteria_checks editor + evidence binding + decision.
  - **ReferralAdmin** + **AffiliateAdmin**: program CRUD + fraud_signals queue + payout_credits review + CSV export.
  - **CommunitySignalInbox**: signals stream + decision_rules routing + sentiment + urgency filter + assign-to-action.
  - **CoSellCockpit**: per-Opportunity partner co-sell view + commission tracking + LaunchSurface partner_pack ref + DealRoom view.
- **D-50:** Public surfaces:
  - `/marketplace/[...slug]` — listing browse + detail.
  - `/developers/[...slug]` — dev-portal docs.
  - `/partners/[...slug]` — partner directory (only PartnerProfile.public_directory_visible=true).
- **D-51:** Approval Inbox (P208) gains: certification_review, listing_publish, install_request, payout_credits_clear, cosell_acceptance, public_directory_toggle, partner_referral_program_activate, affiliate_program_activate entry types.
- **D-52:** Morning Brief (P208) surfaces: pending certifications, open install_requests, recent fraud_signals (severity≥medium), at-risk co-sell deals, top community signals (sentiment=negative + urgency≥medium).

### Observability + operator posture
- **D-53:** Recertification cron (D-17) runs daily.
- **D-54:** Fraud detection cron runs hourly per active program.
- **D-55:** Community signal volume spike alert (carry P224 D-50 / P226 D-51): >2σ from 7-day baseline → operator task.
- **D-56:** Public marketplace view spike alert (potential brigading) → operator task.
- **D-57:** Payout export coverage cron — monthly check that all earned credits are either paid or marked disputed/voided; gaps → operator task.
- **D-58:** Certification expiration coverage cron — monthly check that no listings/partners with cert past 12 months are still 'active'.

### Security + tenancy
- **D-59:** RLS on all 12+ new tables. integration_listings + community_signals + partner_profiles_extended use `tenant_id IS NULL OR tenant_id = current_tenant_id` for markos-global rows. install_requests scoped to requesting_tenant_id.
- **D-60:** Audit trail mandatory on every certification state transition + listing publish + payout cleared + cosell acceptance + fraud_signal review + community signal route. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-61:** Public endpoints (marketplace, contact, install-request) — BotID + rate-limit + honeypot + ip_hash (carry P224/P226 patterns); never log raw IP or user-agent.
- **D-62:** Tombstone propagation (P221 D-24 → P222 → P224 → P225 → P226 → P227): when profile tombstoned, scrub community_signals.related_profile_id + developer_events.profile_id + fraud_signals.referrer_profile_id/referred_profile_id (PII columns) + payout_credits.profile_id (preserve credit_id + amount + audit chain). install_requests.requested_by_profile_id scrubbed; email field redacted.
- **D-63:** Webhook signature verification mandatory on every community source webhook (Slack/Discord/Forum/GitHub/Reddit/Twitter); failure → 401 + audit row.
- **D-64:** Per-tenant HMAC signing key per webhook source (carry P226 D-29 pattern); rotate via Edge Config; never logged.
- **D-65:** No raw user input in commission_share / commission_terms; pricing-binding via P205 PricingRecommendation only.

### Contracts + migrations
- **D-66:** Fresh F-IDs allocated by planner (continue after P226 F-180). Expect 14-18 new contracts.
- **D-67:** New migrations allocated by planner (continue after P226 migration 158). Expect 10-13 (new tables + P220 ALTER TABLE extensions + P225 attribution_touches FK extensions).

### Claude's Discretion
- Module boundary `lib/markos/ecosystem/*` (listings, partners, certifications, referrals, affiliates, community, developer-events, co-sell, fraud, payouts, attribution-extensions, adapters).
- Webhook signature verification scheme per source (HMAC-SHA256 default; per-source override).
- Fraud rule weights + thresholds (start conservative; tune via P225 anomaly feedback).
- Listing.view_count aggregation cadence (recommend hourly + on-demand).
- Marketplace search engine (Postgres FTS v1; Algolia/Typesense post-P228 if scale).
- Dev-portal SDK auto-gen consumer (P200 substrate).
- Per-tenant Edge Config namespace for webhook signing keys.

### Folded Todos
None — no pending todos matched Phase 227 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (precedence 1-2)
- `obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md` — informational; canonical = `obsidian/reference/*` once distilled. 7 core rules, IntegrationListing + PartnerProfile + ReferralProgram + CommunitySignal shapes.
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md` — informational; attribution channel ENUM extended (D-34).
- `obsidian/work/incoming/18-CRM-ENGINE.md` — informational; CoSellOpportunity links to P222 Opportunity (D-08).
- `obsidian/brain/MarkOS Canon.md`.
- `obsidian/brain/Brand Stance.md`.
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` on payout copy (D-23) + commission_share validation (D-65).
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`.
- `obsidian/reference/Contracts Registry.md`.
- `obsidian/reference/Database Schema.md`.
- `obsidian/reference/Core Lib.md`.
- `obsidian/reference/HTTP Layer.md` — `/v1/ecosystem/*` + `/marketplace/*` + `/developers/*` conventions.
- `obsidian/reference/UI Components.md`.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 227 + dep graph (220, 221, 222, 225).
- `.planning/REQUIREMENTS.md` — ECO-01..05, SG-04/06/09..12 (carry-forward from P220), QA-01..15.
- `.planning/STATE.md`.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.
- `.planning/phases/227-ecosystem-partner-community-developer-growth/DISCUSS.md`.
- `.planning/phases/227-ecosystem-partner-community-developer-growth/227-RESEARCH.md` — refresh at plan-phase.
- `.planning/codebase/INTEGRATIONS.md` — current integration inventory.

### Prior phase decisions Ecosystem must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — RLS + audit.
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package (D-45).
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — public API + SDK + MCP marketplace foundations.
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — BotID + rate-limit pattern (D-43, D-61).
- `.planning/phases/202-mcp-server-ga-claude-marketplace/202-CONTEXT.md` — MCP marketplace listing precedent.
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md` — PricingRecommendation FK for rev_share + commission (D-08, D-22, D-65).
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun bridge for recompute jobs.
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief (D-51, D-52).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap claim TTL on certification + community signal (D-16, D-05).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` (D-23, D-46).
- `.planning/phases/212-learning-literacy-evolution/212-CONTEXT.md` — LearningCandidate from community signals (D-28).
- `.planning/phases/220-saas-community-events-pr-partnership-devrel-growth/220-CONTEXT.md` — partner_profiles + referral_programs + community_profiles + marketing_events + partnerships EXTENDED (D-12).
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-08 cdp_events emit, D-11 ConsentState extend with community_signal_processing (D-27), D-24 tombstone propagation (D-62).
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — Customer360 + Opportunity (D-08 CoSellOpportunity links + D-30 source_motion='partner' hook).
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — D-16 content classifier + D-38 webhook signature pattern (D-25, D-46, D-63).
- `.planning/phases/224-conversion-launch-workspace/224-CONTEXT.md` — D-14 LaunchSurface(partner_pack) target (D-08); D-25..D-28 BotID + rate-limit + honeypot pattern (D-43, D-61).
- `.planning/phases/225-analytics-attribution-narrative-intelligence/225-CONTEXT.md` — attribution_touches extended (D-34); decision_rules engine reused for fraud + community signal routing (D-21, D-28); aggregated_metrics for ecosystem benchmarks (D-34).
- `.planning/phases/226-sales-enablement-deal-execution/226-CONTEXT.md` — DealRoom + handoff_record consumed by CoSellOpportunity (D-08, D-33); ProofPack + Battlecard partner-pack consumers.

### Existing code anchors
- `lib/markos/plugins/registry.js` + `loader.js` + `contracts.js` (P202) — runtime substrate; preserved (D-09..D-11).
- `lib/markos/packs/pack-loader.cjs` — registry/selection/alias pattern reference.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221).
- `lib/markos/crm360/*` (P222).
- `lib/markos/channels/templates/content-classifier.ts` (P223).
- `lib/markos/conversion/forms/*` (P224 BotID + rate-limit).
- `lib/markos/analytics/*` (P225 attribution_touches + decision_rules).
- `lib/markos/sales/co-sell/*` (P226).
- `lib/markos/crm/copilot.ts::createApprovalPackage` (P105).
- AgentRun (P207).
- Vercel Cron + Edge Config + BotID.
- markos_audit_log (P201).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/plugins/{registry,loader,contracts}.js` — runtime plugin substrate; ecosystem adapter reads via D-09 (read-through).
- P220 `partner_profiles` + `referral_programs` + `community_profiles` + `marketing_events` + `partnerships` — extend (D-12).
- P221 ConsentState — extend with `community_signal_processing` (D-27).
- P222 lifecycle_transitions hook — fires for Opportunity.source_motion='partner' (D-30).
- P223 webhook signature verifier (D-38) — reused for community webhooks (D-63).
- P223 content classifier (D-16) — reused for partner-facing materials (D-46).
- P224 BotID + rate-limit + honeypot + ip_hash (D-25..D-28) — reused for marketplace + contact + install-request (D-43, D-61).
- P224 ISR cacheTag/updateTag pattern (D-30/D-31) — reused for marketplace (D-40).
- P225 attribution_touches extended (D-34); decision_rules engine reused (D-21, D-28); aggregated_metrics for benchmarks.
- P226 ProofPack + DealRoom + handoff_record + Battlecard consumed by CoSellOpportunity workflow.
- P105 createApprovalPackage (D-45).
- AgentRun (P207).
- markos_audit_log (P201).

### Established patterns
- Read-through adapter (P221 D-20) for plugin registry separation (D-09).
- Polymorphic FK via target_kind + target_id + per-kind CHECK (P224 D-14 + P226 D-05) — certification_records.subject_type+subject_id.
- ALTER TABLE additive extension preserving prior phase data (carry P224 + P225 + P226 patterns) — D-12 P220 extension.
- Single source of truth attribution (P225 attribution_touches) extended via FK columns — D-34.
- Public surface defense-in-depth: BotID + rate-limit + honeypot + ip_hash (P201 + P224 + P226 + P227 D-43/D-61).
- ISR cacheTag/updateTag synchronous on state change (P224 + P226 + P227 D-40).
- Webhook signature verification per provider (P223 D-38 + P227 D-63).
- Class-based approval (P226 D-25..D-28 + P227 D-44/D-45).
- Decision_rules engine pluggable evaluators (P225 D-18..D-21 + P227 D-21 fraud + D-28 community).
- Tombstone cascade chain (P221 → P222 → P224 → P225 → P226 → P227 D-62).
- Single fan-out emit() with fail-closed transaction (P222/P223/P224/P225 → P227 attribution + community signals).

### Integration points
- **Upstream:** plugin registry (P202), ConsentState + cdp_events (P221), lifecycle_transitions + Opportunity + Customer360 (P222), webhook signature + content classifier (P223), BotID/rate-limit + LaunchSurface partner_pack (P224), attribution_touches + decision_rules + aggregated_metrics (P225), DealRoom + handoff_record + ProofPack + Battlecard (P226), Pricing Engine PricingRecommendation (P205), AgentRun (P207), Approval Inbox (P208), EvidenceMap (P209), {{MARKOS_PRICING_ENGINE_PENDING}} (P211), LearningCandidate (P212), P220 saas tables (D-12).
- **Downstream P228:** consumes integration_listings + partner_profiles + certification_records + payout_credits for cross-engine integration audit + Stripe Connect handoff.
- **Public:** /marketplace/* + /developers/* + /partners/* SSR + ISR + BotID + rate-limit.
- **Audit:** markos_audit_log every mutation.

</code_context>

<specifics>
## Specific Ideas

- "External builders are growth infrastructure" (doc 25 rule 1) — D-06 developer_events tracks SDK/API/MCP/plugin engagement; P200 dev-portal foundation reused.
- "Marketplace trust must be governed, not assumed" (doc 25 rule 2) — D-15..D-19 certification state machine + criteria_checks + recertification cron + operator review queue.
- "Partner quality matters more than partner count" (doc 25 rule 3) — D-02 PartnerProfile.certification_level + D-37 marketplace shows certification badge + co-sell win-rate via P225 attribution.
- "Community signals are product and GTM inputs" (doc 25 rule 4) — D-05 community_signals + D-28 routed to decision_rules (task/learning/PR/escalate).
- "Referrals and affiliates must be measurement-safe and fraud-aware" (doc 25 rule 5) — D-20..D-24 fraud_signals + payout_credits + manual review + manual CSV export (no Stripe in v1).
- "Developer experience is a revenue surface" (doc 25 rule 6) — D-06 developer_events + D-42 dev-portal SSR + SDK auto-gen.
- "Every ecosystem motion must feed CRM, Analytics, and Learning" (doc 25 rule 7) — D-30 CoSellOpportunity from P222 source_motion='partner'; D-34 ecosystem attribution = P225; D-28 community signals → P212 LearningCandidate.
- v1 install workflow is operator-mediated (D-37) — security boundary; auto-install for markos-owned only.
- Manual CSV payout export (D-23) — defers KYC/tax/Stripe Connect complexity to post-P228 commerce-stack closure.

</specifics>

<deferred>
## Deferred Ideas

### For future ecosystem enrichment
- Full Stripe Connect payout (KYC + 1099 + tax) → post-P228 commerce-stack closure.
- Self-serve third-party plugin auto-install → defer (security boundary).
- External certification body API integration → defer.
- Customer-facing marketplace install with Stripe billing → P228+.
- Co-marketing campaign automation (joint launches) → partial via P224 LaunchSurface; full automation defer.
- Real-time community signal streaming (Kafka/Redpanda) → defer.
- ML fraud detection → defer; rule engine v1.
- Public ecosystem leaderboards / rankings → defer.
- Affiliate ML attribution beyond P225 multi-model → defer.
- Developer SDK auto-publish to npm/PyPI → defer.
- Visual partner directory builder (drag-and-drop) → v2.
- Partner-tenant federated SSO → defer.
- Embeddable marketplace widget (3rd-party site embed) → defer.
- Localized marketplace per region — v2 (Postgres FTS + manual locale fields v1).
- Community signal AI auto-routing (LLM-based) → v2; rule engine v1.
- Partner deal registration with conflict resolution → defer.
- Affiliate cookie-less attribution (server-side fingerprinting) → defer; cookie-based v1.

### Phase boundary respect
- Doc 17 SaaS growth foundations stay in P218-P220.
- Core analytics semantics stay in P225.
- Commercial-stack parity closure stays in P228.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 227 scope.

</deferred>

---

*Phase: 227-ecosystem-partner-community-developer-growth*
*Context gathered: 2026-04-25*
