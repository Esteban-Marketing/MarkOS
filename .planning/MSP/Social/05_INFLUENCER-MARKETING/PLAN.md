# Influencer Marketing Plan

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Social/05_INFLUENCER-MARKETING/PLAN.md to customize it safely.


```
discipline    : Influencer Marketing
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Unaware → Aware (borrowed trust and reach)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Influencer marketing transfers credibility. An influencer's audience trusts them —
> that trust extends to what they recommend. It is best deployed when:
> (a) the brand's own social presence is too small to reach the ICP organically, and
> (b) there is a clear, compelling offer or proof point worth recommending.
> Do not activate influencer marketing without a case study or strong proof element.

---

## Why This Discipline (or Why Not)

**Activation rationale:**
[FILL — what specific proof point or offer makes influencer activation appropriate now?
OR: why is it not yet appropriate and what would change that?]

**Proof prerequisite:**
[FILL — e.g. "Minimum 2 published case studies required before any influencer activation.
Without proof, an influencer recommendation generates curiosity but not conversion."]

---

## 1. Situation Analysis

```yaml
influencer_budget       : "$[FILL] or NOT_ALLOCATED"
existing_relationships  : "[YES — [list] | NONE]"
brand_assets_ready      : "[YES — brief, offer, tracking links | NO — to be built]"
previous_campaigns      : "[YES — results: [FILL] | NONE]"
```

---

## 2. Goals & KPIs

| KPI | Baseline | Q1 | Q2 | Q3 | Q4 | Source |
|-----|----------|----|----|----|----|----|
| Influencer-attributed leads | 0 | [FILL] | [FILL] | [FILL] | [FILL] | PostHog utm_source=influencer |
| CPL via influencer | — | [FILL] | [FILL] | [FILL] | [FILL] | Spend ÷ PostHog leads |
| Content pieces produced | 0 | [FILL] | [FILL] | [FILL] | [FILL] | Manual count |
| Unique reach delivered | 0 | [FILL] | [FILL] | [FILL] | [FILL] | Partner reports |

---

## 3. Tier Framework

> Detail in `TIER-FRAMEWORK.md`.

| Tier | Follower Range | Use Case | Compensation Model | Vetting Criteria |
|------|---------------|---------|-------------------|-----------------|
| Nano | 1K–10K | High trust, niche communities | Product/service trade or small fee | [FILL] |
| Micro | 10K–100K | Targeted reach + credibility | Flat fee or hybrid | [FILL] |
| Macro | 100K–1M | Broad awareness | Negotiated flat fee | [FILL] |
| Mega | 1M+ | Mass awareness | Not recommended at this stage | [FILL] |

**Recommended tier for this stage:**
[FILL — e.g. "Micro only. Budget and proof level are not sufficient for macro. Micro delivers better engagement rate and more precise audience alignment."]

---

## 4. Partner Profile

**What an ideal influencer partner looks like for this business:**

```yaml
audience_match          : "[Their audience = ICP-1 from MIR AUDIENCES.md]"
content_style           : "[Educational / Authentic / Documentary — NOT curated lifestyle]"
engagement_rate_minimum : "[e.g. ≥ 3% for micro, ≥ 1.5% for macro]"
platform               : "[Primary: Instagram / TikTok / YouTube / LinkedIn / Podcast]"
location               : "[Matches MIR PROFILE.md operating_regions]"
topic_alignment        : "[Must create content in: [category]]"
disqualifiers          : "[Promotes competitors. Inconsistent posting. Fake follower signals. Unrelated niche.]"
```

---

## 5. Campaign Mechanics

**Briefing process:**
[FILL — what the influencer receives: product/service, key messages, what NOT to say, CTA,
tracking link format, disclosure requirements]

**Tracking setup:**
```yaml
tracking_method       : "[Unique UTM link per influencer: utm_source=influencer&utm_content=[handle]]"
landing_page          : "[Dedicated or tagged version of standard LP]"
promo_code            : "[YES — code: [format] | NO]"
posthog_event         : "lead_submitted with utm_source=influencer"
```

**Disclosure compliance:**
[FILL — per FTC / local advertising standards: #ad, #publicidad, #parceria — required language]

---

## 6. Partner Roster

> Detail in `PARTNER-ROSTER.md`.

| Handle | Platform | Tier | Niche | Status | CPL | Notes |
|--------|---------|------|-------|--------|-----|-------|
| [FILL] | [FILL] | [FILL] | [FILL] | [PROSPECTING / ACTIVE / PAUSED] | [FILL] | |

---

## 7. Content Rights

```yaml
content_ownership     : "[Influencer owns content unless explicitly negotiated otherwise]"
repurposing_rights    : "[Negotiate: RIGHT TO REPURPOSE for 6 months in paid ads. Essential.]"
exclusivity           : "[YES — [duration, competitor category] | NO]"
approval_required     : "[YES — {{LEAD_AGENT}} approves all content before publish | NO]"
```
