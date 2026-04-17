// Phase 201 Plan 08 Task 1: Vercel configuration-as-TypeScript.
// Registers cron schedules for audit drain, tenant purge, and signup buffer cleanup.
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
    // Audit drain (Plan 02) — staging rows → unified markos_audit_log with hash chain
    { path: '/api/audit/drain', schedule: '*/1 * * * *' },
    // Tenant lifecycle purge (Plan 07) — day-30 cleanup + GDPR bundle generation
    { path: '/api/tenant/lifecycle/purge-cron', schedule: '0 3 * * *' },
    // Signup buffer cleanup (Plan 03) — drops unverified markos_unverified_signups rows
    { path: '/api/auth/cleanup-unverified-signups', schedule: '0 */1 * * *' },
  ],
};
