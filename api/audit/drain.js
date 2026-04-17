'use strict';

// Phase 201 Plan 02: cron-driven drain of markos_audit_log_staging → markos_audit_log
// via append_markos_audit_row. Idempotent: rows whose claimed_at IS NOT NULL are skipped.
// Wired to a schedule by Plan 08 in the consolidated vercel.ts update.

const { writeAuditRow } = require('../../lib/markos/audit/writer.cjs');

const BATCH_SIZE = 500;

async function handleDrain(supabaseClient) {
  const started_at = new Date().toISOString();
  let processed = 0;
  const errors = [];

  // SELECT unclaimed staging rows. In production this is a service-role client and the
  // RLS append-only policy does NOT block service-role mutations to staging.
  const { data: rows, error } = await supabaseClient
    .from('markos_audit_log_staging')
    .select('id, tenant_id, org_id, source_domain, action, actor_id, actor_role, payload, occurred_at')
    .is('claimed_at', null)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return { ok: false, processed: 0, errors: [{ stage: 'select', message: error.message }] };
  }

  for (const staged of rows || []) {
    try {
      await writeAuditRow(supabaseClient, {
        tenant_id:     staged.tenant_id,
        org_id:        staged.org_id,
        source_domain: staged.source_domain,
        action:        staged.action,
        actor_id:      staged.actor_id || 'system',
        actor_role:    staged.actor_role || 'system',
        payload:       staged.payload || {},
        occurred_at:   staged.occurred_at,
      });

      const { error: markErr } = await supabaseClient
        .from('markos_audit_log_staging')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', staged.id);

      if (markErr) {
        errors.push({ staging_id: staged.id, stage: 'mark_claimed', message: markErr.message });
      } else {
        processed += 1;
      }
    } catch (err) {
      errors.push({ staging_id: staged.id, stage: 'append', message: err.message });
      // Leave claimed_at NULL → next cron run retries.
    }
  }

  return { ok: errors.length === 0, processed, errors, started_at, finished_at: new Date().toISOString() };
}

// Vercel Function handler. Verifies a cron secret; production wiring to Supabase service-role
// client is lightweight — this file exposes both the handler and the core function so tests
// can call the core with a mocked client.
async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  const secret = process.env.MARKOS_AUDIT_DRAIN_SECRET || '';
  const provided = req.headers && (req.headers['x-markos-cron-secret'] || req.headers['X-Markos-Cron-Secret']);
  if (!secret || provided !== secret) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'unauthorised' }));
  }

  let client;
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'client_init_failed', message: e.message }));
  }

  const result = await handleDrain(client);
  res.statusCode = result.ok ? 200 : 207; // 207 = partial success
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
}

module.exports = handler;
module.exports.handleDrain = handleDrain;
module.exports.BATCH_SIZE = BATCH_SIZE;
