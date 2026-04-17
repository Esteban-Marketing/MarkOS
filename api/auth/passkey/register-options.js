'use strict';

const { createRegistrationOptions } = require('../../../lib/markos/auth/passkey.cjs');

async function getSession(req) {
  // Minimal session resolution — reads markos-user header set by middleware in Plan 05,
  // falls back to env MARKOS_ACTIVE_USER_ID for tests.
  const headerUser = req.headers && (req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id']);
  const user_id = headerUser || process.env.MARKOS_ACTIVE_USER_ID || null;
  if (!user_id) return null;
  return { user_id };
}

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

  const session = await getSession(req);
  if (!session) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const body = await readJson(req).catch(() => null);
  if (!body) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_json' })); }

  const rpID = process.env.NEXT_PUBLIC_RP_ID || 'markos.dev';

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await createRegistrationOptions(client, {
      user_id: session.user_id,
      rpID,
      rpName: 'MarkOS',
      userName: body.userName || session.user_id,
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'registration_options_failed', message: e.message }));
  }
}

module.exports = handler;
