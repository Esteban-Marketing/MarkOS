# Operator LLM Setup

## Quick Start

1. Configure providers and keys:
```bash
npx markos llm:config
```
2. Optionally run provider smoke test during setup.
3. Check monthly usage and budget:
```bash
npx markos llm:status
```

## Commands

Configure:
```bash
npx markos llm:config --provider anthropic --test
```

Status (current month):
```bash
npx markos llm:status
```

Status for a specific month:
```bash
npx markos llm:status --month 2026-04
```

CSV export:
```bash
npx markos llm:status --month 2026-04 --export csv
```

Provider health/configuration:
```bash
npx markos llm:providers
```

## Required Environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY` for constrained read paths)
- `MARKOS_VAULT_SECRET`

Optional identity overrides:
- `MARKOS_WORKSPACE_ID`
- `MARKOS_OPERATOR_ID`
- `MARKOS_UPDATED_BY`

## Security Notes

- API keys are encrypted before storage.
- Plaintext keys are not written to logs.
- Rotate provider keys by re-running `npx markos llm:config`.

## Troubleshooting

- Missing Supabase credentials:
  - ensure `SUPABASE_URL` and a Supabase key are present.
- Missing vault secret:
  - set `MARKOS_VAULT_SECRET` before running config.
- Empty status output:
  - confirm calls have been executed in the selected month.
- Budget warning:
  - use `npx markos llm:status` to inspect provider-level cost distribution.
