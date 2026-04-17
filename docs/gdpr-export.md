# GDPR Article 20 Export

D-15: signed S3/R2 zip bundle with per-domain JSON files. 7-day signed URL (604800 seconds).

## Bundle shape

```
<export_id>.zip
├── manifest.json            { tenant_id, generated_at, bundle_version, bundle_domains }
├── tenant.json              markos_tenants row
├── org.json                 markos_orgs row (derived via tenants.org_id)
├── members.json             markos_tenant_memberships
├── crm-contacts.json        crm_contacts for tenant
├── crm-deals.json           crm_deals
├── crm-activity.json        crm_activity_ledger
├── audit.json               markos_audit_log (includes prev_hash + row_hash — verifiable)
├── webhooks.json            markos_webhook_subscriptions
├── literacy.json            markos_mir_documents
└── evidence-pack.json       governance_evidence_packs (if present)
```

`BUNDLE_DOMAINS` is a frozen array of 10 domain keys exported from
`lib/markos/tenant/gdpr-export.cjs`. Adding a new domain requires a phase-201.x follow-up —
the shape is intentionally closed so downstream consumers (SOC 2 Type I auditors, users
exercising GDPR Article 20) can rely on stable filenames.

## Generation

`lib/markos/tenant/gdpr-export.cjs` exports `generateExportBundle(client, { tenant_id, bucket })`.
The function uses `archiver` + `PassThrough` to stream zip output into an
`@aws-sdk/client-s3 PutObjectCommand` body — avoiding Pitfall 7 (OOM on large tenants).

## Signed URL

- TTL: `SIGNED_URL_TTL_SECONDS = 604800` (7 days).
- Generator: `@aws-sdk/s3-request-presigner.getSignedUrl(s3, new GetObjectCommand(...), { expiresIn })`.
- Stored in `markos_gdpr_exports.signed_url` alongside `expires_at`.

## Requesting an export

Automatically triggered by day-30 purge (Plan 07). Ad-hoc operator requests are deferred to
phase 206 SOC 2 Type I — the table supports the shape but there is no user-facing "request
export" button yet.

## Verifying the bundle

`audit.json` includes `prev_hash` and `row_hash` columns. The chain can be re-verified by
calling `lib/markos/audit/chain-checker.cjs verifyTenantChain(client, tenant_id)` against a
live DB — or by implementing a client-side replay with the canonical JSON serializer in
`lib/markos/audit/canonical.cjs`.

## Integrity guarantees

- Append-only `markos_audit_log` table — Plan 02 migration 82 RLS blocks DELETE and UPDATE.
- Per-tenant SHA-256 hash chain — each row stores `prev_hash` (previous row's `row_hash`)
  and its own `row_hash` computed by the SQL function `append_markos_audit_row` inside the
  same transaction as the insert. The DB is the single writer; JS never computes hashes.
- `pg_advisory_xact_lock` per tenant serializes writes so chains are strictly ordered.

Anyone who receives a GDPR bundle can reconstruct the chain offline and verify every row
links back to the first row for that tenant.
