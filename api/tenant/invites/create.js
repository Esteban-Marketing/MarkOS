'use strict';

const { createInvite } = require('../../../lib/markos/tenant/invites.cjs');

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

  const invited_by = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || null;
  const org_id = req.headers['x-markos-org-id'] || req.headers['X-Markos-Org-Id'] || null;
  const tenant_id = req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id'] || null;
  if (!invited_by || !org_id || !tenant_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const body = await readJson(req).catch(() => null);
  if (!body || !body.email || !body.tenant_role) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'email_and_tenant_role_required' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await createInvite(client, {
      org_id,
      tenant_id,
      email: body.email,
      tenant_role: body.tenant_role,
      invited_by,
    });
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    if (e && e.code === 'seat_quota_reached') {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'seat_quota_reached' }));
    }
    if (e && /invalid tenant_role/.test(e.message || '')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'invalid_tenant_role' }));
    }
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'create_failed', message: e && e.message }));
  }
}

module.exports = handler;
