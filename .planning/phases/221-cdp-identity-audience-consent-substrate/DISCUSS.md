# Phase 221 - CDP Identity, Audience, and Consent Substrate (Discussion)

**Milestone:** v4.2.0 Commercial Engines 1.0  
**Depends on:** Phases 207, 209, 210, 214-217  
**Quality baseline applies:** all 15 gates

## Goal

Create the first-party customer-data substrate for identity resolution, consent, event normalization, segmentation, and activation-safe audience facts across the whole MarkOS commercial stack.

## Scope

- Identity graph for person, account, product, billing, and channel signals.
- Consent, suppression, jurisdiction, and audience-snapshot semantics.
- Event and trait normalization with provenance and freshness.
- Audience and activation-safe segment objects for downstream engines.
- Shared CDP outputs for CRM, analytics, launches, messaging, and ecosystem flows.

## Non-Goals

- Timeline-first CRM workspaces belong to Phase 222.
- Native email and messaging execution belongs to Phase 223.
- Semantic attribution and narrative intelligence belong to Phase 225.

## Discuss Focus

- Identity merge/split policy and operator explainability.
- Where consent truth lives and how downstream engines consume it.
- Audience snapshot timing, suppression, and activation semantics.
- How much current CRM/billing/product/webhook substrate can be reused.

## Proposed Plan Slices

| Slice | Purpose |
|---|---|
| 221-01 | Identity graph contract, merge/split rules, and provenance model |
| 221-02 | Consent, suppression, deletion, and jurisdiction controls |
| 221-03 | Event and trait normalization plus freshness semantics |
| 221-04 | AudienceDefinition and audience-snapshot activation contracts |
| 221-05 | CDP writeback into CRM, analytics, launches, and ecosystem surfaces |
| 221-06 | Testing, observability, and recovery posture for identity and consent |
