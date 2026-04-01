# Phase 33 - Codebase Documentation Mapping
## CONTEXT.md - Locked Planning Context

**Phase:** 33
**Milestone:** v2.3
**Status:** Planned - ready for execution
**Created:** 2026-03-31
**Depends on:** Stable post-v2.2 runtime surfaces and current phase artifacts on disk

---

## Phase Objective

Produce a canonical, GSD-native codebase documentation map that covers the repository route by route, folder by folder, and file by file, then align protocol-facing docs to that source of truth.

---

## Scope (Locked)

1. Create `.planning/codebase/` as the canonical codebase map consumed by GSD planning/execution workflows.
2. Document runtime entrypoints across onboarding HTTP routes, `api/` wrappers, CLI binaries, and protocol tool surfaces.
3. Document maintained repository folders and implementation files with purpose, dependencies, and cross-links.
4. Synchronize `README.md`, `TECH-MAP.md`, and `.protocol-lore/CODEBASE-MAP.md` to summarize and deep-link to the canonical map.
5. Define freshness and verification rules so future route and topology changes update documentation predictably.

---

## Done Definition

- `.planning/codebase/` contains the standard GSD mapping set plus route, folder, and file coverage extensions.
- Every active HTTP route and operator entrypoint resolves to a handler or executable file without guesswork.
- Every maintained top-level directory has a documented purpose and a file inventory or explicit exclusion rule.
- Protocol-facing docs no longer duplicate topology truth beyond short summaries and links.
- A maintainer can identify where to add, modify, or verify documentation after any repo topology change.

---

## Discussed Decisions (2026-03-31)

### Canonical Documentation Layer

- **D-33-01:** Use `.planning/codebase/` as the canonical GSD documentation surface because the existing GSD mapper workflow already targets that location.
- **D-33-02:** Keep `TECH-MAP.md` and `.protocol-lore/CODEBASE-MAP.md` as summary/navigation layers that deep-link back to `.planning/codebase/` rather than restating full inventories.

### Documentation Coverage Rules

- **D-33-03:** Treat onboarding HTTP routes, `api/` wrappers, and CLI binaries as first-class runtime surfaces that require explicit route/entry documentation.
- **D-33-04:** Treat `.agent/`, `.planning/`, `RESEARCH/`, and `test/` as maintained documentation surfaces, not incidental support folders.

### Freshness Model

- **D-33-05:** Require documentation updates when any route is added or removed, any maintained directory gains or loses files, or any entrypoint behavior changes.
- **D-33-06:** Prefer one canonical inventory with linked summary docs over parallel duplicated maps.

### the agent's Discretion

- Extend the standard GSD seven-document map with MarkOS-specific documents for routes, folders, files, and coverage when execution starts.
- Use appendices or sectioned tables if a single inventory document becomes too large for practical navigation.

---

## Canonical References

Downstream agents should read these before replanning or implementation.

- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/milestones/v2.3-ROADMAP.md`
- `.planning/milestones/v2.3-REQUIREMENTS.md`
- `.protocol-lore/QUICKSTART.md`
- `.protocol-lore/CODEBASE-MAP.md`
- `TECH-MAP.md`
- `README.md`
- `onboarding/backend/server.cjs`
- `onboarding/backend/handlers.cjs`
- `api/`
- `bin/`
- `.agent/`
- `test/`

---

## Existing Code Insights

### Reusable Assets

- `.protocol-lore/CODEBASE-MAP.md` already provides a lightweight navigation layer for a subset of major surfaces.
- `TECH-MAP.md` already captures architecture and endpoint summaries for humans.
- `.agent/get-shit-done/workflows/map-codebase.md` defines the canonical GSD target path and standard map artifact set.

### Gaps To Close

- No canonical `.planning/codebase/` directory currently exists.
- No route-by-route inventory exists for the full onboarding HTTP surface, `api/` wrappers, and CLI binaries together.
- No folder-by-folder and file-by-file inventory exists for maintained protocol, planning, runtime, and test surfaces.

### Integration Points

- `onboarding/backend/server.cjs` route wiring
- `onboarding/backend/handlers.cjs` behavior and side effects
- `api/*.js` hosted wrappers
- `bin/*.cjs` and `.agent/*/bin/*.cjs` operator entrypoints
- `.planning/*` and `.protocol-lore/*` documentation layers
