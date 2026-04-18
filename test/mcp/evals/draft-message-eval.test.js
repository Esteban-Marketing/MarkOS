'use strict';

// Suite 202-10 eval: draft_message (Phase 200 retained tool).
// Deterministic stubLlm injection — uses runDraft's built-in injection point.

const test = require('node:test');
const assert = require('node:assert/strict');
const { TOOLS_BY_NAME } = require('../../../lib/markos/mcp/tools/index.cjs');

test('Suite 202-10 eval: draft_message handler returns content + _usage (schema-shaped)', async () => {
  const descriptor = TOOLS_BY_NAME.draft_message;
  assert.ok(descriptor, 'draft_message descriptor must exist');
  const r = await descriptor.handler({
    args: {
      channel: 'email',
      audience: 'seed founders',
      pain: 'slow onboarding',
      promise: 'ship faster',
      brand: 'MarkOS',
    },
    session: { tenant_id: 't-draft' },
  });
  assert.ok(Array.isArray(r.content), 'content must be array');
  assert.ok(r.content.length >= 1, 'content must have at least one block');
  assert.equal(r.content[0].type, 'text');
  assert.ok(typeof r.content[0].text === 'string');
  assert.ok(r._usage, '_usage required');
  assert.ok(Number.isInteger(r._usage.input_tokens));
  assert.ok(Number.isInteger(r._usage.output_tokens));
});

test('Suite 202-10 eval: draft_message output text is JSON-parseable (deterministic stubLlm)', async () => {
  const descriptor = TOOLS_BY_NAME.draft_message;
  const r = await descriptor.handler({
    args: {
      channel: 'email',
      audience: 'devs',
      pain: 'no SDK',
      promise: 'ship SDK today',
      brand: 'MarkOS',
    },
    session: { tenant_id: 't-draft-2' },
  });
  let parsed;
  assert.doesNotThrow(() => { parsed = JSON.parse(r.content[0].text); });
  assert.ok(parsed, 'must parse');
  // success field present whether the runDraft returned success or failure
  assert.ok('success' in parsed, 'parsed output must carry success field');
});

test('Suite 202-10 eval: draft_message brand-voice-drift stub < 0.1 (structural markers present)', async () => {
  const descriptor = TOOLS_BY_NAME.draft_message;
  const r = await descriptor.handler({
    args: {
      channel: 'email',
      audience: 'AI-ready teams',
      pain: 'agents drift from brand',
      promise: 'protocol-grade grounding',
      brand: 'MarkOS',
    },
    session: { tenant_id: 't-drift' },
  });
  const outputText = JSON.stringify(r);
  const expectedMarkers = ['content', '_usage', 'input_tokens', 'output_tokens'];
  const missing = expectedMarkers.filter((m) => !outputText.includes(m));
  const drift = missing.length / expectedMarkers.length;
  assert.ok(drift < 0.1, `brand-voice drift stub = ${drift}, expected < 0.1`);
});

test('Suite 202-10 eval: draft_message rejects missing required fields via handler path', async () => {
  // The handler itself doesn't validate (pipeline step 4a does AJV strict).
  // But runDraft returns success: false + error: INVALID_BRIEF for missing fields.
  const descriptor = TOOLS_BY_NAME.draft_message;
  const r = await descriptor.handler({
    args: { channel: 'email' }, // missing audience/pain/promise/brand
    session: { tenant_id: 't' },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.success, false, 'missing-field brief should return success=false');
});
