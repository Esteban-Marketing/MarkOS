# Domain Pitfalls: MarkOS Rebrand

**Domain:** Brand rename execution risks
**Researched:** 2026-03-27

## Critical Pitfalls

### Pitfall 1: Partial Token ID Rename Breaks Agent Boot
**What goes wrong:** Agents read MGSD-INDEX.md at boot and resolve cross-references by token ID. If some files have MARKOS- tokens but the index still says MGSD-, or vice versa, agents fail to resolve dependencies.
**Why it happens:** The rename touches 100+ token IDs across 90+ files. Easy to miss one.
**Consequences:** Agent boot failures, broken skill routing, workflows that reference non-existent token IDs.
**Prevention:** Use automated find-replace scripts, NOT manual editing. Run a post-rename validation that greps for any remaining `MGSD-` tokens in the renamed tree.
**Detection:** `grep -r "MGSD-" .agent/markos/` should return zero results after rename.

### Pitfall 2: ChromaDB Namespace Mismatch
**What goes wrong:** Existing client installations have data in `mgsd-{slug}` ChromaDB collections. After rename, code looks for `markos-{slug}` — data appears lost.
**Why it happens:** The namespace is derived from code, not stored in the collection itself.
**Consequences:** All episodic memory, campaign history, and RAG embeddings become invisible.
**Prevention:** Add a migration step in the update script that aliases/copies old collections. Or keep backward-compatible namespace detection.
**Detection:** Test with existing ChromaDB data before shipping.

### Pitfall 3: `.mgsd-local/` Directory Not Migrated
**What goes wrong:** Client customizations in `.mgsd-local/` are not moved to `.markos-local/`. Code now looks for `.markos-local/` override layer — finds nothing — falls back to base templates, silently losing all client overrides.
**Why it happens:** `.mgsd-local/` is gitignored, so it won't be caught by a git-based rename.
**Consequences:** Client brand voice, messaging, tracking config all revert to templates. Potentially catastrophic for active campaigns.
**Prevention:** The update/migration script must explicitly `mv .mgsd-local .markos-local` (or symlink). Must also update `.gitignore`.
**Detection:** Post-migration check: `ls -la .markos-local/MIR/` should show previously customized files.

### Pitfall 4: Hardcoded Paths in Onboarding Code
**What goes wrong:** `onboarding/backend/` JavaScript files have hardcoded paths to `.agent/marketing-get-shit-done/` and `.mgsd-local/`. After directory rename, server.cjs crashes on boot.
**Why it happens:** Paths are string constants in .cjs files, not resolved dynamically.
**Consequences:** Onboarding engine completely broken.
**Prevention:** Update all `path.join()` and `path.resolve()` calls in: `server.cjs`, `handlers.cjs`, `orchestrator.cjs`, `mir-filler.cjs`, `msp-filler.cjs`, `example-resolver.cjs`.
**Detection:** Run `node onboarding/backend/server.cjs` after rename and hit all endpoints.

## Moderate Pitfalls

### Pitfall 5: Git History Fragmentation
**What goes wrong:** Renaming 90+ files in one commit may make `git log --follow` fail for individual file history tracking.
**Prevention:** Use `git mv` for all renames. Consider splitting into meaningful commits per category (agents, skills, infra) so git can track moves.

### Pitfall 6: GSD ↔ MGSD Cross-References
**What goes wrong:** GSD-layer files (`.agent/get-shit-done/`) may reference `marketing-get-shit-done` paths when spawning marketing subagents.
**Prevention:** Grep `.agent/get-shit-done/` for `marketing-get-shit-done` and `mgsd` references. Update if found.
**Detection:** `grep -r "marketing-get-shit-done\|mgsd" .agent/get-shit-done/`

### Pitfall 7: npm Package Name Availability
**What goes wrong:** Desired npm package name `markos` may already be taken.
**Prevention:** Check `npm view markos` before committing to the name. Have backup names ready (`@markos/cli`, `markos-marketing`).

### Pitfall 8: Internal Prose References to "MGSD"
**What goes wrong:** Agent system prompts contain prose like "You are the MGSD Strategist" and "the MGSD protocol". Missed occurrences create a confusing dual-brand experience.
**Prevention:** Case-insensitive grep for both `mgsd` and `MGSD` across ALL files, not just filenames. Include prose in templates, references, and MSP strategy docs.

## Minor Pitfalls

### Pitfall 9: README / Marketing Content Lagging
**What goes wrong:** Install command in README still says `npx marketing-get-shit-done`. Users get a 404.
**Prevention:** Update README.md, RESEARCH/ docs, and all `.mgsd-local/MSP/Campaigns/` content that reference the old npm command.

### Pitfall 10: localStorage Key Not Migrated
**What goes wrong:** Existing onboarding UI users have `mgsd_privacy_accepted` in localStorage. Code checks for `markos_privacy_accepted`. Users see the privacy banner again.
**Prevention:** Add backward-compatible check: `localStorage.getItem('markos_privacy_accepted') || localStorage.getItem('mgsd_privacy_accepted')`.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Token registry rename | Partial rename breaks boot | Atomic script + validation grep |
| Agent file rename | Missed internal name: field | Validate all frontmatter names |
| Skill directory rename | Broken skill routing | Test each skill invocation |
| Infrastructure rename | .mgsd-local data loss | Explicit directory migration step |
| npm package rename | Name already taken | Check npm registry first |
| Documentation update | Stale install commands | Grep all docs for old commands |

## Sources

- Codebase analysis: file_search + grep_search across full workspace
- `.protocol-lore/CONVENTIONS.md` (override resolution protocol)
- `.protocol-lore/MEMORY.md` (ChromaDB namespace rules)
- `onboarding/backend/server.cjs` (hardcoded path analysis)
