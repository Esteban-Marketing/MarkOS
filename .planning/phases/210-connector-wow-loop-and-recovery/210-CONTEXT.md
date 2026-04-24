# Phase 210 Context - Connector Wow Loop and Recovery

**Status:** Seeded from the 2026-04-22 incoming 00-17 discussion review.

## Why this phase exists

The vault requires MarkOS to connect live data quickly, recommend no more than three initial connectors, produce a useful wow audit within 30 minutes, and recover visibly when data breaks. Connectors are not passive data pipes; they feed audits, briefs, tasks, narratives, learning, pricing, SaaS health, and future growth workflows.

## Canonical inputs

- `obsidian/work/incoming/03-SOCIAL-DEEP-INTEGRATION.md`
- `obsidian/work/incoming/04-INTELLIGENCE-LAYER.md`
- `obsidian/work/incoming/11-ONBOARDING-ARCHITECTURE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` CONN-01..06, TASK-01..05

## Existing implementation substrate to inspect

- OAuth/session code from MCP and tenant integration work.
- Webhook engine durability and recovery surfaces from Phase 203.
- Tenant settings/integrations UI.
- Onboarding flows and business profile capture.
- Any Nango references or connector abstraction code.
- Existing GA4/GSC/social/CRM/product analytics connector references.

## Required phase shape

1. Define ConnectorInstall contract/schema with auth type, scopes, encrypted credentials, status, sync cadence, retention, and recovery state.
2. Define max-3 connector recommendation UX with value-unlock copy.
3. Choose first live connector path for the wow audit.
4. Define dependent-agent pause and recovery task behavior.
5. Define backfill, retry, failure evidence, and status surface.
6. Create Nango/direct adapter decision matrix based on official API evidence.
7. Preserve future SaaS Suite and SaaS Marketing OS connector needs without expanding scope prematurely.

## Non-negotiables

- No raw connector secrets in logs, prompts, tasks, or MCP payloads.
- No connector failure that silently degrades agent behavior.
- No onboarding recommendation list longer than three initial connectors.
- No connector data used without scope, retention, and consent posture.
- No passive connector dashboard that fails to create audits, tasks, narratives, or learning.

## Done means

GSD can plan a connector system that creates early value and obvious recovery paths instead of brittle integrations.
