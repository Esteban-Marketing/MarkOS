# Feature Landscape: Revenue CRM and Customer Intelligence

**Domain:** Revenue CRM + customer intelligence
**Researched:** 2026-04-14

## Must-Have v1 Features

### 1. Core revenue objects
- Contacts, companies or accounts, deals or opportunities
- Tasks, notes, activities, owners, custom fields
- Dedupe, merge, relationship associations, immutable history

### 2. Unified customer timeline
- Pageviews, form submits, campaign touches, stage changes
- Outbound sends, delivery events, replies, notes, AI actions
- One record view that reconstructs lifecycle state without tool hopping

### 3. Identity stitching
- Anonymous visitor to known-contact merge
- Email, domain, device, cookie, and external ID support where available
- Confidence scoring, merge protection, lineage trail, account-level linking

### 4. Pipeline workspace
- Custom pipelines and stages
- Kanban, table, record detail, timeline, calendar, and forecast or funnel views
- Search, filters, saved views, reminders, stage automation hooks

### 5. Sales-success workflows
- Lead qualification, deal progression, handoff to onboarding or success
- SLA queues, follow-up tasks, next-best action, risk flags
- Team and personal work queues for reps and CSMs

### 6. Native outbound execution
- Email first; SMS and WhatsApp for higher urgency or response recovery
- Templates, sequences, send logging, consent tracking, opt-out handling
- Delivery and reply telemetry written back to the CRM timeline

### 7. AI-assisted operations baseline
- Record summaries, meeting prep, draft outreach, task suggestions
- Explainable next-best-action recommendations
- Approval-gated updates and sends, with actor and evidence logging

## Likely Differentiators for MarkOS

1. **Strategy-aware CRM**
   - Recommendations and outreach can use MIR and MSP context, not just generic CRM fields.

2. **Behavior + CRM fusion**
   - PostHog-style behavioral data and attribution live inside the operating CRM record, not in a separate analytics silo.

3. **Evidence-backed AI operations**
   - AI suggestions show why they were made, what signals they used, and what changed.

4. **Revenue + success continuity**
   - The same workspace supports prospecting, deal progression, onboarding handoff, retention, and expansion.

5. **Governed agentic execution**
   - MarkOS can let agents draft and recommend aggressively while keeping writes and external sends bounded by policy and approvals.

## Anti-Features / Scope to Defer

- Full social publishing and ad-campaign management
- Enterprise CPQ, contracts, invoicing, billing, and commissions
- Open-ended no-code automation platform sprawl
- Complex custom-object platform breadth beyond core revenue workflows
- Autonomous AI sending or stage mutation without human or policy gate
- Full data-warehouse BI and MMM; keep v1 to operational reporting and attribution
- Heavy call-center functionality and deep conversation intelligence as a first release requirement

## MVP Recommendation

Prioritize:
1. Contact, company, deal, and timeline truth
2. Identity stitching and attribution-safe history
3. Pipeline plus work queues
4. Outbound execution with telemetry return path
5. Approval-aware AI copilot

Defer anything that turns the milestone into a full Salesforce replacement.