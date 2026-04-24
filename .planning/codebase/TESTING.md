# Testing

## Test Stack

Current implemented stack:

- Node built-in test runner (`node --test`)
- Storybook-backed UI review flows
- Chromatic publishing through Storybook
- Contract/openapi/documentation drift tests inside `test/`

Planned target stack for phases 204-220:

- `Vitest` for new deterministic unit, contract, reducer, and integration logic
- `Playwright` for browser workflow proof
- `Chromatic` for visual regression and state coverage
- legacy `node --test` suites retained during migration where they already protect mature domains

## Current Suite Shape

The repository now has broad verification coverage across these families:

- core/runtime/CLI/onboarding: `test/*.test.js`
- auth and tenancy: `test/auth/`, `test/tenancy/`, `test/tenant-auth/`
- billing and governance: `test/billing/`, `test/governance/`, `test/ui-billing/`, `test/ui-governance/`
- CRM: `test/crm-*`
- MCP: `test/mcp/` and `test/mcp/tools/`
- webhooks: `test/webhooks/`
- tracking: `test/tracking/`
- SDK and OpenAPI: `test/sdk/`, `test/openapi/`, `test/api-contracts/`
- UI and security: `test/ui-a11y/`, `test/ui-security/`, `test/ui-operations/`
- protocol/GSD/docs drift: `test/gsd/`, `test/docs/`, `test/protocol.test.js`
- historical phase regression suites: `test/phase-*`

## Strengths

- Implemented domains tend to ship with contracts, migrations, and tests together.
- Webhooks, MCP, tenancy, billing, CRM, and governance have meaningful regression depth.
- Documentation and OpenAPI freshness are already enforced in several places.

## Current Blind Spots

- No implemented acceptance suite yet for Pricing Engine doctrine
- No implemented acceptance suite yet for SaaS Suite doctrine
- No integrated end-to-end test for the full v2 loop (`onboard -> connect -> audit -> plan -> brief -> draft -> audit -> approve -> dispatch -> measure -> learn`)
- No task/approval-system acceptance tests for the future Phase 208 operating model
- No Tenant 0 proof or growth-mode acceptance suites yet

## Active planning doctrine

The canonical planning artifacts for the next testing step are:

- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`

Those files define how future execution should translate the current repo into a `Vitest` + `Playwright` + `Chromatic` testing program without discarding the existing node-test regression base.

## Refresh Trigger

Update this file when a new test family appears, when a major domain changes owners, or when new acceptance layers are added for post-203 work.
