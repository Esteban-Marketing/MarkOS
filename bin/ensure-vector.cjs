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
      upstash_vector: {
        configured: Boolean(upstashUrl && upstashToken),
        url: upstashUrl || null,
      },
    },
  };

  if (!report.providers.supabase.configured || !report.providers.upstash_vector.configured) {
    report.status = 'providers_degraded';
    report.message = 'One or more vector providers are not configured. Set SUPABASE_* and UPSTASH_VECTOR_* variables.';
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
