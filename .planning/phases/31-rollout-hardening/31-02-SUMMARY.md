# 31-02 Summary

## One-liner
Implemented strict migration promotion controls for `dry-run -> dual-write -> cloud-primary` using machine-readable checkpoint records.

## Key Files
- onboarding/backend/runtime-context.cjs
- onboarding/backend/handlers.cjs
- api/migrate.js
- .planning/phases/31-rollout-hardening/31-MIGRATION-CHECKPOINTS.json
- TECH-MAP.md
- test/onboarding-server.test.js

## Delivered
- Added rollout mode helpers: `getRolloutMode()`, `loadMigrationCheckpoints()`, `assertRolloutPromotionAllowed()`.
- Added migration checkpoint artifact with required transition schema and rollback metadata fields.
- Enforced promotion validation in migration writes while preserving deterministic dry-runs.
- Exposed `rollout_mode` and `promotion_checkpoint` details in runtime responses.

## Verification
- `node --test test/onboarding-server.test.js` (pass)
