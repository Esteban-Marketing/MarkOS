# Phase 212 Research - Learning and Literacy Evolution

## Primary research question

How should MarkOS turn artifact outcomes into tenant-specific improvement and centrally reviewed literacy evolution without leaking tenant data?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current literacy | What literacy MCP/PageIndex capabilities already exist? | Capability map |
| Performance log | What fields are required for expected outcome, actual outcome, attribution, evidence, and lessons? | ArtifactPerformanceLog contract |
| Tenant overlay | How should local learnings store confidence, expiry, review, and provenance? | TenantOverlay model |
| Central promotion | What qualifies a learning for LiteracyUpdateCandidate review? | Promotion policy |
| Privacy | How should tenant data be anonymized, aggregated, and sample-size gated? | Privacy control model |
| Admin review | Which UI/workflow supports review, rejection, and promotion? | Admin review path |
| Recommendations | How do learnings create new tasks or strategy suggestions? | Recommendation loop |
| Future growth | How do PLG, ABM, referral, community, event, PR, partnership, and developer-marketing experiments feed learning? | Growth learning map |

## Sources to inspect

- Literacy MCP tools and Obsidian/PageIndex files.
- Existing reporting, attribution, audit, tenant, and CRM code.
- Phase 211 output contracts.
- Incoming Self-Evolving Architecture and Research Engine docs.
- SaaS Marketing OS Strategy Canon for experimentation and growth learning needs.

## Required research output

- Current-code support.
- Data model proposal.
- Privacy/anonymization controls.
- Admin review workflow.
- Acceptance tests and governance checks.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `lib/markos/mcp/tools/literacy/query-canon.cjs`
- `lib/markos/mcp/tools/literacy/explain-literacy.cjs`
- `lib/markos/mcp/tools/literacy/walk-taxonomy.cjs`
- `onboarding/backend/literacy/activation-readiness.cjs`
- `onboarding/backend/literacy/discipline-selection.cjs`
- `onboarding/backend/mir-lineage.cjs`
- `.planning/codebase/LITERACY-OPERATIONS.md`
- `lib/markos/crm/reporting.ts`
- `lib/markos/crm/attribution.ts`

### Existing support

- Literacy MCP tools can query canon, explain literacy, list pain points, explain archetypes, and walk taxonomy.
- Literacy readiness can detect ready, partial, unconfigured, and blocked states.
- Discipline selection records activation evidence with MIR inputs and service-context rationale.
- PageIndex and literacy runbooks already document ingestion, coverage, readiness telemetry, and namespace isolation.
- CRM reporting and attribution provide outcome and readiness signals that can feed learning later.

### Gaps

- No `ArtifactPerformanceLog` records expected versus actual outcomes for a content/campaign artifact.
- No `TenantOverlay` stores tenant-specific lessons with confidence, expiry, evidence, and review state.
- No `LiteracyUpdateCandidate` queue supports central promotion review.
- No anonymization, aggregation, sample-size, or tenant-consent rule exists for cross-tenant learning.
- No admin review UI exists for accepting, rejecting, or revising central literacy updates.
- No recommendation loop creates future tasks from learned patterns.

### Proposed data model

- `ArtifactPerformanceLog`: artifact id, expected outcome, actual outcome, metric window, attribution status, evidence refs, lesson summary, confidence.
- `TenantOverlay`: tenant id, discipline, rule/lesson, confidence, expiry, provenance, evidence refs, review status, suppression reason.
- `LiteracyUpdateCandidate`: source overlay ids, anonymized pattern, sample size, evidence summary, reviewer decision, promoted canon target.
- `LearningRecommendation`: recommended action, source lesson, priority, owner, task id, expiry.

### Privacy controls

- Never promote raw tenant copy, contact data, pricing, customer names, support text, or proprietary campaign details.
- Require anonymization and sample-size gates before central promotion.
- Keep tenant overlays tenant-scoped and RLS-protected.
- Mark lessons with confidence and expiry so stale learnings do not silently become doctrine.
- Require admin review before central canon changes.

### Tests implied

- Performance log creation from measured artifacts.
- TenantOverlay RLS and expiry tests.
- Central promotion blocked below sample-size or anonymization thresholds.
- Admin review tests for approve/reject/revise.
- Recommendation tests proving learnings create tasks without mutating customer-facing systems automatically.
