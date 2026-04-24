'use strict';

// Phase 204 Plan 01 Task 2: CLI config primitive.
//
// Stores non-secret preferences (active_profile, output format, telemetry).
// NEVER stores API keys — credentials live in keychain.cjs only (D-06).

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_CONFIG = Object.freeze({
  active_profile: 'default',
  format: 'auto',
  telemetry: false,
});

function configPath() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'markos', 'config.json');
  }
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || os.homedir();
    return path.join(base, 'markos', 'config.json');
  }
  return path.join(os.homedir(), '.config', 'markos', 'config.json');
}

function loadConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) return { ...DEFAULT_CONFIG };
  try {
    const text = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(text);
    return { ...DEFAULT_CONFIG, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    // Corrupted config — fall back to defaults, do not crash.
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(patch) {
  const current = loadConfig();
  const merged = { ...current, ...(patch || {}) };
  const p = configPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(merged, null, 2) + '\n', { mode: 0o600 });
  try {
    fs.chmodSync(p, 0o600);
  } catch {
    // Windows tolerance.
  }
  return merged;
}

function resolveProfile(cli) {
  // Precedence: --profile flag > MARKOS_PROFILE env > config.active_profile > 'default'
  if (cli && cli.profile) return cli.profile;
  if (process.env.MARKOS_PROFILE) return process.env.MARKOS_PROFILE;
  try {
    const cfg = loadConfig();
    if (cfg.active_profile) return cfg.active_profile;
  } catch {
    // fall through.
  }
  return 'default';
}

module.exports = {
  DEFAULT_CONFIG,
  configPath,
  loadConfig,
  saveConfig,
  resolveProfile,
};
