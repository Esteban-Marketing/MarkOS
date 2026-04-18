'use strict';
// Phase 203 Plan 08 — Webhook circuit breaker (TS dual-export stub).
// Source of truth lives in breaker.cjs.

const breaker = require('./breaker.cjs');

export type BreakerStateName = 'closed' | 'half-open' | 'open';

export type BreakerStateSnapshot = {
  state: BreakerStateName;
  trips?: number;
  probe_at?: number;
};

export type CanDispatchResult =
  | { can_dispatch: true; state: 'closed' }
  | { can_dispatch: true; state: 'half-open'; trips?: number }
  | { can_dispatch: false; state: 'open'; trips?: number; probe_at?: number };

export type RecordOutcomeResult =
  | { state: 'closed' }
  | { state: 'open'; trips: number; probe_at: number };

export type ClassifyInput = {
  http?: number;
  timeout?: boolean;
  network_error?: boolean;
};

export const recordOutcome = breaker.recordOutcome as (
  redis: unknown,
  sub_id: string,
  outcome: 'success' | 'failure',
) => Promise<RecordOutcomeResult>;

export const canDispatch = breaker.canDispatch as (
  redis: unknown,
  sub_id: string,
) => Promise<CanDispatchResult>;

export const classifyOutcome = breaker.classifyOutcome as (
  input: ClassifyInput,
) => 'success' | 'failure';

export const getBreakerState = breaker.getBreakerState as (
  redis: unknown,
  sub_id: string,
) => Promise<BreakerStateSnapshot>;

export const WINDOW_SIZE: number = breaker.WINDOW_SIZE;
export const TRIP_THRESHOLD: number = breaker.TRIP_THRESHOLD;
export const HALF_OPEN_BACKOFF_SEC: ReadonlyArray<number> = breaker.HALF_OPEN_BACKOFF_SEC;
