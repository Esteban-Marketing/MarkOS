# INDUSTRY.md — Market Definition & Dynamics
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Market_Audiences/03_MARKET/INDUSTRY.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This file defines the external operational environment. `mgsd-analyst` MUST monitor structural shifts (Section 2) and platform trends (Section 3). `mgsd-executor` MUST flag any `Seasonality` (Section 4) shifts that require budget reallocation in `MCB-BUDGET.md`.

**Dependencies:** MCB-BUDGET (`../../Core_Strategy/01_STRATEGY/MCB-BUDGET.md`), CORE-STRATEGY (`../../Core_Strategy/01_STRATEGY/CORE-STRATEGY.md`)
**Assigned Agent:** `mgsd-analyst`
**Linear Project Manager:** `mgsd-linear-manager`

---

## 1. Market Definition

**The market this business operates in:**
[FILL — be specific. Not "digital marketing" — e.g. "Performance marketing services for Spanish-language e-commerce businesses in LATAM with $500K–$10M annual revenue."]

**Market size estimate:**
```yaml
total_addressable_market  : "[TAM — USD or unit estimate]"
serviceable_market        : "[SAM — the portion we can realistically reach]"
target_market             : "[SOM — the portion we're targeting now]"
data_source               : "[Source and date of estimate]"
```

---

## 2. Market Dynamics

**Growth trajectory:**
```yaml
market_growth_rate  : "[e.g. ~15% YoY | Contracting | Flat | Unknown]"
growth_drivers      : "[What is driving market growth]"
contraction_risks   : "[What could shrink this market]"
```

**Key structural shifts affecting this market:**
[FILL — technology changes, regulatory changes, economic conditions, platform changes]

---

## 3. Platform & Channel Trends

> Relevant platform dynamics that affect campaign decisions. Update when significant changes occur.

| Platform | Current Dynamic | Impact on Strategy |
|----------|----------------|-------------------|
| Meta | [FILL] | [FILL] |
| Google | [FILL] | [FILL] |
| TikTok | [FILL] | [FILL] |
| Organic Search | [FILL] | [FILL] |
| Email | [FILL] | [FILL] |

---

## 4. Industry-Specific Marketing Constraints

**Advertising regulations affecting this industry:**
[FILL — platform policies, legal restrictions, industry self-regulation]

**Seasonality:**
```yaml
peak_seasons        : "[Months or periods with highest demand]"
low_seasons         : "[Months with lowest demand]"
seasonal_events     : "[Key dates that drive campaign decisions]"
```