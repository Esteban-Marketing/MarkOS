'use strict';

// Phase 204 Plan 05 Task 3 — `markos eval` CLI + eval-runner.cjs rubric tests.
//
// Covers:
//   eval-01: scoreDraft happy coherent text → score 100 + all dimensions 25
//   eval-02: scoreDraft missing brand → voice 0 + issue
//   eval-03: scoreDraft missing promise → claims 0
//   eval-04: scoreDraft 1 sentence → structure 0
//   eval-05: scoreDraft length 5 words → length 0
//   eval-06: CLI eval brief --draft=path → exits 0 when score >= 60
//   eval-07: CLI eval brief --threshold=80 + draft score 60 → exits 1
//   eval-08: CLI eval brief (no --draft) regenerates via runDraft → score displayed
//   eval-09: JSON output in non-TTY contains score + dimensions + issues
//   eval-meta: eval.cjs is not a stub + no /api/tenant round-trip

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EVAL_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'eval.cjs');
const EVAL_RUNNER_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'eval-runner.cjs');

const { scoreDraft } = require(EVAL_RUNNER_PATH);

// ─── Fixtures ─────────────────────────────────────────────────────────────

function tmpBriefFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-eval-'));
  const file = path.join(dir, 'brief.yaml');
  fs.writeFileSync(file, content);
  return file;
}

function tmpDraftFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-eval-draft-'));
  const file = path.join(dir, 'draft.txt');
  fs.writeFileSync(file, content);
  return file;
}

const HAPPY_BRIEF = {
  channel: 'email',
  audience: 'founders',
  pain: 'pipeline velocity',
  promise: 're-fill your pipeline in 30 days',
  brand: 'markos',
};

const HAPPY_BRIEF_YAML = [
  'channel: email',
  'audience: founders',
  'pain: pipeline velocity',
  'promise: re-fill your pipeline in 30 days',
  'brand: markos',
].join('\n');

// A draft that should score 100/100: mentions brand, echoes promise, 2+
// sentences, within 20-300 words.
const HAPPY_DRAFT_TEXT = [
  'markos helps founders ship outbound faster.',
  'We re-fill your pipeline in 30 days by removing the pipeline-velocity blocker.',
  'Our approach combines data hygiene, template library curation, and a cadence system that founders can actually stick to without dedicated SDR headcount.',
  'Ready to stop wasting mornings on manual prospecting?',
].join(' ');

async function runCli(fn) {
  const originalExit = process.exit;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  let stderr = '';
  let stdout = '';
  let exitCode = null;
  let exited = false;

  class ExitSignal extends Error {
    constructor(code) { super('exit:' + code); this.name = 'ExitSignal'; this.exitCode = code; }
  }

  process.exit = (code) => {
    if (!exited) { exited = true; exitCode = code; }
    throw new ExitSignal(code);
  };
  process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
  process.stdout.write = (chunk) => { stdout += String(chunk); return true; };

  let thrown = null;
  try {
    await fn();
  } catch (err) {
    if (!(err && err.name === 'ExitSignal')) thrown = err;
  } finally {
    process.exit = originalExit;
    process.stderr.write = originalStderrWrite;
    process.stdout.write = originalStdoutWrite;
  }
  if (thrown) throw thrown;
  return { exitCode, stdout, stderr };
}

// ─── eval-runner.cjs direct tests ─────────────────────────────────────────

test('eval-01: scoreDraft happy coherent draft → score 100 + all dimensions 25', async () => {
  const result = await scoreDraft({ text: HAPPY_DRAFT_TEXT }, HAPPY_BRIEF);
  assert.equal(result.score, 100);
  assert.equal(result.dimensions.voice, 25);
  assert.equal(result.dimensions.claims, 25);
  assert.equal(result.dimensions.structure, 25);
  assert.equal(result.dimensions.length, 25);
  assert.deepEqual(result.issues, []);
});

test('eval-02: scoreDraft missing brand → voice 0 + issue surfaced', async () => {
  const draftWithoutBrand = HAPPY_DRAFT_TEXT.replace(/markos/gi, 'acme');
  const result = await scoreDraft({ text: draftWithoutBrand }, HAPPY_BRIEF);
  assert.equal(result.dimensions.voice, 0);
  assert.ok(result.issues.some((i) => /voice|brand/i.test(i)), `issues must mention voice/brand: ${JSON.stringify(result.issues)}`);
  // Score must be less than 100 (100 - 25 = 75 expected).
  assert.equal(result.score, 75);
});

test('eval-03: scoreDraft missing promise → claims 0', async () => {
  const briefNoPromiseMatch = { ...HAPPY_BRIEF, promise: 'something entirely different phrase' };
  const result = await scoreDraft({ text: HAPPY_DRAFT_TEXT }, briefNoPromiseMatch);
  assert.equal(result.dimensions.claims, 0);
  assert.ok(result.issues.some((i) => /claims|promise/i.test(i)));
});

test('eval-04: scoreDraft single sentence → structure 0', async () => {
  // One sentence, but long enough (>= 20 words) and includes brand + promise.
  const oneSentence = 'markos helps founders re-fill your pipeline in 30 days via a single email cadence aimed at pipeline velocity blockers today';
  const result = await scoreDraft({ text: oneSentence }, HAPPY_BRIEF);
  assert.equal(result.dimensions.structure, 0);
  assert.ok(result.issues.some((i) => /structure|sentence/i.test(i)));
});

test('eval-05: scoreDraft length 5 words → length 0', async () => {
  const short = 'markos re-fill your pipeline today'; // 5 words
  const result = await scoreDraft({ text: short }, HAPPY_BRIEF);
  assert.equal(result.dimensions.length, 0);
  assert.ok(result.issues.some((i) => /length|range/i.test(i)));
});

// ─── eval CLI integration tests ───────────────────────────────────────────

test('eval-06: CLI eval with --draft path scoring >= threshold → exits 0', async () => {
  // Force re-require so the CLI module picks up fresh harness state.
  delete require.cache[require.resolve(EVAL_PATH)];
  const { main } = require(EVAL_PATH);
  const briefFile = tmpBriefFile(HAPPY_BRIEF_YAML);
  const draftFile = tmpDraftFile(HAPPY_DRAFT_TEXT);
  const r = await runCli(() => main({ cli: { positional: [briefFile], draft: draftFile, json: true } }));
  assert.equal(r.exitCode, 0);
  const parsed = JSON.parse(r.stdout.trim());
  assert.equal(parsed.score, 100);
});

test('eval-07: CLI eval --threshold=80 with draft score 75 → exits 1', async () => {
  delete require.cache[require.resolve(EVAL_PATH)];
  const { main } = require(EVAL_PATH);
  // Remove brand to drop score by 25 — score becomes 75, threshold 80.
  const draftWithoutBrand = HAPPY_DRAFT_TEXT.replace(/markos/gi, 'acme');
  const briefFile = tmpBriefFile(HAPPY_BRIEF_YAML);
  const draftFile = tmpDraftFile(draftWithoutBrand);
  const r = await runCli(() => main({
    cli: { positional: [briefFile], draft: draftFile, threshold: 80, json: true },
  }));
  assert.equal(r.exitCode, 1, 'score (75) < threshold (80) → exit 1');
  const parsed = JSON.parse(r.stdout.trim());
  assert.equal(parsed.score, 75);
  assert.equal(parsed.threshold, 80);
});

test('eval-08: CLI eval without --draft regenerates via runDraft → score displayed', async () => {
  delete require.cache[require.resolve(EVAL_PATH)];
  const { main } = require(EVAL_PATH);
  const briefFile = tmpBriefFile(HAPPY_BRIEF_YAML);
  const r = await runCli(() => main({ cli: { positional: [briefFile], json: true } }));
  const parsed = JSON.parse(r.stdout.trim());
  // Score present and within the scoring range.
  assert.ok(Number.isFinite(parsed.score));
  assert.ok(parsed.score >= 0 && parsed.score <= 100);
  assert.ok(parsed.dimensions && typeof parsed.dimensions === 'object');
});

test('eval-09: JSON output in non-TTY contains score + dimensions + issues', async () => {
  delete require.cache[require.resolve(EVAL_PATH)];
  const { main } = require(EVAL_PATH);
  const briefFile = tmpBriefFile(HAPPY_BRIEF_YAML);
  const draftFile = tmpDraftFile(HAPPY_DRAFT_TEXT);
  const r = await runCli(() => main({ cli: { positional: [briefFile], draft: draftFile, json: true } }));
  const parsed = JSON.parse(r.stdout.trim());
  assert.ok('score' in parsed);
  assert.ok(parsed.dimensions);
  assert.ok(Array.isArray(parsed.issues));
  assert.ok(Number.isFinite(parsed.threshold));
  assert.ok('word_count' in parsed);
  assert.ok('sentence_count' in parsed);
});

test('eval-meta: eval.cjs is not a stub + no tenant round-trip + wires via eval-runner', () => {
  const text = fs.readFileSync(EVAL_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/scoreDraft/.test(text), 'eval.cjs must use scoreDraft from eval-runner');
  assert.ok(/require\(['"]\.\.\/lib\/eval-runner\.cjs['"]\)/.test(text), 'eval.cjs must require eval-runner.cjs');
  // D-03 guardrail: no /api/tenant network call.
  assert.ok(!/\/api\/tenant/.test(text), 'eval.cjs must NOT reference /api/tenant (local only per D-03)');
  // Runner file shape.
  const runnerText = fs.readFileSync(EVAL_RUNNER_PATH, 'utf8');
  for (const dim of ['voice', 'claims', 'structure', 'length']) {
    assert.ok(new RegExp(dim).test(runnerText), `eval-runner must reference dimension: ${dim}`);
  }
  assert.ok(/scoreDraft/.test(runnerText), 'eval-runner must export scoreDraft');
});
