# Changelog — MarkOS

## v2.0.0 — 2026-03-27

### MarkOS Rebrand (MGSD → MarkOS)
- **BREAKING**: npm package renamed from `marketing-get-shit-done` to `markos`
- **BREAKING**: Primary CLI command is now `npx markos install` / `npx markos update`
- Legacy `mgsd` bin alias retained for backward compatibility
- All internal branding updated to "MarkOS — Marketing Operating System"
- Product identity: markos.esteban.marketing

## v1.1.0 — 2026-03-25

### Documentation Hardening Pass
- **New Protocol Lore**: Created `.protocol-lore/` directory as a machine-readable source of truth for AI agents (QUICKSTART, ARCHITECTURE, WORKFLOWS, CONVENTIONS, MEMORY).
- **Codebase Mapping**: Added XML-based `CODEBASE-MAP.md` for zero-hallucination agent navigation.
- **Deep Inline Documentation**: Applied JSDoc headers and dense line-by-line comments to all backend/agent/bin source files.
- **Improved Resiliency**: Enforced `project_slug` persistence and auto-healing `ensure-chroma.cjs` daemon checks across all entry points.
- **Privacy Enforcement**: Integrated a dismissible privacy/consent banner into the onboarding UI (`index.html`).
- **Standardized Exports**: Normalized all internal agent APIs for easier cross-linking.

## v1.0.0 — 2026-03-23

### Initial Release
- Full MGSD protocol: MIR, MSP, RESEARCH architecture
- Interactive install wizard with GSD co-existence detection
- Web-based client onboarding form (6-step intelligence gathering)
- mgsd-researcher: agentic intelligence population
- mgsd-onboarder: full seed → research → MIR/MSP pipeline
- .mgsd-local/ protected override architecture
- Patch-safe update engine
