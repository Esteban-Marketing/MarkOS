#!/usr/bin/env node
'use strict';

// Phase 200.1 Plan 09 Task 3: OTEL coverage gate.
// Ensures every api/webhooks/*.js and api/mcp/**/*.js handler opts into withSpan().
// The allowlist stays explicit and intentionally tiny; add entries only for handlers
// whose lifecycle truly cannot be represented by a request-scoped span.

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.cwd();
const WEBHOOK_ROOT = path.join(REPO_ROOT, 'api', 'webhooks');
const MCP_ROOT = path.join(REPO_ROOT, 'api', 'mcp');

const ALLOWLIST = Object.freeze({
  // Intentionally empty today. Keep the object explicit so future exceptions
  // are reviewed instead of being silently skipped.
});

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function listFilesRecursive(rootDir) {
  const out = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) out.push(fullPath);
  }
  return out;
}

function listWebhookFiles() {
  return fs.readdirSync(WEBHOOK_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(WEBHOOK_ROOT, entry.name));
}

function listCandidateFiles() {
  return [
    ...listWebhookFiles(),
    ...listFilesRecursive(MCP_ROOT),
  ].map((filePath) => toPosix(path.relative(REPO_ROOT, filePath)));
}

function isIgnored(relPath) {
  if (relPath.includes('/__tests__/')) return true;
  if (relPath.includes('/node_modules/')) return true;
  if (ALLOWLIST[relPath]) return true;
  return false;
}

function main() {
  const missing = [];
  const checked = [];

  for (const relPath of listCandidateFiles()) {
    if (isIgnored(relPath)) continue;

    const source = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    checked.push(relPath);

    if (!source.includes('withSpan(')) {
      missing.push(relPath);
    }
  }

  if (missing.length > 0) {
    console.error('OTEL coverage check failed. Missing withSpan() in:');
    for (const relPath of missing) {
      console.error(`- ${relPath}`);
    }
    process.exit(1);
  }

  console.log(`OTEL coverage OK: ${checked.length} handler files contain withSpan().`);
}

main();
