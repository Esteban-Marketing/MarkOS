# Integrations

## External Systems

- Supabase: relational persistence and operational metadata.
- Upstash Vector: semantic retrieval and standards memory.
- Tavily: website and competitor context retrieval.
- Linear: issue/task sync from protocol templates.
- PostHog: backend telemetry and endpoint event tracking.
- LLM providers: Anthropic, OpenAI, Gemini.

## Integration Owners

- Supabase and Upstash usage: `onboarding/backend/vector-store-client.cjs`
- Hosted auth contract: `onboarding/backend/runtime-context.cjs`
- Linear GraphQL client: `onboarding/backend/linear-client.cjs`
- Tavily scraper: `onboarding/backend/scrapers/tavily-scraper.cjs`
- Telemetry emission: `onboarding/backend/agents/telemetry.cjs`

## Secret and Config Surfaces

- Core provider keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- Storage keys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`
- Optional admin and telemetry keys: `MARKOS_ADMIN_SECRET`, telemetry config env vars

## Auth and Trust Boundaries

- Local onboarding routes run without Supabase JWT enforcement by default.
- Hosted wrapper routes in `api/` selectively enforce Supabase auth by operation.
- Some operations rely on operation-level secret checks in handlers.

## Update Triggers

Update this file when:

1. A new external service is added.
2. A service contract, secret, or auth boundary changes.
3. Integration ownership moves to different files.
