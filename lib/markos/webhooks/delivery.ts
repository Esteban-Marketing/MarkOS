import type { WebhookEvent, WebhookStore, WebhookSubscription } from './engine';

export const MAX_ATTEMPTS = 24;
export const BASE_DELAY_SECONDS = 5;
export const MAX_DELAY_SECONDS = 24 * 60 * 60;

export const STATUS = {
  PENDING: 'pending',
  RETRYING: 'retrying',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

export type DeliveryStatus = (typeof STATUS)[keyof typeof STATUS];

export type WebhookDelivery = {
  id: string;
  subscription_id: string;
  tenant_id: string;
  event: WebhookEvent | string;
  payload: Record<string, unknown>;
  attempt: number;
  status: DeliveryStatus;
  response_code: number | null;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
  // Phase 203-04/05 additive columns — documented in F-73 delivery contract.
  replayed_from?: string | null;
  dlq_reason?: string | null;
  dlq_at?: string | null;
};

export type DeliveryStore = {
  insert: (row: WebhookDelivery) => Promise<WebhookDelivery>;
  findById: (id: string) => Promise<WebhookDelivery | null>;
  update: (id: string, patch: Partial<WebhookDelivery>) => Promise<WebhookDelivery | null>;
  listByTenant: (tenant_id: string) => Promise<WebhookDelivery[]>;
};

export type Queue = {
  push: (delivery_id: string) => Promise<void>;
};

export type EnqueueInput = {
  subscription: WebhookSubscription;
  event: WebhookEvent | string;
  payload?: Record<string, unknown>;
};

export declare function computeBackoffSeconds(attempt: number): number;
export declare function createInMemoryQueue(): Queue & { drain(): string[]; size(): number };
export declare function createInMemoryDeliveryStore(): DeliveryStore;
export declare function enqueueDelivery(
  deliveries: DeliveryStore,
  queue: Queue,
  input: EnqueueInput,
): Promise<WebhookDelivery>;
export type ProcessDeliveryOptions = {
  fetch?: typeof fetch;
  now?: () => number;
  // Phase 203-02 Task 1: dispatch-time SSRF re-check (DNS-rebinding defense).
  // When provided, the SSRF guard uses this lookup instead of node:dns.
  lookup?: (host: string, opts: { family: number }) => Promise<{ address: string; family: number }>;
};

export declare function processDelivery(
  deliveries: DeliveryStore,
  subscriptions: Pick<WebhookStore, 'findById'>,
  delivery_id: string,
  options?: ProcessDeliveryOptions,
): Promise<
  | { delivered: true; status: number; attempt: number }
  | { delivered: false; reason?: string; attempt?: number; status?: DeliveryStatus; next_retry_at?: string; last_error?: string }
>;
