# Phase 221 - CDP Identity, Audience, and Consent Substrate (Context)

**Status:** Seeded for future discuss/research  
**Purpose:** Starting context only; not implementation truth.

## Canonical Inputs

- `obsidian/work/incoming/20-CDP-ENGINE.md`
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md`
- `obsidian/work/incoming/18-CRM-ENGINE.md`
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

## Existing Substrate To Inspect

- Historical CRM/customer work from phases 100-105.
- Current tenancy, RLS, audit, webhook, billing, and reporting substrate.
- Future SaaS Suite facts around subscriptions, usage, health, and revenue.
- Phase 209 evidence and freshness expectations.

## Must Stay True

- One identity truth and one consent truth.
- No passive warehouse posture; CDP facts must feed action.
- No downstream engine bypasses suppression, deletion, or jurisdiction rules.
- Every activation-facing decision stays explainable and auditable.

## Research Questions

- What profile, event, and consent facts already exist in the codebase?
- What current identity joins are implicit and need explicit contracts?
- What merge/split workflows need human review?
- How should audience snapshots be versioned and activated safely?
