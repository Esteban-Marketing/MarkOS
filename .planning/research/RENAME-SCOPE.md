# Research: Directory & File Rename Scope — MARKOS → MarkOS

**Domain:** Filesystem rebrand audit
**Researched:** 2026-03-27
**Overall confidence:** HIGH

---

## 1. COMPLETE RENAME MAPPING TABLE

### 1A. Root-Level Files

| Current Path | Proposed Path | Type | Notes |
|---|---|---|---|
| `.markos-project.json` | `.markos-project.json` | Config | Written once on first `POST /submit`. Referenced in 20+ files |
| `.markos-install-manifest.json` | `.markos-install-manifest.json` | Config | Written by install.cjs, read by update.cjs. Gitignored |

### 1B. Root-Level Directories

| Current Path | Proposed Path | Type | File Count |
|---|---|---|---|
| `.markos-local/` | `.markos-local/` | Override layer | ~15+ files (gitignored, client-specific) |
| `.markos-local/MIR/` | `.markos-local/MIR/` | MIR overrides | Varies per install |
| `.markos-local/MSP/` | `.markos-local/MSP/` | MSP overrides | Varies per install |

### 1C. `.agent/markos/` → `.agent/markos/`

**This is the largest single rename: 317 files.**

#### Top-Level Files in `.agent/markos/`

| Current | Proposed | Notes |
|---|---|---|
| `.agent/markos/MARKOS-INDEX.md` | `.agent/markos/MARKOS-INDEX.md` | Master token registry |
| `.agent/markos/VERSION` | `.agent/markos/VERSION` | Version tracking |

#### Agents (39 files) — `.agent/markos/agents/` → `.agent/markos/agents/`

| Current Filename | Proposed Filename |
|---|---|
| `markos-plan-checker.md` | `markos-plan-checker.md` |
| `markos-task-synthesizer.md` | `markos-task-synthesizer.md` |
| `markos-social-drafter.md` | `markos-social-drafter.md` |
| `markos-context-loader.md` | `markos-context-loader.md` |
| `markos-report-compiler.md` | `markos-report-compiler.md` |
| `markos-linear-manager.md` | `markos-linear-manager.md` |
| `markos-auditor.md` | `markos-auditor.md` |
| `markos-automation-architect.md` | `markos-automation-architect.md` |
| `markos-copy-drafter.md` | `markos-copy-drafter.md` |
| `markos-executor.md` | `markos-executor.md` |
| `markos-gap-auditor.md` | `markos-gap-auditor.md` |
| `markos-researcher.md` | `markos-researcher.md` |
| `markos-neuro-auditor.md` | `markos-neuro-auditor.md` |
| `markos-audience-intel.md` | `markos-audience-intel.md` |
| `markos-competitive-monitor.md` | `markos-competitive-monitor.md` |
| `markos-content-brief.md` | `markos-content-brief.md` |
| `markos-data-scientist.md` | `markos-data-scientist.md` |
| `markos-calendar-builder.md` | `markos-calendar-builder.md` |
| `markos-budget-monitor.md` | `markos-budget-monitor.md` |
| `markos-campaign-architect.md` | `markos-campaign-architect.md` |
| `markos-creative-brief.md` | `markos-creative-brief.md` |
| `markos-utm-architect.md` | `markos-utm-architect.md` |
| `markos-strategist.md` | `markos-strategist.md` |
| `markos-behavioral-scraper.md` | `markos-behavioral-scraper.md` |
| `markos-verifier.md` | `markos-verifier.md` |
| `markos-analyst.md` | `markos-analyst.md` |
| `markos-funnel-analyst.md` | `markos-funnel-analyst.md` |
| `markos-tracking-spec.md` | `markos-tracking-spec.md` |
| `markos-market-scanner.md` | `markos-market-scanner.md` |
| `markos-market-researcher.md` | `markos-market-researcher.md` |
| `markos-performance-monitor.md` | `markos-performance-monitor.md` |
| `markos-lead-scorer.md` | `markos-lead-scorer.md` |
| `markos-seo-planner.md` | `markos-seo-planner.md` |
| `markos-onboarder.md` | `markos-onboarder.md` |
| `markos-planner.md` | `markos-planner.md` |
| `markos-email-sequence.md` | `markos-email-sequence.md` |
| `markos-librarian.md` | `markos-librarian.md` |
| `markos-content-creator.md` | `markos-content-creator.md` |
| `markos-cro-hypothesis.md` | `markos-cro-hypothesis.md` |

#### CLI Tools — `.agent/markos/bin/` → `.agent/markos/bin/`

| Current | Proposed |
|---|---|
| `bin/markos-tools.cjs` | `bin/markos-tools.cjs` |
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

#### Hooks — `.agent/markos/hooks/` → `.agent/markos/hooks/`

| Current | Proposed | Notes |
|---|---|---|
| `hooks/post-execution-sync.md` | `hooks/post-execution-sync.md` | No rename (generic name) |
| `hooks/pre-campaign-check.md` | `hooks/pre-campaign-check.md` | No rename |
| `hooks/commit-msg` | `hooks/commit-msg` | No rename |
| `hooks/pre-push` | `hooks/pre-push` | No rename |
| `hooks/pre-content-check.md` | `hooks/pre-content-check.md` | No rename |

#### Workflows — `.agent/markos/workflows/` → `.agent/markos/workflows/`

| Current | Proposed |
|---|---|
| `workflows/markos-linear-sync.md` | `workflows/markos-linear-sync.md` |
| All other workflows (24 files) | Same filenames (no `markos` prefix) |

#### Templates — `.agent/markos/templates/` → `.agent/markos/templates/`

##### LINEAR-TASKS (20 files with `MARKOS-ITM-` prefix)

| Current Filename | Proposed Filename |
|---|---|
| `MARKOS-ITM-STR-01-audience-research.md` | `MARKOS-ITM-STR-01-audience-research.md` |
| `MARKOS-ITM-STR-02-funnel-architecture.md` | `MARKOS-ITM-STR-02-funnel-architecture.md` |
| `MARKOS-ITM-ANA-01-performance-review.md` | `MARKOS-ITM-ANA-01-performance-review.md` |
| `MARKOS-ITM-ANA-02-ab-test-config.md` | `MARKOS-ITM-ANA-02-ab-test-config.md` |
| `MARKOS-ITM-ANA-02-ab-test.md` | `MARKOS-ITM-ANA-02-ab-test.md` |
| `MARKOS-ITM-ACQ-01-paid-social-setup.md` | `MARKOS-ITM-ACQ-01-paid-social-setup.md` |
| `MARKOS-ITM-ACQ-02-retargeting-setup.md` | `MARKOS-ITM-ACQ-02-retargeting-setup.md` |
| `MARKOS-ITM-ACQ-03-linkedin-outbound.md` | `MARKOS-ITM-ACQ-03-linkedin-outbound.md` |
| `MARKOS-ITM-ACQ-04-affiliate-influencer.md` | `MARKOS-ITM-ACQ-04-affiliate-influencer.md` |
| `MARKOS-ITM-CNT-01-lead-magnet.md` | `MARKOS-ITM-CNT-01-lead-magnet.md` |
| `MARKOS-ITM-CNT-02-ad-copy.md` | `MARKOS-ITM-CNT-02-ad-copy.md` |
| `MARKOS-ITM-CNT-03-email-sequence.md` | `MARKOS-ITM-CNT-03-email-sequence.md` |
| `MARKOS-ITM-CNT-04-social-calendar.md` | `MARKOS-ITM-CNT-04-social-calendar.md` |
| `MARKOS-ITM-CNT-05-landing-page-copy.md` | `MARKOS-ITM-CNT-05-landing-page-copy.md` |
| `MARKOS-ITM-CNT-06-seo-article.md` | `MARKOS-ITM-CNT-06-seo-article.md` |
| `MARKOS-ITM-CNT-07-case-study.md` | `MARKOS-ITM-CNT-07-case-study.md` |
| `MARKOS-ITM-CNT-08-video-script.md` | `MARKOS-ITM-CNT-08-video-script.md` |
| `MARKOS-ITM-COM-01-community-event.md` | `MARKOS-ITM-COM-01-community-event.md` |
| `MARKOS-ITM-OPS-01-campaign-launch.md` | `MARKOS-ITM-OPS-01-campaign-launch.md` |
| `MARKOS-ITM-TRK-01-utm-tracking.md` | `MARKOS-ITM-TRK-01-utm-tracking.md` |

##### Other templates (no filename rename needed — generic names)

- `templates/MIR/` — ~20 category subdirs with generic filenames
- `templates/MSP/` — ~50+ files with generic filenames
- `templates/RESEARCH/` — 7 files with generic filenames  
- `templates/local-override/` — 5 files with generic names
- `templates/AGENTS/` — 2 files (generic)
- `templates/*.md` — 7 standalone templates (generic)

#### References — `.agent/markos/references/` → `.agent/markos/references/`

All 12 reference files have generic names — no filename renames needed (content-only changes).

---

### 1D. `.agent/get-shit-done/` — The GSD Core (NO RENAME)

This is the upstream **Get Shit Done** framework, not MARKOS-specific. It does NOT need renaming. Structure:

- `.agent/get-shit-done/bin/gsd-tools.cjs` + `bin/lib/` (17 files)
- `.agent/get-shit-done/workflows/` (50+ files)
- `.agent/get-shit-done/references/` (10+ files)
- `.agent/get-shit-done/VERSION`

**Relationship:** GSD is the general-purpose project execution framework. MARKOS/MarkOS extends it for marketing. GSD stays as-is.

---

### 1E. `.protocol-lore/` — No Filename Renames

All 11 files have generic names (`QUICKSTART.md`, `INDEX.md`, etc.). **Content** references `.markos-local/`, `.markos-project.json`, `markos-{slug}`, etc. heavily — but no filename changes needed.

Files needing content updates:
- `QUICKSTART.md` — 8+ references
- `MEMORY.md` — 5+ references
- `CONVENTIONS.md` — 5+ references
- `ARCHITECTURE.md` — 5+ references
- `WORKFLOWS.md` — 2+ references
- `CODEBASE-MAP.md` — 4+ references
- `TEMPLATES.md` — 2+ references

### 1F. `.planning/` — No Filename Renames

All planning files have generic names. Content references `.markos-local/` extensively (100+ MIR/MSP override path notes). No filename changes needed.

### 1G. `bin/` — Root-Level Executables (No Filename Renames)

| File | Has MARKOS content refs? | Details |
|---|---|---|
| `bin/install.cjs` | **YES — 12+ references** | Hardcodes `markos`, `.markos-install-manifest.json`, `MARKOS-INDEX.md` |
| `bin/update.cjs` | **YES — 8+ references** | Hardcodes `markos`, `.markos-install-manifest.json` |
| `bin/ensure-vector.cjs` | **YES — 2+ references** | Reads `.markos-project.json` |

### 1H. `onboarding/` — No Filename Renames

| File | Has MARKOS content refs? | Details |
|---|---|---|
| `onboarding/onboarding-config.json` | **YES** | `"project_slug": "markos-client"`, `"mir_output_path": ".markos-local/MIR"`, `"msp_output_path": ".markos-local/MSP"` |
| `onboarding/backend/path-constants.cjs` | **YES** | Hardcodes `.agent/markos/templates` |
| `onboarding/backend/vector-store-client.cjs` | **YES — 8+ references** | `markos-${slug}` collection naming pattern |
| `onboarding/backend/server.cjs` | **YES** | References `.markos-project.json` |
| `onboarding/backend/handlers.cjs` | **YES** | References `.markos-project.json` |
| `onboarding/backend/agents/orchestrator.cjs` | **YES** | References `markos-neuro-auditor.md` path |
| `onboarding/backend/agents/example-resolver.cjs` | **YES** | References `.agent/markos/templates/` |

### 1I. `test/` — No Filename Renames but Content Updates

| File | References |
|---|---|
| `test/setup.js` | `markos-test-` temp prefix, `seedMARKOS()`, `.agent/markos` |
| `test/protocol.test.js` | `.agent/markos`, `MARKOS-INDEX.md`, `markos-onboarder.md`, `markos-researcher.md` |
| `test/update.test.js` | `.markos-local`, `MARKOS-INDEX.md`, `.agent/markos`, `markos-researcher.md` |
| `test/write-mir.test.js` | `markos-mir-test-` temp prefix |
| `test/example-resolver.test.js` | `markos-resolver-test-` temp prefix |

### 1J. Root Documentation Files — Content Updates Only

| File | Impact |
|---|---|
| `package.json` | **CRITICAL** — name: `markos`, bin entries, description, keywords, files array, homepage, prepublishOnly script |
| `.gitignore` | References `.markos-local/`, `.markos-install-manifest.json` |
| `README.md` | 15+ references to `.markos-project.json`, `npx markos` |
| `TECH-MAP.md` | 50+ references (paths, commands, architecture descriptions) |
| `ARCH-DIAGRAM.md` | 15+ references |
| `CHANGELOG.md` | Historical — may keep old names with annotation |
| `CLAUDE.md` | No direct references (just points to QUICKSTART.md) |

### 1K. `.markos-local/` Files — Content Updates

These are gitignored client files. Existing installs have them. Content references:

| File | References |
|---|---|
| `.markos-local/MIR/Core_Strategy/*/` (8 files) | `<!-- OVERRIDE: .markos-local layer -->` comments |
| `.markos-local/MSP/Strategy/00_MASTER-PLAN/MARKETING-PLAN.md` | `.markos-local/MIR/` paths |
| `.markos-local/MSP/Campaigns/*.md` (3 files) | `npx markos` commands, `.markos-local/` references |

### 1L. `RESEARCH/` Files — Content Updates

| File | References |
|---|---|
| `RESEARCH/PRODUCT-RESEARCH.md` | `npx markos`, `.markos-local/` |
| `RESEARCH/ORG-PROFILE.md` | `npx markos install` |
| `RESEARCH/MARKET-TRENDS.md` | `.markos-local/` |

---

## 2. VECTOR NAMESPACE PATTERN

**Current pattern:** `markos-{slug}` (6 collection name patterns in `vector-store-client.cjs`)

| Current | Proposed |
|---|---|
| `markos-${slug}-${section.name}` | `markos-${slug}-${section.name}` |
| `markos-${slug}-meta` | `markos-${slug}-meta` |
| `markos-${slug}-${section}` | `markos-${slug}-${section}` |
| `markos-${slug}-drafts` | `markos-${slug}-drafts` |
| `markos-${slug}-` (prefix match for delete) | `markos-${slug}-` |
| temp file: `markos-${Date.now()}.json` | `markos-${Date.now()}.json` |

**Migration note:** Any existing Supabase + Upstash Vector instances will have `markos-*` collections. Need a migration function or backward-compat lookup.

---

## 3. NPM PACKAGE RENAME

| Field | Current | Proposed |
|---|---|---|
| `name` | `markos` | `markos` (or `@markos/cli`) |
| `bin.markos` | `./bin/install.cjs` | Remove |
| `bin.markos` | `./bin/install.cjs` | Remove (or keep as alias) |
| `bin.markos` | (doesn't exist) | `./bin/install.cjs` |
| `files[]` | `.agent/markos/` | `.agent/markos/` |
| `description` | "The MarkOS (MARKOS) protocol..." | "MarkOS — the Marketing Operating System..." |
| `keywords` | `["markos", ...]` | `["markos", ...]` |
| `homepage` | `markos` | TBD |

**NPX command change:**
- Current: `npx markos install`
- Proposed: `npx markos install`

---

## 4. STATISTICS SUMMARY

| Category | Items to Rename (Files/Dirs) | Items Needing Content Updates |
|---|---|---|
| Root config files | 2 | 0 |
| Root directories | 1 (`.markos-local/`) | 0 |
| `.agent/markos/` dir tree | 317 files (entire subtree moves) | 100+ files need internal content updates |
| Agent files (`markos-*.md`) | 39 | 39 |
| LINEAR-TASKS (`MARKOS-ITM-*.md`) | 20 | 20 |
| Workflow files (`markos-*.md`) | 1 | 1 |
| CLI tools (`markos-tools.cjs`) | 1 | 1 |
| Master registry (`MARKOS-INDEX.md`) | 1 | 1 |
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
| `.agent/get-shit-done/` | GSD core framework. Not MARKOS-branded. |
| `.agent/agents/gsd-*.md` | GSD agents. Not MARKOS-branded. |
| `.agent/hooks/gsd-*.js` | GSD hooks. Not MARKOS-branded. |
| `.agent/gsd-file-manifest.json` | GSD manifest. Not MARKOS-branded. |
| `.protocol-lore/` directory | Generic directory name |
| `.planning/` directory | Generic directory name |
| `RESEARCH/` directory | Generic directory name |
| `onboarding/` directory | Generic directory name |
| `bin/` directory | Generic directory name |
| `test/` directory | Generic directory name |

