'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const {
  AUTH_CODE_TTL_SECONDS,
  isAllowedRedirect,
  issueAuthorizationCode,
  consumeAuthorizationCode,
  verifyPKCE,
  generateDCRClient,
} = require('../../lib/markos/mcp/oauth.cjs');

function mockRedis() {
  const store = new Map();
  return {
    store,
    async set(k, v, opts) {
      if (opts && opts.nx && store.has(k)) return null;
      store.set(k, v);
      return 'OK';
    },
    async get(k) { return store.get(k) || null; },
    async del(k) { return store.delete(k) ? 1 : 0; },
    async getdel(k) { const v = store.get(k); if (v !== undefined) store.delete(k); return v || null; },
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    end(b) { this.body = b; return this; },
    writeHead(c, headers) {
      this.statusCode = c;
      if (headers && typeof headers === 'object') for (const k of Object.keys(headers)) this.headers[k] = headers[k];
    },
  };
}

function mockReq(method, bodyStr, headers = {}, url) {
  const chunks = bodyStr ? [Buffer.from(bodyStr)] : [];
  return {
    method,
    headers,
    url,
    on(evt, cb) {
      if (evt === 'data') chunks.forEach(cb);
      if (evt === 'end') setImmediate(cb);
    },
  };
}

test('Suite 202-02: AUTH_CODE_TTL_SECONDS is 60', () => {
  assert.equal(AUTH_CODE_TTL_SECONDS, 60);
});

test('Suite 202-02: verifyPKCE accepts correct S256 verifier', () => {
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  assert.equal(verifyPKCE(verifier, challenge), true);
});

test('Suite 202-02: verifyPKCE rejects mismatched verifier', () => {
  const challenge = createHash('sha256').update('a'.repeat(64)).digest('base64url');
  assert.equal(verifyPKCE('b'.repeat(64), challenge), false);
});

test('Suite 202-02: verifyPKCE rejects verifier below RFC 7636 length floor (43)', () => {
  assert.equal(verifyPKCE('short', 'abcd'), false);
});

test('Suite 202-02: verifyPKCE rejects verifier above RFC 7636 ceiling (128)', () => {
  assert.equal(verifyPKCE('a'.repeat(129), 'abcd'), false);
});

test('Suite 202-02: issueAuthorizationCode stores with NX + 60s TTL and returns 64-char hex', async () => {
  const redis = mockRedis();
  const { code, expires_at } = await issueAuthorizationCode(redis, {
    code_challenge: 'xyz', code_challenge_method: 'S256',
    user_id: 'u1', tenant_id: 't1', org_id: 'o1',
    client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'https://markos.dev/api/mcp', scopes: ['read'], plan_tier: 'free',
  });
  assert.equal(code.length, 64);
  assert.match(code, /^[0-9a-f]{64}$/);
  assert.ok(new Date(expires_at).getTime() > Date.now());
  assert.equal(redis.store.size, 1);
});

test('Suite 202-02: issueAuthorizationCode rejects non-S256 method', async () => {
  const redis = mockRedis();
  await assert.rejects(() => issueAuthorizationCode(redis, {
    code_challenge: 'x', code_challenge_method: 'plain',
    user_id: 'u', tenant_id: 't', org_id: 'o', client_id: 'c',
    redirect_uri: 'https://x.y', resource: 'r', scopes: [], plan_tier: 'free',
  }), /S256/);
});

test('Suite 202-02: issueAuthorizationCode rejects missing required fields', async () => {
  const redis = mockRedis();
  await assert.rejects(() => issueAuthorizationCode(redis, {
    code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o', client_id: 'c',
    redirect_uri: 'https://x.y', resource: 'r', scopes: [], plan_tier: 'free',
  }), /missing code_challenge/);
});

test('Suite 202-02: consumeAuthorizationCode returns payload then deletes (one-time use)', async () => {
  const redis = mockRedis();
  const { code } = await issueAuthorizationCode(redis, {
    code_challenge: 'c', code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o', client_id: 'c',
    redirect_uri: 'https://claude.ai/mcp/oauth/callback', resource: 'r', scopes: [], plan_tier: 'free',
  });
  const first = await consumeAuthorizationCode(redis, code);
  assert.ok(first);
  assert.equal(first.user_id, 'u');
  const second = await consumeAuthorizationCode(redis, code);
  assert.equal(second, null);
});

test('Suite 202-02: consumeAuthorizationCode returns null on missing code', async () => {
  const redis = mockRedis();
  const result = await consumeAuthorizationCode(redis, 'a'.repeat(64));
  assert.equal(result, null);
});

test('Suite 202-02: consumeAuthorizationCode returns null on too-short code', async () => {
  const redis = mockRedis();
  const result = await consumeAuthorizationCode(redis, 'tooshort');
  assert.equal(result, null);
});

test('Suite 202-02: generateDCRClient emits mcp-cli- prefix + defaults', () => {
  const c = generateDCRClient({ client_name: 'claude-desktop', redirect_uris: ['https://claude.ai/mcp/oauth/callback'] });
  assert.match(c.client_id, /^mcp-cli-[0-9a-f]{32}$/);
  assert.deepEqual(c.grant_types, ['authorization_code']);
  assert.deepEqual(c.response_types, ['code']);
  assert.equal(c.token_endpoint_auth_method, 'none');
  assert.equal(c.client_name, 'claude-desktop');
});

test('Suite 202-02: generateDCRClient rejects non-https non-loopback redirect', () => {
  assert.throws(() => generateDCRClient({ client_name: 'x', redirect_uris: ['ftp://evil.com'] }), /invalid_redirect_uri/);
});

test('Suite 202-02: generateDCRClient rejects missing client_name', () => {
  assert.throws(() => generateDCRClient({ client_name: '', redirect_uris: ['https://x.y'] }), /invalid_client_metadata/);
});

test('Suite 202-02: generateDCRClient rejects empty redirect_uris array', () => {
  assert.throws(() => generateDCRClient({ client_name: 'x', redirect_uris: [] }), /invalid_redirect_uri/);
});

test('Suite 202-02: generateDCRClient accepts VS Code loopback + vscode.dev redirects', () => {
  const c = generateDCRClient({
    client_name: 'vscode',
    redirect_uris: ['http://127.0.0.1:33418', 'https://vscode.dev/redirect'],
  });
  assert.equal(c.redirect_uris.length, 2);
});

test('Suite 202-02: isAllowedRedirect policy matrix', () => {
  assert.equal(isAllowedRedirect('https://vscode.dev/redirect'), true);
  assert.equal(isAllowedRedirect('https://claude.ai/mcp/oauth/callback'), true);
  assert.equal(isAllowedRedirect('https://example.com/cb'), true);
  assert.equal(isAllowedRedirect('http://127.0.0.1:33418'), true);
  assert.equal(isAllowedRedirect('http://localhost:3000'), true);
  assert.equal(isAllowedRedirect('http://evil.com'), false);
  assert.equal(isAllowedRedirect('javascript:alert(1)'), false);
  assert.equal(isAllowedRedirect(''), false);
  assert.equal(isAllowedRedirect(null), false);
});

test('Suite 202-02: well-known oauth-protected-resource returns RFC 9728 shape', async () => {
  const handler = require('../../api/.well-known/oauth-protected-resource.js');
  const res = mockRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.ok(parsed.resource);
  assert.ok(Array.isArray(parsed.authorization_servers));
  assert.deepEqual(parsed.bearer_methods_supported, ['header']);
  assert.ok(res.headers['Cache-Control']);
});

test('Suite 202-02: well-known oauth-protected-resource rejects non-GET', async () => {
  const handler = require('../../api/.well-known/oauth-protected-resource.js');
  const res = mockRes();
  await handler({ method: 'POST' }, res);
  assert.equal(res.statusCode, 405);
});

test('Suite 202-02: well-known oauth-authorization-server declares code_challenge_methods_supported: [S256]', async () => {
  const handler = require('../../api/.well-known/oauth-authorization-server.js');
  const res = mockRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.deepEqual(parsed.code_challenge_methods_supported, ['S256']);
  assert.deepEqual(parsed.grant_types_supported, ['authorization_code']);
  assert.deepEqual(parsed.response_types_supported, ['code']);
  assert.ok(parsed.authorization_endpoint.endsWith('/oauth/authorize'));
  assert.ok(parsed.token_endpoint.endsWith('/oauth/token'));
  assert.ok(parsed.registration_endpoint.endsWith('/oauth/register'));
  assert.ok(parsed.revocation_endpoint.endsWith('/oauth/revoke'));
  assert.ok(Array.isArray(parsed.scopes_supported));
  assert.deepEqual(parsed.token_endpoint_auth_methods_supported, ['none']);
});

test('Suite 202-02: /oauth/register returns 201 + mcp-cli- client_id on valid payload', async () => {
  const handler = require('../../api/oauth/register.js');
  const body = JSON.stringify({ client_name: 'claude-desktop', redirect_uris: ['https://claude.ai/mcp/oauth/callback'] });
  const req = mockReq('POST', body);
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 201);
  const parsed = JSON.parse(res.body);
  assert.match(parsed.client_id, /^mcp-cli-[0-9a-f]{32}$/);
  assert.deepEqual(parsed.grant_types, ['authorization_code']);
});

test('Suite 202-02: /oauth/register rejects missing client_name with 400 invalid_client_metadata', async () => {
  const handler = require('../../api/oauth/register.js');
  const body = JSON.stringify({ redirect_uris: ['https://claude.ai/mcp/oauth/callback'] });
  const req = mockReq('POST', body);
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'invalid_client_metadata');
});

test('Suite 202-02: /oauth/register rejects invalid redirect with 400 invalid_redirect_uri', async () => {
  const handler = require('../../api/oauth/register.js');
  const body = JSON.stringify({ client_name: 'x', redirect_uris: ['ftp://evil.com'] });
  const req = mockReq('POST', body);
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'invalid_redirect_uri');
});

test('Suite 202-02: /oauth/register rejects non-POST with 405', async () => {
  const handler = require('../../api/oauth/register.js');
  const req = mockReq('GET');
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});

// -----------------------------------------------------------------------------
// Task 2 suites: /oauth/authorize, /oauth/authorize/approve, /oauth/token, /oauth/revoke
// -----------------------------------------------------------------------------

test('Suite 202-02: /oauth/authorize 302s to /login when no Phase-201 cookie', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: {}, url: '/oauth/authorize?client_id=c&redirect_uri=https://claude.ai/mcp/oauth/callback&response_type=code&code_challenge=x&code_challenge_method=S256&scope=read&state=s&resource=https://markos.dev/api/mcp' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 302);
  assert.match(res.headers.Location, /^\/login\?return_to=/);
});

test('Suite 202-02: /oauth/authorize 302s to /oauth/consent with preserved query when authenticated', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: { cookie: 'markos_sess=abc' }, url: '/oauth/authorize?client_id=c&redirect_uri=https://claude.ai/mcp/oauth/callback&response_type=code&code_challenge=x&code_challenge_method=S256&scope=read&state=s&resource=https://markos.dev/api/mcp' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 302);
  assert.match(res.headers.Location, /^\/oauth\/consent\?/);
  assert.match(res.headers.Location, /state=s/);
});

test('Suite 202-02: /oauth/authorize 400s on response_type != code', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: {}, url: '/oauth/authorize?client_id=c&redirect_uri=https://claude.ai/mcp/oauth/callback&response_type=token&code_challenge=x&code_challenge_method=S256&scope=read&state=s&resource=r' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /response_type must be code/);
});

test('Suite 202-02: /oauth/authorize 400s on code_challenge_method=plain (S256 only)', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: {}, url: '/oauth/authorize?client_id=c&redirect_uri=https://claude.ai/mcp/oauth/callback&response_type=code&code_challenge=x&code_challenge_method=plain&scope=read&state=s&resource=r' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /S256/);
});

test('Suite 202-02: /oauth/authorize 400s on missing required query param', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: {}, url: '/oauth/authorize?client_id=c' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /missing/);
});

test('Suite 202-02: /oauth/authorize 400s on disallowed redirect_uri', async () => {
  const handler = require('../../api/oauth/authorize.js');
  const req = { method: 'GET', headers: { cookie: 'markos_sess=abc' }, url: '/oauth/authorize?client_id=c&redirect_uri=javascript:alert(1)&response_type=code&code_challenge=x&code_challenge_method=S256&scope=read&state=s&resource=r' };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

// ---- /oauth/token ----

test('Suite 202-02: /oauth/token rejects grant_type != authorization_code', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const req = mockReq('POST', 'grant_type=password&code=x');
  const res = mockRes();
  await handleToken(req, res, { redis: mockRedis(), supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /unsupported_grant_type/);
});

test('Suite 202-02: /oauth/token rejects missing required form field', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const req = mockReq('POST', 'grant_type=authorization_code&code=x');
  const res = mockRes();
  await handleToken(req, res, { redis: mockRedis(), supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /invalid_request/);
});

test('Suite 202-02: /oauth/token returns invalid_grant on unknown code', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const req = mockReq('POST', `grant_type=authorization_code&code=${'a'.repeat(64)}&code_verifier=${'a'.repeat(64)}&client_id=c&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=r`);
  const res = mockRes();
  await handleToken(req, res, { redis: mockRedis(), supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /invalid_grant/);
});

test('Suite 202-02: /oauth/token happy path (PKCE + createSession) returns Bearer + 86400 TTL + no refresh_token', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u1', tenant_id: 't1', org_id: 'o1',
    client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'https://markos.dev/api/mcp', scopes: ['read', 'plan'], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');

  // Mock Supabase for createSession: tenant lookup + session insert + audit insert
  const supabase = {
    from(name) {
      if (name === 'markos_tenants') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'active' }, error: null }) }) }) };
      }
      if (name === 'markos_mcp_sessions') {
        return { insert: async () => ({ error: null }) };
      }
      if (name === 'markos_audit_log_staging') {
        return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'a1' }, error: null }) }) }) };
      }
      return { insert: async () => ({ error: null }), select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    },
  };

  const req = mockReq('POST', `grant_type=authorization_code&code=${code}&code_verifier=${verifier}&client_id=c1&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=${encodeURIComponent('https://markos.dev/api/mcp')}`);
  const res = mockRes();
  await handleToken(req, res, { redis, supabase });
  assert.equal(res.statusCode, 200, `expected 200, got ${res.statusCode} body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.token_type, 'Bearer');
  assert.equal(parsed.expires_in, 86400);
  assert.match(parsed.access_token, /^[0-9a-f]{64}$/);
  assert.equal(parsed.refresh_token, undefined); // no refresh token per D-06
  assert.equal(parsed.scope, 'read plan');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('Suite 202-02: /oauth/token returns invalid_grant on PKCE verifier mismatch', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const realVerifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(realVerifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o',
    client_id: 'c', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'r', scopes: [], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');

  const req = mockReq('POST', `grant_type=authorization_code&code=${code}&code_verifier=${'b'.repeat(64)}&client_id=c&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=r`);
  const res = mockRes();
  await handleToken(req, res, { redis, supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'invalid_grant');
  assert.match(parsed.error_description, /PKCE/);
});

test('Suite 202-02: /oauth/token returns invalid_grant on second use (authorization_code one-time)', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o',
    client_id: 'c', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'r', scopes: [], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');
  const supabase = {
    from(name) {
      if (name === 'markos_tenants') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'active' }, error: null }) }) }) };
      if (name === 'markos_mcp_sessions') return { insert: async () => ({ error: null }) };
      if (name === 'markos_audit_log_staging') return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'a1' }, error: null }) }) }) };
      return { insert: async () => ({ error: null }), select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    },
  };

  const bodyStr = `grant_type=authorization_code&code=${code}&code_verifier=${verifier}&client_id=c&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=r`;
  const res1 = mockRes();
  await handleToken(mockReq('POST', bodyStr), res1, { redis, supabase });
  assert.equal(res1.statusCode, 200, `first use should succeed: ${res1.body}`);

  const res2 = mockRes();
  await handleToken(mockReq('POST', bodyStr), res2, { redis, supabase });
  assert.equal(res2.statusCode, 400);
  assert.match(res2.body, /invalid_grant/);
});

test('Suite 202-02: /oauth/token returns invalid_client on client_id mismatch', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o',
    client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'r', scopes: [], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');
  const req = mockReq('POST', `grant_type=authorization_code&code=${code}&code_verifier=${verifier}&client_id=OTHER&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=r`);
  const res = mockRes();
  await handleToken(req, res, { redis, supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /invalid_client/);
});

test('Suite 202-02: /oauth/token returns invalid_grant on redirect_uri mismatch', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o',
    client_id: 'c', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'r', scopes: [], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');
  const req = mockReq('POST', `grant_type=authorization_code&code=${code}&code_verifier=${verifier}&client_id=c&redirect_uri=${encodeURIComponent('https://other.example/cb')}&resource=r`);
  const res = mockRes();
  await handleToken(req, res, { redis, supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /invalid_grant/);
});

test('Suite 202-02: /oauth/token returns invalid_target on resource mismatch (RFC 8707)', async () => {
  const { handleToken } = require('../../api/oauth/token.js');
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redis = mockRedis();
  await issueAuthorizationCode(redis, {
    code_challenge: challenge, code_challenge_method: 'S256',
    user_id: 'u', tenant_id: 't', org_id: 'o',
    client_id: 'c', redirect_uri: 'https://claude.ai/mcp/oauth/callback',
    resource: 'https://markos.dev/api/mcp', scopes: [], plan_tier: 'free',
  });
  const code = Array.from(redis.store.keys())[0].replace(/^oauth:code:/, '');
  const req = mockReq('POST', `grant_type=authorization_code&code=${code}&code_verifier=${verifier}&client_id=c&redirect_uri=${encodeURIComponent('https://claude.ai/mcp/oauth/callback')}&resource=https://other.example/api/mcp`);
  const res = mockRes();
  await handleToken(req, res, { redis, supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /invalid_target/);
});

// ---- /oauth/revoke ----

test('Suite 202-02: /oauth/revoke 401s without x-markos-user-id header', async () => {
  const { handleRevoke } = require('../../api/oauth/revoke.js');
  const req = mockReq('POST', JSON.stringify({ token: 'a'.repeat(64) }));
  const res = mockRes();
  await handleRevoke(req, res, { supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) } });
  assert.equal(res.statusCode, 401);
});

test('Suite 202-02: /oauth/revoke returns 200 even for unknown token (RFC 7009 anti-probing)', async () => {
  const { handleRevoke } = require('../../api/oauth/revoke.js');
  const req = mockReq('POST', JSON.stringify({ token: 'a'.repeat(64) }), { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleRevoke(req, res, { supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) } });
  assert.equal(res.statusCode, 200);
});

test('Suite 202-02: /oauth/revoke calls sessions.revokeSession on known token', async () => {
  const { handleRevoke } = require('../../api/oauth/revoke.js');
  const revokeCalls = [];
  const supabase = {
    from(name) {
      if (name === 'markos_mcp_sessions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 'sess-1', tenant_id: 't1', org_id: 'o1', user_id: 'u1' } }),
              // for revokeSession lookup via .eq('id') path
            }),
          }),
          update: (u) => ({ eq: (k, v) => { revokeCalls.push({ update: u, key: k, value: v }); return Promise.resolve({ error: null }); } }),
        };
      }
      if (name === 'markos_audit_log_staging') {
        return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'a1' }, error: null }) }) }) };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
    },
  };
  const req = mockReq('POST', JSON.stringify({ token: 'a'.repeat(64) }), { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleRevoke(req, res, { supabase });
  assert.equal(res.statusCode, 200);
  assert.ok(revokeCalls.some((c) => c.update && c.update.revoked_at), 'expected revoke update call with revoked_at');
});

// ---- /oauth/authorize/approve ----

test('Suite 202-02: /oauth/authorize/approve 401s without user header', async () => {
  const { handleApprove } = require('../../api/oauth/authorize/approve.js');
  const body = JSON.stringify({ state: 's1', target_tenant_id: 't1', csrf_token: 'ok', client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback', resource: 'r', scope: 'read', code_challenge: 'x', code_challenge_method: 'S256' });
  const req = mockReq('POST', body);
  const res = mockRes();
  await handleApprove(req, res, { redis: mockRedis(), supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) } });
  assert.equal(res.statusCode, 401);
});

test('Suite 202-02: /oauth/authorize/approve rejects non-S256 code_challenge_method', async () => {
  const { handleApprove } = require('../../api/oauth/authorize/approve.js');
  const body = JSON.stringify({ state: 's1', target_tenant_id: 't1', csrf_token: 'ok', client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback', resource: 'r', scope: 'read', code_challenge: 'x', code_challenge_method: 'plain' });
  const req = mockReq('POST', body, { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleApprove(req, res, { redis: mockRedis(), supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /S256/);
});

test('Suite 202-02: /oauth/authorize/approve rejects invalid redirect_uri', async () => {
  const { handleApprove } = require('../../api/oauth/authorize/approve.js');
  const body = JSON.stringify({ state: 's1', target_tenant_id: 't1', csrf_token: 'ok', client_id: 'c1', redirect_uri: 'javascript:alert(1)', resource: 'r', scope: 'read', code_challenge: 'x', code_challenge_method: 'S256' });
  const req = mockReq('POST', body, { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleApprove(req, res, { redis: mockRedis(), supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /redirect_uri/);
});

test('Suite 202-02: /oauth/authorize/approve 403s when target_tenant_id not in user set', async () => {
  const { handleApprove } = require('../../api/oauth/authorize/approve.js');
  const supabase = {
    from(name) {
      // listTenantsForUser: org memberships + tenant memberships — return empty so target is rejected
      if (name === 'markos_org_memberships') return { select: () => ({ eq: async () => ({ data: [] }) }) };
      if (name === 'markos_tenant_memberships') return { select: () => ({ eq: async () => ({ data: [] }) }) };
      return { select: () => ({ eq: async () => ({ data: [] }) }) };
    },
  };
  const body = JSON.stringify({ state: 's1', target_tenant_id: 't-evil', csrf_token: 'ok', client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback', resource: 'r', scope: 'read', code_challenge: 'x', code_challenge_method: 'S256' });
  const req = mockReq('POST', body, { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleApprove(req, res, { redis: mockRedis(), supabase });
  assert.equal(res.statusCode, 403);
  assert.match(res.body, /invalid_tenant/);
});

test('Suite 202-02: /oauth/authorize/approve 302s to redirect_uri?code=&state= on happy path', async () => {
  const { handleApprove } = require('../../api/oauth/authorize/approve.js');
  const redis = mockRedis();
  const supabase = {
    from(name) {
      if (name === 'markos_org_memberships') {
        return { select: () => ({ eq: async () => ({ data: [{ org_id: 'o1', org_role: 'owner', markos_orgs: { id: 'o1', name: 'AcmeOrg', slug: 'acme-org', status: 'active' } }] }) }) };
      }
      if (name === 'markos_tenant_memberships') {
        return { select: () => ({ eq: async () => ({ data: [{ tenant_id: 't1', iam_role: 'owner', markos_tenants: { id: 't1', slug: 'acme', name: 'Acme', org_id: 'o1', status: 'active' } }] }) }) };
      }
      if (name === 'markos_orgs') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'free' }, error: null }) }) }) };
      }
      return { select: () => ({ eq: async () => ({ data: [] }) }) };
    },
  };
  const body = JSON.stringify({ state: 's1', target_tenant_id: 't1', csrf_token: 'ok', client_id: 'c1', redirect_uri: 'https://claude.ai/mcp/oauth/callback', resource: 'https://markos.dev/api/mcp', scope: 'read plan', code_challenge: 'x', code_challenge_method: 'S256' });
  const req = mockReq('POST', body, { 'x-markos-user-id': 'u1' });
  const res = mockRes();
  await handleApprove(req, res, { redis, supabase });
  assert.equal(res.statusCode, 302, `expected 302, got ${res.statusCode} body=${res.body}`);
  assert.match(res.headers.Location, /^https:\/\/claude\.ai\/mcp\/oauth\/callback\?code=/);
  assert.match(res.headers.Location, /state=s1/);
  assert.equal(redis.store.size, 1);
});
