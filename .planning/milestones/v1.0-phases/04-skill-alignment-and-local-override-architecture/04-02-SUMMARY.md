---
phase: "04"
plan: "04-02"
subsystem: "markos-local"
tags: ["overrides", "scaffolding", "protocol"]
requires: ["04-01"]
provides: [".markos-local/ scaffold capability"]
affects: ["markos-new-project", "client project structure"]
tech-stack.added: []
tech-stack.patterns: []
key-files.modified: [
  ".agent/markos/workflows/new-project.md",
  ".agent/markos/MARKOS-INDEX.md"
]
key-files.created: [
  ".agent/markos/templates/local-override/README.md",
  ".agent/markos/templates/local-override/.gitignore",
  ".agent/markos/templates/local-override/MIR/.gitkeep",
  ".agent/markos/templates/local-override/MSP/.gitkeep",
  ".agent/markos/templates/local-override/config/.gitkeep"
]
key-decisions: [
  "Documented override architecture thoroughly in MARKOS-INDEX.md to protect client customization spaces."
]
requirements-completed: ["SKL-02"]
duration: 5 min
completed: 2026-03-23T17:35:00Z
---

# Phase 04 Plan 02: .markos-local/ Override Convention & Scaffold Summary

Established the `.markos-local/` template override structure to allow client modifications that survive MARKOS patches.

## Completed Tasks

1. **Create .markos-local/ scaffold template**: Created the client `README.md`, `.gitignore`, and `.gitkeep` files to guarantee the folder tree replicates seamlessly during new project creation.
2. **Update markos-new-project**: Injected `.markos-local/` tree creation and boilerplate copying directly into `workflows/new-project.md` step 3. Clients will see their customization space directly upon initialization.
3. **Document override resolution**: Added full `Override Resolution Protocol` to `MARKOS-INDEX.md` providing hard rules for agent behavior when reading templates.

## Deviations from Plan

`04-02-T2` instructed editing `.agent/skills/markos-new-project/SKILL.md` to add bash scaffold code. However, the protocol initialization script actually lives in `.agent/markos/workflows/new-project.md`. I modified the workflow file instead to guarantee the code actually executes during init.

## Authentication Gates

None

## Next Steps

Ready for 04-03: Self-documentation layer and phase verification.
