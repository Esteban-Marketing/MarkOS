// Phase 201: TypeScript types over api.cjs. SOURCE OF TRUTH is api.cjs.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrgRecord, OrgMembershipRecord, OrgRole } from './contracts';

const apiCjs = require('./api.cjs') as {
  createOrg: (client: SupabaseClient, input: { id?: string; slug: string; name: string; owner_user_id: string; seat_quota?: number }) => Promise<OrgRecord>;
  addOrgMember: (client: SupabaseClient, input: { org_id: string; user_id: string; org_role: OrgRole }) => Promise<OrgMembershipRecord>;
  listOrgsForUser: (client: SupabaseClient, user_id: string) => Promise<OrgRecord[]>;
  countOrgActiveMembers: (client: SupabaseClient, org_id: string) => Promise<number>;
  getOrgByUserId: (client: SupabaseClient, user_id: string) => Promise<OrgRecord | null>;
};

export const createOrg = apiCjs.createOrg;
export const addOrgMember = apiCjs.addOrgMember;
export const listOrgsForUser = apiCjs.listOrgsForUser;
export const countOrgActiveMembers = apiCjs.countOrgActiveMembers;
export const getOrgByUserId = apiCjs.getOrgByUserId;
