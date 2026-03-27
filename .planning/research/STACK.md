# Technology Stack

**Project:** MarkOS Rebrand
**Researched:** 2026-03-27

## Recommended Stack

No technology changes. This is a pure naming/branding pass across existing files.

### Tools Needed for Rename

| Technology | Purpose | Why |
|------------|---------|-----|
| `sed` / script | Bulk find-replace across 300+ files | Token IDs, internal names, path references |
| `git mv` | File/directory renames with history preservation | Agent, skill, workflow files |
| Node.js | Update `package.json` name field | npm distribution rename |

## npm Package Rename

| Current | Proposed | Notes |
|---------|----------|-------|
| `marketing-get-shit-done` | `markos` or `@markos/cli` | Shorter, brandable |
| `npx marketing-get-shit-done install` | `npx markos install` | Major DX improvement |

## Sources

- package.json (read directly)
- .agent/marketing-get-shit-done/ directory tree (enumerated)
