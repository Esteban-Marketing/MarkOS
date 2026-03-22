# PERFORMANCE-DASHBOARD.md — Cross-Discipline KPI Scorecard

```
file_purpose  : Single-view performance tracking across all active disciplines.
                Updated monthly. The executive summary of marketing health.
status        : empty
plan_period   : YYYY
last_updated  : YYYY-MM-DD
```

> **Source of truth for all numbers: PostHog.** Platform numbers (Meta, Google, etc.) are listed
> as signal only — never used as the basis for optimization decisions.

---

## 1. North Star Metric

| Metric | Target | Current Month | Last Month | Trend | Status |
|--------|--------|--------------|-----------|-------|--------|
| [North star from STRATEGIC-GOALS.md] | [FILL] | [FILL] | [FILL] | [↑ / ↓ / →] | [🟢 / 🟡 / 🔴] |

---

## 2. Acquisition Scorecard

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

| Metric | Target | MTD | Last Month | YTD | Source |
|--------|--------|-----|-----------|-----|--------|
| Lead-to-call rate | [FILL]% | — | — | — | CRM |
| Call-to-close rate | [FILL]% | — | — | — | CRM |
| Time-to-call (days) | ≤ [FILL] | — | — | — | CRM |

---

## 4. Revenue Scorecard

| Metric | Target | MTD | Last Month | YTD | Source |
|--------|--------|-----|-----------|-----|--------|
| Marketing-sourced revenue | $[FILL] | — | — | — | CRM |
| New clients from marketing | [FILL] | — | — | — | CRM |
| CAC | $[FILL] | — | — | — | CRM + Spend |
| MER | [FILL]:1 | — | — | — | CRM + Spend |

---

## 5. Discipline Scorecards

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

| Metric | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Qualified leads | | | | | | | | | | | | |
| CPL | | | | | | | | | | | | |
| Revenue attributed | | | | | | | | | | | | |

---

## 8. Status Key

```
🟢  At or above target
🟡  Within 15% below target — monitor
🔴  More than 15% below target — action required
⚪  Not yet measured or inactive
```
