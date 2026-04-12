# Phase 81: Governance Publish and Rollback Operational Surface - Research

**Researched:** 2026-04-12
**Domain:** Vercel serverless route authoring over in-memory governance modules (Node.js / CJS)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Separate route files per operation — `api/governance/brand-publish.js` and
  `api/governance/brand-rollback.js`. Follows the established `api/governance/evidence.js` pattern.
- **D-02:** Both publish and rollback routes require `manage_billing OR manage_users` permission via
  `canPerformAction` — same authorization check used in `api/governance/evidence.js`.
- **D-03:** A third route file `api/governance/brand-status.js` (GET) surfaces the current active
  bundle and full traceability log for a tenant. Wraps `getActiveBundle()` and `getTraceabilityLog()`
  from `active-pointer.cjs`. Same auth requirement as publish/rollback (D-02).
- **D-04:** API responses pass through the full structured denial payload from `active-pointer.cjs`
  verbatim — `reason_code` + `diagnostics` + `gates` (where present). No sanitization or stripping.
- **D-05:** All operations remain tenant-scoped and fail-closed (Phase 78 D-06 inherited).
- **D-06:** Historical bundle content must not be mutated (Phase 78 D-09 inherited).
- **D-07:** Governance errors do not break the core submit flow (Phase 78 D-07 additive pattern
  inherited — routes are additive surfaces, not required for submit success).

### Claude's Discretion
- Exact request body field names for `bundle_id`, `actor_id`, `reason` in POST payloads.
- HTTP status codes for specific denial cases (422 vs 409 for gate failure vs not-found).
- Whether brand-status returns the full bundle object or a summary view.

### Deferred Ideas (OUT OF SCOPE)
- New RBAC action `manage_brand` for finer-grained brand governance authorization.
- UI surface for publish/rollback (operator dashboard integration).
- Automated deployment pipeline triggered by publish.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-GOV-01 | Branding artifacts are versioned as a single lineage bundle with publish, rollback, and drift-detection evidence. Operators can promote or roll back brand versions safely with full traceability. | Route handlers expose publishBundle/rollbackBundle with traceability logged per call. brand-status surfaces current pointer + full log. |
</phase_requirements>

---

## Summary

Phase 81 adds three thin Vercel serverless route files that delegate directly to already-implemented
governance functions in `active-pointer.cjs`. The core insight from codebase analysis is that
**no new business logic is needed** — the routes are  strictly auth check → body parse → delegate →
serialize response. Two patterns from `api/governance/` already define everything that needs to be
replicated.

The single most important constraint to acknowledge is the **serverless in-memory state** of
`_activePointers` and `_traceabilityLog`. These are module-level `Map`/`Array` — ephemeral per
process instance. This is not a bug for Phase 81 to fix; it is a known architectural property that
the routes inherit and must document in comments.

Tests for these routes do not need to mock `requireHostedSupabaseAuth` for success paths — the
function auto-returns local defaults when the request is not running in a hosted environment
(no `VERCEL`/`NETLIFY`/`AWS_LAMBDA_FUNCTION_NAME` env vars). Auth mock is only needed for
denial-path tests.

**Primary recommendation:** Copy the `evidence.js` + `vendor-inventory.js` route scaffold exactly.
Method guard for POST routes, `req.body || {}` body parse, `auth.tenant_id` for tenant scope,
pass-through denial payload verbatim per D-04.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node.js built-in | Test runner for all phase tests | Established project-wide (package.json `"test": "node --test test/**/*.test.js"`) |
| `node:assert/strict` | Node.js built-in | Assertions in tests | Established alongside `node:test` in all phase test files |
| `canPerformAction` (iam-v32.js) | local | RBAC action check | Canonical IAM module, already used by evidence.js |
| `requireHostedSupabaseAuth` (runtime-context.cjs) | local | Auth extraction and validation | Canonical auth helper, already used by evidence.js and vendor-inventory.js |
| `publishBundle`, `rollbackBundle`, `getActiveBundle`, `getTraceabilityLog` (active-pointer.cjs) | local | Governance operations | Phase 78 implementation — the functions to expose |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `withMockedModule` (test/setup.js) | local | `require.cache` patch for isolated mocks | In every route test that needs to mock auth or governance dependencies |
| `_resetActivePointerForTest` (active-pointer.cjs) | local | Clear in-memory Map + log between tests | When testing via real active-pointer.cjs rather than mocking it |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `writeJson` | Import from shared module | No shared module exists — both evidence.js and vendor-inventory.js define it inline. Keep inline per established pattern. |
| Real `active-pointer.cjs` in tests | Mock `publishBundle` | Real module is pure CJS with no I/O — safe to use directly. Reset with `_resetActivePointerForTest()`. Prefer real over mock for integration layer. |

**Installation:** Nothing new. All dependencies are local modules already in the repo.

---

## Architecture Patterns

### Recommended Project Structure
```
api/governance/
├── evidence.js          # Existing (canonical pattern source)
├── vendor-inventory.js  # Existing (second canonical reference)
├── brand-publish.js     # Phase 81 — POST, wraps publishBundle()
├── brand-rollback.js    # Phase 81 — POST, wraps rollbackBundle()
└── brand-status.js      # Phase 81 — GET, wraps getActiveBundle() + getTraceabilityLog()

test/phase-81/
├── brand-publish-route.test.js
├── brand-rollback-route.test.js
└── brand-status-route.test.js
```

### Pattern 1: POST Governance Mutation Route (brand-publish.js / brand-rollback.js)

**What:** Method-guarded POST handler. Auth → RBAC → body parse → call governance function → serialize.

**When to use:** Any route that calls a write operation on `active-pointer.cjs`.

```js
// api/governance/brand-publish.js
// Source: mirror of api/governance/evidence.js + api/governance/vendor-inventory.js
'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { publishBundle } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

// NOTE: _activePointers in active-pointer.cjs is a module-level in-memory Map.
// In Vercel serverless, each function instance has its own isolated process memory.
// Publish operations are not durable across cold starts. This is an inherited
// architectural property from Phase 78 — not fixed in Phase 81.

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function isGovernanceAuthorized(role) {
  return canPerformAction(role, 'manage_billing') || canPerformAction(role, 'manage_users');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED', message: 'POST required' });
  }

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'approve_write' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!isGovernanceAuthorized(iamRole)) {
    return writeJson(res, 403, {
      success: false,
      error: 'GOVERNANCE_ADMIN_REQUIRED',
      message: 'billing or user administration permission required',
    });
  }

  // CRITICAL: tenant_id MUST come from auth context, never from req.body.
  // Accepting a caller-supplied tenant_id enables cross-tenant attacks.
  const tenantId = auth.tenant_id || auth.principal?.tenant_id || 'tenant-alpha-001';
  const actorId = auth.principal?.id || 'unknown';

  const body = req.body || {};
  const bundleId = body.bundle_id;
  if (!bundleId) {
    return writeJson(res, 400, { success: false, error: 'MISSING_BUNDLE_ID', message: 'bundle_id is required' });
  }

  const result = publishBundle(tenantId, bundleId, {
    actor_id: body.actor_id || actorId, // D-04: default to auth'd user identity
    reason: body.reason || 'operator publish',
  });

  if (result.denied) {
    // D-04: pass through full denial payload verbatim — no sanitization
    return writeJson(res, 422, {
      success: false,
      denied: true,
      reason_code: result.reason_code,
      diagnostics: result.diagnostics,
      ...(result.gates ? { gates: result.gates } : {}),
    });
  }

  return writeJson(res, 200, {
    success: true,
    published: true,
    bundle_id: result.bundle_id,
    traceability_entry: result.traceability_entry,
  });
};
```

`brand-rollback.js` follows the identical skeleton — swap `publishBundle` for `rollbackBundle`,
swap `published: true` for `rolled_back: true` in the response.

### Pattern 2: GET Read-Only Governance Surface (brand-status.js)

**What:** No method guard needed beyond not accepting POST. Auth → RBAC → call read functions → serialize.

**When to use:** Any route that reads active pointer + traceability log without side effects.

```js
// api/governance/brand-status.js
'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { getActiveBundle, getTraceabilityLog } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function isGovernanceAuthorized(role) {
  return canPerformAction(role, 'manage_billing') || canPerformAction(role, 'manage_users');
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!isGovernanceAuthorized(iamRole)) {
    return writeJson(res, 403, {
      success: false,
      error: 'GOVERNANCE_ADMIN_REQUIRED',
      message: 'billing or user administration permission required',
    });
  }

  const tenantId = auth.tenant_id || auth.principal?.tenant_id || 'tenant-alpha-001';

  return writeJson(res, 200, {
    success: true,
    tenant_id: tenantId,
    active_bundle: getActiveBundle(tenantId),       // returns full merged bundle or null
    traceability_log: getTraceabilityLog(),          // returns a .slice() copy — safe
  });
};
```

### Pattern 3: Route Integration Test Structure (node:test / CJS)

**What:** Test file structure for auth-gated route handlers in node:test CJS format.

**Key insight:** In test environments (no VERCEL/NETLIFY/AWS_LAMBDA_FUNCTION_NAME set), 
`requireHostedSupabaseAuth` automatically returns local defaults: `{ ok: true, iamRole: 'owner',
tenant_id: 'tenant-alpha-001', principal: { id: 'local-operator', ... } }`.
`owner` passes `isGovernanceAuthorized()` because `canPerformAction('owner', 'manage_billing')` 
returns `true` per `ACTION_POLICY`. **No auth mock is needed for success-path tests.**

```js
// test/phase-81/brand-publish-route.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { withMockedModule } = require('../setup.js');
const { _resetActivePointerForTest } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');
const { createBundle, setVerificationEvidence } = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');

const ROUTE_PATH = path.resolve(__dirname, '../../api/governance/brand-publish.js');
const RUNTIME_CTX_PATH = require.resolve('../../onboarding/backend/runtime-context.cjs');

function loadFreshRoute() {
  delete require.cache[require.resolve(ROUTE_PATH)];
  return require(ROUTE_PATH);
}

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(code, headers) { this.statusCode = code; this.headers = headers; },
    end(chunk = '') { this.body += chunk || ''; },
    parsed() { return JSON.parse(this.body); },
  };
}

function makeGoodLineagePayload() {
  return {
    strategy_artifact_id: 'strat-001',
    identity_artifact_id: 'ident-001',
    design_system_artifact_id: 'ds-001',
    starter_artifact_id: 'starter-001',
    lineage_fingerprints: {
      strategy: 'fp-strat-abc',
      identity: 'fp-ident-abc',
      design_system: 'fp-ds-abc',
      starter: 'fp-starter-abc',
    },
  };
}

// ── Success path ──────────────────────────────────────────────────────────────

test('POST /api/governance/brand-publish: 200 success on valid bundle + gates pass', async () => {
  _resetActivePointerForTest();
  const tenantId = 'tenant-pub-route-001';
  const bundle = createBundle(tenantId, makeGoodLineagePayload());
  assert.ok(bundle && !bundle.denied);

  const handler = loadFreshRoute();
  const req = { method: 'POST', url: '/', headers: {}, body: { bundle_id: bundle.bundle_id } };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const payload = res.parsed();
  assert.equal(payload.success, true);
  assert.equal(payload.published, true);
  assert.equal(payload.bundle_id, bundle.bundle_id);
  assert.ok(payload.traceability_entry?.timestamp);
});

// ── Denial pass-through (D-04) ────────────────────────────────────────────────

test('POST /api/governance/brand-publish: 422 + full diagnostics on gate failure', async () => {
  _resetActivePointerForTest();
  const tenantId = 'tenant-pub-route-fail-001';
  const gateFailPayload = {
    ...makeGoodLineagePayload(),
    lineage_fingerprints: {}, // missing all lanes → contract integrity gate fails
  };
  const bundle = createBundle(tenantId, gateFailPayload);
  assert.ok(bundle && !bundle.denied);

  const handler = loadFreshRoute();
  const req = { method: 'POST', url: '/', headers: {}, body: { bundle_id: bundle.bundle_id } };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 422);
  const payload = res.parsed();
  assert.equal(payload.success, false);
  assert.equal(payload.denied, true);
  assert.ok(payload.reason_code);
  assert.equal(payload.diagnostics.machine_readable, true);
  assert.ok(payload.gates, 'gates object must be present for closure gate failures per D-04');
});

// ── RBAC denial ───────────────────────────────────────────────────────────────

test('POST /api/governance/brand-publish: 403 when role lacks manage_billing/manage_users', async () => {
  const readonlyAuth = {
    ok: true,
    status: 200,
    tenant_id: 'tenant-rbac-test',
    role: 'readonly',
    iamRole: 'readonly',
    principal: { id: 'read-user', tenant_id: 'tenant-rbac-test', tenant_role: 'readonly', type: 'runtime_local', scopes: [] },
    operation: 'approve_write',
  };

  await withMockedModule(RUNTIME_CTX_PATH, {
    createRuntimeContext: () => ({ mode: 'hosted', canWriteLocalFiles: false, config: {} }),
    requireHostedSupabaseAuth: () => readonlyAuth,
  }, async () => {
    const handler = loadFreshRoute();
    const req = { method: 'POST', url: '/', headers: {}, body: { bundle_id: 'any' } };
    const res = createMockResponse();
    await handler(req, res);

    assert.equal(res.statusCode, 403);
    const payload = res.parsed();
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'GOVERNANCE_ADMIN_REQUIRED');
  });
});

// ── Auth denial ───────────────────────────────────────────────────────────────

test('POST /api/governance/brand-publish: 401 when bearer token missing', async () => {
  await withMockedModule(RUNTIME_CTX_PATH, {
    createRuntimeContext: () => ({ mode: 'hosted', canWriteLocalFiles: false, config: {} }),
    requireHostedSupabaseAuth: () => ({
      ok: false, status: 401, error: 'AUTH_REQUIRED',
      message: 'Hosted MarkOSDB operations require a Supabase Bearer token.',
    }),
  }, async () => {
    const handler = loadFreshRoute();
    const req = { method: 'POST', url: '/', headers: {}, body: {} };
    const res = createMockResponse();
    await handler(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.parsed().error, 'AUTH_REQUIRED');
  });
});

// ── Method guard ──────────────────────────────────────────────────────────────

test('GET /api/governance/brand-publish: 405 method not allowed', async () => {
  const handler = loadFreshRoute();
  const req = { method: 'GET', url: '/', headers: {}, body: {} };
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});
```

### Anti-Patterns to Avoid

- **`const tenantId = req.body.tenant_id`** — NEVER accept tenant_id from the request body. Always read from `auth.tenant_id` or `auth.principal?.tenant_id`. Cross-tenant data access is possible otherwise (D-05).
- **Returning 500 for governance denial** — Governance denials (`result.denied === true`) are valid business logic outcomes. Return 422, not 500.
- **Not calling `_resetActivePointerForTest()`** — Tests that use the real active-pointer.cjs share its `_activePointers` Map across the test file. Always reset at test start or use unique tenant IDs per test.
- **`module.exports.handler = ...` instead of `module.exports = ...`** — Vercel expects the default export to be the handler function directly.
- **Calling `loadFreshRoute()` without clearing `require.cache`** — Without cache-busting, `withMockedModule` patches applied after the route was first loaded won't be seen.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth token extraction and validation | Custom JWT parse logic | `requireHostedSupabaseAuth` | Already handles hosted/local mode branching, JWT decode, audience check, tenant resolution |
| RBAC check | Custom role comparison | `canPerformAction(role, 'manage_billing')` | Fail-closed semantics, unknown role → false |
| Governance policy (gates, tenant scope) | Inline gate logic | `publishBundle` / `rollbackBundle` | Closure gates, `BRAND_GOV_TENANT_MISMATCH` check, traceability log append all live in active-pointer.cjs |
| Diagnostic normalization | Custom error shaping | `normalizeDiagnostic` (governance-diagnostics.cjs) | Canonical `machine_readable: true` format per D-08/D-10 |
| `require.cache` module isolation in tests | sinon / jest.mock | `withMockedModule` (test/setup.js) | Already implemented to be compatible with `node:test` CJS pattern |
| writeJson helper | `res.json()` or external package | Inline per route (same as evidence.js) | No shared module exists; inline per established project pattern |

**Key insight:** The routes are structural, not logical. All complex behavior (gate evaluation, tenant
isolation, traceability) is owned by `active-pointer.cjs`. Anything written inline in the route
handler is duplicating logic that already exists and is already tested in test/phase-78/.

---

## Serverless In-Memory Constraint

This is the most important architectural fact to document in route comments.

**Constraint:** `active-pointer.cjs` stores the active pointer in a module-level `Map`:
```js
const _activePointers = new Map();   // tenant_id → bundle_id
const _traceabilityLog = [];         // append-only entries
```

**In Vercel serverless:** each function instance runs in its own isolated Node.js process.
- Cold start → fresh empty `_activePointers` and `_traceabilityLog`
- Warm invocation (same instance) → state persists across calls
- Two concurrent invocations on different instances → independent state copies

**What this means for Phase 81:**
- Routes will correctly call `publishBundle()` / `rollbackBundle()` and update the in-process pointer
- `getActiveBundle()` will return the pointer set during the same process's lifetime
- State does not survive cold resets and is not shared across instances

**What NOT to do in Phase 81:**
- Do not add a persistence layer (out of scope)
- Do not return an error from the route because of this constraint
- Do not add a TODO comment asking to "fix" this — it is Phase 78's architectural decision

**Do document it:** Each route file should include the NOTE comment shown in the code pattern above.
Future phases can introduce a shared data store (e.g., Supabase table for active pointers) without
changing the route signatures.

---

## Response Schemas

### POST `/api/governance/brand-publish` — Success (200)
```json
{
  "success": true,
  "published": true,
  "bundle_id": "<string>",
  "traceability_entry": {
    "action": "publish",
    "tenant_id": "<string>",
    "bundle_id": "<string>",
    "actor_id": "<string>",
    "reason": "<string>",
    "timestamp": "<ISO8601>"
  }
}
```

### POST `/api/governance/brand-publish` — Denial (422)
```json
{
  "success": false,
  "denied": true,
  "reason_code": "BRAND_GOV_CLOSURE_GATE_FAIL",
  "diagnostics": { "code": "BRAND_GOV_CLOSURE_GATE_FAIL", "detail": "...", "machine_readable": true },
  "gates": {
    "determinism": { "passed": false, "reason_code": "...", "detail": "..." },
    "tenant_isolation": { "passed": true, "reason_code": null, "detail": null },
    "contract_integrity": { "passed": true, "reason_code": null, "detail": null }
  }
}
```
`gates` is present only when `reason_code` is `BRAND_GOV_CLOSURE_GATE_FAIL`. For
`BRAND_GOV_BUNDLE_NOT_VERIFIED` denials (not found, no evidence hash), `gates` is absent.

### POST `/api/governance/brand-rollback` — Success (200)
```json
{
  "success": true,
  "rolled_back": true,
  "bundle_id": "<string>",
  "traceability_entry": {
    "action": "rollback",
    "tenant_id": "<string>",
    "bundle_id": "<string>",
    "actor_id": "<string>",
    "reason": "<string>",
    "timestamp": "<ISO8601>"
  }
}
```

### POST `/api/governance/brand-rollback` — Denial (422)
Same shape as publish denial. `reason_code` = `BRAND_GOV_BUNDLE_NOT_VERIFIED` (no hash) or
`BRAND_GOV_TENANT_MISMATCH` (cross-tenant). No `gates` field for rollback denials.

### GET `/api/governance/brand-status` — Success (200)
```json
{
  "success": true,
  "tenant_id": "<string>",
  "active_bundle": { /* full merged bundle object from bundle-registry, or null */ },
  "traceability_log": [
    {
      "action": "publish",
      "tenant_id": "<string>",
      "bundle_id": "<string>",
      "actor_id": "<string>",
      "reason": "<string>",
      "timestamp": "<ISO8601>"
    }
  ]
}
```
`active_bundle` is `null` when no bundle has been published for the tenant in this process instance.
`traceability_log` is a copy of the full log (all tenants) — `getTraceabilityLog()` returns a
`.slice()` so the route does not mutate the source array.

### Shared Error Shapes
| Status | Scenario | Shape |
|--------|----------|-------|
| 400 | `bundle_id` missing from POST body | `{ success: false, error: 'MISSING_BUNDLE_ID', message: '...' }` |
| 401 | Bearer token absent or malformed | `{ success: false, error: 'AUTH_REQUIRED'\|'INVALID_AUTH_TOKEN', message: '...' }` |
| 403 | Role lacks manage_billing/manage_users | `{ success: false, error: 'GOVERNANCE_ADMIN_REQUIRED', message: '...' }` |
| 405 | Wrong HTTP method (GET on publish/rollback) | `{ success: false, error: 'METHOD_NOT_ALLOWED', message: '...' }` |
| 422 | Governance denial (gate fail, bundle not found) | `{ success: false, denied: true, reason_code, diagnostics, gates? }` |

---

## Common Pitfalls

### Pitfall 1: Tenant ID from Request Body
**What goes wrong:** Route reads `req.body.tenant_id` to scope governance operations.
**Why it happens:** Looks natural — the caller specifies which tenant. But it bypasses the auth
contract: `requireHostedSupabaseAuth` resolves the tenant from the JWT claim, not the body.
**How to avoid:** Always use `auth.tenant_id || auth.principal?.tenant_id`. Never accept tenant scope
from the request body.
**Warning signs:** Routes that pass `req.body.tenant_id` to governance functions.

### Pitfall 2: Returning 500 for Governance Denials
**What goes wrong:** A catch block or missing `if (result.denied)` check causes denial results to
surface as 500 Internal Server Error.
**Why it happens:** Developers treat denial as an error case rather than a normal return value.
**How to avoid:** Check `result.denied === true` before `result.published === true`. Denial is a
first-class response shape, not an exception.
**Warning signs:** No explicit `if (result.denied)` guard before the success response.

### Pitfall 3: Stale Route Module in Tests
**What goes wrong:** `withMockedModule` patches runtime-context.cjs, but the route handler loaded
earlier in the test file already has the original `requireHostedSupabaseAuth` bound via
`require.cache`. The mock has no effect.
**Why it happens:** CJS `require` is cached. If the route was `require()`-d before the mock was
installed, it holds a reference to the real module.
**How to avoid:** Use `loadFreshRoute()` (shown in test pattern above) inside every
`withMockedModule` callback — call `delete require.cache[require.resolve(ROUTE_PATH)]` before
re-requiring the route.
**Warning signs:** Auth denial tests pass locally but show inconsistent results; mock assertions
never fire.

### Pitfall 4: Omitting Method Guard on POST Routes
**What goes wrong:** A GET request to `/api/governance/brand-publish` is accepted (405 not returned),
causing the handler to read `req.body` which is `undefined` on GET, then crash.
**Why it happens:** evidence.js does not have a method guard (it accepts GET), so developers skip it.
**How to avoid:** Both brand-publish.js and brand-rollback.js must check `req.method !== 'POST'`
as the first line of the handler, before auth.
**Warning signs:** No `if (req.method !== 'POST')` at the top of POST route handlers.

### Pitfall 5: actor_id Undefined in Traceability Log
**What goes wrong:** `publishBundle()` / `rollbackBundle()` are called with `actor_id: undefined`
when `req.body.actor_id` is absent and the fallback is not set.
**Why it happens:** `body.actor_id || actorId` returns `undefined` if `actorId` itself is `undefined`.
**How to avoid:** Chain the default: `body.actor_id || auth.principal?.id || 'unknown'`. The string
`'unknown'` is a safe sentinel — it makes the traceability entry valid while signaling the actor
was not explicitly identified.
**Warning signs:** `traceability_entry.actor_id === undefined` in 200 responses.

### Pitfall 6: NOT gate filtering in brand-status traceability log
**What goes wrong:** `getTraceabilityLog()` returns all entries from all tenants
(`_traceabilityLog` is a global array). A caller for tenant A sees tenant B's entries.
**Why it happens:** The function signature returns the full log — it does not accept a `tenant_id`
filter. This is the current Phase 78 implementation.
**How to avoid:** Filter the returned log in brand-status.js:
`traceability_log: getTraceabilityLog().filter(e => e.tenant_id === tenantId)`
**Warning signs:** brand-status response shows entries from tenants other than the authenticated one.

---

## Code Examples

### Role Resolution from Auth Context (verbatim from evidence.js)
```js
// Source: api/governance/evidence.js L22
const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
```
This triple-fallback handles all auth response shapes: hosted mode (iamRole), local mode (role),
and the principal sub-object. Always use this exact pattern.

### Body Parse Pattern (Vercel serverless)
```js
// Source: api/crm/companies.js, api/tenant-plugin-settings.js, api/webhooks/twilio-events.js
const body = req.body || {};
```
Vercel serverless functions auto-parse JSON request bodies. `req.body` is already an object.
Use `|| {}` to safely destructure even on empty POST bodies.

### withMockedModule for require.cache patching
```js
// Source: test/setup.js — already exports this helper
await withMockedModule(require.resolve('../../onboarding/backend/runtime-context.cjs'), {
  createRuntimeContext: () => ({ mode: 'hosted', canWriteLocalFiles: false, config: {} }),
  requireHostedSupabaseAuth: () => ({ ok: false, status: 401, error: 'AUTH_REQUIRED', message: '...' }),
}, async () => {
  delete require.cache[require.resolve(ROUTE_PATH)];
  const handler = require(ROUTE_PATH);
  // ... test calls
});
```

### getTraceabilityLog Scoping Fix
```js
// brand-status.js — filter log to authenticated tenant per D-05
const traceabilityLog = getTraceabilityLog().filter(e => e.tenant_id === tenantId);
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (Node.js built-in) |
| Config file | None — invoked directly |
| Quick run command | `node --test test/phase-81/*.test.js` |
| Full suite command | `node --test test/**/*.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-GOV-01 | brand-publish returns 200 + traceability_entry on gate pass | integration | `node --test test/phase-81/brand-publish-route.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | brand-publish returns 422 + full diagnostics + gates on gate failure | integration | `node --test test/phase-81/brand-publish-route.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | brand-rollback returns 200 + traceability_entry on verified bundle | integration | `node --test test/phase-81/brand-rollback-route.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | brand-rollback returns 422 + BRAND_GOV_BUNDLE_NOT_VERIFIED when no hash | integration | `node --test test/phase-81/brand-rollback-route.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | brand-status returns active_bundle + filtered traceability_log | integration | `node --test test/phase-81/brand-status-route.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | All 3 routes return 403 for readonly role | integration | `node --test test/phase-81/*.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | All 3 routes return 401 when auth fails | integration | `node --test test/phase-81/*.test.js` | ❌ Wave 0 |
| BRAND-GOV-01 | POST routes return 405 on GET | unit | `node --test test/phase-81/*.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-81/*.test.js`
- **Per wave merge:** `node --test test/**/*.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/phase-81/brand-publish-route.test.js` — success, gate-denial, RBAC-denial, auth-denial, method guard
- [ ] `test/phase-81/brand-rollback-route.test.js` — success, bundle-not-verified, RBAC-denial, auth-denial, method guard
- [ ] `test/phase-81/brand-status-route.test.js` — success (null active_bundle), success (with active_bundle), RBAC-denial, auth-denial, traceability_log tenant filter

---

## Environment Availability

Step 2.6: SKIPPED — Phase 81 is code/config-only. No external tools, databases, or CLI utilities beyond the existing project's Node.js runtime and local CJS modules. All dependencies (active-pointer.cjs, iam-v32.js, runtime-context.cjs) are local modules already present.

---

## Open Questions

1. **`getTraceabilityLog()` scope — tenant-filtered or full?**
   - What we know: `getTraceabilityLog()` returns all entries from all tenants. Current Phase 78 design does not include a tenant filter parameter.
   - What's unclear: Whether returning the cross-tenant log from brand-status is intentional (audit surface sees everything) or should be tenant-scoped.
   - Recommendation: **Filter by `tenantId` in brand-status.js** — this is the fail-closed choice per D-05. A future phase can explicitly expand scope if cross-tenant audit access is needed.

2. **`operation` value for approve_write in MARKOSDB_ACCESS_MATRIX**
   - What we know: `approve_write` is in `MARKOSDB_ACCESS_MATRIX` with `auth_required_in_hosted_mode: true`. It also has `required: []` in `REQUIRED_SECRET_MATRIX` (no extra secrets needed).
   - What's unclear: Whether a governance-specific operation key (`governance_write`) is intended for future phases.
   - Recommendation: Use `approve_write` for brand-publish and brand-rollback (closest semantic match for a governed write operation), `status_read` for brand-status. Do not add a new operation key in Phase 81 (Phase 78 D-07 additive pattern).

---

## Sources

### Primary (HIGH confidence)
- `api/governance/evidence.js` — canonical auth + RBAC + writeJson route pattern, read directly
- `api/governance/vendor-inventory.js` — second canonical reference confirming the pattern
- `onboarding/backend/brand-governance/active-pointer.cjs` — function signatures, return shapes, in-memory state structure
- `onboarding/backend/brand-governance/governance-diagnostics.cjs` — DENY_CODES, normalizeDiagnostic shape
- `onboarding/backend/runtime-context.cjs` — `requireHostedSupabaseAuth` full implementation, local fallback behavior
- `lib/markos/rbac/iam-v32.js` — `canPerformAction`, ACTION_POLICY (`manage_billing: ['owner', 'billing-admin']`, `manage_users: ['owner', 'tenant-admin']`)
- `test/setup.js` — `withMockedModule`, `createJsonRequest` helpers
- `test/phase-78/publish-rollback.test.js` — established node:test / CJS test fixture pattern
- `test/phase-79/runtime-gate-recovery.test.js` — `loadFreshModule` + `createMockResponse` pattern
- `package.json` — test command: `node --test test/**/*.test.js`

### Secondary (MEDIUM confidence)
- `api/webhooks/twilio-events.js`, `api/crm/companies.js` — confirms `req.body || {}` pattern for POST body parsing in Vercel serverless functions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — directly verified from existing route files and test files in this codebase
- Architecture: HIGH — evidence.js and vendor-inventory.js are read; patterns are verified, not inferred
- Pitfalls: HIGH (Pitfalls 1-5) / MEDIUM (Pitfall 6 — traceability log scoping — inferred from implementation but not tested in Phase 78)
- Serverless in-memory constraint: HIGH — verified from active-pointer.cjs source; no assumption

**Research date:** 2026-04-12
**Valid until:** Stable — all findings are from local source code, not external ecosystem state
