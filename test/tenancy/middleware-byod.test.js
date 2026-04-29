'use strict';

// Phase 201.1 D-107 (closes M2): Tests for middleware BYOD grace branch + resolver augmentation.
// Two layers:
//   1. Source-level assertions on middleware.ts (that grace headers + opts are present)
//   2. Unit tests on resolveTenantByDomain with opts.allowGrace + withinGrace field

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Layer 1: middleware.ts structural assertions
// ---------------------------------------------------------------------------

describe('middleware-byod: middleware.ts structural checks (D-107 grace path)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');

  it('middleware.ts sets x-markos-byod-grace header on degraded match', () => {
    assert.match(src, /x-markos-byod-grace/, 'missing x-markos-byod-grace header set');
  });

  it('middleware.ts calls resolveTenantByDomain with { allowGrace: true }', () => {
    assert.match(src, /allowGrace.*true|allowGrace:\s*true/, 'missing allowGrace: true in BYOD branch');
  });

  it('middleware.ts checks withinGrace on the tenant result', () => {
    assert.match(src, /withinGrace/, 'missing withinGrace conditional in middleware');
  });
});

// ---------------------------------------------------------------------------
// Layer 2: resolveTenantByDomain unit tests for grace + withinGrace field
// ---------------------------------------------------------------------------

const { resolveTenantByDomain } = require('../../lib/markos/tenant/resolver.cjs');

function makeResolverClient(rowOverride) {
  // Builds a mock Supabase client that returns the given row from markos_custom_domains.
  return {
    from(table) {
      const qb = {
        _filters: {},
        _or: null,
        select(cols) { return qb; },
        eq(col, val) { qb._filters[col] = val; return qb; },
        or(expr) { qb._or = expr; return qb; },
        async maybeSingle() {
          if (!rowOverride) return { data: null, error: null };
          return { data: rowOverride, error: null };
        },
      };
      return qb;
    },
  };
}

const MS_1H = 1 * 60 * 60 * 1000;
const MS_25H = 25 * 60 * 60 * 1000;

describe('resolveTenantByDomain: opts.allowGrace + withinGrace field', () => {
  it('Test 1: BYOD host status=failed + last_verified_at=1h ago + allowGrace=true → withinGrace=true', async () => {
    const row = {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      status: 'failed',
      verified_at: null,
      last_verified_at: new Date(Date.now() - MS_1H).toISOString(),
    };
    const client = makeResolverClient(row);
    const result = await resolveTenantByDomain(client, 'acme.example.com', { allowGrace: true });
    assert.ok(result, 'expected a tenant result for grace-eligible row');
    assert.equal(result.withinGrace, true);
    assert.equal(result.tenant_id, 'tenant_abc');
  });

  it('Test 2: BYOD host status=failed + last_verified_at=25h ago + allowGrace=true → no result (or withinGrace=false)', async () => {
    // When last_verified_at is 25h ago, the .or() filter on the DB side should exclude the row.
    // In unit tests with a mock client we return the row regardless of filter.
    // So we test that withinGrace is false for a row with 25h-old last_verified_at.
    const row = {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      status: 'failed',
      verified_at: null,
      last_verified_at: new Date(Date.now() - MS_25H).toISOString(),
    };
    const client = makeResolverClient(row);
    // With allowGrace the DB filters by last_verified_at >= now-24h; our mock always returns the row.
    // The withinGrace field however is computed in JS and must be false for 25h.
    const result = await resolveTenantByDomain(client, 'acme.example.com', { allowGrace: true });
    if (result) {
      // If row was returned (mock doesn't enforce DB filter), withinGrace must be false.
      assert.equal(result.withinGrace, false, 'withinGrace must be false for 25h-old last_verified_at');
    } else {
      // If the resolver correctly filtered it out, null is also valid.
      assert.equal(result, null);
    }
  });

  it('Test 3: BYOD host status=verified → withinGrace=false', async () => {
    const row = {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      status: 'verified',
      verified_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    };
    const client = makeResolverClient(row);
    const result = await resolveTenantByDomain(client, 'acme.example.com', { allowGrace: false });
    assert.ok(result, 'expected a tenant result for verified row');
    assert.equal(result.withinGrace, false, 'verified row must have withinGrace=false');
  });

  it('no result when client returns null (domain not found)', async () => {
    const client = makeResolverClient(null);
    const result = await resolveTenantByDomain(client, 'unknown.example.com', { allowGrace: true });
    assert.equal(result, null);
  });
});
