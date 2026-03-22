# Advertising Plan — Paid Media Strategy

```
discipline    : Advertising (Paid Media)
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Considering → Deciding (primary) / Unaware → Aware (brand campaigns)
status        : empty
plan_period   : YYYY
budget        : $[FILL] (from BUDGET-ALLOCATION.md)
last_updated  : YYYY-MM-DD
```

> Advertising is the most direct and controllable lever in the marketing system.
> It reaches defined audiences with defined messages at defined budgets. 
> It is also the most expensive to run without a clear tracking foundation.
> **Do not activate paid advertising until Gate 2 in MIR STATE.md is GREEN.**

---

## Why This Discipline

**Role in the marketing program:**
[FILL — e.g. "Primary lead generation engine. Responsible for 80% of qualified lead volume in Year 1. Paid media is the fastest path to predictable lead flow while organic channels are being built."]

**What makes advertising the right primary channel for this business:**
[FILL — audience is findable on paid platforms, budget exists to test, offer has been validated, tracking is in place]

---

## 1. Situation Analysis

```yaml
existing_ad_accounts    : "[YES — audit in MIR PAID-MEDIA.md | NO — to be created]"
historical_ad_spend     : "$[FILL] or NONE"
historical_cpl          : "$[FILL] or UNKNOWN"
pixel_quality_score     : "[High / Medium / Low / No data]"
capi_status             : "[ACTIVE | NOT_CONFIGURED — must configure before launch]"
account_health          : "[Good | Restricted | Banned | New]"
```

**What paid media has and hasn't worked in the past:**
[FILL]

---

## 2. Goals & KPIs

| KPI | Baseline | Q1 | Q2 | Q3 | Q4 | Source |
|-----|----------|----|----|----|----|----|
| Qualified leads/month | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | PostHog `lead_submitted` + CRM |
| Cost per qualified lead | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | Spend ÷ PostHog leads |
| LP conversion rate | [FILL] | [FILL]% | [FILL]% | [FILL]% | [FILL]% | PostHog funnel |
| ROAS (if e-comm) | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | PostHog + CRM |
| CAPI event quality score | — | ≥ 7.0 | ≥ 7.5 | ≥ 8.0 | ≥ 8.0 | Meta Events Manager |

**Kill condition:**
[FILL — e.g. "CPL exceeds $[X] for 30 consecutive days after 3 rounds of optimization. Pause and review strategy."]

---

## 3. Platform Strategy

### Primary Platform: [Meta / Google / TikTok — CHOOSE ONE]

**Why this platform is primary:**
[FILL — audience size, cost, intent signal, creative fit]

**Campaign objective:**
```yaml
primary_objective     : "[Lead generation | Sales | Traffic | Awareness]"
bidding_strategy      : "[Lowest cost | Cost cap $[X] | Target ROAS]"
campaign_structure    : "[1 campaign / [N] ad sets / [N] ads per set]"
testing_approach      : "[ABO (Ad Set Budget) while testing. CBO (Campaign Budget) at scale.]"
```

### Platform Allocation

| Platform | Monthly Budget | Objective | Audience Type | Priority |
|----------|---------------|-----------|--------------|---------|
| [Meta] | $[FILL] | [Lead gen] | [ICP-1 cold + retargeting] | [P1] |
| [Google Search] | $[FILL] | [Lead gen] | [Keyword intent] | [P2] |
| [TikTok] | $[FILL] | [Awareness + Lead] | [Cold — ICP-1 interests] | [P3 / Test] |
| [X / LinkedIn] | $[FILL] | [FILL] | [FILL] | [FILL] |

---

## 4. Audience Architecture

> Full audience definitions: MIR `Market_Audiences/03_MARKET/AUDIENCES.md`.

**Cold audience strategy:**
[FILL — interest targeting, lookalike strategy, broad targeting with strong creative]

**Warm audience strategy:**
[FILL — retargeting rules, audience window, messaging shift from cold]

**Custom audience sources:**
```yaml
email_list_upload     : "[YES — CRM list synced monthly | NO]"
website_visitors      : "[YES — PostHog → Meta pixel via CAPI | NO]"
video_engagers        : "[YES — [X]% view threshold | NO]"
ig_engagers           : "[YES — [X] day window | NO]"
lookalike_source      : "[Email list of [ICP qualifier] | Past purchasers | Lead list]"
lookalike_percentage  : "[1% to start. Test 2-3% at scale.]"
```

---

## 5. Creative Strategy

> Full visual direction: MIR `Core_Strategy/02_BRAND/VISUAL-GUIDELINES.md`.
> Full messaging: MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`.

**Creative philosophy:**
[FILL — e.g. "Direct response creative. Hook in first 3 seconds. Problem-solution-proof structure. No brand-first openers."]

**Creative testing framework:**

```
PHASE 1 — Concept testing (first 30 days):
  Test: 3 different hooks / angles
  Format: Single image or short video (<30s)
  Audience: Broad cold (1 ad set per concept)
  Decision: Pick winning concept after 500+ impressions each

PHASE 2 — Format testing:
  Take winning concept
  Test: Static vs. video vs. carousel
  Decision: Pick winning format

PHASE 3 — Creative iteration:
  Refresh winning creative with new visuals, same message
  Rotate in 1 new concept per month
```

**Refresh trigger:**
[FILL — e.g. "CTR drops 30% vs. peak 7-day average OR frequency > 4 per user"]

---

## 6. Funnel Architecture

```
TOP OF FUNNEL (Cold)
  Objective : Awareness / Top-of-funnel lead capture
  Audience  : ICP-1 cold — interests + broad
  Message   : Problem-framed hook → value prop
  CTA       : Low-friction ("Learn more" / "Ver más")
  Budget    : [X]% of monthly

MIDDLE OF FUNNEL (Warm)  
  Objective : Conversion — lead capture
  Audience  : Website visitors (30d) + Video engagers (50%) + Email list
  Message   : Proof-heavy → direct offer
  CTA       : High-intent ("Agendar llamada" / "Ver oferta")
  Budget    : [X]% of monthly

BOTTOM OF FUNNEL (Hot retargeting)
  Objective : Conversion — close leads that didn't convert
  Audience  : Pricing page visitors (7d) + Form abandons
  Message   : Objection-handle → risk reversal
  CTA       : Direct ("Hablar con {{LEAD_AGENT}}" / "Reservar ahora")
  Budget    : [X]% of monthly
```

---

## 7. Tracking Requirements

> All tracking must be configured before any paid campaign launches.

**Required before launch (mandatory):**
- [ ] Meta pixel active on all Vibe code pages
- [ ] Meta CAPI `Lead` event firing via n8n WF-001
- [ ] CAPI event quality score ≥ 7.0 in test mode
- [ ] PostHog `lead_submitted` event firing with all required properties
- [ ] UTM parameters captured and flowing to CRM
- [ ] Event deduplication via `event_id` confirmed
- [ ] PostHog ↔ CAPI discrepancy ≤ 15% on test events

> Reference: MIR `Core_Strategy/06_TECH-STACK/TRACKING.md` and `Core_Strategy/06_TECH-STACK/AUTOMATION.md`

---

## 8. Optimization Protocol

```yaml
optimization_cadence  : "Review every 7 days. No changes in first 48h after launch."
budget_change_rule    : "Never change budget by >20% in a 7-day window (disrupts algorithm)"
creative_rotation     : "Introduce 1 new creative per month per winning ad set"
audience_expansion    : "Expand lookalike % only after CPL < target for 14 consecutive days"
```

**Decision tree:**

```
Is CPL within target?
  YES → Hold. Review creative fatigue (frequency).
  NO — First 7 days → Wait. Platform needs data.
  NO — Day 8-14 → Review audience and creative. A/B test new hook.
  NO — Day 15+ → Pause worst ad sets. Test new audience angle.
  NO — Day 30+ → Kill condition: review full strategy.
```

---

## 9. Sub-Strategies

> Detailed channel-specific strategies in sub-folders.

- `paid-social/STRATEGY.md` — Meta, TikTok, X, LinkedIn paid social detail
- `paid-search/STRATEGY.md` — Google Search and Shopping strategy
- `programmatic/STRATEGY.md` — Display and programmatic (if applicable)
