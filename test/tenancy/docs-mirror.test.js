'use strict';

// Phase 201 Plan 08 Task 2: docs-as-code gate (QA-15).
// Every new docs/*.md file ships + is enumerated in llms.txt.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const NEW_DOCS = [
  'docs/routing.md',
  'docs/admin.md',
  'docs/tenancy-lifecycle.md',
  'docs/gdpr-export.md',
  'docs/llms/phase-201-tenancy.md',
];

function readLlmsTxt() {
  // Phase 200 llms.txt lives in public/llms.txt — appending phase-201 section there keeps
  // the canonical location. If a repo-root llms.txt also exists (legacy / preview), accept it.
  const candidates = [
    path.join(__dirname, '..', '..', 'public', 'llms.txt'),
    path.join(__dirname, '..', '..', 'llms.txt'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('llms.txt not found at public/llms.txt or repo root');
}

test('Suite 201-08: all 5 new docs files exist', () => {
  for (const f of NEW_DOCS) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', '..', f)), `${f} missing`);
  }
});

test('Suite 201-08: llms.txt references all 5 new docs pages', () => {
  const llms = readLlmsTxt();
  for (const f of NEW_DOCS) {
    const stem = path.basename(f, '.md');
    assert.match(llms, new RegExp(stem), `llms.txt does not reference ${f} (stem: ${stem})`);
  }
  assert.match(llms, /Phase 201/i);
});

test('Suite 201-08: docs/routing.md documents all 5 host kinds', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'routing.md'), 'utf8');
  for (const kind of ['bare', 'system', 'reserved', 'first_party', 'byod']) {
    assert.match(src, new RegExp(kind));
  }
});

test('Suite 201-08: docs/tenancy-lifecycle.md documents 30-day + 3 states', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'tenancy-lifecycle.md'), 'utf8');
  assert.match(src, /30 days|day 30/i);
  assert.match(src, /offboarding/);
  assert.match(src, /purged/);
  assert.match(src, /cancel/i);
});

test('Suite 201-08: docs/gdpr-export.md documents BUNDLE_DOMAINS + 7 day signed URL', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'gdpr-export.md'), 'utf8');
  assert.match(src, /BUNDLE_DOMAINS|tenant\.json|members\.json/);
  assert.match(src, /7.day|604800/i);
});
