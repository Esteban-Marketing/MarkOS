# OFFERS.md — Active Promotions, Bundles & Limited-Time Offers

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Products/04_PRODUCTS/OFFERS.md to customize it safely.


```
file_purpose  : Track all active, scheduled, and historical offers.
                Prevents stale offers from being promoted and ensures
                agents always work with current commercial terms.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — active offers must be listed here before any promotion
```

---

## 1. Active Offers

> An offer is any variation from standard pricing: a discount, a bundle, a free trial, a bonus, or a limited-time incentive.

| Offer ID | Name | Status | Valid From | Valid Until | Products | Mechanism | Public? |
|----------|------|--------|-----------|------------|---------|-----------|---------|
| OFR-001 | [Name] | [ACTIVE / SCHEDULED / EXPIRED] | [Date] | [Date or ONGOING] | [P00X] | [% off / Free item / Bundle] | [YES / NO] |

---

## 2. Offer Details

### OFR-001: [Offer Name]

```yaml
offer_id        : "OFR-001"
status          : "[ACTIVE | SCHEDULED | EXPIRED | PAUSED]"
offer_type      : "[DISCOUNT | BUNDLE | BONUS | FREE_TRIAL | GUARANTEE | REFERRAL]"
products        : "[P001, P002]"
valid_from      : "YYYY-MM-DD"
valid_until     : "YYYY-MM-DD or ONGOING"
promo_code      : "[Code if applicable or N/A]"
```

**Offer mechanics:**
[FILL — precisely what the customer gets, under what conditions]

**Marketing-approved description of this offer:**
[FILL — exact language approved for use in ads and copy]

**Channels this offer may be promoted on:**
[FILL — e.g. "Email list only. Not in cold audience ads."]

**Exclusions and conditions:**
[FILL — what the offer doesn't include, who it doesn't apply to]

---

## 3. Expired Offers Archive

> Keep expired offers logged to prevent accidental re-promotion.

| Offer ID | Name | Expired | Why It Ended | Reusable? |
|----------|------|---------|-------------|----------|
| [ID] | [Name] | [Date] | [FILL] | [YES / NO] |

---

## 4. Offer Creation Rules

Before any new offer is created and promoted:

- [ ] Approved by {{LEAD_AGENT}}
- [ ] Added to this file with all fields complete
- [ ] `STATE.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] Pricing in `PRICING.md` still accurate
- [ ] End date defined (or ONGOING explicitly stated)
