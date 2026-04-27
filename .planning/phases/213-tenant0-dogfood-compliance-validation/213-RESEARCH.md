# Phase 213 Research - Tenant 0 Dogfood and Compliance Validation

## Primary research question

How should MarkOS prove it can run MarkOS on itself with real evidence, preserve upstream ownership, and emit a trustworthy go/no-go gate for Phases 214-217?

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
- `.planning/phases/213-tenant0-dogfood-compliance-validation/213-REVIEWS.md`

## Ownership boundary

Direct ownership in Phase 213:

- `T0-01..05`
- `QA-01..15`

Consumed as upstream inputs, not re-owned:

- `PRC-01..09`, `BILL-02` from Phase 205
- `COMP-01` from Phase 206
- `RUN-01..08` from Phase 207
- `TASK-01..05` from Phase 208
- `EVD-01..06` from Phase 209
- `CONN-01..06` from Phase 210
- `LOOP-01..08` from Phase 211
- `LRN-01..05` from Phase 212

This is the key planning correction. Phase 213 is the integration and closeout gate for Tenant 0 proof, not a second owner of Pricing Engine, compliance, evidence, connector, loop, or learning substrate.

## Current-code support

### Tenant and brand input already have a capture path

- `onboarding/onboarding-seed.schema.json` requires `company.business_model` and already exposes brand-oriented fields such as `brand_values`, `tone_of_voice`, and `brand_input.brand_profile`.
- `onboarding/onboarding.js` persists `seed.company.business_model` and the onboarding-derived brand inputs.

This is enough to define a governed Tenant 0 workspace profile without inventing a new intake path.

### Pricing placeholder posture already exists and is phase-aware

- `bin/lib/cli/doctor-checks.cjs` already ships `pricing_placeholder_policy` and explicitly tolerates the sentinel through Phase 213.
- `lib/markos/cli/runs.cjs` already writes `pricing_engine_context.placeholder = '{{MARKOS_PRICING_ENGINE_PENDING}}'` into run payloads until Pricing Engine output is approved.

Phase 213 should consume this policy and decide release readiness; it should not redefine the placeholder doctrine.

### Evidence, reporting, and cost telemetry substrate already exists

- `lib/markos/governance/evidence-pack.ts` already exports `buildGovernanceEvidencePack` and evidence-source vocabulary that covers identity, approvals, billing, and tenant-configuration evidence.
- `lib/markos/crm/reporting.ts` already exports readiness and executive-summary builders such as `buildReadinessReport` and `buildExecutiveSummary`.
- `lib/markos/billing/usage-normalizer.ts` already exports `normalizePluginUsageEvent` and `normalizeAgentRunUsageEvent`, which is enough to attach cost evidence to Tenant 0 loop runs.

### Public surfaces already exist and can be audited

- `app/(marketing)/integrations/claude/page.tsx` already includes claim-audit-oriented copy such as `audit_claim`.
- `app/(marketing)/docs/[[...slug]]/page.tsx` is the general public docs surface.
- `app/docs/llms-full.txt/route.ts` is an existing machine-readable public surface.

Phase 213 can audit these real surfaces instead of inventing fake proof destinations.

## Gaps

- No executable Wave 0.5 upstream preflight exists across Phases 205-212.
- No `213-VALIDATION.md` existed before this replan.
- No canonical Tenant 0 workspace profile, connector inventory, or public/private data policy exists.
- No single first-loop proof path is pinned.
- No public proof or case-study register links claims to evidence, approval, and freshness.
- No final requirement-to-implementation matrix and unresolved-gap register exists for the v4.0.0 closeout.
- No explicit 214-217 go/no-go artifact exists.

## Recommendation

Phase 213 should stay narrow and hard-gated:

- Plan 01 should own Wave 0.5 preflight, architecture lock, Tenant 0 workspace definition, connector inventory, and data policy.
- Plan 02 should run one real MarkOS-on-MarkOS loop on an already shipped capability, with evidence, approval, dispatch, measurement, and learning artifacts.
- Plan 03 should consume Phase 205 Tenant 0 pricing outputs and classify every public pricing surface as `placeholder_only`, `release_ready`, or `blocked`.
- Plan 04 should define the public proof, case-study, and compliance-language boundary.
- Plan 05 should create the final requirement matrix, unresolved-gap register, and explicit go/no-go decision for Phases 214-217.

## Domain 0 - Upstream readiness and architecture lock

### Hard upstream posture

Phase 213 should fail closed if these inputs are missing:

- Phase 205: Tenant 0 pricing dogfood outputs and placeholder doctrine
- Phase 206: compliance language and evidence posture
- Phase 207: AgentRun v2 fields and run/effect traces
- Phase 208: task and approval surfaces used by the real loop
- Phase 209: evidence-pack and traceability outputs
- Phase 210: at least one healthy connector or a named degraded-state recovery blocker
- Phase 211: loop artifact chain
- Phase 212: learning handoff and literacy candidate posture

### Wave 0.5 artifacts

Recommended Plan 01 artifacts:

- `.planning/phases/213-tenant0-dogfood-compliance-validation/213-VALIDATION.md`
- `.planning/tenant-zero/213-upstream-readiness.md`
- `scripts/tenant-zero/check-upstream-readiness.mjs`
- `scripts/tenant-zero/check-architecture-lock.mjs`
- `scripts/tenant-zero/assert-tenant-workspace-ready.mjs`
- `test/tenant-zero/phase-213/preflight/*`

### Architecture lock

The architecture lock should assert:

- required posture exists: `{{MARKOS_PRICING_ENGINE_PENDING}}`, `buildGovernanceEvidencePack`, `buildReadinessReport`, `normalizeAgentRunUsageEvent`, and the Phase 205 Tenant 0 pricing dogfood artifacts
- forbidden Phase 213 validation surfaces do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`
- fake-proof phrases do not appear in Tenant 0 artifacts: `synthetic proof`, `fake case study`, `mock customer logo`

## Domain 1 - Tenant 0 workspace and governed input pack

Required Tenant 0 artifacts:

- `.planning/tenant-zero/workspace-profile.json`
- `.planning/tenant-zero/connector-inventory.json`
- `.planning/tenant-zero/data-source-policy.md`
- `.planning/tenant-zero/public-proof-allowlist.md`

Recommended workspace profile fields:

- `org_slug: "markos-internal"`
- `tenant_slug: "tenant-zero"`
- `business_model: "saas"`
- `roles: ["owner", "approver", "operator"]`
- `pricing_mode: "approved_recommendation_or_MARKOS_PRICING_ENGINE_PENDING"`
- `connector_policy: "publish_if_healthy_else_ready_to_publish"`

Recommended connector inventory fields per row:

- `connector_slug`
- `status` in `healthy | degraded | unavailable`
- `required_for_loop`
- `fallback_action`
- `last_verified_at`

The data-source policy should classify every input as one of:

- `public_evidence`
- `private_internal`
- `never_exported`

## Domain 2 - First real operating loop

Recommended first loop: one public-proof asset about an already shipped capability. Good candidates are:

- Pricing placeholder governance
- MCP auth and operator-control posture
- Tenant safety and evidence-backed marketing workflow

The loop must produce a deterministic artifact chain:

- `.planning/tenant-zero/loop-01-brief.md`
- `.planning/tenant-zero/loop-01-claim-map.json`
- `.planning/tenant-zero/loop-01-approval-log.md`
- `.planning/tenant-zero/loop-01-dispatch-log.json`
- `.planning/tenant-zero/loop-01-outcome.md`
- `.planning/tenant-zero/loop-01-learning-handoff.json`

Required statuses:

- `approval_status: approved`
- `claim_status: evidence_backed`
- `dispatch_status: published | ready_to_publish`
- `measurement_window_days: 7`
- `learning_handoff_status: recorded`

If live connector health is not good enough to publish, the loop remains valid only if it ends in `ready_to_publish` with a named recovery blocker. It may not fabricate publication.

## Domain 3 - Pricing Engine posture and public pricing gate

Phase 213 should consume Phase 205 Plan 205-08 outputs and classify each public pricing-sensitive surface as:

- `placeholder_only`
- `release_ready`
- `blocked`

`release_ready` requires all of the following:

- approved PricingRecommendation ID
- approval linkage
- evidence freshness
- Phase 206 compliance posture green enough for the intended claim
- Phase 213 closeout gate green for that surface

Otherwise the exact sentinel stays in place.

Recommended audit scope:

- `docs/pricing/public-tier-placeholder.md`
- `public/llms.txt`
- `app/(marketing)/docs/[[...slug]]/page.tsx`
- `app/(marketing)/integrations/claude/page.tsx`
- `app/docs/llms-full.txt/route.ts`

Recommended artifacts:

- `.planning/tenant-zero/pricing/public-pricing-audit.md`
- `.planning/tenant-zero/pricing/public-pricing-release-gate.json`
- `.planning/tenant-zero/pricing/recommendation-linkage.md`

## Domain 4 - Public proof, case-study, and compliance language boundary

Phase 213 needs a strict public-claim vocabulary:

- `implemented_verified`
- `roadmap_only`
- `internal_only`

Every public-proof or case-study row should include:

- `claim_id`
- `surface`
- `evidence_ref`
- `approval_ref`
- `fresh_until`
- `privacy_class`
- `status`

Compliance wording should distinguish at least:

- `designed_control`
- `type1_in_preparation`
- `type1_verified`
- `type2_future`

Recommended artifacts:

- `.planning/tenant-zero/public-proof-policy.md`
- `.planning/tenant-zero/case-study-readiness-checklist.md`
- `.planning/tenant-zero/compliance-language-boundary.md`
- `.planning/tenant-zero/public-claim-audit-summary.md`

## Domain 5 - Final requirement matrix and 214-217 go/no-go

Recommended closeout artifacts:

- `.planning/tenant-zero/requirement-implementation-matrix.md`
- `.planning/tenant-zero/unresolved-gap-register.md`
- `.planning/tenant-zero/214-217-go-no-go.md`
- `.planning/tenant-zero/final-readiness-summary.md`

Recommended requirement-matrix columns:

- `family`
- `owner_phase`
- `implementation_surface`
- `test_surface`
- `evidence_surface`
- `status`
- `blocker`

Recommended go/no-go output:

- one section each for Phases 214, 215, 216, 217
- status in `green | yellow | red`
- shared `hard_blockers` section
- explicit note that doc 17 remains future-routing context and does not become runnable scope here

## Validation Architecture

### Test runner

Use Node `--test`, matching the newer executable planning docs and the internal-validation nature of this phase.

### Per-domain verification shape

- `test/tenant-zero/phase-213/preflight/` - upstream readiness, architecture lock, workspace-profile integrity, public/private data policy
- `test/tenant-zero/phase-213/domain-2/` - first loop artifact chain and learning handoff
- `test/tenant-zero/phase-213/domain-3/` - pricing placeholder regression and recommendation linkage
- `test/tenant-zero/phase-213/domain-4/` - public claim audit and compliance-language boundary
- `test/tenant-zero/phase-213/domain-5/` - requirement matrix completeness and go/no-go determinism

## Risks

- The phase can create false confidence if it silently absorbs upstream gaps instead of failing closed.
- The first loop can look real while still being too synthetic if the evidence map, approval, or connector state is weak.
- Public pricing release is especially risky because Phase 205 intentionally deferred unresolution.
- A vague go/no-go artifact would defeat the point of the phase even if the matrix is otherwise thorough.

## Phase implications

- Phases 214-217 should treat Phase 213 as the entry gate for execution readiness, not just another planning input.
- Phase 214 should not bypass any yellow or red blocker raised by the 213 go/no-go artifact.
- Phase 218 and later doc 17 routing remain future work only; no growth-mode claim becomes runnable here.

## Acceptance tests implied

- Upstream preflight fails when required Phase 205-212 closeout inputs are missing.
- Tenant 0 workspace artifacts define roles, connector state, and public/private data posture.
- The first loop produces a full artifact chain from brief through learning handoff.
- Public pricing surfaces are either sentinel-protected or explicitly marked `release_ready` with linked approval and evidence.
- Public claim audit fails on unsupported, stale, or privacy-unsafe claims.
- Final requirement matrix maps every active family to implementation, tests, evidence, and blocker status.
- A named 214-217 go/no-go artifact exists and does not blur doc 17 future scope into active readiness.
