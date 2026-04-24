# Phase 224 Research - Conversion and Launch Workspace

## Primary research question

What is the smallest conversion-and-launch substrate MarkOS can ship natively — covering landing pages, forms, CTAs, conversion events, launch briefs, readiness gates, and rollback posture — without breaking the existing public signup flow, tracking ingest, Linear launch checklist, or Pricing Engine contracts doc 23 and doc 26 demand?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Conversion funnel | What public pages, forms, and signup flows already exist that a native Conversion Engine must reuse rather than replace? | Inventory of marketing routes, signup surface, and backend onboarding handlers |
| Conversion events | How are conversion-adjacent events (signup, tracking, identify, redirect) currently ingested and tied to CRM/identity? | Event taxonomy gap vs doc 23 `ConversionEvent` |
| Launch gate | Where is the current "go/no-go" enforcement — Linear template, MCP pipeline, or ad hoc? | Map of implicit launch gates + missing `LaunchGate` object |
| Pricing-at-launch | How does Pricing Engine doctrine reach a launch surface today, and what gap does a `LaunchPlan` need to close? | Placeholder + adapter contract sketch |
| Campaign kickoff | Does a `Campaign` or `LaunchProgram` object model exist beyond the lightweight schema type? | Contract gap map vs doc 26 §Part 1 |
| Experimentation | Any experiment registry on conversion surfaces today? | Confirm GAP + scope for later slice |
| Event attribution | Do conversion events carry surface/page/campaign context on writeback? | Attribution coverage gap |

## Sources to inspect

Conversion domain:
- `app/(marketing)/signup/page.tsx`
- `app/(marketing)/integrations/claude/page.tsx`
- `app/(marketing)/docs/[[...slug]]/page.tsx`
- `api/tracking/ingest.js`
- `api/tracking/identify.js`
- `api/tracking/redirect.js`
- `onboarding/backend/server.cjs`
- `onboarding/backend/write-mir.cjs`
- `lib/markos/contracts/schema.ts`
- `supabase/migrations/83_markos_unverified_signups.sql`

Launch domain:
- `lib/markos/mcp/pipeline.cjs`
- `.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md`
- `obsidian/brain/Pricing Engine Canon.md`

GAPs (searched, not present):
- `app/(markos)/onboarding/**/*.tsx` — **GAP**, no protected onboarding funnel surface.
- `app/(markos)/launch/**/*.tsx` — **GAP**, no native launch cockpit.
- `lib/markos/onboarding/**/*.ts` — **GAP**, no conversion-flow helper library.
- `lib/markos/campaigns/**/*.ts` — **GAP**, no campaign/launch runtime code beyond the schema type.

## Required research output

- Current-code support map across conversion and launch domains.
- Concrete gap list anchored to doc 23 and doc 26 object models.
- Proposed minimum contract set (`ConversionEvent`, `LaunchPlan`, `LaunchGate`, `LaunchRunbook`).
- Migration order that keeps signup, tracking, and Pricing Engine contracts intact.
- Risks: public-surface regressions, pricing/claim leakage, launch-rollback gaps.
- Tests implied per `V4.0.0-TESTING-ENVIRONMENT-PLAN` and `V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX`.

## Codebase Research Addendum - 2026-04-23

- `app/(marketing)/signup/page.tsx` — client-side signup form with BotID gate, rate-limit copy, OTP buffer states. Conversion-relevant: the only live lead-capture surface. Gap vs doc 23: no `ConversionPage`/`ConversionForm` contract, no `objective`/`audience_id`/`experiment_set_id` fields, no governed block composition.
- `app/(marketing)/integrations/claude/page.tsx` — static marketplace landing page with `Metadata`, voice-score test, and a hardcoded tool list. Conversion-relevant: canonical example of a "landing page" today. Gap: no `page_type`, no `pricing_context_id`, no `evidence_pack_id`, no publish/approval state — it is a hand-rolled Next.js route, not a governed surface.
- `app/(marketing)/docs/[[...slug]]/page.tsx` — catch-all docs route under marketing segment. Conversion-relevant: shows the marketing router scope; not a conversion surface itself. Gap: confirms no page-builder runtime exists.
- `api/tracking/ingest.js` — normalizes web_activity + agent_event families and writes them as CRM activity. Conversion-relevant: already the natural seam for `ConversionEvent` emission. Gap: event families are hard-coded and onboarding-centric; no `surface_id`/`form_id`/`experiment_variant_id` envelope, no launch-context tagging.
- `api/tracking/identify.js` — identity stitch handler scoring `anonymous_identity_id` against a known CRM record. Conversion-relevant: identity binding on conversion. Gap vs doc 23 §Part 2: no automatic link between form submission and identity-stitch call — the conversion form never invokes this path.
- `api/tracking/redirect.js` — preserves UTM/attribution params through a redirect and logs activity. Conversion-relevant: the current attribution seam. Gap: no link to a `ConversionExperiment` or variant id; attribution tracks parameters, not surfaces.
- `onboarding/backend/server.cjs` — local Node HTTP server exposing `/submit`, `/approve`, `/regenerate`, and literacy/importer routes. Conversion-relevant: the post-signup conversion funnel today. Gap vs doc 26: approve/submit flow is operator-local, not a governed launch program; no surface tracker, no readiness checks, no rollback posture.
- `onboarding/backend/write-mir.cjs` — persists approved drafts into `.markos-local/MIR/` and stamps `.planning/STATE.md`. Conversion-relevant: post-conversion state population. Gap: no `ConversionEvent` emission on approve, no CRM/CDP writeback beyond local vault — the approval step is blind to commercial memory.
- `lib/markos/contracts/schema.ts` — declares `Segment` and `Campaign` types plus `PublishState = 'draft' | 'review' | 'published'`. Conversion/launch-relevant: the only existing contract shaped like a launch-adjacent object. Gap: `Campaign` has no surface list, no readiness, no pricing context, no rollback — far from doc 26 `LaunchBrief`/`LaunchSurface`/`LaunchOutcome`.
- `supabase/migrations/83_markos_unverified_signups.sql` — `markos_unverified_signups` buffer, IP-keyed rate-limit, per-email throttle, RLS-locked to service role. Conversion-relevant: the signup-conversion storage of record. Gap: no generalized `conversion_events` or `conversion_forms` tables; schema is signup-specific.
- `lib/markos/mcp/pipeline.cjs` — 10-step MCP middleware (auth → rate_limit → tool_lookup → validate_input → free_tier → approval → cost → invoke → validate_output → trueup). Launch-relevant: the only governed mutation gate in the repo. Gap: no launch-aware gate — `approval` is per-tool-call, not per-launch; no `LaunchGate` concept, no readiness dependency graph.
- `.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` — Linear issue template encoding Gate 1 + Gate 2 MIR gates and 7-dimension verification. Launch-relevant: the de facto launch runbook today. Gap: lives in Linear tickets and templates, not as a first-class `LaunchRunbook` object; no programmatic readiness evaluation, no rollback hooks, no outcome capture.
- `obsidian/brain/Pricing Engine Canon.md` — canonical doctrine: no hard-coded pricing on customer-facing surfaces; use Pricing Engine output or a placeholder. Launch-relevant: any `LaunchPlan` affecting pricing must consume a `PricingRecommendation` record. Gap: no automated enforcement that a launch surface resolves pricing context before going live.

## Missing v4.2 capabilities

- No `ConversionPage` / `ConversionForm` / `CTA` / `ConversionEvent` object model.
- No structured page-block registry or governed composition runtime.
- No `LaunchBrief` / `LaunchSurface` / `LaunchPlan` / `LaunchGate` / `LaunchRunbook` / `LaunchOutcome` objects.
- No readiness board, dependency graph, or rollback posture for launches.
- No native experimentation registry for pages, forms, CTAs, or offers.
- No generalized `conversion_events` Postgres table or stream.
- No automated Pricing Engine + evidence gate on public conversion/launch surfaces.
- No downstream writeback of conversion events into CDP (Phase 221), CRM timeline (Phase 222), or owned channels (Phase 223) beyond the signup-specific path.

## Proposed contract direction

- `ConversionEvent { event_id, tenant_id, surface_id, form_id | null, experiment_variant_id | null, objective, identity_ref, pricing_context_id | null, occurred_at }`
- `LaunchPlan { launch_id, tenant_id, launch_type, objective, target_audiences, launch_date, owner_user_id, positioning_summary, pricing_context_id, evidence_pack_id, surface_ids[], readiness_check_ids[] }`
- `LaunchGate { gate_id, launch_id, gate_kind ('pricing'|'evidence'|'readiness'|'approval'), status, blocking_reasons[], evaluated_at }`
- `LaunchRunbook { runbook_id, launch_id, steps[], rollback_steps[], owner_user_id, state ('draft'|'armed'|'executed'|'rolled_back') }`
- All four written through the existing MCP pipeline and audit substrate rather than a parallel mutation path.

## Recommended adoption sequence

1. Land `ConversionEvent` first — retrofit `api/tracking/ingest.js` to emit it alongside today's CRM activity rows.
2. Extend `lib/markos/contracts/schema.ts` with `LandingPage`, `ConversionForm`, `CTA` shells mirroring doc 23 §Part 1.
3. Introduce `LaunchPlan` + `LaunchGate` before any launch UI, keeping the Linear template as the first human-facing runbook and promoting it into `LaunchRunbook` incrementally.
4. Add pricing-context and evidence-pack requirements to `LaunchGate` evaluation before publishing any launch surface.
5. Keep the marketing router as the first execution substrate; defer a generic page builder until the above contracts are stable.

## Tests implied

- Vitest: `ConversionEvent` envelope shape, tracking ingest retrofit, identity-stitch wiring on form submit, `LaunchGate` evaluator (pricing + evidence + readiness + approval branches), rollback state machine.
- Vitest: Pricing Engine placeholder enforcement on any surface tied to a `LaunchPlan.pricing_context_id` null.
- Playwright: public signup → conversion event → CRM timeline link; operator launches a plan → gate blocks on missing evidence → gate passes → surface publishes → rollback executes.
- Chromatic: marketing surface states (idle/submitting/sent/rate_limited/bot_blocked) plus launch cockpit gate-failure banner.

## Dependencies

- **Phase 221** — `ConversionEvent` needs CDP identity, consent, and audience snapshots so downstream writeback is consent-safe.
- **Phase 222** — `LaunchPlan` and conversion events must land on the CRM timeline and customer-360 records.
- **Phase 223** — launch surfaces of type `email_campaign` and `messaging_flow` must ride the owned-channel orchestration layer, not re-implement send logic.
- **Phase 205 (Pricing Engine)** — every launch/conversion surface with pricing copy must consume a `PricingRecommendation` or the `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder per Pricing Engine Canon.
- **Phase 209 (Evidence/claim safety)** — `LaunchGate` must refuse to open when launch claims are not evidence-linked.
