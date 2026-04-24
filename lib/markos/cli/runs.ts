// Phase 204 Plan 06 Task 1 — TypeScript twin for runs.cjs.
//
// Runtime source of truth is runs.cjs. This file is a type-only facade — it
// re-exports the runtime so TypeScript consumers (Plan 205/207 middleware,
// future UI) can import typed signatures without duplicating the CJS module.

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./runs.cjs');

export type RunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export type RunPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface RunRow {
  id: string;
  tenant_id: string;
  user_id: string;
  brief_json: Record<string, unknown>;
  status: RunStatus;
  steps_completed: number;
  steps_total: number;
  result_json?: Record<string, unknown> | null;
  error_message?: string | null;
  trigger_kind: string;
  source_surface: string;
  priority: RunPriority;
  chain_id?: string | null;
  correlation_id?: string | null;
  agent_id: string;
  agent_registry_version: string;
  estimated_cost_usd_micro: number;
  actual_cost_usd_micro: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface SubmitRunParams {
  client: unknown;
  tenant_id: string;
  user_id: string;
  brief: Record<string, unknown>;
  priority?: RunPriority;
  chain_id?: string | null;
  correlation_id?: string | null;
  agent_id?: string;
}

export interface SubmitRunResult {
  run_id: string;
  status: RunStatus;
  tenant_id: string;
  priority: RunPriority;
  correlation_id: string;
  events_url: string;
}

export interface StreamRunEventsParams {
  client: unknown;
  run_id: string;
  tenant_id: string;
  writer: { write(chunk: string): void; end?(): void };
  signal?: AbortSignal;
  lastEventId?: string | number | null;
  pollMs?: number;
  heartbeatMs?: number;
  maxMs?: number;
}

export declare function submitRun(params: SubmitRunParams): Promise<SubmitRunResult>;
export declare function streamRunEvents(params: StreamRunEventsParams): Promise<void>;
export declare function listRuns(params: { client: unknown; tenant_id: string; limit?: number }): Promise<Array<Partial<RunRow>>>;
export declare function getRun(params: { client: unknown; tenant_id: string; run_id: string }): Promise<RunRow | null>;
export declare function cancelRun(params: { client: unknown; tenant_id: string; user_id?: string; run_id: string }): Promise<{ run_id: string; status: RunStatus; was_terminal: boolean } | null>;

export declare const RUNS_TABLE: string;
export declare const RUN_STATES: ReadonlyArray<RunStatus>;
export declare const TERMINAL_STATES: ReadonlySet<RunStatus>;

// @ts-ignore
module.exports = runtime;
