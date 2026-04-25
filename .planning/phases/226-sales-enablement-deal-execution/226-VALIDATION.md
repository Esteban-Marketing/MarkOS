---
phase: 226
slug: sales-enablement-deal-execution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 226 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `226-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Vitest (Phase 204+ doctrine) |
| **Framework (legacy regression)** | Node.js `--test` (`npm test`) |
| **E2E framework** | Playwright |
| **Visual regression** | Chromatic via Storybook |
| **LLM testing** | Vercel AI Gateway with mock provider for DealBrief tests |
| **Vitest config** | inherited from P221-P225 Wave 0 |
| **Playwright config** | inherited from P221-P225 Wave 0 |
| **Quick run command** | `vitest run test/sales/` |
| **Full suite command** | `vitest run && npm test && npx playwright test --grep sales` |
| **Estimated runtime** | ~150s quick, ~13 min full |

---

## Sampling Rate

- **After every task commit:** `vitest run test/sales/<slice-domain>`
- **After every plan wave:** `vitest run test/sales/ && npm test`
- **Before `/gsd:verify-work`:** Full suite (Vitest + node --test + Playwright + Chromatic) green
- **Max feedback latency:** 150s (quick), 13 min (full)

---

## Per-Task Verification Map

> Planner populates per task. Template below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 226-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative/e2e | `vitest run test/sales/<file>.test.ts` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 226-NN wave starts (likely inherited from P221-P225 Wave 0):

- [ ] `vitest.config.ts` — confirm exists; else install
- [ ] `playwright.config.ts` — confirm exists; else install
- [ ] `test/fixtures/sales/` — sales fixture factory directory
- [ ] `test/fixtures/sales/battlecard.ts` — competitor + freshness variants
- [ ] `test/fixtures/sales/objection-library.ts` — library + entry + per-deal record variants
- [ ] `test/fixtures/sales/deal-brief.ts` — auto-drafted + operator-edited + handoff-regenerated variants
- [ ] `test/fixtures/sales/proof-pack.ts` — 6 audience_types × draft/approved/stale variants
- [ ] `test/fixtures/sales/deal-room.ts` — draft/live/closed × stakeholder views
- [ ] `test/fixtures/sales/proposal-support.ts` — draft/approved/sent/accepted/rejected
- [ ] `test/fixtures/sales/quote.ts` — snapshot/superseded/expired variants
- [ ] `test/fixtures/sales/winloss-record.ts` — won/lost/no_decision × reason taxonomy variants
- [ ] `test/fixtures/sales/handoff-record.ts` — marketing→deal, deal→cs handoff variants
- [ ] `test/fixtures/sales/deal-health-signal.ts` — score range × risk_factor variants
- [ ] CDP/CRM360/conversion/analytics fixtures from P221-P225 reused
- [ ] `package.json` — confirm `@vercel/edge-config` available for HMAC key storage; confirm Next.js for `/share/dr/[token]` route

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 15 new tables) | 100% of tables | SOC2 baseline |
| Battlecard freshness inheritance | 100% — stale claim → stale battlecard | Doc 24 rule 4 + D-17 |
| ProofPack snapshot + EvidenceMap refresh | 100% — claim TTL exceeded → freshness_status='stale_claims' | D-11..D-13 |
| Quote-as-Snapshot immutability | 100% — Quote.status='sent' rejects writes; pricing change → new Quote required | D-21..D-24 |
| Class-based approval matrix | 100% — battlecard auto + ProposalSupport/ProofPack/DealRoom share/Quote required | D-25..D-28 |
| DealRoom share-link HMAC | 100% — token tampering returns 410; rate-limit triggers 429 | D-29/D-33 |
| WinLossRecord required on stage_transition | 100% — stage→customer/lost/no_decision blocks without WinLossRecord | D-40 |
| Tombstone propagation | 100% per affected table (winloss_records.champion_id, objection_records, deal_room_views) | P221 D-24 cascade |
| {{MARKOS_PRICING_ENGINE_PENDING}} on pricing-touching | 100% per ProposalSupport + DealBrief + battlecard pricing copy | P211 + CLAUDE.md |
| Polymorphic deal_room_artifacts CHECK | 100% per artifact_kind (proof_pack, deal_brief, battlecard, quote, proposal_support, case_study, video, custom_html) | D-05 |
| Legacy regression (P100-P105 + P201 + P221-P225) | 100% green | Additive phase |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 226-01 | Schema CRUD; fixture factories; base contracts | RLS isolation; cross-tenant denial; FK integrity to P205/P209/P221/P222 | F-163..F-172 | P100-P105/P201/P221-P225 green | Cross-tenant; tombstoned profile FK behavior | n/a | n/a |
| 226-02 | Battlecard freshness inheritance; ObjectionLibrary CRUD; ProofPack snapshot + version | EvidenceMap claim TTL refresh; render-time fail-closed; freshness_audit cron | F-173..F-175 | n/a | Stale battlecard add to deal_room rejected; ProofPack with stale claim render-time 503 | n/a | n/a |
| 226-03 | DealBrief auto-draft + LLM mock; deal_health_signals composite; handoff_record creation | P222 lifecycle hook → DealBrief regen; handoff acknowledge SLA cron; cdp_events emit | F-176 | n/a | Handoff 24h SLA missed → escalation; debounce regen 1h/opp | n/a | n/a |
| 226-04 | Quote snapshot immutability; ProposalSupport state machine; content classifier reuse | Pricing change post-sent → new Quote; pricing_signals consumer; class-based approval routing | F-177 | n/a | Quote.status='sent' write rejected; pricing variable unbound → blocks send | n/a | n/a |
| 226-05 | DealRoom + artifacts polymorphic CHECK; share_link_token HMAC; view tracking ip_hash | Public /share/dr/{token} BotID + rate-limit + honeypot; expiry cron auto-close; WinLossRecord required | F-178/F-179 | n/a | Tampered token 410; rate-limit 429; expired share 410; WinLossRecord skip blocks stage transition | Public share view flow; WinLossRecord submit | DealRoom artifact preview + share state |
| 226-06 | API route handlers; 8 MCP tools | Cross-tenant API denial; OpenAPI parity; approval routing | F-180 + all 18 F-IDs registered | n/a | Cross-tenant 403; missing approval blocks publish | n/a | n/a |
| 226-07 | UI components; observability cron handlers | Approval Inbox + Morning Brief integration; spike alerts; freshness audit | n/a | All P100-P105 + P201 + P221-P225 green | DealRoom view spike alert; missing WinLoss coverage | Full operator journey (battlecard editor + DealRoom build + handoff acknowledge + WinLoss submit) | SalesEnablementWorkspace + DealCockpit + BattlecardEditor + ProofPackBuilder + WinLossAnalyzer + DealRoomViewer (6 components × 4 variants) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `battlecard.ts` | competitor variants × freshness states (fresh/stale_claims/stale_competitor/retired) | 226-02..07 |
| `objection-library.ts` | library + entries × 8 categories × per-deal records × status states | 226-02..07 |
| `deal-brief.ts` | auto_drafted/operator_created/regenerated_on_handoff × 4 status × multi-version | 226-03..07 |
| `proof-pack.ts` | 6 audience_types × draft/pending/approved/retired × fresh/stale_claims | 226-02..07 |
| `deal-room.ts` | draft/live/closed × stakeholder_views × expiry-near | 226-05..07 |
| `proposal-support.ts` | full state machine variants | 226-04..07 |
| `quote.ts` | snapshot/superseded/expired/accepted variants | 226-04..07 |
| `winloss-record.ts` | won/lost/no_decision × 13 primary_reason × competitive_set variants | 226-05..07 |
| `handoff-record.ts` | marketing→deal/deal→cs/cs→ae × acknowledged/missed-SLA | 226-03..07 |
| `deal-health-signal.ts` | composite score variants × risk_factor enums | 226-03..07 |
| P221 cdp/* reuse | ConsentState + cdp_events for tombstone | all slices |
| P222 crm360/* reuse | Customer360 + Opportunity + buying_committees + lifecycle_transitions | all slices |
| P224 conversion/* reuse | BotID + rate-limit pattern | 226-05 (DealRoom share) |
| P225 analytics/* reuse | attribution_touches + narrative templates | 226-03 (DealBrief), 226-05 (WinLoss) |

Location: `test/fixtures/sales/`. Importable from all sales test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.ts` CRUD + RLS + FK + tombstone."
- Battlecard freshness: "Verified by `battlecard-freshness-inheritance.test.ts` — stale claim → stale battlecard."
- ProofPack: "Verified by `proof-pack-snapshot.test.ts` + `proof-pack-claim-refresh.test.ts`."
- DealBrief: "Verified by `dealbrief-auto-draft.test.ts` + `dealbrief-handoff-regen.test.ts` + `dealbrief-debounce.test.ts`."
- Quote immutability: "Verified by `quote-snapshot-immutable.test.ts` + `quote-pricing-drift.test.ts`."
- Approval matrix: "Verified by `class-based-approval.test.ts` — battlecard auto vs ProposalSupport required."
- DealRoom share: "Verified by `share-link-hmac.test.ts` + `dealroom-bot-rate-limit.test.ts` + `dealroom-expiry.test.ts`."
- WinLoss: "Verified by `winloss-required-on-transition.test.ts` + `winloss-attribution-link.test.ts`."
- Handoff: "Verified by `handoff-record.test.ts` + `handoff-acknowledge-sla.test.ts`."
- deal_health_signals: "Verified by `deal-health-composite.test.ts` + `deal-health-emit.test.ts`."
- Tombstone: "Verified by `tombstone-cascade-sales.test.ts` — winloss + objection + deal_room_views."
- RLS: "Verified by `rls-suite.test.ts` cross-tenant denial on all 15 new tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P201 + P221-P225 green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public DealRoom UX in browser | SEN-04 | External rendering + share-link real session | (1) Create DealRoom + enable share + open share-link in incognito browser, (2) verify artifacts render, (3) verify view tracking row appears |
| DealBrief operator approval flow | SEN-02 | Multi-stakeholder review | (1) Trigger lifecycle_transition to opportunity, (2) operator reviews auto-draft, (3) edits + approves via Approval Inbox, (4) confirms acknowledged on handoff |
| Quote snapshot post-Pricing-Engine update | SEN-03, PRC-04 | Multi-day pricing change | (1) Send Quote, (2) operator updates Pricing Engine, (3) verify Quote.status='sent' immutable, (4) operator triggers new Quote with new snapshot |
| WinLoss reason taxonomy completeness | SEN-05 | Operator judgment on edge cases | (1) Close 5 deals across won/lost/no_decision, (2) operator fills WinLossRecord, (3) verify all 13 reason_taxonomy values are operator-meaningful, (4) confirm no need for "Other" escape hatch |
| Battlecard freshness operator-override clarity | SEN-01 | UX for inheritance vs override | (1) Battlecard last_verified_at recent, (2) underlying claim_ref TTL exceeded in P209, (3) verify UI shows "stale_claims" not "fresh", (4) operator cannot mark "verified" without addressing claim |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 150s quick / 13 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
