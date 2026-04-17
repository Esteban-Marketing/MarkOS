// Phase 201 D-11: TypeScript dual-export of reserved-slug blocklist.
// SOURCE OF TRUTH is reserved-slugs.cjs — this file must not duplicate the list.
const slugsCjs = require('./reserved-slugs.cjs') as {
  isReservedSlug: (slug: string) => boolean;
  RESERVED_SLUGS: Set<string>;
};

export const isReservedSlug: (slug: string) => boolean = slugsCjs.isReservedSlug;
export const RESERVED_SLUGS: Set<string> = slugsCjs.RESERVED_SLUGS;
