# Phase 217 Research - SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness

## Primary research question

How should MarkOS expose the SaaS Suite through revenue metrics, SAS agents, API, MCP, and UI without creating a separate ungoverned product surface?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Revenue formulas | What are the canonical formulas for MRR, ARR, NRR, GRR, churn, expansion, contraction, and cohorts? | Metric definitions |
| Source precedence | Which source wins when billing, processor, accounting, and manual records disagree? | Reconciliation rules |
| SAS agents | What runtime substrate is required before each SAS agent becomes executable? | Agent readiness matrix |
| API | What `/v1/saas/*` endpoint families are needed first? | Contract candidate list |
| MCP | Which `markos-saas` tools are required for agentic workflows? | MCP tool contract |
| UI | What SaaS navigation and dashboards are activation-gated? | UI surface map |
| Security | Which scopes, RLS policies, audit events, and rate limits are required? | Security checklist |
| Post-217 strategy | Which API/MCP/UI namespaces and metric outputs must be reserved for SaaS Marketing OS Strategy modules without making them active yet? | Growth translation gate |

## Sources to inspect

- `contracts/*`, `contracts/flow-registry.json`, and OpenAPI build scripts.
- MCP server/tool registration code.
- App navigation/layout and settings/billing/dashboard components.
- Current AgentRun/task/approval/cost visibility implementation.
- Revenue/CRM reporting code.
- SaaS Suite agent definition files under `.agent/markos/agents/`.
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`

## Required research output

- Metric formula table.
- Source reconciliation model.
- Agent readiness and dependency matrix.
- API/MCP contract proposal.
- UI route proposal.
- Security and acceptance tests implied.

## Codebase Research Addendum - 2026-04-23

### Current-code support

- Contract files, flow registry, OpenAPI build patterns, MCP tool registry, and app shell/navigation patterns already exist.
- MCP has tenant-bound sessions, scopes, budget caps, approval, cost metering, and generated tool schemas.
- CRM reporting can calculate readiness and executive summaries over current CRM records.
- Planned SAS agent definition files exist under `.agent/markos/agents/`, but they are target architecture only.

### Gaps

- No `/v1/saas/*` contract family exists.
- No `markos-saas` UI or SaaS navigation gate exists.
- No SaaS revenue metric table or formula source of truth exists for MRR, ARR, NRR, GRR, churn, expansion, contraction, and cohorts.
- No SAS agent runtime wiring exists.
- No MCP SaaS tools exist.
- No source precedence model exists when billing, processor, accounting, CRM, and manual records disagree.

### Recommendation

Phase 217 should expose SaaS Suite facts through API/MCP/UI only after Phases 214-216 provide activation, subscriptions, billing, product usage, support, and health data. SAS agents should remain non-executable until each has AgentRun v2, evidence, pricing, approval, cost, and UI acceptance criteria.

### Tests implied

- Revenue formula tests with edge cases for churn, expansion, contraction, refunds, and partial periods.
- Source precedence tests across billing, processor, accounting, CRM, and manual corrections.
- API contract and MCP schema tests for `markos-saas` tools.
- UI gate tests proving SaaS surfaces appear only for activated SaaS tenants.
- Agent readiness tests proving planned agents cannot execute without required contracts.
