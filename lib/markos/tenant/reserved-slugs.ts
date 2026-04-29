// Phase 201 D-11: TypeScript dual-export of reserved-slug blocklist.
// SOURCE OF TRUTH is reserved-slugs.cjs — this file must not duplicate the list.
// Phase 201.1 D-109: extended with async DB-backed surface (closes M6).

export interface SupabaseClient {
  from: (table: string) => unknown;
  rpc?: (fn: string, args?: Record<string, unknown>) => unknown;
}

export interface ProfanityMatcher {
  kind: 'obscenity' | 'bad-words' | 'noop';
  match: (slug: string) => boolean;
}

const slugsCjs = require('./reserved-slugs.cjs') as {
  isReservedSlug: (slug: string) => boolean;
  RESERVED_SLUGS: Set<string>;
  isReservedSlugAsync: (slug: string, client: SupabaseClient) => Promise<boolean>;
  loadReservedSlugsFromDb: (client: SupabaseClient) => Promise<Set<string>>;
  clearReservedSlugCache: () => void;
  getDefaultProfanitySet: () => ProfanityMatcher;
  RESERVED_SLUG_CACHE_TTL_MS: number;
};

export const isReservedSlug: (slug: string) => boolean = slugsCjs.isReservedSlug;
export const RESERVED_SLUGS: Set<string> = slugsCjs.RESERVED_SLUGS;
export const isReservedSlugAsync: (slug: string, client: SupabaseClient) => Promise<boolean> = slugsCjs.isReservedSlugAsync;
export const loadReservedSlugsFromDb: (client: SupabaseClient) => Promise<Set<string>> = slugsCjs.loadReservedSlugsFromDb;
export const clearReservedSlugCache: () => void = slugsCjs.clearReservedSlugCache;
export const getDefaultProfanitySet: () => ProfanityMatcher = slugsCjs.getDefaultProfanitySet;
export const RESERVED_SLUG_CACHE_TTL_MS: number = slugsCjs.RESERVED_SLUG_CACHE_TTL_MS;
