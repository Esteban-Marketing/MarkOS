# FLOW-INVENTORY-MOCKUP.md — Operator Flow Inventory UI Mockup

**Phase:** 45 — Operations Flow Inventory & Canonical Contract Map  
**Status:** Design contract (mockup only — no UI implementation in Phase 45, per D-19)  
**Spec reference:** `.planning/phases/45-operations-flow-inventory-contract-map/45-UI-SPEC.md`  
**UI mode:** Read-only (no edit controls in Phase 45 — deferred to Phase 46 per D-19)

---

## View 1: Inventory Overview Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Display: 28px/600]  MarkOS — Operations Flow Inventory                    │
│  [Body: 16px/400]  Phase 45 baseline · 17 active flows · Last updated 2026-04-02  │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                               │
│  ░░ COVERAGE RATIO ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Display: 28px/600]  17 / 17 flows inventoried                     │    │
│  │  [Label: 14px/600]  100% API-01 coverage  ·  Review pending sign-off │    │
│  │  [Progress bar: full width, accent-green #22c55e]  ████████████████  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ░░ FLOW REGISTRY TABLE ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Heading: 20px/600]  Flow Registry                                  │    │
│  │                                                                       │    │
│  │  [Filter/Sort bar — read-only display:]                              │    │
│  │  Domain: [all ▼]   Flow Type: [all ▼]   Actor: [all ▼]   SLO: [all ▼]│   │
│  │                                                                       │    │
│  │  ┌──────┬─────────────────────────────┬──────────┬───────────┬──────┐│   │
│  │  │ ID   │ Flow Name                   │ Domain   │ Flow Type │ SLO  ││   │
│  │  ├──────┼─────────────────────────────┼──────────┼───────────┼──────┤│   │
│  │  │ F-01 │ client-intake-submit        │[onboard] │[submit]   │[crit]││   │
│  │  │ F-02 │ draft-approve               │[execute] │[approval] │[std] ││   │
│  │  │ F-03 │ section-regenerate          │[execute] │[regen]    │[std] ││   │
│  │  │ F-04 │ system-config-read          │[report]  │[query]    │[std] ││   │
│  │  │ F-05 │ system-status-health        │[report]  │[health]   │[std] ││   │
│  │  │ F-06 │ linear-task-sync            │[integr]  │[sync]     │[std] ││   │
│  │  │ F-07 │ campaign-result-record      │[integr]  │[record]   │[std] ││   │
│  │  │ F-08 │ markosdb-migrate            │[migrate] │[migrat]   │[std] ││   │
│  │  │ F-09 │ literacy-coverage-report    │[report]  │[query]    │[std] ││   │
│  │  │ F-10 │ literacy-admin-health       │[admin]   │[health]   │[std] ││   │
│  │  │ F-11 │ literacy-admin-query        │[admin]   │[query]    │[std] ││   │
│  │  │ F-12 │ ai-interview-generate-q     │[enrich]  │[query]    │[std] ││   │
│  │  │ F-13 │ ai-interview-parse-answer   │[enrich]  │[query]    │[std] ││   │
│  │  │ F-14 │ source-extraction           │[enrich]  │[enrich]   │[std] ││   │
│  │  │ F-15 │ extract-and-score           │[enrich]  │[enrich]   │[std] ││   │
│  │  │ F-16 │ spark-suggestion            │[enrich]  │[enrich]   │[std] ││   │
│  │  │ F-17 │ competitor-discovery        │[enrich]  │[enrich]   │[std] ││   │
│  │  └──────┴─────────────────────────────┴──────────┴───────────┴──────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ░░ VERIFICATION STATUS ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Label: 14px/600]  FLOW-VERIFICATION sign-off status: PENDING       │    │
│  │  Automated checks: [ ] A-01..A-12  Manual review: [ ] B-01..B-10    │    │
│  │                                                                       │    │
│  │  Possible states:                                                     │    │
│  │  · Loading       — registry fetch in progress (skeleton shown)       │    │
│  │  · Ready         — all contracts validated, no errors detected       │    │
│  │  · Empty         — zero flows match active filter                    │    │
│  │  · Validation error — one or more contract schema violations found   │    │
│  │  · Review pending — sign-off not yet submitted                       │    │
│  │  · Approved baseline — sign-off accepted, KPI T0 captured            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Token mapping:**
- Page background (Canvas/60%): `#f5f7fa` (Dominant)
- Card/panel background (30%): `#ffffff` (Secondary)
- Accent badge fill: domain-specific; status pill: `#22c55e` (success) / `#eab308` (warning)
- Table row hover: `#eef0f3` (subtle)

---

## View 2: Flow Detail Drawer

```
┌─── Overlay: Flow Detail ───────────────────────────────────────────────────┐
│  [Heading: 20px/600]  F-01 — client-intake-submit                           │
│  [Label: 14px/600]  POST · /submit · onboarding · submission · critical     │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                               │
│  ┌─── Paths ──────────────────────────────────────────────────────────┐     │
│  │  Local path:  /submit                                               │     │
│  │  Hosted path: /api/submit                                           │     │
│  │  Handler:     handleSubmit                                          │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌─── Auth ───────────────────────────────────────────────────────────┐     │
│  │  Local:  none                                                        │     │
│  │  Hosted: none                                                        │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌─── Journey Steps ──────────────────────────────────────────────────┐     │
│  │  1. Validate seed JSON                                              │     │
│  │  2. Resolve/persist project_slug                                    │     │
│  │  3. Auto-create Linear tickets                                      │     │
│  │  4. Orchestrate AI draft generation                                 │     │
│  │  5. Evaluate literacy readiness → respond                           │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌─── Contract ───────────────────────────────────────────────────────┐     │
│  │  contracts/F-01-client-intake-submit-v1.yaml  [view ▶]             │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  [Phase 45 scope: read-only. Edit controls deferred to Phase 46 per D-19]   │
│  [Close ×]                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View 3: Domain Filter Active State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Filter: Domain = [enrichment ×]                Clear filters               │
│─────────────────────────────────────────────────────────────────────────────│
│  Showing 6 of 17 flows                                                       │
│                                                                               │
│  ┌──────┬─────────────────────────────┬──────────┬──────────────────────┐  │
│  │ ID   │ Flow Name                   │ Flow Type│ Local Path           │  │
│  ├──────┼─────────────────────────────┼──────────┼──────────────────────┤  │
│  │ F-12 │ ai-interview-generate-q     │ [query]  │ /api/generate-question│  │
│  │ F-13 │ ai-interview-parse-answer   │ [query]  │ /api/parse-answer    │  │
│  │ F-14 │ source-extraction           │[enrich]  │ /api/extract-sources │  │
│  │ F-15 │ extract-and-score           │[enrich]  │ /api/extract-and-score│  │
│  │ F-16 │ spark-suggestion            │[enrich]  │ /api/spark-suggestion │  │
│  │ F-17 │ competitor-discovery        │[enrich]  │ /api/competitor-disc. │  │
│  └──────┴─────────────────────────────┴──────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View 4: RBAC/Auth Highlight State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Filter: Auth = [hosted-auth-only ×]            Clear filters               │
│─────────────────────────────────────────────────────────────────────────────│
│  Showing 4 of 17 flows  [Phase 37 RBAC cross-reference ↗]                  │
│                                                                               │
│  ┌──────┬──────────────────────────┬───────────────────────────┬──────────┐ │
│  │ ID   │ Flow Name                │ Auth Operation            │ Baseline │ │
│  ├──────┼──────────────────────────┼───────────────────────────┼──────────┤ │
│  │ F-04 │ system-config-read       │ config_read (JWT)         │ Phase 37 │ │
│  │ F-05 │ system-status-health     │ status_read (JWT)         │ Phase 37 │ │
│  │ F-08 │ markosdb-migrate         │ migration_write (JWT)     │ Phase 37 │ │
│  │ F-09 │ literacy-coverage-report │ status_read (JWT)         │ Phase 37 │ │
│  └──────┴──────────────────────────┴───────────────────────────┴──────────┘ │
│                                                                               │
│  [Hardening deferred to Phase 48 per D-19. RBAC baseline: lib/markos/rbac/] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View 5: Empty / Zero Flows State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Filter: Domain = [unknown ×]                                                │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                               │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │  [Heading: 20px/600]  No flows match the active filters         │      │
│     │  [Body: 16px/400]  Clear filters to view all 17 flows           │      │
│     │                                                                  │      │
│     │  [Clear filters]                                                 │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View 6: Loading / Skeleton State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Skeleton: Display heading — 28px pulse]  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│  [Skeleton: Label — 14px pulse]  ░░░░░░░░░░░░░░                             │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Skeleton: progress bar — full width pulse]                         │    │
│  │  [Skeleton: coverage label — 14px pulse]                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─── 5 skeleton rows ─────────────────────────────────────────────────┐    │
│  │  ░░░░   ░░░░░░░░░░░░░░░░░░░░░░░░   ░░░░░░░░   ░░░░░░░░   ░░░░░    │    │
│  │  ░░░░   ░░░░░░░░░░░░░░░░░░░░░         ···                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Contract

| Surface | Behavior | Phase 45 scope |
|---------|----------|----------------|
| Flow row click | Opens Flow Detail Drawer (View 2) | Read-only |
| Domain/filter dropdowns | Filter table rows | Display-only label |
| "Phase 37 RBAC cross-reference" link | Scrolls to RBAC section or opens detail | Documentation link |
| "view ▶" contract link | Opens contract YAML path reference | Read-only reference |
| Edit controls | **Not present in Phase 45** | Deferred to Phase 46 per D-19 |
| Sign-off action | **Not present in Phase 45 UI** | Handled via FLOW-VERIFICATION.md |

---

## Design Token Reference

| Element | Token | Value |
|---------|-------|-------|
| Page background | Dominant 60% | `#f5f7fa` |
| Card/panel | Secondary 30% | `#ffffff` |
| Accent | Accent 10% | `#4f46e5` (indigo) |
| Success (coverage complete) | accent-green | `#22c55e` |
| Warning (pending sign-off) | accent-yellow | `#eab308` |
| Body text | | `#1e293b` |
| Label text | | `#475569` |
| Table border | | `#e2e8f0` |

*Domain badge colors follow the 10% accent palette with pill shape (4px border-radius). Status badges use success/warning semantic tokens.*

---

*Phase 45 UI is documentation/mockup only. No React components created in this phase. Mockup spec is read-only input for Phase 46 UI implementation.*
