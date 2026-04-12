#!/usr/bin/env node
/**
 * ensure-vector.cjs
 * Validates Supabase + Upstash Vector configuration for MarkOS runtime boot.
 */
'use strict';

async function ensureVectorStores() {
  const supabaseUrl = process.env.SUPABASE_URL || null;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL || null;
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN || null;

  const report = {
    status: 'providers_ready',
    timestamp: new Date().toISOString(),
    providers: {
      supabase: {
        configured: Boolean(supabaseUrl && supabaseKey),
        url: supabaseUrl || null,
      },
      pageindex: {
        configured: Boolean(supabaseUrl && supabaseKey),
        mode: 'supabase_rls_scoped_query',
      },
      upstash_vector: {
        configured: Boolean(upstashUrl && upstashToken),
        url: upstashUrl || null,
        legacy_optional: true,
      },
    },
  };

  if (!report.providers.supabase.configured) {
    report.status = 'providers_degraded';
    report.message = 'Supabase is required for active PageIndex retrieval readiness.';
    report.actionable_next_step = 'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) to .env.';
  } else {
    report.message = report.providers.upstash_vector.configured
      ? 'Supabase/PageIndex retrieval is ready; legacy Upstash compatibility remains configured.'
      : 'Supabase/PageIndex retrieval is ready; Upstash is not required after hard cutover.';
    report.actionable_next_step = report.providers.upstash_vector.configured
      ? null
      : 'No action required for retrieval. Configure UPSTASH_VECTOR_* only if legacy compatibility writes are needed.';
  }

  return report;
}

module.exports = { ensureVectorStores };

if (require.main === module) {
  ensureVectorStores()
    .then((report) => {
      console.log(`[vector] ${report.status}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[vector] bootstrap failed: ${error.message}`);
      process.exit(1);
    });
}
