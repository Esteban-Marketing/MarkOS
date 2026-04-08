# Phase 58: CRM Canonical Schema and Identity Graph - Research

**Researched:** 2026-04-04
**Domain:** CRM data model, identity graph, activity ledger, tenant-safe APIs, timeline architecture
**Confidence:** HIGH (core recommendations derived directly from existing MarkOS tenancy, agent, billing, and telemetry contracts already present in the repo)

## Summary

Phase 58 should be implemented as a **tenant-safe CRM core plus append-only activity ledger**, not as a set of UI-first screens or a thin wrapper over PostHog events. The repo already contains the substrate needed to do this correctly: tenant partitioning and RLS in `supabase/migrations/51_multi_tenant_foundation.sql`, append-only audit and lineage patterns from Phases 53 and 54, and product analytics through PostHog that are explicitly treated as non-canonical for billing truth in `54-RESEARCH.md`.

The highest-leverage decision for Phase 58 is to make **CRM entities canonical and timelines composable**:

1. Contacts, companies, deals, accounts, customers, activities, tasks, notes, and merge lineage need first-class tables and APIs.
2. PostHog events, outbound events, operator events, and agent events should feed an activity ingestion layer, not directly define relationship state.
3. Timeline rendering should read from a MarkOS-owned activity model with stable event families and source references.
4. Identity stitching must target a CRM identity graph that exists before Phase 59 starts pushing proxy-tracked behavior into it.

The strongest implementation path is to extend the existing tenant-safe Postgres model with a new CRM domain package under `lib/markos/` and a new migration family under `supabase/migrations/`, preserving the existing approval, audit, and policy semantics from Phases 51 through 57.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- CRM records, not analytics events, are the source of truth for relationship state.
- Phase 58 must establish contacts, companies, deals, accounts, customers, activities, tasks, and timelines as first-class primitives.
- Tenant safety and IAM guarantees from Phases 51 through 57 remain non-negotiable.
- Unified timelines are first-class CRM constructs, not reporting-only projections.
- Identity graph foundations belong in Phase 58 even though tracking implementation follows in Phase 59.
- PostHog remains the behavioral analytics engine, not the CRM or billing ledger.
- Required future pipelines include lead qualification, opportunity or deal, account management, and customer success.
- Native outbound for this milestone is restricted to Resend email, Twilio SMS, and Twilio WhatsApp.
- AI-originated or externally visible actions must remain approval-aware and audit-complete.
- Custom fields and merge lineage are mandatory in the canonical schema.

### Phase 58 Discretion Areas
- Exact table names and service boundaries.
- Whether accounts and customers are separate tables or derived relationship states.
- Exact custom-field storage shape, as long as it remains tenant-safe and extensible.
- API decomposition across CRUD, merge, timeline, and search surfaces.

### Out of Scope for This Phase
- Social publishing and inbox execution.
- Full MMM or probabilistic attribution engine work.
- Broad UI redesign or visual language changes.
- Autonomous outbound execution without approval controls.

---

## Competitive Landscape

Phase 58 is not competing on “can we store a contact row.” It is competing on whether MarkOS can combine **CRM flexibility, auditability, and AI-operability** without inheriting the operational sprawl of legacy CRMs.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| Salesforce-style enterprise CRM | Deep object flexibility, relationship modeling, pipeline breadth | Canonical entities, custom fields, strict permission surfaces, object lineage | Excessive admin burden, opaque schema sprawl, over-customization before defaults |
| HubSpot-style timeline CRM | Strong unified record timeline and operator usability | Record-centric timelines, practical lifecycle views, contact-company-deal linkage | Mixing operational truth with convenience-only derived state in hidden places |
| Attio-style flexible data graph | Modern object graph, flexible records, event-rich context | Treat CRM as a relationship graph with first-class activity context | Schema ambiguity that becomes hard to govern across tenants |
| Close/Pipedrive-style sales execution | Fast operator workflows, pipeline focus, next-step urgency | Stage-centric execution, action queues, task-first workflows | Over-optimizing for one sales motion and under-modeling account or customer-success states |
| CDP/event-stream-first products | Strong event ingestion and identity stitching | Event ingestion patterns and identity resolution seams for Phase 59 | Treating raw event streams as the final CRM truth model |

### Codebase-reality comparison

The existing MarkOS app already has placeholders for `company`, `icps`, `segments`, and `campaigns`, and the current TypeScript contract model in `lib/markos/contracts/schema.ts` is still **workspace-centric and pre-CRM**. That means Phase 58 should not attempt a minimal patch. It should explicitly establish the next-generation contract boundary for CRM data while preserving backward compatibility where necessary.

### Strategic conclusion

MarkOS should position the CRM core as:

- **More governed than Attio**
- **Less operationally heavy than Salesforce**
- **More agent-native than HubSpot**
- **More lifecycle-complete than pipeline-only CRMs**

The winning design is a **canonical CRM graph + append-only activity ledger + approval-aware AI ops model**.

---

## Audience Intelligence

The real audience for Phase 58 is internal product and future operators, not external ad traffic. Their needs are operational and structural.

### Primary operator needs

1. One place to inspect relationship history without reconstructing it manually across analytics, tasks, notes, and campaigns.
2. Confidence that tenant boundaries, audit records, and approval controls remain intact as CRM scope expands.
3. A schema flexible enough for agencies and in-house teams without becoming an ungoverned custom-object swamp.
4. A path to next-best-action and AI-assisted workflows that is grounded in durable CRM records rather than ephemeral analytics events.

### Secondary implementation audience

1. Planner and executor agents that need a clear domain contract for later phases.
2. API and migration implementers who need deterministic naming, indexing, RLS, and lineage patterns.
3. Future UI implementers who need a stable record/detail/timeline model before building views.

### Audience implications for research

- The schema must optimize for **clarity and extension**, not novelty.
- Timeline design must optimize for **explainability**, not merely storage convenience.
- Merge and stitch flows must optimize for **reviewability**, not aggressive automation.
- Entity relationships must optimize for **agency and in-house parity** from the start.

---

## Channel Benchmarks

These are **planning heuristics**, not third-party benchmark exports. They represent strong acceptance bars for a modern SaaS CRM core and should be treated as design targets for later planning and verification.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Primary record detail fetch p95 | <=300ms heuristic for modern app CRUD surfaces | <=150ms |
| Unified timeline fetch p95 (record detail page) | <=500ms heuristic for event-rich CRM views | <=250ms |
| Stage mutation audit completeness | 100% expectation in governed B2B systems | 100% |
| Eligible anonymous-to-known stitch success | 70-85% heuristic depending on traffic quality and identity data | >=90% |
| Merge false-positive rate after review flow | <5% heuristic for safe CRM dedupe | <2% |
| Activity ingestion freshness | <=15 min heuristic for “near-real-time” ops surfaces | <=5 min |
| Required outbound event return-path completeness | >=95% heuristic for delivery/open/click state logging | >=99% |
| AI action audit completeness | 100% expectation in approval-governed enterprise systems | 100% |

### Benchmark interpretation

- Timeline performance matters because later phases depend on record detail as the operator cockpit.
- Merge accuracy matters because bad dedupe destroys trust in any CRM faster than missing automation.
- Audit completeness is a hard requirement, not a stretch target.

---

## Recommended Approach

### 1. Build a canonical CRM object layer

Recommended first-class entities:

- `markos_crm_contacts`
- `markos_crm_companies`
- `markos_crm_accounts`
- `markos_crm_customers`
- `markos_crm_deals`
- `markos_crm_tasks`
- `markos_crm_notes`
- `markos_crm_activities`
- `markos_crm_timeline_edges` or a timeline projection helper if needed
- `markos_crm_custom_field_definitions`
- `markos_crm_custom_field_values`
- `markos_crm_merge_decisions`
- `markos_crm_identity_links`

Every tenant-scoped row should include `tenant_id`, timestamps, actor metadata where applicable, and immutable lineage references when the row records a decision or event.

### 2. Separate canonical state from ingested evidence

Recommended split:

- **Canonical state tables:** contact, company, deal, account, customer, task, note
- **Evidence tables:** activity events, identity links, merge decisions, source references
- **Derived read layer:** timeline queries and projections

This preserves the critical distinction already established in billing research: the event stream is input evidence, not final truth.

### 3. Define identity graph before stitching logic

Phase 58 should define:

- anonymous identity node shape
- known contact identity node shape
- account or company linkage model
- confidence-scored identity link model
- merge review lineage model

Phase 59 can then ingest proxy-tracked behavior and attach it to these constructs rather than inventing semantics on the fly.

### 4. Prefer additive backward-compatible migration strategy

The current contract layer still exposes `workspaceId` and current tables like `markos_company` are already tenantized but not CRM-complete. The safer path is:

1. Add CRM tables and APIs additively.
2. Keep compatibility reads for existing non-CRM surfaces where necessary.
3. Introduce adapters or projections where existing pages need legacy data shapes.
4. Do not mutate old tables into overloaded CRM tables unless the migration and compatibility story is explicit.

### 5. Reuse proven MarkOS patterns

Phase 58 should explicitly inherit:

- RLS and tenant membership patterns from Phase 51
- immutable approval and event patterns from Phase 53
- ledger-vs-analytics truth separation from Phase 54
- observability expectations from Phase 57

### 6. Keep outbound and AI dependencies visible but deferred

The repo does not currently include Resend or Twilio dependencies in `package.json`. That is correct for Phase 58. The research implication is that schema and activity models must leave room for:

- email delivery and engagement events
- SMS and WhatsApp delivery lifecycle events
- agent-created draft, task, and recommendation events

without forcing those integrations into this phase.

---

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **Tenant partitioning already exists.** `51_multi_tenant_foundation.sql` establishes `tenant_id` as the canonical partition key and applies RLS to major existing tables.
2. **Agent audit and immutability patterns already exist.** Phase 53 research and implementation direction already assume append-only event and approval models.
3. **Billing research already established the truth boundary.** `54-RESEARCH.md` is explicit that PostHog is for analytics, not invoice-grade truth; the same principle should govern CRM truth.
4. **Control-plane UI scaffold already exists.** Current app routes and Storybook patterns can be extended rather than replaced.

### Current constraints and gaps

1. **Current TS entity contracts are pre-CRM.** `lib/markos/contracts/schema.ts` models `company`, `mir`, `msp`, `icp`, `segment`, and `campaign`, but no contact, deal, activity, timeline, or account graph exists yet.
2. **Current company UI is placeholder-grade.** `app/(markos)/company/page.tsx` simply renders schema JSON, so Phase 58 should not assume mature CRUD UI already exists.
3. **Outbound dependencies are not yet installed.** Resend and Twilio execution must remain a later-phase concern.
4. **Project-level milestone docs lag slightly.** `.planning/PROJECT.md` still describes v3.2.0 as the active milestone, so planning consumers should treat `.planning/STATE.md`, `.planning/ROADMAP.md`, and Phase 58 artifacts as the current source of truth.

### Architectural implication

Phase 58 should be primarily a **data model + contract + migration + validation** phase. UI and execution surfaces depend on it; they should not drive it.

---

## Tracking Requirements

Phase 58 does not implement full Phase 59 proxy tracking, but it must define the target schema and event families that Phase 59 will populate.

### Required activity families

- `web.page_viewed`
- `web.element_interacted`
- `web.form_started`
- `web.form_submitted`
- `campaign.touch_recorded`
- `crm.stage_changed`
- `crm.task_created`
- `crm.task_completed`
- `crm.note_added`
- `crm.record_merged`
- `identity.stitch_created`
- `identity.stitch_rejected`
- `agent.summary_generated`
- `agent.recommendation_generated`
- `agent.draft_created`
- `outbound.email_sent`
- `outbound.email_delivered`
- `outbound.sms_sent`
- `outbound.whatsapp_sent`
- `attribution.touch_updated`

### Required canonical activity fields

- `tenant_id`
- `activity_id`
- `activity_family`
- `activity_source`
- `occurred_at`
- `ingested_at`
- `actor_type` (`human`, `agent`, `system`, `visitor`)
- `actor_id` when known
- `contact_id` when known
- `company_id` when known
- `account_id` when known
- `deal_id` when known
- `anonymous_identity_id` when applicable
- `source_event_ref`
- `source_system` (`posthog`, `markos`, `resend`, `twilio`, etc.)
- `attribution_context` or reference to attribution linkage
- `payload_json`

### Identity and attribution requirements to preserve

1. Anonymous activity must be storable before contact creation.
2. Contact conversion must be able to attach prior anonymous activity with lineage and confidence.
3. Attribution updates must be timeline-visible and queryable by contact, deal, and campaign.
4. Tracking subdomain and proxy-routed ingestion should preserve campaign metadata as stable CRM-readable properties.

### Phase 58 deliverable implication

The research recommendation is to define these as **MarkOS CRM activity contracts** first, then map PostHog and later channel integrations into them.

---

## Risks and Pitfalls

### Pitfall 1: Treating PostHog as the CRM ledger

**What goes wrong:** Relationship state, stage movement, and operator actions become dependent on analytics delivery semantics rather than canonical application state.

**Avoid by:** Using PostHog as behavioral evidence only; persist CRM activity and state in MarkOS-owned tables.

### Pitfall 2: Modeling only lead and deal objects

**What goes wrong:** The milestone drifts into sales-only CRM and blocks account management and customer-success flows later.

**Avoid by:** Including account and customer lifecycle constructs in the Phase 58 schema boundary even if the Phase 61 UI surfaces come later.

### Pitfall 3: Overloading legacy `company` structures

**What goes wrong:** Existing company profile surfaces become an accidental catch-all for CRM state.

**Avoid by:** Introducing explicit CRM tables and compatibility adapters instead of stretching current entity contracts beyond recognition.

### Pitfall 4: Making dedupe fully automatic

**What goes wrong:** False merges destroy operator trust and contaminate timelines, attribution, and reporting.

**Avoid by:** Persisting merge candidates, confidence, reviewer actions, and immutable merge lineage.

### Pitfall 5: Custom fields without governance

**What goes wrong:** The schema becomes flexible but unreadable; later pipeline and reporting work becomes brittle.

**Avoid by:** Separating custom-field definitions from values, versioning them, and requiring object-family scoping.

### Pitfall 6: UI-first schema design

**What goes wrong:** Record screens define data shape prematurely and create hidden coupling before tracking and identity flows are understood.

**Avoid by:** Locking the data model and event model first, then planning UI surfaces against that contract.

### Pitfall 7: Ignoring milestone-document drift

**What goes wrong:** Future agents may read `.planning/PROJECT.md` and assume v3.2.0 is still the active milestone.

**Avoid by:** Treating `.planning/STATE.md`, `.planning/ROADMAP.md`, and the Phase 58 artifacts as authoritative until project docs are normalized.

---

## Validation Architecture

Phase 58 should be considered complete only when the following validation layers exist or are planned explicitly:

### 1. Migration and schema validation

- SQL migration tests prove tenant-safe creation and reads for all new CRM tables.
- RLS tests prove no contact, deal, account, activity, or merge data crosses tenant boundaries.
- Backward-compatible migration notes exist for any interaction with legacy tables.

### 2. Contract validation

- TypeScript schemas exist for CRM entities, activities, custom fields, merge decisions, and identity links.
- API contracts cover create, update, merge, timeline read, and search/index surfaces for Phase 58 deliverables.

### 3. Activity and timeline validation

- Fixture-driven tests prove timeline assembly for at least:
  - anonymous visitor activity
  - converted contact with stitched history
  - deal with stage changes and notes
  - account with tasks and attribution touches
- Timeline ordering, dedupe, and source references are deterministic.

### 4. Identity and merge validation

- Synthetic fixtures prove candidate match scoring, review flow, accepted merge lineage, and rejected merge lineage.
- Merge operations never delete history; they create immutable decision evidence.

### 5. Planning-readiness validation

- Phase 58 research output clearly identifies schema families, API seams, event families, and anti-patterns.
- Planner can decompose the phase into executable plans without re-opening core architectural questions.

### Recommended test families

- `test/crm-schema/**/*.test.js`
- `test/crm-api/**/*.test.js`
- `test/crm-timeline/**/*.test.js`
- `test/crm-identity/**/*.test.js`
- `test/tenant-auth/**/*.test.js` extensions for CRM tables

---

## Implementation Signals From Current Repo

1. `supabase/migrations/51_multi_tenant_foundation.sql` already establishes the correct tenant and RLS baseline.
2. `54-RESEARCH.md` already documents the key principle that analytics streams are not ledger truth.
3. `lib/markos/contracts/schema.ts` shows the current app contract layer is too narrow for CRM scope and should be expanded deliberately.
4. `app/(markos)/company/page.tsx` confirms current control-plane routes are still scaffold-level, which makes Phase 58 the right moment to lock domain contracts before richer UI implementation.
5. `package.json` confirms PostHog is present and Resend/Twilio are not yet installed, reinforcing the phase boundary between schema now and channel execution later.

## Primary Recommendation

Implement Phase 58 as a **CRM-core contract phase** with four concrete outputs:

1. canonical CRM schema and migration plan
2. identity graph and merge-lineage model
3. unified activity and timeline contract
4. tenant-safe API and validation architecture

That is the minimum stable foundation required before Phase 59 through 64 can execute without architectural churn.

## RESEARCH COMPLETE