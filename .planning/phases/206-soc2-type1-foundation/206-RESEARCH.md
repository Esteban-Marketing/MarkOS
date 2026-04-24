# Phase 206 Research - SOC 2 Type I Foundation

## Primary research question

What SOC 2 Type I control foundation is required for MarkOS to safely operate the v2 Marketing Operating System, including AgentRun, approvals, Pricing Engine, connectors, evidence, learning, Tenant 0 proof, and future SaaS Suite growth motions?

## Files inspected

- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/governance/contracts.ts`
- `lib/markos/mcp/sessions.cjs`
- `lib/markos/mcp/approval.cjs`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/contracts.ts`
- `lib/markos/billing/reconciliation.cjs`
- `lib/markos/crm/agent-actions.ts`
- `supabase/migrations/53_agent_run_lifecycle.sql`
- `supabase/migrations/53_agent_approval_immutability.sql`
- `supabase/migrations/54_billing_foundation.sql`
- `supabase/migrations/70_markos_webhook_subscriptions.sql`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `obsidian/work/incoming/15-PRICING-ENGINE.md`
- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`

## Existing capability

MarkOS has a strong control substrate but not a complete SOC 2 readiness package:

- Tenant isolation, RLS posture, org/tenant membership, and role boundaries already exist from Phase 201.
- Audit staging, hash-chain audit behavior, MCP session lifecycle audit, and webhook lifecycle audit are already represented in code and tests.
- MCP sessions use opaque tokens, token hashing, 24-hour rolling TTL, tenant binding, revoke flow, and best-effort audit emission.
- Mutating MCP tools require approval tokens and run through a 10-step auth/rate-limit/free-tier/approval/cost/invoke/true-up pipeline.
- Governance evidence packs already gather privileged-action evidence across audit, identity, billing, approval logs, and provider sync.
- Billing reconciliation preserves failed and restored provider sync attempts, hold evidence, restored snapshots, and invoice line item lineage.
- CRM agent actions already require approval packages for mutation outcome recording.

## Gaps

- No auditor-ready control matrix maps each v2 object family to SOC 2 trust service criteria, control owner, evidence source, and test procedure.
- No `control_id` or `control_evidence_id` layer binds AgentRun, pricing, connector, learning, and SaaS Suite events into an auditor workspace.
- No formal AI governance policy covers prompt/version control, model/provider changes, approval gates, tool mutation classes, hallucination/unsupported-claim controls, or agent cost controls.
- No Pricing Engine control evidence exists because Phase 205 has not shipped.
- No ConnectorInstall substrate exists, so vendor privacy, retention, credential rotation, and sync-failure evidence cannot yet be automated.
- No cross-tenant learning anonymization, sample-size, or central-promotion governance exists.
- No Tenant 0 public-proof control exists to separate internal roadmap claims from externally supportable claims.

## Recommended control families

| Control family | Scope | Required evidence |
|---|---|---|
| Access and tenant isolation | orgs, tenants, roles, MCP sessions, API keys, CLI keys | membership snapshot, RLS test output, session create/revoke audit, privileged action log |
| Agent governance | AgentRun, AgentChain, tool calls, approvals, retries, cost gates | run envelope, state transition log, approval package, side-effect ledger, cost estimate/actual |
| Pricing governance | PricingRecommendation, PriceTest, billing handoff, discounts, save offers | evidence map, cost model snapshot, approval decision, Stripe/provider mutation proof |
| Connector privacy | OAuth/connectors, credentials, scopes, sync logs, retention | connector install record, scope grant, encrypted secret policy, sync status, recovery task |
| Evidence and claims | claims, source quality, TTL, unsupported gaps | EvidenceMap, source quality score, freshness check, approval blocker outcome |
| Learning governance | performance logs, tenant overlays, central literacy candidates | anonymization record, sample-size check, admin review decision, provenance |
| Incident and BCP | webhook DLQ, connector failure, billing hold, security incident | incident record, communication log, recovery criteria, post-mortem link |
| Tenant 0 proof | MarkOS dogfood loops, public case study, enterprise claims | source-backed proof pack, claim approval, pricing placeholder status, compliance gate |

## Research decisions

- Phase 206 should not wait for all later phases to ship, but it must define control placeholders and evidence contracts for 207-217.
- Type I readiness should certify that control design exists and is consistently represented in architecture, not that every future growth module is implemented.
- Evidence automation should be layered over existing audit/evidence functions instead of introducing a parallel compliance data store.
- Any public enterprise positioning should be blocked until Phase 213 creates a Tenant 0 proof package and Phase 206 records the claim boundary.

## Tests implied

- Control registry contract tests: every control has owner, system, evidence source, cadence, and test procedure.
- Evidence pack tests: privileged actions include approval, run, pricing, connector, billing, and learning references when applicable.
- RLS and audit tests: SOC2 evidence tables are tenant-safe and append-only where required.
- Approval governance tests: AI, pricing, connector, billing, and public-claim mutations cannot bypass approval controls.
- Auditor export tests: a Type I readiness bundle can be generated without leaking tenant secrets or cross-tenant data.

## Phase-plan impact

The existing 206-01 through 206-07 plan split is correct. Execution should begin with a control inventory, then AI governance, pricing/billing controls, connector/privacy controls, evidence automation, incident/BCP, and the auditor workspace.
