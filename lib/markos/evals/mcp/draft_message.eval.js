'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runDraft } = require('../../../../bin/lib/generate-runner.cjs');
const {
  loadFixtures,
  runEval,
  assertEval,
  makeMockDraftLlm,
} = require('./_lib/runner.cjs');

const TOOL_NAME = 'draft_message';
const fixtures = loadFixtures(TOOL_NAME);

test(`${TOOL_NAME} fixture count`, () => {
  assert.ok(fixtures.length >= 5, 'draft_message must ship at least 5 committed fixtures');
});

for (const fixture of fixtures) {
  test(`${TOOL_NAME} :: ${fixture.name}`, async () => {
    const result = await runEval(
      TOOL_NAME,
      fixture,
      async () => {
        const raw = await runDraft(fixture.tool_input, {
          llm: makeMockDraftLlm(fixture),
        });

        return {
          raw,
          scoring_input: {
            brief: fixture.tool_input,
            expected_llm_output: fixture.expected_llm_output,
          },
        };
      },
    );

    assertEval(result);
    assert.equal(result.payload.success, true, 'committed draft fixtures should produce success=true');
    assert.equal(typeof result.payload.draft.text, 'string');
    assert.match(result.payload.draft.text, /docs-first|api|mcp|pipeline/i);
  });
}

test(`${TOOL_NAME} fixture filenames stay committed`, () => {
  const names = fixtures.map((fixture) => fixture.__file.split(/[\\/]/).pop());
  assert.deepEqual(names, [
    '01_brand_voice.json',
    '02_claim_check.json',
    '03_neuro_pillar.json',
    '04_archetype_tone.json',
    '05_prompt_injection.json',
  ]);
});
