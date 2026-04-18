// Phase 203 Plan 04 Task 1 — webhook delivery replay library (dual-export TS stub).
// See replay.cjs for full behavior contract; this module re-exports the CJS implementation for
// TypeScript/ESM consumers that want type coverage. Matches the webhook dual-export convention.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = require('./replay.cjs');

export type ReplaySingleParams = {
  tenant_id: string;
  subscription_id: string;
  delivery_id: string;
  actor_id: string;
  deps?: {
    enqueueAuditStaging?: (entry: unknown) => Promise<unknown>;
    actor_role?: string;
    now?: () => number;
  };
};

export type ReplayBatchParams = {
  tenant_id: string;
  subscription_id: string;
  delivery_ids: string[];
  actor_id: string;
  deps?: ReplaySingleParams['deps'];
};

export type ReplaySingleResult = {
  original_id: string;
  new_id: string;
};

export type ReplayBatchResult = {
  batch_id: string;
  count: number;
  replayed: Array<{ original_id: string; new_id: string }>;
  skipped: Array<{ original_id: string; reason: string }>;
};

export const BATCH_CAP: number = impl.BATCH_CAP;
export const IDEMPOTENCY_BUCKET_MS: number = impl.IDEMPOTENCY_BUCKET_MS;

export const replaySingle: (client: unknown, queue: unknown, params: ReplaySingleParams) => Promise<ReplaySingleResult> = impl.replaySingle;
export const replayBatch: (client: unknown, queue: unknown, params: ReplayBatchParams) => Promise<ReplayBatchResult> = impl.replayBatch;
