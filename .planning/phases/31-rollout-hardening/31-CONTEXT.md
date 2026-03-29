# Phase 31 - Rollout Hardening (P2)
## CONTEXT.md - Locked Planning Context

**Phase:** 31
**Milestone:** v2.2
**Status:** Planned - ready for execution
**Created:** 2026-03-28
**Depends on:** Phase 30 completion

---

## Phase Objective

Prepare MarkOS for agency-wide rollout through reliability SLOs, migration safety controls, security/compliance guardrails, and explicit compatibility deprecation policy.

---

## Scope (Locked)

1. Operational SLOs and observability dashboards for critical onboarding endpoints.
2. Migration readiness controls including dry-run, rollback toggles, and verification reports.
3. Security hardening for secrets, log redaction, and retention policy enforcement.
4. Compatibility deprecation progression for legacy MARKOS surfaces.

---

## Done Definition

- Endpoint reliability is measurable and monitored.
- Migration can be rolled out and rolled back safely.
- Sensitive data handling is enforceable and documented.
- Legacy compatibility retirement criteria are published and testable.

---

## Discussed Decisions (2026-03-28)

### SLO Policy Thresholds

- **D-31-01:** Use a tiered SLO model by endpoint criticality rather than a single uniform objective.
- **D-31-02:** Keep `/submit` and `/approve` as highest-criticality rollout gates; apply relatively looser objectives to `/linear/sync` and `/campaign/result` while preserving alert visibility.

### Migration Safety Mode Transitions

- **D-31-03:** Use strict phased promotion: `dry-run -> dual-write -> cloud-primary`.
- **D-31-04:** Every mode transition requires explicit owner sign-off and a rollback-ready checkpoint.

### Security and Retention Boundaries

- **D-31-05:** Enforce strict production policy now across rollout environments: fail-fast secret validation, mandatory log redaction, and fixed retention bounds.

### Compatibility Deprecation Gates

- **D-31-06:** Use manual operator discretion for compatibility retirement decisions.
- **D-31-07:** No hard minimum evidence gate is required prior to retiring a legacy MARKOS surface.

### the agent's Discretion

- Translate the tiered SLO policy into concrete threshold numbers per endpoint during planning/execution.
- Define owner assignment and handoff mechanics for each migration mode transition.

---

## Canonical References

Downstream agents should read these before replanning or implementation.

- `.planning/ROADMAP.md` (Phase 31 section and compatibility retirement gates)
- `.planning/phases/31-rollout-hardening/31-REQUIREMENTS.md`
- `.planning/phases/31-rollout-hardening/31-RESEARCH.md`
- `.planning/phases/31-rollout-hardening/31-VERIFICATION.md`
- `onboarding/backend/agents/telemetry.cjs`
- `onboarding/backend/runtime-context.cjs`
- `onboarding/backend/handlers.cjs`
- `test/onboarding-server.test.js`
- `test/protocol.test.js`

---

## Existing Code Insights

### Reusable Assets

- `onboarding/backend/agents/telemetry.cjs` already constrains execution checkpoint events and can anchor rollout observability instrumentation.
- `onboarding/backend/runtime-context.cjs` already centralizes hosted auth policy and scoped-access enforcement.

### Established Patterns

- Hosted-mode policy enforcement is implemented at API-wrapper boundaries.
- Migration behavior and replay safety are validated via deterministic test assertions in onboarding server tests.

### Integration Points

- `/submit`, `/approve`, `/linear/sync`, and `/campaign/result` route handlers plus telemetry capture.
- Compatibility retirement checks remain anchored to protocol and onboarding suites.
