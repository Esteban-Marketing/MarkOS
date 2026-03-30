# Research Summary — MarkOS Rebrand (MARKOS → MarkOS)

**Date:** 2026-03-27
**Scope:** Complete brand identity migration from "markos" / "MARKOS" to "MarkOS"
**Owner:** esteban.marketing (markos.esteban.marketing)

---

## Executive Summary

The MARKOS → MarkOS rebrand is a **deep, codebase-wide identity migration** touching 2,500â€“3,000+ legacy references across 120+ unique files. The rebrand spans 5 distinct dimensions:

1. **NPM Package & CLI** — Breaking change: `markos` → `markos`
2. **Filesystem & Directories** — 383+ files/dirs need renaming (`.agent/markos/` is 317 alone)
3. **Agent/Skill/Command Identity** — 39 agents, 25 skills, 25+ commands, 100+ token IDs
4. **Data Layer** — Supabase + Upstash Vector namespaces, localStorage keys, telemetry identifiers
5. **Documentation & UI** — README, CHANGELOG, architecture docs, onboarding UI, protocol-lore

## Key Numbers

| Dimension | Count |
|-----------|-------|
| Total legacy references | 2,500â€“3,000+ |
| Unique files affected | 120+ |
| Agent files to rename | 39 |
| Skill directories to rename | 25 |
| Token IDs to migrate | 100+ (MARKOS-AGT-*, MARKOS-SKL-*, MARKOS-ITM-*, etc.) |
| Linear task templates to rename | 20 (MARKOS-ITM-* files) |
| MIR/MSP templates with override path notes | 60+ |
| Backend .cjs files with hardcoded paths | 15+ |
| Protocol-lore files needing content updates | 7 |
| Root docs needing updates | 5 (README, CHANGELOG, ARCH-DIAGRAM, TECH-MAP, VERSION) |

## Critical Risks

1. **npm name availability** — Must verify `markos` is available before committing
2. **Supabase + Upstash Vector data orphaning** — Existing `markos-{slug}` collections become invisible
3. **`.markos-local/` client data loss** — Gitignored directory must be explicitly migrated
4. **Partial token ID rename** — Breaks agent boot if MARKOS-INDEX references desync
5. **PostHog analytics continuity** — Dashboard filters break if `$lib` changes without bridge

## Recommended Phase Structure

6 phases, ordered by dependency and risk:

1. **Phase A: NPM Identity & CLI** — package.json, bin entries, install/update scripts
2. **Phase B: Directory & File Structure** — git mv the entire `.agent/markos/` tree, rename agent/skill/workflow files
3. **Phase C: Token System Migration** — MARKOS-INDEX.md → MARKOS-INDEX.md, all MARKOS-* token IDs → MARKOS-*
4. **Phase D: Code Path & Config Updates** — All hardcoded paths in .cjs files, onboarding config, Supabase + Upstash Vector namespaces
5. **Phase E: Documentation & UI** — README, CHANGELOG, ARCH-DIAGRAM, TECH-MAP, protocol-lore, onboarding UI
6. **Phase F: Migration & Backward Compat** — install.cjs/update.cjs migration logic, Supabase + Upstash Vector collection migration, localStorage key migration, .gitignore updates

## Research Artifacts

| File | Contents |
|------|----------|
| `LEGACY-TERM-AUDIT.md` | Exhaustive grep inventory of every legacy term with file locations |
| `RENAME-SCOPE.md` | Complete directory/file rename mapping table |
| `FEATURES.md` | Agent, skill, command, hook, token ID old→new mapping |
| `REBRAND-MAPPING.md` | NPM/distribution/public-facing rebrand with risk annotations |
| `PITFALLS.md` | 12 catalogued pitfalls (5 critical, 4 moderate, 3 minor) |
| `RENAME-PITFALLS.md` | 10 ranked pitfalls with prevention strategies |

## Boundary: What Does NOT Change

- `.agent/get-shit-done/` — The upstream GSD framework stays as-is
- `MIR/`, `MSP/`, `RESEARCH/` directory names — These are protocol concepts, not brand names
- `.planning/milestones/v1.0-phases/` — Historical records preserved (can optionally add a note)
- Core protocol concepts (MIR, MSP, ITM) — These are MarkOS concepts too

