'use strict';
// Phase 203 Plan 01 Task 2 — TS dual-export mirror of store-vercel-queue.cjs.

const impl = require('./store-vercel-queue.cjs');

export type VercelQueueDeps = {
  send?: (topic: string, payload: { delivery_id: string }, opts?: { idempotencyKey?: string }) => Promise<unknown>;
};

export type VercelQueueClient = {
  push: (delivery_id: string, options?: { idempotencyKey?: string }) => Promise<unknown>;
};

export const createVercelQueueClient = impl.createVercelQueueClient as (args: {
  topic: string;
  deps?: VercelQueueDeps;
}) => VercelQueueClient;
