
# MarkOS Performance Dashboard — Cross-Discipline KPI Scorecard

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Strategy/00_MASTER-PLAN/PERFORMANCE-DASHBOARD.md to customize it safely.

---

## LLM-Optimized Summary

This dashboard provides single-view performance tracking across all active MarkOS disciplines. Updated monthly, it serves as the executive summary of marketing health. All legacy “MARKOS”/“markos” names have been replaced with “MarkOS” except in historical or compatibility contexts. Structured for LLM chunking and cross-referencing.

**See also:**
- [STRATEGIC-GOALS.md](STRATEGIC-GOALS.md)
- [README.md](../../../../README.md)



---

**File Purpose:**
Single-view performance tracking across all active disciplines. Updated monthly. The executive summary of marketing health. Updated for MarkOS v2.2.

**Status:** [FILL]
**Plan Period:** [FILL]
**Last Updated:** 2026-03-28

---

> **Source of truth for all numbers: PostHog.** Platform numbers (Meta, Google, etc.) are listed
> as signal only — never used as the basis for optimization decisions.

---


## 1. North Star Metric

**Summary:**
Tracks the primary north star metric for the MarkOS marketing program. Use as the top-level KPI for all contributors.

| Metric | Target | Current Month | Last Month | Trend | Status |
|--------|--------|--------------|-----------|-------|--------|
| [North star from STRATEGIC-GOALS.md] | [FILL] | [FILL] | [FILL] | [↑ / ↓ / →] | [🟢 / 🟡 / 🔴] |

---


## 2. Acquisition Scorecard

**Summary:**
Tracks acquisition metrics across the funnel, including leads, CPL, and conversion rates. Source of truth: PostHog and CRM.

| Metric | Target | MTD | Last Month | YTD | Source |
|--------|--------|-----|-----------|-----|--------|
| Total leads | [FILL] | — | — | — | PostHog `lead_submitted` |
| Qualified leads | [FILL] | — | — | — | CRM |
| CPL (qualified) | [FILL] | — | — | — | PostHog + Spend |
| LP conversion rate | [FILL]% | — | — | — | PostHog funnel |
| Organic sessions | [FILL] | — | — | — | PostHog `page_viewed` |
| Email subscribers added | [FILL] | — | — | — | ESP |

---


## 3. Activation Scorecard

**Summary:**
Tracks activation metrics, including lead-to-call and call-to-close rates. Use for pipeline health monitoring.

| Metric | Target | MTD | Last Month | YTD | Source |
|--------|--------|-----|-----------|-----|--------|
| Lead-to-call rate | [FILL]% | — | — | — | CRM |
| Call-to-close rate | [FILL]% | — | — | — | CRM |
| Time-to-call (days) | ≤ [FILL] | — | — | — | CRM |

---


## 4. Revenue Scorecard

**Summary:**
Tracks revenue, new clients, CAC, and MER. Use for financial performance and ROI analysis.

| Metric | Target | MTD | Last Month | YTD | Source |
|--------|--------|-----|-----------|-----|--------|
| Marketing-sourced revenue | $[FILL] | — | — | — | CRM |
| New clients from marketing | [FILL] | — | — | — | CRM |
| CAC | $[FILL] | — | — | — | CRM + Spend |
| MER | [FILL]:1 | — | — | — | CRM + Spend |

---


## 5. Discipline Scorecards

**Summary:**
Tracks KPIs for each active discipline (advertising, content, email, social, SEO, etc.). Use for discipline-level accountability.

### 01 — Advertising

| Metric | Target | This Month | Last Month | Status |
|--------|--------|-----------|-----------|--------|
| Total ad spend | $[FILL] | — | — | — |
| Meta CPL | $[FILL] | — | — | 🟢/🟡/🔴 |
| Google CPL | $[FILL] | — | — | — |
| CAPI match quality | ≥ 7.0 | — | — | — |
| PostHog vs. CAPI discrepancy | ≤ 15% | — | — | — |

### 02 — Content Marketing

| Metric | Target | This Month | Last Month | Status |
|--------|--------|-----------|-----------|--------|
| Content pieces published | [FILL] | — | — | — |
| Organic sessions from content | [FILL] | — | — | — |
| Content-to-lead attributions | [FILL] | — | — | — |

### 03 — Email Marketing

| Metric | Target | This Month | Last Month | Status |
|--------|--------|-----------|-----------|--------|
| Open rate | [FILL]% | — | — | — |
| Click rate | [FILL]% | — | — | — |
| Email-attributed leads | [FILL] | — | — | — |
| List size | [FILL] | — | — | — |
| Unsubscribe rate | ≤ 0.5% | — | — | — |

### 04 — Organic Social

| Metric | Target | This Month | Last Month | Status |
|--------|--------|-----------|-----------|--------|
| Total reach | [FILL] | — | — | — |
| Engagement rate | [FILL]% | — | — | — |
| Social-attributed sessions | [FILL] | — | — | — |

### 06 — SEO

| Metric | Target | This Month | Last Month | Status |
|--------|--------|-----------|-----------|--------|
| Organic search sessions | [FILL] | — | — | — |
| Keyword rankings (top 10) | [FILL] | — | — | — |
| Domain rating (Ahrefs) | [FILL] | — | — | — |

### [Add other active disciplines]

---


## 6. Tracking Health

**Summary:**
Monitors the health of tracking infrastructure (PostHog, CAPI, n8n, CRM sync). Use for data quality assurance.

| Check | Target | Status | Last Verified |
|-------|--------|--------|--------------|
| PostHog firing on all pages | 100% | — | — |
| Meta CAPI Lead events | Active | — | — |
| CAPI event quality score | ≥ 7.0 | — | — |
| PostHog ↔ CAPI discrepancy | ≤ 15% | — | — |
| n8n WF-001 error rate | 0% | — | — |
| CRM sync | Active | — | — |

---


## 7. Month-Over-Month Trend

**Summary:**
Visualizes key metrics over time for trend analysis and forecasting.

| Metric | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Qualified leads | | | | | | | | | | | | |
| CPL | | | | | | | | | | | | |
| Revenue attributed | | | | | | | | | | | | |

---


## 8. Status Key

**Summary:**
Defines the meaning of status icons for all scorecards. Use for quick interpretation of dashboard status.

---

## LLM-Optimized Reference & Cross-Links

**For further details and implementation context:**
- [v2.2-MILESTONE-AUDIT.md](../../../../.planning/v2.2-MILESTONE-AUDIT.md): Full audit of v2.2 milestone, including rollout hardening and MarkOSDB migration.
- [README.md](../../../../README.md): Quickstart, install, and onboarding instructions.
- [onboarding/backend/](../../../../onboarding/backend/): All backend agent, skill, and utility modules.

**MarkOS replaces all legacy MARKOS/markos names.**
If you find any remaining legacy references, treat them as historical or for compatibility only.

```
🟢  At or above target
🟡  Within 15% below target — monitor
🔴  More than 15% below target — action required
⚪  Not yet measured or inactive
```
