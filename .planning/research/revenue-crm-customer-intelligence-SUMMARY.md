# Research Summary: Revenue CRM and Customer Intelligence

**Domain:** Revenue CRM + customer intelligence workspace
**Researched:** 2026-04-14
**Overall confidence:** HIGH

## Executive Summary

For a 2026 revenue CRM, the market now treats core CRM objects, pipeline visibility, unified activity history, and workflow automation as table stakes rather than premium features. Salesforce, HubSpot, and Pipedrive all position contacts, accounts or companies, deals or opportunities, tasks, activity capture, pipeline views, and reporting as baseline operational requirements.

Identity stitching is also no longer optional for a customer-intelligence product. Modern systems are expected to attach anonymous behavior to known contacts and companies, preserve pre-conversion history, and keep merge lineage visible. Twilio Segment explicitly treats identity graphs, anonymous stitching, B2B account relationships, and merge protection as core product behavior.

For MarkOS, the opportunity is not to out-Salesforce Salesforce on breadth. The opportunity is to make the CRM truly operational and intelligence-native: behavioral data, outbound execution, and AI recommendations should be grounded in one auditable customer record and tuned by MarkOS strategy context.

## Expected Product Behavior

1. A rep can open any contact, company, or deal and immediately understand relationship state, recent activity, open work, and the most likely next step.
2. Anonymous website and campaign behavior attaches to the right person or account once identity becomes known, with confidence and lineage preserved.
3. Pipeline movement updates tasks, reminders, and reporting automatically instead of relying on spreadsheet-style manual follow-up.
4. Sales and success teams can trigger email, SMS, or WhatsApp outreach directly from the CRM and see delivery or reply outcomes on the same timeline.
5. AI helps prepare, summarize, draft, prioritize, and flag risk, but externally visible actions stay approval-aware and auditable.

## Roadmap Implications

Suggested v1 build order:

1. **CRM truth layer** — contacts, companies, deals, tasks, activities, notes, ownership, dedupe, merge history.
2. **Identity and timeline layer** — event ingestion, anonymous-to-known stitching, attribution-safe timelines.
3. **Pipeline workspace** — Kanban, table, record detail, timeline, calendar, forecast, filters.
4. **Execution layer** — sales-success workflows, sequences, outbound send plus delivery telemetry.
5. **AI copilot layer** — summaries, next-best action, drafting, risk scoring, approval-gated automations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core CRM features | HIGH | Strong agreement across Salesforce, HubSpot, Pipedrive, and existing MarkOS roadmap docs |
| Identity stitching | HIGH | Twilio Segment and MarkOS requirements align tightly |
| AI-assisted operations | MEDIUM-HIGH | Strong 2025-2026 vendor movement; lightweight copilot is now expected, full autonomy is still differentiating |

## Sources

- Salesforce Sales Cloud and Sales AI pages
- HubSpot CRM developer docs on objects, associations, properties, search, and pipelines
- Twilio Segment Identity Resolution docs
- Pipedrive pipeline management and AI CRM product pages
- Existing MarkOS v3.3 roadmap and requirements