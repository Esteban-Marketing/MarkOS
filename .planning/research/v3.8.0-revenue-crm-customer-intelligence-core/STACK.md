# Technology Stack

**Project:** MarkOS v3.8.0 Revenue CRM and Customer Intelligence Core
**Researched:** 2026-04-14

## Recommended Stack Additions

### Core Data and Contract Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Postgres + RLS | existing | Canonical CRM store | Already matches MarkOS tenant isolation and contract-safe SQL patterns |
| pg_jsonschema | latest stable | Enforce JSONB envelopes and custom-field contracts in the database | Fits the repo's contract-driven design without replacing existing SQL migrations |
| Ajv | 8.x | Compile JSON Schema validators in Node handlers | Reuses existing schema-first patterns and keeps request validation fast |
| pgvector | latest stable | Similarity-assisted identity suggestions, lead scoring, and copilot retrieval helpers | Extends the current Supabase/vector strategy without adding a separate graph or search vendor |

### Behavioral and Analytics Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostHog identify + group analytics | existing + enable feature | Behavioral tracking and company/workspace rollups | Repo already uses PostHog; group analytics cleanly maps events to company/account/workspace entities |
| Existing first-party tracking proxy | existing | Server-routed event capture | Preserves attribution and privacy posture while keeping raw events normalized into CRM activity ledgers |

### Workspace UI Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Table | 8.x | Dense CRM table views, filtering, sorting, faceting, selection | Headless and testable; ideal for contract-driven Next.js apps |
| dnd kit | latest stable | Kanban stage movement and sortable workspace lists | Accessible, performant, and much lighter than a full UI suite |

### Outbound Execution Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend Node SDK | latest stable | Email delivery | Official SDK, already aligned with the milestone's native outbound requirements |
| Twilio Node SDK | latest stable | SMS and WhatsApp delivery | Official SDK for the two locked mobile channels |
| Supabase queues / cron pattern | latest stable | Sequence scheduling, retries, and delayed sends | Prefer Postgres-backed durability over adding Redis just for this milestone |

### AI Support Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing OpenAI / Anthropic / Gemini adapter | existing | Copilot summarization, drafting, recommendations | The repo already solved provider abstraction; keep one LLM boundary |
| Contract-validated tool/action envelopes | existing pattern + Ajv hardening | Approval-safe AI actions | Keeps AI grounded in CRM context and consistent with governance requirements |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Canonical CRM store | Supabase Postgres | HubSpot/Salesforce as primary truth | Too much external lock-in for a repo that already has tenant-safe DB primitives |
| Identity graph | Relational graph + confidence links | Neo4j / TigerGraph | Adds operational weight before the product outgrows SQL-based identity lineage |
| Event pipeline | PostHog + CRM ledger | Segment / RudderStack / warehouse CDP | Unnecessary extra system when PostHog and first-party proxying already exist |
| AI orchestration | Existing adapter + action contracts | LangChain / AutoGen / CrewAI | Duplicates orchestration logic and weakens auditability |
| Job execution | Postgres-backed queueing | Redis + BullMQ | Extra infra for a repo already centered on Supabase |
| Reporting | SQL rollups in-app | External BI for milestone core | Breaks the CRM-native cockpit goal |

## Installation

Suggested additions only:

- Ajv
- TanStack Table
- dnd kit
- Resend SDK if not yet in package dependencies
- Twilio SDK if not yet in package dependencies

## Sources

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/extensions/pg_jsonschema
- https://supabase.com/docs/guides/ai/vector-columns
- https://posthog.com/docs/getting-started/identify-users
- https://posthog.com/docs/product-analytics/group-analytics
- https://resend.com/docs/send-with-nodejs
- https://www.twilio.com/docs/messaging/quickstart/node
- https://tanstack.com/table/latest/docs/guide/tables
- https://dndkit.com/
