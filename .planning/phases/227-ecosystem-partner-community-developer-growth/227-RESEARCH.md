# Phase 227: Ecosystem, Partner, Community, and Developer Growth — Research

**Researched:** 2026-04-24 (decision-aware overwrite; supersedes seed)
**Domain:** Ecosystem Engine SOR — IntegrationListing + PartnerProfile extension + ReferralProgram extension + AffiliateProgram + CommunitySignal + DeveloperEvent + CertificationRecord + CoSellOpportunity + fraud_signals + payout_credits + listing_views + install_requests + P220 ALTER TABLE extensions + P225 attribution_touches FK extension + P221 ConsentState extension + plugin registry read-through adapter + 8 MCP tools + 7 UI workspaces + public marketplace + dev-portal
**Confidence:** HIGH (all claims verified against: 227-CONTEXT.md 67 locked decisions, 226-RESEARCH.md F-180 + migration 158 baseline, prior phase CONTEXT.md files P220–P226, REQUIREMENTS.md ECO-01..05 + SG-04/06/09..12 + QA-01..15, Contracts Registry, Database Schema, Testing Environment Plan, codebase reads of lib/markos/plugins/registry.js + lib/markos/packs/pack-loader.cjs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Object model (D-01..D-08)
- **D-01:** New `integration_listings` SOR — listing_id, tenant_id (NULL=markos-global), category ∈ {connector,plugin,agent,template,workflow,integration}, name, description, owner_type ∈ {markos,partner,developer}, owner_partner_id (FK nullable), plugin_manifest_id (READ-THROUGH only), certification_state ∈ {draft,review,certified,suspended,expired,revoked}, current_certification_id (FK), docs_url, install_surface, listing_url_slug (unique), pricing_model, support_url, status ∈ {active,hidden,archived}, view_count, install_count, last_certified_at, RLS. Public reads: status='active' AND certification_state='certified'.
- **D-02:** Extend P220 `partner_profiles` — +business_mode, +partner_type, +region, +specialization_tags[], +certification_level, +active_status, +co_sell_enabled, +referral_enabled, +affiliate_enabled, +public_directory_visible, +commission_share_default, +revenue_attribution_partner_id (FK self).
- **D-03:** Extend P220 `referral_programs` — +business_mode, +scope, +fraud_controls[], +payout_settings JSONB, +qualification_rule JSONB, +approval_required, +partner_id (FK nullable).
- **D-04:** New `affiliate_programs` SOR — program_id, tenant_id, partner_id (FK), commission_model ∈ {flat_rate,tiered,sliding_scale,performance_bonus}, commission_terms JSONB, attribution_window_days, cookie_duration_days, tier_thresholds JSONB, fraud_controls[], payout_settings JSONB, status, approved_by, approved_at.
- **D-05:** New `community_signals` SOR — signal_id, tenant_id (NULL=markos-global), source, source_message_id (UNIQUE per source), topic, sentiment, urgency, related_profile_id (FK P221), related_product_area, raw_payload JSONB (PII-scrubbed), evidence_refs[], routed_action_kind, routed_at, routed_by, consent_state_check_passed, occurred_at.
- **D-06:** New `developer_events` SOR — event_id, tenant_id, event_kind, profile_id (FK), product_area, version, occurred_at, source_event_ref (UUID → cdp_events), evidence_refs[].
- **D-07:** New `certification_records` SOR — cert_id, tenant_id, subject_type ∈ {listing,partner}, subject_id (polymorphic + CHECK), state machine, criteria_checks JSONB, reviewer_user_id, certified_at, expires_at (certified_at + 12 months), recertification_due_at, RLS. Immutable post-issuance; new cert = new row.
- **D-08:** New `co_sell_opportunities` SOR — cosell_id, tenant_id, opportunity_id (FK P222), partner_id (FK), commission_share, rev_share_terms_id (FK P205), launch_surface_id (FK P224), partner_dealroom_id (FK P226 deal_rooms), handoff_record_id (FK P226), status state machine, winloss_record_id (FK P226), attribution_touch_ids[].

#### Plugin registry (D-09..D-11)
- **D-09:** Plugin registry stays runtime-only. New read-through adapter `lib/markos/ecosystem/adapters/plugin-registry.ts::getPluginManifest(plugin_manifest_id)`.
- **D-10:** plugin_manifest_id is READ reference only — no DB-level FK. Runtime check at write + render time.
- **D-11:** Plugin loader NEVER triggers IntegrationListing mutations.

#### P220 overlap (D-12..D-14)
- **D-12:** Additive ALTER TABLE on partner_profiles + referral_programs + community_profiles + marketing_events + partnerships — add business_mode + extension columns; preserve all P220 SaaS rows; backfill business_mode='saas'.
- **D-13:** Single SOR — P227-specific queries filter WHERE business_mode='ecosystem'; cross-mode queries use IN ('saas','commerce','ecosystem','all').
- **D-14:** affiliate_programs, community_signals, developer_events, certification_records, co_sell_opportunities, fraud_signals, payout_credits, install_requests, listing_views are P227-only new tables.

#### Certification workflow (D-15..D-19)
- **D-15..D-19:** State machine draft→review→certified→expired→review(recert); certified↔suspended; *→revoked (terminal). Recertification cron daily 03:00 UTC — 11 months → operator task; 12 months → state='expired' + listing hidden. Operator review queue in P208 Approval Inbox (entry_kind=certification_review).

#### Fraud + payout (D-20..D-24)
- **D-20..D-24:** fraud_signals SOR + payout_credits internal ledger. Fraud rule engine reuses P225 decision_rules. Manual CSV export weekly Sunday 04:00 UTC. NO Stripe Connect / KYC in v1. {{MARKOS_PRICING_ENGINE_PENDING}} on payout-rate copy. Dispute flow: partner disputes → operator reviews → paid/voided.

#### CommunitySignal ingestion (D-25..D-29)
- **D-25..D-29:** Webhook adapters per source (Slack/Discord/Forum/GitHub/Reddit/Twitter). HMAC verification (carry P223 D-38 pattern). Dedupe via UNIQUE (source, source_message_id). ConsentState gate (P221 community_signal_processing field). Routing via P225 decision_rules engine (trigger_kind='community_signal_received'). Poll fallback every 15 min if webhook unreachable >1h.

#### CoSell workflow (D-30..D-33)
- **D-30..D-33:** CoSellOpportunity triggered by operator/partner API or P222 Opportunity.source_motion='partner'. State machine proposed→accepted→active→{won,lost,withdrawn}. Commission immutable post-acceptance (P226 D-21 snapshot pattern). Partner-facing: partner_dealroom_id + handoff_record_id.

#### Ecosystem attribution (D-34..D-36)
- **D-34..D-36:** Extend P225 attribution_touches with nullable FK columns: marketplace_listing_id, partner_id, referral_program_id, affiliate_program_id, community_signal_id, co_sell_opportunity_id. Add 'marketplace' + 'affiliate' to channel ENUM. Single ledger — no parallel attribution table.

#### Marketplace + install workflow (D-37..D-39)
- **D-37..D-39:** Read-heavy v1. install_requests SOR + listing_views SOR. Public marketplace: browse+search+filter+detail+contact-developer. Operator-mediated install: Approval Inbox entry_kind=ecosystem_install_request → approve → auto-install (markos-owned) or operator-mediated (partner-owned).

#### Public marketplace + dev-portal (D-40..D-43)
- **D-40..D-43:** Next.js `app/(public)/marketplace/[...slug]/page.tsx` + ISR cacheTag(listing_id). Sitemap regenerated on publish/unpublish. JSON-LD SoftwareApplication structured data. Dev-portal `/developers/[...slug]`. BotID + rate-limit + honeypot on contact-form + install-request (carry P224/P226 patterns).

#### Approval gates (D-44..D-46)
- **D-44..D-46:** Class-based approval. Internal auto-approve. Customer/partner-facing always approval-required (P208 Approval Inbox + P105 createApprovalPackage). Content classifier reuse (P223 D-16) for partner-facing materials.

#### API + MCP (D-47..D-50)
- **D-47..D-50:** Read-write `/v1/ecosystem/*` (full route set in CONTEXT.md). 8 MCP tools. 7 operator UI workspaces. Public `/marketplace/*` + `/developers/*` + `/partners/*`.

#### Observability (D-51..D-58)
- **D-51..D-58:** Approval Inbox 8 new entry types. Morning Brief 5 new surfaces. Recertification cron daily. Fraud detection cron hourly. Volume spike alert >2σ. Payout export coverage cron monthly. Certification expiration coverage cron monthly.

#### Security + tenancy (D-59..D-65)
- **D-59..D-65:** RLS on all 12+ new tables (tenant_id IS NULL OR tenant_id = current_tenant_id for markos-global rows). Audit trail mandatory on every state transition. BotID + rate-limit + honeypot + ip_hash on public endpoints. Tombstone propagation chain (P221→P227). Webhook signature mandatory; failure → 401 + audit row. Per-tenant HMAC key in Edge Config. No raw user input in commission_share.

#### Contracts + migrations (D-66..D-67)
- **D-66:** Continue after P226 F-180. Expect 14-18 new contracts (research allocates F-181..F-198, 18 contracts).
- **D-67:** Continue after P226 migration 158. Expect 10-13 new migrations (research allocates 159..171, 13 migrations).

### Claude's Discretion
- Module boundary `lib/markos/ecosystem/*` (listings, partners, certifications, referrals, affiliates, community, developer-events, co-sell, fraud, payouts, attribution-extensions, adapters).
- Webhook signature verification scheme per source (HMAC-SHA256 default; per-source override).
- Fraud rule weights + thresholds (start conservative; tune via P225 anomaly feedback).
- Listing.view_count aggregation cadence (recommend hourly + on-demand).
- Marketplace search engine (Postgres FTS v1; Algolia/Typesense post-P228 if scale).
- Dev-portal SDK auto-gen consumer (P200 substrate).
- Per-tenant Edge Config namespace for webhook signing keys.

### Deferred Ideas (OUT OF SCOPE)
- Full Stripe Connect payout (KYC + 1099 + tax) → post-P228.
- Self-serve third-party plugin auto-install → defer.
- External certification body API → defer.
- Customer-facing marketplace install with Stripe billing → P228+.
- Co-marketing campaign automation → partial via P224 LaunchSurface; full defer.
- Real-time community signal streaming (Kafka) → defer.
- ML-based fraud detection → defer; rule engine v1.
- Ecosystem leaderboards / public rankings → defer.
- Affiliate ML attribution → defer.
- Developer SDK auto-publish to npm/PyPI → defer.
- Visual partner directory builder → v2.
- Partner-tenant federated SSO → defer.
- Embeddable marketplace widget → defer.
- Localized marketplace per region → v2.
- Community signal AI auto-routing (LLM) → v2; rule engine v1.
- Partner deal registration with conflict resolution → defer.
- Affiliate cookie-less attribution (server-side fingerprinting) → defer.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ECO-01 | MarkOS supports ecosystem distribution across listings, partners, affiliates, referrals, community, and developer growth as governed operational systems | D-01..D-08 SOR tables; slices 227-01..227-07 |
| ECO-02 | Partner, affiliate, and referral motions are measurable, fraud-aware, payout-safe, and approval-gated | D-03/D-04 programs; D-20..D-24 fraud_signals + payout_credits; D-44..D-46 approval gates |
| ECO-03 | Community and developer signals feed CRM, analytics, launches, product intelligence, and learning | D-05 community_signals + D-06 developer_events + D-28 decision_rules routing → P212 LearningCandidate |
| ECO-04 | Marketplace listings, certifications, and partner quality are governed by explicit trust workflows and state transitions | D-15..D-19 certification state machine; D-37..D-39 operator-mediated install; D-44..D-46 approval |
| ECO-05 | Ecosystem motions consume shared attribution, pricing, and evidence truth; no isolated growth ledger is allowed | D-34..D-36 extend P225 attribution_touches; D-65 no raw commission input; D-08 rev_share_terms_id FK P205 |
| SG-04 | B2C and PLG growth covers viral loop metrics, referral programs, incentive quality controls, fraud prevention, and habit/retention loops | D-03 referral_programs extension + D-20..D-24 fraud controls; slice 227-04 |
| SG-06 | Community, event, PR, analyst, review, partnership, affiliate, and developer marketing motions are modeled as governed workflows | D-05 community_signals + D-06 developer_events + D-25..D-29 webhook ingestion; slice 227-05 |
| SG-09 | Growth modules create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec | D-28 routing → task/learning/PR/escalate; D-54 fraud cron → operator task |
| SG-10 | Target growth agent tiers are not active implementation truth until GSD assigns contracts, costs, approval posture, tests, API/MCP/UI | All 18 contracts F-181..F-198 assigned with method + actor + approval posture |
| SG-11 | Pricing-sensitive growth prompts consume Pricing Engine context or {{MARKOS_PRICING_ENGINE_PENDING}} | D-23 payout-rate copy placeholder; D-65 commission_share via P205 only |
| SG-12 | External customer, partner, press mutations require approval by default unless explicit earned-autonomy policy exists | D-44..D-46 class-based approval; D-45 full list of approval-required operations |
| QA-01..15 | Phase 200 Quality Baseline gates apply to all phases; operationalized by V4.0.0-TESTING-ENVIRONMENT-PLAN.md | Validation Architecture section; per-slice test inventory |

</phase_requirements>

---

## Summary

Phase 227 ships the Ecosystem Engine as the seventh commercial-intelligence layer in the v4.2.0 Commercial Engines 1.0 milestone. Where P221 established the CDP SOR, P222 established CRM Customer360, P223 established channel dispatch, P224 established conversion/launch, P225 established analytics/attribution/narrative, and P226 established sales enablement — P227 builds the ecosystem distribution layer: a governed marketplace for integration listings + partner profiles + certification state machine + referral/affiliate programs with fraud controls + community signal webhook ingestion + developer event tracking + co-sell opportunity orchestration + ecosystem-extended attribution.

The architecture is additive in three directions simultaneously: (1) new P227-only tables (12 new SOR tables); (2) P220 ALTER TABLE additive extension (5 SaaS-mode tables gain business_mode discriminator + ecosystem columns); (3) P225/P221 ALTER TABLE extension (attribution_touches FK columns + ConsentState community_signal_processing field). All three directions preserve prior phase data with zero breaking changes.

Three cross-cutting concerns distinguish P227 from prior phases: (1) the runtime/SOR boundary — plugin registry stays filesystem/runtime, IntegrationListing is the ecosystem business SOR, and a read-through adapter bridges them at render time without coupling the two; (2) trust governance before open publishing — certification state machine + criteria_checks + operator review queue + recertification cron ensure marketplace trust is explicit, not assumed; (3) ecosystem attribution as single ledger extension — no new attribution table; P225 attribution_touches gains nullable FK columns so all ecosystem motions (marketplace install, affiliate click, referral conversion, partner co-sell) flow through the same multi-model attribution engine.

**Primary recommendation:** Build in 7 slices across 5 waves. Wave 1 (227-01) lays schema foundation + base contracts + P220 ALTER TABLE + plugin registry adapter. Wave 2 runs parallel: 227-02 (IntegrationListing + install workflow) and 227-03 (PartnerProfile + CertificationRecord state machine). Wave 3 runs parallel: 227-04 (Referral + Affiliate + Fraud + Payout) and 227-05 (CommunitySignal + DeveloperEvent + webhook adapters). Wave 4 (227-06) ships CoSellOpportunity + ecosystem attribution extension. Wave 5 (227-07) closes API + 8 MCP + 7 UI workspaces + public surfaces + RLS hardening + Playwright + Chromatic + phase closeout.

---

## F-ID + Migration Allocation

### Verified F-ID Chain [VERIFIED: 226-RESEARCH.md F-ID table + Contracts Registry]

| Phase | F-ID range | Count |
|-------|-----------|-------|
| P221 | F-106..F-112 | 7 |
| P222 | F-113..F-121 | 9 |
| P223 | F-122..F-131 | 10 |
| P224 | F-132..F-146 | 15 |
| P225 | F-147..F-162 | 16 |
| P226 | F-163..F-180 | 18 |
| **P227 (this phase)** | **F-181..F-198** | **18** |

### Verified Migration Chain [VERIFIED: 226-RESEARCH.md migration table]

| Phase | Migration range | Count |
|-------|----------------|-------|
| P221 | 101..105 | 5 |
| P222 | 106..112 | 7 |
| P223 | 113..120 | 8 |
| P224 | 121..133 | 13 |
| P225 | 134..145 | 12 |
| P226 | 146..158 | 13 |
| **P227 (this phase)** | **159..171** | **13** |

### F-181..F-198 Contract Assignment

| F-ID | Contract name | Slice | Type | Actor |
|------|---------------|-------|------|-------|
| F-181 | ecosystem-integration-listing-v1 | 227-01 | read-write | Operator |
| F-182 | ecosystem-partner-profile-v1 | 227-01 | read-write | Operator |
| F-183 | ecosystem-certification-record-v1 | 227-01 | read-write | Operator |
| F-184 | ecosystem-referral-program-v1 | 227-01 | read-write | Operator |
| F-185 | ecosystem-affiliate-program-v1 | 227-01 | read-write | Operator |
| F-186 | ecosystem-community-signal-v1 | 227-01 | read-write | Operator |
| F-187 | ecosystem-developer-event-v1 | 227-01 | read | Operator |
| F-188 | ecosystem-co-sell-opportunity-v1 | 227-01 | read-write | Operator |
| F-189 | ecosystem-install-request-v1 | 227-02 | read-write | Operator/Public |
| F-190 | ecosystem-listing-views-v1 | 227-02 | read | Operator |
| F-191 | ecosystem-certification-transition-v1 | 227-03 | write/MCP | Operator |
| F-192 | ecosystem-fraud-signal-v1 | 227-04 | read-write | Operator |
| F-193 | ecosystem-payout-credit-v1 | 227-04 | read-write | Operator |
| F-194 | ecosystem-community-webhook-v1 | 227-05 | write | System/Webhook |
| F-195 | ecosystem-signal-route-v1 | 227-05 | write/MCP | Operator/Agent |
| F-196 | ecosystem-cosell-state-v1 | 227-06 | write/MCP | Operator/Partner |
| F-197 | ecosystem-attribution-extend-v1 | 227-06 | read | Operator |
| F-198 | ecosystem-marketplace-public-v1 | 227-07 | public-read | Public |

### Migration 159..171 Assignment

| Migration | Content | Slice |
|-----------|---------|-------|
| 159 | `integration_listings` + `listing_views` + `install_requests` + RLS + indexes | 227-01 |
| 160 | P220 ALTER TABLE: partner_profiles +business_mode +partner_type +co_sell_enabled +referral_enabled +affiliate_enabled +public_directory_visible +commission_share_default +revenue_attribution_partner_id; backfill business_mode='saas' | 227-01 |
| 161 | P220 ALTER TABLE: referral_programs +business_mode +scope +fraud_controls +payout_settings +qualification_rule +approval_required +partner_id; community_profiles +business_mode +scope; marketing_events +business_mode; partnerships +business_mode +co_sell_enabled; backfill all business_mode='saas' | 227-01 |
| 162 | `affiliate_programs` + `fraud_signals` + `payout_credits` + `payout_export_batches` + RLS + indexes | 227-01 |
| 163 | `community_signals` + `developer_events` + RLS + indexes (UNIQUE source+source_message_id on community_signals) | 227-01 |
| 164 | `certification_records` + RLS + indexes (subject_type+subject_id, state, expires_at) | 227-01 |
| 165 | `co_sell_opportunities` + RLS + indexes (opportunity_id, partner_id, status) | 227-01 |
| 166 | P221 ALTER TABLE: cdp_consent_states +community_signal_processing field | 227-05 |
| 167 | P225 ALTER TABLE: attribution_touches +marketplace_listing_id +partner_id +referral_program_id +affiliate_program_id +community_signal_id +co_sell_opportunity_id (nullable FKs) + channel ENUM extend ('marketplace','affiliate') | 227-06 |
| 168 | Hot-path composite indexes: integration_listings (tenant_id+status+certification_state for public marketplace filter); community_signals (tenant_id+urgency+routed_action_kind IS NULL for inbox); co_sell_opportunities (tenant_id+status+partner_id) | 227-03 |
| 169 | Honeypot field registry + BotID policy entries for marketplace contact form + install-request submit | 227-07 |
| 170 | RLS hardening pass — verify all 12 new tables + 5 P220 extensions; markos-global row policy (tenant_id IS NULL OR tenant_id = current_tenant_id) | 227-07 |
| 171 | OpenAPI regen + Supabase type generation + flow-registry sync | 227-07 |

---

## Standard Stack

### Core [VERIFIED: codebase reads + prior phase CONTEXT.md files P221–P226]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^2.x (inherited P221+) | Unit + integration tests | Mandatory per QA doctrine |
| Playwright | ^1.x (inherited) | Browser workflow proof | Mandatory per QA doctrine |
| Supabase JS v2 | ^2.x (inherited) | RLS + typed queries | Project-wide; all prior phases |
| `lib/markos/auth/botid.ts` (P201) | project-internal | BotID for marketplace public surface | Proven P201 + P224 + P226 pattern |
| `lib/markos/auth/rate-limit.ts` (P201) | project-internal | IP rate-limit for marketplace + install-request | Proven P201 + P224 + P226 pattern |
| `lib/markos/channels/templates/content-classifier.ts` (P223) | project-internal | Pricing/claim/competitor scan for partner-facing materials | D-46 content classifier reuse |
| `lib/markos/crm/copilot.ts::createApprovalPackage` (P105) | project-internal | Class-based approval for certification, listing publish, install_request | D-45 approval gates |
| Node.js `crypto` module | built-in | HMAC-SHA256 webhook signature verification per source | D-63/D-64; no new dependency |
| Next.js `cacheTag` / `updateTag` | Next.js 15 (inherited) | ISR per listing on certification state change | D-40 marketplace ISR |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^3.x (inherited) | Certification 12-month expiry window, payout window calculations | D-17 recert cron; D-23 payout timing |
| zod | ^3.x (inherited) | Webhook payload schema validation, criteria_checks JSONB shape guards | Wave 0 fixture typing + runtime guards |
| Postgres FTS (`to_tsvector` / `plainto_tsquery`) | built-in to Supabase | Marketplace listing search v1 | D-40 Claude's Discretion: Postgres FTS v1 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Postgres FTS | Algolia / Typesense | Algolia requires external service + billing; Postgres FTS is sufficient for v1 listing count; upgrade path post-P228 per Claude's Discretion |
| Node.js `crypto` HMAC | Per-source SDK (Slack SDK verifyRequest, etc.) | Source SDKs add per-source dependencies; shared HMAC-SHA256 pattern is sufficient and matches P223/P226 pattern; keep per-source adapters thin |
| Vercel Cron (recert/fraud crons) | AgentRun v2 scheduled | Cron is sufficient for batch jobs; AgentRun bridge stub per A5 assumption |
| Manual CSV export | Stripe Connect | KYC/1099/tax complexity deferred; manual CSV is explicitly locked in D-23 |

**Installation (new dependencies only):** None. All dependencies are already installed per P221–P226 Wave 0.

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/ecosystem/
├── adapters/
│   └── plugin-registry.ts       # getPluginManifest() read-through (D-09)
├── listings/
│   ├── listing-service.ts       # CRUD + certification state transitions
│   ├── install-request.ts       # install_request flow + approval
│   └── listing-views.ts         # view_count aggregation
├── partners/
│   ├── partner-service.ts       # PartnerProfile extension CRUD
│   └── directory.ts             # public_directory_visible filter
├── certifications/
│   ├── certification-service.ts # state machine + criteria_checks
│   └── recertification-cron.ts  # daily 03:00 UTC cron
├── referrals/
│   ├── referral-service.ts      # program CRUD + qualification
│   └── fraud-evaluator.ts       # rule engine per signal_kind
├── affiliates/
│   ├── affiliate-service.ts     # program CRUD + commission tier
│   └── commission-evaluator.ts  # tiered/sliding_scale eval
├── payouts/
│   ├── payout-ledger.ts         # payout_credits CRUD + ledger
│   └── payout-export.ts         # CSV export + payout_export_batches
├── community/
│   ├── signal-service.ts        # community_signals CRUD + routing
│   └── adapters/
│       ├── slack-webhook.ts
│       ├── discord-webhook.ts
│       ├── forum-webhook.ts
│       ├── github-webhook.ts
│       ├── reddit-webhook.ts
│       └── twitter-webhook.ts
├── developer/
│   └── developer-event-service.ts  # developer_events + cdp_events emit
├── co-sell/
│   ├── cosell-service.ts        # CoSellOpportunity state machine
│   └── cosell-attribution.ts    # attribution_touch_ids[] management
└── attribution/
    └── ecosystem-attribution.ts # P225 attribution_touches FK extension reads

api/
├── webhooks/
│   ├── community-slack.js
│   ├── community-discord.js
│   ├── community-forum.js
│   ├── community-github.js
│   ├── community-reddit.js
│   └── community-twitter.js
└── v1/ecosystem/
    ├── listings.js
    ├── partners.js
    ├── certifications.js
    ├── referrals/
    ├── affiliates/
    ├── co-sell.js
    ├── community-signals.js
    ├── developer-events.js
    ├── attribution.js
    └── fraud-signals.js

app/(public)/
├── marketplace/[...slug]/page.tsx
├── developers/[...slug]/page.tsx
└── partners/[...slug]/page.tsx

app/(markos)/ecosystem/
├── page.tsx                     # EcosystemWorkspace cockpit
├── listings/page.tsx            # MarketplaceListings workspace
├── partners/page.tsx            # PartnerDirectory workspace
├── certifications/page.tsx      # CertificationReview workspace
├── referrals/page.tsx           # ReferralAdmin workspace
├── affiliates/page.tsx          # AffiliateAdmin workspace
├── community/page.tsx           # CommunitySignalInbox workspace
└── co-sell/page.tsx             # CoSellCockpit workspace
```

### Pattern 1: Plugin Registry Read-Through Adapter (D-09..D-11)

**What:** IntegrationListing.plugin_manifest_id is a soft reference to the runtime plugin registry. The adapter bridges the two without coupling them — no FK constraint at DB level.
**When to use:** At IntegrationListing write (validate manifest exists) and at render time (fail-closed if manifest stale/missing).

```typescript
// Source: D-09; mirror of lib/markos/cdp/adapters/crm-projection.ts pattern [VERIFIED: codebase read]
// lib/markos/ecosystem/adapters/plugin-registry.ts

import { lookupPlugin } from '../../../plugins/registry.js';

export interface PluginManifestRef {
  id: string;
  name: string;
  capabilities: string[];
  iamRoles: string[];
  routeOwnership: string[];
  version: string;
}

export function getPluginManifest(plugin_manifest_id: string): PluginManifestRef | null {
  // registry.js is Map-backed; lookupPlugin returns frozen manifest or null
  const manifest = lookupPlugin(plugin_manifest_id);
  if (!manifest) return null;  // fail-closed: caller renders 'manifest_unavailable' badge
  return {
    id: manifest.id,
    name: manifest.name,
    capabilities: manifest.capabilities ?? [],
    iamRoles: manifest.iamRoles ?? [],
    routeOwnership: manifest.routeOwnership ?? [],
    version: manifest.version,
  };
}
```

### Pattern 2: Certification State Machine (D-15..D-19)

**What:** certification_records has explicit state transitions with audit trail. Every transition writes an immutable row — no in-place mutation of cert_id.
**When to use:** CertificationRecord state changes (review/certify/suspend/revoke). Also updates IntegrationListing.certification_state and triggers ISR updateTag.

```typescript
// lib/markos/ecosystem/certifications/certification-service.ts
// State machine: draft → review → certified → expired | suspended; * → revoked (terminal)

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft:     ['review'],
  review:    ['certified', 'draft'],        // draft = send back for revision
  certified: ['suspended', 'expired'],      // expired via cron only
  suspended: ['certified'],                 // reinstate
  expired:   ['review'],                    // recertification path
  // revoked: [] — terminal; no transitions
};

export function assertTransitionAllowed(from: string, to: string): void {
  if (to === 'revoked') return;             // * → revoked always allowed
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`INVALID_CERT_TRANSITION:${from}→${to}`);
  }
}
```

### Pattern 3: Webhook Ingestion with HMAC + Dedupe + ConsentState Gate (D-25..D-29)

**What:** Each community webhook adapter: (1) verifies HMAC-SHA256 signature using per-tenant key from Edge Config, (2) normalizes payload to CommunitySignal shape, (3) checks ConsentState.community_signal_processing, (4) upserts with ON CONFLICT (source, source_message_id) DO NOTHING for dedupe.
**When to use:** All 6 community source webhook endpoints.

```typescript
// api/webhooks/community-{source}.js — pattern for all 6 sources
// Mirror of P223 D-38 + P226 D-29 pattern [VERIFIED: 226-CONTEXT.md D-29]

export async function handleCommunityWebhook(req, source: string) {
  // 1. HMAC verification
  const tenantKey = await getEdgeConfigKey(`webhook_signing_key_${source}_${req.tenantId}`);
  if (!tenantKey) return { status: 401 };           // A24: no key → 401; never fall back silently
  const verified = verifyHmacSignature(req.headers['x-webhook-signature'], req.rawBody, tenantKey);
  if (!verified) {
    await writeAuditRow({ event: 'webhook_signature_failure', source, tenant_id: req.tenantId });
    return { status: 401 };
  }
  // 2. Source-specific normalization
  const signal = normalizePayload(req.body, source);   // per-adapter: slack/discord/etc.
  // 3. ConsentState gate
  if (signal.related_profile_id) {
    const consent = await getConsentState(signal.related_profile_id);
    if (!consent.community_signal_processing) {
      signal.consent_state_check_passed = false;
      // still write row for audit but do NOT route
    }
  }
  // 4. Upsert with dedupe
  const { error } = await supabase.from('community_signals').upsert(signal, {
    onConflict: 'source,source_message_id',
    ignoreDuplicates: true,
  });
  if (error) return { status: 500 };
  return { status: 200 };
}
```

### Pattern 4: P220 ALTER TABLE Backfill (D-12..D-13)

**What:** Additive ALTER TABLE on 5 P220 tables. Every new column has a DEFAULT so existing rows are not null. Backfill script sets business_mode='saas' for all pre-existing rows.
**When to use:** migration 160 + 161. Must run backfill UPDATE before adding NOT NULL constraint if needed.

```sql
-- migration 160 (partner_profiles P220 extension)
ALTER TABLE partner_profiles
  ADD COLUMN IF NOT EXISTS business_mode text NOT NULL DEFAULT 'saas'
    CHECK (business_mode IN ('saas','commerce','ecosystem','all')),
  ADD COLUMN IF NOT EXISTS partner_type text
    CHECK (partner_type IN ('agency','technology','consulting','reseller','affiliate','integrator','devshop','association')),
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS specialization_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certification_level text DEFAULT 'registered'
    CHECK (certification_level IN ('registered','certified','elite')),
  ADD COLUMN IF NOT EXISTS active_status text NOT NULL DEFAULT 'active'
    CHECK (active_status IN ('active','watch','paused','terminated')),
  ADD COLUMN IF NOT EXISTS co_sell_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_directory_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_share_default numeric(5,4),
  ADD COLUMN IF NOT EXISTS revenue_attribution_partner_id uuid REFERENCES partner_profiles(partner_id);

-- No UPDATE needed: DEFAULT 'saas' covers backfill automatically
CREATE INDEX idx_partner_profiles_business_mode ON partner_profiles(tenant_id, business_mode);
CREATE INDEX idx_partner_profiles_public ON partner_profiles(business_mode, active_status)
  WHERE public_directory_visible = true;
```

### Anti-Patterns to Avoid

- **Coupling plugin loader to IntegrationListing:** loader.js NEVER triggers listing mutations (D-11). Violations break the runtime/SOR separation boundary.
- **Enforcing plugin_manifest_id as a DB FK:** manifests are filesystem-loaded; a DB FK would fail on cold start before manifest registration. Runtime check only (D-10).
- **Creating a parallel ecosystem attribution table:** all ecosystem touches go through P225 attribution_touches with nullable FK columns (D-34/D-36). A second ledger violates ECO-05.
- **Setting commission_share from raw user input:** must bind to P205 PricingRecommendation or use {{MARKOS_PRICING_ENGINE_PENDING}} placeholder (D-65).
- **Serving uncertified listings at public marketplace URL:** public query MUST filter `status='active' AND certification_state='certified'` (D-01). Missing this filter leaks draft/suspended listings to Google indexing.

---

## Schema Sketches

### 1. integration_listings (migration 159) [VERIFIED: D-01]

```sql
CREATE TABLE integration_listings (
  listing_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  -- NULL tenant_id = markos-global listing visible to all tenants
  category                text NOT NULL
    CHECK (category IN ('connector','plugin','agent','template','workflow','integration')),
  name                    text NOT NULL,
  description             text NOT NULL,
  owner_type              text NOT NULL
    CHECK (owner_type IN ('markos','partner','developer')),
  owner_partner_id        uuid,  -- FK → partner_profiles; nullable; no DB FK (read-through)
  plugin_manifest_id      text,  -- soft ref to runtime registry; no DB FK (D-10)
  certification_state     text NOT NULL DEFAULT 'draft'
    CHECK (certification_state IN ('draft','review','certified','suspended','expired','revoked')),
  current_certification_id uuid,  -- FK → certification_records; nullable until first cert
  docs_url                text,
  install_surface         text,
  listing_url_slug        text NOT NULL UNIQUE,
  pricing_model           text NOT NULL DEFAULT 'free'
    CHECK (pricing_model IN ('free','freemium','subscription','usage','contact_sales','partner_negotiated')),
  support_url             text,
  status                  text NOT NULL DEFAULT 'hidden'
    CHECK (status IN ('active','hidden','archived')),
  view_count              bigint NOT NULL DEFAULT 0,
  install_count           bigint NOT NULL DEFAULT 0,
  last_certified_at       timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE integration_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_listings_tenant ON integration_listings
  FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);

-- Public marketplace query: status='active' AND certification_state='certified'
CREATE INDEX idx_listings_public ON integration_listings(status, certification_state)
  WHERE status = 'active' AND certification_state = 'certified';
CREATE INDEX idx_listings_tenant ON integration_listings(tenant_id, status, certification_state);
CREATE INDEX idx_listings_slug ON integration_listings(listing_url_slug);
-- FTS index for marketplace search (Claude's Discretion: Postgres FTS v1)
CREATE INDEX idx_listings_fts ON integration_listings
  USING gin(to_tsvector('english', name || ' ' || description));
```

### 2. listing_views + install_requests (migration 159) [VERIFIED: D-38/D-39]

```sql
CREATE TABLE listing_views (
  view_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES integration_listings(listing_id) ON DELETE CASCADE,
  ip_hash         text NOT NULL,
  user_agent_hash text NOT NULL,
  viewed_at       timestamptz NOT NULL DEFAULT now(),
  referrer        text,
  time_on_page_seconds integer,
  profile_id      uuid  -- FK → P221 cdp_identity_profiles; nullable (authenticated only)
);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY listing_views_tenant ON listing_views
  FOR ALL USING (
    listing_id IN (
      SELECT listing_id FROM integration_listings
      WHERE tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid
    )
  );
CREATE INDEX idx_listing_views_listing ON listing_views(listing_id, viewed_at DESC);

CREATE TABLE install_requests (
  request_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  listing_id              uuid NOT NULL REFERENCES integration_listings(listing_id),
  requested_by_profile_id uuid,  -- FK → P221; nullable; scrubbed on tombstone (D-62)
  requesting_user_email   text,  -- scrubbed on tombstone (D-62)
  request_reason          text,
  status                  text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','reviewing','approved','installed','failed','rejected','withdrawn')),
  reviewer_user_id        uuid REFERENCES auth.users(id),
  reviewed_at             timestamptz,
  install_completed_at    timestamptz,
  failure_reason          text,
  audit_chain             jsonb NOT NULL DEFAULT '[]',  -- append-only audit events
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE install_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY install_requests_tenant ON install_requests
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_install_requests_listing ON install_requests(listing_id, status);
CREATE INDEX idx_install_requests_tenant ON install_requests(tenant_id, status, created_at DESC);
```

### 3. certification_records (migration 164) [VERIFIED: D-07]

```sql
CREATE TABLE certification_records (
  cert_id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  -- NULL = markos-global cert
  subject_type            text NOT NULL
    CHECK (subject_type IN ('listing','partner')),
  subject_id              uuid NOT NULL,
  -- Polymorphic CHECK: subject_id must exist in the correct table (enforced at app layer)
  state                   text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','review','certified','suspended','expired','revoked')),
  criteria_checks         jsonb NOT NULL DEFAULT '{}',
  -- Shape: { criterion_name: { result: 'pass'|'fail'|'pending', evidence_ref: uuid|null, notes: text } }
  reviewer_user_id        uuid REFERENCES auth.users(id),
  reviewer_role           text,
  certified_at            timestamptz,
  expires_at              timestamptz,  -- certified_at + interval '12 months' set by app
  revoked_at              timestamptz,
  revoked_reason          text,
  recertification_due_at  timestamptz,  -- certified_at + interval '11 months' for early warning
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY certification_records_tenant ON certification_records
  FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_cert_records_subject ON certification_records(subject_type, subject_id, state);
CREATE INDEX idx_cert_records_expiry ON certification_records(expires_at)
  WHERE state = 'certified';
CREATE INDEX idx_cert_records_recert ON certification_records(recertification_due_at)
  WHERE state = 'certified';
```

### 4. affiliate_programs + fraud_signals + payout_credits + payout_export_batches (migration 162) [VERIFIED: D-04/D-20/D-22/D-23]

```sql
CREATE TABLE affiliate_programs (
  program_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  partner_id              uuid NOT NULL,  -- FK → partner_profiles
  commission_model        text NOT NULL
    CHECK (commission_model IN ('flat_rate','tiered','sliding_scale','performance_bonus')),
  commission_terms        jsonb NOT NULL DEFAULT '{}',
  attribution_window_days integer NOT NULL DEFAULT 90,
  cookie_duration_days    integer NOT NULL DEFAULT 30,
  tier_thresholds         jsonb NOT NULL DEFAULT '{}',
  fraud_controls          text[] NOT NULL DEFAULT '{}',
  payout_settings         jsonb NOT NULL DEFAULT '{}',
  status                  text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','archived')),
  approved_by             uuid REFERENCES auth.users(id),
  approved_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_programs_tenant ON affiliate_programs
  FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE TABLE fraud_signals (
  signal_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  program_kind            text NOT NULL CHECK (program_kind IN ('referral','affiliate')),
  program_id              uuid NOT NULL,
  attribution_touch_id    uuid,  -- FK → P225 attribution_touches; nullable
  referrer_profile_id     uuid,  -- FK → P221; scrubbed on tombstone (D-62)
  referred_profile_id     uuid,  -- FK → P221; scrubbed on tombstone (D-62)
  signal_kind             text NOT NULL
    CHECK (signal_kind IN ('self_referral','ip_pattern_match','velocity_anomaly','ip_overlap',
                           'conversion_timing_anomaly','device_fingerprint_match',
                           'geo_velocity','account_age_anomaly')),
  severity                text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status                  text NOT NULL DEFAULT 'detected'
    CHECK (status IN ('detected','reviewing','confirmed','dismissed')),
  detected_at             timestamptz NOT NULL DEFAULT now(),
  reviewed_by             uuid REFERENCES auth.users(id),
  reviewed_at             timestamptz,
  evidence_refs           uuid[] NOT NULL DEFAULT '{}'
);

ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY fraud_signals_tenant ON fraud_signals
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_fraud_signals_program ON fraud_signals(tenant_id, program_kind, program_id, status);
CREATE INDEX idx_fraud_signals_severity ON fraud_signals(tenant_id, severity, status)
  WHERE status IN ('detected','reviewing');

CREATE TABLE payout_credits (
  credit_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  partner_id              uuid,   -- FK → partner_profiles; nullable for individual referrers
  profile_id              uuid,   -- FK → P221; nullable; scrubbed on tombstone (D-62, preserve credit_id+amount)
  program_kind            text NOT NULL CHECK (program_kind IN ('referral','affiliate')),
  program_id              uuid NOT NULL,
  attribution_touch_id    uuid,   -- FK → P225 attribution_touches
  amount_cents            bigint NOT NULL,
  currency                text NOT NULL DEFAULT 'USD',
  earned_at               timestamptz NOT NULL DEFAULT now(),
  qualification_period_end timestamptz,
  fraud_review_status     text NOT NULL DEFAULT 'pending'
    CHECK (fraud_review_status IN ('pending','cleared','blocked')),
  paid_out_at             timestamptz,
  payout_export_batch_id  uuid,
  status                  text NOT NULL DEFAULT 'earned'
    CHECK (status IN ('earned','cleared','paid','voided','disputed'))
);

ALTER TABLE payout_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_credits_tenant ON payout_credits
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_payout_credits_status ON payout_credits(tenant_id, status, fraud_review_status);

CREATE TABLE payout_export_batches (
  batch_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  exported_at  timestamptz NOT NULL DEFAULT now(),
  exported_by  uuid REFERENCES auth.users(id),
  credit_count integer NOT NULL DEFAULT 0,
  total_cents  bigint NOT NULL DEFAULT 0,
  currency     text NOT NULL DEFAULT 'USD',
  csv_url      text,  -- signed storage URL; NEVER logged
  status       text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','failed'))
);
ALTER TABLE payout_export_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_export_batches_tenant ON payout_export_batches
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 5. community_signals + developer_events (migration 163) [VERIFIED: D-05/D-06]

```sql
CREATE TABLE community_signals (
  signal_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  source                  text NOT NULL
    CHECK (source IN ('slack','discord','forum','github','reddit','twitter','community_event','in_app')),
  source_message_id       text NOT NULL,
  -- Dedupe constraint: composite unique per source
  UNIQUE (source, source_message_id),
  topic                   text NOT NULL,
  sentiment               text NOT NULL CHECK (sentiment IN ('positive','neutral','negative')),
  urgency                 text NOT NULL CHECK (urgency IN ('low','medium','high','critical')),
  related_profile_id      uuid,  -- FK → P221; nullable; scrubbed on tombstone (D-62)
  related_product_area    text,
  raw_payload             jsonb NOT NULL DEFAULT '{}',  -- PII-scrubbed; raw_text + author_handle hashed
  evidence_refs           uuid[] NOT NULL DEFAULT '{}',
  routed_action_kind      text
    CHECK (routed_action_kind IN ('created_task','created_learning_candidate',
                                  'created_pr_followup','dismissed','escalated')),
  routed_at               timestamptz,
  routed_by               text,  -- 'system' or user_id
  consent_state_check_passed boolean NOT NULL DEFAULT false,
  occurred_at             timestamptz NOT NULL
);

ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY community_signals_tenant ON community_signals
  FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_community_signals_inbox ON community_signals(tenant_id, urgency, routed_action_kind)
  WHERE routed_action_kind IS NULL;  -- open/unrouted signals inbox
CREATE INDEX idx_community_signals_source ON community_signals(source, occurred_at DESC);

CREATE TABLE developer_events (
  event_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  event_kind        text NOT NULL
    CHECK (event_kind IN ('sdk_download','api_first_call','mcp_tool_invocation',
                          'plugin_install','docs_view','hackathon_signup','certification_attempt')),
  profile_id        uuid,  -- FK → P221; scrubbed on tombstone (D-62)
  product_area      text,
  version           text,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  source_event_ref  uuid,  -- shared with cdp_events row (D-06)
  evidence_refs     uuid[] NOT NULL DEFAULT '{}'
);

ALTER TABLE developer_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY developer_events_tenant ON developer_events
  FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_developer_events_kind ON developer_events(tenant_id, event_kind, occurred_at DESC);
```

### 6. co_sell_opportunities (migration 165) [VERIFIED: D-08]

```sql
CREATE TABLE co_sell_opportunities (
  cosell_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id          uuid NOT NULL,  -- FK → P222 opportunities
  partner_id              uuid NOT NULL,  -- FK → partner_profiles
  commission_share        numeric(5,4),   -- immutable post-acceptance (D-32)
  rev_share_terms_id      uuid,           -- FK → P205 PricingRecommendation; nullable
  launch_surface_id       uuid,           -- FK → P224 launch_surfaces (surface_target_kind='partner_pack')
  partner_dealroom_id     uuid,           -- FK → P226 deal_rooms
  handoff_record_id       uuid,           -- FK → P226 handoff_records
  status                  text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','accepted','active','won','lost','withdrawn')),
  winloss_record_id       uuid,           -- FK → P226 winloss_records; populated on close
  attribution_touch_ids   uuid[] NOT NULL DEFAULT '{}',  -- FK → P225 attribution_touches
  commission_locked_at    timestamptz,    -- set on status→accepted; commission immutable after
  created_at              timestamptz NOT NULL DEFAULT now(),
  accepted_at             timestamptz,
  closed_at               timestamptz
);

ALTER TABLE co_sell_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY co_sell_opp_tenant ON co_sell_opportunities
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
CREATE INDEX idx_cosell_opp_partner ON co_sell_opportunities(tenant_id, partner_id, status);
CREATE INDEX idx_cosell_opp_opportunity ON co_sell_opportunities(opportunity_id, status);
```

### 7. P225 attribution_touches ALTER TABLE (migration 167) [VERIFIED: D-34]

```sql
-- Extend P225 attribution_touches with ecosystem FK columns (all nullable)
ALTER TABLE attribution_touches
  ADD COLUMN IF NOT EXISTS marketplace_listing_id  uuid REFERENCES integration_listings(listing_id),
  ADD COLUMN IF NOT EXISTS partner_id              uuid,  -- FK → partner_profiles (soft ref)
  ADD COLUMN IF NOT EXISTS referral_program_id     uuid,  -- FK → referral_programs (soft ref)
  ADD COLUMN IF NOT EXISTS affiliate_program_id    uuid REFERENCES affiliate_programs(program_id),
  ADD COLUMN IF NOT EXISTS community_signal_id     uuid REFERENCES community_signals(signal_id),
  ADD COLUMN IF NOT EXISTS co_sell_opportunity_id  uuid REFERENCES co_sell_opportunities(cosell_id);

-- Extend channel ENUM (Postgres: new value via ALTER TYPE)
-- If channel is a CHECK constraint instead of ENUM:
ALTER TABLE attribution_touches
  DROP CONSTRAINT IF EXISTS attribution_touches_channel_check;
ALTER TABLE attribution_touches
  ADD CONSTRAINT attribution_touches_channel_check
    CHECK (channel IN ('organic_search','paid_search','social','email','messaging',
                       'direct','referral','partner','community','event','product',
                       'marketplace','affiliate'));

-- Index for ecosystem attribution queries
CREATE INDEX idx_attr_touches_ecosystem ON attribution_touches(tenant_id, channel)
  WHERE channel IN ('marketplace','affiliate','partner','referral','community');
```

### 8. P221 ConsentState ALTER TABLE (migration 166) [VERIFIED: D-27]

```sql
-- Extend P221 cdp_consent_states with community_signal_processing field
ALTER TABLE cdp_consent_states
  ADD COLUMN IF NOT EXISTS community_signal_processing text NOT NULL DEFAULT 'unknown'
    CHECK (community_signal_processing IN ('opted_in','opted_out','unknown'));
```

---

## Slice Boundaries (6 slices, 5 waves)

### Wave 1 — Foundation

#### 227-01: Schema foundation + base contracts + P220 extensions + plugin registry adapter
- Wave 0: Vitest + Playwright config (inherited), test fixtures under `test/fixtures/ecosystem/`
- Migrations: 159 (integration_listings + listing_views + install_requests), 160 (P220 partner_profiles ALTER), 161 (P220 referral_programs + community_profiles + marketing_events + partnerships ALTER), 162 (affiliate_programs + fraud_signals + payout_credits + payout_export_batches), 163 (community_signals + developer_events), 164 (certification_records), 165 (co_sell_opportunities)
- Contracts registered: F-181..F-188 (base read-write shells)
- Module stubs: `lib/markos/ecosystem/*` module structure + plugin-registry adapter
- Tests: 12-table CRUD invariants + RLS isolation + ALTER TABLE backfill verification (business_mode='saas' for all P220 rows)
- Dependencies: P220 tables must exist (A25); P221 cdp_consent_states must exist (A3); P222 opportunities must exist (A4); P225 attribution_touches must exist (A23)

### Wave 2 — Parallel pair A + B

#### 227-02: IntegrationListing + listing_views + install_requests + plugin registry adapter (depends 227-01)
- Marketplace listing CRUD + certification_state badge + ISR cacheTag/updateTag on state change
- Plugin registry read-through adapter (`getPluginManifest`) + manifest validation at write + render
- install_request flow: submit → Approval Inbox entry_kind=ecosystem_install_request → operator approve/reject → auto-install (markos-owned) or operator-mediated
- listing_views aggregation: write on page view + hourly cron updates integration_listings.view_count
- Contracts: F-189 (install-request), F-190 (listing-views)
- Tests: plugin manifest read-through (manifest present / manifest missing fail-closed), listing filter (public: status+cert_state), install_request state machine, ISR updateTag fires on certification_state change

#### 227-03: PartnerProfile extension + CertificationRecord state machine + recertification cron (depends 227-01)
- PartnerProfile P220 extension (business_mode + D-02 columns): CRUD + public_directory_visible toggle + co_sell_enabled toggle
- CertificationRecord state machine: draft→review→certified; certified→suspended↔certified; *→revoked; expired→review(recert)
- criteria_checks JSONB schema: per-criterion {result: pass|fail|pending, evidence_ref, notes}; failed criterion holds state at 'review'
- Recertification cron daily 03:00 UTC: 11-month → operator task; 12-month → state='expired' + listing hidden (ISR updateTag)
- Contracts: F-191 (certification-transition)
- Tests: all state machine transitions (happy + blocked paths), recertification cron timing, ISR updateTag on expiry, public_directory_visible toggle approval gate

### Wave 3 — Parallel pair C + D

#### 227-04: Referral + Affiliate + Fraud + Payout (depends 227-01 + 227-03)
- Referral program P220 extension (business_mode + D-03 columns): CRUD + qualification_rule eval + approval_required gate
- Affiliate program CRUD: commission tier evaluation (flat_rate / tiered / sliding_scale / performance_bonus) + attribution_window_days cookie tracking
- Fraud rule engine (P225 decision_rules pattern): pluggable evaluators per signal_kind; hourly detection cron; critical severity → operator task + payout suspension
- Payout ledger: payout_credits CRUD + fraud_review_status gate + dispute flow (earned→cleared→paid | voided | disputed)
- Manual CSV export: weekly Sunday 04:00 UTC cron; payout_export_batches audit
- Contracts: F-192 (fraud-signal), F-193 (payout-credit)
- Tests: fraud rule engine per signal_kind, commission tier evaluation edge cases, payout dispute state machine, CSV export batch audit, {{MARKOS_PRICING_ENGINE_PENDING}} placeholder enforcement on payout-rate copy

#### 227-05: CommunitySignal + DeveloperEvent + webhook adapters + ConsentState extend (depends 227-01)
- Migration 166: P221 ConsentState ALTER (community_signal_processing field)
- 6 webhook adapters (Slack/Discord/Forum/GitHub/Reddit/Twitter): HMAC-SHA256 verify + per-source normalization + upsert with ON CONFLICT dedupe
- ConsentState gate at write (consent_state_check_passed)
- P225 decision_rules routing (trigger_kind='community_signal_received'): pluggable evaluators per topic+sentiment+urgency → create_task | create_learning_candidate | create_pr_followup | dismiss | escalate | generate_narrative
- DeveloperEvent ingestion: event_kind enum + cdp_events emit (single fan-out, shared source_event_ref)
- Poll fallback cron: every 15 min per integration if webhook unreachable >1h
- Contracts: F-194 (community-webhook), F-195 (signal-route)
- Tests: HMAC verification (valid/invalid/missing), dedupe upsert idempotency, ConsentState gate (processing=opted_out blocks route), decision_rules routing action_kind matrix, cdp_events fan-out, tombstone scrub on community_signals.related_profile_id

### Wave 4 — CoSell + Attribution Extension

#### 227-06: CoSellOpportunity + ecosystem attribution extension (depends 227-01..227-05)
- Migration 167: P225 attribution_touches ALTER TABLE (nullable FK columns + channel ENUM extend)
- CoSellOpportunity state machine: proposed→accepted→active→{won,lost,withdrawn}
- P222 lifecycle hook: Opportunity.source_motion='partner' auto-creates CoSellOpportunity (status='proposed')
- Commission immutability: commission_share + commission_locked_at set at status='accepted'; any subsequent change rejected at API layer
- CoSell ↔ P222: Opportunity.stage 'customer'/'lost' → co_sell_opportunities.status auto-update + winloss_record_id link
- Partner-facing: partner_dealroom_id (P226 deal_rooms) + handoff_record_id (P226 handoff_records)
- Ecosystem attribution reads: attribution_touches with ecosystem FK columns + channel=marketplace|affiliate|partner|referral|community
- Contracts: F-196 (cosell-state), F-197 (attribution-extend)
- Tests: CoSellOpportunity state machine (all transitions), commission immutability (attempt to mutate post-acceptance → 422), P222 lifecycle hook auto-create, attribution_touches FK columns nullable + at-most-one ecosystem ref CHECK, channel ENUM extend backward compat

### Wave 5 — API + MCP + UI + Public surfaces + Closeout

#### 227-07: Full API + 8 MCP + 7 UI workspaces + public marketplace + dev-portal + RLS hardening + Playwright + Chromatic + closeout (depends 227-01..227-06)
- Migrations: 168 (hot-path indexes), 169 (honeypot registry), 170 (RLS hardening pass), 171 (OpenAPI regen)
- Full `/v1/ecosystem/*` route set from D-47
- 8 MCP tools from D-48
- 7 operator workspaces from D-49 in P208 single-shell
- Public surfaces: `/marketplace/[...slug]` (SSR + ISR + sitemap + JSON-LD), `/developers/[...slug]` (dev-portal), `/partners/[...slug]` (public directory)
- BotID + rate-limit + honeypot on marketplace contact-form + install-request submit (D-43/D-61)
- Approval Inbox 8 new entry types (D-51) + Morning Brief 5 new surfaces (D-52)
- RLS hardening: markos-global row policy verification for all 5 tables with NULL tenant_id
- Playwright operator journeys (6): certification review + listing publish + fraud review + payout CSV export + community signal route + cosell acceptance
- Chromatic: 7 UI workspaces + public marketplace listing detail card
- Contracts: F-198 (marketplace-public)
- Tests: full API contract + OpenAPI parity, MCP tool contracts, BotID blocking test, rate-limit test, sitemap includes only certified+active listings, JSON-LD SoftwareApplication structured data shape, tombstone cascade chain P221→P227

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin manifest lookup | Custom manifest store or DB table | `lib/markos/plugins/registry.js::lookupPlugin()` read-through adapter | Registry is Map-backed, frozen, fail-closed; DB FK would break cold-start sequence |
| Webhook signature verification | Custom crypto per source | Node.js `crypto.createHmac('sha256', key).update(rawBody).digest('hex')` + P223 D-38 pattern | Consistent across all 6 sources; per-source SDK dependencies unnecessary |
| Approval gating for listing publish / cert / install | Custom approval flow | `lib/markos/crm/copilot.ts::createApprovalPackage` (P105) | P208 Approval Inbox already consumes approval_packages; new entry_kinds are additive |
| Content classifier for partner-facing materials | New pricing/claim scanner | `lib/markos/channels/templates/content-classifier.ts` (P223) | Classifier already handles pricing variable resolution + {{MARKOS_PRICING_ENGINE_PENDING}} |
| Public surface bot protection | Custom bot detection | `lib/markos/auth/botid.ts` + `lib/markos/auth/rate-limit.ts` (P201) | Battle-tested across P201/P224/P226; honeypot field registry is the shared list |
| Attribution for ecosystem motions | New ecosystem attribution table | P225 `attribution_touches` with nullable FK columns (migration 167) | ECO-05 explicitly forbids a parallel ledger; single model = single truth |
| ISR cache invalidation on listing state change | Custom cache purge | Next.js `cacheTag(listing_id)` + `updateTag(listing_id)` on certification_state/status change | Proven pattern from P224/P226; Next.js 15 ISR tag-based invalidation |
| Marketplace FTS search | Custom Elasticsearch index | `to_tsvector` + `plainto_tsquery` on name+description with GIN index | Sufficient for v1 listing count; no external service dependency |
| Community signal dedupe | Redis/cache deduplication | `ON CONFLICT (source, source_message_id) DO NOTHING` Supabase upsert | DB-level UNIQUE constraint is durable and replay-safe; cache-level dedupe risks replay on restart |

---

## Common Pitfalls

### Pitfall 1: Plugin Manifest Drift at Render Time
**What goes wrong:** IntegrationListing.plugin_manifest_id points to a manifest that was deregistered from the runtime registry (e.g., plugin upgraded or removed). Public marketplace renders stale capability claims.
**Why it happens:** plugin_manifest_id is a soft reference (D-10); runtime registry is in-memory; no DB FK to enforce consistency.
**How to avoid:** `getPluginManifest()` returns `null` on miss → renderer emits `manifest_unavailable` badge instead of capability claims. Fail-closed at both write time (warn operator if manifest missing) and render time (never display stale manifest data).
**Warning signs:** `integration_listings` rows with `plugin_manifest_id` set but `getPluginManifest()` returning null in health check.

### Pitfall 2: Certification Expiry Race (Listing Stays Active)
**What goes wrong:** Recertification cron lags (e.g., failed run) so `certification_records.state` stays 'certified' past 12 months. Expired listing remains visible on public marketplace.
**Why it happens:** Cron updates both `certification_records.state='expired'` AND `integration_listings.certification_state='expired'` — if cron fails mid-run, listing stays visible.
**How to avoid:** Render-time fail-closed check: public marketplace query adds `AND certification_records.expires_at > now()` as a belt-and-suspenders filter. Also: cron runs idempotently; separate the cert state update from the listing state update in two DB operations (not one transaction) so each is individually retryable.
**Warning signs:** Monthly certification expiration coverage cron (D-58) detecting active listings with past-12-month certs.

### Pitfall 3: P220 ALTER TABLE Backfill NULL business_mode
**What goes wrong:** Existing P220 rows acquire `business_mode=NULL` instead of 'saas' if the DEFAULT clause is not applied to existing rows correctly (depends on Supabase/Postgres version behavior for ADD COLUMN with DEFAULT).
**Why it happens:** `ADD COLUMN ... DEFAULT 'saas'` in modern Postgres backfills existing rows in-place (fast path). But NOT NULL constraint added separately can fail if any edge rows were inserted concurrently.
**How to avoid:** Migration 160 uses `ADD COLUMN ... NOT NULL DEFAULT 'saas'` — Postgres 11+ rewrites are fast-path. Add an assertion test: `SELECT count(*) FROM partner_profiles WHERE business_mode IS NULL` must be 0 after migration. D-13 single SOR query: `WHERE business_mode IN ('saas','commerce','ecosystem','all')` must return all pre-existing rows.
**Warning signs:** Any P220-mode query returning 0 rows after migration (means backfill failed).

### Pitfall 4: attribution_touches FK Columns — Multiple Ecosystem Refs on One Touch
**What goes wrong:** A single attribution touch has marketplace_listing_id AND affiliate_program_id both set — ambiguous ecosystem source credit.
**Why it happens:** D-34 says columns are nullable; no explicit constraint prevents multiple ecosystem refs per touch.
**How to avoid:** Add a CHECK constraint in migration 167: at most one of the 6 ecosystem FK columns may be non-null per touch row. Or enforce at app layer in `ecosystem-attribution.ts` before insert.
**Warning signs:** Attribution reports showing over-counted ecosystem credit on single touch events.

### Pitfall 5: Fraud Rule False Positives Blocking Legitimate Referrals
**What goes wrong:** `ip_velocity` rule blocks corporate users behind NAT (many accounts from same IP) as self_referral or velocity_anomaly.
**Why it happens:** Fraud rules tuned for consumer use cases; B2B tenants have legitimate IP clustering.
**How to avoid:** Start conservative thresholds (Claude's Discretion) — ip_velocity threshold >10 events/hour default; `geo_velocity` window 1 hour minimum. Expose per-program `fraud_controls[]` configuration so B2B tenants can disable specific rules. Manual review queue must be operator-friendly (D-21); fraud_signals severity='low' should NOT auto-suspend (only severity='critical' auto-suspends).
**Warning signs:** Rising manual review queue depth with many 'dismissed' outcomes (false positives not tuned down).

### Pitfall 6: Payout Currency Conversion in Multi-Currency Tenants
**What goes wrong:** payout_credits.amount_cents stored in USD but tenant uses EUR → exported CSV has currency mismatch.
**Why it happens:** D-23 defers FX to v2; v1 is single currency per program but multi-currency tenants exist.
**How to avoid:** payout_credits.currency column is mandatory (schema enforced). payout_settings JSONB on referral_programs and affiliate_programs must specify currency at program creation. payout_export.ts reads program.payout_settings.currency and writes to CSV header. Never assume USD.
**Warning signs:** payout_credits rows with currency=NULL or mixed currencies within one payout_export_batch.

### Pitfall 7: Community Signal Volume Spike (Decision_Rules Storm)
**What goes wrong:** A viral social thread generates 10,000 community signals in 10 minutes; decision_rules routing fires 10,000 'create_task' actions; P208 Approval Inbox floods.
**Why it happens:** D-28 routes signals to decision_rules engine; high-volume sources (Reddit/Twitter) can spike.
**How to avoid:** D-55 carry P224 D-50 / P226 D-51 pattern: >2σ from 7-day baseline → operator task (volume alert) instead of per-signal routing. Debounce at the signal service: deduplicate routing by (source + topic + 1-hour window) — only one routing action per topic cluster per hour. Circuit breaker: if P208 Approval Inbox entry count for ecosystem_community_signal_route exceeds tenant threshold, switch to 'batch' mode (batch_id groups signals).
**Warning signs:** P208 Approval Inbox entry count growing faster than operator review rate for community_signal_route entry_kind.

### Pitfall 8: CoSellOpportunity State Divergence from P222 Opportunity
**What goes wrong:** P222 Opportunity.stage advances to 'customer' but co_sell_opportunities.status stays 'active' → commission immutability violation risk when operator tries to resolve manually.
**Why it happens:** P222 lifecycle_transitions hook fires asynchronously; co_sell update is a side effect that can lag or fail.
**How to avoid:** D-31: P222 Opportunity.stage transition hook calls `cosell-service.syncStatusFromOpportunity(opportunity_id)` in the SAME transaction as the lifecycle_transition write. If sync fails, roll back the lifecycle_transition (fail-closed). Do NOT use fire-and-forget async for co_sell status updates.
**Warning signs:** co_sell_opportunities rows with status='active' where P222 opportunity.stage='customer' OR 'lost'.

### Pitfall 9: Marketplace SEO Leak (Uncertified Listings Indexed)
**What goes wrong:** Google indexes draft or review-state listings because the public query filter is missing.
**Why it happens:** Developer test sets status='active' without certification_state='certified' to preview listing; SSR renderer serves the page without checking both conditions.
**How to avoid:** Public marketplace SSR query is ALWAYS `WHERE status='active' AND certification_state='certified'`. Add this as a typed query constant in `listing-service.ts::getPublicListings()`. Never use status filter alone. Also: `robots.txt` disallows `/marketplace/*/draft` and `/marketplace/*/review`. Render-time 404 if either condition fails (not 200 with hidden content).
**Warning signs:** Google Search Console showing indexed pages for non-certified listings.

### Pitfall 10: Install_Request Bypass (Direct Plugin Loader Invocation)
**What goes wrong:** Visitor or script directly POSTs to plugin loader endpoint to install a partner plugin without going through the install_request flow and operator approval.
**Why it happens:** `lib/markos/plugins/loader.js` is an internal module but the route may be exposed.
**How to avoid:** D-11: loader.js never triggers IntegrationListing mutations. Separately: the API endpoint for plugin activation must require: (1) valid install_request row with status='approved', (2) tenant operator auth, (3) writes audit_chain row to install_request on execution. Direct loader invocation without an approved install_request row → 403.
**Warning signs:** `install_requests` rows with status != 'approved' for listings that show installed state in runtime registry.

### Pitfall 11: Per-Tenant HMAC Key Absent for Community Webhook
**What goes wrong:** A community source webhook arrives for a tenant that has not configured a signing key in Edge Config → webhook silently fails (or, worse, is processed without verification).
**Why it happens:** Edge Config key provisioning is manual per D-64.
**How to avoid:** A24 assumption: if per-tenant key is absent, return 401 (fail-closed). NEVER fall back to a shared key or skip verification. Log as `webhook_signing_key_missing` audit row. Operator task created on first failure so they know to configure the key.
**Warning signs:** `webhook_signature_failure` audit rows with `event='webhook_signing_key_missing'` in `markos_audit_log`.

### Pitfall 12: CertificationRecord criteria_checks JSONB Schema Drift
**What goes wrong:** Different reviewers use different criterion names (e.g., `security_audit` vs `security-audit` vs `securityAudit`) making criteria_checks queries unreliable.
**Why it happens:** JSONB is schema-free; no enforcement of criterion key names.
**How to avoid:** Versioned criteria templates per category (e.g., `criteria_template_v1_connector`, `criteria_template_v1_partner`) stored as a separate table or constants file. `certification-service.ts` validates criteria_checks keys against the template for the listing/partner category at write time. Zod schema per criteria template version.
**Warning signs:** criteria_checks rows with keys not matching the template → certification dashboard showing `undefined` criterion results.

---

## Webhook Ingestion Architecture

### Per-Source Adapter Pattern [VERIFIED: D-25/D-63/D-64 + P223 D-38 + codebase read of lib/markos/auth/botid.ts pattern]

Each of the 6 community source webhook adapters (`lib/markos/ecosystem/community/adapters/{source}-webhook.ts`) follows this invariant:

1. **Edge Config key lookup:** `getEdgeConfigKey('webhook_signing_key_{source}_{tenant_id}')` — per-tenant, per-source. Absent key → 401 immediately (no fallback).
2. **HMAC-SHA256 verification:** `crypto.createHmac('sha256', key).update(rawBody).digest('hex')` compared to signature header (constant-time compare to prevent timing attacks). Failure → 401 + `markos_audit_log` row.
3. **Replay protection:** community_signals UNIQUE (source, source_message_id) handles replay at the DB level. Webhook adapter does NOT need in-memory dedup.
4. **Source normalization:** each adapter maps source-specific payload shape to `CommunitySignalInsert` typed interface.
5. **ConsentState gate:** if `related_profile_id` is set, `getConsentState(profile_id).community_signal_processing` checked. If opted_out → write row with `consent_state_check_passed=false` but do NOT route.
6. **Upsert:** `supabase.from('community_signals').upsert(signal, { onConflict: 'source,source_message_id', ignoreDuplicates: true })`.

**Per-source signature header names:**

| Source | Signature header | Payload type |
|--------|-----------------|--------------|
| Slack | `x-slack-signature` | JSON |
| Discord | `x-signature-ed25519` + `x-signature-timestamp` | JSON |
| GitHub | `x-hub-signature-256` | JSON |
| Forum (Discourse) | `x-discourse-event-signature` | JSON |
| Reddit | `x-reddit-signature` | JSON |
| Twitter | `x-twitter-webhooks-signature` | JSON |

Note: Discord uses Ed25519 signing — the adapter uses `crypto.verify('ed25519', message, publicKey, signature)` instead of HMAC. The public key comes from Edge Config per tenant.

---

## Integration Contracts

### P221 ConsentState Extension (D-27)
- **ALTER TABLE:** `cdp_consent_states ADD COLUMN community_signal_processing text NOT NULL DEFAULT 'unknown'`
- **Read path:** `lib/markos/cdp/adapters/crm-projection.ts::getConsentState()` extended to include `community_signal_processing` field
- **Gate in webhook adapter:** `consent.community_signal_processing !== 'opted_in'` → `consent_state_check_passed=false`

### P225 attribution_touches Extension (D-34..D-36)
- **ALTER TABLE:** 6 nullable FK columns + channel ENUM extend (migration 167)
- **Write path:** `lib/markos/ecosystem/attribution/ecosystem-attribution.ts::attachEcosystemTouch(touch_id, ecosystemRef)` — sets exactly one of the 6 FK columns; enforces at-most-one constraint
- **Read path:** attribution_touches JOIN integration_listings/partner_profiles/etc. in P225 attribution query engine (no new query engine; extension only)

### P222 Opportunity lifecycle hook (D-30/D-31)
- **Hook trigger:** `lifecycle_transitions` INSERT WHERE to_stage IN ('customer','lost') AND opportunity.source_motion='partner'
- **Hook action:** `cosell-service.ts::syncCoSellFromOpportunity(opportunity_id)` — creates co_sell_opportunity (proposed) on first encounter; updates status on later transitions
- **Transaction scope:** same Supabase RPC as lifecycle_transition write; fail-closed (transaction rolls back if cosell sync fails)

### P226 DealRoom + handoff_record (D-33)
- **CoSellOpportunity.partner_dealroom_id** FK → `deal_rooms` (P226) — read-only access from co-sell; P226 owns deal_rooms schema
- **CoSellOpportunity.handoff_record_id** FK → `handoff_records` (P226) — populated when P226 D-34 ownership tuple fires for partner-motion opportunity

### P105 createApprovalPackage (D-45/D-46)
- **Used for:** certification state transition (→ certified, → suspended, → revoked), listing.status → 'active', install_request approval, cosell acceptance, payout_credits clear, public_directory_visible toggle, referral_program + affiliate_program activate
- **Entry kinds to add to Approval Inbox:** certification_review, listing_publish, ecosystem_install_request, payout_credits_clear, cosell_acceptance, public_directory_toggle, partner_referral_program_activate, affiliate_program_activate
- **Contract:** same `createApprovalPackage(packageKind, subjectId, evidenceRefs[], pricing_context_id?)` signature from P105; no new function signature needed

### cdp_events Fan-Out (D-06/D-28/D-30)
Three ecosystem sources emit to cdp_events:
1. **community_signals:** write → `cdp_events` row with `event_domain='partner'`, `source_event_ref=signal_id`
2. **developer_events:** write → `cdp_events` row with `event_domain='partner'`, `source_event_ref=event_id` (shared UUID pattern from P224 D-10)
3. **co_sell_opportunities:** on status change → `cdp_events` row with `event_domain='partner'`
All three fan-outs are in single DB transaction (fail-closed; if cdp_events write fails, source table write also rolls back).

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md]

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.x |
| Config file | `vitest.config.ts` (Wave 0, inherited from P221) |
| Quick run command | `npx vitest run test/ecosystem/` |
| Full suite command | `npx vitest run && npx playwright test && npx chromatic` |
| Playwright config | `playwright.config.ts` (inherited) |
| Chromatic | via Storybook + `.github/workflows/ui-quality.yml` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Slice |
|--------|----------|-----------|-------------------|-------|
| ECO-01 | All 12 new SOR tables CRUD + RLS isolation | Vitest unit | `npx vitest run test/ecosystem/schema/` | 227-01 |
| ECO-01 | P220 ALTER TABLE backfill (business_mode='saas' for all pre-existing rows) | Vitest integration | `npx vitest run test/ecosystem/schema/p220-backfill.test.ts` | 227-01 |
| ECO-01 | Plugin registry adapter (manifest present, manifest missing→fail-closed) | Vitest unit | `npx vitest run test/ecosystem/adapters/plugin-registry.test.ts` | 227-02 |
| ECO-02 | Referral fraud rule engine per signal_kind (all 8 kinds) | Vitest unit | `npx vitest run test/ecosystem/fraud/fraud-evaluator.test.ts` | 227-04 |
| ECO-02 | Affiliate commission tier evaluation (flat/tiered/sliding_scale) | Vitest unit | `npx vitest run test/ecosystem/affiliates/commission-evaluator.test.ts` | 227-04 |
| ECO-02 | payout_credits ledger + dispute flow state machine | Vitest unit | `npx vitest run test/ecosystem/payouts/payout-ledger.test.ts` | 227-04 |
| ECO-02 | Payout CSV export batch audit | Vitest integration | `npx vitest run test/ecosystem/payouts/payout-export.test.ts` | 227-04 |
| ECO-03 | Community webhook signature (valid/invalid/missing key) | Vitest unit | `npx vitest run test/ecosystem/community/webhook-signature.test.ts` | 227-05 |
| ECO-03 | Community signal dedupe idempotency | Vitest integration | `npx vitest run test/ecosystem/community/signal-dedupe.test.ts` | 227-05 |
| ECO-03 | ConsentState gate (opted_out→write but no route) | Vitest unit | `npx vitest run test/ecosystem/community/consent-gate.test.ts` | 227-05 |
| ECO-03 | Decision_rules routing action_kind matrix (all 6 action kinds) | Vitest unit | `npx vitest run test/ecosystem/community/signal-routing.test.ts` | 227-05 |
| ECO-03 | DeveloperEvent cdp_events fan-out | Vitest integration | `npx vitest run test/ecosystem/developer/developer-event.test.ts` | 227-05 |
| ECO-04 | CertificationRecord state machine (all transitions + blocked paths) | Vitest unit | `npx vitest run test/ecosystem/certifications/state-machine.test.ts` | 227-03 |
| ECO-04 | Recertification cron timing (11-month task + 12-month expiry) | Vitest unit | `npx vitest run test/ecosystem/certifications/recert-cron.test.ts` | 227-03 |
| ECO-04 | IntegrationListing public filter (status+cert_state double gate) | Vitest unit | `npx vitest run test/ecosystem/listings/public-filter.test.ts` | 227-02 |
| ECO-04 | install_request state machine + operator approval gate | Vitest unit | `npx vitest run test/ecosystem/listings/install-request.test.ts` | 227-02 |
| ECO-04 | ISR updateTag fires on certification_state change | Vitest unit | `npx vitest run test/ecosystem/listings/isr-invalidation.test.ts` | 227-02 |
| ECO-05 | attribution_touches FK columns nullable + at-most-one ecosystem ref | Vitest unit | `npx vitest run test/ecosystem/attribution/ecosystem-attribution.test.ts` | 227-06 |
| ECO-05 | channel ENUM extend backward compat (existing touches unaffected) | Vitest unit | `npx vitest run test/ecosystem/attribution/channel-enum.test.ts` | 227-06 |
| ECO-05 | CoSellOpportunity state machine + commission immutability | Vitest unit | `npx vitest run test/ecosystem/co-sell/cosell-state-machine.test.ts` | 227-06 |
| ECO-05 | P222 lifecycle hook auto-create CoSellOpportunity | Vitest integration | `npx vitest run test/ecosystem/co-sell/lifecycle-hook.test.ts` | 227-06 |
| SG-04 | Referral program qualification_rule evaluation | Vitest unit | `npx vitest run test/ecosystem/referrals/qualification-rule.test.ts` | 227-04 |
| SG-06 | Community signal routing → LearningCandidate emit (P212) | Vitest unit | `npx vitest run test/ecosystem/community/learning-candidate-emit.test.ts` | 227-05 |
| SG-09 | Fraud detection cron → operator task (critical severity) | Vitest unit | `npx vitest run test/ecosystem/fraud/fraud-cron.test.ts` | 227-04 |
| SG-11 | {{MARKOS_PRICING_ENGINE_PENDING}} enforced on payout-rate copy | Vitest unit | `npx vitest run test/ecosystem/payouts/pricing-placeholder.test.ts` | 227-04 |
| SG-12 | Approval gate: listing_publish / certification_review / install_request | Playwright E2E | `npx playwright test tests/ecosystem/approval-gates.spec.ts` | 227-07 |
| QA-01..15 | RLS 100% coverage: all 12 new tables + 5 P220 extensions | Vitest integration | `npx vitest run test/rls-verifier.test.ts --filter ecosystem` | 227-07 |
| QA-01..15 | MCP tool contracts (8 tools shape + approval posture) | Vitest unit | `npx vitest run test/ecosystem/mcp/mcp-tools.test.ts` | 227-07 |
| QA-01..15 | API contract + OpenAPI parity (all /v1/ecosystem/* routes) | Vitest unit | `npx vitest run test/ecosystem/api/contract-parity.test.ts` | 227-07 |
| QA-01..15 | Tombstone cascade P221→P227 (all PII columns scrubbed) | Vitest integration | `npx vitest run test/ecosystem/security/tombstone-cascade.test.ts` | 227-07 |
| QA-01..15 | Legacy regression P100-P105 + P220-P226 unaffected | Vitest integration | `npx vitest run test/regression/` | 227-07 |
| QA-01..15 | Playwright: certification review workflow | Playwright E2E | `npx playwright test tests/ecosystem/certification-review.spec.ts` | 227-07 |
| QA-01..15 | Playwright: listing publish workflow | Playwright E2E | `npx playwright test tests/ecosystem/listing-publish.spec.ts` | 227-07 |
| QA-01..15 | Playwright: fraud review + payout CSV export | Playwright E2E | `npx playwright test tests/ecosystem/fraud-payout.spec.ts` | 227-07 |
| QA-01..15 | Playwright: community signal routing workflow | Playwright E2E | `npx playwright test tests/ecosystem/community-signal-route.spec.ts` | 227-07 |
| QA-01..15 | Playwright: co-sell opportunity acceptance | Playwright E2E | `npx playwright test tests/ecosystem/cosell-acceptance.spec.ts` | 227-07 |
| QA-01..15 | Chromatic: 7 UI workspaces + public marketplace listing detail | Chromatic visual | `npx chromatic --project-token=...` (CI gate) | 227-07 |
| QA-01..15 | BotID blocking + rate-limit enforcement (marketplace contact + install) | Playwright E2E | `npx playwright test tests/ecosystem/public-surface-defense.spec.ts` | 227-07 |
| QA-01..15 | Sitemap contains only certified+active listings | Vitest unit | `npx vitest run test/ecosystem/seo/sitemap.test.ts` | 227-07 |
| QA-01..15 | JSON-LD structured data shape (SoftwareApplication) | Vitest unit | `npx vitest run test/ecosystem/seo/structured-data.test.ts` | 227-07 |

### Coverage Targets

| Domain | Coverage Target | Rationale |
|--------|----------------|-----------|
| RLS policies (12 new tables + 5 P220 extensions) | 100% | Every table has tenant isolation; no exceptions |
| CertificationRecord state machine (all transitions) | 100% | State machine is the trust anchor for marketplace |
| Webhook signature verification (all 6 sources) | 100% | Security boundary; any miss = potential spoofed signal |
| Fraud rule engine (all 8 signal_kinds) | 100% | Payout integrity depends on fraud coverage |
| CoSellOpportunity state machine | 100% | Commission immutability is a financial integrity invariant |
| attribution_touches FK columns | 100% of at-most-one constraint | Prevents double-counted ecosystem attribution |
| Tombstone cascade (all 6 PII-bearing tables) | 100% | Privacy compliance (D-62) |
| API route handlers (/v1/ecosystem/*) | ≥80% branch | Full contract verification via OpenAPI parity test |
| UI workspaces (7) | Visual regression via Chromatic | Layout drift changes operator decisions |

### Wave 0 Gaps

- [ ] `test/fixtures/ecosystem/` — ecosystem fixture factory (listings, partners, certifications, programs, signals, co-sell ops)
- [ ] `test/ecosystem/schema/` — 12-table CRUD + RLS test files (one per table minimum)
- [ ] `test/ecosystem/schema/p220-backfill.test.ts` — ALTER TABLE backfill verification
- [ ] Criteria template constants file `lib/markos/ecosystem/certifications/criteria-templates.ts` — needed before criteria_checks tests

Note: Vitest + Playwright config already installed from P221 Wave 0 — no new framework install needed.

### Sampling Rate

- **Per task commit:** `npx vitest run test/ecosystem/{slice-under-test}/`
- **Per wave merge:** `npx vitest run test/ecosystem/ && npx playwright test tests/ecosystem/`
- **Phase gate:** Full suite green (Vitest + Playwright + Chromatic) before `/gsd-verify-work`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase JWT bearer + P201 session auth |
| V3 Session Management | Yes (public surfaces) | BotID + rate-limit; ip_hash (never raw IP) |
| V4 Access Control | Yes | RLS on all 12 tables; class-based approval for listing publish/cert/install |
| V5 Input Validation | Yes | Zod schema on webhook payloads + criteria_checks; content classifier on partner materials |
| V6 Cryptography | Yes | HMAC-SHA256 webhook signing; Node.js crypto only; never hand-rolled |
| V7 Error Handling | Yes | Webhook failure → 401 + audit row; plugin manifest miss → fail-closed badge |
| V8 Data Protection | Yes | ip_hash + user_agent_hash on listing_views; PII scrub on tombstone cascade; raw_payload PII-scrubbed before write |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook spoofing (fake community signal) | Spoofing | HMAC-SHA256 per-tenant signing key + 401 on failure + audit row (D-63/D-64) |
| Self-referral fraud (operator refers self to earn credit) | Tampering | fraud_controls: self_referral_block rule (D-20); fraud_signals detection + payout_credits suspension on critical severity |
| Certification state bypass (operator publishes before cert) | Elevation | listing.status → 'active' requires certification_state='certified'; createApprovalPackage enforces (D-45) |
| Commission tampering (post-acceptance mutation) | Tampering | commission_locked_at set at acceptance; API rejects PATCH on commission_share after commission_locked_at is set (D-32) |
| SEO poisoning via uncertified listing | Spoofing | Public query double-gate (status='active' AND cert_state='certified'); robots.txt disallows non-certified paths; render-time 404 (Pitfall 9) |
| Plugin install without approval (direct loader bypass) | Elevation | install_request status='approved' check at loader call site; 403 without approved request row (D-11/D-38) |
| PII in community signal raw_payload | Information Disclosure | raw_payload must be PII-scrubbed before insert; author_handle hashed (D-05); tombstone scrub on related_profile_id (D-62) |
| Rate-abuse on public contact form / install-request | DoS | BotID + rate-limit 10 req/IP/min + honeypot field (D-43/D-61) — same as P226 DealRoom |
| Payout CSV signed URL leakage | Information Disclosure | csv_url is signed storage URL; NEVER logged; payout_export_batches.csv_url is write-once; expires in 1 hour |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P226 stopped at F-180 (last contract) | F-ID allocation | If P226 used F-181+, P227 contracts collide → planner must re-verify via 226-07-PLAN.md files_modified |
| A2 | P226 stopped at migration 158 | Migration allocation | If P226 used 159+, P227 migrations collide → planner must re-verify via 226-07-PLAN.md files_modified |
| A3 | P221 cdp_consent_states table exists and is executable for ALTER TABLE | Migration 166 | If P221 not yet executed, migration 166 fails → gating dependency on P221 ship |
| A4 | P222 opportunities table + lifecycle_transitions table exist for CoSell FKs | D-08/D-31 | If P222 not yet executed, co_sell_opportunities.opportunity_id FK fails → gating dependency on P222 ship |
| A5 | Vercel Cron is the scheduled job mechanism; AgentRun bridge is a stub | Recert cron + fraud cron + payout cron | If AgentRun v2 becomes mandatory for crons before P227, cron patterns need update |
| A8 | Vitest + Playwright already installed and configured (P221 Wave 0) | Validation Architecture | If test infrastructure not yet installed, Wave 0 gap must add framework install step |
| A13 | P205 PricingRecommendation table exists for rev_share_terms_id FK in co_sell_opportunities | D-08/D-65 | If P205 not yet executed → FK must be nullable soft ref with runtime validation; use {{MARKOS_PRICING_ENGINE_PENDING}} |
| A14 | BotID runtime (`lib/markos/auth/botid.ts`) is available from P201 | D-43/D-61 | If P201 not yet executed → public surface defense layer must stub; not a blocker for Wave 1-4 |
| A15 | Edge Config / Redis is available for webhook signing key storage | D-64 | If Edge Config unavailable → fall back to Supabase vault; document substitution |
| A16 | Next.js `cacheTag`/`updateTag` API is available (Next.js 15) | D-40 ISR | If running Next.js 14 → use `revalidateTag` (old API); naming difference only |
| A21 | P209 EvidenceMap (claim_id) is available for evidence_refs[] FK binding in certification_records and community_signals | D-16/D-05 | If P209 not yet executed → evidence_refs[] stays as uuid[] without FK enforcement; soft ref |
| A22 | P225 narrative generation module is available for community_signals routing action_kind='generate_narrative' | D-28 | If P225 not yet executed → skip generate_narrative action_kind in v1 routing |
| A23 | P225 attribution_touches table exists for P227 FK column additions (migration 167) | D-34 | If P225 not yet executed → migration 167 fails → gating dependency on P225 ship |
| A24 | Per-tenant HMAC signing key is stored in Vercel Edge Config per webhook source; tenant without key → 401 (fail-closed, no shared fallback) | Webhook ingestion | If key absent → signals blocked (by design); operator task created on first failure |
| A25 | P220 partner_profiles + referral_programs + community_profiles + marketing_events + partnerships tables exist (P220 executed) | D-12 ALTER TABLE | If P220 not yet executed → P227 must create both baseline saas-mode tables AND ecosystem extensions; add conditional migration logic |
| A26 | Plugin registry runtime (`lib/markos/plugins/registry.js`) is stable + queryable via `lookupPlugin(id)` | D-09 read-through adapter | If registry API changes → adapter must be updated; low risk given P202 stability |
| A27 | P226 deal_rooms + handoff_records + winloss_records tables exist for CoSellOpportunity FK columns | D-08/D-33 | If P226 not yet executed → co_sell_opportunities FK columns must be soft refs; gating dependency on P226 ship |

---

## Open Questions

1. **Discord Ed25519 vs HMAC-SHA256**
   - What we know: Discord uses Ed25519 public-key signing (not HMAC) for webhook verification. All other sources use HMAC-SHA256.
   - What's unclear: Whether the per-tenant Edge Config namespace holds a `discord_public_key` (Ed25519 public key) vs a `discord_signing_secret` (HMAC secret).
   - Recommendation: Discord adapter uses `crypto.verify('ed25519', message, publicKey, signature)`. Edge Config key name is `webhook_discord_public_key_{tenant_id}`. Document separately from HMAC adapters.

2. **P220 Table Existence Guarantee**
   - What we know: A25 assumes P220 executed; CONTEXT.md canonical_refs cites P220 as a dependency.
   - What's unclear: Whether P220 plans are complete and the schema is final enough for ALTER TABLE to be safe.
   - Recommendation: Planner should verify P220 plan files before allocating 227-01 wave. If P220 is not yet executed, add a conditional migration check (`IF EXISTS`) to migrations 160+161 to avoid blocking Wave 1.

3. **P225 channel ENUM Type (enum vs CHECK)**
   - What we know: D-34 says "channel ENUM already includes 'partner', 'community', 'referral'; add 'marketplace' + 'affiliate' values." P225 CONTEXT.md D-06 defines channel as a CHECK constraint (text column with CHECK).
   - What's unclear: Whether P225 implemented channel as a Postgres ENUM type or a CHECK constraint. ENUM ALTER requires `ALTER TYPE ... ADD VALUE`; CHECK constraint requires DROP+ADD.
   - Recommendation: Migration 167 should use the schema sketch above (DROP + ADD CHECK) as the safer path; add a migration guard that checks existing column type before executing.

4. **Payout Export CSV Storage**
   - What we know: D-23 specifies manual CSV export; payout_export_batches.csv_url stores signed URL.
   - What's unclear: Which storage provider (Supabase Storage vs Vercel Blob) and who generates the signed URL.
   - Recommendation: Supabase Storage matches existing pattern from P226 DealRoom artifact storage; signed URL expires in 1 hour; NEVER logged.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 227 is code/schema changes only; all required services (Supabase, Vercel, Edge Config) are inherited from P221–P226 environment setup. No new external services introduced.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline community signal capture in CRM activity | CommunitySignal as first-class SOR with ConsentState gate | P227 | Signals are governed objects with routing, audit, and consent tracking |
| Plugin manifests as the full ecosystem SOR | Runtime plugin registry + separate IntegrationListing SOR + read-through adapter | P227 | Runtime trust is separate from business trust; certification is explicit |
| Partner relationships as CRM custom fields | PartnerProfile as extended first-class object with certification_level + co_sell_enabled + commission_share | P227 | Partner quality is measurable and attributable |
| Ad hoc referral/affiliate tracking in CRM notes | Dedicated SOR with fraud_signals + payout_credits + decision_rules | P227 | Fraud-aware, payout-safe, audit-complete programs |
| Attribution as campaign-only | attribution_touches extended with ecosystem FK columns + marketplace/affiliate channels | P227 | Ecosystem motions participate in the single attribution ledger |

---

## Sources

### Primary (HIGH confidence)
- `227-CONTEXT.md` — 67 locked decisions, all canonical shapes verified
- `226-RESEARCH.md` — F-180 baseline + migration 158 baseline verified
- `lib/markos/plugins/registry.js` — runtime substrate pattern verified (Map-backed, immutable, fail-closed)
- `lib/markos/packs/pack-loader.cjs` — registry/selection/alias pattern verified
- `V4.0.0-TESTING-ENVIRONMENT-PLAN.md` — Vitest + Playwright + Chromatic doctrine
- `REQUIREMENTS.md` — ECO-01..05, SG-04/06/09..12, QA-01..15 requirement text verified
- P220..P226 CONTEXT.md files — all cross-phase FK targets and reusable pattern anchors verified

### Secondary (MEDIUM confidence)
- `obsidian/reference/Contracts Registry.md` — confirmed F-ID range allocation (P226 ends at F-180 per 226-RESEARCH.md; registry does not list P221+ explicitly but cross-referenced)
- `obsidian/reference/Database Schema.md` — confirmed migration file pattern (forward-only, RLS invariants, current highest executed = migration 100)
- `obsidian/reference/HTTP Layer.md` — confirmed app/(markos) + app/(public) route group pattern + REST handler auth pattern

### Tertiary (LOW confidence — flagged in Assumptions Log)
- A5: Vercel Cron as the cron mechanism (assumed; no cron config file verified in codebase for P225/P226 cron jobs)
- A16: Next.js cacheTag/updateTag API name (assumed Next.js 15; not verified against package.json)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified as installed in prior phases
- Architecture (module structure, adapter patterns): HIGH — verified against registry.js, crm-projection.ts, P224/P226 ISR + BotID + webhook patterns
- Schema sketches: HIGH — derived directly from 67 locked decisions with explicit field lists
- F-ID + migration allocation: HIGH — chain verified from 226-RESEARCH.md confirmed baseline
- Pitfalls: HIGH — derived from decision constraints + cross-phase pattern analysis
- Webhook Ed25519 for Discord: MEDIUM — training knowledge; verify against Discord official docs at implementation time

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days; stable ecosystem — no fast-moving library changes)

---

## RESEARCH COMPLETE
