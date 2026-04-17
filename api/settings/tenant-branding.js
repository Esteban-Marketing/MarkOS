'use strict';

const { getTenantBranding, upsertTenantBranding } = require('../../lib/markos/tenant/branding.cjs');

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
  const user_id = req.headers['x-markos-user-id'] || process.env.MARKOS_ACTIVE_USER_ID;
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!tenant_id) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  if (req.method === 'GET') {
    const b = await getTenantBranding(client, tenant_id);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(b));
  }

  if (req.method === 'POST') {
    if (!user_id) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }
    const body = await readJson(req).catch(() => null);
    if (!body) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_json' })); }
    try {
      await upsertTenantBranding(client, tenant_id, body, user_id);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'invalid_input', message: e.message }));
    }
  }

  res.statusCode = 405;
  return res.end();
}

module.exports = handler;
