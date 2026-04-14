const { handleCorsPreflight } = require('../../onboarding/backend/handlers.cjs');
const {
  createRuntimeContext,
  requireHostedSupabaseAuth,
  resolveRequestedProjectSlugFromRequest,
} = require('../../onboarding/backend/runtime-context.cjs');
const { createCompanyKnowledgeAdapter } = require('../../onboarding/backend/mcp/company-knowledge-adapter.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function resolveToolName(body = {}) {
  if (body.name === 'fetch_markos_artifact' || body.tool === 'fetch_markos_artifact' || body.operation === 'fetch_markos_artifact' || body.uri) {
    return 'fetch_markos_artifact';
  }
  return 'search_markos_knowledge';
}

function buildClaims(auth) {
  return {
    tenantId: auth?.tenant_id,
    principalId: auth?.principal?.id,
    role: auth?.role,
  };
}

function statusForError(error) {
  if (!error?.code) return 500;
  if (error.code === 'E_SCOPE_TENANT_MISMATCH') return 403;
  if (error.code === 'E_SCOPE_CLAIMS_MISSING') return 401;
  if (error.code === 'E_KNOWLEDGE_ARTIFACT_NOT_FOUND') return 404;
  return 400;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);
  if (req.method !== 'POST') {
    return writeJson(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Use POST for MarkOS company knowledge search or fetch.',
    });
  }

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({
    req,
    runtimeContext: runtime,
    operation: 'status_read',
    requiredProjectSlug: resolveRequestedProjectSlugFromRequest(req),
  });

  if (!auth.ok) {
    return writeJson(res, auth.status, {
      success: false,
      error: auth.error,
      message: auth.message,
    });
  }

  try {
    const body = await readJsonBody(req);
    const toolName = resolveToolName(body);
    const adapter = createCompanyKnowledgeAdapter();
    const toolArgs = body.arguments && typeof body.arguments === 'object'
      ? body.arguments
      : body;

    const result = await adapter.invokeTool({
      name: toolName,
      arguments: toolArgs,
      claims: buildClaims(auth),
      clientSurface: 'api',
    });

    return writeJson(res, 200, {
      success: true,
      tool: toolName,
      ...result,
    });
  } catch (error) {
    return writeJson(res, statusForError(error), {
      success: false,
      error: error.code || 'COMPANY_KNOWLEDGE_ERROR',
      message: error.message,
    });
  }
};
