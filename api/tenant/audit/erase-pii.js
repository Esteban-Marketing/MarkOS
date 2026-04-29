'use strict';

// Phase 201.1 D-106 (closes M4): Tenant-admin GDPR Art. 17 erasure endpoint.
// POST /api/tenant/audit/erase-pii
// Auth: X-Markos-User-Id + X-Markos-Tenant-Id headers
// RBAC: user must be owner on the tenant (via markos_org_memberships).
// Defense-in-depth: row.tenant_id is fetched from DB and verified against the header value.
//
// Threat mitigations:
//   T-201.1-06-02: service_role + owner RBAC gate.
//   T-201.1-06-04: cross-tenant erasure blocked by row.tenant_id check.

const { createClient } = require('@supabase/supabase-js');
const { eraseAuditPii } = require('../../../lib/markos/audit/erasure.cjs');

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

async function requireTenantOwner(client, user_id, tenant_id) {
  if (!user_id) return { ok: false, status: 401, error: 'auth_required' };
  if (!tenant_id) return { ok: false, status: 400, error: 'tenant_id_required' };

  // Fetch org_id for this tenant.
  const { data: tenant } = await client
    .from('markos_tenants')
    .select('org_id')
    .eq('id', tenant_id)
    .maybeSingle();
  if (!tenant) return { ok: false, status: 404, error: 'tenant_not_found' };

  // Verify the caller is owner on that org.
  const { data: membership } = await client
    .from('markos_org_memberships')
    .select('role')
    .eq('user_id', user_id)
    .eq('org_id', tenant.org_id)
    .maybeSingle();
  if (!membership || membership.role !== 'owner') {
    return { ok: false, status: 403, error: 'owner_required' };
  }

  return { ok: true };
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (chunk) => { buf += chunk; });
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  const user_id  = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];

  const client = makeClient();
  const authResult = await requireTenantOwner(client, user_id, tenant_id);
  if (!authResult.ok) {
    res.statusCode = authResult.status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: authResult.error }));
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_json' }));
  }

  const { row_id, reason } = body || {};

  if (typeof row_id !== 'number' || !Number.isInteger(row_id) || row_id <= 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'row_id must be a positive integer' }));
  }

  // Defense-in-depth (T-201.1-06-04): confirm the audit row belongs to the requesting tenant.
  // Do not trust the client-supplied row_id alone.
  const { data: auditRow } = await client
    .from('markos_audit_log')
    .select('id, tenant_id')
    .eq('id', row_id)
    .maybeSingle();

  if (!auditRow) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'audit_row_not_found' }));
  }
  if (auditRow.tenant_id !== tenant_id) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'tenant_mismatch' }));
  }

  try {
    const result = await eraseAuditPii(client, {
      row_id,
      reason: reason || 'gdpr_art_17_request',
      actor_id: user_id,
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: true,
      tombstone_id: result.tombstone_id,
      new_row_hash: result.new_row_hash,
    }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'erase_failed', detail: err.message }));
  }
};
