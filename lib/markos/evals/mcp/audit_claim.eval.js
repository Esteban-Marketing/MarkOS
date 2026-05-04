'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../mcp/tools/marketing/audit-claim.cjs');
const { loadFixtures, runEval, assertEval } = require('./_lib/runner.cjs');

const TOOL_NAME = 'audit_claim';
const fixtures = loadFixtures(TOOL_NAME);

for (const fixture of fixtures) {
  test(`${TOOL_NAME} :: ${fixture.name}`, async () => {
    const result = await runEval(TOOL_NAME, fixture, async ({ session, deps }) => ({
      raw: await descriptor.handler({
        args: fixture.tool_input,
        session,
        supabase: null,
        deps,
      }),
    }));

    assertEval(result);
    assert.equal(result.payload.tenant_id, 'tenant-eval');
    assert.equal(typeof result.payload.supported, 'boolean');
  });
}

test(`${TOOL_NAME} committed fixtures stay at or above minimum`, () => {
  assert.ok(fixtures.length >= 5);
});
