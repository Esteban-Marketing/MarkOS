'use strict';

const { enqueueAuditStaging } = require('../audit/writer.cjs');

const OFFBOARDING_GRACE_DAYS = 30;
const OFFBOARDING_GRACE_MS = OFFBOARDING_GRACE_DAYS * 24 * 3600 * 1000;

async function assertOwnerOrAdmin(client, tenant_id, actor_id) {
  const { data } = await client
    .from('markos_tenant_memberships')
    .select('iam_role')
    .eq('tenant_id', tenant_id)
    .eq('user_id', actor_id)
    .maybeSingle();
  if (!data || !['owner', 'tenant-admin'].includes(data.iam_role)) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }
}

async function initiateOffboarding(client, input) {
  const { tenant_id, actor_id } = input || {};
  if (!tenant_id || !actor_id) throw new Error('initiateOffboarding: tenant_id + actor_id required');

  await assertOwnerOrAdmin(client, tenant_id, actor_id);

  const purge_due_at = new Date(Date.now() + OFFBOARDING_GRACE_MS).toISOString();
  const now = new Date().toISOString();

  const { data: tenant } = await client
    .from('markos_tenants')
    .select('org_id, status')
    .eq('id', tenant_id)
    .maybeSingle();
  if (!tenant) throw new Error('tenant_not_found');
  if (tenant.status === 'offboarding' || tenant.status === 'purged') {
    const err = new Error('already_offboarding');
    err.code = 'already_offboarding';
    throw err;
  }

  await client.from('markos_tenants')
    .update({ status: 'offboarding', updated_at: now })
    .eq('id', tenant_id);

  await client.from('markos_tenant_offboarding_runs').insert({
    tenant_id,
    offboarding_initiated_at: now,
    purge_due_at,
    actor_id,
  });

  try {
    await client.from('markos_orgs').update({ offboarding_initiated_at: now }).eq('id', tenant.org_id);
  } catch { /* noop — column exists from Plan 01 */ }

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id: tenant.org_id, source_domain: 'tenancy',
      action: 'tenant.offboarding_initiated',
      actor_id, actor_role: 'owner',
      payload: { purge_due_at },
    });
  } catch { /* noop */ }

  return { purge_due_at };
}

async function cancelOffboarding(client, input) {
  const { tenant_id, actor_id } = input || {};
  if (!tenant_id || !actor_id) throw new Error('cancelOffboarding: tenant_id + actor_id required');

  await assertOwnerOrAdmin(client, tenant_id, actor_id);

  const { data: tenant } = await client
    .from('markos_tenants')
    .select('org_id, status')
    .eq('id', tenant_id)
    .maybeSingle();
  if (!tenant) throw new Error('tenant_not_found');
  if (tenant.status !== 'offboarding') {
    const err = new Error('not_offboarding');
    err.code = 'not_offboarding';
    throw err;
  }

  await client.from('markos_tenants')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', tenant_id);

  await client.from('markos_tenant_offboarding_runs')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('tenant_id', tenant_id)
    .is('purge_ran_at', null)
    .is('cancelled_at', null);

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id: tenant.org_id, source_domain: 'tenancy',
      action: 'tenant.offboarding_cancelled',
      actor_id, actor_role: 'owner',
      payload: {},
    });
  } catch { /* noop */ }

  return { status: 'active' };
}

async function runPurgeJob(client, options = {}) {
  const deps = options.deps || {};
  const now = options.now || new Date();
  const processed = [];
  const errors = [];

  const { data: tenants, error } = await client
    .from('markos_tenants')
    .select('id, org_id')
    .eq('status', 'offboarding')
    .limit(50);
  if (error) return { processed: 0, purged: [], errors: [{ stage: 'select', error: error.message }] };

  for (const t of tenants || []) {
    try {
      const { data: run } = await client
        .from('markos_tenant_offboarding_runs')
        .select('purge_due_at')
        .eq('tenant_id', t.id)
        .is('purge_ran_at', null)
        .is('cancelled_at', null)
        .order('offboarding_initiated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!run) continue;
      if (new Date(run.purge_due_at).getTime() > now.getTime()) continue;

      const { generateExportBundle } = require('./gdpr-export.cjs');
      const bundle = await generateExportBundle(client, {
        tenant_id: t.id,
        bucket: process.env.MARKOS_GDPR_BUCKET || 'markos-gdpr',
        s3Client: deps.s3Client,
        streamArchiver: deps.streamArchiver,
      });

      await client
        .from('markos_tenant_offboarding_runs')
        .update({ purge_ran_at: now.toISOString(), export_bundle_id: bundle.export_id })
        .eq('tenant_id', t.id)
        .is('purge_ran_at', null);

      await client.from('markos_tenants').update({ status: 'purged', updated_at: now.toISOString() }).eq('id', t.id);

      try {
        await enqueueAuditStaging(client, {
          tenant_id: t.id, org_id: t.org_id, source_domain: 'tenancy',
          action: 'tenant.purged',
          actor_id: 'system', actor_role: 'system',
          payload: { export_id: bundle.export_id, signed_url_expires_at: bundle.expires_at },
        });
      } catch { /* noop */ }

      processed.push({ tenant_id: t.id, export_id: bundle.export_id });
    } catch (e) {
      errors.push({ tenant_id: t.id, error: e && e.message ? e.message : String(e) });
    }
  }

  return { processed: processed.length, purged: processed, errors };
}

async function isTenantOffboarding(client, tenant_id) {
  const { data: tenant } = await client
    .from('markos_tenants').select('status').eq('id', tenant_id).maybeSingle();
  if (!tenant || tenant.status !== 'offboarding') return { offboarding: false, days_remaining: null, purge_due_at: null };

  const { data: run } = await client
    .from('markos_tenant_offboarding_runs')
    .select('purge_due_at')
    .eq('tenant_id', tenant_id)
    .is('purge_ran_at', null)
    .is('cancelled_at', null)
    .order('offboarding_initiated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) return { offboarding: true, days_remaining: null, purge_due_at: null };

  const days = Math.max(0, Math.ceil((new Date(run.purge_due_at).getTime() - Date.now()) / (24 * 3600 * 1000)));
  return { offboarding: true, days_remaining: days, purge_due_at: run.purge_due_at };
}

module.exports = { OFFBOARDING_GRACE_DAYS, OFFBOARDING_GRACE_MS, initiateOffboarding, cancelOffboarding, runPurgeJob, isTenantOffboarding };
