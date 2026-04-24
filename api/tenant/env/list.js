'use strict';

// Phase 204 Plan 07 Task 2:
// GET /api/tenant/env
//
// Returns redacted list of env entries for the caller's tenant. Any authed
// member can call this (no role gate) because the response contains only
// `value_preview` — the first 4 chars of plaintext + '…' — NEVER the full
// decrypted value. T-204-07-01 mitigation.
//
// Security envelope:
//   - Bearer OR legacy session headers (same dual-mode pattern as runs/create.js).
//   - Delegates to listEnv (lib/markos/cli/env.cjs) which applies an explicit
//     column allow-list (NEVER value_encrypted) as defense-in-depth over RLS.
//   - Response: { entries: [{ key, value_preview, updated_at, updated_by }] }.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { hashToken } = require('../../../lib/markos/cli/plan.cjs');
const { listEnv } = require('../../../lib/markos/cli/env.cjs');

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
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, role: envelope.role };
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'revoked_token') {
        writeJson(res, 401, { error: 'revoked_token', hint: 'Run `markos login` again.' });
        return null;
      }
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }
  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    try {
      const envelope = await resolveSessionWhoami({ client: supabase, user_id, tenant_id });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, role: envelope.role };
    } catch {
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }
  writeJson(res, 401, { error: 'unauthorized' });
  return null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const supabase = getSupabase(deps);
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  try {
    const entries = await listEnv({ client: supabase, tenant_id: caller.tenant_id });
    return writeJson(res, 200, { entries });
  } catch (err) {
    return writeJson(res, 500, {
      error: 'list_failed',
      error_description: err?.message || String(err),
    });
  }
}

module.exports = handler;
module.exports.handler = handler;
module.exports._extractBearer = extractBearer;
module.exports._resolveCaller = resolveCaller;
