# Phase 24 Deployment Contract

## Runtime Modes

### Local Server Mode
- Entry: `node onboarding/backend/server.cjs`
- Runtime mode: `local`
- Local persistence: enabled
- Supported write flows: `POST /submit` seed write, `POST /approve` MIR write to `.mgsd-local/MIR/`

### Hosted API-Wrapper Mode
- Entry: `api/*.js` wrappers delegating to shared handlers
- Runtime mode: `hosted`
- Local persistence: unavailable
- `POST /approve`: explicitly rejected with HTTP 501 and error `LOCAL_PERSISTENCE_UNAVAILABLE`

## Canonical Runtime Contract
- Runtime mode, config precedence, and persistence capability are resolved by `onboarding/backend/runtime-context.cjs`.
- Shared behavior is implemented in `onboarding/backend/handlers.cjs`; entrypoints remain thin.
- Local-vs-hosted branching is treated as an explicit contract, not ad hoc logic.

## Config and Slug Precedence
1. Runtime defaults from `runtime-context.cjs`
2. `onboarding/onboarding-config.json` overrides
3. Request-provided slug (`project_slug` body/query, `client` query legacy fallback)
4. Fallback slug from configured/default project slug and normalized company name
5. Local mode can persist slug in `.mgsd-project.json`; hosted mode is read-only for local persistence

## Persistence Contract
- Local filesystem writes are only supported in local mode.
- Hosted mode must not imply local durability guarantees.
- Hosted durability requires an explicit persistence backend phase; until then, local approve/write paths remain unsupported in hosted wrappers.

## Verification Surface
- `test/onboarding-server.test.js`:
  - Local server flow remains functional.
  - Hosted wrapper config reports `runtime_mode=hosted` and `local_persistence=false`.
  - Hosted approve rejects with `LOCAL_PERSISTENCE_UNAVAILABLE`.

## Decision
Phase 24 runtime constraints are now explicit for operators, developers, and future phase planning.
