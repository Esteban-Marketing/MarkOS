# Phase 59: Behavioral Tracking and Identity Stitching - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 59 turns the Phase 58 CRM activity and identity foundations into a real ingestion path by routing first-party behavioral telemetry through MarkOS-controlled tracking seams, preserving attribution from ads and affiliate traffic, and stitching anonymous behavior onto known CRM records with explicit lineage.

This phase owns TRK-01, TRK-02, TRK-03, and TRK-04.

This phase does not own pipeline workspace views (Phase 60), next-best-action and operator workflow surfaces (Phase 61), outbound channel delivery (Phase 62), or CRM-native attribution reporting closure (Phase 64). It consumes the canonical CRM schema, activity ledger, identity-link model, and tenant-safe APIs already delivered by Phase 58.

</domain>

<decisions>
## Implementation Decisions

## Tracking Surface Scope
- **D-01:** Phase 59 covers all major first-party CRM-feeding surfaces in the first pass: public marketing and landing pages, onboarding flow surfaces, and authenticated MarkOS app or operator surfaces.
- **D-02:** Proxy-based PostHog collection is mandatory for supported CRM-feeding first-party surfaces; direct browser-only capture is not an acceptable end-state for milestone verification.
- **D-03:** Website and app tracking must capture page-level and key element-level interactions, not only aggregate conversion events, so CRM timelines can reconstruct meaningful pre- and post-conversion behavior.

## Tracking Subdomain and Attribution Preservation
- **D-04:** Ads and affiliate traffic should be implemented as a production-ready tracking-subdomain path in Phase 59, not only as contract scaffolding or local mock handlers.
- **D-05:** Campaign and referral traffic must preserve UTM or attribution context at ingestion time with explicit fallback semantics when blockers, privacy filters, or incomplete inputs prevent perfect enrichment.
- **D-06:** Affiliate and tracked redirect flows are in scope for the first pass because attribution preservation is part of the phase boundary, not deferred cleanup.

## Identity Stitching Posture
- **D-07:** Identity stitching should use a balanced posture: deterministic or very high-confidence inputs may auto-link, while weaker inferred matches remain reviewable rather than silently promoted.
- **D-08:** Explicit form submission, identify events, and similarly strong known-identity assertions can participate in automatic history attachment; weaker signals such as shallow device-only or timing-only similarity must not create destructive merges.
- **D-09:** Session-to-contact stitching must preserve anonymous pre-conversion history, confidence context, and source-event lineage when activity is attached to CRM records.

## CRM Activity Ingestion Contract
- **D-10:** Behavioral telemetry remains input evidence that is normalized into the MarkOS-owned CRM activity ledger from Phase 58; PostHog payloads are not the final CRM truth model.
- **D-11:** Mandatory Phase 59 verification coverage includes page views, landing visits, key element interactions, form starts and submissions, campaign-touch and UTM attribution events, affiliate or referral redirects, and authenticated product or operator events that belong on CRM timelines.
- **D-12:** Authenticated product interactions are in scope only when they add customer or operator history value to CRM timelines; this phase should not bloat the ledger with low-signal internal UI noise.

## Privacy, Consent, and Operational Guardrails
- **D-13:** No new privacy or consent constraint was added during discussion, but Phase 59 must preserve the repo's existing privacy notice, sensitive-payload redaction, and fail-closed runtime posture while adding new tracking paths.
- **D-14:** Tracking and stitching failures must degrade explicitly with auditable fallback behavior rather than silently dropping attribution or creating opaque linkage state.

## Scope Guardrails
- **D-15:** Phase 59 is not allowed to expand into full multi-touch attribution modeling, MMM, broad CRM reporting surfaces, or pipeline UI work.
- **D-16:** Phase 59 should finish with a production-grade ingestion and stitching contract that later phases can read, not with speculative surface area that bypasses the Phase 58 CRM model.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Requirement Contracts
- `.planning/ROADMAP.md` - Phase 59 goal, dependency, and downstream milestone mapping
- `.planning/REQUIREMENTS.md` - TRK-01 through TRK-04 definitions and success criteria
- `.planning/STATE.md` - current v3.3 milestone position and next-step status
- `.planning/projects/markos-v3/ROADMAP.md` - milestone success criteria and readiness gates
- `.planning/projects/markos-v3/REQUIREMENTS.md` - requirement-to-phase mapping for TRK scope

### Upstream Dependency Context
- `.planning/phases/58-crm-canonical-schema-and-identity-graph/58-CONTEXT.md` - locked CRM and timeline decisions that Phase 59 must respect
- `.planning/phases/58-crm-canonical-schema-and-identity-graph/58-RESEARCH.md` - activity families, identity foundations, and anti-pattern boundaries
- `.planning/phases/58-crm-canonical-schema-and-identity-graph/58-VERIFICATION.md` - verified CRM schema, timeline, merge, and API guarantees available to Phase 59

### Runtime and Tracking Surfaces
- `onboarding/onboarding.js` - current browser-side PostHog capture points and privacy notice behavior
- `onboarding/index.html` - current onboarding surface where direct PostHog bootstrap still exists
- `onboarding/backend/agents/telemetry.cjs` - existing server-side PostHog writer used as a reference seam for proxy and enrichment behavior
- `onboarding/backend/runtime-context.cjs` - runtime policy, telemetry preference, and sensitive-key redaction posture
- `lib/markos/telemetry/events.ts` - canonical telemetry sanitization and event-envelope patterns
- `api/status.js` - fail-closed protected route pattern for tenant-aware runtime behavior

### CRM Activity and Identity Targets
- `supabase/migrations/58_crm_activity_and_identity.sql` - append-only CRM activity, identity-link, merge, and lineage schema
- `lib/markos/crm/timeline.ts` - activity-family normalization and deterministic timeline ordering
- `lib/markos/crm/identity.ts` - candidate scoring and link creation seams
- `lib/markos/crm/merge.ts` - immutable merge review and lineage model
- `api/crm/activities.js` - shared timeline query boundary that Phase 59 ingestion must feed correctly

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 58 already delivered the CRM-owned activity ledger, identity-link tables, merge lineage model, and deterministic timeline helpers that Phase 59 should populate rather than redesign.
- The onboarding runtime already exposes PostHog configuration, privacy-notice behavior, and multiple browser capture points that can be migrated behind proxy-controlled seams.
- Server-side telemetry infrastructure already exists in `onboarding/backend/agents/telemetry.cjs`, which lowers the risk of adding proxy and enrichment handling without inventing a new analytics client abstraction.

### Established Patterns
- Tenant and role enforcement remain fail-closed by default and should apply to any ingestion, redirect, or enrichment endpoint introduced in this phase.
- Payload sanitization and sensitive-field redaction are already centralized; tracking ingestion should reuse those controls instead of creating a looser telemetry path.
- CRM timelines are MarkOS-owned and append-only; ingestion work should emit evidence that preserves source references and confidence lineage.

### Integration Points
- Public pages, onboarding surfaces, and authenticated app events all need one compatible tracking contract so later CRM views do not fork by surface type.
- Tracking-subdomain events and redirects must land in the same CRM activity vocabulary used by `lib/markos/crm/timeline.ts`.
- Identity stitching should attach history through the Phase 58 identity and merge helpers rather than introducing a second dedupe model.

</code_context>

<specifics>
## Specific Ideas

- Preserve raw source references for every tracked touch so later attribution and reporting phases can explain where a CRM timeline event came from.
- Treat authenticated operator and product events as opt-in, high-signal activity families with clear inclusion rules instead of mirroring all internal UI telemetry into CRM.
- Define explicit fallback semantics for blocked or partially enriched attribution so operators can distinguish known-touch, partial-touch, and unattributed activity.
- Keep automatic stitching thresholds narrow enough to protect operator trust while still attaching obvious pre-conversion history without manual work.

</specifics>

<open_questions>
## Open planning questions

- What exact signal combinations qualify as balanced auto-linking versus review-only linking for TRK-04?
- Which authenticated app and operator events are high-signal enough to be CRM-visible in Phase 59 without polluting timelines?
- Should the production-ready tracking subdomain land as one generic redirect-plus-enrichment service or separate seams for ad traffic and affiliate traffic?
- Which first-party app routes beyond onboarding should be mandatory in Wave 1 versus covered by a reusable contract and later rollout?

</open_questions>

<deferred>
## Deferred Ideas

- Full multi-touch attribution modeling and MMM logic.
- Broad reporting, dashboard, or revenue cockpit surfaces beyond verification evidence needed for Phase 59.
- Pipeline UI, next-best-action logic, or outbound delivery orchestration owned by later phases.
- Destructive or highly aggressive auto-merge behavior that outruns the reviewable lineage posture established in Phase 58.

</deferred>

---

*Phase: 59-behavioral-tracking-and-identity-stitching*
*Context gathered: 2026-04-04*
*Decisions locked: 16 (D-01 through D-16)*
