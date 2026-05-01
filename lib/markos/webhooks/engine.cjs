'use strict';

const { randomBytes, randomUUID } = require('node:crypto');
const { validateWebhookUrl } = require('./url-validator.cjs');
const { createInMemoryVaultClient, deleteSecret, storeSecret } = require('./secret-vault.cjs');

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
  'byod.verification_lost', // Phase 201.1 D-107 (closes M2): BYOD cert/DNS failure alert
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

function sanitizeSubscriptionRow(row) {
  if (!row || typeof row !== 'object') return row;
  const { secret, secret_v2, secret_vault_ref, ...publicRow } = row;
  return publicRow;
}

// Phase 201 Plan 08 Task 1: optional audit emit on subscribe/unsubscribe.
// The engine accepts an optional opts carrier so existing phase-200 callers remain
// backward-compatible (opts is ignored when absent). When opts.auditClient is provided,
// the engine emits source_domain='webhooks' rows via enqueueAuditStaging (fire-and-forget).
async function emitWebhooksAudit(opts, action, payload) {
  if (!opts || !opts.auditClient) return;
  try {
    const { enqueueAuditStaging } = require('../audit/writer.cjs');
    await enqueueAuditStaging(opts.auditClient, {
      tenant_id: payload.tenant_id,
      org_id: opts.org_id || null,
      source_domain: 'webhooks',
      action,
      actor_id: opts.actor_id || 'system',
      actor_role: opts.actor_role || 'owner',
      payload,
    });
  } catch (err) {
    if (opts.failClosed === true) throw err; // Phase 201.1 D-101 opt-in: callers that need fail-closed semantics
    /* default: noop â€” audit drain will catch staged rows (backward compat with phase-200 callers) */
  }
}

async function subscribe(store, input, opts) {
  if (!input || !input.tenant_id) throw new Error('tenant_id is required');
  assertValidUrl(input.url);
  assertValidEvents(input.events);

  const allowLocalhostHttp = opts?.allowLocalhostHttp ?? (process.env.MARKOS_WEBHOOK_ALLOW_LOCALHOST_HTTP === '1');
  const validation = opts?.validateUrl
    ? await opts.validateUrl(input.url, {
      allowLocalhostHttp,
      lookup: opts?.lookup,
    })
    : await validateWebhookUrl(input.url, {
      allowLocalhostHttp,
      lookup: opts?.lookup,
    });
  if (!validation.ok) {
    const suffix = validation.detail ? `:${validation.detail}` : '';
    throw new Error(`invalid_subscriber_url:${validation.reason}${suffix}`);
  }

  const vaultClient = opts?.vaultClient || store.client;
  if (!vaultClient) throw new Error('vault_unavailable:missing_client');

  const now = new Date().toISOString();
  const plaintextSecret = input.secret || generateSecret();
  const row = {
    id: `whsub_${randomUUID()}`,
    tenant_id: input.tenant_id,
    url: input.url,
    events: [...input.events],
    active: true,
    secret_vault_ref: null,
    // Phase 203-07 Task 1 (D-13): per-sub override persisted on the row. Null when caller
    // omits the param; the dispatch-time gate falls back to the plan-tier ceiling.
    // Validation happens upstream in api/webhooks/subscribe.js (cannot exceed plan).
    rps_override: input.rps_override === undefined ? null : input.rps_override,
    created_at: now,
    updated_at: now,
  };

  let vaultRef = null;
  try {
    vaultRef = await storeSecret(vaultClient, row.id, plaintextSecret);
    row.secret_vault_ref = vaultRef;
    const inserted = await store.insert(row);

    // Audit: source_domain: 'webhooks' â€” webhook_subscription.created
    await emitWebhooksAudit(opts, 'webhook_subscription.created', {
      subscription_id: inserted.id,
      tenant_id: inserted.tenant_id,
      url: inserted.url,
      events: inserted.events,
    });

    return {
      subscription: sanitizeSubscriptionRow(inserted),
      plaintext_secret_show_once: plaintextSecret,
    };
  } catch (error) {
    if (vaultRef) {
      await deleteSecret(vaultClient, vaultRef).catch(() => {});
    }
    throw error;
  }
}

async function unsubscribe(store, tenant_id, id, opts) {
  const updated = await store.updateActive(tenant_id, id, false);
  if (!updated) throw new Error(`subscription not found: ${id}`);

  // Audit: source_domain: 'webhooks' â€” webhook_subscription.removed
  await emitWebhooksAudit(opts, 'webhook_subscription.removed', {
    subscription_id: updated.id,
    tenant_id: updated.tenant_id,
    url: updated.url,
    events: updated.events,
  });

  return updated;
}

async function listSubscriptions(store, tenant_id) {
  if (!tenant_id) throw new Error('tenant_id is required');
  return store.listByTenant(tenant_id);
}

function createInMemoryStore() {
  const rows = new Map();
  const client = createInMemoryVaultClient();
  return {
    client,
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
  sanitizeSubscriptionRow,
  subscribe,
  unsubscribe,
  listSubscriptions,
  createInMemoryStore,
};
