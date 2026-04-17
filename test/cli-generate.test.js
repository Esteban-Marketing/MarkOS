'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { parseBrief, validateBrief, normalizeBrief } = require('../bin/lib/brief-parser.cjs');
const { runDraft, stubLlm, auditDraft, buildUserPrompt } = require('../bin/lib/generate-runner.cjs');

const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'generate.cjs');

function tmpBriefFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-brief-'));
  const file = path.join(dir, 'brief.yaml');
  fs.writeFileSync(file, content);
  return file;
}

test('parseBrief accepts YAML file', () => {
  const file = tmpBriefFile([
    'channel: email',
    'audience: founder-sam',
    'pain: pipeline_velocity',
    'promise: re-fill your pipeline',
    'brand: markos',
  ].join('\n'));
  const brief = parseBrief(file);
  assert.equal(brief.channel, 'email');
  assert.equal(brief.brand, 'markos');
});

test('parseBrief accepts JSON file', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'markos-brief-')), 'brief.json');
  fs.writeFileSync(file, JSON.stringify({ channel: 'linkedin', audience: 'a', pain: 'p', promise: 'q', brand: 'b' }));
  const brief = parseBrief(file);
  assert.equal(brief.channel, 'linkedin');
});

test('validateBrief rejects missing required fields', () => {
  const result = validateBrief({ channel: 'email', audience: 'a' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /pain/.test(e)));
  assert.ok(result.errors.some((e) => /promise/.test(e)));
  assert.ok(result.errors.some((e) => /brand/.test(e)));
});

test('normalizeBrief trims required fields and preserves extras', () => {
  const normalized = normalizeBrief({ channel: '  email  ', audience: 'a', pain: 'p', promise: 'q', brand: 'b', extra: 'x' });
  assert.equal(normalized.channel, 'email');
  assert.equal(normalized.extra, 'x');
});

test('auditDraft passes for coherent draft', () => {
  const audit = auditDraft(
    { text: 'MarkOS helps founders re-fill your pipeline by removing the velocity blocker.' },
    { promise: 're-fill your pipeline', brand: 'markos' },
  );
  assert.equal(audit.status, 'pass');
  assert.equal(audit.issues.filter((i) => i.severity === 'error').length, 0);
});

test('auditDraft fails for too-short draft', () => {
  const audit = auditDraft({ text: 'short' }, { promise: 'p', brand: 'b' });
  assert.equal(audit.status, 'fail');
});

test('buildUserPrompt includes all required fields', () => {
  const prompt = buildUserPrompt({ channel: 'email', audience: 'a', pain: 'p', promise: 'q', brand: 'b' });
  assert.match(prompt, /Channel: email/);
  assert.match(prompt, /Audience: a/);
  assert.match(prompt, /Pain: p/);
});

test('stubLlm echoes brief fields into draft text', async () => {
  const prompt = buildUserPrompt({ channel: 'email', audience: 'sam', pain: 'slow deals', promise: 'go faster', brand: 'markos' });
  const result = await stubLlm('sys', prompt);
  assert.equal(result.ok, true);
  assert.match(result.text, /email/);
  assert.match(result.text, /sam/);
  assert.match(result.text, /go faster/);
});

test('runDraft returns success + draft + audit for valid brief', async () => {
  const result = await runDraft({
    channel: 'email',
    audience: 'founder-sam',
    pain: 'pipeline_velocity',
    promise: 'pipeline goes up',
    brand: 'markos',
  });
  assert.equal(result.success, true);
  assert.equal(typeof result.draft.text, 'string');
  assert.ok(['pass', 'fail'].includes(result.audit.status));
});

test('runDraft rejects invalid brief with INVALID_BRIEF', async () => {
  const result = await runDraft({ channel: 'email' });
  assert.equal(result.success, false);
  assert.equal(result.error, 'INVALID_BRIEF');
  assert.ok(Array.isArray(result.brief_errors));
});

test('runDraft forwards llm failure with LLM_CALL_FAILED', async () => {
  const failingLlm = () => Promise.resolve({ ok: false, error: { code: 'RATE_LIMITED', message: 'try later' } });
  const result = await runDraft(
    { channel: 'email', audience: 'a', pain: 'p', promise: 'promise goes here', brand: 'markos' },
    { llm: failingLlm },
  );
  assert.equal(result.success, false);
  assert.equal(result.error, 'LLM_CALL_FAILED');
});

test('CLI smoke: valid brief file exits 0 and emits success JSON', () => {
  const file = tmpBriefFile([
    'channel: email',
    'audience: founder-sam',
    'pain: pipeline_velocity',
    'promise: pipeline goes up',
    'brand: markos',
  ].join('\n'));
  const { status, stdout, stderr } = spawnSync(process.execPath, [CLI_PATH, file], { encoding: 'utf8' });
  assert.equal(status, 0, `expected exit 0, got ${status}. stderr=${stderr}`);
  const payload = JSON.parse(stdout);
  assert.equal(payload.success, true);
});

test('CLI smoke: invalid brief exits 1 with INVALID_BRIEF', () => {
  const file = tmpBriefFile('channel: email\n');
  const { status, stdout } = spawnSync(process.execPath, [CLI_PATH, file], { encoding: 'utf8' });
  assert.equal(status, 1);
  const payload = JSON.parse(stdout);
  assert.equal(payload.success, false);
  assert.equal(payload.error, 'INVALID_BRIEF');
});

test('CLI smoke: inline flags work', () => {
  const { status, stdout } = spawnSync(
    process.execPath,
    [
      CLI_PATH,
      '--channel=email',
      '--audience=sam',
      '--pain=slow',
      '--promise=pipeline goes up fast',
      '--brand=markos',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(status, 0);
  const payload = JSON.parse(stdout);
  assert.equal(payload.success, true);
});
