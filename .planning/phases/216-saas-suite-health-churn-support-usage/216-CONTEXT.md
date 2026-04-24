# Phase 216 Context - SaaS Health, Churn, Support, and Product Usage Intelligence

**Status:** Seeded from the 2026-04-22 SaaS Suite intake.

## Why this phase exists

Phase 216 turns SaaS customer signals into action. It owns explainable health scores, churn risk, support intelligence, product usage analysis, and intervention tasks.

## Canonical inputs

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` SAS-07..09

## Existing implementation substrate to inspect

- CRM activity ledger, tasks, customers, accounts, and reporting snapshots.
- Connector substrate from Phase 210.
- AgentRun events and approval/task patterns.
- Marketing literacy/product-led growth notes.
- Any PostHog, Segment, support, or product analytics integration references.

## Required phase shape

1. Define `SaaSHealthScore` and default scoring dimensions.
2. Define product usage signal ingestion and product-led growth events, including future activation/PQL/upgrade-trigger compatibility.
3. Define `SaaSSupportTicket`, ticket classification, SLA, sentiment, risk, and KB grounding.
4. Define intervention playbooks and owner-visible tasks.
5. Define approval gates for support responses, save offers, discounts, retention outreach, and lifecycle changes.
6. Feed health/churn/support/product signals into revenue intelligence, Pricing Engine, PLG, account expansion, community health, advocacy, and future experimentation.

## Non-negotiables

- No customer-facing support response without CS review unless safe auto-response is explicitly configured.
- No save offer, discount, or retention action without Pricing Engine context and approval.
- No black-box health score. Raw facts, weights, confidence, and trend must be visible.
- No product usage dashboard that does not create tasks, alerts, recommendations, or learning.
- No PQL score, upgrade trigger, community-health signal, advocacy prompt, or expansion intervention becomes externally actionable without future GSD contracts and approval rules.

## Done means

GSD can implement health, churn, support, and product usage intelligence as a decision system rather than passive analytics.
