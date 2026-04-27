# Phase 210 Context - Connector Wow Loop and Recovery

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on plan shape, ownership drift, missing validation, and incomplete dependency gating.

## Why this phase exists

Phase 210 is where MarkOS has to prove that live data can enter the system safely, quickly, and usefully. The point is not "integrations exist"; the point is:

- operators can connect a small number of high-value data sources quickly
- the first connector creates a useful wow audit within the target window
- connector failure becomes visible blocked work with a precise recovery path
- downstream agents do not quietly act on stale, missing, or permission-broken data

Connectors are not passive data pipes. They are governed operating inputs that later feed audits, briefs, tasks, weekly narrative, learning, SaaS health, and future growth motions.

## Canonical inputs

- `obsidian/work/incoming/03-SOCIAL-DEEP-INTEGRATION.md`
- `obsidian/work/incoming/04-INTELLIGENCE-LAYER.md`
- `obsidian/work/incoming/11-ONBOARDING-ARCHITECTURE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`

## Ownership boundary

### Direct ownership

- `CONN-01..06`
- `QA-01..15`

### Integrates with, but does not re-own

- `COMP-01` from Phase 206 for consent, retention, privacy, and connector-risk posture
- `RUN-01..08` from Phase 207 for dependent-run pause, retry, and blocked-work lineage
- `TASK-01..05` from Phase 208 for recovery tasks, operator visibility, and impacted-work routing
- `EVD-01..06` from Phase 209 for evidence-backed connector outputs and recovery evidence posture

### Downstream consumers, not in-scope ownership

- Phase 211 loop objects and dispatch gates consume connector readiness
- Phase 213 Tenant 0 uses connector inventory and wow/recovery posture
- Phases 214-220 consume connector substrate for SaaS, health, PLG, ABM, community, and developer-growth paths

## Existing implementation substrate to inspect

- `lib/markos/mcp/sessions.cjs`
- `lib/markos/webhooks/engine.ts`
- `lib/markos/webhooks/engine.cjs`
- `lib/markos/outbound/providers/base-adapter.ts`
- `app/(markos)/oauth/consent/page.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `.planning/codebase/INTEGRATIONS.md`
- Phase 206 connector/privacy doctrine
- Phase 207 run state, retry, and DLQ doctrine
- Phase 208 recovery/task visibility doctrine
- Phase 209 evidence doctrine

## Required phase shape

1. Add a Wave 0.5 upstream preflight, architecture lock, and validation baseline before connector contracts are defined.
2. Define `ConnectorInstall` with auth model, scopes, credential reference, status, cadence, retention, and recovery linkage.
3. Define a Nango versus direct adapter decision matrix grounded in official doc evidence.
4. Define max-3 onboarding recommendation logic with value-unlock copy and failure-task posture.
5. Define the first read-only wow audit path and fallback variants for analytics-led, CRM-led, and social-led tenants.
6. Define dependent-agent pause and recovery task behavior so degraded connectors block unsafe downstream work.
7. Define backfill, retry, DLQ, recovery evidence, and future connector compatibility boundaries without prematurely expanding scope.

## Non-negotiables

- No raw connector secrets in logs, prompts, tasks, approvals, or MCP payloads.
- No connector failure that silently degrades agent behavior.
- No onboarding recommendation list longer than three initial connectors.
- No connector data used without explicit scope, retention, and consent posture.
- No write-capable first-wow path; the first wow must be read-only and low-risk.
- No passive connector dashboard that fails to create audits, tasks, narrative inputs, or recovery evidence.
- No pretending recovery is solved locally if the task/run/compliance substrate is not ready.

## Done means

Phase 210 has an executable plan set that produces named contracts and guardrails for live connector value and recovery:

- `.planning/connectors/210-upstream-readiness.md`
- `.planning/connectors/connector-install-contract.md`
- `.planning/connectors/adapter-decision-matrix.md`
- `.planning/connectors/onboarding-recommendation-policy.md`
- `.planning/connectors/first-wow-audit-contract.md`
- `.planning/connectors/recovery-and-pause-policy.md`
- `.planning/connectors/backfill-and-recovery-evidence.md`
- `.planning/connectors/future-connector-compatibility-map.md`

At that point, GSD can execute a connector system that creates early value, visible failure posture, and clean downstream inputs instead of brittle or silent integrations.
