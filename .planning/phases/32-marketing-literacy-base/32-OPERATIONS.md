# Phase 32 Operations Runbook

## Purpose

Operate the Marketing Literacy Base safely across ingestion, retrieval, and lifecycle transitions.

## Required Environment

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- UPSTASH_VECTOR_REST_URL
- UPSTASH_VECTOR_REST_TOKEN
- MARKOS_ADMIN_SECRET (for HTTP admin endpoints)

## Safe Ingestion Sequence

1. Dry run a source set:
   - `node bin/ingest-literacy.cjs --path literacy --dry-run`
2. Ingest canonical chunks:
   - `node bin/ingest-literacy.cjs --path literacy --verbose`
3. Query smoke test:
   - `node bin/literacy-admin.cjs query --discipline Paid_Media --query "b2b hook" --business_model B2B --topK 5`
4. Endpoint smoke test (if server is running):
   - `GET /admin/literacy/health` with header `x-markos-admin-secret`
   - `POST /admin/literacy/query` with header `x-markos-admin-secret`

## Lifecycle Rules

- Never delete historical chunks for routine updates.
- Re-ingestion supersedes prior `doc_id` records through `status = superseded`.
- New records are written as `status = canonical`.

## Rollback

If a bad ingest is detected:

1. Deprecate the affected document:
   - `node bin/literacy-admin.cjs deprecate --doc_id <DOC_ID>`
2. Re-ingest last known good markdown for that document.
3. Re-run query smoke test and verify expected retrieval snippets.

## Troubleshooting

| Symptom | Likely Cause | Action |
|---|---|---|
| `MISSING_REQUIRED_SECRETS` | Missing provider/service credentials | Export required env vars and retry |
| `UPSTASH_UNCONFIGURED` | Missing vector URL/token | Set Upstash vars, rerun health |
| Empty query matches | Overly narrow filters | Remove `content_type`/`funnel_stage`, retry with larger `topK` |
| Ingest writes zero chunks | File did not match expected section format | Validate markdown headings and fenced yaml metadata |
