# Phase 209 Research - Evidence, Research, and Claim Safety

## Primary research question

What central evidence model lets MarkOS safely create, review, approve, and dispatch claims across content, pricing, social, sales, PR, support, SaaS, and future growth motions?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current tools | What do current claim-audit and evidence surfaces already support? | Capability map |
| Ownership | Which requirements belong to Phase 209 directly, and which must stay upstream or downstream? | Ownership boundary |
| EvidenceMap | What fields are required for claims, sources, quality, confidence, TTL, freshness, known gaps, and inference labels? | Contract proposal |
| Source quality | How should sources be scored and tiered across first-party, official, analyst, public web, and social/community evidence? | Source-quality rubric |
| Freshness | What TTL defaults and stale/contradictory behaviors apply by claim family? | Freshness policy |
| Approval UI | How should evidence and unsupported-claim blockers appear to humans? | Approval evidence policy |
| Reuse | How do agents find and reuse fresh research context instead of duplicating cost? | Reuse contract |
| Pricing | How does competitor and pricing evidence flow into PricingRecommendation records? | Pricing evidence bridge |
| Future growth | What evidence posture must later PR, reviews, events, ABM, referral, partnership, and developer-marketing phases consume? | Future claim matrix |

## Files inspected

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/audit-claim-strict.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/crm/reporting.ts`
- `lib/markos/crm/attribution.ts`
- `app/(markos)/operations/tasks/evidence-panel.tsx`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-RESEARCH.md`
- `.planning/phases/208-human-operating-interface/208-RESEARCH.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md`
- `.planning/phases/209-evidence-research-and-claim-safety/209-REVIEWS.md`

## Ownership boundary

### Direct ownership

- `EVD-01..06`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phase 205 pricing and competitor-evidence consumers
- Phase 206 governance, public-claim, and compliance posture
- Phase 207 AgentRun lineage for evidence creation and reuse decisions
- Phase 208 approval inbox and follow-up task surfaces

## Current-code support

### 1. Claim-audit tools already exist

- `audit_claim` returns tenant-scoped `supported`, `confidence`, and `evidence`.
- `audit_claim_strict` fails closed more aggressively and requires at least one evidence row in its response shape.
- `expand_claim_evidence` returns `canon_evidence` plus `strengthening_variants`.
- This is strong substrate for future EvidenceMap usage, but not yet a central evidence object.

### 2. Evidence aggregation exists, but not as a claim substrate

- `buildGovernanceEvidencePack` already aggregates privileged-action evidence families across identity, approvals, billing, and tenant configuration.
- This means governance already understands "evidence pack" behavior, but the product still lacks claim-level EvidenceMap records.

### 3. Reporting and attribution already carry readiness posture

- `buildReadinessReport` and the reporting rollups already expose freshness, readiness reasons, and evidence-linked reporting posture.
- `crm/attribution.ts` already carries evidence references and degraded readiness reasoning.
- This is useful substrate for claim freshness and known-gap handling.

### 4. Approval-adjacent evidence UI already exists

- `app/(markos)/operations/tasks/evidence-panel.tsx` already renders immutable inputs, outputs, logs, timestamps, actor ID, retries, and latest errors.
- That is a good base pattern for evidence exposure, even though Phase 208 still owns the approval surface.

## Gaps

- No central `EvidenceMap` object exists across content, pricing, social, sales, PR, support, SaaS, and public proof.
- No canonical source-quality score, source class, provenance, freshness TTL, known-gap record, or inference label exists.
- No claim TTL policy differentiates volatile pricing/legal/competitor claims from evergreen guidance.
- No approval blocker connects unsupported claims to the Approval Inbox as a first-class decision contract.
- No research-context cache or reuse contract exists for agents.
- No explicit pricing-evidence bridge exists between competitor intelligence and PricingRecommendation support.
- No validation contract exists for the phase, even though the business truths are already specified in the matrix.

## Recommendation

Phase 209 should be replanned as a six-wave executable phase with a Wave 0.5 preflight at the front:

1. Hard-gate pricing, compliance, run-lineage, and approval-surface readiness.
2. Define EvidenceMap and core evidence contracts before policy work branches out.
3. Normalize source quality and research tiers with a direct bridge into pricing evidence.
4. Make freshness, contradictory evidence, and known gaps explicit rather than implied.
5. Push approval blocking into clear evidence snapshots and override lineage.
6. Lock reuse, citation, inference, and hallucination defense behavior with automated suites and future-consumer matrices.

## Domain 0 - Upstream readiness and architecture lock

Phase 209 depends on Phases 205-208 in practice, so Plan 01 should create a Wave 0.5 gate that checks:

- pricing evidence consumers and recommendation posture exist from Phase 205
- governance and public-claim posture exist from Phase 206
- AgentRun lineage exists for evidence creation and reuse tracking from Phase 207
- approval and follow-up task surfaces exist from Phase 208

The architecture lock should reject unsafe shortcuts such as:

- `approve unsupported claim`
- `freshness ignored`
- `price claim without timestamp`
- `silent inference`

## Domain 1 - EvidenceMap contract foundation

Recommended `EvidenceMap` fields:

- `evidence_id`
- `tenant_id`
- `claim_text`
- `claim_type`
- `source_class`
- `source_url`
- `source_title`
- `source_captured_at`
- `source_published_at`
- `extraction_method`
- `confidence`
- `source_quality_score`
- `freshness_ttl_hours`
- `expires_at`
- `supported`
- `known_gaps`
- `inference_label`
- `created_by_run_id`
- `approval_id`
- `related_object_type`
- `related_object_id`
- `redaction_policy`
- `created_at`
- `updated_at`

Recommended `inference_label` literals:

- `none`
- `inferred`
- `unsupported`

Recommended `claim_type` starter set:

- `marketing_copy`
- `pricing`
- `competitive`
- `public_proof`
- `sales_enablement`
- `support_guidance`
- `saas_metric`

## Domain 2 - Source quality, research tiers, and pricing-evidence bridge

Recommended normalized source-quality rubric:

- `1.00` first-party system of record or approved operator-provided source
- `0.85` official vendor, product, or government source
- `0.65` reputable analyst, news, or marketplace profile with identifiable date
- `0.40` public web source with weak freshness or provenance
- `0.20` social, community, or operator note needing corroboration
- `0.00` unsupported, synthetic, expired, or contradicted

Recommended `research_tier` literals:

- `tier_1_strict`
- `tier_2_standard`
- `tier_3_exploratory`
- `tier_4_operator_note`

The pricing-evidence bridge should explicitly cover:

- `competitor_pricing`
- `pricing_recommendation_support`
- `public_pricing_copy`

## Domain 3 - Freshness, TTL, contradictory evidence, and known gaps

Recommended `freshness_status` literals:

- `fresh`
- `stale`
- `expired`
- `contradictory`
- `gap_known`

Recommended TTL defaults:

- `24-168h` for pricing, competitor, legal, payment, security, and compliance claims
- `7-30d` for product, integration, package, availability, and SaaS metrics
- `90-365d` for brand, positioning, evergreen literacy, and internal process

Recommended `KnownGapRecord` fields:

- `known_gap_id`
- `tenant_id`
- `claim_type`
- `gap_reason`
- `gap_status`
- `required_refresh_by`
- `related_evidence_ids`
- `created_at`
- `updated_at`

## Domain 4 - Approval evidence exposure and claim blocking

Recommended `ApprovalEvidenceSnapshot` fields:

- `snapshot_id`
- `approval_id`
- `evidence_refs`
- `source_quality_summary`
- `ttl_summary`
- `assumption_list`
- `unsupported_claims`
- `inference_labels`
- `override_reason`
- `actor_id`
- `created_at`

Default blocked action families should include:

- `publish`
- `send`
- `social`
- `pricing`
- `support`

Unsupported claims should block by default, with override lineage recorded explicitly.

## Domain 5 - Research context reuse and AgentRun linkage

Recommended `ResearchContextRecord` fields:

- `research_context_id`
- `tenant_id`
- `topic_key`
- `claim_type`
- `source_classes`
- `evidence_refs`
- `freshness_status`
- `reuse_decision`
- `reuse_reason`
- `insufficiency_reason`
- `created_by_run_id`
- `reused_by_run_ids`
- `expires_at`
- `updated_at`

Recommended `reuse_decision` literals:

- `reuse`
- `refresh`
- `insufficient`

## Domain 6 - Citation, inference labeling, hallucination defense, and future claim consumers

Recommended deterministic claim-fixture classes:

- `supported_claim`
- `unsupported_claim`
- `stale_claim`
- `contradictory_claim`
- `pricing_claim`
- `public_proof_claim`
- `inferred_claim`

Future claim-evidence consumers that should be mapped explicitly:

- `tenant0_public_proof`
- `pr`
- `reviews`
- `events`
- `abm`
- `referral`
- `partnerships`
- `developer_marketing`

Every row should be marked `future_consumer`, not treated as current execution scope.

## Validation architecture

The phase needs a `209-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- EvidenceMap contracts and field invariants
- source-quality and research-tier policy
- TTL, freshness, contradictory evidence, and known-gap behavior
- approval evidence snapshots and unsupported-claim blocking
- research-context reuse and AgentRun linkage
- citation, inference, hallucination defense, and future claim-evidence consumers

## Risks

- If Phase 209 re-owns pricing, loop, or approval-interface requirements, later phases can hide upstream incompleteness behind "evidence readiness."
- If freshness and known gaps are vague, stale or contradictory claims can still look legitimate.
- If approval blocking is not explicit, humans can still approve unsupported claims without understanding the evidence posture.
- If pricing evidence is not bridged cleanly, the pricing engine can look sourced without actually consuming shared evidence rules.

## Phase implications

- Phase 210 should use EvidenceMap posture for connector-backed wow and recovery outputs.
- Phase 211 should consume EvidenceMap and freshness posture rather than reinventing claim blocking.
- Phase 213 should rely on this phase for sourced Tenant 0 proof.
- Phases 219 and 220 should consume the future claim matrix rather than reopening evidence doctrine.

## Acceptance tests implied

- EvidenceMap contract tests for supported, unsupported, inferred, expired, contradicted, and redacted evidence
- source-quality scoring and research-tier threshold tests
- TTL and known-gap tests for fresh, stale, expired, contradictory, and refresh-trigger cases
- approval blocking tests for publish, send, social, pricing, and support actions
- pricing evidence bridge tests for competitor and public-pricing support
- research reuse tests for reuse, refresh, and insufficient-context decisions
- hallucination-defense fixture tests that fail on unsupported claims treated as supported
