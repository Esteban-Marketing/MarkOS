'use strict';

// Phase 202 Plan 08 — Task 1: MCP Resources dispatcher + tenant-scope guard + read shape.
// Plan spec §"3 test suites: resources.test.js (list returns 3 templates, read tenant-scoped payload, ...)"

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RESOURCE_TEMPLATES,
  listResources,
  listResourceTemplates,
  readResource,
} = require('../../lib/markos/mcp/resources/index.cjs');

test('Suite 202-08: RESOURCE_TEMPLATES declares 3 resources with expected URIs', () => {
  assert.equal(RESOURCE_TEMPLATES.length, 3);
  const uris = RESOURCE_TEMPLATES.map((r) => r.uriTemplate);
  assert.ok(uris.includes('mcp://markos/canon/{tenant}'));
  assert.ok(uris.includes('mcp://markos/literacy/{tenant}'));
  assert.ok(uris.includes('mcp://markos/tenant/status'));
});

test('Suite 202-08: every resource has mimeType application/json', () => {
  for (const r of RESOURCE_TEMPLATES) assert.equal(r.mimeType, 'application/json');
});

test('Suite 202-08: listResourceTemplates returns a copy (not the frozen array)', () => {
  const a = listResourceTemplates();
  const b = listResourceTemplates();
  assert.equal(a.length, 3);
  assert.notEqual(a, b, 'should return a new array each call');
});

test('Suite 202-08: listResources returns per-session concrete URIs with tenant substituted', () => {
  const list = listResources({ id: 's1', tenant_id: 't-abc' });
  const uris = list.map((r) => r.uri).sort();
  assert.deepEqual(
    uris,
    ['mcp://markos/canon/t-abc', 'mcp://markos/literacy/t-abc', 'mcp://markos/tenant/status'].sort(),
  );
});

test('Suite 202-08: listResources returns empty for unauthenticated/absent session', () => {
  assert.deepEqual(listResources(null), []);
  assert.deepEqual(listResources({}), []);
});

test('Suite 202-08: readResource canon returns tenant-scoped payload', async () => {
  const mockSupabase = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  };
  const r = await readResource('mcp://markos/canon/t1', { id: 's1', tenant_id: 't1' }, mockSupabase, {
    loadPack: async () => ({ canon: [{ title: 'Brand principles' }] }),
  });
  assert.ok(r.contents);
  assert.equal(r.contents[0].mimeType, 'application/json');
  assert.equal(r.contents[0].uri, 'mcp://markos/canon/t1');
  const parsed = JSON.parse(r.contents[0].text);
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(parsed.canon.length, 1);
});

test('Suite 202-08: readResource cross-tenant canon URI returns cross_tenant_blocked', async () => {
  const r = await readResource(
    'mcp://markos/canon/t-other',
    { id: 's1', tenant_id: 't1' },
    null,
    {},
  );
  assert.equal(r.error, 'cross_tenant_blocked');
  assert.equal(r.expected, 't1');
  assert.equal(r.requested, 't-other');
});

test('Suite 202-08: readResource cross-tenant literacy URI returns cross_tenant_blocked', async () => {
  const r = await readResource(
    'mcp://markos/literacy/t-other',
    { id: 's1', tenant_id: 't1' },
    null,
    {},
  );
  assert.equal(r.error, 'cross_tenant_blocked');
});

test('Suite 202-08: readResource unknown URI returns resource_not_found', async () => {
  const r = await readResource('mcp://markos/unknown/x', { id: 's1', tenant_id: 't1' }, null, {});
  assert.equal(r.error, 'resource_not_found');
});

test('Suite 202-08: readResource literacy returns tenant-scoped payload', async () => {
  const r = await readResource(
    'mcp://markos/literacy/t1',
    { id: 's1', tenant_id: 't1' },
    null,
    {
      loadPack: async () => ({ archetypes: [{ slug: 'builder' }], literacy: { nodes: [] } }),
    },
  );
  const parsed = JSON.parse(r.contents[0].text);
  assert.equal(parsed.tenant_id, 't1');
  assert.ok(Array.isArray(parsed.archetypes));
  assert.equal(parsed.archetypes[0].slug, 'builder');
});

test('Suite 202-08: readResource tenant/status aggregates status + sessions + spend', async () => {
  const mockSupabase = {
    from(name) {
      if (name === 'markos_tenants') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { status: 'active', slug: 'acme' } }),
            }),
          }),
        };
      }
      if (name === 'markos_mcp_sessions') {
        return {
          select: () => ({
            eq: () => ({ is: async () => ({ data: [{ id: 'a' }, { id: 'b' }] }) }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
    },
  };
  const r = await readResource(
    'mcp://markos/tenant/status',
    { id: 's1', tenant_id: 't1', plan_tier: 'team' },
    mockSupabase,
    {},
  );
  const parsed = JSON.parse(r.contents[0].text);
  assert.equal(parsed.status, 'active');
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(parsed.plan_tier, 'team');
  assert.equal(typeof parsed.as_of, 'string');
});

test('Suite 202-08: readResource tenant/status always resolves to session tenant (no placeholder)', async () => {
  // URI has no {tenant} placeholder — session provides the scoping.
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
          is: async () => ({ data: [] }),
        }),
      }),
    }),
  };
  const r = await readResource(
    'mcp://markos/tenant/status',
    { id: 's1', tenant_id: 't-from-session', plan_tier: 'solo' },
    mockSupabase,
    {},
  );
  const parsed = JSON.parse(r.contents[0].text);
  assert.equal(parsed.tenant_id, 't-from-session');
});
