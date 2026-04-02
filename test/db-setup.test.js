const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { parseCliArgs } = require('../bin/cli-runtime.cjs');
const {
  ensureGitignoreHasEnv,
  redactSecret,
  runDbSetup,
} = require('../bin/db-setup.cjs');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-db-setup-'));
}

test('42-02-01 route db:setup through CLI command parser', async () => {
  const parsed = parseCliArgs(['db:setup']);
  assert.equal(parsed.command, 'db:setup');
});

test('42-02-02 interactive credential wizard captures required keys and redacts secrets', async () => {
  const prompts = [
    'https://supabase.example.com',
    'supabase-secret-value',
    'https://upstash.example.com',
    'upstash-secret-value',
  ];

  const tmpDir = makeTempDir();
  const output = [];
  try {
    const report = await runDbSetup({
      cwd: tmpDir,
      prompt: {
        ask: async () => prompts.shift(),
        close: () => {},
      },
      output: (line) => output.push(String(line)),
      probeSupabase: async () => {},
      probeUpstash: async () => {},
      runMigrations: async () => ({ applied: [], skipped: [], total: 0 }),
      verifyRls: async () => ({ ok: true, tables: [] }),
      auditNamespaces: async () => ({ ok: true, errors: [] }),
    });

    assert.equal(report.ok, true);
    assert.equal(report.redacted.SUPABASE_SERVICE_ROLE_KEY.includes('supabase-secret-value'), false);
    assert.equal(report.redacted.UPSTASH_VECTOR_REST_TOKEN.includes('upstash-secret-value'), false);
    assert.match(report.redacted.SUPABASE_SERVICE_ROLE_KEY, /\*\*\*/);
    assert.match(output.join('\n'), /Collected credentials \(redacted\)/);
    assert.equal(redactSecret('abcdef123456').includes('abcdef123456'), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('42-02-03 provider probes gate .env persistence and enforce idempotent rerun', async () => {
  const tmpDir = makeTempDir();
  const envPath = path.join(tmpDir, '.env');
  const answers = [
    'https://supabase.example.com',
    'supabase-secret-value',
    'https://upstash.example.com',
    'upstash-secret-value',
  ];

  try {
    await assert.rejects(
      () => runDbSetup({
        cwd: tmpDir,
        prompt: { ask: async () => answers.shift(), close: () => {} },
        probeSupabase: async () => {
          throw new Error('probe failed');
        },
        probeUpstash: async () => {},
        runMigrations: async () => ({ applied: [], skipped: [], total: 0 }),
        verifyRls: async () => ({ ok: true, tables: [] }),
        auditNamespaces: async () => ({ ok: true, errors: [] }),
      }),
      /probe failed/
    );

    assert.equal(fs.existsSync(envPath), false, '.env should not be written on probe failure');

    const firstAnswers = [
      'https://supabase.example.com',
      'supabase-secret-value',
      'https://upstash.example.com',
      'upstash-secret-value',
    ];

    await runDbSetup({
      cwd: tmpDir,
      prompt: { ask: async () => firstAnswers.shift(), close: () => {} },
      probeSupabase: async () => {},
      probeUpstash: async () => {},
      runMigrations: async () => ({ applied: ['37_markos_ui_control_plane.sql'], skipped: [], total: 1 }),
      verifyRls: async () => ({ ok: true, tables: [] }),
      auditNamespaces: async () => ({ ok: true, errors: [] }),
    });

    const secondAnswers = ['', 'supabase-secret-value-2', '', 'upstash-secret-value-2'];
    await runDbSetup({
      cwd: tmpDir,
      prompt: { ask: async () => secondAnswers.shift(), close: () => {} },
      probeSupabase: async () => {},
      probeUpstash: async () => {},
      runMigrations: async () => ({ applied: [], skipped: ['37_markos_ui_control_plane.sql'], total: 1 }),
      verifyRls: async () => ({ ok: true, tables: [] }),
      auditNamespaces: async () => ({ ok: true, errors: [] }),
    });

    const envText = fs.readFileSync(envPath, 'utf8');
    assert.match(envText, /SUPABASE_SERVICE_ROLE_KEY=supabase-secret-value-2/);
    assert.match(envText, /UPSTASH_VECTOR_REST_TOKEN=upstash-secret-value-2/);
    assert.equal((envText.match(/SUPABASE_URL=/g) || []).length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('42-02-04 db:setup checks .gitignore protections for .env secrets', async () => {
  const tmpDir = makeTempDir();
  const gitignorePath = path.join(tmpDir, '.gitignore');

  try {
    fs.writeFileSync(gitignorePath, 'node_modules/\n', 'utf8');
    const first = ensureGitignoreHasEnv(tmpDir);
    assert.equal(first.changed, true);

    const second = ensureGitignoreHasEnv(tmpDir);
    assert.equal(second.changed, false);

    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.equal((gitignore.match(/^\.env$/gm) || []).length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('42-04-03 db:setup fails with actionable diagnostics when security auditors fail', async () => {
  const tmpDir = makeTempDir();
  const answers = [
    'https://supabase.example.com',
    'supabase-secret-value',
    'https://upstash.example.com',
    'upstash-secret-value',
  ];

  try {
    await assert.rejects(
      () => runDbSetup({
        cwd: tmpDir,
        prompt: { ask: async () => answers.shift(), close: () => {} },
        probeSupabase: async () => {},
        probeUpstash: async () => {},
        runMigrations: async () => ({ applied: ['37_markos_ui_control_plane.sql'], skipped: [], total: 1 }),
        verifyRls: async () => ({ ok: false, tables: [{ table: 'markos_literacy_chunks', ok: false }] }),
        auditNamespaces: async () => ({ ok: true, errors: [] }),
      }),
      /RLS verification failed/
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
