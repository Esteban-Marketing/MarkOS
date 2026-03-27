# Architecture Patterns: MarkOS Rebrand

**Domain:** Brand rename — structural considerations
**Researched:** 2026-03-27

## Current Architecture

```
.agent/
├── marketing-get-shit-done/       ← MGSD protocol engine (rename target)
│   ├── MGSD-INDEX.md              ← Master token registry
│   ├── VERSION
│   ├── agents/                    ← 39 agent definitions (mgsd-*.md)
│   ├── bin/                       ← mgsd-tools.cjs + lib/
│   ├── hooks/                     ← 5 hook files
│   ├── prompts/                   ← 7 prompt templates
│   ├── references/                ← 16 reference docs
│   ├── templates/                 ← MIR, MSP, LINEAR-TASKS, generic
│   └── workflows/                 ← 27 workflow definitions
├── agents/                        ← GSD-layer agents (gsd-*.md) — NOT renaming
├── hooks/                         ← GSD-layer hooks (gsd-*.js) — NOT renaming
├── skills/                        ← Mixed: gsd-* (keep) + mgsd-* (rename)
├── get-shit-done/                 ← GSD framework — NOT renaming
├── settings.json                  ← Hook config — NOT renaming (refs GSD hooks)
└── gsd-file-manifest.json         ← GSD manifest — NOT renaming
```

## Target Architecture

```
.agent/
├── markos/                        ← Renamed from marketing-get-shit-done
│   ├── MARKOS-INDEX.md            ← Renamed from MGSD-INDEX.md
│   ├── VERSION
│   ├── agents/                    ← markos-*.md (renamed from mgsd-*.md)
│   ├── bin/                       ← markos-tools.cjs (renamed from mgsd-tools.cjs)
│   ├── hooks/                     ← Same filenames, updated content
│   ├── prompts/                   ← Same filenames, updated token IDs
│   ├── references/                ← Same filenames, updated token IDs
│   ├── templates/                 ← LINEAR-TASKS files renamed MGSD-ITM → MARKOS-ITM
│   └── workflows/                 ← mgsd-linear-sync.md → markos-linear-sync.md
├── agents/                        ← Unchanged (GSD layer)
├── hooks/                         ← Unchanged (GSD layer)
├── skills/                        ← mgsd-* dirs renamed to markos-*
│   ├── gsd-*/                     ← Unchanged
│   └── markos-*/                  ← Renamed from mgsd-*
├── get-shit-done/                 ← Unchanged
├── settings.json                  ← Unchanged
└── gsd-file-manifest.json         ← Unchanged

.markos-local/                     ← Renamed from .mgsd-local/
.markos-project.json               ← Renamed from .mgsd-project.json
.markos-install-manifest.json      ← Renamed from .mgsd-install-manifest.json
```

## Component Boundaries

| Component | Rename Scope | Cross-References |
|-----------|-------------|------------------|
| MGSD protocol engine | Full rename: dir + all contents | Referenced by skills, protocol-lore, onboarding |
| GSD framework | NO rename | References marketing-get-shit-done in subagent spawns (check) |
| Skills layer | mgsd-* dirs only | Reference MGSD agents/workflows internally |
| Protocol-lore | Content-only updates | References both MGSD commands and paths |
| Onboarding code | Content-only updates | Hardcoded paths to marketing-get-shit-done/ |

## Token ID Schema Change

```
Current: MGSD-[CLASS]-[DOMAIN]-[SEQ]
Target:  MARKOS-[CLASS]-[DOMAIN]-[SEQ]

Example: MGSD-AGT-STR-01 → MARKOS-AGT-STR-01
```

All CLASS, DOMAIN, and SEQ values remain unchanged. Only the prefix changes.

## Critical Path Dependencies

```
MARKOS-INDEX.md must exist before any agent loads
  → Agents read INDEX at boot (step 1 of navigation rule)
  → Skills route to agents by token ID
  → Hooks validate via token ID cross-references
  → Linear templates use MGSD-ITM-* IDs in filenames AND content
```

**Implication:** The rename must be atomic across the entire `.agent/marketing-get-shit-done/` subtree. A partial rename will break token resolution.

## Sources

- `.agent/marketing-get-shit-done/MGSD-INDEX.md` (full token registry)
- `.agent/settings.json` (hook configuration)
- File system enumeration of all directories
