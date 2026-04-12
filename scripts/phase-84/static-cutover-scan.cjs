#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const vectorStorePath = path.join(repoRoot, 'onboarding', 'backend', 'vector-store-client.cjs');
const pageIndexPath = path.join(repoRoot, 'onboarding', 'backend', 'pageindex', 'pageindex-client.cjs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractFunctionBody(source, functionName) {
  const signature = `async function ${functionName}`;
  const start = source.indexOf(signature);
  if (start === -1) {
    throw new Error(`Missing function ${functionName} in vector-store-client.cjs`);
  }

  const braceStart = source.indexOf('{', start);
  if (braceStart === -1) {
    throw new Error(`Missing function body for ${functionName}`);
  }

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  throw new Error(`Unbalanced braces for ${functionName}`);
}

function checkBannedTokens(label, content, bannedTokens, violations) {
  for (const token of bannedTokens) {
    if (content.includes(token)) {
      violations.push(`${label}: found banned token ${token}`);
    }
  }
}

function main() {
  const vectorSource = read(vectorStorePath);
  const pageIndexSource = read(pageIndexPath);

  const activeRetrievalBodies = [
    ['vector-store-client#getContext', extractFunctionBody(vectorSource, 'getContext')],
    ['vector-store-client#getLiteracyContext', extractFunctionBody(vectorSource, 'getLiteracyContext')],
    ['pageindex-client#createPageIndexAdapter', pageIndexSource],
  ];

  const bannedTokens = [
    "@upstash/vector",
    'getUpstashIndex(',
  ];

  const violations = [];
  for (const [label, content] of activeRetrievalBodies) {
    checkBannedTokens(label, content, bannedTokens, violations);
  }

  if (violations.length > 0) {
    console.error('[phase-84] static cutover scan failed');
    for (const violation of violations) {
      console.error(` - ${violation}`);
    }
    process.exit(1);
  }

  console.log('[phase-84] static cutover scan passed');
  process.exit(0);
}

main();
