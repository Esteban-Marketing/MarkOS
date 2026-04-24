# Phase 204 - CLI `markos` v1 GA (Discussion)

> v4.0.0 SaaS Readiness milestone. This phase was refreshed on 2026-04-23 using `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` as mandatory input. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-23  
**Milestone:** v4.0.0 SaaS Readiness  
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)  
**Depends on:** Phases 200 and 201, with compatibility to Phases 205 and 207  
**Quality baseline applies:** all 15 gates

## Goal

Graduate `markos` from an install-first bootstrap binary into a real operator CLI without breaking the existing installer, vault bootstrap, onboarding helper, or legacy utility commands that already ship in the repository.

Phase 204 is not a greenfield CLI build. It is a migration of the current install/update/db/vault/LLM/generate command family into a coherent GA operator CLI that also respects the v2 vault doctrine for AgentRun, pricing placeholders, and codebase/vault freshness.

## Mandatory inputs

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `package.json`
- `bin/install.cjs`
- `bin/cli-runtime.cjs`
- `.planning/phases/204-cli-markos-v1-ga/204-CONTEXT.md`
- `.planning/phases/204-cli-markos-v1-ga/204-RESEARCH.md`

## Current code evidence

- `package.json` still publishes `markos` through `bin/install.cjs`.
- `bin/cli-runtime.cjs` already parses and routes `update`, `db:setup`, `llm:*`, `import:legacy`, `vault:open`, and `generate`.
- `bin/install.cjs` already owns interactive install, vault bootstrap, Obsidian/QMD detection, preset installs, and onboarding handoff.
- `bin/commands/*` does not exist yet.
- There is no durable CLI-facing run/status substrate yet; Phase 207 will supply the canonical one.

## Codebase-specific gap

The old Phase 204 framing assumed a mostly empty CLI surface. The real repo already has:

- installer and update workflows
- vault and literacy helpers
- onboarding helper launch logic
- install profiles and preset flows
- Node/runtime readiness checks

So Phase 204 must be additive and compatibility-safe. It cannot pretend `markos` starts at zero.

## Scope (in)

- Full GA command family: `init`, `generate`, `plan`, `run`, `eval`, `login`, `keys`, `whoami`, `env`, `status`, `doctor`
- Wave 1 distribution only: npm, Homebrew, Scoop
- Shared CLI primitives for auth, config, keychain, output, HTTP, SSE, errors, and environment file handling
- API contracts and endpoints needed for CLI auth, runs, env, whoami, and status
- Compatibility with current install/bootstrap behavior
- v2 doctrine guardrails:
  - `run` becomes a thin client over the canonical run substrate
  - `status` and `doctor` understand vault/codebase freshness and pricing placeholder policy
  - pricing-sensitive output never invents public prices

## Scope (out)

- winget and apt distribution
- single-binary packaging
- CLI plugin marketplace
- TUI or terminal dashboard mode
- local reimplementation of AgentRun orchestration logic that belongs to Phase 207

## Refreshed decisions

### D-204-01: Preserve install-first default behavior

`npx markos` and `markos install` remain valid installer/bootstrap entrypoints. Phase 204 adds operator commands without regressing install, update, preset, vault, or onboarding flows.

### D-204-02: Treat CLI as a thin client, not a parallel runtime

`markos run`, `markos status`, and `markos env` should call server-side tenant APIs. They must not become a second execution engine or alternate source of truth for run state, pricing, or approvals.

### D-204-03: Reuse existing helpers before adding new abstractions

The current parser/runtime in `bin/cli-runtime.cjs`, the installer in `bin/install.cjs`, and existing `generate` helpers are migration anchors. Phase 204 should extend them, not discard them.

### D-204-04: `doctor` becomes a doctrine-aware gate

`markos doctor` should check more than runtime health. It should also help detect:

- missing `.markos-local/` protections
- stale or missing vault/bootstrap surfaces
- missing auth/config state
- missing provider/env state
- known phase-204 freshness inputs used by the current doctrine

### D-204-05: Distribution scope stays Wave 1 only

Homebrew and Scoop are still in-scope. winget and apt remain deferred and must not be pushed into Phase 205.

### D-204-06: Phase 204 must not outrun Phase 207

If a command needs run state, events, retries, or task visibility, it should align to the Phase 207 substrate design instead of inventing CLI-only semantics.

## Threat-model focus

credential storage, token scope, supply chain, stale vault state, env overwrite risk, auth drift, quota confusion, and silent mismatch between CLI output and server truth

## Success criteria

- Existing installer/update/vault/generate paths still work after the CLI expansion.
- The 11-command GA family exists with clear auth, output, and error behavior.
- `markos run`, `status`, and `doctor` align with v2 doctrine rather than pre-v2 assumptions.
- Wave 1 distribution works without adding hidden packaging debt to later pricing or orchestration phases.
- CLI tests cover both new commands and regression protection for old entrypoints.

## Open questions

- Is `keytar` still the only acceptable keychain backend, or do we allow an implementation-compatible fallback wrapper if native install pain appears?
- What is the smallest useful Phase 204 `status` response before full Phase 207 run APIs land?
- Which Phase 204 `doctor` checks should hard-fail versus warn when doctrine freshness inputs are missing?

## Planning note

No new top-level phase is required. The deep audit confirms that Phase 204 is still the right bucket, but it must absorb compatibility work that earlier planning understated.

## References

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`
- `package.json`
- `bin/install.cjs`
- `bin/cli-runtime.cjs`
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
