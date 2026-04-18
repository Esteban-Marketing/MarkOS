'use strict';
// Phase 203 Plan 07 Task 2 — Dispatch-Gates Indirection Module (TS dual-export stub).
// Phase 203 Plan 08 Task 2 — GateBreakerOpen disposition added.
// Source of truth lives in dispatch-gates.cjs.

const dg = require('./dispatch-gates.cjs');

export type GateAllowed = { status: 'allowed' };
export type GateRateLimited = {
  status: 'rate_limited';
  retryAfterSec: number;
  limit: number;
  reason: string;
};
export type GateBreakerOpen = {
  status: 'breaker_open';
  retryAfterSec: number;
  reason: 'breaker_open';
  breaker: {
    state: 'open' | 'half-open' | 'closed';
    trips?: number;
    probe_at?: number;
  };
};
export type GateDisposition = GateAllowed | GateRateLimited | GateBreakerOpen;

export const runDispatchGates = dg.runDispatchGates as (input: {
  subId: string;
  tenantId: string;
  eventId: string;
  planTier: string;
  subscription: { id: string; rps_override?: number | null; [k: string]: unknown };
  redis: unknown;
}) => Promise<GateDisposition>;

export const handleGateBlock = dg.handleGateBlock as (input: {
  gate: GateDisposition;
  deliveryId: string;
  deliveries: { update: (id: string, patch: Record<string, unknown>) => Promise<unknown> };
  now?: number;
}) => Promise<{ delivered: false; status: string; retry_after: number }>;
