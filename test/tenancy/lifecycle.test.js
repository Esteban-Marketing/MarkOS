'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { initiateOffboarding, cancelOffboarding, isTenantOffboarding, OFFBOARDING_GRACE_DAYS } = require('../../lib/markos/tenant/lifecycle.cjs');

function mockLifecycleClient({ role = 'owner', status = 'active' } = {}) {
  const s = { tenantStatus: status, runs: [], updates: [], audit: [] };
  return {
    state: s,
    from: (table) => ({
      select: () => ({
        eq: (col, val) => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'markos_tenant_memberships') return { data: { iam_role: role }, error: null };
              return { data: null, error: null };
            },
          }),
          maybeSingle: async () => {
            if (table === 'markos_tenants') return { data: { org_id: 'o1', status: s.tenantStatus }, error: null };
            return { data: null, error: null };
          },
          is: () => ({
            is: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: s.runs[0] || null, error: null }),
                }),
              }),
            }),
          }),
        }),
      }),
      update: (patch) => {
        const record = () => {
          s.updates.push({ table, patch });
          if (table === 'markos_tenants' && patch.status) s.tenantStatus = patch.status;
        };
        const chain = {
          eq: () => chain,
          is: () => chain,
          then: (resolve) => { record(); resolve({ error: null }); },
        };
        return chain;
      },
      insert: async (row) => {
        if (table === 'markos_tenant_offboarding_runs') s.runs.push(row);
        if (table === 'markos_audit_log_staging') s.audit.push(row);
        return { error: null };
      },
    }),
  };
}

test('Suite 201-07: OFFBOARDING_GRACE_DAYS is 30', () => {
  assert.equal(OFFBOARDING_GRACE_DAYS, 30);
});

test('Suite 201-07: initiateOffboarding requires owner/tenant-admin', async () => {
  const c = mockLifecycleClient({ role: 'contributor' });
  await assert.rejects(
    () => initiateOffboarding(c, { tenant_id: 't1', actor_id: 'u1' }),
    /forbidden/,
  );
});

test('Suite 201-07: initiateOffboarding flips status + inserts run + emits audit', async () => {
  const c = mockLifecycleClient({ role: 'owner' });
  const r = await initiateOffboarding(c, { tenant_id: 't1', actor_id: 'u1' });
  assert.ok(r.purge_due_at);
  assert.ok(c.state.updates.some(u => u.table === 'markos_tenants' && u.patch.status === 'offboarding'));
  assert.equal(c.state.runs.length, 1);
  assert.ok(c.state.audit.some(a => a.action === 'tenant.offboarding_initiated'));
});

test('Suite 201-07: initiateOffboarding rejects when already offboarding', async () => {
  const c = mockLifecycleClient({ role: 'owner', status: 'offboarding' });
  await assert.rejects(
    () => initiateOffboarding(c, { tenant_id: 't1', actor_id: 'u1' }),
    /already_offboarding/,
  );
});

test('Suite 201-07: cancelOffboarding flips back to active', async () => {
  const c = mockLifecycleClient({ role: 'owner', status: 'offboarding' });
  const r = await cancelOffboarding(c, { tenant_id: 't1', actor_id: 'u1' });
  assert.equal(r.status, 'active');
  assert.ok(c.state.audit.some(a => a.action === 'tenant.offboarding_cancelled'));
});

test('Suite 201-07: isTenantOffboarding returns days_remaining', async () => {
  const c = mockLifecycleClient({ role: 'owner', status: 'offboarding' });
  c.state.runs.push({ purge_due_at: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString() });
  const r = await isTenantOffboarding(c, 't1');
  assert.equal(r.offboarding, true);
  assert.ok(r.days_remaining >= 14 && r.days_remaining <= 16);
});


test('Suite 201-07: F-86 contract documents offboard + cancel-offboard + purge-cron', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const y = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'F-86-tenant-lifecycle-v1.yaml'), 'utf8');
  assert.match(y, /\/api\/tenant\/lifecycle\/offboard/);
  assert.match(y, /\/api\/tenant\/lifecycle\/cancel-offboard/);
  assert.match(y, /\/api\/tenant\/lifecycle\/purge-cron/);
});


test('Suite 201-07: Surface 6 danger page exists with UI-SPEC copy + modal WCAG hook', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'danger', 'page.tsx'), 'utf8');
  // UI-SPEC v213.3-05 canonical copy (DZ-2/DZ-3): "Delete workspace", confirm-by-typing, aria-labelledby
  assert.match(src, /Delete workspace/);
  assert.match(src, /Delete workspace permanently/);
  assert.match(src, /Type the workspace name to confirm/);
  assert.match(src, /aria-labelledby/);
});
