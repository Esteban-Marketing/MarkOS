# Phase 38 - UI Coverage and Security Assurance
## CONTEXT.md - Locked Planning Context

**Phase:** 38
**Milestone:** v2.4
**Status:** Discussed - ready for planning
**Created:** 2026-04-01
**Depends on:** Phase 37 completion (MarkOS UI control plane baseline)

---

## Phase Objective

Establish complete and scalable UI quality coverage for the MarkOS app using Storybook and Chromatic, with security controls and verification gates that make every UI change testable, reviewable, and auditable before merge.

---

## Scope (Locked)

1. Stand up Storybook as the canonical component and state catalog for all app routes introduced in Phase 37.
2. Integrate Chromatic visual regression checks into CI as a required status check for pull requests affecting UI.
3. Define a full UI coverage matrix: component states, interaction flows, accessibility variants, responsive breakpoints, and role-based authorization surfaces.
4. Define security validation for UI surfaces: auth state exposure checks, unsafe rendering checks, navigation/route guard checks, and telemetry redaction checks in UI-triggered events.
5. Introduce release gates that block merges when UI coverage, visual baselines, accessibility checks, or security checks fail.

---

## Done Definition

- Storybook stories exist for all reusable UI primitives and all route-level composed views in [app/(markos)](app/(markos)).
- Each story family includes critical state permutations: loading, empty, success, error, unauthorized, and destructive-action confirmation.
- Chromatic runs on every PR and is configured as a required check with reviewer sign-off on intentional visual diffs.
- Accessibility checks run in CI for Storybook-rendered states with enforced thresholds for violations.
- Security-oriented UI test cases cover:
  - unauthorized access behavior and route guard rendering
  - sanitization and safe rendering paths for user-controlled data
  - no secret/token leakage in UI, network payloads, logs, or telemetry
  - redaction contract compatibility with telemetry helpers in [lib/markos/telemetry/events.ts](lib/markos/telemetry/events.ts)
- Merge policy blocks deployment when any required UI quality or security check fails.

---

## Discussed Decisions (2026-04-01)

### Strategic Direction

- **D-38-01:** Use Storybook as the single source of truth for UI states to avoid drift between implementation and design intent.
- **D-38-02:** Use Chromatic snapshots as mandatory PR evidence for visual integrity across all user-facing changes.
- **D-38-03:** Treat route-level pages as first-class coverage targets, not only leaf components.

### Coverage Model

- **D-38-04:** Define "wide coverage" as 5 dimensions per surface: state, interaction, role, viewport, and theme.
- **D-38-05:** Require explicit stories and checks for critical operational surfaces from Phase 37:
  - [app/(markos)/company/page.tsx](app/(markos)/company/page.tsx)
  - [app/(markos)/mir/page.tsx](app/(markos)/mir/page.tsx)
  - [app/(markos)/msp/page.tsx](app/(markos)/msp/page.tsx)
  - [app/(markos)/icps/page.tsx](app/(markos)/icps/page.tsx)
  - [app/(markos)/segments/page.tsx](app/(markos)/segments/page.tsx)
  - [app/(markos)/campaigns/page.tsx](app/(markos)/campaigns/page.tsx)
  - [app/(markos)/settings/theme/page.tsx](app/(markos)/settings/theme/page.tsx)

### Security and Assurance Model

- **D-38-06:** "100% secure and checked" is implemented as 100% required security gates and evidence coverage for all UI changes, acknowledging that absolute security guarantees are not mathematically provable.
- **D-38-07:** Security checks must include static rules, dependency scanning, and UI-behavior tests for auth boundaries and unsafe rendering.
- **D-38-08:** No direct client-side exposure of sensitive configuration values; all environment access is reviewed with explicit allowlists.
- **D-38-09:** Telemetry from UI interactions must enforce redaction and event contract conformance before emit.

### CI Policy

- **D-38-10:** PRs touching [app](app), [lib/markos](lib/markos), or design tokens must run full Storybook build, Chromatic, accessibility, and security suites.
- **D-38-11:** Required checks must be non-optional for protected branches.
- **D-38-12:** Snapshot approvals require code-owner review when visuals change on governance-critical screens.

### the agent's Discretion

- Pick the Storybook structure (co-located stories vs centralized) based on lowest long-term maintenance cost.
- Select test runner composition (Storybook test runner plus Playwright/Cypress overlays) as long as coverage dimensions and gates are preserved.
- Propose pragmatic rollout sequencing if full backfill in one PR is operationally risky.

---

## Coverage Matrix Baseline (to lock in planning)

- **State coverage:** loading, empty, populated, validation error, server error, unauthorized, forbidden.
- **Interaction coverage:** create, edit, delete, cancel, retry, navigation transitions, modal confirmations.
- **Role coverage:** admin, operator, read-only viewer, unauthorized actor.
- **Responsive coverage:** mobile, tablet, desktop breakpoints.
- **Theme coverage:** default and white-label variants from [lib/markos/theme/tokens.ts](lib/markos/theme/tokens.ts) and [lib/markos/theme/brand-pack.ts](lib/markos/theme/brand-pack.ts).

---

## Risks and Controls

- **Risk:** Visual baseline noise causes alert fatigue.
  **Control:** Stable deterministic story data, frozen clocks, and mock network fixtures.
- **Risk:** Security checks focus only on backend.
  **Control:** Add UI-specific abuse-case tests (unsafe HTML, reflected input, permission boundary rendering).
- **Risk:** Coverage inflation without meaningful assertions.
  **Control:** Gate on scenario quality criteria, not only story count.

---

## Canonical References

- [.planning/ROADMAP.md](.planning/ROADMAP.md)
- [.planning/STATE.md](.planning/STATE.md)
- [.planning/phases/37-markos-ui-control-plane/37-SUMMARY.md](.planning/phases/37-markos-ui-control-plane/37-SUMMARY.md)
- [app/(markos)/layout.tsx](app/(markos)/layout.tsx)
- [app/(markos)/page.tsx](app/(markos)/page.tsx)
- [lib/markos/contracts/schema.ts](lib/markos/contracts/schema.ts)
- [lib/markos/rbac/policies.ts](lib/markos/rbac/policies.ts)
- [lib/markos/telemetry/events.ts](lib/markos/telemetry/events.ts)
- [lib/markos/theme/tokens.ts](lib/markos/theme/tokens.ts)
- [lib/markos/theme/brand-pack.ts](lib/markos/theme/brand-pack.ts)
- [supabase/migrations/37_markos_ui_control_plane.sql](supabase/migrations/37_markos_ui_control_plane.sql)

---

## Existing Code Insights

### Current Baseline

- The repository has app route scaffolding and domain/theme/security contracts from Phase 37.
- There is currently no Storybook or Chromatic configuration in the workspace, so Phase 38 starts from zero setup.

### Integration Points

- Route surfaces under [app/(markos)](app/(markos))
- Theme contract and white-label merge logic under [lib/markos/theme](lib/markos/theme)
- RBAC and telemetry governance under [lib/markos/rbac](lib/markos/rbac) and [lib/markos/telemetry](lib/markos/telemetry)

### Out of Scope (for discuss lock)

- Rebuilding route architecture from Phase 37
- Non-UI backend migrations unrelated to coverage/security gates
- Marketing campaign strategy changes not tied to UI quality assurance
