import { withSentryConfig } from '@sentry/nextjs';

// Phase 202 Plan 05 — minimal Next.js config wrapped with Sentry.
// Creates source maps for production errors in Sentry when SENTRY_AUTH_TOKEN is present at build time.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  org: 'markos',
  project: 'markos-web',
  silent: !process.env.CI,
});
