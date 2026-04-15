---
phase: 106-template-taxonomy-and-selection-contracts
plan: "01"
subsystem: pack-registry
tags: [pack-loader, schema, manifests, ajv, taxonomy]
dependency_graph:
  requires: []
  provides: [lib/markos/packs/pack-schema.json, lib/markos/packs/*.pack.json, test/pack-loader.test.js]
  affects: [onboarding/backend/research/template-family-map.cjs, lib/markos/packs/pack-loader.cjs]
tech_stack:
  added: [ajv@^8.18.0]
  patterns: [singleton-cache, Ajv-Draft07-validation, TDD-stub-first]
key_files:
  created:
    - lib/markos/packs/pack-schema.json
    - lib/markos/packs/b2b.pack.json
    - lib/markos/packs/b2c.pack.json
    - lib/markos/packs/agency.pack.json
    - lib/markos/packs/services.pack.json
    - lib/markos/packs/saas.pack.json
    - lib/markos/packs/ecommerce.pack.json
    - lib/markos/packs/info-products.pack.json
    - test/pack-loader.test.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Ajv v8 strict:false chosen to avoid strict-mode keyword rejections on draft-07 descriptions"
  - "slug pattern ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ enforces path-traversal prevention at schema level"
  - "additionalProperties: false at pack root catches schema drift immediately during Phase 107 authoring"
  - "All completeness values set to stub — Phase 107 upgrades these to actual content"
  - "Test stub uses require.resolve() inside getLoader() so tests fail at execution not parse time"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 9
  files_modified: 2
---

# Phase 106 Plan 01: Pack Schema, Manifests, and Test Stub Summary

**One-liner:** Ajv v8 Draft-07 schema + 7 base pack manifests migrated from FAMILY_REGISTRY with path-traversal-safe slug validation and a 12-case TDD test stub.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Ajv v8 + create test/pack-loader.test.js stub | d08a9c5 | package.json, package-lock.json, test/pack-loader.test.js |
| 2 | Create lib/markos/packs/pack-schema.json | 041b134 | lib/markos/packs/pack-schema.json |
| 3 | Create all 7 base pack manifests | 7c5a2d8 | lib/markos/packs/{b2b,b2c,agency,services,saas,ecommerce,info-products}.pack.json |

## What Was Built

### pack-schema.json
Ajv-compilable JSON Schema Draft-07 for `*.pack.json` manifest files. Defines 10 required + 5 optional fields:
- **Required:** `slug`, `version`, `displayName`, `type`, `aliases`, `disciplines`, `completeness`, `assets`, `fallbackAllowed`, `changelog`
- **Optional:** `industries`, `overlayFor`, `dependencies`, `operatorNotes`
- Slug pattern `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` enforces path-traversal prevention
- `additionalProperties: false` at root and in `assets` sub-object

### 7 Base Pack Manifests
All 7 packs migrated from the inline `FAMILY_REGISTRY` in `template-family-map.cjs`:

| Slug | Display Name | overlayDoc |
|------|-------------|------------|
| b2b | B2B (Business-to-Business) | null |
| b2c | B2C (Business-to-Consumer) | null |
| agency | Agency (Agentic Services) | null |
| services | Professional Services | TPL-SHARED-overlay-consulting.md |
| saas | SaaS (Software-as-a-Service) | TPL-SHARED-overlay-saas.md |
| ecommerce | Ecommerce (DTC, Marketplace, Retail) | TPL-SHARED-overlay-ecommerce.md |
| info-products | Info Products (Courses, Digital Products) | TPL-SHARED-overlay-info-products.md |

Aliases match FAMILY_REGISTRY exactly. All completeness values are `stub` — Phase 107 will upgrade these.

### test/pack-loader.test.js
12-case TDD stub using `node:test` + `assert/strict`. Covers:
- `getFamilyRegistry`: array length (7), legacy shape fields, freeze, cache hits, _resetCacheForTests, saas/services overlayDocs
- `resolvePackSelection`: basePack resolution, resolvedAt ISO 8601, unknown model fallback, missing seed, result shape (4 keys)

Tests fail uniformly with `MODULE_NOT_FOUND` for `pack-loader.cjs` until Plan 02 creates it.

## Decisions Made

1. **Ajv v8 strict:false** — Avoids strict-mode rejections for Draft-07 `description` fields on schema properties. Production code creates  `new Ajv({allErrors:true, strict:false})`.
2. **No ajv-formats** — pack-schema.json uses regex patterns rather than format keywords (`date`, `uri`), keeping the dependency footprint minimal.
3. **slug path-traversal guard at schema layer** — Pattern enforced in JSON Schema rather than runtime code, so any manifest with a traversal-style slug is rejected before it enters the registry.
4. **additionalProperties: false** — Catches schema drift immediately when Phase 107 authors add fields not yet in the schema specification.
5. **All completeness = stub** — Phase 107 will actually author discipline content; this plan just locks the manifest contracts.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| All 7 `*.pack.json` | `completeness.*: "stub"` | Intentional — Phase 107 upgrades to actual asset coverage values |
| `test/pack-loader.test.js` | All 12 tests fail with MODULE_NOT_FOUND | Intentional — pack-loader.cjs is created in Plan 02 |

## Self-Check

```
✓ lib/markos/packs/pack-schema.json — exists
✓ lib/markos/packs/b2b.pack.json — exists
✓ lib/markos/packs/b2c.pack.json — exists
✓ lib/markos/packs/agency.pack.json — exists
✓ lib/markos/packs/services.pack.json — exists
✓ lib/markos/packs/saas.pack.json — exists
✓ lib/markos/packs/ecommerce.pack.json — exists
✓ lib/markos/packs/info-products.pack.json — exists
✓ test/pack-loader.test.js — exists (12 test cases)
✓ d08a9c5 — commit exists (task 1)
✓ 041b134 — commit exists (task 2)
✓ 7c5a2d8 — commit exists (task 3)
✓ ajv@^8.18.0 — in package.json dependencies
✓ All 7 manifests pass Ajv v8 schema validation
```

## Self-Check: PASSED
