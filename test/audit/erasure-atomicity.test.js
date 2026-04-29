'use strict';

// Phase 201.1 D-106 W-2 closure: prove erase_audit_pii is atomic via fault injection.
// When the UPDATE side fails (BEFORE UPDATE trigger raises), the implicit PL/pgSQL
// transaction MUST roll back the entire function call, including the tombstone INSERT.
//
// Requires a real Supabase / Postgres test substrate.
// Set MARKOS_TEST_SUPABASE_URL + MARKOS_TEST_SUPABASE_SERVICE_ROLE_KEY in env.
//
// If the substrate is unavailable, this test fails loudly (W-2: silent skip is forbidden).

const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.MARKOS_TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.MARKOS_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const HAVE_REAL_DB = !!(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes('example.supabase.co') &&
  !SUPABASE_URL.includes('localhost')
);

test('erase_audit_pii rolls back tombstone when UPDATE fails (fault-injection atomicity)', async () => {
  if (!HAVE_REAL_DB) {
    // W-2: do NOT silently skip — fail with an explicit message.
    assert.fail(
      'erasure-atomicity.test.js requires a real Supabase test substrate. ' +
      'Set MARKOS_TEST_SUPABASE_URL + MARKOS_TEST_SUPABASE_SERVICE_ROLE_KEY in env. ' +
      'If running CI without a Supabase instance, mark M4 closure as PARTIAL in SUMMARY ' +
      'pending substrate setup. See 201.1-06-SUMMARY.md for setup notes.'
    );
  }

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const tenant_id = `atomicity-test-${Date.now()}`;
  const org_id = `org-atomicity-${Date.now()}`;

  // 1. Build a fixture chain of 3 rows via the standard writer.
  for (let i = 0; i < 3; i++) {
    const { error } = await client.rpc('append_markos_audit_row', {
      p_tenant_id:     tenant_id,
      p_org_id:        org_id,
      p_source_domain: 'tenancy',
      p_action:        `fixture.row_${i}`,
      p_actor_id:      'test-fixture',
      p_actor_role:    'system',
      p_payload:       { fixture: i, email: `user${i}@example.com` },
      p_occurred_at:   new Date().toISOString(),
    });
    assert.equal(error, null, `fixture row ${i} insert failed: ${error && error.message}`);
  }

  const { data: rows } = await client
    .from('markos_audit_log')
    .select('id, payload, row_hash')
    .eq('tenant_id', tenant_id)
    .order('id', { ascending: true });

  assert.equal(rows.length, 3, 'fixture must have exactly 3 rows');
  const target = rows[1];
  const preCallPayload = JSON.stringify(target.payload);
  const preCallRowHash = target.row_hash;

  // 2. Install fault-injection BEFORE UPDATE trigger via exec_sql_for_test helper.
  //    If exec_sql_for_test is not available, the test fails here — see SUMMARY for setup.
  const { error: triggerError } = await client.rpc('exec_sql_for_test', {
    sql: `
      create or replace function fault_inject_redaction_trg()
      returns trigger language plpgsql as $$
      begin
        if new.payload ? '__redacted' then
          raise exception 'fault_injection: redaction blocked for atomicity test';
        end if;
        return new;
      end; $$;
      drop trigger if exists fault_inject_redaction_trg on markos_audit_log;
      create trigger fault_inject_redaction_trg
        before update on markos_audit_log
        for each row execute function fault_inject_redaction_trg();
    `,
  });

  if (triggerError) {
    // exec_sql_for_test not available — document setup requirement and fail loudly.
    assert.fail(
      `erasure-atomicity.test.js: exec_sql_for_test RPC is not available (${triggerError.message}). ` +
      'A service_role-restricted helper function must be created for trigger installation in tests. ' +
      'See 201.1-06-SUMMARY.md "Test Substrate Setup" section.'
    );
  }

  // 3. Call erase_audit_pii — MUST raise due to the fault-injection trigger.
  let caughtError = null;
  try {
    await client.rpc('erase_audit_pii', {
      p_audit_row_id:    target.id,
      p_redaction_marker: 'gdpr_art_17_atomicity_test',
      p_actor_id:         'test-actor',
    });
  } catch (err) {
    caughtError = err;
  }

  // Assert (c): the call must raise.
  assert.ok(caughtError, 'erase_audit_pii must raise when UPDATE side fails');
  assert.match(
    String(caughtError.message || caughtError),
    /fault_injection/,
    'error must propagate the fault-injection marker'
  );

  // Assert (a): zero tombstones with action='audit.pii_erased' for this tenant.
  const { data: tombstones } = await client
    .from('markos_audit_log')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('action', 'audit.pii_erased');
  assert.equal(
    tombstones.length, 0,
    'tombstone INSERT must roll back when UPDATE fails'
  );

  // Assert (b): the original row's payload is byte-identical to pre-call.
  const { data: postRow } = await client
    .from('markos_audit_log')
    .select('payload, row_hash')
    .eq('id', target.id)
    .maybeSingle();
  assert.equal(
    JSON.stringify(postRow.payload),
    preCallPayload,
    'payload must be byte-identical to pre-call'
  );
  assert.equal(
    postRow.row_hash,
    preCallRowHash,
    'row_hash must be byte-identical to pre-call'
  );

  // Cleanup: drop the fault-injection trigger and function.
  await client.rpc('exec_sql_for_test', {
    sql: `
      drop trigger if exists fault_inject_redaction_trg on markos_audit_log;
      drop function if exists fault_inject_redaction_trg();
    `,
  }).catch(() => null);

  // Cleanup: delete test fixture rows.
  await client.from('markos_audit_log').delete().eq('tenant_id', tenant_id);
});
