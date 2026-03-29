# FUNNEL-ANALYSIS.md — Stage-by-Stage Conversion Analysis

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Inbound/11_CRO/FUNNEL-ANALYSIS.md to customize it safely.


```
status      : empty
last_updated: YYYY-MM-DD
```

> Source of truth: PostHog. Update monthly. Identify the one biggest leak and fix it.

---

## Monthly Funnel Snapshot

**Period:** [YYYY-MM]

| Step | Event | Volume | Conversion Rate | vs. Previous Month | vs. Target |
|------|-------|--------|---------------|-------------------|-----------|
| 1 — Landing page view | `page_viewed` | [#] | 100% | — | — |
| 2 — Form started | `form_started` | [#] | [%] | [↑/↓ %] | [On target / Below] |
| 3 — Lead submitted | `lead_submitted` | [#] | [%] | [FILL] | [FILL] |
| 4 — Thank you page | `thank_you_page_viewed` | [#] | [%] | [FILL] | [FILL — should be ≥95%] |

**Biggest drop-off this month:** Step [X] → Step [Y]
**Hypothesis for drop-off:** [FILL]
**Test queued to address it:** [T-00X or NONE]

---

## Historical Funnel Trend

| Month | LP→Form Start | Form Start→Submit | Submit→TY Page | Overall LP→Lead |
|-------|--------------|------------------|---------------|----------------|
| [YYYY-MM] | [%] | [%] | [%] | [%] |
