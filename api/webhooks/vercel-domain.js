'use strict';

const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const { verifySignature, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('../../lib/markos/webhooks/signing.cjs');
const { pollDomainStatus } = require('../../lib/markos/tenant/domains.cjs');

initOtel({ serviceName: 'markos' });

async function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function endJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  res.statusCode = statusCode;
  if (payload !== undefined) {
    res.setHeader?.('Content-Type', 'application/json');
    return res.end(JSON.stringify(payload));
  }
  return res.end();
}

async function handleVercelDomainWebhook(req, res, span) {
  if (req.method !== 'POST') return endJsonWithSpan(span, res, 405);

  const body = await readRaw(req);
  const signature = req.headers[SIGNATURE_HEADER.toLowerCase()] || req.headers[SIGNATURE_HEADER];
  const timestamp = req.headers[TIMESTAMP_HEADER.toLowerCase()] || req.headers[TIMESTAMP_HEADER];

  const secret = process.env.VERCEL_DOMAIN_WEBHOOK_SECRET || '';
  if (!verifySignature(secret, body, signature, timestamp)) {
    return endJsonWithSpan(span, res, 401, { error: 'invalid_signature' });
  }

  let payload;
  try { payload = JSON.parse(body); } catch { return endJsonWithSpan(span, res, 400, { error: 'invalid_json' }); }

  const domain = payload && payload.domain;
  if (!domain) return endJsonWithSpan(span, res, 400, { error: 'domain_missing' });

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const r = await pollDomainStatus(client, domain);
  return endJsonWithSpan(span, res, 200, { ok: true, status: r.status });
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.vercel_domain', { method: req.method }, async (span) => handleVercelDomainWebhook(req, res, span));
};
module.exports.handleVercelDomainWebhook = handleVercelDomainWebhook;
