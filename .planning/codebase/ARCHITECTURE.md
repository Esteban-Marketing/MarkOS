# Architecture

## High-Level Flow

1. Operator runs CLI install/update from `bin/`.
2. Onboarding UI (`onboarding/index.html`, `onboarding/onboarding.js`) collects structured input.
3. Local server (`onboarding/backend/server.cjs`) routes requests to `handlers.cjs`.
4. Handler layer orchestrates AI generation, extraction, storage, and approval operations.
5. Approved artifacts are written to local protocol/project surfaces and persisted to storage.
6. Hosted `api/` wrappers provide deployment-mode entrypoints delegating to same handlers.

## Core Runtime Components

- HTTP dispatcher: `onboarding/backend/server.cjs`
- Route implementation: `onboarding/backend/handlers.cjs`
- AI orchestration: `onboarding/backend/agents/orchestrator.cjs`
- Provider adapter: `onboarding/backend/agents/llm-adapter.cjs`
- Persistence: `onboarding/backend/vector-store-client.cjs`
- Runtime policy/auth: `onboarding/backend/runtime-context.cjs`

## Deployment Modes

- Local mode: onboarding server serves UI and APIs directly.
- Hosted mode: Vercel routes through `api/*.js` wrappers to shared handlers.

## Documentation Routing

- Runtime contracts are documented in `ROUTES.md` and `ENTRYPOINTS.md`.
- Repository ownership is documented in `FOLDERS.md` and `FILES.md`.
