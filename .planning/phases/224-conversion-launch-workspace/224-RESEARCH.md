# Phase 224: Conversion and Launch Workspace — Research

**Researched:** 2026-04-24 (refresh — augments 2026-04-23 seed)
**Domain:** Conversion Engine (block-based ConversionPage + dynamic ConversionForm + CTA + ConversionEvent + native ExperimentSet) AND Launch Engine (LaunchBrief + LaunchSurface + LaunchGate + LaunchRunbook + LaunchOutcome). Public surfaces with BotID + rate-limit + honeypot + ConsentState double-gate. Next.js 16 ISR. Read-write `/v1/conversion/*` + `/v1/launches/*` API + 6 MCP tools.
**Confidence:** HIGH (all architectural claims verified against: codebase reads, P221/P222/P223 CONTEXT.md, REQUIREMENTS.md, 224-CONTEXT.md 56 locked decisions, Contracts Registry, Database Schema, Testing Environment Plan)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Page composition runtime
- D-01: Block-based ConversionPage SOR with page_type ∈ {landing, signup, demo, pricing, launch, webinar, offer, thank_you, content_download, upgrade}, slug unique per tenant, status ∈ {draft, pending_approval, published, archived}, content_blocks ordered JSONB, seo_meta JSONB, audience_id, experiment_set_id, pricing_context_id, evidence_pack_id, locale, parent_page_id, version, approved_by, approved_at, published_at, archived_at. RLS on tenant_id.
- D-02: 15 typed block types: hero, form, cta, testimonial, pricing, faq, footer, content, image, video, comparison, signup_widget, social_proof, evidence_block, custom_html (admin-approved only). Block schema in lib/markos/conversion/blocks/schema.ts with per-block validators.
- D-03: Renderer in lib/markos/conversion/render/page-renderer.ts composes blocks at SSR time; output is React tree consumed by Next.js dynamic catch-all route app/(public)/[...slug]/page.tsx. Pricing/evidence runtime checks enforced at render time (D-19). Existing marketing routes stay as legacy.
- D-04: No drag-and-drop visual page builder in v1. JSON-mode TemplateEditor (mirrors P223 D-25 pattern).

#### Form engine
- D-05: Generic ConversionForm SOR with objective ∈ {contact_capture, demo_request, trial_signup, content_download, waitlist, webinar_registration, purchase, upgrade}, fields ordered JSONB, variables_schema JSONB, evidence_bindings, pricing_bindings, submit_action, identity_stitch_enabled, consent_capture_block_id FK, thank_you_page_id FK.
- D-06: Field types: email, text, phone, number, select, multi_select, checkbox, textarea, country, jurisdiction, custom_typed. Honeypot field (D-27) auto-injected, not in fields[].
- D-07: FormRenderer (lib/markos/conversion/forms/form-renderer.tsx) dynamic. SSR-safe. Evidence/pricing bindings resolved at render time per D-19.
- D-08: Identity stitch on submit: calls api/tracking/identify.js first to bind anonymous_identity_id → known CRM record (P101 D-04 confidence-aware stitching). ConsentState write per consent_capture_block result.

#### ConversionEvent
- D-09: Separate conversion_events table joined to cdp_events via shared source_event_ref. Columns: event_id, tenant_id, surface_id, surface_kind ∈ {page, form, cta}, form_id FK nullable, experiment_variant_id FK nullable, objective, identity_ref, pricing_context_id FK nullable, evidence_pack_id FK nullable, launch_id FK nullable, occurred_at, source_event_ref UUID.
- D-10: Every ConversionEvent emits TWO rows in transaction: conversion_events row + cdp_events envelope (shared source_event_ref) + crm_activity row (commercial_signal mapped from objective).
- D-11: api/tracking/ingest.js retrofitted to emit ConversionEvent + cdp_events. Existing event_family taxonomy preserved via alias mapping. Public contract unchanged.

#### Launch object model
- D-12: Five tables: launch_briefs, launch_surfaces, launch_gates, launch_runbooks, launch_outcomes.
- D-13: launch_readiness_checks table (check_kind ∈ {legal_approved, support_ready, sales_trained, docs_published, partner_briefed, custom}).
- D-14: LaunchSurface polymorphic ref via surface_target_kind + surface_target_id UUID. Per-kind FK enforced via CHECK constraint + repository read-after-write.
- D-15: LaunchSurface.status state machine: draft → blocked ↔ approved → published → archived.

#### LaunchGate evaluator
- D-16: Gate kinds + evaluators in lib/markos/launches/gates/: pricing, evidence, readiness, approval, custom (reserved for v2).
- D-17: Gate evaluation triggered by status transition request, operator-invoked /v1/launches/{id}/gates/evaluate, cron poll every 15 min for in-flight launches.
- D-18: Waiver: tenant admin only; waiver_reason required; adds markos_audit_log row.

#### Pricing safety + evidence
- D-19: Belt-and-suspenders: (1) pre-publish LaunchGate(pricing+evidence) must pass before published; (2) runtime renderer scans content_blocks for {{pricing.*}} and {{evidence.*}} — unresolved → 503 + audit row; (3) static-text content classifier scans block bodies for currency patterns + claim-shaped text.
- D-20: Approval-aware mutations: page publish, form publish, launch start, runbook execute, runbook rollback, gate waiver → P208 Approval Inbox via P105 approval-package pattern.

#### Experimentation
- D-21: ConversionExperiment SOR with target_surface_id FK, audience_id, status ∈ {draft, active, paused, completed}, traffic_split JSONB, started_at, ended_at, planned_duration_days, decision_rule null in v1.
- D-22: ExperimentVariant with content_overrides JSONB (per-block patches), traffic_weight (sum=100), is_control bool.
- D-23: experiment_assignments table; sticky assignment per identity via deterministic hash; ConversionEvent.experiment_variant_id captures bucket.
- D-24: Decision rules + winner detection + ICE scoring ALL deferred to P225.

#### Bot + abuse posture
- D-25: Vercel BotID gate before form render (P201 signup pattern). 403 + audit row on fail.
- D-26: Tenant-configurable rate limit: defaults 10 submits/IP/60s + 3 submits/email/60s. 429 + audit row on fail.
- D-27: Invisible honeypot field auto-injected by FormRenderer. Silent reject + audit row.
- D-28: ConsentState double-gate at submit (P221 D-18 carry): ConsentState write before ConversionEvent. Mismatch → fail-closed.

#### Public surface delivery
- D-29: Next.js 16 dynamic catch-all route app/(public)/[...slug]/page.tsx reads ConversionPage by slug.
- D-30: ISR + cacheTag(${tenant_id}:${page_id}). Publish/rollback calls updateTag(${tenant_id}:${page_id}). Default TTL: 5 min high-traffic, 1 min low-traffic.
- D-31: SEO from ConversionPage.seo_meta + Open Graph. Sitemap.xml regenerated on publish.
- D-32: Render budget: < 100ms p95 server-side. Static blocks ship as RSC; interactive blocks (form, cta-with-state) hydrated client-side.

#### Conversion event fan-out
- D-33: Single fan-out emit() in lib/markos/conversion/events/emit.ts: (1) conversion_events row; (2) cdp_events envelope; (3) crm_activity row; (4) identity stitch if form; (5) ConsentState write if consent_capture_block present; (6) Customer360 update; (7) NBA recompute trigger.
- D-34: Fail-closed transaction: partial write → full rollback.

#### LaunchRunbook execution + rollback
- D-35: Steps[] ordered list with step objects: step_id, name, kind ∈ {publish_surface, dispatch_email_campaign, send_messaging, post_social, notify_team, custom}, target_ref, depends_on, idempotency_key, expected_duration_seconds.
- D-36: rollback_steps[] reverse-order with reverse semantics. Non-reversible steps flagged with reversible: false → emit operator task instead.
- D-37: Runbook execution wrapped in AgentRun (P207): markos_agent_runs row + run_type='launch_execution'. Bridge stub if P207 absent.
- D-38: Rollback path: sets state='rolling_back' → executes rollback_steps → state='rolled_back'. Every step writes audit row.

#### LaunchOutcome capture
- D-39: Outcome computed at T+7/T+14/T+30 post-launch.live transition.
- D-40: v1 metrics: reach (unique surface_views), signups, pipeline_created, influenced_revenue (first-touch v1; P225 refines), activation_lift (null v1).
- D-41: narrative_summary auto-generated via P209 EvidenceMap; operator can override + approve. Full narrative to P225.

#### API + MCP surface
- D-42: Read-write /v1/conversion/* + /v1/launches/* with public form submit endpoint (rate-limited + BotID-gated).
- D-43: 6 MCP tools: publish_page, submit_form, evaluate_launch_gates, execute_runbook, rollback_launch, get_launch_outcome.
- D-44: All write APIs honor approval-package pattern. High-risk: page publish + launch arm + launch execute + rollback + gate waiver.

#### Operator UI surface
- D-45: ConversionWorkspace (app/(markos)/conversion/page.tsx) + LaunchCockpit (app/(markos)/launches/page.tsx) + LaunchReadinessBoard + PageEditor + FormEditor + RunbookEditor. Single-shell rule (P208).
- D-46: Approval Inbox gains: page_publish, form_publish, launch_arm, launch_execute, gate_waiver, rollback entry types.
- D-47: Morning Brief surfaces: top-3 in-flight launches + readiness countdown + blocking gates + recent ConversionEvent volume.

#### Observability
- D-48: Surface health audit cron: stale pricing_context_id + stale evidence_pack_id → operator task.
- D-49: Launch audit log: every status transition + gate evaluation + runbook step + rollback → markos_audit_log.
- D-50: Bounce/spike alerts: conversion rate drop >2σ from 7-day baseline → operator task. BotID abuse spike >10× baseline → tenant-admin alert.

#### Security + tenancy
- D-51: RLS on all 13 new tables.
- D-52: Public form submit endpoint ONLY unauthenticated POST route; rate-limited + BotID + honeypot + tenant resolution via Host header (P201 BYOD pattern).
- D-53: Audit trail mandatory on all approvals + publish + launch transitions + gate waivers + runbook execution + rollback + emit failures.
- D-54: No raw user input in pricing/evidence binding values — variables_schema enforces type + format.

#### Contracts + migrations
- D-55: 12-15 new F-IDs continuing after F-131.
- D-56: 10-13 new migrations continuing after migration 120.

### Claude's Discretion
- Module boundary under lib/markos/conversion/* and lib/markos/launches/* (separated engines that coordinate).
- Block schema versioning strategy (forward-compat block_type renames, deprecation warnings).
- Experiment hash function for variant assignment (recommend xxhash3; fallback SHA-256 truncated).
- Cron schedule for surface health audit, gate evaluation poll, outcome computation cadence.
- ContentClassifier extension to handle pricing patterns in ConversionPage block bodies.
- ISR cache TTL tuning per page_type.
- Visual page builder — completely deferred; v1 ships JSON editing.

### Deferred Ideas (OUT OF SCOPE)
- Sales enablement battlecards/proof-packs/proposals — P226.
- Ecosystem/partner/affiliate/community/developer-growth content — P227.
- Semantic attribution/journey/narrative/anomaly intelligence — P225.
- Statistical experiment winner detection + ICE backlog + decision rules — P225.
- Owned-channel dispatch (email_campaign, messaging_thread send paths) — P223.
- CDP identity/consent/audience SOR — P221.
- CRM360 timeline/NBA — P222.
- Pricing Engine PriceTest approval — P205.
- Page builder visual UI (drag-and-drop) — defer; v1 ships JSON editing.
- Visual drag-and-drop page builder — P226 v2 or later.
- A/B/n multivariate beyond traffic_split — P225.
- ML-driven personalization — P225 + AgentRun.
- Server-side personalization at edge (geographic IP routing) — defer.
- Webhook-based form integrations — defer to plugin marketplace.
- Multi-step / progressive profiling form chains — v2.
- Native chatbot / live chat conversion surface — P226.
- Rich media interactive block types (carousel, accordion, tabs) — v2.
- Cross-tenant launch templates — P218/P227.
- Launch retrospective AI + post-launch narrative auto-generation — P225.
- Multi-region launch coordination — P228.
- Partner-coordinated launches — P227.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CNV-01 | Native conversion surfaces: pages, forms, CTAs, experiments, offer-routing | D-01..D-07, D-21..D-24; block schema + FormRenderer + experiment assignment |
| CNV-02 | Every conversion event writes identity, consent, CRM, task, evidence, attribution records | D-08..D-11, D-33..D-34; single fan-out emit() with fail-closed transaction |
| CNV-03 | Public conversion copy, offers, pricing consume Pricing Engine or placeholder | D-19..D-20; pre-publish LaunchGate(pricing) + runtime renderer enforcement |
| CNV-04 | Conversion surfaces approval-aware, accessible, testable, observable, contract-backed | D-20, D-44, D-51..D-54; API contracts F-132..F-146 + RLS + audit |
| CNV-05 | Conversion surfaces support embedded experimentation + launch coordination without parallel SOR | D-21..D-24 ExperimentSet native; D-12..D-15 LaunchSurface polymorphic ref |
| LCH-01 | Launches are governed multi-channel programs with readiness criteria, owners, calendars, dependencies, approval gates, rollback | D-12..D-18, D-35..D-38; launch_briefs + gates + runbooks + readiness_checks |
| LCH-02 | Launch orchestration coordinates content, conversion, email, messaging, partner, social from one program object model | D-14 polymorphic LaunchSurface; surface_target_kind enum maps to all channel engines |
| LCH-03 | Launch plans store audience, assets, proof requirements, pricing posture, channel mix, contingencies, success metrics | D-12 launch_briefs shape; D-39..D-41 LaunchOutcome |
| LCH-04 | Launch performance, incidents, postmortems feed analytics, learning, future planning | D-39..D-41 T+7/T+14/T+30 outcomes; D-49 audit log |
| LCH-05 | No external launch mutation without evidence, approval, audit | D-16..D-18 gates; D-20 approval-package; D-49 audit |
| PRC-01..09 | Carry-forward read-side via P205 Pricing Engine (no new schema) | Satisfied via P205 adapter + LaunchGate(kind='pricing') enforces compliance |
| CDP-01..05 | Carry-forward read-side via P221 adapter | Satisfied via P221 `lib/markos/cdp/adapters/crm-projection.ts`; ConsentState double-gate D-28; AudienceSnapshot reused |
| CRM-01..05 | Carry-forward read-side via P222 Customer360 | Satisfied via P222 `lib/markos/crm360/*`; Customer360 lifecycle progression D-33 |
| EML-01..05 | Carry-forward read-side via P223 LaunchSurface | Satisfied via P223 `lib/markos/channels/*`; LaunchSurface(surface_target_kind='email_campaign') D-14 |
| MSG-01..05 | Carry-forward read-side via P223 LaunchSurface | Satisfied via P223 messaging_threads + lifecycle_journeys; LaunchSurface(surface_target_kind='messaging_thread' or 'messaging_flow') D-14 |
| QA-01 | Contracts current | 15 new F-IDs F-132..F-146; flow-registry.json updated |
| QA-02 | Tenancy, RLS, auth, audit production-safe | RLS on 13 new tables D-51; audit_log D-49/D-53; public endpoint isolation D-52 |
| QA-03..15 | Quality baseline gates | Vitest (all business rules 100% decision branches) + Playwright (operator journeys) + Chromatic (workspace states) |
</phase_requirements>

---

## Summary

Phase 224 ships two coordinated engines: the Conversion Engine (block-based ConversionPage, dynamic ConversionForm, CTA, ConversionEvent stream, native ExperimentSet) and the Launch Engine (LaunchBrief, LaunchSurface, LaunchGate, LaunchRunbook, LaunchOutcome). The phase is additive — existing marketing routes (`/signup`, `/integrations/claude`, `/docs`) continue unchanged; the `api/tracking/ingest.js` receives a backward-compatible retrofit to emit ConversionEvent alongside today's CRM activity rows.

All architectural decisions were locked in the 56-decision CONTEXT.md. This research does not reopen them. Instead it provides: verified F-ID and migration allocation (continuing F-131 / migration 120 from P223), concrete DDL schema sketches per table, recommended 7-slice plan structure across 5 waves, integration contracts with P221/P222/P223 adapters, public surface delivery details (Next.js 16 ISR + cacheTag), phase-specific pitfalls, per-slice test inventory, full Validation Architecture (Nyquist Dimension 8), and requirement mapping.

**Primary recommendation:** Start with Wave 1 (schema foundation + base contracts + module stubs + ingest retrofit + renderer skeleton) before any behavioral implementation. The single fan-out emit() is the highest-risk primitive — it must be the first behavioral unit tested. Gate evaluators and runbook executor come next; UI workspace last.

---

## F-ID and Migration Allocation

### Baseline Confirmed

P223 allocated F-122..F-131 (10 contracts) and migrations 113..120 (8 migrations). [VERIFIED: 223-RESEARCH.md §F-ID + Migration Allocation section; VERIFIED: 223-RESEARCH.md Sources section "F-121 is the last allocated F-ID; F-122 is correct starting point for P223"]

**P224 baseline:** F-131 (last P223 contract) + migration 120 (last P223 migration). [VERIFIED: 223-RESEARCH.md]

### P224 F-ID Allocation: F-132..F-146 (15 contracts)

| F-ID | Name | Flow Type | Purpose | Slice |
|------|------|-----------|---------|-------|
| F-132 | conversion-page-v1 | page-config | ConversionPage CRUD + status lifecycle (draft/pending_approval/published/archived) + publish gate | 224-01 |
| F-133 | conversion-form-v1 | form-config | ConversionForm CRUD + field/variable schema + identity_stitch_enabled + consent_capture_block | 224-01 |
| F-134 | conversion-cta-v1 | cta-config | ConversionCTA CRUD + type + target_url + audience/pricing bindings | 224-01 |
| F-135 | conversion-event-v1 | event-read | conversion_events read surface: per-surface, per-launch, per-objective queries | 224-01 |
| F-136 | conversion-experiment-v1 | experiment-config | ConversionExperiment CRUD + ExperimentVariant + assignment + traffic_split | 224-01 |
| F-137 | public-form-submit | public-write | Public unauthenticated POST /v1/conversion/forms/{id}/submit — BotID-gated, rate-limited, honeypot | 224-02 |
| F-138 | conversion-fan-out-emit | internal-event | Internal fan-out emit() contract: 7-sink transactional write + fail-closed semantics | 224-02 |
| F-139 | launch-brief-v1 | launch-config | LaunchBrief CRUD + status (planning/pending_approval/ready/live/completed/rolled_back) + readiness_checks | 224-04 |
| F-140 | launch-surface-v1 | surface-config | LaunchSurface CRUD + polymorphic surface_target_kind/id + status state machine | 224-04 |
| F-141 | launch-gate-v1 | gate-config | LaunchGate CRUD + evaluate + waive + per-kind status + blocking_reasons | 224-04 |
| F-142 | launch-runbook-v1 | runbook-config | LaunchRunbook CRUD + arm/execute/rollback + AgentRun linkage + step/rollback_step shapes | 224-06 |
| F-143 | launch-outcome-v1 | outcome-read | LaunchOutcome read + compute trigger (T+7/T+14/T+30) + per-period metrics | 224-04 |
| F-144 | launch-readiness-check-v1 | readiness-config | LaunchReadinessCheck CRUD + status transitions + evidence_ref | 224-04 |
| F-145 | launch-evaluate-gates | mcp-write | MCP evaluate_launch_gates tool contract — triggers all gate evaluators for a launch | 224-06 |
| F-146 | launch-execute-runbook | mcp-write | MCP execute_runbook + rollback_launch tool contracts — triggers AgentRun-wrapped runbook execution | 224-06 |

### P224 Migration Allocation: 121..133 (13 migrations)

| Migration # | Name | Content | Slice |
|-------------|------|---------|-------|
| 121 | `121_conversion_pages.sql` | conversion_pages table + RLS + indexes (slug, tenant_id, status, audience_id) | 224-01 |
| 122 | `122_conversion_forms.sql` | conversion_forms + conversion_ctas tables + RLS + indexes | 224-01 |
| 123 | `123_conversion_events.sql` | conversion_events table + RLS + indexes (surface_id, launch_id, occurred_at, source_event_ref) | 224-01 |
| 124 | `124_conversion_experiments.sql` | conversion_experiments + experiment_variants + experiment_assignments tables + RLS + indexes | 224-01 |
| 125 | `125_launch_briefs.sql` | launch_briefs + launch_readiness_checks tables + RLS + indexes (launch_type, status, owner_user_id) | 224-01 |
| 126 | `126_launch_surfaces.sql` | launch_surfaces table + polymorphic CHECK constraint + RLS + indexes | 224-01 |
| 127 | `127_launch_gates.sql` | launch_gates table + RLS + indexes (launch_id, gate_kind, status) | 224-04 |
| 128 | `128_launch_runbooks.sql` | launch_runbooks table + RLS + indexes (launch_id, state, agentrun_id) | 224-06 |
| 129 | `129_launch_outcomes.sql` | launch_outcomes table (composite PK launch_id + period_days) + RLS + indexes | 224-04 |
| 130 | `130_ingest_retrofit_indexes.sql` | Additive indexes on cdp_events + crm_activity for conversion surface_id lookups; audit_log event-type registrations for all 13 new tables | 224-02 |
| 131 | `131_experiment_hash_indexes.sql` | Composite index on experiment_assignments(experiment_id, identity_ref) for deterministic lookup; partial index on conversion_experiments WHERE status='active' | 224-05 |
| 132 | `132_launch_cron_state.sql` | Cron state table for surface_health_audit + gate_evaluation_poll + outcome_computation (or Vercel Cron config annotation); bounce_alert_baselines table | 224-06 |
| 133 | `133_conversion_rls_hardening.sql` | Cross-table FK indexes; RLS policy review for all 13 tables; audit_log hash-chain event-type registration for 13 new write paths; public form submit ACL | 224-07 |

**Note:** Migration numbering continues from P223's migration 120. Planner must verify at Wave 0 that no migrations have been added between P223's last and this phase's first. [ASSUMED: no migrations between P223 and P224 execution]

---

## Schema Sketches

### `conversion_pages`

```sql
CREATE TABLE conversion_pages (
  page_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES markos_tenants(id),
  page_type       TEXT NOT NULL CHECK (page_type IN (
    'landing','signup','demo','pricing','launch','webinar',
    'offer','thank_you','content_download','upgrade'
  )),
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','pending_approval','published','archived'
  )),
  objective       TEXT NOT NULL,
  content_blocks  JSONB NOT NULL DEFAULT '[]',
  seo_meta        JSONB NOT NULL DEFAULT '{}',
  locale          TEXT NOT NULL DEFAULT 'en',
  parent_page_id  UUID REFERENCES conversion_pages(page_id),
  audience_id     UUID,  -- FK → cdp_audience_definitions (P221)
  experiment_set_id UUID, -- FK → conversion_experiments
  pricing_context_id UUID, -- FK → Pricing Engine (P205)
  evidence_pack_id   UUID, -- FK → governance_evidence_packs (P209)
  version         INTEGER NOT NULL DEFAULT 1,
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversion_pages_slug_tenant_unique UNIQUE (tenant_id, slug)
);
ALTER TABLE conversion_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversion_pages
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON conversion_pages (tenant_id, status);
CREATE INDEX ON conversion_pages (tenant_id, slug);
CREATE INDEX ON conversion_pages (audience_id) WHERE audience_id IS NOT NULL;
```

### `conversion_forms`

```sql
CREATE TABLE conversion_forms (
  form_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES markos_tenants(id),
  name             TEXT NOT NULL,
  objective        TEXT NOT NULL CHECK (objective IN (
    'contact_capture','demo_request','trial_signup','content_download',
    'waitlist','webinar_registration','purchase','upgrade'
  )),
  fields           JSONB NOT NULL DEFAULT '[]',
  variables_schema JSONB NOT NULL DEFAULT '{}',
  evidence_bindings  JSONB NOT NULL DEFAULT '[]',
  pricing_bindings   JSONB NOT NULL DEFAULT '[]',
  submit_action      TEXT NOT NULL CHECK (submit_action IN (
    'create_lead','create_signup','create_demo','custom_callback'
  )),
  identity_stitch_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  consent_capture_block_id UUID,
  thank_you_page_id UUID REFERENCES conversion_pages(page_id),
  version         INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','pending_approval','published','archived'
  )),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE conversion_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversion_forms
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### `conversion_ctas`

```sql
CREATE TABLE conversion_ctas (
  cta_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES markos_tenants(id),
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN (
    'button','banner','sticky_bar','exit_intent','inline','modal'
  )),
  target_url       TEXT,
  target_form_id   UUID REFERENCES conversion_forms(form_id),
  audience_id      UUID,
  pricing_context_id UUID,
  status           TEXT NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE conversion_ctas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversion_ctas
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### `conversion_events`

```sql
CREATE TABLE conversion_events (
  event_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  surface_id           UUID NOT NULL,
  surface_kind         TEXT NOT NULL CHECK (surface_kind IN ('page','form','cta')),
  form_id              UUID REFERENCES conversion_forms(form_id),
  experiment_variant_id UUID REFERENCES experiment_variants(variant_id),
  objective            TEXT NOT NULL,
  identity_ref         TEXT NOT NULL,  -- anonymous_identity_id OR profile_id
  pricing_context_id   UUID,
  evidence_pack_id     UUID,
  launch_id            UUID REFERENCES launch_briefs(launch_id),
  occurred_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_event_ref     UUID NOT NULL,  -- shared with cdp_events row
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversion_events
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON conversion_events (tenant_id, surface_id, occurred_at DESC);
CREATE INDEX ON conversion_events (launch_id) WHERE launch_id IS NOT NULL;
CREATE INDEX ON conversion_events (source_event_ref);
CREATE INDEX ON conversion_events (tenant_id, identity_ref);
```

### `conversion_experiments`

```sql
CREATE TABLE conversion_experiments (
  experiment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  name               TEXT NOT NULL,
  hypothesis         TEXT,
  target_surface_id  UUID NOT NULL,
  target_surface_kind TEXT NOT NULL CHECK (target_surface_kind IN ('page','form','cta')),
  audience_id        UUID,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','active','paused','completed'
  )),
  traffic_split      JSONB NOT NULL DEFAULT '{}',
  started_at         TIMESTAMPTZ,
  ended_at           TIMESTAMPTZ,
  planned_duration_days INTEGER,
  decision_rule      JSONB,  -- null in v1; P225 populates
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE conversion_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversion_experiments
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### `experiment_variants`

```sql
CREATE TABLE experiment_variants (
  variant_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES markos_tenants(id),
  experiment_id     UUID NOT NULL REFERENCES conversion_experiments(experiment_id),
  name              TEXT NOT NULL,
  content_overrides JSONB NOT NULL DEFAULT '{}',
  traffic_weight    INTEGER NOT NULL CHECK (traffic_weight >= 0 AND traffic_weight <= 100),
  is_control        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON experiment_variants
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### `experiment_assignments`

```sql
CREATE TABLE experiment_assignments (
  assignment_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES markos_tenants(id),
  experiment_id  UUID NOT NULL REFERENCES conversion_experiments(experiment_id),
  identity_ref   TEXT NOT NULL,
  variant_id     UUID NOT NULL REFERENCES experiment_variants(variant_id),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sticky         BOOLEAN NOT NULL DEFAULT TRUE
);
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON experiment_assignments
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE UNIQUE INDEX ON experiment_assignments (experiment_id, identity_ref);  -- enforce one-assignment-per-identity
CREATE INDEX ON experiment_assignments (tenant_id, experiment_id, variant_id);
```

### `launch_briefs`

```sql
CREATE TABLE launch_briefs (
  launch_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  launch_type        TEXT NOT NULL CHECK (launch_type IN (
    'feature','pricing','integration','campaign','event','beta','market_entry'
  )),
  name               TEXT NOT NULL,
  objective          TEXT NOT NULL,
  target_audiences   UUID[] NOT NULL DEFAULT '{}',
  launch_date        DATE,
  owner_user_id      UUID REFERENCES auth.users(id),
  status             TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning','pending_approval','ready','live','completed','rolled_back'
  )),
  positioning_summary TEXT,
  pricing_context_id  UUID,
  evidence_pack_id    UUID,
  internal_readiness_checks UUID[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE launch_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_briefs
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON launch_briefs (tenant_id, status);
CREATE INDEX ON launch_briefs (tenant_id, launch_date);
```

### `launch_surfaces`

```sql
CREATE TABLE launch_surfaces (
  surface_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  launch_id          UUID NOT NULL REFERENCES launch_briefs(launch_id),
  surface_type       TEXT NOT NULL CHECK (surface_type IN (
    'email_campaign','messaging_thread','messaging_flow','landing_page',
    'social_pack','sales_enablement','partner_pack','support_pack','docs_update'
  )),
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','blocked','approved','published','archived'
  )),
  surface_target_kind TEXT NOT NULL,
  surface_target_id   UUID,
  blocking_reasons    TEXT[] NOT NULL DEFAULT '{}',
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Polymorphic FK enforced in repository layer via CHECK + read-after-write
  CONSTRAINT launch_surfaces_kind_valid CHECK (
    surface_target_kind IN (
      'email_campaign','messaging_thread','lifecycle_journey',
      'conversion_page','social_pack','sales_enablement',
      'partner_pack','support_pack','docs_update'
    )
  )
);
ALTER TABLE launch_surfaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_surfaces
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON launch_surfaces (launch_id, status);
CREATE INDEX ON launch_surfaces (surface_target_kind, surface_target_id);
```

### `launch_gates`

```sql
CREATE TABLE launch_gates (
  gate_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES markos_tenants(id),
  launch_id      UUID NOT NULL REFERENCES launch_briefs(launch_id),
  gate_kind      TEXT NOT NULL CHECK (gate_kind IN (
    'pricing','evidence','readiness','approval','custom'
  )),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','passing','blocking','waived'
  )),
  blocking_reasons TEXT[] NOT NULL DEFAULT '{}',
  evidence_refs    UUID[] NOT NULL DEFAULT '{}',
  evaluated_at     TIMESTAMPTZ,
  waived_by        UUID REFERENCES auth.users(id),
  waived_at        TIMESTAMPTZ,
  waiver_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE launch_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_gates
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON launch_gates (launch_id, gate_kind);
CREATE INDEX ON launch_gates (launch_id, status);
```

### `launch_runbooks`

```sql
CREATE TABLE launch_runbooks (
  runbook_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES markos_tenants(id),
  launch_id      UUID NOT NULL REFERENCES launch_briefs(launch_id),
  steps          JSONB NOT NULL DEFAULT '[]',
  rollback_steps JSONB NOT NULL DEFAULT '[]',
  owner_user_id  UUID REFERENCES auth.users(id),
  state          TEXT NOT NULL DEFAULT 'draft' CHECK (state IN (
    'draft','armed','executing','executed',
    'rolling_back','rolled_back','failed'
  )),
  current_step   INTEGER NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  agentrun_id    UUID,  -- FK → markos_agent_runs (P207); null if bridge stub
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE launch_runbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_runbooks
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON launch_runbooks (launch_id, state);
```

### `launch_outcomes`

```sql
CREATE TABLE launch_outcomes (
  launch_id          UUID NOT NULL REFERENCES launch_briefs(launch_id),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  period_days        INTEGER NOT NULL CHECK (period_days IN (7, 14, 30)),
  reach              INTEGER,
  signups            INTEGER,
  pipeline_created   NUMERIC(18,4),
  influenced_revenue NUMERIC(18,4),
  activation_lift    NUMERIC(6,4),  -- null in v1
  narrative_summary  TEXT,
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (launch_id, period_days)
);
ALTER TABLE launch_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_outcomes
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### `launch_readiness_checks`

```sql
CREATE TABLE launch_readiness_checks (
  check_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES markos_tenants(id),
  launch_id     UUID NOT NULL REFERENCES launch_briefs(launch_id),
  check_kind    TEXT NOT NULL CHECK (check_kind IN (
    'legal_approved','support_ready','sales_trained',
    'docs_published','partner_briefed','custom'
  )),
  owner_user_id UUID REFERENCES auth.users(id),
  due_at        TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','in_progress','completed','waived'
  )),
  evidence_ref  UUID,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE launch_readiness_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_readiness_checks
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX ON launch_readiness_checks (launch_id, status);
```

**Note on ingest.js retrofit (D-11):** No schema change required. The retrofit adds conditional logic to `api/tracking/ingest.js`: when a tracked event carries `surface_id` and `surface_kind`, the handler calls `emit()` from `lib/markos/conversion/events/emit.ts` in addition to the existing CRM activity write. The existing event_family taxonomy is preserved.

---

## Standard Stack

### Core (all verified against codebase or prior phase RESEARCH.md)

| Library / Pattern | Version | Purpose | Source |
|-------------------|---------|---------|--------|
| Next.js App Router | 16 (Vercel) | Dynamic catch-all `app/(public)/[...slug]/page.tsx` + ISR + cacheTag/updateTag | [VERIFIED: 224-CONTEXT.md D-29/D-30; Vercel knowledge update cited in CONTEXT.md] |
| Supabase + PostgreSQL | existing | All 13 new tables + RLS + migrations 121-133 | [VERIFIED: Database Schema.md; prior phase migrations] |
| Vitest | existing (Phase 204+) | All business logic tests per Testing Environment Plan | [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md] |
| Playwright | existing (Phase 204+) | Operator journey browser proof | [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md] |
| Chromatic + Storybook | existing | Visual regression for workspace states | [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md] |
| lib/markos/mcp/pipeline.cjs | existing | 10-step middleware: all conversion + launch writes flow through it | [VERIFIED: 224-CONTEXT.md code_context] |
| lib/markos/cdp/adapters/crm-projection.ts | P221 | ConsentState reads + AudienceSnapshot reads | [VERIFIED: 224-CONTEXT.md canonical_refs; P221 D-20] |
| lib/markos/crm360/* | P222 | Customer360 + lifecycle progression | [VERIFIED: 224-CONTEXT.md canonical_refs; P222 D-18/D-19] |
| lib/markos/channels/* | P223 | LaunchSurface targets (email_campaigns, messaging_threads, lifecycle_journeys) | [VERIFIED: 224-CONTEXT.md canonical_refs; P223 D-01/D-03/D-04] |
| lib/markos/crm/copilot.ts::createApprovalPackage | P105 | Approval-package factory for all high-risk mutations | [VERIFIED: 224-CONTEXT.md canonical_refs] |
| markos_audit_log | P201 | Hash-chain audit trail for all mutations | [VERIFIED: 224-CONTEXT.md code_context] |
| Vercel BotID | P201 | Public form gate (D-25) | [VERIFIED: 224-CONTEXT.md D-25; P201 pattern carry] |
| Vercel Edge Config | P201 | Rate-limit tenant config (per-form metadata) | [ASSUMED: available; A15 below] |
| Redis (or dispatch_events rolling window) | P223 | Rate-limit counters (alternative: dispatch_events window per P223 D-19) | [ASSUMED: Redis available OR fallback to Postgres rolling window] |
| xxhash3 (npm) | latest | Sticky-hash variant assignment for experiments | [ASSUMED: available; see A17 below] |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| Zod | Block schema validators in lib/markos/conversion/blocks/schema.ts | Per-block type validator at write time |
| Handlebars (existing, from P223) | Template variable substitution in block bodies for {{pricing.*}}, {{evidence.*}} | Renderer resolves bindings |
| markos_agent_runs (P207) | AgentRun wraps runbook execution | D-37; bridge stub if P207 absent |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| xxhash3 for sticky hash | SHA-256 truncated (no npm dep) | SHA-256 is slower but universally available with no new dependency; xxhash3 is ~10× faster for high-volume assignment |
| Redis counters for rate-limit | Postgres rolling window on experiment_assignments or a new counters table | Postgres avoids new infra; Redis has sub-ms latency. For form submit rate-limiting, Postgres is acceptable unless form volume > 1k/s/tenant |
| Vercel Edge Config for rate-limit config | ConversionForm.metadata JSON column | Edge Config reduces cold-start latency; JSON column avoids Vercel coupling |

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/
├── conversion/
│   ├── blocks/
│   │   └── schema.ts           -- Zod per-block validators (15 types)
│   ├── render/
│   │   └── page-renderer.ts    -- Block composition at SSR time
│   ├── forms/
│   │   └── form-renderer.tsx   -- Dynamic FormRenderer (RSC + client islands)
│   ├── events/
│   │   └── emit.ts             -- Single fan-out emitter (7 sinks, fail-closed transaction)
│   ├── gates/
│   │   └── content-classifier.ts  -- Extends P223 classifier; currency patterns + claim shapes
│   └── contracts/              -- ConversionPage, ConversionForm, CTA, ConversionEvent types
├── launches/
│   ├── gates/
│   │   ├── pricing-evaluator.ts
│   │   ├── evidence-evaluator.ts
│   │   ├── readiness-evaluator.ts
│   │   └── approval-evaluator.ts
│   ├── runbook/
│   │   └── executor.ts         -- Step execution + rollback + AgentRun wrapper
│   ├── surfaces/
│   │   └── surface-coordinator.ts  -- Polymorphic surface dispatch + status machine
│   └── outcomes/
│       └── compute.ts          -- T+7/T+14/T+30 metric computation
app/
├── (public)/
│   └── [...slug]/
│       └── page.tsx            -- Dynamic catch-all route (ISR + cacheTag)
├── (markos)/
│   ├── conversion/
│   │   └── page.tsx            -- ConversionWorkspace
│   └── launches/
│       └── page.tsx            -- LaunchCockpit
api/v1/
├── conversion/
│   ├── pages/[id]/route.ts
│   ├── forms/[id]/route.ts
│   ├── forms/[id]/submit/route.ts  -- public endpoint
│   ├── ctas/route.ts
│   ├── events/route.ts
│   └── experiments/route.ts
└── launches/
    ├── briefs/[id]/route.ts
    ├── surfaces/route.ts
    ├── gates/route.ts
    ├── [id]/gates/evaluate/route.ts
    ├── [id]/gates/[gate_id]/waive/route.ts
    ├── runbooks/route.ts
    ├── [id]/runbooks/[runbook_id]/[action]/route.ts
    └── [id]/outcomes/route.ts
```

### Pattern 1: Single Fan-Out emit() (D-33/D-34)

**What:** One transactional function writes to all 7 sinks atomically. Any partial write triggers full rollback.

**When to use:** Every ConversionEvent creation path (form submit, CTA click, page view with conversion objective, ingest.js retrofit).

```typescript
// Source: 224-CONTEXT.md D-33 + P222 D-29 fan-out pattern + P223 D-29
// lib/markos/conversion/events/emit.ts
export async function emitConversionEvent(
  ctx: TenantContext,
  payload: ConversionEventPayload
): Promise<ConversionEvent> {
  return await supabase.rpc('emit_conversion_event_tx', {
    // All 7 writes happen in a single Postgres function for fail-closed guarantee
    p_tenant_id: ctx.tenant_id,
    p_surface_id: payload.surface_id,
    p_surface_kind: payload.surface_kind,
    p_source_event_ref: payload.source_event_ref ?? crypto.randomUUID(),
    // ...remaining payload fields
  });
  // On Postgres exception → full rollback; caller receives the error
}
```

**Anti-pattern:** Never write conversion_events and cdp_events in separate awaits outside a transaction.

### Pattern 2: Block Schema Validation at Write (D-02)

**What:** Every content_blocks write is validated against per-block Zod schemas before persistence.

```typescript
// Source: 224-CONTEXT.md D-02
// lib/markos/conversion/blocks/schema.ts
const HeroBlockSchema = z.object({
  block_type: z.literal('hero'),
  heading: z.string().max(200),
  subheading: z.string().max(500).optional(),
  cta_label: z.string().max(80).optional(),
  cta_href: z.string().url().optional(),
  background_image_url: z.string().url().optional(),
  pricing_binding: z.string().optional(), // {{pricing.*}} variable
  evidence_binding: z.string().optional(), // {{evidence.*}} variable
});
// 14 more block schemas following same pattern
export const BlockSchemas: Record<BlockType, z.ZodSchema> = { hero: HeroBlockSchema, ... };
export function validateBlock(block: unknown): z.SafeParseReturnType<Block, Block> {
  const type = (block as any)?.block_type;
  const schema = BlockSchemas[type];
  if (!schema) return { success: false, error: new z.ZodError([{ message: 'unknown block_type', ...}]) };
  return schema.safeParse(block);
}
```

### Pattern 3: ISR cacheTag Invalidation (D-30)

**What:** On page publish or rollback, immediately invalidate the ISR cache for that page.

```typescript
// Source: 224-CONTEXT.md D-30; Vercel knowledge update (Next.js 16 cacheTag API)
// Called within page publish handler:
import { cacheTag, updateTag } from 'next/cache'; // Next.js 16 API [ASSUMED: stable]
// In the dynamic route page.tsx:
cacheTag(`tenant:${tenant_id}:page:${page_id}`);
// In the publish/rollback API handler:
updateTag(`tenant:${tenant_id}:page:${page_id}`);
```

### Pattern 4: Polymorphic LaunchSurface FK Enforcement (D-14)

**What:** CHECK constraint in Postgres + read-after-write validation in repository layer.

```typescript
// Source: 224-CONTEXT.md D-14
// lib/markos/launches/surfaces/surface-coordinator.ts
async function validateSurfaceTargetRef(
  surface_target_kind: SurfaceTargetKind,
  surface_target_id: UUID,
  tenant_id: UUID
): Promise<boolean> {
  const table = SURFACE_TARGET_KIND_TABLE_MAP[surface_target_kind];
  // SURFACE_TARGET_KIND_TABLE_MAP = {
  //   email_campaign: 'email_campaigns',    // P223
  //   messaging_thread: 'messaging_threads', // P223
  //   lifecycle_journey: 'lifecycle_journeys', // P223
  //   conversion_page: 'conversion_pages',   // P224
  //   ...
  // }
  const exists = await supabase
    .from(table)
    .select('id')
    .eq('id', surface_target_id)
    .eq('tenant_id', tenant_id)
    .single();
  return !!exists.data;
}
```

### Pattern 5: Sticky-Hash Variant Assignment (D-23)

**What:** Deterministic hash(experiment_id + identity_ref) → variant index. Stored once; never re-bucketed.

```typescript
// Source: 224-CONTEXT.md D-23; D-21 (Claude's Discretion: xxhash3 recommended)
// lib/markos/conversion/experiments/assignment.ts
import xxhash from 'xxhash-wasm'; // or 'xxhash3' npm package [ASSUMED: A17]
// Fallback: SHA-256 truncated (no npm dep)
function hashToBucket(experimentId: string, identityRef: string, total: number): number {
  const input = `${experimentId}:${identityRef}`;
  const hash = xxhash.h32(input); // 32-bit unsigned int
  return hash % total;
}
export async function getOrAssignVariant(
  experimentId: UUID, identityRef: string, variants: ExperimentVariant[]
): Promise<ExperimentVariant> {
  // 1. Check experiment_assignments for existing sticky assignment
  const existing = await lookupAssignment(experimentId, identityRef);
  if (existing) return existing;
  // 2. Assign via hash — freeze assignment immediately
  const bucket = hashToBucket(experimentId, identityRef, variants.length);
  const variant = resolveVariantByTrafficSplit(variants, bucket);
  await createAssignment({ experimentId, identityRef, variantId: variant.variant_id });
  return variant;
}
```

**Critical:** traffic_split weights are frozen into assignment_id at creation time. Changes to traffic_split after an experiment goes active do NOT re-bucket existing assignments.

### Pattern 6: LaunchGate Evaluator (D-16)

**What:** Each gate kind has a dedicated evaluator. All evaluators write audit rows.

```typescript
// Source: 224-CONTEXT.md D-16
// lib/markos/launches/gates/pricing-evaluator.ts
export async function evaluatePricingGate(
  launchId: UUID, tenantId: UUID
): Promise<GateEvaluationResult> {
  const brief = await getLaunchBrief(launchId, tenantId);
  if (!brief.pricing_context_id) {
    // All surface content must use {{MARKOS_PRICING_ENGINE_PENDING}} placeholder
    const surfaces = await getLaunchSurfaces(launchId, tenantId);
    const hasUnresolvedPricing = await scanSurfacesForUnboundPricingCopy(surfaces);
    if (hasUnresolvedPricing) {
      await writeGateAuditRow(launchId, 'pricing', 'blocking', ['unbound_pricing_copy']);
      return { status: 'blocking', blocking_reasons: ['unbound_pricing_copy'] };
    }
    return { status: 'passing', blocking_reasons: [] };
  }
  const pricingRec = await getPricingRecommendation(brief.pricing_context_id);
  if (!pricingRec || pricingRec.status !== 'approved') {
    await writeGateAuditRow(launchId, 'pricing', 'blocking', ['pricing_context_not_approved']);
    return { status: 'blocking', blocking_reasons: ['pricing_context_not_approved'] };
  }
  return { status: 'passing', blocking_reasons: [] };
}
```

### Anti-Patterns to Avoid

- **Conversion event split writes:** Never write conversion_events and cdp_events separately outside a transaction. Fan-out must be atomic.
- **Pricing copy in block bodies without binding:** All pricing text must use `{{pricing.*}}` variables bound to Pricing Engine context, or the literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder.
- **ISR invalidation after status transition:** updateTag must be called synchronously in the publish handler, not in a background job. Race condition: page could serve stale cache during the gap.
- **traffic_split mutation after experiment.status='active':** Weights are frozen per assignment. Changing traffic_split mid-experiment breaks sticky assignment guarantee.
- **Polymorphic FK without read-after-write check:** The CHECK constraint validates the enum value but cannot enforce cross-table FK integrity. Repository must always verify surface_target_id exists in the correct table for the given surface_target_kind.
- **Direct writes to conversion_events bypassing emit():** All paths that need conversion event emission must call emit(); never write the row directly.
- **Non-reversible step abort on rollback:** When a rollback encounters a non-reversible step (reversible: false), it must emit an operator task and continue executing remaining reversible steps. Do not abort the entire rollback.
- **BotID fail-open:** If BotID API is unavailable, fail-closed (reject the form submit with 503 + retry header). Never let BotID outage become a submission path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Identity stitching on form submit | Custom identity resolution | `api/tracking/identify.js` (existing, P101 D-04) | Confidence-aware scoring, merge policy, reversible lineage — all in place |
| ConsentState at submit | Custom consent write | P221 `setConsentState()` adapter | Consistency with global consent SOR; drift audit coverage |
| Customer360 lifecycle progression | Custom CRM update | P222 `lib/markos/crm360/*` adapter | Lifecycle stage state machine lives in P222 |
| Approval-package creation | Custom approval flow | `lib/markos/crm/copilot.ts::createApprovalPackage` | P105/P208 pattern; Approval Inbox wiring is already there |
| Audit trail | Custom audit writes | `markos_audit_log` (P201 hash chain) | Immutable, hash-chained, tenant-scoped — already the SOR for audit |
| Rate-limit counters | Custom counter table | Vercel Edge Config (config) + Postgres rolling window (counts) | Pattern established in P201 signup path |
| BotID gate | Custom bot detection | Vercel BotID (P201 pattern) | Provider abstracted, tested, established tenant-tier pattern |
| AgentRun wrapper | Custom run management | `markos_agent_runs` (P207) | Priority, pause/resume/cancel, DAG, cost — all in P207 |
| Email campaign dispatch | Custom send logic | P223 `lib/markos/channels/*` (email_campaigns) | LaunchSurface only coordinates; P223 owns send |
| Pricing placeholder enforcement | Custom price scanner | Content classifier extending P223 D-16 pattern | Same classifier used in P211, P223 — extend, don't re-implement |

---

## Public Surface Delivery Details

### Next.js 16 Dynamic Catch-All Route (D-29)

```text
app/(public)/[...slug]/page.tsx
```

- Segment group `(public)` excludes the route from the `(markos)` auth layout — no session requirement.
- `generateStaticParams()`: Pre-generates slugs for all published ConversionPages at build time. Fallback `'blocking'` for new pages published after last build (ISR picks them up on first request).
- `cache: 'force-cache'` with `cacheTag(...)` — content cached until `updateTag()` invalidation.

### ISR cacheTag Scope (D-30)

```text
cacheTag scope: `tenant:${tenant_id}:page:${page_id}`
```

- Granular: invalidating one page does not bust other tenant pages.
- `updateTag()` called synchronously in the publish handler and in the rollback handler (D-38) before returning 200.
- Default TTL: `revalidate: 300` (5 min) for high-traffic page_types (landing, pricing, signup); `revalidate: 60` (1 min) for low-traffic (webinar, offer, content_download). TTL tuning is Claude's Discretion.

### Public Form Submit Endpoint (D-52)

```text
POST /api/v1/conversion/forms/{form_id}/submit
```

OR under public API prefix:

```text
POST /api/v1/public/conversion/forms/{form_id}/submit
```

The "public" prefix is recommended to make the unauthenticated posture explicit in route scanning and middleware. This is Claude's Discretion.

**Middleware chain for public submit:**
1. Tenant resolution via Host header (P201 BYOD pattern) — no auth required but tenant must be resolvable
2. Vercel BotID gate → 403 + audit if blocked
3. Rate-limit check (IP + email dimension) → 429 if exceeded
4. Honeypot field check (server-side) → silent 200 + audit if triggered (do not reveal honeypot presence)
5. ConsentState double-gate (D-28)
6. Form field validation via variables_schema
7. emit() fan-out (D-33)

### SEO (D-31)

- `generateMetadata()` in the dynamic route reads `ConversionPage.seo_meta` + `title` and returns Next.js Metadata object with `openGraph`, `twitter`, `canonical`.
- `sitemap.xml` regenerated via Vercel Cron on publish (or `app/sitemap.ts` with ISR and `revalidate: 3600`). The sitemap queries all published ConversionPages per tenant sorted by `published_at DESC`.

### Performance (D-32)

- Static blocks (hero, content, testimonial, image, faq, footer, social_proof, comparison): RSC — no JS bundle shipped.
- Interactive blocks (form, cta, signup_widget, pricing with interactive state): Client Component islands — `'use client'` boundary; hydrated after static HTML.
- custom_html: Admin-approved only; rendered as dangerouslySetInnerHTML with DOMPurify sanitization or server-side sanitization pass.
- Render budget target: < 100ms p95 server-side. Enforced via Vercel monitoring; alert threshold in D-50 spike detection.

---

## Slice Boundaries

### Recommended: 7 slices across 5 waves

| Slice | Wave | Title | D-IDs | F-IDs | Migrations |
|-------|------|-------|-------|-------|------------|
| 224-01 | Wave 1 | Schema foundation + base contracts + module stubs | D-01,D-02,D-05,D-09,D-12,D-13,D-21,D-22,D-23,D-51 | F-132..F-136,F-139..F-144 (stubs) | 121-126 |
| 224-02 | Wave 2 | ConversionEvent fan-out + identity stitch + BotID/rate-limit | D-08,D-10,D-11,D-25,D-26,D-27,D-28,D-33,D-34 | F-137,F-138 | 130 |
| 224-03 | Wave 2 | Block renderer + form renderer + ISR + Next.js route + SEO | D-01..D-04,D-06,D-07,D-29,D-30,D-31,D-32 | F-132,F-133 (complete) | none |
| 224-04 | Wave 3 | LaunchBrief + LaunchSurface + LaunchGate + LaunchOutcome + readiness checks | D-12..D-18,D-39,D-40,D-41 | F-139..F-141,F-143,F-144 (complete) | 127,129 |
| 224-05 | Wave 3 | Experiments + sticky-hash assignment + traffic_split renderer | D-21..D-24 | F-136 (complete) | 131 |
| 224-06 | Wave 4 | LaunchRunbook + AgentRun execution + rollback + audit + cron | D-35..D-38,D-48,D-49,D-50 | F-142,F-145,F-146 | 128,132 |
| 224-07 | Wave 5 | API surface + 6 MCP tools + UI workspace + RLS closeout + OpenAPI + tests | D-42..D-47,D-51..D-54 | F-132..F-146 (all complete) | 133 |

**Wave dependencies:**
- Wave 1 (224-01): independent starting point — all downstream slices depend on it.
- Wave 2: 224-02 and 224-03 run in parallel (both depend on 224-01).
- Wave 3: 224-04 and 224-05 run in parallel (both depend on 224-01; 224-04 does not depend on 224-02 or 224-03).
- Wave 4 (224-06): depends on 224-01 through 224-05 (needs LaunchSurface + experiments + fan-out).
- Wave 5 (224-07): depends on all prior slices. Finalizes contracts, MCP tools, UI, and RLS hardening.

**Note on DISCUSS.md proposed slices:** The original 6-slice proposal (DISCUSS.md) grouped page/form/CTA/ConversionEvent in 224-01, launch program in 224-02, experiments in 224-03, etc. The revised 7-slice structure above separates schema foundation from behavioral slices to match the Wave 0 verify pattern from P221/P222/P223 and to enable parallel Wave 2 execution.

---

## Integration Contracts

### P221 (CDP) Integration Points

| Contract | How P224 Uses It | File |
|----------|-----------------|------|
| `getConsentState(profile_id, channel)` | ConsentState double-gate at form submit (D-28) | `lib/markos/cdp/adapters/crm-projection.ts` |
| `setConsentState(...)` | Write consent record after form submit consent_capture_block | P221 writer (P223 D-12 established it as sole writer) |
| `cdp_events` table | Target for D-10 dual-write; shared source_event_ref | P221 D-08 append-only table |
| `AudienceSnapshot` | ConversionPage.audience_id + ConversionExperiment.audience_id reads | P221 D-18 double-gate at dispatch |

**Dependency assertion:** P221 `lib/markos/cdp/adapters/crm-projection.ts` MUST exist before 224-02 can be implemented (emit() calls getConsentState). [ASSUMED: A3 from P223]

### P222 (CRM) Integration Points

| Contract | How P224 Uses It | File |
|----------|-----------------|------|
| `customer_360_records` | Customer360 lifecycle progression on form submit (D-33 sink 6) | `lib/markos/crm360/*` |
| `nba_records` | NBA recompute trigger on conversion event (D-33 sink 7) | P222 D-08 |
| `crm_activity` | Commercial signal writeback from conversion event (D-33 sink 3) | `lib/markos/crm/tracking.ts` alias mapping |
| `opportunities` | Pipeline created linked to launch_id in LaunchOutcome (D-40) | `lib/markos/crm360/*` |

### P223 (Channels) Integration Points

| Contract | How P224 Uses It | File |
|----------|-----------------|------|
| `email_campaigns` | LaunchSurface(surface_target_kind='email_campaign') target | `lib/markos/channels/campaigns/` |
| `messaging_threads` | LaunchSurface(surface_target_kind='messaging_thread') target | `lib/markos/channels/threads/` |
| `lifecycle_journeys` | LaunchSurface(surface_target_kind='messaging_flow') target | `lib/markos/channels/journeys/` |
| Fan-out `emit()` pattern | P224 emit() mirrors P223 D-29 structure | `lib/markos/channels/events/emit.ts` (reference, not reuse) |

### P207 (AgentRun) Integration Point

| Contract | How P224 Uses It |
|----------|-----------------|
| `markos_agent_runs` | LaunchRunbook execution and rollback wrapped in AgentRun (D-37) |
| Bridge stub | If markos_agent_runs table absent: direct write to markos_audit_log; config flag `workflow.agentrun_v2_available` (P221 D-15 carry) |

### P205 (Pricing Engine) Integration Point

| Contract | How P224 Uses It |
|----------|-----------------|
| PricingRecommendation record | LaunchGate(kind='pricing') checks approval status; ConversionPage.pricing_context_id resolves to this |
| Bridge behavior | If PricingRecommendation absent: gate stubs to "warning + audit" instead of blocking (A13 below) |

### P209 (EvidenceMap) Integration Point

| Contract | How P224 Uses It |
|----------|-----------------|
| EvidenceMap claim TTL | LaunchGate(kind='evidence') checks claim freshness before publish |
| evidence_pack_id | ConversionPage.evidence_pack_id + LaunchBrief.evidence_pack_id + ConversionEvent.evidence_pack_id |
| narrative_summary | LaunchOutcome.narrative_summary generated via EvidenceMap audit (D-41) |

---

## Common Pitfalls

### Pitfall 1: Block JSON Injection via Cache Poisoning

**What goes wrong:** content_blocks JSONB is validated at write time but not at read time from ISR cache. A poisoned cache entry (e.g., via compromised CDN) could serve unvalidated block content.

**Why it happens:** The validator runs in the API write path but not in the Next.js page render path.

**How to avoid:** Page renderer (D-03) MUST re-validate block types at render time (lightweight type-check, not full Zod parse). custom_html blocks run through DOMPurify at render time regardless of cache state.

**Warning signs:** block_type values that are not in the 15-type enum appearing in rendered output.

### Pitfall 2: Static-Text Pricing Leak

**What goes wrong:** Pricing claims ("only $29/month", "save 30%") embedded as static text in block bodies (not as `{{pricing.*}}` variables) bypass the runtime resolver and the LaunchGate(pricing) check.

**Why it happens:** The content classifier scans for variable patterns, not raw text. An operator who pastes pricing text directly into the hero block body evades the gate.

**How to avoid:** ContentClassifier (D-19 static-text scan) must use currency regex patterns (`/\$\d+|\d+%\s+off|\bfree\b.*plan/i`) in addition to variable pattern detection. This extends the P223 D-16 classifier. Flag for approval on any match.

**Warning signs:** LaunchGate(kind='pricing') returning 'passing' for a surface that visually displays hard-coded prices.

### Pitfall 3: ISR Cache Desync on Rollback

**What goes wrong:** A runbook rollback archives a LaunchSurface and updates ConversionPage.status to 'archived', but the ISR cache still serves the page as published.

**Why it happens:** updateTag() is async and may be called in a background job rather than synchronously in the rollback handler.

**How to avoid:** updateTag() MUST be called synchronously in the rollback step handler BEFORE the step is marked complete. The runbook executor (D-38) must treat ISR invalidation as the first step of any publish_surface→archive_surface rollback step.

**Warning signs:** Published page still viewable after rollback completes.

### Pitfall 4: Polymorphic Surface_target_id Orphan

**What goes wrong:** A LaunchSurface references a surface_target_id for an email_campaign that has been deleted (or belongs to another tenant).

**Why it happens:** Postgres CHECK constraint validates enum value but not cross-table FK integrity. Soft-deletes in P223 tables don't cascade to LaunchSurfaces.

**How to avoid:** Repository `createLaunchSurface()` MUST perform a read-after-write check: after inserting the surface, verify `surface_target_id` exists in the correct table for `surface_target_kind` and belongs to the same `tenant_id`. Return 422 if not.

**Warning signs:** LaunchSurface.status transitions failing silently on execute step.

### Pitfall 5: Experiment Assignment Re-Bucket

**What goes wrong:** Operator changes traffic_split weights mid-experiment. Existing assignments calculated under old weights become inconsistent with new weights. Some identity_refs appear to "switch" variants.

**Why it happens:** The hash function is deterministic but maps to a range bucket based on traffic_split weights. Changing weights changes the bucket ranges.

**How to avoid:** Once an experiment is in status='active', mutations to traffic_split MUST be blocked at the API level (return 422 with reason 'experiment_active_traffic_split_immutable'). The experiment must be paused→completed before a new variant ratio can be set. Assignments are frozen by the UNIQUE index on (experiment_id, identity_ref).

**Warning signs:** Vitest sticky-hash determinism test failing after traffic_split change.

### Pitfall 6: Non-Reversible Step Rollback Abort

**What goes wrong:** During rollback, a non-reversible step (e.g., email broadcast already sent) causes the runbook executor to throw and abort the entire rollback, leaving reversible surfaces in a partially-rolled-back state.

**Why it happens:** Naive error propagation from the non-reversible step stops the rollback loop.

**How to avoid:** Runbook executor MUST treat non-reversible steps as "emit operator task + audit row + continue". The rollback loop should never abort for a non-reversible step — it should log the blocker and proceed to the next rollback step. The final state should be 'rolled_back' with a `partial_rollback_blockers` field in the audit row.

**Warning signs:** LaunchSurface.status remaining 'published' after rollback.completed for surfaces that were reversible.

### Pitfall 7: Identity-Stitch Double-Submit Race

**What goes wrong:** User submits form twice quickly (double-click, network retry). Two ConversionEvents are emitted for the same identity + form combination, causing duplicate CRM activity rows and potentially double-stitching.

**Why it happens:** No submit deduplication on the public form endpoint.

**How to avoid:** Public form submit handler generates or accepts a `submit_idempotency_key` (client-generated UUID or server-assigned nonce from the form render). Duplicate key within 60 seconds → return 200 with the cached result, no new emit(). Pattern mirrors P223 `dispatch_attempt_id`.

**Warning signs:** Duplicate conversion_events rows with the same (form_id, identity_ref, occurred_at) within a short window.

### Pitfall 8: LaunchOutcome Computation Missing launch_id Linkage

**What goes wrong:** ConversionEvents emitted before a launch transitions to 'live' have `launch_id = null`. The T+7 outcome computation misses pre-launch warm-up conversions.

**Why it happens:** launch_id FK on conversion_events is populated by the form/page at emit time. If the launch is not yet 'live' at emit time, the FK is null.

**How to avoid:** The T+7 outcome computation cron (D-39) includes a backfill step: identify conversion_events where `source_event_ref` appears in cdp_events that can be attributed to launch surfaces by surface_id FK, and back-populate launch_id within the computation window. Flag as 'backfill_applied' in the audit row.

**Warning signs:** LaunchOutcome.reach = 0 for a launch with active landing pages.

---

## Tests Implied — Per Slice

### Wave 0 Gaps (must exist before any slice implementation)

- [ ] `test/vitest/conversion/` — directory + vitest config coverage patterns
- [ ] `test/vitest/launches/` — directory
- [ ] `test/fixtures/conversion/` — ConversionPage fixtures, ConversionForm fixtures, ConversionEvent fixtures
- [ ] `test/fixtures/launches/` — LaunchBrief fixtures, LaunchSurface fixtures, LaunchGate fixtures, LaunchRunbook fixtures
- [ ] `test/fixtures/experiments/` — ConversionExperiment + ExperimentVariant fixtures
- [ ] Shared posture extension: `conversion_ready` posture (published page + form + experiment active), `launch_ready` posture (all gates passing, runbook armed)
- [ ] `test/vitest/conversion/rls/` — cross-tenant denial tests for 13 new tables (Wave 0 scaffold, filled during 224-01)

### 224-01: Schema Foundation

```text
test/vitest/conversion/schema/
├── conversion-page.schema.test.ts   -- page_type enum, slug uniqueness, status enum, content_blocks JSONB null defense
├── conversion-form.schema.test.ts   -- objective enum, variables_schema JSONB, identity_stitch_enabled default
├── conversion-event.schema.test.ts  -- surface_kind CHECK, source_event_ref UUID required
├── experiment-assignment.schema.test.ts -- unique index (experiment_id, identity_ref)
├── launch-brief.schema.test.ts      -- launch_type enum, status enum, target_audiences UUID[]
├── launch-surface.schema.test.ts    -- polymorphic CHECK constraint, status enum
├── launch-gate.schema.test.ts       -- gate_kind enum, status enum
test/vitest/conversion/rls/
├── conversion-pages.rls.test.ts     -- cross-tenant read denied, intra-tenant read allowed
├── conversion-forms.rls.test.ts
├── conversion-events.rls.test.ts
├── experiment-assignments.rls.test.ts
├── launch-briefs.rls.test.ts
├── launch-surfaces.rls.test.ts
├── launch-gates.rls.test.ts
├── launch-runbooks.rls.test.ts
├── launch-outcomes.rls.test.ts
├── launch-readiness-checks.rls.test.ts
├── conversion-experiments.rls.test.ts
├── experiment-variants.rls.test.ts
└── conversion-ctas.rls.test.ts      -- all 13 tables
```

### 224-02: Fan-Out + Identity Stitch + Bot/Rate-Limit

```text
test/vitest/conversion/events/
├── emit.test.ts                      -- all 7 sinks written, fail-closed (partial write → full rollback)
├── emit-identity-stitch.test.ts     -- form submit → identify.js called → identity_ref resolved
├── emit-consent-write.test.ts       -- consent_capture_block present → setConsentState called
├── emit-customer360-update.test.ts  -- lifecycle progression: anonymous→known on form submit
├── emit-nba-recompute.test.ts       -- NBA recompute triggered after emit
test/vitest/conversion/forms/
├── bot-id-gate.test.ts              -- failed BotID → 403 + audit, no emit
├── rate-limit-gate.test.ts          -- 11th IP submit → 429 + audit, no emit
├── honeypot-gate.test.ts            -- honeypot field filled → silent 200 + audit, no emit
├── consent-double-gate.test.ts      -- revoked consent at submit → fail-closed, no ConversionEvent
├── idempotency.test.ts              -- duplicate submit_idempotency_key → 200 with cached result, no duplicate emit
test/vitest/conversion/ingest/
└── ingest-retrofit.test.ts          -- surface_id present in ingest payload → emit() called; absent → no emit
```

### 224-03: Block Renderer + Form Renderer + ISR

```text
test/vitest/conversion/blocks/
├── schema-validators.test.ts        -- all 15 block types: valid/invalid inputs; custom_html admin-only check
├── pricing-binding-resolution.test.ts -- {{pricing.*}} resolved vs unresolved → 503 path
├── evidence-binding-resolution.test.ts -- {{evidence.*}} resolved vs stale → fail-closed
└── content-classifier.test.ts       -- currency patterns + claim shapes detected; extends P223 classifier
test/vitest/conversion/render/
├── page-renderer-ssr.test.ts        -- all 15 block types render without throwing; RSC-safe
├── page-renderer-experiment.test.ts -- content_overrides applied when variant assigned
└── isr-cache-tag.test.ts            -- cacheTag called with correct scope on render; updateTag called on publish/rollback
test/vitest/conversion/forms/
├── form-renderer-ssr.test.ts        -- field types render; honeypot injected but not in fields[]
└── variables-schema-validation.test.ts -- server-side validation mirrors variables_schema
test/playwright/conversion/
└── page-render.spec.ts              -- public slug route loads; form renders + submits; BotID/rate-limit paths
test/chromatic/conversion/
└── ConversionWorkspace.stories.tsx  -- draft/publishing/published/archived states; gate blocking banner
```

### 224-04: LaunchBrief + Gates + Outcomes

```text
test/vitest/launches/gates/
├── pricing-evaluator.test.ts        -- pricing_context_id approved → passing; not approved → blocking; absent + placeholder text → passing
├── evidence-evaluator.test.ts       -- all claims evidence-linked + within TTL → passing; stale claim → blocking
├── readiness-evaluator.test.ts      -- all checks completed → passing; any pending → blocking with list
├── approval-evaluator.test.ts       -- approval_ref present + approver acted → passing; pending → blocking
└── gate-waiver.test.ts              -- tenant-admin waiver writes audit row; non-admin waiver denied
test/vitest/launches/surfaces/
├── surface-state-machine.test.ts    -- draft→blocked, blocked→approved, approved→published, published→archived
└── polymorphic-fk.test.ts           -- valid surface_target_id → success; orphan surface_target_id → 422
test/vitest/launches/outcomes/
└── outcome-compute.test.ts          -- T+7/T+14/T+30 periods; launch_id backfill in conversion_events; all 5 metrics
test/playwright/launches/
└── launch-gates.spec.ts             -- operator creates launch → pricing gate blocks → adds pricing context → gate passes
```

### 224-05: Experiments

```text
test/vitest/conversion/experiments/
├── sticky-hash.test.ts              -- same experiment_id + identity_ref always returns same variant (deterministic)
├── traffic-split.test.ts            -- 50/50 split distribution over 1000 identities within ±3% tolerance
├── assignment-immutability.test.ts  -- traffic_split change after active → 422; existing assignments unchanged
├── variant-capture.test.ts          -- ConversionEvent.experiment_variant_id populated on form submit with active experiment
└── control-group.test.ts            -- control variant served when no assignment exists for paused experiments
```

### 224-06: Runbook + Rollback + Cron

```text
test/vitest/launches/runbook/
├── executor-happy-path.test.ts       -- steps execute in order; each step writes audit row; state=executed on completion
├── executor-rollback.test.ts         -- rollback_steps execute in reverse; reversible steps reversed; non-reversible → operator task + continue
├── executor-idempotency.test.ts      -- same idempotency_key on retry → step skipped (not re-executed)
├── agentrun-bridge.test.ts           -- if markos_agent_runs absent → writes to markos_audit_log; agentrun_id null
└── rollback-partial.test.ts          -- rollback with non-reversible step → state='rolled_back', partial_rollback_blockers present
test/vitest/launches/cron/
├── surface-health-audit.test.ts      -- stale pricing_context_id detected → operator task created
├── gate-evaluation-poll.test.ts      -- in-flight launch → gates re-evaluated every 15 min
└── outcome-computation-cron.test.ts  -- T+7/T+14/T+30 trigger at correct offsets; backfill applied
test/vitest/launches/alerts/
└── bounce-spike.test.ts              -- >2σ conversion rate drop → operator task; BotID abuse spike → tenant-admin alert
```

### 224-07: API + MCP + UI + Closeout

```text
test/vitest/api/
├── conversion-pages-api.test.ts      -- GET/POST/PUT/DELETE; publish gate honors approval; archived page not served
├── public-form-submit-api.test.ts    -- unauthenticated POST; rate-limit; BotID; honeypot; idempotency
├── launches-briefs-api.test.ts       -- CRUD; status transitions; approval-aware mutations
├── launches-gates-api.test.ts        -- evaluate + waive; waiver audit row written
└── openapi-parity.test.ts            -- all 15 F-IDs present in openapi.json; x-markos-meta valid
test/vitest/mcp/
├── publish-page.tool.test.ts         -- approval check; cacheTag invalidation; audit row
├── submit-form.tool.test.ts          -- trusted caller bypass of BotID; emit() called
├── evaluate-launch-gates.tool.test.ts
├── execute-runbook.tool.test.ts
├── rollback-launch.tool.test.ts
└── get-launch-outcome.tool.test.ts
test/playwright/launches/
├── launch-cockpit.spec.ts            -- brief create → gate block → gate pass → surface publish → runbook execute → rollback
├── conversion-workspace.spec.ts      -- page create → block edit → form attach → publish → event visible
└── readiness-board.spec.ts          -- readiness checks display + complete flow
test/chromatic/launches/
└── LaunchCockpit.stories.tsx         -- planning/pending/ready/live/completed/rolled_back states; gate failure banners
test/chromatic/conversion/
└── PageEditor.stories.tsx            -- draft/editing/pending_approval/published/pricing-blocked states
```

### Cross-Slice: Legacy Regression

```text
test/vitest/regression/
├── p221-adapter.regression.test.ts   -- ConsentState adapter still works after P224 installs
├── p222-crm360.regression.test.ts    -- Customer360 lifecycle progression unaffected
├── p223-channels.regression.test.ts  -- P223 channel dispatch unaffected by P224 emit additions
└── existing-marketing-routes.regression.test.ts -- /signup, /integrations/claude, /docs routes unchanged
```

---

## Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (v1.x from Phase 204 baseline) |
| Config file | `vitest.config.ts` (Wave 0 gap if not yet present; Phase 204 established it) |
| Quick run command | `vitest run test/vitest/conversion/ test/vitest/launches/` |
| Full suite command | `vitest run && playwright test && chromatic` |
| Public contract validation | `node bin/validate-flow-contracts.cjs` (F-132..F-146) |

### Per-Slice Validation Table

| Slice | Vitest Suite | Playwright | Chromatic | Sampling Command |
|-------|-------------|------------|-----------|-----------------|
| 224-01 (Schema) | `test/vitest/conversion/schema/` + `test/vitest/conversion/rls/` | — | — | `vitest run test/vitest/conversion/schema/ test/vitest/conversion/rls/` |
| 224-02 (Fan-out) | `test/vitest/conversion/events/` + ingest retrofit | Public form submit smoke | — | `vitest run test/vitest/conversion/events/` |
| 224-03 (Renderer) | `test/vitest/conversion/blocks/` + `test/vitest/conversion/render/` | page-render.spec.ts | ConversionWorkspace.stories | `vitest run test/vitest/conversion/blocks/` |
| 224-04 (Launch gates) | `test/vitest/launches/gates/` + surfaces + outcomes | launch-gates.spec.ts | LaunchCockpit.stories | `vitest run test/vitest/launches/gates/` |
| 224-05 (Experiments) | `test/vitest/conversion/experiments/` | — | — | `vitest run test/vitest/conversion/experiments/` |
| 224-06 (Runbook) | `test/vitest/launches/runbook/` + cron + alerts | launch-cockpit.spec.ts | — | `vitest run test/vitest/launches/runbook/` |
| 224-07 (API+MCP+UI) | `test/vitest/api/` + `test/vitest/mcp/` | All Playwright suites | All Chromatic suites | `vitest run && playwright test && chromatic` |

### Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS cross-tenant denial | 100% of 13 new tables | D-51; security non-negotiable |
| Block schema validators | 100% per block type (15 types × valid/invalid) | D-02; write-time validation is the only defense |
| Gate evaluators | 100% per kind × per status × waiver path | D-16..D-18; gate is the pricing safety enforcement |
| Fan-out emit() 7 sinks | 100% paths (success + each sink failure → full rollback) | D-33/D-34; data integrity |
| Experiment hash determinism | Deterministic across 10k identity_ref inputs | D-23; sticky assignment guarantee |
| ISR cacheTag invalidation | updateTag called on every publish + rollback | D-30; stale cache = liability |
| Public form submit security | BotID/rate-limit/honeypot/consent all independently testable | D-25..D-28; each defense independently verifiable |
| Runbook rollback | Reversible steps reversed; non-reversible → operator task + continue | D-35..D-38 |
| Legacy regression | P221/P222/P223 test suites green | Additive phase; must not break upstream |
| API contract parity | All 15 F-IDs in openapi.json with valid x-markos-meta | QA-01 |

### Fixture Catalog

```text
test/fixtures/conversion/
├── conversion-page.fixture.ts        -- draft, published, archived, pricing-blocked variants
├── conversion-form.fixture.ts        -- trial_signup, demo_request; identity_stitch_enabled true/false
├── conversion-cta.fixture.ts         -- button, modal variants
├── conversion-event.fixture.ts       -- page view, form submit, CTA click; with + without launch_id
test/fixtures/launches/
├── launch-brief.fixture.ts           -- feature, pricing, integration launch types; planning/ready/live/rolled_back
├── launch-surface.fixture.ts         -- email_campaign, landing_page, messaging_thread targets
├── launch-gate.fixture.ts            -- per-kind (pricing/evidence/readiness/approval); pending/passing/blocking/waived
├── launch-runbook.fixture.ts         -- armed runbook with 3 steps; 1 non-reversible step for rollback tests
└── launch-outcome.fixture.ts         -- T+7/T+14/T+30 computed outcomes
test/fixtures/experiments/
├── conversion-experiment.fixture.ts  -- draft, active with 50/50 split; 80/20 split
└── experiment-variant.fixture.ts     -- control + treatment variants; content_overrides sample
```

### Acceptance Criteria Tie-In

For each slice, acceptance criteria are considered met when:
1. All Vitest tests in the slice's directory pass with no skips.
2. Playwright operator journeys for the slice complete without assertion failure.
3. Chromatic baseline updated (no unexpected visual diffs accepted).
4. `validate-flow-contracts.cjs` returns 0 errors for F-IDs touched in the slice.
5. `markos doctor` returns 0 critical failures (carried from Phase 204 QA gate).

### Per Wave Validation Protocol

- **Per task commit:** `vitest run [touched test dir]` — must be green before commit.
- **Per wave merge:** `vitest run && playwright test --grep [wave_tag]` — full wave tests green.
- **Phase gate:** Full suite green (`vitest run && playwright test && chromatic`) before `/gsd-verify-work`.

---

## Requirement Mapping

| Req ID | Slice(s) | Notes |
|--------|----------|-------|
| CNV-01 | 224-01, 224-03, 224-05 | Block-based pages, dynamic forms, CTAs, experiment assignment — all native in P224 |
| CNV-02 | 224-02 | Single fan-out emit() with all 7 sinks; fail-closed transaction |
| CNV-03 | 224-01 (schema), 224-03 (runtime check), 224-04 (LaunchGate pricing) | Belt-and-suspenders: pre-publish gate + runtime resolver |
| CNV-04 | 224-07 | API contracts F-132..F-146; RLS on 13 tables; audit trail; Playwright journeys |
| CNV-05 | 224-01, 224-05 | ConversionExperiment native SOR; LaunchSurface polymorphic ref (no parallel SOR) |
| LCH-01 | 224-01, 224-04, 224-06 | launch_briefs + gates + runbooks + readiness_checks + rollback posture |
| LCH-02 | 224-04 | LaunchSurface polymorphic ref covers email_campaign, messaging_*, landing_page, social_pack, partner_pack, support_pack, docs_update |
| LCH-03 | 224-01, 224-04 | launch_briefs shape (audiences, assets, pricing_context_id, evidence_pack_id, success metrics via T+7/T+14/T+30) |
| LCH-04 | 224-06 (cron), 224-04 (outcomes) | T+7/T+14/T+30 LaunchOutcome; audit log D-49; bounce/spike alerts D-50 |
| LCH-05 | 224-04 (gates), 224-06 (runbook+audit) | LaunchGate evaluators block before publish; D-20 approval-package; audit on every step |
| PRC-01..09 | carry via P205 | No new Pricing Engine schema in P224. LaunchGate(kind='pricing') + runtime renderer enforce P205 context |
| CDP-01..05 | carry via P221 | ConsentState double-gate (D-28), AudienceSnapshot consumption (page.audience_id), cdp_events dual-write (D-10) |
| CRM-01..05 | carry via P222 | Customer360 lifecycle progression (D-33 sink 6), NBA recompute (sink 7), crm_activity writeback (sink 3) |
| EML-01..05 | carry via P223 | LaunchSurface(email_campaign) coordinates P223 EmailCampaign; P224 does not reimplement send logic |
| MSG-01..05 | carry via P223 | LaunchSurface(messaging_thread + messaging_flow) coordinates P223 MessagingThread + LifecycleJourney |
| QA-01 | 224-07 | 15 new F-IDs (F-132..F-146) + flow-registry.json update |
| QA-02 | 224-01 (RLS scaffolds), 224-07 (hardening) | RLS on 13 tables; audit_log hash-chain for 13 new write paths; public endpoint ACL |
| QA-03..15 | 224-07 | Vitest full suite + Playwright operator journeys + Chromatic workspace states |

---

## Scope Guardrails (Deferred — Do Not Leak Into Plans)

The following items appeared during research or are explicitly deferred in CONTEXT.md. Plans must not include tasks for any of these:

| Item | Deferred To |
|------|-------------|
| Visual drag-and-drop page builder | P226 v2 or later; v1 = JSON editing |
| Statistical winner detection, ICE scoring, decision rules | P225 (experiment_assignments + conversion_events are the SOR P225 reads) |
| A/B/n multivariate beyond traffic_split | P225 |
| ML-driven personalization, edge geographic routing | P225 + defer |
| Semantic attribution, journey intelligence, narrative AI | P225 |
| Sales enablement battlecards/proof-packs | P226 |
| Ecosystem/partner/affiliate launch content | P227 |
| Multi-region launch coordination | P228 |
| Webhook-based form integrations (Zapier, Make) | Plugin marketplace post-P227 |
| Multi-step progressive profiling form chains | v2 |
| Native chatbot/live-chat conversion surface | P226 or later |
| Rich media interactive blocks (carousel, accordion, tabs) | v2 block schema extension |
| Cross-tenant launch templates | P218/P227 |
| Auto-detected launch readiness via connector health | P226 |
| Full launch retrospective narrative auto-generation | P225 |
| Email broadcast send execution | P223 (LaunchSurface coordinates, P223 sends) |
| ConversionEvent decision_rule winner detection | P225 |
| activation_lift metric (null in v1) | P218 PLG metrics |
| narrative_summary full intelligence | P225 |

**Surface type shells shipped in P224 (coordinator only, content in later phase):**
- `social_pack` — shell LaunchSurface type registered; social content/execution deferred
- `support_pack` — shell type registered; support content deferred
- `docs_update` — shell type registered; docs execution deferred
- `sales_enablement` — shell type registered; P226 ships content
- `partner_pack` — shell type registered; P227 ships content

---

## UI Compatibility Note

P224 adds two new operator workspaces (ConversionWorkspace + LaunchCockpit) within the existing single-shell (P208 rule). Implementation conventions:

- Component location: `components/markos/conversion/` + `components/markos/launches/` (mirrors `components/markos/crm/` from P222)
- CSS: CSS modules following P102/P103/P105/P222/P223 conventions (no global styles, no Tailwind unless established by prior phase)
- JSON editors (PageEditor, FormEditor, RunbookEditor): mirror P223 TemplateEditor pattern — a `<textarea>` with JSON validation on blur + a preview pane that calls the renderer
- Kanban view for ConversionWorkspace (pages by status) and LaunchCockpit (briefs by status): reuse `kanban-view.tsx` from P102 D-02; provide a ConversionPage kanban config
- No UI-SPEC required for P224 (matches P222/P223 disposition per DISCUSS.md)
- Approval Inbox entry types: extend existing P208 Approval Inbox data model with `page_publish`, `form_publish`, `launch_arm`, `launch_execute`, `gate_waiver`, `rollback` entry types (additive — no inbox schema migration needed if entry_type is a free-form column)
- Morning Brief: extend P208 Morning Brief data query to include `top-3 launches IN (ready, live)` + `blocking gates per launch` + `ConversionEvent volume last 24h`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ISR `revalidate: number` (time-based only) | `cacheTag` + `updateTag` (tag-based, granular) | Next.js 13.5+ / Vercel knowledge update | Publish/rollback can invalidate exactly one page without busting all tenant pages |
| Custom experiment assignment tables | Native `experiment_assignments` with deterministic hash | P224 new | No third-party A/B tool required; P225 reads from SOR |
| Manual launch checklists in Linear | First-class `LaunchRunbook` + `LaunchReadinessCheck` objects | P224 new | Programmatic gate evaluation + reverse-runbook rollback |
| Separate form embed tools (Typeform, HubSpot forms) | Native `ConversionForm` + `FormRenderer` | P224 new | Form submits write directly to identity + CRM + CDP; no integration tax |

**Deprecated/outdated:**
- CRM-only event model (`crm_activity` as SOR): P221 introduced `cdp_events` as canonical event SOR; P224 reinforces the dual-write pattern. `crm_activity` remains as high-signal projection.
- Hand-rolled public signup page as the only conversion surface: P224 ships `ConversionPage` as the governed substrate. `/signup` can migrate incrementally via `migrated_to_conversion_page=true` flag.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P223 last F-ID = F-131 (10 contracts allocated F-122..F-131) | F-ID Allocation | P224 would conflict; planner must re-verify at Wave 0 |
| A2 | P223 last migration = 120 (`120_channel_indexes_rls_hardening.sql`) | Migration Allocation | P224 migrations 121+ would conflict; planner must re-verify at Wave 0 |
| A3 | `lib/markos/cdp/adapters/crm-projection.ts` exists (P221 delivered) | Integration Contracts | emit() ConsentState double-gate cannot proceed; P221 must ship first |
| A4 | `lib/markos/crm360/*` exists (P222 delivered) | Integration Contracts | Customer360 lifecycle progression (D-33 sink 6) cannot proceed; P222 must ship first |
| A5 | `lib/markos/channels/*` exists (P223 delivered) | Integration Contracts | LaunchSurface polymorphic targets for email_campaign/messaging_thread cannot be validated; P223 must ship first |
| A6 | `markos_agent_runs` table exists (P207 delivered) | LaunchRunbook | Runbook executor uses AgentRun; if absent, bridge stub via config flag `workflow.agentrun_v2_available` (D-37 carry from P221 D-15) |
| A7 | Pricing Engine `PricingRecommendation` records exist (P205 delivered) | LaunchGate pricing | If P205 not executed, gate stubs to "warning + audit" instead of blocking (A13) |
| A8 | Vitest + Playwright test infrastructure from Phase 204 is in place | Validation Architecture | If not, Wave 0 must install both |
| A9 | `markos_audit_log` hash chain table exists (P201 delivered) | Security | All mutation audit writes depend on this; P201 is verified complete |
| A10 | Vercel BotID is available for the deployment tier | Public Surface Delivery | If not available, the public form submit endpoint must use an alternative bot detection or the feature is descoped |
| A11 | Next.js 16 `cacheTag`/`updateTag` API is stable in the project's Next.js version | ISR Invalidation | If on older Next.js, ISR invalidation requires `revalidatePath()` instead — less granular but functional |
| A12 | No migrations were added between P223's 120 and P224's execution start | Migration Allocation | Planner must run `SELECT max(migration_number) FROM markos_migrations` at Wave 0 to confirm |
| A13 (NEW) | Pricing Engine PricingRecommendation record from P205 is required for LaunchGate(kind='pricing') full blocking behavior | LaunchGate | If P205 not executed, gate must stub to "warning + audit" posture rather than blocking; plans should include the stub path |
| A14 (NEW) | Vercel BotID available + tenant-tier eligible | Public Surface Delivery | Carried from P201 pattern; if BotID unavailable, rate-limit + honeypot remain as the only bot defenses |
| A15 (NEW) | Vercel Edge Config OR Redis available for rate-limit counters per ConversionForm | Public Form Rate-Limit | If neither is available, rate-limit falls back to Postgres rolling window on a `form_submit_counters` table (same approach as P223 D-19 fallback) |
| A16 (NEW) | Next.js 16 `cacheTag`/`updateTag` API is stable and available (per Vercel knowledge update cited in CONTEXT.md D-30) | ISR Invalidation | Stable per Vercel documentation; plan tasks should verify Next.js version in package.json at Wave 0 |
| A17 (NEW) | `xxhash-wasm` or `xxhash3` npm package is available for sticky-hash variant assignment | Experiment Assignment | Fallback: SHA-256 truncated (Node.js built-in `crypto`) — no external dependency; planner should default to SHA-256 unless performance testing shows need for xxhash3 |

---

## Open Questions

1. **Exact Next.js version in package.json**
   - What we know: CONTEXT.md D-30 cites Vercel knowledge update for cacheTag/updateTag
   - What's unclear: Whether the project's current Next.js version supports the API (Next.js 13.5+)
   - Recommendation: Wave 0 task — read `package.json` to confirm Next.js version; if < 13.5, use `revalidatePath()` as fallback

2. **`social_pack` / `support_pack` / `docs_update` surface shell scope**
   - What we know: D-14 registers these surface_target_kind values; content deferred to later phases
   - What's unclear: Whether Wave 1 should create stub target tables or only the enum value in the CHECK constraint
   - Recommendation: Wave 1 registers the CHECK constraint enum values only; no stub tables needed until content phases (P226/P227)

3. **LaunchOutcome `influenced_revenue` first-touch attribution precision**
   - What we know: D-40 specifies first-touch v1; P225 refines
   - What's unclear: How to attribute influenced_revenue when an Opportunity is linked to multiple ConversionEvents across multiple launches
   - Recommendation: v1 rule = 100% credit to the launch_id on the first ConversionEvent that created the Opportunity row (identified by opportunity.launch_id FK); planner codifies this rule in the compute.ts implementation note

4. **Public form submit endpoint URL prefix (`/api/v1/conversion/` vs `/api/v1/public/conversion/`)**
   - What we know: D-52 specifies this is the ONLY unauthenticated POST route
   - What's unclear: Whether the `/public/` prefix is required for middleware scoping (P201 BYOD pattern)
   - Recommendation: Use `/api/v1/public/conversion/forms/{id}/submit` — explicit prefix makes middleware `matcher` patterns unambiguous and consistent with P201 public surface routing

---

## Environment Availability

Step 2.6: No new external dependencies beyond what P221/P222/P223 already require. P224 is code/schema additive.

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Supabase + PostgreSQL | All 13 migrations | ✓ (existing) | — |
| Next.js 16+ | ISR cacheTag/updateTag D-30 | Verify at Wave 0 (package.json) | revalidatePath() if < 13.5 |
| Vercel BotID | Public form D-25 | Assumed ✓ (A14) | Rate-limit + honeypot only (reduced posture) |
| Vercel Edge Config / Redis | Rate-limit counters D-26 | Assumed ✓ (A15) | Postgres rolling window fallback |
| xxhash3 / xxhash-wasm npm | Sticky hash D-23 | Assumed ✓ (A17) | SHA-256 truncated (Node.js crypto — no dep) |
| P221 CDP adapter | ConsentState double-gate D-28 | Required before 224-02 | None — P221 must ship first |
| P222 CRM360 | Customer360 update D-33 | Required before 224-02 | None — P222 must ship first |
| P223 channels | LaunchSurface targets D-14 | Required before 224-04 | None — P223 must ship first |
| P207 AgentRun | Runbook execution D-37 | Bridge stub available | Config flag `workflow.agentrun_v2_available` |
| P205 PricingRecommendation | LaunchGate pricing D-16 | Warning+audit stub | A13 fallback posture |

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (operator routes) | P201 session + Supabase JWT; public form endpoint explicitly unauthenticated |
| V3 Session Management | Yes | P201 30-day rolling session |
| V4 Access Control | Yes — critical | RLS on all 13 tables (D-51); tenant context from JWT; fail-closed on missing context (P100 D-09) |
| V5 Input Validation | Yes | Zod block validators (write-time); variables_schema (server-side form validation); no raw user input in pricing/evidence bindings (D-54) |
| V6 Cryptography | Partial | Audit log hash chain (P201); no new crypto beyond existing |

### Known Threat Patterns for Phase 224 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant ConversionPage read via guessed UUID | Information Disclosure | RLS on conversion_pages with tenant_id = current_setting('app.tenant_id') |
| Pricing claim injection via block body static text | Tampering | ContentClassifier scans block bodies for currency patterns + claim shapes (D-19) |
| Form spam flood bypassing BotID | Denial of Service | Rate-limit fail-closed (D-26); honeypot (D-27); BotID outage → fail-closed (A14 posture) |
| Experiment assignment manipulation (forcing control group) | Tampering | Deterministic hash — identity_ref cannot be chosen to force a specific bucket without knowing the hash function seed |
| Gate waiver without audit (silent admin privilege) | Elevation of Privilege | Waiver requires waiver_reason + explicit markos_audit_log write (D-18) |
| Runbook step injection (malicious step JSON) | Tampering | steps[] JSONB validated at write time; step.kind must be in enum; target_ref validated as own-tenant object |
| ISR cache poisoning (stale published→archived page served) | Spoofing | updateTag() called synchronously on publish + rollback before 200 response (Pitfall 3) |
| Duplicate form submit creating phantom leads | Spoofing | submit_idempotency_key dedup (Pitfall 7) |
| Cross-tenant LaunchSurface targeting another tenant's email campaign | Information Disclosure | Polymorphic FK read-after-write check validates surface_target_id belongs to same tenant_id (Pitfall 4) |

---

## Code Examples

### Verified Patterns from Existing Code

#### Block-Based Composition (adapted from P223 channel_templates pattern)

```typescript
// Source: 224-CONTEXT.md D-02; P223 D-25 TemplateEditor precedent
// content_blocks structure — each block has block_type + per-type fields
const exampleContentBlocks: Block[] = [
  { block_type: 'hero', heading: 'Ship faster with MarkOS', cta_label: 'Start free trial', cta_href: '/signup' },
  { block_type: 'pricing', pricing_binding: '{{pricing.plan_starter.price}}', show_comparison: true },
  { block_type: 'form', form_id: 'uuid-trial-signup-form', layout: 'inline' },
  { block_type: 'evidence_block', evidence_binding: '{{evidence.customer_growth_rate}}', display: 'stat' },
];
```

#### Existing Signup BotID Pattern (carry-forward base for D-25)

```typescript
// Source: [VERIFIED: 224-CONTEXT.md code_context — app/(marketing)/signup/page.tsx]
// BotID gate pattern from P201 (D-25 reuses this)
// The public form submit handler adapts this pattern from the signup page
```

#### MCP Pipeline Gate (existing — all conversion + launch writes flow through)

```typescript
// Source: [VERIFIED: lib/markos/mcp/pipeline.cjs — 224-CONTEXT.md code_context]
// 10-step middleware: auth → rate_limit → tool_lookup → validate_input → free_tier
//                    → approval → cost → invoke → validate_output → trueup
// All new conversion + launch MCP tools register through this pipeline
```

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: 224-CONTEXT.md] — 56 locked decisions (D-01..D-56); canonical for all architecture choices
- [VERIFIED: 223-RESEARCH.md] — P223 F-131 / migration 120 baseline confirmed
- [VERIFIED: obsidian/reference/Contracts Registry.md] — F-ID naming conventions + allocation pattern
- [VERIFIED: obsidian/reference/Database Schema.md] — migration numbering + RLS invariants
- [VERIFIED: V4.0.0-TESTING-ENVIRONMENT-PLAN.md] — Vitest + Playwright + Chromatic doctrine
- [VERIFIED: V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md] — test obligation format
- [VERIFIED: 221-CONTEXT.md] — CDP adapter contracts (D-08, D-18, D-20) consumed by P224
- [VERIFIED: 222-CONTEXT.md] — CRM360 contracts (D-29 fan-out, Customer360 lifecycle) consumed by P224
- [VERIFIED: 223-CONTEXT.md] — Channel contracts (D-29 fan-out pattern, LaunchSurface targets) referenced by P224

### Secondary (MEDIUM confidence)
- [CITED: obsidian/work/incoming/23-CONVERSION-ENGINE.md] — informational only; canonical = obsidian/reference/* once distilled; 7 core rules + ConversionPage/Form/CTA shapes confirmed match D-01..D-07
- [CITED: obsidian/work/incoming/26-LAUNCH-ENGINE.md] — informational only; LaunchBrief/LaunchSurface/LaunchOutcome shapes confirmed match D-12..D-15 + D-39..D-41

### Tertiary (LOW confidence — flagged in Assumptions Log)
- [ASSUMED: A11/A16] — Next.js 16 cacheTag/updateTag API stability; CONTEXT.md cites Vercel knowledge update but version not verified against package.json
- [ASSUMED: A17] — xxhash3 npm package availability; SHA-256 fallback removes this dependency risk

---

## Metadata

**Confidence breakdown:**
- F-ID + migration allocation: HIGH — directly computed from P223-RESEARCH.md verified baseline
- Schema sketches: HIGH — derived from locked decisions D-01..D-15 + P221/P222/P223 FK patterns
- Slice boundaries: HIGH — derived from locked decisions + P222/P223 wave structure precedent
- Integration contracts: HIGH — verified against prior phase CONTEXT.md decisions
- Public surface delivery: MEDIUM-HIGH — CONTEXT.md cites Vercel knowledge update; Next.js version unverified
- Pitfalls: HIGH — derived from locked decisions + cross-phase pattern analysis
- Test inventory: HIGH — derived from locked decisions + Testing Environment Plan doctrine
- Validation Architecture: HIGH — follows V4.0.0-TESTING-ENVIRONMENT-PLAN.md exactly

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable architecture; re-check Next.js version + xxhash3 availability at Wave 0)

---

## RESEARCH COMPLETE


---

## Migration Application Order (Wave-Driven)

**CRITICAL:** Migration numbers 121-133 are allocated by plan ordering, NOT by execution wave. Because P224 plans run in parallel within waves, the migration runner MUST apply migrations in **wave-execution order**, not numeric order:

| Wave | Plans | Migrations (apply in this order within wave) |
|------|-------|----------------------------------------------|
| 1    | plan 01           | 121, 122, 123, 124, 125, 126                |
| 2    | plan 02           | 130 (intentional gap — dispatch infrastructure shipped early) |
| 3    | plan 04, plan 05  | 127, 129 (plan 04), 131 (plan 05)           |
| 4    | plan 06           | 128, 132                                     |
| 5    | plan 07           | 133                                          |

A naive `ls supabase/migrations | sort -V` would apply 127 (plan 04) BEFORE 130 (plan 02), which breaks the dependency: plan 02 ships `emit_conversion_event_tx` Postgres function + `compensate_conversion_event_tx` (D-34 fail-closed), and gate evaluators in plan 04 expect the audit infrastructure already in place.

Plan 07 includes `test/migrations/order.test.ts` which asserts the runner enforces this order. Plan 01 Task 2 action body documents this rule for executors.

This convention is intentional and is preserved for the lifetime of P224 to avoid a 2-3 hour renumber-and-cross-reference exercise that would touch ~50 references across 7 plans.
