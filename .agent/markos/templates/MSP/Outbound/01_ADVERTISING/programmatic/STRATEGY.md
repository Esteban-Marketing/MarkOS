# [Sub-Channel] Strategy

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Outbound/01_ADVERTISING/programmatic/STRATEGY.md to customize it safely.


```
status      : empty
parent_plan : Outbound/01_ADVERTISING/PLAN.md
last_updated: YYYY-MM-DD
```

> This file contains the channel-specific detail for this advertising sub-channel.
> Strategic direction comes from `Outbound/01_ADVERTISING/PLAN.md`.
> This file covers platform mechanics, audience setup, creative specs, and bid strategy.

---

## Platform Overview

```yaml
platform          : "[FILL]"
account_id        : "[From MIR PAID-MEDIA.md]"
monthly_budget    : "$[FILL]"
primary_objective : "[FILL]"
campaign_type     : "[FILL]"
status            : "[ACTIVE | INACTIVE | TESTING]"
```

---

## Audience Configuration

**Cold audience targeting:**
[FILL — interests, demographics, behaviors]

**Custom audiences:**
[FILL — sources, window sizes]

**Lookalike audiences:**
[FILL — source, percentage, test plan]

**Exclusions:**
[FILL]

---

## Campaign Structure

```
Campaign: [Name] — [Objective]
  Ad Set 1: [Audience description] — Budget: $[FILL]/day
    Ad 1.1: [Format] — [Hook/angle]
    Ad 1.2: [Format] — [Hook/angle]
  Ad Set 2: [Audience description] — Budget: $[FILL]/day
    Ad 2.1: [Format] — [Hook/angle]
```

---

## Creative Specifications

| Format | Dimensions | Duration | Copy Length | CTA |
|--------|-----------|---------|-------------|-----|
| [FILL] | [From MIR BRAND-IDENTITY.md] | [FILL] | [FILL] | [FILL] |

---

## Bid Strategy

```yaml
bidding_method    : "[Lowest cost / Cost cap / Target ROAS]"
initial_bid_cap   : "$[FILL or N/A]"
budget_type       : "[Daily | Lifetime]"
daily_budget      : "$[FILL]"
```

---

## Platform-Specific Tracking

```yaml
pixel_id          : "[From MIR PAID-MEDIA.md]"
conversion_events : "[Events tracked — e.g. Lead, Purchase]"
attribution_window: "[7-day click, 1-day view]"
capi_status       : "[ACTIVE | CONFIGURED | NOT_CONFIGURED]"
```

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| CPL | $[FILL] | >$[FILL] for 5+ days |
| CTR | [FILL]% | <[FILL]% |
| CPC | $[FILL] | >[FILL] |
| [Other] | [FILL] | [FILL] |

---

## Notes & Observations

[Log significant learnings, tests, and changes here as the plan evolves.]
