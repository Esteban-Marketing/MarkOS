# Requirements: MarkOS v4.0.0 SaaS Readiness + v2 Operating Loop Compliance

**Defined:** 2026-04-22
**Status:** Active planning requirements after v2 blueprint, Pricing Engine, SaaS Suite, and SaaS Marketing OS Strategy intake.
**Core Value:** MarkOS must become an AI-native, evidence-backed, human-approved Marketing Operating System that can run a complete marketing loop and learn from outcomes.

## Canonical Inputs

- `obsidian/brain/Marketing Operating System Foundation.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-codebase-v2-compliance-audit.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/V4.0.0-PHASE-200-FORWARD-INCOMING-DISCUSSION-REVIEW.md`
- `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`
- `.planning/V4.0.0-INCOMING-VAULT-GSD-COVERAGE-AUDIT.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`

## Active Requirements

### SaaS Readiness

- [ ] **API-01**: Public OpenAPI, generated SDKs, and API contracts remain current.
- [x] **API-02**: Tenancy, RLS, auth, audit, domains, membership, and lifecycle controls remain production-safe.
- [ ] **SDK-01**: SDK generation and CI stay compatible with generated contracts.
- [ ] **MCP-01**: MCP server, sessions, tools, OAuth, cost/budget controls, and marketplace readiness remain tenant-safe.
- [ ] **WHK-01**: Webhook subscription engine remains durable, observable, replay-safe, rate-limited, and tenant-admin visible.
- [ ] **CLI-01**: `markos` CLI GA supports init, generate, plan, run, eval, login, keys, whoami, env, status, and doctor.
- [ ] **BILL-01**: Billing usage, ledger, invoice, and entitlement surfaces reconcile usage with evidence.
- [ ] **BILL-02**: Billing copy and pricing surfaces consume Pricing Engine-owned values or placeholders.
- [ ] **COMP-01**: SOC2 Type I foundation covers the real v2 agentic, pricing, connector, evidence, and learning risk profile.
- [ ] **QA-01..15**: The Phase 200 Quality Baseline gates apply to all active and reserved phases and are operationalized for phases 204-228 by `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` plus `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`.

### AgentRun and Orchestration

- [ ] **RUN-01**: Every agent invocation is a persistent AgentRun.
- [ ] **RUN-02**: AgentRun records include trigger, priority, state, input, output, model, tokens, estimated cost, actual cost, retries, errors, and policy metadata.
- [ ] **RUN-03**: Agent chains are DAGs with dependency, cancellation, pause, retry, timeout, and tenant concurrency controls.
- [ ] **RUN-04**: Priority tiers P0-P4 exist with starvation protection and emergency behavior.
- [ ] **RUN-05**: Failures create visible tasks and DLQ/recovery evidence.
- [ ] **RUN-06**: External side effects are idempotent and approval-aware.
- [ ] **RUN-07**: CLI, UI, and MCP surfaces consume the same run/event substrate.
- [ ] **RUN-08**: Run events are support-visible enough for replay, debugging, and SOC2 evidence.

### Human Task and Approval System

- [ ] **TASK-01**: Every agent output, escalation, approval, connector failure, and follow-up becomes a unified task or approval.
- [ ] **TASK-02**: Morning Brief shows urgent approvals, run failures, connector issues, top opportunities, budget risk, and wins.
- [ ] **TASK-03**: Task Board groups work by priority, campaign, source agent, status, owner, due date, and evidence.
- [ ] **TASK-04**: Approval Inbox shows preview, evidence, brand score, compliance, cost, approve/edit/reject, and rejection reason.
- [ ] **TASK-05**: Mobile is reactive: approvals, brief, inbox, notifications, social inbox, and quick tasks.

### Evidence, Research, and Claim Safety

- [ ] **EVD-01**: EvidenceMap links factual claims to citations, source quality score, freshness, confidence, TTL, and known gaps.
- [ ] **EVD-02**: Unsupported customer-facing claims block external dispatch or are clearly labeled as inference.
- [ ] **EVD-03**: Research tiers and source quality policies are recorded on research context.
- [ ] **EVD-04**: Agents reuse non-stale research context before starting new research.
- [ ] **EVD-05**: Approval UI exposes evidence, assumptions, and claim risk.
- [ ] **EVD-06**: Pricing and competitor intelligence uses source quality, extraction method, timestamp, and compliance posture.

### Connector Intelligence

- [ ] **CONN-01**: ConnectorInstall records store auth type, scopes, encrypted credentials, status, sync cadence, retention, and recovery state.
- [ ] **CONN-02**: Onboarding recommends no more than 3 initial connectors with value-unlock copy.
- [ ] **CONN-03**: First connector can be live in under 10 minutes and produce a wow moment within 30 minutes.
- [ ] **CONN-04**: Connector failures pause dependent agents, create recovery tasks, and support backfill.
- [ ] **CONN-05**: Connector data feeds audits, briefs, tasks, narratives, or learning instead of passive dashboards.
- [ ] **CONN-06**: Nango/direct adapter decisions are documented with official API and scope evidence.

### Content, Social, and Revenue Loop

- [ ] **LOOP-01**: MarkOS proves `onboard -> connect -> audit -> plan -> brief -> draft -> audit -> approve -> dispatch -> measure -> learn`.
- [ ] **LOOP-02**: Briefs include audience, pain tag, SEO/GEO intelligence, proof requirements, brand constraints, pricing context, and performance targets.
- [ ] **LOOP-03**: Drafts are channel-native and audited for voice, claims, research, legal/compliance, channel fit, and pricing.
- [ ] **LOOP-04**: Dispatch only happens after approval or documented low-risk autonomy.
- [ ] **LOOP-05**: Social signals are normalized, classified, routed, approval-gated, and tied to revenue signals.
- [ ] **LOOP-06**: Revenue modules connect campaign/content/social activity to CRM or pipeline evidence.
- [ ] **LOOP-07**: Weekly Narrative ties outcomes to pipeline or leading indicators.
- [ ] **LOOP-08**: Measurement updates artifact performance and next-task recommendations.

### Pricing Engine

- [ ] **PRC-01**: MarkOS stores versioned Pricing Knowledge Objects for own, competitor, market, and strategic pricing records.
- [ ] **PRC-02**: Tenant Cost Models support SaaS, eCommerce, and Services, including pricing floor and margin health.
- [ ] **PRC-03**: Competitor pricing watch lists detect meaningful pricing, packaging, free-tier, feature-gate, and value-metric changes.
- [ ] **PRC-04**: PricingRecommendation records include current state, market context, cost context, options, projected impact, risk, confidence, evidence, assumptions, and approval state.
- [ ] **PRC-05**: PriceTest records require explicit approval before activation and include stop conditions, results, and rollback posture.
- [ ] **PRC-06**: PRC agents are defined for SaaS, eCommerce, Services, recommendation synthesis, pricing-page optimization, and competitive price watching.
- [ ] **PRC-07**: Pricing API and MCP surfaces expose competitive matrix, pricing position, competitor pricing, pricing floor, alerts, and recommendations.
- [ ] **PRC-08**: Operator UI includes dashboard, competitor matrix, cost model wizard, recommendation cards, price tests, watch list, and alerts.
- [ ] **PRC-09**: Billing and public pricing copy consume approved PricingRecommendation records or use `{{MARKOS_PRICING_ENGINE_PENDING}}`; hard-coded MarkOS public prices are not allowed in active doctrine.

### Learning and Literacy

- [ ] **LRN-01**: Every dispatched artifact writes an expected performance envelope before outcomes arrive.
- [ ] **LRN-02**: ArtifactPerformanceLog records actual outcomes, attribution evidence, lessons, and next tasks.
- [ ] **LRN-03**: TenantOverlay records refine local execution with confidence, evidence, expiry, and review.
- [ ] **LRN-04**: Cross-tenant learning is anonymized, aggregated, confidence-scored, and free of tenant identifiers or PII.
- [ ] **LRN-05**: LiteracyUpdateCandidate records require admin review before central literacy promotion.

### Tenant 0

- [ ] **T0-01**: MarkOS uses MarkOS to run its own marketing loop with real data.
- [ ] **T0-02**: Tenant 0 has brand pack, connector list, approval rules, performance narrative, and evidence policy.
- [ ] **T0-03**: Tenant 0 pricing uses Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [ ] **T0-04**: Public Tenant 0 proof is sourced, approved, and privacy-safe.
- [ ] **T0-05**: Final vault/codebase compliance validation maps every active requirement to implementation and GSD verification artifacts.

### SaaS Suite

- [ ] **SAS-01**: SaaS Suite activates only for tenants with `business_type = saas` and explicit operator module configuration.
- [ ] **SAS-02**: `SaaSSuiteActivation` stores SaaS profile, enabled modules, countries, processors, accounting systems, legal billing, autonomy posture, and health-score configuration.
- [ ] **SAS-03**: SaaS plans and subscriptions support trials, active, past_due, pause, upgrade, downgrade, cancellation, reactivation, plan history, value metrics, and lifecycle events.
- [ ] **SAS-04**: SaaS plan prices, packages, discounts, value metrics, and save offers consume Pricing Engine-approved recommendations or use `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [ ] **SAS-05**: SaaS Billing Engine supports invoices, payment attempts, failed-payment recovery, refunds, credits, dunning, processor routing, accounting sync, and approval-gated corrections.
- [ ] **SAS-06**: Launch-country compliance covers US Stripe/Tax/QuickBooks and Colombia Mercado Pago/DIAN/Siigo/Alegra, including DIAN rejection P1 tasks.
- [ ] **SAS-07**: SaaS health scoring uses product usage, support, billing, engagement, and relationship dimensions with confidence, trend, and intervention tasks.
- [ ] **SAS-08**: SaaS support intelligence ingests tickets, classifies risk/topic/SLA/sentiment, grounds suggested responses in knowledge, and requires CS approval before customer-facing replies unless safe auto-response is configured.
- [ ] **SAS-09**: SaaS product usage and revenue intelligence expose MRR, ARR, NRR, GRR, churn, expansion, cohorts, forecast, product adoption, and PLG signals as tasks, alerts, or decisions.
- [ ] **SAS-10**: SAS agents, `/v1/saas/*` APIs, `markos-saas` MCP tools, and SaaS UI navigation are tenant-scoped, activation-gated, auditable, cost-visible, and contract-ID fresh.

### SaaS Marketing OS Strategy - Future/Post-SaaS Suite

- [ ] **SG-01**: SaaS tenants eventually have a growth-mode profile (`b2b`, `b2c`, `plg_b2b`, `plg_b2c`, or `b2b2c`) that drives active modules, metrics, agents, UI, approvals, and playbooks.
- [ ] **SG-02**: PLG capability covers activation definitions, milestone funnels, PQL scoring, upgrade triggers, product usage interventions, and in-app conversion prompts.
- [ ] **SG-03**: B2B SaaS growth covers account expansion, customer marketing, advocacy, ABM account intelligence, buying committee mapping, and account-personalized content.
- [ ] **SG-04**: B2C and PLG growth covers viral loop metrics, referral programs, incentive quality controls, fraud prevention, and habit/retention loops.
- [ ] **SG-05**: In-app marketing supports event/page/segment/time triggers, frequency caps, suppression logic, customer-experience approvals, and coordination with email, support, and CS.
- [ ] **SG-06**: Community, event, PR, analyst, review, partnership, affiliate, and developer marketing motions are modeled as governed workflows, not ad hoc campaigns.
- [ ] **SG-07**: Growth experimentation uses an experiment registry, ICE-ranked backlog, guardrails, approval gates, decision records, and learning promotion.
- [ ] **SG-08**: Revenue alignment defines shared MQL/SQL/PQL criteria, SLAs, feedback loops, win/loss inputs, pipeline targets, and marketing-sales-CS reporting truth.
- [ ] **SG-09**: Growth modules create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec.
- [ ] **SG-10**: Target growth agent tiers (`PLG`, `EXP`, `ABM`, `VRL`, `IAM`, `CMT`, `EVT`, `XP`, `PR`, `PRT`, `DEV`, `REV`) are not active implementation truth until GSD assigns contracts, costs, approval posture, tests, API/MCP/UI surfaces, and failure behavior.
- [ ] **SG-11**: Pricing-sensitive growth prompts, referral rewards, affiliate commissions, discounts, save offers, pricing copy, G2/Capterra pricing sync, and upgrade nudges consume Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [ ] **SG-12**: External customer, partner, press, analyst, event, support, pricing, discount, referral, affiliate, in-app, and review mutations require approval by default unless an explicit earned-autonomy policy exists.

### Commercial Engines and Commercial OS Integration - Future/Post-v4.1.0

- [ ] **CDP-01**: MarkOS has a first-party identity graph that unifies profile, event, consent, and source facts across web, product, billing, email, messaging, support, community, and partner inputs.
- [ ] **CDP-02**: Identity resolution supports explainable merge, split, precedence, and provenance rules; operators can understand why a profile or audience state exists.
- [ ] **CDP-03**: Audiences and segments are governed data products, not ad hoc query fragments; every activation uses time-aware audience snapshots and suppression-safe consent state.
- [ ] **CDP-04**: CDP events and traits flow into CRM, analytics, launches, channel execution, ecosystem, and learning instead of becoming a passive warehouse.
- [ ] **CDP-05**: Privacy, retention, consent, unsubscribe, quiet hours, jurisdiction, and deletion/export obligations are enforced consistently across all downstream engines.

- [ ] **CRM-01**: MarkOS provides a timeline-first CRM where account, person, opportunity, lifecycle, and relationship memory are first-class commercial objects.
- [ ] **CRM-02**: Customer 360 records remain actionable with fit, intent, engagement, product, revenue, and risk signals plus explicit next-best action.
- [ ] **CRM-03**: Marketing, sales, success, support, billing, and leadership operate on shared commercial memory instead of disconnected notes or duplicate truth stores.
- [ ] **CRM-04**: Opportunity, renewal, expansion, and risk workflows create tasks, approvals, or decisions; passive CRM records do not satisfy the requirement.
- [ ] **CRM-05**: CRM-generated outreach, promises, pricing statements, and competitive claims remain approval-aware and evidence-linked.

- [ ] **EML-01**: The native email engine supports transactional, broadcast, lifecycle, triggered, and behavioral sends with tenant-safe templates, schedules, and suppression rules.
- [ ] **EML-02**: Domain identity, deliverability, warmup, bounce handling, unsubscribe, frequency control, and reputation surfaces are visible and operator-governed.
- [ ] **EML-03**: Email content, personalization, experiments, and sequencing remain approval-aware, pricing-safe, and evidence-aware before customer-facing send.
- [ ] **EML-04**: Send, delivery, open, click, reply, bounce, complaint, and unsubscribe events feed CDP, CRM, analytics, and learning.
- [ ] **EML-05**: The email engine shares contracts with AgentRun, tasks, approvals, evidence, analytics, and Pricing Engine; no shadow send path is allowed.

- [ ] **MSG-01**: MarkOS supports WhatsApp, SMS, and push through a governed messaging substrate with provider abstraction, opt-in state, template approval, and delivery tracking.
- [ ] **MSG-02**: Messaging obeys consent, suppression, quiet hours, locale, fallback, fraud/risk controls, and channel-specific policy constraints.
- [ ] **MSG-03**: Messaging conversations and delivery events write back to CRM timeline, CDP profile state, analytics, and learning.
- [ ] **MSG-04**: Outbound messaging mutations remain approval-gated by default unless a narrowly earned autonomy policy exists.
- [ ] **MSG-05**: Messaging orchestration does not bypass shared audience, evidence, pricing, or compliance controls.

- [ ] **CNV-01**: MarkOS provides native conversion surfaces for landing pages, forms, CTAs, experiments, and offer-routing workflows.
- [ ] **CNV-02**: Every conversion event writes identity, consent, CRM, task, evidence, and attribution records instead of stopping at a form submission.
- [ ] **CNV-03**: Public conversion copy, offers, and pricing references consume Pricing Engine-approved values or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [ ] **CNV-04**: Conversion surfaces are approval-aware, accessible, testable, observable, and contract-backed.
- [ ] **CNV-05**: Conversion surfaces support embedded experimentation and launch coordination without creating parallel systems of record.

- [ ] **LCH-01**: Launches are governed multi-channel programs with readiness criteria, owners, calendars, dependencies, approval gates, and rollback posture.
- [ ] **LCH-02**: Launch orchestration coordinates content, conversion, email, messaging, community, partner, PR, and social motions from one program object model.
- [ ] **LCH-03**: Launch plans store audience, assets, proof requirements, pricing posture, channel mix, contingencies, and success metrics.
- [ ] **LCH-04**: Launch performance, incidents, and postmortems feed analytics, learning, and future planning.
- [ ] **LCH-05**: No external launch mutation is allowed without evidence, approval, and audit support.

- [ ] **ANL-01**: MarkOS exposes a semantic analytics layer for attribution, funnel, journey, revenue, retention, ecosystem, and launch metrics with clear source precedence.
- [ ] **ANL-02**: Every metric is explainable, drillable, and freshness-aware; analytics cannot rely on opaque numbers with no provenance.
- [ ] **ANL-03**: Dashboards produce tasks, alerts, narratives, and decisions; passive reporting does not satisfy the requirement.
- [ ] **ANL-04**: Attribution spans content, social, CRM, email, messaging, launches, partner, community, and revenue outcomes.
- [ ] **ANL-05**: Analytics definitions, windows, and models are versioned, tenant-aware, and compatible with agent-driven narrative generation.

- [ ] **SEN-01**: MarkOS supports sales enablement through battlecards, proof packs, objection intelligence, proposal support, and deal-execution playbooks.
- [ ] **SEN-02**: Sales materials pull from CRM, CDP, analytics, evidence, and Pricing Engine instead of disconnected slideware or stale notes.
- [ ] **SEN-03**: Proof, case studies, competitor claims, ROI language, and pricing language remain freshness-aware, evidence-linked, and approval-gated.
- [ ] **SEN-04**: Win/loss, objection, and proposal outcomes feed analytics, learning, and future commercial recommendations.
- [ ] **SEN-05**: Sales enablement is integrated with opportunity tasks, approval flows, and commercial memory.

- [ ] **ECO-01**: MarkOS supports ecosystem distribution across listings, partners, affiliates, referrals, community, and developer growth as governed operational systems.
- [ ] **ECO-02**: Partner, affiliate, and referral motions are measurable, fraud-aware, payout-safe, and approval-gated.
- [ ] **ECO-03**: Community and developer signals feed CRM, analytics, launches, product intelligence, and learning.
- [ ] **ECO-04**: Marketplace listings, certifications, and partner quality are governed by explicit trust workflows and state transitions.
- [ ] **ECO-05**: Ecosystem motions consume shared attribution, pricing, and evidence truth; no isolated growth ledger is allowed.

- [ ] **COM-01**: CDP, CRM, email, messaging, conversion, launch, analytics, sales enablement, and ecosystem engines share AgentRun, task, approval, evidence, pricing, and audit substrates.
- [ ] **COM-02**: Every commercial engine phase defines UI, API, MCP, and data-contract posture; single-surface implementations are incomplete.
- [ ] **COM-03**: Provider adapters are replaceable; no phase may assume one irreversible ESP, SMS, analytics, CRM-import, or partner-platform choice.
- [ ] **COM-04**: Import, export, migration, archival, and recovery posture must exist so the commercial stack does not create designed obsolescence.
- [ ] **COM-05**: Cross-phase testing uses `Vitest` for business logic and contracts, `Playwright` for route/workflow proof, and `Chromatic` for visual regression where UI surfaces are introduced.
- [ ] **COM-06**: Future-ready quality means versioned schemas, explainable decisions, human overrides, evidence freshness, cost visibility, and no external mutation path outside governed contracts.

## Traceability

| Requirement family | Primary phase |
|---|---|
| API-01, SDK-01, MCP-01, WHK-01 | Phases 200, 202, 203 |
| API-02 | Phase 201 |
| CLI-01 | Phase 204 |
| PRC-01..09, BILL-02 | Phase 205 |
| COMP-01 | Phase 206 |
| RUN-01..08 | Phase 207 |
| TASK-01..05 | Phase 208 |
| EVD-01..06 | Phase 209 |
| CONN-01..06 | Phase 210 |
| LOOP-01..08 | Phase 211 |
| LRN-01..05 | Phase 212 |
| T0-01..05 | Phase 213 |
| SAS-01..03 | Phase 214 |
| SAS-04..06 | Phase 215 |
| SAS-07..09 | Phase 216 |
| SAS-10 | Phase 217 |
| SG-01, SG-02, SG-05, SG-07 | Phase 218 |
| SG-03, SG-08 | Phase 219 |
| SG-04, SG-06 | Phase 220 |
| SG-09..12 | Phases 218-220 |
| CDP-01..05 | Phase 221 |
| CRM-01..05 | Phase 222 |
| EML-01..05, MSG-01..05 | Phase 223 |
| CNV-01..05, LCH-01..05 | Phase 224 |
| ANL-01..05 | Phase 225 |
| SEN-01..05 | Phase 226 |
| ECO-01..05 | Phase 227 |
| COM-01..06 | Phase 228 |

## Historical Carry-Forward

The v3.9.0 Vertical Plugin Literacy Library requirements remain historical context and still inform onboarding and literacy work, but active execution now follows the v4.0.0/v2 requirement families above. Do not reopen v3.9.0 as the current milestone unless the GSD state is explicitly changed.

---

*Last updated: 2026-04-23 after incoming 18-26 commercial-engine routing, SaaS Growth Strategy phase routing, and the cross-phase testing doctrine refresh.*
