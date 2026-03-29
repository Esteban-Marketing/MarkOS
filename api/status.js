const { handleStatus, handleCorsPreflight } = require('../onboarding/backend/handlers.cjs');
const {
  createRuntimeContext,
  requireHostedSupabaseAuth,
  resolveRequestedProjectSlugFromRequest,
} = require('../onboarding/backend/runtime-context.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);
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

  req.markosAuth = auth;
  await handleStatus(req, res);
};
