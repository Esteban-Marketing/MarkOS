# Product Marketing Plan

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Outbound/09_PRODUCT-MARKETING/PLAN.md to customize it safely.


```
discipline    : Product Marketing
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Considering → Deciding (product-level differentiation and launch)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Product marketing sits at the intersection of product, marketing, and sales.
> It answers three questions: Who is this for? What does it do that matters to them?
> Why choose this over alternatives? Without product marketing, sales teams wing it,
> ads say vague things, and positioning erodes into "we're the best" generic claims.

---

## Why This Discipline

[FILL — is there a product launch imminent? Are current messages not converting?
Is sales struggling to articulate differentiation? Are competitors stealing positioning?
Product marketing is most urgent when the offer is evolving or the market is crowded.]

---

## 1. Situation Analysis

```yaml
product_count           : "[Number of active products/services — from MIR CATALOG.md]"
recent_launches         : "[Products launched in last 12 months]"
planned_launches        : "[Products in development — see MIR CATALOG.md COMING_SOON]"
competitive_pressure    : "[Are competitors actively reframing the category? YES/NO]"
sales_conversion_rate   : "[Current call-to-close rate from MIR KPI-FRAMEWORK.md]"
win_loss_data           : "[YES — patterns identified | NO — not tracked]"
```

---

## 2. Goals & KPIs

| KPI | Baseline | Annual Target | Source |
|-----|----------|--------------|--------|
| Sales conversion rate | [FILL]% | [FILL]% | CRM |
| Average deal size | $[FILL] | $[FILL] | CRM |
| Time-to-close | [FILL] days | [FILL] days | CRM |
| Win rate vs. named competitors | [FILL]% | [FILL]% | CRM win/loss |
| Product page conversion rate | [FILL]% | [FILL]% | PostHog |
| Feature adoption (if SaaS) | [FILL]% | [FILL]% | PostHog |

---

## 3. Product Positioning

> Derives from MIR `Market_Audiences/03_MARKET/POSITIONING.md`. This section covers product-level positioning.

**Product-level positioning for each active offer:**

### [Product P001 from MIR CATALOG.md]

```yaml
product_id    : "P001"
category      : "[What category does this compete in?]"
for_whom      : "[Most specific description of the right buyer]"
key_benefit   : "[The ONE benefit that matters most to them]"
differentiator: "[Why this product, not an alternative]"
proof         : "[The strongest proof point for this product specifically]"
objection     : "[The #1 reason prospects don't buy — and the counter]"
```

**Feature-benefit translation table:**

| Feature (what it is) | Benefit (what it does) | Proof (why believe it) |
|---------------------|----------------------|----------------------|
| [FILL] | [FILL] | [FILL] |
| [FILL] | [FILL] | [FILL] |

---

## 4. Go-to-Market Framework

> Detail for each launch in `GO-TO-MARKET.md`.

**Launch calendar this year:**

| Product | Launch Type | Target Date | Owner | Budget |
|---------|------------|------------|-------|--------|
| [FILL] | [NEW / RELAUNCH / FEATURE UPDATE] | [YYYY-MM-DD] | {{LEAD_AGENT}} | $[FILL] |

**Standard launch checklist:**

Pre-launch (T-4 weeks):
- [ ] Product page live and tracking via PostHog
- [ ] Messaging finalized in MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- [ ] Sales enablement materials ready (deck, objection guide)
- [ ] Email sequence drafted for launch announcement
- [ ] Ad creative briefed to designer
- [ ] Launch offer created in MIR `Products/04_PRODUCTS/OFFERS.md`

Launch week:
- [ ] Email broadcast to full list
- [ ] Paid ads activated with launch message
- [ ] Social announcement posts scheduled
- [ ] PR outreach (if applicable)

Post-launch (T+30 days):
- [ ] PostHog funnel data reviewed
- [ ] Win/loss pattern documented
- [ ] Messaging adjusted based on sales call feedback

---

## 5. Competitive Positioning

> Detail in `COMPETITIVE-POSITIONING.md`.

**Battle cards (for {{LEAD_AGENT}}'s discovery calls):**

### vs. [Competitor Name]

```yaml
competitor_strengths  : "[What they're genuinely better at]"
competitor_weaknesses : "[Where they fall short]"
our_advantages        : "[What we do better — with proof]"
their_likely_pitch    : "[What they'll say against us]"
our_counter           : "[How to respond — factual, not defensive]"
```

---

## 6. Sales Enablement

**Materials product marketing produces for the sales process:**

| Asset | Purpose | Status | Location |
|-------|---------|--------|---------|
| Discovery call deck | Visual aid for {{LEAD_AGENT}}'s calls | [FILL] | [Drive link] |
| Objection handling guide | Quick reference during calls | [FILL] | [Drive link] |
| Case study deck | Proof for evaluating prospects | [FILL] | [Drive link] |
| Pricing one-pager | Send after call | [FILL] | [Drive link] |
| Competitive battle cards | In-call reference | [FILL] | [Drive link] |

---

## 7. Voice of Customer Program

**How customer insight is captured and fed back into positioning:**

```yaml
win_loss_interviews     : "[YES — frequency: [X]/quarter | NOT_ACTIVE]"
client_interviews       : "[YES — timing: [90 days after onboarding] | NOT_ACTIVE]"
sales_call_review       : "[YES — {{LEAD_AGENT}} reviews patterns monthly | NOT_ACTIVE]"
survey_cadence          : "[YES — [frequency] | NOT_ACTIVE]"
```

**Where insights go:**
[FILL — e.g. "Key quote or insight → update MIR MESSAGING-FRAMEWORK.md.
Pattern in objections → update COMPETITIVE-POSITIONING.md.
New proof point → add to MIR MESSAGING-FRAMEWORK.md §7."]
