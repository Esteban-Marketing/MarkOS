---
phase: 223
slug: native-email-messaging-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
revised: 2026-05-05  # heavy-UI fold + D-46 npm-test runner alignment + AC Coverage Map (195 ACs)
---

# Phase 223 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `223-RESEARCH.md` §Validation Architecture + `223-UI-SPEC.md` Cross-Surface ACs. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | **Node.js `--test` via `npm test`** (per D-46 — runner pinned to Node `--test`; vitest **not** introduced by P223) |
| **E2E framework** | **EXISTING `axe-playwright` devDep ONLY** (per D-46 — no NEW playwright runtime added by P223; reused for ONE operator-journey E2E in Plan 06) |
| **Visual regression** | Chromatic via Storybook (Plan 06 gate; 5 NEW components × ≥4 variants each = ≥20 snapshots) |
| **Test file extension** | `*.test.js` (NOT `.test.ts` per D-46) |
| **Test runtime imports** | `node:test` + `node:assert/strict` |
| **Quick run command** | `npm test -- test/channels/<slice-domain>` |
| **Full suite command** | `npm test && npm run build-storybook && npx chromatic --exit-zero-on-changes` |
| **Estimated runtime** | ~120s quick, ~10 min full |

**D-46 forbidden runtime tokens** (scanned by Plan 01 Task 0.5 architecture-lock detector):
`vitest run`, `from 'vitest'`, `.test.ts`, `playwright test` (NEW), `@playwright/test` (NEW key in package.json).

---

## Sampling Rate

- **After every task commit:** `npm test -- test/channels/<slice-domain>`
- **After every plan wave:** `npm test`
- **Before `/gsd:verify-work`:** Full suite (`npm test` + Chromatic + axe-playwright operator-journey E2E) green
- **Max feedback latency:** 120s (quick), 10 min (full)

---

## Per-Task Verification Map

> Per-task rows derived from each plan's task `<verify><automated></automated></verify>` block (revised 2026-05-05 per D-46). Status column owned by execute-phase. `nyquist_compliant` flip is owned by execute-phase, not by the planner.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 223-01-0.5 | 01 | 1 | QA-01, QA-02 | architecture-lock + preflight + helper presence | `npm test -- test/channels/preflight/` | ⬜ TBD | ⬜ pending |
| 223-01-1 | 01 | 1 | EML-01, EML-02, MSG-01, QA-01, QA-02 | unit + baseline + 9 fixture factories | `npm test -- test/channels/schema/baseline.test.js` | ⬜ TBD | ⬜ pending |
| 223-01-2 | 01 | 1 | EML-01, EML-02, MSG-03, QA-02 | schema + RLS + idempotency (migrations 113-116) | `npm test -- test/channels/schema/` | ⬜ TBD | ⬜ pending |
| 223-01-3 | 01 | 1 | MSG-01, QA-01, QA-11 | adapter contract extension + legacy regression + F-122..F-127 contracts | `npm test -- test/channels/providers/base-adapter.test.js test/channels/adapters/legacy-outbound.test.js && npm test` | ⬜ TBD | ⬜ pending |
| 223-02-1 | 02 | 2 | EML-05, CDP-05, QA-02, QA-03 | schema + view-swap + D-50/D-51 triggers (migrations 117-121) | `npm test -- test/channels/schema/dispatch-tracking.test.js test/channels/schema/in-app-messages.test.js test/channels/schema/consent-view-swap.test.js test/channels/schema/consent-write-trigger.test.js test/channels/schema/frequency-cap-trigger.test.js` | ⬜ TBD | ⬜ pending |
| 223-02-2 | 02 | 2 | EML-05, MSG-02, CDP-05, QA-05, QA-11 | consent cutover + 6-layer gate (D-19/D-50/D-54) + legacy | `npm test -- test/channels/consent/ test/channels/gate/ && npm test` | ⬜ TBD | ⬜ pending |
| 223-02-3 | 02 | 2 | MSG-02, CDP-05, QA-03, QA-08 | dispatch + idempotency + suppression + F-128/F-129 contracts | `npm test -- test/channels/dispatch/ test/channels/suppression/ && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-03-1 | 03 | 3 | EML-01, EML-03, QA-01 | renderer + variable resolver + locale + preview | `npm test -- test/channels/templates/renderer.test.js test/channels/templates/variable-resolver.test.js test/channels/templates/locale-variant.test.js test/channels/templates/preview.test.js` | ⬜ TBD | ⬜ pending |
| 223-03-2 | 03 | 3 | EML-01, EML-03, QA-12, QA-13 | content classifier (D-52 AST/allowlist via @babel/parser; 4 checks; D-53 P223-owned) | `npm test -- test/channels/templates/content-classifier.test.js` | ⬜ TBD | ⬜ pending |
| 223-03-3 | 03 | 3 | CRM-05, QA-01, QA-06 | approval matrix (5 layers) + revocation + F-131 contract + D-43 enforcement | `npm test -- test/channels/templates/approval-matrix.test.js test/channels/templates/approval-revocation.test.js && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-04-1 | 04 | 3 | EML-04, MSG-01, MSG-05, QA-04 | adapters (resend/twilio/knock/in_app) + Resend inbound body fetch (Pitfall 9/A11) | `npm test -- test/channels/providers/` | ⬜ TBD | ⬜ pending |
| 223-04-2 | 04 | 3 | EML-04, MSG-04, CRM-01..04, QA-07 | D-29 single fan-out emit + reply continuity + auto-reply (Pitfall 7) + commercial_signal map | `npm test -- test/channels/events/` | ⬜ TBD | ⬜ pending |
| 223-04-3 | 04 | 3 | EML-04, MSG-04, MSG-05, QA-04, QA-08, QA-11 | webhook handlers + signature verification + Pitfall 8 Knock cascade | `npm test -- test/channels/webhooks/ && npm test` | ⬜ TBD | ⬜ pending |
| 223-05-1 | 05 | 4 | EML-01..03, MSG-01..04, CRM-01..05, QA-01, QA-02 | 19 API routes (legacy flat per D-42) + 5 MCP tools (per D-48) + tenant isolation + OpenAPI regen (per D-47) + F-130 + buildApprovalPackage exclusive (D-43) | `npm test -- test/channels/api/ test/channels/mcp/ && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-05-2 | 05 | 4 | CRM-05, QA-01 | 5 NEW UI components + 2 P208 entry-type renderers + 2 EVOLVED + 5 Storybook stories + Chromatic | `npm run build-storybook && npx chromatic --project-token=${CHROMATIC_PROJECT_TOKEN:-dummy} --exit-zero-on-changes --only-changed && npm test` | ⬜ TBD | ⬜ pending |
| 223-06-1 | 06 | 5 | QA-08, QA-14 | 5 cron handlers (D-49 legacy api/cron/*.js) — deliverability/lifecycle/spike/tombstone/soft-bounce | `npm test -- test/channels/closeout/deliverability-rollup.test.js test/channels/closeout/spike-alert.test.js test/channels/closeout/lifecycle-journey-poll.test.js test/channels/closeout/tombstone-cascade.test.js test/channels/closeout/soft-bounce-promotion.test.js` | ⬜ TBD | ⬜ pending |
| 223-06-2 | 06 | 5 | QA-09, QA-10, QA-11, QA-15 | 11-table RLS suite + legacy regression + axe-playwright operator-journey (EXISTING devDep per D-46) + Chromatic gate + QA gates coverage + chip-count grep gate (36) | `npm test -- test/channels/closeout/rls-suite.test.js test/channels/closeout/legacy-regression.test.js test/channels/closeout/qa-gates-coverage.test.js test/channels/closeout/cron-routes-architecture-lock.test.js test/channels/closeout/f-id-collision.test.js && npm run build-storybook && npx chromatic --exit-zero-on-changes` | ⬜ TBD | ⬜ pending |
| 223-06-3 | 06 | 5 | QA-15 | doc closeout (no nyquist flip; execute-phase owns it) — meta-test asserts package.json gained NO new vitest/playwright keys (AC XC-12) | `node -e "<see plan 06 task 3 verify command>"` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 223-NN wave starts (likely inherited from P221/P222 Wave 0):

- [x] `package.json` — `npm test` script invokes `node --test test/**/*.test.js` (verified existing per D-46)
- [ ] `test/fixtures/channels/` — channel fixture factory directory (Plan 01 Task 1)
- [ ] `test/fixtures/channels/email-campaign.js` — broadcast/lifecycle/transactional/revenue variants
- [ ] `test/fixtures/channels/messaging-thread.js` — open/reply_pending/escalated/blocked variants per channel
- [ ] `test/fixtures/channels/lifecycle-journey.js` — single-step + multi-step + branch variants
- [ ] `test/fixtures/channels/sender-identity.js` — verified/warming/at_risk variants per class_permissions
- [ ] `test/fixtures/channels/deliverability-posture.js` — healthy/watch/at_risk windows
- [ ] `test/fixtures/channels/template.js` — pricing-bound + evidence-bound + multi-locale + push variants
- [ ] `test/fixtures/channels/dispatch.js` — dispatch_attempt + dispatch_event + dispatch_skip variants
- [ ] `test/fixtures/channels/suppression.js` — hard_bounce + complaint + manual + dsr_deletion + jurisdiction reasons
- [ ] `test/fixtures/channels/in-app-message.js` — unread + read variants
- [ ] CDP fixtures from P221 + CRM360 fixtures from P222 reused for ConsentState + Customer360 overlay
- [ ] `package.json` — add `handlebars`, `@knocklabs/node` (push), `@babel/parser` (D-52); confirm `axe-playwright` (existing devDep) preserved; **NO** new vitest/playwright

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 11 new tables) | 100% of tables | SOC2 baseline; cross-tenant denial per table (AC XC-17) |
| Per-recipient 6-layer dispatch gate decision branches | 100% | All 6 gates (consent/suppression/whatsapp_session/frequency/quiet hours/jurisdiction) compliance-critical (AC XC-22 + XC-23) |
| Approval threshold matrix | 100% | All 5 layers (class × count × content × re-engagement × manual) tested per channel (AC XC-20 + ARP-4) |
| Adapter contract per provider | 100% of methods | Resend + Twilio + Knock + in_app all implement send/normalizeEvent/verifyWebhookSignature/getRateLimitState |
| API contract fields (F-122..F-131) | 100% of fields | OpenAPI parity per QA-01 + AC XC-16 |
| Legacy regression (P100-P105 + P221 + P222) | 100% green | P223 substitutes consent SOR + dispatch path; any regression is data-integrity bug (AC XC-30) |
| Negative-path | ≥2 per gate × per channel | Fail-closed must be actively proven |
| Pricing copy enforcement (D-52 AST/allowlist) | 100% — pricing variables resolve through Pricing Engine via ALLOWLISTED_ACCESSORS OR `{{MARKOS_PRICING_ENGINE_PENDING}}` | CLAUDE.md placeholder rule + D-27 + D-52 + AC XC-20 |
| Webhook signature verification | 100% — every provider has signature test | Replay/spoof protection (D-38) |
| Reply continuity | 100% — every channel creates MessagingThread + Customer360 + CRM task | AC XC-27 |
| Banned-lexicon zero-match | 7 surfaces (template body + EmailCampaign subject + reply suggestion + classifier finding operator-note + sender warming + suppression operator-note + ApprovalReviewPanel reason) | AC XC-7 |
| Provider secret leakage | 0 occurrences in components/ + api/v1/channels/ + lib/markos/channels/{api,mcp}/ | B-9 NEW per D-39 + Layer 6 binding |
| D-15 extracted-component reuse | 7 components reused (HealthScoreBadge / RiskBandBadge / KbGroundingPanel / RetentionClassChip / PIIRedactedField / ClassifierChipRow + SaveOfferPricingBlock NOT consumed) | AC XC-5 + UI-SPEC §D-15 manifest |
| Mobile priority registration | 2 critical surfaces (MessagingThreadsList + MorningBriefChannelEntries) registered in `lib/markos/operator/shell.ts` SurfaceRouteContract | AC XC-6 + AC MTL-16 + AC MBC-15 |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | axe-playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 223-01 | Schema CRUD, adapter capability extension, architecture-lock detector, helper presence | Sender verification flow | F-122..F-127 | P100-P105 outbound tests still green | Cross-tenant, sender unverified send blocked | n/a | n/a |
| 223-02 | Per-recipient 6-layer gate, dispatch_attempt_id idempotency, D-50 freq-cap trigger, D-51 consent-write trigger | ConsentState read via P221 adapter, AgentRun hard prereq (D-45) | F-128, F-129 | P100-P105 evaluateOutboundEligibility passes against new backend | Each gate fails fail-closed; opt-out propagation; bounce → suppression; D-54 WhatsApp session-loss fail-closed | n/a | n/a |
| 223-03 | Handlebars rendering (conservative helper set), variables_schema validation, content classifier (D-52 AST/allowlist; 4 checks via @babel/parser) | Approval threshold matrix (5 layers × 5 channels) | F-131 | Existing template approval passes; P211 placeholder rule honored | Pricing without approved Pricing Engine record blocked, missing variable per-recipient skip (Pitfall 5), banned-lexicon save fail | n/a | n/a |
| 223-04 | Adapter send + normalizeEvent per provider (4 providers), signature verification (3 webhooks), in_app store, auto-reply detect (Pitfall 7), commercial_signal map | Reply normalization → MessagingThread + Customer360 + CRM task; D-29 single fan-out 5-destination transactional; D-51 GUC compliance for consent writes | (carry-only — no NEW F-IDs) | Existing webhook routes still parse | Webhook signature mismatch 401, reply on tombstoned profile rejected, Knock delivery_failed → suppression cascade (Pitfall 8), Resend metadata-only webhook body-fetch BEFORE opt-out (Pitfall 9 + A11) | n/a | n/a |
| 223-05 | API route handlers (19 legacy flat .js per D-42), MCP tool payloads (5 tools per D-48), DeliverabilityWorkspace queries, OpenAPI regen at contracts/openapi.json (D-47) | End-to-end campaign create → approve → dispatch via 19 routes | F-130, F-131 | P208 Approval Inbox accepts 4 NEW handoff_kind chips (33rd-36th); 32 → 36 chip count chain extension | Cross-tenant API denied on all 11 routes, MCP rate limit, no createApprovalPackage references (D-43 enforcement) | (covered by Plan 06 operator-journey reuse) | ChannelProgramsList × 4 + MessagingThreadsList × 4 + DeliverabilityWorkspace × 4 + TemplateEditor × 6 + ApprovalReviewPanel × 4 = 22 snapshots |
| 223-06 | 5 cron handlers (D-49 legacy api/cron/*.js) — deliverability rollup / lifecycle journey poll / bounce spike alert / tombstone cascade / soft-bounce promotion | Full 11-table RLS suite, full reply continuity, journey trigger evaluation, chip-count grep gate (= 36) | All 10 F-IDs (F-122..F-131) registered + flow-registry uniqueness | All P100-P105 + P221 + P222 tests green; meta-test asserts package.json gained NO new vitest/@playwright/test keys | Missing tenant fail-closed, queue replay safety, architecture-lock regression scan zero violations | 1 operator-journey E2E (campaign create → approve → dispatch → reply → bounce) using EXISTING axe-playwright devDep per D-46 | Plan 06 owns chromatic.config.json gate; first batch operator review per RL1 (autonomous: false) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `email-campaign.js` | broadcast/lifecycle/transactional/revenue per class; pricing-touching variant | 223-01..06 |
| `messaging-thread.js` | open/reply_pending/escalated/blocked × whatsapp/sms/push/in_app | 223-01..06 |
| `lifecycle-journey.js` | single-step + multi-step + branch_logic + paused | 223-01..06 |
| `sender-identity.js` | verified/warming/watch/at_risk × class_permissions matrix | 223-01..06 |
| `deliverability-posture.js` | healthy/watch/at_risk × bounce/complaint distributions | 223-01..06 |
| `template.js` | pricing-bound/evidence-bound/multi-locale/push variants + ALLOWLISTED_ACCESSORS variants | 223-03..06 |
| `dispatch.js` | dispatch_attempt + dispatch_event + dispatch_skip × all 6 gate failures | 223-02..06 |
| `suppression.js` | hard_bounce + complaint + manual + dsr_deletion + jurisdiction | 223-02..06 |
| `in-app-message.js` | unread + read variants | 223-04..06 |
| P221 `test/fixtures/cdp/*` reuse | ConsentState + AudienceSnapshot + TraitSnapshot | all slices |
| P222 `test/fixtures/crm360/*` reuse | Customer360 + Opportunity + nba_records | all slices |

Location: `test/fixtures/channels/`. **All fixtures `.js` (NOT `.ts` per D-46) — ESM-compatible factories.** Importable from all channel test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.js` CRUD + RLS + tombstone cases."
- Consent cutover criteria: "Verified by `consent-cutover.test.js` ConsentState-only path + P104 regression + D-51 trigger."
- 6-layer gate criteria: "Verified by `eligibility-gate.test.js` — all 6 sub-gates × all 5 channels = 30 negative-path cases minimum."
- Approval criteria: "Verified by `approval-matrix.test.js` — class × count × content × re-engagement × manual matrix; all 5 layers."
- Adapter criteria: "Verified by `<provider>-adapter.test.js` send + normalizeEvent + verifyWebhookSignature + getRateLimitState."
- Reply criteria: "Verified by `reply-continuity.test.js` — thread + Customer360 + CRM task creation per channel."
- Pricing criteria: "Verified by `content-classifier.test.js` — Pricing Engine allowlisted accessor resolution OR `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder; AST/allowlist per D-52."
- RLS criteria: "Verified by `rls-suite.test.js` cross-tenant denial on all 11 new tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P221 + P222 suites green."
- Architecture-lock: "Verified by `architecture-lock.test.js` (Plan 01 Task 0.5) — scans every 223-*-PLAN.md for forbidden tokens (createApprovalPackage / requireSupabaseAuth / route.ts / vitest / .test.ts / public/openapi.json / app/api/cron / etc.)."
- Helper canon (D-43): "Verified by grep — `createApprovalPackage` in lib/markos/channels/ + lib/markos/crm/ + components/ + api/v1/channels/ returns 0; `buildApprovalPackage` returns ≥3."
- D-15 reuse: "Verified by `d-15-reuse.test.js` — 7 extracted components imported from 217-06 origin in Plan 05 surfaces (NOT re-implemented)."
- Provider secret leakage: "Verified by `secret-leak.test.js` (Plan 06) — RESEND_API_KEY/TWILIO_AUTH_TOKEN/KNOCK_API_KEY/RESEND_SIGNING_SECRET/TWILIO_WEBHOOK_SECRET/KNOCK_WEBHOOK_SECRET/MARKOS_WEBHOOK_CRON_SECRET string-literal match in components/ + api/v1/channels/ + lib/markos/channels/{api,mcp}/ returns 0."
- Chip count (END-OF-v4.2.0-Wave-2 = 36): "Verified by `chip-count.test.js` (Plan 06) — 4 NEW handoff_kind literals (channel_dispatch_approval / channel_template_publish_approml / channel_suppression_bulk_approval / channel_program_pause_approval) appear in lib/markos/crm/agent-actions.ts + components/markos/operator/ApprovalInboxChannelEntries.tsx."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sender warmup operator workflow | EML-02 | Multi-day warmup process | (1) Create unverified sender, (2) Verify DKIM/SPF/DMARC via DNS, (3) Confirm reputation_status transitions warming → healthy, (4) Class_permissions gate allows broadcast |
| Push delivery on physical device | MSG-03 | Requires real FCM/APNS token | (1) Register device, (2) Knock dispatch, (3) Verify push received within 30s, (4) Track delivery webhook |
| Email inbox placement | EML-01 | External provider behavior (Gmail/Outlook spam folder) | (1) Send to seed addresses across providers, (2) Inspect inbox vs spam placement, (3) Confirm no provider warning |
| WhatsApp 24h session window | MSG-02 | Real WhatsApp business rules | (1) Trigger initial template, (2) Verify free-form messaging window opens, (3) After 24h verify only templated messages allowed; D-54 fail-closed `whatsapp_session_lost` |
| Approval inbox UX flow | EML-05, MSG-05 | Operator judgment | (1) Create high-risk campaign, (2) Confirm Approval Inbox entry via ApprovalInboxChannelEntries renderer, (3) Approve via ApprovalReviewPanel → status transition, (4) Reject → status + audit row |
| Knock app provisioning | MSG-03 | External dashboard required | (1) Create Knock workspace at knock.app, (2) Configure FCM + APNS push providers, (3) Copy KNOCK_API_KEY + KNOCK_WEBHOOK_SECRET to env, (4) Configure webhook endpoint URL → /api/webhooks/knock-events |
| Resend dashboard webhook configuration | EML-04 | External dashboard required | (1) Configure Resend inbound parsing per sender_identity at resend.com, (2) Set webhook URL `/api/webhooks/resend-events`, (3) Copy signing secret (RESEND_SIGNING_SECRET) to env, (4) Configure events email.delivered/opened/clicked/bounced/complained/received |
| Twilio messaging service configuration | MSG-01, MSG-02 | External dashboard required | (1) Configure Twilio messaging service for SMS+WhatsApp at twilio.com, (2) Set webhook URL `/api/webhooks/twilio-events`, (3) Copy auth token (TWILIO_AUTH_TOKEN) to env |

---

## AC Coverage Map (heavy-UI fold — 195 ACs)

> Maps the 195 UI-SPEC ACs to the 6 plans. Surface ACs (164) ship in Plan 05 (the only IN_SCOPE plan); cross-cutting ACs (31) ship across all 6 plans. Translation gates dissolved by 223-05; future-surface UI binding contracts opened by 223 closeout.

### Backend doctrine assertions (5 backend plans)

| Doctrine assertion | Plans | Verification |
|---|---|---|
| D-32 + D-42 + D-43 architecture-lock forbidden patterns | 01 (Task 0.5) | `architecture-lock.test.js` scans every 223-*-PLAN.md for forbidden tokens; CI fails on any reappearance |
| D-45 hard preflight `assertUpstreamReady(['P205','P207','P208','P209','P210','P211','P221','P222'])` | 01 (Task 0.5) | `upstream-gate.test.js` happy path + throw path |
| D-43 helper canon `buildApprovalPackage` (NEVER `createApprovalPackage`) | 01, 03, 05, 06 | `helper-presence.test.js` + grep gate (lib/ + components/ + api/v1/channels/ returns 0 createApprovalPackage matches) |
| D-44 P223-owned greenfield (`lib/markos/channels/*`) + P221/P222 upstream-owned (`lib/markos/cdp/*` + `lib/markos/crm360/*`) | 01, 02, 03, 04 | greenfield directory scaffolding tasks; assertUpstreamReady for cdp/crm360 reads |
| 4 channel kinds verbatim (email/sms+whatsapp/push/in_app) | 01 (base-adapter), 04 (4 provider adapters) | `base-adapter.test.js` CHANNEL_CAPABILITIES count=5; per-adapter contract tests |
| 4 provider adapters (Resend/Twilio/Knock/in_app) | 04 | per-adapter `*-adapter.test.js`; webhook signature tests; in-app store test |
| 4 NEW handoff_kind literals (33rd-36th) | 03 (substrate), 05 (rendering), 06 (chip-count grep gate) | `chip-count.test.js` asserts 4 literals appear in 2 named files; END-OF-v4.2.0-Wave-2 = 36 |
| D-29 single fan-out emit() (5 destinations transactional) | 04 (emit.ts), 05 (UI consumes) | `emit.test.js` 5-destination transaction + fail-closed rollback |
| D-19 6-layer dispatch gate (Consent → Suppression → SessionWindow → FrequencyCap → QuietHours → Jurisdiction) | 02 (gate orchestration), 05 (UI consumes dispatch_skips) | `eligibility-gate.test.js` × all 6 sub-gates × 5 channels = ≥30 cases |
| D-50 frequency-cap DB trigger | 02 (migration 121) | `frequency-cap-trigger.test.js` direct INSERT rejected when over cap |
| D-51 consent-write DB trigger via `app.consent_writer_source` GUC | 02 (migration 119) | `consent-write-trigger.test.js` direct INSERT outside setConsentState rejected; setConsentState path allowed |
| D-54 WhatsApp 24-hour session window check (BEFORE quiet-hours; defer-past-session = fail-closed) | 02 (whatsapp-session-check.ts) | `whatsapp-session-check.test.js` ordering verified; `whatsapp_session_lost` reason emitted |
| Pitfall 7 auto-reply detection (vacation responder filtered) | 04 (auto-reply-detect.ts) | `auto-reply-filter.test.js` Auto-Submitted + subject patterns + body length filters |
| Pitfall 8 Knock cascade (push delivery_failed → suppression chain) | 04 (knock-adapter + suppression cascade) | `knock-events.test.js` delivery_failed maps to handleBounceEvent('hard') |
| Pitfall 9 + A11 Resend metadata-only webhook (body fetched via Resend Received Emails API) | 04 (resend-inbound.ts) | `resend-inbound.test.js` fetchInboundEmailBody called BEFORE opt-out detection |
| Banned-lexicon zero-match BEFORE save AND BEFORE external.send dispatch (7 surfaces) | 03 (template body + subject), 04 (reply suggestion), 05 (classifier finding + sender warming + suppression operator-note + reason capture) | `banned-lexicon.test.js` server-side; CI assertion |
| ConsentState cutover (no config flag; D-51 trigger-driven) | 02 (migration 119 + consent-write-trigger.test.js) | rejected escape hatches scanned by Task 0.5 architecture-lock |
| D-15 extracted components REUSED (NOT re-implemented) | 05 (per-component grep gate) | `d-15-reuse.test.js` import-from-217-06-origin verification |
| B-9 NEW provider secrets env-only access | 04 (adapter modules) + 05 (UI surface) + 06 (closeout) | `secret-leak.test.js` (Plan 06) — 0 matches in components/ + api/v1/channels/ + lib/markos/channels/{api,mcp}/ |
| D-46 axe-playwright reuse + Chromatic gate | 06 (closeout) | meta-test asserts package.json gained NO new vitest/@playwright/test; 1 operator-journey E2E using EXISTING devDep |
| 195 total ACs (164 surface + 31 XC) | All plans | This AC Coverage Map (below); per-task acceptance_criteria blocks; UI-SPEC §Acceptance Criteria sections |
| END-OF-v4.2.0-Wave-2 chip count = 36 | 06 (closeout grep gate) | `chip-count.test.js` 32 pre-223 + 4 NEW = 36 |

### Surface AC fold (164 ACs in Plan 05)

| Surface | UI-SPEC §Surface | AC range | Count | mobile_priority | Plan | Storybook story | Chromatic variants |
|---|---|---|---|---|---|---|---|
| ChannelProgramsList | A (lines 394-523) | CPL-1..19 | 19 | secondary | 05 | `Channels/ChannelProgramsList` | Empty / Populated / Tombstoned / Filtered (≥4) |
| MessagingThreadsList | B (lines 525-660) | MTL-1..21 | 21 | **critical** | 05 | `Channels/MessagingThreadsList` | Empty / ReplyPending / Mixed / Tombstoned (≥4) |
| DeliverabilityWorkspace | C (lines 662-822) | DLW-1..17 | 17 | secondary | 05 | `Channels/DeliverabilityWorkspace` | Warming / Healthy / Watch / AtRisk (≥4) |
| TemplateEditor | D (lines 824-1037) | TPE-1..26 | 26 | secondary | 05 | `Channels/TemplateEditor` | Empty / Preview / ClassifierFindings / PricingFlagged / EvidenceTtlStale / LocaleFallback (≥6) |
| ApprovalReviewPanel | E (lines 1040-1218) | ARP-1..21 | 21 | secondary | 05 | `Channels/ApprovalReviewPanel` | Pending / Approved / Rejected / Revoked (≥4) |
| MorningBriefChannelEntries | F (lines 1219-1346) | MBC-1..20 | 20 | **critical** | 05 | (rendered as part of 208 Morning Brief story set) | (covered by ChannelProgramsList + DeliverabilityWorkspace + MessagingThreadsList stories upstream) |
| ApprovalInboxChannelEntries | G (lines 1347-1466) | AIC-1..15 | 15 | secondary | 05 | (rendered as part of 208-04 Approval Inbox story set) | (covered by ApprovalReviewPanel stories upstream) |
| outbound-workspace EVOLVED | H (lines 1467-1492) | OWE-1..11 | 11 | secondary | 05 | (existing 222 story set + tab bar variants) | (covered by 5 NEW component stories upstream) |
| TimelineDetailView EVOLVED | I (lines 1495-1522) | TDE-1..14 | 14 | secondary | 05 | `Crm360/TimelineDetailView` (existing 222 story) gains "WithChannelEvents" variant | WithChannelEvents (≥1) |
| **Total surface** | — | — | **164** | — | **05** | — | — |

### Cross-cutting AC fold (31 ACs across all 6 plans)

| AC | UI-SPEC § | Plans | Verification |
|---|---|---|---|
| XC-1 | Cross-Surface (line 1529) | 05 + 06 | Storybook CSF3 named-state stories under Channels/* path; chromatic.config.json (Plan 06) covers 5 NEW components × ≥4 variants each |
| XC-2 | line 1530 | 05 | All 5 NEW + 2 P208 renderer + 2 EVOLVED honor D-08 token-only (zero hex literals) |
| XC-3 | line 1531 | 05 | All components honor D-09 mint-as-text + D-09b .c-notice mandatory + D-13 .c-card--feature reserved + D-14 no .c-table |
| XC-4 | line 1532 | 05 | 'use client' per existing convention; consuming pages remain server components per D-21 |
| XC-5 | line 1533 | 05 | All components consume PIIRedactedField (216 D-15) for any CDP-resolved IdentityProfile recipient PII field |
| XC-6 | line 1534 | 05 | All components register in `lib/markos/operator/shell.ts` SurfaceRouteContract with `surface_family: channels_*` and correct mobile_priority |
| XC-7 | line 1535 | 03 + 04 + 05 | Banned-lexicon zero-match on 7 surfaces BEFORE save AND BEFORE external.send dispatch |
| XC-8 | line 1536 | 03 + 05 | All approval-package call paths use buildApprovalPackage per D-43; grep createApprovalPackage returns 0 |
| XC-9 | line 1537 | 06 | All 5 cron handlers under api/cron/channels-*.js per D-49; auth via x-markos-cron-secret header |
| XC-10 | line 1538 | 05 | All 19 REST handlers under api/v1/channels/*.js per D-42; auth via requireHostedSupabaseAuth |
| XC-11 | line 1539 | All plans | Test runner is npm test (Node --test) per D-46; all *.test.js files; imports node:test + node:assert/strict; NO NEW vitest/playwright |
| XC-12 | line 1540 | 06 | Closeout meta-test asserts package.json did not gain vitest/@playwright/test keys during P223 execution |
| XC-13 | line 1541 | 01 (Task 0.5) | Architecture-lock detector test scans every 223-*-PLAN.md for forbidden tokens |
| XC-14 | line 1542 | 01 (Task 0.5) | Hard preflight upstream gate; NO soft-skip, NO "stub if missing" |
| XC-15 | line 1543 | 06 | All 9 migrations slot-pre-allocated per D-41; closeout migration-slot-collision.test.js asserts no overlap |
| XC-16 | line 1544 | 06 | All 10 F-IDs slot-pre-allocated per D-40; closeout f-id-collision.test.js asserts no overlap |
| XC-17 | line 1545 | 06 | All 11 new tables RLS verified cross-tenant denied via rls-suite.test.js |
| XC-18 | line 1546 | 02 | D-50 frequency-cap BEFORE INSERT trigger; replaces previous service-layer approach |
| XC-19 | line 1547 | 02 | D-51 consent-write trigger via app.consent_writer_source GUC; only setConsentState writes |
| XC-20 | line 1548 | 03 | D-52 AST/allowlist content classifier via @babel/parser; ALLOWLISTED_ACCESSORS verified |
| XC-21 | line 1549 | 04 | D-29 single fan-out emit() function writes 5 destinations transactionally; fail-closed |
| XC-22 | line 1550 | 02 | D-19 per-recipient 6-layer dispatch gate enforced; skipped recipients write dispatch_skips row |
| XC-23 | line 1551 | 02 | D-54 WhatsApp 24-hour session window check runs BEFORE quiet-hours; defer-past-session is fail-closed |
| XC-24 | line 1552 | 04 | Pitfall 7 auto-reply detection — vacation responder + Auto-Submitted header + In-Reply-To + min body length filters |
| XC-25 | line 1553 | 04 | Pitfall 8 Knock cascade — push delivery_failed event maps to handleBounceEvent('hard') → suppression chain |
| XC-26 | line 1554 | 04 | Pitfall 9 + A11 Resend metadata-only webhook — body fetched via Resend Received Emails API BEFORE opt-out detection |
| XC-27 | line 1555 | 04 | Reply continuity flow — inbound reply → lookupOrCreateThread → reply_pending → emit cdp_events → CRM task → opt-out → setConsentState |
| XC-28 | line 1556 | 06 | Chromatic snapshot gate covering 5 NEW UI surfaces × ≥4 variants each (TemplateEditor adds ClassifierFindings + PricingFlagged for ≥6) |
| XC-29 | line 1557 | 06 | ONE operator-journey E2E test using EXISTING axe-playwright devDep per D-46 (NOT a new playwright runtime) |
| XC-30 | line 1558 | 06 | Closeout regression — P100-P105 + P102 Kanban + P103 urgency + P105 record brief + P101 HIGH_SIGNAL + P221 + P222 all green |
| XC-31 | line 1559 | 06 | Plan 06 autonomous: false per RL1 — operator review checkpoint:human-action for sender warming + DKIM/SPF/DMARC + Knock provisioning + Resend webhook configuration |

### 9 future-surface UI binding contracts (3 dissolved + 7 opened by 223)

| # | Binding contract | UI-SPEC § | Status post-223 | Anticipated phase |
|---|---|---|---|---|
| 1 | future_phase_222_dispatch_substrate | UI-SPEC line 37 | **DISSOLVED by 223** (223 ships dispatch substrate) | n/a |
| 2 | 104-CONTEXT D-04/D-07 + 105-CONTEXT D-05/D-06 (legacy CRM-bound outbound) | UI-SPEC line 38 | **DISSOLVED by 223** (legacy adapter preserves backward compat; D-44 greenfield clarifies ownership) | n/a |
| 3 | 211-CONTEXT classifier placeholder | UI-SPEC line 39 | **DISSOLVED by 223** at the classifier-implementation layer (D-53; classifier IMPL is P223-owned greenfield) | n/a |
| 4 | future_phase_224_conversion_surfaces | UI-SPEC line 41 | **OPENED by 223** | P224 — landing pages + forms + CTA + launch orchestration |
| 5 | future_phase_225_attribution_journey_analytics | UI-SPEC line 42 | **OPENED by 223** | P225 — semantic attribution + journey + narrative + anomaly intelligence |
| 6 | future_phase_226_sales_enablement | UI-SPEC line 43 | **OPENED by 223** | P226 — battlecards + proof packs + proposals + win/loss capture |
| 7 | future_phase_223_admin_ui | UI-SPEC line 44 | **OPENED by 223** | P224+ — multi-page Channel Engine admin pages |
| 8 | future_phase_223_approval_inbox_renderers | UI-SPEC line 45 | **OPENED then DISSOLVES with 223-05** (renderer ships in Plan 05) | n/a (dissolves with this phase) |
| 9 | future_phase_223_morning_brief_renderers | UI-SPEC line 46 | **OPENED then DISSOLVES with 223-05** (renderer ships in Plan 05) | n/a (dissolves with this phase) |
| 10 | future_phase_223_chromatic_baselines | UI-SPEC line 47 | **OPENED by 223** (Plan 06 ships gate) | P224+ — operator review approval needed for visual diffs |
| 11 | future_phase_223_ssl_realtime_in_app_messages | UI-SPEC line 48 | **OPENED by 223** | P224 — SSE/websocket for in_app messages real-time delivery |
| 12 | future_phase_223_legacy_outbound_cutover | UI-SPEC §Future-Surface 7 (line 1634) | **OPENED by 223** (post-223 cleanup) | P224+ — drop legacy adapter path, demote scheduler.ts + conversations.ts to thin wrappers |

### Translation gate dissolutions (3 dissolved, 7 opened)

**Dissolved by 223** (3): 222 dispatch substrate + 104/105 legacy CRM-bound outbound + 211 classifier placeholder.
**Opened by 223** (7+): future_phase_224_conversion_surfaces / future_phase_225_attribution_journey_analytics / future_phase_226_sales_enablement / future_phase_223_admin_ui / future_phase_223_chromatic_baselines / future_phase_223_ssl_realtime_in_app_messages / future_phase_223_legacy_outbound_cutover. Plus 2 surface gates (approval_inbox_renderers + morning_brief_renderers) opened then dissolved with 223-05 ship.

### Downstream UI inheritance citations (≥10 future surfaces)

The following downstream surfaces (P224..P228) inherit Plan 05 deliverables:

1. P224 conversion surfaces — landing pages + forms inherit channel_templates + EmailCampaign shapes for confirmation emails
2. P224 launch orchestration — inherits LifecycleJourney shape for launch playbooks
3. P224 SSE for in_app messages — inherits in_app_messages table read substrate
4. P225 attribution layer — inherits dispatch_events + cdp_events 5-destination fan-out via D-29
5. P225 journey analytics — inherits lifecycle_journeys + lifecycle_journey_runs + email_campaigns aggregate counters
6. P225 narrative intelligence — inherits messaging_threads.last_message_at + sentiment + deliverability_posture.reputation_score
7. P226 sales enablement — inherits MCP `send_messaging` for sales-assist outreach with Opportunity context
8. P226 deal-execution copilot — inherits ApprovalReviewPanel for sales-touch approval flows; AI-generated subject + body deferred to P226
9. P227 ecosystem motions — inherits buildApprovalPackage (D-43) extension pattern for partner outreach approvals
10. P228 commercial OS integration — inherits 11 SOR tables + provider adapter contract + per-recipient 6-layer gate
11. P224+ admin UI — inherits 5 NEW Plan 05 components in dedicated admin pages (composes ChannelProgramsList / MessagingThreadsList / DeliverabilityWorkspace / TemplateEditor / ApprovalReviewPanel in dedicated routes)

### Carry-forward map

| Source phase | Carry | Where consumed in 223 |
|---|---|---|
| 213.4-VALIDATION.md | D-08 token-only / D-09 mint-as-text / D-09b .c-notice mandatory / D-13 .c-card--feature reserved / D-14 no .c-table / D-15 selective extraction / D-21 server/client boundary | All 5 NEW + 2 P208 renderer + 2 EVOLVED components (Plan 05) |
| 217-UI-SPEC §D-15 | 7 extracted components first consumed in 217-06 (HealthScoreBadge / RiskBandBadge / KbGroundingPanel / RetentionClassChip / PIIRedactedField / ClassifierChipRow / SaveOfferPricingBlock — last NOT consumed in 223) | Plan 05 surfaces REUSE per UI-SPEC §D-15 manifest |
| 217 D-21 | Server/client boundary | All Plan 05 client components ('use client'); consuming pages remain server components |
| 217 D-32 architecture-lock | Legacy api/*.js + requireHostedSupabaseAuth + npm test + contracts/openapi.json + lib/markos/mcp/tools/index.cjs | All Plan 05 routes + handlers; D-42 + D-46 + D-47 + D-48 carry verbatim |
| 221-UI-SPEC PARENT | CDP IdentityProfile + ConsentState SOR cutover + AudienceSnapshot read-through adapter + D-18 audience double-gate + D-24 tombstone cascade | Plan 02 6-layer gate + Plan 04 reply flow consent write + Plan 05 PIIRedactedField via crm-projection adapter |
| 222-UI-SPEC PARENT | CRM Timeline + Commercial Memory + commercial_signal taxonomy 7-enum + source_domain 11-enum + D-15 reuse manifest VERBATIM + TimelineDetailView EVOLVED for channel events | Plan 04 emit() commercial_signal mapping + Plan 05 TimelineDetailView D-34 channel-event-chips |

### Cross-cutting doctrine binding (12 parent UI-SPECs)

UI-SPEC `parent_doctrine_chain` (UI-SPEC frontmatter lines 22-35) cites 12 parent UI-SPECs as doctrine authority: **206 / 207 / 208 / 209 / 213 / 214 / 215 / 216 / 217 / 220 / 221 / 222**. Each parent contributes specific bindings:
- 206 (mutation-class doctrine — `external.send` for ALL channel dispatch paths; `default_approval_mode == single_approval` for high-risk mutations)
- 207 (`RunApiEnvelope.run_id` linked to channel dispatch runs; `AgentRunEventType` for 22 channel event types; `AgentFailureClass` 7 literals on cron + dispatch failures; `ApprovalHandoffRecord` links to P208 inbox via `buildApprovalPackage`)
- 208 (Approval Inbox `/operations/approvals` + Morning Brief + Task Board + cockpit pattern; 4 NEW handoff_kind chips render via ApprovalInboxChannelEntries; mobile_priority literals registered)
- 209 (EvidenceMap binding + source quality + claim TTL on channel_templates evidence_bindings; KbGroundingPanel + EvidenceCitationChip recipes consumed)
- 213 (Tenant 0 readiness gate consumer; 213-04 public-proof boundary applies STRICTLY to outbound channel content; banned-lexicon zero-match required)
- 214 (SaaS Suite Activation; CDP IdentityProfile reader for channel dispatch; architecture-lock D-32 carries verbatim)
- 215 (sentinel discipline + sensitive credential UI binding contract Layer 6 EXTENDED to recipient PII per 216 inheritance; billing-correction modal recipe REUSED for 4 NEW approval kinds)
- 216 (Health Score binding for dispatch priority gate; 6 extracted components REUSED in production by 223 surfaces; banned-lexicon zero-match enforced)
- 217 (heavy-UI pattern reference; D-15 selective extraction recipe; D-21 server/client boundary; D-32 architecture-lock — legacy api/*.js, requireHostedSupabaseAuth, npm test, contracts/openapi.json, lib/markos/mcp/tools/index.cjs, api/cron/*.js, helper canon buildApprovalPackage)
- 220 (END-OF-v4.1.0 milestone state — 26 P208 handoff_kind chips at v4.1.0 closeout; 220 community/events/PR/partnership outbound substrate dissolves at dispatch substrate layer)
- 221 (CDP IdentityProfile + ConsentState + TraitSnapshot + AudienceSnapshot via P221 read-through adapter; **221 D-12 mandate** — full ConsentState cutover lands in P223 via D-51 trigger; 221 D-18 audience double-gate is the AUTHORITY for D-19 per-recipient 6-layer dispatch gate; 221 D-24 tombstone cascade)
- 222 (CRM Timeline + Commercial Memory; D-15 reuse manifest VERBATIM; 222 commercial_signal taxonomy 7-enum is the AUTHORITY for D-29 fan-out emit() commercial_signal mapping; 222 source_domain 11-enum is the AUTHORITY for TimelineDetailView D-34 channel-event-chip source_domain rendering; 222 messaging_threads.related_crm_id FK)

### END-OF-v4.2.0-Wave-2 state assertions (post-223)

| Assertion | Pre-223 | Post-223 | Plan |
|---|---|---|---|
| Approval Inbox handoff_kind chip count | 32 | **36** (32 + 4 NEW: 33rd channel_dispatch_approval + 34th channel_template_publish_approval + 35th channel_suppression_bulk_approval + 36th channel_program_pause_approval) | 06 (closeout grep gate `chip-count.test.js`) |
| F-ID slot allocation | F-01..F-121 | F-01..F-131 (10 NEW) | 06 (closeout `f-id-collision.test.js`) |
| Migration slot allocation | 1..112 | 1..121 (9 NEW) | 06 (closeout `migration-slot-collision.test.js`) |
| New SOR tables | 0 | **11** (sender_identities / deliverability_posture / channel_templates / email_campaigns / messaging_threads / lifecycle_journeys / lifecycle_journey_runs / channel_suppressions / dispatch_events / dispatch_skips / in_app_messages) | 06 (RLS suite covers all 11) |
| New UI components first consumed in production | 5 D-15 components from 217-06 | 5 NEW Plan 05 components + 2 P208 entry-type renderers + 2 EVOLVED | 06 (Chromatic gate covers all 9) |
| translation_gates_dissolved | 0 (P223-related) | 3 (222 dispatch substrate + 104/105 legacy outbound + 211 classifier IMPL placeholder) | 06 (closeout) |
| translation_gates_opened | 0 | 7 (224 conversion / 225 attribution / 226 sales / 223 admin UI / 223 Chromatic baselines / 223 SSE realtime / 223 legacy outbound cutover) | 06 (closeout) |

### Chromatic baselines (5 NEW surfaces × ≥4 variants = 20+ snapshots)

| Story path | Variants | Count |
|---|---|---|
| `Channels/ChannelProgramsList` | Empty / Populated / Tombstoned / Filtered | 4 |
| `Channels/MessagingThreadsList` | Empty / ReplyPending / Mixed / Tombstoned | 4 |
| `Channels/DeliverabilityWorkspace` | Warming / Healthy / Watch / AtRisk | 4 |
| `Channels/TemplateEditor` | Empty / Preview / ClassifierFindings / PricingFlagged / EvidenceTtlStale / LocaleFallback | ≥6 |
| `Channels/ApprovalReviewPanel` | Pending / Approved / Rejected / Revoked | 4 |
| `Crm360/TimelineDetailView` (existing 222 story) | + WithChannelEvents (new variant) | +1 |
| **Total snapshots** | — | **≥22** |

Plan 06 owns chromatic.config.json + first-batch operator review per RL1 (autonomous: false).

### Manual operator-journey checklists

Plan 06 Task 4 (`autonomous: false` per RL1 — `checkpoint:human-action`) covers 5 manual operator checkpoints + 1 axe-playwright operator-journey E2E (campaign create → approve → dispatch → reply → bounce). See [Manual-Only Verifications](#manual-only-verifications) section above.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 120s quick / 10 min full
- [ ] All 195 ACs (164 surface + 31 XC) mapped to plans + verification commands
- [ ] D-46 npm test runner alignment verified — 0 vitest/playwright references in `<verify><automated>` blocks (Plan 01 Task 0.5 architecture-lock detector enforces)
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending (revised 2026-05-05 — heavy-UI fold; D-46 npm-test alignment; AC Coverage Map for 195 ACs)
