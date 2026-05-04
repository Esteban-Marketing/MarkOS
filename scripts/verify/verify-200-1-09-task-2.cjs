#!/usr/bin/env node
'use strict';

// Phase 200.1 Plan 09 Task 2 verifier.
// Replaces the prior shell-escaped inline regex / awk approach with a plain Node reader.

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.cwd();

const HANDLERS = [
  ['api/webhooks/subscribe.js', 'webhook.subscribe'],
  ['api/webhooks/unsubscribe.js', 'webhook.unsubscribe'],
  ['api/webhooks/list.js', 'webhook.list'],
  ['api/webhooks/test-fire.js', 'webhook.test_fire'],
  ['api/webhooks/rotate-secret.js', 'webhook.rotate_secret'],
  ['api/mcp/session.js', 'mcp.session'],
  ['api/mcp/tools/[toolName].js', 'mcp.tool'],
  ['api/mcp/keys/create.js', 'mcp.keys.create'],
  ['api/mcp/keys/list.js', 'mcp.keys.list'],
  ['api/mcp/keys/revoke.js', 'mcp.keys.revoke'],
];

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
}

function main() {
  const failures = [];
  let totalTenantSetters = 0;

  for (const [file, spanName] of HANDLERS) {
    let source;
    try {
      source = read(file);
    } catch (error) {
      failures.push(`${file}: cannot read (${error.message})`);
      continue;
    }

    if (!source.includes('observability/otel')) {
      failures.push(`${file}: missing observability/otel require`);
    }

    if (!source.includes(`withSpan('${spanName}'`) && !source.includes(`withSpan("${spanName}"`)) {
      failures.push(`${file}: missing withSpan('${spanName}')`);
    }

    const tenantMatches = source.match(/setAttribute\(\s*['"]tenant_id['"]/g) || [];
    totalTenantSetters += tenantMatches.length;
  }

  try {
    const toolsSource = read('api/mcp/tools/[toolName].js');
    if (!toolsSource.includes(`recordEvent('mcp.tool.invoked'`) && !toolsSource.includes(`recordEvent("mcp.tool.invoked"`)) {
      failures.push(`api/mcp/tools/[toolName].js: missing recordEvent('mcp.tool.invoked')`);
    }
  } catch (error) {
    failures.push(`api/mcp/tools/[toolName].js: cannot read (${error.message})`);
  }

  if (totalTenantSetters < 7) {
    failures.push(`aggregate: only ${totalTenantSetters} setAttribute('tenant_id', ...) calls across 10 handlers (need >=7)`);
  }

  if (failures.length > 0) {
    console.error('verify-200-1-09-task-2 FAIL:');
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log(`verify-200-1-09-task-2 OK: ${HANDLERS.length} handlers wired; ${totalTenantSetters} tenant_id setAttribute calls`);
}

main();
