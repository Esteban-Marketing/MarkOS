// Phase 201.1 D-101 (closes H1): inline audit emit for approval flows.
// Replaces the Phase 201 post-res.end wrapper (post-response audit emit footgun).
// Failure semantics: if audit emit fails, return 500 — never silent log.

const { handleApprove, handleCorsPreflight } = require('../onboarding/backend/handlers.cjs');
const { runWithDeferredEnd, emitInlineApprovalAudit } = require('../lib/markos/audit/inline-emit.cjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);

  // 1. Run business handler with deferred-end: captures status/headers/body in-memory.
  //    Original res is NOT written to yet — client has received nothing.
  const captured = await runWithDeferredEnd(req, res, handleApprove);

  // 2. Only emit audit if business write succeeded (2xx).
  //    Fail-CLOSED: if staging insert fails, return 500 before the client sees a 200.
  if (captured.status >= 200 && captured.status < 300) {
    try {
      await emitInlineApprovalAudit(req, captured, { action: 'approve' });
    } catch (err) {
      // Business write succeeded on the server, but the audit row is missing.
      // Return 500 with a compensation marker so callers can identify the gap.
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: 'audit_emit_failed',
        detail: err?.message ?? String(err),
        compensation: 'business_write_succeeded_audit_pending',
      }));
    }
  }

  // 3. Replay captured response to the client.
  res.statusCode = captured.status;
  for (const [k, v] of captured.headers) res.setHeader(k, v);
  return res.end(captured.body);
};
