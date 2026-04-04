---
phase: 54
slug: billing-metering-and-enterprise-governance
status: approved
reviewed_at: 2026-04-03T00:00:00Z
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 54 - UI Design Contract

> Visual and interaction contract for tenant billing, operator billing reconciliation, and enterprise governance surfaces. This phase extends the existing MarkOS manual token system and reuses the evidence-first operator interaction language established in earlier phases.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual/token-based system preserved) |
| Preset | not applicable |
| Component library | existing MarkOS app primitives (no new library in this phase) |
| Icon library | existing app/Storybook icon usage only |
| Font | Body: Space Grotesk; Display: Sora |

Source notes:
- No `components.json`, Tailwind config, or shadcn baseline exists in the repo; Phase 54 stays on the current manual token system.
- Token baseline remains the current app semantic tokens: canvas `#f5f7fa`, panel `#ffffff`, primary action `#0d9488`, body font Space Grotesk, display font Sora.
- Visual continuity target: Phase 46 operator evidence-first layout behavior and Phase 52 plugin/settings card language.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline badge/icon separation, ledger row metadata separators |
| sm | 8px | Compact filter chips, status pill spacing, inline form control gaps |
| md | 16px | Default card padding, field spacing, table cell padding |
| lg | 24px | Section padding, drawer body spacing, stacked form groups |
| xl | 32px | Page-region gutters, summary band separation |
| 2xl | 48px | Major section breaks between summaries, tables, and evidence rails |
| 3xl | 64px | Top-level page vertical rhythm |

Exceptions:
- Minimum interactive target height is 44px for invoice review, retry sync, place hold, release hold, export evidence, and role-mapping approval actions.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

Rules:
- Exactly two weights only: 400 and 600.
- Tenant billing totals, current plan, and active hold status use Heading or Display only; do not introduce oversized finance-dashboard numerals.
- Table metadata, evidence keys, claim source labels, and invoice status labels use Label.
- Dense billing and governance tables may use 14px text only for labels and compact metadata; body rows stay at 16px for readability.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #f5f7fa | Workspace canvas, page background, quiet table backdrops |
| Secondary (30%) | #ffffff | Cards, drawers, data panels, side rails |
| Accent (10%) | #0d9488 | Primary CTA, selected reconciliation row, active billing-period emphasis, current-section indicator |
| Destructive | #dc2626 | Hold confirmations, denied actions, destructive warnings only |

Accent reserved for:
- Primary CTA in each surface
- Selected reconciliation row or active evidence context
- Current billing-period summary emphasis
- Active tab indicator in governance

Operational semantic state colors:
- Healthy or reconciled: #0f766e
- Review required or sync attention: #0369a1
- Hold or dunning: #b45309
- Blocked or denied: #b91c1c
- Read-only or archived: #64748b

Color behavior rules:
- Tenant billing pages use a quiet, finance-style surface hierarchy; do not color entire cards by status.
- Admin billing and governance screens may show one high-signal colored banner at a time per viewport.
- Accent is never used for destructive, blocked, or denial states.
- Evidence lineage rows use neutral backgrounds with colored left borders only when selected.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Review Billing Details |
| Empty state heading | No billing activity in this period |
| Empty state body | Usage, invoices, and governance evidence will appear here after the first reconciled billing period closes. |
| Error state | Billing data could not be loaded. Last reconciled records stay visible; retry the request or contact a billing admin. |
| Destructive confirmation | Place tenant on hold: Confirm hold. Restricted write, execute, and premium actions will pause while read access and billing evidence remain available. |

Phase-specific copy rules:
- Tenant billing copy must use plain billing language: included usage, overage, current invoice, payment hold, billing period, premium features.
- Tenant billing copy must not expose raw internal telemetry names such as provider attempt, raw event, run-close envelope, or source payload reference.
- Operator billing copy must use evidence-first audit nouns: reconciliation, line item, sync failure, hold reason, evidence, source lineage.
- Governance copy must use explainable identity language: source claim, mapped role, denied mapping, access review, export status, vendor inventory.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not applicable |

Gate decision:
- Phase 54 remains contract-locked to the existing manual token baseline.
- No third-party UI registry blocks are allowed in this phase.

---

## Phase 54 Interaction Contract

This section is the locked implementation contract for the Phase 54 billing and governance surfaces.

### 1. Shared Shell and Visual Hierarchy

Locked layout rules:
1. All three Phase 54 surfaces use a calm admin shell with a summary band first, work area second, evidence or detail rail third.
2. Never lead with charts. This phase is ledger-first and evidence-first, not dashboard-first.
3. Limit summary strips to four metrics per page. Extra detail belongs in tables or drawers.
4. The top-left focal point on every page is the current status summary: billing state for billing pages, federation state for governance.
5. Only one primary accent action is visible above the fold per page.

Desktop region guidance:
- `settings/billing`: summary band, then 60/40 main content split.
- `admin/billing`: 28/44/28 list-detail-evidence split.
- `admin/governance`: 24/48/28 navigation-list-detail split.

Responsive behavior:
- On tablet and mobile, the right evidence rail becomes an overlay drawer.
- Region order always remains summary -> main list/table -> detail/evidence.
- Critical hold, blocked, and access-denied banners stay above the first actionable control.

### 2. Tenant Billing Surface (`settings/billing`)

Purpose:
- Give tenant admins and billing-admins a plain-language billing view sourced from the same reconciled ledger operators use.

Required modules in fixed order:
1. Billing status summary card
2. Current plan and included usage card
3. Current billing-period usage table
4. Invoice list
5. Entitlement and premium-feature availability panel
6. Billing evidence drawer trigger

Locked content rules:
- Summary card must show: plan name, billing period, current status, next invoice or renewal date, and whether any hold is active.
- Usage table groups billable units into human-readable categories: seats, agent runs, AI usage, premium features, storage.
- Each row shows included amount, used amount, projected overage, and charge impact if applicable.
- Internal source IDs and telemetry field names remain hidden by default.
- If evidence is exposed to tenants, it opens in a secondary drawer with translated labels and a short explanation sentence above raw references.

Locked interaction rules:
- Page primary action is `Review Current Invoice` when an invoice exists; otherwise `Review Billing Details`.
- Tenant users can open invoices and billing evidence, but cannot see operator-only reconciliation controls.
- Any blocked premium feature row must show the exact reason in plain language, not an internal code alone.
- If the workspace is on hold, the page keeps invoice and usage access available while disabling restricted action controls elsewhere in the app.

### 3. Operator Billing Surface (`admin/billing`)

Purpose:
- Let operators reconcile tenant billing, review invoice-grade evidence, manage holds and dunning, and investigate provider sync failures.

Required modules:
1. Reconciliation queue tabs: `Needs review`, `On hold`, `Sync failures`, `Ready to close`
2. Tenant-period reconciliation table
3. Invoice line-item preview panel
4. Evidence rail
5. Hold and sync action bar

Required reconciliation table columns:
- Tenant
- Billing period
- Plan
- Usage status
- Invoice status
- Provider sync state
- Hold state
- Last reconciled at

Evidence rail fixed section order:
1. Subscription snapshot
2. Usage ledger rows
3. Source telemetry lineage
4. Invoice line items
5. Provider sync attempts
6. Hold and dunning history

Locked interaction rules:
- Row selection updates the center detail panel and right evidence rail without route change.
- `Review Billing Evidence` is the primary CTA when a mismatch or sync failure exists.
- `Place Hold`, `Release Hold`, and `Retry Provider Sync` are secondary actions and require confirmation for destructive or state-changing actions.
- Operator screens must surface sync failures as reviewable evidence, not transient toasts only.
- Every hold or release action writes actor, timestamp, and reason and must show that history immediately in the evidence rail.
- Reconciliation mismatches must remain visible until explicitly resolved; no auto-dismiss behavior is allowed.

### 4. Governance Surface (`admin/governance`)

Purpose:
- Make identity federation, access review, retention/export status, and vendor inventory navigable without visual clutter.

Required top-level sections:
1. `Identity Federation`
2. `Access Reviews`
3. `Retention and Export`
4. `Vendor Inventory`

Locked layout rules:
- Use section tabs or left-nav items, not stacked full-page sections.
- Only the active section renders detailed tables; inactive sections remain summarized.
- Each section gets one summary strip and one primary table.

Identity Federation table columns:
- Tenant
- Provider
- Source claim or group
- Mapped canonical role
- Decision
- Actor or subject
- Timestamp

Access Reviews table columns:
- Tenant
- Review scope
- Last completed
- Owner
- Findings status
- Next review due

Retention and Export table columns:
- Evidence type
- Requested at
- Status
- Retention window
- Export availability
- Last actor

Vendor Inventory table columns:
- Vendor
- Function
- Data classes touched
- Region or residency note
- Status
- Last review

Locked interaction rules:
- Identity mapping rows open a detail rail showing source claims, matched rule, mapped role, and denial reason when rejected.
- Access review rows open action history, not editable inline forms.
- Retention/export rows show whether an export is ready, expired, or blocked by policy.
- Vendor inventory is browse-first and evidence-first; do not turn this section into a procurement workflow.

### 5. Entitlement-Safe Degradation States

These states are mandatory across tenant and operator surfaces.

#### Blocked state
- Heading: `Action blocked by billing policy`
- Body: `This workspace has reached a billing or entitlement limit for this action. Review billing details or update the plan before retrying.`
- Visual treatment: neutral card with blocked left border in `#b91c1c`, no full-card red fill
- Behavior: blocked actions are disabled; evidence and read access remain available

#### Hold state
- Heading: `Billing hold active`
- Body: `Restricted write, execute, and premium actions are paused while payment or reconciliation issues are resolved. Usage records and invoices remain available.`
- Visual treatment: warning banner in hold color `#b45309`
- Behavior: banner persists at top of page until hold clears

#### Sync review state
- Heading: `Billing status needs review`
- Body: `We could not confirm the latest billing sync. Restricted actions stay paused until billing health is restored.`
- Visual treatment: review banner in `#0369a1`
- Behavior: fail closed for restricted actions; keep ledger access available

#### Destructive state
- Used for: hold placement, hold release with override, export deletion, role-mapping rule removal
- Behavior: confirmation modal with explicit effect statement, actor-visible reason field when state changes affect access or billing

### 6. Access Denied and Fail-Closed Treatment

Locked access rules:
- No Phase 54 page may assume current scaffold auth is sufficient.
- Missing tenant context, missing session claims, or ambiguous tenant binding renders a full-page denial state with no sensitive data.
- Unauthorized tenant users see a route-level denial card with required role guidance.
- Unauthorized operator users see a route-level denial state that names the required permission domain: billing administration or governance administration.

Required denial copy:
- Heading: `Access denied`
- Body: `Your session does not include the required tenant or role context for this page.`
- Secondary text: `Sign in again or contact an owner or billing admin if access should be available.`

Governance-specific identity denial treatment:
- Rejected external role mappings remain visible in tables as denied rows.
- Denied rows show the rejection reason directly in the detail rail; never hide them behind success-only summaries.

### 7. Data Presentation Rules

Locked presentation rules:
- Use tables for ledgers, mappings, invoices, exports, and vendor inventory.
- Avoid donut charts, stacked area charts, or decorative analytics graphs in this phase.
- Status chips must use short, exact labels: `healthy`, `review`, `hold`, `blocked`, `failed`, `ready`, `exported`, `denied`.
- Monetary values and included-versus-used numbers appear together in the same row to reduce mental translation.
- Tenant pages translate internal units to customer-facing labels; operator pages may show internal lineage references only in drilldown.

### 8. Required Route States and Verification Coverage

Required implementation and test states:
1. Tenant billing healthy
2. Tenant billing approaching limit
3. Tenant billing blocked
4. Tenant billing on hold
5. Operator reconciliation mismatch
6. Operator provider sync failure
7. Governance role mapping denied
8. Governance export ready
9. Route access denied
10. Missing tenant context fail-closed

Story and verification expectations:
- Billing and governance pages must expose deterministic fixture states for visual review.
- Operator evidence rails must support populated and empty lineage cases.
- Denial and hold states are first-class stories, not edge-case-only test fixtures.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-03
