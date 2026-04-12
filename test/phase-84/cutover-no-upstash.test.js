const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  configure,
  getLiteracyContext,
} = require('../../onboarding/backend/vector-store-client.cjs');
const { ensureVectorStores } = require('../../bin/ensure-vector.cjs');

function withEnv(overrides, fn) {
  const original = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(original)) {
        if (value === null || value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
      configure({});
    });
}

test('84-03 retrieval lane stays operational when UPSTASH_VECTOR_* is unset', async () => {
  await withEnv({
    SUPABASE_URL: null,
    SUPABASE_SERVICE_ROLE_KEY: null,
    SUPABASE_ANON_KEY: null,
    UPSTASH_VECTOR_REST_URL: null,
    UPSTASH_VECTOR_REST_TOKEN: null,
  }, async () => {
    configure({});
    const items = await getLiteracyContext('Paid Media', 'health', { tenant_scope: 'tenant-a' }, 3);
    assert.deepEqual(items, []);
  });
});

test('84-03 readiness contract reports Supabase/PageIndex posture without requiring Upstash', async () => {
  await withEnv({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_ANON_KEY: null,
    UPSTASH_VECTOR_REST_URL: null,
    UPSTASH_VECTOR_REST_TOKEN: null,
  }, async () => {
    const report = await ensureVectorStores();
    assert.equal(report.status, 'providers_ready');
    assert.equal(report.providers.supabase.configured, true);
    assert.equal(report.providers.pageindex.configured, true);
    assert.equal(report.providers.upstash_vector.configured, false);
    assert.match(report.message, /Upstash is not required/i);
  });
});

test('84-03 static cutover scan fails on legacy retrieval symbols and passes on current active paths', () => {
  const scriptPath = path.resolve(__dirname, '../../scripts/phase-84/static-cutover-scan.cjs');
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /static cutover scan passed/i);
});
