# Phase 4: Skill Alignment & Local Override Architecture — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** discuss-phase session decisions

<domain>
## Phase Boundary

Align all `markos-*` skills to the expanded Phase 3 template structures. Simultaneously define and implement the `.markos-local/` directory convention — a protected client override space that survives all GSD and MARKOS patch updates without modification.
</domain>

<decisions>
## Implementation Decisions

### Skill Template Path Alignment
- All `markos-*` skills (`markos-new-project`, `markos-plan-phase`, `markos-execute-phase`, `markos-discuss-phase`, `markos-verify-work`, `markos-research-phase`, `markos-linear-sync`, etc.) must resolve template paths from `.agent/markos/templates/` using the Phase 3 expanded structure
- Skills referencing MIR or MSP templates must use correct subdirectory paths (e.g. `MIR/Core_Strategy/`, `MIR/Market_Audiences/`, `MSP/<discipline>/`)
- Each skill's SKILL.md must contain a `## Template Paths` section listing every template directory it reads or writes

### `.markos-local/` Override Architecture
- A `.markos-local/` directory at the **client project root** is the protected zone for all client customizations
- Files in `.markos-local/` are **NEVER** touched by `markos update` or GSD patches
- `.markos-local/` mirrors MIR/MSP structure: `.markos-local/MIR/`, `.markos-local/MSP/`, `.markos-local/config/`
- Agent override resolution order: `.markos-local/` FIRST → protocol defaults fallback
- Skills and agents that load config or templates must check `.markos-local/` path first

### Scaffold Integration
- `markos-new-project` creates `.markos-local/` with all subdirs and a `README.md` explaining the convention on first run
- `.markos-local/` is added to project `.gitignore` by default (client data is private)
- `.markos-local/README.md` lists every overridable path and usage instructions in plain language

### Self-Documentation
- Every SKILL.md that touches templates includes an `<!-- OVERRIDABLE: path -->` comment adjacent to each overridable template reference
- The MARKOS-INDEX.md gains an "Overridable Paths" section listing all `.markos-local/`-compatible files

### Agent Discretion
- Specific file-copy vs. symlink strategy for override resolution
- Internal code structure of override lookup logic in markos-tools
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol Structure
- `.agent/markos/MARKOS-INDEX.md` — master registry of all MARKOS files
- `.agent/markos/templates/MIR/README.md` — MIR template structure
- `.agent/markos/templates/MIR/` — MIR subdirectories (Core_Strategy, Market_Audiences, Products, Campaigns_Assets, Operations)
- `.agent/markos/templates/MSP/` — MSP discipline templates (Phase 3 expanded)

### Skills to Align
- `.agent/skills/markos-new-project/SKILL.md`
- `.agent/skills/markos-plan-phase/SKILL.md`
- `.agent/skills/markos-execute-phase/SKILL.md`
- `.agent/skills/markos-discuss-phase/SKILL.md`
- `.agent/skills/markos-verify-work/SKILL.md`
- `.agent/skills/markos-research-phase/SKILL.md`
- `.agent/skills/markos-linear-sync/SKILL.md`

### Requirements
- `.planning/REQUIREMENTS.md` — SKL-01, SKL-02 must be addressed
</canonical_refs>

<specifics>
## Specific Ideas
- `.markos-local/` should be added to `.gitignore` via `markos-new-project` scaffold
- Agents should emit a log line when falling back from local override to protocol default: `[override] No .markos-local/X found, using protocol default`
- The scaffold README should be in plain English — no technical jargon exposed to clients
</specifics>

<deferred>
## Deferred Ideas
- Symlink-based override system (may revisit in Phase 7)
- GUI for managing overrides (Phase 6 web onboarding handles this partially)
</deferred>

---
*Phase: 04-skill-alignment-and-local-override-architecture*
*Context gathered: 2026-03-23 via discuss-phase session*
