'use strict';
// Phase 202 Plan 04: Dual-export re-export stub.
const dl = require('./injection-denylist.cjs');

export const PATTERNS: readonly RegExp[] = dl.PATTERNS;
export const checkInjectionDenylist = dl.checkInjectionDenylist as (
  args: unknown
) => { key: string; pattern: string } | null;
