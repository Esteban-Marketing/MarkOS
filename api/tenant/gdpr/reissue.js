'use strict';

// Phase 201.1 D-102 (closes H3): Re-auth-required GDPR export URL reissue.
// Rotates the single-use nonce and extends the 24h TTL.
// Requires a still-valid session (markos_sessions_devices check).

const { createClient } = require('@supabase/supabase-js');
const { reissueExport } = require('../../../lib/markos/tenant/gdpr-export.cjs');

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  const tenant_id  = req.headers['x-markos-tenant-id'];
  const user_id    = req.headers['x-markos-user-id'];
  const session_id = req.headers['x-markos-session-id'];

  if (!tenant_id || !user_id || !session_id) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'auth_headers_required' }));
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_json' }));
  }

  const { export_id } = body || {};
  if (!export_id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'export_id_required' }));
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );

  // Re-auth gate: verify the session is still valid before allowing nonce rotation.
  const { data: sess } = await client
    .from('markos_sessions_devices')
    .select('user_id, expires_at')
    .eq('session_id', session_id)
    .maybeSingle();

  if (!sess || sess.user_id !== user_id || new Date(sess.expires_at).getTime() < Date.now()) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'session_expired_reauth_required' }));
  }

  try {
    const result = await reissueExport(client, {
      export_id, actor_user_id: user_id, session_id, requesting_tenant_id: tenant_id,
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (err) {
    const msg = err?.message ?? String(err);
    const status = msg.includes('owner role required') ? 403
      : msg.includes('audience_mismatch') ? 403
      : msg.includes('not found') ? 404
      : 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: msg }));
  }
};
