# Phase 216 Discuss: SaaS Health, Churn, Support, and Product Usage Intelligence

## Goal

Build the intelligence layer that turns SaaS customer signals into health scores, churn alerts, support triage, product usage insights, and operator tasks.

## Source Doctrine

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` SAS-07..09

## Phase Artifacts

- `216-CONTEXT.md` - implementation context for health, churn, support, and product usage intelligence.
- `216-RESEARCH.md` - research agenda for health scoring, product analytics, support connectors, KB grounding, churn playbooks, and privacy.

## Discuss Decisions

| Decision | Options | Recommended default |
|---|---|---|
| Health score | fixed weights, tenant-tunable weights, ML-first | fixed default weights with tenant-tunable config later |
| Product analytics | PostHog first, Segment first, generic event ingest | PostHog or generic product-event ingest, depending on existing connector substrate |
| Support systems | Intercom/Zendesk first, generic ticket import, CRM tasks only | generic ticket object plus first connector decided by research |
| Response autonomy | auto-send, approval-only, tenant opt-in auto-response | approval-only by default; tenant opt-in later |
| Churn interventions | task only, playbook suggestions, automatic offers | playbook suggestions and tasks; no automatic offers |
| Growth handoff | implement PLG/ABM now, ignore, reserve signal map | Reserve signal map for PLG, PQL, expansion, advocacy, community, and experiments |

## Research Needed

- Product event schema needed for activation, adoption, stickiness, account depth, and PLG signals.
- Support ticket fields needed for sentiment, urgency, SLA, topic, account risk, and KB grounding.
- Health score explainability and confidence fields.
- Interaction with CRM customer/account identity and revenue state.
- Approval and evidence requirements for save offers, retention outreach, and support replies.
- Which usage/support/health facts future doc 17 modules need for PQL, upgrade triggers, community health, advocacy, and account expansion.

## Acceptance Gate

- `SaaSHealthScore` and `SaaSSupportTicket` contracts are designed.
- Health score explains raw facts, confidence, trend, and recommended action.
- Support responses require CS approval unless tenant safe auto-response is configured.
- Churn alerts create tasks/playbooks with owners and priorities.
- Product usage data feeds health and revenue intelligence instead of becoming a passive dashboard.
- Product/support signals are future-compatible with doc 17 but do not activate growth modules yet.
