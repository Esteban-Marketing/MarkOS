'use strict';

// Phase 204 Plan 08 Task 1:
// GET /api/tenant/status
//
// Operator-self-serve status envelope. Returns the 4-panel cross-domain view:
//   1. subscription      (plan_tier + billing_status; defaults to free/active)
//   2. quota             (runs/tokens/deliveries this month; 30d sliding window)
//   3. active_rotations  (webhook signing-secret rotations; from Phase 203)
//   4. recent_runs       (last 5 by default; bounded 1..50)
//
// Auth: Bearer (mks_ak_<64 hex>) OR legacy x-markos-user-id+tenant-id headers.
// NO role gate — any authenticated member of the tenant can view their own
// status (read-only; T-204-08-01 mitigated by tenant-scoped queries).
//
// Query parameters:
//   ?runs=N — override the recent_runs limit (default 5; clamped 1..50)
//
// Responses:
//   200 → { subscription, quota, active_rotations, recent_runs, generated_at }
//   401 → { error: 'unauthorized' | 'invalid_token' | 'revoked_token' }
//   405 → { error: 'method_not_allowed' }
//   500 → { error: 'status_failed' }

const crypto = require('node:crypto');
const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../lib/markos/cli/whoami.cjs');
const { aggregateStatus } = require('../../lib/markos/cli/status.cjs');

// ─── Auth helpers (mirrors api/tenant/whoami.js + api/tenant/runs/create.js) ─

function extractBearer(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return null;
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../lib/markos/auth/session.ts');
  return real();
}

async function resolveCaller(req, res, supabase) {
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = sha256Hex(bearer);
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
      writeJson(res, 500, { error: 'status_failed', error_description: msg });
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

// ─── ?runs=N parsing ───────────────────────────────────────────────────────

function parseRunsLimit(req) {
  // req.query may exist (Vercel/Express adapter). Fallback to URL parse.
  const raw =
    (req.query && req.query.runs) ||
    (() => {
      try {
        const u = new URL(req.url || '/', 'http://x');
        return u.searchParams.get('runs');
      } catch {
        return null;
      }
    })();
  if (raw == null) return undefined;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(50, n);
}

// ─── Handler ───────────────────────────────────────────────────────────────

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const supabase = getSupabase(deps);

  // 1. Auth.
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  // 2. Aggregate.
  const recent_limit = parseRunsLimit(req);
  let envelope;
  try {
    envelope = await aggregateStatus({
      client: supabase,
      tenant_id: caller.tenant_id,
      user_id: caller.user_id,
      recent_limit,
    });
  } catch (err) {
    return writeJson(res, 500, {
      error: 'status_failed',
      error_description: err?.message || String(err),
    });
  }

  // Strip the underscore-prefixed advisory fields before returning. They are
  // useful internally (test plumbing + future telemetry) but the wire contract
  // declared in F-105 only carries the 5 named panels.
  const { _tenant_id, _user_id, ...wire } = envelope;
  return writeJson(res, 200, wire);
}

module.exports = handler;
module.exports.handler = handler;
// Test helpers
module.exports._extractBearer = extractBearer;
module.exports._sha256Hex = sha256Hex;
module.exports._resolveCaller = resolveCaller;
module.exports._parseRunsLimit = parseRunsLimit;
