# Phase 102: Multi-View Pipeline Workspace - Research

**Researched:** 2026-04-14  
**Domain:** CRM workspace views, saved filters, and stage-based rollups  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 102 is centered on a deals-first pipeline workspace.
- **D-02:** Operators land in Kanban by default.
- **D-03:** Table, detail, timeline, calendar, and forecast or funnel remain first-class switches from the same workspace state.
- **D-04:** Record selection should carry the operator into the detail and timeline hub without losing context.
- **D-05:** Saved views should be named presets rather than session-only toggles.
- **D-06:** Core filters should include pipeline, stage, search, owner, and risk or health signals.
- **D-07:** Filter and selected-record context should survive view switching and remain serializable or shareable.
- **D-08:** Forecast should emphasize weighted revenue by stage.
- **D-09:** Rollups must stay grounded in canonical CRM truth rather than a detached dashboard.

### Deferred Ideas (OUT OF SCOPE)
- Execution queues and role-aware work management — Phase 103.
- Native outbound send or conversation writeback — Phase 104.
- AI summaries, recommendations, and reporting narratives — Phase 105.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIP-01 | Operators can manage custom pipelines and stages through table, Kanban, detail, timeline, calendar, and forecast views. | Reuse the existing six-view workspace shell and state model, then harden continuity and rollups. |
| PIP-02 | Saved filters, rollups, and workspace metadata expose record health, ownership, and workload clearly. | Extend the current shared workspace state with named presets, owner or risk filters, and weighted stage rollups. |
</phase_requirements>

## Project Constraints (from PROJECT.md and milestone state)

- Keep the current Node.js, Next.js, Supabase, and contract-first CRM stack; do not replatform.
- Preserve tenant-safe, canonical CRM truth across all workspace views.
- Keep the scope focused on the multi-view workspace itself; do not pull in queue, outbound, or copilot behavior.

## Summary

Phase 102 should be planned as a completion and hardening phase for an already-started CRM workspace foundation, not as a greenfield UI build. The repository already contains the core six-view state model, a snapshot hydrator, the workspace shell, and view-specific seams such as calendar mutations. The most important planning work is to complete the operator-facing behavior: named saved views, richer owner and risk filters, stronger cross-view persistence, and a forecast or funnel rollup that emphasizes weighted revenue by stage.

**Primary recommendation:** keep the existing shared workspace state authoritative and layer the missing operator workflow features into it rather than building new per-view state or a separate dashboard system.

## Existing Reusable Code

| Asset | What already exists | Planning implication |
|------|----------------------|----------------------|
| `lib/markos/crm/workspace.ts` | canonical workspace state, view switching, filter serialization, Kanban/table/detail/calendar/funnel builders | keep this as the single workspace state authority |
| `lib/markos/crm/workspace-data.ts` | hydrates one workspace snapshot from CRM records, pipeline config, tasks, notes, and timeline | reuse for all protected CRM routes and default workspace entry |
| `components/markos/crm/workspace-shell.tsx` | six-view shell with inline switching and record mutation hooks | extend rather than replace |
| `api/crm/calendar.js` | tenant-safe read/write seam for calendar-capable objects | follow this route pattern for any added view persistence seams |
| `contracts/F-60-object-workspace-metadata-v1.yaml` | workspace eligibility and capability flags per object | preserve object-driven view enablement |
| `contracts/F-60-pipeline-config-v1.yaml` | pipeline and stage configuration contract | anchor stage ordering and forecast grouping here |
| `contracts/F-60-workspace-rollups-v1.yaml` | shared cross-view truth fields and existing simple rollup semantics | extend carefully to support weighted revenue emphasis |
| `test/crm-workspace/*.test.js` | cross-view coherence, calendar, funnel, and detail regressions | use as the TDD safety rail for the phase |

## Verified Gaps to Address

1. **Saved views are not yet present.** A workspace search across the CRM surfaces found no saved-view or preset seam.
2. **Current filters are minimal.** The shared workspace state currently carries `search` and `stage_key`, but not the owner or risk or health filters requested for this phase.
3. **Forecast semantics are still lightweight.** The current rollup contract exposes `record_count` and `total_value`, but does not yet emphasize weighted revenue by stage.
4. **Nearby health signals already exist.** Related risk and ownership signals exist in the reporting and execution layers and can be reused without pulling execution scope into Phase 102.

## Architecture Patterns

### Recommended Project Structure
```text
lib/markos/crm/
├── workspace.ts         # canonical shared workspace state and cross-view builders
├── workspace-data.ts    # snapshot hydration from CRM truth
├── reporting.ts         # nearby risk and health signal helpers worth reusing
└── api.cjs              # tenant-safe CRUD and activity seams

components/markos/crm/
├── workspace-shell.tsx  # main operator shell
├── kanban-view.tsx
├── table-view.tsx
├── record-detail.tsx
├── timeline-panel.tsx
├── calendar-view.tsx
└── funnel-view.tsx

contracts/
├── F-60-object-workspace-metadata-v1.yaml
├── F-60-pipeline-config-v1.yaml
└── F-60-workspace-rollups-v1.yaml
```

### Pattern 1: One canonical state across all views
All six workspace views should continue to read from the same workspace state object. This keeps filters, selected records, sort state, and pipeline context coherent.

### Pattern 2: Server-hydrated snapshot, client-side switching
The repo already hydrates one snapshot from canonical records and allows the shell to switch views on the client. Planning should preserve this thin split.

### Pattern 3: Contract-driven capability flags
Calendar and funnel or forecast eligibility should remain controlled by explicit object-definition flags and date-field metadata, not by ad hoc UI assumptions.

### Pattern 4: Operational workspace, not passive dashboard
Rollups and filters should help an operator act on live work. The workspace should stay execution-connected through detail, timeline, task, and note context.

## Likely Task Waves

### Wave 0: Regression-first workspace guardrails
- add red-path coverage for named saved views
- add coverage for owner and risk or health filters
- add coverage for weighted stage-based forecast rollups
- verify cross-view context survives switching and record selection

### Wave 1: Shared state and saved-view persistence
- extend the canonical workspace state with named presets and richer filters
- preserve serializable and tenant-safe workspace context
- keep deals-first Kanban as the default landing mode

### Wave 2: Forecast and rollup upgrade
- layer weighted revenue by stage into the existing funnel or forecast model
- preserve counts and total value as supporting context
- keep rollups grounded in canonical CRM records and stage definitions

### Wave 3: Operator continuity pass
- ensure detail and timeline stay connected to record selection from Kanban and Table
- keep calendar and forecast pivots coherent with the same pipeline context

## Recommended Implementation Order

1. Write failing workspace regressions for saved views, owner or risk filters, and weighted stage revenue rollups.
2. Extend the shared workspace state and snapshot builder rather than individual views first.
3. Add the named saved-view seam and serializable filter support.
4. Upgrade the forecast or funnel aggregation after the shared state contract is locked.
5. Re-run the workspace and pipeline regression slice before phase execution closeout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| cross-view state | separate per-view stores | `workspace.ts` shared state | prevents filter and selection drift |
| snapshot hydration | one-off route logic per page | `workspace-data.ts` | keeps all views grounded in the same CRM truth |
| eligibility rules | UI-only toggles | F-60 object metadata contract | preserves tenant-safe, object-aware behavior |
| forecast rollups | detached BI-style dashboard math | CRM-native pipeline and amount fields | stays explainable and auditable |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking cross-view coherence | High | keep one shared workspace state and extend it centrally |
| Overreaching into Phase 103 execution scope | High | reuse nearby owner and risk signals without importing queue workflows |
| Forecast math becoming opaque | High | keep weights explicit, stage-based, and tied to canonical amounts |
| Saved-view persistence leaking across tenants | Critical | preserve tenant-safe route and storage boundaries |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Quick run command | `node --test test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-cross-view-coherence.test.js` |
| Full phase slice command | `node --test test/crm-schema/crm-pipeline-config.test.js test/crm-api/crm-pipeline-api.test.js test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-record-detail-timeline.test.js test/crm-workspace/crm-calendar-view.test.js test/crm-workspace/crm-funnel-view.test.js test/crm-workspace/crm-cross-view-coherence.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIP-01 | all six views stay coherent and operator-usable | unit / integration | workspace full phase slice | ✅ |
| PIP-02 | saved filters, rollups, owner, and health cues remain visible and grounded | unit / integration | workspace full phase slice | ✅ |

## Sources

### Primary (HIGH confidence)
- existing repo artifacts under `lib/markos/crm/`, `components/markos/crm/`, `contracts/`, and `test/crm-workspace/`
- Phase 102 context decisions captured in `102-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Architecture: HIGH — directly grounded in the current repo seams
- Validation: HIGH — existing workspace tests already cover the base surface
- Risks: HIGH — supported by concrete gaps found during repo inspection

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
