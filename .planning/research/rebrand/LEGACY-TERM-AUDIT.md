# Legacy Term Audit â€” MARKOS â†’ MarkOS Rebrand

**Audited:** 2026-03-27  
**Method:** Exhaustive grep across entire codebase (all file types)  
**Note:** Several searches hit the result cap (200â€“500). Actual counts are **minimums** â€” true totals are higher.

---

## Summary of Findings

| Term Pattern | Min. Occurrences | Unique Files | Severity |
|---|---|---|---|
| `markos` (any case) | 1,000+ | 120+ | CRITICAL â€” pervasive |
| `markos` | 200+ | 70+ | CRITICAL â€” package name, paths |
| `MarkOS` (spaces) | 16 | 13 | MODERATE â€” display text only |
| `get-shit-done` (without marketing-) | 200+ | 60+ | CRITICAL â€” includes path references |
| `.markos-local` | 200+ | 80+ | CRITICAL â€” filesystem convention |
| `.markos-project.json` | 25 | 18 | HIGH â€” config file name |
| `.markos-install-manifest.json` | 40 | 20 | HIGH â€” install infrastructure |
| `MARKOS_TELEMETRY` | 11 | 8 | MODERATE â€” env var |
| `markos_privacy_accepted` | 3 | 3 | LOW â€” localStorage key |
| `markos-backend-telemetry` | 2 | 2 | LOW â€” PostHog `$lib` value |
| `markos-{project_slug}` (Supabase + Upstash Vector) | 13 | 10 | HIGH â€” data namespace |
| `MARKOS-INDEX.md` | 100+ | 40+ | CRITICAL â€” master registry filename |
| `markos-*` agent/skill names | 200+ | 80+ | CRITICAL â€” all agent identifiers |
| `MARKOS-` token prefixes | 500+ | 100+ | CRITICAL â€” all token IDs |

**Estimated total legacy references: 2,500â€“3,000+**

---

## 1. `markos` (hyphenated, package name)

### Code Files (HIGHEST PRIORITY â€” functional)

| File | Occurrences | Context |
|---|---|---|
| `package.json` | 3+ | `"name"`, `"bin"`, `"files"`, keywords |
| `package-lock.json` | 3+ | Package name, bin mapping |
| `bin/install.cjs` | 3 | Banner text, `.ai.md` append, path resolution |
| `bin/update.cjs` | 2 | Error message, path resolution |
| `onboarding/backend/server.cjs` | 1 | Path comment |
| `onboarding/backend/agents/example-resolver.cjs` | 2 | Path comments |
| `onboarding/backend/agents/orchestrator.cjs` | 1 | Agent path resolution (hardcoded) |
| `.agent/markos/bin/lib/core.cjs` | 3 | Display text, comment |
| `.agent/markos/bin/markos-tools.cjs` | 6 | Display text, path refs |
| `test/setup.js` | 2+ | Test fixtures, path construction |
| `test/update.test.js` | 2+ | Test path construction |
| `test/protocol.test.js` | 1+ | Test assertions |

### Config Files

| File | Occurrences | Context |
|---|---|---|
| `.claude/settings.json` | 1 | Path reference |
| `onboarding/onboarding-config.json` | 1 | Comment/path |

### .agent/ Directory (agent protocol files â€” **317+ files**)

The entire `.agent/markos/` directory is the legacy name. Every file within it exists under this path. Key internal references:

| File | Occurrences | Context |
|---|---|---|
| `MARKOS-INDEX.md` | Self-referential | Master registry |
| `agents/markos-onboarder.md` | 3+ | Path references |
| `agents/markos-researcher.md` | 3+ | Path references |
| `agents/markos-auditor.md` | 2+ | Path references |
| `agents/markos-analyst.md` | 1+ | Path references |
| `workflows/new-project.md` | 2+ | Path references |
| `templates/local-override/.gitignore` | 1 | Reference |
| `references/*.md` (9 files) | 2 each | Path in frontmatter |
| All `skills/markos-*/SKILL.md` | Multiple | Path references |

### Documentation (root docs)

| File | Occurrences | Context |
|---|---|---|
| `TECH-MAP.md` | 8+ | Install commands, directory tree, paths |
| `ARCH-DIAGRAM.md` | 5+ | Install commands, directory references |
| `README.md` | 4+ | Install commands, docs link |
| `RESEARCH/ORG-PROFILE.md` | 1 | npx command in research content |
| `RESEARCH/PRODUCT-RESEARCH.md` | 3 | Install commands, use cases |

### .markos-local/ (populated client data)

| File | Occurrences | Context |
|---|---|---|
| `MIR/Core_Strategy/01_COMPANY/PROFILE.md` | 1 | Product description |
| `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | 1 | Usage example |
| `MIR/Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | 1 | Feature table |
| `MIR/Core_Strategy/02_BUSINESS/LEAN-CANVAS.md` | 1 | Solution description |
| `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | 1 | Event tracking |
| `MSP/Strategy/00_MASTER-PLAN/MARKETING-PLAN.md` | 1 | Funnel description |
| `MSP/Campaigns/02_SEO_ORGANIC.md` | 6 | Keywords, npm URL, search terms |
| `MSP/Campaigns/04_CONTENT_SOCIAL.md` | 6+ | Social posts, CTAs, thread content |

### .planning/ (milestone & planning docs)

This is the **single largest concentration**. Every phase (01â€“07) references `markos` extensively in PLAN.md, CONTEXT.md, VERIFICATION.md, and SUMMARY.md files. Key files:

| File | Occurrences | Context |
|---|---|---|
| `milestones/v1.0-phases/07-*/07-01-PLAN.md` | 30+ | Package creation, install wizard |
| `milestones/v1.0-phases/07-*/07-02-PLAN.md` | 15+ | Update engine |
| `milestones/v1.0-phases/07-*/07-CONTEXT.md` | 15+ | Distribution specs |
| `milestones/v1.0-phases/06-*/06-02-PLAN.md` | 10+ | Onboarder agent |
| `milestones/v1.0-phases/05-*/*.md` (6 files) | 40+ | Research architecture |
| `milestones/v1.0-phases/04-*/*.md` (10 files) | 40+ | Skill and override architecture |
| `milestones/v1.0-phases/01-*/PLAN.md` | 4 | Template restructuring |
| `milestones/v1.0-phases/02-*/PLAN.md` | 5 | Agent deployment |
| `milestones/v1.0-phases/03-*/PLAN.md` | 2 | Matrix expansion |
| `MSP/Lifecycle_Email/01_STRATEGY.md` | 1 | Template inject reference |

### .protocol-lore/ (agent boot context)

| File | Occurrences | Context |
|---|---|---|
| `QUICKSTART.md` | 1 | Path to MARKOS-INDEX |
| `CODEBASE-MAP.md` | 5+ | Directory listings, file references |
| `ARCHITECTURE.md` | 0 | (Uses abbreviated paths) |

---

## 2. `.markos-local/` (client override directory)

**200+ occurrences across 80+ files.** This is the second most pervasive term.

### Code Files (functional)

| File | Occurrences | Context |
|---|---|---|
| `onboarding/backend/server.cjs` | 3 | `LOCAL_MIR_PATH` constant, comments |
| `onboarding/backend/handlers.cjs` | 1 | Default MIR output path |
| `onboarding/backend/write-mir.cjs` | 5 | JIT-clone target, path parameter |
| `onboarding/backend/agents/mir-filler.cjs` | 4 | Output file paths in comments |
| `onboarding/backend/agents/msp-filler.cjs` | 3 | Output file paths in comments |
| `onboarding/onboarding-config.json` | 2 | `mir_output_path`, `msp_output_path` |
| `bin/update.cjs` | 5+ | `isLocalOverride()`, skip logic |
| `.gitignore` | 1 | Exclusion rule |

### Template Override Comments (MIR â€” 30+ files)

Every MIR template contains:
```
> [!NOTE] OVERRIDE PATH: Copy this file to `.markos-local/MIR/...` to customize it safely.
```

Files: All MIR/ templates across `Core_Strategy/`, `Market_Audiences/`, `Products/`, `Operations/`, `Campaigns_Assets/`

### Template Override Comments (MSP â€” 30+ files)

Every MSP template contains similar `OVERRIDE PATH` notes:

Files: All MSP/ templates across `Strategy/`, `Inbound/`, `Outbound/`, `Social/`, `Community_Events/`, `Campaigns/`, `Lifecycle_Email/`

### .markos-local/ directory itself (client data â€” 12+ populated files)

Every file inside `.markos-local/` contains an OVERRIDE comment referencing the path:
```html
<!-- OVERRIDE: .markos-local layer â€” this file overrides .planning/MIR/... -->
```

### Documentation & planning

| File | Occurrences | Context |
|---|---|---|
| `TECH-MAP.md` | 17+ | Override architecture, directory tree |
| `ARCH-DIAGRAM.md` | 10+ | Flow diagrams, component descriptions |
| `RESEARCH/MARKET-TRENDS.md` | 1 | Privacy design reference |
| `RESEARCH/PRODUCT-RESEARCH.md` | 5 | Feature descriptions |
| `.protocol-lore/QUICKSTART.md` | 2 | Quick reference, ls command |
| `.protocol-lore/CONVENTIONS.md` | 5 | Override rules |
| `.protocol-lore/ARCHITECTURE.md` | 3 | Path references |
| `.protocol-lore/WORKFLOWS.md` | 1 | Onboarding flow |
| `.protocol-lore/CODEBASE-MAP.md` | 8+ | Directory listings |
| `.protocol-lore/TEMPLATES.md` | 2 | Override detection |
| All milestone PLAN/CONTEXT files | 50+ | Pervasive |

---

## 3. `.markos-project.json` (project config file)

**25 occurrences across 18 files.**

### Code

| File | Occurrences | Context |
|---|---|---|
| `onboarding/backend/server.cjs` | 1 | Comment/path |
| `onboarding/backend/handlers.cjs` | 1 | `path.resolve(PROJECT_ROOT, '.markos-project.json')` |
| `onboarding/backend/vector-store-client.cjs` | 2 | Comment references |
| `bin/ensure-vector.cjs` | 1 | Comment reference |

### Documentation

| File | Occurrences | Context |
|---|---|---|
| `TECH-MAP.md` | 4 | Config description, directory tree |
| `README.md` | 2 | Directory listing, state reference |
| `.protocol-lore/MEMORY.md` | 5 | Supabase + Upstash Vector namespace source |
| `.protocol-lore/CONVENTIONS.md` | 1 | Slug source rule |
| `.protocol-lore/QUICKSTART.md` | 2 | Quick reference, cat command |
| `.protocol-lore/WORKFLOWS.md` | 1 | Onboarding flow |
| `.protocol-lore/CODEBASE-MAP.md` | 2 | File listing |

---

## 4. `.markos-install-manifest.json` (install tracking)

**40 occurrences across 20 files.**

### Code

| File | Occurrences | Context |
|---|---|---|
| `bin/install.cjs` | 3 | Path construction, success message |
| `bin/update.cjs` | 5 | Path construction, error message, write |
| `test/setup.js` | 2 | Test fixture creation |
| `test/install.test.js` | 1 | Assertion |
| `.gitignore` | 1 | Exclusion |
| `.agent/.../templates/local-override/.gitignore` | 1 | Exclusion |
| `.agent/.../workflows/new-project.md` | 1 | Gitignore append |

### Documentation & Planning

| File | Occurrences | Context |
|---|---|---|
| `TECH-MAP.md` | 3 | Description, directory tree |
| `.protocol-lore/QUICKSTART.md` | 1 | Description |
| `.protocol-lore/CODEBASE-MAP.md` | 2 | File references |
| Milestone 07 files | 15+ | Install/update specs |
| Milestone 04 files | 2 | Gitignore reference |

---

## 5. `MARKOS_TELEMETRY` (environment variable)

**11 occurrences across 8 files.**

### Code (functional)

| File | Occurrences | Context |
|---|---|---|
| `onboarding/backend/agents/telemetry.cjs` | 1 | `process.env.MARKOS_TELEMETRY !== 'false'` |
| `onboarding/backend/handlers.cjs` | 1 | `process.env.MARKOS_TELEMETRY !== 'false'` |

### Documentation

| File | Occurrences | Context |
|---|---|---|
| `TECH-MAP.md` | 2 | Env var documentation |
| `RESEARCH/PRODUCT-RESEARCH.md` | 1 | Feature description |
| Planning phase 10 files | 4 | Telemetry phase specs |
| Rebrand research files | 2 | Self-referential |

---

## 6. `markos_privacy_accepted` (localStorage key)

**3 occurrences across 3 files.**

| File | Context |
|---|---|
| `.protocol-lore/WORKFLOWS.md` | Gate description |
| `.protocol-lore/CODEBASE-MAP.md` | UI privacy banner logic |
| `.planning/research/SUMMARY.md` | Research reference |

**Note:** Also likely present in `onboarding/index.html` or frontend JS (not captured in grep â€” check HTML files).

---

## 7. `markos-backend-telemetry` (PostHog `$lib` identifier)

**2 occurrences.**

| File | Context |
|---|---|
| `onboarding/backend/agents/telemetry.cjs` | `$lib: 'markos-backend-telemetry'` â€” **hardcoded string** |
| `.planning/research/rebrand/SUMMARY.md` | Self-referential research note |

---

## 8. `markos-{project_slug}` (Supabase + Upstash Vector collection namespace)

**13 occurrences across 10 files.**

### Code

| File | Context |
|---|---|
| `onboarding/backend/vector-store-client.cjs` | Collection naming convention |

### Documentation

| File | Context |
|---|---|
| `TECH-MAP.md` | Namespace description |
| `README.md` | Directory listing description |
| `RESEARCH/PRODUCT-RESEARCH.md` | Feature description |
| `.protocol-lore/MEMORY.md` | Supabase + Upstash Vector instance URL, slug rules |
| `.protocol-lore/CONVENTIONS.md` | Collection naming rule |
| `.protocol-lore/QUICKSTART.md` | Quick reference |
| `.protocol-lore/CODEBASE-MAP.md` | Per-project collection description |

---

## 9. `MARKOS-INDEX.md` (master registry filename)

**100+ occurrences across 40+ files.**

### The file itself

- `/.agent/markos/MARKOS-INDEX.md` â€” the actual master registry. Must be renamed.

### Code / Tests

| File | Occurrences | Context |
|---|---|---|
| `test/protocol.test.js` | 1 | Expected file assertion |
| `test/update.test.js` | 2 | Local override test, path construction |
| `test/setup.js` | 2 | Fixture creation, manifest hash |

### Agent Files (every agent references it)

Every `.agent/markos/agents/markos-*.md` file contains:
```yaml
- MARKOS-IDX-000    # MARKOS-INDEX.md â€” master registry
```
And a cross-reference table entry:
```
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point â€” indexes this agent |
```

**Files:** `markos-auditor.md`, `markos-researcher.md`, `markos-analyst.md`, `markos-onboarder.md`

### Reference Files (every reference doc references it)

Every `.agent/markos/references/*.md` file contains the same frontmatter reference. **9 reference files.**

### Documentation & Planning

Pervasive across TECH-MAP.md, README.md, `.protocol-lore/CODEBASE-MAP.md`, all milestone phase plans.

---

## 10. `MARKOS-` Token ID Prefixes

**500+ occurrences across 100+ files.** These are the structured token IDs used throughout the protocol system.

### Token families

| Prefix | Meaning | Example | Files |
|---|---|---|---|
| `MARKOS-RES-` | RESEARCH tokens | `MARKOS-RES-ORG-01` | Templates, INDEX, agents |
| `MARKOS-MIR-` | MIR template tokens | `MARKOS-MIR-COR-01` | All MIR templates |
| `MARKOS-MSP-` | MSP template tokens | `MARKOS-MSP-STR-01` | All MSP templates |
| `MARKOS-AGT-` | Agent tokens | `MARKOS-AGT-RES-01` | Agent definitions, INDEX |
| `MARKOS-IDX-` | Index entries | `MARKOS-IDX-000` | Every agent, every reference |
| `MARKOS-REF-` | Reference tokens | `MARKOS-REF-PHZ-01` | Reference docs |
| `MARKOS-WKF-` | Workflow tokens | `MARKOS-WKF-001` | Workflow definitions |
| `MARKOS-SKL-` | Skill tokens | `MARKOS-SKL-NWP-01` | Skill definitions |
| `MARKOS-HK-` | Hook tokens | `MARKOS-HK-001` | Hook definitions |

### Location density

These appear in every `.agent/markos/` file's YAML frontmatter (`token_id:`, `dependencies:`), cross-reference tables, and document headers. With 39 agents, 25 skills, 27 workflows, 9 references, 5 hooks, plus the INDEX and templates â€” this is 100+ files with 3â€“5 tokens each = **500+ minimum**.

---

## 11. `markos-*` Agent & Skill Names

**200+ occurrences across 80+ files.** These are the concrete agent personas, skill commands, and tool names.

### Agent Names (25+ unique agents)

| Agent Name | Files Where Referenced |
|---|---|
| `markos-onboarder` | agents/*.md, CONTEXT files, PLAN files, TECH-MAP, TEAM.md, RESEARCH files |
| `markos-strategist` | agents/*.md, all MIR templates (AGENT LOGIC), TECH-MAP, TEAM.md |
| `markos-planner` | agents/*.md, MSP templates, TECH-MAP, TEAM.md |
| `markos-researcher` | agents/*.md, CONTEXT/PLAN files (phase 5), RESEARCH files |
| `markos-content-creator` | agents/*.md, MIR/MSP templates, TECH-MAP |
| `markos-content-brief` | TECH-MAP |
| `markos-copy-drafter` | MIR templates (AGENT LOGIC), TECH-MAP |
| `markos-neuro-auditor` | orchestrator.cjs (hardcoded path), TECH-MAP, TEAM.md |
| `markos-linear-manager` | All MIR templates (assigned agent), TECH-MAP |
| `markos-content-manager` | MIR Campaigns_Assets templates |
| `markos-executor` | MIR templates (AGENT LOGIC) |
| `markos-social-drafter` | MSP Social templates, TECH-MAP |
| `markos-email-sequence` | TECH-MAP |
| `markos-seo-planner` | MSP Inbound templates, TECH-MAP |
| `markos-cro-hypothesis` | TECH-MAP |
| `markos-campaign-architect` | TECH-MAP, MSP Outbound |
| `markos-plan-checker` | TECH-MAP |
| `markos-task-synthesizer` | TECH-MAP |
| `markos-creative-director` | TECH-MAP |
| `markos-gap-auditor` | TECH-MAP |
| `markos-verifier` | TECH-MAP |
| `markos-calendar-builder` | MSP Community_Events, TECH-MAP |
| `markos-budget-monitor` | TECH-MAP |
| `markos-tracking-spec` | TECH-MAP |
| `markos-auditor` | agents/markos-auditor.md |
| `markos-analyst` | agents/markos-analyst.md |
| `markos-session-report` | 04-03-SUMMARY |

### Skill Names (9+ skills)

| Skill Name | Primary File |
|---|---|
| `markos-new-project` | `.agent/skills/markos-new-project/SKILL.md` |
| `markos-plan-phase` | `.agent/skills/markos-plan-phase/SKILL.md` |
| `markos-execute-phase` | `.agent/skills/markos-execute-phase/SKILL.md` |
| `markos-discuss-phase` | `.agent/skills/markos-discuss-phase/SKILL.md` |
| `markos-verify-work` | `.agent/skills/markos-verify-work/SKILL.md` |
| `markos-research-phase` | `.agent/skills/markos-research-phase/SKILL.md` |
| `markos-linear-sync` | `.agent/skills/markos-linear-sync/SKILL.md` |
| `markos-progress` | `.agent/skills/markos-progress/SKILL.md` |
| `markos-health` | Referenced in protocol docs |

### Tool/Binary Names

| Name | File | Context |
|---|---|---|
| `markos-tools.cjs` | `.agent/markos/bin/markos-tools.cjs` | CLI tool |
| `markos` bin alias | `package.json` `"bin"` field | CLI binary alias |

---

## 12. `get-shit-done` (without marketing- prefix)

**200+ occurrences across 60+ files.** Overlaps heavily with `markos` but also includes standalone GSD references:

### Standalone GSD references (not part of `markos`)

| File | Context |
|---|---|
| `TECH-MAP.md` L1356 | `get-shit-done/` â€” GSD protocol (separate repo) |
| `.planning/MIR/README.md` | "submit changes via PR to the get-shit-done repo" |
| `.planning/MIR/SETUP.md` | `git clone .../get-shit-done.git` |
| `.planning/MSP/SETUP.md` | `git clone .../get-shit-done.git` |
| `.planning/MIR/Operations/10_OPERATIONS/CONTACTS.md` | "get-shit-done Repo" |
| `.planning/MIR/Operations/10_OPERATIONS/WORKFLOWS.md` | "Clone MIR template from get-shit-done repo" |
| Phase 02 VERIFICATION.md | "mirrors `.agent/get-shit-done/`" |
| Phase 02 PLAN.md | References to GSD architecture |
| Phase 07 CONTEXT | `.agent/get-shit-done/VERSION` detection |
| Phase 03 PLAN.md | "workflows in `.agent/get-shit-done`" |

**Note:** Some of these reference the **parent GSD protocol** (a separate repo/product), not MARKOS. These should be evaluated individually â€” some may intentionally remain as `get-shit-done` if they refer to the parent project.

---

## Priority Classification for Rebrand

### P0 â€” BREAKING (must change atomically)
- `package.json` name: `markos`
- `package.json` bin: `markos`, `markos`
- `npx markos` commands everywhere
- `.agent/markos/` directory name
- `bin/install.cjs` â€” hardcoded paths and banner
- `bin/update.cjs` â€” hardcoded paths and error messages

### P1 â€” FUNCTIONAL (breaks update/install if not migrated)
- `.markos-local/` â€” directory convention (code + templates)
- `.markos-project.json` â€” project config filename
- `.markos-install-manifest.json` â€” install tracking filename  
- `markos-{project_slug}` â€” Supabase + Upstash Vector collection prefix
- `MARKOS_TELEMETRY` â€” env var
- `markos_privacy_accepted` â€” localStorage key
- `markos-backend-telemetry` â€” PostHog lib identifier
- `MARKOS-INDEX.md` â€” master registry filename

### P2 â€” PROTOCOL (agent system works but shows old branding)
- All `MARKOS-` token ID prefixes (500+)
- All `markos-*` agent names (25+ agents)
- All `markos-*` skill names (9+ skills)
- `markos-tools.cjs` â€” tool binary name
- Agent LOGIC references in MIR/MSP templates

### P3 â€” DOCUMENTATION (no functional impact)
- TECH-MAP.md, ARCH-DIAGRAM.md, README.md
- All `.planning/milestones/` historical docs
- RESEARCH/ files
- `.protocol-lore/` boot context
- `.markos-local/` populated content referencing old name

### P4 â€” HISTORICAL (consider keeping as-is)
- `.planning/milestones/v1.0-phases/` â€” completed phase docs (historical record)
- Some GSD parent protocol references that should remain

---

## Files Requiring No Changes (out of scope)

- `node_modules/` â€” regenerated on install
- `.git/` â€” git internal
- Binary/image files â€” none found with legacy terms
- `.planning/research/rebrand/` â€” these audit files themselves

---

## Automated Rename Feasibility

### Safe for find-and-replace:
- `MARKOS-` â†’ `MARKOS-` (token prefixes â€” very consistent pattern)
- `.markos-local` â†’ `.markos-local` (directory convention)
- `.markos-project.json` â†’ `.markos-project.json`
- `.markos-install-manifest.json` â†’ `.markos-install-manifest.json`
- `MARKOS_TELEMETRY` â†’ `MARKOS_TELEMETRY`
- `markos_privacy_accepted` â†’ `markos_privacy_accepted`
- `markos-backend-telemetry` â†’ `markos-backend-telemetry`

### Requires manual review:
- `markos` â†’ varies (some `markos`, some `@markos/cli`, some display text)
- `markos-*` agent names â†’ `markos-*` (need to verify no collisions)
- `get-shit-done` â†’ many are parent GSD refs, not MARKOS
- `MARKOS-INDEX.md` â†’ `MARKOS-INDEX.md` (filename + all references)
- `MARKOS` in prose â†’ context-dependent (some acronym, some product name)

### Requires migration code:
- `markos-{project_slug}` â†’ `markos-{project_slug}` (Supabase + Upstash Vector data migration)
- `.agent/markos/` â†’ `.agent/markos/` (directory rename + install/update logic)
- `package.json` name change (npm deprecation package needed)

