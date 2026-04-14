# Architecture Patterns

**Domain:** Revenue CRM and customer intelligence in MarkOS
**Researched:** 2026-04-14

## Recommended Architecture

Use a **ledger-first CRM architecture**:

1. PostHog and first-party app events feed the tracking proxy
2. Proxy and webhooks normalize everything into one CRM activity ledger
3. Identity-link and merge services propose or confirm person/account linkage
4. Canonical CRM tables remain the operational source of truth
5. Read models and SQL rollups power workspace views, attribution, and reporting
6. Copilot reads from grounded bundles and writes only through approval-safe action contracts

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| CRM canonical store | Contacts, companies, deals, accounts, customers, tasks, notes | UI, reporting, copilot, outbound |
| Activity ledger | Immutable event timeline across all customer touchpoints | Tracking proxy, outbound webhooks, copilot audit |
| Identity service | Confidence scoring, accepted links, merge lineage | Activity ledger, canonical store |
| Workspace read models | Pipeline, table, Kanban, forecast, detail views | CRM UI and reporting shell |
| Outbound executor | Provider send, retries, delivery writeback, consent checks | Resend, Twilio, CRM ledger |
| Copilot service | Summaries, recommendations, drafts, approval packages | Existing LLM adapter, CRM read models |
| Reporting rollups | Attribution, conversion, productivity, SLA risk | CRM shell and executive views |

## Patterns to Follow

### Pattern 1: Normalized event-in, typed ledger-out
**What:** Every behavioral or vendor event is normalized into the same CRM-native activity family model before it affects UI or reporting.
**When:** Tracking, outbound webhooks, identity updates, and AI actions.

### Pattern 2: Normalized core tables plus validated JSONB extension fields
**What:** Keep core CRM entities relational, but allow extensibility via JSONB fields validated by JSON Schema.
**When:** Custom objects, pipeline metadata, enrichment payloads, copilot proposal envelopes.

### Pattern 3: Suggestions are probabilistic, truth is explicit
**What:** Similarity scoring may suggest identity matches or next-best actions, but no merge or mutation is final until accepted through the contract path.
**When:** Identity graph, lead scoring, copilot recommendations, attribution repairs.

### Pattern 4: Read models for operator speed
**What:** Use SQL views or materialized views for dashboards and workspaces instead of recomputing from raw events on every request.
**When:** Pipeline health, attribution drill-downs, workspace queues, executive summaries.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Analytics as source of truth
**Why bad:** PostHog events are signals, not canonical CRM state.
**Instead:** Land normalized events in the ledger and derive CRM state through governed rules.

### Anti-Pattern 2: Second orchestration framework for AI
**Why bad:** It duplicates the repo's provider abstraction and governance controls.
**Instead:** Extend the existing LLM adapter and approval packages.

### Anti-Pattern 3: Vendor-specific data models in the app layer
**Why bad:** Twilio, Resend, and PostHog payloads all drift over time.
**Instead:** Normalize vendor payloads into stable internal event contracts.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| CRM reads | Direct table reads are fine | Add indexed read models | Materialized rollups and partitioning |
| Activity timeline | Simple tenant filters | Add composite indexes and rollups | Partition ledger by tenant/time |
| Identity resolution | Rule-based scoring | Add vector-assisted candidate search | Batch scoring + async review queues |
| Outbound execution | Inline or short queue | Durable retries and scheduled sends | Queue isolation and worker pools |
| Reporting | On-demand SQL | Precomputed summary views | Dedicated reporting refresh jobs |

## Sources

- Current MarkOS CRM schema, tracking, reporting, and copilot implementation patterns
- Supabase RLS and pgvector docs
- PostHog identify and group analytics docs
