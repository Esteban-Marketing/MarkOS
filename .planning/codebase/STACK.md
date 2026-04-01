# Stack

## Runtime

- Node.js `>=20.16.0`
- Vercel serverless wrappers under `api/`
- Local HTTP onboarding server under `onboarding/backend/server.cjs`

## Primary Language and Module Style

- JavaScript with CommonJS (`.cjs`) for backend and CLIs
- JavaScript (`.js`) for Vercel wrappers and prompt modules
- Markdown (`.md`) for protocol and planning artifacts
- JSON for config and schema

## Data and Storage

- Supabase relational storage for canonical records
- Upstash Vector for retrieval and semantic memory
- Local project files under `.planning/` and `.markos-local/`

## AI Providers

- Anthropic
- OpenAI
- Gemini
- Optional local fallback behavior in adapter paths

## Testing

- Node built-in test runner (`node --test`)
- Test suite under `test/`

## Build and Distribution

- npm package `markos`
- Published CLI binary: `markos` -> `bin/install.cjs`
