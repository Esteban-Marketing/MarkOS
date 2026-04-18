// Phase 203 Plan 10 Task 1 — webhook Sentry TypeScript dual-export.
// Mirror of lib/markos/webhooks/sentry.cjs.
export type WebhookErrorCtx = {
  req_id?: string;
  delivery_id?: string;
  sub_id?: string;
  tenant_id?: string;
  event_type?: string;
  attempt?: number;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const impl = require('./sentry.cjs') as {
  captureToolError: (err: unknown, ctx: WebhookErrorCtx, deps?: { sentry?: unknown }) => boolean;
  setupSentryContext: (ctx: WebhookErrorCtx, deps?: { sentry?: unknown }) => void;
  _internalResetForTests: () => void;
};
export const { captureToolError, setupSentryContext, _internalResetForTests } = impl;
