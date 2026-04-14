# Domain Pitfalls: Revenue CRM and Customer Intelligence

**Domain:** Revenue CRM + customer intelligence
**Researched:** 2026-04-14

## Critical Pitfalls

### 1. Building a data-entry CRM instead of an operating system
**What goes wrong:** Users see records but not what to do next.
**Prevention:** Every key record should expose timeline context, SLA state, and next recommended action.

### 2. Weak identity resolution
**What goes wrong:** Pre-conversion behavior is lost or attached to the wrong person or company.
**Prevention:** Use confidence scoring, merge protection, immutable lineage, and clear approval semantics for ambiguous cases.

### 3. AI without auditability
**What goes wrong:** Teams stop trusting recommendations or can’t explain risky updates.
**Prevention:** Keep AI grounded in CRM evidence, show rationale, and gate external actions.

## Moderate Pitfalls

### 1. Too many channels too early
Focus on email, SMS, and WhatsApp first; defer broader channel sprawl.

### 2. Over-customization in v1
Support flexible fields and stages, but avoid becoming a full application platform before the core workflows feel excellent.

### 3. Reporting before truth
Do not over-invest in dashboards until timelines, identity stitching, and stage hygiene are trustworthy.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Identity stitching | False merges | Confidence thresholds + lineage review |
| Pipeline views | Pretty UI without operator utility | Build queueing, reminders, and filters with the views |
| Outbound execution | Compliance and opt-out risk | Consent-safe defaults and webhook traceability |
| AI ops | Untrusted automation | Start with copilot and approvals, not full autonomy |