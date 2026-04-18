'use strict';
// Phase 203 Plan 03 Task 1 — TypeScript dual-export stub.
// Source of truth lives in dlq.cjs; TS callers import named exports via this stub.

const dlq = require('./dlq.cjs');

export type ListDLQOptions = { tenant_id: string; subscription_id?: string };
export type CountDLQOptions = { tenant_id: string };
export type MarkFailedOptions = { reason: string; final_attempt: number };
export type PurgeOptions = {
  now?: Date;
  deps?: {
    enqueueAuditStaging?: (client: any, entry: any) => Promise<any>;
  };
};
export type PurgeResult = { count: number };

export const listDLQ =
  dlq.listDLQ as (client: any, opts: ListDLQOptions) => Promise<any[]>;
export const countDLQ =
  dlq.countDLQ as (client: any, opts: CountDLQOptions) => Promise<number>;
export const markFailed =
  dlq.markFailed as (client: any, id: string, opts: MarkFailedOptions) => Promise<any | null>;
export const markDelivered =
  dlq.markDelivered as (client: any, id: string) => Promise<any | null>;
export const purgeExpired =
  dlq.purgeExpired as (client: any, opts?: PurgeOptions) => Promise<PurgeResult>;
export const DLQ_WINDOW_DAYS = dlq.DLQ_WINDOW_DAYS as 7;
