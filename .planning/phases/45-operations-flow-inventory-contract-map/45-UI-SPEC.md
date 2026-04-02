---
phase: 45
slug: operations-flow-inventory-contract-map
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-02
---

# Phase 45 - UI Design Contract

> Visual and interaction contract for Phase 45 inventory and verification artifacts only. This phase defines presentation and interaction rules for inventory review surfaces and mockup fidelity, not frontend implementation.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Phase 45 is documentation/inventory only) |
| Preset | not applicable |
| Component library | existing MarkOS app primitives (no new library adoption in this phase) |
| Icon library | existing Storybook/app icon usage only (no new dependency) |
| Font | Body: Space Grotesk; Display: Sora (from existing semantic tokens) |

Source notes:
- Locked scope and no pull-in from Phase 46-50: 45-CONTEXT.md (D-19)
- Existing semantic token baseline: lib/markos/theme/tokens.ts

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon/text gap in table cells and badges |
| sm | 8px | Row action spacing, metadata chips |
| md | 16px | Default cell padding and card internals |
| lg | 24px | Section padding between inventory blocks |
| xl | 32px | Split between registry table and verification checklist |
| 2xl | 48px | Major panel separation |
| 3xl | 64px | Page-level top/bottom breathing room |

Exceptions: none (Phase 45 is read-heavy, no touch-target exceptions required)

Source notes:
- Default 8-point family adapted from template, preserved for docs-only mockup consistency.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

Rules:
- Use exactly two weights in this phase: 400 and 600.
- Use Body for flow descriptions and verification notes.
- Use Label for enum tags, status badges, and checklist labels.
- Use Heading/Display for section and page hierarchy only.

Source notes:
- Font families align to existing semantic tokens in lib/markos/theme/tokens.ts.
- Size/weight limits selected as phase defaults (no conflicting upstream requirement).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #f5f7fa | Canvas, page background, table background |
| Secondary (30%) | #ffffff | Cards, grouped detail panels, checklist containers |
| Accent (10%) | #0d9488 | Coverage percentage, approved states, primary CTA only |
| Destructive | #dc2626 | Only for explicit destructive confirmations (if any future edit actions appear) |

Accent reserved for:
- "Coverage Complete" status chips
- Primary CTA button
- Active filter indicator (single active accent at a time)

Color behavior rules:
- Unknown taxonomy values (D-03) render as destructive state text/chip, never accent.
- Manual-review-needed states (D-10, D-12, D-18) render as neutral warning styling, not success accent.

Source notes:
- Dominant/secondary/accent derived from existing semantic tokens in lib/markos/theme/tokens.ts.
- Destructive token defaulted because it is not currently declared in base semantic tokens.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Review Flow Inventory |
| Empty state heading | No flows in canonical registry yet |
| Empty state body | Run extraction, map journey-level flows to handlers, then re-open this view to validate coverage. |
| Error state | Flow inventory could not be validated. Check enum labels, endpoint mapping, and schema compliance, then run verification again. |
| Destructive confirmation | Remove flow mapping (only if edit mode exists later): "This removes the contract link for this flow. Type REMOVE to confirm." |

Phase-specific interaction copy rules:
- Use explicit nouns from Phase 45 artifacts: "flow", "contract", "verification", "baseline".
- Never use Phase 46 execution verbs such as "run task" or "approve step" in Phase 45 surfaces.
- Every blocking message must include next action text (what file/check to run next).

Source notes:
- Phase objective and success criteria language from .planning/ROADMAP.md and .planning/REQUIREMENTS.md.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required (no shadcn initialization in docs phase) |
| third-party | none | not applicable |

Gate decision:
- React/Next stack exists in repository, but this phase does not implement UI components and is locked against Phase 46 scope pull-in (D-19). Therefore shadcn initialization is explicitly deferred.

---

## Phase-45 Interaction Contract (Inventory Mockup Scope)

This section operationalizes Success Criterion #1 as a mockup-level contract without implementation scope creep.

Required views:
1. Inventory table view: show >=10 active flows with domain, flow_type, method, local path, hosted path, handler, and coverage status.
2. Flow detail drawer/panel: show journey steps (3-12), input/output summary, error contracts, and linked contract files.
3. Verification checklist panel: show 100% mapping checks, schema validation status, and reviewer sign-off status.
4. KPI baseline strip: show T0 placeholders and capture window metadata (instrumented aggregate window only, per D-13 to D-15).

Required states:
- Loading
- Ready
- Empty
- Validation error
- Review pending
- Approved baseline

Required interaction rules:
- Read-only by default in Phase 45.
- Any edit affordance must be visibly marked "Deferred to later phase" and non-interactive.
- Unknown enum values fail visibly in the verification panel (aligned to D-03).
- Coverage denominator/numerator always visible together (e.g., 17/17).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
