# Phase 17 Context — NPM Identity & CLI Rebrand

## Objective

Migrate the npm package identity, CLI bin entries, and install/update scripts from `markos`/`markos` to `markos`. This is the foundational phase of the v2.0 MarkOS rebrand — all downstream phases depend on this completing first.

## Locked Decisions

1. **npm package name:** `markos` (confirmed available via `npm view markos` — 404 on 2026-03-27)
2. **Primary bin entry:** `markos` → `./bin/install.cjs`
3. **Legacy bin alias:** `markos` retained for one major version as backward compat
4. **Version bump:** `1.0.0` → `2.0.0` (semver major for breaking npm rename)
5. **Product name:** MarkOS — Marketing Operating System
6. **Brand owner:** esteban.marketing (markos.esteban.marketing)

## Scope

### In Scope
- `package.json` — name, description, bin, keywords, homepage, files, scripts
- `bin/install.cjs` — banner text, version path, detection functions, display messages, npx commands
- `bin/update.cjs` — banner text, version path, error messages, manifest path references
- `VERSION` — bump to 2.0.0
- `CHANGELOG.md` — add v2.0.0 rebrand entry, update header
- Deprecation bridge strategy for old `markos` package

### Out of Scope (Later Phases)
- Directory renames (Phase 18)
- Token ID migration (Phase 19)
- Backend code path updates (Phase 20)
- Documentation/UI updates (Phase 21)
- Migration logic in install/update (Phase 22)

## Key Files

| File | Current State | Changes Needed |
|------|--------------|----------------|
| `package.json` | name: `markos`, bin: `markos` + `markos` | name: `markos`, bin: `markos` + `markos` (compat) |
| `bin/install.cjs` | Banner: "MARKOS Installer", VERSION path: `.agent/markos/VERSION` | Banner: "MarkOS Installer", display text updates |
| `bin/update.cjs` | Banner: "MARKOS Update Engine", manifest path: `.markos-install-manifest.json` | Banner: "MarkOS Update Engine", display text updates |
| `VERSION` | `1.0.0` | `2.0.0` |
| `CHANGELOG.md` | Header: `markos` | Header: `MarkOS`, new v2.0.0 entry |

## Requirements Mapped

- **RBD-01**: npm package name changed, `npx markos install` and `npx markos update` work
- **RBD-02**: Deprecation notice on old package, `markos` bin alias retained

## Dependencies

- Depends on: Phase 16 (Documentation Enrichment — can run in parallel since Phase 16 is docs-only)
- Blocks: Phase 18 (Directory renames need the new package.json `files` array to reference `.agent/markos/`)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Old `npx markos` stops working | HIGH | Publish deprecation bridge version |
| `files` array references `.agent/markos/` — directory doesn't exist yet under new name | MEDIUM | Keep old path in `files` until Phase 18 completes, then update |
| Tests reference old package name | MEDIUM | Update test fixtures in this phase |

## Research References

- [.planning/research/rebrand/REBRAND-MAPPING.md](../../research/rebrand/REBRAND-MAPPING.md) — Item-by-item audit
- [.planning/research/rebrand/PITFALLS.md](../../research/rebrand/PITFALLS.md) — NPM pitfalls #1, #2
- [.planning/research/rebrand/FEATURES.md](../../research/rebrand/FEATURES.md) — Table stakes analysis
