# Organic Social Media Plan

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Social/04_SOCIAL-MEDIA/PLAN.md to customize it safely.


```
discipline    : Organic Social Media
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Unaware → Aware → Considering (brand building + credibility)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Organic social does not generate predictable leads at scale. It builds the ambient 
> credibility that makes everything else work better — ads convert higher, emails get opened, 
> and sales calls close faster when the prospect has seen organic content first.
> Organic social is a long game. Do not measure it on a 30-day timeline.

---

## Why This Discipline

[FILL — specific role: is this brand building, proof distribution, founder positioning,
community, or direct response support? What specific outcome justifies the time investment?]

**Activation threshold:**
[FILL — e.g. "Organic social is active only if {{LEAD_AGENT}} can commit to [X] hours/week of content creation.
Below that threshold, it is not active — a quiet profile is better than an inconsistent one."]

---

## 1. Situation Analysis

```yaml
primary_platform     : "[From MIR ORGANIC-SOCIAL.md]"
follower_counts      : "[FILL per platform]"
current_reach        : "[FILL avg per post or UNKNOWN]"
engagement_rate      : "[FILL% or UNKNOWN]"
posting_consistency  : "[Regular | Sporadic | None]"
content_ownership    : "[{{LEAD_AGENT}} only | Designer + {{LEAD_AGENT}} | External]"
```

---

## 2. Goals & KPIs

| KPI | Baseline | Q1 | Q2 | Q3 | Q4 | Source |
|-----|----------|----|----|----|----|----|
| Avg monthly reach | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | Platform analytics |
| Avg engagement rate | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | Platform analytics |
| Social → website sessions | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | PostHog utm_medium=organic |
| Inbound DMs (qualified) | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | Manual count |
| Followers gained | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | Platform |

---

## 3. Platform Strategy

> Full platform-by-platform strategy in `PLATFORM-STRATEGIES.md`.

**Platform priority decision:**
[FILL — rationale for platform selection. Why these, not others.
Where is ICP-1 spending time? What format plays to the brand's strengths?]

| Platform | Role | Cadence | Primary Format | Owner |
|---------|------|---------|---------------|-------|
| [e.g. Instagram] | [Brand + proof] | [4x/week] | [Reels + Stories] | [{{LEAD_AGENT}}] |
| [e.g. LinkedIn] | [Thought leadership] | [3x/week] | [Text posts + articles] | [{{LEAD_AGENT}}] |
| [e.g. TikTok] | [Organic reach test] | [2x/week] | [Short video] | [{{LEAD_AGENT}}] |

**Platforms NOT being used and why:**
[FILL — deliberate exclusion with rationale]

---

## 4. Content Architecture

**Organic content pillars:**
[Reference MIR `Campaigns_Assets/07_CONTENT/CONTENT-STRATEGY.md` — summarize here]

**Content-to-ad pipeline:**
[FILL — e.g. "Every Reel is posted organically first. After 48h, if engagement rate > [X]%, 
it is briefed as an ad creative. Top monthly organic post is always tested as a cold audience ad."]

**Posting philosophy:**
[FILL — e.g. "Quality over frequency. One genuinely useful post per day beats five forgettable ones.
Every post must pass the 'would I save or share this?' test before publishing."]

---

## 5. Community Management

> Detail in `COMMUNITY-PLAYBOOK.md`.

**Response commitment:**
```yaml
comment_response_sla    : "[e.g. All comments responded to within 4 business hours]"
dm_response_sla         : "[e.g. Within 24 hours on business days]"
proactive_engagement    : "[e.g. Comment on 5 target-audience posts per day]"
```

---

## 6. Analytics & Measurement

```yaml
platform_data_role      : "Signal only — do not make strategy decisions on platform reach alone"
posthog_tracking        : "Track social → site sessions via UTM parameters"
monthly_review          : "Review top 3 and bottom 3 posts. Extract pattern. Update format mix."
reporting_source        : "Platform native analytics for social metrics. PostHog for website conversion."
```
