# Phase 30 Requirements - MarkOSDB Migration

## Requirement Set

- [x] **MDB-01**: MarkOSDB schema and adapter contracts must be defined for Supabase relational entities and Upstash vector metadata.
	- Evidence: `onboarding/backend/markosdb-contracts.cjs` defines canonical relational contract, vector metadata fields, artifact classification, and namespace read-order model; docs updated in `TECH-MAP.md` and `ARCH-DIAGRAM.md`.
- [x] **MDB-02**: Local compatibility artifacts (`.markos-local`) must be ingestible into MarkOSDB through idempotent migration jobs.
	- Evidence: `handleMarkosdbMigration` in `onboarding/backend/handlers.cjs` scans compatibility roots, computes SHA-256 checksums, supports `dry_run`, and upserts deterministic `artifact_id` values through `chroma-client.cjs` (`upsertMarkosdbArtifact`).
- [x] **MDB-03**: Authenticated Next.js runtime integration must enforce Supabase auth/RLS and expose safe retrieval/write paths.
	- Evidence: hosted auth boundary implemented in `runtime-context.cjs` (`requireHostedSupabaseAuth`) and enforced in `api/config.js`, `api/status.js`, and `api/migrate.js` with project-scope checks.

## Acceptance Matrix

| Requirement | Primary Files | Test Coverage Target |
|------------|---------------|----------------------|
| MDB-01 | `TECH-MAP.md`, `ARCH-DIAGRAM.md`, DB contract files | Contract validation tests |
| MDB-02 | Migration job scripts and backend adapters | Migration dry-run + replay tests |
| MDB-03 | Next.js API/actions, auth middleware, backend handlers | Auth and integration tests |

## Validation Rule

Phase 30 is complete only when all MDB requirements are checked and verification evidence is captured in `30-VERIFICATION.md`.
