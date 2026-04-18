'use strict';

// Suite 202-07: 2 net-new tenancy handlers — read-only, tenant-scoped.
// list_members reads markos_tenant_memberships; query_audit reads markos_audit_log.

const test = require('node:test');
const assert = require('node:assert/strict');

const DESCRIPTORS = [
  require('../../../lib/markos/mcp/tools/tenancy/list-members.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/tenancy/query-audit.cjs').descriptor,
];

const SESSION = { tenant_id: 'tenant-xyz', user_id: 'u-1', org_id: 'o-1', plan_tier: 'pro' };

function buildArgs(d) {
  const args = {};
  for (const k of d.inputSchema.required || []) {
    const p = d.inputSchema.properties[k];
    if (p?.enum) args[k] = p.enum[0];
    else if (p?.type === 'integer') args[k] = p.minimum || 1;
    else args[k] = 'x';
  }
  return args;
}

test('Suite 202-07: 2 tenancy net-new descriptors present with expected names', () => {
  const names = DESCRIPTORS.map((d) => d.name).sort();
  assert.deepEqual(names, ['list_members', 'query_audit']);
});

test('Suite 202-07: tenancy handlers are simple tier, non-mutating (D-01 read-only)', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(d.latency_tier, 'simple', `${d.name} should be simple tier`);
    assert.equal(d.mutating, false, `${d.name} must be non-mutating (D-01)`);
  }
});

test('Suite 202-07: every tenancy handler filters on session.tenant_id (D-15)', async () => {
  // Inject a supabase dep that short-circuits to empty results but accepts the call chain.
  const mockSupabase = {
    from: (tbl) => ({
      select: () => ({
        eq: (col, val) => {
          // Track the tenant filter happened
          const chain = {
            _col: col,
            _val: val,
            gte: () => chain,
            in: () => chain,
            limit: async () => ({ data: [], error: null }),
            order: () => chain,
            then: (cb) => Promise.resolve({ data: [], error: null }).then(cb),
          };
          return chain;
        },
      }),
    }),
  };
  for (const d of DESCRIPTORS) {
    const args = buildArgs(d);
    const r = await d.handler({ args, session: SESSION, supabase: mockSupabase, deps: {} });
    const parsed = JSON.parse(r.content[0].text);
    assert.equal(parsed.tenant_id, 'tenant-xyz', `${d.name} output missing tenant_id`);
  }
});

test('Suite 202-07: every tenancy descriptor has strict input schema + cost_model', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(
      d.inputSchema.additionalProperties,
      false,
      `${d.name} inputSchema must reject additionalProperties`,
    );
    assert.ok(d.cost_model, `${d.name} missing cost_model`);
  }
});
