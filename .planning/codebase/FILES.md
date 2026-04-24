# Files

## Root Files

| File | Purpose |
|---|---|
| `package.json` | package metadata, scripts, dependencies, and published `markos` binary mapping |
| `next.config.ts` | Next.js configuration and Sentry wrapping |
| `middleware.ts` | request middleware and tenant-resolution edge behavior |
| `instrumentation.ts` | runtime instrumentation bootstrap |
| `sentry.server.config.ts` | server-side Sentry init |
| `vercel.ts`, `vercel.json` | hosted routing and cron configuration |
| `README.md`, `TECH-MAP.md`, `ARCH-DIAGRAM.md` | human-facing orientation |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md` | AI/operator instruction surfaces |
| `.markos-project.json` | project-local MarkOS identity/config root |
| `onboarding-seed.json` | onboarding input seed |
| `VERSION` | repo/package version string |
| `tokenize.cjs`, `patch.ps1` | utility helpers |

## High-Leverage Runtime Files

| File | Role |
|---|---|
| `bin/cli-runtime.cjs` | shared CLI parser/runtime utilities |
| `onboarding/backend/server.cjs` | local onboarding HTTP dispatcher |
| `onboarding/backend/handlers.cjs` | onboarding route implementation hub |
| `lib/markos/mcp/server.cjs` | MCP server registry/transport adapter |
| `lib/markos/webhooks/engine.*` | webhook execution engine |
| `lib/markos/billing/*` | billing, entitlements, reconciliation, provider sync |
| `lib/markos/crm/*` | CRM domain logic |
| `contracts/openapi.{json,yaml}` | merged public API contract |

## File Families

- `app/**/*`: page/layout/component files for Next.js routes
- `api/**/*`: hosted route handlers
- `components/**/*`: reusable operator UI components
- `contracts/F-*.yaml`: canonical per-flow contracts
- `supabase/migrations/*.sql`: persistent schema truth
- `docs/**/*`: human docs
- `sdk/**/*`: generated/maintained SDK artifacts
- `scripts/**/*`: automation and build scripts
- `test/**/*`: verification suites

## Refresh Trigger

Update this file when a new root file becomes operationally important, when a core runtime file changes ownership, or when a new maintained file family is introduced.
