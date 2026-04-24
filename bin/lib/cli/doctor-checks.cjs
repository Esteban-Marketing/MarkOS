'use strict';

// Phase 204 Plan 09 Task 1 — markos doctor check primitives.
//
// Exports `runChecks({ fix, checkOnly, cwd })` returning an array of
// `{ id, label, status: 'ok'|'warn'|'error'|'skip', message?, hint?, fixable?, fixed? }`.
//
// Ships 9 setup-hygiene checks:
//   1. node_version          — process.version vs MIN_NODE_VERSION
//   2. config_dir             — $XDG_CONFIG_HOME/markos writable (fix: mkdir 0o700)
//   3. active_token           — keychain token present for active profile
//   4. token_valid            — /api/tenant/whoami returns 200 (skip if no token)
//   5. markos_local_dir       — .markos-local/ exists in cwd  (fix: mkdir)
//   6. gitignore_protected    — .markos-local/ listed in .gitignore (fix: applyGitignoreProtections)
//   7. keytar_available       — require('keytar') loads + listProfiles works
//   8. server_reachable       — HEAD BASE_URL/api/health with 5s timeout
//   9. supabase_connectivity  — SKIP (deferred to Phase 206)
//
// Fix safety rails:
//   - --check-only short-circuits every fix path (FS writes NEVER happen).
//   - --fix never runs `markos login` (T-204-09-01) — active_token / token_valid
//     are NEVER marked fixable, so the orchestrator cannot auto-remediate them.
//   - Filesystem fixes are idempotent (mkdir recursive, applyGitignoreProtections
//     replaces its managed block).

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const MIN_NODE_VERSION = '22.0.0';
const HEALTH_PATH = '/api/health';
const DEFAULT_FETCH_TIMEOUT_MS = 5000;

// ─── Shared helpers ────────────────────────────────────────────────────────

function compareSemver(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map((p) => Number.parseInt(p, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('.').map((p) => Number.parseInt(p, 10) || 0);
  const max = Math.max(pa.length, pb.length);
  for (let i = 0; i < max; i++) {
    const l = pa[i] || 0;
    const r = pb[i] || 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }
  return 0;
}

function getEffectiveNodeVersion() {
  const raw = process.env.MARKOS_NODE_VERSION_OVERRIDE || process.versions.node;
  return String(raw).replace(/^v/, '');
}

// ─── Individual checks ─────────────────────────────────────────────────────

async function checkNodeVersion() {
  const current = getEffectiveNodeVersion();
  if (compareSemver(current, MIN_NODE_VERSION) >= 0) {
    return {
      id: 'node_version',
      label: 'Node.js version',
      status: 'ok',
      message: `v${current} ≥ required ${MIN_NODE_VERSION}`,
      fixable: false,
      fixed: null,
    };
  }
  return {
    id: 'node_version',
    label: 'Node.js version',
    status: 'error',
    message: `v${current} < required ${MIN_NODE_VERSION}`,
    hint: 'Upgrade Node.js to 22 LTS or newer (https://nodejs.org).',
    fixable: false,
    fixed: null,
  };
}

async function checkConfigDir({ fix, checkOnly, configModule }) {
  const cfg = configModule || require('./config.cjs');
  const dir = path.dirname(cfg.configPath());

  // If it exists and is writable, we're done.
  try {
    if (fs.existsSync(dir)) {
      fs.accessSync(dir, fs.constants.W_OK);
      return {
        id: 'config_dir',
        label: 'Config directory',
        status: 'ok',
        message: `${dir} (writable)`,
        fixable: true,
        fixed: null,
      };
    }
  } catch {
    // fall through to failure.
  }

  const result = {
    id: 'config_dir',
    label: 'Config directory',
    status: 'error',
    message: `${dir} is missing or not writable`,
    hint: 'Run `markos doctor --fix` to create it with mode 0700.',
    fixable: true,
    fixed: null,
  };

  if (fix && !checkOnly) {
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      try { fs.chmodSync(dir, 0o700); } catch {}
      result.status = 'ok';
      result.message = `${dir} (created)`;
      result.fixed = true;
      result.hint = undefined;
    } catch (err) {
      result.fixed = false;
      result.hint = `Failed to create ${dir}: ${err.message}`;
    }
  }
  return result;
}

async function checkActiveToken({ keychainModule, configModule, cli }) {
  const kc = keychainModule || require('./keychain.cjs');
  const cfg = configModule || require('./config.cjs');
  const profile = cfg.resolveProfile(cli || {});

  try {
    const token = await kc.getToken(profile);
    if (token) {
      return {
        id: 'active_token',
        label: 'Active token',
        status: 'ok',
        message: `keychain entry found for profile "${profile}"`,
        fixable: false,
        fixed: null,
      };
    }
  } catch {
    // fall through.
  }

  // Fresh install: warn, NEVER error (Plan 09 CONTEXT) and NEVER auto-fix.
  return {
    id: 'active_token',
    label: 'Active token',
    status: 'warn',
    message: `no keychain entry for profile "${profile}"`,
    hint: 'Run `markos login` to authenticate.',
    fixable: false, // critical: never auto-run login (T-204-09-01)
    fixed: null,
  };
}

async function checkTokenValid({ keychainModule, configModule, httpModule, cli, previousChecks, timeoutMs }) {
  // If active_token is absent (warn), skip — nothing to validate.
  const prior = (previousChecks || []).find((c) => c.id === 'active_token');
  if (!prior || prior.status !== 'ok') {
    return {
      id: 'token_valid',
      label: 'Token validity',
      status: 'skip',
      message: 'no active token to validate',
      fixable: false,
      fixed: null,
    };
  }

  const kc = keychainModule || require('./keychain.cjs');
  const cfg = configModule || require('./config.cjs');
  const http = httpModule || require('./http.cjs');
  const profile = cfg.resolveProfile(cli || {});
  const token = await kc.getToken(profile);

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = setTimeout(() => { if (controller) controller.abort(); }, Number(timeoutMs) || DEFAULT_FETCH_TIMEOUT_MS);

  try {
    const res = await http.authedFetch('/api/tenant/whoami', {
      method: 'GET',
      signal: controller ? controller.signal : undefined,
    }, { token, retries: 0 });
    clearTimeout(timeout);
    if (res.status >= 200 && res.status < 300) {
      return {
        id: 'token_valid',
        label: 'Token validity',
        status: 'ok',
        message: `whoami returned ${res.status}`,
        fixable: false,
        fixed: null,
      };
    }
    return {
      id: 'token_valid',
      label: 'Token validity',
      status: 'error',
      message: `whoami returned ${res.status}`,
      hint: 'Token may be revoked or expired — run `markos login` again.',
      fixable: false, // never auto-fix auth (T-204-09-01)
      fixed: null,
    };
  } catch (err) {
    clearTimeout(timeout);
    const name = err && err.name;
    if (name === 'AuthError') {
      return {
        id: 'token_valid',
        label: 'Token validity',
        status: 'error',
        message: `whoami rejected token: ${err.message}`,
        hint: 'Run `markos login` again to refresh credentials.',
        fixable: false,
        fixed: null,
      };
    }
    return {
      id: 'token_valid',
      label: 'Token validity',
      status: 'warn',
      message: `could not reach whoami: ${err.message}`,
      hint: 'Check your internet connection, then rerun `markos doctor`.',
      fixable: false,
      fixed: null,
    };
  }
}

async function checkMarkosLocalDir({ fix, checkOnly, cwd }) {
  const target = path.resolve(cwd, '.markos-local');
  if (fs.existsSync(target)) {
    return {
      id: 'markos_local_dir',
      label: '.markos-local directory',
      status: 'ok',
      message: `${target} exists`,
      fixable: true,
      fixed: null,
    };
  }

  const result = {
    id: 'markos_local_dir',
    label: '.markos-local directory',
    status: 'warn',
    message: `${target} is missing`,
    hint: 'Run `markos doctor --fix` to create it; required for client-override templates.',
    fixable: true,
    fixed: null,
  };

  if (fix && !checkOnly) {
    try {
      fs.mkdirSync(target, { recursive: true });
      result.status = 'ok';
      result.message = `${target} (created)`;
      result.fixed = true;
      result.hint = undefined;
    } catch (err) {
      result.fixed = false;
      result.hint = `Failed to create ${target}: ${err.message}`;
    }
  }
  return result;
}

function gitignoreMentionsLocal(text) {
  const needle = /(^|\n)\s*\.markos-local\/?\s*(\n|$|#)/;
  return needle.test(text);
}

async function checkGitignoreProtected({ fix, checkOnly, cwd, installModule }) {
  const gitignorePath = path.join(cwd, '.gitignore');
  const text = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';

  if (gitignoreMentionsLocal(text)) {
    return {
      id: 'gitignore_protected',
      label: 'Gitignore protection',
      status: 'ok',
      message: '.markos-local/ is ignored',
      fixable: true,
      fixed: null,
    };
  }

  const result = {
    id: 'gitignore_protected',
    label: 'Gitignore protection',
    status: 'error',
    message: '.markos-local/ is not listed in .gitignore',
    hint: 'Run `markos doctor --fix` to add the managed block.',
    fixable: true,
    fixed: null,
  };

  if (fix && !checkOnly) {
    try {
      const install = installModule || require('../../install.cjs');
      if (typeof install.applyGitignoreProtections !== 'function') {
        result.fixed = false;
        result.hint = 'install.cjs does not export applyGitignoreProtections; cannot auto-fix.';
        return result;
      }
      install.applyGitignoreProtections(cwd);
      result.status = 'ok';
      result.message = '.markos-local/ added to .gitignore';
      result.fixed = true;
      result.hint = undefined;
    } catch (err) {
      result.fixed = false;
      result.hint = `Failed to update .gitignore: ${err.message}`;
    }
  }
  return result;
}

async function checkKeytarAvailable({ keychainModule }) {
  // We NEVER attempt to install keytar here — it's a native module.
  // Detection: try require + call listProfiles once. XDG fallback is acceptable.
  let keytar = null;
  try {
    keytar = require('keytar');
  } catch {
    return {
      id: 'keytar_available',
      label: 'Keytar (OS keychain)',
      status: 'warn',
      message: 'keytar native module not installed',
      hint: 'XDG file fallback will be used (0600 creds file). Install libsecret on Linux for the OS keychain.',
      fixable: false,
      fixed: null,
    };
  }

  try {
    const kc = keychainModule || require('./keychain.cjs');
    // listProfiles internally uses keytar + XDG; ensures the library loads without crashing.
    await kc.listProfiles();
    return {
      id: 'keytar_available',
      label: 'Keytar (OS keychain)',
      status: 'ok',
      message: 'keytar loaded + listProfiles() succeeded',
      fixable: false,
      fixed: null,
    };
  } catch (err) {
    return {
      id: 'keytar_available',
      label: 'Keytar (OS keychain)',
      status: 'warn',
      message: `keytar loaded but listProfiles failed: ${err.message}`,
      hint: 'CLI will fall back to XDG file storage.',
      fixable: false,
      fixed: null,
    };
  }
}

async function checkServerReachable({ httpModule, timeoutMs }) {
  const http = httpModule || require('./http.cjs');
  const base = (http.BASE_URL || 'https://app.markos.com').replace(/\/+$/, '');
  const url = base + HEALTH_PATH;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = setTimeout(() => { if (controller) controller.abort(); }, Number(timeoutMs) || DEFAULT_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'x-markos-client': 'markos-cli-doctor' },
      signal: controller ? controller.signal : undefined,
    });
    clearTimeout(timeout);
    // Any HTTP response means the host is reachable — even 404 is fine here.
    return {
      id: 'server_reachable',
      label: 'Server reachable',
      status: 'ok',
      message: `${url} responded ${res.status}`,
      fixable: false,
      fixed: null,
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      id: 'server_reachable',
      label: 'Server reachable',
      status: 'warn',
      message: `cannot reach ${url}: ${err.message || 'timeout'}`,
      hint: 'Check your internet connection or set MARKOS_API_BASE_URL.',
      fixable: false,
      fixed: null,
    };
  }
}

async function checkSupabaseConnectivity() {
  return {
    id: 'supabase_connectivity',
    label: 'Supabase connectivity',
    status: 'skip',
    message: 'deferred to Phase 206 observability',
    fixable: false,
    fixed: null,
  };
}

// ─── Phase 204-13: v2 compliance checks ────────────────────────────────────
//
// Three net-new checks added by Plan 204-13 (gap_closure) to enforce the
// v2 operating-loop contract on the CLI surface:
//   10. agentrun_v2_alignment    — markos_cli_runs schema carries all v2 columns
//                                  AND migration 77 is present on disk.
//   11. pricing_placeholder_policy — no real public pricing leaks in CLI docs
//                                    until an approved PricingRecommendation
//                                    exists (Phase 205).
//   12. vault_freshness           — obsidian/work/incoming/*.md >30d old
//                                   without a matching obsidian/brain/*.md
//                                   distillation warns.
//
// All three are read-only (no fixable auto-remediation). They can fail
// `markos doctor --check-only` when policy violations are detected.

const V2_REQUIRED_FIELD_NAMES = Object.freeze([
  // Mirrors lib/markos/cli/runs.cjs::V2_REQUIRED_FIELDS — kept in sync via
  // the v2-compliance test suite (test/cli/v2-compliance.test.js).
  'tenant_id', 'user_id',
  'trigger_kind', 'source_surface', 'priority', 'chain_id', 'parent_run_id',
  'correlation_id', 'idempotency_key',
  'agent_id', 'agent_registry_version',
  'approval_policy', 'provider_policy', 'tool_policy',
  'estimated_cost_usd_micro', 'actual_cost_usd_micro', 'cost_currency',
  'tokens_input', 'tokens_output', 'pricing_engine_context',
  'v2_state', 'retry_count', 'retry_after', 'last_error_code',
  'task_id', 'closed_at',
]);

async function checkAgentrunV2Alignment({ cwd, runsModule }) {
  // Strategy: we do NOT require a live DB connection (local doctor runs
  // without supabase creds). Instead we verify two things statically:
  //   1. Migration 77 file exists on disk (supabase/migrations/77_*.sql) —
  //      this is the migration that adds the v2 columns.
  //   2. The CLI runs library exports V2_REQUIRED_FIELDS AND buildV2Payload
  //      produces a row carrying all of them (i.e., the writer is v2-aware).
  //
  // Both conditions together assert the CLI surface is v2-aligned. If either
  // fails, we emit 'error' (CI-gate fails) because drift between CLI writer
  // and DB schema is a deployment hazard.
  const migrationsDir = path.resolve(cwd, 'supabase', 'migrations');
  let migration77 = null;
  try {
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir);
      migration77 = files.find((f) => /^77[_-].*v2[_-]?align/i.test(f)) || null;
    }
  } catch {
    migration77 = null;
  }

  if (!migration77) {
    return {
      id: 'agentrun_v2_alignment',
      label: 'AgentRun v2 alignment',
      status: 'error',
      message: 'migration 77 (markos_cli_runs v2 alignment) not found',
      hint: 'Ensure supabase/migrations/77_markos_cli_runs_v2_align.sql is deployed. Run the migration suite against the target DB.',
      fixable: false,
      fixed: null,
    };
  }

  // Verify the runs library exports v2 helpers + all required fields.
  let runs;
  try {
    runs = runsModule || require(path.resolve(cwd, 'lib', 'markos', 'cli', 'runs.cjs'));
  } catch (err) {
    return {
      id: 'agentrun_v2_alignment',
      label: 'AgentRun v2 alignment',
      status: 'warn',
      message: `runs.cjs not loadable: ${err.message}`,
      hint: 'CLI runs library is missing or broken — cannot verify v2 writer alignment.',
      fixable: false,
      fixed: null,
    };
  }

  const fields = Array.isArray(runs.V2_REQUIRED_FIELDS) ? runs.V2_REQUIRED_FIELDS : [];
  const missing = V2_REQUIRED_FIELD_NAMES.filter((f) => !fields.includes(f));
  if (missing.length > 0) {
    return {
      id: 'agentrun_v2_alignment',
      label: 'AgentRun v2 alignment',
      status: 'error',
      message: `runs.cjs V2_REQUIRED_FIELDS missing: ${missing.join(', ')}`,
      hint: 'Update lib/markos/cli/runs.cjs::V2_REQUIRED_FIELDS to include all Phase 207 CONTRACT-LOCK §4 fields.',
      fixable: false,
      fixed: null,
    };
  }

  // Positive assertion: buildV2Payload yields a row that passes its own shape check.
  try {
    if (typeof runs.buildV2Payload === 'function' && typeof runs.assertV2PayloadShape === 'function') {
      const sample = runs.buildV2Payload({
        tenant_id: 'ten_doctor_probe',
        user_id: 'usr_doctor_probe',
        brief: { channel: 'email', audience: 'doctor', pain: 'probe', promise: 'probe', brand: 'probe' },
      });
      const assertion = runs.assertV2PayloadShape(sample);
      if (!assertion.ok) {
        return {
          id: 'agentrun_v2_alignment',
          label: 'AgentRun v2 alignment',
          status: 'error',
          message: `buildV2Payload missing: ${assertion.missing.join(', ')}`,
          hint: 'lib/markos/cli/runs.cjs::buildV2Payload does not produce the v2 shape.',
          fixable: false,
          fixed: null,
        };
      }
    }
  } catch (err) {
    return {
      id: 'agentrun_v2_alignment',
      label: 'AgentRun v2 alignment',
      status: 'warn',
      message: `buildV2Payload probe failed: ${err.message}`,
      fixable: false,
      fixed: null,
    };
  }

  return {
    id: 'agentrun_v2_alignment',
    label: 'AgentRun v2 alignment',
    status: 'ok',
    message: `migration 77 + ${V2_REQUIRED_FIELD_NAMES.length} v2 fields present`,
    fixable: false,
    fixed: null,
  };
}

// Public CLI docs that MUST NOT hardcode real MarkOS prices until the
// Pricing Engine (Phase 205) lands. If any of these files contains a concrete
// dollar amount (e.g., "$49/mo"), the check warns — unless the placeholder
// sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` is also present in the file
// (explicitly TODO-style unresolved). Per D-207-05 + approved decision #6 the
// placeholder is tolerated through Phase 213.
const PRICING_DOC_CANDIDATES = Object.freeze([
  'docs/pricing.md',
  'docs/commands.md',
  'docs/environment.md',
  'docs/errors.md',
  'README.md',
]);
const PRICE_PATTERN = /\$\s?\d{1,3}(?:[,.]\d{2,3})?(?:\s?(?:\/|per)\s?(?:mo|month|yr|year|user|seat))/i;

async function checkPricingPlaceholderPolicy({ cwd }) {
  const violations = [];
  for (const rel of PRICING_DOC_CANDIDATES) {
    const p = path.resolve(cwd, rel);
    if (!fs.existsSync(p)) continue;
    let text = '';
    try { text = fs.readFileSync(p, 'utf8'); } catch { continue; }
    // If the file already uses the placeholder token, it's compliant by construction.
    if (text.includes('{{MARKOS_PRICING_ENGINE_PENDING}}')) continue;
    if (PRICE_PATTERN.test(text)) {
      violations.push(rel);
    }
  }

  if (violations.length === 0) {
    return {
      id: 'pricing_placeholder_policy',
      label: 'Pricing placeholder',
      status: 'ok',
      message: 'no hard-coded public prices detected',
      fixable: false,
      fixed: null,
    };
  }
  return {
    id: 'pricing_placeholder_policy',
    label: 'Pricing placeholder',
    status: 'error',
    message: `hard-coded prices in: ${violations.join(', ')}`,
    hint: 'Replace real MarkOS prices with {{MARKOS_PRICING_ENGINE_PENDING}} until Phase 205 lands an approved PricingRecommendation.',
    fixable: false,
    fixed: null,
  };
}

const VAULT_FRESHNESS_MAX_AGE_DAYS = 30;
const VAULT_FRESHNESS_MAX_AGE_MS = VAULT_FRESHNESS_MAX_AGE_DAYS * 24 * 3600 * 1000;

async function checkVaultFreshness({ cwd, nowFn }) {
  const incomingDir = path.resolve(cwd, 'obsidian', 'work', 'incoming');
  const brainDir = path.resolve(cwd, 'obsidian', 'brain');
  if (!fs.existsSync(incomingDir)) {
    return {
      id: 'vault_freshness',
      label: 'Vault freshness',
      status: 'skip',
      message: 'obsidian/work/incoming/ absent',
      fixable: false,
      fixed: null,
    };
  }

  let incoming = [];
  try {
    incoming = fs.readdirSync(incomingDir).filter((f) => f.toLowerCase().endsWith('.md'));
  } catch {
    incoming = [];
  }

  let brain = new Set();
  if (fs.existsSync(brainDir)) {
    try {
      brain = new Set(fs.readdirSync(brainDir).filter((f) => f.toLowerCase().endsWith('.md')));
    } catch { /* empty brain set */ }
  }

  const now = (typeof nowFn === 'function' ? nowFn() : Date.now());
  const stale = [];
  for (const f of incoming) {
    const p = path.join(incomingDir, f);
    let mtimeMs = 0;
    try { mtimeMs = fs.statSync(p).mtimeMs; } catch { continue; }
    if (now - mtimeMs < VAULT_FRESHNESS_MAX_AGE_MS) continue;
    // Heuristic match: incoming doc "16-SAAS-SUITE.md" has a distillation if
    // brain/ contains ANY file whose kebab-free slug shares significant tokens.
    const tokens = f.replace(/\.md$/i, '').replace(/^\d+-/, '').split(/[-_]+/).filter(Boolean).map((t) => t.toLowerCase());
    const hasDistill = [...brain].some((b) => {
      const slug = b.replace(/\.md$/i, '').toLowerCase();
      return tokens.some((t) => t.length > 3 && slug.includes(t));
    });
    if (!hasDistill) stale.push(f);
  }

  if (stale.length === 0) {
    return {
      id: 'vault_freshness',
      label: 'Vault freshness',
      status: 'ok',
      message: `${incoming.length} incoming docs scanned; all fresh or distilled`,
      fixable: false,
      fixed: null,
    };
  }
  return {
    id: 'vault_freshness',
    label: 'Vault freshness',
    status: 'warn',
    message: `${stale.length} stale incoming docs >${VAULT_FRESHNESS_MAX_AGE_DAYS}d without brain distillation`,
    hint: `Distill into obsidian/brain/*.md or obsidian/reference/*.md. First: ${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ', …' : ''}`,
    fixable: false,
    fixed: null,
  };
}

// ─── Orchestrator ──────────────────────────────────────────────────────────

async function runChecks(opts = {}) {
  const fix = Boolean(opts.fix);
  const checkOnly = Boolean(opts.checkOnly);
  const cwd = opts.cwd || process.cwd();
  const cli = opts.cli || {};
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : DEFAULT_FETCH_TIMEOUT_MS;

  // Check-only mode overrides --fix entirely (T-204-09-06 mitigation).
  const effectiveFix = fix && !checkOnly;

  const keychainModule = opts.keychainModule;
  const configModule = opts.configModule;
  const httpModule = opts.httpModule;
  const installModule = opts.installModule;

  const results = [];
  results.push(await checkNodeVersion());
  results.push(await checkConfigDir({ fix: effectiveFix, checkOnly, configModule }));
  results.push(await checkActiveToken({ keychainModule, configModule, cli }));
  results.push(await checkTokenValid({
    keychainModule, configModule, httpModule, cli,
    previousChecks: results,
    timeoutMs,
  }));
  results.push(await checkMarkosLocalDir({ fix: effectiveFix, checkOnly, cwd }));
  results.push(await checkGitignoreProtected({ fix: effectiveFix, checkOnly, cwd, installModule }));
  results.push(await checkKeytarAvailable({ keychainModule }));
  results.push(await checkServerReachable({ httpModule, timeoutMs }));
  results.push(await checkSupabaseConnectivity());

  // Plan 204-13: 3 v2 compliance checks.
  const runsModule = opts.runsModule;
  const nowFn = opts.nowFn;
  results.push(await checkAgentrunV2Alignment({ cwd, runsModule }));
  results.push(await checkPricingPlaceholderPolicy({ cwd }));
  results.push(await checkVaultFreshness({ cwd, nowFn }));

  return results;
}

module.exports = {
  MIN_NODE_VERSION,
  runChecks,
  // Exposed for white-box tests + future reuse.
  _checks: {
    checkNodeVersion,
    checkConfigDir,
    checkActiveToken,
    checkTokenValid,
    checkMarkosLocalDir,
    checkGitignoreProtected,
    checkKeytarAvailable,
    checkServerReachable,
    checkSupabaseConnectivity,
    // Plan 204-13 v2 compliance checks.
    checkAgentrunV2Alignment,
    checkPricingPlaceholderPolicy,
    checkVaultFreshness,
  },
  _compareSemver: compareSemver,
  _V2_REQUIRED_FIELD_NAMES: V2_REQUIRED_FIELD_NAMES,
  _VAULT_FRESHNESS_MAX_AGE_DAYS: VAULT_FRESHNESS_MAX_AGE_DAYS,
  _PRICING_DOC_CANDIDATES: PRICING_DOC_CANDIDATES,
};
