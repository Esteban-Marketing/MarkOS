'use strict';

// Phase 201.1 D-101 (closes H1): inline audit emit for approve/submit flows.
// Replaces the post-res.end wrapper in api/approve.js + api/submit.js.
// Fail-CLOSED: errors propagate; the caller decides the response code.

const { enqueueAuditStaging } = require('./writer.cjs');

/**
 * runWithDeferredEnd — intercepts res.end/res.write/res.setHeader on a wrapper,
 * calls businessHandler(req, wrappedRes), then returns the captured response.
 * The original res is UNTOUCHED — caller replays the captured response manually.
 *
 * @param {object} req - incoming request (passed through to businessHandler unchanged)
 * @param {object} res - original Node.js ServerResponse (NOT called during this function)
 * @param {function} businessHandler - async function(req, res) => void
 * @returns {Promise<{status: number, headers: Array<[string, string]>, body: string}>}
 */
function runWithDeferredEnd(req, res, businessHandler) {
  return new Promise((resolve, reject) => {
    const headers = [];
    const bodyChunks = [];
    let status = 200;
    let ended = false;

    const wrappedRes = Object.create(res);

    Object.defineProperty(wrappedRes, 'statusCode', {
      get() { return status; },
      set(v) { status = Number(v); },
      configurable: true,
      enumerable: true,
    });

    wrappedRes.setHeader = (k, v) => {
      headers.push([String(k), v]);
    };

    wrappedRes.getHeader = (k) => {
      const lk = String(k).toLowerCase();
      const found = headers.slice().reverse().find(([h]) => String(h).toLowerCase() === lk);
      return found ? found[1] : undefined;
    };

    wrappedRes.removeHeader = (k) => {
      const lk = String(k).toLowerCase();
      for (let i = headers.length - 1; i >= 0; i--) {
        if (String(headers[i][0]).toLowerCase() === lk) headers.splice(i, 1);
      }
    };

    wrappedRes.write = (chunk) => {
      if (chunk == null) return true;
      if (typeof chunk === 'string') {
        bodyChunks.push(chunk);
      } else if (Buffer.isBuffer(chunk)) {
        bodyChunks.push(chunk.toString('utf8'));
      } else {
        bodyChunks.push(String(chunk));
      }
      return true;
    };

    wrappedRes.end = (chunk, ...rest) => {
      if (ended) return wrappedRes;
      ended = true;
      if (chunk != null) wrappedRes.write(chunk);
      const body = bodyChunks.join('');
      resolve({ status, headers, body });
      return wrappedRes;
    };

    Promise.resolve()
      .then(() => businessHandler(req, wrappedRes))
      .catch((err) => {
        if (!ended) {
          ended = true;
          reject(err);
        }
      });
  });
}

/**
 * loadSupabaseClient — returns opts.client if provided (for tests),
 * otherwise constructs a Supabase client from process.env.
 */
function loadSupabaseClient(opts) {
  if (opts && opts.client) return opts.client;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

/**
 * emitInlineApprovalAudit — builds an audit staging row from the captured HTTP response
 * and calls enqueueAuditStaging. Throws on insert error (fail-CLOSED by design).
 *
 * @param {object} req - incoming request (reads x-markos-tenant-id, x-markos-user-id headers)
 * @param {{status: number, headers: Array, body: string}} captured - response from runWithDeferredEnd
 * @param {{action: 'approve'|'submit', client?: object}} opts
 */
async function emitInlineApprovalAudit(req, captured, opts) {
  if (!opts || (opts.action !== 'approve' && opts.action !== 'submit')) {
    throw new Error("emitInlineApprovalAudit: opts.action must be 'approve' or 'submit'");
  }

  const headers = (req && req.headers) ? req.headers : {};
  const tenant_id = headers['x-markos-tenant-id'] || 'unknown';
  const actor_id = headers['x-markos-user-id'] || 'system';

  let parsed = {};
  try {
    parsed = captured.body ? JSON.parse(captured.body) : {};
  } catch {
    parsed = {};
  }

  let action;
  let payload;

  if (opts.action === 'approve') {
    const decision =
      parsed && parsed.decision && String(parsed.decision).toLowerCase() === 'rejected'
        ? 'rejected'
        : 'approved';
    action = decision === 'rejected' ? 'approval.rejected' : 'approval.approved';
    payload = {
      approval_id: (parsed && (parsed.approval_id || parsed.run_id)) || null,
      decision,
    };
  } else {
    // submit
    action = 'approval.submitted';
    payload = {
      run_id: (parsed && (parsed.run_id || parsed.runId)) || null,
      project_slug: (parsed && (parsed.project_slug || parsed.slug)) || null,
    };
  }

  const client = loadSupabaseClient(opts);

  // enqueueAuditStaging throws on failure — propagates to the caller (fail-CLOSED).
  await enqueueAuditStaging(client, {
    tenant_id,
    org_id: null,
    source_domain: 'approvals',
    action,
    actor_id,
    actor_role: 'owner',
    payload,
  });
}

module.exports = { runWithDeferredEnd, emitInlineApprovalAudit };
