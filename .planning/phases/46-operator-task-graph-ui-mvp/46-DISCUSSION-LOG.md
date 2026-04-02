# Phase 46: Operator Task Graph UI (MVP) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02

---

## Gray Areas Discussed

All 5 gray areas were presented to the operator. For all 5, the operator selected "You decide" — delegating implementation choices fully to agent discretion.

---

### Area 1: Task Graph Visual Structure

**Question:** How should the task graph be structured visually?

| Option | Description |
|--------|-------------|
| Linear vertical step list *(selected via agent discretion)* | Numbered step cards with state badges. No graph library. |
| Horizontal flow with connectors | DAG-style nodes connected by lines/arrows. Requires diagram library. |
| Hybrid: compact header graph + expanded step list | Small DAG diagram at top + detailed step list below. |

**Decision:** Agent's discretion → linear vertical step list. No graph library required.

**Follow-up — parallel steps:** Agent's discretion → strictly sequential for MVP.

---

### Area 2: State Machine Approach

**Question:** How should the 5-state machine be implemented?

| Option | Description |
|--------|-------------|
| XState | Explicit states, guarded transitions, actor model. Adds dependency. |
| useReducer + enum *(selected via agent discretion)* | Built-in React, zero deps, consistent with codebase style. |
| Custom state object | Plain object mutations in handlers. |

**Decision:** Agent's discretion → `useReducer` + `TaskStepState` enum.

---

### Area 3: Data Connectivity for MVP

**Question 1:** Where does task state live for the Phase 46 MVP?

| Option | Description |
|--------|-------------|
| Mock / in-memory *(selected via agent discretion)* | React Context + typed fixtures. Zero backend work in Phase 46. |
| Supabase realtime | Requires creating DB schema in this phase. |
| Polling the API | Simpler than realtime but still needs backend. |

**Decision:** Agent's discretion → in-memory React Context for MVP.

**Question 2:** Should Phase 46 create the task_executions schema or defer?

| Option | Description |
|--------|-------------|
| Real DB schema in this phase | Ship real persistence now. |
| Stub contract, defer schema *(selected via agent discretion)* | Typed fixtures define shape; real schema in Phase 47/48. |

**Decision:** Agent's discretion → stub typed contract, defer Supabase schema to Phase 47/48.

---

### Area 4: Approval Gate UX

**Question 1:** How should the approval checkpoint block execution?

| Option | Description |
|--------|-------------|
| Blocking modal dialog *(selected via agent discretion)* | Focus-trapped, dismissed only by Approve/Reject. Accessible. |
| Inline expansion | Step row expands to reveal controls. No modal. |
| Full-screen overlay | Replaces task view until decision recorded. |

**Decision:** Agent's discretion → blocking modal dialog.

**Question 2:** Is the rejection reason field required or optional?

| Option | Description |
|--------|-------------|
| Required | Operator must enter reason to reject. |
| Optional *(selected via agent discretion)* | Field shown but skippable. |

**Decision:** Agent's discretion → optional rejection reason.

---

### Area 5: Evidence Panel Placement

**Question 1:** Where should the immutable evidence panel appear?

| Option | Description |
|--------|-------------|
| Right sidebar drawer *(selected via agent discretion)* | Slides open on step click. No navigation change. |
| Collapsible bottom panel | Expands below step list. |
| Dedicated evidence route | Separate /operations/tasks/[id]/evidence. |

**Decision:** Agent's discretion → right sidebar drawer.

**Question 2:** What does "immutable post-execution" mean for Phase 46?

| Option | Description |
|--------|-------------|
| UI-only immutability *(selected via agent discretion)* | Read-only rendered fields. No server enforcement in Phase 46. |
| Server-enforced | RLS policy or API guard. |

**Decision:** Agent's discretion → UI-only read-only rendering. Server protection deferred to Phase 48.

---

## Summary

The operator delegated all implementation decisions to agent discretion. Context.md captures the agent-selected defaults with rationale for each choice.
