'use strict';

// Phase 201 Plan 08 Task 1: Read-only audit log query surface.
// Tenant-admin + owner gated (T-201-08-01 mitigation). Returns the unified markos_audit_log
// rows filtered by tenant, with hash-chain fields (prev_hash, row_hash) so callers can replay
// verify via lib/markos/audit/chain-checker.cjs.
//
// Contract: contracts/F-88-tenant-audit-query-v1.yaml

const MAX_LIMIT = 500;

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end();
  }

  const headers = req.headers || {};
  const user_id = headers['x-markos-user-id'];
  const tenant_id = headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  let client;
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
      { auth: { persistSession: false } },
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: `client_init_failed: ${err.message}` }));
  }

  // Role check: caller must be owner or tenant-admin on this tenant.
  let mem = null;
  try {
    const result = await client
      .from('markos_tenant_memberships')
      .select('iam_role')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user_id)
      .maybeSingle();
    mem = result.data;
  } catch { /* treat as unauthorized below */ }

  if (!mem || !['owner', 'tenant-admin'].includes(mem.iam_role)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'forbidden' }));
  }

  const url = new URL(req.url, 'http://x');
  const source_domain = url.searchParams.get('source_domain');
  const action = url.searchParams.get('action');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const rawLimit = parseInt(url.searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(MAX_LIMIT, rawLimit)) : 100;

  let q = client
    .from('markos_audit_log')
    .select('id, occurred_at, action, source_domain, actor_id, actor_role, payload, prev_hash, row_hash')
    .eq('tenant_id', tenant_id)
    .order('occurred_at', { ascending: false })
    .limit(limit + 1);

  if (source_domain) q = q.eq('source_domain', source_domain);
  if (action) q = q.eq('action', action);
  if (from) q = q.gte('occurred_at', from);
  if (to) q = q.lte('occurred_at', to);

  const { data, error } = await q;
  if (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message }));
  }

  const rows = data || [];
  const has_more = rows.length > limit;
  const entries = has_more ? rows.slice(0, limit) : rows;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ entries, has_more }));
}

module.exports = handler;
