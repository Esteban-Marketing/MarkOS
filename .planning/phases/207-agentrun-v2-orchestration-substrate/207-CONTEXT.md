# Phase 207 Context - AgentRun v2 Orchestration Substrate

**Status:** refreshed from the 2026-04-23 deep codebase-vault audit

## Why this phase exists

The vault now treats AgentRun as the spine of MarkOS, but the current repo already has several run-like systems. Phase 207 exists to unify them before later phases build UI, evidence, connectors, learning, SaaS, and growth on top of conflicting execution semantics.

## Canonical inputs

- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/204-cli-markos-v1-ga/204-CONTEXT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md`

## Existing implementation substrate to inspect

- `supabase/migrations/53_agent_run_lifecycle.sql`
- `onboarding/backend/agents/run-engine.cjs`
- `api/crm/copilot/playbooks.js`
- `lib/markos/crm/playbooks.ts`
- `lib/markos/mcp/server.cjs`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/usage-normalizer.ts`
- `app/(markos)/operations/tasks/*`

## Required phase shape

1. Extend current run schema into canonical AgentRun v2 objects.
2. Introduce chain/dependency semantics without breaking current run consumers.
3. Normalize state, retry, DLQ, and cost behavior across current run-producing systems.
4. Define task/approval handoff as part of orchestration.
5. Provide one durable API/event stream that CLI, UI, MCP, and agents can share.
6. Create an explicit adoption sequence for current CRM, MCP, onboarding, and future agent families.

## Codebase-specific constraints

- Existing CRM playbook flows cannot be casually broken.
- Existing MCP cost/approval pipeline is too valuable to bypass.
- Existing billing normalization should feed run-cost truth rather than remain a disconnected afterthought.
- Existing task UI should become a downstream consumer, not another orchestration store.

## Recommended adoption order

1. schema and contract extension
2. durable run API/event stream
3. CRM playbook compatibility
4. MCP pipeline alignment
5. billing cost alignment
6. Phase 208 task/approval consumption

## Non-negotiables

- No new run-producing domain should invent parallel lifecycle semantics after this phase.
- No failed or blocked run should disappear without task/DLQ evidence.
- No side effect should bypass idempotency posture.
- No pricing- or cost-producing run should lack billing-aware cost fields once technically possible.

## Done means

Later phases can assume one orchestration substrate exists instead of rebuilding orchestration per feature family.
