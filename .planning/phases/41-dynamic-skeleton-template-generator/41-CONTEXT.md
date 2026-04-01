# Phase 41 — Dynamic Skeleton Template Generator
## CONTEXT.md — Locked Planning Context

**Phase:** 41
**Milestone:** v3.0 — MarkOS Literacy System
**Status:** Discussed — ready for planning
**Created:** 2026-04-01
**Depends on:** Phase 40 (discipline-router.cjs must exist; MODEL_SLUG pattern in example-resolver.cjs is the extension target)

---

## Phase Objective

Build a skeleton generator that produces a starter content pack — markdown stubs with section headings, section prompts, and pain-point sub-headings — customized to the client's business model and declared pain points. Generated skeletons land in `.markos-local/MSP/{discipline}/SKELETONS/` immediately after onboarding approval.

---

## Scope (Locked)

1. Author 35 base skeleton template files: 7 business models × 5 disciplines, stored at `.agent/markos/templates/SKELETONS/{discipline}/_SKELETON-{model_slug}.md`.
2. Add `resolveSkeleton(discipline, businessModel, basePath?)` export to `onboarding/backend/agents/example-resolver.cjs`, sharing the existing `MODEL_SLUG` map and path resolution pattern.
3. Create `onboarding/backend/agents/skeleton-generator.cjs` — `generateSkeletons(seed, approvedDrafts) → { discipline, files[] }[]` — which calls `resolveSkeleton()` to load base templates, interpolates pain-point placeholders, and writes output to `.markos-local/MSP/{discipline}/SKELETONS/`.
4. Wire a blocking post-approval hook in `handlers.cjs` `handleApprove`: after MIR/MSP draft writes succeed, call `generateSkeletons(seed, drafts)` and append `skeletons: { generated: string[], failed: string[] }` to the approve response.
5. Tests: skeleton generation per business model; pain-point injection; post-approval hook integration test; `resolveSkeleton` unit test.

---

## Done Definition

- `resolveSkeleton(discipline, businessModel)` in `example-resolver.cjs` returns the resolved base template content (or `''` if file not found — never throws).
- `generateSkeletons(seed, approvedDrafts)` writes skeleton files for all 5 MSP disciplines to `.markos-local/MSP/{discipline}/SKELETONS/`, regardless of seed signals.
- Each generated skeleton has YAML frontmatter with `discipline`, `business_model`, `generated_at`, `pain_points[]`, section headings, section prompts, and a dedicated pain-points sub-heading block using dynamic placeholders matching the number of `audience.pain_points` declared in the seed.
- The `POST /approve` endpoint returns `skeletons: { generated: string[], failed: string[] }` in its response body. Skeleton errors are **non-fatal** — approve still returns 200 with the failing disciplines listed in `failed[]`.
- All 35 base skeleton template files exist in `.agent/markos/templates/SKELETONS/`.
- All existing tests pass; at least 4 new tests added for this phase.

---

## Discussed Decisions (2026-04-01)

### Content Depth

- **D-41-01:** Headings + section prompts format.
  - Each skeleton base template contains section headings (e.g. `## ABM Campaign Brief`) and a 1–3 sentence section prompt describing what the client should fill in.
  - This is more immediately useful than headings-only for a first-run client seeing their workspace for the first time.
  - Rationale: balances authoring effort (35 templates) with client value on first use.

- **D-41-02:** Pain points injected as sub-headings in a dedicated section.
  - Each skeleton has a dedicated section (e.g. `## Your Priority Challenges`) with one `###` sub-heading per declared `audience.pain_point`.
  - Placeholder format: `### {{pain_point_N}}` (e.g. `### {{pain_point_1}}`, `### {{pain_point_2}}`).
  - Rationale: easy to parse and replace at generation time; visually prominent for the client.

- **D-41-03:** Dynamic placeholder count matching seed.
  - The skeleton generator reads `seed.audience.pain_points` and injects exactly that many `{{pain_point_N}}` sub-headings.
  - No fixed cap — if the seed declares 2, inject 2; if it declares 3, inject 3.
  - Rationale: avoids under-serving clients who declared 3 pain points, and avoids orphaned placeholders for clients with 2.

- **D-41-04:** YAML frontmatter on generated output files.
  - Generated files in `.markos-local/MSP/{discipline}/SKELETONS/` carry:
    ```yaml
    ---
    discipline: {discipline}
    business_model: {business_model}
    generated_at: {ISO timestamp}
    pain_points:
      - {pain_point_1}
      - {pain_point_2}
    ---
    ```
  - Base templates in `.agent/markos/templates/SKELETONS/` do NOT carry frontmatter — they are clean markdown stubs with placeholder syntax only.

### Discipline Scope

- **D-41-05:** Always generate all 5 MSP disciplines at approval time.
  - `generateSkeletons()` generates skeletons for all 5 disciplines (`Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`) regardless of the seed's channel signals or pain points.
  - Rationale: client gets the complete workspace immediately; discipline-router is used for retrieval ranking (Phase 40) but not for skeleton scope — different use case.

### Approval Hook Mode

- **D-41-06:** Blocking hook — approve awaits skeleton generation.
  - After MIR/MSP draft writes succeed in `handleApprove`, the handler calls `generateSkeletons(seed, drafts)` and awaits result before sending the response.
  - Response shape extended: `{ ...existingApproveShape, skeletons: { generated: string[], failed: string[] } }`.
  - Skeleton generation errors are **non-fatal**: if one or more disciplines fail, the erroring disciplines appear in `skeletons.failed[]` and approve still returns HTTP 200. This keeps the pre-existing MIR/MSP writes safe from rollback.
  - Rationale: client knows exactly what was created; partial output is better than silent failure; MIR/MSP writes are already committed so failing the entire response would create a misleading error state.

### Resolver Extension

- **D-41-07:** New `resolveSkeleton()` export in `example-resolver.cjs`.
  - Signature: `resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE)`
  - Resolves path: `{basePath}/SKELETONS/{discipline}/_SKELETON-{model_slug}.md`
  - Returns file content as string, or `''` if file not found (never throws) — matching existing `resolveExample()` contract.
  - Shares the existing `MODEL_SLUG` map in `example-resolver.cjs` — no duplication.
  - Rationale: leverages the established resolution pattern; skeleton-generator.cjs imports a single file for both example and skeleton resolution.

---

## Canonical Refs

- `onboarding/backend/agents/example-resolver.cjs` — existing `resolveExample()` + `MODEL_SLUG` map; `resolveSkeleton()` is added here
- `onboarding/backend/handlers.cjs` `handleApprove` — approval flow being extended with the post-draft hook
- `onboarding/backend/path-constants.cjs` — `TEMPLATES_DIR`, `MARKOS_LOCAL_DIR` constants used by the generator
- `onboarding/backend/agents/skeleton-generator.cjs` — new module; does not exist yet
- `.agent/markos/templates/SKELETONS/` — base skeleton template directory; does not exist yet
- `onboarding/onboarding-seed.schema.json` — `audience.pain_points` (array, dynamic count) and `company.business_model` are the generator inputs
- `.planning/phases/40-multi-discipline-orchestrator-retrieval/40-CONTEXT.md` — D-40-01 channel→discipline alias map; D-40-04 fallback disciplines (available at generation time)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` — Phase 41 full spec with technical requirements

---

*Phase: 41-dynamic-skeleton-template-generator*
*Context gathered: 2026-04-01*
