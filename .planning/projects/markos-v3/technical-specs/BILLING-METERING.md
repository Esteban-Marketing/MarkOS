# Technical Spec: Billing and Metering

## Objective

Implement subscription and usage metering that maps platform consumption to accurate tenant billing.

## Billing model

- Subscription tiers: starter, growth, enterprise.
- Billing cycle: monthly or annual.
- Entitlements: seats, projects, agent runs, token budgets, storage limits.

## Metered units

1. LLM tokens (input/output/cached where available)
2. Agent run count
3. Tool execution count (if billable)
4. Storage consumption
5. Optional premium feature units

## Metering pipeline

1. Emit usage events with tenant_id and correlation_id.
2. Validate and deduplicate metering events.
3. Aggregate usage by billing period.
4. Reconcile against subscription entitlements.
5. Generate invoice line items.

## Failure handling

- Metering ingestion failures are retried with idempotency keys.
- Reconciliation mismatches trigger operator alerts and hold flags.
- Billing provider failures trigger dunning flow and entitlement-safe degradation.

## Required outputs

- Usage dashboard per tenant
- Invoice detail with usage breakdown
- Reconciliation status report for operators

## Testing requirements

1. Unit tests for event normalization and pricing logic.
2. Integration tests for billing provider sync.
3. End-to-end tests for subscription creation, usage, invoice, and dunning.
