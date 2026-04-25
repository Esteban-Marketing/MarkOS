# Phase 226: Sales Enablement and Deal Execution — Research

**Researched:** 2026-04-24 (decision-aware overwrite; supersedes seed)
**Domain:** Sales enablement SOR — Battlecard + ObjectionLibrary + ProofPack + DealBrief + DealRoom + ProposalSupport + Quote (snapshot) + WinLossRecord + handoff_record + deal_health_signals + class-based approval + BotID/rate-limit public share + 8 MCP tools + 6 UI workspaces
**Confidence:** HIGH (all claims verified against: 226-CONTEXT.md 60 locked decisions, prior phase CONTEXT.md files P221–P225, plan files 225-01..225-07, REQUIREMENTS.md, Contracts Registry, Database Schema, Testing Environment Plan, codebase reads of lib/markos/crm/copilot.ts + playbooks.ts + auth/botid.ts + auth/rate-limit.ts)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Object model (full doc 24 first-class)
- **D-01:** New `battlecards` SOR: `battlecard_id, tenant_id, competitor_name, competitor_profile_id (nullable), summary, strengths_to_acknowledge[], weaknesses_to_press[], ideal_positioning_angles[], risky_claims_to_avoid[], proof_refs[] (FK → proof_packs OR EvidenceMap claim_id), last_verified_at, version, status ∈ {draft, approved, archived}, freshness_status ∈ {fresh, stale_claims, stale_competitor, retired}, created_at, approved_by, approved_at`. RLS on tenant_id.
- **D-02:** New `objection_libraries` per-tenant + `objection_library_entries` + `objection_records` per-deal (see full shapes in CONTEXT.md).
- **D-03:** New `deal_briefs` SOR (full shape in CONTEXT.md). RLS on tenant_id.
- **D-04:** New `proof_packs` SOR + `proof_pack_versions` audit table.
- **D-05:** New `deal_rooms` SOR + `deal_room_artifacts` + `deal_room_views`.
- **D-06:** New `proposal_supports` SOR.
- **D-07:** New `quotes` SOR (immutable PricingRecommendation snapshot, JSONB).
- **D-08:** New `winloss_records` SOR with structured taxonomy.
- **D-09:** New `handoff_records` table.
- **D-10:** New `deal_health_signals` table (computed).

#### ProofPack assembly (hybrid)
- D-11: Snapshot at first approval; D-12: Refresh on EvidenceMap claim TTL; D-13: Pre-publish renderer fail-closed.

#### DealBrief generation (hybrid auto-draft)
- D-14: Auto-draft trigger via P222 lifecycle hook; AgentRun; LLM clause-fill; D-15: Status=draft on auto-creation; D-16: Regeneration triggers (stage_change, handoff, coverage_score change >10%, competitive_threat_score change >2σ).

#### Battlecard freshness model
- D-17: EvidenceMap claim_ref TTL inheritance; D-18: last_verified_at cron; D-19: Auto-stale on competitor_profile_id change; D-20: Stale battlecard cannot be added to deal_room_artifacts.

#### Proposal/quote boundary
- D-21: ProposalSupport NEVER owns price logic; D-22: Pricing change after Quote.status='sent' → new Quote required; D-23: valid_until expiry cron; D-24: Customer signature evidence_ref.

#### Approval gates (class-based)
- D-25: Internal materials auto-approve; D-26: Customer-facing materials ALWAYS approval-required; D-27: Content classifier reuse (P223 D-16); D-28: Re-engagement always approval-required.

#### DealRoom (first-class)
- D-29: Public share `app/(public)/share/dr/[token]/page.tsx`; D-30: ip_hash + user_agent_hash views; D-31: ISR cacheTag; D-32: Expiry cron; D-33: Rate-limit 10/IP/min.

#### Cross-team handoff
- D-34: P222 D-17 ownership tuple change fires handoff hook; D-35: Approval Inbox acknowledge; D-36: DealBrief regeneration = canonical handoff object.

#### Forecast + risk
- D-37: Composite deal_health_signals formula (4 scores → composite 0-100); D-38: cdp_events emit for P225; D-39: Threshold-driven decision rules.

#### Win/loss + Learning
- D-40: WinLossRecord creation required on stage transition to customer/lost/no_decision; D-41: cdp_events emit for P225 + P212; D-42: attribution_touch_ids[] on WinLossRecord.

#### API + MCP surface
- D-43: Read-write `/v1/sales/*` (full route list in CONTEXT.md); D-44: 8 MCP tools; D-45: Approval-package on all write APIs.

#### UI surface
- D-46: 6 sales workspaces in P208 single-shell; D-47: Public share renderer; D-48: Approval Inbox new entry types; D-49: Morning Brief additions.

#### Observability + operator posture
- D-50: Freshness audit cron extends; D-51: DealRoom view spike alert; D-52: Handoff acknowledge SLA; D-53: WinLossRecord coverage cron.

#### Security + tenancy
- D-54: RLS on all 14+ tables; share_link_token HMAC; D-55: Audit trail mandatory; D-56: Tombstone propagation scrub; D-57: share_link_token NEVER in logs; D-58: No raw user input in pricing.

#### Contracts + migrations
- **D-59:** F-IDs continue after P225 F-162. Expect 14-18 new contracts.
- **D-60:** Migrations continue after P225 migration 145. Expect 10-13 new migrations.

### Claude's Discretion
- Module boundary `lib/markos/sales/*`.
- LLM provider for DealBrief gen (recommend Vercel AI Gateway + claude-sonnet-4-6, mirror P225 pattern).
- deal_health_signals composite weights (start with equal-weighted; tune per P225 anomaly feedback).
- ISR cache TTL per artifact_kind in DealRoom.
- share_link_token format -- LOCKED per D-86 (HMAC-signed opaque TEXT, scoped per-deal-room, key-rotation aware). NOT operator discretion.

### Deferred Ideas (OUT OF SCOPE)
- Full forecast model (probability + commit/best-case/worst-case) — P225 owns forecast.
- Pricing logic / discount engine / quote generation logic — P205 owns.
- Visual deal room builder (drag-and-drop UX) — defer to v2.
- Multi-language sales materials — defer to v2.
- Full proposal document generation (PDF assembly) — v1 ships render-to-html only.
- AI-generated objection handlers (live conversation coaching) — defer.
- Customer-facing chat in DealRoom — defer.
- Salesforce / HubSpot CRM sync — P228.
- Ecosystem co-sell partner workflows — P227.
- Battlecard/ProofPack template marketplace — defer.
- Deal forecast probability ML model — P225 owns.
- Quote discount engine / pricing logic — P205 owns.
- Sales call recording (Gong/Chorus) — defer.
- Predictive deal-loss model — defer to P225 + ML.
- ProofPack A/B testing — defer.
- Public DealRoom pricing display with competitor comparison — defer.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEN-01 | MarkOS supports sales enablement through battlecards, proof packs, objection intelligence, proposal support, and deal-execution playbooks | D-01/D-02/D-04/D-06 SOR tables; slice 226-02 Battlecard + ObjectionLibrary + ProofPack engine |
| SEN-02 | Sales materials pull from CRM, CDP, analytics, evidence, and Pricing Engine | D-03 deal_briefs.pricing_context_id FK → P205; D-17 EvidenceMap claim_ref TTL; D-42 attribution_touch_ids |
| SEN-03 | Proof, case studies, competitor claims, ROI language, and pricing language remain freshness-aware, evidence-linked, and approval-gated | D-11..D-13 ProofPack hybrid; D-17..D-20 Battlecard freshness; D-25..D-28 class-based approval |
| SEN-04 | Win/loss, objection, and proposal outcomes feed analytics, learning, and future commercial recommendations | D-40..D-42 WinLossRecord → cdp_events → P225 + P212; D-38 deal_health_signals → P225 |
| SEN-05 | Sales enablement is integrated with opportunity tasks, approval flows, and commercial memory | D-14 lifecycle hook; D-34..D-36 handoff; D-48 Approval Inbox; D-49 Morning Brief |
| CRM-01..05 | CRM carry-forward via P222 (Customer360 + buying_committees + lifecycle_transitions) | P222 lifecycle_transitions hook is the trigger target for D-14/D-34; buying_committee_members FK used in D-02/D-08/D-09 |
| PRC-01..09 | Pricing Engine carry-forward via P205 (PricingRecommendation SOR) | D-21..D-24 Quote-as-Snapshot; quotes.pricing_recommendation_id FK; quotes.pricing_recommendation_snapshot JSONB immutable |
| EVD-01..06 | Evidence carry-forward via P209 (EvidenceMap + claim TTL) | D-11..D-13 ProofPack freshness; D-17..D-20 Battlecard freshness; D-27 content classifier; D-24 signature evidence_ref |
| QA-01..15 | Phase 200 Quality Baseline all 15 gates | Validation Architecture section; per-slice test inventory below |

</phase_requirements>

---

## Summary

Phase 226 ships the Sales Enablement Engine as the final commercial-intelligence layer in the v4.2.0 Commercial Engines 1.0 milestone. Where P221 established the CDP SOR, P222 established CRM Customer360 + opportunities + buying committees, P223 established the channel dispatch engine, P224 established conversion/launch surfaces, and P225 established the analytics/attribution/narrative intelligence layer — P226 builds the revenue-closing layer above them all: governed sales artifacts (Battlecard, ProofPack, DealBrief, ObjectionLibrary, ProposalSupport, Quote, WinLossRecord, handoff_record) + a first-class deal-execution workspace (DealRoom with BotID-gated public share) + deal_health_signals that feed back to P225 forecast.

The architecture is additive and non-breaking. All existing P100-P105 playbooks, execution queue, and copilot patterns remain in place. Sales enablement is a governed companion layer: it consumes PricingRecommendation from P205, EvidenceMap from P209, buying_committees from P222, lifecycle_transitions hooks from P222, narrative generation from P225, content classifier from P223, BotID/rate-limit from P201/P224, and attribution_touches from P225. It emits deal_health_signals and WinLossRecord events back to P225 forecast + P212 LearningCandidate.

Three cross-cutting concerns distinguish P226 from prior phases: (1) class-based approval (internal auto, customer-facing always required) — a new pattern; (2) Quote-as-Snapshot immutability (Quote stores a frozen JSONB copy of PricingRecommendation at send time, never modified); (3) DealBrief auto-draft on P222 lifecycle_transitions, making DealBrief the canonical handoff context object replacing ad-hoc CRM notes.

**Primary recommendation:** Build in 7 slices across 5 waves. Wave 1 lays 15 schema tables + base contracts + fixtures. Wave 2 ships the content-engine pair (Battlecard/ObjectionLibrary/ProofPack in parallel with DealBrief/handoff/deal_health). Wave 3 ships the deal-closing pair (Proposal/Quote in parallel with DealRoom/WinLoss). Wave 4 ships API + MCP. Wave 5 closes UI, observability, RLS hardening, and Playwright/Chromatic. Start 226-01 with Wave 0 test infrastructure + 13 migrations + F-163..F-172 base contracts before any compute code.

---

## F-ID + Migration Allocation

### Verified F-ID Chain [VERIFIED: 225-07-PLAN.md + 225-RESEARCH.md F-ID table]

| Phase | F-ID range | Count |
|-------|-----------|-------|
| P221 | F-106..F-112 | 7 |
| P222 | F-113..F-121 | 9 |
| P223 | F-122..F-131 | 10 |
| P224 | F-132..F-146 | 15 |
| P225 | F-147..F-162 | 16 |
| **P226 (this phase)** | **F-163..F-180** | **18** |

### Verified Migration Chain [VERIFIED: 225-07-PLAN.md files_modified migrations 144 + 145]

| Phase | Migration range | Count |
|-------|----------------|-------|
| P221 | 101..105 | 5 |
| P222 | 106..112 | 7 |
| P223 | 113..120 | 8 |
| P224 | 121..133 | 13 |
| P225 | 134..145 | 12 |
| **P226 (this phase)** | **146..158** | **13** |

### F-163..F-180 Contract Assignment

| F-ID | Contract name | Slice | Type |
|------|---------------|-------|------|
| F-163 | sales-battlecard-v1 | 226-01 | read-write |
| F-164 | sales-battlecard-version-v1 | 226-01 | read |
| F-165 | sales-objection-library-v1 | 226-01 | read-write |
| F-166 | sales-objection-record-v1 | 226-01 | read-write |
| F-167 | sales-proof-pack-v1 | 226-01 | read-write |
| F-168 | sales-proof-pack-version-v1 | 226-01 | read |
| F-169 | sales-deal-brief-v1 | 226-01 | read-write |
| F-170 | sales-deal-room-v1 | 226-01 | read-write |
| F-171 | sales-deal-room-view-v1 | 226-01 | read |
| F-172 | sales-proposal-support-v1 | 226-01 | read-write |
| F-173 | sales-quote-v1 | 226-02 | read-write |
| F-174 | sales-winloss-record-v1 | 226-02 | read-write |
| F-175 | sales-handoff-record-v1 | 226-02 | read-write |
| F-176 | sales-deal-health-signal-v1 | 226-02 | read |
| F-177 | sales-battlecard-freshness-v1 | 226-03 | write/MCP |
| F-178 | sales-proof-pack-assemble-v1 | 226-03 | write/MCP |
| F-179 | sales-deal-brief-generate-v1 | 226-04 | write/MCP |
| F-180 | sales-deal-room-share-v1 | 226-05 | public-read |

### Migration 146..158 Assignment

| Migration | Content | Slice |
|-----------|---------|-------|
| 146 | `battlecards` + `battlecard_versions` + RLS + indexes (competitor_name, freshness_status, tenant_id) | 226-01 |
| 147 | `objection_libraries` + `objection_library_entries` + `objection_records` + RLS + indexes | 226-01 |
| 148 | `proof_packs` + `proof_pack_versions` + RLS + indexes (audience_type, freshness_status, tenant_id) | 226-01 |
| 149 | `deal_briefs` + RLS + indexes (opportunity_id, status, tenant_id) | 226-01 |
| 150 | `deal_rooms` + `deal_room_artifacts` + `deal_room_views` + RLS + indexes (share_link_token unique, opportunity_id) | 226-01 |
| 151 | `proposal_supports` + RLS + indexes (opportunity_id, status) | 226-01 |
| 152 | `quotes` + RLS + indexes (proposal_id, status) — immutable JSONB snapshot column | 226-01 |
| 153 | `winloss_records` + RLS + indexes (opportunity_id, outcome, recorded_at) | 226-01 |
| 154 | `handoff_records` + RLS + indexes (opportunity_id, from_role, to_role) | 226-01 |
| 155 | `deal_health_signals` + RLS + indexes (opportunity_id, computed_at DESC) | 226-01 |
| 156 | Hot-path composite indexes (battlecards: tenant_id+status+freshness_status; deal_rooms: share_link_token; deal_room_views: deal_room_id+viewed_at DESC) | 226-03 |
| 157 | RLS hardening pass — verify all 15 tables; share_link_token policy enforcement + honeypot field registry | 226-07 |
| 158 | OpenAPI regen + Supabase type generation + flow-registry sync | 226-07 |

---

## Standard Stack

### Core [VERIFIED: codebase reads + prior phase CONTEXT.md files P221–P225]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^2.x (inherited from P221+) | Unit + integration tests | Mandatory per QA doctrine; wired in P221 Wave 0 |
| Playwright | ^1.x (inherited) | Browser workflow proof | Mandatory per QA doctrine |
| Vercel AI SDK + Vercel AI Gateway | latest (per Vercel knowledge update) | DealBrief LLM clause-fill with provider fallback + ZDR | D-14 DealBrief gen; mirror P225 narrative pattern |
| Supabase JS v2 | ^2.x (inherited) | RLS + typed queries | Project-wide; all prior phases |
| `lib/markos/auth/botid.ts` (P201) | project-internal | BotID verification for DealRoom public share | Proven pattern from P201 + P224 |
| `lib/markos/auth/rate-limit.ts` (P201) | project-internal | IP rate-limit for public share endpoint | Proven pattern from P201 + P224 |
| `lib/markos/channels/templates/content-classifier.ts` (P223) | project-internal | Pricing/claim/competitor scan for customer-facing materials | D-27 content classifier reuse |
| Node.js `crypto` module | built-in | HMAC-SHA256 for share_link_token signing | D-54; no new dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^3.x (inherited) | Quote valid_until window, handoff SLA calculations | D-23 expiry; D-52 SLA |
| zod | ^3.x (inherited) | DealBrief clause schema, WinLossRecord taxonomy validation | Wave 0 fixture typing + runtime guards |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node.js `crypto` for HMAC | external JWT library | HMAC-SHA256 via crypto is sufficient for opaque token signing; no JWT decode overhead needed; aligns with D-54 NEVER log token posture |
| Vercel AI Gateway | Direct Anthropic API | Gateway provides provider fallback + ZDR + cost visibility; matches P225 pattern |
| Equal-weighted composite | ML-weighted composite | ML weights require training data; equal-weighted is transparent + tunable via P225 anomaly feedback |

**Installation (new dependencies only):** None. All dependencies are already installed per P221–P225 Wave 0.

---

## Schema Sketches

### 1. battlecards (migration 146) [VERIFIED: D-01]

```sql
CREATE TABLE battlecards (
  battlecard_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  competitor_name         text NOT NULL,
  competitor_profile_id   uuid,  -- FK → P205 competitor pricing knowledge object; nullable
  summary                 text NOT NULL,
  strengths_to_acknowledge text[] NOT NULL DEFAULT '{}',
  weaknesses_to_press     text[] NOT NULL DEFAULT '{}',
  ideal_positioning_angles text[] NOT NULL DEFAULT '{}',
  risky_claims_to_avoid   text[] NOT NULL DEFAULT '{}',
  proof_refs              uuid[] NOT NULL DEFAULT '{}',  -- FK → proof_packs OR EvidenceMap claim_id (polymorphic)
  last_verified_at        timestamptz,
  version                 integer NOT NULL DEFAULT 1,
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','approved','archived')),
  freshness_status        text NOT NULL DEFAULT 'fresh'
                          CHECK (freshness_status IN ('fresh','stale_claims','stale_competitor','retired')),
  approved_by             uuid REFERENCES auth.users(id),
  approved_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE battlecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY battlecards_tenant ON battlecards
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

-- Hot queries: list by freshness, competitor lookup
CREATE INDEX idx_battlecards_tenant_freshness ON battlecards(tenant_id, freshness_status) WHERE status = 'approved';
CREATE INDEX idx_battlecards_competitor ON battlecards(tenant_id, competitor_name) WHERE status != 'archived';
```

### 2. battlecard_versions (migration 146) [VERIFIED: D-01 + D-18 audit trail]

```sql
CREATE TABLE battlecard_versions (
  version_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battlecard_id   uuid NOT NULL REFERENCES battlecards(battlecard_id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  version         integer NOT NULL,
  snapshot        jsonb NOT NULL,  -- full battlecard row at version time
  changed_by      uuid REFERENCES auth.users(id),
  changed_at      timestamptz NOT NULL DEFAULT now(),
  change_reason   text,
  UNIQUE (battlecard_id, version)
);

ALTER TABLE battlecard_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY battlecard_versions_tenant ON battlecard_versions
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 3. objection_libraries + objection_library_entries + objection_records (migration 147) [VERIFIED: D-02]

```sql
CREATE TABLE objection_libraries (
  library_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','approved','archived')),
  version         integer NOT NULL DEFAULT 1,
  owner_user_id   uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE objection_libraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY objection_libraries_tenant ON objection_libraries
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE TABLE objection_library_entries (
  entry_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id              uuid NOT NULL REFERENCES objection_libraries(library_id) ON DELETE CASCADE,
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  objection_text          text NOT NULL,
  response_text           text NOT NULL,
  evidence_refs           uuid[] NOT NULL DEFAULT '{}',
  pricing_context_id      uuid,  -- FK → P205 PricingRecommendation; nullable
  competitor_profile_id   uuid,  -- nullable; links to competitive landscape
  category                text NOT NULL
                          CHECK (category IN ('price','feature','timing','security','integration','support','contract','custom')),
  last_verified_at        timestamptz,
  freshness_status        text NOT NULL DEFAULT 'fresh'
                          CHECK (freshness_status IN ('fresh','stale_claims','retired')),
  version                 integer NOT NULL DEFAULT 1,
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','approved','archived')),
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE objection_library_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY objection_library_entries_tenant ON objection_library_entries
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_objection_entries_library ON objection_library_entries(library_id, status);
CREATE INDEX idx_objection_entries_category ON objection_library_entries(tenant_id, category) WHERE status = 'approved';

-- Per-deal objection records
CREATE TABLE objection_records (
  record_id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id                  uuid NOT NULL,  -- FK → P222 opportunities
  objection_text                  text NOT NULL,
  response_text                   text,
  evidence_refs                   uuid[] NOT NULL DEFAULT '{}',
  raised_by_committee_member_id   uuid,  -- FK → P222 buying_committee_members; nullable (D-02)
  addressed_at                    timestamptz,
  addressed_by_user_id            uuid REFERENCES auth.users(id),
  status                          text NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open','addressed','deferred','resolved')),
  created_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE objection_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY objection_records_tenant ON objection_records
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_objection_records_opp ON objection_records(opportunity_id, status);
```

### 4. proof_packs + proof_pack_versions (migration 148) [VERIFIED: D-04, D-11..D-13]

```sql
CREATE TABLE proof_packs (
  proof_pack_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  audience_type       text NOT NULL
                      CHECK (audience_type IN ('executive','marketing_lead','finance','security','technical','customer_success')),
  name                text NOT NULL,
  summary             text,
  case_study_refs     uuid[] NOT NULL DEFAULT '{}',
  benchmark_refs      uuid[] NOT NULL DEFAULT '{}',
  roi_refs            uuid[] NOT NULL DEFAULT '{}',
  security_refs       uuid[] NOT NULL DEFAULT '{}',
  pricing_refs        uuid[] NOT NULL DEFAULT '{}',  -- FK → P205 PricingRecommendation (REFERENCE ONLY)
  evidence_refs       uuid[] NOT NULL DEFAULT '{}',  -- FK → P209 EvidenceMap claim_id
  approval_state      text NOT NULL DEFAULT 'draft'
                      CHECK (approval_state IN ('draft','pending_approval','approved','retired')),
  freshness_status    text NOT NULL DEFAULT 'fresh'
                      CHECK (freshness_status IN ('fresh','stale_claims','retired')),
  version             integer NOT NULL DEFAULT 1,
  snapshot_at         timestamptz,  -- set at first approval
  approved_by         uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proof_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY proof_packs_tenant ON proof_packs
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_proof_packs_audience ON proof_packs(tenant_id, audience_type, approval_state);
CREATE INDEX idx_proof_packs_freshness ON proof_packs(tenant_id, freshness_status) WHERE approval_state = 'approved';

CREATE TABLE proof_pack_versions (
  ppv_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_pack_id   uuid NOT NULL REFERENCES proof_packs(proof_pack_id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  version         integer NOT NULL,
  snapshot        jsonb NOT NULL,   -- full proof_pack row at version time
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proof_pack_id, version)
);

ALTER TABLE proof_pack_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY proof_pack_versions_tenant ON proof_pack_versions
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);
```

### 5. deal_briefs (migration 149) [VERIFIED: D-03, D-14..D-16]

```sql
CREATE TABLE deal_briefs (
  deal_brief_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id              uuid NOT NULL,  -- FK → P222 opportunities
  account_id                  uuid,           -- FK → P222 customer_360_records
  objective                   text,
  current_stage               text,
  stakeholders                uuid[] NOT NULL DEFAULT '{}',  -- FK → P222 buying_committee_members
  open_objections             uuid[] NOT NULL DEFAULT '{}',  -- FK → objection_records
  required_artifacts          jsonb NOT NULL DEFAULT '[]',   -- [{artifact_kind, status}]
  recommended_next_steps      jsonb NOT NULL DEFAULT '[]',   -- [{text, rationale, nba_id}]
  pricing_context_id          uuid,   -- FK → P205 PricingRecommendation
  evidence_refs               uuid[] NOT NULL DEFAULT '{}',  -- FK → P209 EvidenceMap
  generation_kind             text NOT NULL DEFAULT 'auto_drafted'
                              CHECK (generation_kind IN ('auto_drafted','operator_created','regenerated_on_handoff')),
  generated_by_run_id         uuid,   -- FK → markos_agent_runs (P207)
  version                     integer NOT NULL DEFAULT 1,
  status                      text NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','pending_approval','approved','archived')),
  approved_by                 uuid REFERENCES auth.users(id),
  approved_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deal_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_briefs_tenant ON deal_briefs
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_deal_briefs_opp ON deal_briefs(opportunity_id, status);
CREATE INDEX idx_deal_briefs_tenant_status ON deal_briefs(tenant_id, status, created_at DESC);
```

### 6. deal_rooms + deal_room_artifacts + deal_room_views (migration 150) [VERIFIED: D-05, D-29..D-33]

```sql
CREATE TABLE deal_rooms (
  deal_room_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id          uuid NOT NULL,  -- FK → P222 opportunities
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','live','closed')),
  share_link_token        text UNIQUE NOT NULL,  -- HMAC-signed opaque token; NEVER log
  share_link_expires_at   timestamptz,
  last_activity_at        timestamptz,
  owner_user_id           uuid REFERENCES auth.users(id),
  public_share_enabled    boolean NOT NULL DEFAULT false,
  botid_required          boolean NOT NULL DEFAULT true,
  rate_limit_per_ip       integer NOT NULL DEFAULT 10,  -- per minute
  created_at              timestamptz NOT NULL DEFAULT now(),
  closed_at               timestamptz
);

ALTER TABLE deal_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_rooms_tenant ON deal_rooms
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

-- Public share read-only policy (no tenant context — reads by token only)
-- CRITICAL: enforced in middleware + API handler; RLS cannot filter by token directly on public path
-- Public endpoint handler validates HMAC before any DB access

CREATE UNIQUE INDEX idx_deal_rooms_token ON deal_rooms(share_link_token);
CREATE INDEX idx_deal_rooms_opp ON deal_rooms(tenant_id, opportunity_id);
CREATE INDEX idx_deal_rooms_status_expiry ON deal_rooms(status, share_link_expires_at)
  WHERE status = 'live';  -- cron expiry scan

CREATE TABLE deal_room_artifacts (
  artifact_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id        uuid NOT NULL REFERENCES deal_rooms(deal_room_id) ON DELETE CASCADE,
  tenant_id           uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  artifact_kind       text NOT NULL
                      CHECK (artifact_kind IN ('proof_pack','deal_brief','battlecard','quote','proposal_support','case_study','video','custom_html')),
  artifact_target_kind text NOT NULL,  -- e.g., 'proof_pack', 'deal_brief'
  artifact_target_id  uuid NOT NULL,   -- polymorphic; per-kind CHECK below
  display_order       integer NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'visible'
                      CHECK (status IN ('visible','hidden')),
  -- Per-kind FK enforcement via partial unique (carry P224 D-14 pattern)
  CHECK (
    (artifact_kind = 'proof_pack'       AND artifact_target_kind = 'proof_pack') OR
    (artifact_kind = 'deal_brief'       AND artifact_target_kind = 'deal_brief') OR
    (artifact_kind = 'battlecard'       AND artifact_target_kind = 'battlecard') OR
    (artifact_kind = 'quote'            AND artifact_target_kind = 'quote') OR
    (artifact_kind = 'proposal_support' AND artifact_target_kind = 'proposal_support') OR
    (artifact_kind IN ('case_study','video','custom_html'))
  )
);

ALTER TABLE deal_room_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_room_artifacts_tenant ON deal_room_artifacts
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_deal_room_artifacts_room ON deal_room_artifacts(deal_room_id, display_order)
  WHERE status = 'visible';

CREATE TABLE deal_room_views (
  view_id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id            uuid NOT NULL REFERENCES deal_rooms(deal_room_id) ON DELETE CASCADE,
  stakeholder_email       text,  -- nullable; NO raw PII — hash only in production. See D-30.
  stakeholder_role        text,  -- nullable; BuyingRole enum from P222
  viewed_at               timestamptz NOT NULL DEFAULT now(),
  ip_hash                 text NOT NULL,   -- SHA-256 of IP; NEVER store raw IP
  user_agent_hash         text NOT NULL,   -- SHA-256 of UA
  time_on_page_seconds    integer
);

-- No RLS needed: views are written by unauth public path; read only by authenticated operator
ALTER TABLE deal_room_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_room_views_read ON deal_room_views
  FOR SELECT USING (
    deal_room_id IN (
      SELECT deal_room_id FROM deal_rooms
      WHERE tenant_id = current_setting('app.active_tenant_id')::uuid
    )
  );
CREATE POLICY deal_room_views_insert ON deal_room_views
  FOR INSERT WITH CHECK (true);  -- public insert allowed; honeypot blocks bots before insert

CREATE INDEX idx_deal_room_views_room ON deal_room_views(deal_room_id, viewed_at DESC);
```

### 7. proposal_supports (migration 151) [VERIFIED: D-06]

```sql
CREATE TABLE proposal_supports (
  proposal_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id          uuid NOT NULL,  -- FK → P222 opportunities
  deal_brief_id           uuid REFERENCES deal_briefs(deal_brief_id) ON DELETE SET NULL,
  pricing_context_id      uuid,  -- FK → P205 PricingRecommendation (REFERENCE ONLY)
  evidence_pack_id        uuid,  -- FK → P209 evidence pack
  executive_summary       text,
  customer_success_plan   text,
  terms_summary           text,
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','pending_approval','approved','sent','accepted','rejected','expired')),
  sent_to_email           text[] NOT NULL DEFAULT '{}',
  sent_at                 timestamptz,
  valid_until             timestamptz,
  approved_by             uuid REFERENCES auth.users(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proposal_supports ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposal_supports_tenant ON proposal_supports
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_proposal_supports_opp ON proposal_supports(opportunity_id, status);
```

### 8. quotes (migration 152) [VERIFIED: D-07, D-21..D-24]

```sql
CREATE TABLE quotes (
  quote_id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                           uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  proposal_id                         uuid REFERENCES proposal_supports(proposal_id) ON DELETE SET NULL,
  pricing_recommendation_snapshot     jsonb NOT NULL,  -- IMMUTABLE full P205 record at snapshot_at; NEVER modified
  pricing_recommendation_id           uuid NOT NULL,   -- FK → P205; original source (reference only)
  snapshot_at                         timestamptz NOT NULL DEFAULT now(),
  valid_until                         timestamptz,
  status                              text NOT NULL DEFAULT 'draft'
                                      CHECK (status IN ('draft','sent','accepted','rejected','expired','superseded_by')),
  superseded_by                       uuid REFERENCES quotes(quote_id),  -- self-FK
  customer_signature_evidence_ref     uuid,  -- FK → P209 EvidenceMap; nullable until accepted
  created_at                          timestamptz NOT NULL DEFAULT now(),
  updated_at                          timestamptz NOT NULL DEFAULT now(),
  -- Immutability: once sent, snapshot + amounts cannot change (enforce via trigger or application layer)
  CONSTRAINT quotes_snapshot_not_empty CHECK (pricing_recommendation_snapshot != '{}'::jsonb)
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_tenant ON quotes
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_quotes_proposal ON quotes(proposal_id, status);
CREATE INDEX idx_quotes_expiry ON quotes(status, valid_until)
  WHERE status IN ('sent','draft');  -- expiry cron scan
```

### 9. winloss_records (migration 153) [VERIFIED: D-08, D-40..D-42]

```sql
CREATE TABLE winloss_records (
  record_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id              uuid NOT NULL,  -- FK → P222 opportunities
  outcome                     text NOT NULL
                              CHECK (outcome IN ('won','lost','no_decision','ghosted','postponed')),
  primary_reason              text NOT NULL
                              CHECK (primary_reason IN ('price','feature','timing','competitor','champion_left',
                                'budget_freeze','internal_priorities','security_compliance','integration_gap',
                                'support_concern','contract_terms','no_decision','custom')),
  secondary_reasons           text[] NOT NULL DEFAULT '{}',  -- same enum values
  competitive_set             jsonb NOT NULL DEFAULT '[]',   -- [{competitor_name, profile_id}]
  features_evaluated          uuid[] NOT NULL DEFAULT '{}',  -- product feature refs
  objection_history           uuid[] NOT NULL DEFAULT '{}',  -- FK → objection_records
  price_drivers               uuid[] NOT NULL DEFAULT '{}',  -- FK → quotes
  champion_id                 uuid,  -- FK → P222 buying_committee_members; SCRUBBED on tombstone
  decision_maker_id           uuid,  -- FK → P222 buying_committee_members; SCRUBBED on tombstone
  free_text_notes             text,  -- SCRUBBED on tombstone if contains PII
  attribution_touch_ids       uuid[] NOT NULL DEFAULT '{}',  -- FK → P225 attribution_touches
  recorded_at                 timestamptz NOT NULL DEFAULT now(),
  recorded_by_user_id         uuid REFERENCES auth.users(id),
  tombstoned                  boolean NOT NULL DEFAULT false,  -- D-56 tombstone flag
  tombstoned_at               timestamptz
);

ALTER TABLE winloss_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY winloss_records_tenant ON winloss_records
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_winloss_records_opp ON winloss_records(opportunity_id);
CREATE INDEX idx_winloss_records_outcome ON winloss_records(tenant_id, outcome, recorded_at DESC);
```

### 10. handoff_records (migration 154) [VERIFIED: D-09, D-34..D-36]

```sql
CREATE TABLE handoff_records (
  handoff_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id              uuid NOT NULL,  -- FK → P222 opportunities
  customer_360_id             uuid,           -- FK → P222 customer_360_records
  from_role                   text NOT NULL
                              CHECK (from_role IN ('marketing_owner','deal_owner','cs_owner')),
  to_role                     text NOT NULL
                              CHECK (to_role IN ('marketing_owner','deal_owner','cs_owner')),
  from_user_id                uuid REFERENCES auth.users(id),
  to_user_id                  uuid REFERENCES auth.users(id),
  summary                     text,
  evidence_refs               uuid[] NOT NULL DEFAULT '{}',
  deal_brief_id               uuid REFERENCES deal_briefs(deal_brief_id) ON DELETE SET NULL,
  context_artifacts           jsonb NOT NULL DEFAULT '[]',  -- [{artifact_kind, ref}]
  handed_off_at               timestamptz NOT NULL DEFAULT now(),
  acknowledged_at             timestamptz,
  acknowledged_by_user_id     uuid REFERENCES auth.users(id),
  -- SLA: if acknowledged_at IS NULL AND handed_off_at < now() - interval '24h' → escalation task
  CHECK (from_role != to_role)  -- handoff must change roles
);

ALTER TABLE handoff_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY handoff_records_tenant ON handoff_records
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_handoff_records_opp ON handoff_records(opportunity_id);
CREATE INDEX idx_handoff_records_unack ON handoff_records(tenant_id, handed_off_at)
  WHERE acknowledged_at IS NULL;  -- SLA cron scan
```

### 11. deal_health_signals (migration 155) [VERIFIED: D-10, D-37..D-39]

```sql
CREATE TABLE deal_health_signals (
  signal_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_tenants(tenant_id) ON DELETE CASCADE,
  opportunity_id              uuid NOT NULL,  -- FK → P222 opportunities
  period_start                timestamptz NOT NULL,
  period_end                  timestamptz NOT NULL,
  stage_velocity_score        numeric(5,3),  -- ratio: avg_closed_won_time / time_in_current_stage; >1.0 = slower
  objection_density_score     numeric(5,3),  -- open_objection_count × severity_weight / time_in_stage_days
  champion_engagement_score   numeric(5,3),  -- recent activity events from champion_id / 7-day baseline
  competitive_threat_score    numeric(5,3),  -- mention frequency of competitive_set in P225 events
  deal_health_score           numeric(5,2) NOT NULL CHECK (deal_health_score BETWEEN 0 AND 100),  -- composite 0-100
  risk_factors                jsonb NOT NULL DEFAULT '[]',  -- [{factor, value, threshold}]
  computed_at                 timestamptz NOT NULL DEFAULT now(),
  source_event_ref            uuid,  -- threads to cdp_events for P225 forecast consumption (D-38)
  UNIQUE (opportunity_id, period_start, period_end)  -- one signal per period per opp
);

ALTER TABLE deal_health_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_health_signals_tenant ON deal_health_signals
  FOR ALL USING (tenant_id = current_setting('app.active_tenant_id')::uuid);

CREATE INDEX idx_deal_health_opp ON deal_health_signals(opportunity_id, computed_at DESC);
CREATE INDEX idx_deal_health_score ON deal_health_signals(tenant_id, deal_health_score)
  WHERE deal_health_score < 40;  -- D-39 at-risk threshold scan
```

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/sales/
├── battlecards/
│   ├── battlecard.ts          # CRUD + freshness computation
│   ├── freshness-auditor.ts   # EvidenceMap claim TTL inheritance (D-17)
│   └── battlecard-versions.ts # version snapshot on approval
├── objections/
│   ├── library.ts             # ObjectionLibrary + entries CRUD
│   └── records.ts             # per-deal ObjectionRecord management
├── proof-packs/
│   ├── proof-pack.ts          # CRUD + snapshot on approval (D-11)
│   ├── freshness-auditor.ts   # EvidenceMap claim TTL refresh (D-12)
│   └── renderer.ts            # fail-closed render check (D-13)
├── deal-briefs/
│   ├── generator.ts           # AgentRun-wrapped LLM clause-fill (D-14)
│   ├── claim-auditor.ts       # per-clause EvidenceMap audit (D-14)
│   └── deal-brief.ts          # CRUD + approval gate
├── deal-rooms/
│   ├── deal-room.ts           # CRUD + share_link_token generation
│   ├── share-token.ts         # HMAC-SHA256 sign/verify (D-54)
│   ├── artifacts.ts           # artifact list management
│   └── view-tracker.ts        # BotID + rate-limit + honeypot (D-29/D-33)
├── proposals/
│   ├── proposal-support.ts    # CRUD + approval gate
│   └── content-classifier.ts  # reuse P223 classifier (D-27)
├── quotes/
│   └── quote.ts               # immutable snapshot + supersedence (D-21..D-24)
├── winloss/
│   ├── winloss-record.ts      # CRUD + cdp_events emit (D-40..D-42)
│   └── learning-emit.ts       # LearningCandidate emit (D-41)
├── handoffs/
│   └── handoff.ts             # handoff_record + DealBrief regen (D-34..D-36)
├── health-signals/
│   ├── signal-computer.ts     # composite formula + cdp_events emit (D-37/D-38)
│   └── threshold-evaluator.ts # decision rules (D-39)
└── approvals/
    └── class-gate.ts          # class-based approval (D-25..D-28)
```

### Pattern 1: Class-Based Approval Gate

**What:** Internal materials (battlecard, objection_library, internal DealBrief, deal_health_signals) auto-approve within sender role. Customer-facing materials always require approval (P208 Approval Inbox + P105 approval-package).
**When to use:** Every mutation that produces a customer-visible artifact.

```typescript
// Source: D-25..D-28 + lib/markos/crm/copilot.ts buildApprovalPackage pattern [VERIFIED: codebase read]
export type ApprovalClass = 'internal_auto' | 'customer_facing_required';

export function resolveApprovalClass(artifactKind: SalesArtifactKind): ApprovalClass {
  const INTERNAL_ONLY = new Set(['battlecard', 'objection_library', 'internal_deal_brief', 'deal_health_signal']);
  return INTERNAL_ONLY.has(artifactKind) ? 'internal_auto' : 'customer_facing_required';
}

export async function gateApproval(
  artifactKind: SalesArtifactKind,
  mutationPayload: unknown,
  actorId: string,
): Promise<{ approved: boolean; approval_ref: string | null }> {
  const cls = resolveApprovalClass(artifactKind);
  if (cls === 'internal_auto') {
    return { approved: true, approval_ref: null };
  }
  // Delegate to P105 buildApprovalPackage
  const pkg = await buildApprovalPackage({ kind: artifactKind, payload: mutationPayload, requested_by: actorId });
  return { approved: false, approval_ref: pkg.approval_id };
}
```

### Pattern 2: HMAC share_link_token

**What:** Opaque token signed with HMAC-SHA256 using per-tenant key. Token encodes: `{tenant_id_prefix}:{random_uuid}`. Signed with rotating key stored in Edge Config.
**When to use:** Every DealRoom share-link generation.

```typescript
// Source: D-54 + Node.js crypto (built-in) [ASSUMED pattern; crypto API VERIFIED: built-in]
import { createHmac, randomUUID } from 'node:crypto';

export function generateShareToken(tenantId: string, signingKey: string): string {
  const nonce = randomUUID();
  const payload = `${tenantId.slice(0, 8)}:${nonce}`;
  const sig = createHmac('sha256', signingKey).update(payload).digest('hex').slice(0, 16);
  return `${payload}:${sig}`;
}

export function verifyShareToken(token: string, signingKey: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [prefix, nonce, sig] = parts;
  const expected = createHmac('sha256', signingKey).update(`${prefix}:${nonce}`).digest('hex').slice(0, 16);
  // Constant-time compare
  return sig.length === expected.length &&
    Buffer.from(sig).every((b, i) => b === Buffer.from(expected)[i]);
}
```

### Pattern 3: DealBrief Auto-Draft via P222 lifecycle hook

**What:** P222 `lifecycle_transitions` fires hook on stage change to 'sql'/'opportunity'. Hook calls `generateDealBrief(opportunity_id, trigger)` wrapped in AgentRun (P207).
**When to use:** D-14; carried from P222 D-12 hook target.

```typescript
// Source: D-14 + P225 narrative gen pattern (AgentRun + Vercel AI SDK) [ASSUMED module path]
// lib/markos/sales/deal-briefs/generator.ts
export async function generateDealBrief(
  opportunityId: string,
  trigger: 'stage_change' | 'handoff' | 'manual',
  agentRunId: string,
): Promise<{ deal_brief_id: string; status: 'draft' }> {
  // 1. Fetch P222 opportunity + buying_committees + open_objections + nba_records
  // 2. Fetch P205 pricing_context_id
  // 3. Scaffold template clauses
  // 4. LLM fill via Vercel AI Gateway (claude-sonnet-4-6 default)
  // 5. Per-clause claim audit (P209 EvidenceMap)
  // 6. Insert deal_briefs row with status='draft', generated_by_run_id
  // 7. Return deal_brief_id — operator must approve before customer-facing use
}
```

### Pattern 4: Quote-as-Snapshot Immutability

**What:** When Quote.status transitions from 'draft' to 'sent', `pricing_recommendation_snapshot` JSONB is frozen. No subsequent mutation of that column is allowed. Pricing change → new Quote with status='superseded_by' on old.

```typescript
// Source: D-07 + D-21..D-24 [VERIFIED: CONTEXT.md locked decision]
export async function sendQuote(quoteId: string, actorId: string): Promise<void> {
  // 1. Assert class-based approval passed (customer-facing → required)
  // 2. Assert current status = 'draft'
  // 3. content classifier scan (D-27) — no unbound pricing variables
  // 4. Freeze: quotes.status = 'sent'; pricing_recommendation_snapshot is already stored and immutable
  // 5. Audit log: markos_audit_log entry (D-55)
  // 6. Emit cdp_events with event_domain='sales', event_name='quote.sent'
}
```

### Pattern 5: ProofPack Render-Time Fail-Closed

**What:** Before rendering a ProofPack to any surface (DealRoom, ProposalSupport), check freshness_status. If != 'fresh', return 503 + audit row. Mirrors P224 D-19 pattern.

```typescript
// Source: D-13 + P224 D-19 pattern [VERIFIED: P224 CONTEXT.md]
export function assertProofPackFresh(proofPack: { freshness_status: string }): void {
  if (proofPack.freshness_status !== 'fresh') {
    throw new ProofPackStaleError(
      `ProofPack freshness_status='${proofPack.freshness_status}': render blocked. Re-approve to refresh.`
    );
  }
}
```

### Anti-Patterns to Avoid

- **Storing computed freshness_status only in memory:** Must persist in DB so cron can scan and operator can query without re-computing.
- **Quote modification after status='sent':** Application MUST enforce immutability; trigger or policy guard in addition to application check.
- **Logging share_link_token in middleware:** Mask before any log sink. Use token prefix only for debug logs.
- **Using lifecycle_transitions hook without debounce:** DealBrief regeneration loop can fire rapidly; debounce 1h per opportunity_id.
- **Polymorphic FK without per-kind CHECK constraint:** Carry P224 D-14 pattern exactly; CHECK constraint enforces target kind alignment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM clause-fill for DealBrief | Custom LLM invocation | `lib/markos/analytics/narrative/*` (P225) + Vercel AI Gateway | P225 already ships hybrid template+LLM+claim-audit pattern; reuse the same scaffold |
| Pricing/claim/competitor scan | Custom content scanner | `lib/markos/channels/templates/content-classifier.ts` (P223 D-16) | Classifier already handles pricing variables + claim refs + competitor name detection |
| BotID verification | Custom bot detection | `lib/markos/auth/botid.ts` (P201) | Proven; Vercel-integrated; fail-closed already implemented |
| Rate-limit for share endpoint | Custom IP limiter | `lib/markos/auth/rate-limit.ts` (P201) + Edge Config | hashIp + windowStart already in project; Edge Config windows |
| Approval routing | Custom approval flows | `lib/markos/crm/agent-actions.ts::buildApprovalPackage` (P105) + P208 Approval Inbox | P105 approval-package factory is the canonical approval entry point |
| AgentRun wrapper for generation | Custom run management | `markos_agent_runs` (P207) + run-engine.cjs | AgentRun already handles state machine, DAG, retry, audit, cost |
| share_link_token signing | Custom signing scheme | `node:crypto` HMAC-SHA256 + Edge Config key | No new dependency; constant-time compare already safe pattern |
| cdp_events emit | Custom event bus | `cdp_events` (P221 D-08) fan-out pattern | All commercial engines use same event table; P225 forecast reads from there |
| Tombstone PII scrub | Custom GDPR logic | P221 D-24 cascade + P222 D-32 pattern | Tombstone cascade already defined; P226 extends same chain |
| Audit trail | Custom audit log | `markos_audit_log` (P201 hash chain) | SHA-256 hash chain audit log is project-wide SOR |

**Key insight:** P226 is explicitly a thin governance layer. Every hard problem (LLM gen, claim safety, approval, event emission, BotID, rate-limit, tombstone) is already solved upstream. The phase adds SOR tables + orchestration logic that connects existing modules — it must not duplicate any infrastructure.

---

## Integration Contracts

### Upstream dependencies

| Upstream | What P226 Consumes | How |
|----------|--------------------|-----|
| P205 PricingRecommendation | `quotes.pricing_recommendation_id` FK; `quotes.pricing_recommendation_snapshot` JSONB frozen at send | `pricing_context_id` ref on deal_briefs + proposal_supports; never own pricing logic |
| P207 AgentRun | Wraps DealBrief LLM generation; `deal_briefs.generated_by_run_id` FK | `createRunEnvelope` + `assertTransitionAllowed` from run-engine.cjs |
| P208 Approval Inbox | Approval entries: proposal_publish, proofpack_approve, deal_room_enable_share, quote_send, customer_dealbrief_publish, handoff_acknowledge | `buildApprovalPackage` from `lib/markos/crm/copilot.ts` |
| P209 EvidenceMap | `evidence_refs[]` on battlecards, proof_packs, deal_briefs, objection_library_entries; claim TTL freshness; per-clause audit in DealBrief | P209 freshness audit cron → fires freshness_status updates |
| P212 LearningCandidate | WinLossRecord close → emit LearningCandidate | `winloss/learning-emit.ts` → P212 candidate creation |
| P221 cdp_events | deal_health_signals emit + WinLossRecord emit + DealRoom view tracking events | `event_domain='sales'`; `source_event_ref` thread |
| P221 tombstone | scrub `winloss_records.champion_id + decision_maker_id + objection_records.raised_by_committee_member_id` on profile tombstone | Cascade chain: P221 D-24 → P222 D-32 → P224 → P225 D-45 → P226 D-56 |
| P222 opportunities | FK target for `deal_briefs.opportunity_id`, `deal_rooms.opportunity_id`, `winloss_records.opportunity_id` | Stage transition 'sql'/'opportunity' → auto-draft trigger |
| P222 buying_committee_members | FK for `deal_briefs.stakeholders[]`, `objection_records.raised_by_committee_member_id`, `winloss_records.champion_id + decision_maker_id` | committee coverage_score change >10% → DealBrief regen |
| P222 lifecycle_transitions | Append-only event table; hook target for DealBrief auto-draft + handoff_record creation | `from_role → to_role` ownership change fires `recordHandoff()` |
| P223 content_classifier | Pricing/claim/competitor scan before customer-facing material publish (D-27) | Direct module import |
| P224 BotID + rate-limit | Public `/share/dr/{token}` endpoint defense | `verifyBotIdToken` + `checkSignupRateLimit` (adapted for IP-per-min) |
| P225 attribution_touches | `winloss_records.attribution_touch_ids[]` FK; win attribution drill-down | `touch_id` FK array; no write to P225 tables |
| P225 narrative gen | DealBrief LLM clause-fill reuses hybrid template+LLM+claim-audit scaffold | Module path TBD at plan time (lib/markos/analytics/narrative or promoted to lib/markos/llm/hybrid-gen) |

### Downstream consumers

| Downstream | What They Consume from P226 |
|------------|----------------------------|
| P225 forecast | `deal_health_signals` via `cdp_events` (`source_event_ref` thread) |
| P225 attribution | `winloss_records.attribution_touch_ids[]` for win/loss attribution analysis |
| P212 LearningCandidate | WinLossRecord close event → `primary_reason` + `competitive_set` as learning input |
| P227 co-sell | `battlecards` + `proof_packs` + `deal_room_artifacts` as partner co-sell content |
| P228 integration audit | `deal_health_signals` + `winloss_records` for cross-engine deal health closure |

---

## Slice Boundaries

### Wave 1

#### 226-01: Schema foundation + Wave 0 test infrastructure
- 15 tables (migrations 146–155)
- Hot-path index pass (migration 156 deferred to 226-03)
- F-163..F-172 base contract stubs
- Wave 0 test fixtures under `test/fixtures/sales/`
- Depends on: nothing (greenfield SOR tables)
- Decision coverage: D-01..D-10 (schema only)

### Wave 2 (parallel pair)

#### 226-02: Battlecard + ObjectionLibrary + ProofPack engine
- Freshness auditor (D-17..D-20), EvidenceMap claim TTL inheritance
- ProofPack snapshot at approval (D-11), version creation (D-12), render-time fail-closed (D-13)
- Battlecard stale auto-check (D-19), content classifier integration (D-27)
- F-163..F-165, F-167..F-168, F-177..F-178
- Depends on: 226-01

#### 226-03: DealBrief auto-draft + handoff_record + deal_health_signals
- P222 lifecycle_transitions hook wiring (D-14)
- DealBrief LLM generation via P225 narrative scaffold + AgentRun (D-14..D-16)
- Claim audit per clause (D-14)
- deal_health_signals composite computation + cdp_events emit (D-37..D-39)
- handoff_record creation + DealBrief regen on ownership change (D-34..D-36)
- F-169, F-175, F-176
- Depends on: 226-01
- Parallel with: 226-02

### Wave 3 (parallel pair)

#### 226-04: ProposalSupport + Quote-as-Snapshot + ContentClassifier
- Class-based approval gate (D-25..D-28)
- Quote immutability + supersedence (D-21..D-24)
- Content classifier scan before customer-facing publish (D-27)
- F-172, F-173
- Depends on: 226-01, 226-02

#### 226-05: DealRoom + public share + WinLossRecord
- HMAC share_link_token (D-54)
- BotID + rate-limit + honeypot on `/share/dr/{token}` (D-29, D-33)
- ISR cacheTag/updateTag on artifact change (D-31)
- Expiry cron (D-32)
- WinLossRecord required on stage transition (D-40..D-42)
- attribution_touch_ids[] + cdp_events emit + LearningCandidate emit (D-41..D-42)
- F-170, F-171, F-174, F-180
- Depends on: 226-01, 226-02, 226-03
- Parallel with: 226-04

### Wave 4

#### 226-06: API + 8 MCP tools + approval routing
- Full `/v1/sales/*` read-write API (D-43)
- 8 MCP tools (D-44): get_battlecard, assemble_proof_pack, generate_deal_brief, create_deal_room, generate_quote, record_winloss, list_open_objections, get_handoff_brief
- Approval-package on all write mutations (D-45)
- OpenAPI regen (migration 158 will follow in 226-07)
- F-175..F-179 (MCP tool contracts)
- Depends on: 226-01..226-05

### Wave 5

#### 226-07: UI workspaces + Approval Inbox + Morning Brief + observability + RLS hardening + closeout
- 6 UI workspaces (D-46..D-47)
- Approval Inbox new entry types (D-48)
- Morning Brief additions (D-49)
- Freshness audit cron (D-50), DealRoom view spike alert (D-51), handoff SLA cron (D-52), WinLoss coverage cron (D-53)
- RLS hardening pass (migration 157) + OpenAPI regen (migration 158)
- Playwright operator journeys
- Chromatic for 6 UI workspaces
- Depends on: 226-01..226-06

---

## Common Pitfalls

### Pitfall 1: Battlecard freshness operator override vs claim freshness
**What goes wrong:** Operator sets `last_verified_at` to today, expecting battlecard to be 'fresh', but an underlying EvidenceMap claim has TTL expired. The battlecard still renders as stale.
**Why it happens:** `last_verified_at` is an OPERATOR-attestation timestamp, not a claim freshness override. D-17 is explicit: `freshness_status = MIN(EvidenceMap.freshness_mode of all proof_refs[])`. A recent `last_verified_at` does NOT override individual claim staleness.
**How to avoid:** Recompute `freshness_status` from claim TTLs after operator verify action. If any claim is stale, set `freshness_status='stale_claims'` regardless of `last_verified_at`. Surface this distinction in the BattlecardEditor UI.
**Warning signs:** Operator reports "I just verified this but it still shows stale."

### Pitfall 2: DealRoom share-link token enumeration
**What goes wrong:** UUID-only tokens are guessable at scale via brute force or IDOR if sequential patterns exist.
**Why it happens:** UUID v4 has ~122 bits of entropy — safe in isolation but no integrity check. An attacker who observes one token could craft related tokens.
**How to avoid:** HMAC-SHA256 sign the token. Validate signature server-side before any DB read. Rotate signing key per tenant via Edge Config. Never log or expose raw token. Return 410 Gone for expired tokens (not 404, to avoid oracle leaks).
**Warning signs:** 400+ requests per minute to `/share/dr/*` from a single IP range.

### Pitfall 3: Quote pricing drift mid-deal
**What goes wrong:** `quotes.pricing_recommendation_snapshot` is stored but a subsequent DB update also changes the `pricing_recommendation_id` FK target record. The snapshot becomes inconsistent with the FK reference.
**Why it happens:** The P205 PricingRecommendation table allows version updates (it's the SOR). P226 only stores the FK reference, which always resolves to the LATEST record.
**How to avoid:** `pricing_recommendation_snapshot` is frozen at `snapshot_at`; it is the authoritative price record, not the FK. All quote display and audit logic reads from the JSONB snapshot, not the FK. Quote status='sent' should be enforced as immutable via a DB-level trigger or application CHECK.
**Warning signs:** Quote `sent` status showing price different from what customer received.

### Pitfall 4: DealBrief regeneration loop
**What goes wrong:** P222 lifecycle_transitions fires on rapid stage changes (e.g., automated pipeline moves). DealBrief re-generation fires 3-4 times per minute per opportunity, exhausting AgentRun budget.
**Why it happens:** D-16 lists multiple regeneration triggers; no debounce in the base hook.
**How to avoid:** Debounce DealBrief regeneration per `opportunity_id` with 1-hour window. Use AgentRun idempotency key (`opportunity_id:trigger:period_bucket`) to deduplicate. Log suppressed generations to `markos_audit_log`.
**Warning signs:** AgentRun cost spike correlating with high-activity pipeline stages.

### Pitfall 5: WinLossRecord coercion
**What goes wrong:** Operator bulk-updates stage to 'lost' across multiple opportunities without filling structured fields. Empty WinLossRecords are created with `outcome` only, polluting P225 attribution and P212 LearningCandidate data.
**Why it happens:** Stage transition API allows batch writes; WinLossRecord creation may be async or fire without validation.
**How to avoid:** UI MUST block stage transition to 'customer'/'lost'/'no_decision' without WinLossRecord creation. API MUST validate that `primary_reason` + `competitive_set` (if applicable) are non-empty. Return 422 if WinLossRecord precondition not met.
**Warning signs:** High percentage of WinLossRecords with empty `secondary_reasons[]` and default `competitive_set=[]`.

### Pitfall 6: DealRoom artifact orphan (polymorphic FK)
**What goes wrong:** `artifact_target_id` points to a `proof_pack` row that is subsequently archived, leaving dangling artifact reference in DealRoom.
**Why it happens:** Polymorphic FKs cannot use DB-level ON DELETE CASCADE across multiple tables.
**How to avoid:** Carry P224 D-14 pattern: per-kind CHECK constraint. Application layer: when a ProofPack or DealBrief is archived, check if it appears in `deal_room_artifacts` and set artifact `status='hidden'` + operator task "DealRoom artifact retired — review and replace."
**Warning signs:** DealRoom renders with 404 artifact placeholders.

### Pitfall 7: Handoff acknowledge race condition
**What goes wrong:** Two ownership changes queued in rapid succession. Second handoff fires before first is acknowledged, creating two `handoff_records` with overlapping `from_role = to_role` transitions.
**Why it happens:** D-35 states "must acknowledge before next ownership change permitted" but the P222 ownership mutation hook may not check for open handoff records.
**How to avoid:** In `recordHandoff()`: assert no existing unacknowledged handoff_record for the same `opportunity_id`. Return 409 Conflict if one exists. Include open handoff check in the P222 lifecycle_transitions hook pre-condition.
**Warning signs:** Two handoff_records with `acknowledged_at IS NULL` for the same opportunity.

### Pitfall 8: deal_health_signals computation lag
**What goes wrong:** Operator dashboard shows health score from 6 hours ago. At-risk alert (score < 40) fires too late.
**Why it happens:** Health signals are computed hourly by cron. High-velocity deals may change state multiple times per hour.
**How to avoid:** Implement BOTH: (a) hourly cron for all active deals, (b) on-demand computation via `GET /v1/sales/deal-health/{opportunity_id}` which triggers immediate recompute if `computed_at < now() - 30min`. Cache result per opportunity in Edge Config with 30-min TTL.
**Warning signs:** Operator reports "health score didn't update after I logged a champion meeting."

### Pitfall 9: ProofPack freshness cascade
**What goes wrong:** ProofPack appears fresh but contains a claim with TTL expired in EvidenceMap. Render-time fail-closed (D-13) blocks ProofPack from rendering — confusing operator who sees no warning until render time.
**Why it happens:** `freshness_status` was last set at approval; EvidenceMap claim TTL expired after that.
**How to avoid:** Freshness audit cron (D-50) runs P209 EvidenceMap TTL check against `proof_packs.evidence_refs[]`. Any stale claim → immediate `freshness_status='stale_claims'` update + operator task "ProofPack [name] has stale claims — re-verify before use." Do NOT wait for render-time failure as the first notification.
**Warning signs:** Operator reports "ProofPack suddenly blocked at send time."

### Pitfall 10: Public share BotID outage fail-closed
**What goes wrong:** Vercel BotID service has a transient outage. All DealRoom share views fail with 503 even for legitimate stakeholders.
**Why it happens:** BotID verification is the first gate on `/share/dr/{token}`. If the BotID service is unavailable, the default is to block.
**How to avoid:** Carry P224 D-25 fail-closed pattern: BotID verification failure returns `{ ok: false, reason: 'network_error' }`. Log the outage. Apply degraded-mode rate-limit (tighter IP limit, e.g., 3/min) as fallback defense. Do NOT silently allow traffic during outage. Emit operator alert via cdp_events.
**Warning signs:** BotID `reason: 'network_error'` in rate-limit logs.

### Pitfall 11: Tombstone scrub preserving audit trail
**What goes wrong:** `winloss_records.champion_id` is scrubbed (set to NULL) on profile tombstone, but the audit trail that the WinLossRecord existed is also deleted, breaking P212 LearningCandidate references.
**Why it happens:** Aggressive ON DELETE CASCADE removes the WinLossRecord row entirely.
**How to avoid:** D-56 is explicit: tombstone = SCRUB PII COLUMNS ONLY. `champion_id` → NULL; `decision_maker_id` → NULL; `free_text_notes` → NULL (if contains PII). The `winloss_record` row MUST survive. `tombstoned=true` + `tombstoned_at` flags mark it as scrubbed. `record_id` + `outcome` + `primary_reason` + `attribution_touch_ids[]` are preserved for P212 learning. ON DELETE CASCADE must NOT be on winloss_records for the profile FK — use SET NULL.
**Warning signs:** P212 LearningCandidate references a non-existent record_id.

---

## Tests Implied — Per Slice

### 226-01: Schema foundation
- [ ] 15 tables created with expected columns + types
- [ ] RLS enforced: cross-tenant read returns 0 rows
- [ ] CHECK constraints enforced (status enums, freshness_status enums)
- [ ] share_link_token UNIQUE constraint blocks duplicate
- [ ] deal_room_views INSERT succeeds with hashed ip/ua; rejects raw PII
- [ ] quotes.pricing_recommendation_snapshot NOT NULL enforced
- [ ] handoff_records `from_role != to_role` CHECK enforced

### 226-02: Battlecard + ObjectionLibrary + ProofPack
- [ ] Battlecard freshness inheritance: EvidenceMap claim stale → battlecard.freshness_status='stale_claims'
- [ ] Operator `last_verified_at` set does NOT override stale claim freshness
- [ ] ProofPack snapshot frozen at first approval (snapshot_at set)
- [ ] ProofPack new approval = new `proof_pack_versions` row
- [ ] Render-time fail-closed: ProofPack freshness_status != 'fresh' → throws ProofPackStaleError
- [ ] ObjectionLibrary entry CRUD + category enum enforcement
- [ ] Stale battlecard blocks deal_room_artifact creation (D-20)
- [ ] Content classifier scan fires on battlecard approval (pricing variable check)

### 226-03: DealBrief auto-draft + handoff + deal_health
- [ ] lifecycle_transitions hook fires `generateDealBrief` on 'sql'/'opportunity' stage
- [ ] DealBrief generation creates AgentRun + sets `generated_by_run_id`
- [ ] DealBrief auto-created with status='draft'
- [ ] Operator cannot use DealBrief as customer-facing before approval
- [ ] Regeneration debounce: second trigger within 1h is suppressed
- [ ] deal_health_signals composite formula: 4 scores → weighted composite 0-100
- [ ] `deal_health_score < 40` → operator task created
- [ ] `competitive_threat_score > 2σ` → battlecard refresh task
- [ ] deal_health_signals emit cdp_events row with `source_event_ref`
- [ ] handoff_record created on P222 ownership tuple change
- [ ] DealBrief regenerated with `generation_kind='regenerated_on_handoff'`
- [ ] Handoff acknowledge SLA: 24h overdue → escalation task
- [ ] Handoff race condition: second handoff blocked if first unacknowledged (409)

### 226-04: Proposal + Quote
- [ ] Quote.status='draft' → 'sent' freezes `pricing_recommendation_snapshot`
- [ ] No modification to `pricing_recommendation_snapshot` allowed after status='sent'
- [ ] Pricing change after send → new Quote required; old Quote.status='superseded_by'
- [ ] `valid_until` expiry cron: status flips to 'expired'
- [ ] Customer signature evidence_ref → status flips to 'accepted'
- [ ] Content classifier scan fires on ProposalSupport before send
- [ ] Class-based approval: ProposalSupport send → approval_required; battlecard → auto-approve
- [ ] Re-engagement (new Quote after expiry) → always approval-required (D-28)
- [ ] ProposalSupport.pricing_context_id references P205 only; no price logic in P226

### 226-05: DealRoom + WinLossRecord
- [ ] HMAC share_link_token: verify succeeds with correct key; fails with tampered token
- [ ] BotID gate on public share: missing token → blocked
- [ ] Rate-limit on public share: >10 requests/IP/min → 429
- [ ] Honeypot field filled → 400 + honeypot flag logged
- [ ] ISR cacheTag updated on artifact add/remove/status change
- [ ] DealRoom expiry cron: share_link_expires_at passed → status='closed'; endpoint returns 410
- [ ] deal_room_views: ip_hash + user_agent_hash stored; raw IP not stored
- [ ] View spike alert: >2σ from 7-day baseline → operator task
- [ ] WinLossRecord required: stage transition to 'lost' blocked without WinLossRecord
- [ ] WinLossRecord: `primary_reason` + `outcome` required fields enforced
- [ ] WinLossRecord emit cdp_events with event_domain='sales'
- [ ] WinLossRecord emit LearningCandidate (D-41)
- [ ] attribution_touch_ids[] stored on WinLossRecord
- [ ] Tombstone propagation: profile tombstone → champion_id=NULL + tombstoned=true; record row preserved

### 226-06: API + MCP
- [ ] `GET /v1/sales/battlecards` returns only tenant's battlecards (RLS)
- [ ] `POST /v1/sales/battlecards/{id}/approve` enforces class-based approval
- [ ] `POST /v1/sales/deal-rooms/{id}/enable-share` requires approval (customer-facing)
- [ ] `GET /share/dr/{token}` unauth + BotID + rate-limit
- [ ] `GET /share/dr/{expired-token}` returns 410
- [ ] MCP `get_battlecard` returns freshness_status
- [ ] MCP `generate_quote` creates immutable snapshot
- [ ] MCP `record_winloss` requires structured fields
- [ ] OpenAPI parity: all `/v1/sales/*` routes reflected in contracts

### 226-07: UI + observability
- [ ] Playwright: BattlecardEditor → approve → freshness inspector shows claim status
- [ ] Playwright: DealRoom build → enable-share (approval required) → stakeholder view tracking
- [ ] Playwright: deal handoff → acknowledge within SLA
- [ ] Playwright: Quote send → pricing drift alert shown on next pricing change
- [ ] Playwright: WinLossRecord required gate on stage transition
- [ ] Chromatic: SalesEnablementWorkspace (empty + populated states)
- [ ] Chromatic: DealCockpit (healthy deal vs at-risk deal)
- [ ] Chromatic: WinLossAnalyzer (taxonomy bar chart)
- [ ] Chromatic: DealRoomViewer (view tracking dashboard)
- [ ] Freshness audit cron: stale battlecard → operator task created
- [ ] WinLoss coverage cron: closed opportunity without WinLossRecord → operator task
- [ ] Legacy regression: P100-P105 + P221-P225 tests pass

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.x + Playwright ^1.x + Chromatic (all inherited from P221 Wave 0) |
| Config file | `vitest.config.ts` (Wave 0 if absent) |
| Quick run command | `npm test -- test/sales/` (Node test runner) |
| Full suite command | `npm test && chromatic` (D-82: no playwright/coverage/vitest scripts in package.json) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEN-01 | Battlecard + ProofPack + ObjectionLibrary CRUD | unit | `node --test test/vitest/sales/battlecard.test.ts` | ❌ Wave 0 |
| SEN-02 | DealBrief inherits Customer360 + pricing context | unit | `node --test test/vitest/sales/deal-brief.test.ts` | ❌ Wave 0 |
| SEN-03 | Freshness-aware proof assembly; approval gate | unit | `node --test test/vitest/sales/proof-pack.test.ts` | ❌ Wave 0 |
| SEN-04 | WinLossRecord emits cdp_events + LearningCandidate | unit | `node --test test/vitest/sales/winloss.test.ts` | ❌ Wave 0 |
| SEN-05 | DealBrief auto-draft on lifecycle hook; approval flow | integration | `node --test test/vitest/sales/deal-brief-lifecycle.test.ts` | ❌ Wave 0 |
| EVD-02 | Stale ProofPack blocks customer-facing render | unit | `node --test test/vitest/sales/proof-pack-render.test.ts` | ❌ Wave 0 |
| EVD-06 | Quote immutability; pricing_recommendation_snapshot frozen | unit | `node --test test/vitest/sales/quote-immutability.test.ts` | ❌ Wave 0 |
| QA-01..15 | Full 15-gate quality baseline | all | Full suite command above | varies |

### Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (15 tables) | 100% — every table has cross-tenant isolation test | Security baseline |
| Battlecard freshness inheritance | 100% — EvidenceMap stale claim → battlecard stale | Core freshness doctrine |
| Quote immutability after 'sent' | 100% — no mutation path allowed | D-21 pricing safety |
| HMAC share_link_token sign/verify | 100% — tamper detection required | D-54 security |
| Class-based approval matrix | 100% — every artifact kind classified | D-25..D-28 |
| DealRoom BotID + rate-limit | 100% — public endpoint defense | D-29/D-33 |
| WinLossRecord tombstone scrub | 100% — row preserved, PII columns nulled | D-56 GDPR |

### Wave 0 Gaps

- [ ] `test/vitest/sales/` directory — create on 226-01
- [ ] `test/fixtures/sales/index.ts` — battlecard, proof_pack, deal_brief, deal_room, quote, winloss, handoff fixtures
- [ ] `test/fixtures/sales/tenants.ts` — extend P221 tenant fixtures with sales posture
- [ ] `test/vitest/sales/schema.test.ts` — 15 tables CRUD + RLS
- [ ] `test/vitest/sales/battlecard.test.ts` — freshness inheritance
- [ ] `test/vitest/sales/proof-pack.test.ts` — snapshot + version + render-time fail-closed
- [ ] `test/vitest/sales/deal-brief.test.ts` — auto-draft + LLM mock + claim audit + approval gate
- [ ] `test/vitest/sales/quote-immutability.test.ts` — immutability + supersedence
- [ ] `test/vitest/sales/deal-room.test.ts` — HMAC token + BotID mock + rate-limit
- [ ] `test/vitest/sales/winloss.test.ts` — taxonomy + cdp_events + tombstone
- [ ] `test/playwright/sales/battlecard-editor.spec.ts` — editor → approve → DealRoom use
- [ ] `test/playwright/sales/deal-room-share.spec.ts` — share → view tracking
- [ ] `test/playwright/sales/deal-handoff.spec.ts` — handoff → acknowledge

### Sampling Rate

- **Per task commit:** `node --test test/vitest/sales/ --reporter=dot`
- **Per wave merge:** `npm test` (D-82)
- **Phase gate:** Full suite green before `/gsd-verify-work`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (operator routes) | Supabase bearer; `requireHostedSupabaseAuth` |
| V3 Session Management | yes (operator shell) | P201 session management; inherited |
| V4 Access Control | yes — critical for public share | RLS on all 15 tables; HMAC token verification on public path; `deal_room_views` write-only policy |
| V5 Input Validation | yes | zod for DealBrief clause schema; WinLossRecord taxonomy enum; no raw user input in pricing (D-58) |
| V6 Cryptography | yes — share_link_token | HMAC-SHA256 via `node:crypto`; never hand-roll; constant-time compare |

### Known Threat Patterns for Sales Enablement Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| share_link_token enumeration | Information Disclosure | HMAC-SHA256 signing; rotate key per tenant; 410 Gone on expired |
| Pricing injection via Quote JSONB | Tampering | `pricing_recommendation_snapshot` written once at snapshot_at; DB-level immutability; no raw user input (D-58) |
| DealRoom view PII leak | Information Disclosure | ip_hash + user_agent_hash only; stakeholder_email stored only if explicitly provided by stakeholder (nullable) |
| Cross-tenant deal content read | Elevation of Privilege | RLS on all 15 tables; fail-closed on missing tenant context (P100 D-09) |
| BotID bypass on public share | Spoofing | BotID verification before any DB read; rate-limit fallback during outage |
| WinLossRecord tombstone audit bypass | Repudiation | tombstoned=true flag + tombstoned_at; record_id preserved; audit log entry on scrub |
| Stale proof claim in customer-facing material | Tampering | Render-time fail-closed (D-13); content classifier (D-27); claim audit in DealBrief gen (D-14) |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Deal notes and slide decks as ad-hoc sales materials | First-class SOR objects (Battlecard, ProofPack, DealBrief) with freshness gates | P226 introduces | Proof provenance enforced; stale materials blocked |
| Static Quote PDFs with hardcoded prices | Quote-as-Snapshot (immutable JSONB at send time) | P226 introduces | No pricing drift post-send; full audit trail |
| Ad-hoc handoff via CRM notes | DealBrief regeneration as canonical handoff object | P226 introduces | All roles work from same truth on handoff |
| Manual win/loss notes | Structured WinLossRecord with reason taxonomy | P226 introduces | P225 + P212 can consume structured learning |

**Deprecated / not used in P226:**
- Ad-hoc `copilot_summaries` as handoff vehicle — replaced by `handoff_records + DealBrief regen`
- Direct PricingRecommendation mutation in Quote — never allowed; P205 owns all price logic

---

## Runtime State Inventory

> P226 is a greenfield SOR layer, not a rename/refactor phase. No runtime state from prior phases is being renamed.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — all 15 tables are new SOR tables | Create via Wave 1 migrations |
| Live service config | None — no existing n8n workflows or external service configs reference P226 objects | None |
| OS-registered state | None | None |
| Secrets/env vars | HMAC signing key for share_link_token must be provisioned in Edge Config per tenant | Add `SALES_SHARE_LINK_SIGNING_KEY` to Edge Config; Wave 1 task |
| Build artifacts | None | None |

**Nothing found in existing categories** — all P226 objects are new additions.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | Testing | ✓ | ^2.x (P221 Wave 0) | — |
| Playwright | Browser testing | ✓ | ^1.x (P221 Wave 0) | — |
| Vercel AI Gateway | DealBrief LLM gen | ✓ | latest (P225) | Direct Anthropic API (degrade gracefully) |
| P225 narrative gen module | DealBrief clause-fill | [A22] | unknown — verify in 226-01 | Stub: template-only without LLM fill |
| P205 PricingRecommendation | Quote-as-Snapshot | [A13] | unknown — verify in 226-01 | Quote stub ships with placeholder pricing_recommendation_id |
| P222 lifecycle_transitions | DealBrief auto-draft hook | [A4] | unknown — verify in 226-01 | Manual-only trigger via API |
| P209 EvidenceMap | ProofPack + Battlecard freshness | [A21] | unknown — verify in 226-01 | Freshness check stubs to "warning + audit" |
| P221 cdp_events | deal_health_signals emit | [A3] | unknown — verify in 226-01 | Log to markos_audit_log as fallback |
| Edge Config | HMAC signing key + rate-limit config | ✓ | Vercel-provided | Redis fallback (P201 pattern) |
| BotID (Vercel) | Public share defense | ✓ | P201 + P224 verified | Degraded rate-limit mode (3/min) |

**Missing dependencies with no fallback:** None confirmed. All above have fallback strategies.

**Missing dependencies with fallback:** P225 narrative gen, P205 PricingRecommendation, P222 lifecycle_transitions, P209 EvidenceMap — verify at 226-01 Wave 0; stubs are viable for Wave 1.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P225 stopped at F-162 | F-ID allocation | F-ID collision with P225 contracts; must verify 225-07-PLAN.md |
| A2 | P225 stopped at migration 145 | Migration allocation | Migration number collision; must verify 225-07-PLAN.md |
| A3 | P221 cdp_events table is live when P226 executes | Environment Availability | deal_health_signals emit fails; fallback to audit_log |
| A4 | P222 customer_360 + buying_committees + lifecycle_transitions hook exists when P226 executes | Environment Availability | DealBrief auto-draft cannot fire; manual-only trigger |
| A5 | P207 markos_agent_runs table exists (bridge stub acceptable) | Architecture | AgentRun wrapping of DealBrief gen fails; use synchronous gen without run envelope |
| A8 | Vitest + Playwright are wired from P221 Wave 0 | Validation Architecture | Wave 0 must install test infra before any 226 tests |
| A13 | P205 Pricing Engine PricingRecommendation SOR is live | Environment Availability | Quote-as-Snapshot ships with placeholder pricing_recommendation_id; no price context in quotes |
| A14 | BotID per P201 is active in tenant environment | Security | DealRoom public share falls back to rate-limit-only defense |
| A15 | Edge Config (or Redis) available for rate-limit windows | Architecture | Rate-limit degrades to in-memory (not distributed); acceptable for single-instance CI |
| A16 | Next.js cacheTag/updateTag available per Vercel knowledge update | Architecture Patterns | ISR invalidation degrades to full page revalidation |
| A21 | P209 EvidenceMap is live for ProofPack + Battlecard claim audit | Environment Availability | Freshness check stubs to "warning + audit" per P225 A21 carry-forward |
| A22 | P225 narrative gen module is live for DealBrief LLM clause-fill | Environment Availability | Template-only DealBrief (no LLM fill) ships as fallback |
| A23 | P225 attribution_touches FK target exists for WinLossRecord attribution_touch_ids[] | Schema | Array stored as UUID[]; FK constraint added as post-P225 migration check in 226-01 |
| A24 | HMAC signing key per tenant available in deal_room_share_signing_keys (D-86) | Security | NO UUID-only fallback (D-87/D-86). When no active key exists, system fails-closed with SHARE_KEY_UNAVAILABLE and route-back. |

---

## Open Questions (RESOLVED)

1. **P225 narrative gen module path**
   - What we know: P225 ships narrative generation under `lib/markos/analytics/narrative/` (planned but not yet in codebase from glob result)
   - What's unclear: Whether the module exists at 226-01 Wave 0 or must be stubbed
   - RESOLVED: 226-01 Wave 0 checks for module presence; if absent, stub `generateDealBriefClauses(context)` that returns template-only content (A22 fallback). Plan 01 Task 0.5 preflight gate (D-87) hard-fails if P225 module roots absent.

2. **P205 PricingRecommendation table availability**
   - What we know: P205 is planned but its execution order relative to P226 in the full roadmap is: 204 → 205 → ... → 221 → 226
   - What's unclear: Whether P205 will be complete when P226 executes in actual sprint order
   - RESOLVED: Quote ships with `pricing_recommendation_id = null` and `pricing_recommendation_snapshot = '{"pending":"{{MARKOS_PRICING_ENGINE_PENDING}}"}'` as valid placeholder state per D-83 immutability + Pricing Engine Canon; no blocking dependency. A13 fallback in lib/markos/sales/pricing-recommendation-adapter.ts emits placeholder snapshot + warning audit. Plan 01 Task 0.5 preflight gate ensures P205 has landed before Wave 3.

3. **Edge Config HMAC key rotation strategy**
   - What we know: Edge Config is available; D-54 requires per-tenant signing key
   - What's unclear: Whether Edge Config supports per-tenant key namespacing at volume
   - RESOLVED: Per D-86, key rotation lives in DB (deal_room_share_signing_keys table; migration 159) with 90-day cadence + 24h grace. Token format: `dr_v{key_version}_{base64url(deal_room_id)}_{base64url(hmac_sha256(deal_room_id, signing_key_v{key_version}))}`. Edge Config used for runtime read-through cache only; DB is canonical. NO UUID-only fallback (D-87/D-86). When no active key exists, system fails-closed with SHARE_KEY_UNAVAILABLE.

4. **DealRoom ISR cache TTL per artifact_kind**
   - What we know: D-31 specifies cacheTag per tenant+deal_room; D-C discretion for TTL per artifact_kind
   - RESOLVED: proof_pack=1h, deal_brief=30min, battlecard=1h, quote=15min, proposal_support=30min, custom=5min. Higher-volatility objects (quote, deal_brief) get shorter TTL. Implemented in lib/markos/sales/deal-rooms/isr-cache.ts ISR_TTL_PER_ARTIFACT_KIND constant.

---

## Scope Guardrails

The following items are explicitly OUT OF SCOPE for P226 and must be deferred:

| Deferred Item | Defer To |
|---------------|----------|
| Visual deal room builder (drag-and-drop) | v2 |
| AI-generated objection handlers (live coaching) | defer |
| Customer-facing chat in DealRoom | defer |
| PDF proposal document generation | v2 |
| Multi-language sales materials | v2 |
| Deal forecast probability ML model | P225 owns |
| Quote discount engine / pricing logic | P205 owns |
| Sales call recording (Gong/Chorus) | defer |
| Predictive deal-loss ML model | P225 + ML |
| ProofPack A/B testing | defer |
| Public DealRoom pricing display with competitor comparison | defer |
| Ecosystem co-sell partner workflows | P227 |
| Salesforce / HubSpot CRM sync | P228 |
| Battlecard/ProofPack template marketplace | defer |

---

## Sources

### Primary (HIGH confidence)
- `226-CONTEXT.md` — 60 locked decisions D-01..D-60; all schema shapes, approval classes, freshness rules
- `225-RESEARCH.md` F-ID chain table (F-147..F-162) + migration chain (134..145) — baseline for P226 allocation
- `225-07-PLAN.md` files_modified — confirms migration 144 + migration 145 as final P225 migrations
- `lib/markos/auth/botid.ts` + `lib/markos/auth/rate-limit.ts` — BotID + rate-limit patterns verified in codebase
- `lib/markos/crm/playbooks.ts` — SAFE_PLAYBOOK_ACTIONS + replay-safe pattern verified
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` — Vitest + Playwright + Chromatic mandate confirmed
- `REQUIREMENTS.md` — SEN-01..05 + CRM/PRC/EVD/QA requirement IDs confirmed

### Secondary (MEDIUM confidence)
- `222-CONTEXT.md` — lifecycle_transitions hook shape + buying_committee_members FK targets
- `223-CONTEXT.md` — content_classifier location (`lib/markos/channels/templates/content-classifier.ts`)
- `224-CONTEXT.md` — BotID + rate-limit + honeypot pattern for public share; polymorphic FK + per-kind CHECK
- `225-CONTEXT.md` — attribution_touches FK target; narrative gen scaffold pattern
- `obsidian/reference/Contracts Registry.md` — F-ID registry structure + naming conventions
- `obsidian/brain/Pricing Engine Canon.md` — Quote-as-Snapshot doctrine; `{{MARKOS_PRICING_ENGINE_PENDING}}`

### Tertiary (ASSUMED — flag for validation)
- P225 narrative gen module path at execution time — module planned but not yet in codebase
- P205 PricingRecommendation table availability at P226 execution time — depends on sprint order
- HMAC signing key provisioning in Edge Config per tenant — pattern assumed from P201/P224

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Schema: HIGH — DDL derived directly from 60 locked decisions in CONTEXT.md
- Architecture patterns: HIGH — all patterns carry proven prior-phase implementations
- Pitfalls: HIGH — derived from locked decisions + prior phase pitfall patterns
- F-ID / migration allocation: HIGH — verified against 225-07-PLAN.md

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30-day window; fast-moving — re-verify P225 module availability before Wave 2)

---

## RESEARCH COMPLETE

Phase 226 Sales Enablement and Deal Execution research is complete.

**Key findings:**

1. **F-163..F-180** (18 contracts) and **migrations 146..158** (13 migrations) are the correct allocations, continuing directly from P225's F-162 / migration 145 as confirmed by 225-07-PLAN.md.

2. **All 15 schema tables** have concrete DDL sketches with RLS, CHECK constraints, hot-path indexes, and FK alignment to P205/P209/P221/P222/P225 upstream tables. The Quote-as-Snapshot pattern (immutable JSONB + self-FK supersedence) and HMAC share_link_token security model are fully specified.

3. **7 slices across 5 waves** are recommended. The parallel Wave 2 pair (Battlecard/ProofPack alongside DealBrief/health-signals) and Wave 3 pair (Proposal/Quote alongside DealRoom/WinLoss) compress the critical path. Wave 1 starts with pure schema + test fixtures.

4. **Zero new npm dependencies required.** Every hard problem (LLM gen, claim audit, BotID, rate-limit, approval routing, cdp_events emit, tombstone scrub, audit trail) reuses proven upstream modules from P201/P205/P207/P208/P209/P221-P225.

5. **Class-based approval** (D-25..D-28) is the one genuinely new pattern in P226. Internal materials auto-approve; customer-facing materials (ProposalSupport, ProofPack, DealRoom share, Quote, customer DealBrief) always require P208 Approval Inbox entry. The `gateApproval(artifactKind)` helper must be the single entry point for all P226 write mutations.
