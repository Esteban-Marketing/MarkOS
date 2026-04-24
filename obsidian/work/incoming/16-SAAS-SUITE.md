# MarkOS SaaS Suite
## Tenant-Type Addon · Subscriptions · Churn · Support · Billing · Multi-Country Compliance

---

## What the SaaS Suite Is

The SaaS Suite is a **tenant-type conditional addon** that activates automatically when
a tenant's `business_type` is set to `saas`. It extends the MarkOS platform with an
operational layer purpose-built for SaaS businesses — the systems that run *after* a
customer is acquired, not just before.

MarkOS's core platform is excellent at acquisition: content, SEO, paid media, social,
outbound. The SaaS Suite is excellent at everything that comes after signup: subscription
lifecycle, billing, usage tracking, churn prediction, customer support, and the compliance
infrastructure to bill legally in every market you operate in.

The two halves combine into something neither could be alone: a marketing intelligence
system that knows which customers are about to churn *before* the churn signal appears
in revenue data, and a billing and support infrastructure that gives those customers
reasons to stay.

### What activates with the SaaS Suite

When `business_type = saas` and the suite is enabled:

```
MODULES ACTIVATED:

  Already in MarkOS (tuned for SaaS):
  ├─ Pricing Engine — SaaS module (doc 15, Part 4)
  ├─ Demo Engine (doc 07, Module 2)
  ├─ B2B Lead Generation Engine (doc 07, Module 3)
  ├─ Calendar & Meeting Intelligence (doc 07, Module 1)
  ├─ CRM with deal pipeline (core MarkOS)
  └─ Lead Nurture Architect + Scorer (LG-05, AUD-03)

  New with SaaS Suite:
  ├─ Subscription Management Engine        ← new
  ├─ Billing Engine (multi-country)        ← new
  ├─ Churn Intelligence Module             ← new
  ├─ Customer Support Module               ← new
  ├─ Product Usage & Health Module         ← new
  ├─ Revenue Intelligence Dashboard        ← new (SaaS-specific)
  └─ Compliance & Legal Billing Layer      ← new (US + CO at launch)
```

### Tenant activation flow

```typescript
interface SaaSsuiteActivation {
  tenant_id: string
  activated_at: string
  activated_by: string            // user_id of operator who enabled it

  // Configuration collected at activation wizard
  saas_profile: {
    product_name: string
    billing_model: SaaSBillingModel
    primary_currency: string      // ISO 4217 — 'USD' | 'COP' | etc.
    billing_countries: string[]   // ISO 3166-1 alpha-2 — ['US', 'CO', ...]
    billing_frequency: string[]   // ['monthly', 'annual', 'quarterly']
    free_trial_days: number | null
    freemium: boolean
  }

  // Payment processors configured
  processors: ProcessorConfig[]   // Stripe, Mercado Pago, or both

  // Accounting integrations configured
  accounting: AccountingConfig[]  // QuickBooks, Siigo, Alegra

  // Legal billing activated per country
  legal_billing: LegalBillingConfig[]

  // Modules selectively enabled (all enabled by default)
  modules_enabled: SaaSModule[]
}

type SaaSBillingModel =
  | 'flat_rate'
  | 'per_seat'
  | 'usage_based'
  | 'per_active_user'
  | 'hybrid_base_plus_usage'
  | 'credit_based'
  | 'freemium_to_paid'

type SaaSModule =
  | 'subscription_management'
  | 'billing_engine'
  | 'churn_intelligence'
  | 'customer_support'
  | 'product_usage'
  | 'revenue_intelligence'
  | 'compliance_billing'
```

---

## Part 1: Subscription Management Engine

### The subscription lifecycle

A SaaS subscription is not a one-time transaction. It is a living relationship that
evolves through distinct stages, each requiring different actions from the system.

```
SUBSCRIPTION LIFECYCLE

  Trial
    ↓ (converts)
  Active
    ├─ Upgrades (tier up, seat expansion, add-ons)
    ├─ Downgrades (tier down, seat reduction)
    ├─ Pause (billing paused, access maintained or reduced)
    ├─ Past Due (payment failed — recovery workflow)
    └─ Cancellation requested
              ↓
           Canceled (access revoked)
              ↓ (within window)
           Reactivated

Each stage transition is an event. Each event triggers workflows.
```

### Subscription schema

```typescript
interface Subscription {
  subscription_id: string
  tenant_id: string                   // the MarkOS tenant (the SaaS company)
  customer_id: string                 // their customer in MarkOS CRM

  // Plan and billing
  plan_id: string
  plan_name: string
  billing_model: SaaSBillingModel
  billing_frequency: 'monthly' | 'annual' | 'quarterly'
  price_per_cycle: number
  currency: string                    // ISO 4217
  seats_contracted: number | null     // null for non-seat-based plans
  usage_limit: UsageLimit | null

  // Status
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  cancellation_reason: CancellationReason | null

  // Payment
  processor: 'stripe' | 'mercado_pago'
  processor_subscription_id: string  // Stripe sub ID or MP preapproval ID
  payment_method_id: string
  payment_country: string            // ISO 3166-1 alpha-2

  // Health signals (from Product Usage + Churn modules)
  health_score: number               // 0–100
  churn_risk: 'low' | 'medium' | 'high' | 'critical'
  last_activity_at: string | null
  nps_score: number | null

  // Billing compliance
  tax_id: string | null              // NIT (CO), EIN/SSN (US), etc.
  legal_entity_name: string | null
  billing_country: string
  requires_electronic_invoice: boolean
  last_invoice_id: string | null

  created_at: string
  updated_at: string
}

type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancel_pending'     // cancel_at_period_end = true
  | 'canceled'
  | 'incomplete'         // initial payment failed
  | 'unpaid'             // past_due grace period exceeded

type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'switched_competitor'
  | 'not_using_enough'
  | 'technical_issues'
  | 'business_closure'
  | 'involuntary'        // payment failure
  | 'other'
```

### Plan and tier management

```typescript
interface SaaSPlan {
  plan_id: string
  tenant_id: string
  name: string                        // "Starter", "Professional", "Enterprise"
  position: number                    // 1 = entry, higher = premium
  status: 'active' | 'legacy' | 'deprecated'

  // Pricing (multi-currency)
  pricing: PlanPricing[]

  // Value metric
  billing_model: SaaSBillingModel
  value_metric: ValueMetric | null
  usage_limits: UsageLimit[]

  // Features
  features: PlanFeature[]
  is_public: boolean                  // visible on pricing page
  is_enterprise: boolean              // custom pricing, contact sales

  // Trial configuration
  trial_days: number | null
  trial_requires_card: boolean

  // Lifecycle
  grandfathered_count: number         // subscriptions on this plan if deprecated
  created_at: string
}

interface PlanPricing {
  currency: string                    // USD, COP, EUR, etc.
  price_monthly: number | null
  price_annual: number | null         // full annual amount (not monthly equivalent)
  price_quarterly: number | null
  annual_discount_pct: number | null
  setup_fee: number | null
  overage_unit_price: number | null   // for usage-based overages
}
```

### Subscription lifecycle workflows

**Workflow: Trial to paid conversion**

```
TRIGGER: Trial subscription enters final 72 hours before expiry

Day -3 (T-72h): Trial ending soon
  → Email: "Your trial ends in 3 days"
    Content: personalized based on features used during trial
    CTA: primary = upgrade now, secondary = book extension call
  → In-app banner activated for trial user

Day -1 (T-24h): Last day
  → Email: "Last day of your trial"
    Content: summarize value delivered during trial (usage data)
    CTA: single — upgrade now
  → SAS-04 (Churn Risk Assessor) evaluates conversion probability:
    → High probability: standard sequence continues
    → Low probability: triggers retention offer sequence

Day 0 (T-0): Trial expires
  → If payment method on file AND auto-convert enabled:
      Subscription converts, confirmation email sent
  → If no payment method:
      Access suspended (configurable: full lock vs read-only vs degraded)
      Email: "Your trial has ended — add payment to continue"
      CRM: lead status updated to "Trial Expired — No Conversion"
      Nurture sequence: "Trial expired" sequence activated (7-day window)

Day +3 (post-expiry, if not converted):
  → ANA-01 (Performance Analyst) surfaces in weekly digest:
    "3 trial accounts expired this week without converting. Top reason from exit survey: [reason]"
  → LG-05 (Lead Nurture Architect) activates trial win-back sequence
```

**Workflow: Payment failure (involuntary churn prevention)**

```
TRIGGER: Payment processor webhook → payment_failed event

Attempt 1 (Day 0): First failure
  → Subscription status → 'past_due'
  → Email to customer: "Payment failed — please update your card"
    Tone: helpful, not alarming. "We couldn't process your payment"
  → In-app notification for the customer
  → Grace period begins (configurable: 3–14 days, default: 7)

Attempt 2 (Day 3): Smart retry
  → Payment processor smart retry (Stripe Intelligent Retries or MP retry)
  → If success: subscription restored, confirmation email
  → If failure: continue

Day 5: Escalation email
  → Email: "Action required — your account will be suspended soon"
  → Include: direct link to update payment method
  → CRM flag: "At risk — payment failure"
  → Assign to CS queue if account ARR > threshold

Day 7: Final notice
  → Email: "Last chance — account suspending in 24 hours"
  → Attempt 3: final retry
  → If success: restored
  → If failure:

Day 8: Suspension
  → Subscription status → 'unpaid'
  → Access suspended (customer cannot use product)
  → Email: "Account suspended — update payment to restore access"
  → Data retention: all data preserved for 30 days post-suspension

Day 38 (30 days post-suspension): Data deletion warning
  → Email: "Your data will be deleted in 7 days"
  → CRM: contact moved to "Churned — Involuntary"

Day 45: Data deletion (if still unpaid)
  → Per offboarding protocol
  → Churn event recorded with reason: 'involuntary'
```

**Workflow: Voluntary cancellation with save attempt**

```
TRIGGER: Customer initiates cancellation

Step 1: Cancellation intent capture
  → Customer clicks "Cancel subscription"
  → Before confirming: show cancellation survey
    "We're sorry to see you go. What's the main reason?"
    Options: too expensive | missing features | switching competitor |
             not using enough | technical issues | business closure | other

Step 2: Reason-specific save offer

  if reason == 'too_expensive':
    → Offer: 30% discount for 3 months, OR downgrade to lower tier
    → Show: value they've gotten (usage data, ROI if calculable)

  if reason == 'missing_features':
    → Show: roadmap items relevant to their stated gap
    → Offer: free extension (30 days) until feature ships if within 60-day roadmap
    → Route to: product feedback form + Slack community

  if reason == 'switching_competitor':
    → Ask: "Which tool are you switching to?"
    → Show: comparison card (live from Pricing Engine competitor matrix)
    → Offer: extended trial + migration support session

  if reason == 'not_using_enough':
    → Offer: pause subscription (billing paused, access retained)
    → Show: "Here's what you haven't tried yet" — feature adoption gap
    → Offer: 30-min onboarding call

  if reason == 'technical_issues':
    → Route: immediately to Priority support queue
    → Offer: 14-day extension while issue is resolved
    → Do NOT show discount — fix the problem

Step 3: If save attempt declined
  → Confirm cancellation: set cancel_at_period_end = true
  → Access maintained until period end
  → Email: "Your subscription will end on [date]"
  → SAS-04 records outcome: cancellation_reason + whether save offer was shown + whether accepted

Step 4: Post-cancellation win-back
  → Day 14 post-cancellation: "We improved X since you left" (if relevant)
  → Day 45: "Here's what you're missing" (case study from similar company)
  → Day 90: Final win-back attempt with relevant offer
  → After 90 days: CRM status = "Churned — Closed"
```

---

## Part 2: Billing Engine

### Architecture overview

The Billing Engine is the financial backbone of the SaaS Suite. It handles:
- Invoice generation and delivery
- Payment collection via multiple processors
- Multi-currency handling
- Tax calculation (US) and withholding tax (Colombia)
- Legal compliance per billing country
- Accounting integration (QuickBooks, Siigo, Alegra)

The engine routes every transaction through a processor selection layer before
dispatching to Stripe or Mercado Pago, and routes every invoice through a compliance
layer before delivery.

```
BILLING FLOW

  Subscription billing event (period end, upgrade, one-time)
        ↓
  Invoice Generator
    → create invoice draft with line items
    → apply discounts, coupons, credits
    → calculate applicable tax (US: sales tax | CO: IVA + retención)
        ↓
  Legal Compliance Layer
    → route by billing_country:
        US → US Invoice Format + QuickBooks sync
        CO → DIAN Facturación Electrónica + Siigo/Alegra sync
        Other → standard invoice
        ↓
  Payment Processor Router
    → route by customer.payment_country + processor_preference:
        US/Global → Stripe
        CO + LATAM → Mercado Pago (Checkout Bricks)
        ↓
  Payment Collection
    → charge payment method
    → handle success / failure
        ↓
  Accounting Integration
    → sync invoice + payment to accounting system
    → US: QuickBooks Online API
    → CO: Siigo API / Alegra API
```

### Invoice schema

```typescript
interface Invoice {
  invoice_id: string
  tenant_id: string
  customer_id: string
  subscription_id: string | null

  // Identity
  invoice_number: string              // human-readable: INV-2026-00847
  invoice_type: InvoiceType
  status: InvoiceStatus

  // Amounts
  currency: string
  subtotal: number                    // before tax
  discount_amount: number
  tax_lines: TaxLine[]
  tax_total: number
  total: number
  amount_paid: number
  amount_due: number

  // Legal (per country)
  billing_country: string
  legal_invoice_number: string | null // DIAN CUFE (CO) | IRS-compliant number (US)
  tax_id_customer: string | null
  tax_id_vendor: string | null
  legal_status: LegalInvoiceStatus | null
  electronic_invoice_xml: string | null  // DIAN XML (CO)
  electronic_invoice_pdf_url: string | null

  // Line items
  line_items: InvoiceLineItem[]

  // Payment
  processor: 'stripe' | 'mercado_pago'
  processor_invoice_id: string | null
  processor_payment_intent_id: string | null
  payment_method_type: string | null   // card, bank_transfer, pse, efecty, etc.
  paid_at: string | null

  // Accounting sync
  quickbooks_invoice_id: string | null
  siigo_invoice_id: string | null
  alegra_invoice_id: string | null
  accounting_synced_at: string | null

  // Delivery
  sent_to_email: string
  sent_at: string | null
  viewed_at: string | null

  due_at: string
  issued_at: string
  created_at: string
}

type InvoiceType = 'subscription' | 'one_time' | 'credit_note' | 'void' | 'prorated'
type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' | 'past_due'
type LegalInvoiceStatus = 'pending' | 'transmitted' | 'accepted' | 'rejected' | 'void'
```

---

## Part 3: Payment Processors

### Processor 1: Stripe

Stripe is the primary processor for US-based billing and global card acceptance.
It is the default processor for any customer where `payment_country` is not in
Mercado Pago's supported region or where the tenant has not configured MP.

**Stripe integration scope:**

```
Stripe Products used:
  Stripe Billing         → subscription lifecycle management
  Stripe Invoicing       → invoice generation and delivery
  Stripe Radar           → fraud detection
  Stripe Tax             → US sales tax calculation and filing (optional)
  Stripe Connect         → if tenant uses MarkOS as their billing layer for their own customers
  Stripe Customer Portal → self-service payment management for end customers

Authentication: Stripe API keys (publishable + secret) stored in encrypted vault
Webhooks: all billing events subscribed via signed webhook endpoint

Key webhook events handled:
  customer.subscription.created          → create subscription record
  customer.subscription.updated          → sync status changes
  customer.subscription.deleted          → trigger churn workflow
  invoice.payment_succeeded              → update invoice, sync to accounting
  invoice.payment_failed                 → trigger dunning workflow
  customer.updated                       → sync customer data
  payment_method.attached                → update payment method
  payment_method.detached                → flag if subscription has no valid PM
  charge.dispute.created                 → P1 alert to operator + freeze account
```

**Stripe Checkout Bricks equivalent:**
Stripe's prebuilt UI is Stripe Elements / Stripe Checkout. For MarkOS SaaS Suite
tenants serving their own customers, the checkout embed uses Stripe Elements with
the tenant's brand styling applied.

```typescript
// Stripe checkout session creation for a SaaS tenant's customer
interface StripeCheckoutConfig {
  mode: 'subscription' | 'payment' | 'setup'
  customer_id: string             // Stripe customer ID
  price_id: string                // Stripe Price ID for selected plan
  success_url: string
  cancel_url: string
  allow_promotion_codes: boolean
  automatic_tax_enabled: boolean  // uses Stripe Tax for automatic US sales tax
  billing_address_collection: 'auto' | 'required'
  payment_method_types: string[]  // ['card'] for US; ['card', 'bank_transfer'] for broader
  subscription_data: {
    trial_period_days?: number
    metadata: Record<string, string>
  }
  ui_mode: 'hosted' | 'embedded'  // 'embedded' = Stripe Elements in MarkOS UI
}
```

**Stripe + QuickBooks sync (US):**

```
Every Stripe invoice event → QuickBooks Online sync:

1. Invoice paid:
   → Create QBO Invoice (matching line items, amounts, customer)
   → Create QBO Payment and link to invoice
   → Apply to correct QBO Account (Revenue account per plan/product)

2. Invoice refund/credit note:
   → Create QBO Credit Memo
   → Apply to original invoice

3. New customer:
   → Create QBO Customer record (matching Stripe customer data)
   → Sync tax ID if present

4. Monthly reconciliation:
   → Stripe balance report vs QBO receivables
   → Flag mismatches as reconciliation tasks
   → Generate P&L contribution from subscription revenue

QuickBooks API: QuickBooks Online Accounting API v3
Auth: OAuth 2.0 (tenant connects their QBO company)
Sync frequency: real-time via Stripe webhook → QBO API call (< 30s latency)
```

---

### Processor 2: Mercado Pago

Mercado Pago is the primary processor for Colombia and the Spanish-speaking LATAM
market. It offers Checkout Bricks — a composable, embeddable UI component system —
and supports local payment methods critical for LATAM adoption.

**Why Mercado Pago for Colombia:**
- Supports PSE (Pagos Seguros en Línea) — Colombia's primary bank transfer system
- Supports Efecty — Colombia's leading cash payment network (unbanked customers)
- Supports local card brands alongside Visa/Mastercard
- Handles COP (Colombian Peso) natively without conversion
- Preapproval (recurring billing) available for subscriptions
- Checkout Bricks: composable React components, white-labeled

**Mercado Pago integration scope:**

```
Mercado Pago Products used:
  Checkout Bricks (UI)        → payment UI components embedded in MarkOS SaaS Suite
  Preapproval API             → subscription/recurring billing
  Payment API                 → one-time payments and invoices
  Subscriptions API           → plan management and lifecycle

Authentication: Access Token (test + production) in encrypted vault
Webhooks: IPN (Instant Payment Notifications) + Webhooks API v2

Key events handled:
  preapproval.authorized       → subscription activated
  preapproval.paused           → subscription paused by customer
  preapproval.cancelled        → subscription canceled
  payment.created              → new payment attempt
  payment.approved             → invoice paid, sync to accounting
  payment.failed               → trigger dunning workflow (same as Stripe path)
  payment.refunded             → create credit note
```

**Checkout Bricks implementation:**

Mercado Pago Checkout Bricks are the preferred UI for Colombian customers. They render
locally-relevant payment methods and comply with Colombian UX expectations.

```typescript
// Mercado Pago Checkout Bricks configuration for SaaS subscription
interface MPCheckoutBricksConfig {
  initialization: {
    amount: number                  // total amount in COP
    preferenceId: string | null     // for preference-based flow
  }
  customization: {
    paymentMethods: {
      creditCard: 'all' | 'disabled'
      debitCard: 'all' | 'disabled'
      bankTransfer: 'all' | 'disabled'  // PSE
      atm: 'all' | 'disabled'           // Efecty, Baloto, etc.
      ticket: 'all' | 'disabled'
    }
    visual: {
      style: {
        theme: 'default' | 'dark'
        customVariables: {
          textPrimaryColor: string        // tenant brand color
          formBackgroundColor: string
          baseColor: string
        }
      }
      hideFormTitle: boolean
    }
  }
  callbacks: {
    onReady: () => void
    onSubmit: (formData: MPFormData) => Promise<void>
    onError: (error: MPBricksError) => void
  }
}

// Preapproval (recurring) setup for subscriptions
interface MPPreapprovalConfig {
  reason: string                    // plan name shown to customer
  auto_recurring: {
    frequency: number               // 1
    frequency_type: 'months'        // 'months' | 'days'
    transaction_amount: number      // monthly amount in COP
    currency_id: 'COP'
    start_date: string              // ISO8601
    end_date: string | null         // null = indefinite
  }
  back_url: string                  // return URL after MP auth
  payer_email: string
  external_reference: string        // our subscription_id for correlation
}
```

**Mercado Pago + Siigo/Alegra sync (Colombia):**

```
Every MP payment event → DIAN electronic invoice → Siigo/Alegra sync:

1. Payment approved:
   → Generate DIAN-compliant electronic invoice XML (see Part 6)
   → Transmit to DIAN via software habilitado
   → Get CUFE (Código Único de Factura Electrónica) back
   → Store CUFE on invoice record
   → Sync invoice to Siigo OR Alegra (tenant's choice):
       Create vendor invoice in accounting system
       Apply payment record
       Map to correct account (ingresos operacionales por servicios)

2. Refund / nota crédito:
   → Generate DIAN nota crédito XML
   → Transmit to DIAN
   → Create credit note in Siigo/Alegra

3. Monthly close:
   → Siigo/Alegra reconciliation report
   → IVA declaración report (ready for monthly tax filing)
   → Retención en la fuente summary (if applicable)
```

### Processor routing logic

```typescript
function routeToProcessor(
  customerCountry: string,
  tenantProcessors: ProcessorConfig[],
  amount: number,
  currency: string
): ProcessorRoute {
  const hasStripe = tenantProcessors.some(p => p.type === 'stripe')
  const hasMP = tenantProcessors.some(p => p.type === 'mercado_pago')

  // Colombia: Mercado Pago preferred (local methods, COP support)
  if (customerCountry === 'CO' && hasMP) {
    return { processor: 'mercado_pago', reason: 'local_preferred' }
  }

  // LATAM countries supported by MP (if tenant has MP):
  const mpCountries = ['AR','BR','CL','CO','MX','PE','UY','BO','PY','EC']
  if (mpCountries.includes(customerCountry) && hasMP) {
    return { processor: 'mercado_pago', reason: 'latam_coverage' }
  }

  // US and all other countries: Stripe
  if (hasStripe) {
    return { processor: 'stripe', reason: 'global_default' }
  }

  // Fallback: whichever is configured
  return { processor: tenantProcessors[0].type, reason: 'only_available' }
}
```

---

## Part 4: Multi-Country Billing Compliance

### Launch countries: United States + Colombia

The SaaS Suite ships with full compliance support for two countries at Milestone 1.
All other countries receive standard invoicing without local compliance features
until added in subsequent milestones.

---

### US Billing Compliance

**Invoice requirements (US)**

US invoicing has no single federal standard, but best practice for SaaS invoices:

```
REQUIRED ON EVERY US INVOICE:
  ✓ Seller legal name and address
  ✓ Seller EIN (if incorporated) or SSN (if sole prop) — on file, not always shown
  ✓ Invoice number (unique, sequential)
  ✓ Invoice date
  ✓ Due date
  ✓ Customer name and billing address
  ✓ Description of service (specific — "MarkOS Professional subscription, June 2026")
  ✓ Subscription period (from/to dates)
  ✓ Unit price and quantity
  ✓ Subtotal, tax lines (if applicable), total
  ✓ Payment terms ("Due on receipt" or "Net 30")
  ✓ Accepted payment methods

REQUIRED FOR TAX COMPLIANCE:
  ✓ State sales tax where applicable (SaaS is taxable in ~28 US states)
  ✓ Customer billing address (determines tax jurisdiction)
  ✓ Tax rate applied and amount
  ✓ If tax-exempt: customer exemption certificate on file
```

**US Sales Tax on SaaS:**

SaaS is subject to sales tax in states where it is classified as a taxable service.
As of 2026, approximately 28 states tax SaaS. The rules vary by state and are complex.

MarkOS SaaS Suite handles this via Stripe Tax (preferred) or TaxJar/Avalara integration:

```typescript
interface USTaxConfig {
  provider: 'stripe_tax' | 'taxjar' | 'avalara' | 'manual'
  nexus_states: string[]            // states where tenant has tax nexus (physical or economic)
  // Economic nexus: ~$100K revenue OR 200 transactions in a state → nexus
  
  stripe_tax_config?: {
    automatic_tax: boolean          // true = Stripe calculates per transaction
    tax_id_collection: boolean      // ask B2B customers for tax ID (exemption)
  }
  
  taxjar_config?: {
    api_key: string
    product_tax_code: '19021' | string  // 19021 = SaaS software (most common)
  }
}

// US tax determination per transaction
interface USTaxLine {
  jurisdiction: string              // "California State"
  tax_type: string                  // "Sales Tax"
  rate: number                      // e.g. 0.0725 (7.25%)
  amount: number                    // calculated amount
  is_exempt: boolean
  exemption_reason: string | null   // "Resale", "Government", "Non-profit"
}
```

**QuickBooks Online integration (US):**

```typescript
interface QBOConfig {
  company_id: string                // QBO Realm ID
  access_token: string              // OAuth 2.0 token (encrypted)
  refresh_token: string
  environment: 'sandbox' | 'production'

  // Account mapping (tenant maps their QBO chart of accounts)
  account_mapping: {
    saas_revenue_account: string    // e.g. "4000 · SaaS Revenue"
    ar_account: string              // Accounts Receivable
    deferred_revenue_account: string // for annual plans
    tax_payable_account: string     // Sales Tax Payable
    bank_account: string            // where Stripe deposits
  }

  // Sync settings
  auto_sync: boolean
  sync_customers: boolean
  sync_invoices: boolean
  sync_payments: boolean
  create_products: boolean         // create QBO product per plan
}

// QBO invoice creation payload
interface QBOInvoicePayload {
  CustomerRef: { value: string }   // QBO customer ID
  Line: QBOLineItem[]
  TxnDate: string                  // YYYY-MM-DD
  DueDate: string
  DocNumber: string                // our invoice_number
  TxnTaxDetail?: QBOTaxDetail
  CustomerMemo?: { value: string } // subscription period description
  GlobalTaxCalculation: 'TaxExcluded' | 'TaxInclusive' | 'NotApplicable'
}
```

---

### Colombia Billing Compliance

Colombia has one of the most sophisticated electronic invoicing requirements in Latin America.
The DIAN (Dirección de Impuestos y Aduanas Nacionales) mandates electronic invoicing
(`Facturación Electrónica`) for all businesses above a revenue threshold, with full
XML-based transmission to the DIAN system in real time.

**Colombia legal entity requirements:**

```
REQUIRED FOR LEGAL BILLING IN COLOMBIA:

Vendor (the SaaS company — MarkOS tenant):
  ✓ NIT (Número de Identificación Tributaria) — the company's tax ID
  ✓ RUT (Registro Único Tributario) — taxpayer registration document
  ✓ Régimen tributario: Responsable de IVA (most SaaS companies)
  ✓ DIAN habilitación: authorization to issue electronic invoices
  ✓ Software habilitado or authorized provider (to transmit to DIAN)
  ✓ Numeración de facturación: authorized invoice number range (from DIAN)

Customer:
  ✓ NIT (if empresa) or CC/CE (if persona natural)
  ✓ Tax regime classification
  ✓ Billing address in Colombia format (ciudad, departamento)
```

**DIAN Facturación Electrónica architecture:**

```
DIAN ELECTRONIC INVOICE FLOW (Resolución 000042 de 2020)

Step 1: Invoice generation
  MarkOS SaaS Suite generates invoice data
  (same invoice schema as all invoices, plus Colombian fields)

Step 2: XML generation
  Generate DIAN-compliant UBL 2.1 XML:
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
      <UBLVersionID>UBL 2.1</UBLVersionID>
      <CustomizationID>10</CustomizationID>   // 10 = venta de bienes/servicios
      <ProfileID>DIAN 2.1</ProfileID>
      <ID>{invoice_number}</ID>
      <IssueDate>{YYYY-MM-DD}</IssueDate>
      <IssueTime>{HH:MM:SS-05:00}</IssueTime> // Colombia UTC-5
      <InvoiceTypeCode listAgencyID="195" listSchemeURI="...">01</InvoiceTypeCode>
      // 01 = factura de venta
      <Note>{notes}</Note>
      <DocumentCurrencyCode>COP</DocumentCurrencyCode>

      <AccountingSupplierParty>        // Vendor (SaaS company)
        <Party>
          <PartyTaxScheme>
            <CompanyID schemeID="31">  // 31 = NIT
              {nit_sin_dv}
            </CompanyID>
            <TaxLevelCode listName="48">O-13</TaxLevelCode> // Régimen
          </PartyTaxScheme>
        </Party>
      </AccountingSupplierParty>

      <AccountingCustomerParty>        // Customer
        <Party>
          <PartyTaxScheme>
            <CompanyID schemeID="{13|31|22}">  // 13=CC, 31=NIT, 22=CE
              {customer_tax_id}
            </CompanyID>
          </PartyTaxScheme>
        </Party>
      </AccountingCustomerParty>

      <TaxTotal>
        <TaxAmount currencyID="COP">{iva_amount}</TaxAmount>
        <TaxSubtotal>
          <TaxableAmount>{subtotal}</TaxableAmount>
          <TaxAmount>{iva_amount}</TaxAmount>
          <TaxCategory>
            <Percent>19</Percent>       // IVA 19% standard
            <TaxScheme><ID>01</ID></TaxScheme>  // 01 = IVA
          </TaxCategory>
        </TaxSubtotal>
      </TaxTotal>

      <LegalMonetaryTotal>
        <LineExtensionAmount currencyID="COP">{subtotal}</LineExtensionAmount>
        <TaxExclusiveAmount currencyID="COP">{subtotal}</TaxExclusiveAmount>
        <TaxInclusiveAmount currencyID="COP">{total}</TaxInclusiveAmount>
        <PayableAmount currencyID="COP">{total}</PayableAmount>
      </LegalMonetaryTotal>

      <InvoiceLine> ... </InvoiceLine>
    </Invoice>

Step 3: Digital signature
  XML signed with tenant's DIAN-issued digital certificate (PKI)
  Certificate stored encrypted in MarkOS vault
  Signature: XML Digital Signature (XAdES-B)

Step 4: CUFE generation
  CUFE = SHA-384 hash of:
    NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 +
    ValImp2 + CodImp3 + ValImp3 + ValTot + NitOFE + NumAdq + ClTec
  ClTec = technical key assigned by DIAN during habilitación

Step 5: DIAN transmission
  POST to DIAN Webservice:
    https://vpfe.dian.gov.co/WcfDianCustomerServices.svc  (production)
    https://vpfe-hab.dian.gov.co/...                       (habilitación)
  Method: SendBillAsync or SendBillSync

Step 6: DIAN response processing
  Accept (StatusCode = 00): invoice is legally valid
    → Store CUFE on invoice record
    → Generate PDF with QR code (must contain CUFE)
    → Deliver to customer

  Reject (StatusCode ≠ 00): invoice has errors
    → Log rejection reason
    → Create P1 task for operator
    → Do NOT deliver invoice to customer until corrected

Step 7: Customer delivery
  Email invoice as PDF + XML attachment
  PDF must include: CUFE in QR code, DIAN acceptance stamp, all required fields
```

**Colombian tax calculations:**

```typescript
interface ColombianTaxCalculation {
  subtotal_cop: number              // base amount in COP
  
  iva: {
    rate: number                    // 0.19 (standard SaaS)
    amount: number                  // subtotal × 0.19
    // SaaS is subject to IVA 19% in Colombia
    // Tarifa: 19% (Resolución DIAN)
  }
  
  retefuente: ReteFuente | null     // only if customer is empresa (not natural person)
  // Retención en la fuente: 11% on services (decreasing from gross)
  // Only applied by empresas obligadas a retener
  // The CUSTOMER withholds, not the vendor — but vendor must track
  
  reteiva: ReteIVA | null           // 15% of IVA if applicable
  // Applied by grandes contribuyentes purchasing services
  
  reteica: ReteICA | null           // municipal industry & commerce tax
  // Rate varies by city: Bogotá 9.66‰, Medellín 5.0‰, etc.
  
  total_cop: number                 // subtotal + IVA - (retefuente + reteiva + reteica)
}

interface ReteFuente {
  rate: number                      // 0.11 for services (servicios en general)
  base_amount: number               // gross payment
  amount: number                    // withheld by customer
  concept: string                   // "Servicios en general" (concepto 11)
}
```

**Siigo integration (Colombia):**

```typescript
interface SiigoConfig {
  username: string                  // Siigo API username
  access_key: string                // Siigo API access key (encrypted)
  environment: 'sandbox' | 'production'
  api_base: 'https://api.siigo.com'

  // Siigo account mapping
  account_mapping: {
    income_account: string          // cuenta de ingresos (e.g. 4135050501)
    iva_account: string             // IVA por pagar (e.g. 2408)
    customer_account: string        // cartera clientes (e.g. 130505)
    bank_account: string            // caja/bancos (e.g. 111005)
  }
}

// Siigo invoice creation (POST /v1/invoices)
interface SiigoInvoicePayload {
  document: {
    id: number                      // Siigo document type ID for electronic invoice
  }
  date: string                      // YYYY-MM-DD
  customer: {
    identification: string          // NIT or CC
    branch_office: number           // 0 = principal
  }
  seller: number                    // Siigo seller/vendedor ID
  observations: string
  items: SiigoLineItem[]
  payments: SiigoPayment[]
}
```

**Alegra integration (Colombia):**

```typescript
interface AlegraConfig {
  email: string                     // Alegra account email
  token: string                     // Alegra API token (encrypted)
  api_base: 'https://api.alegra.com/api/v1'
}

// Alegra invoice creation (POST /invoices)
interface AlegraInvoicePayload {
  date: string                      // YYYY-MM-DD
  client: { id: number }            // Alegra client ID
  items: AlegraLineItem[]
  paymentMethod: string             // "bank_transfer" | "credit_card" | "cash"
  observations: string
  termsConditions: string
  // Alegra handles DIAN transmission automatically once enabled
}
```

**DIAN provider strategy:**

DIAN transmission requires a "software habilitado" — either proprietary software
certified by DIAN, or a third-party DIAN-certified provider.

Options for MarkOS SaaS Suite:
1. **Via Siigo or Alegra**: Both accounting systems are DIAN-certified software habilitado.
   When the invoice is created in Siigo/Alegra, they handle DIAN transmission automatically.
   This is the simplest path for most tenants.

2. **Via direct DIAN provider**: Services like Gosocket, Totvs, or Facturación Electrónica
   Colombia (FEC) provide APIs for direct DIAN transmission without requiring a full
   accounting system. Higher control, more integration work.

3. **Tenant's own DIAN habilitación**: For tenants who are already registered directly
   with DIAN, MarkOS can transmit using their certificates and credentials directly.

Default recommendation: **Option 1 (via Siigo or Alegra)** for all tenants at launch.
The tenant connects their Siigo or Alegra account, and DIAN compliance is handled
through that integration. This is the 80% solution that works for most Colombian SaaS companies.

---

## Part 5: Churn Intelligence Module

### Why churn prediction belongs in a marketing OS

Churn is a marketing problem as much as a product problem. The customer who cancels
was either acquired with the wrong expectation (messaging failed), not activated properly
(onboarding failed), or not re-engaged when they became at risk (lifecycle marketing failed).

The Churn Intelligence Module sits at the intersection of marketing and operations.
It uses the signals MarkOS already collects — email opens, content engagement, support
tickets, social interactions — alongside product usage data to build a 30-day early
warning system that fires while there is still time to intervene.

**Agent: MARKOS-AGT-SAS-04: Churn Risk Assessor**

### The health score

Every active subscription has a Health Score (0–100). 100 = zero churn risk. 0 = imminent churn.

```typescript
interface SubscriptionHealthScore {
  subscription_id: string
  score: number                     // 0–100
  risk_level: 'healthy' | 'watch' | 'at_risk' | 'critical'
  calculated_at: string
  previous_score: number | null
  score_delta: number | null        // change vs last calculation
  
  dimensions: HealthDimension[]
  
  // Top risk factors driving the score down
  risk_factors: RiskFactor[]
  
  // Recommended interventions
  interventions: Intervention[]
}

// Health score bands:
//   80–100: healthy    (green)    — standard lifecycle touches only
//   60–79:  watch      (yellow)   — increased engagement, proactive CS check-in
//   40–59:  at_risk    (orange)   — active intervention, save offer consideration
//   0–39:   critical   (red)      — urgent human intervention, executive outreach
```

**Health score dimensions and weights:**

```
HEALTH SCORE CALCULATION

Dimension 1: Product Usage (weight: 30%)
  Signals:
    - Login frequency vs. expected (based on plan + seat count)
    - Core feature adoption rate (% of value features ever used)
    - Usage trend: increasing / stable / declining (30-day slope)
    - Active users vs. licensed seats ratio
    - Last active date recency

  Sub-score: 0–100
    100 = heavy daily use, full feature adoption, positive trend
    0   = no logins in 30+ days

Dimension 2: Support Health (weight: 20%)
  Signals:
    - Open unresolved tickets (each -8 points)
    - Recent ticket sentiment (negative topics reduce score)
    - Escalations in last 90 days (-15 each)
    - Feature requests submitted (positive signal: engaged customer)
    - CSAT score on closed tickets

  Sub-score: 0–100

Dimension 3: Billing Health (weight: 20%)
  Signals:
    - Payment failures in last 180 days
    - Currently past_due (severe penalty)
    - Downgrade history
    - Coupon/discount usage pattern (heavy discounting = price sensitivity)
    - Annual vs monthly: annual = lower risk

  Sub-score: 0–100

Dimension 4: Marketing Engagement (weight: 15%)
  Signals (from MarkOS CRM/email/social data):
    - Email open rate on lifecycle emails (last 90 days)
    - NPS score recency and value
    - Community/social engagement (positive signal)
    - Response to campaigns and in-app messages
    - Webinar/event attendance

  Sub-score: 0–100

Dimension 5: Relationship Depth (weight: 15%)
  Signals:
    - Number of users on account (more seats = stickier)
    - Integration count (connected their tools = higher switching cost)
    - Data volume created in product (content, contacts, campaigns)
    - Tenure (longer = stickier, though not always)
    - Champion identified in CRM? (known internal advocate)

  Sub-score: 0–100

FINAL HEALTH SCORE = Σ (dimension_score × weight)
```

### Churn early warning system

```
CHURN ALERT SCHEDULE

Daily (automated, no human review):
  → Health score recalculated for all active subscriptions
  → Subscriptions crossing risk threshold → create CS task
  → Subscriptions entering 'critical' → P1 alert

Weekly (SAS-04 synthesis):
  → Cohort health summary: avg health score by plan tier
  → New at-risk accounts identified this week
  → Interventions in progress and their outcomes
  → Predicted churn (next 30 days) in ARR terms
  → Comparison to prior week: is the fleet getting healthier or sicker?

Monthly (SAS-04 deep analysis):
  → Churn cohort analysis: who churned last month, what their health score was 30/60/90 days prior
  → Health score predictive power: is the score actually predictive? calibration check
  → Root cause clustering: what patterns appear in churned accounts
  → Win-back opportunities: churned accounts whose stated reason has been addressed
```

### Intervention playbooks

Each risk level triggers a different intervention playbook:

**Watch (60–79):**
```
  → Marketing: customer enters "engagement deepening" email sequence
    (feature education, case studies, community invites)
  → CS: proactive check-in email from CS team
    (not a sales call — a "how's it going?" with specific usage context)
  → Product: in-app "tips" for unused features (based on their specific gaps)
  No approval required — these are automated touches.
```

**At-risk (40–59):**
```
  → CS task created: "At-risk account — schedule EBR within 7 days"
    (EBR = Executive Business Review)
  → SAS-04 generates account brief:
    - What they use / don't use
    - Their top support topics
    - Their stated goals at signup vs current state
    - ROI calculation if data supports it
    - Specific intervention recommendation (training? new feature? pricing adjustment?)
  → Save offer eligibility evaluated by PRC-04 (Pricing Engine)
  → Marketing: pauses standard promotional emails — only CS-approved messages
  Approval required for any save offer or pricing adjustment.
```

**Critical (0–39):**
```
  → P1 task to CS lead + executive sponsor
  → SAS-04 generates crisis brief with urgency framing
  → If ARR > threshold: founder/CEO is notified directly
  → All automated marketing sequences paused
  → Human outreach required within 24 hours
  → Win-back offer designed specifically for this account
  → Option: product team flagged if technical issues are in play
```

---

## Part 6: Customer Support Module

### The support layer in a SaaS context

Support is not a cost center to be minimized. In SaaS, support quality is directly
correlated with retention. The MarkOS SaaS Suite Customer Support Module does three things:

1. Manages the inbound support queue efficiently (tickets, chat, email)
2. Surfaces product intelligence from support patterns (what are customers struggling with?)
3. Closes the loop between support data and churn risk (a customer who opened 3 tickets this month is at risk)

**Agent: MARKOS-AGT-SAS-05: Support Intelligence Agent**

### Support ticket schema

```typescript
interface SupportTicket {
  ticket_id: string
  tenant_id: string
  customer_id: string
  subscription_id: string | null

  // Identity
  ticket_number: string             // SaaS-TICK-00847 format
  channel: TicketChannel
  status: TicketStatus
  priority: 'urgent' | 'high' | 'normal' | 'low'

  // Content
  subject: string
  description: string
  category: TicketCategory
  tags: string[]

  // AI analysis
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated'
  intent: TicketIntent
  churn_signal: boolean             // true if ticket content signals churn risk
  churn_signal_reason: string | null
  suggested_response: string | null // AI-drafted response
  suggested_kb_articles: string[]   // relevant knowledge base articles

  // Assignment
  assigned_to: string | null        // user_id of CS agent
  assigned_at: string | null

  // SLA
  first_response_sla_hours: number
  resolution_sla_hours: number
  first_response_at: string | null
  resolved_at: string | null
  sla_breached: boolean

  // CSAT
  csat_requested_at: string | null
  csat_score: 1 | 2 | 3 | 4 | 5 | null
  csat_comment: string | null

  // Context
  health_score_at_open: number | null
  mrr_at_open: number | null

  created_at: string
  updated_at: string
}

type TicketChannel = 'email' | 'chat' | 'portal' | 'social' | 'phone' | 'api'
type TicketStatus = 'new' | 'open' | 'pending_customer' | 'pending_internal' | 'resolved' | 'closed'
type TicketCategory =
  | 'billing'           // invoice questions, payment issues
  | 'technical'         // bugs, errors, integration issues
  | 'feature_request'   // asking for something that doesn't exist
  | 'onboarding'        // setup, how-to questions
  | 'account'           // seat management, user permissions, data export
  | 'cancellation'      // explicit cancellation intent
  | 'other'

type TicketIntent =
  | 'get_help'          // standard support question
  | 'report_bug'        // technical issue
  | 'request_feature'   // product feedback
  | 'complaint'         // frustrated, negative experience
  | 'cancel'            // explicit cancellation intent
  | 'upgrade'           // wants more features
  | 'billing_dispute'   // questioning an invoice
```

### Support intelligence workflows

**AI-assisted ticket response:**

```
TRIGGER: New ticket created

Step 1: SAS-05 analyzes ticket
  → Category classification
  → Sentiment and intent detection
  → Churn signal detection
  → Subscription health context pulled

Step 2: Knowledge base search
  → Semantic search against KB articles
  → Top 3 relevant articles identified

Step 3: Draft response generation
  Using:
    - Ticket content and history
    - KB articles
    - Customer's subscription plan and feature access
    - Brand voice pack (support tone is configured separately from marketing tone)
    - Customer's history (prior tickets, health score, tenure)
  
  Draft is generated but NEVER auto-sent.
  All responses require CS agent review and approval
  (unless tenant explicitly enables auto-response for specific categories)

Step 4: CS agent reviews
  → Sees: customer context, subscription health, suggested KB articles, AI draft
  → Edits or approves draft
  → Sends response

Step 5: Churn signal routing
  If churn_signal == true:
    → Create linked Churn Intelligence task
    → Update subscription health score (negative)
    → Route account to appropriate intervention level
```

**Support analytics for product intelligence:**

```
WEEKLY SUPPORT INTELLIGENCE REPORT (SAS-05)

Top ticket categories this week:
  1. Billing questions (34% of tickets)   ← unusually high — investigate
  2. Integration issues (22%)
  3. Feature questions (18%)
  4. Onboarding (16%)
  5. Other (10%)

Emerging issues (tickets that cluster around a new theme):
  → 7 tickets in 5 days about "CSV export timing out"
    → Pattern suggests a product bug or performance regression
    → Recommended: route to engineering immediately

Churn-signal tickets: 4 this week (3.2% of total)
  → All 4 accounts flagged in Churn Intelligence
  → Average health score at ticket open: 52 (at-risk band)

CSAT this week: 4.2/5 (up from 4.0 last week)
  Top positive themes: fast responses, helpfulness
  Top negative themes: feature limitations, pricing questions

Feature requests extracted this week:
  → "Bulk CSV import" (mentioned by 6 different accounts this week)
  → "Zapier integration" (mentioned 4 times)
  → "Custom invoice branding" (mentioned 3 times)
  → Forwarded to product team via Linear integration
```

### Support integrations

The Support Module does not replace external support tools. It integrates with them:

```typescript
type SupportIntegration =
  | 'intercom'          // most common for SaaS
  | 'zendesk'           // enterprise preference
  | 'freshdesk'         // mid-market
  | 'linear'            // bug/feature routing to engineering
  | 'slack'             // internal escalation channel
  | 'native'            // MarkOS native support (for tenants without a separate tool)

// When integrated with an external tool:
// - Tickets sync bi-directionally
// - AI analysis happens in MarkOS
// - Churn signals flow to Churn Intelligence Module
// - Customer health context enriches the external tool's contact view (via API)
```

---

## Part 7: Product Usage & Health Module

### Why marketing needs product usage data

The best marketing intelligence for a SaaS company is not GA4 or GSC — it is the
product itself. Users who use feature X are 3× less likely to churn. Users who set up
integrations in week 1 have 70% higher 6-month retention. Users who invite a second
team member double their lifetime value.

These signals live in PostHog (already a MarkOS connector) and in whatever product
analytics the tenant uses. The SaaS Suite's Product Usage Module normalizes these
signals into the health score system and makes them actionable.

### Usage data connectors

```typescript
type UsageDataSource =
  | 'posthog'           // preferred — already a MarkOS connector
  | 'mixpanel'          // popular alternative
  | 'amplitude'         // enterprise product analytics
  | 'heap'              // auto-capture analytics
  | 'segment'           // CDP that feeds other tools
  | 'custom_webhook'    // tenant pushes usage events via webhook

// Usage event schema (normalized from any source)
interface UsageEvent {
  tenant_id: string                 // the MarkOS tenant
  customer_id: string               // their customer
  subscription_id: string
  user_id: string                   // the individual user within the customer account

  event_name: string
  event_category: 'activation' | 'core_feature' | 'advanced_feature' | 'admin' | 'integration'
  event_properties: Record<string, unknown>

  is_key_action: boolean            // tenant-configured: which events signal value delivery
  occurred_at: string
}
```

### Key action configuration

The tenant configures which product events constitute "value delivery" moments.
These key actions are the foundation of the health score's product usage dimension.

```
KEY ACTION SETUP WIZARD

"Tell us which actions in your product signal that a customer is getting value.
 These will be tracked as your most important engagement indicators."

Example for a marketing tool (pre-filled suggestions):
  ✓ "first_campaign_published"   — First campaign goes live
  ✓ "content_approved"          — Content approved for the first time
  ✓ "connector_connected"       — First external integration connected
  ✓ "team_member_invited"       — Invited a second user
  ✓ "report_viewed"             — Viewed a performance report

Add custom key actions:
  Event name: [________________]  Label: [________________]  [ + Add ]

These events will be weighted 3× more heavily in the health score calculation
than general product activity events.
```

### Product-led growth signals

The Product Usage Module identifies and surfaces PLC (product-led conversion) signals:

```
PRODUCT-LED GROWTH OPPORTUNITIES

Active trials approaching usage limits:
  → 3 trial accounts have used 80%+ of their trial limits
  → Usage pattern suggests they would benefit from the Professional tier
  → Recommended action: proactive upgrade prompt with ROI context

Seat expansion candidates:
  → 8 accounts have 3+ power users + 5+ read-only users on a single seat plan
  → This pattern precedes expansion 68% of the time in our data
  → Recommended action: "Team Expansion" email sequence activation

Feature adoption gaps in high-value accounts:
  → Account "Acme Corp" ($2,400 ARR) has never used the Social OS module
  → They're on the Professional tier which includes it
  → Recommended action: personalized onboarding email for this specific module

Stickiness alerts:
  → Account "Beta Corp" — 0 logins in 14 days, last used 3 features
  → Health score: 48 (at-risk)
  → SAS-04 intervention triggered
```

---

## Part 8: Revenue Intelligence Dashboard (SaaS-Specific)

The Revenue Intelligence Dashboard consolidates all SaaS financial metrics into a
single view that every operator needs and no existing marketing tool provides.

### Core SaaS metrics tracked

```typescript
interface SaaSRevenueMetrics {
  tenant_id: string
  period: string                    // YYYY-MM

  // MRR waterfall
  mrr_start: number
  mrr_new: number                   // new subscriptions
  mrr_expansion: number             // upgrades + seat additions
  mrr_contraction: number           // downgrades + seat reductions
  mrr_churn: number                 // cancellations (negative)
  mrr_reactivation: number          // win-backs
  mrr_end: number                   // = start + new + expansion - contraction - churn + reactivation

  // ARR
  arr: number                       // mrr_end × 12

  // Unit economics
  arpu: number                      // average revenue per unit (subscription)
  avg_subscription_age_months: number

  // Churn
  customer_churn_rate: number       // % of customers churned this month
  revenue_churn_rate: number        // % of MRR churned (net if negative = expansion)
  net_revenue_retention: number     // NRR: (MRR end - MRR new) / MRR start
  gross_revenue_retention: number   // GRR: ignores expansion

  // Growth
  mrr_growth_rate_mom: number       // month-over-month
  mrr_growth_rate_yoy: number       // year-over-year (if available)

  // Cohort summary
  active_subscriptions: number
  new_subscriptions: number
  churned_subscriptions: number

  // By plan (array per plan tier)
  by_plan: PlanMetrics[]

  // By country (for multi-country tenants)
  by_country: CountryMetrics[]
}
```

### Revenue waterfall view (UI)

```
REVENUE WATERFALL — June 2026

Starting MRR:    $28,400
  + New:         +$3,200   (14 new subscriptions)
  + Expansion:   +$1,100   (4 upgrades, 7 seat additions)
  - Contraction: -$400     (2 downgrades)
  - Churn:       -$1,600   (6 cancellations)
  + Reactivation: +$300    (1 win-back)
               ──────────
Ending MRR:      $31,000   (+9.2% MoM)

ARR:   $372,000
NRR:   112%     ✓ (healthy: expansion > churn)
GRR:   94.4%    ✓ (above 90% benchmark)

Churn rate: 2.1% customers / 5.6% revenue (revenue churn higher = larger accounts churning)
  → ALERT: Revenue churn > customer churn suggests disproportionate large account loss.
    Review: 3 accounts churned representing $900 MRR. See churn analysis.
```

---

## Part 9: SaaS Suite Agent Network

The SaaS Suite adds a new agent tier to the MarkOS network: **Tier 12 — SaaS Agents (MARKOS-AGT-SAS-*)**.

### New SaaS agents

**MARKOS-AGT-SAS-01: Subscription Lifecycle Manager**
- Role: Orchestrate subscription lifecycle events — trial conversion, upgrades, downgrades, cancellation flows
- Inputs: Subscription events + payment processor webhooks + tenant workflow configuration
- Outputs: Triggered email sequences, CRM updates, task creation, approval gates for pricing actions
- Cadence: Event-driven (real-time webhook response)
- Approval gate: Yes for pricing adjustments; No for standard lifecycle emails

**MARKOS-AGT-SAS-02: Revenue Intelligence Analyst**
- Role: SaaS-specific revenue analytics — MRR waterfall, NRR, churn cohorts, predictive forecasting
- Inputs: Subscription data + payment data + plan data
- Outputs: Monthly revenue report, MRR waterfall, churn cohort analysis, 90-day forecast
- Cadence: Monthly detailed + weekly summary
- Approval gate: No — analytics only

**MARKOS-AGT-SAS-03: Billing Compliance Agent**
- Role: Ensure every invoice meets legal requirements for its billing country; manage DIAN transmission (CO) and QuickBooks sync (US)
- Inputs: Invoice draft + customer billing details + country compliance config
- Outputs: Compliant invoice (validated), DIAN XML (CO), QuickBooks records (US), compliance status
- Cadence: Real-time per invoice event
- Approval gate: Yes for rejected DIAN invoices requiring correction

**MARKOS-AGT-SAS-04: Churn Risk Assessor**
- Role: Calculate and maintain health scores, detect at-risk accounts, recommend interventions
- Inputs: Usage events + support tickets + email engagement + billing health + relationship depth
- Outputs: Health score per subscription, risk alerts, intervention recommendations, weekly churn forecast
- Cadence: Daily health score recalculation; real-time on significant negative events
- Approval gate: Yes for save offers; No for standard monitoring alerts

**MARKOS-AGT-SAS-05: Support Intelligence Agent**
- Role: Analyze support tickets, draft responses, identify product patterns, route churn signals
- Inputs: Incoming support tickets + knowledge base + customer context + brand voice (support register)
- Outputs: Response drafts, category classification, churn signals, weekly product intelligence report
- Cadence: Real-time per ticket; weekly synthesis
- Approval gate: Yes for all customer-facing responses (unless auto-response configured)

**MARKOS-AGT-SAS-06: Expansion Revenue Scout**
- Role: Identify upsell and cross-sell opportunities within existing customer base
- Inputs: Product usage data + subscription plan + health score + feature adoption gaps + PRC-01 pricing data
- Outputs: Expansion opportunity list ranked by probability and ARR potential, recommended outreach
- Cadence: Weekly scan
- Approval gate: Yes for expansion campaign activation

### SaaS agent interaction patterns

```
PATTERN: Monthly Revenue Close (runs on 1st of each month)

  SAS-02 (Revenue Intelligence Analyst):
    → Calculates MRR waterfall for prior month
    → Identifies top churn cohort patterns
    → Forecasts next 90 days
    → Produces monthly revenue report
    ↓
  SAS-04 (Churn Risk Assessor):
    → Reviews health score distribution vs prior month
    → Identifies accounts that improved / declined
    → Flags cohort-level patterns (a specific plan tier churning more?)
    ↓
  PRC-01 (SaaS Pricing Strategist):
    → Receives revenue data + churn data
    → Updates pricing analysis with actual retention by price point
    → Identifies if a tier's churn rate is above benchmark
    ↓
  STR-05 (OKR Monitor) receives consolidated SaaS + revenue package:
    → Updates pipeline OKRs with actual MRR + churn data
    → Morning brief: "Monthly revenue close: $31K MRR (+9.2%) — [key insights]"

PATTERN: At-Risk Account Intervention

  TRIGGER: SAS-04 health score calculation → score drops to 'at_risk' (40–59)

  SAS-04:
    → Creates CS task: "Account at risk — [company name], score 52"
    → Generates account brief: usage gaps, recent support, billing history, recommended intervention
    ↓
  CONT-05 (Email Sequence Writer) — if automated intervention:
    → Drafts personalized "feature adoption" or "check-in" email
    → Uses usage data + VOC corpus + brand voice
    → Routes to approval gate
    ↓
  PRC-04 (Pricing Recommendation Agent) — if save offer warranted:
    → Evaluates: is a discount warranted given this account's history?
    → Produces save offer recommendation with margin analysis
    → Routes to approval gate (pricing changes always human-approved)
```

---

## Part 10: Database Schema

```sql
-- Subscriptions
CREATE TABLE saas_subscriptions (
  subscription_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES crm_contacts(id),
  plan_id             UUID NOT NULL REFERENCES saas_plans(plan_id),
  status              TEXT NOT NULL DEFAULT 'trialing',
  billing_model       TEXT NOT NULL,
  billing_frequency   TEXT NOT NULL DEFAULT 'monthly',
  price_per_cycle     NUMERIC(12,2) NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  seats_contracted    INTEGER,
  trial_ends_at       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end  TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at         TIMESTAMPTZ,
  cancellation_reason TEXT,
  processor           TEXT NOT NULL CHECK (processor IN ('stripe','mercado_pago')),
  processor_subscription_id TEXT,
  payment_method_id   TEXT,
  payment_country     CHAR(2) NOT NULL,
  health_score        SMALLINT NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  churn_risk          TEXT NOT NULL DEFAULT 'low',
  last_activity_at    TIMESTAMPTZ,
  nps_score           SMALLINT CHECK (nps_score BETWEEN 0 AND 10),
  tax_id              TEXT,
  legal_entity_name   TEXT,
  billing_country     CHAR(2) NOT NULL,
  requires_electronic_invoice BOOLEAN NOT NULL DEFAULT FALSE,
  last_invoice_id     UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plans
CREATE TABLE saas_plans (
  plan_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  position            SMALLINT NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'active',
  billing_model       TEXT NOT NULL,
  pricing             JSONB NOT NULL DEFAULT '[]',    -- array of PlanPricing per currency
  value_metric        JSONB,
  usage_limits        JSONB NOT NULL DEFAULT '[]',
  features            JSONB NOT NULL DEFAULT '[]',
  is_public           BOOLEAN NOT NULL DEFAULT TRUE,
  is_enterprise       BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days          SMALLINT,
  trial_requires_card BOOLEAN NOT NULL DEFAULT FALSE,
  grandfathered_count INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE saas_invoices (
  invoice_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES crm_contacts(id),
  subscription_id     UUID REFERENCES saas_subscriptions(subscription_id),
  invoice_number      TEXT NOT NULL,
  invoice_type        TEXT NOT NULL DEFAULT 'subscription',
  status              TEXT NOT NULL DEFAULT 'draft',
  currency            CHAR(3) NOT NULL,
  subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_lines           JSONB NOT NULL DEFAULT '[]',
  tax_total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total               NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid         NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_due          NUMERIC(14,2) NOT NULL DEFAULT 0,
  billing_country     CHAR(2) NOT NULL,
  legal_invoice_number TEXT,
  tax_id_customer     TEXT,
  tax_id_vendor       TEXT,
  legal_status        TEXT,
  electronic_invoice_xml TEXT,
  electronic_invoice_pdf_url TEXT,
  cufe                TEXT,                          -- Colombia DIAN CUFE
  line_items          JSONB NOT NULL DEFAULT '[]',
  processor           TEXT,
  processor_invoice_id TEXT,
  processor_payment_intent_id TEXT,
  payment_method_type TEXT,
  paid_at             TIMESTAMPTZ,
  quickbooks_invoice_id TEXT,
  siigo_invoice_id    TEXT,
  alegra_invoice_id   TEXT,
  accounting_synced_at TIMESTAMPTZ,
  sent_to_email       TEXT NOT NULL,
  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  due_at              TIMESTAMPTZ NOT NULL,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health scores (time-series)
CREATE TABLE saas_health_scores (
  score_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id     UUID NOT NULL REFERENCES saas_subscriptions(subscription_id) ON DELETE CASCADE,
  score               SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  risk_level          TEXT NOT NULL,
  dimensions          JSONB NOT NULL DEFAULT '{}',
  risk_factors        JSONB NOT NULL DEFAULT '[]',
  interventions       JSONB NOT NULL DEFAULT '[]',
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support tickets
CREATE TABLE saas_support_tickets (
  ticket_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES crm_contacts(id),
  subscription_id     UUID REFERENCES saas_subscriptions(subscription_id),
  ticket_number       TEXT NOT NULL,
  channel             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'new',
  priority            TEXT NOT NULL DEFAULT 'normal',
  subject             TEXT NOT NULL,
  description         TEXT NOT NULL,
  category            TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  sentiment           TEXT,
  intent              TEXT,
  churn_signal        BOOLEAN NOT NULL DEFAULT FALSE,
  churn_signal_reason TEXT,
  suggested_response  TEXT,
  suggested_kb_articles TEXT[] NOT NULL DEFAULT '{}',
  assigned_to         UUID REFERENCES users(id),
  assigned_at         TIMESTAMPTZ,
  first_response_sla_hours SMALLINT NOT NULL DEFAULT 8,
  resolution_sla_hours SMALLINT NOT NULL DEFAULT 48,
  first_response_at   TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  sla_breached        BOOLEAN NOT NULL DEFAULT FALSE,
  csat_requested_at   TIMESTAMPTZ,
  csat_score          SMALLINT CHECK (csat_score BETWEEN 1 AND 5),
  csat_comment        TEXT,
  health_score_at_open SMALLINT,
  mrr_at_open         NUMERIC(12,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MRR snapshots (monthly)
CREATE TABLE saas_mrr_snapshots (
  snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period              CHAR(7) NOT NULL,   -- YYYY-MM
  mrr_start           NUMERIC(14,2) NOT NULL,
  mrr_new             NUMERIC(14,2) NOT NULL DEFAULT 0,
  mrr_expansion       NUMERIC(14,2) NOT NULL DEFAULT 0,
  mrr_contraction     NUMERIC(14,2) NOT NULL DEFAULT 0,
  mrr_churn           NUMERIC(14,2) NOT NULL DEFAULT 0,
  mrr_reactivation    NUMERIC(14,2) NOT NULL DEFAULT 0,
  mrr_end             NUMERIC(14,2) NOT NULL,
  arr                 NUMERIC(14,2) NOT NULL,
  arpu                NUMERIC(10,2) NOT NULL,
  customer_churn_rate NUMERIC(6,4) NOT NULL,
  revenue_churn_rate  NUMERIC(6,4) NOT NULL,
  net_revenue_retention NUMERIC(6,4) NOT NULL,
  gross_revenue_retention NUMERIC(6,4) NOT NULL,
  active_subscriptions INTEGER NOT NULL,
  new_subscriptions   INTEGER NOT NULL DEFAULT 0,
  churned_subscriptions INTEGER NOT NULL DEFAULT 0,
  by_plan             JSONB NOT NULL DEFAULT '[]',
  by_country          JSONB NOT NULL DEFAULT '[]',
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, period)
);

-- Processor configs
CREATE TABLE saas_processor_configs (
  config_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  processor_type      TEXT NOT NULL CHECK (processor_type IN ('stripe','mercado_pago')),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  credentials         JSONB NOT NULL,  -- encrypted: publishable key, webhook secret, etc.
  supported_countries TEXT[] NOT NULL DEFAULT '{}',
  supported_currencies TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, processor_type)
);

-- Accounting integrations
CREATE TABLE saas_accounting_configs (
  config_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL CHECK (provider IN ('quickbooks','siigo','alegra')),
  country             CHAR(2) NOT NULL,
  credentials         JSONB NOT NULL,  -- encrypted OAuth tokens or API keys
  account_mapping     JSONB NOT NULL DEFAULT '{}',
  auto_sync           BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at        TIMESTAMPTZ,
  sync_status         TEXT NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

-- DIAN compliance config (Colombia-specific)
CREATE TABLE saas_dian_config (
  config_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  nit                 TEXT NOT NULL,
  razon_social        TEXT NOT NULL,
  regimen_tributario  TEXT NOT NULL DEFAULT 'responsable_iva',
  dian_technical_key  TEXT NOT NULL,  -- encrypted ClTec
  dian_test_set_id    TEXT,           -- for habilitación
  digital_certificate TEXT NOT NULL,  -- encrypted PEM certificate
  certificate_password TEXT NOT NULL, -- encrypted
  invoice_prefix      TEXT NOT NULL,  -- e.g. "SETP"
  invoice_from_number INTEGER NOT NULL DEFAULT 1,
  invoice_to_number   INTEGER NOT NULL,
  current_number      INTEGER NOT NULL DEFAULT 1,
  environment         TEXT NOT NULL DEFAULT 'habilitacion' CHECK (environment IN ('habilitacion','production')),
  enabled             BOOLEAN NOT NULL DEFAULT FALSE,  -- requires validation before enabling
  validated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All RLS
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_mrr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_processor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_accounting_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_dian_config ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_subs_tenant_status ON saas_subscriptions(tenant_id, status);
CREATE INDEX idx_subs_health ON saas_subscriptions(tenant_id, health_score, churn_risk);
CREATE INDEX idx_invoices_tenant_status ON saas_invoices(tenant_id, status, issued_at);
CREATE INDEX idx_invoices_legal ON saas_invoices(tenant_id, billing_country, legal_status);
CREATE INDEX idx_tickets_tenant_status ON saas_support_tickets(tenant_id, status, created_at);
CREATE INDEX idx_health_sub_time ON saas_health_scores(subscription_id, calculated_at DESC);
CREATE INDEX idx_mrr_tenant_period ON saas_mrr_snapshots(tenant_id, period DESC);
```

---

## Part 11: API Surface

```
BASE PATH: /v1/saas/

All endpoints require: Authorization: Bearer {token}
All responses include: X-Tenant-ID, X-Request-ID
Errors follow RFC 9457 Problem Details format
```

### Subscriptions

```
GET    /v1/saas/subscriptions                   List all subscriptions with filters
POST   /v1/saas/subscriptions                   Create subscription manually
GET    /v1/saas/subscriptions/{id}              Get single subscription with full context
PATCH  /v1/saas/subscriptions/{id}              Update subscription (plan, seats, etc.)
DELETE /v1/saas/subscriptions/{id}              Cancel at period end

POST   /v1/saas/subscriptions/{id}/upgrade      Upgrade to higher plan (prorates)
POST   /v1/saas/subscriptions/{id}/downgrade    Downgrade to lower plan
POST   /v1/saas/subscriptions/{id}/pause        Pause billing
POST   /v1/saas/subscriptions/{id}/resume       Resume paused subscription
POST   /v1/saas/subscriptions/{id}/reactivate   Reactivate canceled subscription

GET    /v1/saas/subscriptions/{id}/health       Get current health score + history
GET    /v1/saas/subscriptions/{id}/invoices     Get invoices for subscription
GET    /v1/saas/subscriptions/{id}/events       Get subscription event history
GET    /v1/saas/subscriptions/{id}/usage        Get usage metrics for subscription
```

### Plans

```
GET    /v1/saas/plans                           List all plans
POST   /v1/saas/plans                           Create new plan
GET    /v1/saas/plans/{id}                      Get plan detail
PATCH  /v1/saas/plans/{id}                      Update plan
DELETE /v1/saas/plans/{id}                      Deprecate plan (grandfathers existing)

GET    /v1/saas/plans/{id}/subscriptions        Get subscriptions on this plan
GET    /v1/saas/plans/{id}/metrics              Get plan-level churn, ARPU, health
```

### Invoices and Billing

```
GET    /v1/saas/invoices                        List invoices with filters
POST   /v1/saas/invoices                        Create one-time invoice
GET    /v1/saas/invoices/{id}                   Get invoice with all details
POST   /v1/saas/invoices/{id}/send              Send invoice to customer
POST   /v1/saas/invoices/{id}/void              Void an invoice
POST   /v1/saas/invoices/{id}/credit-note       Create credit note against invoice
GET    /v1/saas/invoices/{id}/pdf               Download invoice PDF
GET    /v1/saas/invoices/{id}/xml               Download DIAN XML (CO only)

POST   /v1/saas/invoices/{id}/retry-dian        Retry failed DIAN transmission (CO)
GET    /v1/saas/invoices/{id}/accounting-sync   Get accounting sync status
POST   /v1/saas/invoices/{id}/sync-accounting   Manual sync to accounting system
```

### Revenue Intelligence

```
GET    /v1/saas/revenue/mrr                     Current MRR with waterfall
GET    /v1/saas/revenue/mrr/history             MRR history (monthly snapshots)
GET    /v1/saas/revenue/arr                     Current ARR
GET    /v1/saas/revenue/churn                   Churn metrics (customer + revenue)
GET    /v1/saas/revenue/nrr                     Net Revenue Retention
GET    /v1/saas/revenue/cohorts                 Cohort retention analysis
GET    /v1/saas/revenue/forecast                90-day revenue forecast
GET    /v1/saas/revenue/by-plan                 Revenue breakdown by plan
GET    /v1/saas/revenue/by-country              Revenue breakdown by country
```

### Churn Intelligence

```
GET    /v1/saas/churn/at-risk                   All at-risk and critical subscriptions
GET    /v1/saas/churn/health-scores             Health scores for all subscriptions
GET    /v1/saas/churn/interventions             Active and completed interventions
POST   /v1/saas/churn/interventions             Create manual intervention
GET    /v1/saas/churn/forecast                  Predicted churn next 30/60/90 days
GET    /v1/saas/churn/analysis                  Root cause analysis for churned accounts
```

### Support

```
GET    /v1/saas/support/tickets                 List tickets with filters
POST   /v1/saas/support/tickets                 Create ticket
GET    /v1/saas/support/tickets/{id}            Get ticket with AI analysis
PATCH  /v1/saas/support/tickets/{id}            Update ticket (status, assignment, etc.)
POST   /v1/saas/support/tickets/{id}/reply      Add reply to ticket
POST   /v1/saas/support/tickets/{id}/resolve    Resolve ticket + trigger CSAT

GET    /v1/saas/support/analytics              Weekly/monthly support analytics
GET    /v1/saas/support/patterns               Emerging issue patterns from AI analysis
```

### Compliance

```
GET    /v1/saas/compliance/dian/status          DIAN configuration and status (CO)
POST   /v1/saas/compliance/dian/validate        Validate DIAN configuration
POST   /v1/saas/compliance/dian/test-invoice    Send test invoice to DIAN habilitación
GET    /v1/saas/compliance/us/tax-config        US sales tax configuration
GET    /v1/saas/compliance/accounting           List accounting integrations
POST   /v1/saas/compliance/accounting/sync      Trigger manual accounting sync
```

### Webhooks (inbound from processors)

```
POST   /v1/webhooks/stripe                      Stripe event endpoint (verified by signature)
POST   /v1/webhooks/mercado-pago                MP IPN endpoint (verified by signature)
POST   /v1/webhooks/dian                        DIAN response callback (CO)
```

---

## Part 12: MCP Surface

Server: `markos-saas`
Transport: SSE at `wss://mcp.markos.ai/saas`

```json
[
  {
    "name": "get_subscription_health",
    "description": "Returns the health score and risk level for a specific customer subscription. Use when writing renewal content, churn-prevention emails, or preparing for a customer call.",
    "inputSchema": {
      "properties": {
        "customer_id": { "type": "string" },
        "include_history": { "type": "boolean", "default": false }
      },
      "required": ["customer_id"]
    }
  },
  {
    "name": "get_at_risk_accounts",
    "description": "Returns all subscriptions currently in at-risk or critical health. Use when generating churn-prevention campaign lists, intervention email sequences, or CS priority queues.",
    "inputSchema": {
      "properties": {
        "risk_level": { "type": "string", "enum": ["watch","at_risk","critical","all"], "default": "at_risk" },
        "min_mrr": { "type": "number", "description": "Filter to accounts above this MRR threshold" }
      }
    }
  },
  {
    "name": "get_mrr_summary",
    "description": "Returns current MRR, ARR, NRR, and churn rate. Use when generating strategy documents, investor updates, or marketing performance reports that reference revenue.",
    "inputSchema": {
      "properties": {
        "period": { "type": "string", "description": "YYYY-MM — defaults to current month" }
      }
    }
  },
  {
    "name": "get_plan_performance",
    "description": "Returns churn rate, health score distribution, and ARPU for each pricing plan. Use when evaluating pricing changes or writing plan-specific content.",
    "inputSchema": {
      "properties": {
        "plan_id": { "type": "string", "description": "Optional — omit for all plans" }
      }
    }
  },
  {
    "name": "get_expansion_opportunities",
    "description": "Returns accounts with high expansion potential (upgrade or seat expansion). Use when generating upsell campaigns, account-based expansion sequences, or CS expansion pipeline.",
    "inputSchema": {
      "properties": {
        "min_health_score": { "type": "number", "default": 60 },
        "limit": { "type": "integer", "default": 20 }
      }
    }
  },
  {
    "name": "get_support_patterns",
    "description": "Returns emerging support ticket patterns and top issues this week. Use when generating product update communications or writing content about common customer questions.",
    "inputSchema": {
      "properties": {
        "days": { "type": "integer", "default": 30 }
      }
    }
  },
  {
    "name": "get_invoice_compliance_status",
    "description": "Returns billing compliance status per country, including DIAN transmission status for Colombia. Use when generating billing-related communications or audit reports.",
    "inputSchema": {
      "properties": {
        "country": { "type": "string", "description": "ISO 3166-1 alpha-2 — omit for all countries" }
      }
    }
  }
]
```

---

## Part 13: UI/UX Surface

### SaaS Suite navigation

```
MARKOS SIDEBAR (SaaS Suite modules)

SaaS SUITE                       ← conditional: only visible if business_type = saas
  ▸ Overview                     (SaaS health dashboard)
  ▸ Subscriptions                (subscription list + lifecycle management)
  ▸ Plans                        (plan and tier management)
  ▸ Revenue                      (MRR waterfall + ARR + NRR)
  ▸ Churn Intelligence           (health scores + at-risk + interventions)
  ▸ Invoices & Billing           (invoice list + payment status)
  ▸ Customer Support             (ticket queue + AI-assisted responses)
  ▸ Product Usage                (usage events + key actions + adoption)

INTEGRATIONS (SaaS-specific additions)
  ▸ Stripe                       (connection + config)
  ▸ Mercado Pago                 (connection + config)
  ▸ QuickBooks                   (US accounting sync)
  ▸ Siigo / Alegra               (CO accounting sync)
  ▸ DIAN Config                  (CO electronic invoice setup)
```

### SaaS Suite overview dashboard

```
SaaS SUITE OVERVIEW                              [June 2026]

REVENUE HEALTH
  MRR: $31,000  (+9.2% MoM)    ARR: $372,000
  NRR: 112% ✓   GRR: 94.4% ✓  Churn: 2.1%

SUBSCRIPTION HEALTH
  Active:         84
  Healthy (80+):  61 (73%)
  Watch (60–79):  14 (17%)
  At-Risk (40–59):  7  (8%)   ← 7 require attention
  Critical (<40):   2  (2%)   ← ⚡ urgent

BILLING STATUS
  Invoices due this month: 84
  Paid: 79 (94%)
  Past due: 3  ← requires follow-up
  DIAN pending (CO): 1 invoice awaiting transmission

SUPPORT QUEUE
  Open tickets: 12
  SLA at risk: 2  ← respond within 3 hours
  Churn signals detected: 1 ticket

TODAY'S ACTIONS
  → 2 critical accounts — human outreach required  [View]
  → 3 past-due invoices — dunning sequence ready   [Review]
  → 2 SLA-at-risk tickets                          [Open queue]
  → 1 DIAN transmission error                      [Resolve]
```

### DIAN setup wizard (Colombia onboarding)

Because DIAN setup is complex and has legal consequences, the wizard is step-by-step
with validation at each stage:

```
COLOMBIA ELECTRONIC INVOICE SETUP

Step 1 of 6: Company identification
  NIT (sin dígito de verificación): [_______________]
  Dígito de verificación:           [_]  (auto-calculated)
  Razón social:                     [___________________________]
  Régimen tributario:
    ○ Responsable de IVA  (most SaaS companies)
    ○ No responsable de IVA
    ○ Gran Contribuyente
  [ Validate NIT with DIAN → ]

Step 2 of 6: DIAN credentials
  ClTec (Technical Key from DIAN):  [________________________________]
  Prefijo de facturación:           [____]  (e.g. SETP)
  Rango autorizado: desde [_____] hasta [_____]
  [ I don't have these yet → How to obtain them ]

Step 3 of 6: Digital certificate
  Upload DIAN digital certificate (.p12 or .pfx):  [ Upload certificate ]
  Certificate password:                             [________________]
  Certificate expires: [auto-detected]
  [ Validate certificate → ]

Step 4 of 6: Accounting integration
  Sync invoices to:
    ○ Siigo  [ Connect Siigo account ]
    ○ Alegra [ Connect Alegra account ]
    ○ Manual export only
  
  If Siigo/Alegra connected: DIAN transmission will happen through your
  accounting software. MarkOS will still track CUFE and compliance status.

Step 5 of 6: Test invoice
  Send a test invoice to DIAN's habilitación environment
  to verify your configuration before going live.
  [ Send test invoice → ]
  
  Test result: ✓ DIAN accepted / ✗ Error: [error details]

Step 6 of 6: Go live
  ⚠ Once enabled in production, every invoice for Colombian customers
    will be submitted to DIAN electronically. This is a legal requirement.
  
  I confirm I am authorized to issue electronic invoices under NIT [xxx]:
  [ ☐ I confirm — Enable DIAN electronic invoicing ]
```

---

## Part 14: Phase Plan

### Milestone 1 — US + Colombia (Months 1–4)

**US:**
- [ ] Stripe Billing + Webhooks
- [ ] Subscription lifecycle (create, upgrade, downgrade, cancel)
- [ ] Invoice generation (US-compliant format)
- [ ] Stripe Tax for automated US sales tax
- [ ] QuickBooks Online integration (invoice + payment sync)
- [ ] Subscription management UI
- [ ] Revenue waterfall (MRR/ARR/NRR)
- [ ] Health score v1 (usage + billing dimensions)
- [ ] Dunning workflow (payment failure)

**Colombia:**
- [ ] Mercado Pago Checkout Bricks (card + PSE + Efecty)
- [ ] Mercado Pago Preapproval (recurring billing in COP)
- [ ] DIAN Facturación Electrónica — XML generation + transmission
- [ ] DIAN habilitación and production environments
- [ ] IVA calculation (19%)
- [ ] Retención en la fuente tracking (display on invoice)
- [ ] Siigo integration (invoice sync + DIAN via Siigo)
- [ ] Alegra integration (invoice sync + DIAN via Alegra)
- [ ] DIAN setup wizard (onboarding)
- [ ] Colombian invoice PDF with CUFE + QR code

**Both:**
- [ ] SaaS Suite activation on `business_type = saas`
- [ ] Basic support ticket module
- [ ] Churn risk score (first version)
- [ ] SaaS Suite Overview dashboard
- [ ] SAS-01, SAS-02, SAS-03 agents (lifecycle, revenue, billing compliance)

### Milestone 2 — Spanish-speaking LATAM expansion (Months 5–9)

Priority markets after Colombia, using Mercado Pago's existing coverage:
- **México**: CFDI (Comprobante Fiscal Digital por Internet) electronic invoicing via SAT
- **Argentina**: AFIP electronic invoicing; ARS currency (inflation-aware pricing needed)
- **Chile**: SII electronic invoicing; CLP currency
- **Perú**: SUNAT electronic invoicing; PEN currency

Each market requires:
- Local electronic invoicing XML format + transmission
- Tax calculation specific to country
- Local accounting integration or manual export
- Local payment methods (OXXO/México, Rappi Pay, etc.)

Mercado Pago coverage: AR, BR, CL, CO, MX, PE, UY — all covered with single integration.
Legal billing: each country has its own tax authority and format. Phase 2 adds these incrementally.

### Milestone 3 — English-speaking markets (Months 10–18)

**UK**: VAT compliance, Making Tax Digital (MTD) requirements, Xero/Sage integration
**Canada**: GST/HST/PST, CRA compliance, Quickbooks Canada
**Australia**: GST, ATO compliance, Xero Australia
**European Union**: VAT OSS (One Stop Shop) for B2C cross-border, Stripe Tax covers most

**Accounting integrations for global expansion:**
- Xero (UK, AU, NZ, CA primary)
- Sage (UK, EU secondary)
- FreshBooks (CA, US alternative)
- Holded (Spain, EU alternative)
- ContaFácil / Conta Azul (Brazil)

### What never changes between markets

Regardless of country, these components are universal:
- Subscription schema and lifecycle engine
- Health score model (usage + billing + support + engagement + relationship)
- Churn intelligence and intervention playbooks
- Revenue waterfall and metrics (MRR, ARR, NRR, GRR)
- Support module and AI ticket analysis
- Pricing Engine (SaaS module)
- All SaaS agents (SAS-01 through SAS-06)
- API and MCP surfaces

What changes per country:
- Legal invoice format and XML schema
- Tax calculation rules (rate + which taxes apply)
- Tax authority transmission (DIAN, SAT, AFIP, SII, etc.)
- Payment processor (Stripe for US/global, MP for LATAM)
- Accounting integration (QBO for US, Siigo/Alegra for CO, Xero for UK/AU, etc.)
- Currency handling and exchange rate considerations
