# Phase 60: Pipeline Engine and Multi-View Workspace - Research

**Researched:** 2026-04-04
**Domain:** CRM pipeline engine, user-defined custom objects, editable multi-view workspace, and simple funnel reporting
**Confidence:** HIGH (recommendations are grounded in the shipped Phase 37 control-plane shell, the Phase 58 canonical CRM schema and activity ledger, the locked decisions in `60-CONTEXT.md`, and the current placeholder app-route surface)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Full user-defined custom objects are required in the first pass

Planning must treat custom objects as first-class workspace entities rather than a later extensibility idea.

Implementation guidance:
- Do not plan Phase 60 around deal-only boards with custom objects deferred.
- Keep custom-object configuration compatible with the Phase 58 governed custom-field model.
- Preserve tenant-safe reviewability when object definitions, relationships, and pipeline behavior are customized.

### 2. The first pass must support multiple real CRM pipeline families plus user-defined families

The workspace must support lead qualification, opportunity or deal, account management, customer success or renewal, and a custom user-defined pipeline family.

Implementation guidance:
- Do not assume one global sales pipeline.
- Treat pipeline family and object kind as explicit configuration axes.
- Keep stage semantics tenant-defined instead of product-hardcoded.

### 3. All six required views are mandatory in the first pass

The first pass must ship Kanban, table, record detail, timeline, calendar, and forecast or funnel.

Implementation guidance:
- Do not collapse the phase into a board-only release.
- Treat record detail and timeline as core inspection surfaces, not optional extras.
- Keep calendar and funnel honest: they may be narrower than later analytics work, but they must exist and be usable.

### 4. Workspace interactions are editable in the first pass

Phase 60 is not a read-only workspace.

Implementation guidance:
- Stage changes, field edits, note or task updates, and date changes must be supported where appropriate.
- Mutations must append CRM activity and respect Phase 51 IAM enforcement.
- Avoid silent or unaudited state changes.

### 5. Forecasting should stay simple in the first pass

The first pass should optimize for stage-count and value-funnel visibility rather than weighted forecasting or probability modeling.

Implementation guidance:
- Build an aggregation layer for count and value by stage.
- Do not expand into advanced forecasting math, scenario planning, or revops analytics suites.
- Keep the output directly explainable from canonical CRM records.

### 6. Scope guardrails remain strict

This phase must not expand into:
- full attribution or reporting systems
- opaque auto-automation or workflow builders
- AI playbooks or recommendation systems reserved for later phases
- destructive custom-object mutations without lineage
- a second shadow UI system outside the Phase 37 control-plane shell

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-03 | Pipelines, stages, and the primary CRM working views must be operator-usable inside MarkOS rather than externalized to another CRM. | Recommends a tenant-configurable pipeline and stage model, a dynamic workspace route structure, and six required views backed by the canonical Phase 58 CRM records. |
| REP-01 | The CRM workspace must support actionable inspection and simple operational rollups without depending on a separate reporting product. | Recommends record detail and timeline as first-class inspection surfaces plus a simple count and value funnel endpoint and UI for first-pass forecasting. |

</phase_requirements>

## Project Constraints (from repo state and current implementation)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the phase artifacts remain the authoritative planning sources.
- Phase 37 already delivered the tenant-aware app shell, route scaffolding, theme tokens, and RBAC bridge; Phase 60 should extend that shell rather than introducing a parallel surface.
- Phase 58 already delivered canonical CRM entities, governed custom fields, append-only activity logging, tenant-safe APIs, and identity primitives; Phase 60 should operate on those contracts rather than redefining them.
- Existing app routes such as `app/(markos)/company/page.tsx` and `app/(markos)/campaigns/page.tsx` are currently schema-preview placeholders, which means the workspace implementation gap is real rather than cosmetic.
- `lib/markos/contracts/schema.ts` still models the earlier control-plane object set and is not yet CRM-pipeline aware.
- Row-level security, tenant context, and fail-closed permission enforcement are mandatory for all new workspace mutations.

## Summary

Phase 60 should be implemented as a **tenant-configurable CRM workspace layer on top of the Phase 58 canonical CRM model**, not as a one-off board UI or a report-heavy analytics surface. The repo already contains the core ingredients needed to do this without architectural drift: a tenant-aware control-plane shell from Phase 37, a working RBAC bridge, canonical CRM entity tables from Phase 58, governed custom fields, and an append-only activity ledger that can make every workspace mutation auditable.

The strongest implementation path is:

1. Add a pipeline and stage configuration layer that treats stage definitions as tenant-owned data rather than product constants.
2. Add a record-centric workspace route model where Kanban, table, detail, timeline, calendar, and funnel are alternate views over the same canonical records.
3. Make edits first-class from the start, but force them through the same tenant and activity logging seams already established in Phase 58.
4. Treat custom objects as real workspace citizens with configurable fields, relationships, and view eligibility instead of leaving them as a future abstraction.
5. Keep forecast or funnel honest by limiting it to stage counts and value totals that are directly explainable from CRM records.

This phase is therefore a **pipeline-config + workspace-view + governed-mutation + simple-aggregation** problem. It is not a business-intelligence phase, not a workflow-automation phase, and not a design-system reinvention phase.

## Competitive Landscape

Phase 60 is not competing on whether MarkOS can imitate a generic spreadsheet CRM. It is competing on whether MarkOS can give operators a flexible, tenant-safe, CRM-native workspace without forcing them back into a second system for day-to-day pipeline work.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| HubSpot-style pipeline CRM | Clear board and table workflows, obvious stage movement, approachable record detail | Board-plus-detail mental model, fast edit loops, practical stage configuration | Hardcoding object types and hiding too much schema behavior behind product opinion |
| Salesforce-style object platform | Strong custom object posture and relationship flexibility | Treat custom objects as first-class and relationship-aware from the beginning | Enterprise sprawl, admin over-complexity, and weighted-forecast scope explosion in the first pass |
| Attio-style flexible CRM workspace | Modern relationship-centric records, adaptable views, elegant list and record interaction | Unified record workspace with multiple views over the same underlying model | Ambiguous governance boundaries or weak auditability around object changes |
| Monday or ClickUp style board workspaces | Flexible views, editable boards, calendar and table parity | Consistent view switching and shared filter state across views | Task-tool semantics that collapse CRM identity, account, and deal distinctions |
| Pipedrive-style focused sales boards | Simple funnel and stage-value visibility | Honest first-pass funnel based on counts and value totals | Pipeline design that assumes only opportunities matter |

### Strategic conclusion

MarkOS should position Phase 60 as:

- **More CRM-native than flexible work-management boards**
- **More configurable than deal-only pipeline tools**
- **More explainable and governed than heavyweight enterprise CRM sprawl**
- **More unified across views than placeholder app-route scaffolds**

The winning design is a **single canonical record layer with tenant-owned pipeline config, multi-view workspace surfaces, and auditable edits across all required views**.

## Audience Intelligence

The immediate audience for Phase 60 is internal planners, implementers, and future operators who need MarkOS to become the place where pipeline work actually happens after the canonical CRM foundation from Phase 58.

### Primary operator needs

1. Move records through pipeline stages without leaving MarkOS.
2. Inspect a record once and see fields, history, tasks, notes, and related context in one place.
3. Switch between board, table, calendar, and funnel views without losing trust in what the numbers mean.
4. Support different business motions such as qualification, deals, renewals, and account management without buying into a one-pipeline worldview.
5. Extend the data model with custom objects and fields without breaking tenant safety or auditability.

### Secondary implementation audience

1. Phase 60 planners who need a concrete decomposition into data model, routes, shared components, and validation work.
2. UI implementers who need to know which pieces can extend the Phase 37 shell versus which require new component families.
3. Future phases such as outbound execution and AI guidance that will depend on an editable, trustworthy workspace rather than read-only CRM records.

### Audience implications for research

- View design must optimize for **one canonical record model with multiple perspectives**, not six disconnected screens.
- Editing must optimize for **fast operational work with durable lineage**, not ad hoc optimistic UI without audit evidence.
- Custom objects must optimize for **controlled flexibility**, not unrestricted schema chaos.
- Funnel outputs must optimize for **operator legibility**, not advanced forecasting sophistication.

## Channel Benchmarks

These are planning heuristics for a first-pass CRM workspace layer. They are validation targets for Phase 60, not claims about current production performance.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Stage-move success for authorized users | >=95% under healthy API and client conditions | >=99% |
| Workspace view parity across required views | 3-4 core views typical in first releases | 6 of 6 required views shipped and tenant-usable |
| Record detail load p95 | 500-900ms heuristic for CRM detail surfaces with related data | <=700ms |
| Kanban drag-to-persist latency p95 | <=400ms heuristic for board mutation UX | <=250ms |
| Table filter or sort state persistence | Often partial or route-local in early tools | 100% preserved across view switches within the workspace session |
| Calendar reschedule success for eligible record types | >=95% heuristic | >=99% |
| Funnel aggregation freshness | <=15 min heuristic for CRM rollup refresh | <=1 min for canonical-record-backed aggregation |
| Activity logging completeness for workspace mutations | Often inconsistent outside enterprise CRMs | 100% for stage changes, inline edits, date changes, and note or task mutations |
| False-positive custom-object misconfiguration leading to broken views | Often high in flexible low-code tools | <2% through schema guards and admin validation |

### Benchmark interpretation

- Edit reliability matters more than animation polish because Phase 60 is operational workspace infrastructure.
- View completeness matters because the user explicitly locked all six views into first-pass scope.
- Funnel freshness matters because the first-pass forecast is only defensible if it is directly backed by live canonical records.
- Activity completeness matters because silent edits would break the CRM-truth posture established in Phase 58.

## Recommended Approach

### 1. Introduce a tenant-owned pipeline and stage configuration layer

The current CRM schema already gives `crm_deals` a `pipeline_key` and `stage_key`, but there is no stage-definition model, no ordering metadata, no color semantics, and no admin editing surface. Phase 60 should add a real pipeline configuration layer rather than continuing with implied defaults.

Recommended outcome:

- add `crm_pipelines` and `crm_pipeline_stages` tables using the same tenant and RLS posture as Phase 58
- scope pipelines by object kind or pipeline family instead of assuming a single deal board
- support stage ordering, display labels, color metadata, and simple won or lost semantics
- add CRUD and reorder endpoints behind the existing CRM tenant and role gates

### 2. Build the workspace around a dynamic record-detail hub

The current app shell is real, but the domain routes are placeholder schema dumps. The first serious CRM workspace surface should be a dynamic record-detail route that can anchor every other view.

Recommended outcome:

- add a dynamic route such as `app/(markos)/crm/[objectKind]/[recordId]/page.tsx`
- render canonical fields plus governed custom fields in one place
- include the Phase 58 timeline as a central inspection surface rather than a minor footer
- attach related tasks and notes through the existing CRM tables instead of inventing a separate workspace store
- make stage and field edits happen from the detail surface first so other views can reuse the same mutation path

### 3. Implement shared data hooks and workspace state before view sprawl grows

Kanban, table, calendar, and funnel should not each invent their own fetch, filter, and mutation logic. The current repo lacks a CRM workspace store, so planning should explicitly create one.

Recommended outcome:

- create shared hooks for listing records, fetching pipeline config, and applying record mutations
- add a workspace context that persists active view, filters, sort, and selected records across view switches
- keep view state URL-addressable where practical so filters and pipeline selections are linkable
- avoid route-local state that resets every time the operator moves between table, board, and funnel

### 4. Treat custom objects as real view participants, not hidden edge cases

Phase 60 is explicitly not allowed to defer full user-defined custom objects. That means the workspace has to decide which objects can participate in which views and how configuration is validated.

Recommended outcome:

- store object-level metadata describing whether pipeline, calendar, and funnel views are enabled
- define required field capabilities for certain views such as a stage field for Kanban or a date field for calendar
- keep relationship definitions explicit so records can link back to contacts, accounts, deals, or other custom objects without opaque behavior
- fail closed in the admin surface when an object is misconfigured for a requested view

### 5. Keep calendar and funnel narrow but complete

The first pass should support calendar and forecast or funnel because the user locked them in, but the repo should resist turning them into separate sub-products.

Recommended outcome:

- calendar view should work only for object types with an approved calendar date field
- funnel should expose stage count and value totals only, derived directly from canonical CRM records
- do not add weighted probability models, goal pacing, or reporting DSLs in Phase 60
- keep the UI readable from the same stage configuration and record dataset used by Kanban and table

### 6. Force every edit through audited CRM mutation seams

Phase 60 introduces interactive workspace editing, which means data integrity can regress quickly if views mutate records ad hoc.

Recommended outcome:

- reuse or extend the existing CRM API helpers so all mutations keep the same tenant validation and role enforcement posture
- append CRM activity for stage changes, field edits, reschedules, note creation, and task changes
- preserve conflict visibility where concurrent edits happen rather than silently overwriting canonical record state
- keep batch operations explicitly logged per record if they are introduced

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **Tenant-aware app shell already exists.** `app/(markos)/layout.tsx` provides a real control-plane shell and tenant context entry point.
2. **RBAC bridge already exists.** `lib/markos/rbac/policies.ts` already maps legacy route checks into the IAM v3.2 action model and provides a fail-closed precedent for permissions.
3. **CRM core tables already exist.** Phase 58 shipped canonical contacts, companies, accounts, customers, deals, tasks, notes, governed custom fields, and the activity ledger.
4. **Activity timeline logic already exists.** `buildCrmTimeline()` and related helpers provide a durable history model that Phase 60 can render directly.
5. **Session and tenant context seams already exist.** `requireMarkosSession()` and `getActiveTenantContext()` provide the server-side shape needed for workspace route guards.
6. **Theme-token and control-plane design language already exist.** The workspace can extend the established MarkOS UI system rather than reinventing it.

### Current constraints and gaps

1. **Current domain routes are placeholders.** Routes like `app/(markos)/company/page.tsx` and `app/(markos)/campaigns/page.tsx` only dump schema JSON and do not represent real workspace behavior.
2. **No pipeline config schema exists yet.** `pipeline_key` and `stage_key` are present on records, but no tenant-owned stage model exists.
3. **No CRM workspace component family exists yet.** There is no board, table, record-detail, calendar, funnel, or shared workspace-state implementation.
4. **Current schema contracts are not CRM-workspace aware.** `lib/markos/contracts/schema.ts` still reflects the earlier control-plane entity set.
5. **No first-pass aggregation endpoint exists for funnel reporting.** Count and value rollups will need a dedicated API contract.
6. **Custom-object participation rules are not defined yet.** The repo supports governed custom fields, but not full object-level view eligibility or relationship-driven workspace behavior.

### Architectural implication

Phase 60 should be primarily a **configure-render-edit-audit** phase:

- configure tenant-owned pipelines, stages, and object metadata
- render multiple views over one canonical record layer
- edit records through controlled mutation seams
- audit every important mutation back into the CRM timeline

That is the smallest architecture that satisfies the locked scope without spawning a second data model or a parallel workspace system.

## Tracking Requirements

Although Phase 60 is a workspace phase rather than a web-tracking phase, it still needs explicit instrumentation so later phases can measure adoption and detect operational regressions.

### Required workspace events

1. `crm_workspace_view_opened`
   - Properties: `tenant_id`, `object_kind`, `pipeline_key`, `view_type`, `actor_role`
2. `crm_record_opened`
   - Properties: `tenant_id`, `object_kind`, `record_id`, `source_view`, `pipeline_key`
3. `crm_stage_changed`
   - Properties: `tenant_id`, `object_kind`, `record_id`, `pipeline_key`, `from_stage`, `to_stage`, `source_view`
4. `crm_record_field_updated`
   - Properties: `tenant_id`, `object_kind`, `record_id`, `field_key`, `field_type`, `source_view`
5. `crm_calendar_date_changed`
   - Properties: `tenant_id`, `object_kind`, `record_id`, `date_field`, `source_view`
6. `crm_pipeline_config_updated`
   - Properties: `tenant_id`, `pipeline_key`, `change_type`, `object_kind`, `actor_role`
7. `crm_funnel_view_opened`
   - Properties: `tenant_id`, `pipeline_key`, `object_kind`, `time_window`

### Tracking guidance

- These events are operational evidence and product-adoption signals, not replacements for the CRM activity ledger.
- Mutation events that change canonical CRM state must also append CRM activity where appropriate.
- Sensitive values should stay redacted or omitted; field-level instrumentation should identify the field, not leak protected content.
- View telemetry should be low-noise and tied to meaningful workspace actions rather than every UI hover or drag motion.

## Risks and Pitfalls

1. **Board-first tunnel vision.** If planning starts from Kanban alone, the team will underbuild record detail, timeline, calendar, and funnel until the phase fragments.
2. **Hardcoded stage semantics.** If stages are embedded in UI components instead of tenant-owned config, multiple pipeline families and custom objects will fail quickly.
3. **Custom-object abstraction without guardrails.** If every object can opt into every view without validation, broken calendars, meaningless funnels, and unsafe admin states will appear.
4. **Route-local state resets.** If filters and selection state live inside individual pages, operators will experience the workspace as six disconnected tools rather than one surface.
5. **Silent edits.** If drag-drop or inline edits bypass activity logging, the CRM-truth posture from Phase 58 weakens immediately.
6. **Forecast scope creep.** If simple funnel work drifts into weighted forecasting, quota planning, or dashboard work, Phase 60 will bloat and delay the truly required workspace primitives.
7. **Permission drift across views.** If one view enforces IAM rules differently than another, tenant trust will regress even if the data model is correct.
8. **Placeholder-route inheritance.** If the current route scaffolds are expanded casually instead of replaced with a coherent CRM workspace route model, the UI will accrete inconsistently.

## Validation Architecture

Phase 60 should be validated as a workspace system, not as a collection of isolated widgets.

### 1. Schema and contract validation

- migration tests for pipeline, stage, and custom-object metadata tables
- tenant isolation tests for pipeline config and view-eligible records
- contract tests for funnel aggregation endpoints and record-mutation payloads

### 2. Mutation and audit validation

- tests proving stage moves, inline edits, note creation, and calendar reschedules append CRM activity correctly
- conflict-handling tests for concurrent stage or field updates
- permission tests proving readonly and unauthorized roles cannot mutate from any workspace view

### 3. View-level integration validation

- Kanban tests for loading stage columns, moving cards, and opening record detail
- table tests for sorting, filtering, inline edit behavior, and persistence of selected filters
- record-detail tests for field rendering, custom fields, timeline ordering, and related tasks or notes
- calendar tests for eligible object rendering and date-change persistence
- funnel tests for stage-count and value totals matching canonical records

### 4. Cross-view coherence validation

- opening a record from Kanban, editing it in detail, and confirming table and funnel reflect the change
- moving a stage from detail and confirming Kanban and timeline update coherently
- switching between views while preserving filter and pipeline context within the same workspace session

### 5. Story and UI-state validation

- component stories for board columns, cards, empty states, detail panels, table states, calendar states, and funnel visuals
- role-aware states proving read-only degradation is visible and intentional
- viewport coverage for dense workspace surfaces on desktop and constrained laptop widths

### Success criteria for planning handoff

Planning should not consider Phase 60 research actionable until the execution plan explicitly covers:

- tenant-owned pipeline and stage configuration
- one canonical record-detail hub
- all six required views
- auditable edits across workspace surfaces
- simple count and value funnel aggregation
- cross-view validation rather than per-view-only tests

## RESEARCH COMPLETE
