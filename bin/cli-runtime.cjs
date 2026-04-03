'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MIN_NODE_VERSION = '20.16.0';

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

function parseCliArgs(argv = process.argv.slice(2)) {
  const parsed = {
    command: 'install',
    yes: false,
    noOnboarding: false,
    projectName: null,
    scope: null,
    help: false,
    provider: null,
    test: false,
    month: null,
    exportFormat: null,
    providers: false,
  };

  const tokens = [...argv];
  if (tokens[0] === 'install') {
    tokens.shift();
  } else if (tokens[0] === 'update') {
    parsed.command = 'update';
    tokens.shift();
  } else if (tokens[0] === 'db:setup') {
    parsed.command = 'db:setup';
    tokens.shift();
  } else if (tokens[0] === 'llm:config') {
    parsed.command = 'llm:config';
    tokens.shift();
  } else if (tokens[0] === 'llm:status') {
    parsed.command = 'llm:status';
    tokens.shift();
  } else if (tokens[0] === 'llm:providers') {
    parsed.command = 'llm:providers';
    parsed.providers = true;
    tokens.shift();
  }

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === '--yes' || token === '-y') {
      parsed.yes = true;
    } else if (token === '--no-onboarding') {
      parsed.noOnboarding = true;
    } else if (token === '--project-name') {
      parsed.projectName = tokens[index + 1] || null;
      index += 1;
    } else if (token === '--project') {
      parsed.scope = 'project';
    } else if (token === '--global') {
      parsed.scope = 'global';
    } else if (token === '--help' || token === '-h') {
      parsed.help = true;
    } else if (token === '--test') {
      parsed.test = true;
    } else if (token === '--providers') {
      parsed.providers = true;
    } else if (token.startsWith('--provider=')) {
      parsed.provider = token.slice('--provider='.length) || null;
    } else if (token === '--provider') {
      parsed.provider = tokens[index + 1] || null;
      index += 1;
    } else if (token.startsWith('--month=')) {
      parsed.month = token.slice('--month='.length) || null;
    } else if (token === '--month') {
      parsed.month = tokens[index + 1] || null;
      index += 1;
    } else if (token.startsWith('--export=')) {
      parsed.exportFormat = token.slice('--export='.length) || null;
    } else if (token === '--export') {
      parsed.exportFormat = tokens[index + 1] || null;
      index += 1;
    }
  }

  return parsed;
}

function printInstallUsage() {
  console.log('Usage: npx markos [install] [--yes] [--project-name <name>] [--no-onboarding] [--project|--global]');
  console.log('       npx markos update');
  console.log('       npx markos db:setup');
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  printInstallUsage,
  resolveScopeTarget,
  slugify,
  bootPluginRuntime,
};