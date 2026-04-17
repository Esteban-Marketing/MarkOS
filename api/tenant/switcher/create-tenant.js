'use strict';

const { createTenantInOrg } = require('../../../lib/markos/tenant/switcher.cjs');

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

  const actor_id = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || null;
  const org_id = req.headers['x-markos-org-id'] || req.headers['X-Markos-Org-Id'] || null;
  if (!actor_id || !org_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const body = await readJson(req).catch(() => null);
  if (!body || !body.slug || !body.name) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'slug_and_name_required' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await createTenantInOrg(client, {
      org_id,
      slug: body.slug,
      name: body.name,
      actor_id,
    });
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    if (e && e.code === 'slug_reserved') {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'slug_reserved' }));
    }
    if (e && e.code === 'slug_taken') {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'slug_taken' }));
    }
    if (e && e.code === 'forbidden') {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'forbidden' }));
    }
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'create_tenant_failed', message: e && e.message }));
  }
}

module.exports = handler;
