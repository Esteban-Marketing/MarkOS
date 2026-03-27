# Research: Directory & File Rename Scope — MGSD → MarkOS

**Domain:** Filesystem rebrand audit
**Researched:** 2026-03-27
**Overall confidence:** HIGH

---

## 1. COMPLETE RENAME MAPPING TABLE

### 1A. Root-Level Files

| Current Path | Proposed Path | Type | Notes |
|---|---|---|---|
| `.mgsd-project.json` | `.markos-project.json` | Config | Written once on first `POST /submit`. Referenced in 20+ files |
| `.mgsd-install-manifest.json` | `.markos-install-manifest.json` | Config | Written by install.cjs, read by update.cjs. Gitignored |

### 1B. Root-Level Directories

| Current Path | Proposed Path | Type | File Count |
|---|---|---|---|
| `.mgsd-local/` | `.markos-local/` | Override layer | ~15+ files (gitignored, client-specific) |
| `.mgsd-local/MIR/` | `.markos-local/MIR/` | MIR overrides | Varies per install |
| `.mgsd-local/MSP/` | `.markos-local/MSP/` | MSP overrides | Varies per install |

### 1C. `.agent/marketing-get-shit-done/` → `.agent/markos/`

**This is the largest single rename: 317 files.**

#### Top-Level Files in `.agent/marketing-get-shit-done/`

| Current | Proposed | Notes |
|---|---|---|
| `.agent/marketing-get-shit-done/MGSD-INDEX.md` | `.agent/markos/MARKOS-INDEX.md` | Master token registry |
| `.agent/marketing-get-shit-done/VERSION` | `.agent/markos/VERSION` | Version tracking |

#### Agents (39 files) — `.agent/marketing-get-shit-done/agents/` → `.agent/markos/agents/`

| Current Filename | Proposed Filename |
|---|---|
| `mgsd-plan-checker.md` | `markos-plan-checker.md` |
| `mgsd-task-synthesizer.md` | `markos-task-synthesizer.md` |
| `mgsd-social-drafter.md` | `markos-social-drafter.md` |
| `mgsd-context-loader.md` | `markos-context-loader.md` |
| `mgsd-report-compiler.md` | `markos-report-compiler.md` |
| `mgsd-linear-manager.md` | `markos-linear-manager.md` |
| `mgsd-auditor.md` | `markos-auditor.md` |
| `mgsd-automation-architect.md` | `markos-automation-architect.md` |
| `mgsd-copy-drafter.md` | `markos-copy-drafter.md` |
| `mgsd-executor.md` | `markos-executor.md` |
| `mgsd-gap-auditor.md` | `markos-gap-auditor.md` |
| `mgsd-researcher.md` | `markos-researcher.md` |
| `mgsd-neuro-auditor.md` | `markos-neuro-auditor.md` |
| `mgsd-audience-intel.md` | `markos-audience-intel.md` |
| `mgsd-competitive-monitor.md` | `markos-competitive-monitor.md` |
| `mgsd-content-brief.md` | `markos-content-brief.md` |
| `mgsd-data-scientist.md` | `markos-data-scientist.md` |
| `mgsd-calendar-builder.md` | `markos-calendar-builder.md` |
| `mgsd-budget-monitor.md` | `markos-budget-monitor.md` |
| `mgsd-campaign-architect.md` | `markos-campaign-architect.md` |
| `mgsd-creative-brief.md` | `markos-creative-brief.md` |
| `mgsd-utm-architect.md` | `markos-utm-architect.md` |
| `mgsd-strategist.md` | `markos-strategist.md` |
| `mgsd-behavioral-scraper.md` | `markos-behavioral-scraper.md` |
| `mgsd-verifier.md` | `markos-verifier.md` |
| `mgsd-analyst.md` | `markos-analyst.md` |
| `mgsd-funnel-analyst.md` | `markos-funnel-analyst.md` |
| `mgsd-tracking-spec.md` | `markos-tracking-spec.md` |
| `mgsd-market-scanner.md` | `markos-market-scanner.md` |
| `mgsd-market-researcher.md` | `markos-market-researcher.md` |
| `mgsd-performance-monitor.md` | `markos-performance-monitor.md` |
| `mgsd-lead-scorer.md` | `markos-lead-scorer.md` |
| `mgsd-seo-planner.md` | `markos-seo-planner.md` |
| `mgsd-onboarder.md` | `markos-onboarder.md` |
| `mgsd-planner.md` | `markos-planner.md` |
| `mgsd-email-sequence.md` | `markos-email-sequence.md` |
| `mgsd-librarian.md` | `markos-librarian.md` |
| `mgsd-content-creator.md` | `markos-content-creator.md` |
| `mgsd-cro-hypothesis.md` | `markos-cro-hypothesis.md` |

#### CLI Tools — `.agent/marketing-get-shit-done/bin/` → `.agent/markos/bin/`

| Current | Proposed |
|---|---|
| `bin/mgsd-tools.cjs` | `bin/markos-tools.cjs` |
| `bin/lib/security.cjs` | `bin/lib/security.cjs` (no rename) |
| `bin/lib/init.cjs` | `bin/lib/init.cjs` (no rename) |
| `bin/lib/config.cjs` | `bin/lib/config.cjs` (no rename) |
| `bin/lib/core.cjs` | `bin/lib/core.cjs` (no rename) |
| `bin/lib/commands.cjs` | `bin/lib/commands.cjs` (no rename) |
| `bin/lib/verify.cjs` | `bin/lib/verify.cjs` (no rename) |
| `bin/lib/state.cjs` | `bin/lib/state.cjs` (no rename) |
| `bin/lib/phase.cjs` | `bin/lib/phase.cjs` (no rename) |
| `bin/lib/template.cjs` | `bin/lib/template.cjs` (no rename) |
| `bin/lib/frontmatter.cjs` | `bin/lib/frontmatter.cjs` (no rename) |
| `bin/lib/roadmap.cjs` | `bin/lib/roadmap.cjs` (no rename) |
| `bin/lib/milestone.cjs` | `bin/lib/milestone.cjs` (no rename) |

#### Hooks — `.agent/marketing-get-shit-done/hooks/` → `.agent/markos/hooks/`

| Current | Proposed | Notes |
|---|---|---|
| `hooks/post-execution-sync.md` | `hooks/post-execution-sync.md` | No rename (generic name) |
| `hooks/pre-campaign-check.md` | `hooks/pre-campaign-check.md` | No rename |
| `hooks/commit-msg` | `hooks/commit-msg` | No rename |
| `hooks/pre-push` | `hooks/pre-push` | No rename |
| `hooks/pre-content-check.md` | `hooks/pre-content-check.md` | No rename |

#### Workflows — `.agent/marketing-get-shit-done/workflows/` → `.agent/markos/workflows/`

| Current | Proposed |
|---|---|
| `workflows/mgsd-linear-sync.md` | `workflows/markos-linear-sync.md` |
| All other workflows (24 files) | Same filenames (no `mgsd` prefix) |

#### Templates — `.agent/marketing-get-shit-done/templates/` → `.agent/markos/templates/`

##### LINEAR-TASKS (20 files with `MGSD-ITM-` prefix)

| Current Filename | Proposed Filename |
|---|---|
| `MGSD-ITM-STR-01-audience-research.md` | `MARKOS-ITM-STR-01-audience-research.md` |
| `MGSD-ITM-STR-02-funnel-architecture.md` | `MARKOS-ITM-STR-02-funnel-architecture.md` |
| `MGSD-ITM-ANA-01-performance-review.md` | `MARKOS-ITM-ANA-01-performance-review.md` |
| `MGSD-ITM-ANA-02-ab-test-config.md` | `MARKOS-ITM-ANA-02-ab-test-config.md` |
| `MGSD-ITM-ANA-02-ab-test.md` | `MARKOS-ITM-ANA-02-ab-test.md` |
| `MGSD-ITM-ACQ-01-paid-social-setup.md` | `MARKOS-ITM-ACQ-01-paid-social-setup.md` |
| `MGSD-ITM-ACQ-02-retargeting-setup.md` | `MARKOS-ITM-ACQ-02-retargeting-setup.md` |
| `MGSD-ITM-ACQ-03-linkedin-outbound.md` | `MARKOS-ITM-ACQ-03-linkedin-outbound.md` |
| `MGSD-ITM-ACQ-04-affiliate-influencer.md` | `MARKOS-ITM-ACQ-04-affiliate-influencer.md` |
| `MGSD-ITM-CNT-01-lead-magnet.md` | `MARKOS-ITM-CNT-01-lead-magnet.md` |
| `MGSD-ITM-CNT-02-ad-copy.md` | `MARKOS-ITM-CNT-02-ad-copy.md` |
| `MGSD-ITM-CNT-03-email-sequence.md` | `MARKOS-ITM-CNT-03-email-sequence.md` |
| `MGSD-ITM-CNT-04-social-calendar.md` | `MARKOS-ITM-CNT-04-social-calendar.md` |
| `MGSD-ITM-CNT-05-landing-page-copy.md` | `MARKOS-ITM-CNT-05-landing-page-copy.md` |
| `MGSD-ITM-CNT-06-seo-article.md` | `MARKOS-ITM-CNT-06-seo-article.md` |
| `MGSD-ITM-CNT-07-case-study.md` | `MARKOS-ITM-CNT-07-case-study.md` |
| `MGSD-ITM-CNT-08-video-script.md` | `MARKOS-ITM-CNT-08-video-script.md` |
| `MGSD-ITM-COM-01-community-event.md` | `MARKOS-ITM-COM-01-community-event.md` |
| `MGSD-ITM-OPS-01-campaign-launch.md` | `MARKOS-ITM-OPS-01-campaign-launch.md` |
| `MGSD-ITM-TRK-01-utm-tracking.md` | `MARKOS-ITM-TRK-01-utm-tracking.md` |

##### Other templates (no filename rename needed — generic names)

- `templates/MIR/` — ~20 category subdirs with generic filenames
- `templates/MSP/` — ~50+ files with generic filenames
- `templates/RESEARCH/` — 7 files with generic filenames  
- `templates/local-override/` — 5 files with generic names
- `templates/AGENTS/` — 2 files (generic)
- `templates/*.md` — 7 standalone templates (generic)

#### References — `.agent/marketing-get-shit-done/references/` → `.agent/markos/references/`

All 12 reference files have generic names — no filename renames needed (content-only changes).

---

### 1D. `.agent/get-shit-done/` — The GSD Core (NO RENAME)

This is the upstream **Get Shit Done** framework, not MGSD-specific. It does NOT need renaming. Structure:

- `.agent/get-shit-done/bin/gsd-tools.cjs` + `bin/lib/` (17 files)
- `.agent/get-shit-done/workflows/` (50+ files)
- `.agent/get-shit-done/references/` (10+ files)
- `.agent/get-shit-done/VERSION`

**Relationship:** GSD is the general-purpose project execution framework. MGSD/MarkOS extends it for marketing. GSD stays as-is.

---

### 1E. `.protocol-lore/` — No Filename Renames

All 11 files have generic names (`QUICKSTART.md`, `INDEX.md`, etc.). **Content** references `.mgsd-local/`, `.mgsd-project.json`, `mgsd-{slug}`, etc. heavily — but no filename changes needed.

Files needing content updates:
- `QUICKSTART.md` — 8+ references
- `MEMORY.md` — 5+ references
- `CONVENTIONS.md` — 5+ references
- `ARCHITECTURE.md` — 5+ references
- `WORKFLOWS.md` — 2+ references
- `CODEBASE-MAP.md` — 4+ references
- `TEMPLATES.md` — 2+ references

### 1F. `.planning/` — No Filename Renames

All planning files have generic names. Content references `.mgsd-local/` extensively (100+ MIR/MSP override path notes). No filename changes needed.

### 1G. `bin/` — Root-Level Executables (No Filename Renames)

| File | Has MGSD content refs? | Details |
|---|---|---|
| `bin/install.cjs` | **YES — 12+ references** | Hardcodes `marketing-get-shit-done`, `.mgsd-install-manifest.json`, `MGSD-INDEX.md` |
| `bin/update.cjs` | **YES — 8+ references** | Hardcodes `marketing-get-shit-done`, `.mgsd-install-manifest.json` |
| `bin/ensure-chroma.cjs` | **YES — 2+ references** | Reads `.mgsd-project.json` |

### 1H. `onboarding/` — No Filename Renames

| File | Has MGSD content refs? | Details |
|---|---|---|
| `onboarding/onboarding-config.json` | **YES** | `"project_slug": "mgsd-client"`, `"mir_output_path": ".mgsd-local/MIR"`, `"msp_output_path": ".mgsd-local/MSP"` |
| `onboarding/backend/path-constants.cjs` | **YES** | Hardcodes `.agent/marketing-get-shit-done/templates` |
| `onboarding/backend/chroma-client.cjs` | **YES — 8+ references** | `mgsd-${slug}` collection naming pattern |
| `onboarding/backend/server.cjs` | **YES** | References `.mgsd-project.json` |
| `onboarding/backend/handlers.cjs` | **YES** | References `.mgsd-project.json` |
| `onboarding/backend/agents/orchestrator.cjs` | **YES** | References `mgsd-neuro-auditor.md` path |
| `onboarding/backend/agents/example-resolver.cjs` | **YES** | References `.agent/marketing-get-shit-done/templates/` |

### 1I. `test/` — No Filename Renames but Content Updates

| File | References |
|---|---|
| `test/setup.js` | `mgsd-test-` temp prefix, `seedMGSD()`, `.agent/marketing-get-shit-done` |
| `test/protocol.test.js` | `.agent/marketing-get-shit-done`, `MGSD-INDEX.md`, `mgsd-onboarder.md`, `mgsd-researcher.md` |
| `test/update.test.js` | `.mgsd-local`, `MGSD-INDEX.md`, `.agent/marketing-get-shit-done`, `mgsd-researcher.md` |
| `test/write-mir.test.js` | `mgsd-mir-test-` temp prefix |
| `test/example-resolver.test.js` | `mgsd-resolver-test-` temp prefix |

### 1J. Root Documentation Files — Content Updates Only

| File | Impact |
|---|---|
| `package.json` | **CRITICAL** — name: `marketing-get-shit-done`, bin entries, description, keywords, files array, homepage, prepublishOnly script |
| `.gitignore` | References `.mgsd-local/`, `.mgsd-install-manifest.json` |
| `README.md` | 15+ references to `.mgsd-project.json`, `npx marketing-get-shit-done` |
| `TECH-MAP.md` | 50+ references (paths, commands, architecture descriptions) |
| `ARCH-DIAGRAM.md` | 15+ references |
| `CHANGELOG.md` | Historical — may keep old names with annotation |
| `CLAUDE.md` | No direct references (just points to QUICKSTART.md) |

### 1K. `.mgsd-local/` Files — Content Updates

These are gitignored client files. Existing installs have them. Content references:

| File | References |
|---|---|
| `.mgsd-local/MIR/Core_Strategy/*/` (8 files) | `<!-- OVERRIDE: .mgsd-local layer -->` comments |
| `.mgsd-local/MSP/Strategy/00_MASTER-PLAN/MARKETING-PLAN.md` | `.mgsd-local/MIR/` paths |
| `.mgsd-local/MSP/Campaigns/*.md` (3 files) | `npx marketing-get-shit-done` commands, `.mgsd-local/` references |

### 1L. `RESEARCH/` Files — Content Updates

| File | References |
|---|---|
| `RESEARCH/PRODUCT-RESEARCH.md` | `npx marketing-get-shit-done`, `.mgsd-local/` |
| `RESEARCH/ORG-PROFILE.md` | `npx marketing-get-shit-done install` |
| `RESEARCH/MARKET-TRENDS.md` | `.mgsd-local/` |

---

## 2. CHROMADB NAMESPACE PATTERN

**Current pattern:** `mgsd-{slug}` (6 collection name patterns in `chroma-client.cjs`)

| Current | Proposed |
|---|---|
| `mgsd-${slug}-${section.name}` | `markos-${slug}-${section.name}` |
| `mgsd-${slug}-meta` | `markos-${slug}-meta` |
| `mgsd-${slug}-${section}` | `markos-${slug}-${section}` |
| `mgsd-${slug}-drafts` | `markos-${slug}-drafts` |
| `mgsd-${slug}-` (prefix match for delete) | `markos-${slug}-` |
| temp file: `mgsd-${Date.now()}.json` | `markos-${Date.now()}.json` |

**Migration note:** Any existing ChromaDB instances will have `mgsd-*` collections. Need a migration function or backward-compat lookup.

---

## 3. NPM PACKAGE RENAME

| Field | Current | Proposed |
|---|---|---|
| `name` | `marketing-get-shit-done` | `markos` (or `@markos/cli`) |
| `bin.marketing-get-shit-done` | `./bin/install.cjs` | Remove |
| `bin.mgsd` | `./bin/install.cjs` | Remove (or keep as alias) |
| `bin.markos` | (doesn't exist) | `./bin/install.cjs` |
| `files[]` | `.agent/marketing-get-shit-done/` | `.agent/markos/` |
| `description` | "The Marketing Get Shit Done (MGSD) protocol..." | "MarkOS — the Marketing Operating System..." |
| `keywords` | `["mgsd", ...]` | `["markos", ...]` |
| `homepage` | `marketing-get-shit-done` | TBD |

**NPX command change:**
- Current: `npx marketing-get-shit-done install`
- Proposed: `npx markos install`

---

## 4. STATISTICS SUMMARY

| Category | Items to Rename (Files/Dirs) | Items Needing Content Updates |
|---|---|---|
| Root config files | 2 | 0 |
| Root directories | 1 (`.mgsd-local/`) | 0 |
| `.agent/marketing-get-shit-done/` dir tree | 317 files (entire subtree moves) | 100+ files need internal content updates |
| Agent files (`mgsd-*.md`) | 39 | 39 |
| LINEAR-TASKS (`MGSD-ITM-*.md`) | 20 | 20 |
| Workflow files (`mgsd-*.md`) | 1 | 1 |
| CLI tools (`mgsd-tools.cjs`) | 1 | 1 |
| Master registry (`MGSD-INDEX.md`) | 1 | 1 |
| `.protocol-lore/` | 0 | 7 |
| `.planning/` | 0 | 100+ (override path notes) |
| `bin/` executables | 0 | 3 |
| `onboarding/` | 0 | 7 |
| `test/` | 0 | 5 |
| Root docs (README, TECH-MAP, etc.) | 0 | 5 |
| `.gitignore` | 0 | 1 |
| `package.json` | 0 | 1 |
| **TOTAL** | **~383 file/dir renames** | **~290+ files need content updates** |

---

## 5. ITEMS EXPLICITLY NOT RENAMED

| Item | Why |
|---|---|
| `.agent/get-shit-done/` | GSD core framework. Not MGSD-branded. |
| `.agent/agents/gsd-*.md` | GSD agents. Not MGSD-branded. |
| `.agent/hooks/gsd-*.js` | GSD hooks. Not MGSD-branded. |
| `.agent/gsd-file-manifest.json` | GSD manifest. Not MGSD-branded. |
| `.protocol-lore/` directory | Generic directory name |
| `.planning/` directory | Generic directory name |
| `RESEARCH/` directory | Generic directory name |
| `onboarding/` directory | Generic directory name |
| `bin/` directory | Generic directory name |
| `test/` directory | Generic directory name |
