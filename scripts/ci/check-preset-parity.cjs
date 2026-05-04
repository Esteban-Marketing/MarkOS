#!/usr/bin/env node
'use strict';

// Phase 200.1 D-210: byte-parity gate between bin/lib/presets and
// .agent/markos/templates/presets. Canonical mode tolerates whitespace and
// key-order drift; strict mode compares raw bytes.

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BIN_DIR = 'bin/lib/presets';
const DEFAULT_AGENT_DIR = '.agent/markos/templates/presets';

function parseArgs(argv) {
  const args = {
    binDir: DEFAULT_BIN_DIR,
    agentDir: DEFAULT_AGENT_DIR,
    strict: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--strict') {
      args.strict = true;
      continue;
    }
    if (token === '--bin-dir') {
      args.binDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--agent-dir') {
      args.agentDir = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`unknown_argument:${token}`);
  }

  if (!args.binDir) throw new Error('missing_argument:--bin-dir');
  if (!args.agentDir) throw new Error('missing_argument:--agent-dir');

  return args;
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

function canonical(jsonString) {
  return JSON.stringify(sortKeysDeep(JSON.parse(jsonString)), null, 2);
}

function buildDiffSnippet(leftText, rightText, maxPairs = 5) {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const diffs = [];
  const maxLines = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < maxLines && diffs.length < maxPairs * 3; i += 1) {
    const leftLine = leftLines[i] ?? '';
    const rightLine = rightLines[i] ?? '';
    if (leftLine === rightLine) continue;
    diffs.push(`@@ line ${i + 1}`);
    diffs.push(`-${leftLine}`);
    diffs.push(`+${rightLine}`);
  }

  return diffs.join('\n');
}

function createProcessIo() {
  return {
    stdout(message) {
      process.stdout.write(`${message}\n`);
    },
    stderr(message) {
      process.stderr.write(`${message}\n`);
    },
  };
}

function compareTrees(args, io = createProcessIo()) {
  const binFiles = listJsonFiles(args.binDir);
  const agentFiles = listJsonFiles(args.agentDir);
  const binSet = new Set(binFiles);
  const agentSet = new Set(agentFiles);
  const errors = [];

  for (const file of binFiles) {
    if (!agentSet.has(file)) {
      errors.push(`missing in ${args.agentDir}: ${file}`);
    }
  }
  for (const file of agentFiles) {
    if (!binSet.has(file)) {
      errors.push(`extra in ${args.agentDir} (not in ${args.binDir}): ${file}`);
    }
  }

  const shared = binFiles.filter((file) => agentSet.has(file));
  for (const file of shared) {
    const binRaw = fs.readFileSync(path.join(args.binDir, file), 'utf8');
    const agentRaw = fs.readFileSync(path.join(args.agentDir, file), 'utf8');
    const binComparable = args.strict ? binRaw : canonical(binRaw);
    const agentComparable = args.strict ? agentRaw : canonical(agentRaw);

    if (binComparable === agentComparable) continue;

    const snippet = buildDiffSnippet(binComparable, agentComparable);
    errors.push(`${file}: content diverges\n${snippet}`);
  }

  if (errors.length > 0) {
    io.stderr('preset parity FAIL:');
    for (const error of errors) io.stderr(`  ${error}`);
    return { ok: false, exitCode: 1, sharedCount: shared.length, totalCount: binFiles.length, errors };
  }

  io.stdout(`preset parity OK: ${shared.length}/${binFiles.length} files match`);
  return { ok: true, exitCode: 0, sharedCount: shared.length, totalCount: binFiles.length, errors: [] };
}

function main(argv = process.argv, io = createProcessIo()) {
  try {
    const args = parseArgs(argv);
    return compareTrees(args, io);
  } catch (error) {
    io.stderr(`preset parity FAIL:\n  ${error.message}`);
    return { ok: false, exitCode: 1, sharedCount: 0, totalCount: 0, errors: [error.message] };
  }
}

if (require.main === module) {
  const result = main(process.argv, createProcessIo());
  process.exit(result.exitCode);
}

module.exports = {
  DEFAULT_BIN_DIR,
  DEFAULT_AGENT_DIR,
  parseArgs,
  listJsonFiles,
  sortKeysDeep,
  canonical,
  buildDiffSnippet,
  compareTrees,
  main,
};
