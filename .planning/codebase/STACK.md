# Stack

## Runtime

- Node.js `>=20.16.0`
- Next.js `15.x` App Router for operator UI, marketing pages, and server route handlers
- Vercel-style serverless functions under `api/`
- Local onboarding runtime under `onboarding/backend/server.cjs`

## Primary Languages

- JavaScript and CommonJS (`.js`, `.cjs`) for most server logic, CLIs, and handlers
- TypeScript and TSX (`.ts`, `.tsx`) for shared domain modules and Next.js UI
- SQL for Supabase schema and RLS migrations
- YAML/JSON for flow contracts, OpenAPI artifacts, plugin manifests, and config
- Markdown for protocol, planning, docs, and Obsidian canon
- Python under `tools/pageindex/` for vault indexing and document retrieval tooling

## Core Framework and Libraries

- React `19.x`
- Supabase SSR + `@supabase/supabase-js`
- `@modelcontextprotocol/sdk` for MCP compatibility
- Upstash Redis and Vector
- `@vercel/queue` and `@vercel/edge-config`
- `@sentry/nextjs`
- `@simplewebauthn/*`
- Storybook `8.x`

## Data and Storage

- Supabase is the canonical relational system for tenancy, audit, billing, CRM, MCP, webhooks, governance, and agent-run foundation tables
- Upstash Redis backs MCP/session/rate-limit style runtime concerns
- Upstash Vector backs literacy and retrieval for onboarding-era flows
- Local filesystem surfaces remain first-class for protocol, planning, vault, research, and generated docs

## AI and Provider Layer

- Anthropic
- OpenAI
- Gemini
- Shared provider routing and cost logic in `lib/markos/llm/`
- Local onboarding adapter layer in `onboarding/backend/agents/llm-adapter.cjs`

## Contracts and Distribution

- OpenAPI artifacts in `contracts/openapi.{json,yaml}` plus per-flow `F-*.yaml`
- SDK surfaces in `sdk/typescript/` and `sdk/python/`
- npm package name `markos`
- Published binary still maps `markos` to `bin/install.cjs`, with broader command parsing implemented in `bin/cli-runtime.cjs`

## Quality Tooling

- Node built-in test runner (`node --test`)
- Storybook for UI review and Chromatic workflows
- OpenAPI build scripts under `scripts/openapi/`
- Vault indexing via `scripts/pageindex/` and `tools/pageindex/`
