// Phase 201 D-09 / D-10: TypeScript dual-export. SOURCE OF TRUTH is resolver.cjs.
const resolverCjs = require('./resolver.cjs') as {
  SYSTEM_SUBDOMAINS: ReadonlySet<string>;
  DEFAULT_APEX: string;
  resolveHost: (host: string, apex?: string) => HostResolution;
  resolveTenantBySlug: (client: unknown, slug: string) => Promise<{ tenant_id: string; org_id: string; status: string } | null>;
  resolveTenantByDomain: (client: unknown, domain: string, opts?: { allowGrace?: boolean }) => Promise<{ tenant_id: string; org_id: string; status: string; verified_at: string | null; withinGrace: boolean } | null>;
};

export type HostKind = 'bare' | 'first_party' | 'byod' | 'reserved' | 'system';
export interface HostResolution {
  kind: HostKind;
  host: string;
  apex: string;
  slug?: string;
  is_reserved?: boolean;
}

export const SYSTEM_SUBDOMAINS = resolverCjs.SYSTEM_SUBDOMAINS;
export const DEFAULT_APEX = resolverCjs.DEFAULT_APEX;
export const resolveHost = resolverCjs.resolveHost;
export const resolveTenantBySlug = resolverCjs.resolveTenantBySlug;
export const resolveTenantByDomain = resolverCjs.resolveTenantByDomain;
