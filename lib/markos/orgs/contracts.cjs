'use strict';

// Phase 201 D-05 / D-06 / D-07 / D-14: canonical org contracts.
// The .ts mirror re-exports from this file to eliminate twin-export drift.

const ORG_ROLES = Object.freeze(['owner', 'billing-admin', 'member', 'readonly']);
const TENANT_STATUSES = Object.freeze(['active', 'suspended', 'offboarding', 'purged']);
const DEFAULT_SEAT_QUOTA = 5;

function isValidOrgRole(role) {
  return typeof role === 'string' && ORG_ROLES.includes(role);
}

function isValidTenantStatus(status) {
  return typeof status === 'string' && TENANT_STATUSES.includes(status);
}

module.exports = {
  ORG_ROLES,
  TENANT_STATUSES,
  DEFAULT_SEAT_QUOTA,
  isValidOrgRole,
  isValidTenantStatus,
};
