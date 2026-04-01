# 32-03 Summary — Orchestrator and Admin Runtime

## Completed

- Added literacy retrieval observation in orchestrator:
  - `onboarding/backend/agents/orchestrator.cjs`
  - Optional `getLiteracyContext` fetch with telemetry capture
- Added secret-gated literacy admin handlers:
  - `handleLiteracyHealth`
  - `handleLiteracyQuery`
  - File: `onboarding/backend/handlers.cjs`
- Wired routes in server:
  - `GET /admin/literacy/health`
  - `POST /admin/literacy/query`
  - File: `onboarding/backend/server.cjs`
- Added onboarding tests for endpoint auth and diagnostics behavior.

## Verification

- `node --test test/onboarding-server.test.js`
  - Passed

## Notes

- Endpoints require `x-markos-admin-secret` and `MARKOS_ADMIN_SECRET`.
- Query response includes namespace/filter diagnostics and scored matches.
