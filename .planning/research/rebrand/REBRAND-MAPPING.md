# Rebrand Mapping — Complete Item-by-Item Audit

**Project:** MarkOS Rebrand  
**Researched:** 2026-03-27  
**Scope:** NPM package, distribution, and public-facing references

---

## 1. package.json

| Field | Current Value | Proposed Value | Risk |
|-------|--------------|----------------|------|
| `name` | `"markos"` | `"markos"` | ðŸ”´ **BREAKING** — all npx/npm commands change |
| `description` | `"The MarkOS (MARKOS) protocol — agentic marketing execution alongside GSD"` | `"MarkOS — the Marketing Operating System. Protocol-grade marketing infrastructure for AI-ready teams."` | ðŸŸ¢ Cosmetic |
| `bin.markos` | `"./bin/install.cjs"` | Remove (replaced by `markos`) | ðŸ”´ **BREAKING** |
| `bin.markos` | `"./bin/install.cjs"` | Keep as alias during transition | ðŸŸ¡ Migration aid |
| `bin.markos` | Does not exist | `"./bin/install.cjs"` | ðŸŸ¢ New addition |
| `keywords` | `["marketing","ai","agents","protocol","markos","gsd","get-shit-done"]` | `["marketing","ai","agents","protocol","markos","marketing-os","operating-system"]` | ðŸŸ¢ Cosmetic |
| `homepage` | `"https://github.com/your-org/markos"` | `"https://github.com/esteban-marketing/markos"` | ðŸŸ¢ Cosmetic |
| `files[1]` | `".agent/markos/"` | `".agent/markos/"` | ðŸŸ¡ Must match directory rename |
| `scripts.prepublishOnly` | `"node -e \"console.log('Publishing markos v' + require('./package.json').version)\""` | Update to `'Publishing markos v...'` | ðŸŸ¢ Cosmetic |

---

## 2. README.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| npm badge URL | `markos` | `markos` | ðŸŸ¢ Cosmetic |
| Install command | `npx markos install` | `npx markos install` | ðŸŸ¡ User-facing |
| Update command | `npx markos update` | `npx markos update` | ðŸŸ¡ User-facing |
| `.agent/markos/` path | Multiple references | `.agent/markos/` | ðŸŸ¡ Must match directory |
| Agent names | `markos-strategist`, `markos-copy-drafter`, etc. | `markos-strategist`, `markos-copy-drafter` | ðŸŸ¢ Cosmetic |
| `.markos-local/` references | ~3 occurrences | `.markos-local/` | ðŸŸ¡ Must match directory |
| "MARKOS detects and installs alongside" | GSD co-existence section | "MarkOS detects and installs alongside" | ðŸŸ¢ Cosmetic |
| `.markos-project.json` | Customization section | `.markos-project.json` | ðŸŸ¡ Must match file rename |
| `.agent/markos/MARKOS-INDEX.md` | Agent Quick-Boot section | `.agent/markos/MARKOS-INDEX.md` | ðŸŸ¡ Must match file |
| Architecture code block | `markos-{project_slug}` | `markos-{project_slug}` | ðŸŸ¡ Must match code |

---

## 3. CHANGELOG.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Title | `# Changelog — markos` | `# Changelog — MarkOS` | ðŸŸ¢ Cosmetic |
| v1.0.0 entry | `Full MARKOS protocol: MIR, MSP, RESEARCH architecture` | `Full MarkOS protocol: MIR, MSP, RESEARCH architecture` | ðŸŸ¢ Cosmetic |
| v1.0.0 entry | `Interactive install wizard with GSD co-existence detection` | No MARKOS ref — OK as-is | ðŸŸ¢ None |
| New entry | — | Add `## v2.0.0 — Rebrand: MARKOS → MarkOS` entry | ðŸŸ¢ Cosmetic |

---

## 4. VERSION File

| Current | Proposed | Risk |
|---------|----------|------|
| `1.0.0` | Bump to `2.0.0` (semver major for breaking npm rename) | ðŸŸ¡ Versioning decision |

Note: `.agent/markos/VERSION` also contains `1.1.0` — this needs to match or be reconciled.

---

## 5. vercel.json

| Current | Proposed | Risk |
|---------|----------|------|
| No MARKOS references | No changes needed | ðŸŸ¢ None |

The vercel.json only contains route rewrites — all path-agnostic.

---

## 6. api/ Directory Files

| File | MARKOS References | Proposed | Risk |
|------|----------------|----------|------|
| `api/config.js` | 0 (delegates to handlers.cjs) | No changes needed | ðŸŸ¢ None |
| `api/submit.js` | 0 | No changes needed | ðŸŸ¢ None |
| `api/approve.js` | 0 | No changes needed | ðŸŸ¢ None |
| `api/status.js` | 0 | No changes needed | ðŸŸ¢ None |
| `api/regenerate.js` | 0 | No changes needed | ðŸŸ¢ None |

All API files are thin wrappers delegating to `handlers.cjs`. The MARKOS references live in handlers.cjs.

---

## 7. onboarding/onboarding-config.json

| Field | Current | Proposed | Risk |
|-------|---------|----------|------|
| `project_slug` | `"markos-client"` | `"markos-client"` | ðŸŸ¡ Affects Supabase + Upstash Vector namespace default |
| `mir_output_path` | `".markos-local/MIR"` | `".markos-local/MIR"` | ðŸŸ¡ Must match directory rename |
| All other fields | No MARKOS refs | No changes needed | ðŸŸ¢ None |

---

## 8. onboarding/index.html

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| `<title>` | `Client Intelligence Onboarding` | No MARKOS ref — consider `MarkOS Onboarding` | ðŸŸ¢ Optional |
| PostHog snippet | Generic — no MARKOS refs | No changes needed | ðŸŸ¢ None |
| Form content | No MARKOS refs in HTML | No changes needed | ðŸŸ¢ None |

---

## 9. onboarding/onboarding.css

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| CSS classes | All generic (`.onboarding-wrapper`, `.step-section`, etc.) | No changes needed | ðŸŸ¢ None |
| No MARKOS-prefixed classes | — | — | ðŸŸ¢ None |

---

## 10. onboarding/onboarding.js

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Comment header | `// onboarding.js — MARKOS Client Onboarding v2.0` | `// onboarding.js — MarkOS Client Onboarding v2.0` | ðŸŸ¢ Cosmetic |
| `STORAGE_KEY` | `'markos-onboarding-draft'` | `'markos-onboarding-draft'` (with migration from old key) | ðŸŸ¡ Risk of losing in-progress drafts |
| `localStorage.getItem('markos_privacy_dismissed')` | Privacy notice key | `'markos_privacy_dismissed'` (with old-key migration) | ðŸŸ¡ Minor — privacy banner re-shows once |

---

## 11. onboarding-seed.schema.json

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| `title` | `"MARKOS Onboarding Seed v2.1"` | `"MarkOS Onboarding Seed v3.0"` | ðŸŸ¢ Cosmetic (JSON Schema metadata only) |

Note: `onboarding-seed.json` is gitignored and generated per-user — no changes needed.

---

## 12. .gitignore

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Comment | `# MARKOS gitignore` | `# MarkOS gitignore` | ðŸŸ¢ Cosmetic |
| Comment | `# MARKOS client overrides` | `# MarkOS client overrides` | ðŸŸ¢ Cosmetic |
| Path | `.markos-local/` | Add `.markos-local/` (keep both during transition) | ðŸŸ¡ Required |
| Path | `.markos-install-manifest.json` | Add `.markos-install-manifest.json` (keep both) | ðŸŸ¡ Required |

---

## 13. CLAUDE.md and GEMINI.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Both files | `"read .protocol-lore/QUICKSTART.md for high-efficiency agent-boot and protocol-lore/INDEX.md"` | No MARKOS ref in content — but QUICKSTART.md it points to has many | ðŸŸ¢ Indirect only |

The files themselves don't need changes. The `.protocol-lore/QUICKSTART.md` they reference does (covered separately).

---

## 14. ARCH-DIAGRAM.md and TECH-MAP.md

| File | MARKOS References | Proposed | Risk |
|------|----------------|----------|------|
| `ARCH-DIAGRAM.md` | Title: "MARKOS Architecture Diagram", topology label: "MARKOS SYSTEM TOPOLOGY" | Rename to "MarkOS" | ðŸŸ¢ Cosmetic |
| `TECH-MAP.md` | 40+ references: title, paths, commands, config examples, collection names | Full find-replace pass | ðŸŸ¢ Cosmetic (docs only) |

---

## 15. GitHub Repository

| Item | Current | Proposed | Risk |
|------|---------|----------|------|
| Repo name | `markos` | `markos` | ðŸŸ¡ GitHub auto-redirects; affects all clone URLs |
| Repo description | Likely MARKOS-related | Update to MarkOS | ðŸŸ¢ Cosmetic |
| Topics/tags | May include MARKOS | Update | ðŸŸ¢ Cosmetic |
| All existing links | `github.com/*/markos` | Auto-redirect works | ðŸŸ¢ Low risk |

---

## 16. bin/install.cjs

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| JSDoc header | `"install.cjs — MARKOS Interactive Installer"` | `"install.cjs — MarkOS Interactive Installer"` | ðŸŸ¢ Cosmetic |
| `VERSION` path | `'.agent/markos/VERSION'` | `'.agent/markos/VERSION'` (+fallback to old) | ðŸŸ¡ Must match dir rename |
| Banner text | `"MARKOS Installer v${VERSION} — MarkOS"` | `"MarkOS Installer v${VERSION} — Marketing Operating System"` | ðŸŸ¢ Cosmetic |
| `detectExistingMARKOS()` | Checks `.agent/markos/VERSION` | Check both old and new `.agent/markos/VERSION` | ðŸŸ¡ Migration |
| Template source | `path.join(PKG_DIR, '.agent', 'markos')` | `path.join(PKG_DIR, '.agent', 'markos')` | ðŸŸ¡ Must match dir |
| Template dest | `path.join(agentDir, 'markos')` | `path.join(agentDir, 'markos')` | ðŸŸ¡ Must match dir |
| Manifest path | `'.markos-install-manifest.json'` | `'.markos-install-manifest.json'` (+fallback) | ðŸŸ¡ Migration |
| Console messages | Multiple `"MARKOS"` and `"âœ“ MARKOS protocol files installed"` | Update all | ðŸŸ¢ Cosmetic |
| npx command (handle update) | `"npx markos update"` | `"npx markos update"` | ðŸŸ¡ User-facing |
| AI MD append logic | Checks for `GEMINI.md`, `CLAUDE.md`, `AGENTS.md` | No MARKOS ref in logic itself — OK | ðŸŸ¢ None |

---

## 17. bin/update.cjs

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| JSDoc header | `"update.cjs — MARKOS Safe Update & Patch Engine"` | `"update.cjs — MarkOS Safe Update & Patch Engine"` | ðŸŸ¢ Cosmetic |
| `NEW_VERSION` path | `'.agent/markos/VERSION'` | `'.agent/markos/VERSION'` | ðŸŸ¡ Must match dir |
| Banner text | `"MARKOS Update Engine v${NEW_VERSION}"` | `"MarkOS Update Engine v${NEW_VERSION}"` | ðŸŸ¢ Cosmetic |
| Manifest read | `'.markos-install-manifest.json'` | Check both old and new | ðŸŸ¡ Migration |
| `getInstalledDir()` | Returns `'.agent/markos'` path | Must return new path, migrate old | ðŸŸ¡ Migration |
| `pkgAgentDir` | `'.agent/markos'` | `'.agent/markos'` | ðŸŸ¡ Must match dir |
| `isLocalOverride()` | Checks `.markos-local/` | Check both `.markos-local/` and `.markos-local/` | ðŸŸ¡ Migration |
| Error message | `"Run npx markos to install first"` | `"Run npx markos to install first"` | ðŸŸ¢ Cosmetic |

---

## 18. Telemetry (PostHog)

| Reference | Location | Current | Proposed | Risk |
|-----------|----------|---------|----------|------|
| Env var | `telemetry.cjs:8` | `MARKOS_TELEMETRY` | Support both `MARKOS_TELEMETRY` and `MARKOS_TELEMETRY` | ðŸŸ¡ User docs reference old |
| `$lib` property | `telemetry.cjs:32` | `'markos-backend-telemetry'` | `'markos-backend-telemetry'` | ðŸŸ¡ Breaks PostHog dashboard filters |
| Client-side PostHog | `index.html` | Generic snippet — no MARKOS | No changes needed | ðŸŸ¢ None |

---

## Risk Legend

| Symbol | Meaning | Action Required |
|--------|---------|----------------|
| ðŸ”´ | **Breaking change** — existing users' workflows break | Migration logic + deprecation bridge required |
| ðŸŸ¡ | **Moderate** — functional impact, requires migration/coordination | Update with backward compatibility |
| ðŸŸ¢ | **Cosmetic** — no functional impact | Simple find-replace in rebrand pass |

## Summary Statistics

| Risk Level | Count | Examples |
|------------|-------|---------|
| ðŸ”´ Breaking | 3 | npm name, primary bin entry, npx command |
| ðŸŸ¡ Moderate | ~25 | Filesystem paths, migration logic, config defaults, storage keys |
| ðŸŸ¢ Cosmetic | ~40+ | Comments, doc titles, banner text, badge URLs |

---

## Migration Matrix: Old → New Path Mapping

| Old Path/Name | New Path/Name | Where Referenced |
|---------------|---------------|-----------------|
| `markos` (npm) | `markos` | package.json, all install docs |
| `.agent/markos/` | `.agent/markos/` | install.cjs, update.cjs, README, TECH-MAP |
| `.markos-local/` | `.markos-local/` | handlers.cjs, write-mir.cjs, server.cjs, .gitignore |
| `.markos-project.json` | `.markos-project.json` | handlers.cjs, vector-store-client.cjs docs |
| `.markos-install-manifest.json` | `.markos-install-manifest.json` | install.cjs, update.cjs, .gitignore |
| `markos-{slug}-{section}` (Supabase + Upstash Vector) | `markos-{slug}-{section}` | vector-store-client.cjs (6 occurrences) |
| `markos-onboarding-draft` (localStorage) | `markos-onboarding-draft` | onboarding.js |
| `markos_privacy_dismissed` (localStorage) | `markos_privacy_dismissed` | onboarding.js |
| `markos-client` (default slug) | `markos-client` | onboarding-config.json, handlers.cjs, server.cjs |
| `MARKOS_TELEMETRY` (env var) | `MARKOS_TELEMETRY` (+ old support) | telemetry.cjs, TECH-MAP.md |
| `markos-backend-telemetry` ($lib) | `markos-backend-telemetry` | telemetry.cjs |
| `MARKOS-IDX-000` (token IDs) | Defer to separate phase | MARKOS-INDEX.md, all 317 agent files |

