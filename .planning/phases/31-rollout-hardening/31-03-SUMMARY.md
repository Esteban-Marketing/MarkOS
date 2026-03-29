# 31-03 Summary

## One-liner
Centralized secret validation, sensitive-field redaction, and retention constants, then enforced them across rollout-sensitive handlers.

## Key Files
- onboarding/backend/runtime-context.cjs
- onboarding/backend/agents/telemetry.cjs
- onboarding/backend/handlers.cjs
- README.md
- TECH-MAP.md
- test/onboarding-server.test.js
- test/protocol.test.js

## Delivered
- Added `REQUIRED_SECRET_MATRIX`, `validateRequiredSecrets()`, `redactSensitive()`, and `RETENTION_POLICY`.
- Added hosted fail-fast secret checks (including `MARKOS_SUPABASE_AUD` policy for hosted read/write boundaries).
- Applied redaction before telemetry/error-path forwarding.
- Published fixed retention values `14/30/90` across docs and tests.

## Verification
- `node --test test/onboarding-server.test.js` (pass)
- `node --test test/protocol.test.js` (pass)
