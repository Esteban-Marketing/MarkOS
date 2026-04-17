'use strict';

const { pollDomainStatus } = require('../../../lib/markos/tenant/domains.cjs');

async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
  const org_id = req.headers['x-markos-org-id'];
  if (!org_id) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const url = new URL(req.url, 'http://x');
  const domain = url.searchParams.get('domain');
  if (!domain) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'domain_required' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const r = await pollDomainStatus(client, domain);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(r));
}

module.exports = handler;
