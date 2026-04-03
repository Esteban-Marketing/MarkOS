# ADR-003: SaaS Deployment Topology

Status: Accepted
Date: 2026-04-02
Decision makers: Product and Engineering
Affects: Runtime operations, availability, enterprise onboarding

## Context

MarkOS v3 requires a deployment model that supports both efficient shared SaaS operations and enterprise trust requirements for larger tenants.

## Decision

Adopt a tiered topology:
- Standard tiers: shared multi-tenant production environment with strict isolation controls.
- Enterprise tier: optional dedicated environment with region and compliance options.

Common controls across tiers:
- Infrastructure as code
- Secret management
- Centralized telemetry
- Backup and disaster recovery standards

## Rationale

1. Shared topology optimizes cost and speed for most customers.
2. Dedicated topology enables enterprise procurement and security approvals.
3. Shared operational standards reduce engineering divergence.

## Consequences

Positive:
- Better unit economics for SMB and agency customers.
- Clear upsell path to enterprise deployment guarantees.
- Consistent operational tooling across environments.

Constraints:
- Release strategy must support phased rollout and rollback.
- Environment drift must be monitored and controlled.
- Region and residency claims must be evidence-backed.

## Alternatives considered

Alternative A: Shared-only topology.
- Rejected due to enterprise sales limitations.

Alternative B: Dedicated-only topology.
- Rejected due to prohibitive cost for most tenants.

## Success criteria

1. Shared and dedicated environments run the same product contracts.
2. Incident and recovery runbooks are validated in both tiers.
3. Environment provisioning and migration playbooks are documented and testable.
