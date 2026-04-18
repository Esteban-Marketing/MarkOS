'use strict';

// Phase 202 Plan 02: OAuth 2.1 + PKCE (MCP 2025-06-18) helpers.
// Source of truth for PKCE S256 verification, authorization_code Redis lifecycle,
// and RFC 7591 Dynamic Client Registration. Dual-exported via oauth.ts.
//
// D-05: code_challenge_method MUST be S256 (no 'plain' ever issued).
// D-06: opaque bearer tokens only — no refresh tokens.
// D-07: tenant binding happens at /oauth/authorize/approve (not here).

const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');

const AUTH_CODE_TTL_SECONDS = 60;
const REDIS_KEY_PREFIX = 'oauth:code:';

// RFC 7636 §4.1: code_verifier is 43..128 unreserved chars.
const PKCE_VERIFIER_MIN = 43;
const PKCE_VERIFIER_MAX = 128;

// Redirect URI policy: https, loopback (RFC 8252), or explicit marketplace redirects.
const ALLOWED_REDIRECT_PREFIXES = [
  'https://',
  'http://127.0.0.1:',
  'http://localhost:',
];
const STATIC_MARKETPLACE_REDIRECTS = new Set([
  'https://claude.ai/mcp/oauth/callback',
  'https://vscode.dev/redirect',
]);

function isAllowedRedirect(uri) {
  if (typeof uri !== 'string' || uri.length === 0) return false;
  if (STATIC_MARKETPLACE_REDIRECTS.has(uri)) return true;
  return ALLOWED_REDIRECT_PREFIXES.some((p) => uri.startsWith(p));
}

async function issueAuthorizationCode(redis, payload) {
  const required = [
    'code_challenge',
    'code_challenge_method',
    'user_id',
    'tenant_id',
    'org_id',
    'client_id',
    'redirect_uri',
    'resource',
    'scopes',
    'plan_tier',
  ];
  for (const k of required) {
    if (payload[k] === undefined || payload[k] === null) {
      throw new Error(`issueAuthorizationCode: missing ${k}`);
    }
  }
  if (payload.code_challenge_method !== 'S256') {
    // D-05: S256 only. Never accept 'plain'.
    throw new Error('issueAuthorizationCode: only S256 is supported (D-05)');
  }

  const code = randomBytes(32).toString('hex'); // 64 char hex
  const expires_at = new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000).toISOString();
  const json = JSON.stringify({ ...payload, issued_at: new Date().toISOString(), expires_at });

  const ok = await redis.set(REDIS_KEY_PREFIX + code, json, { ex: AUTH_CODE_TTL_SECONDS, nx: true });
  if (ok !== 'OK' && ok !== true) {
    throw new Error('issueAuthorizationCode: redis set failed (collision?)');
  }

  return { code, expires_at };
}

async function consumeAuthorizationCode(redis, code) {
  if (typeof code !== 'string' || code.length < 32) return null;

  let raw;
  if (typeof redis.getdel === 'function') {
    raw = await redis.getdel(REDIS_KEY_PREFIX + code);
  } else {
    raw = await redis.get(REDIS_KEY_PREFIX + code);
    if (raw) await redis.del(REDIS_KEY_PREFIX + code);
  }
  if (!raw) return null;

  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function verifyPKCE(verifier, storedChallenge) {
  if (typeof verifier !== 'string' || typeof storedChallenge !== 'string') return false;
  if (verifier.length < PKCE_VERIFIER_MIN || verifier.length > PKCE_VERIFIER_MAX) return false;

  const computed = createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(computed);
  const b = Buffer.from(storedChallenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function generateDCRClient(input) {
  const { client_name, redirect_uris } = input || {};
  if (typeof client_name !== 'string' || client_name.trim().length === 0) {
    const err = new Error('invalid_client_metadata');
    err.code = 'invalid_client_metadata';
    err.reason = 'client_name required';
    throw err;
  }
  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    const err = new Error('invalid_redirect_uri');
    err.code = 'invalid_redirect_uri';
    err.reason = 'redirect_uris must be non-empty array';
    throw err;
  }
  for (const uri of redirect_uris) {
    if (!isAllowedRedirect(uri)) {
      const err = new Error('invalid_redirect_uri');
      err.code = 'invalid_redirect_uri';
      err.reason = `rejected: ${uri}`;
      throw err;
    }
  }

  return {
    client_id: `mcp-cli-${randomBytes(16).toString('hex')}`,
    client_name: client_name.trim(),
    redirect_uris: redirect_uris.slice(),
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  };
}

module.exports = {
  AUTH_CODE_TTL_SECONDS,
  PKCE_VERIFIER_MIN,
  PKCE_VERIFIER_MAX,
  isAllowedRedirect,
  issueAuthorizationCode,
  consumeAuthorizationCode,
  verifyPKCE,
  generateDCRClient,
};
