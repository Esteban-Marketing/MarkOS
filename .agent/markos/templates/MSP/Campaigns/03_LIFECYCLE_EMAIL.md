# 🔄 {{COMPANY_NAME}} - Lifecycle & Retention Loop

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Campaigns/03_LIFECYCLE_EMAIL.md to customize it safely.


**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`)
**Assigned Agent:** `{{LEAD_AGENT}}` (markos-strategist, markos-content-creator)
**Linear Project Manager:** `markos-linear-manager`

## Retention Mathematics Matrix
- **Maximum Acceptable Churn:** `{{CHURN_RATE_CEILING}}`
- **Welcome Series Duration:** `{{WELCOME_SERIES_DAYS}}`
- **Average Order Value (AOV) Target:** `{{AOV_GOAL}}`

## 1. Initialization: Platform & Hooks
- [ ] Provision DMARC, DKIM, and SPF protocols for maximum deliverability and domain reputation protection.
- [ ] Audit and scrub active list sizes; segregate highly engaged vs. dormant audiences.
- [ ] Connect tracking APIs between the CRM/ESP (Klaviyo, Hubspot, Customer.io) and `{{COMPANY_URL}}` checkout/conversion logic.

## 2. The Conversion Flows (Automations)
- [ ] **Flow 1: Welcome Series (Lead Nurture).** Trigger: Email Submission. 4 Emails Over 7 Days. Narrative: Brand Origin -> Value Prop -> Social Proof -> Hard Offer. (Inject **Reciprocity** bias in Email 1 by giving a high-value asset immediately).
- [ ] **Flow 2: Abandoned Cart/Checkout.** Trigger: Checkout Started, Not Completed. 3 Emails over 48 hours. Logic: Dynamic product injection, escalating discount ladders. (Inject **Loss Aversion/Scarcity** in Email 2 & 3).
- [ ] **Flow 3: Post-Purchase / Upsell.** Trigger: Purchase Complete. Cross-sell complementary assets explicitly targeting `{{AOV_GOAL}}`. (Inject **Consistency Bias** — "You're the type of person who values X, so you need Y").

## 3. The Churn Mitigation Flows
- [ ] **Flow 4: Sunset Unengaged.** Trigger: No opens/clicks in 90 days. Aggressive subject line validation -> remove from list if ignored (protects deliverability).
- [ ] **Flow 5: Win-back / Reactivation.** Trigger: VIP customer active > 60 days ago. Enticement: Heavy personalized discount.

## 4. Algorithmic QA & Optimization Loops
- [ ] Throttle newsletter frequency dynamically based on user engagement metrics natively to avoid fatigue.
- [ ] A/B test Subject Lines on a 20% sample list auto-deploying the winner to the remaining 80%.
- [ ] Monitor un-subscribe rates vs. expected `{{CHURN_RATE_CEILING}}`. Iteratively adjust copy tone if breached.

## 5. Neuromarketing & Loyalty Extension
- [ ] Implement gamification or 'Variable Reward' mechanics for highly-engaged users (VIPs) to drive dopamine loops.
- [ ] Design an 'Us vs. Them' paradigm in the weekly newsletter to tribalize the audience and harden brand loyalty.
