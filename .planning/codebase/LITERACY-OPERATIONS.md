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
