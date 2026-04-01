---
phase: 38
phase_name: UI Coverage and Security Assurance
milestone: v2.6
milestone_name: Post-Deployment Operations and Beta Activation
plan_created: "2026-04-01"
type: execute
wave: 1
depends_on:
  - 37-markos-ui-control-plane
files_modified:
  - package.json
  - .storybook/main.ts
  - .storybook/preview.ts
  - .storybook/manager.ts
  - .storybook/test-runner.ts
  - .github/workflows/ui-quality.yml
  - .github/CODEOWNERS
  - app/(markos)/**/*.stories.tsx
  - lib/markos/theme/**/*.stories.tsx
  - lib/markos/rbac/**/*.stories.tsx
  - lib/markos/telemetry/**/*.stories.tsx
  - test/ui-security/**/*.test.js
  - test/ui-a11y/**/*.test.js
  - .planning/phases/38-ui-coverage-security-assurance/38-PLAN.md
autonomous: true
requirements:
  - BETA-01
  - PLG-01
user_setup: []

must_haves:
  truths:
    - "Storybook is the canonical UI state registry for all critical Phase 37 route surfaces and shared primitives."
    - "Chromatic visual diffs are required pull-request evidence for all UI-impacting changes."
    - "Accessibility and UI security checks are merge-blocking gates, not informational checks."
    - "Role-boundary and unsafe-render scenarios are explicitly tested in UI-level validation."
    - "Protected branch policy enforces 100% required-gate coverage for Storybook, Chromatic, accessibility, and UI security checks."

  artifacts:
    - path: .storybook/main.ts
      provides: "Storybook framework configuration, story globs, addon stack, and deterministic environment wiring"
    - path: .storybook/preview.ts
      provides: "Global decorators for theme, viewport, role context, and deterministic fixtures"
    - path: .github/workflows/ui-quality.yml
      provides: "CI release gates for Storybook build, Chromatic, accessibility checks, and UI security tests"
    - path: app/(markos)/**/*.stories.tsx
      provides: "Route and component story matrix across state, interaction, role, viewport, and theme"
    - path: test/ui-security/**/*.test.js
      provides: "UI-focused security regression coverage for auth boundaries, unsafe rendering, and secret exposure"
    - path: test/ui-a11y/**/*.test.js
      provides: "Automated accessibility enforcement for critical story scenarios"

  key_links:
    - from: lib/markos/rbac/policies.ts
      to: app/(markos)/**/*.stories.tsx
      via: "Role and permission states are represented in deterministic stories"
      pattern: "policy map -> role scenario factory -> authorized/unauthorized story variants"
    - from: lib/markos/theme/tokens.ts
      to: .storybook/preview.ts
      via: "Theme token variants drive story decorators and visual checks"
      pattern: "token set -> story decorator -> Chromatic baseline"
    - from: lib/markos/telemetry/events.ts
      to: test/ui-security/**/*.test.js
      via: "UI telemetry payloads are validated for redaction-safe event emission"
      pattern: "ui trigger -> telemetry payload -> redaction assertions"
---

# Phase 38: UI Coverage and Security Assurance

## Objective

Create a complete UI quality and security gate system for MarkOS using Storybook and Chromatic, ensuring every UI change is provably covered, reviewed, and blocked from merge when checks fail.

## Purpose

Phase 37 delivered UI surfaces and contracts. Phase 38 operationalizes continuous assurance so those surfaces remain stable, accessible, and secure as velocity increases.

## Output

- Storybook infrastructure with deterministic configuration and reusable test decorators.
- Route-level and component-level story coverage for critical MarkOS app modules.
- Chromatic visual regression checks integrated as required PR status checks.
- Accessibility and UI security test suites with merge-blocking CI gates.
- Branch-policy-ready quality workflow for enforceable release decisions.

## Duration

Target: 2 execution waves
1. Toolchain bootstrap + baseline story matrix
2. Gate hardening + role/security/accessibility enforcement

---

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/37-markos-ui-control-plane/37-SUMMARY.md
@.planning/phases/38-ui-coverage-security-assurance/38-CONTEXT.md
@.planning/phases/38-ui-coverage-security-assurance/38-RESEARCH.md

## Current Constraints

- No existing Storybook or Chromatic setup is present; this phase starts from zero tooling footprint.
- Coverage must include route-level app surfaces, not only reusable leaf components.
- Visual diff noise must be controlled through deterministic fixtures and clock stabilization.
- Security posture must include frontend behavior checks, not backend-only controls.
- CI gates must be enforceable on protected branches.

## Planning Guardrails

- No ad hoc visual QA outside Storybook + Chromatic evidence.
- No UI gate can remain optional for UI-impacting pull requests.
- No story may rely on nondeterministic data for baseline snapshots.
- No role-gated route may be shipped without authorized and unauthorized scenario coverage.
- No telemetry emission from UI tests may include unredacted sensitive values.

</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Bootstrap Storybook with deterministic global configuration</name>
  <files>package.json, .storybook/main.ts, .storybook/preview.ts, .storybook/manager.ts, .storybook/test-runner.ts</files>
  <action>Install and configure Storybook with TypeScript support, test runner integration, accessibility tooling, and deterministic global decorators. Add shared providers for theme variants, viewport presets, and role-context injection used by all MarkOS UI stories.</action>
  <acceptance_criteria>
    - Storybook starts and builds successfully in CI mode.
    - Deterministic story decorators freeze date/time and stable fixture seeds.
    - Accessibility addon is active and visible in Storybook UI.
    - Test runner executes against Storybook-generated stories without runtime errors.
  </acceptance_criteria>
  <done>Storybook foundation is production-ready and stable for snapshot-based governance.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build canonical coverage matrix for critical MarkOS route surfaces</name>
  <files>app/(markos)/**/*.stories.tsx</files>
  <action>Create route-level story sets for Company, MIR, MSP, ICPs, Segments, Campaigns, and Theme Settings covering required state and role scenarios. Include explicit variants for loading, empty, success, error, unauthorized, and forbidden states, plus key interaction states where applicable.</action>
  <acceptance_criteria>
    - Every critical route from Phase 37 has at least one story file.
    - Each route includes required state variants: loading, empty, success, error, unauthorized, forbidden.
    - Each route includes mobile, tablet, and desktop viewport snapshots.
    - Story metadata clearly maps each story to module, role, and state dimensions.
  </acceptance_criteria>
  <done>Route-level coverage is complete and auditable across the defined quality dimensions.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add theme and design-token variant stories for white-label assurance</name>
  <files>lib/markos/theme/**/*.stories.tsx, app/(markos)/**/*.stories.tsx</files>
  <action>Implement story variants that exercise default and white-label brand-pack themes using token-driven decorators. Verify component and route rendering parity under both theme contexts and include contrast-sensitive states for validation.</action>
  <acceptance_criteria>
    - Default and white-label variants are rendered for critical routes/components.
    - Token changes propagate consistently across all themed story snapshots.
    - Contrast-sensitive variants are included for navigation, forms, and status indicators.
    - No hardcoded palette fallback is required for stories to render correctly.
  </acceptance_criteria>
  <done>White-label behavior is visually and functionally validated through repeatable story evidence.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Integrate Chromatic as required visual regression gate</name>
  <files>package.json, .github/workflows/ui-quality.yml, .github/CODEOWNERS</files>
  <action>Configure Chromatic to run on UI-impacting pull requests and publish visual diffs for Storybook stories. Add required status-check policy support and define code-owner review responsibilities for governance-critical route visual changes.</action>
  <acceptance_criteria>
    - Chromatic runs on pull requests that touch app or MarkOS UI contract paths.
    - Visual diffs are posted to PRs with pass/fail status.
    - Governance-critical routes require explicit reviewer approval when diffs exist.
    - UI PRs cannot be merged when Chromatic check fails.
  </acceptance_criteria>
  <done>Visual regressions are consistently detected and blocked before merge.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 5: Enforce accessibility gate with blocking thresholds</name>
  <files>test/ui-a11y/**/*.test.js, .github/workflows/ui-quality.yml</files>
  <action>Add accessibility tests for high-impact stories and configure CI to fail on critical or serious violations. Cover keyboard navigation and focus states for forms, modal confirmations, and route transitions used in MarkOS workflows.</action>
  <acceptance_criteria>
    - Accessibility suite runs in CI against Storybook stories.
    - Zero critical and zero serious violations are required to pass.
    - Keyboard/focus flows are validated for modal and form-heavy stories.
    - Accessibility failure blocks merge on protected branches.
  </acceptance_criteria>
  <done>Accessibility compliance becomes an enforceable release condition.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 6: Implement UI-focused security regression suite</name>
  <files>test/ui-security/**/*.test.js, app/(markos)/**/*.stories.tsx</files>
  <action>Create UI security tests for unauthorized access rendering, role-restricted action visibility, unsafe user-input rendering paths, and client-visible secret leakage checks. Include scenario fixtures that emulate adversarial input in components and route shells.</action>
  <acceptance_criteria>
    - Unauthorized and forbidden rendering behavior is asserted for critical routes.
    - Role-restricted actions are hidden or disabled according to policy expectations.
    - Unsafe HTML or script-like payloads are rendered safely as inert content.
    - Secret/token leakage checks pass for story snapshots and tested UI output.
  </acceptance_criteria>
  <done>Frontend security behavior is explicitly tested and regression-resistant.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 7: Validate telemetry redaction compatibility for UI-triggered events</name>
  <files>lib/markos/telemetry/**/*.stories.tsx, test/ui-security/**/*.test.js</files>
  <action>Add test scenarios that trigger UI telemetry events and assert payload conformance with redaction and contract rules. Validate that event fields include required dimensions while excluding sensitive raw values.</action>
  <acceptance_criteria>
    - UI-triggered telemetry tests verify required properties: route, module, role, viewport, theme.
    - Sensitive values are redacted or omitted according to telemetry contract rules.
    - Redaction failures produce clear CI error output with event name context.
    - Telemetry assertions run in the same UI quality workflow as visual and security checks.
  </acceptance_criteria>
  <done>Telemetry observability remains useful without violating data safety controls.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 8: Deliver protected-branch-ready gate workflow and coverage report</name>
  <files>.github/workflows/ui-quality.yml, .planning/phases/38-ui-coverage-security-assurance/38-PLAN.md</files>
  <action>Finalize unified CI workflow producing one gate report for Storybook build, Chromatic status, accessibility results, and UI security outcomes. Define merge policy checklist and output artifacts that make release decisions auditable.</action>
  <acceptance_criteria>
    - One CI workflow reports pass/fail for all required UI gates.
    - Coverage report indicates route/module/state-role-viewport-theme completeness.
    - Branch protection can enforce required checks without manual exceptions.
    - Release checklist clearly states no-merge conditions for each gate category.
  </acceptance_criteria>
  <done>UI assurance is operationalized as an enforceable, auditable merge policy.</done>
</task>

</tasks>

<verification>
Execute validation in this order:

1. Storybook build and smoke run for all configured stories.
2. Coverage matrix check across critical Phase 37 route surfaces and state-role-theme-viewport dimensions.
3. Chromatic visual regression run with deterministic baseline verification.
4. Accessibility suite with blocking severity thresholds.
5. UI security suite for auth boundaries, unsafe rendering, and secret leakage.
6. Telemetry redaction assertions for UI-triggered event payloads.
7. Protected-branch check simulation confirming required gate behavior.
</verification>

<success_criteria>
- Storybook and Chromatic are fully integrated into the MarkOS UI development lifecycle.
- Coverage is complete for critical route surfaces and required scenario dimensions.
- Accessibility and security are enforced as non-optional merge gates.
- UI regressions are detected before merge with deterministic, low-noise evidence.
- Gate outputs are auditable and ready for protected-branch policy enforcement.
</success_criteria>

<output>
After completion, create .planning/phases/38-ui-coverage-security-assurance/38-SUMMARY.md.
</output>
