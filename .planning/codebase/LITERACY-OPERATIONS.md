# Literacy Operations Runbook

## Purpose

This runbook documents secure database provisioning for literacy services.

## Command

```bash
npx markos db:setup
```

## Required Credentials

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_VECTOR_REST_URL`
- `UPSTASH_VECTOR_REST_TOKEN`

The setup wizard prompts for these values, validates provider reachability, and persists credentials to `.env` only.

## Execution Flow

1. Capture credentials with redacted terminal output.
2. Probe Supabase and Upstash connectivity.
3. Persist `.env` keys and ensure `.gitignore` protects `.env`.
4. Execute `supabase/migrations/*.sql` in lexical order.
5. Track migration applications in `markos_migrations`.
6. Verify RLS posture for literacy tables and anon-denial checks.
7. Audit client namespace isolation and `markos-standards-*` namespace shape.
8. Emit a consolidated health snapshot.

## Rerun Safety

- Setup is idempotent for credential persistence: existing keys are updated in place.
- Migration runner skips files already applied with matching checksum.
- Fail-fast behavior stops on the first migration error and reports the failing filename.

## Troubleshooting

- `Supabase connectivity failed`: verify URL/key pair and service-role scope.
- `UPSTASH` probe errors: verify REST URL/token and index accessibility.
- `Migration failed for <file>`: inspect SQL file and resolve syntax/runtime issue.
- `RLS verification failed`: confirm required tables have RLS enabled and anon access denied.
- `Namespace audit failed`: verify project slug-scoped namespaces and standards namespace format.
- `Namespace audit failed`: verify project slug-scoped namespaces and standards namespace format.

---

## Phase 43 — Literacy Activation Readiness (LIT-13 / LIT-14 / LIT-15)

### Overview

After Phase 43, every `/submit` and `/status` response includes a `literacy` block indicating how much marketing-playbook content is available for the submitted context. This block drives operator awareness without blocking the core onboarding flow.

### Response Shape

```json
"literacy": {
	"readiness": "ready | partial | unconfigured",
	"disciplines_available": ["Paid_Media", "Content_SEO"],
	"gaps": ["Lifecycle_Email"],
	"last_ingestion_at": null
}
```

> `/status` also returns `last_ingestion_at` (nullable). `/submit` omits it.

### Readiness States

| State | Meaning | Operator Action |
|-------|---------|-----------------|
| `ready` | Providers healthy; all required disciplines have content | No action needed. Full playbook coverage available. |
| `partial` | Providers healthy; some disciplines lack indexed content | Run `npx markos ingest` for the disciplines listed in `gaps`. |
| `unconfigured` | Vector providers not reachable or not configured | Configure `UPSTASH_VECTOR_REST_URL` + `UPSTASH_VECTOR_REST_TOKEN`, then re-run `npx markos db:setup`. |

### Gap Remediation

When `readiness` is `partial`, the `gaps` array lists the discipline slugs that have no indexed content (e.g., `["Lifecycle_Email", "Social"]`). To fill these gaps:

1. Ensure literacy content exists for each discipline under `.agent/markos/literacy/`.
2. Run `npx markos ingest --discipline <slug>` for each gap entry.
3. Re-submit or call `/status` to confirm `readiness` advances to `ready`.

### Telemetry (LIT-15)

Every successful `/submit` emits exactly one `literacy_activation_observed` PostHog event with:

| Property | Type | Notes |
|----------|------|-------|
| `readiness_status` | string | `ready \| partial \| unconfigured` |
| `disciplines_available` | string[] | disciplines with content |
| `disciplines_missing` | string[] | disciplines with no content |
| `business_model` | string | from `seed.product.business_model` |
| `pain_point_count` | number | count only — never raw pain-point text |

Raw pain-point strings are never included in telemetry payloads (privacy-safe count only).

### Implementation Files

| File | Role |
|------|------|
| `onboarding/backend/literacy/activation-readiness.cjs` | Core `evaluateLiteracyReadiness()` primitive |
| `onboarding/backend/literacy/discipline-selection.cjs` | `resolveRequiredDisciplines()` — ranks disciplines from seed |
| `onboarding/backend/handlers.cjs` | `handleSubmit` + `handleStatus` wiring |

---

## Phase 44 — End-To-End Literacy Lifecycle Verification (LIT-16 / LIT-17 / LIT-18 / LIT-19)

### Operator Workflow (Install → Setup → Ingest → Coverage → Onboarding)

1. Install and baseline environment:
	 - `npm ci`
	 - ensure `.env` contains: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`
2. Provision providers and schema:
	 - `npx markos db:setup`
	 - expected: connectivity probes pass, migrations apply/skip idempotently, health snapshot emitted
3. Ingest literacy corpus:
	 - `npx markos ingest`
	 - expected: canonical chunks indexed, no fatal ingest errors
4. Verify coverage API contract:
	 - `GET /api/literacy/coverage`
	 - expected payload shape:
		 - `disciplines.{name}.doc_count` number
		 - `disciplines.{name}.chunk_count` number
		 - `disciplines.{name}.last_updated` nullable ISO string
		 - `disciplines.{name}.business_models[]` string array
	 - failure indicator: all-zero coverage with a known populated corpus
5. Run onboarding submit verification:
	 - `POST /submit` with valid intake seed
	 - expected:
		 - `literacy.readiness` is returned
		 - `drafts.standards_context` includes discipline/pain-point-relevant evidence
6. Run automated verification commands:
	 - `node --test test/literacy-e2e.test.js -x`
	 - `node --test test/**/*.test.js`
	 - `npm test`

### Expected Pass/Fail Signals

- Pass:
	- `test/literacy-e2e.test.js` shows all 8 assertions passing.
	- full suite remains green (`npm test` pass, zero fail).
	- coverage endpoint returns non-zero counts for ingested disciplines.
- Fail:
	- LIT-18 zero-hit gate error:
		- `LIT-18 regression: populated corpus produced zero retrieval hits ...`
	- coverage response missing required count/freshness fields.
	- submit returns empty or irrelevant `standards_context` under populated corpus conditions.

### CI Enforcement

- Workflow: `.github/workflows/ui-quality.yml`
- Merge-blocking regression command:
	- `node --test test/literacy-e2e.test.js -x`
- Trigger paths include:
	- `onboarding/backend/**`
	- `api/literacy/**`
	- `test/literacy-e2e.test.js`
