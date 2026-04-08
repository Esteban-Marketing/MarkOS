---
phase: "58"
name: "CRM Canonical Schema and Identity Graph"
created: "2026-04-04"
---

# Phase 58: CRM Canonical Schema and Identity Graph — Context

## Client Brief

MarkOS v3.3.0 must shift the product from a platform substrate into a CRM-native operating system. The objective of Phase 58 is to define and anchor the canonical CRM data model so every later CRM capability is built on one tenant-safe system of record for contacts, companies, deals, accounts, customers, activities, tasks, custom fields, merge decisions, and unified timelines.

This phase is not a UI polish phase and not a generic hardening pass. It must establish the domain contract that lets MarkOS own relationship state, pipeline progression, and auditable lifecycle evidence while treating PostHog as the behavioral analytics source feeding CRM records rather than the operational ledger itself.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for operator-facing clarity and non-hype language
- Visual: Preserve the existing MarkOS token-based UI system and current control-plane design language; no rebrand or visual reset in this phase
- Prohibited: No parallel shadow CRM schema, no analytics-only pseudo-CRM, no social publishing scope, no bypass of tenant or approval controls

## Audience Segment

- Target ICP: Internal MarkOS operators plus future agency and in-house revenue teams that need one Customer 360 workspace
- Funnel stage: Decision and retention for the product itself; this is a platform capability phase enabling downstream CRM adoption
- Audience size: Whole product surface; all tenants and future plugins must be able to rely on the schema decisions made here

## Budget

- Phase budget: $0 external spend; internal engineering and planning only
- Allocated from: Core platform roadmap capacity under v3.3.0

## Decisions

_Decisions captured during v3.3.0 milestone initialization and Phase 58 discuss-phase_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | CRM records, not analytics events, are the source of truth for relationship state | Behavioral telemetry is valuable evidence but cannot be the canonical ledger for pipeline and operator actions | Schema and API work must center on CRM entities and append-only activity records |
| D-02 | Phase 58 must establish contacts, companies, deals, accounts, customers, activities, tasks, and timelines as first-class primitives | Later phases depend on stable CRM objects and relationships | Prevents UI-first implementation drift and duplicated state stores |
| D-03 | Tenant safety and IAM guarantees from Phases 51 to 57 remain non-negotiable | CRM expansion cannot weaken the existing multi-tenant and approval model | All new tables, APIs, and merge flows must inherit strict tenant and audit enforcement |
| D-04 | Unified timelines must be designed as a first-class CRM construct in Phase 58 | Timeline completeness is core to Customer 360 value and cannot be bolted on later | Activity model and storage contracts must exist before advanced pipeline and AI features |
| D-05 | Identity graph foundations belong in Phase 58 even though tracking implementation follows in Phase 59 | Session stitching, dedupe, and merge rules need a canonical target model first | Phase 59 can focus on ingestion and stitching instead of inventing data semantics |
| D-06 | PostHog remains the behavioral analytics engine, not the invoice-grade or CRM-grade ledger | Existing repo already treats billing and governance ledgers as separate durable systems | Avoids overloading analytics infrastructure with operational truth responsibilities |
| D-07 | Required pipeline types for v3.3.0 include lead qualification, opportunity or deal, account management, and customer success | The milestone is Customer 360, not lead-only CRM | Phase 60 and 61 must support multiple lifecycle workflows from the start |
| D-08 | Required v3.3.0 native outbound channels are Resend email, Twilio SMS, and Twilio WhatsApp only | This keeps the milestone focused while still enabling hybrid-team execution | Social publishing and inbox surfaces stay deferred to v4 |
| D-09 | AI agents may recommend and prepare CRM actions, but externally visible or high-impact actions remain policy-gated | Existing MarkOS agent model is approval-aware and enterprise-oriented | CRM automation must be approval-safe by default |
| D-10 | Custom fields and merge lineage are mandatory in the canonical schema | Real CRM adoption requires flexible object extension and auditable dedupe decisions | Schema design must include extensibility and immutable merge evidence |
| D-11 | Timeline activity must be broad enough to capture pageviews, key element interactions, stage changes, tasks, notes, outbound events, and attribution updates | Operators need one inspection surface for relationship history | Activity taxonomy must be designed with future Phase 59 and 62 ingestion in mind |
| D-12 | This phase should optimize for execution planning readiness, not speculative completeness | The immediate next step is Phase 58 planning | Deliverables should lock contracts, constraints, and decomposition boundaries clearly |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact naming of canonical tables, types, and join entities, as long as the required CRM objects and tenant boundaries remain explicit.
2. Whether accounts and customers are modeled as separate entities or role states over shared organization relationships, provided the resulting contract is unambiguous and auditable.
3. Exact custom-field implementation pattern, provided it supports tenant-safe extensibility and version-safe reads.
4. Exact API decomposition between CRUD endpoints, merge endpoints, and activity-query endpoints, provided lifecycle and audit semantics remain explicit.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Native social publishing and inbox execution surfaces.
2. Full marketing mix modeling or probabilistic attribution engine work.
3. Advanced BI warehouse export layer beyond what is required for CRM-native reporting.
4. New visual design language or broad UI redesign outside the contracts needed to support upcoming CRM phases.
5. Autonomous publishing or outbound actions that bypass approval and policy gates.