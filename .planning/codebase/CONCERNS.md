# Concerns

## Assessment Rubric

- `Impact (I)`: 1 to 5
- `Likelihood (L)`: 1 to 5
- `Detectability (D)`: 1 to 5
- `Priority Score`: `I x L x D`

## Current Scored Assessment (2026-04-23)

| Concern | I | L | D | Priority | Evidence Reviewed | Status |
|---|---|---|---|---|---|---|
| Vault doctrine outruns implementation | 5 | 5 | 3 | 75 | `obsidian/brain/*`, `.planning/REQUIREMENTS.md`, `app/`, `api/`, `lib/` | Open |
| Static pricing residue in active code | 5 | 5 | 2 | 50 | `lib/markos/billing/entitlements.ts`, `api/billing/tenant-summary.js`, `app/(markos)/settings/billing/page-shell.tsx` | Open |
| Task/approval UI is not yet canonical system-of-record | 5 | 4 | 3 | 60 | `app/(markos)/operations/tasks/*` | Open |
| AgentRun substrate is fragmented across surfaces | 5 | 4 | 3 | 60 | `onboarding/backend/agents/run-engine.cjs`, CRM copilot/playbook routes, MCP runtime, migrations | Open |
| Codebase map drift | 3 | 4 | 4 | 48 | stale `.planning/codebase/*` before this refresh | Mitigated |
| API/contract/docs drift as new surfaces land | 4 | 4 | 3 | 48 | `api/`, `contracts/`, `docs/`, `sdk/` | Open |
| Integrated v2 acceptance coverage gaps | 5 | 4 | 4 | 80 | broad test coverage exists, but no end-to-end acceptance for phases 204-220 | Open |

## Active Risk Notes

1. Pricing Engine, SaaS Suite, and Growth Strategy are now planning truth, but those objects and APIs do not exist in runtime code yet.
2. The current task UI demonstrates the interaction pattern, not the final operating substrate.
3. Existing AgentRun logic is useful foundation but not yet the unified DAG/priority/retry/cost/event system described in the vault.
4. Contracts and tests are strong for implemented domains, which raises the cost of drift when new doctrine is not routed through the same discipline.

## Mitigations

- Keep `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` as a canonical planning input.
- Route static pricing cleanup through Pricing Engine work rather than ad hoc UI edits.
- Treat Phase 208 as a migration from fixture UI to run/task/evidence-backed operations.
- Keep contract/doc/sdk updates paired with every new API or MCP surface.
- Add phase-level acceptance suites as phases 204-220 begin implementation.

## Open Actions

1. Use the deep audit artifact during the next discuss/research pass for Phases 204-220.
2. Preserve codebase-map freshness as new pricing, SaaS, and growth routes are added.
3. Add integrated acceptance verification for the first end-to-end v2 loop before claiming compliance.
