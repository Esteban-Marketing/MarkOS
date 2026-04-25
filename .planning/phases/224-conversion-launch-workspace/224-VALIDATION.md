---
phase: 224
slug: conversion-launch-workspace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 224 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `224-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Vitest (Phase 204+ doctrine) |
| **Framework (legacy regression)** | Node.js `--test` (`npm test`) |
| **E2E framework** | Playwright |
| **Visual regression** | Chromatic via Storybook |
| **Vitest config** | inherited from P221/P222/P223 Wave 0 |
| **Playwright config** | inherited from P221/P222/P223 Wave 0 |
| **Quick run command** | `vitest run test/conversion/ test/launches/` |
| **Full suite command** | `vitest run && npm test && npx playwright test --grep "conversion\|launches"` |
| **Estimated runtime** | ~150s quick, ~12 min full |

---

## Sampling Rate

- **After every task commit:** `vitest run test/<conversion|launches>/<slice-domain>`
- **After every plan wave:** `vitest run test/conversion/ test/launches/ && npm test`
- **Before `/gsd:verify-work`:** Full suite (Vitest + node --test + Playwright + Chromatic) green
- **Max feedback latency:** 150s (quick), 12 min (full)

---

## Per-Task Verification Map

> Planner populates per task. Template row below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 224-NN-MM | NN | W | REQ-XX | unit/integration/contract/regression/negative/e2e | `vitest run test/<conversion|launches>/<file>.test.ts` | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Verify before any 224-NN wave starts (likely inherited from P221/P222/P223 Wave 0):

- [ ] `vitest.config.ts` — confirm exists; else install
- [ ] `playwright.config.ts` — confirm exists; else install
- [ ] `test/fixtures/conversion/` — conversion fixture factory directory
- [ ] `test/fixtures/conversion/page.ts` — landing/signup/demo/pricing/launch/webinar/offer/thank_you/content_download/upgrade variants per page_type
- [ ] `test/fixtures/conversion/form.ts` — contact_capture/demo_request/trial_signup/content_download/waitlist/webinar_registration/purchase/upgrade variants
- [ ] `test/fixtures/conversion/cta.ts` — primary/secondary variants
- [ ] `test/fixtures/conversion/event.ts` — surface_kind × objective combinations
- [ ] `test/fixtures/conversion/experiment.ts` — draft/active/paused/completed; with 2-variant + 3-variant traffic_split
- [ ] `test/fixtures/conversion/blocks.ts` — 15 block types with valid + invalid payloads
- [ ] `test/fixtures/launches/brief.ts` — feature/pricing/integration/campaign/event/beta/market_entry variants per launch_type
- [ ] `test/fixtures/launches/surface.ts` — 8 surface_type × 5 status state machine variants
- [ ] `test/fixtures/launches/gate.ts` — 4 gate kinds × passing/blocking/waived variants
- [ ] `test/fixtures/launches/runbook.ts` — single-step + multi-step + branch + reversible/non-reversible
- [ ] `test/fixtures/launches/outcome.ts` — T+7/T+14/T+30 windows
- [ ] `test/fixtures/launches/readiness.ts` — completed/incomplete check variants
- [ ] CDP/CRM360/channels fixtures from P221/P222/P223 reused for ConsentState + Customer360 + email_campaign refs
- [ ] `package.json` — add `xxhash-wasm` (or equivalent) for sticky-hash assignment; confirm Next.js 13.5+ for cacheTag/updateTag

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 13 new tables) | 100% of tables | SOC2 baseline; cross-tenant denial per table |
| Block schema validators (15 block types) | 100% of types | Page composition integrity; doc 23 rule 2 |
| LaunchGate evaluator (4 kinds × statuses × waiver) | 100% of branches | Pre-publish enforcement; doc 26 readiness rule 4 |
| Single fan-out emit() (7 sinks transactional) | 100% — including partial-failure rollback | Conversion event integrity for downstream attribution |
| Polymorphic LaunchSurface CHECK | 100% per surface_kind | Orphan FK prevention |
| Experiment sticky-hash determinism | 100% — same identity always same variant | A/B test integrity |
| Pre-publish content classifier | 100% — currency patterns + claim shapes detected | Pricing leak prevention |
| Runtime placeholder enforcement | 100% — `{{pricing.*}}` + `{{evidence.*}}` resolution | Defense-in-depth |
| Runbook reverse-rollback | 100% — including non-reversible step handling | Doc 26 reversibility |
| ISR cacheTag/updateTag | 100% on publish + rollback transitions | Cache desync prevention |
| BotID + rate-limit + honeypot | 100% on public form submit | Public surface abuse prevention |
| Legacy regression (P100-P105 + P201 + P221 + P222 + P223) | 100% green | Additive phase; any regression = bug |
| `{{MARKOS_PRICING_ENGINE_PENDING}}` enforcement | 100% on pricing-touching pages + launch surfaces | P211 + CLAUDE.md rule |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Playwright | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 224-01 | Schema CRUD; block validators (15 types); fixture factories | Wave 0 verify; ingest.js retrofit; identify.js wiring stub | F-132..F-141 | P100-P105/P201/P221/P222/P223 green | Cross-tenant; invalid block JSON rejected | n/a | n/a |
| 224-02 | Single fan-out emit() (7 sinks); BotID gate; rate-limit; honeypot; identity stitch | ConsentState double-gate at submit; Customer360 lifecycle progression; NBA recompute trigger | F-142 conversion-event-write | P101 stitching tests still green | Partial-write rollback; double-submit dedup; BotID outage fail-closed | Public form submit + abuse paths | n/a |
| 224-03 | Page renderer SSR; FormRenderer; ISR cacheTag/updateTag; SEO meta; performance budget | Next.js dynamic catch-all route; legacy marketing routes coexist | F-142 page-render-write | P201 signup route still works | Render-time fail-closed on unresolved variables; render budget violation | Public page render; form preview | PageEditor preview; FormEditor preview; CTA variants |
| 224-04 | LaunchGate evaluators (4 kinds); waiver flow; LaunchSurface state machine; polymorphic CHECK; LaunchOutcome computation | Pre-publish gate blocks publish; readiness checks completion; outcome cron at T+7/T+14/T+30 | F-143..F-145 launch-{brief,surface,gate} | P208 Approval Inbox accepts new entries | Gate fails-closed on missing pricing/evidence; orphan surface_target_id rejected | LaunchCockpit gates panel + readiness board | LaunchReadinessBoard + GatesPanel states |
| 224-05 | Experiment sticky-hash; traffic_split renderer; variant_id capture; assignment immutability | conversion_events.experiment_variant_id populated; bucket determinism across requests | (no new F-IDs; uses F-142 conversion-event extension) | n/a | traffic_split mutation post-active rejected; new visitor rebucket if status=draft | Experiment create + traffic split + variant assignment | n/a |
| 224-06 | LaunchRunbook execution; reverse-runbook rollback; AgentRun bridge; cron handlers (deliverability, gate poll, outcome, surface health, spike alert) | Runbook step idempotency; rollback continues past non-reversible step; AgentRun cancel/pause | F-146 launch-runbook-execute | All P207 AgentRun tests green | Non-reversible step → operator task; runbook step retry idempotency | RunbookEditor + execution flow + rollback flow | RunbookEditor states |
| 224-07 | API route handlers; MCP tools (6); workspace components | Cross-tenant API denial; OpenAPI parity; Approval Inbox + Morning Brief integration | All 15 F-IDs registered | All P100-P105 + P201 + P221 + P222 + P223 green | Cross-tenant API 403; MCP rate-limit; missing approval blocks publish | Full operator journey (page+form+launch+experiment+runbook+rollback) | ConversionWorkspace + LaunchCockpit + all editors (5 components × 4 variants) |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `conversion/page.ts` | 10 page_type variants × draft/published/archived statuses | 224-01..07 |
| `conversion/form.ts` | 8 objective variants × identity-stitch on/off × consent-capture variants | 224-01..07 |
| `conversion/cta.ts` | primary/secondary × audience-bound | 224-01..07 |
| `conversion/event.ts` | surface_kind × objective × experiment_variant_id (nullable) | 224-02..07 |
| `conversion/experiment.ts` | draft/active/paused/completed × 2-variant + 3-variant traffic_split | 224-05..07 |
| `conversion/blocks.ts` | 15 block types valid + invalid payloads | 224-01..03 |
| `launches/brief.ts` | 7 launch_type × planning/pending_approval/ready/live/completed/rolled_back | 224-04..07 |
| `launches/surface.ts` | 8 surface_type × 5 status states × per-kind valid surface_target_id | 224-04..07 |
| `launches/gate.ts` | 4 kinds × passing/blocking/waived/pending | 224-04..07 |
| `launches/runbook.ts` | single-step + multi-step + branch + reversible/non-reversible mix | 224-06..07 |
| `launches/outcome.ts` | T+7/T+14/T+30 with reach/signups/pipeline/influenced_revenue | 224-04..07 |
| `launches/readiness.ts` | completed/incomplete × 6 check_kind variants | 224-04..07 |
| P221 `test/fixtures/cdp/*` reuse | ConsentState + AudienceSnapshot for double-gate | all slices |
| P222 `test/fixtures/crm360/*` reuse | Customer360 + Opportunity for fan-out + LaunchOutcome attribution | 224-02..07 |
| P223 `test/fixtures/channels/*` reuse | email_campaign + messaging_thread for LaunchSurface targets | 224-04..07 |

Location: `test/fixtures/conversion/` and `test/fixtures/launches/`. Importable from all slice tests.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Schema criteria: "Verified by `<table>.test.ts` CRUD + RLS + state machine cases."
- Block validator criteria: "Verified by `blocks.test.ts` — all 15 block types valid + invalid payloads."
- Fan-out emit() criteria: "Verified by `emit-fan-out.test.ts` — 7 sinks transactional + partial-failure rollback."
- Public form criteria: "Verified by `public-form-submit.test.ts` BotID + rate-limit + honeypot + ConsentState double-gate."
- Page renderer criteria: "Verified by `page-renderer.test.ts` SSR + RSC hydration + ISR cacheTag/updateTag."
- LaunchGate criteria: "Verified by `gate-evaluator-{pricing,evidence,readiness,approval}.test.ts` per kind × per status × waiver."
- Polymorphic surface criteria: "Verified by `launch-surface-polymorphic.test.ts` per surface_kind × CHECK constraint."
- Experiment criteria: "Verified by `experiment-assignment.test.ts` sticky-hash + traffic_split + immutability post-active."
- Runbook criteria: "Verified by `runbook-execute.test.ts` + `runbook-rollback.test.ts` reversible + non-reversible cases."
- LaunchOutcome criteria: "Verified by `outcome-compute.test.ts` T+7/T+14/T+30 windows."
- ISR criteria: "Verified by `cache-tag.test.ts` + Playwright `page-publish-rollback.spec.ts`."
- Pricing safety criteria: "Verified by `pricing-binding.test.ts` + `runtime-placeholder.test.ts` belt+suspenders."
- RLS criteria: "Verified by `rls-suite.test.ts` cross-tenant denial on all 13 new tables."
- Legacy regression: "Verified by `npm test` — P100-P105 + P201 + P221 + P222 + P223 suites green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public page SEO + Open Graph in production | CNV-01 | External crawler behavior | (1) Publish page, (2) inspect via Twitter Card Validator + Facebook Debugger, (3) confirm canonical URL + OG tags |
| ISR cache invalidation on real Vercel deployment | CNV-01 | Production CDN behavior | (1) Publish page, (2) `curl` page from edge POP, (3) edit + republish, (4) verify next request shows updated content within seconds |
| Launch operator full journey (brief → gates → runbook → execute → rollback) | LCH-01..05 | Operator judgment + multi-day timing | (1) Create launch with all 4 gates, (2) work through readiness checks, (3) arm runbook, (4) execute + monitor, (5) trigger rollback, (6) verify all surfaces archived + audit trail |
| BotID under live attack simulation | CNV-04 | Real bot traffic patterns | (1) Configure penetration test against public form, (2) verify BotID blocks majority, (3) honeypot catches remainder, (4) rate limit ramps |
| Pricing change mid-launch (Pricing Engine record updated post-publish) | LCH-04, PRC-04 | Surface health audit cron timing | (1) Publish launch, (2) operator updates Pricing Engine, (3) verify surface_health_audit cron flags stale pricing_context_id within next run, (4) auto-archive after grace period |
| Experiment winner selection (manual decision until P225) | CNV-03 | No statistical engine v1 | (1) Run experiment to N visitors, (2) operator inspects conversion_events.experiment_variant_id distribution, (3) manually transition variant.is_control=true on chosen winner, (4) experiment status=completed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs, deps)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 150s quick / 12 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
