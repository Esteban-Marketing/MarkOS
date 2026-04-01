# Conventions

## Naming and Layout

- Backend runtime files use `.cjs` CommonJS modules.
- Hosted wrappers in `api/` use concise route-aligned file names.
- Planning phase artifacts use `NN-XX-NAME.md` naming.

## Documentation Conventions

- Canonical topology and ownership documentation lives in `.planning/codebase/`.
- Summary docs provide orientation and link to canonical docs.
- Route and entrypoint inventories must include owning files and side effects.

## Change Discipline

- Do not duplicate full route/file truth across multiple summary docs.
- Keep inventory entries path-specific and implementation-based.
- Update associated summary files when canonical path or ownership changes.

## Refresh Triggers

Update this file when naming standards or documentation hierarchy rules change.
