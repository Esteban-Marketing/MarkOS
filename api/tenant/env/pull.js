'use strict';

// Phase 204 Plan 07 Task 2:
// GET /api/tenant/env/pull
//
// Decrypts all env entries for the caller's tenant and returns them as
// { entries: [{ key, value }] }. HIGH-PRIVILEGE action — restricted to
// owner|admin (T-204-07-02). Calls pullEnv → RPC get_env_entries which
// pgp_sym_decrypts inside the DB using MARKOS_ENV_ENCRYPTION_KEY threaded
// from process.env.
//
// Server misconfiguration guard (T-204-07-09): if MARKOS_ENV_ENCRYPTION_KEY
// is unset, return 500 encryption_key_missing. NEVER fall through to a null-
// key decrypt.
//
// Audit emit: source_domain='cli', action='env.pulled', payload { key_count }
// — bulk read, key_count is sufficient for audit; the /list endpoint already
// catalogs which keys exist so re-emitting keys here would be redundant.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { hashToken } = require('../../../lib/markos/cli/plan.cjs');
const { pullEnv } = require('../../../lib/markos/cli/env.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

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

function resolveEncryptionKey(deps) {
  const key = (deps && deps.encryption_key) || process.env.MARKOS_ENV_ENCRYPTION_KEY;
  return (typeof key === 'string' && key.length > 0) ? key : null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const supabase = getSupabase(deps);
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  // Role gate: owner|admin only (T-204-07-02).
  if (!(caller.role === 'owner' || caller.role === 'admin')) {
    return writeJson(res, 403, {
      error: 'insufficient_role',
      required: ['owner', 'admin'],
      actual: caller.role || null,
    });
  }

  // Server-side encryption key guard (T-204-07-09).
  const encryption_key = resolveEncryptionKey(deps);
  if (!encryption_key) {
    return writeJson(res, 500, {
      error: 'encryption_key_missing',
      message: 'Server misconfiguration — MARKOS_ENV_ENCRYPTION_KEY not set',
    });
  }

  let entries;
  try {
    entries = await pullEnv({
      client: supabase,
      tenant_id: caller.tenant_id,
      encryption_key,
    });
  } catch (err) {
    return writeJson(res, 500, {
      error: 'pull_failed',
      error_description: err?.message || String(err),
    });
  }

  // Audit emit — bulk pulls get a key_count payload, no keys (list endpoint
  // already catalogs them) and never values.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id: caller.tenant_id,
      source_domain: 'cli',
      action: 'env.pulled',
      actor_id: caller.user_id,
      actor_role: caller.role,
      payload: { key_count: entries.length },
    });
  } catch {
    // Advisory — never block pull on audit failure.
  }

  return writeJson(res, 200, { entries });
}

module.exports = handler;
module.exports.handler = handler;
module.exports._resolveEncryptionKey = resolveEncryptionKey;
module.exports._resolveCaller = resolveCaller;
