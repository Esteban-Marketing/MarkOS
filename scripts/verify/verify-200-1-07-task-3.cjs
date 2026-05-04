#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const checks = [];
const session = read('api/mcp/session.js');
const tools = read('api/mcp/tools/[toolName].js');
const create = read('api/mcp/keys/create.js');
const list = read('api/mcp/keys/list.js');
const revoke = read('api/mcp/keys/revoke.js');
const yaml = read('contracts/F-71.1-mcp-auth-bearer-v1.yaml');

function check(name, ok, detail) {
  checks.push({ name, ok, detail: ok ? '' : detail });
}

check('session_verify_bearer', /await\s+verifyBearer/.test(session), 'session.js missing verifyBearer middleware');
check('session_rate_limit', /await\s+checkBearerRateLimit|await\s+checkRateLimit\(supabase, auth/.test(session), 'session.js missing bearer rate-limit middleware');
check('session_kill_switch', /await\s+checkKillSwitch/.test(session), 'session.js missing kill-switch middleware');
check('tools_record_cost_event', /await\s+recordCostEvent/.test(tools), 'tools/[toolName].js missing inline recordCostEvent');
check('tools_inline_audit', /action:\s*'tool\.invoked'/.test(tools), 'tools/[toolName].js missing tool.invoked audit');
const auditIndex = tools.indexOf('enqueueAuditStaging');
const successIndex = tools.indexOf('writeJsonWithSpan(span, res, 200');
check(
  'tools_audit_before_response',
  auditIndex !== -1 && successIndex !== -1 && auditIndex < successIndex,
  'tool.invoked audit not emitted before success response',
);
check('keys_create_audit', /api_key\.created/.test(create), 'keys/create.js missing api_key.created audit');
check('keys_create_show_once', /plaintext_token_show_once/.test(create), 'keys/create.js missing plaintext_token_show_once');
check('keys_list_audit', /api_key\.listed/.test(list), 'keys/list.js missing api_key.listed audit');
check('keys_revoke_audit', /api_key\.revoked/.test(revoke), 'keys/revoke.js missing api_key.revoked audit');
check('yaml_bearer', /mcpBearerAuth/.test(yaml), 'F-71.1 yaml missing mcpBearerAuth scheme');
check('yaml_keys_paths', /\/api\/mcp\/keys\/create/.test(yaml) && /\/api\/mcp\/keys\/list/.test(yaml) && /\/api\/mcp\/keys\/revoke/.test(yaml), 'F-71.1 yaml missing one of the key paths');

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error('verify-200-1-07-task-3 FAIL:');
  for (const entry of failed) {
    console.error(`  - ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(`verify-200-1-07-task-3 OK: ${checks.length} checks pass`);
