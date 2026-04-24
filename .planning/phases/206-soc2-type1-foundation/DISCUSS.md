# Phase 206 - SOC 2 Type I Foundation (Discussion)

> v4.0.0 SaaS Readiness milestone. Updated after the 2026-04-22 MarkOS v2, Pricing Engine, SaaS Suite, and SaaS Marketing OS Strategy intake. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-22
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phases 200-205; design must stay compatible with phases 207-217
**Quality baseline applies:** all 15 gates

## Goal

Lay the SOC 2 Type I foundation for the real MarkOS v2 risk profile: AI agents, AgentRun evidence, approval gates, connector credentials, pricing recommendations, price tests, research evidence, tenant learning, billing, webhooks, SaaS Suite legal/support/product/revenue data, future SaaS growth motions, and Tenant 0 public proof.

## Scope (in)

- Auditor engagement and Type I readiness workspace.
- Policy authoring and ratification: access control, AI governance, approval controls, incident response, change management, vendor management, business continuity, data classification, acceptable use, risk assessment, connector privacy, and pricing/change controls.
- Evidence collection automation tied to MarkOS audit logs, AgentRun events, approval decisions, billing usage ledgers, webhook evidence, MCP sessions, connector recovery, and pricing recommendations.
- Pricing Engine control mapping: cost models, PricingRecommendation decisions, PriceTest activation, public pricing page changes, competitor pricing source quality, and discount strategy approvals.
- SaaS Suite control mapping: subscription lifecycle actions, legal invoice issuance/correction, Stripe/Mercado Pago webhooks, QuickBooks/Siigo/Alegra sync, DIAN evidence, support response approval, product usage data, health scores, and revenue metrics.
- SaaS Marketing OS Strategy control mapping: in-app campaigns, PLG upgrade triggers, ABM/customer marketing outreach, referral rewards, affiliate commissions, community programs, event sequences, PR/analyst/review outreach, partnerships, developer marketing, experiments, and revenue-team handoffs.
- Connector control mapping: credentials, scopes, retention, revocation, Nango/direct posture, failure recovery, and backfill evidence.
- Research and claim-safety controls: EvidenceMap, source quality score, claim TTL, inference labeling, and unsupported-claim blocking.
- Learning controls: artifact performance logs, tenant overlays, anonymized cross-tenant learning, and admin-reviewed central literacy promotion.
- First external pen test, incident/BCP/DR readiness, and remediation tracking.

## Scope (out)

- Type II observation window.
- ISO 27001.
- HIPAA.
- Fully automated low-risk autonomy without an approved earned-autonomy control model.

## Threat-model focus

approval bypass, agent misfire, cross-tenant data leakage, connector credential exposure, pricing manipulation, stale or hallucinated evidence, unauthorized public claims, billing/pricing mismatch, SaaS legal invoice error, support-response harm, product-usage privacy leak, social/DM privacy, referral/affiliate payout abuse, in-app campaign harm, event/PR/review outreach without consent or evidence, webhook replay/SSRF risks, learning-loop privacy leak, and Tenant 0 proof without evidence.

## Success criteria

- SOC2 control inventory covers every v2 object introduced in the vault.
- All policies required for the v2 operating loop are ratified and acknowledged.
- Evidence automation covers at least 95% of planned controls.
- Price changes, price tests, public pricing edits, central literacy promotion, external sends/posts/DMs, CRM mutations, and data exports have approval evidence.
- SaaS Suite legal billing, support replies, save offers, refunds/credits/write-offs, discounts, and lifecycle mutations have approval/compliance evidence before Phases 214-217 execute.
- Future in-app campaigns, upgrade prompts, referral/affiliate payouts, ABM/customer-marketing outreach, event sequences, PR/analyst/review outreach, partnerships, developer/community communications, and experiments have a documented control model before post-217 execution.
- Connector credentials and scopes have retention, revocation, and vendor review.
- Pen-test report is clean or remediated.
- Type I readiness package is auditor-ready.

## Plans

- `206-01-PLAN.md` - SOC2 control inventory for v2 objects.
- `206-02-PLAN.md` - AI governance and approval controls.
- `206-03-PLAN.md` - Pricing Engine and billing control mapping.
- `206-04-PLAN.md` - Connector privacy, vendor, and retention review.
- `206-05-PLAN.md` - Automated evidence collection.
- `206-06-PLAN.md` - Incident response, BCP, DR, and pen-test readiness.
- `206-07-PLAN.md` - Auditor workspace and Type I readiness package.

## Pre-locked decisions

- Hosting: SaaS cloud first.
- Integration order: OpenAPI -> SDKs -> MCP -> Webhooks -> Zapier -> Make -> n8n.
- Target ICP: growth-stage B2B marketing leaders first, agencies second.
- Brand stance: AI-first, quietly confident, evidence-backed, operator-grade.
- Connector posture: Nango embedded where it fits; direct adapters require explicit API-depth justification.
- Pricing posture: Pricing Engine owns public pricing; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved recommendations.
- SaaS Suite posture: legal billing, support replies, save offers, discounts, and lifecycle mutations are approval-gated by default.
- SaaS Marketing OS Strategy posture: doc 17 is a post-217 destination map; its growth motions are approval-gated by default until a future GSD translation assigns contracts and controls.
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

- Which auditor/evidence platform is selected: Vanta, Drata, Secureframe, or direct firm?
- Which controls can be evidenced directly from MarkOS tables versus external systems?
- What is the minimal acceptable AI governance policy for early-access enterprise buyers?
- Which connector vendors are subprocessors versus tenant-owned credentials?
- Which SaaS Suite processors, accounting systems, support tools, product analytics tools, and DIAN providers are subprocessors?
- Which future growth systems are subprocessors or regulated communication surfaces: in-app, event, review, PR, affiliate, partner, developer community, and experimentation tools?
- What public Tenant 0 proof is safe before Type I completion?

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- Pricing Engine Canon: `../../../obsidian/brain/Pricing%20Engine%20Canon.md`
- SaaS Suite Canon: `../../../obsidian/brain/SaaS%20Suite%20Canon.md`
- SaaS Marketing OS Strategy Canon: `../../../obsidian/brain/SaaS%20Marketing%20OS%20Strategy%20Canon.md`
- v2 Operating Loop Spec: `../../../obsidian/reference/MarkOS%20v2%20Operating%20Loop%20Spec.md`
- v2 Requirements Matrix: `../../../obsidian/reference/MarkOS%20v2%20Requirements%20Traceability%20Matrix.md`
- Codebase compliance audit: `../../V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- Quality Baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`
