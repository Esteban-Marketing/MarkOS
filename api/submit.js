// Phase 201 Plan 08 Task 1: audit wiring wrapper around phase-46 handleSubmit.
// Emits source_domain: 'approvals' action: 'approval.submitted' AFTER the primary write succeeds.
// Fail-soft: audit errors never block the primary flow.

const { handleSubmit, handleCorsPreflight } = require('../onboarding/backend/handlers.cjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);

  const originalEnd = res.end.bind(res);
  let capturedBody = null;
  let capturedStatus = null;
  res.end = function patchedEnd(chunk, ...rest) {
    try {
      capturedStatus = res.statusCode;
      if (typeof chunk === 'string') capturedBody = chunk;
      else if (Buffer.isBuffer(chunk)) capturedBody = chunk.toString('utf8');
    } catch { /* noop */ }
    return originalEnd(chunk, ...rest);
  };

  await handleSubmit(req, res);

  try {
    if (!capturedStatus || capturedStatus < 200 || capturedStatus >= 300) return;
    const headers = req.headers || {};
    const tenant_id = headers['x-markos-tenant-id'] || 'unknown';
    const actor_id = headers['x-markos-user-id'] || 'system';

    let run_id = null;
    let project_slug = null;
    try {
      const parsed = capturedBody ? JSON.parse(capturedBody) : {};
      run_id = parsed?.run_id || parsed?.runId || null;
      project_slug = parsed?.project_slug || parsed?.slug || null;
    } catch { /* body may not be JSON */ }

    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
      { auth: { persistSession: false } },
    );
    const { enqueueAuditStaging } = require('../lib/markos/audit/writer.cjs');
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: null,
      source_domain: 'approvals',
      action: 'approval.submitted',
      actor_id,
      actor_role: 'owner',
      payload: { run_id, project_slug },
    });
  } catch {
    // Primary flow already completed; swallow audit failures.
  }
};
