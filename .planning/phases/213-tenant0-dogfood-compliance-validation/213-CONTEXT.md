# Phase 213 Context - Tenant 0 Dogfood and Compliance Validation

**Status:** Reframed for executable planning on 2026-04-27.

## Why this phase exists

MarkOS has to prove it can run MarkOS on MarkOS before it can credibly claim enterprise readiness or open the SaaS Suite execution lane. Tenant 0 is the closeout gate: real inputs, sourced claims, Pricing Engine posture, approvals, connector reality, measured outcomes, learning, and a final vault-to-codebase readiness decision.

This phase closes v4.0.0 and decides whether Phases 214-217 are safe to execute. It does not re-own upstream systems; it validates that they work together honestly.

## Canonical inputs

- `obsidian/work/incoming/01-PRODUCT-VISION.md`
- `obsidian/work/incoming/14-GO-TO-MARKET.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-200-FORWARD-INCOMING-DISCUSSION-REVIEW.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`

## Ownership boundary

- Direct ownership for this phase: `T0-01..05` and `QA-01..15`.
- Upstream dependency families remain owned by earlier phases and are consumed here as readiness inputs:
  - `PRC-01..09`, `BILL-02` from Phase 205
  - `COMP-01` from Phase 206
  - `RUN-01..08` from Phase 207
  - `TASK-01..05` from Phase 208
  - `EVD-01..06` from Phase 209
  - `CONN-01..06` from Phase 210
  - `LOOP-01..08` from Phase 211
  - `LRN-01..05` from Phase 212

## Existing implementation substrate to inspect

- Tenant/org provisioning and onboarding seed data.
- Brand pack and business-model capture from onboarding.
- Pricing placeholder policy and Tenant 0 pricing dogfood outputs from Phase 205.
- SOC2 evidence posture and language boundaries from Phase 206.
- AgentRun/task/approval/evidence substrate from Phases 207-209.
- Connector health and recovery posture from Phase 210.
- Loop artifact chain from Phase 211.
- Learning and literacy handoff artifacts from Phase 212.

## Required phase shape

1. Run a Wave 0.5 upstream preflight and architecture lock across Phases 205-212.
2. Define the canonical Tenant 0 workspace profile, connector inventory, data-source policy, and proof allowlist.
3. Run one real MarkOS operating loop on an already shipped capability with evidence, approval, dispatch, measurement, and learning.
4. Use approved Pricing Engine output or the exact sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` for every pricing-sensitive public surface.
5. Define public evidence, case-study, and compliance-language boundaries.
6. Produce a requirement-to-implementation matrix and an unresolved-gap register.
7. Emit an explicit go/no-go artifact for Phases 214-217.
8. Carry doc 17 only as future strategy context without claiming the SaaS Marketing OS is already implemented.

## Non-negotiables

- No theatrical, synthetic, or mock proof presented as real Tenant 0 results.
- No public claim without evidence linkage, approval linkage, and freshness status.
- No hard-coded public pricing before approved PricingRecommendation output.
- No enterprise-readiness or compliance claim without requirement-to-implementation traceability.
- No doc 17 growth-system claim until post-217 translation and implementation exist.

## Done means

GSD can point to a named Tenant 0 proof pack, a pricing/public-claim audit, a final requirement matrix, an unresolved-gap register, and a signed go/no-go decision for Phases 214-217.
