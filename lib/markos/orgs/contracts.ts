// Phase 201 D-05 / D-06 / D-07 / D-14: TypeScript types over contracts.cjs.
// SOURCE OF TRUTH is contracts.cjs — this file adds type tags only.

const contractsCjs = require('./contracts.cjs') as {
  ORG_ROLES: readonly string[];
  TENANT_STATUSES: readonly string[];
  DEFAULT_SEAT_QUOTA: number;
  isValidOrgRole: (role: unknown) => boolean;
  isValidTenantStatus: (status: unknown) => boolean;
};

export const ORG_ROLES = contractsCjs.ORG_ROLES as readonly ['owner', 'billing-admin', 'member', 'readonly'];
export const TENANT_STATUSES = contractsCjs.TENANT_STATUSES as readonly ['active', 'suspended', 'offboarding', 'purged'];
export const DEFAULT_SEAT_QUOTA = contractsCjs.DEFAULT_SEAT_QUOTA;

export type OrgRole = typeof ORG_ROLES[number];
export type TenantStatus = typeof TENANT_STATUSES[number];

export interface OrgRecord {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
  seat_quota: number;
  status: TenantStatus;
  offboarding_initiated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMembershipRecord {
  id: string;
  org_id: string;
  user_id: string;
  org_role: OrgRole;
  created_at: string;
}

export const isValidOrgRole: (role: unknown) => role is OrgRole = contractsCjs.isValidOrgRole as (role: unknown) => role is OrgRole;
export const isValidTenantStatus: (status: unknown) => status is TenantStatus = contractsCjs.isValidTenantStatus as (status: unknown) => status is TenantStatus;
