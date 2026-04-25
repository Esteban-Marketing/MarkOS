---
phase: 227
slug: ecosystem-partner-community-developer-growth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 227 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `227-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Vitest (Phase 204+ doctrine) |
| **Framework (legacy regression)** | Node.js `--test` (`npm test`) |
| **E2E framework** | Playwright |
| **Visual regression** | Chromatic via Storybook |
| **Webhook signature** | HMAC-SHA256 (5 sources) + Ed25519 (Discord) |
| **Vitest config** | inherited from P221-P226 Wave 0 |
| **Playwright config** | inherited from P221-P226 Wave 0 |
| **Quick run command** | `vitest run test/ecosystem/` |
| **Full suite command** | `vitest run && npm test && npx playwright test --grep "ecosystem\|marketplace\|developers"` |
| **Estimated runtime** | ~150s quick, ~13 min full |

---

## Sampling Rate

- **After every task commit:** `vitest run test/ecosystem/<slice-domain>`
- **After every plan wave:** `vitest run test/ecosystem/ && npm test`
- **Before `/gsd:verify-work`:** Full suite green
- **Max feedback latency:** 150s quick, 13 min full

---

## Per-Task Verification Map

> Planner populates per task. Template below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 227-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative/e2e | `vitest run test/ecosystem/<file>.test.ts` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 227-NN wave starts (likely inherited from P221-P226 Wave 0):

- [ ] `vitest.config.ts` — confirm exists
- [ ] `playwright.config.ts` — confirm exists
- [ ] `test/fixtures/ecosystem/` — fixture factory directory
- [ ] `test/fixtures/ecosystem/integration-listing.ts` — category × certification_state × owner_type variants
- [ ] `test/fixtures/ecosystem/partner-profile.ts` — partner_type × certification_level × business_mode variants (extends P220 fixtures)
- [ ] `test/fixtures/ecosystem/certification-record.ts` — state machine + criteria_checks variants
- [ ] `test/fixtures/ecosystem/referral-program.ts` — fraud_controls + payout_settings variants (extends P220 referral fixtures)
- [ ] `test/fixtures/ecosystem/affiliate-program.ts` — commission_model × tier variants
- [ ] `test/fixtures/ecosystem/community-signal.ts` — 6 source × sentiment × urgency variants
- [ ] `test/fixtures/ecosystem/developer-event.ts` — event_kind variants
- [ ] `test/fixtures/ecosystem/co-sell-opportunity.ts` — state machine variants + commission immutability
- [ ] `test/fixtures/ecosystem/fraud-signal.ts` — signal_kind × severity × status variants
- [ ] `test/fixtures/ecosystem/payout-credit.ts` — earned/cleared/paid/disputed/voided variants
- [ ] `test/fixtures/ecosystem/install-request.ts` — status state machine variants
- [ ] `test/fixtures/ecosystem/listing-view.ts` — anonymous + authenticated variants
- [ ] CDP/CRM360/conversion/analytics/sales fixtures from P221-P226 reused
- [ ] P220 fixtures extended (partner_profiles, referral_programs, community_profiles, marketing_events, partnerships) with business_mode variants
- [ ] `package.json` — confirm `@vercel/edge-config` for HMAC + Ed25519 keys; confirm Next.js for /marketplace/[...slug] + /developers/[...slug] catch-all routes

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (12 new tables + 5 P220 extended + P225/P221 ALTER) | 100% of tables | SOC2 baseline |
| Plugin registry read-through adapter | 100% — adapter never mutates plugin registry | D-09..D-11 boundary |
| Certification state machine | 100% — 7 states × 12 transitions × criteria_checks | D-15..D-19 |
| Recertification cron | 100% — 30d-warning + 12-month-expiry + listing hide | D-17 |
| Webhook signature (HMAC-SHA256 + Ed25519) | 100% per source — tampered → 401 + audit | D-25, D-63 |
| CommunitySignal dedupe | 100% — UNIQUE (source, source_message_id) | D-26 |
| ConsentState gate (community_signal_processing) | 100% — gated ingest + tenant policy | D-27 |
| Fraud rule engine | 100% per signal_kind × severity × decision_rule integration | D-20..D-24 |
| Payout credits ledger | 100% — earned → cleared → paid + dispute flow + manual CSV export | D-22..D-24 |
| CoSellOpportunity state sync with P222 Opportunity | 100% — same-transaction sync; commission immutable post-acceptance | D-30..D-32 |
| Ecosystem attribution (P225 extension) | 100% — FK columns nullable; CHECK at-most-one ecosystem ref | D-34 |
| Marketplace SSR + ISR + uncertified-hidden | 100% — uncertified listings 404; certified live | D-37, D-40 |
| Public BotID + rate-limit + honeypot + ip_hash (carry P224/P226) | 100% on /marketplace + contact + install-request | D-43, D-61 |
| install_request flow | 100% — visitor → operator approval → install OR rejection + audit | D-37, D-38 |
| Tombstone propagation (P221 → P227 cascade) | 100% per affected table | D-62 |
| `{{MARKOS_PRICING_ENGINE_PENDING}}` on payout copy + commission_share | 100% on partner-facing materials | D-23, D-46 |
| Polymorphic certification_records.subject_type+subject_id CHECK | 100% — listing OR partner only | D-07 |
| Legacy regression (P100-P105 + P201 + P220 + P221-P226) | 100% green | Additive phase |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 227-01 | Schema CRUD; P220 ALTER TABLE backfill; plugin adapter | RLS isolation; cross-tenant denial; FK + CHECK | F-181..F-188 | P100-P105/P201/P220/P221-P226 green | P220 SAS rows preserved; ALTER backfill business_mode='saas' | n/a | n/a |
| 227-02 | IntegrationListing CRUD; listing_views aggregation; install_request state machine | Plugin registry read-through; SSR cacheTag; install approval flow | F-189..F-191 | P202 MCP marketplace still green | Uncertified listing 404 on public; install bypass blocked | n/a | n/a |
| 227-03 | PartnerProfile extension; CertificationRecord state machine; criteria_checks JSONB | Recertification cron; 12-month expiry; listing hide on expire | F-192 | P220 partner queries still green | Stale cert listing hidden; revoked terminal; backfill verify | n/a | n/a |
| 227-04 | Referral fraud rules; Affiliate commission tiers; payout_credits ledger | Decision_rules engine integration; manual CSV export; dispute flow | F-193, F-194 | P220 referral SAS-mode green | Self-referral blocked; legitimate referral cleared on review | n/a | n/a |
| 227-05 | Webhook adapters per source (signature + dedupe); ConsentState gate | Community signal routing via decision_rules; developer_events ingestion; cdp_events emit | F-195 | P220 community + marketing_events green | Tampered webhook 401; missing consent blocks ingest; replay rejected | n/a | n/a |
| 227-06 | CoSellOpportunity state machine + commission immutability; ecosystem attribution_touches FK | P222 Opportunity sync; P226 DealRoom + handoff_record link; P225 attribution extend | F-196 | P225 attribution_models still resolve; P226 DealRoom green | Commission edit post-acceptance rejected; orphan FK rejected | n/a | n/a |
| 227-07 | API route handlers; 8 MCP tools; 7 UI workspaces | Cross-tenant API denial; OpenAPI parity; Approval Inbox + Morning Brief; observability cron | F-197, F-198 | All P100-P105 + P201 + P220 + P221-P226 green | Marketplace SEO leak (uncertified) blocked; cosell deal handoff e2e | Full operator journey (cert review + listing publish + fraud review + community signal route + cosell flow) + public marketplace flow | EcosystemWorkspace + PartnerDirectory + MarketplaceListings + CertificationReview + ReferralAdmin + AffiliateAdmin + CommunitySignalInbox + CoSellCockpit (8 components × 4 variants) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `integration-listing.ts` | category × certification_state × owner_type × pricing_model | 227-02..07 |
| `partner-profile.ts` | partner_type × certification_level × business_mode × public_directory | 227-03..07 |
| `certification-record.ts` | 7 states × criteria_checks JSONB × expiration | 227-03..07 |
| `referral-program.ts` | fraud_controls + payout_settings + business_mode | 227-04..07 |
| `affiliate-program.ts` | commission_model × tier_thresholds | 227-04..07 |
| `community-signal.ts` | 6 sources × sentiment × urgency × routed_action_kind | 227-05..07 |
| `developer-event.ts` | 7 event_kinds × product_area | 227-05..07 |
| `co-sell-opportunity.ts` | state machine × commission immutability × P222 Opportunity link | 227-06..07 |
| `fraud-signal.ts` | 8 signal_kinds × severity × status | 227-04..07 |
| `payout-credit.ts` | full state lifecycle × dispute | 227-04..07 |
| `install-request.ts` | status state machine × markos-owned vs partner-owned | 227-02..07 |
| `listing-view.ts` | anonymous + authenticated × ip_hash | 227-02..07 |
| P220 extended fixtures | business_mode='saas'/'commerce'/'ecosystem'/'all' variants | all slices |
| P221 cdp/* reuse | ConsentState + cdp_events for tombstone | all slices |
| P222 crm360/* reuse | Customer360 + Opportunity for CoSell | 227-06..07 |
| P224 conversion/* reuse | BotID pattern | 227-02 (install), 227-07 (marketplace) |
| P225 analytics/* reuse | attribution_touches + decision_rules | 227-04..07 |
| P226 sales/* reuse | DealRoom + handoff_record + ProofPack | 227-06..07 |

Location: `test/fixtures/ecosystem/`. Importable from all ecosystem test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.ts` CRUD + RLS + FK + tombstone."
- Plugin adapter: "Verified by `plugin-registry-adapter.test.ts` — read-through never mutates registry."
- Certification: "Verified by `certification-state-machine.test.ts` + `recertification-cron.test.ts` — 12-month expiry + listing hide."
- Webhook signature: "Verified by `webhook-{source}-signature.test.ts` per source — HMAC-SHA256 OR Ed25519 (Discord) + audit on failure."
- ConsentState gate: "Verified by `community-signal-consent-gate.test.ts` — missing consent blocks ingest."
- Fraud rules: "Verified by `fraud-rule-{signal_kind}.test.ts` — 8 signal_kinds × severity matrix."
- Payout credits: "Verified by `payout-credits-ledger.test.ts` + `payout-csv-export.test.ts` + `payout-dispute-flow.test.ts`."
- CoSellOpportunity: "Verified by `cosell-state-machine.test.ts` + `cosell-commission-immutable.test.ts` + `cosell-p222-sync.test.ts`."
- Ecosystem attribution: "Verified by `attribution-touches-ecosystem-fk.test.ts` + `attribution-channel-enum-extend.test.ts`."
- Marketplace SSR + ISR: "Verified by `marketplace-isr.test.ts` + `marketplace-uncertified-hidden.test.ts` + Playwright."
- BotID + rate-limit: "Verified by `marketplace-bot-rate-limit.test.ts` (carry P224/P226 patterns)."
- install_request: "Verified by `install-request-flow.test.ts` + `install-bypass-blocked.test.ts`."
- Tombstone cascade: "Verified by `tombstone-cascade-ecosystem.test.ts` per affected table."
- `{{MARKOS_PRICING_ENGINE_PENDING}}`: "Verified by `pricing-pending-payout.test.ts` + `pricing-pending-commission.test.ts`."
- RLS: "Verified by `rls-suite.test.ts` cross-tenant denial on all 12 new + 5 P220 extended tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P201 + P220 + P221-P226 green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public marketplace SEO + Open Graph | ECO-01 | External crawler behavior | (1) Publish certified listing, (2) inspect via Twitter Card Validator + Facebook Debugger, (3) confirm OG + JSON-LD SoftwareApplication structured data |
| Webhook signature against real Slack/Discord/GitHub | ECO-04 | External provider real signatures | (1) Configure webhook in real provider, (2) send test event, (3) verify signature passes + signal ingested + audit row |
| Certification operator review flow | ECO-02 | Multi-day operator judgment | (1) Submit listing/partner for cert, (2) operator reviews criteria_checks, (3) approves/suspends/revokes via Approval Inbox, (4) confirm state + listing visibility |
| Fraud signal manual review | ECO-04 | Operator judgment on edge cases | (1) Trigger fraud signal (synthetic self-referral), (2) operator reviews queue, (3) confirms or dismisses, (4) verify payout_credits.fraud_review_status flips |
| Manual CSV payout export | ECO-04 | Finance team review of export | (1) Run weekly payout export cron, (2) finance reviews CSV, (3) confirms format + amounts + currency, (4) imports into Stripe/payroll |
| install_request operator approval | ECO-01 | Multi-step approval flow | (1) Visitor submits install request, (2) operator reviews via Approval Inbox, (3) approves → markos-owned auto-installs OR partner-owned manifest review, (4) verify install_completed_at |
| CoSellOpportunity flow with real partner | ECO-03 | Cross-tenant partner involvement | (1) Create co_sell_opportunity, (2) partner accepts via partner-portal API, (3) tracks deal through P222 stage transitions, (4) confirms commission_share + LaunchSurface partner_pack ref + DealRoom + handoff_record + winloss_record |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 150s quick / 13 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
