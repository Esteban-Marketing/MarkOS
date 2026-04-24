# Phase 224 Research - Conversion and Launch Workspace

## Primary research question

What is the smallest native conversion and launch system MarkOS can add so public forms, landing pages, CTAs, and multi-channel launches become governed workflows instead of ad hoc pages and checklists?

## Standard Stack

- Reuse existing Next.js marketing/public routes and hosted `api/` patterns.
- Keep public-surface state contract-backed and tracked through the same telemetry and approval substrate.
- Reuse Pricing Engine, task, and evidence rules instead of adding page-local logic.

## Architecture Patterns

- Public surface objects (`LandingPage`, `Form`, `CTA`, `ConversionEvent`) separate from launch-program objects.
- Conversion writes to CDP, CRM, analytics, and task systems.
- Launches modeled as readiness-driven programs with rollback posture.
- Experiments attached to public surfaces and launches, not a parallel experiment world.

## Don't Hand-Roll

- Static form pages that never emit governed conversion events.
- Launch checklists in markdown or notes as the only launch system-of-record.
- Pricing and offer logic duplicated in page components.

## Common Pitfalls

- Treating signup as proof that a landing-page engine already exists.
- Building page-builder UX before defining page/form/CTA contracts.
- Letting launches mutate multiple channels without one program object and rollback trail.

## Codebase Findings

### Files inspected

- `app/(marketing)/signup/page.tsx`
- `api/tracking/ingest.js`
- `lib/markos/contracts/schema.ts`

### Existing support

- Public marketing routes already exist and the signup surface already handles anti-bot, rate-limit, and success/error states.
- Tracking ingest already accepts public and protected events and normalizes them into CRM activity.
- The repo already has lightweight `Segment` and `Campaign` schemas that can inform initial conversion/launch contracts.

### Missing capabilities

- No landing-page object model or builder/runtime.
- No generalized form schema or conversion-event contract beyond signup.
- No launch-program objects, readiness checks, dependency graph, or rollback posture.
- No native experimentation registry for conversion surfaces.
- No unified public-surface governance for pricing, claims, evidence, and approvals.

## Recommended Implementation Path

1. Start with contracts, not builders: `LandingPage`, `FormDefinition`, `CTA`, `ConversionEvent`, `LaunchProgram`, and `LaunchReadinessCheck`.
2. Reuse current public-route patterns for the first concrete flows instead of inventing a generic builder immediately.
3. Make every conversion event write to CDP, CRM, analytics, and tasks by default.
4. Treat launches as program objects that coordinate existing channel engines, not as a channel engine themselves.
5. Add experimentation as a governed attachment to pages/forms/launches, not as a disconnected registry.

## Tests Implied

- Public-surface validation and conversion-writeback tests.
- Pricing/claims/evidence gate tests on public copy.
- Launch readiness and rollback tests.
- Browser tests for public form submit, operator launch approval, and blocked rollout cases.
- Visual tests for public page states and launch cockpit warnings.

## Research Decisions

- The first slice should not be a full builder.
- Conversion and launch should be one phase because launch programs need native conversion surfaces and vice versa.
- Rollback and pricing/evidence safety are first-order design constraints, not polish work.
