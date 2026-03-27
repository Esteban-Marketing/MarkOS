# Rebrand Mapping — Complete Item-by-Item Audit

**Project:** MarkOS Rebrand  
**Researched:** 2026-03-27  
**Scope:** NPM package, distribution, and public-facing references

---

## 1. package.json

| Field | Current Value | Proposed Value | Risk |
|-------|--------------|----------------|------|
| `name` | `"marketing-get-shit-done"` | `"markos"` | 🔴 **BREAKING** — all npx/npm commands change |
| `description` | `"The Marketing Get Shit Done (MGSD) protocol — agentic marketing execution alongside GSD"` | `"MarkOS — the Marketing Operating System. Protocol-grade marketing infrastructure for AI-ready teams."` | 🟢 Cosmetic |
| `bin.marketing-get-shit-done` | `"./bin/install.cjs"` | Remove (replaced by `markos`) | 🔴 **BREAKING** |
| `bin.mgsd` | `"./bin/install.cjs"` | Keep as alias during transition | 🟡 Migration aid |
| `bin.markos` | Does not exist | `"./bin/install.cjs"` | 🟢 New addition |
| `keywords` | `["marketing","ai","agents","protocol","mgsd","gsd","get-shit-done"]` | `["marketing","ai","agents","protocol","markos","marketing-os","operating-system"]` | 🟢 Cosmetic |
| `homepage` | `"https://github.com/your-org/marketing-get-shit-done"` | `"https://github.com/esteban-marketing/markos"` | 🟢 Cosmetic |
| `files[1]` | `".agent/marketing-get-shit-done/"` | `".agent/markos/"` | 🟡 Must match directory rename |
| `scripts.prepublishOnly` | `"node -e \"console.log('Publishing marketing-get-shit-done v' + require('./package.json').version)\""` | Update to `'Publishing markos v...'` | 🟢 Cosmetic |

---

## 2. README.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| npm badge URL | `marketing-get-shit-done` | `markos` | 🟢 Cosmetic |
| Install command | `npx marketing-get-shit-done install` | `npx markos install` | 🟡 User-facing |
| Update command | `npx marketing-get-shit-done update` | `npx markos update` | 🟡 User-facing |
| `.agent/marketing-get-shit-done/` path | Multiple references | `.agent/markos/` | 🟡 Must match directory |
| Agent names | `mgsd-strategist`, `mgsd-copy-drafter`, etc. | `markos-strategist`, `markos-copy-drafter` | 🟢 Cosmetic |
| `.mgsd-local/` references | ~3 occurrences | `.markos-local/` | 🟡 Must match directory |
| "MGSD detects and installs alongside" | GSD co-existence section | "MarkOS detects and installs alongside" | 🟢 Cosmetic |
| `.mgsd-project.json` | Customization section | `.markos-project.json` | 🟡 Must match file rename |
| `.agent/marketing-get-shit-done/MGSD-INDEX.md` | Agent Quick-Boot section | `.agent/markos/MARKOS-INDEX.md` | 🟡 Must match file |
| Architecture code block | `mgsd-{project_slug}` | `markos-{project_slug}` | 🟡 Must match code |

---

## 3. CHANGELOG.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Title | `# Changelog — marketing-get-shit-done` | `# Changelog — MarkOS` | 🟢 Cosmetic |
| v1.0.0 entry | `Full MGSD protocol: MIR, MSP, RESEARCH architecture` | `Full MarkOS protocol: MIR, MSP, RESEARCH architecture` | 🟢 Cosmetic |
| v1.0.0 entry | `Interactive install wizard with GSD co-existence detection` | No MGSD ref — OK as-is | 🟢 None |
| New entry | — | Add `## v2.0.0 — Rebrand: MGSD → MarkOS` entry | 🟢 Cosmetic |

---

## 4. VERSION File

| Current | Proposed | Risk |
|---------|----------|------|
| `1.0.0` | Bump to `2.0.0` (semver major for breaking npm rename) | 🟡 Versioning decision |

Note: `.agent/marketing-get-shit-done/VERSION` also contains `1.1.0` — this needs to match or be reconciled.

---

## 5. vercel.json

| Current | Proposed | Risk |
|---------|----------|------|
| No MGSD references | No changes needed | 🟢 None |

The vercel.json only contains route rewrites — all path-agnostic.

---

## 6. api/ Directory Files

| File | MGSD References | Proposed | Risk |
|------|----------------|----------|------|
| `api/config.js` | 0 (delegates to handlers.cjs) | No changes needed | 🟢 None |
| `api/submit.js` | 0 | No changes needed | 🟢 None |
| `api/approve.js` | 0 | No changes needed | 🟢 None |
| `api/status.js` | 0 | No changes needed | 🟢 None |
| `api/regenerate.js` | 0 | No changes needed | 🟢 None |

All API files are thin wrappers delegating to `handlers.cjs`. The MGSD references live in handlers.cjs.

---

## 7. onboarding/onboarding-config.json

| Field | Current | Proposed | Risk |
|-------|---------|----------|------|
| `project_slug` | `"mgsd-client"` | `"markos-client"` | 🟡 Affects ChromaDB namespace default |
| `mir_output_path` | `".mgsd-local/MIR"` | `".markos-local/MIR"` | 🟡 Must match directory rename |
| All other fields | No MGSD refs | No changes needed | 🟢 None |

---

## 8. onboarding/index.html

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| `<title>` | `Client Intelligence Onboarding` | No MGSD ref — consider `MarkOS Onboarding` | 🟢 Optional |
| PostHog snippet | Generic — no MGSD refs | No changes needed | 🟢 None |
| Form content | No MGSD refs in HTML | No changes needed | 🟢 None |

---

## 9. onboarding/onboarding.css

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| CSS classes | All generic (`.onboarding-wrapper`, `.step-section`, etc.) | No changes needed | 🟢 None |
| No MGSD-prefixed classes | — | — | 🟢 None |

---

## 10. onboarding/onboarding.js

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Comment header | `// onboarding.js — MGSD Client Onboarding v2.0` | `// onboarding.js — MarkOS Client Onboarding v2.0` | 🟢 Cosmetic |
| `STORAGE_KEY` | `'mgsd-onboarding-draft'` | `'markos-onboarding-draft'` (with migration from old key) | 🟡 Risk of losing in-progress drafts |
| `localStorage.getItem('mgsd_privacy_dismissed')` | Privacy notice key | `'markos_privacy_dismissed'` (with old-key migration) | 🟡 Minor — privacy banner re-shows once |

---

## 11. onboarding-seed.schema.json

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| `title` | `"MGSD Onboarding Seed v2.1"` | `"MarkOS Onboarding Seed v3.0"` | 🟢 Cosmetic (JSON Schema metadata only) |

Note: `onboarding-seed.json` is gitignored and generated per-user — no changes needed.

---

## 12. .gitignore

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Comment | `# MGSD gitignore` | `# MarkOS gitignore` | 🟢 Cosmetic |
| Comment | `# MGSD client overrides` | `# MarkOS client overrides` | 🟢 Cosmetic |
| Path | `.mgsd-local/` | Add `.markos-local/` (keep both during transition) | 🟡 Required |
| Path | `.mgsd-install-manifest.json` | Add `.markos-install-manifest.json` (keep both) | 🟡 Required |

---

## 13. CLAUDE.md and GEMINI.md

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| Both files | `"read .protocol-lore/QUICKSTART.md for high-efficiency agent-boot and protocol-lore/INDEX.md"` | No MGSD ref in content — but QUICKSTART.md it points to has many | 🟢 Indirect only |

The files themselves don't need changes. The `.protocol-lore/QUICKSTART.md` they reference does (covered separately).

---

## 14. ARCH-DIAGRAM.md and TECH-MAP.md

| File | MGSD References | Proposed | Risk |
|------|----------------|----------|------|
| `ARCH-DIAGRAM.md` | Title: "MGSD Architecture Diagram", topology label: "MGSD SYSTEM TOPOLOGY" | Rename to "MarkOS" | 🟢 Cosmetic |
| `TECH-MAP.md` | 40+ references: title, paths, commands, config examples, collection names | Full find-replace pass | 🟢 Cosmetic (docs only) |

---

## 15. GitHub Repository

| Item | Current | Proposed | Risk |
|------|---------|----------|------|
| Repo name | `mgsd` | `markos` | 🟡 GitHub auto-redirects; affects all clone URLs |
| Repo description | Likely MGSD-related | Update to MarkOS | 🟢 Cosmetic |
| Topics/tags | May include MGSD | Update | 🟢 Cosmetic |
| All existing links | `github.com/*/mgsd` | Auto-redirect works | 🟢 Low risk |

---

## 16. bin/install.cjs

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| JSDoc header | `"install.cjs — MGSD Interactive Installer"` | `"install.cjs — MarkOS Interactive Installer"` | 🟢 Cosmetic |
| `VERSION` path | `'.agent/marketing-get-shit-done/VERSION'` | `'.agent/markos/VERSION'` (+fallback to old) | 🟡 Must match dir rename |
| Banner text | `"MGSD Installer v${VERSION} — Marketing Get Shit Done"` | `"MarkOS Installer v${VERSION} — Marketing Operating System"` | 🟢 Cosmetic |
| `detectExistingMGSD()` | Checks `.agent/marketing-get-shit-done/VERSION` | Check both old and new `.agent/markos/VERSION` | 🟡 Migration |
| Template source | `path.join(PKG_DIR, '.agent', 'marketing-get-shit-done')` | `path.join(PKG_DIR, '.agent', 'markos')` | 🟡 Must match dir |
| Template dest | `path.join(agentDir, 'marketing-get-shit-done')` | `path.join(agentDir, 'markos')` | 🟡 Must match dir |
| Manifest path | `'.mgsd-install-manifest.json'` | `'.markos-install-manifest.json'` (+fallback) | 🟡 Migration |
| Console messages | Multiple `"MGSD"` and `"✓ MGSD protocol files installed"` | Update all | 🟢 Cosmetic |
| npx command (handle update) | `"npx marketing-get-shit-done update"` | `"npx markos update"` | 🟡 User-facing |
| AI MD append logic | Checks for `GEMINI.md`, `CLAUDE.md`, `AGENTS.md` | No MGSD ref in logic itself — OK | 🟢 None |

---

## 17. bin/update.cjs

| Reference | Current | Proposed | Risk |
|-----------|---------|----------|------|
| JSDoc header | `"update.cjs — MGSD Safe Update & Patch Engine"` | `"update.cjs — MarkOS Safe Update & Patch Engine"` | 🟢 Cosmetic |
| `NEW_VERSION` path | `'.agent/marketing-get-shit-done/VERSION'` | `'.agent/markos/VERSION'` | 🟡 Must match dir |
| Banner text | `"MGSD Update Engine v${NEW_VERSION}"` | `"MarkOS Update Engine v${NEW_VERSION}"` | 🟢 Cosmetic |
| Manifest read | `'.mgsd-install-manifest.json'` | Check both old and new | 🟡 Migration |
| `getInstalledDir()` | Returns `'.agent/marketing-get-shit-done'` path | Must return new path, migrate old | 🟡 Migration |
| `pkgAgentDir` | `'.agent/marketing-get-shit-done'` | `'.agent/markos'` | 🟡 Must match dir |
| `isLocalOverride()` | Checks `.mgsd-local/` | Check both `.markos-local/` and `.mgsd-local/` | 🟡 Migration |
| Error message | `"Run npx marketing-get-shit-done to install first"` | `"Run npx markos to install first"` | 🟢 Cosmetic |

---

## 18. Telemetry (PostHog)

| Reference | Location | Current | Proposed | Risk |
|-----------|----------|---------|----------|------|
| Env var | `telemetry.cjs:8` | `MGSD_TELEMETRY` | Support both `MGSD_TELEMETRY` and `MARKOS_TELEMETRY` | 🟡 User docs reference old |
| `$lib` property | `telemetry.cjs:32` | `'mgsd-backend-telemetry'` | `'markos-backend-telemetry'` | 🟡 Breaks PostHog dashboard filters |
| Client-side PostHog | `index.html` | Generic snippet — no MGSD | No changes needed | 🟢 None |

---

## Risk Legend

| Symbol | Meaning | Action Required |
|--------|---------|----------------|
| 🔴 | **Breaking change** — existing users' workflows break | Migration logic + deprecation bridge required |
| 🟡 | **Moderate** — functional impact, requires migration/coordination | Update with backward compatibility |
| 🟢 | **Cosmetic** — no functional impact | Simple find-replace in rebrand pass |

## Summary Statistics

| Risk Level | Count | Examples |
|------------|-------|---------|
| 🔴 Breaking | 3 | npm name, primary bin entry, npx command |
| 🟡 Moderate | ~25 | Filesystem paths, migration logic, config defaults, storage keys |
| 🟢 Cosmetic | ~40+ | Comments, doc titles, banner text, badge URLs |

---

## Migration Matrix: Old → New Path Mapping

| Old Path/Name | New Path/Name | Where Referenced |
|---------------|---------------|-----------------|
| `marketing-get-shit-done` (npm) | `markos` | package.json, all install docs |
| `.agent/marketing-get-shit-done/` | `.agent/markos/` | install.cjs, update.cjs, README, TECH-MAP |
| `.mgsd-local/` | `.markos-local/` | handlers.cjs, write-mir.cjs, server.cjs, .gitignore |
| `.mgsd-project.json` | `.markos-project.json` | handlers.cjs, chroma-client.cjs docs |
| `.mgsd-install-manifest.json` | `.markos-install-manifest.json` | install.cjs, update.cjs, .gitignore |
| `mgsd-{slug}-{section}` (ChromaDB) | `markos-{slug}-{section}` | chroma-client.cjs (6 occurrences) |
| `mgsd-onboarding-draft` (localStorage) | `markos-onboarding-draft` | onboarding.js |
| `mgsd_privacy_dismissed` (localStorage) | `markos_privacy_dismissed` | onboarding.js |
| `mgsd-client` (default slug) | `markos-client` | onboarding-config.json, handlers.cjs, server.cjs |
| `MGSD_TELEMETRY` (env var) | `MARKOS_TELEMETRY` (+ old support) | telemetry.cjs, TECH-MAP.md |
| `mgsd-backend-telemetry` ($lib) | `markos-backend-telemetry` | telemetry.cjs |
| `MGSD-IDX-000` (token IDs) | Defer to separate phase | MGSD-INDEX.md, all 317 agent files |
