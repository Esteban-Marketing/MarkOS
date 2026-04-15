# Phase 101: Behavioral Tracking and Lifecycle Stitching - Research

**Researched:** 2026-04-14  
**Domain:** First-party CRM activity normalization, lifecycle timeline assembly, and anonymous-to-known identity stitching  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** CRM-visible activity should remain high-signal and first-party only. Low-value UI noise stays out of the operator timeline.
- **D-02:** PostHog remains the signal layer, while CRM continues as the operational source of truth; Phase 101 enriches CRM history rather than replacing it.
- **D-03:** Normalize web activity, campaign touches, and relevant protected-surface events into the shared CRM ledger with tenant-safe contracts and source-event references.
- **D-04:** Default stitching policy is: auto-accept high-confidence matches, route medium-confidence matches to review, and reject low-confidence matches.
- **D-05:** Anonymous-to-known stitching must stay reviewable and non-destructive; this phase must not introduce silent merges or irreversible identity shortcuts.
- **D-06:** Conflicting or ambiguous tenant context remains fail-closed during ingest and identify flows.
- **D-07:** Once identity is stitched, preserved pre-conversion history should appear on the CRM record with explicit stitched labels and evidence references.
- **D-08:** Pending-review links should not quietly receive attribution credit; lineage and readiness must remain explainable until the stitch is accepted.

### Claude's Discretion
- Exact event naming normalization, helper/module boundaries, and scoring constants may follow the repo’s existing tracking and CRM conventions.
- The planner may choose the thin integration path so long as the high-signal-only rule, review-first stitching, and preserved history behavior remain locked.

### Deferred Ideas (OUT OF SCOPE)
- Rich operator timeline views and filter UX — Phase 102.
- Sales or success queue logic driven from behavior signals — Phase 103.
- Outbound send/writeback workflows — Phase 104.
- AI summaries and attribution dashboards — Phase 105.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-03 | Every CRM record exposes a unified lifecycle timeline that combines task, note, stage, campaign, and communication activity. | Reuse the shared CRM activity ledger and timeline builder so Phase 101 extends the canonical history rail rather than inventing a new one. |
| TRK-01 | First-party web and campaign activity is normalized into the CRM activity ledger with tenant-safe event contracts. | Extend the existing ingest contract and normalizer so event families, source refs, and payload sanitization are explicit and testable. |
| TRK-02 | Anonymous sessions can stitch to known contacts or accounts with reviewable confidence controls and preserved pre-conversion history. | Reuse identity-link scoring and accepted-only timeline attachment so pre-conversion history stays preserved, reviewable, and non-destructive. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat .planning/STATE.md as the canonical live milestone state.
- Stay within the existing MarkOS architecture; do not replatform the CRM or tracking lane.
- Use the repo’s Node test workflow for validation: `npm test` or `node --test test/**/*.test.js`.
- Keep the GSD / MarkOS boundary intact: this phase is implementation research for CRM tracking only.
- If manual runtime checking is needed later, the local onboarding backend runs with `node onboarding/backend/server.cjs`.

## Summary

Phase 101 is best implemented as a **thin reuse-and-contract phase**, not as a new analytics subsystem. The repo already contains the core seams needed for the work: tenant-safe ingest in `api/tracking/ingest.js`, confidence-based stitch decisions in `api/tracking/identify.js` plus `lib/markos/crm/identity.ts`, timeline assembly in `lib/markos/crm/timeline.ts`, and accepted-only attribution behavior in `lib/markos/crm/attribution.ts`.

The main planning need is to **tighten the event contract and finish the lifecycle semantics**, not to add more infrastructure. Specifically: formalize the normalized activity-family contract, preserve source evidence and stitched labels on timeline rows, keep pending-review links excluded from attribution, and expand tests around tenant ambiguity, pre-conversion history, and account/contact record kinds.

**Primary recommendation:** Reuse the current CRM ledger helpers and add contract-first tests before any logic changes; Phase 101 should ship by extending the existing normalizer, stitcher, timeline, and attribution guardrails in that order.

## Reusable Code Inventory

| Module | Current Use | Reuse Guidance |
|--------|-------------|----------------|
| `lib/markos/crm/tracking.ts` | Normalizes tracked events, filters low-signal authenticated noise, preserves UTM payloads. | Keep as the single event-to-ledger normalizer; extend its closed mapping rather than adding parallel mapping logic elsewhere. |
| `api/tracking/ingest.js` | Tenant-safe ingest surface for event batches, payload sanitization, and CRM activity persistence. | Keep as the single write boundary for Phase 101 web/campaign behavior. |
| `lib/markos/crm/identity.ts` | Scores confidence and emits accepted / review / rejected link statuses. | Reuse the scoring seam and thresholds; only tune constants if failing tests prove a gap. |
| `api/tracking/identify.js` | Protected surface for stitch decisions with tenant-ambiguity denial. | Keep fail-closed auth and body-vs-token tenant consistency checks intact. |
| `lib/markos/crm/timeline.ts` | Builds unified timeline and attaches accepted anonymous history. | Extend row labeling and evidence clarity here; do not move stitching logic into UI or reporting layers. |
| `lib/markos/crm/attribution.ts` | Uses accepted stitched identities only and degrades readiness honestly. | Preserve this guardrail; Phase 101 should not grant credit to review-pending links. |
| `lib/markos/telemetry/events.cjs` | Redacts secret-like keys before persistence / telemetry. | Keep payload redaction centralized; never hand-roll per-route redaction. |
| Existing tracking tests | Already cover ingest, history attachment, and tenant denial paths. | Use as Wave 0 anchors and expand with a few missing edge cases only. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MarkOS CRM ledger helpers | repo-local | Canonical activity normalization, identity links, timeline assembly, and attribution readiness | Already matches the milestone architecture and keeps CRM as source of truth |
| `posthog-node` | repo-pinned `^5.21.2` (latest verified `5.29.2`, published 2026-04-09) | First-party signal capture layer | Officially supports anonymous + identified events without forcing CRM to become an analytics silo |
| `@supabase/supabase-js` | repo-pinned `^2.58.0` (latest verified `2.103.0`, published 2026-04-09) | Hosted auth and tenant-scoped runtime context | Matches existing hosted auth checks and fail-closed tenant enforcement |
| Node built-in test runner | local `v22.13.0` | Fast phase validation | Already used across the repo and ideal for contract-first TDD |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next` | repo-pinned `^15.2.0` (latest verified `16.2.3`, published 2026-04-08) | API route hosting and protected surface integration | Keep current repo line; no framework upgrade is needed for Phase 101 |
| PostHog JS / browser capture semantics | official docs guidance | Anonymous-to-identified behavior and group-level company semantics | Use as the reference model for event naming and stitch timing, not as the CRM source of truth |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared CRM activity ledger | Separate CDP or warehouse-first event store | Too much scope and breaks the milestone’s “CRM as operational source of truth” decision |
| Review-first link statuses | Silent auto-merge | Faster, but violates the locked non-destructive stitching and auditability requirements |
| High-signal filtering | Raw event firehose into CRM | Produces noisy timelines and untrustworthy operator history |

**Installation:** No new packages are recommended for Phase 101. Implement on top of the existing repo dependencies.

**Version verification:** Local environment confirmed `node v22.13.0` and `npm 10.9.2`. Current registry checks on 2026-04-14 confirmed `posthog-node 5.29.2`, `@supabase/supabase-js 2.103.0`, and `next 16.2.3`; this phase should stay on the repo’s existing dependency line unless a separate upgrade phase is opened.

## Architecture Patterns

### Recommended Project Structure
```text
api/tracking/
├── ingest.js            # tenant-safe first-party event write boundary
└── identify.js          # protected stitch decision surface

lib/markos/crm/
├── tracking.ts          # normalize raw event payloads into CRM ledger rows
├── identity.ts          # confidence scoring and link lifecycle
├── timeline.ts          # accepted-only stitched history assembly
└── attribution.ts       # readiness + crediting rules

test/tracking/
├── *normalization*.test.js
├── *ingest*.test.js
└── *history-attachment*.test.js
```

### Pattern 1: Thin ingest normalizer with a closed activity-family enum
**What:** Raw web or protected-surface events should be normalized once into a tenant-scoped CRM row shape.

**When to use:** Every first-party tracking write for Phase 101.

**Example:**
```javascript
const normalized = normalizeTrackedActivity({
  tenant_id: context.tenant_id,
  authenticated: context.protected_surface,
  event_name,
  source_event_ref,
  anonymous_identity_id,
  payload,
});
```

**Planning note:** The route already computes a requested activity family, but the shared normalizer should remain the single authority for final family selection. The plan should tighten this contract rather than duplicating mapping logic in the route.

### Pattern 2: Review-first identity stitching
**What:** Convert signal evidence into `accepted`, `review`, or `rejected` identity links.

**When to use:** Anonymous-to-known contact or account matching.

**Example:**
```javascript
const score = scoreIdentityCandidate(input.signals);
const decision = score.recommended_decision;
const link = createIdentityLink(store, {
  tenant_id: auth.tenant_id,
  anonymous_identity_id: input.anonymous_identity_id,
  known_record_kind: input.known_record_kind,
  known_record_id: input.known_record_id,
  confidence: score.confidence,
  link_status: decision,
  source_event_ref: input.source_event_ref,
});
```

### Pattern 3: Accepted-only timeline stitching
**What:** Pre-conversion anonymous activity appears on a known record timeline only when the identity link status is `accepted`.

**When to use:** Timeline assembly for contacts or accounts after stitching.

**Example:**
```javascript
const acceptedLinks = (options.identity_links || [])
  .filter((link) => link?.link_status === 'accepted');
```

**Planning note:** Phase 101 should add clearer stitched labels and evidence references on the returned timeline rows, but the accepted-only rule should stay locked.

### Pattern 4: Honest attribution degradation
**What:** Attribution readiness should degrade when touches are pending review or incomplete, instead of crediting silently.

**When to use:** Any weighting or revenue-credit computation that consumes stitched history.

**Example:**
```javascript
if (reviewExcludedCount > 0) {
  reasons.push('review identity linkage excluded from attribution credit');
}
```

### Anti-Patterns to Avoid
- **Parallel analytics truth layer:** Do not create a second CRM-adjacent event store for this phase.
- **Family drift from raw event names:** Do not expose raw `posthog.$pageview`-style names as the canonical CRM family.
- **Silent medium-confidence merges:** Domain-only or device-only evidence must not auto-attach history.
- **Scope creep into workspace/reporting UI:** Timeline viewing UX belongs to Phase 102 and reporting rollups to Phase 105.

## Needed Event Contract Work

The repo already has the right ingest route and contract file. Phase 101 should add **thin contract hardening**, not new endpoints:

1. **Keep one closed family enum** for the CRM-visible tracking rail:
   - `web_activity`
   - `campaign_touch`
   - `agent_event`
   - `attribution_update`

2. **Require and preserve these fields on every CRM-visible row:**
   - `tenant_id`
   - `event_name`
   - `source_event_ref`
   - `occurred_at`
   - `related_record_kind`
   - `related_record_id` or `anonymous_identity_id`
   - sanitized `payload_json`

3. **Add explicit stitching metadata to returned timeline rows** rather than hiding it in internal state only:
   - `stitched_identity: true|false`
   - a human-readable stitched label in payload or row metadata
   - the accepted identity-link evidence reference that justified attachment

4. **Preserve campaign evidence** from entry redirects and first-touch moments:
   - destination
   - UTM fields
   - affiliate / referrer evidence
   - attribution state (`preserved` vs degraded fallback)

5. **Do not expand the contract into outbound or AI semantics** in this phase.

## Stitching and Attribution Guardrails

| Guardrail | Recommendation | Why |
|-----------|----------------|-----|
| Confidence thresholds | Keep the current policy: `>= 0.80` accepted, `>= 0.40` review, otherwise rejected | Matches the locked review-first requirement and current code |
| History attachment | Attach pre-conversion history only for accepted links | Prevents silent cross-person contamination |
| Attribution credit | Exclude review-pending anonymous touches from credit and flag readiness as degraded | Keeps revenue evidence explainable and auditable |
| Mutation behavior | Keep stitching non-destructive and reversible in lineage terms | Avoids irreversible identity shortcuts |
| Evidence traceability | Every decision must keep a source-event reference and decision event row | Required for later operator trust and milestone reporting |

**Primary guardrail:** If a human cannot explain *why* a touch is on a record or *why* it got credit, the implementation is too permissive.

## Tenant Safety

Phase 101 is already aligned to the repo’s fail-closed tenant model and should preserve it:

- Public ingest requires an explicit tenant context outside local runtime.
- Protected ingest and identify flows must continue to use hosted auth checks.
- Body-provided tenant values must never override the verified tenant in the auth token.
- Payloads must remain redacted for keys containing secrets, tokens, passwords, or service-role hints.
- If Phase 101 extends persisted tables later, RLS must remain enabled and scoped to authenticated tenant ownership.

**Implementation guidance:** Treat tenant ambiguity as a hard stop, not a warning. The existing tests already enforce this correctly and should remain phase-gating coverage.

## Likely Task Waves

### Wave 0: Contract and regression-first setup
- Add or extend failing tests for:
  - explicit stitched labels / evidence refs on attached history
  - account-level stitching parity with contact-level stitching
  - event-family contract drift or missing required fields
- Confirm the existing tenant-denial tests stay green.

### Wave 1: Tracking normalization hardening
- Consolidate final activity-family selection into the shared normalizer.
- Preserve only high-signal CRM-visible events.
- Keep redirect / UTM evidence intact for campaign touches.

### Wave 2: Lifecycle stitching semantics
- Reuse the current identity scoring seam.
- Ensure accepted links attach history with visible stitched labeling.
- Keep review decisions visible as decisions, not as attached history.

### Wave 3: Timeline and attribution coherence
- Expand the shared timeline builder so lifecycle history remains readable and explainable.
- Preserve accepted-only attribution credit and degraded readiness on pending review.
- Verify that CRM-03 timeline assembly still reads from one canonical ledger.

### Wave 4: Verification and planning handoff
- Run the targeted tracking and tenant-auth slices.
- Capture evidence for the planner so Phase 102 can consume the unified timeline safely.

## Recommended Implementation Order

1. **Write failing tests for the missing stitched-label and contract-edge cases.**
2. **Tighten `tracking.ts` and the ingest contract so normalization is authoritative and deterministic.**
3. **Refine `identify.js` / `identity.ts` only if needed to support the required review states for contacts and accounts.**
4. **Expose clearer stitched evidence in `timeline.ts` while keeping accepted-only attachment.**
5. **Re-run attribution readiness checks to ensure pending-review links still receive no credit.**

This order keeps risk lowest because it locks data shape before changing lifecycle behavior.

## Don’t Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CRM behavior history | A second event database or CDP sync layer | The existing CRM activity ledger | Keeps one operational source of truth and avoids reconciliation drift |
| Identity resolution | Freeform merge heuristics or manual string matching everywhere | `scoreIdentityCandidate()` plus `createIdentityLink()` | Centralizes confidence policy and preserves auditability |
| Timeline joins | UI-specific ad hoc merging of anonymous and known activity | `buildCrmTimeline()` | Keeps stitching logic in one place and testable |
| Attribution gating | Custom per-view revenue math | `buildWeightedAttributionModel()` | Ensures review-pending touches remain excluded consistently |
| Payload safety | Route-by-route secret filtering | `sanitizePayload()` / shared telemetry helpers | Reduces leakage risk and schema inconsistency |

**Key insight:** This phase is mostly about **making existing seams stricter and more expressive**, not about inventing new infrastructure.

## Risks

| Risk | Severity | Why It Matters | Mitigation |
|------|----------|----------------|------------|
| Event contract drift | High | Raw names or families can diverge and make the CRM timeline noisy or non-queryable | Use one normalizer and one closed enum, backed by tests |
| Over-stitching | Critical | Wrong anonymous history on the wrong contact destroys trust and later reporting | Keep accepted / review / rejected thresholds and fail closed on ambiguity |
| Premature attribution credit | High | Review-pending or weakly linked touches can distort lifecycle and revenue evidence | Preserve accepted-only crediting and degraded readiness messaging |
| Tenant bleed | Critical | Cross-tenant activity leakage is a hard trust and security failure | Keep hosted auth enforcement and tenant mismatch denial intact |
| Scope creep | Medium | Workspace views, outbound, and AI logic can balloon the phase | Defer all UI, send, and copilot surfaces to later phases |

## Common Pitfalls

### Pitfall 1: Treating every captured event as CRM-worthy
**What goes wrong:** The timeline floods with low-value UI activity.

**Why it happens:** Analytics tools capture more than operators actually need.

**How to avoid:** Preserve the existing high-signal filter for protected-surface events and keep raw PostHog noise out of CRM-visible history.

**Warning signs:** Massive event counts, unreadable timelines, and operators ignoring the history rail.

### Pitfall 2: Letting review-pending links behave like accepted links
**What goes wrong:** Anonymous touches appear attached or get revenue credit before the stitch is trusted.

**Why it happens:** Review and acceptance are treated as the same lifecycle state.

**How to avoid:** Only accepted links should attach history or receive credit; review links should remain explicit and uncredited.

**Warning signs:** Timeline rows appearing for medium-confidence matches or readiness reports that look “ready” despite pending review.

### Pitfall 3: Route-level family mapping that disagrees with shared normalization
**What goes wrong:** Two parts of the system produce different activity-family values for the same raw event.

**Why it happens:** Contract logic is duplicated across the route and the helper.

**How to avoid:** Keep the helper authoritative and make the route a thin adapter.

**Warning signs:** Tests passing in one layer but failing in timeline or attribution consumers.

### Pitfall 4: Relying on request body tenant data over verified auth
**What goes wrong:** Cross-tenant behavior can be ingested or stitched incorrectly.

**Why it happens:** Public and hosted flows have different context sources and can drift.

**How to avoid:** Continue denying mismatched tenant context and never let body data override verified auth scope.

**Warning signs:** “Ambiguous tenant” situations being logged but not rejected.

## Code Examples

Verified patterns from the current repo:

### High-signal filtering for protected surfaces
```javascript
if (input.authenticated && !HIGH_SIGNAL_AUTHENTICATED_EVENTS.has(eventName)) {
  return Object.freeze({
    crm_visible: false,
    excluded_reason: 'LOW_SIGNAL_EVENT',
    event_name: eventName,
    source_event_ref: toTrimmedString(input.source_event_ref, `tracking:${eventName}`),
  });
}
```

### Accepted-only stitched history in timeline assembly
```javascript
const acceptedAnonymousIds = new Set(acceptedLinks
  .map((link) => String(link.anonymous_identity_id || '').trim())
  .filter(Boolean));
```

### Honest attribution degradation when review links exist
```javascript
if (reviewExcludedCount > 0) {
  reasons.push('review identity linkage excluded from attribution credit');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Analytics silo separate from operational CRM | First-party events normalized into the CRM ledger | Current v3.8.0 milestone direction | One evidence rail for lifecycle and operator trust |
| Silent identity convenience merges | Confidence-aware accepted / review / rejected links | Phase 100 foundation and Phase 101 scope | Safer customer history and clearer lineage |
| Dashboard math as the truth | Explainable evidence-backed attribution readiness | Current CRM-native reporting direction | Reduces hidden drift and supports later auditability |

**Deprecated/outdated:**
- Warehouse-first or graph-database replatforming for this milestone — explicitly out of scope.
- Autocaptured UI noise as CRM history — contrary to the locked high-signal-only rule.

## Open Questions

1. **Should account-level stitching auto-accept on domain evidence alone?**
   - What we know: Current thresholds allow review for mid-confidence evidence and acceptance only for high-confidence evidence.
   - What’s unclear: Whether account linking wants a slightly different score mix than contact linking.
   - Recommendation: Keep one conservative threshold set for Phase 101 unless failing tests demonstrate a specific account use case gap.

2. **Do we need a new CRM-visible family for lifecycle-stage changes in this phase?**
   - What we know: The ledger already supports timeline activity and Phase 101 is focused on behavioral tracking and stitching.
   - What’s unclear: Whether stage transitions should remain `crm_mutation` with richer payload metadata.
   - Recommendation: Do not broaden family taxonomy yet; keep lifecycle stage events in existing CRM mutation semantics and reserve view-specific interpretation for Phase 102.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | API routes and tests | ✓ | `v22.13.0` | — |
| npm | package scripts and version verification | ✓ | `10.9.2` | — |
| PostHog cloud account | External signal sink | Optional for local phase work | — | Use in-memory CRM store and unit tests |
| Hosted Supabase auth | Protected-surface auth validation | Optional for local test coverage | package installed | Existing JWT-based tests cover the fail-closed paths |

**Missing dependencies with no fallback:** None for planning or local validation.

**Missing dependencies with fallback:** External PostHog / hosted auth are not required for unit-level Phase 101 verification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner |
| Config file | none — package scripts call `node --test` directly |
| Quick run command | `node --test test/tracking/*.test.js test/tenant-auth/tracking-tenant-guard.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-03 | Unified lifecycle timeline includes stitched history while preserving order and source refs | unit / integration | `node --test test/tracking/tracking-e2e-history-attachment.test.js test/crm-timeline/crm-timeline-assembly.test.js` | ✅ |
| TRK-01 | Ingest normalizes first-party activity into CRM-visible families with sanitization | unit / API | `node --test test/tracking/crm-activity-normalization.test.js test/tracking/tracking-proxy-ingest.test.js` | ✅ |
| TRK-02 | Anonymous sessions stitch to known records with review-first controls and tenant denial | integration / API | `node --test test/tracking/tracking-e2e-history-attachment.test.js test/tenant-auth/tracking-tenant-guard.test.js` | ✅ |

### Sampling Rate
- **Per task commit:** quick tracking slice plus tenant-auth slice
- **Per wave merge:** all tracking tests plus any CRM timeline tests touched
- **Phase gate:** `npm test` green before verification handoff

### Wave 0 Gaps
- [ ] Add a direct regression for explicit stitched evidence labeling on timeline rows
- [ ] Add a parity test for account-level `known_record_kind` behavior in stitching
- [ ] Add a contract test for required field presence / family drift when new event names are introduced

## Sources

### Primary (HIGH confidence)
- Internal repo context and phase artifacts from Phase 100 and Phase 101
- Official PostHog docs: capture events, identify users, and group analytics
- Official Supabase docs: Row Level Security guidance and fail-closed policy design

### Secondary (MEDIUM confidence)
- MarkOS milestone research and internal risk brief for CRM/customer-intelligence sequencing

### Tertiary (LOW confidence)
- None required for the core planning recommendation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against the repo and current package registry
- Architecture: HIGH — built directly from existing Phase 100/101 code seams and tests
- Pitfalls: HIGH — supported by repo regressions plus official PostHog and Supabase guidance

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
