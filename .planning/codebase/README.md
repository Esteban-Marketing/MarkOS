# MarkOS Canonical Codebase Map

This directory is the canonical source of truth for repository topology and ownership.

## Scope

This map covers runtime, planning, protocol, and test surfaces in this repository.

## Canonicality Contract

- Topology and ownership truth lives in this directory.
- Summary docs must link here instead of duplicating full inventories.
- If a summary conflicts with this map, this map wins.

## Documents

- `STACK.md`: technology stack and runtime boundaries.
- `INTEGRATIONS.md`: external systems, secrets, and contracts.
- `ARCHITECTURE.md`: component relationships and data flow.
- `STRUCTURE.md`: placement rules for new code and docs.
- `CONVENTIONS.md`: naming, file, and documentation conventions.
- `TESTING.md`: test ownership and validation coverage.
- `CONCERNS.md`: known risks and debt surfaces.
- `COVERAGE-MATRIX.md`: in-scope and excluded surfaces.
- `ROUTES.md`: HTTP route inventory and side effects.
- `ENTRYPOINTS.md`: executable and operator entrypoints.
- `FOLDERS.md`: folder-level ownership map.
- `FILES.md`: file-level ownership map.

## Freshness Triggers

Update this directory when any of the following occur:

1. A route is added, removed, or changes contract.
2. A new executable entrypoint is introduced.
3. A maintained folder is created, deleted, or repurposed.
4. A file changes ownership or primary responsibility.
5. Secret requirements or external integration contracts change.

## Summary Delegation

Audience summaries live in:

- `README.md`
- `TECH-MAP.md`
- `.protocol-lore/CODEBASE-MAP.md`

These should provide orientation and deep-link to this directory for canonical details.

See `COVERAGE-MATRIX.md` for explicit scope.
