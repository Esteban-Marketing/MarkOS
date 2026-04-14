# Research Summary: MarkOS v3.8.0 Revenue CRM and Customer Intelligence Core

**Domain:** AI-first revenue CRM and customer intelligence for a brownfield MarkOS repo
**Researched:** 2026-04-14
**Overall confidence:** HIGH

## Executive Summary

MarkOS already has the right base primitives for this milestone: Next.js for product surfaces, Supabase for tenant-safe storage and RLS, PostHog for behavioral analytics, and a contract-driven backend pattern. The best path is **extension**, not platform replacement.

For v3.8.0, the strongest additions are small and opinionated: use **Ajv** in Node and **pg_jsonschema** in Supabase to harden CRM contracts; use **pgvector** only for merge suggestions, similarity scoring, and copilot retrieval support; use **TanStack Table** and **dnd kit** for dense CRM workspace views; and standardize outbound execution on the official **Resend** and **Twilio** SDKs.

The repo should **not** add a separate graph database, warehouse-first CDP, heavy agent framework, or a second analytics stack. Those would duplicate existing MarkOS primitives and increase governance drift.

## Key Findings

**Stack:** Extend the existing Supabase + PostHog + Next.js base with contract validation, headless CRM UI primitives, and Postgres-backed execution reliability.

**Architecture:** Keep Postgres as the canonical CRM truth, PostHog as the behavioral signal source, and the existing LLM adapter as the copilot surface.

**Critical pitfall:** Letting raw event streams or vendor webhooks become a second source of truth will fracture identity, attribution, and auditability.

## Implications for Roadmap

Suggested phase structure:

1. **Schema and contract hardening** – add JSON-schema enforcement and custom-object envelopes
   - Addresses: canonical CRM schema, safe copilot actions, extensible custom fields
   - Avoids: schema drift and mutation ambiguity

2. **Identity and behavioral intelligence** – extend activity normalization, stitching, and account/workspace grouping
   - Addresses: identity graph, behavioral tracking, attribution lineage
   - Avoids: duplicate profiles and lost anonymous history

3. **Workspace surface upgrade** – improve Kanban, table, timeline, and pipeline views with headless UI primitives
   - Addresses: pipeline/workspace views and operator productivity
   - Avoids: UI lock-in and hard-to-test widget kits

4. **Outbound and reporting reliability** – formalize queued send execution, delivery webhooks, and rollup views
   - Addresses: outbound messaging execution, attribution, reporting
   - Avoids: request-time timeouts and brittle dashboards

5. **Copilot hardening** – keep AI actioning bounded, approval-aware, and grounded in CRM evidence bundles
   - Addresses: AI copilot support and governed automation
   - Avoids: prompt-only mutation paths and silent actions

**Phase ordering rationale:** schema first, then identity/event truth, then operator UI, then outbound/reporting, then copilot hardening on top of stable truth layers.

**Research flags for phases:**
- Identity confidence tuning needs phase-level calibration.
- Outbound retry policy and queue semantics need implementation-time load testing.
- Reporting should remain CRM-native; full warehouse work can stay deferred.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against current repo architecture and official docs |
| Features | HIGH | Repo requirements already define the CRM scope clearly |
| Architecture | HIGH | Existing RLS, tracking, and copilot boundaries are already present |
| Pitfalls | HIGH | Brownfield risk is mostly duplication and governance drift |

## Gaps to Address

- Whether outbound scheduling should use pure Supabase queueing or a dedicated workflow runtime depends on expected send volume.
- Exact copilot action envelopes should be finalized per role and approval policy.
- Predictive scoring thresholds need later empirical tuning, not upfront overdesign.

## Sources

- Repo roadmap and requirements for completed CRM phases
- Supabase official docs for RLS, pgvector, pg_jsonschema, and queue support
- PostHog official docs for identify and group analytics
- Resend and Twilio official Node SDK docs
- TanStack Table and dnd kit official docs
