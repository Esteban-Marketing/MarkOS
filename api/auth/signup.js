'use strict';

// Phase 201 Plan 03: POST /api/auth/signup
// Wires the Surface 1 form to lib/markos/auth/signup.cjs. Contract: F-80.

const { enqueueSignup } = require('../../lib/markos/auth/signup.cjs');

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body; // Vercel pre-parses
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  let body;
  try { body = await readJsonBody(req); }
  catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_json' }));
  }

  const { email, botIdToken } = body || {};
  if (typeof email !== 'string' || typeof botIdToken !== 'string') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_body', message: 'email + botIdToken required' }));
  }

  let client;
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'client_init_failed', message: e.message }));
  }

  const ip = getClientIp(req);
  const result = await enqueueSignup(client, { email, botIdToken, ip });

  const statusByCode = {
    invalid_email: 400,
    bot_detected:  403,
    rate_limited:  429,
    db_error:      500,
    supabase_error: 400,
  };

  res.setHeader('Content-Type', 'application/json');
  if (result.ok) {
    res.statusCode = 201;
    return res.end(JSON.stringify({ ok: true, buffer_expires_at: result.buffer_expires_at }));
  }
  res.statusCode = statusByCode[result.code] || 500;
  return res.end(JSON.stringify({ error: result.code, message: result.message }));
}

module.exports = handler;
module.exports.getClientIp = getClientIp;
