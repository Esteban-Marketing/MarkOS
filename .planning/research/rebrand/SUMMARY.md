# Research Summary: MarkOS Rebrand â€” NPM Package, Distribution & Public-Facing Scope

**Domain:** NPM package identity, CLI distribution, public-facing branding  
**Researched:** 2026-03-27  
**Overall confidence:** HIGH (direct codebase audit â€” no external sources needed)

## Executive Summary

The rebrand from "markos" (MARKOS) to "MarkOS" touches every layer of the public-facing product: the npm package name, CLI binary names, the `files` array that ships to users, all user-facing messaging in README/CHANGELOG, the onboarding UI, the agent directory structure, telemetry identifiers, Supabase + Upstash Vector collection naming, local override directory names, install manifests, and the GitHub repository slug.

The single highest-risk change is the **npm package name** (`markos` â†’ `markos` or `@markos/cli`). This is a **hard breaking change** â€” every existing user's `npx markos` command stops working. All other changes range from moderate (filesystem paths that affect update logic) to cosmetic (comments, docs).

The codebase has deep MARKOS references across 317+ agent files in `.agent/markos/`, all Supabase + Upstash Vector collection names use `markos-` prefixes, all local override directories use `.markos-local/`, and the install manifest is `.markos-install-manifest.json`. These require coordinated migration logic in the installer and updater to maintain backward compatibility.

PostHog telemetry uses `markos-backend-telemetry` as the `$lib` value and `MARKOS_TELEMETRY` as the env var â€” both are internal but affect analytics continuity.

## Key Findings

**Stack:** npm package rename is the atomic breaking change; everything else can be migrated incrementally  
**Architecture:** `.agent/markos/` â†’ `.agent/markos/` requires migration logic in install.cjs and update.cjs  
**Critical pitfall:** Changing Supabase + Upstash Vector collection prefix from `markos-` to `markos-` will orphan all existing vector data unless migration is handled

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: npm Package & CLI Identity** â€” The atomic breaking change
   - Addresses: package.json name, bin entries, `files` array, `prepublishOnly` script
   - Avoids: Orphaning existing installs by shipping migration logic in update.cjs

2. **Phase 2: Filesystem & Directory Renames** â€” Internal structure migration
   - Addresses: `.agent/markos/` â†’ `.agent/markos/`, `.markos-local/` â†’ `.markos-local/`, `.markos-project.json` â†’ `.markos-project.json`, `.markos-install-manifest.json`
   - Avoids: Data loss by detecting old paths and migrating automatically

3. **Phase 3: Supabase + Upstash Vector & Telemetry Identity** â€” Data continuity
   - Addresses: Collection prefix `markos-` â†’ `markos-`, telemetry `$lib`, `MARKOS_TELEMETRY` env var
   - Avoids: Orphaned vector data, broken analytics dashboards

4. **Phase 4: Documentation & UI Rebrand** â€” Cosmetic/messaging
   - Addresses: README, CHANGELOG, ARCH-DIAGRAM, TECH-MAP, onboarding UI, agent files, CLAUDE.md, GEMINI.md
   - Low risk â€” no functional impact

5. **Phase 5: GitHub Repository & Registry** â€” External platform changes
   - Addresses: Repo rename `markos` â†’ `markos`, npm deprecation notice on old package
   - Avoids: Broken links by using GitHub's automatic redirect

**Phase ordering rationale:**
- Package identity must change first (everything downstream depends on it)
- Filesystem migration must precede docs (install/update logic must be tested before public docs reference new paths)
- Supabase + Upstash Vector migration is independent but should precede public launch
- Docs/UI is last because it's zero-risk and can be verified visually
- GitHub repo rename is last because it affects all contributor workflows

**Research flags for phases:**
- Phase 1: Needs npm registry research (is `markos` available? `@markos/cli`?)
- Phase 2: Needs careful migration testing (existing installs must survive update)
- Phase 3: Needs Supabase + Upstash Vector migration testing
- Phase 4-5: Standard patterns, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Package identity | HIGH | Direct audit of package.json, bin entries, files array |
| Filesystem paths | HIGH | Grep confirmed all `.markos-*` references across codebase |
| Supabase + Upstash Vector impact | HIGH | vector-store-client.cjs uses `markos-` prefix in 6 collection operations |
| Telemetry impact | HIGH | telemetry.cjs directly audited |
| Documentation scope | HIGH | All docs read and MARKOS references catalogued |
| npm name availability | LOW | Not verified â€” needs registry check |

## Gaps to Address

- npm package name availability (`markos`, `@markos/cli`, `@esteban-marketing/markos`)
- Whether to publish as scoped or unscoped package
- GitHub redirect behavior after repo rename (verify automatic redirect works for npm/npx)
- PostHog dashboard migration (property rename from `markos-backend-telemetry`)
- Whether to maintain a deprecated `markos` npm package that points to `markos`

