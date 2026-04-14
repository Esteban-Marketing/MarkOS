# Feature Landscape

**Domain:** Revenue CRM and customer intelligence inside MarkOS
**Researched:** 2026-04-14

## Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Canonical contact, company, account, customer, and deal model | Core CRM truth | Medium | Already partly present; v3.8 should harden extensibility and validation |
| Unified activity timeline | Needed for real customer context | Medium | Normalize web, outbound, task, note, AI, and attribution events into one ledger |
| Identity stitching with confidence and lineage | Required for behavioral CRM | Medium | Keep merge suggestions explainable and reviewable |
| Pipeline views: table, Kanban, detail, timeline, forecast | Standard operator expectation | Medium | Prefer headless view composition over heavy UI framework adoption |
| Native outbound execution | Required for revenue workflows | Medium | Continue with email, SMS, and WhatsApp only |
| Attribution and cockpit reporting | Required for customer intelligence credibility | Medium | Keep metrics visible in CRM, not in a detached analytics tool |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CRM-grounded AI copilot with approval envelopes | AI can assist without breaking governance | High | Strong fit with MarkOS' existing evidence and role-gating model |
| Account/workspace behavioral rollups | Lets operators reason at company level, not just contact level | Medium | Best done with PostHog groups plus CRM rollup tables |
| Identity-confidence evidence rail | Makes merge and attribution decisions inspectable | Medium | Strong MarkOS-style differentiator |
| Explainable next-best-action engine | Preserves operator trust in AI suggestions | Medium | Should cite recency, stage, risk, and engagement inputs |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full social publishing suite | Not required for the milestone and expands scope fast | Keep outbound focused on email, SMS, and WhatsApp |
| Separate graph database | Premature architecture split | Use relational link tables plus optional vector-assisted suggestions |
| Warehouse-first reporting platform | Breaks CRM-native operator loop | Use SQL views and materialized rollups inside the app |
| Generic autonomous agent platform | Weakens auditability and bounded actions | Extend the existing provider adapter and approval contracts |
| New analytics/CDP stack | Duplicates PostHog and the proxy ingest path | Extend PostHog taxonomy and CRM normalization instead |

## Feature Dependencies

Schema contracts → identity graph → activity ledger → workspace views → outbound reliability → copilot actions → attribution rollups

## MVP Recommendation

Prioritize:
1. Schema hardening for custom fields and safe mutations
2. Identity and event normalization with account-level grouping
3. Table and Kanban workspace performance improvements
4. Outbound retries and delivery lineage
5. Copilot grounding and approval packages

Defer: warehouse BI, social publishing, complex lead-routing automation, full MMM

## Sources

- Current MarkOS CRM requirements and roadmap
- Official docs for PostHog, Supabase, Resend, Twilio, TanStack Table, and dnd kit
