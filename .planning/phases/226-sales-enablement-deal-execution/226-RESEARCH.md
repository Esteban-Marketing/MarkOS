# Phase 226 Research - Sales Enablement and Deal Execution

## Primary research question

What is the smallest governed sales-enablement layer MarkOS can add so battlecards, proof packs, proposal support, and win/loss learning tie directly into CRM, evidence, Pricing Engine, and approvals?

## Standard Stack

- Reuse CRM execution and playbook substrate.
- Reuse Pricing Engine and evidence doctrine instead of embedding quote/proof logic locally.
- Keep sales enablement as a thin decision and proof layer on top of CRM and analytics truth.

## Architecture Patterns

- Sales artifacts as governed objects (`Battlecard`, `ProofPack`, `ProposalSupport`, `ObjectionRecord`, `WinLossRecord`).
- Replay-safe playbook/application patterns for safe deal-step execution.
- Freshness-aware proof and claim linkage.
- Proposal and quote support consume pricing outputs instead of owning pricing.

## Don't Hand-Roll

- Proposal or quote logic outside Pricing Engine.
- Sales notes or battlecards outside CRM/evidence linkage.
- Competitive proof that bypasses claim-safety and freshness rules.

## Common Pitfalls

- Treating CRM tasks and notes as sufficient sales enablement.
- Mixing pricing recommendation logic into proposal generation.
- Creating proof packs without TTL/freshness and audit lineage.

## Codebase Findings

### Files inspected

- `lib/markos/crm/playbooks.ts`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/workspace-data.ts`
- `api/crm/activities.js`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`

### Existing support

- CRM playbooks already support approval-aware, replay-safe, bounded actions like create task, append note, update stage, and update owner.
- CRM execution logic already computes urgency, stalled work, inbound touches, success risk, and bounded actions.
- The pricing and evidence phases already define the right upstream truth sources, even if they are not implemented yet.

### Missing capabilities

- No battlecard, proof pack, objection library, proposal-support, or win/loss object model.
- No dedicated deal-room or sales-enablement workspace.
- No freshness-aware proof assembly tied to evidence and pricing.
- No structured objection/win-loss learning loop.

## Recommended Implementation Path

1. Build sales enablement as governed CRM companions rather than a separate workspace first.
2. Use playbook/replay-safe patterns for bounded deal-execution steps.
3. Introduce proof and proposal objects only after freshness, evidence, and pricing references are explicit.
4. Feed win/loss and objection records back into analytics and learning instead of leaving them as closed notes.
5. Keep customer-facing commercial claims approval-gated by default.

## Tests Implied

- Playbook and bounded-action regression tests.
- Proof freshness and evidence-link tests.
- Pricing-safe proposal and quote-support tests.
- Win/loss writeback tests.
- Browser tests for review/approve/apply deal-support flows.

## Research Decisions

- Phase 226 should piggyback on CRM execution and playbooks first.
- Proposal support must remain downstream of Pricing Engine, never parallel to it.
- Proof freshness and evidence lineage are required from the first slice.
