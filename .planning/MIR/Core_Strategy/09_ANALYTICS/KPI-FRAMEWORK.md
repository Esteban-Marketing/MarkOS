# KPI-FRAMEWORK — MarkOS by esteban.marketing

## NORTH STAR METRIC

**NSM: Activated Users (MIR Complete)**
- Definition: Number of unique installations with all MIR files populated and at least one campaign executed
- Target (90-day): 25 activated users <!-- Estimated: early-stage, pre-revenue -->
- Target (12-month): 150 activated users <!-- Estimated: aggressive but achievable for Agents-aaS -->
- Why this NSM: Activated users are the best predictor of long-term value and revenue for MarkOS, as they have completed onboarding, engaged with the agent, and are likely to generate referrals and paid conversions.

## PIRATE METRICS (AARRR) FOR MARKOS

### Acquisition
- Primary metric: New installs per week
- Source breakdown: 40% organic, 30% outbound, 20% Upwork, 10% paid
- Target week 4: 10 installs
- Target week 12: 40 installs
- Measurement: PostHog markos_install_complete event

### Activation
- Definition of activated: MIR files complete + first draft generated
- Metric: Activation rate (activated / installed)
- Target rate: 60%
- Time-to-activate target: 48 hours from install
- Measurement: markos_onboarding_complete + markos_first_draft events

### Retention
- Definition of retained: Active usage (≥1 agent task/week) at day 30
- Metric: Day-30 retention rate
- Target: 40%
- Measurement: PostHog cohort analysis on weekly active users

### Referral
- Metric: Referral rate (new installs from referred sources / total installs)
- Target: 15%
- Mechanism: Word of mouth via LinkedIn, explicit referral program (planned Q4 2026)

### Revenue
- Metric: MRR (Monthly Recurring Revenue)
- Target month 3: $1,000 <!-- Estimated: first paid conversions -->
- Target month 6: $4,000 <!-- Estimated: ramp-up with agency clients -->
- Target month 12: $12,000 <!-- Estimated: 80 paid installs at $150/mo avg -->
- Conversion rate target (install → paid): 20%

## CHANNEL KPIs

### LinkedIn Organic (Esteban Personal Brand)
- Metric: Post impressions
- Target (monthly): 10,000
- Source: LinkedIn Analytics

- Metric: Profile visits
- Target (monthly): 400
- Source: LinkedIn Analytics

- Metric: Website clicks from LinkedIn
- Target (monthly): 120
- Source: GA4 UTM

- Metric: Install referrals from LinkedIn
- Target (monthly): 10
- Source: PostHog + UTM

### SEO (esteban.marketing blog)
- Metric: Organic sessions
- Target (90d): 1,200
- Source: GA4

- Metric: Keyword rankings (top 10)
- Target (90d): 8
- Source: Semrush/Ahrefs

- Metric: Blog-to-install conversion rate
- Target (90d): 2.5%
- Source: GA4 funnel

### Cold Outbound (Email + LinkedIn DM)
- Metric: Emails sent per week
- Target: 50
- Source: Outreach tool

- Metric: Open rate
- Target: 45%
- Source: Lemlist/Apollo

- Metric: Reply rate
- Target: 8%
- Source: Lemlist/Apollo

- Metric: Demos booked per week
- Target: 2
- Source: Calendar

- Metric: Installs from outbound
- Target: 4 per week
- Source: PostHog + UTM

### Upwork
- Metric: Profile views per week
- Target: 30
- Source: Upwork analytics

- Metric: Proposals sent per week
- Target: 8
- Source: Manual

- Metric: Proposal-to-contract rate
- Target: 20%
- Source: Manual

- Metric: Monthly Upwork revenue
- Target: $1,000
- Source: Upwork

## CAMPAIGN-LEVEL KPI STANDARDS

### Content Campaign (LinkedIn posts)
- Minimum acceptable: 1,000 impressions, 2% engagement rate
- Good: 2,500 impressions, 4% engagement, 30 profile visits
- Great: 5,000+ impressions, 6% engagement, ≥1 inbound DM or install

### Email Campaign (outbound)
- Minimum acceptable: 35% open rate, 5% reply rate
- Good: 45% open, 8% positive reply
- Great: ≥1 demo booked per 50 emails sent

### Paid Ad (LinkedIn — when activated)
- Minimum acceptable: CPI < $60, CTR > 1.5%
- Good: CPI < $40, CTR > 2.5%, activation rate > 50%
- Kill threshold: CPI > $80 after $500 spend — pause and rebuild creative

## REPORTING CADENCE

| Report                  | Frequency         | Owner         | Format                    | Distribution         |
|-------------------------|-------------------|---------------|--------------------------|----------------------|
| Install + Activation    | Weekly (Monday)   | MarkOS Agent  | Supabase query → Linear   | Esteban              |
| Channel performance     | Weekly (Monday)   | MarkOS Agent  | Table in Linear           | Esteban              |
| MRR + Revenue          | Monthly           | Esteban       | Supabase dashboard        | Esteban + team       |
| Full AARRR review      | Monthly           | Esteban       | Linear document           | Esteban              |
| KPI vs target review   | Quarterly         | Esteban       | Linear document           | Full team            |

## ALERT THRESHOLDS (Auto-flag to Esteban)

| Condition                                 | Threshold                | Action                                 |
|-------------------------------------------|--------------------------|----------------------------------------|
| Install-to-activation rate drops           | Below 50% for 7 days     | Linear ticket: "Activation rate alert" |
| Day-30 retention drops                     | Below 30%                | Linear ticket: "Retention alert"       |
| Outbound open rate drops                   | Below 30%                | Linear ticket: "Review email deliverability" |
| Zero installs                             | 7 consecutive days       | Linear ticket: "Acquisition gap — action required" |
| Paid CPL spikes                           | 2× baseline              | Linear ticket: "Pause paid — CPI spike"|
