#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { buildFileHashes } = require('../bin/cli-runtime.cjs');

const repoRoot = path.resolve(__dirname, '..');

const targets = {
  shared: {
    key: 'shared',
    rootDir: path.join(repoRoot, '.github'),
    sourceDir: path.join(repoRoot, '.github', 'get-shit-done'),
    manifestPath: path.join(repoRoot, '.github', 'gsd-file-manifest.json'),
    versionPath: path.join(repoRoot, '.github', 'get-shit-done', 'VERSION'),
  },
  localized: {
    key: 'localized',
    rootDir: path.join(repoRoot, '.claude'),
    sourceDir: path.join(repoRoot, '.claude', 'get-shit-done'),
    manifestPath: path.join(repoRoot, '.claude', 'gsd-file-manifest.json'),
    versionPath: path.join(repoRoot, '.claude', 'get-shit-done', 'VERSION'),
  },
};

function parseArgs(argv) {
  const parsed = { check: false, target: 'all' };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--check') {
      parsed.check = true;
    } else if (token.startsWith('--target=')) {
      parsed.target = token.slice('--target='.length);
    } else if (token === '--target') {
      parsed.target = argv[index + 1] || parsed.target;
      index += 1;
    } else if (token === '--help' || token === '-h') {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return parsed;
}

function printHelp() {
  console.log('Usage: node tools/gsd-refresh-manifest.cjs [--target shared|localized|all] [--check]');
}

function ensureTarget(name) {
  if (name === 'all') {
    return [targets.shared, targets.localized];
  }
  const target = targets[name];
  if (!target) {
    throw new Error(`Unknown target: ${name}`);
  }
  return [target];
}

function sortObject(input) {
  return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)));
}

function normalizeKeys(input) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.replace(/\\/g, '/'), value])
  );
}

function buildManifest(target) {
  const version = fs.readFileSync(target.versionPath, 'utf8').trim();
  const files = sortObject(normalizeKeys(buildFileHashes(target.sourceDir, target.sourceDir, {})));
  return {
    version,
    timestamp: new Date().toISOString(),
    files,
  };
}

function loadManifest(target) {
  return JSON.parse(fs.readFileSync(target.manifestPath, 'utf8'));
}

function verifyManifest(target) {
  const expected = buildManifest(target);
  const current = loadManifest(target);

  if (!current.timestamp || typeof current.timestamp !== 'string') {
    throw new Error(`Manifest missing timestamp: ${path.relative(repoRoot, target.manifestPath)}`);
  }

  if (current.version !== expected.version) {
    throw new Error(`Manifest version mismatch: ${path.relative(repoRoot, target.manifestPath)}`);
  }

  const currentFiles = sortObject(current.files || {});
  const expectedFiles = expected.files;
  const currentKeys = Object.keys(currentFiles);
  const expectedKeys = Object.keys(expectedFiles);

  if (currentKeys.length !== expectedKeys.length) {
    throw new Error(`Manifest file count mismatch: ${path.relative(repoRoot, target.manifestPath)}`);
  }

  for (const key of expectedKeys) {
    if (!Object.hasOwn(currentFiles, key)) {
      throw new Error(`Manifest missing file entry ${key}: ${path.relative(repoRoot, target.manifestPath)}`);
    }
    if (currentFiles[key] !== expectedFiles[key]) {
      throw new Error(`Manifest hash mismatch for ${key}: ${path.relative(repoRoot, target.manifestPath)}`);
    }
  }
}

function writeManifest(target) {
  const manifest = buildManifest(target);
  fs.writeFileSync(target.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const selectedTargets = ensureTarget(args.target);

  if (args.check) {
    for (const target of selectedTargets) {
      verifyManifest(target);
      console.log(`Verified ${target.key} manifest`);
    }
    return;
  }

  for (const target of selectedTargets) {
    writeManifest(target);
    console.log(`Wrote ${path.relative(repoRoot, target.manifestPath)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildManifest,
  ensureTarget,
  normalizeKeys,
  parseArgs,
  repoRoot,
  targets,
  verifyManifest,
};