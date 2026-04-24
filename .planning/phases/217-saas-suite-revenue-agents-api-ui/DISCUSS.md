# Phase 217 Discuss: SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness

## Goal

Expose the SaaS Suite as an operator-ready product surface: revenue intelligence, SAS agent tier, `/v1/saas/*` API, `markos-saas` MCP tools, and SaaS-specific navigation.

## Source Doctrine

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `.agent/markos/references/saas-suite.md`
- `.planning/REQUIREMENTS.md` SAS-09..10

## Phase Artifacts

- `217-CONTEXT.md` - implementation context for revenue intelligence, SAS agents, API, MCP, and UI.
- `217-RESEARCH.md` - research agenda for revenue formulas, source precedence, SAS agent readiness, `/v1/saas/*`, `markos-saas`, and UI gating.

## Discuss Decisions

| Decision | Options | Recommended default |
|---|---|---|
| Revenue dashboard | MRR only, full SaaS metrics, phased | MRR/ARR/churn first, NRR/GRR/cohorts/forecast next |
| SAS agents | docs-only, thin wrappers, runnable agents | runnable only after AgentRun/task/approval contracts are ready |
| API shape | one omnibus endpoint, resource families under `/v1/saas/*` | resource families under `/v1/saas/*` |
| MCP shape | fold into existing MCP, new `markos-saas` server | new logical `markos-saas` tool family with shared auth/session substrate |
| UI navigation | hidden settings tabs, SaaS sidebar section, standalone app | SaaS sidebar section gated by activation |
| Doc 17 target agents | activate now, register as planned, defer until contracts | Defer runnable status; reserve post-217 translation gate |

## Research Needed

- Current API route conventions and fresh F-ID allocation.
- Existing MCP auth/session/tool registration patterns.
- Revenue metric formulas, source precedence, and reconciliation with billing/accounting.
- UI routes and design system components for SaaS Overview, Subscriptions, Plans, Revenue, Churn, Invoices, Support, and Product Usage.
- SAS agent token registration and cost/approval posture.
- Future namespace needs for PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, and REV agents.

## Acceptance Gate

- `SaaSMRRSnapshot` contract and revenue metric definitions are written.
- SAS-01 through SAS-06 have role, input, output, cadence, approval, and cost posture.
- `/v1/saas/*` and MCP tool families have contract candidates with fresh IDs.
- SaaS UI navigation appears only for activated SaaS tenants.
- Pricing, billing, support, and legal compliance actions remain approval-aware.
- Post-217 SaaS Marketing OS Strategy translation gate is documented before target growth agents become runnable.
