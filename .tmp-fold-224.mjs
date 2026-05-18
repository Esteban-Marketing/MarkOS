// Fold UI-SPEC into 224-01..07 plans. Inserts a compact <ui_spec_fold> block
// directly before <tasks>. Idempotent: skips if <ui_spec_fold> already present.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'c:/Users/User PC/Documents/GitHub/MarkOS/.planning/phases/224-conversion-launch-workspace';

const folds = {
  '224-01-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid (5 NO_UI backend + 2 IN_SCOPE UI plans). Plan 01 = NO_UI. Architecture-lock + assertUpstreamReady + 10-of-13 SOR foundation + 10 F-IDs + block schema. Cite UI-SPEC parent_doctrine_chain + Inheritance Bindings; D-32 + D-42 + D-43 + D-45 + D-64 architecture-lock; helper canon \`buildApprovalPackage\`; assertUpstreamReady(D-60) hard-fail on P205/P207/P208/P209/P221/P222/P223. Compact fold per 222/223 pattern; AC RANGES cited (not per-AC enumeration). -->

<ui_scope>NO_UI</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter parent_doctrine_chain (lines 27-41) — 13 parent UI-SPECs (206/207/208/209/213/214/215/216/217/220/221/222/223) — D-57..D-72 architecture-lock authority chain; 213.4-VALIDATION D-08..D-15 + D-21 carry-forward.
- 224-UI-SPEC.md Plan Scope Classification table — Plan 01 row: NO_UI; primary surface = supabase/migrations/121-126 + lib/markos/conversion/preflight/{upstream-gate,errors}.ts + lib/markos/conversion/blocks/schema.ts (15 Zod validators) + lib/markos/{conversion,launches}/contracts/*.ts + scripts/preconditions/224-check-upstream.cjs + test/conversion/preflight/architecture-lock.test.js + F-132..F-136 + F-139..F-141 + F-143..F-144.
- 224-UI-SPEC.md §Cross-Surface AC ranges XC-architecture-lock + XC-hard-preflight + XC-migration-slot-pre-allocation + XC-F-ID-slot + XC-RLS-13-tables + XC-helper-canon (verbatim D-57..D-72 enforcement; Plan 01 Task 0.5 owns the detector).
- 224-UI-SPEC.md §Sensitive Credential UI Binding (Layer 6 carries verbatim from 215; PII inheritance from 216) — Plan 01 ships SOR tables; ZERO PII rendering in this plan.
- 224-UI-SPEC.md §END-OF-v4.2.0-Wave-3 chip count baseline = 36 entering 224 (post-223); 224 extends to 42 chips with 6 NEW handoff_kind literals (37th-42nd) wired in plans 03/04/06/07. Plan 01 ships ZERO new chips — only the substrate the chips later bind to.
</ui_spec_block_reference>

<cross_cutting_carry_forward>
- **Architecture-lock D-57 (carry from 217/221/222/223):** legacy api/*.js (NOT App Router app/api/.../route.ts); requireHostedSupabaseAuth from onboarding/backend/runtime-context.cjs:491 (NOT requireSupabaseAuth which does not exist); npm test (Node --test) runner; .test.js files (NOT .test.ts per D-61); contracts/openapi.json (NOT public/openapi.json per D-62); lib/markos/mcp/tools/index.cjs (NOT .ts per D-63); api/cron/*.js (NOT app/api/cron/.../route.ts); NO app/(public)/ (per D-64 — route-group migration deferred); NO app/(markos)/ AS NEW FILE PATH except 2 PERMITTED carve-outs (conversion/ + launches/) shipped in Plan 07.
- **Helper canon D-58 (canonical):** \`buildApprovalPackage\` from \`lib/markos/crm/agent-actions.ts:68\` — NEVER \`createApprovalPackage\` (verified non-existent in codebase per 224-REVIEWS.md HIGH-1). Architecture-lock detector test (Task 0.5) scans all 224-*-PLAN.md for forbidden tokens.
- **D-59 P224-owned greenfield map:** lib/markos/conversion/* + lib/markos/launches/* trees are created NEW by P224. \`lib/markos/cdp/*\` (P221) + \`lib/markos/crm360/*\` (P222) + \`lib/markos/channels/*\` (P223) are upstream-owned greenfield; P224 hard-fails via assertUpstreamReady (D-60) if absent. NO "bridge stub if absent" / "fallback path" / "stub if missing" patterns (forbidden tokens).
- **D-60 hard preflight:** REQUIRED_UPSTREAM = ['P205','P207','P208','P209','P221','P222','P223']; assertUpstreamReady() throws UpstreamPhaseNotLandedError if any phase absent. CLI wrapper at scripts/preconditions/224-check-upstream.cjs.
- **D-61 axe-playwright reuse + .test.js files:** test runner is npm test (Node --test); all *.test.js files (NOT .test.ts); imports node:test + node:assert/strict; NO new vitest/playwright runtime in P224 (existing axe-playwright + chromatic devDeps preserved).
- **Migration slot table D-56 (slot-collision regression in Plan 07):** P224 owns slots 121..133 (13 migrations across 7 plans). Plan 01 owns 121-126 (6 migrations: SOR foundation); Plan 02 owns 130; Plan 04 owns 127/129/133; Plan 05 owns 131; Plan 06 owns 128/132. Closeout migration-slot-collision regression (Plan 07).
- **F-ID slot table D-55 (P224 owns F-132..F-146 = 15 contracts):** Plan 01 owns F-132/F-133/F-134/F-135/F-136 + F-139/F-140/F-141/F-143/F-144 (10 read-only stubs registered draft); F-137/F-138 owned by Plan 02; F-142 owned by Plan 06; F-145/F-146 owned by Plan 07.
- **15 block types verbatim (D-02):** hero / form / cta / testimonial / pricing / faq / footer / content / image / video / comparison / signup_widget / social_proof / evidence_block / custom_html. Block schema validators in lib/markos/conversion/blocks/schema.ts cover all 15 with Zod; admin-only enforcement on custom_html.
- **9 launch_surface polymorphic kinds verbatim (D-14):** email_campaign / messaging_thread / lifecycle_journey / conversion_page / social_pack / sales_enablement / partner_pack / support_pack / docs_update. CHECK constraint enforced in migration 126.
- **Banned-lexicon zero-match (carry from 213-04 + 216):** enforced on every public surface (8 surfaces in Plan 03 + LaunchBrief positioning + runbook step.name + LaunchOutcome narrative_summary in Plan 04/06) BEFORE any approval-package dispatch. Plan 01 ships substrate; enforcement runs at Plan 03/07.
- **D-21 server/client boundary (carry from 217-06):** lib/* tree is server-only; UI client components live under components/markos/conversion/* (Plan 03) + app/(markos)/conversion + app/(markos)/launches (Plan 07).
- **PII inheritance from 215+216+221+222:** All recipient PII (primary_email/primary_phone/company_name/display_name) consumed by downstream UI is sourced via P221 lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact. 224-01 creates SOR tables; ZERO direct PII rendering. Layer 6 enforcement applies at Plan 03 (TestimonialBlock + SocialProofBlock + EvidenceBlock + Form) + Plan 07 operator surfaces.
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 01 ships substrate consumed by 15 block components + 2 renderers + 2 form sub + 1 public route in Plan 03 + 9 operator surfaces + 2 P208 PATCHes in Plan 07. NO direct UI in Plan 01. -->
- 15 block components (B1-B15; UI-SPEC §Surface Inventory) — read content_blocks JSONB validated by Plan 01 schema.ts; all 15 D-02 block types render in Plan 03.
- page-renderer + form-renderer (UI-SPEC §Surface Inventory) — Plan 03 composes blocks via Plan 01 BlockSchemas + ConversionPage type.
- FormField + FormFieldGroup (UI-SPEC §Surface Inventory) — Plan 03 renders 11 D-06 field types from ConversionForm contract shipped here.
- public dynamic route at app/(marketing)/conversion-page/[[...slug]]/page.tsx (UI-SPEC §Plan Scope; Plan 03) — reads conversion_pages by slug from migration 121.
- ConversionWorkspace + PageEditor + FormEditor + LaunchCockpit + RunbookEditor + LaunchReadinessBoard + GatesPanel + OutcomesDashboard (9 operator surfaces; UI-SPEC §Plan Scope; Plan 07) — read 13 SOR tables from migrations 121-133.
- ApprovalInboxConversionEntries + MorningBriefLaunchesSection (2 P208 PATCHes; UI-SPEC §Plan Scope; Plan 07) — wire 6 NEW handoff_kind chips via buildApprovalPackage extension (37th-42nd chip in chain).
- Chromatic snapshot gate (UI-SPEC §future_phase_224_chromatic_baselines translation gate; ≥30 public PublicPageRender + ≥34 operator = ≥64 total snapshots; Plan 07).
- D-15 extracted-component recipes from 216 origin REUSED in Plan 03/07 surfaces: KbGroundingPanel + ClassifierChipRow + PIIRedactedField (NOT re-implemented).
- END-OF-v4.2.0-Wave-3 chip count post-224 = 42 (start = 36 entering; +6 = page_publish_approval + form_publish_approval + launch_arm_approval + launch_execute_approval + gate_waiver_approval + rollback_approval; closeout grep gate per Plan 07).
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-02-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 02 = NO_UI. emit() 7-sink fan-out + ConsentState DB trigger (D-67) + purpose-built rate-limit primitive (D-68) + public form submit handler. Cite UI-SPEC §emit() + §ConsentState double-gate. NO new UI in this plan; F-137/F-138 contracts feed downstream UI consumers. -->

<ui_scope>NO_UI</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter parent_doctrine_chain (lines 27-41) — 207 PARENT (AgentRunEventType for 'conversion_event_emit' + 'public_form_submit' + 'bot_id_block' + 'rate_limit_block' + 'honeypot_block' + 'consent_revoked_at_submit' + 'idempotency_replay' + 'consent_state_required_violation' D-67 trigger fired); 221 PARENT (ConsentState double-gate at submit + setConsentState fan-out per D-33 step 5 + cdp_events envelope D-22); 222 PARENT (Customer360 lifecycle progression + NBA recompute fan-out per D-33 step 6+7); 223 PARENT (D-29 single-emit pattern carry).
- 224-UI-SPEC.md Plan Scope Classification table — Plan 02 row: NO_UI; primary surface = supabase/migrations/130_ingest_retrofit_emit_consent_trigger.sql + lib/markos/conversion/events/{emit,identity-stitch,idempotency}.ts + lib/markos/conversion/forms/{bot-id-gate,botid-config,rate-limit-public-form,honeypot,consent-double-gate,submit-handler}.ts + api/v1/public/conversion/forms-submit.js (legacy *.js per D-42) + api/tracking/ingest.js retrofit + F-137 + F-138.
- 224-UI-SPEC.md §Cross-Surface AC range XC-emit-fan-out + XC-consent-state-trigger + XC-rate-limit-primitive + XC-public-form-submit + XC-architecture-lock + XC-helper-canon (verbatim D-33/D-34/D-67/D-68 enforcement).
- 224-UI-SPEC.md §Sensitive Credential UI Binding Layer 6 + B-9 NEW (carry from 223 D-39 + verbatim) — provider secrets (VERCEL_BOTID_TOKEN / HONEYPOT_SECRET / KV_REST_API_TOKEN for @upstash/ratelimit) NEVER in UI surface, MCP response, or audit_log payload. Plan 02 emit() writes audit rows but NEVER includes these secrets.
- 224-UI-SPEC.md §banned-lexicon enforcement — banned-lexicon zero-match validator runs on form submit-success copy + thank_you_page redirect copy BEFORE external.send dispatch (when surface emits to email_campaign downstream). CI assertion via scripts/marketing-loop/check-banned-lexicon.mjs.
</ui_spec_block_reference>

<cross_cutting_carry_forward>
- **D-33 single-writer 7-sink (carry from 222 D-29 + 223 D-29):** emit() is the SOLE writer of conversion_events; 7 sinks transactional (conversion_events / cdp_events / crm_activity / markos_audit_log via emit_conversion_event_tx Postgres function + identity-stitch + ConsentState write + Customer360 update + NBA recompute app-side). D-34 fail-closed transaction; partial write → full rollback.
- **D-67 ConsentState DB trigger (NEW per cross-AI review HIGH-7 / RM2):** BEFORE INSERT trigger on conversion_events REJECTS row when consent_capture_block_id IS NOT NULL AND no matching consent_state row in same transaction. App-only fail-closed is bypassable via service role; DB trigger closes the gap. Mirrors Phase 226 D-83/D-84 doctrine.
- **D-68 purpose-built rate-limit primitive (NEW per cross-AI review HIGH-2 / RM1):** lib/markos/conversion/forms/rate-limit-public-form.ts backed by @upstash/ratelimit (already in package.json — verified Phase 226 D-90); 3 independent buckets (per-form / per-IP / per-email); defaults 10/IP/60s + 3/email/60s. NO reuse of checkSignupRateLimit (signup-specific).
- **D-60 hard preflight:** emit() calls assertUpstreamReady(['P221','P222']) at entry; consent-double-gate calls assertUpstreamReady(['P221']); identity-stitch invokes existing api/tracking/identify.js (P101). NO bridge stubs.
- **Architecture-lock D-57 carry:** legacy api/v1/public/conversion/forms-submit.js (NOT route.ts); module.exports = async (req, res) => {...} CommonJS pattern; tenant resolution via Host header (P201 BYOD); BotID + rate-limit + honeypot + ConsentState double-gate run BEFORE emit() (D-25..D-28, D-52).
- **BotID outage fail-closed (carry from P201 D-12):** verifyBotID returns {allowed: false, decision_reason: 'botid_outage'} on Vercel BotID API 5xx + network error; never accepts traffic during outage.
- **Banned-lexicon zero-match validator (carry from 213-04 + 216):** runs on form submit-success copy + thank_you_page copy BEFORE external.send dispatch path triggers. Plan 02 ships substrate + audit hooks; Plan 03 ships actual UI rendering of submit-success.
- **PII inheritance from 215+216+221+222:** form payload contains email/phone/name; emit() does NOT log raw PII to markos_audit_log payload (only payload_hash via md5); identity_stitch resolves anonymous → known via P221 IdentityProfile. Layer 6 enforcement applies at Plan 03 form preview rendering.
- **Helper canon D-58:** any approval-aware mutation path uses buildApprovalPackage (Plan 02 does NOT create approval packages directly; it reserves payload shape for downstream consumers).
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 02 ships SUBSTRATE (emit() + form security primitives + DB trigger + F-137/F-138 contracts). NO direct UI in Plan 02. Plans 03 + 07 consume. -->
- FormBlock + SignupWidgetBlock + CtaBlock (Plan 03) — auto-inject honeypot field via honeypotFieldNameForForm() from Plan 02; submit POST → /api/v1/public/conversion/forms-submit (this plan).
- ConversionFormRenderer (Plan 03) — auto-injects honeypot via honeypotFieldNameForForm(form_id) from Plan 02; form-renderer wraps fields with FormField component.
- ConversionWorkspace ConversionEvents stream (Plan 07) — reads conversion_events written by emit() (this plan); mobile_priority=critical.
- ApprovalInboxConversionEntries (Plan 07) — wires 4 of 6 NEW handoff_kind chips (37th page_publish_approval + 38th form_publish_approval + 41st gate_waiver_approval + 42nd rollback_approval) via buildApprovalPackage extension on entry types from this plan's audit registrations.
- F-137 (public-form-submit-v1) + F-138 (conversion-fan-out-emit-v1) registered in flow-registry.json + contracts/openapi.json (D-62) — feed F-145/F-146 in Plan 07 closeout.
- AgentRun lineage chain (P207 carry) — every emit() failure writes AgentRunEventType row that ApprovalReviewPanel + Morning Brief consume in Plan 07.
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-03-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 03 = IN_SCOPE (PUBLIC) — first of 2 UI plans. 15 NEW block components (12 RSC + 3 client islands per D-32) + 2 NEW renderers (page-renderer + form-renderer) + 2 NEW form sub-components (FormField + FormFieldGroup) + 1 NEW public route at app/(marketing)/conversion-page/[[...slug]]/page.tsx (NOT app/(public)/ per D-64) + 1 Storybook story (PublicPageRender ≥30 snapshots) + 2 NEW handoff_kind chips wired (37th page_publish_approval + 38th form_publish_approval). D-69 render-time freshness re-validation; D-72 P224-owned classifier (NOT carry from P223). Compact AC RANGE fold per 222/223 pattern. -->

<ui_scope>IN_SCOPE</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter heavy-UI hybrid mode — Plan 03 IN_SCOPE (PUBLIC); ships 15 block components + 2 renderers + 2 form sub + public route + 1 Storybook story (PublicPageRender ≥30 snapshots covering all 15 block variants × ≥2 named states each).
- 224-UI-SPEC.md §Surface Inventory B1-B15 — 15 block components: B1 HeroBlock (RSC, secondary), B2 ContentBlock (RSC, secondary), B3 PricingBlock (RSC, secondary; pricing-binding inspector + {{pricing.*}} resolution + {{MARKOS_PRICING_ENGINE_PENDING}} sentinel), B4 CtaBlock (client island, **critical**), B5 TestimonialBlock (RSC, secondary; PIIRedactedField author), B6 FaqBlock (RSC, secondary), B7 FooterBlock (RSC, secondary), B8 ImageBlock (RSC, secondary), B9 VideoBlock (RSC, secondary; playsinline + preload='none'), B10 ComparisonBlock (RSC, secondary; vanilla <table> per D-14), B11 SocialProofBlock (RSC, secondary; PIIRedactedField customer name), B12 EvidenceBlockComponent (RSC, secondary; composes <KbGroundingPanel /> from 216 D-15), B13 SignupWidgetBlock (client island, **critical**), B14 FormBlock (client island, **critical**), B15 CustomHtmlBlock (RSC + admin_approved gate + DOMPurify SSR sanitize).
- 224-UI-SPEC.md §Surface Inventory R1-R2 — 2 renderers: R1 page-renderer.tsx (SSR composer with ISR cacheTag + D-69 freshness check + D-22 variant overrides), R2 form-renderer.tsx (RSC + client island composition; auto-injects honeypot via honeypotFieldNameForForm).
- 224-UI-SPEC.md §Surface Inventory FF1-FF2 — 2 form sub-components: FF1 FormField.tsx (renders 11 D-06 field types via switch), FF2 FormFieldGroup.tsx.
- 224-UI-SPEC.md §Surface Inventory PR1 — public dynamic route at app/(marketing)/conversion-page/[[...slug]]/page.tsx + loading.tsx + app/sitemap.ts (per D-64 — NOT app/(public)/).
- 224-UI-SPEC.md §Cross-Surface AC ranges — XC-binding-resolver-runtime + XC-d69-freshness-cache-hit + XC-d72-classifier-greenfield + XC-isr-cache-tag + XC-banned-lexicon-zero-match-public + XC-pii-redacted-public + XC-architecture-lock + XC-d64-route-group + XC-d42-legacy-js (verbatim D-19/D-69/D-72/D-30/213-public-proof/D-57/D-64/D-42 enforcement).
- 224-UI-SPEC.md §D-15 Extracted Component Reuse Manifest — KbGroundingPanel REUSED in EvidenceBlockComponent block + PageEditor "Evidence binding inspector" tab + GatesPanel evidence-gate row (Plan 07); ClassifierChipRow REUSED in PageEditor "Content classifier findings" overlay + FormEditor classifier overlay (Plan 07); PIIRedactedField REUSED in PageEditor preview + TestimonialBlock + SocialProofBlock + EvidenceBlock + FormBlock confirmation. NOT re-implemented.
- 224-UI-SPEC.md §Sensitive Credential UI Binding Layer 6 + PII inheritance — every form field label/help that names a CDP-resolved identity field renders via PIIRedactedField with pii_classification ENUM 5-value taxonomy verbatim; audit-log event_type='identity_view' on every PII render; onCopy preventDefault to block clipboard exfiltration.
- 224-UI-SPEC.md §banned-lexicon enforcement — zero-match required on every block body + form field label/help + page seo_meta.title + page seo_meta.description BEFORE any approval-package dispatch (page-publish + form-publish path). 8 surfaces: PricingBlock + EvidenceBlock + Hero + Content + Comparison + Testimonial + Faq + FormBlock submit-success.
- 224-UI-SPEC.md §sentinel discipline — PricingBlock renders {{MARKOS_PRICING_ENGINE_PENDING}} (verbatim) when no PricingRecommendation FK; EvidenceBlock renders {{MARKOS_EVIDENCE_PENDING}} (verbatim) when no evidence_pack_id; binding-resolver substitutes literal placeholders without 503.
- 224-UI-SPEC.md §Approval Inbox Handoff Chain Extension — 2 NEW chips wired here: 37th page_publish_approval (api/v1/conversion/pages-publish.js path; D-72 classifier flagged → buildApprovalPackage(kind='page_publish_approval')); 38th form_publish_approval (Plan 07 ships forms-publish path; this plan ships substrate). Chip count entering 224 = 36; post-Plan 03 = 38.
</ui_spec_block_reference>

<full_surface_acceptance_criteria_fold>
<!-- 195+ ACs total fold. AC RANGES cited (NOT per-AC enumeration) per 222/223 fold pattern. Each range maps to a Surface section in UI-SPEC. -->

<surface_b1_b15_blocks ac_count="≈90 across 15 blocks">
- AC ranges B1-1..B15-N: per-block ACs covering 'use client' boundary (D-21 carry); D-08 token-only (zero hex literals in conversion-blocks.module.css); 8px-grid snap on padding/margin; mint-as-text per D-09 for inline links; .c-notice mandatory for empty/error/pending states (D-09b); .c-card--feature reserved for hero/CTA emphasis only (D-13); NO .c-table — vanilla <table> only (D-14); 213-04 public-proof boundary STRICT for all public block bodies; banned-lexicon zero-match (213.4 carry); PIIRedactedField for any CDP-resolved identity field.
- AC range B3-PricingBlock: pricing-binding inspector renders {{pricing.*}} resolved values (Money fromPricingRecommendation) XOR {{MARKOS_PRICING_ENGINE_PENDING}} sentinel verbatim; binding-resolver fail-closed on un-resolved variables (D-19); content-classifier currency_pattern flags un-bound copy (D-72 + RH8 P224-owned greenfield).
- AC range B12-EvidenceBlock: composes <KbGroundingPanel /> from 216 D-15 (top-3 sources + chunk_id chips + source_type badge + relevance_score); claim-shape regex flags un-bound claim copy (D-72); freshness check via P209 EvidenceMap; {{MARKOS_EVIDENCE_PENDING}} sentinel verbatim when evidence_pack_id null.
- AC range B14-FormBlock + B13-SignupWidgetBlock: auto-inject honeypot via honeypotFieldNameForForm() from Plan 02 (HMAC-derived per-form name; NOT literal 'honeypot'); submit POST → /api/v1/public/conversion/forms-submit; mobile_priority=critical (touch target ≥44px; coarse pointer global per 213.2); BotID gate per D-25 + D-52; rate-limit per D-26 + D-68; consent_capture_block per D-28 + D-67 trigger.
- AC range B15-CustomHtmlBlock: admin_approved=true required → DOMPurify.sanitize(USE_PROFILES: html: true); rejects with [error] notice when admin_approved≠true; SSR pass only (no client-side HTML injection).
</surface_b1_b15_blocks>

<surface_r1_r2_renderers ac_count="≈40 across 2 renderers">
- AC range R1-page-renderer: applies cacheTag(\`tenant:\${tenant_id}:page:\${page_id}\`) per render (D-30); on EVERY render (covers cache hit) calls assertPricingFresh + assertEvidenceFresh from freshness-check.ts (D-69 / RM3 — protects against updateTag failure mode); stale → throws StalePricingError/StaleEvidenceError → 503 + audit row event_type='conversion_page_stale_render'; performance budget < 100ms p95 server-side; experiment variant overrides applied AFTER base block resolution (D-22; getOrAssignVariant call wired in Plan 05).
- AC range R2-form-renderer: 11 D-06 field types verbatim (email/text/phone/number/select/multi_select/checkbox/textarea/country/jurisdiction/custom_typed); honeypot auto-injected with display:none + autocomplete=off + tabIndex=-1; SSR-safe; client-side validation mirrors variables_schema (Zod or AJV).
</surface_r1_r2_renderers>

<surface_pr1_public_route ac_count="≈15">
- AC range PR1: dynamic catch-all at app/(marketing)/conversion-page/[[...slug]]/page.tsx (NOT app/(public)/ per D-64 / RH3); generateMetadata reads page.seo_meta + title + Open Graph; sitemap.xml regenerated on publish via app/sitemap.ts (D-31); 503 translation on StalePricingError/StaleEvidenceError; legacy marketing routes (/signup, /integrations/claude, /docs/[[...slug]]) coexist (regression test in Plan 07); generateStaticParams for top-N high-traffic pages.
</surface_pr1_public_route>

<surface_publish_archive_endpoints ac_count="≈10">
- AC range pub-arch: api/v1/conversion/pages-publish.js + pages-archive.js ship as legacy *.js (D-42 / RH4); requireHostedSupabaseAuth (D-42); buildApprovalPackage(kind='page_publish_approval') when D-72 classifier findings present (38th chip wired here); content-classifier scan pre-publish (D-72 / RH8 — currency_pattern + claim_shape regex + 3 severity literals: block / flag / info); invalidatePageCache called SYNCHRONOUSLY before 200 returned (D-30 — Pitfall 3 carry).
</surface_publish_archive_endpoints>

<cross_surface_acs ac_count="≈30">
- AC ranges XC-1..XC-30: Storybook PublicPageRender story registers ≥30 named-state stories (15 block types × ≥2 states; chromatic snapshot gate); D-08 token-only (CI fail on hex literal); D-09 mint-as-text; .c-notice + .c-card--feature + no .c-table; 'use client' on 3 interactive blocks only (D-32); SurfaceRouteContract registration for each public surface (surface_family='public_conversion_*' for telemetry); banned-lexicon zero-match on 8 public surfaces; D-15 extracted-component reuse (KbGroundingPanel + ClassifierChipRow + PIIRedactedField imports from 216-origin path); D-21 server/client boundary; D-57 architecture-lock no-op (no route.ts, no app/(public), no createApprovalPackage, no requireSupabaseAuth, no bridge stub); D-58 buildApprovalPackage exclusive; D-61 .test.js + node:test (no vitest, no playwright); D-62 contracts/openapi.json regen; D-64 route-group preserved; D-69 render-time freshness; D-72 P224-owned classifier (no lib/markos/channels/templates/* import); 37th + 38th handoff_kind chips wired via buildApprovalPackage(kind='page_publish_approval' | 'form_publish_approval').
</cross_surface_acs>
</full_surface_acceptance_criteria_fold>

<cross_cutting_carry_forward>
- **D-32 RSC + client island split:** static blocks (Hero/Content/Pricing/Testimonial/Faq/Footer/Image/Video/Comparison/SocialProof/Evidence/CustomHtml — 12 RSC) + interactive (Cta/SignupWidget/Form — 3 client islands) per performance budget < 100ms p95.
- **D-42 + D-64 architecture-lock carry:** legacy api/v1/conversion/pages-publish.js + pages-archive.js (NOT route.ts); public route under app/(marketing)/ (NOT new app/(public)/ — route-group migration deferred per CONTEXT §Deferred Ideas).
- **D-43 + D-21 server/client boundary:** 15 block components live under components/markos/conversion/blocks/* (NOT under app/(markos)/ per 217 D-43 carry); 2 form sub under components/markos/conversion/forms/*.
- **D-58 helper canon:** publish/archive paths use buildApprovalPackage from lib/markos/crm/agent-actions.ts:68 (NEVER createApprovalPackage); architecture-lock detector (Plan 01 Task 0.5) re-runs green after this plan.
- **D-69 / RM3 render-time freshness:** assertPricingFresh + assertEvidenceFresh on EVERY render (covers cache hit, protects against updateTag failure); stale → 503 + audit row.
- **D-72 / RH8 P224-owned content classifier:** lib/markos/conversion/blocks/content-classifier.ts is greenfield (NOT carry from P223 D-16 — verified P223 has no lib/markos/channels/templates/* directory); currency_pattern + claim_shape regex; 3 severity literals (block / flag / info); P227 may share via common module later.
- **PII inheritance Layer 6 (carry from 215+216+221+222):** PIIRedactedField wraps any CDP-resolved identity field in TestimonialBlock + SocialProofBlock + EvidenceBlock + FormBlock confirmation; audit-log event_type='identity_view' on every render; pii_classification ENUM 5-value taxonomy (no_pii / pseudonymous / personal / sensitive / highly_sensitive) verbatim.
- **Banned-lexicon zero-match:** 8 surfaces enforced BEFORE buildApprovalPackage dispatch on page-publish + form-publish paths.
- **Sentinel discipline:** {{MARKOS_PRICING_ENGINE_PENDING}} verbatim on PricingBlock; {{MARKOS_EVIDENCE_PENDING}} verbatim on EvidenceBlock when bindings absent.
- **D-15 extracted-component reuse:** KbGroundingPanel + ClassifierChipRow + PIIRedactedField imported from 216-origin paths; NEVER re-implemented.
- **Chromatic snapshot gate:** PublicPageRender ≥30 snapshots (15 blocks × ≥2 named states); chromatic config registers under Conversion/* path.
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 03 ships PUBLIC UI substrate. Plan 07 consumes via PageEditor/FormEditor preview + remaining publish paths. -->
- PageEditor (Plan 07) — embeds page-renderer SSR output in preview pane; surfaces ClassifierChipRow findings overlay (D-72) + KbGroundingPanel for evidence inspector + Money fromPricingRecommendation XOR PlaceholderBanner; Publish CTA opens 215 billing-correction modal recipe + buildApprovalPackage(kind='page_publish_approval') 37th chip.
- FormEditor (Plan 07) — embeds form-renderer in preview pane; ClassifierChipRow findings overlay; PIIRedactedField sample recipient render; Publish CTA → buildApprovalPackage(kind='form_publish_approval') 38th chip.
- ConversionWorkspace (Plan 07) — Pages list (kanban-by-status) + Forms list + CTAs cross-references blocks shipped here.
- Chromatic gate (Plan 07) — PublicPageRender story baseline locked here; 4 operator stories add in Plan 07 closeout.
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-04-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 04 = NO_UI. Launch governance core: launch_gates + launch_outcomes + D-65/RH9 readiness DB trigger + 4 evaluators + waiver via buildApprovalPackage + LaunchSurface state machine + polymorphic FK + D-71/RM5 LaunchOutcome fail-closed. 1 NEW handoff_kind chip wired (41st gate_waiver_approval substrate). -->

<ui_scope>NO_UI</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter parent_doctrine_chain — 207 PARENT (computeLaunchOutcome AgentRun + AgentRunEventType for 'launch_gate_evaluation' / 'launch_gate_waived' / 'launch_outcome_computed' / 'launch_readiness_required_violation' D-65 trigger fired); 208 PARENT (Approval Inbox gains gate_waiver entry; ApprovalReviewPanel handoff_kind chip 41st wired here); 209 PARENT (EvidenceMap evaluator); 222 PARENT (LaunchOutcome.pipeline_created reads opportunities via crm360 hard-fail D-71); 223 PARENT (LaunchOutcome.signups reads dispatch_events hard-fail D-71).
- 224-UI-SPEC.md Plan Scope Classification table — Plan 04 row: NO_UI; primary surface = supabase/migrations/127_launch_gates.sql + 129_launch_outcomes.sql + 133_launch_readiness_required_trigger.sql + lib/markos/launches/gates/{pricing,evidence,readiness,approval,evaluate-all,waiver}-evaluator.ts + lib/markos/launches/surfaces/{surface-coordinator,state-machine}.ts + lib/markos/launches/outcomes/{compute,metrics}.ts + 7 api/v1/launches/*.js endpoints + F-141 + F-143 graduate active.
- 224-UI-SPEC.md §Cross-Surface AC ranges — XC-d65-readiness-trigger + XC-4-gate-evaluators + XC-d71-outcome-fail-closed + XC-polymorphic-fk + XC-state-machine + XC-waiver-rbac-buildapprovalpkg + XC-architecture-lock + XC-helper-canon (verbatim D-65/D-66/D-71/D-58/D-18/D-15 enforcement).
- 224-UI-SPEC.md §Approval Inbox Handoff Chain Extension — 41st chip gate_waiver_approval wired here: gates-waive.js path → buildApprovalPackage(kind='gate_waiver_approval') with tenant-admin RBAC + waiver_reason validation; 39th + 40th chips (launch_arm_approval + launch_execute_approval) wired in Plan 06; 42nd chip (rollback_approval) wired in Plan 06/07. Chip count entering Plan 04 = 38; post-Plan 04 = 39.
- 224-UI-SPEC.md §banned-lexicon enforcement — zero-match required on LaunchBrief.positioning_summary BEFORE buildApprovalPackage(kind='launch_brief_publish'); briefs.js path runs check.
</ui_spec_block_reference>

<cross_cutting_carry_forward>
- **D-65 / RH9 readiness DB trigger:** BEFORE UPDATE on launch_surfaces REJECTS status='published' if any launch_gates row for the same launch_id has status='blocking'. Mirrors Phase 226 D-83/D-84 enforcement-boundary doctrine; service-role + alternative-API write paths cannot bypass app-level evaluator.
- **D-60 hard preflight (4 evaluators):** evaluatePricingGate calls assertUpstreamReady(['P205']); evaluateEvidenceGate calls assertUpstreamReady(['P209']); evaluateApprovalGate calls assertUpstreamReady(['P208']); evaluateReadinessGate has no upstream dep. NO 'A13 fallback posture' / 'WARNING + audit' / 'p205_adapter_unavailable' bridge stub strings (D-57 forbidden tokens).
- **D-71 / RM5 LaunchOutcome fail-closed:** computeLaunchOutcome calls assertUpstreamReady(['P222','P223']) BEFORE reading crm_activity + dispatch_events. Throws UpstreamPhaseNotLandedError if absent. NO silent empty-row fallback that downstream P225 would consume as '0 signups, 0 pipeline'.
- **D-15 LaunchSurface state machine:** draft → blocked ↔ approved → published → archived; transition to approved/published triggers gate evaluation; failed gates set status='blocked' with blocking_reasons.
- **D-14 polymorphic FK validation:** read-after-write check that surface_target_id exists in correct table per surface_target_kind (9 kinds verbatim per CHECK constraint); invalid → orphan rejected.
- **D-18 + D-58 waiver:** tenant-admin RBAC required + waiver_reason non-empty + buildApprovalPackage(kind='gate_waiver_approval') (NEVER createApprovalPackage); writes markos_audit_log event_type='gate_waived'.
- **Architecture-lock D-57 carry:** legacy api/v1/launches/*.js (NOT route.ts); requireHostedSupabaseAuth from onboarding/backend/runtime-context.cjs:491 (D-42).
- **F-ID graduation:** F-141 launch-gate-v1 + F-143 launch-outcome-v1 + F-139 launch-brief-v1 + F-140 launch-surface-v1 + F-144 launch-readiness-check-v1 graduate from draft (Plan 01) to active.
- **PII inheritance carry:** LaunchBrief.positioning_summary + LaunchOutcome.narrative_summary subject to 213-04 public-proof boundary (Layer 6 carry); Plan 07 operator surfaces (LaunchCockpit + OutcomesDashboard + GatesPanel) consume these and apply PIIRedactedField + banned-lexicon assertions.
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 04 ships SUBSTRATE. Plan 07 consumes via LaunchCockpit + LaunchReadinessBoard + GatesPanel + OutcomesDashboard. -->
- LaunchCockpit (Plan 07) — Briefs kanban (planning→pending→ready→live→completed); reads launch_briefs (Plan 01) + launch_surfaces (Plan 01) + launch_gates (this plan).
- LaunchReadinessBoard (Plan 07) — dependency graph of launch_readiness_checks + LaunchGate status (this plan) + countdown to launch_date.
- GatesPanel (Plan 07) — pricing/evidence/readiness/approval gate row evidence_refs[] preview using <KbGroundingPanel /> from 216 D-15; per-row waive CTA opens 215 billing-correction modal recipe → buildApprovalPackage(kind='gate_waiver_approval') 41st chip.
- OutcomesDashboard (Plan 07) — reads launch_outcomes (this plan) at T+7/T+14/T+30; 5 metric tiles (reach/signups/pipeline_created/influenced_revenue/activation_lift); narrative_summary subject to banned-lexicon + PIIRedactedField.
- ApprovalInboxConversionEntries (Plan 07) — 41st handoff chip subject_type='gate_waiver' renders ApprovalReviewPanel row title "Gate waiver: {gate_kind} — {launch.name}" + reason capture (≥20 chars per 216 carry).
- F-141 + F-143 + F-139 + F-140 + F-144 active in contracts/openapi.json (D-62) consumed by Plan 07 closeout OpenAPI parity test.
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-05-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 05 = NO_UI. A/B experiments + D-70 SHA-256-truncated sticky-hash (drops xxhash-wasm dep per RM4) + traffic_split immutability post-activation (DB trigger + API guard, Pitfall 5) + experiment_variant_id capture at emit-time. ZERO new handoff_kind chips (no approval-aware surfaces in this plan). -->

<ui_scope>NO_UI</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter parent_doctrine_chain — 207 PARENT (AgentRunEventType for 'experiment_assigned' + 'experiment_traffic_split_immutable_violation' D-70 trigger fired); 222 PARENT (D-29 fan-out — emit() carries experiment_variant_id); 223 PARENT (D-29 single-emit pattern carry).
- 224-UI-SPEC.md Plan Scope Classification table — Plan 05 row: NO_UI; primary surface = supabase/migrations/131_experiment_hash_indexes.sql + lib/markos/conversion/experiments/{hash,sticky-hash,traffic-split,assignment,lifecycle}.ts + lib/markos/conversion/render/page-renderer.tsx PATCH (variant overrides wired) + 3 api/v1/conversion/experiments*.js + F-136 graduate active.
- 224-UI-SPEC.md §Cross-Surface AC ranges — XC-d70-sha256-hash-deterministic + XC-d70-no-xxhash-dep + XC-pitfall5-traffic-split-immutability + XC-experiment-variant-capture-at-emit + XC-architecture-lock + XC-helper-canon (verbatim D-70/D-22/D-23/D-24 enforcement).
- 224-UI-SPEC.md §Cross-Surface AC range — XC-future_phase_225_attribution_journey_analytics translation gate OPENED here: P225 reads experiment_assignments (this plan) + conversion_events.experiment_variant_id for statistical winner detection; v1 ships ONLY registry + assignment + bucket capture (D-24 — decision rules deferred to P225).
</ui_spec_block_reference>

<cross_cutting_carry_forward>
- **D-70 / RM4 SHA-256 truncated hash:** Node stdlib crypto.createHash('sha256').update(\`\${experiment_id}::\${identity_ref}\`).digest('hex').substring(0, 16) → parseInt mod total_weight. Drops xxhash-wasm dependency (was missing from package.json — would have required Plan 01 install task; not worth the dep for a hash function the stdlib provides). Architecture-lock detector flags 'xxhash' in this plan's source.
- **Pitfall 5 traffic_split immutability:** DB trigger experiments_traffic_split_immutable_when_active (BEFORE UPDATE) + API guard at api/v1/conversion/experiments-transition.js (returns 422 with code='traffic_split_immutable_when_active'); operator must transition to paused or completed before reweighting.
- **D-23 sticky assignment:** experiment_assignments UNIQUE (experiment_id, identity_ref) (Plan 01 migration 124) + INSERT ON CONFLICT DO NOTHING + RETURNING; first assignment per identity is sticky at DB level.
- **D-22 variant overrides at render:** page-renderer.tsx PATCH reads page.experiment_set_id, calls getOrAssignVariant for visitor's identity_ref, applies variant.content_overrides JSON patches to base block list BEFORE rendering. Plan 03 accepts variantOverrides; Plan 05 wires the call site.
- **D-23 emit-time capture:** ConversionEvent.experiment_variant_id captured at emit-time (Plan 02 emit() input already accepts the field); form-handler resolves assignment then passes experiment_variant_id to emit().
- **D-24 deferral:** decision rules + winner detection + ICE backlog ALL deferred to P225 (translation gate future_phase_225_attribution_journey_analytics opened in 224-UI-SPEC.md).
- **Architecture-lock D-57 carry:** legacy api/v1/conversion/experiments*.js (NOT route.ts); requireHostedSupabaseAuth (D-42); buildApprovalPackage on POST creates approval refs (D-58).
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 05 ships SUBSTRATE. Plan 07 consumes via ConversionWorkspace experiments tab. -->
- ConversionWorkspace (Plan 07) — Experiments tab reads conversion_experiments + experiment_variants + experiment_assignments (this plan); renders status state machine + traffic_split editor (locked when active per Pitfall 5); transition CTA via api/v1/conversion/experiments-transition.js → 422 on traffic_split mutation while active.
- page-renderer (Plan 03 PATCH applied here) — getOrAssignVariant consumed in renderConversionPage flow.
- F-136 conversion-experiment-v1 active in contracts/openapi.json (D-62) — Plan 07 OpenAPI parity test.
- P225 future translation gate consumer (deferred) — reads conversion_events.experiment_variant_id for attribution + statistical winner detection (D-24 deferral).
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-06-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 06 = NO_UI. LaunchRunbook executor + reverse-rollback + D-66/RH9 runbook execute DB trigger + AgentRun-bridged step executor (D-37) + 4 cron handlers at api/cron/*.js per D-49 + Pitfall 6 reverse-runbook rollback + ISR invalidation on rollback (Pitfall 3 carry). 2 NEW handoff_kind chips wired (39th launch_arm_approval + 40th launch_execute_approval substrate). -->

<ui_scope>NO_UI</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter parent_doctrine_chain — 207 PARENT (executeRunbook + rollbackRunbook + computeLaunchOutcome wrapped in markos_agent_runs per D-37; AgentRunEventType for 'launch_runbook_arm' / 'launch_runbook_execute' / 'launch_runbook_step_executed' / 'launch_runbook_step_skipped' / 'launch_runbook_rollback' / 'launch_runbook_rollback_step' / 'launch_runbook_execute_required_violation' D-66 trigger fired; AgentFailureClass 7 literals on cron + runbook executor failures); 208 PARENT (Approval Inbox gains 4 NEW entry types runbook_arm + runbook_execute + rollback wired here as 39th + 40th + (42nd in Plan 07) chips); 223 PARENT (LaunchSurface polymorphic publish → channel adapter dispatch via D-14 + Pitfall 3 ISR invalidation on rollback for conversion_page surfaces).
- 224-UI-SPEC.md Plan Scope Classification table — Plan 06 row: NO_UI; primary surface = supabase/migrations/128_launch_runbooks.sql + 132_launch_cron_state_and_execute_trigger.sql + lib/markos/launches/runbook/{executor,step-handlers,rollback,idempotency}.ts + lib/markos/launches/cron/{surface-health-audit,gate-evaluation-poll,outcome-computation,bounce-spike-alert}.ts + 4 api/v1/launches/runbooks*.js + 4 api/cron/launches-*.js + vercel.json PATCH + F-142 active.
- 224-UI-SPEC.md §Cross-Surface AC ranges — XC-d66-runbook-execute-trigger + XC-d37-agentrun-hard-fail + XC-pitfall6-reverse-rollback + XC-pitfall3-isr-invalidation-on-rollback + XC-4-cron-d49-paths + XC-architecture-lock + XC-helper-canon (verbatim D-66/D-37/D-49 enforcement).
- 224-UI-SPEC.md §Approval Inbox Handoff Chain Extension — 39th chip launch_arm_approval (runbooks-arm.js path → buildApprovalPackage); 40th chip launch_execute_approval (runbooks-execute.js path); SUBSTRATE wired here. 42nd chip rollback_approval substrate also wired here (runbooks-rollback.js path); UI rendering in Plan 07. Chip count entering Plan 06 = 39; post-Plan 06 = 42 (substrate complete).
</ui_spec_block_reference>

<cross_cutting_carry_forward>
- **D-66 / RH9 runbook execute DB trigger (mirrors D-65):** BEFORE UPDATE on launch_runbooks.state REJECTS transition to 'executing' if any launch_gates row for the same launch_id has status='blocking'. Mirrors Phase 226 D-83/D-84 enforcement-boundary doctrine.
- **D-37 + D-60 + RH6 AgentRun hard-fail:** executor.ts calls assertUpstreamReady(['P207']) at entry. Throws UpstreamPhaseNotLandedError if AgentRun substrate absent. NO bridge stub (D-59 / RH6 — runbook IS launch execution; soft-skip breaks audit chain D-49).
- **D-35 + D-36 + Pitfall 6 reverse-rollback:** rollback_steps[] executes in REVERSE order; reversible:true steps reversed (publish_surface → archive_surface, dispatch_email_campaign → suppress_followup, send_messaging → cancel_thread, post_social → delete_post); reversible:false steps emit operator task via markos_tasks insert + CONTINUE (NOT abort); final state='rolled_back' with partial_rollback_blockers field listing non-reversible steps.
- **Pitfall 3 ISR invalidation on rollback:** when a rollback step archives a conversion_page surface, invalidatePageCache (Plan 03 export) called SYNCHRONOUSLY before step marked complete; same rule as Plan 03 publish path.
- **D-49 cron path:** 4 cron at api/cron/launches-{surface-health-audit,gate-evaluation-poll,outcome-computation,bounce-spike-alert}.js with x-markos-cron-secret header (NOT app/api/cron/.../route.ts).
- **D-48 + D-50 cron cadence:** vercel.json gains 4 cron entries — surface_health_audit (daily 04:00 UTC) + gate_evaluation_poll (every 15 min) + outcome_computation (daily 06:00 UTC) + bounce_spike_alert (every 1h).
- **D-50 bounce/spike alert:** detects conversion rate drop >2σ from 7-day baseline AND BotID abuse spike >10× baseline; tenant-admin alert via Approval Inbox.
- **Step kind handlers (6):** publish_surface / dispatch_email_campaign / send_messaging / post_social / notify_team / custom; missing handler → operator task + CONTINUE (NOT abort) — mirrors non-reversible rollback pattern.
- **Architecture-lock D-57 carry:** legacy api/v1/launches/runbooks*.js + api/cron/launches-*.js (NOT route.ts); requireHostedSupabaseAuth (D-42); buildApprovalPackage on arm/execute/rollback paths (D-58 — NEVER createApprovalPackage); 39th + 40th + 42nd handoff_kind chips wired here as substrate.
- **F-142 launch-runbook-v1:** ships in THIS plan only (was deferred from Plan 01). F-145 + F-146 MCP contracts deferred to Plan 07 Task 1.
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 06 ships SUBSTRATE. Plan 07 consumes via RunbookEditor + LaunchCockpit. -->
- RunbookEditor (Plan 07) — ordered steps[] + rollback_steps[] + dependency graph + AgentRun status panel; reads launch_runbooks (this plan) + RunStatusBadge run_id={agentrun_id} (P207 lineage carry per UI-SPEC); 39th + 40th + 42nd chips wired via Arm/Execute/Rollback CTAs → buildApprovalPackage.
- LaunchCockpit (Plan 07) — Runbook viewer reads launch_runbooks state machine + step progression + AgentRunEventType audit chain (this plan).
- ApprovalInboxConversionEntries (Plan 07) — 39th + 40th + 42nd handoff chips render ApprovalReviewPanel with subject_type='launch_runbook' / 'launch_runbook_execute' / 'launch_runbook_rollback' + RunStatusBadge run_id={agentrun_id} when revoke modal active for mid-execution rollback.
- MorningBriefLaunchesSection (Plan 07) — reads launch_briefs.status='live' (top-3) + launch_runbooks.state='executing' (current_step counter) + bounce_spike_alert cron output (this plan).
- F-142 active in contracts/openapi.json (D-62) — Plan 07 OpenAPI parity test.
- 4 cron handlers register AgentRun lineage; AgentRunEventType audit chain consumed by Plan 07 closeout regression suite.
</downstream_ui_consumers>

</ui_spec_fold>

`,
  '224-07-PLAN.md': `<ui_spec_fold>
<!-- Per 224-UI-SPEC.md heavy-UI hybrid fold. Plan 07 = IN_SCOPE (OPERATOR) — second of 2 UI plans. 9 NEW operator surfaces under app/(markos)/conversion/ + app/(markos)/launches/ (PERMITTED carve-out per D-45+D-64) + 2 P208 PATCHes (Approval Inbox entry-types + Morning Brief launches section) + 6 MCP tools .cjs per D-43+D-63 + 7 remaining legacy *.js conversion APIs + F-132..F-146 graduate active in contracts/openapi.json per D-62 + 4 Chromatic stories (≥34 operator snapshots) + closeout regression suite. 1 NEW handoff_kind chip rendered (42nd rollback_approval); 5 prior-substrate chips also rendered (37th-41st). Manual checkpoint:human-action for UI density (RL1 + Phase 226 W1 model). END-OF-v4.2.0-Wave-3 chip count = 42. -->

<ui_scope>IN_SCOPE</ui_scope>

<ui_spec_block_reference>
- 224-UI-SPEC.md frontmatter heavy-UI hybrid mode — Plan 07 IN_SCOPE (OPERATOR); ships 9 operator surfaces + 2 P208 PATCHes + 6 MCP tools + 7 legacy *.js + 4 Chromatic stories (ConversionWorkspace + PageEditor + LaunchCockpit + LaunchReadinessBoard ≥34 snapshots) + autonomous: false (RL1 + Phase 226 W1 checkpoint model).
- 224-UI-SPEC.md §Plan Scope Classification table — Plan 07 row: IN_SCOPE (OPERATOR); primary surface = 6 MCP tools at lib/markos/mcp/tools/*.cjs (publish-page / submit-form / evaluate-launch-gates / execute-runbook / rollback-launch / get-launch-outcome) + 7 api/v1/conversion/*.js + 1 internal endpoint + 9 operator UI surfaces at app/(markos)/conversion/{page,PageEditor,FormEditor}.tsx + app/(markos)/launches/{page,LaunchCockpit,RunbookEditor,LaunchReadinessBoard,GatesPanel,OutcomesDashboard}.tsx + 2 module CSS + lib/markos/operating/approvals/entry-types.ts PATCH (6 NEW entry types) + lib/markos/operating/morning-brief/launches-section.ts + F-145 + F-146 contracts + F-132..F-146 graduate active in contracts/openapi.json (D-62) + 4 Chromatic stories + slot-collision regression test + OpenAPI parity test + RLS suite + P221/P222/P223 regression + existing-marketing-routes regression.
- 224-UI-SPEC.md §Surface Inventory operator surfaces — ConversionWorkspace (mobile_priority=**critical** for events stream); PageEditor (secondary; JSON edit + preview pane via page-renderer SSR + KbGroundingPanel + ClassifierChipRow + PIIRedactedField); FormEditor (secondary; field config + preview); LaunchCockpit (secondary; Briefs kanban planning→pending→ready→live→completed); RunbookEditor (secondary; ordered steps[] + rollback_steps[] + dependency graph + AgentRun status panel); LaunchReadinessBoard (secondary; dependency graph + countdown); GatesPanel (secondary; pricing/evidence/readiness/approval gate row evidence_refs[] preview); OutcomesDashboard (secondary; T+7/T+14/T+30 metric tiles + narrative_summary).
- 224-UI-SPEC.md §Surface Inventory P208 PATCHes — ApprovalInboxConversionEntries (renders 6 NEW handoff_kind chips: 37th page_publish_approval + 38th form_publish_approval + 39th launch_arm_approval + 40th launch_execute_approval + 41st gate_waiver_approval + 42nd rollback_approval; subject_type-specific row titles + 215 billing-correction modal recipe reuse + reason capture ≥20 chars per 216 carry); MorningBriefLaunchesSection (top-3 in-flight launches + readiness countdown + blocking gates per launch + recent ConversionEvent volume + bounce_spike alert per D-50; mobile_priority=critical).
- 224-UI-SPEC.md §Cross-Surface AC ranges — XC-9-operator-surfaces + XC-2-p208-patches + XC-6-mcp-tools-cjs + XC-7-legacy-js-apis + XC-d62-openapi-parity + XC-d56-slot-collision + XC-rls-13-tables-suite + XC-p221-p222-p223-regression + XC-existing-marketing-routes-regression + XC-architecture-lock-final-scan + XC-chromatic-≥34-operator-snapshots + XC-axe-playwright-reuse + XC-end-of-v420-wave-3-chip-count-42 + XC-banned-lexicon-zero-match-operator + XC-pii-redacted-operator + XC-d15-extracted-component-reuse-manifest (verbatim D-43/D-45/D-46/D-58/D-62/D-63/D-64 enforcement).
- 224-UI-SPEC.md §D-15 Extracted Component Reuse Manifest — 7 components REUSED in operator surfaces (NOT re-implemented): KbGroundingPanel (PageEditor evidence inspector + GatesPanel evidence row); ClassifierChipRow (PageEditor + FormEditor classifier overlay); PIIRedactedField (PageEditor preview + FormEditor preview + sample recipient); HealthScoreBadge (LaunchCockpit when LaunchBrief targets Customer360); RiskBandBadge (LaunchCockpit risk row); RetentionClassChip (OutcomesDashboard when applicable); SaveOfferPricingBlock (NOT consumed in 224 — registered as reserved for P226+).
- 224-UI-SPEC.md §Approval Inbox Handoff Chain Extension — POST-224 chip count = 42 (entering 36 + 6 NEW: 37th-42nd verbatim — page_publish_approval / form_publish_approval / launch_arm_approval / launch_execute_approval / gate_waiver_approval / rollback_approval); closeout grep gate verifies all 6 literals present in lib/markos/operating/approvals/entry-types.ts.
</ui_spec_block_reference>

<full_surface_acceptance_criteria_fold>
<!-- ≈177 ACs total fold. AC RANGES cited per 222/223 fold pattern. -->

<surface_conversionworkspace ac_count="≈18 mobile_priority=critical">
- AC range CWS-1..18: 'use client' directive; renders Pages list (kanban-by-status: 4 statuses verbatim — draft / pending_approval / published / archived) + Forms list + CTAs tab + Experiments tab + ConversionEvents stream (live, mobile_priority=critical) + DeliverabilityWorkspace cross-link to 223 surface; D-08 token-only; D-09 mint-as-text inline links ("Open page →" / "Open form →" / "Open experiment →"); D-09b .c-notice mandatory empty state ("[info] No conversion pages yet. Create page →"); .c-card--feature reserved for hero CTAs only (D-13); banned-lexicon zero-match on page title + form name preview (CI assertion); SurfaceRouteContract registration with surface_family='conversion_workspace' mobile_priority='critical'; touch target ≥44px (213.2 carry); 'use client' boundary noted in file header; Storybook story Conversion/ConversionWorkspace registers ≥4 named-state stories (Empty / Populated / Filtered / EventsStreamingLive); Chromatic snapshot baseline.
</surface_conversionworkspace>

<surface_pageeditor_formeditor ac_count="≈30">
- AC range PE-1..PE-15: PageEditor — JSON content_blocks editor + preview pane (renders Plan 03 page-renderer SSR output) + Pricing/Evidence binding inspector with KbGroundingPanel (216 D-15 reuse) + ClassifierChipRow findings overlay (D-72 + 5 finding kinds + 3 severity literals: block / flag / info); PIIRedactedField sample recipient render in preview; Money fromPricingRecommendation XOR PlaceholderBanner billing_placeholder sentinel; Publish CTA opens 215 billing-correction modal recipe when classifier finding severity='block' on pricing_binding/factual_claim AND calls buildApprovalPackage(kind='page_publish_approval') 37th chip; Storybook story Conversion/PageEditor registers ≥4 named-state stories.
- AC range FE-1..FE-15: FormEditor — field list + variables_schema editor + identity_stitch toggle + thank_you_page link + preview pane (renders Plan 03 form-renderer); ClassifierChipRow findings overlay; PIIRedactedField sample recipient; Publish CTA → buildApprovalPackage(kind='form_publish_approval') 38th chip.
</surface_pageeditor_formeditor>

<surface_launchcockpit_runbookeditor ac_count="≈30">
- AC range LCP-1..LCP-15: LaunchCockpit — Briefs kanban (5 status columns verbatim: planning / pending_approval / ready / live / completed); per-card RunStatusBadge run_id={runbook.agentrun_id} (P207 lineage); 7 launch_type chips verbatim (feature / pricing / integration / campaign / event / beta / market_entry); HealthScoreBadge + RiskBandBadge (216 D-15 reuse) when Customer360 target; per-card "Open Customer360 →" mint-text inline; Surface board per launch + Gates panel cross-link + Runbook viewer cross-link + Outcomes dashboard cross-link; banned-lexicon zero-match on positioning_summary (CI assertion); Storybook ≥4 named-state stories.
- AC range RBE-1..RBE-15: RunbookEditor — ordered steps[] + rollback_steps[] + dependency graph (visualizes depends_on DAG); AgentRun status panel reads markos_agent_runs (P207) by runbook.agentrun_id; per-step idempotency_key + reversible flag; Arm/Execute/Rollback CTAs → buildApprovalPackage 39th + 40th + 42nd chips; reversible:false rollback step badge "[warn] Non-reversible — operator task created"; Storybook ≥4 named-state stories.
</surface_launchcockpit_runbookeditor>

<surface_readinessboard_gatespanel_outcomesdashboard ac_count="≈30">
- AC range LRB-1..LRB-10: LaunchReadinessBoard — dependency graph of launch_readiness_checks + LaunchGate status (Plan 04) + countdown to launch_date (live updating); 6 check_kind verbatim per D-13 (legal_approved / support_ready / sales_trained / docs_published / partner_briefed / custom); per-check status badge + due_at + owner_user_id + evidence_ref chip; Storybook ≥4 named-state stories — chromatic baseline.
- AC range GP-1..GP-10: GatesPanel — 4 gate kinds verbatim per D-16 (pricing / evidence / readiness / approval); per-gate row status badge (pending/passing/blocking/waived) + blocking_reasons[] + evidence_refs[] preview using <KbGroundingPanel /> from 216 D-15; per-row Waive CTA opens 215 billing-correction modal recipe + tenant-admin RBAC check (D-18) + waiver_reason ≥20 chars + buildApprovalPackage(kind='gate_waiver_approval') 41st chip.
- AC range OD-1..OD-10: OutcomesDashboard — 5 metric tiles per D-40 (reach / signups / pipeline_created / influenced_revenue / activation_lift) at T+7/T+14/T+30 (3 period selectors); narrative_summary subject to banned-lexicon zero-match + PIIRedactedField for any CDP-resolved name; v1 activation_lift renders "[info] Coming with P218 PLG metrics" (deferral notice); Storybook ≥4 named-state stories.
</surface_readinessboard_gatespanel_outcomesdashboard>

<surface_p208_patches ac_count="≈25">
- AC range AICE-1..AICE-15: ApprovalInboxConversionEntries — P208 Approval Inbox row renderer for 6 NEW handoff_kind chips (37th-42nd verbatim); 6 subject_type-specific row titles ("Page publish: {page.title}" / "Form publish: {form.name}" / "Launch arm: {launch.name}" / "Launch execute: {launch.name}" / "Gate waiver: {gate_kind} — {launch.name}" / "Rollback: {launch.name}"); ClassifierChipRow + KbGroundingPanel + PIIRedactedField; Approve/Reject/Revoke CTAs use 215 billing-correction modal recipe; reason capture ≥20 chars per 216 carry; Approve calls buildApprovalPackage per D-58.
- AC range MBL-1..MBL-10: MorningBriefLaunchesSection — top-3 in-flight launches (status='live' OR 'ready'; sort by launch_date asc) + readiness countdown (days/hours to launch_date) + blocking gates per launch (chip count) + recent ConversionEvent volume (24h) + bounce_spike alert badge per D-50; mobile_priority=critical registered in lib/markos/operator/shell.ts SurfaceRouteContract surface_family='launches_brief'; PIIRedactedField for launch_owner display_name.
</surface_p208_patches>

<surface_mcp_tools ac_count="≈18">
- AC range MCP-1..MCP-18: 6 MCP tools at lib/markos/mcp/tools/*.cjs (D-43 + D-63 — .cjs NOT .ts) — publish_page (delegates to api/v1/conversion/pages-publish.js Plan 03) + submit_form (delegates to /api/v1/public/conversion/forms-submit Plan 02; bypasses BotID for trusted server-to-server callers) + evaluate_launch_gates (delegates to evaluateAllLaunchGates Plan 04) + execute_runbook (delegates to executeRunbook Plan 06) + rollback_launch (delegates to rollbackRunbook Plan 06) + get_launch_outcome (reads launch_outcomes Plan 04). Each tool registered in lib/markos/mcp/tools/index.cjs (D-63 path); F-145 + F-146 contracts ship here; OpenAPI parity test asserts all 15 F-IDs (F-132..F-146) graduate active.
</surface_mcp_tools>

<surface_remaining_apis ac_count="≈14">
- AC range API-1..API-14: 7 remaining api/v1/conversion/*.js (legacy *.js per D-42 / RH4) — pages.js (CRUD list/get/put/delete for ConversionPage; uses requireHostedSupabaseAuth; approval-aware POST via buildApprovalPackage); forms.js (CRUD); forms-publish.js (38th chip wired here — substrate was Plan 02; final UI integration here); forms-archive.js; ctas.js (CRUD); events.js (read-only list/get for operator); api/v1/internal/conversion/emit.js (server-to-server emit endpoint for trusted MCP callers).
</surface_remaining_apis>

<cross_surface_acs ac_count="≈32">
- AC range XC-1..XC-32: chromatic gate (4 operator stories ≥34 snapshots — ConversionWorkspace + PageEditor + LaunchCockpit + LaunchReadinessBoard each ≥4 named-state stories with state variants); chromatic.config.json + 4 *.stories.tsx files; D-08 token-only (CI fail on hex literal in 2 module CSS); D-09 mint-as-text inline link convention; .c-notice mandatory + .c-card--feature reserved + no .c-table; banned-lexicon zero-match on operator surface copy; PIIRedactedField for any CDP-resolved field in any operator surface; SurfaceRouteContract registration per surface in lib/markos/operator/shell.ts; D-21 server/client boundary (lib/* server-only; components/markos/* client; app/(markos)/conversion + app/(markos)/launches consumes existing layout-shell); D-43 architecture-lock final scan green across all 7 P224 plans; migration-slot-collision regression (D-56 / RL2 + Phase 226 B6 lesson — slots 121-133 mapping unique); F-132..F-146 graduate active in contracts/openapi.json (D-62); OpenAPI parity test all 15 F-IDs registered with correct paths + status='active'; cross-tenant API regression every new endpoint denied across tenant boundary (RLS suite — 13 tables); P221 + P222 + P223 regression test suites green; existing-marketing-routes regression (/signup, /integrations/claude, /docs still functional after additive P224 changes); D-46 axe-playwright reuse (existing devDep — NOT new playwright runtime; meta-test asserts package.json gained no vitest/@playwright/test keys); manual checkpoint:human-action for UI density per RL1 + Phase 226 W1 model (operator review on first batch with checkpoint:human-verify); END-OF-v4.2.0-Wave-3 chip count grep gate = 42 (start 36 + 6 NEW verbatim literals); D-15 extracted-component reuse manifest verified by grep (KbGroundingPanel + ClassifierChipRow + PIIRedactedField + HealthScoreBadge + RiskBandBadge + RetentionClassChip imports from 216-origin paths); 213.4 D-08..D-15 + D-21 carry verified; 217 D-21 + 221 D-32 + 222 D-43 + 223 D-42 architecture-lock final scan; 13 parent UI-SPECs cross-cutting binding verified; translation gates dissolved (223 future_phase_224_conversion_surfaces fully + 222 future_phase_222_admin_ui partially) verified; translation gates opened (future_phase_225_attribution_journey_analytics + future_phase_224_visual_page_builder + future_phase_226_sales_enablement_launch_surface + future_phase_227_partner_pack_launch_surface + future_phase_224_chromatic_baselines + future_phase_224_route_group_migration) verified.
</cross_surface_acs>
</full_surface_acceptance_criteria_fold>

<cross_cutting_carry_forward>
- **D-43 + D-63 MCP tools .cjs:** 6 P224 MCP tools at lib/markos/mcp/tools/*.cjs (NOT .ts); registered in lib/markos/mcp/tools/index.cjs.
- **D-45 + D-64 operator-shell carve-out:** app/(markos)/conversion/ + app/(markos)/launches/ are PERMITTED NEW PATHS under existing app/(markos)/ tree (consume existing layout-shell). All OTHER new app/(markos)/* paths remain forbidden per architecture-lock.
- **D-46 axe-playwright reuse + Chromatic gate:** existing axe-playwright devDep preserved (NOT new playwright runtime); chromatic existing devDep used for visual regression; 4 operator stories ≥34 snapshots; meta-test asserts package.json gained no vitest/@playwright/test keys during P224.
- **D-58 helper canon final scan:** ALL 6 NEW handoff_kind chips wired via buildApprovalPackage from lib/markos/crm/agent-actions.ts:68 (NEVER createApprovalPackage). Architecture-lock detector (Plan 01 Task 0.5) re-runs green.
- **D-62 OpenAPI bundle:** F-132..F-146 (15 F-IDs) graduate active in contracts/openapi.json (NOT public/openapi.json). OpenAPI parity test asserts all 15 F-IDs registered.
- **D-56 + RL2 slot-collision regression:** test/migrations/slot-collision.test.js verifies slots 121-133 mapping unique (per Phase 226 B6 lesson); fails on dual-allocation.
- **RL1 + Phase 226 W1 checkpoint model:** autonomous: false; checkpoint:human-verify for operator UI density (9 surfaces is high but tightly coupled — kept; mitigation = visual review checkpoint at end).
- **D-15 extracted-component reuse manifest:** 7 components from 216-origin REUSED (NOT re-implemented) — KbGroundingPanel + ClassifierChipRow + PIIRedactedField + HealthScoreBadge + RiskBandBadge + RetentionClassChip + (SaveOfferPricingBlock NOT consumed in 224, reserved for P226+).
- **PII inheritance Layer 6 (carry from 215+216+221+222):** every CDP-resolved identity field in operator surfaces wrapped in PIIRedactedField with pii_classification ENUM 5-value taxonomy verbatim; audit-log event_type='identity_view' on every PII render.
- **Banned-lexicon zero-match:** operator surface copy + page seo_meta + LaunchBrief positioning + runbook step.name + outcome narrative_summary BEFORE buildApprovalPackage dispatch.
- **END-OF-v4.2.0-Wave-3 chip count = 42 verbatim:** 6 NEW literals — page_publish_approval / form_publish_approval / launch_arm_approval / launch_execute_approval / gate_waiver_approval / rollback_approval (37th-42nd); closeout grep gate enforced.
- **3 closeout regressions:** P221 + P222 + P223 regression suites green + existing-marketing-routes regression (/signup, /integrations/claude, /docs still functional); legacy regression on additive phase.
- **2 P208 PATCHes:** ApprovalInboxConversionEntries entry-types extension + MorningBriefLaunchesSection registers via lib/markos/operating/approvals/entry-types.ts + lib/markos/operating/morning-brief/launches-section.ts; carries 208-01 cockpit pattern verbatim.
</cross_cutting_carry_forward>

<downstream_ui_consumers>
<!-- Plan 07 closes P224. Downstream consumers are FUTURE phases. -->
- P225 attribution + journey + narrative engine (translation gate future_phase_225_attribution_journey_analytics opened) — reads conversion_events + experiment_assignments + launch_outcomes shipped here.
- P226 sales enablement (translation gate future_phase_226_sales_enablement_launch_surface opened) — reads LaunchSurface(surface_target_kind='sales_enablement') registry slot from migration 126.
- P227 ecosystem/partner (translation gate future_phase_227_partner_pack_launch_surface opened) — reads LaunchSurface(surface_target_kind='partner_pack') registry slot.
- Future visual page builder (translation gate future_phase_224_visual_page_builder opened) — reads conversion_pages.content_blocks JSONB shape.
- Future route-group migration (translation gate future_phase_224_route_group_migration opened) — moves app/(marketing)/conversion-page/ to app/(public)/.
- Chromatic baseline lock (translation gate future_phase_224_chromatic_baselines opened) — downstream phases must register stories for any new components/markos/conversion/* OR app/(markos)/conversion + app/(markos)/launches sub-routes.
</downstream_ui_consumers>

</ui_spec_fold>

`,
};

let touched = 0, skipped = 0;
for (const [fname, fold] of Object.entries(folds)) {
  const fp2 = path.join(ROOT, fname);
  let body = fs.readFileSync(fp2, "utf8");
  if (body.includes("<ui_spec_fold>")) {
    console.log("[skip] " + fname + " already contains <ui_spec_fold>");
    skipped++;
    continue;
  }
  const taskAnchor = "
<tasks>
";
  const idx = body.indexOf(taskAnchor);
  if (idx === -1) {
    console.log("[ERR] " + fname + " no <tasks> anchor");
    continue;
  }
  const before = body.slice(0, idx + 1);
  const after = body.slice(idx + 1);
  fs.writeFileSync(fp2, before + fold + after, "utf8");
  console.log("[ok]   " + fname + " fold inserted bytes=" + fold.length);
  touched++;
}
console.log("Done. touched=" + touched + " skipped=" + skipped);
