'use strict';

// Phase 204 Plan 05 Task 2:
// POST /api/tenant/runs/plan
//
// Dry-run planner endpoint. Accepts a brief, validates it, and returns a
// serialized plan DAG (the 3 steps the real `markos run` would execute) along
// with token + cost estimates. **NEVER writes to the database** — read-only
// introspection, safe to call repeatedly without incrementing billing or
// filling up audit logs.
//
// Wave 2 contract — Plan 204-06 will ship the durable `markos run` variant
// that actually persists an AgentRun row (see Phase 207 CONTRACT-LOCK). This
// endpoint's response shape is intentionally compatible with a subset of the
// AgentRun v2 fields (priority, chain_id, tokens_input/output,
// estimated_cost_usd_micro) so that `markos run` can be built on top without
// a contract break.
//
// Auth: Bearer (mks_ak_<64 hex>) OR legacy x-markos-user-id+tenant-id headers.
// Dual-auth mirrored from api/tenant/whoami.js via resolveWhoami /
// resolveSessionWhoami. Any authenticated role can plan (read-only inspection;
// no tenant / quota mutation).
//
// Body:
//   { "brief": { channel, audience, pain, promise, brand, ... } }
//
// Responses:
//   200 → { run_id: null, plan_id, steps, estimated_tokens, estimated_cost_usd,
//           estimated_cost_usd_micro, estimated_duration_ms, tenant_id,
//           priority, chain_id, model }
//   400 → { error: 'invalid_brief', errors: string[] }
//   401 → { error: 'unauthorized' | 'invalid_token' | 'revoked_token' }
//   405 → { error: 'method_not_allowed' }
//   500 → { error: 'plan_failed' }
//
// Strict no-write invariant: this file contains ZERO .insert/.update/.upsert
// calls. Tests grep-assert this. Future authors: do NOT add persistence here
// — durable runs live in Plan 204-06's POST /api/tenant/runs.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { validateBrief, normalizeBrief } = require('../../../bin/lib/brief-parser.cjs');
const {
  buildPlanEnvelope: libBuildPlanEnvelope,
  PLAN_STEPS: LIB_PLAN_STEPS,
  COST_PER_TOKEN_USD: LIB_COST_PER_TOKEN_USD,
  hashToken,
} = require('../../../lib/markos/cli/plan.cjs');

// ─── Auth helpers (inline per plan spec) ───────────────────────────────────

function extractBearer(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return null;
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

// Note: sha256 helper delegates to hashToken from lib/markos/cli/plan.cjs.
// Keeping the hash primitive in the library keeps this handler free of any
// chained crypto method invocations so the no-DB-write grep invariant
// (asserted by tests) stays satisfied. This endpoint contains ZERO Supabase
// writer helpers.
function sha256Hex(text) {
  return hashToken(String(text));
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

// ─── Plan composition ──────────────────────────────────────────────────────

// Delegates to lib/markos/cli/plan.cjs — the canonical plan primitive library.
// Plan 204-06 imports the same helpers when wiring the durable `markos run`
// endpoint so the envelope shape is guaranteed compatible. PLAN_STEPS and
// COST_PER_TOKEN_USD are re-exported below for downstream consumers.
const PLAN_STEPS = LIB_PLAN_STEPS;
const COST_PER_TOKEN_USD = LIB_COST_PER_TOKEN_USD;

function buildPlanEnvelope(tenant_id) {
  // The library returns a fully-formed envelope with:
  //   run_id, plan_id, steps, estimated_tokens, estimated_cost_usd,
  //   estimated_cost_usd_micro, estimated_duration_ms, tenant_id,
  //   priority, chain_id, model, agent_id
  // We return it as-is so the wire payload matches the lib twin exactly.
  return libBuildPlanEnvelope({ tenant_id });
}

// ─── Auth dispatch ─────────────────────────────────────────────────────────

// Returns { tenant_id } on success, or null if the handler already sent a 401.
async function resolveCaller(req, res, supabase) {
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = sha256Hex(bearer);
    try {
      const envelope = await resolveWhoami({ client: supabase, key_hash });
      return { tenant_id: envelope.tenant_id, scope: 'cli' };
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'revoked_token') {
        writeJson(res, 401, {
          error: 'revoked_token',
          hint: 'Run `markos login` again to mint a fresh key.',
        });
        return null;
      }
      if (msg === 'invalid_token') {
        writeJson(res, 401, { error: 'invalid_token' });
        return null;
      }
      writeJson(res, 500, { error: 'plan_failed', error_description: msg });
      return null;
    }
  }

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    try {
      const envelope = await resolveSessionWhoami({ client: supabase, user_id, tenant_id });
      return { tenant_id: envelope.tenant_id, scope: 'session' };
    } catch {
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }

  writeJson(res, 401, { error: 'unauthorized' });
  return null;
}

// Body parser — supports either { body } pre-parsed (tests / Next.js) or a
// raw Node req stream emitting 'data'/'end' events.
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw.trim()) return resolve({});
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ─── Handler ───────────────────────────────────────────────────────────────

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const supabase = getSupabase(deps);

  // 1. Resolve caller (Bearer or legacy). On auth failure, resolveCaller
  //    already wrote the 401 + returned null.
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  // 2. Parse body.
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJson(res, 400, { error: 'invalid_json' });
  }

  const brief = body && body.brief;
  if (!brief || typeof brief !== 'object') {
    return writeJson(res, 400, {
      error: 'invalid_brief',
      errors: ['brief must be an object with channel/audience/pain/promise/brand fields'],
    });
  }

  // 3. Validate brief against REQUIRED_FIELDS (channel, audience, pain,
  //    promise, brand). On failure, echo the user-visible error list.
  const validation = validateBrief(brief);
  if (!validation.ok) {
    return writeJson(res, 400, {
      error: 'invalid_brief',
      errors: validation.errors,
    });
  }

  // 4. Normalize + compose plan envelope. No DB writes happen here — this is
  //    strictly an introspection endpoint. Future durability lands in 204-06.
  const normalized = normalizeBrief(brief);
  const envelope = buildPlanEnvelope(caller.tenant_id);

  // Echo back the normalized brief so the client can confirm parse correctness
  // without a second round-trip. Safe: brief content is user-supplied, not
  // tenant secret material.
  envelope.brief = normalized;

  return writeJson(res, 200, envelope);
}

module.exports = handler;
module.exports.handler = handler;
// Exposed for tests and downstream consumers.
module.exports._extractBearer = extractBearer;
module.exports._sha256Hex = sha256Hex;
module.exports._buildPlanEnvelope = buildPlanEnvelope;
module.exports._PLAN_STEPS = PLAN_STEPS;
module.exports._COST_PER_TOKEN_USD = COST_PER_TOKEN_USD;
