'use strict';

const { removeCustomDomain } = require('../../../lib/markos/tenant/domains.cjs');

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
  const user_id = req.headers['x-markos-user-id'] || process.env.MARKOS_ACTIVE_USER_ID;
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !org_id) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const body = await readJson(req).catch(() => null);
  if (!body || !body.domain) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'domain_required' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const r = await removeCustomDomain(client, { org_id, domain: body.domain, actor_id: user_id });
  res.statusCode = r.ok ? 200 : (r.error === 'not_found' ? 404 : 500);
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(r));
}

module.exports = handler;
