'use strict';

// Phase 204 Plan 01 Task 2: Keychain primitive with XDG fallback.
//
// D-02 + D-06 fallback tree:
//   1. MARKOS_API_KEY env var (read-only override; beats everything)
//   2. keytar (OS keychain: Windows Credential Manager, macOS Keychain, libsecret)
//   3. $XDG_CONFIG_HOME/markos/credentials (0600; last-resort fallback)
//
// keytar is loaded via try/catch require — if the native module is missing
// (MODULE_NOT_FOUND on bare Linux / archived keytar), we silently fall through
// to XDG. First time XDG write activates, we print a one-time stderr warning.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SERVICE = 'markos-cli';

// Warning state: shared across all writes in a single CLI invocation.
let xdgWarningPrinted = false;

function xdgCredPath() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'markos', 'credentials');
  }
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || os.homedir();
    return path.join(base, 'markos', 'credentials');
  }
  return path.join(os.homedir(), '.config', 'markos', 'credentials');
}

// Lazy keytar load; wrapped in try/catch per RESEARCH §Pattern 4.
let keytarModule = null;
let keytarLoadAttempted = false;
function getKeytar() {
  if (keytarLoadAttempted) return keytarModule;
  keytarLoadAttempted = true;
  try {
    // Allow test harness to inject a stub via require.cache.
    keytarModule = require('keytar');
  } catch {
    keytarModule = null;
  }
  return keytarModule;
}

function warnXdgOnce() {
  if (xdgWarningPrinted) return;
  xdgWarningPrinted = true;
  process.stderr.write(
    'warning: falling back to file-based credentials (' + xdgCredPath() + ', 0600). ' +
    'Install libsecret (Linux) or run in a GUI session (macOS/Windows) to use the OS keychain.\n'
  );
}

function readXdgFile() {
  const p = xdgCredPath();
  if (!fs.existsSync(p)) return {};
  const text = fs.readFileSync(p, 'utf8');
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return map;
}

function writeXdgFile(map) {
  const p = xdgCredPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const lines = Object.keys(map).map((k) => `${k}=${map[k]}`);
  fs.writeFileSync(p, lines.join('\n') + (lines.length ? '\n' : ''), { mode: 0o600 });
  try {
    fs.chmodSync(p, 0o600);
  } catch {
    // Windows may not honor chmod; tolerate.
  }
}

async function getToken(profile) {
  // 0. env-var override beats everything.
  if (process.env.MARKOS_API_KEY) return process.env.MARKOS_API_KEY;

  // 1. keytar.
  const keytar = getKeytar();
  if (keytar) {
    try {
      const v = await keytar.getPassword(SERVICE, profile);
      if (v) return v;
    } catch {
      // fall through to XDG.
    }
  }

  // 2. XDG file.
  try {
    const map = readXdgFile();
    return map[profile] || null;
  } catch {
    return null;
  }
}

async function setToken(profile, token) {
  const keytar = getKeytar();
  if (keytar) {
    try {
      await keytar.setPassword(SERVICE, profile, token);
      return;
    } catch {
      // fall through to XDG.
    }
  }
  warnXdgOnce();
  const map = readXdgFile();
  map[profile] = token;
  writeXdgFile(map);
}

async function deleteToken(profile) {
  const keytar = getKeytar();
  if (keytar) {
    try {
      await keytar.deletePassword(SERVICE, profile);
    } catch {
      // best-effort; still clear XDG below.
    }
  }
  const map = readXdgFile();
  if (map[profile] !== undefined) {
    delete map[profile];
    writeXdgFile(map);
  }
}

async function listProfiles() {
  const keytar = getKeytar();
  const profiles = new Set();
  if (keytar) {
    try {
      const creds = await keytar.findCredentials(SERVICE);
      for (const c of creds || []) {
        if (c && c.account) profiles.add(c.account);
      }
    } catch {
      // best-effort.
    }
  }
  try {
    const map = readXdgFile();
    for (const k of Object.keys(map)) profiles.add(k);
  } catch {
    // ignore.
  }
  return [...profiles].sort();
}

module.exports = {
  SERVICE,
  getToken,
  setToken,
  deleteToken,
  listProfiles,
  xdgCredPath,
  // Exposed for test harness to reset warning state between cases.
  _resetWarningStateForTests() {
    xdgWarningPrinted = false;
    keytarLoadAttempted = false;
    keytarModule = null;
  },
};
