# Phase 110: Diagnostics, Fallbacks, and Closeout Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 110-diagnostics-fallbacks-and-closeout-hardening
**Areas discussed:** Operator Override UI

---

## Operator Override UI

| Option | Description | Selected |
|--------|-------------|----------|
| Full — show + override dropdown (base and/or overlay) | Operator can swap both base family and overlay pack via dropdown | ✓ |
| Read-only — show selection and completeness summary, no override input | Display only, no change capability | |
| Skip UI — backend contract only this milestone | No frontend component this milestone | |

**User's choice:** Full — ship the complete interactive override UI in Phase 110.

---

### Override UI location

| Option | Description | Selected |
|--------|-------------|----------|
| New step in approval flow (between draft review and final confirm) | Distinct step in existing onboarding flow | ✓ |
| Admin/settings panel separate from onboarding | Operator can change anytime, not just during approval | |
| Inline in existing approval page (expands a section) | No new step, collapses into existing step | |

**User's choice:** New distinct step between draft review and final confirmation.

---

### Override UI field scope

| Option | Description | Selected |
|--------|-------------|----------|
| Both base family and overlay can be overridden independently | Full control over both fields | ✓ |
| Overlay only — base family locked once resolved from seed | Partial control | |
| Base family only — overlay auto-stacked or removed | Partial control | |

**User's choice:** Both base family and overlay overrideable independently.

---

### Override UI completeness display

| Option | Description | Selected |
|--------|-------------|----------|
| Per-discipline completeness grid inline (full, partial, stub per discipline) | Full visibility into coverage breakdown | ✓ |
| Single badge only (e.g. "Partial coverage") | Summary badge without discipline detail | |
| No completeness info in UI | Diagnostics only via API response | |

**User's choice:** Per-discipline completeness grid inline in the override step.

---

## Agent's Discretion

The following gray areas were not discussed by the user — agent applies defaults from prior phase decisions and phase goal:

- **Visible diagnostics surface** — Agent decision: add `packDiagnostics` to approve response body alongside existing `packSelection` field.
- **Completeness graduation** — Agent decision: graduate all 9 authored packs (5 base + 4 overlay) from `partial` → `full` after integration tests pass. `agency`/`info-products` remain at `stub`.
- **Regression safeguard format** — Agent decision: integration tests only (no CLI validate script). Covers all 9 combos + fallback paths.
- **agency/info-products** — Agent decision: no content authored; fallback degradation path tested only.

## Deferred Ideas

- Dedicated `/api/packs/diagnostics` GET endpoint — out of scope; inline diagnostics sufficient.
- `validate-packs.cjs` CLI — deferred to backlog.
- `agency`/`info-products` content authoring — deferred to v4.0.
