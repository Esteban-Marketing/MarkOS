# Conversion Rate Optimization Plan

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Inbound/11_CRO/PLAN.md to customize it safely.


```
discipline    : Conversion Rate Optimization (CRO)
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : All stages (removes friction everywhere in the funnel)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> CRO is the discipline that makes every other discipline more efficient.
> If paid ads generate 100 leads but only 2% book a call, CRO fixes the 2%.
> It is the multiplier — it does not generate traffic, it converts what you already have.
> Do not invest in CRO before you have enough traffic to generate statistically valid test results.
> Minimum: 500+ monthly landing page sessions before A/B testing is meaningful.

---

## Why This Discipline

[FILL — what conversion bottleneck does CRO address here?
Landing page conversion rate below benchmark? Form abandonment? High CPL?
Cart abandonment? Low email CTR? Name the specific leak in the funnel.]

**Activation threshold:**
[FILL — e.g. "CRO becomes active when landing page sessions exceed 500/month.
Below that, change the page based on qualitative data (session recordings, heuristics)."]

---

## 1. Situation Analysis

**Current funnel conversion rates:**

| Funnel Step | Current Rate | Benchmark | Gap | Priority |
|------------|-------------|-----------|-----|---------|
| LP visitors → Form start | [FILL]% | [e.g. 15%] | [FILL] | [H/M/L] |
| Form start → Form submit | [FILL]% | [e.g. 70%] | [FILL] | [H/M/L] |
| Form submit → Call booked | [FILL]% | [e.g. 80%] | [FILL] | [H/M/L] |
| Call booked → Show | [FILL]% | [e.g. 75%] | [FILL] | [H/M/L] |
| Email CTR | [FILL]% | [e.g. 2.5%] | [FILL] | [H/M/L] |

> Source: PostHog funnel analysis. Reference MIR `Core_Strategy/06_TECH-STACK/TRACKING.md`.

---

## 2. Goals & KPIs

| KPI | Baseline | Q1 | Q2 | Q3 | Q4 | Source |
|-----|----------|----|----|----|----|----|
| LP conversion rate | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | PostHog funnel |
| Form completion rate | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | PostHog |
| Email CTR | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | ESP |
| CPL improvement (via CRO) | $[FILL] | $[FILL] | $[FILL] | $[FILL] | $[FILL] | PostHog + spend |

---

## 3. Research Framework

**Before running any test, diagnose with data:**

```
STEP 1 — QUANTITATIVE (PostHog)
  Where is the biggest drop-off in the funnel?
  What is the heatmap showing on the landing page?
  What is session replay showing? Where do people stop scrolling?
  What is the form field abandonment rate?

STEP 2 — QUALITATIVE
  What does the thank-you page survey say? (1 question: "What almost stopped you from filling this out?")
  What objections come up on discovery calls?
  What does MIR MESSAGING-FRAMEWORK.md §8 say about objections?

STEP 3 — HEURISTIC ANALYSIS
  Does the page headline match the ad that sent traffic here? (Message match)
  Is the CTA above the fold?
  Is there a single, clear CTA — or multiple competing options?
  Is load time under 2.5 seconds (Core Web Vitals)?
  Does the page work on mobile? (>60% of traffic is mobile)
  Is social proof visible before the CTA?
```

---

## 4. Testing Roadmap

> Detail in `TESTING-ROADMAP.md`.

**Testing priority framework:**
```yaml
test_priority_rule    : "Test the element with the highest potential impact first.
                         Headlines > CTAs > Page structure > Colors > Imagery."
min_sample_size       : "[e.g. 100 conversions per variant for statistical significance]"
test_duration_minimum : "14 days (capture full week-over-week variation)"
significance_threshold: "95% statistical confidence before declaring a winner"
tool                  : "[PostHog A/B flags | VWO | Optimizely | Google Optimize successor]"
```

**Active test queue:**

| Test # | Element | Hypothesis | Control | Variant | Status | Start Date | End Date |
|--------|---------|-----------|---------|---------|--------|-----------|---------|
| T-001 | [e.g. Headline] | [If we lead with outcome instead of feature, CVR increases] | [Current headline] | [New headline] | [QUEUED / RUNNING / COMPLETE] | [Date] | [Date] |
| T-002 | [FILL] | [FILL] | [FILL] | [FILL] | [QUEUED] | [FILL] | [FILL] |

---

## 5. Funnel Analysis

> Detail in `FUNNEL-ANALYSIS.md`.

**Monthly funnel audit protocol:**

```
1. Pull PostHog funnel report for past 30 days
2. Identify the step with the largest absolute drop-off
3. Pull session recordings for users who dropped off at that step
4. Identify 3 patterns in the drop-off behavior
5. Generate 1–2 hypotheses for why they dropped off
6. Add highest-confidence hypothesis to test queue
7. Document in FUNNEL-ANALYSIS.md
```

---

## 6. Landing Page Standards

**Every Vibe code landing page must meet these CRO standards before launch:**

```
Performance:
  □ LCP < 2.5 seconds on mobile (Core Web Vitals)
  □ No layout shift (CLS < 0.1)
  □ Mobile-responsive, tested on iOS and Android

Above the fold:
  □ Headline matches ad message exactly (message match)
  □ Single, clear CTA visible without scrolling
  □ Trust signal visible (client count, logo, testimonial)

Form:
  □ Minimum required fields only (name + email at most for top-funnel)
  □ Progress indicator if multi-step form
  □ Error messages are helpful (not "Invalid input")
  □ Submit button is action-verb + benefit ("Book my free call")
  □ Privacy statement visible near submit button

Social proof:
  □ At least 2 proof elements visible before CTA
  □ Proof is specific (name, company, result) — not generic ("Great service!")

Post-submit:
  □ Thank you page confirms action AND sets next step expectation
  □ PostHog thank_you_page_viewed event fires
  □ n8n WF-001 triggered correctly
```
