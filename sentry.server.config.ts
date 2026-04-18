import * as Sentry from '@sentry/nextjs';

// Phase 202 Plan 05 — Sentry server-runtime init.
// Called by instrumentation.ts `register()` when NEXT_RUNTIME === 'nodejs' AND SENTRY_DSN is set.
// `tracesSampleRate: 0.1` keeps cost predictable; raise in incident response via env override.

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
