'use strict';

// Phase 201 D-04 + Pitfall 2 mitigation.
// First-party *.markos.dev: cookie Domain=.markos.dev so a single session works across subdomains.
// BYOD custom domain: cookie scoped to same origin only — NOT sharing with *.markos.dev.
// SameSite=Lax blocks cross-origin POSTs (Pitfall 2).

const MARKOS_COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure:   true,
  sameSite: 'lax',
  path:     '/',
});

function chooseCookieDomain(input) {
  if (!input || typeof input.host !== 'string' || typeof input.apex !== 'string') return null;
  const host = input.host.toLowerCase();
  const apex = input.apex.toLowerCase();

  if (host === apex) return `.${apex}`;
  if (host.endsWith(`.${apex}`)) return `.${apex}`;
  return null; // BYOD — same-origin
}

module.exports = { MARKOS_COOKIE_OPTIONS, chooseCookieDomain };
