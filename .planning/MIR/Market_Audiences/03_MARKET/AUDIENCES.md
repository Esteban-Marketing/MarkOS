# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Market_Audiences/03_MARKET/AUDIENCES.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This is the "Identity Anchor" for targeting. `mgsd-analyst` MUST use Section 2 (Psychographic Profile) to validate all campaign hooks. `mgsd-media-buyer` MUST use Section 2 (Targeting Parameters) as the source of truth for platform audience configuration. `mgsd-copy-drafter` MUST ensure all copy aligns with the defined segments.

**Dependencies:** PROFILE (`../../Core_Strategy/01_COMPANY/PROFILE.md`), RESEARCH (`../../Research/AUDIENCE-RESEARCH.md`), CUSTOMER-JOURNEY (`../../Products/04_PRODUCTS/CUSTOMER-JOURNEY.md`)
**Assigned Agent:** `mgsd-analyst`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : Define exactly who this business sells to. Governs all targeting,
                messaging, and funnel decisions. This is the most campaign-critical
                file in the repository after PROFILE.md.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — source of truth for all audience-related decisions
```

---

<!-- SOURCED_FROM → MGSD-RES-AUD-01 (AUDIENCE-RESEARCH.md § Primary Segments, § Language & Vocabulary, § Channel Preferences) -->
<!-- AGENT: Before filling this file, read RESEARCH/AUDIENCE-RESEARCH.md in full -->

## 1. ICP Overview

> ICP = Ideal Customer Profile. This is not an aspiration — it is a description of the customer most likely to buy, most likely to stay, and most likely to generate referrals.

**Primary ICP in one sentence:**
[FILL — e.g. "E-commerce founders doing $50K–$500K/month in revenue, running their own Meta ads, frustrated that their ROAS keeps declining and they don't know why."]

**Secondary ICP (if applicable):**
[FILL or N/A]

---

## 2. Primary ICP — Full Profile

```yaml
icp_id          : "ICP-1"
icp_name        : "[Internal label — e.g. 'The Frustrated Founder']"
```

### Demographics

```yaml
age_range           : "[e.g. 28–45]"
gender              : "[e.g. All | Male-skewing | Female-skewing]"
location            : "[e.g. Colombia, Mexico, Spain | US Spanish-speaking | LATAM]"
language            : "[e.g. Spanish primary]"
education_level     : "[e.g. University degree or equivalent experience]"
household_income    : "[e.g. $50K–$200K USD / year]"
```

### Professional Profile

```yaml
job_title           : "[e.g. Founder, Co-founder, Marketing Director, CMO]"
company_type        : "[e.g. Bootstrapped DTC e-commerce | B2B SaaS | Service business]"
company_size        : "[e.g. 1–20 employees]"
revenue_range       : "[e.g. $500K–$5M USD / year]"
decision_authority  : "[e.g. Final decision-maker on marketing spend]"
budget_authority    : "[e.g. Controls $5K–$50K/month ad budget]"
tools_they_use      : "[e.g. Shopify, Meta Ads Manager, Google Sheets, Klaviyo]"
```

### Psychographic Profile

**Goals (what they want to achieve):**
[FILL — 3–5 specific, concrete goals. Not vague aspirations.]

**Frustrations (what keeps them up at night):**
[FILL — 3–5 specific pain points, in their own words if possible]

**Fears (what they're afraid of):**
[FILL — the losses and risks they're trying to avoid]

**Identity (how they see themselves):**
[FILL — who they believe they are, what tribe they belong to]

**Aspirational identity (who they want to become):**
[FILL — the version of themselves after the problem is solved]

### Behavioral Profile

```yaml
content_consumption : "[e.g. LinkedIn, YouTube tutorials, marketing podcasts]"
search_behavior     : "[e.g. Googles 'how to improve ROAS', 'Meta ads not working']"
purchase_behavior   : "[e.g. Research-heavy, asks for referrals, skeptical of ads]"
decision_timeline   : "[e.g. 2–6 weeks from first contact to purchase]"
influenced_by       : "[e.g. Peers, case studies, specific thought leaders]"
skeptical_of        : "[e.g. Guarantees, agencies that don't show results first]"
```

### Buying Journey

| Stage | What They're Doing | What They Need From Us |
|-------|-------------------|----------------------|
| Unaware | [e.g. Blaming ad platform for poor results] | [e.g. Content that reframes the problem] |
| Problem-aware | [e.g. Searching for solutions, consuming content] | [e.g. Specific value prop that matches their diagnosis] |
| Solution-aware | [e.g. Comparing agencies/tools/DIY] | [e.g. Proof, differentiation, social proof] |
| Decision | [e.g. Ready to buy, needs a nudge] | [e.g. Clear offer, easy next step, risk reversal] |

### Targeting Parameters

> Use these when setting up ad audiences.

```yaml
meta_interests        : "[List relevant Facebook/Instagram interests]"
meta_behaviors        : "[Relevant behavioral targeting signals]"
meta_lookalike_source : "[Source audience for lookalike — e.g. email list, purchasers]"
google_keywords       : "[Top 10 search terms this audience uses]"
google_audiences      : "[In-market or custom intent audiences]"
tiktok_interests      : "[TikTok interest categories]"
```

---

## 3. Secondary ICP (if applicable)

```yaml
icp_id    : "ICP-2"
icp_name  : "[Internal label]"
```

[Repeat the same structure as ICP-1 above]

---

## 4. Negative Audience (Who We Do NOT Sell To)

> Explicitly define who is excluded. This is as important as the positive definition.

| Exclusion | Reason |
|-----------|--------|
| [e.g. Businesses under $10K/month revenue] | [Not ready for our service level] |
| [e.g. Agencies looking to white-label] | [Not our engagement model] |
| [e.g. Businesses seeking quick-fix campaigns without process buy-in] | [Poor fit, high churn] |

**Exclusion list for ad targeting:**
```yaml
meta_excluded_audiences   : "[e.g. Current clients, employees, competitors]"
google_excluded_audiences : "[e.g. Converted users, bounced visitors <10 sec]"
```

---

## 5. Audience Segments for Campaign Use

> Operational segments used when setting up campaigns. Reference these by segment_id in campaign files.

| Segment ID | Name | Platform | Description | Funnel Stage |
|-----------|------|---------|-------------|-------------|
| SEG-001 | [Name] | Meta | [FILL] | [Top/Mid/Bottom] |
| SEG-002 | [Name] | Meta | [FILL] | [Top/Mid/Bottom] |
| SEG-003 | [Name] | Google | [FILL] | [Top/Mid/Bottom] |
| SEG-004 | [Name] | Retargeting | [FILL] | [Bottom] |

---

## 6. Audience Research Sources

**Where audience insights were gathered:**
[FILL — e.g. "10 customer interviews Q1 2025. Survey of 47 leads. Sales call recordings."]

**Last audience research date:**
[YYYY-MM-DD]

**Next audience research scheduled:**
[YYYY-MM-DD or UNSCHEDULED]