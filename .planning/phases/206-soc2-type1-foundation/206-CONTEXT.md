# Phase 206 Context - SOC 2 Type I Foundation

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on stub plans, downstream requirement overclaiming, missing validation, and a compatibility horizon that was too narrow for the phase scope.

## Why this phase exists

MarkOS is no longer a generic marketing SaaS with a few admin controls. It is becoming an agentic operating system with approval-gated mutations, pricing decisions, connector credentials, evidence-linked claims, learning overlays, Tenant 0 proof, and SaaS billing or support surfaces that later phases will expose publicly. If compliance posture is only described loosely, later phases can ship powerful features with no stable control doctrine to inherit.

Phase 206 exists to define that doctrine before orchestration, operator UX, evidence, connectors, learning, Tenant 0, and SaaS Suite execution rely on it.

This phase is not the place where those product families are implemented. It is the place where their control boundaries, evidence expectations, approval posture, and auditor-facing traceability are made explicit.

## Canonical inputs

- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-REVIEWS.md`

## Ownership boundary

### Direct ownership

- `COMP-01`
- `QA-01..15`

### Integrates with, but does not re-own

- `API-01`, `SDK-01`, `MCP-01`, and `WHK-01` from Phases 200, 202, and 203 for contract, session, webhook, and platform evidence posture
- `API-02` from Phase 201 for tenancy, RLS, auth, audit, membership, and lifecycle controls
- `CLI-01` from Phase 204 for operator-visible diagnostic and support surfaces
- `PRC-01..09`, `BILL-01`, and `BILL-02` from Phase 205 for pricing and billing control coverage
- `RUN-01..08` from Phase 207 for durable run, approval, side-effect, and replay evidence
- `TASK-01..05` from Phase 208 for human approval and recovery work visibility
- `EVD-01..06` from Phase 209 for claim safety, evidence freshness, and source-quality posture
- `CONN-01..06` from Phase 210 for connector privacy, credential, retention, and recovery posture
- `LOOP-01..08` from Phase 211 for dispatch, measurement, and low-risk autonomy boundaries
- `LRN-01..05` from Phase 212 for learning, anonymization, overlay expiry, and promotion controls
- `T0-01..05` from Phase 213 for public proof, internal dogfood evidence, and closeout compliance wording
- `SAS-01..10` from Phases 214-217 for subscription, billing, support, health, and SaaS module control coverage

### Translation gates and future placeholders

- Phases `207-217` are active translation targets: this phase must define control placeholders they can implement against
- Phases `218-220` are future growth translation gates: this phase must define the approval and evidence doctrine they inherit without pretending those modules are already implemented
- Commercial-engine phases `221-228` should inherit the same doctrine later, but they are not active execution scope in Phase 206

## Existing implementation substrate to inspect

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

## Required phase shape

1. Add a Wave 0.5 upstream-readiness and compatibility lock across Phases 200-205 before policy work branches out.
2. Define the canonical control registry, object inventory, and translation map for Phases 207-217 plus future placeholders for 218-220.
3. Lock AI governance, dangerous-mutation approval posture, unsupported-claim boundaries, and autonomy ceilings.
4. Define pricing, billing, SaaS financial, connector, and vendor/subprocessor control coverage without re-owning those product phases.
5. Define evidence automation, export safety, learning governance, and Tenant 0 public-proof boundary.
6. Define incident response, BCP, DR, and pen-test readiness for the actual v2 risk profile.
7. Package the results into an auditor-facing Type I readiness bundle with exceptions and remediation posture.

## Non-negotiables

- No compliance plan may claim implementation ownership of downstream product requirement families.
- No dangerous mutation path may be described as compliant if it bypasses approval evidence.
- No public enterprise or customer-proof language may be treated as safe without explicit evidence and approval posture.
- No future SaaS or growth module may be treated as already implemented simply because this phase defines a control placeholder for it.
- No parallel compliance data store should be introduced when existing audit, billing, approval, and evidence substrate can be extended instead.

## Done means

Phase 206 has an executable control-foundation plan set that produces named doctrine and evidence artifacts:

- `.planning/compliance/206-upstream-readiness.md`
- `.planning/compliance/control-registry.md`
- `.planning/compliance/phase-translation-map.md`
- `.planning/compliance/ai-governance-policy.md`
- `.planning/compliance/pricing-billing-controls.md`
- `.planning/compliance/saas-financial-controls.md`
- `.planning/compliance/connector-privacy-register.md`
- `.planning/compliance/evidence-automation-map.md`
- `.planning/compliance/public-claim-boundary.md`
- `.planning/compliance/incident-bcp-dr-policy.md`
- `.planning/compliance/type1-readiness-package.md`

At that point, later phases can inherit one real compliance doctrine instead of treating enterprise readiness as a vague promise.
