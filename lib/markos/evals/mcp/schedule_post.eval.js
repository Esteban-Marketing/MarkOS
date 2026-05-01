'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor, preview } = require('../../mcp/tools/execution/schedule-post.cjs');
const { loadFixtures, runEval, assertEval } = require('./_lib/runner.cjs');

const TOOL_NAME = 'schedule_post';
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
      preview: preview(fixture.tool_input),
      scoring_input: {
        content: fixture.tool_input.content,
        scheduled_at: fixture.tool_input.scheduled_at,
      },
    }));

    assertEval(result);
    assert.equal(result.payload.tenant_id, 'tenant-eval');
    assert.equal(result.payload.status, 'queued');
  });
}

test(`${TOOL_NAME} committed fixtures stay at or above minimum`, () => {
  assert.ok(fixtures.length >= 5);
});
