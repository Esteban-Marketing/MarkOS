---
phase: 52
slug: plugin-runtime-and-digital-agency-plugin-v1
status: approved
reviewed_at: 2026-04-03T00:00:00Z
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 52 — UI Design Contract

> Visual and interaction contract for plugin management and Digital Agency dashboard surfaces.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual/token-based system preserved) |
| Preset | not applicable |
| Component library | existing MarkOS app primitives (no new library in this phase) |
| Icon library | existing app/Storybook icon usage only |
| Font | Body: Space Grotesk; Display: Sora |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon/text spacing in status chips |
| sm | 8px | Compact control spacing in plugin settings rows |
| md | 16px | Default card and form spacing |
| lg | 24px | Section padding and panel gutters |
| xl | 32px | Major section separation in dashboard |
| 2xl | 48px | Page section breaks |
| 3xl | 64px | Top-level page vertical rhythm |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #f5f7fa | Page background and base surfaces |
| Secondary (30%) | #ffffff | Cards, side panels, modal shells |
| Accent (10%) | #0d9488 | Primary CTA, active plugin status, focused KPI highlights |
| Destructive | #dc2626 | Disable-plugin confirmation and denied action alerts |

Accent reserved for: Save Plugin Settings CTA, Enable Plugin CTA, active plugin state chip, primary dashboard KPI emphasis

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Save Plugin Settings |
| Empty state heading | No plugin-enabled campaigns yet |
| Empty state body | Enable Digital Agency and assemble your first campaign to start tracking approvals, schedules, and publishing readiness. |
| Error state | Plugin settings could not be saved. Review capability grants and retry, or contact a tenant admin for access. |
| Destructive confirmation | Disable Digital Agency Plugin: Confirm disable. Existing campaign history remains stored for audit and can be restored by re-enabling. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not applicable |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS (FLAG: add explicit focal point and hierarchy declaration)
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-03
