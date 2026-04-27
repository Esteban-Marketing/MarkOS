# Phase 211 Context - Content, Social, and Revenue Loop

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on plan shape, ownership drift, missing validation, and incomplete dependency gating.

## Why this phase exists

Phase 211 is where MarkOS has to stop looking like a collection of useful subsystems and prove one governed marketing operating loop from strategy to learning:

`strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn`

This is the first phase that must make pricing posture, evidence posture, approval policy, connector health, attribution truthfulness, and learning handoff work together as one coherent system. If this phase is ambiguous, every downstream claim about Tenant 0, literacy evolution, or future growth modules inherits that ambiguity.

Doc 17 makes this phase especially important because PLG, ABM, referral, community, event, PR, partnership, and developer-marketing modules are meant to be future consumers of this loop, not substitutes for proving it.

## Canonical inputs

- `obsidian/work/incoming/03-SOCIAL-DEEP-INTEGRATION.md`
- `obsidian/work/incoming/05-CONTENT-ENGINE.md`
- `obsidian/work/incoming/07-PIPELINE-MODULES.md`
- `obsidian/work/incoming/14-GO-TO-MARKET.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`

## Ownership boundary

### Direct ownership

- `LOOP-01..08`
- `QA-01..15`

### Integrates with, but does not re-own

- `PRC-01..09`, `BILL-02` from Phase 205 for pricing context and placeholder-safe public copy
- `COMP-01` from Phase 206 for approval-aware AI governance and compliance posture
- `RUN-01..08` from Phase 207 for AgentRun lineage, failure visibility, and execution truth
- `TASK-01..05` from Phase 208 for task routing, approval inbox, and weekly narrative substrate
- `EVD-01..06` from Phase 209 for EvidenceMap, source quality, TTL, and claim-risk posture
- `CONN-01..06` from Phase 210 for connector health, recovery, and dispatch readiness
- `LRN-01..05` from Phase 212 as downstream learning consumers of Phase 211 measurement outputs

## Existing implementation substrate to inspect

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/mcp/tools/execution/schedule-post.cjs`
- `lib/markos/crm/copilot.ts`
- `lib/markos/crm/agent-actions.ts`
- `lib/markos/crm/attribution.ts`
- `lib/markos/outbound/scheduler.ts`
- `lib/markos/outbound/conversations.ts`
- Phase 205 pricing doctrine and placeholder rules
- Phase 206 compliance posture and approval-risk controls
- Phase 208 task and approval doctrine
- Phase 209 evidence doctrine
- Phase 210 connector readiness doctrine

## Required phase shape

1. Add a Wave 0.5 upstream preflight, architecture lock, and validation baseline before loop objects are defined.
2. Define `MarketingStrategyRun` and `ContentBrief` with audience, offer, pricing, proof, and measurable-target constraints.
3. Define `MarketingArtifact` and `ArtifactAudit` so draft generation and gating are explicit rather than implied.
4. Define `DispatchAttempt` and approval-to-dispatch state transitions for one controlled channel path.
5. Define `SocialSignal` routing and escalation posture that creates work instead of passive dashboards.
6. Define revenue feedback objects that connect campaign/artifact activity to CRM or leading-indicator evidence.
7. Define a measurement handoff contract that produces expected performance envelopes, actual outcomes, next-task recommendations, weekly narrative input, and clean downstream learning input.
8. Keep doc 17 growth modules as future consumers only, with a named compatibility map instead of implicit scope creep.

## Non-negotiables

- No public content, reply, DM, ad change, CRM mutation, data export, or price claim without approval or earned-autonomy record.
- No pricing-sensitive artifact without Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- No factual claim without EvidenceMap support or an explicit inference label.
- No external dispatch when connector state is missing, degraded, stale, or unverified.
- No social reply, DM, moderation action, or escalation mutation without an explicit route policy and approval posture.
- No measurement-only reporting that fails to create tasks, weekly narrative evidence, or learning handoff.
- No Phase 212 implementation in this phase; only clean handoff contracts.
- No doc 17 growth module implementation in this phase; only loop compatibility and first proof.

## Done means

Phase 211 has an executable plan set that produces named contracts and guardrails for the first governed operating loop:

- `.planning/marketing-loop/211-upstream-readiness.md`
- `.planning/marketing-loop/strategy-brief-contract.md`
- `.planning/marketing-loop/artifact-audit-contract.md`
- `.planning/marketing-loop/dispatch-approval-policy.md`
- `.planning/marketing-loop/social-signal-routing.md`
- `.planning/marketing-loop/revenue-feedback-model.md`
- `.planning/marketing-loop/measurement-handoff-contract.md`
- `.planning/marketing-loop/growth-loop-compatibility-map.md`

At that point, GSD can execute one credible marketing loop without pretending that pricing, evidence, approvals, connectors, or downstream learning are already solved inside the phase.
