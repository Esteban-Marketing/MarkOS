'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { createClient } = require('@supabase/supabase-js');
const { Index } = require('@upstash/vector');
const { applyPendingMigrations } = require('../onboarding/backend/provisioning/migration-runner.cjs');
const { verifyRlsPolicies } = require('../onboarding/backend/provisioning/rls-verifier.cjs');
const { auditNamespaces } = require('../onboarding/backend/provisioning/namespace-auditor.cjs');

const REQUIRED_KEYS = Object.freeze([
  { key: 'SUPABASE_URL', secret: false },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', secret: true },
  { key: 'UPSTASH_VECTOR_REST_URL', secret: false },
  { key: 'UPSTASH_VECTOR_REST_TOKEN', secret: true },
]);

function redactSecret(value) {
  const text = String(value || '');
  if (!text) return '[missing]';
  if (text.length <= 6) return '[redacted]';
  return `${text.slice(0, 3)}***${text.slice(-3)}`;
}

function parseDotEnv(content) {
  const map = new Map();
  const lines = String(content || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const pivot = trimmed.indexOf('=');
    if (pivot <= 0) continue;
    map.set(trimmed.slice(0, pivot).trim(), trimmed.slice(pivot + 1));
  }
  return map;
}

function formatDotEnvLine(key, value) {
  return `${key}=${String(value || '').trim()}`;
}

function upsertEnvKeys(existingContent, updates) {
  const lines = String(existingContent || '').split(/\r?\n/);
  const consumed = new Set();
  const next = lines.map((line) => {
    const pivot = line.indexOf('=');
    if (pivot <= 0) return line;
    const key = line.slice(0, pivot).trim();
    if (!Object.prototype.hasOwnProperty.call(updates, key)) return line;
    consumed.add(key);
    return formatDotEnvLine(key, updates[key]);
  });

  for (const key of Object.keys(updates)) {
    if (consumed.has(key)) continue;
    next.push(formatDotEnvLine(key, updates[key]));
  }

  return next.join('\n').replace(/\n+$/g, '') + '\n';
}

function ensureGitignoreHasEnv(projectDir, fsApi = fs) {
  const gitignorePath = path.join(projectDir, '.gitignore');
  const existing = fsApi.existsSync(gitignorePath)
    ? fsApi.readFileSync(gitignorePath, 'utf8')
    : '';

  if (existing.split(/\r?\n/).some((line) => line.trim() === '.env')) {
    return { changed: false, filePath: gitignorePath };
  }

  const suffix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  const next = `${existing}${suffix}.env\n`;
  fsApi.writeFileSync(gitignorePath, next, 'utf8');
  return { changed: true, filePath: gitignorePath };
}

function createReadlinePrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return {
    ask(question) {
      return new Promise((resolve) => rl.question(question, resolve));
    },
    close() {
      rl.close();
    },
  };
}

async function probeSupabase(values) {
  const client = createClient(values.SUPABASE_URL, values.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client
    .from('markos_projects')
    .select('project_slug', { head: true, count: 'exact' })
    .limit(1);

  if (error) {
    throw new Error(`Supabase connectivity failed: ${error.message}`);
  }
}

async function probeUpstash(values) {
  const index = new Index({
    url: values.UPSTASH_VECTOR_REST_URL,
    token: values.UPSTASH_VECTOR_REST_TOKEN,
  });

  const namespace = index.namespace('__health__');
  await namespace.query({ data: 'health', topK: 1 });
}

async function defaultMigrationExecution() {
  throw new Error('SQL executor is not configured for migrations. Pass runMigrations to runDbSetup.');
}

async function defaultVerifyRls() {
  throw new Error('RLS verifier dependencies are not configured. Pass verifyRls to runDbSetup.');
}

async function defaultAuditNamespaces() {
  throw new Error('Namespace auditor dependencies are not configured. Pass auditNamespaces to runDbSetup.');
}

async function defaultHealthSnapshot(values) {
  const vectorStore = require('../onboarding/backend/vector-store-client.cjs');
  return vectorStore.buildProvisioningHealthSnapshot({
    supabase_url: values.SUPABASE_URL,
    supabase_service_role_key: values.SUPABASE_SERVICE_ROLE_KEY,
    upstash_vector_rest_url: values.UPSTASH_VECTOR_REST_URL,
    upstash_vector_rest_token: values.UPSTASH_VECTOR_REST_TOKEN,
  });
}

function normalizePromptValue(value) {
  return String(value || '').trim();
}

function buildRedactedSummary(values) {
  return {
    SUPABASE_URL: values.SUPABASE_URL || '[missing]',
    SUPABASE_SERVICE_ROLE_KEY: redactSecret(values.SUPABASE_SERVICE_ROLE_KEY),
    UPSTASH_VECTOR_REST_URL: values.UPSTASH_VECTOR_REST_URL || '[missing]',
    UPSTASH_VECTOR_REST_TOKEN: redactSecret(values.UPSTASH_VECTOR_REST_TOKEN),
  };
}

async function collectCredentials({
  prompt,
  interactive,
  existingValues,
  defaults,
  output,
}) {
  const values = {};

  for (const field of REQUIRED_KEYS) {
    const fromDefaults = normalizePromptValue(defaults[field.key]);
    const fromExisting = normalizePromptValue(existingValues[field.key]);
    const baseline = fromDefaults || fromExisting;

    if (!interactive) {
      if (!baseline) {
        throw new Error(`Missing required credential ${field.key} in non-interactive mode.`);
      }
      values[field.key] = baseline;
      continue;
    }

    const hint = field.secret && baseline
      ? ` [current: ${redactSecret(baseline)}]`
      : baseline
        ? ` [current: ${baseline}]`
        : '';

    const answer = await prompt.ask(`${field.key}${hint}: `);
    values[field.key] = normalizePromptValue(answer) || baseline;
    if (!values[field.key]) {
      throw new Error(`Credential ${field.key} cannot be empty.`);
    }
  }

  output('Collected credentials (redacted):');
  output(JSON.stringify(buildRedactedSummary(values), null, 2));
  return values;
}

async function runDbSetup(options = {}) {
  const cwd = options.cwd || process.cwd();
  const fsApi = options.fsApi || fs;
  const envPath = options.envPath || path.join(cwd, '.env');
  const output = options.output || console.log;
  const interactive = options.interactive !== false;
  const prompt = options.prompt || createReadlinePrompt();
  const defaultValues = options.defaultValues || process.env;
  const runSupabaseProbe = options.probeSupabase || probeSupabase;
  const runUpstashProbe = options.probeUpstash || probeUpstash;
  const runMigrations = options.runMigrations || (async ({ migrationsDir }) => {
    return applyPendingMigrations({ migrationsDir, executeSql: defaultMigrationExecution });
  });
  const runRlsVerification = options.verifyRls || (async () => {
    return verifyRlsPolicies({ fetchTableRlsStatus: defaultVerifyRls, checkAnonDenied: defaultVerifyRls });
  });
  const runNamespaceAudit = options.auditNamespaces || (async ({ projectSlug }) => {
    return auditNamespaces({ projectSlug, listNamespaces: defaultAuditNamespaces });
  });
  const runHealthSnapshot = options.healthCheck || defaultHealthSnapshot;

  try {
    const existingContent = fsApi.existsSync(envPath)
      ? fsApi.readFileSync(envPath, 'utf8')
      : '';
    const existingMap = Object.fromEntries(parseDotEnv(existingContent));

    const values = await collectCredentials({
      prompt,
      interactive,
      existingValues: existingMap,
      defaults: defaultValues,
      output,
    });

    await runSupabaseProbe(values);
    await runUpstashProbe(values);

    const nextEnv = upsertEnvKeys(existingContent, values);
    fsApi.writeFileSync(envPath, nextEnv, 'utf8');

    const gitignore = ensureGitignoreHasEnv(cwd, fsApi);
    const migrationSummary = await runMigrations({
      migrationsDir: path.join(cwd, 'supabase', 'migrations'),
      values,
    });

    const projectSlug = String(options.projectSlug || process.env.MARKOS_PROJECT_SLUG || path.basename(cwd)).trim();
    const rls = await runRlsVerification({ values });
    if (!rls.ok) {
      throw new Error(`RLS verification failed for one or more tables.`);
    }

    const namespaces = await runNamespaceAudit({ values, projectSlug });
    if (!namespaces.ok) {
      throw new Error(`Namespace audit failed: ${namespaces.errors.join(' | ')}`);
    }

    const health = await runHealthSnapshot(values);

    return {
      ok: true,
      persisted: REQUIRED_KEYS.map((field) => field.key),
      envPath,
      gitignore,
      providers: {
        supabase: 'ok',
        upstash_vector: 'ok',
      },
      migrations: migrationSummary,
      rls,
      namespaces,
      health,
      redacted: buildRedactedSummary(values),
    };
  } finally {
    if (typeof prompt.close === 'function') {
      prompt.close();
    }
  }
}

async function runDbSetupCLI(options = {}) {
  try {
    const report = await runDbSetup(options);
    console.log('db:setup completed successfully');
    console.log(JSON.stringify({
      ok: report.ok,
      providers: report.providers,
      migrations: report.migrations,
      rls: report.rls,
      namespaces: report.namespaces,
      health: report.health,
      gitignore: report.gitignore,
    }, null, 2));
  } catch (error) {
    console.error(`db:setup failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  REQUIRED_KEYS,
  buildRedactedSummary,
  collectCredentials,
  ensureGitignoreHasEnv,
  parseDotEnv,
  probeSupabase,
  probeUpstash,
  redactSecret,
  runDbSetup,
  runDbSetupCLI,
  upsertEnvKeys,
};

if (require.main === module) {
  runDbSetupCLI();
}
