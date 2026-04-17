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
