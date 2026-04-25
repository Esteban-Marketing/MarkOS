# Phase 224: Conversion and Launch Workspace - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

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
- **D-03:** Renderer in `lib/markos/conversion/render/page-renderer.ts` composes blocks at SSR time; output is React tree consumed by Next.js dynamic catch-all route `app/(public)/[...slug]/page.tsx`. Renderer enforces pricing/evidence runtime checks (D-19). Hand-rolled marketing routes (P201 signup, integrations/claude, docs) stay legacy; can migrate to ConversionPage incrementally via a `migrated_to_conversion_page=true` flag.
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
  - **Static-text scan:** Pre-publish content classifier (carry from P223 D-16) scans block bodies for currency patterns + claim-shaped text not bound to evidence_pack_id; flags for approval.
- **D-20:** Approval-aware mutations: page publish, form publish, launch start, runbook execute, runbook rollback, gate waiver — all route through P208 Approval Inbox via P105 approval-package pattern.

### Experimentation
- **D-21:** ConversionExperiment SOR: `experiment_id, tenant_id, name, hypothesis, target_surface_id (FK ConversionPage|Form|CTA), audience_id, status ∈ {draft, active, paused, completed}, traffic_split JSONB ({variant_id: weight}), started_at, ended_at, planned_duration_days, decision_rule (deferred to P225 — null in v1)`.
- **D-22:** ExperimentVariant: `variant_id, experiment_id, name, content_overrides JSONB (per-block content patches), traffic_weight (0-100, sum=100), is_control (bool)`. Variant content overrides applied at render time after base block resolution.
- **D-23:** Experiment assignment in `experiment_assignments` table: `assignment_id, tenant_id, experiment_id, identity_ref (anonymous_identity_id OR profile_id), variant_id, assigned_at`. Sticky assignment per identity. Renderer reads assignment via `getExperimentAssignment(experiment_id, identity_ref)`; assigns new visitors via deterministic hash (identity → variant) respecting traffic_split. ConversionEvent.experiment_variant_id captures bucket.
- **D-24:** Decision rules + winner detection + ICE scoring + statistical guardrails ALL deferred to P225. v1 ships native registry + assignment + bucket capture only.

### Bot + abuse posture (public forms)
- **D-25:** Vercel BotID gate before form render (carry P201 signup pattern). Failed BotID returns 403 + audit row. Tenant-configurable per ConversionForm.
- **D-26:** Tenant-configurable rate limit per ConversionForm: defaults to 10 submits per IP per 60s + 3 submits per email per 60s. Stored in ConversionForm metadata. Rate-limit failure returns 429 + audit row + dispatch_skip-style entry.
- **D-27:** Invisible honeypot field auto-injected by FormRenderer (D-07); submit handler rejects + emits silent audit row (no user-visible error).
- **D-28:** ConsentState double-gate at submit (P221 D-18 carry): submit handler creates ConsentState row (per P221 setConsentState) per consent_capture_block selections BEFORE writing ConversionEvent. Mismatch (e.g., recipient revokes before submit completes) → fail-closed.

### Public surface delivery + caching
- **D-29:** Next.js 16 dynamic catch-all route `app/(public)/[...slug]/page.tsx` reads ConversionPage by slug + renders content_blocks via D-03 renderer.
- **D-30:** ISR + Cache Components per Vercel knowledge update: page render cached with `cacheTag(${tenant_id}:${page_id})`. Publish/rollback calls `updateTag(${tenant_id}:${page_id})` for instant invalidation. Default TTL: 5 min for high-traffic pages, 1 min for low-traffic.
- **D-31:** SEO metadata generated from ConversionPage.seo_meta + page-level Open Graph. Sitemap.xml regenerated on publish (cron OR Next.js metadata config).
- **D-32:** Performance: render budget < 100ms p95 server-side; client-side hydration only for interactive blocks (form, cta-with-state); static blocks (hero, content) ship as RSC.

### Conversion event → downstream writeback
- **D-33:** Single fan-out emit() in `lib/markos/conversion/events/emit.ts` (mirrors P223 D-29):
  1. `conversion_events` row.
  2. `cdp_events` envelope (event_domain='website'|'product', shared source_event_ref).
  3. `crm_activity` row (source_domain='website'|'crm', commercial_signal mapped from objective).
  4. Identity stitch via `api/tracking/identify.js` if surface_kind='form' (D-08).
  5. ConsentState write via P221 setConsentState if consent_capture_block present.
  6. Customer360 update via P222 adapter (lifecycle_stage progression: anonymous → known on form submit, known → engaged on CTA click).
  7. NBA recompute trigger (P222 D-08) for the affected Customer360 record.
- **D-34:** Fail-closed transaction: partial write → full rollback (carry RD-10 from P222). Conversion event integrity is non-negotiable for downstream attribution.

### LaunchRunbook execution + rollback
- **D-35:** LaunchRunbook.steps[] is ordered list of step objects: `{step_id, name, kind ∈ {publish_surface, dispatch_email_campaign, send_messaging, post_social, notify_team, custom}, target_ref, depends_on (step_id[]), idempotency_key, expected_duration_seconds}`. Each step is an idempotent operation.
- **D-36:** rollback_steps[] is reverse order with reverse semantics (publish_surface → archive_surface, dispatch_email_campaign → suppress_followup, send_messaging → cancel_thread, post_social → delete_post, etc.). Some steps non-reversible (e.g., dispatched broadcast email cannot be unsent) — flagged with `reversible: false`; rollback emits operator task instead of attempting reverse.
- **D-37:** Runbook execution wrapped in AgentRun (P207): `markos_agent_runs` row created, runbook.agentrun_id populated, run_type='launch_execution'. Run-level cancel/pause/resume via AgentRun semantics. Bridge stub if P207 absent (carry P221 D-15 pattern).
- **D-38:** Rollback path: operator-invoked OR auto-triggered by post-launch incident. Sets runbook.state='rolling_back' → executes rollback_steps in reverse → sets state='rolled_back'. Every step writes audit row. Updates LaunchSurface.status=archived for all in-flight surfaces.

### LaunchOutcome capture
- **D-39:** Outcome computed at T+7 / T+14 / T+30 days post-launch.live transition (cron + manual trigger). Reads conversion_events + dispatch_events (P223) + crm_activity (P222) by launch_id linkage.
- **D-40:** v1 metrics: reach (unique surface_views), signups (form submits with objective ∈ signup-class), pipeline_created (Opportunity rows linked via launch_id), influenced_revenue (closed-won Opportunity amount × attribution-weight; v1 = first-touch, P225 refines), activation_lift (defer to P218 PLG metrics; null in v1).
- **D-41:** narrative_summary auto-generated by P209 EvidenceMap-aware claim audit; operator can override + approve. Defers full narrative intelligence to P225.

### API + MCP surface
- **D-42:** Read-write v1 API:
  - **Conversion:** GET/POST/PUT/DELETE `/v1/conversion/pages`, `/v1/conversion/pages/{id}/{publish|archive}`, GET/POST `/v1/conversion/forms`, GET/POST `/v1/conversion/ctas`, GET `/v1/conversion/events`, GET/POST `/v1/conversion/experiments`, POST `/v1/conversion/forms/{id}/submit` (public).
  - **Launches:** GET/POST `/v1/launches/briefs`, GET/POST `/v1/launches/surfaces`, GET/POST `/v1/launches/gates`, POST `/v1/launches/{id}/gates/evaluate`, POST `/v1/launches/{id}/gates/{gate_id}/waive`, GET/POST `/v1/launches/runbooks`, POST `/v1/launches/{id}/runbooks/{runbook_id}/{arm|execute|rollback}`, GET `/v1/launches/{id}/outcomes`.
  - **Public form submit endpoint** rate-limited + BotID-gated.
- **D-43:** MCP tools (6):
  - `publish_page` — publish a ConversionPage (validates approval state).
  - `submit_form` — submit a ConversionForm payload (server-to-server context; bypasses BotID for trusted callers).
  - `evaluate_launch_gates` — run all gates for a launch.
  - `execute_runbook` — start runbook execution.
  - `rollback_launch` — trigger rollback.
  - `get_launch_outcome` — fetch outcome for a launch.
- **D-44:** All write APIs honor approval-package pattern (D-20). High-risk: page publish + launch arm + launch execute + rollback + gate waiver.

### Operator UI surface
- **D-45:** Evolve existing operator shell + add launch + conversion workspaces (P208 single-shell rule):
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
  - F-xxx-conversion-page-v1, F-xxx-conversion-form-v1, F-xxx-conversion-cta-v1, F-xxx-conversion-event-v1, F-xxx-conversion-experiment-v1, F-xxx-conversion-experiment-variant-v1
  - F-xxx-launch-brief-v1, F-xxx-launch-surface-v1, F-xxx-launch-gate-v1, F-xxx-launch-runbook-v1, F-xxx-launch-outcome-v1, F-xxx-launch-readiness-check-v1
  - F-xxx-public-form-submit (write contract for public endpoint)
  - F-xxx-launch-evaluate-gates (MCP write contract)
  - F-xxx-launch-execute-runbook (MCP write contract)
- **D-56:** New migrations allocated by planner (continue after P223 migration 120). Expect 10-13:
  - 13 new tables + extensions to `cdp_events` (no schema change; just new event_domain values supported) + retrofit migration for `api/tracking/ingest.js` to emit ConversionEvent + indexes for hot query paths.

### Claude's Discretion
- Module boundary under `lib/markos/conversion/*` and `lib/markos/launches/*` (separated since they're distinct engines that coordinate).
- Block schema versioning strategy (forward-compat block_type renames, deprecation warnings).
- Experiment hash function for variant assignment (recommend xxhash3 for speed; fallback SHA-256 truncated).
- Cron schedule for surface health audit, gate evaluation poll, outcome computation cadence.
- ContentClassifier extension to handle pricing patterns in ConversionPage block bodies (extends P223 classifier).
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

### Prior phase decisions Conversion + Launch must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-09/D-10 RLS + audit.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-04 confidence-aware identity stitching (D-08 reuses).
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — approval-package pattern (D-20).
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — public signup BotID pattern + middleware tenant resolution (D-25/D-52).
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md` — Pricing Engine pricing_context_id consumed by LaunchGate(kind='pricing') and ConversionPage.pricing_context_id.
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun wraps runbook execution (D-37).
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief + single shell (D-45/D-46/D-47).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL (D-19, D-41).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` rule + strategy/brief/draft loop integration.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-08 cdp_events envelope (D-10), D-11 ConsentState (D-28), D-18 audience double-gate, D-22 read-only API.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-22 cdp_events emit (D-33), D-29 fan-out pattern (D-33), Customer360 lifecycle (D-33).
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — D-01 email_campaigns + D-03 messaging_threads + D-04 lifecycle_journeys (LaunchSurface polymorphic targets via D-14), D-25 channel_templates (TemplateEditor pattern reused), D-29 emit() fan-out.

### Existing code + test anchors
- `app/(marketing)/signup/page.tsx` — legacy signup form pattern; ConversionForm migration target (D-03).
- `app/(marketing)/integrations/claude/page.tsx` — legacy landing page pattern; ConversionPage migration target.
- `app/(marketing)/docs/[[...slug]]/page.tsx` — legacy docs route; informs catch-all routing convention (D-29).
- `api/tracking/ingest.js` — retrofit target for ConversionEvent emit (D-11).
- `api/tracking/identify.js` — identity stitch reused by form submit (D-08).
- `api/tracking/redirect.js` — UTM preservation reused.
- `onboarding/backend/server.cjs` — legacy onboarding funnel; emits ConversionEvent on approve (D-11).
- `lib/markos/contracts/schema.ts` — Segment + Campaign types stay legacy; new ConversionPage/Form/CTA in `lib/markos/conversion/contracts/`.
- `supabase/migrations/83_markos_unverified_signups.sql` — signup buffer pattern; carry into ConversionForm submit handler.
- `lib/markos/mcp/pipeline.cjs` — 10-step middleware preserves write path; new launch/conversion writes flow through it.
- `.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` — Linear template informs LaunchRunbook step shape.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState reads.
- `lib/markos/crm360/*` (P222) — Customer360 + lifecycle progression.
- `lib/markos/channels/*` (P223) — LaunchSurface targets (email_campaigns, messaging_threads, lifecycle_journeys).
- `lib/markos/crm/copilot.ts::createApprovalPackage` — approval pattern (D-20).
- `markos_audit_log` (P201 hash chain).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `app/(marketing)/signup/page.tsx` — BotID + rate-limit + OTP buffer pattern; carries into ConversionForm BotID gate (D-25/D-26).
- `api/tracking/ingest.js` — extend in D-11 to emit ConversionEvent + cdp_events alongside crm_activity.
- `api/tracking/identify.js` — reused as-is via form submit handler invoking it (D-08).
- `api/tracking/redirect.js` — UTM preservation; ConversionEvent.surface_id + experiment_variant_id captured at redirect time.
- `onboarding/backend/server.cjs` — legacy local server keeps working; emits ConversionEvent on approve via D-11 retrofit.
- `lib/markos/mcp/pipeline.cjs` — governed mutation gate consumed by all conversion + launch writes (D-20).
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState + AudienceSnapshot reads.
- `lib/markos/crm360/*` (P222) — Customer360 + Opportunity reads + lifecycle progression on conversion event.
- `lib/markos/channels/*` (P223) — LaunchSurface targets via polymorphic ref (D-14); reuse adapter for surface execution.
- `lib/markos/crm/copilot.ts::createApprovalPackage` — approval-package factory.
- `lib/markos/conversion/blocks/schema.ts` (NEW) — typed block validators.
- `lib/markos/conversion/render/page-renderer.ts` (NEW) — block composition runtime.
- `lib/markos/conversion/forms/form-renderer.tsx` (NEW) — dynamic form runtime.
- `lib/markos/conversion/events/emit.ts` (NEW) — single fan-out emitter (D-33).
- `lib/markos/launches/gates/` (NEW) — gate evaluators per kind (D-16).
- `lib/markos/launches/runbook/` (NEW) — step + rollback execution wrapped in AgentRun (D-37).
- `markos_audit_log` (P201 hash chain) — consumes all mutations.
- BotID + rate-limit (P201) — public form gate.
- Vercel Cron (P221) — surface health audit + gate evaluation poll + outcome computation.

### Established patterns
- Block-based composition with typed validators (NEW for v4.2; foundational for P224).
- Adapter-based provider integration (P223 base-adapter pattern).
- Polymorphic ref via `target_kind + target_id` (carry from P222 launch_surfaces precedent).
- Approval-package per high-risk mutation (P105 + P208).
- AgentRun wraps long-running ops (P207, P221, P222, P223).
- Vercel Queues for at-least-once fan-out (carry from P223).
- Single fan-out emit() with fail-closed transaction (P222 D-29 + P223 D-29).
- ConsentState double-gate + identity stitch (P221 + P101).
- ISR + Cache Components + cacheTag/updateTag (Next.js 16 + Vercel knowledge update).
- BotID + rate-limit + honeypot for public surfaces (P201 + new D-27).

### Integration points
- **Upstream:** ConsentState + AudienceSnapshot + TraitSnapshot (P221), Customer360 + Opportunity + nba_records (P222), email_campaigns + messaging_threads + lifecycle_journeys (P223), AgentRun v2 (P207), Pricing Engine PricingRecommendation (P205).
- **Downstream P225:** consumes conversion_events + experiment_assignments + LaunchOutcome for attribution + journey + narrative + statistical winner detection.
- **Downstream P226:** consumes LaunchSurface(surface_type='sales_enablement') for proof-pack/battlecard distribution.
- **Downstream P227:** consumes LaunchSurface(surface_type='partner_pack') for partner amplification.
- **Operator (P208):** Approval Inbox + Morning Brief gain conversion + launch entry types.
- **Public:** Next.js dynamic route `/[...slug]` reads ConversionPage; public POST `/v1/conversion/forms/{id}/submit` accepts form submissions.
- **Pricing Engine:** every pricing-touching surface resolves via Pricing Engine OR placeholder; LaunchGate(kind='pricing') validates pre-publish.
- **Audit:** every mutation writes `markos_audit_log`.

</code_context>

<specifics>
## Specific Ideas

- "Conversion first, publishing second" (doc 23 rule 1) — D-04 defers visual builder; v1 ships governed JSON-edit + SSR renderer focused on conversion outcomes.
- "Forms are part of identity and CRM orchestration, not isolated embeds" (doc 23 rule 4) — D-08 identity stitch on submit; D-33 form submit cascades to Customer360 lifecycle progression.
- "Pages, offers, and CTAs must consume governed pricing and claims" (doc 23 rule 5) — D-19 belt+suspenders enforcement (pre-publish + runtime).
- "Experiments must be native, attributable, and reversible" (doc 23 rule 6) — D-21..D-24 ExperimentSet + ExperimentVariant + sticky assignment + reversal via experiment.status transition.
- "Every launch has one canonical brief" (doc 26 rule 1) — D-12 LaunchBrief is SOR; LaunchSurface refs back via launch_id FK.
- "Internal readiness is part of launch quality" (doc 26 rule 4) — D-13 launch_readiness_checks first-class; LaunchGate(kind='readiness') blocks publish until all checks completed.
- "Launches must be measurable from announcement to revenue impact" (doc 26 rule 5) — D-39/D-40 LaunchOutcome at T+7/T+14/T+30 reading conversion_events + dispatch_events + crm_activity by launch_id linkage.
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

### Reviewed Todos (not folded)
None — no pending todos matched Phase 224 scope.

</deferred>

---

*Phase: 224-conversion-launch-workspace*
*Context gathered: 2026-04-24*
