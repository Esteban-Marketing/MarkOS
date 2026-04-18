// Phase 203 Plan 10 Task 1 — webhook log-drain TypeScript dual-export.
// Mirror of lib/markos/webhooks/log-drain.cjs (see sibling).
export type WebhookLogLineInput = {
  domain?: 'webhook' | 'mcp';
  timestamp?: string;
  req_id?: string | null;
  tenant_id?: string | null;
  sub_id?: string | null;
  delivery_id?: string | null;
  event_type?: string | null;
  delivery_attempt?: number | null;
  duration_ms?: number | null;
  status?: string | null;
  error_code?: string | null;
  cost_cents?: number | null;
};

export type WebhookLogLine = Required<{
  [K in keyof WebhookLogLineInput]:
    | Exclude<WebhookLogLineInput[K], undefined>
    | null;
}>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const impl = require('./log-drain.cjs') as { emitLogLine: (e: WebhookLogLineInput) => WebhookLogLine };
export const { emitLogLine } = impl;
