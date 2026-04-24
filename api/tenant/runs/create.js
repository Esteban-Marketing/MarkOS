'use strict';

// Phase 204 Plan 06 Task 2:
// POST /api/tenant/runs
//
// Durable run submission. Accepts a brief, validates it, and persists a
// markos_cli_runs row (migration 75). A stub executor is scheduled on the
// next tick to walk the state machine — Phase 205 will replace with the real
// LLM-backed agent run.
//
// Response shape intentionally echoes a subset of the dry-run /plan envelope
// PLUS the durable `run_id` + `events_url` so the CLI can immediately open the
// SSE stream without a second roundtrip.
//
// Auth: Bearer (mks_ak_<64 hex>) OR legacy x-markos-user-id+tenant-id headers.
// Mirrors api/tenant/runs/plan.js (Plan 204-05) for consistency.
//
// Body:
//   { "brief": { channel, audience, pain, promise, brand, ... } }
//
// Responses:
//   201 → { run_id, status:'pending', tenant_id, priority, correlation_id, events_url }
//   400 → { error: 'invalid_brief', errors: string[] }
//   401 → { error: 'unauthorized' | 'invalid_token' | 'revoked_token' }
//   405 → { error: 'method_not_allowed' }
//   500 → { error: 'run_create_failed' }

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { validateBrief, normalizeBrief } = require('../../../bin/lib/brief-parser.cjs');
const { submitRun } = require('../../../lib/markos/cli/runs.cjs');
const { hashToken } = require('../../../lib/markos/cli/plan.cjs');

// ─── Auth helpers ──────────────────────────────────────────────────────────

function extractBearer(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return null;
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

async function resolveCaller(req, res, supabase) {
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = hashToken(bearer);
    try {
      const envelope = await resolveWhoami({ client: supabase, key_hash });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'cli' };
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
      writeJson(res, 500, { error: 'run_create_failed', error_description: msg });
      return null;
    }
  }

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    try {
      const envelope = await resolveSessionWhoami({ client: supabase, user_id, tenant_id });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'session' };
    } catch {
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }

  writeJson(res, 401, { error: 'unauthorized' });
  return null;
}

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

  // 1. Auth.
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  // 2. Body.
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

  // 3. Validate.
  const validation = validateBrief(brief);
  if (!validation.ok) {
    return writeJson(res, 400, {
      error: 'invalid_brief',
      errors: validation.errors,
    });
  }

  // 4. Persist.
  const normalized = normalizeBrief(brief);
  try {
    const result = await submitRun({
      client: supabase,
      tenant_id: caller.tenant_id,
      user_id: caller.user_id,
      brief: normalized,
      priority: typeof body.priority === 'string' ? body.priority : undefined,
      chain_id: typeof body.chain_id === 'string' ? body.chain_id : null,
    });
    return writeJson(res, 201, result);
  } catch (err) {
    return writeJson(res, 500, {
      error: 'run_create_failed',
      error_description: err?.message || String(err),
    });
  }
}

module.exports = handler;
module.exports.handler = handler;
module.exports._extractBearer = extractBearer;
module.exports._resolveCaller = resolveCaller;
