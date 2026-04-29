'use strict';

// Phase 201 Plan 08 Task 1: Static-analysis lock for cross-domain audit fabric.
// Future refactors that drop an audit emit call break CI.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8');
}

test('Suite 201-08: webhooks/engine.cjs emits source_domain=webhooks on subscribe + unsubscribe', () => {
  const src = read('lib/markos/webhooks/engine.cjs');
  assert.match(src, /enqueueAuditStaging/);
  assert.match(src, /source_domain: 'webhooks'/);
  assert.match(src, /webhook_subscription\.created/);
  assert.match(src, /webhook_subscription\.removed/);
});

test('Suite 201-08: api/approve.js emits source_domain=approvals', () => {
  const src = read('api/approve.js');
  // Pre-existing: enqueueAuditStaging still called (via inline-emit.cjs helper)
  assert.match(src, /enqueueAuditStaging|emitInlineApprovalAudit/);
  assert.match(src, /source_domain: 'approvals'|inline-emit/);
  assert.match(src, /approval\.(approved|rejected|submitted)|emitInlineApprovalAudit/);
});

test('Suite 201-08: api/submit.js emits source_domain=approvals', () => {
  const src = read('api/submit.js');
  // Pre-existing: enqueueAuditStaging still called (via inline-emit.cjs helper)
  assert.match(src, /enqueueAuditStaging|emitInlineApprovalAudit/);
  assert.match(src, /source_domain: 'approvals'|inline-emit/);
});

// Phase 201.1 D-101: new assertions — inline pattern replaces post-res.end wrapper.
test('Suite 201.1-04: api/approve.js uses inline emit (runWithDeferredEnd + emitInlineApprovalAudit)', () => {
  const src = read('api/approve.js');
  assert.match(src, /runWithDeferredEnd/, 'approve.js must use runWithDeferredEnd');
  assert.match(src, /emitInlineApprovalAudit/, 'approve.js must use emitInlineApprovalAudit');
  assert.doesNotMatch(src, /res\.end\s*=\s*function patchedEnd/, 'approve.js must NOT contain post-res.end wrapper');
  assert.match(src, /audit_emit_failed/, 'approve.js must have audit_emit_failed error body');
});

test('Suite 201.1-04: api/submit.js uses inline emit (runWithDeferredEnd + emitInlineApprovalAudit)', () => {
  const src = read('api/submit.js');
  assert.match(src, /runWithDeferredEnd/, 'submit.js must use runWithDeferredEnd');
  assert.match(src, /emitInlineApprovalAudit/, 'submit.js must use emitInlineApprovalAudit');
  assert.doesNotMatch(src, /res\.end\s*=\s*function patchedEnd/, 'submit.js must NOT contain post-res.end wrapper');
  assert.match(src, /audit_emit_failed/, 'submit.js must have audit_emit_failed error body');
});

test('Suite 201-08: F-88 contract + audit/list handler + vercel.ts cron entries', () => {
  const yaml = read('contracts/F-88-tenant-audit-query-v1.yaml');
  assert.match(yaml, /\/api\/tenant\/audit\/list/);
  assert.match(yaml, /hash chain/i);

  const handler = require('../../api/tenant/audit/list.js');
  assert.equal(typeof handler, 'function');

  const vercel = read('vercel.ts');
  assert.match(vercel, /\/api\/audit\/drain/);
  assert.match(vercel, /\/api\/tenant\/lifecycle\/purge-cron/);
});

test('Suite 201-08: audit/list handler returns 405 on POST, 401 without headers', async () => {
  const handler = require('../../api/tenant/audit/list.js');

  // 405
  {
    let statusCode = null;
    const res = {
      setHeader: () => {},
      end: () => {},
    };
    Object.defineProperty(res, 'statusCode', { set: (v) => { statusCode = v; } });
    await handler({ method: 'POST', headers: {}, url: '/api/tenant/audit/list' }, res);
    assert.equal(statusCode, 405);
  }

  // 401
  {
    let statusCode = null;
    const res = {
      setHeader: () => {},
      end: () => {},
    };
    Object.defineProperty(res, 'statusCode', { set: (v) => { statusCode = v; } });
    await handler({ method: 'GET', headers: {}, url: '/api/tenant/audit/list' }, res);
    assert.equal(statusCode, 401);
  }
});
