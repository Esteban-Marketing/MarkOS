# Requirements: Marketing Get Shit Done (MGSD)

## Milestone v1.0 Requirements

### Template Overhaul
- [x] **TPL-01**: MIR templates must dynamically support any company/industry/niche.
- [x] **TPL-02**: MSP templates must be lightweight, organized, and clonable into any project.
- [x] **TPL-03**: The template infrastructure must include ultra-competitive, deep modular arrays translating all major marketing disciplines into rigorous GSD executable files.

### Skill Alignment & Override Architecture
- [x] **SKL-01**: All `mgsd-*` skills must perfectly map to the new expanded template directory structures (Phase 4).
- [x] **SKL-02**: A `.mgsd-local/` override directory convention must be defined so client customizations survive GSD and MGSD updates without being overwritten (Phase 4).

### Research Architecture
- [x] **RES-01**: A canonical `RESEARCH/` directory with 6 tokenized template files (`AUDIENCE-RESEARCH.md`, `ORG-PROFILE.md`, `PRODUCT-RESEARCH.md`, `COMPETITIVE-INTEL.md`, `MARKET-TRENDS.md`, `CONTENT-AUDIT.md`) that feed MIR and MSP fields (Phase 5).
- [x] **RES-02**: Agentic researcher (`mgsd-researcher`) that converts raw client input into insight-dense, tokenized research entries auto-triggered on `mgsd-new-project` (Phase 5).

### Client Onboarding
- [x] **ONB-01**: A white-label, step-by-step web onboarding form that collects seed data (Company, Audience, Product, Competition, Market, Content inventory) and outputs `onboarding-seed.json` (Phase 6).
- [x] **ONB-02**: An orchestrator agent reads `onboarding-seed.json` and drives research generation + MIR/MSP scaffolding automatically (Phase 6).

### NPM / CLI Distribution & Patch Engine
- [x] **NPX-01**: The npm package `marketing-get-shit-done` handles global/local installation via `npx marketing-get-shit-done` with an interactive wizard (Phase 7).
- [x] **NPX-02**: The installer detects an existing GSD install and injects MGSD commands non-destructively into the existing `.agent/` structure (Phase 7).
- [x] **PATCH-01**: `npx marketing-get-shit-done update` applies a minimal, non-destructive patch that skips `.mgsd-local/` and surfaces conflicts with a diff preview before applying (Phase 7).

### Agent Deployment
- [x] **AGT-01**: Agentic team is unpacked into the `mgsd` directory mirroring the `gsd` root folder architecture (`agents`, `hooks`, `bin`, `workflows`, etc.).
- [x] **AGT-02**: Specialized Linear PM agents exist to interface with Linear, check tasks, and assign items from `.templates/AGENTS`.

## Milestone v1.1 Requirements

### Protocol Hardening & Tokenization (Phase 8)
- [x] **HRD-01**: Resolve documentation gaps and unify the protocol codebase map.
- [x] **TOK-01**: Strict tokenization taxonomy across all templates to prevent hallucinations.
- [x] **HYB-01**: Define clear hybrid "Human+AI" team ownership and handoff patterns.

### Protocol Pillars & Execution Guards (Phase 9)
- [x] **PTL-01**: Validate generative task synthesis and event-driven DEFCON logic.
- [x] **GRD-01**: Impose strict prerequisite state checks (`project_valid`, `verification_passed`) inside CLI workflows to halt agent misfires.
- [x] **MEM-01**: Guarantee ChromeDB automated up-time on all vector commands implicitly without manual daemon tracking.

## Out of Scope
- Codebase management tools (covered by `gsd`), unless marketing specific (e.g., website repos).
- Auto-overwriting client files during patch updates.

## Definitions of Done
- `npx marketing-get-shit-done` installs a complete MGSD + GSD co-existence setup in a single command.
- `.mgsd-local/` overrides survive both GSD and MGSD updates.
- Research files are auto-generated from onboarding seed and feed MIR/MSP context tokens.
- Web onboarding UI collects all client data and populates the full research + strategy scaffold.
- The patch engine diffs and applies updates safely, surfacing conflicts for human review.
