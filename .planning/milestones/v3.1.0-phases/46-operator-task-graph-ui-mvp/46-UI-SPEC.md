---
phase: 46
slug: operator-task-graph-ui-mvp
status: approved
reviewed_at: 2026-04-02T00:00:00Z
shadcn_initialized: false
preset: none
created: 2026-04-02
---

# Phase 46 - UI Design Contract

> Visual and interaction contract for the operator task execution surface. This phase evolves Phase 45 read-only inventory patterns into an auditable execution console for owner and operator roles.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual/token-based system preserved) |
| Preset | not applicable |
| Component library | existing MarkOS app primitives (no new library in this phase) |
| Icon library | existing app/Storybook icon usage only |
| Font | Body: Space Grotesk; Display: Sora |

Source notes:
- Gate decision locked: no shadcn initialization for Phase 46.
- Token baseline: lib/markos/theme/tokens.ts.
- Continuity target: 45-UI-SPEC.md and FLOW-INVENTORY-MOCKUP.md visual language.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Badge icon/text separation, inline log metadata separators |
| sm | 8px | Compact control groups, chip spacing, row micro-gaps |
| md | 16px | Default card padding, form control spacing, drawer section spacing |
| lg | 24px | Step card vertical rhythm, modal body padding |
| xl | 32px | Region gutters between list, runner panel, and evidence rail |
| 2xl | 48px | Page section separation (header to execution shell) |
| 3xl | 64px | Top-level page breathing room |

Exceptions:
- Minimum interactive target height is 44px for run, approve, reject, retry, and drawer-toggle actions.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

Rules:
- Exactly two weights only: 400 and 600.
- Step title uses Heading; step metadata and evidence key labels use Label.
- Logs and timestamps use Body size, not smaller than 14px, to preserve operator readability under pressure.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #f5f7fa | Workspace canvas, background behind execution regions |
| Secondary (30%) | #ffffff | Step cards, modal surface, evidence drawer panels |
| Accent (10%) | #0d9488 | Primary progression actions and active-progress signal only |
| Destructive | #dc2626 | Reject confirmation, failed step callouts, destructive warnings |

Accent reserved for:
- Primary CTA buttons: Run Step, Continue Execution
- Active step left rail indicator
- Approved and executing emphasis states in high-signal chips
- Completion progress meter for current task only

Operational semantic state colors:
- Queued: #64748b
- Approved: #0d9488
- Executing: #0ea5e9
- Completed: #22c55e
- Failed: #dc2626

Color behavior rules:
- Do not style all controls with accent; neutral controls use muted text and border tokens.
- Rejection state always uses destructive color family; never teal accent.
- Evidence immutability indicators use neutral-muted treatment, not success coloring.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Execute Task Step |
| Empty state heading | No operator task selected |
| Empty state body | Select a queued task from the list to review steps, approvals, and evidence before execution. |
| Error state | Task step update failed. Retry the action or reopen the task to restore the latest state snapshot. |
| Destructive confirmation | Reject step approval: Confirm rejection. Optional reason can be saved for audit context. |

Phase-specific copy rules:
- Use operational verbs: execute, approve, reject, retry, review evidence.
- Always include audit nouns in state-critical messages: actor, timestamp, evidence, decision.
- Rejection reason is optional in UI copy but rejection action must remain explicit and confirmable.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required (initialization explicitly declined) |
| third-party | none | not applicable |

Gate decision:
- components.json is absent and this phase is contract-locked to manual tokens and existing primitives.
- No third-party registry blocks are permitted in Phase 46.

---

## Phase-46 Interaction Contract (Operator Task Execution MVP)

This section is a locked implementation contract for planner and executor tasks.

### 1. Layout Regions (desktop-first, responsive collapse)

Required shell:
1. Left region (task list + step index): 30% width.
2. Center region (active step runner): 45% width.
3. Right region (evidence drawer rail): 25% width.

Responsive behavior:
- At tablet/mobile widths, right evidence drawer becomes an overlay drawer opened from center panel.
- Step list remains above runner on small screens, preserving sequential reading order.
- Region order must remain task list -> runner -> evidence to keep the audit path predictable.

### 2. Task List and Sequential Step Behavior

Locked behavior:
- Render a linear vertical step list (no graph library, no branching connectors).
- Each card shows: step number, step name, state badge, approval requirement marker, last actor, last timestamp.
- Strict sequential gating: only the current actionable step can trigger execution actions.
- Future steps are visibly disabled with explanatory helper text.
- Completed steps stay viewable and openable for evidence inspection; they are not editable.

### 3. Step State Badge Contract

Allowed UI states:
- queued
- approved
- executing
- completed
- failed

Badge rules:
- Badge text must match enum values exactly (lowercase).
- Badges are color coded with the semantic mapping defined in Color.
- State transitions are visually one-directional in timeline rendering.
- Rejection is not a step state badge; it is represented in approval metadata while step remains queued.

### 4. Approval Modal Contract

Locked modal behavior:
- Blocking, focus-trapped modal for approval-gated steps.
- Dismiss paths are only Approve or Reject (no passive close, no backdrop click escape).
- Reject flow includes optional reason field.
- Decision writes actor and timestamp metadata before execution can continue.
- After approval, the step can transition to approved/executing in sequence.
- After rejection, step remains queued and blocked until a subsequent approve decision.

### 5. Evidence Drawer Contract

Locked drawer behavior:
- Right-side drawer opens from step click without route navigation.
- Drawer is read-only for MVP (no editable controls).
- Required evidence sections in fixed order:
  1. Inputs
  2. Outputs
  3. Logs
  4. Timestamps (step_started_at, step_completed_at)
  5. Actor ID
- Drawer must show explicit immutable marker text for audit clarity.

### 6. Retry and Failure Interaction

Locked retry behavior:
- Retry action is available only on failed steps.
- Retry can include optional input mutation preview/edit in runner panel.
- Every retry is logged as a distinct attempt entry with timestamp and actor.
- If step requires approval and inputs are changed, approval gate must run again before execution.

### 7. Required UI States and Storybook Coverage

Phase 46 requires Storybook states for:
1. Queued
2. Approved
3. Executing
4. Completed
5. Failed

Additional required route states (implementation and testing):
- Loading
- Empty task selection
- Action error
- Access denied (non-owner/operator)

### 8. RBAC and Route Visibility

Locked access contract:
- Add operations route for owner and operator only.
- Tasks view inherits operations route guard.
- Unauthorized roles must see blocked access state and cannot interact with execution controls.

### 9. Telemetry UI Event Contract

UI interactions that must produce typed telemetry through sanitize/build helpers:
- step approved
- step rejected
- step executed
- step retried

Payload contract rules:
- Include task and step identifiers, actor role, and transition metadata.
- Evidence payload fields must be sanitized before emission.
- No raw unsanitized event dispatch is permitted.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved
