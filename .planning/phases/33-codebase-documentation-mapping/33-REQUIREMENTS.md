# Phase 33 Requirements - Codebase Documentation Mapping

## Requirement Set

- [ ] **DOC-01**: `.planning/codebase/` must exist as the canonical GSD documentation map with at least `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, and `CONCERNS.md`.
- [ ] **DOC-02**: Runtime surfaces must be documented route by route across `onboarding/backend/server.cjs`, `onboarding/backend/handlers.cjs`, `api/*.js`, `bin/*.cjs`, and protocol CLI entrypoints.
- [ ] **DOC-03**: Maintained repository surfaces must be documented folder by folder and file by file across root files, `api/`, `bin/`, `onboarding/`, `onboarding/backend/`, `.agent/`, `.planning/`, `RESEARCH/`, `scripts/`, `test/`, and any other non-generated implementation directories on disk.
- [ ] **DOC-04**: `README.md`, `TECH-MAP.md`, and `.protocol-lore/CODEBASE-MAP.md` must summarize and deep-link to the canonical map rather than acting as competing sources of topology truth.
- [ ] **DOC-05**: Verification and freshness rules must exist for route additions/removals, file moves, folder growth, and implementation-surface changes.

## Acceptance Matrix

| Requirement | Primary Outputs | Verification Target |
|------------|-----------------|---------------------|
| DOC-01 | `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONCERNS.md` | Manual review + protocol/doc link checks |
| DOC-02 | `.planning/codebase/ROUTES.md`, `.planning/codebase/ENTRYPOINTS.md` | Route inventory cross-check against `server.cjs`, `api/`, and CLI files |
| DOC-03 | `.planning/codebase/FOLDERS.md`, `.planning/codebase/FILES.md`, `.planning/codebase/COVERAGE-MATRIX.md` | File inventory cross-check against workspace structure |
| DOC-04 | `README.md`, `TECH-MAP.md`, `.protocol-lore/CODEBASE-MAP.md` | Protocol/doc consistency checks |
| DOC-05 | `.planning/codebase/README.md`, phase verification artifact, optional `test/protocol.test.js` assertions | Freshness checklist and drift checks |

## Validation Rule

Phase 33 is complete only when the canonical map exists, the route/folder/file inventories are populated, and the summary docs visibly delegate topology truth to `.planning/codebase/`.
