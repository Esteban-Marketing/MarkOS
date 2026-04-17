'use strict';

const { verifyAuthenticationResponse } = require('../../../lib/markos/auth/passkey.cjs');

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
  if (!body || !body.user_id || !body.challenge_id || !body.authResponse) {
    res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_body' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await verifyAuthenticationResponse(client, {
      user_id: body.user_id,
      challenge_id: body.challenge_id,
      authResponse: body.authResponse,
      expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'https://markos.dev',
      expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'markos.dev',
    });
    if (!result.verified) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'verification_failed' }));
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ verified: true, credential_id: result.credential_id }));
  } catch (e) {
    const code = /challenge_expired|challenge_not_found|credential_not_found/.test(e.message) ? 400 : 500;
    res.statusCode = code;
    return res.end(JSON.stringify({ error: 'verification_error', message: e.message }));
  }
}

module.exports = handler;
