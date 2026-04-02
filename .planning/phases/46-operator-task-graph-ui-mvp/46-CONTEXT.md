# Phase 46: Operator Task Graph UI (MVP) - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the functional operator-facing task graph UI: live task state display, step-by-step execution controls, approval checkpoint gate, retry handling, and immutable evidence panel. All delivered as React components under `app/(markos)/operations/tasks/`, with Storybook stories for all 5 task states and a test suite covering state transitions and evidence capture.

This phase does NOT own: OpenAPI spec generation (Phase 47), contract test CI gates (Phase 48), RBAC hardening (Phase 49), or onboarding wizard integration (Phase 50). No event-contract framework (D-17). No scope pull-in from later phases.

</domain>

<decisions>
## Implementation Decisions

### Task Graph Visual Structure
- **D-01:** Agent's discretion — use a linear vertical step list (numbered step cards with state badge chips, no graph layout library). Rationale: zero existing graph component; linear is simplest to build, test, and maintain for the MVP; visual complexity of DAG connectors is not warranted until real branching exists.
- **D-02:** Agent's discretion for task execution order — treat steps as strictly sequential for Phase 46 MVP. Parallel branch support deferred.

### State Machine
- **D-03:** Agent's discretion — implement with React `useReducer` + an explicit `TaskStepState` enum (`queued | approved | executing | completed | failed`). Zero additional dependencies; consistent with existing codebase style (no external state library in any current file).
- **D-04:** Agent's discretion for parallelism — strictly sequential step execution for MVP. Parallelism deferred.

### Data Connectivity
- **D-05:** Agent's discretion — in-memory task store (React Context module) for Phase 46 MVP. Typed fixture shapes define the DB contract shape so Phase 47/48 can wire real Supabase without UI changes. Real `task_executions` schema and Supabase realtime deferred to Phase 47/48.
- **D-06:** Agent's discretion — typed mock fixtures must mirror the intended DB schema shape (field names, types, optional/required) so the contract is stable before backend materialization.

### Approval Gate UX
- **D-07:** Agent's discretion — implement as a blocking modal dialog (floating, focus-trapped, dismissible only by Approve or Reject). Consistent with accessible pattern; no full-screen takeover. Rejection reason field is optional — captures reason without creating friction for fast decisions.
- **D-08:** Approval and rejection decisions must be persisted to the in-memory task store (and later Event Store) with actor ID, timestamp, and decision value. The UI must prevent the step from executing until decision is recorded.

### Evidence Panel
- **D-09:** Agent's discretion — right sidebar drawer opening on step click. Operator stays in context without a route change. Consistent with drawer pattern that works across the existing layout structure.
- **D-10:** Agent's discretion — UI-only immutability for MVP: evidence fields render as read-only elements (no inputs). Server-enforced write protection (RLS policy or API guard) deferred to Phase 48 when the DB schema is materialized.
- **D-11:** Evidence payload must include: inputs, outputs, logs (array of strings), timestamps (step_started_at, step_completed_at), actor_id. These fields must match the typed fixture shape from D-05/D-06.

### RBAC Integration
- **D-12:** Add `"operations"` as a new `RouteKey` in `lib/markos/rbac/policies.ts`; restrict to `["owner", "operator"]` roles. Do not expand permissions beyond this in Phase 46.
- **D-13:** `"tasks"` is a sub-route of operations — access inherits from the `operations` route guard. No separate sub-route permission entry needed for MVP.

### Telemetry
- **D-14:** Add Phase 46 task events to `lib/markos/telemetry/events.ts`: `markos_task_step_executed`, `markos_task_step_approved`, `markos_task_step_rejected`, `markos_task_step_retried`. All must flow through `buildEvent()` / `sanitizePayload()` — no raw event emission.
- **D-15:** Evidence payloads emitted to telemetry must be sanitized (no secrets or tokens in inputs/outputs). Redaction rules from Phase 38 D-38-09 apply.

### Storybook & Test Coverage
- **D-16:** Five Storybook stories required, one per task state: `Queued`, `Approved`, `Executing`, `Completed`, `Failed`. Follows Phase 38 D-38-04 (5 dimensions per surface including state).
- **D-17:** Test suite (`test/ui-operations/`) covers: step state transitions (atomic, logged with timestamps), approval checkpoint blocking behavior, reject reason capture, retry attempt logging, evidence panel display for ≥95% of steps.

### the agent's Discretion
- Layout algorithm for step list (card vs row vs accordion).
- CSS/Tailwind class choices within the existing design token system from `lib/markos/theme/tokens.ts`.
- Modal implementation mechanics (portal or inline conditional render).
- Specific drawer animation timing and breakpoint collapse behavior.
- Whether to use a separate `useTaskMachine` hook or inline the reducer in the page component.
- Exact field layout of the evidence drawer (order of inputs/outputs/logs/timestamps sections).
- How retry input mutation is presented (pre-filled editable field vs diff view).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Contracts
- `.planning/v3.1.0-ROADMAP.md` §Phase 46 — Full deliverable list, success criteria, dependencies, and 6–8 plan guidance.
- `.planning/REQUIREMENTS.md` §Phase 46 (OPS-01–OPS-05) — Requirement-to-SC mapping and KPI instrumentation note.
- `.planning/MILESTONE-CONTEXT.md` — Milestone north star, operator-first UX mandate, risk controls.

### Phase 45 Outputs (foundation for this phase)
- `.planning/FLOW-CONTRACTS.md` — All 17 canonical flows; use to populate task selectors in the UI.
- `.planning/FLOW-INVENTORY-MOCKUP.md` — Phase 45 UI mockup contract; visual patterns for domain/type badges, SLO labels, and state chips that should carry forward into Phase 46 components.
- `contracts/flow-registry.json` — Machine-readable flow registry; source of truth for task flow metadata.

### Existing Runtime Contracts
- `lib/markos/rbac/policies.ts` — `MarkOSRole`, `RouteKey`, `canAccess()`, `canPublish()`. Must be extended with `"operations"` route in this phase.
- `lib/markos/telemetry/events.ts` — `MarkOSTelemetryEvent`, `buildEvent()`, `sanitizePayload()`. Must be extended with task events in this phase.
- `lib/markos/theme/tokens.ts` — Design tokens for consistent styling.
- `lib/markos/contracts/schema.ts` — Entity contract schema; reference for understanding MarkOS contract conventions.
- `app/(markos)/layout.tsx` — Nav wiring; must add `operations` nav item in this phase.

### Prior Phase Context
- `.planning/phases/38-ui-coverage-security-assurance/38-CONTEXT.md` — D-38-03 through D-38-12: Storybook coverage contract, 5-dimension requirement, Chromatic policy, security/telemetry rules. All apply to Phase 46 components.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/markos/rbac/policies.ts` — `canAccess(role, route)` — extend with `"operations"` route entry.
- `lib/markos/telemetry/events.ts` — `buildEvent()` + `sanitizePayload()` — extend `name` union with task events.
- `lib/markos/theme/tokens.ts` — Design tokens; use for color, spacing, typography in new components.
- `app/(markos)/layout.tsx` — Nav array; add operations link here.

### Established Patterns
- Pages are minimal JSX with no external state library (Phase 37 scaffold level). Phase 46 introduces the first real stateful UI in the app.
- Telemetry events are typed and sanitized before emit — same pattern required for task events.
- Storybook stories co-located in `lib/markos/` (`*.stories.tsx`). New stories for `app/(markos)/operations/tasks/` components should follow the same co-location pattern.
- No React Query, SWR, or data-fetching library detected — in-memory context is the right MVP approach.

### Integration Points
- `app/(markos)/layout.tsx` NAV_ITEMS array — add `{ href: "/markos/operations", label: "Operations", route: "operations" }`
- `lib/markos/rbac/policies.ts` routePermissions — add `operations: ["owner", "operator"]`
- `lib/markos/telemetry/events.ts` event name union — add 4 task event names
- New route group: `app/(markos)/operations/tasks/` (new directory, all 5 component files + page.tsx)

</code_context>

<specifics>
## Specific Ideas

- Phase 45 established domain/type badge colors and SLO severity labeling in `FLOW-INVENTORY-MOCKUP.md`. Reuse those visual conventions in the task graph step cards for domain identification.
- "Robust by default" (from Phase 45 D-12 spirit) applies here too — step state transitions must be logged with timestamps even in the in-memory mock store, not just reflected in UI state.
- T1 KPI (time-to-first-task) instrumentation begins after Phase 46 ships — plan for a `markos_task_step_executed` telemetry event that captures a `first_task` flag or timestamp for baseline measurement.

</specifics>

<deferred>
## Deferred Ideas

- Real Supabase `task_executions` schema + RLS policies → Phase 47/48
- Server-enforced evidence immutability (write-protect on DB) → Phase 48
- Parallel/branching step support → future phase
- Full-screen overlay approval gate variant → not needed for MVP
- Dedicated `/operations/tasks/[id]/evidence` route → not needed for MVP
- Edit controls for the FLOW-INVENTORY UI (deferred from Phase 45 D-19) → Phase 46 or 47 as separate backlog item

</deferred>

---

*Phase: 46-operator-task-graph-ui-mvp*
*Context gathered: 2026-04-02*
