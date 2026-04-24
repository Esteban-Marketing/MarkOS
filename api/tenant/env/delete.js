'use strict';

// Phase 204 Plan 07 Task 2/3:
// POST /api/tenant/env/delete
//
// Bulk delete env entries for the caller's tenant. Owner|admin only.
//
// Body:
//   { "keys": ["FOO", "BAR", ...] }
//
// Validation:
//   - keys is an array of 1..100 strings
//   - each key matches /^[A-Z][A-Z0-9_]*$/ else 400 invalid_key
//
// Audit: endpoint emits authoritative row. Payload { keys, count }.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { hashToken } = require('../../../lib/markos/cli/plan.cjs');
const { deleteEnv, DOTENV_KEY_RE } = require('../../../lib/markos/cli/env.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

const MAX_KEYS = 100;

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

function validateKeys(keys) {
  if (!Array.isArray(keys)) {
    return { error: 'invalid_keys', message: 'keys must be an array' };
  }
  if (keys.length === 0) {
    return { error: 'invalid_keys', message: 'keys must contain at least one item' };
  }
  if (keys.length > MAX_KEYS) {
    return { error: 'too_many_keys', limit: MAX_KEYS, actual: keys.length };
  }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (typeof k !== 'string' || !DOTENV_KEY_RE.test(k)) {
      return { error: 'invalid_key', index: i, key: k };
    }
  }
  return null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const supabase = getSupabase(deps);
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  if (!(caller.role === 'owner' || caller.role === 'admin')) {
    return writeJson(res, 403, {
      error: 'insufficient_role',
      required: ['owner', 'admin'],
      actual: caller.role || null,
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJson(res, 400, { error: 'invalid_json' });
  }

  const keys = body && body.keys;
  const validation = validateKeys(keys);
  if (validation) return writeJson(res, 400, validation);

  let result;
  try {
    result = await deleteEnv({
      client: supabase,
      tenant_id: caller.tenant_id,
      user_id: caller.user_id,
      keys,
    });
  } catch (err) {
    return writeJson(res, 500, {
      error: 'delete_failed',
      error_description: err?.message || String(err),
    });
  }

  try {
    await enqueueAuditStaging(supabase, {
      tenant_id: caller.tenant_id,
      source_domain: 'cli',
      action: 'env.deleted',
      actor_id: caller.user_id,
      actor_role: caller.role,
      payload: { keys: keys.slice(), count: keys.length },
    });
  } catch {
    // Advisory.
  }

  return writeJson(res, 200, { deleted: result.deleted });
}

module.exports = handler;
module.exports.handler = handler;
module.exports._validateKeys = validateKeys;
module.exports.MAX_KEYS = MAX_KEYS;
