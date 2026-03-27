# Feature Landscape — Rebrand Mapping

**Domain:** NPM package, distribution, and public-facing rebrand scope  
**Researched:** 2026-03-27

## Table Stakes

Changes that MUST happen for the rebrand to be considered complete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| npm package name change | Users run `npx markos install` — the core identity | High | BREAKING — needs bridge package on old name |
| bin entry rename | CLI command is the product's primary interface | Medium | Keep `mgsd` alias during transition |
| README full rebrand | First thing users see on npm/GitHub | Low | Already partially branded "MarkOS" |
| package.json metadata | description, keywords, homepage must match new name | Low | Cosmetic |
| .agent/ directory rename | Internal protocol engine path must match product name | High | Migration logic needed in install.cjs + update.cjs |
| .mgsd-local/ → .markos-local/ | User-facing directory name is product identity | High | Migration logic needed; gitignore update |
| .mgsd-project.json → .markos-project.json | File is referenced in docs and by server.cjs | Medium | Auto-rename in install/update |
| .mgsd-install-manifest.json rename | Referenced by update.cjs for conflict detection | Medium | update.cjs must check both old+new paths |
| GitHub repo rename | `mgsd` → `markos` | Low | GitHub auto-redirects old URLs |

## Differentiators

Changes that add polish beyond minimum viable rebrand.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ChromaDB collection migration | Existing vector data preserved under new `markos-` prefix | Medium | Optional if no users have persistent data yet |
| PostHog telemetry identity | Analytics continuity with new `$lib` name | Low | Internal-only, but affects dashboards |
| Deprecation bridge package | Old `marketing-get-shit-done` still works, prints migration message | Medium | High value for existing users |
| Agent file renaming (25+ agents) | `mgsd-strategist` → `markos-strategist` etc. | High | 317 files in .agent/, mass rename |

## Anti-Features

Changes to explicitly NOT make during the rebrand.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Rewrite agent prompt content | Agent prompts work; renaming internal references is low-value high-risk | Only rename file names and obvious user-facing strings |
| Break existing .mgsd-local/ data | Users' MIR/MSP overrides live here — never destroy | Detect + auto-rename, never delete |
| Remove MGSD_TELEMETRY env var immediately | Existing docs/scripts reference it | Support both `MGSD_TELEMETRY` and `MARKOS_TELEMETRY` for one version |
| Rename ChromaDB collections in-place | Risk of data corruption | Create new collections, copy data, deprecate old |

## Feature Dependencies

```
npm package rename → bin entries update → README/CHANGELOG update
.agent/ dir rename → install.cjs migration logic → update.cjs migration logic
.mgsd-local/ rename → gitignore update → handlers.cjs path updates → write-mir.cjs path updates
ChromaDB prefix change → chroma-client.cjs update → orchestrator.cjs update
```

## MVP Recommendation

Prioritize:
1. npm package.json identity (name, description, bin, keywords, homepage, files, scripts)
2. bin/install.cjs + bin/update.cjs migration logic (detect old paths, auto-rename)
3. README.md full rebrand
4. .agent/ directory rename with backward compatibility
5. .gitignore update

Defer:
- Agent file content updates (317 files, low user impact)
- ChromaDB collection migration (pre-alpha, likely no persistent user data)
- PostHog `$lib` rename (internal, can be done anytime)

## Sources

- Direct codebase audit of all 17 target areas
