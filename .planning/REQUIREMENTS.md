# Requirements: Marketing Get Shit Done (MGSD)

## Milestone v1.0 Requirements

### Template Overhaul
- [x] **TPL-01**: MIR templates must dynamically support any company/industry/niche.
- [x] **TPL-02**: MSP templates must be lightweight, organized, and clonable into any project.
- [x] **TPL-03**: The template infrastructure must include ultra-competitive, deep modular arrays translating all major marketing disciplines into rigorous GSD executable files.

### Skill Alignment & Override Architecture
- [x] **SKL-01**: All `mgsd-*` skills must perfectly map to the new expanded template directory structures (Phase 4).
- [x] **SKL-02**: A `.mgsd-local/` override directory convention must be defined so client customizations survive GSD and MGSD updates without being overwritten (Phase 4).

### Research Architecture
- [x] **RES-01**: A canonical `RESEARCH/` directory with 6 tokenized template files (`AUDIENCE-RESEARCH.md`, `ORG-PROFILE.md`, `PRODUCT-RESEARCH.md`, `COMPETITIVE-INTEL.md`, `MARKET-TRENDS.md`, `CONTENT-AUDIT.md`) that feed MIR and MSP fields (Phase 5).
- [x] **RES-02**: Agentic researcher (`mgsd-researcher`) that converts raw client input into insight-dense, tokenized research entries auto-triggered on `mgsd-new-project` (Phase 5).

### Client Onboarding
- [x] **ONB-01**: A white-label, step-by-step web onboarding form that collects seed data (Company, Audience, Product, Competition, Market, Content inventory) and outputs `onboarding-seed.json` (Phase 6).
- [x] **ONB-02**: An orchestrator agent reads `onboarding-seed.json` and drives research generation + MIR/MSP scaffolding automatically (Phase 6).

### NPM / CLI Distribution & Patch Engine
- [x] **NPX-01**: The npm package `marketing-get-shit-done` handles global/local installation via `npx marketing-get-shit-done` with an interactive wizard (Phase 7).
- [x] **NPX-02**: The installer detects an existing GSD install and injects MGSD commands non-destructively into the existing `.agent/` structure (Phase 7).
- [x] **PATCH-01**: `npx marketing-get-shit-done update` applies a minimal, non-destructive patch that skips `.mgsd-local/` and surfaces conflicts with a diff preview before applying (Phase 7).

### Agent Deployment
- [x] **AGT-01**: Agentic team is unpacked into the `mgsd` directory mirroring the `gsd` root folder architecture (`agents`, `hooks`, `bin`, `workflows`, etc.).
- [x] **AGT-02**: Specialized Linear PM agents exist to interface with Linear, check tasks, and assign items from `.templates/AGENTS`.

## Milestone v1.1 Requirements

### Protocol Hardening & Tokenization (Phase 8)
- [x] **HRD-01**: Resolve documentation gaps and unify the protocol codebase map.
- [x] **TOK-01**: Strict tokenization taxonomy across all templates to prevent hallucinations.
- [x] **HYB-01**: Define clear hybrid "Human+AI" team ownership and handoff patterns.

### Protocol Pillars & Execution Guards (Phase 9)
- [x] **PTL-01**: Validate generative task synthesis and event-driven DEFCON logic.
- [x] **GRD-01**: Impose strict prerequisite state checks (`project_valid`, `verification_passed`) inside CLI workflows to halt agent misfires.
- [x] **MEM-01**: Guarantee ChromeDB automated up-time on all vector commands implicitly without manual daemon tracking.

## Milestone v2.0 Requirements — MarkOS Rebrand

### NPM & CLI Identity (Phase 17)
- [ ] **RBD-01**: npm package name changed from `marketing-get-shit-done` to `markos`. `npx markos install` and `npx markos update` work end-to-end.
- [ ] **RBD-02**: Old `marketing-get-shit-done` npm package publishes deprecation notice redirecting to `markos`. Legacy `mgsd` bin alias retained for one major version.

### Directory & File Structure (Phase 18)
- [ ] **RBD-03**: `.agent/marketing-get-shit-done/` renamed to `.agent/markos/` — all 317+ files under the new path. 39 agent files, 25 skill dirs, 20 ITM templates, 1 workflow, 1 bin tool, and the master index all renamed from `mgsd-*`/`MGSD-*` to `markos-*`/`MARKOS-*`.
- [ ] **RBD-04**: Root config files renamed: `.mgsd-project.json` → `.markos-project.json`, `.mgsd-install-manifest.json` → `.markos-install-manifest.json`.

### Token System & Agent Identity (Phase 19)
- [ ] **RBD-05**: All 100+ internal token IDs migrated from `MGSD-*` prefix to `MARKOS-*`. Master registry `MARKOS-INDEX.md` fully regenerated.
- [ ] **RBD-06**: All agent/skill/hook frontmatter `name:` fields updated from `mgsd-*` to `markos-*`. Cross-references resolve correctly.

### Code & Data Layer (Phase 20)
- [ ] **RBD-07**: All hardcoded paths in 15+ backend `.cjs` files updated to reference `.agent/markos/`, `.markos-local/`, `.markos-project.json`.
- [ ] **RBD-08**: ChromaDB namespace pattern changed from `mgsd-{slug}` to `markos-{slug}` with backward-compatible collection detection.
- [ ] **RBD-09**: Telemetry env var supports both `MARKOS_TELEMETRY` (primary) and `MGSD_TELEMETRY` (legacy fallback). localStorage keys migrated.

### Documentation & UI (Phase 21)
- [ ] **RBD-10**: All public-facing docs (README, CHANGELOG, ARCH-DIAGRAM, TECH-MAP) fully MarkOS-branded. Install commands reference `npx markos`.
- [ ] **RBD-11**: All protocol-lore files, MIR/MSP template override path notes, RESEARCH files, and onboarding UI updated. Zero legacy terms outside historical milestone records.

### Migration & Backward Compat (Phase 22)
- [ ] **RBD-12**: `bin/install.cjs` detects existing MGSD installs and auto-migrates directories, manifests, and config files to MarkOS equivalents.
- [ ] **RBD-13**: `.mgsd-local/` auto-migrated to `.markos-local/` — client data preserved, never lost.
- [ ] **RBD-14**: ChromaDB migration function copies `mgsd-*` collections to `markos-*` equivalents. End-to-end migration test passes.

## Out of Scope
- Codebase management tools (covered by `gsd`), unless marketing specific (e.g., website repos).
- Auto-overwriting client files during patch updates.

## Definitions of Done
- `npx marketing-get-shit-done` installs a complete MGSD + GSD co-existence setup in a single command.
- `.mgsd-local/` overrides survive both GSD and MGSD updates.
- Research files are auto-generated from onboarding seed and feed MIR/MSP context tokens.
- Web onboarding UI collects all client data and populates the full research + strategy scaffold.
- The patch engine diffs and applies updates safely, surfacing conflicts for human review.
