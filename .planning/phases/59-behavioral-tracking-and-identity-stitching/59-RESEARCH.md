# Phase 59: Behavioral Tracking and Identity Stitching - Research

**Researched:** 2026-04-04
**Domain:** Proxy-routed PostHog collection, tracking-subdomain attribution preservation, CRM activity ingestion, and session-to-contact identity stitching
**Confidence:** HIGH (recommendations are grounded in the shipped Phase 58 CRM model, current onboarding/PostHog implementation, runtime-context safeguards, and current PostHog proxy guidance)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Phase 59 covers all major CRM-feeding first-party surfaces in the first pass

Planning must treat public marketing and landing pages, onboarding flow surfaces, and authenticated MarkOS app or operator surfaces as in scope.

Implementation guidance:
- Do not plan Phase 59 as onboarding-only telemetry.
- Reuse one tracking contract across public, onboarding, and authenticated surfaces so Phase 60 and later phases do not fork by surface type.
- Keep authenticated event capture selective and high-signal so CRM timelines stay useful.

### 2. Proxy-based PostHog is mandatory for CRM-feeding surfaces

Current direct browser capture in onboarding is a migration seam, not the desired end state.

Planning guidance:
- Phase 59 must introduce a MarkOS-owned proxy or first-party ingestion path rather than leaving browser code pointed directly at hosted PostHog.
- The client `api_host` should target the MarkOS-controlled ingestion prefix, matching PostHog’s documented proxy pattern.
- Consent and privacy posture must remain explicit while tracking moves behind first-party endpoints.

### 3. Ads and affiliate traffic must use a production-ready tracking subdomain path

Phase 59 owns attribution-preserving entry handling, not just future intent documents.

Planning guidance:
- Implement tracked redirects or enrichment handlers that preserve UTM and referral context.
- Preserve fallback semantics when blockers, incomplete metadata, or privacy filtering prevent perfect attribution.
- Treat ad and affiliate tracking as CRM evidence inputs, not reporting-only analytics.

### 4. Identity stitching should be balanced, not fully conservative or aggressive

Planning guidance:
- Strong signals may auto-link anonymous history to known contacts or accounts.
- Weaker inferred matches must remain candidate or review-only rather than silently promoted into accepted identity links.
- Preserve confidence, source-event lineage, and reviewer visibility on every non-trivial stitch decision.

### 5. Scope guardrails remain strict

This phase must not expand into:
- full attribution modeling or MMM
- broad reporting or dashboard work
- pipeline UI implementation
- destructive or opaque automatic dedupe behavior
- low-signal internal event mirroring that pollutes CRM timelines

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRK-01 | PostHog proxy tracking is mandatory for all first-party web surfaces that feed CRM activity timelines. | Recommends a MarkOS-owned first-party ingestion path with browser clients configured to use proxied `api_host` endpoints and server-side enrichment before CRM activity normalization. |
| TRK-02 | Ads and affiliate traffic use a dedicated tracking subdomain and server-side enrichment path to preserve attribution through blockers and privacy filtering where technically feasible. | Recommends tracked redirect and enrichment handlers that preserve UTM, affiliate, referrer, and fallback attribution state as CRM-readable evidence. |
| TRK-03 | Website interaction capture includes page-level and element-level telemetry sufficient to reconstruct meaningful visitor, contact, and account timelines. | Recommends a mandatory activity family set for page views, key interactions, form starts, submissions, and campaign touches, with explicit timeline visibility expectations. |
| TRK-04 | Identity stitching links anonymous sessions to known contacts and accounts using approved identity resolution rules while preserving pre-conversion history. | Recommends a balanced threshold model using Phase 58 scoring seams, review-only candidates for weaker matches, and immutable lineage for accepted and rejected stitching decisions. |

</phase_requirements>

## Project Constraints (from CLAUDE.md and repo state)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the live phase artifacts remain the authoritative planning sources.
- Phase 58 already established the canonical CRM activity ledger, identity-link model, merge lineage, and tenant-safe CRM API seams; Phase 59 must feed those contracts, not redefine them.
- Row-level security, tenant context, and fail-closed enforcement are mandatory for any new tracking or enrichment endpoint.
- `posthog-node` is already installed, but the browser implementation still initializes PostHog directly in onboarding, so migration should prefer extension over a new analytics stack.
- Privacy notice behavior, sensitive payload redaction, and telemetry preference handling already exist in onboarding and runtime context code and should be preserved.

## Summary

Phase 59 should be implemented as a **MarkOS-owned first-party tracking ingestion layer feeding the Phase 58 CRM ledger**, not as a collection of raw PostHog events sprinkled across the app. The repo already contains the necessary foundation to do this cleanly: a browser-side onboarding capture seam that can be migrated, a working server-side PostHog client in `onboarding/backend/agents/telemetry.cjs`, and a CRM activity and identity model in Phase 58 that is explicitly designed to receive `web_activity`, `campaign_touch`, and stitched anonymous history.

The strongest implementation path is:

1. Move CRM-feeding browser telemetry behind a MarkOS-controlled proxy or ingestion prefix.
2. Normalize browser and redirect events into the Phase 58 CRM activity vocabulary instead of treating PostHog payloads as final CRM truth.
3. Add a production-ready tracking-subdomain and redirect-plus-enrichment path for paid and affiliate traffic so first-touch attribution survives blockers where feasible.
4. Use the existing `scoreIdentityCandidate()` seam as the core of a balanced auto-link versus review-only policy rather than inventing a second identity system.
5. Define validation around end-to-end history attachment into CRM timelines, not just around raw event receipt.

This phase is therefore a **proxy + enrichment + CRM normalization + identity review** problem. It is not a dashboard phase, not a full attribution phase, and not a UI polish phase.

## Competitive Landscape

Phase 59 is not competing on who can emit the most events. It is competing on whether MarkOS can preserve attribution and identity history without surrendering CRM truth to an analytics vendor.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| PostHog-first product analytics | Strong browser capture, session identity, first-party proxy options, event-level flexibility | Proxy-capable client setup, session and distinct-id continuity, history-based pageview capture for SPA-like flows | Treating analytics storage as the CRM activity ledger or assuming proxying alone solves attribution normalization |
| Segment/RudderStack/CDP style event routing | Clear event normalization and downstream fan-out | Separation between raw event receipt and normalized CRM activity contracts | Building a generic event bus before the required CRM event families and identity rules are locked |
| HubSpot-style marketing attribution CRM | Practical campaign touch visibility tied to contact timelines | Campaign-touch activity as CRM-native history, explicit first-touch evidence, visible form and conversion trails | Hidden heuristics or opaque attribution stitching that operators cannot review |
| Attio-style flexible relationship graph | Rich relationship context and identity-friendly graph posture | Contact or account linkage that feels graph-aware without losing canonical CRM state | Schema ambiguity that makes tenant-safe governance and reviewability harder |
| Affiliate or paid redirect tools | Durable link-based attribution capture under blocker pressure | Dedicated first-party tracking subdomain and redirect enrichment for paid and referral traffic | Isolating redirect data from CRM so marketing and CRM histories diverge |

### Strategic conclusion

MarkOS should position Phase 59 as:

- **More CRM-governed than product-analytics-native tools**
- **More attribution-preserving than direct browser-only capture**
- **More reviewable than aggressive identity auto-merge systems**
- **More tenant-safe than generic redirect trackers**

The winning design is a **first-party proxy capture path + tracking-subdomain enrichment + CRM-native activity normalization + balanced identity stitching review model**.

## Audience Intelligence

The immediate audience for Phase 59 is internal planners, implementers, and future revenue operators who need behavior history to become legible inside the CRM model established in Phase 58.

### Primary operator needs

1. See meaningful anonymous and known-user behavior on CRM timelines without manually correlating analytics dashboards and CRM records.
2. Preserve campaign, affiliate, and form-touch context through redirects, blockers, and identity transitions.
3. Trust that auto-linking is narrow, explainable, and recoverable when confidence is not strong enough.
4. Keep tenant safety, privacy posture, and auditability intact while increasing tracking coverage.

### Secondary implementation audience

1. Phase 59 planners who need a concrete decomposition into proxy, enrichment, stitching, and validation work.
2. API implementers who need to know which parts of the existing telemetry runtime can be reused.
3. Future CRM UI phases that depend on coherent, queryable activity history rather than vendor-shaped event payloads.

### Audience implications for research

- Tracking design must optimize for **CRM readability**, not just event completeness.
- Identity linking must optimize for **trust and lineage**, not maximum merge volume.
- Redirect and attribution design must optimize for **stable preserved context**, not just short-term analytics counts.
- Validation must optimize for **timeline-visible outcomes**, not only raw event capture success.

## Channel Benchmarks

These are planning heuristics for a modern first-party CRM-feeding tracking layer. They are design targets for Phase 59 validation, not promises of current production performance.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| First-party proxy event acceptance | >=95% accepted for supported first-party surfaces under healthy runtime conditions | >=99% |
| Tracking redirect latency p95 | <=250ms heuristic for first-party redirect instrumentation | <=150ms |
| UTM and campaign context preservation on tracked entries | 80-90% heuristic depending on blockers and traffic quality | >=95% with explicit fallback tagging when incomplete |
| Key interaction capture coverage on in-scope surfaces | 70-85% heuristic when instrumented manually | >=90% of declared required events |
| Anonymous-to-known history attachment for eligible conversions | 70-85% heuristic depending on signal quality | >=90% for high-confidence eligible conversions |
| False-positive auto-link rate | <5% heuristic for safe CRM identity automation | <2% |
| Candidate-to-review visibility completeness | Often weak or implicit in lightweight trackers | 100% for non-auto-accepted links |
| CRM timeline ingestion freshness | <=15 min heuristic for operational analytics to CRM sync | <=5 min |

### Benchmark interpretation

- Redirect latency matters because tracking-subdomain paths cannot materially degrade campaign click-through experience.
- Preservation coverage matters more than raw event count because Phase 64 attribution depends on usable campaign-touch evidence.
- Auto-link precision matters more than aggressive identity unification because bad stitching contaminates CRM timelines and reporting.

## Recommended Approach

### 1. Introduce a MarkOS-owned proxy or ingestion path for CRM-feeding PostHog traffic

Current onboarding code still does:

- direct `posthog.init(config.posthog_api_key, { api_host: config.posthog_host })`
- direct browser `capture()` calls for onboarding lifecycle events

PostHog’s current guidance supports proxying through a first-party path prefix and configuring the client `api_host` to that prefix. The repo should adopt that pattern, but the important MarkOS addition is that proxying must feed CRM activity normalization rather than only forward vendor events.

Recommended outcome:

- browser clients target a MarkOS-owned ingestion prefix or endpoint
- server-side ingestion sanitizes payloads and enriches attribution context
- forwarded analytics remain analytics
- normalized CRM activity rows remain CRM truth

### 2. Add a dedicated tracking-subdomain and redirect enrichment seam

TRK-02 should not be implemented as only extra query params on existing pages. It should be a real first-party tracked entry path that can:

- record campaign or affiliate click entry
- preserve UTM and partner metadata
- set or continue anonymous identity/session context
- attach fallback attribution state when full metadata is missing
- redirect the user quickly to the intended landing destination

Recommended design choices:

- one shared tracking-subdomain service or handler family is preferable to ad hoc per-channel logic
- separate ad and affiliate routing can still share the same canonical enrichment contract if operationally simpler
- redirect output should create `campaign_touch` or `web_activity` evidence suitable for CRM timelines

### 3. Normalize all supported behavior into the Phase 58 CRM activity vocabulary

Phase 58 already created the durable target model. Phase 59 should map incoming behavior into those MarkOS-owned families rather than extending CRM activity around vendor event names.

Recommended minimal families for Phase 59:

- `web_activity` for page and key element interactions
- `campaign_touch` for tracked entries, UTM touches, and referral or affiliate landings
- `attribution_update` only when attribution state changes materially
- existing `agent_event`, `crm_mutation`, `task`, and `note` families remain downstream consumers, not primary Phase 59 additions

This keeps Phase 59 additive and directly compatible with `buildCrmTimeline()`.

### 4. Implement balanced identity stitching on top of the existing Phase 58 scoring seam

The current scoring helper already yields:

- `email_exact_match` = +0.65
- `domain_match` = +0.15
- `device_match` = +0.10
- `session_overlap` = +0.10
- `form_submitted` = +0.15
- `recommended_decision` thresholds of `accepted >= 0.8`, `review >= 0.45`, otherwise `rejected`

This is already close to the user’s requested balanced posture and should be treated as the default planning baseline, not discarded.

Recommended Phase 59 posture:

- keep `>= 0.80` as the auto-link threshold unless new evidence shows excessive false negatives
- keep `0.45 - 0.79` as candidate or review-only
- preserve rejected evidence for audit and tuning
- do not turn device-only or timing-only proximity into accepted links

### 5. Keep consent, privacy, and tenant-safety controls in the same code path as tracking

The repo already has:

- a privacy notice on onboarding
- telemetry preference handling in runtime context
- sensitive payload redaction helpers
- fail-closed tenant and auth patterns in API handlers

Phase 59 should extend those exact seams rather than creating a parallel, looser tracking service. If a request cannot be tied to an allowed tenant or a permitted tracked surface, it should degrade explicitly rather than guess.

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **Server-side PostHog client already exists.** `onboarding/backend/agents/telemetry.cjs` already captures server-side events with redaction-safe payload handling and can be extended or mirrored for proxy ingestion.
2. **CRM target model already exists.** `crm_activity_ledger`, `crm_identity_links`, `crm_merge_decisions`, and timeline helpers are shipped and verified from Phase 58.
3. **Identity scoring already exists.** `lib/markos/crm/identity.ts` already exposes a reasonable baseline threshold model for balanced identity linking.
4. **Telemetry and deny-event plumbing already exists.** `runtime-context.cjs` can emit deny telemetry and centralizes sensitive-field handling.
5. **Tracking taxonomy already exists in MIR.** `.planning/MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` already defines UTM source, medium, campaign, and content conventions that Phase 59 should preserve rather than reinvent.

### Current constraints and gaps

1. **No proxy route exists yet.** The repo currently has direct browser capture in onboarding and no dedicated CRM-feeding proxy endpoint.
2. **No tracked redirect handler exists yet.** There is currently no built-in ad or affiliate redirect and enrichment seam.
3. **No Phase 59 verification tests exist yet.** Research must therefore specify test families clearly enough for planning to generate them.
4. **Current timeline family names are broader than the raw event taxonomy.** Phase 59 should map richer raw activity (`web.page_viewed`, `web.form_submitted`, etc.) into the approved CRM family layer cleanly.
5. **Current browser capture is onboarding-centric.** Public site and authenticated app coverage will need deliberate surfacing during planning.

### Architectural implication

Phase 59 should be primarily a **capture-normalize-stitch-validate** phase:

- capture through first-party proxy and redirect seams
- normalize into CRM activity contracts
- stitch anonymous history to known records safely
- validate timeline-visible outcomes and attribution preservation

This phase should not be driven by dashboards or vendor schemas.

## Tracking Requirements

### Mandatory in-scope event evidence

For Phase 59 planning and verification, the following evidence types should be mandatory:

- landing page and first-party page views
- key element interactions and CTA clicks
- form starts and form submissions
- campaign and UTM touch capture
- affiliate or referral redirect capture
- authenticated product or operator events that materially affect CRM relationship history

### Required normalized CRM activity properties

Phase 59 should continue to preserve the Phase 58 canonical fields, especially:

- `tenant_id`
- `activity_family`
- `related_record_kind`
- `related_record_id`
- `anonymous_identity_id` when applicable
- `source_event_ref`
- `payload_json`
- `occurred_at`

Phase 59-specific enrichment should make sure the payload or explicit fields carry:

- UTM source, medium, campaign, content, and term when present
- referral or affiliate identifiers when present
- tracked landing destination and entry referrer where safe
- capture surface (`public`, `onboarding`, `authenticated_app` or equivalent)
- identity-confidence context when a stitch is attempted or promoted

### PostHog-specific guidance to preserve

Relevant current PostHog guidance for planning:

- when using a proxy, the client `api_host` should point at the proxied path prefix
- consent-aware setups can disable capture by default until opt-in or explicit enablement
- SPA-like flows should consider history-change pageview capture where appropriate
- alias and identify semantics exist, but MarkOS should still persist its own identity-link evidence rather than relying on PostHog identity state as CRM truth

### Tracking-subdomain requirements to preserve

1. Tracked entry requests must preserve campaign metadata as stable CRM-readable properties.
2. Redirect flows must be safe, fast, and tied to an anonymous identity or session where possible.
3. Partial or degraded attribution must still be visible as an explicit state, not silently discarded.
4. Anonymous history must remain attachable to known contacts after conversion with confidence and lineage intact.

## Risks and Pitfalls

### Pitfall 1: Proxying analytics traffic without normalizing into CRM activity

**What goes wrong:** The implementation satisfies a vendor best practice but still leaves CRM timelines empty or inconsistent.

**Avoid by:** Making CRM activity append or normalization a first-class output of the proxy and redirect flows.

### Pitfall 2: Treating every authenticated app event as CRM-visible history

**What goes wrong:** Timelines become noisy, operator trust drops, and later CRM views become hard to read.

**Avoid by:** Declaring a narrow set of high-signal authenticated events and excluding low-value UI churn.

### Pitfall 3: Building redirect logic that preserves clicks but not identity or tenant context

**What goes wrong:** Attribution survives, but stitching and CRM linkage remain weak or cross-tenant risks emerge.

**Avoid by:** Reusing tenant-safe request context patterns and ensuring anonymous/session context survives the redirect flow.

### Pitfall 4: Letting balanced identity stitching drift into aggressive auto-linking

**What goes wrong:** False-positive links contaminate CRM timelines and later attribution/reporting layers.

**Avoid by:** Keeping strong-signal thresholds narrow, review queues explicit, and rejected lineage visible.

### Pitfall 5: Re-implementing consent or privacy handling in a parallel stack

**What goes wrong:** Tracking becomes inconsistent with the repo’s established privacy and redaction posture.

**Avoid by:** Reusing the existing privacy notice, telemetry preference, and `redactSensitive()` patterns.

### Pitfall 6: Planning validation only around event receipt

**What goes wrong:** Raw requests succeed, but operators still cannot inspect stitched history on CRM timelines.

**Avoid by:** Validating end-to-end visibility in `api/crm/activities.js` timeline reads and identity-link promotion outcomes.

## Validation Architecture

Phase 59 should be considered ready for execution planning only if validation is defined across the following layers:

### 1. Proxy and redirect contract validation

- Tests prove browser or synthetic clients can send tracked events to a MarkOS-owned ingestion prefix.
- Tests prove tracked redirects preserve query metadata, set or continue anonymous context, and redirect correctly.
- Tests prove blocked or malformed attribution requests degrade explicitly.

### 2. CRM activity normalization validation

- Fixture-driven tests prove page views, key element interactions, form starts, submissions, and campaign touches normalize into the approved CRM activity families.
- Timeline tests prove normalized activities are readable through `buildCrmTimeline()` with deterministic ordering and stable `source_event_ref` values.

### 3. Identity stitching validation

- Tests cover all score combinations relevant to the balanced threshold model.
- Tests verify `accepted`, `candidate`, and `rejected` link paths remain explicit and lineage-preserving.
- Conversion fixtures prove prior anonymous activity can attach to the correct contact timeline with confidence context.

### 4. Tenant and privacy validation

- Tests prove no cross-tenant activity or identity linkage can be created through proxy or redirect paths.
- Tests prove sensitive fields are redacted before telemetry forwarding.
- Consent or telemetry-disabled states should produce explicit behavior rather than hidden partial capture.

### 5. Planning-readiness validation

- The research output clearly identifies proxy, redirect, activity normalization, identity stitching, and verification seams.
- Planner can decompose the phase into execution waves without reopening Phase 58 architectural decisions.

### Recommended test families

- `test/tracking-proxy/**/*.test.js`
- `test/tracking-redirect/**/*.test.js`
- `test/crm-timeline/**/*.test.js`
- `test/crm-identity/**/*.test.js`
- `test/tenant-auth/**/*.test.js` extensions for tracking and enrichment handlers
- targeted onboarding/app instrumentation tests where browser capture migration occurs

## Implementation Signals From Current Repo

1. `onboarding/onboarding.js` still initializes PostHog directly, making it the clearest first migration target.
2. `onboarding/backend/agents/telemetry.cjs` already contains the server-side PostHog client and redaction posture needed for first-party ingestion guidance.
3. `runtime-context.cjs` already centralizes telemetry preference, sensitive-key redaction, and optional telemetry emission, which should shape proxy implementation.
4. `lib/markos/crm/timeline.ts` and `58_crm_activity_and_identity.sql` confirm the CRM side is ready to ingest `web_activity` and `campaign_touch` rows immediately.
5. `scoreIdentityCandidate()` already encodes a balanced threshold model that is close to the user-requested posture and should be preserved unless planning finds a stronger reason to adjust it.
6. `.planning/MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` still says attribution is UTM-based manual and “to be automated,” which makes Phase 59 the correct place to close that gap.

## Primary Recommendation

Implement Phase 59 as a **first-party tracking and stitching phase** with four concrete outputs:

1. MarkOS-owned proxy ingestion path for CRM-feeding PostHog traffic
2. production-ready tracking-subdomain and redirect enrichment path for ads and affiliate traffic
3. CRM activity normalization from captured events into the Phase 58 ledger
4. balanced identity stitching flow with explicit candidate, accepted, and rejected evidence plus end-to-end validation

That is the minimum stable tracking and identity layer required before Phase 60 through Phase 64 can build pipelines, next-best-action, outbound execution, and attribution closure without architectural churn.

## RESEARCH COMPLETE
