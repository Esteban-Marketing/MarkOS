'use strict';

// Phase 201 Plan 08 Task 2: Contract-first lock for the public OpenAPI spec.
// Future contract additions must land as F-*.yaml + be picked up by the merge script.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Suite 201-08: contracts/openapi.json contains all 9 phase-201 paths', () => {
  const raw = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'openapi.json'), 'utf8');
  const spec = JSON.parse(raw);
  const paths = Object.keys(spec.paths || {});

  const expected = [
    '/api/auth/signup',
    '/api/auth/callback',
    '/api/auth/passkey/register-options',
    '/api/auth/passkey/authenticate-options',
    '/api/tenant/sessions/list',
    '/api/tenant/sessions/revoke',
    '/api/settings/custom-domain/add',
    '/api/settings/tenant-branding',
    '/api/tenant/invites/create',
    '/api/tenant/invites/accept',
    '/api/tenant/lifecycle/offboard',
    '/api/tenant/lifecycle/cancel-offboard',
    '/api/tenant/switcher/list',
    '/api/tenant/audit/list',
  ];
  for (const p of expected) {
    assert.ok(paths.includes(p), `openapi.json missing path ${p}`);
  }
});

test('Suite 201-08: merge-openapi build covers F-80..F-88 yaml files', () => {
  const contractsDir = path.join(__dirname, '..', '..', 'contracts');
  for (const id of ['F-80', 'F-81', 'F-82', 'F-83', 'F-84', 'F-85', 'F-86', 'F-87', 'F-88']) {
    const present = fs.readdirSync(contractsDir).some((f) => f.startsWith(`${id}-`) && f.endsWith('.yaml'));
    assert.ok(present, `contract ${id}-*.yaml missing`);
  }
});
