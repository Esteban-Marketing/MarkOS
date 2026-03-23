# PRICING.md — Pricing Structure & Logic

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Products/04_PRODUCTS/PRICING.md to customize it safely.


```
file_purpose  : Define all pricing, tiers, and billing logic.
                Governs what can be stated in marketing and what requires
                a sales conversation.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — no pricing information in ads or copy may contradict this file
```

---

## 1. Pricing Philosophy

**How pricing decisions are made:**
[FILL — e.g. "Value-based. Priced relative to the outcome we deliver, not hours worked."]

**What pricing signals about the brand:**
[FILL — e.g. "We are not the cheapest option. Our price signals quality and commitment from the client."]

**Pricing publicly disclosed?**
```yaml
pricing_public    : "[YES — on website | PARTIAL — starting price only | NO — by application]"
pricing_url       : "[URL or N/A]"
```

---

## 2. Price List

| Product ID | Product Name | Price | Billing | Notes |
|------------|-------------|-------|---------|-------|
| P001 | [Name] | [Amount + currency] | [ONE_TIME / MONTHLY / ANNUAL / CUSTOM] | [e.g. Requires deposit] |
| P002 | [Name] | [Amount] | [FILL] | [FILL] |

---

## 3. Pricing Tiers (if applicable)

### [Product/Service Name] — Tiers

| Tier | Price | What's Included | Who It's For |
|------|-------|----------------|-------------|
| [Tier 1 name] | [Price] | [Inclusions] | [ICP] |
| [Tier 2 name] | [Price] | [Inclusions] | [ICP] |
| [Tier 3 name] | [Price] | [Inclusions] | [ICP] |

---

## 4. Billing & Payment Terms

```yaml
payment_methods       : "[e.g. Bank transfer, Stripe, PayPal, Nequi, Daviplata]"
deposit_required      : "[YES — X% upfront | NO]"
payment_schedule      : "[e.g. 50% on contract, 50% on delivery | Monthly subscription]"
late_payment_policy   : "[FILL]"
refund_policy         : "[FILL — or reference LEGAL.md]"
currency_primary      : "[USD | COP | EUR]"
currency_secondary    : "[FILL or N/A]"
fx_handling           : "[e.g. Invoiced in USD. Client pays in local currency at rate on invoice date.]"
```

---

## 5. Discount & Negotiation Rules

```yaml
discounts_allowed     : "[YES | NO | CASE_BY_CASE]"
max_discount_pct      : "[e.g. 15% — must be approved by {{LEAD_AGENT}}]"
discount_conditions   : "[e.g. Annual payment, referral, non-profit, pilot project]"
price_negotiation     : "[ESTEBAN_ONLY — not discussed in marketing or by agents]"
```

---

## 6. What Can Be Stated in Marketing

**Claims approved for ads and copy:**
- [FILL — e.g. "Starting at $X/month"]
- [FILL — e.g. "Fixed-fee projects. No surprise invoices."]

**Pricing claims PROHIBITED in marketing:**
- [FILL — e.g. "Never publish exact retainer pricing without approval."]
- [FILL — e.g. "Never compare our price directly to a named competitor."]
