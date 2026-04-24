# Coverage Matrix

## Legend

- `summary`: orientation only
- `route`: HTTP/file-route coverage
- `entrypoint`: executable command/startpoint coverage
- `folder`: directory-level ownership coverage
- `file`: high-leverage file ownership coverage
- `artifact`: planning/vault/doctrine artifact coverage
- `excluded`: intentionally outside canonical inventory

## In-Scope Repository Surfaces

| Surface | Coverage | Reason |
|---|---|---|
| `app/` | route, folder, file | Main product UI and route handlers |
| `api/` | route, folder, file | Hosted API surface |
| `bin/` | entrypoint, folder, file | User-facing and operational CLI/runtime utilities |
| `components/` | folder, file | Shared UI ownership |
| `contracts/` | folder, file | Public/private contract truth |
| `docs/` | folder, file | Public technical documentation |
| `lib/` | folder, file | Shared domain logic |
| `onboarding/` | route, folder, file | Local onboarding runtime |
| `public/` | folder, file | Static public assets/exports |
| `sdk/` | folder, file | SDK output surfaces |
| `scripts/` | entrypoint, folder, file | Automation/build/indexing helpers |
| `supabase/` | folder, file | Schema and migration truth |
| `test/` | folder, file | Verification ownership |
| `tools/` | folder, file | Maintained auxiliary tooling |
| `.agent/` | entrypoint, folder, file | Protocol/GSD engine surfaces |
| `.agents/` | folder, file | Local skill/agent support |
| `.planning/` | artifact, folder, file | Canonical planning layer |
| `obsidian/` | artifact, folder, file | Vault doctrine and intake surfaces |
| `RESEARCH/` | artifact, folder, file | Research output surfaces |

## Explicit Exclusions

| Surface | Reason |
|---|---|
| `.git/` | VCS internals |
| `.next/` | generated build output |
| `storybook-static/` | generated Storybook export |
| `node_modules/` | dependency vendor tree |
| `*.log`, `*.tgz`, transient diagnostics | generated artifacts, not canonical ownership surfaces |

## Refresh Trigger

Update this matrix when a maintained top-level surface is added, removed, repurposed, or explicitly excluded.
