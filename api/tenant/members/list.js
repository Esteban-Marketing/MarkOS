'use strict';

const { countOrgActiveMembers } = require('../../../lib/markos/orgs/api.cjs');

async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }

  const tenant_id = req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id'] || null;
  const org_id = req.headers['x-markos-org-id'] || req.headers['X-Markos-Org-Id'] || null;
  if (!tenant_id || !org_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: memberships, error } = await client
    .from('markos_tenant_memberships')
    .select('id, user_id, iam_role, created_at')
    .eq('tenant_id', tenant_id);
  if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }

  const { data: org } = await client
    .from('markos_orgs')
    .select('seat_quota, name')
    .eq('id', org_id)
    .maybeSingle();

  const used = await countOrgActiveMembers(client, org_id);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    members: memberships || [],
    seat_usage: { used, quota: org ? Number(org.seat_quota) : 0 },
  }));
}

module.exports = handler;
