'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const TSC_BIN = path.join(REPO_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const OUT_DIR = path.join(REPO_ROOT, 'tmp', 'llm-dist-test');
const COMPILED_MARKER = path.join(OUT_DIR, '.compiled');

let isCompiled = false;

function compileOnce() {
  if (fs.existsSync(COMPILED_MARKER)) {
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  execFileSync(process.execPath, [TSC_BIN, '-p', 'tsconfig.llm.json', '--outDir', OUT_DIR], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });

  fs.writeFileSync(COMPILED_MARKER, 'ok', 'utf8');

  isCompiled = true;
}

function compileLlmModules() {
  if (!isCompiled) {
    compileOnce();
  }

  return {
    outDir: OUT_DIR,
    cleanup() {
      // Keep build artifacts stable for coverage aggregation within a single test run.
    },
  };
}

module.exports = {
  compileLlmModules,
};