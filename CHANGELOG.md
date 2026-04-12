# Changelog — MarkOS

## v3.3.0 — 2026-04-10

### Revenue CRM and Customer Intelligence Core
- Added the full v3.3 CRM delivery line through canonical entities, first-party tracking and identity stitching, pipeline and workspace surfaces, native outbound execution, CRM-grounded copilot operations, and reporting closeout artifacts.
- Aligned the public package release line to `3.3.0` so npm metadata, repo version surfaces, and release-facing documentation tell the same story.
- Added repeatable packed-artifact validation via `npm run release:smoke` to verify the publishable tarball contains the intended MarkOS runtime surfaces and CLI entrypoint before human publish.
- Added a durable Phase 66 publish checklist and verification ledger so the final `npm publish` and registry verification steps remain explicit and honest.

## v2.3.0 — 2026-03-31

### Codebase Documentation Intelligence (Phase 33 Complete)
- **Canonical Mapping**: `.planning/codebase/` documentation system established as source of truth for codebase topology
- **Route Inventory**: 18 local onboarding routes + 8 hosted API wrapper routes documented route-by-route
- **Entrypoint Coverage**: CLI commands, protocol tools, and runtime entrypoints fully inventoried
- **Folder & File Ownership**: all maintained surfaces (api/, bin/, onboarding/, .agent/, .planning/, RESEARCH/, scripts/, test/) documented with integration links
- **Protocol-Summary Alignment**: README.md, TECH-MAP.md, and .protocol-lore/CODEBASE-MAP.md now delegate to canonical map instead of duplicating documentation
- **Verification Coverage**: Drift detection tests for routes, wrappers, entrypoints enabled; topology audit checks ready for monthly cadence
- **MIR Gates GREEN**: Gate 1 (PROFILE, VOICE-TONE, MESSAGING-FRAMEWORK, LEAN-CANVAS, JTBD-MATRIX) and Gate 2 (TRACKING, AUTOMATION, KPI-FRAMEWORK, PAID-MEDIA) fully populated
- Archived: All Phase 33 artifacts to `.planning/phases/33-codebase-documentation-mapping/`

### Milestone Transition
- v2.3 archived 2026-03-31 with all 4 plan summaries, 11 protocol tests passing, and all concerns closed or deferred
- Next milestone (v2.4 Beta Client Onboarding) roadmap pending stakeholder input
- Operational transition: standby for beta intake SOP and PLG campaign launch

## Unreleased

### Phase 47 Wave 5 (Integration and Verification)
- Added legacy compatibility bridge in `onboarding/backend/agents/llm-adapter.cjs` that prefers the modern adapter path when available while preserving fallback-safe onboarding behavior.
- Added dual-path verification coverage in `test/llm-adapter/backward-compat.test.js`.
- Added e2e verification for config-to-status flow in `test/llm-adapter/e2e.test.js`.
- Added final documentation:
	- `docs/LLM-BYOK-ARCHITECTURE.md`
	- `docs/OPERATOR-LLM-SETUP.md`
- README now includes LLM BYOK command references (`llm:config`, `llm:status`, `llm:providers`).

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

