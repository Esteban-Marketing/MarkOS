import { randomBytes, randomUUID } from 'node:crypto';
import { validateWebhookUrl } from './url-validator';
import { createInMemoryVaultClient, deleteSecret, storeSecret, type VaultReadableClient } from './secret-vault';

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
  'byod.verification_lost',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type WebhookSubscription = {
  id: string;
  tenant_id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  created_at: string;
  updated_at: string;
  secret?: string;
  secret_v2?: string | null;
  secret_vault_ref?: string | null;
  grace_started_at?: string | null;
  grace_ends_at?: string | null;
  rotation_state?: 'active' | 'rolled_back' | null;
  rps_override?: number | null;
};

export type PublicWebhookSubscription = Omit<WebhookSubscription, 'secret' | 'secret_v2' | 'secret_vault_ref'>;

export type SubscribeInput = {
  tenant_id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  rps_override?: number | null;
};

export type SubscribeResult = {
  subscription: PublicWebhookSubscription;
  plaintext_secret_show_once: string;
};

export type WebhookStore = {
  client?: VaultReadableClient;
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

export function sanitizeSubscriptionRow(row: WebhookSubscription): PublicWebhookSubscription {
  const { secret, secret_v2, secret_vault_ref, ...publicRow } = row;
  return publicRow;
}

export type WebhookAuditOpts = {
  auditClient?: { from: (table: string) => unknown };
  org_id?: string | null;
  actor_id?: string;
  actor_role?: string;
  vaultClient?: VaultReadableClient;
  allowLocalhostHttp?: boolean;
  lookup?: (host: string, opts: { all: boolean; family: number }) =>
    Promise<Array<{ address: string; family: number }> | { address: string; family: number }>;
  validateUrl?: typeof validateWebhookUrl;
};

export async function subscribe(
  store: WebhookStore,
  input: SubscribeInput,
  _opts?: WebhookAuditOpts,
): Promise<SubscribeResult> {
  if (!input.tenant_id) throw new Error('tenant_id is required');
  assertValidUrl(input.url);
  assertValidEvents(input.events);

  const validation = await (_opts?.validateUrl || validateWebhookUrl)(input.url, {
    allowLocalhostHttp: _opts?.allowLocalhostHttp ?? (process.env.MARKOS_WEBHOOK_ALLOW_LOCALHOST_HTTP === '1'),
    lookup: _opts?.lookup,
  });
  if (!validation.ok) {
    const suffix = validation.detail ? `:${validation.detail}` : '';
    throw new Error(`invalid_subscriber_url:${validation.reason}${suffix}`);
  }

  const vaultClient = _opts?.vaultClient || store.client;
  if (!vaultClient) throw new Error('vault_unavailable:missing_client');

  const now = new Date().toISOString();
  const plaintextSecret = input.secret ?? generateSecret();
  const row: WebhookSubscription = {
    id: `whsub_${randomUUID()}`,
    tenant_id: input.tenant_id,
    url: input.url,
    events: [...input.events],
    active: true,
    secret_vault_ref: null,
    rps_override: input.rps_override === undefined ? null : input.rps_override,
    created_at: now,
    updated_at: now,
  };

  let vaultRef: string | null = null;
  try {
    vaultRef = await storeSecret(vaultClient, row.id, plaintextSecret);
    row.secret_vault_ref = vaultRef;
    const inserted = await store.insert(row);
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

export async function unsubscribe(
  store: WebhookStore,
  tenant_id: string,
  id: string,
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
