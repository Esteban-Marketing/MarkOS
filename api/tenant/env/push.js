'use strict';

// Phase 204 Plan 07 Task 2:
// POST /api/tenant/env/push
//
// Bulk upsert env entries for the caller's tenant. Values are encrypted at
// rest via pgcrypto (RPC set_env_entry). Owner|admin only (T-204-07-02).
//
// Body:
//   { "entries": [{ "key": "FOO", "value": "bar" }, ...] }
//
// Validation (T-204-07-08 DoS + key-hygiene):
//   - entries is an array of 1..100 items else 400 too_many_entries / invalid_entries
//   - each key matches /^[A-Z][A-Z0-9_]*$/ else 400 invalid_key with offending key
//   - each value is a string ≤ 8192 chars else 400 value_too_large
//
// Server misconfiguration guard (T-204-07-09): 500 encryption_key_missing if
// MARKOS_ENV_ENCRYPTION_KEY is unset.
//
// Audit: endpoint emits authoritative row with actor_role resolved. Payload
// carries { keys, count } — NEVER values (T-204-07-03).

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../lib/markos/cli/whoami.cjs');
const { hashToken } = require('../../../lib/markos/cli/plan.cjs');
const { pushEnv, DOTENV_KEY_RE } = require('../../../lib/markos/cli/env.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

const MAX_ENTRIES = 100;
const MAX_VALUE_CHARS = 8192;

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

function validateEntries(entries) {
  if (!Array.isArray(entries)) {
    return { error: 'invalid_entries', message: 'entries must be an array' };
  }
  if (entries.length === 0) {
    return { error: 'invalid_entries', message: 'entries must contain at least one item' };
  }
  if (entries.length > MAX_ENTRIES) {
    return { error: 'too_many_entries', limit: MAX_ENTRIES, actual: entries.length };
  }
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e || typeof e !== 'object') {
      return { error: 'invalid_entries', index: i, message: 'entry must be an object' };
    }
    if (typeof e.key !== 'string' || !DOTENV_KEY_RE.test(e.key)) {
      return { error: 'invalid_key', index: i, key: e.key };
    }
    if (typeof e.value !== 'string') {
      return { error: 'invalid_entries', index: i, message: 'value must be a string' };
    }
    if (e.value.length > MAX_VALUE_CHARS) {
      return { error: 'value_too_large', index: i, key: e.key, limit: MAX_VALUE_CHARS, actual: e.value.length };
    }
  }
  return null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const supabase = getSupabase(deps);
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  // Role gate: owner|admin only.
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

  const entries = body && body.entries;
  const validation = validateEntries(entries);
  if (validation) return writeJson(res, 400, validation);

  const encryption_key = resolveEncryptionKey(deps);
  if (!encryption_key) {
    return writeJson(res, 500, {
      error: 'encryption_key_missing',
      message: 'Server misconfiguration — MARKOS_ENV_ENCRYPTION_KEY not set',
    });
  }

  try {
    await pushEnv({
      client: supabase,
      tenant_id: caller.tenant_id,
      user_id: caller.user_id,
      entries,
      encryption_key,
    });
  } catch (err) {
    return writeJson(res, 500, {
      error: 'push_failed',
      error_description: err?.message || String(err),
    });
  }

  // Authoritative endpoint-level audit emit with real actor_role.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id: caller.tenant_id,
      source_domain: 'cli',
      action: 'env.pushed',
      actor_id: caller.user_id,
      actor_role: caller.role,
      payload: {
        keys: entries.map((e) => e.key),
        count: entries.length,
      },
    });
  } catch {
    // Advisory.
  }

  return writeJson(res, 200, { updated: entries.length });
}

module.exports = handler;
module.exports.handler = handler;
module.exports._validateEntries = validateEntries;
module.exports._resolveEncryptionKey = resolveEncryptionKey;
module.exports.MAX_ENTRIES = MAX_ENTRIES;
module.exports.MAX_VALUE_CHARS = MAX_VALUE_CHARS;
