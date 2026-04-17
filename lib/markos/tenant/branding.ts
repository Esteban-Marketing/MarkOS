// Phase 201 D-12: TypeScript dual-export.
const bCjs = require('./branding.cjs');
export const DEFAULT_BRANDING = bCjs.DEFAULT_BRANDING;
export const getTenantBranding = bCjs.getTenantBranding;
export const upsertTenantBranding = bCjs.upsertTenantBranding;
