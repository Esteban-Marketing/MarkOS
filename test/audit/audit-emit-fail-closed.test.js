'use strict';

// Phase 201.1 D-101 (closes H1): regression tests for fail-closed audit emit.
// Tests the contract: handler returns 500 when audit staging insert fails.
// Approach: drive the handler pattern directly using runWithDeferredEnd + emitInlineApprovalAudit
// with a stub business handler (avoids the ~3000 LoC handlers.cjs which requires live Supabase).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { runWithDeferredEnd, emitInlineApprovalAudit } =
  require('../../lib/markos/audit/inline-emit.cjs');

// Helper: minimal mock res for direct pattern tests.
function makeRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    _body: null,
    setHeader(k, v) { this._headers[String(k).toLowerCase()] = v; },
    getHeader(k) { return this._headers[String(k).toLowerCase()]; },
    removeHeader(k) { delete this._headers[String(k).toLowerCase()]; },
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) {
        for (const [k, v] of Object.entries(headers)) this.setHeader(k, v);
      }
    },
    end(body) { this._body = body ?? null; },
    write(chunk) { this._body = (this._body ?? '') + (chunk ?? ''); },
  };
  return res;
}

// Stub business handler that successfully writes a 200 JSON response (simulates handleApprove).
function stubBusinessHandler(statusCode, bodyObj) {
  return async (req, wrappedRes) => {
    wrappedRes.statusCode = statusCode;
    wrappedRes.end(JSON.stringify(bodyObj));
  };
}

// Build mock Supabase client chain: from → insert → select → single.
function makeStagingClient(resolveWith, calls) {
  return {
    from(table) {
      return {
        insert(row) {
          if (calls) calls.push({ table, row });
          return {
            select() {
              return { single() { return Promise.resolve(resolveWith); } };
            },
          };
        },
      };
    },
  };
}

function makeFaultyClient() {
  return makeStagingClient({ data: null, error: { message: 'simulated staging insert failure' } });
}

function makeGoodClient(calls) {
  return makeStagingClient({ data: { id: 'staging-mock-1' }, error: null }, calls);
}

// Re-usable handler pattern identical to api/approve.js / api/submit.js logic.
async function runHandlerPattern(req, res, businessHandler, action, auditClient) {
  const captured = await runWithDeferredEnd(req, res, businessHandler);
  if (captured.status >= 200 && captured.status < 300) {
    try {
      await emitInlineApprovalAudit(req, captured, { action, client: auditClient });
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: 'audit_emit_failed',
        detail: err?.message ?? String(err),
        compensation: 'business_write_succeeded_audit_pending',
      }));
    }
  }
  res.statusCode = captured.status;
  for (const [k, v] of captured.headers) res.setHeader(k, v);
  return res.end(captured.body);
}

const stubReq = {
  headers: { 'x-markos-tenant-id': 'tenant-test', 'x-markos-user-id': 'user-test' },
};

// Test 1: approve pattern + faulty audit client returns 500 + 'audit_emit_failed'
test('Suite 201.1-04: approve.js pattern + faulty audit client returns 500 with audit_emit_failed', async () => {
  const res = makeRes();
  const businessHandler = stubBusinessHandler(200, { decision: 'approved', approval_id: 'apr-1' });
  await runHandlerPattern(stubReq, res, businessHandler, 'approve', makeFaultyClient());
  assert.equal(res.statusCode, 500, 'status must be 500 on audit failure');
  const body = JSON.parse(res._body);
  assert.equal(body.error, 'audit_emit_failed');
  assert.equal(body.compensation, 'business_write_succeeded_audit_pending');
});

// Test 2: submit pattern + faulty audit client returns 500 + 'audit_emit_failed'
test('Suite 201.1-04: submit.js pattern + faulty audit client returns 500 with audit_emit_failed', async () => {
  const res = makeRes();
  const businessHandler = stubBusinessHandler(200, { run_id: 'run-1', project_slug: 'proj' });
  await runHandlerPattern(stubReq, res, businessHandler, 'submit', makeFaultyClient());
  assert.equal(res.statusCode, 500, 'status must be 500 on audit failure');
  const body = JSON.parse(res._body);
  assert.equal(body.error, 'audit_emit_failed');
  assert.equal(body.compensation, 'business_write_succeeded_audit_pending');
});

// Test 3: approve pattern + good audit client passes through + audit row inserted
test('Suite 201.1-04: approve.js pattern + good audit client passes through with audit row inserted', async () => {
  const calls = [];
  const res = makeRes();
  const businessHandler = stubBusinessHandler(200, { decision: 'approved', approval_id: 'apr-2' });
  await runHandlerPattern(stubReq, res, businessHandler, 'approve', makeGoodClient(calls));
  assert.notEqual(res.statusCode, 500, 'status must NOT be 500 on successful audit emit');
  assert.equal(res.statusCode, 200);
  assert.ok(calls.length >= 1, 'at least one audit staging row must have been inserted');
  assert.equal(calls[0].row.source_domain, 'approvals');
  assert.equal(calls[0].row.action, 'approval.approved');
});

// Test 4: api/approve.js source file uses inline pattern + no post-res.end wrapper
test('Suite 201.1-04: api/approve.js source contains inline-emit pattern, no patchedEnd wrapper', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../api/approve.js'), 'utf8');
  assert.match(src, /runWithDeferredEnd/);
  assert.match(src, /emitInlineApprovalAudit/);
  assert.match(src, /audit_emit_failed/);
  assert.match(src, /compensation/);
  assert.doesNotMatch(src, /res\.end\s*=\s*function patchedEnd/);
});

// Test 5: api/submit.js source file uses inline pattern + no post-res.end wrapper
test('Suite 201.1-04: api/submit.js source contains inline-emit pattern, no patchedEnd wrapper', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../api/submit.js'), 'utf8');
  assert.match(src, /runWithDeferredEnd/);
  assert.match(src, /emitInlineApprovalAudit/);
  assert.match(src, /audit_emit_failed/);
  assert.match(src, /compensation/);
  assert.doesNotMatch(src, /res\.end\s*=\s*function patchedEnd/);
});

// Test 6: webhooks engine.cjs has failClosed opt-in branch
test('Suite 201.1-04: webhooks engine emitWebhooksAudit has failClosed opt-in branch', () => {
  const engineSrc = fs.readFileSync(
    path.resolve(__dirname, '../../lib/markos/webhooks/engine.cjs'),
    'utf8',
  );
  assert.match(engineSrc, /opts\.failClosed === true/);
  assert.match(engineSrc, /throw err/);
});
