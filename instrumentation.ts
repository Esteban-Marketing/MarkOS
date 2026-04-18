// Phase 202 Plan 05 — Next.js instrumentation hook.
// Dynamic-imports sentry.server.config ONLY on the Node.js runtime when SENTRY_DSN is set,
// so edge/runtime builds stay lean and local dev without DSN is a no-op (graceful degrade).
// onRequestError is the Next.js hook that Sentry uses to capture unhandled request errors.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    await import('./sentry.server.config');
  }
}

export const onRequestError = async (err: unknown, request: Request, context: unknown) => {
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import('@sentry/nextjs');
  return captureRequestError(err, request as any, context as any);
};
