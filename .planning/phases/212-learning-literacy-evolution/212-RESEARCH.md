# Phase 212 Research - Learning and Literacy Evolution

## Primary research question

How should MarkOS convert loop outcomes into governed learning objects that stay tenant-safe, evidence-aware, admin-reviewed, and action-producing instead of turning into silent prompt drift?

## Canonical inputs

- `obsidian/work/incoming/08-SELF-EVOLVING-ARCHITECTURE.md`
- `obsidian/work/incoming/06-RESEARCH-ENGINE.md`
- `obsidian/brain/Marketing Operating System Foundation.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/literacy/README.md`
- `obsidian/literacy/Marketing Literacy/README.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/phases/212-learning-literacy-evolution/212-REVIEWS.md`

## Ownership boundary

Direct ownership in Phase 212:

- `LRN-01..05`
- `QA-01..15`

Consumed as upstream inputs, not re-owned:

- `RUN-01..08` from Phase 207
- `TASK-01..05` from Phase 208
- `EVD-01..06` from Phase 209
- `LOOP-01..08` from Phase 211
- `COMP-01` from Phase 206

## Current-code support

### Tenant-scoped literacy lookup and taxonomy already exist

- `lib/markos/mcp/tools/literacy/query-canon.cjs` already performs tenant-scoped canon lookup using `session.tenant_id`.
- `lib/markos/mcp/tools/literacy/explain-literacy.cjs` already resolves literacy nodes or archetypes without inventing a second canon access path.
- `lib/markos/mcp/tools/literacy/walk-taxonomy.cjs` already traverses tenant literacy taxonomy neighbors.

This gives Phase 212 a real downstream target for central-literacy promotion and tenant overlay application.

### Literacy readiness and activation evidence already have governed primitives

- `onboarding/backend/literacy/activation-readiness.cjs` already distinguishes `ready`, `partial`, `unconfigured`, and `blocked` states and exposes `required_disciplines`, `disciplines_available`, and `gaps`.
- `onboarding/backend/literacy/discipline-selection.cjs` already records `selected_disciplines` and `unselected_disciplines` through evidence-bearing discipline activation logic.

These are strong seeds for review cadence, gap handling, and literacy-eligibility posture.

### MIR lineage already provides append-only provenance patterns

- `onboarding/backend/mir-lineage.cjs` already enforces append-only lineage posture, tenant scoping, and mandatory rationale for discipline activation and critical regeneration.

Phase 212 should reuse this provenance posture for overlays and promotion decisions rather than inventing mutable, untraceable learning edits.

### Outcome and attribution signals already exist

- `lib/markos/crm/reporting.ts` already computes readiness status and executive summaries from evidence-backed CRM signals.
- `lib/markos/crm/attribution.ts` already builds weighted attribution evidence and degraded-readiness reasons when identity stitching or touch-family coverage is weak.
- Phase 211 already defines a measurement handoff to learning in `211-06-PLAN.md`.

This means performance logs can link to existing readiness and attribution substrate instead of starting from empty outcome semantics.

### Literacy operations already have namespace and RLS doctrine

- `.planning/codebase/LITERACY-OPERATIONS.md` already documents literacy setup, namespace isolation, and RLS verification posture.

That gives Phase 212 a concrete place to anchor privacy-safe aggregation assumptions.

## Gaps

- No durable `ArtifactPerformanceLog` exists for expected vs actual outcomes.
- No `TenantOverlay` exists for tenant-specific learning with expiry, suppression, and review.
- No `LiteracyUpdateCandidate` queue exists for admin-reviewed central promotion.
- No anonymization, aggregation, sample-size, consent, or redaction rule exists for cross-tenant learning.
- No `LearningRecommendation` handoff exists to create governed future tasks or strategy refresh work.
- No per-phase validation contract existed before this replan.

## Recommendation

Phase 212 should ship the learning substrate in five layers:

- Plan 01: upstream preflight plus `ArtifactPerformanceLog`
- Plan 02: `TenantOverlay` and local overlay review/expiry posture
- Plan 03: `LiteracyUpdateCandidate` and admin review workflow
- Plan 04: anonymization, aggregation, and privacy thresholds
- Plan 05: `LearningRecommendation` task/strategy handoff plus future-growth compatibility map

## Domain 0 - Upstream readiness and architecture lock

### Hard upstream posture

Phase 212 should fail closed if these inputs are missing:

- Phase 206 compliance/privacy posture for learning promotion
- Phase 207 AgentRun context needed to link outcome logs
- Phase 208 task substrate for recommendation handoff
- Phase 209 EvidenceMap and source-quality posture
- Phase 211 measurement handoff outputs

### Wave 0.5 artifacts

Recommended Plan 01 artifacts:

- `.planning/phases/212-learning-literacy-evolution/212-VALIDATION.md`
- `.planning/literacy/212-upstream-readiness.md`
- `scripts/literacy/check-learning-upstream-readiness.mjs`
- `scripts/literacy/check-learning-architecture-lock.mjs`
- `scripts/literacy/assert-artifact-performance-baseline.mjs`
- `test/literacy/phase-212/preflight/*`

### Architecture lock

The architecture lock should assert:

- required posture exists: `buildWeightedAttributionModel`, `buildReadinessReport`, `evaluateLiteracyReadiness`, `recordDisciplineActivationEvidence`, and the Phase 211 measurement-handoff outputs
- forbidden Phase 212 shortcuts do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `promote raw tenant copy`, `auto-promote literacy`, `silent prompt drift`

## Domain 1 - ArtifactPerformanceLog and outcome envelope

Recommended object fields:

- `performance_log_id`
- `tenant_id`
- `artifact_id`
- `artifact_type`
- `channel`
- `audience_segment`
- `funnel_stage`
- `expected_outcome`
- `actual_outcome`
- `measurement_window_days`
- `measurement_status`
- `attribution_status`
- `evidence_refs`
- `agent_run_id`
- `dispatch_attempt_id`
- `lesson_summary`
- `confidence_score`
- `next_task_needed`
- `created_at`
- `updated_at`

Recommended enums:

- `measurement_status` in `expected_only | measured | degraded | missing_attribution`
- `attribution_status` in `ready | degraded | unavailable`

This satisfies:

- `LRN-01`: expected performance envelope exists before outcomes arrive
- `LRN-02`: actual outcomes, attribution evidence, lessons, and next tasks are durable

## Domain 2 - TenantOverlay local learning

Recommended object fields:

- `overlay_id`
- `tenant_id`
- `discipline`
- `lesson_type`
- `overlay_payload`
- `confidence_score`
- `evidence_refs`
- `provenance_ref`
- `review_status`
- `suppression_reason`
- `expires_at`
- `review_by`
- `created_at`
- `updated_at`

Recommended states:

- `review_status` in `proposed | active | expiring | suppressed | rejected`

Recommended rules:

- overlays are tenant-scoped and RLS-protected
- overlays require provenance and evidence refs
- expired overlays must move to `expiring` or `suppressed`, never silently remain active

## Domain 3 - LiteracyUpdateCandidate and admin review

Recommended candidate fields:

- `candidate_id`
- `source_overlay_refs`
- `anonymized_pattern`
- `sample_size`
- `supporting_artifact_count`
- `evidence_summary`
- `average_confidence_score`
- `reviewer_id`
- `decision`
- `promoted_target`
- `created_at`
- `updated_at`

Recommended review states:

- `proposed`
- `needs_evidence`
- `approved`
- `rejected`
- `promoted`

Recommended promotion rule:

- no candidate may promote from a single tenant's raw outcome directly into central literacy

## Domain 4 - Cross-tenant anonymization and privacy thresholds

Recommended denylist for central promotion:

- tenant identifiers
- person names
- customer names
- contact details
- raw pricing
- support transcripts
- campaign copy that still reveals tenant identity
- proprietary operator notes

Recommended gating thresholds:

- `sample_size >= 3`
- `supporting_artifact_count >= 5`
- `average_confidence_score >= 0.70`
- every supporting evidence row must meet source-quality posture inherited from Phase 209

Recommended failure posture:

- below-threshold candidates stay local as tenant overlays
- privacy-unsafe payloads are rejected before admin review

## Domain 5 - LearningRecommendation and future-growth compatibility

Recommended recommendation fields:

- `recommendation_id`
- `tenant_id`
- `source_type`
- `source_ref`
- `recommendation_kind`
- `priority`
- `owner_role`
- `status`
- `expires_at`
- `evidence_refs`
- `task_id`
- `suppression_reason`

Recommended recommendation kinds:

- `task_create`
- `strategy_refresh`
- `research_refresh`
- `pricing_review`
- `connector_fix`
- `experiment_candidate`

Recommended rule:

- recommendations may create or route governed work, but they may not directly mutate customer-facing systems

Recommended doc 17 compatibility artifact:

- a future-learning map for `plg`, `abm`, `community`, `events`, `pr`, `partnerships`, and `developer_marketing`
- every row marked `future_only` until later translated phases consume it

## Validation Architecture

### Test runner

Use Node `--test`, matching the existing internal test posture and keeping the phase lock against `vitest` and `playwright`.

### Per-domain verification shape

- `test/literacy/phase-212/preflight/` - upstream readiness, architecture lock, artifact-performance baseline
- `test/literacy/phase-212/domain-1/` - performance envelope and outcome logging
- `test/literacy/phase-212/domain-2/` - overlay RLS, expiry, suppression, and review
- `test/literacy/phase-212/domain-3/` - candidate queue and admin review transitions
- `test/literacy/phase-212/domain-4/` - anonymization transforms, threshold gates, privacy denials
- `test/literacy/phase-212/domain-5/` - recommendation handoff and future-growth compatibility

## Risks

- Learning can look impressive while still being unsafe if evidence quality and privacy thresholds are not enforced together.
- Local overlays can silently drift into doctrine if expiry and review are weak.
- Central promotion can become a backdoor to leak tenant-specific tactics if anonymization is vague.
- Recommendations can become silent autopilot if task creation and approval posture are not explicit.

## Phase implications

- Phase 213 should consume Phase 212 outputs as part of its closeout proof and readiness gate.
- Later growth-mode phases should read future-learning compatibility rows, not assume those experiments are already enabled.
- Phase 225 analytics/narrative work should treat the Phase 212 learning objects as governed inputs, not raw inferred truth.

## Acceptance tests implied

- Performance logs record both expected and actual outcomes with degraded measurement states.
- Tenant overlays are tenant-scoped, confidence-bearing, and expiry-aware.
- Central promotion is blocked below sample-size, evidence-quality, or anonymization thresholds.
- Admin review transitions are explicit and auditable.
- Learning recommendations create governed tasks or strategy work rather than silent prompt drift.
