'use strict';

const { acceptInvite } = require('../../../lib/markos/tenant/invites.cjs');

const KNOWN_400 = new Set([
  'invite_not_found',
  'invite_already_accepted',
  'invite_withdrawn',
  'invite_expired',
  'invite_email_mismatch',
  'seat_quota_reached',
]);

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

  const accepting_user_id = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || null;
  const accepting_email = req.headers['x-markos-user-email'] || req.headers['X-Markos-User-Email'] || null;
  if (!accepting_user_id || !accepting_email) {
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

  try {
    const result = await acceptInvite(client, {
      token: body.token,
      accepting_user_id,
      accepting_email,
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    const reason = (e && e.message) || 'accept_failed';
    res.statusCode = KNOWN_400.has(reason) ? 400 : 500;
    return res.end(JSON.stringify({ error: reason }));
  }
}

module.exports = handler;
