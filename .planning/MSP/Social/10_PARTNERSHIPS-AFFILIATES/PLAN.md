# Partnerships & Affiliates Plan

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Social/10_PARTNERSHIPS-AFFILIATES/PLAN.md to customize it safely.


```
discipline    : Partnerships & Affiliates
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Unaware → Aware + Deciding (borrowed reach and referral acceleration)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Partnerships are the highest-leverage, lowest-cost acquisition channel when done right.
> A partner sends their trusted audience to you — cold traffic becomes warm overnight.
> Affiliate programs turn satisfied clients into a commission-paid sales force.
> Neither works without a compelling offer and a clear tracking mechanism.

---

## Why This Discipline

[FILL — what type of partnership is most relevant here?
Co-marketing with adjacent services? Affiliates from the client base?
Technology integrations? Referral programs?]

**Partnership hypothesis:**
[FILL — e.g. "Marketing agencies that serve e-commerce but don't offer technical tracking setup
are a natural referral source for our attribution service. One active agency partner could
deliver 3–5 qualified referrals per month."]

---

## 1. Situation Analysis

```yaml
existing_partnerships   : "[YES — list | NONE]"
existing_affiliates     : "[YES — count | NONE]"
referral_rate_organic   : "[% of leads that come from word-of-mouth currently]"
client_advocacy_level   : "[High — clients actively refer | Moderate | Low | Unknown]"
technology_integrations : "[Tools this business integrates with that could partner]"
```

---

## 2. Goals & KPIs

| KPI | Baseline | Annual Target | Source |
|-----|----------|--------------|--------|
| Partnership-attributed leads | 0 | [FILL] | PostHog utm_source=partner |
| Active partners | 0 | [FILL] | Partner roster |
| Affiliate-attributed leads | 0 | [FILL] | PostHog + affiliate tracking |
| CPL via partnership | — | $[FILL] | Spend ÷ partner leads |
| Partner NPS (satisfaction) | — | [FILL] | Partner survey |

---

## 3. Partnership Types

**Strategic partner (co-marketing):**
[FILL — definition of an ideal co-marketing partner: serves same ICP, non-competing service,
mutual audience overlap. What the relationship looks like in practice.]

**Referral partner:**
[FILL — who sends referrals: existing clients, adjacent service providers, ex-colleagues.
Compensation model: fee, reciprocal referrals, or goodwill only.]

**Technology partner:**
[FILL — platforms this business builds on that have partner programs: n8n, PostHog, Vibe code, etc.]

---

## 4. Partner Profile

**Ideal strategic partner:**

```yaml
serves_same_icp         : "YES — required"
competitive_overlap     : "NONE — required"
audience_size           : "[Minimum following or list size]"
content_alignment       : "[Produces content our ICP consumes]"
partner_capacity        : "[Has bandwidth for joint initiatives]"
geography               : "[Matches MIR PROFILE.md operating_regions]"
```

---

## 5. Affiliate Program Structure

> Detail in `AFFILIATE-PROGRAM.md`.

```yaml
program_status          : "[ACTIVE | PLANNING | NOT_ACTIVE]"
commission_model        : "[% of first month | Flat fee per qualified lead | FILL]"
commission_rate         : "[FILL]"
payment_trigger         : "[On lead qualification | On contract signed | After 30-day retention]"
tracking_method         : "[Unique UTM per affiliate | Promo code | Dedicated landing page]"
min_payout_threshold    : "$[FILL]"
payment_schedule        : "[Monthly | Quarterly]"
affiliate_assets        : "[Tracking links, messaging brief, approved copy provided to affiliates]"
```

---

## 6. Active Partners

> Detail in `STRATEGIC-PARTNERS.md`.

| Partner Name | Type | ICP Overlap | Agreement | Monthly Referrals | Status |
|-------------|------|------------|-----------|------------------|--------|
| [FILL] | [Strategic / Affiliate / Tech] | [HIGH/MED/LOW] | [FORMAL / INFORMAL] | [FILL] | [ACTIVE / PROSPECTING] |

---

## 7. Co-Marketing Initiatives

**Planned joint initiatives:**

| Initiative | Partner | Format | Audience Reach | Timeline | Goal |
|-----------|---------|--------|---------------|---------|------|
| [e.g. Joint webinar] | [FILL] | [Live event] | [FILL] | [Q2] | [FILL] |
| [e.g. Co-authored guide] | [FILL] | [PDF + email] | [FILL] | [Q3] | [FILL] |
| [e.g. Newsletter swap] | [FILL] | [Dedicated send] | [FILL] | [Monthly] | [FILL] |

---

## 8. Tracking & Attribution

```yaml
partner_utm_format      : "utm_source=partner&utm_medium=referral&utm_content=[partner-slug]"
affiliate_utm_format    : "utm_source=affiliate&utm_medium=referral&utm_content=[affiliate-id]"
posthog_cohort          : "Partner-attributed leads — filter: utm_source = partner OR affiliate"
capi_event              : "Lead event fires normally — source tracked via utm properties"
```
