'use strict';

// Suite 202-10: Claude Marketplace manifest validation.
// Asserts marketplace.json is cert-ready per RESEARCH §"Claude Marketplace Cert Checklist".

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MANIFEST_PATH = path.join(__dirname, '..', '..', '.claude-plugin', 'marketplace.json');
const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

test('Suite 202-10: marketplace.json version bumped to 2.0.0', () => {
  assert.equal(MANIFEST.version, '2.0.0');
});

test('Suite 202-10: marketplace.json declares exactly 30 tools (D-02 "30 tools all live")', () => {
  assert.equal(MANIFEST.tools.length, 30);
});

test('Suite 202-10: marketplace.json tool names mirror TOOL_DEFINITIONS', () => {
  const { TOOL_DEFINITIONS } = require('../../lib/markos/mcp/tools/index.cjs');
  const manifestNames = new Set(MANIFEST.tools.map(t => t.name));
  for (const def of TOOL_DEFINITIONS) {
    assert.ok(manifestNames.has(def.name), `marketplace.json missing tool: ${def.name}`);
  }
});

test('Suite 202-10: every marketplace tool has a non-empty description', () => {
  for (const t of MANIFEST.tools) {
    assert.ok(t.name && typeof t.name === 'string', `tool missing name`);
    assert.ok(t.description && typeof t.description === 'string' && t.description.length > 0,
      `tool ${t.name} missing description`);
  }
});

test('Suite 202-10: server.protocolVersion is 2025-06-18', () => {
  assert.equal(MANIFEST.server.protocolVersion, '2025-06-18');
});

test('Suite 202-10: server.type is http + server.url is https + points at /api/mcp', () => {
  assert.equal(MANIFEST.server.type, 'http');
  assert.ok(MANIFEST.server.url.startsWith('https://'), `server.url must be https, got ${MANIFEST.server.url}`);
  assert.match(MANIFEST.server.url, /\/api\/mcp$/, `server.url must end with /api/mcp, got ${MANIFEST.server.url}`);
});

test('Suite 202-10: pricing tiers declared (D-21 $1/day free + paid)', () => {
  assert.ok(MANIFEST.pricing, 'pricing block missing');
  assert.ok(Array.isArray(MANIFEST.pricing.tiers), 'pricing.tiers must be array');
  const names = MANIFEST.pricing.tiers.map(t => t.name);
  assert.ok(names.includes('free'), 'missing free tier');
  assert.ok(names.includes('paid'), 'missing paid tier');
});

test('Suite 202-10: description matches D-24 listing copy tone ("30 tools" + Claude-native mentioned)', () => {
  assert.match(MANIFEST.description, /30 tools/);
  assert.match(MANIFEST.description, /Claude-native/);
});

test('Suite 202-10: icon field references public/mcp-icon.png', () => {
  assert.equal(MANIFEST.icon, '/mcp-icon.png');
});

test('Suite 202-10: primary category is marketing (D-22)', () => {
  assert.ok(MANIFEST.categories.includes('marketing'), 'marketing category missing');
});

test('Suite 202-10: icon file exists on disk', () => {
  const p = path.join(__dirname, '..', '..', 'public', 'mcp-icon.png');
  assert.ok(fs.existsSync(p), `missing icon file: ${p}`);
});

test('Suite 202-10: icon file is a real 512x512 PNG (M3 — no 1x1 placeholder)', () => {
  const p = path.join(__dirname, '..', '..', 'public', 'mcp-icon.png');
  const buf = fs.readFileSync(p);
  assert.ok(buf.length >= 24, 'icon file too small to parse PNG header');
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  assert.equal(buf.readUInt32BE(0), 0x89504E47, 'PNG signature mismatch (first 4 bytes)');
  // IHDR chunk width at bytes 16-19, height at bytes 20-23
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  assert.equal(w, 512, `icon width must be 512, got ${w}`);
  assert.equal(h, 512, `icon height must be 512, got ${h}`);
});

test('Suite 202-10: $schema references Anthropic claude-marketplace', () => {
  assert.match(MANIFEST.$schema, /claude-marketplace/);
});

test('Suite 202-10: homepage + repository fields present (cert checklist)', () => {
  assert.equal(MANIFEST.homepage, 'https://markos.dev');
  assert.ok(MANIFEST.repository, 'repository field missing');
});
