# Phase 221 Research - CDP Identity, Audience, and Consent Substrate

## Primary research question

What is the smallest durable CDP substrate MarkOS can add so identity, consent, events, and audiences become one governed truth for CRM, owned channels, analytics, launches, and ecosystem workflows?

## Standard Stack

- Keep the current local stack: Supabase/RLS, hosted `api/` routes, `lib/markos/*`, and append-oriented audit/task patterns.
- Reuse the current tracking and CRM identity seam before introducing new infrastructure.
- Model CDP primitives under a dedicated `lib/markos/cdp/*` boundary, but feed CRM and analytics rather than replacing them outright.

## Architecture Patterns

- Append-only event ingestion with normalized event envelopes.
- Identity links and merge decisions recorded separately from profile read models.
- Consent as a first-class shared object, not channel-local flags.
- Audience definitions and audience snapshots as governed, versioned activation inputs.
- Downstream engines consume CDP outputs through writeback/read-model adapters.

## Don't Hand-Roll

- A second identity graph parallel to the current CRM identity-link logic.
- Channel-specific consent systems that do not reconcile to one tenant-scoped truth.
- Ad hoc audience SQL/query strings as the system-of-record.
- Another isolated tracking pipeline that bypasses CRM timeline and audit.

## Common Pitfalls

- Treating identity stitching as the full CDP.
- Mixing raw events, derived traits, and audience membership in one mutable object.
- Letting activation happen from "live query" state instead of frozen audience snapshots.
- Keeping consent only in outbound messaging records.

## Codebase Findings

### Files inspected

- `api/tracking/identify.js`
- `api/tracking/ingest.js`
- `lib/markos/crm/identity.ts`
- `lib/markos/crm/timeline.ts`
- `lib/markos/crm/attribution.ts`
- `lib/markos/contracts/schema.ts`
- `lib/markos/crm/contracts.ts`

### Existing support

- Tracking ingest already normalizes events and writes them into CRM activity history.
- Identity stitching already exists with confidence scoring, accepted/review states, and tenant scoping.
- CRM timeline already replays accepted anonymous identity history into record timelines.
- Attribution already consumes stitched identity links.
- The repo already has a simple segment schema and a `/markos/segments` route, which is useful as an audience placeholder.

### Missing capabilities

- No first-party profile or trait store beyond CRM entities and activity rows.
- No generalized consent ledger across email, SMS, WhatsApp, push, launches, and partner-facing flows.
- No audience-definition or audience-snapshot system-of-record.
- No explicit distinction between raw event, trait, profile, and activation state.
- No cross-domain deletion/export posture for CDP-specific objects.

## Recommended Implementation Path

1. Introduce core objects: `IdentityProfile`, `IdentityLink`, `ConsentRecord`, `EventEnvelope`, `TraitSnapshot`, `AudienceDefinition`, and `AudienceSnapshot`.
2. Keep current tracking ingest and identity-link scoring as the first ingestion path into the CDP.
3. Split channel consent from channel delivery so consent can be shared by email, messaging, launches, and ecosystem workflows.
4. Keep audience activation read-only at first; downstream mutation paths should still live in later phases.
5. Make CRM and analytics the first two consumers so the CDP earns trust before wider fan-out.

## Tests Implied

- Identity-link and merge/split decision tests.
- Tenant/RLS isolation for profile, consent, and audience objects.
- Audience-snapshot immutability tests.
- Consent/jurisdiction/suppression policy tests.
- Regression tests proving CRM timeline and attribution still work with CDP-backed identity data.

## Research Decisions

- Phase 221 should be additive and compatibility-safe.
- The first slice should stop at governed identity, consent, events, and audience snapshots.
- Activation execution belongs later; Phase 221 should establish the source-of-truth layer first.
