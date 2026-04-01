# Coverage Matrix

## Legend

- `summary`: orientation only
- `route`: HTTP route-level coverage
- `entrypoint`: executable command/startpoint coverage
- `folder`: directory-level ownership coverage
- `file`: file-level ownership coverage
- `excluded`: intentionally out of canonical inventory

## Top-Level Surfaces

| Surface | Coverage | Reason |
|---|---|---|
| `api/` | route, folder, file | Hosted wrappers are runtime entrypoints. |
| `bin/` | entrypoint, folder, file | User-facing CLI and operational utilities. |
| `onboarding/` | route, folder, file | Primary runtime and UI implementation. |
| `.agent/` | entrypoint, folder, file | Protocol and GSD command/tool surfaces. |
| `.planning/` | summary, folder, file | Canonical planning and phase artifacts. |
| `RESEARCH/` | folder, file | Maintained research references. |
| `scripts/` | folder | Reserved surface; currently empty. |
| `test/` | folder, file | Verification ownership and drift checks. |
| `tmp/` | excluded | Temporary cache artifacts. |

## Root Files

Root files are in scope at file level and inventoried in `FILES.md`.

## Exclusion Rules

- Generated/transient cache files are excluded.
- Gitignored local runtime artifacts are summarized but not exhaustively inventoried.

## Refresh Trigger

Update this matrix when a maintained top-level surface is added, removed, or repurposed.
