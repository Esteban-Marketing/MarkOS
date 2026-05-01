'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../mcp/tools/marketing/plan-campaign.cjs');
const { loadFixtures, runEval, assertEval } = require('./_lib/runner.cjs');

const TOOL_NAME = 'plan_campaign';
const fixtures = loadFixtures(TOOL_NAME);

for (const fixture of fixtures) {
  test(`${TOOL_NAME} :: ${fixture.name}`, async () => {
    const result = await runEval(TOOL_NAME, fixture, async ({ session, deps, req_id }) => ({
      raw: await descriptor.handler({
        args: fixture.tool_input,
        session,
        supabase: null,
        deps,
        req_id,
      }),
    }));

    assertEval(result);
    assert.equal(Array.isArray(result.payload.channels), true);
    assert.equal(result.payload.tenant_id, 'tenant-eval');
  });
}

test(`${TOOL_NAME} committed fixtures stay at or above minimum`, () => {
  assert.ok(fixtures.length >= 5);
});
