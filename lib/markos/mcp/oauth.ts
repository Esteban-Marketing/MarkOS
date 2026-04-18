'use strict';

// Dual-export stub for oauth.cjs. Mirrors lib/markos/mcp/sessions.ts and Phase 201
// lib/markos/tenant/invites.ts convention. Named exports re-project the .cjs module
// so TS callers can import specific helpers.

const impl = require('./oauth.cjs');

export const AUTH_CODE_TTL_SECONDS: number = impl.AUTH_CODE_TTL_SECONDS;
export const PKCE_VERIFIER_MIN: number = impl.PKCE_VERIFIER_MIN;
export const PKCE_VERIFIER_MAX: number = impl.PKCE_VERIFIER_MAX;
export const isAllowedRedirect: (uri: string) => boolean = impl.isAllowedRedirect;
export const issueAuthorizationCode: (
  redis: unknown,
  payload: Record<string, unknown>,
) => Promise<{ code: string; expires_at: string }> = impl.issueAuthorizationCode;
export const consumeAuthorizationCode: (
  redis: unknown,
  code: string,
) => Promise<Record<string, unknown> | null> = impl.consumeAuthorizationCode;
export const verifyPKCE: (verifier: string, storedChallenge: string) => boolean = impl.verifyPKCE;
export const generateDCRClient: (input: {
  client_name: string;
  redirect_uris: string[];
}) => {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
} = impl.generateDCRClient;

module.exports = require('./oauth.cjs');
