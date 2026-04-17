'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const LANDING_PATH = path.join(ROOT, 'app', '(marketing)', 'integrations', 'claude', 'page.tsx');
const DEMO_PATH = path.join(ROOT, 'app', '(marketing)', 'integrations', 'claude', 'demo', 'page.tsx');
const DEMO_API_PATH = path.join(ROOT, 'app', '(marketing)', 'integrations', 'claude', 'demo', 'api', 'route.ts');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

// ─── A11y / source-level checks ───────────────────────────────────────────────

test('landing page file exists', () => {
  assert.equal(fs.existsSync(LANDING_PATH), true);
});

test('demo sandbox page file exists', () => {
  assert.equal(fs.existsSync(DEMO_PATH), true);
});

test('demo API route file exists', () => {
  assert.equal(fs.existsSync(DEMO_API_PATH), true);
});

test('landing page has single top-level h1', () => {
  const source = read(LANDING_PATH);
  const h1Matches = source.match(/<h1[\s>]/g) || [];
  assert.equal(h1Matches.length, 1, `expected exactly one <h1>, found ${h1Matches.length}`);
});

test('landing page sections carry aria-labelledby', () => {
  const source = read(LANDING_PATH);
  const sectionMatches = source.match(/<section[^>]*>/g) || [];
  for (const section of sectionMatches) {
    assert.ok(/aria-labelledby=/.test(section), `section missing aria-labelledby: ${section}`);
  }
});

test('landing page exports Metadata with title + description + openGraph', () => {
  const source = read(LANDING_PATH);
  assert.match(source, /export const metadata: Metadata/);
  assert.match(source, /title:/);
  assert.match(source, /description:/);
  assert.match(source, /openGraph/);
});

test('demo form inputs have explicit label associations', () => {
  const source = read(DEMO_PATH);
  // Capture id attributes ONLY on <input .../> tags.
  const inputTagIds = [...source.matchAll(/<input[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  const htmlForTargets = [...source.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]);
  for (const id of inputTagIds) {
    assert.ok(htmlForTargets.includes(id), `input id=${id} lacks matching label htmlFor`);
  }
  assert.ok(inputTagIds.length >= 5, `expected >=5 demo inputs, found ${inputTagIds.length}`);
});

test('demo page has role="alert" on error surface', () => {
  const source = read(DEMO_PATH);
  assert.match(source, /role="alert"/);
});

// ─── Security checks ──────────────────────────────────────────────────────────

test('no inline dangerouslySetInnerHTML on public pages', () => {
  const source = read(LANDING_PATH) + read(DEMO_PATH);
  assert.equal(/dangerouslySetInnerHTML/.test(source), false);
});

test('no inline <script> tags on public pages', () => {
  const source = read(LANDING_PATH) + read(DEMO_PATH);
  assert.equal(/<script[\s>]/i.test(source), false);
});

test('demo API route enforces tool allow-list', () => {
  const source = read(DEMO_API_PATH);
  assert.match(source, /ALLOWED_TOOLS/);
  assert.match(source, /TOOL_NOT_PERMITTED/);
});

test('demo API route rate-limits per ip', () => {
  const source = read(DEMO_API_PATH);
  assert.match(source, /RATE_LIMIT|rateCheck/);
  assert.match(source, /RATE_LIMITED/);
});

// ─── Voice classifier (heuristic) ─────────────────────────────────────────────

function scoreVoice(source) {
  // Score out of 100. Deterministic heuristic that mirrors what a trained
  // neuro-audit classifier would flag for the archetypes + pains the plan
  // calls out: solopreneur + vibe-coder / content_engagement + pipeline_velocity.
  let score = 60;
  const lower = source.toLowerCase();

  // Brand presence
  if (/\bmarkos\b/.test(lower)) score += 6;

  // Pain acknowledgment (content_engagement / pipeline_velocity)
  if (/pipeline velocity|pipeline_velocity/.test(lower)) score += 6;
  if (/draft|engagement|canon/.test(lower)) score += 4;

  // Promise delivery
  if (/(ship|draft|audit|schedule).+\b(chat|window|claude|draft|audit)/.test(lower)) score += 6;

  // Archetype resonance
  if (/solopreneur|vibe-?coder|founder/.test(lower)) score += 4;

  // CTA clarity
  if (/(try the demo|read the quickstart|open the demo|install)/.test(lower)) score += 6;

  // Concrete primitives mentioned
  if (/run_neuro_audit|rank_execution_queue|schedule_post|draft_message/.test(source)) score += 4;

  // Anti-fluff: penalize marketing filler
  if (/(revolutionary|game[- ]changing|cutting[- ]edge|seamlessly)/i.test(source)) score -= 10;

  return Math.max(0, Math.min(100, score));
}

test('landing copy scores >= 85 on heuristic voice classifier', () => {
  const source = read(LANDING_PATH);
  const score = scoreVoice(source);
  assert.ok(score >= 85, `voice score ${score} below threshold 85`);
});
