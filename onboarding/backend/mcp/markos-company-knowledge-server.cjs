'use strict';

const { createCompanyKnowledgeAdapter } = require('./company-knowledge-adapter.cjs');

function createMarkosCompanyKnowledgeServer(options = {}) {
  const adapter = createCompanyKnowledgeAdapter(options);

  return {
    name: 'markos-company-knowledge',
    version: '0.1.0',
    capabilities: {
      tools: { listChanged: false },
      resources: {},
    },
    listTools: () => adapter.listTools(),
    callTool: (payload) => adapter.invokeTool(payload),
    readResource: (payload) => adapter.readResource(payload),
  };
}

if (require.main === module) {
  const server = createMarkosCompanyKnowledgeServer();
  process.stdout.write(`${JSON.stringify({
    name: server.name,
    version: server.version,
    capabilities: server.capabilities,
    tools: server.listTools().map((tool) => tool.name),
  }, null, 2)}\n`);
}

module.exports = {
  createMarkosCompanyKnowledgeServer,
};
