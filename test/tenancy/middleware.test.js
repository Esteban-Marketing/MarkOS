'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Suite 201-05: middleware.ts exists at repo root (first middleware in repo per D-09)', () => {
  const p = path.join(__dirname, '..', '..', 'middleware.ts');
  assert.ok(fs.existsSync(p), 'middleware.ts must exist at repo root');
  const src = fs.readFileSync(p, 'utf8');
  assert.match(src, /import.*NextResponse.*NextRequest.*from 'next\/server'/);
  assert.match(src, /resolveHost/);
  assert.match(src, /x-markos-tenant-id/);
  assert.match(src, /x-markos-tenant-slug/);
  assert.match(src, /x-markos-byod/);
  assert.match(src, /\/404-workspace/);
  assert.match(src, /export const config/);
  assert.match(src, /matcher:/);
});

test('Suite 201-05: middleware.ts distinguishes reserved vs first-party vs bare vs byod', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');
  for (const k of ['bare', 'system', 'reserved', 'first_party', 'byod']) {
    assert.match(src, new RegExp(`kind === '${k}'`), `middleware must handle kind='${k}'`);
  }
});

test('Suite 201-05: middleware.ts rewrites to /404-workspace?reserved=1 on reserved slug', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');
  assert.match(src, /searchParams\.set\('reserved', '1'\)/);
});

test('Suite 201-05: middleware.ts uses matcher to exclude static assets', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');
  assert.match(src, /_next\/static/);
  assert.match(src, /favicon/);
});
