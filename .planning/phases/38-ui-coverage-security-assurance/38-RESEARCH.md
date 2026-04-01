---
phase: 38
phase_name: UI Coverage and Security Assurance
milestone: v2.6
milestone_name: Post-Deployment Operations and Beta Activation
researched: "2026-04-01"
domain: Storybook + Chromatic UI quality system, security and release-gate validation
confidence: HIGH
---

# Phase 38: UI Coverage and Security Assurance - Research

**Researched:** 2026-04-01  
**Domain:** Component-state cataloging, visual regression governance, accessibility and security gate architecture for MarkOS app surfaces  
**Confidence:** HIGH

## Summary

Phase 38 should convert the Phase 37 UI foundation into a continuously verified quality system. The primary outcome is not only adding Storybook and Chromatic; it is creating a gate-driven control layer where every UI change is measurable, reviewable, and blocked from merge when quality or security evidence is incomplete.

The repository currently has route-level scaffolding under `app/(markos)` and governance contracts in `lib/markos` (theme, RBAC, telemetry), but no Storybook/Chromatic footprint. That means Phase 38 starts from zero instrumentation and must establish both broad coverage and enforceable CI policy.

The highest leverage design is a five-dimensional coverage model:
1. State coverage (loading, empty, success, error, unauthorized, forbidden).
2. Interaction coverage (create/edit/delete/cancel/retry/navigation/confirm).
3. Role coverage (admin/operator/read-only/unauthorized).
4. Viewport coverage (mobile/tablet/desktop).
5. Theme coverage (default + white-label variants).

Security and assurance should be implemented as mandatory gates with clear evidence output, not best-effort checks. "100% secure and checked" for this phase is interpreted as 100% required gate coverage for all UI-impacting changes.

---

## Competitive Landscape

### 1. Storybook-first teams in SaaS control planes

- Strengths:
  - Shared component and state documentation for engineering, design, and QA.
  - Faster regression detection before runtime E2E failures.
- Weaknesses:
  - Coverage inflation risk (many stories, weak assertions).
  - Story drift if stories are not tied to route-level scenarios and role constraints.

**Opportunity for MarkOS:** treat Storybook as a contract surface tied to role and governance states, not a visual gallery.

### 2. Chromatic-governed PR workflows

- Strengths:
  - Deterministic visual diff review in pull requests.
  - Audit trail of approved baseline updates.
- Weaknesses:
  - Noise from nondeterministic stories (time, random IDs, unstable network mocks).
  - Teams can normalize "approve all" behavior without ownership policy.

**Opportunity for MarkOS:** enforce deterministic fixtures and code-owner approvals for governance-critical routes.

### 3. Typical gap in early-stage products

- Storybook coverage often excludes role boundaries and forbidden/unauthorized render states.
- Security checks focus on backend only, leaving UI leakage paths untested.
- Accessibility checks are informational rather than merge-blocking.

**Opportunity for MarkOS:** make accessibility and UI security checks first-class release blockers.

### Strategic readout

The competitive edge is not merely adopting Storybook and Chromatic. It is combining them with RBAC-aware scenarios, telemetry redaction validation, and protected-branch required checks so UI governance is operationally enforced.

---

## Audience Intelligence

### Primary internal users for this phase

1. Frontend engineer
- Needs deterministic local story environment and fast visual confidence in PRs.
- Pain: regressions discovered late in integration or production.

2. Product/design reviewer
- Needs clear visual diff evidence and route-level state parity before approval.
- Pain: screenshot-based manual reviews without baseline control.

3. QA/reliability owner
- Needs measurable coverage and hard pass/fail gates.
- Pain: test suites that pass while critical states remain untested.

4. Security/governance owner
- Needs confidence that UI state rendering does not bypass role boundaries or leak sensitive values.
- Pain: backend-only security posture with unverified frontend behavior.

### Behavioral requirements extracted from current context

- Coverage must include all Phase 37 route surfaces, not only shared components.
- White-label theme variants from token/brand-pack contracts must be testable in stories.
- Telemetry payloads triggered from UI interactions must remain redaction-safe.
- UI-impacting PRs must fail fast if visual, accessibility, or security gates are missing.

---

## Channel Benchmarks

Benchmarks below map CI/QA channels to measurable targets for this phase.

| metric | industry avg | target |
|---|---|---|
| Story coverage of reusable UI components | 60-80% | 100% |
| Route-level story coverage for critical product surfaces | 30-60% | 100% |
| Visual regression detection pre-merge | 70-90% | 100% of UI-touching PRs |
| Chromatic false-positive rate | 15-30% | under 8% |
| PR turnaround delay caused by visual checks | 15-40 min | under 15 min median |
| Accessibility violations per release candidate | 5-20 | 0 critical, 0 serious |
| Role-boundary UI regression escape rate | occasional | 0 tolerated |
| Time to identify root-cause for UI regressions | 2-8 hours | under 30 min |
| Required checks coverage on protected branches | 60-85% | 100% |
| Flaky UI test rate (7-day rolling) | 5-15% | under 2% |

---

## Recommended Approach

### 1. Coverage architecture

- Create a Storybook taxonomy aligned to product modules:
  - Foundation (tokens/theme primitives)
  - Shared UI components
  - Domain components
  - Route compositions mirroring `app/(markos)`
- For every critical story group, include state and role matrices, not only happy-path variants.

### 2. Determinism strategy for visual quality

- Use fixed fixtures and stable IDs.
- Freeze time/date in stories that display temporal data.
- Mock network responses with deterministic data snapshots.
- Remove randomness from loaders and generated labels during snapshot runs.

### 3. CI gating policy

- Require Storybook build and Chromatic checks for PRs that touch:
  - `app/**`
  - `lib/markos/**`
  - design token/theming files
- Add required accessibility check in CI (Storybook-integrated axe pipeline).
- Enforce required status checks on protected branches.

### 4. Security-by-UI testing

- Add explicit test scenarios for:
  - unauthorized and forbidden route rendering
  - role-based action visibility and disabled states
  - safe rendering of user-provided text (no unsafe HTML execution paths)
  - telemetry payload redaction conformance for UI-triggered events
- Validate no client exposure of secrets or restricted env values in rendered UI state.

### 5. Operational workflow

- Code-owner policy for snapshot approvals on governance-critical pages.
- PR template section that links visual diffs and coverage evidence.
- Weekly quality drift review: flaky tests, top regression categories, unowned story gaps.

---

## Platform Capabilities and Constraints

### Existing capabilities to leverage

- Phase 37 route surfaces already exist under `app/(markos)` and can map directly to route stories.
- Theming contracts in `lib/markos/theme/tokens.ts` and `lib/markos/theme/brand-pack.ts` support variant testing.
- RBAC policy helpers in `lib/markos/rbac/policies.ts` provide role-state scenario inputs.
- Telemetry contracts in `lib/markos/telemetry/events.ts` provide a redaction-compatible test target.

### Constraints

1. No Storybook/Chromatic setup currently exists, so bootstrap cost is real in this phase.
2. Visual checks can become noisy unless deterministic data and frozen clocks are enforced from day one.
3. Security assertions for UI behaviors must be explicit; unit snapshots alone are insufficient.
4. Phase 38 should avoid broad backend migrations and remain focused on UI assurance surfaces.

### Technical posture recommendation

- Prefer CSF3 stories with typed args and reusable scenario factories.
- Add Storybook test runner + accessibility addon in CI.
- Integrate Chromatic with branch protection checks and code-owner review requirements.
- Add lightweight UI security tests around role visibility and unsafe content rendering paths.

---

## Tracking Requirements

Track both engineering quality and governance outcomes.

| event | required properties | purpose |
|---|---|---|
| `ui_story_rendered` | story_id, module, theme, viewport, role | Coverage observability and matrix completeness |
| `ui_visual_diff_detected` | pr_id, story_id, severity, module | Regression detection and trend analysis |
| `ui_visual_diff_approved` | pr_id, reviewer_role, critical_surface | Approval accountability |
| `ui_a11y_violation_detected` | story_id, rule_id, impact, count | Accessibility quality enforcement |
| `ui_role_gate_failed` | route, role, expected_state, actual_state | Permission-boundary assurance |
| `ui_unsafe_render_blocked` | component, payload_type, sanitizer_mode | Unsafe rendering defense evidence |
| `ui_security_check_failed` | check_name, module, pr_id | Merge-block reason clarity |
| `ui_release_gate_status` | pr_id, storybook, chromatic, a11y, security | Single-source release decision state |

### Required dimensions

- `pr_id`, `branch`, `route`, `module`, `story_id`, `role`, `theme`, `viewport`, `schema_version`.
- Never emit raw secrets, tokens, or unredacted sensitive strings.

---

## Risks and Pitfalls

1. Story count over quality
- Risk: many stories with shallow assertions create false confidence.
- Control: quality checklist per story family (state + interaction + role evidence).

2. Visual snapshot fatigue
- Risk: noisy diffs cause blind approvals.
- Control: deterministic fixtures, frozen time, and ownership policy for critical surfaces.

3. Security blind spot in frontend
- Risk: route guards and render-path behavior go untested.
- Control: dedicated UI security test suite with role and unsafe-input cases.

4. Accessibility as non-blocking signal
- Risk: violations accumulate across releases.
- Control: block merges on critical/serious violations.

5. Flaky gates slow delivery
- Risk: unstable checks reduce trust and are bypassed.
- Control: weekly flake triage and threshold-based CI health policy.

---

## Validation Architecture

### 1. Coverage validation (must-pass)

- Coverage matrix per critical route includes all five dimensions: state, interaction, role, viewport, theme.
- Route-level story index exists for all Phase 37 surfaces.
- Coverage report generated in CI and attached to PR artifacts.

### 2. Visual validation (must-pass)

- Chromatic baseline and diff checks run for all UI-impacting PRs.
- Intentional visual changes require reviewer approval and rationale.
- Snapshot noise budget monitored; threshold breach triggers remediation.

### 3. Accessibility validation (must-pass)

- Storybook accessibility checks run in CI for all critical stories.
- Release blocked on critical/serious violations.
- Keyboard/focus checks included for modal and form-heavy flows.

### 4. Security validation (must-pass)

- Role boundary assertions for unauthorized and forbidden states.
- Safe rendering tests for user-supplied strings and rich text surfaces.
- Secret exposure checks in client bundles and rendered output snapshots.
- Telemetry payload conformance checks against redaction contract behavior.

### 5. CI policy validation (must-pass)

- Protected branch requires Storybook, Chromatic, accessibility, and UI security checks.
- UI-touching PRs cannot merge with skipped or neutralized checks.
- Code-owner approvals required for governance-critical route visual changes.

### 6. Release readiness criteria

- 100% of defined critical surfaces have passing state-role-viewport-theme coverage.
- 0 unresolved critical/serious accessibility findings.
- 0 unresolved UI security gate failures.
- Visual baselines approved with audit trail for intentional diffs.

## RESEARCH COMPLETE
