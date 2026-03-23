# Phase 4: Skill Alignment & Local Override Architecture — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** discuss-phase session decisions

<domain>
## Phase Boundary

Align all `mgsd-*` skills to the expanded Phase 3 template structures. Simultaneously define and implement the `.mgsd-local/` directory convention — a protected client override space that survives all GSD and MGSD patch updates without modification.
</domain>

<decisions>
## Implementation Decisions

### Skill Template Path Alignment
- All `mgsd-*` skills (`mgsd-new-project`, `mgsd-plan-phase`, `mgsd-execute-phase`, `mgsd-discuss-phase`, `mgsd-verify-work`, `mgsd-research-phase`, `mgsd-linear-sync`, etc.) must resolve template paths from `.agent/marketing-get-shit-done/templates/` using the Phase 3 expanded structure
- Skills referencing MIR or MSP templates must use correct subdirectory paths (e.g. `MIR/Core_Strategy/`, `MIR/Market_Audiences/`, `MSP/<discipline>/`)
- Each skill's SKILL.md must contain a `## Template Paths` section listing every template directory it reads or writes

### `.mgsd-local/` Override Architecture
- A `.mgsd-local/` directory at the **client project root** is the protected zone for all client customizations
- Files in `.mgsd-local/` are **NEVER** touched by `mgsd update` or GSD patches
- `.mgsd-local/` mirrors MIR/MSP structure: `.mgsd-local/MIR/`, `.mgsd-local/MSP/`, `.mgsd-local/config/`
- Agent override resolution order: `.mgsd-local/` FIRST → protocol defaults fallback
- Skills and agents that load config or templates must check `.mgsd-local/` path first

### Scaffold Integration
- `mgsd-new-project` creates `.mgsd-local/` with all subdirs and a `README.md` explaining the convention on first run
- `.mgsd-local/` is added to project `.gitignore` by default (client data is private)
- `.mgsd-local/README.md` lists every overridable path and usage instructions in plain language

### Self-Documentation
- Every SKILL.md that touches templates includes an `<!-- OVERRIDABLE: path -->` comment adjacent to each overridable template reference
- The MGSD-INDEX.md gains an "Overridable Paths" section listing all `.mgsd-local/`-compatible files

### Agent Discretion
- Specific file-copy vs. symlink strategy for override resolution
- Internal code structure of override lookup logic in mgsd-tools
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol Structure
- `.agent/marketing-get-shit-done/MGSD-INDEX.md` — master registry of all MGSD files
- `.agent/marketing-get-shit-done/templates/MIR/README.md` — MIR template structure
- `.agent/marketing-get-shit-done/templates/MIR/` — MIR subdirectories (Core_Strategy, Market_Audiences, Products, Campaigns_Assets, Operations)
- `.agent/marketing-get-shit-done/templates/MSP/` — MSP discipline templates (Phase 3 expanded)

### Skills to Align
- `.agent/skills/mgsd-new-project/SKILL.md`
- `.agent/skills/mgsd-plan-phase/SKILL.md`
- `.agent/skills/mgsd-execute-phase/SKILL.md`
- `.agent/skills/mgsd-discuss-phase/SKILL.md`
- `.agent/skills/mgsd-verify-work/SKILL.md`
- `.agent/skills/mgsd-research-phase/SKILL.md`
- `.agent/skills/mgsd-linear-sync/SKILL.md`

### Requirements
- `.planning/REQUIREMENTS.md` — SKL-01, SKL-02 must be addressed
</canonical_refs>

<specifics>
## Specific Ideas
- `.mgsd-local/` should be added to `.gitignore` via `mgsd-new-project` scaffold
- Agents should emit a log line when falling back from local override to protocol default: `[override] No .mgsd-local/X found, using protocol default`
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
