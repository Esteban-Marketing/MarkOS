# Phase 217 Context - SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness

**Status:** Seeded from the 2026-04-22 SaaS Suite intake.

## Why this phase exists

Phase 217 turns the SaaS Suite into an operator-ready product surface: revenue intelligence, SAS agents, API contracts, MCP tools, and activation-gated UI navigation.

## Canonical inputs

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `.agent/markos/references/saas-suite.md`
- `.agent/markos/agents/markos-saas-*.md`
- `.planning/REQUIREMENTS.md` SAS-09..10

## Existing implementation substrate to inspect

- MCP server/session/tool registry from Phase 202.
- OpenAPI generation and contracts registry.
- App navigation, settings, dashboards, and billing UI.
- AgentRun, task, approval, and cost visibility substrate.
- Revenue/CRM reporting snapshots.

## Required phase shape

1. Define revenue metric source precedence and formulas.
2. Define `SaaSMRRSnapshot` and MRR waterfall.
3. Register SAS-01 through SAS-06 with inputs, outputs, cadence, approval posture, and cost visibility.
4. Define `/v1/saas/*` API families with fresh F-IDs.
5. Define `markos-saas` MCP tools and shared auth/session behavior.
6. Define SaaS Suite UI navigation and activation gating.
7. Verify Pricing Engine, billing, support, product, and legal actions remain approval-aware.
8. Define a post-217 translation gate for SaaS Marketing OS growth modules and target agents without activating them in this phase.

## Non-negotiables

- No unscoped SaaS API or MCP tool outside tenant auth/RLS/audit.
- No SAS agent without stable token, role, inputs, outputs, cost, approval posture, and failure behavior.
- No SaaS navigation for inactive or non-SaaS tenants.
- No revenue metric without definition, source, timestamp, and reconciliation state.
- No PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, or REV target agent becomes runnable without a future GSD phase assigning contracts, costs, approvals, tests, and surfaces.

## Done means

GSD can expose SaaS Suite functionality as a coherent product surface with traceable agents, contracts, MCP tools, UI, and revenue intelligence.
