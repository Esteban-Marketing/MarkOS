# Phase 110: Diagnostics, Fallbacks, and Closeout Hardening - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Close out the v3.9.0 milestone by hardening the library system against partial and unsupported combinations. This phase delivers four things:

1. **Operator Override UI** — a "Review Library Selection" step in the onboarding approval flow where the operator sees the auto-resolved pack selection, per-discipline completeness, and can override the base family and/or overlay before final approval
2. **Visible diagnostics** — structured `packDiagnostics` payloads in the approve API response so callers and the override UI surface partial-coverage and fallback-reason information
3. **Completeness graduation** — upgrade the 5 authored base families + 4 authored overlay packs to `completeness: "full"` once integration validation passes
4. **Regression safeguards** — integration tests covering the full selection → fallback → diagnostics path, guarding all GOV-01 and GOV-02 requirements

This phase does NOT:
- Author new content for `agency` or `info-products` (remain at `stub`; fallback path is tested, not content-authored)
- Replace or refactor `template-family-map.cjs` public API (backward-compat constraint from Phase 106)
- Add tenant isolation features beyond what already exists (Phase 108 / Phase 109 established these seams)

</domain>

<decisions>
## Implementation Decisions

### Operator Override UI

- **D-01:** Phase 110 ships the full interactive "Review Library Selection" step — not read-only, not deferred. Operators can change the selection before final approval.
- **D-02:** It is a **new, distinct step** inside the existing onboarding approval flow, positioned between draft review and final confirm.
- **D-03:** Both base family **and** overlay pack can be overridden **independently** in the same step. Neither field is locked after auto-resolution.
- **D-04:** The UI displays a **per-discipline completeness grid inline** (full / partial / stub per discipline) for the currently selected pack combination so the operator understands what they're approving.

### Visible Diagnostics

- **D-05:** Add a `packDiagnostics` field to the POST /approve JSON response body. Shape: `{ basePack, overlayPack, overrideReason, completeness, fallbackApplied: boolean }`. The override UI reads this field.
- **D-06:** When `completeness` contains any `"stub"` or `"missing"` disciplines, `fallbackApplied: true`. This is visible to the operator in the UI (D-04 completeness grid highlights stub/missing disciplines distinctly).
- **D-07:** `console.warn` calls in `resolvePackSelection()` and the overlay-missing path remain as-is — Phase 110 does not replace these with structured throws; it adds structured payloads alongside them.

### Completeness Graduation

- **D-08:** Upgrade the 5 authored base families (b2b, b2c, saas, ecommerce, services) and 4 authored overlays (travel, it, marketing-services, professional-services) from `"partial"` → `"full"` in their pack manifest files, contingent on Phase 110 integration tests passing.
- **D-09:** `agency` and `info-products` remain at `completeness: stub`. No content authored for them in this phase. Their fallback path is tested (covered by regression safeguards), not authored.

### Regression Safeguards

- **D-10:** Add integration tests covering: (a) full selection→skeleton path for all 5 base families + 4 overlay combos; (b) fallback-to-base-only when industry is unrecognized; (c) fallback-to-base-only when overlay file is missing; (d) null-basePack path when business_model is unrecognized; (e) `agency`/`info-products` stub handling — pack resolves but completeness grid marks disciplines as stub.
- **D-11:** No new CLI validate script for this phase — test suite coverage is sufficient for the milestone closeout. A future validation CLI is a backlog candidate.

### Agent's Discretion

- Exact UI component structure (React/JSX) — agent decides within the existing onboarding AdminPage/approval-step pattern
- `packDiagnostics` field placement in the response JSON — agent positions it alongside the existing `packSelection` field already returned in the approve response
- Whether the completeness grid uses a table, badge grid, or list — agent matches the existing onboarding UI style
- Integration test file location and suite numbering — agent follows existing `test/` convention (new file `test/pack-diagnostics.test.js` or extension of existing `test/pack-loader.test.js`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pack System Foundation (Phases 106–108)
- `lib/markos/packs/pack-loader.cjs` — `resolvePackSelection()`, `INDUSTRY_ALIAS_MAP`, `completeness`/`fallbackAllowed` fields already in adapted shape. Comments flagged "Phase 110 diagnostics" on lines 102–105.
- `lib/markos/packs/pack-schema.json` — Ajv Draft-07 schema. The `completeness` field values: `"full"` | `"partial"` | `"stub"` | `"missing"`.
- `lib/markos/packs/b2b.pack.json` — Reference pack at current `partial` completeness state (same pattern for all 9 packs before graduation).
- `lib/markos/packs/industries/` — 4 overlay manifests (travel, it, marketing-services, professional-services). Must follow same graduation logic as base packs.

### Approval Flow Integration (Phase 109)
- `onboarding/backend/handlers.cjs` — `handleApprove()` already calls `resolvePackSelection()` (line 2393), writes `seed.packSelection` (line 2394), passes `packSelection` to `generateSkeletons()` (line 2410), and returns `packSelection` in response body (lines 2459, 2509). Phase 110 adds `packDiagnostics` alongside these.
- `.planning/phases/109-initialization-and-workspace-hydration-integration/109-CONTEXT.md` — D-06 (soft-fail mandate), D-02 (seed.packSelection write contract), and the explicit "Operator override UI (Phase 110 scope)" note.

### Phase 106 Override UI Contract (Locked)
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-CONTEXT.md` — Decision 4 defines the selection state shape `{ basePack, overlayPack, overrideReason, resolvedAt }`, where it's persisted (`seed.packSelection`), and what the approval step reads.

### Existing Approval UI Pattern
- `onboarding/backend/` — Existing approval flow structure. The override UI step plugs into this flow as a new step component.
- `app/(markos)/` — Next.js app directory with existing onboarding UI pages. New step component lives here.

### Requirements
- `.planning/REQUIREMENTS.md` §GOV-01 — "Unsupported or partial combinations degrade gracefully to safe fallback templates with visible diagnostics rather than hard failure."
- `.planning/REQUIREMENTS.md` §GOV-02 — "Pack selection and generated artifacts remain tenant-safe, auditable, and compatible with current approval-aware flows."

### Test Files
- `test/pack-loader.test.js` — Suite 106. All existing tests must remain green after completeness graduation (b2b, saas, etc. change from `"partial"` → `"full"`). Any assertion checking for `"partial"` needs updating.
- `test/skeleton-generator.test.js` and `test/example-resolver.test.js` — Regression baseline for Phase 109 changes; must stay green.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolvePackSelection()` already returns `overrideReason` — Phase 110 expands this into the `packDiagnostics` payload without changing the return shape.
- `adaptToLegacyShape()` in `pack-loader.cjs` already exposes `completeness` and `fallbackAllowed` per pack entry — Phase 110 reads these to build the completeness grid in the UI.
- The existing `packSelection` field in the `/approve` response body is the anchor for `packDiagnostics` — they're co-located.

### Established Patterns
- All Phase 109 pack-related code is wrapped in try/catch with soft-fail semantics (D-06). Phase 110 must follow the same pattern.
- Approval flow steps follow the existing `handlers.cjs` / `approval-gate.cjs` pattern — don't introduce new state machines.
- UI components in `app/(markos)/` follow Next.js app router conventions already established.

### Integration Points
- Phase 110's override UI writes to `seed.packSelection` (reading and overwriting the initially auto-resolved value). This is the same field Phase 109 writes. The override just replaces the auto-resolved basePack/overlayPack with operator-chosen values before skeleton generation proceeds.
- `packDiagnostics` in the approve response is additive — no existing response field changes shape.

</code_context>

<specifics>
## Specific Ideas

- The completeness grid in the override UI should visually distinguish `"full"` (all good), `"partial"` (some gaps), and `"stub"` (effectively unsupported) — matching the GOV-01 language of "visible diagnostics."
- Phase 106 D-04 locks: operator overrides are written to `seed.packSelection.basePack` / `seed.packSelection.overlayPack`, with `overrideReason` set to a string like `"operator_override"` to distinguish from auto-resolved selections in the audit trail.

</specifics>

<deferred>
## Deferred Ideas

- A dedicated `/api/packs/diagnostics` GET endpoint was considered for Area 2 — deferred; inline diagnostics in the approve response are sufficient for Phase 110.
- A `validate-packs.cjs` CLI script was considered for regression safeguards — deferred to a future backlog item; test coverage is sufficient for milestone closeout.
- `agency` and `info-products` content authoring — explicitly out of scope for v3.9.0; candidate for v4.0 starter library expansion.

</deferred>

---

*Phase: 110-diagnostics-fallbacks-and-closeout-hardening*
*Context gathered: 2026-04-15*
