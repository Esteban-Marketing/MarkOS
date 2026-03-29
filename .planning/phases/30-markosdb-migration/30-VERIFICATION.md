# Phase 30 Verification - MarkOSDB Migration

## Target Checks

1. MarkOSDB relational/vector contracts are documented and versioned.
2. Local-to-cloud ingestion supports dry-run and idempotent replay.
3. Cloud-canonical access paths enforce auth and project scoping.
4. Compatibility reads for legacy namespaces and local artifacts remain functional.

## Command Log Template

```bash
node --test test/onboarding-server.test.js
node --test test/protocol.test.js
```

## Command Log (Executed 2026-03-29)

1. `node --test test/onboarding-server.test.js`
	 - Result: PASS (`15 passed`, `0 failed`)
	 - Phase-30 specific evidence:
		 - Hosted auth boundary coverage for wrappers (`3.4`).
		 - Dry-run/replay idempotency for local-to-cloud migration (`3.11`).
		 - Hosted migration scope enforcement (`3.12`).

2. `node --test test/protocol.test.js`
	 - Result: PASS (`8 passed`, `0 failed`)
	 - Protocol integrity checks now validate identity artifacts and winners-anchor expectations for the MarkOS-first contract.

## Evidence to Capture

- Contract document links between local artifacts and cloud schema.
- Dry-run report plus replay report.
- Auth pass/fail test evidence.
- Retrieval proof using tagged campaign outcomes.

## Evidence Captured

- Contracts and mappings:
	- `onboarding/backend/markosdb-contracts.cjs`
	- `onboarding/backend/handlers.cjs` (`handleMarkosdbMigration`)
	- `onboarding/backend/chroma-client.cjs` (`upsertMarkosdbArtifact`)
	- `TECH-MAP.md` (Phase 30 contract section)
	- `ARCH-DIAGRAM.md` (Phase 30 migration addendum)
- Auth boundary and runtime scoping:
	- `onboarding/backend/runtime-context.cjs` (`requireHostedSupabaseAuth`)
	- `api/config.js`, `api/status.js`, `api/migrate.js`
- Test evidence:
	- `test/onboarding-server.test.js` phase-30 scenarios pass.

## Exit Decision

Phase 30 can transition only when MDB-01, MDB-02, and MDB-03 are marked complete in `30-REQUIREMENTS.md`.

Current decision: **READY_FOR_HUMAN_APPROVAL**

- MDB-01: Complete
- MDB-02: Complete
- MDB-03: Complete
- Combined suite status: onboarding and protocol checks are green.
