const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { createJsonRequest } = require('../setup.js');

const handlerPath = path.join(__dirname, '../../api/tracking/ingest.js');
const identifyHandlerPath = path.join(__dirname, '../../api/tracking/identify.js');

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeReq({ method = 'POST', url = '/api/tracking/ingest?project_slug=markos-client', headers = {}, body = {} } = {}) {
  return {
    ...createJsonRequest(body, url, method),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };
}

function makeRes() {
  return {
    statusCode: null,
    headers: null,
    body: null,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(payload = '') {
      this.body = payload ? JSON.parse(payload) : null;
    },
  };
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createUnsignedJwt(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.`;
}

test('tracking tenant guard: protected-surface ingest fails closed without hosted auth', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    MARKOS_SUPABASE_AUD: process.env.MARKOS_SUPABASE_AUD,
  };

  process.env.VERCEL = '1';
  process.env.MARKOS_SUPABASE_AUD = 'authenticated';

  try {
    const handler = loadFreshModule(handlerPath);
    const req = makeReq({
      body: {
        protected_surface: true,
        events: [{ event_name: 'approval_completed', payload: { phase: '59' } }],
      },
    });
    const res = makeRes();

    await handler(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'AUTH_REQUIRED');
  } finally {
    process.env.VERCEL = previous.VERCEL;
    process.env.MARKOS_SUPABASE_AUD = previous.MARKOS_SUPABASE_AUD;
  }
});

test('tracking tenant guard: conflicting tenant context is denied for protected ingest', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    MARKOS_SUPABASE_AUD: process.env.MARKOS_SUPABASE_AUD,
  };

  process.env.VERCEL = '1';
  process.env.MARKOS_SUPABASE_AUD = 'authenticated';

  try {
    const handler = loadFreshModule(handlerPath);
    const token = createUnsignedJwt({
      aud: 'authenticated',
      sub: 'user-001',
      active_tenant_id: 'tenant-alpha-001',
      app_metadata: { project_slugs: ['markos-client'], tenant_role: 'owner' },
    });
    const req = makeReq({
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-beta-002',
      },
      body: {
        protected_surface: true,
        events: [{ event_name: 'approval_completed', payload: { phase: '59' } }],
      },
    });
    const res = makeRes();

    await handler(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'TENANT_CONTEXT_AMBIGUOUS');
  } finally {
    process.env.VERCEL = previous.VERCEL;
    process.env.MARKOS_SUPABASE_AUD = previous.MARKOS_SUPABASE_AUD;
  }
});

test('tracking tenant guard: conflicting tenant context is denied for protected identify', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    MARKOS_SUPABASE_AUD: process.env.MARKOS_SUPABASE_AUD,
  };

  process.env.VERCEL = '1';
  process.env.MARKOS_SUPABASE_AUD = 'authenticated';

  try {
    const handler = loadFreshModule(identifyHandlerPath);
    const token = createUnsignedJwt({
      aud: 'authenticated',
      sub: 'user-001',
      active_tenant_id: 'tenant-alpha-001',
      app_metadata: { project_slugs: ['markos-client'], tenant_role: 'owner' },
    });
    const req = makeReq({
      url: '/api/tracking/identify?project_slug=markos-client&tenant_id=tenant-beta-002',
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-beta-002',
      },
      body: {
        anonymous_identity_id: 'anon-123',
        known_record_kind: 'contact',
        known_record_id: 'contact-123',
        source_event_ref: 'identify:1',
        signals: { email_exact_match: true, domain_match: true },
      },
    });
    const res = makeRes();

    await handler(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'TENANT_CONTEXT_AMBIGUOUS');
  } finally {
    process.env.VERCEL = previous.VERCEL;
    process.env.MARKOS_SUPABASE_AUD = previous.MARKOS_SUPABASE_AUD;
  }
});