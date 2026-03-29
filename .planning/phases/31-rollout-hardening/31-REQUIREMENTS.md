# Phase 31 Requirements - Rollout Hardening

## Requirement Set

- [x] **RLH-01**: Reliability and observability SLOs must exist for `/submit`, `/approve`, `/linear/sync`, and `/campaign/result`.
- [x] **RLH-02**: Migration readiness controls must support dry-run, dual-write, cloud-primary, and rollback-safe operation.
- [x] **RLH-03**: Security and compliance guardrails must enforce secret validation, log redaction, and retention boundaries.
- [x] **RLH-04**: Compatibility deprecation policy for legacy MARKOS surfaces must be explicit and operationally gated.

## Acceptance Matrix

| Requirement | Primary Files | Test Coverage Target |
|------------|---------------|----------------------|
| RLH-01 | `onboarding/backend/agents/telemetry.cjs`, dashboards/docs | telemetry and integration tests |
| RLH-02 | runtime/migration handlers + docs | migration mode tests |
| RLH-03 | runtime guards + logging paths + docs | security/redaction tests |
| RLH-04 | roadmap/requirements/docs + protocol checks | policy and guardrail tests |

## Validation Rule

Phase 31 is complete only when all RLH requirements are checked and verification evidence is captured in `31-VERIFICATION.md`.
