'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const REPO_ROOT = process.cwd();
const STRIDE_DIR = path.join(REPO_ROOT, '.planning/phases/200.1-saas-readiness-hardening/threat-models');
const STRIDE_FILES = ['mcp-stride.md', 'webhooks-stride.md', 'marketplace-stride.md'];

const FILE_REF_RE = /\b(?:test|lib|api|scripts|supabase)\/[\w./\-[\]]+?\.(?:test\.)?(?:js|cjs|ts|sql|md)\b/g;
const PLAN_ID_RE = /\b200\.1-(0[1-9]|10|11)\b/g;
const THREAT_ID_RE = /T-200\.1-(?:mcp|webhooks|marketplace)-(?:S|T|R|I|D|E)-\d{2}/;
const DEFERRED_TAG_RE = /\(deferred\)/i;

function parseTableRows(markdown) {
  const rows = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!THREAT_ID_RE.test(line)) continue;
    if (!line.trim().startsWith('|')) continue;
    rows.push({ lineNo: i + 1, raw: line });
  }
  return rows;
}

function extractCells(rowRaw) {
  return rowRaw
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function extractVerifierCell(rowRaw) {
  const cells = extractCells(rowRaw);
  return cells.length >= 5 ? cells[4] : rowRaw;
}

function collectMatches(regex, text) {
  return [...text.matchAll(new RegExp(regex.source, regex.flags))].map((match) => match[0]);
}

function planIdResolves(planId) {
  const planPath = path.join(
    REPO_ROOT,
    '.planning/phases/200.1-saas-readiness-hardening',
    `${planId}-PLAN.md`,
  );
  return fs.existsSync(planPath);
}

function validateFileRefs(fileName) {
  const fullPath = path.join(STRIDE_DIR, fileName);
  const markdown = fs.readFileSync(fullPath, 'utf8');
  const failures = [];

  for (const row of parseTableRows(markdown)) {
    const verifierCell = extractVerifierCell(row.raw);
    if (DEFERRED_TAG_RE.test(verifierCell)) continue;
    const fileRefs = collectMatches(FILE_REF_RE, verifierCell);
    for (const ref of fileRefs) {
      if (!fs.existsSync(path.join(REPO_ROOT, ref))) {
        const threatId = extractCells(row.raw)[0];
        failures.push(`${fileName}:${row.lineNo} :: row ${threatId} :: unresolved reference: ${ref}`);
      }
    }
  }

  return failures;
}

function validatePlanRefs(fileName) {
  const fullPath = path.join(STRIDE_DIR, fileName);
  const markdown = fs.readFileSync(fullPath, 'utf8');
  const failures = [];

  for (const row of parseTableRows(markdown)) {
    const verifierCell = extractVerifierCell(row.raw);
    if (DEFERRED_TAG_RE.test(verifierCell)) continue;
    const planRefs = collectMatches(PLAN_ID_RE, row.raw);
    for (const ref of planRefs) {
      if (!planIdResolves(ref)) {
        const threatId = extractCells(row.raw)[0];
        failures.push(`${fileName}:${row.lineNo} :: row ${threatId} :: unresolved reference: ${ref}`);
      }
    }
  }

  return failures;
}

test('stride-references :: parseTableRows finds threat rows', () => {
  const rows = parseTableRows([
    '| Threat ID | Threat | Mitigation | Residual risk | Verifier |',
    '|-----------|--------|------------|---------------|----------|',
    '| T-200.1-webhooks-S-01 | Example | 200.1-01 | low | api/webhooks/subscribe.js |',
  ].join('\n'));

  assert.equal(rows.length, 1);
  assert.equal(rows[0].lineNo, 3);
});

test('stride-references :: extractVerifierCell returns final cell', () => {
  const verifier = extractVerifierCell('| T-200.1-mcp-S-01 | Threat | 200.1-07 | low | api/mcp/session.js |');
  assert.equal(verifier, 'api/mcp/session.js');
});

test('stride-references :: planIdResolves current wave plan ids', () => {
  assert.equal(planIdResolves('200.1-01'), true);
  assert.equal(planIdResolves('200.1-11'), true);
});

for (const fileName of STRIDE_FILES) {
  test(`stride-references :: ${fileName} :: file references resolve`, () => {
    const fullPath = path.join(STRIDE_DIR, fileName);
    assert.ok(fs.existsSync(fullPath), `Missing STRIDE file: ${fullPath}`);

    const failures = validateFileRefs(fileName);
    assert.deepEqual(failures, [], failures.join('\n'));
  });

  test(`stride-references :: ${fileName} :: plan references resolve`, () => {
    const fullPath = path.join(STRIDE_DIR, fileName);
    assert.ok(fs.existsSync(fullPath), `Missing STRIDE file: ${fullPath}`);

    const failures = validatePlanRefs(fileName);
    assert.deepEqual(failures, [], failures.join('\n'));
  });
}

test('stride-references :: every required STRIDE file is present', () => {
  for (const fileName of STRIDE_FILES) {
    const fullPath = path.join(STRIDE_DIR, fileName);
    assert.ok(fs.existsSync(fullPath), `Missing STRIDE file: ${fullPath}`);
  }
});
