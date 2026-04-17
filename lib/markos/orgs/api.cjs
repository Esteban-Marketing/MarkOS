'use strict';

const { randomUUID } = require('node:crypto');
const { ORG_ROLES, DEFAULT_SEAT_QUOTA, isValidOrgRole } = require('./contracts.cjs');

// Helpers take the supabase client as an argument — this module never spins one up.
// This keeps it testable and edge-runtime-neutral (middleware can require it).

async function createOrg(client, input) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('createOrg: supabase client required');
  }
  if (!input || typeof input.slug !== 'string' || typeof input.name !== 'string' || typeof input.owner_user_id !== 'string') {
    throw new Error('createOrg: slug, name, owner_user_id required');
  }

  const id = input.id || `org-${randomUUID()}`;
  const row = {
    id,
    slug: input.slug,
    name: input.name,
    owner_user_id: input.owner_user_id,
    seat_quota: input.seat_quota ?? DEFAULT_SEAT_QUOTA,
    status: 'active',
    offboarding_initiated_at: null,
  };

  const { data, error } = await client.from('markos_orgs').insert(row).select().single();
  if (error) throw new Error(`createOrg: insert failed: ${error.message}`);
  return data;
}

async function addOrgMember(client, input) {
  if (!client || typeof client.from !== 'function') throw new Error('addOrgMember: supabase client required');
  if (!input || typeof input.org_id !== 'string' || typeof input.user_id !== 'string') {
    throw new Error('addOrgMember: org_id and user_id required');
  }
  if (!isValidOrgRole(input.org_role)) {
    throw new Error(`addOrgMember: invalid org_role "${input.org_role}". Valid: ${ORG_ROLES.join(', ')}`);
  }

  const row = {
    id: `orgm-${randomUUID()}`,
    org_id: input.org_id,
    user_id: input.user_id,
    org_role: input.org_role,
  };

  const { data, error } = await client.from('markos_org_memberships').insert(row).select().single();
  if (error) throw new Error(`addOrgMember: insert failed: ${error.message}`);
  return data;
}

async function listOrgsForUser(client, user_id) {
  if (!client || typeof client.from !== 'function') throw new Error('listOrgsForUser: supabase client required');
  if (typeof user_id !== 'string') throw new Error('listOrgsForUser: user_id required');

  // Relies on the RLS policy to limit visible rows to orgs where caller has membership.
  const { data, error } = await client
    .from('markos_orgs')
    .select('*, markos_org_memberships!inner(user_id)')
    .eq('markos_org_memberships.user_id', user_id);

  if (error) throw new Error(`listOrgsForUser: select failed: ${error.message}`);
  return data || [];
}

async function countOrgActiveMembers(client, org_id) {
  if (!client || typeof client.rpc !== 'function') throw new Error('countOrgActiveMembers: supabase client required');
  if (typeof org_id !== 'string') throw new Error('countOrgActiveMembers: org_id required');

  const { data, error } = await client.rpc('count_org_active_members', { p_org_id: org_id });
  if (error) throw new Error(`countOrgActiveMembers: rpc failed: ${error.message}`);
  return typeof data === 'number' ? data : 0;
}

async function getOrgByUserId(client, user_id) {
  if (!client || typeof client.from !== 'function') throw new Error('getOrgByUserId: supabase client required');
  if (typeof user_id !== 'string') throw new Error('getOrgByUserId: user_id required');

  const { data, error } = await client
    .from('markos_orgs')
    .select('*')
    .eq('owner_user_id', user_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getOrgByUserId: select failed: ${error.message}`);
  return data || null;
}

module.exports = {
  createOrg,
  addOrgMember,
  listOrgsForUser,
  countOrgActiveMembers,
  getOrgByUserId,
};
