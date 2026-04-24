---
phase: 223
slug: native-email-messaging-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 223 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `223-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Vitest (Phase 204+ doctrine) |
| **Framework (legacy regression)** | Node.js `--test` (`npm test`) |
| **E2E framework** | Playwright |
| **Visual regression** | Chromatic via Storybook |
| **Vitest config** | inherited from P221/P222 Wave 0 |
| **Playwright config** | inherited from P221/P222 Wave 0 |
| **Quick run command** | `vitest run test/channels/` |
| **Full suite command** | `vitest run && npm test && npx playwright test --grep channels` |
| **Estimated runtime** | ~120s quick, ~10 min full |

---

## Sampling Rate

- **After every task commit:** `vitest run test/channels/<slice-domain>`
- **After every plan wave:** `vitest run test/channels/ && npm test`
- **Before `/gsd:verify-work`:** Full suite (Vitest + node --test + Playwright + Chromatic) green
- **Max feedback latency:** 120s (quick), 10 min (full)

---

## Per-Task Verification Map

> Per-task rows derived from each plan's task `<verify><automated></automated></verify>` block. Status column owned by execute-phase. `nyquist_compliant` flip is owned by execute-phase, not by the planner.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 223-01-1 | 01 | 1 | EML-01, EML-02, MSG-01, QA-01, QA-02 | unit + baseline | `vitest run test/channels/schema/baseline.test.ts` | ⬜ TBD | ⬜ pending |
| 223-01-2 | 01 | 1 | EML-01, EML-02, MSG-03, QA-02 | schema + RLS + idempotency | `vitest run test/channels/schema/sender-identity.test.ts test/channels/schema/channel-template.test.ts test/channels/schema/email-campaign.test.ts test/channels/schema/messaging-thread.test.ts test/channels/schema/lifecycle-journey.test.ts test/channels/schema/channel-suppressions.test.ts` | ⬜ TBD | ⬜ pending |
| 223-01-3 | 01 | 1 | MSG-01, QA-01, QA-11 | adapter contract + legacy regression | `vitest run test/channels/providers/base-adapter.test.ts test/channels/adapters/legacy-outbound.test.ts && npm test` | ⬜ TBD | ⬜ pending |
| 223-02-1 | 02 | 2 | EML-05, CDP-05, QA-02, QA-03 | schema + view-swap | `vitest run test/channels/schema/dispatch-tracking.test.ts test/channels/schema/in-app-messages.test.ts test/channels/schema/consent-view-swap.test.ts` | ⬜ TBD | ⬜ pending |
| 223-02-2 | 02 | 2 | EML-05, MSG-02, CDP-05, QA-05, QA-11 | consent cutover + 5-layer gate + legacy | `vitest run test/channels/consent/ test/channels/gate/ && npm test` | ⬜ TBD | ⬜ pending |
| 223-02-3 | 02 | 2 | MSG-02, CDP-05, QA-03, QA-08 | dispatch + idempotency + suppression | `vitest run test/channels/dispatch/ test/channels/suppression/ && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-03-1 | 03 | 3 | EML-01, EML-03, QA-01 | renderer + variable resolver + locale + preview | `vitest run test/channels/templates/renderer.test.ts test/channels/templates/variable-resolver.test.ts test/channels/templates/locale-variant.test.ts test/channels/templates/preview.test.ts` | ⬜ TBD | ⬜ pending |
| 223-03-2 | 03 | 3 | EML-01, EML-03, QA-12, QA-13 | content classifier (4 checks) | `vitest run test/channels/templates/content-classifier.test.ts` | ⬜ TBD | ⬜ pending |
| 223-03-3 | 03 | 3 | CRM-05, QA-01, QA-06 | approval matrix + revocation + F-131 | `vitest run test/channels/templates/approval-matrix.test.ts test/channels/templates/approval-revocation.test.ts && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-04-1 | 04 | 3 | EML-04, MSG-01, MSG-05, QA-04 | adapters (resend/twilio/knock/in_app) | `vitest run test/channels/providers/` | ⬜ TBD | ⬜ pending |
| 223-04-2 | 04 | 3 | EML-04, MSG-04, CRM-01..04, QA-07 | emit + reply continuity + auto-reply | `vitest run test/channels/events/` | ⬜ TBD | ⬜ pending |
| 223-04-3 | 04 | 3 | EML-04, MSG-04, MSG-05, QA-04, QA-08, QA-11 | webhook handlers + signature + Pitfall 8 | `vitest run test/channels/webhooks/ && npm test` | ⬜ TBD | ⬜ pending |
| 223-05-1 | 05 | 4 | EML-01..03, MSG-01..04, CRM-01..05, QA-01, QA-02 | API routes + MCP tools + tenant iso + OpenAPI | `vitest run test/channels/api/ test/channels/mcp/ && node bin/validate-flow-contracts.cjs` | ⬜ TBD | ⬜ pending |
| 223-05-2 | 05 | 4 | CRM-05, QA-01 | UI components + Storybook + Chromatic | `npm run storybook:build && npx chromatic --project-token=${CHROMATIC_PROJECT_TOKEN:-dummy} --exit-zero-on-changes --only-changed && npm test` | ⬜ TBD | ⬜ pending |
| 223-06-1 | 06 | 5 | QA-08, QA-14 | crons (deliverability/lifecycle/spike/tombstone/soft-bounce) | `vitest run test/channels/closeout/deliverability-rollup.test.ts test/channels/closeout/spike-alert.test.ts test/channels/closeout/lifecycle-journey-poll.test.ts test/channels/closeout/tombstone-cascade.test.ts test/channels/closeout/soft-bounce-promotion.test.ts` | ⬜ TBD | ⬜ pending |
| 223-06-2 | 06 | 5 | QA-09, QA-10, QA-11, QA-15 | RLS suite + legacy regression + Playwright + QA gates coverage | `vitest run test/channels/closeout/rls-suite.test.ts test/channels/closeout/legacy-regression.test.ts test/channels/closeout/qa-gates-coverage.test.ts && playwright test e2e/channels/ && npx chromatic --project-token=${CHROMATIC_PROJECT_TOKEN:-dummy} --exit-zero-on-changes` | ⬜ TBD | ⬜ pending |
| 223-06-3 | 06 | 5 | QA-15 | doc closeout (no nyquist flip; execute-phase owns it) | `node -e "<see plan 06 task 3 verify command>"` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 223-NN wave starts (likely inherited from P221/P222 Wave 0):

- [ ] `vitest.config.ts` — confirm exists (P221 Wave 0); else install
- [ ] `playwright.config.ts` — confirm exists (P221 Wave 0); else install
- [ ] `test/fixtures/channels/` — channel fixture factory directory
- [ ] `test/fixtures/channels/email-campaign.ts` — broadcast/lifecycle/transactional/revenue variants
- [ ] `test/fixtures/channels/messaging-thread.ts` — open/reply_pending/escalated/blocked variants per channel
- [ ] `test/fixtures/channels/lifecycle-journey.ts` — single-step + multi-step + branch variants
- [ ] `test/fixtures/channels/sender-identity.ts` — verified/warming/at_risk variants per class_permissions
- [ ] `test/fixtures/channels/deliverability-posture.ts` — healthy/watch/at_risk windows
- [ ] `test/fixtures/channels/template.ts` — pricing-bound + evidence-bound + multi-locale + push variants
- [ ] `test/fixtures/channels/dispatch.ts` — dispatch_attempt + dispatch_event + dispatch_skip variants
- [ ] `test/fixtures/channels/suppression.ts` — hard_bounce + complaint + manual + dsr_deletion + jurisdiction reasons
- [ ] `test/fixtures/channels/in-app-message.ts` — unread + read variants
- [ ] CDP fixtures from P221 + CRM360 fixtures from P222 reused for ConsentState + Customer360 overlay
- [ ] `package.json` — add `handlebars`, `@knocklabs/node` (push), confirm `vitest`/`playwright`

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 11 new tables) | 100% of tables | SOC2 baseline; cross-tenant denial per table |
| Per-recipient double-gate decision branches | 100% | All 5 gates (consent/suppression/frequency/quiet hours/jurisdiction) compliance-critical |
| Approval threshold matrix | 100% | All 4 layers (class × count × content × manual) tested per channel |
| Adapter contract per provider | 100% of methods | Resend + Twilio + Knock + in_app all implement send/normalizeEvent/verifyWebhookSignature |
| API contract fields (F-122..F-131) | 100% of fields | OpenAPI parity per QA-01 |
| Legacy regression (P100-P105 + P221 + P222) | 100% green | P223 substitutes consent SOR + dispatch path; any regression is data-integrity bug |
| Negative-path | ≥2 per gate × per channel | Fail-closed must be actively proven |
| Pricing copy enforcement | 100% — pricing variables resolve through Pricing Engine OR `{{MARKOS_PRICING_ENGINE_PENDING}}` | P211 D-23 / CLAUDE.md placeholder rule |
| Webhook signature verification | 100% — every provider has signature test | Replay/spoof protection |
| Reply continuity | 100% — every channel creates MessagingThread + Customer360 + CRM task | Doc 21 thread-first |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 223-01 | Schema CRUD, adapter capability extension | Sender verification flow | F-122..F-126 | P104 outbound tests still green | Cross-tenant, sender unverified send blocked | n/a | n/a |
| 223-02 | Per-recipient gate (5 sub-gates), dispatch_attempt_id idempotency | ConsentState read via P221 adapter, AgentRun bridge stub | F-127 | P104 evaluateOutboundEligibility passes against new backend | Each gate fails fail-closed; opt-out propagation; bounce → suppression | n/a | n/a |
| 223-03 | Handlebars rendering, variables_schema validation, content classifier | Approval threshold matrix (4 layers × 4 channels) | F-128 (template + dispatch contracts) | Existing template approval passes | Pricing without approval blocked, missing variable skips recipient | TemplateEditor preview flow | TemplateEditor (empty/preview/error) |
| 223-04 | Adapter send + normalizeEvent per provider, signature verification, in_app store | Reply normalization → MessagingThread + Customer360 + CRM task | F-129 | Existing webhook routes still parse | Webhook signature mismatch 401, reply on tombstoned profile rejected | Reply flow operator queue | n/a |
| 223-05 | API route handlers, MCP tool payloads, DeliverabilityWorkspace queries | End-to-end campaign create → approve → dispatch | F-130, F-131 | P208 Approval Inbox accepts new entry types | Cross-tenant API denied, MCP rate limit | Campaign create + approve + dispatch + reply + bounce | ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, ApprovalReviewPanel |
| 223-06 | Deliverability cron 24h rollup, spike alert detector | Full RLS suite, full reply continuity, journey trigger evaluation | All 10 F-IDs registered | All P100-P105 + P221 + P222 tests green | Missing tenant fail-closed, queue replay safety | Full operator journey (campaign + thread + journey + reply + dispatch) | LifecycleJourneyEditor, full panel suite |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `email-campaign.ts` | broadcast/lifecycle/transactional/revenue per class; pricing-touching variant | 223-01..06 |
| `messaging-thread.ts` | open/reply_pending/escalated/blocked × whatsapp/sms/push/in_app | 223-01..06 |
| `lifecycle-journey.ts` | single-step + multi-step + branch_logic + paused | 223-01..06 |
| `sender-identity.ts` | verified/warming/watch/at_risk × class_permissions matrix | 223-01..06 |
| `deliverability-posture.ts` | healthy/watch/at_risk × bounce/complaint distributions | 223-01..06 |
| `template.ts` | pricing-bound/evidence-bound/multi-locale/push variants | 223-03..06 |
| `dispatch.ts` | dispatch_attempt + dispatch_event + dispatch_skip × all 5 gate failures | 223-02..06 |
| `suppression.ts` | hard_bounce + complaint + manual + dsr_deletion + jurisdiction | 223-02..06 |
| `in-app-message.ts` | unread + read variants | 223-04..06 |
| P221 `test/fixtures/cdp/*` reuse | ConsentState + AudienceSnapshot + TraitSnapshot | all slices |
| P222 `test/fixtures/crm360/*` reuse | Customer360 + Opportunity + nba_records | all slices |

Location: `test/fixtures/channels/`. Importable from all channel test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.ts` CRUD + RLS + tombstone cases."
- Consent cutover criteria: "Verified by `consent-cutover.test.ts` ConsentState-only path + P104 regression."
- Double-gate criteria: "Verified by `dispatch-gate.test.ts` — all 5 sub-gates × all 4 channels = 20 negative-path cases minimum."
- Approval criteria: "Verified by `approval-matrix.test.ts` — class × count × content × manual matrix; all 4 layers."
- Adapter criteria: "Verified by `<provider>-adapter.test.ts` send + normalizeEvent + verifyWebhookSignature."
- Reply criteria: "Verified by `reply-continuity.test.ts` — thread + Customer360 + CRM task creation per channel."
- Pricing criteria: "Verified by `pricing-binding.test.ts` — Pricing Engine resolution OR `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder."
- RLS criteria: "Verified by `rls-suite.test.ts` cross-tenant denial on all 11 new tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P221 + P222 suites green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sender warmup operator workflow | EML-02 | Multi-day warmup process | (1) Create unverified sender, (2) Verify DKIM/SPF/DMARC via DNS, (3) Confirm reputation_status transitions warming → healthy, (4) Class_permissions gate allows broadcast |
| Push delivery on physical device | MSG-03 | Requires real FCM/APNS token | (1) Register device, (2) Knock dispatch, (3) Verify push received within 30s, (4) Track delivery webhook |
| Email inbox placement | EML-01 | External provider behavior (Gmail/Outlook spam folder) | (1) Send to seed addresses across providers, (2) Inspect inbox vs spam placement, (3) Confirm no provider warning |
| WhatsApp 24h session window | MSG-02 | Real WhatsApp business rules | (1) Trigger initial template, (2) Verify free-form messaging window opens, (3) After 24h verify only templated messages allowed |
| Approval inbox UX flow | EML-05, MSG-05 | Operator judgment | (1) Create high-risk campaign, (2) Confirm Approval Inbox entry, (3) Approve → status transition, (4) Reject → status + audit row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 120s quick / 10 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
