#!/usr/bin/env node
'use strict';

/**
 * Reads contracts/openapi.json info.version and writes it into:
 *   - sdk/typescript/package.json "version"
 *   - sdk/python/pyproject.toml "version"
 *
 * Called by CI on contracts/openapi.json changes.
 */

const fs = require('node:fs');
const path = require('node:path');

function readOpenApiVersion() {
  const doc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'contracts', 'openapi.json'), 'utf8'));
  const version = doc?.info?.version;
  if (!version || typeof version !== 'string') throw new Error('openapi info.version missing or not a string');
  return version;
}

function bumpTsPackage(version) {
  const p = path.resolve(__dirname, '..', '..', 'sdk', 'typescript', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (pkg.version === version) return { changed: false, path: p, previous: pkg.version };
  const previous = pkg.version;
  pkg.version = version;
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
  return { changed: true, path: p, previous };
}

function bumpPythonProject(version) {
  const p = path.resolve(__dirname, '..', '..', 'sdk', 'python', 'pyproject.toml');
  const text = fs.readFileSync(p, 'utf8');
  const match = text.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) throw new Error('pyproject.toml missing version line');
  if (match[1] === version) return { changed: false, path: p, previous: match[1] };
  const previous = match[1];
  const next = text.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
  fs.writeFileSync(p, next);
  return { changed: true, path: p, previous };
}

function main() {
  const version = readOpenApiVersion();
  const ts = bumpTsPackage(version);
  const py = bumpPythonProject(version);
  console.log(`openapi info.version = ${version}`);
  console.log(`  ts  : ${ts.changed ? `${ts.previous} → ${version}` : 'unchanged'}`);
  console.log(`  py  : ${py.changed ? `${py.previous} → ${version}` : 'unchanged'}`);
}

if (require.main === module) main();

module.exports = { readOpenApiVersion, bumpTsPackage, bumpPythonProject };
