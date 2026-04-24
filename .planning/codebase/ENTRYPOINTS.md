# Entrypoints

## User CLI Entrypoints (`bin/`)

| File | Invocation | Purpose |
|---|---|---|
| `bin/install.cjs` | `npx markos` or `npx markos install` | Main package binary and install/bootstrap path |
| `bin/update.cjs` | `npx markos update` | Update installed protocol and runtime files |
| `bin/db-setup.cjs` | `npx markos db:setup` | Database bootstrap/setup flow |
| `bin/generate.cjs` | `npx markos generate` | Generator surface |
| `bin/import-legacy.cjs` | `npx markos import:legacy` | Legacy import workflow |
| `bin/vault-open.cjs` | `npx markos vault:open`, `vault:execution`, `vault:evidence`, `vault:review` | Open vault surfaces |
| `bin/llm-config.cjs` | `npx markos llm:config` | LLM provider configuration |
| `bin/llm-status.cjs` | `npx markos llm:status`, `llm:providers` | LLM/provider status and export |
| `bin/ensure-vector.cjs` | `node bin/ensure-vector.cjs` | Vector/storage readiness |
| `bin/ingest-literacy.cjs` | `node bin/ingest-literacy.cjs --path <dir>` | Literacy ingestion |
| `bin/literacy-admin.cjs` | `node bin/literacy-admin.cjs <command>` | Literacy admin/query operations |
| `bin/sync-vault.cjs` | direct node invocation | Vault synchronization utility |
| `bin/markos-company-knowledge.cjs` | direct node invocation | Company-knowledge helper |
| `bin/validate-flow-contracts.cjs` | direct node invocation | Flow/OpenAPI contract validation |
| `bin/dev-server.cjs` | `npm run dev` | Dev entrypoint for local app/runtime work |

## CLI Parsing Hub

- `bin/cli-runtime.cjs` is the shared parser/runtime utility for the install/update/db/generate/vault/llm command family
- Current package distribution is still install-centric because `package.json` maps the published `markos` binary to `bin/install.cjs`

## Runtime Entrypoints

| File | Invocation | Purpose |
|---|---|---|
| `onboarding/backend/server.cjs` | `node onboarding/backend/server.cjs` | Starts local onboarding UI + backend runtime |
| `api/*.js` | platform invocation | Hosted serverless handlers |
| `app/**/*` | Next.js runtime | App Router UI and route handlers |

## npm Script Entrypoints

| Script | Purpose |
|---|---|
| `npm run dev` | local development runtime |
| `npm test` | repo-wide Node test run |
| `npm run test:ui-all` | build Storybook + run UI checks |
| `npm run vault:index` | rebuild vault/PageIndex-facing index |
| `npm run openapi:build` | regenerate merged OpenAPI artifacts |
| `npm run storybook`, `npm run build-storybook`, `npm run chromatic` | UI review workflows |

## Protocol Tool Entrypoints

| File | Invocation | Purpose |
|---|---|---|
| `.agent/get-shit-done/bin/gsd-tools.cjs` | direct node invocation | GSD workflow engine |
| `.agent/markos/bin/markos-tools.cjs` | direct node invocation | MarkOS protocol tooling |

## Sensitive Setup Notes

- Supabase, Redis, Vector, and provider-backed entrypoints require env configuration
- Hosted API entrypoints and local onboarding entrypoints do not share identical auth rules
- Vault and PageIndex commands also depend on local filesystem and optional desktop tool detection
