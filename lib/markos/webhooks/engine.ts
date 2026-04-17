import { randomBytes, randomUUID } from 'node:crypto';

export const WEBHOOK_EVENTS = [
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
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type WebhookSubscription = {
  id: string;
  tenant_id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscribeInput = {
  tenant_id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
};

export type WebhookStore = {
  insert: (row: WebhookSubscription) => Promise<WebhookSubscription>;
  updateActive: (tenant_id: string, id: string, active: boolean) => Promise<WebhookSubscription | null>;
  listByTenant: (tenant_id: string) => Promise<WebhookSubscription[]>;
  findById: (tenant_id: string, id: string) => Promise<WebhookSubscription | null>;
};

function assertValidEvents(events: WebhookEvent[]): void {
  if (!events || events.length === 0) {
    throw new Error('events is required and must be non-empty');
  }
  const allowed = new Set<string>(WEBHOOK_EVENTS);
  for (const event of events) {
    if (!allowed.has(event)) throw new Error(`unknown event: ${event}`);
  }
}

function assertValidUrl(url: string): void {
  if (!url) throw new Error('url is required');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('url must be http(s)');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`invalid url: ${message}`);
  }
}

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

// Phase 201 Plan 08 Task 1: optional audit-emit carrier for subscribe/unsubscribe.
// Backward-compatible: opts is optional; callers that don't pass it get the existing behaviour.
export type WebhookAuditOpts = {
  auditClient?: { from: (table: string) => unknown };
  org_id?: string | null;
  actor_id?: string;
  actor_role?: string;
};

export async function subscribe(
  store: WebhookStore,
  input: SubscribeInput,
  // _opts: TS signature carrier — runtime wiring lives in engine.cjs
  _opts?: WebhookAuditOpts,
): Promise<WebhookSubscription> {
  if (!input.tenant_id) throw new Error('tenant_id is required');
  assertValidUrl(input.url);
  assertValidEvents(input.events);

  const now = new Date().toISOString();
  const row: WebhookSubscription = {
    id: `whsub_${randomUUID()}`,
    tenant_id: input.tenant_id,
    url: input.url,
    secret: input.secret ?? generateSecret(),
    events: [...input.events],
    active: true,
    created_at: now,
    updated_at: now,
  };
  return store.insert(row);
}

export async function unsubscribe(
  store: WebhookStore,
  tenant_id: string,
  id: string,
  // _opts: TS signature carrier — runtime wiring lives in engine.cjs
  _opts?: WebhookAuditOpts,
): Promise<WebhookSubscription> {
  const updated = await store.updateActive(tenant_id, id, false);
  if (!updated) throw new Error(`subscription not found: ${id}`);
  return updated;
}

export async function listSubscriptions(
  store: WebhookStore,
  tenant_id: string,
): Promise<WebhookSubscription[]> {
  if (!tenant_id) throw new Error('tenant_id is required');
  return store.listByTenant(tenant_id);
}

export function createInMemoryStore(): WebhookStore {
  const rows = new Map<string, WebhookSubscription>();
  return {
    async insert(row) {
      rows.set(row.id, row);
      return row;
    },
    async updateActive(tenant_id, id, active) {
      const row = rows.get(id);
      if (!row || row.tenant_id !== tenant_id) return null;
      const next: WebhookSubscription = { ...row, active, updated_at: new Date().toISOString() };
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
