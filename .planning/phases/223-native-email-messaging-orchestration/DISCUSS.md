# Phase 223 - Native Email and Messaging Orchestration (Discussion)

**Milestone:** v4.2.0 Commercial Engines 1.0  
**Depends on:** Phases 205, 207, 208, 209, 210, 221, 222  
**Quality baseline applies:** all 15 gates

## Goal

Add first-party owned-channel execution for email, WhatsApp, SMS, and push with shared consent, approvals, deliverability controls, templates, and commercial memory.

## Scope

- Native email programs for transactional, lifecycle, broadcast, and behavioral sends.
- Messaging programs for WhatsApp, SMS, and push.
- Shared suppression, consent, quiet hours, locale, and approval model.
- Deliverability, bounce, complaint, reply, and reputation posture.
- Channel events flowing back into CRM, CDP, analytics, and learning.

## Non-Goals

- CDP identity and consent substrate belongs to Phase 221.
- CRM timeline and customer memory belong to Phase 222.
- Conversion surfaces and launch orchestration belong to Phase 224.

## Discuss Focus

- Provider strategy and replaceable adapter contracts.
- Campaign vs conversation boundaries.
- Deliverability, opt-in, and fallback rules by channel.
- Approval model for high-risk or pricing-sensitive messaging.

## Proposed Plan Slices

| Slice | Purpose |
|---|---|
| 223-01 | EmailProgram and MessagingProgram contracts |
| 223-02 | Template, personalization, and approval model |
| 223-03 | Deliverability, opt-in, suppression, and fallback controls |
| 223-04 | Provider adapter contracts and event normalization |
| 223-05 | CRM/CDP/analytics writeback and recovery workflows |
| 223-06 | UI/API/MCP surfaces and testing posture for channel execution |
