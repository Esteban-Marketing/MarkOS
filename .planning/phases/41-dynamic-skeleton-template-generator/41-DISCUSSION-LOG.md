# Phase 41: Dynamic Skeleton Template Generator — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 41 — Dynamic Skeleton Template Generator
**Areas discussed:** Content Depth, Discipline Scope, Approval Hook Mode, Resolver Extension

---

## Content Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Headings only + pain point placeholders | Section headings + `{{pain_point_N}}` only. Minimal, fast to author. | |
| Headings + section prompts | Headings plus 1–3 sentence description per section. More immediately useful. | ✓ |
| Agent's discretion | Agent picks best approach for a first-run client. | |

**User's choice:** Headings + section prompts

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pain points as sub-headings in a section | `{{pain_point_N}}` as `###` sub-headings in a dedicated section. | ✓ |
| Pain points inline in section body text | Injected into section prompt sentences. | |
| Both approaches | Dedicated section AND inline references. | |

**User's choice:** Pain points as sub-headings in a dedicated section

---

| Option | Description | Selected |
|--------|-------------|----------|
| 2 placeholders | Fixed `{{pain_point_1}}` and `{{pain_point_2}}`. | |
| 3 placeholders (gracefully omit if not declared) | `{{pain_point_1}}` through `{{pain_point_3}}`, omit extras. | |
| Dynamic (match seed count) | Inject exactly as many as `audience.pain_points` declares. | ✓ |

**User's choice:** Dynamic — inject exactly as many as declared in seed

---

| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter on generated output files | `discipline`, `business_model`, `generated_at`, `pain_points[]` in output YAML. | ✓ |
| Frontmatter on base templates only | Base templates carry frontmatter; generated files are clean markdown. | |
| No frontmatter anywhere | No YAML, metadata tracked elsewhere. | |

**User's choice:** Frontmatter on generated output files; base templates remain clean markdown with placeholder syntax only

---

## Discipline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Top-3 ranked disciplines (mirror Phase 40 router) | Use `rankDisciplines(seed).slice(0,3)` — consistent with retrieval contract. | |
| All 5 disciplines always | Generate all 5 MSP disciplines regardless of seed signals. | ✓ |
| Disciplines with literacy coverage only | Probe vector store; only generate for covered disciplines. | |

**User's choice:** Always all 5 MSP disciplines — client gets complete workspace immediately

---

## Approval Hook Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking — approve response includes skeleton results | `approve` awaits generation; returns `skeletons: { generated, failed }`. | ✓ |
| Fire-and-forget — non-blocking after approve | Runs in `.then()` after response sent; errors logged only. | |
| Blocking but non-fatal on skeleton errors | Blocking with always-200 + `skeletons.error` field on failure. | |

**User's choice:** Blocking — approve response includes skeleton results

---

| Option | Description | Selected |
|--------|-------------|----------|
| Non-fatal — approve always returns 200, errors surfaced in response | Partial failures in `skeletons.failed[]`, approve succeeds. | |
| Fatal — approve fails if skeleton generation fails | 500 if any skeleton errors; risks partial-write state. | |
| Agent's discretion | Agent picks the safest approach given commit semantics. | ✓ |

**User's choice:** Agent's discretion
**Notes:** Agent resolved as non-fatal — MIR/MSP writes already committed; failing the approve response would create a misleading error state. `skeletons.failed[]` surfaces the partial output safely.

---

## Resolver Extension

| Option | Description | Selected |
|--------|-------------|----------|
| New export in example-resolver.cjs | `resolveSkeleton(discipline, businessModel, basePath?)` added alongside `resolveExample()`. Shares `MODEL_SLUG`. | ✓ |
| Self-contained in skeleton-generator.cjs | Generator inlines its own MODEL_SLUG + path logic. No changes to example-resolver. | |
| New standalone skeleton-resolver.cjs module | Separate file, example-resolver unchanged, no duplication. | |

**User's choice:** New export in `example-resolver.cjs` — shares existing `MODEL_SLUG` map

---

## Agent's Discretion

- **Skeleton error fatality** — Agent decided non-fatal (errors in `skeletons.failed[]`, HTTP 200 always) to avoid misleading error state after MIR/MSP commits.

## Deferred Ideas

None — discussion stayed within phase scope.
