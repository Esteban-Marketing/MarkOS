'use strict';

const { verifySignature, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('../../lib/markos/webhooks/signing.cjs');
const { pollDomainStatus } = require('../../lib/markos/tenant/domains.cjs');

async function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const body = await readRaw(req);
  const signature = req.headers[SIGNATURE_HEADER.toLowerCase()] || req.headers[SIGNATURE_HEADER];
  const timestamp = req.headers[TIMESTAMP_HEADER.toLowerCase()] || req.headers[TIMESTAMP_HEADER];

  const secret = process.env.VERCEL_DOMAIN_WEBHOOK_SECRET || '';
  if (!verifySignature(secret, body, signature, timestamp)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'invalid_signature' }));
  }

  let payload;
  try { payload = JSON.parse(body); } catch { res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_json' })); }

  const domain = payload && payload.domain;
  if (!domain) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'domain_missing' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const r = await pollDomainStatus(client, domain);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true, status: r.status }));
}

module.exports = handler;
