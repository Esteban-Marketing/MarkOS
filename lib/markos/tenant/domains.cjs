'use strict';

const { enqueueAuditStaging } = require('../audit/writer.cjs');
const { addDomain, removeDomain, getDomainStatus } = require('./vercel-domains-client.cjs');

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(\.[a-z]{2,})+$/i;

function normaliseDomain(domain) {
  if (typeof domain !== 'string') return '';
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

async function hasActiveDomain(client, org_id) {
  const { data } = await client
    .from('markos_custom_domains')
    .select('domain')
    .eq('org_id', org_id)
    .in('status', ['pending', 'verifying', 'verified'])
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function addCustomDomain(client, input, deps = {}) {
  const { org_id, tenant_id, domain, actor_id } = input || {};
  if (!org_id || !tenant_id || !domain || !actor_id) {
    return { ok: false, error: 'invalid_input' };
  }

  const normalised = normaliseDomain(domain);
  if (!DOMAIN_REGEX.test(normalised)) {
    return { ok: false, error: 'invalid_domain_format' };
  }

  // D-13: 1-per-org quota (check before Vercel call to avoid orphaned domains).
  if (await hasActiveDomain(client, org_id)) {
    return { ok: false, error: 'quota_exceeded' };
  }

  // Vercel API add.
  const vercel = await (deps.addDomain || addDomain)({
    token: process.env.VERCEL_TOKEN || '',
    projectId: process.env.VERCEL_PROJECT_ID || '',
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    domain: normalised,
  });
  if (!vercel.ok) {
    return { ok: false, error: `vercel_api_failed:${vercel.status || 'unknown'}` };
  }

  const cnameTarget = Array.isArray(vercel.verification) && vercel.verification.find
    ? (vercel.verification.find((v) => v && v.type === 'CNAME') || {}).value || null
    : null;

  const { error: insertErr } = await client
    .from('markos_custom_domains')
    .insert({
      domain: normalised,
      org_id,
      tenant_id,
      status: 'pending',
      cname_target: cnameTarget,
      vercel_project_id: process.env.VERCEL_PROJECT_ID || null,
      vercel_domain_id: vercel.vercel_domain_id,
      verification_challenge: Array.isArray(vercel.verification) ? JSON.stringify(vercel.verification) : null,
    });
  if (insertErr) {
    // Best-effort: attempt to roll back the Vercel add.
    try { await (deps.removeDomain || removeDomain)({ token: process.env.VERCEL_TOKEN || '', projectId: process.env.VERCEL_PROJECT_ID || '', domain: normalised }); } catch { /* noop */ }
    return { ok: false, error: `db_insert_failed:${insertErr.message}` };
  }

  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id,
      source_domain: 'tenancy',
      action: 'custom_domain.added',
      actor_id,
      actor_role: 'owner',
      payload: { domain: normalised, cname_target: cnameTarget },
    });
  } catch { /* noop */ }

  return { ok: true, domain: normalised, status: 'pending', cname_target: cnameTarget };
}

async function removeCustomDomain(client, input, deps = {}) {
  const { org_id, domain, actor_id } = input || {};
  if (!org_id || !domain || !actor_id) return { ok: false, error: 'invalid_input' };
  const normalised = normaliseDomain(domain);

  const { data: row } = await client
    .from('markos_custom_domains')
    .select('tenant_id, vercel_domain_id, status')
    .eq('domain', normalised)
    .eq('org_id', org_id)
    .maybeSingle();
  if (!row) return { ok: false, error: 'not_found' };

  const vercel = await (deps.removeDomain || removeDomain)({
    token: process.env.VERCEL_TOKEN || '',
    projectId: process.env.VERCEL_PROJECT_ID || '',
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    domain: normalised,
  });
  // Continue soft-delete even if Vercel returns 404 (domain might have been deleted already).

  await client
    .from('markos_custom_domains')
    .update({
      status: 'failed',
      removed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('domain', normalised)
    .eq('org_id', org_id);

  try {
    await enqueueAuditStaging(client, {
      tenant_id: row.tenant_id,
      org_id,
      source_domain: 'tenancy',
      action: 'custom_domain.removed',
      actor_id,
      actor_role: 'owner',
      payload: { domain: normalised, vercel_ok: vercel.ok },
    });
  } catch { /* noop */ }

  return { ok: true };
}

async function pollDomainStatus(client, domain, deps = {}) {
  const normalised = normaliseDomain(domain);
  const status = await (deps.getDomainStatus || getDomainStatus)({
    token: process.env.VERCEL_TOKEN || '',
    projectId: process.env.VERCEL_PROJECT_ID || '',
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    domain: normalised,
  });

  if (!status.ok) return { status: 'verifying', verified_at: null, ssl_issued_at: null };

  const verified = !!status.verified;
  const patch = {
    status: verified ? 'verified' : 'verifying',
    last_verification_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    verified_at: verified ? new Date().toISOString() : null,
    ssl_issued_at: status.ssl_issued_at || null,
    cname_target: status.cname_target || null,
  };
  await client.from('markos_custom_domains').update(patch).eq('domain', normalised);
  return { status: patch.status, verified_at: patch.verified_at, ssl_issued_at: patch.ssl_issued_at };
}

async function listDomainsForOrg(client, org_id) {
  const { data } = await client
    .from('markos_custom_domains')
    .select('domain, status, verified_at, vanity_login_enabled')
    .eq('org_id', org_id)
    .is('removed_at', null)
    .order('created_at', { ascending: false });
  return data || [];
}

module.exports = { addCustomDomain, removeCustomDomain, pollDomainStatus, listDomainsForOrg, normaliseDomain };
