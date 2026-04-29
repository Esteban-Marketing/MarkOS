'use strict';

// Phase 201.1 D-109 (closes M6): admin list endpoint for reserved-slug overrides.
// Auth: requires actor on Tenant 0 with org_role='owner'. F-106 contract.

const { createClient } = require('@supabase/supabase-js');

// _clientFactory can be overridden in tests via module.exports._setClientFactory.
let _clientFactory = null;

function makeServiceClient() {
  if (_clientFactory) return _clientFactory();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

async function requireSystemAdmin(req) {
  const userId = req.headers && req.headers['x-markos-user-id'];
  if (!userId || typeof userId !== 'string') {
    return { ok: false, status: 401, error: 'auth_required' };
  }
  const client = makeServiceClient();
  const { data: tenant0 } = await client
    .from('markos_orgs')
    .select('id')
    .eq('slug', 'tenant-0')
    .maybeSingle();
  if (!tenant0) {
    return { ok: false, status: 503, error: 'tenant_0_unavailable' };
  }
  const { data: m } = await client
    .from('markos_org_memberships')
    .select('org_role')
    .eq('user_id', userId)
    .eq('org_id', tenant0.id)
    .maybeSingle();
  if (!m || m.org_role !== 'owner') {
    return { ok: false, status: 403, error: 'system_admin_required' };
  }
  return { ok: true, client, userId, tenant0Id: tenant0.id };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end();
  }
  const auth = await requireSystemAdmin(req);
  if (!auth.ok) {
    res.statusCode = auth.status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: auth.error }));
  }
  const { data, error } = await auth.client
    .from('markos_reserved_slugs')
    .select('slug, category, source_version, added_at, added_by, notes')
    .order('category', { ascending: true })
    .order('slug', { ascending: true });
  if (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message }));
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ slugs: data || [], total: (data || []).length }));
};

module.exports.requireSystemAdmin = requireSystemAdmin;
// Test-only hook: replace the Supabase client factory without monkey-patching the module registry.
module.exports._setClientFactory = (fn) => { _clientFactory = fn; };
module.exports._resetClientFactory = () => { _clientFactory = null; };
