# Entrypoints

## User CLI Entrypoints (`bin/`)

| File | Invocation | Purpose |
|---|---|---|
| `bin/install.cjs` | `npx markos` or `npx markos install` | Install protocol surfaces and bootstrap setup. |
| `bin/update.cjs` | `npx markos update` | Update installed protocol files safely. |
| `bin/ensure-vector.cjs` | `node bin/ensure-vector.cjs` | Validate vector and storage env readiness. |
| `bin/ingest-literacy.cjs` | `node bin/ingest-literacy.cjs --path <dir>` | Ingest literacy corpus into vector storage. |
| `bin/literacy-admin.cjs` | `node bin/literacy-admin.cjs <command>` | Query and lifecycle operations for literacy data. |

## Protocol Tool Entrypoints

| File | Invocation | Purpose |
|---|---|---|
| `.agent/get-shit-done/bin/gsd-tools.cjs` | `node .agent/get-shit-done/bin/gsd-tools.cjs <command>` | GSD planning and workflow operations. |
| `.agent/markos/bin/markos-tools.cjs` | `node .agent/markos/bin/markos-tools.cjs <command>` | MarkOS planning/protocol utility operations. |

## Runtime Entrypoints

| File | Invocation | Purpose |
|---|---|---|
| `onboarding/backend/server.cjs` | `node onboarding/backend/server.cjs` | Starts local onboarding HTTP server and UI runtime. |
| `api/*.js` | platform invocation | Hosted serverless wrappers for runtime handlers. |

## Sensitive Setup Notes

- Storage-backed entrypoints require Supabase and Upstash env vars.
- LLM-backed routes require at least one provider key.
- Hosted wrapper auth behavior depends on runtime context in `onboarding/backend/runtime-context.cjs`.
