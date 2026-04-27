# Phase 209 Context - Evidence, Research, and Claim Safety

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on plan shape, ownership drift, missing validation, and incomplete dependency gating.

## Why this phase exists

MarkOS cannot be a trusted marketing operating system if it produces claims, pricing recommendations, competitive statements, outreach, PR, sales copy, support guidance, or strategic advice without evidence. Phase 209 is where evidence stops being scattered metadata and becomes a shared operating substrate with claim support, source quality, freshness, TTL, known gaps, and inference posture.

This phase is not the loop phase, not the pricing phase, and not the approval UI phase. It is the truth layer that those phases depend on.

## Canonical inputs

- `obsidian/work/incoming/04-INTELLIGENCE-LAYER.md`
- `obsidian/work/incoming/06-RESEARCH-ENGINE.md`
- `obsidian/work/incoming/05-CONTENT-ENGINE.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`

## Ownership boundary

### Direct ownership

- `EVD-01..06`
- `QA-01..15`

### Integrates with, but does not re-own

- `PRC-01..09`, `BILL-02` from Phase 205 for competitor pricing and recommendation evidence consumers
- `COMP-01` from Phase 206 for governance, public-claim, and compliance posture
- `RUN-01..08` from Phase 207 for evidence creation, reuse, and decision lineage on AgentRun
- `TASK-01..05` from Phase 208 for approval-evidence exposure and research follow-up work

### Downstream consumers, not in-scope ownership

- Phase 211 uses this evidence substrate for briefs, audits, and dispatch blocking
- Phase 213 uses it for Tenant 0 proof and public-claim safety
- Phases 219 and 220 use it for advocacy, ABM, PR, reviews, partnerships, and developer-marketing evidence rules

## Existing implementation substrate to inspect

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/audit-claim-strict.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/crm/reporting.ts`
- `lib/markos/crm/attribution.ts`
- `app/(markos)/operations/tasks/evidence-panel.tsx`
- Phase 205 pricing evidence doctrine
- Phase 206 governance and public-claim posture
- Phase 208 approval inbox doctrine

## Required phase shape

1. Add a Wave 0.5 upstream preflight, architecture lock, and validation baseline before evidence contracts are defined.
2. Define `EvidenceMap` as a first-class cross-domain object with claim, source, quality, freshness, TTL, known-gap, and inference fields.
3. Define source-quality score and research-tier policy, including a pricing-evidence bridge.
4. Define claim TTL, stale-context behavior, contradictory evidence posture, and known-gap handling.
5. Expose evidence posture in approval payloads and block unsupported claims by default.
6. Require agents to reuse non-stale research context before starting new research.
7. Lock citation, inference labeling, hallucination defense, and future claim-evidence consumer rules with tests and matrices.

## Non-negotiables

- No customer-facing factual claim without evidence or an explicit inference label.
- No unsupported claim in external dispatch or approval-ready state.
- No competitor or pricing claim without source quality, timestamp, and extraction posture.
- No public Tenant 0 proof without evidence and approval.
- No stale or contradictory evidence treated as fresh by default.
- No future PR, analyst, review, event, ABM, referral, partnership, or developer-marketing outreach without evidence rules.

## Done means

Phase 209 has an executable plan set that produces named contracts and guardrails for claim safety:

- `.planning/evidence/209-upstream-readiness.md`
- `.planning/evidence/evidence-map-contract.md`
- `.planning/evidence/source-quality-rubric.md`
- `.planning/evidence/pricing-evidence-bridge.md`
- `.planning/evidence/freshness-and-known-gaps-policy.md`
- `.planning/evidence/approval-claim-blocking-policy.md`
- `.planning/evidence/research-context-reuse.md`
- `.planning/evidence/hallucination-defense-fixtures.md`
- `.planning/evidence/future-claim-evidence-matrix.md`

At that point, GSD can execute a shared evidence substrate that makes MarkOS auditable, trustworthy, and safe to operate externally without pretending pricing, loop, or approval systems are owned inside this phase.
