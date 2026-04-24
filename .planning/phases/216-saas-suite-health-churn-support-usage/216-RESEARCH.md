# Phase 216 Research - SaaS Health, Churn, Support, and Product Usage Intelligence

## Primary research question

What is the smallest explainable SaaS health, churn, support, and product usage intelligence layer that creates useful operator tasks without unsafe automation?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Health score | Are the default weights from the intake sufficient for v1? | Health-score model |
| Product usage | Which product events indicate activation, adoption, depth, stickiness, expansion, PQL readiness, upgrade triggers, and community/advocacy potential? | Event taxonomy |
| Product analytics | Should PostHog, Segment, generic event ingest, or manual import be first? | Connector decision |
| Support | Which support systems should be first: Intercom, Zendesk, HelpScout, HubSpot, or generic import? | Support connector decision |
| KB grounding | What evidence must support suggested replies? | Response grounding contract |
| Churn playbooks | Which interventions are safe as tasks only versus approval-gated customer actions? | Playbook matrix |
| Doc 17 growth handoff | Which health/support/usage facts must be available later for PLG, ABM, expansion, advocacy, community, and experimentation modules? | Growth handoff map |
| Privacy | Which support/product fields are sensitive and require retention limits? | Data classification |

## Sources to inspect

- Current CRM task/activity/reporting implementation.
- Product analytics connectors or telemetry code.
- Support connector candidates and official API docs.
- Existing evidence/approval/task patterns.
- `obsidian/literacy/Marketing Literacy/12 Product-Led Growth` if present.
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`

## Required research output

- Current-code support.
- Connector recommendation.
- Health-score and ticket schema.
- Approval and privacy controls.
- Phase 217 revenue/agent implications.
- Acceptance tests implied.

## Codebase Research Addendum - 2026-04-23

### Current-code support

- CRM execution already computes stalled work, success risk, overdue tasks, inbound signals, ownership gaps, and recommendations.
- CRM reporting produces readiness, pipeline health, productivity, SLA risk, and executive summary data.
- Outbound and CRM conversation primitives can support intervention tasks.
- Evidence and approval patterns exist for grounded CRM copilot actions.

### Gaps

- No product usage event ingest exists for activation, adoption, depth, stickiness, PQL readiness, upgrade triggers, advocacy, or expansion.
- No support ticket model or support connector exists.
- No explainable SaaS health score exists.
- No churn intervention playbook or approval-gated save-offer flow exists.
- No privacy/retention model exists for support text and product usage data.

### Recommendation

Start with generic product-event ingest plus generic support-ticket import before provider-specific richness. Health score should be explainable and evidence-linked. Customer-facing save/support actions should be tasks or approval-gated actions, not autonomous sends.

### Tests implied

- Product event taxonomy validation tests.
- Support ticket grounding and redaction tests.
- Health score explainability tests.
- Churn task creation tests.
- Approval tests for save offers, support replies, and customer outreach.
