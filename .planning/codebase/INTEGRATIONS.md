# Integrations

## External Systems

- Supabase: tenancy, auth, RLS, billing, governance, CRM, webhook, MCP, and agent-run schema
- Upstash Redis: MCP sessions, cost/rate control, webhook breaker/state, subscription plumbing
- Upstash Vector: literacy and retrieval memory for onboarding-era flows
- Vercel Queue: async delivery and cron-adjacent hosted runtime support
- Vercel Edge Config: slug-cache and edge-ready control data
- Anthropic, OpenAI, Gemini: model providers
- Stripe: billing/provider sync foundation
- SimpleWebAuthn: passkey auth flows
- PostHog: telemetry/tracking surfaces
- Linear: issue sync from onboarding/protocol flows
- Tavily: scraping/research enrichment in onboarding flows
- Resend and Twilio: outbound provider adapters
- Obsidian, QMD/Quarto, and PageIndex: local vault/document operations

## Main Ownership Surfaces

| Integration | Primary files |
|---|---|
| Supabase | `onboarding/backend/runtime-context.cjs`, `lib/markos/*`, `supabase/migrations/*` |
| Upstash Redis | `lib/markos/mcp/*.cjs`, `lib/markos/webhooks/*.cjs` |
| Upstash Vector | `onboarding/backend/vector-store-client.cjs`, `bin/ingest-literacy.cjs`, `bin/literacy-admin.cjs` |
| Vercel Queue / Edge Config | `vercel.ts`, `lib/markos/webhooks/store-vercel-queue.*`, `lib/markos/tenant/slug-cache.*` |
| LLM providers | `lib/markos/llm/*`, `onboarding/backend/agents/llm-adapter.cjs` |
| Stripe / billing providers | `lib/markos/billing/provider-sync.cjs`, `stripe-sync.ts`, billing APIs |
| Linear | `onboarding/backend/linear-client.cjs`, `api/linear/sync.js` |
| Tavily | `onboarding/backend/scrapers/tavily-scraper.cjs` |
| Resend / Twilio | `lib/markos/outbound/providers/*`, `api/webhooks/twilio-events.js` |
| PageIndex | `scripts/pageindex/*`, `tools/pageindex/*` |

## Secrets and Config Surfaces

- LLM providers: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`
- Sentry: `SENTRY_DSN`
- Vercel cron and queue secrets: runtime env managed in hosted deployment
- Optional local app detection: Obsidian/QMD path env overrides

## Trust Boundaries

- Local onboarding and hosted serverless paths do not share the exact same auth posture
- Many hosted `api/` surfaces enforce tenant/auth context up front
- MCP surfaces carry their own OAuth/session/token model
- Billing, webhook, and governance evidence are append-oriented and audit-sensitive

## Refresh Trigger

Update this file when a new external service is added, when a secret boundary changes, or when ownership of an integration moves to a different subsystem.
