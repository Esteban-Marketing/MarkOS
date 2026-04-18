// Phase 201 Plan 08 Task 1: Vercel configuration-as-TypeScript.
// Registers cron schedules for audit drain, tenant purge, and signup buffer cleanup.
// Phase 202 Plan 01 Task 3: extended with MCP session cleanup cron (D-06 retention).
// Phase 202 Plan 10 Task 3: extended with weekly MCP KPI digest (D-23 install tracking).
// Phase 203 Plan 01 Task 2: extended with Vercel Queues push consumer (queue/v2beta —
// rename expected when Vercel exits beta; see deferred-items.md).
// Phase 203 Plan 03 Task 2: extended with webhooks DLQ purge cron (D-08 7-day TTL).
// Phase 203 Plan 06 Task 1: extended with webhook rotation notification cron (D-11
// T-7/T-1/T-0 admin email sweep; shares MARKOS_WEBHOOK_CRON_SECRET with 03).
// Vercel picks vercel.ts over vercel.json when both are present, so the rewrite block
// from vercel.json is mirrored here to preserve the phase 200 onboarding routes.

export default {
  version: 2,
  rewrites: [
    { source: '/config', destination: '/api/config' },
    { source: '/status', destination: '/api/status' },
    { source: '/submit', destination: '/api/submit' },
    { source: '/regenerate', destination: '/api/regenerate' },
    { source: '/approve', destination: '/api/approve' },
    { source: '/', destination: '/onboarding/index.html' },
    { source: '/(.*)', destination: '/onboarding/$1' },
  ],
  crons: [
    // Audit drain (Plan 201-02) — staging rows → unified markos_audit_log with hash chain
    { path: '/api/audit/drain', schedule: '*/1 * * * *' },
    // Tenant lifecycle purge (Plan 201-07) — day-30 cleanup + GDPR bundle generation
    { path: '/api/tenant/lifecycle/purge-cron', schedule: '0 3 * * *' },
    // Signup buffer cleanup (Plan 201-03) — drops unverified markos_unverified_signups rows
    { path: '/api/auth/cleanup-unverified-signups', schedule: '0 */1 * * *' },
    // MCP session cleanup (Plan 202-01) — hard-purge rows where expires_at or revoked_at + 7d has passed (D-06 retention)
    { path: '/api/mcp/session/cleanup', schedule: '0 */6 * * *' },
    // MCP KPI digest (Plan 202-10) — weekly founders email: installs + top tools + p95 (D-23 >= 50 installs/30d)
    { path: '/api/cron/mcp-kpi-digest', schedule: '0 9 * * 1' },
    // Webhook DLQ purge (Plan 203-03) — hard-delete failed deliveries past 7d (D-08); audit row emitted per batch
    { path: '/api/cron/webhooks-dlq-purge', schedule: '30 3 * * *' },
    // Webhook rotation notifications (Plan 203-06) — sweep active rotations at T-7/T-1/T-0 stages and email
    // tenant admins (role in owner/admin). Redis SET NX EX 90d dedupes each rotation+stage to exactly one send.
    { path: '/api/cron/webhooks-rotation-notify', schedule: '0 4 * * *' },
  ],
  functions: {
    // Phase 203 Plan 01: Vercel Queues push consumer (queue/v2beta — rename expected when
    // Vercel exits beta; see deferred-items.md). Consumer delegates to processDelivery +
    // returns { acknowledge: true } after 24 attempts to match engine.cjs MAX_ATTEMPTS.
    'api/webhooks/queues/deliver.js': {
      experimentalTriggers: [
        { type: 'queue/v2beta', topic: 'markos-webhook-delivery', retryAfterSeconds: 60 },
      ],
    },
  },
};
