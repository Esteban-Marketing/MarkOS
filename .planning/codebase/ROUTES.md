# Routes

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

## Hosted Wrapper Routes (`api/`)

| File | Route | Delegates To | Wrapper Auth |
|---|---|---|---|
| `api/approve.js` | `POST /api/approve` | `handleApprove` | none at wrapper |
| `api/config.js` | `GET /api/config` | `handleConfig` | hosted Supabase auth (`config_read`) |
| `api/migrate.js` | `POST /api/migrate` | `handleMarkosdbMigration` | hosted Supabase auth (`migration_write`) |
| `api/regenerate.js` | `POST /api/regenerate` | `handleRegenerate` | none at wrapper |
| `api/status.js` | `GET /api/status` | `handleStatus` | hosted Supabase auth (`status_read`) |
| `api/submit.js` | `POST /api/submit` | `handleSubmit` | none at wrapper |
| `api/campaign/result.js` | `POST /api/campaign/result` | `handleCampaignResult` | none at wrapper |
| `api/linear/sync.js` | `POST /api/linear/sync` | `handleLinearSync` | none at wrapper |

## Runtime Note

Hosted wrappers and local server share handler implementations in `onboarding/backend/handlers.cjs`.
