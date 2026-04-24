'use strict';

// Phase 204 Plan 01 Task 2: XDG tmpdir fixture.
//
// Creates an isolated tempdir, sets XDG_CONFIG_HOME + APPDATA env vars so
// keychain.cjs XDG fallback and config.cjs configPath both land inside it.
// Restores env vars + removes tempdir after the callback.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function withTmpXDG(callback) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-xdg-'));
  const saved = {
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    APPDATA: process.env.APPDATA,
    MARKOS_API_KEY: process.env.MARKOS_API_KEY,
    MARKOS_PROFILE: process.env.MARKOS_PROFILE,
    NO_COLOR: process.env.NO_COLOR,
  };
  process.env.XDG_CONFIG_HOME = dir;
  process.env.APPDATA = dir;
  // Defensive: never leak a real key into isolated tests.
  delete process.env.MARKOS_API_KEY;
  delete process.env.MARKOS_PROFILE;

  try {
    return await callback(dir);
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // tolerate Windows file-lock hiccups.
    }
  }
}

module.exports = { withTmpXDG };
