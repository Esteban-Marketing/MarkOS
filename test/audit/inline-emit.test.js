'use strict';

// Phase 201.1 D-101 (closes H1): unit tests for lib/markos/audit/inline-emit.cjs
// TDD RED-first: these tests are written before the implementation exists.

const test = require('node:test');
const assert = require('node:assert/strict');

// We require after implementation exists — during RED phase, require() will fail,
// but the test runner still reports the file as failing (which is the RED signal).
let runWithDeferredEnd, emitInlineApprovalAudit;
try {
  ({ runWithDeferredEnd, emitInlineApprovalAudit } = require('../../lib/markos/audit/inline-emit.cjs'));
} catch {
  // RED phase: module not yet created. All tests will fail.
}

// Helper: build a minimal fake Node.js res object.
function makeRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    _ended: false,
    setHeader(k, v) { this._headers[k] = v; },
    getHeader(k) { return this._headers[k]; },
    removeHeader(k) { delete this._headers[k]; },
    end(body) { this._ended = true; this._body = body; },
    write(chunk) { this._body = (this._body || '') + chunk; },
  };
  return res;
}

// Helper: build a mock Supabase client that succeeds.
function makeMockClient({ error = null } = {}) {
  const calls = [];
  const client = {
    calls,
    from(table) {
      const chain = {
        _table: table,
        insert(row) {
          calls.push({ table, row });
          return {
            select() {
              return {
                single() {
                  if (error) return Promise.resolve({ data: null, error });
                  return Promise.resolve({ data: { id: 'mock-id-123' }, error: null });
                },
              };
            },
          };
        },
      };
      return chain;
    },
  };
  return client;
}

// -- runWithDeferredEnd tests --

test('Suite 201.1-04: runWithDeferredEnd captures a 200 response', async () => {
  assert.ok(runWithDeferredEnd, 'runWithDeferredEnd must be exported');
  const res = makeRes();
  const handler = (req, wrappedRes) => {
    wrappedRes.statusCode = 200;
    wrappedRes.end(JSON.stringify({ decision: 'approved' }));
  };
  const captured = await runWithDeferredEnd({}, res, handler);
  assert.equal(captured.status, 200);
  assert.equal(captured.body, JSON.stringify({ decision: 'approved' }));
});

test('Suite 201.1-04: runWithDeferredEnd captures a 400 response', async () => {
  assert.ok(runWithDeferredEnd, 'runWithDeferredEnd must be exported');
  const res = makeRes();
  const handler = (req, wrappedRes) => {
    wrappedRes.statusCode = 400;
    wrappedRes.end(JSON.stringify({ error: 'bad_request' }));
  };
  const captured = await runWithDeferredEnd({}, res, handler);
  assert.equal(captured.status, 400);
  assert.equal(captured.body, JSON.stringify({ error: 'bad_request' }));
});

test('Suite 201.1-04: runWithDeferredEnd does NOT call original res.end', async () => {
  assert.ok(runWithDeferredEnd, 'runWithDeferredEnd must be exported');
  let originalEndCalled = false;
  const res = makeRes();
  res.end = function () { originalEndCalled = true; };
  const handler = (req, wrappedRes) => {
    wrappedRes.statusCode = 200;
    wrappedRes.end(JSON.stringify({ ok: true }));
  };
  await runWithDeferredEnd({}, res, handler);
  assert.equal(originalEndCalled, false, 'original res.end must NOT be called by runWithDeferredEnd');
});

// -- emitInlineApprovalAudit tests --

test('Suite 201.1-04: emitInlineApprovalAudit approve+approved calls enqueueAuditStaging with action=approval.approved', async () => {
  assert.ok(emitInlineApprovalAudit, 'emitInlineApprovalAudit must be exported');
  const client = makeMockClient();
  const captured = { status: 200, headers: [], body: JSON.stringify({ decision: 'approved', approval_id: 'apr-1' }) };
  const req = { headers: { 'x-markos-tenant-id': 'tenant-1', 'x-markos-user-id': 'user-1' } };
  await emitInlineApprovalAudit(req, captured, { action: 'approve', client });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].row.action, 'approval.approved');
  assert.equal(client.calls[0].row.source_domain, 'approvals');
});

test('Suite 201.1-04: emitInlineApprovalAudit approve+rejected calls with action=approval.rejected', async () => {
  assert.ok(emitInlineApprovalAudit, 'emitInlineApprovalAudit must be exported');
  const client = makeMockClient();
  const captured = { status: 200, headers: [], body: JSON.stringify({ decision: 'rejected', approval_id: 'apr-2' }) };
  const req = { headers: { 'x-markos-tenant-id': 'tenant-1', 'x-markos-user-id': 'user-2' } };
  await emitInlineApprovalAudit(req, captured, { action: 'approve', client });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].row.action, 'approval.rejected');
});

test('Suite 201.1-04: emitInlineApprovalAudit submit calls with action=approval.submitted', async () => {
  assert.ok(emitInlineApprovalAudit, 'emitInlineApprovalAudit must be exported');
  const client = makeMockClient();
  const captured = { status: 200, headers: [], body: JSON.stringify({ run_id: 'run-1', project_slug: 'my-project' }) };
  const req = { headers: { 'x-markos-tenant-id': 'tenant-1', 'x-markos-user-id': 'user-3' } };
  await emitInlineApprovalAudit(req, captured, { action: 'submit', client });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].row.action, 'approval.submitted');
});

test('Suite 201.1-04: emitInlineApprovalAudit re-throws when injected client returns insert error', async () => {
  assert.ok(emitInlineApprovalAudit, 'emitInlineApprovalAudit must be exported');
  const faultyClient = makeMockClient({ error: { message: 'simulated staging insert failure' } });
  const captured = { status: 200, headers: [], body: JSON.stringify({ decision: 'approved' }) };
  const req = { headers: { 'x-markos-tenant-id': 'tenant-1', 'x-markos-user-id': 'user-4' } };
  await assert.rejects(
    () => emitInlineApprovalAudit(req, captured, { action: 'approve', client: faultyClient }),
    /simulated staging insert failure/,
  );
});
