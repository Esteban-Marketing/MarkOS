# Research Notes: Multi-tenant Patterns

## Recommended default

Shared infrastructure with strict isolation controls, plus optional dedicated enterprise deployments.

## Key tradeoffs

- Shared model:
  - Pros: lower cost, faster delivery
  - Cons: stronger need for airtight isolation controls
- Dedicated model:
  - Pros: enterprise trust and residency flexibility
  - Cons: operational overhead

## Practical guidance

1. Use tenant_id + RLS as baseline defense.
2. Enforce tenant context at service boundary.
3. Treat background jobs and agent workers as equal-risk paths.
4. Continuously test cross-tenant denial paths.
