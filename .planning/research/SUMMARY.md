# Research Summary: MarkOS Rebrand — Agent, Skill & Command Scope

**Domain:** Brand rename audit (MGSD → MarkOS)
**Researched:** 2026-03-27
**Overall confidence:** HIGH

## Executive Summary

The MGSD project contains **three distinct layers** of branding that must be renamed:

1. **MGSD marketing protocol layer** (`.agent/marketing-get-shit-done/`) — 39 agent files, 25 skill files, 27 workflows, 5 hooks, 1 bin tool, 1 master index, 6+ prompts, 22 Linear task templates, all heavily prefixed with `mgsd-` and `MGSD-`.

2. **Infrastructure/config layer** — `.mgsd-project.json`, `.mgsd-local/`, `.mgsd-install-manifest.json`, `mgsd_privacy_accepted` localStorage key, `mgsd-{project_slug}` ChromaDB namespace, and the npm package `marketing-get-shit-done`.

3. **Documentation layer** — `.protocol-lore/` files (QUICKSTART, WORKFLOWS, ARCHITECTURE, CONVENTIONS, MEMORY, CODEBASE-MAP), TECH-MAP.md, ARCH-DIAGRAM.md, RESEARCH/ files, and all MIR/MSP override path references.

The token ID system (`MGSD-AGT-STR-01`, etc.) pervades the entire registry and will need a global prefix change to `MOS-` or `MARKOS-`.

## Key Findings

**Stack:** No technology changes — this is purely a naming/branding pass
**Architecture:** Directory rename `.agent/marketing-get-shit-done/` → `.agent/markos/`
**Critical pitfall:** The token ID prefix `MGSD-` is embedded in 100+ cross-references across all agent/hook/reference files — needs atomic rename to avoid broken references

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Token & Registry Rename** - Rename MGSD-INDEX.md → MARKOS-INDEX.md, update all MGSD- token prefixes to MARKOS-
   - Addresses: Master index, all cross-references
   - Avoids: Broken token lookups mid-rename

2. **Phase 2: Agent File Rename** - Rename all 39 `mgsd-*.md` agent files → `markos-*.md` + update internal names
   - Addresses: Agent definitions
   - Avoids: Agent dispatch failures

3. **Phase 3: Skill & Workflow Rename** - Rename all 25 `mgsd-*` skill dirs and 27 workflow files
   - Addresses: Skill routing, command dispatch

4. **Phase 4: Infrastructure Rename** - `.mgsd-local/` → `.markos-local/`, `.mgsd-project.json` → `.markos-project.json`, etc.
   - Addresses: Config paths, ChromaDB namespace

5. **Phase 5: Documentation & Content Update** - protocol-lore, TECH-MAP, ARCH-DIAGRAM, RESEARCH/, MIR/MSP override paths
   - Addresses: All prose references

6. **Phase 6: npm Package Rename** - `marketing-get-shit-done` → `markos` (or `@markos/cli`)
   - Addresses: Distribution, install command

**Phase ordering rationale:**
- Token registry first (everything depends on it)
- Files must be renamed before content references are updated
- npm package rename is last (external-facing, irreversible)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Agent files | HIGH | Full file listing via file_search confirmed |
| Skill files | HIGH | All 25 mgsd-* skill dirs confirmed |
| Workflows | HIGH | Full listing confirmed |
| Hooks | HIGH | All 5 hooks confirmed |
| Token IDs | HIGH | MGSD-INDEX.md read in full |
| Infrastructure | HIGH | grep confirmed all .mgsd-* paths |
| Documentation | HIGH | All protocol-lore files searched |

## Gaps to Address

- Exact npm package name for MarkOS not decided (`markos`, `@markos/cli`, `markos-marketing`)
- Token ID prefix choice: `MARKOS-` vs `MOS-` (shorter = less token usage)
- Whether GSD-layer files (`.agent/agents/gsd-*`, `.agent/skills/gsd-*`) also need renaming (out of scope for this audit)
