'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { auditDraft } = require('../../../../bin/lib/generate-runner.cjs');
const { loadFixtures, runEval, assertEval } = require('./_lib/runner.cjs');

const TOOL_NAME = 'run_neuro_audit';
const fixtures = loadFixtures(TOOL_NAME);

for (const fixture of fixtures) {
  test(`${TOOL_NAME} :: ${fixture.name}`, async () => {
    const result = await runEval(TOOL_NAME, fixture, async () => ({
      raw: auditDraft({ text: fixture.tool_input.text }, fixture.tool_input.brief || {}),
      scoring_input: {
        audited_text: fixture.tool_input.text,
        brief: fixture.tool_input.brief || null,
      },
    }));

    assertEval(result);
    assert.ok(['pass', 'fail'].includes(result.payload.status));
    assert.equal(typeof result.payload.score, 'number');
  });
}

test(`${TOOL_NAME} committed fixtures stay at or above minimum`, () => {
  assert.ok(fixtures.length >= 5);
});
