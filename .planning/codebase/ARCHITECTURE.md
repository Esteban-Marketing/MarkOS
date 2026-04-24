# Architecture

## System Shape

MarkOS is no longer a single onboarding server with a few wrappers. The live repository has five cooperating layers:

1. `app/`: Next.js App Router UI for public marketing, docs, and the operator workspace.
2. `api/`: hosted serverless endpoints for auth, tenancy, CRM, billing, governance, MCP, tracking, and webhooks.
3. `lib/markos/`: shared business logic for nearly every runtime surface.
4. `onboarding/`: the original local onboarding UI/backend runtime, still active and still important.
5. `.planning/` + `obsidian/` + `.agent/`: the doctrine, roadmap, and execution-control layer that now drives future work.

## High-Level Flow

### Operator and app flow

1. A user lands in a Next.js route under `app/(marketing)` or `app/(markos)`.
2. App UI calls route handlers under `api/`.
3. Serverless handlers authenticate/resolve tenant context and delegate into `lib/markos/*`.
4. Domain libraries enforce contracts, billing, tenancy, approval, audit, MCP, or webhook logic.
5. Persistence is handled primarily through Supabase, with Redis/Vector/Vercel support where needed.

### Local onboarding flow

1. Operator runs `node onboarding/backend/server.cjs` or `npm run dev`.
2. `onboarding/backend/server.cjs` dispatches to `onboarding/backend/handlers.cjs`.
3. Handlers call onboarding agents, extractors, enrichers, parsers, and vector storage clients.
4. Approved outputs write into MIR/MSP/vault-adjacent local surfaces and supporting stores.

## Major Runtime Domains

- `lib/markos/tenant/`, `orgs/`, `identity/`, `rbac/`: tenancy and access model
- `lib/markos/billing/`: usage, entitlements, reconciliation, provider sync
- `lib/markos/crm/`: entities, execution, outbound, playbooks, reporting
- `lib/markos/mcp/`: OAuth, sessions, cost metering, tools, resources, transport
- `lib/markos/webhooks/`: subscriptions, delivery, DLQ, rotation, replay, metrics
- `lib/markos/governance/`: evidence packs and vendor inventory
- `lib/markos/llm/`: provider abstraction and cost logic

## Deployment Modes

- Local-first onboarding runtime for project setup and intake
- Hosted Next.js + serverless mode for the main product surfaces
- Contract-first external posture through `contracts/`, `sdk/`, and docs

## Important Architectural Reality

The codebase already has strong SaaS-readiness foundations in tenancy, MCP, CRM, billing, and webhooks, but the v2 Marketing Operating System doctrine in the vault now expects a wider loop:

- canonical AgentRun orchestration
- unified task and approval system
- evidence-grounded claims and research freshness
- connector wow/recovery workflows
- Pricing Engine ownership
- SaaS Suite activation
- growth-mode routing

Those expectations are planning truth today, not implemented truth.
