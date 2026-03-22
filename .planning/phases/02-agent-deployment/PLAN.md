# Phase 2: Agent Deployment & PM Logic

**Goal:** Unpack the agentic team under `.agent/marketing-get-shit-done`, mirroring the `gsd` architecture (agents, hooks, skills, bin, references, templates, workflows, VERSION), and deploy specific Linear PM agents.
**Requirements:** AGT-01, AGT-02
**Success Criteria:**
- The `mgsd` root folder precisely replicates the `gsd` execution environment and subdirectories.
- A functional set of AI marketing personas and a dedicated Linear PM workflow exist.

## Context
Instead of just serving templates, `mgsd` must be a fully functional autonomous suite identically structured to `get-shit-done`. The marketing protocol needs dedicated logic and tailored workflows that hook directly into Linear for PM tracking. The `AGENTS` roster from Phase 1 defined the human+AI logic mapping; this phase defines the actual executable software agent personas and scripts in the file system.

## Plan

### 1. Mirror Core Architecture
- [x] Scaffold the missing directory structure inside `.agent/marketing-get-shit-done/`: `agents/`, `bin/`, `hooks/`, `references/`, `workflows/`.
- [x] Define the `VERSION` file for `mgsd`.
- [x] Replicate or stub `mgsd-tools.cjs` (or parallel Node.js tools) into `bin/` so the system executes its own routing identical to GSD.

### 2. Deploy Marketing Agents
- [x] Extract the definitions from `.agent/marketing-get-shit-done/templates/AGENTS/` to identify the required specialized AI personas (e.g., `mgsd-marketing-strategist`, `mgsd-content-creator`).
- [x] Write the system prompt `.md` files for these newly derived AI marketing personas into `.agent/marketing-get-shit-done/agents/`.

### 3. Dedicated Linear PM Setup
- [x] Develop the explicit Linear PM agent persona (`mgsd-linear-manager`) responsible for verifying task progress across the board.
- [x] Write the workflow `.md` instructions that permit autonomous task mapping and checking to Linear automatically when a phase is planned or completed.
