# Phase 7: NPX Patch Engine & Distribution — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** discuss-phase session decisions

<domain>
## Phase Boundary

Package `markos` as a public npm package. Implement an interactive install CLI wizard (mirrors GSD's UX) that co-exists with existing GSD installs. Implement a smart agentic patch engine for updates that skips `.markos-local/` paths and surfaces conflicts with a diff preview — never auto-overwriting client customizations.
</domain>

<decisions>
## Implementation Decisions

### npm Package Identity
- Package name: `markos` (public npm registry)
- Binary name: `markos` (also `markos` as alias)
- Entry point: `bin/install.cjs`
- Version tracking: `VERSION` file in package root, updated on every install/update

### Install CLI Wizard (npx markos)
Interactive wizard flow:
1. "Install MARKOS alongside existing GSD?" → Yes / No (detects .agent/get-shit-done/ presence)
2. "Installation mode?" → Global (~/.agent) / This project (.agent/)
3. "Project name for marketing context?" → string input
4. "Launch web onboarding after install?" → Yes / No
5. Confirm summary → Install

Post-install actions:
- Copy `.agent/markos/` to chosen destination
- Inject MARKOS skill links into existing `.agent/skills/` if GSD detected
- Create `.markos-local/` scaffold (per Phase 4)
- Write `VERSION` file
- Optionally launch onboarding server

### GSD Co-existence: Non-Destructive Injection
- Detect existing GSD: check for `.agent/get-shit-done/VERSION`
- If found: DO NOT overwrite any existing `.agent/get-shit-done/` files
- Only ADD new files under `.agent/markos/`
- Add MARKOS skill shortcuts to `.agent/skills/` that don't conflict with existing `gsd-*` names
- Append MARKOS section to existing `CLAUDE.md` / `GEMINI.md` if present (never replace)

### Patch (Update) Engine: `npx markos update`
Algorithm:
1. Read installed `VERSION` + read latest package `VERSION`
2. If same: "Already up to date." Exit.
3. Build file manifest diff: installed files vs. latest package files
4. For each changed file:
   a. Check if a corresponding `.markos-local/` override exists → SKIP if yes (client owns it)
   b. Check if installed file was modified by client (git diff from install commit) → flag as CONFLICT
   c. If no conflict: apply update (overwrite with new content)
5. Conflict presentation: show unified diff per conflicted file, offer: Keep Mine / Take Update / Open in editor
6. Write new `VERSION` after update completes

### Conflict Detection Strategy
- On install: record install commit hash + manifest of all installed files in `.markos-install-manifest.json`
- On update: compare current file hashes against install-time hashes to detect client modifications
- `.markos-install-manifest.json` lives at project root, committed to git

### File Overlay (not symlinks)
- Patches use direct file copy (no symlinks) for maximum compatibility (Windows)
- Agentic tools review structure and apply targeted line-level or file-level patches
- Agent reads current installed file + new package file → applies minimal diff using write_to_file

### Package Structure
```
markos/
  bin/
    install.cjs         ← CLI entry point
    update.cjs          ← Update/patch engine
    serve-onboarding.cjs ← Onboarding server (from Phase 6)
  agent/                ← All .agent/markos/ content
  onboarding/           ← Onboarding web app (from Phase 6)
  package.json
  VERSION
  README.md
  CHANGELOG.md
```

### Agent Discretion
- Exact diff algorithm library choice (built-in or jsdiff)
- Changelog entry format
- `--force` flag behavior for advanced users
</decisions>

<canonical_refs>
## Canonical References

### Phase 4 Artifacts (MUST be complete)
- `.agent/markos/` — all MARKOS protocol files (to package)
- `.markos-local/` scaffold convention (Phase 4)

### Phase 6 Artifacts (MUST be complete)
- `onboarding/` — web onboarding app (bundled into npm package)
- `bin/serve-onboarding.cjs` — server script

### Existing GSD Pattern (reference implementation)
- `.agent/hooks/gsd-check-update.js` — version check pattern to replicate
- `.agent/gsd-file-manifest.json` — GSD's manifest approach to study

### Requirements
- `.planning/REQUIREMENTS.md` — NPX-01, NPX-02, PATCH-01 must be addressed
</canonical_refs>

<specifics>
## Specific Deliverables

### npm Package Files
- `package.json` with `bin`, `files`, `engines` fields properly set
- `bin/install.cjs` — interactive wizard
- `bin/update.cjs` — patch engine
- `.markos-install-manifest.json` — install snapshot for conflict detection
- `VERSION` — semver version file
- `CHANGELOG.md` — auto-updated on each release
- `README.md` — public npm page content

### GSD Integration Points
- Detection logic for existing `.agent/get-shit-done/` installs
- Non-destructive CLAUDE.md / GEMINI.md append logic
</specifics>

<deferred>
## Deferred Ideas
- GitHub Actions workflow for auto-publishing to npm
- Signed releases / integrity checksums
- Rollback command (`markos rollback`)
</deferred>

---
*Phase: 07-npx-patch-engine-and-distribution*
*Context gathered: 2026-03-23 via discuss-phase session*
