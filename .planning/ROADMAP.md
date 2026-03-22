# Roadmap: Marketing Get Shit Done (MGSD)

## Phase 1: Template Restructuring
**Goal:** Completely design and augment the current standard planning and templates (MIR/MSP).
**Requirements Mapped:** TPL-01, TPL-02
**Success Criteria:**
1. MIR templates are agnostic.
2. MSP templates are standardized.

## Phase 2: Agent Deployment & PM Logic (Extension)
**Goal:** Unpack and deploy the agentic team under `.agent/marketing-get-shit-done/` following the GSD `agents, hooks, skills, bin, references, templates, workflows and VERSION` architecture. Implement Linear Project Management logic.
**Requirements Mapped:** AGT-01, AGT-02
**Success Criteria:**
1. `mgsd` folder structure fully mirrors `gsd` (`agents`, `hooks`, `skills`, `bin`, etc.).
2. Linear PM Agents created to check and manage done tasks automatically.

## Phase 3: Skill Alignment
**Goal:** Align mgsd skills with the new template structures.
**Requirements Mapped:** SKL-01
**Success Criteria:**
1. `mgsd-new-project` points correctly to the overhauled templates.
2. `mgsd-plan-phase` loads template context functionally.

## Phase 4: NPX Installer Creation
**Goal:** Create a standalone `npx` install command.
**Requirements Mapped:** NPX-01, NPX-02
**Success Criteria:**
1. Package acts as a Node CLI executable.
2. Installing it locally adds both `.agent` directories cleanly.
