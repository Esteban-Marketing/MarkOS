'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const MIN_NODE_VERSION = '22.0.0';

function compareSemver(a, b) {
  const pa = String(a).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pb = String(b).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const max = Math.max(pa.length, pb.length);
  for (let index = 0; index < max; index++) {
    const left = pa[index] || 0;
    const right = pb[index] || 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

function getEffectiveNodeVersion() {
  return process.env.MARKOS_NODE_VERSION_OVERRIDE || process.versions.node;
}

function banner(text) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ${text}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function assertSupportedNodeVersion(commandLabel) {
  const nodeVersion = getEffectiveNodeVersion();
  if (compareSemver(nodeVersion, MIN_NODE_VERSION) >= 0) {
    return true;
  }

  console.error(`\n✗ MarkOS requires Node.js >= ${MIN_NODE_VERSION}.`);
  console.error(`  Current version: ${nodeVersion}`);
  console.error(`  Upgrade Node.js and rerun \`${commandLabel}\`.\n`);
  return false;
}

function isCIEnvironment(env = process.env) {
  return Boolean(
    env.MARKOS_FORCE_NON_INTERACTIVE === '1' ||
    env.CI ||
    env.GITHUB_ACTIONS ||
    env.BUILD_NUMBER ||
    env.TF_BUILD
  );
}

function isInteractiveSession({ env = process.env, stdin = process.stdin, stdout = process.stdout } = {}) {
  if (env.MARKOS_FORCE_INTERACTIVE === '1') {
    return true;
  }

  if (env.MARKOS_FORCE_NON_INTERACTIVE === '1') {
    return false;
  }

  return !isCIEnvironment(env) && Boolean(stdin.isTTY && stdout.isTTY);
}

const COMMAND_ALIASES = Object.freeze({
  update: Object.freeze({ command: 'update' }),
  'db:setup': Object.freeze({ command: 'db:setup' }),
  'llm:config': Object.freeze({ command: 'llm:config' }),
  'llm:status': Object.freeze({ command: 'llm:status' }),
  'llm:providers': Object.freeze({ command: 'llm:providers', providers: true }),
  'import:legacy': Object.freeze({ command: 'import:legacy' }),
  'vault:open': Object.freeze({ command: 'vault:open' }),
  'vault:execution': Object.freeze({ command: 'vault:open', vaultFamily: 'execution' }),
  'vault:evidence': Object.freeze({ command: 'vault:open', vaultFamily: 'evidence' }),
  'vault:review': Object.freeze({ command: 'vault:open', vaultFamily: 'reviews' }),
  'vault:reviews': Object.freeze({ command: 'vault:open', vaultFamily: 'reviews' }),
  generate: Object.freeze({ command: 'generate' }),
  // Phase 204 Plan 01: 10 new operator subcommands. Stubs ship in this plan;
  // business logic lands in 204-02 through 204-11.
  doctor:  Object.freeze({ command: 'doctor' }),
  env:     Object.freeze({ command: 'env' }),
  eval:    Object.freeze({ command: 'eval' }),
  init:    Object.freeze({ command: 'init' }),
  keys:    Object.freeze({ command: 'keys' }),
  login:   Object.freeze({ command: 'login' }),
  plan:    Object.freeze({ command: 'plan' }),
  run:     Object.freeze({ command: 'run' }),
  status:  Object.freeze({ command: 'status' }),
  whoami:  Object.freeze({ command: 'whoami' }),
});

const VALID_PRESET_BUCKETS = Object.freeze(['b2b-saas', 'dtc', 'agency', 'local-services', 'solopreneur']);

const VALUE_FLAGS = Object.freeze({
  '--project-name': 'projectName',
  '--project-slug': 'projectSlug',
  '--slug': 'projectSlug',
  '--provider': 'provider',
  '--month': 'month',
  '--export': 'exportFormat',
  '--preset': 'preset',
  // Phase 204 Plan 01: CLI-wide value flags.
  '--token': 'token',
  '--format': 'format',
  '--tenant': 'tenant',
  '--timeout': 'timeout',
  '--draft': 'draft',
});

const BOOLEAN_FLAGS = Object.freeze({
  '--yes': Object.freeze({ key: 'yes', value: true }),
  '-y': Object.freeze({ key: 'yes', value: true }),
  '--no-onboarding': Object.freeze({ key: 'noOnboarding', value: true }),
  '--project': Object.freeze({ key: 'scope', value: 'project' }),
  '--global': Object.freeze({ key: 'scope', value: 'global' }),
  '--help': Object.freeze({ key: 'help', value: true }),
  '-h': Object.freeze({ key: 'help', value: true }),
  '--test': Object.freeze({ key: 'test', value: true }),
  '--providers': Object.freeze({ key: 'providers', value: true }),
  '--apply': Object.freeze({ key: 'apply', value: true }),
  '--scan': Object.freeze({ key: 'apply', value: false }),
  '--root': Object.freeze({ key: 'vaultOpenTarget', value: 'root' }),
  '--home': Object.freeze({ key: 'vaultOpenTarget', value: 'home' }),
  '--cli-only': Object.freeze({ key: 'cliOnly', value: true }),
  '--minimal': Object.freeze({ key: 'minimalOnly', value: true }),
  // Phase 204 Plan 01: CLI-wide boolean flags.
  '--json': Object.freeze({ key: 'json', value: true }),
  '--watch': Object.freeze({ key: 'watch', value: true }),
  '--no-watch': Object.freeze({ key: 'watch', value: false }),
  '--force': Object.freeze({ key: 'force', value: true }),
  '--check-only': Object.freeze({ key: 'checkOnly', value: true }),
  '--diff': Object.freeze({ key: 'diff', value: true }),
  '--merge': Object.freeze({ key: 'merge', value: true }),
  '--debug': Object.freeze({ key: 'debug', value: true }),
  '--no-browser': Object.freeze({ key: 'noBrowser', value: true }),
  '--quiet': Object.freeze({ key: 'quiet', value: true }),
});

const SUPPORTED_INSTALL_PROFILES = Object.freeze(['full', 'cli', 'minimal']);

function normalizeInstallProfile(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  return SUPPORTED_INSTALL_PROFILES.includes(normalized) ? normalized : null;
}

function setInstallProfile(parsed, profile, source) {
  if (!profile) {
    parsed.profileConflict = parsed.profileConflict || `Unsupported profile from ${source}.`;
    return;
  }

  if (!parsed.installProfile) {
    parsed.installProfile = profile;
    parsed.installProfileSource = source;
    return;
  }

  if (parsed.installProfile !== profile) {
    parsed.profileConflict = parsed.profileConflict || `Conflicting profile flags: ${parsed.installProfileSource} and ${source}.`;
  }
}

// Phase 204 Plan 01: commands that interpret --profile as CLI auth profile
// (not legacy install profile). These dispatch to bin/commands/*.cjs.
const CLI_OPERATOR_COMMANDS = Object.freeze(new Set([
  'init', 'plan', 'run', 'eval', 'login', 'keys', 'whoami', 'env', 'status', 'doctor',
]));

function isCliOperatorCommand(parsed) {
  return CLI_OPERATOR_COMMANDS.has(parsed.command);
}

function applyCommandAlias(parsed, token) {
  const alias = COMMAND_ALIASES[token];
  if (!alias) {
    return false;
  }

  Object.assign(parsed, alias);
  return true;
}

function applyInlineFlag(parsed, token) {
  const inlineFlags = [
    ['--provider=', 'provider'],
    ['--month=', 'month'],
    ['--export=', 'exportFormat'],
    // Phase 204 Plan 01: operator value flags accept inline = form.
    ['--token=', 'token'],
    ['--format=', 'format'],
    ['--tenant=', 'tenant'],
    ['--timeout=', 'timeout'],
    ['--draft=', 'draft'],
  ];

  if (token.startsWith('--profile=')) {
    const requested = token.slice('--profile='.length);
    // Phase 204 Plan 01: --profile is dual-purpose. For CLI operator commands
    // (init/login/run/etc.) it names an auth profile; otherwise legacy install
    // profile (full/cli/minimal).
    if (isCliOperatorCommand(parsed)) {
      parsed.profile = requested || null;
    } else {
      setInstallProfile(parsed, normalizeInstallProfile(requested), '--profile');
    }
    return true;
  }

  if (token.startsWith('--preset=')) {
    parsed.preset = token.slice('--preset='.length) || null;
    return true;
  }

  for (const [prefix, key] of inlineFlags) {
    if (token.startsWith(prefix)) {
      parsed[key] = token.slice(prefix.length) || null;
      return true;
    }
  }

  return false;
}

function applyValueFlag(parsed, token, tokens, index) {
  if (token === '--profile') {
    // Phase 204 Plan 01: --profile is dual-purpose (see applyInlineFlag).
    if (isCliOperatorCommand(parsed)) {
      parsed.profile = tokens[index + 1] || null;
    } else {
      setInstallProfile(parsed, normalizeInstallProfile(tokens[index + 1]), '--profile');
    }
    return true;
  }

  const key = VALUE_FLAGS[token];
  if (!key) {
    return false;
  }

  parsed[key] = tokens[index + 1] || null;
  return true;
}

function applyBooleanFlag(parsed, token) {
  const flag = BOOLEAN_FLAGS[token];
  if (!flag) {
    return false;
  }

  parsed[flag.key] = flag.value;
  return true;
}

function parseCliArgs(argv = process.argv.slice(2)) {
  const parsed = {
    command: 'install',
    yes: false,
    noOnboarding: false,
    projectName: null,
    projectSlug: null,
    scope: null,
    help: false,
    provider: null,
    test: false,
    month: null,
    exportFormat: null,
    providers: false,
    apply: false,
    vaultOpenTarget: 'home',
    vaultFamily: null,
    installProfile: null,
    installProfileSource: null,
    profileConflict: null,
    cliOnly: false,
    minimalOnly: false,
    preset: null,
    // Phase 204 Plan 01: CLI operator defaults.
    profile: null,
    token: null,
    format: null,
    tenant: null,
    timeout: null,
    draft: null,
    json: false,
    watch: undefined,
    force: false,
    checkOnly: false,
    diff: false,
    merge: false,
    debug: false,
    noBrowser: false,
    quiet: false,
  };

  const tokens = [...argv];
  if (tokens[0] === 'install' || applyCommandAlias(parsed, tokens[0])) {
    tokens.shift();
  }

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (applyBooleanFlag(parsed, token)) {
      continue;
    }
    if (applyInlineFlag(parsed, token)) {
      continue;
    }

    if (applyValueFlag(parsed, token, tokens, index)) {
      index += 1;
    }
  }

  if (parsed.cliOnly) {
    setInstallProfile(parsed, 'cli', '--cli-only');
  }

  if (parsed.minimalOnly) {
    setInstallProfile(parsed, 'minimal', '--minimal');
  }

  return parsed;
}

function printInstallUsage() {
  console.log('Usage: npx markos [install] [--yes] [--project-name <name>] [--profile <full|cli|minimal>] [--cli-only|--minimal] [--no-onboarding] [--project|--global] [--preset <b2b-saas|dtc|agency|local-services|solopreneur>]');
  console.log('       npx markos update');
  console.log('       npx markos db:setup');
  console.log('       npx markos import:legacy [--project-slug <slug>] [--scan|--apply]');
  console.log('       npx markos vault:open [--home|--root]');
  console.log('       npx markos vault:execution');
  console.log('       npx markos vault:evidence');
  console.log('       npx markos vault:review');
  console.log('       npx markos llm:config [--provider <anthropic|openai|gemini>] [--test]');
  console.log('       npx markos llm:status [--month <YYYY-MM>] [--export <csv>] [--providers]');
  console.log('       npx markos llm:providers');
}

function detectGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'get-shit-done', 'VERSION'));
}

function detectExistingMarkOS(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'markos', 'VERSION'));
}

function inferProjectName(targetDir) {
  const baseName = path.basename(path.resolve(targetDir));
  return baseName && baseName !== path.sep ? baseName : 'MarkOS Project';
}

function slugify(value) {
  const slug = String(value || 'markos-project')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || 'markos-project';
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildFileHashes(dir, baseDir = dir, hashes = {}) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const rel = path.relative(baseDir, full);
    if (fs.statSync(full).isDirectory()) {
      buildFileHashes(full, baseDir, hashes);
    } else {
      hashes[rel] = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    }
  }
  return hashes;
}

function loadProjectEnv(projectDir) {
  try {
    require('dotenv').config({ path: path.join(projectDir, '.env') });
  } catch {}
}

function hasAnyAiKey(projectDir) {
  loadProjectEnv(projectDir);
  return Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

function resolveScopeTarget(cwd, scope) {
  return scope === 'global' ? os.homedir() : cwd;
}

function firstExistingPath(candidates = []) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {}
  }
  return null;
}

function findCommandOnPath(commandName) {
  const locator = process.platform === 'win32' ? 'where' : 'which';
  try {
    const output = execFileSync(locator, [commandName], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) {
      return null;
    }

    return output.split(/\r?\n/)[0].trim() || null;
  } catch {
    return null;
  }
}

function detectObsidianInstall(env = process.env) {
  const overridePath = firstExistingPath([
    env.MARKOS_OBSIDIAN_PATH,
    env.OBSIDIAN_PATH,
  ]);

  if (overridePath) {
    return { available: true, path: overridePath, source: 'env-override' };
  }

  let candidates;
  if (process.platform === 'win32') {
    candidates = [
      env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs', 'Obsidian', 'Obsidian.exe'),
      env['ProgramFiles'] && path.join(env['ProgramFiles'], 'Obsidian', 'Obsidian.exe'),
      env['ProgramFiles(x86)'] && path.join(env['ProgramFiles(x86)'], 'Obsidian', 'Obsidian.exe'),
    ];
  } else if (process.platform === 'darwin') {
    candidates = [
      '/Applications/Obsidian.app',
      path.join(os.homedir(), 'Applications', 'Obsidian.app'),
    ];
  } else {
    candidates = [
      '/usr/bin/obsidian',
      '/usr/local/bin/obsidian',
      '/snap/bin/obsidian',
    ];
  }

  const installedPath = firstExistingPath(candidates);
  if (installedPath) {
    return { available: true, path: installedPath, source: 'common-install-path' };
  }

  const pathCommand = findCommandOnPath('obsidian');
  if (pathCommand) {
    return { available: true, path: pathCommand, source: 'path-command' };
  }

  return { available: false, path: null, source: 'not-detected' };
}

function detectQmdSupport(env = process.env) {
  const overridePath = firstExistingPath([
    env.MARKOS_QMD_PATH,
    env.QMD_PATH,
  ]);

  if (overridePath) {
    return { available: true, path: overridePath, source: 'env-override', command: 'qmd' };
  }

  const qmdCommand = findCommandOnPath('qmd');
  if (qmdCommand) {
    return { available: true, path: qmdCommand, source: 'path-command', command: 'qmd' };
  }

  const quartoCommand = findCommandOnPath('quarto');
  if (quartoCommand) {
    return { available: true, path: quartoCommand, source: 'path-command', command: 'quarto' };
  }

  return { available: false, path: null, source: 'not-detected', command: null };
}

// ---------------------------------------------------------------------------
// Plugin Runtime Boot (Phase 52 — PLG-DA-01, D-01)
// ---------------------------------------------------------------------------

/**
 * bootPluginRuntime(manifests) → { registry, failures }
 *
 * Loads first-party plugin manifests at server boot using fail-closed error
 * boundaries from lib/markos/plugins/loader.js. Invalid plugins are recorded
 * but do not block startup.
 *
 * @param {object[]} manifests - Array of plugin manifest objects to load
 * @returns {{ registry: object, failures: Array<{manifest: object, error: Error}> }}
 */
function bootPluginRuntime(manifests = []) {
  const { loadPlugins } = require('../lib/markos/plugins/loader.js');
  const result = loadPlugins(manifests);

  if (result.failures.length > 0) {
    for (const { manifest, error } of result.failures) {
      const pluginId = manifest && manifest.id ? manifest.id : '(unknown)';
      console.warn(`[plugin-boot] Plugin "${pluginId}" failed to load: ${error.message}`);
    }
  }

  return result;
}

module.exports = {
  MIN_NODE_VERSION,
  VALID_PRESET_BUCKETS,
  assertSupportedNodeVersion,
  banner,
  buildFileHashes,
  compareSemver,
  copyRecursive,
  detectExistingMarkOS,
  detectGSD,
  getEffectiveNodeVersion,
  hasAnyAiKey,
  inferProjectName,
  isCIEnvironment,
  isInteractiveSession,
  loadProjectEnv,
  parseCliArgs,
  normalizeInstallProfile,
  printInstallUsage,
  resolveScopeTarget,
  slugify,
  bootPluginRuntime,
  detectObsidianInstall,
  detectQmdSupport,
};