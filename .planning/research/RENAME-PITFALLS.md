# Rebrand Pitfalls: MARKOS â†’ MarkOS Filesystem Rename

**Domain:** Filesystem rebrand execution
**Researched:** 2026-03-27

## Critical Pitfalls

### Pitfall 1: Breaking the npx install for existing users
**What goes wrong:** Publishing to npm under a new name without redirects breaks every piece of content that says `npx markos install`. Existing blog posts, README files in user repos, tweets, and docs become dead commands.
**Why it happens:** npm doesn't support package name redirects natively.
**Consequences:** 100% install failure for anyone following old instructions.
**Prevention:** Keep `markos` as a thin wrapper that delegates to `markos`. OR: publish a deprecation version that tells users the new name.
**Detection:** `npx markos` fails or shows "package not found".

### Pitfall 2: Supabase + Upstash Vector orphaned collections
**What goes wrong:** Renaming the collection prefix from `markos-{slug}` to `markos-{slug}` means any existing Supabase + Upstash Vector instance has orphaned data. The new code won't find old collections.
**Why it happens:** Supabase + Upstash Vector has no rename-collection API. Collections are keyed by exact name.
**Consequences:** All previously onboarded client data becomes invisible.
**Prevention:** Add backward-compat logic: try `markos-{slug}` first, fall back to `markos-{slug}`. OR: write a one-time migration script.
**Detection:** POST /submit or draft retrieval returns empty results for a previously onboarded project.

### Pitfall 3: Partial rename breaks cross-references
**What goes wrong:** Renaming files in `.agent/markos/agents/` but missing a hardcoded path in `orchestrator.cjs` (which references `markos-neuro-auditor.md`) causes runtime crash.
**Why it happens:** Code files have string-literal paths, not dynamic resolution.
**Consequences:** Onboarding server crashes on agent invocation.
**Prevention:** Do file renames and code path updates in the SAME commit. Run all tests after.
**Detection:** `node --test test/` fails on protocol.test.js (checks file existence).

### Pitfall 4: `.gitignore` out of sync
**What goes wrong:** Renaming `.markos-local/` â†’ `.markos-local/` but forgetting to update `.gitignore` means client data gets committed to git.
**Why it happens:** `.gitignore` still says `.markos-local/` â€” doesn't match the new directory name.
**Consequences:** Sensitive client MIR data leaks into git history.
**Prevention:** Update `.gitignore` in the exact same commit as the directory rename.
**Detection:** `git status` shows new unignored files.

### Pitfall 5: Test fixtures hardcode old paths
**What goes wrong:** Tests in `test/setup.js` create `seedMARKOS()` which writes to `.agent/markos/`. After rename, tests create files at old paths and pass vacuously (or fail to test real paths).
**Why it happens:** Test helpers mirror production paths as string literals.
**Consequences:** CI passes but actual product is broken.
**Prevention:** Update all 7 test files. Add a meta-test that greps the codebase for orphaned `markos` strings.
**Detection:** Run tests against a fresh install after rename.

## Moderate Pitfalls

### Pitfall 6: install.cjs AI.md injection has old branding
**What goes wrong:** `bin/install.cjs` line 203 appends `## MARKOS â€” MarkOS` to the user's `.github/copilot-instructions.md`. After rebrand, new installs inject stale branding.
**Prevention:** Update the string literal in install.cjs to `## MarkOS â€” Marketing Operating System`.

### Pitfall 7: ITM token prefix change cascades into planning docs
**What goes wrong:** All `.planning/MSP/` files reference `MARKOS-ITM-CNT-01`, etc. Renaming the template filenames to `MARKOS-ITM-*` but missing the references in prose means agents can't resolve ITM links.
**Prevention:** Global find/replace `MARKOS-ITM-` â†’ `MARKOS-ITM-` across all `.md` files.

### Pitfall 8: onboarding-config.json default slug
**What goes wrong:** `onboarding-config.json` has `"project_slug": "markos-client"` as default. After rename, new installs create Supabase + Upstash Vector collections with the old prefix.
**Prevention:** Change to `"project_slug": "markos-client"`.

## Minor Pitfalls

### Pitfall 9: Temp file patterns in code
**What goes wrong:** `core.cjs` creates temp files as `markos-${Date.now()}.json`. Cosmetic only â€” doesn't affect functionality.
**Prevention:** Update to `markos-${Date.now()}.json` for consistency.

### Pitfall 10: Test temp directory prefixes
**What goes wrong:** Test helpers use `markos-test-`, `markos-mir-test-`, `markos-resolver-test-` for temp dirs. Cosmetic â€” OS cleans these up.
**Prevention:** Update for brand consistency.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Directory git mv | Partial rename â†’ broken cross-refs | Single atomic commit for all renames |
| Code path updates | Miss a hardcoded path | `grep -r 'markos' .` verification pass |
| Content updates | Override path notes in 100+ MIR/MSP files | Scripted `sed` â€” don't do manually |
| NPM publish | Old package name becomes dead | Publish deprecation release pointing to new name |
| Supabase + Upstash Vector migration | Orphaned collections | Backward-compat fallback OR migration script |
| .gitignore | Client data exposure | Same-commit update with directory rename |

