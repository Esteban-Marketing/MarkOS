'use strict';

// Phase 201 D-11: locked reserved-slug blocklist.
// Source of truth — imported by signup API (Plan 03), middleware (Plan 05),
// and tenant switcher slug input (Plan 07).

const SYSTEM_NAMES = [
  'www', 'api', 'app', 'admin', 'mcp', 'sdk', 'mail', 'status',
  'docs', 'blog', 'help', 'support', 'security', 'about', 'pricing', 'integrations',
];

const PROTECTED_ROUTES = [
  'root', 'system', 'signup', 'signin', 'login', 'logout', 'register',
  'settings', 'billing', 'dashboard', 'invite', 'onboarding', 'auth', 'static',
];

// Trademark / vendor names — typo-squat + phishing risk from the Claude Marketplace listing (phase 200-08).
const TRADEMARK_VENDORS = [
  'claude', 'openai', 'anthropic', 'supabase', 'vercel', 'stripe',
  'hubspot', 'shopify', 'slack', 'google', 'meta', 'segment',
  'resend', 'twilio', 'posthog', 'linear',
];

// Single-character slugs — all reserved to prevent squatting.
const SINGLE_CHAR = [
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  '0','1','2','3','4','5','6','7','8','9',
];

// Profanity baseline. EN only. Extension via future phase / community review.
const PROFANITY = [
  'fuck', 'shit', 'cunt', 'bitch', 'nigger', 'faggot',
];

const RESERVED_SLUGS = new Set([
  ...SYSTEM_NAMES,
  ...PROTECTED_ROUTES,
  ...TRADEMARK_VENDORS,
  ...SINGLE_CHAR,
  ...PROFANITY,
]);

function isReservedSlug(slug) {
  if (typeof slug !== 'string') return true; // fail-closed: non-strings treated as reserved
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

module.exports = { isReservedSlug, RESERVED_SLUGS };

// ============================================================================
// Phase 201.1 D-109 (closes M6): DB-backed cache loader + obscenity dataset.
// isReservedSlug (above) retains its UNCHANGED sync signature for middleware
// hot-path callers that must avoid any DB round-trip.
// isReservedSlugAsync is the live DB-backed + profanity-checked path for
// signup and tenant-switcher flows where a ms of latency is acceptable.
// ============================================================================

const RESERVED_SLUG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cache = { slugs: null, expires_at: 0 };
let _profanity = null;

async function loadReservedSlugsFromDb(client) {
  if (_cache.slugs && Date.now() < _cache.expires_at) {
    return _cache.slugs;
  }
  if (!client || typeof client.from !== 'function') {
    return new Set([...RESERVED_SLUGS]);
  }
  try {
    const { data, error } = await client
      .from('markos_reserved_slugs')
      .select('slug');
    if (error) throw new Error(error.message);
    const set = new Set((data || []).map((r) => r.slug));
    // Always include the baked-in seed as a floor — defends against a partial migration state.
    for (const s of RESERVED_SLUGS) set.add(s);
    _cache = { slugs: set, expires_at: Date.now() + RESERVED_SLUG_CACHE_TTL_MS };
    return set;
  } catch {
    return new Set([...RESERVED_SLUGS]); // fail-closed: treat unknown as the safe baseline
  }
}

function clearReservedSlugCache() {
  _cache = { slugs: null, expires_at: 0 };
}

function getDefaultProfanitySet() {
  if (_profanity) return _profanity;
  // Phase 201.1 D-109 (closes M6).
  // try { require('obscenity') } catch { require('bad-words') }  ← contract literal
  // The fallback was previously a runtime try/catch around require('bad-words'),
  // but Next.js webpack/turbopack performs static analysis on require() calls and
  // fails to compile when 'bad-words' is not installed (even though the require
  // is wrapped in try/catch). Since obscenity is the canonical primary AND the
  // only package listed in dependencies, the fallback path is now noop on
  // obscenity load failure with a clear operator warning. Restore bad-words as
  // a runtime fallback only by adding it to package.json AND wrapping the
  // require in a dynamic-import path that webpack cannot statically resolve.
  try {
    const obs = require('obscenity');
    // obscenity 0.4.x API: RegExpMatcher constructor with englishDataset.build() +
    // englishRecommendedTransformers (handles leet-speak, confusables, case-folding).
    const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = obs;
    if (typeof RegExpMatcher !== 'function' || !englishDataset || !englishRecommendedTransformers) {
      throw new Error('obscenity surface unrecognized');
    }
    const matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
    _profanity = {
      kind: 'obscenity',
      match: (slug) => {
        try { return matcher.hasMatch(String(slug || '')); } catch { return false; }
      },
    };
    return _profanity;
  } catch {
    console.warn('[reserved-slugs] obscenity package failed to load; profanity check disabled — verify dependency in package.json');
    _profanity = { kind: 'noop', match: () => false };
    return _profanity;
  }
}

async function isReservedSlugAsync(slug, client) {
  if (typeof slug !== 'string') return true; // fail-closed
  const norm = slug.trim().toLowerCase();
  if (RESERVED_SLUGS.has(norm)) return true; // sync floor — no DB round-trip needed
  const dbSet = await loadReservedSlugsFromDb(client);
  if (dbSet.has(norm)) return true;
  const prof = getDefaultProfanitySet();
  // Pass the original (not lowercased) slug to the profanity matcher — it handles
  // case-folding internally via englishRecommendedTransformers (toAsciiLowerCase).
  if (prof.match(slug.trim())) return true;
  return false;
}

module.exports.loadReservedSlugsFromDb = loadReservedSlugsFromDb;
module.exports.clearReservedSlugCache = clearReservedSlugCache;
module.exports.getDefaultProfanitySet = getDefaultProfanitySet;
module.exports.isReservedSlugAsync = isReservedSlugAsync;
module.exports.RESERVED_SLUG_CACHE_TTL_MS = RESERVED_SLUG_CACHE_TTL_MS;
