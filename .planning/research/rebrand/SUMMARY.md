# Research Summary: MarkOS Rebrand — NPM Package, Distribution & Public-Facing Scope

**Domain:** NPM package identity, CLI distribution, public-facing branding  
**Researched:** 2026-03-27  
**Overall confidence:** HIGH (direct codebase audit — no external sources needed)

## Executive Summary

The rebrand from "marketing-get-shit-done" (MGSD) to "MarkOS" touches every layer of the public-facing product: the npm package name, CLI binary names, the `files` array that ships to users, all user-facing messaging in README/CHANGELOG, the onboarding UI, the agent directory structure, telemetry identifiers, ChromaDB collection naming, local override directory names, install manifests, and the GitHub repository slug.

The single highest-risk change is the **npm package name** (`marketing-get-shit-done` → `markos` or `@markos/cli`). This is a **hard breaking change** — every existing user's `npx marketing-get-shit-done` command stops working. All other changes range from moderate (filesystem paths that affect update logic) to cosmetic (comments, docs).

The codebase has deep MGSD references across 317+ agent files in `.agent/marketing-get-shit-done/`, all ChromaDB collection names use `mgsd-` prefixes, all local override directories use `.mgsd-local/`, and the install manifest is `.mgsd-install-manifest.json`. These require coordinated migration logic in the installer and updater to maintain backward compatibility.

PostHog telemetry uses `mgsd-backend-telemetry` as the `$lib` value and `MGSD_TELEMETRY` as the env var — both are internal but affect analytics continuity.

## Key Findings

**Stack:** npm package rename is the atomic breaking change; everything else can be migrated incrementally  
**Architecture:** `.agent/marketing-get-shit-done/` → `.agent/markos/` requires migration logic in install.cjs and update.cjs  
**Critical pitfall:** Changing ChromaDB collection prefix from `mgsd-` to `markos-` will orphan all existing vector data unless migration is handled

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: npm Package & CLI Identity** — The atomic breaking change
   - Addresses: package.json name, bin entries, `files` array, `prepublishOnly` script
   - Avoids: Orphaning existing installs by shipping migration logic in update.cjs

2. **Phase 2: Filesystem & Directory Renames** — Internal structure migration
   - Addresses: `.agent/marketing-get-shit-done/` → `.agent/markos/`, `.mgsd-local/` → `.markos-local/`, `.mgsd-project.json` → `.markos-project.json`, `.mgsd-install-manifest.json`
   - Avoids: Data loss by detecting old paths and migrating automatically

3. **Phase 3: ChromaDB & Telemetry Identity** — Data continuity
   - Addresses: Collection prefix `mgsd-` → `markos-`, telemetry `$lib`, `MGSD_TELEMETRY` env var
   - Avoids: Orphaned vector data, broken analytics dashboards

4. **Phase 4: Documentation & UI Rebrand** — Cosmetic/messaging
   - Addresses: README, CHANGELOG, ARCH-DIAGRAM, TECH-MAP, onboarding UI, agent files, CLAUDE.md, GEMINI.md
   - Low risk — no functional impact

5. **Phase 5: GitHub Repository & Registry** — External platform changes
   - Addresses: Repo rename `mgsd` → `markos`, npm deprecation notice on old package
   - Avoids: Broken links by using GitHub's automatic redirect

**Phase ordering rationale:**
- Package identity must change first (everything downstream depends on it)
- Filesystem migration must precede docs (install/update logic must be tested before public docs reference new paths)
- ChromaDB migration is independent but should precede public launch
- Docs/UI is last because it's zero-risk and can be verified visually
- GitHub repo rename is last because it affects all contributor workflows

**Research flags for phases:**
- Phase 1: Needs npm registry research (is `markos` available? `@markos/cli`?)
- Phase 2: Needs careful migration testing (existing installs must survive update)
- Phase 3: Needs ChromaDB migration testing
- Phase 4-5: Standard patterns, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Package identity | HIGH | Direct audit of package.json, bin entries, files array |
| Filesystem paths | HIGH | Grep confirmed all `.mgsd-*` references across codebase |
| ChromaDB impact | HIGH | chroma-client.cjs uses `mgsd-` prefix in 6 collection operations |
| Telemetry impact | HIGH | telemetry.cjs directly audited |
| Documentation scope | HIGH | All docs read and MGSD references catalogued |
| npm name availability | LOW | Not verified — needs registry check |

## Gaps to Address

- npm package name availability (`markos`, `@markos/cli`, `@esteban-marketing/markos`)
- Whether to publish as scoped or unscoped package
- GitHub redirect behavior after repo rename (verify automatic redirect works for npm/npx)
- PostHog dashboard migration (property rename from `mgsd-backend-telemetry`)
- Whether to maintain a deprecated `marketing-get-shit-done` npm package that points to `markos`
