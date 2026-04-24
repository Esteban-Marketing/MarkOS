'use strict';

// Phase 204 Plan 04 Task 1:
// GET /api/tenant/whoami
//
// Observability endpoint — proves auth + tenant routing is live. Returns the
// caller's tenant/user/role envelope so the CLI can display "logged in as …".
//
// Dual authentication modes:
//   1. NEW (CLI):     Authorization: Bearer mks_ak_<64 hex>
//                     → sha256(token) → resolveWhoami(client, { key_hash })
//                     → full envelope with { key_fingerprint, scope: 'cli', last_used_at }
//   2. LEGACY (web):  x-markos-user-id + x-markos-tenant-id headers
//                     → resolveSessionWhoami(client, { user_id, tenant_id })
//                     → envelope with { scope: 'session', key_fingerprint: null }
//
// Error envelopes (D-10 aligned):
//   - no auth / malformed Bearer → 401 { error: 'unauthorized' }
//   - invalid_token               → 401 { error: 'invalid_token' }
//   - revoked_token               → 401 { error: 'revoked_token',
//                                          hint: 'Run markos login again' }
//
// Security notes:
//   - Response NEVER echoes the Bearer token, key_hash, or any plaintext secret.
//   - key_fingerprint (first 8 hex chars of sha256) is the only key-derived
//     identifier returned — safe to log.
//   - No role gate: any authenticated member can whoami themselves (whoami is
//     inherently self-referential; tenant isolation is enforced by the Bearer
//     token / session pointing at their own row).

const crypto = require('node:crypto');
const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../lib/markos/cli/whoami.cjs');

// ─── Auth helpers (inline per plan spec — <interfaces> block) ──────────────

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

// ─── Handler ───────────────────────────────────────────────────────────────

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const supabase = getSupabase(deps);

  // ── Mode 1: Bearer ───────────────────────────────────────────────────────
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = sha256Hex(bearer);
    let envelope;
    try {
      envelope = await resolveWhoami({ client: supabase, key_hash });
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'revoked_token') {
        return writeJson(res, 401, {
          error: 'revoked_token',
          hint: 'Run `markos login` again to mint a fresh key.',
        });
      }
      if (msg === 'invalid_token') {
        return writeJson(res, 401, { error: 'invalid_token' });
      }
      // Infra error — don't leak details beyond generic 500.
      return writeJson(res, 500, {
        error: 'whoami_failed',
        error_description: msg,
      });
    }
    return writeJson(res, 200, envelope);
  }

  // ── Mode 2: legacy session headers ───────────────────────────────────────
  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    let envelope;
    try {
      envelope = await resolveSessionWhoami({
        client: supabase,
        user_id,
        tenant_id,
      });
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'invalid_token') {
        return writeJson(res, 401, { error: 'invalid_token' });
      }
      return writeJson(res, 500, {
        error: 'whoami_failed',
        error_description: msg,
      });
    }
    return writeJson(res, 200, envelope);
  }

  // ── No credentials at all ────────────────────────────────────────────────
  return writeJson(res, 401, { error: 'unauthorized' });
}

module.exports = handler;
module.exports.handler = handler;
// Test helpers
module.exports._extractBearer = extractBearer;
module.exports._sha256Hex = sha256Hex;
