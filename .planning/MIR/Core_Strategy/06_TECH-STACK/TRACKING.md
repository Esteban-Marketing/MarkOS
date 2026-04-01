# TRACKING — MarkOS by esteban.marketing

## ANALYTICS STACK
- Primary analytics: PostHog (live)
  - Property ID: PH-001 (<!-- Estimated: adjust after first 30 days of live data -->)
  - Events tracking status: Configured and live for install, onboarding, and activation events
- Product analytics: PostHog (see TECH-ANALYTICS-PostHog.md)
- Attribution: UTM-based manual (to be automated in Q3 2026)
- CRM: Supabase (native)

## UTM TAXONOMY
### UTM Source values (canonical list — agents must use ONLY these)
linkedin, cold-email, upwork, referral, organic, newsletter, website, demo, paid, partner

### UTM Medium values
social, email, cpc, organic, referral, direct, display, retargeting

### UTM Campaign naming convention
Format: YYYYMM-[audience]-[offer]-[variant]
Example: 202604-agency-owners-free-install-v1

### UTM Content values
Use utm_content to distinguish creative or CTA variants within a campaign. Approved values: hero, testimonial, feature, cta1, cta2, retarget, demo, install, comparison

## KEY EVENTS TO TRACK (PostHog + GA4)
| Event Name                | Trigger Condition                        | Platform | Conversion Value |
|--------------------------|------------------------------------------|----------|-----------------|
| markos_install_start     | User begins npm install                  | PostHog  | Acquisition     |
| markos_install_complete  | bin/install.cjs completes successfully   | PostHog  | Acquisition     |
| markos_onboarding_start  | First time onboarding flow opens         | PostHog  | Activation      |
| markos_onboarding_complete| MIR files written and approved          | PostHog  | Activation      |
| markos_first_draft       | First content draft generated            | PostHog  | Activation      |
| markos_draft_approved    | First draft approved by user             | PostHog  | Activation      |
| markos_linear_ticket_push| First Linear ticket pushed by agent      | PostHog  | Activation      |
| markos_session_return    | User returns after 7+ days inactive      | PostHog  | Retention       |
| markos_paid_plan         | User upgrades to paid plan               | PostHog  | Revenue         |
| markos_referral          | User refers another install              | PostHog  | Referral        |
| markos_churn_flag        | 14+ days inactivity post-activation      | PostHog  | Churn           |
| markos_demo_booked       | Demo booked via website                  | PostHog  | Consideration   |
| markos_blog_visit        | Blog visit from organic search           | GA4      | Awareness       |
| markos_upwork_lead       | Upwork lead generated                   | PostHog  | Acquisition     |

## CONVERSION EVENTS (FUNNEL STAGES)
### Top of funnel (acquisition)
- Event: markos_install_start
- Goal: install CTA click
- Benchmark target: 8% CTR <!-- Estimated: adjust after first 30 days of live data -->

### Middle of funnel (activation)
- Event: markos_onboarding_complete
- Goal: User has at least 1 MIR file populated
- Benchmark target: 60% of installs complete onboarding <!-- Estimated -->

### Bottom of funnel (revenue conversion)
- Event: markos_paid_plan
- Goal: 10% of activated users convert to paid <!-- Estimated -->
- Benchmark target: 10% conversion rate <!-- Estimated -->

## DASHBOARD STRUCTURE (PostHog)
### Insight 1: Install-to-Activation Funnel
- Steps: markos_install_start → markos_install_complete → markos_onboarding_complete → markos_first_draft

### Insight 2: Daily Active Usage
- Metric: markos_session_return event (DAU = unique users triggering this event)

### Insight 3: Feature Adoption
- Track: markos_linear_ticket_push, markos_draft_approved, markos_referral

### Insight 4: Churn Signal
- Early warning: markos_churn_flag event (no activity for 14+ days)

## DATA GOVERNANCE
- PII handling: Only email and install metadata stored; all usage data anonymized
- GDPR compliance status: Configured
- Data retention: 365 days
- Who owns analytics review: Esteban (weekly cadence)
