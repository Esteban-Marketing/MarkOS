# 32-02 Summary — Literacy Ingestion and Admin CLIs

## Completed

- Added parser/chunker module:
  - `onboarding/backend/literacy-chunker.cjs`
  - Exports: `parseLiteracyFrontmatter`, `chunkLiteracyFile`, `createLiteracyChunkId`
- Added ingestion CLI:
  - `bin/ingest-literacy.cjs`
  - Supports: `--path`, `--discipline`, `--dry-run`, `--limit`, `--verbose`
  - Uses supersede-before-canonical write flow per `doc_id`
- Added admin CLI:
  - `bin/literacy-admin.cjs`
  - Commands: `query`, `ttl-report`, `deprecate`
- Added tests:
  - `test/literacy-ingest.test.js`

## Verification

- `node --test test/literacy-ingest.test.js`
  - Passed

## Notes

- CLIs rely on existing vector-store + runtime secret validation.
- Ingestion writes deterministic chunk ids and checksum metadata.
