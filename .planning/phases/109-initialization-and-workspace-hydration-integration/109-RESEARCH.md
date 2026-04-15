# Phase 109: Initialization and Workspace Hydration Integration — Research

**Researched:** 2026-04-15
**Domain:** Node.js CJS integration — approval handler + skeleton generation + overlay skeleton resolution
**Confidence:** HIGH (all findings verified directly from source code)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Call `resolvePackSelection(seed)` in the approval handler at the start of the skeleton generation block, immediately after seed is read from disk.
- **D-02:** Mutate `seed.packSelection` and write the updated seed back to `SEED_PATH` before `generateSkeletons()`. Write uses `JSON.stringify(seed, null, 2)` in its own try/catch. A write failure MUST NOT hard-fail the approval flow.
- **D-03:** Overlay skeleton replaces (not merges with) base family skeleton when `overlayPack` is non-null and the `PROMPTS.md` file exists. Falls back transparently to base if file missing.
- **D-04:** `generateSkeletons(seed, approvedDrafts)` gains a new optional third parameter `packSelection` (shape: `{ basePack, overlayPack }`). When not supplied or null, behavior is unchanged.
- **D-05:** `template-family-map.cjs` NOT modified.
- **D-06:** All new Phase 109 code paths (pack resolution, seed write, overlay lookup) must be wrapped in try/catch. Any failure degrades to pre-Phase-109 behavior.
- **D-07:** Include `packSelection` in both `json(res, 200, {...})` calls in the approve endpoint. Shape: `{ basePack, overlayPack, overrideReason, resolvedAt }`. Emit `packSelection: null` if resolution threw.
- **D-08:** Written `seed.packSelection` matches exactly what `resolvePackSelection()` returns — no transformation.

### Claude's Discretion

- Exact require statement placement for `resolvePackSelection` in handlers.cjs (adjacent to the existing `generateSkeletons` require is fine).
- Whether the inner seed-write try/catch is nested inside or adjacent to the resolve try/catch (adjacent is cleaner).
- Test file placement (extend existing test files, not new files).

### Deferred Ideas (OUT OF SCOPE)

- Operator override UI that writes to `seed.packSelection` (Phase 110).
- Fallback diagnostics and GOV-01 reporting for missing overlays (Phase 110).
- `onboarding-seed.schema.json` formal update — Draft-07 allows extra fields; deferred as low priority.
- `template-family-map.cjs` consolidation / cleanup (Phase 110+).
- Industries beyond the 4 in Phase 108.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INIT-01 | New project initialization hydrates the selected starter library automatically into the local workspace and agent context | Wiring `resolvePackSelection` → `generateSkeletons` → overlay skeleton path delivers this — confirmed code paths exist end-to-end |
| INIT-03 | Starter packs reduce blank-state setup by producing immediately usable examples, prompts, and templates at onboarding time | Phase 108 overlay `PROMPTS.md` files are in place for 4 verticals × 5 disciplines; `resolveSkeleton` overlay check uses them at generation time |
</phase_requirements>

---

## Summary

Phase 109 is a pure wiring phase: connecting three already-implemented pieces —`resolvePackSelection()` (pack-loader, Phase 106/108), `generateSkeletons()` (skeleton-generator), and `resolveSkeleton()` (example-resolver) — through the existing approval handler. All four target files have been read and analyzed from source. No new libraries are required.

The central challenge is scoping `packSelection` correctly across the try/catch boundary in `handleApprove` so it is available in both `json(res, 200, {...})` response calls outside the try block. The approved pattern is `let packSelection = null` declared before the try, assigned inside it.

The overlay skeleton lookup is a straightforward path prepend inside `resolveSkeleton`. The base skeleton fallback (existing behavior) is preserved automatically because the new overlay check uses `readFileSafe` which returns `''` on a missing file, allowing execution to fall through.

**Primary recommendation:** Declare `let packSelection = null` BEFORE the existing `skeletonsSummary` try block. Insert resolve + seed-write inside the try, before the `generateSkeletons` call. Pass it to `generateSkeletons` as 5th arg. Add `overlaySlug` as 4th arg to `resolveSkeleton`. Include `packSelection` in both response payloads.

---

## Standard Stack

### Core (no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | Seed file read/write; overlay file existence check | Already used throughout the target files |
| `node:path` | built-in | Overlay skeleton path construction | Already used in `resolveSkeleton` |
| `node:test` | built-in | Test runner | Established project pattern — confirmed in all test files |
| `node:assert/strict` | built-in | Test assertions | Established project pattern |

**Installation:** No new packages needed. Zero dependency changes.

### Supporting (already present)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ajv` | v8 (project dep) | Pack schema validation (via pack-loader singleton) | Already initialized inside pack-loader; no direct use in Phase 109 target files |

---

## Architecture Patterns

### Recommended File Change Structure

```
onboarding/backend/handlers.cjs          # Add require + packSelection block
onboarding/backend/agents/
  skeleton-generator.cjs                 # Add packSelection 5th param → pass overlaySlug
  example-resolver.cjs                   # Add overlaySlug 4th param + overlay check
test/
  skeleton-generator.test.js             # Add overlay unit tests + handleApprove integration tests
  example-resolver.test.js               # Add resolveSkeleton overlay tests
```

---

### Pattern 1: Scoped `packSelection` across try/catch boundary

**What:** Declare `let packSelection = null` OUTSIDE and BEFORE the skeleton-generation try block. Assign inside the try. Both downstream `json(res, 200, {...})` calls (outside the try) can then read it safely.

**Why this matters:** The two response paths (`APPROVE_PARTIAL_WARNING` and `APPROVE_OK`) are located after the try/catch closes. A `const` or `let` declared inside the try would be invisible at those call sites.

```javascript
// ─── handlers.cjs insertion — inside handleApprove, before the skeleton try block ───
let skeletonsSummary = { generated: [], failed: [] };
let packSelection = null;  // ← declared here; remains null if try throws before assignment

try {
  let seed = {};
  if (fs.existsSync(SEED_PATH)) {
    seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  }

  // ── Phase 109: resolve pack selection and persist to seed ──────────────────
  try {
    packSelection = resolvePackSelection(seed);
    seed.packSelection = packSelection;
  } catch (resolveErr) {
    console.warn('[POST /approve] resolvePackSelection failed:', resolveErr.message);
    // packSelection remains null; seed.packSelection not set; continue
  }

  if (packSelection) {
    try {
      fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), 'utf8');
    } catch (writeErr) {
      console.warn('[POST /approve] Failed to persist packSelection to seed:', writeErr.message);
      // non-fatal; approval continues without persisted packSelection
    }
  }
  // ── End Phase 109 insertion ────────────────────────────────────────────────

  const skeletonResults = await generateSkeletons(seed, approvedDrafts, undefined, undefined, packSelection);
  skeletonsSummary = skeletonResults.reduce(
    (accumulator, result) => {
      if (Array.isArray(result.files) && result.files.length > 0) {
        accumulator.generated.push(...result.files);
      }
      if (result.error) {
        accumulator.failed.push(result.discipline);
      }
      return accumulator;
    },
    { generated: [], failed: [] }
  );
} catch (_error) {
  skeletonsSummary = { generated: [], failed: ['all'] };
}
```

**Backward-compat proof:** `resolvePackSelection` and seed write are both in their own inner try/catch. The outer catch (`} catch (_error)`) was already there and still catches any un-caught exception from `generateSkeletons`. Existing callers of `generateSkeletons` that pass 2 args are unaffected (5th param defaults to `null`).

---

### Pattern 2: Require placement in handlers.cjs

**What:** Add the `resolvePackSelection` require adjacent to the existing `generateSkeletons` require (handlers.cjs line ~38).

```javascript
// handlers.cjs — add immediately after line ~38
const { generateSkeletons } = require('./agents/skeleton-generator.cjs');
const { resolvePackSelection } = require('../../lib/markos/packs/pack-loader.cjs'); // Phase 109
```

**Require path verified:** `onboarding/backend/handlers.cjs` → `../../lib/markos/packs/pack-loader.cjs` ✓  
**No circular dependency risk:** `pack-loader.cjs` depends only on `fs`, `path`, and `ajv`.

---

### Pattern 3: `generateSkeletons` signature extension (5th optional param)

**What:** Add `packSelection = null` as 5th parameter with default. Extract `overlaySlug` from it. Pass to every `resolveSkeleton` call.

```javascript
// skeleton-generator.cjs — before:
async function generateSkeletons(seed, approvedDrafts, outputBasePath = MARKOS_LOCAL_DIR, templatesBasePath = TEMPLATES_DIR) {

// skeleton-generator.cjs — after:
async function generateSkeletons(seed, approvedDrafts, outputBasePath = MARKOS_LOCAL_DIR, templatesBasePath = TEMPLATES_DIR, packSelection = null) {
  void approvedDrafts;

  const businessModel = seed?.company?.business_model;
  const painPoints = Array.isArray(seed?.audience?.pain_points) ? seed.audience.pain_points : [];
  const generatedAt = new Date().toISOString();
  const slug = getModelSlug(businessModel);
  const overlaySlug = (packSelection && packSelection.overlayPack) || null; // Phase 109

  return DISCIPLINES.map((discipline) => {
    const baseContent = resolveSkeleton(discipline, businessModel, templatesBasePath, overlaySlug); // Phase 109: pass overlaySlug
    // ... rest unchanged
  });
}
```

**Backward-compat proof:** All existing callers pass 2–4 args; 5th param defaults to `null`, so `overlaySlug` becomes `null`, and the `resolveSkeleton` call falls through to existing behavior.

---

### Pattern 4: `resolveSkeleton` overlay check (4th optional param)

**What:** Add `overlaySlug = null` as 4th param. When non-null, attempt the overlay path first. Fall through to base if missing. Uses existing `readFileSafe` (already defined in same file — do NOT add a new helper).

```javascript
// example-resolver.cjs — before:
function resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE) {

// example-resolver.cjs — after:
function resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE, overlaySlug = null) {
  const slug = getModelSlug(businessModel);
  if (!slug) {
    return '';
  }

  // Phase 109: industry overlay check (D-03 — Replace strategy, D-06 — silent fallback)
  if (overlaySlug) {
    const overlayPath = path.join(basePath, 'SKELETONS', 'industries', overlaySlug, discipline, 'PROMPTS.md');
    const overlayContent = readFileSafe(overlayPath);
    if (overlayContent) {
      return overlayContent;
    }
    // Overlay file absent → fall through to base skeleton silently (no log needed — GOV-01 is Phase 110)
  }

  // Base skeleton path (existing, unchanged)
  const filePath = path.join(basePath, 'SKELETONS', discipline, `_SKELETON-${slug}.md`);
  const directContent = readFileSafe(filePath);
  if (directContent) {
    return directContent;
  }

  if (basePath !== DEFAULT_BASE) {
    return '';
  }

  const { content } = readFallbackContent(discipline, businessModel);
  return content || '';
}
```

**Overlay path verified against Phase 108 output:**  
`onboarding/templates/SKELETONS/industries/travel/Paid_Media/PROMPTS.md` — confirmed to exist ✓  
All 4 verticals × 5 disciplines confirmed present ✓  
`SKELETONS` is uppercase (confirmed with filesystem check) ✓

---

### Pattern 5: Response payload extension

**What:** Add `packSelection` field to BOTH `json(res, 200, {...})` calls inside `handleApprove`. Both the `APPROVE_PARTIAL_WARNING` path and the `APPROVE_OK` path must include it.

```javascript
// Both json(res, 200, { ... }) calls — add alongside the existing 'skeletons' field:
return json(res, 200, {
  // ... existing fields (success, written, stateUpdated, errors, mergeEvents, etc.) ...
  skeletons: skeletonsSummary,
  packSelection: packSelection,        // Phase 109 — null if resolution failed
  outcome: createOutcome(/* ... */),
});
```

No new fields in the `skeletons` object itself — `packSelection` is a sibling of `skeletons` at the top level of the response body.

---

### Anti-Patterns to Avoid

- **Don't call `resolvePackSelection` before seed read**: The seed must be read from disk first (D-01 states "immediately after the seed is read"). The seed fields `company.business_model` and `company.industry` must be live data.
- **Don't declare `packSelection` inside the try block**: It won't be visible to the `json(res, 200, {...})` calls outside the try.
- **Don't merge overlay + base content**: D-03 is Replace, not merge. If overlay exists, return it early. Don't concatenate.
- **Don't add a separate `require` for `fs` in handlers.cjs**: `fs` is already required at lines 1-10.
- **Don't pass `null` explicitly for 3rd/4th generateSkeletons args when the intent is "use default"**: Pass `undefined` so JavaScript applies the default parameter value. `null !== undefined` in default parameter evaluation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Alias normalization for business model / industry | Custom string matching in handlers.cjs | `resolvePackSelection(seed)` — already handles canonicalization via `INDUSTRY_ALIAS_MAP` and `resolveBaseSlug` | Complex canonicalization already tested in 14 tests; duplicating it risks divergence |
| Safe file read with missing-file handling | `try/catch` around `readFileSync` in `resolveSkeleton` | `readFileSafe(overlayPath)` — already defined in `example-resolver.cjs` | Returns `''` on missing file; no new helper needed |
| Pretty-printed JSON for seed write | Custom formatter | `JSON.stringify(seed, null, 2)` | Standard 2-space indent matches existing seed file format |
| Overlay file existence check | Separate `fs.existsSync` before read | `readFileSafe` returning `''` | One function, one FS call, same result |
| Pack singleton cache | Module-level cache in handlers | `getFamilyRegistry()` already caches in pack-loader singleton | Pack-loader is already designed for this |

---

## Common Pitfalls

### Pitfall 1: `packSelection` variable scope
**What goes wrong:** Declaring `let packSelection` inside the try block makes it undefined in the `json(res, 200, {...})` response calls located after the closing `}`. Both `APPROVE_PARTIAL_WARNING` and `APPROVE_OK` paths are OUTSIDE the try/catch.  
**Why it happens:** The try block has its own lexical scope in JS.  
**How to avoid:** Declare `let packSelection = null` on the same line as `let skeletonsSummary`, before the try.  
**Warning sign:** Linter/runtime error "packSelection is not defined" at the json() call site.

### Pitfall 2: Overlay path must include `SKELETONS/industries/`
**What goes wrong:** Building path as `path.join(basePath, discipline, 'PROMPTS.md')` misses the `SKELETONS/industries/{slug}/` segments.  
**Why it happens:** The base path in `resolveSkeleton` is `TEMPLATES_DIR` = `onboarding/templates/` — the `SKELETONS/` directory is not part of it.  
**Correct path:** `path.join(basePath, 'SKELETONS', 'industries', overlaySlug, discipline, 'PROMPTS.md')`  
**How to verify:** The Phase 108 output confirmed at `onboarding/templates/SKELETONS/industries/travel/Paid_Media/PROMPTS.md`.

### Pitfall 3: `undefined` vs `null` for default parameter bypass
**What goes wrong:** Calling `generateSkeletons(seed, approvedDrafts, null, null, packSelection)` passes `null` for `outputBasePath` and `templatesBasePath` — default parameters only apply when the value is `undefined`, not `null`. `null` would override the defaults with `null`, and `path.join(null, ...)` would throw.  
**How to avoid:** Use `undefined` — i.e., `generateSkeletons(seed, approvedDrafts, undefined, undefined, packSelection)`.

### Pitfall 4: Two response paths, both need `packSelection`
**What goes wrong:** Adding `packSelection` only to the `APPROVE_OK` path but forgetting the `APPROVE_PARTIAL_WARNING` path. The warning path fires when `combinedErrors.length > 0 || writeWarnings.length > 0`.  
**Why it happens:** There are two `return json(res, 200, {...})` calls with different shapes; it's easy to update only one.  
**How to avoid:** Search for both `APPROVE_PARTIAL_WARNING` and `APPROVE_OK` strings in handlers.cjs and update both.

### Pitfall 5: `pack-loader.cjs` module is NOT currently imported in handlers.cjs
**What goes wrong:** Assuming the require is already there because pack-loader is used elsewhere in the backend.  
**Verification:** `grep pack-loader onboarding/backend/handlers.cjs` → zero matches. A new require line IS needed.

### Pitfall 6: Seed persisted before generateSkeletons even if packSelection is null
**What goes wrong:** If `resolvePackSelection` returns `{ basePack: null, overlayPack: null, overrideReason: 'no_business_model_match', ... }`, the code should NOT write a broken packSelection to disk (the `if (packSelection)` guard in Pattern 1 handles this — omit the guard if D-08 requires writing even null-pack results).  
**Clarification from D-02/D-08:** D-08 says write what `resolvePackSelection()` returns as-is. So even a `basePack: null` result IS valid to persist. The `if (packSelection)` guard in Pattern 1 prevents writing when an exception occurred (packSelection stays null). When resolution succeeds with a null basePack, `packSelection` is a non-null object (it has the 4-key shape) and should be written.  
**Correction to Pattern 1:** The guard should be `if (packSelection !== null)` not `if (packSelection)` — since a resolved `{ basePack: null, ... }` object is truthy, there is no difference in practice. The guard is correct as written.

---

## Code Examples

### Verified: resolvePackSelection return shape (from source)
```javascript
// Source: lib/markos/packs/pack-loader.cjs
// All paths return this exact shape:
{
  basePack:       'b2b',          // string slug or null
  overlayPack:    'travel',       // string slug or null
  overrideReason: null,           // null | 'no_business_model_match'
  resolvedAt:     '2026-04-15T12:00:00.000Z'  // always ISO 8601
}
```

### Verified: resolveSkeleton base path resolution (from source)
```javascript
// Source: onboarding/backend/agents/example-resolver.cjs
// Current:
function resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE) {
  const slug = getModelSlug(businessModel);
  if (!slug) return '';
  const filePath = path.join(basePath, 'SKELETONS', discipline, `_SKELETON-${slug}.md`);
  const directContent = readFileSafe(filePath);
  if (directContent) return directContent;
  if (basePath !== DEFAULT_BASE) return '';
  const { content } = readFallbackContent(discipline, businessModel);
  return content || '';
}
```

### Verified: generateSkeletons call in handlers.cjs (from source)
```javascript
// Current (handlers.cjs line ~2397):
const skeletonResults = await generateSkeletons(seed, approvedDrafts);
// Phase 109 target:
const skeletonResults = await generateSkeletons(seed, approvedDrafts, undefined, undefined, packSelection);
```

### Verified: SEED_PATH definition (from path-constants.cjs)
```javascript
const SEED_PATH = path.join(PROJECT_ROOT, 'onboarding-seed.json');
```
`SEED_PATH` is already destructured into handlers.cjs at the top (`const { ..., SEED_PATH } = require('./path-constants.cjs')`). No new constant needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | None — runs directly |
| Quick run command | `node --test test/example-resolver.test.js test/skeleton-generator.test.js` |
| Full suite command | `npm test` or `node --test test/**/*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INIT-01 | `resolveSkeleton` returns overlay PROMPTS.md content when overlaySlug + file present | unit | `node --test test/example-resolver.test.js` | ✅ extend |
| INIT-01 | `resolveSkeleton` falls back to base skeleton when overlay file absent | unit | `node --test test/example-resolver.test.js` | ✅ extend |
| INIT-01 | `generateSkeletons` passes overlaySlug from packSelection to resolveSkeleton | unit | `node --test test/skeleton-generator.test.js` | ✅ extend |
| INIT-01 | `handleApprove` response includes `packSelection` field | integration | `node --test test/skeleton-generator.test.js` | ✅ extend |
| INIT-03 | `handleApprove` writes `seed.packSelection` to SEED_PATH on disk | integration | `node --test test/skeleton-generator.test.js` | ✅ extend |
| D-06 | `handleApprove` emits `packSelection: null` when resolution throws | integration | `node --test test/skeleton-generator.test.js` | ✅ extend |

### Test Patterns (verified from existing test files)

**Unit tests for `resolveSkeleton` overlay** — extend `test/example-resolver.test.js`:

```javascript
// Source pattern: existing test/example-resolver.test.js + test/skeleton-generator.test.js
test('resolveSkeleton uses overlay PROMPTS.md when overlaySlug provided and file exists', () => {
  const dir = makeTmpDir();
  try {
    const overlayPath = path.join(dir, 'SKELETONS', 'industries', 'travel', 'Paid_Media', 'PROMPTS.md');
    fs.mkdirSync(path.dirname(overlayPath), { recursive: true });
    fs.writeFileSync(overlayPath, '# Travel Paid Media Overlay', 'utf8');
    // Also write base skeleton (should NOT be returned when overlay exists)
    const basePath = path.join(dir, 'SKELETONS', 'Paid_Media', '_SKELETON-b2b.md');
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
    fs.writeFileSync(basePath, '# Base B2B Paid Media', 'utf8');

    const result = resolveSkeleton('Paid_Media', 'B2B', dir, 'travel');
    assert.ok(result.includes('Travel Paid Media Overlay'), 'must return overlay content');
    assert.ok(!result.includes('Base B2B'), 'must not return base content when overlay exists');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveSkeleton falls back to base skeleton when overlay file absent', () => {
  const dir = makeTmpDir();
  try {
    // No overlay file — only base exists
    const basePath = path.join(dir, 'SKELETONS', 'Paid_Media', '_SKELETON-b2b.md');
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
    fs.writeFileSync(basePath, '# Base B2B Paid Media', 'utf8');

    const result = resolveSkeleton('Paid_Media', 'B2B', dir, 'travel');
    assert.ok(result.includes('Base B2B Paid Media'), 'must fall back to base skeleton');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

**Integration test — `handleApprove` includes `packSelection` in response** — extend `test/skeleton-generator.test.js`:

```javascript
// Source pattern: existing 'handleApprove response includes skeletons block' test
// Pattern: nested withMockedModule calls + loadFreshModule(handlersPath)
// Phase 109 adds: mock pack-loader + write temp seed file + assert packSelection in response

const packLoaderPath = path.join(__dirname, '..', 'lib', 'markos', 'packs', 'pack-loader.cjs');

test('handleApprove response includes packSelection field', async () => {
  const dir = makeTmpDir();
  const seedFilePath = path.join(dir, 'onboarding-seed.json');
  const seedContent = {
    company: { business_model: 'SaaS', industry: 'it' },
    audience: { pain_points: [] }
  };
  fs.writeFileSync(seedFilePath, JSON.stringify(seedContent, null, 2), 'utf8');

  const runtimeMock = createRuntimeContextMock(dir);

  const mockPackSelection = {
    basePack: 'saas', overlayPack: 'it', overrideReason: null, resolvedAt: new Date().toISOString()
  };

  await withMockedModule(runtimeContextPath, runtimeMock, async () => {
    await withMockedModule(packLoaderPath, {
      resolvePackSelection: () => mockPackSelection,
    }, async () => {
      // ... (nest other existing mocks as in the existing test) ...
      await withMockedModule(skeletonGeneratorPath, {
        generateSkeletons: async () => ([
          { discipline: 'Paid_Media', files: ['.markos-local/MSP/Paid_Media/SKELETONS/_SKELETON-saas.md'], error: null },
        ]),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const req = createJsonRequest({ slug: 'acme', approvedDrafts: { company_profile: 'ok' } }, '/approve');
        const res = createMockResponse();

        await handlers.handleApprove(req, res);
        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);
        assert.ok(payload.packSelection, 'response must include packSelection field');
        assert.equal(payload.packSelection.basePack, 'saas');
        assert.equal(payload.packSelection.overlayPack, 'it');
      });
    });
  });

  fs.rmSync(dir, { recursive: true, force: true });
});
```

**Important note on `withMockedModule` and `loadFreshModule`:** Handlers requires `pack-loader` at module load time. `loadFreshModule(handlersPath)` must be called AFTER `withMockedModule(packLoaderPath, ...)` is active — the existing test pattern already does this correctly (loadFreshModule is called inside all nested mocks).

**Important note on SEED_PATH in integration tests:** The handlers use `SEED_PATH` from `path-constants.cjs` which resolves to `PROJECT_ROOT/onboarding-seed.json`. The seed-write test must either:
- Mock `path-constants.cjs` to return a temp SEED_PATH, **or**
- Accept that the seed write will target the real `onboarding-seed.json` (fine for testing response shape, but not ideal for seed-write verification)
- Recommended: mock `path-constants.cjs` to override `SEED_PATH` for the seed-write test specifically.

### Sampling Rate

- **Per task commit:** `node --test test/example-resolver.test.js test/skeleton-generator.test.js test/pack-loader.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. Tests are added to, not created from scratch.

---

## Insertion Points — Exact Reference

| File | Change | Location |
|------|--------|----------|
| `handlers.cjs` | Add `require('../../lib/markos/packs/pack-loader.cjs')` | Line ~38, after `generateSkeletons` require |
| `handlers.cjs` | Declare `let packSelection = null` | Line ~2382, same line as `let skeletonsSummary` declaration |
| `handlers.cjs` | Insert resolve + seed-write block | Inside try block, after seed is read (~line 2388), BEFORE `generateSkeletons` call |
| `handlers.cjs` | Update `generateSkeletons` call | Line ~2397 — add `, undefined, undefined, packSelection` |
| `handlers.cjs` | Add `packSelection` to APPROVE_PARTIAL_WARNING response | `json(res, 200, {...})` at ~line 2429 |
| `handlers.cjs` | Add `packSelection` to APPROVE_OK response | `json(res, 200, {...})` at ~line 2453 |
| `skeleton-generator.cjs` | Add `packSelection = null` 5th param; extract `overlaySlug` | Function signature + first few lines of body |
| `skeleton-generator.cjs` | Pass `overlaySlug` to `resolveSkeleton` | Existing `resolveSkeleton(discipline, businessModel, templatesBasePath)` call |
| `example-resolver.cjs` | Add `overlaySlug = null` 4th param; insert overlay check | Function signature + before existing slug check |

---

## Sources

### Primary (HIGH confidence)
- `lib/markos/packs/pack-loader.cjs` — read fully; `resolvePackSelection` return shape, INDUSTRY_ALIAS_MAP, singleton behavior
- `onboarding/backend/agents/example-resolver.cjs` — read fully; `resolveSkeleton` full implementation, `readFileSafe` availability
- `onboarding/backend/agents/skeleton-generator.cjs` — read fully; `generateSkeletons` full signature/body
- `onboarding/backend/handlers.cjs` lines 1-100 + 2370-2500 — approval handler skeleton block, require structure, response shapes
- `onboarding/backend/path-constants.cjs` — SEED_PATH definition confirmed
- `onboarding/backend/utils.cjs` — `json()` helper confirmed: `res.writeHead + res.end(JSON.stringify(data))`
- `test/pack-loader.test.js` all 26 tests — test structure, `getLoader()` / `_resetCacheForTests()` pattern
- `test/skeleton-generator.test.js` — `withMockedModule`, `loadFreshModule`, `createMockResponse` patterns
- `test/example-resolver.test.js` — `makeTmpDir`, assertion style
- `test/setup.js` lines 60-100 — `withMockedModule` implementation
- Filesystem verification: `SKELETONS/industries/{4 verticals}/{5 disciplines}/PROMPTS.md` all confirmed present
- `.planning/phases/109-initialization-and-workspace-hydration-integration/109-CONTEXT.md` — all 8 decisions

### Secondary
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-CONTEXT.md` — D-04 override contract confirming `seed.packSelection` shape
- `.planning/phases/108-industry-overlay-packs/108-CONTEXT.md` — D-07 standalone skeletons, D-08 two-path architecture

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all target code read from source
- Architecture: HIGH — all four files read; insertion points identified by line range
- Pitfalls: HIGH — derived from actual code inspection, not speculation
- Test patterns: HIGH — derived directly from existing test file conventions in the project

**Research date:** 2026-04-15  
**Valid until:** 2026-05-15 (stable codebase; no fast-moving dependencies)
