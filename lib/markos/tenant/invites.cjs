'use strict';

const { randomBytes, randomUUID } = require('node:crypto');
const { countOrgActiveMembers, addOrgMember } = require('../orgs/api.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

const TENANT_ROLES = ['owner','tenant-admin','manager','contributor','reviewer','billing-admin','readonly'];
const INVITE_EXPIRY_MS = 7 * 24 * 3600 * 1000;

async function countPendingInvitesForOrg(client, org_id) {
  const { data } = await client
    .from('markos_invites')
    .select('token, markos_tenants!inner(org_id)')
    .eq('markos_tenants.org_id', org_id)
    .is('accepted_at', null)
    .is('withdrawn_at', null);
  return Array.isArray(data) ? data.length : 0;
}

async function getOrgSeatQuota(client, org_id) {
  const { data } = await client.from('markos_orgs').select('seat_quota').eq('id', org_id).maybeSingle();
  return data ? Number(data.seat_quota) : 0;
}

async function createInvite(client, input) {
  const { org_id, tenant_id, email, tenant_role, invited_by } = input || {};
  if (!org_id || !tenant_id || !email || !invited_by) throw new Error('createInvite: missing required field');
  if (!TENANT_ROLES.includes(tenant_role)) throw new Error(`createInvite: invalid tenant_role "${tenant_role}"`);

  const quota = await getOrgSeatQuota(client, org_id);
  const [active, pending] = await Promise.all([
    countOrgActiveMembers(client, org_id),
    countPendingInvitesForOrg(client, org_id),
  ]);
  if (active + pending >= quota) {
    const err = new Error('seat_quota_reached');
    err.code = 'seat_quota_reached';
    throw err;
  }

  const token = randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + INVITE_EXPIRY_MS).toISOString();

  const { error } = await client.from('markos_invites').insert({
    token, org_id, tenant_id, email: email.trim().toLowerCase(), tenant_role, invited_by, expires_at,
  });
  if (error) throw new Error(`createInvite: insert failed: ${error.message}`);

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id, source_domain: 'tenancy', action: 'invite.created',
      actor_id: invited_by, actor_role: 'owner',
      payload: { email: email.trim().toLowerCase(), tenant_role, token_prefix: token.slice(0, 8) },
    });
  } catch { /* noop */ }

  return { token, expires_at };
}

async function acceptInvite(client, input) {
  const { token, accepting_user_id, accepting_email } = input || {};
  if (!token || !accepting_user_id || !accepting_email) throw new Error('acceptInvite: token + user_id + email required');

  const { data: invite, error } = await client
    .from('markos_invites')
    .select('token, org_id, tenant_id, tenant_role, email, invited_by, expires_at, accepted_at, withdrawn_at')
    .eq('token', token)
    .maybeSingle();
  if (error) throw new Error(`acceptInvite: select failed: ${error.message}`);
  if (!invite) throw new Error('invite_not_found');
  if (invite.accepted_at) throw new Error('invite_already_accepted');
  if (invite.withdrawn_at) throw new Error('invite_withdrawn');
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error('invite_expired');
  if (invite.email.toLowerCase() !== accepting_email.trim().toLowerCase()) throw new Error('invite_email_mismatch');

  const quota = await getOrgSeatQuota(client, invite.org_id);
  const active = await countOrgActiveMembers(client, invite.org_id);
  if (active >= quota) {
    const err = new Error('seat_quota_reached');
    err.code = 'seat_quota_reached';
    throw err;
  }

  const { data: existingOrgMembership } = await client
    .from('markos_org_memberships')
    .select('id')
    .eq('org_id', invite.org_id)
    .eq('user_id', accepting_user_id)
    .maybeSingle();
  if (!existingOrgMembership) {
    await addOrgMember(client, { org_id: invite.org_id, user_id: accepting_user_id, org_role: 'readonly' });
  }

  await client.from('markos_tenant_memberships').insert({
    id: `tm-${randomUUID()}`,
    user_id: accepting_user_id,
    tenant_id: invite.tenant_id,
    iam_role: invite.tenant_role,
  });

  await client.from('markos_invites')
    .update({ accepted_at: new Date().toISOString(), accepted_by_user_id: accepting_user_id })
    .eq('token', token);

  try {
    await enqueueAuditStaging(client, {
      tenant_id: invite.tenant_id, org_id: invite.org_id, source_domain: 'tenancy',
      action: 'invite.accepted',
      actor_id: accepting_user_id, actor_role: invite.tenant_role,
      payload: { token_prefix: token.slice(0, 8), email: invite.email, tenant_role: invite.tenant_role },
    });
  } catch { /* noop */ }

  return { org_id: invite.org_id, tenant_id: invite.tenant_id, tenant_role: invite.tenant_role };
}

async function withdrawInvite(client, input) {
  const { token, actor_id } = input || {};
  if (!token || !actor_id) throw new Error('withdrawInvite: token + actor_id required');
  const { data } = await client
    .from('markos_invites')
    .update({ withdrawn_at: new Date().toISOString() })
    .eq('token', token)
    .is('accepted_at', null)
    .is('withdrawn_at', null)
    .select('tenant_id, org_id, email');
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return;
  try {
    await enqueueAuditStaging(client, {
      tenant_id: row.tenant_id, org_id: row.org_id, source_domain: 'tenancy',
      action: 'invite.withdrawn',
      actor_id, actor_role: 'owner',
      payload: { token_prefix: token.slice(0, 8), email: row.email },
    });
  } catch { /* noop */ }
}

async function resendInvite(client, input) {
  const { token, actor_id } = input || {};
  const expires_at = new Date(Date.now() + INVITE_EXPIRY_MS).toISOString();
  const { data } = await client
    .from('markos_invites')
    .update({ expires_at })
    .eq('token', token)
    .is('accepted_at', null)
    .is('withdrawn_at', null)
    .select('tenant_id, org_id, email');
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  try {
    await enqueueAuditStaging(client, {
      tenant_id: row.tenant_id, org_id: row.org_id, source_domain: 'tenancy',
      action: 'invite.resent',
      actor_id, actor_role: 'owner',
      payload: { token_prefix: token.slice(0, 8), email: row.email, expires_at },
    });
  } catch { /* noop */ }
  return { token, expires_at };
}

async function listPendingInvites(client, tenant_id) {
  const { data } = await client
    .from('markos_invites')
    .select('token, email, tenant_role, invited_by, created_at, expires_at')
    .eq('tenant_id', tenant_id)
    .is('accepted_at', null)
    .is('withdrawn_at', null)
    .order('created_at', { ascending: false });
  return data || [];
}

module.exports = { TENANT_ROLES, INVITE_EXPIRY_MS, createInvite, acceptInvite, withdrawInvite, resendInvite, listPendingInvites };
