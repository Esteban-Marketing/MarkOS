'use strict';

const { createAuthenticationOptions } = require('../../../lib/markos/auth/passkey.cjs');

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
  const body = await readJson(req).catch(() => null);
  if (!body || !body.user_id) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'user_id_required' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await createAuthenticationOptions(client, {
      user_id: body.user_id,
      rpID: process.env.NEXT_PUBLIC_RP_ID || 'markos.dev',
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'auth_options_failed', message: e.message }));
  }
}

module.exports = handler;
