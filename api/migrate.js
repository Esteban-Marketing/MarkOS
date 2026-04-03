const { handleMarkosdbMigration, handleCorsPreflight } = require('../onboarding/backend/handlers.cjs');
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
  
  // Task 51-02-01: Require tenant context for protected migration operations  
  // Tenant scope is verified from trusted JWT claims before migration execution
  // Missing or ambiguous tenant context fails closed with 401/403 deterministically
  const auth = requireHostedSupabaseAuth({
    req,
    runtimeContext: runtime,
    operation: 'migration_write',
    requiredProjectSlug: resolveRequestedProjectSlugFromRequest(req),
  });

  if (!auth.ok) {
    return writeJson(res, auth.status, {
      success: false,
      error: auth.error,
      message: auth.message,
      tenant_id: auth.tenant_id,
    });
  }

  // Attach tenant principal to request context for downstream handlers
  req.markosAuth = auth;
  // req.markosAuth now contains tenant_id from verified JWT active_tenant_id claim
  await handleMarkosdbMigration(req, res);
};
