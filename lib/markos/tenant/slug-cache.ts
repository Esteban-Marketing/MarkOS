// Phase 201 Plan 08 Task 3: TypeScript dual-export for @vercel/edge-config slug cache.
// Phase 201.1 D-104: extended with jittered TTL + transitional-rename + single-flight exports.
// The runtime lives in slug-cache.cjs so node:test + edge runtime both work.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sc = require('./slug-cache.cjs');

export const SLUG_CACHE_TTL_SECONDS: number = sc.SLUG_CACHE_TTL_SECONDS;
export const SLUG_CACHE_NAMESPACE: string = sc.SLUG_CACHE_NAMESPACE;
export const SLUG_CACHE_TTL_BASE_SECONDS: number = sc.SLUG_CACHE_TTL_BASE_SECONDS;
export const SLUG_CACHE_TTL_JITTER_SECONDS: number = sc.SLUG_CACHE_TTL_JITTER_SECONDS;
export const TRANSITIONAL_RENAME_TTL_SECONDS: number = sc.TRANSITIONAL_RENAME_TTL_SECONDS;
export const TRANSITIONAL_PREFIX: string = sc.TRANSITIONAL_PREFIX;

export type SlugCacheDeps = {
  edgeConfigGet?: (key: string) => Promise<string | null | undefined>;
  VERCEL_API_TOKEN?: string;
  EDGE_CONFIG_ID?: string;
  fetch?: typeof fetch;
};

export const readSlugFromEdge: (slug: string, deps?: SlugCacheDeps) => Promise<string | null> = sc.readSlugFromEdge;
export const writeSlugToEdge: (slug: string, tenantId: string, deps?: SlugCacheDeps) => Promise<void> = sc.writeSlugToEdge;
export const invalidateSlug: (slug: string, deps?: SlugCacheDeps) => Promise<void> = sc.invalidateSlug;
export const computeJitteredTtl: () => number = sc.computeJitteredTtl;
export const writeSlugToEdgeJittered: (slug: string, tenantId: string, deps?: SlugCacheDeps) => Promise<void> = sc.writeSlugToEdgeJittered;
export const writeTransitionalRename: (oldSlug: string, newSlug: string, deps?: SlugCacheDeps) => Promise<void> = sc.writeTransitionalRename;
