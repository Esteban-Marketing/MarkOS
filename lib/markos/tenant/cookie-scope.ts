// Phase 201 D-04 / Pitfall 2: TypeScript dual-export.
const csCjs = require('./cookie-scope.cjs') as {
  MARKOS_COOKIE_OPTIONS: { httpOnly: boolean; secure: boolean; sameSite: string; path: string };
  chooseCookieDomain: (input: { host: string; apex: string }) => string | null;
};

export const MARKOS_COOKIE_OPTIONS = csCjs.MARKOS_COOKIE_OPTIONS;
export const chooseCookieDomain = csCjs.chooseCookieDomain;
