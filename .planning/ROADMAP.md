# Roadmap: Marketing Get Shit Done (MGSD)

<details>
<summary>v1.0 — Initial Protocol (Completed 2026-03-23)</summary>

## Phase 1: Template Restructuring
**Goal:** Completely design and augment the current standard planning and templates (MIR/MSP).
**Requirements Mapped:** TPL-01, TPL-02
**Status:** ✅ Complete
**Success Criteria:**
1. MIR templates are agnostic.
2. MSP templates are standardized.

## Phase 2: Agent Deployment & PM Logic (Extension)
**Goal:** Unpack and deploy the agentic team under `.agent/marketing-get-shit-done/` following the GSD `agents, hooks, skills, bin, references, templates, workflows and VERSION` architecture. Implement Linear Project Management logic.
**Requirements Mapped:** AGT-01, AGT-02
**Status:** ✅ Complete
**Success Criteria:**
1. `mgsd` folder structure fully mirrors `gsd` (`agents`, `hooks`, `skills`, `bin`, etc.).
2. Linear PM Agents created to check and manage done tasks automatically.

## Phase 3: Marketing Matrix Expansion
**Goal:** Deep augmentation of Phase 1 templates to rival GSD's granular coding workflows. Translate all potential marketing tasks, sub-disciplines, and execution plans (SEO, Lifecycle, Ads, Social, Influencer, PR, etc.) into robust, universally executable protocol modules.
**Requirements Mapped:** TPL-03
**Status:** ✅ Complete
**Success Criteria:**
1. At least 8-10 master sub-marketing disciplines structurally defined as executable templates.
2. Universal workflows capable of onboarding any niche into a specific channel pipeline flawlessly.

---

## Phase 4: Skill Alignment & Local Override Architecture
**Goal:** Align all `mgsd-*` skills to the new exhaustive template structures and establish the `.mgsd-local/` client-override directory so that future patches never touch client customizations.
**Requirements Mapped:** SKL-01
**Depends on:** Phase 3
**Status:** ✅ Complete
**Success Criteria:**
1. `mgsd-new-project`, `mgsd-plan-phase`, `mgsd-execute-phase`, and all related skills resolve template paths correctly against the Phase 3 expanded structure.
2. `.mgsd-local/` override directory convention is defined, documented, and referenced in all relevant agents and hooks — client files placed here survive both GSD and MGSD patch updates.
3. Skills self-document which template directories they read from and which are client-overridable.
4. `mgsd-new-project` scaffold creates `.mgsd-local/` with an onboarding README on first run.

**Plans:**
- [x] 04-01: Audit and align standard skills
- [x] 04-02: `.mgsd-local` scaffold integration
- [x] 04-03: Self-documentation and Verification

---

## Phase 5: Research Architecture & Tokenization
**Goal:** Build the structured `RESEARCH/` system — a dedicated top-level directory of post-processed, tokenized market and audience intelligence that feeds MIR, MSP, and all downstream content generation. Attach agentic generation to `mgsd-new-project`.
**Requirements Mapped:** RES-01, RES-02
**Depends on:** Phase 4
**Status:** ✅ Complete
**Success Criteria:**
1. `RESEARCH/` directory scaffolded at project root (peer to `MIR/`, `MSP/`) with 6 canonical research files: `AUDIENCE-RESEARCH.md`, `ORG-PROFILE.md`, `PRODUCT-RESEARCH.md`, `COMPETITIVE-INTEL.md`, `MARKET-TRENDS.md`, `CONTENT-AUDIT.md`.
2. Each file has a fully specified, tokenized template with frontmatter, agent instructions, and explicit cross-references to MIR/MSP fields it populates.
3. An agentic researcher role (`mgsd-researcher`) reads raw input and writes processed, insight-dense entries — not raw dumps.
4. `mgsd-new-project` auto-triggers research generation sequence after scaffold.
5. MIR and MSP templates carry RESEARCH token references so planner agents pull live context automatically.

**Plans:**
- [x] 05-01: Research file templates
- [x] 05-02: mgsd-researcher implementation
- [x] 05-03: MIR and MSP Tokenization
- [x] 05-04: Hooking down to mgsd-new-project

---

## Phase 6: Web-Based Client Onboarding Engine
**Goal:** Build a lightweight, white-labeled web onboarding UI (step-by-step form) that collects the seed data needed to populate `RESEARCH/`, `MIR/`, and `MSP/` for a new client. Output is a structured JSON seed consumed by agentic generation.
**Requirements Mapped:** ONB-01, ONB-02
**Depends on:** Phase 5
**Status:** ✅ Complete
**Success Criteria:**
1. A self-contained web onboarding app (spun up optionally via CLI during `mgsd-new-project`) presents a clean multi-step form covering: Company/Brand, Audience, Product/Service, Competitive landscape, Market context, and Content inventory.
2. Submission produces a versioned `onboarding-seed.json` committed to the project.
3. An orchestrator agent reads `onboarding-seed.json` and drives `mgsd-researcher` to populate all 6 RESEARCH files, then scaffolds MIR and MSP fields with derived values.
4. The UI is white-label ready: logo, colors, and copy are configurable via a simple config file.
5. Form UX is premium and guided — minimal friction, no marketing jargon exposed to clients.

**Plans:**
- [x] 06-01: Web onboarding app scaffold
- [x] 06-02: Backend logic and JSON orchestrator

---

## Phase 7: NPX Patch Engine & Distribution
**Goal:** Package `marketing-get-shit-done` for NPM. Implement a smart agentic patch engine that installs and updates the MGSD protocol on top of any existing GSD install — without touching client customizations in `.mgsd-local/`.
**Requirements Mapped:** NPX-01, NPX-02, PATCH-01
**Depends on:** Phase 6
**Status:** ✅ Complete
**Success Criteria:**
1. `npx marketing-get-shit-done` runs an interactive CLI wizard (mirrors GSD's install UX) — asks install location, GSD co-existence option, project name — then installs the full MGSD protocol.
2. The CLI correctly detects an existing GSD install and injects MGSD commands into the existing `.agent/` structure non-destructively.
3. `npx marketing-get-shit-done update` applies a minimal patch: agent reads current protocol version, diffs against latest, and applies only changed files — skipping any path listed under `.mgsd-local/`.
4. Patch conflicts (same file modified by client AND by update) are surfaced to the user with a diff preview — never auto-overwritten.
5. The npm package `marketing-get-shit-done` is published to the public registry and installable globally or per-project.
6. A `VERSION` file and changelog entry are generated/updated on every install and update.

**Plans:**
- [x] 07-01: Install Wizard
- [x] 07-02: Update logic and diff preview

</details>

<details>
<summary>v1.1.0 — MGSD Hardening (Completed 2026-03-25)</summary>

## Phase 8: Protocol Hardening, Tokenization & Hybrid Team
**Goal:** Document, tokenize, and categorize the MGSD protocol to harden, close gaps, remove inconsistencies, and improve the performance of the agents running this protocol to completely own and manage the hybrid (human + AI) team and their tasks.
**Requirements Mapped:** HRD-01, TOK-01, HYB-01
**Depends on:** Phase 7
**Status:** ✅ Complete
**Success Criteria:**
1. All MGSD templates (MIR, MSP, RESEARCH) use a unified, strict tokenization taxonomy for robust context retrieval.
2. The protocol clearly categorizes tasks by "AI-owned", "Human-owned", and "Hybrid", with clear handoff protocols.
3. Documentation gaps and inconsistencies between tools and templates are resolved.
4. Agent prompts and skill instructions are updated to leverage the new tokenized categories to act as managers rather than just executors.

**Plans:**
- [x] 08-01: Documentation Hardening & Audit
- [x] 08-02: Template Tokenization & Categorization
- [x] 08-03: Hybrid Team Task Delegation Workflow

---

## Phase 9: Protocol Pillars Analysis
**Goal:** Analyze and validate the implementation of the 4 recent foundational pillars (Reaction Squad, Adversarial Debate/Episodic Memory, Generative Task Synthesis, and Event-Driven Defcon) to ensure the model and protocol are perfectly optimized for a hybrid (agentic + human) marketing team.
**Requirements Mapped:** HYB-02, PTL-01
**Depends on:** Phase 8
**Status:** ✅ Complete
**Success Criteria:**
1. The new Reaction Squad (`mgsd-data-scientist`, `mgsd-behavioral-scraper`) is fully integrated without conflict.
2. The Red Team Debate & VectorDB Episodic Memory correctly retrieve historical context before execution.
3. The `mgsd-task-synthesizer` cleanly generates non-hallucinated tasks and maps them to `[API-EXECUTE]`.
4. The Event-Driven Defcon Layer & Monte Carlo Budgeting appropriately trigger fail-safes without stranding the executor.

**Plans:**
- [x] 09-01: Audit reaction agents against live metrics
- [x] 09-02: Validate Red Team Debate rules
- [x] 09-03: Stress-test generative task synthesis
- [x] 09-04: Execute Defcon trigger override test

</details>

## v1.2.0 — Future Integrations

## Phase 10: Multi-Tenant Scale & Telemetry
**Goal:** Optimize MGSD to seamlessly run across 5-10 distinct isolated brands simultaneously. Build robust output telemetry and cross-client vector segregation.
**Requirements Mapped:** SCL-01, TLM-01
**Depends on:** Phase 9
**Status:** ⏳ Pending
**Success Criteria:**
1. CLI smoothly navigates multiple concurrent project profiles perfectly encapsulating context boundaries.
2. Centralized telemetry dashboard reports AI-vs-human execution metrics.

**Plans:**
- [ ] 10-01: Cross-client vector segregation logic
- [ ] 10-02: Execution telemetry and dashboard wiring

