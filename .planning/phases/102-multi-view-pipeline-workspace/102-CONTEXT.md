# Phase 102: Multi-View Pipeline Workspace - Context

**Gathered:** 2026-04-14  
**Status:** Ready for planning

## Phase Boundary

This phase delivers the core operator CRM workspace across Kanban, table, detail, timeline, calendar, and forecast or funnel views from one canonical record layer. It is centered on a deals-first pipeline workspace with saved views, filters, and rollups that help operators manage live work inside MarkOS. It does not yet expand into sales or success execution queues, outbound sending, or AI-assisted recommendations.

## Implementation Decisions

### Workspace priority and operator flow
- **D-01:** The primary center of gravity for Phase 102 is a deals-first pipeline workspace. The architecture should stay reusable for other objects later, but equal multi-object parity is not required in this phase.
- **D-02:** Operators should land in the Kanban view by default so stage movement and pipeline progress remain the first experience.
- **D-03:** Table, detail, timeline, calendar, and forecast or funnel views must remain first-class switches from the same underlying workspace state rather than disconnected screens.
- **D-04:** Selecting a record from Kanban or Table should carry the operator into the record detail and timeline hub without losing workspace context.

### Saved views and filters
- **D-05:** Saved views should be named presets, not session-only toggles.
- **D-06:** The core filter set for this phase should include pipeline, stage, search, owner, and risk or health signals so operators can quickly pivot between lenses like My Pipeline, Closing Soon, and At Risk.
- **D-07:** Filter state and selected-record context should survive view switching and remain serializable or shareable inside the tenant-safe workspace model.

### Rollups and forecast behavior
- **D-08:** The forecast or funnel view should emphasize weighted revenue by stage, with counts and canonical totals still visible as supporting context.
- **D-09:** Rollups must stay grounded in live CRM records and stage metadata, not a detached analytics-only dashboard.

### the agent's Discretion
- Exact layout density, empty states, sort defaults, and visual chart treatment can follow repo-native patterns so long as the workspace feels operational and execution-oriented.

## Specific Ideas

- The workspace should feel like an operator cockpit for active deal movement, not just a reporting surface.
- Kanban is the default home, with quick pivots into Table, Detail, Timeline, Calendar, and Forecast views.
- Named saved views should make common motions obvious, especially pipeline-owner-stage and risk-based slices.
- Forecast should favor weighted revenue by stage over a counts-only summary.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase sources
- `.planning/ROADMAP.md` — Defines the Phase 102 boundary and dependency role for the workspace lane.
- `.planning/REQUIREMENTS.md` — PIP-01 and PIP-02 are the core completion targets for this phase.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — Locks the canonical activity and timeline semantics that the workspace must surface.

### Workspace contracts
- `contracts/F-60-object-workspace-metadata-v1.yaml` — Defines which objects are workspace-eligible and which view capabilities they can expose.
- `contracts/F-60-pipeline-config-v1.yaml` — Defines tenant-owned pipeline and ordered stage configuration for the workspace.
- `contracts/F-60-workspace-rollups-v1.yaml` — Defines the calendar and funnel rollup seams and the shared cross-view truth fields.

### Existing code and test anchors
- `lib/markos/crm/workspace.ts` — Canonical workspace state, cross-view mutations, filters, and rollup builders.
- `lib/markos/crm/workspace-data.ts` — Snapshot hydration from canonical CRM records, pipeline context, tasks, notes, and timeline data.
- `components/markos/crm/workspace-shell.tsx` — Existing six-view CRM shell and operator interaction seam.
- `api/crm/calendar.js` — Current calendar read and reschedule boundary for eligible record types.
- `test/crm-workspace/crm-workspace-views.test.js` — Regression coverage for route hydration, view availability, and filter serialization.
- `test/crm-workspace/crm-cross-view-coherence.test.js` — Regression coverage proving mutations, rollups, and filters stay coherent across all views.

## Existing Code Insights

### Reusable Assets
- `lib/markos/crm/workspace.ts`: already models the six required views, serializable filters, selected-record state, and cross-view mutations.
- `lib/markos/crm/workspace-data.ts`: already hydrates one workspace snapshot from canonical records, pipeline definitions, tasks, notes, and timelines.
- `components/markos/crm/workspace-shell.tsx`: already provides the operator shell for view switching, record patching, and calendar rescheduling.
- `api/crm/calendar.js`: already enforces tenant-safe calendar behavior for eligible CRM objects.

### Established Patterns
- All views are expected to read from the same underlying CRM record truth rather than separate data models.
- Filters, selected-record context, and view switching are handled as shared workspace state.
- Calendar eligibility and funnel behavior are driven by explicit object-definition and pipeline configuration metadata.

### Integration Points
- The MarkOS CRM pages already hydrate the workspace shell through the shared snapshot builder.
- Phase 101 timeline and stitched-history work now feeds directly into the detail and timeline views for this phase.
- Later execution, outbound, and AI phases will depend on these same workspace surfaces rather than building parallel operator UIs.

## Deferred Ideas

- Role-aware queues, SLA cues, and next-best-action surfaces belong to Phase 103.
- Native outbound send and conversation writeback belong to Phase 104.
- AI-generated summaries, recommendations, and reporting narratives belong to Phase 105.

---

*Phase: 102-multi-view-pipeline-workspace*  
*Context gathered: 2026-04-14*