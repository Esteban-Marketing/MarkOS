#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

const issueTokenFile = 'app/(marketing)/integrations/claude/demo/api/issue-token/route.ts';
const invokeFile = 'app/(marketing)/integrations/claude/demo/api/invoke/route.ts';

const issueToken = read(issueTokenFile);
const invoke = read(invokeFile);

const checks = [
  [issueTokenFile, /export const runtime = 'nodejs'|export const runtime = "nodejs"/, 'missing runtime = nodejs'],
  [issueTokenFile, /withSpan\(['"]demo\.issue_token['"]/, 'missing withSpan(\'demo.issue_token\')'],
  [issueTokenFile, /issueDemoSessionToken/, 'missing issueDemoSessionToken call'],
  [invokeFile, /export const runtime = 'nodejs'|export const runtime = "nodejs"/, 'missing runtime = nodejs'],
  [invokeFile, /withSpan\(['"]demo\.invoke['"]/, 'missing withSpan(\'demo.invoke\')'],
  [invokeFile, /verifyDemoSessionToken/, 'missing verifyDemoSessionToken call'],
  [invokeFile, /assertToolAllowed/, 'missing assertToolAllowed call'],
  [invokeFile, /recordDemoCost/, 'missing recordDemoCost call'],
  [invokeFile, /cost_cap_exceeded/, 'missing cost_cap_exceeded rejection'],
  [invokeFile, /,\s*402\s*\)/, 'missing 402 status for cost-cap rejection'],
  [invokeFile, /draft-message\.cjs/, 'missing draft-message hand import'],
  [invokeFile, /audit-claim\.cjs/, 'missing audit-claim hand import'],
  [invokeFile, /if\s*\(\s*tool_name\s*===\s*['"]draft_message['"]\s*\)/, 'missing draft_message branch'],
  [invokeFile, /else if\s*\(\s*tool_name\s*===\s*['"]audit_claim['"]\s*\)/, 'missing audit_claim branch'],
];

const failures = [];

for (const [file, pattern, message] of checks) {
  const source = file === issueTokenFile ? issueToken : invoke;
  if (!pattern.test(source)) failures.push(`${file}: ${message}`);
}

if (/tools\.dispatch\s*\(/.test(invoke)) {
  failures.push(`${invokeFile}: tools.dispatch(...) must not be used`);
}

if (failures.length) {
  console.error('verify-200-1-10-task-2 FAIL:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('verify-200-1-10-task-2 OK: issue-token + invoke routes wired with direct hand-dispatch.');
