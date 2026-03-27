# Technology Stack — Rebrand Distribution Scope

**Project:** MarkOS Rebrand  
**Researched:** 2026-03-27

## Recommended Stack

No new technology is needed. The rebrand is a naming/identity change across existing infrastructure.

### Distribution Identity Changes

| Component | Current | Proposed | Breaking? |
|-----------|---------|----------|-----------|
| npm package name | `marketing-get-shit-done` | `markos` (preferred) or `@markos/cli` | **YES — BREAKING** |
| CLI bin: primary | `marketing-get-shit-done` | `markos` | **YES — BREAKING** |
| CLI bin: alias | `mgsd` | Keep as legacy alias + add `markos` | Migration aid |
| npx command | `npx marketing-get-shit-done install` | `npx markos install` | **YES — BREAKING** |

### Migration Bridge Package

| Technology | Purpose | Why |
|------------|---------|-----|
| Deprecated npm package | `marketing-get-shit-done` continues to exist but prints deprecation + installs `markos` | Prevents hard break for existing users |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| npm name | `markos` | `@markos/cli` | Scoped packages require `npx @markos/cli` which is longer; unscoped `markos` is cleaner for `npx markos install` |
| npm name | `markos` | `@esteban-marketing/markos` | Even longer, org-scoped adds friction |
| Legacy support | Deprecation bridge package | Hard cut | Too disruptive for pre-alpha users |
| bin name | `markos` + `mgsd` alias | `markos` only | Keeping `mgsd` alias for one major version helps transition |

## Installation Commands (Post-Rebrand)

```bash
# New users:
npx markos install

# Updates:
npx markos update

# Existing users (bridge — old package prints deprecation):
npx marketing-get-shit-done install
# → prints: "marketing-get-shit-done has been renamed to markos. Run: npx markos install"
```

## Sources

- Direct audit of package.json, bin/install.cjs, bin/update.cjs
