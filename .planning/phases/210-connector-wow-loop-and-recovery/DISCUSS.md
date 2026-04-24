# Phase 210 - Connector Wow Loop and Recovery (Discussion)

**Date:** 2026-04-22  
**Milestone:** v4.0.0 SaaS Readiness / MarkOS v2 compliance track  
**Depends on:** Phase 207 AgentRun v2 substrate, Phase 208 human interface, Phase 209 evidence substrate  
**Quality baseline applies:** all 15 gates

## Goal

Implement the v2 connector intelligence loop: recommend no more than three initial connectors, connect live data quickly, produce a wow audit within 30 minutes, and recover visibly when data breaks.

## Current code evidence

- Webhook subscription engine is mature.
- MCP OAuth/session surfaces exist.
- Tenant and audit foundations are strong.

## Gap

There is no canonical `ConnectorInstall` substrate for GA4, GSC, social, CRM, and analytics sources; no max-3 connector onboarding recommendation; no live-data wow audit path; and no dependent-agent pause/recovery task path.

## Proposed plan slices

| Slice | Purpose |
|---|---|
| 210-01 | ConnectorInstall contract/schema with credentials, scopes, status, cadence, and retention |
| 210-02 | Nango/direct adapter decision matrix and official API research |
| 210-03 | Onboarding connector recommendation max-3 UX |
| 210-04 | GA4/GSC or equivalent analytics/search wow audit |
| 210-05 | Connector failure pauses dependent agents and creates recovery tasks |
| 210-06 | Backfill, retry, and recovery evidence |

## Success criteria

- First live connector can be connected in under 10 minutes.
- First wow moment can appear within 30 minutes.
- Connector failures are visible, owned, and recoverable.
- Connector data feeds audits, briefs, tasks, narratives, or learning, not passive dashboards.
