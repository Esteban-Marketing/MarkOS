// Phase 201 D-06: TypeScript dual-export.
const provCjs = require('./provisioner.cjs') as {
  provisionOrgAndTenantOnVerify: (client: unknown, input: { user_id: string; email: string }) => Promise<{ org_id: string; tenant_id: string; slug: string }>;
  slugFromEmail: (email: string, existingSlugs?: Set<string>) => string;
  baseSlug: (email: string) => string;
};
export const provisionOrgAndTenantOnVerify = provCjs.provisionOrgAndTenantOnVerify;
export const slugFromEmail = provCjs.slugFromEmail;
export const baseSlug = provCjs.baseSlug;
