'use strict';
// Phase 203 Plan 01 Task 1 — TypeScript dual-export stub (mirrors Phase 202 sessions.ts).
// Source of truth lives in store.cjs; TS callers import named exports via this stub.

const impl = require('./store.cjs');

export type WebhookStoreMode = 'memory' | 'supabase';

export type WebhookStoreDeps = {
  mode?: WebhookStoreMode;
  supabase?: unknown;
  queue?: { push: (delivery_id: string, opts?: { idempotencyKey?: string }) => Promise<void> | void };
};

export type WebhookStoresBundle = {
  subscriptions: {
    client?: unknown;
    insert: (row: any) => Promise<any>;
    updateActive: (tenant_id: string, id: string, active: boolean) => Promise<any | null>;
    listByTenant: (tenant_id: string) => Promise<any[]>;
    findById: (tenant_id: string, id: string) => Promise<any | null>;
  };
  deliveries: {
    client?: unknown;
    insert: (row: any) => Promise<any>;
    findById: (id: string) => Promise<any | null>;
    update: (id: string, patch: Record<string, any>) => Promise<any | null>;
    listByTenant: (
      tenant_id: string,
      opts?: { status?: string; since?: string; limit?: number },
    ) => Promise<any[]>;
  };
  queue: {
    push: (delivery_id: string, opts?: { idempotencyKey?: string }) => Promise<void> | void;
    drain?: () => string[];
  };
};

export const getWebhookStores = impl.getWebhookStores as (deps?: WebhookStoreDeps) => WebhookStoresBundle;
export const _resetWebhookStoresForTests = impl._resetWebhookStoresForTests as () => void;
