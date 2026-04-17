'use strict';

const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const userId = (req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id']) || process.env.MARKOS_ACTIVE_USER_ID;
  const tenantId = (req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id']) || null;
  const orgId = (req.headers['x-markos-org-id'] || req.headers['X-Markos-Org-Id']) || null;
  const currentSessionId = (req.headers['x-markos-session-id'] || req.headers['X-Markos-Session-Id']) || null;

  if (!userId || !tenantId) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const body = await readJson(req).catch(() => null);
  if (!body) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_json' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  if (body.all === true) {
    if (!currentSessionId) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'current_session_unknown' })); }

    const { data, error } = await client
      .from('markos_sessions_devices')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .neq('session_id', currentSessionId)
      .is('revoked_at', null)
      .select('session_id');

    if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }

    const revoked_count = Array.isArray(data) ? data.length : 0;
    try {
      await enqueueAuditStaging(client, {
        tenant_id: tenantId,
        org_id: orgId,
        source_domain: 'auth',
        action: 'session.revoked_all_others',
        actor_id: userId,
        actor_role: 'owner',
        payload: { revoked_count, kept_session_id: currentSessionId },
      });
    } catch { /* noop */ }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, revoked_count }));
  }

  if (typeof body.session_id !== 'string' || !body.session_id) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'session_id_required' }));
  }

  const { data, error } = await client
    .from('markos_sessions_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('session_id', body.session_id)
    .is('revoked_at', null)
    .select('session_id');

  if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }
  if (!Array.isArray(data) || data.length === 0) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'not_found' })); }

  try {
    await enqueueAuditStaging(client, {
      tenant_id: tenantId,
      org_id: orgId,
      source_domain: 'auth',
      action: 'session.revoked',
      actor_id: userId,
      actor_role: 'owner',
      payload: { session_id: body.session_id },
    });
  } catch { /* noop */ }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
}

module.exports = handler;
