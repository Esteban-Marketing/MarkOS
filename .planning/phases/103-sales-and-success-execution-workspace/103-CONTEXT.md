# Phase 103: Sales and Success Execution Workspace - Context

**Gathered:** 2026-04-14  
**Status:** Ready for planning

## Phase Boundary

This phase adds the operator execution layer on top of the verified CRM workspace: role-aware queues, task and playbook flows, SLA and risk visibility, and explainable next-best-action support for sales and customer-success teams. It should feel like one live execution cockpit rather than a passive dashboard. It does not yet include outbound message sending, cross-channel sequence execution, or autonomous AI actions.

## Implementation Decisions

### Queue structure and role behavior
- **D-01:** The first version should use one unified execution workspace with clear tabs, not separate sales and success products.
- **D-02:** Managers, owners, and tenant admins should land on the team queue by default, while the personal-vs-team toggle remains first-class for role-aware execution.
- **D-03:** Queue selection should continue to open a detail, evidence, and action panel grounded in the same canonical CRM record and timeline context.

### Priority and triage behavior
- **D-04:** The initial urgency bias should favor due or overdue work and approval gates before lower-signal suggestions.
- **D-05:** Success, renewal, and expansion risk must still stay visible and explainable, but they should not displace explicit unblockers like overdue tasks or required approvals.

### Action and playbook posture
- **D-06:** Next-best actions in this phase should stay bounded and safe: create task, append note, update allowed record fields, and show draft suggestions without autonomous sending.
- **D-07:** Playbooks should feel like guided checklists with rationale and evidence, not black-box automation.
- **D-08:** Human operators remain in control; AI support stays assistive and approval-aware rather than self-executing.

### the agent's Discretion
- Exact ranking weights, visual density, queue copy, and tab ordering can follow repo-native execution patterns so long as the workspace remains explainable, role-aware, and operationally useful.

## Specific Ideas

- The execution surface should feel like a prioritized action desk for live revenue work.
- One unified queue with tabs is preferred over fragmented role-specific screens.
- Due or overdue items and approval-needed cases should be unmistakably front-and-center.
- Draft follow-ups should stay suggestion-only in this phase.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase sources
- `.planning/ROADMAP.md` — Defines the Phase 103 boundary and the handoff from workspace views to execution workflows.
- `.planning/REQUIREMENTS.md` — EXEC-01 and EXEC-02 are the core completion targets for this phase.
- `.planning/phases/102-multi-view-pipeline-workspace/102-CONTEXT.md` — Locks the canonical workspace, saved-view, and rollup assumptions Phase 103 builds on.

### Execution workspace code and tests
- `lib/markos/crm/execution.ts` — Canonical queue ranking, rationale, bounded actions, and execution snapshot builder.
- `app/(markos)/crm/execution/page.tsx` — Role-aware workspace entrypoint for the execution surface.
- `app/(markos)/crm/execution/execution-store.tsx` — Shared state for queue scope, tabs, selected recommendation, and visible actions.
- `components/markos/crm/execution-queue.tsx` — Queue shell with personal and team scopes and actionable tab grammar.
- `components/markos/crm/execution-detail.tsx` — Detail panel for source signals, bounded actions, and record context.
- `api/crm/execution/queues.js` — Tenant-safe queue read seam.
- `api/crm/execution/actions.js` — Tenant-safe bounded action seam.
- `test/crm-execution/crm-queue-ranking.test.js` — Ranking and role-aware queue behavior coverage.
- `test/crm-execution/crm-execution-workspace.test.js` — Execution snapshot and workspace shell coverage.
- `test/crm-execution/crm-execution-e2e.test.js` — End-to-end action and evidence coherence coverage.
- `test/crm-execution/crm-team-queue-ui.test.js` — UI expectations for personal, team, and rationale-first execution surfaces.

## Existing Code Insights

### Reusable Assets
- `lib/markos/crm/execution.ts`: already computes urgency, queue tabs, rationale summaries, safe action lists, and snapshot hydration from canonical CRM state.
- `app/(markos)/crm/execution/execution-store.tsx`: already provides a role-aware client store for personal vs team scope and recommendation selection.
- `components/markos/crm/execution-queue.tsx`: already exposes the personal and manager or team toggle and the main tab grammar.
- `components/markos/crm/execution-detail.tsx`: already models the explainable action panel with source signals and safe next steps.

### Established Patterns
- Execution recommendations are expected to stay explainable through rationale summaries and source-signal fields.
- Bound actions are intentionally limited to safe CRM mutations and draft suggestions.
- Role, tenant, and approval boundaries are preserved through the existing CRM API surfaces rather than bypassed in the UI layer.

### Integration Points
- The execution workspace reuses the Phase 102 workspace and timeline context for detail inspection.
- Phase 104 outbound execution will later consume the draft and approval surfaces, so this phase should not hard-code autonomous send behavior.
- Phase 105 reporting and copilots will rely on the queue rationale and action evidence built here.

## Deferred Ideas

- Native outbound send and multi-channel sequence execution belong to Phase 104.
- AI-generated autonomous follow-through and reporting narratives belong to Phase 105.
- Broader warehouse-first analytics or external CRM sync remain out of scope.

---

*Phase: 103-sales-and-success-execution-workspace*  
*Context gathered: 2026-04-14*