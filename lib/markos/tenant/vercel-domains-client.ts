// Phase 201 D-12: TypeScript dual-export.
const vcCjs = require('./vercel-domains-client.cjs') as {
  VERCEL_DOMAINS_BASE: string;
  addDomain: (input: { token: string; projectId: string; teamId?: string; domain: string }, options?: unknown) => Promise<unknown>;
  removeDomain: (input: { token: string; projectId: string; teamId?: string; domain: string }, options?: unknown) => Promise<unknown>;
  getDomainStatus: (input: { token: string; projectId: string; teamId?: string; domain: string }, options?: unknown) => Promise<unknown>;
};
export const VERCEL_DOMAINS_BASE = vcCjs.VERCEL_DOMAINS_BASE;
export const addDomain = vcCjs.addDomain;
export const removeDomain = vcCjs.removeDomain;
export const getDomainStatus = vcCjs.getDomainStatus;
