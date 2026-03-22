# SETUP.md — Quick-Start Guide for the MSP

> **Read this when starting a Marketing Strategic Plan for a new project.**
> The MSP is always created alongside — and after — the MIR (Marketing Intelligence Repository).
> The MIR must reach Gate 1 status before the MSP can be meaningfully written.

---

## Prerequisites (from MIR)

Before filling any MSP file, confirm these MIR files are `complete` or `verified`:

- [ ] `Core_Strategy/01_COMPANY/PROFILE.md` — Who the business is
- [ ] `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` — What the business says
- [ ] `Market_Audiences/03_MARKET/AUDIENCES.md` — Who the business sells to
- [ ] `Products/04_PRODUCTS/CATALOG.md` — What the business sells
- [ ] `Core_Strategy/00_META/PROJECT.md` — Scope, budget, constraints

**If any of these are `empty` or `partial`, complete them in the MIR first.**

---

## Step 1: Initialize the Repository

```bash
git clone https://github.com/[your-org]/get-shit-done.git
cp -r get-shit-done/MSP-TEMPLATE P[N]-[client-slug]-MSP
cd P[N]-[client-slug]-MSP
git init
```

Update `STATE.md`:
- Set `project_id`, `project_name`, `client_slug`
- Set `plan_period` (typically calendar year)
- All disciplines start as `—` (undecided)

---

## Step 2: Build the Master Plan (Strategy/00_MASTER-PLAN/)

Fill in this order — each file informs the next:

1. **`MARKETING-PLAN.md` §2 — Situation Analysis** — Where are we now?
2. **`STRATEGIC-GOALS.md`** — What does success look like this year?
3. **`BUDGET-ALLOCATION.md`** — What resources do we have?
4. **`MARKETING-PLAN.md` §6 — Discipline Mix** — Which disciplines to activate?
5. **`FUNNEL-OWNERSHIP-MAP.md`** — Who owns what stage?
6. **`ANNUAL-CALENDAR.md`** — When does what happen?
7. **`MARKETING-PLAN.md`** — Complete the remaining sections
8. **`PERFORMANCE-DASHBOARD.md`** — Set up the scorecard (targets only at this stage)

**Time estimate:** 4–8 hours for a new client. 2–3 hours for a renewal.

---

## Step 3: Activate Disciplines

For each discipline, make a deliberate decision:

| Decision | Action |
|----------|--------|
| ACTIVE | Complete the discipline's PLAN.md and all supporting files |
| INACTIVE | Open PLAN.md, fill the "Why This Discipline" section only, set status = INACTIVE with rationale |
| FUTURE | Open PLAN.md, fill the "Why This Discipline" section, define the activation trigger |

**A blank file is worse than a documented INACTIVE decision.**
An INACTIVE decision with a rationale tells agents and humans exactly why this was not chosen.

---

## Step 4: Complete Active Discipline Plans

For each ACTIVE discipline, fill in this order:

1. `PLAN.md` — Full strategy
2. Supporting files (unique per discipline — see below)

**Supporting files by discipline:**

| Discipline | Supporting Files |
|-----------|----------------|
| 01 Advertising | `paid-social/STRATEGY.md`, `paid-search/STRATEGY.md`, `programmatic/STRATEGY.md` |
| 02 Content Marketing | `CONTENT-PILLARS.md`, `SEO-CONTENT.md`, `THOUGHT-LEADERSHIP.md`, `VIDEO-STRATEGY.md` |
| 03 Email Marketing | `LIFECYCLE-SEQUENCES.md`, `BROADCAST-STRATEGY.md` |
| 04 Social Media | `PLATFORM-STRATEGIES.md`, `COMMUNITY-PLAYBOOK.md` |
| 05 Influencer | `TIER-FRAMEWORK.md`, `PARTNER-ROSTER.md` |
| 06 SEO | `KEYWORD-STRATEGY.md`, `TECHNICAL-SEO.md`, `LINK-BUILDING.md` |
| 07 PR & Comms | `MEDIA-RELATIONS.md`, `MESSAGING-MATRIX.md`, `CRISIS-PLAYBOOK.md` |
| 08 Brand | `BRAND-CAMPAIGNS.md`, `BRAND-HEALTH-TRACKING.md` |
| 09 Product Marketing | `GO-TO-MARKET.md`, `COMPETITIVE-POSITIONING.md` |
| 10 Partnerships | `AFFILIATE-PROGRAM.md`, `STRATEGIC-PARTNERS.md` |
| 11 CRO | `TESTING-ROADMAP.md`, `FUNNEL-ANALYSIS.md` |
| 12 Community | `COMMUNITY-PROGRAMS.md` |
| 13 Events | `EVENT-CALENDAR.md`, `EVENT-PLAYBOOK.md` |

---

## Step 5: Link MSP to MIR and mGSD

**In every discipline PLAN.md**, verify these references exist:
- Audience segment IDs link to `MIR/Market_Audiences/03_MARKET/AUDIENCES.md`
- Messaging references link to `MIR/Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- Budget numbers match `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`
- KPI targets are registered in `Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md`

**In every mGSD campaign**, add this field:
```yaml
discipline_plan   : "[e.g. Outbound/01_ADVERTISING/paid-social/STRATEGY.md]"
msp_goal_id       : "[e.g. G-ACQ-01]"
```

---

## Quarterly Review Protocol

Every quarter:

1. Update `Strategy/00_MASTER-PLAN/PERFORMANCE-DASHBOARD.md` with actuals
2. Review each active discipline PLAN.md — adjust Q[N+1] targets if needed
3. Update `STATE.md` with current discipline statuses
4. Add entry to `Core_Strategy/00_META/CHANGELOG.md` (in MIR)
5. Consider: should any INACTIVE discipline be activated? Any ACTIVE discipline be paused?

---

## Repository Naming

```
P[N]-[client-slug]-MSP/
```

Examples:
- `P0-esteban-marketing-MSP/` — The agency's own marketing plan
- `P1-acme-corp-MSP/`
- `P7-brand-name-MSP/`

The MIR and MSP are separate repositories that live side by side:
```
P0-esteban-marketing/      ← MIR
P0-esteban-marketing-MSP/  ← MSP (this repo)
```
