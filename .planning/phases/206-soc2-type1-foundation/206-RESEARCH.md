# Phase 206 Research - SOC 2 Type I Foundation

## Primary research question

What is the smallest executable SOC 2 Type I control foundation that can govern the real MarkOS v2 risk profile now, while giving Phases 207-217 clean control placeholders and future Growth phases 218-220 a clear doctrine to inherit later?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Ownership | Which requirements belong directly to Phase 206, and which should stay with downstream implementation phases? | Ownership boundary |
| Current substrate | Which audit, approval, webhook, billing, and evidence patterns already exist in code? | Reuse and gap map |
| Compatibility | Which current phases must already be ready, and which later phases only need translation gates instead of false ownership? | Upstream readiness and translation map |
| Registry | What control record shape should auditors and later phases share? | Control registry baseline |
| Governance | How should AI, approval, unsupported claims, and dangerous mutations be classified? | Governance doctrine |
| Financial controls | How should pricing, billing, and SaaS financial actions inherit approval and evidence posture? | Financial control mapping |
| Privacy and learning | How should connectors, evidence, learning, and public proof be governed? | Privacy and evidence doctrine |
| Readiness | What evidence, incident, BCP/DR, and auditor outputs prove design readiness? | Validation and Type I package |

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
- `.planning/REQUIREMENTS.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-CONTEXT.md`
- `.planning/phases/206-soc2-type1-foundation/206-REVIEWS.md`
- `.planning/phases/206-soc2-type1-foundation/DISCUSS.md`

## Ownership boundary

### Direct ownership

- `COMP-01`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phases 200-205 provide the actual current substrate this phase governs: contracts, tenancy, webhooks, MCP sessions, CLI diagnostics, pricing doctrine, and billing evidence

### Downstream translation gates, not primary ownership

- Phase 207 run and approval evidence posture
- Phase 208 human approval and task surfaces
- Phase 209 evidence freshness, claim safety, and source-quality posture
- Phase 210 connector privacy and recovery posture
- Phase 211 dispatch and measurement governance
- Phase 212 learning, anonymization, and literacy promotion posture
- Phase 213 Tenant 0 proof and public-claim boundary
- Phases 214-217 SaaS subscription, billing, support, health, and module governance
- Phases 218-220 future growth motions that should inherit control doctrine but are not active implementation truth yet

## Current-code support

### 1. Audit and tenant-safety substrate already exists

- Tenant isolation, RLS posture, membership, and lifecycle controls already exist from Phase 201.
- Audit staging, hash-chain behavior, and webhook or session audit patterns are already represented in code and migrations.
- That means Phase 206 should extend current audit substrate instead of inventing a second compliance store.

### 2. Approval and dangerous-mutation posture already has real building blocks

- MCP mutating tools already run through approval, timeout, cost, and audit middleware.
- CRM mutation patterns already require approval packages and outcome evidence.
- The compliance gap is not "whether approvals exist"; it is whether the approval doctrine is normalized across pricing, connectors, public claims, future SaaS actions, and later orchestration.

### 3. Billing and evidence packs already produce reusable traceability

- Billing reconciliation already preserves sync failure, restored snapshots, and invoice lineage.
- Governance evidence packs already gather privileged-action evidence from audit, identity, billing, approval logs, and provider sync.
- The gap is systematic control mapping and export-safe packaging, not a total lack of evidence substrate.

### 4. Research already names the right future risk profile

- The discussion and context correctly identify the v2 threat model: approval bypass, connector credential exposure, pricing manipulation, unsupported public claims, learning privacy leaks, billing/legal invoice errors, and future growth-action misuse.
- The problem is that this scope was not translated into executable GSD plans or a bounded ownership model.

## Gaps

- No Phase 206 plan uses the executable frontmatter schema required by current GSD flow.
- No `206-VALIDATION.md` exists.
- No Wave 0.5 preflight distinguishes current upstream readiness from downstream translation gates.
- No formal control registry binds requirement family, evidence source, cadence, owner, and test procedure into one auditor-facing map.
- No formal mutation-class doctrine covers approval, unsupported claims, autonomy ceilings, and future SaaS or growth actions.
- No explicit public-claim boundary separates internal planning language from externally supportable proof.

## Recommendation

Phase 206 should be replanned as a seven-wave executable phase:

1. Hard-gate upstream readiness from Phases 200-205 and lock the translation model for 207-217 plus future placeholders for 218-220.
2. Define the control registry and translation map before policy branches out.
3. Lock AI governance, dangerous-mutation classes, unsupported-claim controls, and autonomy ceilings.
4. Define pricing, billing, and SaaS financial control coverage without re-owning those product systems.
5. Define connector privacy, vendor posture, evidence automation, claim safety, learning governance, and Tenant 0 proof boundaries.
6. Define incident response, BCP, DR, and pen-test posture.
7. Package everything into an auditor workspace and Type I readiness bundle.

## Domain 0 - Upstream readiness and compatibility lock

Phase 206 depends in practice on the current substrate from Phases `200-205`, so Plan 01 should create a Wave 0.5 gate that checks:

- published contract and platform posture exists from Phases 200, 202, and 203
- tenancy, RLS, auth, and audit posture exists from Phase 201
- CLI diagnostics and support surfaces exist from Phase 204
- pricing placeholder doctrine and billing evidence posture exist from Phase 205

The same plan should distinguish three categories:

- `current substrate` for phases `200-205`
- `active translation gates` for phases `207-217`
- `future placeholders` for phases `218-220`

The architecture lock should reject unsafe shortcuts such as:

- `shadow compliance store`
- `implementation ownership equals compliance ownership`
- `future module treated as implemented`
- `enterprise claim without proof`
- `approval bypass exception`

## Domain 1 - Control registry and translation map

Recommended `ControlRegistryRow` fields:

- `control_id`
- `requirement_ref`
- `system_scope`
- `owner_role`
- `evidence_source`
- `cadence`
- `test_procedure`
- `applies_now`
- `translation_phase`
- `created_at`
- `updated_at`

Recommended `PhaseTranslationGate` fields:

- `phase`
- `surface_family`
- `control_placeholder`
- `required_before_execution`
- `evidence_expectation`
- `notes`

This is the key fix for the roadmap overclaiming problem: Phase 206 should map coverage expectations for later phases without absorbing their implementation ownership.

## Domain 2 - AI governance and dangerous-mutation controls

Recommended `MutationClassPolicy` fields:

- `mutation_class`
- `default_approval_mode`
- `required_roles`
- `evidence_required`
- `unsupported_claim_policy`
- `autonomy_ceiling`
- `applies_to_phases`
- `created_at`
- `updated_at`

Recommended `mutation_class` literals:

- `external.send`
- `billing.charge`
- `connector.mutate`
- `price.change`
- `public.claim`
- `data.export`

This doctrine should explicitly cover prompt or model changes, approval packages, unsupported claims, human overrides, and future earned autonomy posture.

## Domain 3 - Pricing, billing, and SaaS financial controls

Recommended exact control sections for the financial doctrine:

- `pricing_recommendation`
- `price_test`
- `public_pricing_copy`
- `subscription_lifecycle`
- `invoice_correction`
- `refund_credit_writeoff`

This is where Phase 206 should define how pricing and later SaaS financial mutations earn approval and evidence posture, while leaving product implementation to Phases 205 and 214-217.

## Domain 4 - Connector privacy and vendor or subprocessor controls

Recommended `ConnectorControlRow` fields:

- `surface_id`
- `credential_type`
- `scope_classification`
- `retention_policy`
- `revocation_path`
- `subprocessor_owner`
- `recovery_evidence`
- `created_at`
- `updated_at`

Connector doctrine should also classify direct adapters versus Nango-style delegation, retention boundaries, and dependent-agent pause or recovery evidence expectations.

## Domain 5 - Evidence automation, claim safety, learning governance, and Tenant 0 proof

Recommended `EvidenceAutomationRow` fields:

- `control_id`
- `evidence_source`
- `collection_mode`
- `tenant_safety_rule`
- `export_redaction`
- `missing_evidence_action`
- `created_at`
- `updated_at`

This domain should also define:

- unsupported-claim blocking for public proof
- source-quality and freshness expectations inherited by later evidence systems
- anonymization and sample-size posture for learning systems
- explicit separation between public proof, internal-only evidence, and never-exported material

## Domain 6 - Incident, BCP/DR, pen-test, and auditor package

Recommended `IncidentControlClass` literals:

- `agent_misfire`
- `connector_credential`
- `pricing_error`
- `billing_error`
- `public_claim_error`
- `data_export_error`

The auditor package should include:

- control matrix
- exception register
- evidence export index
- remediation posture
- policy ratification status

## Validation architecture

The phase needs a `206-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- control registry and translation-map baseline
- AI governance and approval enforcement
- pricing, billing, and SaaS financial control mapping
- connector privacy and vendor posture
- evidence automation, learning, and public-proof boundary
- incident response, BCP/DR, pen-test, and auditor package verification

## Risks and implications

- If Phase 206 keeps claiming downstream requirement families directly, later phases can look "covered" without actually inheriting executable control doctrine.
- If future SaaS and growth surfaces are treated as implemented instead of placeholder-governed, Type I readiness language can outrun real product posture.
- If public-proof boundaries remain implicit, Tenant 0 and enterprise-facing copy can drift into unsupported claims.

## Tests implied

- Control registry contract tests: every control has owner, system, evidence source, cadence, and test procedure.
- Translation-map tests: active gates for `207-217` and future placeholders for `218-220` are both present and differentiated.
- Approval governance tests: AI, pricing, connector, billing, public-claim, and data-export mutations cannot bypass approval controls.
- Evidence export tests: a Type I package can be generated without cross-tenant leakage or secret exposure.
- Public-proof boundary tests: unsupported enterprise or customer-proof language is blocked or marked as internal-only.

## Phase-plan impact

The seven-plan split remains correct, but it should be executed with a Wave 0.5 compatibility lock at the front and with direct ownership narrowed to compliance doctrine rather than downstream implementation families.
