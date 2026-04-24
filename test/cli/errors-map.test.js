'use strict';

// Phase 204 Plan 12 Task 2: Parity contract between bin/lib/cli/errors.cjs
// and docs/cli/errors.md.
//
// The `## Public error codes` table in errors.md is the public API surface.
// Every key in `ERROR_TO_EXIT` MUST appear in that table, and every code in
// that table MUST be a key in the map — no orphans in either direction.
//
// RFC 8628 device-flow codes (authorization_pending, slow_down, etc.) live
// in a separate documented table and are intentionally NOT part of the
// ERROR_TO_EXIT map — they are polling states, not exit states. We skip
// them here and assert they are documented in docs/cli/errors.md separately.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ERROR_TO_EXIT } = require('../../bin/lib/cli/errors.cjs');

const DOCS_PATH = path.resolve(__dirname, '..', '..', 'docs', 'cli', 'errors.md');

function readDocs() {
  return fs.readFileSync(DOCS_PATH, 'utf8');
}

// Extract the Public error codes table by splitting on section headers.
function extractPublicCodesSection(text) {
  const startMarker = '## Public error codes';
  const endMarker = '## OAuth device-flow error codes';
  const start = text.indexOf(startMarker);
  assert.ok(start >= 0, 'docs/cli/errors.md must contain "## Public error codes" section');
  const end = text.indexOf(endMarker, start);
  assert.ok(end > start, 'docs/cli/errors.md must contain OAuth device-flow section after Public error codes');
  return text.slice(start, end);
}

// Pull every ``CODE`` from a markdown table row where the code matches the
// documented UPPER_SNAKE convention.
function extractCodesFromTable(section) {
  const rowRe = /^\|\s*`([A-Z][A-Z0-9_]+)`\s*\|/gm;
  const out = new Set();
  let m;
  while ((m = rowRe.exec(section)) !== null) {
    out.add(m[1]);
  }
  return out;
}

test('errors-map: docs/cli/errors.md exists', () => {
  assert.ok(fs.existsSync(DOCS_PATH), 'docs/cli/errors.md must exist');
});

test('errors-map: every ERROR_TO_EXIT key is documented in docs/cli/errors.md', () => {
  const text = readDocs();
  const section = extractPublicCodesSection(text);
  const docCodes = extractCodesFromTable(section);
  const mapKeys = new Set(Object.keys(ERROR_TO_EXIT));

  const missingInDocs = [...mapKeys].filter((k) => !docCodes.has(k));
  assert.deepStrictEqual(
    missingInDocs,
    [],
    `Codes in ERROR_TO_EXIT but not documented: ${JSON.stringify(missingInDocs)}`,
  );
});

test('errors-map: every documented public code is a key in ERROR_TO_EXIT', () => {
  const text = readDocs();
  const section = extractPublicCodesSection(text);
  const docCodes = extractCodesFromTable(section);
  const mapKeys = new Set(Object.keys(ERROR_TO_EXIT));

  const missingInMap = [...docCodes].filter((c) => !mapKeys.has(c));
  assert.deepStrictEqual(
    missingInMap,
    [],
    `Codes documented but missing from ERROR_TO_EXIT: ${JSON.stringify(missingInMap)}`,
  );
});

test('errors-map: set equivalence — doc codes match map keys exactly', () => {
  const text = readDocs();
  const section = extractPublicCodesSection(text);
  const docCodes = [...extractCodesFromTable(section)].sort();
  const mapKeys = [...Object.keys(ERROR_TO_EXIT)].sort();
  assert.deepStrictEqual(docCodes, mapKeys);
});

test('errors-map: device-flow codes are documented in their own section', () => {
  const text = readDocs();
  const deviceFlowCodes = [
    'authorization_pending',
    'slow_down',
    'expired_token',
    'access_denied',
  ];
  for (const code of deviceFlowCodes) {
    assert.ok(
      text.includes(`\`${code}\``),
      `device-flow code ${code} must be documented in docs/cli/errors.md`,
    );
  }
});
