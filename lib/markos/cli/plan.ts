// Phase 204 Plan 05 Task 2 — TypeScript twin export for plan primitives.
//
// Runtime implementation lives in `plan.cjs`. This file is a type-only facade
// consumed by TS tooling + downstream Phase 205/207 middleware. The .cjs
// module is the source of truth. Signatures MUST remain identical.

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./plan.cjs');

export interface PlanStep {
  name: string;
  inputs: string[];
  estimated_tokens: number;
}

// Subset of Phase 207 AgentRunPriority. Plan 204-06 will tighten this to the
// full enum when it consumes the locked contract.
export type PlanPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface PlanEnvelope {
  run_id: null;                       // always null for dry-run
  plan_id: string;                    // 'plan_' + 16 hex chars
  steps: PlanStep[];
  estimated_tokens: number;
  estimated_cost_usd: number;
  estimated_cost_usd_micro: number;   // AgentRun v2 compatible (BIGINT in DB)
  estimated_duration_ms: number;
  tenant_id: string;
  priority: PlanPriority;
  chain_id: string | null;
  model: string | null;
  agent_id: string;
}

export interface BuildPlanEnvelopeParams {
  tenant_id: string;
  plan_id?: string;
  model?: string | null;
  priority?: PlanPriority;
}

export declare const PLAN_STEPS: ReadonlyArray<Readonly<PlanStep>>;
export declare const COST_PER_TOKEN_USD: number;
export declare const DEFAULT_PRIORITY: PlanPriority;
export declare const AGENT_ID: string;

export declare function generatePlanId(): string;
export declare function computeTokens(steps: PlanStep[]): number;
export declare function computeCostUsd(tokens: number): number;
export declare function computeCostUsdMicro(tokens: number): number;
export declare function computeDurationMs(steps: PlanStep[], tokens: number): number;
export declare function buildPlanEnvelope(params: BuildPlanEnvelopeParams): PlanEnvelope;

// Re-export runtime for CJS interop.
// @ts-ignore
module.exports = runtime;
