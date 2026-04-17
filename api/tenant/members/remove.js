'use strict';

const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const actor_id = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || process.env.MARKOS_ACTIVE_USER_ID || null;
  const tenant_id = req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id'] || null;
  const org_id = req.headers['x-markos-org-id'] || req.headers['X-Markos-Org-Id'] || null;
  if (!actor_id || !tenant_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const body = await readJson(req).catch(() => null);
  if (!body || !body.user_id) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'user_id_required' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data, error } = await client
    .from('markos_tenant_memberships')
    .delete()
    .eq('tenant_id', tenant_id)
    .eq('user_id', body.user_id)
    .select('user_id, iam_role');

  if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }
  if (!Array.isArray(data) || data.length === 0) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'not_found' }));
  }

  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id,
      source_domain: 'tenancy',
      action: 'member.removed',
      actor_id,
      actor_role: 'owner',
      payload: { removed_user_id: body.user_id, removed_role: data[0].iam_role },
    });
  } catch { /* noop */ }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
}

module.exports = handler;
