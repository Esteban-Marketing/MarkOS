---
phase: 46
phase_name: Operator Task Graph UI (MVP)
milestone: v3.1.0
milestone_name: Operator Surface Unification
researched: "2026-04-02"
domain: Operator task execution UI, reducer-driven state machine, in-memory event-shaped store, Storybook and UI contract testing
confidence: HIGH
---

# Phase 46: Operator Task Graph UI (MVP) - Research

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- Real Supabase `task_executions` schema + RLS policies → Phase 47/48
- Server-enforced evidence immutability (write-protect on DB) → Phase 48
- Parallel/branching step support → future phase
- Full-screen overlay approval gate variant → not needed for MVP
- Dedicated `/operations/tasks/[id]/evidence` route → not needed for MVP
- Edit controls for the FLOW-INVENTORY UI (deferred from Phase 45 D-19) → Phase 46 or 47 as separate backlog item
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-01 | Operator can view a live task graph showing current execution state, queued actions, and completion path. | Sections 1, 3, and 4 prescribe a route-level task hub, linear task graph composition, and flow-registry-backed fixtures. |
| OPS-02 | Operator can execute a task from the UI and observe step-by-step state transitions. | Sections 3 and 5 define a reducer-driven transition model, append-only transition log, and pure-function test surface. |
| OPS-03 | Operator can approve or reject a queued task step before execution proceeds. | Sections 3 and 6 define a blocking modal, separate approval record shape, and rejection semantics that do not break the locked enum. |
| OPS-04 | Operator can retry a failed task step with optional input mutation. | Sections 3 and 6 define retry draft handling, separate retry attempt records, and re-entry rules for approval-gated steps. |
| OPS-05 | Operator can view step evidence panel (inputs, outputs, logs, timestamps, actor ID). | Sections 3, 4, and 6 define the evidence contract, immutable drawer behavior, and fixture/test thresholds for evidence completeness. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live mission state.
- Respect the GSD and MarkOS split; this phase is a GSD planning artifact, not a MarkOS protocol rewrite.
- Primary CLI/test paths in this repo are `npx markos`, `npm test`, and `node --test test/**/*.test.js`.
- Local onboarding runtime exists at `node onboarding/backend/server.cjs`, but Phase 46 must stay inside the app UI and shared contracts.

## Summary

Phase 46 should be implemented as a route-level operations surface backed by a pure reducer and an in-memory React Context store whose shapes already look like future MarkOSDB and Event Store records. The right MVP is not a graph engine or a realtime backend; it is a deterministic, sequential operator console that renders one task at a time from typed fixtures sourced from Phase 45 flow metadata and records every approval, execution, failure, retry, and evidence snapshot in append-only in-memory logs.

The critical modeling decision is to keep execution state and approval state separate. The locked `TaskStepState` enum does not include `rejected`, so a rejection cannot be represented by forcing a fake execution state. The clean approach is: step state remains `queued`, while a separate `approval` object records `pending | approved | rejected`, actor, timestamp, and optional reason. That preserves D-03 while satisfying D-08 and avoids conflating human gating with execution outcomes.

The roadmap and requirements still point toward MarkOSDB/Event Store persistence, but Phase 46 must not materialize schema or backend writes yet. The way to satisfy that now is to make the store boundary event-shaped: reducer actions append typed `task_event` records and update typed `task_execution` snapshots in memory only. When Phase 47/48 introduce real persistence, the provider implementation can swap to Supabase/Event Store without rewriting route components, story fixtures, or tests.

**Primary recommendation:** Build Phase 46 as a route-first UI under `app/(markos)/operations/tasks/`, with a pure `task-machine` module, a thin `task-store` provider seeded from typed fixtures, one Storybook route story file covering the 5 locked task states, and node:test coverage focused on reducer transitions, approval blocking, retry logging, evidence completeness, RBAC wiring, and telemetry contract extension.

## Standard Stack

### Core

| Library | Repo Version | Purpose | Why Standard Here |
|---------|--------------|---------|-------------------|
| Next.js | `^15.2.0` | Route surface under `app/(markos)` | Already established in Phase 37; no new routing framework needed. |
| React | `^19.0.0` | Stateful task UI and context provider | Locked reducer-first architecture fits current app baseline. |
| TypeScript | `^5.4.0` | Typed fixtures, reducer actions, event/evidence contracts | Required to keep fixture shapes aligned with future DB materialization. |

### Supporting

| Library | Repo Version | Purpose | When to Use |
|---------|--------------|---------|-------------|
| Storybook | `^8.6.18` | Route-level UI state catalog | Required for the 5 task states and CI visual coverage. |
| `@storybook/react-vite` | `^8.6.18` | Story renderer for route stories | Reuse existing repo setup; no story infra changes needed. |
| node:test | built into Node | Reducer/store/contract tests | Best fit for repo test baseline; avoids adding React test libraries in MVP. |

### Package Guidance

- Add **no new external state library**.
- Add **no React Query, SWR, Zustand, XState, or graph layout dependency**.
- Add **no OpenAPI, contract CI, or DB client work** beyond existing shared types.

## Architecture Patterns

### Recommended Route Structure

```text
app/
└── (markos)/
    └── operations/
        ├── page.tsx                # Thin landing page or redirect to /markos/operations/tasks
        └── tasks/
            ├── page.tsx            # Route composition for Phase 46 surface
            ├── task-graph.tsx      # Left/main column: vertical step list and task selection summary
            ├── step-runner.tsx     # Action controls, sequential progression, retry entry
            ├── approval-gate.tsx   # Blocking modal for approval/rejection
            ├── evidence-panel.tsx  # Right drawer, read-only evidence sections
            ├── task-store.tsx      # React Context provider + selectors
            ├── task-machine.ts     # Pure reducer, action creators, transition helpers
            ├── task-fixtures.ts    # In-memory tasks backed by typed future-contract shapes
            ├── task-types.ts       # Shared contracts: task, step, evidence, approval, retry, event
            └── tasks.stories.tsx   # Required 5-state route story family
```

**Why this structure:** it keeps route composition thin, isolates pure state logic for node:test coverage, and makes the future persistence adapter a store concern rather than a page concern.

### Pattern 1: Route-first composition

**What:** keep `page.tsx` focused on selecting a task fixture, rendering the graph/runner/drawer shell, and binding provider state to presentational components.

**When to use:** all task interactions in this phase.

**Why:** existing route stories in `app/(markos)` are route-level first-class coverage targets from Phase 38, and current app pages are otherwise lightweight.

### Pattern 2: Pure reducer + typed provider

**What:** model all task mutation logic in a pure reducer module, then wrap it with a Context provider that exposes derived selectors and dispatch helpers.

**When to use:** state transitions, approval recording, retry logging, evidence selection.

**Why:** the repo already tests contracts and file structure with `node:test`; pure functions are easy to import and verify without adding client test infrastructure.

### Pattern 3: Event-shaped in-memory persistence boundary

**What:** every mutation updates the current task snapshot and appends a typed event record.

**When to use:** approval, execution start, execution complete, failure, retry request, retry execute, evidence capture.

**Why:** this is the lowest-risk way to honor the roadmap’s MarkOSDB/Event Store intent while keeping Phase 46 UI-only.

## Concrete UI Surface Design

### 1. Route behavior

- Add a new operations route to nav via `app/(markos)/layout.tsx` with `route: "operations"`.
- Use `/markos/operations/tasks` as the primary Phase 46 surface.
- Keep `app/(markos)/operations/page.tsx` thin: either a short operations landing page or an immediate redirect to `/markos/operations/tasks`.
- Do not add a separate permission key for `tasks`; inherit access from the `operations` route per D-13.

### 2. Component boundaries

| Component | Responsibility | Should Own State? |
|-----------|----------------|-------------------|
| `page.tsx` | Composes layout regions, wires provider, chooses default task fixture | No reducer logic |
| `task-graph.tsx` | Renders task metadata, current path, vertical step list, active/blocked states | No |
| `step-runner.tsx` | Renders allowed actions for current step: run, approve, retry, inspect evidence | Minimal local UI state only |
| `approval-gate.tsx` | Blocking modal with approve/reject actions and optional rejection reason | Local form state only |
| `evidence-panel.tsx` | Read-only drawer sections for inputs, outputs, logs, timestamps, actor | No |
| `task-store.tsx` | Context, selectors, initial fixture hydration, open drawer state | Yes, but only store plumbing |
| `task-machine.ts` | Reducer, action types, derived transition helpers, append-only event generation | Pure state logic |

### 3. State shape

Recommended core contracts:

```ts
export enum TaskStepState {
  Queued = "queued",
  Approved = "approved",
  Executing = "executing",
  Completed = "completed",
  Failed = "failed",
}

export type TaskApprovalStatus = "pending" | "approved" | "rejected";

export type TaskStepEvidence = Readonly<{
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  logs: string[];
  step_started_at: string | null;
  step_completed_at: string | null;
  actor_id: string | null;
}>;

export type TaskStepRetryAttempt = {
  attempt: number;
  requested_at: string;
  requested_by: string;
  input_snapshot: Record<string, unknown>;
  previous_error: string | null;
  outcome_state: TaskStepState | null;
};

export type TaskStepRecord = {
  id: string;
  flow_id: string;
  title: string;
  description: string;
  order_index: number;
  state: TaskStepState;
  requires_approval: boolean;
  approval: {
    status: TaskApprovalStatus;
    decided_at: string | null;
    decided_by: string | null;
    rejection_reason: string | null;
  };
  latest_error: string | null;
  retry_count: number;
  retry_attempts: TaskStepRetryAttempt[];
  evidence: TaskStepEvidence;
};

export type TaskExecutionRecord = {
  id: string;
  flow_id: string;
  flow_name: string;
  actor_role: "owner" | "operator";
  current_step_id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  steps: TaskStepRecord[];
};
```

**Key design choice:** task-level status can be derived from step states, but keeping a small top-level `status` field is still useful because the roadmap explicitly talks about task state mutations and future persistence.

### 4. In-memory store shape

The store should hold:

- `tasksById: Record<string, TaskExecutionRecord>`
- `taskOrder: string[]`
- `selectedTaskId: string`
- `selectedEvidenceStepId: string | null`
- `taskEvents: TaskEventRecord[]`
- `activeModal: { type: "approval" | "retry" | null; stepId?: string }`

**Important:** `taskEvents` is the future Event Store seam. Do not hide event generation in UI components; generate it inside reducer helpers so later DB persistence can subscribe to the same shape.

### 5. Evidence model

Evidence should be present on every step record from the beginning, even if initially empty. That keeps the contract stable and makes the ≥95% completeness check measurable from fixtures and reducer outputs.

Recommended evidence rules:

- `inputs` snapshot captured before execution starts.
- `step_started_at` written when transitioning to `executing`.
- `logs` appended during transition helpers, never replaced wholesale.
- `outputs` and `step_completed_at` written on `completed` or `failed`.
- `actor_id` written on approval and execution actions so the drawer has a stable audit anchor.
- Treat evidence as read-only at the UI layer by passing `Readonly` types and not rendering editable form controls in the drawer.

### 6. Retry logging model

Retry must be append-only, not overwrite-only. Recommended behavior:

- A failed step opens retry UI with the last `inputs` snapshot pre-filled.
- Confirming retry appends a `retry_attempt` record before changing state.
- If the step `requires_approval` and the operator changed inputs, reset `approval.status` to `pending` and return step state to `queued`.
- If the step does not require approval, move directly to `approved` or `queued` depending on whether execution should start immediately from the UI control.
- Each retry emits `markos_task_step_retried` with sanitized metadata only.

This preserves OPS-04 without needing a new execution enum state.

### 7. Approval gating flow

Recommended flow:

1. Operator clicks run on the next actionable queued step.
2. If `requires_approval` is `true` and `approval.status !== "approved"`, open `approval-gate.tsx`.
3. Modal is blocking and focus-trapped; it closes only through Approve or Reject.
4. Approve writes `approval.status = "approved"`, `decided_at`, `decided_by`, appends an approval event, and transitions step state to `approved`.
5. Reject writes `approval.status = "rejected"`, optional reason, appends a rejection event, and leaves step state as `queued`.
6. Execution controls remain disabled until the reducer sees both sequential eligibility and approval satisfaction.

**Why rejected stays queued:** rejection is a human gate outcome, not an execution outcome. Forcing `failed` here would pollute retry behavior and blur audit semantics.

## Flow Registry and Fixture Strategy

Phase 45 already gives the UI enough source data to seed realistic tasks without inventing backend infrastructure.

Recommended fixture approach:

- Build `task-fixtures.ts` from a small curated subset of `contracts/flow-registry.json`, not all 17 flows at once.
- Use 2 to 3 representative operator tasks composed from the Phase 45 canonical flows:
  - Intake and approval path using `F-01`, `F-02`, `F-03`
  - Reporting/health path using `F-05`, `F-09`
  - Operations/migration path using `F-08` for future guardrail continuity, but only as a passive task in Phase 46
- Carry Phase 45 visual metadata into step cards:
  - domain badge
  - flow type badge
  - SLO tier chip
  - flow ID label

This keeps the MVP concrete and auditable while avoiding a fake “all flows are executable” surface before later phases exist.

## MarkOSDB / Event Store Alignment Without Real Schema Yet

The roadmap says “Task state mutations persist to MarkOSDB (audit trail via Event Store pattern),” but Phase 46 context explicitly defers real schema materialization and Supabase wiring. The correct interpretation is contract-first, adapter-later.

### What Phase 46 should do

- Define task, step, evidence, approval, retry, and event types that already look like future rows.
- Store an append-only `taskEvents` array in memory with stable fields such as `event_id`, `task_id`, `step_id`, `event_name`, `occurred_at`, `actor_id`, `payload`.
- Keep all reducer mutations funneled through helper functions that produce both the next snapshot and the event record.
- Seed fixtures with realistic `created_at`, `updated_at`, and `flow_id` fields from Phase 45 artifacts.

### What Phase 46 must not do

- No Supabase schema or migration work.
- No OpenAPI generation for task APIs.
- No contract CI gates.
- No server-enforced immutability or RLS work.

### Why this satisfies the roadmap

It makes the route components consume an interface that is already persistence-ready. Later phases only replace the provider implementation and persistence adapter; they do not redesign the UI model.

## RBAC, Navigation, and Telemetry Integration

### RBAC and nav

Required integration changes:

- Extend `RouteKey` with `"operations"` in `lib/markos/rbac/policies.ts`.
- Add `operations: ["owner", "operator"]` to `routePermissions`.
- Add a nav item in `app/(markos)/layout.tsx` that points to the operations surface and uses `route: "operations"`.
- Do not add `strategist`, `viewer`, or `agent` access in this phase.

### Telemetry

Extend `lib/markos/telemetry/events.ts` with:

- `markos_task_step_executed`
- `markos_task_step_approved`
- `markos_task_step_rejected`
- `markos_task_step_retried`

Telemetry payload guidance:

- Include `task_id`, `step_id`, `flow_id`, `state`, `retry_count`, `requires_approval`, `first_task`.
- Include `evidence_present` and simple counts such as `log_count`; do not emit raw evidence bodies unless already sanitized.
- Always call `buildEvent()` so `sanitizePayload()` handles token/secret/password redaction.
- If the UI wants to emit evidence-related telemetry, emit summaries or redacted snapshots only.

## Storybook and Test Strategy

### Storybook

Follow the existing co-located CSF3 pattern under `app/(markos)` with a single route-level story file:

- `Queued`
- `Approved`
- `Executing`
- `Completed`
- `Failed`

Recommendations:

- Use shared fixture factories from `task-fixtures.ts` so stories and reducer tests stay aligned.
- Keep the route story deterministic: fixed timestamps, stable IDs, fixed logs.
- Add `unauthorized` and `forbidden` views only if the route composition ends up rendering them; they are still useful under Phase 38 gate patterns, but the locked requirement for Phase 46 is the 5 task states.

### Tests under `test/ui-operations/`

Because the repo already uses `node:test` and does not include React Testing Library, the best Phase 46 test design is logic-first and contract-first.

Recommended files:

- `test/ui-operations/task-machine.test.js`
  - imports reducer helpers and verifies atomic transitions
  - asserts timestamps/logs are written per transition
- `test/ui-operations/approval-gate.test.js`
  - verifies blocked execution before approval
  - verifies rejection reason capture and queued-state retention
- `test/ui-operations/retry-flow.test.js`
  - verifies retry attempt append-only logging and approval reset rules
- `test/ui-operations/evidence-panel.test.js`
  - verifies evidence shape presence and ≥95% completeness across fixtures
- `test/ui-operations/task-route-contract.test.js`
  - verifies story file exists with 5 required stories
  - verifies RBAC route key and telemetry event names were added

**Why this is the right test posture:** it fits the existing repo, avoids adding browser test dependencies, and gives downstream phases a stable logic contract.

## Common Pitfalls

### Pitfall 1: Modeling rejection as a step execution state

**What goes wrong:** rejected approvals get stored as `failed`, which breaks retry semantics and confuses audit meaning.

**Control:** keep approval as a separate object; rejected steps remain `queued`.

### Pitfall 2: Letting components mutate evidence directly

**What goes wrong:** drawer UI starts acting like an editor, violating D-10 and making later server immutability harder.

**Control:** evidence remains reducer-owned and `Readonly` in UI props.

### Pitfall 3: Overwriting retry history

**What goes wrong:** the last retry hides prior attempts, so audit history is incomplete.

**Control:** retry attempts are append-only records with attempt numbers and timestamps.

### Pitfall 4: Coupling UI to future backend details too early

**What goes wrong:** page components embed assumptions about Supabase tables or API endpoints that Phase 46 does not own.

**Control:** keep backend alignment at the type/store boundary only.

### Pitfall 5: Emitting raw evidence into telemetry

**What goes wrong:** logs or payloads can leak tokens or operator-entered secrets.

**Control:** telemetry emits summaries or sanitized payloads only via `buildEvent()`.

### Pitfall 6: Introducing a graph layout abstraction prematurely

**What goes wrong:** a graph library complicates rendering, stories, and tests before there is real branching data.

**Control:** stay with numbered vertical step cards for the MVP.

## Recommended Plan Decomposition

Planner-friendly breakdown:

1. **Plan 46-01:** Operations route, nav, RBAC extension, and task type contracts.
2. **Plan 46-02:** Pure `task-machine` reducer, transition helpers, append-only task event model.
3. **Plan 46-03:** In-memory `task-store` provider and flow-registry-backed typed fixtures.
4. **Plan 46-04:** Task graph and step runner composition for sequential execution states.
5. **Plan 46-05:** Blocking approval modal and failed-step retry flow with input mutation handling.
6. **Plan 46-06:** Evidence drawer, immutable evidence rendering, and telemetry event integration.
7. **Plan 46-07:** Storybook state coverage and `test/ui-operations/` contract suite.

This is the right granularity because it separates store logic from presentation, isolates approval/retry complexity, and lets verification land with the route surface rather than as an afterthought.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js app, Storybook build, node:test | ✓ | `v22.13.0` | — |
| npm | script execution | ✓ | `10.9.2` | — |
| Storybook scripts (`storybook`, `build-storybook`) | UI state catalog and CI | ✓ | configured in `package.json` | — |
| Chromatic token | CI publish only | partial | `CHROMATIC_PROJECT_TOKEN` external secret | Local `npm run build-storybook` remains sufficient during implementation |

**Missing dependencies with no fallback:**
- None for local implementation and test work.

**Missing dependencies with fallback:**
- Chromatic publish approval depends on CI secret configuration, but local development can still validate via Storybook build and node:test suites.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none |
| Quick run command | `node --test test/ui-operations/**/*.test.js` |
| Full suite command | `npm test && npm run test:ui-all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | Task graph renders the 5 required states from stable fixtures | story contract + logic | `node --test test/ui-operations/task-route-contract.test.js` | ❌ Wave 0 |
| OPS-02 | Step transitions are atomic and timestamp/log aware | reducer unit | `node --test test/ui-operations/task-machine.test.js` | ❌ Wave 0 |
| OPS-03 | Approval blocks execution until decision is recorded | reducer/unit contract | `node --test test/ui-operations/approval-gate.test.js` | ❌ Wave 0 |
| OPS-04 | Retry logs attempts and supports input mutation safely | reducer unit | `node --test test/ui-operations/retry-flow.test.js` | ❌ Wave 0 |
| OPS-05 | Evidence drawer data meets completeness and immutability contract | fixture/contract | `node --test test/ui-operations/evidence-panel.test.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test test/ui-operations/**/*.test.js`
- **Per wave merge:** `npm run build-storybook && node --test test/ui-operations/**/*.test.js`
- **Phase gate:** `npm test && npm run test:ui-all`

### Wave 0 Gaps

- [ ] `test/ui-operations/task-machine.test.js` — reducer transition and event log coverage
- [ ] `test/ui-operations/approval-gate.test.js` — blocking modal semantics and reject reason capture
- [ ] `test/ui-operations/retry-flow.test.js` — retry attempt append-only behavior
- [ ] `test/ui-operations/evidence-panel.test.js` — evidence completeness threshold and read-only contract
- [ ] `test/ui-operations/task-route-contract.test.js` — story, RBAC, and telemetry wiring verification

## Sources

### Primary (HIGH confidence)

- Live phase contract: `.planning/phases/46-operator-task-graph-ui-mvp/46-CONTEXT.md`
- Requirement source: `.planning/REQUIREMENTS.md`
- Milestone framing: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/v3.1.0-ROADMAP.md`, `.planning/MILESTONE-CONTEXT.md`
- Flow/UI foundations: `.planning/FLOW-CONTRACTS.md`, `.planning/FLOW-INVENTORY-MOCKUP.md`, `contracts/flow-registry.json`
- App integration points: `app/(markos)/layout.tsx`, `app/(markos)/page.tsx`
- Runtime contracts: `lib/markos/rbac/policies.ts`, `lib/markos/telemetry/events.ts`, `lib/markos/theme/tokens.ts`
- UI governance baseline: `.planning/phases/38-ui-coverage-security-assurance/38-RESEARCH.md`, `.planning/phases/38-ui-coverage-security-assurance/38-CONTEXT.md`
- Story/test baseline: `package.json`, `app/(markos)/company/company.stories.tsx`, `test/ui-a11y/accessibility.test.js`, `test/ui-security/security.test.js`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - entirely sourced from the live repo and locked phase context.
- Architecture: HIGH - derived from locked Phase 46 decisions and current app/test/story patterns.
- Pitfalls: HIGH - directly driven by enum constraints, telemetry rules, and deferred backend scope.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 or until Phase 46 scope changes
