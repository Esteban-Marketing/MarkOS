'use strict';

const { randomBytes, randomUUID } = require('node:crypto');

const WEBHOOK_EVENTS = [
  'approval.created',
  'approval.resolved',
  'approval.rejected',
  'campaign.launched',
  'campaign.paused',
  'campaign.closed',
  'execution.completed',
  'execution.failed',
  'incident.opened',
  'incident.resolved',
  'consent.changed',
  'consent.revoked',
];
const VALID_EVENTS = new Set(WEBHOOK_EVENTS);

function assertValidEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('events is required and must be non-empty');
  }
  for (const event of events) {
    if (!VALID_EVENTS.has(event)) throw new Error(`unknown event: ${event}`);
  }
}

function assertValidUrl(url) {
  if (!url) throw new Error('url is required');
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    throw new Error(`invalid url: ${error.message}`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('url must be http(s)');
  }
}

function generateSecret() {
  return randomBytes(32).toString('hex');
}

async function subscribe(store, input) {
  if (!input || !input.tenant_id) throw new Error('tenant_id is required');
  assertValidUrl(input.url);
  assertValidEvents(input.events);

  const now = new Date().toISOString();
  const row = {
    id: `whsub_${randomUUID()}`,
    tenant_id: input.tenant_id,
    url: input.url,
    secret: input.secret || generateSecret(),
    events: [...input.events],
    active: true,
    created_at: now,
    updated_at: now,
  };
  return store.insert(row);
}

async function unsubscribe(store, tenant_id, id) {
  const updated = await store.updateActive(tenant_id, id, false);
  if (!updated) throw new Error(`subscription not found: ${id}`);
  return updated;
}

async function listSubscriptions(store, tenant_id) {
  if (!tenant_id) throw new Error('tenant_id is required');
  return store.listByTenant(tenant_id);
}

function createInMemoryStore() {
  const rows = new Map();
  return {
    async insert(row) {
      rows.set(row.id, row);
      return row;
    },
    async updateActive(tenant_id, id, active) {
      const row = rows.get(id);
      if (!row || row.tenant_id !== tenant_id) return null;
      const next = { ...row, active, updated_at: new Date().toISOString() };
      rows.set(id, next);
      return next;
    },
    async listByTenant(tenant_id) {
      return [...rows.values()].filter((r) => r.tenant_id === tenant_id);
    },
    async findById(tenant_id, id) {
      const row = rows.get(id);
      if (!row || row.tenant_id !== tenant_id) return null;
      return row;
    },
  };
}

module.exports = {
  WEBHOOK_EVENTS,
  subscribe,
  unsubscribe,
  listSubscriptions,
  createInMemoryStore,
};
