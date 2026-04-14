'use strict';

const serviceModule = require('../research/company-knowledge-service.cjs');
const { createKnowledgeError } = require('../research/company-knowledge-policy.cjs');

const PUBLIC_TOOL_NAMES = Object.freeze(['search_markos_knowledge', 'fetch_markos_artifact']);

const TOOL_DEFINITIONS = Object.freeze([
  {
    name: 'search_markos_knowledge',
    description: 'Search approved internal MarkOS knowledge and return snippet-first results with citations.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        scopes: { type: 'array', items: { type: 'string' } },
        filters: { type: 'object' },
        topK: { type: 'number' },
      },
      additionalProperties: true,
    },
  },
  {
    name: 'fetch_markos_artifact',
    description: 'Fetch a specific approved MarkOS artifact or section by markos URI.',
    inputSchema: {
      type: 'object',
      required: ['uri'],
      properties: {
        uri: { type: 'string' },
        section: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
]);

function formatTextBlocks(payload) {
  if (payload.operation === 'search_markos_knowledge') {
    const lines = (payload.results || []).map((entry, index) => `${index + 1}. ${entry.title}: ${entry.snippet}`);
    return [{ type: 'text', text: lines.join('\n') || 'No approved knowledge results found.' }];
  }

  if (payload.operation === 'fetch_markos_artifact') {
    const artifact = payload.artifact || {};
    return [{ type: 'text', text: `${artifact.title || 'Artifact'}\n\n${artifact.content || ''}`.trim() }];
  }

  return [{ type: 'text', text: JSON.stringify(payload, null, 2) }];
}

function createCompanyKnowledgeAdapter(options = {}) {
  const service = options.service || serviceModule;
  const auditLogger = typeof options.auditLogger === 'function' ? options.auditLogger : () => {};

  return {
    listTools() {
      return TOOL_DEFINITIONS.slice();
    },

    async invokeTool({ name, arguments: args = {}, claims = {}, clientSurface = 'mcp' } = {}) {
      if (!PUBLIC_TOOL_NAMES.includes(name)) {
        throw createKnowledgeError('E_MARKOS_MCP_TOOL_UNKNOWN', `Unsupported tool '${name}'.`);
      }

      auditLogger({
        event: 'company_knowledge_tool_invoked',
        tool: name,
        tenant_id: claims.tenantId || claims.tenant_id || claims.active_tenant_id || null,
        client_surface: clientSurface,
        uri: args.uri || null,
      });

      const payload = name === 'search_markos_knowledge'
        ? await service.searchApprovedKnowledge({ ...args, claims, operation: name })
        : await service.fetchApprovedArtifact({ ...args, claims, operation: name });

      return {
        structuredContent: payload,
        content: formatTextBlocks(payload),
      };
    },

    async readResource({ uri, claims = {}, clientSurface = 'mcp-resource' } = {}) {
      const payload = await service.fetchApprovedArtifact({ uri, claims, operation: 'fetch_markos_artifact' });
      auditLogger({
        event: 'company_knowledge_resource_read',
        tenant_id: claims.tenantId || claims.tenant_id || claims.active_tenant_id || null,
        client_surface: clientSurface,
        uri,
      });
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(payload, null, 2),
      };
    },
  };
}

module.exports = {
  PUBLIC_TOOL_NAMES,
  TOOL_DEFINITIONS,
  createCompanyKnowledgeAdapter,
};
