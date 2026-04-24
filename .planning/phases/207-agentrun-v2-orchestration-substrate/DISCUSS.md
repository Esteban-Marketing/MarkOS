# Phase 207 - AgentRun v2 Orchestration Substrate (Discussion)

> Refreshed on 2026-04-23 with `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` as mandatory input. This phase upgrades real existing run logic; it does not invent orchestration in a vacuum.

**Date:** 2026-04-23  
**Milestone:** v4.0.0 SaaS Readiness / MarkOS v2 compliance track  
**Depends on:** Phases 201, 202, 204, and 205, with downstream consumers in Phases 208-220  
**Quality baseline applies:** all 15 gates

## Goal

Turn the current fragmented run foundations into one canonical orchestration substrate for MarkOS.

Phase 207 is about unifying what already exists across onboarding, CRM, MCP, billing, and future CLI/UI work into a single durable run/event/task/cost model.

## Mandatory inputs

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-RESEARCH.md`
- `supabase/migrations/53_agent_run_lifecycle.sql`
- `onboarding/backend/agents/run-engine.cjs`
- `lib/markos/crm/playbooks.ts`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/usage-normalizer.ts`

## Current code evidence

- Durable run/event/side-effect tables already exist.
- In-memory run lifecycle helpers already exist.
- CRM playbooks already create and transition run envelopes.
- MCP already has a strict invocation pipeline with auth, approval, cost, invoke, and true-up semantics.
- Billing can already normalize agent-run usage events.

## Codebase-specific gap

MarkOS does not need its first run model. It needs its first unified run model.

Right now the repo has adjacent orchestration concepts:

- onboarding run lifecycle
- CRM copilot/playbook runs
- MCP tool-call pipeline
- task UI state
- billing usage normalization

Phase 207 must merge those into one durable system of record instead of letting each domain keep its own semantics forever.

## Scope (in)

- AgentRun v2 objects and event stream
- AgentChain DAG/dependency model
- priority, concurrency, retry, timeout, pause, cancel, and DLQ policy
- approval and task handoff integration
- cost estimate/actual fields and billing linkage
- adoption path for current run-producing domains

## Scope (out)

- full human interface redesign (Phase 208)
- evidence model centralization (Phase 209)
- connector operating loop (Phase 210)
- activation of future PRC/SAS/PLG/ABM growth agents

## Refreshed decisions

### D-207-01: Additive migration before replacement

Phase 207 should extend the current schema and behavior before forcing every existing domain to migrate at once.

### D-207-02: CRM and MCP are first migration anchors

CRM playbook/coplaybook paths and MCP tool invocation already carry run-like semantics. They should be first-class migration targets, not exceptions.

### D-207-03: Phase 204 must consume, not predefine, run truth

CLI `run` and `status` should align to the substrate designed here. Phase 204 must not lock incompatible local semantics first.

### D-207-04: Task handoff is part of orchestration, not a later convenience

Blocked, failed, rejected, or approval-waiting runs must naturally feed the Phase 208 work surfaces.

### D-207-05: Cost is a first-class run concern

Estimated and actual cost, budget posture, and pricing/billing context belong on the run substrate, not just in downstream billing reports.

## Threat-model focus

silent failure, duplicate side effects, orphaned approvals, retry storms, starvation, cross-tenant leakage, inconsistent run truth across domains, and cost-oblivious execution

## Success criteria

- There is one canonical run substrate that current and future domains can converge on.
- CRM/MCP/billing/task work can speak the same run language.
- Failures and approvals naturally create human-visible work.
- Cost and idempotency are first-class at the run level.

## Open questions

- Which component owns the durable scheduler and queue semantics?
- Does `onboarding/backend/agents/run-engine.cjs` become a compatibility adapter, or is it retired after migration?
- Which existing states can remain backward-compatible aliases, and which require canonical replacement?

## Planning note

No new top-level phase is required. The deep audit confirmed that the missing work belongs inside Phase 207, but with much stronger migration discipline than earlier planning captured.

## References

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
