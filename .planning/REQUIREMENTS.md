# Requirements: Marketing Get Shit Done (MGSD)

## Milestone v1.0 Requirements

### Template Overhaul
- [ ] **TPL-01**: MIR templates must dynamically support any company/industry/niche.
- [ ] **TPL-02**: MSP templates must be lightweight, organized, and clonable into any project.

### Skill Alignment
- [ ] **SKL-01**: All `mgsd-*` skills must perfectly map to the new template directory structures.

### NPM / CLI Distribution
- [ ] **NPX-01**: A Node.js CLI tool (`get-shit-done-marketing` or `mgsd`) handles global/local installation.
- [ ] **NPX-02**: The installer properly initializes both GSD and MGSD environments side-by-side depending on user choice.

### Agent Deployment
- [ ] **AGT-01**: Agentic team is unpacked into the `mgsd` directory mirroring the `gsd` root folder architecture (`agents`, `hooks`, `bin`, `workflows`, etc.).
- [ ] **AGT-02**: Specialized Linear PM agents exist to interface with Linear, check tasks, and assign items from `.templates/AGENTS`.

## Out of Scope
- Codebase management tools (covered by `gsd`), unless marketing specific (e.g., website repos).

## Definitions of Done
- Dual `gsd` and `mgsd` CLI execution is operational globally via NPX.
- Lightweight templates are tested and successfully load context into AI planning tasks.
