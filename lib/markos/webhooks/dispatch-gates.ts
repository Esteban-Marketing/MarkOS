'use strict';
// Phase 203 Plan 07 Task 2 — Dispatch-Gates Indirection Module (TS dual-export stub).
// Source of truth lives in dispatch-gates.cjs.

const dg = require('./dispatch-gates.cjs');

export type GateAllowed = { status: 'allowed' };
export type GateRateLimited = {
  status: 'rate_limited';
  retryAfterSec: number;
  limit: number;
  reason: string;
};
// Plan 203-08 will add:
//   export type GateBreakerOpen = { status: 'breaker_open'; retryAfterSec: number; ... };
export type GateDisposition = GateAllowed | GateRateLimited;

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
