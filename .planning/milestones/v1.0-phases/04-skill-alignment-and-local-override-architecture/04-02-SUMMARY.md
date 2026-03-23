---
phase: "04"
plan: "04-02"
subsystem: "mgsd-local"
tags: ["overrides", "scaffolding", "protocol"]
requires: ["04-01"]
provides: [".mgsd-local/ scaffold capability"]
affects: ["mgsd-new-project", "client project structure"]
tech-stack.added: []
tech-stack.patterns: []
key-files.modified: [
  ".agent/marketing-get-shit-done/workflows/new-project.md",
  ".agent/marketing-get-shit-done/MGSD-INDEX.md"
]
key-files.created: [
  ".agent/marketing-get-shit-done/templates/local-override/README.md",
  ".agent/marketing-get-shit-done/templates/local-override/.gitignore",
  ".agent/marketing-get-shit-done/templates/local-override/MIR/.gitkeep",
  ".agent/marketing-get-shit-done/templates/local-override/MSP/.gitkeep",
  ".agent/marketing-get-shit-done/templates/local-override/config/.gitkeep"
]
key-decisions: [
  "Documented override architecture thoroughly in MGSD-INDEX.md to protect client customization spaces."
]
requirements-completed: ["SKL-02"]
duration: 5 min
completed: 2026-03-23T17:35:00Z
---

# Phase 04 Plan 02: .mgsd-local/ Override Convention & Scaffold Summary

Established the `.mgsd-local/` template override structure to allow client modifications that survive MGSD patches.

## Completed Tasks

1. **Create .mgsd-local/ scaffold template**: Created the client `README.md`, `.gitignore`, and `.gitkeep` files to guarantee the folder tree replicates seamlessly during new project creation.
2. **Update mgsd-new-project**: Injected `.mgsd-local/` tree creation and boilerplate copying directly into `workflows/new-project.md` step 3. Clients will see their customization space directly upon initialization.
3. **Document override resolution**: Added full `Override Resolution Protocol` to `MGSD-INDEX.md` providing hard rules for agent behavior when reading templates.

## Deviations from Plan

`04-02-T2` instructed editing `.agent/skills/mgsd-new-project/SKILL.md` to add bash scaffold code. However, the protocol initialization script actually lives in `.agent/marketing-get-shit-done/workflows/new-project.md`. I modified the workflow file instead to guarantee the code actually executes during init.

## Authentication Gates

None

## Next Steps

Ready for 04-03: Self-documentation layer and phase verification.
