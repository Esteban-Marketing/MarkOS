# Changelog — MarkOS

## Unreleased

### Documentation / protocol lore
- Canonical mission state is **`.planning/STATE.md`**; `.protocol-lore/STATE.md` is a routing pointer only.
- Unified agent boot across `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, and `.cursor/rules/markos.mdc` (read order: QUICKSTART → INDEX → `.planning/STATE.md` → `MARKOS-INDEX.md`).
- Swept `.protocol-lore/*` for encoding, GSD vs MarkOS terminology, `markos-*` skill paths, and accurate `ensure-vector` / test commands.
- **`MARKOS-INDEX.md`**: skill rows use **`../skills/...`**, prompt rows use **`../prompts/...`** (paths relative to `.agent/markos/`).
- Root docs (`README`, `TECH-MAP`, `CHANGELOG`) aligned with `npx markos`, `npm test`, and Supabase + Upstash Vector wording.

### Identity Normalization
- MarkOS-first install, onboarding, and primary documentation copy normalized for Phase 23.
- Compatibility contract published for legacy filesystem paths, telemetry env vars, browser storage keys, and vector namespace prefixes (see Phase 23 artifacts).
- Added guardrail coverage so public-facing surfaces do not quietly regress to mixed MarkOS/MARKOS branding.

## v2.0.0 — 2026-03-27

### MarkOS Rebrand (MARKOS → MarkOS)
- **BREAKING**: npm package renamed from `markos` to `markos`
- **BREAKING**: Primary CLI command is now `npx markos install` / `npx markos update`
- Legacy `markos` bin alias retained for backward compatibility (not user-facing)
- All internal branding updated to "MarkOS — Marketing Operating System"
- Product identity: markos.esteban.marketing

## v1.1.0 — 2026-03-25

### Documentation Hardening Pass
- **New Protocol Lore**: Created `.protocol-lore/` directory as a machine-readable source of truth for AI agents (QUICKSTART, ARCHITECTURE, WORKFLOWS, CONVENTIONS, MEMORY).
- **Codebase Mapping**: Added XML-based `CODEBASE-MAP.md` for zero-hallucination agent navigation.
- **Deep Inline Documentation**: Applied JSDoc headers and dense line-by-line comments to all backend/agent/bin source files.
- **Improved Resiliency**: Enforced `project_slug` persistence and auto-healing `ensure-vector.cjs` daemon checks across all entry points.
- **Privacy Enforcement**: Integrated a dismissible privacy/consent banner into the onboarding UI (`index.html`).
- **Standardized Exports**: Normalized all internal agent APIs for easier cross-linking.

## v1.0.0 — 2026-03-23

### Initial Release
- Full MarkOS protocol: MIR, MSP, RESEARCH architecture
- Interactive install wizard with GSD co-existence detection
- Web-based client onboarding form (6-step intelligence gathering)
- markos-researcher: agentic intelligence population
- markos-onboarder: full seed → research → MIR/MSP pipeline
- .markos-local/ protected override architecture
- Patch-safe update engine

