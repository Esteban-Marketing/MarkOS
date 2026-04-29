'use strict';

// Phase 201.1 D-107 (closes M2): Unit tests for byod-failure-alert.cjs
// W-4: delivery is gated on Phase 203 dispatch; this tests the queueing surface only.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Minimal mock Supabase client builder
// ---------------------------------------------------------------------------

function makeMockClient(opts = {}) {
  const auditRows = [];
  const deliveryRows = [];

  // subs to return for markos_webhook_subscriptions queries
  const subs = opts.subs || [];

  function makeQueryBuilder(table) {
    const state = { _filters: {}, _table: table };
    const qb = {
      select(cols) { return qb; },
      eq(col, val) { state._filters[col] = val; return qb; },
      insert(row) {
        if (table === 'markos_audit_staging' || table === 'markos_audit_log') {
          auditRows.push(row);
        } else if (table === 'markos_webhook_deliveries') {
          deliveryRows.push(row);
        }
        return Promise.resolve({ data: row, error: null });
      },
      async maybeSingle() { return { data: null, error: null }; },
      // For subscriptions query: return subs filtered by tenant_id + active
      then(resolve) {
        if (table === 'markos_webhook_subscriptions') {
          return resolve({ data: subs, error: null });
        }
        if (table === 'markos_audit_staging') {
          return resolve({ data: null, error: null });
        }
        return resolve({ data: null, error: null });
      },
    };
    return qb;
  }

  return {
    from(table) { return makeQueryBuilder(table); },
    _auditRows: auditRows,
    _deliveryRows: deliveryRows,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const { fireByodFailureAlert, EVENT_TYPE } = require('../../lib/markos/webhooks/byod-failure-alert.cjs');

describe('byod-failure-alert: EVENT_TYPE', () => {
  it('EVENT_TYPE is byod.verification_lost', () => {
    assert.equal(EVENT_TYPE, 'byod.verification_lost');
  });
});

describe('byod-failure-alert: fireByodFailureAlert', () => {
  it('Test 1: no matching subscriptions — returns { delivered: 0, audited: true }', async () => {
    const client = makeMockClient({ subs: [] });
    const result = await fireByodFailureAlert(client, {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      last_verified_at: new Date(Date.now() - 1000).toISOString(),
      reason: 'vercel_verification_failed',
    });
    assert.equal(result.delivered, 0);
    assert.equal(result.audited, true);
  });

  it('Test 2: one matching subscription — delivered=1 + delivery row queued', async () => {
    const subs = [
      { id: 'sub_001', url: 'https://hooks.example.com/1', secret: 'secret', events: ['byod.verification_lost', 'campaign.launched'], active: true },
    ];
    const client = makeMockClient({ subs });
    const result = await fireByodFailureAlert(client, {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      last_verified_at: new Date(Date.now() - 1000).toISOString(),
      reason: 'vercel_verification_failed',
    });
    assert.equal(result.delivered, 1);
    assert.equal(result.audited, true);
    assert.equal(result.total_subscriptions, 1);
    // Delivery row must have status='queued' and event_type='byod.verification_lost'
    assert.equal(client._deliveryRows.length, 1);
    assert.equal(client._deliveryRows[0].status, 'queued');
    assert.equal(client._deliveryRows[0].event_type, 'byod.verification_lost');
    assert.equal(client._deliveryRows[0].tenant_id, 'tenant_abc');
  });

  it('Test 3: subscription NOT subscribed to byod.verification_lost — delivered=0', async () => {
    const subs = [
      { id: 'sub_002', url: 'https://hooks.example.com/2', secret: 'secret', events: ['campaign.launched', 'approval.created'], active: true },
    ];
    const client = makeMockClient({ subs });
    const result = await fireByodFailureAlert(client, {
      domain: 'acme.example.com',
      tenant_id: 'tenant_abc',
      org_id: 'org_xyz',
      last_verified_at: new Date(Date.now() - 1000).toISOString(),
      reason: 'vercel_verification_failed',
    });
    assert.equal(result.delivered, 0);
    assert.equal(client._deliveryRows.length, 0);
  });

  it('throws when domain or tenant_id missing', async () => {
    const client = makeMockClient({});
    await assert.rejects(
      () => fireByodFailureAlert(client, { tenant_id: 'tenant_abc' }),
      /domain \+ tenant_id required/,
    );
    await assert.rejects(
      () => fireByodFailureAlert(client, { domain: 'acme.example.com' }),
      /domain \+ tenant_id required/,
    );
  });
});
