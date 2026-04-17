'use strict';

const { withdrawInvite } = require('../../../lib/markos/tenant/invites.cjs');

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
  if (!actor_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const body = await readJson(req).catch(() => null);
  if (!body || !body.token) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'token_required' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  await withdrawInvite(client, { token: body.token, actor_id });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
}

module.exports = handler;
