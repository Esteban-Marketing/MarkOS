# Phase 224: Conversion and Launch Workspace - Context

**Gathered:** 2026-04-24
**Revised:** 2026-04-25 (incorporating cross-AI review — 9 HIGH + 5 MEDIUM + 2 LOW)
**Status:** Ready for planning (post-review hardening)
**Mode:** discuss (interactive, --chain) → reviews replan

<domain>
## Phase Boundary

Phase 224 ships the native Conversion + Launch substrate for MarkOS: governed landing pages + forms + CTAs + ConversionEvent stream + native ExperimentSet on the conversion side; LaunchBrief + LaunchSurface + LaunchGate + LaunchRunbook + LaunchOutcome on the launch side. Block-based ConversionPage with SSR renderer + Next.js dynamic route + ISR cache invalidation on publish/rollback. Form engine with dynamic React renderer + identity stitch on submit + ConsentState double-gate. LaunchGate evaluator (pricing/evidence/readiness/approval) + reverse-runbook rollback + LaunchOutcome capture. Polymorphic LaunchSurface coordination across email_campaign (P223) / messaging_thread (P223) / landing_page (this phase) / social_pack / sales_enablement (P226) / partner_pack (P227) / support_pack / docs_update.

**In scope:** ConversionPage + content_blocks + ConversionForm + CTA + ConversionEvent + ConversionExperiment + ExperimentVariant + experiment_assignments + LaunchBrief + LaunchSurface + LaunchGate + LaunchRunbook + LaunchOutcome + readiness_checks + traffic-split renderer + BotID + rate-limit + honeypot + identity stitch + tag-based ISR invalidation + read-write `/v1/conversion/*` + `/v1/launches/*` API + 6 MCP tools + operator workspace evolution + Pricing Engine pre-publish gate + runtime placeholder enforcement + EvidenceMap + claim TTL gate + reverse-runbook rollback.

**Out of scope (deferred phases, not this phase):**
- Sales enablement battlecards/proof-packs/proposals — P226 (registers sales_enablement LaunchSurface type but content lives there).
- Ecosystem/partner/affiliate/community/developer-growth content — P227 (registers partner_pack LaunchSurface type but content lives there).
- Semantic attribution/journey/narrative/anomaly intelligence — P225 (consumes ConversionEvent + LaunchOutcome).
- Statistical experiment winner detection + ICE backlog + decision rules — P225.
- Owned-channel dispatch (email_campaign, messaging_thread send paths) — P223.
- CDP identity/consent/audience SOR — P221.
- CRM360 timeline/NBA — P222.
- Pricing Engine PriceTest approval — P205.
- Page builder visual UI (drag-and-drop block editor) — defer; v1 ships JSON-edited content_blocks via TemplateEditor pattern.

P224 is ADDITIVE: existing marketing routes (signup, integrations/claude, docs/[...slug]) keep working unchanged; can migrate to ConversionPage incrementally. Onboarding backend (`onboarding/backend/server.cjs`) stays as legacy; ConversionEvent emission added on approve/submit.
</domain>

<decisions>
## Implementation Decisions

### Page composition runtime
- **D-01:** Block-based ConversionPage SOR: `page_id, tenant_id, page_type ∈ {landing, signup, demo, pricing, launch, webinar, offer, thank_you, content_download, upgrade}, slug (unique per tenant), title, status ∈ {draft, pending_approval, published, archived}, objective ∈ doc 23 enum, audience_id, experiment_set_id, pricing_context_id, evidence_pack_id, content_blocks (ordered JSONB array of typed blocks), seo_meta JSONB, locale, parent_page_id (for locale variants), version, approved_by, approved_at, published_at, archived_at`. RLS on tenant_id.
- **D-02:** Block types (typed JSON shape per block, validated at write): `hero, form, cta, testimonial, pricing, faq, footer, content, image, video, comparison, signup_widget, social_proof, evidence_block, custom_html` (custom_html restricted to admin-approved markup). Block schema in `lib/markos/conversion/blocks/schema.ts` with per-block validators.
- **D-03:** Renderer in `lib/markos/conversion/render/page-renderer.ts` composes blocks at SSR time; output is React tree consumed by Next.js dynamic catch-all route under existing `app/(marketing)/` tree (NOT a new `app/(public)/` group — see D-64). Renderer enforces pricing/evidence runtime checks (D-19). Hand-rolled marketing routes (P201 signup, integrations/claude, docs) stay legacy; can migrate to ConversionPage incrementally via a `migrated_to_conversion_page=true` flag.
- **D-04:** No drag-and-drop visual page builder in v1. Operators edit `content_blocks` via JSON-mode TemplateEditor surface (mirrors P223 D-25 channel template editor pattern). Visual builder deferred.

### Form engine
- **D-05:** Generic ConversionForm SOR: `form_id, tenant_id, name, objective ∈ {contact_capture, demo_request, trial_signup, content_download, waitlist, webinar_registration, purchase, upgrade}, fields (ordered JSONB array of typed fields), variables_schema (JSON Schema for validation), evidence_bindings (per-field claim_id ref), pricing_bindings (per-field Pricing Engine ref), submit_action ∈ {create_lead, create_signup, create_demo, custom_callback}, identity_stitch_enabled (bool, default true), consent_capture_block_id (FK), thank_you_page_id (FK → ConversionPage), version, status ∈ {draft, pending_approval, published, archived}`.
- **D-06:** Field types: `email, text, phone, number, select, multi_select, checkbox, textarea, country, jurisdiction, custom_typed`. Per-field validators run server-side in submit handler. Honeypot field (D-23) auto-injected, not in fields[] array.
- **D-07:** FormRenderer (`lib/markos/conversion/forms/form-renderer.tsx`) consumes ConversionForm definition + renders dynamically. SSR-safe; client-side validation mirrors server-side via shared variables_schema. Evidence/pricing bindings resolved at render time per D-19.
- **D-08:** Identity stitch on submit (RESEARCH.md gap fix): submit handler calls existing `api/tracking/identify.js` flow first to bind anonymous_identity_id → known CRM record (matches P101 D-04 confidence-aware stitching). Stitched record gets ConsentState write per submit's consent_capture_block result.

### ConversionEvent
- **D-09:** Separate `conversion_events` table joined to `cdp_events` via shared `source_event_ref`:
  - `event_id, tenant_id, surface_id (FK → ConversionPage|ConversionForm|CTA), surface_kind ∈ {page, form, cta}, form_id (FK, nullable), experiment_variant_id (FK, nullable), objective ∈ ConversionPage.objective enum, identity_ref (anonymous_identity_id OR profile_id), pricing_context_id (FK, nullable), evidence_pack_id (FK, nullable), launch_id (FK, nullable — links event to launch), occurred_at, source_event_ref (UUID, shared with cdp_events row)`. RLS on tenant_id.
- **D-10:** Every ConversionEvent emits TWO rows in transaction (P222 D-29 fan-out pattern):
  1. `conversion_events` row (this phase).
  2. `cdp_events` envelope (P221 D-08) with `event_domain='website'|'product'`, shared `source_event_ref`.
  - Plus crm_activity row per P222 D-22 (commercial_signal mapped: lead_capture→interest, purchase→interest, upgrade→expansion, etc.).
- **D-11:** `api/tracking/ingest.js` retrofitted to emit ConversionEvent + cdp_events (replacing today's CRM-activity-only path). Existing event_family taxonomy preserved via alias mapping (P222 D-05/D-06 pattern). Public contract unchanged.

### Launch object model
- **D-12:** Full doc 26 — five tables:
  - `launch_briefs` — `launch_id, tenant_id, launch_type ∈ {feature, pricing, integration, campaign, event, beta, market_entry}, name, objective, target_audiences (audience_id[]), launch_date, owner_user_id, status ∈ {planning, pending_approval, ready, live, completed, rolled_back}, positioning_summary, pricing_context_id, evidence_pack_id, internal_readiness_checks (readiness_check_id[])`.
  - `launch_surfaces` — `surface_id, tenant_id, launch_id, surface_type ∈ doc 26 8 values, status ∈ {draft, blocked, approved, published, archived}, surface_target_kind, surface_target_id (UUID, polymorphic FK), blocking_reasons[], published_at, archived_at`.
  - `launch_gates` — `gate_id, tenant_id, launch_id, gate_kind ∈ {pricing, evidence, readiness, approval, custom}, status ∈ {pending, passing, blocking, waived}, blocking_reasons[], evidence_refs[], evaluated_at, waived_by, waived_at, waiver_reason`.
  - `launch_runbooks` — `runbook_id, tenant_id, launch_id, steps (ordered JSONB), rollback_steps (ordered JSONB), owner_user_id, state ∈ {draft, armed, executing, executed, rolling_back, rolled_back, failed}, current_step, started_at, completed_at, agentrun_id (FK)`.
  - `launch_outcomes` — `launch_id, tenant_id, period_days, reach, signups, pipeline_created, influenced_revenue, activation_lift, computed_at, narrative_summary` (P225 attribution refines later).
- **D-13:** LaunchBrief carries `internal_readiness_checks` referencing rows in `launch_readiness_checks` table: `check_id, launch_id, check_kind ∈ {legal_approved, support_ready, sales_trained, docs_published, partner_briefed, custom}, owner_user_id, due_at, status, evidence_ref, completed_at`.
- **D-14:** LaunchSurface coordination via polymorphic ref:
  - `surface_target_kind` enum maps to engine: `email_campaign` → P223 `email_campaigns`, `messaging_thread` → P223 `messaging_threads` (template-only since threads are 1:1), `messaging_flow` → P223 `lifecycle_journeys`, `landing_page` → P224 `conversion_pages`, `social_pack` → custom (this phase ships shell), `sales_enablement` → P226, `partner_pack` → P227, `support_pack` → custom shell, `docs_update` → custom shell.
  - Per-kind FK enforced via Postgres CHECK constraint + reference-validity test in repository layer.
- **D-15:** LaunchSurface.status state machine: draft → blocked (gate failed) ↔ approved (gates passing) → published → archived. Rollback transitions published → archived + emits rollback audit row.

### LaunchGate evaluator
- **D-16:** LaunchGate kinds + evaluators (`lib/markos/launches/gates/`):
  - `pricing` — checks LaunchBrief.pricing_context_id resolves to approved Pricing Engine PricingRecommendation OR all surface content uses `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder. Else status=blocking with reason.
  - `evidence` — checks LaunchBrief.evidence_pack_id has all claims with evidence_ref + freshness within TTL (P209 EvidenceMap). Else blocking.
  - `readiness` — checks all `internal_readiness_checks` for the launch are status=completed. Else blocking with list of incomplete checks.
  - `approval` — checks LaunchBrief.status≥pending_approval has approval_ref attached AND approver acted (P208 Approval Inbox + P105 approval-package). Else blocking.
  - `custom` — extension point: tenant-defined gate kind with `evaluator_module` ref. Reserved for v2.
- **D-17:** Gate evaluation triggered by: (1) LaunchSurface.status transition request to approved/published, (2) operator-invoked `/v1/launches/{id}/gates/evaluate`, (3) cron poll every 15 min for in-flight launches. Evaluation writes audit row + sets blocking_reasons.
- **D-18:** Waiver: only tenant admin role can waive a blocking gate; waiver requires `waiver_reason` text + adds row to `markos_audit_log`. Waiver is a signed audit event, not a silent override.

### Pricing safety + evidence (runtime + pre-publish)
- **D-19:** Belt-and-suspenders enforcement:
  - **Pre-publish:** LaunchGate(kind='pricing') must pass before LaunchSurface.status transitions to published. LaunchGate(kind='evidence') must pass before any surface with claims publishes.
  - **Runtime:** Page renderer + form renderer scan content_blocks/fields for `{{pricing.*}}` and `{{evidence.*}}` template variables. Each variable MUST resolve via Pricing Engine context or EvidenceMap binding OR be the literal `{{MARKOS_PRICING_ENGINE_PENDING}}` / `{{MARKOS_EVIDENCE_PENDING}}` placeholder. Unresolved variables → render-time fail-closed (return 503 with audit row).
  - **Static-text scan:** Pre-publish content classifier ships as **P224-owned greenfield** at `lib/markos/conversion/blocks/content-classifier.ts` (NOT "carry from P223" — see D-72). Scans block bodies for currency patterns + claim-shaped text not bound to evidence_pack_id; flags for approval.
- **D-20:** Approval-aware mutations: page publish, form publish, launch start, runbook execute, runbook rollback, gate waiver — all route through P208 Approval Inbox via P105 approval-package pattern using `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` (NOT the fictional `createApprovalPackage` from `copilot.ts` — see D-58).

### Experimentation
- **D-21:** ConversionExperiment SOR: `experiment_id, tenant_id, name, hypothesis, target_surface_id (FK ConversionPage|Form|CTA), audience_id, status ∈ {draft, active, paused, completed}, traffic_split JSONB ({variant_id: weight}), started_at, ended_at, planned_duration_days, decision_rule (deferred to P225 — null in v1)`.
- **D-22:** ExperimentVariant: `variant_id, experiment_id, name, content_overrides JSONB (per-block content patches), traffic_weight (0-100, sum=100), is_control (bool)`. Variant content overrides applied at render time after base block resolution.
- **D-23:** Experiment assignment in `experiment_assignments` table: `assignment_id, tenant_id, experiment_id, identity_ref (anonymous_identity_id OR profile_id), variant_id, assigned_at`. Sticky assignment per identity. Renderer reads assignment via `getExperimentAssignment(experiment_id, identity_ref)`; assigns new visitors via deterministic hash (identity → variant) respecting traffic_split. ConversionEvent.experiment_variant_id captures bucket. Hash function = SHA-256 truncated via Node stdlib `crypto.createHash('sha256').update(...).digest('hex').substring(0, 16)` (per D-70 — drops xxhash-wasm dep).
- **D-24:** Decision rules + winner detection + ICE scoring + statistical guardrails ALL deferred to P225. v1 ships native registry + assignment + bucket capture only.

### Bot + abuse posture (public forms)
- **D-25:** Vercel BotID gate before form render (carry P201 signup pattern). Failed BotID returns 403 + audit row. Tenant-configurable per ConversionForm.
- **D-26:** Tenant-configurable rate limit per ConversionForm: defaults to 10 submits per IP per 60s + 3 submits per email per 60s. Stored in ConversionForm metadata. Rate-limit failure returns 429 + audit row + dispatch_skip-style entry. **Implemented via purpose-built primitive `lib/markos/conversion/forms/rate-limit-public-form.ts` backed by `@upstash/ratelimit` (NOT a wrapper around `checkSignupRateLimit` — that primitive is signup-specific). See D-68.**
- **D-27:** Invisible honeypot field auto-injected by FormRenderer (D-07); submit handler rejects + emits silent audit row (no user-visible error). Field name HMAC-derived per-form to prevent fingerprinting.
- **D-28:** ConsentState double-gate at submit (P221 D-18 carry): submit handler creates ConsentState row (per P221 setConsentState) per consent_capture_block selections BEFORE writing ConversionEvent. Mismatch (e.g., recipient revokes before submit completes) → fail-closed. **Enforced at DB level via BEFORE INSERT trigger on conversion_events (per D-67) — app-only fail-closed is bypassable.**

### Public surface delivery + caching
- **D-29:** Next.js 16 dynamic catch-all route under existing `app/(marketing)/` tree (specifically `app/(marketing)/[[...slug]]/page.tsx` or a sibling pattern that does not collide with existing `app/(marketing)/{signup,integrations,docs}/`). NOT a new `app/(public)/` group — see D-64. Reads ConversionPage by slug + renders content_blocks via D-03 renderer.
- **D-30:** ISR + Cache Components per Vercel knowledge update: page render cached with `cacheTag(${tenant_id}:${page_id})`. Publish/rollback calls `updateTag(${tenant_id}:${page_id})` for instant invalidation. Default TTL: 5 min for high-traffic pages, 1 min for low-traffic. **On cache hit, renderer ALSO calls `assertPricingFresh(pricing_context_id)` + `assertEvidenceFresh(evidence_pack_id)` — if stale → return 503 + audit row (per D-69 — protects against `updateTag` failure mode).**
- **D-31:** SEO metadata generated from ConversionPage.seo_meta + page-level Open Graph. Sitemap.xml regenerated on publish (cron OR Next.js metadata config).
- **D-32:** Performance: render budget < 100ms p95 server-side; client-side hydration only for interactive blocks (form, cta-with-state); static blocks (hero, content) ship as RSC.

### Conversion event → downstream writeback
- **D-33:** Single fan-out emit() in `lib/markos/conversion/events/emit.ts` (mirrors P223 D-29):
  1. `conversion_events` row.
  2. `cdp_events` envelope (event_domain='website'|'product', shared source_event_ref).
  3. `crm_activity` row (source_domain='website'|'crm', commercial_signal mapped from objective).
  4. Identity stitch via `api/tracking/identify.js` if surface_kind='form' (D-08).
  5. ConsentState write via P221 setConsentState if consent_capture_block present (gated by D-67 DB trigger).
  6. Customer360 update via P222 adapter (lifecycle_stage progression: anonymous → known on form submit, known → engaged on CTA click).
  7. NBA recompute trigger (P222 D-08) for the affected Customer360 record.
  - **All P221/P222 reads are gated by `assertUpstreamReady(['P221','P222'])` per D-60. No "bridge stub" fallback (per D-59).**
- **D-34:** Fail-closed transaction: partial write → full rollback (carry RD-10 from P222). Conversion event integrity is non-negotiable for downstream attribution.

### LaunchRunbook execution + rollback
- **D-35:** LaunchRunbook.steps[] is ordered list of step objects: `{step_id, name, kind ∈ {publish_surface, dispatch_email_campaign, send_messaging, post_social, notify_team, custom}, target_ref, depends_on (step_id[]), idempotency_key, expected_duration_seconds}`. Each step is an idempotent operation.
- **D-36:** rollback_steps[] is reverse order with reverse semantics (publish_surface → archive_surface, dispatch_email_campaign → suppress_followup, send_messaging → cancel_thread, post_social → delete_post, etc.). Some steps non-reversible (e.g., dispatched broadcast email cannot be unsent) — flagged with `reversible: false`; rollback emits operator task instead of attempting reverse.
- **D-37:** Runbook execution wrapped in AgentRun (P207): `markos_agent_runs` row created, runbook.agentrun_id populated, run_type='launch_execution'. Run-level cancel/pause/resume via AgentRun semantics. **Hard-fails via `assertUpstreamReady(['P207'])` if AgentRun substrate absent (per D-60). NO bridge stub — runbook IS launch execution; soft-skip would break audit chain (D-49).**
- **D-38:** Rollback path: operator-invoked OR auto-triggered by post-launch incident. Sets runbook.state='rolling_back' → executes rollback_steps in reverse → sets state='rolled_back'. Every step writes audit row. Updates LaunchSurface.status=archived for all in-flight surfaces.

### LaunchOutcome capture
- **D-39:** Outcome computed at T+7 / T+14 / T+30 days post-launch.live transition (cron + manual trigger). Reads conversion_events + dispatch_events (P223) + crm_activity (P222) by launch_id linkage. **Calls `assertUpstreamReady(['P222','P223'])` BEFORE reading upstream tables; throws `UpstreamPhaseNotLandedError` if absent (per D-60 + D-71). No silent empty-row fallback.**
- **D-40:** v1 metrics: reach (unique surface_views), signups (form submits with objective ∈ signup-class), pipeline_created (Opportunity rows linked via launch_id), influenced_revenue (closed-won Opportunity amount × attribution-weight; v1 = first-touch, P225 refines), activation_lift (defer to P218 PLG metrics; null in v1).
- **D-41:** narrative_summary auto-generated by P209 EvidenceMap-aware claim audit; operator can override + approve. Defers full narrative intelligence to P225.

### API + MCP surface
- **D-42:** Read-write v1 API. **Convention: legacy `api/v1/{conversion,launches}/*.js` flat handlers (NOT App Router `route.ts` — see D-57). Auth wrapper: `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`.**
  - **Conversion:** GET/POST/PUT/DELETE via `api/v1/conversion/pages.js`, `api/v1/conversion/pages-publish.js`, `api/v1/conversion/pages-archive.js`, `api/v1/conversion/forms.js`, `api/v1/conversion/ctas.js`, `api/v1/conversion/events.js`, `api/v1/conversion/experiments.js`, `api/v1/public/conversion/forms-submit.js` (public unauthenticated POST).
  - **Launches:** `api/v1/launches/briefs.js`, `api/v1/launches/surfaces.js`, `api/v1/launches/gates.js`, `api/v1/launches/gates-evaluate.js`, `api/v1/launches/gates-waive.js`, `api/v1/launches/runbooks.js`, `api/v1/launches/runbooks-arm.js`, `api/v1/launches/runbooks-execute.js`, `api/v1/launches/runbooks-rollback.js`, `api/v1/launches/outcomes.js`.
  - **Public form submit endpoint** rate-limited + BotID-gated.
- **D-43:** MCP tools (6) registered in `lib/markos/mcp/tools/index.cjs` (NOT `.ts` — see D-63):
  - `publish_page` — publish a ConversionPage (validates approval state).
  - `submit_form` — submit a ConversionForm payload (server-to-server context; bypasses BotID for trusted callers).
  - `evaluate_launch_gates` — run all gates for a launch.
  - `execute_runbook` — start runbook execution.
  - `rollback_launch` — trigger rollback.
  - `get_launch_outcome` — fetch outcome for a launch.
- **D-44:** All write APIs honor approval-package pattern (D-20). High-risk: page publish + launch arm + launch execute + rollback + gate waiver.

### Operator UI surface
- **D-45:** Evolve existing operator shell + add launch + conversion workspaces (P208 single-shell rule). The repo already has an `app/(markos)/` tree — P224 adds new sub-routes; does NOT create a new top-level group. Density acknowledgment per RL1: 6 workspaces is high but tightly coupled (kept; Plan 07 has `autonomous: false` + checkpoint mitigation per Phase 226 W1 pattern).
  - **ConversionWorkspace** (`app/(markos)/conversion/page.tsx`): Pages list (kanban-by-status) + Forms list + CTAs + Experiments + ConversionEvents stream + DeliverabilityWorkspace cross-link (P223).
  - **LaunchCockpit** (`app/(markos)/launches/page.tsx`): Briefs kanban (planning→pending→ready→live→completed) + Surface board per launch + Gates panel (pricing/evidence/readiness/approval status) + Runbook viewer + Outcomes dashboard.
  - **LaunchReadinessBoard**: dependency graph of readiness_checks + LaunchGate status + countdown to launch_date.
  - **PageEditor** (JSON content_blocks editor; visual builder deferred): block list + per-block JSON editor + preview pane (renders D-03) + Pricing/Evidence binding inspector + Publish CTA (gates approval).
  - **FormEditor**: field list + variables_schema editor + identity_stitch toggle + thank_you_page link + preview.
  - **RunbookEditor**: ordered steps[] + rollback_steps[] + dependency graph + AgentRun status panel.
- **D-46:** Approval Inbox (P208) gains: page_publish, form_publish, launch_arm, launch_execute, gate_waiver, rollback entry types.
- **D-47:** Morning Brief (P208) surfaces: top-3 in-flight launches + readiness countdown + blocking gates per launch + recent ConversionEvent volume.

### Observability + operator posture
- **D-48:** Surface health audit cron: scans published ConversionPages for stale pricing_context_id (Pricing Engine record archived/superseded) + stale evidence_pack_id (claim TTL exceeded). Stale surfaces → operator task + email to owner. Optional auto-archive after grace period.
- **D-49:** Launch audit log: every status transition + gate evaluation + runbook step + rollback writes `markos_audit_log` row (P201 hash chain).
- **D-50:** Bounce/spike alerts (carry P223 D-35): conversion rate drop >2σ from 7-day baseline → operator task. Form abuse spike (BotID rate >10× baseline) → tenant-admin alert.

### Security + tenancy
- **D-51:** RLS on all new tables (`conversion_pages`, `conversion_forms`, `conversion_ctas`, `conversion_events`, `conversion_experiments`, `experiment_variants`, `experiment_assignments`, `launch_briefs`, `launch_surfaces`, `launch_gates`, `launch_runbooks`, `launch_outcomes`, `launch_readiness_checks`). Fail closed on missing tenant context (P100 D-09).
- **D-52:** Public form submit endpoint is the ONLY route accepting unauthenticated POST; rate-limited + BotID-gated + honeypot + tenant resolution via Host header (P201 BYOD pattern).
- **D-53:** Audit trail mandatory on all approvals + page publish + form publish + launch transitions + gate waivers + runbook execution + rollback + ConversionEvent emit failures. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-54:** No raw user input in pricing/evidence binding values — variables_schema enforces type + format.

### Contracts + migrations
- **D-55:** Fresh F-IDs allocated by planner (continue after P223 F-131). Expect 12-15 new contracts:
  - F-132-conversion-page-v1, F-133-conversion-form-v1, F-134-conversion-cta-v1, F-135-conversion-event-v1, F-136-conversion-experiment-v1, F-137-public-form-submit-v1, F-138-conversion-fan-out-emit-v1
  - F-139-launch-brief-v1, F-140-launch-surface-v1, F-141-launch-gate-v1, F-142-launch-runbook-v1, F-143-launch-outcome-v1, F-144-launch-readiness-check-v1
  - F-145-launch-evaluate-gates-v1 (MCP write contract)
  - F-146-launch-execute-runbook-v1 (MCP write contract)
- **D-56:** Migration slot pre-allocation (per RL2 + Phase 226 B6 lesson). Explicit slot table:
  - **121-126** (Plan 01 SOR — 10 tables across 6 migrations): conversion_pages, conversion_forms+ctas, conversion_events, conversion_experiments+variants+assignments, launch_briefs+readiness, launch_surfaces.
  - **127** (Plan 04): launch_gates table.
  - **128** (Plan 06): launch_runbooks table.
  - **129** (Plan 04): launch_outcomes table.
  - **130** (Plan 02): ingest retrofit indexes + emit_conversion_event_tx Postgres function + conversion_event_requires_consent_state trigger (D-67/RM2).
  - **131** (Plan 05): experiment hash indexes + traffic_split immutability trigger.
  - **132** (Plan 06): launch cron state tables + launch_runbook_execute trigger (D-66/RH9 part 2).
  - **133** (Plan 04): launch_readiness_required trigger (D-65/RH9 part 1) on launch_surfaces BEFORE UPDATE.
  - Migration-slot-collision regression test in Plan 07 closeout.

### Architecture-lock + upstream gating + helper-naming (added 2026-04-25 per cross-AI review)
- **D-57:** **Architecture-lock pinned at Plan 01 Task 0.5** (Wave 0.5 architecture-lock — per Phase 226 D-78 model). Forbidden patterns enforced via `test/conversion/preflight/architecture-lock.test.js` scanner that reads each `224-*-PLAN.md` body and fails on any of: `createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient`, `lookupPlugin`, `public/openapi.json`, `app/(public)`, `bridge stub`, `stub if absent`, `route.ts` (in API paths), ` from 'vitest'`, `vitest run`, `npx vitest`, `npx playwright`, `\.test\.ts` (in plan body files_modified). Allowed only in CONTEXT.md `<deferred>` doctrinal mention or D-57..D-72 narrative.
- **D-58:** **`buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68`** is the canonical approval helper. The fictional `createApprovalPackage` from `lib/markos/crm/copilot.ts` does NOT exist — verified at review time. All P224 plans use `buildApprovalPackage`. Imports: `const { buildApprovalPackage } = require('../../crm/agent-actions');` (CommonJS) OR `import { buildApprovalPackage } from '@/lib/markos/crm/agent-actions';` (TypeScript with project path alias).
- **D-59:** **`lib/markos/conversion/*` and `lib/markos/launches/*` are P224-owned greenfield**. They do not exist in the repo at planning time. Plans 01..07 create them. **`lib/markos/cdp/*` (P221), `lib/markos/crm360/*` (P222), `lib/markos/channels/*` (P223) are upstream-owned greenfield** that P224 depends on; if absent at execute time, P224 hard-fails via `assertUpstreamReady` (D-60). NO "bridge stub if absent" / "fallback path" patterns — those drift the audit chain.
- **D-60:** **Hard-fail upstream gating** via `lib/markos/conversion/preflight/upstream-gate.ts` exporting `assertUpstreamReady(phaseIds: string[])`. Required upstream phases for P224: `['P205', 'P207', 'P208', 'P209', 'P221', 'P222', 'P223']`. CLI wrapper at `scripts/preconditions/224-check-upstream.cjs`. Throws custom error class `UpstreamPhaseNotLandedError(phase, capability)` from `lib/markos/conversion/preflight/errors.ts`. Every code path that touches an upstream module calls `assertUpstreamReady` at entry.
- **D-61:** **Test runner pinned to `npm test` (Node `--test`)**. Test files use `.test.js` extension with `import { test, describe, before } from 'node:test'` + `import assert from 'node:assert/strict'`. NO vitest, NO playwright dependencies introduced (visual regression keeps `chromatic` which is already in package.json). E2E paths previously specified as Playwright are downgraded to integration-style Node `--test` against a test Supabase instance + a headless render harness (or deferred if genuinely needs browser — see deferrals).
- **D-62:** **OpenAPI bundle path is `contracts/openapi.json`** (NOT `public/openapi.json`). All plans use `contracts/openapi.json` everywhere. Build command remains `npm run openapi:build` invoking `scripts/openapi/build-openapi.cjs`.
- **D-63:** **MCP tools registered at `lib/markos/mcp/tools/index.cjs`** (NOT `.ts`). All 6 P224 MCP tools (publish_page, submit_form, evaluate_launch_gates, execute_runbook, rollback_launch, get_launch_outcome) ship as `lib/markos/mcp/tools/<name>.cjs` files; the index.cjs re-exports them.
- **D-64:** **Public landing page route lives under existing `app/(marketing)/` tree** (e.g., `app/(marketing)/[[...slug]]/page.tsx` or alongside existing `app/(marketing)/{signup,integrations,docs}/`). NO new `app/(public)/` group is created. The new operator-shell sub-routes (ConversionWorkspace, LaunchCockpit, etc.) live under the existing `app/(markos)/` tree (which already exists — see Plan 07 path verification). Route-group migration to a separate `app/(public)/` tree is deferred to a future dedicated route-group migration phase.
- **D-65:** **Launch readiness DB trigger (`133_launch_readiness_required_trigger.sql`)** — BEFORE UPDATE on `launch_surfaces` REJECTS `status='published'` if any `launch_gates` row for the same `launch_id` has `status='blocking'`. Service-role / direct-SQL writes cannot bypass app-level gate evaluator. Migration ships in Plan 04. Mirrors Phase 226 D-83/D-84 enforcement-boundary doctrine.
- **D-66:** **Launch runbook execute DB trigger (`132_launch_cron_state.sql` includes the trigger)** — BEFORE UPDATE on `launch_runbooks.state` REJECTS transition to `'executing'` if any `launch_gates` row for the same `launch_id` has `status='blocking'`. Mirrors D-65. Plan 06.
- **D-67:** **ConsentState DB trigger (in `130_ingest_retrofit_indexes.sql`)** — BEFORE INSERT on `conversion_events`, REJECTS the row if `consent_capture_block_id IS NOT NULL` AND a corresponding `consent_state` row for the same `(tenant_id, profile_id, channel)` was not written in the same transaction. Closes the soft-fail-closed → DB-fail-closed gap in D-28. Plan 02.
- **D-68:** **Public-form rate-limit primitive is purpose-built**: `lib/markos/conversion/forms/rate-limit-public-form.ts` exporting `rateLimitPublicFormSubmit(form_id, ip, email_or_null)` returning `{limited: bool, retry_after_ms: number}`. Backed by `@upstash/ratelimit` (already in package.json — verified Phase 226). Three independent buckets per submit: per-form, per-IP, per-email. NO reuse of `checkSignupRateLimit` (signup-specific).
- **D-69:** **ISR cache invalidation render-time re-validation**: page renderer on cache hit ALSO calls `assertPricingFresh(pricing_context_id)` + `assertEvidenceFresh(evidence_pack_id)` from `lib/markos/conversion/render/freshness-check.ts`. If stale → return 503 + audit row. Protects against the case where `updateTag` fails on publish/rollback and a stale page would otherwise serve until TTL. Plan 03.
- **D-70:** **Experiment hash uses SHA-256 truncated** via Node stdlib `crypto.createHash('sha256').update(...).digest('hex').substring(0, 16)`. Implementation in `lib/markos/conversion/experiments/hash.ts`. Drops xxhash-wasm dependency entirely (was missing from package.json — would have been a Plan 01 install task; not worth the dep for a hash function the stdlib provides). Plan 05.
- **D-71:** **LaunchOutcome compute fail-closed on missing P222/P223**: `computeLaunchOutcome` calls `assertUpstreamReady(['P222', 'P223'])` BEFORE reading `crm_activity` or `dispatch_events`. Throws `UpstreamPhaseNotLandedError` if absent. NO silent empty-row write that downstream P225 would consume as "0 signups, 0 pipeline" — that corrupts attribution. Plan 04.
- **D-72:** **Pricing/claim content classifier is P224-owned greenfield**: ships at `lib/markos/conversion/blocks/content-classifier.ts`. NOT "carry from P223 D-16 — extend, do not duplicate" (that pattern would have been correct only if P223 had landed; at planning time P223 has no `lib/markos/channels/templates/*` directory). Plan 03 creates the classifier from scratch with currency regex + claim-shape detection bound to evidence_pack_id. P227 (channel content) can later refactor to share via a common module if patterns converge.

### Claude's Discretion
- Module boundary under `lib/markos/conversion/*` and `lib/markos/launches/*` (separated since they're distinct engines that coordinate).
- Block schema versioning strategy (forward-compat block_type renames, deprecation warnings).
- Cron schedule for surface health audit, gate evaluation poll, outcome computation cadence.
- ISR cache TTL tuning per page_type.
- Visual page builder (drag-and-drop) — completely deferred; v1 ships JSON editing.

### Folded Todos
None — no pending todos matched Phase 224 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (precedence 1-2)
- `obsidian/work/incoming/23-CONVERSION-ENGINE.md` — informational; canonical = `obsidian/reference/*` once distilled. 7 core rules, ConversionPage + ConversionForm + CTA + ConversionEvent + ExperimentSet shapes (§Part 1-3).
- `obsidian/work/incoming/26-LAUNCH-ENGINE.md` — informational. 7 core rules, LaunchBrief + LaunchSurface + LaunchOutcome shapes (§Part 1).
- `obsidian/work/incoming/19-EMAIL-ENGINE.md` — informational; LaunchSurface(email_campaign) coordinates with P223 EmailCampaign.
- `obsidian/brain/MarkOS Canon.md` — north star.
- `obsidian/brain/Brand Stance.md` — voice/tone.
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` rule (D-19) + LaunchGate(kind='pricing').
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`.
- `obsidian/reference/Contracts Registry.md`.
- `obsidian/reference/Database Schema.md`.
- `obsidian/reference/Core Lib.md`.
- `obsidian/reference/HTTP Layer.md` — `/v1/conversion/*` + `/v1/launches/*` conventions.
- `obsidian/reference/UI Components.md`.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 224 + dep graph (205, 207, 208, 209, 221, 222, 223).
- `.planning/REQUIREMENTS.md` — CNV-01..05, LCH-01..05, PRC-01..09 (carry-forward), QA-01..15.
- `.planning/STATE.md`.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.
- `.planning/phases/224-conversion-launch-workspace/DISCUSS.md`.
- `.planning/phases/224-conversion-launch-workspace/224-RESEARCH.md` — already strong gap analysis; refresh at plan-phase to align with locked decisions.
- `.planning/phases/224-conversion-launch-workspace/224-REVIEWS.md` — cross-AI review (9 HIGH + 5 MEDIUM + 2 LOW). 2026-04-25 revision incorporates findings as D-57..D-72.

### Prior phase decisions Conversion + Launch must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-09/D-10 RLS + audit.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-04 confidence-aware identity stitching (D-08 reuses).
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package pattern (D-20 / D-58).
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — public signup BotID pattern + middleware tenant resolution (D-25/D-52).
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md` — Pricing Engine pricing_context_id consumed by LaunchGate(kind='pricing') and ConversionPage.pricing_context_id.
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun wraps runbook execution (D-37). Hard-fail per D-60 if absent.
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief + single shell (D-45/D-46/D-47).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL (D-19, D-41).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` rule + strategy/brief/draft loop integration.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-08 cdp_events envelope (D-10), D-11 ConsentState (D-28), D-18 audience double-gate, D-22 read-only API. P224 hard-fails if `lib/markos/cdp/*` absent (D-59/D-60).
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-22 cdp_events emit (D-33), D-29 fan-out pattern (D-33), Customer360 lifecycle (D-33). Hard-fail if `lib/markos/crm360/*` absent.
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — D-01 email_campaigns + D-03 messaging_threads + D-04 lifecycle_journeys (LaunchSurface polymorphic targets via D-14), D-25 channel_templates (TemplateEditor pattern reused), D-29 emit() fan-out. Hard-fail if `lib/markos/channels/*` absent.

### Existing code + test anchors
- `app/(marketing)/signup/page.tsx` — legacy signup form pattern; ConversionForm migration target (D-03).
- `app/(marketing)/integrations/claude/page.tsx` — legacy landing page pattern; ConversionPage migration target.
- `app/(marketing)/docs/[[...slug]]/page.tsx` — legacy docs route; informs catch-all routing convention (D-29 + D-64).
- `app/(markos)/` tree (existing) — operator shell; P224 adds new conversion + launches sub-routes (D-45 + D-64).
- `api/tracking/ingest.js` — retrofit target for ConversionEvent emit (D-11).
- `api/tracking/identify.js` — identity stitch reused by form submit (D-08).
- `api/tracking/redirect.js` — UTM preservation reused.
- `onboarding/backend/server.cjs` — legacy onboarding funnel; emits ConversionEvent on approve (D-11).
- `onboarding/backend/runtime-context.cjs:491` — `requireHostedSupabaseAuth` (D-42 / D-58).
- `lib/markos/contracts/schema.ts` — Segment + Campaign types stay legacy; new ConversionPage/Form/CTA in `lib/markos/conversion/contracts/`.
- `supabase/migrations/83_markos_unverified_signups.sql` — signup buffer pattern; carry into ConversionForm submit handler.
- `lib/markos/mcp/pipeline.cjs` — 10-step middleware preserves write path; new launch/conversion writes flow through it.
- `lib/markos/mcp/tools/index.cjs` — MCP tool registry (D-43 / D-63).
- `.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` — Linear template informs LaunchRunbook step shape.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221, upstream-owned greenfield, hard-fail per D-60) — ConsentState reads.
- `lib/markos/crm360/*` (P222, upstream-owned greenfield, hard-fail per D-60) — Customer360 + lifecycle progression.
- `lib/markos/channels/*` (P223, upstream-owned greenfield, hard-fail per D-60) — LaunchSurface targets (email_campaigns, messaging_threads, lifecycle_journeys).
- `lib/markos/crm/agent-actions.ts:68` — `buildApprovalPackage` (canonical approval helper per D-58).
- `markos_audit_log` (P201 hash chain).
- `contracts/openapi.json` (D-62) — bundled contract surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `app/(marketing)/signup/page.tsx` — BotID + rate-limit + OTP buffer pattern; informs ConversionForm BotID gate (D-25/D-26) but does NOT supply a drop-in primitive. P224 builds purpose-built `rate-limit-public-form.ts` (D-68).
- `api/tracking/ingest.js` — extend in D-11 to emit ConversionEvent + cdp_events alongside crm_activity.
- `api/tracking/identify.js` — reused as-is via form submit handler invoking it (D-08).
- `api/tracking/redirect.js` — UTM preservation; ConversionEvent.surface_id + experiment_variant_id captured at redirect time.
- `onboarding/backend/server.cjs` — legacy local server keeps working; emits ConversionEvent on approve via D-11 retrofit.
- `lib/markos/mcp/pipeline.cjs` — governed mutation gate consumed by all conversion + launch writes (D-20).
- `lib/markos/cdp/adapters/crm-projection.ts` (P221, upstream-owned, hard-fail per D-60) — ConsentState + AudienceSnapshot reads.
- `lib/markos/crm360/*` (P222, upstream-owned, hard-fail) — Customer360 + Opportunity reads + lifecycle progression on conversion event.
- `lib/markos/channels/*` (P223, upstream-owned, hard-fail) — LaunchSurface targets via polymorphic ref (D-14); reuse adapter for surface execution.
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` — approval-package factory (D-58 canonical).
- `lib/markos/conversion/blocks/schema.ts` (NEW, P224-owned) — typed block validators.
- `lib/markos/conversion/blocks/content-classifier.ts` (NEW, P224-owned) — pre-publish currency + claim scanner (D-72).
- `lib/markos/conversion/render/page-renderer.tsx` (NEW) — block composition runtime.
- `lib/markos/conversion/render/freshness-check.ts` (NEW) — D-69 cache-hit re-validation.
- `lib/markos/conversion/forms/form-renderer.tsx` (NEW) — dynamic form runtime.
- `lib/markos/conversion/forms/rate-limit-public-form.ts` (NEW) — D-68 purpose-built primitive.
- `lib/markos/conversion/events/emit.ts` (NEW) — single fan-out emitter (D-33).
- `lib/markos/conversion/experiments/hash.ts` (NEW) — D-70 SHA-256 truncated.
- `lib/markos/conversion/preflight/upstream-gate.ts` + `lib/markos/conversion/preflight/errors.ts` (NEW) — D-60 hard-fail gating.
- `lib/markos/launches/gates/` (NEW) — gate evaluators per kind (D-16).
- `lib/markos/launches/runbook/` (NEW) — step + rollback execution wrapped in AgentRun (D-37).
- `markos_audit_log` (P201 hash chain) — consumes all mutations.
- BotID + rate-limit (P201) — public form gate.
- Vercel Cron (P221) — surface health audit + gate evaluation poll + outcome computation.
- `@upstash/ratelimit` (already in package.json — verified Phase 226 D-90) — backs D-68 primitive.
- `chromatic` (already in package.json) — visual regression for operator UI workspaces.

### Established patterns
- Block-based composition with typed validators (NEW for v4.2; foundational for P224).
- Adapter-based provider integration (P223 base-adapter pattern).
- Polymorphic ref via `target_kind + target_id` (carry from P222 launch_surfaces precedent).
- Approval-package per high-risk mutation (P105 + P208) using `buildApprovalPackage` (D-58).
- AgentRun wraps long-running ops (P207, P221, P222, P223). Hard-fail if substrate absent (D-60).
- Vercel Queues for at-least-once fan-out (carry from P223).
- Single fan-out emit() with fail-closed transaction (P222 D-29 + P223 D-29).
- ConsentState double-gate + identity stitch (P221 + P101) — DB-trigger enforced (D-67).
- ISR + Cache Components + cacheTag/updateTag (Next.js 16 + Vercel knowledge update); render-time re-validation (D-69) backs the cache-fail mode.
- BotID + rate-limit + honeypot for public surfaces (P201 + new D-27 + purpose-built D-68 primitive).
- DB-trigger enforcement for business invariants (D-65 / D-66 / D-67 — single-writer / single-truth at the database layer; mirrors Phase 226 D-83/D-84 doctrine).
- Hard-fail upstream gating (D-60) — replaces "bridge stub if absent" soft-skip pattern.
- Architecture-lock test (D-57) — Plan 01 Task 0.5 forbidden-pattern scanner.

### Integration points
- **Upstream:** ConsentState + AudienceSnapshot + TraitSnapshot (P221), Customer360 + Opportunity + nba_records (P222), email_campaigns + messaging_threads + lifecycle_journeys (P223), AgentRun v2 (P207), Pricing Engine PricingRecommendation (P205), Approval Inbox (P208), EvidenceMap (P209). All gated by `assertUpstreamReady` (D-60).
- **Downstream P225:** consumes conversion_events + experiment_assignments + LaunchOutcome for attribution + journey + narrative + statistical winner detection.
- **Downstream P226:** consumes LaunchSurface(surface_type='sales_enablement') for proof-pack/battlecard distribution.
- **Downstream P227:** consumes LaunchSurface(surface_type='partner_pack') for partner amplification.
- **Operator (P208):** Approval Inbox + Morning Brief gain conversion + launch entry types.
- **Public:** Next.js dynamic route under `app/(marketing)/` reads ConversionPage; public POST `/api/v1/public/conversion/forms-submit` accepts form submissions (D-42 legacy `*.js` convention).
- **Pricing Engine:** every pricing-touching surface resolves via Pricing Engine OR placeholder; LaunchGate(kind='pricing') validates pre-publish; render-time re-validates on cache hit (D-69).
- **Audit:** every mutation writes `markos_audit_log`.

</code_context>

<specifics>
## Specific Ideas

- "Conversion first, publishing second" (doc 23 rule 1) — D-04 defers visual builder; v1 ships governed JSON-edit + SSR renderer focused on conversion outcomes.
- "Forms are part of identity and CRM orchestration, not isolated embeds" (doc 23 rule 4) — D-08 identity stitch on submit; D-33 form submit cascades to Customer360 lifecycle progression.
- "Pages, offers, and CTAs must consume governed pricing and claims" (doc 23 rule 5) — D-19 belt+suspenders enforcement (pre-publish + runtime); D-69 render-time re-validation on cache hit.
- "Experiments must be native, attributable, and reversible" (doc 23 rule 6) — D-21..D-24 ExperimentSet + ExperimentVariant + sticky assignment + reversal via experiment.status transition.
- "Every launch has one canonical brief" (doc 26 rule 1) — D-12 LaunchBrief is SOR; LaunchSurface refs back via launch_id FK.
- "Internal readiness is part of launch quality" (doc 26 rule 4) — D-13 launch_readiness_checks first-class; LaunchGate(kind='readiness') blocks publish until all checks completed; DB-trigger enforces (D-65).
- "Launches must be measurable from announcement to revenue impact" (doc 26 rule 5) — D-39/D-40 LaunchOutcome at T+7/T+14/T+30 reading conversion_events + dispatch_events + crm_activity by launch_id linkage; hard-fail if upstream absent (D-71).
- "Performance, SEO, and accessibility are built in" (doc 23 rule 7) — D-32 render budget + RSC for static blocks + Next.js metadata for SEO + ARIA in block components.
- Linear `MARKOS-ITM-OPS-01-campaign-launch.md` template informs LaunchRunbook.steps[] shape — Gate 1 + Gate 2 patterns map to LaunchGate kinds (pricing/evidence/readiness/approval).
- Onboarding backend keeps working unchanged — ConversionEvent emission is additive on `/approve` and `/submit` endpoints.

</specifics>

<deferred>
## Deferred Ideas

### For future commercial-engine phases
- Semantic attribution + customer journey + narrative intelligence + anomaly detection → P225.
- Statistical winner detection + ICE backlog + decision rules + experiment guardrails → P225.
- Battlecards + proof packs + objection intelligence + proposals → P226 (registers sales_enablement LaunchSurface).
- Ecosystem + partner + affiliate + referral + community + developer-growth content → P227 (registers partner_pack LaunchSurface).
- Commercial OS integration closure → P228.

### For future conversion enrichment
- Visual drag-and-drop page builder (Figma-like block editor) — defer; v1 ships JSON edit + preview.
- A/B/n multivariate testing beyond traffic_split (e.g., Bayesian Multi-Armed Bandits) — P225 advanced experiments.
- Personalization beyond audience-based variants (e.g., ML-driven content selection) — P225 + AgentRun.
- Server-side personalization at edge (geographic IP, locale routing beyond ISR) — defer.
- Webhook-based form integrations (Zapier, Make, custom callbacks) — defer to plugin marketplace post-P227.
- Multi-step / progressive profiling forms (form chains across visits) — defer to v2.
- Native chatbot / live chat conversion surface — out of v1 scope; may overlap with P226 sales enablement.
- Video / interactive demo embed governance — defer.
- Rich media block types (carousel, accordion, tabs interactive) — v2 block schema extension.

### For future launch enrichment
- Cross-tenant launch templates (industry packs) → P218/P227.
- Auto-detected launch readiness via integration health (P210 connector signals) → P226 sales enablement integration.
- Launch retrospective AI + post-launch narrative auto-generation → P225.
- Multi-region launch coordination (timezone-aware sequencing) → P228.
- Launch analytics dashboard with revenue attribution beyond first-touch → P225.
- Pre-launch competitor scan integration → P226 sales enablement.
- Partner-coordinated launches (cross-tenant amplification) → P227.

### Architecture / tooling deferrals (added 2026-04-25 per cross-AI review)
- **`app/(public)/` route-group migration** — current marketing routes live under `app/(marketing)/`. Creating a separate `app/(public)/` group is a breaking refactor of existing user-visible URLs. Deferred to a dedicated route-group migration phase (likely P229+ infrastructure). P224 D-64 keeps the new dynamic catch-all under `app/(marketing)/` to avoid double scope.
- **`app/(markos)/` operator-shell tree** — already exists in repo; P224 D-45 extends it with `app/(markos)/conversion/` and `app/(markos)/launches/` sub-routes. NOT a new top-level group.
- **App Router migration of `api/` → `api/v1/.../route.ts`** — repo uses legacy flat `api/*.js`. Converting to App Router is a breaking refactor with no user-visible benefit at P224. Deferred to a dedicated API-style migration phase. P224 D-42 ships everything as legacy `api/v1/{conversion,launches}/*.js`.
- **vitest + playwright + supabase-types + openapi-generate toolchain** — not in package.json. Adding them is a separate testing-environment phase. P224 D-61 pins to `npm test` (Node `--test`) + chromatic (already installed) for visual regression. If a future phase needs full browser E2E or vitest semantics, add as explicit Plan 01 dependency-install task with version pinning + script registration.
- **xxhash-wasm dependency** — not in package.json. P224 D-70 picks SHA-256 truncated (Node stdlib `crypto`) to avoid the install. If a future phase has a hot-path hash that benefits from SIMD, add xxhash-wasm explicitly.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 224 scope.

</deferred>

---

*Phase: 224-conversion-launch-workspace*
*Context gathered: 2026-04-24*
*Revised: 2026-04-25 — incorporating cross-AI review (9 HIGH + 5 MEDIUM + 2 LOW) as D-57..D-72 + 5 deferrals*
