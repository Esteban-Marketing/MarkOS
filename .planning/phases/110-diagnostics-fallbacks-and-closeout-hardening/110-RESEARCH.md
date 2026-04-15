# Phase 110: Diagnostics, Fallbacks, and Closeout Hardening — Research

**Researched:** 2026-04-15
**Domain:** Onboarding approval flow extension, pack diagnostics, completeness graduation, Node.js integration testing
**Confidence:** HIGH (all findings verified directly from codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full interactive "Review Library Selection" step ships now — not read-only, not deferred.
- **D-02:** New distinct step inside the existing onboarding approval flow, positioned between draft review and final confirm.
- **D-03:** Both base family and overlay can be overridden independently in the same step.
- **D-04:** Per-discipline completeness grid shown inline for the current combination.
- **D-05:** Add `packDiagnostics` to POST /approve response. Shape: `{ basePack, overlayPack, overrideReason, completeness, fallbackApplied: boolean }`.
- **D-06:** `fallbackApplied: true` when any discipline is `"stub"` or `"missing"`.
- **D-07:** Existing `console.warn` calls stay as-is; Phase 110 adds structured payloads alongside them.
- **D-08/D-09:** Graduate 5 base packs + 4 overlay packs from `partial → full`. `agency` and `info-products` remain `stub`.
- **D-10:** Integration tests: 9 combos + fallback variants (unrecognized industry, missing overlay file, null-basePack, stub-pack).
- **D-11:** No CLI validate script — test suite only.
- **Phase 109 D-06 (inherited):** ALL new code paths wrapped in try/catch with soft-fail semantics.
- **Phase 106 D-04 (locked):** When operator overrides, `seed.packSelection.overrideReason = "operator_override"`.
- **Phase 105 D-05 (locked):** `template-family-map.cjs` public API must not be touched.

### Claude's Discretion
- Exact UI component structure (React/JSX vs vanilla HTML/JS).
- `packDiagnostics` field placement in response JSON alongside existing `packSelection`.
- Completeness grid visual style (table/badge/list) — match existing onboarding UI.
- Integration test file location and suite numbering.

### Deferred Ideas (OUT OF SCOPE)
- Dedicated `/api/packs/diagnostics` GET endpoint (inline in approve response is sufficient).
- `validate-packs.cjs` CLI script.
- `agency` and `info-products` content authoring.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOV-01 | Unsupported or partial combinations degrade gracefully to safe fallback templates with visible diagnostics rather than hard failure | `packDiagnostics` payload, `fallbackApplied` flag, override UI |
| GOV-02 | Pack selection and generated artifacts remain tenant-safe, auditable, and compatible with current approval-aware flows | Override writes `overrideReason="operator_override"` to `seed.packSelection`; existing approval gate pattern preserved |
| INIT-02 | Operators can inspect which model and industry pack was selected and override it before final approval | "Review Library Selection" step in approval flow with completeness grid |
</phase_requirements>

---

## Summary

Phase 110 closes out v3.9.0 by adding visibility and operator control to the pack selection that Phase 109 established. There are four parallel workstreams: (1) an operator override UI step inserted into the existing vanilla-JS onboarding flow; (2) a `packDiagnostics` additive field in the `/approve` response; (3) JSON manifest graduation for 9 authored packs; and (4) integration tests in a new `test/pack-diagnostics.test.js` file.

The codebase is pure vanilla HTML+JS for the onboarding UI (`onboarding/index.html` + `onboarding/onboarding.js`), with a Node.js/HTTP backend in `onboarding/backend/handlers.cjs`. There is no React or framework in the onboarding flow — the new step component is plain HTML with CSS classes from the existing `.step-section` pattern. The app/(markos)/ Next.js pages are unrelated to this onboarding flow and do not need modification.

All 9 authored packs already have all 5 discipline PROMPTS.md files on disk — graduation is purely a JSON field edit (`"partial"` → `"full"`) with no content authoring required. Existing tests do not assert on `completeness` values and will stay green after graduation.

**Primary recommendation:** Add step 4 to `onboarding/index.html`, bump `TOTAL_STEPS` from 3 to 4, add a new `GET /api/packs/resolution` handler for the preview, and add `getPackDiagnostics()` to `pack-loader.cjs` for the approve response.

---

## Standard Stack

### Core (existing — no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node.js built-in | Test runner | Already used in all test/*.test.js files |
| `node:assert/strict` | Node.js built-in | Assertions | Already used in all test/*.test.js files |
| `ajv` | Already installed | Pack schema validation | Already used in `pack-loader.cjs` |
| `fs` (node built-in) | Node.js built-in | Seed file I/O | Already used in handlers.cjs |

### Established Helpers (already in codebase — use as-is)
| Helper | Location | Purpose |
|--------|----------|---------|
| `withMockedModule` | `test/setup.js` | Module-level dependency injection for integration tests |
| `createJsonRequest` | `test/setup.js` | Create mock HTTP request objects |
| `createMockResponse()` | Pattern in `test/skeleton-generator.test.js` (inline) | Mock HTTP response |
| `loadFreshModule()` | Pattern in `test/skeleton-generator.test.js` (inline) | Clear require cache and reload a module |
| `json(res, code, body)` | `onboarding/backend/handlers.cjs` (imported) | Send JSON HTTP responses |
| `_resetCacheForTests()` | `lib/markos/packs/pack-loader.cjs` | Clear pack registry singleton between tests |

**Installation:** No new packages required. All needed utilities already exist.

---

## Architecture Patterns

### Pattern 1: Onboarding Step Extension

The onboarding flow is **vanilla HTML + plain JS**, not React. Step sections are `<section class="step-section" data-step="N">`. Navigation is controlled by `currentStep` integer, `TOTAL_STEPS` constant, and `showStep()` / `updateUI()` functions.

**Current step structure** (`onboarding/index.html`):
```
data-step="0"  Omni-Input Gate
data-step="1"  Company & Brand
data-step="2"  Conversational Interview
data-step="3"  AI Draft Review (contains publish bar + btnPublish)
```

**After Phase 110:**
```
data-step="0"  Omni-Input Gate
data-step="1"  Company & Brand
data-step="2"  Conversational Interview
data-step="3"  AI Draft Review  ← btnPublish replaced with "Review Library Selection →" button
data-step="4"  Review Library Selection (NEW — completeness grid + override dropdowns)
               ← "Confirm & Write Vault Notes" calls POST /approve
```

**Key changes in `onboarding.js`:**
- `TOTAL_STEPS = 4` (was 3)
- Step 3 publish bar: replace `btnPublish` → call new `showPackOverrideStep()` function instead of calling `handlePublish()`
- Add `case 4:` in `showStep()` and `updateUI()` to manage step 4 UI state
- Step 4 loads from `GET /api/packs/resolution?slug={slug}` on entry; renders completeness grid; wires override dropdowns; submit calls `handlePublish()` with optional override payload

**Step 4 HTML pattern (follow existing step-section conventions):**
```html
<!-- Step 4: Review Library Selection -->
<section class="step-section" data-step="4" id="packOverrideStep">
  <h2 class="step-title">Review Library Selection</h2>
  <p class="draft-review-subtext">
    Auto-resolved pack selection. Override before writing vault notes.
  </p>

  <!-- Auto-resolved display -->
  <div class="pack-selection-summary" id="packSelectionSummary">
    <!-- Populated by JS after GET /api/packs/resolution -->
  </div>

  <!-- Override controls -->
  <div class="pack-override-controls" id="packOverrideControls">
    <label for="packBaseSelect">Base Family</label>
    <select id="packBaseSelect"><!-- Populated by JS --></select>

    <label for="packOverlaySelect">Industry Overlay</label>
    <select id="packOverlaySelect"><!-- Populated by JS (includes "None" option) --></select>
  </div>

  <!-- Per-discipline completeness grid -->
  <div class="completeness-grid" id="completenessGrid">
    <!-- Populated by JS after /api/packs/resolution response -->
  </div>

  <div class="publish-bar">
    <button class="btn-publish" id="btnConfirmPack">Confirm &amp; Write Vault Notes</button>
    <div class="gate-status-bar" id="packGateStatusBar" role="status" aria-live="polite"></div>
  </div>
</section>
```

### Pattern 2: Preview Endpoint (GET /api/packs/resolution)

New lightweight handler that resolves pack selection and builds diagnostics for the override UI. **No writes — read-only.**

**Server routing addition in `server.cjs`:**
```javascript
if (req.method === 'GET' && req.url.startsWith('/api/packs/resolution'))
  return handlers.handlePacksResolution(req, res);
```

**Handler in `handlers.cjs`:**
```javascript
async function handlePacksResolution(req, res) {
  try {
    let seed = {};
    if (fs.existsSync(SEED_PATH)) {
      seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    }
    const packSelection = resolvePackSelection(seed);
    const packDiagnostics = getPackDiagnostics(packSelection);
    return json(res, 200, {
      success: true,
      packSelection,
      packDiagnostics,
      availablePacks: getAvailablePackOptions(), // list for override dropdowns
    });
  } catch (err) {
    console.warn('[GET /api/packs/resolution] Error:', err.message);
    return json(res, 200, {
      success: false,
      packSelection: null,
      packDiagnostics: null,
      availablePacks: { base: [], overlay: [] },
    });
  }
}
```

### Pattern 3: Operator Override in POST /approve

The existing `handleApprove()` always calls `resolvePackSelection(seed)`. Phase 110 adds a pre-existing-override check and receives an optional `packOverride` field from the request body:

**Current code (handlers.cjs line ~2393):**
```javascript
packSelection = resolvePackSelection(seed);
seed.packSelection = packSelection;
```

**Phase 110 replacement (inside the existing try/catch, same location):**
```javascript
// Phase 110: Respect operator override if present in request body OR in seed
// Source: CONTEXT.md D-03, D-06 (Phase 106 override contract)
const packOverride = (body && body.packOverride) || null;
if (packOverride && packOverride.basePack) {
  packSelection = {
    basePack:       packOverride.basePack,
    overlayPack:    packOverride.overlayPack   || null,
    overrideReason: 'operator_override',
    resolvedAt:     new Date().toISOString(),
  };
  seed.packSelection = packSelection;
} else if (seed.packSelection && seed.packSelection.overrideReason === 'operator_override') {
  // Already written by a prior session — preserve it
  packSelection = seed.packSelection;
} else {
  packSelection = resolvePackSelection(seed);
  seed.packSelection = packSelection;
}
```

Then `packDiagnostics` is computed AFTER packSelection is determined:

```javascript
// Phase 110: build packDiagnostics alongside packSelection
let packDiagnostics = null;
try {
  packDiagnostics = getPackDiagnostics(packSelection);
} catch (diagErr) {
  console.warn('[POST /approve] getPackDiagnostics failed:', diagErr.message);
  // packDiagnostics stays null — soft fail (D-06 / inherited Phase 109 D-06)
}
```

Both `json()` calls already have `packSelection: packSelection`. Add `packDiagnostics: packDiagnostics` alongside each one.

### Pattern 4: getPackDiagnostics() — New Pack Loader Export

Add to `lib/markos/packs/pack-loader.cjs`. Reads base pack completeness from the existing registry + overlay completeness by loading the `.industry.json` file directly.

```javascript
// ─── Pack diagnostics builder ─────────────────────────────────────────────────
/**
 * Build the packDiagnostics payload from a resolved packSelection.
 * Called by handlers.cjs in the /approve response (Phase 110).
 *
 * @param {{ basePack: string|null, overlayPack: string|null,
 *           overrideReason: string|null, resolvedAt: string }} packSelection
 * @returns {{ basePack: string|null, overlayPack: string|null,
 *             overrideReason: string|null, completeness: object,
 *             fallbackApplied: boolean }}
 */
function getPackDiagnostics(packSelection) {
  if (!packSelection) {
    return {
      basePack:       null,
      overlayPack:    null,
      overrideReason: null,
      completeness:   {},
      fallbackApplied: true, // no pack = fallback
    };
  }

  const { basePack, overlayPack, overrideReason } = packSelection;

  // Step 1: base pack completeness
  let completeness = {};
  if (basePack) {
    const registry = getFamilyRegistry();
    const entry = registry.find(e => e.slug === basePack);
    if (entry && entry.completeness) {
      completeness = { ...entry.completeness };
    }
  }

  // Step 2: overlay completeness — load .industry.json directly (not in getFamilyRegistry)
  if (overlayPack) {
    const overlayFilePath = path.join(__dirname, 'industries', overlayPack + '.industry.json');
    try {
      const overlayManifest = JSON.parse(fs.readFileSync(overlayFilePath, 'utf8'));
      if (overlayManifest.completeness) {
        // Overlay can reduce effective completeness if overlay coverage is lower than base
        const RANK = { full: 3, partial: 2, stub: 1, missing: 0 };
        for (const [discipline, baseLevel] of Object.entries(completeness)) {
          const overlayLevel = overlayManifest.completeness[discipline];
          if (overlayLevel && RANK[overlayLevel] < RANK[baseLevel]) {
            completeness[discipline] = overlayLevel;
          }
        }
      }
    } catch (err) {
      console.warn('[pack-loader] getPackDiagnostics: could not read overlay', overlayPack, ':', err.message);
    }
  }

  // Step 3: fallbackApplied — true if any discipline is stub or missing, or no basePack
  const FALLBACK_LEVELS = new Set(['stub', 'missing']);
  const fallbackApplied = !basePack ||
    Object.values(completeness).some(level => FALLBACK_LEVELS.has(level));

  return {
    basePack:       basePack   || null,
    overlayPack:    overlayPack || null,
    overrideReason: overrideReason || null,
    completeness,
    fallbackApplied,
  };
}
```

Export alongside existing exports:
```javascript
module.exports = {
  getFamilyRegistry,
  resolvePackSelection,
  getPackDiagnostics,        // Phase 110
  getAvailablePackOptions,   // Phase 110 (for override UI dropdowns)
  _resetCacheForTests,
};
```

### Pattern 5: getAvailablePackOptions() — For Override UI Dropdowns

Returns the list of packs the operator can select in dropdowns. Reads from loaded registry + industries/ directory.

```javascript
/**
 * Returns { base: [{slug, displayName, completeness}], overlay: [{slug, displayName, completeness}] }
 * Used by GET /api/packs/resolution to populate the override UI dropdowns.
 */
function getAvailablePackOptions() {
  const registry = getFamilyRegistry();
  const base = registry
    .filter(e => e.type === 'base')
    .map(e => ({ slug: e.slug, displayName: e.displayName, completeness: e.completeness }));

  const overlay = [];
  try {
    const industryFiles = fs.readdirSync(path.join(PACKS_DIR, 'industries'))
      .filter(f => f.endsWith('.industry.json'))
      .sort();
    const validate = getValidator();
    for (const file of industryFiles) {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, 'industries', file), 'utf8'));
        if (validate(manifest)) {
          overlay.push({ slug: manifest.slug, displayName: manifest.displayName, completeness: manifest.completeness });
        }
      } catch { /* skip invalid files */ }
    }
  } catch (err) {
    console.warn('[pack-loader] getAvailablePackOptions: could not read industries dir:', err.message);
  }

  return { base, overlay };
}
```

### Pattern 6: Completeness Graduation — JSON-Only Change

All 9 packs have all 5 discipline PROMPTS.md files already on disk (verified):
- `onboarding/templates/SKELETONS/{slug}/{discipline}/PROMPTS.md` — exists for all 5 base packs
- `onboarding/templates/SKELETONS/industries/{slug}/{discipline}/PROMPTS.md` — exists for all 4 overlay packs

Graduation = edit each JSON manifest: change `completeness.{discipline}` from `"partial"` to `"full"` for all 5 disciplines, bump the version patch, add changelog entry.

**Graduation checklist per pack (run before editing JSON):**
```bash
# Verify all 5 discipline PROMPTS.md exist before graduating
for disc in Paid_Media Content_SEO Lifecycle_Email Social Landing_Pages; do
  echo "$disc: $(ls onboarding/templates/SKELETONS/{slug}/$disc/PROMPTS.md 2>/dev/null || echo MISSING)"
done
```

**9 packs to graduate:**
1. `lib/markos/packs/b2b.pack.json` — 5 disciplines `partial → full`
2. `lib/markos/packs/b2c.pack.json` — 5 disciplines `partial → full`
3. `lib/markos/packs/saas.pack.json` — 5 disciplines `partial → full`
4. `lib/markos/packs/ecommerce.pack.json` — 5 disciplines `partial → full`
5. `lib/markos/packs/services.pack.json` — 5 disciplines `partial → full`
6. `lib/markos/packs/industries/travel.industry.json` — 5 disciplines `partial → full`
7. `lib/markos/packs/industries/it.industry.json` — 5 disciplines `partial → full`
8. `lib/markos/packs/industries/marketing-services.industry.json` — 5 disciplines `partial → full`
9. `lib/markos/packs/industries/professional-services.industry.json` — 5 disciplines `partial → full`

**Do NOT touch:**
- `agency.pack.json` — remains `stub` (D-09)
- `info-products.pack.json` — remains `stub` (D-09)

### Pattern 7: Integration Test Structure (test/pack-diagnostics.test.js)

Follows `test/skeleton-generator.test.js` pattern exactly: `withMockedModule`, `createJsonRequest`, inline `createMockResponse`, `loadFreshModule`.

```javascript
'use strict';
const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');

const { createJsonRequest, withMockedModule } = require('./setup.js');

// Paths for mocking (must match exactly how handlers.cjs requires them)
const handlersPath     = path.join(__dirname, '..', 'onboarding', 'backend', 'handlers.cjs');
const vaultWriterPath  = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'vault-writer.cjs');
const runReportPath    = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'run-report.cjs');
const vectorStorePath  = path.join(__dirname, '..', 'onboarding', 'backend', 'vector-store-client.cjs');
const telemetryPath    = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'telemetry.cjs');
const runtimeCtxPath   = path.join(__dirname, '..', 'onboarding', 'backend', 'runtime-context.cjs');
const skeletonGenPath  = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'skeleton-generator.cjs');
const packLoaderPath   = path.join(__dirname, '..', 'lib', 'markos', 'packs', 'pack-loader.cjs');

function makeTmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-diag-test-')); }
function createMockResponse() { /* same pattern as skeleton-generator.test.js */ }
function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}
function createRuntimeContextMock(outputRoot) { /* same pattern as skeleton-generator.test.js */ }
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency injection for integration tests | Custom mock factory | `withMockedModule` from `test/setup.js` | Already battle-tested in 3+ test files; re-use exact pattern |
| Pack manifest loading | Custom fs.readdir loop | `getFamilyRegistry()` from `pack-loader.cjs` | Already handles validation, caching, error logging |
| Overlay manifest reading | Separate loader module | Inline `fs.readFileSync` inside `getPackDiagnostics` with try/catch | Overlays are not in the base registry; read on demand with soft-fail |
| Completeness ranking | Custom enum comparison | Static `RANK` object `{ full:3, partial:2, stub:1, missing:0 }` | Simple integer comparison sufficient |
| Step navigation framework | Custom router/state machine | Increment `currentStep` + `updateUI()` | Existing pattern in onboarding.js; no abstraction needed |
| Business model normalization | Re-implement canonicalize | `canonicalizeValue()` already in pack-loader; `resolvePackSelection()` already used | D-05 from Phase 109: do NOT touch template-family-map.cjs public API |
| Pack dropdown list construction | Hardcoded list | `getAvailablePackOptions()` (new pack-loader export) | Dynamic from actual loaded manifests; includes future packs automatically |

---

## Common Pitfalls

### Pitfall 1: Re-resolving After Operator Override
**What goes wrong:** When `handleApprove()` runs `resolvePackSelection(seed)` unconditionally, any operator override written to `seed.packSelection` is silently overwritten before `generateSkeletons()` is called.
**Why it happens:** Phase 109 code always overwrites; Phase 110 is the first phase that writes an override.
**How to avoid:** Check `body.packOverride` OR `seed.packSelection.overrideReason === 'operator_override'` BEFORE calling `resolvePackSelection()`. Insert the check at the start of the Phase 109 try/catch block (handlers.cjs line ~2393).
**Warning signs:** Integration test "operator_override path" failing because `packSelection.overrideReason` is null in the response.

### Pitfall 2: Pack-Loader Cache Poisoning in Tests
**What goes wrong:** `getFamilyRegistry()` caches the result in `_registryCache`. Tests that mock `packLoaderPath` but don't call `_resetCacheForTests()` may get stale data.
**Why it happens:** The singleton is module-level, not per-request.
**How to avoid:** Always use `withMockedModule(packLoaderPath, {...})` to inject mock exports at the `require.cache` level. Since `loadFreshModule(handlersPath)` clears handlers from require cache, and handlers re-requires pack-loader, the mock in require.cache will be picked up correctly.
**Warning signs:** Tests pass in isolation but fail in sequence; `registry.length` unexpectedly wrong.

### Pitfall 3: Overlay Not Loaded in getPackDiagnostics
**What goes wrong:** `getFamilyRegistry()` only loads `*.pack.json` files from `PACKS_DIR`. Overlay manifests (`*.industry.json` in `industries/`) are NOT in the registry.
**Why it happens:** Intentional design — base and overlay registries are separate.
**How to avoid:** `getPackDiagnostics()` must load the overlay `.industry.json` file independently via `fs.readFileSync` inside a try/catch. Use `path.join(__dirname, 'industries', overlayPack + '.industry.json')`.
**Warning signs:** `completeness` in `packDiagnostics` only shows base pack disciplines; overlay discipline grading never appears.

### Pitfall 4: Existing Tests Failing After Graduation
**What goes wrong:** Tests that hardcode `completeness: "partial"` assertions break when packs graduate to `"full"`.
**Why it happens:** Easy mistake when searching for strings that need updating.
**How to avoid:** Search all test files for `"partial"` string before graduating:
```bash
grep -rn '"partial"' test/
```
**Current state (verified):** No existing test in `test/pack-loader.test.js`, `test/skeleton-generator.test.js`, or `test/example-resolver.test.js` assertions check for `"partial"` in completeness fields. The 108.10 test validates schema (both `"partial"` and `"full"` are valid enum values). Graduate confidently.

### Pitfall 5: step-section data-step Mismatch
**What goes wrong:** The `updateUI()` function iterates all `.step-section` elements and toggles `.active` based on `parseInt(section.getAttribute('data-step')) === currentStep`. Adding a `data-step="4"` section without bumping `TOTAL_STEPS` lets the step show but `updateUI()` progress bar computation is wrong.
**Why it happens:** `TOTAL_STEPS` and `data-step` max are coupled.
**How to avoid:** Bump `TOTAL_STEPS = 4` and add `data-step="4"` section simultaneously. Also update the `"Step X of N"` display in the progress indicator (currently hardcoded "1 of 7" in HTML, populated by JS).

### Pitfall 6: packDiagnostics Breaks When packSelection is null
**What goes wrong:** When `resolvePackSelection()` throws (soft-fail path), `packSelection` is null. Passing null to `getPackDiagnostics(null)` must return a valid default shape, not throw.
**Why it happens:** Soft-fail means packSelection can be null at both json() call sites.
**How to avoid:** `getPackDiagnostics()` must handle the null input case explicitly (return `{ basePack: null, ..., fallbackApplied: true }`). Wrap the `getPackDiagnostics()` call in its own try/catch with `packDiagnostics` defaulting to null.

---

## Code Examples

### Example 1: handleApprove body extraction pattern (existing, from handlers.cjs)

```javascript
// Source: handlers.cjs handleApprove pattern (observed)
const body = await readBody(req);   // already exists
const { approvedDrafts, slug } = body;

// Phase 110 addition — extract packOverride:
const packOverride = (body && body.packOverride) || null;
```

### Example 2: resolve + diagnostics sequence in handleApprove

```javascript
// Phase 110: resolve with operator-override awareness
// Soft-fail semantics (inherited Phase 109 D-06)
let packSelection = null;
let packDiagnostics = null;

try {
  if (packOverride && packOverride.basePack) {
    packSelection = {
      basePack:       packOverride.basePack,
      overlayPack:    packOverride.overlayPack || null,
      overrideReason: 'operator_override',
      resolvedAt:     new Date().toISOString(),
    };
  } else if (seed.packSelection && seed.packSelection.overrideReason === 'operator_override') {
    packSelection = seed.packSelection;
  } else {
    packSelection = resolvePackSelection(seed);
  }
  seed.packSelection = packSelection;
} catch (resolveErr) {
  console.warn('[POST /approve] resolvePackSelection failed:', resolveErr.message);
}

try {
  packDiagnostics = getPackDiagnostics(packSelection);
} catch (diagErr) {
  console.warn('[POST /approve] getPackDiagnostics failed:', diagErr.message);
}
```

### Example 3: Integration test — packDiagnostics presence (Suite 110 pattern)

```javascript
// Source: pattern from test/skeleton-generator.test.js Phase 109 block
test('Suite 110: handleApprove response includes packDiagnostics when packSelection succeeds', async () => {
  const dir = makeTmpDir();
  try {
    const runtimeMock = createRuntimeContextMock(dir);
    const resolvedPackSelection = {
      basePack: 'b2b', overlayPack: 'travel',
      overrideReason: null, resolvedAt: new Date().toISOString(),
    };
    const resolvedDiagnostics = {
      basePack: 'b2b', overlayPack: 'travel', overrideReason: null,
      completeness: {
        Paid_Media: 'full', Content_SEO: 'full',
        Lifecycle_Email: 'full', Social: 'full', Landing_Pages: 'full',
      },
      fallbackApplied: false,
    };

    await withMockedModule(runtimeCtxPath, runtimeMock, async () => {
      await withMockedModule(vaultWriterPath, {
        writeApprovedDrafts: () => ({
          written: ['MarkOS-Vault/Strategy/company.md'],
          items: [{ source_key: 'company_profile', outcome: 'imported',
                    destination_path: 'MarkOS-Vault/Strategy/company.md',
                    warnings: [], errors: [] }],
          errors: [],
        }),
      }, async () => {
        await withMockedModule(runReportPath, {
          writeRunReport: () => ({ report_note_path: 'MarkOS-Vault/Memory/Migration Reports/mock.md' }),
        }, async () => {
          await withMockedModule(vectorStorePath, {
            configure: () => {},
            storeDraft: async () => ({ ok: true }),
          }, async () => {
            await withMockedModule(telemetryPath, {
              captureExecutionCheckpoint: () => {},
              captureRolloutEndpointEvent: () => {},
            }, async () => {
              await withMockedModule(packLoaderPath, {
                resolvePackSelection: () => resolvedPackSelection,
                getPackDiagnostics: () => resolvedDiagnostics,
              }, async () => {
                await withMockedModule(skeletonGenPath, {
                  generateSkeletons: async () => ([
                    { discipline: 'Paid_Media', files: ['.markos-local/MSP/Paid_Media/SKELETONS/_SKELETON-b2b.md'], error: null },
                  ]),
                }, async () => {
                  const handlers = loadFreshModule(handlersPath);
                  const req = createJsonRequest({
                    slug: 'acme',
                    approvedDrafts: { company_profile: 'ok' },
                  }, '/approve');
                  const res = createMockResponse();

                  await handlers.handleApprove(req, res);

                  assert.equal(res.statusCode, 200);
                  const payload = JSON.parse(res.body);
                  assert.ok('packDiagnostics' in payload, 'response must have packDiagnostics key');
                  assert.equal(payload.packDiagnostics.basePack, 'b2b');
                  assert.equal(payload.packDiagnostics.fallbackApplied, false);
                  assert.ok('completeness' in payload.packDiagnostics);
                });
              });
            });
          });
        });
      });
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

### Example 4: Integration test — fallbackApplied=true for stub pack

```javascript
test('Suite 110: fallbackApplied=true when basePack is agency (stub completeness)', async () => {
  // Same withMockedModule nesting as above...
  const stubDiagnostics = {
    basePack: 'agency', overlayPack: null, overrideReason: null,
    completeness: {
      Paid_Media: 'stub', Content_SEO: 'stub',
      Lifecycle_Email: 'stub', Social: 'stub', Landing_Pages: 'stub',
    },
    fallbackApplied: true,
  };
  await withMockedModule(packLoaderPath, {
    resolvePackSelection: () => ({ basePack: 'agency', overlayPack: null, overrideReason: null, resolvedAt: new Date().toISOString() }),
    getPackDiagnostics: () => stubDiagnostics,
  }, async () => {
    // ... rest of mock chain and assertions
    assert.equal(payload.packDiagnostics.fallbackApplied, true);
    assert.equal(payload.packDiagnostics.completeness.Paid_Media, 'stub');
  });
});
```

### Example 5: Integration test — operator_override preserved in response

```javascript
test('Suite 110: operator_override in request body is preserved in response packSelection', async () => {
  await withMockedModule(packLoaderPath, {
    resolvePackSelection: () => { throw new Error('should not be called when override provided'); },
    getPackDiagnostics: (_ps) => ({ basePack: 'saas', overlayPack: 'it', overrideReason: 'operator_override',
                                    completeness: { Paid_Media: 'full', Content_SEO: 'full',
                                                    Lifecycle_Email: 'full', Social: 'full', Landing_Pages: 'full' },
                                    fallbackApplied: false }),
  }, async () => {
    const req = createJsonRequest({
      slug: 'acme',
      approvedDrafts: { company_profile: 'ok' },
      packOverride: { basePack: 'saas', overlayPack: 'it' }, // Operator choice
    }, '/approve');
    // ...
    assert.equal(payload.packSelection.overrideReason, 'operator_override');
    assert.equal(payload.packSelection.basePack, 'saas');
  });
});
```

### Example 6: Pack manifest graduation format (b2b.pack.json after graduation)

```json
{
  "slug": "b2b",
  "version": "1.2.0",
  "completeness": {
    "Paid_Media": "full",
    "Content_SEO": "full",
    "Lifecycle_Email": "full",
    "Social": "full",
    "Landing_Pages": "full"
  },
  "changelog": [
    { "version": "1.2.0", "date": "2026-04-15",
      "summary": "Phase 110: graduated completeness partial→full after integration tests passed" },
    { "version": "1.1.0", "date": "2026-04-15", "summary": "..." },
    { "version": "1.0.0", "date": "2026-04-14", "summary": "..." }
  ]
}
```

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all changes are code and JSON edits within the existing Node.js codebase).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) |
| Config file | None — run directly |
| Quick run command | `node --test test/pack-diagnostics.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GOV-01 | Stub pack → fallbackApplied=true in response | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |
| GOV-01 | Missing overlay file → base-only, fallbackApplied computed | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |
| GOV-01 | null basePack → fallbackApplied=true | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |
| GOV-02 | operator_override preserved in response | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |
| GOV-02 | packDiagnostics present alongside packSelection | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |
| INIT-02 | All 9 authored combos resolve with fallbackApplied=false | integration | `node --test test/pack-diagnostics.test.js` | ❌ Wave 0 |

### Regression Tests (Must Stay Green)
| File | Suite | Command | Status after Phase 110 |
|------|-------|---------|----------------------|
| `test/pack-loader.test.js` | 106, 108 | `node --test test/pack-loader.test.js` | Stays green — no `"partial"` assertions exist |
| `test/skeleton-generator.test.js` | All | `node --test test/skeleton-generator.test.js` | Stays green — `packDiagnostics` is additive to response |
| `test/example-resolver.test.js` | 6 | `node --test test/example-resolver.test.js` | Unaffected |

### Sampling Rate
- **Per task commit:** `node --test test/pack-diagnostics.test.js`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/pack-diagnostics.test.js` — Suite 110, all GOV-01, GOV-02, INIT-02 requirements

*(Existing test infrastructure: `test/setup.js` helpers are sufficient, no new fixtures needed)*

---

## Open Questions

1. **Completeness grid merge strategy for base+overlay**
   - What we know: After graduation, all 9 authored packs are fully `"full"`. Pre-graduation they're all `"partial"`.
   - What's unclear: If base is `"full"` for a discipline but overlay is `"partial"`, should the grid show `"full"` (base is sufficient) or `"partial"` (overlay has gaps)?
   - Recommendation: Show the overlay's lower rating — it's more informative for the operator. Implemented as `min(base, overlay)` per discipline in `getPackDiagnostics()`. Post-graduation this rarely matters since both will be "full", but stub packs still need it.

2. **GET /api/packs/resolution — query param for slug?**
   - What we know: The seed.json is resolved per the current project slug, already at a known `SEED_PATH`.
   - Recommendation: No query param needed. The handler simply reads from the existing `SEED_PATH` (same as `handleApprove` does). This avoids any slug injection risk.

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `lib/markos/packs/pack-loader.cjs` (full file) - registry loading, adaptToLegacyShape, resolvePackSelection, INDUSTRY_ALIAS_MAP
- Direct code read: `onboarding/backend/handlers.cjs` lines 2380–2530 - handleApprove packSelection block
- Direct code read: `onboarding/index.html` + `onboarding/onboarding.js` - step UI structure
- Direct code read: `test/skeleton-generator.test.js` - withMockedModule integration test pattern
- Direct code read: `test/pack-loader.test.js` lines 1–250 - Suite 106/108 tests (confirmed no "partial" assertions)
- Direct code read: `lib/markos/packs/b2b.pack.json`, `saas.pack.json`, `travel.industry.json`, `it.industry.json` - manifest structure
- Direct code read: `lib/markos/packs/pack-schema.json` - completeness enum values
- Direct code read: `test/setup.js` - createJsonRequest, withMockedModule implementation
- File scan: `onboarding/templates/SKELETONS/b2b/`, `/saas/`, `/industries/travel/`, etc. - all 5 PROMPTS.md confirmed present

### Secondary (MEDIUM confidence)
- `.planning/phases/110-diagnostics-fallbacks-and-closeout-hardening/110-CONTEXT.md` - locked decisions
- `.planning/REQUIREMENTS.md` - GOV-01, GOV-02 requirement text
- `.planning/STATE.md` - milestone state and Phase 109 completion

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase uses node:test throughout, no new deps needed
- Architecture patterns: HIGH — verified from actual file content, all code examples reflect real structures
- Pitfalls: HIGH — derived from actual code inspection (e.g., singleton cache, unconditional overwrite in handleApprove)
- Completeness graduation: HIGH — skeleton files already on disk, no test asserts "partial"
- UI pattern: HIGH — confirmed vanilla HTML/JS, no React framework

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable codebase; no external dependencies)
