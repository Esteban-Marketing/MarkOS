#!/usr/bin/env node
'use strict';

const { createCompanyKnowledgeAdapter } = require('../onboarding/backend/mcp/company-knowledge-adapter.cjs');
const { createMarkosCompanyKnowledgeServer } = require('../onboarding/backend/mcp/markos-company-knowledge-server.cjs');

function printUsage() {
  process.stdout.write([
    'Usage:',
    "  node bin/markos-company-knowledge.cjs search '{\"query\":\"revops\"}'",
    "  node bin/markos-company-knowledge.cjs fetch '{\"uri\":\"markos://tenant/tenant-alpha-001/mir/mir-1\"}'",
    '  node bin/markos-company-knowledge.cjs server',
  ].join('\n') + '\n');
}

async function main() {
  const command = String(process.argv[2] || '').trim().toLowerCase();

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'server') {
    const server = createMarkosCompanyKnowledgeServer();
    process.stdout.write(`${JSON.stringify(server.capabilities, null, 2)}\n`);
    return;
  }

  const rawPayload = String(process.argv[3] || '{}').trim();
  const payload = rawPayload ? JSON.parse(rawPayload) : {};
  const adapter = createCompanyKnowledgeAdapter();
  const name = command === 'fetch' ? 'fetch_markos_artifact' : 'search_markos_knowledge';
  const claims = {
    tenantId: process.env.MARKOS_ACTIVE_TENANT_ID || 'tenant-alpha-001',
    principalId: process.env.MARKOS_ACTIVE_USER_ID || 'local-operator',
    role: process.env.MARKOS_ACTIVE_ROLE || 'owner',
  };

  const result = await adapter.invokeTool({
    name,
    arguments: payload,
    claims,
    clientSurface: 'cli',
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.code || 'MARKOS_CLI_ERROR'}: ${error.message}\n`);
  process.exitCode = 1;
});
