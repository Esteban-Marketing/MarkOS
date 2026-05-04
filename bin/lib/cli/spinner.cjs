'use strict';

// Phase 204.1 Plan 02 - CLI spinner primitive.
//
// Renders to stderr by default with locale-aware frames and the UI-SPEC
// suppression matrix: silent in non-TTY, JSON mode, or NO_COLOR mode.

const { shouldUseJson, shouldUseColor } = require('./output.cjs');

const FRAMES_UTF8 = Object.freeze(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']);
const FRAMES_ASCII = Object.freeze(['\\', '|', '/', '-']);
const INTERVAL_UTF8_MS = 80;
const INTERVAL_ASCII_MS = 100;
const CLEAR_LINE = '\r\x1b[K';

function isUtf8Locale(env = process.env, platform = process.platform) {
  if (env.MARKOS_FORCE_ASCII === '1' || env.MARKOS_CODEPAGE === '437') {
    return false;
  }

  const sample = env.LC_ALL || env.LANG || '';
  if (!sample) {
    return platform !== 'win32' || env.WT_SESSION != null || env.TERM_PROGRAM != null;
  }

  return /UTF-?8/i.test(sample);
}

function createSpinner({ label = '', stream = 'stderr', opts = {} } = {}) {
  const out = stream === 'stdout' ? process.stdout : process.stderr;
  const utf8 = isUtf8Locale();
  const frames = utf8 ? FRAMES_UTF8 : FRAMES_ASCII;
  const intervalMs = utf8 ? INTERVAL_UTF8_MS : INTERVAL_ASCII_MS;
  const suppress = !out.isTTY || shouldUseJson(opts) || !shouldUseColor(opts);

  let index = 0;
  let timer = null;

  function render() {
    if (suppress) {
      return;
    }
    out.write(`${CLEAR_LINE}${frames[index % frames.length]} ${label}`);
    index += 1;
  }

  function tick() {
    render();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (!suppress) {
      out.write(CLEAR_LINE);
    }
  }

  if (!suppress) {
    render();
    timer = setInterval(render, intervalMs);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  return { tick, stop };
}

module.exports = {
  CLEAR_LINE,
  FRAMES_UTF8,
  FRAMES_ASCII,
  createSpinner,
  isUtf8Locale,
};
