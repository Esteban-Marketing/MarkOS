'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TENANT_ROLES, INVITE_EXPIRY_MS, createInvite, acceptInvite } = require('../../lib/markos/tenant/invites.cjs');

function mockClient(state = {}) {
  const s = {
    invites: [], org: { id: 'o1', seat_quota: state.seat_quota ?? 5 },
    activeMembers: state.activeMembers ?? 0,
    pendingInvites: state.pendingInvites ?? [],
    orgMemberships: state.orgMemberships ?? [],
    tenantMemberships: [],
    audit: [],
  };
  return {
    state: s,
    rpc: async (fn) => {
      if (fn === 'count_org_active_members') return { data: s.activeMembers, error: null };
      return { data: null, error: null };
    },
    from: (table) => ({
      select: () => ({
        eq: (col, val) => ({
          eq: (c2, v2) => ({
            maybeSingle: async () => {
              if (table === 'markos_org_memberships' && col === 'org_id' && c2 === 'user_id') {
                const row = s.orgMemberships.find(m => m.org_id === val && m.user_id === v2);
                return { data: row || null, error: null };
              }
              return { data: null, error: null };
            },
          }),
          is: () => ({ is: () => Promise.resolve({ data: s.pendingInvites.filter(i => i.org_id === val), error: null }) }),
          maybeSingle: async () => {
            if (table === 'markos_orgs') return { data: s.org, error: null };
            if (table === 'markos_invites') return { data: s.invites.find(i => i.token === val) || null, error: null };
            return { data: null, error: null };
          },
          order: () => Promise.resolve({ data: s.invites.filter(i => i.tenant_id === val), error: null }),
        }),
      }),
      insert: (row) => {
        if (table === 'markos_invites') s.invites.push(row);
        if (table === 'markos_audit_log_staging') s.audit.push(row);
        if (table === 'markos_org_memberships') s.orgMemberships.push(row);
        if (table === 'markos_tenant_memberships') s.tenantMemberships.push(row);
        return {
          select: () => ({
            single: async () => ({ data: { id: row.id || 'mock-id' }, error: null }),
          }),
          then: (resolve) => resolve({ error: null }),
        };
      },
      update: (patch) => ({
        eq: () => ({
          is: () => ({
            is: () => ({
              select: async () => {
                const match = s.invites[0] || null;
                if (match) Object.assign(match, patch);
                return { data: match ? [match] : [], error: null };
              },
            }),
          }),
          select: async () => {
            if (table === 'markos_invites') {
              for (const inv of s.invites) Object.assign(inv, patch);
              return { data: s.invites, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };
}

test('Suite 201-07: TENANT_ROLES locked 7-role list matches migration 51 enum', () => {
  assert.deepEqual(TENANT_ROLES, ['owner','tenant-admin','manager','contributor','reviewer','billing-admin','readonly']);
});

test('Suite 201-07: INVITE_EXPIRY_MS is 7 days', () => {
  assert.equal(INVITE_EXPIRY_MS, 7 * 24 * 3600 * 1000);
});

test('Suite 201-07: createInvite rejects invalid tenant_role', async () => {
  const c = mockClient();
  await assert.rejects(
    () => createInvite(c, { org_id: 'o1', tenant_id: 't1', email: 'b@c.com', tenant_role: 'banana', invited_by: 'u1' }),
    /invalid tenant_role/,
  );
});

test('Suite 201-07: createInvite rejects at seat quota', async () => {
  const c = mockClient({ seat_quota: 2, activeMembers: 2, pendingInvites: [] });
  await assert.rejects(
    () => createInvite(c, { org_id: 'o1', tenant_id: 't1', email: 'b@c.com', tenant_role: 'contributor', invited_by: 'u1' }),
    /seat_quota_reached/,
  );
});

test('Suite 201-07: createInvite generates 64-char hex token + emits audit', async () => {
  const c = mockClient({ seat_quota: 5, activeMembers: 1, pendingInvites: [] });
  const r = await createInvite(c, { org_id: 'o1', tenant_id: 't1', email: 'bob@c.com', tenant_role: 'contributor', invited_by: 'u1' });
  assert.equal(typeof r.token, 'string');
  assert.equal(r.token.length, 64);
  assert.equal(c.state.audit.length, 1);
  assert.equal(c.state.audit[0].action, 'invite.created');
  assert.equal(c.state.audit[0].source_domain, 'tenancy');
});

test('Suite 201-07: acceptInvite rejects expired', async () => {
  const c = mockClient({ seat_quota: 5, activeMembers: 0 });
  c.state.invites.push({
    token: 't-old', org_id: 'o1', tenant_id: 't1', tenant_role: 'contributor',
    email: 'b@c.com', invited_by: 'u1',
    expires_at: new Date(Date.now() - 1000).toISOString(), accepted_at: null, withdrawn_at: null,
  });
  await assert.rejects(
    () => acceptInvite(c, { token: 't-old', accepting_user_id: 'u2', accepting_email: 'b@c.com' }),
    /invite_expired/,
  );
});

test('Suite 201-07: acceptInvite rejects email mismatch', async () => {
  const c = mockClient({ seat_quota: 5 });
  c.state.invites.push({
    token: 't1', org_id: 'o1', tenant_id: 't1', tenant_role: 'contributor',
    email: 'bob@c.com', invited_by: 'u1',
    expires_at: new Date(Date.now() + 60_000).toISOString(), accepted_at: null, withdrawn_at: null,
  });
  await assert.rejects(
    () => acceptInvite(c, { token: 't1', accepting_user_id: 'u2', accepting_email: 'alice@c.com' }),
    /invite_email_mismatch/,
  );
});

test('Suite 201-07: acceptInvite auto-adds org readonly membership when user not already member (D-08)', async () => {
  const c = mockClient({ seat_quota: 5, activeMembers: 0, orgMemberships: [] });
  c.state.invites.push({
    token: 't1', org_id: 'o1', tenant_id: 't1', tenant_role: 'contributor',
    email: 'bob@c.com', invited_by: 'u1',
    expires_at: new Date(Date.now() + 60_000).toISOString(), accepted_at: null, withdrawn_at: null,
  });
  await acceptInvite(c, { token: 't1', accepting_user_id: 'u2', accepting_email: 'bob@c.com' });
  assert.equal(c.state.orgMemberships.length, 1);
  assert.equal(c.state.orgMemberships[0].org_role, 'readonly');
  assert.equal(c.state.tenantMemberships.length, 1);
  assert.equal(c.state.tenantMemberships[0].iam_role, 'contributor');
  assert.ok(c.state.audit.some(a => a.action === 'invite.accepted'));
});


test('Suite 201-07: F-85 contract documents members + invites endpoints', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const y = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'F-85-members-invites-v1.yaml'), 'utf8');
  assert.match(y, /\/api\/tenant\/members\/list/);
  assert.match(y, /\/api\/tenant\/members\/remove/);
  assert.match(y, /\/api\/tenant\/invites\/create/);
  assert.match(y, /\/api\/tenant\/invites\/accept/);
  assert.match(y, /\/api\/tenant\/invites\/withdraw/);
});


test('Suite 201-07: Surface 4 members page exists with UI-SPEC copy + focal WCAG hook', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'members', 'page.tsx'), 'utf8');
  assert.match(src, /Invite member/);
  assert.match(src, /seats used/);
  assert.match(src, /aria-labelledby/);
});
