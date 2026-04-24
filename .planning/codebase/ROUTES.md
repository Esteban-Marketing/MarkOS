# Routes

## Next.js App Routes

### Public and marketing surfaces

| Paths | Primary files | Notes |
|---|---|---|
| `/docs/*` | `app/(marketing)/docs/[[...slug]]/{page.tsx,route.ts}` | Marketing/docs delivery plus route-backed content handling |
| `/integrations/claude` | `app/(marketing)/integrations/claude/page.tsx` | Marketplace/integration landing surface |
| `/integrations/claude/demo` | `app/(marketing)/integrations/claude/demo/page.tsx` | Demo page paired with local route handler |
| `/signup` | `app/(marketing)/signup/page.tsx` | Public signup path |
| `/docs/llms-full.txt` | `app/docs/llms-full.txt/route.ts` | LLM-facing documentation export |

### Operator workspace shell

| Paths | Primary files | Notes |
|---|---|---|
| `/` | `app/(markos)/page.tsx` | Workspace entry route |
| `/404-workspace` | `app/(markos)/404-workspace/page.tsx` | Protected workspace error state |
| `/campaigns`, `/company`, `/icps`, `/mir`, `/msp`, `/segments` | matching `app/(markos)/*/page.tsx` | Core operator content views |
| `/plugins/digital-agency` | `app/(markos)/plugins/digital-agency/page.tsx` | Example plugin workspace surface |

### CRM surfaces

| Paths | Primary files | Notes |
|---|---|---|
| `/crm` | `app/(markos)/crm/page.tsx` | CRM hub |
| `/crm/copilot` | `app/(markos)/crm/copilot/page.tsx` | Approval-package oriented copilot UI |
| `/crm/copilot/playbooks` | `app/(markos)/crm/copilot/playbooks/page.tsx` | Playbook approval/review surface |
| `/crm/execution` | `app/(markos)/crm/execution/page.tsx` | Queue and execution workspace |
| `/crm/outbound`, `/crm/outbound/conversations` | matching `page.tsx` files | Outbound and conversation handling |
| `/crm/reporting`, `/crm/reporting/verification` | matching `page.tsx` files | Reporting and verification surfaces |
| `/crm/[objectKind]`, `/crm/[objectKind]/[recordId]` | dynamic record pages | Object workspace and detail drilldown |

### Operations, auth, and status

| Paths | Primary files | Notes |
|---|---|---|
| `/operations` | `app/(markos)/operations/page.tsx` | Operations overview |
| `/operations/tasks` | `app/(markos)/operations/tasks/page.tsx` | Existing task surface; currently fixture-backed |
| `/login` | `app/(markos)/login/page.tsx` | Auth entry |
| `/invite/[token]` | `app/(markos)/invite/[token]/page.tsx` | Invite acceptance |
| `/oauth/consent` | `app/(markos)/oauth/consent/page.tsx` | MCP consent flow UI |
| `/status/webhooks` | `app/(markos)/status/webhooks/page.tsx` | Public-ish status surface rendered in app |

### Settings and admin surfaces

| Paths | Primary files | Notes |
|---|---|---|
| `/admin/billing`, `/admin/governance` | matching `page.tsx` files | Admin/operator review pages |
| `/settings/billing` | `app/(markos)/settings/billing/{page.tsx,page-shell.tsx}` | Billing UI still contains static usage/pricing examples |
| `/settings/danger`, `/settings/domain`, `/settings/mcp`, `/settings/members`, `/settings/plugins`, `/settings/sessions`, `/settings/theme`, `/settings/webhooks` | matching route folders | Operator settings families |
| `/settings/webhooks/[sub_id]` | `app/(markos)/settings/webhooks/[sub_id]/page.tsx` | Webhook subscription detail page |

## Next.js Route Handlers and API-Adjacent App Files

| Path | File |
|---|---|
| `/integrations/claude/demo/api` | `app/(marketing)/integrations/claude/demo/api/route.ts` |
| `/docs/*` content route | `app/(marketing)/docs/[[...slug]]/route.ts` |
| `/docs/llms-full.txt` | `app/docs/llms-full.txt/route.ts` |

## Hosted Serverless API Families (`api/`)

The `api/` tree currently contains broad domain coverage. Treat the families below as canonical route groups.

| Family | Representative files | Purpose |
|---|---|---|
| Legacy onboarding wrappers | `api/approve.js`, `config.js`, `submit.js`, `status.js`, `regenerate.js`, `migrate.js`, `campaign/result.js`, `linear/sync.js` | Hosted delegation into onboarding handlers |
| Public/OpenAPI and well-known | `api/openapi.js`, `api/.well-known/*` | Public contracts and MCP/OAuth metadata |
| Auth | `api/auth/*` | signup, SSO, passkey flows |
| Billing | `api/billing/*` | tenant summary, holds, operator reconciliation |
| CRM | `api/crm/**` | entities, merge, copilot, execution, outbound, reporting |
| Governance | `api/governance/*` | evidence packs, vendor inventory, brand governance |
| Literacy and research | `api/literacy/coverage.js`, `api/research/company-knowledge.js` | canon/knowledge support |
| MCP | `api/mcp/**`, `api/oauth/**`, `api/tenant/mcp/**` | transport, OAuth, session lifecycle, cost/budget, tenant-facing controls |
| Tenancy and identity | `api/tenant/**`, `api/settings/**` | invites, sessions, lifecycle, members, switcher, custom domains, branding |
| Tracking | `api/tracking/*` | ingest, identify, redirect attribution |
| Webhooks | `api/webhooks/**`, `api/tenant/webhooks/**`, `api/public/webhooks/status.js` | subscription engine, tenant settings, public status, replay, DLQ |
| Cron | `api/cron/*` | scheduled support jobs |

## Local Onboarding Server Routes

Source of truth: `onboarding/backend/server.cjs` and `onboarding/backend/handlers.cjs`.

| Method | Path | Handler | Primary Files | Side Effects |
|---|---|---|---|---|
| `OPTIONS` | `*` | `handleCorsPreflight` | `onboarding/backend/server.cjs`, `onboarding/backend/handlers.cjs` | CORS header handling |
| `GET` | `/config` | `handleConfig` | `onboarding/backend/handlers.cjs` | Reads onboarding config and runtime status |
| `GET` | `/status` | `handleStatus` | `onboarding/backend/handlers.cjs`, `onboarding/backend/vector-store-client.cjs` | Health and store status read |
| `POST` | `/submit` | `handleSubmit` | `onboarding/backend/handlers.cjs`, `onboarding/backend/agents/orchestrator.cjs` | Draft generation and persistence |
| `POST` | `/api/extract-sources` | `handleExtractSources` | `onboarding/backend/handlers.cjs`, parser/scraper modules | File and URL extraction |
| `POST` | `/api/extract-and-score` | `handleExtractAndScore` | `onboarding/backend/handlers.cjs`, extractors/confidences modules | Seed extraction and confidence scoring |
| `POST` | `/api/generate-question` | `handleGenerateQuestion` | `onboarding/backend/handlers.cjs`, prompt modules | AI interview prompt generation |
| `POST` | `/api/parse-answer` | `handleParseAnswer` | `onboarding/backend/handlers.cjs`, extractor prompt modules | Partial field extraction |
| `POST` | `/api/spark-suggestion` | `handleSparkSuggestion` | `onboarding/backend/handlers.cjs`, prompt modules | Creative option suggestions |
| `POST` | `/api/competitor-discovery` | `handleCompetitorDiscovery` | `onboarding/backend/handlers.cjs`, `onboarding/backend/enrichers/competitor-enricher.cjs` | Competitor enrichment |
| `POST` | `/regenerate` | `handleRegenerate` | `onboarding/backend/handlers.cjs` | Single-section regeneration |
| `POST` | `/approve` | `handleApprove` | `onboarding/backend/handlers.cjs`, `onboarding/backend/write-mir.cjs` | Persist approved artifacts |
| `POST` | `/migrate/local-to-cloud` | `handleMarkosdbMigration` | `onboarding/backend/handlers.cjs` | Local to cloud migration |
| `POST` | `/linear/sync` | `handleLinearSync` | `onboarding/backend/handlers.cjs`, `onboarding/backend/linear-client.cjs` | Linear issue sync |
| `POST` | `/campaign/result` | `handleCampaignResult` | `onboarding/backend/handlers.cjs` | Campaign outcome persistence |
| `GET` | `/admin/literacy/health` | `handleLiteracyHealth` | `onboarding/backend/handlers.cjs`, vector client | Literacy health status |
| `POST` | `/admin/literacy/query` | `handleLiteracyQuery` | `onboarding/backend/handlers.cjs`, vector client | Literacy semantic query |
| `GET` | `/*` | static fallback | `onboarding/backend/server.cjs` | Serves onboarding static files |

## Runtime Note

This repository now has three route systems that must be audited together:

1. Next.js app routes in `app/`
2. Hosted serverless routes in `api/`
3. Local onboarding routes in `onboarding/backend/server.cjs`
