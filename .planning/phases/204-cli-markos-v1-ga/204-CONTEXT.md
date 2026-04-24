# Phase 204 Context - CLI `markos` v1 GA

**Gathered:** 2026-04-23  
**Status:** Ready for planning refresh  
**Milestone:** v4.0.0 SaaS Readiness 1.0

## Why this phase exists now

MarkOS already ships a real CLI substrate, but it is install-centric. The v2 vault doctrine now expects an operator CLI that can safely authenticate, inspect status, run work, evaluate work, and diagnose readiness while staying aligned with Pricing Engine, AgentRun, and vault freshness rules.

The deep audit changed the shape of this phase:

- it is no longer "build a CLI from scratch"
- it is "graduate the existing CLI into a coherent GA operator surface without breaking the install/bootstrap path"

## Canonical inputs

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `package.json`
- `bin/install.cjs`
- `bin/cli-runtime.cjs`
- `bin/generate.cjs`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md`

## Existing implementation substrate to preserve

- Published binary mapping: `markos -> bin/install.cjs`
- Existing routed commands in `bin/cli-runtime.cjs`:
  - `update`
  - `db:setup`
  - `llm:config`
  - `llm:status`
  - `llm:providers`
  - `import:legacy`
  - `vault:open`
  - `generate`
- Installer-owned vault bootstrap, profile, preset, Obsidian detection, and onboarding helper logic
- Existing `generate` contract and parser/runtime utilities

## Required phase shape

1. Keep `npx markos` install/bootstrap intact.
2. Introduce operator subcommands as additive command modules and shared CLI primitives.
3. Route auth, whoami, env, status, and run behavior through server-side tenant APIs rather than local ad hoc state.
4. Reserve and document CLI contract families for auth, keys, runs, env, and status.
5. Make `doctor` aware of filesystem/bootstrap/runtime/doctrine freshness checks.
6. Preserve Wave 1 distribution only: npm, Homebrew, Scoop.
7. Add regression protection so existing install/update/vault/generate utilities stay working.

## Codebase-specific constraints

- The current repo already has many CLI-adjacent responsibilities; planning must treat them as legacy obligations, not optional nice-to-haves.
- `status` and `doctor` must not become stale snapshots of doctrine. They should read the same operational truth the rest of the system uses.
- Any CLI run flow should align to Phase 207 durable run/event APIs, not invent its own lifecycle.
- Pricing-sensitive CLI output must use approved pricing context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.

## Non-negotiables

- Do not move winget/apt into Phase 205.
- Do not break installer, vault bootstrap, or onboarding helper flows.
- Do not create a second local execution model for runs that bypasses Phase 207.
- Do not write secrets outside the approved local/private surfaces.
- Do not let `doctor` or `status` imply pricing certainty that the Pricing Engine has not approved.

## Recommended planning emphasis

- 204-01 must explicitly include compatibility scaffolding for the current CLI runtime.
- 204-05, 204-06, 204-08, and 204-09 should be planned as thin clients over APIs/substrate, not local logic bundles.
- 204-13 must remain the doctrine-gap closure plan that keeps CLI aligned with the vault and deep audit.

## Done means

Phase 204 is done when the CLI can expand MarkOS operator capability without regressing installation/bootstrap behavior and without drifting from the v2 run/pricing/freshness doctrine.
