---
phase: 37
phase_name: MarkOS UI Control Plane + White-Label System
milestone: v2.4
milestone_name: Beta Client Onboarding
plan_created: "2026-04-01"
type: execute
wave: 1
depends_on:
  - 34-client-intake-sop-automation
  - 36-beta-program-operations
files_modified:
  - app/(markos)/layout.tsx
  - app/(markos)/page.tsx
  - app/(markos)/company/page.tsx
  - app/(markos)/mir/page.tsx
  - app/(markos)/msp/page.tsx
  - app/(markos)/icps/page.tsx
  - app/(markos)/segments/page.tsx
  - app/(markos)/campaigns/page.tsx
  - app/(markos)/settings/theme/page.tsx
  - lib/markos/contracts/schema.ts
  - lib/markos/contracts/snapshot.ts
  - lib/markos/theme/tokens.ts
  - lib/markos/theme/brand-pack.ts
  - lib/markos/rbac/policies.ts
  - lib/markos/telemetry/events.ts
  - supabase/migrations/37_markos_ui_control_plane.sql
  - .planning/phases/37-markos-ui-control-plane/37-PLAN.md
  - .planning/ROADMAP.md
  - .planning/STATE.md
autonomous: true
requirements:
  - BETA-01
  - PLG-01
  - DX-UI-01
  - DX-UI-02
  - OPS-GOV-01
  - AI-REPO-01
user_setup: []

must_haves:
  truths:
    - "MarkOS ships a production-ready Next.js control plane on top of existing Tailwind and Supabase infrastructure, not a prototype admin panel."
    - "All core strategy entities (Company, MIR, MSP, ICP, Segment, Campaign) are editable through governed draft-to-publish workflows with rollback."
    - "White-label behavior is design-token driven so design-system updates propagate consistently across all MarkOS surfaces."
    - "Role-scoped access and Supabase RLS boundaries prevent cross-tenant leakage by default."
    - "Every published artifact has a machine-readable contract snapshot so humans and AI agents consume one canonical source of truth."

  artifacts:
    - path: app/(markos)/layout.tsx
      provides: "Role-aware MarkOS app shell with workspace navigation, global search trigger, and module routing"
      sections:
        - "Dashboard"
        - "Company"
        - "MIR"
        - "MSP"
        - "ICPs"
        - "Segments"
        - "Campaigns"
        - "Documentation Twin"
        - "Settings"
    - path: lib/markos/contracts/schema.ts
      provides: "Typed canonical contracts for Company, MIR, MSP, ICP, Segment, Campaign, and publish metadata"
    - path: lib/markos/contracts/snapshot.ts
      provides: "Publish-time contract snapshot generation for AI retrieval and versioned diff workflows"
    - path: lib/markos/theme/tokens.ts
      provides: "Semantic design-token registry (color, type, spacing, radius, motion)"
    - path: lib/markos/theme/brand-pack.ts
      provides: "Tenant white-label token ingestion with contrast and accessibility guards"
    - path: lib/markos/rbac/policies.ts
      provides: "Role-based permission map aligned to workspace tenancy and publish actions"
    - path: supabase/migrations/37_markos_ui_control_plane.sql
      provides: "RLS-backed schema for UI entities, revision history, and audit logging"
    - path: lib/markos/telemetry/events.ts
      provides: "UX, governance, and leakage-observability event contract"

  key_links:
    - from: onboarding/backend/handlers/submit.cjs
      to: app/(markos)/company/page.tsx
      via: "Phase 34 intake payload becomes operator-editable Company records"
      pattern: "intake accepted -> company workspace hydrated -> guided edit/publish"
    - from: .planning/phases/36-beta-program-operations/36-METRICS.md
      to: app/(markos)/campaigns/page.tsx
      via: "beta operations KPIs become campaign dashboard baselines"
      pattern: "weekly cadence -> campaign panel -> execution deltas"
    - from: lib/markos/contracts/schema.ts
      to: lib/markos/contracts/snapshot.ts
      via: "single canonical schema powers both human UI and AI snapshots"
      pattern: "edit validated -> publish -> snapshot indexed"
---

# Phase 37: MarkOS UI Control Plane + White-Label System

## Objective

Plan and execute the MarkOS application layer so teams can safely view, edit, and govern Company, MIR, MSP, ICP, Segment, and Campaign data in a white-label, design-system-linked UI that is also AI-consumable.

## Purpose

Phase 34 and 36 established intake and operations contracts. Phase 37 productizes those contracts into an operator-facing control plane that reduces friction, reduces error rates, and prevents data leakage while preserving execution speed.

## Output

- Next.js MarkOS app shell with role-aware workspace navigation
- Governed CRUD + publish workflows for core marketing entities
- Design token + brand pack linkage for white-labeling
- Supabase schema and RLS policies for secure multitenant operations
- AI-ready artifact snapshots generated from canonical contracts
- Telemetry contract for UX quality, governance, and access safety

## Duration

Target: 2 execution waves
1. Foundation + secure data model
2. Product modules + publish/snapshot pipeline

---

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/34-client-intake-sop-automation/34-SUMMARY.md
@.planning/phases/36-beta-program-operations/36-SUMMARY.md
@.planning/phases/37-markos-ui-control-plane/37-RESEARCH.md

## Current Constraints

- Next.js, Tailwind, and Supabase are already established and must be used as-is.
- Existing intake/orchestration contracts must remain backward-compatible.
- White-label theming must be centralized in design tokens, not ad-hoc style overrides.
- AI and human consumers must read the same canonical schema surface.
- Leakage prevention requires layered controls: query, API, and UI states.

## Planning Guardrails

- No generic dashboard scaffolding without domain contracts.
- No direct service-role reads from client code.
- No publish action without audit log and revision metadata.
- No theme override that bypasses semantic tokens.
- No schema mutation without compatibility notes for existing agent flows.

</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Establish UI foundation, routing, and role shell</name>
  <files>app/(markos)/layout.tsx, app/(markos)/page.tsx, lib/markos/rbac/policies.ts</files>
  <action>Implement the MarkOS workspace shell with role-aware navigation, consistent page frame, and module route skeletons for Company, MIR, MSP, ICPs, Segments, Campaigns, and Settings. Enforce access by role at route boundaries and ensure unauthorized routes fail closed.</action>
  <acceptance_criteria>
    - All listed modules are reachable through one unified app shell.
    - Unauthorized roles cannot open restricted routes.
    - Route-level loading and error states are present and deterministic.
  </acceptance_criteria>
  <done>MarkOS has a coherent, secure foundation for all subsequent domain modules.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement canonical contracts and validated CRUD flows</name>
  <files>lib/markos/contracts/schema.ts, app/(markos)/company/page.tsx, app/(markos)/mir/page.tsx, app/(markos)/msp/page.tsx, app/(markos)/icps/page.tsx, app/(markos)/segments/page.tsx, app/(markos)/campaigns/page.tsx</files>
  <action>Define canonical typed schemas for each entity and implement create/read/update validation pipelines shared across UI and server mutations. Introduce guided forms with inline validation and autosave semantics for high-friction fields.</action>
  <acceptance_criteria>
    - Each entity has an explicit schema and validation pipeline.
    - Validation errors are field-specific and actionable.
    - Autosave and dirty-state indicators prevent silent data loss.
    - Existing intake data can be hydrated into editable entity views.
  </acceptance_criteria>
  <done>Operators can safely manage all critical strategy records through structured UX.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Ship white-label token architecture and theme controls</name>
  <files>lib/markos/theme/tokens.ts, lib/markos/theme/brand-pack.ts, app/(markos)/settings/theme/page.tsx</files>
  <action>Implement semantic design token registry and tenant brand pack ingestion. Add a theme management surface with live preview and hard guardrails for contrast and accessibility. Ensure all MarkOS components consume semantic tokens only.</action>
  <acceptance_criteria>
    - Theme changes propagate across all MarkOS routes in-session.
    - No hardcoded palette values remain in MarkOS UI modules.
    - Brand pack validation blocks inaccessible combinations.
    - Design-system token updates produce deterministic visual output.
  </acceptance_criteria>
  <done>MarkOS becomes truly white-label-ready and design-system-linked.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Add Supabase schema, RLS, revisions, and audit controls</name>
  <files>supabase/migrations/37_markos_ui_control_plane.sql, lib/markos/rbac/policies.ts</files>
  <action>Create or evolve Supabase tables for Company, MIR, MSP, ICP, Segment, Campaign, revision history, and audit logs. Apply strict workspace/role RLS rules. Add publish-state transitions with reviewer metadata and rollback references.</action>
  <acceptance_criteria>
    - All core entities enforce workspace isolation in RLS.
    - Publish, rollback, and permission events are audit logged.
    - Cross-tenant reads fail by policy at the DB layer.
    - Migration is backward compatible with current runtime surfaces.
  </acceptance_criteria>
  <done>Data governance and leakage controls are enforced as infrastructure, not convention.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 5: Implement AI documentation twin and telemetry contract</name>
  <files>lib/markos/contracts/snapshot.ts, lib/markos/telemetry/events.ts</files>
  <action>Generate canonical machine-readable snapshots on publish for all governed entities and expose retrieval-safe metadata for agent consumption. Add telemetry events for route performance, validation friction, publish transitions, and access denials.</action>
  <acceptance_criteria>
    - Every publish operation creates a versioned machine-readable snapshot.
    - Snapshot schema versions are explicit and queryable.
    - Telemetry captures validation failures, publish events, and access denials.
    - No raw secrets or PII payloads are emitted in telemetry.
  </acceptance_criteria>
  <done>Human and agent workflows converge on one governed, observable knowledge surface.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 6: Validate UX, security, and performance release gates</name>
  <files>app/(markos)/**, lib/markos/**, supabase/migrations/37_markos_ui_control_plane.sql</files>
  <action>Run contract, RLS, accessibility, and route performance validation. Verify end-to-end flows: intake-hydrated company edit, MIR publish, theme change propagation, and agent snapshot retrieval.</action>
  <acceptance_criteria>
    - Contract tests pass for all core entities.
    - RLS tests pass for all roles and workspace boundaries.
    - Accessibility checks meet WCAG AA for MarkOS routes.
    - Dashboard and editor routes meet agreed performance budgets.
  </acceptance_criteria>
  <done>Phase 37 can be executed and released with measurable quality and safety guarantees.</done>
</task>

</tasks>

<verification>
Execute validation in this order:

1. Contract and schema tests for Company, MIR, MSP, ICP, Segment, Campaign.
2. Supabase RLS tests for role and workspace isolation.
3. Route-level accessibility and performance checks.
4. End-to-end publish flow: UI edit -> publish -> snapshot generated -> retrieval verified.
5. Regression checks for Phase 34 intake compatibility and Phase 36 KPI continuity.
</verification>

<success_criteria>
- MarkOS has a governed UI surface for all core strategy and campaign entities.
- White-label token system is fully linked to design-system semantics.
- Leakage prevention is enforced by RLS + route-level role checks.
- AI snapshot pipeline is active and versioned.
- Operators can complete core workflows with low-friction, validated UX.
</success_criteria>

<output>
After completion, create .planning/phases/37-markos-ui-control-plane/37-SUMMARY.md.
</output>
